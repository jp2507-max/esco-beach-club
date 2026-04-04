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

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
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
        const existingProfile = await fetchProfile(params.userId);
        if (existingProfile) {
          return existingProfile;
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

  await db.transact(
    db.tx.profiles[current.id].update({
      ...sanitizedUpdates,
      updated_at: nowIso(),
    })
  );

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
      return;
    }

    throw error;
  }
}
