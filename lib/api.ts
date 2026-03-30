import { id } from '@instantdb/react-native';

import type {
  Event,
  MemberSegment,
  NewsItem,
  OnboardingPermissionStatus,
  Partner,
  PartnerRedemption,
  PrivateEventInquiry,
  Profile,
  Referral,
  RewardTransaction,
  SavedEvent,
  StaffAccess,
  TableReservation,
} from '@/lib/types';
import {
  onboardingPermissionStatuses,
  rewardTierKeys,
  rewardTransactionEventTypes,
  rewardTransactionSources,
} from '@/lib/types';
import { db } from '@/src/lib/instant';
import { rewardServiceResponseSchema } from '@/src/lib/reward-backend-contract';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';
import {
  type InstantRecord,
  mapEvent,
  mapNewsItem,
  mapPartner,
  mapPrivateEventInquiry,
  mapProfile,
  mapReferral,
  mapSavedEvent,
  mapStaffAccess,
  mapTableReservation,
} from '@/src/lib/mappers';

function nowIso(): string {
  return new Date().toISOString();
}

function getRewardServiceEndpoint(): string {
  const endpoint =
    process.env.EXPO_PUBLIC_REWARD_SERVICE_URL?.trim() ||
    process.env.EXPO_PUBLIC_TRUSTED_LOYALTY_AWARD_URL?.trim();
  if (!endpoint) {
    throw new Error('rewardServiceUnavailable');
  }

  return endpoint;
}

function normalizeMemberSince(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) return undefined;

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

function normalizeDateOfBirth(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) return undefined;

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

function normalizeOnboardingCompletedAt(
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

function normalizePermissionStatus(
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

function buildProfileId(userId: string): string {
  return userId;
}

function buildMemberId(userId: string): string {
  return `ESCO-${userId.replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

function buildReferralCode(): string {
  return `ESCO-${id().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function isMemberIdConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('member_id') || message.includes('"member_id"'))
  );
}

function isReferralCodeConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('referral_code') || message.includes('"referral_code"'))
  );
}

function isProfileIdConflict(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    (message.includes('profiles.id') ||
      message.includes('"profiles.id"') ||
      message.includes('primary key'))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInstantRecord(value: unknown): value is InstantRecord {
  return isRecord(value) && typeof value.id === 'string';
}

function firstInstantRecord(value: unknown): InstantRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isInstantRecord(first) ? first : null;
  }

  return isInstantRecord(value) ? value : null;
}

type RewardServiceApiResponse = {
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

function normalizeRequiredIsoDateTime(value: string): string {
  return normalizeOnboardingCompletedAt(value) ?? value;
}

function parseRewardServiceResponse(
  value: unknown
): RewardServiceApiResponse | null {
  const parsed = rewardServiceResponseSchema.safeParse(value);
  if (!parsed.success) return null;

  const { cashbackPointsDelta, member, tierProgressPointsDelta, transaction } =
    parsed.data;

  return {
    cashbackPointsDelta,
    member: {
      ...member,
      date_of_birth: normalizeDateOfBirth(member.date_of_birth) ?? null,
      member_segment: member.member_segment
        ? (normalizeMemberSegment(member.member_segment) ?? null)
        : null,
      member_since: normalizeMemberSince(member.member_since) ?? member.member_since,
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
      created_at: normalizeRequiredIsoDateTime(transaction.created_at),
      occurred_at: normalizeRequiredIsoDateTime(transaction.occurred_at),
      reference: transaction.reference ?? null,
      updated_at: normalizeRequiredIsoDateTime(transaction.updated_at),
    },
  };
}

type CreateProfileDefaultsOptions = {
  userId: string;
  email?: string;
  displayName?: string;
  dateOfBirth?: string;
};

function createProfileDefaults(options: CreateProfileDefaultsOptions): {
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
  member_segment: MemberSegment | null;
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
} {
  const { userId, email, displayName, dateOfBirth } = options;
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
    referral_code: buildReferralCode(),
    saved: 0,
    tier_progress_expires_at: null,
    tier_progress_points: 0,
    tier_progress_started_at: null,
    tier_progress_target_points: 0,
    updated_at: createdAt,
  };
}

function withoutUndefined<T extends Record<string, unknown>>(
  value: T
): Partial<T> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

async function fetchProfileViaUserLink(
  userId: string
): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    $users: {
      $: {
        where: { id: userId },
      },
      profile: {},
    },
  });

  const userRecord = firstInstantRecord(data.$users);
  if (!userRecord) return null;

  const linkedProfile = firstInstantRecord(
    (userRecord as Record<string, unknown>).profile
  );

  return linkedProfile ? mapProfile(linkedProfile) : null;
}

export async function ensureProfile(params: {
  userId: string;
  email?: string;
  displayName?: string;
  dateOfBirth?: string;
}): Promise<Profile | null> {
  if (!params.userId) return null;

  const current = await fetchProfile(params.userId);
  if (current) return current;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;

    const profileId = buildProfileId(params.userId);
    const payload = createProfileDefaults({
      userId: params.userId,
      email: params.email,
      displayName: params.displayName,
      dateOfBirth: params.dateOfBirth,
    });

    try {
      await db.transact(
        db.tx.profiles[profileId].create(payload).link({ user: params.userId })
      );
      return fetchProfile(params.userId);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      if (isProfileIdConflict(error)) {
        // Profile ID conflict means the profile already exists for this user
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        // If no profile exists for this user, this is an unexpected conflict
        throw error;
      }

      if (isMemberIdConflict(error)) {
        // Member ID is deterministic from user ID, so retrying will not change it.
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      if (isReferralCodeConflict(error)) {
        if (attempt < maxRetries) {
          // Referral code is generated per attempt, so retry can resolve conflicts.
          continue;
        }
        // Max retries reached, check if profile exists for this user
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        // If no profile exists, this is a genuine constraint violation
        throw error;
      }

      if (error.message.toLowerCase().includes('permission denied')) {
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
      }

      // Re-throw non-unique constraint errors
      throw error;
    }
  }

  // This should not be reached, but handle gracefully
  return fetchProfile(params.userId);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { 'user.id': userId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  if (profile) {
    return mapProfile(profile);
  }

  return fetchProfileViaUserLink(userId);
}

export async function fetchProfileByMemberId(
  memberId: string
): Promise<Profile | null> {
  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { member_id: trimmedMemberId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  return profile ? mapProfile(profile) : null;
}

export async function fetchStaffAccess(
  userId: string
): Promise<StaffAccess | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    staff_access: {
      $: {
        where: { 'user.id': userId },
      },
      user: {},
    },
  });

  const staffAccess = data.staff_access[0] as InstantRecord | undefined;
  if (!staffAccess) return null;

  const mapped = mapStaffAccess(staffAccess);
  return { ...mapped, user_id: mapped.user_id ?? userId };
}

export async function submitRewardAdjustment(params: {
  billAmountVnd: number;
  memberId: string;
  receiptReference?: string;
  staffUserId: string;
}): Promise<{
  cashbackPointsDelta: number;
  member: Profile;
  tierProgressPointsDelta: number;
  transaction: RewardTransaction;
}> {
  const memberId = params.memberId.trim();
  const billAmountVnd = Math.trunc(params.billAmountVnd);
  const receiptReference = params.receiptReference?.trim() ?? '';

  if (!memberId) {
    throw new Error('memberNotFound');
  }

  if (!Number.isFinite(billAmountVnd) || billAmountVnd <= 0) {
    throw new Error('invalidBillAmount');
  }

  if (!receiptReference) {
    throw new Error('receiptReferenceRequired');
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    response = await fetch(getRewardServiceEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        billAmountVnd,
        eventType: rewardTransactionEventTypes.manualAdjustment,
        memberId,
        receiptReference,
        source: rewardTransactionSources.manualStaffEntry,
        staffUserId: params.staffUserId,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('rewardServiceUnavailable');
    }
    throw new Error('rewardServiceUnavailable');
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
    ) {
      throw new Error(payload.error);
    }

    throw new Error('rewardServiceRejectedRequest');
  }

  const parsedPayload = parseRewardServiceResponse(payload);
  if (!parsedPayload) {
    throw new Error('invalidRewardServiceResponse');
  }

  return parsedPayload;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  if (!userId) return null;

  const current = await ensureProfile({ userId });
  if (!current) return null;

  const sanitizedUpdates = withoutUndefined({
    avatar_url: updates.avatar_url,
    bio: updates.bio,
    date_of_birth: normalizeDateOfBirth(updates.date_of_birth),
    full_name: updates.full_name,
    has_seen_welcome_voucher: updates.has_seen_welcome_voucher,
    location_permission_status: normalizePermissionStatus(
      updates.location_permission_status
    ),
    member_since: normalizeMemberSince(updates.member_since),
    member_segment: normalizeMemberSegment(updates.member_segment),
    nights_left: updates.nights_left,
    onboarding_completed_at: normalizeOnboardingCompletedAt(
      updates.onboarding_completed_at
    ),
    push_notification_permission_status: normalizePermissionStatus(
      updates.push_notification_permission_status
    ),
  }) as {
    avatar_url?: Profile['avatar_url'];
    bio?: Profile['bio'];
    date_of_birth?: Profile['date_of_birth'];
    full_name?: Profile['full_name'];
    has_seen_welcome_voucher?: Profile['has_seen_welcome_voucher'];
    location_permission_status?: Profile['location_permission_status'];
    member_since?: string | null;
    member_segment?: Profile['member_segment'];
    nights_left?: Profile['nights_left'];
    onboarding_completed_at?: string | null;
    push_notification_permission_status?: Profile['push_notification_permission_status'];
  };

  if (Object.keys(sanitizedUpdates).length === 0) {
    return current;
  }

  await db.transact(
    db.tx.profiles[current.id].update({
      ...sanitizedUpdates,
      updated_at: nowIso(),
    })
  );

  return fetchProfile(userId);
}

export async function fetchEvents(): Promise<Event[]> {
  const { data } = await db.queryOnce({ events: {} });
  return (data.events as InstantRecord[]).map(mapEvent);
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data } = await db.queryOnce({
    events: {
      $: {
        where: { id },
      },
    },
  });

  const event = data.events[0] as InstantRecord | undefined;
  return event ? mapEvent(event) : null;
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  const { data } = await db.queryOnce({ news_items: {} });
  return (data.news_items as InstantRecord[]).map(mapNewsItem);
}

export async function fetchPartners(): Promise<Partner[]> {
  const { data } = await db.queryOnce({ partners: {} });
  return (data.partners as InstantRecord[]).map(mapPartner);
}

export async function fetchPartnerById(id: string): Promise<Partner | null> {
  const { data } = await db.queryOnce({
    partners: {
      $: {
        where: { id },
      },
    },
  });

  const partner = data.partners[0] as InstantRecord | undefined;
  return partner ? mapPartner(partner) : null;
}

export async function fetchReferrals(userId: string): Promise<Referral[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    referrals: {
      $: {
        where: { 'referrer.user.id': userId },
      },
    },
  });

  return (data.referrals as InstantRecord[]).map(mapReferral);
}

export async function fetchSavedEvents(userId: string): Promise<SavedEvent[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    saved_events: {
      $: {
        where: { 'owner.id': userId },
      },
    },
  });

  return (data.saved_events as InstantRecord[]).map(mapSavedEvent);
}

export async function saveEvent(
  userId: string,
  eventId: string
): Promise<SavedEvent> {
  const createdAt = nowIso();
  const savedEventId = id();
  const entryKey = `${userId}:${eventId}`;

  const tx = db.tx.saved_events[savedEventId]
    .create({
      created_at: createdAt,
      entry_key: entryKey,
      event_id: eventId,
    })
    .link({ event: eventId, owner: userId });

  try {
    await db.transact(tx);

    return {
      id: savedEventId,
      created_at: createdAt,
      entry_key: entryKey,
      event_id: eventId,
    };
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          saved_events: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.saved_events[0] as InstantRecord | undefined;
        if (existing) {
          return mapSavedEvent(existing);
        }
      }
    }

    throw error;
  }
}

export async function removeSavedEvent(savedEventId: string): Promise<void> {
  await db.transact(db.tx.saved_events[savedEventId].delete());
}

export async function submitTableReservation(params: {
  user_id: string;
  event_id?: string;
  event_title?: string;
  occasion: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  source: string;
}): Promise<TableReservation> {
  const createdAt = nowIso();
  const reservationId = id();
  const entryKey = [
    params.user_id,
    params.event_id ?? 'general',
    params.reservation_date,
    params.reservation_time,
    params.party_size,
  ].join(':');

  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    occasion: params.occasion,
    party_size: params.party_size,
    reservation_date: params.reservation_date,
    reservation_time: params.reservation_time,
    source: params.source,
    status: 'pending',
    updated_at: createdAt,
    ...(params.event_id ? { event_id: params.event_id } : {}),
    ...(params.event_title ? { event_title: params.event_title } : {}),
  };

  const tx = db.tx.table_reservations[reservationId]
    .create(payload)
    .link({ owner: params.user_id });

  try {
    await db.transact(
      params.event_id ? tx.link({ event: params.event_id }) : tx
    );

    return {
      id: reservationId,
      created_at: createdAt,
      entry_key: entryKey,
      event_id: params.event_id ?? null,
      event_title: params.event_title ?? null,
      occasion: params.occasion,
      party_size: params.party_size,
      reservation_date: params.reservation_date,
      reservation_time: params.reservation_time,
      source: params.source,
      status: 'pending',
      updated_at: createdAt,
    };
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          table_reservations: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.table_reservations[0] as
          | InstantRecord
          | undefined;
        if (existing) {
          return mapTableReservation(existing);
        }
      }
    }

    throw error;
  }
}

function mapPartnerRedemptionFromInstantRecord(
  current: InstantRecord,
  fallbacks: {
    user_id: string;
    partner_id: string;
    redemption_method: string;
  }
): PartnerRedemption {
  return {
    id: current.id,
    created_at:
      typeof current.created_at === 'string' ? current.created_at : nowIso(),
    entry_key:
      typeof current.entry_key === 'string'
        ? current.entry_key
        : `${fallbacks.user_id}:${fallbacks.partner_id}:${fallbacks.redemption_method}`,
    partner_code:
      typeof current.partner_code === 'string' ? current.partner_code : null,
    partner_id:
      typeof current.partner_id === 'string'
        ? current.partner_id
        : fallbacks.partner_id,
    redemption_method:
      typeof current.redemption_method === 'string'
        ? current.redemption_method
        : fallbacks.redemption_method,
    status: typeof current.status === 'string' ? current.status : 'claimed',
  };
}

export async function claimPartnerRedemption(params: {
  user_id: string;
  partner_id: string;
  partner_code?: string | null;
  redemption_method: string;
}): Promise<PartnerRedemption> {
  const entryKey = `${params.user_id}:${params.partner_id}:${params.redemption_method}`;

  const existing = await db.queryOnce({
    partner_redemptions: {
      $: {
        where: {
          entry_key: entryKey,
        },
      },
    },
  });

  const current = existing.data.partner_redemptions[0] as
    | InstantRecord
    | undefined;
  if (current) {
    return mapPartnerRedemptionFromInstantRecord(current, params);
  }

  const createdAt = nowIso();
  const redemptionId = id();
  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
    ...(params.partner_code ? { partner_code: params.partner_code } : {}),
  };

  try {
    await db.transact(
      db.tx.partner_redemptions[redemptionId]
        .create(payload)
        .link({ owner: params.user_id, partner: params.partner_id })
    );
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          partner_redemptions: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existingRow = data.partner_redemptions[0] as
          | InstantRecord
          | undefined;
        if (existingRow) {
          return mapPartnerRedemptionFromInstantRecord(existingRow, params);
        }
      }
    }

    throw error;
  }

  return {
    id: redemptionId,
    created_at: createdAt,
    entry_key: entryKey,
    partner_code: params.partner_code ?? null,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
  };
}

export async function submitReview(
  userId: string,
  rating: number,
  comment: string | null
): Promise<{
  comment: string | null;
  created_at: string;
  id: string;
  rating: number;
}> {
  const createdAt = nowIso();
  const reviewId = id();

  await db.transact(
    db.tx.reviews[reviewId]
      .create({
        comment,
        created_at: createdAt,
        rating,
      })
      .link({ owner: userId })
  );

  return {
    comment,
    created_at: createdAt,
    id: reviewId,
    rating,
  };
}

export async function submitPrivateEventInquiry(params: {
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}): Promise<PrivateEventInquiry> {
  const createdAt = nowIso();
  const inquiryId = id();
  const entryKey = [
    params.user_id,
    params.event_type,
    params.preferred_date,
    params.contact_email?.trim() || 'no-email',
  ].join(':');

  const createPayload = {
    created_at: createdAt,
    entry_key: entryKey,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    preferred_date: params.preferred_date,
    ...(params.contact_email !== undefined
      ? { contact_email: params.contact_email }
      : {}),
    ...(params.contact_name !== undefined
      ? { contact_name: params.contact_name }
      : {}),
    ...(params.notes !== undefined ? { notes: params.notes } : {}),
  };

  const tx = db.tx.private_event_inquiries[inquiryId]
    .create(createPayload)
    .link({ owner: params.user_id });

  try {
    await db.transact(tx);

    return {
      id: inquiryId,
      entry_key: entryKey,
      contact_email: params.contact_email || null,
      contact_name: params.contact_name || null,
      created_at: createdAt,
      estimated_pax: params.estimated_pax,
      event_type: params.event_type,
      notes: params.notes || null,
      preferred_date: params.preferred_date,
    };
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          private_event_inquiries: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.private_event_inquiries[0] as
          | InstantRecord
          | undefined;
        if (existing) {
          return mapPrivateEventInquiry(existing);
        }
      }
    }

    throw error;
  }
}
