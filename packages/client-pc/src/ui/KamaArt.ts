/**
 * @file KamaArt.ts
 * @description 333차 — **가마살 공정 도마 그림**(방어류 · 다랑어류 · 새치류의 큰 개체 — core `yieldsKama`)
 *
 * 사용자 설명(2026-11-20): 가마살 부분 = 「머리 아가미쪽 잘려진 부분(방혈 때 칼이 지나갔던 자리)과 머리따기 사선 … 사이의 살 덩어리」,
 * 그 덩이에서 「가슴 지느러미 바로 아래 부분의 넓은 삼각형 부분 … (내장을 감쌌던 부분)만 도려내서 회로」 먹는다.
 *
 * 두 뷰:
 *  ① **가마살 떼기**(`kama_a` · `kama_b`) — 떼어 낸 머리(가마살 덩이가 붙어 있다)를 원래 자리에 또렷이 두고 몸통은 흐리게 가린다.
 *     유도선이 온마리 그림 좌표 그대로라 F9 [확정] · 「군 확정」이 다른 옆면 단계와 같은 식으로 옮겨진다.
 *     뗀 면의 덩이 자리는 반대쪽 덩이의 안쪽 살이 보이고, 두 면 다 떼면 비어 도마가 보인다.
 *  ② **가마살 도려내기**(`ktrim_1` · `ktrim_2`) — 덩이 둘을 키워(`KamaGeometry.viewScale` — 칸이 정수 px) 자리(`KAMA_BLOCK_SLOTS`)에 늘어놓는다.
 *     껍질 쪽이 위다 — 가슴지느러미가 보여야 「그 아래」를 가를 수 있다.
 *
 * 그림은 따로 굽지 않는다 — 그 어종 온마리 그림의 칸을 머리 절단 영역(`prepEraseFor`) · 덩이 다각형(`KamaGeometry.poly`)으로 가른다.
 * 그래서 머리따기 사선 · 방혈 호를 [확정]으로 옮기면 덩이 모양도 따라온다.
 */
import Phaser from 'phaser';
import { KAMA_BLOCK_SLOTS, type CutPoint, type KamaGeometry } from '@tra/core';
import {
  computeFishFrame, drawPixelButcherFish, prepEraseFor, fishPolyContains, tintColor, SPRITE_PALETTE_CHARS,
  type ButcherSpriteSet, type FishPoly, type PixelFishFrame, type PixelFishGeom, type PixelFishState,
} from './PixelButcherFish.js';
import { loinLook } from './LoinArt.js';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';

export type KamaSide = 'a' | 'b';

/** 밑손질 상태 가운데 덩이 모양에 닿는 것 — 머리 절단선(면마다 · 그려진 생선 rect 정규화) · 그은 지느러미 칼선 */
export interface KamaPrep {
  headPaths: Record<KamaSide, FishPoly | undefined>;
  finsOff: boolean;
  finCutPaths?: FishPoly[];
  /** 가슴지느러미 칸 표(그림 열 · 행 — 미러 전 · `pectoralFinMask`) — 머리따기 사선 뒤로 넘어간 지느러미도 덩이에 붙여 그린다 */
  finMask?: Uint8Array | null;
}

// ────────────────────────────────────────────────────────────
// 가슴지느러미 — 가마살과 함께 떨어져 나간다
// ────────────────────────────────────────────────────────────

const lum = (c: number): number => 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);
const finMaskCache = new WeakMap<PixelFishSprite, Map<string, Uint8Array | null>>();
const finlessCache = new WeakMap<Uint8Array, PixelFishSprite>();

/**
 * **가슴지느러미 칸 찾기** — 온마리 그림에서 가슴지느러미는 몸 위에 겹쳐 그려져 있다(밑동 선 뒤로 뻗은 어두운 날개).
 * 머리따기 사선은 지느러미 밑동 바로 뒤를 지나므로 지느러미 끝은 사선 너머 몸통 그림 위에 남는다 —
 * 실제로는 가마살에 붙어 함께 떨어진다. 그 칸들을 찾아 덩이 쪽에 붙이고(`KamaPrep.finMask`) 몸통에서는 메운다(`withoutPectoralFin`).
 *
 * 찾는 법: 밑동 선 뒤 창(가로 = 그림 폭의 30% · 세로 = 밑동 높이 + 아래 여유)에서 줄마다 「그 줄 몸 빛(밝기 75% 자리)보다 뚜렷이 어두운 칸」을 고르고,
 * 밑동 선에 닿은 덩어리만 남긴다(4-이웃). 등 쪽 어두운 줄은 줄 전체가 어두워 걸리지 않는다. 너무 크거나(그림의 5% 넘게) 작으면 없는 것으로 본다.
 * @param base 가슴지느러미 밑동 선(그려진 생선 rect 정규화 — 1면 · 머리 왼쪽)
 */
export function pectoralFinMask(spr: PixelFishSprite, base: readonly { x: number; y: number }[] | undefined): Uint8Array | null {
  if (!base || base.length < 2) return null;
  const key = JSON.stringify(base);
  let per = finMaskCache.get(spr);
  if (!per) { per = new Map(); finMaskCache.set(spr, per); }
  const hit = per.get(key);
  if (hit !== undefined) return hit;
  const W = spr.w, H = spr.h;
  const pts = base.map((p) => ({ x: p.x * W, y: p.y * H })).sort((a, b) => a.y - b.y);
  const yT = pts[0].y, yB = pts[pts.length - 1].y;
  /** 밑동 선의 그 줄 x(끝 너머는 끝 토막을 늘인다) */
  const xAt = (y: number): number => {
    for (let i = 1; i < pts.length; i++) {
      if (y <= pts[i].y || i === pts.length - 1) {
        const a = pts[i - 1], b = pts[i], dy = b.y - a.y;
        return dy < 1e-6 ? a.x : a.x + (b.x - a.x) * (y - a.y) / dy;
      }
    }
    return pts[0].x;
  };
  const colorAt = (c: number, r: number): number => {
    const ch = spr.rows[r]?.[c];
    return !ch || ch === '.' ? -1 : (spr.palette[SPRITE_PALETTE_CHARS.indexOf(ch)] ?? 0);
  };
  const r0 = Math.max(0, Math.floor(yT) - 1), r1 = Math.min(H - 1, Math.ceil(yB) + Math.round(H * 0.1));
  const span = Math.round(W * 0.3), refSpan = Math.round(W * 0.42);
  const dark = new Uint8Array(W * H);
  for (let r = r0; r <= r1; r++) {
    const xb = Math.round(xAt(r + 0.5));
    const ls: number[] = [];
    for (let c = xb + 1; c <= Math.min(W - 1, xb + refSpan); c++) { const col = colorAt(c, r); if (col >= 0) ls.push(lum(col)); }
    if (ls.length < 6) continue;
    ls.sort((a, b) => a - b);
    const ref = ls[Math.floor(ls.length * 0.75)];
    for (let c = Math.max(0, xb - 1); c <= Math.min(W - 1, xb + span); c++) {
      const col = colorAt(c, r);
      if (col >= 0 && lum(col) < ref - 26) dark[r * W + c] = 1;
    }
  }
  // 밑동 선에 닿은 덩어리만(4-이웃)
  const mask = new Uint8Array(W * H);
  const stack: number[] = [];
  for (let r = Math.max(r0, Math.floor(yT)); r <= Math.min(r1, Math.ceil(yB)); r++) {
    const xb = Math.round(xAt(r + 0.5));
    for (let c = Math.max(0, xb - 1); c <= Math.min(W - 1, xb + 4); c++) {
      const i = r * W + c;
      if (dark[i] && !mask[i]) { mask[i] = 1; stack.push(i); }
    }
  }
  let area = 0;
  while (stack.length) {
    const i = stack.pop() as number; area++;
    const x = i % W, y = (i - x) / W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
      if (j >= 0 && dark[j] && !mask[j]) { mask[j] = 1; stack.push(j); }
    }
  }
  const out = area >= 6 && area <= W * H * 0.05 ? mask : null;
  per.set(key, out);
  return out;
}

/**
 * 가슴지느러미를 메운 온마리 그림 — 지느러미 칸마다 그 줄의 뒤쪽(꼬리 쪽) 첫 몸 칸 빛으로 바꾼다(생선 몸 빛은 줄을 따라 흐른다).
 * 실루엣은 그대로라 틀 · 몸통 열 · 유도선에는 닿지 않는다. 머리 · 가마살이 떨어져 나간 뒤의 몸통을 그릴 때 쓴다.
 */
export function withoutPectoralFin(spr: PixelFishSprite, mask: Uint8Array | null): PixelFishSprite {
  if (!mask) return spr;
  const hit = finlessCache.get(mask);
  if (hit) return hit;
  const W = spr.w;
  const rows = spr.rows.map((row, r) => {
    let any = false;
    for (let c = 0; c < W; c++) if (mask[r * W + c]) { any = true; break; }
    if (!any) return row;
    const chars = row.split('');
    for (let c = W - 1; c >= 0; c--) {
      if (!mask[r * W + c]) continue;
      let k = c + 1;
      while (k < W && (mask[r * W + k] || chars[k] === '.')) k++;
      if (k >= W) { k = c - 1; while (k >= 0 && (mask[r * W + k] || chars[k] === '.')) k--; }
      if (k >= 0 && k < W) chars[c] = chars[k];
    }
    return chars.join('');
  });
  const out: PixelFishSprite = { ...spr, rows };
  finlessCache.set(mask, out);
  return out;
}

/** 칸 분류 — 0 없음 · 1 머리 조각(가마살 밖) · 2 가마살 덩이 · 3 덩이에 붙은 가슴지느러미(머리따기 사선 뒤로 넘어간 칸) */
interface SideCells { kind: Uint8Array; W: number; H: number; mirror: boolean }

const prepState = (o: 'BASE' | 'FLIP', p: Partial<PixelFishState>): PixelFishState => ({
  orientation: o, headOff: false, gutted: false, scaledSides: 0, hasScales: false, finished: false,
  currentPullsLeft: 0, anusRatio: 0.5, ...p,
});

/** 도마 정규화 점 → 그려진 생선 rect 정규화(머리 절단선 · 지우기 다각형과 같은 좌표) */
const toFrame = (geom: PixelFishGeom, f: PixelFishFrame) => (p: CutPoint): { x: number; y: number } => ({
  x: (geom.x + p.x * geom.w - f.ox) / f.dw, y: (geom.y + p.y * geom.h - f.oy) / f.dh,
});

/** 분류 캐시 — 도마는 프레임마다 다시 그려질 수 있다(연출 중). 그림 · 면 · 선이 같으면 같은 표다 */
const cellCache = new Map<string, SideCells>();

/** 그 면에서 본 온마리 그림의 칸을 머리 조각 · 가마살 덩이로 가른다(지운 지느러미는 뺀다) */
function classifySide(
  sprites: ButcherSpriteSet, side: KamaSide, prep: KamaPrep, kamaPoly: FishPoly,
): SideCells {
  const spr = sprites.whole, W = spr.w, H = spr.h;
  const key = `${sprites.speciesId ?? sprites.familyKey}|${W}x${H}|${spr.rows[H >> 1]}|${side}|${prep.finMask ? 'f' : '-'}|${JSON.stringify([prep.headPaths[side], prep.finsOff, prep.finCutPaths, kamaPoly])}`;
  const hit = cellCache.get(key);
  if (hit) return hit;
  const o = side === 'a' ? 'BASE' : 'FLIP';
  const mirror = side === 'b';
  const headPolys = prepEraseFor(sprites, prepState(o, { headOff: true, headCutPath: prep.headPaths[side], finsOff: false, finCutPaths: [] }), o);
  const finPolys = prepEraseFor(sprites, prepState(o, { headOff: false, finsOff: prep.finsOff, finCutPaths: prep.finCutPaths }), o);
  const kind = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) {
    const row = spr.rows[r];
    for (let c = 0; c < W; c++) {
      if (row[c] === '.') continue;
      const px = ((mirror ? W - 1 - c : c) + 0.5) / W, py = (r + 0.5) / H;
      if (!headPolys.some((poly) => fishPolyContains(px, py, poly))) {
        if (prep.finMask?.[r * W + c]) kind[r * W + c] = 3;   // 사선 뒤로 넘어간 가슴지느러미 — 덩이에 붙어 있다
        continue;
      }
      if (finPolys.some((poly) => fishPolyContains(px, py, poly))) continue;
      kind[r * W + c] = fishPolyContains(px, py, kamaPoly) || prep.finMask?.[r * W + c] ? 2 : 1;
    }
  }
  const out: SideCells = { kind, W, H, mirror };
  if (cellCache.size > 24) cellCache.clear();
  cellCache.set(key, out);
  return out;
}

/** 선분들까지의 거리(칸 단위) */
function distToPath(x: number, y: number, pts: readonly { x: number; y: number }[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy;
    const u = L2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / L2)) : 0;
    best = Math.min(best, Math.hypot(x - (a.x + vx * u), y - (a.y + vy * u)));
  }
  return best;
}

/** 팔레트(어종 그림이 아니면 어종 색을 약하게 — 도마와 같은 규칙) */
function paletteOf(sprites: ButcherSpriteSet, tint: number | null): number[] {
  const t = sprites.wholeNative || sprites.nativeColor ? null : tint;
  return sprites.whole.palette.map((c) => (t !== null ? tintColor(c, t, 0.22) : c));
}

/** 한 줄의 같은 색 칸을 이어 칠한다 — `colorAt`이 -1이면 건너뛴다 */
function fillRuns(
  g: Phaser.GameObjects.Graphics, n: number, colorAt: (i: number) => number,
  rect: (i0: number, len: number) => { x: number; y: number; w: number; h: number }, alpha = 1,
): void {
  let i = 0;
  while (i < n) {
    const col = colorAt(i);
    if (col < 0) { i++; continue; }
    let len = 1;
    while (i + len < n && colorAt(i + len) === col) len++;
    const q = rect(i, len);
    g.fillStyle(col, alpha);
    g.fillRect(q.x, q.y, q.w, q.h);
    i += len;
  }
}

// ────────────────────────────────────────────────────────────
// ① 가마살 떼기 — 떼어 낸 머리
// ────────────────────────────────────────────────────────────

export interface KamaHeadState {
  speciesId: string;
  geo: KamaGeometry;
  /** 면마다 가마살을 뗐는가 */
  off: Record<KamaSide, boolean>;
  prep: KamaPrep;
  /** 몸통을 흐리게 덮을 도마 안쪽 rect */
  veil: { x: number; y: number; w: number; h: number };
}

/**
 * 떼어 낸 머리 뷰 — 몸통(머리 없는 옆면)을 그리고 도마 색으로 흐리게 덮은 뒤, 머리 조각을 제자리에 또렷이 그린다.
 * `fish.orientation`이 보이는 면이다(BASE = 1면 · FLIP = 2면).
 */
export function drawKamaHead(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom, sprites: ButcherSpriteSet, tint: number | null,
  fish: PixelFishState, st: KamaHeadState, bodySprites: ButcherSpriteSet = sprites,
): void {
  drawPixelButcherFish(g, geom, tint, fish, bodySprites);
  g.fillStyle(0xa8845a, 0.66);
  g.fillRect(st.veil.x, st.veil.y, st.veil.w, st.veil.h);

  const vis: KamaSide = fish.orientation === 'FLIP' ? 'b' : 'a';
  const other: KamaSide = vis === 'a' ? 'b' : 'a';
  const f = computeFishFrame(sprites.whole, geom);
  const tf = toFrame(geom, f);
  const cells = classifySide(sprites, vis, st.prep, st.geo[vis].poly.map(tf));
  const spr = sprites.whole, { W, H, mirror, kind } = cells;
  const pal = paletteOf(sprites, tint);
  const L = loinLook(st.speciesId);
  // 잘린 단면 — 머리따기 사선 가까운 칸(칸 단위 거리)
  const headLine = (st.prep.headPaths[vis] ?? []).map((p) => ({ x: p.x * W, y: p.y * H }));
  // 뗀 덩이 자리의 가장자리(아가미 선 · 위 끝 칼집)
  const cutLine = st.geo[vis].cut.map(tf).map((p) => ({ x: p.x * W, y: p.y * H }));

  for (let r = 0; r < H; r++) {
    const row = spr.rows[r];
    const colorAt = (dc: number): number => {
      const c = mirror ? W - 1 - dc : dc;
      const k = kind[r * W + c];
      if (!k) return -1;
      if (k === 3) return st.off[vis] ? -1 : pal[SPRITE_PALETTE_CHARS.indexOf(row[c])] ?? 0x000000;   // 덩이에 붙은 가슴지느러미
      if (k === 2 && st.off[vis]) {
        if (st.off[other]) return -1;                       // 두 면 다 뗐다 — 빈 자리
        // 반대쪽 덩이의 안쪽 — 아가미 선 가까이는 그늘, 나머지는 뱃살 빛 + 지방 결
        const d = cutLine.length >= 2 ? distToPath(dc + 0.5, r + 0.5, cutLine) : 9;
        if (d < 1.6) return L.fleshDark;
        return (dc + r * 2) % 7 === 0 ? L.fat : (dc + r) % 2 ? L.belly : L.flesh;
      }
      if (headLine.length >= 2) {
        const d = distToPath(dc + 0.5, r + 0.5, headLine);
        if (d < 1.1) return L.fleshDark;
        if (d < 2.2) return L.flesh;
      }
      return pal[SPRITE_PALETTE_CHARS.indexOf(row[c])] ?? 0x000000;
    };
    fillRuns(g, W, colorAt, (i0, len) => ({ x: f.ox + i0 * f.cell, y: f.oy + r * f.cell, w: len * f.cell, h: f.cell }));
  }
}

// ────────────────────────────────────────────────────────────
// ② 가마살 도려내기 — 덩이 둘
// ────────────────────────────────────────────────────────────

export interface KamaBlockView {
  /** 도마 위에 있는가(도려냈거나 이 세션 대상이 아니면 false) */
  present: boolean;
  /** 지금 작업 중인 덩이 */
  active: boolean;
  /** 도려낸 직후(연출 동안) — 뱃살 쪽을 조금 떼어 그린다 */
  carved: boolean;
}
export interface KamaBlocksState {
  speciesId: string;
  geo: KamaGeometry;
  prep: KamaPrep;
  blocks: Record<KamaSide, KamaBlockView>;
}

/** 꺾은선의 x 자리 y(끝 너머는 끝점 높이) */
function lineYAtX(line: readonly CutPoint[], x: number): number {
  const pts = [...line].sort((p, q) => p.x - q.x);
  if (x <= pts[0].x) return pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x;
      return dx < 1e-6 ? b.y : a.y + (b.y - a.y) * (x - a.x) / dx;
    }
  }
  return pts[pts.length - 1].y;
}

/** 덩이 뷰 — 덩이 둘을 자리에 키워 그린다(껍질 쪽 · 잘린 가장자리는 살빛) */
export function drawKamaBlocks(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom, sprites: ButcherSpriteSet, tint: number | null, st: KamaBlocksState,
): void {
  const f = computeFishFrame(sprites.whole, geom);
  const tf = toFrame(geom, f);
  const spr = sprites.whole;
  const pal = paletteOf(sprites, tint);
  const L = loinLook(st.speciesId);
  const s = st.geo.viewScale;
  const k = Math.max(1, Math.round(f.cell * s));   // 키운 칸(px — 정수)

  (['a', 'b'] as const).forEach((sd, idx) => {
    const v = st.blocks[sd];
    if (!v.present) return;
    const G = st.geo[sd], slot = KAMA_BLOCK_SLOTS[idx];
    const { kind, W, H, mirror } = classifySide(sprites, sd, st.prep, G.poly.map(tf));
    // 원래 자리의 칸(열 dc · 행 r) → 덩이 뷰 px: 가운데(`center`)가 자리(`slot`)로 가고 칸이 k px가 된다
    const ox = Math.round(geom.x + slot.x * geom.w + (f.ox - geom.x - G.center.x * geom.w) * s);
    const oy = Math.round(geom.y + slot.y * geom.h + (f.oy - geom.y - G.center.y * geom.h) * s);
    /** 칸 가운데의 도마 정규화 좌표(원래 자리) */
    const normOf = (dc: number, r: number): CutPoint => ({
      x: (f.ox + (dc + 0.5) * f.cell - geom.x) / geom.w, y: (f.oy + (r + 0.5) * f.cell - geom.y) / geom.h,
    });
    const kindAt = (dc: number, r: number): number => (dc >= 0 && r >= 0 && dc < W && r < H ? kind[r * W + (mirror ? W - 1 - dc : dc)] : 0);
    const isKama = (dc: number, r: number): boolean => kindAt(dc, r) >= 2;
    /** 머리 · 몸통과 맞닿았던 가장자리(잘린 면)인가 — 이웃이 그림 칸인데 덩이가 아니다 */
    const cutEdge = (dc: number, r: number): boolean => {
      if (kindAt(dc, r) !== 2) return false;               // 사선 뒤로 뻗은 지느러미는 잘린 면이 아니다
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const cc = dc + dx, rr = r + dy;
        if (cc < 0 || rr < 0 || cc >= W || rr >= H) continue;
        const c = mirror ? W - 1 - cc : cc;
        if (spr.rows[rr][c] !== '.' && kind[rr * W + c] < 2) return true;
      }
      return false;
    };
    const below = (dc: number, r: number): boolean => {
      const p = normOf(dc, r);
      return p.y > lineYAtX(G.carve, p.x);
    };
    const drop = v.carved ? Math.round(k * 2.5) : 0;   // 도려낸 뱃살 쪽은 조금 아래로 떼어 그린다
    const list: { x: number; y: number; col: number }[] = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let r = 0; r < H; r++) {
      const row = spr.rows[r];
      for (let dc = 0; dc < W; dc++) {
        if (!isKama(dc, r)) continue;
        const px = ox + dc * k, py = oy + r * k + (drop && kindAt(dc, r) === 2 && below(dc, r) ? drop : 0);
        const col = cutEdge(dc, r) ? ((dc + r) % 5 === 0 ? L.fat : L.flesh)
          : pal[SPRITE_PALETTE_CHARS.indexOf(row[mirror ? W - 1 - dc : dc])] ?? 0x000000;
        list.push({ x: px, y: py, col });
        if (px < x0) x0 = px; if (py < y0) y0 = py; if (px + k > x1) x1 = px + k; if (py + k > y1) y1 = py + k;
      }
    }
    if (!list.length) return;
    // 도마에 닿은 그림자 → 덩이
    g.fillStyle(0x000000, 0.16);
    for (const q of list) g.fillRect(q.x + 4, q.y + 4, k, k);
    let last = -1;
    for (const q of list) {
      if (q.col !== last) { g.fillStyle(q.col, 1); last = q.col; }
      g.fillRect(q.x, q.y, k, k);
    }
    if (v.active) {
      g.lineStyle(1.5, 0xffd257, 0.55);
      g.strokeRoundedRect(x0 - 5, y0 - 4, x1 - x0 + 10, y1 - y0 + 8, 6);
    }
  });
}
