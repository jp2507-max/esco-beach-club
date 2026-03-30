const events = {
  title: 'Sự kiện',
  searchPlaceholder: 'Tìm sự kiện, nghệ sĩ...',
  categories: {
    allEvents: 'Tất cả sự kiện',
    parties: 'Tiệc',
    liveMusic: 'Nhạc sống',
    wellness: 'Chăm sóc sức khỏe',
    dining: 'Ẩm thực',
  },
  weekStrip: {
    title: 'Duyệt theo ngày',
    selectDay: 'Hiển thị sự kiện cho {{day}}',
    selectDayHint: 'Lọc sự kiện theo ngày đã chọn',
  },
  loading: 'Đang tải sự kiện...',
  noEventsForDayTitle: 'Không có sự kiện trong ngày này',
  noEventsForDayDescription: 'Hãy thử ngày khác, danh mục khác hoặc tìm kiếm.',
  featuredPrice: 'GIÁ',
  privatePartyTitle: 'Lên kế hoạch tiệc riêng?',
  privatePartyDescription:
    'Sinh nhật, đám cưới, doanh nghiệp — chúng tôi đều phục vụ',
  attendeesCount: '{{count}} người tham dự',
  aboutThisEvent: 'Về sự kiện này',
  aboutDescription1:
    'Hãy tham gia cùng chúng tôi để có một buổi tối khó quên tại {{location}}.',
  aboutDescription2:
    'Trải nghiệm những điều tuyệt vời nhất của Esco Life với chương trình giải trí trực tiếp, đồ uống cao cấp và bầu không khí tuyệt vời.',
  aboutDescription3:
    'Hoàn hảo để tạo những kỷ niệm với bạn bè và gặp gỡ những người mới.',
  chooseExperience: 'Chọn trải nghiệm của bạn',
  selectTier: 'Chọn hạng vé phù hợp với bạn',
  recommended: 'ĐỀ XUẤT',
  perPerson: 'mỗi người',
  from: 'Từ',
  bookNow: 'Đặt ngay',
  eventNotFound: 'Không tìm thấy sự kiện',
  goBack: 'Quay lại',
  shareEvent: 'Chia sẻ sự kiện',
  likeEvent: 'Thích sự kiện',
  unlikeEvent: 'Bỏ thích sự kiện',
  saveEvent: 'Lưu sự kiện',
  removeSavedEvent: 'Xóa sự kiện đã lưu',
  shareEventHint: 'Mở bảng chia sẻ',
  openEventPrice: 'Mở sự kiện {{title}}',
  openEventPriceHint: 'Mở chi tiết sự kiện này',
  likeEventHint: 'Thêm sự kiện này vào danh sách đã lưu của bạn',
  unlikeEventHint: 'Xóa sự kiện này khỏi danh sách đã lưu của bạn',
  shareMessage: 'Xem {{title}} tại {{location}} vào {{date}} lúc {{time}}!',
  priceTiers: {
    contactForPricing: 'Liên hệ để biết giá',
    vip: {
      label: 'VIP',
      perk1: 'Chỗ ngồi ưu tiên',
      perk2: 'Đồ uống chào mừng',
      perk3: 'Vào khu hậu trường',
    },
    member: {
      label: 'Thành viên',
      perk1: 'Khu vực đặt trước',
      perk2: 'Đồ ăn nhẹ miễn phí',
    },
    guest: {
      label: 'Khách',
      perk1: 'Vào cửa chung',
      perk2: 'Quầy bar thanh toán',
    },
  },
} as const;

export default events;
