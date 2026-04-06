import { describe, expect, test } from 'bun:test';

import { onboardingPermissionStatuses } from '@/lib/types';
import { toOnboardingPermissionStatus } from '@/src/lib/mappers/shared';

describe('toOnboardingPermissionStatus', () => {
  test('normalizes whitespace and mixed casing', () => {
    expect(toOnboardingPermissionStatus(' granted ')).toBe(
      onboardingPermissionStatuses.granted
    );
    expect(toOnboardingPermissionStatus('Denied')).toBe(
      onboardingPermissionStatuses.denied
    );
    expect(toOnboardingPermissionStatus('  UNDETERMINED  ')).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });

  test('falls back to undetermined for unsupported values', () => {
    expect(toOnboardingPermissionStatus('authorized')).toBe(
      onboardingPermissionStatuses.undetermined
    );
    expect(toOnboardingPermissionStatus(null)).toBe(
      onboardingPermissionStatuses.undetermined
    );
    expect(toOnboardingPermissionStatus(undefined)).toBe(
      onboardingPermissionStatuses.undetermined
    );
    expect(toOnboardingPermissionStatus(123)).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });
});
