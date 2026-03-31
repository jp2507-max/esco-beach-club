import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import { type InstantRecord, mapReferral } from '@/src/lib/mappers';

import { EMPTY_REFERRALS, type ReferralsData } from './context';

type ReferralsResourceParams = {
  userId: string;
};

export function useReferralsResource(
  params: ReferralsResourceParams
): ReferralsData {
  const { userId } = params;
  const referralsQuery = db.useQuery(
    userId
      ? {
          referrals: {
            $: {
              where: { 'referrer.user.id': userId },
            },
          },
        }
      : null
  );

  const referrals = useMemo(() => {
    if (!userId) return EMPTY_REFERRALS;
    const records = (referralsQuery.data?.referrals ?? []) as InstantRecord[];
    return records.map(mapReferral);
  }, [referralsQuery.data, userId]);

  return useMemo(
    () => ({
      referrals,
      referralsLoading: Boolean(userId) && referralsQuery.isLoading,
    }),
    [referrals, referralsQuery.isLoading, userId]
  );
}
