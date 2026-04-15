import { Redirect } from 'expo-router';
import React from 'react';

export default function SignupScreen(): React.JSX.Element {
  return (
    <Redirect
      href={{
        pathname: '/(auth)/login',
        params: { authFlow: 'signup' },
      }}
    />
  );
}
