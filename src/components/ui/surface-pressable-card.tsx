import type { ComponentProps } from 'react';
import React from 'react';
import { useColorScheme } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { getAndroidRippleConfig } from '@/src/lib/styles/android-ripple';
import { cn } from '@/src/lib/utils';
import { type Pressable } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export type SurfacePressableCardProps = ComponentProps<typeof Pressable>;

export function SurfacePressableCard({
  className,
  onPressIn,
  onPressOut,
  style,
  ...props
}: SurfacePressableCardProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const { animatedStyle, handlePressIn, handlePressOut } = useButtonPress(
    0.985,
    'gentle'
  );
  const androidRipple = React.useMemo(
    () =>
      getAndroidRippleConfig(
        isDark ? Colors.ACTIVE_BG_DARK : Colors.ACTIVE_BG_LIGHT
      ),
    [isDark]
  );

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

  const animatedPressStyle = animatedStyle as unknown as StyleProp<ViewStyle>;
  const resolvedStyle = React.useMemo<
    ComponentProps<typeof Pressable>['style']
  >(
    () =>
      typeof style === 'function'
        ? (state) => [animatedPressStyle, style(state)]
        : [animatedPressStyle, style],
    [animatedPressStyle, style]
  );

  return (
    <Animated.Pressable
      android_ripple={androidRipple}
      className={cn(
        'rounded-[22px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card',
        className
      )}
      onPressIn={handlePressInCombined}
      onPressOut={handlePressOutCombined}
      style={resolvedStyle}
      {...props}
    />
  );
}
