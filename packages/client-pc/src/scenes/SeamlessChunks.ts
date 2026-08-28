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
import { CAR_TOPDOWN_KEYS } from '../data/TilesetManifest.js';

export interface PropDef {
  id: string;
  label: string;
  /** 텍스처 키 — `ts_*`(타일셋 PNG 직접 로드) 또는 `smx_*`(절차 베이크) */
  tex: string;
  /** 편집기 팔레트 카테고리 */
  cat: '자연' | '시설물' | '건물' | '차량' | 'NPC' | '해안';
  /** 표시 배율 (정수 배율 우선 — 픽셀아트 보존. NPC는 0.5 = 2:1 다운샘플) */
  scale?: number;
  /** 바다 타일 전용 */
  water?: boolean;
  /** 앵커 — 기본 bottom(발밑 = 타일 하단 중앙). center = 타일 중앙 (지형 패치류) */
  anchor?: 'bottom' | 'center';
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
  // 건물
  { id: 'house_red', label: '주택(빨강)', tex: 'ts_td_house_red', cat: '건물' },
  { id: 'house_blue', label: '주택(파랑)', tex: 'ts_td_house_blue', cat: '건물' },
  { id: 'garage', label: '차고', tex: 'ts_td_garage', cat: '건물' },
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
  { id: 'boat', label: '어선', tex: 'smx_boat', cat: '차량', water: true },
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
  /** 이 청크의 프롭 스프라이트(나무 등 — y-sort) */
  deco: Phaser.GameObjects.GameObject[];
}

/** 지형 팔레트 (101차 — mock_styled 톤) */
const COL = {
  land: 0xcbb98d, landAlt: 0xc4b287, landSpeck: 0xb2a077,
  grass: 0x69a24c, grassAlt: 0x639a47, grassDark: 0x578b3e, grassLight: 0x7fb35f,
  sand: 0xe8d9a0, sandAlt: 0xe2d298, sandSpeck: 0xcdbd85, sandWet: 0xc9b986,
  road: 0x4c4f54, roadAlt: 0x484b50, roadLine: 0xe8ecf0, roadCenter: 0xe8c23a,
  walk: 0xb3b8bf, walkAlt: 0xaeb3ba, walkJoint: 0x999fa7, curb: 0xd2d6dc,
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
    const groups: [string, string[]][] = [
      ['.', ['tan_0', 'tan_1', 'tan_2']],          // 맨땅 = 베이지 포장 (항구 도시 광장 톤)
      [',', ['grass_0', 'grass_1', 'grass_2']],
      ['r', ['asphalt_0', 'asphalt_1', 'asphalt_2']],
      ['w', ['pave_0', 'pave_1', 'pave_2']],
      ['s', ['sand_0', 'sand_1']],
      ['b', ['pier_0', 'pier_1', 'pier_2']],
    ];
    const tm = this.scene.textures;
    for (const [ch, names] of groups) {
      const keys: string[] = [];
      for (const n of names) {
        const src = `ts_kn_ground_${n}`;
        if (!tm.exists(src)) continue;
        const dst = `${src}_x${scale}`;
        if (!tm.exists(dst)) {
          const img = tm.get(src).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
          const cv = tm.createCanvas(dst, tr, tr);
          if (!cv) continue;
          const ctx = cv.getContext();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, tr, tr);
          cv.refresh();
        }
        keys.push(dst);
      }
      if (keys.length > 0) this.groundTex.set(ch, keys);
    }
  }

  /** 차도 벡터를 청크에 배정 (세그먼트 bbox + 폭 여유) */
  private indexRoads(): void {
    this.roadsByChunk.clear();
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

  /** 이동 불가(충돌) 타일 — 바다·건물 */
  private isBlockedChar(ch: string): boolean {
    return ch === '~' || ch === '#';
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
    bake('smx_boat', 40, 22, (g) => {
      g.fillStyle(0x1c3c5c, 0.35); g.fillEllipse(20, 18, 36, 6);
      g.fillStyle(0x2e4a66, 1);
      g.fillPoints([{ x: 2, y: 10 }, { x: 36, y: 10 }, { x: 32, y: 17 }, { x: 6, y: 17 }], true);
      g.fillStyle(0xe8eef2, 1); g.fillRect(4, 8, 30, 3);
      g.fillRect(20, 2, 9, 7);
      g.fillStyle(0x4a7aa8, 1); g.fillRect(22, 4, 5, 3);
      g.fillStyle(0xd0483c, 1); g.fillRect(6, 11, 12, 2);
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
    const slot: ChunkSlot = { rt, baked: false, bodies: [], deco: [] };
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
    for (const b of slot.bodies) { this.walls.remove(b); b.destroy(); }
    for (const d of slot.deco) d.destroy();
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
        const blocked = c < c1 && this.isBlockedChar(this.tileAt(c, r));
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
  // 프롭 스프라이트 (L3) — 나무: 잔디 위 결정적 산포, y-sort (플레이어와 동일식)
  // ═══════════════════════════════════════════════════
  private buildChunkDeco(cc: number, cr: number, slot: ChunkSlot): void {
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
        slot.deco.push(this.scene.add.image(x, y, tex).setOrigin(0.5, 1).setDepth(20 + y * 0.001));
      }
    }

    // ── 차량 — 차도 벡터를 따라 결정적 산포 (폭 ≥ 3타일, 첫 차로 중앙, 세그먼트 각도 회전) ──
    if (hasTs && this.cfg.roads) {
      const list = this.roadsByChunk.get(cr * this.chunkCols + cc) ?? [];
      for (const ri of list) {
        const road = this.cfg.roads[ri];
        if (road.w < 3) continue;
        const lanes = Math.max(1, road.lanes ?? 1);
        const laneW = (road.w / 2 - 0.35) / lanes;
        for (let i = 0; i < road.pts.length - 1; i++) {
          const [x0, y0] = road.pts[i], [x1, y1] = road.pts[i + 1];
          const dx = x1 - x0, dy = y1 - y0;
          const len = Math.hypot(dx, dy);
          if (len < 6) continue;
          const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
          for (let t = 4; t < len - 3; t += 9) {
            const h = hash2(seed ^ 0xca7, Math.round((x0 + ux * t) * 7), Math.round((y0 + uy * t) * 7));
            if (h > 0.32) continue;
            const side = h < 0.16 ? 1 : -1;            // 우측통행 — 진행 방향별 차로
            const px = x0 + ux * t + nx * side * laneW * 0.5;
            const py = y0 + uy * t + ny * side * laneW * 0.5;
            const tc = Math.floor(px), trr = Math.floor(py);
            if (tc < c0 || tc >= c1 || trr < r0 || trr >= r1) continue;
            if (this.tileAt(tc, trr) !== 'r') continue;
            const tex = CAR_TOPDOWN_KEYS[Math.floor(hash2(seed ^ 0xc4, tc, trr) * CAR_TOPDOWN_KEYS.length) % CAR_TOPDOWN_KEYS.length];
            if (!this.scene.textures.exists(tex)) continue;
            const ang = Math.atan2(uy, ux) + Math.PI / 2 + (side < 0 ? Math.PI : 0);
            const img = this.scene.add.image(px * tr, py * tr, tex)
              .setOrigin(0.5, 0.5).setScale(2).setRotation(ang)
              .setDepth(20 + py * tr * 0.001);
            slot.deco.push(img);
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
    // 점선 — 폴리라인 전체에 위상(phase)을 이어 정점에서 끊기지 않게
    const dashed = (pl: [number, number][], dash: number, gap: number): void => {
      let phase = 0;
      for (let i = 0; i < pl.length - 1; i++) {
        const ax = lx(pl[i][0]), ay = ly(pl[i][1]), bx = lx(pl[i + 1][0]), by = ly(pl[i + 1][1]);
        const len = Math.hypot(bx - ax, by - ay);
        if (len < 0.5) continue;
        const ux = (bx - ax) / len, uy = (by - ay) / len;
        let t = phase;
        while (t < len) {
          const e = Math.min(len, t + dash);
          if (e > 0 && e > t) g.lineBetween(ax + ux * Math.max(0, t), ay + uy * Math.max(0, t), ax + ux * e, ay + uy * e);
          t += dash + gap;
        }
        phase = t - len;   // 다음 세그먼트로 위상 이월
        if (phase > dash + gap) phase -= dash + gap;
        phase = phase - (dash + gap);
      }
    };
    for (const ri of list) {
      const road = this.cfg.roads[ri];
      if (road.pts.length < 2) continue;
      const halfW = road.w / 2;
      const lanesPerDir = Math.max(1, road.lanes ?? 1);
      // 교차부 겹침 완화 — 폴리라인 **양 끝점만** 폭의 절반만큼 안쪽으로 (정점은 유지 = 연결성)
      const pts = road.pts.map((p) => [p[0], p[1]] as [number, number]);
      const trim = (i0: number, i1: number, amount: number): void => {
        const dx = pts[i1][0] - pts[i0][0], dy = pts[i1][1] - pts[i0][1];
        const len = Math.hypot(dx, dy);
        if (len <= amount * 1.5) return;
        pts[i0] = [pts[i0][0] + (dx / len) * amount, pts[i0][1] + (dy / len) * amount];
      };
      const inset = halfW * 0.8;
      trim(0, 1, inset);
      trim(pts.length - 1, pts.length - 2, inset);
      // 차선 기하 — 가장자리 여유 0.35타일(7px) 안쪽에 차로를 균등 배치 (차도 타일 안에 들어온다)
      const edgeM = 0.35;
      const laneW = Math.max(0.5, (halfW - edgeM) / lanesPerDir);
      if (road.w >= 3) {
        g.lineStyle(2, COL.roadCenter, 0.95);
        solid(pts);                                  // 중앙선 — 노란 실선
      }
      g.lineStyle(2, COL.roadLine, 0.85);
      for (let k = 1; k < lanesPerDir; k++) {        // 차선 — 흰 점선
        dashed(SeamlessChunks.offsetPolyline(pts, k * laneW), 12, 10);
        dashed(SeamlessChunks.offsetPolyline(pts, -k * laneW), 12, 10);
      }
      if (road.w >= 4) {                             // 가장자리 실선 — 차도 안쪽
        g.lineStyle(1.5, COL.roadLine, 0.6);
        solid(SeamlessChunks.offsetPolyline(pts, halfW - edgeM));
        solid(SeamlessChunks.offsetPolyline(pts, -(halfW - edgeM)));
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
    if (useGround) {
      slot.rt.beginDraw();
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const keys = this.groundTex.get(at(c, r));
          if (!keys) continue;
          const k = keys[Math.floor(hash2(seed ^ 0x6e0d, c, r) * keys.length) % keys.length];
          slot.rt.batchDraw(k, (c - c0) * tr, (r - r0) * tr);
        }
      }
      slot.rt.endDraw();
    }

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
          } else if (ch === 'r') {
            g.fillStyle(COL.curb, 0.9);
            if (at(c, r - 1) === 'w') g.fillRect(lx, ly, tr, 2);
            if (at(c, r + 1) === 'w') g.fillRect(lx, ly + tr - 2, tr, 2);
            if (at(c - 1, r) === 'w') g.fillRect(lx, ly, 2, tr);
            if (at(c + 1, r) === 'w') g.fillRect(lx + tr - 2, ly, 2, tr);
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
          // ── 건물 — 컴포넌트 지붕 (박공 2사면 / 대형 패널) ──
          const comp = this.comps[this.compOf[r * cols + c]];
          if (comp && comp.big) {
            const [pa, pb, seam] = ROOF_BIG;
            const wide = (comp.c1 - comp.c0) >= (comp.r1 - comp.r0);
            g.fillStyle((wide ? r % 2 : c % 2) === 0 ? pa : pb, 1);
            g.fillRect(lx, ly, tr, tr);
            g.fillStyle(seam, 0.8);
            if (wide) { if ((c - comp.c0) % 3 === 0) g.fillRect(lx, ly, 2, tr); }
            else if ((r - comp.r0) % 3 === 0) g.fillRect(lx, ly, tr, 2);
            if (h1 > 0.96) {   // 채광창
              g.fillStyle(0xa8c4d8, 0.9);
              g.fillRect(lx + 6, ly + 7, 8, 6);
            }
          } else if (comp) {
            const ov = this.cfg.roofOverrides?.[`${comp.c0},${comp.r0}`];
            const [lightC, darkC, ridgeC] = ROOFS[(ov ?? comp.palIdx) % ROOFS.length];
            const wide = (comp.c1 - comp.c0) >= (comp.r1 - comp.r0);
            const mid = wide ? (comp.r0 + comp.r1) / 2 : (comp.c0 + comp.c1) / 2;
            const pos = wide ? r : c;
            g.fillStyle(pos <= mid ? lightC : darkC, 1);
            g.fillRect(lx, ly, tr, tr);
            // 기와 결 (사면 방향 얇은 줄)
            g.fillStyle(pos <= mid ? darkC : lightC, 0.25);
            if (wide) g.fillRect(lx, ly + (checker ? 6 : 13), tr, 1);
            else g.fillRect(lx + (checker ? 6 : 13), ly, 1, tr);
            // 용마루
            g.fillStyle(ridgeC, 1);
            if (wide) {
              if (Math.abs(pos - mid) < 0.6) g.fillRect(lx, ly + tr / 2 - 2, tr, 4);
            } else if (Math.abs(pos - mid) < 0.6) {
              g.fillRect(lx + tr / 2 - 2, ly, 4, tr);
            }
          } else {
            g.fillStyle(0x5a5f68, 1);
            g.fillRect(lx, ly, tr, tr);
          }
          // 처마 외곽선
          g.lineStyle(2, COL.buildEdge, 1);
          if (at(c - 1, r) !== '#') g.lineBetween(lx + 1, ly, lx + 1, ly + tr);
          if (at(c + 1, r) !== '#') g.lineBetween(lx + tr - 1, ly, lx + tr - 1, ly + tr);
          if (at(c, r - 1) !== '#') g.lineBetween(lx, ly + 1, lx + tr, ly + 1);
          if (at(c, r + 1) !== '#') g.lineBetween(lx, ly + tr - 1, lx + tr, ly + tr - 1);
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
    for (const [idx, slot] of [...this.resident]) this.unloadChunk(idx, slot);
    for (const rt of this.rtPool) rt.destroy();
    this.rtPool = [];
    this.walls.destroy(true);
  }
}
