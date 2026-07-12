import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// GET all reviews
router.get('/', async (_req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        professional: {
          select: {
            name: true,
            category: true,
          }
        }
      }
    });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET reviews for worker
router.get('/worker/:professionalId', async (req: Request, res: Response) => {
  const professionalId = req.params.professionalId as string;
  try {
    const reviews = await prisma.review.findMany({
      where: { professionalId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add review & update professional average rating
router.post('/', async (req: Request, res: Response) => {
  const { clientName, rating, comment, date, professionalId } = req.body;
  if (!clientName || rating === undefined || !comment || !professionalId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const review = await prisma.review.create({
      data: {
        clientName: clientName as string,
        rating: parseFloat(rating),
        comment: comment as string,
        date: (date as string) || new Date().toLocaleDateString(),
        professionalId: professionalId as string,
      },
    });

    // Recalculate average rating for professional
    const allReviews = await prisma.review.findMany({
      where: { professionalId: professionalId as string },
    });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await prisma.professional.update({
      where: { id: professionalId as string },
      data: { rating: parseFloat(avg.toFixed(1)) },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE review & update average rating
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate average rating for professional
    const allReviews = await prisma.review.findMany({
      where: { professionalId: review.professionalId },
    });
    const avg = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 5.0;

    await prisma.professional.update({
      where: { id: review.professionalId },
      data: { rating: parseFloat(avg.toFixed(1)) },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
