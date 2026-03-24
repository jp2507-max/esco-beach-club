import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Headphones,
  History,
  Martini,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, useColorScheme } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { UserTier } from '@/lib/types';
import { useProfileData } from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

// ── Tier helpers ────────────────────────────────────────────────

type TierConfig = {
  benefits: readonly BenefitKey[];
  gradient: readonly [string, string, ...string[]];
  nextTierKey: 'nextOwner' | 'nextStandard' | 'nextVip';
  tierKey: 'owner' | 'standard' | 'vip';
};

const TIER_CONFIG: Record<UserTier, TierConfig> = {
  STANDARD: {
    benefits: ['memberEvents', 'discountDining'],
    gradient: [Colors.secondary, '#4DB6AC'] as const,
    nextTierKey: 'nextStandard',
    tierKey: 'standard',
  },
  VIP: {
    benefits: ['memberEvents', 'discountDining', 'priorityBooking'],
    gradient: [Colors.primary, '#FF7043'] as const,
    nextTierKey: 'nextVip',
    tierKey: 'vip',
  },
  OWNER: {
    benefits: [
      'concierge',
      'priorityBooking',
      'poolsideDrinks',
      'memberEvents',
    ],
    gradient: [Colors.cardGradientStart, Colors.cardGradientEnd] as const,
    nextTierKey: 'nextOwner',
    tierKey: 'owner',
  },
} as const;

type BenefitKey =
  | 'concierge'
  | 'discountDining'
  | 'memberEvents'
  | 'poolsideDrinks'
  | 'priorityBooking';

type BenefitTitleKey =
  | 'benefits.concierge'
  | 'benefits.discountDining'
  | 'benefits.memberEvents'
  | 'benefits.poolsideDrinks'
  | 'benefits.priorityBooking';

type BenefitDescriptionKey =
  | 'benefits.discountDiningDesc'
  | 'benefits.memberEventsDesc'
  | 'benefits.poolsideDrinksDesc';

type BenefitConfig = {
  color: string;
  descKey: BenefitDescriptionKey | null;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  titleKey: BenefitTitleKey;
  wide: boolean;
};

const BENEFIT_MAP: Record<BenefitKey, BenefitConfig> = {
  concierge: {
    color: Colors.primary,
    descKey: null,
    icon: Headphones,
    titleKey: 'benefits.concierge',
    wide: false,
  },
  priorityBooking: {
    color: Colors.secondary,
    descKey: null,
    icon: CalendarCheck,
    titleKey: 'benefits.priorityBooking',
    wide: false,
  },
  poolsideDrinks: {
    color: Colors.gold,
    descKey: 'benefits.poolsideDrinksDesc',
    icon: Martini,
    titleKey: 'benefits.poolsideDrinks',
    wide: true,
  },
  memberEvents: {
    color: Colors.secondary,
    descKey: 'benefits.memberEventsDesc',
    icon: Sparkles,
    titleKey: 'benefits.memberEvents',
    wide: false,
  },
  discountDining: {
    color: Colors.warning,
    descKey: 'benefits.discountDiningDesc',
    icon: UtensilsCrossed,
    titleKey: 'benefits.discountDining',
    wide: true,
  },
} as const;

// ── Manage Account row config ───────────────────────────────────

type ManageItem = {
  color: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  id: string;
  labelKey:
    | 'manageAccount.billingHistory'
    | 'manageAccount.managePayments'
    | 'manageAccount.upgradeTier';
};

const MANAGE_ITEMS: ManageItem[] = [
  {
    color: Colors.primary,
    icon: TrendingUp,
    id: 'upgrade',
    labelKey: 'manageAccount.upgradeTier',
  },
  {
    color: Colors.secondary,
    icon: History,
    id: 'billing',
    labelKey: 'manageAccount.billingHistory',
  },
  {
    color: Colors.gold,
    icon: CreditCard,
    id: 'payments',
    labelKey: 'manageAccount.managePayments',
  },
];

// ── Screen ──────────────────────────────────────────────────────

export default function MembershipScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('membership');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { profile } = useProfileData();

  // Animations
  const heroScale = useSharedValue(0.92);
  const heroOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
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

  // Derived data
  const tierLevel: UserTier = profile?.tier ?? 'STANDARD';
  const tierConfig = TIER_CONFIG[tierLevel];
  const userName = profile?.full_name ?? '—';
  const memberSince = profile?.member_since
    ? profile.member_since.slice(0, 10)
    : '—';
  const points = profile?.points ?? 0;
  const maxPoints = profile?.max_points ?? 10000;
  const progressPercent =
    maxPoints > 0 ? Math.min((points / maxPoints) * 100, 100) : 0;

  const tierLabel = t(`tiers.${tierConfig.tierKey}`);
  const nextTierLabel = t(`tiers.${tierConfig.nextTierKey}`);

  const benefits = useMemo(
    () => tierConfig.benefits.map((key) => ({ ...BENEFIT_MAP[key], key })),
    [tierConfig.benefits]
  );

  function handleManagePress(): void {
    Alert.alert(t('comingSoon'));
  }

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
        {/* ── Section 1: Tier Hero Card ─────────────────────────── */}
        <Animated.View className="mb-8 mt-2" style={heroStyle}>
          <LinearGradient
            colors={tierConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                borderRadius: 20,
                overflow: 'hidden',
                padding: 28,
              },
              shadows.level5,
            ]}
          >
            {/* Abstract glow */}
            <View
              className="absolute rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                height: 200,
                right: -60,
                top: -60,
                width: 200,
              }}
            />
            <View className="z-10">
              <View className="mb-10 flex-row items-start justify-between">
                <View>
                  <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[3px] text-white/70">
                    {t('tierCard.currentTier')}
                  </Text>
                  <Text className="text-[32px] font-extrabold tracking-tight text-white">
                    {tierLabel}
                  </Text>
                </View>
                <Award color="rgba(255,255,255,0.9)" size={36} />
              </View>

              <View className="mb-7">
                <Text className="text-lg font-semibold text-white/90">
                  {userName}
                </Text>
                <Text className="text-xs text-white/60">
                  {t('tierCard.memberSince', { date: memberSince })}
                </Text>
              </View>

              <View className="gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-white">
                    {t('tierCard.progressTo', { nextTier: nextTierLabel })}
                  </Text>
                  <Text className="text-sm font-bold text-white">
                    {t('tierCard.pointsLabel', {
                      current: points.toLocaleString(),
                      max: maxPoints.toLocaleString(),
                    })}
                  </Text>
                </View>
                <View className="h-3 overflow-hidden rounded-full bg-black/10">
                  <View
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${progressPercent}%`,
                      shadowColor: '#fff',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                    }}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Section 2: Unlocked Benefits ──────────────────────── */}
        <Animated.View className="mb-8" style={fadeStyle}>
          <View className="mb-4 flex-row items-end justify-between px-1">
            <Text className="text-lg font-bold tracking-tight text-secondary dark:text-teal-light">
              {t('benefits.title')}
            </Text>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-primary dark:text-primary-bright">
              {t('benefits.viewAll')}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {benefits.map((benefit) => {
              const IconComp = benefit.icon;
              if (benefit.wide) {
                return (
                  <View
                    key={benefit.key}
                    className="w-full flex-row items-center gap-4 rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
                    style={shadows.level1}
                  >
                    <View
                      className="size-14 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${benefit.color}15` }}
                    >
                      <IconComp color={benefit.color} size={26} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                        {t(benefit.titleKey)}
                      </Text>
                      {benefit.descKey ? (
                        <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                          {t(benefit.descKey)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              }
              return (
                <View
                  key={benefit.key}
                  className="flex-1 gap-3 rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
                  style={[shadows.level1, { minWidth: '45%' }]}
                >
                  <View
                    className="size-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${benefit.color}15` }}
                  >
                    <IconComp color={benefit.color} size={22} />
                  </View>
                  <Text className="text-[15px] font-bold leading-tight text-text dark:text-text-primary-dark">
                    {t(benefit.titleKey)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Section 3: Manage Account ─────────────────────────── */}
        <Animated.View className="mb-8" style={fadeStyle}>
          <Text className="mb-4 px-1 text-lg font-bold tracking-tight text-secondary dark:text-teal-light">
            {t('manageAccount.title')}
          </Text>

          <View className="gap-3">
            {MANAGE_ITEMS.map((item) => {
              const IconComp = item.icon;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between rounded-2xl border border-border bg-white p-4 dark:border-dark-border dark:bg-dark-bg-card"
                  onPress={handleManagePress}
                  style={shadows.level1}
                  testID={`manage-${item.id}`}
                >
                  <View className="flex-row items-center gap-3.5">
                    <View
                      className="size-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isDark
                          ? Colors.darkBgElevated
                          : '#F5F4EC',
                      }}
                    >
                      <IconComp color={item.color} size={20} />
                    </View>
                    <Text className="text-[15px] font-semibold text-text dark:text-text-primary-dark">
                      {t(item.labelKey)}
                    </Text>
                  </View>
                  <ChevronRight
                    color={isDark ? Colors.textMutedDark : Colors.textMuted}
                    size={18}
                  />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Section 4: Recent Activity ────────────────────────── */}
        <Animated.View className="mb-4" style={fadeStyle}>
          <Text className="mb-4 px-1 text-lg font-bold tracking-tight text-secondary dark:text-teal-light">
            {t('activity.title')}
          </Text>

          <View className="overflow-hidden rounded-2xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
            {/* Tier upgrade activity */}
            <View className="flex-row items-start gap-3.5 border-b border-border p-5 dark:border-dark-border">
              <View
                className="mt-1.5 size-2.5 rounded-full"
                style={{ backgroundColor: Colors.primary }}
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                  {t('activity.tierUpgraded')}
                </Text>
                <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                  {t('activity.tierUpgradedDesc', { tier: tierLabel })}
                </Text>
                <Text className="mt-1.5 text-[10px] font-bold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
                  {t('activity.daysAgo', { count: 2 })}
                </Text>
              </View>
            </View>

            {/* Points earned activity */}
            <View className="flex-row items-start gap-3.5 p-5">
              <View
                className="mt-1.5 size-2.5 rounded-full"
                style={{ backgroundColor: Colors.secondary }}
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                  {t('activity.pointsEarned')}
                </Text>
                <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                  {t('activity.pointsEarnedDesc', { points: 450 })}
                </Text>
                <Text className="mt-1.5 text-[10px] font-bold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
                  {t('activity.daysAgo', { count: 4 })}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
