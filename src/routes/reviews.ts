import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// Recalculate a professional's average rating inside a transaction
async function recomputeRating(professionalId: string) {
  await prisma.$transaction(async (tx) => {
    const allReviews = await tx.review.findMany({ where: { professionalId } });
    const avg = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 5.0;
    await tx.professional.update({
      where: { id: professionalId },
      data: { rating: parseFloat(avg.toFixed(1)) },
    });
  });
}

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
// Clients may only review workers they have a completed booking with.
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { rating, comment, date, professionalId } = req.body;
  const user = (req as AuthenticatedRequest).user!;
  if (rating === undefined || !comment || !professionalId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const me = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!me) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (user.role !== 'ADMIN') {
      const completedBooking = await prisma.booking.findFirst({
        where: {
          workerId: professionalId as string,
          status: 'completed',
          OR: [{ clientId: user.userId }, { clientPhone: me.phone }],
        },
      });
      if (!completedBooking) {
        res.status(403).json({ error: 'You can only review a worker after a completed booking with them' });
        return;
      }
    }

    // Admin may pass clientName (relaying an offline review); clients always use their own name
    const clientName = user.role === 'ADMIN' && req.body.clientName
      ? (req.body.clientName as string)
      : me.fullName;

    const review = await prisma.review.create({
      data: {
        clientName,
        rating: parseFloat(rating),
        comment: comment as string,
        date: (date as string) || new Date().toLocaleDateString(),
        professionalId: professionalId as string,
      },
    });

    await recomputeRating(professionalId as string);

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
    await recomputeRating(review.professionalId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
