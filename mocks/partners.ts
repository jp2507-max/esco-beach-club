export interface Partner {
  id: string;
  name: string;
  category: 'Hotels' | 'Travel' | 'Dining' | 'Wellness';
  discountPercentage: number;
  discountLabel: string;
  description: string;
  image: string;
  code: string;
}

export const partnerCategories = [
  'All',
  'Hotels',
  'Travel',
  'Dining',
  'Wellness',
] as const;

export const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Royal Sands Resort',
    category: 'Hotels',
    discountPercentage: 20,
    discountLabel: '-20% OFF',
    description: 'Premium Suites only',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    code: 'ESCO-ROYAL20',
  },
  {
    id: '2',
    name: 'Vino Select',
    category: 'Dining',
    discountPercentage: 0,
    discountLabel: 'BOGO',
    description: 'On all red wines',
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    code: 'ESCO-VINO2FOR1',
  },
  {
    id: '3',
    name: 'Azure Air',
    category: 'Travel',
    discountPercentage: 0,
    discountLabel: 'POINTS 2X',
    description: 'International flights',
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop',
    code: 'ESCO-AZURE2X',
  },
  {
    id: '4',
    name: 'Ocean Spa',
    category: 'Wellness',
    discountPercentage: 15,
    discountLabel: '-15% OFF',
    description: 'Full body massage',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
    code: 'ESCO-SPA15',
  },
  {
    id: '5',
    name: 'Blue Horizon',
    category: 'Travel',
    discountPercentage: 0,
    discountLabel: 'FREE GUIDE',
    description: 'Private charters',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    code: 'ESCO-BLUEFREE',
  },
  {
    id: '6',
    name: 'Coco Bistro',
    category: 'Dining',
    discountPercentage: 0,
    discountLabel: 'FREE DESSERT',
    description: 'With main course',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    code: 'ESCO-COCO-SWEET',
  },
];

export interface Referral {
  id: string;
  name: string;
  avatar: string;
  status: 'Completed' | 'Pending';
}

export const mockReferrals: Referral[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    status: 'Completed',
  },
];

export const referralCode = 'ALEX-2025';
export const referralProgress = { current: 1, goal: 3 };
