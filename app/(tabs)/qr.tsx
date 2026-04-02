import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMemberSummary } from '@/providers/DataProvider';
import { MemberCard } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { hapticMedium, hapticSuccess } from '@/src/lib/haptics/use-haptic';
import { getRewardTierLabelKey } from '@/src/lib/loyalty';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function QrTabScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { t: tHome } = useTranslation('home');
  const memberSummary = useMemberSummary();
  const didPlayRevealHaptic = useRef(false);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.set(withSpring(1, motion.spring.gentle));
    cardOpacity.set(withTiming(1, rmTiming(motion.dur.lg)));
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
    };
  }, [cardOpacity, cardScale]);

  useEffect(() => {
    if (didPlayRevealHaptic.current) return;
    didPlayRevealHaptic.current = true;
    hapticSuccess();
  }, []);

  const cardRevealStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ scale: cardScale.get() }],
  }));
  const memberId = memberSummary.memberId;
  const memberName = memberSummary.fullName || t('guest');
  const tierLabel = t(
    `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );

  function handleOpenStaffRoute(): void {
    router.push('/staff' as never);
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 items-center">
          <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-text-secondary dark:text-text-secondary-dark">
            {t('accessPass')}
          </Text>
          <Text className="mt-2 text-center text-2xl font-extrabold text-primary dark:text-primary-bright">
            {t('scanAtTable')}
          </Text>
        </View>

        <Animated.View
          className="rounded-3xl border border-border bg-white p-6 dark:border-dark-border dark:bg-dark-bg-card"
          style={cardRevealStyle}
        >
          <MemberCard
            className="min-h-[300px]"
            copy={{
              balanceLabel: tHome('cashbackBalance'),
              balanceSuffix: tHome('cashbackSuffix'),
              brandLabel: tHome('brandMark'),
              emptyQrLabel: t('staff.memberNotFound'),
              memberNameLabel: tHome('memberName'),
            }}
            cashbackPoints={memberSummary.cashbackBalancePoints}
            memberId={memberId}
            memberName={memberName}
            tierProgressPercent={memberSummary.tierProgressPercent}
            tierLabel={tierLabel}
            variant="full"
          />

          <Text className="mb-1 mt-5 text-center text-base font-bold text-text dark:text-primary-bright">
            {t('scanAtTable')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="items-center"
            onLongPress={() => {
              hapticMedium();
              handleOpenStaffRoute();
            }}
            testID="member-qr-hidden-staff-entry"
          >
            <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
              {t('refPrefix', { memberId })}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
