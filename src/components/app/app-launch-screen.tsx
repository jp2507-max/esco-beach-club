import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import {
  cancelAnimation,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { motion, rmTiming, withRM } from '@/src/lib/animations/motion';
import { shadows } from '@/src/lib/styles/shadows';
import { Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

type AppLaunchScreenProps = {
  isDark: boolean;
  onReady: () => void;
};

const LIGHT_WORDMARK = require('@/assets/images/launch-wordmark-light.png');
const DARK_WORDMARK = require('@/assets/images/launch-wordmark-dark.png');

function useLaunchAmbientStyle(options: {
  baseOpacity: number;
  reducedOpacity: number;
  travel: number;
}): AnimatedStyle<ViewStyle> {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(progress);
      progress.set(0.5);
      return;
    }

    progress.set(
      withRepeat(
        withSequence(
          withTiming(1, rmTiming(motion.dur.xl * 2)),
          withTiming(0, rmTiming(motion.dur.xl * 2))
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reduced]);

  return useAnimatedStyle<ViewStyle>(() => {
    const travelOffset = options.travel * (progress.get() - 0.5);
    const opacity =
      options.reducedOpacity +
      (options.baseOpacity - options.reducedOpacity) * progress.get();

    return {
      opacity,
      transform: [
        { translateY: travelOffset },
        { scale: 0.96 + progress.get() * 0.08 },
      ],
    };
  });
}

function useLaunchGlowStyle(isDark: boolean): AnimatedStyle<ViewStyle> {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(progress);
      progress.set(0.35);
      return;
    }

    progress.set(
      withRepeat(
        withSequence(
          withTiming(1, rmTiming(motion.dur.xl)),
          withTiming(0, rmTiming(motion.dur.xl))
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reduced]);

  return useAnimatedStyle<ViewStyle>(() => ({
    opacity: isDark ? 0.2 + progress.get() * 0.16 : 0.12 + progress.get() * 0.1,
    transform: [{ scale: 0.96 + progress.get() * 0.08 }],
  }));
}

export function AppLaunchScreen({
  isDark,
  onReady,
}: AppLaunchScreenProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const hasReportedReady = useRef(false);
  const glowStyle = useLaunchGlowStyle(isDark);
  const orbTopStyle = useLaunchAmbientStyle({
    baseOpacity: isDark ? 0.24 : 0.16,
    reducedOpacity: isDark ? 0.16 : 0.1,
    travel: 22,
  });
  const orbBottomStyle = useLaunchAmbientStyle({
    baseOpacity: isDark ? 0.18 : 0.12,
    reducedOpacity: isDark ? 0.12 : 0.08,
    travel: 18,
  });

  function handleLayout(_: LayoutChangeEvent): void {
    if (hasReportedReady.current) return;
    hasReportedReady.current = true;
    onReady();
  }

  return (
    <View className="flex-1" onLayout={handleLayout}>
      <LinearGradient
        colors={
          isDark
            ? [Colors.black, Colors.appLaunchGradientDarkMiddle, Colors.darkBg]
            : [
                Colors.background,
                Colors.appLaunchGradientLightMiddle,
                Colors.appLaunchGradientLightEnd,
              ]
        }
        end={{ x: 1, y: 1 }}
        start={{ x: 0.05, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />

      <Animated.View
        className="absolute -left-16 top-24 size-56 rounded-full"
        style={[
          orbTopStyle,
          {
            backgroundColor: isDark ? Colors.primaryBright : Colors.primary,
          },
        ]}
      />
      <Animated.View
        className="absolute -bottom-10 size-64 rounded-full"
        style={[
          orbBottomStyle,
          {
            backgroundColor: isDark ? Colors.gold : Colors.secondary,
            right: -28,
          },
        ]}
      />

      <View className="flex-1 items-center justify-center px-7">
        <Animated.View
          className="items-center"
          entering={withRM(FadeIn.duration(motion.dur.md))}
        >
          <Animated.View
            className="absolute size-72 rounded-full"
            style={[
              glowStyle,
              {
                backgroundColor: isDark
                  ? Colors.appLaunchGlowDark
                  : Colors.appLaunchGlowLight,
              },
            ]}
          />

          <View
            className="rounded-4xl border px-6 py-6"
            style={[
              isDark ? shadows.level5 : shadows.level3,
              {
                backgroundColor: isDark
                  ? Colors.appLaunchCardBackgroundDark
                  : Colors.appLaunchCardBackgroundLight,
                borderColor: isDark
                  ? Colors.appLaunchCardBorderDark
                  : Colors.appLaunchCardBorderLight,
              },
            ]}
          >
            <Image
              accessibilityHint={t('branding.markHint')}
              accessibilityLabel={t('branding.wordmark')}
              cachePolicy="memory-disk"
              contentFit="contain"
              source={isDark ? DARK_WORDMARK : LIGHT_WORDMARK}
              style={{ height: 72, width: 264 }}
              transition={180}
            />
          </View>
        </Animated.View>

        <Animated.View
          className="mt-9 items-center"
          entering={withRM(FadeInUp.delay(70).duration(motion.dur.md))}
        >
          <Text className="text-[11px] font-bold uppercase tracking-[3.2px] text-text-secondary dark:text-text-secondary-dark">
            {t('launch.eyebrow')}
          </Text>
          <Text className="mt-3 max-w-72 text-center text-[15px] font-semibold leading-6 text-text dark:text-text-primary-dark">
            {t('launch.loading')}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
