import { afterEach, describe, expect, mock, test } from 'bun:test';

mock.module('react-native-get-random-values', () => ({}));

const signInAsyncMock = mock(async () => ({
  authorizationCode: 'code',
  identityToken: 'token',
  user: 'user-123',
}));

mock.module('expo-apple-authentication', () => ({
  AppleAuthenticationScope: {
    EMAIL: 1,
    FULL_NAME: 0,
  },
  isAvailableAsync: async () => true,
  signInAsync: signInAsyncMock,
}));

mock.module('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mock(() => {}),
    getCurrentUser: mock(() => null),
    hasPreviousSignIn: mock(() => false),
    revokeAccess: mock(async () => null),
    signIn: mock(async () => ({ data: { idToken: 'token' } })),
    signOut: mock(async () => null),
  },
  isErrorWithCode(error: unknown): error is { code: string; message: string } {
    return Boolean(
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    );
  },
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  },
}));

mock.module('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

const { getAppleAuthorizationCode } =
  await import('@/src/lib/auth/social-auth');

describe('Apple sign-in cancellation mapping', () => {
  afterEach(() => {
    signInAsyncMock.mockReset();
  });

  test('maps ERR_REQUEST_CANCELED to providerSignInCanceled', async () => {
    signInAsyncMock.mockRejectedValueOnce({
      code: 'ERR_REQUEST_CANCELED',
      message: 'The user canceled the sign-in flow',
    });

    await expect(getAppleAuthorizationCode()).rejects.toThrow(
      'providerSignInCanceled'
    );
  });

  test('does not treat unrelated unknown-reason errors as cancellation', async () => {
    const systemError = {
      code: 'ERR_REQUEST_FAILED',
      message: 'The authorization attempt failed for an unknown reason',
    };

    signInAsyncMock.mockRejectedValueOnce(systemError);

    await expect(getAppleAuthorizationCode()).rejects.toBe(systemError);
  });
});
