import { describe, expect, test } from 'bun:test';

import { tryAcquireScanLock } from '@/src/lib/rewards/scan-lock';

describe('scan lock', () => {
  test('acquires lock only once until released', () => {
    const lockRef = { current: false };

    expect(tryAcquireScanLock(lockRef)).toBe(true);
    expect(lockRef.current).toBe(true);

    expect(tryAcquireScanLock(lockRef)).toBe(false);

    lockRef.current = false;
    expect(tryAcquireScanLock(lockRef)).toBe(true);
  });
});
