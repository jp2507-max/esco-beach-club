import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ConciergeBell,
  PiggyBank,
  Sparkles,
  Ticket,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FadeIn, FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { AuthScreenContent } from '@/src/components/auth/auth-screen-content';
import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { motion, withRM } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { config } from '@/src/lib/config';
import { hapticLight } from '@/src/lib/haptics/haptics';
import { computeOnboardingFooterPadding } from '@/src/lib/layout/onboarding-footer-padding';
import { shadows } from '@/src/lib/styles/shadows';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

type FeatureCard = {
  icon: React.ComponentType<{
    className?: string;
    color?: string;
    size?: number;
  }>;
  iconBgClassName: string;
  iconColorClassName: string;
  testID: string;
  title: string;
};

const HERO_DELAY = 70;
const CARD_BASE_DELAY = 220;
const CARD_STAGGER = 60;

export default function OnboardingWelcomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();
  const ctaButton = useButtonPress();
  const resetSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.resetDraft
  );
  const footerPaddingBottom = computeOnboardingFooterPadding(insets.bottom);

  const featureCards: FeatureCard[] = [
    {
      icon: Ticket,
      iconBgClassName: 'bg-primary-fixed',
      iconColorClassName: 'text-primary',
      testID: 'onboarding-feature-priority',
      title: t('onboardingWelcomeFeaturePriorityTitle'),
    },
    {
      icon: PiggyBank,
      iconBgClassName: 'bg-secondary-fixed',
      iconColorClassName: 'text-secondary',
      testID: 'onboarding-feature-savings',
      title: t('onboardingWelcomeFeatureSavingsTitle'),
    },
    {
      icon: ConciergeBell,
      iconBgClassName: 'bg-gold/15',
      iconColorClassName: 'text-gold',
      testID: 'onboarding-feature-concierge',
      title: t('onboardingWelcomeFeatureConciergeTitle'),
    },
  ];

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <OnboardingHeader
        onBack={() => router.back()}
        step={1}
        testIDPrefix="onboarding"
      />

      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AuthScreenContent>
          <Animated.View
            entering={withRM(FadeIn.duration(motion.dur.lg).delay(HERO_DELAY))}
            className="overflow-hidden rounded-3xl border border-border/60 dark:border-dark-border"
          >
            <View className="h-52 w-full overflow-hidden">
              <Image
                className="h-full w-full"
                source={config.heroImage}
                placeholder={config.heroImage}
                cachePolicy="memory-disk"
                contentFit="cover"
                transition={180}
              />
              <LinearGradient
                colors={[
                  Colors.onboardingHeroOverlayStart,
                  Colors.onboardingHeroOverlayEnd,
                ]}
                style={{
                  bottom: 0,
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                }}
              />

              <View className="absolute inset-x-0 bottom-0 px-5 pb-5">
                <Animated.View
                  entering={withRM(
                    FadeInLeft.duration(motion.dur.md).delay(HERO_DELAY + 200)
                  )}
                  className="mb-3 self-start rounded-full border border-white/35 bg-black/25 px-3 py-1.5"
                >
                  <View className="flex-row items-center gap-2">
                    <Sparkles className="text-white" size={14} />
                    <Text className="text-[10px] font-bold uppercase tracking-[2.8px] text-white">
                      {t('onboardingWelcomeEyebrow')}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View
                  entering={withRM(
                    FadeInUp.duration(motion.dur.md).delay(HERO_DELAY + 320)
                  )}
                >
                  <Text className="text-[28px] font-extrabold leading-8 text-white">
                    {t('onboardingWelcomeTitleLine1')}
                  </Text>
                </Animated.View>
                <Animated.View
                  entering={withRM(
                    FadeInUp.duration(motion.dur.md).delay(HERO_DELAY + 420)
                  )}
                >
                  <Text className="text-[28px] font-extrabold italic leading-8 text-white">
                    {t('onboardingWelcomeTitleLine2')}
                  </Text>
                </Animated.View>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={withRM(
              FadeIn.duration(motion.dur.md).delay(CARD_BASE_DELAY - 50)
            )}
          >
            <Text className="mb-2.5 mt-2.5 px-1 text-[14px] leading-5 text-text-secondary dark:text-text-secondary-dark">
              {t('onboardingWelcomeDescription')}
            </Text>
          </Animated.View>

          <View className="mb-5 gap-2.5">
            {featureCards.map((card, index) => (
              <Animated.View
                key={card.testID}
                entering={withRM(
                  FadeInUp.springify()
                    .damping(18)
                    .stiffness(140)
                    .delay(CARD_BASE_DELAY + index * CARD_STAGGER)
                )}
              >
                <View
                  className="flex-row items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg-card"
                  style={shadows.level2}
                  testID={card.testID}
                >
                  <View
                    className={`size-10 items-center justify-center rounded-full ${card.iconBgClassName}`}
                  >
                    <card.icon className={card.iconColorClassName} size={18} />
                  </View>
                  <Text className="flex-1 text-[15px] font-semibold leading-5 text-text dark:text-text-primary-dark">
                    {card.title}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </AuthScreenContent>
      </ScrollView>

      <View
        className="px-5 pt-3 bg-background dark:bg-dark-bg"
        style={{ paddingBottom: footerPaddingBottom }}
      >
        <AuthScreenContent>
          <Animated.View
            entering={withRM(
              FadeIn.duration(motion.dur.md).delay(
                CARD_BASE_DELAY + featureCards.length * CARD_STAGGER + 60
              )
            )}
            className="gap-3"
          >
            <Animated.View style={ctaButton.animatedStyle}>
              <Pressable
                accessibilityRole="button"
                className="overflow-hidden rounded-full"
                onPress={() => {
                  hapticLight();
                  resetSignupDraft();
                  router.push('/onboarding-profile-basics');
                }}
                onPressIn={ctaButton.handlePressIn}
                onPressOut={ctaButton.handlePressOut}
                testID="onboarding-get-started"
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
                      {t('onboardingWelcomeGetStarted')}
                    </Text>
                    <ArrowRight color={Colors.white} size={22} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Text className="px-2 text-center text-[13px] leading-5 text-text-muted dark:text-text-muted-dark">
              {t('onboardingWelcomePointVerifiedDescription')}
            </Text>
          </Animated.View>
        </AuthScreenContent>
      </View>
    </View>
  );
}
