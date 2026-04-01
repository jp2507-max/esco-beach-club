import type { Profile, RewardTransaction, StaffAccess } from '@/lib/types';
import {
  rewardTransactionEventTypes,
  rewardTransactionSources,
} from '@/lib/types';
import { db } from '@/src/lib/instant';
import { type InstantRecord, mapStaffAccess } from '@/src/lib/mappers';

import { getRewardServiceEndpoint, parseRewardServiceResponse } from './shared';

export async function fetchStaffAccess(
  userId: string
): Promise<StaffAccess | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    staff_access: {
      $: {
        where: { 'user.id': userId },
      },
      user: {},
    },
  });

  const staffAccess = data.staff_access[0] as InstantRecord | undefined;
  if (!staffAccess) return null;

  const mapped = mapStaffAccess(staffAccess);
  return { ...mapped, user_id: mapped.user_id ?? userId };
}

export async function submitRewardAdjustment(params: {
  billAmountVnd: number;
  memberId: string;
  receiptReference?: string;
  staffUserId: string;
}): Promise<{
  cashbackPointsDelta: number;
  member: Profile;
  tierProgressPointsDelta: number;
  transaction: RewardTransaction;
}> {
  const memberId = params.memberId.trim();
  const staffUserId = params.staffUserId.trim();
  const billAmountVnd = Math.trunc(params.billAmountVnd);
  const receiptReference = params.receiptReference?.trim() ?? '';

  if (!memberId) {
    throw new Error('memberNotFound');
  }

  if (!staffUserId) {
    throw new Error('staffUserIdRequired');
  }

  if (!Number.isFinite(billAmountVnd) || billAmountVnd <= 0) {
    throw new Error('invalidBillAmount');
  }

  if (!receiptReference) {
    throw new Error('receiptReferenceRequired');
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    response = await fetch(getRewardServiceEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        billAmountVnd,
        eventType: rewardTransactionEventTypes.manualAdjustment,
        memberId,
        receiptReference,
        source: rewardTransactionSources.manualStaffEntry,
        staffUserId: params.staffUserId,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('rewardServiceUnavailable');
    }
    throw new Error('rewardServiceUnavailable');
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
    ) {
      throw new Error(payload.error);
    }

    throw new Error('rewardServiceRejectedRequest');
  }

  const parsedPayload = parseRewardServiceResponse(payload);
  if (!parsedPayload) {
    throw new Error('invalidRewardServiceResponse');
  }

  return parsedPayload;
}
