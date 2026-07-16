import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validatePromo, Vertical } from '../lib/promo';

const router = Router();

const SCOPES = ['TAXI', 'FOOD', 'SERVICES', 'ALL'];
const TYPES = ['PERCENTAGE', 'FIXED'];

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

// Compute live status for the admin UI
function statusOf(p: { isActive: boolean; startsAt: Date | null; expiresAt: Date | null; maxUses: number | null; usedCount: number }) {
  const now = new Date();
  if (!p.isActive) return 'inactive';
  if (p.startsAt && now < p.startsAt) return 'scheduled';
  if (p.expiresAt && now > p.expiresAt) return 'expired';
  if (p.maxUses != null && p.usedCount >= p.maxUses) return 'used_up';
  return 'active';
}

// ── GET all promo codes (admin) ──
router.get('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { scope } = req.query;
  try {
    const promos = await prisma.promoCode.findMany({
      where: scope ? { scope: scope as any } : undefined,
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(promos.map(p => ({ ...p, status: statusOf(p), redemptionCount: p._count.redemptions })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST validate a code (any authenticated user; used by order/ride/booking flows) ──
// Body: { code, vertical: "taxi"|"food"|"booking", amount, clientPhone? }
router.post('/validate', authenticateToken, async (req: Request, res: Response) => {
  const { code, vertical, amount, clientPhone } = req.body;
  const user = getUser(req);
  if (!code || !vertical || amount === undefined) {
    res.status(400).json({ error: 'Missing code, vertical, or amount' });
    return;
  }
  if (!['taxi', 'food', 'booking'].includes(vertical)) {
    res.status(400).json({ error: 'vertical must be taxi, food, or booking' });
    return;
  }
  try {
    const result = await validatePromo({
      code, vertical: vertical as Vertical, amount: parseInt(amount),
      userId: user.userId, clientPhone: clientPhone as string | undefined,
    });
    res.json({
      valid: result.valid,
      error: result.error ?? null,
      discount: result.discount,
      finalAmount: result.finalAmount,
      code: result.promo?.code ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST create promo code (admin) ──
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const {
    code, description, scope, discountType, discountValue, maxDiscount,
    minOrderAmount, maxUses, maxUsesPerUser, startsAt, expiresAt, isActive,
  } = req.body;

  if (!code || discountValue === undefined) {
    res.status(400).json({ error: 'code and discountValue are required' });
    return;
  }
  if (scope && !SCOPES.includes(scope)) {
    res.status(400).json({ error: `scope must be one of ${SCOPES.join(', ')}` });
    return;
  }
  if (discountType && !TYPES.includes(discountType)) {
    res.status(400).json({ error: `discountType must be PERCENTAGE or FIXED` });
    return;
  }

  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: (code as string).trim().toUpperCase(),
        description: (description as string) || null,
        scope: (scope as any) || 'ALL',
        discountType: (discountType as any) || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount != null && `${maxDiscount}` !== '' ? parseInt(maxDiscount) : null,
        minOrderAmount: minOrderAmount != null && `${minOrderAmount}` !== '' ? parseInt(minOrderAmount) : null,
        maxUses: maxUses != null && `${maxUses}` !== '' ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser != null && `${maxUsesPerUser}` !== '' ? parseInt(maxUsesPerUser) : 1,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });
    res.status(201).json(promo);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'A promo code with this name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT update promo code (admin) ──
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  if (d.scope && !SCOPES.includes(d.scope)) {
    res.status(400).json({ error: `scope must be one of ${SCOPES.join(', ')}` });
    return;
  }
  try {
    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(d.code !== undefined && { code: (d.code as string).trim().toUpperCase() }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.scope !== undefined && { scope: d.scope }),
        ...(d.discountType !== undefined && { discountType: d.discountType }),
        ...(d.discountValue !== undefined && { discountValue: parseFloat(d.discountValue) }),
        ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount === null || d.maxDiscount === '' ? null : parseInt(d.maxDiscount) }),
        ...(d.minOrderAmount !== undefined && { minOrderAmount: d.minOrderAmount === null || d.minOrderAmount === '' ? null : parseInt(d.minOrderAmount) }),
        ...(d.maxUses !== undefined && { maxUses: d.maxUses === null || d.maxUses === '' ? null : parseInt(d.maxUses) }),
        ...(d.maxUsesPerUser !== undefined && { maxUsesPerUser: parseInt(d.maxUsesPerUser) }),
        ...(d.startsAt !== undefined && { startsAt: d.startsAt ? new Date(d.startsAt) : null }),
        ...(d.expiresAt !== undefined && { expiresAt: d.expiresAt ? new Date(d.expiresAt) : null }),
        ...(d.isActive !== undefined && { isActive: !!d.isActive }),
      },
    });
    res.json(promo);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'A promo code with this name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE promo code (admin) ──
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.promoCode.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
