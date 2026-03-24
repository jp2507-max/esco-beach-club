import type { ComponentProps } from 'react';
import React from 'react';

import { cn } from '@/src/lib/utils';
import { Pressable } from '@/src/tw';

export type SurfacePressableCardProps = ComponentProps<typeof Pressable>;

export function SurfacePressableCard({
  className,
  ...props
}: SurfacePressableCardProps): React.JSX.Element {
  return (
    <Pressable
      className={cn(
        'rounded-[22px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card',
        className
      )}
      {...props}
    />
  );
}
