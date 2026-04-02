import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapPartner,
  mapPartnerRedemption,
} from '@/src/lib/mappers';

import {
  EMPTY_PARTNER_REDEMPTIONS,
  EMPTY_PARTNERS,
  type PartnerRedemptionsData,
  type PartnersData,
} from './context';

type PartnersResourceParams = {
  userId: string;
};

type PartnersResourceValue = {
  partnerRedemptionsValue: PartnerRedemptionsData;
  partnersValue: PartnersData;
};

export function usePartnersResource(
  params: PartnersResourceParams
): PartnersResourceValue {
  const { userId } = params;
  const partnersQuery = db.useQuery(userId ? { partners: {} } : null);
  const partnerRedemptionsQuery = db.useQuery(
    userId
      ? {
          partner_redemptions: {
            $: {
              where: { 'owner.id': userId },
              order: { created_at: 'desc' },
            },
          },
        }
      : null
  );

  const partners = useMemo(() => {
    if (!userId) return EMPTY_PARTNERS;
    const records = (partnersQuery.data?.partners ?? []) as InstantRecord[];
    return records.map(mapPartner);
  }, [partnersQuery.data, userId]);

  const partnerRedemptions = useMemo(() => {
    if (!userId) return EMPTY_PARTNER_REDEMPTIONS;
    const records = (partnerRedemptionsQuery.data?.partner_redemptions ??
      []) as InstantRecord[];
    return records.map(mapPartnerRedemption);
  }, [partnerRedemptionsQuery.data, userId]);

  const partnersValue = useMemo(
    () => ({
      partners,
      partnersLoading: Boolean(userId) && partnersQuery.isLoading,
    }),
    [partners, partnersQuery.isLoading, userId]
  );

  const partnerRedemptionsValue = useMemo(
    () => ({
      partnerRedemptions,
      partnerRedemptionsLoading:
        Boolean(userId) && partnerRedemptionsQuery.isLoading,
    }),
    [partnerRedemptions, partnerRedemptionsQuery.isLoading, userId]
  );

  return {
    partnerRedemptionsValue,
    partnersValue,
  };
}
