import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

import { getAppleIdToken, getGoogleIdToken } from '@/src/lib/auth/social-auth';
import { db } from '@/src/lib/instant';

type SendCodeParams = {
  email: string;
};

type VerifyCodeParams = {
  code: string;
  email: string;
};

function toError(error: unknown, fallbackMessage: string): Error {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object' &&
    'message' in error.body &&
    typeof error.body.message === 'string'
  ) {
    return new Error(error.body.message);
  }

  if (error instanceof Error && error.message) {
    return error;
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
      const { clientName, idToken } = await getGoogleIdToken();

      await db.auth.signInWithIdToken({
        clientName,
        idToken,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignInWithGoogle');
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
