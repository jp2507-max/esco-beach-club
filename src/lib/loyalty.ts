import type { Profile, RewardTierKey } from '@/lib/types';
import { rewardTierKeys, rewardTierLegacyEscoLifeMember } from '@/lib/types';

export const staffRoles = {
  manager: 'manager',
  staff: 'staff',
} as const;

export type StaffRole = (typeof staffRoles)[keyof typeof staffRoles];

export const rewardBenefitKeys = {
  concierge: 'concierge',
  discountDining: 'discountDining',
  memberEvents: 'memberEvents',
  poolsideDrinks: 'poolsideDrinks',
  priorityBooking: 'priorityBooking',
} as const;

export type RewardBenefitKey =
  (typeof rewardBenefitKeys)[keyof typeof rewardBenefitKeys];

type RewardTierLabelKey = 'shore' | 'cove' | 'horizon' | 'luminary';

export type RewardTierDefinition = {
  hasPrioritySupport: boolean;
  key: RewardTierKey;
  labelKey: RewardTierLabelKey;
  nextTierKey: RewardTierKey | null;
  progressTargetPoints: number;
  unlockedBenefits: readonly RewardBenefitKey[];
};

export const rewardConfig = {
  cashbackPointsPerStep: 1,
  cashbackSpendStepVnd: 50_000,
  currency: 'VND',
  memberQrVersion: 'v1',
  tierProgressWindowMonths: 1,
} as const;

const baseMemberBenefits: readonly RewardBenefitKey[] = [
  rewardBenefitKeys.memberEvents,
  rewardBenefitKeys.discountDining,
];

export const rewardTierDefinitions: Record<
  RewardTierKey,
  RewardTierDefinition
> = {
  [rewardTierKeys.shore]: {
    hasPrioritySupport: false,
    key: rewardTierKeys.shore,
    labelKey: 'shore',
    nextTierKey: rewardTierKeys.cove,
    progressTargetPoints: 0,
    unlockedBenefits: baseMemberBenefits,
  },
  [rewardTierKeys.cove]: {
    hasPrioritySupport: false,
    key: rewardTierKeys.cove,
    labelKey: 'cove',
    nextTierKey: rewardTierKeys.horizon,
    progressTargetPoints: 0,
    unlockedBenefits: baseMemberBenefits,
  },
  [rewardTierKeys.horizon]: {
    hasPrioritySupport: false,
    key: rewardTierKeys.horizon,
    labelKey: 'horizon',
    nextTierKey: rewardTierKeys.luminary,
    progressTargetPoints: 0,
    unlockedBenefits: baseMemberBenefits,
  },
  [rewardTierKeys.luminary]: {
    hasPrioritySupport: true,
    key: rewardTierKeys.luminary,
    labelKey: 'luminary',
    nextTierKey: null,
    progressTargetPoints: 0,
    unlockedBenefits: [
      ...baseMemberBenefits,
      rewardBenefitKeys.poolsideDrinks,
      rewardBenefitKeys.priorityBooking,
      rewardBenefitKeys.concierge,
    ],
  },
};

/** QR payload versions accepted by `parseMemberQrValue` (`esco:member:<version>:...`). */
export const SUPPORTED_MEMBER_QR_VERSIONS = [
  rewardConfig.memberQrVersion,
] as const;

export type MemberQrPayload = {
  memberId: string;
  version: (typeof SUPPORTED_MEMBER_QR_VERSIONS)[number];
};

type TierProgressSnapshot = Pick<
  Profile,
  | 'next_tier_key'
  | 'tier_progress_expires_at'
  | 'tier_progress_points'
  | 'tier_progress_started_at'
  | 'tier_progress_target_points'
>;

export function normalizeRewardTierKey(value: unknown): RewardTierKey {
  if (value === rewardTierKeys.shore) return rewardTierKeys.shore;
  if (value === rewardTierKeys.cove) return rewardTierKeys.cove;
  if (value === rewardTierKeys.horizon) return rewardTierKeys.horizon;
  if (value === rewardTierKeys.luminary) return rewardTierKeys.luminary;
  if (value === rewardTierLegacyEscoLifeMember) return rewardTierKeys.shore;

  return rewardTierKeys.shore;
}

export function getRewardTierDefinition(
  tierKey: RewardTierKey | null | undefined
): RewardTierDefinition {
  return rewardTierDefinitions[normalizeRewardTierKey(tierKey)];
}

export function getRewardTierLabelKey(
  tierKey: RewardTierKey | null | undefined
): RewardTierLabelKey {
  return getRewardTierDefinition(tierKey).labelKey;
}

export function getNextRewardTierKey(
  tierKey: RewardTierKey | null | undefined
): RewardTierKey | null {
  return getRewardTierDefinition(tierKey).nextTierKey;
}

export function hasRewardBenefit(
  tierKey: RewardTierKey | null | undefined,
  benefitKey: RewardBenefitKey
): boolean {
  return getRewardTierDefinition(tierKey).unlockedBenefits.includes(benefitKey);
}

export function hasTierUpgradePath(
  tierKey: RewardTierKey | null | undefined
): boolean {
  const definition = getRewardTierDefinition(tierKey);
  return definition.nextTierKey !== null && definition.progressTargetPoints > 0;
}

export function buildMemberQrValue(memberId: string): string {
  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) return '';
  return `esco:member:${rewardConfig.memberQrVersion}:${trimmedMemberId}`;
}

export function parseMemberQrValue(value: string): MemberQrPayload | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const [prefix, kind, version, ...rest] = trimmedValue.split(':');
  if (prefix !== 'esco' || kind !== 'member' || !version) return null;

  const supportedVersion = SUPPORTED_MEMBER_QR_VERSIONS.find(
    (supported) => supported === version
  );
  if (supportedVersion === undefined) return null;

  const memberId = rest.join(':').trim();
  if (!memberId) return null;

  return {
    memberId,
    version: supportedVersion,
  };
}

export function calculateCashbackPointsForAmountVnd(amountVnd: number): number {
  if (!Number.isFinite(amountVnd) || amountVnd <= 0) return 0;

  const steps = Math.floor(amountVnd / rewardConfig.cashbackSpendStepVnd);
  return steps * rewardConfig.cashbackPointsPerStep;
}

export function isStaffRole(
  value: string | null | undefined
): value is StaffRole {
  return value === staffRoles.staff || value === staffRoles.manager;
}

export function isManagerRole(value: string | null | undefined): boolean {
  return value === staffRoles.manager;
}

export function formatCurrencyVnd(amountVnd: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: rewardConfig.currency,
  }).format(amountVnd);
}

export function addMonthsClamped(baseDate: Date, monthsToAdd: number): Date {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth() + monthsToAdd;
  const day = baseDate.getUTCDate();
  const hours = baseDate.getUTCHours();
  const minutes = baseDate.getUTCMinutes();
  const seconds = baseDate.getUTCSeconds();
  const milliseconds = baseDate.getUTCMilliseconds();

  const normalizedYear = year + Math.floor(month / 12);
  const normalizedMonth = ((month % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(normalizedYear, normalizedMonth + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(
    Date.UTC(
      normalizedYear,
      normalizedMonth,
      clampedDay,
      hours,
      minutes,
      seconds,
      milliseconds
    )
  );
}

export function createTierProgressExpiryAt(startedAt: Date): string {
  return addMonthsClamped(
    startedAt,
    rewardConfig.tierProgressWindowMonths
  ).toISOString();
}

export function isTierProgressExpired(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;

  const parsedExpiry = new Date(expiresAt);
  if (Number.isNaN(parsedExpiry.getTime())) return false;

  return now.getTime() >= parsedExpiry.getTime();
}

export function reconcileTierProgressSnapshot(
  snapshot: TierProgressSnapshot,
  now: Date = new Date()
): TierProgressSnapshot {
  if (!isTierProgressExpired(snapshot.tier_progress_expires_at, now)) {
    return snapshot;
  }

  return {
    ...snapshot,
    tier_progress_expires_at: null,
    tier_progress_points: 0,
    tier_progress_started_at: null,
  };
}

export function getActiveTierProgressPoints(
  snapshot: TierProgressSnapshot,
  now: Date = new Date()
): number {
  return reconcileTierProgressSnapshot(snapshot, now).tier_progress_points;
}

export function getTierProgressPercent(
  snapshot: TierProgressSnapshot,
  now: Date = new Date()
): number {
  const activePoints = getActiveTierProgressPoints(snapshot, now);
  const targetPoints =
    snapshot.tier_progress_target_points > 0
      ? snapshot.tier_progress_target_points
      : 0;

  if (targetPoints === 0) return 0;

  return Math.min((activePoints / targetPoints) * 100, 100);
}
