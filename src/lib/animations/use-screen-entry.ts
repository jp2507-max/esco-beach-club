import { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { rmTiming } from '@/src/lib/animations/motion';

export type UseScreenEntryOptions = {
  durationMs?: number;
  initialOffsetY?: number;
};

export function useScreenEntry({
  durationMs = 400,
  initialOffsetY = 30,
}: UseScreenEntryOptions = {}) {
  const opacitySV = useSharedValue(0);
  const translateYSV = useSharedValue(initialOffsetY);

  useEffect(() => {
    opacitySV.set(withTiming(1, rmTiming(durationMs)));
    translateYSV.set(withTiming(0, rmTiming(durationMs)));

    return () => {
      cancelAnimation(opacitySV);
      cancelAnimation(translateYSV);
    };
  }, [durationMs, initialOffsetY, opacitySV, translateYSV]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacitySV.get(),
    transform: [{ translateY: translateYSV.get() }],
  }));

  return { contentStyle, opacitySV, translateYSV };
}
