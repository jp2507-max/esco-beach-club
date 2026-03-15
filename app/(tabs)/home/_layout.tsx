import React from 'react';
import { Stack } from 'expo-router';

export default function HomeStackLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ presentation: 'card', title: 'Menu' }} />
    </Stack>
  );
}
