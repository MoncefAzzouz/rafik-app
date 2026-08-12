import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import {
  canFoodTransition, FOOD_ORDER_STATUSES, generateFoodOrderNumber,
  computeDeliveryFee, haversineKm,
} from '../lib/food';
import { validatePromo, redeemPromo, PromoResult } from '../lib/promo';
import { adminAlert, emailUser, lead, infoTable, pRow } from '../lib/notify';

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

const PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'BARIDI_MOB', 'BANK_TRANSFER'];

const ORDER_INCLUDE = {
  restaurant: { select: { id: true, name: true, phone: true, address: true, commune: true, wilaya: true, lat: true, lng: true, image: true } },
  driver: { select: { id: true, driverCode: true, name: true, phone: true, status: true, vehicleType: true, rating: true } },
  items: { include: { menuItem: { select: { name: true, image: true } }, additions: { include: { addition: { select: { name: true } } } } } },
  statusHistory: { orderBy: { timestamp: 'asc' as const } },
};

// Which roles may act on an order at each step
async function canActOnOrder(req: Request, order: { restaurantId: string; driverId: string | null; clientId: string | null }): Promise<'admin' | 'restaurant' | 'driver' | 'client' | null> {
  const user = getUser(req);
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'RESTAURANT') {
    const r = await prisma.restaurant.findUnique({ where: { userId: user.userId } });
    if (r && r.id === order.restaurantId) return 'restaurant';
  }
  if (user.role === 'CASHIER') {
    const c = await prisma.cashier.findUnique({ where: { userId: user.userId } });
    if (c && c.restaurantId === order.restaurantId) return 'restaurant';
  }
  if (user.role === 'DRIVER') {
    const d = await prisma.driver.findUnique({ where: { userId: user.userId } });
    if (d && d.id === order.driverId) return 'driver';
  }
  if (user.role === 'CLIENT' && order.clientId === user.userId) return 'client';
  return null;
}

const FOOD_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', declined: 'Declined', preparing: 'Preparing',
  ready: 'Ready', assigned: 'Driver assigned', arrived: 'Driver at restaurant',
  delivering: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

async function moveStatus(orderId: string, status: string, extra: Record<string, unknown> = {}) {
  const [, order] = await prisma.$transaction([
    prisma.foodOrderStatusHistory.create({ data: { orderId, status } }),
    prisma.foodOrder.update({ where: { id: orderId }, data: { status, ...extra }, include: ORDER_INCLUDE }),
  ]);
  // Notify on every state change: client (email) + admins (bell + email).
  const label = FOOD_STATUS_LABEL[status] || status;
  const html = lead(`Food order status is now: <b>${label}</b>.`) + infoTable([
    pRow('Order', order.orderNumber),
    pRow('Restaurant', (order as any).restaurant?.name),
    pRow('Client', `${order.clientName} · ${order.clientPhone}`),
    pRow('Total', `${order.totalAmount} DZD`),
  ]);
  void emailUser(order.clientId, `Your food order ${order.orderNumber}: ${label}`, html);
  void adminAlert({ title: `Food order ${order.orderNumber} → ${label}`, body: order.clientName, type: 'food_order', vertical: 'food', event: status, refId: order.id, link: '/food/orders', emailHtml: html });
  return order;
}

// ── GET all food orders (admin / restaurant scoped; filters ?status=&restaurantId=&driverId=) ──
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { status, restaurantId, driverId } = req.query;
  const user = getUser(req);
  try {
    let scope: Record<string, unknown> = {};
    if (user.role === 'RESTAURANT') {
      const r = await prisma.restaurant.findUnique({ where: { userId: user.userId } });
      if (!r) { res.json([]); return; }
      scope = { restaurantId: r.id };
    } else if (user.role === 'CASHIER') {
      const c = await prisma.cashier.findUnique({ where: { userId: user.userId } });
      if (!c) { res.json([]); return; }
      scope = { restaurantId: c.restaurantId };
    } else if (user.role === 'DRIVER') {
      const d = await prisma.driver.findUnique({ where: { userId: user.userId } });
      if (!d) { res.json([]); return; }
      scope = { driverId: d.id };
    } else if (user.role === 'CLIENT') {
      scope = { clientId: user.userId };
    }
    const orders = await prisma.foodOrder.findMany({
      where: {
        ...scope,
        ...(status && { status: status as string }),
        ...(restaurantId && user.role === 'ADMIN' && { restaurantId: restaurantId as string }),
        ...(driverId && user.role === 'ADMIN' && { driverId: driverId as string }),
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET single order ──
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id: req.params.id as string }, include: ORDER_INCLUDE });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST create order (admin, client, or cashier) ──
// body: { restaurantId, orderType, clientName, clientPhone, deliveryAddress, deliveryWilaya, deliveryCommune,
//         deliveryLat?, deliveryLng?, deliveryInstructions?, paymentMethod?,
//         items: [{ menuItemId, quantity, specialInstructions?, additionIds?: [] }] }
router.post('/', authenticateToken, requireRole('ADMIN', 'CLIENT', 'CASHIER', 'RESTAURANT'), async (req: Request, res: Response) => {
  const {
    restaurantId, orderType, clientName, clientPhone, deliveryAddress, deliveryWilaya, deliveryCommune,
    deliveryLat, deliveryLng, deliveryInstructions, paymentMethod, items, promoCode,
  } = req.body;
  const user = getUser(req);

  const type = orderType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
  if (!restaurantId || !clientName || !clientPhone || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'restaurantId, clientName, clientPhone and at least one item are required' });
    return;
  }
  if (type === 'DELIVERY' && !deliveryAddress) {
    res.status(400).json({ error: 'deliveryAddress is required for delivery orders' });
    return;
  }
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    res.status(400).json({ error: `paymentMethod must be one of ${PAYMENT_METHODS.join(', ')}` });
    return;
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) { res.status(404).json({ error: 'Restaurant not found' }); return; }
    if (restaurant.status !== 'APPROVED' && user.role !== 'ADMIN') {
      res.status(400).json({ error: 'Restaurant is not approved yet' });
      return;
    }

    // Price everything server-side from the menu (never trust client prices)
    let subtotal = 0;
    const preparedItems: {
      menuItemId: string; quantity: number; unitPrice: number; totalPrice: number;
      specialInstructions: string | null;
      additions: { additionId: string; quantity: number; unitPrice: number; totalPrice: number }[];
    }[] = [];

    for (const raw of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: raw.menuItemId }, include: { additions: true } });
      if (!menuItem || menuItem.restaurantId !== restaurantId) {
        res.status(400).json({ error: `Menu item ${raw.menuItemId} not found in this restaurant` });
        return;
      }
      if (!menuItem.isAvailable) {
        res.status(400).json({ error: `"${menuItem.name}" is not available right now` });
        return;
      }
      const qty = Math.max(1, parseInt(raw.quantity) || 1);
      const additions: { additionId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];
      let additionsTotal = 0;
      for (const addId of raw.additionIds || []) {
        const add = menuItem.additions.find(a => a.id === addId);
        if (!add || !add.isAvailable) continue;
        additions.push({ additionId: add.id, quantity: 1, unitPrice: add.price, totalPrice: add.price });
        additionsTotal += add.price;
      }
      const itemTotal = menuItem.price * qty + additionsTotal * qty;
      subtotal += itemTotal;
      preparedItems.push({
        menuItemId: menuItem.id,
        quantity: qty,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        specialInstructions: raw.specialInstructions || null,
        additions: additions.map(a => ({ ...a, quantity: qty, totalPrice: a.unitPrice * qty })),
      });
    }

    // Delivery fee = base + km × perKm (distance from coordinates when available)
    let distanceKm: number | null = null;
    if (type === 'DELIVERY' && deliveryLat != null && deliveryLng != null && restaurant.lat != null && restaurant.lng != null) {
      distanceKm = Math.round(haversineKm(restaurant.lat, restaurant.lng, parseFloat(deliveryLat), parseFloat(deliveryLng)) * 100) / 100;
    }
    const deliveryFee = await computeDeliveryFee(type, distanceKm);

    // Optional promo code discounts the (subtotal + delivery) total
    const grossTotal = subtotal + deliveryFee;
    let promoDiscount = 0;
    let promoValidation: PromoResult | null = null;
    if (promoCode) {
      promoValidation = await validatePromo({
        code: promoCode as string, vertical: 'food', amount: grossTotal,
        userId: user.userId, clientPhone: clientPhone as string,
      });
      if (!promoValidation.valid) {
        res.status(400).json({ error: promoValidation.error || 'Invalid promo code' });
        return;
      }
      promoDiscount = promoValidation.discount;
    }
    const totalAmount = grossTotal - promoDiscount;

    const orderNumber = await generateFoodOrderNumber(type);
    const cashier = user.role === 'CASHIER'
      ? await prisma.cashier.findUnique({ where: { userId: user.userId } })
      : null;

    const order = await prisma.foodOrder.create({
      data: {
        orderNumber,
        clientId: user.role === 'CLIENT' ? user.userId : null,
        createdByCashierId: cashier?.id ?? null,
        restaurantId,
        orderType: type,
        clientName,
        clientPhone,
        deliveryAddress: deliveryAddress || null,
        deliveryWilaya: deliveryWilaya || null,
        deliveryCommune: deliveryCommune || null,
        deliveryLat: deliveryLat != null ? parseFloat(deliveryLat) : null,
        deliveryLng: deliveryLng != null ? parseFloat(deliveryLng) : null,
        deliveryInstructions: deliveryInstructions || null,
        paymentMethod: (paymentMethod as any) || 'CASH_ON_DELIVERY',
        subtotal,
        deliveryFee,
        deliveryDistance: distanceKm,
        promoDiscount,
        promoCodeId: promoValidation?.promo?.id ?? null,
        totalAmount,
        statusHistory: { create: { status: 'pending' } },
        items: {
          create: preparedItems.map(it => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            specialInstructions: it.specialInstructions,
            additions: { create: it.additions },
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    // Consume the promo now that the order exists
    if (promoValidation?.valid && promoValidation.promo) {
      await redeemPromo({
        promoId: promoValidation.promo.id, vertical: 'food', refId: order.id,
        discount: promoDiscount, userId: user.userId, clientPhone: clientPhone as string,
      });
    }

    void adminAlert({ title: `🍕 New food order ${order.orderNumber}`, body: `${order.clientName} · ${(order as any).restaurant?.name || ''}`, type: 'food_order', vertical: 'food', event: 'new', refId: order.id, link: '/food/orders', emailHtml: lead('A new food order was placed.') + infoTable([
      pRow('Order', order.orderNumber),
      pRow('Restaurant', (order as any).restaurant?.name),
      pRow('Client', `${order.clientName} · ${order.clientPhone}`),
      pRow('Type', order.orderType),
      pRow('Total', `${order.totalAmount} DZD`),
    ]) });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Lifecycle actions ──

// Accept (restaurant/cashier/admin): pending → accepted
router.post('/:id/accept', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { prepTime } = req.body;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client' || actor === 'driver') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'accepted', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot accept while status is "${order.status}"` });
      return;
    }
    const updated = await moveStatus(id, 'accepted', {
      acceptedAt: new Date(),
      ...(prepTime && { prepTime: parseInt(prepTime) }),
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Decline (restaurant/cashier/admin, reason required): pending → declined
router.post('/:id/decline', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const user = getUser(req);
  if (!reason || !`${reason}`.trim()) { res.status(400).json({ error: 'A decline reason is required' }); return; }
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client' || actor === 'driver') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'declined', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot decline while status is "${order.status}"` });
      return;
    }
    const updated = await moveStatus(id, 'declined', { declineReason: `${reason}`.trim() });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start preparing: accepted → preparing
router.post('/:id/preparing', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client' || actor === 'driver') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'preparing', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot start preparing while status is "${order.status}"` });
      return;
    }
    const updated = await moveStatus(id, 'preparing', { preparingAt: new Date() });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign driver (delivery) — or complete directly for pickup: preparing → assigned | delivered
router.post('/:id/assign-driver', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { driverId } = req.body;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client' || actor === 'driver') { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    // Pickup orders skip drivers: mark delivered directly (Tawsil behavior)
    if (order.orderType === 'PICKUP') {
      if (!canFoodTransition(order.status, 'delivered', user.role === 'ADMIN')) {
        res.status(400).json({ error: `Cannot complete pickup while status is "${order.status}"` });
        return;
      }
      const updated = await moveStatus(id, 'delivered', { deliveredAt: new Date() });
      res.json(updated);
      return;
    }

    if (!driverId) { res.status(400).json({ error: 'driverId is required for delivery orders' }); return; }
    if (!canFoodTransition(order.status, 'assigned', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot assign a driver while status is "${order.status}"` });
      return;
    }

    // Driver eligibility (Tawsil rules): active + verified + not suspended + under capacity
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { orders: { where: { status: { in: ['assigned', 'arrived', 'delivering'] } }, select: { id: true } } },
    });
    if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
    if (!driver.isActive || driver.status === 'SUSPENDED') { res.status(400).json({ error: 'Driver is suspended or inactive' }); return; }
    if (!driver.isVerified) { res.status(400).json({ error: 'Driver is not verified yet' }); return; }
    if (driver.orders.length >= driver.maxOrdersCapacity) {
      res.status(400).json({ error: `Driver is at capacity (${driver.orders.length}/${driver.maxOrdersCapacity} orders)` });
      return;
    }

    const updated = await moveStatus(id, 'assigned', { driverId, assignedAt: new Date() });
    // Driver becomes busy while carrying orders
    await prisma.driver.update({ where: { id: driverId }, data: { status: 'BUSY' } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Driver arrived at restaurant: assigned → arrived
router.post('/:id/arrived', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'arrived', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot mark arrived while status is "${order.status}"` });
      return;
    }
    res.json(await moveStatus(id, 'arrived', { arrivedAt: new Date() }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start delivery: arrived/assigned → delivering
router.post('/:id/start-delivery', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'delivering', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot start delivery while status is "${order.status}"` });
      return;
    }
    res.json(await moveStatus(id, 'delivering', { deliveringAt: new Date() }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete delivery: delivering → delivered (frees the driver, counts the delivery)
router.post('/:id/complete-delivery', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (!actor || actor === 'client') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!canFoodTransition(order.status, 'delivered', user.role === 'ADMIN')) {
      res.status(400).json({ error: `Cannot complete while status is "${order.status}"` });
      return;
    }
    const updated = await moveStatus(id, 'delivered', { deliveredAt: new Date() });
    if (order.driverId) {
      const remaining = await prisma.foodOrder.count({
        where: { driverId: order.driverId, status: { in: ['assigned', 'arrived', 'delivering'] } },
      });
      await prisma.driver.update({
        where: { id: order.driverId },
        data: { totalDeliveries: { increment: 1 }, ...(remaining === 0 && { status: 'AVAILABLE' }) },
      });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Driver cancels an assignment: order goes back to preparing, counter increments (admin alerted at 3+)
router.post('/:id/driver-cancel', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const actor = await canActOnOrder(req, order);
    if (actor !== 'driver' && actor !== 'admin') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    if (!order.driverId || !['assigned', 'arrived'].includes(order.status)) {
      res.status(400).json({ error: `Cannot cancel assignment while status is "${order.status}"` });
      return;
    }
    const driverId = order.driverId;
    const updated = await moveStatus(id, 'preparing', { driverId: null, assignedAt: null, arrivedAt: null });
    const remaining = await prisma.foodOrder.count({
      where: { driverId, status: { in: ['assigned', 'arrived', 'delivering'] } },
    });
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { cancellationCount: { increment: 1 }, ...(remaining === 0 && { status: 'AVAILABLE' }) },
    });
    res.json({ ...updated, driverCancellations: driver.cancellationCount, adminAlert: driver.cancellationCount >= 3 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin force-cancel: any non-terminal status → cancelled
router.post('/:id/cancel', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (['delivered', 'declined', 'cancelled'].includes(order.status)) {
      res.status(400).json({ error: `Order is already ${order.status}` });
      return;
    }
    const updated = await moveStatus(id, 'cancelled', { declineReason: reason ? `${reason}`.trim() : null });
    if (order.driverId) {
      const remaining = await prisma.foodOrder.count({
        where: { driverId: order.driverId, status: { in: ['assigned', 'arrived', 'delivering'] } },
      });
      if (remaining === 0) {
        await prisma.driver.update({ where: { id: order.driverId }, data: { status: 'AVAILABLE' } });
      }
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rate restaurant & driver after delivery (client or admin relaying)
router.post('/:id/rate', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { restaurantRating, driverRating, restaurantComment, driverComment } = req.body;
  const user = getUser(req);
  try {
    const order = await prisma.foodOrder.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (user.role !== 'ADMIN' && order.clientId !== user.userId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (order.status !== 'delivered') { res.status(400).json({ error: 'Only delivered orders can be rated' }); return; }

    const updated = await prisma.foodOrder.update({
      where: { id },
      data: {
        ...(restaurantRating !== undefined && { restaurantRating: parseFloat(restaurantRating) }),
        ...(driverRating !== undefined && { driverRating: parseFloat(driverRating) }),
        ...(restaurantComment !== undefined && { restaurantComment }),
        ...(driverComment !== undefined && { driverComment }),
      },
      include: ORDER_INCLUDE,
    });

    // Recompute averages
    if (restaurantRating !== undefined) {
      const agg = await prisma.foodOrder.aggregate({
        where: { restaurantId: order.restaurantId, restaurantRating: { not: null } },
        _avg: { restaurantRating: true },
      });
      await prisma.restaurant.update({
        where: { id: order.restaurantId },
        data: { rating: Math.round((agg._avg.restaurantRating ?? 0) * 10) / 10 },
      });
    }
    if (driverRating !== undefined && order.driverId) {
      const agg = await prisma.foodOrder.aggregate({
        where: { driverId: order.driverId, driverRating: { not: null } },
        _avg: { driverRating: true },
      });
      await prisma.driver.update({
        where: { id: order.driverId },
        data: { rating: Math.round((agg._avg.driverRating ?? 0) * 10) / 10 },
      });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
