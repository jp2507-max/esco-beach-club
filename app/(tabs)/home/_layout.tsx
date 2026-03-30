import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function HomeStackLayout(): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Stack screenOptions={nestedCardStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="menu"
        options={{ presentation: 'card', title: t('menu') }}
      />
    </Stack>
  );
}
