import prisma from './prisma';
import { PromoCode, PromoScope } from '@prisma/client';

export type Vertical = 'taxi' | 'food' | 'booking' | 'truck';

const SCOPE_FOR: Record<Vertical, PromoScope> = {
  taxi: 'TAXI',
  food: 'FOOD',
  booking: 'SERVICES',
  truck: 'TRUCK',
};

export interface PromoResult {
  valid: boolean;
  error?: string;
  promo?: PromoCode;
  discount: number; // DZD off (0 when invalid)
  finalAmount: number; // amount after discount
}

// How many DZD a promo takes off a given amount
export function computeDiscount(promo: PromoCode, amount: number): number {
  let discount = 0;
  if (promo.discountType === 'PERCENTAGE') {
    discount = Math.round((amount * promo.discountValue) / 100);
    if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount);
  } else {
    discount = Math.round(promo.discountValue);
  }
  // Never discount more than the amount itself
  return Math.max(0, Math.min(discount, amount));
}

// Validate a code for a vertical + amount + identity WITHOUT consuming it.
// Enforces: exists, active, scope, start date, deadline, total maxUses, per-user limit, min amount.
export async function validatePromo(opts: {
  code: string;
  vertical: Vertical;
  amount: number;
  userId?: string | null;
  clientPhone?: string | null;
}): Promise<PromoResult> {
  const fail = (error: string): PromoResult => ({ valid: false, error, discount: 0, finalAmount: opts.amount });

  if (!opts.code) return fail('No promo code provided');

  const promo = await prisma.promoCode.findUnique({ where: { code: opts.code.trim().toUpperCase() } });
  if (!promo) return fail('Promo code not found');
  if (!promo.isActive) return fail('This promo code is not active');

  const scope = SCOPE_FOR[opts.vertical];
  if (promo.scope !== 'ALL' && promo.scope !== scope) {
    return fail(`This code is not valid for ${opts.vertical}`);
  }

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) return fail('This promo code is not active yet');
  if (promo.expiresAt && now > promo.expiresAt) return fail('This promo code has expired');

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return fail('This promo code has reached its usage limit');
  }

  // Per-user cap (by userId or, for phone bookings, by clientPhone)
  if (promo.maxUsesPerUser > 0 && (opts.userId || opts.clientPhone)) {
    const usedByUser = await prisma.promoRedemption.count({
      where: {
        promoCodeId: promo.id,
        OR: [
          ...(opts.userId ? [{ userId: opts.userId }] : []),
          ...(opts.clientPhone ? [{ clientPhone: opts.clientPhone }] : []),
        ],
      },
    });
    if (usedByUser >= promo.maxUsesPerUser) {
      return fail('You have already used this promo code');
    }
  }

  if (promo.minOrderAmount != null && opts.amount < promo.minOrderAmount) {
    return fail(`Minimum amount for this code is ${promo.minOrderAmount.toLocaleString()} DZD`);
  }

  const discount = computeDiscount(promo, opts.amount);
  if (discount <= 0) return fail('This code gives no discount on this amount');

  return { valid: true, promo, discount, finalAmount: opts.amount - discount };
}

// Consume a code: record redemption + bump usedCount, atomically. Call AFTER creating the ref row.
export async function redeemPromo(opts: {
  promoId: string;
  vertical: Vertical;
  refId: string;
  discount: number;
  userId?: string | null;
  clientPhone?: string | null;
}): Promise<void> {
  await prisma.$transaction([
    prisma.promoRedemption.create({
      data: {
        promoCodeId: opts.promoId,
        userId: opts.userId ?? null,
        clientPhone: opts.clientPhone ?? null,
        scope: SCOPE_FOR[opts.vertical],
        refType: opts.vertical,
        refId: opts.refId,
        discount: opts.discount,
      },
    }),
    prisma.promoCode.update({
      where: { id: opts.promoId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);
}

// Convenience: validate + (if valid) redeem in one call once the ref row exists.
export async function applyPromo(opts: {
  code: string;
  vertical: Vertical;
  amount: number;
  refId: string;
  userId?: string | null;
  clientPhone?: string | null;
}): Promise<PromoResult & { promoId?: string }> {
  const result = await validatePromo(opts);
  if (!result.valid || !result.promo) return result;
  await redeemPromo({
    promoId: result.promo.id,
    vertical: opts.vertical,
    refId: opts.refId,
    discount: result.discount,
    userId: opts.userId,
    clientPhone: opts.clientPhone,
  });
  return { ...result, promoId: result.promo.id };
}
