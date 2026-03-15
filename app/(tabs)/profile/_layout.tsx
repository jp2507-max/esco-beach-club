import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileStackLayout(): React.JSX.Element {
  const { t } = useTranslation('profile');
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="invite" options={{ presentation: 'card', title: t('menu.inviteEarn') }} />
    </Stack>
  );
}
