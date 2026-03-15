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
  featuredPrice: 'GIÁ',
  privatePartyTitle: 'Lên kế hoạch tiệc riêng?',
  privatePartyDescription: 'Sinh nhật, đám cưới, doanh nghiệp — chúng tôi đều phục vụ',
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
