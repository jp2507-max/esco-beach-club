import { useMemo } from 'react';

import type { Event, Partner } from '@/lib/types';
import { rewardTierKeys } from '@/lib/types';
import {
  getActiveTierProgressPoints,
  getNextRewardTierKey,
  getTierProgressPercent,
  hasTierUpgradePath,
} from '@/src/lib/loyalty';

import {
  type BookingContentData,
  type EventsData,
  type MemberOffersData,
  type MemberSummary,
  type MenuContentData,
  type NewsData,
  type PartnerRedemptionsData,
  type PartnersData,
  type ProfileData,
  type ReferralsData,
  type SavedEventsData,
  type StaffAccessData,
  useBookingContentData,
  useEventsData,
  useMemberOffersData,
  useMenuContentData,
  useNewsData,
  usePartnerRedemptionsData,
  usePartnersData,
  useProfileData,
  useReferralsData,
  useSavedEventsData,
  useStaffAccessData,
} from './context';

export type UseDataReturn = BookingContentData &
  ProfileData &
  EventsData &
  MemberOffersData &
  MenuContentData &
  NewsData &
  PartnersData &
  PartnerRedemptionsData &
  ReferralsData &
  SavedEventsData &
  StaffAccessData;

export function useData(): UseDataReturn {
  const profileData = useProfileData();
  const eventsData = useEventsData();
  const newsData = useNewsData();
  const partnersData = usePartnersData();
  const partnerRedemptionsData = usePartnerRedemptionsData();
  const referralsData = useReferralsData();
  const savedEventsData = useSavedEventsData();
  const bookingContentData = useBookingContentData();
  const memberOffersData = useMemberOffersData();
  const menuContentData = useMenuContentData();
  const staffAccessData = useStaffAccessData();

  return useMemo(
    () => ({
      ...bookingContentData,
      ...profileData,
      ...eventsData,
      ...memberOffersData,
      ...menuContentData,
      ...newsData,
      ...partnersData,
      ...partnerRedemptionsData,
      ...referralsData,
      ...savedEventsData,
      ...staffAccessData,
    }),
    [
      bookingContentData,
      eventsData,
      memberOffersData,
      menuContentData,
      newsData,
      partnersData,
      partnerRedemptionsData,
      profileData,
      referralsData,
      savedEventsData,
      staffAccessData,
    ]
  );
}

export function useFeaturedEvents(): Event[] {
  const { events } = useEventsData();
  return useMemo(() => events.filter((event) => event.featured), [events]);
}

export function useHomeEvents(): Event[] {
  const { events } = useEventsData();
  return useMemo(() => events.slice(0, 3), [events]);
}

export function useEventById(id: string | undefined): Event | null {
  const { events } = useEventsData();
  return useMemo(
    () => events.find((event) => event.id === id) ?? null,
    [events, id]
  );
}

export function usePartnerById(id: string | undefined): Partner | null {
  const { partners } = usePartnersData();
  return useMemo(
    () => partners.find((partner) => partner.id === id) ?? null,
    [partners, id]
  );
}

export function useFilteredPartners(category: string): Partner[] {
  const { partners } = usePartnersData();
  return useMemo(
    () =>
      category === 'All'
        ? partners
        : partners.filter((partner) => partner.category === category),
    [partners, category]
  );
}

const REFERRAL_GOAL = 3;

export function useReferralProgress(): { current: number; goal: number } {
  const { referrals } = useReferralsData();
  return useMemo(
    () => ({
      current: referrals.filter((referral) => referral.status === 'Completed')
        .length,
      goal: REFERRAL_GOAL,
    }),
    [referrals]
  );
}

export function useSavedEventsCount(): number {
  const { savedEvents } = useSavedEventsData();
  return useMemo(() => savedEvents.length, [savedEvents]);
}

export function useMemberSummary(): MemberSummary {
  const { profile } = useProfileData();
  const savedEventsCount = useSavedEventsCount();

  return useMemo(() => {
    const lifetimeTierKey =
      profile?.lifetime_tier_key ?? rewardTierKeys.escoLifeMember;
    const nextTierKey =
      profile?.next_tier_key ?? getNextRewardTierKey(lifetimeTierKey);
    const tierProgressTargetPoints = profile?.tier_progress_target_points ?? 0;
    const activeTierProgressPoints = profile
      ? getActiveTierProgressPoints(profile)
      : 0;
    const tierProgressPercent = profile ? getTierProgressPercent(profile) : 0;
    const canUpgrade =
      hasTierUpgradePath(lifetimeTierKey) &&
      nextTierKey !== null &&
      tierProgressTargetPoints > 0;

    return {
      activeTierProgressPoints,
      avatarUrl: profile?.avatar_url ?? null,
      cashbackBalancePoints: profile?.cashback_points_balance ?? 0,
      cashbackLifetimePoints: profile?.cashback_points_lifetime_earned ?? 0,
      fullName: profile?.full_name ?? '',
      hasProfile: Boolean(profile),
      hasTierUpgradePath: canUpgrade,
      lifetimeTierKey,
      memberId: profile?.member_id ?? '',
      memberSince: profile?.member_since ?? null,
      nextTierKey,
      nightsLeft: profile?.nights_left ?? 0,
      saved: profile?.saved ?? 0,
      savedEventsCount,
      tierProgressExpiresAt: profile?.tier_progress_expires_at ?? null,
      tierProgressPercent,
      tierProgressTargetPoints,
    };
  }, [profile, savedEventsCount]);
}
