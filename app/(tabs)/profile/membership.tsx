import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { type RewardTierKey, rewardTierKeys } from '@/lib/types';
import { useMemberSummary, useProfileData } from '@/providers/DataProvider';
import { ProfileSubScreenHeader, SkeletonText } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics/haptics';
import { db } from '@/src/lib/instant';
import {
  getRewardTierDefinition,
  getRewardTierLabelKey,
  type RewardBenefitKey,
} from '@/src/lib/loyalty';
import { type InstantRecord, mapRewardTransaction } from '@/src/lib/mappers';
import { shadows } from '@/src/lib/styles/shadows';
import { cn } from '@/src/lib/utils';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

// ── Tier helpers ────────────────────────────────────────────────

type TierConfig = {
  gradient: readonly [string, string, ...string[]];
};

const TIER_CONFIG: Record<RewardTierKey, TierConfig> = {
  ESCO_LIFE_MEMBER: {
    gradient: [Colors.secondary, Colors.tealLight] as const,
  },
} as const;

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

const BENEFIT_MAP: Record<RewardBenefitKey, BenefitConfig> = {
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

function StaggeredBenefitShell({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

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
  const router = useRouter();
  const { t, i18n } = useTranslation('membership');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { profile } = useProfileData();
  const memberSummary = useMemberSummary();

  // Animations
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

  // Derived data
  const tierLevel: RewardTierKey =
    memberSummary.lifetimeTierKey ?? rewardTierKeys.escoLifeMember;
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
    } catch (err) {
      console.error('[Membership] Date format failed', err);
      return memberSummary.memberSince.slice(0, 10);
    }
  }, [i18n.language, memberSummary.memberSince]);
  const cashbackBalancePoints = memberSummary.cashbackBalancePoints;
  const progressPoints = memberSummary.activeTierProgressPoints;
  const progressTargetPoints = memberSummary.tierProgressTargetPoints;
  const progressPercent = memberSummary.tierProgressPercent;

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

  // Fetch reward activity
  const profileId = profile?.id;
  const activityQuery = db.useQuery(
    profileId
      ? ({
          reward_transactions: {
            $: {
              where: { 'member.id': profileId },
              order: { created_at: 'desc' },
              limit: 5,
            },
          },
        } as const)
      : null
  );

  const activities = useMemo(() => {
    const rawTxs =
      (activityQuery.data?.reward_transactions as
        | InstantRecord[]
        | undefined) ?? [];
    if (rawTxs.length === 0) return [];
    const txs = rawTxs.map(mapRewardTransaction);

    return txs.map((tx) => {
      const createdAt = tx.created_at ? new Date(tx.created_at) : new Date();
      const diffMs = Math.max(0, new Date().getTime() - createdAt.getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        cashbackPoints: tx.cashback_points_delta,
        eventType: tx.event_type,
        id: tx.id,
        daysAgo: days,
      };
    });
  }, [activityQuery.data]);

  const hasActivity = activities.length > 0;
  const isActivityLoading = Boolean(profileId) && activityQuery.isLoading;

  function getActivityCopy(activity: {
    cashbackPoints: number;
    eventType: string;
  }): {
    description: string;
    title: string;
  } {
    const absolutePoints = Math.abs(activity.cashbackPoints).toLocaleString();

    if (activity.eventType === 'refund' || activity.eventType === 'void') {
      return {
        description: t('activity.cashbackReversedDesc', {
          points: absolutePoints,
        }),
        title: t('activity.cashbackReversed'),
      };
    }

    if (activity.eventType === 'manual_adjustment') {
      return {
        description: t('activity.cashbackAdjustedDesc', {
          points: absolutePoints,
        }),
        title: t('activity.cashbackAdjusted'),
      };
    }

    if (activity.eventType === 'tier_progress_reset') {
      return {
        description: t('activity.progressResetDesc'),
        title: t('activity.progressReset'),
      };
    }

    return {
      description: t('activity.cashbackEarnedDesc', {
        points: absolutePoints,
      }),
      title: t('activity.cashbackEarned'),
    };
  }

  function handleManagePress(): void {
    hapticLight();
    router.push('/profile/help-center' as never);
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
                    {t('tierCard.cashbackBalance')}
                  </Text>
                  <Text className="text-sm font-bold text-white">
                    {t('tierCard.cashbackPoints', {
                      value: cashbackBalancePoints.toLocaleString(),
                    })}
                  </Text>
                </View>
                {showTierProgress ? (
                  <>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-white">
                        {t('tierCard.progressTo', { nextTier: nextTierLabel })}
                      </Text>
                      <Text className="text-sm font-bold text-white">
                        {t('tierCard.progressPoints', {
                          current: progressPoints.toLocaleString(),
                          target: progressTargetPoints.toLocaleString(),
                        })}
                      </Text>
                    </View>
                    <View className="h-3 overflow-hidden rounded-full bg-black/10">
                      <View
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${progressPercent}%`,
                          shadowColor: Colors.white,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                        }}
                      />
                    </View>
                    <Text className="text-xs text-white/70">
                      {tierProgressExpiryLabel
                        ? t('tierCard.progressExpires', {
                            date: tierProgressExpiryLabel,
                          })
                        : t('tierCard.progressResetsMonthly')}
                    </Text>
                  </>
                ) : (
                  <View className="mt-2 rounded-2xl bg-black/10 px-4 py-3">
                    <Text className="text-sm font-semibold text-white">
                      {t('tierCard.nextTierComingSoon')}
                    </Text>
                    <Text className="mt-1 text-xs text-white/70">
                      {t('tierCard.progressUnavailable')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Section 2: Unlocked Benefits ──────────────────────── */}
        <Animated.View className="mb-8" style={fadeStyle}>
          <View className="mb-4 flex-row items-end justify-between px-1">
            <Text className="text-lg font-bold tracking-tight text-secondary dark:text-secondary-bright">
              {t('benefits.title')}
            </Text>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-primary dark:text-primary-bright">
              {t('benefits.viewAll')}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {benefits.map((benefit, benefitIndex) => {
              const IconComp = benefit.icon;
              const benefitAccent = accentOnDarkBackground(
                benefit.color,
                isDark
              );
              if (benefit.wide) {
                return (
                  <StaggeredBenefitShell key={benefit.key} index={benefitIndex}>
                    <View
                      className="w-full flex-row items-center gap-4 rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
                      style={shadows.level1}
                    >
                      <View
                        className="size-14 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${benefitAccent}15` }}
                      >
                        <IconComp color={benefitAccent} size={26} />
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
                  </StaggeredBenefitShell>
                );
              }
              return (
                <StaggeredBenefitShell key={benefit.key} index={benefitIndex}>
                  <View
                    className="flex-1 gap-3 rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
                    style={[shadows.level1, { minWidth: '45%' }]}
                  >
                    <View
                      className="size-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${benefitAccent}15` }}
                    >
                      <IconComp color={benefitAccent} size={22} />
                    </View>
                    <Text className="text-[15px] font-bold leading-tight text-text dark:text-text-primary-dark">
                      {t(benefit.titleKey)}
                    </Text>
                  </View>
                </StaggeredBenefitShell>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Section 3: Manage Account ─────────────────────────── */}
        <Animated.View className="mb-8" style={fadeStyle}>
          <Text className="mb-4 px-1 text-lg font-bold tracking-tight text-secondary dark:text-secondary-bright">
            {t('manageAccount.title')}
          </Text>

          <View className="gap-3">
            {MANAGE_ITEMS.map((item) => {
              const IconComp = item.icon;
              const manageAccent = accentOnDarkBackground(item.color, isDark);
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
                          : Colors.sand,
                      }}
                    >
                      <IconComp color={manageAccent} size={20} />
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
          <View className="mb-4 flex-row items-center justify-between px-1">
            <Text className="text-lg font-bold tracking-tight text-secondary dark:text-secondary-bright">
              {t('activity.title')}
            </Text>
          </View>

          <View className="overflow-hidden rounded-2xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
            {isActivityLoading ? (
              <View className="gap-3 p-5">
                <SkeletonText lines={3} />
              </View>
            ) : hasActivity ? (
              activities.map(
                (
                  item: {
                    cashbackPoints: number;
                    daysAgo: number;
                    eventType: string;
                    id: string;
                  },
                  index: number
                ) => {
                  const activityCopy = getActivityCopy(item);

                  return (
                    <View
                      key={item.id}
                      className={cn(
                        'flex-row items-start gap-3.5 p-5',
                        index < activities.length - 1 &&
                          'border-b border-border dark:border-dark-border'
                      )}
                    >
                      <View
                        className="mt-1.5 size-2.5 rounded-full"
                        style={{
                          backgroundColor: isDark
                            ? Colors.secondaryBright
                            : Colors.secondary,
                        }}
                      />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                          {activityCopy.title}
                        </Text>
                        <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                          {activityCopy.description}
                        </Text>
                        <Text className="mt-1.5 text-[10px] font-bold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
                          {t('activity.daysAgo', { count: item.daysAgo })}
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
            ) : (
              <View className="p-5">
                <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                  {t('activity.emptyTitle')}
                </Text>
                <Text className="mt-1.5 text-xs leading-5 text-text-secondary dark:text-text-secondary-dark">
                  {t('activity.emptyDescription')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
