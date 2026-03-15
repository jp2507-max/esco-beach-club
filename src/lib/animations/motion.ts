import { Easing, ReduceMotion } from 'react-native-reanimated';

export const motion = {
  dur: {
    xs: 120,
    sm: 180,
    md: 260,
    lg: 360,
    xl: 600,
  },
  ease: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    decel: Easing.bezier(0, 0, 0.2, 1),
  },
  spring: {
    gentle: {
      damping: 15,
      stiffness: 120,
      reduceMotion: ReduceMotion.System,
    },
    bouncy: {
      damping: 12,
      stiffness: 180,
      reduceMotion: ReduceMotion.System,
    },
    stiff: {
      damping: 15,
      stiffness: 200,
      reduceMotion: ReduceMotion.System,
    },
    snappy: {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.System,
    },
  },
} as const;

export function rmTiming(duration: number): {
  duration: number;
  reduceMotion: ReduceMotion;
} {
  return {
    duration,
    reduceMotion: ReduceMotion.System,
  };
}

export type ReduceMotionCapable<T> = {
  reduceMotion(mode: ReduceMotion): T;
};

export function withRM<T extends ReduceMotionCapable<T>>(animation: T): T {
  return animation.reduceMotion(ReduceMotion.System);
}
