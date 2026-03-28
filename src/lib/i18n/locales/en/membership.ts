const membership = {
  title: 'Membership',
  tierCard: {
    currentTier: 'Current Tier',
    memberSince: 'Member since {{date}}',
    progressTo: 'Progress to {{nextTier}}',
    pointsLabel: '{{current}} / {{max}} pts',
  },
  tiers: {
    standard: 'Member',
    vip: 'VIP',
    owner: 'Platinum',
    nextStandard: 'VIP',
    nextVip: 'Platinum',
    nextOwner: 'Diamond',
  },
  benefits: {
    title: 'Unlocked Benefits',
    viewAll: 'View All',
    concierge: '24/7 Concierge Service',
    priorityBooking: 'Priority Booking Access',
    poolsideDrinks: 'Free Poolside Drinks',
    poolsideDrinksDesc: 'Daily complimentary signature cocktails',
    memberEvents: 'Member Events Access',
    memberEventsDesc: 'Exclusive access to members-only events',
    discountDining: 'Dining Discounts',
    discountDiningDesc: '10% off all food & beverages',
  },
  manageAccount: {
    title: 'Manage Account',
    upgradeTier: 'Upgrade Tier',
    billingHistory: 'Billing History',
    managePayments: 'Manage Payment Methods',
  },
  activity: {
    title: 'Recent Activity',
    tierUpgraded: 'Tier Upgraded',
    tierUpgradedDesc: "Congratulations! You've reached {{tier}} Status.",
    pointsEarned: 'Points Earned',
    pointsEarnedDesc: '+{{points}} points from recent activity.',
    daysAgo: '{{count}} days ago',
    sampleData: 'Sample Content',
  },
  comingSoon: 'Coming soon',
} as const;

export default membership;
