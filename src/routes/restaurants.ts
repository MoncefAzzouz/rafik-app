import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { isValidLocation } from '../lib/locations';
import { nextCode } from '../lib/food';

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const RESTAURANT_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'ARCHIVED'];
const AVAILABILITY_STATUSES = ['OPEN', 'CLOSED', 'VACATION', 'SATURATED', 'OTHER'];

// Is the requester the owner of this restaurant (or an admin)?
async function canManageRestaurant(req: Request, restaurantId: string): Promise<boolean> {
  const user = getUser(req);
  if (user.role === 'ADMIN') return true;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  return !!restaurant && restaurant.userId === user.userId;
}

const FULL_INCLUDE = {
  categories: { orderBy: { displayOrder: 'asc' as const }, include: { menuItems: false } },
  menuItems: { include: { additions: true, optionGroups: { include: { additions: true } } }, orderBy: { name: 'asc' as const } },
  cashiers: true,
};

// ── GET all restaurants (public list; filters ?status=&wilaya=&commune=&search=) ──
router.get('/', async (req: Request, res: Response) => {
  const { status, wilaya, commune, search } = req.query;
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(wilaya && { wilaya: wilaya as string }),
        ...(commune && { commune: commune as string }),
        ...(search && { name: { contains: search as string, mode: 'insensitive' } }),
      },
      include: { _count: { select: { menuItems: true, orders: true, cashiers: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET own restaurant (restaurant-owner account) ──
router.get('/me', authenticateToken, requireRole('RESTAURANT'), async (req: Request, res: Response) => {
  const user = getUser(req);
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.userId },
      include: FULL_INCLUDE,
    });
    if (!restaurant) {
      res.status(404).json({ error: 'No restaurant linked to this account' });
      return;
    }
    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET single restaurant with full menu ──
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id as string },
      include: FULL_INCLUDE,
    });
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST create restaurant (admin) — also creates a RESTAURANT user account ──
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, description, address, phone, email, image, wilaya, commune, lat, lng, password, isPremium } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Missing required fields (name, phone)' });
    return;
  }
  if (wilaya && !isValidLocation(wilaya as string, (commune as string) || null)) {
    res.status(400).json({ error: 'Invalid wilaya/commune' });
    return;
  }
  try {
    const ownerEmail = (email as string) || `${(name as string).toLowerCase().replace(/[^a-z0-9]+/g, '.')}@rafik.app`;
    const passwordHash = await bcrypt.hash((password as string) || 'resto123', 10);
    const user = await prisma.user.create({
      data: { email: ownerEmail, phone: phone as string, passwordHash, fullName: name as string, role: 'RESTAURANT' },
    });
    const restaurant = await prisma.restaurant.create({
      data: {
        userId: user.id,
        name: name as string,
        description: (description as string) || null,
        address: (address as string) || null,
        phone: phone as string,
        email: ownerEmail,
        image: (image as string) || null,
        isPremium: !!isPremium,
        wilaya: (wilaya as string) || null,
        commune: (commune as string) || null,
        lat: lat != null ? parseFloat(lat) : null,
        lng: lng != null ? parseFloat(lng) : null,
      },
    });
    res.status(201).json(restaurant);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Email or phone already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT update restaurant (admin or owner) ──
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  const user = getUser(req);
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (data.status && !RESTAURANT_STATUSES.includes(data.status)) {
      res.status(400).json({ error: `status must be one of ${RESTAURANT_STATUSES.join(', ')}` });
      return;
    }
    if (data.availabilityStatus && !AVAILABILITY_STATUSES.includes(data.availabilityStatus)) {
      res.status(400).json({ error: `availabilityStatus must be one of ${AVAILABILITY_STATUSES.join(', ')}` });
      return;
    }
    const isAdmin = user.role === 'ADMIN';
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.availabilityStatus !== undefined && { availabilityStatus: data.availabilityStatus }),
        ...(data.availabilityNote !== undefined && { availabilityNote: data.availabilityNote }),
        ...(data.openingHours !== undefined && { openingHours: data.openingHours }),
        ...(data.wilaya !== undefined && { wilaya: data.wilaya }),
        ...(data.commune !== undefined && { commune: data.commune }),
        ...(data.lat !== undefined && { lat: data.lat === null ? null : parseFloat(data.lat) }),
        ...(data.lng !== undefined && { lng: data.lng === null ? null : parseFloat(data.lng) }),
        // Admin-only trust/status fields
        ...(isAdmin && data.status !== undefined && { status: data.status }),
        ...(isAdmin && data.isPremium !== undefined && { isPremium: !!data.isPremium }),
        ...(isAdmin && data.isActive !== undefined && { isActive: !!data.isActive }),
        ...(isAdmin && data.rating !== undefined && { rating: parseFloat(data.rating) }),
      },
    });
    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE restaurant (admin) ──
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    const orderCount = await prisma.foodOrder.count({ where: { restaurantId: id, status: { notIn: ['delivered', 'declined', 'cancelled'] } } });
    if (orderCount > 0) {
      res.status(409).json({ error: 'Restaurant has active orders; finish or cancel them first' });
      return;
    }
    await prisma.foodOrder.deleteMany({ where: { restaurantId: id } });
    await prisma.restaurant.delete({ where: { id } });
    if (restaurant.userId) {
      await prisma.user.delete({ where: { id: restaurant.userId } }).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════ MENU: categories ═══════════

router.post('/:id/categories', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, image, displayOrder } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const category = await prisma.foodMenuCategory.create({
      data: { restaurantId: id, name, description: description || null, image: image || null, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/categories/:categoryId', authenticateToken, async (req: Request, res: Response) => {
  const { id, categoryId } = req.params as { id: string; categoryId: string };
  const data = req.body;
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const category = await prisma.foodMenuCategory.update({
      where: { id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.displayOrder !== undefined && { displayOrder: parseInt(data.displayOrder) }),
      },
    });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/categories/:categoryId', authenticateToken, async (req: Request, res: Response) => {
  const { id, categoryId } = req.params as { id: string; categoryId: string };
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    await prisma.foodMenuCategory.delete({ where: { id: categoryId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════ MENU: items ═══════════

router.post('/:id/menu-items', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, price, image, categoryId, prepTime, isAvailable } = req.body;
  if (!name || price === undefined || isNaN(parseInt(price))) {
    res.status(400).json({ error: 'name and numeric price are required' });
    return;
  }
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: id,
        categoryId: categoryId || null,
        name,
        description: description || null,
        price: parseInt(price),
        image: image || null,
        prepTime: prepTime ? parseInt(prepTime) : 20,
        isAvailable: isAvailable !== undefined ? !!isAvailable : true,
      },
      include: { additions: true, optionGroups: true },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/menu-items/:itemId', authenticateToken, async (req: Request, res: Response) => {
  const { id, itemId } = req.params as { id: string; itemId: string };
  const data = req.body;
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: parseInt(data.price) }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.prepTime !== undefined && { prepTime: parseInt(data.prepTime) }),
        ...(data.isAvailable !== undefined && { isAvailable: !!data.isAvailable }),
      },
      include: { additions: true, optionGroups: true },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/menu-items/:itemId', authenticateToken, async (req: Request, res: Response) => {
  const { id, itemId } = req.params as { id: string; itemId: string };
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const ordered = await prisma.foodOrderItem.count({ where: { menuItemId: itemId } });
    if (ordered > 0) {
      // keep history intact — just hide the item instead of hard deleting
      await prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: false } });
      res.json({ success: true, softDisabled: true });
      return;
    }
    await prisma.menuItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════ MENU: additions (add-ons) ═══════════

router.post('/:id/menu-items/:itemId/additions', authenticateToken, async (req: Request, res: Response) => {
  const { id, itemId } = req.params as { id: string; itemId: string };
  const { name, price, optionGroupId } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const addition = await prisma.addition.create({
      data: { menuItemId: itemId, name, price: price ? parseInt(price) : 0, optionGroupId: optionGroupId || null },
    });
    res.status(201).json(addition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/additions/:additionId', authenticateToken, async (req: Request, res: Response) => {
  const { id, additionId } = req.params as { id: string; additionId: string };
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const used = await prisma.foodOrderItemAddition.count({ where: { additionId } });
    if (used > 0) {
      await prisma.addition.update({ where: { id: additionId }, data: { isAvailable: false } });
      res.json({ success: true, softDisabled: true });
      return;
    }
    await prisma.addition.delete({ where: { id: additionId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════ CASHIERS ═══════════

router.post('/:id/cashiers', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, phone, email, password } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const cashierCode = await nextCode('CSH');
    // Cashier gets a login account so the POS/mobile can authenticate later
    let userId: string | null = null;
    if (email || phone) {
      const cashierEmail = (email as string) || `${cashierCode.toLowerCase()}@rafik.app`;
      const passwordHash = await bcrypt.hash((password as string) || 'cashier123', 10);
      const user = await prisma.user.create({
        data: { email: cashierEmail, phone: (phone as string) || cashierCode, passwordHash, fullName: name, role: 'CASHIER' },
      }).catch(() => null);
      userId = user?.id ?? null;
    }
    const cashier = await prisma.cashier.create({
      data: { restaurantId: id, cashierCode, name, phone: phone || null, email: email || null, userId },
    });
    res.status(201).json(cashier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/cashiers/:cashierId', authenticateToken, async (req: Request, res: Response) => {
  const { id, cashierId } = req.params as { id: string; cashierId: string };
  try {
    if (!(await canManageRestaurant(req, id))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const cashier = await prisma.cashier.findUnique({ where: { id: cashierId } });
    if (!cashier) {
      res.status(404).json({ error: 'Cashier not found' });
      return;
    }
    await prisma.cashier.update({ where: { id: cashierId }, data: { isActive: false } });
    if (cashier.userId) {
      await prisma.user.delete({ where: { id: cashier.userId } }).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
