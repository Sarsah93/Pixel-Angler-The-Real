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
 *
 * 332차 — **척추는 곧고, 살은 그은 칼집대로 갈린다**(사용자 리포트 「뼈 모양이 일자가 아니라, 지렁이처럼 휘어있는 경우 … 일자뼈 모양으로」 ·
 *  「옆줄칼집을 가운데로 맞춰놨을 때 … 그 경계점 기준으로 그림이 보여져야 하는데, 지금은 … 휘어진 뼈 기준으로 살이 분리된 그림」).
 *  - 옛 그림은 열마다 「살 높이 48%」(`LoinColumns.mid`)를 척추 · 등/배 경계로 함께 썼다 — 몸 윤곽이 울퉁불퉁한 그림에서는 그 줄이 물결친다.
 *  - 지금은 `loinAxis`가 둘을 가른다: **가르는 줄** `div` = 그 면에 실제로 그은 옆줄 칼집(유도선 · [확정] 선) · **척추** `spine` = 그 줄의 곧은 맞춤선.
 *    등살 · 뱃살을 뗀 자리는 `div`에서 갈리고, 뼈대(척추 · 가시) · 드러난 살의 그늘 · 중골 살은 `spine`을 따른다.
 *  - 기본 옆줄 선 · 중골 긁기 선도 곧다(`loinSideGeometry` — 중골 긁기 = 2면 옆줄 선의 곧은 맞춤선, 곧 2면에서 보이는 척추 위).
 */
import Phaser from 'phaser';
import {
  LOIN_BLOCKS, loinBlockEdges, type CutPoint, type LoinPart, type LoinSideGeometry, type LoinSideLines,
} from '@tra/core';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';
import {
  computeFishFrame, prepEraseFor, fishPolyContains, prepKeepMask,
  type ButcherSpriteSet, type PixelFishGeom, type PixelFishState, type FishPoly,
} from './PixelButcherFish.js';

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

// ────────────────────────────────────────────────────────────
// 색 — 참다랑어(짙은 붉은살 · 토로) / 방어류(분홍빛 살) / 큰 바리류(흰 살 — 322(2))
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
/** 322(2) — 큰 바리류(자바리 · 다금바리 · 능성어): 단단한 흰 살 · 옅은 분홍 혈합육 · 갈색 껍질 */
const GROUPER: LoinLook = {
  flesh: 0xeedfd2, fleshDark: 0xd9c4b6, fleshLight: 0xf9efe7,
  belly: 0xf4e7dd, fat: 0xfdf7f1,
  chiai: 0xc27a74, chiaiDark: 0x9c5a56,
  skinBack: 0x5a4a42, skinBelly: 0xcbbfb2,
  bone: 0xece6d6, boneDark: 0xc0b8a4, remnant: 0xd0ab9c,
};
const GROUPER_LOIN = new Set(['longtooth_grouper', 'sawedged_perch', 'sevenband_grouper']);
/** 324 — 눈다랑어: 참다랑어보다 밝은 붉은 살 · 지방이 적다 */
const BIGEYE: LoinLook = {
  flesh: 0xb5303a, fleshDark: 0x8c1c26, fleshLight: 0xd04a4c,
  belly: 0xd87a78, fat: 0xf2cfc8,
  chiai: 0x56121a, chiaiDark: 0x3a0c12,
  skinBack: 0x22304c, skinBelly: 0xc9d0d8,
  bone: 0xe9e2d0, boneDark: 0xbcb29c, remnant: 0x96222c,
};
/** 324 — 황새치: 옅은 분홍빛이 도는 크림색 살 · 짙은 혈합육 · 흑갈색 껍질 */
const SWORDFISH: LoinLook = {
  flesh: 0xf0d2c4, fleshDark: 0xdcb6a8, fleshLight: 0xf9e6dc,
  belly: 0xf5dfd4, fat: 0xfdf3ec,
  chiai: 0x8a3a34, chiaiDark: 0x66241f,
  skinBack: 0x3a3632, skinBelly: 0xb9aca0,
  bone: 0xece6d6, boneDark: 0xc0b8a4, remnant: 0xcf9c8e,
};
/** 324 — 청새치: 주황빛이 도는 분홍 살 · 청남색 껍질 */
const MARLIN: LoinLook = {
  flesh: 0xea9c7c, fleshDark: 0xd07e62, fleshLight: 0xf5b89c,
  belly: 0xf2bfa6, fat: 0xfbe6d8,
  chiai: 0x7a2a22, chiaiDark: 0x561a14,
  skinBack: 0x24365a, skinBelly: 0xc6ced8,
  bone: 0xece6d6, boneDark: 0xc0b8a4, remnant: 0xba6850,
};
const LOOK_BY_SPECIES: Record<string, LoinLook> = { bluefin_tuna: TUNA, bigeye_tuna: BIGEYE, swordfish: SWORDFISH, striped_marlin: MARLIN };
export function loinLook(speciesId: string): LoinLook {
  return LOOK_BY_SPECIES[speciesId] ?? (GROUPER_LOIN.has(speciesId) ? GROUPER : AMBERJACK);
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
  // 318 — 몸통과 끊긴 지느러미 조각은 몸통 열 재기에서도 뺀다(도마 그림과 같은 표)
  const keep = prepKeepMask(spr, (c, r) => erase.some((poly) => fishPolyContains((c + 0.5) / spr.w, (r + 0.5) / spr.h, poly)));
  const top: number[] = [], bot: number[] = [], h: number[] = [];
  for (let c = 0; c < spr.w; c++) {
    let t = -1, b = -1;
    for (let r = 0; r < spr.h; r++) {
      if (!keep[r * spr.w + c]) continue;
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
 * 328 — **해체 측면 선의 모양**: 점마다 `[u, v]` — u = 몸통 열(`c0` ~ `c1 − 1`) 사이 비율 · v = 그 열 살 높이 비율(0 = 위 끝 · 1 = 아래 끝).
 * 기준 어종(1m급 잿방어)에서 사용자가 확정한 선을 이 모양으로 바꿔(`loinShapeFromLines`) 다른 대형종의 몸통 열에 다시 놓는다(`loinSideGeometry`) —
 * 사용자 지시 「등 푸른 대형종들 4덩어리 분리 작업 동일하게 … 전부 확정한 걸로 똑같이 적용」. 어종마다 몸 길이 · 높이 · 꼬리 자루 자리가 달라도 같은 자리를 지난다.
 */
export type LoinUV = readonly [number, number];
export interface LoinGuideShape {
  a?: Partial<Record<keyof LoinSideLines, LoinUV[]>>;
  b?: Partial<Record<keyof LoinSideLines, LoinUV[]>>;
}
/** 328 — 기준 어종에서 확정한 측면 선(도마 정규화) — 없는 선은 기본 모양을 쓴다 */
export interface LoinConfirmedLines {
  a?: Partial<LoinSideLines>;
  b?: Partial<LoinSideLines>;
}

/** 328 — 확정한 측면 선(도마 정규화) → 모양(u · v). 2면은 좌우로 뒤집힌 그림 자리라 열을 뒤집어 잰다 */
export function loinShapeFromLines(
  sprites: ButcherSpriteSet, cols: LoinColumns, boardW: number, boardH: number, lines: LoinConfirmedLines,
): LoinGuideShape {
  const spr = sprites.whole;
  const f = computeFishFrame(spr, { x: 0, y: 0, w: boardW, h: boardH });
  const span = Math.max(1, cols.c1 - 1 - cols.c0);
  const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
  const uv = (p: CutPoint, mirror: boolean): LoinUV => {
    const cx = (p.x * boardW - f.ox) / f.cell - 0.5;
    const c = mirror ? spr.w - 1 - cx : cx;
    const ci = Math.max(cols.c0, Math.min(cols.c1 - 1, Math.round(c)));
    const H = cols.bot[ci] - cols.top[ci];
    const row = (p.y * boardH - f.oy) / f.cell;
    return [r4((c - cols.c0) / span), r4(H > 0 ? (row - cols.top[ci]) / H : 0.5)];
  };
  const conv = (l: CutPoint[] | undefined, mirror: boolean): LoinUV[] | undefined =>
    l && l.length >= 2 ? l.map((p) => uv(p, mirror)) : undefined;
  const sideOf = (l: Partial<LoinSideLines> | undefined, mirror: boolean): LoinGuideShape['a'] => ({
    mid: conv(l?.mid, mirror), back: conv(l?.back, mirror), belly: conv(l?.belly, mirror),
  });
  return { a: sideOf(lines.a, false), b: sideOf(lines.b, true) };
}

/** 332 — 곧은 선 맞춤(최소제곱): 점 (c, r)들을 r = a + b·c 로. 점이 하나뿐이거나 열이 한 곳에 몰려 있으면 수평선 */
function fitLine(pts: readonly { c: number; r: number }[]): { a: number; b: number } {
  const n = pts.length;
  if (!n) return { a: 0, b: 0 };
  let sc = 0, sr = 0;
  for (const p of pts) { sc += p.c; sr += p.r; }
  const mc = sc / n, mr = sr / n;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.c - mc) * (p.r - mr); den += (p.c - mc) * (p.c - mc); }
  const b = den > 1e-6 ? num / den : 0;
  return { a: mr - b * mc, b };
}

/**
 * 해체 측면 유도선(도마 생선 틀 정규화) — 그림을 그리는 식(`computeFishFrame`)과 같은 자리.
 *  옆줄 = 몸통 가운데 높이의 곧은 맞춤선(332) · 등 = 위 끝 + 높이 10% · 배 = 아래 끝 − 10% · 중골 긁기 = 2면 옆줄 선의 곧은 맞춤선(332 — 척추 위).
 *  2면(FLIP)은 그림이 좌우로 뒤집힌 자리(머리 오른쪽) — 칼은 늘 머리 쪽에서 꼬리 쪽으로.
 *  328 — `shape`(기준 어종에서 확정한 선의 모양)가 있으면 그 선은 모양대로 이 어종의 몸통 열에 놓는다.
 */
export function loinSideGeometry(
  sprites: ButcherSpriteSet, cols: LoinColumns, boardW: number, boardH: number, shape?: LoinGuideShape,
): LoinSideGeometry {
  const spr = sprites.whole;
  const f = computeFishFrame(spr, { x: 0, y: 0, w: boardW, h: boardH });
  const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
  const pt = (c: number, row: number, mirror: boolean): CutPoint => ({
    x: r4((f.ox + ((mirror ? spr.w - 1 - c : c) + 0.5) * f.cell) / boardW),
    y: r4((f.oy + row * f.cell) / boardH),
  });
  const span = Math.max(1, cols.c1 - 1 - cols.c0);
  /** 모양(u · v) → 이 어종의 몸통 열 자리. 몸통 밖으로 나간 u는 가장 가까운 열의 높이를 빌린다 */
  const place = (l: LoinUV[], mirror: boolean): CutPoint[] => l.map(([u, v]) => {
    const c = cols.c0 + u * span;
    const ci = Math.max(cols.c0, Math.min(cols.c1 - 1, Math.round(c)));
    return pt(c, cols.top[ci] + (cols.bot[ci] - cols.top[ci]) * Math.max(-0.3, Math.min(1.3, v)), mirror);
  });
  const N = 7;
  const colAt = (k: number): number => Math.round(cols.c0 + (cols.c1 - 1 - cols.c0) * (k / (N - 1)));
  /** 332 — 옆줄 선은 곧다: 모양(u · v)으로 놓은 점들(없으면 열마다 가운데 높이)의 곧은 맞춤선을 머리 쪽 ~ 꼬리 쪽 두 점으로 */
  const straightMid = (sh: LoinUV[] | undefined, mirror: boolean): CutPoint[] => {
    const src: { c: number; r: number }[] = [];
    if (sh) {
      for (const [u, v] of sh) {
        const c = cols.c0 + u * span;
        const ci = Math.max(cols.c0, Math.min(cols.c1 - 1, Math.round(c)));
        src.push({ c, r: cols.top[ci] + (cols.bot[ci] - cols.top[ci]) * Math.max(-0.3, Math.min(1.3, v)) });
      }
    } else {
      for (let c = cols.c0; c <= cols.c1 - 1; c++) src.push({ c, r: cols.mid[c] });
    }
    const ln = fitLine(src);
    const cA = sh ? Math.min(...src.map((p) => p.c)) : cols.c0;
    const cB = sh ? Math.max(...src.map((p) => p.c)) : cols.c1 - 1;
    return [pt(cA, ln.a + ln.b * cA, mirror), pt(cB, ln.a + ln.b * cB, mirror)];
  };
  const lines = (mirror: boolean): LoinSideLines => {
    const back: CutPoint[] = [], belly: CutPoint[] = [];
    for (let k = 0; k < N; k++) {
      const c = colAt(k), H = cols.bot[c] - cols.top[c];
      back.push(pt(c, cols.top[c] + H * 0.1, mirror));
      belly.push(pt(c, cols.bot[c] - H * 0.1, mirror));
    }
    const sh = mirror ? shape?.b : shape?.a;
    return {
      mid: straightMid(sh?.mid, mirror),
      back: sh?.back ? place(sh.back, mirror) : back,
      belly: sh?.belly ? place(sh.belly, mirror) : belly,
    };
  };
  const a = lines(false), b = lines(true);
  return { a, b, nakaochi: loinNakaochiLine(b.mid, sprites, cols, boardW, boardH) };
}

/**
 * 332 — **중골 긁기 선 = 2면에서 보이는 척추 위**: 2면 옆줄 선(도마 틀 정규화 — 그 어종에 [확정]한 선이 있으면 그 선)의 곧은 맞춤선을
 * 몸통 열 안쪽(머리 쪽 한 칸 · 꼬리 쪽 두 칸 들임)에서 머리 → 꼬리 두 점으로. 그림의 척추(`loinAxis.spine`)와 같은 식이라 선과 뼈가 한 자리다.
 */
export function loinNakaochiLine(
  bMid: readonly CutPoint[], sprites: ButcherSpriteSet, cols: LoinColumns, boardW: number, boardH: number,
): CutPoint[] {
  const spr = sprites.whole;
  const f = computeFishFrame(spr, { x: 0, y: 0, w: boardW, h: boardH });
  const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
  const src = bMid.map((p) => ({ c: spr.w - 1 - ((p.x * boardW - f.ox) / f.cell - 0.5), r: (p.y * boardH - f.oy) / f.cell }));
  const ln = fitLine(src.length ? src : [{ c: cols.c0, r: cols.mid[cols.c0] }]);
  const at = (c: number): CutPoint => ({
    x: r4((f.ox + (spr.w - 1 - c + 0.5) * f.cell) / boardW),
    y: r4((f.oy + (ln.a + ln.b * c) * f.cell) / boardH),
  });
  return [at(cols.c0 + 1), at(Math.max(cols.c0 + 2, cols.c1 - 2))];
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
  /** 지금 보이는 면에 그은 옆줄 칼집(도마 틀 정규화) — 그 면의 옆줄 칼집을 끝냈으면. 332 — 등살 · 뱃살이 이 줄에서 갈리고 척추가 이 줄의 곧은 맞춤선이다 */
  midCut?: CutPoint[];
}

/**
 * 332 — 해체 측면의 두 줄(스프라이트 행 · BASE 열 기준).
 *  `div[c]` = 등살 · 뱃살을 가르는 행 — 그 면에 그은 옆줄 칼집(`cut` — 열 · 행 점들). 없으면 몸통 가운데 높이의 곧은 맞춤선.
 *  `spine[c]` = 척추 — 언제나 곧다(가르는 줄의 곧은 맞춤선). `thick` = 척추 띠 반 두께(몸통에서 가장 높은 열 기준 — 열마다 달라지지 않는다).
 */
export interface LoinAxis { div: number[]; spine: number[]; thick: number }
export function loinAxis(cols: LoinColumns, cut?: readonly { c: number; r: number }[]): LoinAxis {
  const n = cols.top.length;
  const body: { c: number; r: number }[] = [];
  let maxH = 1;
  for (let c = cols.c0; c <= cols.c1; c++) {
    body.push({ c, r: cols.mid[c] });
    maxH = Math.max(maxH, cols.bot[c] - cols.top[c]);
  }
  const pts = cut && cut.length >= 2 ? [...cut].sort((p, q) => p.c - q.c) : undefined;
  const base = fitLine(body);
  const div: number[] = new Array(n).fill(0);
  for (let c = 0; c < n; c++) {
    if (!pts) { div[c] = base.a + base.b * c; continue; }
    // 꺾은선 보간 — 선 밖의 열은 끝 마디를 그대로 늘인다
    let i = 0;
    while (i < pts.length - 2 && c > pts[i + 1].c) i++;
    const p = pts[i], q = pts[i + 1];
    const t = Math.abs(q.c - p.c) > 1e-6 ? (c - p.c) / (q.c - p.c) : 0;
    div[c] = p.r + (q.r - p.r) * t;
  }
  const fit: { c: number; r: number }[] = [];
  for (let c = cols.c0; c <= cols.c1; c++) fit.push({ c, r: div[c] });
  const ln = fitLine(fit);
  const spine = div.map((_, c) => ln.a + ln.b * c);
  return { div, spine, thick: Math.max(0.9, maxH * 0.04) };
}

/** 뼈 칸인가 — 척추(곧은 띠) · 가시(척추에서 꼬리 쪽으로 비스듬히 뻗는 줄) */
function boneAt(cols: LoinColumns, ax: LoinAxis, c: number, r: number, half: LoinPart): 0 | 1 | 2 {
  const m = ax.spine[c];
  const y = r + 0.5;
  if (Math.abs(y - m) <= ax.thick) return (c - cols.c0) % 3 === 0 ? 2 : 1;
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
  // 318 — 지운 뒤 몸통과 끊긴 조각은 그리지 않는다(표는 그림 열 기준 — 삭제 영역은 그려진 방향 정규화)
  const keep = prepKeepMask(spr, (c, r) => {
    const sc = mirror ? spr.w - 1 - c : c;
    return erase.some((poly) => fishPolyContains((sc + 0.5) / spr.w, (r + 0.5) / spr.h, poly));
  });
  const L = loinLook(st.speciesId);
  const side = mirror ? st.b : st.a, other = mirror ? st.a : st.b;
  const cols = st.cols;
  // 332 — 그 면에 그은 옆줄 칼집을 그림 열 · 행으로 옮겨 「가르는 줄」로, 그 곧은 맞춤선을 척추로
  const ax = loinAxis(cols, st.midCut?.map((p) => {
    const scx = (geom.x + p.x * geom.w - ox) / cell - 0.5;
    return { c: mirror ? spr.w - 1 - scx : scx, r: (geom.y + p.y * geom.h - oy) / cell };
  }));
  const pal = spr.palette;
  for (let r = 0; r < spr.h; r++) {
    const rowCols: (number | null)[] = new Array(spr.w).fill(null);
    for (let c = 0; c < spr.w; c++) {
      const ch = spr.rows[r][c];
      if (ch === '.') continue;
      if (!keep[r * spr.w + c]) continue;
      const sc = mirror ? spr.w - 1 - c : c;
      let col: number | null = pal[AB.indexOf(ch)] ?? 0;
      if (c >= cols.c0 && c <= cols.c1) {
        const half: LoinPart = r + 0.5 < ax.div[c] ? 'back' : 'belly';
        if (side[half]) {
          const bone = boneAt(cols, ax, c, r, half);
          if (!other[half]) {
            // 반대편 살 위에 드러난 뼈대 — 살은 척추 가까이 짙고 바깥으로 밝다 · 결(근절) 줄무늬
            if (bone) col = bone === 2 ? L.boneDark : L.bone;
            else {
              const m = ax.spine[c], edge = half === 'back' ? cols.top[c] : cols.bot[c];
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
              const nearSpine = Math.abs(r + 0.5 - ax.spine[c]) < (cols.bot[c] - cols.top[c]) * 0.3;
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
