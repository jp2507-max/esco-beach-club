import {
  isRecord,
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import {
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';

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

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!isRecord(parsed)) {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  const referralId =
    typeof parsed.referralId === 'string' ? parsed.referralId.trim() : '';
  if (!referralId) {
    return jsonResponse(
      { error: 'invalid_body', message: 'referralId required' },
      400
    );
  }

  const staffResult = await adminDb.query<{
    staff_access?: { is_active?: boolean; role?: string }[];
  }>({
    staff_access: {
      $: { where: { 'user.id': authUser.userId } },
    },
  });

  const staffRows = staffResult.staff_access ?? [];
  const staff = staffRows[0] as
    | { is_active?: boolean; role?: string }
    | undefined;

  const isActiveStaff =
    staff?.is_active === true &&
    (staff.role === 'staff' || staff.role === 'manager');

  if (!isActiveStaff) {
    return jsonResponse({ error: 'forbidden' }, 403);
  }

  try {
    await adminDb.transact(
      createInstantUpdateStep(
        'referrals',
        referralId,
        { status: 'Completed' },
        { upsert: false }
      )
    );
  } catch (err) {
    console.error(
      `[referrals/complete] Transaction failed for referralId: ${referralId}`,
      err
    );

    const isNotFound =
      typeof err === 'object' &&
      err !== null &&
      'body' in err &&
      (err as { body?: { type?: string } }).body?.type === 'record-not-found';

    if (isNotFound) {
      return jsonResponse({ error: 'not_found' }, 404);
    }

    return jsonResponse({ error: 'internal_server_error' }, 500);
  }

  return jsonResponse({ ok: true }, 200);
}
