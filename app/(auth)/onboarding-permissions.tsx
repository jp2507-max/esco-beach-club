import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Bell, Check, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { InfoDot } from '@/src/components/ui';
import { motion, withRM } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { ensureVenueUpsellNotificationChannel } from '@/src/lib/notifications';
import { shadows } from '@/src/lib/styles/shadows';
import { readSingleSearchParam } from '@/src/lib/utils/search-params';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type OnboardingPermissionsSearchParams = {
  onboardingDateOfBirth?: string | string[];
  onboardingDisplayName?: string | string[];
  onboardingLocationPermissionStatus?: string | string[];
  onboardingPrivacyAccepted?: string | string[];
  onboardingPushPermissionStatus?: string | string[];
  onboardingSegment?: string | string[];
  onboardingTermsAccepted?: string | string[];
};

function parseOnboardingPermissionStatus(
  value: string | string[] | undefined
): OnboardingPermissionStatus {
  const normalized = readSingleSearchParam(value)?.trim().toUpperCase();

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

function mapExpoPermissionStatus(
  status: string | null | undefined
): OnboardingPermissionStatus {
  const normalized = status?.trim().toLowerCase();

  if (normalized === 'granted') {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === 'denied') {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

const TITLE_DELAY = 80;
const CARD_BASE_DELAY = 200;
const CARD_STAGGER = 140;
const CTA_DELAY = 540;

export default function OnboardingPermissionsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const searchParams =
    useLocalSearchParams<OnboardingPermissionsSearchParams>();
  const ctaButton = useButtonPress();

  const [locationStatus, setLocationStatus] =
    React.useState<OnboardingPermissionStatus>(
      parseOnboardingPermissionStatus(
        searchParams.onboardingLocationPermissionStatus
      )
    );
  const [pushStatus, setPushStatus] =
    React.useState<OnboardingPermissionStatus>(
      parseOnboardingPermissionStatus(
        searchParams.onboardingPushPermissionStatus
      )
    );
  const [isRequestingLocation, setIsRequestingLocation] =
    React.useState<boolean>(false);
  const [isRequestingPush, setIsRequestingPush] =
    React.useState<boolean>(false);

  const isBusy = isRequestingLocation || isRequestingPush;

  React.useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [foregroundLocationPermission, notificationsPermission] =
          await Promise.all([
            Location.getForegroundPermissionsAsync(),
            Notifications.getPermissionsAsync(),
          ]);

        if (!isMounted) return;

        setLocationStatus(
          mapExpoPermissionStatus(foregroundLocationPermission.status)
        );
        setPushStatus(mapExpoPermissionStatus(notificationsPermission.status));
      } catch {
        // Keep the search-param defaults when the current device state
        // cannot be read yet.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  function showInfoAlert(title: string, message: string): void {
    Alert.alert(title, message);
  }

  const baseParams = React.useMemo(
    () => ({
      onboardingDateOfBirth:
        readSingleSearchParam(searchParams.onboardingDateOfBirth) ?? '',
      onboardingDisplayName:
        readSingleSearchParam(searchParams.onboardingDisplayName) ?? '',
      onboardingPrivacyAccepted:
        readSingleSearchParam(searchParams.onboardingPrivacyAccepted) ?? '0',
      onboardingSegment:
        readSingleSearchParam(searchParams.onboardingSegment) ?? '',
      onboardingTermsAccepted:
        readSingleSearchParam(searchParams.onboardingTermsAccepted) ?? '0',
    }),
    [
      searchParams.onboardingDateOfBirth,
      searchParams.onboardingDisplayName,
      searchParams.onboardingPrivacyAccepted,
      searchParams.onboardingSegment,
      searchParams.onboardingTermsAccepted,
    ]
  );

  function statusLabel(status: OnboardingPermissionStatus): string {
    if (status === onboardingPermissionStatuses.granted) {
      return t('onboardingPermissionsStatusGranted');
    }

    if (status === onboardingPermissionStatuses.denied) {
      return t('onboardingPermissionsStatusDenied');
    }

    return t('onboardingPermissionsStatusUndetermined');
  }

  function actionLabel(status: OnboardingPermissionStatus): string {
    if (status === onboardingPermissionStatuses.granted) {
      return t('onboardingPermissionsActionEnabled');
    }

    if (status === onboardingPermissionStatuses.denied) {
      return t('onboardingPermissionsActionRetry');
    }

    return t('onboardingPermissionsActionAllow');
  }

  function resolveEffectiveLocationStatus(): OnboardingPermissionStatus {
    return locationStatus;
  }

  async function confirmBackgroundLocationRequest(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        t('onboardingPermissionsBackgroundPromptTitle'),
        t('onboardingPermissionsBackgroundPromptMessage'),
        [
          {
            text: t('onboardingPermissionsBackgroundPromptLater'),
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: t('onboardingPermissionsBackgroundPromptContinue'),
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  async function requestLocationPermission(): Promise<void> {
    if (isBusy) return;
    setIsRequestingLocation(true);

    try {
      let nextLocationStatus = mapExpoPermissionStatus(
        (await Location.getForegroundPermissionsAsync()).status
      );

      if (nextLocationStatus !== onboardingPermissionStatuses.granted) {
        nextLocationStatus = mapExpoPermissionStatus(
          (await Location.requestForegroundPermissionsAsync()).status
        );
      }

      setLocationStatus(nextLocationStatus);

      if (nextLocationStatus !== onboardingPermissionStatuses.granted) {
        return;
      }

      const currentBackgroundPermission =
        await Location.getBackgroundPermissionsAsync();
      const currentBackgroundStatus = mapExpoPermissionStatus(
        currentBackgroundPermission.status
      );

      if (currentBackgroundStatus === onboardingPermissionStatuses.granted) {
        return;
      }

      const shouldRequestBackground = await confirmBackgroundLocationRequest();

      if (!shouldRequestBackground) {
        return;
      }

      await Location.requestBackgroundPermissionsAsync();
    } catch {
      Alert.alert(
        t('onboardingPermissionsErrorTitle'),
        t('onboardingPermissionsErrorMessage')
      );
    } finally {
      setIsRequestingLocation(false);
    }
  }

  async function requestPushPermission(): Promise<void> {
    if (isBusy) return;
    setIsRequestingPush(true);

    try {
      await ensureVenueUpsellNotificationChannel();
      const currentPermission = await Notifications.getPermissionsAsync();

      if (currentPermission.status === 'granted') {
        setPushStatus(onboardingPermissionStatuses.granted);
        return;
      }

      const requestedPermission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      setPushStatus(mapExpoPermissionStatus(requestedPermission.status));
    } catch {
      Alert.alert(
        t('onboardingPermissionsErrorTitle'),
        t('onboardingPermissionsErrorMessage')
      );
    } finally {
      setIsRequestingPush(false);
    }
  }

  function continueToFinalDetails(params: {
    location: OnboardingPermissionStatus;
    push: OnboardingPermissionStatus;
  }): void {
    router.push({
      pathname: './onboarding-final-details',
      params: {
        ...baseParams,
        onboardingLocationPermissionStatus: params.location,
        onboardingPushPermissionStatus: params.push,
      },
    });
  }

  function handleNavigateNext(): void {
    const effectiveLocationStatus = resolveEffectiveLocationStatus();

    continueToFinalDetails({
      location: effectiveLocationStatus,
      push: pushStatus,
    });
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <OnboardingHeader
        onBack={() => router.back()}
        step={4}
        testIDPrefix="onboarding-permissions"
      />

      <View className="flex-1 px-5 pb-6">
        <Animated.View
          entering={withRM(FadeIn.duration(motion.dur.md).delay(TITLE_DELAY))}
          className="mb-3 rounded-2xl bg-primary-fixed/45 px-4 py-2 dark:bg-primary/20"
        >
          <Text className="text-center text-[24px] font-extrabold leading-7 text-text dark:text-text-primary-dark">
            {t('onboardingPermissionsTitle')}
          </Text>
          <Text className="mt-0.5 text-center text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('onboardingPermissionsSubtitle')}
          </Text>
        </Animated.View>

        <View className="gap-2.5">
          <Animated.View
            entering={withRM(
              FadeInUp.springify()
                .damping(18)
                .stiffness(140)
                .delay(CARD_BASE_DELAY)
            )}
            className="rounded-2xl border border-border bg-white p-4 dark:border-dark-border dark:bg-dark-bg-card"
            style={shadows.level2}
          >
            <View className="mb-3 flex-row items-start justify-between gap-2">
              <View className="flex-1 flex-row items-start gap-2.5">
                <View className="size-9 items-center justify-center rounded-full bg-secondary-fixed/45 dark:bg-secondary/25">
                  <MapPin
                    className="text-secondary dark:text-secondary-fixed"
                    size={16}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[15px] font-bold leading-5 text-text dark:text-text-primary-dark">
                      {t('onboardingFinalDetailsLocationTitle')}
                    </Text>
                    <InfoDot
                      accessibilityHint={t('onboardingInfoButtonHint')}
                      accessibilityLabel={t('onboardingInfoButtonLabel')}
                      onPress={() =>
                        showInfoAlert(
                          t('onboardingPermissionsLocationInfoTitle'),
                          t('onboardingPermissionsLocationInfoMessage')
                        )
                      }
                      size="sm"
                      testID="onboarding-permissions-location-info"
                    />
                  </View>
                  <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                    {t('onboardingFinalDetailsLocationDescription')}
                  </Text>
                </View>
              </View>

              <View className="rounded-full bg-primary/10 px-2.5 py-1 dark:bg-primary-bright/20">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary dark:text-primary-bright">
                  {statusLabel(resolveEffectiveLocationStatus())}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="overflow-hidden rounded-full"
              disabled={isBusy}
              onPress={requestLocationPermission}
              testID="onboarding-permissions-enable-location"
            >
              <LinearGradient
                colors={[Colors.secondary, '#00796B']}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={{
                  alignItems: 'center',
                  borderRadius: 999,
                  height: 44,
                  justifyContent: 'center',
                }}
              >
                {isRequestingLocation ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[14px] font-bold text-white">
                    {actionLabel(resolveEffectiveLocationStatus())}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {resolveEffectiveLocationStatus() ===
            onboardingPermissionStatuses.denied ? (
              <Pressable
                accessibilityRole="button"
                className="mt-2 items-center"
                onPress={() => void Linking.openSettings()}
                testID="onboarding-permissions-open-settings-location"
              >
                <Text className="text-[13px] font-semibold text-secondary dark:text-secondary-fixed">
                  {t('onboardingPermissionsOpenSettings')}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={withRM(
              FadeInUp.springify()
                .damping(18)
                .stiffness(140)
                .delay(CARD_BASE_DELAY + CARD_STAGGER)
            )}
            className="rounded-2xl border border-border bg-white p-4 dark:border-dark-border dark:bg-dark-bg-card"
            style={shadows.level2}
          >
            <View className="mb-3 flex-row items-start justify-between gap-2">
              <View className="flex-1 flex-row items-start gap-2.5">
                <View className="size-9 items-center justify-center rounded-full bg-primary-fixed dark:bg-primary/20">
                  <Bell
                    className="text-primary dark:text-primary-bright"
                    size={16}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[15px] font-bold leading-5 text-text dark:text-text-primary-dark">
                      {t('onboardingFinalDetailsNotificationsTitle')}
                    </Text>
                    <InfoDot
                      accessibilityHint={t('onboardingInfoButtonHint')}
                      accessibilityLabel={t('onboardingInfoButtonLabel')}
                      onPress={() =>
                        showInfoAlert(
                          t('onboardingPermissionsNotificationsInfoTitle'),
                          t('onboardingPermissionsNotificationsInfoMessage')
                        )
                      }
                      size="sm"
                      testID="onboarding-permissions-notifications-info"
                    />
                  </View>
                  <Text className="text-[12px] leading-4 text-text-secondary dark:text-text-secondary-dark">
                    {t('onboardingFinalDetailsNotificationsDescription')}
                  </Text>
                </View>
              </View>

              <View className="rounded-full bg-primary/10 px-2.5 py-1 dark:bg-primary-bright/20">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary dark:text-primary-bright">
                  {statusLabel(pushStatus)}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="overflow-hidden rounded-full"
              disabled={isBusy}
              onPress={requestPushPermission}
              testID="onboarding-permissions-enable-push"
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={{
                  alignItems: 'center',
                  borderRadius: 999,
                  height: 44,
                  justifyContent: 'center',
                }}
              >
                {isRequestingPush ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[14px] font-bold text-white">
                    {actionLabel(pushStatus)}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {pushStatus === onboardingPermissionStatuses.denied ? (
              <Pressable
                accessibilityRole="button"
                className="mt-2 items-center"
                onPress={() => void Linking.openSettings()}
                testID="onboarding-permissions-open-settings-push"
              >
                <Text className="text-[13px] font-semibold text-secondary dark:text-secondary-fixed">
                  {t('onboardingPermissionsOpenSettings')}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View
          entering={withRM(FadeInUp.duration(motion.dur.md).delay(CTA_DELAY))}
          className="mt-auto gap-3"
        >
          <Animated.View style={ctaButton.animatedStyle}>
            <Pressable
              accessibilityRole="button"
              className="overflow-hidden rounded-full"
              disabled={isBusy}
              onPress={handleNavigateNext}
              onPressIn={ctaButton.handlePressIn}
              onPressOut={ctaButton.handlePressOut}
              testID="onboarding-permissions-continue"
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
                    {t('onboardingPermissionsContinue')}
                  </Text>
                  <ArrowRight color="#ffffff" size={22} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            className="items-center"
            disabled={isBusy}
            onPress={handleNavigateNext}
            testID="onboarding-permissions-not-now"
          >
            <Text className="text-[16px] font-bold text-secondary dark:text-secondary-fixed">
              {t('onboardingPermissionsNotNow')}
            </Text>
          </Pressable>

          <Animated.View
            entering={withRM(
              FadeIn.duration(motion.dur.md).delay(CTA_DELAY + 120)
            )}
            className="flex-row items-center justify-center gap-2"
          >
            <Check
              className="text-primary dark:text-primary-bright"
              size={14}
            />
            <Text className="text-[12px] text-text-muted dark:text-text-muted-dark">
              {t('onboardingPermissionsPrivacyNote')}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
