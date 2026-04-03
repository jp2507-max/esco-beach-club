import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  Award,
  Copy,
  Shield,
  Upload,
  Users,
  Wine,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, type LayoutChangeEvent, Share } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import {
  ReferralsDataProvider,
  useProfileData,
  useReferralProgress,
  useReferralsData,
} from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { rmTiming } from '@/src/lib/animations/motion';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { config } from '@/src/lib/config';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const defaultAvatar = require('@/assets/images/icon.png');

type Milestone = {
  icon: typeof Wine;
  id: string;
  isGoal?: boolean;
  label: string;
  sub: string;
  unlocked: boolean;
};

type ReferralStatusKey =
  | 'invite.status.accepted'
  | 'invite.status.completed'
  | 'invite.status.pending'
  | 'invite.status.rejected'
  | 'invite.status.unknown';

const referralStatusToKey: Record<string, ReferralStatusKey> = {
  Accepted: 'invite.status.accepted',
  Completed: 'invite.status.completed',
  Pending: 'invite.status.pending',
  Rejected: 'invite.status.rejected',
  Unknown: 'invite.status.unknown',
};

/** Completed referrals required for the third milestone (beyond VIP goal). */
const PRIORITY_ENTRY_COMPLETED_THRESHOLD = 5;

function InviteReferralRowStagger({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

function InviteScreenContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isDark = useAppIsDark();
  const { t } = useTranslation('profile');
  const { profile } = useProfileData();
  const { referrals, referralsLoading } = useReferralsData();
  const referralProgress = useReferralProgress();
  const referralCurrent = referralProgress.current;
  const referralGoal = referralProgress.goal;
  const code = profile?.referral_code ?? null;
  const remainingToPriority = Math.max(
    PRIORITY_ENTRY_COMPLETED_THRESHOLD - referralCurrent,
    0
  );
  const progressRatio =
    referralGoal > 0
      ? Math.min(Math.max(referralCurrent / referralGoal, 0), 1)
      : 0;
  const [copiedRecently, setCopiedRecently] = useState<boolean>(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didPlayGoalHaptic = useRef(false);

  const progress = useSharedValue(0);
  const fade = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const remainingToGoal = Math.max(referralGoal - referralCurrent, 0);

  const milestones = useMemo<Milestone[]>(
    () => [
      {
        icon: Wine,
        id: 'free-cocktail',
        label: t('invite.milestones.freeCocktail'),
        sub: t('invite.milestones.unlocked'),
        unlocked: true,
      },
      {
        icon: Award,
        id: 'vip-badge',
        isGoal: true,
        label: t('invite.milestones.vipBadge'),
        sub:
          referralCurrent >= referralGoal
            ? t('invite.milestones.unlocked')
            : t('invite.milestones.twoMoreInvites', { count: remainingToGoal }),
        unlocked: referralCurrent >= referralGoal,
      },
      {
        icon: Shield,
        id: 'priority-entry',
        label: t('invite.milestones.priorityEntry'),
        sub:
          referralCurrent >= PRIORITY_ENTRY_COMPLETED_THRESHOLD
            ? t('invite.milestones.unlocked')
            : t('invite.milestones.priorityProgress', {
                count: remainingToPriority,
              }),
        unlocked: referralCurrent >= PRIORITY_ENTRY_COMPLETED_THRESHOLD,
      },
    ],
    [referralCurrent, referralGoal, remainingToGoal, remainingToPriority, t]
  );

  useEffect(() => {
    progress.set(withTiming(progressRatio, rmTiming(800)));
    fade.set(withTiming(1, rmTiming(500)));
    return () => {
      cancelAnimation(progress);
      cancelAnimation(fade);
    };
  }, [fade, progress, progressRatio]);

  useEffect(() => {
    if (progressRatio < 1 || didPlayGoalHaptic.current) return;
    didPlayGoalHaptic.current = true;
    hapticSuccess();
  }, [progressRatio]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: trackWidth.get(),
    transform: [
      { translateX: ((progress.get() - 1) * trackWidth.get()) / 2 },
      { scaleX: Math.max(progress.get(), 0.001) },
    ],
  }));

  const progressThumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: Math.min(
          Math.max(progress.get() * trackWidth.get() - 8, -8),
          Math.max(trackWidth.get() - 8, -8)
        ),
      },
    ],
  }));

  function handleProgressTrackLayout(event: LayoutChangeEvent): void {
    trackWidth.set(event.nativeEvent.layout.width);
  }

  async function handleCopy(): Promise<void> {
    if (!code) return;
    hapticLight();
    try {
      await Clipboard.setStringAsync(code);
      setCopiedRecently(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedRecently(false);
      }, 2000);
    } catch (e) {
      console.error('Copy failed', e);
      Alert.alert(t('invite.codeCopyFailed'));
    }
  }

  async function handleShare(): Promise<void> {
    if (!code) return;
    hapticLight();

    try {
      const inviteUrl = `${config.app.inviteBaseUrl}/${code}`;
      await Share.share({
        message: t('invite.shareMessage', { code, url: inviteUrl }),
      });
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert(t('invite.shareFailed'));
    }
  }

  const heroBlobColor = isDark
    ? Colors.inviteHeroBlobDark
    : Colors.inviteHeroBlobLight;
  const progressTrackColor = isDark
    ? Colors.inviteProgressTrackDark
    : Colors.inviteProgressTrackLight;
  const referralStatusBg = isDark
    ? Colors.inviteReferralStatusBgDark
    : Colors.inviteReferralStatusBgLight;
  const referralStatusText = isDark
    ? Colors.inviteReferralStatusTextDark
    : Colors.inviteReferralStatusTextLight;
  const referralWarningBg = isDark
    ? 'rgba(245, 158, 11, 0.13)'
    : Colors.badgeWarningLightBackground;
  const referralWarningText = isDark ? Colors.warningDark : Colors.warning;
  const milestoneUnlockedBg = isDark
    ? Colors.inviteMilestoneUnlockedBgDark
    : Colors.inviteMilestoneUnlockedBgLight;
  const milestoneLockedBg = isDark
    ? Colors.darkBgElevated
    : Colors.inviteMilestoneLockedBgLight;
  const milestoneUnlockedIcon = isDark
    ? Colors.inviteMilestoneUnlockedIconDark
    : Colors.inviteMilestoneUnlockedIconLight;

  if (referralsLoading) {
    return (
      <View
        className="flex-1 bg-background dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <ProfileSubScreenHeader title={t('menu.inviteEarn')} />
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator
            color={isDark ? Colors.primaryBright : Colors.primary}
            size="large"
          />
          <Text className="mt-4 text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
            {t('invite.loadingReferrals')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <View
        className="absolute left-0 right-0 top-0 h-62.5 rounded-b-[60px]"
        style={{ backgroundColor: heroBlobColor }}
      />

      <ProfileSubScreenHeader className="pb-2" title={t('menu.inviteEarn')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-1"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={fadeStyle}>
          <Text className="mt-2 text-center text-[32px] font-extrabold leading-10 text-text dark:text-text-primary-dark">
            {t('invite.titlePrefix')}
            {'\n'}
            <Text className="text-primary dark:text-primary-bright">
              {t('invite.titleHighlight')}
            </Text>
          </Text>
          <Text className="mb-7 mt-2.5 text-center text-[15px] leading-5.5 text-text-secondary dark:text-text-secondary-dark">
            {t('invite.subtitle')}
          </Text>

          <View
            className="mb-7 rounded-[18px] border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card"
            style={shadows.level2}
          >
            <Text className="mb-3.5 text-[11px] font-bold tracking-[1.5px] text-primary dark:text-primary-bright">
              {t('invite.referralCode')}
            </Text>
            <View
              className="flex-row items-center rounded-[14px] px-3.5 py-3.5"
              style={{
                backgroundColor: isDark
                  ? Colors.darkBgElevated
                  : Colors.inviteReferralCodeBgLight,
              }}
            >
              <View
                className="mr-3 size-9 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isDark
                    ? `${Colors.primaryBright}22`
                    : `${Colors.primary}15`,
                }}
              >
                <Users
                  color={isDark ? Colors.primaryBright : Colors.primary}
                  size={18}
                />
              </View>
              <Text className="flex-1 text-xl font-extrabold tracking-[1px] text-text dark:text-text-primary-dark">
                {code ?? t('invite.codeLoading')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('invite.copyReferralCode')}
                accessibilityHint={t('invite.copyReferralCodeHint')}
                className="size-9 items-center justify-center rounded-xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-elevated"
                disabled={!code}
                onPress={handleCopy}
                testID="copy-code"
              >
                {copiedRecently ? (
                  <Text className="text-[10px] font-bold text-primary dark:text-primary-bright">
                    {t('invite.codeCopied')}
                  </Text>
                ) : (
                  <Copy
                    color={isDark ? Colors.textMutedDark : Colors.textSecondary}
                    size={18}
                  />
                )}
              </Pressable>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-[11px] font-bold tracking-[1px] text-text-secondary dark:text-text-secondary-dark">
              {t('invite.goalVipStatus')}
            </Text>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                {t('invite.friendsJoined', {
                  current: referralCurrent,
                  goal: referralGoal,
                })}
              </Text>
              <Zap
                color={isDark ? Colors.primaryBright : Colors.primary}
                size={22}
              />
            </View>
            <View
              className="relative h-2 overflow-visible rounded"
              onLayout={handleProgressTrackLayout}
              style={{ backgroundColor: progressTrackColor }}
            >
              <Animated.View
                className="absolute left-0 top-0 h-2 rounded bg-primary dark:bg-primary-bright"
                style={progressFillStyle}
              />
              <Animated.View
                className="absolute -top-1 left-0 size-4 rounded-full bg-white"
                style={[
                  progressThumbStyle,
                  {
                    borderColor: Colors.primary,
                    borderWidth: 3,
                  },
                ]}
              />
            </View>
          </View>

          <View className="mb-8 flex-row justify-around">
            {milestones.map((m) => (
              <View key={m.id} className="flex-1 items-center">
                <View
                  className="mb-2 size-14 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: m.isGoal
                      ? isDark
                        ? Colors.primaryBright
                        : Colors.primary
                      : m.unlocked
                        ? milestoneUnlockedBg
                        : milestoneLockedBg,
                  }}
                >
                  {m.isGoal ? (
                    <View
                      className="absolute -right-1.5 -top-1.5 rounded-md px-1.5 py-0.5"
                      style={{
                        backgroundColor: Colors.primary,
                        borderColor: Colors.badgeLightBackground,
                        borderWidth: 2,
                      }}
                    >
                      <Text className="text-[8px] font-extrabold tracking-[0.5px] text-white">
                        {t('invite.milestones.goal')}
                      </Text>
                    </View>
                  ) : null}
                  <m.icon
                    size={22}
                    color={
                      m.unlocked
                        ? milestoneUnlockedIcon
                        : m.isGoal
                          ? Colors.white
                          : isDark
                            ? Colors.textMutedDark
                            : Colors.textLight
                    }
                  />
                </View>
                <Text className="mb-0.5 text-xs font-bold text-text dark:text-text-primary-dark">
                  {m.label}
                </Text>
                <Text
                  className="text-[11px] font-medium"
                  style={{
                    color: m.unlocked
                      ? referralStatusText
                      : isDark
                        ? Colors.textSecondaryDark
                        : Colors.textSecondary,
                  }}
                >
                  {m.sub}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-5">
            <View className="mb-3.5 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                {t('invite.recentReferrals')}
              </Text>
              {referrals.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint={t('invite.viewAllHint')}
                  accessibilityLabel={t('invite.viewAll')}
                  hitSlop={8}
                  onPress={() => {
                    hapticLight();
                    router.push('/profile/invite-referrals');
                  }}
                >
                  <Text className="text-sm font-semibold text-primary dark:text-primary-bright">
                    {t('invite.viewAll')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {referrals.slice(0, 3).map((ref, refIndex) => (
              <InviteReferralRowStagger key={ref.id} index={refIndex}>
                <View
                  className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-white p-3.5 dark:border-dark-border dark:bg-dark-bg-card"
                  style={shadows.level1}
                >
                  <View className="flex-row items-center">
                    <View className="mr-3 size-11">
                      <Image
                        className="size-11 rounded-full"
                        source={
                          ref.referred_avatar
                            ? { uri: ref.referred_avatar }
                            : defaultAvatar
                        }
                      />
                      <View
                        className="absolute bottom-0 left-0 size-3 rounded-full"
                        style={{
                          backgroundColor: Colors.success,
                          borderColor: isDark
                            ? Colors.darkBgCard
                            : Colors.surface,
                          borderWidth: 2,
                        }}
                      />
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                        {ref.referred_name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                        {t('invite.joinedViaYourLink')}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="rounded-[10px] px-3 py-1.25"
                    style={{
                      backgroundColor:
                        ref.status === 'Pending' || ref.status === 'Rejected'
                          ? referralWarningBg
                          : referralStatusBg,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color:
                          ref.status === 'Pending' || ref.status === 'Rejected'
                            ? referralWarningText
                            : referralStatusText,
                      }}
                    >
                      {t(
                        referralStatusToKey[ref.status] ||
                          'invite.status.unknown'
                      )}
                    </Text>
                  </View>
                </View>
              </InviteReferralRowStagger>
            ))}
            {referrals.length === 0 ? (
              <Text className="py-5 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
                {t('invite.noReferralsYet')}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        <View className="h-25" />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-border px-5 pt-3 dark:border-dark-border"
        style={{
          backgroundColor: isDark
            ? Colors.darkBgCard
            : Colors.badgeLightBackground,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center justify-center rounded-[18px] bg-primary py-4.25 opacity-100 disabled:opacity-50 dark:bg-primary-bright"
          disabled={!code}
          onPress={handleShare}
          testID="share-btn"
        >
          <Upload color={Colors.white} size={20} />
          <Text className="ml-2.5 text-[17px] font-bold text-white">
            {t('invite.shareInviteLink')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function InviteScreen(): React.JSX.Element {
  return (
    <ReferralsDataProvider>
      <InviteScreenContent />
    </ReferralsDataProvider>
  );
}
