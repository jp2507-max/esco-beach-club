import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ensureProfile } from '@/lib/api';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapProfile } from '@/src/lib/mappers';
import { captureHandledError } from '@/src/lib/monitoring';

import type { ProfileData } from './context';

const MAX_PROFILE_PROVISION_ATTEMPTS = 2;

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

export function useProfileResource(params: ProfileResourceParams): ProfileData {
  const { authEmail, isAuthLoading, userId } = params;
  const [isProvisioningProfile, setIsProvisioningProfile] =
    useState<boolean>(false);
  const isDismissingRef = useRef(false);
  const isProvisioningProfileRef = useRef<Map<string, boolean>>(new Map());
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

  const profile = useMemo(() => {
    if (!userId) return null;

    const directRecord = firstInstantRecord(profileQuery.data?.profiles);
    const userRecord = firstInstantRecord(profileViaUserQuery.data?.$users);
    const linkedRecord = firstInstantRecord(
      (userRecord as Record<string, unknown> | null)?.profile
    );
    const record = directRecord ?? linkedRecord;

    return record ? mapProfile(record) : null;
  }, [profileQuery.data, profileViaUserQuery.data, userId]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      profileProvisionAttemptsRef.current.clear();
      isProvisioningProfileRef.current.clear();
      setIsProvisioningProfile(false);
      return;
    }

    if (profile) {
      profileProvisionAttemptsRef.current.delete(userId);
      isProvisioningProfileRef.current.delete(userId);
      return;
    }

    if (profileQuery.isLoading || profileViaUserQuery.isLoading) return;
    if (isProvisioningProfileRef.current.get(userId)) return;

    const attemptCount = profileProvisionAttemptsRef.current.get(userId) ?? 0;
    if (attemptCount >= MAX_PROFILE_PROVISION_ATTEMPTS) {
      return;
    }

    profileProvisionAttemptsRef.current.set(userId, attemptCount + 1);

    isProvisioningProfileRef.current.set(userId, true);
    setIsProvisioningProfile(true);
    let isMounted = true;

    void ensureProfile({ email: authEmail, userId })
      .then((nextProfile) => {
        if (!isMounted) return;
        if (nextProfile) {
          profileProvisionAttemptsRef.current.delete(userId);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        captureHandledError(error, {
          tags: {
            area: 'profile',
            operation: 'ensure_profile',
          },
        });
        console.error('[DataProvider] Failed to provision profile:', {
          error,
          isAuthLoading,
          profileQueryLoading: profileQuery.isLoading,
          profileViaUserQueryLoading: profileViaUserQuery.isLoading,
        });
      })
      .finally(() => {
        isProvisioningProfileRef.current.delete(userId);
        setIsProvisioningProfile(
          Boolean(
            isProvisioningProfileRef.current.get(latestUserIdRef.current)
          )
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
    profileViaUserQuery.isLoading,
    userId,
  ]);

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

  return useMemo(
    () => ({
      dismissVoucher,
      profile,
      profileLoading:
        Boolean(userId) &&
        (profileQuery.isLoading ||
          profileViaUserQuery.isLoading ||
          isProvisioningProfile),
      userId,
    }),
    [
      dismissVoucher,
      isProvisioningProfile,
      profile,
      profileQuery.isLoading,
      profileViaUserQuery.isLoading,
      userId,
    ]
  );
}
