import type { AuthProviderType } from '@/lib/types';
import {
  buildClientApiUrl,
  type ClientApiResult,
  readApiErrorDetails,
} from '@/src/lib/api/client-api';

export type AccountDeletionApiResult<T> = ClientApiResult<T>;

async function postJson<T>(
  path: string,
  refreshToken: string,
  body: Record<string, unknown>
): Promise<AccountDeletionApiResult<T>> {
  const url = buildClientApiUrl(path, {
    explicitBaseUrl: process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL,
    fallbackBaseUrl: process.env.EXPO_PUBLIC_REFERRAL_API_BASE_URL,
  });
  if (!url) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let responseBody: unknown = null;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (response.ok && responseBody !== null) {
      return {
        ok: true,
        body: responseBody as T,
        status: response.status,
      };
    }

    return {
      ok: false,
      reason: 'http_error',
      status: response.status,
      ...readApiErrorDetails(responseBody, response.status),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        reason: 'network',
        message: 'request timed out',
      };
    }

    return {
      ok: false,
      reason: 'network',
      message: error instanceof Error ? error.message : 'fetch failed',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export type ScheduleAccountDeletionResponse = {
  alreadyScheduled?: boolean;
  request: {
    id: string;
    requestedAt: string;
    scheduledForAt: string;
    status: string;
  };
  revocation?: {
    message?: string;
    status: string;
  };
};

export function postScheduleAccountDeletion(params: {
  appleAuthorizationCode?: string;
  authProvider?: AuthProviderType | null;
  refreshToken: string;
}): Promise<AccountDeletionApiResult<ScheduleAccountDeletionResponse>> {
  return postJson<ScheduleAccountDeletionResponse>(
    '/api/account/delete/request',
    params.refreshToken,
    {
      ...(params.appleAuthorizationCode
        ? { appleAuthorizationCode: params.appleAuthorizationCode }
        : {}),
      ...(params.authProvider ? { authProvider: params.authProvider } : {}),
    }
  );
}

export type RestoreAccountDeletionResponse = {
  ok: true;
  request: {
    id: string;
    restoredAt: string;
    status: string;
  };
};

export function postRestoreAccountDeletion(params: {
  refreshToken: string;
}): Promise<AccountDeletionApiResult<RestoreAccountDeletionResponse>> {
  return postJson<RestoreAccountDeletionResponse>(
    '/api/account/delete/restore',
    params.refreshToken,
    {}
  );
}
