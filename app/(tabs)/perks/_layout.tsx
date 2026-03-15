import React from 'react';
import { Stack } from 'expo-router';

export default function PerksStackLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" />
    </Stack>
  );
}
