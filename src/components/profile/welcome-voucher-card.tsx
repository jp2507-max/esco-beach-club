import { Ticket } from 'lucide-react-native';
import React from 'react';

import { Colors } from '@/constants/colors';
import { Pressable, Text, View } from '@/src/tw';

type WelcomeVoucherCardProps = {
  badgeLabel: string;
  codeLabel: string;
  gotItLabel: string;
  isDark: boolean;
  onDismiss: () => void;
  subtitle: string;
  termsLabel: string;
  title: string;
};

export function WelcomeVoucherCard({
  badgeLabel,
  codeLabel,
  gotItLabel,
  isDark,
  onDismiss,
  subtitle,
  termsLabel,
  title,
}: WelcomeVoucherCardProps): React.JSX.Element {
  const voucherNotchBg = isDark ? Colors.darkBg : Colors.voucherNotchBg;

  return (
    <View
      className="items-center overflow-hidden rounded-[20px] border-2 bg-white p-6 dark:bg-dark-bg-card"
      style={{
        borderColor: `${Colors.primary}30`,
        borderStyle: 'dashed',
      }}
    >
      <View
        className="absolute left-[-14px] size-7 rounded-full"
        style={{ backgroundColor: voucherNotchBg, top: '45%' }}
      />
      <View
        className="absolute right-[-14px] size-7 rounded-full"
        style={{ backgroundColor: voucherNotchBg, top: '45%' }}
      />
      <View className="mb-2 flex-row items-center">
        <Ticket color={Colors.primary} size={22} />
        <Text className="ml-2 text-[11px] font-extrabold tracking-[2px] text-primary">
          {badgeLabel}
        </Text>
      </View>
      <Text className="mb-0.5 text-[42px] font-black text-text dark:text-text-primary-dark">
        {title}
      </Text>
      <Text className="mb-3.5 text-base font-semibold text-text-secondary dark:text-text-secondary-dark">
        {subtitle}
      </Text>
      <View className="mb-3.5 h-px w-4/5 bg-border dark:bg-dark-border" />
      <Text className="mb-1.5 text-lg font-extrabold tracking-[2px] text-secondary dark:text-secondary-bright">
        {codeLabel}
      </Text>
      <Text className="mb-4 text-xs text-text-muted dark:text-text-muted-dark">
        {termsLabel}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="rounded-xl bg-primary px-8 py-2.5"
        onPress={onDismiss}
      >
        <Text className="text-sm font-bold text-white">{gotItLabel}</Text>
      </Pressable>
    </View>
  );
}
