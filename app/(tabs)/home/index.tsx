import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Clock,
  MapPin,
  UtensilsCrossed,
  Wifi,
  Wine,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { Event, NewsItem } from '@/lib/types';
import {
  useHomeEvents,
  useNewsData,
  useProfileData,
} from '@/providers/DataProvider';
import { Avatar } from '@/src/components/ui/avatar';
import { rmTiming } from '@/src/lib/animations/motion';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

function getGreeting(
  hour: number,
  greetings: {
    afternoon: string;
    evening: string;
    morning: string;
  }
): string {
  if (hour < 12) return greetings.morning;
  if (hour < 17) return greetings.afternoon;
  return greetings.evening;
}

type QuickAction = {
  color: string;
  id: string;
  icon: React.ComponentType<{
    color?: string;
    size?: number;
  }>;
  label: string;
  route: string;
};

type HomeFeedRow =
  | {
      id: string;
      title: string;
      type: 'section';
    }
  | {
      event: Event;
      id: string;
      type: 'event';
    }
  | {
      id: string;
      item: NewsItem;
      type: 'news';
    };

type HomeSectionHeaderProps = {
  title: string;
  onSeeAllPress?: () => void;
};

function HomeSectionHeader({
  title,
  onSeeAllPress,
}: HomeSectionHeaderProps): React.JSX.Element {
  const { t } = useTranslation('home');

  return (
    <View className="mb-4 mt-1 flex-row items-center justify-between px-5">
      <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
        {title}
      </Text>
      {onSeeAllPress ? (
        <Pressable accessibilityRole="button" onPress={onSeeAllPress}>
          <Text className="text-sm font-semibold text-primary">
            {t('seeAll')}
          </Text>
        </Pressable>
      ) : (
        <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
          {t('seeAll')}
        </Text>
      )}
    </View>
  );
}

const MemoizedHomeSectionHeader = React.memo(HomeSectionHeader);

type QuickActionChipProps = {
  action: QuickAction;
  onPress: (route: string) => void;
};

function QuickActionChip({
  action,
  onPress,
}: QuickActionChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center rounded-full border border-border bg-white px-5 py-3.5 dark:border-dark-border dark:bg-dark-bg-card"
      onPress={() => onPress(action.route)}
      testID={`action-${action.id}`}
    >
      <action.icon size={18} color={action.color} />
      <Text
        className="ml-2 text-sm font-semibold"
        style={{ color: action.color }}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

const MemoizedQuickActionChip = React.memo(QuickActionChip);

type HomeEventCardProps = {
  event: Event;
  onPress: (id: string) => void;
};

function HomeEventCard({
  event,
  onPress,
}: HomeEventCardProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className="mx-5 mb-4 h-[200px] overflow-hidden rounded-[18px] bg-white dark:bg-dark-bg-card"
      onPress={() => onPress(event.id)}
      testID={`event-${event.id}`}
    >
      <Image
        className="h-full w-full"
        source={{ uri: event.image }}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={180}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
      <View
        className="absolute right-[14px] top-[14px] rounded-lg px-3 py-[5px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <Text className="text-[11px] font-bold tracking-[0.5px] text-white">
          {event.day_label ?? event.date}
        </Text>
      </View>
      <View className="absolute bottom-0 left-0 right-[60px] p-[18px]">
        <Text className="mb-1.5 text-xl font-extrabold text-white">
          {event.title}
        </Text>
        <View className="flex-row items-center">
          <Clock size={13} color="rgba(255,255,255,0.85)" />
          <Text className="ml-[5px] text-xs font-medium text-white/85">
            {event.time}
          </Text>
          <Text className="mx-[6px] text-xs text-white/50">·</Text>
          <MapPin size={13} color="rgba(255,255,255,0.85)" />
          <Text className="ml-[5px] text-xs font-medium text-white/85">
            {event.location}
          </Text>
        </View>
      </View>
      <View className="absolute bottom-5 right-[18px] size-[42px] items-center justify-center rounded-full bg-primary">
        <ArrowRight size={18} color="#fff" />
      </View>
    </Pressable>
  );
}

const MemoizedHomeEventCard = React.memo(HomeEventCard);

function HomeNewsRow({ item }: { item: NewsItem }): React.JSX.Element {
  return (
    <View
      className="mx-5 mb-3 flex-row items-center rounded-2xl border border-border bg-white p-3 dark:border-dark-border dark:bg-dark-bg-card"
      testID={`news-${item.id}`}
    >
      <Image
        className="size-[60px] rounded-xl"
        source={{ uri: item.image }}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={180}
      />
      <View className="ml-3.5 flex-1">
        <Text
          className="mb-0.5 text-[15px] font-bold text-text dark:text-text-primary-dark"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          className="mb-1 text-xs leading-[17px] text-text-secondary dark:text-text-secondary-dark"
          numberOfLines={2}
        >
          {item.subtitle}
        </Text>
        <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
          {item.time_label}
        </Text>
      </View>
    </View>
  );
}

const MemoizedHomeNewsRow = React.memo(HomeNewsRow);

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('home');
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    cardScale.set(
      withSpring(1, {
        damping: 15,
        stiffness: 120,
      })
    );
    cardOpacity.set(withTiming(1, rmTiming(600)));
    fadeIn.set(withTiming(1, rmTiming(500)));
    slideUp.set(withTiming(0, rmTiming(500)));
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
      cancelAnimation(fadeIn);
      cancelAnimation(slideUp);
    };
  }, [cardOpacity, cardScale, fadeIn, slideUp]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ scale: cardScale.get() }],
  }));

  const sectionStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.get(),
    transform: [{ translateY: slideUp.get() }],
  }));

  const { profile } = useProfileData();
  const { news } = useNewsData();
  const homeEvents = useHomeEvents();

  const userName = profile?.full_name ?? t('guest');
  const userTier = profile?.tier_label ?? t('member');
  const userPoints = profile?.points ?? 0;
  const userMaxPoints =
    profile?.max_points && profile.max_points > 0 ? profile.max_points : 5000;
  const tierLevel = profile?.tier ?? 'STANDARD';
  const vipStatus =
    tierLevel === 'VIP' || tierLevel === 'OWNER' ? t('vipStatus') : '';
  const greeting = getGreeting(new Date().getHours(), {
    afternoon: t('greetings.afternoon'),
    evening: t('greetings.evening'),
    morning: t('greetings.morning'),
  });

  const safeMaxPoints = Math.max(userMaxPoints, 1);
  const progressWidth =
    `${Math.min((userPoints / safeMaxPoints) * 100, 100)}%` as `${number}%`;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        color: Colors.secondary,
        id: 'book-table',
        icon: UtensilsCrossed,
        label: t('quickActions.bookTable'),
        route: '/booking',
      },
      {
        color: Colors.primary,
        id: 'menu',
        icon: Wine,
        label: t('quickActions.menu'),
        route: '/home/menu',
      },
    ],
    [t]
  );

  const feedRows = useMemo<HomeFeedRow[]>(
    () => [
      ...homeEvents.map((event) => ({
        event,
        id: `event-${event.id}`,
        type: 'event' as const,
      })),
      {
        id: 'section-news',
        title: t('latestNews'),
        type: 'section' as const,
      },
      ...news.map((item) => ({
        id: `news-${item.id}`,
        item,
        type: 'news' as const,
      })),
    ],
    [homeEvents, news, t]
  );

  const listContentContainerStyle = useMemo(() => ({ paddingBottom: 30 }), []);

  const handleRoutePress = useCallback(
    (route: string): void => {
      router.push(route as never);
    },
    [router]
  );

  const handleEventPress = useCallback(
    (eventId: string): void => {
      router.push(`/events/${eventId}` as never);
    },
    [router]
  );

  const handleSeeAllEvents = useCallback((): void => {
    router.push('/events' as never);
  }, [router]);

  const renderFeedItem = useCallback(
    ({ item }: ListRenderItemInfo<HomeFeedRow>): React.JSX.Element => {
      if (item.type === 'section')
        return (
          <MemoizedHomeSectionHeader
            title={item.title}
            onSeeAllPress={
              item.title === t('happeningThisWeek')
                ? handleSeeAllEvents
                : undefined
            }
          />
        );
      if (item.type === 'event')
        return (
          <MemoizedHomeEventCard
            event={item.event}
            onPress={handleEventPress}
          />
        );
      return <MemoizedHomeNewsRow item={item.item} />;
    },
    [handleEventPress, handleSeeAllEvents, t]
  );

  const getFeedItemType = useCallback(
    (item: HomeFeedRow): HomeFeedRow['type'] => item.type,
    []
  );

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="absolute left-0 right-0 top-0 h-[300px] overflow-hidden">
        <View
          className="absolute size-[180px] rounded-full"
          style={{ backgroundColor: '#E91E6310', right: -20, top: -40 }}
        />
        <View
          className="absolute size-[120px] rounded-full"
          style={{ backgroundColor: '#00968812', right: 80, top: 30 }}
        />
        <View
          className="absolute size-[100px] rounded-full"
          style={{ backgroundColor: '#FF980010', left: -20, top: 10 }}
        />
      </View>

      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={listContentContainerStyle}
        data={feedRows}
        getItemType={getFeedItemType}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View className="px-5">
              <View className="flex-row items-center justify-between pb-5 pt-4">
                <View>
                  <Text className="mb-1 text-xs font-bold tracking-[1.5px] text-primary">
                    {t('welcomeBack')}
                  </Text>
                  <Text className="text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                    {greeting}
                  </Text>
                </View>
                <View
                  className="size-12 items-center justify-center rounded-full border-[2.5px]"
                  style={{ borderColor: `${Colors.primary}40` }}
                  testID="profile-avatar"
                >
                  <Avatar
                    className="size-[42px] rounded-full"
                    uri={profile?.avatar_url}
                  />
                  <View
                    className="absolute -bottom-px -right-px size-[14px] rounded-full"
                    style={{
                      backgroundColor: '#4CAF50',
                      borderColor: Colors.background,
                      borderWidth: 2.5,
                    }}
                  />
                </View>
              </View>

              <Animated.View className="mb-4" style={cardStyle}>
                <LinearGradient
                  colors={['#E91E63', '#F06292', '#FF9800']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, overflow: 'hidden', padding: 22 }}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-xs font-extrabold tracking-[2px] text-white/85">
                      {t('brandMark')}
                    </Text>
                    <Wifi color="rgba(255,255,255,0.8)" size={24} />
                  </View>

                  <View className="mb-1 flex-row items-start justify-between">
                    <View>
                      <Text className="text-2xl font-extrabold text-white">
                        {userTier}
                      </Text>
                      <Text className="mt-0.5 text-xs font-medium text-white/75">
                        {t('pointsBalance')}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs font-semibold text-white/70">
                      {vipStatus}
                    </Text>
                  </View>

                  <View className="mb-2 mt-2 flex-row items-baseline">
                    <Text className="text-[40px] font-extrabold text-white">
                      {userPoints.toLocaleString()}
                    </Text>
                    <Text className="ml-1.5 text-sm font-medium text-white/60">
                      {t('pointsSuffix', {
                        max: userMaxPoints.toLocaleString(),
                      })}
                    </Text>
                  </View>

                  <View className="mb-4 h-1.5 rounded-full bg-white/25">
                    <View
                      className="h-1.5 rounded-full bg-white"
                      style={{ width: progressWidth }}
                    />
                  </View>

                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text className="text-[10px] font-semibold tracking-[1px] text-white/55">
                        {t('memberName')}
                      </Text>
                      <Text className="mt-1 text-base font-bold text-white">
                        {userName}
                      </Text>
                    </View>
                    <View className="size-10 items-center justify-center rounded-md bg-white/85">
                      <View className="h-6 w-6 flex-row flex-wrap">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <View
                            key={`qr-${i}`}
                            className="m-px size-1.5 rounded-[1px]"
                            style={{
                              backgroundColor: i % 3 === 0 ? '#333' : '#ccc',
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  <View
                    className="absolute size-[150px] rounded-full"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      right: -30,
                      top: -30,
                    }}
                  />
                  <View
                    className="absolute size-[100px] rounded-full"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      bottom: -20,
                      left: 50,
                    }}
                  />
                </LinearGradient>
              </Animated.View>

              <Animated.View className="mb-6" style={sectionStyle}>
                <ScrollView
                  contentContainerClassName="gap-2.5"
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                >
                  {quickActions.map((action) => (
                    <MemoizedQuickActionChip
                      key={action.id}
                      action={action}
                      onPress={handleRoutePress}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            </View>

            <MemoizedHomeSectionHeader
              title={t('happeningThisWeek')}
              onSeeAllPress={handleSeeAllEvents}
            />
          </>
        }
        ListFooterComponent={<View className="h-[30px]" />}
      />
    </View>
  );
}
