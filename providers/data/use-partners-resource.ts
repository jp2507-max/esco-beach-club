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
  includePartnerRedemptions?: boolean;
  includePartners?: boolean;
  userId: string;
};

type PartnersResourceValue = {
  partnerRedemptionsValue: PartnerRedemptionsData;
  partnersValue: PartnersData;
};

export function usePartnersResource(
  params: PartnersResourceParams
): PartnersResourceValue {
  const {
    includePartnerRedemptions = true,
    includePartners = true,
    userId,
  } = params;
  const shouldQueryPartners = Boolean(userId) && includePartners;
  const shouldQueryPartnerRedemptions =
    Boolean(userId) && includePartnerRedemptions;

  const partnersQuery = db.useQuery(
    shouldQueryPartners ? { partners: {} } : null
  );
  const partnerRedemptionsQuery = db.useQuery(
    shouldQueryPartnerRedemptions
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
    if (!shouldQueryPartners) return EMPTY_PARTNERS;
    const records = (partnersQuery.data?.partners ?? []) as InstantRecord[];
    return records.map(mapPartner);
  }, [partnersQuery.data, shouldQueryPartners]);

  const partnerRedemptions = useMemo(() => {
    if (!shouldQueryPartnerRedemptions) return EMPTY_PARTNER_REDEMPTIONS;
    const records = (partnerRedemptionsQuery.data?.partner_redemptions ??
      []) as InstantRecord[];
    return records.map(mapPartnerRedemption);
  }, [partnerRedemptionsQuery.data, shouldQueryPartnerRedemptions]);

  const partnersValue = useMemo(
    () => ({
      partners,
      partnersLoading: shouldQueryPartners && partnersQuery.isLoading,
    }),
    [partners, partnersQuery.isLoading, shouldQueryPartners]
  );

  const partnerRedemptionsValue = useMemo(
    () => ({
      partnerRedemptions,
      partnerRedemptionsLoading:
        shouldQueryPartnerRedemptions && partnerRedemptionsQuery.isLoading,
    }),
    [
      partnerRedemptions,
      partnerRedemptionsQuery.isLoading,
      shouldQueryPartnerRedemptions,
    ]
  );

  return {
    partnerRedemptionsValue,
    partnersValue,
  };
}
