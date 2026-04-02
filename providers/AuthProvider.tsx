import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  shouldTryGoogleAudienceFallback,
  toError,
} from '@/src/lib/auth/provider-error-mapping';
import {
  applyOnboardingProfileDataForNewUser,
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

type SendCodeParams = {
  email: string;
};

type VerifyCodeParams = {
  code: string;
  email: string;
  onboardingData?: SignupOnboardingData;
};

export type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';

type SignInProviderParams = {
  onboardingData?: SignupOnboardingData;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const { t } = useTranslation(['auth', 'common']);
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

  async function setProfileAuthProviderSafely(params: {
    userId: string;
    providerType: AuthProviderType;
  }): Promise<void> {
    try {
      await setProfileAuthProvider(params.userId, params.providerType);
    } catch (profileError: unknown) {
      captureHandledError(toError(profileError, 'unableToSetProfileAuthProvider'), {
        tags: {
          area: 'auth',
          operation: 'set_profile_auth_provider',
          provider: params.providerType,
        },
      });
    }
  }

  async function signInWithApple(params?: SignInProviderParams): Promise<void> {
    setAppleSignInLoading(true);
    setAppleSignInError(null);
    setGoogleSignInError(null);
    resetEmailErrors();

    try {
      const { clientName, idToken, nonce } = await getAppleIdToken();
      const hasSignupOnboardingPayload = params?.onboardingData !== undefined;

      const onboardingData = normalizeSignupOnboardingData(
        params?.onboardingData
      );
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const displayNameForCreate =
        resolveDisplayNameForCreate({
          idToken,
          onboardingDisplayName: onboardingData?.displayName,
        }) ?? t('auth:member', { defaultValue: 'Member' });
      const createFields = {
        display_name: displayNameForCreate,
      };

      const signInResult: unknown = await db.auth.signInWithIdToken({
        clientName,
        idToken,
        nonce,
        ...(createFields ? { extraFields: createFields } : {}),
      });

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });

      const signInUser = extractSignInUser(signInResult);
      if (signInUser.id) {
        await setProfileAuthProviderSafely({
          userId: signInUser.id,
          providerType: authProviderTypes.apple,
        });
      }
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignInWithApple');
      captureHandledError(nextError, {
        tags: { area: 'auth', operation: 'sign_in_with_apple' },
      });
      setAppleSignInError(nextError);
      throw nextError;
    } finally {
      setAppleSignInLoading(false);
    }
  }

  async function signInWithGoogle(
    params?: SignInProviderParams
  ): Promise<void> {
    setGoogleSignInLoading(true);
    setGoogleSignInError(null);
    setAppleSignInError(null);
    resetEmailErrors();

    try {
      const hasSignupOnboardingPayload = params?.onboardingData !== undefined;
      const onboardingData = normalizeSignupOnboardingData(
        params?.onboardingData
      );
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const primaryToken = await getGoogleIdToken();
      const { clientName, idToken } = primaryToken;
      const primaryTokenNonce = getIdTokenNonceClaim(idToken);
      const primaryDisplayNameForCreate =
        resolveDisplayNameForCreate({
          idToken,
          onboardingDisplayName: onboardingData?.displayName,
        }) ?? t('auth:member', { defaultValue: 'Member' });
      const primaryCreateFields = {
        display_name: primaryDisplayNameForCreate,
      };
      let signInResult: unknown = null;

      try {
        signInResult = await db.auth.signInWithIdToken({
          clientName,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
          ...(primaryCreateFields ? { extraFields: primaryCreateFields } : {}),
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
            const fallbackDisplayNameForCreate =
              resolveDisplayNameForCreate({
                idToken: fallbackToken.idToken,
                onboardingDisplayName: onboardingData?.displayName,
              }) ?? t('auth:member', { defaultValue: 'Member' });
            const fallbackCreateFields = {
              display_name: fallbackDisplayNameForCreate,
            };

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

            signInResult = await db.auth.signInWithIdToken({
              clientName: fallbackToken.clientName,
              idToken: fallbackToken.idToken,
              ...(fallbackTokenNonce ? { nonce: fallbackTokenNonce } : {}),
              ...(fallbackCreateFields
                ? { extraFields: fallbackCreateFields }
                : {}),
            });

            await applyOnboardingProfileDataForNewUser({
              onboardingData,
              signInResult,
            });

            const fallbackSignInUser = extractSignInUser(signInResult);
            if (fallbackSignInUser.id) {
              await setProfileAuthProviderSafely({
                userId: fallbackSignInUser.id,
                providerType: authProviderTypes.google,
              });
            }

            return;
          }

          throw error;
        }

        signInResult = await db.auth.signInWithIdToken({
          clientName: DEFAULT_GOOGLE_CLIENT_NAME,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
          ...(primaryCreateFields ? { extraFields: primaryCreateFields } : {}),
        });
      }

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });

      const signInUser = extractSignInUser(signInResult);
      if (signInUser.id) {
        await setProfileAuthProviderSafely({
          userId: signInUser.id,
          providerType: authProviderTypes.google,
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
      captureHandledError(nextError, {
        tags: { area: 'auth', operation: 'sign_in_with_google' },
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
      captureHandledError(nextError, {
        tags: { area: 'auth', operation: 'send_magic_code' },
      });
      setSendCodeError(nextError);
      throw nextError;
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function verifyCode({
    code,
    email,
    onboardingData: rawOnboardingData,
  }: VerifyCodeParams): Promise<void> {
    setVerifyCodeLoading(true);
    setVerifyCodeError(null);
    resetProviderErrors();

    try {
      const trimmedEmail = email.trim();
      const trimmedCode = code.trim();

      if (!trimmedEmail || !trimmedCode) {
        throw new Error('emailAndCodeRequired');
      }

      const hasSignupOnboardingPayload = rawOnboardingData !== undefined;
      const onboardingData = normalizeSignupOnboardingData(rawOnboardingData);
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const displayNameForCreate =
        resolveDisplayNameForCreate({
          email: trimmedEmail,
          onboardingDisplayName: onboardingData?.displayName,
        }) ?? t('auth:member', { defaultValue: 'Member' });
      const createFields = {
        display_name: displayNameForCreate,
      };
      const signInResult: unknown = await db.auth.signInWithMagicCode({
        code: trimmedCode,
        email: trimmedEmail,
        ...(createFields ? { extraFields: createFields } : {}),
      });

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });

      const signInUser = extractSignInUser(signInResult);
      if (signInUser.id) {
        await setProfileAuthProviderSafely({
          userId: signInUser.id,
          providerType: authProviderTypes.magicCode,
        });
      }
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToVerifyCode');
      captureHandledError(nextError, {
        tags: { area: 'auth', operation: 'verify_magic_code' },
      });
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
      captureHandledError(nextError, {
        tags: { area: 'auth', operation: 'sign_out' },
      });
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
