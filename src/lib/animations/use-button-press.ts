import { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/src/lib/animations/motion';

type UseButtonPressReturn = {
  animatedStyle: ViewStyle;
  handlePressIn: () => void;
  handlePressOut: () => void;
};

export function useButtonPress(
  scaleTo = 0.96,
  springPreset: keyof typeof motion.spring = 'snappy'
): UseButtonPressReturn {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = useCallback((): void => {
    scale.set(withSpring(scaleTo, motion.spring[springPreset]));
  }, [scale, scaleTo, springPreset]);

  const handlePressOut = useCallback((): void => {
    scale.set(withSpring(1, motion.spring[springPreset]));
  }, [scale, springPreset]);

  return { animatedStyle, handlePressIn, handlePressOut };
}
