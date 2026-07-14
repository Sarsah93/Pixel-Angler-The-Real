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
  },
];
