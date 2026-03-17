import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

import type { Event, NewsItem, Partner, Profile, Referral } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapEvent,
  mapNewsItem,
  mapPartner,
  mapProfile,
  mapReferral,
} from '@/src/lib/mappers';

type ProfileData = {
  dismissVoucher: () => void;
  profile: Profile | null;
  profileLoading: boolean;
  userId: string;
};

type EventsData = {
  events: Event[];
  eventsLoading: boolean;
};

type NewsData = {
  news: NewsItem[];
  newsLoading: boolean;
};

type PartnersData = {
  partners: Partner[];
  partnersLoading: boolean;
};

type ReferralsData = {
  referrals: Referral[];
  referralsLoading: boolean;
};

const ProfileContext = createContext<ProfileData | null>(null);
const EventsContext = createContext<EventsData | null>(null);
const NewsContext = createContext<NewsData | null>(null);
const PartnersContext = createContext<PartnersData | null>(null);
const ReferralsContext = createContext<ReferralsData | null>(null);

const EMPTY_EVENTS: Event[] = [];
const EMPTY_NEWS: NewsItem[] = [];
const EMPTY_PARTNERS: Partner[] = [];
const EMPTY_REFERRALS: Referral[] = [];

// Safe fallbacks returned during sign-out DataProvider teardown so consumers
// never receive a thrown error during navigation transitions.
const FALLBACK_PROFILE: ProfileData = {
  dismissVoucher: () => {},
  profile: null,
  profileLoading: false,
  userId: '',
};
const FALLBACK_EVENTS: EventsData = { events: EMPTY_EVENTS, eventsLoading: false };
const FALLBACK_NEWS: NewsData = { news: EMPTY_NEWS, newsLoading: false };
const FALLBACK_PARTNERS: PartnersData = { partners: EMPTY_PARTNERS, partnersLoading: false };
const FALLBACK_REFERRALS: ReferralsData = { referrals: EMPTY_REFERRALS, referralsLoading: false };

type DataProviderProps = {
  children: React.ReactNode;
};

function useRequiredContext<T>(
  context: React.Context<T | null>,
  fallback: T
): T {
  const value = useContext(context);
  // Return the fallback during sign-out transitions when DataProvider has
  // unmounted before its consumers finish navigating away. This prevents
  // synchronous throws that would crash the app mid-transition.
  return value ?? fallback;
}

export function DataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const profileQuery = db.useQuery(
    userId
      ? {
          profiles: {
            $: {
              where: { 'user.id': userId },
            },
          },
        }
      : null
  );

  const eventsQuery = db.useQuery(userId ? { events: {} } : null);
  const newsQuery = db.useQuery(userId ? { news_items: {} } : null);
  const partnersQuery = db.useQuery(userId ? { partners: {} } : null);
  const referralsQuery = db.useQuery(
    userId
      ? {
          referrals: {
            $: {
              where: { 'referrer.user.id': userId },
            },
          },
        }
      : null
  );

  const profile = useMemo(() => {
    if (!userId) return null;

    const record = profileQuery.data?.profiles?.[0] as
      | InstantRecord
      | undefined;
    return record ? mapProfile(record) : null;
  }, [profileQuery.data, userId]);

  const events = useMemo(() => {
    if (!userId) return EMPTY_EVENTS;
    const records = (eventsQuery.data?.events ?? []) as InstantRecord[];
    return records.map(mapEvent);
  }, [eventsQuery.data, userId]);

  const news = useMemo(() => {
    if (!userId) return EMPTY_NEWS;
    const records = (newsQuery.data?.news_items ?? []) as InstantRecord[];
    return records.map(mapNewsItem);
  }, [newsQuery.data, userId]);

  const partners = useMemo(() => {
    if (!userId) return EMPTY_PARTNERS;
    const records = (partnersQuery.data?.partners ?? []) as InstantRecord[];
    return records.map(mapPartner);
  }, [partnersQuery.data, userId]);

  const referrals = useMemo(() => {
    if (!userId) return EMPTY_REFERRALS;
    const records = (referralsQuery.data?.referrals ?? []) as InstantRecord[];
    return records.map(mapReferral);
  }, [referralsQuery.data, userId]);

  const isDismissingRef = useRef(false);

  const dismissVoucher = useCallback((): void => {
    if (!profile || profile.has_seen_welcome_voucher) return;
    if (isDismissingRef.current) return;

    isDismissingRef.current = true;
    void db
      .transact(
        db.tx.profiles[profile.id].update({
          has_seen_welcome_voucher: true,
          updated_at: new Date().toISOString(),
        })
      )
      .catch((error: unknown) => {
        isDismissingRef.current = false;
        console.error(
          '[DataProvider] Failed to dismiss welcome voucher:',
          error
        );
      });
  }, [profile]);

  const profileValue = useMemo(
    () => ({
      dismissVoucher,
      profile,
      profileLoading: Boolean(userId) && profileQuery.isLoading,
      userId,
    }),
    [dismissVoucher, profile, profileQuery.isLoading, userId]
  );

  const eventsValue = useMemo(
    () => ({
      events,
      eventsLoading: Boolean(userId) && eventsQuery.isLoading,
    }),
    [events, eventsQuery.isLoading, userId]
  );

  const newsValue = useMemo(
    () => ({
      news,
      newsLoading: Boolean(userId) && newsQuery.isLoading,
    }),
    [news, newsQuery.isLoading, userId]
  );

  const partnersValue = useMemo(
    () => ({
      partners,
      partnersLoading: Boolean(userId) && partnersQuery.isLoading,
    }),
    [partners, partnersQuery.isLoading, userId]
  );

  const referralsValue = useMemo(
    () => ({
      referrals,
      referralsLoading: Boolean(userId) && referralsQuery.isLoading,
    }),
    [referrals, referralsQuery.isLoading, userId]
  );

  return (
    <ProfileContext.Provider value={profileValue}>
      <EventsContext.Provider value={eventsValue}>
        <NewsContext.Provider value={newsValue}>
          <PartnersContext.Provider value={partnersValue}>
            <ReferralsContext.Provider value={referralsValue}>
              {children}
            </ReferralsContext.Provider>
          </PartnersContext.Provider>
        </NewsContext.Provider>
      </EventsContext.Provider>
    </ProfileContext.Provider>
  );
}

export function useProfileData(): ProfileData {
  return useRequiredContext(ProfileContext, FALLBACK_PROFILE);
}

export function useEventsData(): EventsData {
  return useRequiredContext(EventsContext, FALLBACK_EVENTS);
}

export function useNewsData(): NewsData {
  return useRequiredContext(NewsContext, FALLBACK_NEWS);
}

export function usePartnersData(): PartnersData {
  return useRequiredContext(PartnersContext, FALLBACK_PARTNERS);
}

export function useReferralsData(): ReferralsData {
  return useRequiredContext(ReferralsContext, FALLBACK_REFERRALS);
}

export function useUserId(): string {
  const { userId } = useProfileData();
  return userId;
}

/**
 * @deprecated Use focused hooks (`useProfileData()`, `useEventsData()`, etc.) instead.
 * `useData()` merges all contexts, which defeats the context-splitting optimization
 * and causes broad re-renders whenever any context changes. Retained as a compatibility shim.
 */
export function useData() {
  const profileData = useProfileData();
  const eventsData = useEventsData();
  const newsData = useNewsData();
  const partnersData = usePartnersData();
  const referralsData = useReferralsData();

  return useMemo(
    () => ({
      ...profileData,
      ...eventsData,
      ...newsData,
      ...partnersData,
      ...referralsData,
    }),
    [eventsData, newsData, partnersData, profileData, referralsData]
  );
}

export function useFeaturedEvents(): Event[] {
  const { events } = useEventsData();
  return useMemo(() => events.filter((e) => e.featured), [events]);
}

export function useHomeEvents(): Event[] {
  const { events } = useEventsData();
  return useMemo(() => events.slice(0, 3), [events]);
}

export function useEventById(id: string | undefined): Event | null {
  const { events } = useEventsData();
  return useMemo(() => events.find((e) => e.id === id) ?? null, [events, id]);
}

export function usePartnerById(id: string | undefined): Partner | null {
  const { partners } = usePartnersData();
  return useMemo(
    () => partners.find((p) => p.id === id) ?? null,
    [partners, id]
  );
}

export function useFilteredPartners(category: string): Partner[] {
  const { partners } = usePartnersData();
  return useMemo(
    () =>
      category === 'All'
        ? partners
        : partners.filter((p) => p.category === category),
    [partners, category]
  );
}

export function useReferralProgress() {
  const { referrals } = useReferralsData();
  const completed = useMemo(
    () => referrals.filter((r) => r.status === 'Completed').length,
    [referrals]
  );
  return { current: completed, goal: 3 };
}
