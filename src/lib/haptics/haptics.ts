import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

import { addMonitoringBreadcrumb } from '@/src/lib/monitoring';

type HapticTrigger = () => Promise<void>;
type HapticFeedbackKey = 'error' | 'light' | 'medium' | 'selection' | 'success';
type AndroidFallbackStage = 'expo_vibrator' | 'native_engine' | 'rn_vibration';

type AndroidHapticConfig = {
  androidFallback: HapticTrigger;
  androidType: Haptics.AndroidHaptics;
  finalFallbackPattern: number | number[];
  ios: HapticTrigger;
};

export const androidHapticConfigByFeedbackKey: Record<
  HapticFeedbackKey,
  AndroidHapticConfig
> = {
  error: {
    androidFallback: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    androidType: Haptics.AndroidHaptics.Reject,
    finalFallbackPattern: [0, 28, 40, 22],
    ios: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  },
  light: {
    androidFallback: () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    androidType: Haptics.AndroidHaptics.Virtual_Key,
    finalFallbackPattern: 12,
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  },
  medium: {
    androidFallback: () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    androidType: Haptics.AndroidHaptics.Long_Press,
    finalFallbackPattern: 18,
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  },
  selection: {
    androidFallback: () => Haptics.selectionAsync(),
    androidType: Haptics.AndroidHaptics.Virtual_Key,
    finalFallbackPattern: 10,
    ios: () => Haptics.selectionAsync(),
  },
  success: {
    androidFallback: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    androidType: Haptics.AndroidHaptics.Confirm,
    finalFallbackPattern: [0, 18, 24, 26],
    ios: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  },
};

const loggedAndroidFallbacks = new Set<string>();

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown_error';
}

function logAndroidHapticFallback(params: {
  error: unknown;
  feedbackKey: HapticFeedbackKey;
  stage: AndroidFallbackStage;
}): void {
  const logKey = `${params.feedbackKey}:${params.stage}`;
  if (loggedAndroidFallbacks.has(logKey)) return;

  loggedAndroidFallbacks.add(logKey);

  const errorMessage = resolveErrorMessage(params.error);
  addMonitoringBreadcrumb({
    category: 'haptics',
    data: {
      errorMessage,
      fallbackStage: params.stage,
      feedbackKey: params.feedbackKey,
      platform: Platform.OS,
    },
    level: 'warning',
    message: 'Android haptic fallback activated',
  });
  if (__DEV__) {
    console.warn(
      `[Haptics] Falling back to ${params.stage} for "${params.feedbackKey}": ${errorMessage}`
    );
  }
}

async function runAndroidHapticWithFallback(params: {
  androidFallback: HapticTrigger;
  androidType: Haptics.AndroidHaptics;
  feedbackKey: HapticFeedbackKey;
  finalFallbackPattern: number | number[];
}): Promise<void> {
  try {
    await Haptics.performAndroidHapticsAsync(params.androidType);
    return;
  } catch (error) {
    logAndroidHapticFallback({
      error,
      feedbackKey: params.feedbackKey,
      stage: 'native_engine',
    });
  }

  try {
    await params.androidFallback();
    return;
  } catch (error) {
    logAndroidHapticFallback({
      error,
      feedbackKey: params.feedbackKey,
      stage: 'expo_vibrator',
    });
  }

  try {
    Vibration.vibrate(params.finalFallbackPattern);
  } catch (error) {
    logAndroidHapticFallback({
      error,
      feedbackKey: params.feedbackKey,
      stage: 'rn_vibration',
    });
    return;
  }

  logAndroidHapticFallback({
    error: 'final_vibration_fallback_used',
    feedbackKey: params.feedbackKey,
    stage: 'rn_vibration',
  });
}

function triggerHaptic(params: { feedbackKey: HapticFeedbackKey }): void {
  const config = androidHapticConfigByFeedbackKey[params.feedbackKey];
  if (Platform.OS === 'android') {
    void runAndroidHapticWithFallback({
      feedbackKey: params.feedbackKey,
      androidFallback: config.androidFallback,
      androidType: config.androidType,
      finalFallbackPattern: config.finalFallbackPattern,
    });
    return;
  }

  if (Platform.OS === 'ios') {
    void config.ios().catch(() => undefined);
  }
}

export function hapticLight(): void {
  triggerHaptic({ feedbackKey: 'light' });
}

export function hapticMedium(): void {
  triggerHaptic({ feedbackKey: 'medium' });
}

export function hapticSuccess(): void {
  triggerHaptic({ feedbackKey: 'success' });
}

export function hapticError(): void {
  triggerHaptic({ feedbackKey: 'error' });
}

export function hapticSelection(): void {
  triggerHaptic({ feedbackKey: 'selection' });
}
