/**
 * @file HomeFurniture.ts
 * @description 집 실내 가구 — 종류 정의 · 기본 배치 · 방향별 픽셀 그림 (189차)
 *
 * 189차 사용자 지시:
 *  - 가구를 **회수(넣어 두기)·재배치**할 수 있어야 한다 → 가구는 종류(`FurnKind`) + 인스턴스(`FurnInstance`)로 나눈다.
 *    배치 상태는 `HomeStore`가 세이브에 들고, 씬은 이 모듈의 그림 함수로 인스턴스마다 하나씩 그린다.
 *  - 소파는 **한쪽을 바라보는 2인용** 형태로(구 그림은 무엇인지 알아보기 어려웠다), 소파·의자는 방향을 돌릴 수 있다.
 *  - 식탁 의자는 식탁 그림의 일부가 아니라 따로 앉을 수 있는 가구다.
 *  - 문은 「가로로 누운 문」처럼 보였다 → 문 대신 **현관 매트**(고정 — 가구가 아니다)를 방 아래쪽에 깐다.
 *
 * 190차: 협탁 스탠드 켜고 끄기(`lamp`) · 라디오(`radio`) · 관상 수조(`aquarium`) · 벽 장식 기능화(`WALL_DECOR`).
 *   러그 그림의 고양이는 떼어 내 방을 돌아다니는 개체가 됐다(`ui/HomeCat.ts`).
 *
 * 좌표는 칸(tile) 단위. 방은 12×10칸이고, 위 2줄은 벽이라 바닥은 2~9행이다.
 * 그림 함수는 **footprint 좌상단 = (0,0)** 인 지역 좌표로 그린다(씬이 Graphics를 그 자리로 옮긴다).
 */

import Phaser from 'phaser';

/** 실내 칸 크기(px) — 외부(20px)보다 큼직하게 */
export const IT = 48;
export const ROOM_W = 12;
export const ROOM_H = 10;
/** 바닥이 시작되는 행 (0~1행은 벽) */
export const FLOOR_TOP = 2;
/** 현관 매트 — 이 칸들을 밟고 아래로 걸어 나가면 밖이다. 가구를 올릴 수 없다 */
export const DOOR_MAT = { tx: 5, ty: 9, fw: 2, fh: 1 } as const;

export type FurnDir = 'down' | 'left' | 'up' | 'right';
/** 돌리는 순서 (시계 방향) */
export const DIR_CYCLE: FurnDir[] = ['down', 'left', 'up', 'right'];

/** 가구가 하는 일 — 이것이 있는 가구만 [F]가 뜬다(189차 — 「살펴보기」 폐지) */
export type FurnAction =
  | 'bed' | 'fridge' | 'cook' | 'sofa' | 'chair' | 'wardrobe' | 'shelf' | 'plant' | 'father_box'
  | 'lamp' | 'radio' | 'aquarium';

export type FurnKind =
  | 'fridge' | 'sink' | 'stove' | 'bed' | 'stand' | 'island' | 'chair' | 'sofa'
  | 'rug' | 'wardrobe' | 'shelf' | 'plant' | 'father_box' | 'radio' | 'aquarium';

export interface FurnDef {
  /** 화면 이름 (한국어 원문 — i18n 키) */
  nameKo: string;
  /** 기본 방향('down')일 때 칸 수. 돌릴 수 있는 가구는 좌·우를 보면 가로·세로가 바뀐다 */
  w: number;
  h: number;
  /** 지나갈 수 없다 (러그만 false) */
  collides: boolean;
  /** 바닥 깔개 — 다른 가구 밑에 깔릴 수 있고, 늘 맨 아래에 그린다 */
  floor?: boolean;
  rotatable?: boolean;
  /** 넣어 둘 수 있다 (침대는 잠잘 곳이라 못 넣는다) */
  storable: boolean;
  action?: FurnAction;
}

export const FURN_DEFS: Record<FurnKind, FurnDef> = {
  fridge:     { nameKo: '냉장고',     w: 1, h: 2, collides: true, storable: true, action: 'fridge' },
  sink:       { nameKo: '개수대',     w: 1, h: 1, collides: true, storable: true, action: 'cook' },
  stove:      { nameKo: '가스레인지', w: 2, h: 1, collides: true, storable: true, action: 'cook' },
  bed:        { nameKo: '침대',       w: 2, h: 3, collides: true, storable: false, action: 'bed' },
  stand:      { nameKo: '협탁',       w: 1, h: 1, collides: true, storable: true, action: 'lamp' },
  island:     { nameKo: '식탁',       w: 3, h: 1, collides: true, storable: true },
  chair:      { nameKo: '의자',       w: 1, h: 1, collides: true, storable: true, rotatable: true, action: 'chair' },
  sofa:       { nameKo: '소파',       w: 2, h: 1, collides: true, storable: true, rotatable: true, action: 'sofa' },
  rug:        { nameKo: '러그',       w: 3, h: 2, collides: false, floor: true, storable: true },
  wardrobe:   { nameKo: '옷장',       w: 1, h: 2, collides: true, storable: true, action: 'wardrobe' },
  shelf:      { nameKo: '수납 선반',  w: 2, h: 1, collides: true, storable: true, action: 'shelf' },
  plant:      { nameKo: '화분',       w: 1, h: 1, collides: true, storable: true, action: 'plant' },
  father_box: { nameKo: '낚시 상자',  w: 1, h: 1, collides: true, storable: true, action: 'father_box' },
  radio:      { nameKo: '라디오',     w: 1, h: 1, collides: true, storable: true, action: 'radio' },
  aquarium:   { nameKo: '관상 수조',  w: 2, h: 1, collides: true, storable: true, action: 'aquarium' },
};

/**
 * 벽 장식 (190차) — 가구가 아니라 벽에 붙은 것이라 옮기지 않는다. `x0`~`x1` = 벽 위 가로 범위(칸 단위 실수).
 * 기능이 있는 장식은 바로 아래 바닥(2행)에 서면 [F]가 뜬다 → 배치 판정이 그 앞자리를 막지 않게 본다.
 */
export type WallDecorId = 'books' | 'calendar' | 'fishprint';
export const WALL_DECOR: { id: WallDecorId; nameKo: string; x0: number; x1: number }[] = [
  { id: 'books', nameKo: '책', x0: 4.1, x1: 6.0 },
  { id: 'calendar', nameKo: '달력', x0: 6.25, x1: 6.95 },
  { id: 'fishprint', nameKo: '어탁', x0: 7.15, x1: 8.45 },
];

/** 벽 장식 앞자리 — 이 칸들 중 하나에 닿으면 쓸 수 있다 */
export function wallDecorCols(d: { x0: number; x1: number }): number[] {
  const out: number[] = [];
  for (let c = Math.floor(d.x0 - 0.3); c <= Math.floor(d.x1 + 0.3); c++) if (c >= 0 && c < ROOM_W) out.push(c);
  return out;
}

/** 배치된 가구 하나 */
export interface FurnInstance {
  /** 개체 id — 세이브·안내·프롤로그가 이 id로 가구를 찾는다 */
  id: string;
  kind: FurnKind;
  tx: number;
  ty: number;
  dir: FurnDir;
}

/**
 * Tier 0 원룸 기본 배치 (hometown_interior_mockup.svg 레이아웃 계승).
 * 좌측 상단 = 주방 · 우상단 = 침대 · 가운데 = 식탁과 의자 둘 · 좌측 = 소파(러그 쪽을 본다) · 하단 가운데 = 현관 매트.
 */
export const DEFAULT_LAYOUT: FurnInstance[] = [
  { id: 'fridge',     kind: 'fridge',     tx: 0,  ty: 2, dir: 'down' },
  { id: 'sink',       kind: 'sink',       tx: 1,  ty: 2, dir: 'down' },
  { id: 'stove',      kind: 'stove',      tx: 2,  ty: 2, dir: 'down' },
  { id: 'bed',        kind: 'bed',        tx: 9,  ty: 2, dir: 'down' },
  { id: 'stand',      kind: 'stand',      tx: 11, ty: 2, dir: 'down' },
  { id: 'island',     kind: 'island',     tx: 5,  ty: 3, dir: 'down' },
  { id: 'chair_1',    kind: 'chair',      tx: 5,  ty: 4, dir: 'up' },
  { id: 'chair_2',    kind: 'chair',      tx: 7,  ty: 4, dir: 'up' },
  { id: 'sofa',       kind: 'sofa',       tx: 2,  ty: 6, dir: 'right' },
  { id: 'rug',        kind: 'rug',        tx: 5,  ty: 5, dir: 'down' },
  { id: 'wardrobe',   kind: 'wardrobe',   tx: 11, ty: 6, dir: 'down' },
  { id: 'shelf',      kind: 'shelf',      tx: 0,  ty: 7, dir: 'down' },
  { id: 'plant',      kind: 'plant',      tx: 4,  ty: 8, dir: 'down' },
  // 188차 — 아버지의 낚시 상자 (침대 발치). 프롤로그 첫 목표 — 대·릴·가족사진이 들어 있다
  { id: 'father_box', kind: 'father_box', tx: 9,  ty: 5, dir: 'down' },
  // 190차 — 아버지가 소파에서 듣던 라디오 (소파 머리맡)
  { id: 'radio',      kind: 'radio',      tx: 2,  ty: 5, dir: 'down' },
];

/** 방향을 반영한 칸 수 */
export function footprint(kind: FurnKind, dir: FurnDir): { w: number; h: number } {
  const d = FURN_DEFS[kind];
  const side = d.rotatable && (dir === 'left' || dir === 'right');
  return side ? { w: d.h, h: d.w } : { w: d.w, h: d.h };
}

/**
 * 앉는 자리 (footprint 지역 px) — 엉덩이가 닿는 점. `behind` = 등받이가 캐릭터 앞(아래)에 서서 캐릭터를 가린다.
 * 소파는 두 자리, 의자는 한 자리.
 */
export function seatsOf(kind: FurnKind, dir: FurnDir): { x: number; y: number; behind: boolean }[] {
  const { w, h } = footprint(kind, dir);
  const W = w * IT, H = h * IT;
  if (kind === 'sofa') {
    switch (dir) {
      case 'down': return [{ x: W * 0.3, y: 30, behind: false }, { x: W * 0.7, y: 30, behind: false }];
      case 'up': return [{ x: W * 0.3, y: 18, behind: true }, { x: W * 0.7, y: 18, behind: true }];
      case 'right': return [{ x: 30, y: H * 0.36, behind: false }, { x: 30, y: H * 0.76, behind: false }];
      case 'left': return [{ x: W - 30, y: H * 0.36, behind: false }, { x: W - 30, y: H * 0.76, behind: false }];
    }
  }
  if (kind === 'chair') {
    switch (dir) {
      case 'down': return [{ x: 24, y: 30, behind: false }];
      case 'up': return [{ x: 24, y: 26, behind: true }];
      case 'right': return [{ x: 26, y: 30, behind: false }];
      case 'left': return [{ x: 22, y: 30, behind: false }];
    }
  }
  return [];
}

// ─────────────────────────────────────────────
// 그림 — 2px 도트 · 재질 + 그늘 + 하이라이트 (173차 화풍 계승)
// ─────────────────────────────────────────────

export interface FurnArtState {
  /** 화분이 목마른가 (사흘 넘게 물을 못 받았다) */
  plantDry?: boolean;
  /** 협탁 스탠드가 켜져 있는가 (190차) */
  lampOn?: boolean;
}

type Pal = readonly [number, number, number];   // [중간, 밝음, 어두움]

const WOOD: Pal = [0x6a4a2c, 0x8a6440, 0x4a3420];
const WOOD_LIGHT: Pal = [0x8a6a44, 0xa8835a, 0x66492b];

/**
 * 가구 하나를 지역 좌표로 그린다. `mirror` = 좌우 반전(왼쪽을 보는 소파·의자).
 */
export function drawFurnitureArt(
  g: Phaser.GameObjects.Graphics, kind: FurnKind, dir: FurnDir, st: FurnArtState = {},
): void {
  const { w: fw, h: fh } = footprint(kind, dir);
  const w = fw * IT, h = fh * IT;
  const mirror = dir === 'left';
  const dot = (x: number, y: number, col: number, a = 1): void => {
    g.fillStyle(col, a);
    g.fillRect(mirror ? w - x - 2 : x, y, 2, 2);
  };
  /** 사각 면 — 위 하이라이트 + 아래 그늘 */
  const slab = (x: number, y: number, sw: number, sh: number, p: Pal): void => {
    for (let yy = 0; yy < sh; yy += 2) for (let xx = 0; xx < sw; xx += 2) {
      dot(x + xx, y + yy, yy < 3 ? p[1] : yy > sh - 5 ? p[2] : p[0]);
    }
  };
  /** 세로로 선 면 — 왼쪽 하이라이트 + 오른쪽 그늘 (옆에서 본 등받이) */
  const slabV = (x: number, y: number, sw: number, sh: number, p: Pal): void => {
    for (let yy = 0; yy < sh; yy += 2) for (let xx = 0; xx < sw; xx += 2) {
      dot(x + xx, y + yy, xx < 3 ? p[1] : xx > sw - 5 ? p[2] : p[0]);
    }
  };
  /** 접지 그림자 */
  const shade = (x: number, y: number, sw: number): void => {
    for (let xx = 0; xx < sw; xx += 2) dot(x + xx, y, 0x2a1a0e, 0.28);
  };
  const outlineH = (x: number, y: number, sw: number, col: number): void => {
    for (let xx = 0; xx < sw; xx += 2) dot(x + xx, y, col);
  };

  switch (kind) {
    case 'bed': {
      shade(4, h - 4, w - 8);
      slab(4, 6, w - 8, h - 12, WOOD);                                            // 프레임
      slab(8, 10, w - 16, h - 22, [0x8a3a34, 0xa64a42, 0x6e2a26]);                // 매트리스·이불
      for (let yy = 0; yy < h - 26; yy += 8) for (let xx = 0; xx < w - 20; xx += 2) dot(10 + xx, 16 + yy, 0x9b4139, 0.7);
      slab(12, 14, w - 24, 22, [0xf2e2c8, 0xfff6e2, 0xd8c4a4]);                  // 베개
      slab(8, h - 24, w - 16, 12, [0x3a6ea5, 0x4d86c0, 0x2a5280]);               // 발치 이불단
      break;
    }
    case 'fridge':
      shade(8, h - 6, w - 16);
      slab(8, 6, w - 16, h - 12, [0xe4e6e2, 0xf5f7f3, 0xc2c6c0]);
      for (let xx = 0; xx < w - 16; xx += 2) dot(8 + xx, Math.round(h * 0.42), 0xaeb2ac);
      for (let yy = 0; yy < 14; yy += 2) dot(w - 18, 14 + yy, 0x8d979f);
      for (let yy = 0; yy < 14; yy += 2) dot(w - 18, Math.round(h * 0.5) + yy, 0x8d979f);
      break;
    case 'sink':
      shade(6, h - 6, w - 12);
      slab(4, 8, w - 8, h - 14, [0xcfd4d8, 0xe6eaed, 0xa9aeb2]);
      slab(12, 16, w - 24, h - 30, [0x5f6a74, 0x76828d, 0x454e57]);
      for (let yy = 0; yy < 12; yy += 2) dot(w / 2, 6 + yy, 0x9aa6b0);
      dot(w / 2 - 2, 6, 0xb6c2cc); dot(w / 2 + 2, 6, 0xb6c2cc);
      break;
    case 'stove': {
      shade(6, h - 6, w - 12);
      slab(4, 8, w - 8, h - 14, [0x3a3f45, 0x4e545b, 0x24282d]);
      for (const bx of [w * 0.3, w * 0.7]) {
        for (let a = 0; a < 360; a += 20) {
          const rx = Math.round(Math.cos(a * Math.PI / 180) * 4) * 2, ry = Math.round(Math.sin(a * Math.PI / 180) * 4) * 2;
          dot(bx + rx, h * 0.52 + ry, 0x22262a);
        }
        dot(bx - 2, h * 0.52, 0xff7a3a); dot(bx, h * 0.52 - 2, 0xffa35a);
        dot(bx, h * 0.52 + 2, 0xff7a3a); dot(bx + 2, h * 0.52, 0xffa35a);
      }
      for (let xx = 0; xx < w - 20; xx += 10) dot(10 + xx, h - 10, 0xb0b6bc);   // 손잡이 열
      break;
    }
    case 'island':
      // 189차 — 의자는 따로 앉는 가구가 됐다. 식탁은 상판과 다리만
      shade(6, h - 2, w - 12);
      slab(4, 10, w - 8, h - 20, [0xd8b98a, 0xeed6ae, 0xb4966a]);
      for (let xx = 0; xx < w - 8; xx += 2) dot(4 + xx, 10, 0xf4e4c4);
      for (const lx of [8, w - 12]) for (let yy = 0; yy < 8; yy += 2) dot(lx, h - 10 + yy, 0x7a5734);
      break;
    case 'chair':
      drawChair(dot, slab, slabV, shade, dir);
      break;
    case 'sofa':
      drawSofa(dot, slab, slabV, shade, outlineH, dir, w, h);
      break;
    case 'rug': {
      for (let yy = 0; yy < h - 4; yy += 2) for (let xx = 0; xx < w - 4; xx += 2) {
        const edge = xx < 8 || yy < 8 || xx > w - 14 || yy > h - 14;
        dot(2 + xx, 2 + yy, edge ? 0x2e5e3e : ((xx + yy) % 8 < 4 ? 0x3f7d54 : 0x38704b));
      }
      for (let xx = 0; xx < w - 4; xx += 4) { dot(2 + xx, 2, 0xe8e0c8); dot(2 + xx, h - 4, 0xe8e0c8); }  // 술
      break;
    }
    case 'wardrobe': {
      // 189차 — 옷장: 위 장식 몰딩 + 여닫이문 두 짝 + 놋쇠 손잡이 + 아래 걸레받이
      shade(6, h - 4, w - 12);
      slab(4, 4, w - 8, h - 10, WOOD);
      for (let xx = 0; xx < w - 4; xx += 2) { dot(2 + xx, 2, 0x9a7046); dot(2 + xx, 4, 0x5a3c22); }
      for (const [dx, dw] of [[8, (w - 18) / 2], [w / 2 + 1, (w - 18) / 2]] as const) {
        slab(dx, 10, dw, h - 30, [0x7d5934, 0x9a7046, 0x5c4022]);
        for (let yy = 0; yy < h - 44; yy += 2) { dot(dx + 2, 16 + yy, 0x5c4022, 0.6); dot(dx + dw - 4, 16 + yy, 0x5c4022, 0.6); }
      }
      for (let yy = 0; yy < h - 30; yy += 2) dot(w / 2 - 1, 10 + yy, 0x3a2414);
      for (let yy = 0; yy < 8; yy += 2) { dot(w / 2 - 5, h * 0.42 + yy, 0xd8b45a); dot(w / 2 + 3, h * 0.42 + yy, 0xd8b45a); }
      slab(6, h - 18, w - 12, 10, [0x5a3c22, 0x6a4a2c, 0x3f2718]);
      break;
    }
    case 'shelf':
      shade(6, h - 4, w - 12);
      slab(4, 6, w - 8, h - 12, [0x5a3a22, 0x7a5232, 0x3f2718]);
      for (const fy of [0.32, 0.64]) for (let xx = 0; xx < w - 16; xx += 2) dot(8 + xx, h * fy, 0x8a6138);
      [0x3a6ea5, 0xb04a3a, 0x3f9e63].forEach((col, i) => {
        for (let yy = 0; yy < 16; yy += 2) for (let xx = 0; xx < 8; xx += 2) dot(12 + i * 12 + xx, h * 0.32 - 16 + yy, col);
      });
      for (let yy = 0; yy < 10; yy += 2) for (let xx = 0; xx < 18; xx += 2) dot(w - 30 + xx, h * 0.64 - 10 + yy, yy < 3 ? 0x8a9aa8 : 0x5f6f7c);   // 채비 상자
      break;
    case 'plant': {
      const px = IT * 0.5;
      shade(IT * 0.28, IT * 0.86, IT * 0.44);
      slab(IT * 0.3, IT * 0.56, IT * 0.4, IT * 0.3, [0xb06a3b, 0xcb8450, 0x8d5029]);
      const dry = !!st.plantDry;
      for (let a = 0; a < 5; a++) {
        // 목마른 화분은 잎이 처지고 누렇다
        const ang = dry ? -90 + (a - 2) * 34 : -90 + (a - 2) * 26;
        const len = (dry ? 15 : 16) + (a % 2) * 5;
        for (let tt = 0; tt < len; tt += 2) {
          const droop = dry ? Math.round((tt * tt) / 110) * 2 : 0;
          dot(px + Math.round(Math.cos(ang * Math.PI / 180) * tt / 2) * 2,
              IT * 0.56 + Math.round(Math.sin(ang * Math.PI / 180) * tt / 2) * 2 + droop,
              dry ? (tt > len - 8 ? 0xb8a24a : 0x8f8a3a) : (tt > len - 8 ? 0x4fae56 : 0x3b8a42));
        }
      }
      break;
    }
    case 'stand': {
      // 협탁 + 스탠드 (189차 — 구 서랍장 위 램프를 머리맡으로 옮겼다) · 190차 켜짐/꺼짐
      shade(10, h - 6, w - 20);
      slab(8, 16, w - 16, h - 24, WOOD);
      for (let xx = 0; xx < w - 20; xx += 2) dot(10 + xx, 16, 0x9a7046);
      for (let xx = 0; xx < 8; xx += 2) dot(w / 2 - 4 + xx, h - 18, 0xc9a66a);
      for (let yy = 0; yy < 8; yy += 2) dot(w / 2, 6 + yy, 0x5a4a3a);                                       // 램프 대
      const on = !!st.lampOn;
      for (let yy = 0; yy < 10; yy += 2) for (let xx = 0; xx < 14 - yy; xx += 2) {
        dot(w / 2 - 6 + yy / 2 + xx, -4 + yy, on ? (yy > 5 ? 0xfff3c4 : 0xffe28a) : (yy > 5 ? 0xb8ad94 : 0xa39a86), on ? 1 : 0.95);   // 갓
      }
      if (on) for (let xx = 0; xx < 10; xx += 2) dot(w / 2 - 4 + xx, 6, 0xfffbe6);   // 갓 아래로 새는 빛
      break;
    }
    case 'father_box': {
      // 188차 — 아버지의 낚시 상자: 나무 몸통 + 금속 걸쇠 + 테이프 감은 손잡이
      shade(6, h - 6, w - 12);
      slab(6, 16, w - 12, h - 24, [0x7a5232, 0x9a7046, 0x5a3c22]);
      for (let xx = 0; xx < w - 12; xx += 2) { dot(6 + xx, 16, 0xb88a52); dot(6 + xx, 26, 0x4a3018); }
      for (const lx of [12, w - 16]) for (let yy = 0; yy < 6; yy += 2) { dot(lx, 24 + yy, 0xc9ccd0); dot(lx + 2, 24 + yy, 0x8d979f); }
      for (let xx = 0; xx < 16; xx += 2) dot(w / 2 - 8 + xx, 8, 0x2e2e34);
      for (let yy = 0; yy < 8; yy += 2) { dot(w / 2 - 10, 8 + yy, 0x2e2e34); dot(w / 2 + 8, 8 + yy, 0x2e2e34); }
      for (let xx = 0; xx < 8; xx += 2) dot(w / 2 - 4 + xx, 8, 0x3a6ea5);
      break;
    }
    case 'radio': {
      // 190차 — 작은 나무 받침대 위의 휴대용 라디오: 스피커 망 · 다이얼 창 · 손잡이 · 안테나
      shade(10, h - 4, w - 20);
      slab(10, 26, w - 20, h - 30, WOOD);                                        // 받침대 상판·몸통
      for (const lx of [12, w - 14]) for (let yy = h - 8; yy < h - 2; yy += 2) dot(lx, yy, 0x3f2718);
      slab(8, 8, w - 16, 20, [0x7a2e26, 0x9a4034, 0x5a2018]);                    // 라디오 몸통(붉은 칠)
      for (let yy = 12; yy < 24; yy += 2) for (let xx = 12; xx < 24; xx += 2) {  // 스피커 망
        if ((xx + yy) % 4 === 0) dot(xx, yy, 0x3a1410); else dot(xx, yy, 0x6a2820);
      }
      slab(26, 12, 12, 6, [0xe8d6a0, 0xfff0c0, 0xc8b480]);                        // 주파수 창
      dot(30, 14, 0xb03a2a);
      dot(28, 20, 0xd8c8a0); dot(34, 20, 0xd8c8a0);                               // 다이얼 손잡이
      for (let xx = 14; xx < w - 14; xx += 2) dot(xx, 4, 0x2a1a0e);               // 손잡이
      dot(14, 6, 0x2a1a0e); dot(w - 16, 6, 0x2a1a0e);
      for (let t = 0; t < 14; t += 2) dot(w - 12 + Math.round(t / 4) * 2, 6 - t, 0xa8b0b8);   // 안테나
      break;
    }
    case 'aquarium': {
      // 190차 — 관상 수조: 나무 받침장 위 유리 수조 + 물 · 자갈 · 수초 · 조명 덮개 (물고기는 씬이 따로 띄운다)
      shade(4, h - 3, w - 8);
      slab(4, h - 16, w - 8, 14, WOOD);                                          // 받침장
      for (let xx = 8; xx < w - 8; xx += 2) dot(xx, h - 10, 0x4a3420, 0.6);
      for (let yy = 0; yy < h - 22; yy += 2) for (let xx = 0; xx < w - 12; xx += 2) {
        const top = yy < 4;
        dot(6 + xx, 4 + yy, top ? 0x9fd6e8 : (yy > h - 34 ? 0x2f7aa0 : (yy % 6 === 0 ? 0x4a9ec4 : 0x3f92ba)), top ? 0.9 : 0.95);
      }
      for (let xx = 0; xx < w - 12; xx += 2) dot(6 + xx, h - 24, (xx % 6 === 0) ? 0xd8c8a0 : 0xb8a888);   // 자갈
      for (let xx = 0; xx < w - 12; xx += 2) dot(6 + xx, h - 22, (xx % 4 === 0) ? 0xa89878 : 0xc8b898);
      for (const [px, len] of [[12, 14], [16, 10], [w - 16, 16], [w - 20, 9]] as const) {   // 수초
        for (let t = 0; t < len; t += 2) dot(px + ((t >> 2) % 2) * 2, h - 26 - t, t > len - 5 ? 0x6ac46a : 0x3f9e4f);
      }
      for (let yy = 2; yy < h - 20; yy += 2) { dot(4, yy, 0xcfe8f0, 0.8); dot(w - 6, yy, 0x8ab8c8, 0.8); }   // 유리 테
      for (let xx = 4; xx < w - 4; xx += 2) { dot(xx, 0, 0x3a3f45); dot(xx, 2, 0x4e545b); }               // 조명 덮개
      for (let yy = 6; yy < 16; yy += 2) dot(10, yy, 0xffffff, 0.35);                                        // 유리 반사
      break;
    }
  }
}

type DotFn = (x: number, y: number, col: number, a?: number) => void;
type SlabFn = (x: number, y: number, w: number, h: number, p: Pal) => void;
type ShadeFn = (x: number, y: number, w: number) => void;

/**
 * 2인용 소파 — 189차 재작성. 등받이·팔걸이·방석 두 개가 **한쪽을 바라보게** 읽혀야 한다.
 * 'down' = 정면(등받이가 위) · 'up' = 뒷모습(등받이가 아래에서 가린다) · 'right' = 오른쪽을 본다(등받이가 왼쪽).
 * 'left'는 'right'를 좌우 반전해 그린다(dot이 반전한다).
 */
function drawSofa(dot: DotFn, slab: SlabFn, slabV: SlabFn, shade: ShadeFn,
  outlineH: (x: number, y: number, w: number, col: number) => void, dir: FurnDir, w: number, h: number): void {
  const OUT = 0x2e1838;          // 외곽선
  const BACK: Pal = [0x5e3569, 0x7a4a88, 0x45264f];   // 등받이·좌판 앞면 (가장 어둡다)
  const ARM: Pal = [0x7c4c88, 0xa070b0, 0x5d3a68];    // 팔걸이 (윗면이 밝다)
  const SEAT: Pal = [0x9a6aaa, 0xc192d0, 0x7c5089];   // 방석 (가장 밝다)
  const vline = (x: number, y0: number, y1: number, col: number): void => { for (let y = y0; y < y1; y += 2) dot(x, y, col); };
  if (dir === 'down') {
    // 정면 — 위: 높은 등받이 / 가운데: 방석 둘 / 아래: 좌판 앞면 / 양옆: 둥근 팔걸이
    shade(6, h - 3, w - 12);
    slab(8, 0, w - 16, 20, BACK);                             // 등받이
    for (const bx of [w * 0.3, w * 0.5, w * 0.7]) dot(Math.round(bx / 2) * 2, 10, 0x3a2044);   // 단추 누빔
    slab(14, 18, w - 28, 16, SEAT);                           // 방석
    vline(w / 2, 18, 34, 0x6a4078);                           // 방석 사이 솔기
    slab(10, 34, w - 20, 8, BACK);                            // 좌판 앞면
    for (const ax of [2, w - 14]) {
      slab(ax, 6, 12, 8, [ARM[1], 0xc7a0d4, ARM[0]]);         // 팔걸이 윗면 (둥근 머리)
      slab(ax, 14, 12, 28, ARM);                              // 팔걸이 앞면
      vline(ax, 8, 42, OUT); vline(ax + 10, 8, 42, OUT);
    }
    outlineH(8, 0, w - 16, OUT);
    outlineH(2, 42, w - 4, OUT);
    for (const lx of [4, w - 6]) { dot(lx, 44, 0x2a1a0e); }   // 다리
    return;
  }
  if (dir === 'up') {
    // 뒷모습 — 등받이 뒷판이 아래에서 크게 가리고, 그 너머로 방석 윗면과 팔걸이 머리만 보인다
    shade(6, h - 3, w - 12);
    slab(14, 4, w - 28, 10, SEAT);                            // 등받이 너머 방석
    vline(w / 2, 4, 14, 0x6a4078);
    for (const ax of [2, w - 14]) {
      slab(ax, 2, 12, 8, [ARM[1], 0xc7a0d4, ARM[0]]);         // 팔걸이 머리
      slab(ax, 10, 12, 32, ARM);
      vline(ax, 4, 42, OUT); vline(ax + 10, 4, 42, OUT);
    }
    slab(12, 12, w - 24, 30, BACK);                           // 등받이 뒷판
    outlineH(12, 12, w - 24, OUT);
    for (let xx = 22; xx < w - 16; xx += 12) vline(xx, 18, 38, 0x45264f);   // 뒷판 솔기
    outlineH(2, 42, w - 4, OUT);
    for (const lx of [4, w - 6]) dot(lx, 44, 0x2a1a0e);
    return;
  }
  // 'right' (+ 'left' 반전) — 세로 1×2. 정면 그림을 90° 돌린 배치:
  // 왼쪽: 높은 등받이 / 가운데: 방석 둘(위·아래) / 오른쪽: 좌판 앞면 / 위·아래: 팔걸이
  shade(4, h - 3, w - 8);
  slabV(0, 8, 18, h - 16, BACK);                              // 등받이
  for (const by of [h * 0.3, h * 0.5, h * 0.7]) dot(8, Math.round(by / 2) * 2, 0x3a2044);
  vline(0, 8, h - 8, OUT);
  slab(18, 14, w - 28, h - 28, SEAT);                         // 방석
  outlineH(18, h / 2, w - 28, 0x6a4078);                      // 방석 사이 솔기
  slabV(w - 10, 12, 8, h - 24, BACK);                         // 좌판 앞면 (오른쪽)
  for (const ay of [2, h - 14]) {
    slab(2, ay, w - 6, 12, ARM);                              // 팔걸이
    for (let xx = 2; xx < w - 4; xx += 2) dot(xx, ay + 2, 0xc7a0d4);   // 팔걸이 윗면 빛
    outlineH(2, ay, w - 6, OUT); outlineH(2, ay + 10, w - 6, OUT);
  }
  vline(w - 4, 2, h - 2, OUT);
  for (const ly of [h - 4, 4]) dot(w - 2, ly, 0x2a1a0e);
}

/**
 * 나무 의자 — 등받이가 있는 쪽이 등이다.
 * 'up' = 식탁을 향해 앉는 의자(등받이가 아래 — 앉은 사람의 허리를 가린다) · 'down' = 정면 · 'right'/'left' = 옆모습.
 */
function drawChair(dot: DotFn, slab: SlabFn, slabV: SlabFn, shade: ShadeFn, dir: FurnDir): void {
  const OUT = 0x4a3018;
  if (dir === 'down') {
    shade(12, 44, 24);
    slab(12, 4, 24, 16, WOOD_LIGHT);                          // 등받이 (위)
    for (const sx of [17, 23, 29]) for (let yy = 8; yy < 18; yy += 2) dot(sx, yy, 0x66492b);   // 살
    slab(10, 20, 28, 14, [0xa8835a, 0xc29d6c, 0x7a5734]);     // 좌판
    for (const lx of [12, 34]) for (let yy = 34; yy < 44; yy += 2) dot(lx, yy, OUT);   // 앞다리
    return;
  }
  if (dir === 'up') {
    shade(12, 44, 24);
    slab(10, 10, 28, 14, [0xa8835a, 0xc29d6c, 0x7a5734]);     // 좌판 (등받이 너머)
    slab(12, 18, 24, 18, WOOD_LIGHT);                         // 등받이 뒷면 (아래)
    for (const sx of [17, 23, 29]) for (let yy = 22; yy < 34; yy += 2) dot(sx, yy, 0x66492b);
    for (const lx of [12, 34]) for (let yy = 36; yy < 44; yy += 2) dot(lx, yy, OUT);
    return;
  }
  // 'right' (+ 'left' 반전) — 등받이가 왼쪽에 서 있는 옆모습
  shade(10, 44, 28);
  slab(12, 22, 26, 12, [0xa8835a, 0xc29d6c, 0x7a5734]);       // 좌판
  slabV(10, 4, 6, 32, WOOD_LIGHT);                            // 등받이 기둥
  for (let yy = 8; yy < 22; yy += 4) for (let xx = 10; xx < 16; xx += 2) dot(xx, yy, 0x66492b);
  for (const lx of [12, 34]) for (let yy = 34; yy < 44; yy += 2) dot(lx, yy, OUT);
}

/** 방 바닥 칸인가 */
export function inFloor(c: number, r: number): boolean {
  return c >= 0 && c < ROOM_W && r >= FLOOR_TOP && r < ROOM_H;
}

/** 현관 매트 칸인가 */
export function onDoorMat(c: number, r: number): boolean {
  return c >= DOOR_MAT.tx && c < DOOR_MAT.tx + DOOR_MAT.fw && r >= DOOR_MAT.ty && r < DOOR_MAT.ty + DOOR_MAT.fh;
}

/** 가구가 바라보는 앞 칸 (190차 — 식탁 앞 의자 판정) */
export function frontCell(f: FurnInstance): { c: number; r: number } {
  const { w, h } = footprint(f.kind, f.dir);
  switch (f.dir) {
    case 'up': return { c: f.tx, r: f.ty - 1 };
    case 'down': return { c: f.tx, r: f.ty + h };
    case 'left': return { c: f.tx - 1, r: f.ty };
    case 'right': return { c: f.tx + w, r: f.ty };
  }
}

/**
 * 가구 아이콘 텍스처 `furn_<kind>` (190차 — 상점 목록·아이템 아이콘). 한 번 굽고 재사용한다.
 * 그림이 칸 위로 조금 넘치는 가구(스탠드 갓)가 있어 위쪽에 여백을 둔다.
 */
export function ensureFurnitureIcon(scene: Phaser.Scene, kind: FurnKind): string {
  const key = `furn_${kind}`;
  if (scene.textures.exists(key)) return key;
  const { w, h } = footprint(kind, 'down');
  const pad = 8;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.translateCanvas(0, pad);
  drawFurnitureArt(g, kind, 'down', { lampOn: true });
  g.generateTexture(key, w * IT, h * IT + pad);
  g.destroy();
  return key;
}
