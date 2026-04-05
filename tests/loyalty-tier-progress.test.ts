import { describe, expect, test } from 'bun:test';

import { rewardTierKeys } from '@/lib/types';
import {
  getNextRewardTierKey,
  getRewardTierDefinition,
  hasTierUpgradePath,
} from '@/src/lib/loyalty';

describe('loyalty tier progression', () => {
  test('member has upgrade path to legend at 50 points', () => {
    const memberDefinition = getRewardTierDefinition(rewardTierKeys.member);

    expect(hasTierUpgradePath(rewardTierKeys.member)).toBe(true);
    expect(getNextRewardTierKey(rewardTierKeys.member)).toBe(
      rewardTierKeys.legend
    );
    expect(memberDefinition.progressTargetPoints).toBe(50);
  });

  test('legend has no further upgrade path', () => {
    const legendDefinition = getRewardTierDefinition(rewardTierKeys.legend);

    expect(hasTierUpgradePath(rewardTierKeys.legend)).toBe(false);
    expect(getNextRewardTierKey(rewardTierKeys.legend)).toBeNull();
    expect(legendDefinition.progressTargetPoints).toBe(0);
  });
});
