import { id } from '@instantdb/react-native';
import { db } from '@/src/lib/instant';
import type { Event, NewsItem, Partner, Profile, Referral } from './types';

type InstantRecord = {
  id: string;
  [key: string]: unknown;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toStringOr(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toBoolean(value: unknown, fallback: boolean = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toIsoString(value: unknown): string {
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value !== 'string') return '';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function toTier(value: unknown): Profile['tier'] {
  if (value === 'VIP' || value === 'OWNER' || value === 'STANDARD') return value;
  return 'STANDARD';
}

function toReferralStatus(value: unknown): Referral['status'] {
  return value === 'Completed' ? 'Completed' : 'Pending';
}

function mapProfile(record: InstantRecord): Profile {
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

function mapEvent(record: InstantRecord): Event {
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

function mapNewsItem(record: InstantRecord): NewsItem {
  return {
    id: record.id,
    title: toStringOr(record.title),
    subtitle: toStringOr(record.subtitle),
    image: toStringOr(record.image),
    time_label: toStringOr(record.time_label),
    created_at: toIsoString(record.created_at),
  };
}

function mapPartner(record: InstantRecord): Partner {
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

function mapReferral(record: InstantRecord): Referral {
  return {
    id: record.id,
    referrer_id: toStringOr(record.referrer_id),
    referred_name: toStringOr(record.referred_name),
    referred_avatar: toNullableString(record.referred_avatar),
    status: toReferralStatus(record.status),
    created_at: toIsoString(record.created_at),
  };
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { 'user.id': userId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  return profile ? mapProfile(profile) : null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  if (!userId) return null;

  const current = await fetchProfile(userId);
  if (!current) return null;

  const updatedAt = nowIso();

  await db.transact(
    db.tx.profiles[current.id].update(
      withoutUndefined({
        ...updates,
        updated_at: updatedAt,
      })
    )
  );

  return {
    ...current,
    ...updates,
    id: current.id,
    updated_at: updatedAt,
  };
}

export async function fetchEvents(): Promise<Event[]> {
  const { data } = await db.queryOnce({ events: {} });
  return (data.events as InstantRecord[]).map(mapEvent);
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data } = await db.queryOnce({
    events: {
      $: {
        where: { id },
      },
    },
  });

  const event = data.events[0] as InstantRecord | undefined;
  return event ? mapEvent(event) : null;
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  const { data } = await db.queryOnce({ news_items: {} });
  return (data.news_items as InstantRecord[]).map(mapNewsItem);
}

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

export async function fetchReferrals(userId: string): Promise<Referral[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    referrals: {
      $: {
        where: { 'referrer.user.id': userId },
      },
    },
  });

  return (data.referrals as InstantRecord[]).map(mapReferral);
}

export async function submitReview(
  userId: string,
  rating: number,
  comment: string | null
): Promise<{
  comment: string | null;
  created_at: string;
  id: string;
  rating: number;
  user_id: string;
}> {
  const createdAt = nowIso();
  const reviewId = id();

  await db.transact(
    db.tx.reviews[reviewId]
      .update({
        comment,
        created_at: createdAt,
        rating,
        user_id: userId,
      })
      .link({ owner: userId })
  );

  return {
    comment,
    created_at: createdAt,
    id: reviewId,
    rating,
    user_id: userId,
  };
}

export async function submitPrivateEventInquiry(params: {
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}): Promise<{
  contact_email?: string;
  contact_name?: string;
  created_at: string;
  estimated_pax: number;
  event_type: string;
  id: string;
  notes?: string;
  preferred_date: string;
  user_id: string;
}> {
  const createdAt = nowIso();
  const inquiryId = id();
  const payload = {
    contact_email: params.contact_email,
    contact_name: params.contact_name,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    notes: params.notes,
    preferred_date: params.preferred_date,
    user_id: params.user_id,
  };

  await db.transact(
    db.tx.private_event_inquiries[inquiryId]
      .update(withoutUndefined({ ...payload, created_at: createdAt }))
      .link({ owner: params.user_id })
  );

  return {
    ...payload,
    created_at: createdAt,
    id: inquiryId,
  };
}
