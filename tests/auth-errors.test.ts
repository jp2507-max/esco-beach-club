import { describe, expect, test } from 'bun:test';

import { AUTH_ERROR_KEYS, isAuthErrorKey } from '@/src/lib/auth-errors';

describe('auth error keys', () => {
  test('includes profile provisioning failure key', () => {
    expect(AUTH_ERROR_KEYS).toContain('unableToCompleteProfileSetup');
  });

  test('recognizes valid auth error keys', () => {
    for (const key of AUTH_ERROR_KEYS) {
      expect(isAuthErrorKey(key)).toBe(true);
    }
  });

  test('rejects non-auth error keys', () => {
    expect(isAuthErrorKey('profileMissingAfterSignIn')).toBe(false);
    expect(isAuthErrorKey('')).toBe(false);
    expect(isAuthErrorKey(null)).toBe(false);
  });
});
