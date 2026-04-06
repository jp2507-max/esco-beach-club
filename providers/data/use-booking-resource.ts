import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import { type InstantRecord, mapPrivateEventType } from '@/src/lib/mappers';

import { type BookingContentData, EMPTY_PRIVATE_EVENT_TYPES } from './context';

type BookingResourceParams = {
  userId: string;
};

export function useBookingResource(
  params: BookingResourceParams
): BookingContentData {
  const { userId } = params;
  const privateEventTypesQuery = db.useQuery(
    userId ? { private_event_types: {} } : null
  );

  const privateEventTypes = useMemo(() => {
    if (!userId) return EMPTY_PRIVATE_EVENT_TYPES;
    const records = (privateEventTypesQuery.data?.private_event_types ??
      []) as InstantRecord[];
    return records
      .map(mapPrivateEventType)
      .filter((option) => option.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [privateEventTypesQuery.data, userId]);

  return useMemo(
    () => ({
      bookingContentLoading:
        Boolean(userId) && privateEventTypesQuery.isLoading,
      privateEventTypes,
    }),
    [privateEventTypes, privateEventTypesQuery.isLoading, userId]
  );
}
