import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function triggerTabPressHapticFeedback(): void {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Segment_Tick
    ).catch(() => undefined);
    return;
  }

  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => undefined);
  }
}
