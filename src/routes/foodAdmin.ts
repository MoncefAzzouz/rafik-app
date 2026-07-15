import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { getSubscriptionGrid, computeSubscription, DEFAULT_SUBSCRIPTION_GRID } from '../lib/food';
import { getPlatformSettings } from '../lib/settings';

const router = Router();

function monthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── GET /stats — food dashboard KPIs (admin) ──
router.get('/stats', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalOrders, ordersToday, activeOrders, deliveredOrders, revenueAgg, todayRevenueAgg,
      totalRestaurants, approvedRestaurants, totalDrivers, availableDrivers, recentOrders] = await Promise.all([
      prisma.foodOrder.count(),
      prisma.foodOrder.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.foodOrder.count({ where: { status: { in: ['pending', 'accepted', 'preparing', 'assigned', 'arrived', 'delivering'] } } }),
      prisma.foodOrder.count({ where: { status: 'delivered' } }),
      prisma.foodOrder.aggregate({ where: { status: 'delivered' }, _sum: { totalAmount: true, deliveryFee: true }, _avg: { totalAmount: true } }),
      prisma.foodOrder.aggregate({ where: { status: 'delivered', deliveredAt: { gte: todayStart } }, _sum: { totalAmount: true } }),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'APPROVED' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'AVAILABLE', isActive: true, isVerified: true } }),
      prisma.foodOrder.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { name: true } },
          driver: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      totalOrders,
      ordersToday,
      activeOrders,
      deliveredOrders,
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
      deliveryFeesCollected: revenueAgg._sum.deliveryFee ?? 0,
      avgBasket: Math.round(revenueAgg._avg.totalAmount ?? 0),
      todayRevenue: todayRevenueAgg._sum.totalAmount ?? 0,
      totalRestaurants,
      approvedRestaurants,
      totalDrivers,
      availableDrivers,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /subscriptions?month=YYYY-MM — per-restaurant revenue, tier, dues (admin) ──
router.get('/subscriptions', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const monthKey = (req.query.month as string) || currentMonthKey();
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    res.status(400).json({ error: 'month must be YYYY-MM' });
    return;
  }
  try {
    const { start, end } = monthRange(monthKey);
    const grid = await getSubscriptionGrid();

    const restaurants = await prisma.restaurant.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { name: 'asc' },
    });
    const payments = await prisma.restaurantSubscriptionPayment.findMany({ where: { monthKey } });

    const rows = await Promise.all(restaurants.map(async (r) => {
      // Revenue = sum of delivered order subtotals in the month (Tawsil definition)
      const agg = await prisma.foodOrder.aggregate({
        where: { restaurantId: r.id, status: 'delivered', deliveredAt: { gte: start, lt: end } },
        _sum: { subtotal: true },
        _count: true,
      });
      const revenue = agg._sum.subtotal ?? 0;
      const { tierLevel, fee } = computeSubscription(revenue, grid);
      const payment = payments.find(p => p.restaurantId === r.id);
      const paidAmount = payment?.paidAmount ?? 0;
      const remaining = Math.max(fee - paidAmount, 0);
      return {
        restaurantId: r.id,
        restaurantName: r.name,
        isPremium: r.isPremium,
        monthKey,
        revenue,
        ordersCount: agg._count,
        tierLevel,
        totalDue: fee,
        paidAmount,
        remainingAmount: remaining,
        status: fee === 0 || remaining === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
        paidAt: payment?.paidAt ?? null,
        notes: payment?.notes ?? null,
      };
    }));

    const totals = {
      revenue: rows.reduce((s, r) => s + r.revenue, 0),
      totalDue: rows.reduce((s, r) => s + r.totalDue, 0),
      paid: rows.reduce((s, r) => s + r.paidAmount, 0),
      remaining: rows.reduce((s, r) => s + r.remainingAmount, 0),
    };

    res.json({ monthKey, grid, rows, totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /subscriptions/pay — record a restaurant subscription payment (admin) ──
router.post('/subscriptions/pay', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { restaurantId, monthKey, amount, notes } = req.body;
  if (!restaurantId || !monthKey || amount === undefined || isNaN(parseInt(amount))) {
    res.status(400).json({ error: 'restaurantId, monthKey and numeric amount are required' });
    return;
  }
  try {
    const { start, end } = monthRange(monthKey);
    const grid = await getSubscriptionGrid();
    const agg = await prisma.foodOrder.aggregate({
      where: { restaurantId, status: 'delivered', deliveredAt: { gte: start, lt: end } },
      _sum: { subtotal: true },
      _count: true,
    });
    const revenue = agg._sum.subtotal ?? 0;
    const { tierLevel, fee } = computeSubscription(revenue, grid);

    const existing = await prisma.restaurantSubscriptionPayment.findUnique({
      where: { restaurantId_monthKey: { restaurantId, monthKey } },
    });
    const newPaid = (existing?.paidAmount ?? 0) + parseInt(amount);
    const status = newPaid >= fee ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    const payment = await prisma.restaurantSubscriptionPayment.upsert({
      where: { restaurantId_monthKey: { restaurantId, monthKey } },
      update: {
        paidAmount: newPaid,
        revenueAmount: revenue,
        ordersCount: agg._count,
        tierLevel,
        totalDue: fee,
        status,
        ...(status === 'paid' && { paidAt: new Date() }),
        ...(notes !== undefined && { notes }),
      },
      create: {
        restaurantId,
        monthKey,
        revenueAmount: revenue,
        ordersCount: agg._count,
        tierLevel,
        totalDue: fee,
        paidAmount: newPaid,
        status,
        ...(status === 'paid' && { paidAt: new Date() }),
        notes: notes || null,
      },
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET/PUT /subscriptions/grid — tier grid editor (admin) ──
router.get('/subscriptions/grid', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    res.json({ grid: await getSubscriptionGrid(), default: DEFAULT_SUBSCRIPTION_GRID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/subscriptions/grid', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { grid } = req.body;
  if (!Array.isArray(grid) || grid.some(t => typeof t.minRevenue !== 'number' || typeof t.fee !== 'number')) {
    res.status(400).json({ error: 'grid must be an array of {minRevenue, maxRevenue|null, fee}' });
    return;
  }
  try {
    await getPlatformSettings();
    const settings = await prisma.platformSettings.update({
      where: { id: 'global' },
      data: { restaurantSubscriptionGrid: grid },
    });
    res.json({ grid: settings.restaurantSubscriptionGrid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /config — food delivery fee config (admin) ──
router.put('/config', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { foodDeliveryFeeBase, foodDeliveryFeePerKm } = req.body;
  try {
    await getPlatformSettings();
    const settings = await prisma.platformSettings.update({
      where: { id: 'global' },
      data: {
        ...(foodDeliveryFeeBase !== undefined && { foodDeliveryFeeBase: parseInt(foodDeliveryFeeBase) }),
        ...(foodDeliveryFeePerKm !== undefined && { foodDeliveryFeePerKm: parseFloat(foodDeliveryFeePerKm) }),
      },
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
