const perks = {
  title: '혜택',
  categories: {
    all: '전체',
    hotels: '호텔',
    travel: '여행',
    dining: '다이닝',
    wellness: '웰니스',
  },
  danangCta: {
    badge: '추천 도시 가이드',
    title: 'Da Nang 365',
    description: '현지 추천 장소, 이벤트, 꼭 가봐야 할 명소를 둘러보세요.',
    action: 'Da Nang 365 열기',
    hint: '브라우저에서 Da Nang 365를 엽니다',
    openFailedTitle: '링크를 열 수 없습니다',
    openFailedBody: '잠시 후 다시 시도해 주세요.',
  },
  history: {
    title: '혜택 내역',
    openAction: '내역',
    openHint: '혜택 이용 내역 화면을 엽니다',
    backAction: '뒤로',
    backHint: '혜택 화면으로 돌아갑니다',
    recentActivity: '최근 활동',
    fullArchive: '전체 내역 보기',
    hero: {
      status: 'EXCLUSIVE STATUS',
      total: '{{count}} Perks',
      subtitle: '올해 잠금 해제됨',
    },
    status: {
      used: '사용됨',
      expired: '만료됨',
    },
    items: {
      grandMarinaResort: {
        name: 'Grand Marina Resort',
        date: '2026년 10월 24일',
        perk: '객실 업그레이드 20% 할인',
      },
      saffronSkyDining: {
        name: 'Saffron Sky Dining',
        date: '2026년 10월 12일',
        perk: '테이스팅 메뉴 무료 제공',
      },
      azureAirways: {
        name: 'Azure Airways',
        date: '2026년 9월 30일',
        perk: '라운지 이용권',
      },
      velvetSandsSpa: {
        name: 'Velvet Sands Spa',
        date: '2026년 8월 15일',
        perk: '60분 딥티슈 세션',
      },
    },
  },
  partner: {
    notFound: '파트너를 찾을 수 없습니다',
    unlocked: '잠금 해제됨',
    congratulations: '축하합니다!',
    benefitsDescription:
      '{{name}}에서 특별한 혜택을 누리세요. {{description}}.',
    claiming: '혜택 확인 중...',
    exclusive: '독점',
    discount: '할인',
    vipPerk: 'VIP 혜택',
    redemptionFailedTitle: '혜택 저장 실패',
    redemptionFailedMessage:
      '지금은 혜택을 저장할 수 없습니다. 다시 시도해 주세요.',
    yourDiscountCode: '할인 코드',
    enjoyMyPerks: '혜택 즐기기',
    maybeLater: '나중에',
    maybeLaterHint: '이전 화면으로 돌아갑니다',
    close: '닫기',
    closeHint: '파트너 상세 모달을 닫습니다',
  },
} as const;

export default perks;
