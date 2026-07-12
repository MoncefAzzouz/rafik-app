import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const PORTFOLIO_DIR = path.join(__dirname, '../../uploads/professionals');
if (!fs.existsSync(PORTFOLIO_DIR)) fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PORTFOLIO_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

// GET all professionals (with reviews)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const professionals = await prisma.professional.findMany({
      include: { reviews: true },
      orderBy: { name: 'asc' },
    });
    res.json(professionals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single professional
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { reviews: true, bookings: { include: { statusHistory: true } } },
    });
    if (!professional) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create professional (also creates a User with WORKER role)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { id, name, category, phone, verified, rate, experience, bio, availableTimes, email, password } = req.body;

  if (!id || !name || !category || !phone) {
    res.status(400).json({ error: 'Missing required fields (id, name, category, phone)' });
    return;
  }

  try {
    // Create a User account for the worker
    const workerEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@rafik.app`;
    const passwordHash = await bcrypt.hash(password || 'worker123', 10);
    const user = await prisma.user.create({
      data: {
        email: workerEmail,
        phone,
        passwordHash,
        fullName: name,
        role: 'WORKER',
      },
    });

    const professional = await prisma.professional.create({
      data: {
        id: id as string,
        name: name as string,
        category: category as string,
        phone: phone as string,
        verified: !!verified,
        rate: (rate as string) || '',
        experience: (experience as string) || '',
        bio: (bio as string) || '',
        joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        availableTimes: (availableTimes as string[]) || [],
        portfolio: [],
        userId: user.id,
      },
    });

    res.status(201).json(professional);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Professional ID or email/phone already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update professional
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const professional = await prisma.professional.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name as string }),
        ...(data.category !== undefined && { category: data.category as string }),
        ...(data.phone !== undefined && { phone: data.phone as string }),
        ...(data.status !== undefined && { status: data.status as string }),
        ...(data.verified !== undefined && { verified: !!data.verified }),
        ...(data.rate !== undefined && { rate: data.rate as string }),
        ...(data.experience !== undefined && { experience: data.experience as string }),
        ...(data.bio !== undefined && { bio: data.bio as string }),
        ...(data.availableTimes !== undefined && { availableTimes: data.availableTimes as string[] }),
        ...(data.portfolio !== undefined && { portfolio: data.portfolio as string[] }),
        ...(data.jobs !== undefined && { jobs: parseInt(data.jobs) }),
        ...(data.rating !== undefined && { rating: parseFloat(data.rating) }),
      },
      include: { reviews: true },
    });
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update worker status (worker self-service)
router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  if (!['online', 'busy', 'offline'].includes(status)) {
    res.status(400).json({ error: 'Status must be online, busy, or offline' });
    return;
  }
  try {
    const professional = await prisma.professional.update({
      where: { id },
      data: { status: status as string },
    });
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update available times
router.put('/:id/available-times', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { availableTimes } = req.body;
  try {
    const professional = await prisma.professional.update({
      where: { id },
      data: { availableTimes: availableTimes as string[] },
    });
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST upload portfolio images
router.post('/:id/portfolio', authenticateToken, upload.array('images', 10), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No images uploaded' });
    return;
  }
  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    const newPaths = files.map(f => `/uploads/professionals/${f.filename}`);
    const professional = await prisma.professional.update({
      where: { id },
      data: { portfolio: [...existing.portfolio, ...newPaths] },
    });
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE professional
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const pro = await prisma.professional.findUnique({ where: { id } });
    if (!pro) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }

    // Delete related reviews first
    await prisma.review.deleteMany({ where: { professionalId: id } });

    // Delete professional portfolio images from filesystem
    if (pro.portfolio && pro.portfolio.length > 0) {
      for (const imgPath of pro.portfolio) {
        const fullPath = path.join(__dirname, '../../', imgPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    // Delete professional record
    await prisma.professional.delete({ where: { id } });

    // Delete linked user and their profileImage if they exist
    if (pro.userId) {
      const user = await prisma.user.findUnique({ where: { id: pro.userId } });
      if (user && user.profileImage && !user.profileImage.endsWith('default.png')) {
        const fullPath = path.join(__dirname, '../../', user.profileImage);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      await prisma.user.delete({ where: { id: pro.userId } }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
