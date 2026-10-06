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
 *  - home   : 216차(2단계) — 인물의 집 · 공방 · 민박 방. 집 주인이 안에 있고, 다가가 [F]면 같은 대화(R12)
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
export type InteriorTemplate = 'store' | 'food' | 'tackle' | 'clinic' | 'auction' | 'home';

/** [F]로 하는 일 — 실제 동작은 필드 씬이 맡는다(거래 · 위판 · 진료 흐름을 그대로 쓴다) */
export type InteriorAction = 'trade' | 'consign' | 'clinic' | 'sit' | 'schedule';

/** 가구 · 집기 그림 종류 (`ui/InteriorArt.ts`) */
export type FixtureArt =
  | 'wall_shelf' | 'cooler' | 'gondola' | 'counter' | 'back_shelf' | 'stock_boxes'
  | 'table' | 'chair' | 'fish_tank' | 'plant' | 'barrel' | 'book_shelf'
  | 'rod_rack' | 'lure_wall' | 'bait_fridge' | 'display_table' | 'ice_chest'
  | 'reception' | 'partition' | 'bench' | 'exam_bed' | 'med_cabinet' | 'scale' | 'water_cooler'
  | 'crate_row' | 'podium' | 'ice_pile' | 'hand_cart'
  // 216차 — 집 · 공방 · 민박
  | 'wardrobe' | 'tv' | 'sink' | 'fridge' | 'low_table' | 'cushion' | 'futon' | 'futon_open'
  | 'bed' | 'desk' | 'sofa' | 'rug' | 'suitcase' | 'bamboo' | 'tool_wall' | 'workbench';

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
  /**
   * 216차 — 이야기 인물(집 주인). 있으면 얼굴은 필드와 같은 `characterOf(npcId)`이고,
   * 다가가 [F]면 「말 걸기」 → 평소와 같은 대화창(R12 — 일과는 만나는 곳만 바꾼다).
   */
  npcId?: string;
}

export type FloorStyle = 'vinyl' | 'wood' | 'dark_wood' | 'tackle_tile' | 'clinic' | 'concrete' | 'ondol';
export type WallStyle = 'shop' | 'warm' | 'pub' | 'tackle' | 'clinic' | 'hall' | 'home';

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
  wallDecor: ('kitchen' | 'espresso' | 'bottles' | 'menu' | 'poster' | 'clock' | 'window' | 'shutter' | 'notice'
    | 'calendar' | 'photo' | 'fish_print')[];
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

// ── 216차 — 인물의 집 (실내 공간 2단계) ─────────────────

/**
 * 집 한 칸 방 — 10×8칸 · 48px(공방은 12×9). 집 주인 자리(`people[0]`)가 곧 일과의 `home` 자리다.
 * 사람마다 사는 모양이 다르다 — 같은 틀을 돌려쓰지 않고 인물마다 한 장씩 그린다.
 */
function homeBase(key: string, cols: number, rows: number, floor: FloorStyle, wall: WallStyle, accent: number,
  wallDecor: InteriorLayout['wallDecor'], fixtures: FixtureDef[], owner: InteriorPerson): InteriorLayout {
  return {
    key: `home_${key}`, template: 'home', it: 48, cols, rows, floor, wall, accent,
    goods: [0xc84a3a, 0x3a6ea5, 0xe8c070, 0x6aa86a, 0xe8e0d0],
    wallDecor, fixtures, people: [owner], mat: { tx: Math.floor(cols / 2) - 1, fw: 2 },
  };
}

/**
 * 정옥선의 집 — 장판 방 하나에 부엌 한쪽. 자개장 · 텔레비전 · 밥상 · 개어 둔 이불.
 *
 * ```
 *  ▓▓▓▓▓▓▓▓▓▓
 *  ▓▓▓▓▓▓▓▓▓▓   (창 · 달력 · 사진)
 *  WWW...TTSS   W 자개장 · T 텔레비전 · S 개수대
 *  ..........
 *  FF..BB....   F 개어 둔 이불 · B 밥상
 *  ....cc...p   c 방석(앉기) · p 화분
 *  ..........
 *  ....mm....
 * ```
 */
function grandmaHome(npcId: string): InteriorLayout {
  return homeBase('okseon', 10, 8, 'ondol', 'home', 0x8a5a3a, ['window', 'photo', 'calendar'], [
    { id: 'wardrobe', art: 'wardrobe', tx: 0, ty: 2, fw: 3, fh: 1 },
    { id: 'tv', art: 'tv', tx: 6, ty: 2, fw: 2, fh: 1 },
    { id: 'sink', art: 'sink', tx: 8, ty: 2, fw: 2, fh: 1 },
    { id: 'futon', art: 'futon', tx: 0, ty: 4, fw: 2, fh: 1 },
    { id: 'table', art: 'low_table', tx: 4, ty: 4, fw: 2, fh: 1 },
    { id: 'cushion', art: 'cushion', tx: 4, ty: 5, fw: 2, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'plant', art: 'plant', tx: 9, ty: 5, fw: 1, fh: 1 },
  ], { tx: 7.0, ty: 4.7, dir: 'down', role: 'vendor', npcId });
}

/**
 * 도현수의 집 — 낚시꾼 원룸. 침대 · 책상(모니터) · 벽 낚싯대 · 쿨러 · 작은 개수대.
 *
 * ```
 *  BB.DD.RRRS   B 침대 · D 책상 · R 낚싯대 거치 · S 개수대
 *  BB.h......   h 의자(앉기)
 *  ..........
 *  ...rrr..I.   r 깔개 · I 쿨러
 *  ..........
 *  ....mm....
 * ```
 */
function anglerHome(npcId: string): InteriorLayout {
  return homeBase('hyeonsu', 10, 8, 'wood', 'home', 0x2a5a8a, ['calendar', 'clock'], [
    { id: 'bed', art: 'bed', tx: 0, ty: 2, fw: 2, fh: 2 },
    { id: 'desk', art: 'desk', tx: 3, ty: 2, fw: 2, fh: 1 },
    { id: 'chair', art: 'chair', tx: 3, ty: 3, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'rods', art: 'rod_rack', tx: 6, ty: 2, fw: 3, fh: 1 },
    { id: 'sink', art: 'sink', tx: 9, ty: 2, fw: 1, fh: 1 },
    { id: 'rug', art: 'rug', tx: 3, ty: 5, fw: 3, fh: 1, solid: false },
    { id: 'cooler', art: 'ice_chest', tx: 8, ty: 5, fw: 1, fh: 1 },
  ], { tx: 6.6, ty: 4.4, dir: 'down', role: 'angler', npcId });
}

/**
 * 강두철의 집 — 거실. 벽 텔레비전 · 거실 탁자 · 소파(앉기) · 장식장 · 어탁 · 식탁.
 *
 * ```
 *  ..TTT.KK.p   T 텔레비전 · K 장식장 · p 화분
 *  ..........
 *  ..LLL.....   L 거실 탁자
 *  ..SSS..tt.   S 소파(앉기) · t 식탁
 *  .......hh.   h 의자(앉기)
 *  ....mm....
 * ```
 */
function elderHome(npcId: string): InteriorLayout {
  return homeBase('kang_ducheol', 10, 8, 'wood', 'home', 0x5a3a2a, ['fish_print', 'clock'], [
    { id: 'tv', art: 'tv', tx: 2, ty: 2, fw: 3, fh: 1 },
    { id: 'case', art: 'book_shelf', tx: 6, ty: 2, fw: 2, fh: 1 },
    { id: 'plant', art: 'plant', tx: 9, ty: 2, fw: 1, fh: 1 },
    { id: 'ltable', art: 'low_table', tx: 2, ty: 4, fw: 3, fh: 1 },
    { id: 'sofa', art: 'sofa', tx: 2, ty: 5, fw: 3, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'dining', art: 'table', tx: 7, ty: 5, fw: 2, fh: 1 },
    { id: 'dining_c1', art: 'chair', tx: 7, ty: 6, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'dining_c2', art: 'chair', tx: 8, ty: 6, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
  ], { tx: 6.4, ty: 3.9, dir: 'down', role: 'angler', npcId });
}

/**
 * 탁씨 죽간 공방 — 12×9. 기대 세운 대나무 · 다 깎은 대 · 연장 벽 · 작업대 · 재료 상자.
 *
 * ```
 *  BBB.RRR.TTT.   B 대나무 묶음 · R 다 깎은 대 · T 연장 벽
 *  ............
 *  ...WWWW.....   W 작업대
 *  ....h.......   h 걸상(앉기)
 *  .........XXX   X 재료 상자
 *  ............
 *  .....mm.....
 * ```
 */
function workshopHome(npcId: string): InteriorLayout {
  return homeBase('tak_mansu', 12, 9, 'wood', 'tackle', 0x6a4a1a, ['window', 'clock'], [
    { id: 'bamboo', art: 'bamboo', tx: 0, ty: 2, fw: 3, fh: 1 },
    { id: 'rods', art: 'rod_rack', tx: 4, ty: 2, fw: 3, fh: 1 },
    { id: 'tools', art: 'tool_wall', tx: 8, ty: 2, fw: 3, fh: 1 },
    { id: 'bench', art: 'workbench', tx: 3, ty: 4, fw: 4, fh: 1 },
    { id: 'stool', art: 'chair', tx: 4, ty: 5, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'stock', art: 'stock_boxes', tx: 9, ty: 6, fw: 3, fh: 1 },
  ], { tx: 8.2, ty: 4.7, dir: 'left', role: 'artisan', npcId });
}

/**
 * 공방 살림채 — 탁새벽의 방. 침대 · 책상 · 책장 · 옷장 · 깔개.
 *
 * ```
 *  BB.DD.KKWW   B 침대 · D 책상 · K 책장 · W 옷장
 *  BB.h......   h 의자(앉기)
 *  ..........
 *  ...rrr...p   r 깔개 · p 화분
 *  ..........
 *  ....mm....
 * ```
 */
function kidRoom(npcId: string): InteriorLayout {
  return homeBase('tak_saebyeok', 10, 8, 'ondol', 'home', 0xc86a8a, ['window', 'calendar'], [
    { id: 'bed', art: 'bed', tx: 0, ty: 2, fw: 2, fh: 2 },
    { id: 'desk', art: 'desk', tx: 3, ty: 2, fw: 2, fh: 1 },
    { id: 'chair', art: 'chair', tx: 3, ty: 3, fw: 1, fh: 1, action: 'sit', seatDir: 'up' },
    { id: 'books', art: 'book_shelf', tx: 6, ty: 2, fw: 2, fh: 1 },
    { id: 'wardrobe', art: 'wardrobe', tx: 8, ty: 2, fw: 2, fh: 1 },
    { id: 'rug', art: 'rug', tx: 3, ty: 5, fw: 3, fh: 1, solid: false },
    { id: 'plant', art: 'plant', tx: 9, ty: 5, fw: 1, fh: 1 },
  ], { tx: 6.8, ty: 4.4, dir: 'down', role: 'student', npcId });
}

/**
 * 배누리가 묵는 민박 — 장판 손님방. 펴 둔 이불 · 작은 상 · 텔레비전 · 여행 가방 · 작은 냉장고.
 *
 * ```
 *  WW....TTsf   W 이불장 · T 텔레비전 · s 여행 가방 · f 냉장고
 *  ..........
 *  FF..LL....   F 펴 둔 이불 · L 작은 상
 *  FF..cc....   c 방석(앉기)
 *  ..........
 *  ....mm....
 * ```
 */
function guestRoom(npcId: string): InteriorLayout {
  return homeBase('bae_nuri', 10, 8, 'ondol', 'home', 0x3a8a8a, ['window', 'clock'], [
    { id: 'wardrobe', art: 'wardrobe', tx: 0, ty: 2, fw: 2, fh: 1 },
    { id: 'tv', art: 'tv', tx: 6, ty: 2, fw: 2, fh: 1 },
    { id: 'suitcase', art: 'suitcase', tx: 8, ty: 2, fw: 1, fh: 1 },
    { id: 'fridge', art: 'fridge', tx: 9, ty: 2, fw: 1, fh: 1 },
    { id: 'futon', art: 'futon_open', tx: 0, ty: 4, fw: 2, fh: 2 },
    { id: 'table', art: 'low_table', tx: 4, ty: 4, fw: 2, fh: 1 },
    { id: 'cushion', art: 'cushion', tx: 4, ty: 5, fw: 2, fh: 1, action: 'sit', seatDir: 'up' },
  ], { tx: 7.2, ty: 4.6, dir: 'down', role: 'student', npcId });
}

/**
 * 인물 → 집 안 배치. 없으면 그 집은 문 앞에서만 만난다(문 두드리기).
 *  - 어촌계 사무실(coop): 계장은 퇴근했고 당직 계원이 문을 연다 — 안으로 들이지 않는다(대사가 그렇다).
 */
const HOME_LAYOUTS: Record<string, (npcId: string) => InteriorLayout> = {
  okseon: grandmaHome,
  hyeonsu: anglerHome,
  kang_ducheol: elderHome,
  tak_mansu: workshopHome,
  tak_saebyeok: kidRoom,
  bae_nuri: guestRoom,
};

/** 인물의 집 안 배치 — 들일 수 없는 집이면 null */
export function homeLayoutOf(npcId: string): InteriorLayout | null {
  const f = HOME_LAYOUTS[npcId];
  return f ? f(npcId) : null;
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
  ...Object.entries(HOME_LAYOUTS).map(([id, f]) => f(id)),
];
