import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Clock,
  MapPin,
  UtensilsCrossed,
  Wine,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
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

import { Colors } from '@/constants/colors';
import type { Event, NewsItem } from '@/lib/types';
import {
  useEventsData,
  useHomeEvents,
  useMemberSummary,
  useNewsData,
  useProfileData,
} from '@/providers/DataProvider';
import { AccountDeletionBanner } from '@/src/components/account-deletion/account-deletion-banner';
import {
  Avatar,
  Card,
  HeaderGlassButton,
  MemberCard,
  SectionHeader,
  Skeleton,
  SkeletonCard,
} from '@/src/components/ui';
import { rmTiming } from '@/src/lib/animations/motion';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { hapticLight } from '@/src/lib/haptics/use-haptic';
import { getRewardTierLabelKey } from '@/src/lib/loyalty';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

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
      onPress={() => {
        hapticLight();
        onPress(action.route);
      }}
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
      className="mx-5 mb-4 h-50 overflow-hidden rounded-[18px] bg-white dark:bg-dark-bg-card"
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
        className="absolute right-3.5 top-3.5 rounded-lg px-3 py-1.25"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <Text className="text-[11px] font-bold tracking-[0.5px] text-white">
          {event.day_label ?? event.date}
        </Text>
      </View>
      <View className="absolute bottom-0 left-0 right-15 p-4.5">
        <Text className="mb-1.5 text-xl font-extrabold text-white">
          {event.title}
        </Text>
        <View className="flex-row items-center">
          <Clock size={13} color="rgba(255,255,255,0.85)" />
          <Text className="ml-1.25 text-xs font-medium text-white/85">
            {event.time}
          </Text>
          <Text className="mx-1.5 text-xs text-white/50">·</Text>
          <MapPin size={13} color="rgba(255,255,255,0.85)" />
          <Text className="ml-1.25 text-xs font-medium text-white/85">
            {event.location}
          </Text>
        </View>
      </View>
      <View className="absolute bottom-5 right-4.5 size-10.5 items-center justify-center rounded-full bg-primary">
        <ArrowRight size={18} color="#fff" />
      </View>
    </Pressable>
  );
}

const MemoizedHomeEventCard = React.memo(HomeEventCard);

function HomeNewsRow({ item }: { item: NewsItem }): React.JSX.Element {
  return (
    <Card
      className="mx-5 mb-3 flex-row items-center p-3"
      testID={`news-${item.id}`}
    >
      <Image
        className="size-15 rounded-xl"
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
          className="mb-1 text-xs leading-4.25 text-text-secondary dark:text-text-secondary-dark"
          numberOfLines={2}
        >
          {item.subtitle}
        </Text>
        <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
          {item.time_label}
        </Text>
      </View>
    </Card>
  );
}

const MemoizedHomeNewsRow = React.memo(HomeNewsRow);

function StaggeredFeedBlock({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('home');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const { contentStyle: sectionStyle } = useScreenEntry({ durationMs: 500 });

  useEffect(() => {
    cardScale.set(
      withSpring(1, {
        damping: 15,
        stiffness: 120,
      })
    );
    cardOpacity.set(withTiming(1, rmTiming(600)));
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
    };
  }, [cardOpacity, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ scale: cardScale.get() }],
  }));

  const { eventsLoading } = useEventsData();
  const { news, newsLoading } = useNewsData();
  const { userId } = useProfileData();
  const homeEvents = useHomeEvents();
  const memberSummary = useMemberSummary();

  const userName = memberSummary.fullName || t('guest');
  const userTier = t(
    `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );
  const isFeedLoading = eventsLoading || newsLoading;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        color: isDark ? Colors.secondaryBright : Colors.secondary,
        id: 'book-table',
        icon: UtensilsCrossed,
        label: t('quickActions.bookTable'),
        route: '/booking',
      },
      {
        color: isDark ? Colors.primaryBright : Colors.primary,
        id: 'menu',
        icon: Wine,
        label: t('quickActions.menu'),
        route: '/home/menu',
      },
    ],
    [isDark, t]
  );

  const feedRows = useMemo<HomeFeedRow[]>(
    () => [
      ...homeEvents.map((event) => ({
        event,
        id: `event-${event.id}`,
        type: 'event' as const,
      })),
      ...(news.length > 0
        ? [
            {
              id: 'section-news',
              title: t('latestNews'),
              type: 'section' as const,
            },
          ]
        : []),
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

  const handleProfilePress = useCallback((): void => {
    router.push('/profile' as never);
  }, [router]);

  const renderFeedItem = useCallback(
    ({ index, item }: ListRenderItemInfo<HomeFeedRow>): React.JSX.Element => {
      if (item.type === 'section')
        return (
          <SectionHeader
            actionLabel={t('seeAll')}
            className="mb-4 mt-1 px-5"
            title={item.title}
            onActionPress={
              item.title === t('happeningThisWeek')
                ? handleSeeAllEvents
                : undefined
            }
          />
        );
      if (item.type === 'event')
        return (
          <StaggeredFeedBlock index={index}>
            <MemoizedHomeEventCard
              event={item.event}
              onPress={handleEventPress}
            />
          </StaggeredFeedBlock>
        );
      return (
        <StaggeredFeedBlock index={index}>
          <MemoizedHomeNewsRow item={item.item} />
        </StaggeredFeedBlock>
      );
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
      <View className="absolute left-0 right-0 top-0 h-75 overflow-hidden">
        <View
          className="absolute size-45 rounded-full"
          style={{
            backgroundColor: isDark ? '#FF6B9D22' : '#E91E6310',
            right: -20,
            top: -40,
          }}
        />
        <View
          className="absolute size-30 rounded-full"
          style={{
            backgroundColor: isDark ? '#5ED4AF1C' : '#00968812',
            right: 80,
            top: 30,
          }}
        />
        <View
          className="absolute size-25 rounded-full"
          style={{
            backgroundColor: isDark ? '#FF6B9D18' : '#FF980010',
            left: -20,
            top: 10,
          }}
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
                  <Text className="text-[28px] font-extrabold text-primary dark:text-primary-bright">
                    {t('welcomeBackName', { name: userName })}
                  </Text>
                </View>
                <HeaderGlassButton
                  accessibilityLabel={t('openProfile')}
                  accessibilityHint={t('openProfileHint')}
                  className="size-12 border-white/35 dark:border-white/20"
                  glassStyle="regular"
                  onPress={handleProfilePress}
                  testID="profile-avatar"
                >
                  <Avatar
                    className="size-9.5 rounded-full"
                    uri={memberSummary.avatarUrl}
                  />
                  <View
                    className="absolute -bottom-px -right-px size-3.5 rounded-full"
                    style={{
                      backgroundColor: '#4CAF50',
                      borderColor: Colors.background,
                      borderWidth: 2.5,
                    }}
                  />
                </HeaderGlassButton>
              </View>

              <Animated.View className="mb-4" style={cardStyle}>
                <MemberCard
                  copy={{
                    balanceLabel: t('cashbackBalance'),
                    balanceSuffix: t('cashbackSuffix'),
                    brandLabel: t('brandMark'),
                    emptyQrLabel: t('guest'),
                    memberNameLabel: t('memberName'),
                    statusLabel: t('lifetimeTier'),
                  }}
                  cashbackPoints={memberSummary.cashbackBalancePoints}
                  memberId={memberSummary.memberId}
                  memberName={userName}
                  tierProgressPercent={memberSummary.tierProgressPercent}
                  tierLabel={userTier}
                />
              </Animated.View>

              <AccountDeletionBanner userId={userId} />

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

            <SectionHeader
              actionLabel={t('seeAll')}
              className="mb-4 mt-1 px-5"
              title={t('happeningThisWeek')}
              onActionPress={handleSeeAllEvents}
            />
          </>
        }
        ListEmptyComponent={
          isFeedLoading ? (
            <View className="px-5 py-10">
              <SkeletonCard className="mb-5" height={200} />
              <View className="mb-6 flex-row gap-2.5">
                <Skeleton className="h-12 flex-1 rounded-full" />
                <Skeleton className="h-12 flex-1 rounded-full" />
              </View>
              <SkeletonCard className="mb-4" height={200} />
              <SkeletonCard height={88} />
            </View>
          ) : (
            <View className="px-5 py-12">
              <Text className="text-center text-lg font-bold text-text dark:text-text-primary-dark">
                {t('emptyTitle')}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                {t('emptyDescription')}
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View className="h-7.5" />}
      />
    </View>
  );
}
