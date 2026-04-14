import type React from 'react';

import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';

type AuthScreenContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthScreenContent({
  children,
  className,
}: AuthScreenContentProps): React.JSX.Element {
  return (
    <View className={cn('mx-auto w-full max-w-110', className)}>
      {children}
    </View>
  );
}
