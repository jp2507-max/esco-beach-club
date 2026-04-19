import type { ComponentProps } from 'react';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { getAndroidRippleConfig } from '@/src/lib/styles/android-ripple';
import { cn } from '@/src/lib/utils';
import { Pressable, Text, View } from '@/src/tw';

export type SectionHeaderProps = ComponentProps<typeof View> & {
  actionLabel?: string;
  className?: string;
  onActionPress?: () => void;
  title: string;
};

export function SectionHeader({
  actionLabel,
  className,
  onActionPress,
  title,
  ...props
}: SectionHeaderProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const androidRipple = React.useMemo(
    () =>
      getAndroidRippleConfig(
        isDark ? Colors.ACTIVE_BG_DARK : Colors.ACTIVE_BG_LIGHT,
        { borderless: true }
      ),
    [isDark]
  );

  return (
    <View
      className={cn('flex-row items-center justify-between gap-3', className)}
      {...props}
    >
      <Text className="flex-1 text-[17px] font-bold text-text dark:text-text-primary-dark">
        {title}
      </Text>
      {actionLabel ? (
        onActionPress ? (
          <Pressable
            accessibilityRole="button"
            android_ripple={androidRipple}
            hitSlop={8}
            onPress={onActionPress}
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-bright">
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
            {actionLabel}
          </Text>
        )
      ) : null}
    </View>
  );
}
