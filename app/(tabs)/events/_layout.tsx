import { Stack } from 'expo-router';
import React from 'react';

import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function EventsStackLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={nestedCardStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
