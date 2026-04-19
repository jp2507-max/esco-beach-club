import { describe, expect, test } from 'bun:test';

import { getScannerFrameLayout } from '@/src/lib/rewards/scanner-layout';

describe('scanner layout sizing', () => {
  test('keeps the scanner body within short Android-style vertical space', () => {
    const layout = getScannerFrameLayout({
      controlsHeight: 236,
      headerHeight: 108,
      windowHeight: 780,
      windowWidth: 360,
    });

    const availableHeight = 780 - 108 - 236 - 12;

    expect(layout.isCompact).toBe(true);
    expect(layout.bodyMinHeight).toBeLessThanOrEqual(availableHeight);
    expect(layout.frameSize).toBe(320);
  });

  test('preserves the larger scanner frame when height allows it', () => {
    const layout = getScannerFrameLayout({
      controlsHeight: 208,
      headerHeight: 104,
      windowHeight: 915,
      windowWidth: 412,
    });

    expect(layout.isCompact).toBe(false);
    expect(layout.frameSize).toBe(340);
    expect(layout.bodyMinHeight).toBe(372);
  });

  test('keeps frame positive and within body bounds on ultra-compact viewports', () => {
    const layout = getScannerFrameLayout({
      controlsHeight: 228,
      headerHeight: 96,
      windowHeight: 500,
      windowWidth: 320,
    });

    const availableHeight = 500 - 96 - 228 - 12;

    expect(layout.isCompact).toBe(true);
    expect(layout.frameSize).toBeGreaterThan(0);
    expect(layout.bodyMinHeight).toBeLessThanOrEqual(availableHeight);
  });
});
