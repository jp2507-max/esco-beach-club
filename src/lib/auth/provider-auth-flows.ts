import type { TFunction } from 'i18next';

import { setProfileAuthProvider } from '@/lib/api';
import { type AuthProviderType, authProviderTypes } from '@/lib/types';
import {
  getIdTokenAudienceClaim,
  getIdTokenNonceClaim,
  resolveDisplayNameForCreate,
} from '@/src/lib/auth/id-token';
import {
  DEFAULT_GOOGLE_CLIENT_NAME,
  extractAuthErrorMessage,
  shouldRetryGoogleSignInWithDefaultClientName,
  shouldRetryOauthClientSignInWithAlternateClientName,
  shouldTryGoogleAudienceFallback,
} from '@/src/lib/auth/provider-error-mapping';
import {
  extractSignInUser,
  hasRequiredSignupConsent,
  normalizeSignupOnboardingData,
  type SignupOnboardingData,
} from '@/src/lib/auth/signup-onboarding';
import {
  canTryGoogleAudienceFallback,
  getAppleIdToken,
  getGoogleIdToken,
  getGoogleIdTokenWithOptions,
} from '@/src/lib/auth/social-auth';
import { db } from '@/src/lib/instant';
import { captureHandledError } from '@/src/lib/monitoring';

const DEFAULT_APPLE_CLIENT_NAME = 'apple';
const isDevEnvironment = typeof __DEV__ !== 'undefined' && __DEV__;

function resolveOnboardingData(params: {
  onboardingData: SignupOnboardingData | undefined;
}): SignupOnboardingData | null {
  const normalizedOnboardingData = normalizeSignupOnboardingData(
    params.onboardingData
  );

  if (
    params.onboardingData !== undefined &&
    !hasRequiredSignupConsent(normalizedOnboardingData)
  ) {
    throw new Error('signupConsentRequired');
  }

  return normalizedOnboardingData;
}

function buildCreateFields(params: {
  email?: string;
  idToken?: string;
  onboardingData: SignupOnboardingData | null;
  t: TFunction;
}): {
  display_name: string;
} {
  return {
    display_name:
      resolveDisplayNameForCreate({
        ...(params.email ? { email: params.email } : {}),
        ...(params.idToken ? { idToken: params.idToken } : {}),
        onboardingDisplayName: params.onboardingData?.displayName,
      }) ?? params.t('member'),
  };
}

async function persistProfileAuthProvider(params: {
  providerType: AuthProviderType;
  signInResult: unknown;
}): Promise<void> {
  const signInUser = extractSignInUser(params.signInResult);
  if (!signInUser.id) return;

  try {
    await setProfileAuthProvider(signInUser.id, params.providerType);
  } catch (error: unknown) {
    captureHandledError(error, {
      tags: {
        area: 'auth',
        operation: 'persist_profile_auth_provider',
        provider: params.providerType,
      },
      extras: {
        signInUserId: signInUser.id,
      },
    });

    if (isDevEnvironment) {
      console.error('[AuthProvider] Failed to persist profile auth provider', {
        error,
        providerType: params.providerType,
        signInUserId: signInUser.id,
      });
    }
  }
}

async function finalizeSignIn(params: {
  onboardingData: SignupOnboardingData | null;
  providerType: AuthProviderType;
  signInResult: unknown;
}): Promise<void> {
  const signInUser = extractSignInUser(params.signInResult);

  if (!signInUser.id) {
    captureHandledError(new Error('missingSignInUserId'), {
      tags: {
        area: 'auth',
        auth_phase: 'profile_provision',
        operation: 'ensure_profile_after_sign_in',
        provider: params.providerType,
      },
      extras: {
        hasOnboardingData: params.onboardingData !== null,
        signInCreatedUser: signInUser.created,
      },
    });

    throw new Error('unableToCompleteProfileSetup');
  }

  await persistProfileAuthProvider({
    providerType: params.providerType,
    signInResult: params.signInResult,
  });
}

export async function signInWithAppleFlow(params: {
  onboardingData?: SignupOnboardingData;
  t: TFunction;
}): Promise<void> {
  const onboardingData = resolveOnboardingData({
    onboardingData: params.onboardingData,
  });
  const { clientName, idToken, nonce } = await getAppleIdToken();
  const createFields = buildCreateFields({
    idToken,
    onboardingData,
    t: params.t,
  });
  const appleTokenAudience = getIdTokenAudienceClaim(idToken);
  const clientNameCandidates = Array.from(
    new Set(
      [clientName, appleTokenAudience, DEFAULT_APPLE_CLIENT_NAME]
        .map((value) => value?.trim())
        .filter((value): value is string => !!value)
    )
  );

  let signInResult: unknown = null;
  let signInError: unknown = null;

  for (const [index, currentClientName] of clientNameCandidates.entries()) {
    try {
      signInResult = await db.auth.signInWithIdToken({
        clientName: currentClientName,
        idToken,
        nonce,
        extraFields: createFields,
      });
      signInError = null;
      break;
    } catch (error: unknown) {
      signInError = error;
      const nextClientName = clientNameCandidates[index + 1];

      if (
        !nextClientName ||
        !shouldRetryOauthClientSignInWithAlternateClientName(
          error,
          currentClientName,
          nextClientName
        )
      ) {
        break;
      }

      if (isDevEnvironment) {
        console.error(
          '[AuthProvider] Retrying Apple sign-in with alternate client name',
          {
            currentClientName,
            error,
            extractedMessage: extractAuthErrorMessage(error),
            nextClientName,
            tokenAudClaim: appleTokenAudience,
          }
        );
      }
    }
  }

  if (signInError) {
    throw signInError;
  }

  await finalizeSignIn({
    onboardingData,
    providerType: authProviderTypes.apple,
    signInResult,
  });
}

export async function signInWithGoogleFlow(params: {
  onboardingData?: SignupOnboardingData;
  t: TFunction;
}): Promise<void> {
  const onboardingData = resolveOnboardingData({
    onboardingData: params.onboardingData,
  });
  const primaryToken = await getGoogleIdToken();
  const primaryTokenNonce = getIdTokenNonceClaim(primaryToken.idToken);
  const primaryCreateFields = buildCreateFields({
    idToken: primaryToken.idToken,
    onboardingData,
    t: params.t,
  });
  let signInResult: unknown = null;

  try {
    signInResult = await db.auth.signInWithIdToken({
      clientName: primaryToken.clientName,
      idToken: primaryToken.idToken,
      ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
      extraFields: primaryCreateFields,
    });
  } catch (error: unknown) {
    if (isDevEnvironment) {
      console.error('[AuthProvider] Instant Google idToken sign-in failed', {
        audience: primaryToken.audience,
        clientName: primaryToken.clientName,
        error,
        extractedMessage: extractAuthErrorMessage(error),
        tokenAudClaim: getIdTokenAudienceClaim(primaryToken.idToken),
        tokenNonceClaim: primaryTokenNonce,
      });
    }

    if (
      shouldRetryGoogleSignInWithDefaultClientName(
        error,
        primaryToken.clientName
      )
    ) {
      signInResult = await db.auth.signInWithIdToken({
        clientName: DEFAULT_GOOGLE_CLIENT_NAME,
        idToken: primaryToken.idToken,
        ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
        extraFields: primaryCreateFields,
      });
    } else if (
      shouldTryGoogleAudienceFallback(error) &&
      canTryGoogleAudienceFallback()
    ) {
      const fallbackAudience = primaryToken.audience === 'ios' ? 'web' : 'ios';
      const fallbackToken = await getGoogleIdTokenWithOptions({
        audience: fallbackAudience,
        forceReconfigure: true,
      });
      const fallbackTokenNonce = getIdTokenNonceClaim(fallbackToken.idToken);
      const fallbackCreateFields = buildCreateFields({
        idToken: fallbackToken.idToken,
        onboardingData,
        t: params.t,
      });

      if (isDevEnvironment) {
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

      signInResult = await db.auth.signInWithIdToken({
        clientName: fallbackToken.clientName,
        idToken: fallbackToken.idToken,
        ...(fallbackTokenNonce ? { nonce: fallbackTokenNonce } : {}),
        extraFields: fallbackCreateFields,
      });
    } else {
      throw error;
    }
  }

  await finalizeSignIn({
    onboardingData,
    providerType: authProviderTypes.google,
    signInResult,
  });
}

export async function sendMagicCodeFlow(params: {
  email: string;
}): Promise<string> {
  const trimmedEmail = params.email.trim();

  if (!trimmedEmail) {
    throw new Error('emailRequired');
  }

  await db.auth.sendMagicCode({ email: trimmedEmail });
  return trimmedEmail;
}

export async function verifyMagicCodeFlow(params: {
  code: string;
  email: string;
  onboardingData?: SignupOnboardingData;
  t: TFunction;
}): Promise<void> {
  const trimmedEmail = params.email.trim();
  const trimmedCode = params.code.trim();

  if (!trimmedEmail || !trimmedCode) {
    throw new Error('emailAndCodeRequired');
  }

  const onboardingData = resolveOnboardingData({
    onboardingData: params.onboardingData,
  });
  const createFields = buildCreateFields({
    email: trimmedEmail,
    onboardingData,
    t: params.t,
  });
  const signInResult: unknown = await db.auth.signInWithMagicCode({
    code: trimmedCode,
    email: trimmedEmail,
    extraFields: createFields,
  });

  await finalizeSignIn({
    onboardingData,
    providerType: authProviderTypes.magicCode,
    signInResult,
  });
}

export async function signOutFlow(): Promise<void> {
  await db.auth.signOut();
}
