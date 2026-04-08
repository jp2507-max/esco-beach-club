import type {
  AuthProviderType,
  MemberSegment,
  OnboardingPermissionStatus,
  Profile,
} from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapProfile } from '@/src/lib/mappers';
import { captureHandledError } from '@/src/lib/monitoring';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

import {
  buildMemberId,
  buildProfileId,
  buildReferralCode,
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
const failedIdentifierRepairUserIds = new Set<string>();

function getErrorMonitoringExtras(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
    };
  }

  return {
    errorValue: String(error),
  };
}

export const profileBootstrapStages = {
  applyOnboarding: 'apply_onboarding',
  ensureProfile: 'ensure_profile',
  loadProfile: 'load_profile',
  persistAuthProvider: 'persist_auth_provider',
} as const;

export type ProfileBootstrapStage =
  (typeof profileBootstrapStages)[keyof typeof profileBootstrapStages];

export class ProfileBootstrapError extends Error {
  readonly isRetryable: boolean;
  readonly stage: ProfileBootstrapStage;

  constructor(
    message: string,
    options: {
      isRetryable: boolean;
      stage: ProfileBootstrapStage;
    }
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ProfileBootstrapError';
    this.isRetryable = options.isRetryable;
    this.stage = options.stage;
  }
}

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

async function fetchLinkedProfileIdForUser(
  userId: string
): Promise<string | null> {
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

  return linkedProfile?.id ?? null;
}

async function linkCanonicalProfileIfMissing(params: {
  profileId: string;
  userId: string;
}): Promise<void> {
  if (!params.userId || !params.profileId) return;
  if (params.profileId !== params.userId) return;

  let linkedProfileId: string | null = null;
  try {
    linkedProfileId = await fetchLinkedProfileIdForUser(params.userId);
  } catch (error: unknown) {
    captureHandledError(error, {
      tags: {
        area: 'profile',
        operation: 'read_profile_link_before_repair',
      },
      extras: {
        ...getErrorMonitoringExtras(error),
        profileId: params.profileId,
        userId: params.userId,
      },
    });

    if (__DEV__) {
      console.warn(
        '[ProfileAPI] Failed to read current profile link before repair; skipping non-critical link repair.',
        {
          error,
          profileId: params.profileId,
          userId: params.userId,
        }
      );
    }
    return;
  }

  if (linkedProfileId === params.profileId) {
    return;
  }

  if (linkedProfileId && linkedProfileId !== params.profileId) {
    if (__DEV__) {
      console.warn(
        '[ProfileAPI] Skipping canonical profile relink because user is already linked to another profile.',
        {
          canonicalProfileId: params.profileId,
          linkedProfileId,
          userId: params.userId,
        }
      );
    }
    return;
  }

  const maxAttempts = PROFILE_PROVISION_RETRY_DELAYS_MS.length + 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.transact(
        db.tx.profiles[params.profileId].link({ user: params.userId })
      );

      const refreshedLinkedProfileId = await fetchLinkedProfileIdForUser(
        params.userId
      );
      if (refreshedLinkedProfileId === params.profileId) {
        return;
      }
    } catch (error: unknown) {
      lastError = error;

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('permission denied')
      ) {
        break;
      }
    }

    if (attempt < maxAttempts) {
      await waitForProvisionRetryDelay(attempt);
    }
  }

  if (lastError) {
    captureHandledError(lastError, {
      tags: {
        area: 'profile',
        operation: 'repair_missing_profile_link',
      },
      extras: {
        ...getErrorMonitoringExtras(lastError),
        profileId: params.profileId,
        userId: params.userId,
      },
    });

    if (__DEV__) {
      console.warn(
        '[ProfileAPI] Failed to repair missing profile link; continuing with canonical profile id ownership fallback.',
        {
          error: lastError,
          profileId: params.profileId,
          userId: params.userId,
        }
      );
    }
  }
}

export async function fetchProfileById(
  userId: string
): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { id: userId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  return profile ? mapProfile(profile) : null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  const canonicalProfile = await fetchProfileById(userId);
  if (canonicalProfile) return canonicalProfile;

  return fetchProfileViaUserLink(userId);
}

async function repairMissingProfileIdentifiers(params: {
  profile: Profile;
  userId: string;
}): Promise<Profile | null> {
  const hasMemberId = params.profile.member_id.trim().length > 0;
  const hasReferralCode = params.profile.referral_code.trim().length > 0;

  if (hasMemberId && hasReferralCode) {
    failedIdentifierRepairUserIds.delete(params.userId);
    return params.profile;
  }

  if (failedIdentifierRepairUserIds.has(params.userId)) {
    return params.profile;
  }

  try {
    await db.transact(
      db.tx.profiles[params.profile.id].update({
        ...(!hasMemberId ? { member_id: buildMemberId(params.userId) } : {}),
        ...(!hasReferralCode
          ? { referral_code: buildReferralCode(params.userId) }
          : {}),
        updated_at: nowIso(),
      })
    );
  } catch (error: unknown) {
    failedIdentifierRepairUserIds.add(params.userId);
    captureHandledError(error, {
      tags: {
        area: 'profile',
        operation: 'repair_missing_profile_identifiers',
      },
      extras: {
        hasMemberId,
        hasReferralCode,
        profileId: params.profile.id,
        userId: params.userId,
      },
    });

    if (__DEV__) {
      console.warn(
        '[ProfileAPI] Failed to repair legacy profile identifiers; continuing with existing profile.',
        {
          error,
          profileId: params.profile.id,
          userId: params.userId,
        }
      );
    }

    return params.profile;
  }

  return fetchProfile(params.userId);
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
  if (current) {
    await linkCanonicalProfileIfMissing({
      profileId: current.id,
      userId: params.userId,
    });

    return repairMissingProfileIdentifiers({
      profile: current,
      userId: params.userId,
    });
  }

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
      await linkCanonicalProfileIfMissing({
        profileId,
        userId: params.userId,
      });
      return fetchProfile(params.userId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('permission denied')
      ) {
        captureHandledError(error, {
          tags: {
            area: 'profile',
            operation: 'create_profile_with_link',
          },
          extras: {
            ...getErrorMonitoringExtras(error),
            payloadKeys: Object.keys(payload),
            profileId,
            userId: params.userId,
          },
        });

        try {
          await db.transact(db.tx.profiles[profileId].create(payload));
          await linkCanonicalProfileIfMissing({
            profileId,
            userId: params.userId,
          });
          return fetchProfile(params.userId);
        } catch (fallbackError) {
          error = fallbackError;
        }
      }

      if (!(error instanceof Error))
        throw new ProfileBootstrapError('unableToCompleteProfileSetup', {
          isRetryable: false,
          stage: profileBootstrapStages.ensureProfile,
        });

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

        throw new ProfileBootstrapError('unableToCompleteProfileSetup', {
          isRetryable: false,
          stage: profileBootstrapStages.ensureProfile,
        });
      }

      throw new ProfileBootstrapError('unableToCompleteProfileSetup', {
        isRetryable: true,
        stage: profileBootstrapStages.ensureProfile,
      });
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
