import prisma from './prisma';
import { getPlatformSettings } from './settings';

// ─── Ride state machine ───
// requested → accepted → driver_arrived → in_ride → completed
// cancellable until in_ride starts; terminal: completed / cancelled_* / expired
export const RIDE_TRANSITIONS: Record<string, string[]> = {
  requested: ['accepted', 'cancelled_by_client', 'cancelled_by_admin', 'expired'],
  accepted: ['driver_arrived', 'cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'],
  driver_arrived: ['in_ride', 'cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'],
  in_ride: ['completed', 'cancelled_by_admin'],
  completed: [],
  cancelled_by_client: [],
  cancelled_by_driver: [],
  cancelled_by_admin: [],
  expired: [],
};

export const RIDE_STATUSES = Object.keys(RIDE_TRANSITIONS);

export function canRideTransition(from: string, to: string, isAdmin: boolean): boolean {
  if (!RIDE_STATUSES.includes(to)) return false;
  if (isAdmin) return true;
  return (RIDE_TRANSITIONS[from] || []).includes(to);
}

export const CANCELLED_STATUSES = ['cancelled_by_client', 'cancelled_by_driver', 'cancelled_by_admin'];

// ─── Ride number: TX-YYYYMMDD-0001 ───
export async function nextRideNumber(): Promise<string> {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `TX-${ymd}-`;
  const count = await prisma.taxiRide.count({ where: { rideNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

// ─── Money: fare estimation + commission ───
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function estimateFare(distanceKm: number | null): Promise<{ estimatedFare: number; base: number; perKm: number; minFare: number }> {
  const s = await getPlatformSettings();
  const base = s.taxiBaseFare;
  const perKm = s.taxiPerKm;
  const minFare = s.taxiMinFare;
  const raw = base + (distanceKm ?? 0) * perKm;
  // Round to the nearest 10 DZD like street pricing
  const estimatedFare = Math.max(minFare, Math.round(raw / 10) * 10);
  return { estimatedFare, base, perKm, minFare };
}

export async function computeCommission(fare: number): Promise<{ percent: number; commissionAmount: number; driverEarnings: number }> {
  const s = await getPlatformSettings();
  const percent = s.taxiCommissionPercent;
  const commissionAmount = Math.round((fare * percent) / 100);
  return { percent, commissionAmount, driverEarnings: fare - commissionAmount };
}

// ─── Anti-scam fraud detection ───
// The scam this targets: a driver and a client match in the app, then one of them
// cancels and they do the ride in cash outside the app — the platform loses its
// commission. We can't see the street, but the data leaves fingerprints:
//   1. a driver who cancels accepted rides again and again
//   2. a client phone that cancels again and again
//   3. the SAME driver+client pair repeatedly matching then cancelling (collusion)
//   4. cancellations that happen AFTER the driver already arrived (classic off-app deal)
// Thresholds:
const DRIVER_CANCEL_ALERT_AT = 3;   // alert admin
const DRIVER_CANCEL_SUSPEND_AT = 5; // auto-suspend
const CLIENT_CANCEL_ALERT_AT = 3;
const PAIR_COLLUSION_AT = 2;        // same driver+client cancelled ≥2 matched rides
const LATE_CANCEL_ALERT_AT = 2;     // cancels after arrival

async function upsertAlert(data: {
  type: 'DRIVER_EXCESSIVE_CANCELLATIONS' | 'CLIENT_EXCESSIVE_CANCELLATIONS' | 'PAIR_COLLUSION' | 'LATE_CANCEL_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  driverId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  rideId?: string;
  message: string;
  details?: object;
  action?: string;
}) {
  // Refresh the existing unresolved alert of the same type/target instead of stacking duplicates
  const existing = await prisma.fraudAlert.findFirst({
    where: {
      type: data.type,
      isResolved: false,
      ...(data.driverId ? { driverId: data.driverId } : {}),
      ...(data.clientPhone && !data.driverId ? { clientPhone: data.clientPhone } : {}),
    },
  });
  if (existing) {
    return prisma.fraudAlert.update({
      where: { id: existing.id },
      data: {
        severity: data.severity,
        message: data.message,
        details: data.details as any,
        rideId: data.rideId,
        ...(data.action && { action: data.action }),
      },
    });
  }
  return prisma.fraudAlert.create({
    data: {
      type: data.type,
      severity: data.severity,
      driverId: data.driverId ?? null,
      clientPhone: data.clientPhone ?? null,
      clientName: data.clientName ?? null,
      rideId: data.rideId,
      message: data.message,
      details: data.details as any,
      ...(data.action && { action: data.action }),
    },
  });
}

// Called after every ride cancellation. Returns any actions taken (for the API response).
export async function runFraudDetection(rideId: string): Promise<{ alerts: string[]; autoSuspended: boolean }> {
  const ride = await prisma.taxiRide.findUnique({ where: { id: rideId }, include: { driver: true } });
  if (!ride || !CANCELLED_STATUSES.includes(ride.status)) return { alerts: [], autoSuspended: false };

  const raised: string[] = [];
  let autoSuspended = false;

  // ── 1+4. Driver-side signals (only when a driver was already matched) ──
  if (ride.driverId) {
    const driverCancels = await prisma.taxiRide.count({
      where: { driverId: ride.driverId, status: 'cancelled_by_driver' },
    });
    const driverMatched = await prisma.taxiRide.count({
      where: { driverId: ride.driverId, status: { notIn: ['requested', 'expired'] } },
    });
    const lateCancels = await prisma.taxiRide.count({
      where: {
        driverId: ride.driverId,
        status: { in: CANCELLED_STATUSES },
        arrivedAt: { not: null },
      },
    });
    const cancelRate = driverMatched > 0 ? Math.round((driverCancels / driverMatched) * 100) : 0;

    if (ride.status === 'cancelled_by_driver' && driverCancels >= DRIVER_CANCEL_ALERT_AT) {
      const willSuspend = driverCancels >= DRIVER_CANCEL_SUSPEND_AT;
      await upsertAlert({
        type: 'DRIVER_EXCESSIVE_CANCELLATIONS',
        severity: willSuspend ? 'HIGH' : 'MEDIUM',
        driverId: ride.driverId,
        rideId: ride.id,
        message: `Driver ${ride.driver?.name ?? ride.driverId} cancelled ${driverCancels} accepted rides (${cancelRate}% of matched rides).${willSuspend ? ' AUTO-SUSPENDED.' : ''}`,
        details: { driverCancels, driverMatched, cancelRate },
        ...(willSuspend && { action: 'auto_suspended' }),
      });
      raised.push('DRIVER_EXCESSIVE_CANCELLATIONS');

      if (willSuspend && ride.driver?.status !== 'SUSPENDED') {
        await prisma.driver.update({ where: { id: ride.driverId }, data: { status: 'SUSPENDED' } });
        autoSuspended = true;
      }
    }

    if (lateCancels >= LATE_CANCEL_ALERT_AT) {
      await upsertAlert({
        type: 'LATE_CANCEL_PATTERN',
        severity: 'HIGH',
        driverId: ride.driverId,
        rideId: ride.id,
        message: `${lateCancels} rides of driver ${ride.driver?.name ?? ''} were cancelled AFTER the driver arrived at pickup — classic off-app cash deal pattern.`,
        details: { lateCancels },
      });
      raised.push('LATE_CANCEL_PATTERN');
    }

    // ── 3. Collusion: same driver + same client phone repeatedly match then cancel ──
    const pairCancels = await prisma.taxiRide.count({
      where: {
        driverId: ride.driverId,
        clientPhone: ride.clientPhone,
        status: { in: CANCELLED_STATUSES },
      },
    });
    if (pairCancels >= PAIR_COLLUSION_AT) {
      await upsertAlert({
        type: 'PAIR_COLLUSION',
        severity: 'HIGH',
        driverId: ride.driverId,
        clientPhone: ride.clientPhone,
        clientName: ride.clientName,
        rideId: ride.id,
        message: `Driver ${ride.driver?.name ?? ''} and client ${ride.clientName} (${ride.clientPhone}) matched and cancelled ${pairCancels} times — they are probably completing rides in cash outside the app.`,
        details: { pairCancels },
      });
      raised.push('PAIR_COLLUSION');
    }
  }

  // ── 2. Client-side signal ──
  if (ride.status === 'cancelled_by_client') {
    const clientCancels = await prisma.taxiRide.count({
      where: { clientPhone: ride.clientPhone, status: 'cancelled_by_client' },
    });
    if (clientCancels >= CLIENT_CANCEL_ALERT_AT) {
      await upsertAlert({
        type: 'CLIENT_EXCESSIVE_CANCELLATIONS',
        severity: 'MEDIUM',
        clientPhone: ride.clientPhone,
        clientName: ride.clientName,
        rideId: ride.id,
        message: `Client ${ride.clientName} (${ride.clientPhone}) cancelled ${clientCancels} rides.`,
        details: { clientCancels },
      });
      raised.push('CLIENT_EXCESSIVE_CANCELLATIONS');
    }
  }

  return { alerts: raised, autoSuspended };
}
