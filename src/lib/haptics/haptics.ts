import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function hapticLight(): void {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Keyboard_Tap
    ).catch(() => undefined);
    return;
  }
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined
    );
  }
}

export function hapticMedium(): void {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Context_Click
    ).catch(() => undefined);
    return;
  }
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined
    );
  }
}

export function hapticSuccess(): void {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Confirm
    ).catch(() => undefined);
    return;
  }
  if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => undefined);
  }
}

export function hapticError(): void {
  if (Platform.OS === 'android') {
    void Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Reject
    ).catch(() => undefined);
    return;
  }
  if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    ).catch(() => undefined);
  }
}

export function hapticSelection(): void {
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
