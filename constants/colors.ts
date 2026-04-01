/**
 * JS mirror of semantic colors in `global.css` `@theme`. Keep both in sync when
 * changing tokens — Uniwind classes read CSS; native headers, gradients, and
 * `StyleSheet` props read this file.
 */
export const Colors = {
  primary: '#E91E63',
  primaryBright: '#FF6B9D',
  primaryDark: '#C2185B',
  secondary: '#009688',
  secondaryBright: '#5EEAD4',
  secondaryDark: '#00796B',
  secondaryDeeper: '#004D40',
  background: '#FFFDF5',
  darkBg: '#0D0B14',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  darkBgCard: '#1A1622',
  darkBgElevated: '#272230',
  text: '#1A1A2E',
  textPrimaryDark: '#F1F5F9',
  textSecondary: '#6B7280',
  textSecondaryDark: '#D4C8E0',
  textLight: '#9CA3AF',
  textMuted: '#9CA3AF',
  textMutedDark: '#A89CB8',
  border: '#F0EDE5',
  borderLight: '#F4E7DC',
  darkBorder: '#3A3342',
  darkBorderBright: '#524859',
  cardGradientStart: '#E91E63',
  cardGradientMiddle: '#F06292',
  cardGradientEnd: '#FF9800',
  /** Member card gradient in dark mode (deeper, less glare). */
  cardGradientDark: ['#9D1744', '#C45B8A', '#D4652E'] as const,
  teal: '#009688',
  tealLight: '#B2DFDB',
  pinkLight: '#FCE4EC',
  sand: '#F5F0E1',
  sandDark: '#E8E0CC',
  success: '#4CAF50',
  gold: '#C8A24D',
  goldBright: '#F0D896',
  primaryFixed: '#FCE4EC',
  secondaryFixed: '#B2DFDB',
  surfaceContainerLow: '#FAF8F0',
  gradientPrimary: ['#BC004B', '#C00053', '#A5004B'],
  vipAccent: '#FF7043',
  warning: '#FF9800',
  warningDark: '#F59E0B',
  danger: '#EF5350',
  errorDark: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
  overlayTintDark: 'rgba(0,0,0,0.18)',
  overlayTintLight: 'rgba(255,255,255,0.15)',
  /** Poster-style default avatar illustration (no semantic theme mapping). */
  avatarFallback: {
    base: '#f3b68e',
    gradient: ['#f17963', '#f9b36b', '#8ee5e0'] as const,
    highlight: 'rgba(255, 255, 255, 0.25)',
    discTeal: 'rgba(16, 184, 200, 0.2)',
    wave: 'rgba(90, 211, 224, 0.75)',
    chin: '#f4a77c',
    cheek: '#f7c49b',
    nose: '#d28a58',
    faceLight: '#ffd9bc',
    feature: 'rgba(143, 90, 54, 0.85)',
  },
  ACTIVE_BG_DARK: 'rgba(255,107,157,0.14)',
  ACTIVE_BG_LIGHT: 'rgba(233,30,99,0.1)',
  badgeDarkBackground: '#1A1622',
  badgeLightBackground: '#FFF8F5',
  badgeWarningDarkBackground: 'rgba(245, 158, 11, 0.13)',
  badgeWarningLightBackground: '#FFF8E1',
  badgeWarningDarkBorder: '#F59E0B',
  badgeWarningLightBorder: '#F9A825',
  eventTierHighlightLight: '#FFF5F8',
  profileCanvasBg: '#E8F0F8',
  profileOrbLarge: '#F8BBD020',
  profileOrbLargeDark: '#E9255E22',
  profileOrbMid: '#B2EBF220',
  profileOrbMidDark: '#5ED4AF1C',
  profileOrbSmall: '#F3E5F520',
  profileOrbSmallDark: '#FF6B9D18',
  voucherNotchBg: '#E8F0F8',
} as const;

/** Icon / accent color on dark surfaces (cards, nav). Light mode returns `accent` unchanged. */
export function accentOnDarkBackground(
  accent: string,
  isDark: boolean
): string {
  if (!isDark) return accent;
  if (accent === Colors.gold) return Colors.goldBright;
  if (accent === Colors.secondary) return Colors.secondaryBright;
  if (accent === Colors.primary) return Colors.primaryBright;
  return accent;
}

export default Colors;
