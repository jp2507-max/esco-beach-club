import type { ComponentProps } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';

export type SurfaceCardProps = ComponentProps<typeof View>;

export function SurfaceCard({
  className,
  ...props
}: SurfaceCardProps): React.JSX.Element {
  return (
    <View
      className={cn(
        'rounded-[22px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card',
        className
      )}
      {...props}
    />
  );
}
