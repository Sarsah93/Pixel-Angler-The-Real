/**
 * @file RegionMap.ts
 * @description 지역 상세 필드(탑다운 타일맵) 데이터 타입 및 맵 연결 그래프
 *
 * 실제 지형 지도 이미지를 색상 분류한 타일 그리드(`tools/build_region_maps.py` 산출물,
 * `public/data/<region>/<mapId>.json`)를 게임 씬(`RegionFieldScene`)이 소비한다.
 *
 * 타일 문자 규칙:
 *  '.' = 육지/도로 (이동 가능)
 *  '~' = 바다        (이동 불가, 낚시 캐스팅 대상)
 *  '#' = 건물        (충돌, 상호작용 후보)
 *  ',' = 잔디/공원   (이동 가능)
 *
 * OSM 심리스 v2 확장 (OSM_TILEMAP_SPEC §2 — 2026-08-27):
 *  'r' = 차도        (이동 가능 — 시각 구분(차선·연석) + 자전거 속도 보정 예약)
 *  'w' = 보도/인도   (이동 가능 — 차도와 분리. 차도 양옆 프린지 자동 생성)
 *  's' = 모래사장    (이동 가능, 원투 낚시 가능)
 *  'b' = 방파제·부두 (이동 가능, 낚시 캐스팅의 핵심 발판)
 */

/** 타일 지형 종류 (road/sidewalk/sand/pier = OSM 심리스 v2 신규) */
export type RegionTerrain = 'land' | 'water' | 'building' | 'grass' | 'road' | 'sidewalk' | 'sand' | 'pier';

/** 지형 문자 → 지형 종류 매핑 */
export const TERRAIN_BY_CHAR: Record<string, RegionTerrain> = {
  '.': 'land',
  '~': 'water',
  '#': 'building',
  ',': 'grass',
  'r': 'road',
  'w': 'sidewalk',
  's': 'sand',
  'b': 'pier',
};

/** 이동 가능 지형 판정 (심리스 v2 — walkable = . , r w s b) */
export function isWalkableTerrain(t: RegionTerrain | undefined): boolean {
  return t === 'land' || t === 'grass' || t === 'road' || t === 'sidewalk'
    || t === 'sand' || t === 'pier';
}

/**
 * 낚시 발판 지형 판정 — 심리스 모드의 캐스팅 규칙(OSM_TILEMAP_SPEC §5):
 * `fishableFrom = (방파제 'b' | 모래사장 's') && 인접 8방향에 바다 '~'`.
 * 인접 검사는 그리드를 가진 호출측(씬)이 수행하고, 여기는 발판 지형 여부만 답한다.
 */
export function isFishableStandTerrain(t: RegionTerrain | undefined): boolean {
  return t === 'pier' || t === 'sand';
}

// ═══════════════════════════════════════════════════════════════════
// OSM 심리스 v2 — 지역 메타 · POI (OSM_TILEMAP_SPEC §4·§5, 2026-08-27)
// ═══════════════════════════════════════════════════════════════════

/** 지역 메타 — `pixelazed/<region>/meta.json` 로드 결과 (build_osm_tilemap.py 산출) */
export interface RegionMeta {
  region: string;
  /** (남, 서, 북, 동) — WGS84 */
  bbox: [number, number, number, number];
  /** 1타일 = N 미터 (현재 10) */
  tileMeters: number;
  width: number;
  height: number;
  /** 스폰 타일 [tx, ty] — 대략 좌표를 build가 최근접 이동가능 타일로 스냅한 값 */
  spawn?: [number, number] | null;
  spawnName?: string;
  /** 스폰이 대략값(±수백 m)임을 표시 — terrain.txt 검수 대상 */
  spawnApprox?: boolean;
}

/** OSM 추출 POI 타입 (스펙 §4 — ferry_terminal = 배낚시 확장 훅) */
export type PoiType =
  | 'shop' | 'toilet' | 'police' | 'ferry_terminal' | 'fuel' | 'restaurant'
  | 'cafe' | 'market' | 'bank' | 'pharmacy' | 'lighthouse' | 'info'
  | 'viewpoint' | 'lodging' | 'fishing_spot';

/** OSM 심리스 POI — 타일과 분리된 `pois.json` 항목 */
export interface RegionPoi {
  type: PoiType;
  /** type='shop'일 때 OSM shop=* 값 보존 (seafood/convenience/supermarket …) */
  shopKind?: string;
  name: string;
  tx: number;
  ty: number;
  /**
   * 출입구 타일 (손 지정 오버라이드). 없으면 클라이언트가 앵커에서 가장 가까운
   * 'r'/'.' 타일을 문 위치로 자동 배치한다 (스펙 §4 출입구 규칙).
   */
  door?: [number, number];
  osmId: number;
}

/** 차도 중심선 벡터 (build_osm_tilemap.py roads.json) — 타일 좌표 폴리라인 */
export interface RegionRoad {
  /** OSM highway 클래스 (primary/residential …) */
  cls: string;
  /** 차도 폭 (타일 수) */
  w: number;
  /** 방향당 차로 수 (차선 점선 개수 = lanes − 1) */
  lanes?: number;
  /** 회전교차로 링 (OSM junction=roundabout — pts 순서 = 주행 방향, 반시계) */
  roundabout?: boolean;
  /** 일방통행 (pts 순서 = 주행 방향) */
  oneway?: boolean;
  pts: [number, number][];
}

/** 수동 배치 프롭 (dev 맵 편집기 — patch.json) */
export interface RegionProp {
  /** 타일 좌표 — **소수 허용**(106차 자유 배치: 겹침 허용 모드에서 타일 격자에 스냅하지 않는다) */
  tx: number;
  ty: number;
  /** 프롭 id (client SeamlessChunks PROP_DEFS 키) */
  id: string;
  /** 회전 (0=0° 1=90° 2=180° 3=270°) — 편집기 R/Shift+R */
  rot?: 0 | 1 | 2 | 3;
  /** 좌우 반전 */
  fx?: boolean;
  /** 상하 반전 */
  fy?: boolean;
  /** 겹침 허용으로 놓인 것 — 충돌 바디를 만들지 않는다(테트라포드 무더기 등) */
  free?: boolean;
}

/**
 * 타일 그림 오버라이드(106차) — 편집기에서 **개별 시트 셀**을 지형 위에 찍은 것.
 * 걷기·충돌은 여전히 지형 문자(`tiles`)가 결정하고, 이 목록은 **그림만** 바꾼다.
 */
export interface RegionTileTex {
  tx: number;
  ty: number;
  /** 텍스처 키 (TileCatalog.PLACEABLE_TILES.key) */
  tex: string;
  rot?: 0 | 1 | 2 | 3;
  fx?: boolean;
  fy?: boolean;
}

/**
 * dev 맵 편집기 패치 — `pixelazed/<region>/patch.json` (정본) = `public/data/<region>/patch.json`.
 * 타일 오버라이드는 build_region_maps가 seamless.json에 굽고, 런타임도 로드 시 한 번 더 덮어쓴다
 * (재빌드 없이 F5 반영). 프롭·지붕 오버라이드는 런타임 전용.
 */
export interface RegionPatch {
  /** [col, row, 타일 문자] */
  tiles: [number, number, string][];
  props: RegionProp[];
  /** 건물 컴포넌트 좌상단 "c,r" → 지붕 팔레트 인덱스 */
  roofs: Record<string, number>;
  /** 도로 벡터 전체 오버라이드 (편집기 도로 툴 — 있으면 roads.json 대신 이 목록을 쓴다) */
  roads?: RegionRoad[];
  /** 개별 타일 그림 오버라이드 (106차 — 그림만, 걷기는 tiles가 결정) */
  tileTex?: RegionTileTex[];
}

/**
 * 지역 렌더 모드 — 'seamless'면 SEAMLESS_REGIONS에 등록된 지역은
 * 심리스 단일 맵(청크 스트리밍)으로 열리고 맵 그래프(엣지 전환)를 무시한다.
 * 미등록 지역(부산·홈타운 등)은 모드와 무관하게 legacy 그래프로 동작한다.
 * legacy 7맵 체인(SOKCHO_MAP_GRAPH)은 삭제하지 않는다 — 폴백용 보존 (스펙 §5).
 */
export const ACTIVE_REGION_MODE: 'legacy' | 'seamless' = 'seamless';

/** 심리스 지역 정의 — 데이터 폴더(`public/` 기준)와 표시 이름 */
export interface SeamlessRegionDef {
  /** 데이터 지역 키 (pixelazed·public/data 폴더명 — regions_config.py의 키) */
  dataRegion: string;
  dataDir: string;
  name: string;
}

/** WorldMap 지역 ID → 심리스 지역 정의 (등록 = 심리스 개방) */
export const SEAMLESS_REGIONS: Record<string, SeamlessRegionDef> = {
  gangwon_sokcho: { dataRegion: 'sokcho_v2', dataDir: 'data/sokcho_v2', name: '속초' },
};

/** 현재 모드에서 이 지역이 심리스로 열리는가 (아니면 undefined = legacy 경로) */
export function seamlessRegionOf(regionId: string): SeamlessRegionDef | undefined {
  return ACTIVE_REGION_MODE === 'seamless' ? SEAMLESS_REGIONS[regionId] : undefined;
}

/** 맵 상의 관심지점(POI) — 식당/카페/마트 등 아이콘 추론 결과 */
export interface RegionMapPoi {
  /** 타일 열 좌표 */
  col: number;
  /** 타일 행 좌표 */
  row: number;
  /** POI 종류 (현재 아이콘 색 추론: 'food' 등) */
  kind: string;
}

/**
 * 지역 상세 맵 1장의 타일 데이터 (JSON 스키마)
 * `tools/build_region_maps.py`가 생성.
 */
export interface RegionMapData {
  /** 맵 고유 ID (파일명과 동일) */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 원본 이미지 픽셀 / 타일 (분류 해상도) */
  tile: number;
  /** 그리드 열 수 */
  cols: number;
  /** 그리드 행 수 */
  rows: number;
  /** 지형 문자 그리드 (행 배열, 각 행은 cols 길이 문자열) */
  terrain: string[];
  /** 추출된 POI 목록 */
  pois: RegionMapPoi[];
}

/** 맵 가장자리 방향 */
export type EdgeDir = 'N' | 'S' | 'E' | 'W';

/** 반대 방향 헬퍼 (전환 시 진입 엣지 계산용) */
export const OPPOSITE_EDGE: Record<EdgeDir, EdgeDir> = {
  N: 'S', S: 'N', E: 'W', W: 'E',
};

/** 한 맵의 가장자리별 이웃 맵 연결 정의 */
export interface RegionMapLinks {
  N?: string;
  S?: string;
  E?: string;
  W?: string;
}

/** 지역 맵 그래프 노드 (맵 ID → 이웃 연결) */
export interface RegionMapNode {
  /** 맵 ID */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 가장자리별 이웃 맵 연결 */
  links: RegionMapLinks;
}

/** 지역 맵 그래프 (지역 ID → 노드 배열 + 진입 시작 맵) */
export interface RegionMapGraph {
  /** 지역 ID (WorldMap regionDatabaseId 계열) */
  region: string;
  /** WorldMap에서 진입 시 시작하는 맵 ID */
  entryMapId: string;
  /** 정적 파일 경로 접두 (`public/` 기준) */
  dataDir: string;
  /**
   * 실측 연안 수심 프로필 JSON 경로 (`public/` 기준).
   * 미지정 지역은 로드 시도 자체를 하지 않는다 — Vite dev의 SPA 폴백이
   * 404 대신 index.html을 돌려줘 JSON 파싱 에러가 나기 때문.
   * (`tools/build_depth_profiles.py`로 생성 후 여기에 경로 등록)
   */
  depthProfileUrl?: string;
  /** 맵 노드 목록 */
  nodes: RegionMapNode[];
}

/**
 * 속초 지역 맵 연결 그래프
 *
 * 공간 배치 (사용자 명세):
 *  - 속초항: 세로 스택 — 북측(1) 위, 중앙(2) 가운데, 남측(3) 아래
 *  - 속초항 북측(1)의 우측(E)에 연결로(브릿지)
 *  - 브릿지 우측(E)에 동명항 북측(1)
 *  - 동명항: 세로 스택 — 북측(1) 위, 중앙(2), 남측(3) 아래 (방파제)
 *
 * 이동 체인:
 *  속초항 남측 ↕ 속초항 중앙 ↕ 속초항 북측 ↔ 연결로 ↔ 동명항 북측 ↕ 동명항 중앙 ↕ 동명항 남측
 */
export const SOKCHO_MAP_GRAPH: RegionMapGraph = {
  region: 'gangwon_sokcho',
  entryMapId: 'sokcho_sokchohang_1',
  dataDir: 'data/sokcho',
  depthProfileUrl: 'data/depth/gangwon_sokcho.json',
  nodes: [
    { id: 'sokcho_sokchohang_3', name: '속초항 (남측)',
      links: { N: 'sokcho_sokchohang_2' } },
    { id: 'sokcho_sokchohang_2', name: '속초항 (중앙)',
      links: { N: 'sokcho_sokchohang_1', S: 'sokcho_sokchohang_3' } },
    { id: 'sokcho_sokchohang_1', name: '속초항 (북측)',
      links: { S: 'sokcho_sokchohang_2', E: 'sokcho_sokchohang_dongmyeonghang' } },
    { id: 'sokcho_sokchohang_dongmyeonghang', name: '속초항·동명항 연결로',
      links: { W: 'sokcho_sokchohang_1', E: 'sokcho_dongmyeonghang_1' } },
    { id: 'sokcho_dongmyeonghang_1', name: '동명항 (북측)',
      links: { W: 'sokcho_sokchohang_dongmyeonghang', S: 'sokcho_dongmyeonghang_2' } },
    { id: 'sokcho_dongmyeonghang_2', name: '동명항 (중앙)',
      links: { N: 'sokcho_dongmyeonghang_1', S: 'sokcho_dongmyeonghang_3' } },
    { id: 'sokcho_dongmyeonghang_3', name: '동명항 (남측·방파제)',
      links: { N: 'sokcho_dongmyeonghang_2' } },
  ],
};

/**
 * 부산 지역 맵 연결 그래프 (2026-07-17, 사용자 명세)
 *
 * 4개 출조 구역 — 그래프는 3개의 분리된 컴포넌트로 구성된다
 * (서방파제 / 동방파제+암남 / 백운포. 구역 간 직접 연결은 동방파제↔암남뿐):
 *
 *  감천항 서방파제 : 감천동(1) ↕ 방파제(2)                  — 1이 스폰 맵
 *  감천항 동방파제 : 제3부두(1) ↕ 수산시장(2) ↕ 동방파제(3)  — 1이 스폰 맵
 *                    제3부두(1) ↔E↔ 암남공원 주차장(1)
 *  암남공원 주차장 : 단일 맵 — 동방파제 1번과 W 연결          — 스폰 맵
 *  백운포 체육공원 : 공원(1) ↕ 방파제(2, 바다쪽 브릿지 아래)   — 1이 스폰 맵
 *
 * 각 구역의 스폰 맵은 WorldMap의 RegionAreaNode.fieldMapId로 지정된다.
 * entryMapId는 구역 미지정 진입 시의 폴백일 뿐이다.
 */
export const BUSAN_MAP_GRAPH: RegionMapGraph = {
  region: 'busan',
  entryMapId: 'busan_gamcheon_west_1',
  dataDir: 'data/busan',
  nodes: [
    // ── 감천항 서방파제 (마을 위 ↕ 방파제 아래) ──
    { id: 'busan_gamcheon_west_1', name: '감천항 서방파제 (감천동)',
      links: { S: 'busan_gamcheon_west_2' } },
    { id: 'busan_gamcheon_west_2', name: '감천항 서방파제',
      links: { N: 'busan_gamcheon_west_1' } },

    // ── 감천항 동방파제 (부두 위 ↕ 수산시장 ↕ 방파제 아래, 부두 동쪽 ↔ 암남) ──
    { id: 'busan_gamcheon_east_1', name: '감천항 제3부두·모지포',
      links: { S: 'busan_gamcheon_east_2', E: 'busan_amnam_1' } },
    { id: 'busan_gamcheon_east_2', name: '감천항 제4부두·수산시장',
      links: { N: 'busan_gamcheon_east_1', S: 'busan_gamcheon_east_3' } },
    { id: 'busan_gamcheon_east_3', name: '감천항 동방파제',
      links: { N: 'busan_gamcheon_east_2' } },

    // ── 암남공원 주차장 (서쪽으로 동방파제 부두와 연결) ──
    { id: 'busan_amnam_1', name: '암남공원 주차장',
      links: { W: 'busan_gamcheon_east_1' } },

    // ── 백운포 체육공원 (공원 위 ↕ 방파제 아래) ──
    { id: 'busan_baegunpo_1', name: '백운포 체육공원',
      links: { S: 'busan_baegunpo_2' } },
    { id: 'busan_baegunpo_2', name: '백운포 방파제',
      links: { N: 'busan_baegunpo_1' } },
  ],
};

/**
 * 홈타운(집) 맵 그래프 (HOMETOWN_HOME_SPEC 2026-07-28)
 * 단일 맵 — 엣지 연결 없음(4방 경계 이동 불가). 저장은 집 실내 침대에서만.
 * 오브젝트 초기 배치·스폰은 core/types/HomeBase.ts (HOMETOWN_OBJECTS/HOMETOWN_SPAWN).
 */
export const HOMETOWN_MAP_GRAPH: RegionMapGraph = {
  region: 'hometown',
  entryMapId: 'hometown_home',
  dataDir: 'data/hometown',
  nodes: [
    { id: 'hometown_home', name: '홈타운 (집)', links: {} },
  ],
};

/** 지역 ID → 맵 그래프 조회 */
export const REGION_MAP_GRAPHS: Record<string, RegionMapGraph> = {
  hometown: HOMETOWN_MAP_GRAPH,
  gangwon_sokcho: SOKCHO_MAP_GRAPH,
  busan: BUSAN_MAP_GRAPH,
};

/** 특정 맵 ID가 속한 그래프 노드 조회 */
export function getRegionMapNode(graph: RegionMapGraph, mapId: string): RegionMapNode | undefined {
  return graph.nodes.find((n) => n.id === mapId);
}
