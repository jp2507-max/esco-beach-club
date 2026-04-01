import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Colors } from '@/constants/colors';
import { Button, SurfaceCard } from '@/src/components/ui';
import { postRestoreAccountDeletion } from '@/src/lib/account-deletion/account-deletion-api';
import { useAccountDeletionRequest } from '@/src/lib/account-deletion/use-account-deletion-request';
import { useAuth } from '@/providers/AuthProvider';
import { Text, View } from '@/src/tw';

type AccountDeletionBannerProps = {
  userId: string | null | undefined;
};

export function AccountDeletionBanner({
  userId,
}: AccountDeletionBannerProps): React.JSX.Element | null {
  const router = useRouter();
  const { i18n, t } = useTranslation('profile');
  const { accountDeletionRequest, isDeletionPending } =
    useAccountDeletionRequest(userId);
  const { user } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);

  const scheduledLabel = useMemo(() => {
    if (!accountDeletionRequest?.scheduled_for_at) return null;

    try {
      return new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(accountDeletionRequest.scheduled_for_at));
    } catch {
      return accountDeletionRequest.scheduled_for_at.slice(0, 10);
    }
  }, [accountDeletionRequest?.scheduled_for_at, i18n.language]);

  async function handleRestore(): Promise<void> {
    if (!user?.refresh_token || isRestoring) return;

    setIsRestoring(true);
    try {
      const result = await postRestoreAccountDeletion({
        refreshToken: user.refresh_token,
      });

      if (!result.ok) {
        Alert.alert(t('deleteAccount.errors.restoreFailed'));
        return;
      }

      Alert.alert(t('deleteAccount.restoreSuccessTitle'));
    } catch (error) {
      console.error('[AccountDeletionBanner] Restore failed', error);
      Alert.alert(t('deleteAccount.errors.restoreFailed'));
    } finally {
      setIsRestoring(false);
    }
  }

  if (!isDeletionPending || !accountDeletionRequest) {
    return null;
  }

  return (
    <SurfaceCard className="mx-5 mb-5 overflow-hidden border-danger/20 bg-danger/5 p-4 dark:border-danger/30 dark:bg-danger/10">
      <View className="flex-row items-start">
        <View className="mr-3 mt-0.5 size-11 items-center justify-center rounded-full bg-danger/15">
          <ShieldAlert color={Colors.danger} size={20} />
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-extrabold text-text dark:text-text-primary-dark"
            testID="account-deletion-banner-title"
          >
            {t('deleteAccount.bannerTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('deleteAccount.bannerDescription', {
              date: scheduledLabel ?? '30 days',
            })}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-white/70 p-3 dark:bg-dark-bg-card/80">
        <View className="flex-row items-center">
          <AlertTriangle color={Colors.warning} size={16} />
          <Text className="ml-2 text-xs font-bold uppercase tracking-[1px] text-text dark:text-text-primary-dark">
            {t('deleteAccount.bannerCountdown')}
          </Text>
        </View>
        <Text className="mt-2 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
          {t('deleteAccount.bannerRestoreHint')}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Button
          className="flex-1"
          isLoading={isRestoring}
          leftIcon={<RotateCcw color={Colors.white} size={16} />}
          onPress={() => {
            void handleRestore();
          }}
          testID="restore-account-button"
        >
          {t('deleteAccount.restoreAction')}
        </Button>
        <Button
          className="flex-1"
          onPress={() => router.push('/profile/delete-account' as never)}
          variant="outline"
        >
          {t('deleteAccount.reviewAction')}
        </Button>
      </View>
    </SurfaceCard>
  );
}
