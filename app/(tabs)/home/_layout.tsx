import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { createNestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';

export default function HomeStackLayout(): React.JSX.Element {
  const { t } = useTranslation('common');
  const isDark = useAppIsDark();

  return (
    <Stack screenOptions={createNestedCardStackScreenOptions(isDark)}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="menu"
        options={{
          presentation: 'card',
          title: t('menu'),
        }}
      />
    </Stack>
  );
}
