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
      captureHandledError(error, {
        extras: {
          mappedErrorKey: nextError.message,
          rawAuthErrorMessage: extractAuthErrorMessage(error),
        },
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
      return await sendMagicCodeFlow({ email });
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
      await signOutFlow();
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
