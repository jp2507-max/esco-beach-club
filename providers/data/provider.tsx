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
  StaffAccessContext,
} from './context';
import { useBookingResource } from './use-booking-resource';
import { useEventsResource } from './use-events-resource';
import { useMemberOffersResource } from './use-member-offers-resource';
import { useMenuResource } from './use-menu-resource';
import { useNewsResource } from './use-news-resource';
import { usePartnersResource } from './use-partners-resource';
import { useProfileResource } from './use-profile-resource';
import { useReferralsResource } from './use-referrals-resource';
import { useStaffResource } from './use-staff-resource';

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
  const newsValue = useNewsResource({ userId });
  const { partnerRedemptionsValue, partnersValue } = usePartnersResource({
    userId,
  });
  const referralsValue = useReferralsResource({ userId });
  const bookingContentValue = useBookingResource({ userId });
  const memberOffersValue = useMemberOffersResource({ userId });
  const menuContentValue = useMenuResource({ userId });
  const staffAccessValue = useStaffResource({ userId });

  return (
    <ProfileContext.Provider value={profileValue}>
      <EventsContext.Provider value={eventsValue}>
        <NewsContext.Provider value={newsValue}>
          <PartnersContext.Provider value={partnersValue}>
            <PartnerRedemptionsContext.Provider value={partnerRedemptionsValue}>
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
            </PartnerRedemptionsContext.Provider>
          </PartnersContext.Provider>
        </NewsContext.Provider>
      </EventsContext.Provider>
    </ProfileContext.Provider>
  );
}
