import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function HomeStackLayout(): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ presentation: 'card', title: t('menu') }} />
    </Stack>
  );
}
