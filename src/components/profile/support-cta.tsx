import { Crown, Headphones } from 'lucide-react-native';
import React from 'react';

import { Colors } from '@/constants/colors';
import { getAndroidRippleConfig } from '@/src/lib/styles/android-ripple';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, Text } from '@/src/tw';

type SupportCtaProps = {
  conciergeLabel: string;
  hasPrioritySupport: boolean;
  isDark: boolean;
  onConcierge: () => void;
  onSupport: () => void;
  supportLabel: string;
};

export function SupportCta({
  conciergeLabel,
  hasPrioritySupport,
  isDark,
  onConcierge,
  onSupport,
  supportLabel,
}: SupportCtaProps): React.JSX.Element {
  const androidRipple = getAndroidRippleConfig(
    isDark ? Colors.ACTIVE_BG_DARK : Colors.ACTIVE_BG_LIGHT
  );

  if (hasPrioritySupport) {
    return (
      <Pressable
        android_ripple={androidRipple}
        accessibilityRole="button"
        className="mb-5 flex-row items-center justify-center rounded-2xl py-4"
        onPress={onConcierge}
        style={{
          ...shadows.level3,
          backgroundColor: Colors.gold,
          shadowColor: Colors.gold,
          shadowOpacity: 0.22,
        }}
        testID="vip-concierge"
      >
        <Crown size={20} color={Colors.white} />
        <Text className="ml-2.5 text-base font-bold text-white">
          {conciergeLabel}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      android_ripple={androidRipple}
      accessibilityRole="button"
      className="mb-5 flex-row items-center justify-center rounded-2xl border-2 border-secondary py-3.5 dark:border-secondary-bright"
      onPress={onSupport}
      testID="contact-support"
    >
      <Headphones
        size={20}
        color={isDark ? Colors.secondaryBright : Colors.secondary}
      />
      <Text className="ml-2.5 text-base font-bold text-secondary dark:text-secondary-bright">
        {supportLabel}
      </Text>
    </Pressable>
  );
}
