import { id } from '@instantdb/react-native';

import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapEvent,
  mapNewsItem,
  mapPartner,
  mapProfile,
  mapReferral,
  mapSavedEvent,
} from '@/src/lib/mappers';

import type {
  Event,
  NewsItem,
  Partner,
  PartnerRedemption,
  Profile,
  Referral,
  SavedEvent,
  TableReservation,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function buildMemberId(userId: string): string {
  return `ESCO-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function buildReferralCode(): string {
  return `ESCO-${id().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function createProfileDefaults(
  userId: string,
  email?: string
): {
  bio: string;
  created_at: string;
  earned: number;
  full_name: string;
  has_seen_welcome_voucher: boolean;
  max_points: number;
  member_id: string;
  member_since: string;
  nights_left: number;
  points: number;
  referral_code: string;
  saved: number;
  tier: 'STANDARD';
  tier_label: string;
  updated_at: string;
} {
  const createdAt = nowIso();
  const emailPrefix = email?.split('@')[0]?.trim() ?? '';
  const displayName = emailPrefix
    ? emailPrefix
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  return {
    bio: '',
    created_at: createdAt,
    earned: 0,
    full_name: displayName,
    has_seen_welcome_voucher: false,
    max_points: 5000,
    member_id: buildMemberId(userId),
    member_since: createdAt,
    nights_left: 0,
    points: 0,
    referral_code: buildReferralCode(),
    saved: 0,
    tier: 'STANDARD',
    tier_label: 'Member',
    updated_at: createdAt,
  };
}

function withoutUndefined<T extends Record<string, unknown>>(
  value: T
): Partial<T> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

export async function ensureProfile(params: {
  userId: string;
  email?: string;
}): Promise<Profile | null> {
  if (!params.userId) return null;

  const current = await fetchProfile(params.userId);
  if (current) return current;

  const profileId = id();
  const payload = createProfileDefaults(params.userId, params.email);

  await db.transact(
    db.tx.profiles[profileId].create(payload).link({ user: params.userId })
  );

  return fetchProfile(params.userId);
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

  const current = await ensureProfile({ userId });
  if (!current) return null;

  const sanitizedUpdates = withoutUndefined({
    avatar_url: updates.avatar_url,
    bio: updates.bio,
    full_name: updates.full_name,
    has_seen_welcome_voucher: updates.has_seen_welcome_voucher,
    member_since: updates.member_since
      ? new Date(`${updates.member_since}T00:00:00.000Z`).toISOString()
      : undefined,
    nights_left: updates.nights_left,
  }) as Partial<
    Pick<
      Profile,
      | 'avatar_url'
      | 'bio'
      | 'full_name'
      | 'has_seen_welcome_voucher'
      | 'member_since'
      | 'nights_left'
    >
  >;

  if (Object.keys(sanitizedUpdates).length === 0) {
    return current;
  }

  await db.transact(
    db.tx.profiles[current.id].update({
      ...sanitizedUpdates,
    })
  );

  return {
    ...current,
    ...sanitizedUpdates,
    id: current.id,
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

export async function fetchSavedEvents(userId: string): Promise<SavedEvent[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    saved_events: {
      $: {
        where: { 'owner.id': userId },
      },
    },
  });

  return (data.saved_events as InstantRecord[]).map(mapSavedEvent);
}

export async function saveEvent(
  userId: string,
  eventId: string
): Promise<SavedEvent> {
  const createdAt = nowIso();
  const savedEventId = id();
  const entryKey = `${userId}:${eventId}`;

  await db.transact(
    db.tx.saved_events[savedEventId]
      .create({
        created_at: createdAt,
        entry_key: entryKey,
        event_id: eventId,
      })
      .link({ event: eventId, owner: userId })
  );

  return {
    id: savedEventId,
    created_at: createdAt,
    entry_key: entryKey,
    event_id: eventId,
  };
}

export async function removeSavedEvent(savedEventId: string): Promise<void> {
  await db.transact(db.tx.saved_events[savedEventId].delete());
}

export async function submitTableReservation(params: {
  user_id: string;
  event_id?: string;
  event_title?: string;
  occasion: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  source: string;
}): Promise<TableReservation> {
  const createdAt = nowIso();
  const reservationId = id();
  const entryKey = [
    params.user_id,
    params.event_id ?? 'general',
    params.reservation_date,
    params.reservation_time,
    params.party_size,
  ].join(':');

  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    occasion: params.occasion,
    party_size: params.party_size,
    reservation_date: params.reservation_date,
    reservation_time: params.reservation_time,
    source: params.source,
    status: 'pending',
    updated_at: createdAt,
    ...(params.event_id ? { event_id: params.event_id } : {}),
    ...(params.event_title ? { event_title: params.event_title } : {}),
  };

  const tx = db.tx.table_reservations[reservationId]
    .create(payload)
    .link({ owner: params.user_id });

  await db.transact(params.event_id ? tx.link({ event: params.event_id }) : tx);

  return {
    id: reservationId,
    created_at: createdAt,
    entry_key: entryKey,
    event_id: params.event_id ?? null,
    event_title: params.event_title ?? null,
    occasion: params.occasion,
    party_size: params.party_size,
    reservation_date: params.reservation_date,
    reservation_time: params.reservation_time,
    source: params.source,
    status: 'pending',
    updated_at: createdAt,
  };
}

export async function claimPartnerRedemption(params: {
  user_id: string;
  partner_id: string;
  partner_code?: string | null;
  redemption_method: string;
}): Promise<PartnerRedemption> {
  const existing = await db.queryOnce({
    partner_redemptions: {
      $: {
        where: {
          entry_key: `${params.user_id}:${params.partner_id}:${params.redemption_method}`,
        },
      },
    },
  });

  const current = existing.data.partner_redemptions[0] as
    | InstantRecord
    | undefined;
  if (current) {
    return {
      id: current.id,
      created_at:
        typeof current.created_at === 'string' ? current.created_at : nowIso(),
      entry_key:
        typeof current.entry_key === 'string'
          ? current.entry_key
          : `${params.user_id}:${params.partner_id}:${params.redemption_method}`,
      partner_code:
        typeof current.partner_code === 'string' ? current.partner_code : null,
      partner_id:
        typeof current.partner_id === 'string'
          ? current.partner_id
          : params.partner_id,
      redemption_method:
        typeof current.redemption_method === 'string'
          ? current.redemption_method
          : params.redemption_method,
      status: typeof current.status === 'string' ? current.status : 'claimed',
    };
  }

  const createdAt = nowIso();
  const redemptionId = id();
  const entryKey = `${params.user_id}:${params.partner_id}:${params.redemption_method}`;
  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
    ...(params.partner_code ? { partner_code: params.partner_code } : {}),
  };

  await db.transact(
    db.tx.partner_redemptions[redemptionId]
      .create(payload)
      .link({ owner: params.user_id, partner: params.partner_id })
  );

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

export async function submitReview(
  userId: string,
  rating: number,
  comment: string | null
): Promise<{
  comment: string | null;
  created_at: string;
  id: string;
  rating: number;
}> {
  const createdAt = nowIso();
  const reviewId = id();

  await db.transact(
    db.tx.reviews[reviewId]
      .create({
        comment,
        created_at: createdAt,
        rating,
      })
      .link({ owner: userId })
  );

  return {
    comment,
    created_at: createdAt,
    id: reviewId,
    rating,
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
  };

  const createPayload = {
    created_at: createdAt,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    preferred_date: params.preferred_date,
    ...(params.contact_email !== undefined
      ? { contact_email: params.contact_email }
      : {}),
    ...(params.contact_name !== undefined
      ? { contact_name: params.contact_name }
      : {}),
    ...(params.notes !== undefined ? { notes: params.notes } : {}),
  };

  await db.transact(
    db.tx.private_event_inquiries[inquiryId]
      .create(createPayload)
      .link({ owner: params.user_id })
  );

  return {
    ...payload,
    created_at: createdAt,
    id: inquiryId,
  };
}
