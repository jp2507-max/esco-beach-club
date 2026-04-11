import { describe, expect, test } from 'bun:test';

import {
  mapProfileProvisionErrorToAuthKey,
  PROFILE_PERMISSION_DENIED_ERROR_KEY,
} from '@/src/lib/auth/profile-provision-errors';

describe('profile provision auth error mapping', () => {
  test('preserves canonical profile create permission failures', () => {
    const error = Object.assign(
      new Error(PROFILE_PERMISSION_DENIED_ERROR_KEY),
      {
        canonicalProfileExists: false,
        operation: 'create_profile',
      }
    );

    expect(mapProfileProvisionErrorToAuthKey(error)).toBe(
      PROFILE_PERMISSION_DENIED_ERROR_KEY
    );
  });

  test('preserves profile update permission failures', () => {
    const error = new Error(PROFILE_PERMISSION_DENIED_ERROR_KEY);

    expect(mapProfileProvisionErrorToAuthKey(error)).toBe(
      PROFILE_PERMISSION_DENIED_ERROR_KEY
    );
  });

  test('falls back to the generic bootstrap error key for unknown failures', () => {
    expect(mapProfileProvisionErrorToAuthKey(new Error('boom'))).toBe(
      'unableToCompleteProfileSetup'
    );
  });
});
