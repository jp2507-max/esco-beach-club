type JwtPayload = Record<string, unknown>;

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64WithAtob(base64: string): string | null {
  const atobFn = (globalThis as { atob?: (value: string) => string }).atob;
  if (!atobFn) return null;

  try {
    const binary = atobFn(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return null;
  }
}

function decodeBase64WithBuffer(base64: string): string | null {
  type BufferLike = {
    from: (
      value: string,
      encoding: 'base64'
    ) => { toString: (encoding: 'utf8') => string };
  };

  const bufferCtor = (globalThis as { Buffer?: BufferLike }).Buffer;
  if (!bufferCtor) return null;

  try {
    return bufferCtor.from(base64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function decodeBase64Pure(base64: string): string | null {
  const normalized = base64.replace(/\s+/g, '');
  if (!normalized) return null;

  let chunk = 0;
  let bitCount = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    if (char === '=') break;

    const index = BASE64_ALPHABET.indexOf(char);
    if (index < 0) return null;

    chunk = (chunk << 6) | index;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((chunk >> bitCount) & 0xff);
    }
  }

  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

function decodeBase64UrlPayload(base64Url: string): string | null {
  const paddedBase64 = `${base64Url}${'='.repeat((4 - (base64Url.length % 4)) % 4)}`;
  const base64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');

  const decodedWithBuffer = decodeBase64WithBuffer(base64);
  if (decodedWithBuffer !== null) return decodedWithBuffer;

  const decodedWithAtob = decodeBase64WithAtob(base64);
  if (decodedWithAtob !== null) return decodedWithAtob;

  return decodeBase64Pure(base64);
}

export function decodeJwtPayload(idToken: string): JwtPayload | null {
  const tokenParts = idToken.split('.');

  if (tokenParts.length < 2) {
    return null;
  }

  const decoded = decodeBase64UrlPayload(tokenParts[1]);
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(decoded) as unknown;

    if (parsed && typeof parsed === 'object') {
      return parsed as JwtPayload;
    }

    return null;
  } catch {
    return null;
  }
}

export function getIdTokenAudienceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.aud === undefined || payload.aud === null) {
    return null;
  }

  if (typeof payload.aud === 'string') {
    return payload.aud;
  }

  if (Array.isArray(payload.aud)) {
    const audValues = payload.aud.filter(
      (value): value is string => typeof value === 'string'
    );

    if (audValues.length > 0) {
      return audValues.join(',');
    }
  }

  return null;
}

export function getIdTokenNonceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.nonce === undefined || payload.nonce === null) {
    return null;
  }

  if (typeof payload.nonce === 'string') {
    const normalizedNonce = payload.nonce.trim();
    return normalizedNonce || null;
  }

  return null;
}

function normalizeDisplayNameForCreate(
  value: string | null | undefined
): string {
  const trimmed = value?.trim().replace(/\s+/g, ' ');

  if (!trimmed) return '';

  return trimmed.slice(0, 60);
}

function deriveDisplayNameFromEmail(email: string | null | undefined): string {
  if (!email) return '';

  const emailPrefix = email.split('@')[0]?.trim() ?? '';
  if (!emailPrefix) return '';

  const normalized = emailPrefix
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeDisplayNameForCreate(normalized);
}

function deriveDisplayNameFromIdToken(idToken: string): string {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return '';

  const directClaims = [
    payload.name,
    payload.given_name,
    payload.preferred_username,
    payload.nickname,
  ];

  for (const claim of directClaims) {
    if (typeof claim !== 'string') continue;

    const normalized = normalizeDisplayNameForCreate(claim);
    if (normalized.length >= 2) return normalized;
  }

  const claimEmail = typeof payload.email === 'string' ? payload.email : null;
  return deriveDisplayNameFromEmail(claimEmail);
}

export function resolveDisplayNameForCreate(params: {
  onboardingDisplayName?: string;
  email?: string | null;
  idToken?: string;
  t?: (key: string) => string;
}): string | null {
  const fromOnboarding = normalizeDisplayNameForCreate(
    params.onboardingDisplayName
  );
  if (fromOnboarding.length >= 2) return fromOnboarding;

  if (params.idToken) {
    const fromIdToken = deriveDisplayNameFromIdToken(params.idToken);
    if (fromIdToken.length >= 2) return fromIdToken;
  }

  const fromEmail = deriveDisplayNameFromEmail(params.email);
  if (fromEmail.length >= 2) return fromEmail;

  return params.t ? params.t('common:member') : null;
}
