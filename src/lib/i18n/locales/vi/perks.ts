const perks = {
  title: 'Ưu đãi',
  loading: 'Đang tải ưu đãi...',
  emptyTitle: 'Không có ưu đãi nào khớp bộ lọc này',
  emptyDescription:
    'Hãy thử danh mục khác hoặc quay lại sau để xem thêm ưu đãi đối tác mới.',
  categories: {
    all: 'Tất cả',
    hotels: 'Khách sạn',
    travel: 'Du lịch',
    dining: 'Ẩm thực',
    wellness: 'Chăm sóc sức khỏe',
  },
  danangCta: {
    badge: 'Cẩm nang thành phố nổi bật',
    title: 'Da Nang 365',
    description:
      'Khám phá các địa điểm chọn lọc, sự kiện và điểm đến không thể bỏ lỡ.',
    action: 'Mở Da Nang 365',
    hint: 'Mở Da Nang 365 trong trình duyệt của bạn',
    openFailedTitle: 'Không thể mở liên kết',
    openFailedBody: 'Vui lòng thử lại sau ít phút.',
  },
  history: {
    title: 'Lịch sử ưu đãi',
    openAction: 'Lịch sử',
    openHint: 'Mở màn hình lịch sử ưu đãi của bạn',
    backAction: 'Quay lại',
    backHint: 'Quay lại màn hình ưu đãi',
    recentActivity: 'Hoạt động gần đây',
    fullArchive: 'Xem toàn bộ lịch sử',
    hero: {
      status: 'TRẠNG THÁI ĐẶC QUYỀN',
      total: '{{count}} Ưu đãi',
      subtitle: 'Đã mở khóa trong năm nay',
    },
    loading: 'Đang tải lịch sử ưu đãi...',
    emptyTitle: 'Chưa có lịch sử ưu đãi',
    emptyDescription:
      'Ưu đãi đối tác bạn đã nhận sẽ xuất hiện tại đây sau lần mở khóa đầu tiên.',
    unknownPartner: 'Ưu đãi đối tác',
    unknownPerk: 'Quyền lợi thành viên',
    status: {
      claimed: 'Đã nhận',
      used: 'Đã dùng',
      expired: 'Hết hạn',
    },
    items: {
      grandMarinaResort: {
        name: 'Grand Marina Resort',
        date: '24 Thg 10, 2026',
        perk: 'Nâng hạng phòng giảm 20%',
      },
      saffronSkyDining: {
        name: 'Saffron Sky Dining',
        date: '12 Thg 10, 2026',
        perk: 'Tặng thực đơn tasting',
      },
      azureAirways: {
        name: 'Azure Airways',
        date: '30 Thg 9, 2026',
        perk: 'Vé vào phòng chờ',
      },
      velvetSandsSpa: {
        name: 'Velvet Sands Spa',
        date: '15 Thg 8, 2026',
        perk: 'Liệu trình deep tissue 60 phút',
      },
    },
  },
  partner: {
    notFound: 'Không tìm thấy đối tác',
    unlocked: 'ĐÃ MỞ KHÓA',
    congratulations: 'Chúc mừng!',
    benefitsDescription:
      'Tận hưởng các ưu đãi độc quyền tại {{name}}. {{description}}.',
    claiming: 'Đang nhận ưu đãi...',
    exclusive: 'Độc quyền',
    discount: 'Giảm giá',
    vipPerk: 'Đặc quyền VIP',
    redemptionFailedTitle: 'Nhận ưu đãi thất bại',
    redemptionFailedMessage:
      'Hiện không thể lưu ưu đãi của bạn. Vui lòng thử lại.',
    yourDiscountCode: 'MÃ GIẢM GIÁ CỦA BẠN',
    enjoyMyPerks: 'Tận hưởng ưu đãi',
    maybeLater: 'Để sau',
    maybeLaterHint: 'Quay lại màn hình trước',
    close: 'Đóng',
    closeHint: 'Đóng cửa sổ chi tiết đối tác',
  },
} as const;

export default perks;
