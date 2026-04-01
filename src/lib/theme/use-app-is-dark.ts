import { useEffect } from 'react';
import { Appearance, useColorScheme, type ColorSchemeName } from 'react-native';

import { useThemePreferenceStore } from '@/src/stores/theme-preference-store';

type ResolvedColorScheme = 'dark' | 'light';

function resolveColorScheme(
  colorScheme: ColorSchemeName | null | undefined
): ResolvedColorScheme | null {
  if (colorScheme === 'dark' || colorScheme === 'light') return colorScheme;
  return null;
}

let lastKnownSystemColorScheme: ResolvedColorScheme =
  resolveColorScheme(Appearance.getColorScheme()) ?? 'light';

export function useAppIsDark(): boolean {
  const colorScheme = useColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const resolvedColorScheme = resolveColorScheme(colorScheme);

  useEffect(() => {
    if (preference === 'system' && resolvedColorScheme) {
      lastKnownSystemColorScheme = resolvedColorScheme;
    }
  }, [preference, resolvedColorScheme]);

  if (preference === 'system') {
    const effectiveScheme =
      resolvedColorScheme ??
      resolveColorScheme(Appearance.getColorScheme()) ??
      lastKnownSystemColorScheme;
    return effectiveScheme === 'dark';
  }

  return preference === 'dark';
}
