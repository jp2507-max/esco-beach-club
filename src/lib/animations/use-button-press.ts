import { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import {
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/src/lib/animations/motion';

type UseButtonPressReturn = {
  animatedStyle: AnimatedStyle<ViewStyle>;
  handlePressIn: () => void;
  handlePressOut: () => void;
};

export function useButtonPress(
  scaleTo = 0.96,
  springPreset: keyof typeof motion.spring = 'snappy'
): UseButtonPressReturn {
  const safeScaleTo = Number.isFinite(scaleTo)
    ? Math.min(1, Math.max(0.5, scaleTo))
    : 0.96;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = useCallback((): void => {
    scale.set(withSpring(safeScaleTo, motion.spring[springPreset]));
  }, [safeScaleTo, springPreset, scale]);

  const handlePressOut = useCallback((): void => {
    scale.set(withSpring(1, motion.spring[springPreset]));
  }, [scale, springPreset]);

  return { animatedStyle, handlePressIn, handlePressOut };
}
