import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode, useState } from 'react';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

import { MemberQrCode } from './member-qr-code';

export type MemberQrAccessCardProps = {
  brandAccessibilityHint: string;
  brandLabel: string;
  children?: ReactNode;
  className?: string;
  emptyQrLabel: string;
  gradientColors: readonly [string, string, string];
  memberId: string;
  memberName?: string;
  qrSize: number;
  tierLabel?: string;
};

const CORNER_MARK_COLOR = `${Colors.gold}25`;
const CORNER_MARK_LENGTH = 18;
const CORNER_INSET = 20;
const memberCardBrandLogo = require('@/assets/images/member-card-brand-horizontal.png');

/** Premium access card with gold accents, QR code, and member identity. */
export function MemberQrAccessCard({
  brandAccessibilityHint,
  brandLabel,
  children,
  className,
  emptyQrLabel,
  gradientColors,
  memberId,
  memberName,
  qrSize,
  tierLabel,
}: MemberQrAccessCardProps): React.JSX.Element {
  const [brandLogoFailed, setBrandLogoFailed] = useState(false);

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
        colors={gradientColors}
        end={{ x: 1, y: 1.1 }}
        start={{ x: 0, y: 0 }}
      >
        <View className={cn('relative px-7 pb-8 pt-7', className)}>
          <View className="mb-6 flex-row items-center justify-between gap-3">
            <View
              accessibilityHint={brandAccessibilityHint}
              accessibilityLabel={brandLabel}
              accessibilityRole="header"
              className="min-w-0 min-h-11 flex-1 justify-center"
            >
              {brandLogoFailed ? (
                <Text
                  className="text-2xl font-black uppercase tracking-[0.18em] text-white"
                  numberOfLines={2}
                >
                  {brandLabel}
                </Text>
              ) : (
                <Image
                  accessibilityHint={brandAccessibilityHint}
                  accessibilityLabel={brandLabel}
                  className="w-full"
                  contentFit="contain"
                  contentPosition="left center"
                  onError={() => setBrandLogoFailed(true)}
                  source={memberCardBrandLogo}
                  style={{ alignSelf: 'stretch', height: 40, width: '100%' }}
                />
              )}
            </View>
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
