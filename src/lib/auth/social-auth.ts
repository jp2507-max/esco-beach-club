import 'react-native-get-random-values';

import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
const DEFAULT_APPLE_CLIENT_NAME = 'apple';
const DEFAULT_GOOGLE_CLIENT_NAME = 'google';

const appleClientName =
  process.env.EXPO_PUBLIC_INSTANT_APPLE_CLIENT_NAME?.trim() ||
  DEFAULT_APPLE_CLIENT_NAME;
const googleClientName =
  process.env.EXPO_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME?.trim() ||
  DEFAULT_GOOGLE_CLIENT_NAME;
const googleIosInstantClientName =
  process.env.EXPO_PUBLIC_INSTANT_GOOGLE_IOS_CLIENT_NAME?.trim();
const googleWebInstantClientName =
  process.env.EXPO_PUBLIC_INSTANT_GOOGLE_WEB_CLIENT_NAME?.trim();
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const googleIosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

let hasConfiguredGoogleSignIn = false;

export const googlePostDeleteCleanupStatuses = {
  failedNonBlocking: 'failed_non_blocking',
  revoked: 'revoked',
  skippedNoSession: 'skipped_no_session',
} as const;

export type GooglePostDeleteCleanupStatus =
  (typeof googlePostDeleteCleanupStatuses)[keyof typeof googlePostDeleteCleanupStatuses];

export type GooglePostDeleteCleanupResult =
  | {
      status: typeof googlePostDeleteCleanupStatuses.revoked;
    }
  | {
      status: typeof googlePostDeleteCleanupStatuses.skippedNoSession;
    }
  | {
      error: unknown;
      message: string;
      status: typeof googlePostDeleteCleanupStatuses.failedNonBlocking;
    };

export type GoogleSignInAudience = 'ios' | 'web';

type ConfigureGoogleSignInOptions = {
  forceReconfigure?: boolean;
};

type GetGoogleIdTokenOptions = {
  audience?: GoogleSignInAudience;
  forceReconfigure?: boolean;
};

export function resetGoogleSignIn(): void {
  if (!hasConfiguredGoogleSignIn) return;

  GoogleSignin.signOut().catch(() => {
    // ignore reset errors
  });
  hasConfiguredGoogleSignIn = false;
}

type CryptoLike = {
  getRandomValues: (target: Uint8Array) => Uint8Array;
};

function getSecureRandomValues(array: Uint8Array): Uint8Array {
  const cryptoApi = (globalThis as { crypto?: CryptoLike }).crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error('appleAuthUnavailable');
  }

  return cryptoApi.getRandomValues(array);
}

function createNonce(): string {
  const bytes = getSecureRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

function getNativeErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code.trim().toUpperCase();
  }

  return null;
}

function getNativeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim().toLowerCase();
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message.trim().toLowerCase();
  }

  return '';
}

function isAppleSignInCanceledError(error: unknown): boolean {
  const code = getNativeErrorCode(error);
  const normalizedMessage = getNativeErrorMessage(error);
  const isUnknownReasonMessage = normalizedMessage.includes(
    'authorization attempt failed for an unknown reason'
  );

  if (code === 'ERR_REQUEST_CANCELED') {
    return true;
  }

  if (code === 'ERR_REQUEST_UNKNOWN' && isUnknownReasonMessage) {
    return true;
  }

  return false;
}

function hasGoogleSignInPlatformConfig(): boolean {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'ios') {
    const hasAudienceClientId = !!googleIosClientId || !!googleWebClientId;
    return !!googleIosUrlScheme && hasAudienceClientId;
  }

  return !!googleWebClientId;
}

function getDefaultGoogleAudience(): GoogleSignInAudience {
  if (Platform.OS === 'ios' && googleIosClientId) {
    return 'ios';
  }

  return 'web';
}

function canConfigureGoogleAudience(audience: GoogleSignInAudience): boolean {
  if (audience === 'ios') {
    return Platform.OS === 'ios' && !!googleIosClientId;
  }

  return !!googleWebClientId;
}

function getGoogleInstantClientName(audience: GoogleSignInAudience): string {
  if (audience === 'ios') {
    return googleIosInstantClientName || googleClientName;
  }

  return googleWebInstantClientName || googleClientName;
}

function maskClientId(clientId?: string): string {
  if (!clientId) return 'missing';
  if (clientId.length <= 12) return clientId;

  return `${clientId.slice(0, 8)}...${clientId.slice(-4)}`;
}

function logGoogleAndroidDeveloperConfigMismatch(params: {
  audience: GoogleSignInAudience;
  error: unknown;
  normalizedErrorMessage: string | null;
}): void {
  if (!__DEV__) return;

  console.error('[GoogleSignIn] Android developer configuration mismatch', {
    audience: params.audience,
    error: params.error,
    googleWebClientId: maskClientId(googleWebClientId),
    hasGoogleWebClientId: !!googleWebClientId,
    instantGoogleClientName: getGoogleInstantClientName(params.audience),
    normalizedErrorMessage: params.normalizedErrorMessage,
    troubleshooting: [
      'Verify the Android OAuth client package name matches com.escobeachclub.app.',
      'Add SHA-1 and SHA-256 fingerprints for the exact EAS signing key used by this build.',
      'Keep EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID set to the Web OAuth client ID.',
    ],
  });
}

export function canTryGoogleAudienceFallback(): boolean {
  return Platform.OS === 'ios' && !!googleIosClientId && !!googleWebClientId;
}

export function configureGoogleSignIn(
  audience: GoogleSignInAudience = getDefaultGoogleAudience(),
  options?: ConfigureGoogleSignInOptions
): void {
  if (options?.forceReconfigure) {
    resetGoogleSignIn();
  }

  if (
    hasConfiguredGoogleSignIn ||
    !hasGoogleSignInPlatformConfig() ||
    !canConfigureGoogleAudience(audience)
  ) {
    return;
  }

  if (Platform.OS === 'ios') {
    if (audience === 'ios' && googleIosClientId) {
      GoogleSignin.configure({
        iosClientId: googleIosClientId,
      });
    } else if (googleWebClientId) {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
      });
    }
  } else {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
    });
  }

  hasConfiguredGoogleSignIn = true;
}

function hasGoogleSessionForCleanup(): boolean {
  const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
  if (hasPreviousSignIn) return true;

  return GoogleSignin.getCurrentUser() !== null;
}

function getGoogleCleanupFailureMessage(error: unknown): string {
  if (isErrorWithCode(error)) {
    return `${error.code}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'unknown_error';
}

export async function cleanupGoogleSessionAfterDeletion(): Promise<GooglePostDeleteCleanupResult> {
  if (!isGoogleSignInAvailable()) {
    return {
      status: googlePostDeleteCleanupStatuses.skippedNoSession,
    };
  }

  configureGoogleSignIn();

  if (!hasGoogleSessionForCleanup()) {
    return {
      status: googlePostDeleteCleanupStatuses.skippedNoSession,
    };
  }

  try {
    await GoogleSignin.revokeAccess();

    return {
      status: googlePostDeleteCleanupStatuses.revoked,
    };
  } catch (error) {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Non-blocking cleanup best effort
    }

    return {
      error,
      message: getGoogleCleanupFailureMessage(error),
      status: googlePostDeleteCleanupStatuses.failedNonBlocking,
    };
  }
}

export function isGoogleSignInAvailable(): boolean {
  return hasGoogleSignInPlatformConfig();
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  return AppleAuthentication.isAvailableAsync();
}

export async function getAppleIdToken(): Promise<{
  clientName: string;
  idToken: string;
  nonce: string;
}> {
  if (Platform.OS !== 'ios') {
    throw new Error('appleAuthUnavailable');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('appleAuthUnavailable');
  }

  const nonce = createNonce();

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });
    const idToken = credential.identityToken?.trim();

    if (!idToken) {
      throw new Error('appleIdTokenMissing');
    }

    return {
      clientName: appleClientName,
      idToken,
      nonce,
    };
  } catch (error: unknown) {
    if (isAppleSignInCanceledError(error)) {
      throw new Error('providerSignInCanceled');
    }

    throw error;
  }
}

export async function getAppleAuthorizationCode(): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new Error('appleAuthUnavailable');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('appleAuthUnavailable');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [],
    });
    const authorizationCode = credential.authorizationCode?.trim();

    if (!authorizationCode) {
      throw new Error('appleAuthorizationCodeMissing');
    }

    return authorizationCode;
  } catch (error: unknown) {
    if (isAppleSignInCanceledError(error)) {
      throw new Error('providerSignInCanceled');
    }

    throw error;
  }
}

export async function getGoogleIdToken(): Promise<{
  clientName: string;
  idToken: string;
  audience: GoogleSignInAudience;
}> {
  const audience = getDefaultGoogleAudience();

  return getGoogleIdTokenWithOptions({ audience });
}

export async function getGoogleIdTokenWithOptions(
  options: GetGoogleIdTokenOptions
): Promise<{
  clientName: string;
  idToken: string;
  audience: GoogleSignInAudience;
}> {
  const audience = options.audience ?? getDefaultGoogleAudience();

  if (!hasGoogleSignInPlatformConfig()) {
    throw new Error('googleAuthNotConfigured');
  }

  if (!canConfigureGoogleAudience(audience)) {
    throw new Error('googleAuthNotConfigured');
  }

  configureGoogleSignIn(audience, {
    forceReconfigure: options.forceReconfigure,
  });

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken?.trim();

    if (!idToken) {
      throw new Error('googleIdTokenMissing');
    }

    return {
      clientName: getGoogleInstantClientName(audience),
      idToken,
      audience,
    };
  } catch (error: unknown) {
    const normalizedErrorMessage =
      error instanceof Error ? error.message.trim().toLowerCase() : null;

    if (Platform.OS === 'ios' && normalizedErrorMessage) {
      const isMissingIosUrlScheme =
        normalizedErrorMessage.includes(
          'missing support for the following url schemes'
        ) ||
        normalizedErrorMessage.includes(
          'your app is missing support for the following url schemes'
        );

      const isMissingGoogleClientConfig =
        normalizedErrorMessage.includes('no active configuration') &&
        normalizedErrorMessage.includes('google');

      if (isMissingIosUrlScheme || isMissingGoogleClientConfig) {
        throw new Error('googleAuthNotConfigured');
      }
    }

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('providerSignInCanceled');
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('providerSignInInProgress');
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('googlePlayServicesUnavailable');
      }

      const errorCode = `${error.code}`.trim().toUpperCase();

      if (errorCode === 'DEVELOPER_ERROR' || errorCode === '10') {
        logGoogleAndroidDeveloperConfigMismatch({
          audience,
          error,
          normalizedErrorMessage,
        });
        throw new Error('googleAndroidAuthNotConfigured');
      }
    }

    if (
      Platform.OS === 'android' &&
      normalizedErrorMessage &&
      (normalizedErrorMessage.includes('developer_error') ||
        normalizedErrorMessage.includes('code: 10') ||
        normalizedErrorMessage.includes(
          'developer console is not set up correctly'
        ))
    ) {
      logGoogleAndroidDeveloperConfigMismatch({
        audience,
        error,
        normalizedErrorMessage,
      });
      throw new Error('googleAndroidAuthNotConfigured');
    }

    throw error;
  }
}
