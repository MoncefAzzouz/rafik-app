import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { getEffectiveModes } from '../lib/settings';
import { isValidLocation } from '../lib/locations';
import { memoryUpload, storeUpload, deleteUpload } from '../lib/r2';

const upload = memoryUpload();
const uploadProfile = memoryUpload();

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const MEDIATION_MODES = ['MEDIATED', 'DIRECT'];
const COMMISSION_MODES = ['PERCENTAGE', 'SUBSCRIPTION'];

// GET all professionals (public — powers "choose a worker" lists)
// Filters: ?category=&wilaya=&commune=&status=
router.get('/', async (req: Request, res: Response) => {
  const { category, wilaya, commune, status } = req.query;
  try {
    const professionals = await prisma.professional.findMany({
      where: {
        ...(category && { category: category as string }),
        ...(wilaya && { wilaya: wilaya as string }),
        ...(commune && { commune: commune as string }),
        ...(status && { status: status as string }),
      },
      include: { reviews: true, portfolioPosts: { orderBy: { createdAt: 'desc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(professionals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET own professional record (worker self-service)
router.get('/me', authenticateToken, requireRole('WORKER'), async (req: Request, res: Response) => {
  const user = getUser(req);
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: user.userId },
      include: { reviews: true, portfolioPosts: { orderBy: { createdAt: 'desc' } }, bookings: { include: { statusHistory: true, conversation: true } } },
    });
    if (!professional) {
      res.status(404).json({ error: 'No professional record linked to this account' });
      return;
    }
    const effectiveModes = await getEffectiveModes(professional);
    res.json({ ...professional, effectiveModes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single professional (public)
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { reviews: true, portfolioPosts: { orderBy: { createdAt: 'desc' } }, bookings: { include: { statusHistory: true } } },
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

// GET resolved modes for one worker (override ?? global)
router.get('/:id/effective-modes', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const professional = await prisma.professional.findUnique({ where: { id } });
    if (!professional) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    const modes = await getEffectiveModes(professional);
    res.json({
      ...modes,
      overrides: {
        mediationModeOverride: professional.mediationModeOverride,
        commissionModeOverride: professional.commissionModeOverride,
        commissionPercentOverride: professional.commissionPercentOverride,
        subscriptionFeeOverride: professional.subscriptionFeeOverride,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create professional (also creates a User with WORKER role)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { id, name, category, phone, verified, rate, experience, bio, availableTimes, email, password, wilaya, commune, address } = req.body;

  if (!id || !name || !category || !phone) {
    res.status(400).json({ error: 'Missing required fields (id, name, category, phone)' });
    return;
  }
  if (wilaya && !isValidLocation(wilaya as string, (commune as string) || null)) {
    res.status(400).json({ error: 'Invalid wilaya/commune' });
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
        wilaya: (wilaya as string) || null,
        commune: (commune as string) || null,
        address: (address as string) || null,
        userId: user.id,
      },
    });

    await prisma.category.updateMany({
      where: { name: category as string },
      data: { pros: { increment: 1 } },
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

// PUT set per-worker mode/commission overrides (null = follow global)
router.put('/:id/overrides', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { mediationModeOverride, commissionModeOverride, commissionPercentOverride, subscriptionFeeOverride } = req.body;

  if (mediationModeOverride != null && !MEDIATION_MODES.includes(mediationModeOverride)) {
    res.status(400).json({ error: 'mediationModeOverride must be MEDIATED, DIRECT, or null' });
    return;
  }
  if (commissionModeOverride != null && !COMMISSION_MODES.includes(commissionModeOverride)) {
    res.status(400).json({ error: 'commissionModeOverride must be PERCENTAGE, SUBSCRIPTION, or null' });
    return;
  }

  try {
    const professional = await prisma.professional.update({
      where: { id },
      data: {
        ...(mediationModeOverride !== undefined && { mediationModeOverride }),
        ...(commissionModeOverride !== undefined && { commissionModeOverride }),
        ...(commissionPercentOverride !== undefined && {
          commissionPercentOverride: commissionPercentOverride === null ? null : parseFloat(commissionPercentOverride),
        }),
        ...(subscriptionFeeOverride !== undefined && {
          subscriptionFeeOverride: subscriptionFeeOverride === null ? null : parseInt(subscriptionFeeOverride),
        }),
      },
    });
    const effectiveModes = await getEffectiveModes(professional);
    res.json({ ...professional, effectiveModes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update professional (admin, or the worker who owns the record)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  const user = getUser(req);

  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (data.wilaya && !isValidLocation(data.wilaya as string, (data.commune as string) || null)) {
      res.status(400).json({ error: 'Invalid wilaya/commune' });
      return;
    }

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name as string }),
        ...(data.category !== undefined && { category: data.category as string }),
        ...(data.phone !== undefined && { phone: data.phone as string }),
        ...(data.status !== undefined && { status: data.status as string }),
        ...(data.rate !== undefined && { rate: data.rate as string }),
        ...(data.experience !== undefined && { experience: data.experience as string }),
        ...(data.bio !== undefined && { bio: data.bio as string }),
        ...(data.availableTimes !== undefined && { availableTimes: data.availableTimes as string[] }),
        ...(data.portfolio !== undefined && { portfolio: data.portfolio as string[] }),
        ...(data.profileImage !== undefined && { profileImage: (data.profileImage as string) || null }),
        ...(data.wilaya !== undefined && { wilaya: (data.wilaya as string) || null }),
        ...(data.commune !== undefined && { commune: (data.commune as string) || null }),
        ...(data.address !== undefined && { address: (data.address as string) || null }),
        ...(data.lat !== undefined && { lat: data.lat === null ? null : parseFloat(data.lat) }),
        ...(data.lng !== undefined && { lng: data.lng === null ? null : parseFloat(data.lng) }),
        // Only admins may touch trust/metric fields
        ...(isAdmin && data.verified !== undefined && { verified: !!data.verified }),
        ...(isAdmin && data.jobs !== undefined && { jobs: parseInt(data.jobs) }),
        ...(isAdmin && data.rating !== undefined && { rating: parseFloat(data.rating) }),
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
  const user = getUser(req);
  if (!['online', 'busy', 'offline'].includes(status)) {
    res.status(400).json({ error: 'Status must be online, busy, or offline' });
    return;
  }
  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
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

// PUT update available times (admin or owner)
router.put('/:id/available-times', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { availableTimes } = req.body;
  const user = getUser(req);
  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
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

// POST upload / replace profile picture (admin or owner)
router.post('/:id/profile-image', authenticateToken, uploadProfile.single('image'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded (images only, max 5MB)' });
    return;
  }
  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const newImage = await storeUpload(req.file, 'profiles');

    // Remove the previous avatar (R2 or local)
    await deleteUpload(existing.profileImage);

    const professional = await prisma.professional.update({
      where: { id },
      data: { profileImage: newImage },
    });
    // Keep the linked user account's avatar in sync
    if (existing.userId) {
      await prisma.user.update({ where: { id: existing.userId }, data: { profileImage: newImage } }).catch(() => {});
    }
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST publish portfolio posts (admin or owner) — each image becomes a post with an optional caption
router.post('/:id/portfolio', authenticateToken, upload.array('images', 10), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  const files = req.files as Express.Multer.File[];
  const caption = (req.body?.caption as string) || null;
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
    if (user.role !== 'ADMIN' && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const images = await Promise.all(files.map(f => storeUpload(f, 'professionals')));
    await prisma.portfolioPost.createMany({
      data: images.map(image => ({ professionalId: id, image, caption })),
    });
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { reviews: true, portfolioPosts: { orderBy: { createdAt: 'desc' } } },
    });
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a portfolio post (admin or owner)
router.delete('/:id/portfolio/:postId', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const postId = req.params.postId as string;
  const user = getUser(req);
  try {
    const existing = await prisma.professional.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const post = await prisma.portfolioPost.findUnique({ where: { id: postId } });
    if (!post || post.professionalId !== id) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    await deleteUpload(post.image);
    await prisma.portfolioPost.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE professional (admin)
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

    // Delete portfolio post images (rows cascade with the professional)
    const posts = await prisma.portfolioPost.findMany({ where: { professionalId: id } });
    for (const post of posts) {
      await deleteUpload(post.image);
    }

    // Delete legacy flat portfolio images
    if (pro.portfolio && pro.portfolio.length > 0) {
      for (const imgPath of pro.portfolio) {
        await deleteUpload(imgPath);
      }
    }

    // Delete professional record
    await prisma.professional.delete({ where: { id } });

    await prisma.category.updateMany({
      where: { name: pro.category, pros: { gt: 0 } },
      data: { pros: { decrement: 1 } },
    });

    // Delete linked user and their profileImage if they exist
    if (pro.userId) {
      const user = await prisma.user.findUnique({ where: { id: pro.userId } });
      if (user && user.profileImage && !user.profileImage.endsWith('default.png')) {
        await deleteUpload(user.profileImage);
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
