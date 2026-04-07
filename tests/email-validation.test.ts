import { describe, expect, test } from 'bun:test';

import { isEmailValid } from '@/src/lib/validation/email';

describe('email validation', () => {
  test('accepts valid common addresses', () => {
    expect(isEmailValid('member@example.com')).toBe(true);
    expect(isEmailValid("o'connor@example.com")).toBe(true);
    expect(isEmailValid('member+vip@example.co.uk')).toBe(true);
  });

  test('rejects malformed addresses', () => {
    expect(isEmailValid('memberexample.com')).toBe(false);
    expect(isEmailValid('member@')).toBe(false);
    expect(isEmailValid('member @example.com')).toBe(false);
  });

  test('rejects addresses longer than 254 chars', () => {
    const localPart = 'a'.repeat(249);
    const overMaxEmail = `${localPart}@x.com`;

    expect(overMaxEmail.length).toBeGreaterThan(254);
    expect(isEmailValid(overMaxEmail)).toBe(false);
  });
});
