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
  'house_red', 'house_blue', 'garage',
];
const kn = [
  'car_a', 'car_b', 'car_c', 'car_d', 'car_e', 'car_f',          // 측면 차량
  'car_g', 'car_h', 'car_i', 'car_j', 'car_k', 'car_l',          // 탑다운 차량 (도로 각도 회전)
  'stall_green', 'stall_orange',
  'ktree_a', 'ktree_b', 'ktree_c', 'ktree_d', 'ktree_e', 'ktree_f',
  'klamp', 'klamp2', 'ktrash',
  // 지면 베이스 (16px — TR 32에서 ×2 정수 재베이크, SeamlessChunks.ensureGroundTextures)
  'ground_asphalt_0', 'ground_asphalt_1', 'ground_asphalt_2',
  'ground_grass_0', 'ground_grass_1', 'ground_grass_2',
  'ground_dirt_0', 'ground_dirt_1', 'ground_dirt_2',
  'ground_pave_0', 'ground_pave_1', 'ground_pave_2',
  'ground_tan_0', 'ground_tan_1', 'ground_tan_2',
  'ground_sand_0', 'ground_sand_1',
  'ground_pier_0', 'ground_pier_1', 'ground_pier_2',
];

/** 탑다운 차량 키 (세로 진행 스프라이트 — 도로 세그먼트 각도 + 90°로 회전) */
export const CAR_TOPDOWN_KEYS = ['ts_kn_car_g', 'ts_kn_car_h', 'ts_kn_car_i', 'ts_kn_car_j', 'ts_kn_car_k', 'ts_kn_car_l'];

export const TILESET_MANIFEST: TilesetEntry[] = [
  ...gem.map((n) => ({ key: `ts_gem_${n}`, path: `tileset/gem/${n}.png` })),
  ...td.map((n) => ({ key: `ts_td_${n}`, path: `tileset/td/${n}.png` })),
  ...kn.map((n) => ({ key: `ts_kn_${n}`, path: `tileset/kn/${n}.png` })),
];
