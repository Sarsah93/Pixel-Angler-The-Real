/**
 * @file FaceRecolor.ts
 * @description 269차(2) · 270차 · **271차** — 그림 얼굴 초상(주인공)의 **층 합성 · 색 칠하기 · 입 모양 · 볼 홍조** 순수 함수.
 *  Phaser · DOM 없이 RGBA 배열만 다룬다 — 게임(`FacePhoto.ts`)과 검수 도구(`tools/face_layers_qa.mjs`)가 같은 함수를 쓴다
 *  (「여기선 예쁜데 인게임은 다른」 상태를 막는다).
 *
 *  271 — 사용자 「기본 얼굴형에 머리/수염/입을 변경하는 것으로 적용해야지, 하나하나 케이스별로 다 뽑는 건 의미가 없지 않을까」:
 *  한 장에 납작하게 그린 판을 색 규칙으로 가르던 268~270의 분류(씨앗 경쟁 번짐 · 눈썹 조각 · 수염 구역)는 경계마다 추측이라
 *  색 조합마다 새 결함이 났다(흰 머리 + 밝은 피부의 구레나룻 · 잿빛 수염 가장자리의 전이 픽셀). 지금은 **픽셀의 주인이 데이터에 있다** —
 *  기본 머리(민머리 · 민낯 · 성별 × 얼굴형) + 라벨 마스크(피부 · 눈썹 · 눈동자 · 입술 · 흰자 — `tools/face_layers.cjs`가 굽고 손으로 고정) ·
 *  머리 모양 층 · 수염 층(알파 = 주인). 칠하기는 라벨 · 층 단위이고 추측 규칙은 없다. 두 톤 칠하기(270)는 그대로 — 한 층 안에서는 잘 맞는다.
 *  합성 순서 = 기본판 칠하기(라벨) → 입 모양 · 볼 홍조(269 — 픽셀을 옮기므로 칠한 뒤) → 수염 층 → 머리 모양 층.
 *  312 — 머리 모양 층을 얹기 전에 **머리에 맞춘다**(`fitHairToHead` — 층은 얹기만 해서 상투처럼 당겨 묶은 머리 둘레에 민머리 윤곽이
 *  피부색 호로 남았다 → 머리칼 밖 정수리 두피는 비우고, 머리칼 안에 갇힌 두피 구멍은 머리칼로 메운다).
 *  317 — 사용자 「상의 색 변경하면 적어도 초상화에서 상의 부분 색은 연동」: 기본판 아래 남색 티셔츠(라벨 없음)를
 *  **바닥 줄에서 번진 남색 덩어리**(`shirtRegion`)로 찾아 상의 색(`outfit.shirtColor`)으로 두 톤 칠한다. 맨몸(`shirt: 'none'`)이면 그대로.
 */

import { HAIR_COLORS, SKIN_TONES, EYE_COLORS, type CharConfig } from '@tra/core';

/** 주인공 기본 얼굴의 기준색(`tools/gemini_face_art.cjs` PLAYER_BASE와 같다 — 층 원판은 전부 이 색으로 그린다) */
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };
/** 317 — 기본판 티셔츠의 기준색(층 원판 여섯 장 실측 최빈값 (61,88,124) — 그림자는 (34,48,68)) */
export const PLAYER_BASE_SHIRT = 0x3d587c;
const WHITE_KEEP_MIN = 0.35;
const LIP_TONE_EXP = 0.6;
const LIP_TONE_MAX = 1.15;
/** 마스크 색 대조 허용(PNG → 캔버스는 정확하지만 색 관리가 끼어도 라벨이 떨어지지 않게) */
const MASK_TOL = 8;

function lum(r: number, g: number, b: number): number { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function split(c: number): [number, number, number] { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; }
const WW = 3 * 255 * 255;

export interface Swap {
  from: [number, number, number]; to: [number, number, number];
  /** 기준색 · 고른 색 밝기 · 기준 색조 · 분류 밝기 범위 */
  fromL: number; toL: number; chroma: [number, number, number]; lo: number; hi: number;
  /** 두 톤 분해 계수(기준색 · 흰색 최소제곱) · 흰 성분 유지율 · 기준보다 밝은 단계의 압축률 */
  ff: number; fw: number; det: number; whiteKeep: number; compress: number;
}
/** 치환 표 — 머리는 항상 있다(기준색 그대로면 `keepHair`). 수염은 수염 층이 있을 때만(기준색 그대로면 `keepBeard`) */
export interface PlayerSwaps { hair: Swap; keepHair: boolean; skin?: Swap; eye?: Swap; beard?: Swap; keepBeard?: boolean; shirt?: Swap }

export function swapOf(from: number, to: number, loK: number, hiK: number): Swap {
  const f = split(from), t = split(to);
  const L = Math.max(1, lum(f[0], f[1], f[2])), toL = Math.max(1, lum(t[0], t[1], t[2]));
  const ff = f[0] * f[0] + f[1] * f[1] + f[2] * f[2], fw = 255 * (f[0] + f[1] + f[2]);
  const kmax = 255 / Math.max(1, t[0], t[1], t[2]);
  return {
    from: f, to: t, fromL: L, toL, chroma: [f[0] / L, f[1] / L, f[2] / L], lo: L * loK, hi: Math.min(255, L * hiK),
    ff, fw, det: ff * WW - fw * fw, whiteKeep: Math.max(WHITE_KEEP_MIN, Math.min(1, toL / L)),
    compress: hiK > 1 ? Math.min(1, (kmax - 1) / (hiK - 1)) : 1,
  };
}

/**
 * 한 픽셀 칠하기 — **두 톤 모델**(270). 그림의 색 = 기준색 × a + 흰색 × b(최소제곱 · 음수면 한쪽만)로 풀고, 고른 색 × a + 흰색 × b로 다시 그린다.
 *  - 그늘(a < 1)은 비율 그대로 → 어두운 색으로 갈수록 음영이 따라온다.
 *  - 기준보다 밝은 단계(a > 1)는 고른 색에 남은 여유만큼만 올린다(`compress` — 흰 머리 · 밝은 피부에서 곱이 255를 넘어 잘리던 자리).
 *  - 흰 성분(코끝 · 볼 하이라이트)은 어두운 색으로 갈 때 밝기 비만큼만 남기고 나머지는 색으로 돌린다(`whiteKeep`).
 *  그래도 한 채널이 255를 넘으면 셋을 같은 비로 줄인다(색조 보존).
 */
function paint(data: Uint8ClampedArray, o: number, s: Swap): void {
  const r = data[o], g = data[o + 1], b = data[o + 2];
  const pF = r * s.from[0] + g * s.from[1] + b * s.from[2], pW = 255 * (r + g + b);
  let a = (pF * WW - pW * s.fw) / s.det, wt = (pW * s.ff - pF * s.fw) / s.det;
  if (wt < 0) { wt = 0; a = pF / s.ff; }
  if (a < 0) { a = 0; wt = pW / WW; }
  a += wt * (1 - s.whiteKeep); wt *= s.whiteKeep;
  if (a > 1) a = 1 + (a - 1) * s.compress;
  let R = a * s.to[0] + wt * 255, G = a * s.to[1] + wt * 255, B = a * s.to[2] + wt * 255;
  const mx = Math.max(R, G, B);
  if (mx > 255) { const f = 255 / mx; R *= f; G *= f; B *= f; }
  data[o] = Math.max(0, Math.min(255, Math.round(R)));
  data[o + 1] = Math.max(0, Math.min(255, Math.round(G)));
  data[o + 2] = Math.max(0, Math.min(255, Math.round(B)));
}

/** 주인공 옵션에 맞는 치환 표 — 기준색과 같은 색을 골랐으면 그 줄은 뺀다. `hasBeardLayer` = 수염 층을 얹나 */
export function playerSwaps(cfg: CharConfig, hasBeardLayer: boolean): PlayerSwaps {
  const { look } = cfg;
  const hairTo = HAIR_COLORS[look.hair] ?? HAIR_COLORS[0];
  const out: PlayerSwaps = { hair: swapOf(HAIR_COLORS[PLAYER_BASE.hair], hairTo, 0.4, 1.7), keepHair: look.hair === PLAYER_BASE.hair };
  const skinTo = SKIN_TONES[look.skin] ?? SKIN_TONES[1];
  if (look.skin !== PLAYER_BASE.skin) out.skin = swapOf(SKIN_TONES[PLAYER_BASE.skin], skinTo, 0.5, 1.4);
  const eyeTo = EYE_COLORS[look.eye] ?? EYE_COLORS[0];
  if (look.eye !== PLAYER_BASE.eye) out.eye = swapOf(EYE_COLORS[PLAYER_BASE.eye], eyeTo, 0.5, 1.8);
  if (hasBeardLayer && look.beard >= 0) {
    out.beard = swapOf(HAIR_COLORS[PLAYER_BASE.hair], HAIR_COLORS[look.beard] ?? HAIR_COLORS[0], 0.4, 1.7);
    out.keepBeard = look.beard === PLAYER_BASE.hair;
  }
  const shirtTo = playerShirtColor(cfg);
  if (shirtTo !== null && shirtTo !== PLAYER_BASE_SHIRT) out.shirt = swapOf(PLAYER_BASE_SHIRT, shirtTo, 0.3, 1.3);
  return out;
}

/** 317 — 초상에 칠할 상의 색(맨몸이거나 옷 정보가 없으면 null = 기본판 그대로) */
export function playerShirtColor(cfg: CharConfig): number | null {
  const o = cfg.outfit;
  if (!o || o.shirt === 'none' || typeof o.shirtColor !== 'number') return null;
  return o.shirtColor & 0xffffff;
}

/**
 * 317 — 기본판의 티셔츠 픽셀. 바닥 줄에서 시작해 「라벨 없음 · 불투명 · 파란 기(B > R + 4)」인 이웃으로만 번진다
 * (머리 윤곽선 · 귀 그늘은 붉은 갈색이라 여기서 멈춘다 — 여섯 장 실측: 옷 위끝 154줄 · 피부 아래끝 177~179줄).
 */
export function shirtRegion(base: Uint8ClampedArray, labels: Uint8Array, w: number, h: number): Uint8Array {
  const n = w * h, out = new Uint8Array(n);
  const ok = (i: number): boolean => {
    if (labels[i]) return false;
    const o = i * 4;
    return base[o + 3] >= 8 && base[o + 2] > base[o] + 4;
  };
  const stack: number[] = [];
  for (let x = 0; x < w; x++) { const i = (h - 1) * w + x; if (ok(i)) { out[i] = 1; stack.push(i); } }
  while (stack.length) {
    const i = stack.pop() as number, x = i % w, y = (i / w) | 0;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const j of nb) if (j >= 0 && !out[j] && ok(j)) { out[j] = 1; stack.push(j); }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// 라벨 마스크(271) — `tools/face_layers.cjs`가 기본판마다 굽는 `<키>_mask.png`. 색 = 라벨(도구의 MASK 표와 같다)
// ---------------------------------------------------------------------------------------------------------------

export const LABEL_NONE = 0, LABEL_SKIN = 1, LABEL_BROW = 2, LABEL_EYE = 3, LABEL_LIPS = 4, LABEL_WHITE = 5;
const MASK_RGB: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 224, 255, LABEL_SKIN], [255, 128, 0, LABEL_BROW], [0, 255, 64, LABEL_EYE], [255, 80, 160, LABEL_LIPS], [255, 255, 255, LABEL_WHITE],
];

/** 마스크 RGBA → 픽셀 라벨(색이 없거나 투명이면 0 — 윤곽선 · 옷 · 배경은 건드리지 않는다) */
export function decodeMask(mask: Uint8ClampedArray, n: number): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (mask[o + 3] < 128) continue;
    for (const [r, g, b, lb] of MASK_RGB) {
      if (Math.abs(mask[o] - r) <= MASK_TOL && Math.abs(mask[o + 1] - g) <= MASK_TOL && Math.abs(mask[o + 2] - b) <= MASK_TOL) { out[i] = lb; break; }
    }
  }
  return out;
}

export interface MouthBox { x0: number; x1: number; y0: number; y1: number; lineY1: number; cx: number }

/** 입 상자 — 입술 라벨의 상자. 입술 선(어두운 붉은 갈색)의 아래 끝 줄이 `lineY1`(벌린 입의 틈 자리). 입술 라벨이 없으면 null(입 모양 · 홍조 없음) */
export function mouthFromLabels(labels: Uint8Array, data: Uint8ClampedArray, w: number, h: number): MouthBox | null {
  let x0 = w, x1 = -1, y0 = h, y1 = -1, lineY1 = -1;
  for (let i = 0; i < w * h; i++) {
    if (labels[i] !== LABEL_LIPS) continue;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    const o = i * 4;
    if (lum(data[o], data[o + 1], data[o + 2]) < 140 && data[o] - data[o + 1] >= 28 && y > lineY1) lineY1 = y;
  }
  if (x1 < 0) return null;
  if (lineY1 < 0) lineY1 = Math.round((y0 + y1) / 2);
  return { x0, x1, y0, y1, lineY1, cx: (x0 + x1) / 2 };
}

function copyPx(dst: Uint8ClampedArray, src: Uint8ClampedArray, w: number, x: number, y: number, sx: number, sy: number): void {
  const d = (y * w + x) * 4, o = (sy * w + sx) * 4;
  dst[d] = src[o]; dst[d + 1] = src[o + 1]; dst[d + 2] = src[o + 2]; dst[d + 3] = src[o + 3];
}

/**
 * 입 모양(269) — 기본판은 「다문 입」이다. 살짝 웃는 입 = 바깥 열을 1~2px 올린다(입꼬리). 작은 입 = 가로 0.72배(양옆은 같은 줄의 바깥 피부).
 * 살짝 벌린 입 = 입술 선 아래를 2px 내리고 그 자리를 어두운 입속으로. 캐릭터 만들기 32px 그림이 하는 일을 같은 뜻으로 192px에서 한다.
 */
export function applyMouth(data: Uint8ClampedArray, w: number, h: number, m: MouthBox | null, mouth: string): void {
  if (!m || mouth === 'neutral') return;
  const src = new Uint8ClampedArray(data);
  const half = Math.max(1, (m.x1 - m.x0) / 2);
  if (mouth === 'smile') {
    for (let x = m.x0 - 1; x <= m.x1 + 1; x++) {
      if (x < 0 || x >= w) continue;
      const t = Math.abs(x - m.cx) / half;
      const s = t < 0.45 ? 0 : t < 0.8 ? 1 : 2;
      if (!s) continue;
      for (let y = m.y0 - 1; y <= m.y1 + 1; y++) { if (y - s < 0 || y >= h) continue; copyPx(data, src, w, x, y - s, x, y); }
      for (let k = 0; k < s; k++) { const y = m.y1 + 1 - k; if (y < 0 || y >= h) continue; copyPx(data, src, w, x, y, x, Math.min(h - 1, m.y1 + 2)); }
    }
  } else if (mouth === 'small') {
    const k = 0.72;
    for (let y = m.y0 - 1; y <= m.y1 + 1; y++) {
      if (y < 0 || y >= h) continue;
      for (let x = m.x0 - 1; x <= m.x1 + 1; x++) {
        if (x < 0 || x >= w) continue;
        const u = (x - m.cx) / k;
        if (Math.abs(u) <= half + 1) copyPx(data, src, w, x, y, Math.max(0, Math.min(w - 1, Math.round(m.cx + u))), y);
        else copyPx(data, src, w, x, y, x < m.cx ? Math.max(0, m.x0 - 2) : Math.min(w - 1, m.x1 + 2), y);
      }
    }
  } else if (mouth === 'open') {
    const gap = 2, from = m.lineY1 + 1;
    for (let y = m.y1 + gap; y >= from + gap; y--) for (let x = m.x0 - 1; x <= m.x1 + 1; x++) { if (x < 0 || x >= w || y >= h) continue; copyPx(data, src, w, x, y, x, y - gap); }
    for (let y = from; y < from + gap; y++) for (let x = m.x0 + 1; x <= m.x1 - 1; x++) {
      if (x < 0 || x >= w || y >= h || Math.abs(x - m.cx) / half > 0.8) continue;
      const o = (y * w + x) * 4;
      data[o] = 66; data[o + 1] = 34; data[o + 2] = 34; data[o + 3] = 255;
    }
  }
}

/**
 * 볼 홍조(269) — 입 상자 기준 좌우 위 타원(반지름 가로 0.05 · 세로 0.03)의 피부색 픽셀에 분홍을 섞는다.
 * 271 — 칠한 뒤에 하므로 기준은 고른 피부색(`skin` — 없으면 기본 피부). 머리 · 수염 층은 그 뒤에 얹히니 건드리지 않는다.
 */
export function applyBlush(data: Uint8ClampedArray, w: number, h: number, m: MouthBox | null, skin = SKIN_TONES[PLAYER_BASE.skin]): void {
  if (!m) return;
  const s = split(skin);
  const sL = Math.max(1, lum(s[0], s[1], s[2]));
  const ref = [s[0] / sL, s[1] / sL, s[2] / sL];
  const cy = m.y0 - Math.round(h * 0.085), rx = Math.round(w * 0.05), ry = Math.round(h * 0.03);
  for (const cx of [m.cx - Math.round(w * 0.2), m.cx + Math.round(w * 0.2)]) {
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = Math.round(cx) - rx; x <= Math.round(cx) + rx; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const o = (y * w + x) * 4;
      if (data[o + 3] < 8) continue;
      const r = data[o], g = data[o + 1], b = data[o + 2];
      const L = Math.max(1, lum(r, g, b));
      if (L < 40 || Math.hypot(r / L - ref[0], g / L - ref[1], b / L - ref[2]) > 0.16) continue;
      const a = 0.32 * (1 - d2 * 0.6);
      data[o] = Math.round(r + (240 - r) * a); data[o + 1] = Math.round(g + (120 - g) * a); data[o + 2] = Math.round(b + (120 - b) * a);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// 층 합성(271)
// ---------------------------------------------------------------------------------------------------------------

/** 층 한 벌(전부 같은 크기 RGBA) — 기본판 · 라벨 마스크 · 머리 모양 층 · 수염 층(없으면 민낯) */
export interface FaceLayerSet { w: number; h: number; base: Uint8ClampedArray; mask: Uint8ClampedArray; hair?: Uint8ClampedArray | null; beard?: Uint8ClampedArray | null }

/**
 * 312 — 머리칼 밖으로 비어져 나온 민머리 두피의 너비 문턱(px · 192px 판 기준).
 * 머리 모양 층이 기본판 두피 윤곽(2px 칸 하나)에 붙어 그 윤곽을 자기 테두리로 쓰는 것은 정상이라(모든 머리 모양 — 실측 두께 ≤ 4px) 이것보다 두꺼운 것만 비운다.
 */
export const SKULL_CUT_MARGIN = 4;

/** 정사각 상자 팽창(반지름 r · 가로 → 세로 두 번) */
function dilateBox(m: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let run = -1;   // 마지막으로 본 켜진 칸(앞쪽)
    for (let x = 0; x < w; x++) { if (m[y * w + x]) run = x; if (run >= 0 && x - run <= r) t[y * w + x] = 1; }
    run = -1;
    for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) run = x; if (run >= 0 && run - x <= r) t[y * w + x] = 1; }
  }
  for (let x = 0; x < w; x++) {
    let run = -1;
    for (let y = 0; y < h; y++) { if (t[y * w + x]) run = y; if (run >= 0 && y - run <= r) o[y * w + x] = 1; }
    run = -1;
    for (let y = h - 1; y >= 0; y--) { if (t[y * w + x]) run = y; if (run >= 0 && run - y <= r) o[y * w + x] = 1; }
  }
  return o;
}

/** 312 — 두피 윤곽이 아니라 **살갗**으로 보는 밝기(기본판 윤곽선은 남 · 여 모두 이보다 어둡다 — 남은 윤곽이 따뜻한 갈색이라 라벨로는 못 가른다) */
const SKULL_SKIN_L = 90;

/** 312 — 머리 층을 머리에 맞춘 결과(합성 · 검수 도구가 같이 쓴다) */
export interface HairFit {
  /** 비울 기본판 픽셀(머리칼 밖으로 비어져 나온 정수리 두피) — 없으면 null */
  cut: Uint8Array | null;
  /** 머리칼 안에 갇혀 두피가 비치는 구멍 — 머리칼로 메운다. 없으면 null */
  holes: Uint8Array | null;
  cutCount: number;
  holeCount: number;
}

/**
 * 312 — 머리 모양 층을 기본판(민머리)에 맞춘다(사용자 리포트 「초상화 이미지를 잘 보면 머리 원형이 뒤에 비춰지고 있어」 — 상투 · 흰 머리).
 *  층은 기본판 위에 얹기만 해서 기본판을 지우지 못한다. 그래서 두 가지가 샜다.
 *  ① 머리칼 밖 두피 — 상투처럼 당겨 묶은 머리는 민머리보다 윤곽이 작아 그 바깥으로 피부색 호가 남았다. 비우는 곳은 둘이다.
 *     ⓐ 두꺼운 호 — 눈썹 줄 위 · 그 열에 머리칼이 있고 그 머리칼보다 위인 기본판 픽셀 가운데 머리칼에서 `margin`보다 먼 것(+ 둘레 `margin`).
 *     ⓑ 살갗 주머니 — 머리칼이 아닌 밝은 살갗 조각(4-이웃)이 눈썹 줄까지 내려가지 못하고(얼굴과 이어지지 않는다) 머리 바깥(투명) 3px 안에 있다
 *        (+ 둘레 2px의 어두운 윤곽). 머리 옆으로 비어져 나온 두피 · 머리칼 윤곽 사이로 내민 살색 점이 여기다.
 *     머리칼에 붙은 어두운 2px 윤곽은 남긴다 — 모든 머리 모양이 그것을 자기 테두리로 쓴다. 이마 · 관자놀이는 눈썹 줄 아래 얼굴로 이어져 남는다.
 *  ② 머리칼 안의 구멍 — 원판에서 밝은 갈색 머리칼이 피부와 채널 차 40 안이라 층에서 빠진 칸(271 추출 문턱). 기본 머리색에선 안 보이고
 *     흰 · 밝은 머리에서 살색 점이 된다. 눈썹 줄 위에서 머리칼에 완전히 둘러싸인 두피 조각을 머리칼로 메운다(`fillHairHoles`).
 */
export function fitHairToHead(base: Uint8ClampedArray, hair: Uint8ClampedArray, labels: Uint8Array, w: number, h: number, margin = SKULL_CUT_MARGIN): HairFit {
  const n = w * h;
  const hm = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (hair[i * 4 + 3] >= 8) hm[i] = 1;
  let browTop = h;
  for (let i = 0; i < n; i++) if (labels[i] === LABEL_BROW) { browTop = (i / w) | 0; break; }
  if (browTop >= h) browTop = Math.round(h * 0.36);   // 눈썹 라벨이 없으면 기본판 눈썹 줄 어림(설치판 70 ~ 72 / 192)
  const top = new Int32Array(w).fill(h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (hm[y * w + x] && top[x] === h) top[x] = y;
  // ① 정수리 두피
  const cand = new Uint8Array(n);
  for (let y = 0; y < browTop; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (top[x] < h && y < top[x] && base[i * 4 + 3] >= 8) cand[i] = 1;
  }
  const near = dilateBox(hm, w, h, margin);
  const thick = new Uint8Array(n); let anyThick = false;
  for (let i = 0; i < n; i++) if (cand[i] && !near[i]) { thick[i] = 1; anyThick = true; }
  // ⓑ 살갗 주머니 — 밝은 살갗(머리칼 아님) 조각이 눈썹 줄까지 못 내려가고 머리 바깥 3px 안
  const bright = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const o = i * 4; if (!hm[i] && base[o + 3] >= 8 && lum(base[o], base[o + 1], base[o + 2]) >= SKULL_SKIN_L) bright[i] = 1; }
  const empty = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (base[i * 4 + 3] < 8) empty[i] = 1;
  const nearEmpty = dilateBox(empty, w, h, 3);
  const pocket = new Uint8Array(n), seenB = new Uint8Array(n); let anyPocket = false;
  for (let s = 0; s < n; s++) {
    if (!bright[s] || seenB[s] || ((s / w) | 0) >= browTop) continue;
    const st = [s], mem: number[] = []; seenB[s] = 1; let face = false, edge = false;
    while (st.length) {
      const p = st.pop()!; mem.push(p); const x = p % w, y = (p / w) | 0;
      if (y >= browTop) face = true;
      if (nearEmpty[p] || x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (bright[q] && !seenB[q]) { seenB[q] = 1; st.push(q); }
      }
    }
    if (!face && edge) for (const p of mem) { pocket[p] = 1; anyPocket = true; }
  }
  let cut: Uint8Array | null = null, cutCount = 0;
  if (anyThick || anyPocket) {
    const g1 = anyThick ? dilateBox(thick, w, h, margin) : null, g2 = anyPocket ? dilateBox(pocket, w, h, 2) : null;
    cut = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (hm[i] || base[i * 4 + 3] < 8 || ((i / w) | 0) >= browTop) continue;
      // 두꺼운 호는 후보 안에서만 · 주머니는 그 조각 + 둘레의 어두운 윤곽만(다른 살갗은 먹지 않는다)
      if ((g1 && g1[i] && cand[i]) || pocket[i] || (g2 && g2[i] && !bright[i])) { cut[i] = 1; cutCount++; }
    }
  }
  // ② 구멍 — 눈썹 줄 위 · 머리칼 아닌 두피 조각이 머리칼로만 둘러싸였다(투명 · 눈썹 줄 아래로 새지 않는다)
  const seen = new Uint8Array(n), holes = new Uint8Array(n); let holeCount = 0;
  const solid = (i: number): boolean => base[i * 4 + 3] >= 8 && !(cut && cut[i]);
  for (let s = 0; s < n; s++) {
    if (seen[s] || hm[s] || !solid(s) || ((s / w) | 0) >= browTop) continue;
    const st = [s], mem: number[] = []; seen[s] = 1; let open = false;
    while (st.length) {
      const p = st.pop()!; mem.push(p); const x = p % w, y = (p / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) { open = true; continue; }
        const q = ny * w + nx;
        if (hm[q]) continue;
        if (!solid(q) || ny >= browTop) { open = true; continue; }
        if (!seen[q]) { seen[q] = 1; st.push(q); }
      }
    }
    if (!open) for (const p of mem) { holes[p] = 1; holeCount++; }
  }
  return { cut, holes: holeCount ? holes : null, cutCount, holeCount };
}

/** 312 — 구멍을 둘레 머리칼 색으로 메운 머리 층 사본(바깥에서 안으로 — 닿은 머리칼 이웃의 평균). 칠하기는 그 뒤 머리 층과 같다 */
export function fillHairHoles(hair: Uint8ClampedArray, holes: Uint8Array, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(hair);
  let left: number[] = [];
  for (let i = 0; i < holes.length; i++) if (holes[i]) left.push(i);
  while (left.length) {
    const next: number[] = [], done: [number, number, number, number][] = [];
    for (const p of left) {
      const x = p % w, y = (p / w) | 0; let r = 0, g = 0, b = 0, k = 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const o = (ny * w + nx) * 4; if (out[o + 3] < 8) continue;
        r += out[o]; g += out[o + 1]; b += out[o + 2]; k++;
      }
      if (k) done.push([p, r / k, g / k, b / k]); else next.push(p);
    }
    if (!done.length) break;   // 둘레가 비었다(구멍 정의상 없지만 무한 반복 방지)
    for (const [p, r, g, b] of done) { const o = p * 4; out[o] = Math.round(r); out[o + 1] = Math.round(g); out[o + 2] = Math.round(b); out[o + 3] = 255; }
    left = next;
  }
  return out;
}

/** 층 하나를 얹는다 — 불투명 픽셀을 복사하고(알파가 주인) 고른 색으로 칠한다(기준색 그대로면 복사만) */
function overlay(out: Uint8ClampedArray, layer: Uint8ClampedArray, n: number, swap: Swap | undefined, keep: boolean): void {
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (layer[o + 3] < 8) continue;
    out[o] = layer[o]; out[o + 1] = layer[o + 1]; out[o + 2] = layer[o + 2]; out[o + 3] = 255;
    if (!keep && swap) paint(out, o, swap);
  }
}

/**
 * 주인공 얼굴 한 장 — 기본판을 라벨대로 칠하고(피부 · 눈썹은 머리색의 색조 + 원래 밝기까지 · 눈동자 · 입술은 피부 밝기 비의 0.6제곱),
 * 입 모양 · 볼 홍조를 넣은 뒤(269 — 픽셀을 옮기므로 칠한 다음), 수염 층 → (312 머리 층을 머리에 맞추기 — 정수리 두피 비우기 · 구멍 메우기) → 머리 모양 층을 얹는다. 돌려준 배열은 새것(입력은 그대로).
 */
export function composePlayerFace(set: FaceLayerSet, cfg: CharConfig): Uint8ClampedArray {
  const { w, h } = set, n = w * h;
  const out = new Uint8ClampedArray(set.base);
  const labels = decodeMask(set.mask, n);
  const swaps = playerSwaps(cfg, !!set.beard);
  const lipK = swaps.skin ? Math.min(LIP_TONE_MAX, Math.pow(swaps.skin.toL / swaps.skin.fromL, LIP_TONE_EXP)) : 1;
  for (let i = 0; i < n; i++) {
    const lb = labels[i];
    if (!lb) continue;
    const o = i * 4;
    if (out[o + 3] < 8) continue;
    if (lb === LABEL_SKIN) { if (swaps.skin) paint(out, o, swaps.skin); }
    else if (lb === LABEL_BROW) {
      if (swaps.keepHair) continue;
      // 눈썹은 머리색의 색조만 — 밝기가 원래 눈썹을 넘으면 그 비로 줄인다(흰 머리 → 짙은 잿빛 · 검은 머리는 그대로 — 270(2))
      const L0 = lum(out[o], out[o + 1], out[o + 2]);
      paint(out, o, swaps.hair);
      const L1 = lum(out[o], out[o + 1], out[o + 2]);
      if (L1 > L0 && L1 > 0) { const k = L0 / L1; out[o] = Math.round(out[o] * k); out[o + 1] = Math.round(out[o + 1] * k); out[o + 2] = Math.round(out[o + 2] * k); }
    } else if (lb === LABEL_EYE) { if (swaps.eye) paint(out, o, swaps.eye); }
    else if (lb === LABEL_LIPS && lipK !== 1) {
      out[o] = Math.min(255, Math.round(out[o] * lipK)); out[o + 1] = Math.min(255, Math.round(out[o + 1] * lipK)); out[o + 2] = Math.min(255, Math.round(out[o + 2] * lipK));
    }
  }
  if (swaps.shirt) {
    const shirt = shirtRegion(set.base, labels, w, h);
    for (let i = 0; i < n; i++) if (shirt[i]) paint(out, i * 4, swaps.shirt);
  }
  const mouth = cfg.look.mouth ?? 'neutral';
  if (mouth !== 'neutral' || cfg.look.blush) {
    const m = mouthFromLabels(labels, set.base, w, h);
    applyMouth(out, w, h, m, mouth);
    if (cfg.look.blush) applyBlush(out, w, h, m, SKIN_TONES[cfg.look.skin] ?? SKIN_TONES[PLAYER_BASE.skin]);
  }
  if (set.beard) overlay(out, set.beard, n, swaps.beard, !!swaps.keepBeard);
  if (set.hair) {
    // 312 — 머리칼 밖으로 비어져 나온 정수리 두피는 그리지 않고(상투 — 층이 기본판을 지우지 못해 피부색 호가 남았다),
    //       머리칼 안에 갇힌 두피 구멍은 머리칼로 메운다(흰 · 밝은 머리에서 살색 점)
    const fit = fitHairToHead(set.base, set.hair, labels, w, h);
    if (fit.cut) for (let i = 0; i < n; i++) if (fit.cut[i]) out[i * 4 + 3] = 0;
    overlay(out, fit.holes ? fillHairHoles(set.hair, fit.holes, w, h) : set.hair, n, swaps.hair, swaps.keepHair);
  }
  return out;
}

/** 합성 결과 텍스처 키 꼬리 — 옵션이 같으면 같은 그림이라 한 번만 굽는다(`face_player_<성별>_<얼굴형>_<머리 모양>` 뒤에 붙인다) */
export function playerFaceVariant(cfg: CharConfig, hasBeardLayer: boolean): string {
  const { look } = cfg;
  const mouth = look.mouth ?? 'neutral';
  const shirt = playerShirtColor(cfg);
  const shirtTail = shirt !== null && shirt !== PLAYER_BASE_SHIRT ? `_s_${shirt.toString(16)}` : '';
  return `_v_${look.skin}_${look.hair}_${look.eye}${hasBeardLayer && look.beard >= 0 ? `_bd_${look.beard}` : ''}${mouth !== 'neutral' ? `_m_${mouth}` : ''}${look.blush ? '_b' : ''}${shirtTail}`;
}
