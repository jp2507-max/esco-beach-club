import type {
  AccountDeletionRequest,
  AccountDeletionStatus,
  AuthProviderType,
} from '@/lib/types';
import {
  accountDeletionStatuses,
  authProviderTypes,
} from '@/lib/types';

import {
  type InstantRecord,
  toIsoString,
  toNullableIsoString,
  toNullableString,
  toStringOr,
} from './shared';

function toAccountDeletionStatus(value: unknown): AccountDeletionStatus {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === accountDeletionStatuses.completed) {
    return accountDeletionStatuses.completed;
  }

  if (normalized === accountDeletionStatuses.restored) {
    return accountDeletionStatuses.restored;
  }

  return accountDeletionStatuses.pending;
}

function toAuthProvider(value: unknown): AuthProviderType | null {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (normalized === authProviderTypes.apple) {
    return authProviderTypes.apple;
  }

  if (normalized === authProviderTypes.google) {
    return authProviderTypes.google;
  }

  if (normalized === authProviderTypes.magicCode) {
    return authProviderTypes.magicCode;
  }

  return null;
}

export function mapAccountDeletionRequest(
  record: InstantRecord
): AccountDeletionRequest {
  return {
    id: record.id,
    apple_revocation_error: toNullableString(record.apple_revocation_error),
    apple_revocation_status: toNullableString(record.apple_revocation_status),
    auth_provider: toAuthProvider(record.auth_provider),
    auth_user_id: toStringOr(record.auth_user_id),
    completed_at: toNullableIsoString(record.completed_at),
    created_at: toIsoString(record.created_at),
    email: toNullableString(record.email),
    profile_id: toNullableString(record.profile_id),
    requested_at: toIsoString(record.requested_at),
    restored_at: toNullableIsoString(record.restored_at),
    scheduled_for_at: toIsoString(record.scheduled_for_at),
    status: toAccountDeletionStatus(record.status),
    updated_at: toIsoString(record.updated_at),
  };
}
