import { describe, expect, test } from 'bun:test';

import {
  getBookingConfirmationDate,
  getNext7Days,
  toLocalDateString,
} from '../src/lib/booking/booking-screen';

const t = (key: string): string => key;

describe('booking screen date selection', () => {
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
});
