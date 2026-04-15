import {
  accountDeletionStatuses,
  type AuthProviderType,
  authProviderTypes,
} from '@/lib/types';
import {
  getAccountDeletionRevocationResponse,
  getAppleRevocationPersistenceFields,
} from '@/src/lib/account-deletion/account-deletion-flow';
import { buildAccountDeletionAdminErrorResponse } from '@/src/lib/account-deletion/account-deletion-server-errors';
import { revokeAppleAuthorizationCode } from '@/src/lib/account-deletion/apple-revoke-server';
import {
  isRecord,
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import { sha256HexPrefix } from '@/src/lib/crypto/web-crypto';
import {
  createInstantCreateStep,
  createInstantRecordId,
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';

type AccountDeletionRequestRecord = {
  id?: string;
  requested_at?: string;
  scheduled_for_at?: string;
  status?: string;
};

type LinkedProfileRecord = {
  auth_provider?: unknown;
  id?: string;
};

type ResolvedProfileContext = {
  authProvider: AuthProviderType | null;
  profileId: string | null;
};

function toAuthProvider(value: unknown): AuthProviderType | null {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === authProviderTypes.apple) {
    return authProviderTypes.apple;
  }

  if (normalized === authProviderTypes.google) {
    return authProviderTypes.google;
  }

  if (normalized === authProviderTypes.magicCode) {
    return authProviderTypes.magicCode;
  }

  return null;
}

async function resolveProfileContextForUser(
  adminDb: NonNullable<ReturnType<typeof getInstantAdminDb>>,
  userId: string
): Promise<ResolvedProfileContext> {
  const result = await adminDb.query<{
    profiles?: LinkedProfileRecord[];
  }>({
    profiles: {
      $: { where: { id: userId } },
    },
  });
  const profile = result.profiles?.[0] as LinkedProfileRecord | undefined;

  return {
    authProvider: toAuthProvider(profile?.auth_provider),
    profileId:
      typeof profile?.id === 'string' && profile.id ? profile.id : null,
  };
}

function addGracePeriodDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hashIdentifier(value: string): Promise<string> {
  return sha256HexPrefix(value, 12);
}

function logAccountDeletionBreadcrumb(params: {
  data?: Record<string, unknown>;
  level?: 'error' | 'info' | 'warning';
  message: string;
}): void {
  const level = params.level ?? 'info';
  const payload = {
    ...params.data,
    category: 'account-deletion',
    message: params.message,
  };

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warning') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

function buildAppleRevocationFailureResponse(
  revocation: Awaited<ReturnType<typeof revokeAppleAuthorizationCode>>
): {
  body: {
    error: 'apple_revocation_failed';
    message: string;
  };
  status: number;
} | null {
  if (revocation.status === 'revoked' || revocation.status === 'not_required') {
    return null;
  }

  if (revocation.status === 'missing_authorization_code') {
    return {
      body: {
        error: 'apple_revocation_failed',
        message: revocation.status,
      },
      status: 400,
    };
  }

  if (revocation.status === 'not_configured') {
    return {
      body: {
        error: 'apple_revocation_failed',
        message: revocation.status,
      },
      status: 503,
    };
  }

  return {
    body: {
      error: 'apple_revocation_failed',
      message: revocation.message,
    },
    status: 502,
  };
}

export async function POST(request: Request): Promise<Response> {
  const adminDb = getInstantAdminDb();
  if (!adminDb) {
    return jsonResponse(
      { error: 'server_misconfigured', message: 'Missing admin or app id' },
      503
    );
  }

  const refreshToken = parseBearerRefreshToken(request);
  if (!refreshToken) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const authUser = await verifyInstantRefreshToken(refreshToken);
  if (!authUser.ok) {
    if (authUser.code === 'instant_auth_unreachable') {
      return jsonResponse(
        {
          error: authUser.code,
          message: authUser.message ?? 'Could not reach Instant auth service',
        },
        503
      );
    }

    if (authUser.code === 'missing_app_id') {
      return jsonResponse(
        { error: 'server_misconfigured', message: 'Missing admin or app id' },
        503
      );
    }

    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let parsed: unknown = {};
  try {
    parsed = await request.json();
  } catch {
    parsed = {};
  }

  if (!isRecord(parsed)) {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  const appleAuthorizationCode =
    typeof parsed.appleAuthorizationCode === 'string'
      ? parsed.appleAuthorizationCode.trim()
      : '';

  const recordId = createInstantRecordId();
  const [userRefSuffix, requestRefSuffix] = await Promise.all([
    hashIdentifier(authUser.userId),
    hashIdentifier(recordId),
  ]);
  const userRef = `user:${userRefSuffix}`;
  const requestRef = `request:${requestRefSuffix}`;
  let existingRequest: AccountDeletionRequestRecord | undefined;
  try {
    console.info('[account/delete/request] Checking for existing request', {
      requestRef,
      userRef,
    });
    const existingResult = await adminDb.query<{
      account_deletion_requests?: AccountDeletionRequestRecord[];
    }>({
      account_deletion_requests: {
        $: { where: { auth_user_id: authUser.userId } },
      },
    });
    existingRequest = existingResult.account_deletion_requests?.[0] as
      | AccountDeletionRequestRecord
      | undefined;
  } catch (error) {
    const adminError = buildAccountDeletionAdminErrorResponse({
      context: { requestRef, userRef },
      error,
      failureCode: 'admin_query_failed',
      operation: 'query_existing_deletion_request',
    });
    return jsonResponse(adminError.body, adminError.status);
  }

  if (existingRequest?.status === accountDeletionStatuses.pending) {
    return jsonResponse(
      {
        alreadyScheduled: true,
        request: {
          id: existingRequest.id ?? recordId,
          requestedAt: existingRequest.requested_at ?? '',
          scheduledForAt: existingRequest.scheduled_for_at ?? '',
          status: existingRequest.status ?? accountDeletionStatuses.pending,
        },
      },
      200
    );
  }

  const nowIso = new Date().toISOString();
  const scheduledForAt = addGracePeriodDays(new Date(), 30);
  let trustedAuthProvider: AuthProviderType | null = null;
  let profileId: string | null = null;

  try {
    console.info('[account/delete/request] Resolving profile context', {
      requestRef,
      userRef,
    });
    const resolvedProfileContext = await resolveProfileContextForUser(
      adminDb,
      authUser.userId
    );
    trustedAuthProvider = resolvedProfileContext.authProvider;
    profileId = resolvedProfileContext.profileId;
  } catch (error) {
    const adminError = buildAccountDeletionAdminErrorResponse({
      context: { requestRef, userRef },
      error,
      failureCode: 'admin_query_failed',
      operation: 'resolve_profile_context',
    });
    return jsonResponse(adminError.body, adminError.status);
  }

  if (!trustedAuthProvider) {
    console.warn(
      '[account/delete/request] Could not resolve auth provider; continuing without provider-specific revocation',
      {
        hasAppleAuthorizationCode: Boolean(appleAuthorizationCode),
        requestRef,
        userRef,
      }
    );
    logAccountDeletionBreadcrumb({
      data: {
        hasAppleAuthorizationCode: Boolean(appleAuthorizationCode),
        requestRef,
        userRef,
      },
      level: 'warning',
      message: 'account deletion auth provider unresolved',
    });
  }

  if (!profileId) {
    console.warn('[account/delete/request] Could not resolve profile id', {
      requestRef,
      userRef,
    });
    return jsonResponse(
      {
        error: 'profile_unresolved',
        message: 'Could not determine profile for account deletion',
      },
      409
    );
  }

  const effectiveAuthProvider = trustedAuthProvider;

  // Apple revocation is a server-side prerequisite that can block scheduling.
  // Google revocation is intentionally handled client-side as post-delete,
  // best-effort cleanup through the native Google SDK session context.
  const requiresAppleRevocation =
    effectiveAuthProvider === authProviderTypes.apple;

  let revocation:
    | Awaited<ReturnType<typeof revokeAppleAuthorizationCode>>
    | { status: 'not_required' };
  try {
    revocation = requiresAppleRevocation
      ? await revokeAppleAuthorizationCode(appleAuthorizationCode)
      : { status: 'not_required' as const };
  } catch (error) {
    const serializedError =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : { value: error };
    console.error('[account/delete/request] Apple revocation threw', {
      error: serializedError,
      requestRef,
      userRef,
    });
    revocation = {
      status: 'failed' as const,
      message: 'revocation_failed',
    };
  }

  const safeRevocation =
    revocation.status === 'failed'
      ? {
          status: 'failed' as const,
          message: 'revocation_failed',
        }
      : revocation;

  if (requiresAppleRevocation) {
    const revocationFailureResponse =
      buildAppleRevocationFailureResponse(safeRevocation);
    if (revocationFailureResponse) {
      logAccountDeletionBreadcrumb({
        data: {
          requestRef,
          revocationMessage:
            'message' in revocation ? revocation.message : revocation.status,
          revocationStatus: revocation.status,
          userRef,
        },
        level: 'error',
        message: 'account deletion blocked by apple revocation failure',
      });

      return jsonResponse(
        revocationFailureResponse.body,
        revocationFailureResponse.status
      );
    }
  }

  const revocationResponse = effectiveAuthProvider
    ? getAccountDeletionRevocationResponse({
        provider: effectiveAuthProvider,
        revocation: safeRevocation,
      })
    : undefined;
  const payload = {
    ...(effectiveAuthProvider === authProviderTypes.apple
      ? getAppleRevocationPersistenceFields(safeRevocation)
      : {}),
    ...(effectiveAuthProvider ? { auth_provider: effectiveAuthProvider } : {}),
    auth_user_id: authUser.userId,
    ...(typeof parsed.email === 'string' && parsed.email.trim().length > 0
      ? { email: parsed.email.trim() }
      : {}),
    profile_id: profileId,
    requested_at: nowIso,
    scheduled_for_at: scheduledForAt,
    status: accountDeletionStatuses.pending,
    updated_at: nowIso,
  };

  try {
    console.info('[account/delete/request] Writing deletion request', {
      authProvider: effectiveAuthProvider,
      hasExistingRequest: Boolean(existingRequest?.id),
      hasProfileId: Boolean(profileId),
      requestRef,
      userRef,
    });
    await adminDb.transact(
      existingRequest?.id
        ? createInstantUpdateStep(
            'account_deletion_requests',
            existingRequest.id,
            payload,
            {
              upsert: false,
            }
          )
        : createInstantCreateStep('account_deletion_requests', recordId, {
            created_at: nowIso,
            ...payload,
          })
    );
  } catch (error) {
    const adminError = buildAccountDeletionAdminErrorResponse({
      context: {
        authProvider: effectiveAuthProvider,
        hasExistingRequest: Boolean(existingRequest?.id),
        hasProfileId: Boolean(profileId),
        requestRef,
        userRef,
      },
      error,
      failureCode: 'admin_write_failed',
      operation: 'persist_deletion_request',
    });
    return jsonResponse(adminError.body, adminError.status);
  }

  try {
    await adminDb.signOut({ refresh_token: refreshToken });
  } catch (error) {
    console.error('[account/delete/request] Failed to revoke session', error);
  }

  return jsonResponse(
    {
      request: {
        id: existingRequest?.id ?? recordId,
        requestedAt: nowIso,
        scheduledForAt,
        status: accountDeletionStatuses.pending,
      },
      revocation: revocationResponse,
    },
    existingRequest ? 200 : 201
  );
}
