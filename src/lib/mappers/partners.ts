import type { Partner, PartnerRedemption, Referral } from '@/lib/types';

import {
  type InstantRecord,
  toIsoString,
  toNullableString,
  toNumber,
  toStringOr,
} from './shared';

export function toReferralStatus(value: unknown): Referral['status'] {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'rejected') return 'Rejected';

  return 'Unknown';
}

export function mapPartner(record: InstantRecord): Partner {
  return {
    id: record.id,
    name: toStringOr(record.name),
    category: toStringOr(record.category),
    discount_percentage: toNumber(record.discount_percentage),
    discount_label: toStringOr(record.discount_label),
    description: toStringOr(record.description),
    image: toStringOr(record.image),
    code: toStringOr(record.code),
    created_at: toIsoString(record.created_at),
  };
}

export function mapReferral(record: InstantRecord): Referral {
  return {
    id: record.id,
    referrer_id: toStringOr(record.referrer_id),
    referred_name: toStringOr(record.referred_name),
    referred_avatar: toNullableString(record.referred_avatar),
    status: toReferralStatus(record.status),
    created_at: toIsoString(record.created_at),
  };
}

export function mapPartnerRedemption(record: InstantRecord): PartnerRedemption {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    partner_code: toNullableString(record.partner_code),
    partner_id: toStringOr(record.partner_id),
    redemption_method: toStringOr(record.redemption_method),
    status: toStringOr(record.status),
  };
}
