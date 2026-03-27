import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Sparkles, Ticket } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { updateProfile } from '@/lib/api';
import { onboardingPermissionStatuses } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useProfileData } from '@/providers/DataProvider';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { Pressable, Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

const WELCOME_COCKTAIL_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB6oK4M5GAEAukmyL4P-fxWGcieV8vOhAhVYjyrF1Jr46L3mySepBDndcXRdhdc1tAzZ5WIxmdQJsAUBN2fGXSNBnd5SFLWdksutc6ObMR_yw_fuIjHEucVvyZErUVjOd0HRufWgBdDdaKejA8KX_eSNt_fxHrfF1waZijjj1Rx_OCJrX0uchXHN9J7zJ3ZoNr7vU-DZQlbsepHsxBTCz7WSQnczqLyGpH0p3IhVqSGo1FUYjKdyKPHdiRp8X1Bljuvhyuhv5K5Zv2e';

type OnboardingLocalIdentityParams = {
  onboardingDateOfBirth?: string | string[];
  onboardingDisplayName?: string | string[];
  onboardingLocationPermissionStatus?: string | string[];
  onboardingPrivacyAccepted?: string | string[];
  onboardingPushPermissionStatus?: string | string[];
  onboardingResident?: string | string[];
  onboardingTermsAccepted?: string | string[];
};

function parseBooleanSearchParam(
  value: string | string[] | undefined
): boolean | undefined {
  const normalized = readSingleSearchParam(value)?.trim().toLowerCase();

  if (normalized === '1' || normalized === 'true') {
    return true;
  }

  if (normalized === '0' || normalized === 'false') {
    return false;
  }

  return undefined;
}

function parsePermissionStatusSearchParam(
  value: string | string[] | undefined
):
  | typeof onboardingPermissionStatuses.granted
  | typeof onboardingPermissionStatuses.denied
  | typeof onboardingPermissionStatuses.undetermined {
  const normalized = readSingleSearchParam(value)?.trim().toUpperCase();

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

function readSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function OnboardingFinalDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfileData();
  const { t } = useTranslation('auth');
  const searchParams = useLocalSearchParams<OnboardingLocalIdentityParams>();

  async function persistAuthenticatedOnboardingChoices(
    isSetupCompleted: boolean
  ): Promise<void> {
    if (!user?.id) return;

    const onboardingDisplayName = readSingleSearchParam(
      searchParams.onboardingDisplayName
    )
      ?.trim()
      .replace(/\s+/g, ' ');
    const onboardingDateOfBirth = readSingleSearchParam(
      searchParams.onboardingDateOfBirth
    )?.trim();
    const isDanangCitizen = parseBooleanSearchParam(
      searchParams.onboardingResident
    );
    const locationPermissionStatus = parsePermissionStatusSearchParam(
      searchParams.onboardingLocationPermissionStatus
    );
    const pushNotificationPermissionStatus = parsePermissionStatusSearchParam(
      searchParams.onboardingPushPermissionStatus
    );

    const resolvedLocationPermissionStatus =
      locationPermissionStatus === onboardingPermissionStatuses.undetermined &&
      profile?.location_permission_status &&
      profile.location_permission_status !==
        onboardingPermissionStatuses.undetermined
        ? profile.location_permission_status
        : locationPermissionStatus;
    const resolvedPushPermissionStatus =
      pushNotificationPermissionStatus ===
        onboardingPermissionStatuses.undetermined &&
      profile?.push_notification_permission_status &&
      profile.push_notification_permission_status !==
        onboardingPermissionStatuses.undetermined
        ? profile.push_notification_permission_status
        : pushNotificationPermissionStatus;

    await updateProfile(user.id, {
      ...(onboardingDateOfBirth
        ? { date_of_birth: onboardingDateOfBirth }
        : {}),
      ...(onboardingDisplayName && onboardingDisplayName.length >= 2
        ? { full_name: onboardingDisplayName }
        : {}),
      ...(isDanangCitizen !== undefined
        ? { is_danang_citizen: isDanangCitizen }
        : {}),
      location_permission_status: resolvedLocationPermissionStatus,
      push_notification_permission_status: resolvedPushPermissionStatus,
      ...(isSetupCompleted
        ? { onboarding_completed_at: new Date().toISOString() }
        : {}),
    });
  }

  async function navigateToSignup(isSetupCompleted: boolean): Promise<void> {
    if (isAuthenticated) {
      try {
        await persistAuthenticatedOnboardingChoices(isSetupCompleted);
      } catch (error: unknown) {
        console.error(
          '[OnboardingFinalDetails] Failed to persist onboarding updates:',
          {
            error,
          }
        );
        Alert.alert(
          t('onboardingPermissionsErrorTitle'),
          t('onboardingPermissionsErrorMessage')
        );
        return;
      }

      router.replace('/profile');
      return;
    }

    const onboardingDateOfBirth = readSingleSearchParam(
      searchParams.onboardingDateOfBirth
    );
    const onboardingDisplayName = readSingleSearchParam(
      searchParams.onboardingDisplayName
    );

    const onboardingPrivacyAccepted = readSingleSearchParam(
      searchParams.onboardingPrivacyAccepted
    );
    const onboardingResident = readSingleSearchParam(
      searchParams.onboardingResident
    );
    const onboardingTermsAccepted = readSingleSearchParam(
      searchParams.onboardingTermsAccepted
    );
    const onboardingLocationPermissionStatus = readSingleSearchParam(
      searchParams.onboardingLocationPermissionStatus
    );
    const onboardingPushPermissionStatus = readSingleSearchParam(
      searchParams.onboardingPushPermissionStatus
    );

    router.push({
      pathname: '/signup',
      params: {
        ...(onboardingDateOfBirth ? { onboardingDateOfBirth } : {}),
        ...(onboardingDisplayName ? { onboardingDisplayName } : {}),
        ...(onboardingPrivacyAccepted
          ? { onboardingPrivacyAccepted }
          : { onboardingPrivacyAccepted: '0' }),
        ...(onboardingResident
          ? { onboardingResident }
          : { onboardingResident: '0' }),
        ...(onboardingTermsAccepted
          ? { onboardingTermsAccepted }
          : { onboardingTermsAccepted: '0' }),
        ...(onboardingLocationPermissionStatus
          ? {
              onboardingLocationPermissionStatus,
            }
          : {
              onboardingLocationPermissionStatus:
                onboardingPermissionStatuses.undetermined,
            }),
        ...(onboardingPushPermissionStatus
          ? {
              onboardingPushPermissionStatus,
            }
          : {
              onboardingPushPermissionStatus:
                onboardingPermissionStatuses.undetermined,
            }),
        ...(isSetupCompleted
          ? {
              onboardingCompletedSetup: '1',
            }
          : { onboardingCompletedSetup: '0' }),
      },
    });
  }

  function handleCompleteSetup(): void {
    void navigateToSignup(true);
  }

  function handleDoThisLater(): void {
    void navigateToSignup(false);
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <LinearGradient
        colors={[
          'rgba(251,249,241,0.98)',
          'rgba(251,249,241,0.98)',
          'rgba(117,87,0,0.05)',
        ]}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />

      <View className="pointer-events-none absolute inset-0 opacity-45">
        <View className="absolute left-10 top-20 size-4 rounded-full bg-primary/50" />
        <View className="absolute right-16 top-55 size-3 rounded-sm bg-secondary/50" />
        <View className="absolute left-24 top-120 h-5 w-2 rounded-full bg-warning/45" />
        <View className="absolute right-24 top-110 size-3 rounded-full bg-primary/40" />
        <View className="absolute bottom-20 right-8 size-6 rounded-full bg-border/70 dark:bg-dark-border/60" />
      </View>

      <OnboardingHeader
        onBack={() => router.back()}
        step={5}
        testIDPrefix="onboarding-final-details"
      />

      <View className="flex-1 px-6 pb-12">
        <View className="items-center">
          <View className="mb-4 size-14 items-center justify-center rounded-full bg-primary-fixed dark:bg-primary/20">
            <Sparkles
              className="text-primary dark:text-primary-bright"
              size={24}
            />
          </View>

          <Text className="text-center text-[32px] font-extrabold leading-9 text-text dark:text-text-primary-dark">
            {t('onboardingClubWelcomeTitle')}
          </Text>

          <Text className="mt-3 px-2 text-center text-[15px] leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('onboardingClubWelcomeSubtitle')}
          </Text>
        </View>

        <View className="mt-6 overflow-hidden rounded-[36px] border border-border/70 bg-white/92 p-5 dark:border-dark-border dark:bg-dark-bg-card/90">
          <Image
            className="absolute inset-0 h-full w-full opacity-14"
            source={{ uri: WELCOME_COCKTAIL_IMAGE_URI }}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={180}
          />

          <View className="relative z-10 items-center">
            <Text className="text-[12px] font-bold uppercase tracking-[4px] text-secondary dark:text-secondary-fixed">
              {t('onboardingClubValueLabel')}
            </Text>

            <Text className="mt-3 text-center text-[26px] font-bold leading-8 text-text dark:text-text-primary-dark">
              {t('onboardingClubRewardTitle')}
            </Text>

            <View className="mt-5 w-full rounded-[30px] border-2 border-dashed border-border-light bg-surface-container-low px-4 py-3 dark:border-dark-border dark:bg-dark-bg-elevated">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="size-16 items-center justify-center rounded-xl bg-primary dark:bg-primary-bright">
                    <Ticket color="#ffffff" size={22} />
                  </View>

                  <View>
                    <Text className="text-[17px] font-bold text-text dark:text-text-primary-dark">
                      {t('onboardingClubVoucherCode')}
                    </Text>
                    <Text className="text-[13px] text-text-secondary dark:text-text-secondary-dark">
                      {t('onboardingClubVoucherValidity')}
                    </Text>
                  </View>
                </View>

                <View className="size-12 rounded-md border border-border/80 dark:border-dark-border" />
              </View>
            </View>

            <Text className="mt-5 px-2 text-center text-[14px] leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('onboardingClubVoucherInstruction')}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-8 overflow-hidden rounded-full"
          onPress={handleCompleteSetup}
          testID="onboarding-final-details-complete"
        >
          <LinearGradient
            colors={['#BC004B', '#C00053', '#A5004B']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={{
              alignItems: 'center',
              borderRadius: 999,
              height: 54,
              justifyContent: 'center',
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-[17px] font-bold text-white">
                {t('onboardingClubPrimaryCta')}
              </Text>
              <ArrowRight color="#ffffff" size={22} />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="mt-5 items-center"
          onPress={handleDoThisLater}
          testID="onboarding-final-details-later"
        >
          <Text className="text-[16px] font-bold text-secondary dark:text-secondary-fixed">
            {t('onboardingClubSecondaryCta')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
