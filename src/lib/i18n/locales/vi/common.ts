const common = {
  accessibility: {
    textInputDefault: 'Trường nhập văn bản',
    textInputHint: 'Nhập văn bản',
    textInputHintWithField: 'Nhập {{field}}',
  },
  branding: {
    mark: 'Esco Beach',
    markHint: 'Nhận diện thương hiệu Esco Beach Club',
  },
  validation: {
    required: 'Trường này là bắt buộc.',
    email: 'Vui lòng nhập địa chỉ email hợp lệ.',
    number: 'Vui lòng nhập số.',
    positiveNumber: 'Vui lòng nhập số dương.',
    min: 'Phải có ít nhất {{min}}.',
    max: 'Không được vượt quá {{max}}.',
    maxCharacters: 'Tối đa {{count}} ký tự.',
    profileNameMin: 'Tên phải có ít nhất 2 ký tự.',
    profileNameMax: 'Tên tối đa 60 ký tự.',
    profileBioMax: 'Tiểu sử tối đa 160 ký tự.',
    commentMax: 'Nhận xét tối đa 500 ký tự.',
    invalidDate: 'Vui lòng nhập ngày hợp lệ theo định dạng YYYY-MM-DD.',
    invalidCode: 'Vui lòng nhập mã xác minh 6 chữ số.',
    deleteConfirmation: 'Hãy nhập chính xác DELETE để tiếp tục.',
    loyaltyManagerPin:
      'Vui lòng nhập mã PIN quản lý hợp lệ để phê duyệt số tiền này.',
    loyaltyMinimumSpend: 'Hóa đơn này chưa đạt ngưỡng điểm thưởng tối thiểu.',
  },
  back: 'Quay lại',
  backHint: 'Quay về màn hình trước',
  rateUs: {
    title: 'Đánh giá trải nghiệm của bạn',
    howWasVisit: 'Chuyến thăm của bạn thế nào?',
    feedbackHint:
      'Phản hồi của bạn giúp chúng tôi tạo trải nghiệm câu lạc bộ biển tốt nhất.',
    starAccessibilityLabel: 'Đánh giá {{count}} trên 5',
    starAccessibilityHint: 'Nhấn để chọn mức đánh giá này',
    starLabels: ['Tệ', 'Kém', 'Ổn', 'Tốt', 'Tuyệt vời!'],
    placeholder: 'Cho chúng tôi biết thêm về trải nghiệm của bạn...',
    submitLabel: 'Gửi đánh giá',
    thankYou: 'Cảm ơn bạn!',
    thankYouMessage:
      'Phản hồi của bạn rất ý nghĩa. Chúng tôi sẽ tiếp tục cải thiện Esco Life.',
    done: 'Xong',
    ratingRequired: 'Cần đánh giá',
    ratingRequiredMessage: 'Vui lòng chọn số sao trước khi gửi.',
    reviewFailed: 'Gửi đánh giá thất bại',
    reviewSubmitError: 'Không thể gửi đánh giá ngay bây giờ.',
  },
  bookingSuccess: {
    backHome: 'Quay về trang chủ',
    guest: 'Khách',
    subtitle:
      'Yêu cầu đặt chỗ của bạn đã được ghi nhận. Bạn sẽ nhận được xác nhận trong vòng một giờ.',
    title: 'Mọi thứ đã sẵn sàng, {{name}}!',
  },
  bookingContact: {
    chatPrompt:
      'Muốn phản hồi nhanh hơn? Nhắn trực tiếp với chúng tôi qua Instagram hoặc Facebook.',
    inlinePrompt: 'Cần hỗ trợ ngay?',
    instagramInlineCta: 'Nhắn chúng tôi trên Instagram',
    facebookInlineCta: 'Nhắn chúng tôi trên Facebook',
    emailInlineCta: 'hoặc gửi email cho chúng tôi',
    emailButton: 'Gửi email',
    emailHint: 'Mở ứng dụng email để liên hệ đội đặt chỗ',
    instagramButton: 'Instagram',
    instagramHint: 'Mở trang Instagram của chúng tôi để nhắn trực tiếp',
    facebookButton: 'Facebook',
    facebookHint: 'Mở trang Facebook của chúng tôi để nhắn trực tiếp',
    openLinkError: 'Hiện không thể mở kênh liên hệ này.',
  },
  appError: {
    title: 'Đã xảy ra sự cố ngoài dự kiến',
    description:
      'Vui lòng mở lại ứng dụng hoặc thử lại sau ít phút. Đội ngũ của chúng tôi đã được thông báo.',
  },
  launch: {
    eyebrow: 'Khởi động thành viên',
    loading:
      'Đang chuẩn bị quyền truy cập câu lạc bộ, ưu đãi và các cập nhật mới nhất cho bạn.',
  },
  searchInput: {
    clearLabel: 'Xóa tìm kiếm',
    clearHint: 'Xóa nội dung tìm kiếm hiện tại',
  },
  menu: 'Thực đơn',
  privateEvent: {
    title: 'Sự kiện riêng',
    header: 'Lên kế hoạch tiệc riêng của bạn',
    subtitle:
      'Từ sinh nhật thân mật đến sự kiện doanh nghiệp lớn — hãy để chúng tôi lo.',
    eventDetails: 'Chi tiết sự kiện',
    eventType: 'Loại sự kiện',
    selectType: 'Chọn loại...',
    eventTypes: {
      companyParty: 'Tiệc công ty',
      birthday: 'Sinh nhật',
      wedding: 'Đám cưới',
      anniversary: 'Kỷ niệm',
      corporateRetreat: 'Hội nghị công ty',
      other: 'Khác',
    },
    preferredDate: 'Ngày mong muốn',
    preferredDatePlaceholder: 'YYYY-MM-DD',
    preferredDateHint: 'Nhập ngày theo định dạng YYYY-MM-DD.',
    estimatedGuests: 'Số khách ước tính',
    estimatedGuestsPlaceholder: 'VD: 50',
    contactInfoOptional: 'Thông tin liên hệ (tùy chọn)',
    name: 'Tên',
    namePlaceholder: 'Họ tên của bạn',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    additionalNotes: 'Ghi chú thêm',
    additionalNotesPlaceholder: 'Chủ đề, yêu cầu ăn uống, yêu cầu đặc biệt...',
    sendInquiry: 'Gửi yêu cầu',
    teamResponse: 'Bạn sẽ nhận được xác nhận qua email trong vòng một giờ.',
    submissionFailed: 'Gửi thất bại',
    submitError: 'Không thể gửi yêu cầu ngay bây giờ.',
    missingInfo: 'Thiếu thông tin',
    missingInfoMessage:
      'Vui lòng điền loại sự kiện, ngày và số khách ước tính.',
    inquirySent: 'Đã gửi yêu cầu!',
    inquirySentMessage:
      'Yêu cầu của bạn đã được ghi nhận. Bạn sẽ nhận được xác nhận qua email trong vòng một giờ.',
    backToEvents: 'Quay lại Sự kiện',
  },
  tabs: {
    home: 'Trang chủ',
    events: 'Sự kiện',
    qr: 'QR',
    scan: 'Quét',
    perks: 'Ưu đãi',
    profile: 'Hồ sơ',
  },
  close: 'Đóng',
  datePicker: {
    dismissHint: 'Nhấn đúp để đóng bộ chọn ngày mà không thay đổi ngày',
  },
  done: 'Xong',
  modal: {
    title: 'Esco Life',
    description:
      'Chào mừng đến Esco Life Beach Club. Tận hưởng các ưu đãi dành riêng cho thành viên.',
    closeLabel: 'Đóng',
    closeHint: 'Đóng hộp thoại này',
  },
  notFound: {
    title: 'Màn hình này không tồn tại.',
    cta: 'Đi đến trang chủ',
  },
  member: 'Thành viên',
  legal: {
    eyebrow: 'Pháp lý Esco',
    hostedOnExpo:
      'Các trang công khai này đang được phục vụ từ bản triển khai production hiện tại trên EAS Hosting.',
    contact: {
      title: 'Cần hỗ trợ?',
      description:
        'Với câu hỏi pháp lý, quyền riêng tư hoặc tài khoản, hãy liên hệ {{email}}.',
      emailCta: 'Email hỗ trợ quyền riêng tư',
      questionsCta: 'Hỏi về điều khoản',
      supportCta: 'Liên hệ hỗ trợ',
      supportSubject: 'Hỗ trợ Esco Beach Club',
    },
    privacy: {
      title: 'Chính sách quyền riêng tư',
      intro:
        'Chính sách này giải thích Esco Beach Club thu thập dữ liệu gì, ứng dụng sử dụng thông tin thành viên như thế nào và quyền nào là tùy chọn.',
      sections: {
        collection: {
          title: 'Dữ liệu chúng tôi thu thập',
          body1:
            'Chúng tôi thu thập thông tin tài khoản và hồ sơ cần thiết để vận hành trải nghiệm thành viên, bao gồm email, mã thành viên, mã giới thiệu, tên hồ sơ, ngày sinh và các thông tin khác mà bạn tự gửi trong biểu mẫu đặt chỗ hoặc yêu cầu sự kiện riêng.',
          body2:
            'Ứng dụng có thể yêu cầu quyền vị trí, thông báo và camera ở dạng tùy chọn. Trong bản phát hành hiện tại, vị trí được dùng trên thiết bị cho tính năng nhận biết khi đến địa điểm, thông báo được dùng cho lời nhắc và ưu đãi cục bộ, còn camera chỉ dành cho luồng quét QR của nhân viên.',
        },
        use: {
          title: 'Cách chúng tôi sử dụng dữ liệu',
          body1:
            'Dữ liệu tài khoản và hồ sơ được dùng để xác thực thành viên, quản lý quyền lợi, hỗ trợ đặt chỗ và yêu cầu sự kiện riêng, đồng thời cung cấp các tính năng giới thiệu, loyalty và quản lý tài khoản.',
          body2:
            'Thông tin lỗi, chẩn đoán, cùng một lượng giới hạn dữ liệu phản hồi trong ứng dụng hoặc phát lại phiên từ các công cụ giám sát có thể được xử lý để theo dõi độ ổn định, điều tra sự cố và cải thiện trải nghiệm ứng dụng.',
        },
        sharing: {
          title: 'Cách dữ liệu được chia sẻ',
          body1:
            'Chúng tôi chỉ chia sẻ dữ liệu khi cần để vận hành dịch vụ, hỗ trợ trải nghiệm tại địa điểm hoặc đối tác, tuân thủ nghĩa vụ pháp lý, hoặc bảo vệ ứng dụng và thành viên khỏi gian lận hay lạm dụng.',
          body2:
            'Ứng dụng không được dùng cho theo dõi chéo ứng dụng. Các nhà cung cấp bên thứ ba xử lý dữ liệu thay mặt chúng tôi cho hạ tầng, xác thực hoặc giám sát phải bảo vệ dữ liệu bằng mức bảo vệ quyền riêng tư và bảo mật tương đương với chính sách này.',
        },
        choices: {
          title: 'Lựa chọn của bạn',
          body1:
            'Bạn có thể từ chối các quyền tùy chọn, cập nhật thông tin hồ sơ và rút lại sự đồng ý đối với các quyền tùy chọn sau đó bằng cách thay đổi cài đặt quyền trên thiết bị hoặc liên hệ hỗ trợ. Một số tính năng thành viên có thể hoạt động hạn chế nếu quyền tùy chọn bị từ chối.',
          body2:
            'Nếu bạn đã tạo tài khoản, bạn có thể bắt đầu xóa tài khoản ngay trong ứng dụng. Yêu cầu xóa sẽ trải qua cửa sổ khôi phục 30 ngày trước khi xóa hoàn toàn, và chúng tôi có thể lưu giữ một số bản ghi giới hạn khi cần để tuân thủ pháp luật, ngăn chặn gian lận hoặc ghi nhận hoạt động tài khoản và xóa.',
        },
      },
    },
    terms: {
      title: 'Điều khoản dịch vụ',
      intro:
        'Các điều khoản này điều chỉnh việc bạn sử dụng Esco Beach Club, bao gồm thành viên, đặt chỗ, ưu đãi, giới thiệu và các dịch vụ chỉ dành cho thành viên khác có trong ứng dụng.',
      sections: {
        membership: {
          title: 'Thành viên và điều kiện đủ',
          body1:
            'Bạn chịu trách nhiệm cung cấp thông tin tài khoản chính xác và giữ an toàn cho quyền truy cập đăng nhập của mình. Trạng thái thành viên, quyền lợi và ưu đãi có thể phụ thuộc vào điều kiện đủ và quy định của địa điểm hoặc đối tác.',
          body2:
            'Esco Beach Club có thể tạm ngưng hoặc giới hạn quyền truy cập nếu thông tin tài khoản không chính xác, quyền lợi bị lạm dụng hoặc cần thiết để bảo vệ thành viên, đối tác, nhân viên hoặc nền tảng.',
        },
        bookings: {
          title: 'Đặt chỗ, ưu đãi và sự kiện riêng',
          body1:
            'Yêu cầu đặt chỗ, yêu cầu sự kiện riêng, ưu đãi đối tác và phần thưởng đều phụ thuộc vào tình trạng còn chỗ, quyết định của địa điểm, sự tham gia của đối tác và mọi điều khoản bổ sung hiển thị trong ứng dụng hoặc tại địa điểm.',
          body2:
            'Việc gửi yêu cầu trong ứng dụng không đảm bảo được chấp nhận cho đến khi được xác nhận. Quyền lợi và phần thưởng có thể thay đổi, hết hạn hoặc bị thu hồi nếu bị sử dụng gian lận hoặc sai mục đích.',
        },
        acceptableUse: {
          title: 'Sử dụng được chấp nhận',
          body1:
            'Bạn không được lạm dụng ứng dụng, đảo ngược kỹ thuật các tính năng bị hạn chế, mạo danh thành viên khác, can thiệp vào công cụ của nhân viên, tự động hóa hành vi lạm dụng hoặc tìm cách nhận ưu đãi/phần thưởng bằng gian lận, bán lại hoặc thao túng.',
          body2:
            'Mọi tính năng QR thành viên, giới thiệu hoặc loyalty chỉ được dùng đúng cho tài khoản và luồng sử dụng tại địa điểm tương ứng. Lạm dụng có thể dẫn đến thu hồi phần thưởng, tạm ngưng quyền truy cập hoặc xóa tài khoản vĩnh viễn.',
        },
        accounts: {
          title: 'Tài khoản, xóa và thay đổi',
          body1:
            'Bạn có thể ngừng sử dụng dịch vụ bất cứ lúc nào. Nếu đã tạo tài khoản, bạn có thể bắt đầu xóa tài khoản trong ứng dụng theo đúng luồng xóa và thời gian khôi phục hiện có.',
          body2:
            'Chúng tôi có thể cập nhật điều khoản này khi dịch vụ thay đổi. Việc tiếp tục sử dụng sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận phiên bản sửa đổi.',
        },
        liability: {
          title: 'Tuyên bố miễn trừ và giới hạn trách nhiệm',
          body1:
            'Ứng dụng, ưu đãi đối tác và thông tin sự kiện được cung cấp trên cơ sở sẵn có. Chúng tôi không đảm bảo dịch vụ luôn liên tục, đối tác luôn tham gia, hoặc mọi nội dung luôn đầy đủ và cập nhật.',
          body2:
            'Trong phạm vi pháp luật cho phép, Esco Beach Club không chịu trách nhiệm cho các tổn thất gián tiếp, ngẫu nhiên hoặc hệ quả phát sinh từ việc sử dụng ứng dụng, trải nghiệm của đối tác bên thứ ba hoặc việc gián đoạn dịch vụ tạm thời.',
        },
      },
    },
    support: {
      title: 'Hỗ trợ',
      intro:
        'Trang này dùng cho thông tin liên hệ App Review, câu hỏi hỗ trợ thành viên, và các yêu cầu pháp lý hoặc tài khoản liên quan đến Esco Beach Club.',
      sections: {
        access: {
          title: 'Truy cập tài khoản',
          body1:
            'Nếu bạn gặp sự cố đăng nhập, trước tiên hãy kiểm tra email được dùng cho tài khoản thành viên và xác nhận phương thức đăng nhập khớp với tài khoản đó.',
          body2:
            'Nếu sự cố vẫn tiếp diễn, hãy liên hệ hỗ trợ và cung cấp email của tài khoản, nền tảng thiết bị và mô tả ngắn về vấn đề.',
        },
        bookings: {
          title: 'Đặt chỗ và yêu cầu tại địa điểm',
          body1:
            'Đối với câu hỏi về đặt chỗ, sự kiện riêng hoặc ưu đãi đối tác, hãy gửi kèm ngày, bối cảnh địa điểm và mọi thông tin xác nhận hiển thị trong ứng dụng để đội ngũ kiểm tra nhanh hơn.',
          body2:
            'Hỗ trợ có thể giúp xem lại trạng thái yêu cầu trong ứng dụng, nhưng phê duyệt cuối cùng, khả năng phục vụ và vận hành tại địa điểm vẫn có thể phụ thuộc vào nhân viên Esco hoặc đối tác tham gia.',
        },
        privacy: {
          title: 'Quyền riêng tư và xóa tài khoản',
          body1:
            'Hãy dùng luồng xóa tài khoản trong ứng dụng nếu bạn muốn xóa tài khoản. Nếu cần hỗ trợ với yêu cầu xóa, vấn đề quyền riêng tư hoặc khôi phục trong thời gian gia hạn, bạn có thể liên hệ trực tiếp với hỗ trợ.',
          body2:
            'Đối với câu hỏi pháp lý hoặc quyền riêng tư, hãy nêu rõ tính năng liên quan và email liên hệ trên trang này để chúng tôi phản hồi đúng ngữ cảnh.',
        },
      },
    },
  },
} as const;

export default common;
