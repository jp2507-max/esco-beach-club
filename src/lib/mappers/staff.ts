import type { RewardTransaction, StaffAccess } from '@/lib/types';

import {
  type InstantRecord,
  toBoolean,
  toForeignKeyId,
  toIsoString,
  toNullableString,
  toNumber,
  toStringOr,
} from './shared';

export function mapStaffAccess(record: InstantRecord): StaffAccess {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active),
    role:
      record.role === 'staff' || record.role === 'manager'
        ? (record.role as StaffAccess['role'])
        : null,
    updated_at: toIsoString(record.updated_at),
    user_id: toForeignKeyId(record, 'user'),
  };
}

export function mapRewardTransaction(record: InstantRecord): RewardTransaction {
  return {
    id: record.id,
    amount_vnd: toNumber(record.amount_vnd),
    cashback_points_delta: toNumber(record.cashback_points_delta),
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    event_type: toStringOr(
      record.event_type
    ) as RewardTransaction['event_type'],
    external_event_id: toStringOr(record.external_event_id),
    member_id: toStringOr(record.member_id),
    member_profile_id: toForeignKeyId(record, 'member'),
    occurred_at: toIsoString(record.occurred_at),
    reference: toNullableString(record.reference),
    source: toStringOr(record.source) as RewardTransaction['source'],
    status: toStringOr(record.status) as RewardTransaction['status'],
    tier_progress_points_delta: toNumber(record.tier_progress_points_delta),
    updated_at: toIsoString(record.updated_at),
  };
}
