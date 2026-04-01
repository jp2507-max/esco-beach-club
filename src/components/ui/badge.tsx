import type { ComponentProps } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

const BADGE_TONES = {
  danger: {
    container: 'bg-danger/15 dark:bg-error-dark/25',
    text: 'text-danger dark:text-error-dark',
  },
  neutral: {
    container: 'bg-sand dark:bg-dark-bg',
    text: 'text-text-secondary dark:text-text-secondary-dark',
  },
  primary: {
    container: 'bg-primary/15 dark:bg-primary-bright/25',
    text: 'text-primary dark:text-primary-bright',
  },
  secondary: {
    container: 'bg-secondary/15 dark:bg-secondary/25',
    text: 'text-secondary dark:text-secondary-bright',
  },
  success: {
    container: 'bg-success/15 dark:bg-success/25',
    text: 'text-success dark:text-success-bright',
  },
  warning: {
    container: 'bg-warning/15 dark:bg-warning-dark/25',
    text: 'text-warning dark:text-warning-dark',
  },
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export type BadgeProps = ComponentProps<typeof View> & {
  className?: string;
  label: string;
  labelClassName?: string;
  tone?: BadgeTone;
};

export function Badge({
  className,
  label,
  labelClassName,
  tone = 'neutral',
  ...props
}: BadgeProps): React.JSX.Element {
  const toneStyles = BADGE_TONES[tone];

  return (
    <View
      className={cn('rounded-full px-3 py-1', toneStyles.container, className)}
      {...props}
    >
      <Text
        className={cn('text-xs font-semibold', toneStyles.text, labelClassName)}
      >
        {label}
      </Text>
    </View>
  );
}
