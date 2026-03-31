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

export async function verifyInstantRefreshToken(
  refreshToken: string
): Promise<{ userId: string } | null> {
  const appId = getInstantAppIdForServer();
  if (!appId || !refreshToken) return null;

  const apiURI = getInstantApiUriForServer();
  const response = await fetch(`${apiURI}/runtime/auth/verify_refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'app-id': appId,
      'refresh-token': refreshToken,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as VerifyRefreshJson;
  const userId = data.user?.id;
  if (typeof userId !== 'string' || !userId) return null;
  return { userId };
}
