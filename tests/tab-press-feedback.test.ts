import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

const hapticSelectionMock = mock(() => {});

mock.module('@/src/lib/haptics/haptics', () => ({
  hapticSelection: hapticSelectionMock,
}));

const { triggerTabPressHapticFeedback } =
  await import('@/src/lib/haptics/tab-press-feedback');

describe('tab press haptic feedback', () => {
  beforeEach(() => {
    hapticSelectionMock.mockReset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('routes tab presses through the shared selection haptic', () => {
    triggerTabPressHapticFeedback();

    expect(hapticSelectionMock).toHaveBeenCalledTimes(1);
  });
});
