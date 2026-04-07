import { Stack } from 'expo-router';
import React from 'react';

import { PerksDataProvider } from '@/providers/DataProvider';
import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function PerksStackLayout(): React.JSX.Element {
  return (
    <PerksDataProvider>
      <Stack screenOptions={nestedCardStackScreenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="history"
          options={{ headerShown: false, presentation: 'card' }}
        />
      </Stack>
    </PerksDataProvider>
  );
}
