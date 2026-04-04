import { describe, expect, test } from 'bun:test';

import { rewardTierKeys, rewardTierLegacyEscoLifeMember } from '@/lib/types';
import { normalizeRewardTierKey } from '@/src/lib/loyalty';
import { toRewardTierKey } from '@/src/lib/mappers/profile';

describe('reward tier mapping', () => {
  test('maps legacy ESCO_LIFE_MEMBER to SHORE', () => {
    expect(toRewardTierKey(rewardTierLegacyEscoLifeMember)).toBe(
      rewardTierKeys.shore
    );
    expect(normalizeRewardTierKey(rewardTierLegacyEscoLifeMember)).toBe(
      rewardTierKeys.shore
    );
  });

  test('accepts canonical tier strings', () => {
    expect(toRewardTierKey('SHORE')).toBe(rewardTierKeys.shore);
    expect(toRewardTierKey('COVE')).toBe(rewardTierKeys.cove);
    expect(toRewardTierKey('HORIZON')).toBe(rewardTierKeys.horizon);
    expect(toRewardTierKey('LUMINARY')).toBe(rewardTierKeys.luminary);
  });

  test('normalize maps unknown to SHORE', () => {
    expect(normalizeRewardTierKey('UNKNOWN')).toBe(rewardTierKeys.shore);
    expect(normalizeRewardTierKey(null)).toBe(rewardTierKeys.shore);
  });
});
