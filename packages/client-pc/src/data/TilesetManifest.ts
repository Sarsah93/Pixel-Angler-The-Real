/**
 * @file TilesetManifest.ts
 * @description 오픈소스/생성 타일셋 스프라이트 매니페스트 (101차 후속 — `public/tileset/`).
 *
 * 원본: `pixelazed/tileset/` → `tools/extract_tileset_assets.py build`가 트림/재조립해 출력.
 *  - gem/  Gemini 생성 + 사용자 piskel 편집 (고해상 — 빌딩 5·팝업 4·횟집 2·정자·테트라·경계·NPC 5)
 *  - td/   TopDownCityPack (FisherG, 자유 이용 — 12px 그리드 도트: 나무·가로등·벤치·주택 …)
 *  - kn/   Kenney Roguelike Modern City (CC0 — 16px: 차량·노점·나무·프롭)
 * 텍스처 키 = `ts_<폴더>_<파일명>`. RegionFieldScene(심리스)이 preload에서 일괄 로드한다.
 * 전부 **PNG 직접 로드** 에셋 — 재추출 + F5로 반영 (asset-pipeline 스킬 ⓪).
 */

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
/** Kenney 건물 키트 — 지붕 오토타일(색 4 × 부위 10) + 벽 모듈(64×32, 5종). ×2 재베이크 후 사용 */
export const KENNEY_ROOF_COLORS = ['red', 'gray', 'light', 'tan'] as const;
export const KENNEY_ROOF_PARTS = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e', 'in', 'vent'] as const;
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
  ...knKit,
];

/** 텍스처 키 → 공개 경로 (편집기 팔레트 썸네일용) */
export function tilesetPathOf(key: string): string | null {
  const e = TILESET_MANIFEST.find((m) => m.key === key);
  return e ? e.path : null;
}

/** 탑다운 차량 키 (세로 진행 스프라이트 — 도로 세그먼트 각도 + 90°로 회전) */
export const CAR_TOPDOWN_KEYS = ['ts_kn_car_g', 'ts_kn_car_h', 'ts_kn_car_i', 'ts_kn_car_j', 'ts_kn_car_k', 'ts_kn_car_l'];

export const TILESET_MANIFEST: TilesetEntry[] = [
  ...gem.map((n) => ({ key: `ts_gem_${n}`, path: `tileset/gem/${n}.png` })),
  ...td.map((n) => ({ key: `ts_td_${n}`, path: `tileset/td/${n}.png` })),
  ...kn.map((n) => ({ key: `ts_kn_${n}`, path: `tileset/kn/${n}.png` })),
];
