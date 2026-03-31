import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { getEscoNavigationPalette } from '@/src/lib/navigation/app-navigation-theme';

export const nestedCardStackScreenOptions = {
  headerBackButtonDisplayMode: 'minimal',
  headerBackTitle: '',
} satisfies NativeStackNavigationOptions;

function getNativeHeaderTitleColor(isDark: boolean): string {
  const navigationPalette = getEscoNavigationPalette(isDark);
  return navigationPalette.primary;
}

export function createNativeHeaderOptions(
  isDark: boolean,
  options: NativeStackNavigationOptions = {}
): NativeStackNavigationOptions {
  const navigationPalette = getEscoNavigationPalette(isDark);
  const backgroundColor = navigationPalette.card;

  return {
    headerStyle: { backgroundColor },
    headerTintColor: navigationPalette.primary,
    headerTitleStyle: { color: getNativeHeaderTitleColor(isDark) },
    ...options,
  };
}

export function createNestedCardStackScreenOptions(
  isDark: boolean,
  options: NativeStackNavigationOptions = {}
): NativeStackNavigationOptions {
  return {
    ...createNativeHeaderOptions(isDark),
    ...nestedCardStackScreenOptions,
    ...options,
  };
}

export function getNativeHeaderBackgroundColor(isDark: boolean): string {
  return getEscoNavigationPalette(isDark).card;
}

export function createLargeTitleHeaderOptions(
  isDark: boolean,
  options: Omit<
    NativeStackNavigationOptions,
    'headerLargeTitle' | 'headerLargeStyle' | 'headerStyle'
  >
): NativeStackNavigationOptions {
  return {
    headerLargeTitle: true,
    ...createNativeHeaderOptions(isDark),
    headerLargeTitleStyle: { color: getNativeHeaderTitleColor(isDark) },
    ...(Platform.OS === 'ios'
      ? {
          headerLargeStyle: {
            backgroundColor: getNativeHeaderBackgroundColor(isDark),
          },
        }
      : {}),
    ...options,
  };
}
