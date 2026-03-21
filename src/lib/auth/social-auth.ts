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
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const googleIosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

let hasConfiguredGoogleSignIn = false;

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
  if (!googleWebClientId) return false;

  if (Platform.OS === 'ios') {
    return !!googleIosUrlScheme;
  }

  return true;
}

export function configureGoogleSignIn(): void {
  if (hasConfiguredGoogleSignIn || !hasGoogleSignInPlatformConfig()) {
    return;
  }

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
  });

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
}> {
  if (!hasGoogleSignInPlatformConfig()) {
    throw new Error('googleAuthNotConfigured');
  }

  configureGoogleSignIn();

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
      clientName: googleClientName,
      idToken,
    };
  } catch (error: unknown) {
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
