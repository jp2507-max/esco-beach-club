import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { cn } from '@/src/lib/utils';
import { View } from '@/src/tw';

export const APP_SCREEN_MAX_WIDTH = 820;

type AppScreenContentProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppScreenContent({
  children,
  className,
  maxWidth = APP_SCREEN_MAX_WIDTH,
  style,
}: AppScreenContentProps): React.JSX.Element {
  return (
    <View
      className={cn('w-full self-center', className)}
      style={[{ maxWidth }, style]}
    >
      {children}
    </View>
  );
}
