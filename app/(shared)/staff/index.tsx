import { zodResolver } from '@hookform/resolvers/zod';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { awardLoyaltyTransaction, fetchProfileByMemberId } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { useStaffAccessData } from '@/providers/DataProvider';
import { Button, Card } from '@/src/components/ui';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type StaffLoyaltyAwardFormValues,
  staffLoyaltyAwardSchema,
} from '@/src/lib/forms/schemas';
import {
  calculatePointsForAmountVnd,
  formatCurrencyVnd,
  loyaltyConfig,
  parseMemberQrValue,
} from '@/src/lib/loyalty';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

type StaffAwardSummary = {
  amountLabel: string;
  memberName: string;
  pointsAwarded: number;
};

type QrScanPayload = {
  data: string;
};

const staffErrorMessageByKey = {
  billBelowMinimumSpend: 'staff.errors.billBelowMinimumSpend',
  invalidBillAmount: 'staff.errors.invalidBillAmount',
  managerApprovalRequired: 'staff.errors.managerApprovalRequired',
  memberNotFound: 'staff.errors.memberNotFound',
  staffAccessRequired: 'staff.errors.staffAccessRequired',
} as const;

type StaffErrorMessageKey = keyof typeof staffErrorMessageByKey;

function isStaffErrorMessageKey(value: string): value is StaffErrorMessageKey {
  return value in staffErrorMessageByKey;
}

export default function StaffScanScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { isStaffUser, staffAccess, staffAccessLoading } = useStaffAccessData();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [awardLoading, setAwardLoading] = useState<boolean>(false);
  const isScannerLockedRef = useRef<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [awardSummary, setAwardSummary] = useState<StaffAwardSummary | null>(
    null
  );
  const { control, getValues, handleSubmit, reset, setValue, watch } =
    useForm<StaffLoyaltyAwardFormValues>({
      defaultValues: {
        billAmountVnd: '',
        managerPin: '',
        memberId: '',
        receiptReference: '',
      },
      mode: 'onBlur',
      resolver: zodResolver(staffLoyaltyAwardSchema),
    });

  const billAmountInput = watch('billAmountVnd');
  const memberIdInput = watch('memberId');
  const billAmountVnd = Number.parseInt(billAmountInput || '0', 10);
  const requiresManagerPin = billAmountVnd > loyaltyConfig.approvalCapVnd;
  const pointsPreview = calculatePointsForAmountVnd(billAmountVnd);
  const approvalCapLabel = useMemo(
    () => formatCurrencyVnd(loyaltyConfig.approvalCapVnd),
    []
  );
  const pointsFormulaLabel = useMemo(
    () => formatCurrencyVnd(loyaltyConfig.spendStepVnd),
    []
  );

  const resolveErrorMessage = useCallback(
    (message: string): string => {
      if (!isStaffErrorMessageKey(message)) return t('staff.errors.generic');
      return t(staffErrorMessageByKey[message]);
    },
    [t]
  );

  const handleLookupMember = useCallback(
    async (overrideMemberId?: string): Promise<void> => {
      const nextMemberId = (overrideMemberId ?? getValues('memberId')).trim();
      if (!nextMemberId) {
        setSelectedMember(null);
        return;
      }

      setLookupLoading(true);
      try {
        const member = await fetchProfileByMemberId(nextMemberId);
        if (!member) {
          setSelectedMember(null);
          Alert.alert(
            t('staff.memberNotFoundTitle'),
            t('staff.memberNotFound')
          );
          return;
        }

        setSelectedMember(member);
      } catch (error: unknown) {
        console.error('[staff] Member lookup failed:', error);
        Alert.alert(t('staff.errors.title'), t('staff.errors.generic'));
      } finally {
        setLookupLoading(false);
      }
    },
    [getValues, t]
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: QrScanPayload): void => {
      if (isScannerLockedRef.current) return;

      isScannerLockedRef.current = true;
      const payload = parseMemberQrValue(data);
      if (!payload) {
        setCameraActive(false);
        Alert.alert(t('staff.invalidQrTitle'), t('staff.errors.invalidQr'));
        return;
      }

      setCameraActive(false);
      setValue('memberId', payload.memberId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      void handleLookupMember(payload.memberId);
    },
    [handleLookupMember, setValue, t]
  );

  const handleAwardSubmit = handleSubmit(async (values) => {
    if (!staffAccess?.user_id) {
      Alert.alert(
        t('staff.errors.title'),
        t('staff.errors.staffAccessRequired')
      );
      return;
    }

    setAwardLoading(true);
    try {
      const result = await awardLoyaltyTransaction({
        billAmountVnd: Number.parseInt(values.billAmountVnd, 10),
        managerPin: values.managerPin,
        memberId: values.memberId,
        receiptReference: values.receiptReference,
        staffUserId: staffAccess.user_id,
      });

      setSelectedMember(result.member);
      setAwardSummary({
        amountLabel: formatCurrencyVnd(
          Number.parseInt(values.billAmountVnd, 10)
        ),
        memberName: result.member.full_name || result.member.member_id,
        pointsAwarded: result.pointsAwarded,
      });
      reset({
        billAmountVnd: '',
        managerPin: '',
        memberId: result.member.member_id,
        receiptReference: '',
      });
    } catch (error: unknown) {
      console.error('[staff] Award loyalty transaction failed:', error);
      const message = error instanceof Error ? error.message : 'generic';
      Alert.alert(t('staff.errors.title'), resolveErrorMessage(message));
    } finally {
      setAwardLoading(false);
    }
  });

  function handleResetScanner(): void {
    isScannerLockedRef.current = false;
    setCameraActive(true);
  }

  function handleBack(): void {
    router.back();
  }

  if (staffAccessLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-base font-semibold text-text dark:text-text-primary-dark">
          {t('staff.loading')}
        </Text>
      </View>
    );
  }

  if (!isStaffUser) {
    return (
      <View
        className="flex-1 bg-background px-5 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <View className="mb-4 flex-row items-center justify-between pt-3">
          <Pressable accessibilityRole="button" onPress={handleBack}>
            <ArrowLeft color={Colors.text} size={22} />
          </Pressable>
        </View>
        <Card className="rounded-3xl p-6">
          <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {t('staff.accessDeniedTitle')}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('staff.accessDeniedDescription')}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('staff.allowlistPending')}
          </Text>
          <Button className="mt-5" onPress={handleBack} variant="outline">
            {t('staff.goBack')}
          </Button>
        </Card>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-10 pt-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={handleBack}>
            <ArrowLeft color={Colors.text} size={22} />
          </Pressable>
          <View className="items-end">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-text-secondary dark:text-text-secondary-dark">
              {t('staff.badge')}
            </Text>
            <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
              {t('staff.title')}
            </Text>
          </View>
        </View>

        <Card className="rounded-3xl p-6">
          <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
            {t('staff.title')}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('staff.subtitle')}
          </Text>

          <View className="mt-5 overflow-hidden rounded-3xl border border-border bg-black dark:border-dark-border">
            {permission?.granted ? (
              <View style={{ height: 240 }}>
                <CameraView
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={
                    cameraActive ? handleBarcodeScanned : undefined
                  }
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <View className="items-center px-5 py-8">
                <ScanLine color={Colors.white} size={42} />
                <Text className="mt-4 text-center text-lg font-bold text-white">
                  {t('staff.cameraPermissionTitle')}
                </Text>
                <Text className="mt-2 text-center text-sm leading-6 text-white/75">
                  {t('staff.cameraPermissionDescription')}
                </Text>
                <Button
                  className="mt-5 self-stretch"
                  onPress={() => void requestPermission()}
                >
                  {t('staff.grantPermission')}
                </Button>
              </View>
            )}
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="flex-1 pr-4 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('staff.manualEntryNote')}
            </Text>
            <Button
              leftIcon={<RefreshCcw color={Colors.text} size={16} />}
              onPress={handleResetScanner}
              size="sm"
              variant="outline"
            >
              {t('staff.scanAgain')}
            </Button>
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl p-6">
          <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
            {t('staff.memberLookup')}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('staff.lookupHint')}
          </Text>

          <View className="mt-4">
            <ControlledTextInput<StaffLoyaltyAwardFormValues>
              autoCapitalize="characters"
              control={control}
              icon={({ color, size }) => (
                <UserRound color={color} size={size} />
              )}
              label={t('staff.memberIdLabel')}
              name="memberId"
              placeholder={t('staff.memberIdPlaceholder')}
              testID="staff-member-id"
            />
            <Button
              className="mt-1"
              isLoading={lookupLoading}
              onPress={() => {
                void handleLookupMember();
              }}
              variant="outline"
            >
              {t('staff.findMember')}
            </Button>
          </View>

          {selectedMember ? (
            <View className="mt-5 rounded-2xl bg-background p-4 dark:bg-dark-bg-elevated">
              <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary dark:text-text-secondary-dark">
                {t('staff.memberFoundBadge')}
              </Text>
              <Text className="mt-2 text-lg font-bold text-text dark:text-text-primary-dark">
                {selectedMember.full_name || selectedMember.member_id}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
                {selectedMember.member_id}
              </Text>
              <Text className="mt-3 text-sm text-text-secondary dark:text-text-secondary-dark">
                {t('staff.currentPoints', {
                  count: selectedMember.points,
                  value: selectedMember.points.toLocaleString(),
                })}
              </Text>
            </View>
          ) : memberIdInput ? (
            <Text className="mt-4 text-sm text-text-secondary dark:text-text-secondary-dark">
              {t('staff.memberPendingLookup')}
            </Text>
          ) : null}
        </Card>

        <Card className="mt-5 rounded-3xl p-6">
          <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
            {t('staff.awardTitle')}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('staff.formulaNote', {
              amount: pointsFormulaLabel,
              points: loyaltyConfig.pointsAwardedPerStep,
            })}
          </Text>

          <View className="mt-4">
            <ControlledTextInput<StaffLoyaltyAwardFormValues>
              control={control}
              icon={({ color, size }) => (
                <ShieldCheck color={color} size={size} />
              )}
              inputMode="numeric"
              keyboardType="numeric"
              label={t('staff.billAmountLabel')}
              name="billAmountVnd"
              placeholder={t('staff.billAmountPlaceholder')}
              testID="staff-bill-amount"
            />
            <ControlledTextInput<StaffLoyaltyAwardFormValues>
              autoCapitalize="characters"
              control={control}
              label={t('staff.receiptReferenceLabel')}
              name="receiptReference"
              placeholder={t('staff.receiptReferencePlaceholder')}
              testID="staff-receipt-reference"
            />
            {requiresManagerPin ? (
              <>
                <Text className="mb-2 text-sm font-medium text-warning dark:text-warning-dark">
                  {t('staff.approvalRequired', { amount: approvalCapLabel })}
                </Text>
                <ControlledTextInput<StaffLoyaltyAwardFormValues>
                  autoCapitalize="none"
                  control={control}
                  icon={({ color, size }) => (
                    <ShieldCheck color={color} size={size} />
                  )}
                  inputMode="numeric"
                  keyboardType="numeric"
                  label={t('staff.managerPinLabel')}
                  name="managerPin"
                  placeholder={t('staff.managerPinPlaceholder')}
                  secureTextEntry
                  testID="staff-manager-pin"
                />
              </>
            ) : null}
          </View>

          <View className="mt-3 rounded-2xl bg-background p-4 dark:bg-dark-bg-elevated">
            <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary dark:text-text-secondary-dark">
              {t('staff.pointsPreviewLabel')}
            </Text>
            <Text className="mt-2 text-2xl font-extrabold text-text dark:text-text-primary-dark">
              {pointsPreview.toLocaleString()}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('staff.pointsPreviewDescription')}
            </Text>
          </View>

          <Button
            className="mt-5"
            isLoading={awardLoading}
            leftIcon={<ShieldCheck color={Colors.white} size={18} />}
            onPress={() => {
              void handleAwardSubmit();
            }}
            testID="staff-award-submit"
          >
            {awardLoading ? t('staff.awarding') : t('staff.award')}
          </Button>
        </Card>

        {awardSummary ? (
          <Card className="mt-5 rounded-3xl p-6">
            <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
              {t('staff.successTitle')}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
              {t('staff.successMessage', {
                amount: awardSummary.amountLabel,
                name: awardSummary.memberName,
                points: awardSummary.pointsAwarded.toLocaleString(),
              })}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
