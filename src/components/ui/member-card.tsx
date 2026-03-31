import { LinearGradient } from 'expo-linear-gradient';
import { Wifi } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

import { MemberQrCode } from './member-qr-code';

type MemberCardCopy = {
  balanceLabel: string;
  balanceSuffix: string;
  brandLabel: string;
  emptyQrLabel: string;
  memberNameLabel: string;
  statusLabel?: string;
};

export type MemberCardProps = {
  cashbackPoints: number;
  className?: string;
  copy: MemberCardCopy;
  memberId: string;
  memberName: string;
  tierProgressPercent: number;
  tierLabel: string;
  variant?: 'compact' | 'full';
};

export function MemberCard({
  cashbackPoints,
  className,
  copy,
  memberId,
  memberName,
  tierProgressPercent,
  tierLabel,
  variant = 'compact',
}: MemberCardProps): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isCompact = variant === 'compact';
  const clampedProgress =
    `${Math.max(0, Math.min(tierProgressPercent, 100))}%` as `${number}%`;
  const qrSize = isCompact ? 36 : 148;

  const gradientColors = useMemo((): readonly [string, string, string] => {
    if (isDark) {
      const [a, b, c] = Colors.cardGradientDark;
      return [a, b, c];
    }
    return [
      Colors.cardGradientStart,
      Colors.cardGradientMiddle,
      Colors.cardGradientEnd,
    ];
  }, [isDark]);

  return (
    <LinearGradient
      colors={gradientColors}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ borderRadius: 20, overflow: 'hidden' }}
    >
      <View
        className={cn(
          'overflow-hidden',
          isCompact ? 'px-5.5 py-5.5' : 'px-6 py-6',
          className
        )}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-extrabold tracking-[2px] text-white/85">
            {copy.brandLabel}
          </Text>
          <Wifi color="rgba(255,255,255,0.8)" size={isCompact ? 24 : 26} />
        </View>

        <View className="mb-1 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text
              className={cn(
                'font-extrabold text-white',
                isCompact ? 'text-2xl' : 'text-[30px]'
              )}
              numberOfLines={1}
            >
              {tierLabel}
            </Text>
            <Text className="mt-0.5 text-xs font-medium text-white/85">
              {copy.balanceLabel}
            </Text>
          </View>
          {copy.statusLabel ? (
            <Text className="mt-1 text-right text-xs font-semibold text-white/85">
              {copy.statusLabel}
            </Text>
          ) : null}
        </View>

        <View className="mb-2 mt-2 flex-row items-baseline">
          <Text
            className={cn(
              'font-extrabold text-white',
              isCompact ? 'text-[40px]' : 'text-[42px]'
            )}
          >
            {cashbackPoints.toLocaleString()}
          </Text>
          <Text className="ml-1.5 text-sm font-medium text-white/80">
            {copy.balanceSuffix}
          </Text>
        </View>

        <View className="mb-4 h-1.5 rounded-full bg-white/25">
          <View
            className="h-1.5 rounded-full bg-white"
            style={{ width: clampedProgress }}
          />
        </View>

        <View className="flex-row items-end justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[10px] font-semibold tracking-[1px] text-white/80">
              {copy.memberNameLabel}
            </Text>
            <Text
              className={cn(
                'mt-1 font-bold text-white',
                isCompact ? 'text-base' : 'text-lg'
              )}
              numberOfLines={1}
            >
              {memberName}
            </Text>
          </View>

          <View
            className={cn(
              'items-center justify-center rounded-md bg-white/92',
              isCompact ? 'size-14 p-1.5' : 'size-[168px] rounded-xl p-2.5'
            )}
          >
            <MemberQrCode
              className={cn(
                'bg-transparent p-0 dark:bg-transparent',
                isCompact ? 'size-11 rounded-md' : 'rounded-lg'
              )}
              emptyLabel={copy.emptyQrLabel}
              memberId={memberId}
              size={qrSize}
            />
          </View>
        </View>

        <View
          className="absolute size-37.5 rounded-full"
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            right: -30,
            top: -30,
          }}
        />
        <View
          className="absolute size-25 rounded-full"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            bottom: -20,
            left: 50,
          }}
        />
      </View>
    </LinearGradient>
  );
}
