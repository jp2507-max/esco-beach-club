import type { Event, NewsItem, Partner, Profile, Referral } from '@/lib/types';

export type InstantRecord = {
  id: string;
  [key: string]: unknown;
};

export function toNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toStringOr(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function toBoolean(value: unknown, fallback: boolean = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function toIsoString(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  if (typeof value !== 'string') return '';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function toTier(value: unknown): Profile['tier'] {
  if (value === 'VIP' || value === 'OWNER' || value === 'STANDARD')
    return value;
  return 'STANDARD';
}

export function toReferralStatus(value: unknown): Referral['status'] {
  return value === 'Completed' ? 'Completed' : 'Pending';
}

export function mapProfile(record: InstantRecord): Profile {
  return {
    id: record.id,
    full_name: toStringOr(record.full_name),
    tier: toTier(record.tier),
    tier_label: toStringOr(record.tier_label, 'Member'),
    member_id: toStringOr(record.member_id),
    points: toNumber(record.points),
    max_points: toNumber(record.max_points),
    earned: toNumber(record.earned),
    saved: toNumber(record.saved),
    avatar_url: toNullableString(record.avatar_url),
    referral_code: toStringOr(record.referral_code),
    has_seen_welcome_voucher: toBoolean(record.has_seen_welcome_voucher),
    created_at: toIsoString(record.created_at),
    updated_at: toIsoString(record.updated_at),
  };
}

export function mapEvent(record: InstantRecord): Event {
  return {
    id: record.id,
    title: toStringOr(record.title),
    description: toNullableString(record.description),
    time: toStringOr(record.time),
    date: toStringOr(record.date),
    day_label: toNullableString(record.day_label),
    location: toStringOr(record.location),
    image: toStringOr(record.image),
    attendees: toNumber(record.attendees),
    price: toStringOr(record.price),
    badge: toNullableString(record.badge),
    badge_color: toNullableString(record.badge_color),
    featured: toBoolean(record.featured),
    category: toNullableString(record.category),
    vip_price: toNullableString(record.vip_price),
    member_price: toNullableString(record.member_price),
    guest_price: toNullableString(record.guest_price),
    created_at: toIsoString(record.created_at),
  };
}

export function mapNewsItem(record: InstantRecord): NewsItem {
  return {
    id: record.id,
    title: toStringOr(record.title),
    subtitle: toStringOr(record.subtitle),
    image: toStringOr(record.image),
    time_label: toStringOr(record.time_label),
    created_at: toIsoString(record.created_at),
  };
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
