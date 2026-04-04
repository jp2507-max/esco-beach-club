const membership = {
  title: '멤버십',
  tierCard: {
    currentTier: '현재 등급',
    memberSince: '가입일 {{date}}',
    cashbackBalance: '리워드 포인트 잔액',
    cashbackPoints: '{{value}} 리워드 포인트',
    progressTo: '{{nextTier}}까지 진행',
    progressPoints: '{{current}} / {{target}} pts',
    progressExpires: '{{date}}에 진행이 초기화됩니다',
    progressResetsMonthly: '월간 등급 진행은 1개월 후 초기화됩니다.',
    nextTierComingSoon: '다음 등급은 곧 공개됩니다',
    progressUnavailable:
      '다음 등급이 설정되면 등급 진행 상황이 여기에 표시됩니다.',
  },
  tiers: {
    shore: '쇼어',
    cove: '코브',
    horizon: '호라이즌',
    luminary: '루미너리',
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
    cashbackAdjusted: '수동 포인트 조정',
    cashbackAdjustedDesc:
      '{{points}} 리워드 포인트가 수동 조정으로 변경되었습니다.',
    cashbackEarned: '포인트 적립',
    cashbackEarnedDesc:
      '최근 적격 구매에서 +{{points}} 리워드 포인트가 적립되었습니다.',
    cashbackReversed: '포인트 취소',
    cashbackReversedDesc:
      '환불 또는 취소 처리로 -{{points}} 리워드 포인트가 반영되었습니다.',
    daysAgo: '{{count}}일 전',
    loading: '최근 활동을 불러오는 중입니다...',
    emptyTitle: '아직 멤버 활동이 없습니다',
    emptyDescription:
      '다음 적격 구매 이후 새로운 포인트 활동과 월간 등급 진행이 여기에 표시됩니다.',
    progressReset: '등급 진행 초기화',
    progressResetDesc: '월간 등급 진행 창이 초기화되었습니다.',
    sampleData: '샘플 데이터',
  },
  comingSoon: '곧 출시',
} as const;

export default membership;
