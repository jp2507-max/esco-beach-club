import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function SignupScreen(): React.JSX.Element {
  const params = useLocalSearchParams();

  return (
    <Redirect
      href={{
        pathname: '/(auth)/login',
        params: { ...params, authFlow: 'signup' },
      }}
    />
  );
}
