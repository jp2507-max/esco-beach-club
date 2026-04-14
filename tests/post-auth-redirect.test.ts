import { describe, expect, test } from 'bun:test';

import { profileBootstrapStates } from '@/providers/data/context';
import {
  resolvePostAuthLoginHref,
  shouldAutoRetryProfileProvision,
} from '@/src/lib/auth/post-auth-redirect';

describe('post auth redirect helpers', () => {
  test('drops stale signup auth flow after sign-out recovery', () => {
    expect(
      resolvePostAuthLoginHref({
        bootstrapState: profileBootstrapStates.signedOut,
        resolvedAuthFlow: 'signup',
      })
    ).toBe('/(auth)/login');
  });

  test('preserves signup auth flow while recovery stays authenticated', () => {
    expect(
      resolvePostAuthLoginHref({
        bootstrapState: profileBootstrapStates.recoverableError,
        resolvedAuthFlow: 'signup',
      })
    ).toEqual({
      pathname: '/(auth)/login',
      params: { authFlow: 'signup' },
    });
  });

  test('auto retries profile provisioning only once per authenticated user', () => {
    expect(
      shouldAutoRetryProfileProvision({
        bootstrapState: profileBootstrapStates.recoverableError,
        isRetryingProvision: false,
        retriedProvisionUserId: null,
        userId: 'user-1',
      })
    ).toBe(true);

    expect(
      shouldAutoRetryProfileProvision({
        bootstrapState: profileBootstrapStates.recoverableError,
        isRetryingProvision: false,
        retriedProvisionUserId: 'user-1',
        userId: 'user-1',
      })
    ).toBe(false);

    expect(
      shouldAutoRetryProfileProvision({
        bootstrapState: profileBootstrapStates.terminalError,
        isRetryingProvision: false,
        retriedProvisionUserId: null,
        userId: 'user-1',
      })
    ).toBe(false);
  });
});
