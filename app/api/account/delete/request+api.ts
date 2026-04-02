import {
  accountDeletionStatuses,
  type AuthProviderType,
  authProviderTypes,
} from '@/lib/types';
import {
  isRecord,
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import { revokeAppleAuthorizationCode } from '@/src/lib/account-deletion/apple-revoke-server';
import { getInstantAdminDb } from '@/src/lib/referral/instant-admin-server';
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

type LinkedUserRecord = {
  id?: string;
  profile?: LinkedProfileRecord | LinkedProfileRecord[] | null;
};

type ResolvedProfileContext = {
  authProvider: AuthProviderType | null;
  profileId: string | null;
};

function firstLinkedProfileRecord(value: unknown): LinkedProfileRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as LinkedProfileRecord) : null;
  }

  return isRecord(value) ? (value as LinkedProfileRecord) : null;
}

function firstLinkedUserRecord(value: unknown): LinkedUserRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as LinkedUserRecord) : null;
  }

  return isRecord(value) ? (value as LinkedUserRecord) : null;
}

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
  const directResult = await adminDb.query({
    profiles: {
      $: { where: { 'user.id': userId } },
    },
  });
  const directProfile = directResult.profiles?.[0] as
    | LinkedProfileRecord
    | undefined;

  if (directProfile) {
    return {
      authProvider: toAuthProvider(directProfile.auth_provider),
      profileId:
        typeof directProfile.id === 'string' && directProfile.id
          ? directProfile.id
          : null,
    };
  }

  const linkedResult = await adminDb.query({
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  });
  const linkedUser = firstLinkedUserRecord(linkedResult.$users);
  const linkedProfile = firstLinkedProfileRecord(linkedUser?.profile ?? null);

  return {
    authProvider: toAuthProvider(linkedProfile?.auth_provider),
    profileId:
      typeof linkedProfile?.id === 'string' && linkedProfile.id
        ? linkedProfile.id
        : null,
  };
}

function addGracePeriodDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getAppleRevocationFailureStatus(
  revocation: Exclude<
    Awaited<ReturnType<typeof revokeAppleAuthorizationCode>>,
    { status: 'not_required' | 'revoked' }
  >
): number {
  if (revocation.status === 'missing_authorization_code') {
    return 400;
  }

  if (revocation.status === 'not_configured') {
    return 503;
  }

  return 502;
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
  const existingResult = await adminDb.query({
    account_deletion_requests: {
      $: { where: { auth_user_id: authUser.userId } },
    },
  });
  const existingRequest = existingResult.account_deletion_requests?.[0] as
    | AccountDeletionRequestRecord
    | undefined;

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
  const { authProvider: trustedAuthProvider, profileId } =
    await resolveProfileContextForUser(adminDb, authUser.userId);

  const requiresAppleRevocation =
    trustedAuthProvider === authProviderTypes.apple;

  const revocation = requiresAppleRevocation
    ? await revokeAppleAuthorizationCode(appleAuthorizationCode)
    : { status: 'not_required' as const };

  if (requiresAppleRevocation && revocation.status !== 'revoked') {
    if (revocation.status === 'not_required') {
      return jsonResponse(
        {
          error: 'apple_revocation_failed',
          message: revocation.status,
        },
        502
      );
    }

    return jsonResponse(
      {
        error: 'apple_revocation_failed',
        message:
          'message' in revocation ? revocation.message : revocation.status,
      },
      getAppleRevocationFailureStatus(revocation)
    );
  }

  const payload = {
    ...(trustedAuthProvider === authProviderTypes.apple &&
    revocation.status !== 'not_required'
      ? { apple_revocation_status: revocation.status }
      : {}),
    ...(trustedAuthProvider ? { auth_provider: trustedAuthProvider } : {}),
    auth_user_id: authUser.userId,
    ...(typeof parsed.email === 'string' && parsed.email.trim().length > 0
      ? { email: parsed.email.trim() }
      : {}),
    ...(profileId ? { profile_id: profileId } : {}),
    requested_at: nowIso,
    scheduled_for_at: scheduledForAt,
    status: accountDeletionStatuses.pending,
    updated_at: nowIso,
  };

  await adminDb.transact(
    existingRequest?.id
      ? adminDb.tx.account_deletion_requests[existingRequest.id].update(
          payload,
          {
            upsert: false,
          }
        )
      : adminDb.tx.account_deletion_requests[recordId].create({
          created_at: nowIso,
          ...payload,
        })
  );

  if (typeof adminDb.auth?.signOut === 'function') {
    try {
      await adminDb.auth.signOut({ refresh_token: refreshToken });
    } catch (error) {
      console.error('[account/delete/request] Failed to revoke session', error);
    }
  }

  return jsonResponse(
    {
      request: {
        id: existingRequest?.id ?? recordId,
        requestedAt: nowIso,
        scheduledForAt,
        status: accountDeletionStatuses.pending,
      },
      revocation:
        revocation.status === 'not_required'
          ? undefined
          : {
              ...(revocation.status === 'failed'
                ? { message: revocation.message }
                : {}),
              status: revocation.status,
            },
    },
    existingRequest ? 200 : 201
  );
}
