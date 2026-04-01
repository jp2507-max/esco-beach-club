export const rewardTierKeys = {
  escoLifeMember: 'ESCO_LIFE_MEMBER',
} as const;

export type RewardTierKey =
  (typeof rewardTierKeys)[keyof typeof rewardTierKeys];

export const rewardTransactionEventTypes = {
  manualAdjustment: 'manual_adjustment',
  purchase: 'purchase',
  refund: 'refund',
  tierProgressReset: 'tier_progress_reset',
  void: 'void',
} as const;

export type RewardTransactionEventType =
  (typeof rewardTransactionEventTypes)[keyof typeof rewardTransactionEventTypes];

export const rewardTransactionSources = {
  localPosPoller: 'local_pos_poller',
  manualStaffEntry: 'manual_staff_entry',
  systemReconcile: 'system_reconcile',
} as const;

export type RewardTransactionSource =
  (typeof rewardTransactionSources)[keyof typeof rewardTransactionSources];

export const rewardTransactionStatuses = {
  pending: 'pending',
  posted: 'posted',
  rejected: 'rejected',
} as const;

export type RewardTransactionStatus =
  (typeof rewardTransactionStatuses)[keyof typeof rewardTransactionStatuses];

export type StaffRole = 'staff' | 'manager';

export const onboardingPermissionStatuses = {
  denied: 'DENIED',
  granted: 'GRANTED',
  undetermined: 'UNDETERMINED',
} as const;

export type OnboardingPermissionStatus =
  (typeof onboardingPermissionStatuses)[keyof typeof onboardingPermissionStatuses];

export const memberSegments = {
  foreigner: 'FOREIGNER',
  local: 'LOCAL',
} as const;

export type MemberSegment =
  (typeof memberSegments)[keyof typeof memberSegments];

export const authProviderTypes = {
  apple: 'apple',
  google: 'google',
  magicCode: 'magic_code',
} as const;

export type AuthProviderType =
  (typeof authProviderTypes)[keyof typeof authProviderTypes];

export const accountDeletionStatuses = {
  completed: 'completed',
  pending: 'pending',
  restored: 'restored',
} as const;

export type AccountDeletionStatus =
  (typeof accountDeletionStatuses)[keyof typeof accountDeletionStatuses];

export type Profile = {
  id: string;
  full_name: string;
  auth_provider: AuthProviderType | null;
  date_of_birth: string | null;
  bio: string;
  member_id: string;
  member_since: string;
  nights_left: number;
  cashback_points_balance: number;
  cashback_points_lifetime_earned: number;
  lifetime_tier_key: RewardTierKey | null;
  next_tier_key: RewardTierKey | null;
  tier_progress_points: number;
  tier_progress_target_points: number;
  tier_progress_started_at: string | null;
  tier_progress_expires_at: string | null;
  saved: number;
  avatar_url: string | null;
  member_segment: MemberSegment | null;
  location_permission_status: OnboardingPermissionStatus;
  push_notification_permission_status: OnboardingPermissionStatus;
  onboarding_completed_at: string | null;
  referral_code: string;
  has_seen_welcome_voucher: boolean;
  created_at: string;
  updated_at: string;
};

export type AccountDeletionRequest = {
  id: string;
  apple_revocation_error: string | null;
  apple_revocation_status: string | null;
  auth_provider: AuthProviderType | null;
  auth_user_id: string;
  completed_at: string | null;
  created_at: string;
  email: string | null;
  profile_id: string | null;
  requested_at: string;
  restored_at: string | null;
  scheduled_for_at: string;
  status: AccountDeletionStatus;
  updated_at: string;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  time: string;
  date: string;
  day_label: string | null;
  location: string;
  image: string;
  attendees: number;
  price: string;
  badge: string | null;
  badge_color: string | null;
  featured: boolean;
  category: string | null;
  vip_price: string | null;
  member_price: string | null;
  guest_price: string | null;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  time_label: string;
  created_at: string;
};

export type BookingOccasionOption = {
  id: string;
  created_at: string;
  is_active: boolean;
  label_key: string;
  sort_order: number;
  value: string;
};

export type BookingTimeSlotOption = {
  id: string;
  available: boolean;
  created_at: string;
  sort_order: number;
  time: string;
};

export type MemberOffer = {
  id: string;
  badge_key: string;
  code: string | null;
  created_at: string;
  is_active: boolean;
  kind: string;
  sort_order: number;
  subtitle_key: string;
  terms_key: string | null;
  title_key: string;
};

export type MenuCategoryContent = {
  id: string;
  created_at: string;
  is_active: boolean;
  key: string;
  label_key: string;
  sort_order: number;
};

export type MenuItemContent = {
  id: string;
  category_key: string;
  created_at: string;
  description_key: string;
  image: string;
  is_active: boolean;
  name_key: string;
  price: string;
  sort_order: number;
  tag_key: string | null;
};

export type PrivateEventTypeOption = {
  id: string;
  created_at: string;
  is_active: boolean;
  label_key: string;
  sort_order: number;
  value: string;
};

export type Partner = {
  id: string;
  name: string;
  category: string;
  discount_percentage: number;
  discount_label: string;
  description: string;
  image: string;
  code: string;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_name: string;
  referred_avatar: string | null;
  status: 'Completed' | 'Pending';
  created_at: string;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type SavedEvent = {
  id: string;
  event_id: string;
  entry_key: string;
  created_at: string;
};

export type PrivateEventInquiry = {
  id: string;
  entry_key: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
};

export type TableReservation = {
  id: string;
  created_at: string;
  entry_key: string;
  event_id: string | null;
  event_title: string | null;
  occasion: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  source: string;
  status: string;
  updated_at: string;
};

export type PartnerRedemption = {
  id: string;
  created_at: string;
  entry_key: string;
  partner_code: string | null;
  partner_id: string;
  redemption_method: string;
  status: string;
};

export type StaffAccess = {
  id: string;
  created_at: string;
  is_active: boolean;
  role: StaffRole | null;
  updated_at: string;
  user_id: string | null;
};

export type RewardTransaction = {
  id: string;
  amount_vnd: number;
  cashback_points_delta: number;
  created_at: string;
  entry_key: string;
  event_type: RewardTransactionEventType;
  external_event_id: string;
  member_id: string;
  member_profile_id: string | null;
  occurred_at: string;
  reference: string | null;
  source: RewardTransactionSource;
  status: RewardTransactionStatus;
  tier_progress_points_delta: number;
  updated_at: string;
};
