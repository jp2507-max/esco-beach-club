import type { ColorValue, PressableAndroidRippleConfig } from 'react-native';
import { Platform } from 'react-native';

export function getAndroidRippleConfig(
  color: ColorValue
): PressableAndroidRippleConfig | undefined {
  if (Platform.OS !== 'android') return undefined;

  return {
    borderless: false,
    color,
  };
}
