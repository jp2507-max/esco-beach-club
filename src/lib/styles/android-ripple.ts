import type { ColorValue, PressableAndroidRippleConfig } from 'react-native';
import { Platform } from 'react-native';

export function getAndroidRippleConfig(
  color: ColorValue,
  options: { borderless?: boolean } = {}
): PressableAndroidRippleConfig | undefined {
  if (Platform.OS !== 'android') return undefined;

  return {
    borderless: options.borderless ?? false,
    color,
  };
}
