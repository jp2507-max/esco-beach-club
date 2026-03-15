import React, { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Star,
  QrCode,
  Settings,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  ChevronRight,
  Users,
  Crown,
  Headphones,
  Ticket,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useProfileData } from '@/providers/DataProvider';
import { useAuth } from '@/providers/AuthProvider';
import { rmTiming } from '@/src/lib/animations/motion';
import { shadows } from '@/src/lib/styles/shadows';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';
import { ScrollView, Text, Pressable, View } from '@/src/tw';

type MenuItem = {
  color: string;
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

function StatCard({
  accentColor,
  label,
  progressDegrees,
  progressTrackColor,
  value,
}: StatCardProps): React.JSX.Element {
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
              transform: [{ rotate: `${progressDegrees}deg` }],
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
  const scale = useSharedValue(0.9);
  const fade = useSharedValue(0);
  const voucherScale = useSharedValue(0.9);
  const voucherOpacity = useSharedValue(0);

  useEffect(() => {
    scale.set(
      withSpring(1, {
        damping: 15,
        stiffness: 120,
      })
    );
    fade.set(withTiming(1, rmTiming(600)));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(fade);
    };
  }, [fade, scale]);

  const { profile, dismissVoucher } = useProfileData();
  const { signOut } = useAuth();

  const userName = profile?.full_name ?? t('guest');
  const userAvatar =
    profile?.avatar_url ??
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
  const tierBadge = profile?.tier_label ?? t('memberFallback');
  const tierLevel = profile?.tier ?? 'STANDARD';
  const memberId = profile?.member_id ?? '';
  const earned = profile?.earned ?? 0;
  const saved = profile?.saved ?? 0;

  const [showVoucher, setShowVoucher] = useState<boolean>(false);
  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        color: Colors.primary,
        icon: Users,
        id: 'invite-earn',
        label: t('menu.inviteEarn'),
        route: '/profile/invite',
      },
      { color: '#FFB300', icon: Star, id: 'rate-us', label: t('menu.rateUs'), route: '/rate-us' },
      {
        color: Colors.primary,
        icon: CreditCard,
        id: 'membership',
        label: t('menu.membership'),
        route: null,
      },
      { color: '#FF9800', icon: Gift, id: 'rewards', label: t('menu.rewards'), route: null },
      {
        color: Colors.secondary,
        icon: Settings,
        id: 'settings',
        label: t('menu.settings'),
        route: null,
      },
      {
        color: '#7C4DFF',
        icon: HelpCircle,
        id: 'help-support',
        label: t('menu.helpSupport'),
        route: null,
      },
      { color: '#EF5350', icon: LogOut, id: 'log-out', label: t('menu.logOut'), route: null },
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

  const isVIP = tierLevel === 'VIP' || tierLevel === 'OWNER';

  const accessCardStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ scale: scale.get() }],
  }));

  const voucherStyle = useAnimatedStyle(() => ({
    opacity: voucherOpacity.get(),
    transform: [{ scale: voucherScale.get() }],
  }));

  function handleConcierge(): void {
    const whatsappUrl = t('conciergeUrl');
    Linking.openURL(whatsappUrl).catch(() => console.log(t('errors.openWhatsApp')));
  }

  function handleSupport(): void {
    const supportEmail = t('supportEmail');
    Linking.openURL(`mailto:${supportEmail}`).catch(() => console.log(t('errors.openMail')));
  }

  async function handleMenuPress(
    item: MenuItem
  ): Promise<void> {
    if (item.id === 'log-out') {
      await signOut().catch((error: unknown) => console.log('Sign out error', error));
      return;
    }

    if (item.route) router.push(item.route as never);
  }

  const earnedProgress = (earned / 2000) * 100;
  const savedProgress = (saved / 300) * 100;

  return (
    <View
      className="flex-1 dark:bg-dark-bg"
      style={{ backgroundColor: '#E8F0F8', paddingTop: insets.top }}
    >
      <View className="absolute left-0 right-0 top-0 h-[500px] overflow-hidden">
        <View
          className="absolute size-[250px] rounded-full"
          style={{ backgroundColor: '#F8BBD020', right: -40, top: -50 }}
        />
        <View
          className="absolute size-[200px] rounded-full"
          style={{ backgroundColor: '#B2EBF220', left: -60, top: 100 }}
        />
        <View
          className="absolute size-[160px] rounded-full"
          style={{ backgroundColor: '#F3E5F520', right: 40, top: 50 }}
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
              <Image className="h-full w-full" source={{ uri: userAvatar }} />
            </View>
            <View>
              <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                {t('welcomeBack')}
              </Text>
              <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
                {userName}
              </Text>
            </View>
          </View>
          <Pressable
            className="size-[42px] items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
            testID="notification-bell"
          >
            <Bell color={Colors.text} size={20} />
          </Pressable>
        </View>

        <View className="mb-5 items-center">
          <View className="flex-row items-center rounded-full border border-border bg-white px-[18px] py-2 dark:border-dark-border dark:bg-dark-bg-card">
            <Star color={Colors.primary} size={14} />
            <Text className="ml-1.5 text-xs font-extrabold tracking-[1.5px] text-text dark:text-text-primary-dark">
              {tierBadge}
            </Text>
          </View>
        </View>

        <Animated.View className="mb-5" style={accessCardStyle}>
          <View
            className="items-center rounded-[24px] bg-white p-6 dark:bg-dark-bg-card"
            style={shadows.level3}
          >
            <View className="mb-5 items-center">
              <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
                {t('brandPrefix')}<Text className="text-primary">{t('brandHighlight')}</Text>
              </Text>
              <Text className="mt-1 text-[11px] font-semibold tracking-[3px] text-text-secondary dark:text-text-secondary-dark">
                {t('accessPass')}
              </Text>
            </View>

            <View className="mb-5">
              <LinearGradient
                colors={['#E91E63', '#9C27B0', '#00BCD4']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 20, height: 180, padding: 5, width: 180 }}
              >
                <View className="flex-1 items-center justify-center rounded-[16px] bg-white dark:bg-dark-bg-card">
                  <QrCode color={Colors.text} size={100} />
                </View>
              </LinearGradient>
            </View>

            <Text className="mb-1 text-base font-bold text-text dark:text-text-primary-dark">
              {t('scanAtTable')}
            </Text>
            <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
              {t('refPrefix', { memberId })}
            </Text>
          </View>
        </Animated.View>

        <View className="mb-5 flex-row">
          <View className="mr-3 flex-1">
            <StatCard
              accentColor={Colors.primary}
              label={t('earned')}
              progressDegrees={(earnedProgress / 100) * 360}
              progressTrackColor={`${Colors.primary}25`}
              value={earned.toLocaleString()}
            />
          </View>
          <StatCard
            accentColor={Colors.secondary}
            label={t('saved')}
            progressDegrees={(savedProgress / 100) * 360}
            progressTrackColor={`${Colors.secondary}25`}
            value={`$${saved}`}
          />
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
                style={{ backgroundColor: '#E8F0F8', top: '45%' }}
              />
              <View
                className="absolute right-[-14px] size-7 rounded-full"
                style={{ backgroundColor: '#E8F0F8', top: '45%' }}
              />
              <View className="mb-2 flex-row items-center">
                <Ticket color={Colors.primary} size={22} />
                <Text className="ml-2 text-[11px] font-extrabold tracking-[2px] text-primary">
                  {t('welcomeGift')}
                </Text>
              </View>
              <Text className="mb-0.5 text-[42px] font-black text-text dark:text-text-primary-dark">
                {t('welcomeDiscount')}
              </Text>
              <Text className="mb-3.5 text-base font-semibold text-text-secondary dark:text-text-secondary-dark">
                {t('firstVisit')}
              </Text>
              <View className="mb-3.5 h-px w-4/5 bg-border dark:bg-dark-border" />
              <Text className="mb-1.5 text-lg font-extrabold tracking-[2px] text-secondary">
                {t('codeLabel', { code: 'WELCOME10' })}
              </Text>
              <Text className="mb-4 text-xs text-text-muted dark:text-text-muted-dark">
                {t('validForThirtyDays')}
              </Text>
              <Pressable
                className="rounded-xl bg-primary px-8 py-2.5"
                onPress={() => {
                  setShowVoucher(false);
                  dismissVoucher();
                }}
              >
                <Text className="text-sm font-bold text-white">{t('gotIt')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {isVIP ? (
          <Pressable
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
            <Text className="ml-2.5 text-base font-bold text-white">{t('contactVipConcierge')}</Text>
          </Pressable>
        ) : (
          <Pressable
            className="mb-5 flex-row items-center justify-center rounded-2xl border-2 border-secondary py-3.5"
            onPress={handleSupport}
            testID="contact-support"
          >
            <Headphones size={20} color={Colors.secondary} />
            <Text className="ml-2.5 text-base font-bold text-secondary">{t('contactSupport')}</Text>
          </Pressable>
        )}

        <View className="overflow-hidden rounded-[18px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              className={
                index < menuItems.length - 1
                  ? 'flex-row items-center border-b border-border px-4 py-[15px] dark:border-dark-border'
                  : 'flex-row items-center px-4 py-[15px]'
              }
              onPress={() => {
                void handleMenuPress(item);
              }}
              testID={`menu-${item.id}`}
            >
              <View
                className="mr-3.5 size-[38px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon size={20} color={item.color} />
              </View>
              <Text className="flex-1 text-[15px] font-semibold text-text dark:text-text-primary-dark">
                {item.label}
              </Text>
              <ChevronRight size={18} color={Colors.textLight} />
            </Pressable>
          ))}
        </View>

        <View className="h-[30px]" />
      </ScrollView>
    </View>
  );
}
