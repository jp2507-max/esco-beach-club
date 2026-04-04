import type { Dispatch, SetStateAction } from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import type { Event } from '@/lib/types';
import {
  buildCurrentWeek,
  resolveEventDayKey,
} from '@/src/lib/events/date-utils';

export const EVENT_CATEGORY_VALUES = [
  'allEvents',
  'parties',
  'liveMusic',
  'wellness',
  'dining',
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number];

export const eventCategories = [
  { labelKey: 'categories.allEvents', value: 'allEvents' },
  { labelKey: 'categories.parties', value: 'parties' },
  { labelKey: 'categories.liveMusic', value: 'liveMusic' },
  { labelKey: 'categories.wellness', value: 'wellness' },
  { labelKey: 'categories.dining', value: 'dining' },
] as const;

const EVENT_CATEGORY_NORMALIZATION_MAP: Readonly<
  Record<string, EventCategoryValue>
> = {
  'all events': 'allEvents',
  allevents: 'allEvents',
  dining: 'dining',
  'live music': 'liveMusic',
  livemusic: 'liveMusic',
  parties: 'parties',
  party: 'parties',
  wellness: 'wellness',
};

type PreparedEvent = {
  dayKey: string | null;
  event: Event;
  normalizedCategory: EventCategoryValue | null;
  searchableContent: string;
};

type WeekDayItem = ReturnType<typeof buildCurrentWeek>[number];

const LIST_CONTENT_CONTAINER_STYLE = {
  paddingBottom: 20,
  paddingHorizontal: 20,
  paddingTop: 16,
} as const;

export type UseEventsScreenDataReturn = {
  activeCategory: EventCategoryValue;
  featuredEvent: Event | undefined;
  filteredEvents: Event[];
  listContentContainerStyle: typeof LIST_CONTENT_CONTAINER_STYLE;
  listEvents: Event[];
  searchQuery: string;
  selectedDay: WeekDayItem | null;
  selectedDayKey: string;
  weekStripItems: (WeekDayItem & { showIndicator: boolean })[];
  setActiveCategory: Dispatch<SetStateAction<EventCategoryValue>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedDayKey: Dispatch<SetStateAction<string>>;
};

function normalizeEventCategory(
  category: string | null | undefined
): EventCategoryValue | null {
  if (!category) return null;

  const normalizedCategory = category.trim().toLowerCase();
  const compactCategory = normalizedCategory.replace(/[\s_-]+/g, '');

  return (
    EVENT_CATEGORY_NORMALIZATION_MAP[normalizedCategory] ??
    EVENT_CATEGORY_NORMALIZATION_MAP[compactCategory] ??
    null
  );
}

export function useEventsScreenData({
  events,
  language,
}: {
  events: Event[];
  language: string;
}): UseEventsScreenDataReturn {
  const [activeCategory, setActiveCategory] =
    useState<EventCategoryValue>('allEvents');
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
        normalizedCategory: normalizeEventCategory(event.category),
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

    return preparedEvents
      .filter((preparedEvent) => {
        const isAllCategory = activeCategory === 'allEvents';
        const isCategoryMatch =
          isAllCategory || preparedEvent.normalizedCategory === activeCategory;
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
