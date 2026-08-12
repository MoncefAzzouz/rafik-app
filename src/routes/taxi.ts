import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { getPlatformSettings } from '../lib/settings';
import {
  canRideTransition, nextRideNumber, haversineKm, estimateFare,
  computeCommission, runFraudDetection, CANCELLED_STATUSES, RIDE_STATUSES,
} from '../lib/taxi';
import { validatePromo, redeemPromo, PromoResult } from '../lib/promo';
import { adminAlert, emailUser, lead, infoTable, pRow } from '../lib/notify';

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const rideInclude = {
  driver: { select: { id: true, name: true, phone: true, vehicleType: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, rating: true, status: true, profileImage: true } },
};

const RIDE_STATUS_LABEL: Record<string, string> = {
  requested: 'Requested', accepted: 'Driver assigned', driver_arrived: 'Driver arrived',
  in_ride: 'In ride', completed: 'Completed',
  cancelled_by_client: 'Cancelled by client', cancelled_by_driver: 'Cancelled by driver', cancelled_by_admin: 'Cancelled by admin',
};
function taxiRideRows(r: any): string {
  return infoTable([
    pRow('Ride', r.rideNumber),
    pRow('Client', `${r.clientName} · ${r.clientPhone}`),
    pRow('From', r.pickupAddress),
    pRow('To', r.destinationAddress),
    pRow('Fare', `${r.agreedFare ?? r.estimatedFare} DZD`),
  ]);
}
// Notify client (email) + admins (bell + email) on a ride state change.
function notifyRideStatus(r: any, status: string) {
  const label = RIDE_STATUS_LABEL[status] || status;
  const html = lead(`Ride status is now: <b>${label}</b>.`) + taxiRideRows(r);
  void emailUser(r.clientId, `Your ride ${r.rideNumber}: ${label}`, html);
  void adminAlert({ title: `Ride ${r.rideNumber} → ${label}`, body: r.clientName, type: 'taxi_ride', vertical: 'taxi', event: status, refId: r.id, link: '/taxi/rides', emailHtml: html });
}

async function getOwnDriver(userId: string) {
  return prisma.driver.findUnique({ where: { userId } });
}

// Is the requester allowed to act on this ride as its driver?
async function isRideDriver(req: Request, ride: { driverId: string | null }): Promise<boolean> {
  const user = getUser(req);
  if (user.role !== 'DRIVER' || !ride.driverId) return false;
  const driver = await getOwnDriver(user.userId);
  return !!driver && driver.id === ride.driverId;
}

// ── GET rides (admin sees all; driver sees own + open requests; client sees own) ──
router.get('/rides', authenticateToken, async (req: Request, res: Response) => {
  const { status, driverId, search } = req.query;
  const user = getUser(req);
  try {
    let scope: any = {};
    if (user.role === 'DRIVER') {
      const driver = await getOwnDriver(user.userId);
      scope = { OR: [{ driverId: driver?.id ?? '—' }, { status: 'requested' }] };
    } else if (user.role === 'CLIENT') {
      scope = { clientId: user.userId };
    } else if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const rides = await prisma.taxiRide.findMany({
      where: {
        ...scope,
        ...(status && { status: status as string }),
        ...(driverId && { driverId: driverId as string }),
        ...(search && {
          OR: [
            { rideNumber: { contains: search as string, mode: 'insensitive' } },
            { clientName: { contains: search as string, mode: 'insensitive' } },
            { clientPhone: { contains: search as string } },
          ],
        }),
      },
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET one ride ──
router.get('/rides/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const ride = await prisma.taxiRide.findUnique({ where: { id }, include: rideInclude });
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    const allowed =
      user.role === 'ADMIN' ||
      ride.clientId === user.userId ||
      (await isRideDriver(req, ride)) ||
      (user.role === 'DRIVER' && ride.status === 'requested');
    if (!allowed) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    res.json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST create ride request (client or admin) — inDrive style: client may propose a price ──
router.post('/rides', authenticateToken, requireRole('ADMIN', 'CLIENT'), async (req: Request, res: Response) => {
  const {
    clientName, clientPhone, pickupAddress, pickupWilaya, pickupCommune,
    pickupLat, pickupLng, destinationAddress, destinationLat, destinationLng,
    distanceKm, promoCode,
  } = req.body;

  if (!clientName || !clientPhone || !pickupAddress || !destinationAddress) {
    res.status(400).json({ error: 'Missing required fields (clientName, clientPhone, pickupAddress, destinationAddress)' });
    return;
  }

  const user = getUser(req);
  try {
    // Distance: given, or computed from coordinates
    let km: number | null = distanceKm !== undefined && distanceKm !== null && `${distanceKm}` !== ''
      ? parseFloat(distanceKm) : null;
    if (km === null && pickupLat != null && pickupLng != null && destinationLat != null && destinationLng != null) {
      km = Math.round(haversineKm(parseFloat(pickupLat), parseFloat(pickupLng), parseFloat(destinationLat), parseFloat(destinationLng)) * 10) / 10;
    }
    // Price is fixed by the admin's formula — the client does NOT negotiate
    const { estimatedFare: fare } = await estimateFare(km);

    // Optional promo code lowers the fixed fare
    let promoDiscount = 0;
    let promoValidation: PromoResult | null = null;
    if (promoCode) {
      promoValidation = await validatePromo({
        code: promoCode as string, vertical: 'taxi', amount: fare,
        userId: user.userId, clientPhone: clientPhone as string,
      });
      if (!promoValidation.valid) {
        res.status(400).json({ error: promoValidation.error || 'Invalid promo code' });
        return;
      }
      promoDiscount = promoValidation.discount;
    }
    const agreedFare = fare - promoDiscount;

    const ride = await prisma.taxiRide.create({
      data: {
        rideNumber: await nextRideNumber(),
        clientId: user.role === 'CLIENT' ? user.userId : null,
        clientName: clientName as string,
        clientPhone: clientPhone as string,
        pickupAddress: pickupAddress as string,
        pickupWilaya: (pickupWilaya as string) || null,
        pickupCommune: (pickupCommune as string) || null,
        pickupLat: pickupLat != null ? parseFloat(pickupLat) : null,
        pickupLng: pickupLng != null ? parseFloat(pickupLng) : null,
        destinationAddress: destinationAddress as string,
        destinationLat: destinationLat != null ? parseFloat(destinationLat) : null,
        destinationLng: destinationLng != null ? parseFloat(destinationLng) : null,
        distanceKm: km,
        estimatedFare: fare,
        promoDiscount,
        promoCodeId: promoValidation?.promo?.id ?? null,
        // Fixed price the client will pay (calculated − promo)
        agreedFare,
        status: 'requested',
      },
      include: rideInclude,
    });

    // Consume the promo now that the ride exists
    if (promoValidation?.valid && promoValidation.promo) {
      await redeemPromo({
        promoId: promoValidation.promo.id, vertical: 'taxi', refId: ride.id,
        discount: promoDiscount, userId: user.userId, clientPhone: clientPhone as string,
      });
    }

    void adminAlert({ title: `🚕 New ride ${ride.rideNumber}`, body: `${ride.clientName} · ${ride.pickupAddress} → ${ride.destinationAddress}`, type: 'taxi_ride', vertical: 'taxi', event: 'new', refId: ride.id, link: '/taxi/rides', emailHtml: lead('A new taxi ride was requested.') + infoTable([
      pRow('Ride', ride.rideNumber),
      pRow('Client', `${ride.clientName} · ${ride.clientPhone}`),
      pRow('From', ride.pickupAddress),
      pRow('To', ride.destinationAddress),
      pRow('Distance', ride.distanceKm != null ? `${ride.distanceKm} km` : null),
      pRow('Fare', `${ride.agreedFare ?? ride.estimatedFare} DZD`),
    ]) });
    res.status(201).json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST dispatch a driver (admin picks a driver; the fare is already fixed by the formula) ──
router.post('/rides/:id/assign', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { driverId } = req.body;
  if (!driverId) {
    res.status(400).json({ error: 'driverId is required' });
    return;
  }
  try {
    const ride = await prisma.taxiRide.findUnique({ where: { id } });
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    if (ride.status !== 'requested') {
      res.status(400).json({ error: `Ride is already "${ride.status}"` });
      return;
    }
    const driver = await prisma.driver.findUnique({ where: { id: driverId as string } });
    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    if (driver.status === 'SUSPENDED' || !driver.isActive) {
      res.status(400).json({ error: 'This driver is suspended or inactive' });
      return;
    }
    // Fare is the calculated price (already net of any promo); no negotiation
    const agreedFare = ride.agreedFare ?? ride.estimatedFare ?? 0;
    const [updated] = await prisma.$transaction([
      prisma.taxiRide.update({
        where: { id },
        data: { status: 'accepted', driverId: driver.id, agreedFare, acceptedAt: new Date() },
        include: rideInclude,
      }),
      prisma.taxiRideOffer.updateMany({ where: { rideId: id, status: 'pending' }, data: { status: 'rejected' } }),
      prisma.driver.update({ where: { id: driver.id }, data: { status: 'BUSY' } }),
    ]);
    notifyRideStatus(updated, 'accepted');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Lifecycle: arrived → in_ride → completed ──
async function rideLifecycle(req: Request, res: Response, target: 'driver_arrived' | 'in_ride') {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const ride = await prisma.taxiRide.findUnique({ where: { id } });
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && !(await isRideDriver(req, ride))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!canRideTransition(ride.status, target, isAdmin)) {
      res.status(400).json({ error: `Cannot go from "${ride.status}" to "${target}"` });
      return;
    }
    const updated = await prisma.taxiRide.update({
      where: { id },
      data: {
        status: target,
        ...(target === 'driver_arrived' && { arrivedAt: new Date() }),
        ...(target === 'in_ride' && { startedAt: new Date() }),
      },
      include: rideInclude,
    });
    notifyRideStatus(updated, target);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.post('/rides/:id/arrived', authenticateToken, (req, res) => rideLifecycle(req, res, 'driver_arrived'));
router.post('/rides/:id/start', authenticateToken, (req, res) => rideLifecycle(req, res, 'in_ride'));

// ── POST complete ride — freezes the money: commission % + driver earnings ──
router.post('/rides/:id/complete', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { finalFare } = req.body;
  const user = getUser(req);
  try {
    const ride = await prisma.taxiRide.findUnique({ where: { id } });
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && !(await isRideDriver(req, ride))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!canRideTransition(ride.status, 'completed', isAdmin)) {
      res.status(400).json({ error: `Cannot complete from "${ride.status}"` });
      return;
    }

    // The fare was fixed by the formula at request time (already net of promo)
    const fare = ride.agreedFare ?? ride.estimatedFare ?? 0;
    const { percent, commissionAmount, driverEarnings } = await computeCommission(fare);

    const ops: any[] = [
      prisma.taxiRide.update({
        where: { id },
        data: {
          status: 'completed',
          agreedFare: fare,
          commissionPercentSnapshot: percent,
          commissionAmount,
          driverEarnings,
          completedAt: new Date(),
        },
        include: rideInclude,
      }),
    ];
    if (ride.driverId) {
      ops.push(prisma.driver.update({
        where: { id: ride.driverId },
        data: { status: 'AVAILABLE', totalDeliveries: { increment: 1 } },
      }));
    }
    const [updated] = await prisma.$transaction(ops);
    notifyRideStatus(updated, 'completed');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST cancel — records who/why/when, then runs the fraud detector ──
router.post('/rides/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const user = getUser(req);
  try {
    const ride = await prisma.taxiRide.findUnique({ where: { id } });
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }

    // Who is cancelling?
    let by: 'CLIENT' | 'DRIVER' | 'ADMIN';
    if (user.role === 'ADMIN') by = 'ADMIN';
    else if (await isRideDriver(req, ride)) by = 'DRIVER';
    else if (ride.clientId === user.userId) by = 'CLIENT';
    else {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const target = by === 'ADMIN' ? 'cancelled_by_admin' : by === 'DRIVER' ? 'cancelled_by_driver' : 'cancelled_by_client';
    if (!canRideTransition(ride.status, target, by === 'ADMIN')) {
      res.status(400).json({ error: `Cannot cancel a ride that is "${ride.status}"` });
      return;
    }

    const ops: any[] = [
      prisma.taxiRide.update({
        where: { id },
        data: {
          status: target,
          cancelledBy: by,
          cancelReason: (reason as string) || null,
          cancelStage: ride.status,
          cancelledAt: new Date(),
        },
        include: rideInclude,
      }),
    ];
    if (ride.driverId) {
      ops.push(prisma.driver.update({
        where: { id: ride.driverId },
        data: {
          status: 'AVAILABLE',
          ...(by === 'DRIVER' && { cancellationCount: { increment: 1 } }),
        },
      }));
    }
    const [updated] = await prisma.$transaction(ops);
    notifyRideStatus(updated, target);

    // 🔍 Anti-scam engine
    const fraud = await runFraudDetection(id);

    res.json({ ...updated, fraud });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET taxi dashboard stats (admin) ──
router.get('/stats', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const [rides, drivers, unresolvedAlerts] = await Promise.all([
      prisma.taxiRide.findMany({ select: { status: true, agreedFare: true, commissionAmount: true, driverEarnings: true, createdAt: true } }),
      prisma.driver.findMany({ where: { service: { in: ['TAXI', 'BOTH'] } }, select: { status: true } }),
      prisma.fraudAlert.count({ where: { isResolved: false } }),
    ]);
    const completed = rides.filter(r => r.status === 'completed');
    const active = rides.filter(r => ['requested', 'accepted', 'driver_arrived', 'in_ride'].includes(r.status));
    const cancelled = rides.filter(r => CANCELLED_STATUSES.includes(r.status));
    res.json({
      totalRides: rides.length,
      activeRides: active.length,
      completedRides: completed.length,
      cancelledRides: cancelled.length,
      cancelRate: rides.length > 0 ? Math.round((cancelled.length / rides.length) * 100) : 0,
      grossFares: completed.reduce((s, r) => s + (r.agreedFare ?? 0), 0),
      commissionRevenue: completed.reduce((s, r) => s + (r.commissionAmount ?? 0), 0),
      driverPayouts: completed.reduce((s, r) => s + (r.driverEarnings ?? 0), 0),
      driversTotal: drivers.length,
      driversAvailable: drivers.filter(d => d.status === 'AVAILABLE').length,
      driversBusy: drivers.filter(d => d.status === 'BUSY').length,
      driversSuspended: drivers.filter(d => d.status === 'SUSPENDED').length,
      unresolvedAlerts,
      statusBreakdown: RIDE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: rides.filter(r => r.status === s).length }), {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET per-driver statistics: cancels, approvals, completion, earnings, fraud flags (admin) ──
router.get('/driver-stats', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { service: { in: ['TAXI', 'BOTH'] } },
      include: {
        taxiRides: { select: { status: true, agreedFare: true, commissionAmount: true, driverEarnings: true, arrivedAt: true } },
        rideOffers: { select: { status: true } },
        fraudAlerts: { where: { isResolved: false }, select: { type: true, severity: true } },
      },
      orderBy: { driverCode: 'asc' },
    });

    res.json(drivers.map(d => {
      const matched = d.taxiRides.length;
      const completed = d.taxiRides.filter(r => r.status === 'completed');
      const cancelledByDriver = d.taxiRides.filter(r => r.status === 'cancelled_by_driver').length;
      const cancelledOnHim = d.taxiRides.filter(r => r.status === 'cancelled_by_client').length;
      const lateCancels = d.taxiRides.filter(r => CANCELLED_STATUSES.includes(r.status) && r.arrivedAt).length;
      const offersMade = d.rideOffers.length;
      const offersAccepted = d.rideOffers.filter(o => o.status === 'accepted').length;
      return {
        id: d.id,
        driverCode: d.driverCode,
        name: d.name,
        phone: d.phone,
        status: d.status,
        service: d.service,
        isVerified: d.isVerified,
        vehicleModel: d.vehicleModel,
        vehicleColor: d.vehicleColor,
        vehiclePlate: d.vehiclePlate,
        rating: d.rating,
        // Approvals / cancels — exactly what the admin asked to see per driver
        offersMade,
        offersAccepted,
        matchedRides: matched,
        completedRides: completed.length,
        cancelledByDriver,
        cancelledByClient: cancelledOnHim,
        lateCancels,
        cancelRate: matched > 0 ? Math.round((cancelledByDriver / matched) * 100) : 0,
        completionRate: matched > 0 ? Math.round((completed.length / matched) * 100) : 0,
        grossFares: completed.reduce((s, r) => s + (r.agreedFare ?? 0), 0),
        commissionPaid: completed.reduce((s, r) => s + (r.commissionAmount ?? 0), 0),
        earnings: completed.reduce((s, r) => s + (r.driverEarnings ?? 0), 0),
        fraudAlerts: d.fraudAlerts,
        fraudFlagged: d.fraudAlerts.length > 0,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Fraud alerts (admin) ──
router.get('/alerts', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { resolved } = req.query;
  try {
    const alerts = await prisma.fraudAlert.findMany({
      where: resolved !== undefined && resolved !== '' ? { isResolved: resolved === 'true' } : undefined,
      include: { driver: { select: { id: true, name: true, driverCode: true, phone: true, status: true } } },
      orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resolve an alert with an action: suspended | warned | dismissed
router.post('/alerts/:id/resolve', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { action } = req.body;
  const user = getUser(req);
  if (!['suspended', 'warned', 'dismissed'].includes(action)) {
    res.status(400).json({ error: 'action must be suspended, warned, or dismissed' });
    return;
  }
  try {
    const alert = await prisma.fraudAlert.findUnique({ where: { id } });
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    if (action === 'suspended' && alert.driverId) {
      await prisma.driver.update({ where: { id: alert.driverId }, data: { status: 'SUSPENDED' } });
    }
    const updated = await prisma.fraudAlert.update({
      where: { id },
      data: { isResolved: true, resolvedBy: user.userId, resolvedAt: new Date(), action },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Taxi money config: base fare / per-km / min fare / commission % (admin) ──
router.get('/config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const s = await getPlatformSettings();
    res.json({
      taxiBaseFare: s.taxiBaseFare,
      taxiPerKm: s.taxiPerKm,
      taxiMinFare: s.taxiMinFare,
      taxiCommissionPercent: s.taxiCommissionPercent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/config', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { taxiBaseFare, taxiPerKm, taxiMinFare, taxiCommissionPercent } = req.body;
  try {
    await getPlatformSettings();
    const s = await prisma.platformSettings.update({
      where: { id: 'global' },
      data: {
        ...(taxiBaseFare !== undefined && { taxiBaseFare: parseInt(taxiBaseFare) }),
        ...(taxiPerKm !== undefined && { taxiPerKm: parseFloat(taxiPerKm) }),
        ...(taxiMinFare !== undefined && { taxiMinFare: parseInt(taxiMinFare) }),
        ...(taxiCommissionPercent !== undefined && { taxiCommissionPercent: parseFloat(taxiCommissionPercent) }),
      },
    });
    res.json({
      taxiBaseFare: s.taxiBaseFare,
      taxiPerKm: s.taxiPerKm,
      taxiMinFare: s.taxiMinFare,
      taxiCommissionPercent: s.taxiCommissionPercent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
