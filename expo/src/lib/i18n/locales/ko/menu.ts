const menu = {
  categories: {
    cocktails: '칵테일',
    food: '음식',
    wine: '와인',
    hookah: '후카',
  },
  items: {
    c1: {
      name: '에스코 선셋',
      description: '패션후르츠, 럼, 라임, 프로세코 & 식용 꽃 토핑',
      tag: '시그니처',
    },
    c2: {
      name: '도쿄 드리프트',
      description: '일본 위스키, 유자, 시소 잎, 생강 폼',
    },
    c3: {
      name: '벨벳 로즈',
      description: '진, 로즈워터, 리치, 엘더플라워 토닉',
      tag: '인기',
    },
    c4: {
      name: '스모키 오드 패션드',
      description:
        '버번, 데메라라, 앙고스투라, 오렌지 껍질, 테이블사이드 스모킹',
    },
    f1: {
      name: '트러플 와규 슬라이더',
      description: 'A5 와규, 트러플 아일리, 브리오슈 번, 마이크로 그린',
      tag: '셰프의 선택',
    },
    f2: {
      name: '참치 타르타르',
      description: '블루핀 참치, 아보카도 무스, 참깨 크리스프, 폰즈',
    },
    f3: {
      name: '로브스터 덴푸라',
      description: '바삭한 로브스터 꼬리, 와사비 마요, 절인 생강',
    },
    f4: {
      name: '메즈 플래터',
      description: '훔무스, 바바 가누시, 팔라펠, 따뜻한 피타, 자아타르',
    },
    w1: {
      name: '돔 페리뇽 2013',
      description: '샴페인, 프랑스 — 아몬드 & 시트러스 노트의 우아함',
      tag: '프리미엄',
    },
    w2: {
      name: '클라우디 베이 소비뇽',
      description: '말버러, 뉴질랜드 — 상큼하고 열대적이며 상쾌함',
    },
    w3: {
      name: '바로로 리저바 2016',
      description: '피에몬테, 이탈리아 — 풀바디, 체리, 가죽 노트',
    },
    h1: {
      name: '더블 애플 클래식',
      description: '달콤한 아니스 피니시의 전통 블렌드',
    },
    h2: {
      name: '에스코 클라우드 믹스',
      description: '블루베리, 민트 & 포도 — 하우스 스페셜',
      tag: '하우스 스페셜',
    },
    h3: {
      name: '트로피컬 파라다이스',
      description: '망고, 패션후르츠 & 코코넛 아이스 베이스',
    },
  },
} as const;

export default menu;
