import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, ShieldCheck, Waves } from 'lucide-react-native';
import React, { useState } from 'react';
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
import { useAuth } from '@/providers/AuthProvider';
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

export default function SignupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('auth');
  const {
    sendCode,
    sendCodeError,
    sendCodeLoading,
    verifyCode,
    verifyCodeError,
    verifyCodeLoading,
  } = useAuth();
  const [sentEmail, setSentEmail] = useState<string>('');
  const buttonScale = useSharedValue(1);
  const { control, handleSubmit } = useForm<SignupFormValues>({
    defaultValues: {
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
    defaultValues: {
      code: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(verifyCodeSchema),
  });

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.get() }],
  }));

  function handlePressIn(): void {
    buttonScale.set(withSpring(0.96, motion.spring.snappy));
  }

  function handlePressOut(): void {
    buttonScale.set(withSpring(1, motion.spring.snappy));
  }

  async function handleSendCode(values: SignupFormValues): Promise<void> {
    try {
      const email = await sendCode({ email: values.email });
      setSentEmail(email);
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

  async function handleVerifyCode(values: VerifyCodeFormValues): Promise<void> {
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
      const message = isAuthErrorKey(raw) ? t(raw) : raw;

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
    resetCodeForm({ code: '' });
  }

  const isCodeStep = !!sentEmail;
  const primaryLoading = isCodeStep ? verifyCodeLoading : sendCodeLoading;
  const visibleError = isCodeStep ? verifyCodeError : sendCodeError;

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
          style={{ paddingTop: insets.top }}
        >
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

            {visibleError ? (
              <View className="mb-4 rounded-xl bg-[#FEE2E2] p-3">
                <Text className="text-[13px] font-medium text-[#DC2626]">
                  {isAuthErrorKey(visibleError.message)
                    ? t(visibleError.message)
                    : visibleError.message}
                </Text>
              </View>
            ) : null}

            {isCodeStep ? (
              <ControlledTextInput<VerifyCodeFormValues>
                autoCapitalize="none"
                autoComplete="one-time-code"
                control={codeControl}
                icon={({ color, size }) => (
                  <ShieldCheck color={color} size={size} />
                )}
                keyboardType="number-pad"
                name="code"
                placeholder={t('codePlaceholder')}
                testID="signup-code"
              />
            ) : (
              <ControlledTextInput<SignupFormValues>
                autoCapitalize="none"
                autoComplete="email"
                control={control}
                icon={({ color, size }) => <Mail color={color} size={size} />}
                keyboardType="email-address"
                name="email"
                placeholder={t('emailPlaceholder')}
                testID="signup-email"
              />
            )}

            <Animated.View style={buttonStyle}>
              <Pressable
                accessibilityRole="button"
                className="mt-1 overflow-hidden rounded-2xl"
                disabled={primaryLoading}
                onPress={
                  isCodeStep
                    ? handleCodeSubmit(
                        handleVerifyCode,
                        handleInvalidCodeSubmit
                      )
                    : handleSubmit(handleSendCode, handleInvalidEmailSubmit)
                }
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
                    borderRadius: 16,
                    height: 52,
                    justifyContent: 'center',
                  }}
                >
                  {primaryLoading ? (
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
