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
      authHasActiveStaffRole:
        "auth.id != null && ('staff' in auth.ref('$user.staff_access.role') || 'manager' in auth.ref('$user.staff_access.role')) && true in auth.ref('$user.staff_access.is_active')",
      isLinkedProfile:
        "auth.id != null && data.id in auth.ref('$user.profile.id')",
      isOwner: "auth.id != null && auth.id in data.ref('user.id')",
      isOwnerOrLinkedProfile: 'isOwner || isLinkedProfile',
      onlySafeProfileFields:
        "request.modifiedFields.all(field, field in ['full_name', 'avatar_url', 'has_seen_welcome_voucher', 'bio', 'member_since', 'member_segment', 'nights_left', 'date_of_birth', 'location_permission_status', 'push_notification_permission_status', 'onboarding_completed_at', 'auth_provider', 'updated_at'])",
      canCreateOwnedProfile:
        "auth.id != null && auth.id in data.ref('user.id')",
    },
    allow: {
      view: 'isOwnerOrLinkedProfile || authHasActiveStaffRole',
      create: 'canCreateOwnedProfile',
      delete: 'false',
      update: 'isOwnerOrLinkedProfile && onlySafeProfileFields',
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
  reward_transactions: {
    bind: {
      authHasActiveStaffRole:
        "auth.id != null && ('staff' in auth.ref('$user.staff_access.role') || 'manager' in auth.ref('$user.staff_access.role')) && true in auth.ref('$user.staff_access.is_active')",
      isMemberOwner: "auth.id != null && auth.id in data.ref('member.user.id')",
    },
    allow: {
      view: 'isMemberOwner || authHasActiveStaffRole',
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
  },
} satisfies InstantRules;

export default rules;
