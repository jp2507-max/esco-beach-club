import { useColorScheme } from 'react-native';

import { useThemePreferenceStore } from '@/src/stores/theme-preference-store';

export function useAppIsDark(): boolean {
  const colorScheme = useColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);

  if (preference === 'system') return colorScheme === 'dark';

  return preference === 'dark';
}
