import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { Colors } from '@/constants/colors';

type EscoNavigationPalette = Pick<
  Theme['colors'],
  'background' | 'border' | 'card' | 'notification' | 'primary' | 'text'
>;

export function getEscoNavigationPalette(
  isDark: boolean
): EscoNavigationPalette {
  if (isDark) {
    return {
      background: Colors.darkBg,
      border: Colors.darkBorder,
      card: Colors.darkBg,
      notification: Colors.primaryBright,
      primary: Colors.primaryBright,
      text: Colors.textPrimaryDark,
    };
  }

  return {
    background: Colors.background,
    border: Colors.border,
    card: Colors.background,
    notification: Colors.primary,
    primary: Colors.primary,
    text: Colors.text,
  };
}

/**
 * Used by `ThemeProvider` in `app/_layout.tsx` for native stack chrome only.
 * Light surfaces (status bar / headers).
 */
export const escoLightNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...getEscoNavigationPalette(false),
  },
};

/** Dark stack chrome; same source tokens as `Colors` / `global.css`. */
export const escoDarkNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...getEscoNavigationPalette(true),
  },
};

export function getEscoNavigationTheme(isDark: boolean): Theme {
  return isDark ? escoDarkNavigationTheme : escoLightNavigationTheme;
}
