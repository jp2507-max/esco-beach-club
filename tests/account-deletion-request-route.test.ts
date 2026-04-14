import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';

import { accountDeletionStatuses, authProviderTypes } from '@/lib/types';

const addMonitoringBreadcrumbMock = mock(() => {});
const createInstantCreateStepMock = mock(
  (_entity: string, _id: string, payload: Record<string, unknown>) => ({
    payload,
  })
);
const createInstantLinkStepMock = mock(
  (_entity: string, _id: string, payload: Record<string, unknown>) => ({
    payload,
  })
);
const createInstantUpdateStepMock = mock(
  (_entity: string, _id: string, payload: Record<string, unknown>) => ({
    payload,
  })
);

async function instantAdminFetchPassthrough<TResult>(
  config: {
    adminToken: string;
    apiUri: string;
    appId: string;
  },
  path: string,
  init: RequestInit
): Promise<TResult | undefined> {
  const timeoutController = new AbortController();
  const abortTimer = setTimeout(() => {
    timeoutController.abort(
      new Error('instant_admin_request_timeout_after_30000ms')
    );
  }, 30_000);

  const requestController = new AbortController();
  const callerSignal = init.signal;

  const onTimeoutAbort = (): void => {
    requestController.abort(timeoutController.signal.reason);
  };
  timeoutController.signal.addEventListener('abort', onTimeoutAbort, {
    once: true,
  });

  let onCallerAbort: (() => void) | undefined;
  if (callerSignal) {
    if (callerSignal.aborted) {
      requestController.abort(callerSignal.reason);
    } else {
      onCallerAbort = (): void => {
        requestController.abort(callerSignal.reason);
      };
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    const url = new URL(path, config.apiUri);
    url.searchParams.set('app_id', config.appId);

    const response = await fetch(url.toString(), {
      ...init,
      headers: {
        Authorization: `Bearer ${config.adminToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
        'app-id': config.appId,
      },
      signal: requestController.signal,
    });

    if (response.status === 204) {
      return undefined;
    }

    const responseText = await response.text();
    if (!responseText) {
      return undefined;
    }

    return JSON.parse(responseText) as TResult;
  } finally {
    clearTimeout(abortTimer);
    timeoutController.signal.removeEventListener('abort', onTimeoutAbort);
    if (callerSignal && onCallerAbort) {
      callerSignal.removeEventListener('abort', onCallerAbort);
    }
  }
}

const instantAdminFetchMock = mock(instantAdminFetchPassthrough);
const revokeAppleAuthorizationCodeMock = mock(async () => ({
  status: 'revoked' as const,
}));
const transactMock = mock(async () => ({}) as Record<string, unknown>);
const signOutMock = mock(async () => undefined);
const queryMock = mock(async () => ({}));
const verifyInstantRefreshTokenMock = mock(async () => ({
  ok: true as const,
  userId: 'user-123',
}));

mock.module('@/src/lib/account-deletion/apple-revoke-server', () => ({
  revokeAppleAuthorizationCode: revokeAppleAuthorizationCodeMock,
}));

mock.module('@/src/lib/referral/instant-admin-server', () => ({
  createInstantCreateStep: createInstantCreateStepMock,
  createInstantLinkStep: createInstantLinkStepMock,
  createInstantRecordId: () => '00000000-0000-4000-8000-000000000123',
  createInstantUpdateStep: createInstantUpdateStepMock,
  instantAdminFetch: instantAdminFetchMock,
  getInstantAdminDb: () => ({
    query: queryMock,
    signOut: signOutMock,
    transact: transactMock,
  }),
}));

mock.module('@/src/lib/referral/instant-runtime-server', () => ({
  verifyInstantRefreshToken: verifyInstantRefreshTokenMock,
}));

mock.module('@/src/lib/monitoring', () => ({
  addMonitoringBreadcrumb: addMonitoringBreadcrumbMock,
  captureHandledError() {},
}));

const { POST } = await import('@/app/api/account/delete/request+api');

function createRequest(body: Record<string, unknown> = {}): Request {
  return new Request('https://example.com/api/account/delete/request', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer refresh-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('account deletion request route', () => {
  afterAll(() => {
    mock.restore();
  });

  beforeEach(() => {
    addMonitoringBreadcrumbMock.mockReset();
    createInstantCreateStepMock.mockReset();
    createInstantLinkStepMock.mockReset();
    createInstantUpdateStepMock.mockReset();
    instantAdminFetchMock.mockReset();
    queryMock.mockReset();
    revokeAppleAuthorizationCodeMock.mockReset();
    signOutMock.mockReset();
    transactMock.mockReset();
    verifyInstantRefreshTokenMock.mockReset();

    instantAdminFetchMock.mockImplementation(instantAdminFetchPassthrough);
    transactMock.mockResolvedValue({});
    signOutMock.mockResolvedValue(undefined);
    verifyInstantRefreshTokenMock.mockResolvedValue({
      ok: true,
      userId: 'user-123',
    });
  });

  test('persists a revoked Apple deletion request', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.apple,
            id: 'user-123',
          },
        ],
      });
    revokeAppleAuthorizationCodeMock.mockResolvedValueOnce({
      status: 'revoked',
    });

    const response = await POST(
      createRequest({ appleAuthorizationCode: 'apple-code' })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.request.status).toBe(accountDeletionStatuses.pending);
    expect(body.revocation).toEqual({
      status: 'revoked',
    });
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).toMatchObject({
      apple_revocation_status: 'revoked',
      auth_provider: authProviderTypes.apple,
    });
  });

  test('schedules deletion for Google accounts without Apple revocation', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.google,
            id: 'user-123',
          },
        ],
      });

    const response = await POST(createRequest({ authProvider: 'google' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.request.status).toBe(accountDeletionStatuses.pending);
    expect(body.revocation).toBeUndefined();
    expect(revokeAppleAuthorizationCodeMock).not.toHaveBeenCalled();
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).toMatchObject({
      auth_provider: authProviderTypes.google,
      profile_id: 'user-123',
    });
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).not.toHaveProperty(
      'apple_revocation_status'
    );
  });

  test('rejects deletion when the Apple authorization code is missing', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.apple,
            id: 'user-123',
          },
        ],
      });
    revokeAppleAuthorizationCodeMock.mockResolvedValueOnce({
      status: 'missing_authorization_code',
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'apple_revocation_failed',
      message: 'missing_authorization_code',
    });
    expect(createInstantCreateStepMock).not.toHaveBeenCalled();
    expect(transactMock).not.toHaveBeenCalled();
  });

  test('rejects deletion when Apple revocation is not configured', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.apple,
            id: 'user-123',
          },
        ],
      });
    revokeAppleAuthorizationCodeMock.mockResolvedValueOnce({
      status: 'not_configured',
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'apple_revocation_failed',
      message: 'not_configured',
    });
    expect(createInstantCreateStepMock).not.toHaveBeenCalled();
    expect(transactMock).not.toHaveBeenCalled();
  });

  test('rejects deletion when Apple revocation fails', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.apple,
            id: 'user-123',
          },
        ],
      });
    revokeAppleAuthorizationCodeMock.mockResolvedValueOnce({
      message: 'token_exchange_failed',
      status: 'failed',
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: 'apple_revocation_failed',
      message: 'revocation_failed',
    });
    expect(createInstantCreateStepMock).not.toHaveBeenCalled();
    expect(transactMock).not.toHaveBeenCalled();
  });

  test('schedules deletion when the auth provider cannot be resolved', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: null,
            id: 'user-123',
          },
        ],
      });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.request.status).toBe(accountDeletionStatuses.pending);
    expect(body.revocation).toBeUndefined();
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).not.toHaveProperty(
      'auth_provider'
    );
    expect(revokeAppleAuthorizationCodeMock).not.toHaveBeenCalled();
  });

  test('still hard-fails when the profile id cannot be resolved', async () => {
    queryMock
      .mockResolvedValueOnce({ account_deletion_requests: [] })
      .mockResolvedValueOnce({
        profiles: [
          {
            auth_provider: authProviderTypes.apple,
            id: null,
          },
        ],
      });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: 'profile_unresolved',
      message: 'Could not determine profile for account deletion',
    });
    expect(transactMock).not.toHaveBeenCalled();
  });
});
