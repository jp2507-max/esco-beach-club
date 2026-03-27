import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, PiggyBank, Sparkles, Ticket } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/src/components/onboarding/onboarding-header';
import { Pressable, Text, View } from '@/src/tw';
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

const HERO_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcsRyUs7Nt6b970dKL7SGP0zKuc5VeNDrXUoR_XkRjTieEkpekdAo6Yw419E2YEIKsXSSNFtEi_mqn6_b4zHi3FULuzfNMbRRSFQJzQl9iUwFdzCAiaCQWsnW4xq5EZ2YAn9MApXiRr96sdWYf6kjD1jqgzwH1xxit4vvJDwrnwHUEtaXuPaGRsvpdVj88rcmnCKwJdBJhc0xsxEpXd4iF2BupN7BJ342wU5Habzkn44SfRnEFEBa7nXb44Wasc3N4IgelmQyfl7Fl';

export default function OnboardingWelcomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('auth');

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
  ];

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <OnboardingHeader
        onBack={() => router.back()}
        step={1}
        testIDPrefix="onboarding"
      />

      <View className="flex-1 px-5 pb-8">
        <View className="overflow-hidden rounded-[34px] border border-border/60 dark:border-dark-border">
          <View className="h-52 w-full overflow-hidden">
            <Image
              className="h-full w-full"
              source={{ uri: HERO_IMAGE_URI }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={180}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.52)']}
              style={{
                bottom: 0,
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
              }}
            />

            <View className="absolute inset-x-0 bottom-0 px-5 pb-5">
              <View className="mb-3 self-start rounded-full border border-white/35 bg-black/25 px-3 py-1.5">
                <View className="flex-row items-center gap-2">
                  <Sparkles className="text-white" size={14} />
                  <Text className="text-[10px] font-bold uppercase tracking-[2.8px] text-white">
                    {t('onboardingWelcomeEyebrow')}
                  </Text>
                </View>
              </View>

              <Text className="text-[28px] font-extrabold leading-8 text-white">
                {t('onboardingWelcomeTitleLine1')}
              </Text>
              <Text className="text-[28px] font-extrabold italic leading-8 text-white">
                {t('onboardingWelcomeTitleLine2')}
              </Text>
            </View>
          </View>
        </View>

        <Text className="mb-3 mt-3 px-1 text-[14px] leading-5 text-text-secondary dark:text-text-secondary-dark">
          {t('onboardingWelcomeDescription')}
        </Text>

        <View className="mb-5 flex-row gap-3">
          {featureCards.map((card) => (
            <View
              key={card.testID}
              className="flex-1 rounded-3xl border border-border/70 bg-white px-4 py-4 dark:border-dark-border dark:bg-dark-bg-card"
              testID={card.testID}
            >
              <View
                className={`mb-3 size-10 items-center justify-center rounded-full ${card.iconBgClassName}`}
              >
                <card.icon className={card.iconColorClassName} size={18} />
              </View>
              <Text className="text-[15px] font-semibold leading-6 text-text dark:text-text-primary-dark">
                {card.title}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-auto gap-3">
          <Pressable
            accessibilityRole="button"
            className="overflow-hidden rounded-full"
            onPress={() => router.push('/onboarding-profile-basics')}
            testID="onboarding-get-started"
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
              <View className="flex-row items-center gap-2.5">
                <Text className="text-[17px] font-bold text-white">
                  {t('onboardingWelcomeGetStarted')}
                </Text>
                <ArrowRight color="#ffffff" size={22} />
              </View>
            </LinearGradient>
          </Pressable>

          <Text className="px-2 text-center text-[13px] leading-5 text-text-muted dark:text-text-muted-dark">
            {t('onboardingWelcomePointVerifiedDescription')}
          </Text>
        </View>
      </View>
    </View>
  );
}
