/**
 * @file InteriorArt.ts
 * @description 건물 실내 그림 (215차) — 바닥 · 벽 · 집기를 절차 픽셀로 굽는다.
 *
 * 집 실내(`HomeInteriorScene.drawRoom`)와 같은 **2px 그레인** 문법. 텍스처는 배치 키별로 한 번만 굽고
 * (`interior_bg_<key>` · `interior_fx_<key>_<id>`) 다음 입장부터는 캐시를 쓴다.
 * 글자는 그리지 않는다 — 무엇인지는 그림이, 무엇을 할 수 있는지는 머리 위 [F]가 말한다(R11).
 */

import Phaser from 'phaser';
import type { FixtureArt, FixtureDef, InteriorLayout } from '../data/InteriorLayouts.js';
import { FLOOR_TOP } from '../data/InteriorLayouts.js';

/** 방 액자 두께(px) — 배경 텍스처는 이만큼 바깥까지 그린다 */
export const FRAME = 20;
/** 현관 밖 돌계단 높이(px) */
const STEP_H = 20;

type Dot = (x: number, y: number, col: number, a?: number) => void;

function hash(x: number, y: number, s = 0x9e37): number {
  let n = (s ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function mk(g: Phaser.GameObjects.Graphics): { dot: Dot; rect: (x: number, y: number, w: number, h: number, col: number, a?: number) => void } {
  return {
    dot: (x, y, col, a = 1) => { g.fillStyle(col, a); g.fillRect(x, y, 2, 2); },
    rect: (x, y, w, h, col, a = 1) => { g.fillStyle(col, a); g.fillRect(x, y, w, h); },
  };
}

/** 색을 어둡게/밝게 (k < 1 어둡게) */
function tone(col: number, k: number): number {
  const r = Math.min(255, Math.round(((col >> 16) & 0xff) * k));
  const gg = Math.min(255, Math.round(((col >> 8) & 0xff) * k));
  const b = Math.min(255, Math.round((col & 0xff) * k));
  return (r << 16) | (gg << 8) | b;
}

// ── 배경(바닥 · 벽 · 현관) ─────────────────────────────

const FLOOR: Record<InteriorLayout['floor'], (x: number, y: number, it: number) => number> = {
  vinyl: (x, y, it) => {
    const c = Math.floor(x / (it / 2)) + Math.floor(y / (it / 2));
    const base = c % 2 === 0 ? 0xe4e2da : 0xd6d4cc;
    return hash(x, y) > 0.94 ? tone(base, 0.95) : base;
  },
  wood: (x, y, it) => woodPlank(x, y, it, [0xa8743e, 0x9e6c3a, 0x8a5a2c, 0xb6824a, 0x6e4622]),
  dark_wood: (x, y, it) => woodPlank(x, y, it, [0x5a3a24, 0x54361f, 0x42281a, 0x6a4630, 0x2e1c10]),
  tackle_tile: (x, y, it) => {
    const edge = x % it < 2 || y % it < 2;
    if (edge) return 0x8a9aa6;
    return hash(x, y) > 0.9 ? 0xb4c2cc : 0xa8b6c0;
  },
  clinic: (x, y, it) => {
    const edge = x % (it / 2) < 2 || y % (it / 2) < 2;
    if (edge) return 0xc6d6cc;
    return hash(x, y) > 0.93 ? 0xe2eee6 : 0xdae8e0;
  },
  concrete: (x, y) => {
    const h = hash(x, y);
    return h < 0.08 ? 0x7c8890 : h > 0.93 ? 0xa6b0b6 : 0x929ea6;
  },
};

/**
 * 널마루 — 가로 널(반 칸 폭) · 널마다 엇갈린 이음매 · 결은 **가로로 긴 짧은 획**(점이 아니라 줄).
 * 2px마다 독립 난수를 쓰면 소금·후추처럼 지글거린다(215차 1차 실측).
 */
function woodPlank(x: number, y: number, it: number, pal: [number, number, number, number, number]): number {
  const ph = Math.round(it * 0.5);
  const plank = Math.floor(y / ph);
  const off = (plank * 37) % 96;
  if ((x + off) % 96 < 2) return pal[4];           // 널 끝 이음매
  if (y % ph < 2) return pal[2];                   // 널 사이 홈
  const base = plank % 2 === 0 ? pal[0] : pal[1];
  const g = hash(Math.floor((x + off) / 14), Math.floor(y / 2) + plank * 53);
  return g < 0.06 ? pal[2] : g > 0.95 ? pal[3] : base;
}

const WALL: Record<InteriorLayout['wall'], { upper: number; upper2: number; lower: number; trim: number }> = {
  shop: { upper: 0xeeece4, upper2: 0xe2e0d8, lower: 0xb8b4a8, trim: 0x6a6a64 },
  warm: { upper: 0xe0c8a0, upper2: 0xd6bc94, lower: 0x7a5232, trim: 0x4a3018 },
  pub: { upper: 0x6a4a3a, upper2: 0x604232, lower: 0x3a2618, trim: 0x24160c },
  tackle: { upper: 0xc8d4dc, upper2: 0xbcc8d0, lower: 0x6a5238, trim: 0x3a2a1a },
  clinic: { upper: 0xf2f4f0, upper2: 0xe8ece6, lower: 0x8ac4a8, trim: 0x3a8a6a },
  hall: { upper: 0x8a969e, upper2: 0x7e8a92, lower: 0x5a646c, trim: 0x2e363c },
};

/**
 * 배경 한 장 — (FRAME, FRAME)이 방 왼쪽 위. 크기 = 방 + 액자 양쪽 + 아래 돌계단.
 * @returns 텍스처 키
 */
export function bakeInteriorBg(scene: Phaser.Scene, L: InteriorLayout): string {
  const key = `interior_bg_${L.key}`;
  if (scene.textures.exists(key)) return key;
  const W = L.cols * L.it, H = L.rows * L.it;
  const g = scene.add.graphics();
  const { dot, rect } = mk(g);
  const ox = FRAME, oy = FRAME;
  // 액자(외벽)
  rect(0, 0, W + FRAME * 2, H + FRAME * 2, 0x2a2420);
  rect(6, 6, W + FRAME * 2 - 12, H + FRAME * 2 - 12, 0x3e342c);
  // 바닥
  const paint = FLOOR[L.floor];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) dot(ox + x, oy + y, paint(x, y, L.it));
  if (L.floor === 'concrete') {
    // 배수 홈 두 줄 + 젖은 자국
    for (const gy of [Math.round(H * 0.47), Math.round(H * 0.8)]) {
      for (let x = 8; x < W - 8; x += 2) { dot(ox + x, oy + gy, 0x5a646a); if (x % 8 < 4) dot(ox + x, oy + gy + 2, 0x48525a); }
    }
    for (let i = 0; i < 14; i++) {
      const cx = Math.round(hash(i, 3) * W), cy = Math.round(L.it * FLOOR_TOP + hash(i, 9) * (H - L.it * FLOOR_TOP));
      const r = 10 + Math.round(hash(i, 5) * 18);
      for (let y = -r; y < r; y += 2) for (let x = -r * 1.6; x < r * 1.6; x += 2) {
        if ((x * x) / 2.56 + y * y < r * r && cx + x > 0 && cx + x < W && cy + y > 0 && cy + y < H) dot(ox + Math.round(cx + x), oy + cy + y, 0x6e7a84, 0.35);
      }
    }
  }
  // 벽 — 윗벽 + 징두리 + 몰딩
  const wallH = Math.round(L.it * FLOOR_TOP * 0.82);
  const wc = WALL[L.wall];
  for (let y = 0; y < wallH; y += 2) for (let x = 0; x < W; x += 2) {
    const wain = y > wallH - 22;
    let col = wain ? ((x / 2) % 10 < 2 ? tone(wc.lower, 0.85) : wc.lower) : (hash(x, y + 999) > 0.93 ? wc.upper2 : wc.upper);
    if (L.wall === 'hall' && !wain) col = (x / 2) % 6 < 2 ? wc.upper2 : wc.upper;   // 골함석
    dot(ox + x, oy + y, col);
  }
  for (let x = 0; x < W; x += 2) { dot(ox + x, oy + wallH - 24, wc.trim); dot(ox + x, oy + wallH - 22, tone(wc.trim, 0.8)); }
  // 간판 색 띠(벽 꼭대기)
  for (let y = 0; y < 8; y += 2) for (let x = 0; x < W; x += 2) dot(ox + x, oy + y, y < 2 ? tone(L.accent, 1.2) : L.accent);
  // 벽과 바닥 사이 그늘
  for (let x = 0; x < W; x += 2) { dot(ox + x, oy + wallH, 0x000000, 0.25); dot(ox + x, oy + wallH + 2, 0x000000, 0.12); }
  // 바닥과 벽 사이 띠(걸레받이)
  const floorY = L.it * FLOOR_TOP;
  for (let y = wallH; y < floorY; y += 2) for (let x = 0; x < W; x += 2) {
    const base = paint(x, y, L.it);
    dot(ox + x, oy + y, tone(base, 0.9));
  }
  drawWallDecor(g, L, ox, oy, W, wallH);
  // 현관 — 아래 벽을 트고 돌계단 · 매트
  const mx = ox + L.mat.tx * L.it, mw = L.mat.fw * L.it;
  for (let y = 0; y < STEP_H; y += 2) for (let x = 0; x < mw; x += 2) {
    dot(mx + x, oy + H + y, y < 4 ? 0x1a140e : (hash(x, y + 400) > 0.85 ? 0xc9c2b0 : 0xb5ad98));
  }
  for (let x = 0; x < mw; x += 2) { dot(mx + x, oy + H + 12, 0x9a927c); dot(mx + x, oy + H + 18, 0x847c68); }
  for (let y = -6; y < STEP_H; y += 2) { dot(mx - 2, oy + H + y, 0x1a140e); dot(mx + mw, oy + H + y, 0x1a140e); }
  g.fillStyle(0xfff3c4, 0.07); g.fillRect(mx, oy + H - L.it * 1.2, mw, L.it * 1.2);
  const my = oy + H - L.it;
  for (let y = 6; y < L.it - 4; y += 2) for (let x = 6; x < mw - 6; x += 2) {
    const edge = x < 10 || x > mw - 12 || y < 10 || y > L.it - 8;
    const weave = ((x >> 1) + (y >> 1)) % 4 < 2;
    dot(mx + x, my + y, edge ? 0x2a3a4a : weave ? 0x4a6a8a : 0x3e5a76);
  }
  g.generateTexture(key, W + FRAME * 2, H + FRAME * 2 + STEP_H);
  g.destroy();
  return key;
}

/** 벽 장식 — 배경에 구워진다(가구가 아니라 벽 그림) */
function drawWallDecor(g: Phaser.GameObjects.Graphics, L: InteriorLayout, ox: number, oy: number, W: number, wallH: number): void {
  const { dot, rect } = mk(g);
  const top = oy + 14;
  for (const d of L.wallDecor) {
    switch (d) {
      case 'clock': {
        const cx = ox + W - 40, cy = top + 14;
        g.fillStyle(0x2a2420, 1); g.fillCircle(cx, cy, 13);
        g.fillStyle(0xf2ead2, 1); g.fillCircle(cx, cy, 10);
        rect(cx - 1, cy - 7, 2, 7, 0x2a2420); rect(cx, cy - 1, 6, 2, 0x2a2420);
        break;
      }
      case 'poster': {
        const px = ox + Math.round(W * 0.42), pw = 34, ph = wallH - 44;
        rect(px, top, pw, ph, 0xf4f0e4);
        rect(px + 4, top + 4, pw - 8, Math.round(ph * 0.5), tone(L.accent, 1.15));
        for (let y = top + Math.round(ph * 0.6); y < top + ph - 4; y += 4) rect(px + 4, y, pw - 8 - ((y / 4) % 3) * 4, 2, 0x8a8a84);
        dot(px + pw / 2 - 1, top - 2, 0x3a3a34);
        break;
      }
      case 'menu': {
        // 메뉴판 — 나무 테 칠판 + 분필 줄
        // 창(왼쪽)과 주방 벽(오른쪽 절반) 사이 — 둘을 덮지 않는다(215차 1차: 카페 커피 선반을 덮었다)
        const mx = ox + Math.round(W * 0.34), mw = Math.round(W * 0.19), mh = wallH - 40;
        rect(mx - 3, top - 3, mw + 6, mh + 6, 0x5a3a20);
        rect(mx, top, mw, mh, 0x24302a);
        for (let y = top + 6; y < top + mh - 4; y += 7) {
          const len = mw - 22 - Math.round(hash(y, mx) * 16);
          for (let x = 0; x < len; x += 2) dot(mx + 6 + x, y, 0xd8dccc, 0.8);
          for (let x = mw - 14; x < mw - 6; x += 2) dot(mx + x, y, 0xf0d070, 0.9);
        }
        break;
      }
      case 'kitchen': {
        // 주방 벽 — 후드 + 타일 + 걸린 냄비
        const kx = ox + Math.round(W * 0.56), kw = Math.round(W * 0.42);
        for (let y = top + 6; y < wallH + oy - 22; y += 2) for (let x = 0; x < kw; x += 2) {
          dot(kx + x, y, (x % 12 < 2 || (y - top) % 12 < 2) ? 0xc8c4b8 : 0xe8e4d8);
        }
        rect(kx + kw * 0.35, top - 2, kw * 0.3, 14, 0x9aa4ac); rect(kx + kw * 0.3, top + 12, kw * 0.4, 4, 0x6a747c);
        for (let i = 0; i < 3; i++) {
          const px = kx + 10 + i * 22;
          g.fillStyle(0x4a4a4e, 1); g.fillCircle(px + 6, top + 30, 7);
          rect(px + 5, top + 18, 2, 6, 0x3a3a3c);
        }
        break;
      }
      case 'espresso': {
        const kx = ox + Math.round(W * 0.58);
        for (let i = 0; i < 4; i++) rect(kx + i * 26, top + 8, 18, 3, 0x6a4a2a);
        for (let i = 0; i < 8; i++) {
          const cx = kx + 4 + (i % 4) * 26 + (i > 3 ? 6 : 0), cy = top + (i > 3 ? 26 : 2);
          rect(cx, cy, 8, 6, i % 2 ? 0xf0ece0 : 0xc8a070);
        }
        rect(kx + 110, top + 6, 40, 30, 0xb8bcc0); rect(kx + 114, top + 10, 32, 8, 0x3a3a3e);
        break;
      }
      case 'bottles': {
        const kx = ox + Math.round(W * 0.56), kw = Math.round(W * 0.42);
        for (const sy of [top + 12, top + 34]) {
          rect(kx, sy + 14, kw, 3, 0x3a2414);
          for (let x = 4; x < kw - 6; x += 9) {
            const col = [0x3a8a4a, 0x8a5a2a, 0xe8e0c8, 0x5a7ab0, 0xb03a3a][Math.floor(hash(x, sy) * 5)]!;
            rect(kx + x, sy, 5, 14, col); rect(kx + x + 1, sy - 4, 3, 4, tone(col, 0.7));
          }
        }
        break;
      }
      case 'window': {
        const wx = ox + 70, ww = 70, wh = wallH - 46;
        rect(wx - 3, top - 1, ww + 6, wh + 6, 0x4a3a2a);
        for (let y = 0; y < wh; y += 2) for (let x = 0; x < ww; x += 2) dot(wx + x, top + 2 + y, hash(x, y) > 0.8 ? 0xcfe8f5 : 0xaed4ea);
        rect(wx + ww / 2 - 1, top + 2, 2, wh, 0x4a3a2a);
        break;
      }
      case 'shutter': {
        // 위판장 — 걷어 올린 셔터 두 짝(벽 위쪽 롤)
        for (const sx of [ox + 40, ox + W - 220]) {
          rect(sx, top - 4, 150, 16, 0x6a747c);
          for (let x = 0; x < 150; x += 2) dot(sx + x, top + 4, 0x4a545c);
        }
        break;
      }
      case 'notice': {
        // 경매 시간 칠판 — 숫자 대신 칸만
        const nx = ox + Math.round(W * 0.34), nw = 90, nh = wallH - 40;
        rect(nx - 3, top - 3, nw + 6, nh + 6, 0xd8dce0);
        rect(nx, top, nw, nh, 0x2a4a3a);
        for (let r = 0; r < 4; r++) {
          rect(nx + 6, top + 6 + r * 9, 22, 2, 0xe8ecd8);
          rect(nx + 36, top + 6 + r * 9, 44, 2, r % 2 ? 0xf0d070 : 0xe8ecd8);
        }
        break;
      }
    }
  }
}

// ── 집기 ─────────────────────────────────────────────

/** 집기 그림이 발자리(footprint) 위로 솟는 높이(px) */
const RISE: Record<FixtureArt, number> = {
  wall_shelf: 40, cooler: 46, gondola: 22, counter: 22, back_shelf: 34, stock_boxes: 22,
  table: 10, chair: 16, fish_tank: 30, plant: 32, barrel: 14, book_shelf: 40,
  rod_rack: 54, lure_wall: 40, bait_fridge: 36, display_table: 10, ice_chest: 8,
  reception: 20, partition: 40, bench: 10, exam_bed: 44, med_cabinet: 44, scale: 6, water_cooler: 32,
  crate_row: 6, podium: 26, ice_pile: 10, hand_cart: 14,
};

export function fixtureRise(art: FixtureArt): number { return RISE[art]; }

/**
 * 집기 한 개를 굽는다. 텍스처 원점(0,0) = 발자리 왼쪽 위에서 `rise`만큼 위.
 * @returns 텍스처 키
 */
export function bakeFixture(scene: Phaser.Scene, L: InteriorLayout, f: FixtureDef): string {
  const key = `interior_fx_${L.key}_${f.id}`;
  if (scene.textures.exists(key)) return key;
  const w = f.fw * L.it, h = f.fh * L.it, rise = RISE[f.art];
  const g = scene.add.graphics();
  drawFixture(g, f.art, w, h, rise, L, f);
  g.generateTexture(key, w, h + rise);
  g.destroy();
  return key;
}

function drawFixture(g: Phaser.GameObjects.Graphics, art: FixtureArt, w: number, h: number, rise: number, L: InteriorLayout, f: FixtureDef): void {
  const { dot, rect } = mk(g);
  const H = h + rise;
  const goods = L.goods;
  const pick = (i: number, j: number): number => goods[Math.floor(hash(i, j, f.id.length * 977) * goods.length)]!;
  const shadow = (x: number, y: number, ww: number): void => { g.fillStyle(0x000000, 0.18); g.fillRect(x, y, ww, 4); };
  /** 진열 칸 한 줄 — 작은 상품 블록 */
  const goodsRow = (x0: number, y0: number, ww: number, hh: number, seed: number): void => {
    for (let x = x0 + 2; x < x0 + ww - 6; x += 7) {
      const ph = hh - 2 - Math.floor(hash(x, seed) * 4) * 2;
      const col = pick(x, seed);
      rect(x, y0 + hh - ph, 5, ph, col);
      rect(x, y0 + hh - ph, 5, 2, tone(col, 1.25));
    }
  };
  switch (art) {
    case 'wall_shelf':
    case 'book_shelf':
    case 'back_shelf': {
      const frame = art === 'book_shelf' ? 0x6a4428 : art === 'back_shelf' ? 0x5a5a62 : 0x8a8a84;
      rect(0, 0, w, H - 4, frame);
      rect(3, 3, w - 6, H - 10, tone(frame, 0.55));
      const shelves = Math.max(2, Math.floor((H - 10) / 16));
      const sh = Math.floor((H - 10) / shelves);
      for (let s = 0; s < shelves; s++) {
        const y = 3 + s * sh;
        if (art === 'book_shelf') {
          for (let x = 5; x < w - 8; x += 6) { const col = [0xb04a3a, 0x3a6ea5, 0x3f9e63, 0xc2913a, 0xe8e0c8][Math.floor(hash(x, s) * 5)]!; rect(x, y + 3, 4, sh - 5, col); }
        } else {
          goodsRow(4, y + 1, w - 8, sh - 4, s * 13 + (art === 'back_shelf' ? 7 : 0));
        }
        rect(3, y + sh - 3, w - 6, 3, tone(frame, 1.15));
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'cooler':
    case 'bait_fridge': {
      const body = art === 'cooler' ? 0xd8dce0 : 0xc8d8e0;
      rect(0, 0, w, H - 4, body);
      const doors = Math.max(1, Math.round(w / 48));
      const dw = Math.floor((w - 6) / doors);
      for (let d = 0; d < doors; d++) {
        const x = 3 + d * dw;
        rect(x, 4, dw - 3, H - 14, 0x8ab0c8);
        for (let s = 0; s < 4; s++) {
          const y = 6 + s * Math.floor((H - 18) / 4);
          for (let k = x + 3; k < x + dw - 8; k += 6) {
            const col = art === 'bait_fridge' ? [0x9a7a5a, 0xc0a080, 0x5a8a6a][Math.floor(hash(k, s) * 3)]! : pick(k, s + 50);
            rect(k, y + 2, 4, 7, col);
          }
          rect(x, y + 10, dw - 3, 1, 0xc8dce8);
        }
        rect(x + dw - 7, Math.round(H / 2) - 6, 2, 12, 0x5a646c);
        g.fillStyle(0xffffff, 0.18); g.fillRect(x + 2, 6, 4, H - 20);
      }
      rect(0, H - 10, w, 6, tone(body, 0.7));
      shadow(0, H - 4, w);
      break;
    }
    case 'gondola':
    case 'display_table': {
      const top = art === 'gondola' ? 0x9a9a92 : 0x6a5038;
      rect(0, 6, w, H - 10, tone(top, 0.75));
      rect(0, 0, w, Math.round(H * 0.55), top);
      if (art === 'gondola') {
        goodsRow(3, 2, w - 6, Math.round(H * 0.55) - 4, 33);
        goodsRow(3, Math.round(H * 0.55) + 2, w - 6, H - Math.round(H * 0.55) - 10, 71);
      } else {
        // 루어 · 소품 진열 — 작은 상자들
        for (let x = 6; x < w - 10; x += 12) for (let y = 4; y < Math.round(H * 0.55) - 6; y += 10) {
          rect(x, y, 9, 7, 0xe8e4d8); rect(x + 2, y + 2, 5, 3, pick(x, y));
        }
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'counter':
    case 'reception': {
      const wood = art === 'reception' ? (L.template === 'auction' ? 0x6a747c : 0xe8ece6) : (L.template === 'food' ? 0x7a4e2c : 0x9a9a92);
      const topC = art === 'reception' ? (L.template === 'auction' ? 0x9aa6ae : 0x8ac4a8) : (L.template === 'food' ? 0xb88a5a : 0xd8d4c8);
      rect(0, 0, w, H - 4, tone(wood, 0.8));
      rect(0, 0, w, Math.min(H - 8, rise + 10), topC);
      rect(0, Math.min(H - 8, rise + 10), w, 2, tone(topC, 0.7));
      for (let x = 4; x < w - 4; x += 12) for (let y = rise + 14; y < H - 6; y += 2) dot(x, y, tone(wood, 0.65));
      if (L.template !== 'food' && art === 'counter') {
        // 계산기(포스) — 계산대 위쪽
        const cx = Math.round(w / 2) - 10, cy = 4;
        rect(cx, cy, 20, 12, 0x2a2e34); rect(cx + 2, cy + 2, 16, 5, 0x6ad0a0);
      }
      if (art === 'reception' && L.template === 'auction') {
        // 위판 창구 — 유리 칸막이 + 서류 칸
        for (let x = 0; x < w; x += 2) dot(x, 0, 0xd8e8f0);
        for (let k = 8; k < w - 8; k += 30) rect(k, 4, 18, 8, 0xf0ece0);
      }
      if (art === 'reception' && L.template === 'clinic') {
        rect(10, 4, 16, 10, 0x2a2e34); rect(12, 6, 12, 5, 0x9ad8f0);
        rect(w - 30, 5, 18, 8, 0xf4f4f0);
      }
      if (L.template === 'food' && art === 'counter' && w > L.it) {
        for (let k = 10; k < w - 10; k += 40) { g.fillStyle(0xf0ece0, 1); g.fillCircle(k + 8, 8, 6); rect(k + 4, 6, 8, 3, pick(k, 3)); }
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'stock_boxes': {
      for (let i = 0; i < Math.floor(w / 22); i++) {
        const x = 2 + i * 22, bh = 18 + Math.floor(hash(i, 4) * 3) * 6;
        rect(x, H - 4 - bh, 20, bh, 0xc09a62);
        rect(x, H - 4 - bh, 20, 3, 0xd8b47a);
        rect(x + 8, H - 4 - bh, 4, bh, 0xa8844e);
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'table': {
      const wood = L.floor === 'dark_wood' ? 0x8a5a34 : 0xc8986a;
      rect(2, 0, w - 4, h - 8, wood);
      rect(2, 0, w - 4, 3, tone(wood, 1.15));
      rect(2, h - 10, w - 4, 4, tone(wood, 0.7));
      rect(6, h - 6, 4, 6 + rise - 4, tone(wood, 0.55)); rect(w - 10, h - 6, 4, 6 + rise - 4, tone(wood, 0.55));
      // 물컵 · 수저통
      g.fillStyle(0xd8eef8, 0.9); g.fillCircle(14, 12, 4);
      rect(w - 22, 6, 8, 10, 0x8a6a4a);
      shadow(4, H - 4, w - 8);
      break;
    }
    case 'chair': {
      const wood = L.floor === 'dark_wood' ? 0x6a4428 : 0xa87a4a;
      rect(8, rise, w - 16, h - 18, wood);
      rect(8, rise, w - 16, 3, tone(wood, 1.2));
      rect(10, rise + h - 18, 4, 12, tone(wood, 0.6)); rect(w - 14, rise + h - 18, 4, 12, tone(wood, 0.6));
      // 등받이(아래쪽 — 위를 보고 앉는다)
      rect(8, rise + h - 22, w - 16, 6, tone(wood, 0.8));
      shadow(8, H - 4, w - 16);
      break;
    }
    case 'bench': {
      const seat = 0x5a8ab0;
      rect(2, 0, w - 4, 8, tone(seat, 0.75));
      rect(2, 8, w - 4, h - 14, seat);
      for (let x = 4; x < w - 4; x += Math.round(L.it)) rect(x + L.it - 6, 8, 2, h - 14, tone(seat, 0.7));
      rect(6, h - 6, 4, 6 + rise - 6, 0x6a6a70); rect(w - 10, h - 6, 4, 6 + rise - 6, 0x6a6a70);
      shadow(2, H - 4, w - 4);
      break;
    }
    case 'fish_tank': {
      rect(0, 0, w, H - 4, 0x3a4a54);
      rect(3, 3, w - 6, H - 16, 0x2a7aa8);
      for (let y = 3; y < H - 13; y += 2) for (let x = 3; x < w - 3; x += 2) if (hash(x, y) > 0.92) dot(x, y, 0x5ab0d8);
      for (let i = 0; i < Math.floor(w / 26); i++) {
        const fx = 10 + i * 26 + Math.floor(hash(i, 2) * 8), fy = 10 + Math.floor(hash(i, 6) * (H - 34));
        rect(fx, fy, 12, 4, 0xc8b490); rect(fx - 3, fy - 1, 3, 6, 0xb09a7a); dot(fx + 10, fy, 0x1a1a1a);
      }
      rect(3, H - 14, w - 6, 4, 0xd8c8a0);
      g.fillStyle(0xffffff, 0.14); g.fillRect(6, 4, 4, H - 20);
      shadow(0, H - 4, w);
      break;
    }
    case 'plant': {
      rect(w / 2 - 10, H - 20, 20, 16, 0xb0603a); rect(w / 2 - 12, H - 22, 24, 4, 0xc8784a);
      for (let i = 0; i < 26; i++) {
        const a = hash(i, 1) * Math.PI * 2, r = 4 + hash(i, 2) * 14;
        rect(Math.round(w / 2 + Math.cos(a) * r) - 2, Math.round(H - 30 - Math.abs(Math.sin(a)) * r * 1.2), 5, 4, i % 3 ? 0x3a8a4a : 0x5aa85a);
      }
      shadow(w / 2 - 12, H - 4, 24);
      break;
    }
    case 'barrel': {
      rect(6, 0, w - 12, H - 4, 0x8a5a2c);
      for (let x = 6; x < w - 6; x += 8) rect(x, 0, 2, H - 4, 0x6a4220);
      rect(4, 4, w - 8, 4, 0x4a4a4e); rect(4, H - 14, w - 8, 4, 0x4a4a4e);
      g.fillStyle(0xa8743e, 1); g.fillEllipse(w / 2, 4, w - 14, 8);
      shadow(6, H - 4, w - 12);
      break;
    }
    case 'rod_rack': {
      rect(0, H - 14, w, 10, 0x5a3a20);
      rect(0, 6, w, 4, 0x5a3a20);
      for (let x = 8; x < w - 6; x += 9) {
        const col = [0x2a2e3a, 0x8a2a2a, 0x2a5a8a, 0x3a3a3a, 0x6a6a2a][Math.floor(hash(x, 1) * 5)]!;
        rect(x, 0, 2, H - 14, col);
        rect(x - 1, H - 26, 4, 8, 0x1a1a1e);
        rect(x + 2, H - 28, 4, 5, 0x9aa4ac);   // 릴 시트
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'lure_wall': {
      rect(0, 0, w, H - 4, 0xd8c8a8);
      for (let y = 4; y < H - 8; y += 6) for (let x = 4; x < w - 4; x += 6) dot(x, y, 0xa8987a);
      for (let y = 6; y < H - 14; y += 12) for (let x = 6; x < w - 10; x += 12) {
        rect(x + 2, y, 2, 3, 0x6a6a6a);
        rect(x, y + 3, 7, 6, 0xf0f0ea); rect(x + 1, y + 4, 5, 4, pick(x, y));
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'ice_chest': {
      rect(2, rise, w - 4, h - 8, 0x3a8ad0);
      rect(2, rise, w - 4, 10, 0xe8eef2);
      rect(w / 2 - 6, rise + 3, 12, 4, 0x9aa4ac);
      shadow(2, H - 4, w - 4);
      break;
    }
    case 'partition': {
      rect(w / 2 - 6, 0, 12, H - 4, 0xc8ccc8);
      for (let y = 4; y < H - 8; y += 6) dot(w / 2 - 2, y, 0xa8aca8);
      rect(w / 2 - 8, H - 10, 16, 6, 0x8a8e8a);
      shadow(w / 2 - 8, H - 4, 16);
      break;
    }
    case 'exam_bed': {
      // 커튼 레일 + 반쯤 친 커튼 + 침대
      rect(0, 0, w, 3, 0x9aa4ac);
      for (let x = 0; x < Math.round(w * 0.35); x += 4) rect(x, 3, 3, H - 30, x % 8 ? 0xb8e0d0 : 0xa0d0be);
      rect(Math.round(w * 0.25), rise + 4, Math.round(w * 0.72), h - 14, 0xe8ecef);
      rect(Math.round(w * 0.25), rise + 4, 18, h - 14, 0xf8f8f8);
      rect(Math.round(w * 0.25), rise + h - 12, Math.round(w * 0.72), 4, 0x8a9aa4);
      shadow(Math.round(w * 0.25), H - 4, Math.round(w * 0.72));
      break;
    }
    case 'med_cabinet': {
      rect(0, 0, w, H - 4, 0xf0f2ee);
      rect(3, 3, w - 6, H - 14, 0xc8dce4);
      const shelves = 3, sh = Math.floor((H - 16) / shelves);
      for (let s = 0; s < shelves; s++) {
        for (let x = 6; x < w - 8; x += 7) {
          const col = pick(x, s + 9);
          rect(x, 5 + s * sh + 4, 5, sh - 6, col);
          rect(x + 1, 5 + s * sh + 2, 3, 2, 0xffffff);
        }
        rect(3, 3 + (s + 1) * sh, w - 6, 2, 0xa8b8c0);
      }
      // 초록 십자
      rect(w - 18, 6, 10, 2, 0x3aaa6a); rect(w - 14, 2, 2, 10, 0x3aaa6a);
      shadow(0, H - 4, w);
      break;
    }
    case 'scale': {
      rect(4, rise, w - 8, h - 10, 0x9aa4ac);
      rect(8, rise + 4, w - 16, h - 18, 0xd8dce0);
      rect(w / 2 - 6, rise + 6, 12, 6, 0x2a2e34);
      shadow(4, H - 4, w - 8);
      break;
    }
    case 'water_cooler': {
      rect(w / 2 - 10, 12, 20, H - 16, 0xe8ecef);
      g.fillStyle(0x7ac8f0, 0.85); g.fillRoundedRect(w / 2 - 9, 0, 18, 18, 4);
      rect(w / 2 - 4, 26, 8, 4, 0x3a8ad0);
      shadow(w / 2 - 10, H - 4, 20);
      break;
    }
    case 'crate_row': {
      // 고기 상자(파랑 · 빨강 바구니) + 얼음 + 고기
      const n = Math.max(1, Math.floor(w / 36));
      const cw = Math.floor(w / n);
      for (let i = 0; i < n; i++) {
        const x = i * cw + 2, col = i % 3 === 1 ? 0xc84a3a : 0x3a7ad0;
        rect(x, rise + 4, cw - 4, h - 10, col);
        rect(x + 3, rise + 6, cw - 10, h - 16, 0xdde8ee);
        for (let k = 0; k < 2; k++) {
          const fx = x + 6 + k * 12, fy = rise + 10 + k * 6;
          rect(fx, fy, 14, 5, k ? 0x8a9aa8 : 0xb8a888); dot(fx + 12, fy + 1, 0x1a1a1a);
        }
        for (let y = rise + 4; y < rise + h - 6; y += 4) dot(x, y, tone(col, 0.7));
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'podium': {
      // 경매대 — 낮은 단 + 앞쪽 교탁(경매사의 다리를 가린다)
      rect(0, rise + 10, w, h - 14, 0x5a646c);
      rect(0, rise + 10, w, 4, 0x7a848c);
      for (let x = 4; x < w; x += 10) rect(x, rise + 16, 2, h - 22, 0x48525a);
      const lx = Math.round(w * 0.3), lw = Math.round(w * 0.4);
      rect(lx, Math.round(rise + h * 0.45), lw, Math.round(h * 0.55) - 4, 0x3a4a5a);
      rect(lx - 2, Math.round(rise + h * 0.45), lw + 4, 5, 0x5a6a7a);
      rect(lx + lw / 2 - 6, Math.round(rise + h * 0.45) + 10, 12, 8, tone(L.accent, 1.2));
      shadow(0, H - 4, w);
      break;
    }
    case 'ice_pile': {
      for (let i = 0; i < 40; i++) {
        const x = Math.round(hash(i, 1) * (w - 10)), y = rise - 6 + Math.round(hash(i, 2) * (h - 4));
        rect(x, y, 8, 6, hash(i, 3) > 0.5 ? 0xe8f4fa : 0xc8e2f0);
        dot(x + 2, y + 1, 0xffffff);
      }
      shadow(0, H - 4, w);
      break;
    }
    case 'hand_cart': {
      rect(4, rise, w - 8, h - 14, 0x3a7ad0);
      rect(4, rise, w - 8, 3, 0x5a9ae8);
      rect(w - 8, rise - 12, 3, 14, 0x6a6a70);
      g.fillStyle(0x1a1a1e, 1); g.fillCircle(10, H - 8, 4); g.fillCircle(w - 10, H - 8, 4);
      shadow(4, H - 4, w - 8);
      break;
    }
  }
}
