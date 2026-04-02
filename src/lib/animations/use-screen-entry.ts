import { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { rmTiming } from '@/src/lib/animations/motion';

export type UseScreenEntryOptions = {
  /** Delay before the fade/slide-in starts (ms). */
  delayMs?: number;
  durationMs?: number;
  initialOffsetY?: number;
};

export function useScreenEntry({
  delayMs = 0,
  durationMs = 400,
  initialOffsetY = 30,
}: UseScreenEntryOptions = {}) {
  const opacitySV = useSharedValue(0);
  const translateYSV = useSharedValue(initialOffsetY);

  useEffect(() => {
    const timingConfig = rmTiming(durationMs);
    const opacityAnim =
      delayMs > 0
        ? withDelay(delayMs, withTiming(1, timingConfig))
        : withTiming(1, timingConfig);
    const translateAnim =
      delayMs > 0
        ? withDelay(delayMs, withTiming(0, timingConfig))
        : withTiming(0, timingConfig);

    opacitySV.set(opacityAnim);
    translateYSV.set(translateAnim);

    return () => {
      cancelAnimation(opacitySV);
      cancelAnimation(translateYSV);
    };
  }, [delayMs, durationMs, initialOffsetY, opacitySV, translateYSV]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacitySV.get(),
    transform: [{ translateY: translateYSV.get() }],
  }));

  return { contentStyle, opacitySV, translateYSV };
}
