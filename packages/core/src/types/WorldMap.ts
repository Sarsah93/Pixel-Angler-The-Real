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
  /** 짧은 이름 (지도 레이블용, 예: "포항") */
  shortName: string;
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
    shortName: '속초',
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
    shortName: '인천',
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
    shortName: '태안',
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
    shortName: '포항',
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
    shortName: '울산',
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
    shortName: '부산',
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
    shortName: '거제',
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
    shortName: '여수',
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
    shortName: '제주',
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
    shortName: '울릉도',
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
    shortName: '독도',
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
  /** 짧은 설명 (팝업/라벨용) */
  desc: string;
  /**
   * 지역 확대 지도(zoom_{slug}) 원본 이미지 기준 X 픽셀 좌표.
   * (WorldMapScene 핀 편집 Dev Tool로 캡처한 값)
   */
  pixelX: number;
  /** 지역 확대 지도 원본 이미지 기준 Y 픽셀 좌표 */
  pixelY: number;
  /** 진입할 RegionFieldScene 맵 ID (RegionMapGraph의 노드 id) */
  fieldMapId: string;

  // ── 낚시터 특성 (2026-07-16 실지 리서치 기반 — 지도 선택 화면 표시용) ──
  /** 특성 상세 라인 (지형/주요 어종/계절/시간대 등 — 출조 확인 카드에 표시) */
  details?: string[];
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
      desc: '속초 대표 항구 · 원투 도다리의 성지',
      pixelX: 184,
      pixelY: 60,
      fieldMapId: 'sokcho_sokchohang_1',
      details: [
        '외항·내항·수로·해변으로 구역이 나뉨 (난이도: 수로 < 내항 < 해변 < 외항)',
        '내항·수로는 완만한 바닥 — 가족·입문 낚시 추천, 외항은 여·급심 본류대',
        '대표 어종: 도다리(원투·지렁이) · 학공치 · 우럭 · 볼락 · 가자미',
        '봄·가을 도다리/가자미 · 여름 오징어(무늬/한치) · 겨울 볼락',
        '원투 도다리는 주간~해질녘, 볼락·오징어는 야간',
      ],
      depthRangeM: [3, 18],
      snagRisk: 'mid',
    },
    {
      id: 'sokcho_area_dongmyeonghang',
      name: '동명항',
      desc: '겨울 명태로 유명한 동해 어항 · 사계절 낚시',
      pixelX: 221,
      pixelY: 49,
      fieldMapId: 'sokcho_dongmyeonghang_1',
      details: [
        '시설이 잘 갖춰진 동해안 어항 — 외항 쪽은 급심',
        '대표 어종: 명태(겨울) · 가자미 · 임연수어 · 도다리 · 학공치 · 볼락 · 우럭',
        '사계절 가능, 겨울이 최고 시즌 (명태) · 학공치는 가을~겨울',
        '피크 시간대: 새벽 4~7시 / 밤 9시~자정 · 볼락·우럭은 야간 루어',
      ],
      depthRangeM: [4, 20],
      snagRisk: 'mid',
    },
  ],

  // ── 부산 (남해 — 대형 상항·도심 방파제. 타일맵 8종 제작 완료 2026-07-17 — 출조 개방) ──
  // 핀 좌표: busan_2_pixelazed -pin.png의 노란 점 4개에서 픽셀 추출 (2026-07-16)
  busan: [
    {
      id: 'busan_area_gamcheon_west',
      name: '감천항 서방파제',
      desc: '깊은 물골의 상항 방파제 · 겨울 감성돔',
      pixelX: 21,
      pixelY: 232,
      fieldMapId: 'busan_gamcheon_west_1',
      details: [
        '대형선이 드나드는 상항이라 물골이 깊음 (약 12~16m 추정)',
        '외항 방향 수중여 — 감성돔 포인트이나 밑걸림 주의',
        '대표 어종: 감성돔(연중·피크 겨울) · 벵에돔(초여름) · 학공치 · 전어',
        '원투: 도다리 · 보리멸 · 붕장어 생활낚시',
        '일몰 전후 1시간 집중 · 아침·해질녘 유리',
      ],
      depthRangeM: [12, 16],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_gamcheon_east',
      name: '감천항 동방파제',
      desc: '평균 12~16m 급심 · 14종+ 어종 백화점',
      pixelX: 32,
      pixelY: 227,
      fieldMapId: 'busan_gamcheon_east_1',
      details: [
        '평균 수심 12~16m — 겨울 감성돔 적격, 직벽 구조로 발판 양호',
        '외항 쪽 수중여 3개 포인트 — 감성돔/돌돔 노림, 밑걸림 잦음',
        '대표 어종: 감성돔 · 벵에돔 · 돌돔 · 학공치 · 전갱이 · 볼락 · 전어 · 고등어 · 쥐치 등 14종+',
        '감성돔 피크 겨울 · 2월경 학공치/전어 · 3월 이후 전 어종 활성',
        '아침·저녁, 일몰 전~후 1시간 집중 · 학공치/전어는 낮 카드채비',
      ],
      depthRangeM: [12, 16],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_amnam',
      name: '암남공원 (송도)',
      desc: '에깅 1번지 · 여밭 루어의 성지',
      pixelX: 52,
      pixelY: 208,
      fieldMapId: 'busan_amnam_1',
      details: [
        '가까운 쪽: 여밭·암반 4~5m 낙차 (밑걸림 위험) / 먼 쪽: 6~10m 모래·펄·여밭 혼재',
        '대표 어종: 우럭 · 감성돔 · 광어 · 농어 · 호래기 · 문어',
        '무늬오징어·갑오징어 에깅 명소 — 송도 매립지 에깅 1번지',
        '겨울 전갱이·볼락 루어 호황 (겨울엔 전갱이가 볼락보다 잘 낚임)',
        '야간 루어·에깅 활발 — 진입 15분+ 후 활성화 경향',
      ],
      depthRangeM: [4, 10],
      snagRisk: 'high',
    },
    {
      id: 'busan_area_baekunpo',
      name: '백운포 체육공원',
      desc: '석축 생활낚시 · 여름밤 갈치 루어',
      pixelX: 176,
      pixelY: 137,
      fieldMapId: 'busan_baegunpo_1',
      details: [
        '석축·일자방파제 중심 — 석축에서 찌를 내리는 얕은 근거리 수역',
        '대표 어종: 학공치 · 전어 · 고등어(쉽게 붙음) · 호래기 · 농어 · 부시리',
        '볼락 · 감성돔 · 벵에돔 · 돌돔 · 갑오징어 · 무늬오징어',
        '초여름 풀치 ~ 가을 갈치 루어 포인트로 인기 · 벵에돔은 초여름(수온 15℃↑)',
        '야간 활발 (갈치·호래기·볼락 루어) · 일자방파제가 최고 조황',
      ],
      depthRangeM: [3, 8],
      snagRisk: 'mid',
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
