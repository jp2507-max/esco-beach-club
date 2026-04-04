import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type RewardTierKey, rewardTierKeys } from '@/lib/types';
import { useMemberSummary, useProfileData } from '@/providers/DataProvider';
import {
  MembershipActivitySection,
  MembershipBenefitsSection,
  MembershipTierHeroCard,
} from '@/src/components/profile/membership-sections';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { hapticSuccess } from '@/src/lib/haptics/haptics';
import {
  getRewardTierDefinition,
  getRewardTierLabelKey,
} from '@/src/lib/loyalty';
import {
  BENEFIT_MAP,
  TIER_CONFIG,
  useMembershipActivities,
} from '@/src/lib/profile/membership-screen';
import { ScrollView, View } from '@/src/tw';

export default function MembershipScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation('membership');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile } = useProfileData();
  const memberSummary = useMemberSummary();
  const heroScale = useSharedValue(0.92);
  const heroOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const didPlayTierHaptic = useRef(false);

  useEffect(() => {
    if (!didPlayTierHaptic.current) {
      didPlayTierHaptic.current = true;
      hapticSuccess();
    }

    heroScale.set(withSpring(1, motion.spring.gentle));
    heroOpacity.set(withTiming(1, rmTiming(500)));
    contentOpacity.set(withTiming(1, rmTiming(700)));

    return () => {
      cancelAnimation(heroScale);
      cancelAnimation(heroOpacity);
      cancelAnimation(contentOpacity);
    };
  }, [contentOpacity, heroOpacity, heroScale]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.get(),
    transform: [{ scale: heroScale.get() }],
  }));
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.get(),
  }));

  const tierLevel: RewardTierKey =
    memberSummary.lifetimeTierKey ?? rewardTierKeys.shore;
  const tierConfig = TIER_CONFIG[tierLevel];
  const userName = memberSummary.fullName || '—';
  const memberSince = useMemo(() => {
    if (!memberSummary.memberSince) return '—';

    try {
      const date = new Date(memberSummary.memberSince);
      return new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('[Membership] Date format failed', error);
      return memberSummary.memberSince.slice(0, 10);
    }
  }, [i18n.language, memberSummary.memberSince]);
  const tierLabel = t(
    `tiers.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );
  const nextTierLabel =
    memberSummary.nextTierKey !== null
      ? t(`tiers.${getRewardTierLabelKey(memberSummary.nextTierKey)}`)
      : t('tierCard.nextTierComingSoon');
  const tierProgressExpiryLabel = useMemo(() => {
    if (!memberSummary.tierProgressExpiresAt) return null;

    try {
      return new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(memberSummary.tierProgressExpiresAt));
    } catch {
      return memberSummary.tierProgressExpiresAt.slice(0, 10);
    }
  }, [i18n.language, memberSummary.tierProgressExpiresAt]);
  const showTierProgress =
    memberSummary.hasTierUpgradePath && memberSummary.nextTierKey !== null;
  const benefits = useMemo(
    () =>
      getRewardTierDefinition(
        memberSummary.lifetimeTierKey
      ).unlockedBenefits.map((key) => ({ ...BENEFIT_MAP[key], key })),
    [memberSummary.lifetimeTierKey]
  );
  const { activities, isActivityLoading } = useMembershipActivities(
    profile?.id
  );

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader testID="membership-back" title={t('title')} />

      <ScrollView
        contentContainerClassName="px-5 pb-10 pt-1"
        showsVerticalScrollIndicator={false}
      >
        <MembershipTierHeroCard
          cashbackBalancePoints={memberSummary.cashbackBalancePoints}
          heroStyle={heroStyle}
          memberSince={memberSince}
          nextTierLabel={nextTierLabel}
          progressPercent={memberSummary.tierProgressPercent}
          progressPoints={memberSummary.activeTierProgressPoints}
          progressTargetPoints={memberSummary.tierProgressTargetPoints}
          showTierProgress={showTierProgress}
          t={t}
          tierConfig={tierConfig}
          tierLabel={tierLabel}
          tierProgressExpiryLabel={tierProgressExpiryLabel}
          userName={userName}
        />

        <MembershipBenefitsSection
          benefits={benefits}
          fadeStyle={fadeStyle}
          isDark={isDark}
          t={t}
        />

        <MembershipActivitySection
          activities={activities}
          fadeStyle={fadeStyle}
          isActivityLoading={isActivityLoading}
          isDark={isDark}
          t={t}
        />

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
