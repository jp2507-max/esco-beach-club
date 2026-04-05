import { Redirect } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/colors';
import { useProfileData } from '@/providers/DataProvider';
import { ActivityIndicator, View } from '@/src/tw';

export default function PostAuthRedirectScreen(): React.JSX.Element {
  const { profile, profileLoading } = useProfileData();

  if (profileLoading) {
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
