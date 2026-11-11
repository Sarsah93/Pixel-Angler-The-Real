/**
 * @file LoinArt.ts
 * @description 317차 — **4덩어리 해체**(참다랑어 · 대방어급) 도마 그림 · 결과물 그림.
 *
 * 사용자 지시 「참다랑어 · 대방어급 4덩어리 해체 진행해줘」(315 제안). 그림은 어종 온마리 스프라이트(`PixelFishSpecies`)를 바탕으로
 * 단계마다 파생한다 — 장어(`EelBoard`)처럼 **그림과 유도선이 한 윤곽**이다:
 *  - 측면(1면 = BASE · 2면 = FLIP): 머리 · 지느러미를 지운 몸통의 열마다 위 · 아래 끝과 옆줄(`LoinColumns`)을 재고,
 *    유도선(옆줄 · 등 가장자리 · 배 가장자리 · 중골 긁기)도 같은 열에서 굽는다(`loinSideGeometry` → core `ButcheryStageOptions.loin`).
 *    덩어리를 떼어 낸 반쪽은 그 자리에 **뼈대**(척추 · 가시)를 그린다 — 반대편 살이 아직 있으면 그 살 위에, 없으면 도마가 비친다.
 *  - 다듬기(FLESH_UP): 덩어리 넷을 도마에 늘어놓은 뷰. 모양 · 자리는 core `LOIN_BLOCKS` · `loinBlockEdges`(유도선과 같은 식).
 *  - 결과물 아이콘(`trimloin_*`) · 사쿠 회썰기 그림(`sakuart_*`)은 캔버스로 굽는다 — 세이브에 남은 키는 `ensureLoinTexture`가 되살린다.
 */
import Phaser from 'phaser';
import {
  LOIN_BLOCKS, loinBlockEdges, type CutPoint, type LoinPart, type LoinSideGeometry, type LoinSideLines,
} from '@tra/core';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';
import {
  computeFishFrame, prepEraseFor, fishPolyContains,
  type ButcherSpriteSet, type PixelFishGeom, type PixelFishState, type FishPoly,
} from './PixelButcherFish.js';

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

// ────────────────────────────────────────────────────────────
// 색 — 참다랑어(짙은 붉은살 · 토로) / 방어류(분홍빛 살)
// ────────────────────────────────────────────────────────────
interface LoinLook {
  flesh: number; fleshDark: number; fleshLight: number;
  belly: number; fat: number;
  chiai: number; chiaiDark: number;
  skinBack: number; skinBelly: number;
  bone: number; boneDark: number; remnant: number;
}
const TUNA: LoinLook = {
  flesh: 0xa3202a, fleshDark: 0x7c141c, fleshLight: 0xc23a3e,
  belly: 0xe08c88, fat: 0xf6dcd4,
  chiai: 0x4e1016, chiaiDark: 0x340a0e,
  skinBack: 0x1f2c48, skinBelly: 0xc9d0d8,
  bone: 0xe9e2d0, boneDark: 0xbcb29c, remnant: 0x8a1c24,
};
const AMBERJACK: LoinLook = {
  flesh: 0xe49a88, fleshDark: 0xc87a6c, fleshLight: 0xf2b4a2,
  belly: 0xf0c2b2, fat: 0xfbe8de,
  chiai: 0x6a1820, chiaiDark: 0x4a0e14,
  skinBack: 0x55677a, skinBelly: 0xd6dce2,
  bone: 0xece6d6, boneDark: 0xc0b8a4, remnant: 0xb05a50,
};
export function loinLook(speciesId: string): LoinLook {
  return speciesId === 'bluefin_tuna' ? TUNA : AMBERJACK;
}
const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
const hash = (a: number, b: number): number => ((a * 73856093) ^ (b * 19349663)) >>> 0;

// ────────────────────────────────────────────────────────────
// 측면 — 몸통 열 기하
// ────────────────────────────────────────────────────────────

/** 몸통 열(스프라이트 칸 · BASE 기준) — c0 = 머리 쪽 절단면 다음 열 · c1 = 꼬리자루 */
export interface LoinColumns { c0: number; c1: number; top: number[]; bot: number[]; mid: number[] }

/**
 * 머리 · 지느러미를 지운 BASE 몸통에서 열마다 위 · 아래 끝을 잰다.
 * 꼬리자루 = 몸통 뒤쪽 절반 ~ 90% 구간에서 가장 낮은 열. 옆줄 = 위 끝에서 높이 48%(척추 높이).
 */
export function loinColumnsFor(sprites: ButcherSpriteSet, prep: PixelFishState): LoinColumns {
  const spr = sprites.whole;
  const erase = prepEraseFor(sprites, { ...prep, orientation: 'BASE' }, 'BASE');
  const top: number[] = [], bot: number[] = [], h: number[] = [];
  for (let c = 0; c < spr.w; c++) {
    let t = -1, b = -1;
    for (let r = 0; r < spr.h; r++) {
      if (spr.rows[r][c] === '.') continue;
      const px = (c + 0.5) / spr.w, py = (r + 0.5) / spr.h;
      if (erase.some((poly) => fishPolyContains(px, py, poly))) continue;
      if (t < 0) t = r;
      b = r;
    }
    top.push(t < 0 ? 0 : t); bot.push(t < 0 ? 0 : b + 1); h.push(t < 0 ? 0 : b + 1 - t);
  }
  const maxH = Math.max(1, ...h);
  let c0 = h.findIndex((v) => v >= maxH * 0.3);
  if (c0 < 0) c0 = 0;
  let cEnd = spr.w - 1;
  while (cEnd > c0 && h[cEnd] === 0) cEnd--;
  const len = cEnd - c0;
  let c1 = Math.round(c0 + len * 0.8), best = Infinity;
  for (let c = Math.round(c0 + len * 0.5); c <= Math.round(c0 + len * 0.9); c++) {
    if (h[c] > 0 && h[c] < best) { best = h[c]; c1 = c; }
  }
  // 옆줄(척추 높이) — 이웃 ±2열 평균으로 매끄럽게
  const raw = top.map((t, c) => t + (bot[c] - t) * 0.48);
  const mid = raw.map((_, c) => {
    let s = 0, n = 0;
    for (let k = -2; k <= 2; k++) { const j = c + k; if (j >= c0 && j <= c1 && h[j] > 0) { s += raw[j]; n++; } }
    return n ? s / n : raw[c];
  });
  return { c0: c0 + 1, c1, top, bot, mid };
}

/**
 * 해체 측면 유도선(도마 생선 틀 정규화) — 그림을 그리는 식(`computeFishFrame`)과 같은 자리.
 *  옆줄 = mid · 등 = 위 끝 + 높이 10% · 배 = 아래 끝 − 10% · 중골 긁기 = 2면 뼈대를 훑는 지그재그.
 *  2면(FLIP)은 그림이 좌우로 뒤집힌 자리(머리 오른쪽) — 칼은 늘 머리 쪽에서 꼬리 쪽으로.
 */
export function loinSideGeometry(sprites: ButcherSpriteSet, cols: LoinColumns, boardW: number, boardH: number): LoinSideGeometry {
  const spr = sprites.whole;
  const f = computeFishFrame(spr, { x: 0, y: 0, w: boardW, h: boardH });
  const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
  const pt = (c: number, row: number, mirror: boolean): CutPoint => ({
    x: r4((f.ox + ((mirror ? spr.w - 1 - c : c) + 0.5) * f.cell) / boardW),
    y: r4((f.oy + row * f.cell) / boardH),
  });
  const N = 7;
  const colAt = (k: number): number => Math.round(cols.c0 + (cols.c1 - 1 - cols.c0) * (k / (N - 1)));
  const lines = (mirror: boolean): LoinSideLines => {
    const mid: CutPoint[] = [], back: CutPoint[] = [], belly: CutPoint[] = [];
    for (let k = 0; k < N; k++) {
      const c = colAt(k), H = cols.bot[c] - cols.top[c];
      mid.push(pt(c, cols.mid[c], mirror));
      back.push(pt(c, cols.top[c] + H * 0.1, mirror));
      belly.push(pt(c, cols.bot[c] - H * 0.1, mirror));
    }
    return { mid, back, belly };
  };
  const nak: CutPoint[] = [];
  for (let k = 0; k < 8; k++) {
    const c = Math.round(cols.c0 + 1 + (cols.c1 - 2 - cols.c0) * (k / 7)), H = cols.bot[c] - cols.top[c];
    nak.push(pt(c, k % 2 === 0 ? cols.top[c] + H * 0.24 : cols.bot[c] - H * 0.24, true));
  }
  return { a: lines(false), b: lines(true), nakaochi: nak };
}

/** 한 면의 해체 진행(그 면의 옆줄 칼집 · 등살 · 뱃살을 뗐는가) */
export interface LoinSideProgress { mid: boolean; back: boolean; belly: boolean }
export interface LoinSideState {
  speciesId: string;
  cols: LoinColumns;
  a: LoinSideProgress;
  b: LoinSideProgress;
  /** 중골 살 긁기 진행 0~1(1 = 끝) */
  nakaochi: number;
  /** 지금 보이는 면의 옆줄 칼자국(도마 틀 정규화) — 그 면 덩어리가 아직 하나라도 붙어 있으면 */
  midCut?: CutPoint[];
}

/** 뼈 칸인가 — 척추(옆줄 높이 띠) · 가시(척추에서 꼬리 쪽으로 비스듬히 뻗는 줄) */
function boneAt(cols: LoinColumns, c: number, r: number, half: LoinPart): 0 | 1 | 2 {
  const m = cols.mid[c], H = cols.bot[c] - cols.top[c];
  const y = r + 0.5;
  if (Math.abs(y - m) <= Math.max(0.9, H * 0.045)) return (c - cols.c0) % 3 === 0 ? 2 : 1;
  const d = half === 'back' ? m - y : y - m;
  const lim = half === 'back' ? (m - cols.top[c]) * 0.82 : (cols.bot[c] - m) * 0.74;
  if (d <= 0 || d > lim) return 0;
  const xb = c - Math.round(d * 0.55);
  return ((xb - cols.c0) % 5 + 5) % 5 === 0 ? 1 : 0;
}

/**
 * 해체 측면 — 머리 · 지느러미 지운 몸통(밑손질 그대로)에 뗀 덩어리 자리를 뼈대로 바꿔 그린다.
 * 손질 창 `drawFish`가 해체 단계(1면 옆줄 칼집부터 중골까지)에서 부른다. BASE = 1면 · FLIP = 2면(좌우 미러).
 */
export function drawLoinSide(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom, sprites: ButcherSpriteSet, prep: PixelFishState, st: LoinSideState,
): void {
  const spr: PixelFishSprite = sprites.whole;
  const o = prep.orientation === 'FLIP' ? 'FLIP' : 'BASE';
  const mirror = o === 'FLIP';
  const f = computeFishFrame(spr, geom);
  const cell = f.cell, ox = f.ox, oy = f.oy;
  const erase: FishPoly[] = prepEraseFor(sprites, prep, o);
  const L = loinLook(st.speciesId);
  const side = mirror ? st.b : st.a, other = mirror ? st.a : st.b;
  const cols = st.cols;
  const pal = spr.palette;
  for (let r = 0; r < spr.h; r++) {
    const rowCols: (number | null)[] = new Array(spr.w).fill(null);
    for (let c = 0; c < spr.w; c++) {
      const ch = spr.rows[r][c];
      if (ch === '.') continue;
      const sc = mirror ? spr.w - 1 - c : c;
      const px = (sc + 0.5) / spr.w, py = (r + 0.5) / spr.h;
      if (erase.some((poly) => fishPolyContains(px, py, poly))) continue;
      let col: number | null = pal[AB.indexOf(ch)] ?? 0;
      if (c >= cols.c0 && c <= cols.c1) {
        const half: LoinPart = r + 0.5 < cols.mid[c] ? 'back' : 'belly';
        if (side[half]) {
          const bone = boneAt(cols, c, r, half);
          if (!other[half]) {
            // 반대편 살 위에 드러난 뼈대 — 살은 척추 가까이 짙고 바깥으로 밝다 · 결(근절) 줄무늬
            if (bone) col = bone === 2 ? L.boneDark : L.bone;
            else {
              const m = cols.mid[c], edge = half === 'back' ? cols.top[c] : cols.bot[c];
              const t = Math.min(1, Math.abs(r + 0.5 - m) / Math.max(1, Math.abs(edge - m)));
              const base = half === 'back' ? L.flesh : L.belly;
              col = t < 0.18 ? L.chiai : t < 0.35 ? L.fleshDark : base;
              if (half === 'belly' && t >= 0.35 && bellyFat(c, r, false)) col = L.fat;
              else if ((c - cols.c0 + Math.round(Math.abs(r - m) * 0.8)) % 7 === 0 && t >= 0.35) col = L.fleshLight;
            }
          } else {
            // 양쪽 다 뗀 자리 — 뼈대만(사이 살은 긁기 전까지 조금 남는다) · 도마가 비친다
            if (bone) col = bone === 2 ? L.boneDark : L.bone;
            else {
              const keep = (hash(c, r) % 100) / 100 < 0.55 * (1 - st.nakaochi);
              const nearSpine = Math.abs(r + 0.5 - cols.mid[c]) < (cols.bot[c] - cols.top[c]) * 0.3;
              col = keep && nearSpine ? L.remnant : null;
            }
          }
        }
      }
      rowCols[sc] = col;
    }
    // 행 런 병합
    let x = 0;
    while (x < spr.w) {
      const col = rowCols[x];
      if (col === null) { x++; continue; }
      let e = x + 1;
      while (e < spr.w && rowCols[e] === col) e++;
      g.fillStyle(col, 1);
      g.fillRect(ox + x * cell, oy + r * cell, (e - x) * cell, cell);
      x = e;
    }
  }
  // 옆줄 칼자국 — 짙은 선 + 살짝 벌어진 붉은 살
  if (st.midCut && st.midCut.length >= 2 && !(side.back && side.belly)) {
    const px = (p: CutPoint): [number, number] => [geom.x + p.x * geom.w, geom.y + p.y * geom.h];
    g.lineStyle(2.5, L.chiaiDark, 0.95);
    g.beginPath(); g.moveTo(...px(st.midCut[0]));
    for (let i = 1; i < st.midCut.length; i++) g.lineTo(...px(st.midCut[i]));
    g.strokePath();
    g.lineStyle(1, L.fleshLight, 0.8);
    g.beginPath(); g.moveTo(px(st.midCut[0])[0], px(st.midCut[0])[1] + 2);
    for (let i = 1; i < st.midCut.length; i++) g.lineTo(px(st.midCut[i])[0], px(st.midCut[i])[1] + 2);
    g.strokePath();
  }
}

// ────────────────────────────────────────────────────────────
// 다듬기 — 덩어리 넷(FLESH_UP)
// ────────────────────────────────────────────────────────────

export interface LoinBlockView {
  /** 도마 위에 있는가(다듬어 사쿠로 지급했거나 이 세션 대상이 아니면 false) */
  present: boolean;
  chiaiOff: boolean;
  skinOff: boolean;
  /** 이미 그은 사쿠 나누기 선의 u(꼬리 0 → 머리 1) */
  sakuCuts: number[];
  /** 지금 작업 중인 덩어리 */
  active: boolean;
}
export interface LoinBlocksState { speciesId: string; blocks: LoinBlockView[] }

type BlockBand = 'skin' | 'chiai' | 'flesh';
function bandAt(part: LoinPart, u: number, v: number): BlockBand | null {
  const e = loinBlockEdges(part, u);
  if (v < e.top || v > e.bot) return null;
  if (part === 'back') return v < e.skin ? 'skin' : v > e.chiai ? 'chiai' : 'flesh';
  return v > e.skin ? 'skin' : v < e.chiai ? 'chiai' : 'flesh';
}
/** 뱃살 지방 결 — 점 무늬가 아니라 비스듬히 휘어 흐르는 흰 줄(토로의 근막 결). 토로 쪽은 촘촘하다 */
function bellyFat(i: number, j: number, toro: boolean): boolean {
  const P = toro ? 7 : 12;
  const w = Math.round(Math.sin(i * 0.35) * 1.2);
  return (((i + j + w) % P) + P) % P === 0;
}
function bandColor(L: LoinLook, part: LoinPart, band: BlockBand, i: number, j: number, u: number): number {
  if (band === 'skin') return part === 'back' ? (j % 2 ? L.skinBack : L.skinBack - 0x050505) : (i % 5 === 0 ? 0xeef2f5 : L.skinBelly);
  if (band === 'chiai') return (i + j) % 4 === 0 ? L.chiaiDark : L.chiai;
  if (part === 'belly') {
    if (bellyFat(i, j, u > 0.55)) return L.fat;
    return u > 0.55 ? L.belly : L.flesh;
  }
  return (i + Math.round(j * 0.6)) % 8 === 0 ? L.fleshLight : (j % 9 === 0 ? L.fleshDark : L.flesh);
}

/** 덩어리 하나를 rect 안에 칸(cell px)으로 칠한다 — 다듬기 뷰 · 아이콘 공용 */
function paintBlock(
  fill: (x: number, y: number, w: number, h: number, c: number) => void,
  L: LoinLook, part: LoinPart, rect: { x: number; y: number; w: number; h: number }, cell: number,
  v: Pick<LoinBlockView, 'chiaiOff' | 'skinOff' | 'sakuCuts'>,
): void {
  const nx = Math.max(4, Math.floor(rect.w / cell)), ny = Math.max(4, Math.floor(rect.h / cell));
  const ox = rect.x + (rect.w - nx * cell) / 2, oy = rect.y + (rect.h - ny * cell) / 2;
  for (let j = 0; j < ny; j++) {
    const vv = (j + 0.5) / ny;
    let i = 0;
    while (i < nx) {
      const u = (i + 0.5) / nx;
      const band = bandAt(part, u, vv);
      const cut = v.sakuCuts.some((cu) => Math.abs(cu - u) < 0.6 / nx);
      const skip = !band || cut || (band === 'chiai' && v.chiaiOff) || (band === 'skin' && v.skinOff);
      if (skip) { i++; continue; }
      const col = bandColor(L, part, band, i, j, u);
      fill(ox + i * cell, oy + j * cell, cell, cell, col);
      i++;
    }
  }
}

/** 다듬기 뷰 — 덩어리 넷을 자리(`LOIN_BLOCKS`)에 그린다 */
export function drawLoinBlocks(g: Phaser.GameObjects.Graphics, geom: PixelFishGeom, st: LoinBlocksState): void {
  const L = loinLook(st.speciesId);
  const fill = (x: number, y: number, w: number, h: number, c: number): void => { g.fillStyle(c, 1); g.fillRect(x, y, w + 0.5, h + 0.5); };
  for (const b of LOIN_BLOCKS) {
    const v = st.blocks[b.index];
    if (!v?.present) continue;
    const rect = { x: geom.x + b.slot.x * geom.w, y: geom.y + b.slot.y * geom.h, w: b.slot.w * geom.w, h: b.slot.h * geom.h };
    // 도마에 닿은 그림자
    g.fillStyle(0x000000, 0.16);
    g.fillRoundedRect(rect.x + 4, rect.y + rect.h * 0.1 + 4, rect.w, rect.h * 0.8, 6);
    paintBlock(fill, L, b.part, rect, 3, v);
    if (v.active) {
      g.lineStyle(1.5, 0xffd257, 0.55);
      g.strokeRoundedRect(rect.x - 4, rect.y - 3, rect.w + 8, rect.h + 6, 6);
    }
  }
}

// ────────────────────────────────────────────────────────────
// 결과물 그림 — 아이콘(trimloin_*) · 사쿠 회썰기(sakuart_*)
// ────────────────────────────────────────────────────────────

type IconKind = 'back' | 'belly' | 'sakuback' | 'sakubelly' | 'kama' | 'chiai' | 'nakaochi';
/** 해체 결과물 아이콘 키 */
export function loinIconKey(kind: IconKind, speciesId: string): string { return `trimloin_${kind}_${speciesId}`; }
/** 사쿠 회썰기 그림 키 — top = 탑뷰(일반) · side = 측면(고급) · piece = 회 한 점 */
export function sakuArtKey(view: 'top' | 'side' | 'piece', part: LoinPart, speciesId: string): string { return `sakuart_${view}_${part}_${speciesId}`; }

/** 사쿠 회썰기 프로필 — 덩어리가 그림 칸을 반듯하게 채운다(`SashimiTopProfile` · `SashimiSideProfile`과 같은 꼴) */
export const SAKU_TOP_PROFILE = { topEdge: new Array(48).fill(0.1), botEdge: new Array(48).fill(0.9), aspect: 384 / 128 };
export const SAKU_SIDE_PROFILE = { top: new Array(48).fill(0.34), baseY: 0.86 };

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, paint: (fill: (x: number, y: number, ww: number, hh: number, c: number) => void) => void): boolean {
  if (scene.textures.exists(key)) return true;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex?.getContext();
  if (!tex || !ctx) return false;
  paint((x, y, ww, hh, c) => { ctx.fillStyle = hex(c); ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(ww), Math.ceil(hh)); });
  tex.refresh();
  return true;
}

/** 사쿠(혈합육 · 껍질을 뗀 반듯한 살 덩어리) — 탑뷰 / 측면 / 한 점 */
function paintSaku(fill: (x: number, y: number, w: number, h: number, c: number) => void, L: LoinLook, part: LoinPart,
  rect: { x: number; y: number; w: number; h: number }, cell: number, view: 'top' | 'side' | 'piece'): void {
  const nx = Math.floor(rect.w / cell), ny = Math.floor(rect.h / cell);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    // 모서리 한 칸 깎기(둥근 사각)
    if ((i === 0 || i === nx - 1) && (j === 0 || j === ny - 1)) continue;
    let col: number;
    if (part === 'belly') col = bellyFat(i, j, true) ? L.fat : L.belly;
    else col = (i + Math.round(j * 0.6)) % 8 === 0 ? L.fleshLight : L.flesh;
    if (view !== 'top' && j === 0) col = part === 'belly' ? L.fat : L.fleshLight;   // 윗면 빛
    if (view !== 'top' && j >= ny - 1) col = L.fleshDark;                          // 바닥 그늘
    fill(rect.x + i * cell, rect.y + j * cell, cell, cell, col);
  }
}

/** 해체 그림 텍스처가 없으면 굽는다(세이브에 남은 키 포함) — 이 모듈 키가 아니면 false */
export function ensureLoinTexture(scene: Phaser.Scene, key: string | undefined): boolean {
  if (!key) return false;
  if (scene.textures.exists(key)) return true;
  let m = /^trimloin_(back|belly|sakuback|sakubelly|kama|chiai|nakaochi)_(.+)$/.exec(key);
  if (m) {
    const kind = m[1] as IconKind, L = loinLook(m[2]);
    if (kind === 'back' || kind === 'belly') {
      return canvasTex(scene, key, 72, 34, (fill) => paintBlock(fill, L, kind, { x: 2, y: 2, w: 68, h: 30 }, 2, { chiaiOff: false, skinOff: false, sakuCuts: [] }));
    }
    if (kind === 'sakuback' || kind === 'sakubelly') {
      return canvasTex(scene, key, 52, 24, (fill) => paintSaku(fill, L, kind === 'sakuback' ? 'back' : 'belly', { x: 2, y: 4, w: 48, h: 16 }, 2, 'top'));
    }
    if (kind === 'chiai') {
      return canvasTex(scene, key, 52, 16, (fill) => {
        for (let i = 0; i < 24; i++) {
          const hh = 4 + Math.round(4 * Math.sin(Math.PI * (i + 0.5) / 24));
          for (let j = 0; j < hh; j++) fill(2 + i * 2, 8 - hh / 2 + j, 2, 1, (i + j) % 4 === 0 ? L.chiaiDark : L.chiai);
        }
      });
    }
    if (kind === 'nakaochi') {
      return canvasTex(scene, key, 44, 30, (fill) => {
        for (let j = 0; j < 12; j++) for (let i = 0; i < 20; i++) {
          const dx = (i - 9.5) / 10, dy = (j - 8) / 7;
          if (dx * dx + dy * dy > 1 || j < 2) continue;
          const hsh = hash(i, j) % 7;
          fill(2 + i * 2, 4 + j * 2, 2, 2, hsh === 0 ? L.fat : hsh < 3 ? L.fleshDark : L.flesh);
        }
      });
    }
    // 가마살 — 가슴지느러미 밑 턱밑살(겉은 껍질 · 잘린 면은 살)
    return canvasTex(scene, key, 40, 40, (fill) => {
      for (let j = 0; j < 18; j++) for (let i = 0; i < 18; i++) {
        if (i + j < 6 || i > 16 - j * 0.15 || j > 17) continue;
        const cutFace = i < 9 && j > i * 0.6;
        const col = cutFace ? ((i + j) % 6 === 0 ? L.fat : L.belly) : (j < 6 ? L.skinBack : L.skinBelly);
        fill(2 + i * 2, 2 + j * 2, 2, 2, col);
      }
    });
  }
  m = /^sakuart_(top|side|piece)_(back|belly)_(.+)$/.exec(key);
  if (m) {
    const view = m[1] as 'top' | 'side' | 'piece', part = m[2] as LoinPart, L = loinLook(m[3]);
    if (view === 'top') return canvasTex(scene, key, 384, 128, (fill) => paintSaku(fill, L, part, { x: 0, y: 128 * 0.1, w: 384, h: 128 * 0.8 }, 4, 'top'));
    if (view === 'side') return canvasTex(scene, key, 384, 120, (fill) => paintSaku(fill, L, part, { x: 0, y: 120 * 0.34, w: 384, h: 120 * 0.52 }, 4, 'side'));
    return canvasTex(scene, key, 40, 28, (fill) => paintSaku(fill, L, part, { x: 8, y: 2, w: 24, h: 24 }, 2, 'piece'));
  }
  return false;
}
