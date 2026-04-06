import React from 'react';

import { useAuth } from '@/providers/AuthProvider';

import {
  BookingContentContext,
  type DataProviderProps,
  EventsContext,
  MemberOffersContext,
  MenuContentContext,
  NewsContext,
  PartnerRedemptionsContext,
  PartnersContext,
  ProfileContext,
  ReferralsContext,
  SavedEventsContext,
} from './context';
import { useBookingResource } from './use-booking-resource';
import { useEventsResource } from './use-events-resource';
import { useMemberOffersResource } from './use-member-offers-resource';
import { useMenuResource } from './use-menu-resource';
import { useNewsResource } from './use-news-resource';
import { usePartnersResource } from './use-partners-resource';
import { useProfileResource } from './use-profile-resource';
import { useReferralsResource } from './use-referrals-resource';

export function DataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id ?? '';
  const authEmail = user?.email ?? undefined;

  const profileValue = useProfileResource({
    authEmail,
    isAuthLoading,
    userId,
  });
  const { eventsValue, savedEventsValue } = useEventsResource({ userId });
  return (
    <ProfileContext.Provider value={profileValue}>
      <EventsContext.Provider value={eventsValue}>
        <SavedEventsContext.Provider value={savedEventsValue}>
          {children}
        </SavedEventsContext.Provider>
      </EventsContext.Provider>
    </ProfileContext.Provider>
  );
}

function useFeatureUserId(): string {
  const { user } = useAuth();
  return user?.id ?? '';
}

export function NewsDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const newsValue = useNewsResource({ userId });

  return (
    <NewsContext.Provider value={newsValue}>{children}</NewsContext.Provider>
  );
}

export function PartnersDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const { partnersValue } = usePartnersResource({ userId });

  return (
    <PartnersContext.Provider value={partnersValue}>
      {children}
    </PartnersContext.Provider>
  );
}

export function PerksDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const { partnerRedemptionsValue, partnersValue } = usePartnersResource({
    userId,
  });

  return (
    <PartnersContext.Provider value={partnersValue}>
      <PartnerRedemptionsContext.Provider value={partnerRedemptionsValue}>
        {children}
      </PartnerRedemptionsContext.Provider>
    </PartnersContext.Provider>
  );
}

export function PartnerRedemptionsDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const { partnerRedemptionsValue } = usePartnersResource({ userId });

  return (
    <PartnerRedemptionsContext.Provider value={partnerRedemptionsValue}>
      {children}
    </PartnerRedemptionsContext.Provider>
  );
}

export function ReferralsDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const referralsValue = useReferralsResource({ userId });

  return (
    <ReferralsContext.Provider value={referralsValue}>
      {children}
    </ReferralsContext.Provider>
  );
}

export function BookingContentDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const bookingContentValue = useBookingResource({ userId });

  return (
    <BookingContentContext.Provider value={bookingContentValue}>
      {children}
    </BookingContentContext.Provider>
  );
}

export function MemberOffersDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const memberOffersValue = useMemberOffersResource({ userId });

  return (
    <MemberOffersContext.Provider value={memberOffersValue}>
      {children}
    </MemberOffersContext.Provider>
  );
}

export function MenuContentDataProvider({
  children,
}: DataProviderProps): React.JSX.Element {
  const userId = useFeatureUserId();
  const menuContentValue = useMenuResource({ userId });

  return (
    <MenuContentContext.Provider value={menuContentValue}>
      {children}
    </MenuContentContext.Provider>
  );
}
