import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Event } from '@/lib/types';
import { useEventsData, useSavedEventsData } from '@/providers/DataProvider';
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import {
  EventListCard,
  EventsListFooter,
  EventsListHeader,
} from '@/src/components/events/events-screen-sections';
import { ScreenHeader, SearchInput } from '@/src/components/ui';
import { useEventsScreenData } from '@/src/lib/events/use-events-screen-data';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { View } from '@/src/tw';

export default function EventsScreen(): React.JSX.Element {
  const router = useRouter();
  const { i18n, t } = useTranslation('events');
  const isDark = useAppIsDark();
  const insets = useSafeAreaInsets();
  const { events, eventsLoading } = useEventsData();
  const { isEventSaved, toggleSavedEvent } = useSavedEventsData();
  const {
    activeCategory,
    featuredEvent,
    filteredEvents,
    listContentContainerStyle,
    listEvents,
    selectedDay,
    selectedDayKey,
    setActiveCategory,
    setSearchQuery,
    setSelectedDayKey,
    weekStripItems,
  } = useEventsScreenData({
    events,
    language: i18n.resolvedLanguage ?? i18n.language ?? 'en',
  });

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

  const contentContainerStyle = useMemo(
    () => ({
      ...listContentContainerStyle,
      paddingTop: 12,
    }),
    [listContentContainerStyle]
  );

  return (
    <View
      collapsable={false}
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <AppScreenContent className="flex-1">
        <ScreenHeader testID="events-screen-header" title={t('title')} />

        <SearchInput
          className="mb-3"
          onChangeText={setSearchQuery}
          placeholder={t('searchPlaceholder')}
          testID="events-search"
        />

        <FlashList
          contentContainerStyle={contentContainerStyle}
          data={listEvents}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            <EventsListFooter
              eventsLoading={eventsLoading}
              filteredEventsLength={filteredEvents.length}
              isDark={isDark}
              selectedDayLabel={selectedDay?.fullLabel ?? ''}
              t={t}
              onOpenPrivateEvent={() => router.push('/private-event')}
            />
          }
          ListHeaderComponent={
            <EventsListHeader
              activeCategory={activeCategory}
              featuredEvent={featuredEvent}
              isEventSaved={isEventSaved}
              selectedDayFullLabel={selectedDay?.fullLabel ?? ''}
              selectedDayKey={selectedDayKey}
              t={t}
              weekStripItems={weekStripItems}
              onCategorySelect={setActiveCategory}
              onOpenEvent={openEvent}
              onToggleSavedEvent={(id) => {
                void toggleSavedEvent(id);
              }}
              onWeekDaySelect={setSelectedDayKey}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </AppScreenContent>
    </View>
  );
}
