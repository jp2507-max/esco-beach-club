import { id } from '@instantdb/react-native';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapEvent,
  mapNewsItem,
  mapPartner,
  mapProfile,
  mapReferral,
} from '@/src/lib/mappers';
import type { Event, NewsItem, Partner, Profile, Referral } from './types';

function nowIso(): string {
  return new Date().toISOString();
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
      .create({
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
