import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { Calendar, Heart, PartyPopper } from 'lucide-react-native';
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, type Insets, type ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import type { Event } from '@/lib/types';
import { useEventsData, useSavedEventsData } from '@/providers/DataProvider';
import {
  CategoryChip,
  SkeletonCard,
  WeekStrip,
  type WeekStripItem,
} from '@/src/components/ui';
import { motion } from '@/src/lib/animations/motion';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { hapticLight, hapticSelection } from '@/src/lib/haptics/haptics';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const eventCategories = [
  { labelKey: 'categories.allEvents', value: 'All Events' },
  { labelKey: 'categories.parties', value: 'Parties' },
  { labelKey: 'categories.liveMusic', value: 'Live Music' },
  { labelKey: 'categories.wellness', value: 'Wellness' },
  { labelKey: 'categories.dining', value: 'Dining' },
] as const;

type WeekDayOption = WeekStripItem & {
  aliases: string[];
  isToday: boolean;
};

type PreparedEvent = {
  dayKey: string | null;
  event: Event;
  normalizedCategory: string;
  searchableContent: string;
};

const MONTH_TOKEN_TO_INDEX: Record<string, number> = {
  apr: 3,
  aug: 7,
  dec: 11,
  feb: 1,
  jan: 0,
  jul: 6,
  jun: 5,
  mar: 2,
  may: 4,
  nov: 10,
  oct: 9,
  sep: 8,
};

function normalizeDayToken(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function startOfDay(date: Date): Date {
  const localDay = new Date(date);
  localDay.setHours(0, 0, 0, 0);
  return localDay;
}

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(referenceDate: Date): Date {
  const day = startOfDay(referenceDate);
  const currentDay = day.getDay();
  const offsetFromMonday = (currentDay + 6) % 7;
  day.setDate(day.getDate() - offsetFromMonday);
  return day;
}

function createValidLocalDate(
  year: number,
  monthIndex: number,
  day: number
): Date | null {
  const parsed = new Date(year, monthIndex, day);
  const isValid =
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === monthIndex &&
    parsed.getDate() === day;

  return isValid ? parsed : null;
}

function parseEventDate(dateText: string, now: Date): Date | null {
  if (!dateText.trim()) return null;

  const isoDateOnlyMatch = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateOnlyMatch) {
    const year = Number.parseInt(isoDateOnlyMatch[1], 10);
    const month = Number.parseInt(isoDateOnlyMatch[2], 10);
    const day = Number.parseInt(isoDateOnlyMatch[3], 10);
    const parsed = createValidLocalDate(year, month - 1, day);
    return parsed ? startOfDay(parsed) : null;
  }

  const shortWeekdayMonthMatch = dateText.match(
    /^[A-Za-z]{3,9},\s*([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,\s*(\d{4}))?$/
  );
  if (shortWeekdayMonthMatch) {
    const monthToken = shortWeekdayMonthMatch[1].slice(0, 3).toLowerCase();
    const monthIndex = MONTH_TOKEN_TO_INDEX[monthToken];
    const day = Number.parseInt(shortWeekdayMonthMatch[2], 10);
    if (monthIndex !== undefined) {
      const explicitYear = shortWeekdayMonthMatch[3];
      if (explicitYear) {
        const parsed = createValidLocalDate(
          Number.parseInt(explicitYear, 10),
          monthIndex,
          day
        );
        if (parsed) {
          return startOfDay(parsed);
        }
      } else {
        const weekStart = getStartOfWeek(now);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const currentYear = now.getFullYear();
        for (const candidateYear of [
          currentYear,
          currentYear - 1,
          currentYear + 1,
        ]) {
          const candidateRaw = createValidLocalDate(
            candidateYear,
            monthIndex,
            day
          );
          if (!candidateRaw) continue;

          const candidate = startOfDay(candidateRaw);
          if (candidate >= weekStart && candidate <= weekEnd) {
            return candidate;
          }
        }
        // Fallback to current year if no match within range
        const fallback = createValidLocalDate(currentYear, monthIndex, day);
        if (fallback) {
          return startOfDay(fallback);
        }
      }
    }
  }

  const hasExplicitYear = /\b\d{4}\b/.test(dateText);
  if (!hasExplicitYear) {
    return null;
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;

  return startOfDay(parsed);
}

function buildCurrentWeek(
  locale: string,
  referenceDate: Date
): WeekDayOption[] {
  const start = getStartOfWeek(referenceDate);
  const todayKey = getDayKey(startOfDay(referenceDate));
  const shortFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const fullFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
  const englishShortFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  });
  const englishFullFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const key = getDayKey(date);
    const localizedShort = shortFormatter.format(date);
    const englishShort = englishShortFormatter.format(date);
    const englishFull = englishFullFormatter.format(date);

    return {
      aliases: [localizedShort, englishShort, englishFull].map(
        normalizeDayToken
      ),
      dateLabel: String(date.getDate()),
      fullLabel: fullFormatter.format(date),
      isToday: key === todayKey,
      key,
      shortLabel: localizedShort,
    };
  });
}

function resolveEventDayKey(
  event: Event,
  weekDays: readonly WeekDayOption[],
  now: Date
): string | null {
  const parsedDate = parseEventDate(event.date, now);
  if (parsedDate) {
    const parsedKey = getDayKey(parsedDate);
    if (weekDays.some((day) => day.key === parsedKey)) {
      return parsedKey;
    }
  }

  if (!event.day_label) return null;

  const dayToken = normalizeDayToken(event.day_label);
  if (!dayToken) return null;

  const matchedWeekDay = weekDays.find((day) =>
    day.aliases.some(
      (alias) => dayToken.startsWith(alias) || alias.startsWith(dayToken)
    )
  );

  return matchedWeekDay?.key ?? null;
}

/** ~44pt effective target with 18px icon + p-1 without expanding layout */
const DEFAULT_HEART_TOGGLE_HIT_SLOP: Insets = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
};

function EventsFilterHeader({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { contentStyle } = useScreenEntry({ durationMs: 380 });
  return <Animated.View style={contentStyle}>{children}</Animated.View>;
}

type AnimatedHeartToggleProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  className?: string;
  color: string;
  fill: string;
  hitSlop?: number | Insets;
  onToggle: () => void;
  style?: ViewStyle;
  testID?: string;
};

function AnimatedHeartToggle({
  accessibilityHint,
  accessibilityLabel,
  className,
  color,
  fill,
  hitSlop = DEFAULT_HEART_TOGGLE_HIT_SLOP,
  onToggle,
  style,
  testID,
}: AnimatedHeartToggleProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePress = useCallback((): void => {
    hapticLight();
    scale.set(
      withSequence(
        withSpring(1.18, motion.spring.snappy),
        withSpring(1, motion.spring.gentle)
      )
    );
    onToggle();
  }, [onToggle, scale]);

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={className}
      hitSlop={hitSlop}
      onPress={handlePress}
      style={style}
      testID={testID}
    >
      <Animated.View style={heartStyle}>
        <Heart size={18} color={color} fill={fill} />
      </Animated.View>
    </Pressable>
  );
}

type EventListCardProps = {
  index: number;
  isEventSaved: (id: string) => boolean;
  item: Event;
  onOpen: (id: string) => void;
  t: TFunction<'events'>;
  toggleSavedEvent: (id: string) => Promise<void> | void;
};

function EventListCard({
  index,
  isEventSaved: isSaved,
  item,
  onOpen,
  t,
  toggleSavedEvent,
}: EventListCardProps): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  const saved = isSaved(item.id);

  return (
    <Animated.View className="mb-3" entering={entering}>
      <View className="flex-row items-center rounded-2xl border border-border bg-card p-3 dark:border-dark-border dark:bg-dark-bg-card">
        <Pressable
          accessibilityRole="button"
          className="flex-1 flex-row items-center"
          onPress={() => onOpen(item.id)}
          testID={`event-${item.id}`}
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
        </Pressable>
        <View className="ml-3 h-20 items-end justify-between py-1">
          <AnimatedHeartToggle
            accessibilityHint={
              saved ? t('unlikeEventHint') : t('likeEventHint')
            }
            accessibilityLabel={saved ? t('removeSavedEvent') : t('saveEvent')}
            className="p-1"
            color={saved ? Colors.primary : Colors.textLight}
            fill={saved ? Colors.primary : 'transparent'}
            onToggle={() => {
              void toggleSavedEvent(item.id);
            }}
            testID={`save-event-${item.id}`}
          />
          <Pressable
            accessibilityLabel={t('openEventPrice', { title: item.title })}
            accessibilityHint={t('openEventPriceHint')}
            accessibilityRole="button"
            className="items-end px-1 py-0.5"
            hitSlop={10}
            onPress={() => onOpen(item.id)}
            testID={`open-event-price-${item.id}`}
          >
            <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
              {item.price}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function EventsScreen(): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [now, setNow] = useState<Date>(() => new Date());
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const router = useRouter();
  const { i18n, t } = useTranslation('events');
  const isDark = useAppIsDark();

  const { events, eventsLoading } = useEventsData();
  const { isEventSaved, toggleSavedEvent } = useSavedEventsData();

  useEffect(() => {
    function msUntilMidnight(): number {
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      return Math.max(nextMidnight.getTime() - Date.now(), 1000);
    }

    const timeout = setTimeout(() => {
      setNow(new Date());
    }, msUntilMidnight());

    return () => {
      clearTimeout(timeout);
    };
  }, [now]);

  const weekDays = useMemo(
    () => buildCurrentWeek(i18n.resolvedLanguage ?? i18n.language ?? 'en', now),
    [i18n.language, i18n.resolvedLanguage, now]
  );

  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const today = weekDays.find((day) => day.isToday);
    return today?.key ?? weekDays[0]?.key ?? '';
  });

  useEffect(() => {
    setSelectedDayKey((current) => {
      if (weekDays.some((day) => day.key === current)) {
        return current;
      }

      const today = weekDays.find((day) => day.isToday);
      return today?.key ?? weekDays[0]?.key ?? '';
    });
  }, [weekDays]);

  const preparedEvents = useMemo<PreparedEvent[]>(
    () =>
      events.map((event) => ({
        dayKey: resolveEventDayKey(event, weekDays, now),
        event,
        normalizedCategory: event.category?.toLowerCase() ?? '',
        searchableContent: [
          event.title,
          event.description ?? '',
          event.location,
          event.badge ?? '',
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [events, now, weekDays]
  );

  const daysWithEvents = useMemo(() => {
    const daySet = new Set<string>();
    for (const preparedEvent of preparedEvents) {
      if (preparedEvent.dayKey) daySet.add(preparedEvent.dayKey);
    }
    return daySet;
  }, [preparedEvents]);

  const selectedDay = useMemo(
    () => weekDays.find((day) => day.key === selectedDayKey) ?? null,
    [selectedDayKey, weekDays]
  );

  const weekStripItems = useMemo(
    () =>
      weekDays.map((day) => ({
        ...day,
        showIndicator: daysWithEvents.has(day.key),
      })),
    [daysWithEvents, weekDays]
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const normalizedCategory = activeCategory.toLowerCase();

    return preparedEvents
      .filter((preparedEvent) => {
        const isAllCategory = activeCategory === 'All Events';
        const isCategoryMatch =
          isAllCategory ||
          preparedEvent.normalizedCategory === normalizedCategory;
        const isSelectedDayMatch = preparedEvent.dayKey === selectedDayKey;

        if (!isCategoryMatch) return false;
        if (!isSelectedDayMatch) return false;
        if (!normalizedQuery) return true;

        return preparedEvent.searchableContent.includes(normalizedQuery);
      })
      .map((preparedEvent) => preparedEvent.event);
  }, [activeCategory, deferredSearchQuery, preparedEvents, selectedDayKey]);

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
      router.push({ pathname: '/events/[id]' as never, params: { id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ index, item }: ListRenderItemInfo<Event>): React.JSX.Element => (
      <EventListCard
        index={index}
        isEventSaved={isEventSaved}
        item={item}
        onOpen={openEvent}
        t={t}
        toggleSavedEvent={toggleSavedEvent}
      />
    ),
    [isEventSaved, openEvent, t, toggleSavedEvent]
  );

  /**
   * Expo Router merges `Stack.SearchBar` composition *after* screen options via
   * Object.assign — it replaces `headerSearchBarOptions` entirely. Colors must
   * live on `<Stack.SearchBar />`, not only inside `Stack.Screen` options.
   */
  const eventsSearchBarProps = useMemo(
    () => ({
      barTintColor: isDark ? Colors.darkBgElevated : Colors.surfaceContainerLow,
      textColor: isDark ? Colors.textPrimaryDark : Colors.text,
      tintColor: isDark ? Colors.primaryBright : Colors.primary,
      ...(Platform.OS === 'android'
        ? {
            headerIconColor: isDark
              ? Colors.textMutedDark
              : Colors.textSecondary,
            hintTextColor: isDark ? Colors.textMutedDark : Colors.textMuted,
          }
        : {}),
    }),
    [isDark]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.SearchBar
        {...eventsSearchBarProps}
        placeholder={t('searchPlaceholder')}
        onChangeText={(event) => {
          setSearchQuery(event.nativeEvent.text);
        }}
      />
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={listEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentContainerStyle}
        ListHeaderComponent={
          <EventsFilterHeader>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-bold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
                {t('weekStrip.title')}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-primary-dark">
                {selectedDay?.fullLabel ?? ''}
              </Text>
            </View>

            <WeekStrip
              accessibilityHint={t('weekStrip.selectDayHint')}
              getAccessibilityLabel={(item) =>
                t('weekStrip.selectDay', {
                  day: item.fullLabel,
                })
              }
              items={weekStripItems}
              onSelect={(key) => {
                hapticSelection();
                setSelectedDayKey(key);
              }}
              selectedKey={selectedDayKey}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="mb-5 gap-2"
            >
              {eventCategories.map((category) => {
                const isActive = activeCategory === category.value;

                return (
                  <CategoryChip
                    key={category.value}
                    isActive={isActive}
                    label={t(category.labelKey)}
                    onPress={() => {
                      hapticSelection();
                      setActiveCategory(category.value);
                    }}
                    testID={`cat-${category.value}`}
                    labelClassName="text-[13px]"
                  />
                );
              })}
            </ScrollView>

            {featuredEvent ? (
              <View className="mb-5 h-65 overflow-hidden rounded-[20px] bg-card dark:bg-dark-bg-card">
                <Pressable
                  accessibilityRole="button"
                  className="h-full"
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
                    <View
                      className="absolute right-3.5 top-3.5 rounded-lg px-3 py-1.25"
                      style={{ backgroundColor: Colors.warning }}
                    >
                      <Text className="text-[10px] font-extrabold tracking-[0.5px] text-white">
                        {featuredEvent.badge}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    className="absolute bottom-12.5 right-4 items-center rounded-xl px-3.5 py-2"
                    style={{ backgroundColor: Colors.warning }}
                  >
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
                <AnimatedHeartToggle
                  accessibilityHint={
                    isEventSaved(featuredEvent.id)
                      ? t('unlikeEventHint')
                      : t('likeEventHint')
                  }
                  accessibilityLabel={
                    isEventSaved(featuredEvent.id)
                      ? t('removeSavedEvent')
                      : t('saveEvent')
                  }
                  className="absolute left-3.5 top-3.5 size-10 items-center justify-center rounded-full"
                  color={
                    isEventSaved(featuredEvent.id)
                      ? Colors.primary
                      : Colors.white
                  }
                  fill={
                    isEventSaved(featuredEvent.id)
                      ? Colors.primary
                      : 'transparent'
                  }
                  onToggle={() => {
                    void toggleSavedEvent(featuredEvent.id);
                  }}
                  style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
                  testID="featured-save-event"
                />
              </View>
            ) : null}
          </EventsFilterHeader>
        }
        ListFooterComponent={
          <>
            {eventsLoading ? (
              <View className="mb-3 gap-3">
                <SkeletonCard height={100} />
                <SkeletonCard height={100} />
                <SkeletonCard height={100} />
              </View>
            ) : filteredEvents.length === 0 ? (
              <View className="mb-3 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-bg-card">
                <Text className="text-base font-bold text-text dark:text-text-primary-dark">
                  {t('noEventsForDayTitle')}
                </Text>
                <Text className="mt-1.5 text-sm text-text-secondary dark:text-text-secondary-dark">
                  {t('noEventsForDayDescription', {
                    day: selectedDay?.fullLabel ?? '',
                  })}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              className="mt-2 flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-bg-card"
              onPress={() => router.push('/private-event')}
              testID="private-event-btn"
            >
              <View className="size-12 items-center justify-center rounded-[14px] border border-secondary/20 bg-background dark:border-secondary-bright/25 dark:bg-dark-bg-elevated">
                <PartyPopper
                  size={22}
                  color={isDark ? Colors.secondaryBright : Colors.secondary}
                />
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
