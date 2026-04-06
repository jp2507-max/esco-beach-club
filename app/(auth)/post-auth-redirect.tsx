import { Redirect } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/colors';
import { useProfileData } from '@/providers/DataProvider';
import { ActivityIndicator, View } from '@/src/tw';

export default function PostAuthRedirectScreen(): React.JSX.Element {
  const {
    profile,
    profileLoading,
    profileProvisionError,
    retryProfileProvision,
    userId,
  } = useProfileData();
  const [retriedProvisionUserId, setRetriedProvisionUserId] = React.useState<
    string | null
  >(null);
  const [isRetryingProvision, setIsRetryingProvision] = React.useState(false);

  const shouldRetryProvision =
    Boolean(profileProvisionError) &&
    !profileLoading &&
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
        console.error('[PostAuthRedirect] Profile provisioning retry failed', {
          error,
          userId: retryUserId,
        });
      } finally {
        setRetriedProvisionUserId(retryUserId);
        setIsRetryingProvision(false);
      }
    })();
  }, [retryProfileProvision, shouldRetryProvision, userId]);

  if (profileLoading || shouldRetryProvision || isRetryingProvision) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (profileProvisionError) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.onboarding_completed_at) {
    return <Redirect href="/(auth)/onboarding-welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
