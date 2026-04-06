import { createHmac, timingSafeEqual } from 'node:crypto';

import type { PosBill, Profile, RewardTransaction } from '@/lib/types';
import {
  posBillStatuses,
  rewardTransactionEventTypes,
  rewardTransactionSources,
  rewardTransactionStatuses,
} from '@/lib/types';
import {
  jsonResponse,
  parseBearerRefreshToken,
} from '@/src/lib/api/route-helpers';
import {
  type BillQrPayload,
  buildBillQrSigningPayload,
  calculateCashbackPointsForAmountVnd,
  createTierProgressExpiryAt,
  getRewardTierDefinition,
  normalizeRewardTierKey,
  parseBillQrValue,
  reconcileTierProgressSnapshot,
} from '@/src/lib/loyalty';
import { type InstantRecord, mapProfile } from '@/src/lib/mappers';
import {
  createInstantCreateStep,
  createInstantLinkStep,
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import { verifyInstantRefreshToken } from '@/src/lib/referral/instant-runtime-server';
import type { RewardServiceResponse } from '@/src/lib/reward-backend-contract';
import { buildRewardTransactionId } from '@/src/lib/rewards/reward-transaction-id';

type ProfileRecord = InstantRecord & {
  profile?: InstantRecord | InstantRecord[] | null;
};

type RewardTransactionRecord = {
  external_event_id?: string | null;
  id?: string;
  status?: string | null;
};

type PosBillRecord = InstantRecord & {
  amount_vnd?: unknown;
  canonical_bill_id?: unknown;
  claimed_at?: unknown;
  claimed_by_profile_id?: unknown;
  claimed_reward_transaction_id?: unknown;
  closed_at?: unknown;
  created_at?: unknown;
  currency?: unknown;
  entry_key?: unknown;
  last_synced_at?: unknown;
  paid_at?: unknown;
  pos_bill_id?: unknown;
  receipt_reference?: unknown;
  restaurant_id?: unknown;
  source_updated_at?: unknown;
  status?: unknown;
  terminal_id?: unknown;
  updated_at?: unknown;
};

type ResolvePosBillResult = {
  bill: PosBill | null;
  exists: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstInstantRecord(value: unknown): InstantRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) && typeof first.id === 'string'
      ? (first as InstantRecord)
      : null;
  }

  return isRecord(value) && typeof value.id === 'string'
    ? (value as InstantRecord)
    : null;
}

function firstProfileRecord(value: unknown): ProfileRecord | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) && typeof first.id === 'string'
      ? (first as ProfileRecord)
      : null;
  }

  return isRecord(value) && typeof value.id === 'string'
    ? (value as ProfileRecord)
    : null;
}

async function resolveProfileForUser(
  adminDb: NonNullable<ReturnType<typeof getInstantAdminDb>>,
  userId: string
): Promise<Profile | null> {
  const directResult = await adminDb.query<{
    profiles?: InstantRecord[];
  }>({
    profiles: {
      $: { where: { 'user.id': userId } },
    },
  });
  const directProfile = firstInstantRecord(directResult.profiles);
  if (directProfile) {
    return mapProfile(directProfile);
  }

  const deterministicResult = await adminDb.query<{
    profiles?: InstantRecord[];
  }>({
    profiles: {
      $: { where: { id: userId } },
    },
  });
  const deterministicProfile = firstInstantRecord(deterministicResult.profiles);
  if (deterministicProfile) {
    return mapProfile(deterministicProfile);
  }

  const linkedResult = await adminDb.query<{
    $users?: ProfileRecord[];
  }>({
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  });
  const linkedUser = firstProfileRecord(linkedResult.$users);
  const linkedProfile = firstInstantRecord(linkedUser?.profile ?? null);

  return linkedProfile ? mapProfile(linkedProfile) : null;
}

function buildPosBillEntryKey(params: {
  posBillId: string;
  restaurantId: string;
}): string {
  return `pos-bill:${params.restaurantId}:${params.posBillId}`;
}

function getPosBillQrSecret(): string | null {
  const secret =
    process.env.POS_BILL_QR_SECRET?.trim() ??
    process.env.REWARD_BILL_QR_SECRET?.trim();
  return secret ? secret : null;
}

function isValidBillQrSignature(params: {
  posBillId: string;
  restaurantId: string;
  secret: string;
  signature: string;
  version: BillQrPayload['version'];
}): boolean {
  const signingPayload = buildBillQrSigningPayload({
    posBillId: params.posBillId,
    restaurantId: params.restaurantId,
    version: params.version,
  });

  if (!signingPayload) {
    return false;
  }

  const expectedSignature = createHmac('sha256', params.secret)
    .update(signingPayload)
    .digest('base64url');

  const actualBuffer = Buffer.from(params.signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function toRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toRequiredIsoString(value: unknown): string | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const parsedFromNumber = new Date(value);
    return Number.isNaN(parsedFromNumber.getTime())
      ? null
      : parsedFromNumber.toISOString();
  }

  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!normalized) return null;

  const parsedFromString = new Date(normalized);
  return Number.isNaN(parsedFromString.getTime())
    ? null
    : parsedFromString.toISOString();
}

function toNullableIsoString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return toRequiredIsoString(value);
}

function toRequiredAmountVnd(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function toPosBillStatus(value: unknown): PosBill['status'] {
  if (value === posBillStatuses.open) return posBillStatuses.open;
  if (value === posBillStatuses.paid) return posBillStatuses.paid;
  if (value === posBillStatuses.refunded) return posBillStatuses.refunded;
  if (value === posBillStatuses.voided) return posBillStatuses.voided;

  return null;
}

function mapPosBill(record: PosBillRecord): PosBill | null {
  const id = toRequiredString(record.id);
  const amountVnd = toRequiredAmountVnd(record.amount_vnd);
  const canonicalBillId = toRequiredString(record.canonical_bill_id);
  const createdAt = toRequiredIsoString(record.created_at);
  const currency = toRequiredString(record.currency);
  const entryKey = toRequiredString(record.entry_key);
  const posBillId = toRequiredString(record.pos_bill_id);
  const restaurantId = toRequiredString(record.restaurant_id);
  const updatedAt = toRequiredIsoString(record.updated_at);
  const status = toPosBillStatus(record.status);

  if (
    !id ||
    amountVnd === null ||
    !canonicalBillId ||
    !createdAt ||
    !currency ||
    !entryKey ||
    !posBillId ||
    !restaurantId ||
    !updatedAt ||
    status === null
  ) {
    return null;
  }

  return {
    id,
    amount_vnd: amountVnd,
    canonical_bill_id: canonicalBillId,
    claimed_at: toNullableIsoString(record.claimed_at),
    claimed_by_profile_id: toNullableString(record.claimed_by_profile_id),
    claimed_reward_transaction_id: toNullableString(
      record.claimed_reward_transaction_id
    ),
    closed_at: toNullableIsoString(record.closed_at),
    created_at: createdAt,
    currency,
    entry_key: entryKey,
    last_synced_at: toNullableIsoString(record.last_synced_at),
    paid_at: toNullableIsoString(record.paid_at),
    pos_bill_id: posBillId,
    receipt_reference: toNullableString(record.receipt_reference),
    restaurant_id: restaurantId,
    source_updated_at: toNullableIsoString(record.source_updated_at),
    status,
    terminal_id: toNullableString(record.terminal_id),
    updated_at: updatedAt,
  };
}

async function resolvePosBill(params: {
  adminDb: NonNullable<ReturnType<typeof getInstantAdminDb>>;
  posBillId: string;
  restaurantId: string;
}): Promise<ResolvePosBillResult> {
  const canonicalBillId = buildPosBillEntryKey({
    posBillId: params.posBillId,
    restaurantId: params.restaurantId,
  });

  const result = await params.adminDb.query<{
    pos_bills?: PosBillRecord[];
  }>({
    pos_bills: {
      $: {
        where: {
          canonical_bill_id: canonicalBillId,
        },
      },
    },
  });

  const record = firstInstantRecord(result.pos_bills) as PosBillRecord | null;
  if (!record) {
    return { exists: false, bill: null };
  }

  const bill = mapPosBill(record);
  return { exists: true, bill };
}

function buildUpdatedProfile(
  profile: Profile,
  cashbackPointsDelta: number,
  now: Date
): { nextProfile: Profile; tierProgressPointsDelta: number } {
  const nowIso = now.toISOString();
  const tierKey = normalizeRewardTierKey(profile.lifetime_tier_key);
  const tierDefinition = getRewardTierDefinition(tierKey);
  const activeSnapshot = reconcileTierProgressSnapshot(
    {
      next_tier_key: profile.next_tier_key,
      tier_progress_expires_at: profile.tier_progress_expires_at,
      tier_progress_points: profile.tier_progress_points,
      tier_progress_started_at: profile.tier_progress_started_at,
      tier_progress_target_points: profile.tier_progress_target_points,
    },
    now
  );

  let lifetimeTierKey = tierKey;
  let nextTierKey = activeSnapshot.next_tier_key;
  let tierProgressExpiresAt = activeSnapshot.tier_progress_expires_at;
  let tierProgressPoints = activeSnapshot.tier_progress_points;
  let tierProgressStartedAt = activeSnapshot.tier_progress_started_at;
  let tierProgressTargetPoints = activeSnapshot.tier_progress_target_points;
  let tierProgressPointsDelta = 0;

  if (
    tierDefinition.nextTierKey !== null &&
    tierDefinition.progressTargetPoints > 0
  ) {
    if (tierProgressTargetPoints <= 0) {
      tierProgressTargetPoints = tierDefinition.progressTargetPoints;
    }
    nextTierKey = tierDefinition.nextTierKey;

    if (!tierProgressStartedAt && cashbackPointsDelta > 0) {
      tierProgressStartedAt = nowIso;
      tierProgressExpiresAt = createTierProgressExpiryAt(now);
    }

    if (cashbackPointsDelta > 0) {
      const remainingToUpgrade = Math.max(
        tierDefinition.progressTargetPoints - tierProgressPoints,
        0
      );
      const progressedPoints = tierProgressPoints + cashbackPointsDelta;
      const didUnlockNextTier =
        progressedPoints >= tierDefinition.progressTargetPoints;

      tierProgressPointsDelta = didUnlockNextTier
        ? remainingToUpgrade
        : cashbackPointsDelta;

      if (didUnlockNextTier) {
        lifetimeTierKey = tierDefinition.nextTierKey;
        const upgradedDefinition = getRewardTierDefinition(lifetimeTierKey);

        nextTierKey = upgradedDefinition.nextTierKey;
        tierProgressExpiresAt = null;
        tierProgressPoints = 0;
        tierProgressStartedAt = null;
        tierProgressTargetPoints =
          upgradedDefinition.nextTierKey === null
            ? 0
            : upgradedDefinition.progressTargetPoints;
      } else {
        tierProgressPoints = progressedPoints;
      }
    }
  } else {
    nextTierKey = tierDefinition.nextTierKey;
    tierProgressExpiresAt = null;
    tierProgressPoints = 0;
    tierProgressStartedAt = null;
    tierProgressTargetPoints = 0;
  }

  return {
    nextProfile: {
      ...profile,
      cashback_points_balance:
        profile.cashback_points_balance + cashbackPointsDelta,
      cashback_points_lifetime_earned:
        profile.cashback_points_lifetime_earned + cashbackPointsDelta,
      lifetime_tier_key: lifetimeTierKey,
      next_tier_key: nextTierKey,
      tier_progress_expires_at: tierProgressExpiresAt,
      tier_progress_points: tierProgressPoints,
      tier_progress_started_at: tierProgressStartedAt,
      tier_progress_target_points: tierProgressTargetPoints,
      updated_at: nowIso,
    },
    tierProgressPointsDelta,
  };
}

function toRewardServiceMember(
  profile: Profile
): RewardServiceResponse['member'] {
  return {
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    cashback_points_balance: profile.cashback_points_balance,
    cashback_points_lifetime_earned: profile.cashback_points_lifetime_earned,
    created_at: profile.created_at,
    date_of_birth: profile.date_of_birth,
    full_name: profile.full_name,
    has_seen_welcome_voucher: profile.has_seen_welcome_voucher,
    id: profile.id,
    lifetime_tier_key: normalizeRewardTierKey(profile.lifetime_tier_key),
    location_permission_status: profile.location_permission_status,
    member_id: profile.member_id,
    member_segment: profile.member_segment,
    member_since: profile.member_since,
    next_tier_key: profile.next_tier_key,
    nights_left: profile.nights_left,
    onboarding_completed_at: profile.onboarding_completed_at,
    push_notification_permission_status:
      profile.push_notification_permission_status,
    referral_code: profile.referral_code,
    saved: profile.saved,
    tier_progress_expires_at: profile.tier_progress_expires_at,
    tier_progress_points: profile.tier_progress_points,
    tier_progress_started_at: profile.tier_progress_started_at,
    tier_progress_target_points: profile.tier_progress_target_points,
    updated_at: profile.updated_at,
  };
}

function toRewardServiceTransaction(params: {
  amountVnd: number;
  cashbackPointsDelta: number;
  externalEventId: string;
  memberProfileId: string;
  memberId: string;
  occurredAt: string;
  receiptReference: string | null;
  tierProgressPointsDelta: number;
}): RewardTransaction {
  const id = buildRewardTransactionId(params.externalEventId);

  return {
    id,
    amount_vnd: params.amountVnd,
    cashback_points_delta: params.cashbackPointsDelta,
    created_at: params.occurredAt,
    entry_key: id,
    event_type: rewardTransactionEventTypes.purchase,
    external_event_id: params.externalEventId,
    member_id: params.memberId,
    member_profile_id: params.memberProfileId,
    occurred_at: params.occurredAt,
    reference: params.receiptReference,
    source: rewardTransactionSources.memberBillQr,
    status: rewardTransactionStatuses.posted,
    tier_progress_points_delta: params.tierProgressPointsDelta,
    updated_at: params.occurredAt,
  };
}

function normalizeOccurredAtTimestamp(
  paidAt: string,
  fallbackIso: string
): string {
  const parsedPaidAt = Date.parse(paidAt);
  if (Number.isNaN(parsedPaidAt)) {
    return fallbackIso;
  }

  return new Date(parsedPaidAt).toISOString();
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

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const qrData =
    parsedBody &&
    typeof parsedBody === 'object' &&
    !Array.isArray(parsedBody) &&
    typeof (parsedBody as { qrData?: unknown }).qrData === 'string'
      ? (parsedBody as { qrData: string }).qrData
      : '';

  const billQr = parseBillQrValue(qrData);
  if (!billQr) {
    return jsonResponse({ error: 'invalid_bill_qr' }, 400);
  }

  const billQrSecret = getPosBillQrSecret();
  if (!billQrSecret) {
    return jsonResponse(
      {
        error: 'server_misconfigured',
        message: 'Missing POS bill QR secret',
      },
      503
    );
  }

  if (
    !isValidBillQrSignature({
      posBillId: billQr.posBillId,
      restaurantId: billQr.restaurantId,
      secret: billQrSecret,
      signature: billQr.signature,
      version: billQr.version,
    })
  ) {
    return jsonResponse({ error: 'invalid_bill_qr' }, 400);
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

  const profile = await resolveProfileForUser(adminDb, authUser.userId);
  if (!profile) {
    return jsonResponse({ error: 'member_profile_not_found' }, 404);
  }

  const posBillResult = await resolvePosBill({
    adminDb,
    posBillId: billQr.posBillId,
    restaurantId: billQr.restaurantId,
  });

  if (!posBillResult.exists) {
    return jsonResponse({ error: 'bill_not_synced' }, 409);
  }

  const posBill = posBillResult.bill;
  // exists=true but bill=null: POS row present but mapping/normalization failed (data integrity).
  if (!posBill) {
    return jsonResponse({ error: 'bill_data_corrupt' }, 409);
  }

  if (posBill.currency.trim().toUpperCase() !== 'VND') {
    return jsonResponse({ error: 'unsupported_currency' }, 409);
  }

  if (posBill.status !== posBillStatuses.paid || !posBill.paid_at) {
    return jsonResponse({ error: 'bill_not_paid' }, 409);
  }

  if (posBill.claimed_at || posBill.claimed_reward_transaction_id) {
    return jsonResponse({ error: 'receipt_already_claimed' }, 409);
  }

  const cashbackPointsDelta = calculateCashbackPointsForAmountVnd(
    posBill.amount_vnd
  );
  if (cashbackPointsDelta <= 0) {
    return jsonResponse({ error: 'bill_below_minimum_spend' }, 400);
  }

  const duplicateTransactions = await adminDb.query<{
    reward_transactions?: RewardTransactionRecord[];
  }>({
    reward_transactions: {
      $: {
        where: {
          external_event_id: posBill.entry_key,
        },
      },
    },
  });

  const hasClaimedReceipt = (
    duplicateTransactions.reward_transactions ?? []
  ).some(
    (transaction) =>
      transaction.external_event_id === posBill.entry_key &&
      (transaction.status === rewardTransactionStatuses.pending ||
        transaction.status === rewardTransactionStatuses.posted)
  );

  if (hasClaimedReceipt) {
    return jsonResponse({ error: 'receipt_already_claimed' }, 409);
  }

  const now = new Date();
  const claimedAt = now.toISOString();
  const occurredAt = normalizeOccurredAtTimestamp(posBill.paid_at, claimedAt);
  const { nextProfile, tierProgressPointsDelta } = buildUpdatedProfile(
    profile,
    cashbackPointsDelta,
    now
  );
  const transaction = toRewardServiceTransaction({
    amountVnd: posBill.amount_vnd,
    cashbackPointsDelta,
    externalEventId: posBill.entry_key,
    memberId: profile.member_id,
    memberProfileId: profile.id,
    occurredAt,
    receiptReference: posBill.receipt_reference ?? posBill.pos_bill_id,
    tierProgressPointsDelta,
  });

  try {
    await adminDb.transact([
      createInstantUpdateStep('profiles', profile.id, {
        cashback_points_balance: nextProfile.cashback_points_balance,
        cashback_points_lifetime_earned:
          nextProfile.cashback_points_lifetime_earned,
        lifetime_tier_key: nextProfile.lifetime_tier_key,
        next_tier_key: nextProfile.next_tier_key,
        tier_progress_expires_at: nextProfile.tier_progress_expires_at,
        tier_progress_points: nextProfile.tier_progress_points,
        tier_progress_started_at: nextProfile.tier_progress_started_at,
        tier_progress_target_points: nextProfile.tier_progress_target_points,
        updated_at: nextProfile.updated_at,
      }),
      createInstantUpdateStep('pos_bills', posBill.id, {
        claimed_at: claimedAt,
        claimed_by_profile_id: profile.id,
        claimed_reward_transaction_id: transaction.id,
        updated_at: claimedAt,
      }),
      createInstantCreateStep('reward_transactions', transaction.id, {
        amount_vnd: transaction.amount_vnd,
        cashback_points_delta: transaction.cashback_points_delta,
        created_at: transaction.created_at,
        entry_key: transaction.entry_key,
        event_type: transaction.event_type,
        external_event_id: transaction.external_event_id,
        member_id: transaction.member_id,
        occurred_at: transaction.occurred_at,
        reference: transaction.reference,
        source: transaction.source,
        status: transaction.status,
        tier_progress_points_delta: transaction.tier_progress_points_delta,
        updated_at: transaction.updated_at,
      }),
      createInstantLinkStep('reward_transactions', transaction.id, {
        member: profile.id,
      }),
    ]);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'body' in error &&
      (error as { body?: { type?: string } }).body?.type === 'record-not-unique'
    ) {
      return jsonResponse({ error: 'receipt_already_claimed' }, 409);
    }

    throw error;
  }

  return jsonResponse(
    {
      cashbackPointsDelta,
      member: toRewardServiceMember(nextProfile),
      tierProgressPointsDelta,
      transaction,
    } satisfies RewardServiceResponse,
    200
  );
}
