import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { getEffectiveModes } from '../lib/settings';

const router = Router();

interface WorkerEarnings {
  professionalId: string;
  name: string;
  category: string;
  commissionMode: string;
  commissionPercent: number | null;
  subscriptionFee: number | null;
  completedJobs: number;
  gross: number;          // total of completed bookings' final prices
  platformCut: number;    // sum of commissionAmount (0 for subscription workers)
  netPayout: number;      // gross - platformCut (what the worker keeps)
  subscriptionPaid: number; // total subscription payments recorded
}

function dateFilter(from?: string, to?: string) {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };
}

// GET per-worker earnings aggregates (admin)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const range = dateFilter(from, to);
    const professionals = await prisma.professional.findMany({
      include: {
        bookings: {
          where: { status: 'completed', ...(range && { updatedAt: range }) },
        },
        subscriptionPayments: range ? { where: { paidAt: range } } : true,
      },
      orderBy: { name: 'asc' },
    });

    const workers: WorkerEarnings[] = [];
    for (const pro of professionals) {
      const modes = await getEffectiveModes(pro);
      const gross = pro.bookings.reduce((sum, b) => sum + (b.finalPrice ?? b.workerQuote ?? 0), 0);
      const platformCut = pro.bookings.reduce((sum, b) => sum + (b.commissionAmount ?? 0), 0);
      const subscriptionPaid = pro.subscriptionPayments.reduce((sum, p) => sum + p.amount, 0);
      workers.push({
        professionalId: pro.id,
        name: pro.name,
        category: pro.category,
        commissionMode: modes.commissionMode,
        commissionPercent: modes.commissionMode === 'PERCENTAGE' ? modes.commissionPercent : null,
        subscriptionFee: modes.commissionMode === 'SUBSCRIPTION' ? modes.subscriptionFee : null,
        completedJobs: pro.bookings.length,
        gross,
        platformCut,
        netPayout: gross - platformCut,
        subscriptionPaid,
      });
    }

    const totals = {
      gross: workers.reduce((s, w) => s + w.gross, 0),
      commissionRevenue: workers.reduce((s, w) => s + w.platformCut, 0),
      subscriptionRevenue: workers.reduce((s, w) => s + w.subscriptionPaid, 0),
      netWorkerPayouts: workers.reduce((s, w) => s + w.netPayout, 0),
    };

    res.json({
      workers,
      totals: { ...totals, platformRevenue: totals.commissionRevenue + totals.subscriptionRevenue },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET own earnings (worker)
router.get('/me', authenticateToken, requireRole('WORKER'), async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user!;
  try {
    const pro = await prisma.professional.findUnique({
      where: { userId: user.userId },
      include: {
        bookings: { where: { status: 'completed' }, orderBy: { updatedAt: 'desc' } },
        subscriptionPayments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!pro) {
      res.status(404).json({ error: 'No professional record linked to this account' });
      return;
    }
    const modes = await getEffectiveModes(pro);
    const jobs = pro.bookings.map((b) => {
      const price = b.finalPrice ?? b.workerQuote ?? 0;
      const cut = b.commissionAmount ?? 0;
      return {
        bookingId: b.id,
        client: b.clientName,
        category: b.serviceCategory,
        date: b.bookingDate,
        price,
        platformCut: cut,
        net: price - cut,
        commissionMode: b.commissionModeSnapshot,
        commissionPercent: b.commissionPercentSnapshot,
      };
    });
    const gross = jobs.reduce((s, j) => s + j.price, 0);
    const platformCut = jobs.reduce((s, j) => s + j.platformCut, 0);

    res.json({
      commissionMode: modes.commissionMode,
      commissionPercent: modes.commissionMode === 'PERCENTAGE' ? modes.commissionPercent : null,
      subscriptionFee: modes.commissionMode === 'SUBSCRIPTION' ? modes.subscriptionFee : null,
      completedJobs: jobs.length,
      gross,
      platformCut,
      netEarnings: gross - platformCut,
      jobs,
      subscriptionPayments: pro.subscriptionPayments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST record a worker subscription payment (admin)
router.post('/subscription-payments', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { professionalId, amount, periodStart, periodEnd, note } = req.body;
  if (!professionalId || !amount || !periodStart || !periodEnd) {
    res.status(400).json({ error: 'Missing required fields (professionalId, amount, periodStart, periodEnd)' });
    return;
  }
  try {
    const pro = await prisma.professional.findUnique({ where: { id: professionalId as string } });
    if (!pro) {
      res.status(404).json({ error: 'Professional not found' });
      return;
    }
    const payment = await prisma.subscriptionPayment.create({
      data: {
        professionalId: professionalId as string,
        amount: parseInt(amount),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        note: (note as string) || null,
      },
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET subscription payments (admin; optionally filtered by worker)
router.get('/subscription-payments', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { professionalId } = req.query as { professionalId?: string };
  try {
    const payments = await prisma.subscriptionPayment.findMany({
      where: professionalId ? { professionalId } : undefined,
      include: { professional: { select: { name: true, category: true } } },
      orderBy: { paidAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
