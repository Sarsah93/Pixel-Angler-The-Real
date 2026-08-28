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
  { id: 'tetra', label: '테트라포드 석축', tex: 'ts_gem_tetra', cat: '해안', anchor: 'center' },
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

  constructor(scene: Phaser.Scene, cfg: SeamlessChunksConfig) {
    this.scene = scene;
    this.cfg = { chunkTiles: 64, poolSize: 12, ...cfg };
    this.chunkPx = this.cfg.chunkTiles * cfg.tr;
    this.chunkCols = Math.ceil(cfg.cols / this.cfg.chunkTiles);
    this.chunkRows = Math.ceil(cfg.rows / this.cfg.chunkTiles);
    this.walls = scene.physics.add.staticGroup();
    this.waterDist = this.computeWaterDistance();
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
    const groups: [string, string[]][] = [
      ['.', ['tan_0', 'tan_1']],                   // 맨땅 = 베이지 포장 (항구 도시 광장 톤)
      [',', ['grass_0', 'grass_1']],
      ['r', ['tan_0', 'tan_1']],
      ['w', ['tan_0', 'tan_1']],
      ['s', ['sand_0', 'sand_1']],
      ['b', ['pier_0', 'pier_1']],
    ];
    const tm = this.scene.textures;
    /** 16px 원본 → tr 배율 재베이크. clip = 직각삼각형(빗변 대각선) — 4방위 대각 엣지 타일 */
    const bake = (src: string, dst: string, w: number, h: number, clip?: 'ne' | 'nw' | 'se' | 'sw', sx = 0, sy = 0): boolean => {
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
      cv.refresh();
      return true;
    };
    for (const [ch, names] of groups) {
      const keys: string[] = [];
      for (const n of names) {
        const src = `ts_kn_ground_${n}`;
        const dst = `${src}_x${scale}`;
        if (!bake(src, dst, tr, tr)) continue;
        keys.push(dst);
        if (keys.length === 1) for (const q of ['ne', 'nw', 'se', 'sw'] as const) bake(src, `${dst}_tri_${q}`, tr, tr, q);
      }
      if (keys.length > 0) this.groundTex.set(ch, keys);
    }
    // 건물 키트 — 지붕 오토타일 셀 + 벽 모듈(64×32 → 8칸으로 분할: 상단 4 + 하단 4)
    for (const color of ['red', 'gray', 'light', 'tan']) {
      for (const part of ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e', 'in', 'vent']) {
        bake(`ts_kn_roof_${color}_${part}`, `kit_roof_${color}_${part}`, tr, tr);
      }
    }
    for (const wall of ['brick_red', 'brick_gray', 'brick_tan', 'glass', 'white']) {
      for (let i = 0; i < 8; i++) {
        bake(`ts_kn_wall_${wall}`, `kit_wall_${wall}_${i}`, tr, tr, undefined, (i % 4) * 16, Math.floor(i / 4) * 16);
      }
    }
    this.kitReady = tm.exists('kit_roof_red_in') && tm.exists('kit_wall_brick_red_0');
  }

  /** Kenney 건물 키트(지붕 오토타일·벽 모듈) 재베이크 완료 여부 — 없으면 절차 지붕 폴백 */
  private kitReady = false;

  /** 차도 벡터를 청크에 배정 (세그먼트 bbox + 폭 여유) */
  /** 도로 정점 키 (0.1타일) → 그 점을 지나는 도로 인덱스 목록 — 교차 정점 판정(마킹 분할) */
  private nodeRoads = new Map<string, number[]>();
  private nodeKey(p: [number, number]): string {
    return `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
  }

  /** 회전교차로 링 중심·반경 (타일) — 진입부 마킹 규칙(반경+2.5 안 = 양보선만) */
  private roundabouts: { cx: number; cy: number; R: number }[] = [];

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
    const { cols, rows } = this.cfg;
    const dist = new Uint16Array(cols * rows).fill(0xffff);
    const qx = new Int32Array(cols * rows);
    const qy = new Int32Array(cols * rows);
    let tail = 0;
    for (let r = 0; r < rows; r++) {
      const line = this.cfg.terrainRows[r];
      for (let c = 0; c < cols; c++) {
        if (line[c] !== '~') { dist[r * cols + c] = 0; qx[tail] = c; qy[tail] = r; tail++; }
      }
    }
    let head = 0;
    while (head < tail) {
      const c = qx[head], r = qy[head]; head++;
      const d = dist[r * cols + c];
      if (c + 1 < cols && dist[r * cols + c + 1] === 0xffff) { dist[r * cols + c + 1] = d + 1; qx[tail] = c + 1; qy[tail] = r; tail++; }
      if (c - 1 >= 0 && dist[r * cols + c - 1] === 0xffff) { dist[r * cols + c - 1] = d + 1; qx[tail] = c - 1; qy[tail] = r; tail++; }
      if (r + 1 < rows && dist[(r + 1) * cols + c] === 0xffff) { dist[(r + 1) * cols + c] = d + 1; qx[tail] = c; qy[tail] = r + 1; tail++; }
      if (r - 1 >= 0 && dist[(r - 1) * cols + c] === 0xffff) { dist[(r - 1) * cols + c] = d + 1; qx[tail] = c; qy[tail] = r - 1; tail++; }
    }
    return dist;
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
          rt.batchDraw(`kit_roof_${color}_${part}`, lx, ly);
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
        rt.batchDraw(`kit_roof_${color}_${part}`, lx, ly);
      }
    }
    rt.endDraw();
    // 문(중앙 하단) + 처마 그림자 — Graphics 1회 드로우
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    if (doorCol >= 0 && !tiny) {
      const lx = (doorCol - comp.c0) * tr, ly = (comp.r1 - comp.r0) * tr;
      g.fillStyle(0x2a2f36, 1); g.fillRect(lx + 9, ly + 10, 14, tr - 10);
      g.fillStyle(0x6b4a30, 1); g.fillRect(lx + 10, ly + 11, 12, tr - 12);
      g.fillStyle(0xe8c86a, 1); g.fillRect(lx + 19, ly + 22, 2, 2);
    }
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
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const ch = at(c, r);
          const keys = this.groundTex.get(ch);
          if (!keys) continue;
          const k = keys[Math.floor(hash2(seed ^ 0x6e0d, c, r) * keys.length) % keys.length];
          slot.rt.batchDraw(k, (c - c0) * tr, (r - r0) * tr);
          // 직각삼각형 대각 엣지(101차 후속 4 — 사용자 제안 "4방위 직각삼각형 타일"): 계단식 경계를 45°로.
          //  이웃 두 변 + 대각이 같은 지형 B면 그 모서리에 B의 삼각형을 얹는다 (잔디·모래·부두 ↔ 맨땅.
          //  차도·보도는 벡터 밴드가 곡선으로 그리므로 여기서는 맨땅과 같은 군으로 취급)
          const grp = (t: string): string => (t === 'r' || t === 'w' ? '.' : t);
          const nN = grp(at(c, r - 1)), nS = grp(at(c, r + 1)), nW = grp(at(c - 1, r)), nE = grp(at(c + 1, r));
          const tri = (a: string, b: string, d0: string, q: 'ne' | 'nw' | 'se' | 'sw'): boolean => {
            const d = grp(d0);
            if (a !== b || a === grp(ch) || d !== a) return false;
            const bk = this.groundTex.get(a);
            if (!bk) return false;
            const tk = `${bk[0]}_tri_${q}`;
            if (!this.scene.textures.exists(tk)) return false;
            slot.rt.batchDraw(tk, (c - c0) * tr, (r - r0) * tr);
            triAt.set(r * cols + c, [q, a]);
            return true;
          };
          // 차도가 잘리는 쪽이 아니라 **차도가 보도를 파고드는** 대각도 같은 규칙으로 처리된다
          tri(nN, nE, at(c + 1, r - 1), 'ne') || tri(nN, nW, at(c - 1, r - 1), 'nw')
            || tri(nS, nE, at(c + 1, r + 1), 'se') || tri(nS, nW, at(c - 1, r + 1), 'sw');
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
          const d = this.waterDist[r * cols + c];
          let bucket = bucketOf(d);
          // 암초/여 — 5m/타일에서는 노이즈 스케일·임계를 좁혀 "패치 노이즈"가 아니라
          // 성긴 여밭으로 읽히게 한다 (101차 — 구 0.74/거리 3~26은 절반이 얼룩졌다)
          const reefNoise = noise2(seed & 0x7fffffff, c / 7, r / 7);
          const isReef = d >= 5 && d <= 18 && reefNoise > 0.82;
          if (isReef) bucket = Math.max(0, bucket - 1);
          const ramp = DEPTH_RAMP[bucket];
          // 규칙적 체커는 격자가 도드라진다 — 해시 랜덤 2톤 (부드러운 수면 잡음)
          g.fillStyle(h1 > 0.5 ? ramp[0] : ramp[1], 1);
          g.fillRect(lx, ly, tr, tr);
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
          // 해안 포말 — 뭍과 맞닿은 물 타일 가장자리
          g.fillStyle(COL.foam, 0.4);
          if (at(c, r - 1) !== '~') g.fillRect(lx, ly, tr, 2);
          if (at(c, r + 1) !== '~') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (at(c - 1, r) !== '~') g.fillRect(lx, ly, 2, tr);
          if (at(c + 1, r) !== '~') g.fillRect(lx + tr - 2, ly, 2, tr);
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

        // ── 육상 기본색 (Kenney 베이스가 깔린 타일은 접경 처리만) ──
        if (based) {
          if (ch === 's') {
            g.fillStyle(COL.sandWet, 0.85);
            if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
            if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
            if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
            if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
          } else if (ch === 'b') {
            // 방파제 — 베이스는 청회색 포장(타일셋), 계선벽 캡·계선주는 절차 유지
            g.fillStyle(COL.pierEdge, 1);
            const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
            const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
            if (wN) g.fillRect(lx, ly, tr, 4);
            if (wS) g.fillRect(lx, ly + tr - 4, tr, 4);
            if (wW) g.fillRect(lx, ly, 4, tr);
            if (wE) g.fillRect(lx + tr - 4, ly, 4, tr);
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
