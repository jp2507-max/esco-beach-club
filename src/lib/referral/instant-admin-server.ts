import {
  getInstantApiUriForServer,
  getInstantAppIdForServer,
} from '@/src/lib/referral/instant-runtime-server';

type InstantAdminErrorBody = {
  message?: string;
  type?: string;
};

type InstantAdminFetchJson =
  | InstantAdminErrorBody
  | {
      [key: string]: unknown;
    };

type InstantTransactionAction =
  | 'create'
  | 'delete'
  | 'link'
  | 'merge'
  | 'ruleParams'
  | 'unlink'
  | 'update';

type InstantTransactionLookupRef = [string, unknown];

export type InstantTransactionStep = [
  InstantTransactionAction,
  string,
  string | InstantTransactionLookupRef,
  unknown,
  { upsert?: boolean }?,
];

export type InstantAdminDb = {
  query: <TResult = Record<string, unknown>>(
    query: Record<string, unknown>
  ) => Promise<TResult>;
  signOut: (
    params: { email: string } | { id: string } | { refresh_token: string }
  ) => Promise<void>;
  transact: (
    steps: InstantTransactionStep | InstantTransactionStep[]
  ) => Promise<Record<string, unknown>>;
};

type InstantAdminApiError = Error & {
  body?: InstantAdminErrorBody;
  name: 'InstantAdminApiError';
  status: number;
};

function createInstantAdminApiError(
  status: number,
  body?: InstantAdminErrorBody
): InstantAdminApiError {
  const error = new Error(
    body?.message ?? `Instant admin request failed with HTTP ${status}`
  ) as InstantAdminApiError;
  error.body = body;
  error.name = 'InstantAdminApiError';
  error.status = status;
  return error;
}

type InstantAdminConfig = {
  adminToken: string;
  /** Origin only (scheme + host + optional port), e.g. `https://api.instantdb.com`. Validated at load — no pathname, query, or hash. */
  apiUri: string;
  appId: string;
};

function assertInstantAdminApiUriIsOriginOnly(apiUri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(apiUri);
  } catch {
    throw new Error(
      `INSTANT_API_URI must be a valid absolute URL (origin only). Received: ${JSON.stringify(apiUri)}`
    );
  }

  const { pathname, search, hash } = parsed;
  if (pathname !== '/' && pathname !== '') {
    throw new Error(
      `INSTANT_API_URI must be origin-only (no path). Received ${JSON.stringify(apiUri)} with pathname ${JSON.stringify(pathname)}. Use a base like "https://api.example.com". Request paths such as "/admin/query" replace the entire base path when resolved with URL(), which would drop a prefix such as "/v1".`
    );
  }
  if (search !== '') {
    throw new Error(
      `INSTANT_API_URI must not include a query string. Received: ${JSON.stringify(apiUri)}`
    );
  }
  if (hash !== '') {
    throw new Error(
      `INSTANT_API_URI must not include a hash. Received: ${JSON.stringify(apiUri)}`
    );
  }
}

function getInstantAdminConfig(): InstantAdminConfig | null {
  const appId = getInstantAppIdForServer();
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN?.trim();

  if (!appId || !adminToken) return null;

  const apiUri = getInstantApiUriForServer();
  assertInstantAdminApiUriIsOriginOnly(apiUri);

  return {
    adminToken,
    apiUri,
    appId,
  };
}

async function readInstantAdminErrorBody(
  response: Response
): Promise<InstantAdminErrorBody | undefined> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    const parsed = JSON.parse(text) as InstantAdminFetchJson;
    if (parsed && typeof parsed === 'object') {
      return parsed as InstantAdminErrorBody;
    }
  } catch {
    // JSON parse failed; fall through to return raw text as message
  }

  return { message: text };
}

function buildInstantAdminUrl(
  config: InstantAdminConfig,
  path: string
): string {
  const url = new URL(path, config.apiUri);
  url.searchParams.set('app_id', config.appId);
  return url.toString();
}

async function instantAdminFetch<TResult>(
  config: InstantAdminConfig,
  path: string,
  init: RequestInit
): Promise<TResult | undefined> {
  const timeoutController = new AbortController();
  const abortTimer = setTimeout(() => {
    timeoutController.abort(
      new Error('instant_admin_request_timeout_after_30000ms')
    );
  }, 30_000);

  const signal = init.signal ?? timeoutController.signal;

  try {
    const response = await fetch(buildInstantAdminUrl(config, path), {
      ...init,
      headers: {
        Authorization: `Bearer ${config.adminToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
        'app-id': config.appId,
      },
      signal,
    });

    if (!response.ok) {
      throw createInstantAdminApiError(
        response.status,
        await readInstantAdminErrorBody(response)
      );
    }

    if (response.status === 204) {
      return undefined;
    }

    const responseText = await response.text();
    if (!responseText) {
      return undefined;
    }

    return JSON.parse(responseText) as TResult;
  } finally {
    clearTimeout(abortTimer);
  }
}

function createInstantAdminDb(config: InstantAdminConfig): InstantAdminDb {
  return {
    async query<TResult>(query: Record<string, unknown>): Promise<TResult> {
      const result = await instantAdminFetch<TResult>(config, '/admin/query', {
        body: JSON.stringify({
          'inference?': false,
          query,
        }),
        method: 'POST',
      });

      if (result === undefined) {
        throw createInstantAdminApiError(200, {
          message: 'Unexpected empty response from /admin/query',
        });
      }

      return result;
    },

    async signOut(
      params: { email: string } | { id: string } | { refresh_token: string }
    ): Promise<void> {
      await instantAdminFetch<undefined>(config, '/admin/sign_out', {
        body: JSON.stringify(params),
        method: 'POST',
      });
    },

    async transact(
      steps: InstantTransactionStep | InstantTransactionStep[]
    ): Promise<Record<string, unknown>> {
      if (Array.isArray(steps) && steps.length === 0) {
        return {}; // No-op for empty transaction
      }

      const normalizedSteps = Array.isArray(steps[0])
        ? (steps as InstantTransactionStep[])
        : [steps as InstantTransactionStep];

      const result = await instantAdminFetch<Record<string, unknown>>(
        config,
        '/admin/transact',
        {
          body: JSON.stringify({
            steps: normalizedSteps,
            'throw-on-missing-attrs?': false,
          }),
          method: 'POST',
        }
      );

      if (result === undefined) {
        throw createInstantAdminApiError(200, {
          message: 'Unexpected empty response from /admin/transact',
        });
      }

      return result;
    },
  };
}

let cachedDb: InstantAdminDb | null = null;
let cachedKey: string | null = null;

export function createInstantRecordId(): string {
  return crypto.randomUUID();
}

export function createInstantCreateStep(
  entity: string,
  id: string | InstantTransactionLookupRef,
  value: Record<string, unknown>
): InstantTransactionStep {
  return ['create', entity, id, value];
}

export function createInstantLinkStep(
  entity: string,
  id: string | InstantTransactionLookupRef,
  value: Record<string, unknown>
): InstantTransactionStep {
  return ['link', entity, id, value];
}

// eslint-disable-next-line max-params
export function createInstantUpdateStep(
  entity: string,
  id: string | InstantTransactionLookupRef,
  value: Record<string, unknown>,
  opts?: { upsert?: boolean }
): InstantTransactionStep {
  return opts
    ? ['update', entity, id, value, opts]
    : ['update', entity, id, value];
}

export function getInstantAdminDb(): InstantAdminDb | null {
  const config = getInstantAdminConfig();
  if (!config) return null;

  const cacheKey = `${config.apiUri}|${config.appId}|${config.adminToken}`;
  if (!cachedDb || cachedKey !== cacheKey) {
    cachedDb = createInstantAdminDb(config);
    cachedKey = cacheKey;
  }

  return cachedDb;
}
