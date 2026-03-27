import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';

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
    container: 'bg-secondary',
    text: 'text-white',
  },
} as const;

const BUTTON_SIZES = {
  lg: 'min-h-14 rounded-2xl px-6 py-[18px]',
  md: 'min-h-12 rounded-xl px-5 py-3.5',
  sm: 'min-h-10 rounded-lg px-4 py-2.5',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

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
  rightIcon,
  size = 'md',
  testID,
  textClassName,
  variant = 'primary',
  ...props
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || isLoading;
  const variantStyles = BUTTON_VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn(
        'items-center justify-center',
        BUTTON_SIZES[size],
        variantStyles.container,
        isDisabled ? 'opacity-50' : undefined,
        className
      )}
      disabled={isDisabled}
      testID={testID}
      {...props}
    >
      <View
        className={cn('flex-row items-center justify-center', contentClassName)}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
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
    </Pressable>
  );
}
