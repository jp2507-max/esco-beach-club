import { Redirect } from 'expo-router';
import React from 'react';

export default function PostAuthRedirectScreen(): React.JSX.Element {
  return <Redirect href="/(tabs)" />;
}
