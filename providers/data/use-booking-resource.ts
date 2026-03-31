import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapBookingOccasion,
  mapBookingTimeSlot,
  mapPrivateEventType,
} from '@/src/lib/mappers';

import {
  EMPTY_BOOKING_OCCASIONS,
  EMPTY_BOOKING_TIME_SLOTS,
  EMPTY_PRIVATE_EVENT_TYPES,
  type BookingContentData,
} from './context';

type BookingResourceParams = {
  userId: string;
};

export function useBookingResource(
  params: BookingResourceParams
): BookingContentData {
  const { userId } = params;
  const bookingOccasionsQuery = db.useQuery(
    userId ? { booking_occasions: {} } : null
  );
  const bookingTimeSlotsQuery = db.useQuery(
    userId ? { booking_time_slots: {} } : null
  );
  const privateEventTypesQuery = db.useQuery(
    userId ? { private_event_types: {} } : null
  );

  const bookingOccasions = useMemo(() => {
    if (!userId) return EMPTY_BOOKING_OCCASIONS;
    const records = (bookingOccasionsQuery.data?.booking_occasions ??
      []) as InstantRecord[];
    return records
      .map(mapBookingOccasion)
      .filter((option) => option.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [bookingOccasionsQuery.data, userId]);

  const bookingTimeSlots = useMemo(() => {
    if (!userId) return EMPTY_BOOKING_TIME_SLOTS;
    const records = (bookingTimeSlotsQuery.data?.booking_time_slots ??
      []) as InstantRecord[];
    return records
      .map(mapBookingTimeSlot)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [bookingTimeSlotsQuery.data, userId]);

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
        Boolean(userId) &&
        (bookingOccasionsQuery.isLoading ||
          bookingTimeSlotsQuery.isLoading ||
          privateEventTypesQuery.isLoading),
      bookingOccasions,
      bookingTimeSlots,
      privateEventTypes,
    }),
    [
      bookingOccasions,
      bookingOccasionsQuery.isLoading,
      bookingTimeSlots,
      bookingTimeSlotsQuery.isLoading,
      privateEventTypes,
      privateEventTypesQuery.isLoading,
      userId,
    ]
  );
}
