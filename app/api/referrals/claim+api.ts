import {
  isRecord,
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import {
  createInstantCreateStep,
  createInstantLinkStep,
  createInstantRecordId,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';
import { normalizeReferralCode } from '@/src/lib/referral/referral-code';

type ProfileRecord = {
  avatar_url?: string | null;
  full_name?: string;
  id?: string;
};

type LinkedUserRecord = {
  id?: string;
  profile?: ProfileRecord | ProfileRecord[] | null;
};

function firstProfileRecord(value: unknown): ProfileRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as ProfileRecord) : null;
  }

  return isRecord(value) ? (value as ProfileRecord) : null;
}

function firstLinkedUserRecord(value: unknown): LinkedUserRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as LinkedUserRecord) : null;
  }

  return isRecord(value) ? (value as LinkedUserRecord) : null;
}

async function resolveProfileForUser(
  adminDb: NonNullable<ReturnType<typeof getInstantAdminDb>>,
  userId: string
): Promise<ProfileRecord | null> {
  const directResult = await adminDb.query<{
    profiles?: ProfileRecord[];
  }>({
    profiles: {
      $: { where: { 'user.id': userId } },
    },
  });
  const directProfile = firstProfileRecord(directResult.profiles);
  if (directProfile?.id) {
    return directProfile;
  }

  const linkedResult = await adminDb.query<{
    $users?: LinkedUserRecord[];
  }>({
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  });
  const linkedUser = firstLinkedUserRecord(linkedResult.$users);
  const linkedProfile = firstProfileRecord(linkedUser?.profile ?? null);

  return linkedProfile?.id ? linkedProfile : null;
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

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!isRecord(parsed)) {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  const referralCodeRaw =
    typeof parsed.referralCode === 'string' ? parsed.referralCode : '';

  const referralCode = normalizeReferralCode(referralCodeRaw);
  if (!referralCode) {
    return jsonResponse(
      {
        error: 'invalid_body',
        message: 'referralCode required',
      },
      400
    );
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

  const refereeUserId = authUser.userId;
  const refereeProfile = await resolveProfileForUser(adminDb, refereeUserId);
  if (!refereeProfile?.id) {
    return jsonResponse({ error: 'referee_profile_not_found' }, 409);
  }
  const refereeProfileId = refereeProfile.id;

  const referrerResult = await adminDb.query<{
    profiles?: { id?: string; referral_code?: string }[];
  }>({
    profiles: {
      $: { where: { referral_code: referralCode } },
    },
  });

  const referrerProfiles = referrerResult.profiles ?? [];
  const referrerProfile = referrerProfiles[0] as
    | { id?: string; referral_code?: string }
    | undefined;

  if (!referrerProfile?.id) {
    return jsonResponse({ error: 'referrer_not_found' }, 404);
  }

  const referrerProfileId = referrerProfile.id;

  if (referrerProfileId === refereeProfileId) {
    return jsonResponse({ error: 'self_referral' }, 400);
  }

  const existingForReferee = await adminDb.query<{
    referrals?: Record<string, unknown>[];
  }>({
    referrals: {
      $: { where: { referee_profile_id: refereeProfileId } },
    },
  });

  const existingRows = existingForReferee.referrals ?? [];
  if (existingRows.length > 0) {
    return jsonResponse({ ok: true, alreadyClaimed: true }, 200);
  }

  const referredName =
    typeof refereeProfile?.full_name === 'string' &&
    refereeProfile.full_name.trim().length > 0
      ? refereeProfile.full_name.trim()
      : '';
  const referredAvatar =
    typeof refereeProfile?.avatar_url === 'string'
      ? refereeProfile.avatar_url
      : null;

  const newReferralId = createInstantRecordId();

  try {
    await adminDb.transact([
      createInstantCreateStep('referrals', newReferralId, {
        created_at: new Date().toISOString(),
        referred_name: referredName,
        referred_avatar: referredAvatar,
        referee_profile_id: refereeProfileId,
        status: 'Completed',
        referrer_id: referrerProfileId,
      }),
      createInstantLinkStep('referrals', newReferralId, {
        referrer: referrerProfileId,
      }),
    ]);
  } catch (error) {
    // 1. Surgical check for InstantDB unique constraint violation
    if (
      typeof error === 'object' &&
      error !== null &&
      'body' in error &&
      (error as { body: { type?: string } }).body?.type === 'record-not-unique'
    ) {
      return jsonResponse({ ok: true, alreadyClaimed: true }, 200);
    }

    // 2. Fallback: Re-query for race conditions or variant error shapes
    const raceCheck = await adminDb.query<{
      referrals?: Record<string, unknown>[];
    }>({
      referrals: {
        $: { where: { referee_profile_id: refereeProfileId } },
      },
    });

    if ((raceCheck.referrals ?? []).length > 0) {
      return jsonResponse({ ok: true, alreadyClaimed: true }, 200);
    }

    // 3. Surface other unexpected errors
    throw error;
  }

  return jsonResponse({ ok: true, referralId: newReferralId }, 201);
}
