import React from 'react';
import { useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/colors';
import { buildMemberQrValue } from '@/src/lib/loyalty';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

export type MemberQrCodeProps = {
  className?: string;
  emptyLabel: string;
  memberId: string;
  size?: number;
};

export function MemberQrCode({
  className,
  emptyLabel,
  memberId,
  size = 180,
}: MemberQrCodeProps): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const qrValue = buildMemberQrValue(memberId);

  return (
    <View
      className={cn(
        'items-center justify-center rounded-[16px] bg-white p-4 dark:bg-dark-bg-card',
        className
      )}
    >
      {qrValue ? (
        <QRCode
          value={qrValue}
          size={size}
          color={isDark ? Colors.textPrimaryDark : Colors.text}
          backgroundColor="transparent"
        />
      ) : (
        <Text className="text-center text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">
          {emptyLabel}
        </Text>
      )}
    </View>
  );
}
