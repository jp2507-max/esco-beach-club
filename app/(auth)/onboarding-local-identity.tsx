import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check, MapPin } from 'lucide-react-native';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Colors } from '@/constants/colors';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { InfoDot } from '@/src/components/ui';
import {
  type OnboardingLocalIdentityFormValues,
  onboardingLocalIdentitySchema,
} from '@/src/lib/forms/schemas';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

type OnboardingBasicsSearchParams = {
  onboardingDateOfBirth?: string | string[];
  onboardingDisplayName?: string | string[];
};

function readSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function OnboardingLocalIdentityScreen(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useLocalSearchParams<OnboardingBasicsSearchParams>();
  const { t } = useTranslation('auth');

  function showInfoAlert(title: string, message: string): void {
    Alert.alert(title, message);
  }

  const { control, handleSubmit } = useForm<OnboardingLocalIdentityFormValues>({
    defaultValues: {
      acceptedPrivacyPolicy: false,
      acceptedTerms: false,
      residencyStatus: undefined,
    },
    mode: 'onBlur',
    resolver: zodResolver(onboardingLocalIdentitySchema),
  });

  function onValidSubmit(values: OnboardingLocalIdentityFormValues): void {
    const onboardingDateOfBirth = readSingleSearchParam(
      searchParams.onboardingDateOfBirth
    );
    const onboardingDisplayName = readSingleSearchParam(
      searchParams.onboardingDisplayName
    );

    router.push({
      pathname: './onboarding-permissions',
      params: {
        ...(onboardingDateOfBirth ? { onboardingDateOfBirth } : {}),
        ...(onboardingDisplayName ? { onboardingDisplayName } : {}),
        onboardingPrivacyAccepted: values.acceptedPrivacyPolicy ? '1' : '0',
        onboardingResident: values.residencyStatus === 'citizen' ? '1' : '0',
        onboardingTermsAccepted: values.acceptedTerms ? '1' : '0',
      },
    });
  }

  function onInvalidSubmit(): void {
    Alert.alert(
      t('onboardingLocalIdentityInvalidTitle'),
      t('onboardingLocalIdentityInvalidMessage')
    );
  }

  const onSubmit = handleSubmit(onValidSubmit, onInvalidSubmit);

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <OnboardingHeader
        onBack={() => router.back()}
        step={3}
        testIDPrefix="onboarding-local-identity"
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="flex-grow px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2 overflow-hidden rounded-2xl bg-primary-fixed/50 px-4 py-2 dark:bg-primary/20">
          <View className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-primary/12 dark:bg-primary-bright/18" />
          <Text className="mb-0.5 text-center text-[22px] font-extrabold leading-7 text-text dark:text-text-primary-dark">
            {t('onboardingLocalIdentityTitle')}
          </Text>
          <Text className="text-center text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('onboardingLocalIdentitySubtitle')}
          </Text>
        </View>

        <View
          className="mb-3 rounded-3xl border border-border bg-white p-4 dark:border-dark-border dark:bg-dark-bg-card"
          style={shadows.level4}
        >
          <View className="mb-3 flex-row items-start gap-3">
            <View className="size-9 items-center justify-center rounded-full bg-secondary-fixed/45 dark:bg-secondary/25">
              <MapPin
                className="text-secondary dark:text-secondary-fixed"
                size={16}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[16px] font-bold leading-6 text-text dark:text-text-primary-dark">
                  {t('onboardingLocalIdentityRegionalAccessTitle')}
                </Text>
                <InfoDot
                  accessibilityHint={t('onboardingInfoButtonHint')}
                  accessibilityLabel={t('onboardingInfoButtonLabel')}
                  onPress={() =>
                    showInfoAlert(
                      t('onboardingLocalIdentityRegionalAccessInfoTitle'),
                      t('onboardingLocalIdentityRegionalAccessInfoMessage')
                    )
                  }
                  size="sm"
                  testID="onboarding-local-identity-regional-info"
                />
              </View>
              <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                {t('onboardingLocalIdentityRegionalAccessDescription')}
              </Text>
            </View>
          </View>

          <Controller
            control={control}
            name="residencyStatus"
            render={({ field }) => {
              const isCitizenSelected = field.value === 'citizen';
              const isVisitorSelected = field.value === 'visitor';

              return (
                <View className="gap-2">
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isCitizenSelected }}
                    className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                      isCitizenSelected
                        ? 'border-primary bg-primary/5 dark:border-primary-bright dark:bg-primary-bright/15'
                        : 'border-border bg-surface dark:border-dark-border dark:bg-dark-bg-elevated'
                    }`}
                    onPress={() => field.onChange('citizen')}
                    testID="onboarding-local-identity-citizen"
                  >
                    <View
                      className={`size-5 items-center justify-center rounded-full border-2 ${
                        isCitizenSelected
                          ? 'border-primary dark:border-primary-bright'
                          : 'border-border dark:border-dark-border'
                      }`}
                    >
                      {isCitizenSelected ? (
                        <Check
                          className="text-primary dark:text-primary-bright"
                          size={12}
                        />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                        {t('onboardingLocalIdentityCitizenTitle')}
                      </Text>
                      <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                        {t('onboardingLocalIdentityCitizenDescription')}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isVisitorSelected }}
                    className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                      isVisitorSelected
                        ? 'border-primary bg-primary/5 dark:border-primary-bright dark:bg-primary-bright/15'
                        : 'border-border bg-surface dark:border-dark-border dark:bg-dark-bg-elevated'
                    }`}
                    onPress={() => field.onChange('visitor')}
                    testID="onboarding-local-identity-visitor"
                  >
                    <View
                      className={`size-5 items-center justify-center rounded-full border-2 ${
                        isVisitorSelected
                          ? 'border-primary dark:border-primary-bright'
                          : 'border-border dark:border-dark-border'
                      }`}
                    >
                      {isVisitorSelected ? (
                        <Check
                          className="text-primary dark:text-primary-bright"
                          size={12}
                        />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                        {t('onboardingLocalIdentityVisitorTitle')}
                      </Text>
                      <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                        {t('onboardingLocalIdentityVisitorDescription')}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>

        <View className="mb-3">
          <View className="mb-2 flex-row items-center gap-2 px-1">
            <View className="h-px flex-1 bg-border/60 dark:bg-dark-border/70" />
            <Text className="text-[10px] font-bold uppercase tracking-[3px] text-text-muted dark:text-text-muted-dark">
              {t('onboardingLocalIdentityLegalConsentsTitle')}
            </Text>
            <View className="h-px flex-1 bg-border/60 dark:bg-dark-border/70" />
          </View>

          <View className="gap-2">
            <Controller
              control={control}
              name="acceptedTerms"
              render={({ field }) => (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: field.value }}
                  className="rounded-2xl border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card"
                  onPress={() => field.onChange(!field.value)}
                  testID="onboarding-local-identity-terms"
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className={`mt-0.5 size-5 items-center justify-center rounded-md border ${
                        field.value
                          ? 'border-primary bg-primary dark:border-primary-bright dark:bg-primary-bright'
                          : 'border-border dark:border-dark-border'
                      }`}
                    >
                      {field.value ? <Check color="#fff" size={12} /> : null}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-[14px] font-semibold leading-5 text-text dark:text-text-primary-dark">
                          {t('onboardingLocalIdentityTermsTitle')}
                        </Text>
                        <InfoDot
                          accessibilityHint={t('onboardingInfoButtonHint')}
                          accessibilityLabel={t('onboardingInfoButtonLabel')}
                          onPress={() =>
                            showInfoAlert(
                              t('onboardingLocalIdentityTermsInfoTitle'),
                              t('onboardingLocalIdentityTermsInfoMessage')
                            )
                          }
                          size="sm"
                          testID="onboarding-local-identity-terms-info"
                        />
                      </View>
                      <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                        {t('onboardingLocalIdentityTermsDescriptionPrefix')}{' '}
                        <Text className="text-primary dark:text-primary-bright">
                          {t('onboardingLocalIdentityTermsLinkText')}
                        </Text>{' '}
                        {t('onboardingLocalIdentityTermsDescriptionSuffix')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />

            <Controller
              control={control}
              name="acceptedPrivacyPolicy"
              render={({ field }) => (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: field.value }}
                  className="rounded-2xl border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card"
                  onPress={() => field.onChange(!field.value)}
                  testID="onboarding-local-identity-privacy"
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className={`mt-0.5 size-5 items-center justify-center rounded-md border ${
                        field.value
                          ? 'border-primary bg-primary dark:border-primary-bright dark:bg-primary-bright'
                          : 'border-border dark:border-dark-border'
                      }`}
                    >
                      {field.value ? <Check color="#fff" size={12} /> : null}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-[14px] font-semibold leading-5 text-text dark:text-text-primary-dark">
                          {t('onboardingLocalIdentityPrivacyTitle')}
                        </Text>
                        <InfoDot
                          accessibilityHint={t('onboardingInfoButtonHint')}
                          accessibilityLabel={t('onboardingInfoButtonLabel')}
                          onPress={() =>
                            showInfoAlert(
                              t('onboardingLocalIdentityPrivacyInfoTitle'),
                              t('onboardingLocalIdentityPrivacyInfoMessage')
                            )
                          }
                          size="sm"
                          testID="onboarding-local-identity-privacy-info"
                        />
                      </View>
                      <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                        {t('onboardingLocalIdentityPrivacyDescriptionPrefix')}{' '}
                        <Text className="text-primary dark:text-primary-bright">
                          {t('onboardingLocalIdentityPrivacyLinkText')}
                        </Text>{' '}
                        {t('onboardingLocalIdentityPrivacyDescriptionSuffix')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>

        <View className="mt-auto">
          <Pressable
            accessibilityRole="button"
            className="overflow-hidden rounded-full"
            onPress={onSubmit}
            testID="onboarding-local-identity-continue"
          >
            <LinearGradient
              colors={[Colors.primary, '#C2185B']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={{
                alignItems: 'center',
                borderRadius: 999,
                height: 50,
                justifyContent: 'center',
              }}
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-[16px] font-bold text-white">
                  {t('onboardingLocalIdentityContinue')}
                </Text>
                <ArrowRight color="#ffffff" size={20} />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
