import type {
  PrivateEventInquiry,
  PrivateEventTypeOption,
  TableReservation,
} from '@/lib/types';

import {
  type InstantRecord,
  toBoolean,
  toIsoString,
  toNullableString,
  toNumber,
  toStringOr,
} from './shared';

export function mapPrivateEventType(
  record: InstantRecord
): PrivateEventTypeOption {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    label_key: toStringOr(record.label_key),
    sort_order: toNumber(record.sort_order),
    value: toStringOr(record.value),
  };
}

export function mapTableReservation(record: InstantRecord): TableReservation {
  return {
    id: record.id,
    contact_email: toNullableString(record.contact_email),
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    event_id: toNullableString(record.event_id),
    event_title: toNullableString(record.event_title),
    occasion: toNullableString(record.occasion),
    party_size: toNumber(record.party_size),
    reservation_date: toStringOr(record.reservation_date),
    reservation_time: toStringOr(record.reservation_time),
    special_request: toNullableString(record.special_request),
    source: toStringOr(record.source),
    status: toStringOr(record.status),
    updated_at: toIsoString(record.updated_at),
  };
}

export function mapPrivateEventInquiry(
  record: InstantRecord
): PrivateEventInquiry {
  return {
    id: record.id,
    entry_key: toStringOr(record.entry_key),
    event_type: toStringOr(record.event_type),
    preferred_date: toStringOr(record.preferred_date),
    estimated_pax: toNumber(record.estimated_pax),
    contact_name: toNullableString(record.contact_name),
    contact_email: toNullableString(record.contact_email),
    notes: toNullableString(record.notes),
    created_at: toIsoString(record.created_at),
  };
}
