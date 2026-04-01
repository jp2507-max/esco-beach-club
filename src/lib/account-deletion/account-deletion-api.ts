import Constants from 'expo-constants';

import type { AuthProviderType } from '@/lib/types';

function getAccountDeletionApiBaseUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const referralBase = process.env.EXPO_PUBLIC_REFERRAL_API_BASE_URL?.trim();
  if (referralBase) return referralBase.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:8081`;
    }
  }

  return null;
}

type ApiFailureReason = 'network' | 'no_endpoint';

export type AccountDeletionApiResult<T> =
  | { ok: true; body: T; status: number }
  | { ok: false; message?: string; reason: ApiFailureReason; status?: number };

async function postJson<T>(
  path: string,
  refreshToken: string,
  body: Record<string, unknown>
): Promise<AccountDeletionApiResult<T>> {
  const base = getAccountDeletionApiBaseUrl();
  if (!base) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let responseBody: T | null = null;
    try {
      responseBody = (await response.json()) as T;
    } catch {
      responseBody = null;
    }

    if (response.ok && responseBody !== null) {
      return {
        ok: true,
        body: responseBody,
        status: response.status,
      };
    }

    return {
      ok: false,
      reason: 'network',
      status: response.status,
      message: `HTTP ${response.status}`,
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
