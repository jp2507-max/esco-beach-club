import React from 'react';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

export type ErrorBannerProps = {
  className?: string;
  message?: string | null;
  testID?: string;
  textClassName?: string;
};

export function ErrorBanner({
  className,
  message,
  testID,
  textClassName,
}: ErrorBannerProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <View
      className={cn('rounded-xl p-3', className)}
      style={{ backgroundColor: `${Colors.danger}22` }}
      testID={testID}
    >
      <Text
        className={cn('text-[13px] font-medium', textClassName)}
        style={{ color: Colors.danger }}
      >
        {message}
      </Text>
    </View>
  );
}
