import { describe, expect, test } from 'bun:test';

import { buildMembershipBenefitRows } from '@/src/lib/profile/membership-benefit-rows';

const BENEFITS = {
  concierge: { wide: false },
  discountDining: { wide: true },
  memberEvents: { wide: false },
  priorityBooking: { wide: false },
} as const;

describe('membership benefit rows', () => {
  test('keeps wide benefits on their own rows', () => {
    const benefits = [
      { ...BENEFITS.memberEvents, key: 'memberEvents' },
      { ...BENEFITS.discountDining, key: 'discountDining' },
      { ...BENEFITS.priorityBooking, key: 'priorityBooking' },
    ];

    const rows = buildMembershipBenefitRows(benefits);

    expect(rows).toHaveLength(3);
    expect(rows[0]?.map((benefit) => benefit.key)).toEqual(['memberEvents']);
    expect(rows[1]?.map((benefit) => benefit.key)).toEqual(['discountDining']);
    expect(rows[2]?.map((benefit) => benefit.key)).toEqual(['priorityBooking']);
  });

  test('pairs non-wide benefits into deterministic two-column rows', () => {
    const benefits = [
      { ...BENEFITS.memberEvents, key: 'memberEvents' },
      { ...BENEFITS.priorityBooking, key: 'priorityBooking' },
      { ...BENEFITS.concierge, key: 'concierge' },
    ];

    const rows = buildMembershipBenefitRows(benefits);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.map((benefit) => benefit.key)).toEqual([
      'memberEvents',
      'priorityBooking',
    ]);
    expect(rows[1]?.map((benefit) => benefit.key)).toEqual(['concierge']);
  });
});
