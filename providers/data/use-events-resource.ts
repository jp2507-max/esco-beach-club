import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeSavedEvent, saveEvent } from '@/lib/api';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapEvent, mapSavedEvent } from '@/src/lib/mappers';
import { captureHandledError } from '@/src/lib/monitoring';

import {
  EMPTY_EVENTS,
  EMPTY_SAVED_EVENTS,
  type EventsData,
  type SavedEventsData,
} from './context';

type EventsResourceParams = {
  userId: string;
};

type EventsResourceValue = {
  eventsValue: EventsData;
  savedEventsValue: SavedEventsData;
};

export function useEventsResource(
  params: EventsResourceParams
): EventsResourceValue {
  const { userId } = params;
  const isTogglingSavedRef = useRef<Set<string>>(new Set<string>());
  const pendingSavedToggleTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const [pendingSavedToggles, setPendingSavedToggles] = useState<
    Record<string, boolean>
  >({});

  const savedEventsQuery = db.useQuery(
    userId
      ? {
          saved_events: {
            $: {
              where: { 'owner.id': userId },
            },
          },
        }
      : null
  );
  const eventsQuery = db.useQuery(userId ? { events: {} } : null);

  const events = useMemo(() => {
    if (!userId) return EMPTY_EVENTS;
    const records = (eventsQuery.data?.events ?? []) as InstantRecord[];
    return records.map(mapEvent);
  }, [eventsQuery.data, userId]);

  const savedEvents = useMemo(() => {
    if (!userId) return EMPTY_SAVED_EVENTS;
    const records = (savedEventsQuery.data?.saved_events ??
      []) as InstantRecord[];
    return records.map(mapSavedEvent);
  }, [savedEventsQuery.data, userId]);

  const savedEventIdSet = useMemo(
    () => new Set(savedEvents.map((savedEvent) => savedEvent.event_id)),
    [savedEvents]
  );

  const isEventSaved = useCallback(
    (eventId: string): boolean => {
      if (eventId in pendingSavedToggles) {
        return pendingSavedToggles[eventId];
      }

      return savedEventIdSet.has(eventId);
    },
    [pendingSavedToggles, savedEventIdSet]
  );

  const savedEventsList = useMemo(
    () => events.filter((event) => savedEventIdSet.has(event.id)),
    [events, savedEventIdSet]
  );

  const toggleSavedEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (!userId) return;
      if (isTogglingSavedRef.current.has(eventId)) return;

      const isCurrentlySaved = savedEvents.some(
        (entry) => entry.event_id === eventId
      );
      const shouldBeSaved = !isCurrentlySaved;

      const savedEvent = savedEvents.find(
        (entry) => entry.event_id === eventId
      );
      isTogglingSavedRef.current.add(eventId);

      const previousTimeout =
        pendingSavedToggleTimeoutsRef.current.get(eventId);
      if (previousTimeout != null) {
        clearTimeout(previousTimeout);
      }

      setPendingSavedToggles((previous) => ({
        ...previous,
        [eventId]: shouldBeSaved,
      }));

      const timeoutId = setTimeout(() => {
        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }, 8000);

      pendingSavedToggleTimeoutsRef.current.set(eventId, timeoutId);

      try {
        if (savedEvent) {
          await removeSavedEvent(savedEvent.id);
        } else {
          await saveEvent(userId, eventId);
        }
      } catch (error: unknown) {
        captureHandledError(error, {
          extras: { eventId, userId },
          tags: {
            area: 'events',
            operation: 'toggle_saved_event',
          },
        });
        console.error('[DataProvider] Failed to toggle saved event:', error);
        const timeout = pendingSavedToggleTimeoutsRef.current.get(eventId);
        if (timeout != null) {
          clearTimeout(timeout);
        }

        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }
    },
    [savedEvents, userId]
  );

  useEffect(() => {
    if (!userId) {
      if (pendingSavedToggleTimeoutsRef.current.size > 0) {
        pendingSavedToggleTimeoutsRef.current.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        pendingSavedToggleTimeoutsRef.current.clear();
      }
      setPendingSavedToggles((previous) =>
        Object.keys(previous).length === 0 ? previous : {}
      );
      if (isTogglingSavedRef.current.size > 0) {
        isTogglingSavedRef.current.clear();
      }
      return;
    }

    Object.entries(pendingSavedToggles).forEach(([eventId, shouldBeSaved]) => {
      const isNowSaved = savedEvents.some(
        (savedEvent) => savedEvent.event_id === eventId
      );

      if (isNowSaved === shouldBeSaved) {
        const timeout = pendingSavedToggleTimeoutsRef.current.get(eventId);
        if (timeout != null) {
          clearTimeout(timeout);
        }

        pendingSavedToggleTimeoutsRef.current.delete(eventId);
        setPendingSavedToggles((previous) => {
          if (!(eventId in previous)) return previous;

          const next = { ...previous };
          delete next[eventId];
          return next;
        });
        isTogglingSavedRef.current.delete(eventId);
      }
    });
  }, [pendingSavedToggles, savedEvents, userId]);

  const eventsValue = useMemo(
    () => ({
      events,
      eventsLoading: Boolean(userId) && eventsQuery.isLoading,
    }),
    [events, eventsQuery.isLoading, userId]
  );

  const savedEventsValue = useMemo(
    () => ({
      isEventSaved,
      savedEvents,
      savedEventsList,
      savedEventsLoading:
        Boolean(userId) &&
        (savedEventsQuery.isLoading || eventsQuery.isLoading),
      toggleSavedEvent,
    }),
    [
      eventsQuery.isLoading,
      isEventSaved,
      savedEvents,
      savedEventsList,
      savedEventsQuery.isLoading,
      toggleSavedEvent,
      userId,
    ]
  );

  return {
    eventsValue,
    savedEventsValue,
  };
}
