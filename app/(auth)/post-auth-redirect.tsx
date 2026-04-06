import { Redirect, useRouter } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useProfileData } from '@/providers/DataProvider';
import { ActivityIndicator, View } from '@/src/tw';

export default function PostAuthRedirectScreen(): React.JSX.Element {
  const { signOut } = useAuth();
  const router = useRouter();
  const {
    profile,
    profileLoading,
    isRetryable,
    profileProvisionError,
    retryProfileProvision,
    userId,
  } = useProfileData();
  const [retriedProvisionUserId, setRetriedProvisionUserId] = React.useState<
    string | null
  >(null);
  const [isRetryingProvision, setIsRetryingProvision] = React.useState(false);
  const [provisionFailureRecoveryActive, setProvisionFailureRecoveryActive] =
    React.useState(false);
  const provisionRecoveryStartedRef = React.useRef(false);

  const shouldRetryProvision =
    Boolean(profileProvisionError) &&
    isRetryable &&
    !profileLoading &&
    !isRetryingProvision &&
    Boolean(userId) &&
    retriedProvisionUserId !== userId;

  const needsProvisionRecovery =
    Boolean(profileProvisionError) &&
    !isRetryable &&
    !profileLoading &&
    !isRetryingProvision;

  React.useEffect(() => {
    if (!needsProvisionRecovery) return;
    if (provisionRecoveryStartedRef.current) return;
    provisionRecoveryStartedRef.current = true;
    setProvisionFailureRecoveryActive(true);

    void (async (): Promise<void> => {
      try {
        await signOut();
        router.replace('/(auth)/login');
      } catch (error: unknown) {
        if (__DEV__) {
          console.error(
            '[PostAuthRedirect] Provision recovery sign-out failed',
            { error }
          );
        }
      }
    })();
  }, [needsProvisionRecovery, router, signOut]);

  React.useEffect(() => {
    if (profileProvisionError) return;
    if (provisionRecoveryStartedRef.current) return;
    setProvisionFailureRecoveryActive(false);
  }, [profileProvisionError]);

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

  const showAuthSpinner =
    profileLoading ||
    shouldRetryProvision ||
    isRetryingProvision ||
    needsProvisionRecovery ||
    provisionFailureRecoveryActive;

  if (showAuthSpinner) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile?.onboarding_completed_at) {
    return <Redirect href="/(auth)/onboarding-welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
