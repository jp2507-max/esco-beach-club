import { useEffect, useRef } from 'react';

import { useProfileData } from '@/providers/DataProvider';
import { db } from '@/src/lib/instant';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from '@/src/lib/referral/pending-referral';
import { postClaimReferral } from '@/src/lib/referral/referral-api';

/**
 * After sign-in, submits a pending invite code (from deep link) to the trusted API once.
 */
export function ReferralClaimEffect(): null {
  const { isLoading, user } = db.useAuth();
  const { profile } = useProfileData();
  const attemptedForUserRef = useRef<string | null>(null);

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
      } catch {
        attemptedForUserRef.current = null;
      }
    })();
  }, [isLoading, profile?.id, user?.id, user?.refresh_token]);

  return null;
}
