/**
 * @file HomeBase.ts
 * @description 홈타운(집) 거점 스키마 — 오브젝트 인스턴스/영속·칸 단위 배치·수족관·하우스 확장·교통비
 *
 * HOMETOWN_HOME_SPEC (2026-07-28, rev4):
 *  - 모든 맵 오브젝트(나무/바위/가구/수족관/울타리)는 정적 베이크가 아니라 **인스턴스**
 *    (instanceId) — 맵의 초기 배치 목록 − removed + moved + placed(플레이어 설치)가
 *    유효 상태이며, 변경분은 WorldObjectState로 세이브에 영속된다.
 *  - 설치형 아이템(텃밭/울타리/수족관/가구)은 지정 자리가 없다 — PlacementRule의
 *    footprint·허용 지형·scope로 canPlaceAt이 칸 단위 판정(프리뷰 초록/빨강)한다.
 *  - 수족관 2종(활어 업소용/관상용)은 스펙+저장 골격만 이번 단계 (시뮬은 후속).
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { RegionTerrain } from './RegionMap.js';

// ─────────────────────────────────────────────
// 맵 오브젝트 (인스턴스)
// ─────────────────────────────────────────────

/** 오브젝트 종류 */
export type MapObjectType =
  | 'tree' | 'rock' | 'stump' | 'well' | 'tidalRock' | 'farmPlot' | 'pier'
  | 'fence' | 'furniture' | 'aquarium_live' | 'aquarium_display'
  | 'door' | 'busStop';

/** 상호작용 종류 (구현 전 예약 포함 — chop=벌목, mine=채굴, gather=해루질/채집, till=개간) */
export type MapObjectInteract =
  | 'none' | 'chop' | 'mine' | 'gather' | 'till' | 'board'
  | 'save' | 'storage' | 'aquarium' | 'door' | 'bus' | 'cook';

/** 맵 오브젝트 인스턴스 — 초기 배치/플레이어 설치 공통 */
export interface MapObject {
  /** 개체 고유 id — 이동/제거/영속의 키 */
  instanceId: string;
  type: MapObjectType;
  /** 타일 좌표 (footprint 좌상단) */
  tx: number;
  ty: number;
  /** footprint 칸 수 (기본 1×1) */
  fw?: number;
  fh?: number;
  /** 이동 불가(충돌) 여부 */
  collides: boolean;
  interact?: MapObjectInteract;
  /** 배치 모드에서 이동 가능 (가구·설치형 true / 지형물 false) */
  movable: boolean;
  /** 제거 가능 (나무=벌목, 바위=채굴, 설치물=회수) */
  removable: boolean;
  placedByPlayer?: boolean;
  /** 회수 시 돌려줄 인벤토리 아이템 id (플레이어 설치물) */
  itemId?: string;
  /** 수족관 스펙 id (type aquarium_* 전용) */
  specId?: string;
}

/** 맵별 오브젝트 월드 상태 — 세이브 영속 (초기 배치 − removed + moved + placed) */
export interface WorldObjectState {
  /** 벌목/채굴/회수로 사라진 초기 오브젝트 */
  removedIds: string[];
  /** 초기 오브젝트 위치 변경분 */
  moved: { instanceId: string; tx: number; ty: number }[];
  /** 플레이어가 설치한 오브젝트 */
  placed: MapObject[];
}

export function createEmptyWorldObjectState(): WorldObjectState {
  return { removedIds: [], moved: [], placed: [] };
}

/** 초기 배치 + 월드 상태 → 유효 오브젝트 목록 */
export function effectiveObjects(initial: MapObject[], state: WorldObjectState | undefined): MapObject[] {
  if (!state) return initial.slice();
  const removed = new Set(state.removedIds);
  const movedMap = new Map(state.moved.map((m) => [m.instanceId, m]));
  const out: MapObject[] = [];
  for (const o of initial) {
    if (removed.has(o.instanceId)) continue;
    const mv = movedMap.get(o.instanceId);
    out.push(mv ? { ...o, tx: mv.tx, ty: mv.ty } : o);
  }
  return out.concat(state.placed);
}

// ─────────────────────────────────────────────
// 칸 단위 자유 배치 (PlacementRule / canPlaceAt)
// ─────────────────────────────────────────────

/** 배치 허용 지형 — RegionTerrain + 실내 바닥('floor') */
export type PlaceTerrain = RegionTerrain | 'floor';

export interface PlacementRule {
  /** 차지 칸 (텃밭 4×3, 활어수조 3×2, 울타리 1×1 …) */
  footprint: { w: number; h: number };
  /** 허용 지형 (~바다/#건물은 자동 배제) */
  allowedTerrain: PlaceTerrain[];
  scope: ('interior' | 'exterior')[];
  /** 필요 도구 (텃밭=괭이 등 — 선택, 후속) */
  requiresTool?: string;
}

/** canPlaceAt이 소비하는 월드 뷰 (씬이 클로저로 전달) */
export interface PlaceWorld {
  cols: number;
  rows: number;
  /** 타일 지형 조회 (범위 밖 null). 실내 씬은 'floor' 반환 */
  terrainAt: (c: number, r: number) => PlaceTerrain | null;
  /** 유효 오브젝트 목록 (초기 − removed + moved + placed) — 겹침 금지 판정 대상 */
  objects: MapObject[];
  scope: 'interior' | 'exterior';
}

export interface PlacementCheck {
  ok: boolean;
  /** footprint 각 칸의 판정 (프리뷰 초록/빨강 렌더용) */
  cells: { c: number; r: number; ok: boolean }[];
}

/** 오브젝트 footprint가 (c,r) 칸을 덮는지 */
function objectCovers(o: MapObject, c: number, r: number): boolean {
  const fw = o.fw ?? 1, fh = o.fh ?? 1;
  return c >= o.tx && c < o.tx + fw && r >= o.ty && r < o.ty + fh;
}

/**
 * 칸 단위 배치 판정 — footprint 전 칸에 대해
 *  ① 지형이 allowedTerrain 포함 ② 오브젝트 겹침 없음 ③ scope 일치.
 * 설치물의 collides는 이후 판정에 다시 영향(연쇄) — objects에 placed가 포함되므로 자동.
 */
export function canPlaceAt(tx: number, ty: number, rule: PlacementRule, world: PlaceWorld): PlacementCheck {
  if (!rule.scope.includes(world.scope)) {
    return { ok: false, cells: [] };
  }
  const cells: { c: number; r: number; ok: boolean }[] = [];
  let ok = true;
  for (let dr = 0; dr < rule.footprint.h; dr++) {
    for (let dc = 0; dc < rule.footprint.w; dc++) {
      const c = tx + dc, r = ty + dr;
      let cellOk = c >= 0 && c < world.cols && r >= 0 && r < world.rows;
      if (cellOk) {
        const t = world.terrainAt(c, r);
        cellOk = t !== null && rule.allowedTerrain.includes(t);
      }
      if (cellOk && world.objects.some((o) => objectCovers(o, c, r))) cellOk = false;
      if (!cellOk) ok = false;
      cells.push({ c, r, ok: cellOk });
    }
  }
  return { ok, cells };
}

/**
 * 설치형 정의 — 인벤토리 아이템(InvItem.placeKey)이 참조.
 * 목업의 텃밭/수족관 위치 표시는 전부 "예시 위치" — 실제로는 어디든 이 규칙으로 설치.
 */
export interface PlacementDef {
  key: string;
  label: string;
  objectType: MapObjectType;
  rule: PlacementRule;
  collides: boolean;
  interact?: MapObjectInteract;
}

export const PLACEMENT_DEFS: Record<string, PlacementDef> = {
  farm_plot: {
    key: 'farm_plot', label: '텃밭 (개간)', objectType: 'farmPlot',
    rule: { footprint: { w: 4, h: 3 }, allowedTerrain: ['grass'], scope: ['exterior'] },
    collides: false, interact: 'till',
  },
  fence: {
    key: 'fence', label: '울타리', objectType: 'fence',
    rule: { footprint: { w: 1, h: 1 }, allowedTerrain: ['grass', 'land'], scope: ['exterior'] },
    collides: true,
  },
  aquarium_live: {
    key: 'aquarium_live', label: '활어 수조 (업소용)', objectType: 'aquarium_live',
    rule: { footprint: { w: 3, h: 2 }, allowedTerrain: ['grass', 'land', 'floor'], scope: ['interior', 'exterior'] },
    collides: true, interact: 'aquarium',
  },
  aquarium_display: {
    key: 'aquarium_display', label: '관상용 수족관', objectType: 'aquarium_display',
    rule: { footprint: { w: 2, h: 1 }, allowedTerrain: ['floor'], scope: ['interior'] },
    collides: true, interact: 'aquarium',
  },
};

// ─────────────────────────────────────────────
// 수족관 2종 (rev3 — 스키마 스탠바이, 시뮬은 후속)
// ─────────────────────────────────────────────

export interface AquariumSpec {
  id: string;
  /** 활어 업소용(횟집 수조) / 관상용(전시) */
  kind: 'live_commercial' | 'ornamental';
  placeable: ('interior' | 'exterior')[];
  sizeTiles: { w: number; h: number };
  /** 수용 마릿수 (어체 크기 가중은 후속) */
  capacity: number;
  /** 활어 유지 — 신선도 감쇄 배율 (0.1 = 거의 활어 유지) */
  freshnessMult: number;
}

export const AQUARIUM_SPECS: Record<string, AquariumSpec> = {
  aq_live_std: {
    id: 'aq_live_std', kind: 'live_commercial', placeable: ['interior', 'exterior'],
    sizeTiles: { w: 3, h: 2 }, capacity: 6, freshnessMult: 0.1,
  },
  aq_display_std: {
    id: 'aq_display_std', kind: 'ornamental', placeable: ['interior'],
    sizeTiles: { w: 2, h: 1 }, capacity: 3, freshnessMult: 0.0,
  },
};

/** 수조 내용물 — WorldObjectState 옆에 instanceId 키로 영속 (골격) */
export interface AquariumState {
  specId: string;
  /** 수용 개체 (CoolerFish 직렬화 형태 — 클라이언트 CoolerSlotItem 계열) */
  fish: unknown[];
}

// ─────────────────────────────────────────────
// 하우스 확장 (Tier 0 원룸 → 평수/지하/2층)
// ─────────────────────────────────────────────

export interface HouseTier {
  tier: 0 | 1 | 2 | 3;
  /** Tier별 실내 맵 (JSON/파라메트릭 레이아웃 id — 교체 방식, 가구 배치는 이전) */
  interiorMapId: string;
  sizeW: number;
  sizeH: number;
  features: ('kitchen' | 'basement' | 'floor2' | 'storage')[];
}

export const HOUSE_TIERS: HouseTier[] = [
  { tier: 0, interiorMapId: 'home_t0', sizeW: 12, sizeH: 10, features: [] },
  { tier: 1, interiorMapId: 'home_t1', sizeW: 16, sizeH: 12, features: ['kitchen'] },
  { tier: 2, interiorMapId: 'home_t2', sizeW: 16, sizeH: 12, features: ['kitchen', 'basement'] },
  { tier: 3, interiorMapId: 'home_t3', sizeW: 16, sizeH: 12, features: ['kitchen', 'basement', 'floor2'] },
];

// ─────────────────────────────────────────────
// 교통수단 · 출조 요금
// ─────────────────────────────────────────────

/**
 * 교통수단 프로필 — 추후 자가용/보트 확장 대비.
 * (자전거는 필드 내 이동 수단(기존 R키 구현)이므로 여기 불포함)
 */
export interface TransportProfile {
  id: 'bus' | 'car' | 'boat';
  label: string;
  fareMode: 'flat' | 'perRegion';
  baseFareKrw: number;
}

export const TRANSPORT_PROFILES: Record<string, TransportProfile> = {
  bus: { id: 'bus', label: '출조 버스', fareMode: 'flat', baseFareKrw: 10000 },
};

/** 출조 요금 산출 — 현재 일괄(flat). regionId는 perRegion 확장 자리 */
export function computeTravelFare(_regionId: string, transport: 'bus' | 'car' | 'boat' = 'bus'): number {
  const p = TRANSPORT_PROFILES[transport];
  return p ? p.baseFareKrw : 10000;
}

// ─────────────────────────────────────────────
// 홈타운 초기 배치 (hometown_home — 목업 레이아웃 기준)
// ─────────────────────────────────────────────

/** 새 게임/기본 진입 스폰 — 집 문 앞 */
export const HOMETOWN_SPAWN = { col: 23, row: 9 };

/**
 * 홈타운 초기 오브젝트 배치.
 * 나무/바위 = removable(추후 벌목/채굴), 문/버스정류장 = 트리거.
 * (JSON objects 배열 대신 core 데이터로 관리 — 타입 안전 + 재생성 없이 조정 가능.
 *  타 지역 오브젝트가 생기면 JSON 스키마로 이관 검토)
 */
export const HOMETOWN_OBJECTS: MapObject[] = [
  // 집 문 (집 남쪽 벽 중앙) → 실내 진입
  { instanceId: 'home_door', type: 'door', tx: 23, ty: 7, collides: false, interact: 'door', movable: false, removable: false },
  // 버스정류장 (남동쪽 길 끝) → 전국 지도(출조)
  { instanceId: 'bus_stop', type: 'busStop', tx: 42, ty: 27, collides: true, interact: 'bus', movable: false, removable: false },
  // 우물
  { instanceId: 'well_1', type: 'well', tx: 31, ty: 10, collides: true, movable: false, removable: false },
  // 선착장 (바다 위 — 추후 개인 보트 출조)
  { instanceId: 'pier_1', type: 'pier', tx: 9, ty: 13, fw: 5, fh: 1, collides: false, interact: 'board', movable: false, removable: false },
  // 숲 — 상단 (추후 벌목)
  { instanceId: 'tree_n1', type: 'tree', tx: 31, ty: 3, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_n2', type: 'tree', tx: 35, ty: 2, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_n3', type: 'tree', tx: 40, ty: 4, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_n4', type: 'tree', tx: 44, ty: 2, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_n5', type: 'tree', tx: 17, ty: 3, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_n6', type: 'tree', tx: 14, ty: 6, collides: true, interact: 'chop', movable: false, removable: true },
  // 숲 — 우측/하단
  { instanceId: 'tree_e1', type: 'tree', tx: 45, ty: 12, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_e2', type: 'tree', tx: 44, ty: 18, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_s1', type: 'tree', tx: 24, ty: 24, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_s2', type: 'tree', tx: 29, ty: 27, collides: true, interact: 'chop', movable: false, removable: true },
  { instanceId: 'tree_s3', type: 'tree', tx: 20, ty: 28, collides: true, interact: 'chop', movable: false, removable: true },
  // 바위 (추후 채굴)
  { instanceId: 'rock_1', type: 'rock', tx: 33, ty: 19, collides: true, interact: 'mine', movable: false, removable: true },
  { instanceId: 'rock_2', type: 'rock', tx: 18, ty: 20, collides: true, interact: 'mine', movable: false, removable: true },
  // 갯바위 (좌하 만 — 추후 해루질/채집. 바다 타일 위라 이동 자체가 막혀 collides 불필요)
  { instanceId: 'tidal_1', type: 'tidalRock', tx: 14, ty: 28, collides: false, interact: 'gather', movable: false, removable: false },
  { instanceId: 'tidal_2', type: 'tidalRock', tx: 16, ty: 30, collides: false, interact: 'gather', movable: false, removable: false },
];
