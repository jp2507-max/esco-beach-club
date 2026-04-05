import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme, useWindowDimensions } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useMemberSummary } from '@/providers/DataProvider';
import { MemberQrAccessCard } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { hapticSuccess } from '@/src/lib/haptics/haptics';
import {
  getRewardTierLabelKey,
  normalizeRewardTierKey,
} from '@/src/lib/loyalty';
import { getTierQrGradient } from '@/src/lib/profile/membership-screen';
import { Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const QR_WIDTH_GUTTER = 108;
const QR_SIZE_MIN = 180;
const QR_SIZE_MAX = 280;

export default function QrTabScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const memberSummary = useMemberSummary();
  const didPlayRevealHaptic = useRef(false);

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.7);

  const qrSize = useMemo((): number => {
    const maxByLayout = width - QR_WIDTH_GUTTER;
    return Math.max(
      QR_SIZE_MIN,
      Math.min(QR_SIZE_MAX, Math.floor(maxByLayout))
    );
  }, [width]);

  useEffect(() => {
    headerOpacity.set(withTiming(1, rmTiming(motion.dur.md)));
    cardScale.set(withDelay(100, withSpring(1, motion.spring.gentle)));
    cardOpacity.set(withDelay(100, withTiming(1, rmTiming(motion.dur.lg))));
    glowScale.set(withDelay(200, withSpring(1, motion.spring.gentle)));
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
      cancelAnimation(headerOpacity);
      cancelAnimation(glowScale);
    };
  }, [cardOpacity, cardScale, glowScale, headerOpacity]);

  useEffect(() => {
    if (didPlayRevealHaptic.current) return;
    didPlayRevealHaptic.current = true;
    hapticSuccess();
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.get(),
  }));

  const cardRevealStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ scale: cardScale.get() }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{ scale: glowScale.get() }],
  }));

  const memberId = memberSummary.memberId;
  const memberName = memberSummary.fullName || undefined;
  const tierLabel = t(
    `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );

  const tierLevel = normalizeRewardTierKey(memberSummary.lifetimeTierKey);
  const qrCardGradient = useMemo(
    () => getTierQrGradient(tierLevel, isDark),
    [tierLevel, isDark]
  );

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}
    >
      {/* Atmospheric ambient orbs */}
      <View className="absolute inset-0 overflow-hidden">
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: isDark
              ? Colors.qrOrbPrimaryDark
              : Colors.qrOrbPrimaryLight,
            height: 320,
            left: -120,
            top: '10%',
            width: 320,
          }}
        />
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: isDark
              ? Colors.qrOrbGoldDark
              : Colors.qrOrbGoldLight,
            height: 220,
            right: -80,
            top: '25%',
            width: 220,
          }}
        />
        <View
          className="absolute rounded-full"
          style={{
            backgroundColor: isDark
              ? Colors.qrOrbAccentDark
              : Colors.qrOrbAccentLight,
            bottom: '8%',
            height: 180,
            left: '25%',
            width: 180,
          }}
        />
      </View>

      {/* Centered content */}
      <View className="flex-1 items-center justify-center px-5">
        {/* Header */}
        <Animated.View className="mb-8 items-center" style={headerStyle}>
          <Text
            className="text-[11px] font-extrabold tracking-[3px]"
            style={{ color: Colors.secondaryBright }}
          >
            {t('accessPass')}
          </Text>
          <Text className="mt-3 text-center text-base font-medium leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('scanAtTable')}
          </Text>
        </Animated.View>

        {/* Card with ambient glow */}
        <View className="w-full">
          <Animated.View
            className="absolute inset-0 items-center justify-center"
            style={glowStyle}
          >
            <View
              className="rounded-full"
              style={{
                backgroundColor: isDark
                  ? Colors.qrGlowDark
                  : Colors.qrGlowLight,
                height: 300,
                width: 300,
              }}
            />
          </Animated.View>

          <Animated.View style={cardRevealStyle}>
            <MemberQrAccessCard
              brandAccessibilityHint={tCommon('branding.markHint')}
              brandLabel={tCommon('branding.mark')}
              emptyQrLabel={t('staff.memberNotFound')}
              gradientColors={qrCardGradient}
              memberId={memberId}
              memberName={memberName}
              qrSize={qrSize}
              tierLabel={tierLabel}
            >
              <View className="mt-5 items-center">
                <Text
                  className="text-[12px] font-medium tracking-[0.5px]"
                  style={{ color: Colors.qrRefText }}
                >
                  {t('refPrefix', { memberId })}
                </Text>
              </View>
            </MemberQrAccessCard>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
