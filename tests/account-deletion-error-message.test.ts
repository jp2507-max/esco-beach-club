import { describe, expect, test } from 'bun:test';
import type { TFunction } from 'i18next';

import { getAccountDeletionErrorMessage } from '@/src/lib/account-deletion/account-deletion-error-message';

function createTranslationStub(): TFunction<'profile'> {
  return ((key: string) => key) as TFunction<'profile'>;
}

describe('getAccountDeletionErrorMessage', () => {
  const t = createTranslationStub();

  test('maps Apple revocation failures to a dedicated message', () => {
    const message = getAccountDeletionErrorMessage(
      {
        ok: false,
        reason: 'http_error',
        code: 'apple_revocation_failed',
        message: 'token_exchange_failed',
        status: 502,
      },
      t
    );

    expect(message).toBe('deleteAccount.errors.appleRevocationFailed');
  });

  test('maps unresolved auth provider failures to a dedicated message', () => {
    const message = getAccountDeletionErrorMessage(
      {
        ok: false,
        reason: 'http_error',
        code: 'auth_provider_unresolved',
        message: 'Could not determine auth provider',
        status: 409,
      },
      t
    );

    expect(message).toBe('deleteAccount.errors.authProviderUnresolved');
  });

  test('maps schema drift failures to a dedicated server-schema message', () => {
    const message = getAccountDeletionErrorMessage(
      {
        ok: false,
        reason: 'http_error',
        code: 'server_schema_misconfigured',
        message: 'schema missing',
        status: 503,
      },
      t
    );

    expect(message).toBe('deleteAccount.errors.serverSchemaMisconfigured');
  });

  test('maps unclassified 5xx failures to a generic server error message', () => {
    const message = getAccountDeletionErrorMessage(
      {
        ok: false,
        reason: 'http_error',
        message: 'something failed',
        status: 500,
      },
      t
    );

    expect(message).toBe('deleteAccount.errors.serverUnexpected');
  });
});
