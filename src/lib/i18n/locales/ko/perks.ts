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
