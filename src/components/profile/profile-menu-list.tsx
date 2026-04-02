import { ChevronRight } from 'lucide-react-native';
import React from 'react';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export type ProfileMenuItem = {
  color: string;
  disabled?: boolean;
  icon: React.ComponentType<{
    color?: string;
    size?: number;
  }>;
  id: string;
  label: string;
  route: string | null;
};

type ProfileMenuListProps = {
  comingSoonLabel: string;
  isDark: boolean;
  items: readonly ProfileMenuItem[];
  onPressItem: (item: ProfileMenuItem) => void | Promise<void>;
};

function ProfileMenuRowStagger({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

export function ProfileMenuList({
  comingSoonLabel,
  isDark,
  items,
  onPressItem,
}: ProfileMenuListProps): React.JSX.Element {
  return (
    <View className="overflow-hidden rounded-[18px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
      {items.map((item, index) => {
        const rowClassName =
          index < items.length - 1
            ? 'flex-row items-center border-b border-border px-4 py-[15px] dark:border-dark-border'
            : 'flex-row items-center px-4 py-[15px]';
        const accentColor = accentOnDarkBackground(item.color, isDark);
        const testID =
          item.id === 'delete-account'
            ? 'delete-account-option'
            : `menu-${item.id}`;

        if (item.disabled) {
          return (
            <ProfileMenuRowStagger key={item.id} index={index}>
              <View className={rowClassName} testID={testID}>
                <View
                  className="mr-3.5 size-[38px] items-center justify-center rounded-[10px] opacity-60"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <item.icon size={20} color={accentColor} />
                </View>
                <Text className="flex-1 text-[15px] font-semibold text-text-muted dark:text-text-muted-dark">
                  {item.label}
                </Text>
                <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
                  {comingSoonLabel}
                </Text>
              </View>
            </ProfileMenuRowStagger>
          );
        }

        return (
          <ProfileMenuRowStagger key={item.id} index={index}>
            <Pressable
              accessibilityRole="button"
              className={rowClassName}
              onPress={() => {
                void onPressItem(item);
              }}
              testID={testID}
            >
              <View
                className="mr-3.5 size-[38px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <item.icon size={20} color={accentColor} />
              </View>
              <Text className="flex-1 text-[15px] font-semibold text-text dark:text-text-primary-dark">
                {item.label}
              </Text>
              <ChevronRight
                size={18}
                color={isDark ? Colors.textMutedDark : Colors.textLight}
              />
            </Pressable>
          </ProfileMenuRowStagger>
        );
      })}
    </View>
  );
}
