/**
 * @file GuideContent.ts
 * @description 통합 가이드 허브 데이터 — 탭(카테고리) × 삽화 카드 페이지 (데이터 구동)
 *
 * 확정 문구/삽화 = game_guide_hub.html 목업 (SVG → PNG 텍스처 guide_<cat>_<n>,
 * BootScene preload). 새 시스템 가이드는 GuideCategory 하나 추가로 끝 —
 * 렌더는 공용 GuidePanel(ui/GuidePanel.ts)이 담당한다. 지역화 시 문구를 i18n 키로.
 */

/** 삽화 카드 1페이지 — PNG 텍스처 + 제목/설명/팁 (문구는 Phaser Text 오버레이) */
export interface GuidePage {
  textureKey: string;
  heading: string;
  body: string;
  tip: string;
}

export type GuideCatKey = 'fight' | 'retrieve' | 'chum' | 'butchery';

export interface GuideCategory {
  key: GuideCatKey;
  label: string;
  pages: GuidePage[];
}

export const GUIDES: GuideCategory[] = [
  {
    key: 'fight',
    label: '파이트',
    pages: [
      {
        textureKey: 'guide_fight_1',
        heading: '챔질 타이밍',
        body: '입질하면 초릿대가 3단계로 휘어요. 크게 휜 3단계에서 우클릭 챔질이 성공률 100% (1단계 5% · 2단계 20%).',
        tip: '약은 입질엔 1초 릴링/뒷줄견제(H)로 3단계를 유도.',
      },
      {
        textureKey: 'guide_fight_2',
        heading: '텐션 & 드랙',
        body: '텐션바가 초록→주황→빨강. 90%에서 릴이 잠기니 드랙을 풀어요(↑/↓ 또는 F/G). 드랙은 줄 강도의 약 1/3이 기본.',
        tip: '빨강에서 무리하면 줄 터짐. 풀고 버티다 잦아들 때 감기.',
      },
      {
        textureKey: 'guide_fight_3',
        heading: '횡 러닝 — 로드 스티어',
        body: '물고기가 좌/우로 째면 그쪽으로 로드를 눕혀(←/→) 버텨요. 텐션이 잦아든 틈에 반대로 눌러 머리를 돌리면 제압이 진행돼요.',
        tip: '러닝엔 같이 눕혀 버티고, 잠잠할 때 반대로 뺏기.',
      },
      {
        textureKey: 'guide_fight_4',
        heading: '피로 구간',
        body: '파이트는 러닝→소강→파상저항→제압 순으로 힘이 빠져요. 슬랙(줄 늦춤)을 주면 회복하니 긴장을 유지해요. 대물일수록 오래 버팁니다.',
        tip: '소강 구간에 펌핑으로 줄을 벌어요.',
      },
      {
        textureKey: 'guide_fight_5',
        heading: '제압 & 랜딩',
        body: '지치면 물고기가 수면으로 부상하며 화면 앞으로 끌려와 커져요. 이때 뜰채로 랜딩 → 어획!',
        tip: '제압 근접엔 머리가 반대여도 몸이 딸려와요.',
      },
    ],
  },
  {
    key: 'retrieve',
    label: '회수',
    pages: [
      {
        textureKey: 'guide_retrieve_1',
        heading: '릴링 회수',
        body: '좌클릭 유지로 채비를 감아요. 거리가 줄면 채비가 화면 중앙~살짝 아래로 다가오며 커져요(입질 없어도 동일).',
        tip: '찌 채비 크기 기준 최대 2배까지 커집니다.',
      },
      {
        textureKey: 'guide_retrieve_2',
        heading: '채비/루어 세트',
        body: '찌 채비는 찌까지 함께 딸려오고, 루어는 찌 없이 채비만 와요. 초릿대에서 이어진 원줄도 세트를 따라 함께 딸려옵니다.',
        tip: '세트 전체가 한 덩어리로 움직여요.',
      },
      {
        textureKey: 'guide_retrieve_3',
        heading: '회수 완료',
        body: '발앞 0.5m까지 감으면 채비가 회수되고 탑다운(필드) 화면으로 복귀해요. 낚시를 마치거나 자리를 옮길 때 사용.',
        tip: '입질 없이 자리 이동할 때도 회수부터.',
      },
      {
        textureKey: 'guide_retrieve_4',
        heading: '회수 중 조작',
        body: 'H 뒷줄견제(그 지점에 채비 홀드) · ↑ 리프트(채비를 위로) · ↓ 폴링(가라앉히며 대기). 조류·수심에 맞춰 채비를 다뤄요.',
        tip: '뒷줄견제는 속조류 정렬만 영향받는 홀드예요.',
      },
    ],
  },
  {
    key: 'chum',
    label: '밑밥',
    pages: [
      {
        textureKey: 'guide_chum_1',
        heading: '밑밥이란?',
        body: '어군을 모으고 미끼와 겹치게 흘려 입질을 만드는 떡밥이에요. 밑밥과 미끼가 만나는 타이밍이 핵심.',
        tip: "HUD '밑밥 동조 %'가 겹칠수록 올라 입질↑.",
      },
      {
        textureKey: 'guide_chum_2',
        heading: '투척 방법',
        body: '마우스 좌우로 투척점을 고르고 C로 던져요. 중앙1+좌우 5~6개 투척점 중 커서 최근접으로 스냅.',
        tip: '커서 높낮이는 무시 — 좌우만!',
      },
      {
        textureKey: 'guide_chum_3',
        heading: '조류 상류로 리드',
        body: '밑밥은 조류를 따라 흘러요. 조류 상류에 던져 미끼로 흘러오게! 좌 조류면 우측에 던지면 좌하단으로 흘러 미끼서 동조 최대.',
        tip: '밑밥이 미끼를 지나는 순간이 피크.',
      },
      {
        textureKey: 'guide_chum_4',
        heading: '밑밥 종류별 침강',
        body: '밑밥마다 침강·퍼짐·조류 타는 정도가 달라요. 강조류엔 무거운 경단(정밀), 약조류엔 파우더(광역).',
        tip: '압맥·보리는 중간 범용.',
      },
      {
        textureKey: 'guide_chum_5',
        heading: '동조율 읽고 조준',
        body: '투척점을 고르면 예측 흐름(고스트)이 보여요. HUD 밑밥 동조 %가 차오를 때가 찬스! 조류·수심에 맞춰 조절.',
        tip: '동조 낮으면 한 칸 상류로, 침강 느리면 무거운 밑밥.',
      },
    ],
  },
  {
    key: 'butchery',
    label: '회뜨기',
    pages: [
      {
        textureKey: 'guide_butchery_1',
        heading: '회칼이 필요해요',
        body: '기타 아이템에 회칼이 있어야 회뜨기가 가능해요. 칼 등급(막칼·회칼·야나기바)에 따라 수율과 등급이 달라져요.',
        tip: '없으면 손질(비늘·머리·내장)까지만 가능.',
      },
      {
        textureKey: 'guide_butchery_2',
        heading: '시메 & 방혈',
        body: '활어는 시메(뇌·신경 차단) 후 아가미·꼬리를 절개해 방혈(피빼기), 얼음물에 담가요. 이러면 선도·등급이 올라가요.',
        tip: '방혈·시메가 잘 될수록 회 등급·판매가↑.',
      },
      {
        textureKey: 'guide_butchery_3',
        heading: '손질 순서',
        body: '비늘 → 머리 → 내장 → 세척 순으로 손질해요. 중간에 뒤집기·배 위로 방향을 바꿔가며 진행합니다.',
        tip: '방향 상태가 맞아야 그 단계 칼질이 활성화돼요.',
      },
      {
        textureKey: 'guide_butchery_4',
        heading: '삼면뜨기',
        body: '등 지느러미 경계에 얕은 칼집을 여러 번 낸 뒤 강한 썰기로 뼈를 끊어 살을 분리해요. 양쪽 살 2장 + 중골. 광어는 5장뜨기.',
        tip: '큰 광어(≥45cm)는 5장, 원형어는 3장(2필렛).',
      },
      {
        textureKey: 'guide_butchery_5',
        heading: '박피 & 수율',
        body: '필렛을 꼬리 손잡이 잡고 껍질과 살 사이 15도로 당겨 껍질을 벗겨요. 체장·무게·칼·손질 스킬에 따라 필렛 양과 등급이 결정돼요.',
        tip: '수율(양)과 등급(질)은 별개 — 곱게 뜰수록 등급↑.',
      },
    ],
  },
];

/** 카테고리 키 → 정의 조회 */
export function guideCategoryOf(key: GuideCatKey): GuideCategory {
  return GUIDES.find((g) => g.key === key) ?? GUIDES[0];
}
