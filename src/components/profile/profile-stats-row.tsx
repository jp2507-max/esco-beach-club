import React from 'react';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { Text, View } from '@/src/tw';

type StatCardProps = {
  accentColor: string;
  label: string;
  progressDegrees: number;
  progressTrackColor: string;
  value: string;
};

type ProfileStatsRowProps = {
  earnedLabel: string;
  earnedProgressDegrees: number;
  earnedValue: string;
  isDark: boolean;
  savedLabel: string;
  savedProgressDegrees: number;
  savedValue: string;
};

function StatCard({
  accentColor,
  label,
  progressDegrees,
  progressTrackColor,
  value,
}: StatCardProps): React.JSX.Element {
  const clampedDegrees = Math.max(0, Math.min(progressDegrees, 360));

  return (
    <View className="flex-1 items-center rounded-[18px] border border-border bg-white p-[18px] dark:border-dark-border dark:bg-dark-bg-card">
      <View className="mb-2.5 size-[60px] items-center justify-center">
        <View
          className="size-[60px] rounded-full border-[5px]"
          style={{ borderColor: progressTrackColor }}
        >
          <View
            className="absolute left-[-5px] top-[-5px] size-[60px] rounded-full border-[5px]"
            style={{
              borderColor: accentColor,
              borderTopColor: 'transparent',
              transform: [{ rotate: `${clampedDegrees}deg` }],
            }}
          />
        </View>
      </View>
      <Text className="mb-0.5 text-[10px] font-bold tracking-[1px] text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
        {value}
      </Text>
    </View>
  );
}

export function ProfileStatsRow({
  earnedLabel,
  earnedProgressDegrees,
  earnedValue,
  isDark,
  savedLabel,
  savedProgressDegrees,
  savedValue,
}: ProfileStatsRowProps): React.JSX.Element {
  return (
    <View className="mb-5 flex-row">
      <View className="mr-3 flex-1">
        <StatCard
          accentColor={accentOnDarkBackground(Colors.primary, isDark)}
          label={earnedLabel}
          progressDegrees={earnedProgressDegrees}
          progressTrackColor={
            isDark ? `${Colors.primaryBright}30` : `${Colors.primary}25`
          }
          value={earnedValue}
        />
      </View>
      <StatCard
        accentColor={accentOnDarkBackground(Colors.secondary, isDark)}
        label={savedLabel}
        progressDegrees={savedProgressDegrees}
        progressTrackColor={
          isDark ? `${Colors.secondaryBright}28` : `${Colors.secondary}25`
        }
        value={savedValue}
      />
    </View>
  );
}
