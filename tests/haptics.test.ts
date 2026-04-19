import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const addMonitoringBreadcrumbMock = mock(() => {});
const impactAsyncMock = mock(async () => {});
const notificationAsyncMock = mock(async () => {});
const performAndroidHapticsAsyncMock = mock(async () => {});
const selectionAsyncMock = mock(async () => {});
const vibrateMock = mock(() => {});

const platform = {
  OS: 'android',
};

mock.module('@/src/lib/monitoring', () => ({
  addMonitoringBreadcrumb: addMonitoringBreadcrumbMock,
}));

mock.module('react-native', () => ({
  Platform: platform,
  Vibration: {
    vibrate: vibrateMock,
  },
}));

mock.module('expo-haptics', () => ({
  AndroidHaptics: {
    Confirm: 'confirm',
    Long_Press: 'long-press',
    Reject: 'reject',
    Virtual_Key: 'virtual-key',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Error: 'error',
    Success: 'success',
  },
  impactAsync: impactAsyncMock,
  notificationAsync: notificationAsyncMock,
  performAndroidHapticsAsync: performAndroidHapticsAsyncMock,
  selectionAsync: selectionAsyncMock,
}));

const hadOriginalDev = Object.prototype.hasOwnProperty.call(
  globalThis,
  '__DEV__'
);
const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const {
  androidHapticConfigByFeedbackKey,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
} = await import('@/src/lib/haptics/haptics');

async function flushHapticQueue(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('haptics', () => {
  beforeEach(() => {
    addMonitoringBreadcrumbMock.mockReset();
    impactAsyncMock.mockReset();
    notificationAsyncMock.mockReset();
    performAndroidHapticsAsyncMock.mockReset();
    selectionAsyncMock.mockReset();
    vibrateMock.mockReset();
    platform.OS = 'android';
  });

  afterAll(() => {
    if (hadOriginalDev) {
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    } else {
      delete (globalThis as { __DEV__?: boolean }).__DEV__;
    }

    mock.restore();
  });

  test('uses sturdier Android mappings for light and medium interactions', () => {
    expect(androidHapticConfigByFeedbackKey.light.androidType).toBe(
      'virtual-key'
    );
    expect(androidHapticConfigByFeedbackKey.selection.androidType).toBe(
      'virtual-key'
    );
    expect(androidHapticConfigByFeedbackKey.medium.androidType).toBe(
      'long-press'
    );
    expect(androidHapticConfigByFeedbackKey.success.androidType).toBe(
      'confirm'
    );
  });

  test('prefers the Android haptics engine when it succeeds', async () => {
    performAndroidHapticsAsyncMock.mockResolvedValue(undefined);

    hapticSelection();
    await flushHapticQueue();

    expect(performAndroidHapticsAsyncMock).toHaveBeenCalledWith('virtual-key');
    expect(selectionAsyncMock).not.toHaveBeenCalled();
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  test('falls back to Expo vibrator-backed feedback when native haptics fails', async () => {
    performAndroidHapticsAsyncMock.mockRejectedValueOnce(
      new Error('native haptics unavailable')
    );
    impactAsyncMock.mockResolvedValue(undefined);

    hapticMedium();
    await flushHapticQueue();

    expect(performAndroidHapticsAsyncMock).toHaveBeenCalledWith('long-press');
    expect(impactAsyncMock).toHaveBeenCalledWith('medium');
    expect(vibrateMock).not.toHaveBeenCalled();
    expect(addMonitoringBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fallbackStage: 'native_engine',
          feedbackKey: 'medium',
        }),
      })
    );
  });

  test('uses React Native vibration as the final Android fallback', async () => {
    performAndroidHapticsAsyncMock.mockRejectedValueOnce(
      new Error('native haptics unavailable')
    );
    notificationAsyncMock.mockRejectedValueOnce(
      new Error('expo vibrator unavailable')
    );

    hapticSuccess();
    await flushHapticQueue();

    expect(notificationAsyncMock).toHaveBeenCalledWith('success');
    expect(vibrateMock).toHaveBeenCalledWith([0, 18, 24, 26]);
    expect(addMonitoringBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fallbackStage: 'rn_vibration',
          feedbackKey: 'success',
        }),
      })
    );
  });

  test('keeps iOS on the iOS feedback path', async () => {
    platform.OS = 'ios';
    notificationAsyncMock.mockResolvedValue(undefined);

    hapticSuccess();
    await flushHapticQueue();

    expect(performAndroidHapticsAsyncMock).not.toHaveBeenCalled();
    expect(notificationAsyncMock).toHaveBeenCalledWith('success');
    expect(vibrateMock).not.toHaveBeenCalled();
  });
});
