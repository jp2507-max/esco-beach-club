export type UserTier = 'STANDARD' | 'VIP' | 'OWNER';

export type StaffRole = 'staff' | 'manager';

export const onboardingPermissionStatuses = {
  denied: 'DENIED',
  granted: 'GRANTED',
  undetermined: 'UNDETERMINED',
} as const;

export type OnboardingPermissionStatus =
  (typeof onboardingPermissionStatuses)[keyof typeof onboardingPermissionStatuses];

export type Profile = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  bio: string;
  tier: UserTier;
  member_id: string;
  member_since: string;
  nights_left: number;
  points: number;
  max_points: number;
  earned: number;
  saved: number;
  avatar_url: string | null;
  is_danang_citizen: boolean | null;
  location_permission_status: OnboardingPermissionStatus;
  push_notification_permission_status: OnboardingPermissionStatus;
  onboarding_completed_at: string | null;
  referral_code: string;
  has_seen_welcome_voucher: boolean;
  created_at: string;
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

export type LoyaltyTransaction = {
  id: string;
  approved_by_staff_access_id: string | null;
  bill_amount_vnd: number;
  created_at: string;
  currency: string;
  entry_key: string;
  manager_pin_label: string | null;
  member_id: string;
  member_profile_id: string | null;
  points_awarded: number;
  points_rate_per_100k_vnd: number;
  receipt_reference: string | null;
  source: string;
  staff_access_id: string | null;
  status: string;
  updated_at: string;
};
