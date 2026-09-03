/**
 * @file TilesetManifest.ts
 * @description 오픈소스/생성 타일셋 스프라이트 매니페스트 (101차 후속 — `public/tileset/`).
 *
 * 원본: `pixelazed/tileset/` → `tools/extract_tileset_assets.py build`가 트림/재조립해 출력.
 *  - gem/  Gemini 생성 + 사용자 piskel 편집 (고해상 — 빌딩 5·팝업 4·횟집 2·정자·테트라·경계·NPC 5)
 *  - td/   TopDownCityPack (FisherG, 자유 이용 — 12px 그리드 도트: 나무·가로등·벤치·주택 …)
 *  - kn/   Kenney Roguelike Modern City (CC0 — 16px: 차량·노점·나무·프롭)
 *  - ttp/  사용자 제작 TTP(테트라포드)·해안 접경 시트 (`pixelazed/tileset/1.png`·`2.png` →
 *          `extract_tileset_assets.py ttp` — 타일 32px(TR 1:1) · 테트라포드 스프라이트 3크기 × 좌우 플립)
 *  - coast/ 사용자 제작 해안 세트 (`돌 방파제 그리드`·`방파제 바위 및 바다 경계면 모서리`·
 *          `부두 플랫폼 모서리` → `extract_tileset_assets.py coast` — 상판/사석/두부·바위 20·
 *          Rock-Water 4·물 상세 7·부두 모서리 4)
 * 텍스처 키 = `ts_<폴더>_<파일명>`. RegionFieldScene(심리스)이 preload에서 일괄 로드한다.
 * 전부 **PNG 직접 로드** 에셋 — 재추출 + F5로 반영 (asset-pipeline 스킬 ⓪).
 */

import { PLACEABLE_TILES, COAST_OBJECTS } from './TileCatalog.js';

export interface TilesetEntry {
  key: string;
  path: string;
}

const gem = [
  'building_1', 'building_2', 'building_3', 'building_4', 'building_5',
  'popup_1', 'popup_2', 'popup_3', 'popup_4', 'sashimi_1', 'sashimi_2',
  'jungja', 'tetra', 'boundary_port',
  'npc_fish_vendor', 'npc_grandfather', 'npc_police', 'npc_father_kid', 'npc_tourist_f',
];
const td = [
  'tree_big', 'palm', 'tree_small', 'lamp_arm', 'lamp_arm2', 'pole', 'pole2',
  'traffic_light', 'traffic_light_stop', 'signpost', 'signpost_red',
  'sign_warn', 'sign_blue', 'sign_round', 'bench', 'trash', 'hydrant',
  // 12px 격자 직접 크롭 (101차 후속 4 — 주택 6×7 · 지붕 연장 조각 · 철망 펜스 세트 · 문 · 실외기)
  'house_red', 'house_blue', 'roof_ext_red', 'roof_ext_blue',
  'fence_h', 'fence_v1', 'fence_v2', 'fence_v3', 'fence_v4',
  'door_blue', 'door_brown', 'door_white', 'ac_unit',
  // 차량 (Sprites/Vehicles — 4방향 프레임: 우측면·정면·좌측면·후면. 주차 차량 = 벽 방향에 맞는 프레임)
  ...['car', 'pickup'].flatMap((k) => ['blue', 'green', 'red'].flatMap((c) => ['right', 'down', 'left', 'up'].map((d) => `${k}_${c}_${d}`))),
];
/** 지면 오토타일 접미 — 잔디 = 블롭 완전 세트(16조합) + 이너코너 노치 4 / 포장 = 8방위 테두리 */
export const GRASS_EDGE_SUFFIXES = [
  'n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se', 'ns', 'we',
  'nse', 'nsw', 'nwe', 'swe', 'nswe',
  'notch_ne', 'notch_nw', 'notch_se', 'notch_sw',
] as const;
export const PAVED_EDGE_SUFFIXES = ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'] as const;

/** Kenney 건물 키트 — 지붕 오토타일(색 4 × 부위 18) + 벽 모듈(64×32, 5종). ×2 재베이크 후 사용.
 *  p1/p2 = 2×2 옥상 패널 블록(지붕 인테리어 타일링 변형 — 101차 잔여 해소) */
export const KENNEY_ROOF_COLORS = ['red', 'gray', 'light', 'tan'] as const;
export const KENNEY_ROOF_PARTS = [
  'nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e', 'in', 'vent',
  'p1_nw', 'p1_ne', 'p1_sw', 'p1_se', 'p2_nw', 'p2_ne', 'p2_sw', 'p2_se',
] as const;
export const KENNEY_WALLS = ['brick_red', 'brick_gray', 'brick_tan', 'glass', 'white'] as const;
const knKit = [
  ...KENNEY_ROOF_COLORS.flatMap((c) => KENNEY_ROOF_PARTS.map((p) => `roof_${c}_${p}`)),
  ...KENNEY_WALLS.map((w) => `wall_${w}`),
];
const kn = [
  'car_a', 'car_b', 'car_c', 'car_d', 'car_e', 'car_f',          // 측면 차량
  'car_g', 'car_h', 'car_i', 'car_j', 'car_k', 'car_l',          // 탑다운 차량 (도로 각도 회전)
  'stall_green', 'stall_orange',
  'ktree_a', 'ktree_b', 'ktree_c', 'ktree_d', 'ktree_e', 'ktree_f',
  'klamp', 'klamp2', 'ktrash',
  // 지면 베이스 (16px — TR 32에서 ×2 정수 재베이크, SeamlessChunks.ensureGroundTextures)
  'ground_asphalt_0',
  'ground_grass_0', 'ground_grass_1',
  'ground_dirt_0', 'ground_dirt_1',
  'ground_pave_0',
  'ground_tan_0', 'ground_tan_1',
  'ground_sand_0', 'ground_sand_1',
  'ground_pier_0', 'ground_pier_1',
  // 지면 오토타일 엣지/코너 (extract_tileset_assets EDGE_CELLS — 접미 = 다른 지형이 보이는 방위)
  ...GRASS_EDGE_SUFFIXES.map((s) => `ground_grass_edge_${s}`),
  ...PAVED_EDGE_SUFFIXES.flatMap((s) => [`ground_tan_edge_${s}`, `ground_pier_edge_${s}`, `ground_pave_edge_${s}`]),
  ...knKit,
];

/** TTP(테트라포드)·해안 접경 세트 — 타일은 **TR(32px) 1:1**이라 런타임 재샘플이 없다.
 *  edge_ · corner_ 셀 = 모래(북)↔물(남) 접경 → SeamlessChunks가 4방위로 회전 베이크해서 쓴다.
 *  ttp_{l,m,s}(+_fx) = 방파제 외해측 피복 유닛(56/38/26px · 좌우 플립본). */
export const TTP_EDGE_TILES = ['edge_still', 'edge_ripple', 'edge_foam', 'edge_foam2', 'corner_sw', 'corner_ne'] as const;
export const TTP_UNITS = ['ttp_l', 'ttp_m', 'ttp_s'] as const;
const ttp = [
  ...TTP_EDGE_TILES, 'corner_land', 'corner_se',
  'water_still', 'water_still2', 'water_ripple', 'water_rip1', 'water_rip2', 'water_splash', 'water_foam',
  'base_concrete', 'base_sand', 'tile_ttp_a', 'tile_ttp_b',
  ...TTP_UNITS.flatMap((u) => [u, `${u}_fx`]),
];

/** 해안 세트(105차) — 전부 32px(TR 1:1). 물이 섞인 셀은 **바다를 투명으로 판** 오버레이다.
 *  deck/rubble = 방파제 몸통(불투명) · rubble_toe/pier_edge = 물 타일 위에 얹는 접경 ·
 *  rock_NN = 갯바위 산포 스프라이트(알파 트림) · rockwater = 물속 바위 + 포말 */
export const COAST_DECKS = ['deck_0', 'deck_1', 'deck_2', 'deck_3'] as const;
export const COAST_RUBBLE = ['rubble_0', 'rubble_1', 'rubble_2', 'rubble_3'] as const;
export const COAST_ROCK_COUNT = 20;
/** 물 타일 위 접경 오버레이 — 원본에서 **뭍이 있는 방위**(SeamlessChunks가 4방위로 회전 베이크) */
export const COAST_EDGE_SRC: { name: string; landDir: number }[] = [
  { name: 'rubble_toe_0', landDir: 0 }, { name: 'rubble_toe_1', landDir: 0 },
  { name: 'pier_edge_1', landDir: 0 }, { name: 'pier_edge_3', landDir: 3 },
];
const coast = [
  ...COAST_DECKS, ...COAST_RUBBLE, 'deck_seam', 'head_0', 'head_1',
  'rubble_toe_0', 'rubble_toe_1', 'submerged_0', 'submerged_1', 'submerged_2',
  'pier_edge_0', 'pier_edge_1', 'pier_edge_2', 'pier_edge_3',
  ...Array.from({ length: COAST_ROCK_COUNT }, (_, i) => `rock_${String(i + 1).padStart(2, '0')}`),
  'rockwater_0', 'rockwater_1', 'rockwater_2', 'rockwater_3',
  'wd_caustic_0', 'wd_caustic_1', 'wd_coast_sand', 'wd_shallow', 'wd_deep',
  'wd_coast_rock_0', 'wd_coast_rock_1',
];

/** 텍스처 키 → 공개 경로 (편집기 팔레트 썸네일용) */
export function tilesetPathOf(key: string): string | null {
  const e = TILESET_MANIFEST.find((m) => m.key === key);
  return e ? e.path : null;
}

/** 탑다운 차량 키 (세로 진행 스프라이트 — 도로 세그먼트 각도 + 90°로 회전) */
export const CAR_TOPDOWN_KEYS = ['ts_kn_car_g', 'ts_kn_car_h', 'ts_kn_car_i', 'ts_kn_car_j', 'ts_kn_car_k', 'ts_kn_car_l'];

/** 섬 사진 시트(115차 — `tools/pixelize_islet.py`): `ts_<name>_sheet` 1장을 런타임이 셀 `ts_<name>_r{r}c{c}`로
 *  잘라 tileTex로 쓴다(SeamlessChunks.setTileTex). 섬을 추가하면 이름만 여기 올린다. */
export const ISLET_SHEETS = ['jodo'] as const;

const base: TilesetEntry[] = [
  ...ISLET_SHEETS.map((n) => ({ key: `ts_${n}_sheet`, path: `tileset/${n}/sheet.png` })),
  ...gem.map((n) => ({ key: `ts_gem_${n}`, path: `tileset/gem/${n}.png` })),
  ...td.map((n) => ({ key: `ts_td_${n}`, path: `tileset/td/${n}.png` })),
  ...kn.map((n) => ({ key: `ts_kn_${n}`, path: `tileset/kn/${n}.png` })),
  ...ttp.map((n) => ({ key: `ts_ttp_${n}`, path: `tileset/ttp/${n}.png` })),
  ...coast.map((n) => ({ key: `ts_coast_${n}`, path: `tileset/coast/${n}.png` })),
];

/** `ts_<set>_<name>` → public 경로 (편집기 카탈로그 키를 자동 등록할 때 쓴다 — 106차) */
function catalogPath(key: string): string | null {
  const m = /^ts_(coast|ttp|kn|td|gem)_(.+)$/.exec(key);
  return m ? `tileset/${m[1]}/${m[2]}.png` : null;
}

// 편집기 카탈로그(자동 생성)에 있는 키 중 위 목록에 없는 것은 여기서 채운다 —
// 시트를 늘려도 manifest를 손으로 고칠 필요가 없다.
const known = new Set(base.map((e) => e.key));
const extra: TilesetEntry[] = [];
for (const key of [...PLACEABLE_TILES.map((t) => t.key), ...COAST_OBJECTS.map((o) => o.tex)]) {
  if (known.has(key)) continue;
  const path = catalogPath(key);
  if (!path) continue;
  known.add(key);
  extra.push({ key, path });
}

export const TILESET_MANIFEST: TilesetEntry[] = [...base, ...extra];
