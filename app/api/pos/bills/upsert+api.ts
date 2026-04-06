import { createHmac, timingSafeEqual } from 'node:crypto';

import { jsonResponse } from '@/src/lib/api/route-helpers';
import type { InstantRecord } from '@/src/lib/mappers';
import {
  createInstantUpdateStep,
  getInstantAdminDb,
} from '@/src/lib/referral/instant-admin-server';
import {
  type PosBillSyncItem,
  posBillSyncRequestSchema,
  type PosBillSyncResponse,
} from '@/src/lib/reward-backend-contract';

const POS_SYNC_TIMESTAMP_MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * Admin HTTP transact steps do not expose compare-and-swap on `source_updated_at`.
 * Queue upserts per `canonical_bill_id` so concurrent handlers on this process
 * cannot interleave read-then-write for the same bill. (Multiple server
 * instances would still need a distributed lock or DB-native CAS if required.)
 */
const posBillUpsertChainByCanonicalId = new Map<string, Promise<unknown>>();

function runSerializedPosBillUpsert<T>(
  canonicalBillId: string,
  fn: () => Promise<T>
): Promise<T> {
  const prior =
    posBillUpsertChainByCanonicalId.get(canonicalBillId) ?? Promise.resolve();
  const current = prior.then(fn);
  posBillUpsertChainByCanonicalId.set(
    canonicalBillId,
    current.then(
      () => undefined,
      () => undefined
    )
  );
  return current;
}

type PosBillRecord = InstantRecord & {
  canonical_bill_id?: unknown;
  created_at?: unknown;
  id: string;
  source_updated_at?: unknown;
};

function getPosSyncSharedSecret(): string | null {
  const secret = process.env.POS_SYNC_SHARED_SECRET?.trim();
  return secret ? secret : null;
}

function buildPosBillEntryKey(params: {
  posBillId: string;
  restaurantId: string;
}): string {
  const normalizedRestaurantId = params.restaurantId.trim().toUpperCase();
  return `pos-bill:${normalizedRestaurantId}:${params.posBillId}`;
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function toIsoDateString(value: unknown): string | null {
  const timestamp = parseTimestampMs(value);
  if (timestamp === null) return null;

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isIncomingBillStale(
  existingBill: PosBillRecord | null,
  incomingBill: PosBillSyncItem
): boolean {
  const existingUpdatedAtMs = parseTimestampMs(existingBill?.source_updated_at);
  const incomingUpdatedAtMs = parseTimestampMs(incomingBill.sourceUpdatedAt);

  if (existingUpdatedAtMs === null || incomingUpdatedAtMs === null) {
    return false;
  }

  return incomingUpdatedAtMs < existingUpdatedAtMs;
}

function selectLatestBills(bills: PosBillSyncItem[]): PosBillSyncItem[] {
  const latestBills = new Map<string, PosBillSyncItem>();

  for (const bill of bills) {
    const entryKey = buildPosBillEntryKey({
      posBillId: bill.posBillId,
      restaurantId: bill.restaurantId,
    });
    const currentBill = latestBills.get(entryKey);

    if (!currentBill) {
      latestBills.set(entryKey, bill);
      continue;
    }

    const currentUpdatedAtMs = parseTimestampMs(currentBill.sourceUpdatedAt);
    const nextUpdatedAtMs = parseTimestampMs(bill.sourceUpdatedAt);

    if (currentUpdatedAtMs === null || nextUpdatedAtMs === null) {
      latestBills.set(entryKey, bill);
      continue;
    }

    if (nextUpdatedAtMs >= currentUpdatedAtMs) {
      latestBills.set(entryKey, bill);
    }
  }

  return [...latestBills.values()];
}

function verifyPosSyncSignature(params: {
  rawBody: string;
  secret: string;
  signature: string;
  timestamp: string;
}): boolean {
  const parsedTimestamp = Number.parseInt(params.timestamp, 10);
  if (!Number.isFinite(parsedTimestamp)) return false;

  if (Math.abs(Date.now() - parsedTimestamp) > POS_SYNC_TIMESTAMP_MAX_SKEW_MS) {
    return false;
  }

  const expectedSignature = createHmac('sha256', params.secret)
    .update(`${params.timestamp}.${params.rawBody}`)
    .digest('base64url');

  const actualBuffer = Buffer.from(params.signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function toPosBillRecord(params: {
  bill: PosBillSyncItem;
  existingBill: PosBillRecord | null;
  nowIso: string;
}): Record<string, unknown> {
  const { bill, existingBill, nowIso } = params;
  const entryKey = buildPosBillEntryKey({
    posBillId: bill.posBillId,
    restaurantId: bill.restaurantId,
  });
  const createdAt =
    toIsoDateString(existingBill?.created_at) ?? bill.sourceUpdatedAt;

  return {
    amount_vnd: bill.amountVnd,
    canonical_bill_id: entryKey,
    closed_at: bill.closedAt ?? null,
    created_at: createdAt,
    currency: bill.currency,
    entry_key: entryKey,
    last_synced_at: nowIso,
    paid_at: bill.paidAt ?? null,
    pos_bill_id: bill.posBillId,
    receipt_reference: bill.receiptReference ?? null,
    restaurant_id: bill.restaurantId.trim().toUpperCase(),
    source_updated_at: bill.sourceUpdatedAt,
    status: bill.status,
    terminal_id: bill.terminalId ?? null,
    updated_at: nowIso,
  };
}

export async function POST(request: Request): Promise<Response> {
  const adminDb = getInstantAdminDb();
  if (!adminDb) {
    return jsonResponse(
      { error: 'server_misconfigured', message: 'Missing admin or app id' },
      503
    );
  }

  const sharedSecret = getPosSyncSharedSecret();
  if (!sharedSecret) {
    return jsonResponse(
      {
        error: 'server_misconfigured',
        message: 'Missing POS sync shared secret',
      },
      503
    );
  }

  const signature = request.headers.get('x-esco-signature')?.trim() ?? '';
  const timestamp = request.headers.get('x-esco-timestamp')?.trim() ?? '';
  if (!signature || !timestamp) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (
    !verifyPosSyncSignature({
      rawBody,
      secret: sharedSecret,
      signature,
      timestamp,
    })
  ) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const parsedRequest = posBillSyncRequestSchema.safeParse(parsedBody);
  if (!parsedRequest.success) {
    return jsonResponse(
      {
        error: 'invalid_payload',
        issues: parsedRequest.error.issues,
      },
      400
    );
  }

  const latestBills = selectLatestBills(parsedRequest.data.bills);
  const nowIso = new Date().toISOString();

  const upsertedCounts = await Promise.all(
    latestBills.map((bill) => {
      const entryKey = buildPosBillEntryKey({
        posBillId: bill.posBillId,
        restaurantId: bill.restaurantId,
      });

      return runSerializedPosBillUpsert(entryKey, async () => {
        const freshResult = await adminDb.query<{
          pos_bills?: PosBillRecord[];
        }>({
          pos_bills: {
            $: {
              where: {
                canonical_bill_id: entryKey,
              },
            },
          },
        });

        const rows = freshResult.pos_bills ?? [];
        const existingBill =
          rows.find((r) => r.canonical_bill_id === entryKey) ?? rows[0] ?? null;

        if (isIncomingBillStale(existingBill, bill)) {
          return 0;
        }

        await adminDb.transact([
          createInstantUpdateStep(
            'pos_bills',
            entryKey,
            toPosBillRecord({ bill, existingBill, nowIso }),
            { upsert: true }
          ),
        ]);

        return 1;
      });
    })
  );

  const upserted = upsertedCounts.reduce((a, b) => a + b, 0);

  return jsonResponse(
    {
      processed: parsedRequest.data.bills.length,
      upserted,
    } satisfies PosBillSyncResponse,
    200
  );
}
