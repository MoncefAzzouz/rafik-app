import prisma from './prisma';
import { MediationMode, CommissionMode, Professional } from '@prisma/client';

export interface EffectiveModes {
  mediationMode: MediationMode;
  commissionMode: CommissionMode;
  commissionPercent: number;
  subscriptionFee: number;
}

// Ensure the singleton settings row exists and return it
export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global' },
  });
}

// Resolve a worker's effective modes: per-worker override wins, otherwise global
export async function getEffectiveModes(
  professional: Pick<
    Professional,
    | 'mediationModeOverride'
    | 'commissionModeOverride'
    | 'commissionPercentOverride'
    | 'subscriptionFeeOverride'
  >
): Promise<EffectiveModes> {
  const global = await getPlatformSettings();
  return {
    mediationMode: professional.mediationModeOverride ?? global.mediationMode,
    commissionMode: professional.commissionModeOverride ?? global.commissionMode,
    commissionPercent: professional.commissionPercentOverride ?? global.commissionPercent,
    subscriptionFee: professional.subscriptionFeeOverride ?? global.subscriptionFee,
  };
}

export async function getEffectiveModesById(professionalId: string): Promise<EffectiveModes | null> {
  const pro = await prisma.professional.findUnique({ where: { id: professionalId } });
  if (!pro) return null;
  return getEffectiveModes(pro);
}
