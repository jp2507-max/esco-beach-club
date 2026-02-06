import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import { fetchProfile, fetchEvents, fetchNewsFeed, fetchPartners, fetchReferrals, updateProfile } from '@/lib/api';
import type { Profile, Event, NewsItem, Partner, Referral } from '@/lib/types';
import { useMemo, useCallback } from 'react';

export const [DataProvider, useData] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const profileQuery = useQuery<Profile | null>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    enabled: !!userId,
  });

  const newsQuery = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: fetchNewsFeed,
    enabled: !!userId,
  });

  const partnersQuery = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: fetchPartners,
    enabled: !!userId,
  });

  const referralsQuery = useQuery<Referral[]>({
    queryKey: ['referrals', userId],
    queryFn: () => fetchReferrals(userId),
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const { mutate: updateProfileMutate } = updateProfileMutation;

  const dismissVoucher = useCallback(() => {
    updateProfileMutate({ has_seen_welcome_voucher: true });
  }, [updateProfileMutate]);

  return {
    profile: profileQuery.data ?? null,
    profileLoading: profileQuery.isLoading,
    events: eventsQuery.data ?? [],
    eventsLoading: eventsQuery.isLoading,
    news: newsQuery.data ?? [],
    newsLoading: newsQuery.isLoading,
    partners: partnersQuery.data ?? [],
    partnersLoading: partnersQuery.isLoading,
    referrals: referralsQuery.data ?? [],
    referralsLoading: referralsQuery.isLoading,
    dismissVoucher,
    userId,
  };
});

export function useFeaturedEvents() {
  const { events } = useData();
  return useMemo(() => events.filter((e) => e.featured), [events]);
}

export function useHomeEvents() {
  const { events } = useData();
  return useMemo(() => events.slice(0, 3), [events]);
}

export function useEventById(id: string | undefined) {
  const { events } = useData();
  return useMemo(() => events.find((e) => e.id === id) ?? null, [events, id]);
}

export function usePartnerById(id: string | undefined) {
  const { partners } = useData();
  return useMemo(() => partners.find((p) => p.id === id) ?? null, [partners, id]);
}

export function useFilteredPartners(category: string) {
  const { partners } = useData();
  return useMemo(
    () => (category === 'All' ? partners : partners.filter((p) => p.category === category)),
    [partners, category]
  );
}

export function useReferralProgress() {
  const { referrals } = useData();
  const completed = useMemo(() => referrals.filter((r) => r.status === 'Completed').length, [referrals]);
  return { current: completed, goal: 3 };
}
