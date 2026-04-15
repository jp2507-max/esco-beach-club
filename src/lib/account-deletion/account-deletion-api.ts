import type { AuthProviderType } from '@/lib/types';
import {
  buildClientApiUrl,
  type ClientApiFailure,
  readApiErrorDetails,
} from '@/src/lib/api/client-api';
import { addMonitoringBreadcrumb } from '@/src/lib/monitoring';

export type AccountDeletionApiResult<T> =
  | { ok: true; body: T | null; status: number }
  | ClientApiFailure;

const DEFAULT_ACCOUNT_DELETION_TIMEOUT_MS = 15000;
const SCHEDULE_ACCOUNT_DELETION_TIMEOUT_MS = 30000;

async function postJson<T>(params: {
  body: Record<string, unknown>;
  path: string;
  refreshToken: string;
  timeoutMs?: number;
}): Promise<AccountDeletionApiResult<T>> {
  const { body, path, refreshToken, timeoutMs } = params;
  const url = buildClientApiUrl(path, {
    explicitBaseUrl: process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL,
    fallbackBaseUrl: process.env.EXPO_PUBLIC_REFERRAL_API_BASE_URL,
  });
  if (!url) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const controller = new AbortController();
  const timeout = timeoutMs ?? DEFAULT_ACCOUNT_DELETION_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

    if (response.ok) {
      return {
        ok: true,
        body: responseBody == null ? null : (responseBody as T),
        status: response.status,
      };
    }

    const errorDetails = readApiErrorDetails(responseBody, response.status);
    addMonitoringBreadcrumb({
      category: 'account-deletion',
      data: {
        code: errorDetails.code ?? null,
        path,
        status: response.status,
      },
      level: response.status >= 500 ? 'warning' : 'info',
      message: 'account deletion api http error',
    });

    return {
      ok: false,
      reason: 'http_error',
      status: response.status,
      ...errorDetails,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const effectiveTimeoutMs = timeout;

      addMonitoringBreadcrumb({
        category: 'account-deletion',
        data: {
          path,
          timeoutMs: effectiveTimeoutMs,
        },
        level: 'warning',
        message: 'account deletion api request timed out',
      });

      return {
        ok: false,
        reason: 'timeout',
        message: 'request timed out',
      };
    }

    addMonitoringBreadcrumb({
      category: 'account-deletion',
      data: {
        message: error instanceof Error ? error.message : 'fetch failed',
        path,
      },
      level: 'error',
      message: 'account deletion api network failure',
    });

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
    status:
      | 'failed'
      | 'missing_authorization_code'
      | 'not_configured'
      | 'not_required'
      | 'revoked';
    message?: string;
  };
};

export function postScheduleAccountDeletion(params: {
  appleAuthorizationCode?: string;
  authProvider?: AuthProviderType | null;
  refreshToken: string;
}): Promise<AccountDeletionApiResult<ScheduleAccountDeletionResponse>> {
  return postJson<ScheduleAccountDeletionResponse>({
    body: {
      ...(params.appleAuthorizationCode
        ? { appleAuthorizationCode: params.appleAuthorizationCode }
        : {}),
      ...(params.authProvider ? { authProvider: params.authProvider } : {}),
    },
    path: '/api/account/delete/request',
    refreshToken: params.refreshToken,
    timeoutMs: SCHEDULE_ACCOUNT_DELETION_TIMEOUT_MS,
  });
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
  return postJson<RestoreAccountDeletionResponse>({
    body: {},
    path: '/api/account/delete/restore',
    refreshToken: params.refreshToken,
  });
}
