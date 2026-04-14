import {
  Platform,
  type ColorValue,
  type PressableAndroidRippleConfig,
} from 'react-native';

export function getAndroidRippleConfig(
  color: ColorValue
): PressableAndroidRippleConfig | undefined {
  if (Platform.OS !== 'android') return undefined;

  return {
    borderless: false,
    color,
  };
}
