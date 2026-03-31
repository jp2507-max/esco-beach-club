const profile = {
  guest: '게스트',
  memberFallback: '멤버',
  tier: {
    escoLifeMember: 'Esco Life 멤버',
  },
  menu: {
    comingSoon: '곧 출시',
    editProfile: '프로필 수정',
    inviteEarn: '초대하고 적립하기',
    rateUs: '평가하기',
    membership: '멤버십',
    rewards: '리워드',
    savedEvents: '저장한 이벤트',
    settings: '설정',
    helpSupport: '도움말 및 지원',
    restartOnboarding: '온보딩 다시 시작',
    logOut: '로그아웃',
  },
  restartOnboarding: {
    confirmTitle: '온보딩을 다시 시작할까요?',
    confirmMessage:
      '설정 선택을 업데이트할 수 있도록 온보딩 흐름으로 다시 이동합니다.',
    cancel: '취소',
    start: '시작',
  },
  notifications: {
    title: '알림',
    hint: '알림 열기',
  },
  welcomeBack: '다시 오신 것을 환영합니다,',
  edit: '수정',
  brandPrefix: 'Esco',
  brandHighlight: 'Life',
  accessPass: '액세스 패스',
  scanAtTable: '체크아웃 시 스캔하여 회원 ID를 연결하세요',
  refPrefix: '참조: {{memberId}}',
  earned: '적립된 캐시백',
  saved: '절약',
  profileDetails: '프로필 정보',
  memberSince: '가입일',
  nightsLeft: '남은 숙박',
  savedEventsCount: '저장한 이벤트',
  noBio: '프로필을 더 잘 보여줄 짧은 소개를 추가해 보세요.',
  welcomeGift: '웰컴 기프트',
  welcomeDiscount: '10% 할인',
  firstVisit: '첫 방문 혜택',
  codeLabel: '코드: {{code}}',
  validForThirtyDays: '가입 후 30일 동안 유효',
  gotIt: '알겠습니다!',
  contactVipConcierge: 'VIP 컨시어지 연락',
  contactSupport: '지원팀에 문의',
  conciergeMessage: '안녕하세요, Esco Life VIP 컨시어지입니다',
  helpCenter: {
    title: '헬프 센터',
    heroTitle: '어떤 도움이 필요하신가요?',
    searchPlaceholder: '도움말 검색...',
    emailSupport: {
      title: '이메일 지원',
      description: '상세 문의를 보내주시면 2시간 내에 답변드리겠습니다.',
    },
    categories: {
      title: '카테고리 둘러보기',
      booking: '예약 및 부킹',
      membership: '멤버십 및 등급',
      perks: '혜택 및 리워드',
      technical: '앱 및 기술 지원',
    },
    faq: {
      title: '자주 묻는 질문',
      viewAll: '전체 보기',
      noResults: '검색 결과와 일치하는 질문이 없습니다.',
      items: {
        redeemDrink: {
          question: '무료 음료는 어떻게 이용하나요?',
          answer:
            'Esco Life 바에서 디지털 멤버 카드를 보여주세요. 자격이 확인되면 혜택이 자동 적용됩니다.',
        },
        upgradeTier: {
          question: '월간 등급 진행은 어떻게 작동하나요?',
          answer:
            '현재 등급은 평생 유지됩니다. 다음 등급을 향한 진행 포인트는 별도로 추적되며, 활성 진행 기간이 시작된 뒤 1개월 후 초기화됩니다.',
        },
        modifyCabana: {
          question: '카바나 예약을 변경할 수 있나요?',
          answer:
            '네. 예약 상세에서 변경 요청을 제출하실 수 있으며, 시작 시간 24시간 전까지 요청해 주세요.',
        },
        gymHours: {
          question: '헬스장 운영 시간은 어떻게 되나요?',
          answer:
            '헬스장은 매일 오전 6시부터 오후 10시까지 운영됩니다. 공휴일 운영 시간은 앱 공지에서 확인할 수 있습니다.',
        },
      },
    },
  },

  errors: {
    openMail: '메일을 열 수 없습니다',
    openWhatsApp: 'WhatsApp을 열 수 없습니다',
    languageChangeFailed: '언어를 변경할 수 없습니다. 다시 시도해 주세요.',
    saveProfileFailed: '프로필을 저장할 수 없습니다. 다시 시도해 주세요.',
    signOutFailed: '로그아웃할 수 없습니다. 다시 시도해 주세요.',
  },
  editProfile: {
    title: '프로필 수정',
    subtitle: '회원 정보를 최신 상태로 유지하세요.',
    fullName: '이름',
    bio: '소개',
    bioPlaceholder: '회원들에게 나를 짧게 소개해 보세요',
    memberSince: '가입일',
    memberSincePlaceholder: 'YYYY-MM-DD',
    nightsLeft: '남은 숙박',
    nightsLeftPlaceholder: '0',
    save: '변경사항 저장',
    saving: '저장 중...',
  },
  savedEvents: {
    title: '저장한 이벤트',
    subtitle: '다시 보고 싶은 경험을 빠르게 확인하세요.',
    emptyTitle: '아직 저장한 이벤트가 없습니다',
    emptyDescription: '이벤트에서 하트를 누르면 여기에 저장됩니다.',
    browseEvents: '이벤트 둘러보기',
    remove: '제거',
  },
  theme: {
    title: '테마 설정',
    subtitle: 'Esco Life의 화면 모드를 선택하세요.',
    currentSelection: '현재 선택',
    options: {
      system: '시스템',
      light: '라이트',
      dark: '다크',
    },
    language: {
      title: '언어',
      subtitle: '앱에서 사용할 언어를 선택하세요.',
      currentSelection: '현재 언어',
      currentSelectionDevice: '기기 언어 사용 ({{language}})',
      options: {
        device: '기기 언어 사용',
        en: 'English',
        ko: '한국어',
        vi: 'Tiếng Việt',
      },
    },
  },
  staff: {
    accessDeniedDescription:
      '이 숨겨진 화면은 허용 목록에 등록된 Esco 직원 계정에서만 사용할 수 있습니다.',
    accessDeniedTitle: '직원 권한 필요',
    allowlistPending:
      '관리자에게 이 계정을 직원 허용 목록에 추가해 달라고 요청하세요.',
    approvalRequired: '민감한 수동 조정에는 관리자 승인이 필요합니다.',
    award: '캐시백 기록',
    awarding: '기록 중...',
    awardTitle: '캐시백 조정 기록',
    badge: '직원',
    billAmountLabel: '결제 금액 (VND)',
    billAmountPlaceholder: '100000',
    cameraPermissionDescription:
      'Esco Beach에서 회원 QR 코드를 스캔할 수 있도록 카메라 접근 권한을 허용해 주세요.',
    cameraPermissionTitle: '카메라 권한 필요',
    currentPoints: '현재 캐시백 잔액: {{value}}',
    errors: {
      billBelowMinimumSpend: '이 결제 금액은 최소 캐시백 기준에 미달합니다.',
      generic: '문제가 발생했습니다. 다시 시도해 주세요.',
      invalidBillAmount: 'VND 기준의 올바른 결제 금액을 입력해 주세요.',
      invalidRewardServiceResponse:
        '리워드 서비스 응답이 올바르지 않습니다. 다시 시도해 주세요.',
      invalidQr: '이 QR 코드는 유효한 Esco 회원 코드가 아닙니다.',
      rewardServiceRejectedRequest:
        '리워드 서비스에서 요청을 거부했습니다. 결제 정보를 확인한 뒤 다시 시도해 주세요.',
      rewardServiceUnavailable:
        '리워드 서비스를 현재 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      managerApprovalRequired:
        '승인 한도를 초과하는 거래에는 유효한 관리자 PIN이 필요합니다.',
      memberNotFound: '해당 ID의 회원을 찾을 수 없습니다.',
      receiptReferenceRequired:
        '안전한 캐시백 기록을 위해 영수증 또는 청구 참조 번호가 필요합니다.',
      staffAccessRequired:
        '이 계정은 수동 리워드 조정용 허용 목록에 등록되어 있지 않습니다.',
      title: '작업을 완료할 수 없습니다',
    },
    findMember: '회원 찾기',
    formulaNote:
      '{{amount}} 사용 시마다 {{points}} 캐시백 포인트가 적립됩니다.',
    goBack: '뒤로 가기',
    grantPermission: '카메라 권한 허용',
    invalidQrTitle: '잘못된 QR 코드',
    loading: '직원 권한 확인 중...',
    lookupHint: '회원 QR 코드를 스캔하거나 회원 ID를 직접 입력하세요.',
    managerPinLabel: '관리자 PIN',
    managerPinPlaceholder: '관리자 PIN 입력',
    manualEntryNote:
      '스캔이 실패하면 회원 ID를 직접 입력하고 아래에서 계속 진행하세요.',
    memberFoundBadge: '회원 확인됨',
    memberIdLabel: '회원 ID',
    memberIdPlaceholder: 'ESCO-XXXXXXXX',
    memberLookup: '회원 조회',
    memberNotFound: '해당 코드와 일치하는 회원이 없습니다.',
    memberNotFoundTitle: '회원을 찾을 수 없음',
    memberPendingLookup:
      '캐시백을 기록하기 전에 회원을 확인하려면 회원 찾기를 눌러 주세요.',
    pointsPreviewDescription:
      '캐시백 포인트는 {{amount}} 단위로 내림 처리됩니다.',
    pointsPreviewLabel: '캐시백 미리보기',
    receiptReferenceLabel: '영수증 참조',
    receiptReferencePlaceholder: '영수증 또는 청구 번호',
    scanAgain: '다시 스캔',
    subtitle:
      '고객 QR을 스캔하거나 회원 ID를 입력하여 안전한 캐시백 조정을 기록하세요.',
    successMessage:
      '{{name}}님에게 {{amount}} 결제로 {{points}} 캐시백 포인트가 기록되었습니다.',
    successTitle: '캐시백 기록 완료',
    title: '리워드 스캐너',
  },
  invite: {
    allReferralsTitle: '추천 내역',
    codeCopied: '복사됨!',
    codeCopyFailed: '코드를 복사할 수 없습니다',
    codeLoading: '불러오는 중…',
    copyReferralCode: '초대 코드 복사',
    copyReferralCodeHint: '추천 코드를 클립보드에 복사합니다',
    titlePrefix: '지금',
    titleHighlight: 'VIP Life',
    subtitle: '친구를 Esco Life로 초대하고\n오늘 바로 특별한 혜택을 받으세요.',
    referralCode: '내 추천 코드',
    goalVipStatus: '목표: VIP 등급',
    friendsJoined: '{{goal}}명 중 {{current}}명 가입',
    recentReferrals: '최근 추천',
    viewAll: '모두 보기',
    viewAllHint: '전체 추천 목록을 엽니다',
    joinedViaYourLink: '내 링크로 가입함',
    noReferralsYet: '아직 추천이 없습니다. 코드를 공유해 보세요!',
    shareInviteLink: '초대 링크 공유',
    shareMessage:
      '내 추천 코드로 Esco Life에 가입하세요: {{code}}\nhttps://escolife.app/invite/{{code}}',
    milestones: {
      freeCocktail: '무료 칵테일',
      vipBadge: 'VIP 배지',
      priorityEntry: '우선 입장',
      priorityProgress: '완료된 초대 {{count}}명 더 필요',
      unlocked: '해제됨',
      twoMoreInvites: '초대 {{count}}명 더 필요',
      locked: '잠김',
      goal: '목표',
    },
  },
} as const;

export default profile;
