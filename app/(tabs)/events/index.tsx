import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  Heart,
  PartyPopper,
  SlidersHorizontal,
} from 'lucide-react-native';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import type { Event } from '@/lib/types';
import { useEventsData, useProfileData } from '@/providers/DataProvider';
import { config } from '@/src/lib/config';
import { cn } from '@/src/lib/utils';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

const eventCategories = [
  { labelKey: 'categories.allEvents', value: 'All Events' },
  { labelKey: 'categories.parties', value: 'Parties' },
  { labelKey: 'categories.liveMusic', value: 'Live Music' },
  { labelKey: 'categories.wellness', value: 'Wellness' },
  { labelKey: 'categories.dining', value: 'Dining' },
] as const;

const activeCategoryChipStyle = {
  backgroundColor: Colors.secondary,
  borderColor: Colors.secondary,
} as const;

const activeCategoryTextStyle = { color: Colors.white } as const;

export default function EventsScreen(): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const router = useRouter();
  const { t } = useTranslation('events');

  const { events } = useEventsData();
  const { profile } = useProfileData();
  const userAvatar = profile?.avatar_url ?? config.defaultAvatarUri;

  const renderHeaderRight = useCallback(
    () => (
      <View className="flex-row items-center">
        <View className="mr-2 size-9 items-center justify-center rounded-xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
          <SlidersHorizontal size={18} color={Colors.text} />
        </View>
        <View className="size-10 items-center justify-center rounded-full border-[2.5px] border-primary/25">
          <Image
            className="size-8.5 rounded-full"
            source={{ uri: userAvatar }}
            cachePolicy="memory-disk"
            recyclingKey={`events-header-avatar-${userAvatar}`}
            transition={180}
          />
        </View>
      </View>
    ),
    [userAvatar]
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const isAllCategory = activeCategory === 'All Events';
      const isCategoryMatch =
        isAllCategory ||
        event.category?.toLowerCase() === activeCategory.toLowerCase();

      if (!isCategoryMatch) return false;
      if (!normalizedQuery) return true;

      const searchableContent = [
        event.title,
        event.description ?? '',
        event.location,
        event.badge ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(normalizedQuery);
    });
  }, [activeCategory, deferredSearchQuery, events]);

  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 20, paddingHorizontal: 20, paddingTop: 16 }),
    []
  );

  const featuredEvent = useMemo(
    () => filteredEvents.find((event) => event.featured),
    [filteredEvents]
  );

  const listEvents = useMemo(
    () => filteredEvents.filter((event) => !event.featured),
    [filteredEvents]
  );

  const openEvent = useCallback(
    (id: string): void => {
      router.push({ pathname: '/events/[id]', params: { id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Event>): React.JSX.Element => (
      <Pressable
        accessibilityRole="button"
        className="mb-3 flex-row items-center rounded-2xl border border-border bg-card p-3 dark:border-dark-border dark:bg-dark-bg-card"
        testID={`event-${item.id}`}
        onPress={() => openEvent(item.id)}
      >
        <Image
          className="size-20 rounded-xl"
          source={{ uri: item.image }}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={`event-list-${item.id}`}
          transition={180}
        />
        <View className="ml-3.5 flex-1">
          <Text className="mb-1 text-base font-bold text-text dark:text-text-primary-dark">
            {item.title}
          </Text>
          <View className="mb-2 flex-row items-center gap-1.25">
            <Calendar size={12} color={Colors.textSecondary} />
            <Text className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
              {item.date} • {item.time}
            </Text>
          </View>
          {item.badge ? (
            <View
              className="self-start rounded-md px-2.5 py-1"
              style={{
                backgroundColor: `${item.badge_color ?? Colors.secondary}18`,
              }}
            >
              <Text
                className="text-[10px] font-extrabold tracking-[0.3px]"
                style={{ color: item.badge_color ?? Colors.secondary }}
              >
                {item.badge}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="h-20 items-end justify-between py-1">
          <View className="p-1">
            <Heart size={18} color={Colors.textLight} />
          </View>
          <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
            {item.price}
          </Text>
        </View>
      </Pressable>
    ),
    [openEvent]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerRight: renderHeaderRight,
          title: t('title'),
        }}
      />
      <Stack.SearchBar
        placeholder={t('searchPlaceholder')}
        onChangeText={(event) => {
          setSearchQuery(event.nativeEvent.text);
        }}
      />
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={listEvents}
        estimatedItemSize={110}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentContainerStyle}
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="mb-5 gap-2"
            >
              {eventCategories.map((category) => {
                const isActive = activeCategory === category.value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={category.value}
                    className={cn(
                      'rounded-full border px-5 py-2.5',
                      'border-border bg-card dark:border-dark-border dark:bg-dark-bg-card'
                    )}
                    onPress={() => setActiveCategory(category.value)}
                    style={isActive ? activeCategoryChipStyle : undefined}
                    testID={`cat-${category.value}`}
                  >
                    <Text
                      className={cn(
                        'text-[13px] font-semibold',
                        'text-text dark:text-text-primary-dark'
                      )}
                      style={isActive ? activeCategoryTextStyle : undefined}
                    >
                      {t(category.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {featuredEvent ? (
              <Pressable
                accessibilityRole="button"
                className="mb-5 h-65 overflow-hidden rounded-[20px] bg-card dark:bg-dark-bg-card"
                testID="featured-event"
                onPress={() => openEvent(featuredEvent.id)}
              >
                <Image
                  source={{ uri: featuredEvent.image }}
                  className="h-full w-full"
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={`featured-event-${featuredEvent.id}`}
                  transition={180}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={{
                    bottom: 0,
                    left: 0,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                  }}
                />
                {featuredEvent.badge ? (
                  <View className="absolute right-3.5 top-3.5 rounded-lg bg-[#FF9800] px-3 py-1.25">
                    <Text className="text-[10px] font-extrabold tracking-[0.5px] text-white">
                      {featuredEvent.badge}
                    </Text>
                  </View>
                ) : null}
                <View className="absolute bottom-12.5 right-4 items-center rounded-xl bg-[#FF9800] px-3.5 py-2">
                  <Text className="text-[9px] font-bold tracking-[0.5px] text-white/80">
                    {t('featuredPrice')}
                  </Text>
                  <Text className="text-xl font-extrabold text-white">
                    {featuredEvent.price}
                  </Text>
                </View>
                <View className="absolute bottom-0 left-0 right-20 p-4.5">
                  <View className="mb-1.5 flex-row items-center gap-1.25">
                    <Calendar size={13} color="rgba(255,255,255,0.8)" />
                    <Text className="text-xs font-medium text-white/80">
                      {featuredEvent.date} • {featuredEvent.time}
                    </Text>
                  </View>
                  <Text className="mb-1 text-[22px] font-extrabold text-white">
                    {featuredEvent.title}
                  </Text>
                  <Text
                    className="text-xs font-normal text-white/70"
                    numberOfLines={1}
                  >
                    {featuredEvent.description}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            <Pressable
              accessibilityRole="button"
              className="mt-2 flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-bg-card"
              onPress={() => router.push('/private-event')}
              testID="private-event-btn"
            >
              <View className="size-12 items-center justify-center rounded-[14px] border border-secondary/20 bg-background dark:bg-dark-bg-elevated">
                <PartyPopper size={22} color={Colors.secondary} />
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 text-base font-bold text-text dark:text-text-primary-dark">
                  {t('privatePartyTitle')}
                </Text>
                <Text className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
                  {t('privatePartyDescription')}
                </Text>
              </View>
            </Pressable>

            <View className="h-7.5" />
          </>
        }
      />
    </View>
  );
}
