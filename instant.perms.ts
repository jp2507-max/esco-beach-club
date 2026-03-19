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
      isOwner: "auth.id != null && auth.id in data.ref('user.id')",
      onlySafeProfileFields:
        "request.modifiedFields.all(field, field in ['full_name', 'avatar_url', 'has_seen_welcome_voucher', 'bio', 'member_since', 'nights_left'])",
      canCreateOwnedProfile:
        "auth.id != null && auth.id in data.ref('user.id') && size(data.ref('user.profile.id')) <= 1",
    },
    allow: {
      view: 'isOwner',
      create: 'canCreateOwnedProfile',
      delete: 'false',
      update: 'isOwner && onlySafeProfileFields',
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
} satisfies InstantRules;

export default rules;
