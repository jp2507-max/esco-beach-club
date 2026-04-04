import {
  type RewardTransaction,
  type RewardTransactionEventType,
  rewardTransactionEventTypes,
  type RewardTransactionSource,
  rewardTransactionSources,
  type RewardTransactionStatus,
  rewardTransactionStatuses,
} from '@/lib/types';

import {
  type InstantRecord,
  toForeignKeyId,
  toIsoString,
  toNullableString,
  toNumber,
  toStringOr,
} from './shared';

export function mapRewardTransaction(record: InstantRecord): RewardTransaction {
  return {
    id: record.id,
    amount_vnd: toNumber(record.amount_vnd),
    cashback_points_delta: toNumber(record.cashback_points_delta),
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    event_type: (() => {
      const v = toStringOr(record.event_type);
      if (
        !Object.values(rewardTransactionEventTypes).includes(
          v as RewardTransactionEventType
        )
      ) {
        throw new Error(`Invalid RewardTransaction event_type: ${v}`);
      }
      return v as RewardTransactionEventType;
    })(),
    external_event_id: toStringOr(record.external_event_id),
    member_id: toStringOr(record.member_id),
    member_profile_id: toForeignKeyId(record, 'member'),
    occurred_at: toIsoString(record.occurred_at),
    reference: toNullableString(record.reference),
    source: (() => {
      const v = toStringOr(record.source);
      if (
        !Object.values(rewardTransactionSources).includes(
          v as RewardTransactionSource
        )
      ) {
        throw new Error(`Invalid RewardTransaction source: ${v}`);
      }
      return v as RewardTransactionSource;
    })(),
    status: (() => {
      const v = toStringOr(record.status);
      if (
        !Object.values(rewardTransactionStatuses).includes(
          v as RewardTransactionStatus
        )
      ) {
        throw new Error(`Invalid RewardTransaction status: ${v}`);
      }
      return v as RewardTransactionStatus;
    })(),
    tier_progress_points_delta: toNumber(record.tier_progress_points_delta),
    updated_at: toIsoString(record.updated_at),
  };
}
