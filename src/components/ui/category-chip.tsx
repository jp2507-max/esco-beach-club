import type { ComponentProps } from 'react';
import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { cn } from '@/src/lib/utils';
import { type Pressable } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export type CategoryChipProps = Omit<
  ComponentProps<typeof Pressable>,
  'children' | 'onPress'
> & {
  isActive: boolean;
  label: string;
  labelClassName?: string;
  onPress: () => void;
};

export function CategoryChip({
  className,
  isActive,
  label,
  labelClassName,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...props
}: CategoryChipProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const progress = useSharedValue(isActive ? 1 : 0);
  const { animatedStyle, handlePressIn, handlePressOut } = useButtonPress(
    0.98,
    'gentle'
  );

  useEffect(() => {
    progress.set(withTiming(isActive ? 1 : 0, rmTiming(motion.dur.sm)));
  }, [isActive, progress]);

  const activeBg = isDark ? Colors.secondaryBright : Colors.secondary;
  const inactiveBg = isDark ? Colors.darkBgCard : Colors.card;
  const activeBorder = isDark ? Colors.secondaryBright : Colors.secondary;
  const inactiveBorder = isDark ? Colors.darkBorder : Colors.border;
  const activeText = isDark ? Colors.secondaryDeeper : Colors.white;
  const inactiveText = isDark ? Colors.textPrimaryDark : Colors.text;

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveBg, activeBg]
    ),
    borderColor: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveBorder, activeBorder]
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [inactiveText, activeText]),
  }));

  const handlePressInCombined = React.useCallback<
    NonNullable<ComponentProps<typeof Pressable>['onPressIn']>
  >(
    (event) => {
      handlePressIn();
      onPressIn?.(event);
    },
    [handlePressIn, onPressIn]
  );

  const handlePressOutCombined = React.useCallback<
    NonNullable<ComponentProps<typeof Pressable>['onPressOut']>
  >(
    (event) => {
      handlePressOut();
      onPressOut?.(event);
    },
    [handlePressOut, onPressOut]
  );

  const animatedContainerStyle =
    containerStyle as unknown as StyleProp<ViewStyle>;
  const animatedPressStyle = animatedStyle as unknown as StyleProp<ViewStyle>;
  const resolvedStyle = React.useMemo<
    ComponentProps<typeof Pressable>['style']
  >(
    () =>
      typeof style === 'function'
        ? (state) => [animatedContainerStyle, animatedPressStyle, style(state)]
        : [animatedContainerStyle, animatedPressStyle, style],
    [animatedContainerStyle, animatedPressStyle, style]
  );

  return (
    <Animated.Pressable
      accessibilityRole="button"
      className={cn('rounded-full border px-5 py-2.5', className)}
      onPress={onPress}
      onPressIn={handlePressInCombined}
      onPressOut={handlePressOutCombined}
      style={resolvedStyle}
      {...props}
    >
      <Animated.Text
        className={cn('text-sm font-semibold', labelClassName)}
        style={textStyle}
      >
        {label}
      </Animated.Text>
    </Animated.Pressable>
  );
}
