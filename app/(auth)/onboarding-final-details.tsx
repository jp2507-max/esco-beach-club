import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles, Ticket } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import {
  cancelAnimation,
  FadeIn,
  FadeInUp,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { updateProfile } from '@/lib/api';
import { onboardingPermissionStatuses } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useProfileData } from '@/providers/DataProvider';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { motion, withRM } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { config } from '@/src/lib/config';
import { hapticLight } from '@/src/lib/haptics/haptics';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const WELCOME_COCKTAIL_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB6oK4M5GAEAukmyL4P-fxWGcieV8vOhAhVYjyrF1Jr46L3mySepBDndcXRdhdc1tAzZ5WIxmdQJsAUBN2fGXSNBnd5SFLWdksutc6ObMR_yw_fuIjHEucVvyZErUVjOd0HRufWgBdDdaKejA8KX_eSNt_fxHrfF1waZijjj1Rx_OCJrX0uchXHN9J7zJ3ZoNr7vU-DZQlbsepHsxBTCz7WSQnczqLyGpH0p3IhVqSGo1FUYjKdyKPHdiRp8X1Bljuvhyuhv5K5Zv2e';

const ICON_DELAY = 100;
const TITLE_DELAY = 260;
const CARD_DELAY = 440;
const CTA_DELAY = 680;
const PROFILE_PERMISSION_DENIED_ERROR_KEY = 'profilePermissionDenied';

/**
 * Backend auth/profile permission errors currently surface as mixed shapes:
 * - native Error instances whose message includes "permission denied"
 * - plain objects with a message string containing "permission denied"
 * - objects with type "permission-denied"
 *
 * Matching is case-insensitive. If backend error formats evolve, update these
 * checks (or replace with structured error codes) to preserve fallback behavior.
 */
function isPermissionDeniedError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    return (
      error.message === PROFILE_PERMISSION_DENIED_ERROR_KEY ||
      error.message.toLowerCase().includes('permission denied')
    );
  }

  if (typeof error !== 'object') return false;

  const maybeError = error as {
    message?: unknown;
    type?: unknown;
  };

  const message =
    typeof maybeError.message === 'string'
      ? maybeError.message.toLowerCase()
      : '';
  const rawMessage =
    typeof maybeError.message === 'string' ? maybeError.message : '';
  const type =
    typeof maybeError.type === 'string' ? maybeError.type.toLowerCase() : '';

  return (
    rawMessage === PROFILE_PERMISSION_DENIED_ERROR_KEY ||
    message.includes('permission denied') ||
    type === 'permission-denied'
  );
}

function FloatingDot({
  delay,
  amplitude,
  positionClassName,
  appearanceClassName,
}: {
  amplitude: number;
  appearanceClassName: string;
  delay: number;
  positionClassName: string;
}): React.JSX.Element {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.set(
      withRepeat(
        withSequence(
          withTiming(amplitude, {
            duration: 2400,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(-amplitude, {
            duration: 2400,
            reduceMotion: ReduceMotion.System,
          })
        ),
        -1,
        true
      )
    );
    return () => cancelAnimation(translateY);
  }, [amplitude, translateY]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <Animated.View
      entering={withRM(FadeIn.duration(motion.dur.xl).delay(delay))}
      className={positionClassName}
    >
      <Animated.View style={dotStyle} className={appearanceClassName} />
    </Animated.View>
  );
}

export default function OnboardingFinalDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    signOut,
    user,
  } = useAuth();
  const { profile } = useProfileData();
  const { t } = useTranslation('auth');
  const isDark = useAppIsDark();
  const ctaButton = useButtonPress();
  const signupDraft = useSignupOnboardingDraftStore((state) => state.draft);
  const setSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.setDraft
  );
  const resetSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.resetDraft
  );

  const sparkleScale = useSharedValue(1);

  useEffect(() => {
    sparkleScale.set(
      withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 900,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(1, {
            duration: 900,
            reduceMotion: ReduceMotion.System,
          })
        ),
        -1,
        true
      )
    );
    return () => cancelAnimation(sparkleScale);
  }, [sparkleScale]);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.get() }],
  }));

  async function persistAuthenticatedOnboardingChoices(): Promise<void> {
    if (!user?.id) return;

    const onboardingDisplayName = signupDraft.displayName
      ?.trim()
      .replace(/\s+/g, ' ');
    const onboardingDateOfBirth = signupDraft.dateOfBirth?.trim();
    const memberSegment = signupDraft.memberSegment;
    const locationPermissionStatus =
      signupDraft.locationPermissionStatus ??
      onboardingPermissionStatuses.undetermined;
    const pushNotificationPermissionStatus =
      signupDraft.pushNotificationPermissionStatus ??
      onboardingPermissionStatuses.undetermined;

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
      ...(memberSegment ? { member_segment: memberSegment } : {}),
      location_permission_status: resolvedLocationPermissionStatus,
      push_notification_permission_status: resolvedPushPermissionStatus,
      onboarding_completed_at: new Date().toISOString(),
    });
  }

  async function handleAuthenticatedSignupFallback(): Promise<void> {
    try {
      await signOut();
    } catch (error: unknown) {
      console.error(
        '[OnboardingFinalDetails] Failed to sign out before auth fallback:',
        {
          error,
        }
      );
      Alert.alert(t('verificationFailedTitle'), t('unableToSignOut'));
      return;
    }

    router.replace({
      pathname: '/login',
      params: { authFlow: 'signup' },
    });
  }

  async function navigateToSignup(): Promise<void> {
    if (isAuthLoading) return;

    setSignupDraft({ hasCompletedSetup: true });

    if (isAuthenticated && user?.id) {
      try {
        await persistAuthenticatedOnboardingChoices();
      } catch (error: unknown) {
        if (isPermissionDeniedError(error)) {
          console.warn(
            '[OnboardingFinalDetails] Authenticated onboarding update lost permissions; recovering through auth flow.',
            {
              error,
            }
          );
          await handleAuthenticatedSignupFallback();
          return;
        }

        console.error(
          '[OnboardingFinalDetails] Failed to persist onboarding updates:',
          {
            error,
          }
        );
        Alert.alert(
          t('onboardingSaveErrorTitle'),
          t('onboardingSaveErrorMessage')
        );
        return;
      }

      resetSignupDraft();
      router.replace('/(auth)/post-auth-redirect');
      return;
    }

    router.push({
      pathname: '/login',
      params: { authFlow: 'signup' },
    });
  }

  function handleCompleteSetup(): void {
    void navigateToSignup();
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View className="absolute inset-0">
        <LinearGradient
          colors={
            isDark
              ? [
                  Colors.onboardingFinalGradientDarkBase,
                  Colors.onboardingFinalGradientDarkBase,
                  Colors.onboardingFinalGradientDarkAccent,
                ]
              : [
                  Colors.onboardingFinalGradientBase,
                  Colors.onboardingFinalGradientBase,
                  Colors.onboardingFinalGradientAccent,
                ]
          }
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        />
      </View>

      <View className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-25">
        <FloatingDot
          positionClassName="absolute left-10 top-20 size-4"
          appearanceClassName="size-full rounded-full bg-primary/50 dark:bg-primary-bright/40"
          delay={200}
          amplitude={6}
        />
        <FloatingDot
          positionClassName="absolute right-16 top-55 size-3"
          appearanceClassName="size-full rounded-sm bg-secondary/50 dark:bg-secondary/30"
          delay={400}
          amplitude={8}
        />
        <FloatingDot
          positionClassName="absolute left-24 top-120 h-5 w-2"
          appearanceClassName="size-full rounded-full bg-warning/45 dark:bg-warning-dark/30"
          delay={300}
          amplitude={5}
        />
        <FloatingDot
          positionClassName="absolute right-24 top-110 size-3"
          appearanceClassName="size-full rounded-full bg-primary/40 dark:bg-primary-bright/30"
          delay={500}
          amplitude={7}
        />
        <FloatingDot
          positionClassName="absolute bottom-20 right-8 size-6"
          appearanceClassName="size-full rounded-full bg-border/70 dark:bg-dark-border/60"
          delay={350}
          amplitude={4}
        />
      </View>

      <OnboardingHeader
        onBack={() => router.back()}
        step={5}
        testIDPrefix="onboarding-final-details"
      />

      <View className="flex-1 px-6 pb-12">
        <View className="items-center">
          <Animated.View
            entering={withRM(
              ZoomIn.springify().damping(12).stiffness(160).delay(ICON_DELAY)
            )}
            className="mb-4 size-14 items-center justify-center rounded-full bg-primary-fixed dark:bg-primary/20"
          >
            <Animated.View
              style={sparkleStyle}
              className="items-center justify-center"
            >
              <Sparkles
                className="text-primary dark:text-primary-bright"
                size={24}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={withRM(
              FadeInUp.springify().damping(18).stiffness(140).delay(TITLE_DELAY)
            )}
          >
            <Text className="text-center text-[28px] font-extrabold leading-9 text-text dark:text-text-primary-dark">
              {t('onboardingClubWelcomeTitle')}
            </Text>
          </Animated.View>

          <Animated.View
            entering={withRM(
              FadeIn.duration(motion.dur.md).delay(TITLE_DELAY + 100)
            )}
          >
            <Text className="mt-3 px-2 text-center text-[15px] leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('onboardingClubWelcomeSubtitle')}
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={withRM(
            FadeInUp.springify().damping(16).stiffness(120).delay(CARD_DELAY)
          )}
          className="mt-6 overflow-hidden rounded-3xl border border-border/70 bg-white/92 p-5 dark:border-dark-border dark:bg-dark-bg-card/90"
        >
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

            <Animated.View
              entering={withRM(
                FadeInUp.springify()
                  .damping(14)
                  .stiffness(130)
                  .delay(CARD_DELAY + 180)
              )}
              className="mt-5 w-full rounded-2xl border-2 border-dashed border-border-light bg-surface-container-low px-4 py-3 dark:border-dark-border dark:bg-dark-bg-elevated"
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-3">
                  <Animated.View
                    entering={withRM(
                      ZoomIn.springify()
                        .damping(12)
                        .stiffness(160)
                        .delay(CARD_DELAY + 320)
                    )}
                    className="size-16 items-center justify-center rounded-xl bg-primary dark:bg-primary-bright"
                  >
                    <Ticket color={Colors.white} size={22} />
                  </Animated.View>

                  <View>
                    <Text className="text-[17px] font-bold text-text dark:text-text-primary-dark">
                      {t('onboardingClubVoucherCode', {
                        code: config.onboardingClubVoucher.code,
                      })}
                    </Text>
                    <Text className="text-[13px] text-text-secondary dark:text-text-secondary-dark">
                      {t('onboardingClubVoucherValidity', {
                        scope: config.onboardingClubVoucher.scope,
                      })}
                    </Text>
                  </View>
                </View>

                <View className="size-12 items-center justify-center rounded-xl bg-gold/15">
                  <Sparkles className="text-gold" size={18} />
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={withRM(
                FadeIn.duration(motion.dur.md).delay(CARD_DELAY + 400)
              )}
            >
              <Text className="mt-5 px-2 text-center text-[14px] leading-6 text-text-secondary dark:text-text-secondary-dark">
                {t('onboardingClubVoucherInstruction')}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View
          entering={withRM(FadeIn.duration(motion.dur.md).delay(CTA_DELAY))}
        >
          <Animated.View style={ctaButton.animatedStyle}>
            <Pressable
              accessibilityRole="button"
              className="mt-8 overflow-hidden rounded-full"
              onPress={() => {
                hapticLight();
                handleCompleteSetup();
              }}
              onPressIn={ctaButton.handlePressIn}
              onPressOut={ctaButton.handlePressOut}
              testID="onboarding-final-details-complete"
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
                <View className="flex-row items-center gap-2">
                  <Text className="text-[17px] font-bold text-white">
                    {t('onboardingClubPrimaryCta')}
                  </Text>
                  <ArrowRight color={Colors.white} size={22} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
