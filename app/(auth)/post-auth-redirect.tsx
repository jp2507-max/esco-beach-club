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

  const shouldRetryProvision =
    Boolean(profileProvisionError) &&
    !profileLoading &&
    Boolean(userId) &&
    retriedProvisionUserId !== userId;

  React.useEffect(() => {
    if (!shouldRetryProvision || !userId) return;

    setRetriedProvisionUserId(userId);
    void retryProfileProvision();
  }, [retryProfileProvision, shouldRetryProvision, userId]);

  if (profileLoading || shouldRetryProvision) {
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
