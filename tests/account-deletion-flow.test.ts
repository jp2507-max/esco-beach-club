import { describe, expect, test } from 'bun:test';

import { authProviderTypes } from '@/lib/types';
import {
  getAccountDeletionRevocationResponse,
  getAppleRevocationPersistenceFields,
  isAppleDeletionWarningStatus,
  isProviderSignInCanceled,
  shouldAttemptGoogleProviderRevocation,
  shouldContinueAfterAppleVerificationError,
} from '@/src/lib/account-deletion/account-deletion-flow';

describe('account deletion flow helpers', () => {
  test('treats provider cancel as the only blocking Apple verification error', () => {
    const canceled = new Error('providerSignInCanceled');
    const failed = new Error('appleAuthUnavailable');

    expect(isProviderSignInCanceled(canceled)).toBe(true);
    expect(shouldContinueAfterAppleVerificationError(canceled)).toBe(false);
    expect(isProviderSignInCanceled(failed)).toBe(false);
    expect(shouldContinueAfterAppleVerificationError(failed)).toBe(true);
  });

  test('flags only Google accounts for post-delete provider revocation', () => {
    expect(
      shouldAttemptGoogleProviderRevocation(authProviderTypes.google)
    ).toBe(true);
    expect(shouldAttemptGoogleProviderRevocation(authProviderTypes.apple)).toBe(
      false
    );
    expect(
      shouldAttemptGoogleProviderRevocation(authProviderTypes.magicCode)
    ).toBe(false);
  });

  test('persists Apple revocation warning states for missing authorization code', () => {
    expect(isAppleDeletionWarningStatus('missing_authorization_code')).toBe(
      true
    );
    expect(
      getAppleRevocationPersistenceFields({
        status: 'missing_authorization_code',
      })
    ).toEqual({
      apple_revocation_error: 'missing_authorization_code',
      apple_revocation_status: 'missing_authorization_code',
    });
    expect(
      getAccountDeletionRevocationResponse({
        provider: authProviderTypes.apple,
        revocation: { status: 'missing_authorization_code' },
      })
    ).toEqual({
      message: 'missing_authorization_code',
      status: 'missing_authorization_code',
    });
  });

  test('persists Apple revocation warning states for failed revocation', () => {
    expect(isAppleDeletionWarningStatus('failed')).toBe(true);
    expect(
      getAppleRevocationPersistenceFields({
        status: 'failed',
        message: 'token_exchange_failed',
      })
    ).toEqual({
      apple_revocation_error: 'token_exchange_failed',
      apple_revocation_status: 'failed',
    });
    expect(
      getAccountDeletionRevocationResponse({
        provider: authProviderTypes.apple,
        revocation: {
          status: 'failed',
          message: 'token_exchange_failed',
        },
      })
    ).toEqual({
      message: 'token_exchange_failed',
      status: 'failed',
    });
  });

  test('omits revocation payload for non-Apple deletions', () => {
    expect(
      getAccountDeletionRevocationResponse({
        provider: authProviderTypes.google,
        revocation: { status: 'not_required' },
      })
    ).toBeUndefined();
  });
});
