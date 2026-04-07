function normalizeBaseUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

export type ClientApiFailureReason =
  | 'http_error'
  | 'network'
  | 'no_endpoint'
  | 'parse_error';

export type ClientApiFailure = {
  ok: false;
  code?: string;
  message?: string;
  reason: ClientApiFailureReason;
  status?: number;
};

export type ClientApiResult<T> =
  | { ok: true; body: T; status: number }
  | ClientApiFailure;

export function buildClientApiUrl(
  path: string,
  options: {
    explicitBaseUrl?: string | null | undefined;
    fallbackBaseUrl?: string | null | undefined;
  }
): string | null {
  const explicitBaseUrl = normalizeBaseUrl(options.explicitBaseUrl);
  if (explicitBaseUrl) return `${explicitBaseUrl}${path}`;

  const fallbackBaseUrl = normalizeBaseUrl(options.fallbackBaseUrl);
  if (fallbackBaseUrl) return `${fallbackBaseUrl}${path}`;

  // Expo Router server features resolve relative requests to the dev-server origin in development.
  if (__DEV__) return path;

  return null;
}

export function readApiErrorDetails(
  body: unknown,
  status: number
): Pick<ClientApiFailure, 'code' | 'message'> {
  if (body && typeof body === 'object') {
    const bodyRecord = body as Record<string, unknown>;
    const code =
      typeof bodyRecord.error === 'string' && bodyRecord.error
        ? bodyRecord.error
        : undefined;
    const message =
      typeof bodyRecord.message === 'string' && bodyRecord.message
        ? bodyRecord.message
        : code;

    return {
      ...(code ? { code } : {}),
      message: message ?? `HTTP ${status}`,
    };
  }

  return { message: `HTTP ${status}` };
}
