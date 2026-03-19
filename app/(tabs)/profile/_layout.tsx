import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function ProfileStackLayout(): React.JSX.Element {
  const { t } = useTranslation('profile');
  return (
    <Stack screenOptions={nestedCardStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit-profile"
        options={{ presentation: 'card', title: t('editProfile.title') }}
      />
      <Stack.Screen
        name="invite"
        options={{ presentation: 'card', title: t('menu.inviteEarn') }}
      />
      <Stack.Screen
        name="saved-events"
        options={{ presentation: 'card', title: t('savedEvents.title') }}
      />
      <Stack.Screen
        name="theme-preference"
        options={{ presentation: 'card', title: t('theme.title') }}
      />
    </Stack>
  );
}
