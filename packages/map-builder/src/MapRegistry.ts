/**
 * @file MapRegistry.ts
 * @description 게임 월드 맵 계층 구조 및 해상도 명세 데이터베이스
 * 
 * 계층 구조:
 * 대한민국 (전체 맵 - 512px)
 *   └─ 포항 (광역 지역 - 1024px)
 *        └─ 임곡항 / 영일만 북방파제 (상세 낚시터 - 2048px)
 *             └─ 방파제 테트라포드 끝단 (정밀 낚시 구역 - 4096px)
 */

export interface MapRegionNode {
  id: string;
  nameKo: string;
  /** 계층 레벨 ('nation' | 'subregion' | 'spot' | 'detail') */
  level: 'nation' | 'subregion' | 'spot' | 'detail';
  /** 맵 이미지 정규 규격 해상도 (512 | 1024 | 2048 | 4096) */
  resolution: 512 | 1024 | 2048 | 4096;
  /** VWorld 또는 KHOA 지도 서비스의 지리적 위경도 범위 (Bounding Box) */
  geoBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  /** 소속 상위 노드 ID (null인 경우 최상위인 대한민국) */
  parentId: string | null;
  /** 자식 노드 ID 목록 */
  childIds: string[];
  /** 에셋 파일 경로 정보 (packages/assets/maps/ 아래 위치) */
  assetPath: string;
  collisionPath: string;
}

export const MAP_HIERARCHY_REGISTRY: Record<string, MapRegionNode> = {
  // 1단계: 대한민국 전체 지도 (512px)
  'korea_nation': {
    id: 'korea_nation',
    nameKo: '대한민국',
    level: 'nation',
    resolution: 512,
    geoBounds: {
      minLat: 33.0,
      maxLat: 38.7,
      minLon: 124.5,
      maxLon: 131.0,
    },
    parentId: null,
    childIds: ['gyeongbuk_pohang'],
    assetPath: 'maps/korea_nation_512.png',
    collisionPath: 'collision/korea_nation_512.json',
  },
  // 2단계: 광역 지역 - 경북 포항 (1024px)
  'gyeongbuk_pohang': {
    id: 'gyeongbuk_pohang',
    nameKo: '경북 포항',
    level: 'subregion',
    resolution: 1024,
    geoBounds: {
      minLat: 35.95,
      maxLat: 36.15,
      minLon: 129.30,
      maxLon: 129.50,
    },
    parentId: 'korea_nation',
    childIds: ['pohang_yeongil_bay'],
    assetPath: 'maps/pohang_1024.png',
    collisionPath: 'collision/pohang_1024.json',
  },
  // 3단계: 상세 낚시터 - 포항 영일만 (2048px)
  'pohang_yeongil_bay': {
    id: 'pohang_yeongil_bay',
    nameKo: '포항 영일만 신항 수역',
    level: 'spot',
    resolution: 2048,
    geoBounds: {
      minLat: 36.01,
      maxLat: 36.05,
      minLon: 129.35,
      maxLon: 129.41,
    },
    parentId: 'gyeongbuk_pohang',
    childIds: ['pohang_north_breakwater_detail'],
    assetPath: 'maps/pohang_yeongil_bay_2048.png',
    collisionPath: 'collision/pohang_yeongil_bay_2048.json',
  },
  // 4단계: 정밀 낚시 구역 - 북방파제 끝자락 (4096px)
  'pohang_north_breakwater_detail': {
    id: 'pohang_north_breakwater_detail',
    nameKo: '영일만 북방파제 정밀 구역',
    level: 'detail',
    resolution: 4096,
    geoBounds: {
      minLat: 36.030,
      maxLat: 36.035,
      minLon: 129.368,
      maxLon: 129.373,
    },
    parentId: 'pohang_yeongil_bay',
    childIds: [],
    assetPath: 'maps/pohang_north_breakwater_detail_4096.png',
    collisionPath: 'collision/pohang_north_breakwater_detail_4096.json',
  },
};

/**
 * 특정 위경도 좌표가 어떤 노드에 속해있는지 검사하는 유틸리티
 */
export function findRegionNodeByCoords(lat: number, lon: number, level: MapRegionNode['level']): MapRegionNode | undefined {
  return Object.values(MAP_HIERARCHY_REGISTRY).find((node) => {
    if (node.level !== level) return false;
    const b = node.geoBounds;
    return lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon;
  });
}
