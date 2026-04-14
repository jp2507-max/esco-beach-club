import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
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
import { hapticLight, hapticSuccess } from '@/src/lib/haptics/haptics';
import {
  resolvePushPermissionStatus,
  toOnboardingPermissionStatus,
} from '@/src/lib/mappers';
import { ensureVenueUpsellNotificationChannel } from '@/src/lib/notifications';
import { shadows } from '@/src/lib/styles/shadows';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

function mapExpoPermissionStatus(
  status: string | null | undefined
): OnboardingPermissionStatus {
  return toOnboardingPermissionStatus(status);
}

const TITLE_DELAY = 50;
const CARD_BASE_DELAY = 140;
const CARD_STAGGER = 100;
const CTA_DELAY = 320;

export default function OnboardingPermissionsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const ctaButton = useButtonPress();
  const signupDraft = useSignupOnboardingDraftStore((state) => state.draft);
  const setSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.setDraft
  );

  const [locationStatus, setLocationStatus] =
    React.useState<OnboardingPermissionStatus>(
      signupDraft.locationPermissionStatus ??
        onboardingPermissionStatuses.undetermined
    );
  const [pushStatus, setPushStatus] =
    React.useState<OnboardingPermissionStatus>(
      signupDraft.pushNotificationPermissionStatus ??
        onboardingPermissionStatuses.undetermined
    );
  const [isRequestingLocation, setIsRequestingLocation] =
    React.useState<boolean>(false);
  const [isRequestingPush, setIsRequestingPush] =
    React.useState<boolean>(false);

  const isBusy = isRequestingLocation || isRequestingPush;
  const isLocationPermissionCtaDisabled =
    isBusy ||
    resolveEffectiveLocationStatus() === onboardingPermissionStatuses.granted;
  const isPushPermissionCtaDisabled = isBusy;
  const statusLabelByStatus = React.useMemo<
    Record<OnboardingPermissionStatus, string>
  >(
    () => ({
      [onboardingPermissionStatuses.denied]: t(
        'onboardingPermissionsStatusDenied'
      ),
      [onboardingPermissionStatuses.granted]: t(
        'onboardingPermissionsStatusGranted'
      ),
      [onboardingPermissionStatuses.undetermined]: t(
        'onboardingPermissionsStatusUndetermined'
      ),
    }),
    [t]
  );
  const actionLabelByStatus = React.useMemo<
    Record<OnboardingPermissionStatus, string>
  >(
    () => ({
      [onboardingPermissionStatuses.denied]: t(
        'onboardingPermissionsActionRetry'
      ),
      [onboardingPermissionStatuses.granted]: t(
        'onboardingPermissionsActionEnabled'
      ),
      [onboardingPermissionStatuses.undetermined]: t(
        'onboardingPermissionsActionAllow'
      ),
    }),
    [t]
  );

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
        setPushStatus(resolvePushPermissionStatus(notificationsPermission));
      } catch {
        // Keep the in-memory onboarding draft values when the current device
        // state cannot be read yet.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  function showInfoAlert(title: string, message: string): void {
    Alert.alert(title, message);
  }

  function showPushSettingsFallbackAlert(): void {
    Alert.alert(
      t('onboardingPermissionsErrorTitle'),
      t('onboardingPermissionsErrorMessage'),
      [
        {
          text: t('onboardingPermissionsNotNow'),
          style: 'cancel',
        },
        {
          text: t('onboardingPermissionsOpenSettings'),
          onPress: () => void Linking.openSettings(),
        },
      ]
    );
  }

  function showPushAlreadyEnabledAlert(): void {
    Alert.alert(
      t('onboardingPermissionsPushAlreadyEnabledTitle'),
      t('onboardingPermissionsPushAlreadyEnabledMessage'),
      [
        {
          text: t('onboardingPermissionsNotNow'),
          style: 'cancel',
        },
        {
          text: t('onboardingPermissionsOpenSettings'),
          onPress: () => void Linking.openSettings(),
        },
      ]
    );
  }

  function statusLabel(status: OnboardingPermissionStatus): string {
    return (
      statusLabelByStatus[status] ??
      statusLabelByStatus[onboardingPermissionStatuses.undetermined]
    );
  }

  function actionLabel(status: OnboardingPermissionStatus): string {
    return (
      actionLabelByStatus[status] ??
      actionLabelByStatus[onboardingPermissionStatuses.undetermined]
    );
  }

  function pushActionLabel(): string {
    if (pushStatus === onboardingPermissionStatuses.granted) {
      return t('onboardingPermissionsActionManage');
    }

    return actionLabel(pushStatus);
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

      if (nextLocationStatus === onboardingPermissionStatuses.granted) {
        hapticSuccess();
      }

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
      const currentPushStatus = resolvePushPermissionStatus(currentPermission);

      if (__DEV__) {
        console.info('[OnboardingPermissions] Current push permission:', {
          canAskAgain: currentPermission.canAskAgain,
          granted: currentPermission.granted,
          iosStatus: currentPermission.ios?.status,
          status: currentPermission.status,
        });
      }

      setPushStatus(currentPushStatus);

      if (currentPushStatus === onboardingPermissionStatuses.granted) {
        hapticSuccess();
        showPushAlreadyEnabledAlert();
        return;
      }

      const refreshedPermission = await Notifications.requestPermissionsAsync();

      if (__DEV__) {
        console.info('[OnboardingPermissions] Refreshed push permission:', {
          canAskAgain: refreshedPermission.canAskAgain,
          granted: refreshedPermission.granted,
          iosStatus: refreshedPermission.ios?.status,
          status: refreshedPermission.status,
        });
      }

      const mappedPush = resolvePushPermissionStatus(refreshedPermission);

      if (
        mappedPush === onboardingPermissionStatuses.undetermined &&
        !refreshedPermission.canAskAgain
      ) {
        setPushStatus(onboardingPermissionStatuses.denied);
        showPushSettingsFallbackAlert();
        return;
      }

      setPushStatus(mappedPush);
      if (mappedPush === onboardingPermissionStatuses.granted) {
        hapticSuccess();
        return;
      }
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
    setSignupDraft({
      locationPermissionStatus: params.location,
      pushNotificationPermissionStatus: params.push,
    });
    router.push('./onboarding-final-details');
  }

  function handleNavigateNext(): void {
    hapticLight();
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
              accessibilityState={{ disabled: isLocationPermissionCtaDisabled }}
              className="overflow-hidden rounded-full"
              disabled={isLocationPermissionCtaDisabled}
              onPress={requestLocationPermission}
              testID="onboarding-permissions-enable-location"
            >
              <LinearGradient
                colors={[Colors.secondary, Colors.secondaryDark]}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={{
                  alignItems: 'center',
                  borderRadius: 999,
                  height: 44,
                  justifyContent: 'center',
                  opacity: isLocationPermissionCtaDisabled ? 0.5 : 1,
                }}
              >
                {isRequestingLocation ? (
                  <ActivityIndicator color={Colors.white} />
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
              accessibilityState={{ disabled: isPushPermissionCtaDisabled }}
              className="overflow-hidden rounded-full"
              disabled={isPushPermissionCtaDisabled}
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
                  opacity: isPushPermissionCtaDisabled ? 0.5 : 1,
                }}
              >
                {isRequestingPush ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text className="text-[14px] font-bold text-white">
                    {pushActionLabel()}
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
          entering={withRM(FadeIn.duration(motion.dur.md).delay(CTA_DELAY))}
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
                  <ArrowRight color={Colors.white} size={22} />
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
