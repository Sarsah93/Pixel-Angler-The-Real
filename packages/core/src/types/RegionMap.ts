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
 */

/** 타일 지형 종류 */
export type RegionTerrain = 'land' | 'water' | 'building' | 'grass';

/** 지형 문자 → 지형 종류 매핑 */
export const TERRAIN_BY_CHAR: Record<string, RegionTerrain> = {
  '.': 'land',
  '~': 'water',
  '#': 'building',
  ',': 'grass',
};

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

/** 지역 ID → 맵 그래프 조회 */
export const REGION_MAP_GRAPHS: Record<string, RegionMapGraph> = {
  gangwon_sokcho: SOKCHO_MAP_GRAPH,
};

/** 특정 맵 ID가 속한 그래프 노드 조회 */
export function getRegionMapNode(graph: RegionMapGraph, mapId: string): RegionMapNode | undefined {
  return graph.nodes.find((n) => n.id === mapId);
}
