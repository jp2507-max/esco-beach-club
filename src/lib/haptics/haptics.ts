import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { addMonitoringBreadcrumb } from '@/src/lib/monitoring';

type HapticTrigger = () => Promise<void>;

const loggedAndroidFallbacks = new Set<string>();

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown_error';
}

function logAndroidHapticFallback(feedbackKey: string, error: unknown): void {
  if (!__DEV__) return;
  if (loggedAndroidFallbacks.has(feedbackKey)) return;

  loggedAndroidFallbacks.add(feedbackKey);

  const errorMessage = resolveErrorMessage(error);
  addMonitoringBreadcrumb({
    category: 'haptics',
    data: {
      errorMessage,
      feedbackKey,
      platform: Platform.OS,
    },
    level: 'warning',
    message: 'Android haptic fallback activated',
  });
  console.warn(
    `[Haptics] Falling back to vibrator-backed feedback for "${feedbackKey}": ${errorMessage}`
  );
}

async function runAndroidHapticWithFallback(params: {
  androidType: Haptics.AndroidHaptics;
  fallback: HapticTrigger;
  feedbackKey: string;
}): Promise<void> {
  try {
    await Haptics.performAndroidHapticsAsync(params.androidType);
    return;
  } catch (error) {
    logAndroidHapticFallback(params.feedbackKey, error);
  }

  await params.fallback().catch(() => undefined);
}

function triggerHaptic(params: {
  androidFallback: HapticTrigger;
  androidType: Haptics.AndroidHaptics;
  feedbackKey: string;
  ios: HapticTrigger;
}): void {
  if (Platform.OS === 'android') {
    void runAndroidHapticWithFallback({
      androidType: params.androidType,
      feedbackKey: params.feedbackKey,
      fallback: params.androidFallback,
    });
    return;
  }

  if (Platform.OS === 'ios') {
    void params.ios().catch(() => undefined);
  }
}

export function hapticLight(): void {
  triggerHaptic({
    androidFallback: () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    androidType: Haptics.AndroidHaptics.Keyboard_Tap,
    feedbackKey: 'light',
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  });
}

export function hapticMedium(): void {
  triggerHaptic({
    androidFallback: () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    androidType: Haptics.AndroidHaptics.Context_Click,
    feedbackKey: 'medium',
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  });
}

export function hapticSuccess(): void {
  triggerHaptic({
    androidFallback: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    androidType: Haptics.AndroidHaptics.Confirm,
    feedbackKey: 'success',
    ios: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  });
}

export function hapticError(): void {
  triggerHaptic({
    androidFallback: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    androidType: Haptics.AndroidHaptics.Reject,
    feedbackKey: 'error',
    ios: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  });
}

export function hapticSelection(): void {
  triggerHaptic({
    androidFallback: () => Haptics.selectionAsync(),
    androidType: Haptics.AndroidHaptics.Segment_Tick,
    feedbackKey: 'selection',
    ios: () => Haptics.selectionAsync(),
  });
}
