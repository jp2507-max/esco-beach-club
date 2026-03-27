import { Stack } from 'expo-router';
import React from 'react';

import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function PerksStackLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={nestedCardStackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="history"
        options={{ headerShown: false, presentation: 'card' }}
      />
    </Stack>
  );
}
