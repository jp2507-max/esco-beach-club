const perks = {
  title: 'Ưu đãi',
  categories: {
    all: 'Tất cả',
    hotels: 'Khách sạn',
    travel: 'Du lịch',
    dining: 'Ẩm thực',
    wellness: 'Chăm sóc sức khỏe',
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
  },
} as const;

export default perks;
