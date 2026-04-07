import { describe, expect, test } from 'bun:test';

import { buildPosBillEntryKey } from '@/src/lib/pos/build-pos-bill-entry-key';

describe('buildPosBillEntryKey', () => {
  test('normalizes restaurant id and builds canonical key', () => {
    expect(
      buildPosBillEntryKey({
        posBillId: 'bill-1001',
        restaurantId: '  esco_danang  ',
      })
    ).toBe('pos-bill:ESCO_DANANG:bill-1001');
  });

  test('preserves pos bill id casing', () => {
    expect(
      buildPosBillEntryKey({
        posBillId: 'Bill-1001',
        restaurantId: 'ESCO_DANANG',
      })
    ).toBe('pos-bill:ESCO_DANANG:Bill-1001');
  });
});
