import { Stack } from 'expo-router';
import React from 'react';

export default function PerksStackLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" />
    </Stack>
  );
}
