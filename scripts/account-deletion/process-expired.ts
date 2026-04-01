#!/usr/bin/env bun
/**
 * Finalize expired account deletion requests.
 */

import { init } from '@instantdb/admin';

import schema from '@/instant.schema';

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
  profile_id?: string | null;
  scheduled_for_at?: string | Date | null;
  status?: string;
};

function isDue(record: PendingDeletionRecord, now: Date): boolean {
  if (!record || record.status !== 'pending' || !record.scheduled_for_at) {
    return false;
  }

  const scheduled = new Date(record.scheduled_for_at);
  return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() <= now.getTime();
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

    const profileId = record.profile_id || (await resolveProfileIdForUser(userId));

    console.log(`Processing account deletion for user ${userId}`);

    try {
      await cleanupProfileLinkedData(profileId ?? null);
      await db.auth.deleteUser({ id: userId });
      await db.transact(
        db.tx.account_deletion_requests[requestId].update(
          {
            completed_at: now.toISOString(),
            status: 'completed',
            updated_at: now.toISOString(),
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
