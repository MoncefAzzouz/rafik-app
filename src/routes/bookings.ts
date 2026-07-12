import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const BOOKINGS_DIR = path.join(__dirname, '../../uploads/bookings');
if (!fs.existsSync(BOOKINGS_DIR)) fs.mkdirSync(BOOKINGS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BOOKINGS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

// GET all bookings (admin)
router.get('/', async (_req: Request, res: Response) => {
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

// GET single booking
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { statusHistory: true, worker: true },
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET bookings for a specific worker
router.get('/worker/:workerId', async (req: Request, res: Response) => {
  const workerId = req.params.workerId as string;
  try {
    const bookings = await prisma.booking.findMany({
      where: { workerId },
      include: { statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET bookings for a client (by phone)
router.get('/client/:phone', async (req: Request, res: Response) => {
  const phone = req.params.phone as string;
  try {
    const bookings = await prisma.booking.findMany({
      where: { clientPhone: phone },
      include: { statusHistory: true, worker: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create booking (with client photo uploads)
router.post('/', upload.array('photos', 10), async (req: Request, res: Response) => {
  const { id, clientName, clientPhone, clientAddress, serviceCategory, workerId, price, description, bookingDate } = req.body;

  if (!clientName || !clientPhone || !serviceCategory || !workerId || !description || !bookingDate) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const files = req.files as Express.Multer.File[];
  const photoPaths = files ? files.map(f => `/uploads/bookings/${f.filename}`) : [];

  try {
    const bookingId = (id as string) || `SV-${Date.now().toString().slice(-4)}`;
    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        clientName: clientName as string,
        clientPhone: clientPhone as string,
        clientAddress: (clientAddress as string) || '',
        serviceCategory: serviceCategory as string,
        workerId: workerId as string,
        status: 'pending_review',
        price: (price as string) || 'Contact for Quote',
        description: description as string,
        time: 'Just now',
        bookingDate: bookingDate as string,
        clientPhotos: photoPaths,
        quoteStatus: 'none',
        statusHistory: {
          create: { status: 'pending_review', timestamp: new Date().toISOString() },
        },
      },
      include: { statusHistory: true },
    });
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update booking (status, quote, time, etc.)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  try {
    // If status is changing, add to status history
    if (data.status) {
      await prisma.statusHistory.create({
        data: {
          bookingId: id,
          status: data.status as string,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const booking = await prisma.booking.update({
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
      },
      include: { statusHistory: true, worker: true },
    });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update just status
router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  try {
    await prisma.statusHistory.create({
      data: { bookingId: id, status: status as string, timestamp: new Date().toISOString() },
    });
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: status as string },
      include: { statusHistory: true },
    });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE booking
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.statusHistory.deleteMany({ where: { bookingId: id } });
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
