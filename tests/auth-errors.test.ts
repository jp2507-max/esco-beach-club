import { describe, expect, test } from 'bun:test';

import { toError } from '@/src/lib/auth/provider-error-mapping';
import { AUTH_ERROR_KEYS, isAuthErrorKey } from '@/src/lib/auth-errors';

describe('auth error keys', () => {
  test('includes profile provisioning failure key', () => {
    expect(AUTH_ERROR_KEYS).toContain('unableToCompleteProfileSetup');
    expect(AUTH_ERROR_KEYS).toContain('profilePermissionDenied');
    expect(AUTH_ERROR_KEYS).toContain('googleAndroidAuthNotConfigured');
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

  test('preserves permission-specific profile provisioning errors', () => {
    const mappedError = toError(
      {
        body: {
          message: 'profilePermissionDenied',
        },
      },
      'unableToSignInWithGoogle'
    );

    expect(mappedError.message).toBe('profilePermissionDenied');
  });

  test('maps google DEVELOPER_ERROR to googleAndroidAuthNotConfigured', () => {
    const mappedError = toError(
      new Error(
        'DEVELOPER_ERROR: Follow troubleshooting instructions at https://react-native-google-signin.github.io/docs/troubleshooting'
      ),
      'unableToSignInWithGoogle',
      { oauthProvider: 'google' }
    );

    expect(mappedError.message).toBe('googleAndroidAuthNotConfigured');
  });

  test('falls back when error payload has no usable message', () => {
    const mappedError = toError({}, 'unableToVerifyCode');

    expect(mappedError.message).toBe('unableToVerifyCode');
  });
});
