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
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_REQUEST_CANCELED'
    ) {
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
    }

    throw error;
  }
}
