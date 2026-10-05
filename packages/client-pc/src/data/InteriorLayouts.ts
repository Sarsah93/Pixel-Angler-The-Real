/**
 * @file InteriorLayouts.ts
 * @description 건물 실내 배치 (215차 — 실내 공간 1단계: 가게 · 보건소 · 위판장).
 *
 * 214차에 확정한 실내 공간 설계의 1단계. 집(`HomeInteriorScene`)과 달리 **배치가 데이터**다 —
 * 틀(template) 다섯 가지 × 가게 종류별 변형(진열 상품 색 · 벽 장식)으로 모든 가게가 같은 규칙을 쓴다.
 *  - store  : 편의점 · 식자재마트 · 생활용품점 · 약국 — 벽 진열대 · 냉장 쇼케이스 · 가운데 곤돌라 · 계산대(점원 뒤 담배·상품 벽)
 *  - food   : 음식점 · 카페 · 주점 — 안쪽 주방 카운터(주문) · 탁자와 의자(앉아서 먹으면 식사 보너스)
 *  - tackle : 직판장(낚시점) — 낚싯대 거치대 · 루어 벽 · 미끼 냉장고 · 진열 매대 · 계산대
 *  - clinic : 보건소 — 접수대 · 대기 의자 · 진료 침대 · 약장
 *  - auction: 위판장(수협 활어센터 등) — 위판 창구 · 경매대(경매사) · 고기 상자 줄 · 활어 수조 · 얼음
 *
 * 사용자 참고 캡처(옷 가게 · 음식점 탑다운)의 **밀도**를 따랐다 — 벽을 따라 진열, 가운데 섬 진열대,
 * 카운터 뒤 점원, 탁자 사이 통로. 그대로 베끼지 않는다(214차 사용자 지시).
 *
 * 좌표는 칸(tile) 단위 · 원점은 방 왼쪽 위. 위 `FLOOR_TOP` 줄은 벽이다(발이 들어가지 않는다).
 * 방 크기는 집과 같은 화면 틀(576×480 안)에 맞춘다 — 필드 HUD 예약 영역을 피하는 크기(198차 규칙).
 */

import type { CharDir, CharRole } from '@tra/core';
import type { BuildingKind } from './ShopCatalog.js';

/** 실내 틀 */
export type InteriorTemplate = 'store' | 'food' | 'tackle' | 'clinic' | 'auction';

/** [F]로 하는 일 — 실제 동작은 필드 씬이 맡는다(거래 · 위판 · 진료 흐름을 그대로 쓴다) */
export type InteriorAction = 'trade' | 'consign' | 'clinic' | 'sit' | 'schedule';

/** 가구 · 집기 그림 종류 (`ui/InteriorArt.ts`) */
export type FixtureArt =
  | 'wall_shelf' | 'cooler' | 'gondola' | 'counter' | 'back_shelf' | 'stock_boxes'
  | 'table' | 'chair' | 'fish_tank' | 'plant' | 'barrel' | 'book_shelf'
  | 'rod_rack' | 'lure_wall' | 'bait_fridge' | 'display_table' | 'ice_chest'
  | 'reception' | 'partition' | 'bench' | 'exam_bed' | 'med_cabinet' | 'scale' | 'water_cooler'
  | 'crate_row' | 'podium' | 'ice_pile' | 'hand_cart';

export interface FixtureDef {
  id: string;
  art: FixtureArt;
  tx: number;
  ty: number;
  fw: number;
  fh: number;
  /** 발이 들어가지 않는다(기본 true) */
  solid?: boolean;
  action?: InteriorAction;
  /** 앉는 자리 — 방향(얼굴이 향하는 쪽) */
  seatDir?: CharDir;
}

/** 실내의 사람(점원 · 간호사 · 경매사) — 발 위치(칸 단위 실수) */
export interface InteriorPerson {
  tx: number;
  ty: number;
  dir: CharDir;
  role: CharRole;
  /** 들어오면 머리 위에 한 번 하는 말 */
  greetKo?: string;
}

export type FloorStyle = 'vinyl' | 'wood' | 'dark_wood' | 'tackle_tile' | 'clinic' | 'concrete';
export type WallStyle = 'shop' | 'warm' | 'pub' | 'tackle' | 'clinic' | 'hall';

export interface InteriorLayout {
  /** 텍스처 캐시 키에 들어간다(틀 + 변형) */
  key: string;
  template: InteriorTemplate;
  /** 칸 한 변(px) */
  it: number;
  cols: number;
  rows: number;
  floor: FloorStyle;
  wall: WallStyle;
  /** 벽 위 띠 색(가게 간판 색) */
  accent: number;
  /** 진열 상품 색(선반 위 물건) */
  goods: number[];
  /** 벽에 그리는 장식(배경에 구워진다) */
  wallDecor: ('kitchen' | 'espresso' | 'bottles' | 'menu' | 'poster' | 'clock' | 'window' | 'shutter' | 'notice')[];
  fixtures: FixtureDef[];
  people: InteriorPerson[];
  /** 현관 매트 — 아래 벽에 붙는다 */
  mat: { tx: number; fw: number };
}

/** 위 벽 줄 수(발이 들어가지 않는다) */
export const FLOOR_TOP = 2;

/** 수협 위판장으로 볼 직판장 이름 (나머지 직판장은 낚시점 틀) */
const AUCTION_NAME = /수협|위판|활어\s*센터|어판장|공판장/;

/** 건물 종류 + 상호 → 실내 틀 */
export function interiorTemplateOf(kind: BuildingKind, name: string): InteriorTemplate {
  if (kind === 'market') return AUCTION_NAME.test(name) ? 'auction' : 'tackle';
  if (kind === 'restaurant' || kind === 'cafe' || kind === 'pub') return 'food';
  return 'store';
}

// ── 변형 팔레트 ─────────────────────────────────────

const STORE_VARIANT: Record<string, { accent: number; goods: number[]; cooler: boolean; greet: string }> = {
  convenience: { accent: 0x3a8a5a, goods: [0xd8483a, 0xf2c14e, 0x3a7fd0, 0x4fb06a, 0xe8e2d0, 0xb05ab0], cooler: true, greet: '어서 오세요.' },
  mart: { accent: 0xd0702a, goods: [0x7ab84a, 0xe0b040, 0xc8503a, 0xe8d8b0, 0x8a5a3a, 0x4a9ad0], cooler: true, greet: '어서 오세요. 오늘 생선 좋아요.' },
  daily: { accent: 0xc83a4a, goods: [0x5a8ac8, 0xe8a030, 0x6ab08a, 0xd8d0c0, 0x9a6ac0, 0x3a4a5a], cooler: false, greet: '어서 오세요. 천천히 보세요.' },
  pharmacy: { accent: 0x2a9a8a, goods: [0xf0f0e8, 0x58b0d8, 0xe86a6a, 0x9ad070, 0xf0d070, 0xc8c8d8], cooler: false, greet: '어디가 불편하세요?' },
};

const FOOD_VARIANT: Record<string, { floor: FloorStyle; wall: WallStyle; accent: number; decor: InteriorLayout['wallDecor']; role: CharRole; greet: string }> = {
  restaurant: { floor: 'wood', wall: 'warm', accent: 0xb0402a, decor: ['kitchen', 'menu', 'window'], role: 'cook', greet: '어서 오세요. 편한 자리에 앉으세요.' },
  cafe: { floor: 'wood', wall: 'warm', accent: 0x6a4a2a, decor: ['espresso', 'menu', 'window'], role: 'office', greet: '어서 오세요. 주문은 여기서 도와드릴게요.' },
  pub: { floor: 'dark_wood', wall: 'pub', accent: 0x8a2a3a, decor: ['bottles', 'menu', 'clock'], role: 'cook', greet: '어서 와요. 한잔하고 가요.' },
};

// ── 틀 ─────────────────────────────────────────────

/**
 * 가게(편의점 · 마트 · 생활용품점 · 약국) — 12×10칸 · 48px.
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓▓▓   벽
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  .SSSSS.CCCC.   S 벽 진열대 · C 냉장 쇼케이스
 *  .........BBB   B 상품 벽(점원 뒤)
 *  ........K@..   K 계산대 · @ 점원
 *  .GGGG...K...   G 곤돌라
 *  ........K...
 *  .GGGG....XXX   X 재고 상자
 *  ............
 *  .....mm.....   m 현관 매트
 * ```
 */
function storeLayout(kind: BuildingKind): InteriorLayout {
  const v = STORE_VARIANT[kind] ?? STORE_VARIANT.convenience!;
  return {
    key: `store_${kind}`, template: 'store', it: 48, cols: 12, rows: 10,
    floor: 'vinyl', wall: 'shop', accent: v.accent, goods: v.goods,
    wallDecor: kind === 'pharmacy' ? ['poster', 'clock'] : ['poster', 'clock'],
    fixtures: [
      { id: 'shelf_a', art: 'wall_shelf', tx: 1, ty: 2, fw: 5, fh: 1 },
      { id: 'shelf_b', art: v.cooler ? 'cooler' : 'wall_shelf', tx: 7, ty: 2, fw: 4, fh: 1 },
      { id: 'back', art: 'back_shelf', tx: 9, ty: 3, fw: 3, fh: 1 },
      { id: 'counter', art: 'counter', tx: 8, ty: 4, fw: 1, fh: 3, action: 'trade' },
      { id: 'gondola_a', art: 'gondola', tx: 1, ty: 5, fw: 4, fh: 1 },
      { id: 'gondola_b', art: 'gondola', tx: 1, ty: 7, fw: 4, fh: 1 },
      { id: 'stock', art: 'stock_boxes', tx: 9, ty: 7, fw: 3, fh: 1 },
    ],
    people: [{ tx: 10.2, ty: 5.7, dir: 'left', role: kind === 'pharmacy' ? 'expert' : 'office', greetKo: v.greet }],
    mat: { tx: 5, fw: 2 },
  };
}

/**
 * 먹는 곳(음식점 · 카페 · 주점) — 12×10칸 · 48px.
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓▓▓   벽(주방 · 메뉴판)
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  TTTT..K@....   T 수조(음식점) / 화분 · 책장(카페) / 술통(주점) · @ 점원
 *  ......KKKKKK   K 주문 카운터
 *  .tt.........   t 탁자 · h 의자(위를 본다)
 *  .hh.tt......
 *  ....hh..tt..
 *  .tt.....hh..
 *  .hh.........
 *  .....mm.....
 * ```
 */
function foodLayout(kind: BuildingKind): InteriorLayout {
  const v = FOOD_VARIANT[kind] ?? FOOD_VARIANT.restaurant!;
  const table = (id: string, tx: number, ty: number): FixtureDef[] => [
    { id: `${id}`, art: 'table', tx, ty, fw: 2, fh: 1 },
    { id: `${id}_c1`, art: 'chair', tx, ty: ty + 1, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
    { id: `${id}_c2`, art: 'chair', tx: tx + 1, ty: ty + 1, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
  ];
  const corner: FixtureDef[] = kind === 'cafe'
    ? [
      { id: 'plant_a', art: 'plant', tx: 0, ty: 2, fw: 1, fh: 1 },
      { id: 'books', art: 'book_shelf', tx: 1, ty: 2, fw: 3, fh: 1 },
    ]
    : kind === 'pub'
      ? [
        { id: 'barrel_a', art: 'barrel', tx: 0, ty: 2, fw: 1, fh: 1 },
        { id: 'barrel_b', art: 'barrel', tx: 1, ty: 2, fw: 1, fh: 1 },
        { id: 'barrel_c', art: 'barrel', tx: 3, ty: 2, fw: 1, fh: 1 },
      ]
      : [{ id: 'tank', art: 'fish_tank', tx: 0, ty: 2, fw: 4, fh: 1 }];
  return {
    key: `food_${kind}`, template: 'food', it: 48, cols: 12, rows: 10,
    floor: v.floor, wall: v.wall, accent: v.accent, goods: [0xe8c070, 0xc85a3a, 0x8ac06a, 0xf0e8d8],
    wallDecor: v.decor,
    fixtures: [
      ...corner,
      { id: 'counter_side', art: 'counter', tx: 6, ty: 2, fw: 1, fh: 1 },
      { id: 'counter', art: 'counter', tx: 6, ty: 3, fw: 6, fh: 1, action: 'trade' },
      ...table('t1', 1, 4),
      ...table('t2', 4, 5),
      ...table('t3', 8, 6),
      ...table('t4', 1, 7),
    ],
    people: [{ tx: 8.5, ty: 2.82, dir: 'down', role: v.role, greetKo: v.greet }],
    mat: { tx: 5, fw: 2 },
  };
}

/**
 * 직판장(낚시점) — 12×10칸 · 48px.
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  .RRRR.LLL.FF   R 낚싯대 거치대 · L 루어 벽 · F 미끼 냉장고
 *  ............
 *  .........BBB   B 릴 진열장(점원 뒤)
 *  ..DDD...K...   D 진열 매대 · K 계산대
 *  ........K@..
 *  ..DDD.I.K...   I 아이스박스
 *  .........XXX
 *  .....mm.....
 * ```
 */
function tackleLayout(): InteriorLayout {
  return {
    key: 'tackle', template: 'tackle', it: 48, cols: 12, rows: 10,
    floor: 'tackle_tile', wall: 'tackle', accent: 0x2a6aa8,
    goods: [0xe85a3a, 0xf0c040, 0x3ab0d0, 0x8ad04a, 0xd060b0, 0xf0f0f0, 0xff8a3a],
    wallDecor: ['poster', 'clock'],
    fixtures: [
      { id: 'rods', art: 'rod_rack', tx: 1, ty: 2, fw: 4, fh: 1 },
      { id: 'lures', art: 'lure_wall', tx: 6, ty: 2, fw: 3, fh: 1 },
      { id: 'bait', art: 'bait_fridge', tx: 10, ty: 2, fw: 2, fh: 1 },
      { id: 'back', art: 'back_shelf', tx: 9, ty: 4, fw: 3, fh: 1 },
      { id: 'counter', art: 'counter', tx: 8, ty: 5, fw: 1, fh: 3, action: 'trade' },
      { id: 'table_a', art: 'display_table', tx: 2, ty: 5, fw: 3, fh: 1 },
      { id: 'table_b', art: 'display_table', tx: 2, ty: 7, fw: 3, fh: 1 },
      { id: 'ice', art: 'ice_chest', tx: 6, ty: 7, fw: 1, fh: 1 },
      { id: 'stock', art: 'stock_boxes', tx: 9, ty: 8, fw: 3, fh: 1 },
    ],
    people: [{ tx: 10.2, ty: 6.7, dir: 'left', role: 'vendor', greetKo: '어서 와요. 찾는 채비 있어요?' }],
    mat: { tx: 5, fw: 2 },
  };
}

/**
 * 보건소 — 12×10칸 · 48px.
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  ▓▓▓▓▓▓▓▓▓▓▓▓
 *  MMMMP...EEE.   M 약장 · P 칸막이 · E 진료 침대
 *  ..@.P.......   @ 간호사
 *  RRRRR.......   R 접수대
 *  ...........S   S 체중계
 *  BBB.........   B 대기 의자
 *  ............
 *  BBB........W   W 정수기
 *  .....mm.....
 * ```
 */
function clinicLayout(): InteriorLayout {
  return {
    key: 'clinic', template: 'clinic', it: 48, cols: 12, rows: 10,
    floor: 'clinic', wall: 'clinic', accent: 0x3a9a72, goods: [0xf0f0e8, 0x58b0d8, 0xe86a6a, 0x9ad070],
    wallDecor: ['poster', 'clock', 'window'],
    fixtures: [
      { id: 'meds', art: 'med_cabinet', tx: 0, ty: 2, fw: 4, fh: 1 },
      { id: 'part', art: 'partition', tx: 4, ty: 2, fw: 1, fh: 2 },
      { id: 'desk', art: 'reception', tx: 0, ty: 4, fw: 5, fh: 1, action: 'clinic' },
      { id: 'bed', art: 'exam_bed', tx: 8, ty: 2, fw: 3, fh: 1 },
      { id: 'scale', art: 'scale', tx: 11, ty: 5, fw: 1, fh: 1 },
      { id: 'bench_a', art: 'bench', tx: 0, ty: 6, fw: 3, fh: 1, action: 'sit', seatDir: 'down' },
      { id: 'bench_b', art: 'bench', tx: 0, ty: 8, fw: 3, fh: 1, action: 'sit', seatDir: 'down' },
      { id: 'water', art: 'water_cooler', tx: 11, ty: 8, fw: 1, fh: 1 },
    ],
    people: [{ tx: 2.2, ty: 3.78, dir: 'down', role: 'official', greetKo: '접수 도와드릴게요.' }],
    mat: { tx: 5, fw: 2 },
  };
}

/**
 * 위판장(수협 활어센터) — 14×12칸 · 40px(넓은 홀).
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓
 *  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓
 *  ....P..AAA.TTT   P 칸막이 · A 경매대(경매사) · T 활어 수조
 *  .@..P..AAA....   @ 창구 직원
 *  WWWWP.........   W 위판 창구
 *  ..............
 *  .....CCCC.CCC.   C 고기 상자 줄
 *  ...s..........   s 저울
 *  .....CCCC.CCC.
 *  II............   I 얼음 더미
 *  ............h.   h 손수레
 *  ......mm......
 * ```
 */
function auctionLayout(): InteriorLayout {
  return {
    key: 'auction', template: 'auction', it: 40, cols: 14, rows: 12,
    floor: 'concrete', wall: 'hall', accent: 0x2a6ab0, goods: [0x3a7ad0, 0xd04a3a, 0x9aa8b4, 0xe8eef2],
    wallDecor: ['shutter', 'notice', 'clock'],
    fixtures: [
      { id: 'part', art: 'partition', tx: 4, ty: 2, fw: 1, fh: 3 },
      { id: 'window', art: 'reception', tx: 0, ty: 4, fw: 4, fh: 1, action: 'consign' },
      { id: 'podium', art: 'podium', tx: 7, ty: 2, fw: 3, fh: 2, action: 'schedule' },
      { id: 'tank', art: 'fish_tank', tx: 11, ty: 2, fw: 3, fh: 1 },
      { id: 'crates_a', art: 'crate_row', tx: 5, ty: 6, fw: 4, fh: 1 },
      { id: 'crates_b', art: 'crate_row', tx: 10, ty: 6, fw: 3, fh: 1 },
      { id: 'crates_c', art: 'crate_row', tx: 5, ty: 8, fw: 4, fh: 1 },
      { id: 'crates_d', art: 'crate_row', tx: 10, ty: 8, fw: 3, fh: 1 },
      { id: 'scale', art: 'scale', tx: 3, ty: 7, fw: 1, fh: 1 },
      { id: 'ice', art: 'ice_pile', tx: 0, ty: 9, fw: 2, fh: 1 },
      { id: 'cart', art: 'hand_cart', tx: 12, ty: 10, fw: 1, fh: 1 },
    ],
    people: [
      { tx: 1.8, ty: 3.78, dir: 'down', role: 'office', greetKo: '위판이세요? 창구로 오세요.' },
      { tx: 8.5, ty: 2.7, dir: 'down', role: 'captain' },
    ],
    mat: { tx: 6, fw: 2 },
  };
}

/** 건물 종류 + 상호 → 실내 배치. 보건소는 `kind = null` */
export function interiorLayoutOf(kind: BuildingKind | null, name: string): InteriorLayout {
  if (kind === null) return clinicLayout();
  const t = interiorTemplateOf(kind, name);
  if (t === 'auction') return auctionLayout();
  if (t === 'tackle') return tackleLayout();
  if (t === 'food') return foodLayout(kind);
  return storeLayout(kind);
}

/** 개발 · 검증용 — 다섯 틀의 대표 배치 */
export const SAMPLE_LAYOUTS = (): InteriorLayout[] => [
  storeLayout('convenience'), storeLayout('mart'), storeLayout('daily'), storeLayout('pharmacy'),
  foodLayout('restaurant'), foodLayout('cafe'), foodLayout('pub'),
  tackleLayout(), clinicLayout(), auctionLayout(),
];
