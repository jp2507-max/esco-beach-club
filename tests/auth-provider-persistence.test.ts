import { describe, expect, mock, test } from 'bun:test';

const captureHandledErrorMock = mock(() => {});
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

mock.module('@/src/lib/auth/signup-onboarding', () => ({
  extractSignInUser(result: unknown) {
    if (!result || typeof result !== 'object') {
      return { created: false, email: null, id: null };
    }

    const user =
      'user' in result && result.user && typeof result.user === 'object'
        ? (result.user as { email?: unknown; id?: unknown })
        : null;

    return {
      created:
        'created' in result && typeof result.created === 'boolean'
          ? result.created
          : false,
      email: typeof user?.email === 'string' ? user.email : null,
      id: typeof user?.id === 'string' ? user.id : null,
    };
  },
  hasRequiredSignupConsent: () => true,
  normalizeSignupOnboardingData: () => null,
}));

mock.module('@/src/lib/auth/social-auth', () => ({
  canTryGoogleAudienceFallback: () => false,
  getAppleIdToken: async () => ({
    clientName: 'apple',
    idToken: 'apple-id-token',
    nonce: 'apple-nonce',
  }),
  getGoogleIdToken: async () => ({
    audience: 'web',
    clientName: 'google',
    idToken: 'google-id-token',
  }),
  getGoogleIdTokenWithOptions: async () => ({
    audience: 'web',
    clientName: 'google',
    idToken: 'google-id-token',
  }),
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

const { signInWithAppleFlow } =
  await import('@/src/lib/auth/provider-auth-flows');

describe('auth provider persistence after sign-in', () => {
  test('persists the provider after successful Apple sign-in', async () => {
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
    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1);
  });
});
