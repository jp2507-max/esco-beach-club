import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ensureProfile } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapProfile } from '@/src/lib/mappers';
import { captureHandledError } from '@/src/lib/monitoring';

import type { ProfileData } from './context';

const MAX_PROFILE_PROVISION_ATTEMPTS = 2;
const PROFILE_PROVISION_FAILURE_KEY = 'unableToCompleteProfileSetup';

type ErrorWithTerminalProvisionFlag = Error & {
  terminalProvisionFailure?: boolean;
};

function createTerminalProvisionError(
  message: string = PROFILE_PROVISION_FAILURE_KEY
): Error & { terminalProvisionFailure: true } {
  const err = new Error(message);
  Object.defineProperty(err, 'terminalProvisionFailure', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  return err as Error & { terminalProvisionFailure: true };
}

function isTerminalProfileProvisionError(error: Error): boolean {
  return (
    (error as ErrorWithTerminalProvisionFlag).terminalProvisionFailure === true
  );
}

type ProfileResourceParams = {
  authEmail?: string;
  isAuthLoading: boolean;
  userId: string;
};

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

function normalizeProvisionError(error: unknown): Error {
  if (error instanceof Error) return error;
  return createTerminalProvisionError();
}

export function useProfileResource(params: ProfileResourceParams): ProfileData {
  const { authEmail, isAuthLoading, userId } = params;
  const [isProvisioningProfile, setIsProvisioningProfile] =
    useState<boolean>(false);
  const [profileProvisionError, setProfileProvisionError] =
    useState<Error | null>(null);
  const isDismissingRef = useRef(false);
  const isProvisioningProfileRef = useRef<Map<string, boolean>>(new Map());
  const lastResolvedProfileRef = useRef<Profile | null>(null);
  const lastResolvedProfileUserIdRef = useRef<string>('');
  const latestUserIdRef = useRef<string>(userId);
  latestUserIdRef.current = userId;
  const profileProvisionAttemptsRef = useRef<Map<string, number>>(new Map());

  const profileQuery = db.useQuery(
    userId
      ? {
          profiles: {
            $: {
              where: { 'user.id': userId },
            },
          },
        }
      : null
  );
  const profileViaUserQuery = db.useQuery(
    userId
      ? {
          $users: {
            $: {
              where: { id: userId },
            },
            profile: {},
          },
        }
      : null
  );

  const liveProfile = useMemo(() => {
    if (!userId) return null;

    const directRecord = firstInstantRecord(profileQuery.data?.profiles);
    const userRecord = firstInstantRecord(profileViaUserQuery.data?.$users);
    const linkedRecord = firstInstantRecord(
      (userRecord as Record<string, unknown> | null)?.profile
    );
    const record = directRecord ?? linkedRecord;

    return record ? mapProfile(record) : null;
  }, [profileQuery.data, profileViaUserQuery.data, userId]);

  const isProfilePending =
    isAuthLoading ||
    profileQuery.isLoading ||
    profileViaUserQuery.isLoading ||
    isProvisioningProfile;

  useEffect(() => {
    if (!userId) {
      lastResolvedProfileRef.current = null;
      lastResolvedProfileUserIdRef.current = '';
      return;
    }

    if (lastResolvedProfileUserIdRef.current !== userId) {
      lastResolvedProfileUserIdRef.current = userId;
      lastResolvedProfileRef.current = liveProfile;
      return;
    }

    if (liveProfile) {
      lastResolvedProfileRef.current = liveProfile;
      return;
    }

    if (!isProfilePending) {
      lastResolvedProfileRef.current = null;
    }
  }, [isProfilePending, liveProfile, userId]);

  const profile = useMemo(() => {
    if (!userId) return null;
    if (liveProfile) return liveProfile;

    // Keep the last settled profile during transient auth/query gaps so
    // member-facing UI does not flicker back to guest state mid-session.
    if (isProfilePending && lastResolvedProfileUserIdRef.current === userId) {
      return lastResolvedProfileRef.current;
    }

    return null;
  }, [isProfilePending, liveProfile, userId]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      profileProvisionAttemptsRef.current.clear();
      isProvisioningProfileRef.current.clear();
      setIsProvisioningProfile(false);
      setProfileProvisionError(null);
      return;
    }

    if (profile) {
      profileProvisionAttemptsRef.current.delete(userId);
      isProvisioningProfileRef.current.delete(userId);
      setProfileProvisionError(null);
      return;
    }

    if (profileQuery.isLoading || profileViaUserQuery.isLoading) return;
    if (isProvisioningProfileRef.current.get(userId)) return;

    const attemptCount = profileProvisionAttemptsRef.current.get(userId) ?? 0;
    if (attemptCount >= MAX_PROFILE_PROVISION_ATTEMPTS) {
      if (!profileProvisionError) {
        setProfileProvisionError(createTerminalProvisionError());
      }
      return;
    }

    const nextAttempt = attemptCount + 1;
    profileProvisionAttemptsRef.current.set(userId, nextAttempt);

    isProvisioningProfileRef.current.set(userId, true);
    setIsProvisioningProfile(true);
    let isMounted = true;

    void ensureProfile({ email: authEmail, userId })
      .then((nextProfile) => {
        if (!isMounted) return;
        if (nextProfile) {
          profileProvisionAttemptsRef.current.delete(userId);
          setProfileProvisionError(null);
          return;
        }

        if (nextAttempt >= MAX_PROFILE_PROVISION_ATTEMPTS) {
          setProfileProvisionError(createTerminalProvisionError());
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const normalizedError = normalizeProvisionError(error);
        captureHandledError(error, {
          tags: {
            area: 'profile',
            operation: 'ensure_profile',
          },
        });
        if (nextAttempt >= MAX_PROFILE_PROVISION_ATTEMPTS) {
          setProfileProvisionError(normalizedError);
        }
        console.error('[DataProvider] Failed to provision profile:', {
          error,
          nextAttempt,
          isAuthLoading,
          profileQueryLoading: profileQuery.isLoading,
          profileViaUserQueryLoading: profileViaUserQuery.isLoading,
        });
      })
      .finally(() => {
        isProvisioningProfileRef.current.delete(userId);
        setIsProvisioningProfile(
          Boolean(isProvisioningProfileRef.current.get(latestUserIdRef.current))
        );
      });

    return () => {
      isMounted = false;
    };
  }, [
    authEmail,
    isAuthLoading,
    profile,
    profileQuery.isLoading,
    profileProvisionError,
    profileViaUserQuery.isLoading,
    userId,
  ]);

  const retryProfileProvision = useCallback(async (): Promise<void> => {
    if (!userId || isProvisioningProfileRef.current.get(userId)) return;

    profileProvisionAttemptsRef.current.set(userId, 0);
    setProfileProvisionError(null);
    isProvisioningProfileRef.current.set(userId, true);
    setIsProvisioningProfile(true);

    try {
      const nextProfile = await ensureProfile({ email: authEmail, userId });
      if (!nextProfile) {
        throw createTerminalProvisionError();
      }

      profileProvisionAttemptsRef.current.delete(userId);
      setProfileProvisionError(null);
    } catch (error: unknown) {
      const normalizedError = normalizeProvisionError(error);
      setProfileProvisionError(normalizedError);

      captureHandledError(error, {
        tags: {
          area: 'profile',
          operation: 'retry_profile_provision',
        },
      });

      if (__DEV__) {
        console.error('[DataProvider] Profile provisioning retry failed', {
          error,
          userId,
        });
      }
    } finally {
      isProvisioningProfileRef.current.delete(userId);
      setIsProvisioningProfile(
        Boolean(isProvisioningProfileRef.current.get(latestUserIdRef.current))
      );
    }
  }, [authEmail, userId]);

  const dismissVoucher = useCallback((): void => {
    if (!profile || profile.has_seen_welcome_voucher) return;
    if (isDismissingRef.current) return;

    isDismissingRef.current = true;
    void db
      .transact(
        db.tx.profiles[profile.id].update({
          has_seen_welcome_voucher: true,
        })
      )
      .catch((error: unknown) => {
        captureHandledError(error, {
          tags: {
            area: 'profile',
            operation: 'dismiss_welcome_voucher',
          },
        });
        console.error(
          '[DataProvider] Failed to dismiss welcome voucher:',
          error
        );
      })
      .finally(() => {
        isDismissingRef.current = false;
      });
  }, [profile]);

  const isRetryable = Boolean(
    profileProvisionError &&
    !isTerminalProfileProvisionError(profileProvisionError)
  );

  return useMemo(
    () => ({
      dismissVoucher,
      profile,
      isRetryable,
      profileProvisionError,
      profileLoading:
        Boolean(userId) &&
        (profileQuery.isLoading ||
          profileViaUserQuery.isLoading ||
          isProvisioningProfile),
      retryProfileProvision,
      userId,
    }),
    [
      dismissVoucher,
      isProvisioningProfile,
      isRetryable,
      profile,
      profileProvisionError,
      profileQuery.isLoading,
      profileViaUserQuery.isLoading,
      retryProfileProvision,
      userId,
    ]
  );
}
