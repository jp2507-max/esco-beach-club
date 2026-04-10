import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarDays, UserRound } from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { motion, withRM } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { ControlledDateInput } from '@/src/lib/forms/controlled-date-input';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type OnboardingBasicsFormValues,
  onboardingBasicsSchema,
} from '@/src/lib/forms/schemas';
import { hapticLight } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const TITLE_DELAY = 100;
const FORM_DELAY = 260;
const CTA_DELAY = 420;

export default function OnboardingProfileBasicsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const isDark = useAppIsDark();
  const ctaButton = useButtonPress();
  const signupDraft = useSignupOnboardingDraftStore((state) => state.draft);
  const setSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.setDraft
  );

  const { control, handleSubmit } = useForm<OnboardingBasicsFormValues>({
    defaultValues: {
      dateOfBirth: signupDraft.dateOfBirth ?? '',
      displayName: signupDraft.displayName ?? '',
    },
    mode: 'onBlur',
    resolver: zodResolver(onboardingBasicsSchema),
  });

  function onValidSubmit(values: OnboardingBasicsFormValues): void {
    setSignupDraft({
      dateOfBirth: values.dateOfBirth,
      displayName: values.displayName,
    });
    router.push('./onboarding-local-identity');
  }

  function onInvalidSubmit(): void {
    Alert.alert(
      t('onboardingBasicsInvalidTitle'),
      t('onboardingBasicsInvalidMessage')
    );
  }

  const onSubmit = handleSubmit(onValidSubmit, onInvalidSubmit);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <LinearGradient
        colors={
          isDark
            ? [
                Colors.onboardingBasicsGradientDarkStart,
                Colors.onboardingBasicsGradientDarkMiddle,
                Colors.onboardingBasicsGradientDarkEnd,
              ]
            : [
                Colors.onboardingBasicsGradientStart,
                Colors.onboardingBasicsGradientMiddle,
                Colors.onboardingBasicsGradientEnd,
              ]
        }
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />

      <OnboardingHeader
        onBack={() => router.back()}
        step={2}
        testIDPrefix="onboarding-basics"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-6 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={withRM(
              FadeInUp.springify().damping(18).stiffness(140).delay(TITLE_DELAY)
            )}
            className="mb-5 items-center px-2"
          >
            <Text className="mb-2 text-center text-[28px] font-extrabold leading-9 text-text dark:text-text-primary-dark">
              {t('onboardingBasicsTitle')}
            </Text>
            <Text className="text-center text-[15px] leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('onboardingBasicsSubtitle')}
            </Text>
          </Animated.View>

          <Animated.View
            entering={withRM(
              FadeInUp.springify().damping(16).stiffness(120).delay(FORM_DELAY)
            )}
            className="rounded-3xl border border-border bg-white/92 p-6 dark:border-dark-border dark:bg-dark-bg-card/92"
            style={shadows.level4}
          >
            <ControlledTextInput<OnboardingBasicsFormValues>
              autoCapitalize="words"
              autoCorrect={false}
              control={control}
              icon={({ color, size }) => (
                <UserRound color={color} size={size} />
              )}
              label={t('displayNameLabel')}
              maxLength={60}
              name="displayName"
              placeholder={t('onboardingBasicsDisplayNamePlaceholder')}
              testID="onboarding-basics-display-name"
              textContentType="name"
            />

            <ControlledDateInput<OnboardingBasicsFormValues>
              control={control}
              icon={({ color, size }) => (
                <CalendarDays color={color} size={size} />
              )}
              label={t('dateOfBirthLabel')}
              name="dateOfBirth"
              placeholder={t('onboardingBasicsDateOfBirthPlaceholder')}
              testID="onboarding-basics-date-of-birth"
            />
          </Animated.View>

          <Animated.View
            entering={withRM(FadeIn.duration(motion.dur.md).delay(CTA_DELAY))}
          >
            <Animated.View style={ctaButton.animatedStyle}>
              <Pressable
                accessibilityRole="button"
                className="mt-7 overflow-hidden rounded-full"
                onPress={(e) => {
                  hapticLight();
                  onSubmit(e);
                }}
                onPressIn={ctaButton.handlePressIn}
                onPressOut={ctaButton.handlePressOut}
                testID="onboarding-basics-next"
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  end={{ x: 1, y: 0 }}
                  start={{ x: 0, y: 0 }}
                  style={{
                    alignItems: 'center',
                    borderRadius: 999,
                    height: 54,
                    justifyContent: 'center',
                  }}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-[17px] font-bold text-white">
                      {t('onboardingBasicsNext')}
                    </Text>
                    <ArrowRight color={Colors.white} size={22} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
