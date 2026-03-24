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
  weekStrip: {
    title: '날짜별 보기',
    selectDay: '{{day}} 이벤트 보기',
    selectDayHint: '선택한 날짜로 이벤트를 필터링합니다',
  },
  noEventsForDayTitle: '선택한 날짜에 이벤트가 없습니다',
  noEventsForDayDescription: '다른 날짜, 카테고리 또는 검색어를 시도해 보세요.',
  featuredPrice: '가격',
  privatePartyTitle: '프라이빗 파티를 계획하시나요?',
  privatePartyDescription: '생일, 결혼식, 기업 행사까지 모두 가능합니다',
  attendeesCount: '{{count}}명 참석',
  aboutThisEvent: '이벤트 소개',
  aboutDescription1: '{{location}}에서 잊지 못할 저녁을 함께 하세요.',
  aboutDescription2:
    '라이브 엔터테인먼트, 프리미엄 음료, 그리고 환상적인 분위기와 함께 최고의 Esco Life를 경험해 보세요.',
  aboutDescription3:
    '친구들과 추억을 만들고 새로운 사람들을 만나기에 완벽합니다.',
  chooseExperience: '경험 선택',
  selectTier: '원하는 티어를 선택하세요',
  recommended: '추천',
  perPerson: '1인당',
  from: '부터',
  bookNow: '지금 예약하기',
  eventNotFound: '이벤트를 찾을 수 없습니다',
  goBack: '돌아가기',
  shareEvent: '이벤트 공유',
  likeEvent: '이벤트 좋아요',
  unlikeEvent: '이벤트 좋아요 취소',
  saveEvent: '이벤트 저장',
  removeSavedEvent: '저장한 이벤트 삭제',
  openEventPrice: '{{title}} 이벤트 열기',
  openEventPriceHint: '이 이벤트 상세 정보를 엽니다',
  likeEventHint: '이 이벤트를 저장 목록에 추가합니다',
  unlikeEventHint: '이 이벤트를 저장 목록에서 제거합니다',
  shareMessage:
    '{{location}}에서 {{date}} {{time}}에 열리는 {{title}}을(를) 확인해 보세요!',
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
