import { isAuthErrorKey } from '@/src/lib/auth-errors';

export const DEFAULT_GOOGLE_CLIENT_NAME = 'google';

export type MapAuthErrorOptions = {
  oauthProvider?: 'google';
};

export function extractAuthErrorMessage(error: unknown): string | null {
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

export function shouldRetryGoogleSignInWithDefaultClientName(
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

export function shouldTryGoogleAudienceFallback(error: unknown): boolean {
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

export function toError(
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
