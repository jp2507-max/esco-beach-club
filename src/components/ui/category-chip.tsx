import type { ComponentProps } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { Pressable, Text } from '@/src/tw';

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
  ...props
}: CategoryChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'rounded-full border border-border bg-card px-5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card',
        isActive ? 'border-secondary bg-secondary' : undefined,
        className
      )}
      onPress={onPress}
      {...props}
    >
      <Text
        className={cn(
          'text-sm font-semibold text-text dark:text-text-primary-dark',
          isActive ? 'text-white' : undefined,
          labelClassName
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
