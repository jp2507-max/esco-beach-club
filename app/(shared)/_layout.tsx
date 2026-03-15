import React from 'react';
import { Stack } from 'expo-router';

export default function SharedLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="events/[id]" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}
