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
  StaffAccess,
} from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/src/lib/instant';
import { isManagerRole, isStaffRole } from '@/src/lib/loyalty';
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
  mapStaffAccess,
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

type StaffAccessData = {
  isManagerUser: boolean;
  isStaffUser: boolean;
  staffAccess: StaffAccess | null;
  staffAccessLoading: boolean;
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
const StaffAccessContext = createContext<StaffAccessData | null>(null);

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
const FALLBACK_STAFF_ACCESS: StaffAccessData = {
  isManagerUser: false,
  isStaffUser: false,
  staffAccess: null,
  staffAccessLoading: false,
};

type DataProviderProps = {
  children: React.ReactNode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInstantRecord(value: unknown): value is InstantRecord {
  return isRecord(value) && typeof value.id === 'string';
}

function firstInstantRecord(value: unknown): InstantRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isInstantRecord(first) ? first : null;
  }

  return isInstantRecord(value) ? value : null;
}

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
  const { user, isLoading: isAuthLoading } = useAuth();
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
  const profileViaUserQuery = db.useQuery(
    userId
      ? {
          $users: {
            $: {
              where: { id: userId },
            },
            profile: {},
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
  const staffAccessQuery = db.useQuery(
    userId
      ? {
          staff_access: {
            $: {
              where: { 'user.id': userId },
            },
          },
        }
      : null
  );
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

    const directRecord = firstInstantRecord(profileQuery.data?.profiles);
    const userRecord = firstInstantRecord(profileViaUserQuery.data?.$users);
    const linkedRecord = firstInstantRecord(
      (userRecord as Record<string, unknown> | null)?.profile
    );
    const record = directRecord ?? linkedRecord;

    return record ? mapProfile(record) : null;
  }, [profileQuery.data, profileViaUserQuery.data, userId]);

  const staffAccess = useMemo(() => {
    if (!userId) return null;

    const record = staffAccessQuery.data?.staff_access?.[0] as
      | InstantRecord
      | undefined;
    return record ? mapStaffAccess(record) : null;
  }, [staffAccessQuery.data, userId]);

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
  const pendingSavedToggleTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const [pendingSavedToggles, setPendingSavedToggles] = useState<
    Record<string, boolean>
  >({});
  const isProvisioningProfileRef = useRef(false);
  const profileProvisionAttemptsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userId) {
      profileProvisionAttemptsRef.current.clear();
      return;
    }

    if (profile) {
      profileProvisionAttemptsRef.current.delete(userId);
      return;
    }

    if (profileQuery.isLoading || profileViaUserQuery.isLoading) return;
    if (isProvisioningProfileRef.current) return;

    const attemptCount = profileProvisionAttemptsRef.current.get(userId) ?? 0;
    if (attemptCount >= MAX_PROFILE_PROVISION_ATTEMPTS) {
      return;
    }

    profileProvisionAttemptsRef.current.set(userId, attemptCount + 1);

    isProvisioningProfileRef.current = true;
    setIsProvisioningProfile(true);
    let isMounted = true;

    void ensureProfile({ email: user?.email ?? undefined, userId })
      .then((nextProfile) => {
        if (!isMounted) return;
        if (nextProfile) {
          profileProvisionAttemptsRef.current.delete(userId);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        console.error('[DataProvider] Failed to provision profile:', {
          error,
          isAuthLoading,
          profileQueryLoading: profileQuery.isLoading,
          profileViaUserQueryLoading: profileViaUserQuery.isLoading,
          userId,
        });
      })
      .finally(() => {
        if (!isMounted) return;
        isProvisioningProfileRef.current = false;
        setIsProvisioningProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    isAuthLoading,
    profile,
    profileQuery.isLoading,
    profileViaUserQuery.isLoading,
    user?.email,
    userId,
  ]);

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
    (eventId: string): boolean => {
      if (eventId in pendingSavedToggles) {
        return pendingSavedToggles[eventId];
      }

      return savedEventIdSet.has(eventId);
    },
    [pendingSavedToggles, savedEventIdSet]
  );

  const savedEventsList = useMemo(
    () => events.filter((event) => savedEventIdSet.has(event.id)),
    [events, savedEventIdSet]
  );

  const toggleSavedEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (!userId) return;
      if (isTogglingSavedRef.current.has(eventId)) return;

      const isCurrentlySaved = savedEvents.some(
        (entry) => entry.event_id === eventId
      );
      const shouldBeSaved = !isCurrentlySaved;

      const savedEvent = savedEvents.find(
        (entry) => entry.event_id === eventId
      );
      isTogglingSavedRef.current.add(eventId);

      const previousTimeout =
        pendingSavedToggleTimeoutsRef.current.get(eventId);
      if (previousTimeout != null) {
        clearTimeout(previousTimeout);
      }

      setPendingSavedToggles((previous) => ({
        ...previous,
        [eventId]: shouldBeSaved,
      }));

      const timeoutId = setTimeout(() => {
        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }, 8000);

      pendingSavedToggleTimeoutsRef.current.set(eventId, timeoutId);

      try {
        if (savedEvent) {
          await removeSavedEvent(savedEvent.id);
        } else {
          await saveEvent(userId, eventId);
        }
      } catch (error: unknown) {
        console.error('[DataProvider] Failed to toggle saved event:', error);
        const timeout = pendingSavedToggleTimeoutsRef.current.get(eventId);
        if (timeout != null) {
          clearTimeout(timeout);
        }

        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }
    },
    [savedEvents, userId]
  );

  useEffect(() => {
    if (!userId) {
      pendingSavedToggleTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingSavedToggleTimeoutsRef.current.clear();
      setPendingSavedToggles({});
      isTogglingSavedRef.current.clear();
      return;
    }

    Object.entries(pendingSavedToggles).forEach(([eventId, shouldBeSaved]) => {
      const isNowSaved = savedEvents.some(
        (savedEvent) => savedEvent.event_id === eventId
      );

      if (isNowSaved === shouldBeSaved) {
        const timeout = pendingSavedToggleTimeoutsRef.current.get(eventId);
        if (timeout != null) {
          clearTimeout(timeout);
        }

        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }
    });
  }, [pendingSavedToggles, savedEvents, userId]);

  const profileValue = useMemo(
    () => ({
      dismissVoucher,
      profile,
      profileLoading:
        Boolean(userId) &&
        (profileQuery.isLoading ||
          profileViaUserQuery.isLoading ||
          isProvisioningProfile),
      userId,
    }),
    [
      dismissVoucher,
      isProvisioningProfile,
      profile,
      profileQuery.isLoading,
      profileViaUserQuery.isLoading,
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
      savedEventsLoading:
        Boolean(userId) &&
        (savedEventsQuery.isLoading || eventsQuery.isLoading),
      toggleSavedEvent,
    }),
    [
      eventsQuery.isLoading,
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

  const staffAccessValue = useMemo(
    () => ({
      isManagerUser: Boolean(
        staffAccess?.is_active && isManagerRole(staffAccess.role)
      ),
      isStaffUser: Boolean(
        staffAccess?.is_active && isStaffRole(staffAccess.role)
      ),
      staffAccess,
      staffAccessLoading: Boolean(userId) && staffAccessQuery.isLoading,
    }),
    [staffAccess, staffAccessQuery.isLoading, userId]
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
                      <StaffAccessContext.Provider value={staffAccessValue}>
                        {children}
                      </StaffAccessContext.Provider>
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

export function useStaffAccessData(): StaffAccessData {
  return useRequiredContext(StaffAccessContext, FALLBACK_STAFF_ACCESS);
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
