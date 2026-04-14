import { zodResolver } from '@hookform/resolvers/zod';
import { type Href, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Clock3,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { type AuthProviderType, authProviderTypes } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useProfileData } from '@/providers/DataProvider';
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import {
  Button,
  ProfileSubScreenHeader,
  SurfaceCard,
} from '@/src/components/ui';
import {
  type AccountDeletionApiResult,
  postRestoreAccountDeletion,
  postScheduleAccountDeletion,
  type ScheduleAccountDeletionResponse,
} from '@/src/lib/account-deletion/account-deletion-api';
import { getAccountDeletionErrorMessage } from '@/src/lib/account-deletion/account-deletion-error-message';
import {
  isAppleDeletionWarningStatus,
  isProviderSignInCanceled,
  shouldAttemptGoogleProviderRevocation,
  shouldContinueAfterAppleVerificationError,
} from '@/src/lib/account-deletion/account-deletion-flow';
import { useAccountDeletionRequest } from '@/src/lib/account-deletion/use-account-deletion-request';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import {
  cleanupGoogleSessionAfterDeletion,
  getAppleAuthorizationCode,
  googlePostDeleteCleanupStatuses,
} from '@/src/lib/auth/social-auth';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type AccountDeletionConfirmFormValues,
  accountDeletionConfirmSchema,
} from '@/src/lib/forms/schemas';
import { hapticError } from '@/src/lib/haptics/haptics';
import {
  addMonitoringBreadcrumb,
  captureHandledError,
} from '@/src/lib/monitoring';
import { ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

function formatDeletionDate(
  value: string | null | undefined,
  language: string
): string {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat(language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function resolveAuthProviderForDeletion(
  provider: AuthProviderType | null | undefined
): AuthProviderType | null {
  if (provider === authProviderTypes.apple) {
    return authProviderTypes.apple;
  }

  if (provider === authProviderTypes.google) {
    return authProviderTypes.google;
  }

  if (provider === authProviderTypes.magicCode) {
    return authProviderTypes.magicCode;
  }

  return null;
}

type AccountDeletionApiFailure = Extract<
  AccountDeletionApiResult<unknown>,
  { ok: false }
>;

function captureAccountDeletionApiFailure(params: {
  action: 'restore' | 'schedule';
  authProvider?: AuthProviderType | null;
  failure: AccountDeletionApiFailure;
  revocation?: ScheduleAccountDeletionResponse['revocation'];
}): void {
  captureHandledError(
    new Error(
      params.action === 'schedule'
        ? 'accountDeletionScheduleFailed'
        : 'accountDeletionRestoreFailed'
    ),
    {
      contexts: {
        accountDeletion: {
          action: params.action,
          authProvider: params.authProvider ?? null,
          code: params.failure.code ?? null,
          message: params.failure.message ?? null,
          reason: params.failure.reason,
          revocationMessage: params.revocation?.message ?? null,
          revocationStatus: params.revocation?.status ?? null,
          status: params.failure.status ?? null,
        },
      },
      extras: {
        action: params.action,
        authProvider: params.authProvider ?? null,
      },
      tags: {
        feature: 'account-deletion',
        operation:
          params.action === 'schedule'
            ? 'account_deletion_schedule_api_failure'
            : 'account_deletion_restore_api_failure',
        reason: params.failure.reason,
      },
    }
  );
}

function captureAccountDeletionUnexpectedError(params: {
  action: 'restore' | 'schedule';
  authProvider?: AuthProviderType | null;
  error: unknown;
}): void {
  captureHandledError(params.error, {
    contexts: {
      accountDeletion: {
        action: params.action,
        authProvider: params.authProvider ?? null,
      },
    },
    extras: {
      action: params.action,
      authProvider: params.authProvider ?? null,
    },
    tags: {
      feature: 'account-deletion',
      operation:
        params.action === 'schedule'
          ? 'account_deletion_schedule_unexpected_error'
          : 'account_deletion_restore_unexpected_error',
    },
  });
}

export default function DeleteAccountScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { i18n, t } = useTranslation('profile');
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const { user, signOut } = useAuth();
  const { profile } = useProfileData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { accountDeletionRequest, isDeletionPending, isLoading } =
    useAccountDeletionRequest(user?.id);

  const scheduledForLabel = useMemo(
    () =>
      formatDeletionDate(
        accountDeletionRequest?.scheduled_for_at,
        i18n.language
      ),
    [accountDeletionRequest?.scheduled_for_at, i18n.language]
  );

  const { control, handleSubmit, reset } =
    useForm<AccountDeletionConfirmFormValues>({
      defaultValues: {
        confirmation: '' as AccountDeletionConfirmFormValues['confirmation'],
      },
      mode: 'onBlur',
      resolver: zodResolver(accountDeletionConfirmSchema),
    });

  async function handleRestore(): Promise<void> {
    if (!user?.refresh_token || isRestoring) return;

    setIsRestoring(true);
    try {
      const result = await postRestoreAccountDeletion({
        refreshToken: user.refresh_token,
      });

      if (!result.ok) {
        captureAccountDeletionApiFailure({
          action: 'restore',
          authProvider: profile?.auth_provider,
          failure: result,
        });
        Alert.alert(
          getAccountDeletionErrorMessage(result, t, {
            fallbackKey: 'restoreFailed',
          })
        );
        return;
      }

      Alert.alert(t('deleteAccount.restoreSuccessTitle'));
    } catch (error) {
      console.error('[DeleteAccount] Restore failed', error);
      captureAccountDeletionUnexpectedError({
        action: 'restore',
        authProvider: profile?.auth_provider,
        error,
      });
      Alert.alert(t('deleteAccount.errors.restoreFailed'));
    } finally {
      setIsRestoring(false);
    }
  }

  const handleScheduleDeletion = handleSubmit(async () => {
    if (!user?.refresh_token || !user.id) {
      Alert.alert(t('deleteAccount.errors.sessionExpired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const authProvider = resolveAuthProviderForDeletion(
        profile?.auth_provider
      );
      let appleAuthorizationCode: string | undefined;

      if (authProvider === authProviderTypes.apple && Platform.OS === 'ios') {
        try {
          appleAuthorizationCode = await getAppleAuthorizationCode();
        } catch (error) {
          if (isProviderSignInCanceled(error)) {
            addMonitoringBreadcrumb({
              category: 'account-deletion',
              data: {
                authProvider,
              },
              level: 'info',
              message: 'apple deletion verification canceled by user',
            });
            hapticError();
            Alert.alert(t('deleteAccount.errors.appleVerificationCanceled'));
            return;
          }

          const shouldContinue =
            shouldContinueAfterAppleVerificationError(error);

          addMonitoringBreadcrumb({
            category: 'account-deletion',
            data: {
              authProvider,
              errorMessage:
                error instanceof Error ? error.message : 'unknown_error',
              shouldContinue,
            },
            level: 'warning',
            message: 'apple deletion verification failed before scheduling',
          });

          captureHandledError(error, {
            extras: {
              authProvider,
              shouldContinue,
            },
            tags: {
              feature: 'account-deletion',
              operation: 'apple_pre_delete_verification',
            },
          });

          if (!shouldContinue) {
            hapticError();
            Alert.alert(t('deleteAccount.errors.appleRevocationFailed'));
            return;
          }
        }
      }

      const result = await postScheduleAccountDeletion({
        ...(appleAuthorizationCode ? { appleAuthorizationCode } : {}),
        authProvider,
        refreshToken: user.refresh_token,
      });

      if (!result.ok) {
        captureAccountDeletionApiFailure({
          action: 'schedule',
          authProvider,
          failure: result,
        });
        hapticError();
        Alert.alert(getAccountDeletionErrorMessage(result, t));
        return;
      }

      const revocationStatus = result.body?.revocation?.status;
      if (isAppleDeletionWarningStatus(revocationStatus)) {
        addMonitoringBreadcrumb({
          category: 'account-deletion',
          data: {
            authProvider,
            message: result.body?.revocation?.message ?? null,
            revocationStatus,
          },
          level: 'warning',
          message: 'account deletion scheduled with apple revocation warning',
        });
      }

      if (shouldAttemptGoogleProviderRevocation(authProvider)) {
        const cleanupResult = await cleanupGoogleSessionAfterDeletion();

        if (
          cleanupResult.status ===
          googlePostDeleteCleanupStatuses.failedNonBlocking
        ) {
          addMonitoringBreadcrumb({
            category: 'account-deletion',
            data: {
              authProvider,
              cleanupStatus: cleanupResult.status,
              errorMessage: cleanupResult.message,
            },
            level: 'info',
            message:
              'google provider revocation failed after scheduling deletion',
          });

          captureHandledError(cleanupResult.error, {
            contexts: {
              accountDeletion: {
                action: 'schedule',
                authProvider,
                cleanupStatus: cleanupResult.status,
              },
            },
            extras: {
              authProvider,
              cleanupStatus: cleanupResult.status,
              nonBlocking: true,
            },
            tags: {
              feature: 'account-deletion',
              operation: 'google_post_delete_revoke_access',
              severity: 'non_blocking',
            },
          });
        }
      }

      reset({
        confirmation: '' as AccountDeletionConfirmFormValues['confirmation'],
      });

      Alert.alert(
        t('deleteAccount.scheduleSuccessTitle'),
        t('deleteAccount.scheduleSuccessMessage')
      );
      try {
        await signOut();
      } catch (error) {
        console.error(
          '[DeleteAccount] Sign out after successful schedule failed',
          error
        );
        Alert.alert(t('errors.signOutFailed'));
      }
    } catch (error) {
      hapticError();
      console.error('[DeleteAccount] Schedule failed', error);
      captureAccountDeletionUnexpectedError({
        action: 'schedule',
        authProvider: profile?.auth_provider,
        error,
      });
      Alert.alert(t('deleteAccount.errors.scheduleFailed'));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
      testID="delete-account-screen"
    >
      <ProfileSubScreenHeader title={t('deleteAccount.title')} />

      <AppScreenContent className="flex-1">
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-5 pb-10 pt-1"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={contentStyle}>
            <SurfaceCard className="mb-5 overflow-hidden border-danger/20 bg-danger/5 p-5 dark:border-danger/30 dark:bg-danger/10">
              <View className="flex-row items-start">
                <View className="mr-4 size-12 items-center justify-center rounded-full bg-danger/15">
                  <ShieldAlert color={Colors.danger} size={22} />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
                    {t('deleteAccount.heroTitle')}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                    {t('deleteAccount.heroDescription')}
                  </Text>
                </View>
              </View>
            </SurfaceCard>

            {isLoading ? (
              <SurfaceCard className="mb-5 p-5">
                <Text className="text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                  {t('deleteAccount.loadingState')}
                </Text>
              </SurfaceCard>
            ) : isDeletionPending ? (
              <SurfaceCard className="mb-5 p-5">
                <View className="flex-row items-center">
                  <Clock3 color={Colors.warning} size={18} />
                  <Text className="ml-2 text-xs font-bold uppercase tracking-[1px] text-text dark:text-text-primary-dark">
                    {t('deleteAccount.pendingEyebrow')}
                  </Text>
                </View>
                <Text className="mt-3 text-2xl font-extrabold text-text dark:text-text-primary-dark">
                  {t('deleteAccount.pendingTitle')}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                  {t('deleteAccount.pendingDescription', {
                    date: scheduledForLabel,
                  })}
                </Text>
                <Text className="mt-4 text-sm font-semibold text-primary dark:text-primary-bright">
                  {t('deleteAccount.pendingRestoreHint')}
                </Text>

                <View className="mt-5 flex-row gap-3">
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
                    onPress={() => router.replace('/home' as Href)}
                    variant="outline"
                  >
                    {t('deleteAccount.backToApp')}
                  </Button>
                </View>
              </SurfaceCard>
            ) : (
              <>
                <SurfaceCard className="mb-4 p-5">
                  <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                    {t('deleteAccount.permanentDataLossTitle')}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                    {t('deleteAccount.permanentDataLossDescription')}
                  </Text>
                </SurfaceCard>

                <SurfaceCard className="mb-4 p-5">
                  <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                    {t('deleteAccount.gracePeriodTitle')}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                    {t('deleteAccount.gracePeriodDescription')}
                  </Text>
                </SurfaceCard>

                <SurfaceCard className="mb-5 p-5">
                  <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                    {t('deleteAccount.whatWillBeDeletedTitle')}
                  </Text>
                  <View className="mt-4 gap-3">
                    {(
                      [
                        'profileData',
                        'savedEvents',
                        'bookings',
                        'memberBenefits',
                      ] as const
                    ).map((key) => (
                      <View className="flex-row items-start" key={key}>
                        <Trash2
                          color={Colors.danger}
                          size={16}
                          style={{ marginTop: 2 }}
                        />
                        <Text className="ml-3 flex-1 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                          {t(`deleteAccount.whatWillBeDeletedItems.${key}`)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </SurfaceCard>

                <SurfaceCard className="mb-5 p-5">
                  <Text className="text-sm font-semibold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
                    {t('deleteAccount.confirmLabel')}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                    {t('deleteAccount.confirmHint')}
                  </Text>

                  <ControlledTextInput<AccountDeletionConfirmFormValues>
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="mt-4"
                    control={control}
                    icon={({ color, size }) => (
                      <AlertTriangle color={color} size={size} />
                    )}
                    name="confirmation"
                    placeholder={t('deleteAccount.confirmPlaceholder')}
                    testID="delete-account-confirmation-input"
                  />

                  <Text className="mt-3 text-xs font-semibold uppercase tracking-[1px] text-danger">
                    {t('deleteAccount.finalNotice')}
                  </Text>
                </SurfaceCard>

                <Button
                  isLoading={isSubmitting}
                  onPress={() => {
                    void handleScheduleDeletion();
                  }}
                  testID="confirm-delete-button"
                  variant="danger"
                >
                  {t('deleteAccount.confirmAction')}
                </Button>
              </>
            )}

            {!isLoading ? (
              <Text className="mt-5 text-center text-xs leading-5 text-text-muted dark:text-text-muted-dark">
                {t('deleteAccount.footerNote')}
              </Text>
            ) : null}
          </Animated.View>
        </ScrollView>
      </AppScreenContent>
    </View>
  );
}
