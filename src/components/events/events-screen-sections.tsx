import { LinearGradient } from 'expo-linear-gradient';
import type { TFunction } from 'i18next';
import { Calendar, Heart, PartyPopper } from 'lucide-react-native';
import React, { useCallback } from 'react';
import type { Insets, ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import type { Event } from '@/lib/types';
import {
  CategoryChip,
  SkeletonCard,
  WeekStrip,
  type WeekStripItem,
} from '@/src/components/ui';
import { motion } from '@/src/lib/animations/motion';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import {
  eventCategories,
  type EventCategoryValue,
} from '@/src/lib/events/use-events-screen-data';
import { hapticLight, hapticSelection } from '@/src/lib/haptics/haptics';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

/** ~44pt effective target with 18px icon + p-1 without expanding layout */
const DEFAULT_HEART_TOGGLE_HIT_SLOP: Insets = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
};

function EventsFilterShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { contentStyle } = useScreenEntry({ durationMs: 380 });
  return <Animated.View style={contentStyle}>{children}</Animated.View>;
}

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
}: {
  accessibilityHint?: string;
  accessibilityLabel: string;
  className?: string;
  color: string;
  fill: string;
  hitSlop?: number | Insets;
  onToggle: () => void;
  style?: ViewStyle;
  testID?: string;
}): React.JSX.Element {
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

function EventListCardComponent({
  index,
  isEventSaved,
  item,
  onOpen,
  t,
  toggleSavedEvent,
}: {
  index: number;
  isEventSaved: (id: string) => boolean;
  item: Event;
  onOpen: (id: string) => void;
  t: TFunction;
  toggleSavedEvent: (id: string) => Promise<void> | void;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  const saved = isEventSaved(item.id);

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
            cachePolicy="memory-disk"
            className="size-20 rounded-xl"
            contentFit="cover"
            recyclingKey={`event-list-${item.id}`}
            source={{ uri: item.image }}
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
            accessibilityHint={t('openEventPriceHint')}
            accessibilityLabel={t('openEventPrice', { title: item.title })}
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

export const EventListCard = React.memo(EventListCardComponent);

export function EventsListHeader({
  activeCategory,
  featuredEvent,
  isEventSaved,
  onCategorySelect,
  onOpenEvent,
  onToggleSavedEvent,
  onWeekDaySelect,
  selectedDayFullLabel,
  selectedDayKey,
  t,
  weekStripItems,
}: {
  activeCategory: EventCategoryValue;
  featuredEvent: Event | undefined;
  isEventSaved: (id: string) => boolean;
  onCategorySelect: (value: EventCategoryValue) => void;
  onOpenEvent: (id: string) => void;
  onToggleSavedEvent: (id: string) => void;
  onWeekDaySelect: (key: string) => void;
  selectedDayFullLabel: string;
  selectedDayKey: string;
  t: TFunction;
  weekStripItems: readonly WeekStripItem[];
}): React.JSX.Element {
  return (
    <EventsFilterShell>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-bold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
          {t('weekStrip.title')}
        </Text>
        <Text className="text-sm font-semibold text-text dark:text-text-primary-dark">
          {selectedDayFullLabel}
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
          onWeekDaySelect(key);
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
              labelClassName="text-[13px]"
              onPress={() => {
                hapticSelection();
                onCategorySelect(category.value);
              }}
              testID={`cat-${category.value}`}
            />
          );
        })}
      </ScrollView>

      {featuredEvent ? (
        <View className="mb-5 h-65 overflow-hidden rounded-[20px] bg-card dark:bg-dark-bg-card">
          <Pressable
            accessibilityRole="button"
            className="h-full"
            onPress={() => onOpenEvent(featuredEvent.id)}
            testID="featured-event"
          >
            <Image
              cachePolicy="memory-disk"
              className="h-full w-full"
              contentFit="cover"
              recyclingKey={`featured-event-${featuredEvent.id}`}
              source={{ uri: featuredEvent.image }}
              transition={180}
            />
            <LinearGradient
              colors={['transparent', Colors.featuredOverlayStrong]}
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
                <Calendar size={13} color={Colors.featuredOverlayIcon} />
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
              isEventSaved(featuredEvent.id) ? Colors.primary : Colors.white
            }
            fill={
              isEventSaved(featuredEvent.id) ? Colors.primary : 'transparent'
            }
            onToggle={() => onToggleSavedEvent(featuredEvent.id)}
            style={{ backgroundColor: Colors.featuredOverlayMedium }}
            testID="featured-save-event"
          />
        </View>
      ) : null}
    </EventsFilterShell>
  );
}

export function EventsListFooter({
  eventsLoading,
  filteredEventsLength,
  isDark,
  selectedDayLabel,
  t,
  onOpenPrivateEvent,
}: {
  eventsLoading: boolean;
  filteredEventsLength: number;
  isDark: boolean;
  selectedDayLabel: string;
  t: TFunction;
  onOpenPrivateEvent: () => void;
}): React.JSX.Element {
  return (
    <>
      {eventsLoading ? (
        <View className="mb-3 gap-3">
          <SkeletonCard height={100} />
          <SkeletonCard height={100} />
          <SkeletonCard height={100} />
        </View>
      ) : filteredEventsLength === 0 ? (
        <View className="mb-3 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-base font-bold text-text dark:text-text-primary-dark">
            {t('noEventsForDayTitle')}
          </Text>
          <Text className="mt-1.5 text-sm text-text-secondary dark:text-text-secondary-dark">
            {t('noEventsForDayDescription', {
              day: selectedDayLabel,
            })}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className="mt-2 flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-bg-card"
        onPress={onOpenPrivateEvent}
        testID="private-event-btn"
      >
        <View className="size-12 items-center justify-center rounded-[14px] border border-secondary/20 bg-background dark:border-secondary-bright/25 dark:bg-dark-bg-elevated">
          <PartyPopper
            color={isDark ? Colors.secondaryBright : Colors.secondary}
            size={22}
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
  );
}
