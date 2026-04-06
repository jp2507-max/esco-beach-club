// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react-native';

const rules = {
  attrs: {
    allow: {
      create: 'false',
    },
  },
  booking_occasions: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  booking_time_slots: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  account_deletion_requests: {
    allow: {
      view: 'auth.id != null && auth.id == data.auth_user_id',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  partners: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  partner_redemptions: {
    bind: {
      hasClaimedStatusOnly: "data.status == 'claimed'",
      onlySafePartnerRedemptionFields:
        "request.modifiedFields.all(field, field in ['created_at', 'entry_key', 'partner_code', 'partner_id', 'redemption_method', 'status'])",
    },
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && onlySafePartnerRedemptionFields && hasClaimedStatusOnly",
      delete: 'false',
      update: 'false',
    },
  },
  pos_bills: {
    allow: {
      view: 'false',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  reviews: {
    bind: {
      hasValidRating: 'data.rating >= 1 && data.rating <= 5',
      onlySafeReviewFields:
        "request.modifiedFields.all(field, field in ['comment', 'created_at', 'rating'])",
    },
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && onlySafeReviewFields && hasValidRating",
      delete: 'false',
      update: 'false',
    },
  },
  $users: {
    allow: {
      view: 'auth.id == data.id',
      create:
        'auth.id == data.id && data.display_name != null && data.display_name.size() >= 2 && data.display_name.size() <= 60',
      delete: 'false',
      update: 'false',
    },
  },
  $files: {
    bind: {
      isOwnerPath:
        "auth.id != null && data.path.startsWith('profile-photos/' + auth.id + '/')",
    },
    allow: {
      view: 'isOwnerPath',
      create: 'isOwnerPath',
      update: 'isOwnerPath',
      delete: 'isOwnerPath',
    },
  },
  profiles: {
    bind: {
      isLinkedProfile:
        "auth.id != null && data.id in auth.ref('$user.profile.id')",
      isOwner:
        "auth.id != null && (auth.id == data.id || auth.id in data.ref('user.id'))",
      isOwnerOrLinkedProfile: 'isOwner || isLinkedProfile',
      canSetAuthProviderOnce:
        "!('auth_provider' in request.modifiedFields) || (data.auth_provider == null && newData.auth_provider in ['apple', 'google', 'magic_code'])",
      hasValidProfileCreateValues:
        "data.cashback_points_balance == 0 && data.cashback_points_lifetime_earned == 0 && data.has_seen_welcome_voucher == false && data.lifetime_tier_key == 'MEMBER' && data.nights_left == 0 && data.saved == 0 && data.tier_progress_points == 0 && data.location_permission_status in ['GRANTED', 'DENIED', 'UNDETERMINED'] && data.push_notification_permission_status in ['GRANTED', 'DENIED', 'UNDETERMINED'] && (data.member_segment == null || data.member_segment in ['LONG_TERM', 'SHORT_TERM']) && data.full_name != null && data.full_name.size() >= 1 && data.full_name.size() <= 60 && data.member_id != null && data.member_id.size() >= 6 && data.referral_code != null && data.referral_code.size() >= 4 && (data.next_tier_key == null || data.next_tier_key == 'LEGEND')",
      hasValidProfileUpdates:
        "(!('full_name' in request.modifiedFields) || (newData.full_name != null && newData.full_name.size() >= 1 && newData.full_name.size() <= 60)) && (!('location_permission_status' in request.modifiedFields) || newData.location_permission_status in ['GRANTED', 'DENIED', 'UNDETERMINED']) && (!('push_notification_permission_status' in request.modifiedFields) || newData.push_notification_permission_status in ['GRANTED', 'DENIED', 'UNDETERMINED']) && (!('member_segment' in request.modifiedFields) || newData.member_segment == null || newData.member_segment in ['LONG_TERM', 'SHORT_TERM']) && canSetAuthProviderOnce",
      onlySafeProfileCreateFields:
        "request.modifiedFields.all(field, field in ['avatar_url', 'bio', 'cashback_points_balance', 'cashback_points_lifetime_earned', 'created_at', 'date_of_birth', 'full_name', 'has_seen_welcome_voucher', 'lifetime_tier_key', 'location_permission_status', 'member_id', 'member_segment', 'member_since', 'next_tier_key', 'nights_left', 'onboarding_completed_at', 'push_notification_permission_status', 'referral_code', 'saved', 'tier_progress_expires_at', 'tier_progress_points', 'tier_progress_started_at', 'tier_progress_target_points', 'updated_at'])",
      onlySafeProfileUpdateFields:
        "request.modifiedFields.all(field, field in ['auth_provider', 'full_name', 'avatar_url', 'has_seen_welcome_voucher', 'bio', 'member_since', 'member_segment', 'nights_left', 'date_of_birth', 'location_permission_status', 'push_notification_permission_status', 'onboarding_completed_at', 'updated_at'])",
      canCreateOwnedProfile: 'isOwner',
    },
    allow: {
      view: 'isOwnerOrLinkedProfile',
      create:
        "canCreateOwnedProfile && onlySafeProfileCreateFields && hasValidProfileCreateValues && !('auth_provider' in request.modifiedFields)",
      delete: 'false',
      update:
        'isOwnerOrLinkedProfile && onlySafeProfileUpdateFields && hasValidProfileUpdates',
    },
  },
  table_reservations: {
    bind: {
      hasPendingStatusOnly: "data.status == 'pending'",
      hasValidReservationContactEmail:
        "!('contact_email' in request.modifiedFields) || (data.contact_email == null || (data.contact_email.size() >= 3 && data.contact_email.size() <= 254 && data.contact_email.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')))",
      hasValidReservationSpecialRequest:
        "!('special_request' in request.modifiedFields) || (data.special_request == null || (data.special_request.size() <= 500 && data.special_request.matches('^\\S(?:[\\s\\S]*\\S)?$|^$')))",
      onlySafeTableReservationFields:
        "request.modifiedFields.all(field, field in ['contact_email', 'created_at', 'entry_key', 'event_id', 'event_title', 'occasion', 'party_size', 'reservation_date', 'reservation_time', 'source', 'special_request', 'status', 'updated_at'])",
    },
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && onlySafeTableReservationFields && hasPendingStatusOnly && hasValidReservationContactEmail && hasValidReservationSpecialRequest",
      delete: 'false',
      update: 'false',
    },
  },
  events: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  $default: {
    allow: {
      $default: 'false',
    },
  },
  private_event_inquiries: {
    bind: {
      hasValidEstimatedPax: 'data.estimated_pax >= 1',
      onlySafePrivateEventInquiryFields:
        "request.modifiedFields.all(field, field in ['contact_email', 'contact_name', 'created_at', 'entry_key', 'estimated_pax', 'event_type', 'notes', 'preferred_date'])",
    },
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && onlySafePrivateEventInquiryFields && hasValidEstimatedPax",
      delete: 'false',
      update: 'false',
    },
  },
  member_offers: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  reward_transactions: {
    bind: {
      isMemberOwner: "auth.id != null && auth.id in data.ref('member.user.id')",
    },
    allow: {
      view: 'isMemberOwner',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  menu_categories: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  menu_items: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  news_items: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  private_event_types: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  referrals: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('referrer.user.id')",
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  saved_events: {
    bind: {
      onlySafeSavedEventFields:
        "request.modifiedFields.all(field, field in ['created_at', 'entry_key', 'event_id'])",
    },
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && onlySafeSavedEventFields",
      delete: "auth.id != null && auth.id in data.ref('owner.id')",
      update: 'false',
    },
  },
} satisfies InstantRules;

export default rules;
