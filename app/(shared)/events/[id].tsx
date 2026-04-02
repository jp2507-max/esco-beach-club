import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Crown,
  Heart,
  MapPin,
  PartyPopper,
  Share2,
  Star,
  UserCheck,
  Users,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import {
  useEventById,
  useEventsData,
  useSavedEventsData,
} from '@/providers/DataProvider';
import {
  HeaderGlassButton,
  Skeleton,
  SkeletonCard,
  SkeletonText,
} from '@/src/components/ui';
import { rmTiming } from '@/src/lib/animations/motion';
import { hapticMedium } from '@/src/lib/haptics/use-haptic';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

type PriceTierLabelKey =
  | 'priceTiers.vip.label'
  | 'priceTiers.member.label'
  | 'priceTiers.guest.label';

type PriceTierPerkKey =
  | 'priceTiers.vip.perk1'
  | 'priceTiers.vip.perk2'
  | 'priceTiers.vip.perk3'
  | 'priceTiers.member.perk1'
  | 'priceTiers.member.perk2'
  | 'priceTiers.guest.perk1'
  | 'priceTiers.guest.perk2';

type PriceTier = {
  highlight: boolean;
  icon: React.ElementType;
  labelKey: PriceTierLabelKey;
  perkKeys: PriceTierPerkKey[];
  price: string;
};

export default function EventDetailsScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fade = useSharedValue(0);
  const slide = useSharedValue(40);
  const headerOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const { t } = useTranslation('events');
  const isDark = useAppIsDark();
  const { eventsLoading } = useEventsData();
  const foundEvent = useEventById(id);
  const { isEventSaved, toggleSavedEvent } = useSavedEventsData();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
    },
  });

  useEffect(() => {
    headerOpacity.set(withTiming(1, rmTiming(400)));
    fade.set(withTiming(1, rmTiming(500)));
    slide.set(withTiming(0, rmTiming(500)));
    return () => {
      cancelAnimation(headerOpacity);
      cancelAnimation(fade);
      cancelAnimation(slide);
    };
  }, [fade, headerOpacity, id, slide]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.get(),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ translateY: slide.get() }],
  }));

  const imageParallaxStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    const translateY = interpolate(y, [0, 280], [0, -72], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }],
    };
  });

  const hasValidId = Boolean(id);

  if (!hasValidId) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <Text className="mb-4 text-base font-semibold text-text dark:text-text-primary-dark">
          {t('eventNotFound')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="rounded-xl bg-primary px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white">{t('goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  if (eventsLoading && !foundEvent) {
    return (
      <View className="flex-1 bg-background dark:bg-dark-bg">
        <View className="relative h-80 overflow-hidden">
          <SkeletonCard
            className="absolute inset-0 rounded-none"
            height={320}
          />
          <View
            className="absolute left-4 right-4 z-10 flex-row items-center justify-between"
            style={{ top: insets.top + 8 }}
          >
            <HeaderGlassButton
              accessibilityLabel={t('goBack')}
              accessibilityHint={t('goBack')}
              onPress={() => router.back()}
              testID="back-btn-skeleton"
              variant="overlay"
            >
              <ArrowLeft size={20} color="#fff" />
            </HeaderGlassButton>
          </View>
          <View className="absolute bottom-0 left-0 right-0 p-5">
            <SkeletonText className="mb-3 h-8 w-4/5" lines={1} />
            <View className="flex-row gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </View>
          </View>
        </View>
        <View className="flex-1 rounded-t-[20px] bg-background px-5 pt-6 dark:bg-dark-bg">
          <SkeletonText className="mb-6" lines={3} />
          <SkeletonText className="mb-2 h-6 w-48" lines={1} />
          <SkeletonText className="mb-4" lines={2} />
          <SkeletonCard className="mb-3" height={100} />
          <SkeletonCard className="mb-3" height={100} />
          <SkeletonCard height={100} />
        </View>
      </View>
    );
  }

  if (!foundEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <Text className="mb-4 text-base font-semibold text-text dark:text-text-primary-dark">
          {t('eventNotFound')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="rounded-xl bg-primary px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white">{t('goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  const event = foundEvent;
  const isLiked = isEventSaved(event.id);
  const contactForPricing = t('priceTiers.contactForPricing');
  const priceTiers: PriceTier[] = [
    {
      labelKey: 'priceTiers.vip.label',
      price: event.vip_price ?? contactForPricing,
      highlight: true,
      icon: Crown,
      perkKeys: [
        'priceTiers.vip.perk1',
        'priceTiers.vip.perk2',
        'priceTiers.vip.perk3',
      ],
    },
    {
      labelKey: 'priceTiers.member.label',
      price: event.member_price ?? event.price ?? contactForPricing,
      highlight: false,
      icon: Star,
      perkKeys: ['priceTiers.member.perk1', 'priceTiers.member.perk2'],
    },
    {
      labelKey: 'priceTiers.guest.label',
      price: event.guest_price ?? contactForPricing,
      highlight: false,
      icon: UserCheck,
      perkKeys: ['priceTiers.guest.perk1', 'priceTiers.guest.perk2'],
    },
  ];

  function handleBook(): void {
    hapticMedium();
    router.push({
      pathname: '/booking' as never,
      params: { eventId: event.id, eventTitle: event.title },
    });
  }

  async function handleShare(): Promise<void> {
    try {
      await Share.share({
        message: t('shareMessage', {
          title: event.title,
          location: event.location,
          date: event.date,
          time: event.time,
        }),
      });
    } catch {
      // User cancelled or share failed
    }
  }

  function handleToggleLike(): void {
    void toggleSavedEvent(event.id);
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Animated.View
        className="relative h-80 overflow-hidden"
        style={heroStyle}
      >
        <Animated.View className="absolute inset-0" style={imageParallaxStyle}>
          <Image
            className="h-full w-full"
            source={{ uri: event.image }}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={180}
          />
        </Animated.View>
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.4, 1]}
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        />

        <View
          className="absolute left-4 right-4 z-10 flex-row items-center justify-between"
          style={{ top: insets.top + 8 }}
        >
          <HeaderGlassButton
            accessibilityLabel={t('goBack')}
            accessibilityHint={t('goBack')}
            onPress={() => router.back()}
            testID="back-btn"
            variant="overlay"
          >
            <ArrowLeft size={20} color="#fff" />
          </HeaderGlassButton>
          <View className="flex-row">
            <HeaderGlassButton
              className="mr-2.5"
              onPress={handleShare}
              accessibilityLabel={t('shareEvent')}
              accessibilityHint={t('shareEventHint')}
              testID="share-btn"
              variant="overlay"
            >
              <Share2 size={18} color="#fff" />
            </HeaderGlassButton>
            <HeaderGlassButton
              onPress={handleToggleLike}
              accessibilityLabel={
                isLiked ? t('removeSavedEvent') : t('saveEvent')
              }
              accessibilityHint={
                isLiked ? t('unlikeEventHint') : t('likeEventHint')
              }
              accessibilityState={{ selected: isLiked }}
              testID="like-btn"
              variant="overlay"
            >
              <Heart
                size={18}
                color={isLiked ? Colors.primary : '#fff'}
                fill={isLiked ? Colors.primary : 'transparent'}
              />
            </HeaderGlassButton>
          </View>
        </View>

        {event.badge ? (
          <View className="absolute right-4 top-[100px] rounded-[10px] bg-warning px-[14px] py-1.5">
            <Text className="text-[10px] font-extrabold tracking-[0.5px] text-white">
              {event.badge}
            </Text>
          </View>
        ) : null}

        <View className="absolute bottom-0 left-0 right-0 p-5">
          <Text className="mb-2 text-[28px] font-extrabold text-white">
            {event.title}
          </Text>
          <View className="flex-row items-center">
            <View className="flex-row items-center">
              <Calendar size={14} color="rgba(255,255,255,0.85)" />
              <Text className="ml-[5px] text-[13px] font-medium text-white/90">
                {event.date}
              </Text>
            </View>
            <View
              className="mx-[10px] size-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            />
            <View className="flex-row items-center">
              <Clock size={14} color="rgba(255,255,255,0.85)" />
              <Text className="ml-[5px] text-[13px] font-medium text-white/90">
                {event.time}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 rounded-t-[20px] bg-background dark:bg-dark-bg"
        contentContainerClassName="px-5 pt-6"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: -16 }}
      >
        <Animated.View style={contentStyle}>
          <View className="mb-6 flex-row">
            <View className="mr-2.5 flex-row items-center rounded-xl border border-border bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card">
              <MapPin
                color={accentOnDarkBackground(Colors.secondary, isDark)}
                size={16}
              />
              <Text className="ml-1.5 text-[13px] font-semibold text-text dark:text-text-primary-dark">
                {event.location}
              </Text>
            </View>
            <View className="flex-row items-center rounded-xl border border-border bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card">
              <Users
                color={accentOnDarkBackground(Colors.primary, isDark)}
                size={16}
              />
              <Text className="ml-1.5 text-[13px] font-semibold text-text dark:text-text-primary-dark">
                {t('attendeesCount', { count: event.attendees })}
              </Text>
            </View>
          </View>

          <View className="mb-7">
            <Text className="mb-2 text-xl font-extrabold text-text dark:text-text-primary-dark">
              {t('aboutThisEvent')}
            </Text>
            <Text className="text-sm leading-[22px] text-text-secondary dark:text-text-secondary-dark">
              {t('aboutDescription1', { location: event.location })}{' '}
              {event.description || t('aboutDescription2')}{' '}
              {t('aboutDescription3')}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-xl font-extrabold text-text dark:text-text-primary-dark">
              {t('chooseExperience')}
            </Text>
            <Text className="mb-4 text-[13px] text-text-secondary dark:text-text-secondary-dark">
              {t('selectTier')}
            </Text>

            {priceTiers.map((tier) => (
              <View
                key={tier.labelKey}
                className="mb-3 rounded-[18px] border p-[18px]"
                style={{
                  backgroundColor: tier.highlight
                    ? isDark
                      ? `${Colors.primary}22`
                      : Colors.eventTierHighlightLight
                    : isDark
                      ? Colors.darkBgCard
                      : Colors.surface,
                  borderColor: tier.highlight
                    ? Colors.primary
                    : isDark
                      ? Colors.darkBorder
                      : Colors.border,
                  borderWidth: tier.highlight ? 2 : 1,
                }}
              >
                {tier.highlight ? (
                  <View className="absolute right-4 top-[-10px] rounded-lg bg-primary px-2.5 py-1">
                    <Text className="text-[9px] font-extrabold tracking-[1px] text-white">
                      {t('recommended')}
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 size-11 items-center justify-center rounded-[14px]"
                      style={{
                        backgroundColor: tier.highlight
                          ? Colors.primary
                          : isDark
                            ? `${Colors.secondaryBright}30`
                            : `${Colors.tealLight}40`,
                      }}
                    >
                      <tier.icon
                        size={20}
                        color={
                          tier.highlight
                            ? Colors.white
                            : accentOnDarkBackground(Colors.secondary, isDark)
                        }
                      />
                    </View>
                    <View>
                      <Text
                        className="text-base font-bold"
                        style={{
                          color: tier.highlight
                            ? Colors.primary
                            : isDark
                              ? Colors.textPrimaryDark
                              : Colors.text,
                        }}
                      >
                        {t(tier.labelKey)}
                      </Text>
                      <Text className="mt-0.5 text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
                        {t('perPerson')}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-[28px] font-extrabold"
                    style={{
                      color: tier.highlight
                        ? Colors.primary
                        : isDark
                          ? Colors.textPrimaryDark
                          : Colors.text,
                    }}
                  >
                    {tier.price}
                  </Text>
                </View>

                <View className="my-[14px] h-px bg-border dark:bg-dark-border" />

                {tier.perkKeys.map((key) => (
                  <View key={key} className="mb-2 flex-row items-center">
                    <View
                      className="mr-2.5 size-1.5 rounded-full"
                      style={{
                        backgroundColor: tier.highlight
                          ? Colors.primary
                          : accentOnDarkBackground(Colors.secondary, isDark),
                      }}
                    />
                    <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                      {t(key)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            className="flex-row items-center rounded-2xl border px-4 py-4"
            onPress={() => router.push('/private-event')}
            style={{
              backgroundColor: isDark
                ? `${Colors.secondaryBright}18`
                : `${Colors.tealLight}25`,
              borderColor: isDark
                ? `${Colors.secondaryBright}35`
                : `${Colors.secondary}20`,
            }}
            testID="private-party-link"
          >
            <View
              className="mr-3.5 size-11 items-center justify-center rounded-[14px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-elevated"
              style={{
                borderColor: isDark
                  ? `${Colors.secondaryBright}35`
                  : `${Colors.secondary}20`,
              }}
            >
              <PartyPopper
                color={accentOnDarkBackground(Colors.secondary, isDark)}
                size={20}
              />
            </View>
            <View className="flex-1">
              <Text className="mb-0.5 text-[15px] font-bold text-text dark:text-text-primary-dark">
                {t('privatePartyTitle')}
              </Text>
              <Text className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
                {t('privatePartyDescription')}
              </Text>
            </View>
          </Pressable>

          <View className="h-[120px]" />
        </Animated.View>
      </Animated.ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-border bg-white px-5 pt-3.5 dark:border-dark-border dark:bg-dark-bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View>
          <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
            {t('from')}
          </Text>
          <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {event.price}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          className="rounded-2xl bg-primary px-9 py-4"
          onPress={handleBook}
          testID="book-now-btn"
        >
          <Text className="text-base font-bold text-white">{t('bookNow')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
