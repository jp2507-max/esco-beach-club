import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

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
  const [sendCodeLoading, setSendCodeLoading] = useState<boolean>(false);
  const [verifyCodeLoading, setVerifyCodeLoading] = useState<boolean>(false);
  const [signOutLoading, setSignOutLoading] = useState<boolean>(false);
  const [sendCodeError, setSendCodeError] = useState<Error | null>(null);
  const [verifyCodeError, setVerifyCodeError] = useState<Error | null>(null);
  const [signOutError, setSignOutError] = useState<Error | null>(null);

  async function sendCode({ email }: SendCodeParams): Promise<string> {
    setSendCodeLoading(true);
    setSendCodeError(null);

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
    sendCode,
    verifyCode,
    signOut,
    sendCodeLoading,
    verifyCodeLoading,
    signOutLoading,
    sendCodeError,
    verifyCodeError,
    signOutError,
  };
});
