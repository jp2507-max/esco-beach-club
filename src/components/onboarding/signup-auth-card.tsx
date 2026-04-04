import { LinearGradient } from 'expo-linear-gradient';
import type { TFunction } from 'i18next';
import {
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import React from 'react';
import type { Control } from 'react-hook-form';
import { Platform } from 'react-native';
import {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { ErrorBanner, SocialAuthButtons } from '@/src/components/ui';
import { motion, withRM } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type SignupFormValues,
  type VerifyCodeFormValues,
} from '@/src/lib/forms/schemas';
import { hapticMedium } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type SignupAuthCardProps = {
  appleSignInLoading: boolean;
  codeControl: Control<VerifyCodeFormValues>;
  control: Control<SignupFormValues>;
  googleSignInLoading: boolean;
  isAuthBusy: boolean;
  isCodeStep: boolean;
  resolvedErrorMessage: string | null;
  sentEmail: string;
  t: TFunction;
  onApplePress: () => void;
  onGoToLogin: () => void;
  onGooglePress: () => void;
  onSubmit: () => void;
  onUseDifferentEmail: () => void;
};

export function SignupAuthCard({
  appleSignInLoading,
  codeControl,
  control,
  googleSignInLoading,
  isAuthBusy,
  isCodeStep,
  resolvedErrorMessage,
  sentEmail,
  t,
  onApplePress,
  onGoToLogin,
  onGooglePress,
  onSubmit,
  onUseDifferentEmail,
}: SignupAuthCardProps): React.JSX.Element {
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

  return (
    <Animated.View
      className="rounded-3xl bg-white p-7 dark:bg-dark-bg-elevated"
      entering={withRM(FadeInUp.delay(160).duration(motion.dur.md))}
      style={shadows.level5}
    >
      <Animated.View entering={withRM(FadeInUp.duration(motion.dur.sm))}>
        <Text className="mb-1 text-2xl font-bold text-text dark:text-text-primary-dark">
          {isCodeStep ? t('signupVerifyTitle') : t('signupTitle')}
        </Text>
        <Text className="mb-6 text-sm text-text-secondary dark:text-text-secondary-dark">
          {isCodeStep
            ? t('signupVerifySubtitle', { email: sentEmail })
            : t('signupSubtitle')}
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
            textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
          />
        </Animated.View>
      ) : (
        <>
          <Animated.View
            entering={withRM(FadeInUp.delay(80).duration(motion.dur.md))}
          >
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
          </Animated.View>
          <Animated.View
            entering={withRM(FadeInUp.delay(100).duration(motion.dur.md))}
          >
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
          </Animated.View>
          <Animated.View
            entering={withRM(FadeInUp.delay(120).duration(motion.dur.md))}
          >
            <ControlledTextInput<SignupFormValues>
              autoCapitalize="none"
              autoCorrect={false}
              control={control}
              icon={({ color, size }) => (
                <CalendarDays color={color} size={size} />
              )}
              keyboardType={
                Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
              }
              label={t('dateOfBirthLabel')}
              maxLength={10}
              name="dateOfBirth"
              placeholder={t('dateOfBirthPlaceholder')}
              testID="signup-date-of-birth"
              textContentType="birthdate"
            />
          </Animated.View>
        </>
      )}

      <Animated.View
        entering={withRM(FadeInUp.delay(140).duration(motion.dur.sm))}
      >
        <Animated.View style={buttonStyle}>
          <Pressable
            accessibilityRole="button"
            className="mt-1 overflow-hidden rounded-full"
            disabled={isAuthBusy}
            onPress={() => {
              hapticMedium();
              onSubmit();
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            testID="signup-submit"
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.secondaryDark]}
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
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text className="text-base font-bold tracking-[0.5px] text-white">
                  {isCodeStep ? t('verifyJoin') : t('sendJoinCode')}
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
          onPress={onUseDifferentEmail}
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
          onApplePress={onApplePress}
          onGooglePress={onGooglePress}
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
        onPress={onGoToLogin}
        testID="signup-go-login"
      >
        <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
          {t('alreadyHaveCode')}{' '}
          <Text className="font-bold text-secondary dark:text-secondary">
            {t('signIn')}
          </Text>
        </Text>
      </Pressable>
    </Animated.View>
  );
}
