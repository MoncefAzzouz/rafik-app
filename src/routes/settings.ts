import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { getPlatformSettings } from '../lib/settings';
import { WILAYAS } from '../lib/locations';

const router = Router();

const MEDIATION_MODES = ['MEDIATED', 'DIRECT'];
const COMMISSION_MODES = ['PERCENTAGE', 'SUBSCRIPTION'];

// GET global platform settings (any authenticated user — workers need their effective mode)
router.get('/', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const settings = await getPlatformSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET supported locations (public — used by booking forms and the mobile app)
router.get('/locations', (_req: Request, res: Response) => {
  res.json(WILAYAS);
});

// PUT update global platform settings (admin)
router.put('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { mediationMode, commissionMode, commissionPercent, subscriptionFee } = req.body;

  if (mediationMode !== undefined && !MEDIATION_MODES.includes(mediationMode)) {
    res.status(400).json({ error: 'mediationMode must be MEDIATED or DIRECT' });
    return;
  }
  if (commissionMode !== undefined && !COMMISSION_MODES.includes(commissionMode)) {
    res.status(400).json({ error: 'commissionMode must be PERCENTAGE or SUBSCRIPTION' });
    return;
  }
  if (commissionPercent !== undefined && (isNaN(parseFloat(commissionPercent)) || parseFloat(commissionPercent) < 0 || parseFloat(commissionPercent) > 100)) {
    res.status(400).json({ error: 'commissionPercent must be between 0 and 100' });
    return;
  }
  if (subscriptionFee !== undefined && (isNaN(parseInt(subscriptionFee)) || parseInt(subscriptionFee) < 0)) {
    res.status(400).json({ error: 'subscriptionFee must be a positive number (DZD)' });
    return;
  }

  try {
    await getPlatformSettings(); // ensure the singleton row exists
    const settings = await prisma.platformSettings.update({
      where: { id: 'global' },
      data: {
        ...(mediationMode !== undefined && { mediationMode }),
        ...(commissionMode !== undefined && { commissionMode }),
        ...(commissionPercent !== undefined && { commissionPercent: parseFloat(commissionPercent) }),
        ...(subscriptionFee !== undefined && { subscriptionFee: parseInt(subscriptionFee) }),
      },
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
