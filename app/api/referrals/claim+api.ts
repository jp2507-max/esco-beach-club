import { id } from '@instantdb/admin';

import { getInstantAdminDb } from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';
import { normalizeReferralCode } from '@/src/lib/referral/referral-code';

type ClaimBody = {
  referralCode?: string;
  refreshToken?: string;
};

type ProfileRecord = {
  avatar_url?: string | null;
  full_name?: string;
  id?: string;
};

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstProfileRecord(value: unknown): ProfileRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as ProfileRecord) : null;
  }

  return isRecord(value) ? (value as ProfileRecord) : null;
}

async function resolveProfileForUser(
  adminDb: NonNullable<ReturnType<typeof getInstantAdminDb>>,
  userId: string
): Promise<ProfileRecord | null> {
  const directResult = await adminDb.query({
    profiles: {
      $: { where: { 'user.id': userId } },
    },
  });
  const directProfile = firstProfileRecord(directResult.profiles);
  if (directProfile?.id) {
    return directProfile;
  }

  const linkedResult = await adminDb.query({
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  });
  const linkedUser = firstProfileRecord(linkedResult.$users);
  const linkedProfile = firstProfileRecord(
    isRecord(linkedUser) ? linkedUser.profile : null
  );

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

  let parsed: ClaimBody;
  try {
    parsed = (await request.json()) as ClaimBody;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const refreshToken =
    typeof parsed.refreshToken === 'string' ? parsed.refreshToken.trim() : '';
  const referralCodeRaw =
    typeof parsed.referralCode === 'string' ? parsed.referralCode : '';

  const referralCode = normalizeReferralCode(referralCodeRaw);
  if (!refreshToken || !referralCode) {
    return jsonResponse(
      {
        error: 'invalid_body',
        message: 'refreshToken and referralCode required',
      },
      400
    );
  }

  const authUser = await verifyInstantRefreshToken(refreshToken);
  if (!authUser) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const refereeUserId = authUser.userId;
  const refereeProfile = await resolveProfileForUser(adminDb, refereeUserId);
  if (!refereeProfile?.id) {
    return jsonResponse({ error: 'referee_profile_not_found' }, 409);
  }
  const refereeProfileId = refereeProfile.id;

  const referrerResult = await adminDb.query({
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

  const existingForReferee = await adminDb.query({
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
      : 'Member';
  const referredAvatar =
    typeof refereeProfile?.avatar_url === 'string'
      ? refereeProfile.avatar_url
      : null;

  const newReferralId = id();

  await adminDb.transact([
    adminDb.tx.referrals[newReferralId]
      .create({
        created_at: new Date(),
        referred_name: referredName,
        referred_avatar: referredAvatar,
        referee_profile_id: refereeProfileId,
        status: 'Pending',
        referrer_id: referrerProfileId,
      })
      .link({ referrer: referrerProfileId }),
  ]);

  return jsonResponse({ ok: true, referralId: newReferralId }, 201);
}
