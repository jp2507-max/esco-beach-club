import { id } from '@instantdb/react-native';

import type { PrivateEventInquiry, TableReservation } from '@/lib/types';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapPrivateEventInquiry,
  mapTableReservation,
} from '@/src/lib/mappers';

import { nowIso } from './shared';

function normalizedOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export async function submitTableReservation(params: {
  user_id: string;
  event_id?: string;
  event_title?: string;
  occasion: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  source: string;
}): Promise<TableReservation> {
  if (params.party_size < 1 || !Number.isInteger(params.party_size)) {
    throw new Error('Party size must be a positive integer');
  }
  const createdAt = nowIso();
  const reservationId = id();
  const entryKey = [
    params.user_id,
    params.event_id ?? 'general',
    params.reservation_date,
    params.reservation_time,
    params.party_size,
  ].join(':');

  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    occasion: params.occasion,
    party_size: params.party_size,
    reservation_date: params.reservation_date,
    reservation_time: params.reservation_time,
    source: params.source,
    status: 'pending',
    updated_at: createdAt,
    ...(params.event_id ? { event_id: params.event_id } : {}),
    ...(params.event_title ? { event_title: params.event_title } : {}),
  };

  const tx = db.tx.table_reservations[reservationId]
    .create(payload)
    .link({ owner: params.user_id });

  try {
    await db.transact(
      params.event_id ? tx.link({ event: params.event_id }) : tx
    );

    return {
      id: reservationId,
      created_at: createdAt,
      entry_key: entryKey,
      event_id: params.event_id ?? null,
      event_title: params.event_title ?? null,
      occasion: params.occasion,
      party_size: params.party_size,
      reservation_date: params.reservation_date,
      reservation_time: params.reservation_time,
      source: params.source,
      status: 'pending',
      updated_at: createdAt,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error as Error & { type?: string }).type === 'record-not-unique'
    ) {
      const { data } = await db.queryOnce({
        table_reservations: {
          $: {
            where: { entry_key: entryKey },
          },
        },
      });

      const existing = data.table_reservations[0] as InstantRecord | undefined;
      if (existing) {
        return mapTableReservation(existing);
      }
    }

    throw error;
  }
}

export async function submitPrivateEventInquiry(params: {
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}): Promise<PrivateEventInquiry> {
  if (params.estimated_pax < 1 || !Number.isInteger(params.estimated_pax)) {
    throw new Error('Estimated pax must be a positive integer');
  }
  const contactEmail = normalizedOptionalString(params.contact_email);
  const contactName = normalizedOptionalString(params.contact_name);
  const notes = normalizedOptionalString(params.notes);

  const createdAt = nowIso();
  const inquiryId = id();
  const entryKey = [
    params.user_id,
    params.event_type,
    params.preferred_date,
    contactEmail ?? 'no-email',
  ].join(':');

  const createPayload = {
    created_at: createdAt,
    entry_key: entryKey,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    preferred_date: params.preferred_date,
    ...(contactEmail !== undefined ? { contact_email: contactEmail } : {}),
    ...(contactName !== undefined ? { contact_name: contactName } : {}),
    ...(notes !== undefined ? { notes } : {}),
  };

  const tx = db.tx.private_event_inquiries[inquiryId]
    .create(createPayload)
    .link({ owner: params.user_id });

  try {
    await db.transact(tx);

    return {
      id: inquiryId,
      entry_key: entryKey,
      contact_email: contactEmail ?? null,
      contact_name: contactName ?? null,
      created_at: createdAt,
      estimated_pax: params.estimated_pax,
      event_type: params.event_type,
      notes: notes ?? null,
      preferred_date: params.preferred_date,
    };
  } catch (error) {
    if (error instanceof Error) {
      if ((error as Error & { type?: string }).type === 'record-not-unique') {
        const { data } = await db.queryOnce({
          private_event_inquiries: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.private_event_inquiries[0] as
          | InstantRecord
          | undefined;
        if (existing) {
          return mapPrivateEventInquiry(existing);
        }
      }
    }

    throw error;
  }
}
