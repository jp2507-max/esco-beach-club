import React, { useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useColorScheme } from 'react-native';
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { cn } from '@/src/lib/utils';
import { ScrollView, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

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

type ItemLayout = {
  width: number;
  x: number;
};

type WeekStripDayProps = {
  accessibilityHint: string;
  accessibilityLabel: string;
  isSelected: boolean;
  item: WeekStripItem;
  onLayout: (event: LayoutChangeEvent) => void;
  onSelect: (key: string) => void;
  testID: string;
};

function WeekStripDay({
  accessibilityHint,
  accessibilityLabel,
  isSelected,
  item,
  onLayout,
  onSelect,
  testID,
}: WeekStripDayProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const progress = useSharedValue(isSelected ? 1 : 0);
  const {
    animatedStyle: pressStyle,
    handlePressIn,
    handlePressOut,
  } = useButtonPress(0.97, 'gentle');

  useEffect(() => {
    progress.set(withTiming(isSelected ? 1 : 0, rmTiming(motion.dur.sm)));
  }, [isSelected, progress]);

  const activeBorder = isDark ? Colors.primaryBright : Colors.primary;
  const inactiveBorder = isDark ? Colors.darkBorder : Colors.border;
  const activeBg = isDark ? Colors.ACTIVE_BG_DARK : Colors.ACTIVE_BG_LIGHT;
  const inactiveBg = isDark ? Colors.darkBgCard : Colors.card;
  const activeText = isDark ? Colors.primaryBright : Colors.primary;
  const inactiveShortText = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;
  const inactiveDateText = isDark ? Colors.textPrimaryDark : Colors.text;
  const indicatorColor = isDark ? Colors.secondaryBright : Colors.secondary;

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveBg, activeBg]
    ),
    borderColor: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveBorder, activeBorder]
    ),
  }));

  const shortLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveShortText, activeText]
    ),
  }));

  const dateLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.get(),
      [0, 1],
      [inactiveDateText, activeText]
    ),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    backgroundColor: indicatorColor,
    opacity: item.showIndicator ? 0.35 + progress.get() * 0.65 : 0,
    transform: [{ scale: item.showIndicator ? 0.9 + progress.get() * 0.2 : 1 }],
  }));

  return (
    <Animated.Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="items-center rounded-2xl border px-3.5 py-2.5"
      onLayout={onLayout}
      onPress={() => onSelect(item.key)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, pressStyle]}
      testID={testID}
    >
      <Animated.Text className="text-xs font-semibold" style={shortLabelStyle}>
        {item.shortLabel}
      </Animated.Text>
      <Animated.Text
        className="mt-0.5 text-lg font-extrabold"
        style={dateLabelStyle}
      >
        {item.dateLabel}
      </Animated.Text>
      <Animated.View
        className="mt-1.5 size-1.5 rounded-full"
        style={indicatorStyle}
      />
    </Animated.Pressable>
  );
}

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
  const scrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>(
    null
  );
  const itemLayoutsRef = React.useRef<Record<string, ItemLayout>>({});
  const contentWidthRef = React.useRef(0);
  const viewportWidthRef = React.useRef(0);

  const centerSelectedItem = React.useCallback((key: string): void => {
    const layout = itemLayoutsRef.current[key];
    const scrollView = scrollRef.current;
    if (!layout || !scrollView || viewportWidthRef.current === 0) return;

    const maxOffset = Math.max(
      contentWidthRef.current - viewportWidthRef.current,
      0
    );
    const targetOffset = Math.max(
      0,
      Math.min(
        layout.x - (viewportWidthRef.current - layout.width) / 2,
        maxOffset
      )
    );

    scrollView.scrollTo({ animated: true, x: targetOffset });
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      centerSelectedItem(selectedKey);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [centerSelectedItem, selectedKey]);

  const handleScrollLayout = React.useCallback(
    (event: LayoutChangeEvent): void => {
      viewportWidthRef.current = event.nativeEvent.layout.width;
      centerSelectedItem(selectedKey);
    },
    [centerSelectedItem, selectedKey]
  );

  const handleContentSizeChange = React.useCallback(
    (width: number): void => {
      contentWidthRef.current = width;
      centerSelectedItem(selectedKey);
    },
    [centerSelectedItem, selectedKey]
  );

  const handleItemLayout = React.useCallback(
    (key: string, event: LayoutChangeEvent): void => {
      itemLayoutsRef.current[key] = {
        width: event.nativeEvent.layout.width,
        x: event.nativeEvent.layout.x,
      };

      if (key === selectedKey) {
        centerSelectedItem(key);
      }
    },
    [centerSelectedItem, selectedKey]
  );

  return (
    <View className={className}>
      <ScrollView
        contentContainerClassName={cn('mb-5 gap-2', contentContainerClassName)}
        horizontal
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleScrollLayout}
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
      >
        {items.map((item) => (
          <WeekStripDay
            accessibilityHint={accessibilityHint}
            accessibilityLabel={
              getAccessibilityLabel
                ? getAccessibilityLabel(item)
                : item.fullLabel
            }
            isSelected={item.key === selectedKey}
            item={item}
            key={item.key}
            onLayout={(event) => {
              handleItemLayout(item.key, event);
            }}
            onSelect={onSelect}
            testID={`${testIDPrefix}-${item.key}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}
