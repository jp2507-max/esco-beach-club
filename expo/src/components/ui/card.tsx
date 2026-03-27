import type { ComponentProps } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';

export type CardProps = ComponentProps<typeof View>;

export function Card({ className, ...props }: CardProps): React.JSX.Element {
  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card',
        className
      )}
      {...props}
    />
  );
}
