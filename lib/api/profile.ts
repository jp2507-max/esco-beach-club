import type {
  AuthProviderType,
  MemberSegment,
  OnboardingPermissionStatus,
  Profile,
} from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapProfile } from '@/src/lib/mappers';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

import {
  buildProfileId,
  firstInstantRecord,
  getDefaultProfileValues,
  isMemberIdConflict,
  isProfileIdConflict,
  isReferralCodeConflict,
  normalizeDateOfBirth,
  normalizeMemberSince,
  normalizeOnboardingCompletedAt,
  normalizePermissionStatus,
  nowIso,
  withoutUndefined,
} from './shared';

const PROFILE_PROVISION_RETRY_DELAYS_MS = [50, 150, 300] as const;

async function waitForProvisionRetryDelay(attempt: number): Promise<void> {
  const delay =
    PROFILE_PROVISION_RETRY_DELAYS_MS[
      Math.max(
        0,
        Math.min(attempt, PROFILE_PROVISION_RETRY_DELAYS_MS.length - 1)
      )
    ];

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
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

export async function ensureProfile(params: {
  userId: string;
  email?: string;
  displayName?: string;
  dateOfBirth?: string;
}): Promise<Profile | null> {
  if (!params.userId) return null;

  const current = await fetchProfile(params.userId);
  if (current) return current;

  const maxAttempts = PROFILE_PROVISION_RETRY_DELAYS_MS.length + 1;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    const profileId = buildProfileId(params.userId);
    const payload = getDefaultProfileValues({
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
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      if (isMemberIdConflict(error)) {
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      if (isReferralCodeConflict(error)) {
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      if (error.message.toLowerCase().includes('permission denied')) {
        if (__DEV__) {
          console.error('[ensureProfile] Profile create permission denied', {
            attempt,
            maxAttempts,
            payloadKeys: Object.keys(payload),
            profileId,
            userId: params.userId,
          });
        }
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
        }

        if (attempt < maxAttempts) {
          await waitForProvisionRetryDelay(attempt);
          continue;
        }
      }

      throw error;
    }
  }

  return fetchProfile(params.userId);
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
    location_permission_status?: OnboardingPermissionStatus;
    member_since?: string | null;
    member_segment?: MemberSegment | null;
    nights_left?: Profile['nights_left'];
    onboarding_completed_at?: string | null;
    push_notification_permission_status?: OnboardingPermissionStatus;
  };

  if (Object.keys(sanitizedUpdates).length === 0) {
    return current;
  }

  try {
    await db.transact(
      db.tx.profiles[current.id].update({
        ...sanitizedUpdates,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('permission denied')
    ) {
      console.warn('Profile update permission denied', {
        profileId: current.id,
        updateFields: Object.keys(sanitizedUpdates),
        timestamp: nowIso(),
      });
      throw new PermissionDeniedUpdateError(
        `Permission denied updating profile ${current.id}`
      );
    }

    throw error;
  }

  return fetchProfile(userId);
}

export async function setProfileAuthProvider(
  userId: string,
  authProvider: AuthProviderType
): Promise<void> {
  if (!userId) return;

  const profile = await ensureProfile({ userId });
  if (!profile || profile.auth_provider === authProvider) return;

  try {
    await db.transact(
      db.tx.profiles[profile.id].update({
        auth_provider: authProvider,
        updated_at: nowIso(),
      })
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('permission denied')
    ) {
      console.warn('Profile update permission denied', {
        profileId: profile.id,
        auth_provider: authProvider,
        timestamp: nowIso(),
      });
      throw new PermissionDeniedUpdateError(
        `Permission denied updating profile ${profile.id}`
      );
    }

    throw error;
  }
}

export class PermissionDeniedUpdateError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'PermissionDeniedUpdateError';
  }
}
