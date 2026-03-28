import React from 'react';

import { cn } from '@/src/lib/utils';
import { Pressable, Text } from '@/src/tw';

type InfoDotProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  className?: string;
  onPress: () => void;
  size?: 'md' | 'sm';
  testID?: string;
};

export function InfoDot({
  accessibilityHint,
  accessibilityLabel,
  className,
  onPress,
  size = 'sm',
  testID,
}: InfoDotProps): React.JSX.Element {
  const containerClassName =
    size === 'md'
      ? 'size-6 items-center justify-center rounded-full border border-border bg-background dark:border-dark-border dark:bg-dark-bg-elevated'
      : 'size-5 items-center justify-center rounded-full border border-border bg-background dark:border-dark-border dark:bg-dark-bg-elevated';

  const textClassName =
    size === 'md'
      ? 'text-[13px] font-extrabold text-secondary dark:text-secondary-fixed'
      : 'text-[12px] font-extrabold text-secondary dark:text-secondary-fixed';

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cn(containerClassName, className)}
      onPress={onPress}
      testID={testID}
    >
      <Text className={textClassName}>!</Text>
    </Pressable>
  );
}
