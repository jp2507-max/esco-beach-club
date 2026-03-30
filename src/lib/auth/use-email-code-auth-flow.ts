import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';

import { isAuthErrorKey } from '@/src/lib/auth-errors';
import {
  emailAuthSchema,
  type EmailFormValues,
  type VerifyCodeFormValues,
  verifyCodeSchema,
} from '@/src/lib/forms/schemas';

export type { EmailFormValues };

export type UseEmailCodeAuthFlowParams = {
  sendCode: (params: { email: string }) => Promise<string>;
  verifyCode: (params: { code: string; email: string }) => Promise<void>;
  sendCodeLoading: boolean;
  sendCodeError: Error | null;
  verifyCodeLoading: boolean;
  verifyCodeError: Error | null;
  t: TFunction<'auth'>;
};

export type UseEmailCodeAuthFlowReturn = {
  sentEmail: string;
  isCodeStep: boolean;
  primaryLoading: boolean;
  visibleError: Error | null;
  control: ReturnType<typeof useForm<EmailFormValues>>['control'];
  codeControl: ReturnType<typeof useForm<VerifyCodeFormValues>>['control'];
  onEmailSubmit: () => void;
  onCodeSubmit: () => void;
  handleUseDifferentEmail: () => void;
};

export function useEmailCodeAuthFlow(
  params: UseEmailCodeAuthFlowParams
): UseEmailCodeAuthFlowReturn {
  const {
    sendCode,
    verifyCode,
    sendCodeLoading,
    sendCodeError,
    verifyCodeLoading,
    verifyCodeError,
    t,
  } = params;

  const [sentEmail, setSentEmail] = useState<string>('');
  const [hasAttemptedCodeVerification, setHasAttemptedCodeVerification] =
    useState(false);

  const { control, handleSubmit } = useForm<EmailFormValues>({
    defaultValues: { email: '' },
    mode: 'onBlur',
    resolver: zodResolver(emailAuthSchema),
  });

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    reset: resetCodeForm,
  } = useForm<VerifyCodeFormValues>({
    defaultValues: { code: '' },
    mode: 'onBlur',
    resolver: zodResolver(verifyCodeSchema),
  });

  async function handleSendCode(values: EmailFormValues): Promise<void> {
    try {
      const email = await sendCode({ email: values.email });
      setSentEmail(email);
      setHasAttemptedCodeVerification(false);
      resetCodeForm({ code: '' });
    } catch (error: unknown) {
      const raw =
        error instanceof Error && error.message
          ? error.message
          : 'unableToSendCode';

      if (!isAuthErrorKey(raw)) {
        console.error('[AuthError] Unrecognized sendCode error:', raw);
      }

      const message = isAuthErrorKey(raw) ? t(raw) : t('genericError');
      Alert.alert(t('codeNotSentTitle'), message);
    }
  }

  async function handleVerifyCode(values: VerifyCodeFormValues): Promise<void> {
    setHasAttemptedCodeVerification(true);
    try {
      await verifyCode({
        code: values.code,
        email: sentEmail,
      });
    } catch (error: unknown) {
      const raw =
        error instanceof Error && error.message
          ? error.message
          : 'unableToVerifyCode';

      if (!isAuthErrorKey(raw)) {
        console.error('[AuthError] Unrecognized verifyCode error:', raw);
      }

      const message = isAuthErrorKey(raw) ? t(raw) : t('genericError');
      Alert.alert(t('verificationFailedTitle'), message);
    }
  }

  function handleInvalidEmailSubmit(): void {
    Alert.alert(t('invalidEmailTitle'), t('invalidEmailMessage'));
  }

  function handleInvalidCodeSubmit(): void {
    Alert.alert(t('missingCodeTitle'), t('missingCodeMessage'));
  }

  function handleUseDifferentEmail(): void {
    setSentEmail('');
    setHasAttemptedCodeVerification(false);
    resetCodeForm({ code: '' });
  }

  const isCodeStep = !!sentEmail;
  const primaryLoading = isCodeStep ? verifyCodeLoading : sendCodeLoading;
  const visibleError =
    isCodeStep && hasAttemptedCodeVerification
      ? verifyCodeError
      : sendCodeError;

  const onEmailSubmit = handleSubmit(handleSendCode, handleInvalidEmailSubmit);
  const onCodeSubmit = handleCodeSubmit(
    handleVerifyCode,
    handleInvalidCodeSubmit
  );

  return {
    sentEmail,
    isCodeStep,
    primaryLoading,
    visibleError,
    control,
    codeControl,
    onEmailSubmit,
    onCodeSubmit,
    handleUseDifferentEmail,
  };
}
