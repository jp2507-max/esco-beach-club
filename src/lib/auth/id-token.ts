type JwtPayload = Record<string, unknown>;

export function decodeJwtPayload(idToken: string): JwtPayload | null {
  const tokenParts = idToken.split('.');

  if (tokenParts.length < 2) {
    return null;
  }

  const base64Url = tokenParts[1];
  const paddedBase64 = `${base64Url}${'='.repeat((4 - (base64Url.length % 4)) % 4)}`;
  const base64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');
  const atobFn = (globalThis as { atob?: (value: string) => string }).atob;

  if (!atobFn) {
    return null;
  }

  try {
    const decoded = atobFn(base64);
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
}): string {
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

  return 'Member';
}
