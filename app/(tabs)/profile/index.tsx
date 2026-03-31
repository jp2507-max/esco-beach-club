import { useRouter } from 'expo-router';
import {
  Bell,
  Bookmark,
  ChevronRight,
  CreditCard,
  Crown,
  Gift,
  Headphones,
  HelpCircle,
  LogOut,
  PencilLine,
  RefreshCw,
  Settings,
  Star,
  Ticket,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, useColorScheme } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import {
  useMemberOffersData,
  useMemberSummary,
  useProfileData,
} from '@/providers/DataProvider';
import { HeaderGlassButton } from '@/src/components/ui';
import { Avatar } from '@/src/components/ui/avatar';
import { rmTiming } from '@/src/lib/animations/motion';
import { config } from '@/src/lib/config';
import {
  getRewardTierLabelKey,
  hasRewardBenefit,
  rewardBenefitKeys,
} from '@/src/lib/loyalty';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type MenuItem = {
  color: string;
  disabled?: boolean;
  icon: React.ComponentType<{
    color?: string;
    size?: number;
  }>;
  id: string;
  label: string;
  route: string | null;
};

type StatCardProps = {
  accentColor: string;
  label: string;
  progressDegrees: number;
  progressTrackColor: string;
  value: string;
};

const welcomeOfferVoucherKeys = [
  'welcomeGift',
  'welcomeDiscount',
  'firstVisit',
  'validForThirtyDays',
] as const;

type WelcomeOfferVoucherKey = (typeof welcomeOfferVoucherKeys)[number];

function resolveWelcomeOfferVoucherKey(
  key: unknown,
  fallback: WelcomeOfferVoucherKey
): WelcomeOfferVoucherKey {
  if (typeof key !== 'string') return fallback;
  if ((welcomeOfferVoucherKeys as readonly string[]).includes(key)) {
    return key as WelcomeOfferVoucherKey;
  }
  return fallback;
}

function StatCard({
  accentColor,
  label,
  progressDegrees,
  progressTrackColor,
  value,
}: StatCardProps): React.JSX.Element {
  const clampedDegrees = Math.max(0, Math.min(progressDegrees, 360));
  return (
    <View className="flex-1 items-center rounded-[18px] border border-border bg-white p-[18px] dark:border-dark-border dark:bg-dark-bg-card">
      <View className="mb-2.5 size-[60px] items-center justify-center">
        <View
          className="size-[60px] rounded-full border-[5px]"
          style={{ borderColor: progressTrackColor }}
        >
          <View
            className="absolute left-[-5px] top-[-5px] size-[60px] rounded-full border-[5px]"
            style={{
              borderColor: accentColor,
              borderTopColor: 'transparent',
              transform: [{ rotate: `${clampedDegrees}deg` }],
            }}
          />
        </View>
      </View>
      <Text className="mb-0.5 text-[10px] font-bold tracking-[1px] text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const voucherScale = useSharedValue(0.9);
  const voucherOpacity = useSharedValue(0);

  const { profile, dismissVoucher } = useProfileData();
  const memberSummary = useMemberSummary();
  const { welcomeOffer } = useMemberOffersData();
  const { signOut } = useAuth();

  const userName = memberSummary.fullName || t('guest');
  const tierBadge = t(
    `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );
  const bio = profile?.bio?.trim() ?? '';
  const memberSince = memberSummary.memberSince
    ? memberSummary.memberSince.slice(0, 10)
    : '—';
  const cashbackLifetimePoints = memberSummary.cashbackLifetimePoints;
  const nightsLeft = memberSummary.nightsLeft;
  const saved = memberSummary.saved;
  const welcomeOfferBadgeKey = resolveWelcomeOfferVoucherKey(
    welcomeOffer?.badge_key,
    'welcomeGift'
  );
  const welcomeOfferTitleKey = resolveWelcomeOfferVoucherKey(
    welcomeOffer?.title_key,
    'welcomeDiscount'
  );
  const welcomeOfferSubtitleKey = resolveWelcomeOfferVoucherKey(
    welcomeOffer?.subtitle_key,
    'firstVisit'
  );
  const welcomeOfferTermsKey = resolveWelcomeOfferVoucherKey(
    welcomeOffer?.terms_key,
    'validForThirtyDays'
  );
  const welcomeOfferCode = welcomeOffer?.code ?? 'WELCOME10';

  const [showVoucher, setShowVoucher] = useState<boolean>(false);
  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        color: Colors.primary,
        icon: PencilLine,
        id: 'edit-profile',
        label: t('menu.editProfile'),
        route: '/profile/edit-profile',
      },
      {
        color: Colors.primary,
        icon: Users,
        id: 'invite-earn',
        label: t('menu.inviteEarn'),
        route: '/profile/invite',
      },
      {
        color: '#FFB300',
        icon: Star,
        id: 'rate-us',
        label: t('menu.rateUs'),
        route: '/rate-us',
      },
      {
        color: Colors.secondary,
        icon: Bookmark,
        id: 'saved-events',
        label: t('menu.savedEvents'),
        route: '/profile/saved-events',
      },
      {
        color: Colors.primary,
        icon: CreditCard,
        id: 'membership',
        label: t('menu.membership'),
        route: '/profile/membership',
      },
      {
        color: '#FF9800',
        disabled: true,
        icon: Gift,
        id: 'rewards',
        label: t('menu.rewards'),
        route: null,
      },
      {
        color: Colors.secondary,
        icon: Settings,
        id: 'settings',
        label: t('menu.settings'),
        route: '/profile/theme-preference',
      },
      {
        color: '#7C4DFF',
        icon: HelpCircle,
        id: 'help-support',
        label: t('menu.helpSupport'),
        route: '/profile/help-center',
      },
      {
        color: '#00A884',
        icon: RefreshCw,
        id: 'restart-onboarding',
        label: t('menu.restartOnboarding'),
        route: '/onboarding-welcome',
      },
      {
        color: '#EF5350',
        icon: LogOut,
        id: 'log-out',
        label: t('menu.logOut'),
        route: null,
      },
    ],
    [t]
  );

  useEffect(() => {
    if (showVoucher) {
      voucherScale.set(
        withSpring(1, {
          damping: 14,
          stiffness: 130,
        })
      );
      voucherOpacity.set(withTiming(1, rmTiming(500)));
    }
    return () => {
      cancelAnimation(voucherScale);
      cancelAnimation(voucherOpacity);
    };
  }, [showVoucher, voucherOpacity, voucherScale]);

  useEffect(() => {
    if (!profile) return;
    setShowVoucher(!profile.has_seen_welcome_voucher);
  }, [profile]);

  const hasPrioritySupport = hasRewardBenefit(
    memberSummary.lifetimeTierKey,
    rewardBenefitKeys.concierge
  );

  const voucherStyle = useAnimatedStyle(() => ({
    opacity: voucherOpacity.get(),
    transform: [{ scale: voucherScale.get() }],
  }));

  function handleConcierge(): void {
    if (!config.contact.conciergeBase) return;
    const message = encodeURIComponent(t('conciergeMessage'));
    const whatsappUrl = `${config.contact.conciergeBase}?text=${message}`;
    Linking.openURL(whatsappUrl).catch((err: unknown) => {
      const msg = t('errors.openWhatsApp');
      console.error('handleConcierge:', err);
      Alert.alert(msg);
    });
  }

  function handleSupport(): void {
    const supportEmail = config.contact.supportEmail;
    Linking.openURL(`mailto:${supportEmail}`).catch((err: unknown) => {
      const msg = t('errors.openMail');
      console.error('handleSupport:', err);
      Alert.alert(msg);
    });
  }

  async function handleMenuPress(item: MenuItem): Promise<void> {
    if (item.disabled) return;
    if (item.id === 'log-out') {
      try {
        await signOut();
      } catch (error: unknown) {
        console.error('Sign out error:', error);
        Alert.alert(t('errors.signOutFailed'));
      }
      return;
    }
    if (item.id === 'restart-onboarding') {
      Alert.alert(
        t('restartOnboarding.confirmTitle'),
        t('restartOnboarding.confirmMessage'),
        [
          {
            style: 'cancel',
            text: t('restartOnboarding.cancel'),
          },
          {
            onPress: () => router.push('/onboarding-welcome' as never),
            text: t('restartOnboarding.start'),
          },
        ]
      );
      return;
    }
    if (item.route) router.push(item.route as never);
  }

  const earnedProgress = cashbackLifetimePoints > 0 ? 100 : 0;
  const savedProgress = saved > 0 ? 100 : 0;

  const profileCanvasBg = isDark ? Colors.darkBg : '#E8F0F8';
  const profileOrbLarge = isDark ? '#E9255E22' : '#F8BBD020';
  const profileOrbMid = isDark ? '#5ED4AF1C' : '#B2EBF220';
  const profileOrbSmall = isDark ? '#FF6B9D18' : '#F3E5F520';
  const voucherNotchBg = isDark ? Colors.darkBg : '#E8F0F8';

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: profileCanvasBg, paddingTop: insets.top }}
    >
      <View className="absolute left-0 right-0 top-0 h-[500px] overflow-hidden">
        <View
          className="absolute size-[250px] rounded-full"
          style={{ backgroundColor: profileOrbLarge, right: -40, top: -50 }}
        />
        <View
          className="absolute size-[200px] rounded-full"
          style={{ backgroundColor: profileOrbMid, left: -60, top: 100 }}
        />
        <View
          className="absolute size-[160px] rounded-full"
          style={{ backgroundColor: profileOrbSmall, right: 40, top: 50 }}
        />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pb-4 pt-3">
          <View className="flex-row items-center">
            <View
              className="mr-3 size-12 overflow-hidden rounded-full border-[2.5px]"
              style={{ borderColor: `${Colors.primary}40` }}
            >
              <Avatar className="h-full w-full" uri={memberSummary.avatarUrl} />
            </View>
            <View>
              <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                {t('welcomeBack')}
              </Text>
              <Text className="text-xl font-extrabold text-primary dark:text-primary-bright">
                {userName}
              </Text>
            </View>
          </View>
          <HeaderGlassButton
            accessibilityLabel={t('menu.comingSoon')}
            accessibilityHint={t('notifications.hint')}
            className="size-10.5 border-white/35 dark:border-white/20"
            glassStyle="regular"
            onPress={() => Alert.alert(t('menu.comingSoon'))}
            testID="notification-bell"
          >
            <Bell
              color={isDark ? Colors.textPrimaryDark : Colors.text}
              size={20}
            />
          </HeaderGlassButton>
        </View>

        <View className="mb-5 items-center">
          <View className="flex-row items-center rounded-full border border-border bg-white px-[18px] py-2 dark:border-dark-border dark:bg-dark-bg-card">
            <Star color={Colors.primary} size={14} />
            <Text className="ml-1.5 text-xs font-extrabold tracking-[1.5px] text-text dark:text-text-primary-dark">
              {tierBadge}
            </Text>
          </View>
        </View>

        <View className="mb-5 flex-row">
          <View className="mr-3 flex-1">
            <StatCard
              accentColor={accentOnDarkBackground(Colors.primary, isDark)}
              label={t('earned')}
              progressDegrees={(earnedProgress / 100) * 360}
              progressTrackColor={
                isDark ? `${Colors.primaryBright}30` : `${Colors.primary}25`
              }
              value={cashbackLifetimePoints.toLocaleString()}
            />
          </View>
          <StatCard
            accentColor={accentOnDarkBackground(Colors.secondary, isDark)}
            label={t('saved')}
            progressDegrees={(savedProgress / 100) * 360}
            progressTrackColor={
              isDark ? `${Colors.secondaryBright}28` : `${Colors.secondary}25`
            }
            value={`$${saved}`}
          />
        </View>

        <View className="mb-5 rounded-[20px] border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
              {t('profileDetails')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/profile/edit-profile')}
              testID="profile-edit-shortcut"
            >
              <Text className="text-sm font-bold text-primary dark:text-primary-bright">
                {t('edit')}
              </Text>
            </Pressable>
          </View>

          <Text className="text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {bio || t('noBio')}
          </Text>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-background px-4 py-3 dark:bg-dark-bg-elevated">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-text-muted dark:text-text-secondary-dark">
                {t('memberSince')}
              </Text>
              <Text className="mt-1 text-sm font-bold text-text dark:text-text-primary-dark">
                {memberSince}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-background px-4 py-3 dark:bg-dark-bg-elevated">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-text-muted dark:text-text-secondary-dark">
                {t('nightsLeft')}
              </Text>
              <Text className="mt-1 text-sm font-bold text-text dark:text-text-primary-dark">
                {nightsLeft}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-background px-4 py-3 dark:bg-dark-bg-elevated">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-text-muted dark:text-text-secondary-dark">
                {t('savedEventsCount')}
              </Text>
              <Text className="mt-1 text-sm font-bold text-text dark:text-text-primary-dark">
                {memberSummary.savedEventsCount}
              </Text>
            </View>
          </View>
        </View>

        {showVoucher && (
          <Animated.View className="mb-5" style={voucherStyle}>
            <View
              className="items-center overflow-hidden rounded-[20px] border-2 bg-white p-6 dark:bg-dark-bg-card"
              style={{
                borderColor: `${Colors.primary}30`,
                borderStyle: 'dashed',
              }}
            >
              <View
                className="absolute left-[-14px] size-7 rounded-full"
                style={{ backgroundColor: voucherNotchBg, top: '45%' }}
              />
              <View
                className="absolute right-[-14px] size-7 rounded-full"
                style={{ backgroundColor: voucherNotchBg, top: '45%' }}
              />
              <View className="mb-2 flex-row items-center">
                <Ticket color={Colors.primary} size={22} />
                <Text className="ml-2 text-[11px] font-extrabold tracking-[2px] text-primary">
                  {t(welcomeOfferBadgeKey)}
                </Text>
              </View>
              <Text className="mb-0.5 text-[42px] font-black text-text dark:text-text-primary-dark">
                {t(welcomeOfferTitleKey)}
              </Text>
              <Text className="mb-3.5 text-base font-semibold text-text-secondary dark:text-text-secondary-dark">
                {t(welcomeOfferSubtitleKey)}
              </Text>
              <View className="mb-3.5 h-px w-4/5 bg-border dark:bg-dark-border" />
              <Text className="mb-1.5 text-lg font-extrabold tracking-[2px] text-secondary dark:text-secondary-bright">
                {t('codeLabel', { code: welcomeOfferCode })}
              </Text>
              <Text className="mb-4 text-xs text-text-muted dark:text-text-muted-dark">
                {t(welcomeOfferTermsKey)}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-xl bg-primary px-8 py-2.5"
                onPress={() => {
                  setShowVoucher(false);
                  dismissVoucher();
                }}
              >
                <Text className="text-sm font-bold text-white">
                  {t('gotIt')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {hasPrioritySupport && config.contact.conciergeBase ? (
          <Pressable
            accessibilityRole="button"
            className="mb-5 flex-row items-center justify-center rounded-2xl py-4"
            onPress={handleConcierge}
            style={{
              backgroundColor: Colors.gold,
              elevation: 4,
              shadowColor: Colors.gold,
              shadowOffset: { height: 4, width: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            testID="vip-concierge"
          >
            <Crown size={20} color="#fff" />
            <Text className="ml-2.5 text-base font-bold text-white">
              {t('contactVipConcierge')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            className="mb-5 flex-row items-center justify-center rounded-2xl border-2 border-secondary py-3.5"
            onPress={handleSupport}
            testID="contact-support"
          >
            <Headphones
              size={20}
              color={isDark ? Colors.secondaryBright : Colors.secondary}
            />
            <Text className="ml-2.5 text-base font-bold text-secondary dark:text-secondary-bright">
              {t('contactSupport')}
            </Text>
          </Pressable>
        )}

        <View className="overflow-hidden rounded-[18px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
          {menuItems.map((item, index) => {
            const rowClassName =
              index < menuItems.length - 1
                ? 'flex-row items-center border-b border-border px-4 py-[15px] dark:border-dark-border'
                : 'flex-row items-center px-4 py-[15px]';
            if (item.disabled) {
              return (
                <View
                  key={item.id}
                  className={rowClassName}
                  testID={`menu-${item.id}`}
                >
                  <View
                    className="mr-3.5 size-[38px] items-center justify-center rounded-[10px] opacity-60"
                    style={{
                      backgroundColor: `${accentOnDarkBackground(item.color, isDark)}15`,
                    }}
                  >
                    <item.icon
                      size={20}
                      color={accentOnDarkBackground(item.color, isDark)}
                    />
                  </View>
                  <Text className="flex-1 text-[15px] font-semibold text-text-muted dark:text-text-muted-dark">
                    {item.label}
                  </Text>
                  <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
                    {t('menu.comingSoon')}
                  </Text>
                </View>
              );
            }
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                className={rowClassName}
                onPress={() => {
                  void handleMenuPress(item);
                }}
                testID={`menu-${item.id}`}
              >
                <View
                  className="mr-3.5 size-[38px] items-center justify-center rounded-[10px]"
                  style={{
                    backgroundColor: `${accentOnDarkBackground(item.color, isDark)}15`,
                  }}
                >
                  <item.icon
                    size={20}
                    color={accentOnDarkBackground(item.color, isDark)}
                  />
                </View>
                <Text className="flex-1 text-[15px] font-semibold text-text dark:text-text-primary-dark">
                  {item.label}
                </Text>
                <ChevronRight
                  size={18}
                  color={isDark ? Colors.textMutedDark : Colors.textLight}
                />
              </Pressable>
            );
          })}
        </View>

        <View className="h-[30px]" />
      </ScrollView>
    </View>
  );
}
