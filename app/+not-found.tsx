import { Link, Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FadeIn, FadeInUp } from 'react-native-reanimated';

import { motion, withRM } from '@/src/lib/animations/motion';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function NotFoundScreen(): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-dark-bg">
        <Animated.View
          entering={withRM(FadeIn.duration(motion.dur.md))}
          className="items-center"
        >
          <Text className="text-center text-lg font-semibold text-text dark:text-text-primary-dark">
            {t('notFound.title')}
          </Text>
        </Animated.View>
        <Animated.View
          entering={withRM(
            FadeInUp.springify().damping(14).stiffness(220).delay(motion.dur.sm)
          )}
        >
          <Link href="/" asChild={true}>
            <Pressable
              accessibilityRole="button"
              className="mt-[15px] py-[15px]"
            >
              <Text className="text-sm font-semibold text-primary dark:text-primary-bright">
                {t('notFound.cta')}
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </View>
    </>
  );
}
