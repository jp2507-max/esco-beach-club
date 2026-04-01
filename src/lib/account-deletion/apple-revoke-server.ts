import { createPrivateKey, createSign } from 'node:crypto';

const APPLE_AUTH_BASE_URL = 'https://appleid.apple.com';

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getRequiredEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n');
}

function getAppleClientId(): string | null {
  return getRequiredEnv('APPLE_CLIENT_ID') || getRequiredEnv('APPLE_SERVICES_ID');
}

function createAppleClientSecret(clientId: string): string | null {
  const teamId = getRequiredEnv('APPLE_TEAM_ID');
  const keyId = getRequiredEnv('APPLE_KEY_ID');
  const privateKeyRaw = getRequiredEnv('APPLE_PRIVATE_KEY');

  if (!teamId || !keyId || !clientId || !privateKeyRaw) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId };
  const payload = {
    aud: 'https://appleid.apple.com',
    exp: now + 60 * 5,
    iat: now,
    iss: teamId,
    sub: clientId,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = createSign('SHA256');
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign({
    dsaEncoding: 'ieee-p1363',
    key: createPrivateKey(normalizePrivateKey(privateKeyRaw)),
  });

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export type AppleRevocationResult =
  | { status: 'not_required' }
  | { status: 'not_configured' }
  | { status: 'missing_authorization_code' }
  | { status: 'revoked' }
  | { message: string; status: 'failed' };

type AppleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  refresh_token?: string;
};

async function readAppleErrorMessage(response: Response): Promise<string> {
  let errorBody: unknown = null;
  try {
    errorBody = (await response.json()) as AppleTokenResponse;
  } catch {
    errorBody = null;
  }

  if (
    errorBody &&
    typeof errorBody === 'object' &&
    'error' in errorBody &&
    typeof errorBody.error === 'string'
  ) {
    const description =
      'error_description' in errorBody &&
      typeof errorBody.error_description === 'string' &&
      errorBody.error_description.length > 0
        ? `: ${errorBody.error_description}`
        : '';
    return `${errorBody.error}${description}`;
  }

  return `HTTP ${response.status}`;
}

async function exchangeAuthorizationCodeForRefreshToken(
  authorizationCode: string
): Promise<
  | { refreshToken: string; status: 'ok' }
  | { status: 'not_configured' }
  | { message: string; status: 'failed' }
> {
  const clientId = getAppleClientId();
  const clientSecret = clientId ? createAppleClientSecret(clientId) : null;

  if (!clientId || !clientSecret) {
    return { status: 'not_configured' };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  });

  let response: Response;
  try {
    response = await fetch(`${APPLE_AUTH_BASE_URL}/auth/token`, {
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'network_error',
    };
  }

  if (!response.ok) {
    return {
      status: 'failed',
      message: await readAppleErrorMessage(response),
    };
  }

  let tokenBody: AppleTokenResponse;
  try {
    tokenBody = (await response.json()) as AppleTokenResponse;
  } catch {
    return {
      status: 'failed',
      message: 'apple_token_exchange_invalid_response',
    };
  }

  if (!tokenBody.refresh_token) {
    return {
      status: 'failed',
      message: 'apple_refresh_token_missing',
    };
  }

  return {
    refreshToken: tokenBody.refresh_token,
    status: 'ok',
  };
}

export async function revokeAppleAuthorizationCode(
  authorizationCode: string | null | undefined
): Promise<AppleRevocationResult> {
  if (!authorizationCode) {
    return { status: 'missing_authorization_code' };
  }

  const exchangeResult =
    await exchangeAuthorizationCodeForRefreshToken(authorizationCode);
  if (exchangeResult.status === 'not_configured') {
    return { status: 'not_configured' };
  }
  if (exchangeResult.status === 'failed') {
    return {
      status: 'failed',
      message: `token_exchange_failed: ${exchangeResult.message}`,
    };
  }

  const clientId = getAppleClientId();
  const clientSecret = clientId ? createAppleClientSecret(clientId) : null;

  if (!clientId || !clientSecret) {
    return { status: 'not_configured' };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    token: exchangeResult.refreshToken,
    token_type_hint: 'refresh_token',
  });

  let response: Response;
  try {
    response = await fetch(`${APPLE_AUTH_BASE_URL}/auth/revoke`, {
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'network_error',
    };
  }

  if (response.ok) {
    return { status: 'revoked' };
  }

  return {
    status: 'failed',
    message: await readAppleErrorMessage(response),
  };
}
