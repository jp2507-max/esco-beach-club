// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/react-native';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    events: i.entity({
      attendees: i.number().optional(),
      badge: i.string().optional(),
      badge_color: i.string().optional(),
      category: i.string().indexed().optional(),
      created_at: i.date().indexed().optional(),
      date: i.string().indexed(),
      day_label: i.string().optional(),
      description: i.string().optional(),
      featured: i.boolean().indexed().optional(),
      guest_price: i.string().optional(),
      image: i.string(),
      location: i.string(),
      member_price: i.string().optional(),
      price: i.string(),
      time: i.string(),
      title: i.string(),
      vip_price: i.string().optional(),
    }),
    news_items: i.entity({
      created_at: i.date().indexed().optional(),
      image: i.string().optional(),
      subtitle: i.string().optional(),
      time_label: i.string().optional(),
      title: i.string(),
    }),
    partners: i.entity({
      category: i.string().indexed().optional(),
      code: i.string().optional(),
      created_at: i.date().indexed().optional(),
      description: i.string().optional(),
      discount_label: i.string().optional(),
      discount_percentage: i.number().optional(),
      image: i.string().optional(),
      name: i.string(),
    }),
    private_event_inquiries: i.entity({
      contact_email: i.string().indexed().optional(),
      contact_name: i.string().optional(),
      created_at: i.date().indexed().optional(),
      estimated_pax: i.number(),
      event_type: i.string(),
      notes: i.string().optional(),
      preferred_date: i.string().indexed(),
      user_id: i.string().indexed().optional(),
    }),
    profiles: i.entity({
      avatar_url: i.string().optional(),
      created_at: i.date().indexed().optional(),
      earned: i.number().optional(),
      full_name: i.string().optional(),
      has_seen_welcome_voucher: i.boolean().optional(),
      max_points: i.number().optional(),
      member_id: i.string().unique().indexed(),
      points: i.number().optional(),
      referral_code: i.string().unique().indexed(),
      saved: i.number().optional(),
      tier: i.string().optional(),
      tier_label: i.string().optional(),
      updated_at: i.date().indexed().optional(),
    }),
    referrals: i.entity({
      created_at: i.date().indexed().optional(),
      referred_avatar: i.string().optional(),
      referred_name: i.string().optional(),
      referrer_id: i.string().indexed().optional(),
      status: i.string().indexed().optional(),
    }),
    reviews: i.entity({
      comment: i.string().optional(),
      created_at: i.date().indexed().optional(),
      rating: i.number(),
      user_id: i.string().indexed().optional(),
    }),
  },
  links: {
    $streams$files: {
      forward: {
        on: '$streams',
        has: 'many',
        label: '$files',
      },
      reverse: {
        on: '$files',
        has: 'one',
        label: '$stream',
        onDelete: 'cascade',
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: '$users',
        has: 'one',
        label: 'linkedPrimaryUser',
        onDelete: 'cascade',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'linkedGuestUsers',
      },
    },
    private_event_inquiriesOwner: {
      forward: {
        on: 'private_event_inquiries',
        has: 'one',
        label: 'owner',
        onDelete: 'cascade',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'private_event_inquiries',
      },
    },
    profilesUser: {
      forward: {
        on: 'profiles',
        has: 'one',
        label: 'user',
      },
      reverse: {
        on: '$users',
        has: 'one',
        label: 'profile',
      },
    },
    referralsReferrer: {
      forward: {
        on: 'referrals',
        has: 'one',
        label: 'referrer',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'referrals',
      },
    },
    reviewsOwner: {
      forward: {
        on: 'reviews',
        has: 'one',
        label: 'owner',
        onDelete: 'cascade',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'reviews',
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
