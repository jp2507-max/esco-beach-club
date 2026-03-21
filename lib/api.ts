import { id } from '@instantdb/react-native';

import { db } from '@/src/lib/instant';
import {
  calculatePointsForAmountVnd,
  isManagerRole,
  isStaffRole,
  loyaltyConfig,
  loyaltyTransactionSources,
  loyaltyTransactionStatuses,
} from '@/src/lib/loyalty';
import {
  type InstantRecord,
  mapEvent,
  mapLoyaltyTransaction,
  mapNewsItem,
  mapPartner,
  mapProfile,
  mapReferral,
  mapSavedEvent,
  mapStaffAccess,
  mapTableReservation,
} from '@/src/lib/mappers';

import type {
  Event,
  LoyaltyTransaction,
  NewsItem,
  Partner,
  PartnerRedemption,
  Profile,
  Referral,
  SavedEvent,
  StaffAccess,
  TableReservation,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeMemberSince(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  const isValidDate = !Number.isNaN(parsed.getTime());

  if (trimmed.includes('T') || isValidDate) {
    return parsed.toISOString();
  }

  const dateOnly = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly.toISOString();
  }

  return undefined;
}

function buildProfileId(userId: string): string {
  return `profile-${userId}`;
}

function buildMemberId(userId: string): string {
  return `ESCO-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function buildReferralCode(): string {
  return `ESCO-${id().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function createProfileDefaults(
  userId: string,
  email?: string
): {
  bio: string;
  created_at: string;
  earned: number;
  full_name: string;
  has_seen_welcome_voucher: boolean;
  max_points: number;
  member_id: string;
  member_since: string;
  nights_left: number;
  points: number;
  referral_code: string;
  saved: number;
  tier: 'STANDARD';
  updated_at: string;
} {
  const createdAt = nowIso();
  const emailPrefix = email?.split('@')[0]?.trim() ?? '';
  const displayName = emailPrefix
    ? emailPrefix
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  return {
    bio: '',
    created_at: createdAt,
    earned: 0,
    full_name: displayName,
    has_seen_welcome_voucher: false,
    max_points: 5000,
    member_id: buildMemberId(userId),
    member_since: createdAt,
    nights_left: 0,
    points: 0,
    referral_code: buildReferralCode(),
    saved: 0,
    tier: 'STANDARD',
    updated_at: createdAt,
  };
}

function withoutUndefined<T extends Record<string, unknown>>(
  value: T
): Partial<T> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

export async function ensureProfile(params: {
  userId: string;
  email?: string;
}): Promise<Profile | null> {
  if (!params.userId) return null;

  const current = await fetchProfile(params.userId);
  if (current) return current;

  const profileId = buildProfileId(params.userId);
  const payload = createProfileDefaults(params.userId, params.email);

  try {
    await db.transact(
      db.tx.profiles[profileId].create(payload).link({ user: params.userId })
    );
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        return fetchProfile(params.userId);
      }
    }

    throw error;
  }

  return fetchProfile(params.userId);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { 'user.id': userId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  return profile ? mapProfile(profile) : null;
}

export async function fetchProfileByMemberId(
  memberId: string
): Promise<Profile | null> {
  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) return null;

  const { data } = await db.queryOnce({
    profiles: {
      $: {
        where: { member_id: trimmedMemberId },
      },
    },
  });

  const profile = data.profiles[0] as InstantRecord | undefined;
  return profile ? mapProfile(profile) : null;
}

export async function fetchStaffAccess(
  userId: string
): Promise<StaffAccess | null> {
  if (!userId) return null;

  const { data } = await db.queryOnce({
    staff_access: {
      $: {
        where: { 'user.id': userId },
      },
    },
  });

  const staffAccess = data.staff_access[0] as InstantRecord | undefined;
  return staffAccess ? mapStaffAccess(staffAccess) : null;
}

async function fetchActiveManagerByPin(
  managerPin: string
): Promise<StaffAccess | null> {
  const normalizedPin = managerPin.trim();
  if (!normalizedPin) return null;

  const { data } = await db.queryOnce({
    staff_access: {
      $: {
        where: {
          approval_pin: normalizedPin,
          is_active: true,
          role: 'manager',
        },
      },
    },
  });

  const managerRecord = data.staff_access[0] as InstantRecord | undefined;
  return managerRecord ? mapStaffAccess(managerRecord) : null;
}

function buildManagerPinLabel(staffAccess: StaffAccess): string {
  return staffAccess.user_id
    ? `mgr-${staffAccess.user_id.slice(0, 8)}`
    : `mgr-${staffAccess.id.slice(0, 6)}`;
}

export async function awardLoyaltyTransaction(params: {
  billAmountVnd: number;
  managerPin?: string;
  memberId: string;
  receiptReference?: string;
  staffUserId: string;
}): Promise<{
  member: Profile;
  pointsAwarded: number;
  transaction: LoyaltyTransaction;
}> {
  const memberId = params.memberId.trim();
  const billAmountVnd = Math.trunc(params.billAmountVnd);
  const receiptReference = params.receiptReference?.trim() ?? '';

  if (!memberId) {
    throw new Error('memberNotFound');
  }

  if (!Number.isFinite(billAmountVnd) || billAmountVnd <= 0) {
    throw new Error('invalidBillAmount');
  }

  const pointsAwarded = calculatePointsForAmountVnd(billAmountVnd);
  if (pointsAwarded <= 0) {
    throw new Error('billBelowMinimumSpend');
  }

  const [member, staffAccess] = await Promise.all([
    fetchProfileByMemberId(memberId),
    fetchStaffAccess(params.staffUserId),
  ]);

  if (!member) {
    throw new Error('memberNotFound');
  }

  if (
    !staffAccess ||
    !staffAccess.is_active ||
    !isStaffRole(staffAccess.role)
  ) {
    throw new Error('staffAccessRequired');
  }

  const requiresManagerApproval = billAmountVnd > loyaltyConfig.approvalCapVnd;
  const normalizedManagerPin = params.managerPin?.trim() ?? '';
  const approvingManager = requiresManagerApproval
    ? await fetchActiveManagerByPin(normalizedManagerPin)
    : null;

  if (
    requiresManagerApproval &&
    (!approvingManager ||
      !approvingManager.is_active ||
      !isManagerRole(approvingManager.role))
  ) {
    throw new Error('managerApprovalRequired');
  }

  const createdAt = nowIso();
  const transactionId = id();
  const entryKey = id();
  const nextPoints = member.points + pointsAwarded;
  const nextEarned = member.earned + pointsAwarded;

  const createTransaction = db.tx.loyalty_transactions[transactionId]
    .create({
      bill_amount_vnd: billAmountVnd,
      created_at: createdAt,
      currency: loyaltyConfig.currency,
      entry_key: entryKey,
      ...(approvingManager
        ? { manager_pin_label: buildManagerPinLabel(approvingManager) }
        : {}),
      member_id: member.member_id,
      points_awarded: pointsAwarded,
      points_rate_per_100k_vnd: loyaltyConfig.pointsAwardedPerStep,
      ...(receiptReference ? { receipt_reference: receiptReference } : {}),
      source: loyaltyTransactionSources.manualStaffEntry,
      status: loyaltyTransactionStatuses.posted,
      updated_at: createdAt,
    })
    .link({
      member: member.id,
      ...(approvingManager ? { approved_by: approvingManager.id } : {}),
      staff_access: staffAccess.id,
    });

  const updateMemberTotals = db.tx.profiles[member.id].update({
    earned: nextEarned,
    points: nextPoints,
    updated_at: createdAt,
  });

  await db.transact([createTransaction, updateMemberTotals]);

  const { data } = await db.queryOnce({
    loyalty_transactions: {
      $: {
        where: { id: transactionId },
      },
    },
  });

  const createdTransaction = data.loyalty_transactions[0] as
    | InstantRecord
    | undefined;

  return {
    member: {
      ...member,
      earned: nextEarned,
      points: nextPoints,
      updated_at: createdAt,
    },
    pointsAwarded,
    transaction: createdTransaction
      ? mapLoyaltyTransaction(createdTransaction)
      : {
          id: transactionId,
          approved_by_staff_access_id: approvingManager?.id ?? null,
          bill_amount_vnd: billAmountVnd,
          created_at: createdAt,
          currency: loyaltyConfig.currency,
          entry_key: entryKey,
          manager_pin_label: approvingManager
            ? buildManagerPinLabel(approvingManager)
            : null,
          member_id: member.member_id,
          member_profile_id: member.id,
          points_awarded: pointsAwarded,
          points_rate_per_100k_vnd: loyaltyConfig.pointsAwardedPerStep,
          receipt_reference: receiptReference || null,
          source: loyaltyTransactionSources.manualStaffEntry,
          staff_access_id: staffAccess.id,
          status: loyaltyTransactionStatuses.posted,
          updated_at: createdAt,
        },
  };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  if (!userId) return null;

  const current = await ensureProfile({ userId });
  if (!current) return null;

  const sanitizedUpdates = withoutUndefined({
    avatar_url: updates.avatar_url,
    bio: updates.bio,
    full_name: updates.full_name,
    has_seen_welcome_voucher: updates.has_seen_welcome_voucher,
    member_since: normalizeMemberSince(updates.member_since),
    nights_left: updates.nights_left,
  }) as Partial<
    Pick<
      Profile,
      | 'avatar_url'
      | 'bio'
      | 'full_name'
      | 'has_seen_welcome_voucher'
      | 'member_since'
      | 'nights_left'
    >
  >;

  if (Object.keys(sanitizedUpdates).length === 0) {
    return current;
  }

  await db.transact(
    db.tx.profiles[current.id].update({
      ...sanitizedUpdates,
    })
  );

  return {
    ...current,
    ...sanitizedUpdates,
    id: current.id,
  };
}

export async function fetchEvents(): Promise<Event[]> {
  const { data } = await db.queryOnce({ events: {} });
  return (data.events as InstantRecord[]).map(mapEvent);
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data } = await db.queryOnce({
    events: {
      $: {
        where: { id },
      },
    },
  });

  const event = data.events[0] as InstantRecord | undefined;
  return event ? mapEvent(event) : null;
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
  const { data } = await db.queryOnce({ news_items: {} });
  return (data.news_items as InstantRecord[]).map(mapNewsItem);
}

export async function fetchPartners(): Promise<Partner[]> {
  const { data } = await db.queryOnce({ partners: {} });
  return (data.partners as InstantRecord[]).map(mapPartner);
}

export async function fetchPartnerById(id: string): Promise<Partner | null> {
  const { data } = await db.queryOnce({
    partners: {
      $: {
        where: { id },
      },
    },
  });

  const partner = data.partners[0] as InstantRecord | undefined;
  return partner ? mapPartner(partner) : null;
}

export async function fetchReferrals(userId: string): Promise<Referral[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    referrals: {
      $: {
        where: { 'referrer.user.id': userId },
      },
    },
  });

  return (data.referrals as InstantRecord[]).map(mapReferral);
}

export async function fetchSavedEvents(userId: string): Promise<SavedEvent[]> {
  if (!userId) return [];

  const { data } = await db.queryOnce({
    saved_events: {
      $: {
        where: { 'owner.id': userId },
      },
    },
  });

  return (data.saved_events as InstantRecord[]).map(mapSavedEvent);
}

export async function saveEvent(
  userId: string,
  eventId: string
): Promise<SavedEvent> {
  const createdAt = nowIso();
  const savedEventId = id();
  const entryKey = `${userId}:${eventId}`;

  await db.transact(
    db.tx.saved_events[savedEventId]
      .create({
        created_at: createdAt,
        entry_key: entryKey,
        event_id: eventId,
      })
      .link({ event: eventId, owner: userId })
  );

  return {
    id: savedEventId,
    created_at: createdAt,
    entry_key: entryKey,
    event_id: eventId,
  };
}

export async function removeSavedEvent(savedEventId: string): Promise<void> {
  await db.transact(db.tx.saved_events[savedEventId].delete());
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
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isConflict =
        message.includes('unique') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (isConflict) {
        const { data } = await db.queryOnce({
          table_reservations: {
            $: {
              where: { entry_key: entryKey },
            },
          },
        });

        const existing = data.table_reservations[0] as
          | InstantRecord
          | undefined;
        if (existing) {
          return mapTableReservation(existing);
        }
      }
    }

    throw error;
  }
}

export async function claimPartnerRedemption(params: {
  user_id: string;
  partner_id: string;
  partner_code?: string | null;
  redemption_method: string;
}): Promise<PartnerRedemption> {
  const existing = await db.queryOnce({
    partner_redemptions: {
      $: {
        where: {
          entry_key: `${params.user_id}:${params.partner_id}:${params.redemption_method}`,
        },
      },
    },
  });

  const current = existing.data.partner_redemptions[0] as
    | InstantRecord
    | undefined;
  if (current) {
    return {
      id: current.id,
      created_at:
        typeof current.created_at === 'string' ? current.created_at : nowIso(),
      entry_key:
        typeof current.entry_key === 'string'
          ? current.entry_key
          : `${params.user_id}:${params.partner_id}:${params.redemption_method}`,
      partner_code:
        typeof current.partner_code === 'string' ? current.partner_code : null,
      partner_id:
        typeof current.partner_id === 'string'
          ? current.partner_id
          : params.partner_id,
      redemption_method:
        typeof current.redemption_method === 'string'
          ? current.redemption_method
          : params.redemption_method,
      status: typeof current.status === 'string' ? current.status : 'claimed',
    };
  }

  const createdAt = nowIso();
  const redemptionId = id();
  const entryKey = `${params.user_id}:${params.partner_id}:${params.redemption_method}`;
  const payload = {
    created_at: createdAt,
    entry_key: entryKey,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
    ...(params.partner_code ? { partner_code: params.partner_code } : {}),
  };

  await db.transact(
    db.tx.partner_redemptions[redemptionId]
      .create(payload)
      .link({ owner: params.user_id, partner: params.partner_id })
  );

  return {
    id: redemptionId,
    created_at: createdAt,
    entry_key: entryKey,
    partner_code: params.partner_code ?? null,
    partner_id: params.partner_id,
    redemption_method: params.redemption_method,
    status: 'claimed',
  };
}

export async function submitReview(
  userId: string,
  rating: number,
  comment: string | null
): Promise<{
  comment: string | null;
  created_at: string;
  id: string;
  rating: number;
}> {
  const createdAt = nowIso();
  const reviewId = id();

  await db.transact(
    db.tx.reviews[reviewId]
      .create({
        comment,
        created_at: createdAt,
        rating,
      })
      .link({ owner: userId })
  );

  return {
    comment,
    created_at: createdAt,
    id: reviewId,
    rating,
  };
}

export async function submitPrivateEventInquiry(params: {
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}): Promise<{
  contact_email?: string;
  contact_name?: string;
  created_at: string;
  estimated_pax: number;
  event_type: string;
  id: string;
  notes?: string;
  preferred_date: string;
}> {
  const createdAt = nowIso();
  const inquiryId = id();
  const payload = {
    contact_email: params.contact_email,
    contact_name: params.contact_name,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    notes: params.notes,
    preferred_date: params.preferred_date,
  };

  const createPayload = {
    created_at: createdAt,
    estimated_pax: params.estimated_pax,
    event_type: params.event_type,
    preferred_date: params.preferred_date,
    ...(params.contact_email !== undefined
      ? { contact_email: params.contact_email }
      : {}),
    ...(params.contact_name !== undefined
      ? { contact_name: params.contact_name }
      : {}),
    ...(params.notes !== undefined ? { notes: params.notes } : {}),
  };

  await db.transact(
    db.tx.private_event_inquiries[inquiryId]
      .create(createPayload)
      .link({ owner: params.user_id })
  );

  return {
    ...payload,
    created_at: createdAt,
    id: inquiryId,
  };
}
