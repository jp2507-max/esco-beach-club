import { id } from '@instantdb/react-native';

import type { Event, SavedEvent } from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapEvent, mapSavedEvent } from '@/src/lib/mappers';

import { nowIso } from './shared';

export async function fetchEvents(): Promise<Event[]> {
  const { data } = await db.queryOnce({ events: {} });
  return (data.events as InstantRecord[]).map(mapEvent);
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data } = await db.queryOnce({
    events: {
      $: {
        where: { id },
      },
    },
  });

  const event = data.events[0] as InstantRecord | undefined;
  return event ? mapEvent(event) : null;
}

export async function fetchSavedEvents(userId: string): Promise<SavedEvent[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    saved_events: {
      $: {
        where: { 'owner.id': userId },
      },
    },
  });

  return (data.saved_events as InstantRecord[]).map(mapSavedEvent);
}

export async function saveEvent(
  userId: string,
  eventId: string
): Promise<SavedEvent> {
  const createdAt = nowIso();
  const savedEventId = id();
  const entryKey = `${userId}:${eventId}`;

  const tx = db.tx.saved_events[savedEventId]
    .create({
      created_at: createdAt,
      entry_key: entryKey,
      event_id: eventId,
    })
    .link({ event: eventId, owner: userId });

  try {
    await db.transact(tx);

    return {
      id: savedEventId,
      created_at: createdAt,
      entry_key: entryKey,
      event_id: eventId,
    };
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          saved_events: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.saved_events[0] as InstantRecord | undefined;
        if (existing) {
          return mapSavedEvent(existing);
        }
      }
    }

    throw error;
  }
}

export async function removeSavedEvent(savedEventId: string): Promise<void> {
  await db.transact(db.tx.saved_events[savedEventId].delete());
}
