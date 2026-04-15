import { describe, expect, test } from 'bun:test';

import { profileBootstrapStates } from '@/providers/data/context';
import {
  resolvePostAuthLoginHref,
  shouldAutoRetryProfileProvision,
} from '@/src/lib/auth/post-auth-redirect';

describe('post auth redirect helpers', () => {
  test('resolves the post-auth login route to the plain login screen', () => {
    expect(resolvePostAuthLoginHref()).toBe('/(auth)/login');
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
        isRetryingProvision: true,
        retriedProvisionUserId: null,
        userId: 'user-1',
      })
    ).toBe(false);

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
