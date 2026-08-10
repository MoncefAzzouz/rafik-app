import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { getPlatformSettings } from '../lib/settings';
import { validatePromo, redeemPromo, PromoResult } from '../lib/promo';
import { deleteUpload } from '../lib/r2';
import {
  canTruckTransition, nextTruckOrderNumber, nextTruckCode, haversineKm,
  estimateTruckPrice, computeTruckCommission, wilayaPriceByName, TRUCK_STATUSES, TRUCK_CANCELLED,
} from '../lib/truck';

const router = Router();
const INVOICE_STATUSES = ['HAS_INVOICE', 'NO_INVOICE', 'NOT_REQUIRED'];
const TRUCK_DUTY = ['available', 'busy', 'offline', 'suspended'];
const COMMISSION_MODES = ['PERCENTAGE', 'SUBSCRIPTION'];

// ══════════════════ WILAYA PRICES (58 wilayas) ══════════════════

// Public list — the mobile app + admin need it to price rides
router.get('/wilayas', async (_req: Request, res: Response) => {
  try {
    const wilayas = await prisma.truckWilaya.findMany({ orderBy: { code: 'asc' } });
    res.json(wilayas);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Update one wilaya's price (admin)
router.put('/wilayas/:code', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const code = parseInt(req.params.code as string);
  const { price } = req.body;
  if (price === undefined || isNaN(parseInt(price))) { res.status(400).json({ error: 'price (DZD) is required' }); return; }
  try {
    const wilaya = await prisma.truckWilaya.update({ where: { code }, data: { price: parseInt(price) } });
    res.json(wilaya);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Bulk update prices (admin) — body: { prices: { "16": 5000, "19": 500, ... } }
router.put('/wilayas', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { prices } = req.body;
  if (!prices || typeof prices !== 'object') { res.status(400).json({ error: 'prices object is required' }); return; }
  try {
    await prisma.$transaction(
      Object.entries(prices).map(([code, price]) =>
        prisma.truckWilaya.update({ where: { code: parseInt(code) }, data: { price: parseInt(price as string) || 0 } })
      )
    );
    const wilayas = await prisma.truckWilaya.findMany({ orderBy: { code: 'asc' } });
    res.json(wilayas);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const orderInclude = {
  category: { select: { id: true, name: true } },
  truckType: { select: { id: true, name: true, priceMultiplier: true, capacityLabel: true } },
  truck: { select: { id: true, truckCode: true, driverName: true, phone: true, plate: true, status: true, rating: true, truckType: { select: { name: true } } } },
};

async function getOwnTruck(userId: string) {
  return prisma.truck.findUnique({ where: { userId } });
}
async function isOrderTrucker(req: Request, order: { truckId: string | null }): Promise<boolean> {
  const user = getUser(req);
  if (user.role !== 'TRUCKER' || !order.truckId) return false;
  const truck = await getOwnTruck(user.userId);
  return !!truck && truck.id === order.truckId;
}

// ══════════════════ TRUCK TYPES ══════════════════

// Public list (mobile app needs it to show choices)
router.get('/types', async (req: Request, res: Response) => {
  const { active } = req.query;
  try {
    const types = await prisma.truckType.findMany({
      where: active === 'true' ? { isActive: true } : undefined,
      include: { _count: { select: { trucks: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/types', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, description, image, capacityLabel, priceMultiplier, isActive } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  try {
    const type = await prisma.truckType.create({
      data: {
        name: name as string,
        description: (description as string) || null,
        image: (image as string) || null,
        capacityLabel: (capacityLabel as string) || null,
        priceMultiplier: priceMultiplier != null ? parseFloat(priceMultiplier) : 1,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });
    res.status(201).json(type);
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(409).json({ error: 'A truck type with this name already exists' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

router.put('/types/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  try {
    const existing = await prisma.truckType.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Truck type not found' }); return; }
    const type = await prisma.truckType.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.image !== undefined && { image: d.image || null }),
        ...(d.capacityLabel !== undefined && { capacityLabel: d.capacityLabel || null }),
        ...(d.priceMultiplier !== undefined && { priceMultiplier: parseFloat(d.priceMultiplier) }),
        ...(d.isActive !== undefined && { isActive: !!d.isActive }),
      },
    });
    // Remove the old picture from R2 if it was replaced
    if (d.image !== undefined && existing.image && existing.image !== (d.image || null)) {
      await deleteUpload(existing.image);
    }
    res.json(type);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/types/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const existing = await prisma.truckType.findUnique({ where: { id } });
    await prisma.truckType.delete({ where: { id } });
    if (existing?.image) await deleteUpload(existing.image);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ══════════════════ TRUCK CATEGORIES ══════════════════

// Public list with the truck types allowed in each category
router.get('/categories', async (req: Request, res: Response) => {
  const { active } = req.query;
  try {
    const categories = await prisma.truckCategory.findMany({
      where: active === 'true' ? { isActive: true } : undefined,
      include: {
        allowedTypes: { include: { truckType: { select: { id: true, name: true, priceMultiplier: true, capacityLabel: true, image: true, isActive: true } } } },
        _count: { select: { orders: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories.map(c => ({
      ...c,
      truckTypes: c.allowedTypes.map(at => at.truckType),
      allowedTypes: undefined,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/categories', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, description, image, isActive, truckTypeIds } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  try {
    const category = await prisma.truckCategory.create({
      data: {
        name: name as string,
        description: (description as string) || null,
        image: (image as string) || null,
        isActive: isActive !== undefined ? !!isActive : true,
        ...(Array.isArray(truckTypeIds) && truckTypeIds.length > 0 && {
          allowedTypes: { create: truckTypeIds.map((tid: string) => ({ truckTypeId: tid })) },
        }),
      },
      include: { allowedTypes: true },
    });
    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(409).json({ error: 'A category with this name already exists' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

router.put('/categories/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  try {
    const existing = await prisma.truckCategory.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
    // Replace the allowed-types set when provided
    if (Array.isArray(d.truckTypeIds)) {
      await prisma.truckCategoryType.deleteMany({ where: { categoryId: id } });
      if (d.truckTypeIds.length > 0) {
        await prisma.truckCategoryType.createMany({
          data: d.truckTypeIds.map((tid: string) => ({ categoryId: id, truckTypeId: tid })),
          skipDuplicates: true,
        });
      }
    }
    const category = await prisma.truckCategory.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.description !== undefined && { description: d.description || null }),
        ...(d.image !== undefined && { image: d.image || null }),
        ...(d.isActive !== undefined && { isActive: !!d.isActive }),
      },
      include: { allowedTypes: { include: { truckType: true } } },
    });
    // Remove the old picture from R2 if it was replaced
    if (d.image !== undefined && existing.image && existing.image !== (d.image || null)) {
      await deleteUpload(existing.image);
    }
    res.json(category);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/categories/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const existing = await prisma.truckCategory.findUnique({ where: { id } });
    await prisma.truckCategory.delete({ where: { id } });
    if (existing?.image) await deleteUpload(existing.image);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ══════════════════ TRUCKS (vehicle + driver) ══════════════════

router.get('/trucks', authenticateToken, async (req: Request, res: Response) => {
  const { status, verified, truckTypeId, search } = req.query;
  try {
    const trucks = await prisma.truck.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(verified !== undefined && verified !== '' && { isVerified: verified === 'true' }),
        ...(truckTypeId && { truckTypeId: truckTypeId as string }),
        ...(search && { driverName: { contains: search as string, mode: 'insensitive' } }),
      },
      include: { truckType: { select: { name: true } }, _count: { select: { orders: true } } },
      orderBy: { truckCode: 'asc' },
    });
    res.json(trucks);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Trucker self-service record
router.get('/trucks/me', authenticateToken, requireRole('TRUCKER'), async (req: Request, res: Response) => {
  const user = getUser(req);
  try {
    const truck = await prisma.truck.findUnique({
      where: { userId: user.userId },
      include: { truckType: true, orders: { where: { status: { in: ['accepted', 'arrived', 'loading', 'in_transit'] } }, include: orderInclude } },
    });
    if (!truck) { res.status(404).json({ error: 'No truck linked to this account' }); return; }
    res.json(truck);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/trucks', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { driverName, phone, email, plate, truckTypeId, wilaya, commune, password, isVerified, profileImage, truckImage } = req.body;
  if (!driverName || !phone) { res.status(400).json({ error: 'driverName and phone are required' }); return; }
  try {
    const truckCode = await nextTruckCode();
    const truckEmail = (email as string) || `${truckCode.toLowerCase()}@rafik.app`;
    const passwordHash = await bcrypt.hash((password as string) || 'trucker123', 10);
    const usr = await prisma.user.create({
      data: { email: truckEmail, phone: phone as string, passwordHash, fullName: driverName as string, role: 'TRUCKER' },
    });
    const truck = await prisma.truck.create({
      data: {
        userId: usr.id, truckCode, driverName: driverName as string, phone: phone as string, email: truckEmail,
        plate: (plate as string) || null, truckTypeId: (truckTypeId as string) || null,
        wilaya: (wilaya as string) || null, commune: (commune as string) || null, isVerified: !!isVerified,
        profileImage: (profileImage as string) || null,
        truckImage: (truckImage as string) || null,
      },
      include: { truckType: { select: { name: true } } },
    });
    res.status(201).json(truck);
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(409).json({ error: 'Email or phone already exists' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

router.put('/trucks/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  const user = getUser(req);
  try {
    const existing = await prisma.truck.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Truck not found' }); return; }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && existing.userId !== user.userId) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    const truck = await prisma.truck.update({
      where: { id },
      data: {
        ...(d.driverName !== undefined && { driverName: d.driverName }),
        ...(d.phone !== undefined && { phone: d.phone }),
        ...(d.plate !== undefined && { plate: d.plate }),
        ...(d.truckTypeId !== undefined && { truckTypeId: d.truckTypeId || null }),
        ...(d.wilaya !== undefined && { wilaya: d.wilaya }),
        ...(d.commune !== undefined && { commune: d.commune }),
        ...(d.lat !== undefined && { lat: d.lat === null ? null : parseFloat(d.lat) }),
        ...(d.lng !== undefined && { lng: d.lng === null ? null : parseFloat(d.lng) }),
        ...(d.profileImage !== undefined && { profileImage: d.profileImage || null }),
        ...(d.truckImage !== undefined && { truckImage: d.truckImage || null }),
        ...(d.notes !== undefined && { notes: d.notes }),
        ...(isAdmin && d.isVerified !== undefined && { isVerified: !!d.isVerified }),
        ...(isAdmin && d.isActive !== undefined && { isActive: !!d.isActive }),
        ...(isAdmin && d.rating !== undefined && { rating: parseFloat(d.rating) }),
      },
      include: { truckType: { select: { name: true } } },
    });
    // Remove replaced photos from R2
    if (d.profileImage !== undefined && existing.profileImage && existing.profileImage !== (d.profileImage || null)) {
      await deleteUpload(existing.profileImage);
    }
    if (d.truckImage !== undefined && existing.truckImage && existing.truckImage !== (d.truckImage || null)) {
      await deleteUpload(existing.truckImage);
    }
    res.json(truck);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Duty status (trucker self or admin; SUSPENDED admin-only)
router.patch('/trucks/:id/status', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const user = getUser(req);
  if (!TRUCK_DUTY.includes(status)) { res.status(400).json({ error: `status must be one of ${TRUCK_DUTY.join(', ')}` }); return; }
  try {
    const existing = await prisma.truck.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Truck not found' }); return; }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && existing.userId !== user.userId) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (status === 'suspended' && !isAdmin) { res.status(403).json({ error: 'Only an admin can suspend a truck' }); return; }
    const truck = await prisma.truck.update({ where: { id }, data: { status } });
    res.json(truck);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/trucks/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const truck = await prisma.truck.findUnique({ where: { id } });
    if (!truck) { res.status(404).json({ error: 'Truck not found' }); return; }
    await prisma.truck.delete({ where: { id } });
    if (truck.userId) await prisma.user.delete({ where: { id: truck.userId } }).catch(() => {});
    // Remove the driver + truck photos from R2
    await deleteUpload(truck.profileImage);
    await deleteUpload(truck.truckImage);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ══════════════════ TRUCKER SELF-REGISTRATION (mobile app) ══════════════════
// A driver creates their account and chooses which truck they have.
// They then only receive orders their truck type can handle. Starts unverified;
// an admin verifies before they can be dispatched.
router.post('/register', async (req: Request, res: Response) => {
  const { fullName, driverName, phone, email, password, plate, truckTypeId, wilaya, commune } = req.body;
  const name = (driverName || fullName) as string;
  if (!name || !phone || !password) {
    res.status(400).json({ error: 'driverName, phone and password are required' });
    return;
  }
  if (!truckTypeId) {
    res.status(400).json({ error: 'Please choose your truck type' });
    return;
  }
  try {
    const type = await prisma.truckType.findUnique({ where: { id: truckTypeId as string } });
    if (!type) { res.status(404).json({ error: 'Truck type not found' }); return; }

    const truckCode = await nextTruckCode();
    const truckEmail = (email as string) || `${truckCode.toLowerCase()}@rafik.app`;
    const passwordHash = await bcrypt.hash(password as string, 10);
    const usr = await prisma.user.create({
      data: { email: truckEmail, phone: phone as string, passwordHash, fullName: name, role: 'TRUCKER' },
    });
    const truck = await prisma.truck.create({
      data: {
        userId: usr.id, truckCode, driverName: name, phone: phone as string, email: truckEmail,
        plate: (plate as string) || null, truckTypeId: truckTypeId as string,
        wilaya: (wilaya as string) || null, commune: (commune as string) || null,
        isVerified: false, status: 'offline',
      },
      include: { truckType: { select: { name: true } } },
    });
    res.status(201).json({ truck, message: 'Account created — an admin will verify your truck before you receive orders' });
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(409).json({ error: 'Email or phone already exists' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ══════════════════ PRICE QUOTE (public — mobile app calls before ordering) ══════════════════
router.post('/quote', async (req: Request, res: Response) => {
  const { truckTypeId, destinationWilaya, distanceKm, pickupLat, pickupLng, destinationLat, destinationLng } = req.body;
  try {
    let km: number | null = distanceKm != null && `${distanceKm}` !== '' ? parseFloat(distanceKm) : null;
    if (km === null && pickupLat != null && pickupLng != null && destinationLat != null && destinationLng != null) {
      km = Math.round(haversineKm(parseFloat(pickupLat), parseFloat(pickupLng), parseFloat(destinationLat), parseFloat(destinationLng)) * 10) / 10;
    }
    const truckType = truckTypeId ? await prisma.truckType.findUnique({ where: { id: truckTypeId as string } }) : null;
    const wilayaPrice = await wilayaPriceByName(destinationWilaya as string);
    const quote = await estimateTruckPrice({
      distanceKm: km,
      typeMultiplier: truckType?.priceMultiplier ?? null,
      wilayaPrice,
    });
    res.json({ ...quote, distanceKm: km, estimatedPrice: quote.estimatedPrice });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ══════════════════ ORDERS ══════════════════

router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  const { status, truckId, search } = req.query;
  const user = getUser(req);
  try {
    let scope: any = {};
    if (user.role === 'TRUCKER') {
      const truck = await getOwnTruck(user.userId);
      // A trucker sees his own jobs + only OPEN requests he can actually do:
      // orders that need his truck type, or that don't require a specific type.
      scope = {
        OR: [
          { truckId: truck?.id ?? '—' },
          { status: 'requested', OR: [{ truckTypeId: truck?.truckTypeId ?? '—' }, { truckTypeId: null }] },
        ],
      };
    } else if (user.role === 'CLIENT') {
      scope = { clientId: user.userId };
    } else if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' }); return;
    }
    const orders = await prisma.truckOrder.findMany({
      where: {
        ...scope,
        ...(status && { status: status as string }),
        ...(truckId && { truckId: truckId as string }),
        ...(search && { OR: [
          { orderNumber: { contains: search as string, mode: 'insensitive' } },
          { clientName: { contains: search as string, mode: 'insensitive' } },
          { clientPhone: { contains: search as string } },
        ] }),
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(orders);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.truckOrder.findUnique({ where: { id }, include: orderInclude });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const allowed = user.role === 'ADMIN' || order.clientId === user.userId ||
      (await isOrderTrucker(req, order)) || (user.role === 'TRUCKER' && order.status === 'requested');
    if (!allowed) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    res.json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Create a freight order (client or admin)
router.post('/orders', authenticateToken, requireRole('ADMIN', 'CLIENT'), async (req: Request, res: Response) => {
  const {
    clientName, clientPhone, categoryId, truckTypeId,
    pickupAddress, pickupWilaya, pickupCommune, pickupLat, pickupLng,
    destinationAddress, destinationWilaya, destinationLat, destinationLng, distanceKm,
    description, invoiceStatus, scheduledType, scheduledDate, promoCode,
  } = req.body;
  const user = getUser(req);

  if (!clientName || !clientPhone || !categoryId || !pickupAddress || !destinationAddress || !description) {
    res.status(400).json({ error: 'Missing required fields (clientName, clientPhone, categoryId, pickupAddress, destinationAddress, description)' });
    return;
  }
  if (invoiceStatus && !INVOICE_STATUSES.includes(invoiceStatus)) {
    res.status(400).json({ error: `invoiceStatus must be one of ${INVOICE_STATUSES.join(', ')}` });
    return;
  }

  try {
    const category = await prisma.truckCategory.findUnique({ where: { id: categoryId as string }, include: { allowedTypes: true } });
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }

    // If a truck type is chosen, it must be allowed in this category
    let truckType = null;
    if (truckTypeId) {
      const allowed = category.allowedTypes.some(at => at.truckTypeId === truckTypeId);
      if (!allowed) { res.status(400).json({ error: 'This truck type is not allowed for the selected category' }); return; }
      truckType = await prisma.truckType.findUnique({ where: { id: truckTypeId as string } });
    }

    let km: number | null = distanceKm != null && `${distanceKm}` !== '' ? parseFloat(distanceKm) : null;
    if (km === null && pickupLat != null && pickupLng != null && destinationLat != null && destinationLng != null) {
      km = Math.round(haversineKm(parseFloat(pickupLat), parseFloat(pickupLng), parseFloat(destinationLat), parseFloat(destinationLng)) * 10) / 10;
    }

    const wilayaPrice = await wilayaPriceByName(destinationWilaya as string);
    const { estimatedPrice } = await estimateTruckPrice({
      distanceKm: km, typeMultiplier: truckType?.priceMultiplier ?? null, wilayaPrice,
    });

    // Optional promo
    let promoDiscount = 0;
    let promoValidation: PromoResult | null = null;
    if (promoCode) {
      promoValidation = await validatePromo({ code: promoCode as string, vertical: 'truck', amount: estimatedPrice, userId: user.userId, clientPhone: clientPhone as string });
      if (!promoValidation.valid) { res.status(400).json({ error: promoValidation.error || 'Invalid promo code' }); return; }
      promoDiscount = promoValidation.discount;
    }
    const agreedPrice = estimatedPrice - promoDiscount;

    const order = await prisma.truckOrder.create({
      data: {
        orderNumber: await nextTruckOrderNumber(),
        clientId: user.role === 'CLIENT' ? user.userId : null,
        clientName: clientName as string, clientPhone: clientPhone as string,
        categoryId: categoryId as string, truckTypeId: (truckTypeId as string) || null,
        pickupAddress: pickupAddress as string, pickupWilaya: (pickupWilaya as string) || null, pickupCommune: (pickupCommune as string) || null,
        pickupLat: pickupLat != null ? parseFloat(pickupLat) : null, pickupLng: pickupLng != null ? parseFloat(pickupLng) : null,
        destinationAddress: destinationAddress as string, destinationWilaya: (destinationWilaya as string) || null,
        destinationLat: destinationLat != null ? parseFloat(destinationLat) : null, destinationLng: destinationLng != null ? parseFloat(destinationLng) : null,
        distanceKm: km, description: description as string,
        invoiceStatus: (invoiceStatus as any) || 'NOT_REQUIRED',
        scheduledType: scheduledType === 'scheduled' ? 'scheduled' : 'now',
        scheduledDate: scheduledType === 'scheduled' ? (scheduledDate as string) || null : null,
        estimatedPrice, promoDiscount, promoCodeId: promoValidation?.promo?.id ?? null, agreedPrice,
        status: 'requested',
      },
      include: orderInclude,
    });

    if (promoValidation?.valid && promoValidation.promo) {
      await redeemPromo({ promoId: promoValidation.promo.id, vertical: 'truck', refId: order.id, discount: promoDiscount, userId: user.userId, clientPhone: clientPhone as string });
    }
    res.status(201).json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Dispatch a truck (admin) — price already fixed by the formula
router.post('/orders/:id/assign', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { truckId } = req.body;
  if (!truckId) { res.status(400).json({ error: 'truckId is required' }); return; }
  try {
    const order = await prisma.truckOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.status !== 'requested') { res.status(400).json({ error: `Order is already "${order.status}"` }); return; }
    const truck = await prisma.truck.findUnique({ where: { id: truckId as string } });
    if (!truck) { res.status(404).json({ error: 'Truck not found' }); return; }
    if (truck.status === 'suspended' || !truck.isActive) { res.status(400).json({ error: 'This truck is suspended or inactive' }); return; }
    const [updated] = await prisma.$transaction([
      prisma.truckOrder.update({ where: { id }, data: { status: 'accepted', truckId: truck.id, acceptedAt: new Date() }, include: orderInclude }),
      prisma.truck.update({ where: { id: truck.id }, data: { status: 'busy' } }),
    ]);
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Lifecycle transitions (admin or the order's trucker)
async function lifecycle(req: Request, res: Response, target: 'arrived' | 'loading' | 'in_transit') {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.truckOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && !(await isOrderTrucker(req, order))) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canTruckTransition(order.status, target, isAdmin)) { res.status(400).json({ error: `Cannot go from "${order.status}" to "${target}"` }); return; }
    const updated = await prisma.truckOrder.update({
      where: { id },
      data: {
        status: target,
        ...(target === 'arrived' && { arrivedAt: new Date() }),
        ...(target === 'loading' && { loadingAt: new Date() }),
        ...(target === 'in_transit' && { transitAt: new Date() }),
      },
      include: orderInclude,
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
router.post('/orders/:id/arrived', authenticateToken, (req, res) => lifecycle(req, res, 'arrived'));
router.post('/orders/:id/loading', authenticateToken, (req, res) => lifecycle(req, res, 'loading'));
router.post('/orders/:id/start', authenticateToken, (req, res) => lifecycle(req, res, 'in_transit'));

// Complete — freezes commission
router.post('/orders/:id/complete', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.truckOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && !(await isOrderTrucker(req, order))) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canTruckTransition(order.status, 'delivered', isAdmin)) { res.status(400).json({ error: `Cannot complete from "${order.status}"` }); return; }
    const price = order.agreedPrice ?? order.estimatedPrice ?? 0;
    const { percent, commissionAmount, driverEarnings } = await computeTruckCommission(price);
    const ops: any[] = [
      prisma.truckOrder.update({
        where: { id },
        data: { status: 'delivered', commissionPercentSnapshot: percent, commissionAmount, driverEarnings, deliveredAt: new Date() },
        include: orderInclude,
      }),
    ];
    if (order.truckId) ops.push(prisma.truck.update({ where: { id: order.truckId }, data: { status: 'available', totalTrips: { increment: 1 } } }));
    const [updated] = await prisma.$transaction(ops);
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Cancel — records who/why
router.post('/orders/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const user = getUser(req);
  try {
    const order = await prisma.truckOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    let by: 'CLIENT' | 'DRIVER' | 'ADMIN';
    if (user.role === 'ADMIN') by = 'ADMIN';
    else if (await isOrderTrucker(req, order)) by = 'DRIVER';
    else if (order.clientId === user.userId) by = 'CLIENT';
    else { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    const target = by === 'ADMIN' ? 'cancelled_by_admin' : by === 'DRIVER' ? 'cancelled_by_driver' : 'cancelled_by_client';
    if (!canTruckTransition(order.status, target, by === 'ADMIN')) { res.status(400).json({ error: `Cannot cancel an order that is "${order.status}"` }); return; }
    const ops: any[] = [
      prisma.truckOrder.update({
        where: { id },
        data: { status: target, cancelledBy: by, cancelReason: (reason as string) || null, cancelStage: order.status, cancelledAt: new Date() },
        include: orderInclude,
      }),
    ];
    if (order.truckId) ops.push(prisma.truck.update({ where: { id: order.truckId }, data: { status: 'available', ...(by === 'DRIVER' && { cancellationCount: { increment: 1 } }) } }));
    const [updated] = await prisma.$transaction(ops);
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ══════════════════ STATS + CONFIG ══════════════════

router.get('/stats', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const [orders, trucks, categories, types] = await Promise.all([
      prisma.truckOrder.findMany({ select: { status: true, agreedPrice: true, commissionAmount: true, driverEarnings: true } }),
      prisma.truck.findMany({ select: { status: true } }),
      prisma.truckCategory.count(),
      prisma.truckType.count(),
    ]);
    const completed = orders.filter(o => o.status === 'delivered');
    const active = orders.filter(o => ['requested', 'accepted', 'arrived', 'loading', 'in_transit'].includes(o.status));
    const cancelled = orders.filter(o => TRUCK_CANCELLED.includes(o.status));
    res.json({
      totalOrders: orders.length, activeOrders: active.length, completedOrders: completed.length, cancelledOrders: cancelled.length,
      grossRevenue: completed.reduce((s, o) => s + (o.agreedPrice ?? 0), 0),
      commissionRevenue: completed.reduce((s, o) => s + (o.commissionAmount ?? 0), 0),
      driverPayouts: completed.reduce((s, o) => s + (o.driverEarnings ?? 0), 0),
      trucksTotal: trucks.length,
      trucksAvailable: trucks.filter(t => t.status === 'available').length,
      trucksBusy: trucks.filter(t => t.status === 'busy').length,
      categories, types,
      statusBreakdown: TRUCK_STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {}),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

function configShape(s: any) {
  return {
    truckBaseFare: s.truckBaseFare, truckPerKm: s.truckPerKm, truckMinFare: s.truckMinFare,
    truckCommissionMode: s.truckCommissionMode, truckCommissionPercent: s.truckCommissionPercent,
    truckSubscriptionFee: s.truckSubscriptionFee,
  };
}

router.get('/config', authenticateToken, async (_req: Request, res: Response) => {
  try {
    res.json(configShape(await getPlatformSettings()));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/config', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { truckBaseFare, truckPerKm, truckMinFare, truckCommissionMode, truckCommissionPercent, truckSubscriptionFee } = req.body;
  if (truckCommissionMode !== undefined && !COMMISSION_MODES.includes(truckCommissionMode)) {
    res.status(400).json({ error: 'truckCommissionMode must be PERCENTAGE or SUBSCRIPTION' });
    return;
  }
  try {
    await getPlatformSettings();
    const s = await prisma.platformSettings.update({
      where: { id: 'global' },
      data: {
        ...(truckBaseFare !== undefined && { truckBaseFare: parseInt(truckBaseFare) }),
        ...(truckPerKm !== undefined && { truckPerKm: parseFloat(truckPerKm) }),
        ...(truckMinFare !== undefined && { truckMinFare: parseInt(truckMinFare) }),
        ...(truckCommissionMode !== undefined && { truckCommissionMode }),
        ...(truckCommissionPercent !== undefined && { truckCommissionPercent: parseFloat(truckCommissionPercent) }),
        ...(truckSubscriptionFee !== undefined && { truckSubscriptionFee: parseInt(truckSubscriptionFee) }),
      },
    });
    res.json(configShape(s));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;
