import { useEffect, useState } from 'react';
import { Appearance, type ColorSchemeName, useColorScheme } from 'react-native';

import { useThemePreferenceStore } from '@/src/stores/theme-preference-store';

type ResolvedColorScheme = 'dark' | 'light';

function resolveColorScheme(
  colorScheme: ColorSchemeName | null | undefined
): ResolvedColorScheme | null {
  if (colorScheme === 'dark' || colorScheme === 'light') return colorScheme;
  return null;
}

function getCurrentSystemColorScheme(): ResolvedColorScheme | null {
  return resolveColorScheme(Appearance.getColorScheme());
}

let lastKnownSystemColorScheme: ResolvedColorScheme | null = null;

export function useAppIsDark(): boolean {
  const colorScheme = useColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const resolvedColorScheme = resolveColorScheme(colorScheme);
  const [resolvedSystemColorScheme, setResolvedSystemColorScheme] =
    useState<ResolvedColorScheme | null>(() => getCurrentSystemColorScheme());

  useEffect(() => {
    const nextSystemColorScheme = getCurrentSystemColorScheme();

    if (nextSystemColorScheme) {
      setResolvedSystemColorScheme((currentSystemColorScheme) =>
        currentSystemColorScheme === nextSystemColorScheme
          ? currentSystemColorScheme
          : nextSystemColorScheme
      );
    }

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const nextResolvedColorScheme = resolveColorScheme(colorScheme);
      if (!nextResolvedColorScheme) return;

      setResolvedSystemColorScheme((currentSystemColorScheme) =>
        currentSystemColorScheme === nextResolvedColorScheme
          ? currentSystemColorScheme
          : nextResolvedColorScheme
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (resolvedColorScheme) {
      lastKnownSystemColorScheme = resolvedColorScheme;
      return;
    }

    if (preference === 'system' && resolvedSystemColorScheme) {
      lastKnownSystemColorScheme = resolvedSystemColorScheme;
    }
  }, [preference, resolvedColorScheme, resolvedSystemColorScheme]);

  if (preference === 'system') {
    const effectiveScheme =
      resolvedColorScheme ??
      resolvedSystemColorScheme ??
      lastKnownSystemColorScheme;
    return (effectiveScheme ?? 'light') === 'dark';
  }

  return preference === 'dark';
}
