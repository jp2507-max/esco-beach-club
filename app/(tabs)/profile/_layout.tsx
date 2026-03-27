import { Stack } from 'expo-router';
import React from 'react';

import { nestedCardStackScreenOptions } from '@/src/lib/navigation/stack-header-options';

export default function ProfileStackLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={nestedCardStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit-profile"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="invite"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="saved-events"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="theme-preference"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="help-center"
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="membership"
        options={{ headerShown: false, presentation: 'card' }}
      />
    </Stack>
  );
}
