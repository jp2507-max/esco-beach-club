import { id } from '@instantdb/react-native';

import type { Partner, PartnerRedemption } from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapPartner } from '@/src/lib/mappers';

import { nowIso } from './shared';

export async function fetchPartners(): Promise<Partner[]> {
  const { data } = await db.queryOnce({ partners: {} });
  return (data.partners as InstantRecord[]).map(mapPartner);
}

export async function fetchPartnerById(id: string): Promise<Partner | null> {
  const { data } = await db.queryOnce({
    partners: {
      $: {
        where: { id },
      },
    },
  });

  const partner = data.partners[0] as InstantRecord | undefined;
  return partner ? mapPartner(partner) : null;
}

function mapPartnerRedemptionFromInstantRecord(
  current: InstantRecord,
  fallbacks: {
    user_id: string;
    partner_id: string;
    redemption_method: string;
  }
): PartnerRedemption {
  return {
    id: current.id,
    created_at:
      typeof current.created_at === 'string' ? current.created_at : nowIso(),
    entry_key:
      typeof current.entry_key === 'string'
        ? current.entry_key
        : `${fallbacks.user_id}:${fallbacks.partner_id}:${fallbacks.redemption_method}`,
    partner_code:
      typeof current.partner_code === 'string' ? current.partner_code : null,
    partner_id:
      typeof current.partner_id === 'string'
        ? current.partner_id
        : fallbacks.partner_id,
    redemption_method:
      typeof current.redemption_method === 'string'
        ? current.redemption_method
        : fallbacks.redemption_method,
    status: typeof current.status === 'string' ? current.status : 'claimed',
  };
}

export async function claimPartnerRedemption(params: {
  user_id: string;
  partner_id: string;
  partner_code?: string | null;
  redemption_method: string;
}): Promise<PartnerRedemption> {
  const entryKey = `${params.user_id}:${params.partner_id}:${params.redemption_method}`;

  const existing = await db.queryOnce({
    partner_redemptions: {
      $: {
        where: {
          entry_key: entryKey,
        },
      },
    },
  });

  const current = existing.data.partner_redemptions[0] as
    | InstantRecord
    | undefined;
  if (current) {
    return mapPartnerRedemptionFromInstantRecord(current, params);
  }

  const createdAt = nowIso();
  const redemptionId = id();
  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
    ...(params.partner_code ? { partner_code: params.partner_code } : {}),
  };

  try {
    await db.transact(
      db.tx.partner_redemptions[redemptionId]
        .create(payload)
        .link({ owner: params.user_id, partner: params.partner_id })
    );
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          partner_redemptions: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existingRow = data.partner_redemptions[0] as
          | InstantRecord
          | undefined;
        if (existingRow) {
          return mapPartnerRedemptionFromInstantRecord(existingRow, params);
        }
      }
    }

    throw error;
  }

  return {
    id: redemptionId,
    created_at: createdAt,
    entry_key: entryKey,
    partner_code: params.partner_code ?? null,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
  };
}
