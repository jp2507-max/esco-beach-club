import { useRouter } from 'expo-router';
import {
  Bookmark,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  PencilLine,
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
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import { ProfileHeader } from '@/src/components/profile/profile-header';
import {
  type ProfileMenuItem,
  ProfileMenuList,
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
import { ScrollView, Text, View } from '@/src/tw';
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
  const { t: tCommon } = useTranslation('common');
  const isDark = useAppIsDark();
  const voucherScale = useSharedValue(0.9);
  const voucherOpacity = useSharedValue(0);

  const { dismissVoucher, isAuthenticatedButNotReady, profile } =
    useProfileData();
  const memberSummary = useMemberSummary();
  const { memberOffersLoading, welcomeOffer } = useMemberOffersData();
  const { signOut } = useAuth();
  const valueUnavailable = tCommon('valueUnavailable');

  const userName =
    memberSummary.fullName ||
    (isAuthenticatedButNotReady ? valueUnavailable : t('guest'));
  const tierBadge = t(
    `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );
  const cashbackLifetimePoints = memberSummary.cashbackLifetimePoints;
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
        color: Colors.profileRateUsAccent,
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
        color: Colors.profileRewardsAccent,
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
        color: Colors.profileHelpAccent,
        icon: HelpCircle,
        id: 'help-support',
        label: t('menu.helpSupport'),
        route: '/profile/help-center',
      },
      {
        color: Colors.danger,
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
      collapsable={false}
      className="flex-1"
      style={{ backgroundColor: profileCanvasBg, paddingTop: insets.top }}
    >
      <AppScreenContent className="flex-1">
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-5 pb-5"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="absolute left-[-20px] right-[-20px] top-0 h-125 overflow-hidden"
            pointerEvents="none"
          >
            <View
              className="absolute size-62.5 rounded-full"
              style={{ backgroundColor: profileOrbLarge, right: -20, top: -50 }}
            />
            <View
              className="absolute size-50 rounded-full"
              style={{ backgroundColor: profileOrbMid, left: -40, top: 100 }}
            />
            <View
              className="absolute size-40 rounded-full"
              style={{ backgroundColor: profileOrbSmall, right: 60, top: 50 }}
            />
          </View>

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
            <View className="flex-row items-center rounded-full border border-border bg-white px-4.5 py-2 dark:border-dark-border dark:bg-dark-bg-card">
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
                brandAccessibilityHint: tCommon('branding.markHint'),
                brandLabel: tCommon('branding.mark'),
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

          <View className="h-7.5" />
        </ScrollView>
      </AppScreenContent>
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
