import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion, rmTiming } from '@/src/lib/animations/motion';
import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export type SkeletonProps = {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const PULSE_MIN = 0.45;
const PULSE_MAX = 0.85;
const STATIC_REDUCED = 0.65;

function useSkeletonPulse(): AnimatedStyle<ViewStyle> {
  const reduced = useReducedMotion();
  const opacitySV = useSharedValue(PULSE_MIN);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(opacitySV);
      opacitySV.set(STATIC_REDUCED);
      return;
    }

    opacitySV.set(
      withRepeat(
        withSequence(
          withTiming(PULSE_MAX, rmTiming(motion.dur.xl)),
          withTiming(PULSE_MIN, rmTiming(motion.dur.xl))
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(opacitySV);
    };
  }, [opacitySV, reduced]);

  return useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacitySV.get(),
  }));
}

export function Skeleton({
  className,
  style,
}: SkeletonProps): React.JSX.Element {
  const pulseStyle = useSkeletonPulse();

  return (
    <Animated.View
      className={cn(
        'overflow-hidden rounded-lg bg-border dark:bg-dark-border',
        className
      )}
      style={[pulseStyle, style]}
    />
  );
}

export type SkeletonTextProps = SkeletonProps & {
  lines?: number;
};

export function SkeletonText({
  className,
  lines = 1,
  style,
}: SkeletonTextProps): React.JSX.Element {
  return (
    <View className="gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-4/5' : 'w-full',
            className
          )}
          style={style}
        />
      ))}
    </View>
  );
}

export type SkeletonCardProps = SkeletonProps & {
  /** Approximate height in logical px */
  height?: number;
};

export function SkeletonCard({
  className,
  height = 120,
  style,
}: SkeletonCardProps): React.JSX.Element {
  return (
    <Skeleton
      className={cn('w-full rounded-[22px]', className)}
      style={[{ minHeight: height }, style]}
    />
  );
}

export type SkeletonAvatarProps = SkeletonProps & {
  size?: number;
};

export function SkeletonAvatar({
  className,
  size = 48,
  style,
}: SkeletonAvatarProps): React.JSX.Element {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={[{ width: size, height: size }, style]}
    />
  );
}
