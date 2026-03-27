import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarDays, UserRound } from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { ControlledDateInput } from '@/src/lib/forms/controlled-date-input';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type OnboardingBasicsFormValues,
  onboardingBasicsSchema,
} from '@/src/lib/forms/schemas';
import { shadows } from '@/src/lib/styles/shadows';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';

export default function OnboardingProfileBasicsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');

  const { control, handleSubmit } = useForm<OnboardingBasicsFormValues>({
    defaultValues: {
      dateOfBirth: '',
      displayName: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(onboardingBasicsSchema),
  });

  function onValidSubmit(values: OnboardingBasicsFormValues): void {
    router.push({
      pathname: './onboarding-local-identity',
      params: {
        onboardingDateOfBirth: values.dateOfBirth,
        onboardingDisplayName: values.displayName,
      },
    });
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
        colors={[
          'rgba(251,236,243,0.9)',
          'rgba(251,249,241,0.95)',
          'rgba(232,246,241,0.88)',
        ]}
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
          <View className="mb-5 items-center px-2">
            <Text className="mb-2 text-center text-[30px] font-extrabold leading-9 text-text dark:text-text-primary-dark">
              {t('onboardingBasicsTitle')}
            </Text>
            <Text className="text-center text-[15px] leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('onboardingBasicsSubtitle')}
            </Text>
          </View>

          <View
            className="rounded-[34px] border border-border bg-white/92 p-6 dark:border-dark-border dark:bg-dark-bg-card/92"
            style={shadows.level5}
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
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-7 overflow-hidden rounded-full"
            onPress={onSubmit}
            testID="onboarding-basics-next"
          >
            <LinearGradient
              colors={[Colors.primary, '#C2185B']}
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
                <ArrowRight color="#ffffff" size={22} />
              </View>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
