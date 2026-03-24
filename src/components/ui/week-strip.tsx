import React from 'react';

import { cn } from '@/src/lib/utils';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

export type WeekStripItem = {
  dateLabel: string;
  fullLabel: string;
  key: string;
  shortLabel: string;
  showIndicator?: boolean;
};

export type WeekStripProps = {
  accessibilityHint: string;
  className?: string;
  contentContainerClassName?: string;
  getAccessibilityLabel?: (item: WeekStripItem) => string;
  items: readonly WeekStripItem[];
  onSelect: (key: string) => void;
  selectedKey: string;
  testIDPrefix?: string;
};

export function WeekStrip({
  accessibilityHint,
  className,
  contentContainerClassName,
  getAccessibilityLabel,
  items,
  onSelect,
  selectedKey,
  testIDPrefix = 'week-day',
}: WeekStripProps): React.JSX.Element {
  return (
    <View className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName={cn('mb-5 gap-2', contentContainerClassName)}
      >
        {items.map((item) => {
          const isSelected = item.key === selectedKey;

          return (
            <Pressable
              accessibilityHint={accessibilityHint}
              accessibilityLabel={
                getAccessibilityLabel
                  ? getAccessibilityLabel(item)
                  : item.fullLabel
              }
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={
                isSelected
                  ? 'items-center rounded-2xl border border-primary bg-primary/10 px-3.5 py-2.5 dark:border-primary-bright dark:bg-primary-bright/10'
                  : 'items-center rounded-2xl border border-border bg-card px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card'
              }
              key={item.key}
              onPress={() => onSelect(item.key)}
              testID={`${testIDPrefix}-${item.key}`}
            >
              <Text
                className={
                  isSelected
                    ? 'text-xs font-semibold text-primary dark:text-primary-bright'
                    : 'text-xs font-semibold text-text-secondary dark:text-text-secondary-dark'
                }
              >
                {item.shortLabel}
              </Text>
              <Text
                className={
                  isSelected
                    ? 'mt-0.5 text-lg font-extrabold text-primary dark:text-primary-bright'
                    : 'mt-0.5 text-lg font-extrabold text-text dark:text-text-primary-dark'
                }
              >
                {item.dateLabel}
              </Text>
              <View
                className={
                  item.showIndicator
                    ? 'mt-1.5 size-1.5 rounded-full bg-secondary'
                    : 'mt-1.5 size-1.5 rounded-full bg-transparent'
                }
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
