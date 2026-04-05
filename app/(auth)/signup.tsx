import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Waves } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { SignupAuthCard } from '@/src/components/onboarding/signup-auth-card';
import { SignupStepDots } from '@/src/components/onboarding/signup-step-dots';
import { motion, withRM } from '@/src/lib/animations/motion';
import { useSignupScreenController } from '@/src/lib/auth/use-signup-screen-controller';
import { shadows } from '@/src/lib/styles/shadows';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function SignupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t: tCommon } = useTranslation('common');
  const {
    appleSignInLoading,
    codeControl,
    control,
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
  } = useSignupScreenController();

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, Colors.primaryDeeper]}
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
                accessibilityHint={tCommon('backHint')}
                accessibilityLabel={tCommon('back')}
                accessibilityRole="button"
                className="size-10 items-center justify-center rounded-full"
                onPress={() => router.back()}
                testID="signup-back"
              >
                <ArrowLeft color={Colors.white} size={22} />
              </Pressable>

              <Text className="text-[34px] font-extrabold tracking-[-0.7px] text-white">
                {t('brandTitle')}
              </Text>
            </View>

            <View className="size-10" />
          </View>

          <Animated.View
            className="mb-8 items-center gap-2"
            entering={withRM(FadeInUp.delay(60).duration(motion.dur.md))}
          >
            <Text className="text-[11px] font-bold uppercase tracking-[3.5px] text-white/90">
              {t('onboardingBasicsStep', { step: 6, total: 6 })}
            </Text>
            <SignupStepDots isCodeStep={isCodeStep} />
          </Animated.View>

          <Animated.View
            className="mb-8 items-center"
            entering={withRM(FadeInUp.delay(100).duration(motion.dur.md))}
          >
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
          </Animated.View>

          <SignupAuthCard
            appleSignInLoading={appleSignInLoading}
            codeControl={codeControl}
            control={control}
            googleSignInLoading={googleSignInLoading}
            isAuthBusy={isAuthBusy}
            isCodeStep={isCodeStep}
            resolvedErrorMessage={resolvedErrorMessage}
            sentEmail={sentEmail}
            t={t}
            onApplePress={handleApplePress}
            onGoToLogin={() => router.back()}
            onGooglePress={handleGooglePress}
            onSubmit={handleSubmitPress}
            onUseDifferentEmail={handleUseDifferentEmail}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
