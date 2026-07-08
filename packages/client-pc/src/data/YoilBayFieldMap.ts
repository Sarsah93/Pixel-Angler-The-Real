/**
 * @file YoilBayFieldMap.ts
 * @description 포항 영일만(迎日灣) 2D 픽셀 랜드필드 지형 정의
 *
 * 실제 포항 영일만 지형을 2048x1536 픽셀 공간에 격자(grid) 기반으로 추상화.
 * - 1타일 = 16px = 실제 약 1m(캐릭터 이동 스케일)
 * - 격자 크기: 128x96 (= 2048/16 x 1536/16)
 *
 * 지형 레이어:
 *  L0 DEEP_SEA   - 심해 (수심 15m~32m), 본류대, 조경지대
 *  L1 SHALLOW    - 얕은 수역 (수심 1m~15m), 방파제 60칸 이내
 *  L2 BREAKWATER - 방파제/테트라포드 구조물 (이동 불가)
 *  L3 TIDAL_FLAT - 조간대/갯벌 (해루질 가능, 썰물 시 도보 진입)
 *  L4 LAND       - 육지/마을 (이동 가능)
 *  L5 BUILDING   - 건물 (이동 불가, E키 상호작용)
 *
 * 조류 특성:
 *  - 본류: 방파제로부터 20칸(20m) 이상 거리 타일에 적용
 *  - 반탄류(COUNTER): 홈통/내만 오목 지형에 형성되는 역방향 잔류
 *  - 와류(EDDY): 방파제 끝단(곶부리) 및 테트라포드 후미에 형성
 *  - 조경지대(CONVERGENCE): 본류와 반탄류가 교차하는 경계 구간
 *
 * 낚시 포인트 특성:
 *  - 수심에 따른 채비 선택 (수심 3m 이하: 흘림, 3~8m: 중층, 8m+: 심층/원투)
 *  - 바닥 지형(reef/gravel/sand/mud)에 따른 어종 구성 변화
 *  - 조류 타입(EDDY/COUNTER/CONVERGENCE)에 따른 입질 보너스
 */

import type { Zone, Building } from './SpotFieldLayouts.js';

// ─────────────────────────────────────────────────────────────────────────────
// 타일 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

/** 지형 타일 종류 */
export type TileType =
  | 'DEEP_SEA'    // 심해 수역 (본류대)
  | 'SHALLOW'     // 얕은 수역 (방파제 20칸 이내)
  | 'TIDAL_FLAT'  // 조간대/갯벌
  | 'BREAKWATER'  // 방파제/테트라포드 구조물
  | 'LAND'        // 육지/마을 구역
  | 'BUILDING';   // 건물 (상호작용 가능)

/** 조류 타입 (HydroDynamics.ts의 WaterType과 동기화) */
export type CurrentType = 'MAIN' | 'COUNTER' | 'EDDY' | 'CONVERGENCE' | 'NONE';

/** 바닥 지형 */
export type BottomType = 'reef' | 'gravel' | 'sand' | 'mud' | 'concrete' | 'none';

/** 낚시 포인트 접근 방식 */
export type FishingMethod =
  | 'float_drift'    // 흘림낚시 (수심 얕음, 조류 약함)
  | 'float_fixed'    // 반유동/고정찌 (중층, 조류 보통)
  | 'bottom_cast'    // 원투낚시 (원거리 착점)
  | 'jigging'        // 루어/지깅 (수심 깊음)
  | 'trap_zone'      // 통발 투하 수역
  | 'none';          // 비낚시 구역

// ─────────────────────────────────────────────────────────────────────────────
// 영일만 맵 타일 정보
// ─────────────────────────────────────────────────────────────────────────────

export interface YoilBayTile {
  /** 픽셀 X 좌표 (타일 왼쪽 상단 기준) */
  px: number;
  /** 픽셀 Y 좌표 (타일 왼쪽 상단 기준) */
  py: number;
  /** 타일 종류 */
  type: TileType;
  /** 수심 (m, 0 = 육지/건물) */
  depthM: number;
  /** 조류 타입 */
  current: CurrentType;
  /** 바닥 지형 */
  bottom: BottomType;
  /** 추천 낚시 방법 */
  fishingMethod: FishingMethod;
  /** 낚시 포인트 이름 (있을 경우) */
  pointName?: string;
  /** 상호작용 씬 키 (건물/특수 구역의 경우) */
  sceneKey?: string;
  /** 단축키 힌트 텍스트 */
  hintText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 포항 영일만 — 주요 지형 랜드마크 (픽셀 좌표)
// ─────────────────────────────────────────────────────────────────────────────

/** 타일 크기 (px) */
export const TILE_PX = 16;

/** 월드 크기 (px) */
export const WORLD_W = 2048;
export const WORLD_H = 1536;

/** 격자 크기 (타일 수) */
export const GRID_W = WORLD_W / TILE_PX; // 128
export const GRID_H = WORLD_H / TILE_PX; // 96

/**
 * 포항 영일만 맵 주요 랜드마크 좌표 (픽셀)
 *
 * 실제 영일만 지형:
 *  - 북동쪽: 외해(동해) 개방 수역
 *  - 서쪽: 포항 시내/구항
 *  - 남쪽: 포항 신항/영일만항 방파제
 *  - 중앙: 영일만 반폐쇄형 만
 */
export const YOIL_BAY_LANDMARKS = {
  // 외항/본류대 경계 (Y 기준 - 위쪽이 외해)
  OPEN_SEA_BOUNDARY_Y: 200,       // Y < 200: 완전 외해 (심해)

  // 북방파제 (포항 구항 방파제)
  NORTH_BREAKWATER_START_X: 120,
  NORTH_BREAKWATER_END_X: 680,
  NORTH_BREAKWATER_Y: 310,
  NORTH_BREAKWATER_THICKNESS: 32, // 픽셀 (= 2타일)

  // 남방파제 (포항 신항 방파제)
  SOUTH_BREAKWATER_START_X: 900,
  SOUTH_BREAKWATER_END_X: 1680,
  SOUTH_BREAKWATER_Y: 370,
  SOUTH_BREAKWATER_THICKNESS: 48, // 픽셀 (= 3타일)

  // 방파제 끝단 (곶부리 - 와류 발생 지점)
  NORTH_TIP_X: 680,
  NORTH_TIP_Y: 310,
  SOUTH_TIP_X: 900,
  SOUTH_TIP_Y: 370,

  // 홈통 (두 방파제 사이의 입항 수로)
  CHANNEL_START_X: 680,
  CHANNEL_END_X: 900,
  CHANNEL_CENTER_Y: 340,
  CHANNEL_WIDTH: 220,

  // 내만 (방파제 안쪽 조용한 수역)
  INNER_BAY_X: 100,
  INNER_BAY_Y: 410,
  INNER_BAY_W: 1600,
  INNER_BAY_H: 350,

  // 조간대/갯벌 구역 (남쪽 내만 끝단)
  TIDAL_FLAT_X: 1400,
  TIDAL_FLAT_Y: 600,
  TIDAL_FLAT_W: 550,
  TIDAL_FLAT_H: 400,

  // 마을 구역
  TOWN_X: 0,
  TOWN_Y: 760,
  TOWN_W: 1400,
  TOWN_H: 776,

  // 20m 이격 경계 (조류 적용 임계값)
  // 방파제 Y로부터 320px(20타일) 이상 위쪽
  CURRENT_THRESHOLD_Y: 310 - 320, // 실질적으로 Y < 310 전체가 본류 적용
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 영일만 낚시 포인트 목록
// ─────────────────────────────────────────────────────────────────────────────

export interface YoilBayFishingPoint {
  id: string;
  nameKo: string;
  /** 중심 픽셀 좌표 */
  cx: number;
  cy: number;
  /** 접근 반경 (px) */
  radius: number;
  /** 평균 수심 (m) */
  avgDepthM: number;
  /** 추천 채비 */
  recommendedMethod: FishingMethod;
  /** 조류 타입 */
  currentType: CurrentType;
  /** 바닥 지형 */
  bottom: BottomType;
  /** 특징 설명 */
  description: string;
  /** 주요 타겟 어종 ID 목록 */
  targetSpecies: string[];
  /** 최적 물때 범위 (1~15) */
  optimalTidePhase: [number, number];
  /** 씬 전환 키 */
  sceneKey: 'FishingScene';
}

/**
 * 포항 영일만 주요 낚시 포인트 데이터베이스
 *
 * 좌표계: 2D 픽셀 (0,0) = 맵 왼쪽 상단
 * Y 증가 방향 = 아래쪽 (내만 방향)
 * X 증가 방향 = 오른쪽
 */
export const YOIL_BAY_FISHING_POINTS: YoilBayFishingPoint[] = [
  // ─── 북방파제 포인트 ──────────────────────────────────
  {
    id: 'yoil_north_tip',
    nameKo: '북방파제 끝단 (곶부리)',
    cx: 680,
    cy: 300,
    radius: 64,
    avgDepthM: 12,
    recommendedMethod: 'float_fixed',
    currentType: 'EDDY',
    bottom: 'reef',
    description: '북방파제 끝단. 테트라포드 후미에 강한 와류 형성. 감성돔·농어 대물 포인트.',
    targetSpecies: ['black_seabream', 'sea_bass', 'mullet'],
    optimalTidePhase: [5, 9],
    sceneKey: 'FishingScene',
  },
  {
    id: 'yoil_north_middle',
    nameKo: '북방파제 중단부',
    cx: 400,
    cy: 300,
    radius: 48,
    avgDepthM: 7,
    recommendedMethod: 'float_drift',
    currentType: 'MAIN',
    bottom: 'gravel',
    description: '북방파제 중간. 흘림낚시로 사계절 감성돔·숭어를 노리는 무난한 포인트.',
    targetSpecies: ['black_seabream', 'mullet'],
    optimalTidePhase: [4, 8],
    sceneKey: 'FishingScene',
  },

  // ─── 홈통/수로 포인트 ─────────────────────────────────
  {
    id: 'yoil_channel',
    nameKo: '홈통 수로',
    cx: 790,
    cy: 340,
    radius: 72,
    avgDepthM: 18,
    recommendedMethod: 'jigging',
    currentType: 'CONVERGENCE',
    bottom: 'sand',
    description:
      '북·남방파제 사이 입항 수로. 조경지대 형성으로 소형 어류 집결. 조류가 가장 빠른 구간.',
    targetSpecies: ['sea_bass', 'cod', 'hairtail'],
    optimalTidePhase: [6, 10],
    sceneKey: 'FishingScene',
  },

  // ─── 남방파제 포인트 ──────────────────────────────────
  {
    id: 'yoil_south_tip',
    nameKo: '남방파제 끝단 (신항 방파제 곶부리)',
    cx: 1680,
    cy: 360,
    radius: 80,
    avgDepthM: 15,
    recommendedMethod: 'float_fixed',
    currentType: 'EDDY',
    bottom: 'reef',
    description: '신항 남방파제 끝단. 야간 갈치 원투 포인트. 들물 때 감성돔·참돔 집결.',
    targetSpecies: ['hairtail', 'black_seabream', 'red_seabream'],
    optimalTidePhase: [6, 11],
    sceneKey: 'FishingScene',
  },
  {
    id: 'yoil_south_inner',
    nameKo: '남방파제 내항 반탄류 구간',
    cx: 1200,
    cy: 420,
    radius: 60,
    avgDepthM: 5,
    recommendedMethod: 'float_drift',
    currentType: 'COUNTER',
    bottom: 'gravel',
    description:
      '남방파제 안쪽. 본류가 방파제에 부딪혀 되돌아오는 반탄류 형성. 원유동 흘림 유리.',
    targetSpecies: ['black_seabream', 'rockfish', 'mullet'],
    optimalTidePhase: [3, 7],
    sceneKey: 'FishingScene',
  },

  // ─── 내만 포인트 ──────────────────────────────────────
  {
    id: 'yoil_inner_bay_west',
    nameKo: '내만 서쪽 (구항 앞)',
    cx: 300,
    cy: 580,
    radius: 56,
    avgDepthM: 4,
    recommendedMethod: 'bottom_cast',
    currentType: 'NONE',
    bottom: 'mud',
    description:
      '내만 서쪽. 조류가 거의 없는 진흙 바닥. 낮에 망둥이·숭어 원투 포인트. 원투 거리 50~80m.',
    targetSpecies: ['goby', 'mullet', 'flounder'],
    optimalTidePhase: [2, 6],
    sceneKey: 'FishingScene',
  },

  // ─── 조간대/갯벌 통발 구역 ────────────────────────────
  {
    id: 'yoil_tidal_trap',
    nameKo: '갯벌 통발 수역',
    cx: 1650,
    cy: 720,
    radius: 96,
    avgDepthM: 2,
    recommendedMethod: 'trap_zone',
    currentType: 'NONE',
    bottom: 'mud',
    description: '영일만 남동쪽 조간대. 썰물 시 도보 진입. 통발 투하 적지. 꽃게·갑각류 포획.',
    targetSpecies: ['blue_crab', 'shore_crab'],
    optimalTidePhase: [8, 13],
    sceneKey: 'FishingScene',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 영일만 지형 구역 (Zone) 정의 — SpotFieldLayouts.Zone 형식 호환
// ─────────────────────────────────────────────────────────────────────────────

/** 포항 영일만 전용 구역 목록 */
export const YOIL_BAY_ZONES: Zone[] = [
  // ── 외해 심해 (최상단) ──────────────────────────
  {
    id: 'open_sea',
    label: '동해 외해 (본류대)',
    x: 0,
    y: 0,
    w: WORLD_W,
    h: 200,
    color: 0x04111f,
    alpha: 1,
  },

  // ── 북방파제 앞 수역 (외항, 조경지대 포함) ─────
  {
    id: 'outer_north',
    label: '북방파제 외항 (조경지대)',
    x: 0,
    y: 200,
    w: 680,
    h: 110,
    color: 0x072844,
    alpha: 1,
    action: 'fishing',
    hint: '[SPACE] 감성돔·농어 캐스팅',
  },

  // ── 홈통/수로 ────────────────────────────────────
  {
    id: 'channel',
    label: '홈통 입항 수로',
    x: 680,
    y: 200,
    w: 220,
    h: 170,
    color: 0x042030,
    alpha: 1,
    action: 'fishing',
    hint: '[SPACE] 농어·갈치 지깅 캐스팅',
  },

  // ── 남방파제 앞 수역 ─────────────────────────────
  {
    id: 'outer_south',
    label: '남방파제 외항',
    x: 900,
    y: 200,
    w: 820,
    h: 170,
    color: 0x072844,
    alpha: 1,
    action: 'fishing',
    hint: '[SPACE] 참돔·갈치 캐스팅',
  },

  // ── 북방파제 구조물 ──────────────────────────────
  {
    id: 'north_breakwater',
    label: '북방파제 (콘크리트+테트라포드)',
    x: 120,
    y: 310,
    w: 560,
    h: 32,
    color: 0x3a3f44,
    alpha: 1,
  },

  // ── 남방파제 구조물 ──────────────────────────────
  {
    id: 'south_breakwater',
    label: '포항 신항 남방파제',
    x: 900,
    y: 342,
    w: 780,
    h: 48,
    color: 0x4a4f54,
    alpha: 1,
  },

  // ── 내만 수역 (반탄류·와류 구역 포함) ───────────
  {
    id: 'inner_bay',
    label: '영일만 내만 수역',
    x: 0,
    y: 342,
    w: WORLD_W - 100,
    h: 250,
    color: 0x0d2a40,
    alpha: 1,
    action: 'fishing',
    hint: '[SPACE] 내항 낚시 캐스팅',
  },

  // ── 조간대/갯벌 ──────────────────────────────────
  {
    id: 'tidal_flat',
    label: '영일만 남동 조간대',
    x: YOIL_BAY_LANDMARKS.TIDAL_FLAT_X,
    y: YOIL_BAY_LANDMARKS.TIDAL_FLAT_Y,
    w: YOIL_BAY_LANDMARKS.TIDAL_FLAT_W,
    h: YOIL_BAY_LANDMARKS.TIDAL_FLAT_H,
    color: 0x2e4020,
    alpha: 1,
    action: 'NightHuntingScene',
    hint: '[H] 해루질 / [T] 통발 투하',
    licenseKey: 'shore_hunting_basic',
    licenseName: '해루질 입문 허가',
  },

  // ── 마을/육지 ────────────────────────────────────
  {
    id: 'town',
    label: '포항 구항 마을',
    x: YOIL_BAY_LANDMARKS.TOWN_X,
    y: YOIL_BAY_LANDMARKS.TOWN_Y,
    w: YOIL_BAY_LANDMARKS.TOWN_W,
    h: YOIL_BAY_LANDMARKS.TOWN_H,
    color: 0x1a2214,
    alpha: 1,
  },
];

/** 포항 영일만 전용 건물 배치 목록 */
export const YOIL_BAY_BUILDINGS: Building[] = [
  // 민박집 (세이브 거점)
  {
    id: 'condo',
    label: '영일만 민박',
    sublabel: '휴식 / 세이브',
    x: 80,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 120,
    h: 90,
    color: 0x4a2a2a,
    doorColor: 0x8a4a4a,
    action: 'CondoScene',
    hint: '[E] 민박 숙박 / 세이브',
  },
  // 낚시면허 사무소
  {
    id: 'license_office',
    label: '낚시면허 사무소',
    sublabel: '면허 발급',
    x: 260,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 140,
    h: 90,
    color: 0x3a2a0a,
    doorColor: 0x8a6a1a,
    action: 'license_office',
    hint: '[E] 면허 발급/갱신',
  },
  // 바다대박 낚시점
  {
    id: 'tackle_shop',
    label: '바다대박 낚시점',
    sublabel: '장비 / 미끼',
    x: 460,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 120,
    h: 90,
    color: 0x1a4a20,
    doorColor: 0x4a8a50,
    action: 'TackleRoomScene',
    hint: '[E] 장비/미끼 구매',
  },
  // 농협 하나로마트
  {
    id: 'hanaro_mart',
    label: '농협 하나로마트',
    sublabel: '식료품 / 소모품',
    x: 640,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 135,
    h: 90,
    color: 0x1565c0,
    doorColor: 0xffb74d,
    action: 'hanaro_mart',
    hint: '[E] 하나로마트 이용',
  },
  // 전망대 횟집
  {
    id: 'restaurant',
    label: '영일대 횟집',
    sublabel: '캐치앤쿡',
    x: 840,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 130,
    h: 90,
    color: 0x1a3a5a,
    doorColor: 0x3a6a9a,
    action: 'CookScene',
    hint: '[E] 캐치앤쿡 / 식당 운영',
  },
  // 수산 어판장
  {
    id: 'fish_market',
    label: '포항 수산 어판장',
    sublabel: '어획물 위판',
    x: 1040,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 40,
    w: 130,
    h: 90,
    color: 0x0a3a3a,
    doorColor: 0x1a7a7a,
    action: 'fish_market',
    hint: '[E] 수산물 즉시 위판',
  },
  // 공중화장실
  {
    id: 'toilet',
    label: '공중화장실',
    sublabel: '세면 / 피로 정돈',
    x: 1240,
    y: YOIL_BAY_LANDMARKS.TOWN_Y + 50,
    w: 90,
    h: 75,
    color: 0x5d6063,
    doorColor: 0x828a93,
    action: 'toilet',
    hint: '[E] 화장실 이용 (피로 감소)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 픽셀 좌표를 격자 좌표로 변환
 */
export function pixelToGrid(px: number, py: number): { gx: number; gy: number } {
  return {
    gx: Math.floor(px / TILE_PX),
    gy: Math.floor(py / TILE_PX),
  };
}

/**
 * 격자 좌표를 픽셀 좌표(타일 중심)로 변환
 */
export function gridToPixelCenter(gx: number, gy: number): { px: number; py: number } {
  return {
    px: gx * TILE_PX + TILE_PX / 2,
    py: gy * TILE_PX + TILE_PX / 2,
  };
}

/**
 * 주어진 픽셀 좌표에서 가장 가까운 낚시 포인트를 반환합니다.
 * 반경 내에 포인트가 없으면 null 반환.
 */
export function getNearestFishingPoint(
  worldX: number,
  worldY: number,
  maxRadius = 96
): YoilBayFishingPoint | null {
  let best: YoilBayFishingPoint | null = null;
  let bestDist = Infinity;

  for (const pt of YOIL_BAY_FISHING_POINTS) {
    const dx = worldX - pt.cx;
    const dy = worldY - pt.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= maxRadius && dist < bestDist) {
      bestDist = dist;
      best = pt;
    }
  }

  return best;
}

/**
 * 방파제로부터의 픽셀 거리를 계산해 본류 적용 여부를 반환합니다.
 * 20타일(320px) 이상 거리인 경우 본류 적용.
 */
export function isMainCurrentZone(worldY: number): boolean {
  const northBreakwaterY = YOIL_BAY_LANDMARKS.NORTH_BREAKWATER_Y;
  return worldY < northBreakwaterY - 320; // 20타일 = 320px 이격
}
