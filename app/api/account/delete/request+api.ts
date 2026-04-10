import {
  accountDeletionStatuses,
  type AuthProviderType,
  authProviderTypes,
} from '@/lib/types';
import {
  getAccountDeletionRevocationResponse,
  getAppleRevocationPersistenceFields,
  isAppleDeletionWarningStatus,
} from '@/src/lib/account-deletion/account-deletion-flow';
import { buildAccountDeletionAdminErrorResponse } from '@/src/lib/account-deletion/account-deletion-server-errors';
import { revokeAppleAuthorizationCode } from '@/src/lib/account-deletion/apple-revoke-server';
import {
  isRecord,
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import {
  createInstantCreateStep,
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';
import { addMonitoringBreadcrumb } from '@/src/lib/monitoring';

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

  const recordId = `account-delete-${authUser.userId}`;
  let existingRequest: AccountDeletionRequestRecord | undefined;
  try {
    console.info('[account/delete/request] Checking for existing request', {
      userId: authUser.userId,
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
      context: { recordId, userId: authUser.userId },
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
      userId: authUser.userId,
    });
    const resolvedProfileContext = await resolveProfileContextForUser(
      adminDb,
      authUser.userId
    );
    trustedAuthProvider = resolvedProfileContext.authProvider;
    profileId = resolvedProfileContext.profileId;
  } catch (error) {
    const adminError = buildAccountDeletionAdminErrorResponse({
      context: { recordId, userId: authUser.userId },
      error,
      failureCode: 'admin_query_failed',
      operation: 'resolve_profile_context',
    });
    return jsonResponse(adminError.body, adminError.status);
  }

  if (!trustedAuthProvider) {
    console.warn('[account/delete/request] Could not resolve auth provider', {
      hasAppleAuthorizationCode: Boolean(appleAuthorizationCode),
      userId: authUser.userId,
    });
    return jsonResponse(
      {
        error: 'auth_provider_unresolved',
        message: 'Could not determine auth provider for account deletion',
      },
      409
    );
  }

  if (!profileId) {
    console.warn('[account/delete/request] Could not resolve profile id', {
      userId: authUser.userId,
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
    console.error('[account/delete/request] Apple revocation threw', {
      error,
      userId: authUser.userId,
    });
    revocation = {
      status: 'failed' as const,
      message: error instanceof Error ? error.message : 'unknown_error',
    };
  }

  if (
    requiresAppleRevocation &&
    isAppleDeletionWarningStatus(revocation.status)
  ) {
    addMonitoringBreadcrumb({
      category: 'account-deletion',
      data: {
        revocationMessage:
          'message' in revocation ? revocation.message : revocation.status,
        revocationStatus: revocation.status,
        userId: authUser.userId,
      },
      level: 'warning',
      message: 'account deletion persisted with apple revocation warning',
    });
  }

  const revocationResponse = getAccountDeletionRevocationResponse({
    provider: effectiveAuthProvider,
    revocation,
  });
  const payload = {
    ...(effectiveAuthProvider === authProviderTypes.apple
      ? getAppleRevocationPersistenceFields(revocation)
      : {}),
    auth_provider: effectiveAuthProvider,
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
      profileId,
      recordId,
      userId: authUser.userId,
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
        profileId,
        recordId,
        userId: authUser.userId,
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
