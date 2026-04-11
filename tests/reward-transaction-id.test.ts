import { describe, expect, test } from 'bun:test';

import { buildRewardTransactionId } from '@/src/lib/rewards/reward-transaction-id';

describe('reward transaction id', () => {
  test('preserves case distinctions in references', async () => {
    const lowerCaseId = await buildRewardTransactionId(
      'pos-bill:ESCO_DANANG:bill-1001'
    );
    const upperCaseId = await buildRewardTransactionId(
      'pos-bill:ESCO_DANANG:BILL-1001'
    );

    expect(lowerCaseId).not.toBe(upperCaseId);
  });

  test('trims surrounding whitespace without changing case', async () => {
    const trimmed = await buildRewardTransactionId(
      'pos-bill:ESCO_DANANG:Bill-1001'
    );
    const withWhitespace = await buildRewardTransactionId(
      '  pos-bill:ESCO_DANANG:Bill-1001  '
    );

    expect(withWhitespace).toBe(trimmed);
  });
});
