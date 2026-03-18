import type { ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  | 'elevation'
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
>;

export const shadows = {
  level1: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  level2: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  level3: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  level4: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  level5: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
} as const satisfies Record<string, ShadowStyle>;
