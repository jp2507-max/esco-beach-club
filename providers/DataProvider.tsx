import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ensureProfile, removeSavedEvent, saveEvent } from '@/lib/api';
import type {
  BookingOccasionOption,
  BookingTimeSlotOption,
  Event,
  MemberOffer,
  MenuCategoryContent,
  MenuItemContent,
  NewsItem,
  Partner,
  PrivateEventTypeOption,
  Profile,
  Referral,
  SavedEvent,
} from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapBookingOccasion,
  mapBookingTimeSlot,
  mapEvent,
  mapMemberOffer,
  mapMenuCategory,
  mapMenuItem,
  mapNewsItem,
  mapPartner,
  mapPrivateEventType,
  mapProfile,
  mapReferral,
  mapSavedEvent,
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

type SavedEventsData = {
  isEventSaved: (eventId: string) => boolean;
  savedEvents: SavedEvent[];
  savedEventsList: Event[];
  savedEventsLoading: boolean;
  toggleSavedEvent: (eventId: string) => Promise<void>;
};

type BookingContentData = {
  bookingContentLoading: boolean;
  bookingOccasions: BookingOccasionOption[];
  bookingTimeSlots: BookingTimeSlotOption[];
  privateEventTypes: PrivateEventTypeOption[];
};

type MemberOffersData = {
  memberOffers: MemberOffer[];
  memberOffersLoading: boolean;
  welcomeOffer: MemberOffer | null;
};

type MenuContentData = {
  menuCategories: MenuCategoryContent[];
  menuContentLoading: boolean;
  menuItems: MenuItemContent[];
};

const ProfileContext = createContext<ProfileData | null>(null);
const EventsContext = createContext<EventsData | null>(null);
const NewsContext = createContext<NewsData | null>(null);
const PartnersContext = createContext<PartnersData | null>(null);
const ReferralsContext = createContext<ReferralsData | null>(null);
const SavedEventsContext = createContext<SavedEventsData | null>(null);
const BookingContentContext = createContext<BookingContentData | null>(null);
const MemberOffersContext = createContext<MemberOffersData | null>(null);
const MenuContentContext = createContext<MenuContentData | null>(null);

const EMPTY_EVENTS: Event[] = [];
const EMPTY_NEWS: NewsItem[] = [];
const EMPTY_PARTNERS: Partner[] = [];
const EMPTY_REFERRALS: Referral[] = [];
const EMPTY_SAVED_EVENTS: SavedEvent[] = [];
const EMPTY_BOOKING_OCCASIONS: BookingOccasionOption[] = [];
const EMPTY_BOOKING_TIME_SLOTS: BookingTimeSlotOption[] = [];
const EMPTY_MEMBER_OFFERS: MemberOffer[] = [];
const EMPTY_MENU_CATEGORIES: MenuCategoryContent[] = [];
const EMPTY_MENU_ITEMS: MenuItemContent[] = [];
const EMPTY_PRIVATE_EVENT_TYPES: PrivateEventTypeOption[] = [];
const MAX_PROFILE_PROVISION_ATTEMPTS = 2;

// Safe fallbacks returned during sign-out DataProvider teardown so consumers
// never receive a thrown error during navigation transitions.
const FALLBACK_PROFILE: ProfileData = {
  dismissVoucher: () => {},
  profile: null,
  profileLoading: false,
  userId: '',
};
const FALLBACK_EVENTS: EventsData = {
  events: EMPTY_EVENTS,
  eventsLoading: false,
};
const FALLBACK_NEWS: NewsData = { news: EMPTY_NEWS, newsLoading: false };
const FALLBACK_PARTNERS: PartnersData = {
  partners: EMPTY_PARTNERS,
  partnersLoading: false,
};
const FALLBACK_REFERRALS: ReferralsData = {
  referrals: EMPTY_REFERRALS,
  referralsLoading: false,
};
const FALLBACK_SAVED_EVENTS: SavedEventsData = {
  isEventSaved: () => false,
  savedEvents: EMPTY_SAVED_EVENTS,
  savedEventsList: EMPTY_EVENTS,
  savedEventsLoading: false,
  toggleSavedEvent: async () => {},
};
const FALLBACK_BOOKING_CONTENT: BookingContentData = {
  bookingContentLoading: false,
  bookingOccasions: EMPTY_BOOKING_OCCASIONS,
  bookingTimeSlots: EMPTY_BOOKING_TIME_SLOTS,
  privateEventTypes: EMPTY_PRIVATE_EVENT_TYPES,
};
const FALLBACK_MEMBER_OFFERS: MemberOffersData = {
  memberOffers: EMPTY_MEMBER_OFFERS,
  memberOffersLoading: false,
  welcomeOffer: null,
};
const FALLBACK_MENU_CONTENT: MenuContentData = {
  menuCategories: EMPTY_MENU_CATEGORIES,
  menuContentLoading: false,
  menuItems: EMPTY_MENU_ITEMS,
};

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
  const [isProvisioningProfile, setIsProvisioningProfile] =
    useState<boolean>(false);

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
  const savedEventsQuery = db.useQuery(
    userId
      ? {
          saved_events: {
            $: {
              where: { 'owner.id': userId },
            },
          },
        }
      : null
  );

  const eventsQuery = db.useQuery(userId ? { events: {} } : null);
  const newsQuery = db.useQuery(userId ? { news_items: {} } : null);
  const partnersQuery = db.useQuery(userId ? { partners: {} } : null);
  const bookingOccasionsQuery = db.useQuery(
    userId ? { booking_occasions: {} } : null
  );
  const bookingTimeSlotsQuery = db.useQuery(
    userId ? { booking_time_slots: {} } : null
  );
  const memberOffersQuery = db.useQuery(userId ? { member_offers: {} } : null);
  const menuCategoriesQuery = db.useQuery(
    userId ? { menu_categories: {} } : null
  );
  const menuItemsQuery = db.useQuery(userId ? { menu_items: {} } : null);
  const privateEventTypesQuery = db.useQuery(
    userId ? { private_event_types: {} } : null
  );
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

  const savedEvents = useMemo(() => {
    if (!userId) return EMPTY_SAVED_EVENTS;
    const records = (savedEventsQuery.data?.saved_events ??
      []) as InstantRecord[];
    return records.map(mapSavedEvent);
  }, [savedEventsQuery.data, userId]);

  const bookingOccasions = useMemo(() => {
    if (!userId) return EMPTY_BOOKING_OCCASIONS;
    const records = (bookingOccasionsQuery.data?.booking_occasions ??
      []) as InstantRecord[];
    return records
      .map(mapBookingOccasion)
      .filter((option) => option.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [bookingOccasionsQuery.data, userId]);

  const bookingTimeSlots = useMemo(() => {
    if (!userId) return EMPTY_BOOKING_TIME_SLOTS;
    const records = (bookingTimeSlotsQuery.data?.booking_time_slots ??
      []) as InstantRecord[];
    return records
      .map(mapBookingTimeSlot)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [bookingTimeSlotsQuery.data, userId]);

  const memberOffers = useMemo(() => {
    if (!userId) return EMPTY_MEMBER_OFFERS;
    const records = (memberOffersQuery.data?.member_offers ??
      []) as InstantRecord[];
    return records
      .map(mapMemberOffer)
      .filter((offer) => offer.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [memberOffersQuery.data, userId]);

  const menuCategories = useMemo(() => {
    if (!userId) return EMPTY_MENU_CATEGORIES;
    const records = (menuCategoriesQuery.data?.menu_categories ??
      []) as InstantRecord[];
    return records
      .map(mapMenuCategory)
      .filter((category) => category.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [menuCategoriesQuery.data, userId]);

  const menuItems = useMemo(() => {
    if (!userId) return EMPTY_MENU_ITEMS;
    const records = (menuItemsQuery.data?.menu_items ?? []) as InstantRecord[];
    return records
      .map(mapMenuItem)
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItemsQuery.data, userId]);

  const privateEventTypes = useMemo(() => {
    if (!userId) return EMPTY_PRIVATE_EVENT_TYPES;
    const records = (privateEventTypesQuery.data?.private_event_types ??
      []) as InstantRecord[];
    return records
      .map(mapPrivateEventType)
      .filter((option) => option.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [privateEventTypesQuery.data, userId]);

  const isDismissingRef = useRef(false);
  const isTogglingSavedRef = useRef<Set<string>>(new Set<string>());
  const isProvisioningProfileRef = useRef(false);
  const profileProvisionAttemptsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!userId) {
      profileProvisionAttemptsRef.current.clear();
      return;
    }

    if (profile) {
      profileProvisionAttemptsRef.current.delete(userId);
      return;
    }

    if (profileQuery.isLoading) return;
    if (isProvisioningProfileRef.current) return;

    const attemptCount = profileProvisionAttemptsRef.current.get(userId) ?? 0;
    if (attemptCount >= MAX_PROFILE_PROVISION_ATTEMPTS) {
      return;
    }

    profileProvisionAttemptsRef.current.set(userId, attemptCount + 1);

    isProvisioningProfileRef.current = true;
    setIsProvisioningProfile(true);

    void ensureProfile({ email: user?.email ?? undefined, userId })
      .then((nextProfile) => {
        if (nextProfile) {
          profileProvisionAttemptsRef.current.delete(userId);
        }
      })
      .catch((error: unknown) => {
        console.error('[DataProvider] Failed to provision profile:', error);
      })
      .finally(() => {
        isProvisioningProfileRef.current = false;
        setIsProvisioningProfile(false);
      });
  }, [profile, profileQuery.isLoading, user?.email, userId]);

  const dismissVoucher = useCallback((): void => {
    if (!profile || profile.has_seen_welcome_voucher) return;
    if (isDismissingRef.current) return;

    isDismissingRef.current = true;
    void db
      .transact(
        db.tx.profiles[profile.id].update({
          has_seen_welcome_voucher: true,
        })
      )
      .catch((error: unknown) => {
        console.error(
          '[DataProvider] Failed to dismiss welcome voucher:',
          error
        );
      })
      .finally(() => {
        isDismissingRef.current = false;
      });
  }, [profile]);

  const savedEventIdSet = useMemo(
    () => new Set(savedEvents.map((savedEvent) => savedEvent.event_id)),
    [savedEvents]
  );

  const isEventSaved = useCallback(
    (eventId: string): boolean => savedEventIdSet.has(eventId),
    [savedEventIdSet]
  );

  const savedEventsList = useMemo(
    () => events.filter((event) => savedEventIdSet.has(event.id)),
    [events, savedEventIdSet]
  );

  const toggleSavedEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (!userId) return;
      if (isTogglingSavedRef.current.has(eventId)) return;

      const savedEvent = savedEvents.find(
        (entry) => entry.event_id === eventId
      );
      isTogglingSavedRef.current.add(eventId);

      try {
        if (savedEvent) {
          await removeSavedEvent(savedEvent.id);
          return;
        }

        await saveEvent(userId, eventId);
      } catch (error: unknown) {
        console.error('[DataProvider] Failed to toggle saved event:', error);
      } finally {
        isTogglingSavedRef.current.delete(eventId);
      }
    },
    [savedEvents, userId]
  );

  const profileValue = useMemo(
    () => ({
      dismissVoucher,
      profile,
      profileLoading:
        Boolean(userId) && (profileQuery.isLoading || isProvisioningProfile),
      userId,
    }),
    [
      dismissVoucher,
      isProvisioningProfile,
      profile,
      profileQuery.isLoading,
      userId,
    ]
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

  const savedEventsValue = useMemo(
    () => ({
      isEventSaved,
      savedEvents,
      savedEventsList,
      savedEventsLoading: Boolean(userId) && savedEventsQuery.isLoading,
      toggleSavedEvent,
    }),
    [
      isEventSaved,
      savedEvents,
      savedEventsList,
      savedEventsQuery.isLoading,
      toggleSavedEvent,
      userId,
    ]
  );

  const bookingContentValue = useMemo(
    () => ({
      bookingContentLoading:
        Boolean(userId) &&
        (bookingOccasionsQuery.isLoading ||
          bookingTimeSlotsQuery.isLoading ||
          privateEventTypesQuery.isLoading),
      bookingOccasions,
      bookingTimeSlots,
      privateEventTypes,
    }),
    [
      bookingOccasions,
      bookingOccasionsQuery.isLoading,
      bookingTimeSlots,
      bookingTimeSlotsQuery.isLoading,
      privateEventTypes,
      privateEventTypesQuery.isLoading,
      userId,
    ]
  );

  const memberOffersValue = useMemo(
    () => ({
      memberOffers,
      memberOffersLoading: Boolean(userId) && memberOffersQuery.isLoading,
      welcomeOffer:
        memberOffers.find((offer) => offer.kind === 'welcome_voucher') ??
        memberOffers[0] ??
        null,
    }),
    [memberOffers, memberOffersQuery.isLoading, userId]
  );

  const menuContentValue = useMemo(
    () => ({
      menuCategories,
      menuContentLoading:
        Boolean(userId) &&
        (menuCategoriesQuery.isLoading || menuItemsQuery.isLoading),
      menuItems,
    }),
    [
      menuCategories,
      menuCategoriesQuery.isLoading,
      menuItems,
      menuItemsQuery.isLoading,
      userId,
    ]
  );

  return (
    <ProfileContext.Provider value={profileValue}>
      <EventsContext.Provider value={eventsValue}>
        <NewsContext.Provider value={newsValue}>
          <PartnersContext.Provider value={partnersValue}>
            <ReferralsContext.Provider value={referralsValue}>
              <SavedEventsContext.Provider value={savedEventsValue}>
                <BookingContentContext.Provider value={bookingContentValue}>
                  <MemberOffersContext.Provider value={memberOffersValue}>
                    <MenuContentContext.Provider value={menuContentValue}>
                      {children}
                    </MenuContentContext.Provider>
                  </MemberOffersContext.Provider>
                </BookingContentContext.Provider>
              </SavedEventsContext.Provider>
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

export function useSavedEventsData(): SavedEventsData {
  return useRequiredContext(SavedEventsContext, FALLBACK_SAVED_EVENTS);
}

export function useBookingContentData(): BookingContentData {
  return useRequiredContext(BookingContentContext, FALLBACK_BOOKING_CONTENT);
}

export function useMemberOffersData(): MemberOffersData {
  return useRequiredContext(MemberOffersContext, FALLBACK_MEMBER_OFFERS);
}

export function useMenuContentData(): MenuContentData {
  return useRequiredContext(MenuContentContext, FALLBACK_MENU_CONTENT);
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
  const savedEventsData = useSavedEventsData();
  const bookingContentData = useBookingContentData();
  const memberOffersData = useMemberOffersData();
  const menuContentData = useMenuContentData();

  return useMemo(
    () => ({
      ...bookingContentData,
      ...profileData,
      ...eventsData,
      ...memberOffersData,
      ...menuContentData,
      ...newsData,
      ...partnersData,
      ...referralsData,
      ...savedEventsData,
    }),
    [
      bookingContentData,
      eventsData,
      memberOffersData,
      menuContentData,
      newsData,
      partnersData,
      profileData,
      referralsData,
      savedEventsData,
    ]
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

export function useSavedEventsCount(): number {
  const { savedEvents } = useSavedEventsData();
  return savedEvents.length;
}
