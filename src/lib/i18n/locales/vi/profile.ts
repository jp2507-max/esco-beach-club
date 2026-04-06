const profile = {
  guest: 'Khách',
  memberFallback: 'THÀNH VIÊN',
  tier: {
    member: 'Esco Life Member',
    legend: 'Esco Life Legend',
  },
  menu: {
    comingSoon: 'Sắp ra mắt',
    editProfile: 'Chỉnh sửa hồ sơ',
    inviteEarn: 'Mời bạn & nhận thưởng',
    rateUs: 'Đánh giá chúng tôi',
    membership: 'Hội viên',
    rewards: 'Phần thưởng',
    savedEvents: 'Sự kiện đã lưu',
    settings: 'Cài đặt',
    helpSupport: 'Trợ giúp & hỗ trợ',
    restartOnboarding: 'Bắt đầu lại onboarding',
    logOut: 'Đăng xuất',
    deleteAccount: 'Xóa tài khoản',
  },
  restartOnboarding: {
    confirmTitle: 'Bắt đầu lại onboarding?',
    confirmMessage:
      'Chúng tôi sẽ đưa bạn quay lại luồng onboarding để cập nhật các lựa chọn thiết lập.',
    cancel: 'Hủy',
    start: 'Bắt đầu',
  },
  notifications: {
    title: 'Thông báo',
    hint: 'Mở thông báo',
  },
  welcomeBack: 'Chào mừng trở lại,',
  edit: 'Chỉnh sửa',
  brandPrefix: 'Esco',
  brandHighlight: 'Life',
  accessPass: 'THẺ TRUY CẬP',
  scanAtTable: 'Quét tại quầy thanh toán để liên kết mã thành viên của bạn',
  refPrefix: 'Mã: {{memberId}}',
  billScanner: {
    balanceLabel: 'Điểm',
    cameraPermissionDescription:
      'Cho phép truy cập camera để mã QR trên hóa đơn có thể được quét ngay khi mở tab này.',
    cameraPermissionTitle: 'Mở camera để nhận điểm ngay',
    errorEyebrow: 'Thử quét lại',
    errorTitle: 'Không thể xử lý mã QR hóa đơn này',
    eyebrow: 'QUÉT THƯỞNG TRỰC TIẾP',
    fallbackCta: 'Hiển thị QR thành viên của tôi',
    fallbackDescription:
      'Chỉ dùng mã QR thành viên nếu địa điểm vẫn cần liên kết điểm thủ công.',
    fallbackEyebrow: 'Phương án dự phòng',
    fallbackHint: 'Mở thẻ QR thành viên làm phương án dự phòng',
    fallbackTitle: 'QR thành viên dự phòng',
    frameHint: 'Đặt mã QR hóa đơn vào trong khung',
    grantPermission: 'Bật camera',
    grantPermissionHint:
      'Yêu cầu quyền camera hoặc mở cài đặt nếu trước đó đã bị từ chối',
    liveBadge: 'Máy quét đang hoạt động',
    loadingDescription:
      'Đang chuẩn bị camera và cấu hình máy quét điểm thưởng của bạn.',
    loadingTitle: 'Đang khởi động máy quét',
    memberQrUnavailable: 'Mã QR thành viên của bạn hiện chưa khả dụng.',
    permissionEyebrow: 'Cần camera',
    pointsRuleLabel: 'Tỷ lệ nhận điểm',
    pointsRuleValue: '{{points}} điểm / {{amount}}',
    processingDescription:
      'Giữ yên trong khi chúng tôi xác minh hóa đơn và cập nhật số dư của bạn.',
    processingEyebrow: 'Đang xác minh hóa đơn',
    processingTitle: 'Đang cộng điểm vào tài khoản của bạn',
    readyDescription:
      'Máy quét đã sẵn sàng. Hướng camera vào mã QR in trên hóa đơn để nhận điểm.',
    readyTitle: 'Quét mã QR hóa đơn để nhận điểm',
    scanAgain: 'Quét hóa đơn khác',
    scanAgainHint: 'Đặt lại máy quét để bạn có thể quét hóa đơn khác',
    securityNote:
      'Mỗi mã tham chiếu hóa đơn chỉ có thể được dùng để nhận điểm một lần.',
    subtitle:
      'Tab này giờ mở thẳng vào camera để hội viên có thể tự quét hóa đơn và nhận điểm.',
    successDescription:
      '{{amount}} từ hóa đơn {{reference}} đã được cộng vào số dư điểm thưởng của bạn.',
    successEyebrow: 'Đã cộng điểm',
    successTitle: 'Đã nhận {{points}} điểm',
    title: 'Quét hóa đơn. Giữ lại điểm thưởng.',
    errors: {
      billBelowMinimumSpend:
        'Hóa đơn này chưa đạt mức chi tiêu tối thiểu để nhận điểm.',
      billNotPaid:
        'Hóa đơn này chưa được đánh dấu là đã thanh toán. Vui lòng thanh toán trước rồi thử lại.',
      billNotSynced:
        'Hóa đơn này chưa được đồng bộ từ POS của nhà hàng. Vui lòng thử lại sau vài giây.',
      generic: 'Đã có lỗi khi xử lý hóa đơn này. Vui lòng thử lại.',
      invalidBillQr: 'Mã QR này không phải mã hóa đơn hợp lệ của Esco.',
      invalidRewardServiceResponse:
        'Dịch vụ điểm thưởng trả về phản hồi không hợp lệ. Vui lòng thử lại.',
      networkUnavailable:
        'Không thể kết nối đến dịch vụ điểm thưởng. Vui lòng kiểm tra kết nối và thử lại.',
      receiptAlreadyClaimed: 'Hóa đơn này đã được dùng để nhận điểm trước đó.',
      rewardServiceUnavailable:
        'Dịch vụ điểm thưởng hiện không khả dụng. Vui lòng thử lại sau.',
      sessionExpired:
        'Phiên đăng nhập an toàn của bạn đã hết hạn. Vui lòng đăng nhập lại và thử lại.',
    },
  },
  earned: 'ĐIỂM THƯỞNG ĐÃ NHẬN',
  saved: 'ĐÃ TIẾT KIỆM',
  profileDetails: 'Chi tiết hồ sơ',
  memberSince: 'Thành viên từ',
  nightsLeft: 'Đêm còn lại',
  savedEventsCount: 'Sự kiện đã lưu',
  memberCard: {
    cashbackBalance: 'Số dư điểm thưởng',
    cashbackSuffix: 'điểm thưởng',
    memberName: 'TÊN THÀNH VIÊN',
    lifetimeTier: 'Hạng trọn đời',
  },
  benefits: {
    title: 'Đặc quyền đã mở khóa',
    viewAll: 'Xem tất cả',
    concierge: 'Dịch vụ Concierge 24/7',
    priorityBooking: 'Quyền ưu tiên đặt chỗ',
    poolsideDrinks: 'Đồ uống miễn phí tại hồ bơi',
    poolsideDrinksDesc: 'Cocktail đặc trưng tặng kèm hằng ngày',
    memberEvents: 'Truy cập sự kiện thành viên',
    memberEventsDesc:
      'Quyền truy cập độc quyền các sự kiện dành riêng cho hội viên',
    discountDining: 'Giảm giá ẩm thực',
    discountDiningDesc: 'Giảm 10% cho tất cả menu đồ ăn & thức uống',
  },
  manageAccount: {
    title: 'Quản lý tài khoản',
    upgradeTier: 'Nâng hạng thẻ',
    billingHistory: 'Lịch sử thanh toán',
    managePayments: 'Quản lý phương thức thanh toán',
  },
  activity: {
    title: 'Hoạt động gần đây',
    cashbackAdjusted: 'Điều chỉnh điểm thủ công',
    cashbackAdjustedDesc:
      '{{points}} điểm đã được thay đổi qua điều chỉnh thủ công.',
    cashbackEarned: 'Điểm đã nhận',
    cashbackEarnedDesc: '+{{points}} điểm từ một giao dịch hợp lệ gần đây.',
    cashbackReversed: 'Điểm đã bị hoàn lại',
    cashbackReversedDesc:
      '-{{points}} điểm sau khi hoàn tiền hoặc hủy giao dịch.',
    daysAgo: '{{count}} ngày trước',
    loading: 'Đang tải hoạt động gần đây...',
    emptyTitle: 'Chưa có hoạt động hội viên',
    emptyDescription:
      'Hoạt động điểm mới và tiến độ hạng tháng sẽ xuất hiện tại đây sau giao dịch hợp lệ tiếp theo của bạn.',
    progressReset: 'Đặt lại tiến độ hạng',
    progressResetDesc: 'Chu kỳ tiến độ hạng tháng của bạn đã được đặt lại.',
    sampleData: 'Dữ liệu mẫu',
  },
  noBio: 'Thêm một đoạn giới thiệu ngắn để cá nhân hóa hồ sơ của bạn.',
  welcomeGift: 'QUÀ CHÀO MỪNG',
  welcomeDiscount: 'GIẢM 10%',
  firstVisit: 'Lần ghé thăm đầu tiên của bạn',
  codeLabel: 'MÃ: {{code}}',
  validForThirtyDays: 'Có hiệu lực 30 ngày kể từ ngày đăng ký',
  gotIt: 'Đã hiểu!',
  contactVipConcierge: 'Liên hệ concierge VIP',
  contactSupport: 'Liên hệ hỗ trợ',
  conciergeMessage: 'Xin chào Esco Life VIP Concierge',
  helpCenter: {
    title: 'Trung tâm trợ giúp',
    heroTitle: 'Chúng tôi có thể hỗ trợ kỳ nghỉ của bạn thế nào?',
    searchPlaceholder: 'Tìm kiếm trợ giúp...',
    emailSupport: {
      title: 'Hỗ trợ qua email',
      description:
        'Gửi cho chúng tôi yêu cầu chi tiết và chúng tôi sẽ phản hồi trong vòng 2 giờ.',
    },
    categories: {
      title: 'Danh mục hỗ trợ',
      booking: 'Đặt chỗ & đặt bàn',
      membership: 'Hội viên & hạng thẻ',
      perks: 'Quyền lợi & thưởng',
      technical: 'Ứng dụng & kỹ thuật',
    },
    faq: {
      title: 'Câu hỏi phổ biến',
      viewAll: 'Xem tất cả',
      noResults: 'Chưa có câu hỏi nào phù hợp với tìm kiếm của bạn.',
      items: {
        redeemDrink: {
          question: 'Làm sao để nhận đồ uống miễn phí?',
          answer:
            'Hãy xuất trình thẻ hội viên số tại quầy bar Esco Life. Ưu đãi đủ điều kiện sẽ được áp dụng tự động sau khi xác nhận.',
        },
        upgradeTier: {
          question: 'Tiến độ lên hạng theo tháng hoạt động thế nào?',
          answer:
            'Hạng hiện tại của bạn được giữ trọn đời. Điểm tiến độ cho hạng tiếp theo được theo dõi riêng và sẽ đặt lại sau 1 tháng kể từ khi chu kỳ tiến độ bắt đầu.',
        },
        modifyCabana: {
          question: 'Tôi có thể chỉnh sửa đặt chỗ cabana không?',
          answer:
            'Có. Hãy mở chi tiết đặt chỗ và gửi yêu cầu cập nhật ít nhất 24 giờ trước thời gian bắt đầu.',
        },
        gymHours: {
          question: 'Giờ hoạt động của phòng gym là gì?',
          answer:
            'Phòng gym mở cửa hằng ngày từ 6:00 sáng đến 10:00 tối. Lịch ngày lễ có thể thay đổi và sẽ được thông báo trong ứng dụng.',
        },
      },
    },
  },

  errors: {
    openMail: 'Không thể mở ứng dụng email',
    openWhatsApp: 'Không thể mở WhatsApp',
    languageChangeFailed: 'Không thể thay đổi ngôn ngữ. Vui lòng thử lại.',
    saveProfileFailed: 'Không thể lưu hồ sơ của bạn. Vui lòng thử lại.',
    signOutFailed: 'Không thể đăng xuất. Vui lòng thử lại.',
  },
  deleteAccount: {
    title: 'Xóa tài khoản',
    heroTitle: 'Xóa tài khoản Esco của bạn',
    heroDescription:
      'Thao tác này bắt đầu quy trình xóa tài khoản đầy đủ và sẽ gỡ quyền truy cập hội viên của bạn khi thời gian chờ kết thúc.',
    permanentDataLossTitle: 'Mất dữ liệu vĩnh viễn',
    permanentDataLossDescription:
      'Sau khi thời gian chờ kết thúc, tài khoản Esco và dữ liệu hội viên liên kết sẽ bị xóa vĩnh viễn.',
    gracePeriodTitle: 'Thời gian chờ 30 ngày',
    gracePeriodDescription:
      'Bạn sẽ có 30 ngày để đăng nhập lại và khôi phục tài khoản trước khi việc xóa được hoàn tất.',
    defaultGracePeriod: '30 ngày',
    whatWillBeDeletedTitle: 'Những gì sẽ bị xóa',
    whatWillBeDeletedItems: {
      profileData: 'Thông tin hồ sơ và tài khoản',
      savedEvents: 'Sự kiện đã lưu và tiến độ giới thiệu',
      bookings: 'Lịch sử đặt chỗ và yêu cầu sự kiện riêng',
      memberBenefits: 'Quyền lợi và quyền truy cập hội viên gắn với tài khoản',
    },
    confirmLabel: 'Xác nhận cuối cùng',
    confirmHint:
      'Hãy nhập DELETE bên dưới để xác nhận bạn muốn lên lịch xóa tài khoản này.',
    confirmPlaceholder: 'Nhập DELETE',
    finalNotice: 'Hành động này sẽ trở thành cuối cùng sau 30 ngày.',
    confirmAction: 'Lên lịch xóa tài khoản',
    pendingEyebrow: 'Đã lên lịch xóa',
    pendingTitle: 'Tài khoản của bạn đang chờ bị xóa',
    pendingDescription:
      'Nếu không khôi phục trước, tài khoản của bạn sẽ bị xóa vĩnh viễn vào {{date}}.',
    pendingRestoreHint:
      'Bạn có thể khôi phục tài khoản bất cứ lúc nào trước thời hạn để hủy việc xóa.',
    restoreAction: 'Khôi phục tài khoản',
    reviewAction: 'Xem chi tiết',
    backToApp: 'Quay lại ứng dụng',
    bannerTitle: 'Tài khoản đã được lên lịch xóa',
    bannerDescription:
      'Tài khoản của bạn sẽ bị xóa vào {{date}} nếu bạn không khôi phục trước.',
    bannerCountdown: 'Còn 30 ngày để khôi phục',
    bannerRestoreHint:
      'Dùng Khôi phục tài khoản để hủy yêu cầu và giữ quyền truy cập hội viên.',
    scheduleSuccessTitle: 'Đã tạo yêu cầu xóa',
    scheduleSuccessMessage:
      'Tài khoản của bạn đã được lên lịch xóa. Hãy đăng nhập lại trong vòng 30 ngày nếu bạn muốn khôi phục.',
    restoreSuccessTitle: 'Đã khôi phục tài khoản',
    footerNote:
      'Cần hỗ trợ trước? Hãy liên hệ bộ phận hỗ trợ trước khi xóa tài khoản.',
    loadingState: 'Đang kiểm tra trạng thái xóa tài khoản...',
    errors: {
      appleVerificationCanceled:
        'Đã hủy xác minh Apple nên việc xóa chưa được lên lịch.',
      apiUnavailable:
        'Tính năng xóa tài khoản chưa được cấu hình cho bản dựng này. Hãy khởi động Expo dev server có API routes hoặc đặt EXPO_PUBLIC_ACCOUNT_API_BASE_URL.',
      instantAuthUnavailable:
        'Tính năng xóa tài khoản tạm thời không khả dụng vì API cục bộ không thể kết nối tới InstantDB. Hãy kiểm tra DNS hoặc kết nối internet của máy này rồi thử lại.',
      networkUnavailable:
        'Không thể kết nối tới dịch vụ xóa tài khoản. Hãy kiểm tra kết nối rồi thử lại.',
      restoreFailed: 'Không thể khôi phục tài khoản của bạn. Vui lòng thử lại.',
      scheduleFailed: 'Không thể lên lịch xóa tài khoản. Vui lòng thử lại.',
      serverMisconfigured:
        'Tính năng xóa tài khoản hiện tạm thời không khả dụng vì máy chủ thiếu thông tin xác thực Instant admin.',
      sessionExpired:
        'Phiên bảo mật của bạn đã hết hạn. Hãy đăng nhập lại rồi thử lại.',
    },
  },
  editProfile: {
    title: 'Chỉnh sửa hồ sơ',
    subtitle: 'Giữ thông tin thành viên của bạn luôn mới nhất.',
    fullName: 'Họ và tên',
    bio: 'Giới thiệu',
    bioPlaceholder: 'Chia sẻ đôi điều về bạn với các thành viên khác',
    memberSince: 'Thành viên từ',
    memberSincePlaceholder: 'YYYY-MM-DD',
    nightsLeft: 'Đêm còn lại',
    nightsLeftPlaceholder: '0',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
  },
  savedEvents: {
    title: 'Sự kiện đã lưu',
    subtitle: 'Truy cập nhanh đến những trải nghiệm bạn muốn xem lại.',
    emptyTitle: 'Chưa có sự kiện nào được lưu',
    emptyDescription: 'Nhấn biểu tượng tim ở một sự kiện để lưu vào đây.',
    browseEvents: 'Xem sự kiện',
    remove: 'Xóa',
  },
  theme: {
    title: 'Tùy chọn giao diện',
    subtitle: 'Chọn cách Esco Life hiển thị trên thiết bị của bạn.',
    currentSelection: 'Lựa chọn hiện tại',
    options: {
      system: 'Hệ thống',
      light: 'Sáng',
      dark: 'Tối',
    },
    language: {
      title: 'Ngôn ngữ',
      subtitle: 'Chọn ngôn ngữ bạn muốn dùng trong ứng dụng.',
      currentSelection: 'Ngôn ngữ hiện tại',
      currentSelectionDevice: 'Theo thiết bị ({{language}})',
      options: {
        device: 'Theo thiết bị',
        en: 'English',
        ko: '한국어',
        vi: 'Tiếng Việt',
      },
    },
  },
  staff: {
    accessDeniedDescription:
      'Màn hình ẩn này chỉ dành cho tài khoản nhân viên Esco đã được thêm vào allowlist.',
    accessDeniedTitle: 'Cần quyền nhân viên',
    allowlistPending:
      'Hãy nhờ admin thêm tài khoản này vào allowlist nhân viên.',
    approvalRequired: 'Các điều chỉnh thủ công nhạy cảm cần quản lý phê duyệt.',
    award: 'Ghi nhận điểm thưởng',
    awarding: 'Đang ghi nhận...',
    awardTitle: 'Ghi nhận điều chỉnh điểm thưởng',
    badge: 'Nhân viên',
    billAmountLabel: 'Giá trị hóa đơn (VND)',
    billAmountPlaceholder: '100000',
    cameraPermissionDescription:
      'Cho phép truy cập camera để nhân viên quét mã QR thành viên tại Esco Beach.',
    cameraPermissionTitle: 'Cần quyền camera',
    currentPoints: 'Số dư điểm thưởng hiện tại: {{value}}',
    errors: {
      billBelowMinimumSpend:
        'Giá trị hóa đơn không đạt ngưỡng chi tiêu tối thiểu.',
      generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
      invalidBillAmount: 'Hãy nhập giá trị hóa đơn hợp lệ bằng VND.',
      invalidRewardServiceResponse:
        'Dịch vụ phần thưởng trả về phản hồi không hợp lệ. Vui lòng thử lại.',
      invalidQr: 'Mã QR này không phải mã thành viên Esco hợp lệ.',
      rewardServiceRejectedRequest:
        'Dịch vụ phần thưởng đã từ chối yêu cầu này. Vui lòng kiểm tra thông tin hóa đơn và thử lại.',
      rewardServiceUnavailable:
        'Dịch vụ phần thưởng hiện không khả dụng. Vui lòng thử lại sau ít phút.',
      managerApprovalRequired:
        'Cần mã PIN quản lý hợp lệ cho giao dịch vượt ngưỡng phê duyệt.',
      memberNotFound: 'Không tìm thấy thành viên với mã này.',
      receiptReferenceRequired:
        'Cần mã tham chiếu hóa đơn để ghi nhận điểm thưởng an toàn.',
      staffAccessRequired:
        'Tài khoản này chưa được allowlist để điều chỉnh phần thưởng thủ công.',
      title: 'Không thể hoàn tất thao tác',
    },
    findMember: 'Tìm thành viên',
    formulaNote:
      '{{points}} điểm thưởng được cộng cho mỗi {{amount}} chi tiêu.',
    goBack: 'Quay lại',
    grantPermission: 'Cấp quyền camera',
    invalidQrTitle: 'Mã QR không hợp lệ',
    loading: 'Đang kiểm tra quyền nhân viên...',
    lookupHint: 'Quét mã QR thành viên hoặc nhập mã thành viên thủ công.',
    managerPinLabel: 'PIN quản lý',
    managerPinPlaceholder: 'Nhập PIN quản lý',
    manualEntryNote:
      'Nếu quét không thành công, hãy nhập mã thành viên thủ công rồi tiếp tục bên dưới.',
    memberFoundBadge: 'Đã tìm thấy thành viên',
    memberIdLabel: 'Mã thành viên',
    memberIdPlaceholder: 'ESCO-XXXXXXXX',
    memberLookup: 'Tra cứu thành viên',
    memberNotFound: 'Không có thành viên nào khớp với mã này.',
    memberNotFoundTitle: 'Không tìm thấy thành viên',
    memberPendingLookup:
      'Nhấn Tìm thành viên để xác nhận thành viên này trước khi ghi nhận điểm thưởng.',
    pointsPreviewDescription:
      'Điểm thưởng được làm tròn xuống theo từng bậc {{amount}} trước khi ghi nhận.',
    pointsPreviewLabel: 'Xem trước điểm thưởng',
    receiptReferenceLabel: 'Mã tham chiếu hóa đơn',
    receiptReferencePlaceholder: 'Số bill hoặc hóa đơn',
    scanAgain: 'Quét lại',
    subtitle:
      'Quét QR của khách hoặc nhập mã thành viên để ghi nhận một điều chỉnh điểm thưởng an toàn.',
    successMessage:
      '{{name}} đã nhận {{points}} điểm thưởng từ hóa đơn {{amount}}.',
    successTitle: 'Đã ghi nhận điểm thưởng',
    title: 'Máy quét phần thưởng',
  },
  invite: {
    allReferralsTitle: 'Lượt giới thiệu của bạn',
    codeCopied: 'Đã sao chép!',
    codeCopyFailed: 'Không thể sao chép mã',
    shareFailed: 'Không thể chia sẻ liên kết mời',
    codeLoading: 'Đang tải…',
    copyReferralCode: 'Sao chép mã mời',
    copyReferralCodeHint: 'Sao chép mã giới thiệu của bạn vào bảng nhớ tạm',
    titlePrefix: 'Mở khóa',
    titleHighlight: 'VIP Life',
    subtitle:
      'Mời bạn bè đến với Esco Life và bắt đầu\nnhận những đặc quyền độc quyền ngay hôm nay.',
    referralCode: 'MÃ GIỚI THIỆU CỦA BẠN',
    goalVipStatus: 'MỤC TIÊU: TRẠNG THÁI VIP',
    friendsJoined: '{{current}} trên {{goal}} bạn đã tham gia',
    recentReferrals: 'Lượt giới thiệu gần đây',
    viewAll: 'Xem tất cả',
    viewAllHint: 'Mở danh sách đầy đủ các lượt giới thiệu của bạn',
    joinedViaYourLink: 'Đã tham gia qua liên kết của bạn',
    loadingReferrals: 'Đang tải lượt giới thiệu…',
    noReferralsYet: 'Chưa có lượt giới thiệu nào. Hãy chia sẻ mã của bạn!',
    status: {
      completed: 'Hoàn tất',
      accepted: 'Đã chấp nhận',
      rejected: 'Đã từ chối',
      unknown: 'Không xác định',
    },
    shareInviteLink: 'Chia sẻ liên kết mời',
    shareMessage:
      'Tham gia Esco Life với mã giới thiệu của tôi: {{code}}\nMở trong ứng dụng: {{appUrl}}\nNếu cần cài đặt trước, hãy dùng liên kết này: {{url}}',
    milestones: {
      freeCocktail: 'Cocktail miễn phí',
      vipBadge: 'Huy hiệu VIP',
      priorityEntry: 'Ưu tiên vào cửa',
      priorityProgress_one: 'Cần thêm {{count}} lượt giới thiệu hoàn tất',
      priorityProgress_other: 'Cần thêm {{count}} lượt giới thiệu hoàn tất',
      unlocked: 'Đã mở khóa',
      twoMoreInvites: 'Thêm {{count}} lời mời nữa',
      locked: 'Đã khóa',
      goal: 'MỤC TIÊU',
    },
  },
} as const;

export default profile;
