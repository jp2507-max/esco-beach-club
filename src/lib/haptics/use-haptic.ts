import * as Haptics from 'expo-haptics';

function isIos(): boolean {
  return process.env.EXPO_OS === 'ios';
}

export function hapticLight(): void {
  if (!isIos()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium(): void {
  if (!isIos()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticSuccess(): void {
  if (!isIos()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticError(): void {
  if (!isIos()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function hapticSelection(): void {
  if (!isIos()) return;
  void Haptics.selectionAsync();
}
