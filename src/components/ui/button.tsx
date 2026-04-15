import type { ComponentProps, ReactNode } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { getAndroidRippleConfig } from '@/src/lib/styles/android-ripple';
import { cn } from '@/src/lib/utils';
import { ActivityIndicator, type Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const BUTTON_VARIANTS = {
  danger: {
    container: 'bg-danger dark:bg-error-dark',
    text: 'text-white',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-text dark:text-text-primary-dark',
  },
  outline: {
    container:
      'border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card',
    text: 'text-text dark:text-text-primary-dark',
  },
  primary: {
    container: 'bg-primary dark:bg-primary-bright',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-secondary dark:bg-secondary-bright',
    text: 'text-white dark:text-secondary-deeper',
  },
} as const;

const BUTTON_SIZES = {
  lg: 'min-h-14 rounded-2xl px-6 py-[18px]',
  md: 'min-h-12 rounded-xl px-5 py-3.5',
  sm: 'min-h-10 rounded-lg px-4 py-2.5',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

function getSpinnerColor(variant: ButtonVariant, isDark: boolean): string {
  if (variant === 'ghost' || variant === 'outline') {
    return isDark ? Colors.primaryBright : Colors.primary;
  }

  if (variant === 'secondary' && isDark) {
    return Colors.secondaryDeeper;
  }

  return Colors.white;
}

export type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  textClassName?: string;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityRole = 'button',
  children,
  className,
  contentClassName,
  disabled,
  isLoading = false,
  leftIcon,
  onPressIn,
  onPressOut,
  rightIcon,
  size = 'md',
  style,
  testID,
  textClassName,
  variant = 'primary',
  ...props
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || isLoading;
  const variantStyles = BUTTON_VARIANTS[variant];
  const isDark = useColorScheme() === 'dark';
  const spinnerColor = getSpinnerColor(variant, isDark);
  const { animatedStyle, handlePressIn, handlePressOut } = useButtonPress();
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
      if (!isDisabled) handlePressIn();
      onPressIn?.(event);
    },
    [handlePressIn, isDisabled, onPressIn]
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
      accessibilityRole={accessibilityRole}
      className={cn(
        'items-center justify-center',
        BUTTON_SIZES[size],
        variantStyles.container,
        isDisabled ? 'opacity-50' : undefined,
        className
      )}
      disabled={isDisabled}
      onPressIn={handlePressInCombined}
      onPressOut={handlePressOutCombined}
      style={resolvedStyle}
      testID={testID}
      {...props}
    >
      <View
        className={cn('flex-row items-center justify-center', contentClassName)}
      >
        {isLoading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <>
            {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
            <Text
              className={cn(
                'text-base font-bold',
                variantStyles.text,
                textClassName
              )}
            >
              {children}
            </Text>
            {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
          </>
        )}
      </View>
    </Animated.Pressable>
  );
}
