const perks = {
  title: 'Perks',
  loading: 'Loading perks...',
  emptyTitle: 'No perks match this filter',
  emptyDescription:
    'Try another category or check back soon for new partner offers.',
  categories: {
    all: 'All',
    hotels: 'Hotels',
    travel: 'Travel',
    dining: 'Dining',
    wellness: 'Wellness',
  },
  danangCta: {
    badge: 'Featured city guide',
    title: 'Da Nang 365',
    description:
      'Explore curated local picks, events, and must-visit spots across the city.',
    action: 'Open Da Nang 365',
    hint: 'Opens Da Nang 365 in your browser',
    openFailedTitle: 'Unable to open link',
    openFailedBody: 'Please try again in a moment.',
  },
  history: {
    title: 'Perk History',
    openAction: 'History',
    openHint: 'Opens your perk history screen',
    backAction: 'Back',
    backHint: 'Returns to the perks screen',
    recentActivity: 'Recent Activity',
    fullArchive: 'View Full Archive',
    hero: {
      status: 'Exclusive Status',
      total: '{{count}} Perks',
      subtitle: 'Unlocked this year',
    },
    loading: 'Loading perk history...',
    emptyTitle: 'No perk history yet',
    emptyDescription:
      'Your claimed partner perks will appear here after your first unlock.',
    unknownPartner: 'Partner reward',
    unknownPerk: 'Member benefit',
    status: {
      claimed: 'Claimed',
      used: 'Used',
      expired: 'Expired',
    },
    items: {
      grandMarinaResort: {
        name: 'Grand Marina Resort',
        date: 'Oct 24, 2026',
        perk: '-20% Room Upgrade',
      },
      saffronSkyDining: {
        name: 'Saffron Sky Dining',
        date: 'Oct 12, 2026',
        perk: 'Complimentary Tasting Menu',
      },
      azureAirways: {
        name: 'Azure Airways',
        date: 'Sep 30, 2026',
        perk: 'Lounge Access Pass',
      },
      velvetSandsSpa: {
        name: 'Velvet Sands Spa',
        date: 'Aug 15, 2026',
        perk: '60m Deep Tissue Session',
      },
    },
  },
  partner: {
    notFound: 'Partner not found',
    unlocked: 'UNLOCKED',
    congratulations: 'Congratulations!',
    benefitsDescription:
      'Enjoy exclusive benefits at {{name}}. {{description}}.',
    claiming: 'Claiming...',
    exclusive: 'Exclusive',
    discount: 'Discount',
    vipPerk: 'VIP Perk',
    redemptionFailedTitle: 'Perk Claim Failed',
    redemptionFailedMessage:
      'Could not save your perk claim right now. Please try again.',
    yourDiscountCode: 'YOUR DISCOUNT CODE',
    enjoyMyPerks: 'Enjoy my Perks',
    maybeLater: 'Maybe later',
    maybeLaterHint: 'Returns to previous screen',
    close: 'Close',
    closeHint: 'Closes the partner detail modal',
  },
} as const;

export default perks;
