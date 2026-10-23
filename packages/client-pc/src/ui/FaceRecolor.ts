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
 */

import { HAIR_COLORS, SKIN_TONES, EYE_COLORS, type CharConfig } from '@tra/core';

/** 주인공 기본 얼굴의 기준색(`tools/gemini_face_art.cjs` PLAYER_BASE와 같다 — 층 원판은 전부 이 색으로 그린다) */
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };
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
export interface PlayerSwaps { hair: Swap; keepHair: boolean; skin?: Swap; eye?: Swap; beard?: Swap; keepBeard?: boolean }

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
 * 입 모양 · 볼 홍조를 넣은 뒤(269 — 픽셀을 옮기므로 칠한 다음), 수염 층 → 머리 모양 층을 얹는다. 돌려준 배열은 새것(입력은 그대로).
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
  const mouth = cfg.look.mouth ?? 'neutral';
  if (mouth !== 'neutral' || cfg.look.blush) {
    const m = mouthFromLabels(labels, set.base, w, h);
    applyMouth(out, w, h, m, mouth);
    if (cfg.look.blush) applyBlush(out, w, h, m, SKIN_TONES[cfg.look.skin] ?? SKIN_TONES[PLAYER_BASE.skin]);
  }
  if (set.beard) overlay(out, set.beard, n, swaps.beard, !!swaps.keepBeard);
  if (set.hair) overlay(out, set.hair, n, swaps.hair, swaps.keepHair);
  return out;
}

/** 합성 결과 텍스처 키 꼬리 — 옵션이 같으면 같은 그림이라 한 번만 굽는다(`face_player_<성별>_<얼굴형>_<머리 모양>` 뒤에 붙인다) */
export function playerFaceVariant(cfg: CharConfig, hasBeardLayer: boolean): string {
  const { look } = cfg;
  const mouth = look.mouth ?? 'neutral';
  return `_v_${look.skin}_${look.hair}_${look.eye}${hasBeardLayer && look.beard >= 0 ? `_bd_${look.beard}` : ''}${mouth !== 'neutral' ? `_m_${mouth}` : ''}${look.blush ? '_b' : ''}`;
}
