import { describe, expect, test } from 'bun:test';

import type { Event } from '../lib/types';
import {
  buildCurrentWeek,
  getDayKey,
  parseEventDate,
  resolveEventDayKey,
  startOfDay,
} from '../src/lib/events/date-utils';

function createEvent(overrides: Partial<Event>): Event {
  return {
    attendees: 0,
    badge: null,
    badge_color: null,
    category: null,
    created_at: '2026-04-01T00:00:00.000Z',
    date: '2026-04-02',
    day_label: null,
    description: null,
    featured: false,
    guest_price: null,
    id: 'event-1',
    image: 'https://example.com/image.jpg',
    location: 'Da Nang',
    member_price: null,
    price: '$10',
    time: '20:00',
    title: 'Event',
    vip_price: null,
    ...overrides,
  };
}

describe('event date utils', () => {
  test('parses ISO date strings as local day values', () => {
    const parsed = parseEventDate(
      '2026-04-02',
      new Date('2026-04-02T15:00:00')
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.toISOString()).toBe(
      startOfDay(new Date(2026, 3, 2)).toISOString()
    );
  });

  test('parses short weekday month strings within the current week', () => {
    const parsed = parseEventDate(
      'Thu, Apr 2',
      new Date('2026-04-02T08:00:00')
    );

    expect(parsed).not.toBeNull();
    expect(getDayKey(parsed as Date)).toBe('2026-04-02');
  });

  test('builds a seven-day week with today marked', () => {
    const week = buildCurrentWeek('en-US', new Date('2026-04-02T10:00:00'));

    expect(week).toHaveLength(7);
    expect(week.some((day) => day.isToday)).toBe(true);
  });

  test('falls back to day_label matching when date cannot be parsed', () => {
    const now = new Date('2026-04-02T10:00:00');
    const week = buildCurrentWeek('en-US', now);
    const key = resolveEventDayKey(
      createEvent({
        date: 'Tonight',
        day_label: 'Thursday',
      }),
      week,
      now
    );

    expect(key).toBe('2026-04-02');
  });
});
