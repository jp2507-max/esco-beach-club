import React, { useEffect, useMemo } from 'react';
import {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/src/lib/animations/motion';
import { View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

function SignupStepDot({
  scaleSV,
}: {
  scaleSV: SharedValue<number>;
}): React.JSX.Element {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSV.get() }],
  }));

  return (
    <Animated.View className="h-1.5 w-8 rounded-full bg-white" style={style} />
  );
}

export function SignupStepDots({
  isCodeStep,
}: {
  isCodeStep: boolean;
}): React.JSX.Element {
  const s0 = useSharedValue(isCodeStep ? 1 : 1.2);
  const s1 = useSharedValue(isCodeStep ? 1 : 1.2);
  const s2 = useSharedValue(isCodeStep ? 1 : 1.2);
  const s3 = useSharedValue(isCodeStep ? 1.2 : 1);
  const s4 = useSharedValue(isCodeStep ? 1.2 : 1);
  const s5 = useSharedValue(isCodeStep ? 1.2 : 1);
  const scales = useMemo(
    () => [s0, s1, s2, s3, s4, s5],
    [s0, s1, s2, s3, s4, s5]
  );

  useEffect(() => {
    scales.forEach((scale, index) => {
      const active = isCodeStep ? index >= 3 : index < 3;
      scale.set(withSpring(active ? 1.2 : 1, motion.spring.gentle));
    });

    return () => {
      for (const scale of scales) cancelAnimation(scale);
    };
  }, [isCodeStep, scales]);

  return (
    <View className="flex-row items-center gap-1.5">
      {scales.map((scale, index) => (
        <SignupStepDot key={index} scaleSV={scale} />
      ))}
    </View>
  );
}
