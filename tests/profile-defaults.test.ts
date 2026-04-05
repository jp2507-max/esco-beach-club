import { describe, expect, test } from 'bun:test';

import { getDefaultProfileValues } from '@/lib/api/shared';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('default profile values', () => {
  test('uses a safe fallback full name when no display name or email are provided', () => {
    const values = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect(values.full_name).toBe('Member');
    expect(values.full_name.length).toBeGreaterThanOrEqual(1);
    expect(values.full_name.length).toBeLessThanOrEqual(60);
  });

  test('normalizes and truncates display names to 60 chars', () => {
    const values = getDefaultProfileValues({
      userId: TEST_USER_ID,
      displayName: `  Alice   ${'x'.repeat(120)}  `,
    });

    expect(values.full_name.includes('  ')).toBe(false);
    expect(values.full_name.length).toBe(60);
  });

  test('derives and clamps fallback name from email prefix', () => {
    const values = getDefaultProfileValues({
      userId: TEST_USER_ID,
      email: `john.doe-super_long_${'a'.repeat(120)}@example.com`,
    });

    expect(values.full_name.length).toBeGreaterThanOrEqual(1);
    expect(values.full_name.length).toBeLessThanOrEqual(60);
  });
});
