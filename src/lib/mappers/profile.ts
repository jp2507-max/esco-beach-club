import type { AuthProviderType, MemberSegment, Profile } from '@/lib/types';
import {
  authProviderTypes,
  memberSegments,
  rewardTierKeys,
  rewardTierLegacyEscoLifeMember,
} from '@/lib/types';

import {
  type InstantRecord,
  toBoolean,
  toIsoString,
  toNullableIsoString,
  toNullableString,
  toNumber,
  toOnboardingPermissionStatus,
  toStringOr,
} from './shared';

export function toRewardTierKey(
  value: unknown
): Profile['lifetime_tier_key'] | null {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (normalized === rewardTierKeys.shore) return rewardTierKeys.shore;
  if (normalized === rewardTierKeys.cove) return rewardTierKeys.cove;
  if (normalized === rewardTierKeys.horizon) return rewardTierKeys.horizon;
  if (normalized === rewardTierKeys.luminary) return rewardTierKeys.luminary;
  if (normalized === rewardTierLegacyEscoLifeMember) {
    return rewardTierKeys.shore;
  }

  return null;
}

export function toNullableRewardTierKey(
  value: unknown
): Profile['next_tier_key'] {
  return toRewardTierKey(value);
}

function toMemberSegment(value: unknown): MemberSegment | null {
  const normalized =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (normalized === memberSegments.local) {
    return memberSegments.local;
  }

  if (normalized === memberSegments.foreigner) {
    return memberSegments.foreigner;
  }

  return null;
}

function toAuthProvider(value: unknown): AuthProviderType | null {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === authProviderTypes.apple) {
    return authProviderTypes.apple;
  }

  if (normalized === authProviderTypes.google) {
    return authProviderTypes.google;
  }

  if (normalized === authProviderTypes.magicCode) {
    return authProviderTypes.magicCode;
  }

  return null;
}

export function mapProfile(record: InstantRecord): Profile {
  return {
    id: record.id,
    full_name: toStringOr(record.full_name),
    auth_provider: toAuthProvider(record.auth_provider),
    date_of_birth: toNullableString(record.date_of_birth),
    bio: toStringOr(record.bio),
    member_id: toStringOr(record.member_id),
    member_since: toIsoString(record.member_since),
    nights_left: toNumber(record.nights_left),
    cashback_points_balance: toNumber(record.cashback_points_balance),
    cashback_points_lifetime_earned: toNumber(
      record.cashback_points_lifetime_earned
    ),
    lifetime_tier_key: toRewardTierKey(record.lifetime_tier_key),
    next_tier_key: toNullableRewardTierKey(record.next_tier_key),
    tier_progress_points: toNumber(record.tier_progress_points),
    tier_progress_target_points: toNumber(record.tier_progress_target_points),
    tier_progress_started_at: toNullableIsoString(
      record.tier_progress_started_at
    ),
    tier_progress_expires_at: toNullableIsoString(
      record.tier_progress_expires_at
    ),
    saved: toNumber(record.saved),
    avatar_url: toNullableString(record.avatar_url),
    member_segment: toMemberSegment(record.member_segment),
    location_permission_status: toOnboardingPermissionStatus(
      record.location_permission_status
    ),
    push_notification_permission_status: toOnboardingPermissionStatus(
      record.push_notification_permission_status
    ),
    onboarding_completed_at: toNullableIsoString(
      record.onboarding_completed_at
    ),
    referral_code: toStringOr(record.referral_code),
    has_seen_welcome_voucher: toBoolean(record.has_seen_welcome_voucher),
    created_at: toIsoString(record.created_at),
    updated_at: toIsoString(record.updated_at),
  };
}
