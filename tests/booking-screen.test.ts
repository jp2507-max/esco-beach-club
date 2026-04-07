import { describe, expect, test } from 'bun:test';

import {
  getBookableTimeSlots,
  getBookingConfirmationDate,
  getBookingMonthOptions,
  getNext7Days,
  getNextBookingDays,
  toLocalDateString,
} from '@/src/lib/booking/booking-screen';

const t = (key: string): string => key;

describe('booking screen date selection', () => {
  test('builds a 30-day booking window by default', () => {
    const now = new Date(2026, 3, 2, 10, 0, 0);
    const dates = getNextBookingDays(now);

    expect(dates).toHaveLength(30);
    expect(dates[0]?.dateKey).toBe(toLocalDateString(now));
    expect(new Set(dates.map((date) => date.dateKey)).size).toBe(30);
  });

  test('uses a stable date key for each generated day', () => {
    const dates = getNext7Days(new Date('2026-04-02T10:00:00'));

    expect(dates[0]?.dateKey).toBe(toLocalDateString(dates[0]!.date));
    expect(new Set(dates.map((date) => date.dateKey)).size).toBe(7);
  });

  test('formats confirmation dates by stable date key after dates rebuild', () => {
    const selectedDateKey = '2026-04-02';
    const rebuiltDates = getNext7Days(new Date('2026-04-03T00:30:00'));

    expect(
      getBookingConfirmationDate({
        dates: rebuiltDates,
        selectedDateKey,
        t,
      })
    ).toContain('days.thu');
  });

  test('exposes month options across month boundaries', () => {
    const dates = getNextBookingDays(new Date(2026, 3, 20, 9, 0, 0));
    const monthOptions = getBookingMonthOptions(dates);

    expect(monthOptions.map((month) => month.key)).toEqual([
      '2026-04',
      '2026-05',
    ]);
  });
});

describe('booking screen time slot logic', () => {
  test('same-day slots start at next 15-minute mark after 30-minute buffer', () => {
    const now = new Date(2026, 3, 2, 9, 7, 0);
    const slots = getBookableTimeSlots({
      now,
      selectedDateKey: toLocalDateString(now),
    });

    expect(slots[0]).toBe('09:45');
  });

  test('future-day slots always include full booking range', () => {
    const now = new Date(2026, 3, 2, 20, 50, 0);
    const tomorrow = new Date(2026, 3, 3, 20, 50, 0);
    const slots = getBookableTimeSlots({
      now,
      selectedDateKey: toLocalDateString(tomorrow),
    });

    expect(slots[0]).toBe('08:00');
    expect(slots.at(-1)).toBe('23:00');
  });

  test('same-day slots are empty when buffer moves past closing time', () => {
    const now = new Date(2026, 3, 2, 22, 50, 0);
    const slots = getBookableTimeSlots({
      now,
      selectedDateKey: toLocalDateString(now),
    });

    expect(slots).toHaveLength(0);
  });
});
