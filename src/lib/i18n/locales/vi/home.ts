const home = {
  greetings: {
    morning: 'Chào buổi sáng',
    afternoon: 'Chào buổi chiều',
    evening: 'Chào buổi tối',
  },
  guest: 'Khách',
  tier: {
    standard: 'Thành viên',
    vip: 'VIP',
    owner: 'Người sở hữu',
  },
  vipStatus: 'Trạng thái VIP',
  seeAll: 'Xem tất cả',
  quickActions: {
    bookTable: 'Đặt bàn',
    menu: 'Thực đơn',
  },
  latestNews: 'Tin mới nhất',
  welcomeBack: 'CHÀO MỪNG TRỞ LẠI',
  welcomeBackName: 'Chào mừng trở lại, {{name}}',
  brandMark: 'ESCO LIFE',
  pointsBalance: 'Điểm tích lũy',
  pointsSuffix: '/ {{max}} điểm',
  memberName: 'TÊN THÀNH VIÊN',
  happeningThisWeek: 'Diễn ra tuần này',
  openProfile: 'Mở hồ sơ',
  openProfileHint: 'Mở màn hình hồ sơ của bạn',
} as const;

export default home;
