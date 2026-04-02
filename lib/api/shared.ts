import type {
  OnboardingPermissionStatus,
  Profile,
  RewardTransaction,
} from '@/lib/types';
import { onboardingPermissionStatuses, rewardTierKeys } from '@/lib/types';
import type { InstantRecord } from '@/src/lib/mappers';
import { rewardServiceResponseSchema } from '@/src/lib/reward-backend-contract';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

export function nowIso(): string {
  return new Date().toISOString();
}

export function getRewardServiceEndpoint(): string {
  const endpoint =
    process.env.EXPO_PUBLIC_REWARD_SERVICE_URL?.trim() ||
    process.env.EXPO_PUBLIC_TRUSTED_LOYALTY_AWARD_URL?.trim();
  if (!endpoint) {
    throw new Error('rewardServiceUnavailable');
  }

  return endpoint;
}

export function normalizeMemberSince(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  const isValidDate = !Number.isNaN(parsed.getTime());

  if (isValidDate) {
    return parsed.toISOString();
  }

  const dateOnly = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly.toISOString();
  }

  return undefined;
}

export function normalizeDateOfBirth(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return undefined;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    normalizedDate.getUTCFullYear() === year &&
    normalizedDate.getUTCMonth() === month - 1 &&
    normalizedDate.getUTCDate() === day;

  return isValidDate ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

export function normalizeOnboardingCompletedAt(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function normalizePermissionStatus(
  value: string | undefined
): OnboardingPermissionStatus | undefined {
  if (value === undefined) return undefined;

  const normalized = value.trim().toUpperCase();
  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  if (normalized === onboardingPermissionStatuses.undetermined) {
    return onboardingPermissionStatuses.undetermined;
  }

  return undefined;
}

export function buildProfileId(userId: string): string {
  return userId;
}

export function buildMemberId(userId: string): string {
  return `ESCO-${userId.replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

export function buildReferralCode(userId: string): string {
  // Second half of UUID hex (disjoint from buildMemberId's slice(0,16)); 16 chars entropy.
  return `ESCO-${userId.replace(/-/g, '').slice(16, 32).toUpperCase()}`;
}

export function isMemberIdConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('member_id') || message.includes('"member_id"'))
  );
}

export function isReferralCodeConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('referral_code') || message.includes('"referral_code"'))
  );
}

export function isProfileIdConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('profiles.id') ||
      message.includes('"profiles.id"') ||
      message.includes('primary key'))
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isInstantRecord(value: unknown): value is InstantRecord {
  return isRecord(value) && typeof value.id === 'string';
}

export function firstInstantRecord(value: unknown): InstantRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isInstantRecord(first) ? first : null;
  }

  return isInstantRecord(value) ? value : null;
}

export type RewardServiceApiResponse = {
  cashbackPointsDelta: number;
  member: Profile;
  tierProgressPointsDelta: number;
  transaction: RewardTransaction;
};

function normalizeNullableIsoDateTime(
  value: string | null | undefined
): string | null {
  const normalized = normalizeOnboardingCompletedAt(value);
  return normalized ?? null;
}

function normalizeRequiredIsoDateTime(value: string): string | null {
  const normalized = normalizeOnboardingCompletedAt(value);
  if (!normalized) {
    console.warn('Invalid required ISO datetime:', value);
  }
  return normalized ?? null;
}

export function parseRewardServiceResponse(
  value: unknown
): RewardServiceApiResponse | null {
  const parsed = rewardServiceResponseSchema.safeParse(value);
  if (!parsed.success) {
    console.warn(
      'Failed to parse reward service response:',
      parsed.error.issues
    );
    return null;
  }

  const { cashbackPointsDelta, member, tierProgressPointsDelta, transaction } =
    parsed.data;

  const createdAt = normalizeRequiredIsoDateTime(transaction.created_at);
  const occurredAt = normalizeRequiredIsoDateTime(transaction.occurred_at);
  const updatedAt = normalizeRequiredIsoDateTime(transaction.updated_at);

  if (!createdAt || !occurredAt || !updatedAt) {
    return null;
  }

  return {
    cashbackPointsDelta,
    member: {
      ...member,
      auth_provider: null,
      date_of_birth: normalizeDateOfBirth(member.date_of_birth) ?? null,
      member_segment: member.member_segment
        ? (normalizeMemberSegment(member.member_segment) ?? null)
        : null,
      member_since:
        normalizeMemberSince(member.member_since) ?? member.member_since,
      onboarding_completed_at: normalizeNullableIsoDateTime(
        member.onboarding_completed_at
      ),
      tier_progress_expires_at: normalizeNullableIsoDateTime(
        member.tier_progress_expires_at
      ),
      tier_progress_started_at: normalizeNullableIsoDateTime(
        member.tier_progress_started_at
      ),
      location_permission_status:
        normalizePermissionStatus(member.location_permission_status) ??
        onboardingPermissionStatuses.undetermined,
      push_notification_permission_status:
        normalizePermissionStatus(member.push_notification_permission_status) ??
        onboardingPermissionStatuses.undetermined,
    },
    tierProgressPointsDelta,
    transaction: {
      ...transaction,
      created_at: createdAt,
      occurred_at: occurredAt,
      reference: transaction.reference ?? null,
      updated_at: updatedAt,
    },
  };
}

export function withoutUndefined<T extends Record<string, unknown>>(
  value: T
): Partial<T> {
  const entries = Object.entries(value).filter(([, current]) => {
    return current !== undefined;
  });
  return Object.fromEntries(entries) as Partial<T>;
}

export type DefaultProfileValues = {
  bio: string;
  cashback_points_balance: number;
  cashback_points_lifetime_earned: number;
  created_at: string;
  date_of_birth: string | null;
  full_name: string;
  has_seen_welcome_voucher: boolean;
  lifetime_tier_key: Profile['lifetime_tier_key'];
  location_permission_status: OnboardingPermissionStatus;
  member_id: string;
  member_segment: Profile['member_segment'];
  member_since: string;
  next_tier_key: Profile['next_tier_key'];
  nights_left: number;
  onboarding_completed_at: string | null;
  push_notification_permission_status: OnboardingPermissionStatus;
  referral_code: string;
  saved: number;
  tier_progress_expires_at: string | null;
  tier_progress_points: number;
  tier_progress_started_at: string | null;
  tier_progress_target_points: number;
  updated_at: string;
};

export function getDefaultProfileValues(options: {
  userId: string;
  email?: string;
  displayName?: string;
  dateOfBirth?: string;
  referralCode?: string;
}): DefaultProfileValues {
  const { userId, email, displayName, dateOfBirth, referralCode } = options;
  const createdAt = nowIso();
  const normalizedDisplayName = displayName?.trim() ?? '';
  const emailPrefix = email?.split('@')[0]?.trim() ?? '';
  const fallbackDisplayName = emailPrefix
    ? emailPrefix
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
  const normalizedDateOfBirth = normalizeDateOfBirth(dateOfBirth);

  return {
    bio: '',
    cashback_points_balance: 0,
    cashback_points_lifetime_earned: 0,
    created_at: createdAt,
    date_of_birth: normalizedDateOfBirth ?? null,
    full_name: normalizedDisplayName || fallbackDisplayName,
    has_seen_welcome_voucher: false,
    lifetime_tier_key: rewardTierKeys.escoLifeMember,
    location_permission_status: onboardingPermissionStatuses.undetermined,
    member_id: buildMemberId(userId),
    member_segment: null,
    member_since: createdAt,
    next_tier_key: null,
    nights_left: 0,
    onboarding_completed_at: null,
    push_notification_permission_status:
      onboardingPermissionStatuses.undetermined,
    referral_code: referralCode ?? buildReferralCode(userId),
    saved: 0,
    tier_progress_expires_at: null,
    tier_progress_points: 0,
    tier_progress_started_at: null,
    tier_progress_target_points: 0,
    updated_at: createdAt,
  };
}
