import { getInstantAdminDb } from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';

type CompleteBody = {
  referralId?: string;
};

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

function parseBearerRefreshToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
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
  if (!authUser) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let parsed: CompleteBody;
  try {
    parsed = (await request.json()) as CompleteBody;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const referralId =
    typeof parsed.referralId === 'string' ? parsed.referralId.trim() : '';
  if (!referralId) {
    return jsonResponse(
      { error: 'invalid_body', message: 'referralId required' },
      400
    );
  }

  const staffResult = await adminDb.query({
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
    await adminDb.transact([
      adminDb.tx.referrals[referralId].update(
        { status: 'Completed' },
        { upsert: false }
      ),
    ]);
  } catch {
    return jsonResponse({ error: 'not_found' }, 404);
  }

  return jsonResponse({ ok: true }, 200);
}
