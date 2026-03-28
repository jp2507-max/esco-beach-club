import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
  Waves,
} from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import { type SignupOnboardingData, useAuth } from '@/providers/AuthProvider';
import { ErrorBanner, SocialAuthButtons } from '@/src/components/ui';
import { motion } from '@/src/lib/animations/motion';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type SignupFormValues,
  signupSchema,
  type VerifyCodeFormValues,
  verifyCodeSchema,
} from '@/src/lib/forms/schemas';
import { shadows } from '@/src/lib/styles/shadows';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

function parseBooleanSearchParam(
  value: string | string[] | undefined
): boolean | undefined {
  if (Array.isArray(value)) {
    return parseBooleanSearchParam(value[0]);
  }

  if (value === '1' || value === 'true') {
    return true;
  }

  if (value === '0' || value === 'false') {
    return false;
  }

  return undefined;
}

function parseOptionalSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return parseOptionalSearchParam(value[0]);
  }

  if (!value) return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parsePermissionStatusSearchParam(
  value: string | string[] | undefined
): OnboardingPermissionStatus | undefined {
  if (Array.isArray(value)) {
    return parsePermissionStatusSearchParam(value[0]);
  }

  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  if (normalized === onboardingPermissionStatuses.undetermined) {
    return onboardingPermissionStatuses.undetermined;
  }

  return undefined;
}

export default function SignupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    onboardingAvatarLocalUri?: string;
    onboardingAvatarMimeType?: string;
    onboardingCompletedSetup?: string;
    onboardingDateOfBirth?: string;
    onboardingDisplayName?: string;
    onboardingLocationPermissionStatus?: string;
    onboardingPrivacyAccepted?: string;
    onboardingPushPermissionStatus?: string;
    onboardingResident?: string;
    onboardingTermsAccepted?: string;
  }>();
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const {
    appleSignInError,
    appleSignInLoading,
    googleSignInError,
    googleSignInLoading,
    signInWithApple,
    signInWithGoogle,
    sendCode,
    sendCodeError,
    sendCodeLoading,
    verifyCode,
    verifyCodeError,
    verifyCodeLoading,
  } = useAuth();
  const [sentEmail, setSentEmail] = React.useState<string>('');
  const [hasAttemptedCodeVerification, setHasAttemptedCodeVerification] =
    React.useState<boolean>(false);
  const [onboardingData, setOnboardingData] =
    React.useState<SignupOnboardingData | null>(null);

  const onboardingIdentityParams = React.useMemo(
    () => ({
      avatarLocalUri: parseOptionalSearchParam(
        searchParams.onboardingAvatarLocalUri
      ),
      avatarMimeType: parseOptionalSearchParam(
        searchParams.onboardingAvatarMimeType
      ),
      hasCompletedSetup:
        parseBooleanSearchParam(searchParams.onboardingCompletedSetup) === true,
      hasAcceptedPrivacyPolicy:
        parseBooleanSearchParam(searchParams.onboardingPrivacyAccepted) ===
        true,
      hasAcceptedTerms:
        parseBooleanSearchParam(searchParams.onboardingTermsAccepted) === true,
      isDanangCitizen: parseBooleanSearchParam(searchParams.onboardingResident),
      locationPermissionStatus: parsePermissionStatusSearchParam(
        searchParams.onboardingLocationPermissionStatus
      ),
      pushNotificationPermissionStatus: parsePermissionStatusSearchParam(
        searchParams.onboardingPushPermissionStatus
      ),
    }),
    [
      searchParams.onboardingAvatarLocalUri,
      searchParams.onboardingAvatarMimeType,
      searchParams.onboardingCompletedSetup,
      searchParams.onboardingLocationPermissionStatus,
      searchParams.onboardingPrivacyAccepted,
      searchParams.onboardingPushPermissionStatus,
      searchParams.onboardingResident,
      searchParams.onboardingTermsAccepted,
    ]
  );

  const prefilledDateOfBirth = React.useMemo(
    () => parseOptionalSearchParam(searchParams.onboardingDateOfBirth) ?? '',
    [searchParams.onboardingDateOfBirth]
  );

  const prefilledDisplayName = React.useMemo(
    () => parseOptionalSearchParam(searchParams.onboardingDisplayName) ?? '',
    [searchParams.onboardingDisplayName]
  );

  function buildSignupOnboardingData(
    values: Pick<SignupFormValues, 'dateOfBirth' | 'displayName'>
  ): SignupOnboardingData {
    return {
      dateOfBirth: values.dateOfBirth,
      displayName: values.displayName,
      ...(onboardingIdentityParams.avatarLocalUri
        ? { avatarLocalUri: onboardingIdentityParams.avatarLocalUri }
        : {}),
      ...(onboardingIdentityParams.avatarMimeType
        ? { avatarMimeType: onboardingIdentityParams.avatarMimeType }
        : {}),
      ...(onboardingIdentityParams.hasAcceptedTerms
        ? { hasAcceptedTerms: true }
        : {}),
      ...(onboardingIdentityParams.hasAcceptedPrivacyPolicy
        ? { hasAcceptedPrivacyPolicy: true }
        : {}),
      ...(onboardingIdentityParams.hasCompletedSetup
        ? { hasCompletedSetup: true }
        : {}),
      ...(onboardingIdentityParams.isDanangCitizen !== undefined
        ? { isDanangCitizen: onboardingIdentityParams.isDanangCitizen }
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

  const { control, getValues, handleSubmit, trigger } =
    useForm<SignupFormValues>({
      defaultValues: {
        dateOfBirth: prefilledDateOfBirth,
        displayName: prefilledDisplayName,
        email: '',
      },
      mode: 'onBlur',
      resolver: zodResolver(signupSchema),
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

  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.get() }],
  }));

  function handlePressIn(): void {
    buttonScale.set(withSpring(0.96, motion.spring.snappy));
  }

  function handlePressOut(): void {
    buttonScale.set(withSpring(1, motion.spring.snappy));
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
      resetCodeForm({ code: '' });
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
    resetCodeForm({ code: '' });
  }

  const onEmailSubmit = handleSubmit(onSendCode, onInvalidSignupSubmit);
  const onCodeSubmit = handleCodeSubmit(onVerifyCode, onInvalidCodeSubmit);

  async function runSocialSignupWithValidation(
    provider: 'apple' | 'google'
  ): Promise<void> {
    if (!ensureOnboardingConsent()) return;

    const isOnboardingDataValid = await trigger(['displayName', 'dateOfBirth']);
    if (!isOnboardingDataValid) {
      onInvalidSignupSubmit();
      return;
    }

    const values = getValues();
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

  function handleApplePress(): void {
    if (isAuthBusy) return;
    void runSocialSignupWithValidation('apple').catch(() => undefined);
  }

  function handleGooglePress(): void {
    if (isAuthBusy) return;
    void runSocialSignupWithValidation('google').catch(() => undefined);
  }

  const socialError = appleSignInError ?? googleSignInError;
  const resolvedError = socialError ?? visibleError;

  const resolvedErrorMessage = resolvedError
    ? isAuthErrorKey(resolvedError?.message)
      ? t(resolvedError?.message)
      : resolvedError?.message
    : null;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[Colors.primary, '#C2185B', '#AD1457']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="flex-grow justify-center px-6 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ paddingTop: insets.top + 6 }}
        >
          <View className="mb-7 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityLabel={tCommon('back')}
                accessibilityRole="button"
                className="size-10 items-center justify-center rounded-full"
                onPress={() => router.back()}
                testID="signup-back"
              >
                <ArrowLeft color="#ffffff" size={22} />
              </Pressable>

              <Text className="text-[34px] font-extrabold tracking-[-0.7px] text-white">
                {t('brandTitle')}
              </Text>
            </View>

            <View className="size-10" />
          </View>

          <View className="mb-8 items-center gap-2">
            <Text className="text-[11px] font-bold uppercase tracking-[3.5px] text-white/90">
              {t('onboardingBasicsStep', { step: 6, total: 6 })}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View className="h-1.5 w-8 rounded-full bg-white" />
              <View className="h-1.5 w-8 rounded-full bg-white" />
              <View className="h-1.5 w-8 rounded-full bg-white" />
              <View className="h-1.5 w-8 rounded-full bg-white" />
              <View className="h-1.5 w-8 rounded-full bg-white" />
              <View className="h-1.5 w-8 rounded-full bg-white" />
            </View>
          </View>

          <View className="mb-8 items-center">
            <View
              className="mb-4 size-18 items-center justify-center rounded-full bg-white"
              style={shadows.level4}
            >
              <Waves color={Colors.secondary} size={36} />
            </View>
            <Text className="text-[28px] font-extrabold tracking-[0.5px] text-white">
              {t('signupHeroTitle')}
            </Text>
            <Text className="mt-1 text-sm font-medium text-white/75">
              {t('signupTagline')}
            </Text>
          </View>

          <View
            className="rounded-3xl bg-white p-7 dark:bg-dark-bg-elevated"
            style={shadows.level5}
          >
            <Text className="mb-1 text-2xl font-bold text-text dark:text-text-primary-dark">
              {isCodeStep ? t('signupVerifyTitle') : t('signupTitle')}
            </Text>
            <Text className="mb-6 text-sm text-text-secondary dark:text-text-secondary-dark">
              {isCodeStep
                ? t('signupVerifySubtitle', { email: sentEmail })
                : t('signupSubtitle')}
            </Text>

            <ErrorBanner className="mb-4" message={resolvedErrorMessage} />

            {isCodeStep ? (
              <ControlledTextInput<VerifyCodeFormValues>
                key="signup-code-input"
                autoFocus
                autoCapitalize="none"
                autoComplete={
                  Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
                }
                autoCorrect={false}
                control={codeControl}
                icon={({ color, size }) => (
                  <ShieldCheck color={color} size={size} />
                )}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                maxLength={6}
                name="code"
                placeholder={t('codePlaceholder')}
                returnKeyType="done"
                testID="signup-code"
                textContentType={
                  Platform.OS === 'ios' ? 'oneTimeCode' : undefined
                }
              />
            ) : (
              <>
                <ControlledTextInput<SignupFormValues>
                  autoCapitalize="words"
                  autoCorrect={false}
                  control={control}
                  icon={({ color, size }) => (
                    <UserRound color={color} size={size} />
                  )}
                  label={t('displayNameLabel')}
                  maxLength={60}
                  name="displayName"
                  placeholder={t('displayNamePlaceholder')}
                  testID="signup-display-name"
                  textContentType="name"
                />
                <ControlledTextInput<SignupFormValues>
                  autoCapitalize="none"
                  autoComplete="email"
                  control={control}
                  icon={({ color, size }) => <Mail color={color} size={size} />}
                  keyboardType="email-address"
                  label={t('emailLabel')}
                  name="email"
                  placeholder={t('emailPlaceholder')}
                  testID="signup-email"
                  textContentType="emailAddress"
                />
                <ControlledTextInput<SignupFormValues>
                  autoCapitalize="none"
                  autoCorrect={false}
                  control={control}
                  icon={({ color, size }) => (
                    <CalendarDays color={color} size={size} />
                  )}
                  keyboardType={
                    Platform.OS === 'ios'
                      ? 'numbers-and-punctuation'
                      : 'default'
                  }
                  label={t('dateOfBirthLabel')}
                  maxLength={10}
                  name="dateOfBirth"
                  placeholder={t('dateOfBirthPlaceholder')}
                  testID="signup-date-of-birth"
                  textContentType="birthdate"
                />
              </>
            )}

            <Animated.View style={buttonStyle}>
              <Pressable
                accessibilityRole="button"
                className="mt-1 overflow-hidden rounded-full"
                disabled={isAuthBusy}
                onPress={isCodeStep ? onCodeSubmit : onEmailSubmit}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                testID="signup-submit"
              >
                <LinearGradient
                  colors={[Colors.secondary, '#00796B']}
                  end={{ x: 1, y: 0 }}
                  start={{ x: 0, y: 0 }}
                  style={{
                    alignItems: 'center',
                    borderRadius: 999,
                    height: 56,
                    justifyContent: 'center',
                  }}
                >
                  {isAuthBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base font-bold tracking-[0.5px] text-white">
                      {isCodeStep ? t('verifyJoin') : t('sendJoinCode')}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {isCodeStep ? (
              <Pressable
                accessibilityRole="button"
                className="mt-4 items-center"
                onPress={handleUseDifferentEmail}
                testID="signup-edit-email"
              >
                <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  {t('wrongEmailPrefix')}{' '}
                  <Text className="font-bold text-secondary dark:text-secondary">
                    {t('useDifferentOne')}
                  </Text>
                </Text>
              </Pressable>
            ) : null}

            {!isCodeStep ? (
              <SocialAuthButtons
                appleLoading={appleSignInLoading}
                disabled={isAuthBusy}
                googleLoading={googleSignInLoading}
                onApplePress={handleApplePress}
                onGooglePress={handleGooglePress}
              />
            ) : null}

            <View className="my-5 flex-row items-center">
              <View className="h-px flex-1 bg-border dark:bg-dark-border" />
              <Text className="mx-3 text-[13px] text-text-muted dark:text-text-muted-dark">
                {t('or')}
              </Text>
              <View className="h-px flex-1 bg-border dark:bg-dark-border" />
            </View>

            <Pressable
              accessibilityRole="button"
              className="items-center"
              onPress={() => router.back()}
              testID="signup-go-login"
            >
              <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                {t('alreadyHaveCode')}{' '}
                <Text className="font-bold text-secondary dark:text-secondary">
                  {t('signIn')}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
