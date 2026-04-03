import type { Dispatch, SetStateAction } from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import type { Event } from '@/lib/types';
import {
  buildCurrentWeek,
  resolveEventDayKey,
} from '@/src/lib/events/date-utils';

export const eventCategories = [
  { labelKey: 'categories.allEvents', value: 'All Events' },
  { labelKey: 'categories.parties', value: 'Parties' },
  { labelKey: 'categories.liveMusic', value: 'Live Music' },
  { labelKey: 'categories.wellness', value: 'Wellness' },
  { labelKey: 'categories.dining', value: 'Dining' },
] as const;

type PreparedEvent = {
  dayKey: string | null;
  event: Event;
  normalizedCategory: string;
  searchableContent: string;
};

type WeekDayItem = ReturnType<typeof buildCurrentWeek>[number];

const LIST_CONTENT_CONTAINER_STYLE = {
  paddingBottom: 20,
  paddingHorizontal: 20,
  paddingTop: 16,
} as const;

export type UseEventsScreenDataReturn = {
  activeCategory: string;
  featuredEvent: Event | undefined;
  filteredEvents: Event[];
  listContentContainerStyle: typeof LIST_CONTENT_CONTAINER_STYLE;
  listEvents: Event[];
  searchQuery: string;
  selectedDay: WeekDayItem | null;
  selectedDayKey: string;
  weekStripItems: Array<WeekDayItem & { showIndicator: boolean }>;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedDayKey: Dispatch<SetStateAction<string>>;
};

export function useEventsScreenData({
  events,
  language,
}: {
  events: Event[];
  language: string;
}): UseEventsScreenDataReturn {
  const [activeCategory, setActiveCategory] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [now, setNow] = useState<Date>(() => new Date());
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
    () => buildCurrentWeek(language, now),
    [language, now]
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

  const featuredEvent = useMemo(
    () => filteredEvents.find((event) => event.featured),
    [filteredEvents]
  );
  const listEvents = useMemo(
    () => filteredEvents.filter((event) => !event.featured),
    [filteredEvents]
  );

  return {
    activeCategory,
    featuredEvent,
    filteredEvents,
    listContentContainerStyle: LIST_CONTENT_CONTAINER_STYLE,
    listEvents,
    searchQuery,
    selectedDay,
    selectedDayKey,
    weekStripItems,
    setActiveCategory,
    setSearchQuery,
    setSelectedDayKey,
  };
}
