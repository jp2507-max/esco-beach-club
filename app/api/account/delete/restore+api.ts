import { accountDeletionStatuses } from '@/lib/types';
import {
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import {
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';

type AccountDeletionRequestRecord = {
  id?: string;
  scheduled_for_at?: string;
  status?: string;
};

function isPastScheduledDeletion(
  dateString: string | null | undefined
): boolean {
  if (!dateString) return false;

  const scheduledAt = new Date(dateString);
  if (Number.isNaN(scheduledAt.getTime())) return false;

  return scheduledAt.getTime() <= Date.now();
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

  const queryResult = await adminDb.query<{
    account_deletion_requests?: AccountDeletionRequestRecord[];
  }>({
    account_deletion_requests: {
      $: { where: { auth_user_id: authUser.userId } },
    },
  });
  const currentRequest = queryResult.account_deletion_requests?.[0] as
    | AccountDeletionRequestRecord
    | undefined;

  if (!currentRequest?.id) {
    return jsonResponse({ error: 'not_found' }, 404);
  }

  if (
    currentRequest.status !== accountDeletionStatuses.pending ||
    isPastScheduledDeletion(currentRequest.scheduled_for_at)
  ) {
    return jsonResponse({ error: 'not_restorable' }, 409);
  }

  const restoredAt = new Date().toISOString();

  await adminDb.transact(
    createInstantUpdateStep(
      'account_deletion_requests',
      currentRequest.id,
      {
        restored_at: restoredAt,
        status: accountDeletionStatuses.restored,
        updated_at: restoredAt,
      },
      { upsert: false }
    )
  );

  return jsonResponse(
    {
      ok: true,
      request: {
        id: currentRequest.id,
        restoredAt,
        status: accountDeletionStatuses.restored,
      },
    },
    200
  );
}
