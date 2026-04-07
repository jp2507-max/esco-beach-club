import { describe, expect, test } from 'bun:test';

import { buildRewardTransactionId } from '@/src/lib/rewards/reward-transaction-id';

describe('reward transaction id', () => {
  test('preserves case distinctions in references', () => {
    const lowerCaseId = buildRewardTransactionId(
      'pos-bill:ESCO_DANANG:bill-1001'
    );
    const upperCaseId = buildRewardTransactionId(
      'pos-bill:ESCO_DANANG:BILL-1001'
    );

    expect(lowerCaseId).not.toBe(upperCaseId);
  });

  test('trims surrounding whitespace without changing case', () => {
    const trimmed = buildRewardTransactionId('pos-bill:ESCO_DANANG:Bill-1001');
    const withWhitespace = buildRewardTransactionId(
      '  pos-bill:ESCO_DANANG:Bill-1001  '
    );

    expect(withWhitespace).toBe(trimmed);
  });
});
