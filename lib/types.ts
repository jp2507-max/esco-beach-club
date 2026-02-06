export type UserTier = 'STANDARD' | 'VIP' | 'OWNER';

export interface Profile {
  id: string;
  full_name: string;
  tier: UserTier;
  tier_label: string;
  member_id: string;
  points: number;
  max_points: number;
  earned: number;
  saved: number;
  avatar_url: string | null;
  referral_code: string;
  has_seen_welcome_voucher: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
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
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  time_label: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  discount_percentage: number;
  discount_label: string;
  description: string;
  image: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_name: string;
  referred_avatar: string | null;
  status: 'Completed' | 'Pending';
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PrivateEventInquiry {
  id: string;
  user_id: string;
  event_type: string;
  preferred_date: string;
  estimated_pax: number;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
}
