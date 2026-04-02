import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  createLargeTitleHeaderOptions,
  createNestedCardStackScreenOptions,
} from '@/src/lib/navigation/stack-header-options';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';

export default function EventsStackLayout(): React.JSX.Element {
  const { t } = useTranslation('events');
  const isDark = useAppIsDark();

  return (
    <Stack screenOptions={createNestedCardStackScreenOptions(isDark)}>
      <Stack.Screen
        name="index"
        options={createLargeTitleHeaderOptions(isDark, {
          headerRight: () => null,
          title: t('title'),
        })}
      />
    </Stack>
  );
}
