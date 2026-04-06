import React from 'react';

import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

export type ScreenHeaderProps = {
  className?: string;
  /** Optional right-side action element (icon button, link, etc.) */
  rightAction?: React.ReactNode;
  /** Optional subtitle displayed beneath the title */
  subtitle?: string;
  testID?: string;
  title: string;
};

/**
 * Custom screen header for top-level tab screens.
 * Renders a prominent title with optional subtitle and right action.
 * Matches the visual language of ProfileSubScreenHeader but without a back button,
 * since these are root-level tab destinations.
 */
export function ScreenHeader({
  className,
  rightAction,
  subtitle,
  testID,
  title,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <View className={cn('px-5 pb-2 pt-3', className)} testID={testID}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-[34px] font-extrabold tracking-tight text-primary dark:text-primary-bright">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View className="ml-3 shrink-0">{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}
