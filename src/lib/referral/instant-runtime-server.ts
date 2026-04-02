const DEFAULT_API_URI = 'https://api.instantdb.com';

export function getInstantAppIdForServer(): string | null {
  const id =
    process.env.INSTANT_APP_ID?.trim() ||
    process.env.EXPO_PUBLIC_INSTANT_APP_ID?.trim();
  return id || null;
}

export function getInstantApiUriForServer(): string {
  return process.env.INSTANT_API_URI?.trim() || DEFAULT_API_URI;
}

type VerifyRefreshJson = {
  user?: { id?: string };
};

export type VerifyInstantRefreshTokenResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      code: 'instant_auth_unreachable' | 'missing_app_id' | 'unauthorized';
      message?: string;
    };

export async function verifyInstantRefreshToken(
  refreshToken: string
): Promise<VerifyInstantRefreshTokenResult> {
  const appId = getInstantAppIdForServer();
  if (!appId) {
    return {
      ok: false,
      code: 'missing_app_id',
      message: 'Missing Instant app id',
    };
  }

  if (!refreshToken) {
    return { ok: false, code: 'unauthorized' };
  }

  const apiURI = getInstantApiUriForServer();

  let response: Response;
  try {
    response = await fetch(`${apiURI}/runtime/auth/verify_refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'app-id': appId,
        'refresh-token': refreshToken,
      }),
    });
  } catch (err) {
    console.error('verify_refresh_token network error:', err);
    return {
      ok: false,
      code: 'instant_auth_unreachable',
      message:
        err instanceof Error ? err.message : 'Could not reach Instant auth',
    };
  }

  if (!response.ok) return { ok: false, code: 'unauthorized' };

  try {
    const data = (await response.json()) as VerifyRefreshJson;
    const userId = data.user?.id;
    if (typeof userId !== 'string' || !userId) {
      return { ok: false, code: 'unauthorized' };
    }
    return { ok: true, userId };
  } catch {
    return { ok: false, code: 'unauthorized' };
  }
}
