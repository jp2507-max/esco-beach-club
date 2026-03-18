const perks = {
  title: '혜택',
  categories: {
    all: '전체',
    hotels: '호텔',
    travel: '여행',
    dining: '다이닝',
    wellness: '웰니스',
  },
  partner: {
    notFound: '파트너를 찾을 수 없습니다',
    unlocked: '잠금 해제됨',
    congratulations: '축하합니다!',
    benefitsDescription:
      '{{name}}에서 특별한 혜택을 누리세요. {{description}}.',
    exclusive: '독점',
    discount: '할인',
    vipPerk: 'VIP 혜택',
    yourDiscountCode: '할인 코드',
    enjoyMyPerks: '혜택 즐기기',
    maybeLater: '나중에',
  },
} as const;

export default perks;
