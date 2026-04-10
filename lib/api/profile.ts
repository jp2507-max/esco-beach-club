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
  buildProfileId,
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
export const PROFILE_PERMISSION_DENIED_ERROR_KEY = 'profilePermissionDenied';

type ProfileBootstrapOperation =
  | 'create_profile'
  | 'load_profile'
  | 'set_auth_provider'
  | 'update_profile';

type ProfileDbClient = {
  queryOnce: typeof db.queryOnce;
  transact: typeof db.transact;
  tx: typeof db.tx;
};

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
  ensureProfile: 'ensure_profile',
} as const;

export type ProfileBootstrapStage =
  (typeof profileBootstrapStages)[keyof typeof profileBootstrapStages];

export class ProfileBootstrapError extends Error {
  readonly isRetryable: boolean;
  readonly canonicalProfileExists: boolean;
  readonly operation: ProfileBootstrapOperation;
  readonly stage: ProfileBootstrapStage;

  constructor(
    message: string,
    options: {
      canonicalProfileExists?: boolean;
      isRetryable: boolean;
      operation?: ProfileBootstrapOperation;
      stage: ProfileBootstrapStage;
    }
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.canonicalProfileExists = options.canonicalProfileExists ?? false;
    this.name = 'ProfileBootstrapError';
    this.isRetryable = options.isRetryable;
    this.operation = options.operation ?? 'load_profile';
    this.stage = options.stage;
  }
}

async function waitForProvisionRetryDelay(attempt: number): Promise<void> {
  const delay =
    PROFILE_PROVISION_RETRY_DELAYS_MS[
      Math.max(
        0,
        Math.min(attempt - 1, PROFILE_PROVISION_RETRY_DELAYS_MS.length - 1)
      )
    ];

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
}

export async function fetchProfileById(
  userId: string
): Promise<Profile | null> {
  return fetchProfileByIdWithDb(db, userId);
}

async function fetchProfileByIdWithDb(
  database: ProfileDbClient,
  userId: string
): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await database.queryOnce({
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
  return fetchProfileWithDb(db, userId);
}

async function fetchProfileWithDb(
  database: ProfileDbClient,
  userId: string
): Promise<Profile | null> {
  if (!userId) return null;

  return fetchProfileByIdWithDb(database, userId);
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

export async function ensureProfileWithDb(
  database: ProfileDbClient,
  params: {
    userId: string;
    email?: string;
    displayName?: string;
    dateOfBirth?: string;
  }
): Promise<Profile | null> {
  if (!params.userId) return null;

  const current = await fetchProfileWithDb(database, params.userId);
  if (current) {
    return current;
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
      await database.transact(database.tx.profiles[profileId].create(payload));
      return fetchProfileWithDb(database, params.userId);
    } catch (error) {
      if (!(error instanceof Error))
        throw new ProfileBootstrapError('unableToCompleteProfileSetup', {
          isRetryable: false,
          operation: 'create_profile',
          stage: profileBootstrapStages.ensureProfile,
        });

      if (isProfileIdConflict(error)) {
        const existingProfile = await fetchProfileWithDb(
          database,
          params.userId
        );
        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      if (isMemberIdConflict(error)) {
        const existingProfile = await fetchProfileWithDb(
          database,
          params.userId
        );
        if (existingProfile) {
          return existingProfile;
        }
        if (attempt < maxAttempts) {
          await waitForProvisionRetryDelay(attempt);
          continue;
        }
        throw error;
      }

      if (isReferralCodeConflict(error)) {
        const existingProfile = await fetchProfileWithDb(
          database,
          params.userId
        );
        if (existingProfile) {
          return existingProfile;
        }
        if (attempt < maxAttempts) {
          await waitForProvisionRetryDelay(attempt);
          continue;
        }
        throw error;
      }

      if (error.message.toLowerCase().includes('permission denied')) {
        const existingCanonicalProfile = await fetchProfileByIdWithDb(
          database,
          params.userId
        );

        captureHandledError(error, {
          tags: {
            area: 'profile',
            operation: 'create_profile',
          },
          extras: {
            ...getErrorMonitoringExtras(error),
            canonicalProfileExists: Boolean(existingCanonicalProfile),
            payloadKeys: Object.keys(payload),
            profileId,
            userId: params.userId,
          },
        });

        if (__DEV__) {
          console.error('[ensureProfile] Canonical profile create denied', {
            attempt,
            maxAttempts,
            canonicalProfileExists: Boolean(existingCanonicalProfile),
            payloadKeys: Object.keys(payload),
            profileId,
            userId: params.userId,
          });
        }

        const existingProfile = existingCanonicalProfile
          ? existingCanonicalProfile
          : await fetchProfileWithDb(database, params.userId);
        if (existingProfile) {
          return existingProfile;
        }

        if (attempt < maxAttempts) {
          await waitForProvisionRetryDelay(attempt);
          continue;
        }

        throw new ProfileBootstrapError(PROFILE_PERMISSION_DENIED_ERROR_KEY, {
          canonicalProfileExists: Boolean(existingCanonicalProfile),
          isRetryable: false,
          operation: 'create_profile',
          stage: profileBootstrapStages.ensureProfile,
        });
      }

      throw new ProfileBootstrapError('unableToCompleteProfileSetup', {
        isRetryable: true,
        operation: 'create_profile',
        stage: profileBootstrapStages.ensureProfile,
      });
    }
  }

  return fetchProfileWithDb(database, params.userId);
}

export async function ensureProfile(params: {
  userId: string;
  email?: string;
  displayName?: string;
  dateOfBirth?: string;
}): Promise<Profile | null> {
  return ensureProfileWithDb(db, params);
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
        canonicalProfileExists: current.id === userId,
        profileId: current.id,
        updateFields: Object.keys(sanitizedUpdates),
        timestamp: nowIso(),
      });
      throw new PermissionDeniedUpdateError(
        PROFILE_PERMISSION_DENIED_ERROR_KEY
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
        canonicalProfileExists: profile.id === userId,
        profileId: profile.id,
        auth_provider: authProvider,
        timestamp: nowIso(),
      });
      throw new PermissionDeniedUpdateError(
        PROFILE_PERMISSION_DENIED_ERROR_KEY
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
