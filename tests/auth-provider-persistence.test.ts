import { afterAll, describe, expect, mock, test } from 'bun:test';

const captureHandledErrorMock = mock(() => {});
const googleConfigureMock = mock(() => {});
const appleSignInAsyncMock = mock(async () => ({
  identityToken: 'apple-id-token',
}));
const setProfileAuthProviderMock = mock(async () => {});
const signInWithIdTokenMock = mock(async () => ({
  created: true,
  user: {
    email: 'member@example.com',
    id: 'user-123',
  },
}));

mock.module('@/lib/api', () => ({
  setProfileAuthProvider: setProfileAuthProviderMock,
}));

mock.module('@/src/lib/auth/id-token', () => ({
  getIdTokenAudienceClaim: () => null,
  getIdTokenNonceClaim: () => null,
  resolveDisplayNameForCreate: () => 'Member',
}));

mock.module('@/src/lib/auth/provider-error-mapping', () => ({
  DEFAULT_GOOGLE_CLIENT_NAME: 'google',
  extractAuthErrorMessage: () => 'auth error',
  shouldRetryGoogleSignInWithDefaultClientName: () => false,
  shouldRetryOauthClientSignInWithAlternateClientName: () => false,
  shouldTryGoogleAudienceFallback: () => false,
}));

mock.module('react-native-get-random-values', () => ({}));

mock.module('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: googleConfigureMock,
    getCurrentUser: () => null,
    hasPlayServices: async () => true,
    hasPreviousSignIn: () => false,
    revokeAccess: async () => null,
    signIn: async () => ({ data: { idToken: 'google-id-token' } }),
    signOut: async () => null,
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
  isAvailableAsync: async () => true,
  signInAsync: appleSignInAsyncMock,
}));

mock.module('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

mock.module('@/src/lib/instant', () => ({
  db: {
    auth: {
      signInWithIdToken: signInWithIdTokenMock,
      signInWithMagicCode: async () => ({
        created: true,
        user: {
          email: 'member@example.com',
          id: 'user-123',
        },
      }),
      sendMagicCode: async () => ({}),
      signOut: async () => ({}),
    },
  },
}));

mock.module('@/src/lib/monitoring', () => ({
  captureHandledError: captureHandledErrorMock,
}));

const originalCrypto = globalThis.crypto;

(
  globalThis as {
    crypto?: {
      getRandomValues?: (target: Uint8Array) => Uint8Array;
      subtle?: SubtleCrypto;
    };
  }
).crypto = {
  getRandomValues(target: Uint8Array): Uint8Array {
    target.fill(7);
    return target;
  },
  ...(originalCrypto?.subtle ? { subtle: originalCrypto.subtle } : {}),
};

afterAll(() => {
  (
    globalThis as {
      crypto?: Crypto;
    }
  ).crypto = originalCrypto;
  mock.restore();
});

const { signInWithAppleFlow } =
  await import('@/src/lib/auth/provider-auth-flows');

describe('auth provider persistence after sign-in', () => {
  test('persists the provider after successful Apple sign-in', async () => {
    appleSignInAsyncMock.mockReset();
    appleSignInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
    });
    setProfileAuthProviderMock.mockReset();
    signInWithIdTokenMock.mockReset();
    signInWithIdTokenMock.mockResolvedValue({
      created: true,
      user: {
        email: 'member@example.com',
        id: 'user-123',
      },
    });

    await signInWithAppleFlow({
      t: ((key: string) => key) as (key: string) => string,
    });

    expect(setProfileAuthProviderMock).toHaveBeenCalledTimes(1);
    expect(setProfileAuthProviderMock).toHaveBeenCalledWith(
      'user-123',
      'apple'
    );
  });

  test('does not fail sign-in when provider persistence fails', async () => {
    appleSignInAsyncMock.mockReset();
    appleSignInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
    });
    captureHandledErrorMock.mockReset();
    setProfileAuthProviderMock.mockReset();
    signInWithIdTokenMock.mockReset();
    signInWithIdTokenMock.mockResolvedValue({
      created: true,
      user: {
        email: 'member@example.com',
        id: 'user-123',
      },
    });
    setProfileAuthProviderMock.mockRejectedValueOnce(
      new Error('permission denied')
    );

    let thrownError: unknown = null;

    try {
      await signInWithAppleFlow({
        t: ((key: string) => key) as (key: string) => string,
      });
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeNull();
    expect(setProfileAuthProviderMock).toHaveBeenCalledTimes(1);
    expect(captureHandledErrorMock).toHaveBeenCalledTimes(0);
  });

  test('captures non-permission persistence failures', async () => {
    appleSignInAsyncMock.mockReset();
    appleSignInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
    });
    captureHandledErrorMock.mockReset();
    setProfileAuthProviderMock.mockReset();
    signInWithIdTokenMock.mockReset();
    signInWithIdTokenMock.mockResolvedValue({
      created: true,
      user: {
        email: 'member@example.com',
        id: 'user-123',
      },
    });
    setProfileAuthProviderMock.mockRejectedValueOnce(new Error('db timeout'));

    await signInWithAppleFlow({
      t: ((key: string) => key) as (key: string) => string,
    });

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1);
  });

  test('maps Apple unknown authorization failure to canceled', async () => {
    appleSignInAsyncMock.mockReset();
    appleSignInAsyncMock.mockRejectedValueOnce({
      code: 'ERR_REQUEST_UNKNOWN',
      message: 'The authorization attempt failed for an unknown reason',
    });
    captureHandledErrorMock.mockReset();
    setProfileAuthProviderMock.mockReset();
    signInWithIdTokenMock.mockReset();

    let thrownError: unknown = null;

    try {
      await signInWithAppleFlow({
        t: ((key: string) => key) as (key: string) => string,
      });
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('providerSignInCanceled');
    expect(signInWithIdTokenMock).toHaveBeenCalledTimes(0);
    expect(setProfileAuthProviderMock).toHaveBeenCalledTimes(0);
    expect(captureHandledErrorMock).toHaveBeenCalledTimes(0);
  });

  test('does not forward onboarding fields into user create extraFields when dob is omitted', async () => {
    appleSignInAsyncMock.mockReset();
    appleSignInAsyncMock.mockResolvedValue({
      identityToken: 'apple-id-token',
    });
    signInWithIdTokenMock.mockReset();
    signInWithIdTokenMock.mockResolvedValue({
      created: true,
      user: {
        email: 'member@example.com',
        id: 'user-123',
      },
    });

    await signInWithAppleFlow({
      onboardingData: {
        displayName: 'Member Name',
        hasAcceptedPrivacyPolicy: true,
        hasAcceptedTerms: true,
        hasCompletedSetup: true,
        locationPermissionStatus: 'GRANTED',
        memberSegment: 'LONG_TERM',
        pushNotificationPermissionStatus: 'DENIED',
      },
      t: ((key: string) => key) as (key: string) => string,
    });

    expect(signInWithIdTokenMock).toHaveBeenCalledTimes(1);
    const firstCall = signInWithIdTokenMock.mock.calls[0]?.[0] as {
      extraFields?: Record<string, unknown>;
    };
    expect(firstCall.extraFields).toEqual({ display_name: 'Member' });
    expect(Object.keys(firstCall.extraFields ?? {})).toEqual(['display_name']);
  });
});
