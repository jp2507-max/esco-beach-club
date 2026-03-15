const home = {
  greetings: {
    morning: '좋은 아침입니다',
    afternoon: '좋은 오후입니다',
    evening: '좋은 저녁입니다',
  },
  guest: '게스트',
  member: '멤버',
  vipStatus: 'VIP 상태',
  seeAll: '모두 보기',
  quickActions: {
    bookTable: '테이블 예약',
    menu: '메뉴',
  },
  latestNews: '최신 소식',
  welcomeBack: '다시 오신 것을 환영합니다',
  brandMark: 'ESCO LIFE',
  pointsBalance: '포인트 잔액',
  pointsSuffix: '/ {{max}} pts',
  memberName: '멤버 이름',
  happeningThisWeek: '이번 주 일정',
} as const;

export default home;
