import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const originalGoogleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client-id';

mock.module('react-native-get-random-values', () => ({}));

const configureMock = mock(() => {});
const getCurrentUserMock = mock(() => null);
const hasPreviousSignInMock = mock(() => false);
const revokeAccessMock = mock(async () => null);
const signOutMock = mock(async () => null);

mock.module('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: configureMock,
    getCurrentUser: getCurrentUserMock,
    hasPlayServices: mock(async () => true),
    hasPreviousSignIn: hasPreviousSignInMock,
    revokeAccess: revokeAccessMock,
    signIn: mock(async () => ({ data: { idToken: 'token' } })),
    signOut: signOutMock,
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

mock.module('expo-apple-authentication', () => ({
  AppleAuthenticationScope: {
    EMAIL: 1,
    FULL_NAME: 0,
  },
  isAvailableAsync: async () => false,
  signInAsync: async () => {
    throw new Error('appleAuthUnavailable');
  },
}));

mock.module('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

const { cleanupGoogleSessionAfterDeletion, resetGoogleSignIn } =
  await import('@/src/lib/auth/social-auth');

describe('google post-delete cleanup helper', () => {
  beforeEach(() => {
    resetGoogleSignIn();

    configureMock.mockReset();
    getCurrentUserMock.mockReset();
    hasPreviousSignInMock.mockReset();
    revokeAccessMock.mockReset();
    signOutMock.mockReset();

    getCurrentUserMock.mockReturnValue(null);
    hasPreviousSignInMock.mockReturnValue(false);
    revokeAccessMock.mockResolvedValue(null);
    signOutMock.mockResolvedValue(null);
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalGoogleWebClientId;
  });

  test('skips revoke when there is no prior Google session', async () => {
    const result = await cleanupGoogleSessionAfterDeletion();

    expect(result).toEqual({
      status: 'skipped_no_session',
    });
    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(revokeAccessMock).not.toHaveBeenCalled();
  });

  test('revokes access when a prior Google session exists', async () => {
    hasPreviousSignInMock.mockReturnValue(true);

    const result = await cleanupGoogleSessionAfterDeletion();

    expect(result).toEqual({
      status: 'revoked',
    });
    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(revokeAccessMock).toHaveBeenCalledTimes(1);
  });

  test('returns failed_non_blocking and best-effort signs out on revoke failure', async () => {
    hasPreviousSignInMock.mockReturnValue(true);
    revokeAccessMock.mockRejectedValueOnce({
      code: 'API_EXCEPTION',
      message: 'HTTPStatus Code=400',
    });

    const result = await cleanupGoogleSessionAfterDeletion();

    expect(result.status).toBe('failed_non_blocking');
    if (result.status === 'failed_non_blocking') {
      expect(result.message).toContain('API_EXCEPTION');
      expect(result.message).toContain('HTTPStatus Code=400');
    }
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
