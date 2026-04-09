import { describe, expect, test } from 'bun:test';

import { toError } from '@/src/lib/auth/provider-error-mapping';
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

  test('maps oauth-client-not-found errors to provider-specific auth keys', () => {
    const mappedGoogleError = toError(
      {
        body: {
          message: 'record not found: oauth-client',
        },
      },
      'unableToSignInWithGoogle',
      { oauthProvider: 'google' }
    );

    expect(mappedGoogleError.message).toBe('googleOauthClientNotConfigured');

    const mappedAppleError = toError(
      {
        body: {
          message: 'record not found: oauth-client',
        },
      },
      'unableToSignInWithApple',
      { oauthProvider: 'apple' }
    );

    expect(mappedAppleError.message).toBe('appleOauthClientNotConfigured');
  });

  test('preserves known auth key messages from providers', () => {
    const mappedError = toError(
      {
        body: {
          message: 'unableToCompleteProfileSetup',
        },
      },
      'unableToSignInWithGoogle'
    );

    expect(mappedError.message).toBe('unableToCompleteProfileSetup');
  });

  test('falls back when error payload has no usable message', () => {
    const mappedError = toError({}, 'unableToVerifyCode');

    expect(mappedError.message).toBe('unableToVerifyCode');
  });
});
