import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { getEffectiveModes } from '../lib/settings';
import { isValidLocation } from '../lib/locations';
import { canTransition, isKnownStatus, newBookingId } from '../lib/bookingStatus';
import { validatePromo, redeemPromo, PromoResult } from '../lib/promo';
import { memoryUpload, storeUpload, deleteUpload } from '../lib/r2';
import { adminAlert, emailUser, lead, infoTable, pRow } from '../lib/notify';

const upload = memoryUpload();

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

// Human labels + email body for booking events.
const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review', awaiting_worker: 'Waiting for the professional',
  accepted: 'Accepted', declined: 'Declined', quote_sent: 'Quote sent',
  quote_approved: 'Quote approved', in_progress: 'In progress', completed: 'Completed',
  cancelled: 'Cancelled',
};
function bookingRows(b: any): string {
  return infoTable([
    pRow('Booking', b.id),
    pRow('Client', `${b.clientName} · ${b.clientPhone}`),
    pRow('Service', b.serviceCategory),
    pRow('Location', [b.clientCommune, b.clientWilaya].filter(Boolean).join(', ')),
    pRow('Date', b.bookingDate),
    pRow('Quote', b.workerQuote != null ? `${b.workerQuote} DZD` : b.price),
    pRow('Description', b.description),
  ]);
}

// Is the requester the worker assigned to this professional record?
async function isOwnProfessional(userId: string, professionalId: string): Promise<boolean> {
  const pro = await prisma.professional.findUnique({ where: { id: professionalId } });
  return !!pro && pro.userId === userId;
}

// GET all bookings (admin only — contains client PII)
router.get('/', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { statusHistory: true, worker: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single booking (admin, the booking's worker, or the booking's client)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { statusHistory: true, worker: true, conversation: true },
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const allowed =
      user.role === 'ADMIN' ||
      booking.clientId === user.userId ||
      booking.worker.userId === user.userId;
    if (!allowed) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET bookings for a specific worker (admin or that worker)
router.get('/worker/:workerId', authenticateToken, async (req: Request, res: Response) => {
  const workerId = req.params.workerId as string;
  const user = getUser(req);
  try {
    if (user.role !== 'ADMIN' && !(await isOwnProfessional(user.userId, workerId))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const bookings = await prisma.booking.findMany({
      where: { workerId },
      include: { statusHistory: true, conversation: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET bookings for a client by phone (admin, or the user owning that phone)
router.get('/client/:phone', authenticateToken, async (req: Request, res: Response) => {
  const phone = req.params.phone as string;
  const user = getUser(req);
  try {
    if (user.role !== 'ADMIN') {
      const me = await prisma.user.findUnique({ where: { id: user.userId } });
      if (!me || me.phone !== phone) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
    }
    const bookings = await prisma.booking.findMany({
      where: { clientPhone: phone },
      include: { statusHistory: true, worker: true, conversation: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create booking (client chooses a worker; with client photo uploads)
router.post('/', authenticateToken, requireRole('ADMIN', 'CLIENT'), upload.array('photos', 10), async (req: Request, res: Response) => {
  const {
    id, clientName, clientPhone, clientAddress, clientWilaya, clientCommune,
    clientLat, clientLng, serviceCategory, workerId, price, description, bookingDate,
  } = req.body;

  if (!clientName || !clientPhone || !serviceCategory || !workerId || !description || !bookingDate) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!clientWilaya || !isValidLocation(clientWilaya as string, (clientCommune as string) || null)) {
    res.status(400).json({ error: 'A valid client location (wilaya/commune) is required' });
    return;
  }

  const files = req.files as Express.Multer.File[];
  const photoPaths = files && files.length > 0
    ? await Promise.all(files.map(f => storeUpload(f, 'bookings')))
    : [];
  const user = getUser(req);

  try {
    const worker = await prisma.professional.findUnique({ where: { id: workerId as string } });
    if (!worker) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }
    const modes = await getEffectiveModes(worker);
    const isDirect = modes.mediationMode === 'DIRECT';
    const initialStatus = isDirect ? 'awaiting_worker' : 'pending_review';

    const bookingId = (id as string) || newBookingId();
    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        clientId: user.role === 'CLIENT' ? user.userId : null,
        clientName: clientName as string,
        clientPhone: clientPhone as string,
        clientAddress: (clientAddress as string) || '',
        clientWilaya: clientWilaya as string,
        clientCommune: (clientCommune as string) || null,
        clientLat: clientLat ? parseFloat(clientLat) : null,
        clientLng: clientLng ? parseFloat(clientLng) : null,
        serviceCategory: serviceCategory as string,
        workerId: workerId as string,
        status: initialStatus,
        price: (price as string) || 'Contact for Quote',
        description: description as string,
        time: 'Just now',
        bookingDate: bookingDate as string,
        clientPhotos: photoPaths,
        quoteStatus: 'none',
        mediationModeSnapshot: modes.mediationMode,
        statusHistory: {
          create: { status: initialStatus, timestamp: new Date().toISOString() },
        },
        // Direct mode: open the worker↔client chat right away
        ...(isDirect && { conversation: { create: {} } }),
      },
      include: { statusHistory: true, conversation: true },
    });

    await prisma.category.updateMany({
      where: { name: serviceCategory as string },
      data: { bookings: { increment: 1 } },
    });

    // New service booking → email every admin (and the worker if they have an account).
    void adminAlert({ title: `🔧 New booking — ${serviceCategory}`, body: `${clientName} · ${clientWilaya}`, type: 'booking', vertical: 'services', event: 'new', refId: booking.id, link: '/services/bookings', emailHtml: lead('A new service booking was placed.') + bookingRows(booking) });
    void emailUser(worker.userId, `New booking assigned to you — ${serviceCategory}`, lead('A client requested your service.') + bookingRows(booking));

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update booking (admin — status, quote, time, etc.)
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if (data.status && !isKnownStatus(data.status as string)) {
      res.status(400).json({ error: `Unknown status "${data.status}"` });
      return;
    }

    const statusChanged = data.status && data.status !== existing.status;
    const ops: any[] = [];
    if (statusChanged) {
      ops.push(prisma.statusHistory.create({
        data: { bookingId: id, status: data.status as string, timestamp: new Date().toISOString() },
      }));
    }
    ops.push(prisma.booking.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status as string }),
          ...(data.price !== undefined && { price: data.price as string }),
          ...(data.bookingTime !== undefined && { bookingTime: data.bookingTime as string }),
          ...(data.workerQuote !== undefined && { workerQuote: data.workerQuote ? parseInt(data.workerQuote) : null }),
          ...(data.quoteStatus !== undefined && { quoteStatus: data.quoteStatus as string }),
          ...(data.clientPhotos !== undefined && { clientPhotos: data.clientPhotos as string[] }),
          ...(data.workerId !== undefined && { workerId: data.workerId as string }),
          ...(data.description !== undefined && { description: data.description as string }),
          ...(data.clientWilaya !== undefined && { clientWilaya: data.clientWilaya as string }),
          ...(data.clientCommune !== undefined && { clientCommune: data.clientCommune as string }),
          ...(data.clientAddress !== undefined && { clientAddress: data.clientAddress as string }),
        },
        include: { statusHistory: true, worker: true, conversation: true },
      }));
    const results = await prisma.$transaction(ops);
    res.json(results[results.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update just status (admin, or the booking's worker following the state machine)
router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const user = getUser(req);
  try {
    const existing = await prisma.booking.findUnique({ where: { id }, include: { worker: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    const isBookingWorker = existing.worker.userId === user.userId;
    if (!isAdmin && !isBookingWorker) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!canTransition(existing.status, status as string, isAdmin)) {
      res.status(400).json({ error: `Cannot change status from "${existing.status}" to "${status}"` });
      return;
    }
    const [, booking] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { bookingId: id, status: status as string, timestamp: new Date().toISOString() },
      }),
      prisma.booking.update({
        where: { id },
        data: { status: status as string },
        include: { statusHistory: true },
      }),
    ]);
    const label = BOOKING_STATUS_LABEL[status as string] || (status as string);
    const bodyRows = lead(`Booking status is now: <b>${label}</b>.`) + bookingRows({ ...existing, status });
    void emailUser(existing.clientId, `Your booking ${id}: ${label}`, bodyRows);
    void adminAlert({ title: `Booking ${id} → ${label}`, body: existing.clientName, type: 'booking', vertical: 'services', event: status as string, refId: id, link: '/services/bookings', emailHtml: bodyRows });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT send a quote — admin (mediated flow) or the booking's worker (direct flow)
router.put('/:id/quote', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { workerQuote, bookingTime } = req.body;
  const user = getUser(req);

  if (!workerQuote || isNaN(parseInt(workerQuote))) {
    res.status(400).json({ error: 'A numeric workerQuote is required' });
    return;
  }

  try {
    const existing = await prisma.booking.findUnique({ where: { id }, include: { worker: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    const isBookingWorker = existing.worker.userId === user.userId;
    if (!isAdmin && !isBookingWorker) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!isAdmin && existing.mediationModeSnapshot !== 'DIRECT') {
      res.status(403).json({ error: 'This booking is admin-mediated; the admin sends quotes' });
      return;
    }
    if (!canTransition(existing.status, 'quote_sent', isAdmin)) {
      res.status(400).json({ error: `Cannot send a quote while status is "${existing.status}"` });
      return;
    }

    const [, booking] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { bookingId: id, status: 'quote_sent', timestamp: new Date().toISOString() },
      }),
      prisma.booking.update({
        where: { id },
        data: {
          workerQuote: parseInt(workerQuote),
          quoteStatus: 'sent',
          status: 'quote_sent',
          ...(bookingTime !== undefined && { bookingTime: bookingTime as string }),
        },
        include: { statusHistory: true, worker: true },
      }),
    ]);
    void emailUser(existing.clientId, `You received a quote for booking ${id}`, lead(`Your professional sent a quote of <b>${parseInt(workerQuote)} DZD</b>${bookingTime ? ` for ${bookingTime}` : ''}. Open the app to approve it.`) + bookingRows(booking));
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT accept / decline an incoming order — the booking's worker, direct mode
async function workerAcceptDecline(req: Request, res: Response, target: 'accepted' | 'declined') {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const existing = await prisma.booking.findUnique({ where: { id }, include: { worker: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && existing.worker.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!canTransition(existing.status, target, isAdmin)) {
      res.status(400).json({ error: `Cannot ${target === 'accepted' ? 'accept' : 'decline'} while status is "${existing.status}"` });
      return;
    }
    const [, booking] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { bookingId: id, status: target, timestamp: new Date().toISOString() },
      }),
      prisma.booking.update({
        where: { id },
        data: { status: target },
        include: { statusHistory: true, worker: true },
      }),
    ]);
    const msg = target === 'accepted' ? 'accepted your request and will be in touch' : 'is unable to take this request';
    void emailUser(existing.clientId, `Your booking ${id} was ${target}`, lead(`The professional ${msg}.`) + bookingRows(booking));
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.put('/:id/accept', authenticateToken, (req, res) => workerAcceptDecline(req, res, 'accepted'));
router.put('/:id/decline', authenticateToken, (req, res) => workerAcceptDecline(req, res, 'declined'));

// PUT complete a booking — freezes the money snapshot (commission or subscription)
router.put('/:id/complete', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { finalPrice, promoCode } = req.body;
  const user = getUser(req);

  try {
    const existing = await prisma.booking.findUnique({ where: { id }, include: { worker: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && existing.worker.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!canTransition(existing.status, 'completed', isAdmin)) {
      res.status(400).json({ error: `Cannot complete while status is "${existing.status}"` });
      return;
    }

    const grossPrice = finalPrice !== undefined && finalPrice !== null && `${finalPrice}` !== ''
      ? parseInt(finalPrice)
      : existing.workerQuote ?? 0;

    // Optional promo code discounts what the client pays (validated against the job price)
    let promoDiscount = 0;
    let promoValidation: PromoResult | null = null;
    const code = promoCode || existing.promoCodeId ? promoCode : null;
    if (code) {
      promoValidation = await validatePromo({
        code: code as string, vertical: 'booking', amount: grossPrice,
        userId: existing.clientId, clientPhone: existing.clientPhone,
      });
      if (!promoValidation.valid) {
        res.status(400).json({ error: promoValidation.error || 'Invalid promo code' });
        return;
      }
      promoDiscount = promoValidation.discount;
    }
    const price = grossPrice - promoDiscount;

    const modes = await getEffectiveModes(existing.worker);
    const commissionAmount = modes.commissionMode === 'PERCENTAGE'
      ? Math.round((price * modes.commissionPercent) / 100)
      : 0;

    const [, , booking] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { bookingId: id, status: 'completed', timestamp: new Date().toISOString() },
      }),
      prisma.professional.update({
        where: { id: existing.workerId },
        data: { jobs: { increment: 1 } },
      }),
      prisma.booking.update({
        where: { id },
        data: {
          status: 'completed',
          finalPrice: price,
          promoDiscount,
          promoCodeId: promoValidation?.promo?.id ?? null,
          commissionModeSnapshot: modes.commissionMode,
          commissionPercentSnapshot: modes.commissionMode === 'PERCENTAGE' ? modes.commissionPercent : null,
          commissionAmount,
          ...(price > 0 && { price: `${price.toLocaleString('en-US')} DZD` }),
        },
        include: { statusHistory: true, worker: true },
      }),
    ]);

    if (promoValidation?.valid && promoValidation.promo) {
      await redeemPromo({
        promoId: promoValidation.promo.id, vertical: 'booking', refId: id,
        discount: promoDiscount, userId: existing.clientId, clientPhone: existing.clientPhone,
      });
    }

    void emailUser(existing.clientId, `Your booking ${id} is completed ✅`, lead('Your service is complete. Thank you for using Rafik!') + bookingRows(booking));
    void adminAlert({ title: `Booking ${id} completed`, body: existing.clientName, type: 'booking', vertical: 'services', event: 'completed', refId: id, link: '/services/bookings', emailHtml: lead('A service booking was completed.') + bookingRows(booking) });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE booking (admin)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Delete booking photos (R2 or local)
    if (booking.clientPhotos && booking.clientPhotos.length > 0) {
      for (const imgPath of booking.clientPhotos) {
        await deleteUpload(imgPath);
      }
    }

    await prisma.statusHistory.deleteMany({ where: { bookingId: id } });
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
