/**
 * @file WorldMap.ts
 * @description 월드맵(WorldMapScene) 핀포인트 노드 데이터 인터페이스
 *
 * FishingSpotNode 배열을 기반으로 WorldMapScene이 동적으로
 * 핀포인트 마커를 렌더링합니다. 데이터만 추가하면 자동으로 지도에 반영됩니다.
 */

/** 출조지 타입 (범례 연동) */
export type WorldMapSpotType = 'BREAKWATER' | 'REEF' | 'BOAT' | 'MUD' | 'BEACH';

/**
 * 월드맵 핀포인트 노드 — 지도 위에 표시되는 출조지 단위
 *
 * pixelX / pixelY 좌표는 webglmap_pixel.png 이미지의
 * 실제 픽셀 크기(기준: 전체 이미지 해상도) 기준 좌표입니다.
 */
export interface FishingSpotNode {
  /** RegionDatabase.id와 매핑 */
  id: string;
  /** 표시 이름 (예: "경북 포항") */
  name: string;
  /**
   * 영문 표시 이름 (예: "Pohang, Gyeongbuk") — 영어 로케일 전용 (120차).
   * 사전(`i18n/places.ts`)이 아니라 데이터가 곧 번역이다. 비면 사전 폴백.
   */
  nameEn?: string;
  /** 짧은 이름 (지도 레이블용, 예: "포항") */
  shortName: string;
  /** 영문 짧은 이름 (지도 레이블용, 예: "Pohang") */
  shortNameEn?: string;
  /** 지역 분류 텍스트 */
  region: string;
  /**
   * webglmap_pixel.png 기준 X 픽셀 좌표
   * (이미지의 실제 픽셀 위치 — 0,0이 좌상단)
   */
  pixelX: number;
  /**
   * webglmap_pixel.png 기준 Y 픽셀 좌표
   * (이미지의 실제 픽셀 위치 — 0,0이 좌상단)
   */
  pixelY: number;
  /** 하위 스팟 개수 */
  spotsCount: number;
  /** 이 노드에서 가능한 낚시 타입 (범례 연동) */
  availableTypes: WorldMapSpotType[];
  /** RegionDatabase와 연결된 ID (클릭 시 드릴다운) */
  regionDatabaseId: string;
  /**
   * 지역 상세 픽셀 지도 에셋 슬러그.
   * pixelazed 폴더의 `{mapSlug}_2_pixelazed.png` 파일명 규칙과 매핑되며,
   * 클릭 시 해당 지도로 줌인 진입할 때 텍스처 키(`zoom_{mapSlug}`)로 사용됩니다.
   */
  mapSlug: string;
}

/**
 * 월드맵 노드 데이터베이스 — MOCK_WORLD_NODES
 *
 * 좌표 기준: webglmap_pixel.png (실제 이미지 해상도 기준 픽셀 좌표)
 * 이미지 크기: 약 512×400px (실제 픽셀 이미지)
 * 향후 VWorld API / JSON 파일로 외부화 가능
 */
export const WORLD_NODE_DATABASE: FishingSpotNode[] = [
  // ── 강원 속초 ──
  {
    id: 'gangwon_sokcho',
    name: '강원 속초',
    nameEn: 'Sokcho, Gangwon',
    shortName: '속초',
    shortNameEn: 'Sokcho',
    region: '강원도',
    pixelX: 152,
    pixelY: 30,
    spotsCount: 2,
    availableTypes: ['BREAKWATER', 'BEACH'],
    regionDatabaseId: 'gangwon_sokcho',
    mapSlug: 'sokcho',
  },
  // ── 인천 ──
  {
    id: 'incheon',
    name: '인천',
    nameEn: 'Incheon',
    shortName: '인천',
    shortNameEn: 'Incheon',
    region: '인천광역시',
    pixelX: 86,
    pixelY: 64,
    spotsCount: 1,
    availableTypes: ['BREAKWATER', 'MUD'],
    regionDatabaseId: 'incheon',
    mapSlug: 'incheon',
  },
  // ── 충남 태안 ──
  {
    id: 'chungnam_taean',
    name: '충남 태안',
    nameEn: 'Taean, Chungnam',
    shortName: '태안',
    shortNameEn: 'Taean',
    region: '충청남도',
    pixelX: 72,
    pixelY: 91,
    spotsCount: 1,
    availableTypes: ['MUD', 'BEACH'],
    regionDatabaseId: 'chungnam_taean',
    mapSlug: 'taean',
  },
  // ── 경북 포항 ──
  {
    id: 'gyeongbuk_pohang',
    name: '경북 포항',
    nameEn: 'Pohang, Gyeongbuk',
    shortName: '포항',
    shortNameEn: 'Pohang',
    region: '경상북도',
    pixelX: 183,
    pixelY: 123,
    spotsCount: 6,
    availableTypes: ['BREAKWATER', 'MUD', 'BOAT'],
    regionDatabaseId: 'gyeongbuk_pohang',
    mapSlug: 'pohang',
  },
  // ── 울산 ──
  {
    id: 'ulsan',
    name: '울산',
    nameEn: 'Ulsan',
    shortName: '울산',
    shortNameEn: 'Ulsan',
    region: '울산광역시',
    pixelX: 185,
    pixelY: 147,
    spotsCount: 1,
    availableTypes: ['BREAKWATER', 'REEF'],
    regionDatabaseId: 'ulsan',
    mapSlug: 'ulsan',
  },
  // ── 부산 ──
  {
    id: 'busan',
    name: '부산',
    nameEn: 'Busan',
    shortName: '부산',
    shortNameEn: 'Busan',
    region: '부산광역시',
    pixelX: 173,
    pixelY: 163,
    spotsCount: 1,
    availableTypes: ['BREAKWATER', 'REEF', 'BOAT'],
    regionDatabaseId: 'busan',
    mapSlug: 'busan',
  },
  // ── 경남 거제 ──
  {
    id: 'gyeongnam_geoje',
    name: '경남 거제',
    nameEn: 'Geoje, Gyeongnam',
    shortName: '거제',
    shortNameEn: 'Geoje',
    region: '경상남도',
    pixelX: 160,
    pixelY: 174,
    spotsCount: 2,
    availableTypes: ['BREAKWATER', 'REEF'],
    regionDatabaseId: 'gyeongnam_geoje',
    mapSlug: 'geoje',
  },
  // ── 전남 여수 ──
  {
    id: 'jeonnam_yeosu',
    name: '전남 여수',
    nameEn: 'Yeosu, Jeonnam',
    shortName: '여수',
    shortNameEn: 'Yeosu',
    region: '전라남도',
    pixelX: 124,
    pixelY: 183,
    spotsCount: 1,
    availableTypes: ['BOAT', 'BREAKWATER'],
    regionDatabaseId: 'jeonnam_yeosu',
    mapSlug: 'yeosu',
  },
  // ── 제주 ──
  {
    id: 'jeju',
    name: '제주',
    nameEn: 'Jeju',
    shortName: '제주',
    shortNameEn: 'Jeju',
    region: '제주특별자치도',
    pixelX: 84,
    pixelY: 236,
    spotsCount: 1,
    availableTypes: ['BREAKWATER', 'REEF', 'BOAT'],
    regionDatabaseId: 'jeju',
    mapSlug: 'jeju',
  },
  // ── 울릉도 ──
  {
    id: 'ulleungdo',
    name: '울릉도',
    nameEn: 'Ulleungdo',
    shortName: '울릉도',
    shortNameEn: 'Ulleungdo',
    region: '경상북도',
    pixelX: 228,
    pixelY: 61,
    spotsCount: 1,
    availableTypes: ['REEF', 'BOAT'],
    regionDatabaseId: 'ulleungdo',
    mapSlug: 'ulleung',
  },
  // ── 독도 ──
  {
    id: 'dokdo',
    name: '독도',
    nameEn: 'Dokdo',
    shortName: '독도',
    shortNameEn: 'Dokdo',
    region: '경상북도',
    pixelX: 252,
    pixelY: 72,
    spotsCount: 1,
    availableTypes: ['REEF', 'BOAT'],
    regionDatabaseId: 'dokdo',
    mapSlug: 'dokdo',
  },
];

/**
 * 지역 상세 지도(zoom_{slug}) 위에 배치되는 "출조 구역" 핀포인트.
 *
 * 지역 확대 지도(예: sokcho_2_pixelazed.png, 256×256)에서 플레이어가
 * 실제로 활동할 세부 구역(속초항/동명항 등)을 선택하는 마커.
 * 클릭 시 출조 확인 팝업 → RegionFieldScene(`fieldMapId` 맵)로 진입한다.
 */
export interface RegionAreaNode {
  /** 구역 고유 ID */
  id: string;
  /** 표시 이름 (예: "속초항") */
  name: string;
  /** 영문 표시 이름 (예: "Sokcho Port") — 영어 로케일 전용 (120차). 비면 사전 폴백 */
  nameEn?: string;
  /** 짧은 설명 (팝업/라벨용) */
  desc: string;
  /** 영어 한 줄 설명 (122차 — 데이터가 곧 번역) */
  descEn?: string;
  /**
   * 지역 확대 지도(zoom_{slug}) 원본 이미지 기준 X 픽셀 좌표.
   * (WorldMapScene 핀 편집 Dev Tool로 캡처한 값)
   */
  pixelX: number;
  /** 지역 확대 지도 원본 이미지 기준 Y 픽셀 좌표 */
  pixelY: number;
  /** 진입할 RegionFieldScene 맵 ID (RegionMapGraph의 노드 id) */
  fieldMapId: string;
  /**
   * 262차 — 심리스 구역별 스폰(WGS84 위도 · 경도). 필드가 데이터 지역 meta bbox로 타일을 구해 걷는 칸으로 스냅한다.
   * 없으면 데이터 지역 기본 스폰(`meta.spawn`). 레거시 맵은 쓰지 않는다. 바다 위 점이면 가장 가까운 걷는 칸으로 간다.
   */
  spawnLatLon?: [number, number];

  // ── 낚시터 특성 (2026-07-16 실지 리서치 기반 — 지도 선택 화면 표시용) ──
  /** 특성 상세 라인 (지형/주요 어종/계절/시간대 등 — 출조 확인 카드에 표시) */
  details?: string[];
  /** 영어 상세 라인 (details와 1:1) */
  detailsEn?: string[];
  /** 대표 수심 범위 (m) — 스폰/캐스팅 밸런싱 참고치 */
  depthRangeM?: [number, number];
  /** 밑걸림 위험도 — 여밭/암반 지형의 채비 손실 위험 (high면 채비 손실 확률 상승) */
  snagRisk?: 'low' | 'mid' | 'high';
  /**
   * 필드 타일맵 준비 여부. false면 핀/설명은 표시하되 출조(인게임 진입)는 차단하고
   * '필드 준비중' 안내를 띄운다. 생략 시 true (진입 가능).
   */
  enterable?: boolean;
}

/** 밑걸림 위험도 표시 라벨 */
export const SNAG_RISK_LABEL: Record<NonNullable<RegionAreaNode['snagRisk']>, string> = {
  low: '밑걸림 낮음',
  mid: '밑걸림 주의',
  high: '밑걸림 위험 (여밭·암반)',
};

/**
 * 밑걸림 위험도 → 1인칭 밑걸림 배율 (BiteContext.snagRiskMult).
 * high 지역은 유예가 ~3초로 줄고 발동 확률도 1.6배 — 뒷줄견제(H)가 필수가 된다.
 */
export const SNAG_RISK_MULT: Record<NonNullable<RegionAreaNode['snagRisk']>, number> = {
  low: 0.6,
  mid: 1.0,
  high: 1.6,
};

/** 구역 ID(RegionAreaNode.id)로 구역 조회 — 전 지역 통합 검색 */
export function getAreaNodeById(areaId: string): RegionAreaNode | undefined {
  for (const nodes of Object.values(REGION_AREA_NODES)) {
    const hit = nodes.find((n) => n.id === areaId);
    if (hit) return hit;
  }
  return undefined;
}

/** 구역의 밑걸림 배율 (미지정 구역/위험도는 1.0) */
export function getAreaSnagRiskMult(areaId: string | null | undefined): number {
  if (!areaId) return 1.0;
  const risk = getAreaNodeById(areaId)?.snagRisk;
  return risk ? SNAG_RISK_MULT[risk] : 1.0;
}

/**
 * 지역 ID(regionDatabaseId) → 해당 지역 확대 지도의 출조 구역 목록.
 *
 * 이 맵에 항목이 존재하는 지역만 "준비 완료(입장 가능)" 로 간주된다.
 * 현재는 속초만 준비됨 — 나머지 지역은 잠금 처리.
 */
export const REGION_AREA_NODES: Record<string, RegionAreaNode[]> = {
  // ── 속초 (동해 — 조석 간만 작고 급심·물 맑음. 예민한 채비 유리) ──
  gangwon_sokcho: [
    {
      id: 'sokcho_area_sokchohang',
      name: '속초항',
      nameEn: 'Sokcho Port',
      // 265차 — 속초 출조 지점은 이것 하나(사용자 결정 「그냥 속초항 하나로 하자. 어차피 한 맵에서 이동가능한 위치라서」).
      //   동명항 노드를 뺐다 — 같은 심리스 맵이고 내리는 자리 사이가 걸어서 90칸(450m · 약 14초)이다.
      //   규칙: 같은 데이터 지역 안에서 내리는 자리끼리 걸어서 약 30초(200칸 · 1km) 안이면 노드 하나, 멀면 따로 둔다(부산 감천 4곳처럼 — 가장 가까운 쌍 461칸).
      desc: '속초 대표 항구 · 원투 도다리의 성지 · 북쪽 동명항까지 걸어서 간다',
      descEn: "Sokcho's main harbour · surf-casting flounder heaven · Dongmyeong Port is a short walk north",
      pixelX: 184,
      pixelY: 60,
      fieldMapId: 'sokcho_sokchohang_1',
      // 262차 — 속초항 여객선터미널 앞 부두(타일 466,156 — 'p' 포장 안벽). 구 동작 = 동명항 기본 스폰 하나
      spawnLatLon: [38.2104, 128.5945],
      details: [
        '외항·내항·수로·해변으로 구역이 나뉨 (난이도: 수로 < 내항 < 해변 < 외항)',
        '내항·수로는 완만한 바닥 — 가족·입문 낚시 추천, 외항은 여·급심 본류대',
        '대표 어종: 도다리(원투·지렁이) · 학공치 · 우럭 · 볼락 · 가자미',
        '봄·가을 도다리/가자미 · 여름 오징어(무늬/한치) · 겨울 볼락',
        '원투 도다리는 주간~해질녘, 볼락·오징어는 야간',
        '북쪽 동명항(걸어서 450m)은 겨울 명태 · 임연수어 · 학공치 — 외항 쪽은 급심, 볼락·우럭은 야간 루어',
      ],
      detailsEn: [
        'Divided into outer harbour, inner harbour, channel and beach (difficulty: channel < inner < beach < outer)',
        'Inner harbour and channel have a gentle bottom — good for families and beginners; the outer harbour is reef and deep main current',
        'Key species: flounder (surf casting, worms) · halfbeak · rockfish · black rockfish · flatfish',
        'Spring/autumn flounder and flatfish · summer squid (bigfin/swordtip) · winter rockfish',
        'Surf-cast flounder by day to dusk; rockfish and squid at night',
        'Dongmyeong Port, a 450 m walk north: winter pollock, Arabesque greenling and halfbeak — the outer side drops steeply; rockfish on night lures',
      ],
      depthRangeM: [3, 20],
      snagRisk: 'mid',
    },
  ],

  // ── 부산 (남해 — 대형 상항·도심 방파제. 타일맵 8종 제작 완료 2026-07-17 — 출조 개방) ──
  // 핀 좌표: busan_2_pixelazed -pin.png의 노란 점 4개에서 픽셀 추출 (2026-07-16)
  busan: [
    {
      id: 'busan_area_gamcheon_west',
      name: '감천항 서방파제',
      nameEn: 'Gamcheon West Breakwater',
      desc: '깊은 물골의 상항 방파제 · 겨울 감성돔',
      descEn: 'Deep-channel commercial breakwater · winter black seabream',
      pixelX: 21,
      pixelY: 232,
      fieldMapId: 'busan_gamcheon_west_1',
      // 262차 — 감천항 서쪽 바깥 방파제(추론 'b' 띠 · 걷기 성분은 감천동 쪽 — 반도 쪽과 길이 이어지지 않는다)
      spawnLatLon: [35.04855, 129.00369],
      details: [
        '대형선이 드나드는 상항이라 물골이 깊음 (약 12~16m 추정)',
        '외항 방향 수중여 — 감성돔 포인트이나 밑걸림 주의',
        '대표 어종: 감성돔(연중·피크 겨울) · 벵에돔(초여름) · 학공치 · 전어',
        '원투: 도다리 · 보리멸 · 붕장어 생활낚시',
        '일몰 전후 1시간 집중 · 아침·해질녘 유리',
      ],
      detailsEn: [
        'A commercial harbour with a deep channel (about 12–16m)',
        'Underwater reef on the outer side — black seabream point, but watch for snags',
        'Key species: black seabream (year round, peak winter) · blackfish (early summer) · halfbeak · gizzard shad',
        'Surf casting: flounder · whiting · conger eel',
        'One hour around sunset is prime · mornings and dusk favourable',
      ],
      depthRangeM: [12, 16],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_gamcheon_east',
      name: '감천항 동방파제',
      nameEn: 'Gamcheon East Breakwater',
      desc: '평균 12~16m 급심 · 14종+ 어종 백화점',
      descEn: '12–16m deep · a department store of 14+ species',
      pixelX: 32,
      pixelY: 227,
      fieldMapId: 'busan_gamcheon_east_1',
      // 262차 — 암남 반도 남서 끝(동방파제 뿌리 · 타일 432,688)
      spawnLatLon: [35.05103, 129.00874],
      details: [
        '평균 수심 12~16m — 겨울 감성돔 적격, 직벽 구조로 발판 양호',
        '외항 쪽 수중여 3개 포인트 — 감성돔/돌돔 노림, 밑걸림 잦음',
        '대표 어종: 감성돔 · 벵에돔 · 돌돔 · 학공치 · 전갱이 · 볼락 · 전어 · 고등어 · 쥐치 등 14종+',
        '감성돔 피크 겨울 · 2월경 학공치/전어 · 3월 이후 전 어종 활성',
        '아침·저녁, 일몰 전~후 1시간 집중 · 학공치/전어는 낮 카드채비',
      ],
      detailsEn: [
        'Average depth 12–16m — ideal for winter black seabream; sheer wall gives good footing',
        'Three underwater reefs on the outer side — seabream and knifejaw, frequent snags',
        'Key species: black seabream · blackfish · knifejaw · halfbeak · horse mackerel · rockfish · gizzard shad · mackerel · filefish and more (14+)',
        'Black seabream peaks in winter · halfbeak/shad around February · everything active from March',
        'Mornings, evenings and one hour around sunset · halfbeak/shad on daytime sabiki rigs',
      ],
      depthRangeM: [12, 16],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_amnam',
      name: '암남공원 (송도)',
      nameEn: 'Amnam Park (Songdo)',
      desc: '에깅 1번지 · 여밭 루어의 성지',
      descEn: 'Eging No.1 · lure heaven over reef beds',
      pixelX: 52,
      pixelY: 208,
      fieldMapId: 'busan_amnam_1',
      // 262차 — 암남공원 입구(화장실 · 식당 무리 옆 보도 · 타일 650,445)
      spawnLatLon: [35.06196, 129.02071],
      details: [
        '가까운 쪽: 여밭·암반 4~5m 낙차 (밑걸림 위험) / 먼 쪽: 6~10m 모래·펄·여밭 혼재',
        '대표 어종: 우럭 · 감성돔 · 광어 · 농어 · 호래기 · 문어',
        '무늬오징어·갑오징어 에깅 명소 — 송도 매립지 에깅 1번지',
        '겨울 전갱이·볼락 루어 호황 (겨울엔 전갱이가 볼락보다 잘 낚임)',
        '야간 루어·에깅 활발 — 진입 15분+ 후 활성화 경향',
      ],
      detailsEn: [
        'Near side: reef and rock with 4–5m drops (snag risk) / far side: 6–10m mixed sand, mud and reef',
        'Key species: black rockfish · black seabream · flatfish · sea bass · beka squid · octopus',
        'Bigfin and cuttlefish eging hotspot — Songdo reclaimed land is eging No.1',
        'Winter horse mackerel and rockfish lures thrive (horse mackerel outfish rockfish in winter)',
        'Night lures and eging are lively — tends to switch on 15+ minutes after arriving',
      ],
      depthRangeM: [4, 10],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_namhang',
      name: '남항 · 공동어시장',
      nameEn: 'South Port · Cooperative Fish Market',
      desc: '2장 「위판」의 무대 — 새벽 경매 · 자갈치 활어 골목',
      descEn: 'Stage of Chapter 2, "The Auction" — dawn auctions and the Jagalchi live-fish alley',
      pixelX: 62,
      pixelY: 196,
      fieldMapId: 'busan_namhang_1',
      // 263차 — 부산공동어시장(35.0884, 129.0252) 앞 안벽 — 감천 bbox를 북쪽 35.095까지 늘려 담았다(요청 5)
      spawnLatLon: [35.0878, 129.0262],
      details: [
        '부산공동어시장 — 전국에서 가장 큰 위판장. 새벽 경매가 서고 낮에는 맡겨 둔다',
        '남항 안벽은 수심 6~12m · 물이 탁한 날이 많다 — 전갱이 · 고등어 · 숭어 생활낚시',
        '자갈치 쪽 안벽에서는 겨울 볼락 · 학공치 · 봄 도다리',
        '대표 어종: 전갱이 · 고등어 · 숭어 · 볼락 · 학공치 · 감성돔(겨울)',
        '배가 드나드는 안벽이라 던지기 전에 좌우를 본다',
      ],
      detailsEn: [
        'Busan Cooperative Fish Market — the largest auction house in Korea. Dawn auctions; consign during the day',
        'The South Port quay is 6–12m deep and often murky — horse mackerel · mackerel · mullet casual fishing',
        'On the Jagalchi side: winter rockfish · halfbeak · spring flounder',
        'Key species: horse mackerel · mackerel · mullet · rockfish · halfbeak · black seabream (winter)',
        'Boats come and go along the quay — look both ways before casting',
      ],
      depthRangeM: [6, 12],
      snagRisk: 'mid',
    },
    {
      id: 'busan_area_baekunpo',
      name: '백운포 체육공원',
      nameEn: 'Baegunpo Sports Park',
      desc: '석축 생활낚시 · 여름밤 갈치 루어',
      descEn: 'Stone-wall casual fishing · summer-night hairtail lures',
      pixelX: 176,
      pixelY: 137,
      fieldMapId: 'busan_baegunpo_1',
      // 262차 — 백운포 체육공원 북쪽 길(데이터 지역 busan_baegunpo 기본 스폰과 같은 자리)
      spawnLatLon: [35.1075, 129.1095],
      details: [
        '석축·일자방파제 중심 — 석축에서 찌를 내리는 얕은 근거리 수역',
        '대표 어종: 학공치 · 전어 · 고등어(쉽게 붙음) · 호래기 · 농어 · 부시리',
        '볼락 · 감성돔 · 벵에돔 · 돌돔 · 갑오징어 · 무늬오징어',
        '초여름 풀치 ~ 가을 갈치 루어 포인트로 인기 · 벵에돔은 초여름(수온 15℃↑)',
        '야간 활발 (갈치·호래기·볼락 루어) · 일자방파제가 최고 조황',
      ],
      detailsEn: [
        'Centred on the stone wall and straight breakwater — a shallow near-shore zone to drop floats from the wall',
        'Key species: halfbeak · gizzard shad · mackerel (easy) · beka squid · sea bass · amberjack',
        'Rockfish · black seabream · blackfish · knifejaw · cuttlefish · bigfin squid',
        'Popular for early-summer to autumn hairtail lures · blackfish in early summer (water 15℃+)',
        'Active at night (hairtail, beka squid, rockfish lures) · the straight breakwater fishes best',
      ],
      depthRangeM: [3, 8],
      snagRisk: 'mid',
    },
  ],

  // ── 262차 — 다른 육지 지역 7곳(OSM 심리스 · 속초 크기 bbox). 핀 좌표는 zoom_{slug}(256×256) 위 대략값 — 핀 편집 Dev Tool로 다듬는다.
  //   fieldMapId는 심리스 데이터 지역 선택 키(`SEAMLESS_AREA_REGIONS`)이고 레거시 맵 그래프는 없다. 스폰은 regions_config spawn과 같다.
  ulsan: [
    {
      id: 'ulsan_area_bangeojin', name: '방어진항', nameEn: 'Bangeojin Port',
      desc: '동해 남부의 큰 어항 · 겨울 방어 지깅의 성지', descEn: 'A big fishing harbour on the southern East Sea · winter yellowtail jigging mecca',
      pixelX: 178, pixelY: 115, fieldMapId: 'ulsan_bangeojin_1', spawnLatLon: [35.4870, 129.4300],
      details: [
        '방어진항 · 슬도 · 대왕암공원 갯바위가 걸어서 이어진다',
        '대표 어종: 방어(겨울) · 부시리 · 전갱이 · 고등어 · 감성돔 · 볼락',
        '슬도 갯바위 — 찌낚시 감성돔 · 벵에돔, 밑걸림 주의',
        '겨울 새벽 방어 · 여름밤 전갱이 · 볼락 루어',
      ],
      detailsEn: [
        'Bangeojin harbour, Seuldo and the Daewangam rocks are all within a walk',
        'Key species: yellowtail (winter) · amberjack · horse mackerel · mackerel · black seabream · rockfish',
        'Seuldo rocks — float fishing for seabream and blackfish, watch for snags',
        'Winter dawn yellowtail · summer-night horse mackerel · rockfish lures',
      ],
      depthRangeM: [5, 25], snagRisk: 'mid',
    },
  ],
  gyeongbuk_pohang: [
    {
      id: 'pohang_area_guryongpo', name: '구룡포항', nameEn: 'Guryongpo Port',
      desc: '대게 · 과메기의 항구 · 봄가을 참돔', descEn: 'Harbour of snow crab and gwamegi · spring and autumn red seabream',
      pixelX: 160, pixelY: 178, fieldMapId: 'pohang_guryongpo_1', spawnLatLon: [35.9900, 129.5560],
      details: [
        '큰 방파제 둘이 감싼 어항 — 외항 쪽은 급심',
        '대표 어종: 참돔(봄 · 가을) · 감성돔 · 전갱이 · 고등어 · 오징어 · 학공치',
        '봄 · 가을 새벽과 저녁이 피크 · 여름밤 오징어 에깅',
        '과메기 덕장 · 대게 거리 — 가게가 많다',
      ],
      detailsEn: [
        'A harbour wrapped by two big breakwaters — the outer side drops steeply',
        'Key species: red seabream (spring, autumn) · black seabream · horse mackerel · mackerel · squid · halfbeak',
        'Spring and autumn dawn and dusk are peak · summer-night squid eging',
        'Gwamegi drying racks and the snow-crab street — plenty of shops',
      ],
      depthRangeM: [6, 20], snagRisk: 'mid',
    },
  ],
  gyeongnam_geoje: [
    {
      id: 'geoje_area_jisepo', name: '지세포항', nameEn: 'Jisepo Port',
      desc: '동쪽 바다를 향한 아늑한 항 · 광어 · 볼락 다운샷', descEn: 'A snug harbour facing east · flatfish and rockfish downshot',
      pixelX: 236, pixelY: 118, fieldMapId: 'geoje_jisepo_1', spawnLatLon: [34.8330, 128.6990],
      details: [
        '지세포항 방파제와 안쪽 모래 · 펄 바닥 — 입문 생활낚시',
        '대표 어종: 광어 · 볼락 · 감성돔 · 전갱이 · 고등어 · 보리멸',
        '봄 · 가을 주간 지그헤드 · 다운샷 · 밤 볼락 루어',
        '외항 쪽 급심 — 겨울 감성돔',
      ],
      detailsEn: [
        'Jisepo breakwater and the sandy, muddy inner bottom — beginner-friendly casual fishing',
        'Key species: flatfish · rockfish · black seabream · horse mackerel · mackerel · whiting',
        'Spring and autumn daytime jighead and downshot · night rockfish lures',
        'The outer side drops steeply — winter black seabream',
      ],
      depthRangeM: [4, 15], snagRisk: 'low',
    },
    {
      id: 'geoje_area_haegeumgang', name: '해금강', nameEn: 'Haegeumgang',
      desc: '남해 갯바위의 끝 · 초여름 긴꼬리벵에돔', descEn: 'The far rocks of the South Sea · early-summer largescale blackfish',
      pixelX: 228, pixelY: 195, fieldMapId: 'geoje_haegeumgang_1', spawnLatLon: [34.7420, 128.6627],
      details: [
        '갈곶 갯바위와 해금강 바위섬 — 발판이 거칠다',
        '대표 어종: 긴꼬리벵에돔(초여름) · 벵에돔 · 감성돔 · 돌돔 · 참돔',
        '파도가 세면 위험 — 날씨를 본다',
        '밑걸림 많음 — 채비 여분',
      ],
      detailsEn: [
        'Galgot rocks and the Haegeumgang rock islets — rough footing',
        'Key species: largescale blackfish (early summer) · blackfish · black seabream · knifejaw · red seabream',
        'Dangerous in heavy swell — check the weather',
        'Frequent snags — bring spare rigs',
      ],
      depthRangeM: [8, 30], snagRisk: 'high',
    },
  ],
  jeonnam_yeosu: [
    {
      id: 'yeosu_area_guhang', name: '여수 구항', nameEn: 'Yeosu Old Port',
      desc: '돌산대교 아래 도심 항 · 여름밤 갈치', descEn: 'A downtown harbour under Dolsan Bridge · summer-night hairtail',
      pixelX: 115, pixelY: 52, fieldMapId: 'yeosu_guhang_1', spawnLatLon: [34.7420, 127.7440],
      details: [
        '구항 안벽 · 신항 · 오동도 방파제가 걸어서 이어진다',
        '대표 어종: 갈치(초여름~가을 밤) · 감성돔 · 전갱이 · 고등어 · 볼락 · 주꾸미',
        '밤 집어등 아래 갈치 · 전갱이 루어',
        '물때 영향이 큰 남해 — 사리 전후 조류',
      ],
      detailsEn: [
        'The old-port quay, the new port and the Odongdo breakwater are all within a walk',
        'Key species: hairtail (early summer–autumn nights) · black seabream · horse mackerel · mackerel · rockfish · webfoot octopus',
        'Hairtail under the night lights · horse mackerel lures',
        'Tide matters on the South Sea — currents around spring tides',
      ],
      depthRangeM: [5, 18], snagRisk: 'mid',
    },
  ],
  chungnam_taean: [
    {
      id: 'taean_area_anheung', name: '안흥 · 신진도', nameEn: 'Anheung · Sinjindo',
      desc: '신진도 · 안흥항 — 가을 갑오징어 에깅', descEn: 'Sinjindo and Anheung harbour — autumn cuttlefish eging',
      pixelX: 110, pixelY: 125, fieldMapId: 'taean_anheung_1', spawnLatLon: [36.6740, 126.1300],
      details: [
        '서해 — 조차가 크다 · 물이 빠지면 갯벌, 물이 들면 안벽',
        '대표 어종: 갑오징어(가을) · 주꾸미 · 우럭 · 광어 · 삼치 · 농어',
        '가을 주간 에깅 · 봄 우럭 원투',
        '신진도 방파제와 안흥 외항 — 조류가 셀 때 주의',
      ],
      detailsEn: [
        'West Sea — big tidal range · mudflats at low water, quays at high water',
        'Key species: cuttlefish (autumn) · webfoot octopus · black rockfish · flatfish · Spanish mackerel · sea bass',
        'Autumn daytime eging · spring rockfish surf casting',
        'Sinjindo breakwater and the Anheung outer harbour — mind the strong currents',
      ],
      depthRangeM: [3, 12], snagRisk: 'mid',
    },
    {
      id: 'taean_area_manripo', name: '만리포', nameEn: 'Mallipo',
      desc: '서해 포말대 — 봄여름 밤 농어 서프 루어', descEn: 'West Sea surf zone — spring and summer night sea bass on surf lures',
      pixelX: 100, pixelY: 42, fieldMapId: 'taean_manripo_1', spawnLatLon: [36.7860, 126.1430],
      details: [
        '긴 모래 해변 · 양 끝 갯바위',
        '대표 어종: 농어(봄~여름 밤) · 광어 · 우럭 · 보리멸 · 삼치',
        '파도가 적당히 있는 밤이 호황 · 서프 루어 · 원투',
        '해변은 밑걸림 낮음 · 양 끝 갯바위는 주의',
      ],
      detailsEn: [
        'A long sandy beach with rocks at both ends',
        'Key species: sea bass (spring–summer nights) · flatfish · black rockfish · whiting · Spanish mackerel',
        'Nights with moderate surf fish best · surf lures · surf casting',
        'Low snag risk on the beach · mind the rocks at both ends',
      ],
      depthRangeM: [2, 8], snagRisk: 'low',
    },
  ],
  jeju: [
    {
      id: 'jeju_area_dodu', name: '도두항', nameEn: 'Dodu Port',
      desc: '제주시 서쪽 어항 · 여름밤 한치 집어등', descEn: "A fishing harbour west of Jeju City · summer-night swordtip squid under the lights",
      pixelX: 115, pixelY: 128, fieldMapId: 'jeju_dodu_1', spawnLatLon: [33.5080, 126.4670],
      details: [
        '공항 옆 어항 — 방파제 · 도두봉 갯바위',
        '대표 어종: 한치(여름 밤) · 무늬오징어 · 벵에돔 · 독가시치 · 전갱이',
        '여름 밤 집어등 아래 한치 · 가을 에깅',
        '제주 북쪽 — 북서풍에 약하다',
      ],
      detailsEn: [
        'A harbour beside the airport — breakwaters and the Dodubong rocks',
        'Key species: swordtip squid (summer nights) · bigfin squid · blackfish · rabbitfish · horse mackerel',
        'Swordtip squid under the summer-night lights · autumn eging',
        "Jeju's north shore — exposed to north-westerlies",
      ],
      depthRangeM: [5, 20], snagRisk: 'mid',
    },
    {
      id: 'jeju_area_moseulpo', name: '모슬포 운진항', nameEn: 'Moseulpo Unjin Port',
      desc: '제주 남서 끝 · 겨울 대물 방어', descEn: "Jeju's south-west corner · big winter yellowtail",
      pixelX: 48, pixelY: 203, fieldMapId: 'jeju_moseulpo_1', spawnLatLon: [33.2140, 126.2510],
      details: [
        '운진항(가파도 배) · 모슬포항 — 바람이 센 바다',
        '대표 어종: 방어(겨울 대물) · 부시리 · 벵에돔 · 참돔 · 자리돔',
        '겨울 방어는 선상 지깅이 주류 — 항 안쪽 안벽은 생활낚시',
        '바람 · 파도 — 출조 전 날씨 확인',
      ],
      detailsEn: [
        'Unjin harbour (Gapado ferry) and Moseulpo harbour — a windy sea',
        'Key species: yellowtail (big winter fish) · amberjack · blackfish · red seabream · damselfish',
        'Winter yellowtail is mostly boat jigging — the inner quays are casual fishing',
        'Wind and swell — check the weather before going',
      ],
      depthRangeM: [8, 30], snagRisk: 'mid',
    },
    {
      id: 'jeju_area_seogwipo', name: '서귀포항', nameEn: 'Seogwipo Port',
      desc: '문섬 · 새섬 앞 남쪽 항 · 가을 무늬오징어', descEn: 'The southern harbour facing Munseom and Saeseom · autumn bigfin squid',
      pixelX: 128, pixelY: 214, fieldMapId: 'jeju_seogwipo_1', spawnLatLon: [33.2400, 126.5620],
      details: [
        '서귀포항 방파제와 새섬 산책로 — 발판이 좋다',
        '대표 어종: 무늬오징어(가을) · 벵에돔 · 돌돔 · 참돔',
        '가을 밤 얕은 곳 에깅 · 봄 벵에돔 찌낚시',
        '급심 · 조류 — 채비를 무겁게',
      ],
      detailsEn: [
        'Seogwipo breakwater and the Saeseom promenade — good footing',
        'Key species: bigfin squid (autumn) · blackfish · knifejaw · red seabream',
        'Autumn-night shallow eging · spring blackfish float fishing',
        'Deep and fast water — rig heavy',
      ],
      depthRangeM: [10, 40], snagRisk: 'mid',
    },
  ],
  incheon: [
    {
      id: 'incheon_area_yeonan', name: '연안부두', nameEn: 'Yeonan Pier',
      desc: '수도권 가까운 항 · 가을 밤 우럭', descEn: 'A harbour close to the capital · autumn-night black rockfish',
      pixelX: 188, pixelY: 128, fieldMapId: 'incheon_yeonan_1', spawnLatLon: [37.4520, 126.6010],
      details: [
        '연안부두 안벽 · 방파제 — 조차 9m의 서해',
        '대표 어종: 우럭(가을 밤 대물) · 망둥어 · 숭어 · 삼치 · 광어',
        '사리 물돌이 때 활성 · 물때표 필수',
        '밤 안벽 생활낚시 — 바닥 펄 · 밑걸림 낮음',
      ],
      detailsEn: [
        'Yeonan pier quays and breakwaters — a West Sea with a 9 m tidal range',
        'Key species: black rockfish (big autumn-night fish) · goby · mullet · Spanish mackerel · flatfish',
        'Active around spring-tide turns · a tide table is a must',
        'Night quay fishing — muddy bottom, low snag risk',
      ],
      depthRangeM: [3, 12], snagRisk: 'low',
    },
  ],
  // 294차 — 배 전용 섬 지역(6 · 7장). 울릉 bbox는 동남 해안만(사동항 · 도동항 · 행남등대 · 저동항) — 좌표는 OSM 실측
  ulleungdo: [
    {
      id: 'ulleungdo_area_dodong', name: '도동항', nameEn: 'Dodong Port',
      desc: '여객선이 닿는 섬의 현관 · 행남등대 갯바위', descEn: "The island's front door where the ferry lands · Haengnam lighthouse rocks",
      pixelX: 149, pixelY: 167, fieldMapId: 'ulleung_dodong_1', spawnLatLon: [37.4835, 130.9070],
      details: [
        '도동항 방파제 · 행남 해안산책로 갯바위 — 발밑이 바로 급심',
        '대표 어종: 참돔 · 돌돔 · 벵에돔 · 부시리 · 방어 · 살오징어(밤 집어등)',
        '난류를 타고 오는 등푸른 생선 — 여름 끝 ~ 가을 가다랑어 · 삼치 회유',
        '결항이 잦다 — 바람이 세면 배가 안 뜬다(섬에 묶이는 날)',
      ],
      detailsEn: [
        'Dodong breakwater and the Haengnam coastal path rocks — deep water right at your feet',
        'Key species: red seabream · knifejaw · blackfish · amberjack · yellowtail · flying squid (night lights)',
        'Pelagics riding the warm current — skipjack and Spanish mackerel from late summer into autumn',
        'Ferries are often cancelled — when the wind is up, nothing sails (island-bound days)',
      ],
      depthRangeM: [8, 40], snagRisk: 'high',
    },
  ],
  dokdo: [
    {
      id: 'dokdo_area_dongdo', name: '동도 접안시설', nameEn: 'Dongdo Landing',
      desc: '가장 먼 바다 · 기상이 허락할 때만', descEn: 'The farthest sea · only when the weather allows',
      pixelX: 120, pixelY: 186, fieldMapId: 'dokdo_dongdo_1', spawnLatLon: [37.2394, 131.8686],
      details: [
        '동도 접안시설 · 독도등대 아래 갯바위 — 체류 시간이 정해져 있다',
        '대표 어종: 방어 · 부시리 · 참돔 · 돌돔 · 벵에돔 · 가다랑어',
        '독도 새우(도화새우 · 물렁가시붉은새우) · 소라 · 전복 · 해삼의 바다',
        '조사선 해역 — 잡는 게 목적이 아닌 낚시(계측 → 방류)',
      ],
      detailsEn: [
        'Dongdo landing and the rocks below the Dokdo lighthouse — your stay is timed',
        'Key species: yellowtail · amberjack · red seabream · knifejaw · blackfish · skipjack',
        'The sea of Dokdo shrimp (spotted · humpback), turban shell, abalone and sea cucumber',
        'Survey waters — fishing that is not about keeping (measure, then release)',
      ],
      depthRangeM: [10, 60], snagRisk: 'high',
    },
  ],
};

/** 해당 지역이 준비되어(입장 가능) 있는지 여부 */
export function isRegionUnlocked(regionId: string): boolean {
  return (REGION_AREA_NODES[regionId]?.length ?? 0) > 0;
}

/** 특정 지역의 출조 구역 목록 조회 */
export function getRegionAreaNodes(regionId: string): RegionAreaNode[] {
  return REGION_AREA_NODES[regionId] ?? [];
}
