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
import type { RegionRoad, RegionProp, RegionTileTex, RegionLight, RegionStair, RegionArmor, TileEdge, LevelCell } from '@tra/core';
import { COAST_OBJECTS } from '../data/TileCatalog.js';
import {
  seamBetween, terrainClass, terrainPaint, terrainGroup, reliefHeight, castsReliefShadow, terrainDef, isRockTerrain,
  canStep, stairHighEdges,
} from '@tra/core';
import { GRASS_EDGE_SUFFIXES, PAVED_EDGE_SUFFIXES, KENNEY_ROOF_COLORS, KENNEY_ROOF_PARTS, TTP_EDGE_TILES, TTP_UNITS, COAST_DECKS, COAST_RUBBLE, COAST_EDGE_SRC, COAST_ROCK_COUNT } from '../data/TilesetManifest.js';
import { hasUsableTexture } from '../ui/CanvasTextureGuard.js';
import { SURFACES, paintSurfaceAtlas, paintRockAtlas, paintTetrapod, paintStone, stoneCanvasSize, TETRA_ART, type SurfaceName, type TetraTone, type StoneTone } from './SurfaceArt.js';

let seamlessTextureSerial = 0;

export interface PropDef {
  id: string;
  label: string;
  /** 텍스처 키 — `ts_*`(타일셋 PNG 직접 로드) 또는 `smx_*`(절차 베이크) */
  tex: string;
  /** 편집기 팔레트 카테고리 */
  cat: '자연' | '시설물' | '건물' | '건물요소' | '차량' | '해안' | '돌 & 바위' | '해안 구조물';
  /** 표시 배율 (정수 배율 우선 — 픽셀아트 보존. NPC는 0.5 = 2:1 다운샘플) */
  scale?: number;
  /** 바다 타일 전용 */
  water?: boolean;
  /** 앵커 — 기본 bottom(발밑 = 타일 하단 중앙). center = 타일 중앙 (지형 패치류) */
  anchor?: 'bottom' | 'center';
  /** 충돌 없음 (기본은 전부 충돌 — 101차 후속 4 "캐릭터가 오브젝트를 관통"). 지붕 연장 조각 등 장식만 false */
  passable?: boolean;
}

/** 프롭 배치 변환(106차) — 편집기 회전·반전·겹침 허용 */
export interface PropTransform {
  rot?: 0 | 1 | 2 | 3;
  fx?: boolean;
  fy?: boolean;
  /** 겹침 허용 배치 — 충돌 바디 생략 */
  free?: boolean;
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
/**
 * 주차 차량 배율 (150차) — 원본 25×44px. 구 1.25는 길이 55px로 캐릭터(52px)와 거의 같아
 * 차가 작아 보였다. ×1.2 = 1.5 → 66px(사용자 지정 1.2~1.4배 밴드).
 */
const PARKED_CAR_SCALE = 1.5;

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
  // TopDown 주차용 차량/픽업 — 3/4 시점 4방향 프레임 (회전 금지 — 벽 방향에 맞는 프레임을 고른다)
  { id: 'pickup_blue', label: '픽업트럭 파랑', tex: 'ts_td_pickup_blue_up', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'pickup_green', label: '픽업트럭 초록', tex: 'ts_td_pickup_green_up', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'pickup_red', label: '픽업트럭 빨강', tex: 'ts_td_pickup_red_up', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'pickup_blue_side', label: '픽업트럭 파랑(옆)', tex: 'ts_td_pickup_blue_right', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'pickup_red_side', label: '픽업트럭 빨강(옆)', tex: 'ts_td_pickup_red_left', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'tdcar_blue', label: '승용차(3/4) 파랑', tex: 'ts_td_car_blue_up', cat: '차량', scale: PARKED_CAR_SCALE },
  { id: 'tdcar_red_side', label: '승용차(3/4) 빨강(옆)', tex: 'ts_td_car_red_right', cat: '차량', scale: PARKED_CAR_SCALE },
  // 어선 — 승용차(≈44px)의 2배 (사용자 지시). 오픈소스 두 팩에는 배 스프라이트가 없어 절차 베이크 유지
  { id: 'boat', label: '어선', tex: 'smx_boat', cat: '차량', water: true, scale: 2 },
  // 하역 크레인(112차 항만 디테일) — 절차 베이크. 안벽 위 자동 산포 + 편집기 수동 배치
  { id: 'crane', label: '하역 크레인', tex: 'smx_crane', cat: '시설물' },
  // 정자·전망대(183차 영금정) — 절차 베이크. OSM `amenity=shelter`(pavilion)은 '#' 건물이 아니라 이 프롭으로 세운다
  { id: 'pavilion', label: '정자(전망대)', tex: 'smx_pavilion', cat: '시설물' },
  // (166차) 구 gem NPC 프롭 5종 삭제 — 마을 사람은 `FieldNpcSystem`(characterOf)이 만들고 스스로 걷는다.
  // 해안 (지형 패치 — 타일 중앙 앵커, 부두↔바다 경계에 놓는다)
  { id: 'tetra', label: '테트라포드 석축', tex: 'ts_ttp_ttp_l', cat: '해안', anchor: 'center' },
  // 항로표지(114차) — lights.json이 자동 배치하고, 편집기 팔레트에서도 수동 배치 가능
  { id: 'lighthouse_red', label: '등대(홍색)', tex: 'smx_light_red', cat: '해안' },
  { id: 'lighthouse_green', label: '등대(백색·녹등)', tex: 'smx_light_green', cat: '해안' },
  { id: 'lighthouse_white', label: '등대(백색)', tex: 'smx_light_white', cat: '해안' },
  { id: 'lighthouse_major', label: '대형 등대', tex: 'smx_light_major', cat: '해안' },
  { id: 'beacon_green', label: '등주(녹색)', tex: 'smx_beacon_green', cat: '해안' },
  { id: 'boundary_port', label: '부두 경계(바다)', tex: 'ts_gem_boundary_port', cat: '해안', anchor: 'center' },  // ── 해안 시트 오브젝트(106차 자동 생성 카탈로그) — 방파제 바위 20 · 물속 바위 4 · 테트라포드 3
  //    바위는 지형 위 장식(중앙 앵커·충돌 있음) · 테트라포드는 겹쳐 쌓는 대상이라 편집기 '겹침 허용'과 함께 쓴다.
  ...COAST_OBJECTS.map((o): PropDef => ({
    id: o.id, label: o.label, tex: o.tex, cat: o.cat as PropDef['cat'], anchor: 'center',
    ...(o.id.startsWith('coast_rockwater') ? { water: true } : {}),
  })),
];

export interface SeamlessChunksConfig {
  /** 지형 문자 그리드 — [row] 문자열 (seamless.json terrain) */
  terrainRows: string[];
  /** 차도 중심선 벡터 — 차선·중앙선 마킹 (없으면 마킹 생략) */
  roads?: RegionRoad[];
  /** 수동 배치 프롭 (patch.json) */
  props?: RegionProp[];
  /** 개별 타일 그림 오버라이드 (편집기 — 106차) */
  tileTex?: RegionTileTex[];
  /** 항로표지 등대·등주 (lights.json — 114차). 방파제 두부 등에 프롭으로 선다 */
  lights?: RegionLight[];
  /** 고도 층(183차 — patch.levels) · 계단 · 방파제 피복 지정 */
  levels?: [number, number, number][];
  stairs?: RegionStair[];
  armor?: RegionArmor[];
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
  /** 충돌·장식(지붕·프롭)을 만들었는가 — 선행 굽기 슬롯은 굽기만 하고 장식은 다음 기회에(182차) */
  decoBuilt: boolean;
  /** 이 청크가 소유한 건물 지붕을 모두 담은 아틀라스(182차 — 표시 목록 밖). 지붕 이미지가 프레임으로 쓴다 */
  roofAtlas?: Phaser.GameObjects.RenderTexture;
  /** 이 청크의 충돌 바디(투명 사각형) 목록 — 언로드 시 파괴 */
  bodies: Phaser.GameObjects.Rectangle[];
  /** 이 청크의 프롭 스프라이트(나무·지붕·차량 — y-sort) */
  deco: Phaser.GameObjects.GameObject[];
  /** 이 청크가 베이크한 지붕 텍스처 키 (씬 수명 동안 보존, 언로드 때 display만 해제) */
  roofKeys: string[];
  /**
   * 캐릭터를 가릴 수 있는 그림 (150차) — 타일 건물 지붕·주택 오브젝트.
   * 씬이 뒤로 들어간 플레이어를 보고 반투명하게 만든다(`deco`의 부분집합, 파괴는 deco가 담당).
   */
  occluders: OccluderObj[];
}

/** 반투명 대상이 될 수 있는 그림 — 알파와 경계 상자를 갖는다 */
export type OccluderObj = Phaser.GameObjects.Image | Phaser.GameObjects.RenderTexture;

/** 지형 팔레트 (101차 — mock_styled 톤) */
const COL = {
  land: 0xcbb98d, landAlt: 0xc4b287, landSpeck: 0xb2a077,
  grass: 0x69a24c, grassAlt: 0x639a47, grassDark: 0x578b3e, grassLight: 0x7fb35f,
  sand: 0xe8d9a0, sandAlt: 0xe2d298, sandSpeck: 0xcdbd85, sandWet: 0xc9b986,
  // 화면에 보이는 해변색 = Kenney sand(217,202,169) × 웜 틴트(#f6d47c) 실측 — 스필 디더용
  beach: 0xd1a852, beachAlt: 0xc69e4d, beachLite: 0xdfb55a,
  // 차도·보도 = Kenney 셀 실측색 (아스팔트 (11,19) = #404040 · 보도 (1,20) = #9daaab · 횡단보도 흰색 #d6dbe6)
  road: 0x404040, roadAlt: 0x3c3c3c, roadSpeck: 0x4a4a4a, roadLine: 0xe8ecf0, roadCenter: 0xe8c23a, crosswalk: 0xd6dbe6,
  walk: 0x9daaab, walkAlt: 0x94a1a2, walkJoint: 0x8a9697, curb: 0xd2d6dc,
  pier: 0x9aa5b0, pierAlt: 0x94a0ab, pierJoint: 0x7d8894, pierEdge: 0x5a6773,
  bollard: 0x3a4450, bollardTop: 0x55616e,
  // 도로 밖 'r' = 콘크리트 광장/주차장(112차) — 보도(#9daaab 청회)보다 밝고 따뜻한 중성 회색
  plaza: 0xbdbab3, plazaAlt: 0xb7b4ad, plazaJoint: 0xa6a39c, plazaStain: 0xaeaba4,
  crane: 0xd9a441, craneDark: 0x8a6a1e, craneSteel: 0x3a3f47,
  buildEdge: 0x3a3f47, shadow: 0x101820,
  foam: 0xe8f4fa, wave: 0x9cc4dd, waveDeep: 0x1c3c5c,
  boatHull: 0x2e4a66, boatDeck: 0xe8eef2,
};

/**
 * 접경 알갱이 팔레트 (172차) — **화면에 실제로 보이는 색**이어야 한다.
 * Kenney 셀에 틴트가 곱해진 뒤의 실측값이라야 띠가 지면과 이어져 보인다(원본 셀 색을 쓰면 뜬다).
 */
const SEAM_GRAIN: Record<string, readonly number[]> = {
  s: [COL.beachLite, COL.beach, COL.beach, COL.beachAlt],          // 모래 (106차 실측 유지)
  t: [0x9c8f70, 0x8f8366, 0x86795c],                               // 갯벌 — 젖은 회갈
  d: [0xa8916b, 0x9c8661, 0x8f7a58],                               // 흙 — 포장·모래 사이에 끼는 재료
  '.': [COL.land, COL.landAlt, COL.landSpeck],
  // 유기 지형이 흘려보내는 것 = 흙 + 그 식생의 잎색 (밭·숲 가장자리의 부스러기)
  ',': [0x9a8558, 0x6e9a50, 0x5c8a45],
  c: [0x9a8558, 0x8a8f52, 0x7e9447],
  f: [0x7e6a46, 0x2f5a30, 0x376a36],
};

/**
 * 180차 — 곡선 해안선·단차 표현 켜기. `false`면 105~106차 경로(TTP 시트 접경 셀)로 돌아간다.
 * 접경 셀은 **직선 셀을 방위별로 회전해 붙이는 방식**이라 대각선 해안이 계단으로 끊겼다.
 */
const SHORE_BLEND = true;
/** 젖은 모래 — 물가에 가까울수록 짙다 (실측 모래 `beach` 0xd1a852 기준으로 명도만 내린 톤) */
const WET_SAND: readonly number[] = [0xb8913f, 0xae893c, 0xa47f37];
/** 모래 위 얕은 물 — 수심 0 버킷(0x74add0)보다 밝고 초록기가 도는 톤 */
const SHALLOW_WATER: readonly number[] = [0x8fc6d4, 0x88c0cf, 0x93cad6];
/** 사석 부스러기 — 테트라포드 틈으로 흘러든 돌 (105차 사석 셀 실측) */
const RUBBLE_BITS: readonly number[] = [0x6b5a4a, 0x7d6b58, 0x5a4b3e, 0x8a7a66];
/** 콘크리트 부스러기 — 사석 사면에 굴러 내려온 테트라포드 파편 */
const CONCRETE_BITS: readonly number[] = [0x9aa0a4, 0x8a9095, 0xa7acae];

/** 접경 띠 폭 — [고형 프론트 최대 px, 바깥 흩뿌림 px]. 알갱이 지형은 넓게, 유기 지형은 좁게. */
const SEAM_SPAN: Record<string, readonly [number, number]> = {
  s: [8, 10], t: [7, 9], d: [4, 6],
  ',': [3, 5], c: [5, 7], f: [6, 8],
};

/** 181차 — 보도 벽돌(레퍼런스 ① 수복탑 사거리의 적갈색 인도). 줄눈이 벽돌보다 약간 어둡다 */
const BRICK_MORTAR = 0x7c4c40;
const BRICK_FACES: readonly number[] = [0xa05a49, 0x985444, 0xa8634f, 0x914f42, 0x9c5847];

/** 181차 — 방파제 단면 색. 돌길(상판)은 레퍼런스 ②의 매끄러운 콘크리트, 틈은 아주 어둡게 */
const SLAB: readonly number[] = [0xc4bcaa, 0xbfb7a5, 0xc9c1b0, 0xc1b9a7];
const SLAB_SPECK = 0xa89f8e;
const SLAB_EDGE = 0xdad3c3;          // 돌길 윗모서리 하이라이트
const SLAB_FACE = 0x857e70;          // 돌길 옆면(높이)
const SLAB_FACE_LO = 0x5b554b;       // 옆면 아래 그늘
const TTP_UNDER: readonly number[] = [0x1d242d, 0x222a34, 0x1a2029, 0x1f2730];
const CREVICE: readonly number[] = [0x3a352f, 0x433d36, 0x332e29];
const FOAM_A = 0xeef6f5, FOAM_B = 0xc2e0e4;
/**
 * 테트라포드 교차 열(181차 — 사용자 스케치 정정). 한 열 안에서 **Y · 뒤집힌 Y(⅄)가 번갈아** 끼운다:
 * Y 두 개가 벌린 V 사이로 ⅄의 기둥이 들어가고, ⅄의 두 다리 사이로 다음 열 Y의 기둥이 들어간다.
 * ⚠ 1차 구현은 벌집 격자(Y 위에 ⅄를 세로로 쌓기)라 **육각형 빈 공간**이 생겼다 — 틈은 좁아야 한다.
 *   DX = 열 안 간격(px) · DY = 열 간격 · INV_OY = ⅄가 Y보다 내려앉는 깊이
 */
/**
 * 테트라포드 격자(182차 — 사용자 레퍼런스 도안): **세로 열마다 ⅄ · Y 교대 · 행 높이는 거의 같다**.
 *  가로 피치 = 팔 길이 × 1.29 · 세로 피치 = × 1.5(도안 실측 187/145 · 218/145) · ⅄는 3px만 내려앉는다(도안 ~7%).
 *  이 비율에서 Y의 윗팔과 옆 열 ⅄의 아랫팔이 평행하게 어긋나 쐐기처럼 맞물린다.
 *  ⚠ 181-b는 ⅄를 피치의 36%(10/28)나 내려 행이 엇갈렸고 피치/팔 비가 작아(1.12·1.31) 서로 겹쳤다.
 */
const TTP_DX = 32, TTP_DY = 36, TTP_INV_OY = 3;
/** 아래 층(틈으로만 비치는 어두운 테트라포드) — 열 사이 반 칸 · 반 행, 왼쪽 열과 같은 방위 */
const TTP_LOW_OX = 16, TTP_LOW_OY = 18;

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

/**
 * 181차 — 방파제 성분 하나의 피복 종류와 단면 임계.
 * 단면은 **연속 거리장** `f`(타일 중심에 물 0 · 방파제 dw · 기타 뭍 9를 두고 쌍선형 보간)의 등치선으로
 * 나눈다 — 타일 단위 분류와 달리 대각선 방파제에서도 띠 경계가 45° 직선이 된다.
 *   물 < 0.5 ≤ 피복/사석 < `rubbleFrom` ≤ 사석 < `deckFrom` ≤ 상판(돌길)
 */
interface BwArmorInfo {
  /** 1 = 테트라포드 피복(대형 외해 방파제) · 2 = 사석(테트라포드 없는 소형 방파제) */
  armor: 1 | 2;
  dwMax: number;
  rubbleFrom: number;
  deckFrom: number;
  /**
   * 사석 방파제의 돌길 척추(타일 좌표 선분 + 반폭). 성분이 길쭉하면 주축(PCA)으로 잡는다.
   * 거리장 등치선으로 돌길을 그리면 계단식 대각선 방파제에서 폭이 출렁여 체크무늬가 됐다(실렌더) —
   * 레퍼런스 ②의 돌길은 **매끄러운 직사각형**이다.
   */
  spine?: { ax: number; ay: number; bx: number; by: number; hw: number };
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
  /**
   * 예열 캐시(182차) — 3×3 밖으로 나간 청크의 **구운 RT**를 버리지 않고 숨겨 둔다(충돌·장식·POI는 내린다).
   * 되돌아오면 굽지 않고 그대로 켠다(구: 왕복 경로 굽기의 42%가 재굽기였다). 진행 방향 앞 청크도
   * 한가한 프레임에 여기로 미리 굽는다(선행 로드). Map 삽입 순서 = LRU.
   */
  private warm = new Map<number, ChunkSlot>();
  /** 16장 = 1024² RGBA 약 64MB. 한 방향으로 5청크 가면 창이 15장을 내려놓으므로 왕복을 덮는 최소 크기 */
  private static readonly WARM_MAX = 16;
  /** 로드를 미룬 필요 청크(화면에서 먼 쪽) — 경계를 넘는 프레임에 3장이 몰리지 않게 프레임당 1장 */
  private loadQueue: number[] = [];
  private prevCX = NaN;
  private prevCY = NaN;
  /** 이동 속도(px/프레임, 지수 평활) — 선행 굽기 방향 */
  private velX = 0;
  private velY = 0;
  private frameNo = 0;
  private lastHeavy = -99;
  /** 씬 shutdown 뒤 늦게 들어온 update/rebake 호출이 파괴된 CanvasTexture를 만지지 않게 한다. */
  private disposed = false;
  /** 씬 인스턴스별 생성 텍스처 namespace — 전환 중 키 재사용/폐기 Frame 충돌 방지 */
  private readonly textureNamespace = ++seamlessTextureSerial;

  /** 충돌 그룹 — 씬이 playerBody와 collider를 1회 등록한다 */
  readonly walls: Phaser.Physics.Arcade.StaticGroup;

  /** 바다 타일의 육지 거리 (수심 그라데이션) — 전맵 1회 BFS */
  private waterDist: Uint16Array;
  /** 주차장 열 주축(112차) — 0 없음 · 1 가로 행(세로 주차) · 2 세로 행(가로 주차). computeLotAxis */
  private lotAxis: Uint8Array;
  /** 주차장 구역 id(113차) — 0 = 주차장 아님. 차량은 **여기서만** 열을 이룬다. computeParkingLots */
  private parkLot: Uint16Array;
  /** 방파제 단면 분류(114차) — 0 없음/안벽 · 1 상판(콘크리트) · 2 사석 · 3 테트라포드 피복. computeBreakwaters */
  private bwClass: Uint8Array;
  /** 181차 — 방파제 성분 id(-1 = 아님) · 성분별 피복 종류와 단면 임계. computeBreakwaters */
  private bwComp = new Int32Array(0);
  /** 181차 — 거리장 표본(물 0 · 성분 dw · 기타 뭍 9)과 3×3 근접 성분 — 굽기 중 조회를 O(1)로 */
  private bwV = new Uint8Array(0);
  private bwNear = new Int32Array(0);
  private bwInfo: BwArmorInfo[] = [];
  /** 181차 — 청크(±2타일)에 방파제 성분이 걸치는가 — 피복 스프라이트 패스를 통째로 건너뛰는 용도 */
  private chunkArmor = new Uint8Array(0);
  /** 항로표지 — 청크별(뭍 스냅 후 좌표 기준). setLights */
  private lightsByChunk = new Map<number, RegionLight[]>();
  /** 구역별 목표 점유율 0.40~0.70 (구역마다 다르게 — 만차/한산이 섞이게) */
  private lotFill: Float32Array;
  /** 항만 수역(112차) — 뭍에 둘러싸인 물(항 내측·석호). 정박 어선·계선주·크레인의 기준. computeHarbor */
  private harbor: Uint8Array;
  /** 섬/암초 플래그 (computeIslets — 조도 등 소형 야생 육지 = 갯바위 렌더) */
  private islet: Uint8Array;
  /** 섬 암반('.') 안쪽 깊이(물가 = 1 · 한 칸 들어갈 때마다 +1) — 이끼 연속장의 뼈대(182차) */
  private isletDepth: Uint8Array = new Uint8Array(0);
  /** 외해(열린 바다) 마스크 — 맵 경계 물에서 '넉넉히 넓은 수역'만 타고 퍼진 영역.
   *  방파제 피복(테트라포드) 판정에 쓴다. 석호(청초호)·좁은 수로·항 내측은 여기 안 든다. */
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
  /**
   * 181차 — 무이음 표면 아틀라스(지형 문자 → 아틀라스 키). 있으면 그 지형은 Kenney 셀 대신
   * **월드 좌표 위상 프레임**(`key#i_j`, i = c mod N · j = r mod N)을 깐다 → 셀 경계가 사라진다.
   */
  private surfAtlas = new Map<string, string>();
  /** 181차 — 방파제 스프라이트(테트라포드·돌) 준비 완료 */
  private armorReady = false;
  /** 183차 — 고도 층(타일마다 0~) · 계단(키 = r*cols+c) · 피복 지정 · 성분 셀의 피복 여부(0 = 안벽 쪽) */
  private levelGrid: Uint8Array = new Uint8Array(0);
  private stairMap = new Map<number, RegionStair>();
  private armorSpec: RegionArmor[] = [];
  private bwArm: Uint8Array = new Uint8Array(0);
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
    this.armorSpec = cfg.armor ?? [];
    this.levelGrid = new Uint8Array(cfg.cols * cfg.rows);
    this.setLevels(cfg.levels ?? [], cfg.stairs ?? [], false);
    this.waterDist = this.computeWaterDistance();
    this.islet = this.computeIslets();
    this.isletDepth = this.computeIsletDepth();
    this.lotAxis = this.computeLotAxis();
    this.harbor = this.computeHarbor();
    this.bwClass = this.computeBreakwaters();       // harbor 뒤 (항 내측/외해 구분에 쓴다)
    this.compOf = new Int32Array(cfg.cols * cfg.rows).fill(-1);
    this.labelBuildings();
    this.indexRoads();
    // ⚠ 주차장 검출은 **indexRoads 뒤**여야 한다(113차 실측) — roadBand가 roadsByChunk를 쓰므로
    //   앞에 두면 접근성 판정이 전부 false가 되어 구역이 0개가 된다(차량 전멸).
    const lots = this.computeParkingLots();
    this.parkLot = lots.id;
    this.lotFill = lots.fill;
    this.setLights(cfg.lights ?? []);               // bwClass 뒤 (상판 타일로 스냅)
    this.setProps(cfg.props ?? []);
    this.setTileTex(cfg.tileTex ?? []);
    // 지역 전환 직후 Phaser가 backing canvas를 해제한 텍스처 키를 잠시 남길 수 있다.
    // 텍스처 보강 실패가 Sokcho 씬 전체 생성을 중단시키지 않도록 절차 렌더로 폴백한다.
    try { this.ensureDecoTextures(); }
    catch (e) { console.warn('[SeamlessChunks] 장식 텍스처 준비 건너뜀', e); }
    try { this.ensureGroundTextures(); }
    catch (e) { console.warn('[SeamlessChunks] 지형 텍스처 준비 건너뜀', e); }
    try { this.ensureSurfaceTextures(); }
    catch (e) { console.warn('[SeamlessChunks] 표면 아틀라스 준비 건너뜀', e); }
  }

  /** Phaser TextureManager에 키만 남고 실제 HTMLImage/Canvas가 해제된 경우를 흡수한다. */
  private sourceImage(key: string): (CanvasImageSource & { width: number; height: number }) | null {
    const tm = this.scene.textures;
    if (!tm.exists(key)) return null;
    try {
      const src = tm.get(key).getSourceImage() as (CanvasImageSource & { width?: number; height?: number }) | null;
      if (!src || typeof src.width !== 'number' || typeof src.height !== 'number' || src.width <= 0 || src.height <= 0) return null;
      return src as CanvasImageSource & { width: number; height: number };
    } catch {
      return null;
    }
  }

  /** 파괴 직후 CanvasTexture.getContext()가 null을 반환하는 브라우저/Phaser 조합 방어. */
  private canvasContext(cv: Phaser.Textures.CanvasTexture): CanvasRenderingContext2D | null {
    try { return cv.getContext?.() ?? null; } catch { return null; }
  }

  /** CanvasTexture.refresh 내부의 null canvas 예외가 씬 전체로 전파되지 않게 한다. */
  private safeRefresh(cv: Phaser.Textures.CanvasTexture): boolean {
    if (this.disposed) return false;
    try {
      cv.refresh();
      return true;
    } catch (e) {
      try { cv.destroy(); } catch { /* 이미 파괴된 텍스처 */ }
      console.warn('[SeamlessChunks] CanvasTexture 갱신 건너뜀', e);
      return false;
    }
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
      // ── 172차 어휘 확장 — 구 8글자에서는 전부 '.'이나 ','로 뭉개지던 것들 ──
      //  ⚠ dirt·pave 베이스 셀은 101차 후속 2에 추출해 놓고 **한 번도 쓰이지 않았다**.
      //     경계에 끼일 중간 재료가 없어서 "포장 → 모래" 직결이 생긴 것도 이것 때문이다.
      ['p', ['pave_0']],                            // 포장 광장·주차장 (회색 — 보도보다 중성)
      ['d', ['dirt_0', 'dirt_1']],                  // 흙바닥·공터 — 포장과 모래 사이에 끼는 재료
      ['t', ['sand_0', 'sand_1'], '#b9a98c'],       // 갯벌 — 젖은 회갈색
      ['c', ['dirt_0', 'dirt_1'], '#e0d4ae'],       // 농경지 — 갈린 흙(밝게 — 이랑이 위에 얹힌다)
      ['f', ['grass_0', 'grass_1'], '#8aa888'],     // 숲·관목 — 잔디보다 어둡고 푸르다
    ];
    const tm = this.scene.textures;
    /** 16px 원본 → tr 배율 재베이크. clip = 직각삼각형(빗변 대각선) · tint = multiply 웜 톤 ·
     *  hypLine = 빗변 경계선 색 — 삼각 셀에 경계선이 없으면 사각 테두리 셀과 교대할 때 경계가
     *  끊겨 "타일이 뒤섞이는" 파편으로 보인다(사용자 리포트 — 빗변끼리·테두리끼리 기하학적으로 이어진다) */
    const bake = (src: string, dst: string, w: number, h: number, clip?: 'ne' | 'nw' | 'se' | 'sw', sx = 0, sy = 0, tint?: string, hypLine?: string): boolean => {
      if (tm.exists(dst)) return true;
      if (!tm.exists(src)) return false;
      const img = this.sourceImage(src);
      if (!img) return false;
      const cv = tm.createCanvas(dst, w, h);
      if (!cv) return false;
      const ctx = this.canvasContext(cv);
      if (!ctx) { cv.destroy(); return false; }
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
      try {
        ctx.drawImage(img, sx, sy, w / scale, h / scale, 0, 0, w, h);
      } catch {
        cv.destroy();
        return false;
      }
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
      return this.safeRefresh(cv);
    };
    // 삼각 빗변 경계선 색 — Kenney 테두리 실측(tan #ac9d83 · pier #8b9ea6). 잔디는 삼각 미사용
    const HYP_LINE: Record<string, string> = {
      '.': '#ac9d83', r: '#ac9d83', w: '#ac9d83', s: '#ac9d83', b: '#8b9ea6',
      p: '#9a9790', d: '#8d7a5c', t: '#8d8270',   // 172차 — 유기 지형(c·f)은 블롭 전담이라 삼각 미사용
    };
    for (const [ch, names, tint] of groups) {
      const keys: string[] = [];
      for (const n of names) {
        const src = `ts_kn_ground_${n}`;
        const dst = tint ? `${src}_x${scale}_t` : `${src}_x${scale}`;
        if (!bake(src, dst, tr, tr, undefined, 0, 0, tint)) continue;
        keys.push(dst);
        if (keys.length === 1) {
          for (const q of ['ne', 'nw', 'se', 'sw'] as const) {
            bake(src, `${dst}_tri_${q}`, tr, tr, q, 0, 0, tint, HYP_LINE[ch]);
            // 무선(_nl) 변형 — 모래처럼 **유기 지형** 접경에는 빗변 경계선을 긋지 않는다(106차).
            // 해변↔포장에 어두운 선이 들어가면 45° 톱니가 "그려 넣은 윤곽"으로 읽힌다(사용자 리포트).
            bake(src, `${dst}_tri_${q}_nl`, tr, tr, q, 0, 0, tint);
          }
        }
      }
      if (keys.length > 0) this.groundTex.set(ch, keys);
    }
    // ── 지면 오토타일 엣지/코너 (101차 잔여) — 지형군('.'=tan · ','=grass · 'b'=pier)별 접경 셀 ──
    //  잔디 = 블롭 완전 세트(16조합 + 이너코너 노치) / 포장 = 8방위 어두운 테두리. bakeChunk L1이
    //  접경 마스크(EDGE_SUFFIX)로 선택한다. pave 세트는 예비(현재 보도 베이스 = tan).
    //  172차 — 유기 지형 3종(잔디·농경지·숲)은 같은 블롭 세트를 **각자의 틴트**로 다시 굽는다.
    //  포장 광장('p')은 드디어 `pave` 엣지 세트를 쓴다(추출만 해 두고 쓰이지 않던 예비 세트).
    const edgeSets: [string, string, readonly string[], string?][] = [
      [',', 'grass', GRASS_EDGE_SUFFIXES],
      // ⚠ 숲('f')·농경지('c')는 **블롭 엣지 셀을 쓰지 않는다**(실렌더 확인).
      //   잔디 엣지 셀은 갈색 흙 림을 가지고 있어, 경계마다 갈색 테두리가 들어간 초록 사각형이
      //   찍혔다. 숲 가장자리는 수관이 타일 밖으로 넘치며 만들고(아래 drawing), 농경지는
      //   경계 흔들기 + 이랑이 만든다.
      ['.', 'tan', PAVED_EDGE_SUFFIXES],
      ['d', 'tan', PAVED_EDGE_SUFFIXES, '#c8b08a'],
      ['p', 'pave', PAVED_EDGE_SUFFIXES],
      ['b', 'pier', PAVED_EDGE_SUFFIXES],
    ];
    for (const [ch, name, sufs, tint] of edgeSets) {
      const map = new Map<string, string>();
      for (const suf of sufs) {
        const src = `ts_kn_ground_${name}_edge_${suf}`;
        const dst = tint ? `${src}_x${scale}_${ch}` : `${src}_x${scale}`;
        if (bake(src, dst, tr, tr, undefined, 0, 0, tint)) map.set(suf, dst);
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
          const ctx = this.canvasContext(cv);
          if (!ctx) { cv.destroy(); continue; }
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
          this.safeRefresh(cv);
        }
        if (tm.exists(key)) keys.push(key);
      }
      this.waterTex.push(keys);
    }
    // 테트라포드 폴백 — TTP 세트(ts_ttp_*)가 없을 때만 gem 원본(124px)을 1.75타일로 축소 베이크.
    // (구 경로 보존 — legacy 지역/에셋 미배포 빌드용)
    const tw = Math.round(tr * 1.75);
    if (!tm.exists('smx_tetra_s') && !tm.exists('ts_ttp_ttp_l') && tm.exists('ts_gem_tetra')) {
      const img = this.sourceImage('ts_gem_tetra');
      const cv = tm.createCanvas('smx_tetra_s', tw, tw);
      if (cv && img) {
        const ctx = this.canvasContext(cv);
        if (!ctx) { cv.destroy(); return; }
        ctx.imageSmoothingEnabled = false;
        try { ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, tw, tw); } catch { cv.destroy(); return; }
        this.safeRefresh(cv);
      }
    }
    this.ensurePlazaTextures();
    this.ensureTtpTextures();
    this.ensureCoastTextures();
  }

  /** 도로 밖 'r'(광장·주차장) 콘크리트 톤 — 2px 그레인 절차 베이크 2변형(112차). L1이 'r' 위에 얹고
   *  도로 밴드가 회랑을 덮는다 → 밴드 밖 'r'만 콘크리트로 남는다(구: tan 베이스 = 흙바닥 주차장처럼 보였다). */
  private plazaTex: string[] = [];
  private ensurePlazaTextures(): void {
    const tr = this.cfg.tr;
    const tm = this.scene.textures;
    this.plazaTex = [];
    for (let v = 0; v < 2; v++) {
      const key = `kn_plaza_${v}`;
      if (!tm.exists(key)) {
        const cv = tm.createCanvas(key, tr, tr);
        if (!cv) continue;
        const ctx = this.canvasContext(cv);
        if (!ctx) { cv.destroy(); continue; }
        const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
        for (let y = 0; y < tr; y += 2) {
          for (let x = 0; x < tr; x += 2) {
            const h = hash2(0x51a2 ^ (v * 977), x, y);
            let col = h > 0.5 ? COL.plaza : COL.plazaAlt;
            if (h > 0.975) col = COL.plazaStain;
            ctx.fillStyle = hex(col);
            ctx.fillRect(x, y, 2, 2);
          }
        }
        // 신축이음 — 셀 좌/상 1줄 옅게 (변형별 농도 차로 격자 반복감 완화)
        ctx.fillStyle = hex(COL.plazaJoint);
        ctx.globalAlpha = v === 0 ? 0.55 : 0.35;
        ctx.fillRect(0, 0, tr, 2);
        ctx.fillRect(0, 0, 2, tr);
        ctx.globalAlpha = 1;
        this.safeRefresh(cv);
      }
      if (tm.exists(key)) this.plazaTex.push(key);
    }
    // 180차 — 45° 호안 삼각형 변형 (콘크리트 광장이 물과 맞닿는 계단을 빗변으로 잇는다)
    if (this.plazaTex.length > 0) {
      const src = tm.get(this.plazaTex[0]).getSourceImage() as CanvasImageSource;
      for (const q of ['ne', 'nw', 'se', 'sw'] as const) {
        const tk = `${this.plazaTex[0]}_tri_${q}`;
        if (tm.exists(tk)) continue;
        const cv = tm.createCanvas(tk, tr, tr);
        if (!cv) continue;
        const ctx = this.canvasContext(cv);
        if (!ctx) { cv.destroy(); continue; }
        ctx.imageSmoothingEnabled = false;
        ctx.beginPath();
        if (q === 'ne') { ctx.moveTo(0, 0); ctx.lineTo(tr, 0); ctx.lineTo(tr, tr); }
        else if (q === 'nw') { ctx.moveTo(0, 0); ctx.lineTo(tr, 0); ctx.lineTo(0, tr); }
        else if (q === 'se') { ctx.moveTo(tr, 0); ctx.lineTo(tr, tr); ctx.lineTo(0, tr); }
        else { ctx.moveTo(0, 0); ctx.lineTo(tr, tr); ctx.lineTo(0, tr); }
        ctx.closePath(); ctx.clip();
        ctx.drawImage(src, 0, 0);
        this.safeRefresh(cv);
      }
    }
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
    // ⚠ 해변 접경 풀 = **포말 셀 2종만**(106차). 실측 근거:
    //   ① `edge_still`은 좌측 열이 통째로 투명(L=-1)이라 이어 붙이면 1px 틈이 생긴다.
    //   ② `edge_still`·`edge_ripple`은 경계가 직선 회색 띠라 해변이 **콘크리트 연석**처럼 보였다.
    //   ③ `corner_*`는 모래 폭이 직선 셀의 1/4도 안 돼 직선 구간에 섞이면 벽돌담처럼 들쭉날쭉하고
    //      큰 흰 포말 컬이 낙서처럼 찍혔다(사용자 리포트).
    //   포말 2종은 좌우 끝 경계 높이가 21·21 / 23·21로 맞물려 셀을 이어도 파도선이 끊기지 않는다.
    //   각 셀은 **접경축 미러**도 함께 구워 변형을 4종으로 늘린다(반복 무늬 방지).
    const SHORE_STRAIGHT: readonly string[] = ['edge_foam', 'edge_foam2'];
    for (const name of TTP_EDGE_TILES) {
      const src = `ts_ttp_${name}`;
      if (!tm.exists(src) || !SHORE_STRAIGHT.includes(name)) continue;
      for (let d = 0; d < 4; d++) {
        for (let m = 0; m < 2; m++) {
          const key = `smx_ttpe_${d}_${name}${m ? '_m' : ''}`;
          if (!tm.exists(key)) {
            const cv = tm.createCanvas(key, tr, tr);
            if (!cv) continue;
            const ctx = this.canvasContext(cv);
            const source = this.sourceImage(src);
            if (!ctx || !source) { cv.destroy(); continue; }
            ctx.imageSmoothingEnabled = false;
            ctx.translate(tr / 2, tr / 2);
            ctx.rotate((d % 4) * Math.PI / 2);
            if (m) ctx.scale(-1, 1);              // 접경과 평행한 축으로 뒤집기
            ctx.translate(-tr / 2, -tr / 2);
            try { ctx.drawImage(source, 0, 0); } catch { cv.destroy(); continue; }
            this.safeRefresh(cv);
          }
          if (tm.exists(key)) this.ttpEdge[d].push(key);
        }
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
    this.coastToe = [[], [], [], []];
    this.coastQuay = [[], [], [], []];
    for (const { name, landDir } of COAST_EDGE_SRC) {
      const src = `ts_coast_${name}`;
      if (!tm.exists(src)) continue;
      for (let d = 0; d < 4; d++) {
        const key = `smx_ce_${d}_${name}`;
        if (!tm.exists(key)) {
          const cv = tm.createCanvas(key, tr, tr);
          if (!cv) continue;
          const ctx = this.canvasContext(cv);
          const source = this.sourceImage(src);
          if (!ctx || !source) { cv.destroy(); continue; }
          ctx.imageSmoothingEnabled = false;
          ctx.translate(tr / 2, tr / 2);
          ctx.rotate((((d - landDir) % 4 + 4) % 4) * Math.PI / 2);
          ctx.translate(-tr / 2, -tr / 2);
          try { ctx.drawImage(source, 0, 0); } catch { cv.destroy(); continue; }
          this.safeRefresh(cv);
        }
        if (!tm.exists(key)) continue;
        this.coastEdge[d].push(key);
        // 173차 — 발치(사석)와 안벽(부두)은 쓰이는 자리가 다르다. 풀을 나눠 둔다.
        (name.startsWith('rubble_toe') ? this.coastToe : this.coastQuay)[d].push(key);
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
  /** 외해측 사석 발치 오버레이 (물 타일 위) — 방위별 */
  private coastToe: string[][] = [];
  /** 항내측 안벽 오버레이 (물 타일 위) — 방위별 */
  private coastQuay: string[][] = [];
  /** 갯바위 산포 스프라이트 (알파 트림) */
  private coastRocks: string[] = [];
  /** 해안 세트 사용 가능 여부 — false면 Kenney pier 베이스 + 절차 렌더(구 경로) */
  private coastReady = false;

  /**
   * `'b'`(방파제) 타일 텍스처 선택 — 실사 항공사진 기반 어휘.
   *  물에 안 닿으면 **상판**, 외해측 물에 닿거나 3면이 물이면 **사석 사면**, 항내측은 상판 유지
   *  (항내 접경은 물 타일 쪽 `pier_edge` 오버레이가 안벽을 그린다).
   */
  /**
   * 접경 알갱이 띠 (172차 — 구 `drawSandSpill`의 일반화).
   *
   * 구 구현은 **모래 하나**를 하드코딩했다(`at(...) === 's'`). 그래서 갯벌·자갈·흙처럼
   * 똑같이 흘러나와야 하는 재료가 전부 자로 그은 계단으로 끝났다. 이제는 어느 재료가
   * 어느 재료 위로 흘러나오는지를 core 표(`seamBetween`)가 정하고, 여기서는 그 답을
   * 알갱이로 옮기기만 한다.
   *
   * 입자는 지면과 같은 **2px 그레인**, 밀도는 접경에서 멀어질수록 제곱으로 급감하고
   * 대각 접경도 센다. 색은 **화면에 실제로 보이는 색**(틴트가 곱해진 뒤의 실측값)이라야
   * 이어져 보인다 — 원본 셀 색을 쓰면 띠만 떠 보인다.
   */
  private drawSeamGrains(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, ch: string): void {
    const tr = this.cfg.tr;
    const at = (cc: number, rr: number): string => this.tileAt(cc, rr);
    // 이 타일이 알갱이를 **받는** 이웃 재료를 모은다 (같은 재료는 한 번만).
    const donors = new Map<string, { n: boolean; s: boolean; w: boolean; e: boolean; nw: boolean; ne: boolean; sw: boolean; se: boolean; seam?: string; strength: number }>();
    const NB: [number, number, keyof { n: 1; s: 1; w: 1; e: 1; nw: 1; ne: 1; sw: 1; se: 1 }][] = [
      [0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e'],
      [-1, -1, 'nw'], [1, -1, 'ne'], [-1, 1, 'sw'], [1, 1, 'se'],
    ];
    for (const [dc, dr, key] of NB) {
      const t = at(c + dc, r + dr);
      if (t === ch) continue;
      const rule = seamBetween(ch, t);
      if (rule.kind !== 'spill') continue;
      let e = donors.get(t);
      if (!e) { e = { n: false, s: false, w: false, e: false, nw: false, ne: false, sw: false, se: false, seam: rule.seamCh, strength: rule.strength }; donors.set(t, e); }
      e[key] = true;
    }
    if (donors.size === 0) return;
    const sd = this.cfg.seed ^ 0x5a4d;
    const last = tr - 2;
    for (const [donor, d8] of donors) {
      // 중간 재료(흙)를 먼저 깐다 — 포장과 모래는 서로 붙을 일이 없는 재료라
      //  실제로는 사이에 닳아 드러난 흙이 한 줄 있다. 알갱이는 그 위로 흘러나온다.
      if (d8.seam) this.grainPass(g, lx, ly, c, r, sd ^ 0x2b11, d8, SEAM_GRAIN[d8.seam] ?? SEAM_GRAIN['d']!, 3, 5);
      const [front, fringe] = SEAM_SPAN[donor] ?? [8, 10];
      this.grainPass(g, lx, ly, c, r, sd, d8, SEAM_GRAIN[donor] ?? SEAM_GRAIN['s']!, front * d8.strength, fringe * d8.strength);
      void last;
    }
  }

  /**
   * 8방위 접경까지의 거리(px) — `grainPass`와 같은 식. 접경이 없으면 99.
   * 대각 이웃은 "그 모서리에서 멀어지는 거리"(체비쇼프)라 코너가 둥글게 이어진다.
   */
  private edgeDist(x: number, y: number, d8: { n: boolean; s: boolean; w: boolean; e: boolean; nw: boolean; ne: boolean; sw: boolean; se: boolean }): number {
    const last = this.cfg.tr - 2;
    let d = 99;
    if (d8.n) d = Math.min(d, y);
    if (d8.s) d = Math.min(d, last - y);
    if (d8.w) d = Math.min(d, x);
    if (d8.e) d = Math.min(d, last - x);
    if (d8.nw) d = Math.min(d, Math.max(x, y));
    if (d8.ne) d = Math.min(d, Math.max(last - x, y));
    if (d8.sw) d = Math.min(d, Math.max(x, last - y));
    if (d8.se) d = Math.min(d, Math.max(last - x, last - y));
    return d;
  }

  /** 8방위 이웃 중 조건을 만족하는 방위 */
  private neighbors8(c: number, r: number, pred: (t: string, nc: number, nr: number) => boolean) {
    const at = (cc: number, rr: number): string => this.tileAt(cc, rr);
    return {
      n: pred(at(c, r - 1), c, r - 1), s: pred(at(c, r + 1), c, r + 1),
      w: pred(at(c - 1, r), c - 1, r), e: pred(at(c + 1, r), c + 1, r),
      nw: pred(at(c - 1, r - 1), c - 1, r - 1), ne: pred(at(c + 1, r - 1), c + 1, r - 1),
      sw: pred(at(c - 1, r + 1), c - 1, r + 1), se: pred(at(c + 1, r + 1), c + 1, r + 1),
    };
  }

  /**
   * 곡선 해안선 (180차 — 사용자 지적 "도로-모래-바다의 경계가 명확히 보인다 … 중간 타일이 없다").
   *
   * 구 방식은 **직선 접경 셀을 방위별로 회전해** 물 타일에 붙였다. 셀 하나하나는 예쁘지만
   * 대각선·곡선 해안에서는 셀이 계단으로 이어져 **타일 격자가 그대로 드러났다**.
   *
   * 이제는 경계 양쪽 타일(모래·물)이 **같은 곡선 함수**를 평가한다.
   *   s = 경계로부터의 부호 거리(물 쪽 +, 모래 쪽 −) · o = 전역 좌표 노이즈 오프셋(±10px)
   *   v = s − o  →  v < 0 모래 · 0 ≤ v < 2 포말 · 2~16 얕은 물(모래가 비친다)
   * 노이즈가 **전역 좌표**라 타일·청크 경계를 넘어 그대로 이어지고, 해안선은 격자와 무관한 곡선이 된다.
   * 그 사이에 **젖은 모래 → 포말 → 얕은 물**의 중간 띠가 생긴다(레퍼런스의 "이음").
   */
  private drawShoreBlend(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, ch: string): void {
    if (!SHORE_BLEND) return;
    const shore = (t: string): boolean => t === 's' || t === 't';
    const water = ch === '~';
    if (!water && !shore(ch)) return;
    const d8 = this.neighbors8(c, r, water ? (t) => shore(t) : (t) => t === '~');
    if (!d8.n && !d8.s && !d8.w && !d8.e && !d8.nw && !d8.ne && !d8.sw && !d8.se) return;
    const tr = this.cfg.tr;
    const sd = this.cfg.seed ^ 0x51e0;
    const sand = SEAM_GRAIN[water ? 's' : ch] ?? SEAM_GRAIN['s']!;
    // 경계 모양 = 타일 중심값의 **쌍선형 보간장**(마칭 스퀘어). 1타일 계단이 45° 선으로 펴진다.
    //  물 쪽은 "모래·갯벌 = 뭍", 뭍 쪽은 "물이 아니면 뭍" — 모래↔물 경계에서는 두 정의가 같아
    //  양쪽 타일이 같은 선을 본다(모래↔포장 경계에 젖은 모래가 번지지 않게 정의를 나눴다).
    const ind = (cc: number, rr: number): number => {
      const t = this.tileAt(cc, rr);
      return water ? (shore(t) ? 1 : 0) : (t === '~' ? 0 : 1);
    };
    const I = new Float32Array(9);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) I[j * 3 + i] = ind(c - 1 + i, r - 1 + j);
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        const d = this.edgeDist(x, y, d8);
        if (d > 30) continue;
        const gx = c * tr + x, gy = r * tr + y;
        // 이 2px 칸 중심에서 본 보간장 F (1 = 뭍 중심 · 0 = 물 중심)
        const u = (x + 1) / tr - 0.5, w = (y + 1) / tr - 0.5;
        const i0 = u < 0 ? 0 : 1, j0 = w < 0 ? 0 : 1;
        const fx = u < 0 ? u + 1 : u, fy = w < 0 ? w + 1 : w;
        const a00 = I[j0 * 3 + i0]!, a10 = I[j0 * 3 + i0 + 1]!, a01 = I[(j0 + 1) * 3 + i0]!, a11 = I[(j0 + 1) * 3 + i0 + 1]!;
        const F = (a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy;
        // 보간장이 포화(0/1)되는 곳 — 경계에서 반 타일 이상 — 은 구 거리식으로 잇는다(연속)
        const s = F > 0.001 && F < 0.999 ? (0.5 - F) * tr : (water ? d + 1 : -(d + 1));
        // 큰 굽이(±12) + 잔물결(±2) — 전역 좌표라 이웃 타일과 같은 곡선을 본다.
        //  굽이 파장(≈37px)이 타일(32px)보다 길어야 해안선이 **격자를 가로질러** 흐른다.
        const o = (noise2(sd, gx / 37, gy / 37) - 0.5) * 24 + (noise2(sd ^ 0x33, gx / 7, gy / 7) - 0.5) * 4;
        const v = s - o;
        const h = hash2(sd, gx, gy);
        if (v < 0) {
          if (water) {
            // 물 타일 안으로 파고든 모래 — 반드시 채운다(밑의 물을 가린다)
            g.fillStyle(v > -5 ? WET_SAND[Math.floor(h * WET_SAND.length) % WET_SAND.length]! : sand[Math.floor(h * sand.length) % sand.length]!, 1);
            g.fillRect(lx + x, ly + y, 2, 2);
          } else if (v > -22) {
            // 모래 쪽 — 물가로 갈수록 젖는다 (디더로 번짐). 파도가 닿는 폭 ≈ 20px
            const t = (v + 22) / 22;                         // 0(마른) → 1(물가)
            if (v > -7 || h < t * t * 0.95) {
              g.fillStyle(WET_SAND[Math.floor(h * WET_SAND.length) % WET_SAND.length]!, 1);
              g.fillRect(lx + x, ly + y, 2, 2);
            }
          }
          continue;
        }
        if (v < 2) {                                          // 포말 선
          g.fillStyle(COL.foam, 0.92);
          g.fillRect(lx + x, ly + y, 2, 2);
          continue;
        }
        if (v < 5) {                                          // 부서지는 거품
          g.fillStyle(h > 0.55 ? COL.foam : SHALLOW_WATER[Math.floor(h * 3) % 3]!, h > 0.55 ? 0.7 : 1);
          g.fillRect(lx + x, ly + y, 2, 2);
          continue;
        }
        if (v < 16) {                                         // 얕은 물 — 모래가 비친다
          const t = (16 - v) / 11;                            // 1(물가) → 0(깊은 쪽)
          if (!water || h < t * 0.85) {                       // 모래 타일 위라면 반드시 채운다
            g.fillStyle(SHALLOW_WATER[Math.floor(h * SHALLOW_WATER.length) % SHALLOW_WATER.length]!, 1);
            g.fillRect(lx + x, ly + y, 2, 2);
          }
          // 두 번째 물결선 — 끊긴 흰 줄
          if (v >= 9 && v < 11 && noise2(sd ^ 0x77, gx / 9, gy / 9) > 0.58) {
            g.fillStyle(COL.foam, 0.5);
            g.fillRect(lx + x, ly + y, 2, 2);
          }
        }
      }
    }
  }

  /**
   * 방파제 단면 전이 (180차 — 사용자 지적 "돌바닥-테트라포드 사이에 자연스러운 타일이 없다").
   *
   * ① **테트라포드 ↔ 사석**: 두 재료가 자로 그은 선으로 붙어 있었다. 실제로는 사석이
   *    블록 틈으로 흘러들고, 블록 파편이 사석 위로 굴러 내려온다 → 서로의 재료를 노이즈
   *    프론트로 흘려 넣는다(`grainPass`와 같은 문법 — 지면과 같은 2px 그레인).
   * ② 높이는 `drawReliefShadow`가 따로 맡는다.
   */
  private drawBreakwaterSeam(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const cols = this.cfg.cols;
    const k = this.bwClass[r * cols + c];
    if (k !== 2 && k !== 3) return;
    const want = k === 3 ? 2 : 3;
    const d8 = this.neighbors8(c, r, (_t, nc, nr) =>
      nc >= 0 && nr >= 0 && nc < cols && nr < this.cfg.rows && this.bwClass[nr * cols + nc] === want);
    if (!d8.n && !d8.s && !d8.w && !d8.e && !d8.nw && !d8.ne && !d8.sw && !d8.se) return;
    const sd = this.cfg.seed ^ 0x7b3c;
    // 피복 타일엔 사석이 넓게(블록 틈을 메운다) · 사석 타일엔 블록 파편이 드문드문.
    //  ⚠ 2px 알갱이만으로는 두 셀의 **직선 테두리**가 그대로 보였다(실렌더) — 돌 하나를
    //    4~6px 덩어리 + 아래 그늘 1px로 그려야 경계를 덮는다.
    const pal = k === 3 ? RUBBLE_BITS : CONCRETE_BITS;
    const tr = this.cfg.tr;
    const reach = k === 3 ? 16 : 10;
    for (let y = 0; y < tr; y += 4) {
      for (let x = 0; x < tr; x += 4) {
        const jx = x + Math.floor(hash2(sd ^ 1, c * tr + x, r * tr + y) * 3) - 1;
        const jy = y + Math.floor(hash2(sd ^ 2, c * tr + x, r * tr + y) * 3) - 1;
        const d = this.edgeDist(Math.max(0, Math.min(tr - 2, jx)), Math.max(0, Math.min(tr - 2, jy)), d8);
        if (d > reach) continue;
        const front = reach * (0.45 + 0.55 * noise2(sd, (c * tr + x) / 13, (r * tr + y) / 13));
        const h = hash2(sd, c * tr + x, r * tr + y);
        if (d > front && h > 0.25) continue;
        if (k === 2 && h > 0.45) continue;                         // 파편은 드문드문
        const w = 3 + Math.floor(h * 3), hgt = 3 + Math.floor(hash2(sd ^ 3, c, r * 97 + x) * 2);
        g.fillStyle(0x2a241f, 0.55);                                // 돌 밑 그늘
        g.fillRect(lx + jx + 1, ly + jy + hgt - 1, w, 2);
        g.fillStyle(pal[Math.floor(h * pal.length) % pal.length]!, 1);
        g.fillRect(lx + jx, ly + jy, w, hgt);
        g.fillStyle(0xffffff, 0.14);                                // 윗면 빛
        g.fillRect(lx + jx, ly + jy, w - 1, 1);
      }
    }
    // 가장 가까운 한 줄은 알갱이로 틈을 메운다 — 돌 사이로 셀 테두리가 비치지 않게.
    //  ⚠ 사석 쪽(k=2)에는 깔지 않는다 — 콘크리트 알갱이가 사석 셀 둘레를 **회색 액자**처럼
    //    감쌌다(180차 실렌더). 파편은 위의 덩어리만으로 충분하다.
    if (k === 3) this.grainPass(g, lx, ly, c, r, sd ^ 0x9, d8, pal, 3, 4);
  }

  /**
   * 단차 — 턱과 그림자 (180차 — 사용자 지적 "높낮이 타일이 없다").
   *
   * 높이(`reliefHeight`)는 core가 정한다: 물 0 · 사석 1 · 피복 2 · 상판·안벽 3.
   * 빛은 **북서쪽**에서 온다고 두고 —
   *  - 내가 **낮고** 높은 이웃이 **북·서**에 있으면 그 변을 따라 그림자가 진다(높이차에 비례한 폭).
   *  - 내가 **높고** 낮은 이웃이 **남**에 있으면 탑다운 3/4 시점에서 보이는 **옆면(턱)** 을 그린다.
   *    (동쪽 변은 1px 밝은 모서리만 — 옆면을 둘 다 그리면 상자가 떠 보인다)
   * 그림자는 2px 그레인 디더로 번져 사각 띠처럼 보이지 않게 한다.
   */
  private drawReliefShadow(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, ch: string): void {
    const cols = this.cfg.cols, rows = this.cfg.rows;
    const tr = this.cfg.tr;
    const bw = (cc: number, rr: number): number =>
      cc >= 0 && rr >= 0 && cc < cols && rr < rows ? this.bwClass[rr * cols + cc] : 0;
    const myBw = bw(c, r);
    const hMe = reliefHeight(ch, myBw);
    const sd = this.cfg.seed ^ 0x3d17;
    const DIRS: [number, number, 'n' | 'e' | 's' | 'w'][] = [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']];
    // 180차 — 방파제 45° 모서리: 내 삼각형이 덮은 두 변은 직선 턱 대신 **빗변**에 턱·그림자를 긋는다
    const myTri = this.bwTriAt.get(r * cols + c);
    if (myTri) this.drawChamferRelief(g, lx, ly, c, r, myTri[0], hMe, reliefHeight('b', myTri[1]), myBw === 1 || (ch === 'b' && myBw === 0));
    const OPP: Record<'n' | 'e' | 's' | 'w', string> = { n: 's', s: 'n', e: 'w', w: 'e' };
    for (const [dc, dr, dir] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (myTri && myTri[0].includes(dir)) continue;
      // 이웃의 삼각형이 공유 변을 덮었으면 그 변은 이미 내 재질로 이어진다 — 그림자·턱 생략
      const nTri = this.bwTriAt.get(nr * cols + nc);
      if (nTri && nTri[0].includes(OPP[dir])) continue;
      // 182차 — 섬 암반의 깎인 모서리 변도 물이다(빗변이 림·포말을 맡는다) — 변 따라 그림자 금지
      if (this.isletEdgeOpen(nc, nr, OPP[dir] as 'n' | 'e' | 's' | 'w')) continue;
      const nch = this.tileAt(nc, nr);
      if (nch === '#') continue;
      const nBw = bw(nc, nr);
      const hN = reliefHeight(nch, nBw);
      if (hN > hMe && castsReliefShadow(nch, nBw, ch) && (dir === 'n' || dir === 'w')) {
        // ── 그림자: 높은 이웃이 북·서 ──
        const w = Math.min(12, 4 * (hN - hMe));
        for (let a = 0; a < tr; a += 2) {
          for (let b = 0; b < w; b += 2) {
            const px = dir === 'w' ? b : a;
            const py = dir === 'n' ? b : a;
            const t = 1 - b / w;
            const hh = hash2(sd ^ (dir === 'n' ? 1 : 2), c * tr + px, r * tr + py);
            if (b >= 2 && hh > t * 0.95) continue;
            g.fillStyle(0x0e0c0a, 0.5 * t + 0.12);
            g.fillRect(lx + px, ly + py, 2, 2);
          }
        }
      } else if (hN < hMe && myBw === 1 && dir === 's') {
        // ── 상판 남쪽 옆면(턱) — 높이차만큼 ──
        const face = Math.min(8, 3 * (hMe - hN));
        g.fillStyle(0x857a69, 1);
        g.fillRect(lx, ly + tr - face, tr, face);
        g.fillStyle(0x6a6154, 1);
        g.fillRect(lx, ly + tr - 2, tr, 2);
        g.fillStyle(0xd9cfbc, 0.65);                       // 상판 모서리 하이라이트
        g.fillRect(lx, ly + tr - face - 2, tr, 2);
      } else if (hN < hMe && myBw === 1 && dir === 'e') {
        g.fillStyle(0x6a6154, 0.85);                       // 동쪽 옆면 — 해를 등진 면
        g.fillRect(lx + tr - 3, ly, 3, tr);
      } else if (hN < hMe && myBw === 1 && (dir === 'n' || dir === 'w')) {
        g.fillStyle(0xe6dcc8, 0.7);                        // 북·서 모서리 — 빛 받는 턱
        if (dir === 'n') g.fillRect(lx, ly, tr, 2);
        else g.fillRect(lx, ly, 2, tr);
      }
    }
  }

  /** 현재 굽는 청크의 방파제 45° 모서리 (drawReliefShadow가 턱을 빗변으로 옮길 때 본다) */
  private bwTriAt = new Map<number, ['ne' | 'nw' | 'se' | 'sw', number]>();

  /**
   * 방파제 단면 띠의 바깥 모서리 (180차). 내 분류 `k`보다 **바다 쪽**(숫자가 큰) 재료가
   * 직교 두 변과 그 사이 대각을 모두 차지하고, 반대쪽 두 변은 나와 같거나 뭍 쪽이면
   * 그 모서리 방위와 바다 쪽 재료를 돌려준다.
   */
  private bwChamferAt(c: number, r: number, k: number): ['ne' | 'nw' | 'se' | 'sw', number] | null {
    const cols = this.cfg.cols, rows = this.cfg.rows;
    const cls = (cc: number, rr: number): number => {
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) return -1;
      const t = this.tileAt(cc, rr);
      if (t !== 'b' && t !== '.') return -1;
      const v = this.bwClass[rr * cols + cc];
      return v === 0 && t === 'b' ? 1 : v;
    };
    const inl = (v: number): boolean => v >= 1 && v <= k;
    const nN = cls(c, r - 1), nS = cls(c, r + 1), nW = cls(c - 1, r), nE = cls(c + 1, r);
    const cand: ['ne' | 'nw' | 'se' | 'sw', number, number, number, number, number][] = [
      ['ne', nN, nE, cls(c + 1, r - 1), nS, nW],
      ['nw', nN, nW, cls(c - 1, r - 1), nS, nE],
      ['se', nS, nE, cls(c + 1, r + 1), nN, nW],
      ['sw', nS, nW, cls(c - 1, r + 1), nN, nE],
    ];
    for (const [q, a, b, d, o1, o2] of cand) {
      // 대각은 같은 재료거나 **더 바다 쪽**(사석 모서리 너머가 피복·물)이어도 된다 — 띠가 1타일 두께라
      //   대각이 한 단계 더 나가 있는 경우가 대부분이다(실측)
      if (a > k && a === b && (d >= a || d === -1) && inl(o1) && inl(o2)) return [q, a];
    }
    return null;
  }

  /** 타일 텍스처의 45° 직각삼각형 변형을 필요할 때 굽는다 (90° 꼭짓점이 `q` 방위) */
  private triOf(src: string, q: 'ne' | 'nw' | 'se' | 'sw'): string | null {
    const tm = this.scene.textures;
    const hashAt = src.indexOf('#');
    const atlas = hashAt < 0 ? src : src.slice(0, hashAt);
    const frameName = hashAt < 0 ? undefined : src.slice(hashAt + 1);
    const key = hashAt < 0 ? `${src}_tri_${q}` : `${atlas}_${frameName}_tri_${q}`;
    if (tm.exists(key)) return key;
    if (!tm.exists(atlas)) return null;
    const tr = this.cfg.tr;
    const img = tm.get(atlas).getSourceImage() as CanvasImageSource & { width: number; height: number };
    // 아틀라스 프레임이면 그 칸만 잘라 온다(181차)
    const fr = frameName !== undefined ? tm.get(atlas).get(frameName) : null;
    const sx = fr ? fr.cutX : 0, sy = fr ? fr.cutY : 0;
    const sw = fr ? fr.cutWidth : img.width, sh = fr ? fr.cutHeight : img.height;
    const cv = tm.createCanvas(key, tr, tr);
    if (!cv) return null;
    const ctx = this.canvasContext(cv);
    if (!ctx) { cv.destroy(); return null; }
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    if (q === 'ne') { ctx.moveTo(0, 0); ctx.lineTo(tr, 0); ctx.lineTo(tr, tr); }
    else if (q === 'nw') { ctx.moveTo(0, 0); ctx.lineTo(tr, 0); ctx.lineTo(0, tr); }
    else if (q === 'se') { ctx.moveTo(tr, 0); ctx.lineTo(tr, tr); ctx.lineTo(0, tr); }
    else { ctx.moveTo(0, 0); ctx.lineTo(tr, tr); ctx.lineTo(0, tr); }
    ctx.closePath(); ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tr, tr);
    this.safeRefresh(cv);
    return tm.exists(key) ? key : null;
  }

  /**
   * 물 타일의 45° 호안 모서리 판정 (180차).
   * 직교 두 변과 그 사이 대각이 **같은 단단한 뭍**(포장·맨땅·구조물)이고 반대쪽 두 변은 물이면
   * 그 모서리 방위와 뭍 문자를 돌려준다. 모래·갯벌은 곡선 해안선이, 잔디류는 블롭이,
   * 방파제는 단면 분류가 맡으므로 제외한다.
   */
  private waterChamferAt(c: number, r: number): ['ne' | 'nw' | 'se' | 'sw', string] | null {
    const cols = this.cfg.cols, rows = this.cfg.rows;
    if (this.tileTexMap.has(r * cols + c)) return null;
    const land = (cc: number, rr: number): string | null => {
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) return null;
      const t = this.tileAt(cc, rr);
      if (t === '~' || t === '#') return null;
      if (this.bwClass[rr * cols + cc] > 0 || this.islet[rr * cols + cc]) return null;
      // 181차 — 안벽·부두('b' 비방파제)도 무이음 콘크리트가 생겼으니 45°로 잇는다(구: 계단 그대로)
      if (t === 'b') return this.surfAtlas.has('quay') ? 'quay' : null;
      const cls = terrainClass(t);
      return cls === 'built' || cls === 'bare' || cls === 'structure' ? t : null;
    };
    const water = (cc: number, rr: number): boolean => this.tileAt(cc, rr) === '~';
    // 같은 **문자**끼리만 — 그룹으로 묶으면 광장(p)과 맨땅(.)이 섞인 모서리에 엉뚱한 재질이 얹힌다
    const same = (a: string | null, b: string | null): boolean => !!a && a === b;
    const nN = land(c, r - 1), nS = land(c, r + 1), nW = land(c - 1, r), nE = land(c + 1, r);
    const cand: ['ne' | 'nw' | 'se' | 'sw', string | null, string | null, string | null, boolean][] = [
      ['ne', nN, nE, land(c + 1, r - 1), water(c, r + 1) && water(c - 1, r)],
      ['nw', nN, nW, land(c - 1, r - 1), water(c, r + 1) && water(c + 1, r)],
      ['se', nS, nE, land(c + 1, r + 1), water(c, r - 1) && water(c - 1, r)],
      ['sw', nS, nW, land(c - 1, r + 1), water(c, r - 1) && water(c + 1, r)],
    ];
    for (const [q, a, b, d, open] of cand) {
      if (!open || !a || !b || !d) continue;
      if (same(a, b)) return [q, a];                  // 대각이 다른 단단한 재질이어도 두 변의 재질로 잇는다
      // 두 변의 재질이 다르면(광장 + 맨땅) 대각 재질을 따른다 — 호안선이 두 재질 사이에서 끊기지 않게
      if (same(d, a) || same(d, b)) return [q, d];
    }
    return null;
  }

  /** 45° 호안 빗변 — 물 쪽으로 턱 그림자(뭍이 북·서일 때) + 포말 한 줄 */
  private drawChamferRim(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, q: 'ne' | 'nw' | 'se' | 'sw'): void {
    const tr = this.cfg.tr;
    const sd = this.cfg.seed ^ 0x2c4f;
    const lit = q === 'se';                              // 뭍이 남동 = 빛을 등진 물 쪽엔 그림자가 없다
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        // 빗변에서 물 쪽으로의 거리(px) — 삼각형 안(뭍)은 음수
        const d = q === 'ne' ? y - x : q === 'sw' ? x - y
          : q === 'nw' ? x + y - (tr - 2) : (tr - 2) - x - y;
        if (d < 0 || d > 10) continue;
        const h = hash2(sd, c * tr + x, r * tr + y);
        if (!lit && d < 6) {
          const t = 1 - d / 6;
          if (d < 2 || h < t * 0.9) { g.fillStyle(0x0e1a24, 0.35 * t + 0.1); g.fillRect(lx + x, ly + y, 2, 2); }
          continue;
        }
        if (d >= (lit ? 0 : 6) && d < (lit ? 3 : 9) && h < 0.7) {
          g.fillStyle(COL.foam, 0.55);
          g.fillRect(lx + x, ly + y, 2, 2);
        }
      }
    }
  }

  /**
   * 방파제 45° 모서리의 턱·그림자 (180차). `q` 쪽 삼각형이 더 낮은 바다 쪽 재료다.
   * 빛은 북서 — 남쪽을 향한 빗변(se·sw)은 옆면(턱)이 보이고, 남동 빗변은 낮은 쪽에 그림자가 진다.
   */
  private drawChamferRelief(
    g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number,
    q: 'ne' | 'nw' | 'se' | 'sw', hMe: number, hLow: number, deck: boolean,
  ): void {
    const tr = this.cfg.tr;
    const dh = hMe - hLow;
    if (dh <= 0) return;
    const sd = this.cfg.seed ^ 0x3d19;
    const face = deck && (q === 'se' || q === 'sw') ? Math.min(8, 3 * dh) : 0;
    const shadowW = q === 'se' || q === 'sw' || q === 'ne' ? Math.min(12, 4 * dh) : 0;
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        // 빗변으로부터의 부호 거리 — 삼각형(낮은 재료) 안이 양수
        const d = q === 'ne' ? x - y : q === 'sw' ? y - x : q === 'nw' ? (tr - 2) - x - y : x + y - (tr - 2);
        if (d < 0) {
          if (!deck) continue;
          if (face > 0 && d >= -face) {                   // 남향 빗변 — 옆면(턱)
            g.fillStyle(d >= -2 ? 0x6a6154 : 0x857a69, 1);
            g.fillRect(lx + x, ly + y, 2, 2);
          } else if (face > 0 && d >= -face - 2) {        // 턱 위 모서리 하이라이트
            g.fillStyle(0xd9cfbc, 0.65);
            g.fillRect(lx + x, ly + y, 2, 2);
          } else if (q === 'nw' && d >= -2) {             // 빛 받는 북서 턱
            g.fillStyle(0xe6dcc8, 0.7);
            g.fillRect(lx + x, ly + y, 2, 2);
          } else if (q === 'ne' && d >= -3) {             // 해를 등진 동향 옆면
            g.fillStyle(0x6a6154, 0.85);
            g.fillRect(lx + x, ly + y, 2, 2);
          }
          continue;
        }
        if (shadowW > 0 && d < shadowW) {                 // 낮은 재료 위로 드리운 그림자
          const t = 1 - d / shadowW;
          const hh = hash2(sd, c * tr + x, r * tr + y);
          if (d >= 2 && hh > t * 0.95) continue;
          g.fillStyle(0x0e0c0a, (0.5 * t + 0.12) * (q === 'ne' ? 0.6 : 1));
          g.fillRect(lx + x, ly + y, 2, 2);
        }
      }
    }
  }

  /** 알갱이 한 겹 — `front`(고형 프론트 최대 폭) + `fringe`(바깥 흩뿌림 폭) */
  private grainPass(
    g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, sd: number,
    d8: { n: boolean; s: boolean; w: boolean; e: boolean; nw: boolean; ne: boolean; sw: boolean; se: boolean },
    pal: readonly number[], frontMax: number, fringe: number,
  ): void {
    const tr = this.cfg.tr;
    const last = tr - 2;
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        let d = 99;
        if (d8.n) d = Math.min(d, y);
        if (d8.s) d = Math.min(d, last - y);
        if (d8.w) d = Math.min(d, x);
        if (d8.e) d = Math.min(d, last - x);
        if (d8.nw) d = Math.min(d, Math.max(x, y));
        if (d8.ne) d = Math.min(d, Math.max(last - x, y));
        if (d8.sw) d = Math.min(d, Math.max(x, last - y));
        if (d8.se) d = Math.min(d, Math.max(last - x, last - y));
        if (d === 99) continue;
        // 노이즈 프론트 — 밀려 나온 앞자락. 타일 경계와 무관한 곡선이라 계단이 지워진다
        const n = noise2(sd, (c * tr + x) / 11, (r * tr + y) / 11);
        const front = 2 + frontMax * n * n;
        const h = hash2(sd, c * 40 + x, r * 40 + y);
        if (d <= front) {
          g.fillStyle(pal[Math.floor(h * pal.length) % pal.length]!, 1);
          g.fillRect(lx + x, ly + y, 2, 2);
          continue;
        }
        if (d > front + fringe) continue;
        const t = 1 - (d - front) / fringe;
        if (h > t * t * 0.85) continue;
        g.fillStyle(pal[Math.floor(h * pal.length) % pal.length]!, 1);
        g.fillRect(lx + x, ly + y, 2, 2);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 181차 — 무이음 표면 아틀라스 · 방파제 피복 스프라이트
  // ═══════════════════════════════════════════════════

  /** 아틀라스 한 변의 타일 수 — 12타일(384px)마다 되풀이된다(얼룩 반복이 눈에 덜 띄는 크기) */
  private static readonly SURF_N = 12;
  /** 돌 스프라이트 변형별 아트 크기 [w, h] — 배치가 스프라이트 중심을 잡을 때 쓴다 */
  private static readonly STONE_DIMS: readonly (readonly [number, number])[] = Array.from({ length: 12 }, (_, v) => {
    const w = 5 + (v % 6);
    return [w, Math.max(4, Math.round(w * (0.62 + 0.08 * (v % 4))))] as const;
  });

  /**
   * 무이음 표면 아틀라스 + 방파제 스프라이트를 굽는다(181차).
   *
   * ⚠ 구 Kenney tan 셀은 16px 원본을 ×2로 키운 **한 칸짜리 무늬**라, 셀 경계마다 벽돌 줄이 다시
   *   시작돼 인도·공터 전체에 격자가 드러났다(사용자 리포트 — "안쪽 지형에 타일 경계선이 보인다").
   *   이제는 12×12타일 주기 캔버스 하나를 굽고 **월드 좌표 위상**으로 프레임을 고른다 —
   *   이웃 타일은 캔버스에서도 이웃이므로 경계가 존재하지 않는다.
   */
  private ensureSurfaceTextures(): void {
    const tr = this.cfg.tr;
    if (tr !== 32) return;
    const tm = this.scene.textures;
    const N = SeamlessChunks.SURF_N;
    const size = N * tr;
    const mk = (name: SurfaceName): string | null => {
      const key = `srf_${name}_v1`;
      if (!tm.exists(key)) {
        const cv = tm.createCanvas(key, size, size);
        if (!cv) return null;
        const ctx = this.canvasContext(cv);
        if (!ctx) { cv.destroy(); return null; }
        paintSurfaceAtlas(ctx, size, SURFACES[name]);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cv.add(`${i}_${j}`, 0, i * tr, j * tr, tr, tr);
        if (!this.safeRefresh(cv)) return null;
      }
      return tm.exists(key) ? key : null;
    };
    const con = mk('con'), plaza = mk('plaza'), pave = mk('pave'), quay = mk('quay');
    // 차도('r')·보도('w') 타일은 벡터 밴드가 위를 덮는다 — 밴드 밖으로 남는 'r'이 광장·주차장이다
    if (con) for (const ch of ['.', 'w']) { this.surfAtlas.set(ch, con); this.groundTex.set(ch, [con]); }
    if (plaza) { this.surfAtlas.set('r', plaza); this.groundTex.set('r', [plaza]); }
    if (pave) { this.surfAtlas.set('p', pave); this.groundTex.set('p', [pave]); }
    if (quay) this.surfAtlas.set('quay', quay);
    // 182차 — 소형 섬 갯바위 암반(구: 타일마다 두 톤 + 사각 크랙 = 체커판)
    const rockKey = 'srf_rock_v2';
    if (!tm.exists(rockKey)) {
      const cv = tm.createCanvas(rockKey, size, size);
      const ctx = cv ? this.canvasContext(cv) : null;
      if (cv && ctx) {
        paintRockAtlas(ctx, size, 0x5c11);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cv.add(`${i}_${j}`, 0, i * tr, j * tr, tr, tr);
        if (!this.safeRefresh(cv)) cv.destroy();
      } else cv?.destroy();
    }
    if (tm.exists(rockKey)) this.surfAtlas.set('islet', rockKey);

    // ── 방파제 스프라이트 — 테트라포드 (두 방위 × 회전 3) × 톤 3 · 돌 12 × 마름/젖음 ──
    let ok = true;
    const tones: TetraTone[] = ['top', 'low', 'wet'];
    for (const tone of tones) {
      for (let v = 0; v < 6; v++) {
        const key = `srf_ttp4_${tone}_${v}`;
        if (tm.exists(key)) continue;
        const cv = tm.createCanvas(key, TETRA_ART * 2, TETRA_ART * 2);
        const ctx = cv ? this.canvasContext(cv) : null;
        if (!cv || !ctx) { ok = false; continue; }
        // v 0~2 = 뒤집힌 Y(기둥 위·다리 둘 아래) · 3~5 = Y(팔 둘 위·기둥 아래). 기울기는 ±6°만 —
        //  크게 돌리면 옆 열과의 쐐기 맞물림이 깨진다(182차 ±6 → ±3 — 사용자 레퍼런스 도안).
        const base = v < 3 ? -90 : 90;
        paintTetrapod(ctx, 0, 0, base + [0, -3, 3][v % 3]!, tone);
        if (!this.safeRefresh(cv)) ok = false;
      }
    }
    const stoneTones: StoneTone[] = ['dry', 'wet'];
    for (const tone of stoneTones) {
      SeamlessChunks.STONE_DIMS.forEach(([w, h], v) => {
        const key = `srf_stone_${tone}_${v}`;
        if (tm.exists(key)) return;
        const [cw, ch] = stoneCanvasSize(w, h);
        const cv = tm.createCanvas(key, cw, ch);
        const ctx = cv ? this.canvasContext(cv) : null;
        if (!cv || !ctx) { ok = false; return; }
        paintStone(ctx, 0, 0, w, h, 0x7a11 + v * 131, tone, v % 3);
        if (!this.safeRefresh(cv)) ok = false;
      });
    }
    this.armorReady = ok;
  }

  /** 지형 문자의 베이스 텍스처 — 아틀라스가 있으면 **월드 좌표 위상 프레임**, 없으면 Kenney 변형(해시) */
  private groundKeyAt(ch: string, c: number, r: number): string | null {
    const atl = this.surfAtlas.get(ch);
    if (atl) {
      const N = SeamlessChunks.SURF_N;
      return `${atl}#${((c % N) + N) % N}_${((r % N) + N) % N}`;
    }
    const keys = this.groundTex.get(ch);
    if (!keys || keys.length === 0) return null;
    return keys[Math.floor(hash2(this.cfg.seed ^ 0x6e0d, c, r) * keys.length) % keys.length]!;
  }

  /** `key` 또는 `atlas#frame`을 RenderTexture 배치 그리기로 */
  private static put(rt: Phaser.GameObjects.RenderTexture, key: string, x: number, y: number): void {
    const i = key.indexOf('#');
    if (i < 0) rt.batchDraw(key, x, y);
    else rt.batchDrawFrame(key.slice(0, i), key.slice(i + 1), x, y);
  }

  /** 무선(경계선 없는) 45° 삼각형 — Kenney 셀은 미리 구운 `_nl`, 아틀라스 프레임은 필요할 때 굽는다 */
  private triKey(src: string, q: 'ne' | 'nw' | 'se' | 'sw'): string | null {
    if (!src.includes('#')) {
      const nl = `${src}_tri_${q}_nl`;
      if (this.scene.textures.exists(nl)) return nl;
    }
    return this.triOf(src, q);
  }

  /**
   * `'b'`(방파제) 지형 문자의 그림 — **상판 한 종류만**(106차).
   *
   * ⚠ 105차는 여기서 개활도(`raysToOpenSea`)로 사석/상판을 자동 분류하고 물 쪽에 사석 발치·
   * 안벽·테트라포드까지 얹었다. 사용자가 모래-바다 경계에 `'b'`를 칠하자 **한 문자에 시트
   * 전체가 쏟아져 난잡**해졌다(리포트 4). 사석·발치·두부·테트라포드는 이제 **편집기에서
   * 개별 타일/오브젝트로 직접 배치**한다 — 자동 규칙은 상판 변형 선택뿐이다.
   */
  private coastPierKey(c: number, r: number): string {
    // 181차 — 안벽·부두 상판은 무이음 콘크리트(사진 셀은 칸마다 판 이음매가 보였다 — 격자)
    const quay = this.surfAtlas.get('quay');
    if (quay) {
      const N = SeamlessChunks.SURF_N;
      return `${quay}#${((c % N) + N) % N}_${((r % N) + N) % N}`;
    }
    const h = hash2(this.cfg.seed ^ 0xc0a5, c, r);
    if (h > 0.965) return 'ts_coast_deck_seam';
    return `ts_coast_${COAST_DECKS[Math.floor(h * 997) % COAST_DECKS.length]}`;
  }

  /** 모래 접경 방위별 회전 접경 타일 — **직선 구간용** (0=N 1=E 2=S 3=W — 모래가 있는 쪽) */
  private ttpEdge: string[][] = [];
  /** TTP 세트 사용 가능 여부 — false면 103차 절차 서프/구 gem 테트라 폴백 */
  private ttpReady = false;

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
  private roundabouts: { cx: number; cy: number; R: number; halfW: number }[] = [];

  /** 마킹 회랑 클리핑용 도로 세그먼트 + 공간 해시 (109차-b — 교차부 마킹 관통 제거).
   *  markingPieces는 **그래프 정점을 공유하는** 교차만 끊는다 — 정점 없이 기하적으로만 겹치는
   *  교차(이중도로 쌍의 상대 도로·회전교차로 링·중간 관통)에서 중앙선/차선/가장자리선이
   *  교차로 안을 관통했다(사용자 캡처 — 여객터미널 앞 복합 교차부). */
  private markSegs: { ri: number; ax: number; ay: number; dx: number; dy: number; len2: number; ux: number; uy: number; halfW: number }[] = [];
  private markSegHash = new Map<number, number[]>();

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
      this.roundabouts.push({ cx, cy, R: R / rd.pts.length, halfW: rd.w / 2 });
    }
    // 마킹 클리핑 세그먼트 해시 (109차-b) — 셀 8타일, 세그먼트는 halfW+1 팽창 bbox가 닿는 전 셀에
    // 등록 → 조회는 점의 자기 셀만 보면 된다.
    this.markSegs = [];
    this.markSegHash.clear();
    (this.cfg.roads ?? []).forEach((road, ri) => {
      const halfW = road.w / 2;
      for (let i = 0; i < road.pts.length - 1; i++) {
        const [ax, ay] = road.pts[i], [bx, by] = road.pts[i + 1];
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy);
        if (len < 0.2) continue;
        const si = this.markSegs.length;
        this.markSegs.push({ ri, ax, ay, dx, dy, len2: dx * dx + dy * dy, ux: dx / len, uy: dy / len, halfW });
        const pad = halfW + 1;
        const sc0 = Math.floor((Math.min(ax, bx) - pad) / 8), sc1 = Math.floor((Math.max(ax, bx) + pad) / 8);
        const sr0 = Math.floor((Math.min(ay, by) - pad) / 8), sr1 = Math.floor((Math.max(ay, by) + pad) / 8);
        for (let cr = sr0; cr <= sr1; cr++) {
          for (let cc = sc0; cc <= sc1; cc++) {
            const key = cr * 8192 + cc;
            const l = this.markSegHash.get(key);
            if (l) l.push(si); else this.markSegHash.set(key, [si]);
          }
        }
      }
    });
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

  /**
   * 개별 타일 그림 오버라이드(106차) — `RegionPatch.tileTex`.
   *
   * 지형 문자 한 개에 시트 전체를 자동 배정하던 규칙(105차)을 걷어내고, **사용자가 셀을 골라
   * 찍는다**. 그림만 바꾸므로 걷기·충돌은 지형 문자가 그대로 결정한다(편집기가 `base` 문자를
   * 함께 칠한다). 키는 `row * cols + col`.
   */
  private tileTexMap = new Map<number, RegionTileTex>();

  setTileTex(list: RegionTileTex[]): void {
    this.cfg.tileTex = list;
    this.tileTexMap.clear();
    for (const t of list) {
      if (t.tx < 0 || t.tx >= this.cfg.cols || t.ty < 0 || t.ty >= this.cfg.rows) continue;
      this.tileTexMap.set(Math.floor(t.ty) * this.cfg.cols + Math.floor(t.tx), t);
      this.ensureSheetCell(t.tex);
    }
  }

  /**
   * 시트 셀 텍스처 자동 슬라이스(115차) — `ts_<name>_r{r}c{c}`가 없고 `ts_<name>_sheet`가 있으면
   * 시트에서 32px 셀을 캔버스로 잘라 등록한다. 섬 사진 시트(`pixelize_islet.py`)처럼 셀이 수백 개인
   * 에셋을 파일 수백 장 대신 시트 1장으로 싣기 위한 경로. 물 부분은 시트가 투명이라 게임 물이 비친다.
   */
  private ensureSheetCell(tex: string): void {
    const tm = this.scene.textures;
    if (tm.exists(tex)) return;
    const m = /^ts_([a-z0-9]+)_r(\d+)c(\d+)$/.exec(tex);
    if (!m) return;
    const sheetKey = `ts_${m[1]}_sheet`;
    if (!tm.exists(sheetKey)) return;
    const tr = this.cfg.tr;
    const src = this.sourceImage(sheetKey);
    if (!src) return;
    const r = Number(m[2]), c = Number(m[3]);
    if ((c + 1) * tr > src.width || (r + 1) * tr > src.height) return;
    const cv = tm.createCanvas(tex, tr, tr);
    if (!cv) return;
    const ctx = this.canvasContext(cv);
    if (!ctx) { cv.destroy(); return; }
    try { ctx.drawImage(src, c * tr, r * tr, tr, tr, 0, 0, tr, tr); } catch { cv.destroy(); return; }
    this.safeRefresh(cv);
  }

  /**
   * 타일 변형(회전·반전) 텍스처를 필요할 때 한 번만 굽는다 — `<tex>__r<rot><f>`.
   * 캔버스 회전이라 픽셀 정합이 유지된다(스프라이트 회전 렌더는 RT 베이킹에 못 쓴다).
   */
  private tileVariantKey(tex: string, rot = 0, fx = false, fy = false): string {
    if (!rot && !fx && !fy) return tex;
    const tm = this.scene.textures;
    const key = `${tex}__r${rot}${fx ? 'x' : ''}${fy ? 'y' : ''}`;
    if (tm.exists(key)) return key;
    if (!tm.exists(tex)) return tex;
    const src = this.sourceImage(tex);
    if (!src) return tex;
    const swap = rot % 2 === 1;
    const w = swap ? src.height : src.width, h = swap ? src.width : src.height;
    const cv = tm.createCanvas(key, w, h);
    if (!cv) return tex;
    const ctx = this.canvasContext(cv);
    if (!ctx) { cv.destroy(); return tex; }
    ctx.imageSmoothingEnabled = false;
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rot % 4) * Math.PI / 2);
    ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
    try { ctx.drawImage(src, -src.width / 2, -src.height / 2); } catch { cv.destroy(); return tex; }
    this.safeRefresh(cv);
    return key;
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

  /**
   * 도로 위에 얹힌 그림을 **도로 밖(땅)으로 조금 밀어낸다** (150차 — 사용자 리포트
   * "횟집이 뜬금없이 도로 위에 배치되어 있다").
   *
   * 106차 `trimBuildingsOnRoads`는 **건물 타일**을 아스팔트에서 걷어냈지만, POI 프리팹
   * 스프라이트는 건물이 통째로 깎인 자리에서 `poi.tx` 폴백을 쓰므로 차도 한복판에 설 수 있다.
   * 여기서는 가장 가까운 도로 중심선의 **법선 방향**으로 반폭 + 여유만큼 밀고,
   * 밀어낸 자리가 물·건물이면 반대 방향을 시도한다. 둘 다 안 되면 원래 자리를 지킨다
   * (지도를 억지로 흩트리지 않는다).
   *
   * @param px,py 월드 픽셀 · @param clearance 도로 반폭 바깥으로 확보할 타일 수
   */
  nudgeOffRoad(px: number, py: number, clearance = 1.1): { x: number; y: number; moved: boolean } {
    const tr = this.cfg.tr;
    const x = px / tr, y = py / tr;
    const N = this.cfg.chunkTiles;
    const idx = Math.floor(y / N) * this.chunkCols + Math.floor(x / N);
    const list = this.roadsByChunk.get(idx);
    if (!list || !this.cfg.roads) return { x: px, y: py, moved: false };

    let best: { d: number; halfW: number; nx: number; ny: number } | null = null;
    for (const ri of list) {
      const rd = this.cfg.roads[ri];
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
        const vx = bx - ax, vy = by - ay;
        const len2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
        const cx = ax + vx * t, cy = ay + vy * t;
        const d = Math.hypot(cx - x, cy - y);
        if (!best || d < best.d) best = { d, halfW: rd.w / 2, nx: x - cx, ny: y - cy };
      }
    }
    if (!best) return { x: px, y: py, moved: false };
    const need = best.halfW + clearance - best.d;
    if (need <= 0) return { x: px, y: py, moved: false };

    let ux = best.nx, uy = best.ny;
    const l = Math.hypot(ux, uy);
    if (l < 1e-4) { ux = 0; uy = -1; } else { ux /= l; uy /= l; }

    const landable = (tx: number, ty: number): boolean => {
      const ch = this.tileAt(Math.floor(tx), Math.floor(ty));
      return ch === '.' || ch === ',' || ch === 's' || ch === 'w' || ch === 'r';
    };
    for (const sgn of [1, -1]) {
      const nx = x + ux * need * sgn, ny = y + uy * need * sgn;
      if (landable(nx, ny)) return { x: nx * tr, y: ny * tr, moved: true };
    }
    return { x: px, y: py, moved: false };
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
  spawnProp(def: PropDef, tx: number, ty: number, slot?: ChunkSlot, tf?: PropTransform): Phaser.GameObjects.Image | null {
    if (!this.scene.textures.exists(def.tex)) return null;
    const tr = this.cfg.tr;
    const rot = tf?.rot ?? 0;
    // 회전본은 **중앙 앵커** — 바닥 앵커(0.5,1)로 돌리면 발밑을 축으로 휘둘러져 자리를 벗어난다
    const center = def.anchor === 'center' || rot !== 0;
    const x = tx * tr + tr / 2;
    const y = center ? ty * tr + tr / 2 : ty * tr + tr;
    const img = this.scene.add.image(x, y, def.tex)
      .setOrigin(0.5, center ? 0.5 : 1)
      .setScale(def.scale ?? 1)
      .setDepth(def.anchor === 'center' ? 5 : 20 + (ty * tr + tr) * 0.001);
    if (rot) img.setAngle(rot * 90);
    if (tf?.fx) img.setFlipX(true);
    if (tf?.fy) img.setFlipY(true);
    slot?.deco.push(img);
    // 충돌 — 발밑 띠(바닥 앵커) / 전체(중앙 앵커). 청크 walls에 편입해 언로드와 수명을 같이한다.
    //   ⚠ 겹침 허용(free)으로 놓은 것은 **바디를 만들지 않는다** — 테트라포드 무더기처럼 겹쳐
    //   쌓은 오브젝트마다 바디가 생기면 그 일대가 통째로 벽이 된다(106차).
    if (slot && !def.passable && !tf?.free) {
      const fp = propFootprint(this.scene, def, tr);
      const bw = Math.max(tr * 0.5, img.displayWidth * 0.85);
      const body = this.scene.add.rectangle(x, def.anchor === 'center' ? y : y - fp.bodyH / 2, bw, fp.bodyH, 0x000000, 0);
      this.scene.physics.add.existing(body, true);
      this.walls.add(body);
      slot.bodies.push(body);
    } else if (slot && !def.passable && tf?.free && !center && (def.cat === '자연' || def.cat === '시설물')) {
      // 183차 — 자유 배치라도 나무·가로등·벤치·표지는 **몸통(줄기) 크기의 작은 바디**를 둔다.
      //   사용자: "오브젝트 통과하는 것 방지". 173차가 전부 free로 둔 이유(1타일 보도가 통째로 막힘)는
      //   10×8px(플레이어 바디 14px)라 보도 한 칸은 막혀도 옆 차도·맨땅으로 돌아간다.
      const body = this.scene.add.rectangle(x, y - 4, 10, 8, 0x000000, 0);
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
    this.islet = this.computeIslets();
    this.isletDepth = this.computeIsletDepth();
    this.lotAxis = this.computeLotAxis();
    const lots2 = this.computeParkingLots();
    this.parkLot = lots2.id;
    this.lotFill = lots2.fill;
    this.harbor = this.computeHarbor();
    this.bwClass = this.computeBreakwaters();
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
    for (const k of [...this.warm.keys()]) this.dropWarm(k);   // 예열본은 옛 그림이다
    this.rebakeChunks(new Set(this.resident.keys()));
  }

  private rebakeChunks(idxs: Set<number>): void {
    for (const idx of idxs) {
      this.dropWarm(idx);
      const slot = this.resident.get(idx);
      if (!slot) continue;
      const cc = idx % this.chunkCols, cr = Math.floor(idx / this.chunkCols);
      // roofKeys는 인스턴스별 고유 키다(즉시 TextureManager.remove() 금지 — Frame.updateUVs 예외 전례).
      //  182차 — 지붕 아틀라스도 이미지 파괴 뒤에 버린다(clearSlotContents)
      this.clearSlotContents(slot);
      this.buildChunkCollision(cc, cr, slot);
      this.buildChunkDeco(cc, cr, slot);
      slot.decoBuilt = true;
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
    if (ch === '~' || ch === 'K') return true;      // 183차 — 암반 절벽은 통째로 막는다
    if (ch !== '#') return false;
    return this.tileAt(c, r + 1) !== '#' || this.tileAt(c, r + 2) !== '#';
  }

  // ── 183차 · 고도 층 · 계단 ─────────────────────────────

  /**
   * 층·계단 목록 교체 (patch.levels / patch.stairs). 편집기가 부르면 상주 청크를 다시 굽는다 —
   * 층 경계 벽은 충돌 바디라 재베이킹(buildChunkCollision)까지 가야 반영된다.
   */
  setLevels(levels: [number, number, number][], stairs: RegionStair[], rebake = true): void {
    const { cols, rows } = this.cfg;
    this.cfg.levels = levels;
    this.cfg.stairs = stairs;
    this.levelGrid.fill(0);
    for (const [c, r, l] of levels) {
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      this.levelGrid[r * cols + c] = Math.max(0, Math.min(255, l | 0));
    }
    this.stairMap.clear();
    for (const s of stairs) {
      if (s.tx < 0 || s.ty < 0 || s.tx >= cols || s.ty >= rows) continue;
      this.stairMap.set(s.ty * cols + s.tx, s);
    }
    if (rebake) this.rebakeResident();
  }

  /** 피복 지정 교체(편집기) — 방파제 분류를 다시 계산하고 상주 청크를 다시 굽는다 */
  setArmor(armor: RegionArmor[]): void {
    this.armorSpec = armor;
    this.cfg.armor = armor;
    this.bwClass = this.computeBreakwaters();
    this.rebakeResident();
  }

  /** 방파제 성분 id (편집기 피복 지정) — 성분 밖 −1 */
  breakwaterCompAt(c: number, r: number): number {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return -1;
    return this.bwComp[r * this.cfg.cols + c];
  }

  levelAt(c: number, r: number): number {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return 0;
    return this.levelGrid[r * this.cfg.cols + c]!;
  }

  stairAt(c: number, r: number): RegionStair | undefined {
    return this.stairMap.get(r * this.cfg.cols + c);
  }

  /** 층 판정용 셀 — 걷기 여부는 지형 문자(core TERRAIN_DEFS) + 건물 하단 2줄 규칙 */
  private levelCell(c: number, r: number): LevelCell {
    const ch = this.tileAt(c, r);
    const walkable = !(terrainDef(ch)?.walkable === false) && !this.isBlockedAt(c, r);
    return { walkable, level: this.levelAt(c, r), stair: this.stairAt(c, r) };
  }

  /** (c, r)에서 `edge` 방향 이웃으로 한 칸 옮길 수 있는가 — 층·계단 규칙(core canStep) */
  stepOk(c: number, r: number, edge: TileEdge): boolean {
    const nc = c + (edge === 'e' ? 1 : edge === 'w' ? -1 : 0);
    const nr = r + (edge === 's' ? 1 : edge === 'n' ? -1 : 0);
    if (nc < 0 || nr < 0 || nc >= this.cfg.cols || nr >= this.cfg.rows) return false;
    return canStep(this.levelCell(c, r), this.levelCell(nc, nr), edge);
  }

  /**
   * 층 경계 벽(183차) — 같은 청크 안의 타일 변 중 **양쪽이 걸을 수 있는데 층 규칙이 막는 변**에
   * 얇은 정적 바디를 세운다(동·남 변만 보면 모든 변을 한 번씩 본다 — 청크 경계 변은 서쪽/북쪽 청크가 소유).
   * 계단 옆벽도 같은 규칙에서 나온다. 물·건물·절벽 자체는 타일 바디(buildChunkCollision 상단)가 맡는다.
   */
  private buildLevelWalls(c0: number, r0: number, c1: number, r1: number, slot: ChunkSlot): void {
    if (this.stairMap.size === 0 && (this.cfg.levels?.length ?? 0) === 0) return;
    const tr = this.cfg.tr;
    const T = 6;                                       // 벽 두께(px) — 캐릭터 바디(≈20px)보다 훨씬 얇다
    const add = (x: number, y: number, w: number, h: number): void => {
      const rect = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
      this.scene.physics.add.existing(rect, true);
      this.walls.add(rect);
      slot.bodies.push(rect);
    };
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const me = this.levelCell(c, r);
        if (!me.walkable) continue;
        // 동쪽 변
        if (c + 1 < this.cfg.cols) {
          const e = this.levelCell(c + 1, r);
          if (e.walkable && !canStep(me, e, 'e')) add((c + 1) * tr - T / 2, r * tr, T, tr);
        }
        // 남쪽 변
        if (r + 1 < this.cfg.rows) {
          const s = this.levelCell(c, r + 1);
          if (s.walkable && !canStep(me, s, 's')) add(c * tr, (r + 1) * tr - T / 2, tr, T);
        }
      }
    }
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

  /**
   * 섬/암초 검출 — 바다로 둘러싸인 소형 육지 컴포넌트(≤ 600타일 · 도로/건물 없음 — 조도 등).
   * 포장 광장 톤 대신 갯바위(절차)로 그린다(위성 실사 정합 — 사용자 리포트 7번 캡처).
   */
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

  /**
   * 주차장 열 주축(112차) — 도로 밖 `'r'` 면을 **5×5 침식**한 성분의 bbox 종횡비로 행 방향을 정한다.
   *  1 = 가로 행(세로 주차 — 정면/후면 프레임) · 2 = 세로 행(가로 주차 — 측면 프레임) · 0 = 해당 없음.
   *  5×5 침식이라 폭 ≤ 4타일 도로 회랑은 사라지고 광장·주차장만 남는다 — 성분이 도로와 이어져
   *  종횡비가 도로 방향에 끌리는 문제(111차 보류 사유)를 피한다. 청크와 무관한 전역 1회 계산이라
   *  청크 경계에서 방향이 갈리지 않는다. 침식으로 빠진 가장자리 타일은 반경 2 팽창으로 축을 물려받는다.
   */
  private computeLotAxis(): Uint8Array {
    const { cols, rows } = this.cfg;
    const n = cols * rows;
    const core = new Uint8Array(n);
    for (let r = 2; r < rows - 2; r++) {
      for (let c = 2; c < cols - 2; c++) {
        if (this.tileAt(c, r) !== 'r') continue;
        let ok = true;
        for (let dr = -2; dr <= 2 && ok; dr++) for (let dc = -2; dc <= 2; dc++) if (this.tileAt(c + dc, r + dr) !== 'r') { ok = false; break; }
        if (ok) core[r * cols + c] = 1;
      }
    }
    const axis = new Uint8Array(n);
    const seen = new Uint8Array(n);
    const stack: number[] = [];
    for (let i0 = 0; i0 < n; i0++) {
      if (!core[i0] || seen[i0]) continue;
      const comp: number[] = [];
      let c0 = cols, c1 = -1, r0 = rows, r1 = -1;
      stack.push(i0); seen[i0] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        comp.push(i);
        const c = i % cols, r = Math.floor(i / cols);
        if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc;
          if (core[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
        }
      }
      const a = (r1 - r0 + 1) >= (c1 - c0 + 1) * 1.35 ? 2 : 1;   // 세로로 길면 세로 행
      for (const i of comp) axis[i] = a;
    }
    const out = new Uint8Array(n);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.tileAt(c, r) !== 'r') continue;
        let a = 0;
        for (let dr = -2; dr <= 2 && !a; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
            const v = axis[nr * cols + nc];
            if (v) { a = v; break; }
          }
        }
        out[r * cols + c] = a;
      }
    }
    return out;
  }

  /**
   * 항만 수역(112차) — 뭍 가까운 물(`waterDist ≤ 6`) 중 4방향 광선(14타일)이 **3개 이상 뭍에 닿는**
   * 둘러싸인 물 = 항 내측·석호. 외해 쪽 방파제 바깥(광선 1~2개)은 제외돼 정박 어선이 외해에 놓이지 않는다.
   */
  private computeHarbor(): Uint8Array {
    const { cols, rows } = this.cfg;
    const out = new Uint8Array(cols * rows);
    const RAY = 14;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.tileAt(c, r) !== '~' || this.waterDist[r * cols + c] > 6) continue;
        let hits = 0;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          for (let k = 1; k <= RAY; k++) {
            const nc = c + dc * k, nr = r + dr * k;
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) break;
            if (this.tileAt(nc, nr) !== '~') { hits++; break; }
          }
        }
        if (hits >= 3) out[r * cols + c] = 1;
      }
    }
    return out;
  }

  /**
   * 주차장 구역 검출(113차 — 사용자 지시 "주차장 같은 공간에만, 40~70% 랜덤").
   *
   * 112차는 **도로 밖 `'r'` 전부**(16,630타일)에 열을 깔아 광장·매립지·항만 에이프런까지
   * 차로 뒤덮였다(사용자: "너무 많은 차"). 여기서는 그 중 **주차장처럼 생긴 성분만** 고른다:
   *  - 크기 40~700타일 (그 이상은 광장·부지 — 실측 2,174 / 1,253타일 성분이 주범이었다)
   *  - bbox 채움률 ≥ 0.5 · 최소 변 4타일 (직사각형에 가까운 면)
   *  - 5타일 안에 차도 (진입로 없는 면은 주차장이 아니다)
   *  - **섬(islet) 제외** — 갯바위 섬에 차가 설 수 없다
   * 성분마다 목표 점유율 0.40~0.70을 해시로 뽑아 만차/한산이 섞이게 한다.
   * 전역 1회 계산이라 청크 경계에서 구역이 갈리지 않는다(함정 28).
   */
  private computeParkingLots(): { id: Uint16Array; fill: Float32Array } {
    const { cols, rows } = this.cfg;
    const n = cols * rows;
    const N = this.cfg.chunkTiles;
    const id = new Uint16Array(n);
    const fills: number[] = [0];
    const core = new Uint8Array(n);
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (this.tileAt(c, r) !== 'r' || this.islet[r * cols + c]) continue;
        let ok = true;
        for (let dr = -1; dr <= 1 && ok; dr++) for (let dc = -1; dc <= 1; dc++) if (this.tileAt(c + dc, r + dr) !== 'r') { ok = false; break; }
        if (!ok) continue;
        const band = this.roadBand(c + 0.5, r + 0.5, Math.floor(r / N) * this.chunkCols + Math.floor(c / N));
        if (band && band.d < band.halfW + 1.2) continue;      // 차도·연석 침범 금지
        core[r * cols + c] = 1;
      }
    }
    const seen = new Uint8Array(n);
    const stack: number[] = [];
    for (let i0 = 0; i0 < n; i0++) {
      if (!core[i0] || seen[i0]) continue;
      const cells: number[] = [];
      let c0 = cols, c1 = -1, r0 = rows, r1 = -1;
      stack.push(i0); seen[i0] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        cells.push(i);
        const c = i % cols, r = Math.floor(i / cols);
        if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc;
          if (core[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
        }
      }
      const w = c1 - c0 + 1, h = r1 - r0 + 1;
      if (cells.length < 40 || cells.length > 700 || w < 4 || h < 4) continue;
      if (cells.length / (w * h) < 0.5) continue;
      let access = false;
      for (const i of cells) {
        if (access) break;
        const c = i % cols, r = Math.floor(i / cols);
        const band = this.roadBand(c + 0.5, r + 0.5, Math.floor(r / N) * this.chunkCols + Math.floor(c / N));
        if (band && band.d < band.halfW + 5) access = true;
      }
      if (!access) continue;
      const lotId = fills.length;
      if (lotId > 65535) break;
      fills.push(0.40 + hash2(this.cfg.seed ^ 0x9a90, c0, r0) * 0.30);
      for (const i of cells) id[i] = lotId;
    }
    return { id, fill: Float32Array.from(fills) };
  }

  /**
   * 방파제 단면 분류(114차 — 사용자 지시 "청호동 방파제를 위성 사진처럼: 테트라포드 + 등대").
   *
   * 지형은 방파제 전체를 `'b'`(+상판 자리 일부 `'.'`)로만 주고 단면 정보가 없다. 106차가 자동
   * 사석/테트라포드 규칙을 폐기한 뒤로 방파제는 상판 셀만 깔려 **넓은 콘크리트 판**으로 보였다.
   * 여기서는 `'b'` 성분마다 **물까지의 거리**로 단면을 만든다(위성 사진 비율 — 상판 좁고 양쪽 피복):
   *  - dw ≤ 2 → 테트라포드 피복(TTP 시트 tile_ttp_a/b) · dw = 3(폭 넓은 방파제만) → 사석 · 안쪽 → 상판
   *  - 상판 자리 `'.'`(8이웃이 b/./물뿐인 것)은 성분에 편입해 Kenney tan 대신 콘크리트 상판으로.
   * **방파제 판정** = 성분 크기 ≥ 12 ∧ 외해(비항만) 접수 ≥ 8타일 ∧ 외해 비율 ≥ 0.35.
   *  항 내측 안벽(`'b'`지만 항만 수역만 접함)은 0 = 기존 상판 렌더 유지. 섬(조도) 성분 제외.
   * 전역 1회(함정 28) — 청크 경계에서 피복 폭이 갈리지 않는다.
   */
  private computeBreakwaters(): Uint8Array {
    const { cols, rows } = this.cfg;
    const n = cols * rows;
    const cls = new Uint8Array(n);
    this.bwComp = new Int32Array(n).fill(-1);
    this.bwInfo = [];
    this.bwArm = new Uint8Array(n);
    const CAP = 7;
    // 1) dw — 물까지 거리, b/'.' 위로만 전파
    const dw = new Uint8Array(n).fill(CAP);
    const queue: number[] = [];
    for (let i = 0; i < n; i++) if (this.tileAt(i % cols, Math.floor(i / cols)) === '~') { dw[i] = 0; queue.push(i); }
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head];
      const d = dw[i] + 1;
      if (d >= CAP) continue;
      const c = i % cols, r = Math.floor(i / cols);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const j = nr * cols + nc;
        const t = this.tileAt(nc, nr);
        if ((t === 'b' || t === '.') && dw[j] > d) { dw[j] = d; queue.push(j); }
      }
    }
    // 상판 자리 '.' 편입 자격 — 물가 4타일 안 ∧ 8이웃이 b/./물뿐 ∧ 섬 아님
    const eligibleDot = (c: number, r: number): boolean => {
      const i = r * cols + c;
      if (dw[i] > 4 || this.islet[i]) return false;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) return false;
        const t = this.tileAt(nc, nr);
        if (t !== 'b' && t !== '.' && t !== '~') return false;
      }
      return true;
    };
    // 2) 성분 — 'b'에서 시작, 8-연결, 자격 있는 '.'까지 확장
    const seen = new Uint8Array(n);
    const stack: number[] = [];
    for (let i0 = 0; i0 < n; i0++) {
      if (seen[i0] || this.tileAt(i0 % cols, Math.floor(i0 / cols)) !== 'b') continue;
      const cells: number[] = [];
      let sea = 0, har = 0, dwMax = 0, touchIslet = false;
      stack.push(i0); seen[i0] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        cells.push(i);
        if (dw[i] > dwMax) dwMax = dw[i];
        const c = i % cols, r = Math.floor(i / cols);
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (dc === 0 && dr === 0) continue;
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc;
          if (this.islet[j]) touchIslet = true;
          const t = this.tileAt(nc, nr);
          const ortho = dc === 0 || dr === 0;
          if (t === '~') { if (ortho) { if (this.harbor[j]) har++; else sea++; } continue; }
          if (seen[j]) continue;
          if (t === 'b' || (t === '.' && eligibleDot(nc, nr))) { seen[j] = 1; stack.push(j); }
        }
      }
      // 184차 — 수동 피복 지정이 있는 성분은 규모·외해 문턱을 건너뛴다(위성 대조가 정답이다).
      //   호숫가 한 줄 테트라포드(청초호 조양동)는 폭 1타일에 수역이 '항만'으로 잡혀 문턱에서 조용히 빠졌다.
      const cellSet = new Set(cells);
      const preSpec = this.armorSpec.find((a) => a.tx >= 0 && a.ty >= 0 && a.tx < cols && a.ty < rows && cellSet.has(a.ty * cols + a.tx));
      if (!preSpec && (touchIslet || cells.length < 12 || sea < 8 || sea / (sea + har) < 0.35)) continue;
      // 안쪽 구멍 메우기 — 폭 넓은 상판(예: 청호동 두부 8타일)의 가운데는 물에서 5타일 이상 떨어져
      //   자격(dw ≤ 4)에서 빠진다. 편입 셀과 4-이웃 2개 이상 맞닿은 '.'을 수렴할 때까지 흡수한다
      //   (8이웃 b/./물 조건은 유지 — 뭍 쪽으로는 새지 않는다).
      const inComp = new Uint8Array(n);
      for (const i of cells) inComp[i] = 1;
      let grew = true;
      while (grew) {
        grew = false;
        for (let k = 0, len = cells.length; k < len; k++) {
          const i = cells[k];
          const c = i % cols, r = Math.floor(i / cols);
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
            const j = nr * cols + nc;
            if (inComp[j] || this.tileAt(nc, nr) !== '.' || this.islet[j]) continue;
            let adj = 0;
            if (nc > 0 && inComp[j - 1]) adj++;
            if (nc < cols - 1 && inComp[j + 1]) adj++;
            if (nr > 0 && inComp[j - cols]) adj++;
            if (nr < rows - 1 && inComp[j + cols]) adj++;
            if (adj < 2) continue;
            let clean = true;
            for (let er = -1; er <= 1 && clean; er++) for (let ec = -1; ec <= 1; ec++) {
              const t = this.tileAt(nc + ec, nr + er);
              if (t !== 'b' && t !== '.' && t !== '~') { clean = false; break; }
            }
            if (!clean) continue;
            inComp[j] = 1; seen[j] = 1; cells.push(j); grew = true;
          }
        }
      }
      // 181차 — 피복 종류. 외해에 넓게 면한 큰 방파제만 테트라포드를 두르고, 작은 방파제·항내 쪽이
      //   더 많은 방파제는 **사석**(돌덩이)이다(사용자 지시 — "테트라포트가 없는 일반 돌덩이 방파제").
      //   OSM은 피복 재료를 알려주지 않으므로 규모·외해 노출로 추정한다.
      const seaRatio = sea / Math.max(1, sea + har);
      let armor: 1 | 2 = cells.length >= 60 && seaRatio >= 0.5 ? 1 : 2;
      // 183차 — 수동 피복 지정(patch.armor)이 규모 추정을 덮는다. 사용자: "테트라포드 방파제인 경우에만
      //   한정해서 좌/우로 배치 … 한쪽에만 배치되는 경우도 있다(동명항 = 우측만)". 위성이 정답이라
      //   OSM 추정은 지정이 없는 성분에만 남긴다.
      const spec = this.armorSpec.find((a) => a.tx >= 0 && a.ty >= 0 && a.tx < cols && a.ty < rows && inComp[a.ty * cols + a.tx] === 1);
      if (spec) armor = spec.kind === 'tetrapod' ? 1 : 2;
      // 184차 — 'quay' = 피복 없는 연석 직벽. 사석 성분의 돌 상판을 쓰되 전 방위를 안벽으로 둔다
      //   (동명항 내측·청초호 수로 — "주변 자갈·테트라포드 없이 딱 연석만 쌓은 느낌")
      const quayAll = spec?.kind === 'quay';
      const sides = spec?.sides && spec.sides.length > 0 ? spec.sides : null;
      const info: BwArmorInfo = armor === 1
        ? { armor, dwMax, rubbleFrom: 2.5, deckFrom: dwMax >= 5 ? 3.5 : 2.5 }
        : { armor, dwMax, rubbleFrom: 0.5, deckFrom: dwMax <= 1 ? 0.97 : dwMax === 2 ? 1.5 : 1.75 };
      const id = this.bwInfo.length;
      this.bwInfo.push(info);
      const DIRS4: [number, number, TileEdge][] = [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']];
      for (const i of cells) {
        const d = dw[i];
        this.bwComp[i] = id;
        // 피복이 깔리는 쪽인가 — 가장 가까운 물이 있는 방위(dw가 가장 작은 4-이웃)가 지정 방위에 들면 피복,
        //   아니면 안벽(콘크리트 직벽 — 상판이 물가까지 이어진다)
        let armed = quayAll ? 0 : 1;
        if (sides && !quayAll) {
          const c = i % cols, r = Math.floor(i / cols);
          let best = d, bestE: TileEdge | null = null;
          for (const [dc, dr, e] of DIRS4) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
            const j = nr * cols + nc;
            if (dw[j] < best) { best = dw[j]; bestE = e; }
          }
          armed = bestE === null ? 1 : sides.includes(bestE) ? 1 : 0;
        }
        this.bwArm[i] = armed;
        cls[i] = !armed ? 1 : armor === 1
          ? (d <= 2 ? 3 : (d === 3 && dwMax >= 5 ? 2 : 1))
          : (d <= 1 ? 2 : 1);
      }
      // 척추는 성분 표시 **뒤에** 잡는다 — 끝이 뭍에 닿는지 볼 때 자기 칸을 뭍으로 오인하지 않게
      if (armor === 2) info.spine = this.fitSpine(cells, cols, rows);
    }
    this.bwV = new Uint8Array(n);
    this.bwNear = new Int32Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const k = this.bwComp[i];
      this.bwV[i] = k >= 0 ? dw[i] : this.tileAt(c, r) === '~' ? 0 : 9;
      if (k < 0) continue;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const cc = c + dc, rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        const j = rr * cols + cc;
        if (this.bwComp[j] >= 0) { this.bwNear[j] = this.bwComp[j]; continue; }
        if (this.bwNear[j] < 0) this.bwNear[j] = k;
      }
    }
    // 청크별 방파제 존재(±2타일) — 스프라이트 패스 조기 탈출
    const N = this.cfg.chunkTiles;
    const ccols = Math.ceil(cols / N), crows = Math.ceil(rows / N);
    this.chunkArmor = new Uint8Array(ccols * crows);
    for (let i = 0; i < n; i++) {
      if (this.bwComp[i] < 0) continue;
      const c = i % cols, r = Math.floor(i / cols);
      for (let dr = -2; dr <= 2; dr += 4) for (let dc = -2; dc <= 2; dc += 4) {
        const cc = Math.min(ccols - 1, Math.max(0, Math.floor((c + dc) / N)));
        const rr = Math.min(crows - 1, Math.max(0, Math.floor((r + dr) / N)));
        this.chunkArmor[rr * ccols + cc] = 1;
      }
    }
    return cls;
  }

  // ── 181차 · 방파제 거리장 · 단면 · 피복 스프라이트 ─────────────────────

  /** 거리장 표본 — 물 0 · 방파제 성분 dw · 그 밖의 뭍 9 (타일 중심) */
  private bwVal(c: number, r: number): number {
    const { cols, rows } = this.cfg;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return 0;
    return this.bwV[r * cols + c]!;
  }

  /** 월드 px의 연속 거리장 — 타일 중심 표본의 쌍선형 보간(대각선에서 등치선이 45° 직선) */
  private bwField(wx: number, wy: number): number {
    const tr = this.cfg.tr;
    const u = wx / tr - 0.5, v = wy / tr - 0.5;
    const i0 = Math.floor(u), j0 = Math.floor(v);
    const fx = u - i0, fy = v - j0;
    const a = this.bwVal(i0, j0), b = this.bwVal(i0 + 1, j0);
    const c = this.bwVal(i0, j0 + 1), d = this.bwVal(i0 + 1, j0 + 1);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }

  /** 이 타일(또는 8이웃)의 방파제 성분 — 물 가장자리 타일은 이웃 성분을 따른다 */
  private bwCompNear(c: number, r: number): number {
    const { cols, rows } = this.cfg;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    return this.bwNear[r * cols + c]!;
  }

  private bwInfoAt(wx: number, wy: number): BwArmorInfo | null {
    const tr = this.cfg.tr;
    const k = this.bwCompNear(Math.floor(wx / tr), Math.floor(wy / tr));
    return k < 0 ? null : this.bwInfo[k]!;
  }

  /**
   * 이 타일에 피복(테트라포드·사석)이 깔리는가(183차). 성분 셀은 `bwArm`, 가장자리 물 타일은
   * 8이웃 성분 셀 중 하나라도 피복이면 피복(그쪽으로 발치가 잠긴다) — 전부 안벽이면 0.
   */
  private bwArmAt(c: number, r: number): boolean {
    const { cols, rows } = this.cfg;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return true;
    const i = r * cols + c;
    if (this.bwComp[i] >= 0) return this.bwArm[i] === 1;
    let sawComp = false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      const j = rr * cols + cc;
      if (this.bwComp[j] < 0) continue;
      sawComp = true;
      if (this.bwArm[j] === 1) return true;
    }
    return !sawComp;
  }

  private bwArmAtPx(wx: number, wy: number): boolean {
    const tr = this.cfg.tr;
    return this.bwArmAt(Math.floor(wx / tr), Math.floor(wy / tr));
  }

  /**
   * 방파제 단면을 2px 셀로 칠한다(181차) — 성분 타일과 그 가장자리 물 타일에서 호출.
   *  물 < 물가선(노이즈로 흔들린다) ≤ 피복 틈(아주 어둡게) / 사석 틈(어두운 갈색) < 돌길 옆면 < 돌길.
   *  물 쪽 띠에는 포말이 부서진다. 셀이 같은 색으로 이어지면 한 번에 칠한다(런 병합).
   */
  private drawBwSurface(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const k = this.bwCompNear(c, r);
    if (k < 0) return;
    const info = this.bwInfo[k]!;
    const tr = this.cfg.tr;
    const seed = this.cfg.seed ^ 0x6b21;
    const wx0 = c * tr, wy0 = r * tr;
    // 183차 — 피복이 없는 쪽(안벽)은 물가선이 곧고, 물가선 안쪽이 바로 돌길(콘크리트)이다
    const quay = !this.bwArmAt(c, r);
    const wob = quay ? 0.06 : info.armor === 1 ? 0.26 : 0.18;
    // 주조색 가중 — 셀마다 팔레트를 고르게 뽑으면 런이 끊겨 fillRect가 셀 수만큼 늘었다(굽기 +40%).
    //   바탕색 한 번 + 다른 셀만 덧칠하도록 대부분을 첫 색으로 모은다.
    const pick = (pal: readonly number[], h: number, main: number): number =>
      h < main ? pal[0]! : pal[1 + Math.floor((h - main) / (1 - main) * (pal.length - 1)) % (pal.length - 1)]!;
    const G = tr >> 1;
    const cells = new Int32Array(G * G);
    let hasWater = false;
    const freq = new Map<number, number>();
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        let col = -1;
        const wx = wx0 + x + 1, wy = wy0 + y + 1;
        const f = this.bwField(wx, wy);
        // 물가선 흔들림 — 물가 근처에서만 평가한다(안쪽은 결과가 같다)
        const wl = f < 1.1 ? 0.5 + (noise2(seed, wx / 13, wy / 13) - 0.5) * wob : 0.5;
        const h = hash2(seed ^ 0x55, wx >> 1, wy >> 1);
        const sp = info.spine;
        const ds = sp ? SeamlessChunks.segDist(wx / tr, wy / tr, sp) : 0;
        // 테트라포드는 바깥 한 겹이 **물에 발을 담근다** — 물가선 안쪽 0.3칸까지는 어두운 틈 대신
        //   물과 포말이 비친다(레퍼런스 ③: 바깥 블록 사이로 흰 포말이 부서진다)
        const wlFill = quay ? wl : info.armor === 1 ? wl + 0.3 : wl;
        if (f < wl) {
          // 물 — 구조물에 부딪혀 부서지는 포말(물가선에 가까울수록 짙다). 테트라포드는 더 거칠게 부순다
          const band = quay ? 0.16 : info.armor === 1 ? 0.34 : 0.26;
          const t = (f - (wl - band)) / band;
          const dens = quay ? 0.4 : info.armor === 1 ? 0.85 : 0.62;
          if (t > 0 && h < t * t * dens) col = h < t * t * dens * 0.45 ? FOAM_A : FOAM_B;
        } else if (quay) {
          // 안벽 — 물가선에서 곧장 돌길. 가장자리 캡(밝은 모서리) + 캡 아래 그늘 한 줄
          col = f < wl + 0.1 ? SLAB_EDGE : f < wl + 0.2 ? SLAB_FACE : h < 0.035 ? SLAB_SPECK : pick(SLAB, h, 0.8);
        } else if (f < wlFill) {
          const t = (f - wl) / 0.3;                              // 0 = 물가선 · 1 = 틈 시작
          col = h < 0.5 - t * 0.2 ? (h < 0.22 ? FOAM_A : FOAM_B) : t > 0.75 && h > 0.8 ? TTP_UNDER[0]! : -1;
        } else if (sp) {
          // 사석 방파제 — 척추 둘레의 매끄러운 직사각 돌길 · 옆면 · 돌 틈
          if (ds <= sp.hw) col = ds > sp.hw - 0.06 ? SLAB_EDGE : h < 0.035 ? SLAB_SPECK : pick(SLAB, h, 0.8);
          else if (ds <= sp.hw + 0.12) col = ds <= sp.hw + 0.07 ? SLAB_FACE : SLAB_FACE_LO;
          else col = pick(CREVICE, h, 0.75);
        } else if (f >= info.deckFrom) {
          col = f < info.deckFrom + 0.06 ? SLAB_EDGE : h < 0.035 ? SLAB_SPECK : pick(SLAB, h, 0.8);
        } else if (f >= info.deckFrom - 0.12) {
          col = f >= info.deckFrom - 0.07 ? SLAB_FACE : SLAB_FACE_LO;
        } else if (f < info.rubbleFrom) {
          col = pick(TTP_UNDER, h, 0.82);
        } else {
          col = pick(CREVICE, h, 0.75);
        }
        cells[(y >> 1) * G + (x >> 1)] = col;
        if (col < 0) hasWater = true;
        else freq.set(col, (freq.get(col) ?? 0) + 1);
      }
    }
    // 물이 없는 칸은 최빈색으로 한 번 깔고 나머지만 덧칠한다
    let base = -1;
    if (!hasWater) {
      let best = 0;
      for (const [col, nn] of freq) if (nn > best) { best = nn; base = col; }
      if (base >= 0) { g.fillStyle(base, 1); g.fillRect(lx, ly, tr, tr); }
    }
    for (let yy = 0; yy < G; yy++) {
      let runCol = -1, runX = 0;
      for (let xx = 0; xx <= G; xx++) {
        let col = xx < G ? cells[yy * G + xx]! : -1;
        if (col === base) col = -1;
        if (col !== runCol) {
          if (runCol >= 0 && xx > runX) { g.fillStyle(runCol, 1); g.fillRect(lx + runX * 2, ly + yy * 2, (xx - runX) * 2, 2); }
          runCol = col; runX = xx;
        }
      }
    }
  }

  /**
   * 피복 스프라이트(181차) — 청크 하나에 걸치는 테트라포드·돌을 **월드 격자**에서 골라 그린다.
   * 청크 경계에 걸친 스프라이트는 양쪽 청크가 같은 좌표로 그려 이음이 없다.
   *
   *  - `sub` (지면 베이스 직후) — 물에 잠긴 발치: 젖은 돌 · 반쯤 잠긴 테트라포드
   *  - `top` (절차 패스 뒤) — 틈 속 아래 층 테트라포드 → 맨 위 층(Y·역Y 교차) → 수면 위 돌
   */
  private drawArmorSprites(rt: Phaser.GameObjects.RenderTexture, idx: number, c0: number, r0: number, stage: 'sub' | 'top'): void {
    if (!this.armorReady || !this.chunkArmor[idx]) return;
    const tr = this.cfg.tr, N = this.cfg.chunkTiles;
    const px0 = c0 * tr, py0 = r0 * tr;
    const px1 = Math.min(c0 + N, this.cfg.cols) * tr, py1 = Math.min(r0 + N, this.cfg.rows) * tr;
    const M = 28;
    const seed = this.cfg.seed ^ 0x7e7a;
    const snap = (v: number): number => Math.round(v / 2) * 2;
    type Spr = { key: string; x: number; y: number };
    const out: Spr[] = [];
    // ── 테트라포드 교차 열 — 열마다 ⅄ · Y 번갈아(행 높이 거의 같음) + 열 사이 반 칸의 아래 층 ──
    const half = TETRA_ART;                                 // 캔버스(아트 ×2)의 절반
    const jA = Math.floor((py0 - M) / TTP_DY) - 1, jB = Math.ceil((py1 + M) / TTP_DY) + 1;
    const kA = Math.floor((px0 - M) / TTP_DX) - 1, kB = Math.ceil((px1 + M) / TTP_DX) + 1;
    const lows: Spr[] = [];
    for (let j = jA; j <= jB; j++) {
      for (let k = kA; k <= kB; k++) {
        const inv = (k & 1) === 0;                          // 짝수 열 = ⅄(기둥 위) · 홀수 열 = Y
        const oy = inv ? TTP_INV_OY : 0;
        const pts: [number, number, boolean, boolean][] = [
          [k * TTP_DX, j * TTP_DY + oy, inv, false],
          // 아래 층 — 열 사이 반 칸 · 반 행, 왼쪽 열과 같은 방위. 위층의 쐐기 틈으로만 비친다(음영)
          [k * TTP_DX + TTP_LOW_OX, j * TTP_DY + TTP_LOW_OY + oy, inv, true],
        ];
        for (const [x0, y0, isInv, low] of pts) {
          if (x0 < px0 - M || x0 > px1 + M || y0 < py0 - M || y0 > py1 + M) continue;
          const kind = low ? 2 : isInv ? 0 : 1;
          const hj = hash2(seed ^ (0x11 + kind), Math.round(x0), Math.round(y0));
          const x = x0 + (hj - 0.5) * 3, y = y0 + (hash2(seed ^ (0x21 + kind), Math.round(x0), Math.round(y0)) - 0.5) * 3;
          const info = this.bwInfoAt(x, y);
          if (!info || info.armor !== 1) continue;
          if (!this.bwArmAtPx(x, y)) continue;               // 183차 — 안벽 쪽에는 테트라포드가 없다
          const f = this.bwField(x, y);
          const v = (isInv ? 0 : 3) + Math.floor(hj * 3) % 3;
          const at = { x: snap(x - half) - px0, y: snap(y - half) - py0 };
          if (low) {
            if (stage === 'top' && f >= 0.8 && f < info.rubbleFrom && f < info.deckFrom - 0.55) lows.push({ key: `srf_ttp4_low_${v}`, ...at });
            continue;
          }
          if (stage === 'sub') {
            // 물가 발치 — 절반 넘게 잠긴 테트라포드 (포말이 그 위를 덮는다)
            if (f >= 0.2 && f < 0.56 && hj < 0.55) out.push({ key: `srf_ttp4_wet_${v}`, ...at });
          } else if (f >= 0.56 && f < info.rubbleFrom + 0.15 && f < info.deckFrom - 0.5) {
            out.push({ key: `srf_ttp4_top_${v}`, ...at });
          }
        }
      }
    }
    // ── 돌 — 흔들린 10px 격자 (사석 방파제 전부 + 테트라포드 방파제의 사석 띠) ──
    const S = 10;
    const gA = Math.floor((py0 - M) / S), gB = Math.ceil((py1 + M) / S);
    const hA = Math.floor((px0 - M) / S), hB = Math.ceil((px1 + M) / S);
    const stones: Spr[] = [];
    for (let gy = gA; gy <= gB; gy++) {
      for (let gx = hA; gx <= hB; gx++) {
        const h = hash2(seed ^ 0x3a, gx, gy);
        const x = gx * S + hash2(seed ^ 0x3b, gx, gy) * 8 - 4, y = gy * S + hash2(seed ^ 0x3c, gx, gy) * 8 - 4;
        const info = this.bwInfoAt(x, y);
        if (!info) continue;
        if (!this.bwArmAtPx(x, y)) continue;                 // 183차 — 안벽 쪽에는 돌도 없다
        const f = this.bwField(x, y);
        const v = Math.floor(h * 997) % SeamlessChunks.STONE_DIMS.length;
        const [w, hh] = SeamlessChunks.STONE_DIMS[v]!;
        const cw = (w + 2) * 2, chh = (hh + 2) * 2;
        const reach = Math.max(cw, chh) / 2 / tr;           // 돌길 옆면을 덮지 않을 여유
        if (stage === 'sub') {
          if (info.armor === 2 && f >= 0.16 && f < 0.47 && h < 0.62) {
            stones.push({ key: `srf_stone_wet_${v}`, x: snap(x - cw / 2) - px0, y: snap(y - chh / 2) - py0 });
          }
          continue;
        }
        const lo = info.armor === 2 ? 0.47 : info.rubbleFrom;
        const sp = info.spine;
        const clear = sp ? SeamlessChunks.segDist(x / tr, y / tr, sp) >= sp.hw + 0.12 + reach * 0.8 : f < info.deckFrom - 0.12 - reach;
        if (f >= lo && clear) {
          stones.push({ key: `srf_stone_dry_${v}`, x: snap(x - cw / 2) - px0, y: snap(y - chh / 2) - py0 });
        }
      }
    }
    const byY = (a: Spr, b2: Spr): number => a.y - b2.y;
    // 물에 잠긴 것은 반투명 — 물빛이 비쳐야 "잠겼다"로 읽힌다
    const draw = (list: Spr[]): void => {
      list.sort(byY);
      for (const sp of list) rt.batchDraw(sp.key, sp.x, sp.y, sp.key.includes('_wet_') ? 0.72 : 1);
    };
    if (stage === 'sub') { draw(stones); draw(out); return; }
    draw(lows);
    draw(out);
    draw(stones);
  }

  /**
   * 사석 방파제 돌길 척추(181차) — 성분 타일 중심들의 주축(PCA). 길쭉하지 않거나(L < 1.8W)
   * 주축에서 벗어난 칸이 많으면(ㄱ자 등) undefined → 거리장 등치선으로 돌아간다.
   * 뭍에 닿은 끝은 뭍 쪽으로 반 칸 늘리고, 바다 쪽 끝(두부)은 돌이 둘러싸도록 줄인다.
   */
  private fitSpine(cells: number[], cols: number, rows: number): BwArmorInfo['spine'] {
    const n = cells.length;
    if (n < 4) return undefined;
    let mx = 0, my = 0;
    for (const i of cells) { mx += i % cols + 0.5; my += Math.floor(i / cols) + 0.5; }
    mx /= n; my /= n;
    let sxx = 0, syy = 0, sxy = 0;
    for (const i of cells) {
      const dx = i % cols + 0.5 - mx, dy = Math.floor(i / cols) + 0.5 - my;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const ux = Math.cos(ang), uy = Math.sin(ang);
    let tmin = Infinity, tmax = -Infinity;
    const ss: number[] = [];
    for (const i of cells) {
      const dx = i % cols + 0.5 - mx, dy = Math.floor(i / cols) + 0.5 - my;
      const t = dx * ux + dy * uy;
      tmin = Math.min(tmin, t); tmax = Math.max(tmax, t);
      ss.push(dx * -uy + dy * ux);
    }
    const L = tmax - tmin + 1;
    const W = n / L;
    if (L < 1.8 * W) return undefined;
    const fit = ss.filter((sv) => Math.abs(sv) <= W / 2 + 0.75).length / n;
    if (fit < 0.85) return undefined;
    // 끝이 뭍(방파제 밖의 뭍 타일)에 닿는가 — 끝에서 1.5칸 안 성분 칸의 8이웃을 본다
    const touchesLand = (tEnd: number): boolean => {
      for (const i of cells) {
        const c = i % cols, r = Math.floor(i / cols);
        const t = (c + 0.5 - mx) * ux + (r + 0.5 - my) * uy;
        if (Math.abs(t - tEnd) > 1.5) continue;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const cc = c + dc, rr = r + dr;
          if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
          if (this.bwComp[rr * cols + cc] >= 0) continue;
          const tt = this.tileAt(cc, rr);
          if (tt !== '~' && tt !== '#') return true;
        }
      }
      return false;
    };
    const t0 = tmin + (touchesLand(tmin) ? -0.6 : 0.55);
    const t1 = tmax + (touchesLand(tmax) ? 0.6 : -0.55);
    if (t1 - t0 < 0.8) return undefined;
    return {
      ax: mx + ux * t0, ay: my + uy * t0, bx: mx + ux * t1, by: my + uy * t1,
      hw: Math.max(0.36, Math.min(0.95, W * 0.27)),
    };
  }

  /** 점(타일 좌표) → 선분 거리 */
  private static segDist(x: number, y: number, s: { ax: number; ay: number; bx: number; by: number }): number {
    const vx = s.bx - s.ax, vy = s.by - s.ay;
    const l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((x - s.ax) * vx + (y - s.ay) * vy) / l2));
    return Math.hypot(s.ax + vx * t - x, s.ay + vy * t - y);
  }

  /** 방파제 단면 분류 조회 — 0 없음/안벽 · 1 상판 · 2 사석 · 3 테트라포드 (씬의 가로등 배치 등이 소비) */
  breakwaterClassAt(c: number, r: number): number {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return 0;
    return this.bwClass[r * this.cfg.cols + c];
  }

  /** 섬/암초 셀 (computeIslets — 조도 등) — 채집 스팟 후보(갯바위) 판정 (121차) */
  isIsletAt(c: number, r: number): boolean {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return false;
    return this.islet[r * this.cfg.cols + c] === 1;
  }

  /** 물 타일의 육지 거리(타일) — 통발 설치 범위·실측 수심 환산 (121차). 뭍이면 0 */
  waterDistAt(c: number, r: number): number {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return 0;
    return this.waterDist[r * this.cfg.cols + c];
  }

  /** 항만 수역(computeHarbor — 항 내측·석호) 여부 — 안벽 채집 후보 판정 (121차) */
  isHarborAt(c: number, r: number): boolean {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return false;
    return this.harbor[r * this.cfg.cols + c] === 1;
  }

  /**
   * 항로표지 배치 준비(114차) — OSM 노드는 물 위나 피복 위에 찍혀 있어 **뭍 타일로 스냅**한다
   * (반경 3, 상판(bwClass 1) > 기타 뭍 > 피복 순). 스냅한 좌표가 속한 청크가 프롭을 세운다.
   */
  private setLights(lights: RegionLight[]): void {
    this.lightsByChunk.clear();
    const { cols, rows } = this.cfg;
    const N = this.cfg.chunkTiles;
    for (const L of lights) {
      let best: { c: number; r: number; score: number } | null = null;
      for (let rad = 0; rad <= 3 && !best; rad++) {
        let cand: { c: number; r: number; score: number } | null = null;
        for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
          const c = L.tx + dc, r = L.ty + dr;
          if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
          const t = this.tileAt(c, r);
          if (t === '~' || t === '#') continue;
          const k = this.bwClass[r * cols + c];
          const score = k === 1 ? 3 : k === 0 ? 2 : 1;
          if (!cand || score > cand.score) cand = { c, r, score };
        }
        if (cand) best = cand;
      }
      // 등주(beacon)는 물 위 말뚝에 서는 표지 — 뭍이 없으면 원위치(물)에 그대로 세운다(충돌 없음)
      if (!best) {
        if (L.kind !== 'beacon') continue;
        best = { c: L.tx, r: L.ty, score: 0 };
      }
      const idx = Math.floor(best.r / N) * this.chunkCols + Math.floor(best.c / N);
      const list = this.lightsByChunk.get(idx);
      const snapped: RegionLight = { ...L, tx: best.c, ty: best.r };
      if (list) list.push(snapped); else this.lightsByChunk.set(idx, [snapped]);
    }
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
        // 상한 1200(116차): 실제 조도는 사진 시트 적용 후 뭍 927타일이라 구 600에 걸려 섬 판정에서 빠졌고,
        //   그 결과 '.' 밑에 얕은 물 베이스가 안 깔려 시트의 투명 물 부분에 Kenney tan이 비치고,
        //   항만 규칙(정박 어선·크레인)이 섬에 반응했다. '#'/'r' 없는 600~1200 뭍 성분은 섬·사주뿐이다.
        if (wild && members.length <= 1200) for (const i of members) flag[i] = 1;
      }
    }
    return flag;
  }

  /**
   * 섬 암반 깊이(182차) — 섬 '.' 타일마다 **섬 밖(물·다른 지형)까지 4-이웃 거리**.
   * 물가 타일 = 1, 한 칸 안쪽 = 2 … 이끼 연속장이 이 값을 타일 중심에서 쌍선형 보간해 쓴다.
   */
  private computeIsletDepth(): Uint8Array {
    const { cols, rows } = this.cfg;
    const d = new Uint8Array(cols * rows);
    const q = new Int32Array(cols * rows);
    let head = 0, tail = 0;
    const rock = (i: number): boolean => this.islet[i] === 1 && this.cfg.terrainRows[(i / cols) | 0][i % cols] === '.';
    for (let i = 0; i < cols * rows; i++) {
      if (!rock(i)) continue;
      const c = i % cols, r = (i / cols) | 0;
      let edge = false;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || !rock(nr * cols + nc)) { edge = true; break; }
      }
      if (edge) { d[i] = 1; q[tail++] = i; }
    }
    while (head < tail) {
      const i = q[head++]; const c = i % cols, r = (i / cols) | 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const j = nr * cols + nc;
        if (d[j] || !rock(j)) continue;
        d[j] = Math.min(255, d[i] + 1); q[tail++] = j;
      }
    }
    return d;
  }

  /** 섬 암반 타일의 깎이는 볼록 모서리(두 직교 변 + 대각이 물) — L1 삼각 프레임과 절차 림이 공유 */
  private isletCutAt(c: number, r: number): 'ne' | 'nw' | 'se' | 'sw' | null {
    const w = (cc: number, rr: number): boolean => this.tileAt(cc, rr) === '~';
    const wN = w(c, r - 1), wS = w(c, r + 1), wW = w(c - 1, r), wE = w(c + 1, r);
    if (wN && wE && w(c + 1, r - 1)) return 'ne';
    if (wN && wW && w(c - 1, r - 1)) return 'nw';
    if (wS && wE && w(c + 1, r + 1)) return 'se';
    if (wS && wW && w(c - 1, r + 1)) return 'sw';
    return null;
  }

  /** 섬 암반 타일의 `edge` 변이 45°로 깎여 물인가 — 그 변을 공유하는 물 타일은 포말·그림자를 긋지 않는다(182차) */
  private isletEdgeOpen(c: number, r: number, edge: 'n' | 'e' | 's' | 'w'): boolean {
    if (c < 0 || r < 0 || c >= this.cfg.cols || r >= this.cfg.rows) return false;
    if (!this.islet[r * this.cfg.cols + c] || this.tileAt(c, r) !== '.') return false;
    if (this.tileTexMap.has(r * this.cfg.cols + c)) return false;
    const cut = this.isletCutAt(c, r);
    return !!cut && cut.includes(edge);
  }

  /**
   * 섬 안쪽 이끼·초지(182차) — 구 절차 패스는 안쪽 타일마다 **사각형 한 장**을 찍어 섬 전체가
   * 초록 네모 격자로 보였다. 이제 월드 좌표 연속장 m(x, y) = 깊이(쌍선형) + 저주파 노이즈로
   * 2px 도트를 칠해 덩어리가 타일 변과 무관한 곡선으로 번진다(행 단위 런 병합으로 명령 수 절약).
   */
  // ── 183차 · 갯바위·절벽·데크·층 단차·계단 렌더 ─────────────────────────

  /** 절벽 'K' 윗면 — 마른 화강암의 밝은 점·균열 강조(아틀라스 판 위에 얹는다) */
  private drawCliffTop(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const tr = this.cfg.tr, seed = this.cfg.seed ^ 0x4c1f;
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        const h = hash2(seed, c * tr + x, r * tr + y);
        if (h > 0.9) { g.fillStyle(0xe4dccc, 0.35); g.fillRect(lx + x, ly + y, 2, 2); }
        else if (h < 0.05) { g.fillStyle(0x3e3831, 0.35); g.fillRect(lx + x, ly + y, 2, 2); }
      }
    }
  }

  /** 데크 'D' — 세로 방향 판자(4px) + 줄눈, 물과 닿은 변에 난간 기둥·가장자리 */
  private drawDeck(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const tr = this.cfg.tr, seed = this.cfg.seed ^ 0xdec0;
    const PLANK = [0xa88c66, 0xa2865f, 0xae9270, 0x9c8059];
    // 판자는 다리 진행 방향(긴 축)과 나란하다 — 좌우 물이면 가로 판자, 상하 물이면 세로 판자
    const wN = this.tileAt(c, r - 1) === '~', wS = this.tileAt(c, r + 1) === '~';
    const wW = this.tileAt(c - 1, r) === '~', wE = this.tileAt(c + 1, r) === '~';
    const horiz = (wN || wS) && !(wW || wE) ? true : (wW || wE) && !(wN || wS) ? false : true;
    for (let k = 0; k < tr; k += 4) {
      const abs = horiz ? r * tr + k : c * tr + k;
      const h = hash2(seed, horiz ? Math.floor(abs / 4) : c, horiz ? r : Math.floor(abs / 4));
      g.fillStyle(PLANK[Math.floor(h * PLANK.length) % PLANK.length]!, 1);
      if (horiz) g.fillRect(lx, ly + k, tr, 4); else g.fillRect(lx + k, ly, 4, tr);
      g.fillStyle(0x5e4a34, 0.9);
      if (horiz) g.fillRect(lx, ly + k + 3, tr, 1); else g.fillRect(lx + k + 3, ly, 1, tr);
    }
    // 판자 끝 이음(2타일마다 어긋남)
    g.fillStyle(0x5e4a34, 0.7);
    if (horiz) { const jx = ((c + r) % 2) * (tr / 2); g.fillRect(lx + jx, ly, 1, tr); }
    else { const jy = ((c + r) % 2) * (tr / 2); g.fillRect(lx, ly + jy, tr, 1); }
    // 물과 닿은 변 — 가장자리 보(어두운 2px) + 난간 기둥(6px 간격)
    g.fillStyle(0x3f3225, 1);
    if (wN) g.fillRect(lx, ly, tr, 2);
    if (wS) g.fillRect(lx, ly + tr - 2, tr, 2);
    if (wW) g.fillRect(lx, ly, 2, tr);
    if (wE) g.fillRect(lx + tr - 2, ly, 2, tr);
    g.fillStyle(0x6b7a86, 1);
    for (let k = 2; k < tr; k += 8) {
      if (wN) g.fillRect(lx + k, ly, 2, 4);
      if (wS) g.fillRect(lx + k, ly + tr - 4, 2, 4);
      if (wW) g.fillRect(lx, ly + k, 4, 2);
      if (wE) g.fillRect(lx + tr - 4, ly + k, 4, 2);
    }
  }

  /**
   * 층 단차·계단·데크 기둥 — 청크의 모든 뭍 타일을 다시 훑는다(지형 그림 위).
   *  - 남·동 변에 낮은 이웃 = 옆면(높이차 × 6px) · 북·서 변에 높은 이웃 = 내 타일에 그림자
   *  - 계단으로 이어진 변은 단차를 그리지 않고 계단 그림이 잇는다
   *  - 데크 남쪽이 물이면 물 위에 기둥·그림자
   */
  private drawLevelLayer(g: Phaser.GameObjects.Graphics, c0: number, r0: number, c1: number, r1: number): void {
    const hasLevels = (this.cfg.levels?.length ?? 0) > 0 || this.stairMap.size > 0;
    const tr = this.cfg.tr;
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const ch = this.tileAt(c, r);
        const lx = (c - c0) * tr, ly = (r - r0) * tr;
        if (ch === 'D') {
          // 물 위 기둥·그림자 — 남쪽 물 타일에 (같은 청크 안에서만)
          if (this.tileAt(c, r + 1) === '~' && r + 1 < r1) {
            g.fillStyle(0x0e1c26, 0.35); g.fillRect(lx, ly + tr, tr, 5);
            g.fillStyle(0x3a3f47, 1);
            for (let k = 4; k < tr; k += 12) g.fillRect(lx + k, ly + tr, 4, 7);
          }
        }
        if (!hasLevels || ch === '~') continue;
        const st = this.stairAt(c, r);
        if (st) { this.drawStair(g, lx, ly, c, r, st); continue; }
        this.drawLevelRelief(g, lx, ly, c, r);
      }
    }
  }

  private drawLevelRelief(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const tr = this.cfg.tr, cols = this.cfg.cols, rows = this.cfg.rows;
    const me = this.levelCell(c, r);
    const hMe = me.level;
    const ch = this.tileAt(c, r);
    const rock = isRockTerrain(ch) || this.islet[r * cols + c] === 1;
    const FACE = rock ? 0x7a6f61 : 0x8c7350, FACE_LO = rock ? 0x574f45 : 0x6a5538, TOP = rock ? 0xd9d0bf : 0xcbb98d;
    const sd = this.cfg.seed ^ 0x1e7e;
    const DIRS: [number, number, TileEdge][] = [[0, -1, 'n'], [1, 0, 'e'], [0, 1, 's'], [-1, 0, 'w']];
    for (const [dc, dr, edge] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const nch = this.tileAt(nc, nr);
      if (nch === '~' && !isRockTerrain(ch)) continue;          // 물가는 물가 규칙(포말·안벽)이 맡는다
      const nb = this.levelCell(nc, nr);
      const hN = nb.level;
      if (hN === hMe) continue;
      // 계단이 잇는 변은 계단 그림이 담당
      if ((me.stair || nb.stair) && canStep(me, nb, edge)) continue;
      const dh = Math.abs(hN - hMe);
      if (hN < hMe) {
        if (edge === 's') {
          const face = Math.min(14, 6 * dh);
          g.fillStyle(FACE, 1); g.fillRect(lx, ly + tr - face, tr, face);
          g.fillStyle(FACE_LO, 1); g.fillRect(lx, ly + tr - 3, tr, 3);
          // 옆면 결(2px 세로 균열)
          for (let x = 0; x < tr; x += 2) {
            if (hash2(sd, c * tr + x, r) > 0.8) { g.fillStyle(FACE_LO, 0.8); g.fillRect(lx + x, ly + tr - face + 2, 2, face - 4); }
          }
          g.fillStyle(TOP, 0.7); g.fillRect(lx, ly + tr - face - 2, tr, 2);
        } else if (edge === 'e') {
          g.fillStyle(FACE_LO, 0.9); g.fillRect(lx + tr - 3, ly, 3, tr);
        } else {
          g.fillStyle(TOP, 0.65);
          if (edge === 'n') g.fillRect(lx, ly, tr, 2); else g.fillRect(lx, ly, 2, tr);
        }
      } else if (edge === 'n' || edge === 'w') {
        // 높은 이웃이 북·서 — 내 타일에 그림자(높이차만큼 넓게)
        const w = Math.min(14, 5 * dh);
        for (let a = 0; a < tr; a += 2) {
          for (let b = 0; b < w; b += 2) {
            const px = edge === 'w' ? b : a, py = edge === 'n' ? b : a;
            const t = 1 - b / w;
            if (b >= 2 && hash2(sd ^ 3, c * tr + px, r * tr + py) > t * 0.95) continue;
            g.fillStyle(0x0e0c0a, 0.45 * t + 0.1);
            g.fillRect(lx + px, ly + py, 2, 2);
          }
        }
      }
    }
  }

  /**
   * 계단 1타일 — 오르는 방향 `dir`을 따라 6px 단(디딤판 + 어두운 챌면). 대각 계단은 단이 45°로 눕는다.
   * 직교 계단은 양옆에 난간(2px). 위층 쪽 끝에 밝은 모서리, 아래층 쪽 끝에 그림자.
   */
  private drawStair(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number, st: RegionStair): void {
    const tr = this.cfg.tr;
    const rock = isRockTerrain(this.tileAt(c, r));
    const TREAD = rock ? [0xc9c0ae, 0xbfb5a2] : [0xb9b2a6, 0xafa89b];
    const RISER = rock ? 0x5f574c : 0x5a5650;
    const d = st.dir;
    const u = (x: number, y: number): number => {
      const yn = tr - y;
      switch (d) {
        case 'n': return yn; case 's': return y; case 'e': return x; case 'w': return tr - x;
        case 'ne': return (x + yn) / 2; case 'nw': return ((tr - x) + yn) / 2;
        case 'se': return (x + y) / 2; default: return ((tr - x) + y) / 2;
      }
    };
    const STEP = 6;
    for (let y = 0; y < tr; y += 2) {
      for (let x = 0; x < tr; x += 2) {
        const uu = u(x + 1, y + 1);
        const k = Math.floor(uu / STEP);
        const riser = uu - k * STEP < 2;
        g.fillStyle(riser ? RISER : TREAD[k % 2]!, 1);
        g.fillRect(lx + x, ly + y, 2, 2);
      }
    }
    // 난간 — 직교 계단만(대각은 네 변이 전부 통로)
    g.fillStyle(0x4a4239, 1);
    if (d === 'n' || d === 's') { g.fillRect(lx, ly, 2, tr); g.fillRect(lx + tr - 2, ly, 2, tr); }
    else if (d === 'e' || d === 'w') { g.fillRect(lx, ly, tr, 2); g.fillRect(lx, ly + tr - 2, tr, 2); }
    // 위층 쪽 밝은 테두리(높은 변) — 위층 바닥과 이어져 보이게
    g.fillStyle(0xe6dcc8, 0.7);
    for (const e of stairHighEdges(d)) {
      if (e === 'n') g.fillRect(lx, ly, tr, 2);
      else if (e === 's') g.fillRect(lx, ly + tr - 2, tr, 2);
      else if (e === 'w') g.fillRect(lx, ly, 2, tr);
      else g.fillRect(lx + tr - 2, ly, 2, tr);
    }
  }

  private drawIsletMoss(g: Phaser.GameObjects.Graphics, lx: number, ly: number, c: number, r: number): void {
    const tr = this.cfg.tr, cols = this.cfg.cols, rows = this.cfg.rows;
    const seed = this.cfg.seed;
    const dAt = (cc: number, rr: number): number =>
      cc < 0 || rr < 0 || cc >= cols || rr >= rows ? 0 : this.isletDepth[rr * cols + cc];
    // 이 타일에 이끼가 닿을 수 없으면(주변 깊이가 모두 얕으면) 건너뛴다
    let maxD = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) maxD = Math.max(maxD, dAt(c + dc, r + dr));
    if (maxD < 2) return;
    const MOSS = [0, 0x4a6a3c, 0x5d7a4a, 0x527043] as const;
    for (let y = 0; y < tr; y += 2) {
      let runX = 0, runC = 0;
      const flush = (xEnd: number): void => {
        if (runC > 0 && xEnd > runX) { g.fillStyle(MOSS[runC]!, runC === 1 ? 0.75 : 0.92); g.fillRect(lx + runX, ly + y, xEnd - runX, 2); }
      };
      for (let x = 0; x <= tr; x += 2) {
        let col = 0;
        if (x < tr) {
          const wx = c * tr + x + 1, wy = r * tr + y + 1;
          const u = wx / tr - 0.5, v = wy / tr - 0.5;
          const iu = Math.floor(u), iv = Math.floor(v);
          const fu = u - iu, fv = v - iv;
          const dd = (dAt(iu, iv) * (1 - fu) + dAt(iu + 1, iv) * fu) * (1 - fv)
            + (dAt(iu, iv + 1) * (1 - fu) + dAt(iu + 1, iv + 1) * fu) * fv;
          const m = dd + (noise2(seed ^ 0x6d05, wx / 44, wy / 44) - 0.5) * 2.2 + (noise2(seed ^ 0x6d06, wx / 12, wy / 12) - 0.5) * 0.7;
          if (m > 2.55) col = noise2(seed ^ 0x6d07, wx / 26, wy / 26) > 0.5 ? 2 : 3;
          else if (m > 2.3) col = 1;
        }
        if (col !== runC) { flush(x); runX = x; runC = col; }
      }
    }
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
    // 하역 크레인 44×66 — 콘크리트 받침 + 강철 마스트 + 노란 지브(대각) + 후크 줄 + 카운터웨이트
    bake('smx_crane', 44, 66, (g) => {
      g.fillStyle(0x000000, 0.22); g.fillEllipse(14, 63, 24, 6);
      g.fillStyle(0x8f949c, 1); g.fillRect(6, 56, 16, 6);            // 받침
      g.fillStyle(COL.craneSteel, 1); g.fillRect(11, 14, 6, 44);     // 마스트
      g.fillStyle(0x555b64, 1); g.fillRect(12, 14, 2, 44);
      g.fillStyle(COL.crane, 1);                                       // 지브 (우상향 대각)
      g.fillPoints([{ x: 10, y: 16 }, { x: 40, y: 2 }, { x: 43, y: 6 }, { x: 14, y: 20 }], true);
      g.fillStyle(COL.craneDark, 1); g.fillRect(2, 15, 12, 5);         // 카운터웨이트
      g.fillStyle(COL.craneSteel, 1); g.fillRect(38, 6, 2, 22);        // 후크 줄
      g.fillStyle(0x2a2f36, 1); g.fillRect(35, 28, 8, 4);              // 후크 블록
      g.fillStyle(COL.crane, 1); g.fillRect(8, 10, 12, 6);             // 운전실
      g.fillStyle(0x4a7aa8, 1); g.fillRect(10, 11, 6, 3);
    });
    // 정자(183차) — 팔각 기와지붕 + 기둥 4 + 난간 마루. 영금정·해돋이 전망대(사용자 캡처: 팔각 정자 2채)
    bake('smx_pavilion', 52, 56, (g) => {
      g.fillStyle(0x000000, 0.22); g.fillEllipse(26, 53, 44, 8);
      g.fillStyle(0x9a9088, 1); g.fillRect(6, 44, 40, 8);              // 기단(석축)
      g.fillStyle(0x6f6862, 1); g.fillRect(6, 50, 40, 2);
      g.fillStyle(0x7a4f2e, 1);                                          // 기둥 4
      for (const x of [10, 21, 30, 39]) g.fillRect(x, 26, 3, 20);
      g.fillStyle(0x4f3220, 1); for (const x of [12, 23, 32, 41]) g.fillRect(x, 26, 1, 20);
      g.fillStyle(0xb8865a, 1); g.fillRect(8, 38, 36, 3);                // 난간 마루
      g.fillStyle(0x8a5f3a, 1); g.fillRect(8, 41, 36, 1);
      g.fillStyle(0x3d4a5a, 1);                                          // 기와지붕(팔각 — 아랫단 넓게)
      g.fillPoints([{ x: 26, y: 4 }, { x: 50, y: 24 }, { x: 46, y: 28 }, { x: 6, y: 28 }, { x: 2, y: 24 }], true);
      g.fillStyle(0x56657a, 1);                                          // 지붕 면 하이라이트(좌)
      g.fillPoints([{ x: 26, y: 6 }, { x: 14, y: 24 }, { x: 6, y: 24 }], true);
      g.fillStyle(0x2c3642, 1); g.fillRect(2, 24, 48, 2);                // 처마선
      for (let x = 4; x < 50; x += 6) { g.fillStyle(0x2c3642, 1); g.fillRect(x, 26, 2, 3); } // 처마 기와 끝
      g.fillStyle(0x2c3642, 1); g.fillRect(24, 0, 4, 6);                 // 절병통
      g.fillStyle(0x8a94a0, 1); g.fillRect(25, 1, 2, 3);
    });
    // 등대(114차) — 받침 + 테이퍼 탑 + 회랑 + 등롱 + 색 돔. 홍색 = 우현 · 백색+녹돔 = 좌현 · 백색
    const bakeLight = (key: string, W: number, H: number, tower: number, towerShade: number, cap: number, capShade: number) => {
      bake(key, W, H, (g) => {
        const cx = W / 2;
        const padY = H - 8, top = Math.round(H * 0.24);
        g.fillStyle(0x000000, 0.22); g.fillEllipse(cx, H - 3, W - 2, 6);
        g.fillStyle(0x8f949c, 1); g.fillRect(2, padY, W - 4, 6);                 // 콘크리트 받침
        g.fillStyle(0x6c7178, 1); g.fillRect(2, padY + 4, W - 4, 2);
        const bw = W - 8, tw = Math.round(bw * 0.72);                               // 테이퍼 탑
        g.fillStyle(tower, 1);
        g.fillPoints([{ x: cx - bw / 2, y: padY }, { x: cx + bw / 2, y: padY }, { x: cx + tw / 2, y: top + 6 }, { x: cx - tw / 2, y: top + 6 }], true);
        g.fillStyle(towerShade, 1);
        g.fillPoints([{ x: cx + bw / 2 - 4, y: padY }, { x: cx + bw / 2, y: padY }, { x: cx + tw / 2, y: top + 6 }, { x: cx + tw / 2 - 3, y: top + 6 }], true);
        g.fillStyle(0x4a4f56, 1); g.fillRect(cx - 2, padY - 10, 4, 10);            // 출입문
        g.fillStyle(0x3a3f46, 1); g.fillRect(cx - tw / 2 - 3, top + 4, tw + 6, 3);  // 회랑
        g.fillStyle(0x2c3137, 1); g.fillRect(cx - tw / 2 - 3, top + 7, tw + 6, 1);
        g.fillStyle(0xdfe9f0, 1); g.fillRect(cx - tw / 2 + 1, top - 4, tw - 2, 8);  // 등롱 유리
        g.fillStyle(0x8fb3c8, 1); g.fillRect(cx - 1, top - 4, 2, 8);
        g.fillStyle(cap, 1); g.fillRect(cx - tw / 2, top - 8, tw, 4);              // 돔
        g.fillStyle(capShade, 1); g.fillRect(cx - tw / 2 + 2, top - 11, tw - 4, 3);
        g.fillStyle(0x2c3137, 1); g.fillRect(cx - 1, top - 14, 2, 3);              // 피뢰침
      });
    };
    bakeLight('smx_light_red', 24, 64, 0xd8402c, 0xa82e1e, 0xd8402c, 0xa82e1e);
    bakeLight('smx_light_green', 24, 64, 0xf0f0ec, 0xc9cbc6, 0x3a9a5a, 0x2c7a46);
    bakeLight('smx_light_white', 24, 64, 0xf0f0ec, 0xc9cbc6, 0x6a6f76, 0x4a4f56);
    bakeLight('smx_light_major', 34, 96, 0xf0f0ec, 0xc9cbc6, 0x6a6f76, 0x4a4f56);
    bake('smx_beacon_green', 12, 40, (g) => {                                       // 등주 — 기둥 + 원통 두표
      g.fillStyle(0x000000, 0.22); g.fillEllipse(6, 38, 10, 4);
      g.fillStyle(0x8f949c, 1); g.fillRect(2, 34, 8, 4);
      g.fillStyle(0x3a3f46, 1); g.fillRect(5, 10, 2, 24);
      g.fillStyle(0x3a9a5a, 1); g.fillRect(3, 2, 6, 9);
      g.fillStyle(0x2c7a46, 1); g.fillRect(7, 2, 2, 9);
    });
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
    if (this.disposed) return;
    this.frameNo++;
    // 이동 속도 — 한 프레임 200px 넘게 뛰면 순간이동이라 속도로 치지 않는다
    if (Number.isFinite(this.prevCX)) {
      const vx = centerX - this.prevCX, vy = centerY - this.prevCY;
      if (Math.abs(vx) + Math.abs(vy) > 200) { this.velX = 0; this.velY = 0; }
      else { this.velX = this.velX * 0.85 + vx * 0.15; this.velY = this.velY * 0.85 + vy * 0.15; }
    }
    this.prevCX = centerX; this.prevCY = centerY;
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
    // 182차 — 화면 근처(카메라 반폭 640 + 여유)만 즉시 로드하고, 먼 쪽은 프레임당 1장씩 미룬다.
    //  이동 속도(최대 ≈ 7px/프레임)로는 미룬 청크에 닿기까지 수십 프레임이 남는다(충돌도 안전).
    this.loadQueue = this.loadQueue.filter((i) => needed.has(i) && !this.resident.has(i));
    for (const idx of needed) {
      if (this.resident.has(idx) || this.loadQueue.includes(idx)) continue;
      if (this.chunkDist(idx, centerX, centerY) <= 760) this.loadChunk(idx);
      else this.loadQueue.push(idx);
    }
    let deferredLoad = false;
    if (this.loadQueue.length > 0) {
      this.loadQueue.sort((a, b) => this.chunkDist(a, centerX, centerY) - this.chunkDist(b, centerX, centerY));
      this.loadChunk(this.loadQueue.shift()!);
      deferredLoad = true;
    }

    if (this.bakeQueue.length > 0) {
      // 가장 가까운 것부터. 미룬 로드를 이미 한 프레임에는 화면 근처 것만 굽는다(한 프레임에 몰지 않게)
      let pick = 0, best = Infinity;
      for (let q = 0; q < this.bakeQueue.length; q++) {
        const d = this.chunkDist(this.bakeQueue[q]!, centerX, centerY);
        if (d < best) { best = d; pick = q; }
      }
      if (!deferredLoad || best <= 760) {
        const idx = this.bakeQueue.splice(pick, 1)[0]!;
        const slot = this.resident.get(idx);
        if (slot && !slot.baked) { this.bakeChunk(idx, slot); this.lastHeavy = this.frameNo; }
      }
    } else if (!deferredLoad) {
      // 선행 굽기 — 움직이는 중 4프레임, 서 있을 때 12프레임 간격(가만히 있을 때 끊김을 줄인다)
      const moving = Math.hypot(this.velX, this.velY) > 0.6;
      if (this.frameNo - this.lastHeavy >= (moving ? 4 : 12) && this.prefetchOne(cc, cr, moving)) this.lastHeavy = this.frameNo;
    }
  }

  /**
   * 선행 로드(182차) — 진입·순간이동 직후 3×3을 **그 자리에서 모두 굽는다**(카메라 페이드인 동안).
   * 구: 한 프레임에 한 장씩 구워 첫 몇 프레임은 빈 청크(배경색)가 보였다.
   */
  preloadAround(x: number, y: number): void {
    if (this.disposed) return;
    this.prevCX = NaN;
    this.update(x, y);
    while (this.loadQueue.length > 0) this.loadChunk(this.loadQueue.shift()!);
    let guard = 16;
    while (this.bakeQueue.length > 0 && guard-- > 0) {
      const idx = this.bakeQueue.shift()!;
      const slot = this.resident.get(idx);
      if (slot && !slot.baked) this.bakeChunk(idx, slot);
    }
    this.lastHeavy = this.frameNo;
  }

  /** 점(px)에서 청크 사각형까지의 거리(px) — 안에 있으면 0 */
  private chunkDist(idx: number, x: number, y: number): number {
    const x0 = (idx % this.chunkCols) * this.chunkPx, y0 = Math.floor(idx / this.chunkCols) * this.chunkPx;
    const dx = x < x0 ? x0 - x : x > x0 + this.chunkPx ? x - x0 - this.chunkPx : 0;
    const dy = y < y0 ? y0 - y : y > y0 + this.chunkPx ? y - y0 - this.chunkPx : 0;
    return Math.hypot(dx, dy);
  }

  /** 굽기 대상 슬롯이 아직 유효한가 — 상주 또는 예열 캐시 */
  private isLiveSlot(idx: number, slot: ChunkSlot): boolean {
    return this.resident.get(idx) === slot || this.warm.get(idx) === slot;
  }

  /**
   * 예열 캐시에 청크 하나를 미리 굽는다. 움직이는 중에는 **다음에 들어갈 중심 청크의 3×3 가운데
   * 지금 3×3 밖인 칸**만(직진 3장 · 대각 5장 — 곧 필요해질 것만), 서 있을 때는 바깥 한 겹을
   * 가까운 것부터. 캐시가 차면 지금 자리에서 체비셰프 3 이상 떨어진 것만 비운다.
   */
  private prefetchOne(cc: number, cr: number, moving: boolean): boolean {
    const sp = Math.hypot(this.velX, this.velY);
    const sx = moving ? (this.velX / sp > 0.38 ? 1 : this.velX / sp < -0.38 ? -1 : 0) : 0;
    const sy = moving ? (this.velY / sp > 0.38 ? 1 : this.velY / sp < -0.38 ? -1 : 0) : 0;
    const nx = cc + sx, ny = cr + sy;
    let best = -1, bestScore = Infinity;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== 2) continue;
        const nc = cc + dc, nr = cr + dr;
        if (nc < 0 || nr < 0 || nc >= this.chunkCols || nr >= this.chunkRows) continue;
        if (moving && Math.max(Math.abs(nc - nx), Math.abs(nr - ny)) > 1) continue;
        const idx = nr * this.chunkCols + nc;
        if (this.resident.has(idx) || this.warm.has(idx)) continue;
        const score = Math.hypot(dc, dr);
        if (score < bestScore) { bestScore = score; best = idx; }
      }
    }
    // 먼저 — 이미 구워 둔 선행 청크 중 장식을 아직 안 만든 것(한 프레임에 굽기+장식이 몰리지 않게 나눈다)
    for (const [k, ws] of this.warm) {
      if (!ws.baked || ws.decoBuilt) continue;
      const kc = k % this.chunkCols, kr = Math.floor(k / this.chunkCols);
      if (Math.max(Math.abs(kc - cc), Math.abs(kr - cr)) > 2) continue;
      this.buildChunkCollision(kc, kr, ws);
      this.buildChunkDeco(kc, kr, ws);
      ws.decoBuilt = true;
      this.setDecoVisible(ws, false);
      return true;
    }
    if (best < 0) return false;
    if (this.warm.size >= SeamlessChunks.WARM_MAX) {
      let far = -1, farD = 2;
      for (const k of this.warm.keys()) {
        const d = Math.max(Math.abs(k % this.chunkCols - cc), Math.abs(Math.floor(k / this.chunkCols) - cr));
        if (d > farD) { farD = d; far = k; }
      }
      if (far < 0) return false;
      this.dropWarm(far);
    }
    const rt = this.acquireRt();
    rt.setPosition((best % this.chunkCols) * this.chunkPx, Math.floor(best / this.chunkCols) * this.chunkPx);
    rt.setVisible(false);
    const slot: ChunkSlot = { rt, baked: false, decoBuilt: false, bodies: [], deco: [], roofKeys: [], occluders: [] };
    this.warm.set(best, slot);
    this.bakeChunk(best, slot);
    return true;
  }

  /** 예열 캐시에 넣는다(LRU 갱신) — 넘치면 가장 오래된 것부터 RT 풀로 */
  private putWarm(idx: number, slot: ChunkSlot): void {
    slot.rt.setVisible(false);
    this.warm.delete(idx);
    this.warm.set(idx, slot);
    while (this.warm.size > SeamlessChunks.WARM_MAX) {
      const oldest = this.warm.keys().next().value as number;
      this.dropWarm(oldest);
    }
  }

  private dropWarm(idx: number): void {
    const slot = this.warm.get(idx);
    if (!slot) return;
    this.warm.delete(idx);
    this.clearSlotContents(slot);
    slot.rt.setVisible(false);
    this.rtPool.push(slot.rt);
  }

  private loadChunk(idx: number): void {
    const cc = idx % this.chunkCols;
    const cr = Math.floor(idx / this.chunkCols);
    // 182차 — 예열 캐시에 있으면 그대로 켠다(굽기·지붕 RT·프롭·충돌 재생성 생략)
    const w = this.warm.get(idx);
    let slot: ChunkSlot;
    if (w) {
      this.warm.delete(idx);
      slot = w;
      slot.rt.setPosition(cc * this.chunkPx, cr * this.chunkPx);
      slot.rt.setVisible(true);
      if (slot.decoBuilt) this.setDecoVisible(slot, true);
      else { this.buildChunkCollision(cc, cr, slot); this.buildChunkDeco(cc, cr, slot); slot.decoBuilt = true; }
    } else {
      const rt = this.acquireRt();
      rt.setPosition(cc * this.chunkPx, cr * this.chunkPx);
      rt.setVisible(true);
      slot = { rt, baked: false, decoBuilt: true, bodies: [], deco: [], roofKeys: [], occluders: [] };
      this.buildChunkCollision(cc, cr, slot);
      this.buildChunkDeco(cc, cr, slot);
    }
    this.resident.set(idx, slot);
    if (!slot.baked) this.bakeQueue.push(idx);
    this.cfg.onChunkLoad?.(cc, cr);
  }

  /**
   * 지금 상주 중인 청크의 가림 그림 전부 (150차) — 씬의 반투명 판정이 매 프레임 쓴다.
   * POI 프리팹(145차)만으로는 **타일 건물 지붕 뒤에 들어간 캐릭터가 통째로 가려졌다**.
   */
  listOccluders(): OccluderObj[] {
    const out: OccluderObj[] = [];
    for (const slot of this.resident.values()) out.push(...slot.occluders);
    return out;
  }

  private unloadChunk(idx: number, slot: ChunkSlot): void {
    this.resident.delete(idx);
    const qi = this.bakeQueue.indexOf(idx);
    if (qi >= 0) this.bakeQueue.splice(qi, 1);
    slot.rt.setVisible(false);
    if (slot.baked && !this.disposed) {
      // 182차 — 구운 그림·지붕·프롭·충돌을 통째로 예열 캐시에 숨겨 둔다(되돌아오면 켜기만 한다).
      //  구: 로드마다 건물 하나당 지붕 RenderTexture를 새로 만들어 청크 한 장 로드가 최대 ~1초(헤드리스 실측).
      //  충돌 바디는 남겨도 된다 — 3×3 밖이라 플레이어가 닿을 수 없다.
      this.setDecoVisible(slot, false);
      this.putWarm(idx, slot);
    } else {
      this.clearSlotContents(slot);
      this.rtPool.push(slot.rt);
    }
    this.cfg.onChunkUnload?.(idx % this.chunkCols, Math.floor(idx / this.chunkCols));
  }

  /** 슬롯의 충돌·장식을 파괴한다(RT는 호출측이 처리) */
  private clearSlotContents(slot: ChunkSlot): void {
    // ⚠ 씬 shutdown 중에는 물리 그룹이 먼저 파괴돼 `walls.children`이 없다 — remove 호출 시 크래시
    //   (101차 후속 3 실측: 속초→홈타운 전환에서 "reading 'contains'"). 그룹이 살아 있을 때만 remove.
    const wallsAlive = !!this.walls.children;
    for (const b of slot.bodies) { if (wallsAlive) this.walls.remove(b); b.destroy(); }
    slot.bodies = [];
    for (const d of slot.deco) d.destroy();
    slot.deco = [];
    slot.occluders = [];
    // 지붕 이미지를 모두 파괴한 **뒤에** 아틀라스를 버린다(프레임을 쥔 이미지가 남지 않게)
    slot.roofAtlas?.destroy();
    slot.roofAtlas = undefined;
    // 인스턴스별 namespace를 사용하므로 삭제하지 않는다. display list와
    // WebGL 배치가 완전히 비워진 뒤에도 stale Frame을 참조하지 않게 한다.
    slot.roofKeys = [];
    slot.decoBuilt = false;
  }

  private setDecoVisible(slot: ChunkSlot, on: boolean): void {
    for (const d of slot.deco) (d as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(on);
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
    // 183차 — 층 경계·계단 옆벽 (청크 경계의 서·북 변은 이웃 청크가 세우므로 c0−1·r0−1 열/행도 본다)
    this.buildLevelWalls(Math.max(0, c0 - 1), Math.max(0, r0 - 1), c1, r1, slot);
  }

  // ═══════════════════════════════════════════════════
  // 지붕 — 건물 컴포넌트 단위 스프라이트 (y-sort — 캐릭터가 위쪽 줄로 들어가면 가려진다)
  // ═══════════════════════════════════════════════════
  /** 컴포넌트 지붕 텍스처 베이크 (세대별 고유 키 — 씬 전환 중 삭제하지 않음) */
  private bakeRoofTexture(compId: number): string {
    const comp = this.comps[compId];
    const key = `roof_${this.textureNamespace}_${comp.c0}_${comp.r0}`;
    if (hasUsableTexture(this.scene, key)) return key;
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
  /**
   * 건물 하나의 지붕·벽 모듈을 `rt`의 (ox, oy)에 그린다. ⚠ 호출측이 `beginDraw`/`endDraw`로 감싼다(182차 —
   * 청크의 모든 지붕을 한 번의 배치로). 문·대각 처마선은 호출측 Graphics `g`에 얹고 끝에 한 번 그린다.
   */
  private buildKitRoof(compId: number, rt: Phaser.GameObjects.RenderTexture, ox: number, oy: number, g: Phaser.GameObjects.Graphics): void {
    const comp = this.comps[compId];
    const tr = this.cfg.tr, cols = this.cfg.cols;
    const W = (comp.c1 - comp.c0 + 1) * tr, H = (comp.r1 - comp.r0 + 1) * tr;
    const ov = this.cfg.roofOverrides?.[`${comp.c0},${comp.r0}`];
    const colorIdx = comp.big ? 2 : (ov ?? comp.palIdx) % 4;
    const color = ['red', 'gray', 'light', 'tan'][colorIdx];
    const wall = comp.big ? 'glass' : ['brick_red', 'brick_gray', 'white', 'brick_tan'][colorIdx];
    const isMine = (c: number, r: number): boolean =>
      c >= 0 && c < cols && r >= 0 && r < this.cfg.rows && this.compOf[r * cols + c] === compId;
    void W; void H;
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
        const lx = ox + (c - comp.c0) * tr, ly = oy + (r - comp.r0) * tr;
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
    // 문(중앙 하단) + 대각 컷 처마선 — 호출측 Graphics에 모았다가 한 번에 그린다
    if (doorCol >= 0 && !tiny) {
      const lx = ox + (doorCol - comp.c0) * tr, ly = oy + (comp.r1 - comp.r0) * tr;
      g.fillStyle(0x2a2f36, 1); g.fillRect(lx + 9, ly + 10, 14, tr - 10);
      g.fillStyle(0x6b4a30, 1); g.fillRect(lx + 10, ly + 11, 12, tr - 12);
      g.fillStyle(0xe8c86a, 1); g.fillRect(lx + 19, ly + 22, 2, 2);
    }
    g.lineStyle(2, COL.buildEdge, 1);
    for (const [x1, y1, x2, y2] of cutLines) g.lineBetween(x1, y1, x2, y2);
  }

  /** 청크가 소유하는(좌상단 포함) 컴포넌트의 지붕 스프라이트 생성 */
  private buildChunkRoofs(cc: number, cr: number, slot: ChunkSlot): void {
    const N = this.cfg.chunkTiles, tr = this.cfg.tr;
    const owned: number[] = [];
    for (let id = 0; id < this.comps.length; id++) {
      const comp = this.comps[id];
      if (Math.floor(comp.c0 / N) === cc && Math.floor(comp.r0 / N) === cr) owned.push(id);
    }
    // 182차 — 지붕 아틀라스: 건물마다 RenderTexture를 새로 만들던 것(청크 한 장에 수십 개 — 로드 끊김의 99%)을
    //  청크당 **한 장**으로. 선반 패킹(높이순)으로 자리를 잡고, 건물 지붕은 그 프레임을 쓰는 이미지다.
    //  건물마다 따로 y-정렬·반투명(occluder)되는 성질은 그대로다.
    const place = new Map<number, [number, number]>();
    let atlas: Phaser.GameObjects.RenderTexture | undefined;
    if (this.kitReady && owned.length > 0) {
      const dims = owned.map((id) => {
        const c = this.comps[id];
        return { id, w: (c.c1 - c.c0 + 1) * tr, h: (c.r1 - c.r0 + 1) * tr };
      }).sort((a, b) => b.h - a.h);
      const AW = Math.max(this.chunkPx, ...dims.map((d) => d.w));
      let x = 0, y = 0, rowH = 0;
      for (const d of dims) {
        if (x + d.w > AW) { x = 0; y += rowH + 2; rowH = 0; }
        place.set(d.id, [x, y]);
        x += d.w + 2; rowH = Math.max(rowH, d.h);
      }
      const AH = y + rowH;
      atlas = this.scene.make.renderTexture({ x: 0, y: 0, width: AW, height: AH }, false);
      slot.roofAtlas = atlas;
    }
    const roofG = atlas ? this.scene.make.graphics({ x: 0, y: 0 }, false) : null;
    atlas?.beginDraw();
    for (const id of owned) {
      const comp = this.comps[id];
      const bottomY = (comp.r1 + 1) * tr;
      const depth = 20 + bottomY * 0.001;   // 플레이어(20 + y·0.001)와 y-sort — 위쪽 줄 진입 시 가림
      // 150차 — 지붕은 캐릭터를 덮는다. 뒤로 들어가면 반투명해지도록 occluder로 등록한다.
      if (atlas) {
        const [ox, oy] = place.get(id)!;
        const w = (comp.c1 - comp.c0 + 1) * tr, h = (comp.r1 - comp.r0 + 1) * tr;
        this.buildKitRoof(id, atlas, ox, oy, roofG!);
        const fname = `r${id}`;
        atlas.texture.add(fname, 0, ox, oy, w, h);
        const roof = this.scene.add.image(comp.c0 * tr, comp.r0 * tr, atlas.texture, fname).setOrigin(0, 0).setDepth(depth);
        slot.deco.push(roof); slot.occluders.push(roof);
      } else {
        const key = this.bakeRoofTexture(id);
        const roof = this.scene.add.image(comp.c0 * tr, comp.r0 * tr, key).setOrigin(0, 0).setDepth(depth);
        slot.deco.push(roof); slot.occluders.push(roof);
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
            const house = this.scene.add.image(x, bottomY, tex).setOrigin(0.5, 1).setScale(2).setDepth(depth + 0.0003);
            slot.deco.push(house); slot.occluders.push(house);
          }
        }
      }
    }
    if (atlas && roofG) {
      atlas.endDraw();
      atlas.draw(roofG, 0, 0);
      roofG.destroy();
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

    // (166차) 구 보행자 NPC 정지 프롭 산포 삭제 — 보도 위 사람은 `AmbientNpcSystem`이 배치하고 걷게 한다.

    // ── 주차 차량 — 도로가 아니라 **건물 옆 맨땅**("가게 옆에 주차"). 건물에 붙은 '.' 타일 중 도로 밴드 밖,
    //    건물 벽과 나란히(북/남 벽 = 세로 주차, 동/서 벽 = 가로 주차). 픽업트럭 포함, 충돌 있음 ──
    if (hasTs) {
      const chunkIdx = cr * this.chunkCols + cc;
      const kinds: [string, string][] = [['car', 'blue'], ['car', 'green'], ['car', 'red'], ['pickup', 'blue'], ['pickup', 'green'], ['pickup', 'red']];
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          if (this.tileAt(c, r) !== '.' || this.islet[r * this.cfg.cols + c]) continue;
          const bN = this.tileAt(c, r - 1) === '#', bS = this.tileAt(c, r + 1) === '#';
          const bW = this.tileAt(c - 1, r) === '#', bE = this.tileAt(c + 1, r) === '#';
          if (!(bN || bS || bW || bE)) continue;
          // 밀도(113차) — 주차장 밖 노상 차량은 **화면(≈900타일)당 1대 안팎**만(사용자 지시 3).
          //   실측: 조건 통과 후보가 화면당 0~37개(평균 6.9)로 편차가 크다 → 0.04면 상가 밀집지
          //   1~2대 · 주택가 0대 = "가끔 한 대" 체감. 구 0.03은 여기에 **주차장 열(점유 0.66)**이
          //   광장 전역에 겹쳐 화면이 차로 뒤덮였던 것이 실제 원인이었다.
          if (hash2(seed ^ 0xca7, c, r) > 0.04) continue;
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
          this.spawnProp({ id: `park_${kind}`, label: '주차 차량', tex, cat: '차량', scale: PARKED_CAR_SCALE }, c, vertical ? r + (bN ? 1 : 0) : r, slot);
        }
      }
    }

    // ── 주차장 차량 열 (110차-b — 사용자 위성 참고 이미지의 "밀도" 재현 1순위) ──
    //    래스터 병합 'r'(109차)로 생긴 **도로 밴드 밖 아스팔트 면**(주차장·항만 광장)에 열 지어 주차.
    //    행 r%4·칸 c%2 = 전역 위상 고정(청크 경계 정합·결정적) · 점유율 ~2/3(빈 칸이 실주차장답다).
    //    3×3 전부 'r' 요구 → 보도 프린지·건물 문 앞(인접 '#')·래스터 스페클 자동 제외.
    if (hasTs) {
      const chunkIdx = cr * this.chunkCols + cc;
      const cols = this.cfg.cols;
      const kinds: [string, string][] = [['car', 'blue'], ['car', 'green'], ['car', 'red'], ['pickup', 'blue'], ['pickup', 'green'], ['pickup', 'red']];
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          if (this.tileAt(c, r) !== 'r') continue;
          // 주차장 구역 안에서만(113차) — 광장·매립지·항만 에이프런에는 차를 세우지 않는다
          const lotId = this.parkLot[r * cols + c];
          if (lotId === 0) continue;
          // 열 주축(112차 — computeLotAxis): 세로로 긴 주차장은 세로 행(가로 주차·측면 프레임),
          //   그 외는 가로 행(세로 주차·정면/후면 프레임). 위상은 전역 좌표 기준 = 청크 경계 정합.
          const vertical = this.lotAxis[r * cols + c] === 2;
          if (vertical) {
            if (((c % 4) + 4) % 4 !== 1 || ((r % 2) + 2) % 2 !== 0) continue;   // 열 간격 4 · 칸 간격 2
          } else {
            if (((r % 4) + 4) % 4 !== 1 || ((c % 2) + 2) % 2 !== 0) continue;   // 행 간격 4 · 칸 간격 2
          }
          let lot = true;
          for (let dr = -1; dr <= 1 && lot; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (this.tileAt(c + dc, r + dr) !== 'r') { lot = false; break; }
            }
          }
          if (!lot) continue;
          const band = this.roadBand(c + 0.5, r + 0.5, chunkIdx);
          if (band && band.d < band.halfW + 1.2) continue;   // 차도·연석 침범 금지
          if (hash2(seed ^ 0x9a7c, c, r) > this.lotFill[lotId]) continue;   // 구역별 점유율 0.40~0.70
          const [kind, color] = kinds[Math.floor(hash2(seed ^ 0x9a7d, c, r) * kinds.length) % kinds.length];
          // 3/4 시점이라 회전 금지 — 행 방향에 맞는 프레임만 고른다
          const hv = hash2(seed ^ 0x9a7e, c, r);
          const dir = vertical ? (hv < 0.5 ? 'left' : 'right') : (hv < 0.5 ? 'up' : 'down');
          const tex = `ts_td_${kind}_${color}_${dir}`;
          if (!this.scene.textures.exists(tex)) continue;
          this.spawnProp({ id: 'park_lot', label: '주차 차량', tex, cat: '차량', scale: PARKED_CAR_SCALE }, c, r, slot);
        }
      }
    }

    // ── 항만 디테일(112차) — 정박 어선 열 + 하역 크레인 (참고 이미지의 부두 문법) ──
    //    항만 수역(computeHarbor)에 면한 안벽('.'|'b'|'w') 앞 물 타일에 어선을 열 지어 정박.
    //    E-W 안벽 = 3타일 간격 접현(alongside) · N-S 안벽 = 2타일 간격 선수 접안(bow-in).
    //    크레인은 안벽 위 뭍(2×2 여유·도로 밴드 밖)에 성기게.
    if (hasTs) {
      const chunkIdx = cr * this.chunkCols + cc;
      const cols = this.cfg.cols;
      const dBoat = def('boat'), dCrane = def('crane');
      // 안벽 = '.'/'b'/'w' + 래스터 'r'(109차 — 항만 광장·부두 상판은 대부분 'r'로 온다. 빠뜨리면 어선 1척·크레인 0 실측)
      const quay = (c: number, r: number): boolean => { const t = this.tileAt(c, r); return t === '.' || t === 'b' || t === 'w' || t === 'r'; };
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          if (this.tileAt(c, r) !== '~' || !this.harbor[r * cols + c]) continue;
          // 섬(갯바위) 둘레 제외(113차) — 부두가 없는 조도에 어선이 접안해 **육지 위로 얹혔다**(실렌더 확인)
          let nearIslet = false;
          for (let dr = -2; dr <= 2 && !nearIslet; dr++) for (let dc = -2; dc <= 2; dc++) {
            const nc = c + dc, nr = r + dr;
            if (nc >= 0 && nr >= 0 && nc < cols && nr < this.cfg.rows && this.islet[nr * cols + nc]) { nearIslet = true; break; }
          }
          if (nearIslet) continue;
          const lN = quay(c, r - 1), lS = quay(c, r + 1), lW = quay(c - 1, r), lE = quay(c + 1, r);
          if (!(lN || lS || lW || lE)) continue;
          const sx = lW ? 1 : lE ? -1 : 0, sy = lN ? 1 : lS ? -1 : 0;    // 바다 쪽 단위 방향
          if (sx && sy) continue;                                       // 코너 물은 생략(겹침)
          if (this.tileAt(c + sx * 2, r + sy * 2) !== '~' || this.tileAt(c + sx, r + sy) !== '~') continue;
          const ew = sy !== 0;
          if (ew ? ((c % 3) + 3) % 3 !== 0 : ((r % 2) + 2) % 2 !== 0) continue;
          if (hash2(seed ^ 0xb0a1, c, r) > 0.55 || !dBoat) continue;
          // 선체 = 44×26 × scale 2 = 88×52px(2.75 × 1.625타일), **바닥 앵커**(y = ty*tr + tr).
          //   안벽 쪽으로 살짝(≤ 8px)만 물리고 나머지는 물 위에 뜨도록 앵커를 맞춘다(113차 —
          //   구 값은 N-S 안벽에서 36px가 뭍으로 올라탔다).
          const tx = c + (ew ? 0 : sx * 0.9);
          const ty = ew ? (sy > 0 ? r + 0.5 : r - 0.1) : r + 0.3;
          this.spawnProp(dBoat, tx, ty, slot, { fx: hash2(seed ^ 0xb0a2, c, r) < 0.5, free: true });
        }
      }
      if (dCrane) {
        for (let r = r0; r < r1; r++) {
          for (let c = c0; c < c1; c++) {
            const t = this.tileAt(c, r);
            if (t !== '.' && t !== 'b' && t !== 'r') continue;
            if (this.islet[r * cols + c]) continue;          // 섬(갯바위)엔 하역 크레인이 없다(115차 실측 — 조도 위 크레인)
            if (((c + r) % 9) !== 0 || hash2(seed ^ 0xc8a1, c, r) > 0.35) continue;
            // 안벽 위: 4방향 중 항만 수역이 인접 + 2×2 뭍 여유 + 도로 밴드 밖
            let sea = false;
            for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
              const nc = c + dc, nr = r + dr;
              if (nc >= 0 && nr >= 0 && nc < cols && nr < this.cfg.rows && this.tileAt(nc, nr) === '~' && this.harbor[nr * cols + nc]) { sea = true; break; }
            }
            if (!sea) continue;
            // 물이 아닌 이웃은 전부 뭍이어야 한다(안벽 가장자리 한 칸 — 어느 방위의 안벽이든)
            let landN = 0;
            for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (quay(c + dc, r + dr)) landN++;
            if (landN < 3) continue;
            const band = this.roadBand(c + 0.5, r + 0.5, chunkIdx);
            if (band && band.d < band.halfW + 1.5) continue;
            this.spawnProp(dCrane, c, r, slot);
          }
        }
      }
    }

    // ⚠ 도로변 평행 주차(112차)는 **폐기**(113차 — 사용자 지시 "차량 배치는 도로가 아니어야 한다").
    //   연석 안쪽은 곧 주행 차로라 정지 차량이 도로 위에 서 있는 것으로 보였다.

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

    // ── 가로 시설물 정렬 (173차 — 사용자 지적 "지형과의 조화·연결성") ──
    //    해시 산포는 "왜 거기 있는지"를 설명하지 못한다. 실제 거리의 가로등·가로수·벤치는
    //    차도 연석 **바깥 보도 위**에, 도로 중심선을 따라 **등간격**으로 선다.
    //    도로 폴리라인을 시작점부터 누적 호길이(s)로 걸으며 스냅하므로 청크 경계에서도 간격이 이어진다.
    //    ⚖ 배치 소유권 = 스냅 지점이 속한 청크(중복 생성 방지) · 전부 free(바디 없음) —
    //      1타일 보도에 바디를 세우면 그 길이 통째로 막힌다(106차 테트라포드 전례).
    if (hasTs && this.cfg.roads) {
      const chunkIdx = cr * this.chunkCols + cc;
      const rlist = this.roadsByChunk.get(chunkIdx);
      const dLamp = def('lamp2') ?? def('lamp');
      const dTree = def('pine'), dBush = def('bush'), dBench = def('bench');
      if (rlist) for (const ri of rlist) {
        const rd = this.cfg.roads[ri];
        // 회전교차로 링(중앙섬 침범)·서비스 골목(w < 2)은 가로 시설물을 두지 않는다
        if (rd.roundabout || rd.w < 2 || rd.pts.length < 2) continue;
        const step = rd.w >= 4 ? 10 : 16;        // 가로등 간격(타일) — 간선일수록 촘촘
        const half = step / 2;                    // half-step 격자 = 가로등 ↔ 가로수 교대
        let s = 0;
        for (let i = 0; i < rd.pts.length - 1; i++) {
          const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
          const dx = bx - ax, dy = by - ay;
          const len = Math.hypot(dx, dy);
          if (len < 0.01) continue;
          const ux = dx / len, uy = dy / len;
          for (let k = Math.ceil(s / half) * half; k < s + len; k += half) {
            const slotIdx = Math.round(k / half);
            const isLamp = slotIdx % 2 === 0;
            // 좌·우 보도 교대 — 한쪽에만 몰리면 "한 줄로 심은 화단"이 된다
            const sign = Math.floor(slotIdx / 2) % 2 === 0 ? 1 : -1;
            const off = rd.w / 2 + (isLamp ? 0.9 : 1.6);
            const t = k - s;
            const qx = ax + ux * t - uy * off * sign;
            const qy = ay + uy * t + ux * off * sign;
            const tc = Math.floor(qx), trw = Math.floor(qy);
            if (Math.floor(tc / N) !== cc || Math.floor(trw / N) !== cr) continue;
            if (tc < 0 || trw < 0 || tc >= this.cfg.cols || trw >= this.cfg.rows) continue;
            const tt = this.tileAt(tc, trw);
            if (tt !== 'w' && tt !== ',' && tt !== '.' && tt !== 'p') continue;
            if (this.islet[trw * this.cfg.cols + tc]) continue;
            // 교차로·다른 도로의 차도 위는 비운다
            const band = this.roadBand(qx, qy, chunkIdx);
            if (band && band.d < band.halfW + 0.6) continue;
            if (isLamp) { if (dLamp) this.spawnProp(dLamp, tc, trw, slot, { free: true }); continue; }
            // 가로수 — 잔디면 나무, 포장 보도면 관목(화분)이 기본이고 가끔 벤치
            const hv = hash2(seed ^ 0x57ee, tc, trw);
            const d2 = tt === ',' ? (hv < 0.65 ? dTree : dBush) : (hv < 0.22 ? dBench : hv < 0.78 ? dBush : dTree);
            if (d2) this.spawnProp(d2, tc, trw, slot, { free: true });
          }
          s += len;
        }
      }
    }

    // ── 항로표지 등대·등주(114차 — lights.json · setLights가 뭍으로 스냅해 청크에 배정) ──
    const lights = this.lightsByChunk.get(cr * this.chunkCols + cc);
    if (lights) {
      for (const L of lights) {
        const id = L.kind === 'beacon' ? 'beacon_green' : L.major ? 'lighthouse_major' : `lighthouse_${L.colour}`;
        const d = def(id);
        if (!d) continue;
        // 물 위 등주는 바디 없이(free) — 바다에 벽이 생기면 캐스팅 착수 판정을 막는다
        this.spawnProp(d, L.tx, L.ty, slot, this.tileAt(L.tx, L.ty) === '~' ? { free: true } : undefined);
      }
    }

    // ── 수동 프롭 (patch.json — 편집기 배치) ──
    const manual = this.propsByChunk.get(cr * this.chunkCols + cc);
    if (manual) {
      for (const p of manual) {
        const d = def(p.id);
        if (!d) continue;
        this.spawnProp(d, p.tx, p.ty, slot, { rot: p.rot, fx: p.fx, fy: p.fy, free: p.free });
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
  /**
   * 보도 벽돌(181차) — 차도 중심선에서 반폭 ~ 반폭+1타일 링에 8×4px 러닝본드 벽돌을 깐다.
   * 벽돌 하나의 포함 여부는 **벽돌 중심의 월드 좌표**로 정하므로, 타일·청크 경계에 걸친 벽돌도
   * 양쪽이 같은 답을 내고 각자 자기 몫만 그린다(잘린 반쪽 벽돌 없음).
   */
  private drawSidewalkBricks(g: Phaser.GameObjects.Graphics, list: readonly number[], c0: number, r0: number): void {
    const roads = this.cfg.roads;
    if (!roads) return;
    const tr = this.cfg.tr;
    const N = this.cfg.chunkTiles;
    const c1 = Math.min(c0 + N, this.cfg.cols), r1 = Math.min(r0 + N, this.cfg.rows);
    const segs: number[] = [];                     // ax, ay, bx, by, hw (타일 단위) × n
    for (const ri of list) {
      const rd = roads[ri];
      for (let i = 0; i < rd.pts.length - 1; i++) segs.push(rd.pts[i][0], rd.pts[i][1], rd.pts[i + 1][0], rd.pts[i + 1][1], rd.w / 2);
    }
    if (segs.length === 0) return;
    const dist = (x: number, y: number, k: number): number => {
      const ax = segs[k]!, ay = segs[k + 1]!, vx = segs[k + 2]! - ax, vy = segs[k + 3]! - ay;
      const l2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
      return Math.hypot(ax + vx * t - x, ay + vy * t - y);
    };
    // 세그먼트마다 bbox 안 타일에만 후보로 찍는다(타일 × 전 세그먼트 전수 검사는 굽기를 두 배로 늘렸다)
    const W = c1 - c0;
    const tileCand: (number[] | undefined)[] = new Array(W * (r1 - r0));
    for (let k = 0; k < segs.length; k += 5) {
      const pad = segs[k + 4]! + 1.8;
      const xa = Math.max(c0, Math.floor(Math.min(segs[k]!, segs[k + 2]!) - pad));
      const xb = Math.min(c1 - 1, Math.floor(Math.max(segs[k]!, segs[k + 2]!) + pad));
      const ya = Math.max(r0, Math.floor(Math.min(segs[k + 1]!, segs[k + 3]!) - pad));
      const yb = Math.min(r1 - 1, Math.floor(Math.max(segs[k + 1]!, segs[k + 3]!) + pad));
      for (let r = ya; r <= yb; r++) for (let c = xa; c <= xb; c++) {
        if (dist(c + 0.5, r + 0.5, k) > pad) continue;
        const ti = (r - r0) * W + (c - c0);
        (tileCand[ti] ??= []).push(k);
      }
    }
    const seed = this.cfg.seed ^ 0xb71c;
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const cand = tileCand[(r - r0) * W + (c - c0)];
        if (!cand) continue;
        const tx = c * tr, ty = r * tr;
        for (let wy = ty; wy < ty + tr; wy += 4) {
          const row = wy >> 2;
          const off = (row & 1) * 4;
          for (let bx = tx - 8 + ((off - tx) % 8 + 8) % 8; bx < tx + tr; bx += 8) {
            // 벽돌 = [bx+2, bx+8) × [wy+2, wy+4) · 줄눈은 밴드 바탕색(BRICK_MORTAR)
            const cxw = (bx + 5) / tr, cyw = (wy + 3) / tr;
            let inside = false, under = false;
            for (const k of cand) {
              const d = dist(cxw, cyw, k);
              const hw = segs[k + 4]!;
              if (d < hw + 0.1) { under = true; break; }            // 차도·연석 밑 — 어차피 덮인다
              if (d <= hw + 1 - 0.12) inside = true;
            }
            if (!inside || under) continue;
            const x0 = Math.max(bx + 2, tx), x1 = Math.min(bx + 8, tx + tr);
            if (x1 <= x0) continue;
            const h = hash2(seed, bx >> 3, row);
            g.fillStyle(BRICK_FACES[Math.floor(h * BRICK_FACES.length) % BRICK_FACES.length]!, 1);
            g.fillRect(x0 - c0 * tr, wy + 2 - r0 * tr, x1 - x0, 2);
          }
        }
      }
    }
  }

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
    for (const ri of list) { const rd = this.cfg.roads[ri]; if (rd.pts.length >= 2) band(rd, rd.w + 2, BRICK_MORTAR); }
    // 181차 — 보도 = 적갈색 벽돌(레퍼런스 ①). 구 회색 무지 밴드는 도로와 공터 사이가 비어 보였다.
    //   벽돌은 **월드 좌표 러닝본드**라 곡선 밴드에도 타일 격자가 드러나지 않는다(격자를 밴드에
    //   맞추지 않는다 — 5.1의 "표 테두리" 문제를 피한 이유 그대로).
    this.drawSidewalkBricks(g, list, c0, r0);
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
        // 도로 밴드 밖 'r'은 콘크리트 광장(112차) — 아스팔트 반점을 찍지 않는다
        const band = this.roadBand(c + 0.5, r + 0.5, idx);
        if (!band || band.d > band.halfW) continue;
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
  /**
   * 일방통행 쌍(이중도로) 경계 오프셋(106차-b) — OSM 대로는 방향별 oneway 2줄로 그려져
   * 화면에선 한 덩어리 아스팔트인데 **중앙선이 없었다**(사용자: "노란 실선 중앙선이 있어야").
   * 반대 방향 평행 oneway가 폭 안쪽 거리에 있으면 두 중심선의 **가운데(경계)** 오프셋을 돌려준다.
   * 좌측통행 아님(한국 우측통행) — 대향 차로는 진행 방향 **왼쪽**이므로 오프셋은 양수 쪽이다.
   * 쌍의 양쪽이 서로를 찾으므로 **작은 인덱스 쪽만** 그린다(이중 드로잉 방지).
   */
  /**
   * 이 점이 차도(아스팔트) 위인가(106차-b) — 횡단보도·정지선·스크램블 줄무늬가 도로 밖
   * 타일·건물을 침범하지 않게 클립한다(사용자: "도로 타일이 끝나는 지점에서는 잘려야").
   */
  private onAsphalt(x: number, y: number, list: readonly number[], margin = 0.12): boolean {
    const roads = this.cfg.roads;
    if (!roads) return false;
    for (const ri of list) {
      const rd = roads[ri];
      const hw = rd.w / 2 - margin;
      if (hw <= 0) continue;
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
        const vx = bx - ax, vy = by - ay;
        const l2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
        const dx = ax + vx * t - x, dy = ay + vy * t - y;
        if (dx * dx + dy * dy <= hw * hw) return true;
      }
    }
    // 벡터 밴드 밖이라도 래스터 'r'(OSM 도로 면 — 광장·주차장형 아스팔트)이면 포장으로 친다.
    //   화면에 아스팔트로 보이는 곳에서 마킹이 끊기면 그게 더 어색하다(106차-c 스크램블 실측).
    const tc = Math.floor(x), trw = Math.floor(y);
    return tc >= 0 && trw >= 0 && tc < this.cfg.cols && trw < this.cfg.rows && this.tileAt(tc, trw) === 'r';
  }

  private dualBoundaryOffset(ri: number, pts: [number, number][]): { off: number; double: boolean } | null {
    const roads = this.cfg.roads!;
    const road = roads[ri];
    if (!road.oneway || road.roundabout || pts.length < 2) return null;
    // 조각 중간점과 진행 방향
    const mi = Math.floor((pts.length - 1) / 2);
    const a = pts[mi], b = pts[Math.min(pts.length - 1, mi + 1)];
    const ux0 = b[0] - a[0], uy0 = b[1] - a[1];
    const ul = Math.hypot(ux0, uy0) || 1;
    const ux = ux0 / ul, uy = uy0 / ul;
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (let oj = 0; oj < roads.length; oj++) {
      if (oj === ri) continue;
      const other = roads[oj];
      if (!other.oneway || other.roundabout) continue;
      for (let i = 0; i < other.pts.length - 1; i++) {
        const [cx, cy] = other.pts[i], [dx2, dy2] = other.pts[i + 1];
        const vx = dx2 - cx, vy = dy2 - cy;
        const vl = Math.hypot(vx, vy) || 1;
        if ((ux * vx + uy * vy) / vl > -0.7) continue;       // 반대 방향(대향)만
        const t = Math.max(0, Math.min(1, ((mid[0] - cx) * vx + (mid[1] - cy) * vy) / (vl * vl)));
        const px = cx + vx * t, py = cy + vy * t;
        // 진행 방향 왼쪽 법선(-uy, ux) 기준 부호 있는 횡거리 — offsetPolyline과 같은 규약
        const lat = (px - mid[0]) * -uy + (py - mid[1]) * ux;
        const d = Math.abs(lat);
        // 방향이 반대인 평행로가 폭 안쪽 거리에 있으면 그 **사이**가 중앙 경계다.
        //   (부호로 좌/우를 거르지 않는다 — y-down 스크린 좌표에서 좌우 부호가 헷갈리기 쉽고,
        //    대향 조건만으로 충분하다. lat 부호는 오프셋 방향에 그대로 쓴다.)
        if (d < 0.3 || d > (road.w + other.w) / 2 + 0.6) continue;
        if (oj < ri) return null;                             // 쌍의 작은 인덱스 쪽만 그린다
        return { off: lat / 2, double: (road.lanes ?? 1) >= 2 || (other.lanes ?? 1) >= 2 };
      }
    }
    return null;
  }

  /** (x,y)의 마킹을 지워야 하는가 — 다른 도로 아스팔트 회랑 안 또는 회전교차로 원 안 (109차-b).
   *  (ux,uy) = 그 지점 마킹 진행 방향. **준평행(|cos| > 0.92 ≈ 23° 미만) 도로는 면제** —
   *  이중도로 쌍·합류 차로가 자기 마킹을 지우지 않게 한다(교차 도로는 각이 커서 걸린다). */
  private markSuppressedAt(x: number, y: number, ux: number, uy: number, selfRi: number): boolean {
    // 회전교차로 원 내부(교통섬 포함) — 링 자신(roundabout 도로)의 마킹은 면제
    if (!this.cfg.roads![selfRi].roundabout) {
      for (const ra of this.roundabouts) {
        if (Math.hypot(x - ra.cx, y - ra.cy) < ra.R + ra.halfW + 0.15) return true;
      }
    }
    const list = this.markSegHash.get(Math.floor(y / 8) * 8192 + Math.floor(x / 8));
    if (!list) return false;
    for (const si of list) {
      const s = this.markSegs[si];
      if (s.ri === selfRi) continue;
      if (Math.abs(ux * s.ux + uy * s.uy) > 0.92) continue;   // 준평행 면제
      const vx = x - s.ax, vy = y - s.ay;
      const t = Math.max(0, Math.min(1, (vx * s.dx + vy * s.dy) / s.len2));
      const px = s.ax + s.dx * t, py = s.ay + s.dy * t;
      if (Math.hypot(x - px, y - py) < s.halfW + 0.15) return true;
    }
    return false;
  }

  /** 마킹 폴리라인을 회랑 밖 구간만 남기고 쪼갠다 (109차-b — 0.5타일 샘플링). */
  private clipMarking(pl: [number, number][], selfRi: number, quads: readonly [number, number][][] = [], minLen = 2.5): [number, number][][] {
    if (!this.markSegs.length && quads.length === 0) return [pl];
    const inQuad = (x: number, y: number): boolean => {
      for (const q of quads) {
        let sign = 0, ok = true;
        for (let i = 0; i < q.length; i++) {
          const a = q[i], b = q[(i + 1) % q.length];
          const cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
          if (Math.abs(cr) < 1e-9) continue;
          if (sign === 0) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) { ok = false; break; }
        }
        if (ok) return true;
      }
      return false;
    };
    const out: [number, number][][] = [];
    let cur: [number, number][] = [];
    const flush = (): void => { if (cur.length >= 2) out.push(cur); cur = []; };
    for (let i = 0; i < pl.length - 1; i++) {
      const [ax, ay] = pl[i], [bx, by] = pl[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 1e-6) continue;
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      const n = Math.max(1, Math.ceil(len / 0.5));
      for (let k = 0; k < n; k++) {
        const t0 = (k / n) * len, t1 = ((k + 1) / n) * len;
        const mx = ax + ux * (t0 + t1) / 2, my = ay + uy * (t0 + t1) / 2;
        if (this.markSuppressedAt(mx, my, ux, uy, selfRi) || inQuad(mx, my)) {
          flush();
        } else {
          if (cur.length === 0) cur.push([ax + ux * t0, ay + uy * t0]);
          cur.push([ax + ux * t1, ay + uy * t1]);
        }
      }
    }
    flush();
    return out.filter((sub) => {                    // 짧은 부스러기 제거 (183차 — 구 0.8타일은 교차부 색종이. 실선 2.5 · 점선 3.0)
      let l = 0;
      for (let i = 0; i < sub.length - 1; i++) l += Math.hypot(sub[i + 1][0] - sub[i][0], sub[i + 1][1] - sub[i][1]);
      return l >= minLen;
    });
  }

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
      // 골목(자기 절반폭 미만·w<2.5) 접속부에서는 끊지 않는다(106차-b) — 실제 대로는 이면도로가
      //   붙을 때마다 마킹이 끊기지 않는다. 구 규칙(모든 정점에서 절단)은 정지선·횡단보도·조각
      //   가장자리선이 골목마다 반복돼 "너무 주기적"이었다(사용자 리포트 — 청초동 중앙로 실측).
      const junction = otherHalf(p) >= Math.max(1.25, halfW * 0.5);
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
      return len >= 2.0;                            // 183차 — 2타일 미만 조각은 마킹 색종이가 된다
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
    roadList: readonly number[], dryRun = false,
  ): void {
    const tr = this.cfg.tr;
    const nx = -u[1], ny = u[0];
    const inner = halfW - 0.3;
    const depth = 0.6;
    const stripe = 0.32, gapS = 0.22;
    // 회전교차로 진입부 — 양보선(흰 점선)을 정점 쪽에, 횡단보도는 1타일 뒤로 물린다 (규범도).
    // yield_only = 복합부 안(반경+2.5) — 양보선만
    if (mode === 'yield_only') {
      if (dryRun) return;
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
    const stripes: [number, number][][] = [];
    let total = 0;
    for (let s = -inner; s + stripe <= inner + 0.01; s += stripe + gapS) {
      total++;
      const q = quad(s, stripe);
      // 실제 도로에서 횡단보도는 겹치지 않는다 — 앞서 그린 횡단보도와 겹치는 줄무늬만 생략 (사용자 규칙)
      const mid: [number, number] = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
      if (drawn.some((d) => inside(mid, d) || q.some((c) => inside(c, d)) || crosses(q, d))) continue;
      // 아스팔트 클립(106차-b) — 줄무늬 중앙 + 양끝이 전부 차도 위일 때만 (도로 밖 침범 금지)
      const e0: [number, number] = [(q[0][0] + q[3][0]) / 2, (q[0][1] + q[3][1]) / 2];
      const e1: [number, number] = [(q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2];
      if (!this.onAsphalt(mid[0], mid[1], roadList) || !this.onAsphalt(e0[0], e0[1], roadList) || !this.onAsphalt(e1[0], e1[1], roadList)) continue;
      stripes.push(q);
    }
    // 183차 — 줄무늬가 60% 미만만 남는 횡단보도는 통째로 생략한다(사선 교차·복합부에서 잘린 조각이
    //   "교차로 한복판의 줄무늬 색종이"였다 — 사용자: "도로가 미적으로 지저분").
    if (stripes.length < Math.max(3, Math.ceil(total * 0.6))) return;
    if (!dryRun) for (const q of stripes) g.fillPoints(q.map(([x, y]) => ({ x: (x - c0) * tr, y: (y - r0) * tr })), true);
    drawn.push(quad(-inner, inner * 2));
    if (dryRun) return;
    if (mode === 'stop') {
      // 정지선 — 우측통행이라 진입 차로(진행 방향 오른쪽 절반)에만, 횡단보도 앞.
      //   끝점이 차도 밖이면 안쪽으로 줄인다(106차-b — 도로 밖 침범 금지)
      g.lineStyle(3, COL.roadLine, 0.9);
      const sx = base[0] - u[0] * 0.18, sy = base[1] - u[1] * 0.18;
      let lim = inner;
      while (lim > 0.3 && !this.onAsphalt(sx + nx * lim, sy + ny * lim, roadList)) lim -= 0.3;
      if (lim > 0.3 && this.onAsphalt(sx, sy, roadList)) {
        g.lineBetween((sx - c0) * tr, (sy - r0) * tr, (sx + nx * lim - c0) * tr, (sy + ny * lim - r0) * tr);
      }
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
    // 183차 — 횡단보도는 **선 마킹 뒤에** 그린다(다른 도로의 중앙선·차선이 줄무늬를 가로지르던 문제).
    //   1패스: 자리만 정한다(dryRun — 사각형 수집) · 2패스: 선 마킹을 그 사각형에서 클립 · 3패스: 줄무늬.
    type CwJob = { base: [number, number]; u: [number, number]; halfW: number; mode: 'stop' | 'yield' | 'yield_only' };
    const cwJobs: CwJob[] = [];
    const cwQueue = (base: [number, number], u: [number, number], halfW: number, mode: CwJob['mode']): void => {
      cwJobs.push({ base, u, halfW, mode });
      this.drawCrosswalk(g, base, u, halfW, c0, r0, drawnCw, mode, list, true);
    };
    const nodeIsRoundabout = (p: [number, number] | undefined, self: number): boolean =>
      !!p && (this.nodeRoads.get(this.nodeKey(p)) ?? []).some((o) => o !== self && !!this.cfg.roads![o].roundabout);
    // 회전교차로 반경+2.5타일 안의 교차 정점 = 진입부 — 양보선만(횡단보도는 복잡부 밖에서)
    const nearRoundabout = (p: [number, number] | undefined): boolean =>
      !!p && this.roundabouts.some((ra) => Math.hypot(p[0] - ra.cx, p[1] - ra.cy) < ra.R + 2.5);
    const pieceLen = (pts: [number, number][]): number => {
      let l = 0; for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return l;
    };
    const roadLen = new Map<number, number>();
    const linePieces: { ri: number; pts: [number, number][] }[] = [];
    // 1패스 — 조각 나누기 + 횡단보도 자리 결정
    for (const ri of list) {
      const road = this.cfg.roads[ri];
      if (road.pts.length < 2) continue;
      const halfW = road.w / 2;
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
          // 109차-b: 조각 끝이 **다른 교차 도로의 회랑 안**이면(사선 교차·복합부) 횡단보도를
          // 그리지 않는다 — 교차로 한복판에 뜬 줄무늬가 난잡함의 주범(사용자 캡처).
          if (piece.cutEnd && mEnd) {
            const u = dirAt(pts[pts.length - 2], pts[pts.length - 1]);
            const b = pts[pts.length - 1];
            if (!this.markSuppressedAt(b[0], b[1], u[0], u[1], ri)) cwQueue(b, u, halfW, mEnd);
          }
          if (piece.cutStart && mStart) {
            const u = dirAt(pts[1], pts[0]);
            if (!this.markSuppressedAt(pts[0][0], pts[0][1], u[0], u[1], ri)) cwQueue(pts[0], u, halfW, mStart);
          }
        }
        linePieces.push({ ri, pts });
      }
    }
    // 2패스 — 선 마킹 (횡단보도 사각형 안은 비운다)
    for (const { ri, pts } of linePieces) {
      {
        const road = this.cfg.roads[ri];
        const halfW = road.w / 2;
        const lanesPerDir = Math.max(1, road.lanes ?? 1);
        const edgeM = 0.35;
        const oneway = !!road.oneway || !!road.roundabout;
        const laneW = oneway ? Math.max(0.5, (road.w - edgeM * 2) / lanesPerDir) : Math.max(0.5, (halfW - edgeM) / lanesPerDir);
        const dash = tr / 2, gap = tr / 2;
        // 마킹 회랑 클리핑 (109차-b) — 정점 없는 기하 교차(이중도로 상대·회전교차로 링·중간
        //   관통)에서 마킹이 교차로 안을 지나가지 않게, 모든 선형 마킹을 클리핑 경유로 그린다.
        const solidC = (pl: [number, number][]): void => {
          for (const sub of this.clipMarking(pl, ri, drawnCw)) solid(sub);
        };
        const dashedC = (pl: [number, number][]): void => {
          if (pieceLen(pl) < 2.0) return;            // 183차 — 대시 한두 개짜리 조각은 그리지 않는다
          for (const sub of this.clipMarking(pl, ri, drawnCw, 3.0)) dashed(sub, dash, gap);
        };
        // 중앙선은 이면도로(w<2.5 — 골목·주차장 통로)에는 긋지 않는다(106차-b) — 실도로에서
        //   서비스 도로엔 중앙선이 없다. 구 규칙(w>=2 전부)은 주차장 통로에 노란 고리를 그렸다.
        if (road.w >= 2.5 && !oneway) {
          g.lineStyle(road.w >= 3 ? 4 : 3, COL.roadCenter, 0.95);
          if (lanesPerDir >= 2) {                    // 왕복 4차로 이상 = 이중 황색 실선
            g.lineStyle(3, COL.roadCenter, 0.95);
            solidC(SeamlessChunks.offsetPolyline(pts, 0.09));
            solidC(SeamlessChunks.offsetPolyline(pts, -0.09));
          } else {
            solidC(pts);                             // 중앙선 — 노란 실선 (주택가 2.8타일 도로도 — 끊김 금지)
          }
        }
        if (oneway) {                                // 일방통행 — 차로 점선을 전 폭에 걸쳐
          // 이중도로 쌍이면 두 방향 사이 경계에 황색 중앙선(왕복 4차로급 이상 = 이중선) — 106차-b
          const dual = this.dualBoundaryOffset(ri, pts);
          if (dual) {
            g.lineStyle(3, COL.roadCenter, 0.95);
            if (dual.double) {
              solidC(SeamlessChunks.offsetPolyline(pts, dual.off + 0.09));
              solidC(SeamlessChunks.offsetPolyline(pts, dual.off - 0.09));
            } else {
              solidC(SeamlessChunks.offsetPolyline(pts, dual.off));
            }
          }
          g.lineStyle(3, COL.roadLine, 0.85);
          for (let k = 1; k < lanesPerDir; k++) dashedC(SeamlessChunks.offsetPolyline(pts, -halfW + edgeM + k * laneW));
          if (road.w >= 4 && pieceLen(pts) >= 3) {   // 짧은 조각의 가장자리선은 교차부에서 "ㄷ" 자국이 된다
            g.lineStyle(2, COL.roadLine, 0.6);
            solidC(SeamlessChunks.offsetPolyline(pts, halfW - edgeM));
            solidC(SeamlessChunks.offsetPolyline(pts, -(halfW - edgeM)));
          }
          continue;
        }
        g.lineStyle(3, COL.roadLine, 0.85);
        for (let k = 1; k < lanesPerDir; k++) {      // 차선 — 흰 점선
          dashedC(SeamlessChunks.offsetPolyline(pts, k * laneW));
          dashedC(SeamlessChunks.offsetPolyline(pts, -k * laneW));
        }
        if (road.w >= 4 && pieceLen(pts) >= 3) {     // 가장자리 실선 — 차도 안쪽 (짧은 조각 제외)
          g.lineStyle(2, COL.roadLine, 0.6);
          solidC(SeamlessChunks.offsetPolyline(pts, halfW - edgeM));
          solidC(SeamlessChunks.offsetPolyline(pts, -(halfW - edgeM)));
        }
      }
    }
    // 3패스 — 횡단보도·정지선을 선 위에 (같은 순서로 다시 돌리면 겹침 판정도 1패스와 같다)
    drawnCw.length = 0;
    for (const j of cwJobs) this.drawCrosswalk(g, j.base, j.u, j.halfW, c0, r0, drawnCw, j.mode, list);
    // 신호 교차로 — 대각선 횡단보도 (스크램블 X자, 신호 교차로 전용 — 후속 7 보류분 해소)
    this.drawScrambleCrosswalks(g, c0, r0, list, drawnCw);
    // 186차 — 회전교차로 진입부 분리섬(101차 `drawSplitterIslands`)은 삭제했다. OSM 일방통행 쌍
    //   사이 쐐기를 채운 회색 조각이 교차로마다 떠 있어 "너무 지저분하다"(사용자 캡처 — 수복탑).
  }

  /**
   * 대각선 횡단보도 — 신호 교차로(detectSignals) 박스 안에 두 대각 방향 지브라 밴드(X자).
   * 교차로 박스는 markingPieces 인셋으로 이미 마킹이 비어 있어 그 위에 얹는다.
   * 중앙 겹침은 실제 스크램블 교차로도 겹치므로 그대로 둔다.
   */
  private drawScrambleCrosswalks(
    g: Phaser.GameObjects.Graphics, c0: number, r0: number,
    roadList: readonly number[], straightCw: [number, number][][],
  ): void {
    // 직선 횡단보도 사각형 안 판정 — 대각선은 직선에 **양보**한다(106차-b 사용자 규칙:
    // "겹치는 부분에서 직선은 남기고 대각선은 짤리게")
    const insideRect = (q: [number, number], poly: [number, number][]): boolean => {
      let sign = 0;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const cr = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
        if (Math.abs(cr) < 1e-9) continue;
        if (sign === 0) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) return false;
      }
      return true;
    };
    const tr = this.cfg.tr;
    const N = this.cfg.chunkTiles;
    for (const sg of this.signals) {
      // 스크램블은 **대형 교차로만** (클러스터 반경 3.2타일↑ — 이중도로급 사거리). 실도로에서
      // 대각선 횡단보도는 드물다 — 소형 신호 교차로 90곳 전부에 그리면 과밀(실렌더 판단)
      if (sg.half < 3.2) continue;
      if (sg.x < c0 - 10 || sg.x > c0 + N + 10 || sg.y < r0 - 10 || sg.y > r0 + N + 10) continue;
      // ── 교차로 포장 박스 실측(106차-c — 사용자 목업 정합) ─────────────────────
      //   X는 45° 고정 + 클러스터 반경이 아니라 **두 도로의 실제 교차점**을 중심으로,
      //   교차부를 지나는 세로/가로 도로들의 포장 범위 박스 안에만 그린다. 신호 클러스터
      //   센트로이드는 접속 정점들에 끌려 교차부에서 비껴난다(실측 1.5타일 오프셋).
      const roads = this.cfg.roads!;
      const nearSeg = (cxq: number, cyq: number, rd: RegionRoad): { px: number; py: number; vert: boolean } | null => {
        let best: { px: number; py: number; vert: boolean; d: number } | null = null;
        for (let i = 0; i < rd.pts.length - 1; i++) {
          const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
          const vx = bx - ax, vy = by - ay;
          const l2 = vx * vx + vy * vy || 1;
          const t = Math.max(0, Math.min(1, ((cxq - ax) * vx + (cyq - ay) * vy) / l2));
          const px = ax + vx * t, py = ay + vy * t;
          const d = Math.hypot(px - cxq, py - cyq);
          if (d <= 2.5 && (!best || d < best.d)) best = { px, py, vert: Math.abs(vx) < Math.abs(vy), d };
        }
        return best;
      };
      // 1차: 가장 넓은 세로/가로 도로의 교차점 → 2차: 그 점 기준으로 포장 박스 반경 실측
      let cx = sg.x, cy = sg.y, wV = 0, wH = 0;
      for (const ri of roadList) {
        const hit = nearSeg(sg.x, sg.y, roads[ri]);
        if (!hit) continue;
        if (hit.vert) { if (roads[ri].w > wV) { wV = roads[ri].w; cx = hit.px; } }
        else if (roads[ri].w > wH) { wH = roads[ri].w; cy = hit.py; }
      }
      if (wV === 0 || wH === 0) continue;                          // 교차 기하를 못 재면 생략
      let hx = 0, hy = 0;
      for (const ri of roadList) {
        const hit = nearSeg(cx, cy, roads[ri]);
        if (!hit) continue;
        if (hit.vert) hx = Math.max(hx, Math.abs(hit.px - cx) + roads[ri].w / 2);
        else hy = Math.max(hy, Math.abs(hit.py - cy) + roads[ri].w / 2);
      }
      hx = Math.min(hx, sg.half + 1);
      hy = Math.min(hy, sg.half + 1);
      if (hx < 1.2 || hy < 1.2) continue;
      const diag = Math.hypot(hx, hy);
      const L = diag - 0.3;        // 박스 대각선 모서리 살짝 안쪽까지
      const bw = 0.95;             // 밴드 폭 (타일)
      g.fillStyle(COL.crosswalk, 0.92);
      // 대각 방향 = 박스 대각선 (비정사각 교차로면 45°가 아니다)
      const dirs: [number, number][] = [[hx / diag, hy / diag], [hx / diag, -hy / diag]];
      const stripeOk = (ux: number, uy: number, t: number): boolean => {
        const nx = -uy, ny = ux;
        const mx = cx + ux * (t + 0.15), my = cy + uy * (t + 0.15);
        const samples: [number, number][] = [
          [mx, my], [mx + nx * bw / 2, my + ny * bw / 2], [mx - nx * bw / 2, my - ny * bw / 2],
        ];
        // 박스 안 + 아스팔트 위 + 직선 횡단보도 양보 — 셋 다 통과해야 그린다(사용자 목업:
        //   X는 교차로 박스 안으로 잘리고, 직선과 겹치는 부분은 직선이 남는다)
        if (samples.some(([qx, qy]) => Math.abs(qx - cx) > hx - 0.06 || Math.abs(qy - cy) > hy - 0.06)) return false;
        if (samples.some(([qx, qy]) => !this.onAsphalt(qx, qy, roadList))) return false;
        if (samples.some((q) => straightCw.some((d) => insideRect(q, d)))) return false;
        return true;
      };
      // 최소 성립 검사만 — X를 통째로 지우지 않는다(사용자 목업: 잘린 X가 정답). 줄무늬가
      //   너무 적으면(팔 하나도 못 만드는 수준) 그 교차로만 생략.
      let ok = 0;
      for (const [ux, uy] of dirs) for (let t = -L; t + 0.3 <= L; t += 0.6) if (stripeOk(ux, uy, t)) ok++;
      if (ok < 8) continue;
      for (const [ux, uy] of dirs) {
        const nx = -uy, ny = ux;
        for (let t = -L; t + 0.3 <= L; t += 0.6) {
          if (!stripeOk(ux, uy, t)) continue;
          const mx = cx + ux * (t + 0.15), my = cy + uy * (t + 0.15);
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
   * 청크 한 개의 베이킹은 Phaser 내부(RenderTexture.clear/batchDraw 포함)에서
   * null canvas 예외가 날 수 있다. 이 예외가 update() 밖으로 전파되면 브라우저
   * 전역 오류 배너 뒤로 게임이 멈추므로, 문제가 난 청크만 비운 상태로 완료한다.
   */
  private bakeChunk(idx: number, slot: ChunkSlot): void {
    try {
      this.bakeChunkUnsafe(idx, slot);
    } catch (e) {
      if (!this.disposed && this.isLiveSlot(idx, slot)) slot.baked = true;
      console.warn('[SeamlessChunks] 청크 베이킹 예외 격리', idx, e);
    }
  }

  private bakeChunkUnsafe(idx: number, slot: ChunkSlot): void {
    if (this.disposed || !this.isLiveSlot(idx, slot)) return;
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
    /** 180차 — 방파제 단면 띠의 바깥 모서리에 더 바다 쪽 재료 삼각형을 얹은 타일 */
    const bwTriAt = this.bwTriAt;
    bwTriAt.clear();
    /** 180차 — 45° 호안 삼각형을 얹은 물 타일 (절차 패스가 포말을 빗변을 따라 긋는다) */
    const waterTriAt = new Map<number, 'ne' | 'nw' | 'se' | 'sw'>();
    if (useGround) {
      slot.rt.beginDraw();
      const grp = terrainGroup;   // 172차 — core 표로 이관(차도·보도·광장은 벡터 밴드가 잇는다)
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
            // 180차 — 곡선 해안선(`drawShoreBlend`)이 켜져 있으면 직선 접경 셀은 깔지 않는다
            if (this.ttpReady && !SHORE_BLEND) {
              const sd = [at(c, r - 1) === 's', at(c + 1, r) === 's', at(c, r + 1) === 's', at(c - 1, r) === 's'];
              for (let d = 0; d < 4; d++) {
                if (!sd[d]) continue;
                const pool = this.ttpEdge[d];
                slot.rt.batchDraw(pool[Math.floor(hash2(seed ^ (0x5ea1 + d), c, r) * pool.length) % pool.length], dx, dy);
              }
            }
            // ── 173차 · 방파제 접경 ── 105차에 **추출해 놓고 한 번도 쓰이지 않던** 발치·안벽 셀.
            //   물 타일은 지금껏 접경 로직 도달 전에 continue 했고, 그래서 질감이 가장 센 재료
            //   (테트라포드·사석·상판)가 가장 딱딱한 경계를 갖고 있었다(사용자 리포트의 핵심).
            //   외해측(사석·피복)에는 **발치**가, 항내측(상판·안벽)에는 **안벽**이 깔린다.
            //  181차 — 방파제는 피복 스프라이트·포말이, 안벽은 무이음 콘크리트 + 45° 호안이 맡는다 → 생략
            if (this.coastReady && !(this.armorReady && this.surfAtlas.has('quay'))) {
              const nb: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
              for (let d = 0; d < 4; d++) {
                const [ddc, ddr] = nb[d]!;
                const nc = c + ddc, nr = r + ddr;
                if (nc < 0 || nr < 0 || nc >= cols || nr >= this.cfg.rows) continue;
                const nch = at(nc, nr);
                if (nch !== 'b' && !(nch === '.' && this.bwClass[nr * cols + nc] > 0)) continue;
                const outer = this.bwClass[nr * cols + nc] >= 2;   // 2=사석 3=피복 = 외해측
                const pool = outer ? this.coastToe[d] : this.coastQuay[d];
                if (!pool || pool.length === 0) continue;
                slot.rt.batchDraw(pool[Math.floor(hash2(seed ^ (0x6c10 + d), c, r) * pool.length) % pool.length], dx, dy);
              }
            }
            // ── 180차 · 안벽 계단 45° — 대각선 안벽·호안이 타일 계단으로 끊겨 보였다(사용자 리포트).
            //   물 타일의 **안쪽 모서리**(직교 두 변 + 대각이 같은 단단한 뭍)에 그 뭍의 삼각형을 얹는다.
            //   계단 한 칸마다 이 삼각형이 이어져 빗변이 한 줄의 45° 호안선이 된다(충돌은 불변).
            {
              const q = this.waterChamferAt(c, r);
              if (q) {
                // 'r'(콘크리트 광장)은 지면 베이스 위에 광장 톤을 덧칠하므로 삼각형도 광장 톤으로
                //  'p'(포장 광장)는 terrainGroup으로는 '.'에 묶이지만 **자기 베이스 셀**(pave)을 따로 갖는다
                //  181차 — 아틀라스 지형은 **이 물 타일 자리의 위상 프레임**을 잘라 쓴다(뭍과 무늬가 이어진다)
                const gch = this.surfAtlas.has(q[1]) || this.groundTex.has(q[1]) ? q[1] : terrainGroup(q[1]);
                const src = q[1] === 'r' && !this.surfAtlas.has('r') && this.plazaTex.length > 0
                  ? this.plazaTex[0]! : this.groundKeyAt(gch, c, r);
                const tk = src ? this.triKey(src, q[0]) : null;
                if (tk) {
                  slot.rt.batchDraw(tk, dx, dy);
                  waterTriAt.set(r * cols + c, q[0]);
                }
              }
            }
            // ── 섬 주변 여(스커리) — 실사 갯바위 스프라이트 산포(105차). 절차 사각형 대체.
            //   본섬 둘레 2타일 안 물에만, 해시로 성기게. 물속 바위는 포말 링이 있는
            //   `rockwater_*`를 섞어 물에 잠긴 느낌을 준다.
            //   ⚠ 사진 시트 셀(115차 — 물속 바위가 그려진 오버라이드)이 있는 물 타일은 생략(이중 바위)
            if (this.coastReady && hash2(seed ^ 0x5c07, c, r) > 0.62 && this.nearIsletAt(c, r) && !this.tileTexMap.has(r * cols + c)) {
              const h = hash2(seed ^ 0x5c08, c, r), h2b = hash2(seed ^ 0x5c09, c, r);
              const key = h > 0.55
                ? this.coastRocks[Math.floor(h2b * this.coastRocks.length) % this.coastRocks.length]
                : `ts_coast_rockwater_${Math.floor(h2b * 4) % 4}`;
              const src = this.scene.textures.get(key).getSourceImage() as { width: number; height: number };
              // 오프셋은 **짝수 스냅** — 실사 바위도 2px 그레인이라 홀수로 놓으면 입자가 어긋난다(106차)
              const ox = Math.floor(h2b * Math.max(1, tr - src.width) / 2) * 2;
              const oy = Math.floor(h * Math.max(1, tr - src.height) / 2) * 2;
              slot.rt.batchDraw(key, dx + ox, dy + oy);
            }
            // ⚠ 외해측 자동 테트라포드 피복은 **폐기**(106차) — 타일마다 1~3개를 흩뿌리는
            //   규칙이라 사이가 벙벙 비어 실제 소파블록 사면처럼 보이지 않았다(리포트 3).
            //   이제 편집기에서 **겹침 허용 자유 배치**로 촘촘히 쌓는다.
            continue;
          }
          // 181차 — 방파제 성분 = 밑에 물을 깔고(단면이 물가선을 곡선으로 깎는다) 절차 패스·스프라이트가 덮는다
          if (this.armorReady && this.bwComp[r * cols + c] >= 0) {
            if (this.waterTex.length > 0) {
              const wk = this.waterTex[Math.min(1, this.waterTex.length - 1)]!;
              if (wk.length > 0) slot.rt.batchDraw(wk[Math.floor(hash2(seed ^ 0x77aa, c, r) * wk.length) % wk.length]!, dx, dy);
            }
            continue;
          }
          // 섬/암초('.') — 밑에 얕은 물 셀을 깔아둔다 (절차 패스가 모서리를 45°로 깎아
          // 암반을 그릴 때 깎인 부분이 물로 보이게). 포장 베이스는 생략
          // 183차 — 데크('D')는 물 위에 떠 있다: 물 셀을 깔고 판자는 절차 패스가 그린다
          if (ch === 'D') {
            if (this.waterTex.length > 0 && this.waterTex[0].length > 0) {
              slot.rt.batchDraw(this.waterTex[0][Math.floor(hash2(seed ^ 0x77aa, c, r) * this.waterTex[0].length) % this.waterTex[0].length], dx, dy);
            }
            continue;
          }
          if ((this.islet[r * cols + c] && ch === '.') || isRockTerrain(ch)) {
            if (this.waterTex.length > 0 && this.waterTex[0].length > 0) {
              slot.rt.batchDraw(this.waterTex[0][Math.floor(hash2(seed ^ 0x77aa, c, r) * this.waterTex[0].length) % this.waterTex[0].length], dx, dy);
            }
            // 182차 — 암반 = 주기 아틀라스의 월드 위상 프레임(체커판 제거). 볼록 모서리는 45° 삼각 프레임.
            //   사진 시트 셀(조도)은 위에 사진이 얹히므로 건너뛴다(투명 물 부분에 암반이 비치면 안 된다)
            const rockAtl = this.surfAtlas.get('islet');
            if (rockAtl && !this.tileTexMap.has(r * cols + c)) {
              const N = SeamlessChunks.SURF_N;
              const fk = `${rockAtl}#${((c % N) + N) % N}_${((r % N) + N) % N}`;
              const cut = this.isletCutAt(c, r);
              if (!cut) SeamlessChunks.put(slot.rt, fk, dx, dy);
              else {
                const keep = cut === 'ne' ? 'sw' : cut === 'nw' ? 'se' : cut === 'se' ? 'nw' : 'ne';
                const tk = this.triKey(fk, keep);
                if (tk) slot.rt.batchDraw(tk, dx, dy);
              }
            }
            continue;
          }
          // ── 방파제 'b'/상판 '.' — 단면 분류(114차 computeBreakwaters): 피복(TTP) / 사석 / 상판 ──
          if ((ch === 'b' || ch === '.') && this.coastReady) {
            const k = this.bwClass[r * cols + c];
            const bwKey = (kk: number, cc: number, rr: number): string | null =>
              kk === 3 ? (this.ttpReady ? `ts_ttp_tile_ttp_${hash2(seed ^ 0x77b1, cc, rr) < 0.5 ? 'a' : 'b'}` : null)
                : kk === 2 ? `ts_coast_${COAST_RUBBLE[Math.floor(hash2(seed ^ 0x77b2, cc, rr) * 991) % COAST_RUBBLE.length]}`
                  : null;
            const base = k === 3 || k === 2 ? bwKey(k, c, r) : (k === 1 || ch === 'b') ? this.coastPierKey(c, r) : null;
            if (base) {
              SeamlessChunks.put(slot.rt, base, dx, dy);
              // 180차 — 단면 띠(상판 → 사석 → 피복)가 대각선 방파제에서 **타일 상자 계단**으로 끊겼다.
              //   바깥 모서리(직교 두 변 + 대각이 더 바다 쪽 재료)를 그 재료의 45° 삼각형으로 덮는다.
              const q = this.bwChamferAt(c, r, k === 0 ? 1 : k);
              if (q) {
                const src = bwKey(q[1], c + (q[0].endsWith('e') ? 1 : -1), r + (q[0].startsWith('s') ? 1 : -1));
                const tk = src ? this.triOf(src, q[0]) : null;
                if (tk) { slot.rt.batchDraw(tk, dx, dy); bwTriAt.set(r * cols + c, q); }
              }
              continue;
            }
          }
          const keys = this.groundTex.get(ch);
          if (!keys) continue;
          const myG = grp(ch);
          const nN = grp(at(c, r - 1)), nS = grp(at(c, r + 1)), nW = grp(at(c - 1, r)), nE = grp(at(c + 1, r));
          // ── 오토타일 접경 마스크 — 잔디는 다른 군 전부, 포장(tan/pier)은 유기 지형·물만 "바깥"
          //   (포장끼리는 무테 — 밴드/시설이 잇는다) ──
          // 181차 — 무이음 아틀라스 지형은 어두운 테두리 셀을 깔지 않는다(경계 = 재질 차이만)
          const em = this.surfAtlas.has(ch) ? undefined : this.edgeTex.get(myG);
          let mask = 0;
          if (em) {
            // ── 172차 — 접경 판정을 core 표(`seamBetween`)로 옮겼다 ──
            //  구 구현은 "내 바깥 테두리" 하나로 모델링돼 있어서(잔디 = 나 아닌 전부 /
            //  나머지 = 잔디거나 물일 때만) 포장↔모래·흙↔잔디를 구분할 수 없었고,
            //  그래서 106차에 모래를 규칙에서 통째로 빼야 했다(검은 계단 윤곽).
            //  이제는 쌍마다 답이 다르고, 테두리 셀은 `blob`/`curb`일 때만 깔린다.
            const outside = (t: string): boolean => {
              const k = seamBetween(myG, t).kind;
              return k === 'blob' || k === 'curb';
            };
            if (outside(nN)) mask |= 1;
            if (outside(nE)) mask |= 2;
            if (outside(nS)) mask |= 4;
            if (outside(nW)) mask |= 8;
          }
          // ── 잔디 = 유기 블롭 오토타일 우선 (16조합 — 흙 림이 곡선 경계를 그린다).
          //   ⚠ 이너코너 노치 셀(notch_*)은 쓰지 않는다 — 흙 블롭 모서리 셀이라 반타일 흙 사각형이
          //   계단 경계 안쪽마다 "갈색 블롭"으로 찍혔다(실렌더 확인). 대각 케이스는 인접 타일의
          //   림이 이미 곡선을 만들므로 내부 평타일로 충분하다. ──
          if (em && terrainClass(myG) === 'organic' && mask > 0) {
            const tk = em.get(EDGE_SUFFIX[mask]);
            if (tk) { slot.rt.batchDraw(tk, dx, dy); continue; }
          }
          const k = this.groundKeyAt(ch, c, r) ?? keys[0]!;
          SeamlessChunks.put(slot.rt, k, dx, dy);
          // 'r' = 콘크리트 광장 톤(112차) — 도로 회랑은 뒤의 벡터 밴드(보도·연석·아스팔트)가 덮는다
          //  181차 — 광장 아틀라스가 있으면 그것이 곧 베이스라 덧칠하지 않는다(구 덧칠 셀은 줄눈 격자가 있었다)
          if (ch === 'r' && this.plazaTex.length > 0 && !this.surfAtlas.has('r')) {
            slot.rt.batchDraw(this.plazaTex[Math.floor(hash2(seed ^ 0x51a3, c, r) * this.plazaTex.length) % this.plazaTex.length], dx, dy);
          }
          // 직각삼각형 대각 엣지(101차 후속 4 — 사용자 제안 "4방위 직각삼각형 타일"): 계단식 경계를 45°로.
          //  이웃 두 변 + 대각이 같은 지형 B면 그 모서리에 B의 삼각형을 얹는다 (모래·부두 ↔ 맨땅.
          //  차도·보도는 벡터 밴드가 곡선으로 그리므로 여기서는 맨땅과 같은 군으로 취급)
          const tri = (a: string, b: string, d0: string, q: 'ne' | 'nw' | 'se' | 'sw'): boolean => {
            const d = grp(d0);
            // 유기 지형(잔디·농경지·숲) 경계는 블롭 셀 전담 — 삼각이 겹치면 파편이 된다
            if (terrainClass(a) === 'organic') return false;
            if (a !== b || a === myG || d !== a) return false;
            // ── 172차 · 칠하기 순서 ── 낮은 지형 위에 높은 지형의 삼각형을 얹지 않는다.
            //   "금색 해변에 베이지 톱니가 박힌다"(106차)는 모래만의 문제가 아니라
            //   **자연 위에 인공을 덮는 방향** 전체의 문제였다. 순서로 한 번에 막는다.
            if (terrainPaint(a) > terrainPaint(myG)) return false;
            // 181차 — 빗변 경계선은 전부 없앤다(무선 셀). 선이 있으면 45° 계단이 "그려 넣은 윤곽"이 된다
            const src = this.groundKeyAt(a, c, r);
            const tk = src ? this.triKey(src, q) : null;
            if (!tk) return false;
            slot.rt.batchDraw(tk, dx, dy);
            triAt.set(r * cols + c, [q, a]);
            return true;
          };
          // 차도가 잘리는 쪽이 아니라 **차도가 보도를 파고드는** 대각도 같은 규칙으로 처리된다
          let triDrew = tri(nN, nE, at(c + 1, r - 1), 'ne') || tri(nN, nW, at(c - 1, r - 1), 'nw')
            || tri(nS, nE, at(c + 1, r + 1), 'se') || tri(nS, nW, at(c - 1, r + 1), 'sw');
          // 180차 — 포장 광장(p)은 terrainGroup으로 맨땅(.)과 한 군이라 위 규칙이 **계단을 그대로 뒀다**
          //   (호안 옆 회색 광장 ↔ 베이지 맨땅의 톱니). 칠하기 순서대로 낮은 맨땅이 광장 모서리를 45°로 덮는다.
          if (!triDrew && ch === 'p') {
            const bare = (cc: number, rr: number): boolean =>
              at(cc, rr) === '.' && this.bwClass[rr * cols + cc] === 0 && !this.islet[rr * cols + cc];
            const bsrc = this.groundKeyAt('.', c, r);
            const pt = (ok: boolean, q: 'ne' | 'nw' | 'se' | 'sw'): boolean => {
              if (!ok || !bsrc) return false;
              const tk = this.triKey(bsrc, q);
              if (!tk) return false;
              slot.rt.batchDraw(tk, dx, dy);
              triAt.set(r * cols + c, [q, '.']);
              return true;
            };
            triDrew = pt(bare(c, r - 1) && bare(c + 1, r) && bare(c + 1, r - 1), 'ne')
              || pt(bare(c, r - 1) && bare(c - 1, r) && bare(c - 1, r - 1), 'nw')
              || pt(bare(c, r + 1) && bare(c + 1, r) && bare(c + 1, r + 1), 'se')
              || pt(bare(c, r + 1) && bare(c - 1, r) && bare(c - 1, r + 1), 'sw');
          }
          // ── 포장(tan/pier) 접경 = 삼각 스무딩이 없을 때만 어두운 테두리 엣지 셀 (불투명 덮어쓰기) ──
          if (!triDrew && em && mask > 0) {
            const tk = em.get(EDGE_SUFFIX[mask]);
            if (tk) slot.rt.batchDraw(tk, dx, dy);
          }
        }
      }
      // 181차 — 물에 잠긴 발치(젖은 돌·반쯤 잠긴 테트라포드). 절차 패스의 포말이 그 위에 부서진다
      this.drawArmorSprites(slot.rt, idx, c0, r0, 'sub');
      // ── 개별 타일 오버라이드(106차) — 베이스 위에 얹는다. 투명 부분(물이 파인 셀)은
      //   밑에 깔린 게임 물/지면이 그대로 비친다.
      if (this.tileTexMap.size > 0) {
        for (let r = r0; r < r1; r++) {
          for (let c = c0; c < c1; c++) {
            const ov = this.tileTexMap.get(r * cols + c);
            if (!ov) continue;
            const key = this.tileVariantKey(ov.tex, ov.rot ?? 0, ov.fx, ov.fy);
            if (this.scene.textures.exists(key)) slot.rt.batchDraw(key, (c - c0) * tr, (r - r0) * tr);
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
        // 오버라이드 타일은 절차 장식(파도·스페클·접경선)을 얹지 않는다 — 사용자가 고른 그림이 정답
        if (this.tileTexMap.has(r * cols + c)) continue;
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
          // ── 수심 버킷 계단 완화(106차) — 이웃 타일의 버킷이 다르면 그쪽 색 알갱이를 경계
          //   6px 안쪽에 확률적으로 뿌린다. 버킷은 타일 단위라 색이 통째로 바뀌어 바다에
          //   **큰 사각 패치**가 보였다(사용자 리포트). 입자는 물 타일과 같은 2px 그레인.
          {
            const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
            for (let d = 0; d < 4; d++) {
              const nc = c + nb[d][0], nr = r + nb[d][1];
              if (nc < 0 || nr < 0 || nc >= cols || nr >= this.cfg.rows || at(nc, nr) !== '~') continue;
              const ob = this.waterBucketAt(nc, nr).bucket;
              if (ob === bucket) continue;
              const [o0, o1] = DEPTH_RAMP[ob];
              const BAND = 6;
              for (let a = 0; a < tr; a += 2) {
                for (let b = 0; b < BAND; b += 2) {
                  const px = d === 1 ? tr - 2 - b : d === 3 ? b : a;
                  const py = d === 0 ? b : d === 2 ? tr - 2 - b : a;
                  const hh = hash2(seed ^ (0xd17e + d), c * 40 + px, r * 40 + py);
                  if (hh > (1 - b / BAND) * 0.55) continue;
                  g.fillStyle(hh > 0.5 ? o0 : o1, 1);
                  g.fillRect(lx + px, ly + py, 2, 2);
                }
              }
            }
          }
          // 180차 — 곡선 해안선 + 구조물이 물에 드리우는 그림자 (45° 호안 타일은 그림자도 빗변이 맡는다)
          this.drawShoreBlend(g, lx, ly, c, r, ch);
          // 181차 — 방파제 가장자리 물은 단면 패스가 포말을 부순다(턱 그림자 대신)
          const nearArmor = this.armorReady && this.bwCompNear(c, r) >= 0;
          if (nearArmor) this.drawBwSurface(g, lx, ly, c, r);
          else if (!waterTriAt.has(r * cols + c)) this.drawReliefShadow(g, lx, ly, c, r, ch);
          // 파도 대시 — 얕은~중간 수심에 성긴 밝은 물결
          if (bucket <= 3 && h1 > 0.90) {
            g.fillStyle(COL.wave, 0.55);
            g.fillRect(lx + 3 + Math.floor(h2 * 6), ly + 4 + Math.floor(h1 * 10), 9, 2);
          }
          // 해안 포말 — 뭍과 맞닿은 물 타일 가장자리. TTP 접경 타일이 깔린 모래 쪽은 건너뛴다
          // (그 셀이 이미 포말을 그리고 있어 2px 선을 더하면 모래 위에 흰 테두리가 얹힌다)
          //   사진 시트 셀(115차 — 섬 갯바위)과 맞닿은 변도 생략: 사진 속 해안선은 셀 안쪽에 있어
          //   타일 변을 따라 포말을 그으면 섬 둘레에 **격자 이음선**이 생긴다(실렌더 확인).
          const noRim = (nc: number, nr: number, edge: 'n' | 'e' | 's' | 'w'): boolean => {
            const t = at(nc, nr);
            return t !== '~' && !(this.ttpReady && t === 's') && !this.tileTexMap.has(nr * cols + nc)
              && !this.isletEdgeOpen(nc, nr, edge)
              && !(this.armorReady && nc >= 0 && nr >= 0 && nc < cols && nr < this.cfg.rows && this.bwComp[nr * cols + nc] >= 0);
          };
          const wq = waterTriAt.get(r * cols + c);
          if (wq) this.drawChamferRim(g, lx, ly, c, r, wq);
          g.fillStyle(COL.foam, 0.4);
          if (noRim(c, r - 1, 's') && wq !== 'ne' && wq !== 'nw') g.fillRect(lx, ly, tr, 2);
          if (noRim(c, r + 1, 'n') && wq !== 'se' && wq !== 'sw') g.fillRect(lx, ly + tr - 2, tr, 2);
          if (noRim(c - 1, r, 'e') && wq !== 'nw' && wq !== 'sw') g.fillRect(lx, ly, 2, tr);
          if (noRim(c + 1, r, 'w') && wq !== 'ne' && wq !== 'se') g.fillRect(lx + tr - 2, ly, 2, tr);
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

        // ── 181차 · 방파제 성분 — 단면(물가선·틈·돌길)만 칠하고 끝(피복 스프라이트가 위를 덮는다) ──
        if (this.armorReady && this.bwComp[r * cols + c] >= 0) {
          this.drawBwSurface(g, lx, ly, c, r);
          continue;
        }

        // ── 섬/암초 갯바위 — 소형 야생 육지(computeIslets — 조도 등)는 포장 대신 암반으로
        //    (위성 실사 정합: 밝은 암반 + 물가 젖은 바위 림 + 안쪽 초지 이끼).
        //    사각 도장 방지: 볼록 모서리(두 직교 + 대각이 물)는 45° 삼각 암반 — 밑에 깔린
        //    얕은 물(L1)이 깎인 부분에 드러난다 ──
        if ((ch === '.' && this.islet[r * cols + c]) || isRockTerrain(ch)) {
          const wN = at(c, r - 1) === '~', wS = at(c, r + 1) === '~';
          const wW = at(c - 1, r) === '~', wE = at(c + 1, r) === '~';
          const tri = this.isletCutAt(c, r);
          const RIM = 0x6e6355;
          // 183차 — 갯바위 'k'는 물가 젖은 톤(어둡고 푸르스름) · 절벽 'K'는 마른 화강암(밝은 점)
          if (ch === 'k' && this.waterDist[r * cols + c] <= 1) { g.fillStyle(0x24343e, 0.2); g.fillRect(lx, ly, tr, tr); }
          if (ch === 'K') this.drawCliffTop(g, lx, ly, c, r);
          if (this.surfAtlas.has('islet')) {
            // 182차 — 암반은 L1 아틀라스가 깔았다. 여기서는 물가 젖은 림 + 연속 이끼만
            if (tri) {
              // 빗변 포말(물 쪽으로 3px) → 젖은 림 — 직선 물가의 '물 타일 포말 + 림'과 같은 두 겹
              const ox = tri.includes('e') ? 3 : -3, oy = tri.includes('n') ? -3 : 3;
              g.lineStyle(2, COL.foam, 0.4);
              if (tri === 'ne' || tri === 'sw') g.lineBetween(lx + ox, ly + oy, lx + tr + ox, ly + tr + oy);
              else g.lineBetween(lx + tr + ox, ly + oy, lx + ox, ly + tr + oy);
              g.lineStyle(3, RIM, 1);
              if (tri === 'ne' || tri === 'sw') g.lineBetween(lx, ly, lx + tr, ly + tr);
              else g.lineBetween(lx + tr, ly, lx, ly + tr);
            } else {
              g.fillStyle(RIM, 1);
              if (wN) g.fillRect(lx, ly, tr, 3);
              if (wS) g.fillRect(lx, ly + tr - 3, tr, 3);
              if (wW) g.fillRect(lx, ly, 3, tr);
              if (wE) g.fillRect(lx + tr - 3, ly, 3, tr);
              if (ch === '.') this.drawIsletMoss(g, lx, ly, c, r);
            }
            continue;
          }
          // 아틀라스 없음(tr ≠ 32) — 구 절차 폴백
          const rockCol = h1 > 0.5 ? 0xb7ab9b : 0xaba08f;
          g.fillStyle(rockCol, 1);
          if (tri) {
            const pts = tri === 'ne' ? [[lx, ly], [lx + tr, ly + tr], [lx, ly + tr]]
              : tri === 'nw' ? [[lx + tr, ly], [lx + tr, ly + tr], [lx, ly + tr]]
              : tri === 'se' ? [[lx, ly], [lx + tr, ly], [lx, ly + tr]]
              : [[lx, ly], [lx + tr, ly], [lx + tr, ly + tr]];
            g.fillPoints(pts.map(([x, y]) => ({ x, y })), true);
            g.lineStyle(3, RIM, 1);
            if (tri === 'ne' || tri === 'sw') g.lineBetween(lx, ly, lx + tr, ly + tr);
            else g.lineBetween(lx + tr, ly, lx, ly + tr);
          } else {
            g.fillRect(lx, ly, tr, tr);
            g.fillStyle(RIM, 1);
            if (wN) g.fillRect(lx, ly, tr, 3);
            if (wS) g.fillRect(lx, ly + tr - 3, tr, 3);
            if (wW) g.fillRect(lx, ly, 3, tr);
            if (wE) g.fillRect(lx + tr - 3, ly, 3, tr);
            if (ch === '.') this.drawIsletMoss(g, lx, ly, c, r);
          }
          continue;
        }
        // ── 데크 'D'(183차) — 물 위 판자. 절차 패스 여기서 끝(단차·기둥은 drawLevelLayer) ──
        if (ch === 'D') { this.drawDeck(g, lx, ly, c, r); continue; }

        // ── 육상 기본색 (Kenney 베이스가 깔린 타일은 접경 처리만) ──
        if (based) {
          // 접경 알갱이 띠(172차) — 어느 재료가 어느 재료 위로 흘러나오는지는 core 표가 정한다.
          //  차도('r')는 벡터 밴드가 위에 깔리므로 제외한다.
          if (ch !== 'r') this.drawSeamGrains(g, lx, ly, c, r, ch);
          // 180차 — 해안선 · 방파제 단면 전이 · 단차(턱·그림자)
          this.drawShoreBlend(g, lx, ly, c, r, ch);
          this.drawBreakwaterSeam(g, lx, ly, c, r);
          this.drawReliefShadow(g, lx, ly, c, r, ch);
          // 안벽 계선주(112차) — 'b'뿐 아니라 항만 수역에 면한 '.'/'w' 안벽에도 4타일 간격
          if ((ch === '.' || ch === 'w' || ch === 'r' || ch === 'p') && (c + r) % 4 === 0 && this.bwClass[r * cols + c] !== 3) {
            const hb = (nc: number, nr: number): boolean =>
              nc >= 0 && nr >= 0 && nc < cols && nr < this.cfg.rows && at(nc, nr) === '~' && this.harbor[nr * cols + nc] === 1;
            const wN = hb(c, r - 1), wS = hb(c, r + 1), wW = hb(c - 1, r), wE = hb(c + 1, r);
            if (wN || wS || wW || wE) {
              const bx = lx + (wE ? tr - 8 : wW ? 3 : tr / 2 - 3);
              const by = ly + (wS ? tr - 8 : wN ? 3 : tr / 2 - 3);
              g.fillStyle(COL.bollard, 1); g.fillRect(bx, by, 5, 5);
              g.fillStyle(COL.bollardTop, 1); g.fillRect(bx + 1, by + 1, 3, 2);
            }
          }
          if (ch === 'f') {
            // ── 숲 캐노피 (172차) ── `'f'`를 색만 어둡게 두면 "짙은 잔디밭"으로 읽힌다.
            //  잎갈이 진 나무 덩어리를 결정적으로 흩뿌려 **수관(canopy)** 을 만든다.
            //  ⚠ 프롭(스프라이트)이 아니라 청크 베이킹에 굽는다 — 숲은 넓어서 오브젝트로 깔면
            //    수천 개가 된다. 걸어 들어갈 수 있는 지형이므로 충돌도 없다.
            const crowns = 2 + Math.floor(hash2(seed ^ 0x3f17, c, r) * 2);
            for (let i = 0; i < crowns; i++) {
              const hx = hash2(seed ^ (0x51a1 + i * 7), c, r);
              const hy = hash2(seed ^ (0x77c3 + i * 11), c, r);
              const rad = 5 + Math.floor(hx * 4);
              // ⚠ 타일 안쪽으로만 그리면 수관이 타일 변에서 잘려 **초록 사각형**이 된다.
              //   경계를 넘겨 그려야 숲 가장자리가 들쭉날쭉해진다(같은 청크 안에서만 넘친다).
              const px = lx - 4 + Math.floor(hx * (tr + 8));
              const py = ly - 4 + Math.floor(hy * (tr + 8));
              g.fillStyle(0x1f3a22, 0.55);                       // 수관 그림자
              g.fillCircle(px + 2, py + 3, rad);
              g.fillStyle(hy > 0.5 ? 0x2f5a30 : 0x376a36, 1);    // 잎
              g.fillCircle(px, py, rad);
              g.fillStyle(0x47804a, 0.85);                       // 해 드는 면
              g.fillCircle(px - 1, py - 2, Math.max(2, rad - 3));
            }
          } else if (ch === 'c') {
            // ── 농경지 이랑 (172차) ── 밭은 평면이 아니라 줄이 있다. 이랑 방향은 필지마다
            //  다르므로 타일 좌표 해시로 가로/세로를 고르고, 같은 필지 안에서는 같게 유지한다.
            const fx = Math.floor(c / 8), fy = Math.floor(r / 8);           // 필지 단위(8타일)
            const vert = hash2(seed ^ 0x2c6d, fx, fy) > 0.5;
            const crop = hash2(seed ^ 0x9d41, fx, fy);                       // 필지마다 작물 색
            const leaf = crop > 0.62 ? 0x6d8a3e : crop > 0.3 ? 0x7e9447 : 0x8a8f52;
            // 이랑 = 흙 고랑(어둡게) + 작물 줄(초록). 위상은 **전역 좌표**라 타일 경계에서 끊기지 않는다.
            for (let k = 0; k < tr; k += 4) {
              const gy = (vert ? c * tr + lx : r * tr + ly) * 0;             // (위상 고정용 — 아래 abs 좌표 사용)
              void gy;
              const abs = vert ? (c * tr + k) : (r * tr + k);
              if (abs % 8 < 4) { g.fillStyle(0x9a8558, 0.45); } else { g.fillStyle(leaf, 0.55); }
              if (vert) g.fillRect(lx + k, ly, 4, tr);
              else g.fillRect(lx, ly + k, tr, 4);
            }
          } else if (ch === 's') {
            // 젖은 모래 띠 — ⚠ TTP 접경 셀이 깔리는 물가에는 **그리지 않는다**(106차). 접경 셀이
            //   이미 젖은 모래+포말을 갖고 있어, 여기에 6px 띠를 더하면 물가에 자로 그은
            //   **연석 같은 밝은 세로줄**이 생긴다(사용자 리포트 — 실측색 (202,183,126) 스트립).
            if (!this.ttpReady) {
              g.fillStyle(COL.sandWet, 0.85);
              if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
              if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
              if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
              if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
            }
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
          // 젖은 모래 띠 (물과 맞닿은 쪽) — TTP 접경 셀이 있으면 생략(위 based 경로와 같은 이유)
          if (!this.ttpReady) {
            g.fillStyle(COL.sandWet, 0.9);
            if (at(c, r - 1) === '~') g.fillRect(lx, ly, tr, 6);
            if (at(c, r + 1) === '~') g.fillRect(lx, ly + tr - 6, tr, 6);
            if (at(c - 1, r) === '~') g.fillRect(lx, ly, 6, tr);
            if (at(c + 1, r) === '~') g.fillRect(lx + tr - 6, ly, 6, tr);
          }
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

        // ── 지형 접경선 — 181차 폐기 ──
        //  구 구현은 서로 다른 뭍 지형이 맞닿는 변마다 반투명 검은 2px 선을 그었다. 경계가 타일 변을
        //  따라가므로 결국 **격자 윤곽**이 되어 "안쪽 지형에 타일 경계선이 보인다"(사용자 리포트)의 원인이었다.
        //  재질 차이는 색·질감 차이만으로 읽히고, 45° 삼각형·알갱이 띠가 계단을 녹인다.

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

    // 183차 — 고도 층 단차(옆면·그림자)·계단·데크 기둥 — 모든 지형 그림 위에 얹는다
    this.drawLevelLayer(g, c0, r0, c1, r1);

    // 차도 마킹 (벡터) — 타일 위에 얹는다
    this.drawRoadMarkings(g, idx, c0, r0);

    try {
      // 씬 전환 직전의 늦은 베이크 콜백이 이미 반환된 RenderTexture를 잡고 있을 수 있다.
      if (!this.disposed && this.isLiveSlot(idx, slot)) {
        slot.rt.draw(g, 0, 0);
        // 181차 — 3단째: 절차 패스(틈·돌길·포말) **위에** 피복 스프라이트를 얹는다
        if (this.armorReady && this.chunkArmor[idx]) {
          slot.rt.beginDraw();
          this.drawArmorSprites(slot.rt, idx, c0, r0, 'top');
          slot.rt.endDraw();
        }
      }
    } catch (e) {
      // 해당 청크만 비워 두고 프레임 루프 전체는 살린다. 다음 씬 진입을 막는 전역 예외가 되면 안 된다.
      console.warn('[SeamlessChunks] 청크 베이크 건너뜀', idx, e);
    } finally {
      g.destroy();
    }
    slot.baked = true;
  }

  // ═══════════════════════════════════════════════════

  /** 상주/풀 통계 (검증·dev 표기용) */
  stats(): { resident: number; pooled: number; created: number; pendingBakes: number; warm: number } {
    return {
      resident: this.resident.size,
      pooled: this.rtPool.length,
      created: this.rtCreated,
      pendingBakes: this.bakeQueue.length,
      warm: this.warm.size,
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
    if (this.disposed) return;
    this.disposed = true;
    // 한 슬롯 정리가 실패해도 나머지(RT 풀·텍스처)는 반드시 정리 — 부분 실패가 다음 씬을 오염시키지 않게
    for (const [idx, slot] of [...this.resident]) {
      try { this.unloadChunk(idx, slot); } catch (e) { console.warn('[SeamlessChunks] unload 실패', e); }
    }
    this.resident.clear();
    for (const slot of this.warm.values()) {
      try { this.clearSlotContents(slot); } catch (e) { console.warn('[SeamlessChunks] 예열 정리 실패', e); }
      this.rtPool.push(slot.rt);
    }
    this.warm.clear();
    this.loadQueue = [];
    for (const rt of this.rtPool) rt.destroy();
    this.rtPool = [];
    this.bakeQueue = [];
    if (this.walls.children) this.walls.destroy(true);
  }
}
