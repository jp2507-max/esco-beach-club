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
  partners: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  partner_redemptions: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      delete: 'false',
      update: 'false',
    },
  },
  reviews: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      delete: 'false',
      update: 'false',
    },
  },
  $users: {
    allow: {
      view: 'auth.id == data.id',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  profiles: {
    bind: {
      authHasActiveStaffRole:
        "auth.id != null && ('staff' in auth.ref('$user.staff_access.role') || 'manager' in auth.ref('$user.staff_access.role')) && true in auth.ref('$user.staff_access.is_active')",
      isOwner: "auth.id != null && auth.id in data.ref('user.id')",
      onlySafeProfileFields:
        "request.modifiedFields.all(field, field in ['full_name', 'avatar_url', 'has_seen_welcome_voucher', 'bio', 'member_since', 'nights_left'])",
      onlyLoyaltyProfileFields:
        "request.modifiedFields.all(field, field in ['points', 'earned', 'updated_at'])",
      canCreateOwnedProfile:
        "auth.id != null && auth.id in data.ref('user.id') && size(data.ref('user.profile.id')) == 0",
    },
    allow: {
      view: 'isOwner || authHasActiveStaffRole',
      create: 'canCreateOwnedProfile',
      delete: 'false',
      update:
        '(isOwner && onlySafeProfileFields) || (authHasActiveStaffRole && onlyLoyaltyProfileFields)',
    },
  },
  table_reservations: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
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
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
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
  loyalty_transactions: {
    bind: {
      authHasActiveStaffRole:
        "auth.id != null && ('staff' in auth.ref('$user.staff_access.role') || 'manager' in auth.ref('$user.staff_access.role')) && true in auth.ref('$user.staff_access.is_active')",
      authIsManager:
        "auth.id != null && 'manager' in auth.ref('$user.staff_access.role')",
      authMatchesStaffAccess:
        "auth.id != null && auth.id in data.ref('staff_access.user.id')",
      hasActiveStaffAccess:
        "size(data.ref('staff_access.id')) == 1 && true in data.ref('staff_access.is_active')",
      hasManagerApproval:
        "size(data.ref('approved_by.id')) == 1 && true in data.ref('approved_by.is_active') && 'manager' in data.ref('approved_by.role')",
      hasMember: "size(data.ref('member.id')) == 1",
      isMemberOwner: "auth.id != null && auth.id in data.ref('member.user.id')",
      isPostedStatus: "data.status == 'posted'",
      isWithinApprovalCap: 'data.bill_amount_vnd <= 3000000',
      usesSupportedCurrency: "data.currency == 'VND'",
      usesSupportedSource:
        "data.source == 'manual_staff_entry' || data.source == 'pos_import'",
      validApprovalShape:
        "isWithinApprovalCap ? size(data.ref('approved_by.id')) == 0 : hasManagerApproval",
    },
    allow: {
      view: 'isMemberOwner || authHasActiveStaffRole',
      create:
        'authHasActiveStaffRole && authMatchesStaffAccess && hasActiveStaffAccess && hasMember && isPostedStatus && usesSupportedCurrency && usesSupportedSource && validApprovalShape',
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
    allow: {
      view: "auth.id != null && auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      delete: "auth.id != null && auth.id in data.ref('owner.id')",
      update: 'false',
    },
  },
  staff_access: {
    bind: {
      authHasActiveManagerRole:
        "auth.id != null && 'manager' in auth.ref('$user.staff_access.role') && true in auth.ref('$user.staff_access.is_active')",
      authHasActiveStaffRole:
        "auth.id != null && ('staff' in auth.ref('$user.staff_access.role') || 'manager' in auth.ref('$user.staff_access.role')) && true in auth.ref('$user.staff_access.is_active')",
      isManagerRecord: "data.role == 'manager' && data.is_active == true",
      isOwner: "auth.id != null && auth.id in data.ref('user.id')",
    },
    allow: {
      view: 'isOwner || (authHasActiveStaffRole && isManagerRecord)',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
    fields: {
      approval_pin: 'isOwner',
    },
  },
} satisfies InstantRules;

export default rules;
