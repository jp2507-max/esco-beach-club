import { ArrowLeft } from 'lucide-react-native';
import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import {
  FadeIn,
  FadeInUp,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { motion, withRM } from '@/src/lib/animations/motion';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type OnboardingHeaderProps = {
  onBack: () => void;
  step: number;
  testIDPrefix: string;
  totalSteps?: number;
};

const DEFAULT_TOTAL_STEPS = 5;

function ProgressSegment({
  active,
  index,
}: {
  active: boolean;
  index: number;
}): ReactNode {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.set(
      withSpring(active ? 1 : 0, {
        ...motion.spring.stiff,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [active, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + fill.get() * 0.8,
    transform: [{ scaleX: 0.7 + fill.get() * 0.3 }],
  }));

  return (
    <Animated.View
      entering={withRM(FadeIn.delay(index * 60).duration(motion.dur.sm))}
      className="h-1.5 w-8 overflow-hidden rounded-full bg-primary/20 dark:bg-primary-bright/30"
    >
      <Animated.View
        style={fillStyle}
        className="h-full w-full rounded-full bg-primary dark:bg-primary-bright"
      />
    </Animated.View>
  );
}

export function OnboardingHeader({
  onBack,
  step,
  testIDPrefix,
  totalSteps = DEFAULT_TOTAL_STEPS,
}: OnboardingHeaderProps): ReactNode {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="px-5 pb-3" style={{ paddingTop: insets.top + 6 }}>
      <Animated.View
        entering={withRM(FadeIn.duration(motion.dur.md))}
        className="mb-3 flex-row items-center justify-between"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tCommon('back')}
          accessibilityHint={tCommon('backHint')}
          className="size-10 items-center justify-center rounded-full"
          onPress={onBack}
          testID={`${testIDPrefix}-back`}
        >
          <ArrowLeft
            color={isDark ? Colors.primaryBright : Colors.primary}
            size={20}
          />
        </Pressable>

        <Text className="text-[24px] font-extrabold tracking-[-0.7px] text-primary dark:text-primary-bright">
          {t('brandTitle')}
        </Text>

        <View className="size-10" />
      </Animated.View>

      <Animated.View
        entering={withRM(FadeInUp.duration(motion.dur.md).delay(80))}
        className="items-center gap-1.5"
      >
        <Text className="text-[10px] font-bold uppercase tracking-[3px] text-secondary dark:text-secondary-fixed">
          {t('onboardingBasicsStep', { step, total: totalSteps })}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <ProgressSegment key={i} active={i < step} index={i} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
