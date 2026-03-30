const membership = {
  title: 'Membership',
  tierCard: {
    currentTier: 'Current Tier',
    memberSince: 'Member since {{date}}',
    cashbackBalance: 'Cashback Balance',
    cashbackPoints: '{{value}} cashback pts',
    progressTo: 'Progress to {{nextTier}}',
    progressPoints: '{{current}} / {{target}} pts',
    progressExpires: 'Progress resets on {{date}}',
    progressResetsMonthly: 'Monthly tier progress resets after 1 month.',
    nextTierComingSoon: 'Next tier coming soon',
    progressUnavailable:
      'Tier progress will appear here once the next tier is configured.',
  },
  tiers: {
    escoLifeMember: 'Esco Life Member',
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
    cashbackAdjusted: 'Manual Cashback Adjustment',
    cashbackAdjustedDesc:
      '{{points}} cashback points were changed through a manual adjustment.',
    cashbackEarned: 'Cashback Earned',
    cashbackEarnedDesc:
      '+{{points}} cashback points from a recent qualifying purchase.',
    cashbackReversed: 'Cashback Reversed',
    cashbackReversedDesc: '-{{points}} cashback points after a refund or void.',
    daysAgo: '{{count}} days ago',
    loading: 'Loading recent activity...',
    emptyTitle: 'No member activity yet',
    emptyDescription:
      'New cashback activity and monthly tier progress will appear here after your next qualifying purchase.',
    progressReset: 'Tier Progress Reset',
    progressResetDesc: 'Your monthly tier progress window was reset.',
    sampleData: 'Sample Content',
  },
  comingSoon: 'Coming soon',
} as const;

export default membership;
