export type RewardTierKey = 'ESCO_LIFE_MEMBER';

export const mockUser = {
  name: 'Alex Anderson',
  firstName: 'Alex',
  tier: 'Esco Life Member',
  tierBadge: 'ESCO LIFE MEMBER',
  tierLevel: 'ESCO_LIFE_MEMBER' as RewardTierKey,
  memberId: '#8829-PLT',
  cashbackPoints: 1250,
  cashbackTargetPoints: 0,
  lifetimeTierLabel: 'Lifetime Tier',
  cashbackEarned: 1240,
  saved: 145,
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  hasSeenWelcomeVoucher: false,
};

export const mockNewsFeed = [
  {
    id: 'n1',
    title: 'New Cocktail Menu is here!',
    subtitle: 'Try our 12 new signature drinks crafted by our head mixologist.',
    image:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&h=200&fit=crop',
    time: '2h ago',
  },
  {
    id: 'n2',
    title: 'Live Music starts at 8 PM',
    subtitle:
      'Coastal Quartet performing smooth jazz on the main deck tonight.',
    image:
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&h=200&fit=crop',
    time: '5h ago',
  },
  {
    id: 'n3',
    title: 'Weekend Brunch Special',
    subtitle: 'Unlimited mimosas with any brunch order this Saturday & Sunday.',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
    time: '1d ago',
  },
];

export const mockFeaturedEvent = {
  id: '1',
  title: 'Sunset DJ Sessions',
  time: '17:00 - 22:00',
  date: 'TONIGHT',
  location: 'Main Deck',
  image:
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
  attendees: 48,
};

export const mockHomeEvents = [
  {
    id: '1',
    title: 'Sunset DJ Sessions',
    time: '17:00 - 22:00',
    dayLabel: 'TONIGHT',
    location: 'Main Deck',
    image:
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
  },
  {
    id: '2',
    title: 'Cocktail Masterclass',
    time: '15:00 - 17:00',
    dayLabel: 'FRIDAY',
    location: 'The Lounge',
    image:
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop',
  },
  {
    id: '3',
    title: 'Beach Yoga Sunrise',
    time: '06:00 - 07:30',
    dayLabel: 'SATURDAY',
    location: 'North Beach',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
  },
];

export const mockEvents = [
  {
    id: 'feat',
    title: 'Sunset Jazz Session',
    description: 'Featuring the coastal quartet live o...',
    time: '6:00 PM',
    date: 'Sat, Aug 24',
    location: 'Beach Front',
    image:
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
    attendees: 120,
    price: '$45',
    badge: 'VIP ACCESS ONLY',
    badgeColor: '#FF9800',
    featured: true,
  },
  {
    id: '1',
    title: 'Sunrise Beach Yoga',
    time: '7:00 AM',
    date: 'Sun, Aug 25',
    location: 'North Beach',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&h=200&fit=crop',
    attendees: 30,
    price: 'Free',
    badge: 'FREE ENTRY',
    badgeColor: '#009688',
    featured: false,
  },
  {
    id: '2',
    title: 'Full Moon Party',
    time: '10:00 PM',
    date: 'Fri, Aug 30',
    location: 'Beach Front',
    image:
      'https://images.unsplash.com/photo-1532767153700-ee38fa7ad4bb?w=200&h=200&fit=crop',
    attendees: 200,
    price: '$25',
    badge: 'MEMBERS ONLY',
    badgeColor: '#1A73E8',
    featured: false,
  },
  {
    id: '3',
    title: 'Mixology Class',
    time: '4:00 PM',
    date: 'Wed, Sep 04',
    location: 'VIP Lounge',
    image:
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&h=200&fit=crop',
    attendees: 15,
    price: '$60',
    badge: 'LIMITED SPOTS',
    badgeColor: '#E91E63',
    featured: false,
  },
];

export const eventCategories = [
  'All Events',
  'Parties',
  'Live Music',
  'Wellness',
  'Dining',
];
