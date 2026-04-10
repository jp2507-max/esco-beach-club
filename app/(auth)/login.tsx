import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail, ShieldCheck, Waves } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { ErrorBanner, SocialAuthButtons } from '@/src/components/ui';
import { motion, withRM } from '@/src/lib/animations/motion';
import type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';
import { useEmailCodeAuthFlow } from '@/src/lib/auth/use-email-code-auth-flow';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type EmailFormValues,
  type VerifyCodeFormValues,
} from '@/src/lib/forms/schemas';
import { hapticMedium } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function LoginScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    authFlow?: string;
  }>();
  const { t } = useTranslation('auth');
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
  const signupDraft = useSignupOnboardingDraftStore((state) => state.draft);
  const resetSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.resetDraft
  );
  const isSignupAuthFlow = searchParams.authFlow === 'signup';
  const onboardingData = React.useMemo<SignupOnboardingData | undefined>(() => {
    if (
      !isSignupAuthFlow ||
      !signupDraft.displayName ||
      !signupDraft.dateOfBirth ||
      signupDraft.hasCompletedSetup !== true
    ) {
      return undefined;
    }

    return {
      dateOfBirth: signupDraft.dateOfBirth,
      displayName: signupDraft.displayName,
      ...(signupDraft.hasCompletedSetup ? { hasCompletedSetup: true } : {}),
      ...(signupDraft.hasAcceptedPrivacyPolicy
        ? { hasAcceptedPrivacyPolicy: true }
        : {}),
      ...(signupDraft.hasAcceptedTerms ? { hasAcceptedTerms: true } : {}),
      ...(signupDraft.memberSegment
        ? { memberSegment: signupDraft.memberSegment }
        : {}),
      ...(signupDraft.locationPermissionStatus
        ? { locationPermissionStatus: signupDraft.locationPermissionStatus }
        : {}),
      ...(signupDraft.pushNotificationPermissionStatus
        ? {
            pushNotificationPermissionStatus:
              signupDraft.pushNotificationPermissionStatus,
          }
        : {}),
    };
  }, [isSignupAuthFlow, signupDraft]);
  const isOnboardingAuthEntry =
    isSignupAuthFlow && onboardingData !== undefined;
  const flow = useEmailCodeAuthFlow({
    sendCode,
    verifyCode: async ({ code, email }) => {
      await verifyCode({
        code,
        email,
        ...(onboardingData ? { onboardingData } : {}),
      });
    },
    sendCodeLoading,
    sendCodeError,
    verifyCodeLoading,
    verifyCodeError,
    t,
  });
  const {
    sentEmail,
    isCodeStep,
    primaryLoading,
    visibleError,
    control,
    codeControl,
    onEmailSubmit,
    onCodeSubmit,
    handleUseDifferentEmail,
  } = flow;

  const isAuthBusy =
    primaryLoading || appleSignInLoading || googleSignInLoading;

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

  function handleApplePress(): void {
    if (isAuthBusy) return;
    void signInWithApple(onboardingData ? { onboardingData } : undefined).catch(
      () => undefined
    );
  }

  function handleGooglePress(): void {
    if (isAuthBusy) return;
    void signInWithGoogle(
      onboardingData ? { onboardingData } : undefined
    ).catch(() => undefined);
  }

  const socialError = appleSignInError ?? googleSignInError;
  const resolvedError = socialError ?? visibleError;

  const unrecognizedErrorMessage = React.useMemo(() => {
    if (!resolvedError) return null;
    const message = resolvedError.message;
    return isAuthErrorKey(message) ? null : message;
  }, [resolvedError]);

  const lastLoggedUnrecognizedErrorRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!unrecognizedErrorMessage) {
      lastLoggedUnrecognizedErrorRef.current = null;
      return;
    }

    if (lastLoggedUnrecognizedErrorRef.current === unrecognizedErrorMessage)
      return;

    console.error(
      '[AuthError] Unrecognized message:',
      unrecognizedErrorMessage
    );
    lastLoggedUnrecognizedErrorRef.current = unrecognizedErrorMessage;
  }, [unrecognizedErrorMessage]);

  const resolvedErrorMessage = React.useMemo(() => {
    if (!resolvedError) return null;
    const message = resolvedError.message;
    if (isAuthErrorKey(message)) return t(message);

    return t('genericError');
  }, [resolvedError, t]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[
          Colors.secondary,
          Colors.secondaryDark,
          Colors.secondaryDeeper,
        ]}
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
          style={{ paddingTop: insets.top }}
        >
          <Animated.View
            className="mb-8 items-center"
            entering={withRM(FadeInUp.delay(40).duration(motion.dur.md))}
          >
            <View
              className="mb-4 size-18 items-center justify-center rounded-full bg-white"
              style={shadows.level4}
            >
              <Waves color={Colors.primary} size={36} />
            </View>
            <Text className="text-[32px] font-extrabold tracking-[1px] text-white">
              {t('brandTitle')}
            </Text>
            <Text className="mt-1 text-sm font-medium text-white/75">
              {isOnboardingAuthEntry ? t('signupTagline') : t('loginTagline')}
            </Text>
          </Animated.View>

          <Animated.View
            className="rounded-3xl bg-white p-7 dark:bg-dark-bg-elevated"
            entering={withRM(FadeInUp.delay(120).duration(motion.dur.md))}
            style={shadows.level5}
          >
            <Animated.View
              entering={withRM(FadeInUp.delay(0).duration(motion.dur.sm))}
            >
              <Text className="mb-1 text-2xl font-bold text-text dark:text-text-primary-dark">
                {isCodeStep
                  ? isOnboardingAuthEntry
                    ? t('signupVerifyTitle')
                    : t('loginVerifyTitle')
                  : isOnboardingAuthEntry
                    ? t('signupTitle')
                    : t('loginTitle')}
              </Text>
              <Text className="mb-6 text-sm text-text-secondary dark:text-text-secondary-dark">
                {isCodeStep
                  ? isOnboardingAuthEntry
                    ? t('signupVerifySubtitle', { email: sentEmail })
                    : t('loginVerifySubtitle', { email: sentEmail })
                  : isOnboardingAuthEntry
                    ? t('signupSubtitle')
                    : t('loginSubtitle')}
              </Text>
            </Animated.View>

            <Animated.View
              entering={withRM(FadeInUp.delay(40).duration(motion.dur.sm))}
            >
              <ErrorBanner className="mb-4" message={resolvedErrorMessage} />
            </Animated.View>

            {isCodeStep ? (
              <Animated.View
                entering={withRM(FadeInUp.delay(80).duration(motion.dur.md))}
              >
                <ControlledTextInput<VerifyCodeFormValues>
                  key="login-code-input"
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
                  keyboardType={
                    Platform.OS === 'ios' ? 'number-pad' : 'numeric'
                  }
                  maxLength={6}
                  name="code"
                  placeholder={t('codePlaceholder')}
                  returnKeyType="done"
                  testID="login-code"
                  textContentType={
                    Platform.OS === 'ios' ? 'oneTimeCode' : undefined
                  }
                />
              </Animated.View>
            ) : (
              <Animated.View
                entering={withRM(FadeInUp.delay(80).duration(motion.dur.md))}
              >
                <ControlledTextInput<EmailFormValues>
                  key="login-email-input"
                  autoCapitalize="none"
                  autoComplete="email"
                  control={control}
                  icon={({ color, size }) => <Mail color={color} size={size} />}
                  keyboardType="email-address"
                  name="email"
                  placeholder={t('emailPlaceholder')}
                  testID="login-email"
                />
              </Animated.View>
            )}

            <Animated.View
              entering={withRM(FadeInUp.delay(140).duration(motion.dur.sm))}
            >
              <Animated.View style={buttonStyle}>
                <Pressable
                  accessibilityRole="button"
                  className="mt-1 overflow-hidden rounded-2xl"
                  disabled={isAuthBusy}
                  onPress={() => {
                    hapticMedium();
                    if (isCodeStep) void onCodeSubmit();
                    else void onEmailSubmit();
                  }}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  testID="login-submit"
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={{
                      alignItems: 'center',
                      borderRadius: 16,
                      height: 52,
                      justifyContent: 'center',
                    }}
                  >
                    {isAuthBusy ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text className="text-base font-bold tracking-[0.5px] text-white">
                        {isCodeStep
                          ? isOnboardingAuthEntry
                            ? t('verifyJoin')
                            : t('verifyContinue')
                          : isOnboardingAuthEntry
                            ? t('sendJoinCode')
                            : t('sendVerificationCode')}
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Animated.View>

            {isCodeStep ? (
              <Pressable
                accessibilityRole="button"
                className="mt-4 items-center"
                onPress={handleUseDifferentEmail}
                testID="login-edit-email"
              >
                <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  {t('wrongEmailPrefix')}{' '}
                  <Text className="font-bold text-primary dark:text-primary-bright">
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

            {!isOnboardingAuthEntry ? (
              <Pressable
                accessibilityRole="button"
                className="items-center"
                onPress={() => router.push('/onboarding-welcome')}
                testID="login-go-signup"
              >
                <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  {t('needMemberAccount')}{' '}
                  <Text className="font-bold text-primary dark:text-primary-bright">
                    {t('createOne')}
                  </Text>
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
