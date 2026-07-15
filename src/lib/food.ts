import prisma from './prisma';
import { getPlatformSettings } from './settings';

// ── Order status state machine (mirrors Tawsil's Order.canTransitionTo) ──
// pending → accepted → preparing → assigned → arrived → delivering → delivered
// declined / cancelled are terminal. Pickup skips driver stages.
export const FOOD_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['preparing', 'assigned', 'cancelled'],
  preparing: ['assigned', 'delivered', 'cancelled'], // delivered directly for PICKUP
  assigned: ['arrived', 'delivering', 'preparing', 'cancelled'], // back to preparing on driver-cancel
  arrived: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  declined: [],
  cancelled: [],
};

export const FOOD_ORDER_STATUSES = Object.keys(FOOD_ORDER_TRANSITIONS);

export function canFoodTransition(from: string, to: string, isAdmin: boolean): boolean {
  if (!FOOD_ORDER_STATUSES.includes(to)) return false;
  if (isAdmin) return true; // admin can force any known status
  const allowed = FOOD_ORDER_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

// Order number: DEL-YYYYMMDD-#### for delivery, PKP-... for pickup (Tawsil format)
export async function generateFoodOrderNumber(orderType: 'DELIVERY' | 'PICKUP'): Promise<string> {
  const prefix = orderType === 'PICKUP' ? 'PKP' : 'DEL';
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const todayCount = await prisma.foodOrder.count({
    where: { orderNumber: { startsWith: `${prefix}-${ymd}` } },
  });
  return `${prefix}-${ymd}-${String(todayCount + 1).padStart(4, '0')}`;
}

// ── Delivery fee: base + distanceKm × perKm, clamped (Tawsil formula) ──
export async function computeDeliveryFee(orderType: string, distanceKm?: number | null): Promise<number> {
  if (orderType === 'PICKUP') return 0;
  const settings = await getPlatformSettings();
  const base = settings.foodDeliveryFeeBase ?? 200;
  const perKm = settings.foodDeliveryFeePerKm ?? 0;
  const fee = Math.round(base + (distanceKm ?? 0) * perKm);
  return Math.min(Math.max(fee, 0), 10000);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Restaurant subscription tier grid (Tawsil defaults) ──
export interface SubscriptionTier {
  minRevenue: number;
  maxRevenue: number | null; // null = open-ended
  fee: number;
}

export const DEFAULT_SUBSCRIPTION_GRID: SubscriptionTier[] = [
  { minRevenue: 0, maxRevenue: 30000, fee: 0 },
  { minRevenue: 30000, maxRevenue: 60000, fee: 6000 },
  { minRevenue: 60000, maxRevenue: 90000, fee: 10000 },
  { minRevenue: 90000, maxRevenue: null, fee: 14000 },
];

// Beyond the last tier: +4000 DA per additional 50000 DA of revenue (Tawsil progressive step)
const PROGRESSIVE_STEP_REVENUE = 50000;
const PROGRESSIVE_STEP_FEE = 4000;

export async function getSubscriptionGrid(): Promise<SubscriptionTier[]> {
  const settings = await getPlatformSettings();
  const grid = settings.restaurantSubscriptionGrid as SubscriptionTier[] | null;
  return Array.isArray(grid) && grid.length > 0 ? grid : DEFAULT_SUBSCRIPTION_GRID;
}

export function computeSubscription(revenue: number, grid: SubscriptionTier[]): { tierLevel: number; fee: number } {
  for (let i = 0; i < grid.length; i++) {
    const tier = grid[i];
    if (revenue >= tier.minRevenue && (tier.maxRevenue === null || revenue < tier.maxRevenue)) {
      let fee = tier.fee;
      // progressive step past the open-ended last tier
      if (tier.maxRevenue === null && revenue > tier.minRevenue) {
        const extra = Math.floor((revenue - tier.minRevenue) / PROGRESSIVE_STEP_REVENUE);
        fee += extra * PROGRESSIVE_STEP_FEE;
      }
      return { tierLevel: i + 1, fee };
    }
  }
  return { tierLevel: 1, fee: 0 };
}

// Next sequential code like DRV-0001 / CSH-0001 (max existing + 1, deletion-safe)
export async function nextCode(prefix: 'DRV' | 'CSH'): Promise<string> {
  let lastCode: string | null = null;
  if (prefix === 'DRV') {
    const last = await prisma.driver.findFirst({ orderBy: { driverCode: 'desc' } });
    lastCode = last?.driverCode ?? null;
  } else {
    const last = await prisma.cashier.findFirst({ orderBy: { cashierCode: 'desc' } });
    lastCode = last?.cashierCode ?? null;
  }
  const lastNum = lastCode ? parseInt(lastCode.split('-')[1], 10) || 0 : 0;
  return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`;
}
