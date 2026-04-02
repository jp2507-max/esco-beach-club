#!/usr/bin/env bun
/**
 * Finalize expired account deletion requests.
 *
 * Requires `processing_lock_id` on `account_deletion_requests` in instant.schema.ts
 * to be pushed (`npx instant-cli@latest push schema`) before running in production.
 */

import { init } from '@instantdb/admin';

import schema from '@/instant.schema';
import { accountDeletionStatuses } from '@/lib/types';

const appId =
  process.env.INSTANT_APP_ID?.trim() ||
  process.env.EXPO_PUBLIC_INSTANT_APP_ID?.trim();
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN?.trim();

if (!appId || !adminToken) {
  console.error(
    'Missing INSTANT_APP_ADMIN_TOKEN and/or INSTANT_APP_ID / EXPO_PUBLIC_INSTANT_APP_ID'
  );
  process.exit(1);
}

const db = init({
  adminToken,
  appId,
  schema,
  useDateObjects: true,
});

type PendingDeletionRecord = {
  auth_user_id?: string;
  id: string;
  processing_lock_id?: string | null;
  profile_id?: string | null;
  scheduled_for_at?: string | Date | null;
  status?: string;
  updated_at?: string | Date | null;
};

function toComparableIso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isDue(record: PendingDeletionRecord, now: Date): boolean {
  if (!record || record.status !== 'pending' || !record.scheduled_for_at) {
    return false;
  }

  const scheduled = new Date(record.scheduled_for_at);
  return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() <= now.getTime();
}

function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'body' in error &&
    (error as { body?: { type?: string } }).body?.type === 'record-not-found'
  );
}

async function fetchDeletionRequestById(
  requestId: string
): Promise<PendingDeletionRecord | null> {
  const result = await db.query({
    account_deletion_requests: {
      $: { where: { id: requestId } },
    },
  });
  const row = result.account_deletion_requests?.[0] as PendingDeletionRecord | undefined;
  return row ?? null;
}

/**
 * Claims a pending due request for this runner. InstantDB has no conditional update in the
 * client; we combine list-snapshot updated_at matching, status=processing, and a unique
 * processing_lock_id, then re-read to detect losing races.
 */
async function tryClaimDeletionRequest(params: {
  listSnapshotUpdatedAt: string | Date | null | undefined;
  now: Date;
  requestId: string;
}): Promise<{ lockId: string } | null> {
  const fresh = await fetchDeletionRequestById(params.requestId);
  if (!fresh) {
    return null;
  }

  const snapshotIso = toComparableIso(params.listSnapshotUpdatedAt);
  const liveIso = toComparableIso(fresh.updated_at);
  if (snapshotIso !== liveIso) {
    console.log(
      `Skipping ${params.requestId}: updated_at no longer matches listing snapshot (concurrent update).`
    );
    return null;
  }

  if (!isDue(fresh, params.now)) {
    return null;
  }

  const lockId = crypto.randomUUID();
  const claimAt = params.now.toISOString();

  try {
    await db.transact(
      db.tx.account_deletion_requests[params.requestId].update(
        {
          processing_lock_id: lockId,
          status: accountDeletionStatuses.processing,
          updated_at: claimAt,
        },
        { upsert: false }
      )
    );
  } catch (error) {
    if (isRecordNotFound(error)) {
      return null;
    }
    throw error;
  }

  const after = await fetchDeletionRequestById(params.requestId);
  if (
    after?.status !== accountDeletionStatuses.processing ||
    after.processing_lock_id !== lockId
  ) {
    console.log(`Skipping ${params.requestId}: claim verification failed (another runner won).`);
    return null;
  }

  return { lockId };
}

async function verifyDeletionLockHeld(requestId: string, lockId: string): Promise<boolean> {
  const row = await fetchDeletionRequestById(requestId);
  return (
    row?.status === accountDeletionStatuses.processing && row.processing_lock_id === lockId
  );
}

async function resolveProfileIdForUser(userId: string): Promise<string | null> {
  const directResult = await db.query({
    profiles: {
      $: { where: { 'user.id': userId } },
    },
  });
  const directProfile = directResult.profiles?.[0] as { id?: string } | undefined;
  if (directProfile?.id) {
    return directProfile.id;
  }

  const linkedResult = await db.query({
    $users: {
      $: { where: { id: userId } },
      profile: {},
    },
  });
  const linkedUser = linkedResult.$users?.[0] as
    | {
        profile?: { id?: string } | { id?: string }[] | null;
      }
    | undefined;
  const linkedProfile = Array.isArray(linkedUser?.profile)
    ? linkedUser.profile[0]
    : linkedUser?.profile;

  return linkedProfile?.id ?? null;
}

async function cleanupProfileLinkedData(profileId: string | null): Promise<void> {
  if (!profileId) return;

  const [rewardTransactionsResult, referralsByReferrerResult, referralsByRefereeResult] =
    await Promise.all([
      db.query({
        reward_transactions: {
          $: { where: { 'member.id': profileId } },
        },
      }),
      db.query({
        referrals: {
          $: { where: { 'referrer.id': profileId } },
        },
      }),
      db.query({
        referrals: {
          $: { where: { referee_profile_id: profileId } },
        },
      }),
    ]);

  const tx = [
    ...(rewardTransactionsResult.reward_transactions ?? []).map((record) =>
      db.tx.reward_transactions[record.id].delete()
    ),
    ...(referralsByReferrerResult.referrals ?? []).map((record) =>
      db.tx.referrals[record.id].delete()
    ),
    ...(referralsByRefereeResult.referrals ?? []).map((record) =>
      db.tx.referrals[record.id].delete()
    ),
  ];

  if (tx.length > 0) {
    await db.transact(tx);
  }
}

async function main(): Promise<void> {
  const now = new Date();
  const result = await db.query({
    account_deletion_requests: {
      $: {
        where: { status: 'pending' },
      },
    },
  });

  const dueRequests = (result.account_deletion_requests ?? []).filter((record) =>
    isDue(record as PendingDeletionRecord, now)
  ) as PendingDeletionRecord[];

  if (dueRequests.length === 0) {
    console.log('No expired account deletion requests to process.');
    return;
  }

  for (const record of dueRequests) {
    const userId = record.auth_user_id;
    const requestId = record.id;
    if (!userId || !requestId) {
      console.error('Skipping malformed account deletion request:', record);
      continue;
    }

    const claimed = await tryClaimDeletionRequest({
      listSnapshotUpdatedAt: record.updated_at,
      now,
      requestId,
    });
    if (!claimed) {
      continue;
    }

    const profileId = record.profile_id || (await resolveProfileIdForUser(userId));

    console.log(`Processing account deletion for user ${userId}`);

    try {
      if (!(await verifyDeletionLockHeld(requestId, claimed.lockId))) {
        console.log(`Skipping ${requestId}: lock not held before profile cleanup.`);
        continue;
      }

      await cleanupProfileLinkedData(profileId ?? null);

      if (!(await verifyDeletionLockHeld(requestId, claimed.lockId))) {
        console.log(`Skipping ${requestId}: lock not held before auth delete.`);
        continue;
      }

      await db.auth.deleteUser({ id: userId });

      const doneAt = new Date().toISOString();
      await db.transact(
        db.tx.account_deletion_requests[requestId].update(
          {
            completed_at: doneAt,
            processing_lock_id: null,
            status: accountDeletionStatuses.completed,
            updated_at: doneAt,
          },
          { upsert: false }
        )
      );
    } catch (error) {
      console.error(
        `Failed to finalize account deletion for user ${userId}:`,
        error
      );
    }
  }
}

void main().catch((error) => {
  console.error('Account deletion finalizer failed:', error);
  process.exit(1);
});
