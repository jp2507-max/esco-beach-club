import { supabase } from './supabase';
import type { Profile, Event, NewsItem, Partner, Referral } from './types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  console.log('[API] Fetching profile for:', userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.log('[API] Profile fetch error:', error.message);
    return null;
  }
  console.log('[API] Profile fetched:', data?.full_name);
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  console.log('[API] Updating profile:', userId, updates);
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.log('[API] Profile update error:', error.message);
    return null;
  }
  return data as Profile;
}

export async function fetchEvents(): Promise<Event[]> {
  console.log('[API] Fetching events');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[API] Events fetch error:', error.message);
    return [];
  }
  console.log('[API] Events fetched:', data?.length);
  return (data ?? []) as Event[];
}

export async function fetchEventById(id: string): Promise<Event | null> {
  console.log('[API] Fetching event:', id);
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.log('[API] Event fetch error:', error.message);
    return null;
  }
  return data as Event;
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  console.log('[API] Fetching news feed');
  const { data, error } = await supabase
    .from('news_feed')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[API] News fetch error:', error.message);
    return [];
  }
  console.log('[API] News fetched:', data?.length);
  return (data ?? []) as NewsItem[];
}

export async function fetchPartners(): Promise<Partner[]> {
  console.log('[API] Fetching partners');
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.log('[API] Partners fetch error:', error.message);
    return [];
  }
  console.log('[API] Partners fetched:', data?.length);
  return (data ?? []) as Partner[];
}

export async function fetchPartnerById(id: string): Promise<Partner | null> {
  console.log('[API] Fetching partner:', id);
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.log('[API] Partner fetch error:', error.message);
    return null;
  }
  return data as Partner;
}

export async function fetchReferrals(userId: string): Promise<Referral[]> {
  console.log('[API] Fetching referrals for:', userId);
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[API] Referrals fetch error:', error.message);
    return [];
  }
  console.log('[API] Referrals fetched:', data?.length);
  return (data ?? []) as Referral[];
}

export async function submitReview(userId: string, rating: number, comment: string | null) {
  console.log('[API] Submitting review:', { userId, rating, comment });
  const { data, error } = await supabase
    .from('reviews')
    .insert({ user_id: userId, rating, comment })
    .select()
    .single();

  if (error) {
    console.log('[API] Review submit error:', error.message);
    throw error;
  }
  console.log('[API] Review submitted:', data?.id);
  return data;
}

export async function submitPrivateEventInquiry(params: {
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}) {
  console.log('[API] Submitting private event inquiry:', params);
  const { data, error } = await supabase
    .from('private_event_inquiries')
    .insert(params)
    .select()
    .single();

  if (error) {
    console.log('[API] Inquiry submit error:', error.message);
    throw error;
  }
  console.log('[API] Inquiry submitted:', data?.id);
  return data;
}
