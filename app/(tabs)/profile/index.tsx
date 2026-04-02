import { useRouter } from 'expo-router';
import {
  Bookmark,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  PencilLine,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import {
  MemberOffersDataProvider,
  useMemberOffersData,
  useMemberSummary,
  useProfileData,
} from '@/providers/DataProvider';
import { ProfileHeader } from '@/src/components/profile/profile-header';
import {
  ProfileMenuList,
  type ProfileMenuItem,
} from '@/src/components/profile/profile-menu-list';
import { ProfileStatsRow } from '@/src/components/profile/profile-stats-row';
import { SupportCta } from '@/src/components/profile/support-cta';
import { WelcomeVoucherCard } from '@/src/components/profile/welcome-voucher-card';
import { MemberCard } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { config } from '@/src/lib/config';
import { hapticLight, hapticSuccess } from '@/src/lib/haptics/haptics';
import {
  getRewardTierLabelKey,
  hasRewardBenefit,
  rewardBenefitKeys,
} from '@/src/lib/loyalty';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type MenuItem = ProfileMenuItem;

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

function ProfileScreenContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const isDark = useAppIsDark();
  const voucherScale = useSharedValue(0.9);
  const voucherOpacity = useSharedValue(0);

  const { profile, dismissVoucher } = useProfileData();
  const memberSummary = useMemberSummary();
  const { memberOffersLoading, welcomeOffer } = useMemberOffersData();
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
      {
        color: Colors.danger,
        icon: Trash2,
        id: 'delete-account',
        label: t('menu.deleteAccount'),
        route: '/profile/delete-account',
      },
    ],
    [t]
  );

  const shouldRenderVoucher = showVoucher && !memberOffersLoading;

  useEffect(() => {
    if (shouldRenderVoucher) {
      hapticSuccess();
      voucherScale.set(withSpring(1, motion.spring.gentle));
      voucherOpacity.set(withTiming(1, rmTiming(500)));
    }
    return () => {
      cancelAnimation(voucherScale);
      cancelAnimation(voucherOpacity);
    };
  }, [shouldRenderVoucher, voucherOpacity, voucherScale]);

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
    hapticLight();
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

  const profileCanvasBg = isDark ? Colors.darkBg : Colors.profileCanvasBg;
  const profileOrbLarge = isDark
    ? Colors.profileOrbLargeDark
    : Colors.profileOrbLarge;
  const profileOrbMid = isDark
    ? Colors.profileOrbMidDark
    : Colors.profileOrbMid;
  const profileOrbSmall = isDark
    ? Colors.profileOrbSmallDark
    : Colors.profileOrbSmall;
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
        <ProfileHeader
          avatarUrl={memberSummary.avatarUrl}
          comingSoonLabel={t('menu.comingSoon')}
          isDark={isDark}
          notificationsHint={t('notifications.hint')}
          onPressNotifications={() => Alert.alert(t('menu.comingSoon'))}
          userName={userName}
          welcomeBackLabel={t('welcomeBack')}
        />

        <View className="mb-5 items-center">
          <View className="flex-row items-center rounded-full border border-border bg-white px-[18px] py-2 dark:border-dark-border dark:bg-dark-bg-card">
            <Star color={Colors.primary} size={14} />
            <Text className="ml-1.5 text-xs font-extrabold tracking-[1.5px] text-text dark:text-text-primary-dark">
              {tierBadge}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <MemberCard
            copy={{
              balanceLabel: t('memberCard.cashbackBalance'),
              balanceSuffix: t('memberCard.cashbackSuffix'),
              brandLabel: t('memberCard.brandMark'),
              emptyQrLabel: t('guest'),
              memberNameLabel: t('memberCard.memberName'),
              statusLabel: t('memberCard.lifetimeTier'),
            }}
            cashbackPoints={memberSummary.cashbackBalancePoints}
            memberId={memberSummary.memberId}
            memberName={userName}
            tierProgressPercent={memberSummary.tierProgressPercent}
            tierLabel={tierBadge}
          />
        </View>

        <ProfileStatsRow
          earnedLabel={t('earned')}
          earnedProgressDegrees={(earnedProgress / 100) * 360}
          earnedValue={cashbackLifetimePoints.toLocaleString()}
          isDark={isDark}
          savedLabel={t('saved')}
          savedProgressDegrees={(savedProgress / 100) * 360}
          savedValue={`$${saved}`}
        />

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

        {shouldRenderVoucher && (
          <Animated.View className="mb-5" style={voucherStyle}>
            <WelcomeVoucherCard
              badgeLabel={t(welcomeOfferBadgeKey)}
              codeLabel={t('codeLabel', { code: welcomeOfferCode })}
              gotItLabel={t('gotIt')}
              isDark={isDark}
              onDismiss={() => {
                setShowVoucher(false);
                dismissVoucher();
              }}
              subtitle={t(welcomeOfferSubtitleKey)}
              termsLabel={t(welcomeOfferTermsKey)}
              title={t(welcomeOfferTitleKey)}
            />
          </Animated.View>
        )}

        <SupportCta
          conciergeLabel={t('contactVipConcierge')}
          hasPrioritySupport={
            hasPrioritySupport && Boolean(config.contact.conciergeBase)
          }
          isDark={isDark}
          onConcierge={handleConcierge}
          onSupport={handleSupport}
          supportLabel={t('contactSupport')}
        />

        <ProfileMenuList
          comingSoonLabel={t('menu.comingSoon')}
          isDark={isDark}
          items={menuItems}
          onPressItem={handleMenuPress}
        />

        <View className="h-[30px]" />
      </ScrollView>
    </View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  return (
    <MemberOffersDataProvider>
      <ProfileScreenContent />
    </MemberOffersDataProvider>
  );
}
