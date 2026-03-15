const events = {
  title: '이벤트',
  searchPlaceholder: '이벤트, 아티스트 검색...',
  categories: {
    allEvents: '전체 이벤트',
    parties: '파티',
    liveMusic: '라이브 음악',
    wellness: '웰니스',
    dining: '다이닝',
  },
  featuredPrice: '가격',
  privatePartyTitle: '프라이빗 파티를 계획하시나요?',
  privatePartyDescription: '생일, 결혼식, 기업 행사까지 모두 가능합니다',
  priceTiers: {
    contactForPricing: '가격 문의',
    vip: {
      label: 'VIP',
      perk1: '우선 좌석',
      perk2: '웰컴 드링크',
      perk3: '백스테이지 접근',
    },
    member: {
      label: '멤버',
      perk1: '예약석',
      perk2: '무료 간식',
    },
    guest: {
      label: '게스트',
      perk1: '일반 입장',
      perk2: '캐시 바',
    },
  },
} as const;

export default events;
