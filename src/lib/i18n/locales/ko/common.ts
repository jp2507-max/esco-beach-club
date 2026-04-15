const common = {
  accessibility: {
    textInputDefault: '텍스트 입력 필드',
    textInputHint: '텍스트 입력',
    textInputHintWithField: '{{field}} 입력',
  },
  branding: {
    mark: 'Esco Beach',
    wordmark: 'Esco Beach Club 워드마크',
    markHint: 'Esco Beach Club 브랜딩',
  },
  validation: {
    required: '이 필드는 필수입니다.',
    email: '올바른 이메일 주소를 입력해 주세요.',
    number: '숫자를 입력해 주세요.',
    positiveNumber: '양수를 입력해 주세요.',
    min: '최소 {{min}} 이상이어야 합니다.',
    max: '최대 {{max}} 이하여야 합니다.',
    maxCharacters: '최대 {{count}}자까지 입력 가능합니다.',
    profileNameMin: '이름은 최소 2자 이상 입력해 주세요.',
    profileNameMax: '이름은 최대 60자까지 입력 가능합니다.',
    profileBioMax: '소개는 최대 160자까지 입력 가능합니다.',
    commentMax: '코멘트는 최대 500자까지 입력 가능합니다.',
    invalidDate: 'YYYY-MM-DD 형식의 유효한 날짜를 입력해 주세요.',
    invalidCode: '6자리의 인증 코드를 입력해 주세요.',
    deleteConfirmation: '계속하려면 DELETE를 정확히 입력해 주세요.',
    loyaltyManagerPin:
      '이 금액을 승인하려면 유효한 관리자 PIN을 입력해 주세요.',
    loyaltyMinimumSpend: '이 청구 금액은 최소 결제 금액보다 낮습니다.',
  },
  back: '뒤로',
  backHint: '이전 화면으로 돌아갑니다',
  valueUnavailable: '—',
  rateUs: {
    title: '경험을 평가해 주세요',
    howWasVisit: '방문은 어떠셨나요?',
    feedbackHint: '소중한 피드백이 최고의 비치 클럽 경험을 만듭니다.',
    starAccessibilityLabel: '5점 만점에 {{count}}점 평가',
    starAccessibilityHint: '이 평점을 선택하려면 탭하세요',
    starLabels: ['최악', '별로', '괜찮음', '좋음', '최고!'],
    placeholder: '경험에 대해 더 알려주세요...',
    submitLabel: '리뷰 제출',
    thankYou: '감사합니다!',
    thankYouMessage:
      '소중한 피드백 감사합니다. Esco Life를 더욱 발전시키겠습니다.',
    done: '완료',
    ratingRequired: '평점 필요',
    ratingRequiredMessage: '제출 전에 별점을 선택해 주세요.',
    reviewFailed: '리뷰 제출 실패',
    reviewSubmitError: '지금은 리뷰를 제출할 수 없습니다.',
  },
  bookingSuccess: {
    backHome: '홈으로 돌아가기',
    guest: '게스트',
    subtitle:
      '예약 요청이 접수되었습니다. 1시간 이내에 확인 안내를 보내드리겠습니다.',
    title: '{{name}}님, 준비가 완료되었습니다!',
  },
  bookingContact: {
    chatPrompt:
      '더 빠른 답변이 필요하면 Instagram 또는 Facebook에서 바로 채팅해 주세요.',
    inlinePrompt: '지금 바로 문의가 필요하신가요?',
    instagramInlineCta: 'Instagram으로 문의하기',
    facebookInlineCta: 'Facebook으로 문의하기',
    emailInlineCta: '또는 이메일 보내기',
    emailButton: '이메일 보내기',
    emailHint: '예약팀에 연락할 수 있도록 메일 앱을 엽니다',
    instagramButton: 'Instagram',
    instagramHint: '직접 채팅을 위해 Instagram 페이지를 엽니다',
    facebookButton: 'Facebook',
    facebookHint: '직접 채팅을 위해 Facebook 페이지를 엽니다',
    openLinkError: '지금은 이 연락 수단을 열 수 없습니다.',
  },
  appError: {
    title: '예기치 않은 문제가 발생했습니다',
    description:
      '앱을 다시 열거나 잠시 후 다시 시도해 주세요. 팀에서 이미 확인할 수 있도록 기록했습니다.',
  },
  launch: {
    eyebrow: '멤버 시작',
    loading: '클럽 이용 권한, 혜택, 최신 소식을 준비하고 있습니다.',
  },
  searchInput: {
    clearLabel: '검색 지우기',
    clearHint: '현재 검색어를 지웁니다',
  },
  menu: '메뉴',
  privateEvent: {
    title: '프라이빗 이벤트',
    header: '나만의 파티를 계획하세요',
    subtitle:
      '소규모 생일 파티부터 대규모 기업 행사까지 — 모두 저희가 도와드립니다.',
    eventDetails: '이벤트 상세',
    eventType: '이벤트 유형',
    selectType: '유형 선택...',
    eventTypes: {
      companyParty: '회사 파티',
      birthday: '생일',
      wedding: '결혼식',
      anniversary: '기념일',
      corporateRetreat: '기업 워크숍',
      other: '기타',
    },
    preferredDate: '희망 날짜',
    preferredDatePlaceholder: 'YYYY-MM-DD',
    preferredDateHint: 'YYYY-MM-DD 형식으로 날짜를 입력하세요.',
    estimatedGuests: '예상 인원',
    estimatedGuestsPlaceholder: '예: 50',
    contactInfoOptional: '연락처 (선택)',
    name: '이름',
    namePlaceholder: '성함',
    email: '이메일',
    emailPlaceholder: 'you@email.com',
    additionalNotes: '추가 요청사항',
    additionalNotesPlaceholder: '테마, 식이 요구사항, 특별 요청사항...',
    sendInquiry: '문의 보내기',
    teamResponse: '1시간 이내에 이메일로 확인 안내를 보내드리겠습니다.',
    submissionFailed: '제출 실패',
    submitError: '지금은 문의를 보낼 수 없습니다.',
    missingInfo: '정보 누락',
    missingInfoMessage: '이벤트 유형, 날짜, 예상 인원을 입력해 주세요.',
    inquirySent: '문의가 전송되었습니다!',
    inquirySentMessage:
      '요청이 접수되었습니다. 1시간 이내에 이메일로 확인 안내를 보내드리겠습니다.',
    backToEvents: '이벤트로 돌아가기',
  },
  tabs: {
    home: '홈',
    events: '이벤트',
    qr: 'QR',
    scan: '스캔',
    perks: '혜택',
    profile: '프로필',
  },
  close: '닫기',
  datePicker: {
    dismissHint: '더블 탭하여 날짜 변경 없이 날짜 선택기를 닫기',
  },
  done: '완료',
  modal: {
    title: 'Esco Life',
    description:
      'Esco Life 비치 클럽에 오신 것을 환영합니다. 회원 전용 혜택을 누려보세요.',
    closeLabel: '닫기',
    closeHint: '이 모달을 닫습니다',
  },
  notFound: {
    title: '이 화면은 존재하지 않습니다.',
    cta: '홈 화면으로 이동',
  },
  member: '회원',
  legal: {
    eyebrow: 'Esco 법률 정보',
    hostedOnExpo:
      '이 공개 페이지는 현재 EAS Hosting 프로덕션 배포에서 제공됩니다.',
    contact: {
      title: '도움이 필요하신가요?',
      description:
        '법률, 개인정보 또는 계정 관련 문의는 {{email}} 로 연락해 주세요.',
      emailCta: '개인정보 문의 이메일',
      questionsCta: '이용약관 문의하기',
      supportCta: '지원팀에 문의',
      supportSubject: 'Esco Beach Club 지원 문의',
    },
    privacy: {
      title: '개인정보 처리방침',
      intro:
        '이 정책은 Esco Beach Club이 어떤 정보를 수집하고, 회원 정보를 어떻게 사용하며, 어떤 권한이 선택 사항으로 남아 있는지 설명합니다.',
      sections: {
        collection: {
          title: '수집하는 정보',
          body1:
            '회원 경험 운영에 필요한 계정 및 프로필 정보를 수집합니다. 여기에는 이메일 주소, 회원 식별자, 추천 코드, 프로필 이름, 그리고 예약 또는 프라이빗 이벤트 요청 양식에 사용자가 직접 입력한 기타 정보가 포함될 수 있습니다. 생년월일은 나중에 사용자가 선택해 추가할 수 있으며, 생일 축하나 생일 혜택 같은 선택형 개인화에만 사용됩니다.',
          body2:
            '앱은 위치, 알림, 카메라 권한을 선택적으로 요청할 수 있습니다. 현재 릴리스에서는 위치가 현장 도착 기능을 위해 기기 내에서 사용되고, 알림은 로컬 리마인더와 오퍼에 사용되며, 카메라는 회원이 영수증 QR 코드를 직접 스캔하는 데 사용됩니다.',
        },
        use: {
          title: '정보 사용 방식',
          body1:
            '계정 및 프로필 정보는 회원 인증, 혜택 관리, 예약 및 프라이빗 이벤트 요청 지원, 추천, 로열티, 계정 관리 기능 제공을 위해 사용됩니다.',
          body2:
            '장애, 진단 정보, 그리고 모니터링 도구를 통해 수집되는 제한적인 인앱 피드백 또는 세션 리플레이 데이터는 안정성 모니터링, 오류 조사, 앱 경험 개선을 위해 처리될 수 있습니다.',
        },
        sharing: {
          title: '정보 공유 방식',
          body1:
            '서비스 운영, 현장 또는 파트너 경험 지원, 법적 의무 준수, 사기 및 오남용 방지를 위해 필요한 경우에만 정보를 공유합니다.',
          body2:
            '앱은 교차 앱 추적에 사용되지 않습니다. 호스팅, 인증, 모니터링을 위해 당사를 대신해 데이터를 처리하는 제3자 제공업체는 이 정책과 동등한 수준의 개인정보 및 보안 보호를 제공해야 합니다.',
        },
        choices: {
          title: '사용자 선택',
          body1:
            '선택 권한은 거부할 수 있고, 이후에도 기기 권한 설정을 변경하거나 지원팀에 연락하여 선택적 동의를 철회할 수 있습니다. 일부 기능은 선택 권한이 없으면 제한적으로 동작할 수 있습니다.',
          body2:
            '계정을 만든 경우 앱 안에서 계정 삭제를 시작할 수 있습니다. 삭제 요청은 최종 삭제 전 30일 복원 기간을 거치며, 법적 의무 준수, 사기 방지, 계정 또는 삭제 활동 기록을 위해 필요한 범위의 제한된 기록은 보관될 수 있습니다.',
        },
      },
    },
    terms: {
      title: '이용약관',
      intro:
        '이 약관은 Esco Beach Club 앱에서 제공되는 멤버십, 예약, 혜택, 추천 및 기타 회원 전용 서비스 이용에 적용됩니다.',
      sections: {
        membership: {
          title: '멤버십 및 자격',
          body1:
            '정확한 계정 정보를 제공하고 로그인 접근을 안전하게 관리할 책임은 사용자에게 있습니다. 멤버십 상태, 혜택, 오퍼는 자격 조건과 현장 또는 파트너 정책에 따라 달라질 수 있습니다.',
          body2:
            '계정 정보가 부정확하거나 혜택이 악용되거나 회원·파트너·직원·플랫폼 보호가 필요한 경우 Esco Beach Club은 접근을 제한하거나 중단할 수 있습니다.',
        },
        bookings: {
          title: '예약, 혜택 및 프라이빗 이벤트',
          body1:
            '예약 요청, 프라이빗 이벤트 문의, 파트너 혜택, 리워드 오퍼는 이용 가능 여부, 현장 재량, 파트너 참여, 앱 또는 현장에서 제공되는 추가 조건에 따라 달라집니다.',
          body2:
            '앱에서 요청을 제출해도 확인되기 전까지는 보장되지 않습니다. 혜택과 리워드는 부정 사용 또는 조건 위반 시 변경, 만료, 회수될 수 있습니다.',
        },
        acceptableUse: {
          title: '허용되는 사용',
          body1:
            '앱을 오용하거나, 제한 기능을 역분석하거나, 다른 회원을 사칭하거나, 직원 도구를 방해하거나, 자동화된 남용을 하거나, 사기·재판매·조작을 통해 혜택이나 리워드를 얻으려 해서는 안 됩니다.',
          body2:
            '회원 QR, 추천, 로열티 기능은 의도된 계정과 현장 흐름에 한해 사용해야 합니다. 오남용 시 리워드 회수, 접근 중단, 영구 계정 삭제가 이루어질 수 있습니다.',
        },
        accounts: {
          title: '계정, 삭제 및 변경',
          body1:
            '사용자는 언제든 서비스 이용을 중단할 수 있습니다. 계정을 만든 경우 앱 내 삭제 흐름과 복원 기간에 따라 계정 삭제를 시작할 수 있습니다.',
          body2:
            '서비스가 변경되면 이 약관도 업데이트될 수 있습니다. 변경 후 계속 사용하면 개정된 약관에 동의한 것으로 간주됩니다.',
        },
        liability: {
          title: '면책 및 책임 제한',
          body1:
            '앱, 파트너 오퍼, 이벤트 정보는 가능한 범위에서 제공됩니다. 서비스 중단 없음, 지속적인 파트너 참여, 모든 정보의 완전성 또는 최신성을 보장하지 않습니다.',
          body2:
            '법이 허용하는 범위 내에서 Esco Beach Club은 앱 사용, 제3자 파트너 경험, 일시적 서비스 중단으로 인한 간접적·부수적·결과적 손해에 대해 책임지지 않습니다.',
        },
      },
    },
    support: {
      title: '지원',
      intro:
        '이 페이지는 App Review 연락처, 회원 지원 문의, 그리고 Esco Beach Club 관련 법률 또는 계정 요청을 위한 안내 페이지입니다.',
      sections: {
        access: {
          title: '계정 접근',
          body1:
            '로그인에 문제가 있으면 먼저 회원 계정에 연결된 이메일 주소를 확인하고, 해당 계정에 맞는 로그인 방식을 사용하고 있는지 점검해 주세요.',
          body2:
            '문제가 계속되면 지원팀에 계정 이메일, 기기 플랫폼, 문제 설명을 함께 보내 주세요.',
        },
        bookings: {
          title: '예약 및 현장 요청',
          body1:
            '예약, 프라이빗 이벤트, 파트너 혜택 관련 문의 시 날짜, 현장 맥락, 앱에 표시된 확인 정보를 함께 보내 주시면 더 빠르게 확인할 수 있습니다.',
          body2:
            '지원팀은 앱 내 요청 상태를 검토할 수 있지만 최종 승인, 이용 가능 여부, 현장 운영은 여전히 Esco 직원이나 파트너 정책에 따를 수 있습니다.',
        },
        privacy: {
          title: '개인정보 및 계정 삭제',
          body1:
            '계정을 삭제하려면 앱 내 삭제 흐름을 이용해 주세요. 삭제 요청, 개인정보 우려, 복원 기간 중 도움이 필요하면 직접 지원팀에 연락할 수 있습니다.',
          body2:
            '법률 또는 개인정보 관련 문의 시 어떤 기능과 관련된 요청인지 함께 알려 주시면 더 정확하게 대응할 수 있습니다.',
        },
      },
    },
  },
} as const;

export default common;
