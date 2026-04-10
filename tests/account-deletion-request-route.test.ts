import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { accountDeletionStatuses, authProviderTypes } from '@/lib/types';

const addMonitoringBreadcrumbMock = mock(() => {});
const createInstantCreateStepMock = mock(
  (_entity: string, _id: string, payload: Record<string, unknown>) => ({
    payload,
  })
);
const createInstantUpdateStepMock = mock(
  (_entity: string, _id: string, payload: Record<string, unknown>) => ({
    payload,
  })
);
const revokeAppleAuthorizationCodeMock = mock(async () => ({
  status: 'revoked' as const,
}));
const transactMock = mock(async () => undefined);
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
  createInstantUpdateStep: createInstantUpdateStepMock,
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
  beforeEach(() => {
    addMonitoringBreadcrumbMock.mockReset();
    createInstantCreateStepMock.mockReset();
    createInstantUpdateStepMock.mockReset();
    queryMock.mockReset();
    revokeAppleAuthorizationCodeMock.mockReset();
    signOutMock.mockReset();
    transactMock.mockReset();
    verifyInstantRefreshTokenMock.mockReset();

    transactMock.mockResolvedValue(undefined);
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

  test('schedules deletion when the Apple authorization code is missing', async () => {
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

    expect(response.status).toBe(201);
    expect(body.revocation).toEqual({
      message: 'missing_authorization_code',
      status: 'missing_authorization_code',
    });
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).toMatchObject({
      apple_revocation_error: 'missing_authorization_code',
      apple_revocation_status: 'missing_authorization_code',
    });
  });

  test('schedules deletion when Apple revocation is not configured', async () => {
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

    expect(response.status).toBe(201);
    expect(body.revocation).toEqual({
      message: 'not_configured',
      status: 'not_configured',
    });
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).toMatchObject({
      apple_revocation_error: 'not_configured',
      apple_revocation_status: 'not_configured',
    });
  });

  test('schedules deletion when Apple revocation fails', async () => {
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

    expect(response.status).toBe(201);
    expect(body.revocation).toEqual({
      message: 'token_exchange_failed',
      status: 'failed',
    });
    expect(createInstantCreateStepMock.mock.calls[0]?.[2]).toMatchObject({
      apple_revocation_error: 'token_exchange_failed',
      apple_revocation_status: 'failed',
    });
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
