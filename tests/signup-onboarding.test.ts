import { describe, expect, test } from 'bun:test';

import { normalizeSignupOnboardingData } from '@/src/lib/auth/signup-onboarding';

describe('normalizeSignupOnboardingData', () => {
  test('accepts onboarding data without date of birth', () => {
    expect(
      normalizeSignupOnboardingData({
        displayName: '  Member Name  ',
        hasAcceptedPrivacyPolicy: true,
        hasAcceptedTerms: true,
      })
    ).toEqual({
      displayName: 'Member Name',
      hasAcceptedPrivacyPolicy: true,
      hasAcceptedTerms: true,
    });
  });

  test('preserves a valid date of birth when present', () => {
    expect(
      normalizeSignupOnboardingData({
        dateOfBirth: '1990-01-01',
        displayName: 'Member Name',
      })
    ).toEqual({
      dateOfBirth: '1990-01-01',
      displayName: 'Member Name',
    });
  });

  test('rejects invalid date of birth values when present', () => {
    expect(
      normalizeSignupOnboardingData({
        dateOfBirth: '1990-02-30',
        displayName: 'Member Name',
      })
    ).toBeNull();
  });
});
