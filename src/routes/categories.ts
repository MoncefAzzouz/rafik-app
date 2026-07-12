import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const CATEGORIES_DIR = path.join(__dirname, '../../uploads/categories');
if (!fs.existsSync(CATEGORIES_DIR)) fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CATEGORIES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `category-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

// GET all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create category (with image upload)
router.post('/', authenticateToken, requireRole('ADMIN'), upload.single('image'), async (req: Request, res: Response) => {
  const name = req.body.name as string | undefined;
  const file = req.file;
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const imagePath = file ? `/uploads/categories/${file.filename}` : '/uploads/categories/default.png';
  try {
    const category = await prisma.category.create({
      data: { name, image: imagePath },
    });
    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Category already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update category (name and/or image)
router.put('/:id', authenticateToken, requireRole('ADMIN'), upload.single('image'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const name = req.body.name as string | undefined;
  const file = req.file;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const oldName = existing.name;
    const newName = name || existing.name;
    const newImage = file ? `/uploads/categories/${file.filename}` : existing.image;

    const updated = await prisma.category.update({
      where: { id },
      data: { name: newName, image: newImage },
    });

    // Cascade name change to professionals and bookings
    if (name && name !== oldName) {
      await prisma.professional.updateMany({
        where: { category: oldName },
        data: { category: newName },
      });
      await prisma.booking.updateMany({
        where: { serviceCategory: oldName },
        data: { serviceCategory: newName },
      });
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE category
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
