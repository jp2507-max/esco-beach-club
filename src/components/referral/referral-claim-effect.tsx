import { useEffect, useRef } from 'react';

import { useProfileData } from '@/providers/DataProvider';
import { db } from '@/src/lib/instant';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from '@/src/lib/referral/pending-referral';
import { postClaimReferral } from '@/src/lib/referral/referral-api';
import { usePendingReferralSignal } from '@/src/stores/pending-referral-signal-store';

/**
 * After sign-in, submits a pending invite code (from deep link) to the trusted API once.
 *
 * Subscribes to a Zustand signal so deep links that arrive while the user is
 * already authenticated still trigger a claim attempt.
 */
export function ReferralClaimEffect(): null {
  const { isLoading, user } = db.useAuth();
  const { profile } = useProfileData();
  const attemptedForUserRef = useRef<string | null>(null);
  const referralSignalVersion = usePendingReferralSignal((s) => s.version);
  const prevVersionRef = useRef(referralSignalVersion);

  // When a new deep-link bumps the signal, allow a re-attempt for the current user.
  useEffect(() => {
    if (referralSignalVersion !== prevVersionRef.current) {
      prevVersionRef.current = referralSignalVersion;
      attemptedForUserRef.current = null;
    }
  }, [referralSignalVersion]);

  useEffect(() => {
    if (isLoading || !user?.refresh_token || !profile?.id) return;

    const pending = getPendingReferralCode();
    if (!pending) return;

    if (attemptedForUserRef.current === user.id) return;
    attemptedForUserRef.current = user.id;

    void (async () => {
      try {
        const result = await postClaimReferral({
          refreshToken: user.refresh_token,
          referralCode: pending,
        });

        if (result.ok) {
          clearPendingReferralCode();
          return;
        }

        if (result.reason === 'no_endpoint') {
          attemptedForUserRef.current = null;
          return;
        }

        const terminalStatuses = new Set([400, 404]);
        if (
          result.status !== undefined &&
          terminalStatuses.has(result.status)
        ) {
          clearPendingReferralCode();
          return;
        }

        attemptedForUserRef.current = null;
      } catch (error) {
        console.error('[ReferralClaimEffect] Claim failed:', error);
        attemptedForUserRef.current = null;
      }
    })();
  }, [isLoading, profile?.id, user?.id, user?.refresh_token, referralSignalVersion]);

  return null;
}
