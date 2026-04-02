import { Stack } from 'expo-router';
import React from 'react';

import { BookingContentDataProvider } from '@/providers/DataProvider';

export default function BookingFlowLayout(): React.JSX.Element {
  return (
    <BookingContentDataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
    </BookingContentDataProvider>
  );
}
