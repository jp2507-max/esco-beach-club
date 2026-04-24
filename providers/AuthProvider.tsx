import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  sendMagicCodeFlow,
  signInWithAppleFlow,
  signInWithGoogleFlow,
  signOutFlow,
  verifyMagicCodeFlow,
} from '@/src/lib/auth/provider-auth-flows';
import {
  extractAuthErrorMessage,
  toError,
} from '@/src/lib/auth/provider-error-mapping';
import type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';
import { db } from '@/src/lib/instant';
import { captureHandledError } from '@/src/lib/monitoring';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';

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

type SignOutParams = {
  preserveSignupDraft?: boolean;
};

const NON_REPORTABLE_AUTH_ERROR_KEYS = new Set([
  'providerSignInCanceled',
  'providerSignInInProgress',
  'signupConsentRequired',
]);

function shouldCaptureAuthError(errorKey: string): boolean {
  return !NON_REPORTABLE_AUTH_ERROR_KEYS.has(errorKey);
}

type AuthOperation =
  | 'sign_in_with_apple'
  | 'sign_in_with_google'
  | 'send_magic_code'
  | 'verify_magic_code'
  | 'sign_out';

type AuthPhase =
  | 'oauth_exchange'
  | 'profile_provision'
  | 'email_send'
  | 'email_verify'
  | 'sign_out';

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

  function resolveAuthPhase(
    errorKey: string,
    operation: AuthOperation
  ): AuthPhase {
    if (
      errorKey === 'unableToCompleteProfileSetup' ||
      errorKey === 'profilePermissionDenied'
    ) {
      return 'profile_provision';
    }

    if (operation === 'send_magic_code') return 'email_send';
    if (operation === 'verify_magic_code') return 'email_verify';
    if (operation === 'sign_out') return 'sign_out';

    return 'oauth_exchange';
  }

  function reportAuthError(
    error: unknown,
    nextError: Error,
    operation: AuthOperation
  ): void {
    if (!shouldCaptureAuthError(nextError.message)) return;

    captureHandledError(error, {
      extras: {
        mappedErrorKey: nextError.message,
        rawAuthErrorMessage: extractAuthErrorMessage(error),
      },
      tags: {
        area: 'auth',
        auth_phase: resolveAuthPhase(nextError.message, operation),
        operation,
      },
    });
  }

  async function signInWithApple(params?: SignInProviderParams): Promise<void> {
    setAppleSignInLoading(true);
    setAppleSignInError(null);
    setGoogleSignInError(null);
    resetEmailErrors();

    try {
      await signInWithAppleFlow({
        onboardingData: params?.onboardingData,
        t,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignInWithApple', {
        oauthProvider: 'apple',
      });

      reportAuthError(error, nextError, 'sign_in_with_apple');

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
      await signInWithGoogleFlow({
        onboardingData: params?.onboardingData,
        t,
      });
    } catch (error: unknown) {
      if (__DEV__) {
        console.error('[AuthProvider] Google sign-in flow failed', {
          error,
        });
      }

      const nextError = toError(error, 'unableToSignInWithGoogle', {
        oauthProvider: 'google',
      });

      reportAuthError(error, nextError, 'sign_in_with_google');

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
      return await sendMagicCodeFlow({ email });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSendCode');
      reportAuthError(error, nextError, 'send_magic_code');
      setSendCodeError(nextError);
      throw nextError;
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function verifyCode({
    code,
    email,
    onboardingData,
  }: VerifyCodeParams): Promise<void> {
    setVerifyCodeLoading(true);
    setVerifyCodeError(null);
    resetProviderErrors();

    try {
      await verifyMagicCodeFlow({
        code,
        email,
        onboardingData,
        t,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToVerifyCode');

      reportAuthError(error, nextError, 'verify_magic_code');

      setVerifyCodeError(nextError);
      throw nextError;
    } finally {
      setVerifyCodeLoading(false);
    }
  }

  async function signOut(params?: SignOutParams): Promise<void> {
    setSignOutLoading(true);
    setSignOutError(null);

    try {
      await signOutFlow();
      if (params?.preserveSignupDraft !== true) {
        useSignupOnboardingDraftStore.getState().resetDraft();
      }
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignOut');
      reportAuthError(error, nextError, 'sign_out');
      setSignOutError(nextError);
      throw nextError;
    } finally {
      setSignOutLoading(false);
    }
  }

  return {
    appleSignInError,
    appleSignInLoading,
    authError,
    googleSignInError,
    googleSignInLoading,
    isAuthenticated: !!user,
    isLoading,
    sendCode,
    sendCodeError,
    sendCodeLoading,
    signInWithApple,
    signInWithGoogle,
    signOut,
    signOutError,
    signOutLoading,
    user,
    verifyCode,
    verifyCodeError,
    verifyCodeLoading,
  };
});
