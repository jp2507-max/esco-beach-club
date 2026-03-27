import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="signup"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Protected>

      <Stack.Screen
        name="onboarding-welcome"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="onboarding-profile-basics"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="onboarding-local-identity"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="onboarding-permissions"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="onboarding-final-details"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
