import type React from 'react';
import { createContext, useContext } from 'react';

import type {
  Event,
  MemberOffer,
  MenuCategoryContent,
  MenuItemContent,
  NewsItem,
  Partner,
  PartnerRedemption,
  PrivateEventTypeOption,
  Profile,
  Referral,
  SavedEvent,
} from '@/lib/types';

export type ProfileData = {
  dismissVoucher: () => void;
  profile: Profile | null;
  profileProvisionError: Error | null;
  profileLoading: boolean;
  retryProfileProvision: () => Promise<void>;
  userId: string;
};

export type EventsData = {
  events: Event[];
  eventsLoading: boolean;
};

export type NewsData = {
  news: NewsItem[];
  newsLoading: boolean;
};

export type PartnersData = {
  partners: Partner[];
  partnersLoading: boolean;
};

export type PartnerRedemptionsData = {
  partnerRedemptions: PartnerRedemption[];
  partnerRedemptionsLoading: boolean;
};

export type ReferralsData = {
  referrals: Referral[];
  referralsLoading: boolean;
};

export type SavedEventsData = {
  isEventSaved: (eventId: string) => boolean;
  savedEvents: SavedEvent[];
  savedEventsList: Event[];
  savedEventsLoading: boolean;
  toggleSavedEvent: (eventId: string) => Promise<void>;
};

export type BookingContentData = {
  bookingContentLoading: boolean;
  privateEventTypes: PrivateEventTypeOption[];
};

export type MemberOffersData = {
  memberOffers: MemberOffer[];
  memberOffersLoading: boolean;
  welcomeOffer: MemberOffer | null;
};

export type MenuContentData = {
  menuCategories: MenuCategoryContent[];
  menuContentLoading: boolean;
  menuItems: MenuItemContent[];
};

export type MemberSummary = {
  activeTierProgressPoints: number;
  avatarUrl: string | null;
  cashbackBalancePoints: number;
  cashbackLifetimePoints: number;
  fullName: string;
  hasProfile: boolean;
  hasTierUpgradePath: boolean;
  lifetimeTierKey: Profile['lifetime_tier_key'];
  memberId: string;
  memberSince: string | null;
  nextTierKey: Profile['next_tier_key'];
  nightsLeft: number;
  saved: number;
  savedEventsCount: number;
  tierProgressExpiresAt: string | null;
  tierProgressPercent: number;
  tierProgressTargetPoints: number;
};

export type DataProviderProps = {
  children: React.ReactNode;
};

export const ProfileContext = createContext<ProfileData | null>(null);
export const EventsContext = createContext<EventsData | null>(null);
export const NewsContext = createContext<NewsData | null>(null);
export const PartnersContext = createContext<PartnersData | null>(null);
export const PartnerRedemptionsContext =
  createContext<PartnerRedemptionsData | null>(null);
export const ReferralsContext = createContext<ReferralsData | null>(null);
export const SavedEventsContext = createContext<SavedEventsData | null>(null);
export const BookingContentContext = createContext<BookingContentData | null>(
  null
);
export const MemberOffersContext = createContext<MemberOffersData | null>(null);
export const MenuContentContext = createContext<MenuContentData | null>(null);

export const EMPTY_EVENTS: Event[] = [];
export const EMPTY_NEWS: NewsItem[] = [];
export const EMPTY_PARTNERS: Partner[] = [];
export const EMPTY_PARTNER_REDEMPTIONS: PartnerRedemption[] = [];
export const EMPTY_REFERRALS: Referral[] = [];
export const EMPTY_SAVED_EVENTS: SavedEvent[] = [];
export const EMPTY_MEMBER_OFFERS: MemberOffer[] = [];
export const EMPTY_MENU_CATEGORIES: MenuCategoryContent[] = [];
export const EMPTY_MENU_ITEMS: MenuItemContent[] = [];
export const EMPTY_PRIVATE_EVENT_TYPES: PrivateEventTypeOption[] = [];

const FALLBACK_PROFILE: ProfileData = {
  dismissVoucher: () => {},
  profile: null,
  profileProvisionError: null,
  profileLoading: false,
  retryProfileProvision: async () => {},
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
const FALLBACK_PARTNER_REDEMPTIONS: PartnerRedemptionsData = {
  partnerRedemptions: EMPTY_PARTNER_REDEMPTIONS,
  partnerRedemptionsLoading: false,
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

function useRequiredContext<T>(
  context: React.Context<T | null>,
  fallback: T
): T {
  const value = useContext(context);
  return value ?? fallback;
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

export function usePartnerRedemptionsData(): PartnerRedemptionsData {
  return useRequiredContext(
    PartnerRedemptionsContext,
    FALLBACK_PARTNER_REDEMPTIONS
  );
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
