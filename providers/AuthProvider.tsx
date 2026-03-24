import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

import {
  canTryGoogleAudienceFallback,
  getAppleIdToken,
  getGoogleIdToken,
  getGoogleIdTokenWithOptions,
} from '@/src/lib/auth/social-auth';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import { db } from '@/src/lib/instant';

type SendCodeParams = {
  email: string;
};

type VerifyCodeParams = {
  code: string;
  email: string;
};

const DEFAULT_GOOGLE_CLIENT_NAME = 'google';

type JwtPayload = Record<string, unknown>;

function decodeJwtPayload(idToken: string): JwtPayload | null {
  const tokenParts = idToken.split('.');

  if (tokenParts.length < 2) {
    return null;
  }

  const base64Url = tokenParts[1];
  const paddedBase64 = `${base64Url}${'='.repeat((4 - (base64Url.length % 4)) % 4)}`;
  const base64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');
  const atobFn = (globalThis as { atob?: (value: string) => string }).atob;

  if (!atobFn) {
    return null;
  }

  try {
    const decoded = atobFn(base64);
    const parsed = JSON.parse(decoded) as unknown;

    if (parsed && typeof parsed === 'object') {
      return parsed as JwtPayload;
    }

    return null;
  } catch {
    return null;
  }
}

function getIdTokenAudienceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.aud === undefined || payload.aud === null) {
    return null;
  }

  if (typeof payload.aud === 'string') {
    return payload.aud;
  }

  if (Array.isArray(payload.aud)) {
    const audValues = payload.aud.filter(
      (value): value is string => typeof value === 'string'
    );

    if (audValues.length > 0) {
      return audValues.join(',');
    }
  }

  return null;
}

function getIdTokenNonceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.nonce === undefined || payload.nonce === null) {
    return null;
  }

  if (typeof payload.nonce === 'string') {
    const normalizedNonce = payload.nonce.trim();
    return normalizedNonce || null;
  }

  return null;
}

function extractAuthErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object' &&
    'message' in error.body &&
    typeof error.body.message === 'string'
  ) {
    return error.body.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
}

type MapAuthErrorOptions = {
  /** Set when handling Google OAuth so oauth-client errors map without relying on server wording. */
  oauthProvider?: 'google';
};

function mapAuthErrorMessageToKey(
  message: string,
  options?: MapAuthErrorOptions
): string | null {
  const normalizedMessage = message.trim().toLowerCase();

  const isOauthClientNotFound =
    normalizedMessage.includes('record not found') &&
    (normalizedMessage.includes('oauth-client') ||
      normalizedMessage.includes('oauth_client') ||
      normalizedMessage.includes('oauth client'));

  const isGoogleAudienceMismatch =
    normalizedMessage.includes('audience') ||
    normalizedMessage.includes('claim aud') ||
    normalizedMessage.includes('invalid aud') ||
    normalizedMessage.includes('jwt aud') ||
    normalizedMessage.includes('wrong audience') ||
    normalizedMessage.includes('id token') ||
    normalizedMessage.includes('id_token') ||
    normalizedMessage.includes('token verification') ||
    normalizedMessage.includes('nonce parameter was not provided') ||
    normalizedMessage.includes('nonce') ||
    normalizedMessage.includes('nonces mismatch');

  if (!isOauthClientNotFound && !isGoogleAudienceMismatch) {
    return null;
  }

  const isGoogleScoped =
    normalizedMessage.includes('google') || options?.oauthProvider === 'google';

  if (isGoogleScoped) {
    return 'googleOauthClientNotConfigured';
  }

  return null;
}

function shouldRetryGoogleSignInWithDefaultClientName(
  error: unknown,
  clientName: string
): boolean {
  if (clientName === DEFAULT_GOOGLE_CLIENT_NAME) {
    return false;
  }

  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  return (
    message.includes('record not found:') &&
    (message.includes(clientName.toLowerCase()) ||
      message.includes('oauth-client'))
  );
}

function shouldTryGoogleAudienceFallback(error: unknown): boolean {
  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  const mismatchMarkers = [
    'audience',
    'claim aud',
    'invalid aud',
    'jwt aud',
    'wrong audience',
    'token verification',
    'nonce parameter was not provided',
    'nonces mismatch',
  ] as const;

  return mismatchMarkers.some((marker) => message.includes(marker));
}

function toError(
  error: unknown,
  fallbackMessage: string,
  mapOptions?: MapAuthErrorOptions
): Error {
  const message = extractAuthErrorMessage(error);

  if (message) {
    const mappedKey = mapAuthErrorMessageToKey(message, mapOptions);
    if (mappedKey) {
      return new Error(mappedKey);
    }

    const normalizedMessage = message.trim();
    if (isAuthErrorKey(normalizedMessage)) {
      return new Error(normalizedMessage);
    }

    if (__DEV__) {
      return new Error(normalizedMessage);
    }

    return new Error(fallbackMessage);
  }

  return new Error(fallbackMessage);
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const { error: authError, isLoading, user } = db.useAuth();
  const [appleSignInLoading, setAppleSignInLoading] = useState<boolean>(false);
  const [googleSignInLoading, setGoogleSignInLoading] =
    useState<boolean>(false);
  const [sendCodeLoading, setSendCodeLoading] = useState<boolean>(false);
  const [verifyCodeLoading, setVerifyCodeLoading] = useState<boolean>(false);
  const [signOutLoading, setSignOutLoading] = useState<boolean>(false);
  const [appleSignInError, setAppleSignInError] = useState<Error | null>(null);
  const [googleSignInError, setGoogleSignInError] = useState<Error | null>(
    null
  );
  const [sendCodeError, setSendCodeError] = useState<Error | null>(null);
  const [verifyCodeError, setVerifyCodeError] = useState<Error | null>(null);
  const [signOutError, setSignOutError] = useState<Error | null>(null);

  function resetProviderErrors(): void {
    setAppleSignInError(null);
    setGoogleSignInError(null);
  }

  function resetEmailErrors(): void {
    setSendCodeError(null);
    setVerifyCodeError(null);
  }

  async function signInWithApple(): Promise<void> {
    setAppleSignInLoading(true);
    setAppleSignInError(null);
    setGoogleSignInError(null);
    resetEmailErrors();

    try {
      const { clientName, idToken, nonce } = await getAppleIdToken();

      await db.auth.signInWithIdToken({
        clientName,
        idToken,
        nonce,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignInWithApple');
      setAppleSignInError(nextError);
      throw nextError;
    } finally {
      setAppleSignInLoading(false);
    }
  }

  async function signInWithGoogle(): Promise<void> {
    setGoogleSignInLoading(true);
    setGoogleSignInError(null);
    setAppleSignInError(null);
    resetEmailErrors();

    try {
      const primaryToken = await getGoogleIdToken();
      const { clientName, idToken } = primaryToken;
      const primaryTokenNonce = getIdTokenNonceClaim(idToken);

      try {
        await db.auth.signInWithIdToken({
          clientName,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
        });
      } catch (error: unknown) {
        if (__DEV__) {
          console.error(
            '[AuthProvider] Instant Google idToken sign-in failed',
            {
              clientName,
              error,
              extractedMessage: extractAuthErrorMessage(error),
              audience: primaryToken.audience,
              tokenAudClaim: getIdTokenAudienceClaim(idToken),
              tokenNonceClaim: primaryTokenNonce,
            }
          );
        }

        if (!shouldRetryGoogleSignInWithDefaultClientName(error, clientName)) {
          if (
            shouldTryGoogleAudienceFallback(error) &&
            canTryGoogleAudienceFallback()
          ) {
            const fallbackAudience =
              primaryToken.audience === 'ios' ? 'web' : 'ios';

            const fallbackToken = await getGoogleIdTokenWithOptions({
              audience: fallbackAudience,
              forceReconfigure: true,
            });
            const fallbackTokenNonce = getIdTokenNonceClaim(
              fallbackToken.idToken
            );

            if (__DEV__) {
              console.error(
                '[AuthProvider] Retrying Google sign-in with fallback audience',
                {
                  fallbackAudience,
                  fallbackClientName: fallbackToken.clientName,
                  fallbackTokenAudClaim: getIdTokenAudienceClaim(
                    fallbackToken.idToken
                  ),
                  fallbackTokenNonceClaim: fallbackTokenNonce,
                }
              );
            }

            await db.auth.signInWithIdToken({
              clientName: fallbackToken.clientName,
              idToken: fallbackToken.idToken,
              ...(fallbackTokenNonce ? { nonce: fallbackTokenNonce } : {}),
            });

            return;
          }

          throw error;
        }

        await db.auth.signInWithIdToken({
          clientName: DEFAULT_GOOGLE_CLIENT_NAME,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
        });
      }
    } catch (error: unknown) {
      if (__DEV__) {
        console.error('[AuthProvider] Google sign-in flow failed', {
          error,
          extractedMessage: extractAuthErrorMessage(error),
        });
      }

      const nextError = toError(error, 'unableToSignInWithGoogle', {
        oauthProvider: 'google',
      });
      setGoogleSignInError(nextError);
      throw nextError;
    } finally {
      setGoogleSignInLoading(false);
    }
  }

  async function sendCode({ email }: SendCodeParams): Promise<string> {
    setSendCodeLoading(true);
    setSendCodeError(null);
    resetProviderErrors();

    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        throw new Error('emailRequired');
      }

      await db.auth.sendMagicCode({ email: trimmedEmail });
      return trimmedEmail;
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSendCode');
      setSendCodeError(nextError);
      throw nextError;
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function verifyCode({ code, email }: VerifyCodeParams): Promise<void> {
    setVerifyCodeLoading(true);
    setVerifyCodeError(null);
    resetProviderErrors();

    try {
      const trimmedEmail = email.trim();
      const trimmedCode = code.trim();

      if (!trimmedEmail || !trimmedCode) {
        throw new Error('emailAndCodeRequired');
      }

      await db.auth.signInWithMagicCode({
        code: trimmedCode,
        email: trimmedEmail,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToVerifyCode');
      setVerifyCodeError(nextError);
      throw nextError;
    } finally {
      setVerifyCodeLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    setSignOutLoading(true);
    setSignOutError(null);

    try {
      await db.auth.signOut();
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignOut');
      setSignOutError(nextError);
      throw nextError;
    } finally {
      setSignOutLoading(false);
    }
  }

  return {
    authError,
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithApple,
    signInWithGoogle,
    sendCode,
    verifyCode,
    signOut,
    appleSignInLoading,
    googleSignInLoading,
    sendCodeLoading,
    verifyCodeLoading,
    signOutLoading,
    appleSignInError,
    googleSignInError,
    sendCodeError,
    verifyCodeError,
    signOutError,
  };
});
