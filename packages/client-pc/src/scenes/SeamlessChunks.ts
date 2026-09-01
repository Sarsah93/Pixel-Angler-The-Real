/**
 * @file SeamlessChunks.ts
 * @description OSM 심리스 단일 맵 — 청크 스트리밍 베이킹 + 근접 충돌 관리자 (OSM_TILEMAP_SPEC §6·§11)
 *
 * 대형 심리스 맵(속초 1179×642 = 약 76만 타일)은 전맵 1장 텍스처 베이킹이 불가능하다.
 * 대신:
 *  1. 맵을 CHUNK_TILES(64)² 타일 청크 격자로 나눈다.
 *  2. 카메라(플레이어) 중심 3×3 청크만 상주 — RenderTexture LRU 풀(12장)에서 재사용.
 *  3. 시각 베이킹은 **프레임당 1청크**로 분할(스파이크 방지). 충돌 바디는 상주 즉시 생성.
 *  4. 청크 로드/언로드 훅으로 부속 오브젝트(POI 마커 등)의 수명을 동기화한다.
 *
 * §11 L1(오토타일 스킨)·L3(프롭)의 **절차 구현**(101차 — mock_styled 목표):
 *  잔디/맨땅/모래 질감 스페클 · 차도(r) 차선 점선·연석 · 보도(w) 신축이음 ·
 *  방파제(b) 계선벽 캡·이음새·계선주 · 해안 포말 · 파도 대시 · 배 · 젖은 모래 띠 ·
 *  건물 = 컴포넌트 단위 박공/industrial 지붕 + 그림자 · 나무 = 청크 수명 스프라이트(y-sort).
 *  전부 결정적 해시(시드+타일좌표) — 재베이킹해도 같은 그림.
 */

import Phaser from 'phaser';
import type { RegionRoad, RegionProp } from '@tra/core';
import { GRASS_EDGE_SUFFIXES, PAVED_EDGE_SUFFIXES, KENNEY_ROOF_COLORS, KENNEY_ROOF_PARTS, TTP_EDGE_TILES, TTP_UNITS, COAST_DECKS, COAST_RUBBLE, COAST_EDGE_SRC, COAST_ROCK_COUNT } from '../data/TilesetManifest.js';

export interface PropDef {
  id: string;
  label: string;
  /** 텍스처 키 — `ts_*`(타일셋 PNG 직접 로드) 또는 `smx_*`(절차 베이크) */
  tex: string;
  /** 편집기 팔레트 카테고리 */
  cat: '자연' | '시설물' | '건물' | '건물요소' | '차량' | 'NPC' | '해안';
  /** 표시 배율 (정수 배율 우선 — 픽셀아트 보존. NPC는 0.5 = 2:1 다운샘플) */
  scale?: number;
  /** 바다 타일 전용 */
  water?: boolean;
  /** 앵커 — 기본 bottom(발밑 = 타일 하단 중앙). center = 타일 중앙 (지형 패치류) */
  anchor?: 'bottom' | 'center';
  /** 충돌 없음 (기본은 전부 충돌 — 101차 후속 4 "캐릭터가 오브젝트를 관통"). 지붕 연장 조각 등 장식만 false */
  passable?: boolean;
}

/** 프롭 풋프린트 (타일) — 텍스처 표시 크기 기준. 편집기 격자 표시·겹침 방지·충돌 바디가 공유 */
export function propFootprint(scene: Phaser.Scene, def: PropDef, tr: number): { w: number; h: number; bodyH: number } {
  if (!scene.textures.exists(def.tex)) return { w: 1, h: 1, bodyH: tr * 0.6 };
  const src = scene.textures.get(def.tex).getSourceImage() as { width: number; height: number };
  const s = def.scale ?? 1;
  const dw = src.width * s, dh = src.height * s;
  const w = Math.max(1, Math.round(dw / tr));
  if (def.anchor === 'center') {
    const h = Math.max(1, Math.round(dh / tr));
    return { w, h, bodyH: h * tr };
  }
  // 바닥 앵커 — 발밑 띠만 충돌(상단은 2.5D로 뒤가 가려지는 영역). 키 큰 오브젝트도 최대 2타일 깊이
  const bodyH = Phaser.Math.Clamp(dh * 0.35, tr * 0.5, tr * 2);
  return { w, h: Math.max(1, Math.round(bodyH / tr)), bodyH };
}

/**
 * 프롭 정의 (dev 맵 편집기 팔레트 = 이 표). 101차 후속: 오픈소스/생성 타일셋으로 전환 —
 *  ts_td_* = TopDownCityPack · ts_kn_* = Kenney(16px, 2배 정수 확대) · ts_gem_* = Gemini 생성본.
 *  절차 베이크(smx_*)는 타일셋에 대응물이 없는 것만 남긴다(바위·화단·기념탑·어선).
 * 전부 y-sort 스프라이트(플레이어와 같은 depth 식). 텍스처 미로드 시 렌더 생략.
 */
export const PROP_DEFS: PropDef[] = [
  // 자연
  { id: 'tree', label: '활엽수', tex: 'ts_td_tree_big', cat: '자연' },
  { id: 'tree2', label: '관목', tex: 'ts_td_tree_small', cat: '자연' },
  { id: 'palm', label: '야자수', tex: 'ts_td_palm', cat: '자연' },
  { id: 'pine', label: '측백(초록)', tex: 'ts_kn_ktree_a', cat: '자연', scale: 2 },
  { id: 'pine2', label: '측백(단풍)', tex: 'ts_kn_ktree_b', cat: '자연', scale: 2 },
  { id: 'bush', label: '둥근 나무', tex: 'ts_kn_ktree_d', cat: '자연', scale: 2 },
  { id: 'rock', label: '바위', tex: 'smx_rock', cat: '자연' },
  { id: 'flowerbed', label: '화단', tex: 'smx_flowerbed', cat: '자연' },
  // 시설물
  { id: 'bench', label: '벤치', tex: 'ts_td_bench', cat: '시설물' },
  { id: 'lamp', label: '가로등', tex: 'ts_td_lamp_arm', cat: '시설물' },
  { id: 'lamp2', label: '가로등 B', tex: 'ts_kn_klamp', cat: '시설물', scale: 2 },
  { id: 'traffic', label: '신호등', tex: 'ts_td_traffic_light', cat: '시설물' },
  { id: 'sign_stop', label: '정지 표지', tex: 'ts_td_traffic_light_stop', cat: '시설물' },
  { id: 'sign_warn', label: '경고 표지', tex: 'ts_td_sign_warn', cat: '시설물' },
  { id: 'sign_blue', label: '안내 표지', tex: 'ts_td_sign_blue', cat: '시설물' },
  { id: 'trash', label: '쓰레기통', tex: 'ts_td_trash', cat: '시설물' },
  { id: 'hydrant', label: '소화전', tex: 'ts_td_hydrant', cat: '시설물' },
  { id: 'trash2', label: '철망 휴지통', tex: 'ts_kn_ktrash', cat: '시설물', scale: 2 },
  { id: 'monument', label: '기념탑', tex: 'smx_monument', cat: '시설물' },
  { id: 'jungja', label: '정자(쉼터)', tex: 'ts_gem_jungja', cat: '시설물' },
  // 건물 (TopDown 주택 = 12px 원본 ×2 — 6×7칸 = 140×168px)
  { id: 'house_red', label: '주택(빨강)', tex: 'ts_td_house_red', cat: '건물', scale: 2 },
  { id: 'house_blue', label: '주택(파랑)', tex: 'ts_td_house_blue', cat: '건물', scale: 2 },
  // 건물 요소 (TopDown 모듈 — 펜스·문·지붕 연장·실외기. 사용자 리포트: "차고"는 펜스 세트 오독)
  { id: 'fence_h', label: '철망 펜스(가로)', tex: 'ts_td_fence_h', cat: '건물요소', scale: 2 },
  { id: 'fence_v1', label: '펜스 기둥 A', tex: 'ts_td_fence_v1', cat: '건물요소', scale: 2 },
  { id: 'fence_v2', label: '펜스 문 A', tex: 'ts_td_fence_v2', cat: '건물요소', scale: 2 },
  { id: 'fence_v3', label: '펜스 문 B', tex: 'ts_td_fence_v3', cat: '건물요소', scale: 2 },
  { id: 'fence_v4', label: '펜스 기둥 B', tex: 'ts_td_fence_v4', cat: '건물요소', scale: 2 },
  { id: 'door_blue', label: '문(파랑)', tex: 'ts_td_door_blue', cat: '건물요소', scale: 2, passable: true },
  { id: 'door_brown', label: '문(갈색)', tex: 'ts_td_door_brown', cat: '건물요소', scale: 2, passable: true },
  { id: 'door_white', label: '문(흰색)', tex: 'ts_td_door_white', cat: '건물요소', scale: 2, passable: true },
  { id: 'roof_ext_red', label: '지붕 연장(빨강)', tex: 'ts_td_roof_ext_red', cat: '건물요소', scale: 2, passable: true },
  { id: 'roof_ext_blue', label: '지붕 연장(파랑)', tex: 'ts_td_roof_ext_blue', cat: '건물요소', scale: 2, passable: true },
  { id: 'ac_unit', label: '실외기', tex: 'ts_td_ac_unit', cat: '건물요소', scale: 2 },
  { id: 'building_1', label: '고층 1', tex: 'ts_gem_building_1', cat: '건물' },
  { id: 'building_2', label: '고층 2', tex: 'ts_gem_building_2', cat: '건물' },
  { id: 'building_3', label: '고층 3', tex: 'ts_gem_building_3', cat: '건물' },
  { id: 'building_4', label: '고층 4', tex: 'ts_gem_building_4', cat: '건물' },
  { id: 'building_5', label: '고층 5', tex: 'ts_gem_building_5', cat: '건물' },
  { id: 'popup_1', label: '팝업스토어 1', tex: 'ts_gem_popup_1', cat: '건물' },
  { id: 'popup_2', label: '팝업스토어 2', tex: 'ts_gem_popup_2', cat: '건물' },
  { id: 'popup_3', label: '팝업스토어 3', tex: 'ts_gem_popup_3', cat: '건물' },
  { id: 'popup_4', label: '팝업스토어 4', tex: 'ts_gem_popup_4', cat: '건물' },
  { id: 'sashimi_1', label: '횟집 1', tex: 'ts_gem_sashimi_1', cat: '건물' },
  { id: 'sashimi_2', label: '횟집 2', tex: 'ts_gem_sashimi_2', cat: '건물' },
  { id: 'stall_green', label: '노점(초록)', tex: 'ts_kn_stall_green', cat: '건물', scale: 2 },
  { id: 'stall_orange', label: '노점(주황)', tex: 'ts_kn_stall_orange', cat: '건물', scale: 2 },
  // 차량 (측면 — 가로 도로용 정적 배치)
  { id: 'car_a', label: '승용차 초록', tex: 'ts_kn_car_a', cat: '차량', scale: 2 },
  { id: 'car_c', label: '승용차 회색', tex: 'ts_kn_car_c', cat: '차량', scale: 2 },
  { id: 'car_e', label: '승용차 주황', tex: 'ts_kn_car_e', cat: '차량', scale: 2 },
  { id: 'car_g', label: '승용차(세로) 초록', tex: 'ts_kn_car_g', cat: '차량', scale: 2 },
  { id: 'car_i', label: '승용차(세로) 회색', tex: 'ts_kn_car_i', cat: '차량', scale: 2 },
  { id: 'car_k', label: '승용차(세로) 주황', tex: 'ts_kn_car_k', cat: '차량', scale: 2 },
  // TopDown 주차용 차량/픽업 — 3/4 시점 4방향 프레임 (회전 금지 — 벽 방향에 맞는 프레임을 고른다), ×1.25
  { id: 'pickup_blue', label: '픽업트럭 파랑', tex: 'ts_td_pickup_blue_up', cat: '차량', scale: 1.25 },
  { id: 'pickup_green', label: '픽업트럭 초록', tex: 'ts_td_pickup_green_up', cat: '차량', scale: 1.25 },
  { id: 'pickup_red', label: '픽업트럭 빨강', tex: 'ts_td_pickup_red_up', cat: '차량', scale: 1.25 },
  { id: 'pickup_blue_side', label: '픽업트럭 파랑(옆)', tex: 'ts_td_pickup_blue_right', cat: '차량', scale: 1.25 },
  { id: 'pickup_red_side', label: '픽업트럭 빨강(옆)', tex: 'ts_td_pickup_red_left', cat: '차량', scale: 1.25 },
  { id: 'tdcar_blue', label: '승용차(3/4) 파랑', tex: 'ts_td_car_blue_up', cat: '차량', scale: 1.25 },
  { id: 'tdcar_red_side', label: '승용차(3/4) 빨강(옆)', tex: 'ts_td_car_red_right', cat: '차량', scale: 1.25 },
  // 어선 — 승용차(≈44px)의 2배 (사용자 지시). 오픈소스 두 팩에는 배 스프라이트가 없어 절차 베이크 유지
  { id: 'boat', label: '어선', tex: 'smx_boat', cat: '차량', water: true, scale: 2 },
  // NPC (정적 — L4 스폰 규칙은 씬이 POI 기준으로 자동 배치, 여기는 수동 오버라이드)
  { id: 'npc_fish_vendor', label: '생선 장수', tex: 'ts_gem_npc_fish_vendor', cat: 'NPC', scale: 0.5 },
  { id: 'npc_grandfather', label: '할아버지', tex: 'ts_gem_npc_grandfather', cat: 'NPC', scale: 0.5 },
  { id: 'npc_police', label: '경찰관', tex: 'ts_gem_npc_police', cat: 'NPC', scale: 0.5 },
  { id: 'npc_father_kid', label: '아빠와 아이', tex: 'ts_gem_npc_father_kid', cat: 'NPC', scale: 0.5 },
  { id: 'npc_tourist_f', label: '관광객', tex: 'ts_gem_npc_tourist_f', cat: 'NPC', scale: 0.5 },
  // 해안 (지형 패치 — 타일 중앙 앵커, 부두↔바다 경계에 놓는다)
  { id: 'tetra', label: '테트라포드 석축', tex: 'ts_ttp_ttp_l', cat: '해안', anchor: 'center' },
  { id: 'boundary_port', label: '부두 경계(바다)', tex: 'ts_gem_boundary_port', cat: '해안', anchor: 'center' },
];

export interface SeamlessChunksConfig {
  /** 지형 문자 그리드 — [row] 문자열 (seamless.json terrain) */
  terrainRows: string[];
  /** 차도 중심선 벡터 — 차선·중앙선 마킹 (없으면 마킹 생략) */
  roads?: RegionRoad[];
  /** 수동 배치 프롭 (patch.json) */
  props?: RegionProp[];
  /** 건물 지붕 팔레트 오버라이드 — 컴포넌트 좌상단 "c,r" → 인덱스 */
  roofOverrides?: Record<string, number>;
  /** 고층 프리팹 자동 배치에서 제외할 건물 컴포넌트 키(씬이 POI 건물 스프라이트를 붙인 곳) */
  reservedBuildingKeys?: Set<string>;
  cols: number;
  rows: number;
  /** 타일 렌더 크기(px) — RegionFieldScene TR과 동일해야 좌표계가 일치한다 */
  tr: number;
  /** 청크 한 변 타일 수 (기본 64 — TR 20px 기준 1280px RenderTexture) */
  chunkTiles?: number;
  /** RenderTexture 풀 크기 (기본 12 — 상주 3×3 = 9 + 여유) */
  poolSize?: number;
  /** 지형 시드 (결정적 배치) */
  seed: number;
  /** 청크 상주 시작 훅 (POI 마커 생성 등) */
  onChunkLoad?: (chunkCol: number, chunkRow: number) => void;
  /** 청크 상주 해제 훅 (부속 오브젝트 파괴) */
  onChunkUnload?: (chunkCol: number, chunkRow: number) => void;
}

interface ChunkSlot {
  rt: Phaser.GameObjects.RenderTexture;
  baked: boolean;
  /** 이 청크의 충돌 바디(투명 사각형) 목록 — 언로드 시 파괴 */
  bodies: Phaser.GameObjects.Rectangle[];
  /** 이 청크의 프롭 스프라이트(나무·지붕·차량 — y-sort) */
  deco: Phaser.GameObjects.GameObject[];
  /** 이 청크가 베이크한 지붕 텍스처 키 (언로드 시 제거) */
  roofKeys: string[];
}

/** 지형 팔레트 (101차 — mock_styled 톤) */
const COL = {
  land: 0xcbb98d, landAlt: 0xc4b287, landSpeck: 0xb2a077,
  grass: 0x69a24c, grassAlt: 0x639a47, grassDark: 0x578b3e, grassLight: 0x7fb35f,
  sand: 0xe8d9a0, sandAlt: 0xe2d298, sandSpeck: 0xcdbd85, sandWet: 0xc9b986,
  // 차도·보도 = Kenney 셀 실측색 (아스팔트 (11,19) = #404040 · 보도 (1,20) = #9daaab · 횡단보도 흰색 #d6dbe6)
  road: 0x404040, roadAlt: 0x3c3c3c, roadSpeck: 0x4a4a4a, roadLine: 0xe8ecf0, roadCenter: 0xe8c23a, crosswalk: 0xd6dbe6,
  walk: 0x9daaab, walkAlt: 0x94a1a2, walkJoint: 0x8a9697, curb: 0xd2d6dc,
  pier: 0x9aa5b0, pierAlt: 0x94a0ab, pierJoint: 0x7d8894, pierEdge: 0x5a6773,
  bollard: 0x3a4450, bollardTop: 0x55616e,
  buildEdge: 0x3a3f47, shadow: 0x101820,
  foam: 0xe8f4fa, wave: 0x9cc4dd, waveDeep: 0x1c3c5c,
  boatHull: 0x2e4a66, boatDeck: 0xe8eef2,
};

/** 수심 그라데이션 (거리 램프) — legacy DEPTH_RAMP 계승 */
const DEPTH_RAMP: [number, number][] = [
  [0x74add0, 0x6da6c9],
  [0x5e9cc4, 0x5794bd],
  [0x4a86b0, 0x437ea8],
  [0x3a6f99, 0x356890],
  [0x2c5a82, 0x275378],
  [0x224a6e, 0x1e4366],
];
const bucketOf = (d: number): number =>
  d <= 2 ? 0 : d <= 6 ? 1 : d <= 12 ? 2 : d <= 20 ? 3 : d <= 30 ? 4 : 5;

/** 오토타일 접경 마스크(N1·E2·S4·W8 — 비트 = 그 변이 다른 지형) → 엣지 셀 접미 (EDGE_CELLS 정합) */
const EDGE_SUFFIX: Record<number, string> = {
  1: 'n', 2: 'e', 4: 's', 8: 'w', 3: 'ne', 9: 'nw', 6: 'se', 12: 'sw',
  5: 'ns', 10: 'we', 7: 'nse', 13: 'nsw', 11: 'nwe', 14: 'swe', 15: 'nswe',
};

/** 지붕 팔레트 (컴포넌트 해시로 배정) — [밝은 사면, 어두운 사면, 용마루, 외벽] */
const ROOFS: [number, number, number, number][] = [
  [0xc25a4b, 0x9c4237, 0xd97c6b, 0x8a5a48],   // 붉은 기와
  [0xcf8a45, 0xa96b30, 0xe0a468, 0x8a6848],   // 주황
  [0x7a8698, 0x5f6b7d, 0x93a0b2, 0x5c6470],   // 슬레이트
  [0x5f8d7d, 0x4a7263, 0x7aa694, 0x567262],   // 청록
  [0x8a6f4d, 0x6d5639, 0xa08862, 0x6a5540],   // 갈색
];
/** 대형(industrial) 지붕 — 패널 + 이음 */
const ROOF_BIG: [number, number, number] = [0x64788c, 0x596c80, 0x4a5b6d];

/** 결정적 해시 (0~1) */
function hash2(seed: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** 결정적 2D 값 노이즈 (암초 배치 — legacy 동일식) */
function noise2(seed: number, x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(seed, ix, iy) * (1 - sx) + hash2(seed, ix + 1, iy) * sx;
  const b = hash2(seed, ix, iy + 1) * (1 - sx) + hash2(seed, ix + 1, iy + 1) * sx;
  return a * (1 - sy) + b * sy;
}

interface BuildingComp {
  c0: number; r0: number; c1: number; r1: number;
  /** 타일 수 (면적) */
  n: number;
  palIdx: number;
  /** 대형(창고·터미널급) — 패널 지붕 */
  big: boolean;
}

export class SeamlessChunks {
  private scene: Phaser.Scene;
  private cfg: Required<Pick<SeamlessChunksConfig, 'chunkTiles' | 'poolSize'>> & SeamlessChunksConfig;
  private chunkCols: number;
  private chunkRows: number;
  private chunkPx: number;

  private resident = new Map<number, ChunkSlot>();
  private rtPool: Phaser.GameObjects.RenderTexture[] = [];
  private rtCreated = 0;
  private bakeQueue: number[] = [];

  /** 충돌 그룹 — 씬이 playerBody와 collider를 1회 등록한다 */
  readonly walls: Phaser.Physics.Arcade.StaticGroup;

  /** 바다 타일의 육지 거리 (수심 그라데이션) — 전맵 1회 BFS */
  private waterDist: Uint16Array;
  /** 섬/암초 플래그 (computeIslets — 조도 등 소형 야생 육지 = 갯바위 렌더) */
  private islet: Uint8Array;
  /** 외해(열린 바다) 마스크 — 맵 경계 물에서 '넉넉히 넓은 수역'만 타고 퍼진 영역.
   *  방파제 피복(테트라포드) 판정에 쓴다. 석호(청초호)·좁은 수로·항 내측은 여기 안 든다. */
  private openSea: Uint8Array;
  /** 건물 타일 → 컴포넌트 id (-1 = 비건물) — 지붕 렌더의 기준 */
  private compOf: Int32Array;
  private comps: BuildingComp[] = [];
  /** 청크 idx → 그 청크에 걸치는 차도 벡터 인덱스 (마킹 렌더 시 전수 순회 회피) */
  private roadsByChunk = new Map<number, number[]>();
  /** 청크 idx → 수동 프롭 */
  private propsByChunk = new Map<number, RegionProp[]>();
  /**
   * Kenney 지면 타일 (16px → tr 정수 배율 재베이크 키) — 지형 문자별 변형 목록.
   * tr가 16의 배수가 아니거나 텍스처가 없으면 비어 있고, 절차 렌더로 폴백한다.
   */
  private groundTex = new Map<string, string[]>();
  /** 오토타일 엣지 셀 — 지형군('.', ',', 'b') → (접미 → 텍스처 키) */
  private edgeTex = new Map<string, Map<string, string>>();
  /** 물 타일 — [수심 버킷][변형] 텍스처 키 (절차 베이크) */
  private waterTex: string[][] = [];

  constructor(scene: Phaser.Scene, cfg: SeamlessChunksConfig) {
    this.scene = scene;
    this.cfg = { chunkTiles: 64, poolSize: 12, ...cfg };
    this.chunkPx = this.cfg.chunkTiles * cfg.tr;
    this.chunkCols = Math.ceil(cfg.cols / this.cfg.chunkTiles);
    this.chunkRows = Math.ceil(cfg.rows / this.cfg.chunkTiles);
    this.walls = scene.physics.add.staticGroup();
    this.waterDist = this.computeWaterDistance();
    this.openSea = this.computeOpenSea();
    this.islet = this.computeIslets();
    this.compOf = new Int32Array(cfg.cols * cfg.rows).fill(-1);
    this.labelBuildings();
    this.indexRoads();
    this.setProps(cfg.props ?? []);
    this.ensureDecoTextures();
    this.ensureGroundTextures();
  }

  /**
   * Kenney 16px 지면 타일을 tr 배율(정수)로 재베이크 — CanvasTexture + imageSmoothing off.
   * 지형 문자 → 후보 텍스처 목록 (해시로 변형 선택). 타일 스트라이드와 정수비일 때만.
   */
  private ensureGroundTextures(): void {
    const tr = this.cfg.tr;
    if (tr % 16 !== 0) return;
    const scale = tr / 16;
    // ⚠ 차도('r')·보도('w')의 베이스도 **맨땅(tan)** — 도로는 벡터 밴드(drawRoadBands)가 위에 곡선으로
    //   그리므로 래스터 계단(타일 단위 r/w)이 보이면 안 된다(101차 후속 5 — 리포트 5.3).
    // 모래는 **웜 틴트**(multiply) — Kenney sand(크림)가 tan 포장(베이지)과 육안 구분이 안 돼
    // "해수욕장에 모래가 안 깔린" 것으로 보였다(사용자 리포트 — terrain엔 's'가 이미 있었다).
    const groups: [string, string[], string?][] = [
      ['.', ['tan_0', 'tan_1']],                   // 맨땅 = 베이지 포장 (항구 도시 광장 톤)
      [',', ['grass_0', 'grass_1']],
      ['r', ['tan_0', 'tan_1']],
      ['w', ['tan_0', 'tan_1']],
      ['s', ['sand_0', 'sand_1'], '#f6d47c'],
      ['b', ['pier_0', 'pier_1']],
    ];
    const tm = this.scene.textures;
    /** 16px 원본 → tr 배율 재베이크. clip = 직각삼각형(빗변 대각선) · tint = multiply 웜 톤 ·
     *  hypLine = 빗변 경계선 색 — 삼각 셀에 경계선이 없으면 사각 테두리 셀과 교대할 때 경계가
     *  끊겨 "타일이 뒤섞이는" 파편으로 보인다(사용자 리포트 — 빗변끼리·테두리끼리 기하학적으로 이어진다) */
    const bake = (src: string, dst: string, w: number, h: number, clip?: 'ne' | 'nw' | 'se' | 'sw', sx = 0, sy = 0, tint?: string, hypLine?: string): boolean => {
      if (tm.exists(dst)) return true;
      if (!tm.exists(src)) return false;
      const img = tm.get(src).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const cv = tm.createCanvas(dst, w, h);
      if (!cv) return false;
      const ctx = cv.getContext();
      ctx.imageSmoothingEnabled = false;
      if (clip) {
        // 90° 꼭짓점이 clip 방위에 있는 직각삼각형만 남긴다 (가로=세로=tr, 빗변이 45° 경계)
        ctx.beginPath();
        if (clip === 'ne') { ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); }
        else if (clip === 'nw') { ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(0, h); }
        else if (clip === 'se') { ctx.moveTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); }
        else { ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); }
        ctx.closePath(); ctx.clip();
      }
      ctx.drawImage(img, sx, sy, w / scale, h / scale, 0, 0, w, h);
      if (tint) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (clip && hypLine) {
        ctx.strokeStyle = hypLine;
        ctx.lineWidth = 3;                             // 클립 안쪽 ~1.5px만 보인다
        ctx.beginPath();
        if (clip === 'ne' || clip === 'sw') { ctx.moveTo(0, 0); ctx.lineTo(w, h); }
        else { ctx.moveTo(w, 0); ctx.lineTo(0, h); }
        ctx.stroke();
      }
      cv.refresh();
      return true;
    };
    // 삼각 빗변 경계선 색 — Kenney 테두리 실측(tan #ac9d83 · pier #8b9ea6). 잔디는 삼각 미사용
    const HYP_LINE: Record<string, string> = { '.': '#ac9d83', r: '#ac9d83', w: '#ac9d83', s: '#ac9d83', b: '#8b9ea6' };
    for (const [ch, names, tint] of groups) {
      const keys: string[] = [];
      for (const n of names) {
        const src = `ts_kn_ground_${n}`;
        const dst = tint ? `${src}_x${scale}_t` : `${src}_x${scale}`;
        if (!bake(src, dst, tr, tr, undefined, 0, 0, tint)) continue;
        keys.push(dst);
        if (keys.length === 1) for (const q of ['ne', 'nw', 'se', 'sw'] as const) bake(src, `${dst}_tri_${q}`, tr, tr, q, 0, 0, tint, HYP_LINE[ch]);
      }
      if (keys.length > 0) this.groundTex.set(ch, keys);
    }
    // ── 지면 오토타일 엣지/코너 (101차 잔여) — 지형군('.'=tan · ','=grass · 'b'=pier)별 접경 셀 ──
    //  잔디 = 블롭 완전 세트(16조합 + 이너코너 노치) / 포장 = 8방위 어두운 테두리. bakeChunk L1이
    //  접경 마스크(EDGE_SUFFIX)로 선택한다. pave 세트는 예비(현재 보도 베이스 = tan).
    const edgeSets: [string, string, readonly string[]][] = [
      [',', 'grass', GRASS_EDGE_SUFFIXES],
      ['.', 'tan', PAVED_EDGE_SUFFIXES],
      ['b', 'pier', PAVED_EDGE_SUFFIXES],
    ];
    for (const [ch, name, sufs] of edgeSets) {
      const map = new Map<string, string>();
      for (const suf of sufs) {
        const src = `ts_kn_ground_${name}_edge_${suf}`;
        const dst = `${src}_x${scale}`;
        if (bake(src, dst, tr, tr)) map.set(suf, dst);
      }
      if (map.size > 0) this.edgeTex.set(ch, map);
    }
    // 건물 키트 — 지붕 오토타일 셀(+2×2 패널) + 벽 모듈(64×32 → 8칸으로 분할: 상단 4 + 하단 4)
    for (const color of KENNEY_ROOF_COLORS) {
      for (const part of KENNEY_ROOF_PARTS) {
        bake(`ts_kn_roof_${color}_${part}`, `kit_roof_${color}_${part}`, tr, tr);
      }
      // 대각 지붕 코너 (101차 잔여) — Kenney 시트엔 45° 셀이 없어 'in' 셀을 삼각 클립 베이크.
      //  buildKitRoof가 계단형(대각) 풋프린트의 스텝 코너에서 사각 코너 셀 대신 사용한다.
      for (const q of ['ne', 'nw', 'se', 'sw'] as const) {
        bake(`ts_kn_roof_${color}_in`, `kit_roof_${color}_tri_${q}`, tr, tr, q);
      }
    }
    for (const wall of ['brick_red', 'brick_gray', 'brick_tan', 'glass', 'white']) {
      for (let i = 0; i < 8; i++) {
        bake(`ts_kn_wall_${wall}`, `kit_wall_${wall}_${i}`, tr, tr, undefined, (i % 4) * 16, Math.floor(i / 4) * 16);
      }
    }
    this.kitReady = tm.exists('kit_roof_red_in') && tm.exists('kit_wall_brick_red_0');
    this.ensureWaterTextures();
  }

  /**
   * 물 타일셋 (101차 잔여) — Kenney 팩에는 바다 셀이 없어(수영장 시안뿐) DEPTH_RAMP 톤으로
   * **절차 베이크**: 수심 버킷별 2변형 × 2px 그레인 디더(지면 ×2와 동일 입자) + 인접 버킷 알갱이·글린트.
   * bakeChunk L1이 버킷·해시로 골라 깔고, 절차 패스는 암초/파도/포말/배 오버레이만 얹는다.
   */
  private ensureWaterTextures(): void {
    const tr = this.cfg.tr;
    const tm = this.scene.textures;
    this.waterTex = [];
    for (let b = 0; b < DEPTH_RAMP.length; b++) {
      const keys: string[] = [];
      for (let v = 0; v < 2; v++) {
        const key = `kn_water_${b}_${v}`;
        if (!tm.exists(key)) {
          const cv = tm.createCanvas(key, tr, tr);
          if (!cv) continue;
          const ctx = cv.getContext();
          const [t0, t1] = DEPTH_RAMP[b];
          const deep = DEPTH_RAMP[Math.min(DEPTH_RAMP.length - 1, b + 1)][1];
          const lite = DEPTH_RAMP[Math.max(0, b - 1)][0];
          const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
          const px = 2;
          for (let y = 0; y < tr; y += px) {
            for (let x = 0; x < tr; x += px) {
              const h = hash2(0x9e37 ^ (b * 131 + v * 17), x, y);
              let col = h > 0.5 ? t0 : t1;
              if (h > 0.968) col = lite;         // 밝은 글린트
              else if (h < 0.028) col = deep;    // 어두운 알갱이
              ctx.fillStyle = hex(col);
              ctx.fillRect(x, y, px, px);
            }
          }
          cv.refresh();
        }
        if (tm.exists(key)) keys.push(key);
      }
      this.waterTex.push(keys);
    }
    // 테트라포드 폴백 — TTP 세트(ts_ttp_*)가 없을 때만 gem 원본(124px)을 1.75타일로 축소 베이크.
    // (구 경로 보존 — legacy 지역/에셋 미배포 빌드용)
    const tw = Math.round(tr * 1.75);
    if (!tm.exists('smx_tetra_s') && !tm.exists('ts_ttp_ttp_l') && tm.exists('ts_gem_tetra')) {
      const img = tm.get('ts_gem_tetra').getSourceImage() as HTMLImageElement;
      const cv = tm.createCanvas('smx_tetra_s', tw, tw);
      if (cv) {
        const ctx = cv.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, tw, tw);
        cv.refresh();
      }
    }
    this.ensureTtpTextures();
    this.ensureCoastTextures();
  }

  /**
   * TTP(테트라포드)·해안 접경 세트 — 사용자 제작 시트에서 구운 `ts_ttp_*`(타일 32px = TR 1:1).
   *
   *  - **접경 타일**: 원본은 모래가 **북**·물이 남인 한 방위뿐이라, 4방위를 캔버스 회전으로 굽는다
   *    (`smx_ttpe_<dir><variant>` — dir 0=N 1=E 2=S 3=W = "모래가 있는 쪽"). 물 타일 위에 얹으면
   *    모래가 접경 방향으로 번지고 포말이 그 앞에 깔린다 → 103차 절차 서프 밴드를 대체한다.
   *  - **피복 유닛**: 파이썬에서 이미 3크기 × 좌우 플립으로 구워 나오므로 재샘플 없이 그대로 쓴다.
   *
   * 전부 있을 때만 `ttpReady` — 하나라도 없으면 절차 폴백(구 렌더)이 그대로 돈다.
   */
  private ensureTtpTextures(): void {
    const tr = this.cfg.tr;
    const tm = this.scene.textures;
    if (tr !== 32 || !tm.exists('ts_ttp_edge_foam')) return;   // 타일이 TR 1:1일 때만 (재샘플 금지)
    this.ttpEdge = [[], [], [], []];
    for (const name of TTP_EDGE_TILES) {
      const src = `ts_ttp_${name}`;
      if (!tm.exists(src)) continue;
      // corner_ne 는 2×2 코너 조합의 우상 셀 = 모래가 **서**쪽 — 북 기준으로 정규화(+90°)
      const base = name === 'corner_ne' ? 1 : 0;
      for (let d = 0; d < 4; d++) {
        const key = `smx_ttpe_${d}_${name}`;
        if (!tm.exists(key)) {
          const cv = tm.createCanvas(key, tr, tr);
          if (!cv) continue;
          const ctx = cv.getContext();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(tr / 2, tr / 2);
          ctx.rotate((((d - base) % 4 + 4) % 4) * Math.PI / 2);
          ctx.translate(-tr / 2, -tr / 2);
          ctx.drawImage(tm.get(src).getSourceImage() as CanvasImageSource, 0, 0);
          cv.refresh();
        }
        if (tm.exists(key)) this.ttpEdge[d].push(key);
      }
    }
    this.ttpReady = this.ttpEdge.every((v) => v.length > 0)
      && TTP_UNITS.every((u) => tm.exists(`ts_ttp_${u}`) && tm.exists(`ts_ttp_${u}_fx`));
  }

  /**
   * 해안 세트(105차) — 사용자 시트 3장에서 구운 `ts_coast_*`(전부 32px = TR 1:1).
   *
   *  - **방파제 몸통**: 상판(`deck_*`)·사석 사면(`rubble_*`)은 불투명 타일 → `'b'` 지면을 대체.
   *  - **접경 오버레이**: `rubble_toe_*`(외해측 사석 발치)·`pier_edge_*`(항내 안벽)은 바다를
   *    투명으로 판 셀이라 **물 타일 위**에 얹는다. 원본은 뭍이 한 방위뿐이라 4방위 회전 베이크
   *    (`smx_ce_<dir>_<name>` — dir = **뭍(=방파제)이 있는 쪽**).
   *  - **갯바위 산포**: `rock_01..20`은 알파 트림 스프라이트라 그대로 배치한다.
   */
  private ensureCoastTextures(): void {
    const tr = this.cfg.tr;
    const tm = this.scene.textures;
    if (tr !== 32 || !tm.exists('ts_coast_deck_0')) return;
    this.coastEdge = [[], [], [], []];
    for (const { name, landDir } of COAST_EDGE_SRC) {
      const src = `ts_coast_${name}`;
      if (!tm.exists(src)) continue;
      for (let d = 0; d < 4; d++) {
        const key = `smx_ce_${d}_${name}`;
        if (!tm.exists(key)) {
          const cv = tm.createCanvas(key, tr, tr);
          if (!cv) continue;
          const ctx = cv.getContext();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(tr / 2, tr / 2);
          ctx.rotate((((d - landDir) % 4 + 4) % 4) * Math.PI / 2);
          ctx.translate(-tr / 2, -tr / 2);
          ctx.drawImage(tm.get(src).getSourceImage() as CanvasImageSource, 0, 0);
          cv.refresh();
        }
        if (tm.exists(key)) this.coastEdge[d].push(key);
      }
    }
    this.coastRocks = [];
    for (let i = 1; i <= COAST_ROCK_COUNT; i++) {
      const k = `ts_coast_rock_${String(i).padStart(2, '0')}`;
      if (tm.exists(k)) this.coastRocks.push(k);
    }
    this.coastReady = this.coastEdge.every((v) => v.length > 0)
      && COAST_DECKS.every((d) => tm.exists(`ts_coast_${d}`))
      && COAST_RUBBLE.every((d) => tm.exists(`ts_coast_${d}`))
      && this.coastRocks.length > 0;
  }

  /** 방파제 접경 오버레이 — 방위별(0=N 1=E 2=S 3=W = 방파제가 있는 쪽) 회전 셀 */
  private coastEdge: string[][] = [];
  /** 갯바위 산포 스프라이트 (알파 트림) */
  private coastRocks: string[] = [];
  /** 해안 세트 사용 가능 여부 — false면 Kenney pier 베이스 + 절차 렌더(구 경로) */
  private coastReady = false;

  /**
   * `'b'`(방파제) 타일 텍스처 선택 — 실사 항공사진 기반 어휘.
   *  물에 안 닿으면 **상판**, 외해측 물에 닿거나 3면이 물이면 **사석 사면**, 항내측은 상판 유지
   *  (항내 접경은 물 타일 쪽 `pier_edge` 오버레이가 안벽을 그린다).
   */
  private coastPierKey(c: number, r: number): string {
    const at = (cc: number, rr: number): string => this.tileAt(cc, rr);
    const w = [at(c, r - 1) === '~', at(c + 1, r) === '~', at(c, r + 1) === '~', at(c - 1, r) === '~'];
    const wc = w.filter(Boolean).length;
    const h = hash2(this.cfg.seed ^ 0xc0a5, c, r);
    if (wc > 0) {
      const dv = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
      let open = wc >= 3;                       // 두부(3면 물)는 항상 사석
      for (let d = 0; d < 4 && !open; d++) {
        if (!w[d]) continue;
        const nc = c + dv[d][0], nr = r + dv[d][1];
        if (this.raysToOpenSea(nc, nr, dv[d][0], dv[d][1])) open = true;
      }
      if (open) return `ts_coast_${COAST_RUBBLE[Math.floor(h * COAST_RUBBLE.length) % COAST_RUBBLE.length]}`;
    }
    if (h > 0.965) return 'ts_coast_deck_seam';
    return `ts_coast_${COAST_DECKS[Math.floor(h * 997) % COAST_DECKS.length]}`;
  }

  /** 모래 접경 방위별 회전 접경 타일 (0=N 1=E 2=S 3=W — 모래가 있는 쪽) */
  private ttpEdge: string[][] = [];
  /** TTP 세트 사용 가능 여부 — false면 103차 절차 서프/구 gem 테트라 폴백 */
  private ttpReady = false;

  /**
   * 방파제 외해측 테트라포드 피복 — 유닛 2~3개를 해시 지터 + 좌우 플립으로 흩어 놓는다.
   * (실사: 한 덩어리가 아니라 소형 유닛이 겹겹이 쌓인 사면. `dense=false`는 두 번째 밴드 = 성글게)
   */
  private drawTtpCluster(rt: Phaser.GameObjects.RenderTexture, dx: number, dy: number, c: number, r: number, dense: boolean): void {
    const tr = this.cfg.tr;
    const seed = this.cfg.seed;
    const n = dense ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const h1 = hash2(seed ^ (0x7e7a + i * 977), c, r);
      const h2 = hash2(seed ^ (0x51ab + i * 313), c, r);
      const big = dense && i === 0 && h1 > 0.55;
      const px = big ? 38 : 26;
      const key = `ts_ttp_ttp_${big ? 'm' : 's'}${h2 > 0.5 ? '_fx' : ''}`;
      const ox = Math.floor(h2 * (tr - 6)) - (px - tr) / 2 - 3;
      const oy = Math.floor(h1 * (tr - 6)) - (px - tr) / 2 - 3;
      rt.batchDraw(key, dx + ox, dy + oy);
    }
  }

  /** Kenney 건물 키트(지붕 오토타일·벽 모듈) 재베이크 완료 여부 — 없으면 절차 지붕 폴백 */
  private kitReady = false;

  /** 물 타일 수심 버킷(+암초 융기) — L1 물 타일 선택과 절차 오버레이 패스가 공유.
   *  버킷 경계는 해시 지터(±1.1타일)로 디더 — 등고선 하드 라인 대신 톱니 혼합 (밴드 계단 완화) */
  private waterBucketAt(c: number, r: number): { bucket: number; isReef: boolean } {
    const d = this.waterDist[r * this.cfg.cols + c];
    const dj = Math.max(0, d + (hash2(this.cfg.seed ^ 0x3c9d, c, r) - 0.5) * 2.2);
    let bucket = bucketOf(dj);
    const reefNoise = noise2(this.cfg.seed & 0x7fffffff, c / 7, r / 7);
    const isReef = d >= 5 && d <= 18 && reefNoise > 0.82;
    if (isReef) bucket = Math.max(0, bucket - 1);
    return { bucket, isReef };
  }

  /** 차도 벡터를 청크에 배정 (세그먼트 bbox + 폭 여유) */
  /** 도로 정점 키 (0.1타일) → 그 점을 지나는 도로 인덱스 목록 — 교차 정점 판정(마킹 분할) */
  private nodeRoads = new Map<string, number[]>();
  private nodeKey(p: [number, number]): string {
    return `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
  }

  /** 회전교차로 링 중심·반경 (타일) — 진입부 마킹 규칙(반경+2.5 안 = 양보선만) */
  private roundabouts: { cx: number; cy: number; R: number }[] = [];

  /** 신호 교차로 (휴리스틱 — 101차 잔여 "신호등·대각선 횡단보도") — 중심·박스 반경 (타일) */
  private signals: { x: number; y: number; half: number }[] = [];

  private indexRoads(): void {
    this.roadsByChunk.clear();
    this.nodeRoads.clear();
    this.roundabouts = [];
    for (const rd of this.cfg.roads ?? []) {
      if (!rd.roundabout || rd.pts.length < 6) continue;
      let cx = 0, cy = 0;
      for (const p of rd.pts) { cx += p[0]; cy += p[1]; }
      cx /= rd.pts.length; cy /= rd.pts.length;
      let R = 0;
      for (const p of rd.pts) R += Math.hypot(p[0] - cx, p[1] - cy);
      this.roundabouts.push({ cx, cy, R: R / rd.pts.length });
    }
    (this.cfg.roads ?? []).forEach((road, ri) => {
      for (const p of road.pts) {
        const k = this.nodeKey(p);
        const l = this.nodeRoads.get(k);
        if (l) { if (!l.includes(ri)) l.push(ri); } else this.nodeRoads.set(k, [ri]);
      }
    });
    this.detectSignals();
    const N = this.cfg.chunkTiles;
    (this.cfg.roads ?? []).forEach((road, ri) => {
      const pad = road.w + 1;
      const seen = new Set<number>();
      for (let i = 0; i < road.pts.length - 1; i++) {
        const [x0, y0] = road.pts[i], [x1, y1] = road.pts[i + 1];
        const cc0 = Math.max(0, Math.floor((Math.min(x0, x1) - pad) / N));
        const cc1 = Math.min(this.chunkCols - 1, Math.floor((Math.max(x0, x1) + pad) / N));
        const cr0 = Math.max(0, Math.floor((Math.min(y0, y1) - pad) / N));
        const cr1 = Math.min(this.chunkRows - 1, Math.floor((Math.max(y0, y1) + pad) / N));
        for (let cr = cr0; cr <= cr1; cr++) {
          for (let cc = cc0; cc <= cc1; cc++) {
            const idx = cr * this.chunkCols + cc;
            if (seen.has(idx)) continue;
            seen.add(idx);
            const list = this.roadsByChunk.get(idx);
            if (list) list.push(ri); else this.roadsByChunk.set(idx, [ri]);
          }
        }
      }
    });
  }

  /**
   * 신호 교차로 검출 (휴리스틱) — **광폭(w ≥ 4) 도로 2개 이상**이 만나는 정점을 반경 4타일로
   * 클러스터 병합(이중도로 교차부 = 근접 정점 여러 개)한 중심. OSM `highway=traffic_signals`
   * 노드는 파이프라인이 보존하지 않아(빌드 산출물만 저장) 폭 기준으로 추정한다 — 원본 노드
   * 태그 보존은 파이프라인 확장 후보. 회전교차로 복합부(반경+4)는 제외.
   */
  private detectSignals(): void {
    this.signals = [];
    const roads = this.cfg.roads;
    if (!roads) return;
    const cand: [number, number][] = [];
    for (const [k, list] of this.nodeRoads) {
      if (list.length < 2) continue;
      const wide = list.filter((ri) => roads[ri].w >= 4);
      if (wide.length < 2) continue;
      const [xs, ys] = k.split(',').map(Number);
      const x = xs / 10, y = ys / 10;
      if (this.roundabouts.some((ra) => Math.hypot(x - ra.cx, y - ra.cy) < ra.R + 4)) continue;
      cand.push([x, y]);
    }
    const used = new Array(cand.length).fill(false);
    for (let i = 0; i < cand.length; i++) {
      if (used[i]) continue;
      const grp = [cand[i]];
      used[i] = true;
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < cand.length; j++) {
          if (used[j]) continue;
          if (grp.some((g) => Math.hypot(g[0] - cand[j][0], g[1] - cand[j][1]) < 4)) {
            grp.push(cand[j]); used[j] = true; changed = true;
          }
        }
      }
      let cx = 0, cy = 0;
      for (const g of grp) { cx += g[0]; cy += g[1]; }
      cx /= grp.length; cy /= grp.length;
      let spread = 0;
      for (const g of grp) spread = Math.max(spread, Math.hypot(g[0] - cx, g[1] - cy));
      this.signals.push({ x: cx, y: cy, half: Math.max(2.4, spread + 2.0) });
    }
  }

  /** 수동 프롭 목록 교체 (편집기) — 청크 배정 재구성. 상주 청크는 rebakeResident로 갱신 */
  setProps(props: RegionProp[]): void {
    this.cfg.props = props;
    this.propsByChunk.clear();
    const N = this.cfg.chunkTiles;
    for (const p of props) {
      if (p.tx < 0 || p.tx >= this.cfg.cols || p.ty < 0 || p.ty >= this.cfg.rows) continue;
      const idx = Math.floor(p.ty / N) * this.chunkCols + Math.floor(p.tx / N);
      const list = this.propsByChunk.get(idx);
      if (list) list.push(p); else this.propsByChunk.set(idx, [p]);
    }
  }

  /** 도로 벡터 교체 (편집기 도로 툴) — 청크 배정·교차 정점 재색인 + 상주 청크 재베이킹 */
  setRoads(roads: RegionRoad[]): void {
    this.cfg.roads = roads;
    this.indexRoads();
    this.rebakeResident();
  }

  /**
   * 점(타일 좌표)에서 가장 가까운 도로 중심선까지 거리와 그 도로 반폭 — 보도 밴드 판정
   * (보행자 산포 · 리포트 ④: `w` 타일 기준이면 곡선 밴드 안에 서는 경우가 생긴다)
   */
  roadBand(x: number, y: number, chunkIdx: number): { d: number; halfW: number } | null {
    const list = this.roadsByChunk.get(chunkIdx);
    if (!list || !this.cfg.roads) return null;
    let best: { d: number; halfW: number } | null = null;
    for (const ri of list) {
      const rd = this.cfg.roads[ri];
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
        const vx = bx - ax, vy = by - ay;
        const len2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
        const d = Math.hypot(ax + vx * t - x, ay + vy * t - y);
        if (!best || d < best.d) best = { d, halfW: rd.w / 2 };
      }
    }
    return best;
  }

  /** 지붕 오버라이드 교체 (편집기) */
  setRoofOverrides(roofs: Record<string, number>): void {
    this.cfg.roofOverrides = roofs;
  }

  /** 건물 컴포넌트 키 ("c0,r0") — 편집기가 지붕 오버라이드를 걸 때 사용 */
  buildingKeyAt(c: number, r: number): string | null {
    const b = this.buildingBoundsAt(c, r);
    return b ? `${b.c0},${b.r0}` : null;
  }

  /** 건물 컴포넌트 bbox·면적 (POI 건물 스프라이트 앵커용) */
  buildingBoundsAt(c: number, r: number): { c0: number; r0: number; c1: number; r1: number; n: number } | null {
    if (c < 0 || c >= this.cfg.cols || r < 0 || r >= this.cfg.rows) return null;
    const id = this.compOf[r * this.cfg.cols + c];
    if (id < 0) return null;
    const { c0, r0, c1, r1, n } = this.comps[id];
    return { c0, r0, c1, r1, n };
  }

  setReservedBuildings(keys: Set<string>): void {
    this.cfg.reservedBuildingKeys = keys;
  }

  /** 프롭 스프라이트 생성 공용 — 텍스처 미로드면 null (타일셋 미배포 환경 방어) */
  spawnProp(def: PropDef, tx: number, ty: number, slot?: ChunkSlot): Phaser.GameObjects.Image | null {
    if (!this.scene.textures.exists(def.tex)) return null;
    const tr = this.cfg.tr;
    const x = tx * tr + tr / 2;
    const y = def.anchor === 'center' ? ty * tr + tr / 2 : ty * tr + tr;
    const img = this.scene.add.image(x, y, def.tex)
      .setOrigin(0.5, def.anchor === 'center' ? 0.5 : 1)
      .setScale(def.scale ?? 1)
      .setDepth(def.anchor === 'center' ? 5 : 20 + (ty * tr + tr) * 0.001);
    slot?.deco.push(img);
    // 충돌 — 발밑 띠(바닥 앵커) / 전체(중앙 앵커). 청크 walls에 편입해 언로드와 수명을 같이한다
    if (slot && !def.passable) {
      const fp = propFootprint(this.scene, def, tr);
      const bw = Math.max(tr * 0.5, img.displayWidth * 0.85);
      const body = this.scene.add.rectangle(x, def.anchor === 'center' ? y : y - fp.bodyH / 2, bw, fp.bodyH, 0x000000, 0);
      this.scene.physics.add.existing(body, true);
      this.walls.add(body);
      slot.bodies.push(body);
    }
    return img;
  }

  /**
   * 타일 편집 반영 (dev 편집기) — 전역 파생(수심 BFS·건물 라벨)을 재계산하고,
   * 영향 청크(타일의 청크 + 경계 1타일 이웃 청크)의 충돌·프롭을 재구성 + 재베이킹 큐 선두.
   * ⚠ terrainRows는 씬과 공유하는 같은 배열 — 호출측이 행 문자열을 먼저 갱신해야 한다.
   */
  invalidateTiles(tiles: { c: number; r: number }[]): void {
    if (tiles.length === 0) return;
    this.waterDist = this.computeWaterDistance();
    this.openSea = this.computeOpenSea();
    this.islet = this.computeIslets();
    this.compOf.fill(-1);
    this.comps = [];
    this.labelBuildings();
    const N = this.cfg.chunkTiles;
    const affected = new Set<number>();
    for (const { c, r } of tiles) {
      for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const cc = Math.floor((c + dc) / N), cr = Math.floor((r + dr) / N);
        if (cc < 0 || cc >= this.chunkCols || cr < 0 || cr >= this.chunkRows) continue;
        affected.add(cr * this.chunkCols + cc);
      }
    }
    this.rebakeChunks(affected);
  }

  /** 상주 청크 전체 재베이킹 (프롭/지붕 오버라이드 변경 후) */
  rebakeResident(): void {
    this.rebakeChunks(new Set(this.resident.keys()));
  }

  private rebakeChunks(idxs: Set<number>): void {
    for (const idx of idxs) {
      const slot = this.resident.get(idx);
      if (!slot) continue;
      const cc = idx % this.chunkCols, cr = Math.floor(idx / this.chunkCols);
      for (const b of slot.bodies) { this.walls.remove(b); b.destroy(); }
      slot.bodies = [];
      for (const d of slot.deco) d.destroy();
      slot.deco = [];
      for (const k of slot.roofKeys) this.scene.textures.remove(k);
      slot.roofKeys = [];
      this.buildChunkCollision(cc, cr, slot);
      this.buildChunkDeco(cc, cr, slot);
      slot.baked = false;
      if (!this.bakeQueue.includes(idx)) this.bakeQueue.unshift(idx);
    }
  }

  private tileAt(c: number, r: number): string {
    if (c < 0 || c >= this.cfg.cols || r < 0 || r >= this.cfg.rows) return '~';
    return this.cfg.terrainRows[r][c] ?? '.';
  }

  /**
   * 이동 불가(충돌) 타일 — 바다 전부 · 건물은 **풋프린트 하단 2줄만**(탑다운 2.5D 관례 — 101차 후속).
   * 위쪽 줄은 걸어 들어갈 수 있고 지붕 스프라이트(y-sort)가 캐릭터를 가린다.
   */
  private isBlockedAt(c: number, r: number): boolean {
    const ch = this.tileAt(c, r);
    if (ch === '~') return true;
    if (ch !== '#') return false;
    return this.tileAt(c, r + 1) !== '#' || this.tileAt(c, r + 2) !== '#';
  }

  /** 멀티소스 BFS — 비바다 타일에서 바다로 거리 전파 */
  private computeWaterDistance(): Uint16Array {
    // 챔퍼 거리(직교 5·대각 7 ≈ 유클리드) 2패스 — 구 BFS 맨해튼은 마름모 등고선이라 수심
    // 밴드가 큰 직각 계단으로 찍혔다(사용자 리포트 "타일이 부자연스럽게 깔려있어").
    // 반환 단위는 타일(챔퍼/5 반올림) — bucketOf·암초·배 배치 임계는 그대로 유효.
    const { cols, rows } = this.cfg;
    const INF = 0x3fffffff;
    const d = new Int32Array(cols * rows).fill(INF);
    for (let r = 0; r < rows; r++) {
      const line = this.cfg.terrainRows[r];
      for (let c = 0; c < cols; c++) if (line[c] !== '~') d[r * cols + c] = 0;
    }
    for (let r = 0; r < rows; r++) {                     // 전방 패스 (좌상 → 우하)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let v = d[i];
        if (c > 0) v = Math.min(v, d[i - 1] + 5);
        if (r > 0) {
          v = Math.min(v, d[i - cols] + 5);
          if (c > 0) v = Math.min(v, d[i - cols - 1] + 7);
          if (c + 1 < cols) v = Math.min(v, d[i - cols + 1] + 7);
        }
        d[i] = v;
      }
    }
    for (let r = rows - 1; r >= 0; r--) {                // 후방 패스 (우하 → 좌상)
      for (let c = cols - 1; c >= 0; c--) {
        const i = r * cols + c;
        let v = d[i];
        if (c + 1 < cols) v = Math.min(v, d[i + 1] + 5);
        if (r + 1 < rows) {
          v = Math.min(v, d[i + cols] + 5);
          if (c + 1 < cols) v = Math.min(v, d[i + cols + 1] + 7);
          if (c > 0) v = Math.min(v, d[i + cols - 1] + 7);
        }
        d[i] = v;
      }
    }
    const out = new Uint16Array(cols * rows);
    for (let i = 0; i < d.length; i++) out[i] = Math.min(0xffff, Math.round(d[i] / 5));
    return out;
  }

  /** waterDist 경계 안전 조회 — 맵 밖 = 외해 취급 (테트라포드 외해측 판정용) */
  private waterDistAt(c: number, r: number): number {
    if (c < 0 || c >= this.cfg.cols || r < 0 || r >= this.cfg.rows) return 999;
    return this.waterDist[r * this.cfg.cols + c];
  }

  /**
   * 섬/암초 검출 — 바다로 둘러싸인 소형 육지 컴포넌트(≤ 600타일 · 도로/건물 없음 — 조도 등).
   * 포장 광장 톤 대신 갯바위(절차)로 그린다(위성 실사 정합 — 사용자 리포트 7번 캡처).
   */
  /**
   * 외해 마스크 — 맵 경계의 물에서 시작해 **뭍에서 충분히 떨어진 물**(waterDist ≥ OPEN_SEA_MIN)만
   * 타고 4방 확산. 좁은 수로(폭 < 2·OPEN_SEA_MIN)는 중심 waterDist가 문턱에 못 미쳐 통과하지 못하므로
   * 석호(청초호)·항 내측 정온수역이 외해로 새지 않는다.
   *
   * ⚠ 구 판정("바깥 4·7타일 수심 ≥ 5")만으로는 청초호 제방에도 피복이 깔렸다 — 석호가 넓어
   *   조건을 통과했다(실측: 인접 물 75타일 중 41타일 통과). 이 마스크와 AND로 걸러낸다.
   */
  private computeOpenSea(): Uint8Array {
    const { cols, rows } = this.cfg;
    const OPEN_SEA_MIN = 8;
    const m = new Uint8Array(cols * rows);
    const q = new Int32Array(cols * rows);
    let head = 0, tail = 0;
    const push = (c: number, r: number): void => {
      const i = r * cols + c;
      if (m[i] || this.tileAt(c, r) !== '~' || this.waterDist[i] < OPEN_SEA_MIN) return;
      m[i] = 1;
      q[tail++] = i;
    };
    for (let c = 0; c < cols; c++) { push(c, 0); push(c, rows - 1); }
    for (let r = 0; r < rows; r++) { push(0, r); push(cols - 1, r); }
    while (head < tail) {
      const i = q[head++];
      const c = i % cols, r = (i / cols) | 0;
      if (c > 0) push(c - 1, r);
      if (c < cols - 1) push(c + 1, r);
      if (r > 0) push(c, r - 1);
      if (r < rows - 1) push(c, r + 1);
    }
    return m;
  }

  /** 이 물 타일이 섬(갯바위) 둘레 2타일 안인가 — 여(스커리) 산포 판정 */
  private nearIsletAt(c: number, r: number): boolean {
    const { cols, rows } = this.cfg;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        if (this.islet[nr * cols + nc]) return true;
      }
    }
    return false;
  }

  /** 이 타일에서 (dirX,dirY) 바깥으로 뻗은 광선이 외해에 닿는가 (4~12타일) */
  private raysToOpenSea(c: number, r: number, dirX: number, dirY: number): boolean {
    const { cols, rows } = this.cfg;
    for (const k of [4, 6, 8, 10, 12]) {
      const nc = c + dirX * k, nr = r + dirY * k;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (this.openSea[nr * cols + nc]) return true;
    }
    return false;
  }

  private computeIslets(): Uint8Array {
    const { cols, rows } = this.cfg;
    const flag = new Uint8Array(cols * rows);
    const seen = new Uint8Array(cols * rows);
    const qx = new Int32Array(cols * rows);
    const qy = new Int32Array(cols * rows);
    for (let sr = 0; sr < rows; sr++) {
      const line = this.cfg.terrainRows[sr];
      for (let sc = 0; sc < cols; sc++) {
        if (line[sc] === '~' || seen[sr * cols + sc]) continue;
        let head = 0, tail = 0, wild = true;
        qx[tail] = sc; qy[tail] = sr; tail++; seen[sr * cols + sc] = 1;
        const members: number[] = [];
        while (head < tail) {
          const c = qx[head], r = qy[head]; head++;
          const idx = r * cols + c;
          members.push(idx);
          const ch = this.cfg.terrainRows[r][c];
          if (ch === '#' || ch === 'r') wild = false;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
            const ni = nr * cols + nc;
            if (seen[ni] || this.cfg.terrainRows[nr][nc] === '~') continue;
            seen[ni] = 1; qx[tail] = nc; qy[tail] = nr; tail++;
          }
        }
        if (wild && members.length <= 600) for (const i of members) flag[i] = 1;
      }
    }
    return flag;
  }

  /** 건물(#) 연결요소 라벨링 — 컴포넌트 bbox·지붕 팔레트 배정 (전맵 1회) */
  private labelBuildings(): void {
    const { cols, rows } = this.cfg;
    const qx = new Int32Array(cols * rows);
    const qy = new Int32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      const line = this.cfg.terrainRows[r];
      for (let c = 0; c < cols; c++) {
        if (line[c] !== '#' || this.compOf[r * cols + c] !== -1) continue;
        const id = this.comps.length;
        let head = 0, tail = 0, n = 0;
        let c0 = c, c1 = c, r0 = r, r1 = r;
        qx[tail] = c; qy[tail] = r; tail++;
        this.compOf[r * cols + c] = id;
        while (head < tail) {
          const x = qx[head], y = qy[head]; head++;
          n++;
          if (x < c0) c0 = x; if (x > c1) c1 = x;
          if (y < r0) r0 = y; if (y > r1) r1 = y;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            const k = ny * cols + nx;
            if (this.compOf[k] === -1 && this.cfg.terrainRows[ny][nx] === '#') {
              this.compOf[k] = id; qx[tail] = nx; qy[tail] = ny; tail++;
            }
          }
        }
        this.comps.push({
          c0, r0, c1, r1, n,
          palIdx: Math.floor(hash2(this.cfg.seed ^ 0xb17d, c0, r0) * ROOFS.length) % ROOFS.length,
          big: n >= 120,   // 5m/타일 기준 ≥ 3,000㎡ — 창고·터미널급
        });
      }
    }
  }

  /** 프롭 텍스처 1회 베이킹 — 나무 2종 + 편집기 프롭 8종 (전부 절차 도트, 발밑 그림자 포함) */
  private ensureDecoTextures(): void {
    const tex = this.scene.textures;
    const bake = (key: string, W: number, H: number, draw: (g: Phaser.GameObjects.Graphics) => void): void => {
      if (tex.exists(key)) return;
      const g = this.scene.add.graphics();
      draw(g);
      g.generateTexture(key, W, H);
      g.destroy();
    };
    // 침엽수 — 3단 삼각 캐노피
    bake('smx_pine', 36, 54, (g) => {
      g.fillStyle(0x000000, 0.22); g.fillEllipse(18, 50, 22, 7);
      g.fillStyle(0x5a3f26, 1); g.fillRect(15, 38, 6, 12);
      g.fillStyle(0x2f6b3a, 1); g.fillTriangle(18, 2, 4, 26, 32, 26);
      g.fillStyle(0x3b7d45, 1); g.fillTriangle(18, 12, 3, 38, 33, 38);
      g.fillStyle(0x2a5f34, 1); g.fillTriangle(18, 22, 2, 46, 34, 46);
      g.fillStyle(0x62a35c, 0.8); g.fillTriangle(18, 4, 12, 18, 18, 18);
    });
    // 덤불 — 낮은 둥근 클러스터
    bake('smx_bush', 30, 22, (g) => {
      g.fillStyle(0x000000, 0.18); g.fillEllipse(15, 19, 24, 6);
      g.fillStyle(0x3f7a33, 1); g.fillCircle(10, 12, 8); g.fillCircle(20, 12, 8); g.fillCircle(15, 8, 8);
      g.fillStyle(0x62a352, 1); g.fillCircle(12, 8, 4); g.fillCircle(18, 6, 3);
      g.fillStyle(0xe8cf6a, 1); g.fillRect(8, 11, 2, 2); g.fillRect(20, 9, 2, 2);
    });
    // 바위 — 2톤 다각
    bake('smx_rock', 30, 24, (g) => {
      g.fillStyle(0x000000, 0.2); g.fillEllipse(15, 21, 24, 6);
      g.fillStyle(0x6b7078, 1);
      g.fillPoints([{ x: 4, y: 18 }, { x: 7, y: 8 }, { x: 15, y: 3 }, { x: 24, y: 7 }, { x: 27, y: 17 }, { x: 20, y: 20 }, { x: 8, y: 20 }], true);
      g.fillStyle(0x8c929a, 1);
      g.fillPoints([{ x: 8, y: 10 }, { x: 15, y: 5 }, { x: 22, y: 9 }, { x: 16, y: 12 }], true);
      g.fillStyle(0x4d525a, 1); g.fillRect(9, 15, 12, 3);
    });
    // 벤치 — 나무 좌판 + 철제 다리
    bake('smx_bench', 34, 18, (g) => {
      g.fillStyle(0x000000, 0.18); g.fillEllipse(17, 16, 30, 5);
      g.fillStyle(0x3a4048, 1); g.fillRect(5, 8, 3, 8); g.fillRect(26, 8, 3, 8);
      g.fillStyle(0x9a6a3c, 1); g.fillRect(2, 6, 30, 5);
      g.fillStyle(0xb8834a, 1); g.fillRect(2, 6, 30, 2);
      g.fillStyle(0x7a5230, 1); g.fillRect(2, 1, 30, 4);
    });
    // 가로등 — 기둥 + 램프 헤드
    bake('smx_lamp', 18, 40, (g) => {
      g.fillStyle(0x000000, 0.18); g.fillEllipse(9, 37, 12, 4);
      g.fillStyle(0x2a3138, 1); g.fillRect(6, 35, 6, 2); g.fillRect(8, 8, 2, 28);
      g.fillRect(4, 5, 10, 3);
      g.fillStyle(0xfff2b0, 1); g.fillRect(6, 8, 6, 2);
      g.fillStyle(0xffe58a, 0.5); g.fillCircle(9, 9, 5);
    });
    // 화단 — 돌 테두리 + 꽃
    bake('smx_flowerbed', 32, 20, (g) => {
      g.fillStyle(0x6b6f76, 1); g.fillRect(0, 4, 32, 16);
      g.fillStyle(0x5a4530, 1); g.fillRect(3, 7, 26, 10);
      g.fillStyle(0x4f8a3c, 1); g.fillRect(4, 8, 24, 8);
      for (const [x, y, c] of [[6, 9, 0xe85a5a], [12, 12, 0xf2e26a], [18, 8, 0xffffff], [24, 11, 0xe85a5a], [15, 9, 0xd88ae0]] as const) {
        g.fillStyle(c, 1); g.fillRect(x, y, 3, 3);
      }
    });
    // 기념탑 — 석재 기단 + 오벨리스크
    bake('smx_monument', 22, 44, (g) => {
      g.fillStyle(0x000000, 0.2); g.fillEllipse(11, 41, 18, 5);
      g.fillStyle(0x8a8f96, 1); g.fillRect(3, 34, 16, 6);
      g.fillStyle(0xa6abb2, 1); g.fillRect(5, 30, 12, 4);
      g.fillStyle(0xb8bdc4, 1); g.fillRect(8, 6, 6, 24);
      g.fillStyle(0x7d8289, 1); g.fillRect(12, 6, 2, 24);
      g.fillStyle(0xd8dce0, 1); g.fillTriangle(11, 1, 8, 6, 14, 6);
    });
    // 어선 — 선체 + 조타실 (바다 전용)
    // 어선 44×26 (프롭 정의에서 ×2 = 88×52 ≈ 승용차의 2배) — 선체·현측·조타실·마스트·부표
    bake('smx_boat', 44, 26, (g) => {
      g.fillStyle(0x1c3c5c, 0.35); g.fillEllipse(22, 22, 40, 6);
      g.fillStyle(0x1f3a52, 1);
      g.fillPoints([{ x: 1, y: 12 }, { x: 40, y: 12 }, { x: 43, y: 15 }, { x: 36, y: 21 }, { x: 6, y: 21 }], true);
      g.fillStyle(0x2e4a66, 1);
      g.fillPoints([{ x: 2, y: 11 }, { x: 40, y: 11 }, { x: 35, y: 17 }, { x: 7, y: 17 }], true);
      g.fillStyle(0xe8eef2, 1); g.fillRect(4, 9, 34, 3);
      g.fillStyle(0xd8dde2, 1); g.fillRect(6, 11, 28, 2);
      g.fillStyle(0xe8eef2, 1); g.fillRect(22, 2, 11, 8);
      g.fillStyle(0x4a7aa8, 1); g.fillRect(24, 4, 7, 3);
      g.fillStyle(0x8a6a48, 1); g.fillRect(12, 0, 2, 10);
      g.fillStyle(0xd0483c, 1); g.fillRect(6, 13, 14, 2);
      g.fillStyle(0xf2c14e, 1); g.fillRect(30, 13, 4, 3); g.fillRect(36, 13, 4, 3);
    });
    for (let v = 0; v < 2; v++) {
      const key = `smx_tree_${v}`;
      if (tex.exists(key)) continue;
      const W = 40, H = 48;
      const g = this.scene.add.graphics();
      // 발밑 그림자
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(W / 2, H - 4, 26, 8);
      // 트렁크
      g.fillStyle(0x6b4a2e, 1);
      g.fillRect(W / 2 - 3, H - 16, 6, 12);
      g.fillStyle(0x54381f, 1);
      g.fillRect(W / 2 + 1, H - 16, 2, 12);
      // 캐노피 — 겹친 원 클러스터 (픽셀 스텝 느낌은 4px 오프셋 정수 배치로)
      const dark = v === 0 ? 0x3f7a33 : 0x396f3f;
      const mid = v === 0 ? 0x519441 : 0x4a8a4e;
      const light = v === 0 ? 0x6cb054 : 0x63a862;
      g.fillStyle(dark, 1);
      g.fillCircle(W / 2, 20, 15);
      g.fillCircle(W / 2 - 9, 26, 11);
      g.fillCircle(W / 2 + 9, 26, 11);
      g.fillStyle(mid, 1);
      g.fillCircle(W / 2 - 2, 18, 11);
      g.fillCircle(W / 2 + 7, 22, 8);
      g.fillStyle(light, 1);
      g.fillCircle(W / 2 - 6, 14, 6);
      g.fillCircle(W / 2 + 2, 12, 4);
      g.generateTexture(key, W, H);
      g.destroy();
    }
  }

  // ═══════════════════════════════════════════════════
  // 상주 관리 — 카메라 중심 3×3
  // ═══════════════════════════════════════════════════

  update(centerX: number, centerY: number): void {
    const cc = Phaser.Math.Clamp(Math.floor(centerX / this.chunkPx), 0, this.chunkCols - 1);
    const cr = Phaser.Math.Clamp(Math.floor(centerY / this.chunkPx), 0, this.chunkRows - 1);

    const needed = new Set<number>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = cc + dc, nr = cr + dr;
        if (nc >= 0 && nc < this.chunkCols && nr >= 0 && nr < this.chunkRows) {
          needed.add(nr * this.chunkCols + nc);
        }
      }
    }

    for (const [idx, slot] of [...this.resident]) {
      if (needed.has(idx)) continue;
      this.unloadChunk(idx, slot);
    }
    for (const idx of needed) {
      if (this.resident.has(idx)) continue;
      this.loadChunk(idx);
    }

    if (this.bakeQueue.length > 0) {
      const centerIdx = cr * this.chunkCols + cc;
      let pick = this.bakeQueue.indexOf(centerIdx);
      if (pick < 0) pick = 0;
      const idx = this.bakeQueue.splice(pick, 1)[0];
      const slot = this.resident.get(idx);
      if (slot && !slot.baked) this.bakeChunk(idx, slot);
    }
  }

  private loadChunk(idx: number): void {
    const cc = idx % this.chunkCols;
    const cr = Math.floor(idx / this.chunkCols);
    const rt = this.acquireRt();
    rt.setPosition(cc * this.chunkPx, cr * this.chunkPx);
    rt.setVisible(true);
    const slot: ChunkSlot = { rt, baked: false, bodies: [], deco: [], roofKeys: [] };
    this.buildChunkCollision(cc, cr, slot);
    this.buildChunkDeco(cc, cr, slot);
    this.resident.set(idx, slot);
    this.bakeQueue.push(idx);
    this.cfg.onChunkLoad?.(cc, cr);
  }

  private unloadChunk(idx: number, slot: ChunkSlot): void {
    this.resident.delete(idx);
    const qi = this.bakeQueue.indexOf(idx);
    if (qi >= 0) this.bakeQueue.splice(qi, 1);
    // ⚠ 씬 shutdown 중에는 물리 그룹이 먼저 파괴돼 `walls.children`이 없다 — remove 호출 시 크래시
    //   (101차 후속 3 실측: 속초→홈타운 전환에서 "reading 'contains'"). 그룹이 살아 있을 때만 remove.
    const wallsAlive = !!this.walls.children;
    for (const b of slot.bodies) { if (wallsAlive) this.walls.remove(b); b.destroy(); }
    for (const d of slot.deco) d.destroy();
    for (const k of slot.roofKeys) this.scene.textures.remove(k);
    slot.roofKeys = [];
    slot.rt.setVisible(false);
    this.rtPool.push(slot.rt);
    this.cfg.onChunkUnload?.(idx % this.chunkCols, Math.floor(idx / this.chunkCols));
  }

  private acquireRt(): Phaser.GameObjects.RenderTexture {
    const pooled = this.rtPool.pop();
    if (pooled) return pooled;
    this.rtCreated++;
    return this.scene.add.renderTexture(0, 0, this.chunkPx, this.chunkPx)
      .setOrigin(0, 0).setDepth(0);
  }

  // ═══════════════════════════════════════════════════
  // 충돌 — 청크 내부 행 병합 정적 바디
  // ═══════════════════════════════════════════════════
  private buildChunkCollision(cc: number, cr: number, slot: ChunkSlot): void {
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    for (let r = r0; r < r1; r++) {
      let runStart = -1;
      for (let c = c0; c <= c1; c++) {
        const blocked = c < c1 && this.isBlockedAt(c, r);
        if (blocked && runStart < 0) {
          runStart = c;
        } else if (!blocked && runStart >= 0) {
          const runLen = c - runStart;
          const rect = this.scene.add.rectangle(
            runStart * tr + (runLen * tr) / 2, r * tr + tr / 2,
            runLen * tr, tr, 0x000000, 0,
          );
          this.scene.physics.add.existing(rect, true);
          this.walls.add(rect);
          slot.bodies.push(rect);
          runStart = -1;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 지붕 — 건물 컴포넌트 단위 스프라이트 (y-sort — 캐릭터가 위쪽 줄로 들어가면 가려진다)
  // ═══════════════════════════════════════════════════
  /** 컴포넌트 지붕 텍스처 베이크 (청크 상주 중에만 존재 — 언로드 시 제거) */
  private bakeRoofTexture(compId: number): string {
    const comp = this.comps[compId];
    const key = `roof_${comp.c0}_${comp.r0}`;
    if (this.scene.textures.exists(key)) return key;
    const tr = this.cfg.tr;
    const cols = this.cfg.cols;
    const W = (comp.c1 - comp.c0 + 1) * tr, H = (comp.r1 - comp.r0 + 1) * tr;
    const g = this.scene.add.graphics();
    const ov = this.cfg.roofOverrides?.[`${comp.c0},${comp.r0}`];
    const [lightC, darkC, ridgeC, wallC] = ROOFS[(ov ?? comp.palIdx) % ROOFS.length];
    const wide = (comp.c1 - comp.c0) >= (comp.r1 - comp.r0);
    const mid = wide ? (comp.r0 + comp.r1) / 2 : (comp.c0 + comp.c1) / 2;
    const isMine = (c: number, r: number): boolean =>
      c >= 0 && c < cols && r >= 0 && r < this.cfg.rows && this.compOf[r * cols + c] === compId;
    for (let r = comp.r0; r <= comp.r1; r++) {
      for (let c = comp.c0; c <= comp.c1; c++) {
        if (!isMine(c, r)) continue;
        const lx = (c - comp.c0) * tr, ly = (r - comp.r0) * tr;
        const checker = (c + r) % 2 === 0;
        if (comp.big) {
          const [pa, pb, seam] = ROOF_BIG;
          g.fillStyle((wide ? r % 2 : c % 2) === 0 ? pa : pb, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(seam, 0.8);
          if (wide) { if ((c - comp.c0) % 3 === 0) g.fillRect(lx, ly, 2, tr); }
          else if ((r - comp.r0) % 3 === 0) g.fillRect(lx, ly, tr, 2);
          if (hash2(this.cfg.seed, c, r) > 0.96) { g.fillStyle(0xa8c4d8, 0.9); g.fillRect(lx + 8, ly + 9, 12, 9); }
        } else {
          const pos = wide ? r : c;
          g.fillStyle(pos <= mid ? lightC : darkC, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(pos <= mid ? darkC : lightC, 0.25);
          if (wide) { g.fillRect(lx, ly + (checker ? 8 : 20), tr, 2); }
          else g.fillRect(lx + (checker ? 8 : 20), ly, 2, tr);
          g.fillStyle(ridgeC, 1);
          if (wide) { if (Math.abs(pos - mid) < 0.6) g.fillRect(lx, ly + tr / 2 - 2, tr, 5); }
          else if (Math.abs(pos - mid) < 0.6) g.fillRect(lx + tr / 2 - 2, ly, 5, tr);
        }
        // 하단 줄 = 외벽 띠 (정면 벽 — 문/창 힌트)
        if (!isMine(c, r + 1)) {
          g.fillStyle(wallC, 1);
          g.fillRect(lx, ly + tr - 10, tr, 10);
          g.fillStyle(0x2a2f36, 0.9);
          g.fillRect(lx, ly + tr - 10, tr, 2);
          if ((c + r) % 3 === 0) { g.fillStyle(0x9fd0e4, 0.8); g.fillRect(lx + 10, ly + tr - 7, 10, 5); }
        }
        // 처마 외곽선
        g.lineStyle(2, COL.buildEdge, 1);
        if (!isMine(c - 1, r)) g.lineBetween(lx + 1, ly, lx + 1, ly + tr);
        if (!isMine(c + 1, r)) g.lineBetween(lx + tr - 1, ly, lx + tr - 1, ly + tr);
        if (!isMine(c, r - 1)) g.lineBetween(lx, ly + 1, lx + tr, ly + 1);
        if (!isMine(c, r + 1)) g.lineBetween(lx, ly + tr - 1, lx + tr, ly + tr - 1);
      }
    }
    g.generateTexture(key, W, H);
    g.destroy();
    return key;
  }

  /**
   * Kenney 건물 키트로 컴포넌트를 채운 RenderTexture (101차 후속 4 — "건물 타일을 지붕 있는 건물처럼").
   *  위쪽 줄 = 지붕 오토타일(3×3 부위 — 이웃 소속으로 nw/n/ne/w/in/e/sw/s/se) + 환기구 변형
   *  하단 2줄(= 충돌 줄) = 벽 모듈(창문 포함, 4칸 반복) + 중앙 하단 문
   *  색 = palIdx % 4 → red/gray/light/tan, 벽은 지붕색 정합. 대형(big)은 light 지붕 + 유리벽.
   */
  private buildKitRoof(compId: number): Phaser.GameObjects.RenderTexture {
    const comp = this.comps[compId];
    const tr = this.cfg.tr, cols = this.cfg.cols;
    const W = (comp.c1 - comp.c0 + 1) * tr, H = (comp.r1 - comp.r0 + 1) * tr;
    const ov = this.cfg.roofOverrides?.[`${comp.c0},${comp.r0}`];
    const colorIdx = comp.big ? 2 : (ov ?? comp.palIdx) % 4;
    const color = ['red', 'gray', 'light', 'tan'][colorIdx];
    const wall = comp.big ? 'glass' : ['brick_red', 'brick_gray', 'white', 'brick_tan'][colorIdx];
    const isMine = (c: number, r: number): boolean =>
      c >= 0 && c < cols && r >= 0 && r < this.cfg.rows && this.compOf[r * cols + c] === compId;
    const rt = this.scene.add.renderTexture(comp.c0 * tr, comp.r0 * tr, W, H).setOrigin(0, 0);
    rt.beginDraw();
    let doorCol = -1;
    // 소형 컴포넌트(높이 ≤ 2줄 또는 ≤ 3타일) = 창고/헛간 — 벽 모듈·문 없이 지붕만 (리포트 5.2 "깨진 건물")
    const tiny = (comp.r1 - comp.r0 + 1) <= 2 || comp.n <= 3;
    /** 대각 스텝의 45° 컷 처마선 (endDraw 후 Graphics로 긋는다) */
    const cutLines: [number, number, number, number][] = [];
    /**
     * 대각 스텝 코너 = 사각 코너 셀 대신 45° 클립 'in' 셀 (101차 잔여 "대각 건물 지붕 코너 셀").
     * 런 판정: 코너의 능선 방향 양쪽 대각 이웃이 **모두 지붕**이면 계단형(대각 벽) 스텝이다 —
     * 직사각형 모서리는 양쪽 대각이 밖이라 사각 코너를 유지한다. 남쪽 코너(sw/se)는 벽 모듈
     * 줄과 얽히는 일반 건물에선 컷하지 않는다(tiny만 허용).
     */
    const diagCut = (part: string, c: number, r: number, lx: number, ly: number, allowS: boolean): boolean => {
      const tm = this.scene.textures;
      if (part === 'ne' || part === 'sw') {
        if (part === 'sw' && !allowS) return false;
        if (!isMine(c - 1, r - 1) || !isMine(c + 1, r + 1)) return false;
        const tk = `kit_roof_${color}_tri_${part === 'ne' ? 'sw' : 'ne'}`;
        if (!tm.exists(tk)) return false;
        rt.batchDraw(tk, lx, ly);
        cutLines.push([lx, ly, lx + tr, ly + tr]);
        return true;
      }
      if (part === 'nw' || part === 'se') {
        if (part === 'se' && !allowS) return false;
        if (!isMine(c + 1, r - 1) || !isMine(c - 1, r + 1)) return false;
        const tk = `kit_roof_${color}_tri_${part === 'nw' ? 'se' : 'nw'}`;
        if (!tm.exists(tk)) return false;
        rt.batchDraw(tk, lx, ly);
        cutLines.push([lx + tr, ly, lx, ly + tr]);
        return true;
      }
      return false;
    };
    for (let r = comp.r0; r <= comp.r1; r++) {
      for (let c = comp.c0; c <= comp.c1; c++) {
        if (!isMine(c, r)) continue;
        const lx = (c - comp.c0) * tr, ly = (r - comp.r0) * tr;
        const below1 = isMine(c, r + 1) && !tiny, below2 = isMine(c, r + 2) && !tiny;
        if (tiny) {
          const n = !isMine(c, r - 1), w = !isMine(c - 1, r), e = !isMine(c + 1, r), s = !isMine(c, r + 1);
          let part = 'in';
          if (n && w) part = 'nw'; else if (n && e) part = 'ne'; else if (s && w) part = 'sw'; else if (s && e) part = 'se';
          else if (n) part = 'n'; else if (s) part = 's'; else if (w) part = 'w'; else if (e) part = 'e';
          if (!diagCut(part, c, r, lx, ly, true)) rt.batchDraw(`kit_roof_${color}_${part}`, lx, ly);
          continue;
        }
        // 벽 모듈은 **컴포넌트 bbox 최하단 2줄**에만 — 계단형(대각) 풋프린트에서 열마다 벽을 깔면
        // 벽돌이 계단을 따라 번진다(실렌더 확인). 위쪽 계단은 지붕 남쪽 가장자리 부위로.
        if (!below1 && r === comp.r1) {                        // 벽 아래 행
          rt.batchDraw(`kit_wall_${wall}_${4 + ((c - comp.c0) % 4)}`, lx, ly);
          if (doorCol < 0 && c >= (comp.c0 + comp.c1) / 2) doorCol = c;
          continue;
        }
        if (r === comp.r1 - 1 && below1 && !below2) {           // 벽 위 행 (2줄 벽 — 충돌 줄과 일치)
          rt.batchDraw(`kit_wall_${wall}_${(c - comp.c0) % 4}`, lx, ly);
          continue;
        }
        const n = !isMine(c, r - 1), w = !isMine(c - 1, r), e = !isMine(c + 1, r);
        const s = !below1 || (r === comp.r1 - 2 && below1 && !isMine(c, r + 3));   // 벽 위 = 지붕 남쪽 가장자리
        let part = 'in';
        if (n && w) part = 'nw'; else if (n && e) part = 'ne'; else if (s && w) part = 'sw'; else if (s && e) part = 'se';
        else if (n) part = 'n'; else if (s) part = 's'; else if (w) part = 'w'; else if (e) part = 'e';
        else if (hash2(this.cfg.seed ^ 0x9e, c, r) > 0.93) part = 'vent';
        // 인테리어 = 2×2 옥상 패널 타일링 (101차 잔여 "지붕 Kenney 타일링") — 완전 내부 블록에만 성기게.
        //  블록 4타일이 전부 내부(사방 지붕 + 벽/남쪽 가장자리 줄 밖)여야 조각나지 않는다.
        if (part === 'in' || part === 'vent') {
          const pc = c & ~1, pr = r & ~1;
          const ph = hash2(this.cfg.seed ^ 0x50a1, pc, pr);
          if (ph > 0.7) {
            let ok = true;
            for (let rr = pr; rr < pr + 2 && ok; rr++) {
              for (let cc = pc; cc < pc + 2 && ok; cc++) {
                ok = rr < comp.r1 - 2 && isMine(cc, rr) && isMine(cc, rr - 1) && isMine(cc, rr + 1)
                  && isMine(cc - 1, rr) && isMine(cc + 1, rr);
              }
            }
            if (ok) {
              const pk = ph > 0.85 ? 'p2' : 'p1';
              part = `${pk}_${r === pr ? (c === pc ? 'nw' : 'ne') : (c === pc ? 'sw' : 'se')}`;
            }
          }
        }
        if (!diagCut(part, c, r, lx, ly, false)) rt.batchDraw(`kit_roof_${color}_${part}`, lx, ly);
      }
    }
    rt.endDraw();
    // 문(중앙 하단) + 대각 컷 처마선 — Graphics 1회 드로우
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    if (doorCol >= 0 && !tiny) {
      const lx = (doorCol - comp.c0) * tr, ly = (comp.r1 - comp.r0) * tr;
      g.fillStyle(0x2a2f36, 1); g.fillRect(lx + 9, ly + 10, 14, tr - 10);
      g.fillStyle(0x6b4a30, 1); g.fillRect(lx + 10, ly + 11, 12, tr - 12);
      g.fillStyle(0xe8c86a, 1); g.fillRect(lx + 19, ly + 22, 2, 2);
    }
    g.lineStyle(2, COL.buildEdge, 1);
    for (const [x1, y1, x2, y2] of cutLines) g.lineBetween(x1, y1, x2, y2);
    rt.draw(g, 0, 0);
    g.destroy();
    return rt;
  }

  /** 청크가 소유하는(좌상단 포함) 컴포넌트의 지붕 스프라이트 생성 */
  private buildChunkRoofs(cc: number, cr: number, slot: ChunkSlot): void {
    const N = this.cfg.chunkTiles, tr = this.cfg.tr;
    for (let id = 0; id < this.comps.length; id++) {
      const comp = this.comps[id];
      if (Math.floor(comp.c0 / N) !== cc || Math.floor(comp.r0 / N) !== cr) continue;
      const bottomY = (comp.r1 + 1) * tr;
      const depth = 20 + bottomY * 0.001;   // 플레이어(20 + y·0.001)와 y-sort — 위쪽 줄 진입 시 가림
      if (this.kitReady) {
        slot.deco.push(this.buildKitRoof(id).setDepth(depth));
      } else {
        const key = this.bakeRoofTexture(id);
        slot.deco.push(this.scene.add.image(comp.c0 * tr, comp.r0 * tr, key).setOrigin(0, 0).setDepth(depth));
        slot.roofKeys.push(key);
      }
      // 소형 주거 풋프린트(4~6 × 5~8) = TopDown 주택 오브젝트(×2 = 140×168) 얹기 — POI 예약 제외
      const w = comp.c1 - comp.c0 + 1, h = comp.r1 - comp.r0 + 1;
      const key = `${comp.c0},${comp.r0}`;
      if (!comp.big && w >= 4 && w <= 6 && h >= 5 && h <= 8 && !this.cfg.reservedBuildingKeys?.has(key)) {
        const hv = hash2(this.cfg.seed ^ 0x40e, comp.c0, comp.r0);
        if (hv < 0.6) {
          const tex = hv < 0.3 ? 'ts_td_house_red' : 'ts_td_house_blue';
          if (this.scene.textures.exists(tex)) {
            const x = ((comp.c0 + comp.c1 + 1) / 2) * tr;
            slot.deco.push(this.scene.add.image(x, bottomY, tex).setOrigin(0.5, 1).setScale(2).setDepth(depth + 0.0003));
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 프롭 스프라이트 (L3) — 나무: 잔디 위 결정적 산포, y-sort (플레이어와 동일식)
  // ═══════════════════════════════════════════════════
  private buildChunkDeco(cc: number, cr: number, slot: ChunkSlot): void {
    this.buildChunkRoofs(cc, cr, slot);
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    const seed = this.cfg.seed ^ 0x7ee5;
    const def = (id: string): PropDef | undefined => PROP_DEFS.find((d) => d.id === id);
    const hasTs = this.scene.textures.exists('ts_td_tree_big');

    // ── 자동 나무 산포 (잔디) — 타일셋 나무 3종 + 해변 인접은 야자수 ──
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        if (this.tileAt(c, r) !== ',') continue;
        if (hash2(seed, c, r) < 0.982) continue;
        let clear = true;
        for (let dr = -1; dr <= 1 && clear; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const t = this.tileAt(c + dc, r + dr);
            if (t === '#' || t === 'r' || t === '~') { clear = false; break; }
          }
        }
        if (!clear) continue;
        const v = hash2(seed ^ 0x11, c, r);
        let id = v < 0.55 ? 'tree' : v < 0.8 ? 'tree2' : 'pine';
        // 모래사장 3타일 이내 = 야자수
        for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) if (this.tileAt(c + dc, r + dr) === 's') id = 'palm';
        const d = def(id);
        if (hasTs && d) this.spawnProp(d, c, r, slot);
        else {
          const x = c * tr + tr / 2, y = r * tr + tr;
          slot.deco.push(this.scene.add.image(x, y, `smx_tree_${v < 0.5 ? 0 : 1}`).setOrigin(0.5, 1).setDepth(20 + y * 0.001));
        }
      }
    }

    // ── 고층 프리팹 — 대형 건물 컴포넌트(≥ 60타일)에 Gemini 빌딩 파사드 (POI 예약 건물 제외) ──
    if (hasTs) {
      for (const comp of this.comps) {
        if (comp.n < 60) continue;
        const key = `${comp.c0},${comp.r0}`;
        if (this.cfg.reservedBuildingKeys?.has(key)) continue;
        // 컴포넌트는 좌상단이 속한 청크가 소유 (중복 생성 방지)
        if (Math.floor(comp.c0 / N) !== cc || Math.floor(comp.r0 / N) !== cr) continue;
        const idx = 1 + (Math.floor(hash2(seed ^ 0xb1d, comp.c0, comp.r0) * 5) % 5);
        const tex = `ts_gem_building_${idx}`;
        if (!this.scene.textures.exists(tex)) continue;
        const x = ((comp.c0 + comp.c1 + 1) / 2) * tr;
        const y = (comp.r1 + 1) * tr;
        // 파사드는 같은 y-sort 층의 지붕보다 위 (+0.0005)
        slot.deco.push(this.scene.add.image(x, y, tex).setOrigin(0.5, 1).setDepth(20 + y * 0.001 + 0.0005));
      }
    }

    // ── 보행자 NPC — **보도 밴드 거리 판정**(도로 반폭+0.25 ~ 반폭+0.95타일) 위 결정적 산포
    //    (상인 제외 4종 · 충돌 있음). `w` 타일 기준은 곡선 밴드 안에 서는 경우가 있었다(리포트 ④) ──
    if (hasTs) {
      const kinds = ['npc_police', 'npc_grandfather', 'npc_father_kid', 'npc_tourist_f'];
      const chunkIdx = cr * this.chunkCols + cc;
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const ch = this.tileAt(c, r);
          if (ch !== 'w' && ch !== '.') continue;
          const hv = hash2(seed ^ 0x9c, c, r);
          if (hv < 0.985) continue;
          const band = this.roadBand(c + 0.5, r + 0.9, chunkIdx);
          if (!band || band.d < band.halfW + 0.25 || band.d > band.halfW + 0.95) continue;
          const d = def(kinds[Math.floor(hash2(seed ^ 0x9d, c, r) * kinds.length) % kinds.length]);
          if (d) this.spawnProp(d, c, r, slot);
        }
      }
    }

    // ── 주차 차량 — 도로가 아니라 **건물 옆 맨땅**("가게 옆에 주차"). 건물에 붙은 '.' 타일 중 도로 밴드 밖,
    //    건물 벽과 나란히(북/남 벽 = 세로 주차, 동/서 벽 = 가로 주차). 픽업트럭 포함, 충돌 있음 ──
    if (hasTs) {
      const chunkIdx = cr * this.chunkCols + cc;
      const kinds: [string, string][] = [['car', 'blue'], ['car', 'green'], ['car', 'red'], ['pickup', 'blue'], ['pickup', 'green'], ['pickup', 'red']];
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          if (this.tileAt(c, r) !== '.') continue;
          const bN = this.tileAt(c, r - 1) === '#', bS = this.tileAt(c, r + 1) === '#';
          const bW = this.tileAt(c - 1, r) === '#', bE = this.tileAt(c + 1, r) === '#';
          if (!(bN || bS || bW || bE)) continue;
          if (hash2(seed ^ 0xca7, c, r) > 0.03) continue;
          // 2×2 여유(차 길이) + 도로 밴드 밖
          const band = this.roadBand(c + 0.5, r + 0.5, chunkIdx);
          if (band && band.d < band.halfW + 1.6) continue;
          const vertical = bN || bS;
          const okNeighbor = vertical ? this.tileAt(c, r + (bN ? 1 : -1)) === '.' : this.tileAt(c + (bW ? 1 : -1), r) === '.';
          if (!okNeighbor) continue;
          const [kind, color] = kinds[Math.floor(hash2(seed ^ 0xc4, c, r) * kinds.length) % kinds.length];
          // 3/4 시점 스프라이트는 회전하지 않는다 — 벽 방향에 맞는 프레임: 북/남 벽 = 후면·정면, 동/서 벽 = 측면
          const dir = bN ? 'up' : bS ? 'down' : bW ? 'right' : 'left';
          const tex = `ts_td_${kind}_${color}_${dir}`;
          if (!this.scene.textures.exists(tex)) continue;
          this.spawnProp({ id: `park_${kind}`, label: '주차 차량', tex, cat: '차량', scale: 1.25 }, c, vertical ? r + (bN ? 1 : 0) : r, slot);
        }
      }
    }

    // ── 신호등 — 신호 교차로(detectSignals) 박스의 대각 모서리 2곳(NE·SW). 모서리 타일이 속한
    //    청크가 배치(경계 교차로 중복 방지) · 바다/건물 타일 위는 생략 ──
    if (hasTs) {
      const dTraffic = def('traffic');
      if (dTraffic) {
        for (const sg of this.signals) {
          // 4모서리 × 바깥 물림(0.5/1.5/2.5) 후보 중 도로/바다/건물이 아닌 곳 최대 2곳 —
          // 대형 클러스터 교차로는 대각 모서리까지 차도라 고정 2모서리로는 자리가 안 나온다(실측)
          let placed = 0;
          for (const [sx, sy] of [[1, -1], [-1, 1], [-1, -1], [1, 1]] as [number, number][]) {
            if (placed >= 2) break;
            for (const ext of [0.5, 1.5, 2.5]) {
              const px = sg.x + sx * (sg.half + ext), py = sg.y + sy * (sg.half + ext);
              const tc = Math.floor(px), trw = Math.floor(py);
              const t = this.tileAt(tc, trw);
              if (t === '~' || t === '#' || t === 'r') continue;
              placed++;
              // 배치는 모서리 타일이 속한 청크만 (경계 교차로 중복 방지 — placed 카운트는
              // 결정적이라 어느 청크에서 세도 같은 후보가 뽑힌다)
              if (Math.floor(tc / N) === cc && Math.floor(trw / N) === cr) this.spawnProp(dTraffic, tc, trw, slot);
              break;
            }
          }
        }
      }
    }

    // ── 수동 프롭 (patch.json — 편집기 배치) ──
    const manual = this.propsByChunk.get(cr * this.chunkCols + cc);
    if (manual) {
      for (const p of manual) {
        const d = def(p.id);
        if (!d) continue;
        this.spawnProp(d, p.tx, p.ty, slot);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 시각 베이킹 (L1) — 절차 텍스처. 프레임당 1청크
  // ═══════════════════════════════════════════════════
  /**
   * 차도 마킹 — 벡터 폴리라인 기준 (101차 — 타일 휴리스틱 폐기: 대각선 도로 대응).
   *  중앙선 = **노란 실선**(폭 ≥ 2타일 = 왕복 2차로 이상 시내도로 관례),
   *  차선 = **흰 점선**(방향당 2차로 이상일 때 ±3.5m 간격),
   *  가장자리 = 흰 실선(폭 ≥ 3타일). 세그먼트별 법선 오프셋 — 꺾임부 미터 조인은 생략.
   */
  /**
   * 폴리라인을 법선 방향으로 off(타일)만큼 평행 이동 — 정점에서는 인접 법선의 평균(미터 조인,
   * 예각 폭주 방지 클램프)으로 **연속된** 오프셋 선을 만든다 (세그먼트별 오프셋은 정점마다 끊겼다).
   */
  private static offsetPolyline(pts: [number, number][], off: number): [number, number][] {
    const n = pts.length;
    const out: [number, number][] = [];
    const segN: [number, number][] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy) || 1;
      segN.push([-dy / len, dx / len]);
    }
    for (let i = 0; i < n; i++) {
      const a = segN[Math.max(0, i - 1)], b = segN[Math.min(n - 2, i)];
      let nx = a[0] + b[0], ny = a[1] + b[1];
      const l = Math.hypot(nx, ny);
      if (l < 1e-6) { nx = b[0]; ny = b[1]; }
      else {
        nx /= l; ny /= l;
        // 미터 길이 = off / cos(θ/2) — 예각에서 폭주하지 않게 2배로 클램프
        const cosHalf = Math.max(0.5, nx * b[0] + ny * b[1]);
        nx /= cosHalf; ny /= cosHalf;
      }
      out.push([pts[i][0] + nx * off, pts[i][1] + ny * off]);
    }
    return out;
  }

  /**
   * 차도·보도 밴드 — 벡터 폴리라인을 굵은 선으로 청크에 직접 그린다 (101차 후속 5 — 리포트 5.3).
   *  래스터 'r'/'w' 타일은 걷기·충돌·스폰 판정에만 쓰고, 그림은 곡선 그대로: 보도 = (폭+2타일) 회색 밴드,
   *  아스팔트 = 폭 타일 밴드. 정점마다 원을 찍어 라운드 조인(꺾임부 쐐기 틈 방지). 모든 도로의 보도를 먼저,
   *  아스팔트를 나중에 그려 교차부가 자연히 합쳐진다. 연석 = 아스팔트 가장자리 2px.
   */
  private drawRoadBands(g: Phaser.GameObjects.Graphics, idx: number, c0: number, r0: number): void {
    const list = this.roadsByChunk.get(idx);
    if (!list || !this.cfg.roads) return;
    const tr = this.cfg.tr;
    const lx = (x: number): number => (x - c0) * tr;
    const ly = (y: number): number => (y - r0) * tr;
    const band = (road: RegionRoad, widthTiles: number, color: number): void => {
      const w = widthTiles * tr;
      g.lineStyle(w, color, 1);
      g.fillStyle(color, 1);
      for (let i = 0; i < road.pts.length - 1; i++) {
        g.lineBetween(lx(road.pts[i][0]), ly(road.pts[i][1]), lx(road.pts[i + 1][0]), ly(road.pts[i + 1][1]));
      }
      for (const p of road.pts) g.fillCircle(lx(p[0]), ly(p[1]), w / 2);
    };
    for (const ri of list) { const rd = this.cfg.roads[ri]; if (rd.pts.length >= 2) band(rd, rd.w + 2, COL.walk); }
    // 보도 결 — 밴드 위 격자 힌트는 생략(곡선에 격자를 억지로 맞추면 5.1의 "표 테두리" 문제가 재발)
    for (const ri of list) { const rd = this.cfg.roads[ri]; if (rd.pts.length >= 2) band(rd, rd.w + 0.14, COL.curb); }
    for (const ri of list) { const rd = this.cfg.roads[ri]; if (rd.pts.length >= 2) band(rd, rd.w, COL.road); }
    // 회전교차로 중앙 교통섬 — 링 폴리라인의 중심·반경에서 연석 → 흙 테 → 잔디 (규범도: 원형 차로 + 중앙섬)
    for (const ri of list) {
      const rd = this.cfg.roads[ri];
      if (!rd.roundabout || rd.pts.length < 6) continue;
      let cx = 0, cy = 0;
      for (const p of rd.pts) { cx += p[0]; cy += p[1]; }
      cx /= rd.pts.length; cy /= rd.pts.length;
      let R = 0;
      for (const p of rd.pts) R += Math.hypot(p[0] - cx, p[1] - cy);
      R /= rd.pts.length;
      const island = R - rd.w / 2 - 0.12;
      if (island < 0.6) continue;
      g.fillStyle(COL.curb, 1); g.fillCircle(lx(cx), ly(cy), (island + 0.16) * tr);
      g.fillStyle(0x8a6a48, 1); g.fillCircle(lx(cx), ly(cy), island * tr);
      g.fillStyle(COL.grass, 1); g.fillCircle(lx(cx), ly(cy), Math.max(0.3, island - 0.4) * tr);
      g.fillStyle(COL.grassDark, 0.6);
      for (let k = 0; k < 6; k++) {
        const a = k * 1.047 + 0.3;
        g.fillRect(lx(cx) + Math.cos(a) * (island - 0.8) * tr, ly(cy) + Math.sin(a) * (island - 0.8) * tr, 4, 3);
      }
    }
    // 아스팔트 질감 — 밴드 안(차도 타일) 결정적 미세 반점 (Kenney 아스팔트는 거의 무지라 아주 성기게)
    const N = this.cfg.chunkTiles;
    for (let r = r0; r < Math.min(r0 + N, this.cfg.rows); r++) {
      for (let c = c0; c < Math.min(c0 + N, this.cfg.cols); c++) {
        if (this.tileAt(c, r) !== 'r') continue;
        const h = hash2(this.cfg.seed ^ 0xa5f, c, r), h2 = hash2(this.cfg.seed ^ 0xa60, c, r);
        if (h < 0.55) continue;
        g.fillStyle(h2 > 0.5 ? COL.roadSpeck : COL.roadAlt, 0.9);
        g.fillRect((c - c0) * tr + 4 + Math.floor(h * 20), (r - r0) * tr + 4 + Math.floor(h2 * 20), 2, 2);
        if (h > 0.9) g.fillRect((c - c0) * tr + 3 + Math.floor(h2 * 22), (r - r0) * tr + 14 + Math.floor(h * 10), 3, 1);
      }
    }
  }

  /**
   * 도로 마킹용 폴리라인 분할 — **교차 정점**(다른 도로가 지나는 정점)에서 잘라 조각마다 그 정점에서
   * "다른 도로 반폭 + 0.4타일"만큼 물러난다 → 교차부 안에는 마킹이 없고(교차로 박스), 마킹끼리 관통하지 않는다
   * (리포트 4). 막다른 끝은 자르지 않는다. 반환 = 조각 배열(각 조각은 원본 정점 복사본).
   */
  private markingPieces(road: RegionRoad, roadIdx: number): { pts: [number, number][]; cutStart: boolean; cutEnd: boolean; startNode?: [number, number]; endNode?: [number, number] }[] {
    const pts = road.pts;
    const pieces: { pts: [number, number][]; cutStart: boolean; cutEnd: boolean; startNode?: [number, number]; endNode?: [number, number] }[] = [];
    let cur: [number, number][] = [];
    let curCutStart = false;
    let curStartNode: [number, number] | undefined;
    const halfW = road.w / 2;
    const otherHalf = (p: [number, number]): number => {
      let m = 0;
      for (const o of this.nodeRoads.get(this.nodeKey(p)) ?? []) if (o !== roadIdx) m = Math.max(m, this.cfg.roads![o].w / 2);
      return m;
    };
    const trimTo = (a: [number, number], b: [number, number], amount: number): [number, number] => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      if (len <= amount + 0.3) return b;   // 조각이 너무 짧으면 그 끝까지만 (다음 단계에서 버려짐)
      return [a[0] + (dx / len) * amount, a[1] + (dy / len) * amount];
    };
    for (let i = 0; i < pts.length; i++) {
      const p: [number, number] = [pts[i][0], pts[i][1]];
      const junction = otherHalf(p) > 0;
      if (!junction) { cur.push(p); continue; }
      const inset = Math.max(halfW * 0.6, otherHalf(p)) + 0.4;
      // 정점 앞 조각 마감 — 정점에서 inset만큼 물러난 점으로 끝냄
      if (cur.length > 0) {
        const last = cur[cur.length - 1];
        const end = trimTo(p, last, inset);
        if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.3) cur.push(end);
        if (cur.length >= 2) pieces.push({ pts: cur, cutStart: curCutStart, cutEnd: true, startNode: curStartNode, endNode: p });
      }
      cur = [];
      curCutStart = true;
      curStartNode = p;
      // 정점 뒤 조각 시작 — 다음 정점 방향으로 inset만큼 물러난 점부터
      if (i < pts.length - 1) {
        const start = trimTo(p, [pts[i + 1][0], pts[i + 1][1]], inset);
        cur.push(start);
      }
    }
    if (cur.length >= 2) pieces.push({ pts: cur, cutStart: curCutStart, cutEnd: false, startNode: curStartNode });
    return pieces.filter((pc) => {
      let len = 0;
      for (let i = 0; i < pc.pts.length - 1; i++) len += Math.hypot(pc.pts[i + 1][0] - pc.pts[i][0], pc.pts[i + 1][1] - pc.pts[i][1]);
      return len >= 1.2;
    });
  }

  /**
   * 횡단보도 + 정지선 (리포트 ②) — 벡터: 조각의 교차부 쪽 끝에서 도로 폭을 가로질러 흰 줄무늬.
   *  base = 조각 끝점, u = 교차부 방향 단위벡터. 줄무늬는 연석 안쪽(반폭 − 0.3)에서 반대쪽 연석까지 직선,
   *  깊이 0.6타일, 정지선은 그 앞 4px. 폭 ≥ 3타일 도로만.
   */
  private drawCrosswalk(
    g: Phaser.GameObjects.Graphics, base: [number, number], u: [number, number], halfW: number,
    c0: number, r0: number, drawn: [number, number][][], mode: 'stop' | 'yield' | 'yield_only',
  ): void {
    const tr = this.cfg.tr;
    const nx = -u[1], ny = u[0];
    const inner = halfW - 0.3;
    const depth = 0.6;
    const stripe = 0.32, gapS = 0.22;
    // 회전교차로 진입부 — 양보선(흰 점선)을 정점 쪽에, 횡단보도는 1타일 뒤로 물린다 (규범도).
    // yield_only = 복합부 안(반경+2.5) — 양보선만
    if (mode === 'yield_only') {
      g.lineStyle(3, COL.roadLine, 0.9);
      for (let s = 0.05; s < inner; s += 0.36) {
        const ax = base[0] + nx * s, ay = base[1] + ny * s, bx = base[0] + nx * Math.min(inner, s + 0.2), by = base[1] + ny * Math.min(inner, s + 0.2);
        g.lineBetween((ax - c0) * tr, (ay - r0) * tr, (bx - c0) * tr, (by - r0) * tr);
      }
      return;
    }
    const cwBase: [number, number] = mode === 'yield' ? [base[0] - u[0] * 1.0, base[1] - u[1] * 1.0] : base;
    const inside = (q: [number, number], poly: [number, number][]): boolean => {
      let sign = 0;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const cr = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
        if (Math.abs(cr) < 1e-9) continue;
        if (sign === 0) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) return false;
      }
      return true;
    };
    g.fillStyle(COL.crosswalk, 0.92);
    const quad = (s: number, w: number): [number, number][] => [
      [cwBase[0] + nx * s, cwBase[1] + ny * s],
      [cwBase[0] + nx * (s + w), cwBase[1] + ny * (s + w)],
      [cwBase[0] + nx * (s + w) + u[0] * depth, cwBase[1] + ny * (s + w) + u[1] * depth],
      [cwBase[0] + nx * s + u[0] * depth, cwBase[1] + ny * s + u[1] * depth],
    ];
    // 선분 교차 (꼭짓점이 밖에 있어도 줄무늬가 다른 횡단보도를 관통하는 경우)
    const segX = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]): boolean => {
      const o = (p: [number, number], q: [number, number], r: [number, number]): number => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
      return o1 * o2 < 0 && o3 * o4 < 0;
    };
    const crosses = (q: [number, number][], d: [number, number][]): boolean => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (segX(q[i], q[(i + 1) % 4], d[j], d[(j + 1) % 4])) return true;
      return false;
    };
    for (let s = -inner; s + stripe <= inner + 0.01; s += stripe + gapS) {
      const q = quad(s, stripe);
      // 실제 도로에서 횡단보도는 겹치지 않는다 — 앞서 그린 횡단보도와 겹치는 줄무늬만 생략 (사용자 규칙)
      const mid: [number, number] = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
      if (drawn.some((d) => inside(mid, d) || q.some((c) => inside(c, d)) || crosses(q, d))) continue;
      g.fillPoints(q.map(([x, y]) => ({ x: (x - c0) * tr, y: (y - r0) * tr })), true);
    }
    drawn.push(quad(-inner, inner * 2));
    if (mode === 'stop') {
      // 정지선 — 우측통행이라 진입 차로(진행 방향 오른쪽 절반)에만, 횡단보도 앞
      g.lineStyle(3, COL.roadLine, 0.9);
      const sx = base[0] - u[0] * 0.18, sy = base[1] - u[1] * 0.18;
      g.lineBetween((sx - c0) * tr, (sy - r0) * tr, (sx + nx * inner - c0) * tr, (sy + ny * inner - r0) * tr);
    } else {
      // 양보선 — 흰 점선(삼각 대신 짧은 대시) 진입 차로 절반
      g.lineStyle(3, COL.roadLine, 0.9);
      for (let s = 0.05; s < inner; s += 0.36) {
        const ax = base[0] + nx * s, ay = base[1] + ny * s, bx = base[0] + nx * Math.min(inner, s + 0.2), by = base[1] + ny * Math.min(inner, s + 0.2);
        g.lineBetween((ax - c0) * tr, (ay - r0) * tr, (bx - c0) * tr, (by - r0) * tr);
      }
    }
  }

  private drawRoadMarkings(g: Phaser.GameObjects.Graphics, idx: number, c0: number, r0: number): void {
    const list = this.roadsByChunk.get(idx);
    if (!list || !this.cfg.roads) return;
    const tr = this.cfg.tr;
    const lx = (x: number): number => (x - c0) * tr;
    const ly = (y: number): number => (y - r0) * tr;
    const solid = (pl: [number, number][]): void => {
      for (let i = 0; i < pl.length - 1; i++) {
        g.lineBetween(lx(pl[i][0]), ly(pl[i][1]), lx(pl[i + 1][0]), ly(pl[i + 1][1]));
      }
    };
    // 점선 — 폴리라인 전체에 위상(phase)을 이어 정점에서 끊기지 않게.
    //  축 정렬 세그먼트는 **타일 격자에 위상을 맞춘다**(점선이 타일 단위로 떨어져 "타일 같은" 마킹)
    const dashed = (pl: [number, number][], dash: number, gap: number): void => {
      let phase = 0;
      for (let i = 0; i < pl.length - 1; i++) {
        const ax = lx(pl[i][0]), ay = ly(pl[i][1]), bx = lx(pl[i + 1][0]), by = ly(pl[i + 1][1]);
        const len = Math.hypot(bx - ax, by - ay);
        if (len < 0.5) continue;
        const ux = (bx - ax) / len, uy = (by - ay) / len;
        const axisAligned = Math.abs(ux) < 0.05 || Math.abs(uy) < 0.05;
        if (axisAligned) {
          const startPx = Math.abs(ux) < 0.05 ? ay + r0 * tr : ax + c0 * tr;   // 월드 px 기준 정렬
          const period = dash + gap;
          phase = -(((startPx % period) + period) % period);
        }
        let t = phase;
        while (t < len) {
          const e = Math.min(len, t + dash);
          if (e > 0 && e > t) g.lineBetween(ax + ux * Math.max(0, t), ay + uy * Math.max(0, t), ax + ux * e, ay + uy * e);
          t += dash + gap;
        }
        phase = t - len - (dash + gap);   // 다음 세그먼트로 위상 이월 (마지막 대시 시작점 기준)
      }
    };
    // 축 정렬 세그먼트의 직교 좌표를 **타일 중앙**으로 스냅 — 선이 타일 행/열 한가운데를 지나
    //  베이스 타일과 격자 정합(101차 후속 리포트 "타일과 따로 노는 느낌")
    const snapAxis = (pl: [number, number][]): void => {
      for (let i = 0; i < pl.length - 1; i++) {
        const dx = pl[i + 1][0] - pl[i][0], dy = pl[i + 1][1] - pl[i][1];
        const len = Math.hypot(dx, dy);
        if (len < 0.5) continue;
        if (Math.abs(dx) / len < 0.08) {          // 남북 도로 → x 스냅
          const sx = Math.floor((pl[i][0] + pl[i + 1][0]) / 2) + 0.5;
          pl[i][0] = sx; pl[i + 1][0] = sx;
        } else if (Math.abs(dy) / len < 0.08) {   // 동서 도로 → y 스냅
          const sy = Math.floor((pl[i][1] + pl[i + 1][1]) / 2) + 0.5;
          pl[i][1] = sy; pl[i + 1][1] = sy;
        }
      }
    };
    const drawnCw: [number, number][][] = [];       // 이 청크에 그린 횡단보도 사각형 (겹침 생략용)
    const nodeIsRoundabout = (p: [number, number] | undefined, self: number): boolean =>
      !!p && (this.nodeRoads.get(this.nodeKey(p)) ?? []).some((o) => o !== self && !!this.cfg.roads![o].roundabout);
    // 회전교차로 반경+2.5타일 안의 교차 정점 = 진입부 — 양보선만(횡단보도는 복잡부 밖에서)
    const nearRoundabout = (p: [number, number] | undefined): boolean =>
      !!p && this.roundabouts.some((ra) => Math.hypot(p[0] - ra.cx, p[1] - ra.cy) < ra.R + 2.5);
    const pieceLen = (pts: [number, number][]): number => {
      let l = 0; for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return l;
    };
    const roadLen = new Map<number, number>();
    for (const ri of list) {
      const road = this.cfg.roads[ri];
      if (road.pts.length < 2) continue;
      const halfW = road.w / 2;
      const lanesPerDir = Math.max(1, road.lanes ?? 1);
      // 차선 기하 — 가장자리 여유 0.35타일 안쪽에 차로를 균등 배치 (차도 밴드 안에 들어온다)
      const edgeM = 0.35;
      // 일방통행·회전교차로 링 = 중앙선 없음, 전 폭을 한 방향 차로로
      const oneway = !!road.oneway || !!road.roundabout;
      const laneW = oneway ? Math.max(0.5, (road.w - edgeM * 2) / lanesPerDir) : Math.max(0.5, (halfW - edgeM) / lanesPerDir);
      const dash = tr / 2, gap = tr / 2;             // 타일당 대시 1개 (격자 정합)
      // 교차 정점에서 조각으로 나눠 교차로 박스 안은 비운다 (리포트 4 — 마킹 관통 금지)
      for (const piece of this.markingPieces(road, ri)) {
        const pts = piece.pts;
        snapAxis(pts);
        // 횡단보도·정지선 — 조각의 교차부 쪽 끝 (폭 ≥ 3). 회전교차로 링 자체에는 없고,
        // 링으로 들어가는 진입부는 양보선 + 뒤로 물린 횡단보도
        // 짧은 조각(< 2.5타일)·짧은 도로(< 5타일 — 교차로 안 연결 슬립로)에는 그리지 않는다 (실제 도로 관례 +
        // 회전교차로 복합부의 어수선함 방지)
        if (!roadLen.has(ri)) roadLen.set(ri, pieceLen(road.pts));
        if (road.w >= 3 && !road.roundabout && pieceLen(pts) >= 2.5 && (roadLen.get(ri) ?? 0) >= 5) {
          const dirAt = (a: [number, number], b: [number, number]): [number, number] => {
            const dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l];
          };
          // 복합부(반경+2.5 안)의 슬립로(도로 길이 < 8)에는 아무것도 그리지 않는다 — 실측 어수선함
          const modeAt = (node: [number, number] | undefined): 'stop' | 'yield' | 'yield_only' | null =>
            nodeIsRoundabout(node, ri) ? 'yield' : nearRoundabout(node) ? ((roadLen.get(ri) ?? 0) >= 8 ? 'yield_only' : null) : 'stop';
          const mEnd = modeAt(piece.endNode), mStart = modeAt(piece.startNode);
          if (piece.cutEnd && mEnd) {
            this.drawCrosswalk(g, pts[pts.length - 1], dirAt(pts[pts.length - 2], pts[pts.length - 1]), halfW, c0, r0, drawnCw, mEnd);
          }
          if (piece.cutStart && mStart) {
            this.drawCrosswalk(g, pts[0], dirAt(pts[1], pts[0]), halfW, c0, r0, drawnCw, mStart);
          }
        }
        if (road.w >= 2 && !oneway) {
          g.lineStyle(road.w >= 3 ? 4 : 3, COL.roadCenter, 0.95);
          if (lanesPerDir >= 2) {                    // 왕복 4차로 이상 = 이중 황색 실선
            g.lineStyle(3, COL.roadCenter, 0.95);
            solid(SeamlessChunks.offsetPolyline(pts, 0.09));
            solid(SeamlessChunks.offsetPolyline(pts, -0.09));
          } else {
            solid(pts);                              // 중앙선 — 노란 실선 (주택가 2.8타일 도로도 — 끊김 금지)
          }
        }
        if (oneway) {                                // 일방통행 — 차로 점선을 전 폭에 걸쳐 (중앙선 없음)
          g.lineStyle(3, COL.roadLine, 0.85);
          for (let k = 1; k < lanesPerDir; k++) dashed(SeamlessChunks.offsetPolyline(pts, -halfW + edgeM + k * laneW), dash, gap);
          if (road.w >= 4 && pieceLen(pts) >= 3) {   // 짧은 조각의 가장자리선은 교차부에서 "ㄷ" 자국이 된다
            g.lineStyle(2, COL.roadLine, 0.6);
            solid(SeamlessChunks.offsetPolyline(pts, halfW - edgeM));
            solid(SeamlessChunks.offsetPolyline(pts, -(halfW - edgeM)));
          }
          continue;
        }
        g.lineStyle(3, COL.roadLine, 0.85);
        for (let k = 1; k < lanesPerDir; k++) {      // 차선 — 흰 점선
          dashed(SeamlessChunks.offsetPolyline(pts, k * laneW), dash, gap);
          dashed(SeamlessChunks.offsetPolyline(pts, -k * laneW), dash, gap);
        }
        if (road.w >= 4 && pieceLen(pts) >= 3) {     // 가장자리 실선 — 차도 안쪽 (짧은 조각 제외)
          g.lineStyle(2, COL.roadLine, 0.6);
          solid(SeamlessChunks.offsetPolyline(pts, halfW - edgeM));
          solid(SeamlessChunks.offsetPolyline(pts, -(halfW - edgeM)));
        }
      }
    }
    // 신호 교차로 — 대각선 횡단보도 (스크램블 X자, 신호 교차로 전용 — 후속 7 보류분 해소)
    this.drawScrambleCrosswalks(g, c0, r0);
    // 마킹 위에 얹는 시설 — 분리섬이 중앙선 끝·횡단보도 가운데를 덮는다 (보행 대피섬)
    this.drawSplitterIslands(g, c0, r0);
  }

  /**
   * 대각선 횡단보도 — 신호 교차로(detectSignals) 박스 안에 두 대각 방향 지브라 밴드(X자).
   * 교차로 박스는 markingPieces 인셋으로 이미 마킹이 비어 있어 그 위에 얹는다.
   * 중앙 겹침은 실제 스크램블 교차로도 겹치므로 그대로 둔다.
   */
  private drawScrambleCrosswalks(g: Phaser.GameObjects.Graphics, c0: number, r0: number): void {
    const tr = this.cfg.tr;
    const N = this.cfg.chunkTiles;
    for (const sg of this.signals) {
      // 스크램블은 **대형 교차로만** (클러스터 반경 3.2타일↑ — 이중도로급 사거리). 실도로에서
      // 대각선 횡단보도는 드물다 — 소형 신호 교차로 90곳 전부에 그리면 과밀(실렌더 판단)
      if (sg.half < 3.2) continue;
      if (sg.x < c0 - 10 || sg.x > c0 + N + 10 || sg.y < r0 - 10 || sg.y > r0 + N + 10) continue;
      const L = sg.half * 0.9;     // 대각 절반 길이 — 접근로 횡단보도와 겹치지 않게 박스 안쪽
      const bw = 0.95;             // 밴드 폭 (타일)
      g.fillStyle(COL.crosswalk, 0.92);
      const dirs: [number, number][] = [[Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]];
      for (const [ux, uy] of dirs) {
        const nx = -uy, ny = ux;
        for (let t = -L; t + 0.3 <= L; t += 0.54) {
          const mx = sg.x + ux * (t + 0.15), my = sg.y + uy * (t + 0.15);
          g.fillPoints([
            { x: (mx - ux * 0.15 - nx * bw / 2 - c0) * tr, y: (my - uy * 0.15 - ny * bw / 2 - r0) * tr },
            { x: (mx - ux * 0.15 + nx * bw / 2 - c0) * tr, y: (my - uy * 0.15 + ny * bw / 2 - r0) * tr },
            { x: (mx + ux * 0.15 + nx * bw / 2 - c0) * tr, y: (my + uy * 0.15 + ny * bw / 2 - r0) * tr },
            { x: (mx + ux * 0.15 - nx * bw / 2 - c0) * tr, y: (my + uy * 0.15 - ny * bw / 2 - r0) * tr },
          ], true);
        }
      }
    }
  }

  /**
   * 회전교차로 진입부 분리섬 (101차 잔여 — 규범도의 물방울꼴 섬).
   * OSM은 회전교차로 접근로를 대부분 **일방통행 쌍**(진입로 + 진출로가 갈라진 이중도로)으로
   * 그린다(수복탑 실측 — 링 접점 접근로 전원 oneway). 물리적 분리섬은 바로 **그 쌍 사이의
   * 쐐기 공간**이므로, 링 정점의 진출로(atStart)·진입로(atEnd)를 근접 쌍으로 묶어 두 도로
   * 밴드 사이 남는 폭에 스트립(연석 + 보도 톤)을 채운다. 접근로가 갈라지지 않은 **양방향**
   * 단일로(폭 ≥ 2.5)는 도로 중심선 위 테이퍼 섬으로 그린다 (수동 제작 맵 대응).
   * 마킹 뒤에 그려 중앙선 끝을 덮고, 횡단보도는 섬 양옆에 남아 보행 대피섬이 된다.
   * 링은 전 지역 몇 개뿐이라 청크 소속과 무관하게 전수 순회한다(RT가 클립).
   */
  private drawSplitterIslands(g: Phaser.GameObjects.Graphics, c0: number, r0: number): void {
    if (!this.cfg.roads) return;
    const roads = this.cfg.roads;
    const tr = this.cfg.tr;
    const L = (x: number): number => (x - c0) * tr;
    const T = (y: number): number => (y - r0) * tr;
    const polyLen = (pts: [number, number][]): number => {
      let l = 0;
      for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      return l;
    };
    // 한쪽 끝에서 호길이 dist 지점 — 접근로가 굽어도 섬이 도로를 벗어나지 않는다
    const ptAt = (pts: [number, number][], fromStart: boolean, dist: number): [number, number] | null => {
      let remain = dist;
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const a = fromStart ? pts[i] : pts[n - 1 - i];
        const b = fromStart ? pts[i + 1] : pts[n - 2 - i];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) continue;
        if (remain <= len) return [a[0] + dx * (remain / len), a[1] + dy * (remain / len)];
        remain -= len;
      }
      return null;
    };
    for (let ringI = 0; ringI < roads.length; ringI++) {
      const ring = roads[ringI];
      if (!ring.roundabout || ring.pts.length < 6) continue;
      const ringHalf = ring.w / 2;
      type End = { oi: number; node: [number, number]; fromStart: boolean; len: number };
      const exits: End[] = [];    // 링에서 나가는 일방통행 (pts[0] = 링)
      const entries: End[] = [];  // 링으로 들어오는 일방통행 (pts[last] = 링)
      const seen = new Set<string>();          // 닫힌 링은 첫 = 끝 정점 — 중복 방지
      for (const p of ring.pts) {
        const key = this.nodeKey(p);
        if (seen.has(key)) continue;
        seen.add(key);
        for (const oi of this.nodeRoads.get(key) ?? []) {
          if (oi === ringI) continue;
          const ap = roads[oi];
          if (ap.roundabout || ap.pts.length < 2) continue;
          const atStart = this.nodeKey(ap.pts[0]) === key;
          const atEnd = this.nodeKey(ap.pts[ap.pts.length - 1]) === key;
          if (atStart === atEnd) continue;     // 양끝이 다 링(짧은 연결부)이거나 관통 정점 — 생략
          const len = polyLen(ap.pts);
          if (ap.oneway) {
            if (len < 1.5 || ap.w < 2) continue;
            (atStart ? exits : entries).push({ oi, node: p, fromStart: atStart, len });
            continue;
          }
          // ── 양방향 단일 접근로 — 중심선 위 테이퍼 섬 (수동 제작 맵 대응) ──
          if (ap.w < 2.5) continue;
          const d0 = ringHalf + 0.35;
          if (len < d0 + 1.5) continue;
          const d1 = Math.min(d0 + 2.6, len - 0.4);
          const p0 = ptAt(ap.pts, atStart, d0);
          const pm = ptAt(ap.pts, atStart, (d0 + d1) / 2);
          const p1 = ptAt(ap.pts, atStart, d1);
          if (!p0 || !pm || !p1) continue;
          const ul = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
          const nx = -(p1[1] - p0[1]) / ul, ny = (p1[0] - p0[0]) / ul;
          const w0 = Math.min(ap.w * 0.3, 1.0);
          const tear = (a: [number, number], t: [number, number], wa: number): { x: number; y: number }[] => [
            { x: L(a[0] + nx * wa / 2), y: T(a[1] + ny * wa / 2) },
            { x: L(pm[0] + nx * wa * 0.35), y: T(pm[1] + ny * wa * 0.35) },
            { x: L(t[0]), y: T(t[1]) },
            { x: L(pm[0] - nx * wa * 0.35), y: T(pm[1] - ny * wa * 0.35) },
            { x: L(a[0] - nx * wa / 2), y: T(a[1] - ny * wa / 2) },
          ];
          g.fillStyle(COL.curb, 1);
          g.fillPoints(tear(p0, p1, w0), true);
          g.fillCircle(L(p0[0]), T(p0[1]), (w0 / 2) * tr);
          const i1 = ptAt(ap.pts, atStart, Math.max(d0 + 0.5, d1 - 0.3));
          if (i1) {
            g.fillStyle(COL.walk, 1);
            g.fillPoints(tear(p0, i1, w0 * 0.55), true);
            g.fillCircle(L(p0[0]), T(p0[1]), (w0 * 0.55 / 2) * tr);
          }
        }
      }
      // ── 일방통행 쌍 사이 쐐기 섬 — 진출로마다 링 접점이 가장 가까운 진입로와 짝 ──
      const used = new Set<number>();
      for (const ex of exits) {
        let best: End | null = null, bestD = 5.5;
        for (const en of entries) {
          if (used.has(en.oi)) continue;
          const d = Math.hypot(en.node[0] - ex.node[0], en.node[1] - ex.node[1]);
          if (d < bestD) { best = en; bestD = d; }
        }
        if (!best) continue;
        used.add(best.oi);
        const A = roads[ex.oi], B = roads[best.oi];
        const dEnd = Math.min(4.4, Math.min(ex.len, best.len) - 0.35);
        if (dEnd < 1.0) continue;
        // 두 도로 밴드 사이 남는 폭을 따라 스트립 샘플링 — 폭이 안 나오는 구간은 버린다
        const left: [number, number][] = [], right: [number, number][] = [];
        const STEPS = 6;
        for (let si = 0; si <= STEPS; si++) {
          const d = 0.5 + (dEnd - 0.5) * (si / STEPS);
          const PA = ptAt(A.pts, true, d);           // 진출로 — 링이 pts[0]
          const PB = ptAt(B.pts, false, d);          // 진입로 — 링이 pts[last]
          if (!PA || !PB) break;
          const sx = PB[0] - PA[0], sy = PB[1] - PA[1];
          const dist = Math.hypot(sx, sy);
          const inA = A.w / 2 + 0.1, inB = B.w / 2 + 0.1;
          if (dist - inA - inB < 0.22) {             // 밴드가 겹치는 구간(링 근처 합류부)
            if (left.length === 0) continue;         // 아직 시작 전이면 더 바깥에서 시작
            break;                                    // 이미 그리던 중이면 여기서 마감
          }
          const ux = sx / dist, uy = sy / dist;
          left.push([PA[0] + ux * inA, PA[1] + uy * inA]);
          right.push([PB[0] - ux * inB, PB[1] - uy * inB]);
        }
        if (left.length < 2) continue;
        const poly = [...left, ...right.slice().reverse()];
        g.fillStyle(COL.curb, 1);
        g.fillPoints(poly.map(([x, y]) => ({ x: L(x), y: T(y) })), true);
        // 안쪽 보도 톤 — 스트립 중심선으로 0.16타일 인셋
        const inner: { x: number; y: number }[] = [];
        for (let i = 0; i < left.length; i++) {
          const cx = (left[i][0] + right[i][0]) / 2, cy = (left[i][1] + right[i][1]) / 2;
          const k = Math.max(0, 1 - 0.16 / (Math.hypot(left[i][0] - cx, left[i][1] - cy) || 1));
          inner.push({ x: L(cx + (left[i][0] - cx) * k), y: T(cy + (left[i][1] - cy) * k) });
        }
        for (let i = right.length - 1; i >= 0; i--) {
          const cx = (left[i][0] + right[i][0]) / 2, cy = (left[i][1] + right[i][1]) / 2;
          const k = Math.max(0, 1 - 0.16 / (Math.hypot(right[i][0] - cx, right[i][1] - cy) || 1));
          inner.push({ x: L(cx + (right[i][0] - cx) * k), y: T(cy + (right[i][1] - cy) * k) });
        }
        g.fillStyle(COL.walk, 1);
        g.fillPoints(inner, true);
      }
    }
  }

  private bakeChunk(idx: number, slot: ChunkSlot): void {
    const cc = idx % this.chunkCols;
    const cr = Math.floor(idx / this.chunkCols);
    const N = this.cfg.chunkTiles;
    const tr = this.cfg.tr;
    const c0 = cc * N, r0 = cr * N;
    const c1 = Math.min(c0 + N, this.cfg.cols);
    const r1 = Math.min(r0 + N, this.cfg.rows);
    const seed = this.cfg.seed;
    const cols = this.cfg.cols;

    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const at = (c: number, r: number): string => this.tileAt(c, r);

    // ── L1 베이스: Kenney 지면 타일 (있으면) — RT에 직접 배치, 절차 레이어는 그 위에 얹는다 ──
    slot.rt.clear();
    const useGround = this.groundTex.size > 0;
    /** 대각 엣지 타일 — 이 타일의 볼록 모서리(두 직교 이웃 + 대각 이웃이 같은 다른 지형)에 그린 삼각형 방위 */
    const triAt = new Map<number, ['ne' | 'nw' | 'se' | 'sw', string]>();
    if (useGround) {
      slot.rt.beginDraw();
      const grp = (t: string): string => (t === 'r' || t === 'w' ? '.' : t);
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const ch = at(c, r);
          const dx = (c - c0) * tr, dy = (r - r0) * tr;
          // ── 물 타일셋 — 수심 버킷·해시 변형 베이스 (암초/파도/포말/배는 절차 패스 오버레이) ──
          if (ch === '~') {
            if (this.waterTex.length > 0) {
              const { bucket } = this.waterBucketAt(c, r);
              const wk = this.waterTex[bucket];
              if (wk.length > 0) slot.rt.batchDraw(wk[Math.floor(hash2(seed ^ 0x77aa, c, r) * wk.length) % wk.length], dx, dy);
            }
            // ── 해변 접경 — 모래와 맞닿은 물 타일에 TTP 시트 접경 셀(방위 회전)을 얹는다.
            //   모래가 접경 방향으로 번지고 그 앞에 포말이 깔린다(103차 절차 서프 밴드를 대체).
            //   두 방위가 동시에 모래면 둘 다 그린다 = 모래 부분이 합집합(코너에서 기하학적으로 옳다)
            if (this.ttpReady) {
              const sd = [at(c, r - 1) === 's', at(c + 1, r) === 's', at(c, r + 1) === 's', at(c - 1, r) === 's'];
              for (let d = 0; d < 4; d++) {
                if (!sd[d]) continue;
                const pool = this.ttpEdge[d];
                slot.rt.batchDraw(pool[Math.floor(hash2(seed ^ (0x5ea1 + d), c, r) * pool.length) % pool.length], dx, dy);
              }
            }
            // ── 섬 주변 여(스커리) — 실사 갯바위 스프라이트 산포(105차). 절차 사각형 대체.
            //   본섬 둘레 2타일 안 물에만, 해시로 성기게. 물속 바위는 포말 링이 있는
            //   `rockwater_*`를 섞어 물에 잠긴 느낌을 준다.
            if (this.coastReady && hash2(seed ^ 0x5c07, c, r) > 0.62 && this.nearIsletAt(c, r)) {
              const h = hash2(seed ^ 0x5c08, c, r), h2b = hash2(seed ^ 0x5c09, c, r);
              const key = h > 0.55
                ? this.coastRocks[Math.floor(h2b * this.coastRocks.length) % this.coastRocks.length]
                : `ts_coast_rockwater_${Math.floor(h2b * 4) % 4}`;
              const src = this.scene.textures.get(key).getSourceImage() as { width: number; height: number };
              const ox = Math.floor(h2b * Math.max(1, tr - src.width));
              const oy = Math.floor(h * Math.max(1, tr - src.height));
              slot.rt.batchDraw(key, dx + ox, dy + oy);
            }
            // ── 방파제 접경 오버레이(105차) — 'b'에 붙은 물 타일. 방파제가 있는 방위로 회전한
            //   셀을 얹는다(바다 부분은 투명이라 게임 물이 그대로 비친다).
            //   외해측 = 사석 발치(`rubble_toe`) · 항내측 = 안벽 모서리(`pier_edge`, 흰 포말선)
            if (this.coastReady) {
              const dv = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
              for (let d = 0; d < 4; d++) {
                if (at(c + dv[d][0], r + dv[d][1]) !== 'b') continue;
                const open = this.raysToOpenSea(c, r, -dv[d][0], -dv[d][1]);
                const pool = this.coastEdge[d].filter((k) => (open ? k.includes('rubble_toe') : k.includes('pier_edge')));
                if (pool.length === 0) continue;
                slot.rt.batchDraw(pool[Math.floor(hash2(seed ^ (0xc0e5 + d), c, r) * pool.length) % pool.length], dx, dy);
              }
            }
            // ── 외해측 방파제 테트라포드 피복 — 'b'에 붙은 바다 타일 중 방파제 바깥(4·7타일 너머
            //   수심 ≥ 5 = 열린 바다)만. 항 내측(둘러싸인 정온수역 = waterDist 작음)은 안벽 그대로.
            //   TTP 세트가 있으면 소형 유닛 클러스터, 없으면 구 gem 스프라이트 1장(폴백)
            {
              const bN = at(c, r - 1) === 'b', bS = at(c, r + 1) === 'b';
              const bW = at(c - 1, r) === 'b', bE = at(c + 1, r) === 'b';
              const adj = bN || bS || bW || bE;
              // 두 번째 밴드 — 방파제에서 2타일 떨어진 물 (피복 사면이 바다 쪽으로 흘러내린 자락)
              const b2N = at(c, r - 2) === 'b', b2S = at(c, r + 2) === 'b';
              const b2W = at(c - 2, r) === 'b', b2E = at(c + 2, r) === 'b';
              const b2 = !adj && (b2N || b2S || b2W || b2E);
              if (adj || (b2 && this.ttpReady)) {
                const dirX = (adj ? bW : b2W) ? 1 : (adj ? bE : b2E) ? -1 : 0;   // 방파제 반대 = 바깥
                const dirY = (adj ? bN : b2N) ? 1 : (adj ? bS : b2S) ? -1 : 0;
                // ⚠ 개활도 판정 기준점은 **방파제에 붙은 첫 물 타일**로 고정 — 두 번째 밴드가
                //   자기 위치에서 재면 2타일만큼 더 바깥에서 재는 셈이라, 내수면(청초호 제방)도
                //   기준을 넘겨 테트라포드가 깔린다(실렌더로 확인한 회귀). 두 밴드가 같은 판정을 쓴다.
                const bc = adj ? c : c - dirX, br = adj ? r : r - dirY;
                const far = Math.max(
                  this.waterDistAt(bc + dirX * 4, br + dirY * 4),
                  this.waterDistAt(bc + dirX * 7, br + dirY * 7));
                if (far >= 5 && this.raysToOpenSea(bc, br, dirX, dirY)) {
                  if (this.ttpReady) this.drawTtpCluster(slot.rt, dx, dy, c, r, adj);
                  else if (this.scene.textures.exists('smx_tetra_s')) {
                    const j = hash2(seed ^ 0x7e7a, c, r);
                    slot.rt.batchDraw('smx_tetra_s', dx - 8 + Math.floor(j * 14), dy - 8 + Math.floor((1 - j) * 12));
                  }
                }
              }
            }
            continue;
          }
          // 섬/암초('.') — 밑에 얕은 물 셀을 깔아둔다 (절차 패스가 모서리를 45°로 깎아
          // 암반을 그릴 때 깎인 부분이 물로 보이게). 포장 베이스는 생략
          if (this.islet[r * cols + c] && ch === '.') {
            if (this.waterTex.length > 0 && this.waterTex[0].length > 0) {
              slot.rt.batchDraw(this.waterTex[0][Math.floor(hash2(seed ^ 0x77aa, c, r) * this.waterTex[0].length) % this.waterTex[0].length], dx, dy);
            }
            continue;
          }
          // ── 방파제 'b' — 실사 해안 세트가 있으면 Kenney pier 대신 상판/사석 타일 ──
          if (ch === 'b' && this.coastReady) {
            slot.rt.batchDraw(this.coastPierKey(c, r), dx, dy);
            continue;
          }
          const keys = this.groundTex.get(ch);
          if (!keys) continue;
          const myG = grp(ch);
          const nN = grp(at(c, r - 1)), nS = grp(at(c, r + 1)), nW = grp(at(c - 1, r)), nE = grp(at(c + 1, r));
          // ── 오토타일 접경 마스크 — 잔디는 다른 군 전부, 포장(tan/pier)은 유기 지형·물만 "바깥"
          //   (포장끼리는 무테 — 밴드/시설이 잇는다) ──
          const em = this.edgeTex.get(myG);
          let mask = 0;
          if (em) {
            const outside = (t: string): boolean =>
              myG === ',' ? t !== myG : (t === ',' || t === 's' || t === '~');
            if (outside(nN)) mask |= 1;
            if (outside(nE)) mask |= 2;
            if (outside(nS)) mask |= 4;
            if (outside(nW)) mask |= 8;
          }
          // ── 잔디 = 유기 블롭 오토타일 우선 (16조합 — 흙 림이 곡선 경계를 그린다).
          //   ⚠ 이너코너 노치 셀(notch_*)은 쓰지 않는다 — 흙 블롭 모서리 셀이라 반타일 흙 사각형이
          //   계단 경계 안쪽마다 "갈색 블롭"으로 찍혔다(실렌더 확인). 대각 케이스는 인접 타일의
          //   림이 이미 곡선을 만들므로 내부 평타일로 충분하다. ──
          if (em && myG === ',' && mask > 0) {
            const tk = em.get(EDGE_SUFFIX[mask]);
            if (tk) { slot.rt.batchDraw(tk, dx, dy); continue; }
          }
          const k = keys[Math.floor(hash2(seed ^ 0x6e0d, c, r) * keys.length) % keys.length];
          slot.rt.batchDraw(k, dx, dy);
          // 직각삼각형 대각 엣지(101차 후속 4 — 사용자 제안 "4방위 직각삼각형 타일"): 계단식 경계를 45°로.
          //  이웃 두 변 + 대각이 같은 지형 B면 그 모서리에 B의 삼각형을 얹는다 (모래·부두 ↔ 맨땅.
          //  차도·보도는 벡터 밴드가 곡선으로 그리므로 여기서는 맨땅과 같은 군으로 취급)
          const tri = (a: string, b: string, d0: string, q: 'ne' | 'nw' | 'se' | 'sw'): boolean => {
            const d = grp(d0);
            if (a === ',') return false;               // 잔디 경계는 블롭 셀 전담 — 삼각 겹치면 파편
            if (a !== b || a === myG || d !== a) return false;
            const bk = this.groundTex.get(a);
            if (!bk) return false;
            const tk = `${bk[0]}_tri_${q}`;
            if (!this.scene.textures.exists(tk)) return false;
            slot.rt.batchDraw(tk, dx, dy);
            triAt.set(r * cols + c, [q, a]);
            return true;
          };
          // 차도가 잘리는 쪽이 아니라 **차도가 보도를 파고드는** 대각도 같은 규칙으로 처리된다
          const triDrew = tri(nN, nE, at(c + 1, r - 1), 'ne') || tri(nN, nW, at(c - 1, r - 1), 'nw')
            || tri(nS, nE, at(c + 1, r + 1), 'se') || tri(nS, nW, at(c - 1, r + 1), 'sw');
          // ── 포장(tan/pier) 접경 = 삼각 스무딩이 없을 때만 어두운 테두리 엣지 셀 (불투명 덮어쓰기) ──
          if (!triDrew && em && mask > 0) {
            const tk = em.get(EDGE_SUFFIX[mask]);
            if (tk) slot.rt.batchDraw(tk, dx, dy);
          }
        }
      }
      slot.rt.endDraw();
    }
    // ── 차도/보도 = 벡터 밴드 (곡선 그대로 — 래스터 계단 대신). 보도 밴드 → 아스팔트 밴드 순 ──
    if (useGround) this.drawRoadBands(g, idx, c0, r0);

    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const ch = at(c, r);
        const lx = (c - c0) * tr, ly = (r - r0) * tr;
        const checker = (c + r) % 2 === 0;
        const h1 = hash2(seed, c, r);
        const h2 = hash2(seed ^ 0x5f5f, c, r);
        /** 이 타일이 Kenney 베이스로 이미 깔렸는가 — 절차 기본색/스페클/디더는 생략 */
        const based = useGround && this.groundTex.has(ch);

        // ── 바다 ──
        if (ch === '~') {
          // 암초/여 — 5m/타일에서는 노이즈 스케일·임계를 좁혀 "패치 노이즈"가 아니라
          // 성긴 여밭으로 읽히게 한다 (101차 — 구 0.74/거리 3~26은 절반이 얼룩졌다)
          const { bucket, isReef } = this.waterBucketAt(c, r);
          const ramp = DEPTH_RAMP[bucket];
          // 물 타일셋(L1 베이크)이 깔렸으면 베이스는 생략 — 절차 패스는 오버레이만.
          // 폴백(레거시 TR·타일셋 부재) = 해시 랜덤 2톤 (규칙적 체커는 격자가 도드라진다)
          if (this.waterTex.length === 0) {
            g.fillStyle(h1 > 0.5 ? ramp[0] : ramp[1], 1);
            g.fillRect(lx, ly, tr, tr);
          }
          if (isReef) {
            g.fillStyle(0x2e463f, 0.45);
            g.fillRect(lx + 4, ly + 7, 6, 4);
            g.fillRect(lx + 12, ly + 13, 4, 3);
          } else if (bucket >= 4 && h2 > 0.9) {
            g.fillStyle(COL.waveDeep, 0.3);
            g.fillRect(lx + 4, ly + 4, tr - 8, tr - 8);
          }
          // 파도 대시 — 얕은~중간 수심에 성긴 밝은 물결
          if (bucket <= 3 && h1 > 0.90) {
            g.fillStyle(COL.wave, 0.55);
            g.fillRect(lx + 3 + Math.floor(h2 * 6), ly + 4 + Math.floor(h1 * 10), 9, 2);
          }
          // 해안 포말 — 뭍과 맞닿은 물 타일 가장자리. TTP 접경 타일이 깔린 모래 쪽은 건너뛴다
          // (그 셀이 이미 포말을 그리고 있어 2px 선을 더하면 모래 위에 흰 테두리가 얹힌다)
          const noRim = (t: string): boolean => t !== '~' && !(this.ttpReady && t === 's');
          g.fillStyle(COL.foam, 0.4);
          if (noRim(at(c, r - 1))) g.fillRect(lx, ly, tr, 2);
          if (noRim(at(c, r + 1))) g.fillRect(lx, ly + tr - 2, tr, 2);
          if (noRim(at(c - 1, r))) g.fillRect(lx, ly, 2, tr);
          if (noRim(at(c + 1, r))) g.fillRect(lx + tr - 2, ly, 2, tr);
          // 해수욕장 서프 — 모래와 맞닿은 물가는 두꺼운 러프 포말 밴드 + 1타일 물속 부서진 거품 줄
          // (드론 실사 정합 — 사용자 리포트 5번 캡처: 모래 → 포말 파도 → 바다 연결부)
          {
            const sN = at(c, r - 1) === 's', sS = at(c, r + 1) === 's';
            const sW = at(c - 1, r) === 's', sE = at(c + 1, r) === 's';
            if (this.ttpReady && (sN || sS || sW || sE)) {
              // TTP 접경 셀이 L1에서 이미 모래·포말을 그렸다 — 절차 밴드 생략
            } else if (sN || sS || sW || sE) {
              g.fillStyle(COL.foam, 0.85);
              for (let k = 0; k < tr; k += 4) {
                const fh = 5 + Math.floor(hash2(seed ^ 0x5ea1, c * 8 + (k >> 2), r) * 9);
                if (sN) g.fillRect(lx + k, ly, 4, fh);
                if (sS) g.fillRect(lx + k, ly + tr - fh, 4, fh);
                if (sW) g.fillRect(lx, ly + k, fh, 4);
                if (sE) g.fillRect(lx + tr - fh, ly + k, fh, 4);
              }
            } else if (this.waterDist[r * cols + c] === 2) {
              let nearSand = false;
              for (let dr2 = -2; dr2 <= 2 && !nearSand; dr2++) {
                for (let dc2 = -2; dc2 <= 2; dc2++) {
                  if (at(c + dc2, r + dr2) === 's') { nearSand = true; break; }
                }
              }
              if (nearSand) {
                g.fillStyle(COL.foam, 0.38);
                for (let k = 0; k < tr; k += 8) {
                  if (hash2(seed ^ 0x5ea2, c * 4 + (k >> 3), r) > 0.4) {
                    g.fillRect(lx + k, ly + 6 + Math.floor(h2 * 16), 7, 2);
                  }
                }
              }
            }
          }
          // 섬 주변 여(스커리) — 위성처럼 본섬 둘레 잔바위 산포 (사각 실루엣 흩뜨리기 + 갯바위 낚시 예고)
          // ⚠ 해안 세트(105차)가 있으면 L1이 실사 바위 스프라이트를 뿌리므로 절차 사각형은 생략
          if (!this.coastReady && h2 > 0.55) {
            let nearIslet = false;
            for (let dr2 = -2; dr2 <= 2 && !nearIslet; dr2++) {
              for (let dc2 = -2; dc2 <= 2; dc2++) {
                const nc = c + dc2, nr = r + dr2;
                if (nc >= 0 && nc < cols && nr >= 0 && nr < this.cfg.rows && this.islet[nr * cols + nc]) { nearIslet = true; break; }
              }
            }
            if (nearIslet) {
              g.fillStyle(h1 > 0.5 ? 0xa89d8d : 0x8d8272, 1);
              g.fillRect(lx + 4 + Math.floor(h1 * 18), ly + 6 + Math.floor(h2 * 16), 3 + Math.floor(h1 * 5), 3 + Math.floor(h2 * 4));
              if (h1 > 0.75) g.fillRect(lx + 14 - Math.floor(h2 * 8), ly + 18 - Math.floor(h1 * 6), 4, 3);
              g.fillStyle(COL.foam, 0.35);
              g.fillRect(lx + 3 + Math.floor(h1 * 18), ly + 5 + Math.floor(h2 * 16), 5, 2);
            }
          }
          // 배 — 깊은 바다에 아주 성기게 (결정적)
          if (bucket >= 3 && hash2(seed ^ 0xb0a7, c, r) > 0.9994) {
            g.fillStyle(COL.boatHull, 1);
            g.fillRect(lx + 3, ly + 9, 14, 5);
            g.fillRect(lx + 5, ly + 14, 10, 2);
            g.fillStyle(COL.boatDeck, 1);
            g.fillRect(lx + 6, ly + 5, 6, 4);
          }
          continue;
        }

        // ── 섬/암초 갯바위 — 소형 야생 육지(computeIslets — 조도 등)는 포장 대신 암반으로
        //    (위성 실사 정합: 밝은 암반 + 물가 젖은 바위 림 + 안쪽 초지 이끼).
        //    사각 도장 방지: 볼록 모서리(두 직교 + 대각이 물)는 45° 삼각 암반 — 밑에 깔린
        //    얕은 물(L1)이 깎인 부분에 드러난다 ──
        if (ch === '.' && this.islet[r * cols + c]) {
          const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
          const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
          const rockCol = h1 > 0.5 ? 0xb7ab9b : 0xaba08f;
          let tri: 'ne' | 'nw' | 'se' | 'sw' | null = null;
          if (wN && wE && at(c + 1, r - 1) === '~') tri = 'ne';
          else if (wN && wW && at(c - 1, r - 1) === '~') tri = 'nw';
          else if (wS && wE && at(c + 1, r + 1) === '~') tri = 'se';
          else if (wS && wW && at(c - 1, r + 1) === '~') tri = 'sw';
          g.fillStyle(rockCol, 1);
          if (tri) {
            // 물 쪽 모서리를 깎은 직각삼각형 (빗변 45°) + 빗변 젖은 림
            const pts = tri === 'ne' ? [[lx, ly], [lx + tr, ly + tr], [lx, ly + tr]]
              : tri === 'nw' ? [[lx + tr, ly], [lx + tr, ly + tr], [lx, ly + tr]]
              : tri === 'se' ? [[lx, ly], [lx + tr, ly], [lx, ly + tr]]
              : [[lx, ly], [lx + tr, ly], [lx + tr, ly + tr]];
            g.fillPoints(pts.map(([x, y]) => ({ x, y })), true);
            g.lineStyle(3, 0x6e6355, 1);
            if (tri === 'ne' || tri === 'sw') g.lineBetween(lx, ly, lx + tr, ly + tr);
            else g.lineBetween(lx + tr, ly, lx, ly + tr);
          } else {
            g.fillRect(lx, ly, tr, tr);
            if (h2 > 0.45) {                           // 크랙·바위 결
              g.fillStyle(0x7d7263, 0.7);
              g.fillRect(lx + 3 + Math.floor(h1 * 16), ly + 4 + Math.floor(h2 * 18), 8, 3);
              g.fillRect(lx + 12 + Math.floor(h2 * 10), ly + 14 + Math.floor(h1 * 8), 3, 7);
            }
            if (h1 > 0.8) {                            // 하이라이트 면
              g.fillStyle(0xd6cdbd, 0.8);
              g.fillRect(lx + 2 + Math.floor(h2 * 14), ly + 2 + Math.floor(h1 * 10), 9, 5);
            }
            g.fillStyle(0x6e6355, 1);                  // 젖은 바위 림 (물가)
            if (wN) g.fillRect(lx, ly, tr, 3);
            if (wS) g.fillRect(lx, ly + tr - 3, tr, 3);
            if (wW) g.fillRect(lx, ly, 3, tr);
            if (wE) g.fillRect(lx + tr - 3, ly, 3, tr);
            // 안쪽(사방이 물이 아닌) 타일 = 초지/이끼 패치 (조도 위성: 암반 가운데 짙은 초록)
            if (!wN && !wS && !wW && !wE && h2 > 0.42) {
              g.fillStyle(h1 > 0.5 ? 0x5d7a4a : 0x527043, 0.9);
              g.fillRect(lx + 2 + Math.floor(h1 * 8), ly + 2 + Math.floor(h2 * 8), 14 + Math.floor(h1 * 10), 12 + Math.floor(h2 * 10));
            }
          }
          continue;
        }

        // ── 육상 기본색 (Kenney 베이스가 깔린 타일은 접경 처리만) ──
        if (based) {
          if (ch === 's') {
            g.fillStyle(COL.sandWet, 0.85);
            if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
            if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
            if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
            if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
          } else if (ch === 'b') {
            // 방파제 — 베이스는 청회색 포장(타일셋), 계선벽 캡·계선주는 절차 유지.
            // ⚠ 해안 세트(105차)가 깔렸으면 캡 라인은 생략 — 사석/안벽 셀이 이미 가장자리를
            //   그리고 있어 4px 회색 띠를 더하면 사석 위에 인공 테두리가 얹힌다.
            const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
            const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
            if (!this.coastReady) {
              g.fillStyle(COL.pierEdge, 1);
              if (wN) g.fillRect(lx, ly, tr, 4);
              if (wS) g.fillRect(lx, ly + tr - 4, tr, 4);
              if (wW) g.fillRect(lx, ly, 4, tr);
              if (wE) g.fillRect(lx + tr - 4, ly, 4, tr);
            }
            if ((wN || wS || wW || wE) && (c + r) % 4 === 0) {
              const bx = lx + (wE ? tr - 10 : wW ? 4 : tr / 2 - 3);
              const by = ly + (wS ? tr - 10 : wN ? 4 : tr / 2 - 3);
              g.fillStyle(COL.bollard, 1); g.fillRect(bx, by, 6, 6);
              g.fillStyle(COL.bollardTop, 1); g.fillRect(bx + 1, by + 1, 4, 3);
            }
          }
        } else if (ch === ',') {
          g.fillStyle(checker ? COL.grass : COL.grassAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          // 풀결 스페클 (짧은 어두운 잎 + 밝은 점)
          if (h1 > 0.35) {
            g.fillStyle(COL.grassDark, 0.8);
            g.fillRect(lx + 2 + Math.floor(h1 * 9), ly + 3 + Math.floor(h2 * 11), 3, 1);
            g.fillRect(lx + 10 - Math.floor(h2 * 6), ly + 13 - Math.floor(h1 * 7), 2, 1);
          }
          if (h2 > 0.7) {
            g.fillStyle(COL.grassLight, 0.8);
            g.fillRect(lx + 4 + Math.floor(h2 * 10), ly + 6 + Math.floor(h1 * 8), 2, 1);
          }
          // 들꽃 (성기게 — 흰/노랑)
          if (h1 > 0.965) {
            g.fillStyle(h2 > 0.5 ? 0xf2f0e4 : 0xe8cf6a, 0.95);
            g.fillRect(lx + 4 + Math.floor(h2 * 10), ly + 4 + Math.floor(h1 * 10), 2, 2);
          }
          // 맨땅 접경 디더 (딱 떨어지는 직선 금지 — §11)
          g.fillStyle(COL.land, 1);
          if (at(c + 1, r) === '.') { if (checker) g.fillRect(lx + tr - 3, ly + 4, 3, 4); g.fillRect(lx + tr - 2, ly + 12, 2, 3); }
          if (at(c - 1, r) === '.') { if (!checker) g.fillRect(lx, ly + 6, 3, 4); g.fillRect(lx, ly + 14, 2, 3); }
          if (at(c, r + 1) === '.') { if (checker) g.fillRect(lx + 5, ly + tr - 3, 4, 3); g.fillRect(lx + 13, ly + tr - 2, 3, 2); }
          if (at(c, r - 1) === '.') { if (!checker) g.fillRect(lx + 7, ly, 4, 3); g.fillRect(lx + 15, ly, 3, 2); }
        } else if (ch === '.') {
          g.fillStyle(checker ? COL.land : COL.landAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.55) {
            g.fillStyle(COL.landSpeck, 0.7);
            g.fillRect(lx + 3 + Math.floor(h1 * 11), ly + 4 + Math.floor(h2 * 11), 2, 2);
          }
          if (h2 > 0.9) {
            g.fillStyle(0xa89670, 0.8);
            g.fillRect(lx + 5 + Math.floor(h2 * 8), ly + 9 + Math.floor(h1 * 6), 3, 2);
          }
        } else if (ch === 's') {
          g.fillStyle(checker ? COL.sand : COL.sandAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.4) {
            g.fillStyle(COL.sandSpeck, 0.75);
            g.fillRect(lx + 3 + Math.floor(h1 * 12), ly + 3 + Math.floor(h2 * 12), 2, 1);
            g.fillRect(lx + 12 - Math.floor(h2 * 8), ly + 12 - Math.floor(h1 * 6), 1, 1);
          }
          // 젖은 모래 띠 (물과 맞닿은 쪽)
          g.fillStyle(COL.sandWet, 0.9);
          if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
          if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
          if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
          if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
        } else if (ch === 'r') {
          // ── 차도 — 아스팔트 + 차선 점선 + 연석 ──
          g.fillStyle(checker ? COL.road : COL.roadAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          if (h1 > 0.92) {   // 아스팔트 얼룩
            g.fillStyle(0x3f4247, 0.6);
            g.fillRect(lx + 4 + Math.floor(h2 * 8), ly + 5 + Math.floor(h1 * 8), 4, 3);
          }
          // (차선·중앙선은 타일이 아니라 차도 벡터로 그린다 — 아래 마킹 패스. 대각선 대응)
          // 연석 — 보도와 맞닿은 가장자리 밝은 띠
          g.fillStyle(COL.curb, 0.9);
          if (at(c, r - 1) === 'w') g.fillRect(lx, ly, tr, 2);
          if (at(c, r + 1) === 'w') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (at(c - 1, r) === 'w') g.fillRect(lx, ly, 2, tr);
          if (at(c + 1, r) === 'w') g.fillRect(lx + tr - 2, ly, 2, tr);
        } else if (ch === 'w') {
          // ── 보도 — 밝은 포장 + 신축이음 격자 ──
          g.fillStyle(checker ? COL.walk : COL.walkAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(COL.walkJoint, 0.55);
          if (c % 3 === 0) g.fillRect(lx, ly, 1, tr);
          if (r % 3 === 0) g.fillRect(lx, ly, tr, 1);
          if (h1 > 0.93) {
            g.fillStyle(0x9aa0a8, 0.6);
            g.fillRect(lx + 5 + Math.floor(h2 * 8), ly + 6 + Math.floor(h1 * 8), 3, 2);
          }
        } else if (ch === 'b') {
          // ── 방파제·부두 — 콘크리트 + 신축이음 + 계선벽 캡 + 계선주 ──
          g.fillStyle(checker ? COL.pier : COL.pierAlt, 1);
          g.fillRect(lx, ly, tr, tr);
          g.fillStyle(COL.pierJoint, 0.6);
          if (c % 3 === 0) g.fillRect(lx, ly, 2, tr);
          if (r % 3 === 0) g.fillRect(lx, ly, tr, 2);
          g.fillStyle(COL.pierEdge, 1);
          const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
          const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
          if (wN) g.fillRect(lx, ly, tr, 3);
          if (wS) g.fillRect(lx, ly + tr - 3, tr, 3);
          if (wW) g.fillRect(lx, ly, 3, tr);
          if (wE) g.fillRect(lx + tr - 3, ly, 3, tr);
          // 계선주 — 물가 가장자리 4타일 간격
          if ((wN || wS || wW || wE) && (c + r) % 4 === 0) {
            const bx = lx + (wE ? tr - 7 : wW ? 3 : tr / 2 - 2);
            const by = ly + (wS ? tr - 7 : wN ? 3 : tr / 2 - 2);
            g.fillStyle(COL.bollard, 1);
            g.fillRect(bx, by, 5, 5);
            g.fillStyle(COL.bollardTop, 1);
            g.fillRect(bx + 1, by + 1, 3, 2);
          }
        } else if (ch === '#') {
          // ── 건물 바닥 — 지붕은 컴포넌트 스프라이트(buildChunkRoofs, y-sort)가 그린다.
          //    여기는 지붕 아래 바닥(캐릭터가 위쪽 줄로 들어갔을 때 가려지는 면)만 어둡게 ──
          g.fillStyle(0x2f333a, 1);
          g.fillRect(lx, ly, tr, tr);
        }

        // ── 지형 접경선 — 타일셋 베이스는 무테 셀이므로 **다른 지형과 맞닿는 변에만** 경계선.
        //    대각 엣지 타일은 빗변에 선을 긋고 잘린 두 변은 생략 ──
        if (based && ch !== 'r' && ch !== 'w') {
          g.fillStyle(0x000000, 0.28);
          const same = (t: string): string => (t === 'r' || t === 'w' ? '.' : t);
          const diff = (t: string): boolean => same(t) !== same(ch) && t !== '~' && t !== '#';
          const tq = triAt.get(r * cols + c)?.[0];
          if (tq) {
            g.lineStyle(2, 0x000000, 0.28);
            if (tq === 'ne' || tq === 'sw') g.lineBetween(lx, ly, lx + tr, ly + tr);
            else g.lineBetween(lx + tr, ly, lx, ly + tr);
          }
          if (diff(at(c, r - 1)) && tq !== 'ne' && tq !== 'nw') g.fillRect(lx, ly, tr, 2);
          if (diff(at(c, r + 1)) && tq !== 'se' && tq !== 'sw') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (diff(at(c - 1, r)) && tq !== 'nw' && tq !== 'sw') g.fillRect(lx, ly, 2, tr);
          if (diff(at(c + 1, r)) && tq !== 'ne' && tq !== 'se') g.fillRect(lx + tr - 2, ly, 2, tr);
        }

        // ── 건물 그림자 — 남·동측 지면에 드리움 (해가 북서) ──
        if (ch !== '#' && ch !== '~') {
          const shN = at(c, r - 1) === '#';
          const shW = at(c - 1, r) === '#';
          if (shN || shW) {
            g.fillStyle(COL.shadow, 0.16);
            if (shN) g.fillRect(lx, ly, tr, 7);
            if (shW) g.fillRect(lx, ly, 7, tr);
          }
        }
      }
    }

    // 차도 마킹 (벡터) — 타일 위에 얹는다
    this.drawRoadMarkings(g, idx, c0, r0);

    slot.rt.draw(g, 0, 0);
    g.destroy();
    slot.baked = true;
  }

  // ═══════════════════════════════════════════════════

  /** 상주/풀 통계 (검증·dev 표기용) */
  stats(): { resident: number; pooled: number; created: number; pendingBakes: number } {
    return {
      resident: this.resident.size,
      pooled: this.rtPool.length,
      created: this.rtCreated,
      pendingBakes: this.bakeQueue.length,
    };
  }

  /** 청크 좌표 → 상주 여부 (부속 시스템용) */
  isResident(chunkCol: number, chunkRow: number): boolean {
    return this.resident.has(chunkRow * this.chunkCols + chunkCol);
  }

  /** 타일 → 청크 좌표 */
  chunkOfTile(c: number, r: number): { chunkCol: number; chunkRow: number } {
    return {
      chunkCol: Math.floor(c / this.cfg.chunkTiles),
      chunkRow: Math.floor(r / this.cfg.chunkTiles),
    };
  }

  destroy(): void {
    // 한 슬롯 정리가 실패해도 나머지(RT 풀·텍스처)는 반드시 정리 — 부분 실패가 다음 씬을 오염시키지 않게
    for (const [idx, slot] of [...this.resident]) {
      try { this.unloadChunk(idx, slot); } catch (e) { console.warn('[SeamlessChunks] unload 실패', e); }
    }
    this.resident.clear();
    for (const rt of this.rtPool) rt.destroy();
    this.rtPool = [];
    this.bakeQueue = [];
    if (this.walls.children) this.walls.destroy(true);
  }
}
