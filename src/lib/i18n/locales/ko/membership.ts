const membership = {
  title: '멤버십',
  tierCard: {
    currentTier: '현재 등급',
    memberSince: '가입일 {{date}}',
    progressTo: '{{nextTier}}까지 진행',
    pointsLabel: '{{current}} / {{max}} pts',
  },
  tiers: {
    standard: '멤버',
    vip: 'VIP',
    owner: '플래티넘',
    nextStandard: 'VIP',
    nextVip: '플래티넘',
    nextOwner: '다이아몬드',
  },
  benefits: {
    title: '혜택',
    viewAll: '전체 보기',
    concierge: '24/7 컨시어지 서비스',
    priorityBooking: '우선 예약',
    poolsideDrinks: '무료 풀사이드 음료',
    poolsideDrinksDesc: '매일 시그니처 칵테일 무료 제공',
    memberEvents: '멤버 이벤트',
    memberEventsDesc: '멤버 전용 이벤트 참여',
    discountDining: '식사 할인',
    discountDiningDesc: '모든 음식 및 음료 10% 할인',
  },
  manageAccount: {
    title: '계정 관리',
    upgradeTier: '등급 업그레이드',
    billingHistory: '결제 내역',
    managePayments: '결제 수단 관리',
  },
  activity: {
    title: '최근 활동',
    tierUpgraded: '등급 업그레이드',
    tierUpgradedDesc: '축하합니다! {{tier}} 등급에 도달했습니다.',
    pointsEarned: '포인트 적립',
    pointsEarnedDesc: '최근 활동에서 +{{points}} 포인트.',
    daysAgo: '{{count}}일 전',
    sampleData: '샘플 데이터',
  },
  comingSoon: '곧 출시',
} as const;

export default membership;
