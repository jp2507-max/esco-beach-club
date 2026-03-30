import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Award, Check, Copy, Percent, Star, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { claimPartnerRedemption } from '@/lib/api';
import { usePartnerById, useUserId } from '@/providers/DataProvider';
import { HeaderGlassButton } from '@/src/components/ui';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { captureHandledError } from '@/src/lib/monitoring';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

export default function PartnerModal(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('perks');
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const partner = usePartnerById(id);
  const userId = useUserId();
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const claimMutation = useMutation({
    mutationFn: async (redemptionMethod: string) => {
      if (!partner || !userId) {
        throw new Error('missingPartnerOrUser');
      }

      return claimPartnerRedemption({
        partner_code: partner.code,
        partner_id: partner.id,
        redemption_method: redemptionMethod,
        user_id: userId,
      });
    },
  });

  useEffect(() => {
    scale.set(withSpring(1, motion.spring.gentle));
    opacity.set(withTiming(1, rmTiming(300)));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [id, opacity, scale]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  async function handleCopy(): Promise<void> {
    if (!partner || claimMutation.isPending) return;

    try {
      await claimMutation.mutateAsync('code_copy');
      await Clipboard.setStringAsync(partner.code);
      setCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error: unknown) {
      captureHandledError(error, {
        extras: { partnerId: partner.id, userId },
        tags: {
          area: 'perks',
          operation: 'copy_redemption_code',
        },
      });
      console.error('[PartnerModal] Failed to copy redemption code:', error);
      Alert.alert(
        t('partner.redemptionFailedTitle'),
        t('partner.redemptionFailedMessage')
      );
    }
  }

  async function handleClaim(): Promise<void> {
    if (!partner || claimMutation.isPending) return;

    try {
      await claimMutation.mutateAsync('cta_unlock');
      router.back();
    } catch (error: unknown) {
      captureHandledError(error, {
        extras: { partnerId: partner.id, userId },
        tags: {
          area: 'perks',
          operation: 'claim_redemption',
        },
      });
      console.error('[PartnerModal] Failed to claim redemption:', error);
      Alert.alert(
        t('partner.redemptionFailedTitle'),
        t('partner.redemptionFailedMessage')
      );
    }
  }

  if (!partner) {
    return (
      <View
        className="flex-1 bg-black/70 px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-base text-white">{t('partner.notFound')}</Text>
        <Pressable
          className="mt-4 self-start"
          accessibilityRole="button"
          accessibilityLabel={t('partner.maybeLater')}
          accessibilityHint={t('partner.maybeLaterHint')}
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-white/90">
            {t('partner.maybeLater')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black/55">
      <HeaderGlassButton
        accessibilityLabel={t('partner.close')}
        accessibilityHint={t('partner.closeHint')}
        className="absolute right-4 z-10 size-9 border-white/35"
        onPress={() => router.back()}
        style={{ top: insets.top + 12 }}
        testID="close-modal"
        variant="overlay"
      >
        <X color={Colors.text} size={20} />
      </HeaderGlassButton>

      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] px-7 pb-10 pt-3"
        style={{ backgroundColor: '#FFF8F5', minHeight: '60%' }}
      >
        <View className="mb-4 h-1 w-10 self-center rounded bg-border" />

        <Animated.View className="items-center" style={contentStyle}>
          <Image
            className="mb-4 size-20 rounded-2xl"
            contentFit="cover"
            recyclingKey={`partner-header-${partner.id}`}
            source={{ uri: partner.image }}
            transition={180}
          />

          <View className="mb-4 items-center">
            <View
              className="mb-1.5 size-20 items-center justify-center rounded-full border-[3px]"
              style={{ backgroundColor: '#FFF8E1', borderColor: '#F9A825' }}
            >
              <Star size={32} color="#F9A825" fill="#F9A825" />
            </View>
            <Text className="text-[11px] font-extrabold tracking-[1.5px] text-[#F9A825]">
              {t('partner.unlocked')}
            </Text>
          </View>

          <Text className="text-center text-[28px] font-extrabold text-text">
            {t('partner.congratulations')}
          </Text>
          <Text className="mb-2.5 text-center text-[28px] font-extrabold text-primary">
            {partner.discount_label}!
          </Text>
          <Text className="mb-6 text-center text-sm leading-[22px] text-text-secondary">
            {t('partner.benefitsDescription', {
              name: partner.name,
              description: partner.description,
            })}
          </Text>

          <View className="mb-6 flex-row">
            <View className="mr-4 size-[90px] items-center justify-center rounded-2xl border border-border bg-white">
              <Award size={24} color={Colors.primary} />
              <Text className="mt-1.5 text-xs font-semibold text-text">
                {t('partner.exclusive')}
              </Text>
            </View>
            <View className="mr-4 size-[90px] items-center justify-center rounded-2xl border border-border bg-white">
              <Percent size={24} color={Colors.primary} />
              <Text className="mt-1.5 text-xs font-semibold text-text">
                {t('partner.discount')}
              </Text>
            </View>
            <View className="size-[90px] items-center justify-center rounded-2xl border border-border bg-white">
              <Star size={24} color={Colors.primary} />
              <Text className="mt-1.5 text-xs font-semibold text-text">
                {t('partner.vipPerk')}
              </Text>
            </View>
          </View>

          <View className="mb-5 w-full rounded-2xl border border-border bg-white p-4">
            <Text className="mb-2.5 text-[10px] font-bold tracking-[1px] text-text-secondary">
              {t('partner.yourDiscountCode')}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-extrabold tracking-[0.5px] text-text">
                {partner.code}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="size-9 items-center justify-center rounded-xl"
                disabled={claimMutation.isPending}
                onPress={handleCopy}
                style={[
                  { backgroundColor: `${Colors.secondary}15` },
                  claimMutation.isPending && { opacity: 0.5 },
                ]}
                testID="copy-discount"
              >
                {copied ? (
                  <Check size={18} color={Colors.success} />
                ) : (
                  <Copy size={18} color={Colors.secondary} />
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            className="mb-3.5 w-full items-center rounded-[18px] bg-primary py-[17px]"
            disabled={claimMutation.isPending}
            onPress={() => {
              void handleClaim();
            }}
            style={claimMutation.isPending ? { opacity: 0.7 } : undefined}
          >
            <Text className="text-[17px] font-bold text-white">
              {claimMutation.isPending
                ? t('partner.claiming')
                : t('partner.enjoyMyPerks')}
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text className="text-sm font-medium text-text-secondary">
              {t('partner.maybeLater')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
