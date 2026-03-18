import { Redirect } from 'expo-router';
import React from 'react';

export default function TabsIndexRedirect(): React.JSX.Element {
  return <Redirect href={'/home' as never} />;
}
