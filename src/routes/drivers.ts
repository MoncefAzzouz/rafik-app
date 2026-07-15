import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { nextCode } from '../lib/food';

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const DRIVER_STATUSES = ['AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED'];
const VEHICLE_TYPES = ['MOTORCYCLE', 'BICYCLE', 'SCOOTER', 'CAR'];

async function canManageDriver(req: Request, driverId: string): Promise<boolean> {
  const user = getUser(req);
  if (user.role === 'ADMIN') return true;
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  return !!driver && driver.userId === user.userId;
}

// ── GET all drivers (auth; filters ?status=&verified=&wilaya=&search=) ──
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { status, verified, wilaya, search, service } = req.query;
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(service && { service: { in: [service as any, 'BOTH'] } }),
        ...(verified !== undefined && verified !== '' && { isVerified: verified === 'true' }),
        ...(wilaya && { wilaya: wilaya as string }),
        ...(search && { name: { contains: search as string, mode: 'insensitive' } }),
      },
      include: {
        _count: { select: { orders: true } },
        orders: { where: { status: { in: ['assigned', 'arrived', 'delivering'] } }, select: { id: true } },
      },
      orderBy: { driverCode: 'asc' },
    });
    res.json(drivers.map(d => ({ ...d, activeOrdersCount: d.orders.length, orders: undefined })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET own driver record ──
router.get('/me', authenticateToken, requireRole('DRIVER'), async (req: Request, res: Response) => {
  const user = getUser(req);
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: user.userId },
      include: { orders: { where: { status: { in: ['assigned', 'arrived', 'delivering'] } }, include: { restaurant: { select: { name: true, address: true } } } } },
    });
    if (!driver) {
      res.status(404).json({ error: 'No driver record linked to this account' });
      return;
    }
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST create driver (admin) — also creates a DRIVER user account ──
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, phone, email, vehicleType, vehiclePlate, vehicleModel, vehicleColor, licenseNumber, wilaya, commune, password, isVerified, service } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Missing required fields (name, phone)' });
    return;
  }
  if (vehicleType && !VEHICLE_TYPES.includes(vehicleType)) {
    res.status(400).json({ error: `vehicleType must be one of ${VEHICLE_TYPES.join(', ')}` });
    return;
  }
  try {
    const driverCode = await nextCode('DRV');
    const driverEmail = (email as string) || `${driverCode.toLowerCase()}@rafik.app`;
    const passwordHash = await bcrypt.hash((password as string) || 'driver123', 10);
    const user = await prisma.user.create({
      data: { email: driverEmail, phone: phone as string, passwordHash, fullName: name as string, role: 'DRIVER' },
    });
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        driverCode,
        name: name as string,
        phone: phone as string,
        email: driverEmail,
        vehicleType: (vehicleType as any) || 'MOTORCYCLE',
        vehiclePlate: (vehiclePlate as string) || null,
        vehicleModel: (vehicleModel as string) || null,
        vehicleColor: (vehicleColor as string) || null,
        licenseNumber: (licenseNumber as string) || null,
        service: ['FOOD', 'TAXI', 'BOTH'].includes(service) ? (service as any) : 'FOOD',
        wilaya: (wilaya as string) || null,
        commune: (commune as string) || null,
        isVerified: !!isVerified,
      },
    });
    res.status(201).json(driver);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Email or phone already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT update driver (admin, or the driver themself for limited fields) ──
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  const user = getUser(req);
  try {
    if (!(await canManageDriver(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (data.vehicleType && !VEHICLE_TYPES.includes(data.vehicleType)) {
      res.status(400).json({ error: `vehicleType must be one of ${VEHICLE_TYPES.join(', ')}` });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.vehicleType !== undefined && { vehicleType: data.vehicleType }),
        ...(data.vehiclePlate !== undefined && { vehiclePlate: data.vehiclePlate }),
        ...(data.vehicleModel !== undefined && { vehicleModel: data.vehicleModel }),
        ...(data.vehicleColor !== undefined && { vehicleColor: data.vehicleColor }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.wilaya !== undefined && { wilaya: data.wilaya }),
        ...(data.commune !== undefined && { commune: data.commune }),
        ...(data.lat !== undefined && { lat: data.lat === null ? null : parseFloat(data.lat) }),
        ...(data.lng !== undefined && { lng: data.lng === null ? null : parseFloat(data.lng) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        // Admin-only fields
        ...(isAdmin && data.service !== undefined && ['FOOD', 'TAXI', 'BOTH'].includes(data.service) && { service: data.service }),
        ...(isAdmin && data.isVerified !== undefined && { isVerified: !!data.isVerified }),
        ...(isAdmin && data.isActive !== undefined && { isActive: !!data.isActive }),
        ...(isAdmin && data.maxOrdersCapacity !== undefined && { maxOrdersCapacity: parseInt(data.maxOrdersCapacity) }),
        ...(isAdmin && data.rating !== undefined && { rating: parseFloat(data.rating) }),
      },
    });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH duty status (driver self-service or admin; SUSPENDED only by admin) ──
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const user = getUser(req);
  if (!DRIVER_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of ${DRIVER_STATUSES.join(', ')}` });
    return;
  }
  try {
    if (!(await canManageDriver(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (status === 'SUSPENDED' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only an admin can suspend a driver' });
      return;
    }
    const existing = await prisma.driver.findUnique({ where: { id } });
    if (existing?.status === 'SUSPENDED' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Driver is suspended; contact the admin' });
      return;
    }
    const driver = await prisma.driver.update({ where: { id }, data: { status } });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST reset cancellation counter (admin) ──
router.post('/:id/reset-cancellations', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id as string },
      data: { cancellationCount: 0 },
    });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE driver (admin) ──
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    const activeOrders = await prisma.foodOrder.count({ where: { driverId: id, status: { in: ['assigned', 'arrived', 'delivering'] } } });
    if (activeOrders > 0) {
      res.status(409).json({ error: 'Driver has active deliveries; reassign them first' });
      return;
    }
    await prisma.foodOrder.updateMany({ where: { driverId: id }, data: { driverId: null } });
    await prisma.driver.delete({ where: { id } });
    if (driver.userId) {
      await prisma.user.delete({ where: { id: driver.userId } }).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
