import * as Clipboard from 'expo-clipboard';
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
  useProfileData,
  useReferralProgress,
  useReferralsData,
} from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { rmTiming } from '@/src/lib/animations/motion';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

type Milestone = {
  icon: typeof Wine;
  id: string;
  isGoal?: boolean;
  label: string;
  sub: string;
  unlocked: boolean;
};

export default function InviteScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('profile');
  const { profile } = useProfileData();
  const { referrals } = useReferralsData();
  const referralProgress = useReferralProgress();
  const referralCurrent = referralProgress.current;
  const referralGoal = referralProgress.goal;
  const code = profile?.referral_code ?? 'ESCO-2025';
  const progressRatio =
    referralGoal > 0
      ? Math.min(Math.max(referralCurrent / referralGoal, 0), 1)
      : 0;
  const [copiedRecently, setCopiedRecently] = useState<boolean>(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        sub: t('invite.milestones.locked'),
        unlocked: false,
      },
    ],
    [referralCurrent, referralGoal, remainingToGoal, t]
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
    try {
      await Share.share({
        message: t('invite.shareMessage', { code }),
      });
    } catch (e) {
      console.log('Share failed', e);
    }
  }

  return (
    <View className="flex-1 bg-[#FFF8F5] dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View
        className="absolute left-0 right-0 top-0 h-[250px] rounded-b-[60px]"
        style={{ backgroundColor: '#FCE4EC40' }}
      />

      <ProfileSubScreenHeader className="pb-2" title={t('menu.inviteEarn')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-1"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={fadeStyle}>
          <Text className="mt-2 text-center text-[32px] font-extrabold leading-10 text-text">
            {t('invite.titlePrefix')}
            {'\n'}
            <Text className="text-primary">{t('invite.titleHighlight')}</Text>
          </Text>
          <Text className="mb-7 mt-2.5 text-center text-[15px] leading-[22px] text-text-secondary">
            {t('invite.subtitle')}
          </Text>

          <View
            className="mb-7 rounded-[18px] bg-white p-5"
            style={shadows.level2}
          >
            <Text className="mb-[14px] text-[11px] font-bold tracking-[1.5px] text-primary">
              {t('invite.referralCode')}
            </Text>
            <View className="flex-row items-center rounded-[14px] bg-[#F9F5F0] px-[14px] py-[14px]">
              <View
                className="mr-3 size-9 items-center justify-center rounded-full"
                style={{ backgroundColor: `${Colors.primary}15` }}
              >
                <Users color={Colors.primary} size={18} />
              </View>
              <Text className="flex-1 text-xl font-extrabold tracking-[1px] text-text">
                {code}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('invite.copyReferralCode')}
                accessibilityHint={t('invite.copyReferralCodeHint')}
                className="size-9 items-center justify-center rounded-xl border border-border bg-white"
                onPress={handleCopy}
                testID="copy-code"
              >
                {copiedRecently ? (
                  <Text className="text-[10px] font-bold text-primary">
                    {t('invite.codeCopied')}
                  </Text>
                ) : (
                  <Copy color={Colors.textSecondary} size={18} />
                )}
              </Pressable>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-[11px] font-bold tracking-[1px] text-text-secondary">
              {t('invite.goalVipStatus')}
            </Text>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text">
                {t('invite.friendsJoined', {
                  current: referralCurrent,
                  goal: referralGoal,
                })}
              </Text>
              <Zap color={Colors.primary} size={22} />
            </View>
            <View
              className="relative h-2 overflow-visible rounded"
              onLayout={handleProgressTrackLayout}
              style={{ backgroundColor: '#FCE4EC' }}
            >
              <Animated.View
                className="absolute left-0 top-0 h-2 rounded bg-primary"
                style={progressFillStyle}
              />
              <Animated.View
                className="absolute left-0 top-[-4px] size-4 rounded-full bg-white"
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
                      ? Colors.primary
                      : m.unlocked
                        ? '#E8F5E9'
                        : '#F0F0F0',
                  }}
                >
                  {m.isGoal ? (
                    <View
                      className="absolute right-[-6px] top-[-6px] rounded-md px-1.5 py-0.5"
                      style={{
                        backgroundColor: Colors.primary,
                        borderColor: '#FFF8F5',
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
                        ? '#4CAF50'
                        : m.isGoal
                          ? '#fff'
                          : Colors.textLight
                    }
                  />
                </View>
                <Text className="mb-0.5 text-xs font-bold text-text">
                  {m.label}
                </Text>
                <Text
                  className="text-[11px] font-medium"
                  style={{
                    color: m.unlocked ? '#4CAF50' : Colors.textSecondary,
                  }}
                >
                  {m.sub}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-5">
            <View className="mb-[14px] flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-text">
                {t('invite.recentReferrals')}
              </Text>
              <Text className="text-sm font-semibold text-primary">
                {t('invite.viewAll')}
              </Text>
            </View>
            {referrals.map((ref) => (
              <View
                key={ref.id}
                className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-[14px]"
                style={shadows.level1}
              >
                <View className="flex-row items-center">
                  <View className="mr-3 size-11">
                    <Image
                      className="size-11 rounded-full"
                      source={{
                        uri:
                          ref.referred_avatar ??
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                      }}
                    />
                    <View
                      className="absolute bottom-0 left-0 size-3 rounded-full"
                      style={{
                        backgroundColor: '#4CAF50',
                        borderColor: Colors.surface,
                        borderWidth: 2,
                      }}
                    />
                  </View>
                  <View>
                    <Text className="text-[15px] font-bold text-text">
                      {ref.referred_name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-text-secondary">
                      {t('invite.joinedViaYourLink')}
                    </Text>
                  </View>
                </View>
                <View
                  className="rounded-[10px] px-3 py-[5px]"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <Text className="text-xs font-bold text-[#4CAF50]">
                    {ref.status}
                  </Text>
                </View>
              </View>
            ))}
            {referrals.length === 0 ? (
              <Text className="py-5 text-center text-sm text-text-secondary">
                {t('invite.noReferralsYet')}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        <View className="h-[100px]" />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-[#FFF8F5] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center justify-center rounded-[18px] bg-primary py-[17px]"
          onPress={handleShare}
          testID="share-btn"
        >
          <Upload color="#fff" size={20} />
          <Text className="ml-2.5 text-[17px] font-bold text-white">
            {t('invite.shareInviteLink')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
