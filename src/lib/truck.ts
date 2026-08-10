import prisma from './prisma';
import { getPlatformSettings } from './settings';

// ─── Truck freight state machine ───
// requested → accepted → arrived (at pickup) → loading → in_transit → delivered
// cancellable until in_transit; terminal: delivered / cancelled_* / expired
export const TRUCK_TRANSITIONS: Record<string, string[]> = {
  requested: ['accepted', 'cancelled_by_client', 'cancelled_by_admin', 'expired'],
  accepted: ['arrived', 'cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'],
  arrived: ['loading', 'cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'],
  loading: ['in_transit', 'cancelled_by_driver', 'cancelled_by_admin'],
  in_transit: ['delivered', 'cancelled_by_admin'],
  delivered: [],
  cancelled_by_client: [],
  cancelled_by_driver: [],
  cancelled_by_admin: [],
  expired: [],
};

export const TRUCK_STATUSES = Object.keys(TRUCK_TRANSITIONS);
export const TRUCK_CANCELLED = ['cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'];

export function canTruckTransition(from: string, to: string, isAdmin: boolean): boolean {
  if (!TRUCK_STATUSES.includes(to)) return false;
  if (isAdmin) return true;
  return (TRUCK_TRANSITIONS[from] || []).includes(to);
}

// ─── Order number: TRK-YYYYMMDD-0001 ───
export async function nextTruckOrderNumber(): Promise<string> {
  const t = new Date();
  const ymd = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`;
  const prefix = `TRK-${ymd}-`;
  const count = await prisma.truckOrder.count({ where: { orderNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
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

// ─── Editable pricing formula ───
// price = max( truckMinFare, round( (destinationWilayaPrice + truckBaseFare + km × truckPerKm) × typeMultiplier ) )
// Example: Alger price 5000, 300 km, 10 DZD/km, base 0, multiplier 1 -> 5000 + 3000 = 8000 DZD.
// Levers: per-wilaya price (TruckWilaya), perKm/min/base (truck config), typeMultiplier (per TruckType).
export async function estimateTruckPrice(opts: {
  distanceKm: number | null;
  typeMultiplier?: number | null;
  wilayaPrice?: number | null;
}): Promise<{ estimatedPrice: number; base: number; perKm: number; minFare: number; wilayaPrice: number }> {
  const s = await getPlatformSettings();
  const base = s.truckBaseFare;
  const perKm = s.truckPerKm;
  const minFare = s.truckMinFare;
  const wilayaPrice = opts.wilayaPrice ?? 0;
  const multiplier = opts.typeMultiplier ?? 1;
  const raw = (wilayaPrice + base + (opts.distanceKm ?? 0) * perKm) * multiplier;
  const estimatedPrice = Math.max(minFare, Math.round(raw / 10) * 10);
  return { estimatedPrice, base, perKm, minFare, wilayaPrice };
}

// Look up a wilaya's configured freight price by its name (used at order time).
export async function wilayaPriceByName(name: string | null | undefined): Promise<number> {
  if (!name) return 0;
  const w = await prisma.truckWilaya.findFirst({ where: { name } });
  return w?.price ?? 0;
}

// Commission at completion: PERCENTAGE takes a cut per job; SUBSCRIPTION means the
// driver keeps 100% (they pay a fixed monthly fee to the platform instead).
export async function computeTruckCommission(price: number): Promise<{
  mode: string; percent: number; commissionAmount: number; driverEarnings: number;
}> {
  const s = await getPlatformSettings();
  if (s.truckCommissionMode === 'SUBSCRIPTION') {
    return { mode: 'SUBSCRIPTION', percent: 0, commissionAmount: 0, driverEarnings: price };
  }
  const percent = s.truckCommissionPercent;
  const commissionAmount = Math.round((price * percent) / 100);
  return { mode: 'PERCENTAGE', percent, commissionAmount, driverEarnings: price - commissionAmount };
}

// Next TRK-#### truck code
export async function nextTruckCode(): Promise<string> {
  const count = await prisma.truck.count();
  return `TRK-${String(count + 1).padStart(4, '0')}`;
}
