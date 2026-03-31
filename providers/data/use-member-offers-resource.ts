import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import { type InstantRecord, mapMemberOffer } from '@/src/lib/mappers';

import {
  EMPTY_MEMBER_OFFERS,
  type MemberOffersData,
} from './context';

type MemberOffersResourceParams = {
  userId: string;
};

export function useMemberOffersResource(
  params: MemberOffersResourceParams
): MemberOffersData {
  const { userId } = params;
  const memberOffersQuery = db.useQuery(userId ? { member_offers: {} } : null);

  const memberOffers = useMemo(() => {
    if (!userId) return EMPTY_MEMBER_OFFERS;
    const records = (memberOffersQuery.data?.member_offers ??
      []) as InstantRecord[];
    return records
      .map(mapMemberOffer)
      .filter((offer) => offer.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [memberOffersQuery.data, userId]);

  return useMemo(
    () => ({
      memberOffers,
      memberOffersLoading: Boolean(userId) && memberOffersQuery.isLoading,
      welcomeOffer:
        memberOffers.find((offer) => offer.kind === 'welcome_voucher') ??
        memberOffers[0] ??
        null,
    }),
    [memberOffers, memberOffersQuery.isLoading, userId]
  );
}
