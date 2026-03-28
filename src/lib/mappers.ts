import type {
  BookingOccasionOption,
  BookingTimeSlotOption,
  Event,
  LoyaltyTransaction,
  MemberOffer,
  MenuCategoryContent,
  MenuItemContent,
  NewsItem,
  OnboardingPermissionStatus,
  Partner,
  PartnerRedemption,
  PrivateEventTypeOption,
  Profile,
  Referral,
  SavedEvent,
  StaffAccess,
  TableReservation,
} from '@/lib/types';
import { onboardingPermissionStatuses } from '@/lib/types';

export type InstantRecord = {
  id: string;
  [key: string]: unknown;
};

export function toNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toStringOr(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function toBoolean(value: unknown, fallback: boolean = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function toIsoString(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  if (typeof value !== 'string') return '';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function toNullableIsoString(value: unknown): string | null {
  const isoValue = toIsoString(value);
  return isoValue || null;
}

export function toForeignKeyId(record: InstantRecord, key: string): string | null {
  const nested = record[key];
  if (
    typeof nested === 'object' &&
    nested !== null &&
    'id' in nested &&
    typeof (nested as { id: unknown }).id === 'string'
  ) {
    return (nested as { id: string }).id;
  }
  return null;
}

export function toTier(value: unknown): Profile['tier'] {
  const str = String(value);
  if (str === 'VIP' || str === 'OWNER' || str === 'STANDARD')
    return str as Profile['tier'];
  return 'STANDARD';
}

export function toReferralStatus(value: unknown): Referral['status'] {
  const str = String(value);
  return str === 'Completed' ? 'Completed' : 'Pending';
}

export function toOnboardingPermissionStatus(
  value: unknown
): OnboardingPermissionStatus {
  const normalized =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

export function mapProfile(record: InstantRecord): Profile {
  return {
    id: record.id,
    full_name: toStringOr(record.full_name),
    date_of_birth: toNullableString(record.date_of_birth),
    bio: toStringOr(record.bio),
    tier: toTier(record.tier),
    member_id: toStringOr(record.member_id),
    member_since: toIsoString(record.member_since),
    nights_left: toNumber(record.nights_left),
    points: toNumber(record.points),
    max_points: toNumber(record.max_points),
    earned: toNumber(record.earned),
    saved: toNumber(record.saved),
    avatar_url: toNullableString(record.avatar_url),
    is_danang_citizen:
      typeof record.is_danang_citizen === 'boolean'
        ? record.is_danang_citizen
        : null,
    location_permission_status: toOnboardingPermissionStatus(
      record.location_permission_status
    ),
    push_notification_permission_status: toOnboardingPermissionStatus(
      record.push_notification_permission_status
    ),
    onboarding_completed_at: toNullableIsoString(
      record.onboarding_completed_at
    ),
    referral_code: toStringOr(record.referral_code),
    has_seen_welcome_voucher: toBoolean(record.has_seen_welcome_voucher),
    created_at: toIsoString(record.created_at),
    updated_at: toIsoString(record.updated_at),
  };
}

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

export function mapLoyaltyTransaction(
  record: InstantRecord
): LoyaltyTransaction {
  return {
    id: record.id,
    approved_by_staff_access_id: toForeignKeyId(record, 'approved_by'),
    bill_amount_vnd: toNumber(record.bill_amount_vnd),
    created_at: toIsoString(record.created_at),
    currency: toStringOr(record.currency),
    entry_key: toStringOr(record.entry_key),
    manager_pin_label: toNullableString(record.manager_pin_label),
    member_id: toStringOr(record.member_id),
    member_profile_id: toForeignKeyId(record, 'member'),
    points_awarded: toNumber(record.points_awarded),
    points_rate_per_100k_vnd: toNumber(record.points_rate_per_100k_vnd),
    receipt_reference: toNullableString(record.receipt_reference),
    source: toStringOr(record.source),
    staff_access_id: toForeignKeyId(record, 'staff_access'),
    status: toStringOr(record.status),
    updated_at: toIsoString(record.updated_at),
  };
}

export function mapEvent(record: InstantRecord): Event {
  return {
    id: record.id,
    title: toStringOr(record.title),
    description: toNullableString(record.description),
    time: toStringOr(record.time),
    date: toStringOr(record.date),
    day_label: toNullableString(record.day_label),
    location: toStringOr(record.location),
    image: toStringOr(record.image),
    attendees: toNumber(record.attendees),
    price: toStringOr(record.price),
    badge: toNullableString(record.badge),
    badge_color: toNullableString(record.badge_color),
    featured: toBoolean(record.featured),
    category: toNullableString(record.category),
    vip_price: toNullableString(record.vip_price),
    member_price: toNullableString(record.member_price),
    guest_price: toNullableString(record.guest_price),
    created_at: toIsoString(record.created_at),
  };
}

export function mapNewsItem(record: InstantRecord): NewsItem {
  return {
    id: record.id,
    title: toStringOr(record.title),
    subtitle: toStringOr(record.subtitle),
    image: toStringOr(record.image),
    time_label: toStringOr(record.time_label),
    created_at: toIsoString(record.created_at),
  };
}

export function mapBookingOccasion(
  record: InstantRecord
): BookingOccasionOption {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    label_key: toStringOr(record.label_key),
    sort_order: toNumber(record.sort_order),
    value: toStringOr(record.value),
  };
}

export function mapBookingTimeSlot(
  record: InstantRecord
): BookingTimeSlotOption {
  return {
    id: record.id,
    available: toBoolean(record.available, true),
    created_at: toIsoString(record.created_at),
    sort_order: toNumber(record.sort_order),
    time: toStringOr(record.time),
  };
}

export function mapMemberOffer(record: InstantRecord): MemberOffer {
  return {
    id: record.id,
    badge_key: toStringOr(record.badge_key),
    code: toNullableString(record.code),
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    kind: toStringOr(record.kind),
    sort_order: toNumber(record.sort_order),
    subtitle_key: toStringOr(record.subtitle_key),
    terms_key: toNullableString(record.terms_key),
    title_key: toStringOr(record.title_key),
  };
}

export function mapMenuCategory(record: InstantRecord): MenuCategoryContent {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    is_active: toBoolean(record.is_active, true),
    key: toStringOr(record.key),
    label_key: toStringOr(record.label_key),
    sort_order: toNumber(record.sort_order),
  };
}

export function mapMenuItem(record: InstantRecord): MenuItemContent {
  return {
    id: record.id,
    category_key: toStringOr(record.category_key),
    created_at: toIsoString(record.created_at),
    description_key: toStringOr(record.description_key),
    image: toStringOr(record.image),
    is_active: toBoolean(record.is_active, true),
    name_key: toStringOr(record.name_key),
    price: toStringOr(record.price),
    sort_order: toNumber(record.sort_order),
    tag_key: toNullableString(record.tag_key),
  };
}

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

export function mapPartner(record: InstantRecord): Partner {
  return {
    id: record.id,
    name: toStringOr(record.name),
    category: toStringOr(record.category),
    discount_percentage: toNumber(record.discount_percentage),
    discount_label: toStringOr(record.discount_label),
    description: toStringOr(record.description),
    image: toStringOr(record.image),
    code: toStringOr(record.code),
    created_at: toIsoString(record.created_at),
  };
}

export function mapReferral(record: InstantRecord): Referral {
  return {
    id: record.id,
    referrer_id: toStringOr(record.referrer_id),
    referred_name: toStringOr(record.referred_name),
    referred_avatar: toNullableString(record.referred_avatar),
    status: toReferralStatus(record.status),
    created_at: toIsoString(record.created_at),
  };
}

export function mapSavedEvent(record: InstantRecord): SavedEvent {
  return {
    id: record.id,
    event_id: toStringOr(record.event_id),
    entry_key: toStringOr(record.entry_key),
    created_at: toIsoString(record.created_at),
  };
}

export function mapTableReservation(record: InstantRecord): TableReservation {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    event_id: toNullableString(record.event_id),
    event_title: toNullableString(record.event_title),
    occasion: toNullableString(record.occasion),
    party_size: toNumber(record.party_size),
    reservation_date: toStringOr(record.reservation_date),
    reservation_time: toStringOr(record.reservation_time),
    source: toStringOr(record.source),
    status: toStringOr(record.status),
    updated_at: toIsoString(record.updated_at),
  };
}

export function mapPartnerRedemption(record: InstantRecord): PartnerRedemption {
  return {
    id: record.id,
    created_at: toIsoString(record.created_at),
    entry_key: toStringOr(record.entry_key),
    partner_code: toNullableString(record.partner_code),
    partner_id: toStringOr(record.partner_id),
    redemption_method: toStringOr(record.redemption_method),
    status: toStringOr(record.status),
  };
}
