import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import {
  profileBootstrapStates,
  useProfileData,
} from '@/providers/DataProvider';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import { useSignupOnboardingDraftStore } from '@/src/stores/signup-onboarding-store';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';

function profileBootstrapErrorDescription(
  t: TFunction<'auth'>,
  bootstrapError: Error | null
): string {
  const code = bootstrapError?.message;
  if (isAuthErrorKey(code)) {
    return t(code);
  }

  return t('profileBootstrapErrorMessage');
}

function BootstrapRecoveryCard(props: {
  errorMessage: string;
  isWorking: boolean;
  onBackToSignIn: () => Promise<void>;
  onSignOut: () => Promise<boolean>;
  title: string;
}): React.JSX.Element {
  const { t } = useTranslation('auth');

  return (
    <View className="flex-1 items-center justify-center bg-background px-6 dark:bg-dark-bg">
      <View className="w-full max-w-110 rounded-[28px] border border-border bg-card p-6 dark:border-dark-border dark:bg-dark-bg-card">
        <Text className="text-center text-2xl font-extrabold text-text dark:text-text-primary-dark">
          {props.title}
        </Text>
        <Text className="mt-3 text-center text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
          {props.errorMessage}
        </Text>

        <View className="mt-6 gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-13 items-center justify-center rounded-full border border-border bg-white px-5 dark:border-dark-border dark:bg-dark-bg-elevated"
            disabled={props.isWorking}
            onPress={() => {
              void props.onSignOut();
            }}
            testID="auth-bootstrap-sign-out"
          >
            <Text className="text-sm font-semibold text-text dark:text-text-primary-dark">
              {t('profileBootstrapSignOutAction')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="h-13 items-center justify-center rounded-full"
            disabled={props.isWorking}
            onPress={() => {
              void props.onBackToSignIn();
            }}
            testID="auth-bootstrap-back-to-sign-in"
          >
            <Text className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">
              {t('profileBootstrapBackToSignInAction')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function PostAuthRedirectScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const { signOut } = useAuth();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    authFlow?: string | string[];
  }>();
  const signupDraft = useSignupOnboardingDraftStore((state) => state.draft);
  const resetSignupDraft = useSignupOnboardingDraftStore(
    (state) => state.resetDraft
  );
  const {
    bootstrapError,
    bootstrapState,
    profile,
    retryProfileProvision,
    userId,
  } = useProfileData();
  const [retriedProvisionUserId, setRetriedProvisionUserId] = React.useState<
    string | null
  >(null);
  const [isRetryingProvision, setIsRetryingProvision] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const authFlow = React.useMemo(() => {
    if (Array.isArray(searchParams.authFlow)) {
      return searchParams.authFlow[0];
    }

    return searchParams.authFlow;
  }, [searchParams.authFlow]);
  const loginHref = React.useMemo(
    () => ({
      pathname: '/(auth)/login' as const,
      params: authFlow ? { authFlow } : {},
    }),
    [authFlow]
  );
  const hasAnySignupDraft = React.useMemo(
    () => Object.keys(signupDraft).length > 0,
    [signupDraft]
  );
  const hasSignupFinalDetailsContext =
    authFlow === 'signup' &&
    signupDraft.hasCompletedSetup === true &&
    signupDraft.hasAcceptedPrivacyPolicy === true &&
    signupDraft.hasAcceptedTerms === true &&
    Boolean(signupDraft.displayName) &&
    Boolean(signupDraft.dateOfBirth);

  const shouldRetryProvision =
    bootstrapState === profileBootstrapStates.recoverableError &&
    !isRetryingProvision &&
    Boolean(userId) &&
    retriedProvisionUserId !== userId;

  React.useEffect(() => {
    if (!shouldRetryProvision || !userId) return;

    const retryUserId = userId;
    setIsRetryingProvision(true);

    void (async (): Promise<void> => {
      try {
        await retryProfileProvision();
      } catch (error: unknown) {
        if (__DEV__) {
          console.error(
            '[PostAuthRedirect] Profile provisioning retry failed',
            {
              error,
              userId: retryUserId,
            }
          );
        }
      } finally {
        setRetriedProvisionUserId(retryUserId);
        setIsRetryingProvision(false);
      }
    })();
  }, [retryProfileProvision, shouldRetryProvision, userId]);

  React.useEffect(() => {
    // Clear any lingering signup draft when not in signup flow.
    if (authFlow === 'signup' || !hasAnySignupDraft) return;

    resetSignupDraft();
  }, [authFlow, hasAnySignupDraft, resetSignupDraft]);

  async function handleSignOut(): Promise<boolean> {
    setIsSigningOut(true);

    try {
      await signOut();
      return true;
    } catch (error: unknown) {
      Alert.alert(t('verificationFailedTitle'), t('unableToSignOut'));

      if (__DEV__) {
        console.error('[PostAuthRedirect] Sign-out failed during recovery', {
          error,
        });
      }

      return false;
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleBackToSignIn(): Promise<void> {
    const didSignOut = await handleSignOut();
    if (!didSignOut) return;

    router.replace(loginHref);
  }

  const isWorking = isRetryingProvision || isSigningOut;
  const errorMessage = profileBootstrapErrorDescription(t, bootstrapError);

  if (bootstrapState === profileBootstrapStates.signedOut) {
    return <Redirect href={loginHref} />;
  }

  if (
    bootstrapState === profileBootstrapStates.authenticating ||
    bootstrapState === profileBootstrapStates.bootstrappingProfile ||
    shouldRetryProvision ||
    isRetryingProvision
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 px-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          {t('profileBootstrapLoadingMessage')}
        </Text>
      </View>
    );
  }

  if (bootstrapState === profileBootstrapStates.recoverableError) {
    return (
      <BootstrapRecoveryCard
        errorMessage={errorMessage}
        isWorking={isWorking}
        title={t('profileBootstrapErrorTitle')}
        onBackToSignIn={handleBackToSignIn}
        onSignOut={handleSignOut}
      />
    );
  }

  if (bootstrapState === profileBootstrapStates.terminalError) {
    return (
      <BootstrapRecoveryCard
        errorMessage={errorMessage}
        isWorking={isWorking}
        title={t('profileBootstrapTerminalTitle')}
        onBackToSignIn={handleBackToSignIn}
        onSignOut={handleSignOut}
      />
    );
  }

  if (!profile?.onboarding_completed_at) {
    if (hasSignupFinalDetailsContext) {
      return <Redirect href="/(auth)/onboarding-final-details" />;
    }

    return <Redirect href="/(auth)/onboarding-welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
