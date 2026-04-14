import { LinearGradient } from 'expo-linear-gradient';
import type { TFunction } from 'i18next';
import { Award, ChevronRight } from 'lucide-react-native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { SkeletonText } from '@/src/components/ui';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { buildMembershipBenefitRows } from '@/src/lib/profile/membership-benefit-rows';
import {
  type BenefitConfig,
  getMembershipActivityCopy,
  type ManageItem,
  type MembershipActivityItem,
  type TierConfig,
} from '@/src/lib/profile/membership-screen';
import { shadows } from '@/src/lib/styles/shadows';
import { cn } from '@/src/lib/utils';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

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

type MembershipBenefit = BenefitConfig & {
  key: string;
};

type MembershipSectionAnimatedStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export function MembershipTierHeroCard({
  cashbackBalancePoints,
  heroStyle,
  memberSince,
  nextTierLabel,
  progressPercent,
  progressPoints,
  progressTargetPoints,
  showTierProgress,
  t,
  tierConfig,
  tierLabel,
  tierProgressExpiryLabel,
  userName,
}: {
  cashbackBalancePoints: number;
  heroStyle: MembershipSectionAnimatedStyle;
  memberSince: string;
  nextTierLabel: string;
  progressPercent: number;
  progressPoints: number;
  progressTargetPoints: number;
  showTierProgress: boolean;
  t: TFunction;
  tierConfig: TierConfig;
  tierLabel: string;
  tierProgressExpiryLabel: string | null;
  userName: string;
}): React.JSX.Element {
  return (
    <Animated.View className="mb-8 mt-2" style={heroStyle}>
      <LinearGradient
        colors={tierConfig.gradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[
          {
            borderRadius: 20,
            overflow: 'hidden',
            padding: 28,
          },
          shadows.level5,
        ]}
      >
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: Colors.overlayTintLight,
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
            <Award color={Colors.whiteAlpha90} size={36} />
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
  );
}

export function MembershipBenefitsSection({
  benefits,
  fadeStyle,
  isDark,
  t,
}: {
  benefits: MembershipBenefit[];
  fadeStyle: MembershipSectionAnimatedStyle;
  isDark: boolean;
  t: TFunction;
}): React.JSX.Element {
  const benefitRows = buildMembershipBenefitRows(benefits);

  return (
    <Animated.View className="mb-8" style={fadeStyle}>
      <View className="mb-4 flex-row items-end justify-between px-1">
        <Text className="text-lg font-bold tracking-tight text-secondary dark:text-secondary-bright">
          {t('benefits.title')}
        </Text>
        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-primary dark:text-primary-bright">
          {t('benefits.viewAll')}
        </Text>
      </View>

      <View className="gap-3">
        {benefitRows.map((row, rowIndex) => (
          <View
            key={row.map((benefit) => benefit.key).join('-')}
            className={cn(
              'items-start',
              row.length === 1 ? 'gap-0' : 'flex-row justify-between'
            )}
          >
            {row.map((benefit, itemIndex) => {
              const IconComp = benefit.icon;
              const benefitAccent = accentOnDarkBackground(
                benefit.color,
                isDark
              );
              const benefitIndex = rowIndex * 2 + itemIndex;

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
                    className="self-start gap-3 rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
                    style={[
                      shadows.level1,
                      { width: row.length === 1 ? '100%' : '48.5%' },
                    ]}
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
        ))}
      </View>
    </Animated.View>
  );
}

export function MembershipManageSection({
  fadeStyle,
  isDark,
  items,
  t,
  onPress,
}: {
  fadeStyle: MembershipSectionAnimatedStyle;
  isDark: boolean;
  items: ManageItem[];
  t: TFunction;
  onPress: (item: ManageItem) => void;
}): React.JSX.Element {
  return (
    <Animated.View className="mb-8" style={fadeStyle}>
      <Text className="mb-4 px-1 text-lg font-bold tracking-tight text-secondary dark:text-secondary-bright">
        {t('manageAccount.title')}
      </Text>

      <View className="gap-3">
        {items.map((item) => {
          const IconComp = item.icon;
          const manageAccent = accentOnDarkBackground(item.color, isDark);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-2xl border border-border bg-white p-4 dark:border-dark-border dark:bg-dark-bg-card"
              onPress={() => onPress(item)}
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
  );
}

export function MembershipActivitySection({
  activities,
  fadeStyle,
  isActivityLoading,
  isDark,
  t,
}: {
  activities: MembershipActivityItem[];
  fadeStyle: MembershipSectionAnimatedStyle;
  isActivityLoading: boolean;
  isDark: boolean;
  t: TFunction;
}): React.JSX.Element {
  const hasActivity = activities.length > 0;

  return (
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
          activities.map((activity, index) => {
            const activityCopy = getMembershipActivityCopy({
              activity,
              t,
            });

            return (
              <View
                key={activity.id}
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
                    {t('activity.daysAgo', { count: activity.daysAgo })}
                  </Text>
                </View>
              </View>
            );
          })
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
  );
}
