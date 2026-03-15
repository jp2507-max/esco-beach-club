import React from 'react';
import { Stack } from 'expo-router';

export default function ModalLayout(): React.JSX.Element {
  const formSheetOptions = {
    presentation: 'formSheet' as const,
    sheetAllowedDetents: 'fitToContents' as const,
    sheetExpandsWhenScrolledToEdge: false,
    sheetGrabberVisible: true,
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="booking" options={formSheetOptions} />
      <Stack.Screen name="partner" options={{ animation: 'fade', presentation: 'transparentModal' }} />
      <Stack.Screen name="private-event" options={formSheetOptions} />
      <Stack.Screen name="rate-us" options={formSheetOptions} />
      <Stack.Screen name="modal" options={{ animation: 'fade', presentation: 'transparentModal' }} />
    </Stack>
  );
}
