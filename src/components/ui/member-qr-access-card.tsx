import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

import { MemberQrCode } from './member-qr-code';

export type MemberQrAccessCardProps = {
  brandLabel: string;
  children?: ReactNode;
  className?: string;
  emptyQrLabel: string;
  memberId: string;
  memberName?: string;
  qrSize: number;
  tierLabel?: string;
};

const CORNER_MARK_COLOR = `${Colors.gold}25`;
const CORNER_MARK_LENGTH = 18;
const CORNER_INSET = 20;

/** Premium access card with gold accents, QR code, and member identity. */
export function MemberQrAccessCard({
  brandLabel,
  children,
  className,
  emptyQrLabel,
  memberId,
  memberName,
  qrSize,
  tierLabel,
}: MemberQrAccessCardProps): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardGradient = useMemo((): readonly [string, string, string] => {
    if (isDark) return ['#0C0810', '#171020', '#140E14'];
    return [
      Colors.cardGradientStart,
      Colors.cardGradientMiddle,
      Colors.cardGradientEnd,
    ];
  }, [isDark]);

  return (
    <View
      style={{
        borderColor: `${Colors.gold}18`,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={cardGradient}
        end={{ x: 1, y: 1.1 }}
        start={{ x: 0, y: 0 }}
      >
        <View className={cn('relative px-7 pb-8 pt-7', className)}>
          <View className="mb-6 flex-row items-center justify-between">
            <Text
              className="text-[11px] font-extrabold tracking-[3px]"
              style={{ color: Colors.gold }}
            >
              {brandLabel}
            </Text>
            {tierLabel ? (
              <View
                className="rounded-full px-3 py-1"
                style={{ borderColor: `${Colors.gold}35`, borderWidth: 1 }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-[1.5px]"
                  style={{ color: Colors.goldBright }}
                >
                  {tierLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="items-center">
            <View
              className="items-center justify-center rounded-2xl p-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.96)' }}
            >
              <MemberQrCode
                className="bg-transparent p-0 dark:bg-transparent"
                emptyLabel={emptyQrLabel}
                memberId={memberId}
                size={qrSize}
              />
            </View>
          </View>

          {memberName ? (
            <Text className="mt-5 text-center text-[15px] font-bold tracking-[0.5px] text-white/90">
              {memberName}
            </Text>
          ) : null}

          {children}

          {/* Corner accent marks — luxury frame detail */}
          <View
            style={{
              backgroundColor: CORNER_MARK_COLOR,
              height: CORNER_MARK_LENGTH,
              left: CORNER_INSET,
              position: 'absolute',
              top: CORNER_INSET,
              width: 1,
            }}
          />
          <View
            style={{
              backgroundColor: CORNER_MARK_COLOR,
              height: 1,
              left: CORNER_INSET,
              position: 'absolute',
              top: CORNER_INSET,
              width: CORNER_MARK_LENGTH,
            }}
          />
          <View
            style={{
              backgroundColor: CORNER_MARK_COLOR,
              bottom: CORNER_INSET,
              height: CORNER_MARK_LENGTH,
              position: 'absolute',
              right: CORNER_INSET,
              width: 1,
            }}
          />
          <View
            style={{
              backgroundColor: CORNER_MARK_COLOR,
              bottom: CORNER_INSET,
              height: 1,
              position: 'absolute',
              right: CORNER_INSET,
              width: CORNER_MARK_LENGTH,
            }}
          />

          {/* Subtle ambient overlay */}
          <View
            className="absolute rounded-full"
            style={{
              backgroundColor: 'rgba(200,162,77,0.03)',
              height: 240,
              right: -80,
              top: -80,
              width: 240,
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              backgroundColor: 'rgba(233,30,99,0.025)',
              bottom: -60,
              height: 160,
              left: -40,
              width: 160,
            }}
          />
        </View>
      </LinearGradient>
    </View>
  );
}
