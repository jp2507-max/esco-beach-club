import { describe, expect, test } from 'bun:test';

import { rewardTierKeys } from '@/lib/types';
import { normalizeRewardTierKey } from '@/src/lib/loyalty';
import { toRewardTierKey } from '@/src/lib/mappers/profile';

describe('reward tier mapping', () => {
  test('accepts canonical tier strings', () => {
    expect(toRewardTierKey('MEMBER')).toBe(rewardTierKeys.member);
    expect(toRewardTierKey('LEGEND')).toBe(rewardTierKeys.legend);
  });

  test('rejects legacy tier strings', () => {
    expect(toRewardTierKey('ESCO_LIFE_MEMBER')).toBeNull();
    expect(toRewardTierKey('SHORE')).toBeNull();
    expect(toRewardTierKey('COVE')).toBeNull();
    expect(toRewardTierKey('HORIZON')).toBeNull();
    expect(toRewardTierKey('LUMINARY')).toBeNull();

    // Loyalty normalizer still falls back unknown values to member.
    expect(normalizeRewardTierKey('SHORE')).toBe(rewardTierKeys.member);
  });

  test('normalize maps unknown to MEMBER', () => {
    expect(normalizeRewardTierKey('UNKNOWN')).toBe(rewardTierKeys.member);
    expect(normalizeRewardTierKey(null)).toBe(rewardTierKeys.member);
  });
});
