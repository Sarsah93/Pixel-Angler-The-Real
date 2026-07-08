/**
 * @file SpotFieldLayouts.ts
 * @description 영역 기반 픽셀 랜드필드(Local Pixel Landfield) 동적 생성 및 배치 엔진
 *
 * 월드맵에서 특정 관측소/낚시터를 클릭해 진입했을 때,
 * 해당 스팟의 타입(방파제, 갯벌, 갯바위 등)과 보유 시설(화장실, 마트, 식당 등)을 기반으로
 * 2D 픽셀 랜드필드 맵(2048x1536)의 구역(Zones)과 건물(Buildings)을 실시간으로 계산해 배치합니다.
 */

import { FishingSpotInfo } from '@tra/core';

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  alpha: number;
  action?: string;  // 씬 키 or 'fishing'
  hint?: string;
  licenseKey?: string;
  licenseName?: string;
}

export interface Building {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  doorColor: number;
  action?: string;  // 씬 키 또는 특수 액션 ('toilet', 'hanaro_mart', 'convenience' 등)
  hint?: string;
}

export interface SpotFieldLayout {
  worldWidth: number;
  worldHeight: number;
  zones: Zone[];
  buildings: Building[];
  playerSpawnX: number;
  playerSpawnY: number;
}

/**
 * 스팟 정보(FishingSpotInfo)를 바탕으로 로컬 픽셀 랜드필드 레이아웃을 생성합니다.
 */
export function generateSpotFieldLayout(spot: FishingSpotInfo): SpotFieldLayout {
  // 기본 랜드필드 크기
  const worldWidth = 2048;
  const worldHeight = 1536;

  const zones: Zone[] = [];
  const buildings: Building[] = [];

  // ─────────────────────────────────────────────────────────
  // 1. 구역 (Zones) 동적 생성 연산
  // ─────────────────────────────────────────────────────────

  // [공통] 깊은 바다 (상단 수역)
  zones.push({
    id: 'deep_sea',
    label: '심해 수역',
    x: 0,
    y: 0,
    w: worldWidth,
    h: 300,
    color: 0x0a1e3d,
    alpha: 1,
  });

  // 스팟 타입에 따른 맵 구성 분기
  if (spot.spotType === 'tidal_flat') {
    // ════ 갯벌형 랜드필드 ════
    // 갯벌은 물이 빠진 갯벌 영역이 대부분을 차지함
    zones.push({
      id: 'tidal_flat',
      label: '광활한 갯벌 구역',
      x: 500,
      y: 350,
      w: worldWidth - 500,
      h: worldHeight - 350,
      color: 0x2e3a1f,
      alpha: 1,
      action: 'NightHuntingScene',
      hint: '[H] 해루질 시작',
      licenseKey: 'shore_hunting_basic',
      licenseName: '해루질 입문 허가',
    });

    // 마을은 좌측에 길쭉하게 배치
    zones.push({
      id: 'town',
      label: '해안 마을',
      x: 0,
      y: 350,
      w: 500,
      h: worldHeight - 350,
      color: 0x1f2e1a,
      alpha: 1,
    });

    // 갯벌 낚시용 해변 포인트
    zones.push({
      id: 'fishing_beach',
      label: '갯벌 초입 흘림낚시',
      x: 500,
      y: 300,
      w: 400,
      h: 50,
      color: 0x1a4a6e,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 원투/흘림 캐스팅 시작',
    });

    // 통발 설치 수역 (좌측 하단 해안선 끝)
    zones.push({
      id: 'trap_zone',
      label: '갯골 통발 수역',
      x: 100,
      y: worldHeight - 300,
      w: 350,
      h: 250,
      color: 0x0f2940,
      alpha: 0.9,
      action: 'TrapScene',
      hint: '[T] 통발 조업 관리',
      licenseKey: 'trap_basic',
      licenseName: '통발 조업 기본 면허',
    });

  } else if (spot.spotType === 'rocky_shore') {
    // ════ 갯바위형 랜드필드 ════
    // 방파제 대신 울퉁불퉁한 암벽 길
    zones.push({
      id: 'rocky_walkway',
      label: '갯바위 진입 진흙길',
      x: 0,
      y: 300,
      w: worldWidth,
      h: 150,
      color: 0x3d352b,
      alpha: 1,
    });

    // 마을 구역 (하단)
    zones.push({
      id: 'town',
      label: '갯바위 낚시마을',
      x: 0,
      y: 450,
      w: worldWidth,
      h: worldHeight - 450,
      color: 0x1e2d1d,
      alpha: 1,
    });

    // 갯바위 낚시 포인트 (상단 암벽 끝단 여러 개 배치)
    zones.push({
      id: 'fishing_rocky_left',
      label: '갯바위 홈통 포인트',
      x: 100,
      y: 260,
      w: 250,
      h: 40,
      color: 0x0a3c5a,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 캐스팅 시작',
    });

    zones.push({
      id: 'fishing_rocky_right',
      label: '갯바위 곶부리 대물포인트',
      x: worldWidth - 600,
      y: 260,
      w: 300,
      h: 40,
      color: 0x0a3c5a,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 대물 릴찌낚시 캐스팅 시작',
    });

  } else {
    // ════ 기본형 방파제 (breakwater, pier, beach, open_sea 등 기본) ════
    // 기존 FieldScene 기본 레이아웃과 호환되도록 구성
    zones.push({
      id: 'fishing_outer',
      label: '방파제 외항 수중여',
      x: 100,
      y: 270,
      w: 300,
      h: 60,
      color: 0x0e3a6e,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 캐스팅 시작',
    });

    zones.push({
      id: 'fishing_mid',
      label: '방파제 조류 회전구간',
      x: 480,
      y: 270,
      w: 280,
      h: 60,
      color: 0x0e3a6e,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 캐스팅 시작',
    });

    zones.push({
      id: 'fishing_inner',
      label: '방파제 내항 끝자리',
      x: 850,
      y: 270,
      w: 280,
      h: 60,
      color: 0x0e3a6e,
      alpha: 0.9,
      action: 'fishing',
      hint: '[SPACE] 캐스팅 시작',
    });

    zones.push({
      id: 'trap_zone',
      label: '내항 통발 조업지',
      x: 1200,
      y: 200,
      w: 350,
      h: 130,
      color: 0x0d2940,
      alpha: 0.9,
      action: 'TrapScene',
      hint: '[T] 통발 관리',
      licenseKey: 'trap_basic',
      licenseName: '통발 조업 기본 면허',
    });

    zones.push({
      id: 'breakwater',
      label: '콘크리트 방파제',
      x: 0,
      y: 330,
      w: worldWidth,
      h: 80,
      color: 0x2c3a4a,
      alpha: 1,
    });

    zones.push({
      id: 'town',
      label: '방파제 해안마을',
      x: 0,
      y: 410,
      w: worldWidth,
      h: worldHeight - 410,
      color: 0x1a2a1a,
      alpha: 1,
    });

    // 갯벌 구역 (우측 하단 일부 유지)
    zones.push({
      id: 'tidal_flat',
      label: '방파제 옆 갯벌 밭',
      x: 1400,
      y: 700,
      w: 600,
      h: worldHeight - 700,
      color: 0x2a3a1e,
      alpha: 1,
      action: 'NightHuntingScene',
      hint: '[H] 해루질 시작',
      licenseKey: 'shore_hunting_basic',
      licenseName: '해루질 입문 허가',
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2. 건물 (Buildings) 동적 배치 연산
  // ─────────────────────────────────────────────────────────
  const townZone = zones.find((z) => z.id === 'town') || { x: 0, y: 410 };
  const startY = townZone.y + 40;

  let currentX = townZone.x + 80;
  const colSpacing = 175;
  const buildingW = 120;
  const buildingH = 90;

  // [필수 1] 민박집 (세이브 및 휴식 거점)
  buildings.push({
    id: 'condo',
    label: '항구 민박집',
    sublabel: '휴식 / 세이브',
    x: currentX,
    y: startY,
    w: buildingW,
    h: buildingH - 5,
    color: 0x4a2a2a,
    doorColor: 0x8a4a4a,
    action: 'CondoScene',
    hint: '[E] 숙박 / 세이브하기',
  });
  currentX += colSpacing;

  // [필수 2] 낚시면허 사무소
  buildings.push({
    id: 'license_office',
    label: '낚시면허 사무소',
    sublabel: '면허 발급/갱신',
    x: currentX,
    y: startY,
    w: buildingW + 20,
    h: buildingH,
    color: 0x3a2a0a,
    doorColor: 0x8a6a1a,
    action: 'license_office',
    hint: '[E] 낚시 면허 발급',
  });
  currentX += colSpacing + 20;

  // [조건부 3] 낚시점
  if (spot.hasNearbyTackleShop || spot.facilities.includes('bait_shop')) {
    buildings.push({
      id: 'tackle_shop',
      label: '바다대박 낚시점',
      sublabel: '장비 / 미끼',
      x: currentX,
      y: startY,
      w: buildingW,
      h: buildingH,
      color: 0x1a4a20,
      doorColor: 0x4a8a50,
      action: 'TackleRoomScene',
      hint: '[E] 장비/미끼 구매',
    });
    currentX += colSpacing;
  }

  // [조건부 4] 하나로마트 또는 편의점 배치
  if (spot.facilities.includes('hanaro_mart')) {
    buildings.push({
      id: 'hanaro_mart',
      label: '농협 하나로마트',
      sublabel: '식료품 / 소모품',
      x: currentX,
      y: startY,
      w: buildingW + 15,
      h: buildingH,
      color: 0x1565c0,
      doorColor: 0xffb74d,
      action: 'hanaro_mart',
      hint: '[E] 하나로마트 이용하기',
    });
    currentX += colSpacing + 15;
  } else if (spot.hasNearbyConvenienceStore || spot.facilities.includes('convenience_store')) {
    buildings.push({
      id: 'convenience',
      label: 'GS25 마트',
      sublabel: '소모품 및 간식',
      x: currentX,
      y: startY,
      w: buildingW - 10,
      h: buildingH,
      color: 0x8a3010,
      doorColor: 0xcc5522,
      action: 'convenience',
      hint: '[E] 마트 소모품 구매',
    });
    currentX += colSpacing;
  }

  // [조건부 5] 식당 / 캐치앤쿡
  if (spot.facilities.includes('restaurant') || spot.facilities.includes('sashimi_restaurant')) {
    buildings.push({
      id: 'restaurant',
      label: '전망대 횟집식당',
      sublabel: '캐치앤쿡 운영',
      x: currentX,
      y: startY + 10,
      w: buildingW + 10,
      h: buildingH,
      color: 0x1a3a5a,
      doorColor: 0x3a6a9a,
      action: 'CookScene',
      hint: '[E] 요리 및 식당 관리',
    });
    currentX += colSpacing + 10;
  }

  // [조건부 6] 화장실 (Restroom)
  if (spot.facilities.includes('restroom') || spot.facilities.includes('toilet')) {
    buildings.push({
      id: 'toilet',
      label: '공중화장실',
      sublabel: '세면 및 피로 정돈',
      x: currentX,
      y: startY,
      w: buildingW - 30,
      h: buildingH - 10,
      color: 0x5d6063,
      doorColor: 0x828a93,
      action: 'toilet',
      hint: '[E] 화장실 사용하기 (피로도 감소)',
    });
    currentX += colSpacing - 30;
  }

  // [필수 3] 어판장
  buildings.push({
    id: 'fish_market',
    label: '수산 어판장',
    sublabel: '어획물 즉시 처분',
    x: currentX,
    y: startY,
    w: buildingW,
    h: buildingH,
    color: 0x0a3a3a,
    doorColor: 0x1a7a7a,
    action: 'fish_market',
    hint: '[E] 수산물 즉시 위판',
  });

  const playerSpawnX = worldWidth / 2;
  const playerSpawnY = startY + buildingH + 80;

  return {
    worldWidth,
    worldHeight,
    zones,
    buildings,
    playerSpawnX,
    playerSpawnY,
  };
}
