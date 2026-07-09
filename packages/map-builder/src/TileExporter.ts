/**
 * @file TileExporter.ts
 * @description 픽셀화된 맵의 타일별 속성 및 충돌 데이터 분석/내보내기 엔진
 * 
 * 맵 빌더에서 분석된 16px 타일 격자의 메타데이터를 저장 및 내보내기합니다.
 */

export type TileTerrainType = 
  | 'land'               // 일반 지상 (이동 가능)
  | 'water'              // 물/바다 (이동 불가, 낚시 가능)
  | 'breakwater_edge'    // 방파제 직벽 경계 (미끄러짐 위험, 채집 가능)
  | 'rocky_shore_edge'   // 갯바위 수면 경계 (미끄러짐 위험, 채집 가능)
  | 'obstacle'           // 장애물/벽 (이동 불가)
  | 'safe_zone';         // 안전지대/마을 (이동 가능)

export interface TileMeta {
  tileX: number;
  tileY: number;
  terrain: TileTerrainType;
  /** 충돌체 여부 (true인 경우 플레이어 이동 제한) */
  isCollision: boolean;
  /** 채집 대상 ID가 겹쳐있는지 여부 */
  gatherableId?: string;
  /** 상호작용 가능한 건물 포털이나 NPC ID */
  interactableId?: string;
}

export interface MapExportData {
  regionId: string;
  resolution: number;
  columns: number; // 타일 가로 개수
  rows: number;    // 타일 세로 개수
  tiles: TileMeta[];
}

export class TileExporter {
  /**
   * 맵 데이터 구조화 후 JSON 문자열로 직렬화
   */
  static serialize(data: MapExportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * 단순 색상 데이터(예: 픽셀 R,G,B 값)를 타일 속성으로 자동 분류하는 기본 분석 알고리즘
   * - R값 중심: 지상 (흙/바위)
   * - B값 중심: 바다/물
   * - G값 중심: 초지/갯벌
   */
  static autoClassifyTile(r: number, g: number, b: number): { terrain: TileTerrainType; isCollision: boolean } {
    // 임계값 및 고증 단순화 매핑
    if (b > 120 && r < 80 && g < 100) {
      return { terrain: 'water', isCollision: true }; // 깊은 바다
    }
    if (g > 110 && r < 90 && b < 90) {
      return { terrain: 'safe_zone', isCollision: false }; // 잔디/마을
    }
    if (r > 160 && g > 150 && b > 140) {
      return { terrain: 'obstacle', isCollision: true }; // 테트라포드/벽
    }
    if (r > 100 && g > 90 && b < 80 && Math.abs(r - g) < 20) {
      return { terrain: 'breakwater_edge', isCollision: false }; // 위험 경계선
    }
    return { terrain: 'land', isCollision: false }; // 일반 바닥
  }
}
