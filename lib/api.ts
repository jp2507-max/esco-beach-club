import { id } from '@instantdb/react-native';

import type {
  Event,
  LoyaltyTransaction,
  NewsItem,
  OnboardingPermissionStatus,
  Partner,
  PartnerRedemption,
  Profile,
  Referral,
  SavedEvent,
  StaffAccess,
  TableReservation,
} from '@/lib/types';
import { onboardingPermissionStatuses } from '@/lib/types';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapEvent,
  mapNewsItem,
  mapPartner,
  mapProfile,
  mapReferral,
  mapSavedEvent,
  mapStaffAccess,
  mapTableReservation,
} from '@/src/lib/mappers';

function nowIso(): string {
  return new Date().toISOString();
}

function getTrustedLoyaltyAwardEndpoint(): string {
  const endpoint = process.env.EXPO_PUBLIC_TRUSTED_LOYALTY_AWARD_URL?.trim();
  if (!endpoint) {
    throw new Error('loyaltyServiceUnavailable');
  }

  return endpoint;
}

function normalizeMemberSince(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

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
  if (!trimmed) return null;

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
  if (!trimmed) return null;

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

function buildProfilePhotoStoragePath(userId: string): string {
  return `profile-photos/${userId}/avatar`;
}

function firstFileRecordFromQueryResult(data: unknown): InstantRecord | null {
  if (!isRecord(data)) return null;

  const files = data.$files;
  if (!Array.isArray(files)) return null;

  const [first] = files;
  return isInstantRecord(first) ? first : null;
}

function resolveUploadedFileId(value: unknown): string | null {
  if (!isRecord(value)) return null;

  const maybeData = value.data;
  if (!isRecord(maybeData)) return null;

  return typeof maybeData.id === 'string' ? maybeData.id : null;
}

async function toFileFromLocalUri(params: {
  fallbackFileName: string;
  localUri: string;
  mimeType?: string | null;
}): Promise<File> {
  const response = await fetch(params.localUri);
  const blob = await response.blob();
  const contentType = params.mimeType?.trim() || blob.type || 'image/jpeg';
  return new File([blob], params.fallbackFileName, { type: contentType });
}

async function resolveUploadedFileUrl(params: {
  fileId: string | null;
  path: string;
}): Promise<string | null> {
  if (params.fileId) {
    const byId = await db.queryOnce({
      $files: {
        $: {
          where: { id: params.fileId },
        },
      },
    });

    const fileById = firstFileRecordFromQueryResult(byId.data);
    if (fileById && typeof fileById.url === 'string') {
      return fileById.url;
    }
  }

  const byPath = await db.queryOnce({
    $files: {
      $: {
        where: { path: params.path },
      },
    },
  });

  const fileByPath = firstFileRecordFromQueryResult(byPath.data);
  return fileByPath && typeof fileByPath.url === 'string'
    ? fileByPath.url
    : null;
}

function buildProfileId(userId: string): string {
  return userId;
}

function buildMemberId(userId: string): string {
  return `ESCO-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isSupportedPermissionStatus(value: unknown): boolean {
  if (value === undefined) return true;

  return (
    value === onboardingPermissionStatuses.undetermined ||
    value === onboardingPermissionStatuses.granted ||
    value === onboardingPermissionStatuses.denied
  );
}

function hasStringFields(
  value: Record<string, unknown>,
  fields: readonly string[]
): boolean {
  return fields.every((field) => typeof value[field] === 'string');
}

function hasNumberFields(
  value: Record<string, unknown>,
  fields: readonly string[]
): boolean {
  return fields.every((field) => isFiniteNumber(value[field]));
}

function isProfilePayload(value: unknown): value is Profile {
  if (!isRecord(value)) return false;

  if (
    value.tier !== 'STANDARD' &&
    value.tier !== 'VIP' &&
    value.tier !== 'OWNER'
  ) {
    return false;
  }

  if (!isNullableString(value.avatar_url)) return false;
  if ('date_of_birth' in value && !isNullableString(value.date_of_birth)) {
    return false;
  }
  if (
    'is_danang_citizen' in value &&
    value.is_danang_citizen !== null &&
    typeof value.is_danang_citizen !== 'boolean'
  ) {
    return false;
  }
  if (!isSupportedPermissionStatus(value.location_permission_status)) {
    return false;
  }
  if (!isSupportedPermissionStatus(value.push_notification_permission_status)) {
    return false;
  }
  if (
    'onboarding_completed_at' in value &&
    !isNullableString(value.onboarding_completed_at)
  ) {
    return false;
  }
  if (typeof value.has_seen_welcome_voucher !== 'boolean') return false;

  return (
    hasStringFields(value, [
      'id',
      'full_name',
      'bio',
      'member_id',
      'member_since',
      'referral_code',
      'created_at',
      'updated_at',
    ]) &&
    hasNumberFields(value, [
      'nights_left',
      'points',
      'max_points',
      'earned',
      'saved',
    ])
  );
}

function isLoyaltyTransactionPayload(
  value: unknown
): value is LoyaltyTransaction {
  if (!isRecord(value)) return false;

  if (!isNullableString(value.approved_by_staff_access_id)) return false;
  if (!isNullableString(value.manager_pin_label)) return false;
  if (!isNullableString(value.member_profile_id)) return false;
  if (!isNullableString(value.receipt_reference)) return false;
  if (!isNullableString(value.staff_access_id)) return false;

  return (
    hasStringFields(value, [
      'id',
      'created_at',
      'currency',
      'entry_key',
      'member_id',
      'source',
      'status',
      'updated_at',
    ]) &&
    hasNumberFields(value, [
      'bill_amount_vnd',
      'points_awarded',
      'points_rate_per_100k_vnd',
    ])
  );
}

type LoyaltyAwardServiceResponse = {
  member: Profile;
  pointsAwarded: number;
  transaction: LoyaltyTransaction;
};

function parseLoyaltyAwardServiceResponse(
  value: unknown
): LoyaltyAwardServiceResponse | null {
  if (!isRecord(value)) return null;

  const member = value.member;
  const pointsAwarded = value.pointsAwarded;
  const transaction = value.transaction;

  if (!isProfilePayload(member)) return null;
  if (!isFiniteNumber(pointsAwarded)) return null;
  if (!isLoyaltyTransactionPayload(transaction)) return null;

  const dateOfBirth =
    'date_of_birth' in member && isNullableString(member.date_of_birth)
      ? member.date_of_birth
      : null;
  const isDanangCitizen =
    'is_danang_citizen' in member &&
    (typeof member.is_danang_citizen === 'boolean' ||
      member.is_danang_citizen === null)
      ? member.is_danang_citizen
      : null;
  const locationPermissionStatus = normalizePermissionStatus(
    typeof member.location_permission_status === 'string'
      ? member.location_permission_status
      : undefined
  );
  const pushNotificationPermissionStatus = normalizePermissionStatus(
    typeof member.push_notification_permission_status === 'string'
      ? member.push_notification_permission_status
      : undefined
  );
  const onboardingCompletedAt =
    'onboarding_completed_at' in member &&
    isNullableString(member.onboarding_completed_at)
      ? (normalizeOnboardingCompletedAt(member.onboarding_completed_at) ?? null)
      : null;

  return {
    member: {
      ...member,
      date_of_birth: dateOfBirth,
      is_danang_citizen: isDanangCitizen,
      location_permission_status:
        locationPermissionStatus ?? onboardingPermissionStatuses.undetermined,
      push_notification_permission_status:
        pushNotificationPermissionStatus ??
        onboardingPermissionStatuses.undetermined,
      onboarding_completed_at: onboardingCompletedAt,
    },
    pointsAwarded,
    transaction,
  };
}

function createProfileDefaults(
  userId: string,
  email?: string,
  displayName?: string,
  dateOfBirth?: string
): {
  bio: string;
  created_at: string;
  date_of_birth: string | null;
  earned: number;
  full_name: string;
  has_seen_welcome_voucher: boolean;
  is_danang_citizen: boolean | null;
  location_permission_status: OnboardingPermissionStatus;
  max_points: number;
  member_id: string;
  member_since: string;
  nights_left: number;
  onboarding_completed_at: string | null;
  points: number;
  push_notification_permission_status: OnboardingPermissionStatus;
  referral_code: string;
  saved: number;
  tier: 'STANDARD';
  updated_at: string;
} {
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
    created_at: createdAt,
    date_of_birth: normalizedDateOfBirth ?? null,
    earned: 0,
    full_name: normalizedDisplayName || fallbackDisplayName,
    has_seen_welcome_voucher: false,
    is_danang_citizen: null,
    location_permission_status: onboardingPermissionStatuses.undetermined,
    max_points: 5000,
    member_id: buildMemberId(userId),
    member_since: createdAt,
    nights_left: 0,
    onboarding_completed_at: null,
    points: 0,
    push_notification_permission_status:
      onboardingPermissionStatuses.undetermined,
    referral_code: buildReferralCode(),
    saved: 0,
    tier: 'STANDARD',
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
    const payload = createProfileDefaults(
      params.userId,
      params.email,
      params.displayName,
      params.dateOfBirth
    );

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
    },
  });

  const staffAccess = data.staff_access[0] as InstantRecord | undefined;
  return staffAccess ? mapStaffAccess(staffAccess) : null;
}

export async function awardLoyaltyTransaction(params: {
  billAmountVnd: number;
  managerPin?: string;
  memberId: string;
  receiptReference?: string;
  staffUserId: string;
}): Promise<{
  member: Profile;
  pointsAwarded: number;
  transaction: LoyaltyTransaction;
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
    response = await fetch(getTrustedLoyaltyAwardEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        billAmountVnd,
        managerPin: params.managerPin?.trim() ?? '',
        memberId,
        receiptReference,
        staffUserId: params.staffUserId,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('loyaltyServiceUnavailable');
    }
    throw new Error('loyaltyServiceUnavailable');
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

    throw new Error('loyaltyServiceRejectedRequest');
  }

  const parsedPayload = parseLoyaltyAwardServiceResponse(payload);
  if (!parsedPayload) {
    throw new Error('invalidLoyaltyServiceResponse');
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
    is_danang_citizen: updates.is_danang_citizen,
    location_permission_status: normalizePermissionStatus(
      updates.location_permission_status
    ),
    member_since: normalizeMemberSince(updates.member_since),
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
    is_danang_citizen?: Profile['is_danang_citizen'];
    location_permission_status?: Profile['location_permission_status'];
    member_since?: string | null;
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

export async function uploadProfilePhotoAndGetUrl(params: {
  localUri: string;
  mimeType?: string | null;
  userId: string;
}): Promise<string> {
  if (!params.userId.trim()) {
    throw new Error('missingUserId');
  }

  if (!params.localUri.trim()) {
    throw new Error('missingPhotoUri');
  }

  const path = buildProfilePhotoStoragePath(params.userId);
  const file = await toFileFromLocalUri({
    fallbackFileName: `${params.userId}-avatar.jpg`,
    localUri: params.localUri,
    mimeType: params.mimeType,
  });

  const uploadResult = await db.storage.uploadFile(path, file, {
    contentType: file.type,
  });
  const uploadedFileId = resolveUploadedFileId(uploadResult);
  const uploadedUrl = await resolveUploadedFileUrl({
    fileId: uploadedFileId,
    path,
  });

  if (!uploadedUrl) {
    throw new Error('profilePhotoUploadFailed');
  }

  return uploadedUrl;
}

export async function updateProfilePhotoFromLocalAsset(params: {
  localUri: string;
  mimeType?: string | null;
  userId: string;
}): Promise<Profile | null> {
  const avatarUrl = await uploadProfilePhotoAndGetUrl(params);
  return updateProfile(params.userId, {
    avatar_url: avatarUrl,
  });
}

export async function removeProfilePhoto(
  userId: string
): Promise<Profile | null> {
  return updateProfile(userId, {
    avatar_url: null,
  });
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
}): Promise<{
  contact_email?: string;
  contact_name?: string;
  created_at: string;
  estimated_pax: number;
  event_type: string;
  id: string;
  notes?: string;
  preferred_date: string;
}> {
  const createdAt = nowIso();
  const inquiryId = id();
  const payload = {
    contact_email: params.contact_email,
    contact_name: params.contact_name,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    notes: params.notes,
    preferred_date: params.preferred_date,
  };

  const createPayload = {
    created_at: createdAt,
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

  await db.transact(
    db.tx.private_event_inquiries[inquiryId]
      .create(createPayload)
      .link({ owner: params.user_id })
  );

  return {
    ...payload,
    created_at: createdAt,
    id: inquiryId,
  };
}
