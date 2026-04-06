import { useIsFocused } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import {
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useMemberSummary } from '@/providers/DataProvider';
import { MemberQrAccessCard } from '@/src/components/ui';
import {
  hapticError,
  hapticLight,
  hapticSuccess,
} from '@/src/lib/haptics/haptics';
import {
  formatCurrencyVnd,
  getRewardTierLabelKey,
  normalizeRewardTierKey,
  parseBillQrValue,
  rewardConfig,
} from '@/src/lib/loyalty';
import { captureHandledError } from '@/src/lib/monitoring';
import { getTierQrGradient } from '@/src/lib/profile/membership-screen';
import { postClaimRewardBill } from '@/src/lib/reward-claim-api';
import { tryAcquireScanLock } from '@/src/lib/rewards/scan-lock';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type ScanFeedback =
  | {
      amountVnd: number;
      points: number;
      receiptReference: string;
      type: 'success';
    }
  | {
      messageKey: ScanErrorMessageKey;
      type: 'error';
    }
  | null;

type ScanErrorMessageKey =
  | 'billScanner.errors.billBelowMinimumSpend'
  | 'billScanner.errors.billDataCorrupt'
  | 'billScanner.errors.billNotPaid'
  | 'billScanner.errors.billNotSynced'
  | 'billScanner.errors.invalidRewardServiceResponse'
  | 'billScanner.errors.invalidBillQr'
  | 'billScanner.errors.unsupportedCurrency'
  | 'billScanner.errors.receiptAlreadyClaimed'
  | 'billScanner.errors.rewardServiceUnavailable'
  | 'billScanner.errors.sessionExpired'
  | 'billScanner.errors.networkUnavailable'
  | 'billScanner.errors.generic';

const FRAME_MAX_SIZE = 340;
const FRAME_MIN_SIZE = 224;

/** Viewfinder always has a dark background (camera feed). */
const VIEWFINDER_BG = '#08060e';

function resolveScanErrorKey(
  code?: string,
  reason?: string
): ScanErrorMessageKey {
  if (code === 'bill_below_minimum_spend') {
    return 'billScanner.errors.billBelowMinimumSpend';
  }
  if (code === 'bill_not_paid') {
    return 'billScanner.errors.billNotPaid';
  }
  if (code === 'bill_not_synced') {
    return 'billScanner.errors.billNotSynced';
  }
  if (code === 'bill_data_corrupt') {
    return 'billScanner.errors.billDataCorrupt';
  }
  if (code === 'unsupported_currency') {
    return 'billScanner.errors.unsupportedCurrency';
  }
  if (code === 'invalidRewardServiceResponse') {
    return 'billScanner.errors.invalidRewardServiceResponse';
  }
  if (code === 'invalid_bill_qr') {
    return 'billScanner.errors.invalidBillQr';
  }
  if (code === 'receipt_already_claimed') {
    return 'billScanner.errors.receiptAlreadyClaimed';
  }
  if (code === 'rewardServiceUnavailable' || code === 'server_misconfigured') {
    return 'billScanner.errors.rewardServiceUnavailable';
  }
  if (code === 'instant_auth_unreachable') {
    return 'billScanner.errors.networkUnavailable';
  }
  if (code === 'member_profile_not_found') {
    return 'billScanner.errors.sessionExpired';
  }
  if (code === 'unauthorized') {
    return 'billScanner.errors.sessionExpired';
  }
  if (reason === 'network' || reason === 'no_endpoint') {
    return 'billScanner.errors.networkUnavailable';
  }
  if (reason === 'parse_error') {
    return 'billScanner.errors.invalidRewardServiceResponse';
  }

  return 'billScanner.errors.generic';
}

export default function QrTabScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const isDark = useAppIsDark();
  const [permission, requestPermission] = useCameraPermissions();
  const memberSummary = useMemberSummary();
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback>(null);
  const [isMemberCardOpen, setIsMemberCardOpen] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);
  const scanLockRef = useRef(false);

  const frameSize = useMemo((): number => {
    const nextSize = Math.floor(width - 56);
    return Math.max(FRAME_MIN_SIZE, Math.min(FRAME_MAX_SIZE, nextSize));
  }, [width]);

  const memberQrSize = useMemo((): number => {
    const nextSize = Math.floor(width - 164);
    return Math.max(180, Math.min(240, nextSize));
  }, [width]);

  /* ── Derived theme values ── */

  const accentColor = isDark ? Colors.primaryBright : Colors.primary;
  const textColor = isDark ? Colors.textPrimaryDark : Colors.text;

  /* ── Animations ── */

  const framePulse = useSharedValue(0.82);
  const scanLineProgress = useSharedValue(0);
  const scanLineOpacity = useSharedValue(1);

  useEffect(() => {
    framePulse.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1700,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(0.82, {
            duration: 1700,
            reduceMotion: ReduceMotion.System,
          })
        ),
        -1,
        true
      )
    );
    scanLineProgress.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 2000,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(0, {
            duration: 0,
            reduceMotion: ReduceMotion.System,
          })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(framePulse);
      cancelAnimation(scanLineProgress);
    };
  }, [framePulse, scanLineProgress]);

  useEffect(() => {
    scanLineOpacity.set(
      withTiming(isScanLocked ? 0 : 1, {
        duration: 150,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [isScanLocked, scanLineOpacity]);

  useEffect(() => {
    if (!isFocused || permission === null || permission.granted) return;
    if (!permission.canAskAgain) return;

    void requestPermission();
  }, [isFocused, permission, requestPermission]);

  const frameGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + framePulse.get() * 0.3,
    transform: [{ scale: 0.98 + framePulse.get() * 0.04 }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: scanLineOpacity.get(),
    transform: [{ translateY: scanLineProgress.get() * (frameSize - 32) }],
  }));

  /* ── Member QR card gradient ── */

  const tierLevel = normalizeRewardTierKey(memberSummary.lifetimeTierKey);
  const qrCardGradient = useMemo(
    () => getTierQrGradient(tierLevel, true),
    [tierLevel]
  );

  /* ── Claim mutation ── */

  const claimMutation = useMutation({
    mutationFn: async (qrData: string) => {
      const refreshToken = user?.refresh_token?.trim();
      if (!refreshToken) {
        return {
          ok: false as const,
          reason: 'http_error' as const,
          code: 'unauthorized',
          message: 'unauthorized',
          status: 401,
        };
      }

      return postClaimRewardBill({
        qrData,
        refreshToken,
      });
    },
    onSuccess: (result, _qrData) => {
      if (result.ok) {
        hapticSuccess();
        setScanFeedback({
          amountVnd: result.body.transaction.amount_vnd,
          points: result.body.cashbackPointsDelta,
          receiptReference: result.body.transaction.reference ?? '',
          type: 'success',
        });
        return;
      }

      hapticError();
      setScanFeedback({
        messageKey: resolveScanErrorKey(result.code, result.reason),
        type: 'error',
      });
    },
    onError: (error: unknown) => {
      captureHandledError(error, {
        tags: {
          area: 'rewards',
          operation: 'claim_bill_qr',
        },
      });
      hapticError();
      setScanFeedback({
        messageKey: 'billScanner.errors.generic',
        type: 'error',
      });
    },
  });

  const isScannerActive =
    Boolean(permission?.granted) &&
    isFocused &&
    !isMemberCardOpen &&
    !isScanLocked &&
    !claimMutation.isPending;

  /* ── Handlers ── */

  function setScannerLock(isLocked: boolean): void {
    scanLockRef.current = isLocked;
    setIsScanLocked(isLocked);
  }

  function handleOpenMemberCard(): void {
    hapticLight();
    setIsMemberCardOpen(true);
    setScannerLock(true);
  }

  function handleCloseMemberCard(): void {
    setIsMemberCardOpen(false);
    if (!scanFeedback) {
      setScannerLock(false);
    }
  }

  function resetScanner(): void {
    hapticLight();
    setScanFeedback(null);
    setScannerLock(false);
  }

  function handlePermissionCta(): void {
    if (permission?.canAskAgain ?? true) {
      void requestPermission();
      return;
    }

    void Linking.openSettings();
  }

  function handleBarcodeScanned(event: BarcodeScanningResult): void {
    if (isScanLocked || claimMutation.isPending) return;
    if (!tryAcquireScanLock(scanLockRef)) return;

    setIsScanLocked(true);

    const scannedData = event.data.trim();
    const parsedBillQr = parseBillQrValue(scannedData);

    if (!parsedBillQr) {
      hapticError();
      setScanFeedback({
        messageKey: 'billScanner.errors.invalidBillQr',
        type: 'error',
      });
      return;
    }

    void claimMutation.mutateAsync(scannedData);
  }

  /* ── Feedback card (status strip below viewfinder) ── */

  function renderFeedbackCard(): React.JSX.Element {
    if (claimMutation.isPending) {
      return (
        <View className="rounded-[20px] border border-border bg-card px-5 py-4 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-primary dark:text-primary-bright">
            {t('billScanner.processingEyebrow')}
          </Text>
          <Text className="mt-1.5 text-base font-bold text-text dark:text-text-primary-dark">
            {t('billScanner.processingTitle')}
          </Text>
          <Text className="mt-1 text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('billScanner.processingDescription')}
          </Text>
        </View>
      );
    }

    if (!scanFeedback) {
      return (
        <View className="rounded-[20px] border border-border bg-card px-5 py-4 dark:border-dark-border dark:bg-dark-bg-card">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-primary dark:text-primary-bright">
                {t('billScanner.liveBadge')}
              </Text>
              <Text className="mt-1.5 text-base font-bold text-text dark:text-text-primary-dark">
                {t('billScanner.readyTitle')}
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
                {t('billScanner.readyDescription')}
              </Text>
            </View>
            <View className="rounded-xl border border-border bg-surface-container-low px-3 py-2 dark:border-dark-border dark:bg-dark-bg-elevated">
              <Text className="text-right text-[11px] font-bold uppercase tracking-[2px] text-text-muted dark:text-text-muted-dark">
                {t('billScanner.pointsRuleLabel')}
              </Text>
              <Text className="mt-0.5 text-right text-sm font-semibold text-text dark:text-text-primary-dark">
                {t('billScanner.pointsRuleValue', {
                  amount: formatCurrencyVnd(rewardConfig.cashbackSpendStepVnd),
                  points: rewardConfig.cashbackPointsPerStep,
                })}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (scanFeedback.type === 'success') {
      return (
        <View className="rounded-[20px] border border-primary/20 bg-primary-fixed px-5 py-4 dark:border-primary-bright/25 dark:bg-primary-bright/12">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-primary dark:text-primary-bright">
                {t('billScanner.successEyebrow')}
              </Text>
              <Text className="mt-1.5 text-base font-bold text-text dark:text-text-primary-dark">
                {t('billScanner.successTitle', {
                  points: scanFeedback.points,
                })}
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
                {t('billScanner.successDescription', {
                  amount: formatCurrencyVnd(scanFeedback.amountVnd),
                  reference: scanFeedback.receiptReference,
                })}
              </Text>
            </View>
            <View className="size-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-bright/15">
              <Sparkles color={accentColor} size={20} />
            </View>
          </View>
          <Pressable
            accessibilityHint={t('billScanner.scanAgainHint')}
            accessibilityLabel={t('billScanner.scanAgain')}
            accessibilityRole="button"
            className="mt-4 h-12 flex-row items-center justify-center rounded-full border border-border dark:border-dark-border"
            style={{
              backgroundColor: isDark
                ? Colors.darkBgElevated
                : 'rgba(255,255,255,0.75)',
            }}
            onPress={resetScanner}
          >
            <RefreshCcw color={textColor} size={18} />
            <Text className="ml-2 text-sm font-semibold text-text dark:text-text-primary-dark">
              {t('billScanner.scanAgain')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="rounded-[20px] border border-danger/25 bg-danger/8 px-5 py-4 dark:border-error-dark/30 dark:bg-error-dark/10">
        <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-danger dark:text-error-dark">
          {t('billScanner.errorEyebrow')}
        </Text>
        <Text className="mt-1.5 text-base font-bold text-text dark:text-text-primary-dark">
          {t('billScanner.errorTitle')}
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-text-secondary dark:text-text-secondary-dark">
          {t(scanFeedback.messageKey)}
        </Text>
        <Pressable
          accessibilityHint={t('billScanner.scanAgainHint')}
          accessibilityLabel={t('billScanner.scanAgain')}
          accessibilityRole="button"
          className="mt-4 h-12 flex-row items-center justify-center rounded-full border border-border dark:border-dark-border"
          style={{
            backgroundColor: isDark
              ? Colors.darkBgElevated
              : 'rgba(255,255,255,0.75)',
          }}
          onPress={resetScanner}
        >
          <RefreshCcw color={textColor} size={18} />
          <Text className="ml-2 text-sm font-semibold text-text dark:text-text-primary-dark">
            {t('billScanner.scanAgain')}
          </Text>
        </Pressable>
      </View>
    );
  }

  /* ── Viewfinder zone (camera / permission / loading) ── */

  function renderScannerBody(): React.JSX.Element {
    if (permission === null) {
      return (
        <View className="rounded-[20px] border border-border bg-card px-6 py-7 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
            {t('billScanner.loadingTitle')}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('billScanner.loadingDescription')}
          </Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View className="rounded-[20px] border border-border bg-card px-6 py-7 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-primary dark:text-primary-bright">
            {t('billScanner.permissionEyebrow')}
          </Text>
          <Text className="mt-2 text-xl font-bold text-text dark:text-text-primary-dark">
            {t('billScanner.cameraPermissionTitle')}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('billScanner.cameraPermissionDescription')}
          </Text>
          <Pressable
            accessibilityHint={t('billScanner.grantPermissionHint')}
            accessibilityLabel={t('billScanner.grantPermission')}
            accessibilityRole="button"
            className="mt-5 h-12 items-center justify-center rounded-full bg-primary dark:bg-primary-bright"
            onPress={handlePermissionCta}
          >
            <Text className="text-sm font-semibold text-white">
              {t('billScanner.grantPermission')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        className="items-center justify-center"
        style={{ minHeight: frameSize + 32 }}
      >
        {/* Ambient glow ring */}
        <Animated.View
          className="absolute rounded-4xl"
          style={[
            frameGlowStyle,
            {
              backgroundColor: isDark
                ? 'rgba(255,107,157,0.05)'
                : 'rgba(233,30,99,0.04)',
              borderColor: isDark
                ? 'rgba(255,107,157,0.12)'
                : 'rgba(233,30,99,0.08)',
              borderWidth: 1,
              height: frameSize + 36,
              width: frameSize + 36,
            },
          ]}
        />

        {/* Camera viewfinder card — always dark (camera feed) */}
        <View
          className="relative overflow-hidden rounded-3xl"
          style={{
            backgroundColor: VIEWFINDER_BG,
            height: frameSize,
            width: frameSize,
          }}
        >
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              isScannerActive ? handleBarcodeScanned : undefined
            }
            style={StyleSheet.absoluteFillObject}
          />

          {/* Subtle vignette for bracket/hint contrast */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.20)',
              'rgba(0,0,0,0.02)',
              'rgba(0,0,0,0.26)',
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Scan line */}
          <Animated.View
            className="absolute left-4 right-4 h-px"
            style={[scanLineStyle, { backgroundColor: Colors.primaryBright }]}
          />

          {/* Corner brackets */}
          <View className="absolute left-0 top-0 size-11 border-l-[3px] border-t-[3px] border-primary-bright" />
          <View className="absolute right-0 top-0 size-11 border-r-[3px] border-t-[3px] border-primary-bright" />
          <View className="absolute bottom-0 left-0 size-11 border-b-[3px] border-l-[3px] border-primary-bright" />
          <View className="absolute bottom-0 right-0 size-11 border-b-[3px] border-r-[3px] border-primary-bright" />

          {/* Frame hint pill */}
          <View className="absolute inset-x-0 bottom-4 items-center">
            <View className="rounded-full bg-black/50 px-3.5 py-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/80">
                {t('billScanner.frameHint')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  /* ── Screen layout ── */

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      {/* Compact header */}
      <View className="px-5" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[11px] font-extrabold uppercase tracking-[3px] text-primary dark:text-primary-bright">
              {t('billScanner.eyebrow')}
            </Text>
            <Text
              className="mt-1.5 text-[22px] font-black leading-6.5 text-text dark:text-text-primary-dark"
              numberOfLines={2}
            >
              {t('billScanner.title')}
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-card px-4 py-2.5 dark:border-dark-border dark:bg-dark-bg-card">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-text-muted dark:text-text-muted-dark">
              {t('billScanner.balanceLabel')}
            </Text>
            <Text className="mt-0.5 text-right text-xl font-black text-text dark:text-text-primary-dark">
              {memberSummary.cashbackBalancePoints}
            </Text>
          </View>
        </View>
      </View>

      {/* Viewfinder zone */}
      <View className="flex-1 items-center justify-center px-5">
        {renderScannerBody()}
      </View>

      {/* Bottom controls */}
      <View
        className="gap-3 px-5"
        style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
      >
        {renderFeedbackCard()}

        <Pressable
          accessibilityHint={t('billScanner.fallbackHint')}
          accessibilityLabel={t('billScanner.fallbackCta')}
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center rounded-full border border-border bg-card dark:border-dark-border dark:bg-dark-bg-card"
          onPress={handleOpenMemberCard}
        >
          <QrCode color={textColor} size={18} />
          <Text className="ml-2 text-sm font-semibold text-text dark:text-text-primary-dark">
            {t('billScanner.fallbackCta')}
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-center gap-2 px-3">
          <ShieldCheck color={accentColor} size={14} />
          <Text className="text-center text-xs leading-5 text-text-muted dark:text-text-muted-dark">
            {t('billScanner.securityNote')}
          </Text>
        </View>
      </View>

      {/* Member QR modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isMemberCardOpen}
        presentationStyle={
          Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'
        }
        onRequestClose={handleCloseMemberCard}
      >
        <View className="flex-1 bg-black/70">
          <View className="flex-1" />
          <View
            className="rounded-t-4xl border-t border-border bg-card px-5 pb-8 pt-4 dark:border-dark-border dark:bg-dark-bg-card"
            style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
          >
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-extrabold uppercase tracking-[2.8px] text-primary dark:text-primary-bright">
                  {t('billScanner.fallbackEyebrow')}
                </Text>
                <Text className="mt-2 text-xl font-black text-text dark:text-text-primary-dark">
                  {t('billScanner.fallbackTitle')}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                  {t('billScanner.fallbackDescription')}
                </Text>
              </View>
              <Pressable
                accessibilityHint={tCommon('close')}
                accessibilityLabel={tCommon('close')}
                accessibilityRole="button"
                className="size-11 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-elevated"
                onPress={handleCloseMemberCard}
              >
                <X color={textColor} size={18} />
              </Pressable>
            </View>

            <MemberQrAccessCard
              brandAccessibilityHint={tCommon('branding.markHint')}
              brandLabel={tCommon('branding.mark')}
              emptyQrLabel={t('billScanner.memberQrUnavailable')}
              gradientColors={qrCardGradient}
              memberId={memberSummary.memberId}
              memberName={memberSummary.fullName || undefined}
              qrSize={memberQrSize}
              tierLabel={t(
                `tier.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
              )}
            >
              <View className="mt-5 items-center">
                <Text
                  className="text-[12px] font-medium tracking-[0.5px]"
                  style={{ color: Colors.qrRefText }}
                >
                  {t('refPrefix', { memberId: memberSummary.memberId })}
                </Text>
              </View>
            </MemberQrAccessCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}
