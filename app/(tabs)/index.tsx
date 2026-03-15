import React from 'react';
import { Redirect } from 'expo-router';

export default function TabsIndexRedirect(): React.JSX.Element {
  return <Redirect href={'/home' as never} />;
}
