import { isAuthErrorKey } from '@/src/lib/auth-errors';

export const DEFAULT_GOOGLE_CLIENT_NAME = 'google';

export type MapAuthErrorOptions = {
  oauthProvider?: 'apple' | 'google';
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

/** Matches "record not found" with optional trailing colon (Instant / OAuth errors). */
const RECORD_NOT_FOUND_PATTERN = /\brecord not found:?\b/;

/** Matches oauth-client, oauth_client, "oauth client", etc. */
const OAUTH_CLIENT_PATTERN = /\boauth[-_\s]?client\b/;

const GOOGLE_AUDIENCE_MISMATCH_MARKERS = [
  'claim aud',
  'invalid aud',
  'jwt aud',
  'wrong audience',
  'id token',
  'id_token',
  'token verification',
  'nonce parameter was not provided',
  'nonces mismatch',
] as const;

function mapAuthErrorMessageToKey(
  message: string,
  options?: MapAuthErrorOptions
): string | null {
  const normalizedMessage = message.trim().toLowerCase();

  const isOauthClientNotFound =
    RECORD_NOT_FOUND_PATTERN.test(normalizedMessage) &&
    OAUTH_CLIENT_PATTERN.test(normalizedMessage);

  const isGoogleAudienceMismatch = GOOGLE_AUDIENCE_MISMATCH_MARKERS.some(
    (marker) => normalizedMessage.includes(marker)
  );

  if (!isOauthClientNotFound && !isGoogleAudienceMismatch) {
    return null;
  }

  if (isOauthClientNotFound && options?.oauthProvider === 'apple') {
    return 'appleOauthClientNotConfigured';
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
  const normalizedClientName = clientName.trim().toLowerCase();
  if (
    !normalizedClientName ||
    normalizedClientName === DEFAULT_GOOGLE_CLIENT_NAME
  ) {
    return false;
  }

  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  return (
    RECORD_NOT_FOUND_PATTERN.test(message) &&
    (OAUTH_CLIENT_PATTERN.test(message) ||
      message.includes(normalizedClientName))
  );
}

export function shouldRetryOauthClientSignInWithAlternateClientName(
  error: unknown,
  currentClientName: string,
  nextClientName: string
): boolean {
  const normalizedCurrentClientName = currentClientName.trim().toLowerCase();
  const normalizedNextClientName = nextClientName.trim().toLowerCase();

  if (
    !normalizedCurrentClientName ||
    !normalizedNextClientName ||
    normalizedCurrentClientName === normalizedNextClientName
  ) {
    return false;
  }

  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  return (
    RECORD_NOT_FOUND_PATTERN.test(message) &&
    (OAUTH_CLIENT_PATTERN.test(message) ||
      message.includes(normalizedCurrentClientName))
  );
}

export function shouldTryGoogleAudienceFallback(error: unknown): boolean {
  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  return GOOGLE_AUDIENCE_MISMATCH_MARKERS.some((marker) =>
    message.includes(marker)
  );
}

export function toError(
  error: unknown,
  fallbackMessage: string,
  mapOptions?: MapAuthErrorOptions
): Error {
  const message = extractAuthErrorMessage(error);

  if (message) {
    const mappedKey = mapAuthErrorMessageToKey(message, mapOptions);
    if (mappedKey && isAuthErrorKey(mappedKey)) {
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
