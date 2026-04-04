const membership = {
  title: 'Thành viên',
  tierCard: {
    currentTier: 'Hạng hiện tại',
    memberSince: 'Thành viên từ {{date}}',
    cashbackBalance: 'Số dư điểm thưởng',
    cashbackPoints: '{{value}} điểm thưởng',
    progressTo: 'Tiến tới {{nextTier}}',
    progressPoints: '{{current}} / {{target}} pts',
    progressExpires: 'Tiến độ sẽ đặt lại vào {{date}}',
    progressResetsMonthly:
      'Tiến độ lên hạng theo tháng sẽ đặt lại sau 1 tháng.',
    nextTierComingSoon: 'Hạng tiếp theo sắp ra mắt',
    progressUnavailable:
      'Tiến độ lên hạng sẽ xuất hiện tại đây khi hạng tiếp theo được cấu hình.',
  },
  tiers: {
    shore: 'Bờ biển',
    cove: 'Vịnh',
    horizon: 'Chân trời',
    luminary: 'Tỏa sáng',
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
    cashbackAdjusted: 'Điều chỉnh điểm thưởng thủ công',
    cashbackAdjustedDesc:
      '{{points}} điểm thưởng đã được thay đổi bằng điều chỉnh thủ công.',
    cashbackEarned: 'Điểm thưởng đã ghi nhận',
    cashbackEarnedDesc:
      '+{{points}} điểm thưởng từ giao dịch đủ điều kiện gần đây.',
    cashbackReversed: 'Điểm thưởng đã đảo ngược',
    cashbackReversedDesc:
      '-{{points}} điểm thưởng sau khi hoàn tiền hoặc hủy giao dịch.',
    daysAgo: '{{count}} ngày trước',
    loading: 'Đang tải hoạt động gần đây...',
    emptyTitle: 'Chưa có hoạt động thành viên',
    emptyDescription:
      'Hoạt động điểm thưởng mới và tiến độ hạng theo tháng sẽ xuất hiện tại đây sau giao dịch đủ điều kiện tiếp theo của bạn.',
    progressReset: 'Đặt lại tiến độ hạng',
    progressResetDesc:
      'Chu kỳ tiến độ hạng theo tháng của bạn đã được đặt lại.',
    sampleData: 'Dữ liệu mẫu',
  },
  comingSoon: 'Sắp ra mắt',
} as const;

export default membership;
