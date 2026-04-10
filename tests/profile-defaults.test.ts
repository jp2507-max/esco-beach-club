import { describe, expect, test } from 'bun:test';

import {
  buildMemberId,
  buildProfileId,
  buildReferralCode,
  getDefaultProfileValues,
} from '@/lib/api/shared';
import { onboardingPermissionStatuses, rewardTierKeys } from '@/lib/types';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('default profile values', () => {
  test('uses deterministic profile id strategy tied to auth user id', () => {
    expect(buildProfileId(TEST_USER_ID)).toBe(TEST_USER_ID);

    const values = getDefaultProfileValues({ userId: TEST_USER_ID });
    expect(values.userId).toBe(TEST_USER_ID);
  });

  test('derives public member/referral identifiers distinct from the profile id', () => {
    const profileId = buildProfileId(TEST_USER_ID);
    const memberId = buildMemberId(TEST_USER_ID);
    const referralCode = buildReferralCode(TEST_USER_ID);

    expect(memberId).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(referralCode).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(memberId).not.toBe(profileId);
    expect(memberId).not.toBe(referralCode);
  });

  test('generates fresh public identifiers per profile bootstrap attempt', () => {
    const first = getDefaultProfileValues({ userId: TEST_USER_ID });
    const second = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect(first.userId).toBe(TEST_USER_ID);
    expect(second.userId).toBe(TEST_USER_ID);
    expect(first.member_id).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(first.referral_code).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(second.member_id).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(second.referral_code).toMatch(/^ESCO-[A-F0-9]{16}$/);
    expect(first.member_id).not.toBe(first.referral_code);
    expect(second.member_id).not.toBe(second.referral_code);
  });

  test('uses a safe fallback full name when no display name or email are provided', () => {
    const values = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect(values.full_name).toBe('Member');
    expect(values.full_name.length).toBeGreaterThanOrEqual(1);
    expect(values.full_name.length).toBeLessThanOrEqual(60);
  });

  test('normalizes and truncates display names to 60 chars', () => {
    const values = getDefaultProfileValues({
      userId: TEST_USER_ID,
      displayName: `  Alice   ${'x'.repeat(120)}  `,
    });

    expect(values.full_name.includes('  ')).toBe(false);
    expect(values.full_name.length).toBe(60);
  });

  test('derives and clamps fallback name from email prefix', () => {
    const values = getDefaultProfileValues({
      userId: TEST_USER_ID,
      email: `john.doe-super_long_${'a'.repeat(120)}@example.com`,
    });

    expect(values.full_name.length).toBeGreaterThanOrEqual(1);
    expect(values.full_name.length).toBeLessThanOrEqual(60);
  });

  test('initializes onboarding permission statuses to undetermined', () => {
    const values = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect(values.location_permission_status).toBe(
      onboardingPermissionStatuses.undetermined
    );
    expect(values.push_notification_permission_status).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });

  test('does not seed onboarding completion during profile provisioning', () => {
    const values = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect('onboarding_completed_at' in values).toBe(false);
  });

  test('initializes loyalty progression defaults for new members', () => {
    const values = getDefaultProfileValues({ userId: TEST_USER_ID });

    expect(values.lifetime_tier_key).toBe(rewardTierKeys.member);
    expect(values.tier_progress_points).toBe(0);
    expect(values.tier_progress_target_points).toBeGreaterThan(0);
    expect(values.next_tier_key).toBeTruthy();
  });
});
