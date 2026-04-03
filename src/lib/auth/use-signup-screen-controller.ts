import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { type SignupOnboardingData, useAuth } from '@/providers/AuthProvider';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import {
  type SignupFormValues,
  signupSchema,
  type VerifyCodeFormValues,
  verifyCodeSchema,
} from '@/src/lib/forms/schemas';
import { parseOnboardingMemberSegmentSearchParam } from '@/src/lib/utils/member-segment';
import {
  parseBooleanSearchParam,
  parseOnboardingPermissionStatusSearchParam,
  readTrimmedSearchParam,
} from '@/src/lib/utils/search-params';

type OnboardingIdentityParams = {
  hasAcceptedPrivacyPolicy: boolean;
  hasAcceptedTerms: boolean;
  hasCompletedSetup: boolean;
  locationPermissionStatus:
    | ReturnType<typeof parseOnboardingPermissionStatusSearchParam>
    | undefined;
  memberSegment: ReturnType<typeof parseOnboardingMemberSegmentSearchParam>;
  pushNotificationPermissionStatus:
    | ReturnType<typeof parseOnboardingPermissionStatusSearchParam>
    | undefined;
};

export type SignupScreenController = ReturnType<
  typeof useSignupScreenController
>;

export function useSignupScreenController() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    onboardingCompletedSetup?: string;
    onboardingDateOfBirth?: string;
    onboardingDisplayName?: string;
    onboardingLocationPermissionStatus?: string;
    onboardingPrivacyAccepted?: string;
    onboardingPushPermissionStatus?: string;
    onboardingSegment?: string;
    onboardingTermsAccepted?: string;
  }>();
  const { t } = useTranslation('auth');
  const {
    appleSignInError,
    appleSignInLoading,
    googleSignInError,
    googleSignInLoading,
    sendCode,
    sendCodeError,
    sendCodeLoading,
    signInWithApple,
    signInWithGoogle,
    verifyCode,
    verifyCodeError,
    verifyCodeLoading,
  } = useAuth();
  const [sentEmail, setSentEmail] = React.useState<string>('');
  const [hasAttemptedCodeVerification, setHasAttemptedCodeVerification] =
    React.useState<boolean>(false);
  const [onboardingData, setOnboardingData] =
    React.useState<SignupOnboardingData | null>(null);

  const onboardingIdentityParams =
    React.useMemo<OnboardingIdentityParams>(() => {
      const memberSegment = parseOnboardingMemberSegmentSearchParam(
        searchParams.onboardingSegment
      );

      return {
        hasAcceptedPrivacyPolicy:
          parseBooleanSearchParam(searchParams.onboardingPrivacyAccepted) ===
          true,
        hasAcceptedTerms:
          parseBooleanSearchParam(searchParams.onboardingTermsAccepted) ===
          true,
        hasCompletedSetup:
          parseBooleanSearchParam(searchParams.onboardingCompletedSetup) ===
          true,
        locationPermissionStatus: parseOnboardingPermissionStatusSearchParam(
          searchParams.onboardingLocationPermissionStatus
        ),
        memberSegment,
        pushNotificationPermissionStatus:
          parseOnboardingPermissionStatusSearchParam(
            searchParams.onboardingPushPermissionStatus
          ),
      };
    }, [
      searchParams.onboardingCompletedSetup,
      searchParams.onboardingLocationPermissionStatus,
      searchParams.onboardingPrivacyAccepted,
      searchParams.onboardingPushPermissionStatus,
      searchParams.onboardingSegment,
      searchParams.onboardingTermsAccepted,
    ]);

  const prefilledDateOfBirth = React.useMemo(
    () => readTrimmedSearchParam(searchParams.onboardingDateOfBirth) ?? '',
    [searchParams.onboardingDateOfBirth]
  );
  const prefilledDisplayName = React.useMemo(
    () => readTrimmedSearchParam(searchParams.onboardingDisplayName) ?? '',
    [searchParams.onboardingDisplayName]
  );

  const signupForm = useForm<SignupFormValues>({
    defaultValues: {
      dateOfBirth: prefilledDateOfBirth,
      displayName: prefilledDisplayName,
      email: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(signupSchema),
  });
  const codeForm = useForm<VerifyCodeFormValues>({
    defaultValues: { code: '' },
    mode: 'onBlur',
    resolver: zodResolver(verifyCodeSchema),
  });

  const isCodeStep = sentEmail.length > 0;
  const primaryLoading = isCodeStep ? verifyCodeLoading : sendCodeLoading;
  const visibleError =
    isCodeStep && hasAttemptedCodeVerification
      ? verifyCodeError
      : sendCodeError;
  const isAuthBusy =
    primaryLoading || appleSignInLoading || googleSignInLoading;
  const hasRequiredOnboardingConsent =
    onboardingIdentityParams.hasAcceptedTerms &&
    onboardingIdentityParams.hasAcceptedPrivacyPolicy;
  const socialError = appleSignInError ?? googleSignInError;
  const resolvedError = socialError ?? visibleError;

  const resolvedErrorMessage = resolvedError
    ? isAuthErrorKey(resolvedError.message)
      ? t(resolvedError.message)
      : resolvedError.message
    : null;

  function buildSignupOnboardingData(
    values: Pick<SignupFormValues, 'dateOfBirth' | 'displayName'>
  ): SignupOnboardingData {
    return {
      dateOfBirth: values.dateOfBirth,
      displayName: values.displayName,
      ...(onboardingIdentityParams.hasAcceptedTerms
        ? { hasAcceptedTerms: true }
        : {}),
      ...(onboardingIdentityParams.hasAcceptedPrivacyPolicy
        ? { hasAcceptedPrivacyPolicy: true }
        : {}),
      ...(onboardingIdentityParams.hasCompletedSetup
        ? { hasCompletedSetup: true }
        : {}),
      ...(onboardingIdentityParams.memberSegment
        ? { memberSegment: onboardingIdentityParams.memberSegment }
        : {}),
      ...(onboardingIdentityParams.locationPermissionStatus
        ? {
            locationPermissionStatus:
              onboardingIdentityParams.locationPermissionStatus,
          }
        : {}),
      ...(onboardingIdentityParams.pushNotificationPermissionStatus
        ? {
            pushNotificationPermissionStatus:
              onboardingIdentityParams.pushNotificationPermissionStatus,
          }
        : {}),
    };
  }

  function ensureOnboardingConsent(): boolean {
    if (hasRequiredOnboardingConsent) return true;

    Alert.alert(
      t('onboardingConsentRequiredTitle'),
      t('onboardingConsentRequiredMessage'),
      [
        {
          text: t('onboardingConsentRequiredAction'),
          onPress: () => router.replace('/onboarding-welcome'),
        },
      ]
    );

    return false;
  }

  async function onSendCode(values: SignupFormValues): Promise<void> {
    if (!ensureOnboardingConsent()) return;

    try {
      const email = await sendCode({ email: values.email });
      const nextOnboardingData = buildSignupOnboardingData(values);

      setSentEmail(email);
      setHasAttemptedCodeVerification(false);
      setOnboardingData(nextOnboardingData);
      codeForm.reset({ code: '' });
    } catch (error: unknown) {
      const raw =
        error instanceof Error && error.message
          ? error.message
          : 'unableToSendCode';
      const message = isAuthErrorKey(raw) ? t(raw) : raw;
      Alert.alert(t('codeNotSentTitle'), message);
    }
  }

  async function onVerifyCode(values: VerifyCodeFormValues): Promise<void> {
    setHasAttemptedCodeVerification(true);

    try {
      await verifyCode({
        code: values.code,
        email: sentEmail,
        ...(onboardingData ? { onboardingData } : {}),
      });
    } catch (error: unknown) {
      const raw =
        error instanceof Error && error.message
          ? error.message
          : 'unableToVerifyCode';
      const message = isAuthErrorKey(raw) ? t(raw) : raw;
      Alert.alert(t('verificationFailedTitle'), message);
    }
  }

  function onInvalidSignupSubmit(): void {
    Alert.alert(t('invalidSignupInfoTitle'), t('invalidSignupInfoMessage'));
  }

  function onInvalidCodeSubmit(): void {
    Alert.alert(t('missingCodeTitle'), t('missingCodeMessage'));
  }

  function handleUseDifferentEmail(): void {
    setSentEmail('');
    setHasAttemptedCodeVerification(false);
    codeForm.reset({ code: '' });
  }

  const onEmailSubmit = signupForm.handleSubmit(
    onSendCode,
    onInvalidSignupSubmit
  );
  const onCodeSubmit = codeForm.handleSubmit(onVerifyCode, onInvalidCodeSubmit);

  async function runSocialSignupWithValidation(
    provider: 'apple' | 'google'
  ): Promise<void> {
    if (!ensureOnboardingConsent()) return;

    const isOnboardingDataValid = await signupForm.trigger([
      'displayName',
      'dateOfBirth',
    ]);
    if (!isOnboardingDataValid) {
      onInvalidSignupSubmit();
      return;
    }

    const values = signupForm.getValues();
    const nextOnboardingData = buildSignupOnboardingData({
      dateOfBirth: values.dateOfBirth,
      displayName: values.displayName,
    });

    if (provider === 'apple') {
      await signInWithApple({ onboardingData: nextOnboardingData });
      return;
    }

    await signInWithGoogle({ onboardingData: nextOnboardingData });
  }

  function handleSubmitPress(): void {
    if (isCodeStep) {
      void onCodeSubmit();
      return;
    }

    void onEmailSubmit();
  }

  function handleApplePress(): void {
    if (isAuthBusy) return;
    void runSocialSignupWithValidation('apple').catch(() => undefined);
  }

  function handleGooglePress(): void {
    if (isAuthBusy) return;
    void runSocialSignupWithValidation('google').catch(() => undefined);
  }

  return {
    appleSignInLoading,
    codeControl: codeForm.control,
    control: signupForm.control,
    googleSignInLoading,
    handleApplePress,
    handleGooglePress,
    handleSubmitPress,
    handleUseDifferentEmail,
    isAuthBusy,
    isCodeStep,
    resolvedErrorMessage,
    router,
    sentEmail,
    t,
  };
}
