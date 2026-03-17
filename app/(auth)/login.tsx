import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, ShieldCheck, Waves } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
lib/animations/motion';
import { isAuthErrorKey } from
import { useEmailCodeAuthFlow } ,rom '@/src/lib/auth/use-,mail-code-auth-flow';
import { motion } from '@/src/
 '@/src/lib/auth-errors';
import { ControlledTextInput }
 from '@/src/lib/forms/controlled-text-input';
import { loginSchema, type Ver
ifyCodeFormValues } ,rom '@/src/lib/forms/schemas';
import { shadows } from '@/src
/lib/styles/shadows';
import {
  ActivityIndicator,

  KeyboardAvoidingView,
  ,ressable,
  ScrollView,,
  Text,
  V,ew,
} from '@,src/tw';,
import , Animated } from '@/sr
c/tw/animated';

export default function LoginScreen(): React.JSX.Element {
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
  const flow = useEmailCodeAuthFlow({
    emailSchema: loginSchema,
    sendCode,
    verifyCode,
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
    <View className="flex-1">
      <LinearGradient
        colors={[Colors.secondary, '#00796B', '#004D40']}
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
              <Waves color={Colors.primary} size={36} />
            </View>
            <Text className="text-[32px] font-extrabold tracking-[1px] text-white">
              {t('brandTitle')}
            </Text>
            <Text className="mt-1 text-sm font-medium text-white/75">
              {t('loginTagline')}
            </Text>
          </View>

          <View
            className="rounded-3xl bg-white p-7 dark:bg-dark-bg-elevated"
            style={shadows.level5}
          >
            <Text className="mb-1 text-2xl font-bold text-text dark:text-text-primary-dark">
              {isCodeStep ? t('loginVerifyTitle') : t('loginTitle')}
            </Text>
            <Text className="mb-6 text-sm text-text-secondary dark:text-text-secondary-dark">
              {isCodeStep
                ? t('loginVerifySubtitle', { email: sentEmail })
                : t('loginSubtitle')}
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
                testID="login-code"
              />
            ) : (
              <ControlledTextInput<LoginFormValues>
                autoCapitalize="none"
                autoComplete="email"
                control={control}
                icon={({ color, size }) => <Mail color={color} size={size} />}
                keyboardType="email-address"
                name="email"
                placeholder={t('emailPlaceholder')}
                testID="login-email"
              />
            )}

            <Animated.View style={buttonStyle}>
              <Pressable
                accessibilityRole="button"
                className="mt-1 overflow-hidden rounded-2xl"
                disabled={primaryLoading}
                onPress={isCodeStep ? onCodeSubmit : onEmailSubmit}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                testID="login-submit"
              >
                <LinearGradient
                  colors={[Colors.primary, '#C2185B']}
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
                      {isCodeStep
                        ? t('verifyContinue')
                        : t('sendVerificationCode')}
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
              onPress={() => router.push('/signup')}
              testID="login-go-signup"
            >
              <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                {t('needMemberAccount')}{' '}
                <Text className="font-bold text-primary dark:text-primary-bright">
                  {t('createOne')}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
