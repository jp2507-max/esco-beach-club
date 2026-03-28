const membership = {
  title: 'Thành viên',
  tierCard: {
    currentTier: 'Hạng hiện tại',
    memberSince: 'Thành viên từ {{date}}',
    progressTo: 'Tiến tới {{nextTier}}',
    pointsLabel: '{{current}} / {{max}} pts',
  },
  tiers: {
    standard: 'Thành viên',
    vip: 'VIP',
    owner: 'Bạch kim',
    nextStandard: 'VIP',
    nextVip: 'Bạch kim',
    nextOwner: 'Kim cương',
  },
  benefits: {
    title: 'Quyền lợi',
    viewAll: 'Xem tất cả',
    concierge: 'Dịch vụ hỗ trợ 24/7',
    priorityBooking: 'Ưu tiên đặt chỗ',
    poolsideDrinks: 'Đồ uống bể bơi miễn phí',
    poolsideDrinksDesc: 'Cocktail đặc trưng miễn phí mỗi ngày',
    memberEvents: 'Sự kiện thành viên',
    memberEventsDesc: 'Truy cập sự kiện dành riêng cho thành viên',
    discountDining: 'Giảm giá ẩm thực',
    discountDiningDesc: 'Giảm 10% tất cả đồ ăn & thức uống',
  },
  manageAccount: {
    title: 'Quản lý tài khoản',
    upgradeTier: 'Nâng cấp hạng',
    billingHistory: 'Lịch sử thanh toán',
    managePayments: 'Quản lý thanh toán',
  },
  activity: {
    title: 'Hoạt động gần đây',
    tierUpgraded: 'Nâng cấp hạng',
    tierUpgradedDesc: 'Chúc mừng! Bạn đã đạt hạng {{tier}}.',
    pointsEarned: 'Điểm tích lũy',
    pointsEarnedDesc: '+{{points}} điểm từ hoạt động gần đây.',
    daysAgo: '{{count}} ngày trước',
    sampleData: 'Dữ liệu mẫu',
  },
  comingSoon: 'Sắp ra mắt',
} as const;

export default membership;
