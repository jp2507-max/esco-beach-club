import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CircleCheck, PartyPopper } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { rmTiming } from '@/src/lib/animations/motion';
import { shadows } from '@/src/lib/styles/shadows';
import { Animated } from '@/src/tw/animated';
import { Text, Pressable, View } from '@/src/tw';

export default function SuccessScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { name, subtitle } = useLocalSearchParams<{ name?: string; subtitle?: string }>();

  const scale = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const confettiY = useSharedValue(-20);

  useEffect(() => {
    scale.set(
      withSequence(
        withSpring(1.05, {
          damping: 12,
          stiffness: 180,
        }),
        withSpring(1, {
          damping: 15,
          stiffness: 160,
        })
      )
    );
    fadeIn.set(withTiming(1, rmTiming(400)));
    confettiY.set(withTiming(0, rmTiming(400)));
  }, [scale, fadeIn, confettiY]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    alignItems: 'center',
    opacity: fadeIn.get(),
    transform: [{ translateY: confettiY.get() }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.get(),
  }));

  return (
    <View
      className="flex-1 justify-between bg-background dark:bg-dark-bg"
      style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: insets.top }}
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
            backgroundColor: '#FF980010',
            height: 120,
            right: 20,
            top: '40%',
            width: 120,
          }}
        />
      </View>

      <View className="flex-1 items-center justify-center px-[30px]">
        <Animated.View className="relative mb-8" style={iconStyle}>
          <View
            className="size-[110px] items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.success,
              elevation: 12,
              shadowColor: Colors.success,
              shadowOffset: { height: 8, width: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
            }}
          >
            <CircleCheck color="#fff" size={56} />
          </View>
          <View
            className="absolute right-[-12px] top-[-8px] size-10 items-center justify-center rounded-full bg-white dark:bg-dark-bg-card"
            style={shadows.level2}
          >
            <PartyPopper color={Colors.primary} size={28} />
          </View>
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text className="mb-3 text-center text-[28px] font-extrabold text-text dark:text-text-primary-dark">
            {t('bookingSuccess.title', { name: name ?? t('bookingSuccess.guest') })}
          </Text>
          <Text className="max-w-[280px] text-center text-base leading-6 text-text-secondary dark:text-text-secondary-dark">
            {subtitle ?? t('bookingSuccess.subtitle')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View className="px-5" style={buttonStyle}>
        <Pressable
          className="items-center rounded-2xl bg-primary py-[18px]"
          onPress={() => router.replace('/')}
          testID="back-home"
        >
          <Text className="text-[17px] font-bold text-white">{t('bookingSuccess.backHome')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
