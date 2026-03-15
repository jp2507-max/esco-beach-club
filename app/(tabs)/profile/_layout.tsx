import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileStackLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="invite" options={{ presentation: 'card', title: 'Invite & Earn' }} />
    </Stack>
  );
}
