// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react-native';

const rules = {
  attrs: {
    allow: {
      create: 'false',
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
        "request.modifiedFields.all(field, field in ['full_name', 'avatar_url', 'has_seen_welcome_voucher'])",
    },
    allow: {
      view: 'isOwner',
      create: 'false',
      delete: 'false',
      update: 'isOwner && onlySafeProfileFields',
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
  news_items: {
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
} satisfies InstantRules;

export default rules;
