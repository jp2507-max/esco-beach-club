import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, PartyPopper } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { BookingContactActions } from '@/src/components/booking/booking-contact-actions';
import { rmTiming } from '@/src/lib/animations/motion';
import { hapticSuccess } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function SuccessScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { name, subtitle } = useLocalSearchParams<{
    name?: string;
    subtitle?: string;
  }>();

  const scale = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const confettiY = useSharedValue(-20);

  useEffect(() => {
    hapticSuccess();
    scale.set(
      withSequence(
        withSpring(1.05, {
          damping: 12,
          stiffness: 180,
          reduceMotion: ReduceMotion.System,
        }),
        withSpring(1, {
          damping: 15,
          stiffness: 160,
          reduceMotion: ReduceMotion.System,
        })
      )
    );
    fadeIn.set(withTiming(1, rmTiming(400)));
    confettiY.set(withTiming(0, rmTiming(400)));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(fadeIn);
      cancelAnimation(confettiY);
    };
  }, [scale, fadeIn, confettiY]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.get(),
    transform: [{ translateY: confettiY.get() }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.get(),
  }));

  return (
    <View
      className="flex-1 justify-between bg-background dark:bg-dark-bg"
      style={{
        paddingBottom: Math.max(insets.bottom, 20),
        paddingTop: insets.top,
      }}
    >
      <View className="absolute inset-0 overflow-hidden">
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: `${Colors.primary}08`,
            height: 260,
            right: -60,
            top: -40,
            width: 260,
          }}
        />
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: `${Colors.secondary}0A`,
            bottom: 100,
            height: 180,
            left: -40,
            width: 180,
          }}
        />
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: Colors.homeOrbAccentLight,
            height: 120,
            right: 20,
            top: '40%',
            width: 120,
          }}
        />
      </View>

      <View className="flex-1 items-center justify-center px-7.5">
        <Animated.View className="relative mb-8" style={iconStyle}>
          <View
            className="size-27.5 items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.success,
              ...shadows.level5,
              shadowColor: Colors.success,
              shadowOpacity: 0.28,
            }}
          >
            <CircleCheck color={Colors.white} size={56} />
          </View>
          <View
            className="absolute -right-3 -top-2 size-10 items-center justify-center rounded-full bg-white dark:bg-dark-bg-card"
            style={shadows.level2}
          >
            <PartyPopper color={Colors.primary} size={28} />
          </View>
        </Animated.View>

        <Animated.View className="w-full items-center" style={contentStyle}>
          <Text className="mb-3 text-center text-[28px] font-extrabold text-text dark:text-text-primary-dark">
            {t('bookingSuccess.title', {
              name: name ?? t('bookingSuccess.guest'),
            })}
          </Text>
          <Text className="max-w-70 text-center text-base leading-6 text-text-secondary dark:text-text-secondary-dark">
            {subtitle ?? t('bookingSuccess.subtitle')}
          </Text>

          <Text className="mt-3 max-w-75 text-center text-sm leading-5 text-text-muted dark:text-text-muted-dark">
            {t('bookingContact.chatPrompt')}
          </Text>

          <View className="mt-5 w-full px-5">
            <BookingContactActions />
          </View>
        </Animated.View>
      </View>

      <Animated.View className="px-5" style={buttonStyle}>
        <Pressable
          accessibilityRole="button"
          className="items-center rounded-2xl bg-primary py-4.5"
          onPress={() => router.replace('/')}
          testID="back-home"
        >
          <Text className="text-[17px] font-bold text-white">
            {t('bookingSuccess.backHome')}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
