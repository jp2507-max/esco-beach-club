const home = {
  greetings: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
  },
  guest: 'Guest',
  tier: {
    standard: 'Member',
    vip: 'VIP',
    owner: 'Owner',
  },
  vipStatus: 'VIP Status',
  seeAll: 'See All',
  quickActions: {
    bookTable: 'Book Table',
    menu: 'Menu',
  },
  latestNews: 'Latest News',
  welcomeBack: 'WELCOME BACK',
  brandMark: 'ESCO LIFE',
  pointsBalance: 'Points Balance',
  pointsSuffix: '/ {{max}} pts',
  memberName: 'MEMBER NAME',
  happeningThisWeek: 'Happening This Week',
  openProfile: 'Open profile',
  openProfileHint: 'Opens your profile screen',
} as const;

export default home;
