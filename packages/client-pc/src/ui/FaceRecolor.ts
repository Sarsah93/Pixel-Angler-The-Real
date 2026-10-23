/**
 * @file FaceRecolor.ts
 * @description 269차(2) · 270차 — 그림 얼굴 초상(주인공)의 **색 치환 · 입 모양 · 볼 홍조** 순수 함수. Phaser · DOM 없이 RGBA 배열만 다룬다 —
 *  게임(`FacePhoto.ts`)과 검수 도구(Node 몽타주)가 같은 함수를 쓴다(「여기선 예쁜데 인게임은 다른」 상태를 막는다).
 *  규칙의 내력은 268(치환 자리 규칙) · 269(얼굴형 판 · 입 · 홍조) · 270(두 톤 칠하기 · 씨앗 경쟁 번짐 · 흰자 줄 눈동자 · 수염 색) 워크로그.
 *
 *  270 — 사용자 「하얗게 뜬 부분, 컬러 품질이 맞지 않는 부분」: 네모 친 넷은 전부 **기준색과 다른 머리 · 피부를 고른** 조합이었다(치환 경로).
 *  원인 셋 = ① 곱셈 칠하기(밝은 색 × 밝기 비 > 255 → 잘림 → 흰색) ② 색조만으로 머리 · 피부 그늘을 못 가른다(그늘진 피부 = 머리색)
 *  ③ 눈동자 판정이 위아래 줄 흰자까지 받아 눈꺼풀 선이 눈 색이 됐다. 해결 = 두 톤 모델 · 씨앗 경쟁 번짐 · 2px 열림 눈동자 덩어리(아래 주석).
 */

import { HAIR_COLORS, SKIN_TONES, EYE_COLORS, type CharConfig } from '@tra/core';

/** 주인공 기본 얼굴의 기준색(`tools/gemini_face_art.cjs` PLAYER_BASE와 같다 — 수염판의 수염도 기준 머리색) */
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };

/** 색조(밝기로 나눈 RGB) 차 허용 — 같은 색의 밝은 · 어두운 단계는 색조가 거의 같다. 어두운 픽셀(L < 60)은 양자화 잡음만큼 더 넓힌다(L 35에서 0.18) */
const CHROMA_TOL = 0.13;
const CHROMA_TOL_DARK_ADD = 0.12;
const CHROMA_DARK_L = 60;
/** 머리 씨앗 성분 최소 픽셀 · 피부 씨앗 성분 최소 픽셀(100 — 머리칼 사이 피부색조 하이라이트는 못 들어온다) ·
 *  얼굴 가운데 상자(가로 0.25~0.75 · 세로 0.33~0.85) 안이면 40(돌아선 얼굴의 좁은 뺨 띠 — 270 긴 머리 수염판) */
const HAIR_MIN_COMPONENT = 40;
const SKIN_MIN_COMPONENT = 100;
const SKIN_MIN_INNER = 40;
const FACE_BOX = { x0: 0.25, x1: 0.75, y0: 0.33, y1: 0.85 };
/** 머리 씨앗 = 머리색 성분 중 **정수리 쪽(세로 0.30 위)에 닿는** 것 — 목 · 귀 · 코 그늘은 거기 닿지 않는다. 씨앗은 2px 깎아 가는 다리를 끊는다(셀 2px) */
const HAIR_TOP = 0.30;
const HAIR_ERODE = 1;
const HAIR_SEED_MIN_TOTAL = 150;
/** 눈썹 = 눈 띠 위쪽의 납작한 머리색 조각(가로 ≥ 1.5 × 세로 · 세로 ≤ 0.07 · 흰자 위) — 머리색을 따른다(흰 머리 → 잿빛 눈썹) */
const BROW_BAND = { y0: 0.28, y1: 0.46, x0: 0.2, x1: 0.85 };
const BROW_MIN = 12;
const BROW_MAX_H = 0.07;
const BROW_MAX_L = 78;
/** 정수리에 안 닿는 머리색 성분(땋은 머리 · 늘어진 곱슬 · 포니테일 아래)도 씨앗 — 윤곽선이 피부와 갈라 **피부와 직접 맞닿은 픽셀 비율이 2% 미만**일 때
 *  (목 · 귀 그늘은 밝은 피부와 긴 경계로 맞닿는다 — 포니테일 판 실측 목 4.4% · 땋은 머리 0.5% 안팎) */
const HAIR_LOOSE_CONTACT = 0.02;
const HAIR_LOOSE_MIN = 16;
/** 깊은 그늘 머리 덩어리(L 12~34 — 곱슬 옆 · 그늘진 땋은 머리) = 어두운 따뜻한 픽셀을 2px 깎아 ≥ 30px 남는 것(윤곽선 · 콧구멍 · 입속은 깎이면 사라진다) */
const DARK_L_MIN = 12;
const DARK_ERODE = 2;
const DARK_MIN_COMPONENT = 30;
const DARK_EYE_R = 8;
/** 머리 씨앗 중 밝은 피부와 **직접**(2px 안 · 윤곽선 없이) 맞닿은 자리에서 안쪽으로 12px · 밝기 차 ≤ 18로 번져 들어간 것은 얼굴 그늘(코 옆 · 귓속)이다 — 씨앗에서 뺀다 */
const SEAM_DEPTH = 12;
const SEAM_L_STEP = 18;
const SEAM_MIN = 20;
/** 수염(수염판) 구역 = 입 위 0.05부터 · 입 줄의 뺨 폭 + 2px 안 · 아래 끝 = 턱 윤곽선(입 아래에서 가운데 띠 ±0.12의 어두운(L < 40) 비율이 0.5를 넘는 첫 줄 + 3px —
 *  5판 실측 0.55~1.00 · 수염 결은 0.1~0.4) · 코 바로 아래 제외 */
const BEARD_ABOVE_MOUTH = 0.05;
const BEARD_SPAN_PAD = 2;
const CHIN_BAND = 0.12;
const CHIN_DARK_L = 40;
const CHIN_DARK_FRAC = 0.5;
const CHIN_FALLBACK = 0.25;
const BEARD_NOSE_DY = 0.03;
const BEARD_NOSE_DX = 0.07;
const BEARD_SEED_L_MAX = 150;
/** 흰자 = 밝고(L) 채도 낮은(퍼짐) 픽셀 — 24장 실측 L 220~240 · 퍼짐 20~30. 눈 띠 밖에서는 아주 무채색(귀걸이 · 이)만 흰색으로 본다 */
const EYE_WHITE_L = 170;
const EYE_WHITE_SPREAD = 45;
const PLAIN_WHITE_SPREAD = 16;
/** 눈 띠(얼굴 틀 기준 비율) — 설치 틀이 같아 눈은 세로 0.40~0.48에 온다 */
const EYE_BAND = { y0: 0.36, y1: 0.52, x0: 0.2, x1: 0.8 };
/** 눈 띠 안 흰 조각 크기(귀걸이 · 이는 밖) · 눈동자 후보 어두운 픽셀 상한(L) · 열림 반지름(가는 속눈썹 · 눈꼬리 선을 지운다) · 눈동자 덩어리 크기 */
const EYE_WHITE_MAX = 60;
const EYE_DARK_L = 80;
const EYE_OPEN_R = 2;
const EYE_BLOB_MIN = 12;
const EYE_BLOB_MAX = 200;
/** 흰자 둘레(속눈썹 · 눈꺼풀)에 머리 번짐이 못 들어오는 반지름 */
const HAIR_WHITE_R = 4;
/** 번짐 후보 = 따뜻한 색(r ≥ g ≥ b 근방)이고 이 밝기 안 — 윤곽선(L < 30)은 벽, 흰색은 뺀다 */
const AMB_L_MIN = 34;
/** 머리 번짐이 넘지 않는 밝기(피부 기준 188) · 번짐 횟수(같은 거리면 피부 → 수염 → 머리 순) */
const HAIR_GROW_L_MAX = 178;
const GROW_ROUNDS = 600;
/** 두 톤 칠하기의 흰 성분 유지 하한(어두운 색으로 갈 때 하이라이트 흰빛을 이만큼은 남긴다) · 입술 밝기 지수 */
const WHITE_KEEP_MIN = 0.35;
const LIP_TONE_EXP = 0.6;

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
/** 치환 표 — 머리는 항상 있다(마스크용 · 기준색 그대로면 `keepHair`). 수염은 수염판일 때만(기준색 그대로면 `keepBeard`) */
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

function chromaDist(r: number, g: number, b: number, L: number, s: Swap): number {
  return Math.hypot(r / L - s.chroma[0], g / L - s.chroma[1], b / L - s.chroma[2]);
}

/**
 * 한 픽셀 칠하기 — **두 톤 모델**(270). 그림의 색 = 기준색 × a + 흰색 × b(최소제곱 · 음수면 한쪽만)로 풀고, 고른 색 × a + 흰색 × b로 다시 그린다.
 *  - 그늘(a < 1)은 비율 그대로 → 어두운 색으로 갈수록 음영이 따라온다.
 *  - 기준보다 밝은 단계(a > 1)는 고른 색에 남은 여유만큼만 올린다(`compress` — 흰 머리 · 밝은 피부에서 곱이 255를 넘어 잘리던 자리).
 *    단조라 결의 순서는 남는다(잘라 내면 평평한 흰 덩어리가 됐다).
 *  - 흰 성분(코끝 · 볼 하이라이트)은 어두운 색으로 갈 때 밝기 비만큼만 남기고 나머지는 색으로 돌린다(`whiteKeep` — 검은 피부에 흰 점이 뜨지 않게).
 *  그래도 한 채널이 255를 넘으면 셋을 같은 비로 줄인다(색조 보존 — 흰색 쪽으로 접지 않는다).
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

const isWarm = (r: number, g: number, b: number): boolean => r >= g - 4 && g >= b - 4;

interface Comp { size: number; minY: number; minX: number; maxX: number; maxY: number; cx: number; cy: number }

/** 8-연결 성분 표 — label[i] = 성분 번호(1부터 · 0 = 없음) */
function labelComponents(mask: Uint8Array, w: number, h: number): { label: Int32Array; comps: Comp[] } {
  const n = w * h, label = new Int32Array(n); const comps: Comp[] = [];
  for (let i = 0; i < n; i++) {
    if (!mask[i] || label[i]) continue;
    const id = comps.length + 1; const stack = [i]; label[i] = id;
    const c: Comp = { size: 0, minY: h, minX: w, maxX: 0, maxY: 0, cx: 0, cy: 0 };
    while (stack.length) {
      const p = stack.pop() as number; const x = p % w, y = (p / w) | 0;
      c.size++; c.cx += x; c.cy += y;
      if (y < c.minY) c.minY = y; if (y > c.maxY) c.maxY = y; if (x < c.minX) c.minX = x; if (x > c.maxX) c.maxX = x;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && !label[q]) { label[q] = id; stack.push(q); }
      }
    }
    c.cx /= c.size; c.cy /= c.size; comps.push(c);
  }
  return { label, comps };
}

/** 4-이웃이 모두 켜진 픽셀만 남기는 깎기 */
function erode4(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (mask[i] && mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w]) out[i] = 1;
  }
  return out;
}

const LABEL_HAIR = 1, LABEL_SKIN = 2, LABEL_BEARD = 3, LABEL_EYE = 4;

/**
 * 기준색 둘레의 픽셀을 고른 색으로 — 색조로 후보를 고르고 **자리로 가른다**(268 · 269(2) · 270). 색만으로는 그늘진 피부와 머리를 못 가른다
 * (그늘 피부의 색조 거리 = 머리 0.06 · 피부 0.16 — 268 · 270 실측). 270 규칙:
 *  - 씨앗: 머리 = 머리색 성분(1px 깎은 뒤 ≥ 40px)이 **정수리 쪽에 닿거나 피부와 직접 맞닿은 비율이 2% 미만**(윤곽선으로 끊긴 땋은 머리 · 곱슬)인 것 +
 *    눈썹 조각(눈 띠 위 · 납작 · 어두움) ·
 *    피부 = 피부색 큰 덩어리(≥ 100px) · 수염(수염판) = 수염 구역(입 위 0.08 ~ 어두운 결이 끝나는 줄 · 뺨 폭 + 8px) 안의 머리색 픽셀 ·
 *    눈동자 = 눈 띠 안 어두운 픽셀을 2px 열어(가는 속눈썹 · 눈꼬리 선 제거) 남은 덩어리 중 **흰자에 붙은** 것(줄은 흰자 위 끝 ~ 아래 끝 + 2px).
 *  - 번짐: 따뜻한 중간 톤(윤곽선 L < 34는 벽 · 흰색 · 입술 · 눈 제외)을 씨앗에서 4-이웃으로 경쟁해 가져간다 —
 *    같은 거리면 피부 → 수염 → 머리 순(목 · 귀 · 코 그늘은 피부 쪽이 가깝다). 머리는 흰자 둘레 4px · L > 178에, 수염은 수염 구역 밖에 못 들어간다.
 *  - 어디에도 안 닿은 머리색 조각(≥ 40px — 윤곽선으로 끊긴 머리 타래)은 머리.
 *  어느 것에도 안 걸리는 픽셀(윤곽선 · 옷 · 흰자)은 그대로. 입술은 피부 밝기 비의 0.6제곱만 따른다(색조는 그대로).
 */
export function recolorFace(data: Uint8ClampedArray, w: number, h: number, swaps: PlayerSwaps, mouthBox?: MouthBox | null): number {
  const n = w * h;
  const cls = new Int8Array(n); // 1 머리색 · 2 피부색
  const Ls = new Float32Array(n);
  const alive = new Uint8Array(n), warm = new Uint8Array(n), white = new Uint8Array(n);
  const skinRef = swaps.skin ?? swapOf(SKIN_TONES[PLAYER_BASE.skin], SKIN_TONES[PLAYER_BASE.skin], 0.5, 1.4);
  const bx0 = Math.round(w * EYE_BAND.x0), bx1 = Math.round(w * EYE_BAND.x1), by0 = Math.round(h * EYE_BAND.y0), by1 = Math.round(h * EYE_BAND.y1);
  const inBand = (x: number, y: number): boolean => x >= bx0 && x <= bx1 && y >= by0 && y <= by1;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (data[o + 3] < 8) continue;
    alive[i] = 1;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const L = Math.max(1, lum(r, g, b));
    Ls[i] = L;
    if (isWarm(r, g, b)) warm[i] = 1;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    if (L > EYE_WHITE_L && spread < EYE_WHITE_SPREAD && (spread < PLAIN_WHITE_SPREAD || inBand(i % w, (i / w) | 0))) { white[i] = 1; continue; }
    let best = 0, bestD = L < CHROMA_DARK_L ? CHROMA_TOL + CHROMA_TOL_DARK_ADD * (CHROMA_DARK_L - L) / CHROMA_DARK_L : CHROMA_TOL;
    for (const [s, id] of [[swaps.hair, 1], [skinRef, 2]] as Array<[Swap, number]>) {
      if (L < s.lo || L > s.hi) continue;
      const d = chromaDist(r, g, b, L, s);
      if (d < bestD) { bestD = d; best = id; }
    }
    cls[i] = best;
  }
  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h;
  // 입술 — 입 상자 안의 분홍 픽셀(`findMouth`의 입술살 조건)은 번짐이 들어가지 않는다(상자 안 수염 · 피부는 평소대로)
  const mb = mouthBox ? { x0: mouthBox.x0 - 2, x1: mouthBox.x1 + 2, y0: mouthBox.y0 - 3, y1: mouthBox.y1 + 3 } : null;
  const inMouth = (i: number): boolean => {
    if (!mb) return false;
    const x = i % w, y = (i / w) | 0;
    if (x < mb.x0 || x > mb.x1 || y < mb.y0 || y > mb.y1) return false;
    const o = i * 4; const r = data[o], g = data[o + 1], b = data[o + 2];
    return Ls[i] < 215 && r - g >= 35 && g - b <= 0.45 * (r - g); // 입술 = 붉고 g·b가 가깝다(머리색 · 피부는 g-b가 r-g의 0.8배)
  };
  const label = new Uint8Array(n);
  // 눈 — ① 눈 띠 안 작은 흰 조각 = 흰자(그 둘레 4px는 머리 금지) ② 띠 안 어두운 픽셀을 2px 열어(깎기 → 어두운 픽셀 안에서 넓히기) 가는 선(속눈썹 · 눈꼬리)을 지우고
  //      ③ 남은 덩어리 중 흰자에 2px 안으로 붙은 것이 눈동자 — 줄은 그 흰자의 위 끝부터 아래 끝 + 2px까지(위 줄은 눈꺼풀 선)
  const eyeWhite = new Uint8Array(n), nearWhite = new Uint8Array(n);
  {
    const bandWhite = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (white[i] && inBand(i % w, (i / w) | 0)) bandWhite[i] = 1;
    const { label: wl, comps: wc } = labelComponents(bandWhite, w, h);
    for (let i = 0; i < n; i++) { const id = wl[i]; if (id && wc[id - 1].size >= 2 && wc[id - 1].size <= EYE_WHITE_MAX) eyeWhite[i] = 1; }
    const darkEye = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!eyeWhite[i]) { if (alive[i] && !white[i] && Ls[i] < EYE_DARK_L && inBand(i % w, (i / w) | 0)) darkEye[i] = 1; continue; }
      const x = i % w, y = (i / w) | 0;
      for (let dy = -HAIR_WHITE_R; dy <= HAIR_WHITE_R; dy++) for (let dx = -HAIR_WHITE_R; dx <= HAIR_WHITE_R; dx++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny)) nearWhite[ny * w + nx] = 1; }
    }
    let core: Uint8Array = darkEye;
    for (let k = 0; k < EYE_OPEN_R; k++) core = erode4(core, w, h);
    for (let k = 0; k < EYE_OPEN_R; k++) {
      const next = new Uint8Array(core);
      for (let i = 0; i < n; i++) {
        if (!core[i]) continue;
        const x = i % w, y = (i / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const nx = x + dx, ny = y + dy; if (inside(nx, ny) && darkEye[ny * w + nx]) next[ny * w + nx] = 1; }
      }
      core = next;
    }
    const { label: el, comps: ec } = labelComponents(core, w, h);
    const rowMin = new Int32Array(ec.length).fill(h), rowMax = new Int32Array(ec.length).fill(-1);
    for (let i = 0; i < n; i++) {
      if (!eyeWhite[i]) continue;
      const x = i % w, y = (i / w) | 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy; if (!inside(nx, ny)) continue;
        const id = el[ny * w + nx]; if (!id) continue;
        if (y < rowMin[id - 1]) rowMin[id - 1] = y; if (y > rowMax[id - 1]) rowMax[id - 1] = y;
      }
    }
    for (let i = 0; i < n; i++) {
      const id = el[i]; if (!id || rowMax[id - 1] < 0) continue;
      const c = ec[id - 1]; if (c.size < EYE_BLOB_MIN || c.size > EYE_BLOB_MAX) continue;
      const y = (i / w) | 0;
      if (y >= rowMin[id - 1] && y <= rowMax[id - 1] + 2) label[i] = LABEL_EYE;
    }
  }
  // 피부 씨앗 — 피부색 큰 덩어리(머리 씨앗의 피부 이웃 비를 재는 데도 쓴다)
  {
    const skinMask = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (cls[i] === 2 && !label[i]) skinMask[i] = 1;
    const { label: sl, comps } = labelComponents(skinMask, w, h);
    const inner = (c: Comp): boolean => c.cx >= w * FACE_BOX.x0 && c.cx <= w * FACE_BOX.x1 && c.cy >= h * FACE_BOX.y0 && c.cy <= h * FACE_BOX.y1;
    for (let i = 0; i < n; i++) { const id = sl[i]; if (!id) continue; const c = comps[id - 1]; if (c.size >= SKIN_MIN_COMPONENT || (c.size >= SKIN_MIN_INNER && inner(c))) label[i] = LABEL_SKIN; }
  }
  // 머리 씨앗 — 머리색 성분을 1px 깎아 가는 다리(목 그늘 ↔ 포니테일)를 끊고, 정수리 쪽에 닿거나 피부와 거의 안 맞닿는 큰 성분만. 너무 적으면(짧은 머리) 안 깎은 성분으로
  const hairMask = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (cls[i] === 1 && !inMouth(i) && !nearWhite[i]) hairMask[i] = 1;
  const mouthY = mouthBox ? mouthBox.y0 - 4 : h * 0.6;
  const seedFrom = (mask: Uint8Array): number => {
    const { label: hl, comps } = labelComponents(mask, w, h); let total = 0;
    const contact = new Int32Array(comps.length);
    for (let i = 0; i < n; i++) {
      const id = hl[i]; if (!id) continue;
      const x = i % w, y = (i / w) | 0; let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny) && label[ny * w + nx] === LABEL_SKIN) { near = true; break; } }
      if (near) contact[id - 1]++;
    }
    for (let i = 0; i < n; i++) {
      const id = hl[i]; if (!id) continue; const c = comps[id - 1];
      if (c.size < HAIR_LOOSE_MIN) continue;
      const top = c.size >= HAIR_MIN_COMPONENT && c.minY < h * HAIR_TOP;
      const loose = contact[id - 1] / c.size < HAIR_LOOSE_CONTACT && (!swaps.beard || c.cy < mouthY);
      if (top || loose) { label[i] = LABEL_HAIR; total++; }
    }
    return total;
  };
  let eroded: Uint8Array = hairMask;
  for (let k = 0; k < HAIR_ERODE; k++) eroded = erode4(eroded, w, h);
  if (seedFrom(eroded) < HAIR_SEED_MIN_TOTAL) seedFrom(hairMask);
  // 깊은 그늘 머리 덩어리 — 어두운(L 12~34) 따뜻한 픽셀(흰자 둘레 8px · 입술 제외)을 2px 깎아 큰 것만 남기고 어두운 픽셀 안에서 2px 되넓힌다(피부에 붙은 윤곽선은 빼고) → 머리
  {
    const nearEye = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!eyeWhite[i]) continue;
      const x = i % w, y = (i / w) | 0;
      for (let dy = -DARK_EYE_R; dy <= DARK_EYE_R; dy++) for (let dx = -DARK_EYE_R; dx <= DARK_EYE_R; dx++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny)) nearEye[ny * w + nx] = 1; }
    }
    const dark = new Uint8Array(n), skinSide = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!alive[i] || white[i] || label[i] || Ls[i] < DARK_L_MIN || Ls[i] >= AMB_L_MIN || inMouth(i) || nearEye[i]) continue;
      const o = i * 4; if (data[o] >= data[o + 2] - 4 && data[o] >= data[o + 1] - 4) dark[i] = 1;
      const x = i % w, y = (i / w) | 0;
      for (let dy = -1; dy <= 1 && !skinSide[i]; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny) && label[ny * w + nx] === LABEL_SKIN) { skinSide[i] = 1; break; } }
    }
    let core: Uint8Array = dark;
    for (let k = 0; k < DARK_ERODE; k++) core = erode4(core, w, h);
    const { label: dl, comps } = labelComponents(core, w, h);
    const keep = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const id = dl[i]; if (id && comps[id - 1].size >= DARK_MIN_COMPONENT) keep[i] = 1; }
    for (let k = 0; k < DARK_ERODE; k++) {
      const next = new Uint8Array(keep);
      for (let i = 0; i < n; i++) {
        if (!keep[i]) continue;
        const x = i % w, y = (i / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const nx = x + dx, ny = y + dy; if (inside(nx, ny) && dark[ny * w + nx] && !skinSide[ny * w + nx]) next[ny * w + nx] = 1; }
      }
      for (let i = 0; i < n; i++) keep[i] = next[i];
    }
    for (let i = 0; i < n; i++) if (keep[i] && !label[i]) label[i] = LABEL_HAIR;
  }
  // 얼굴 그늘 빼기 — 머리 씨앗이 밝은 피부와 직접(2px 안) 맞닿은 이음새에서 안쪽으로 밝기가 매끈하게 이어지는 곳(코 옆 · 귓속 그늘)은 머리가 아니다
  {
    const seam: number[] = []; const depth = new Int16Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      if (label[i] !== LABEL_HAIR) continue;
      const x = i % w, y = (i / w) | 0; let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (inside(nx, ny) && label[ny * w + nx] === LABEL_SKIN) { near = true; break; } }
      if (near) { seam.push(i); depth[i] = 0; }
    }
    let front = seam;
    for (let d = 1; d <= SEAM_DEPTH && front.length; d++) {
      const next: number[] = [];
      for (const i of front) {
        const x = i % w, y = (i / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = x + dx, ny = y + dy; if (!inside(nx, ny)) continue;
          const q = ny * w + nx;
          if (label[q] !== LABEL_HAIR || depth[q] >= 0 || Math.abs(Ls[q] - Ls[i]) > SEAM_L_STEP) continue;
          depth[q] = d; next.push(q);
        }
      }
      front = next;
    }
    const flooded = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (depth[i] >= 0) flooded[i] = 1;
    const { label: fl, comps } = labelComponents(flooded, w, h);
    for (let i = 0; i < n; i++) { const id = fl[i]; if (id && comps[id - 1].size >= SEAM_MIN) label[i] = 0; }
  }
  // 눈썹 — 안 깎은 머리색 성분 중 눈 띠 위 · 흰자 위 · 납작하고 어두운 조각(이마 그늘은 밝아서 못 들어온다)
  const meanL = (lab: Int32Array, count: number): Float32Array => {
    const sum = new Float32Array(count), cnt = new Float32Array(count);
    for (let i = 0; i < n; i++) { const id = lab[i]; if (id) { sum[id - 1] += Ls[i]; cnt[id - 1]++; } }
    for (let k = 0; k < count; k++) sum[k] = cnt[k] ? sum[k] / cnt[k] : 255;
    return sum;
  };
  let whiteTop = h;
  for (let i = 0; i < n; i++) if (eyeWhite[i]) { whiteTop = (i / w) | 0; break; }
  {
    const { label: hl, comps } = labelComponents(hairMask, w, h);
    const hasHair = new Uint8Array(comps.length);
    for (let i = 0; i < n; i++) if (hl[i] && label[i] === LABEL_HAIR) hasHair[hl[i] - 1] = 1;
    const mL = meanL(hl, comps.length);
    for (let i = 0; i < n; i++) {
      const id = hl[i]; if (!id || label[i] || hasHair[id - 1]) continue; const c = comps[id - 1]; // 머리 씨앗이 든 성분은 번짐이 채운다(깎인 테두리를 통째로 되살리면 코 옆 그늘 · 콧수염까지 머리가 된다)
      const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
      const brow = c.size >= BROW_MIN && bw >= bh && bh <= h * BROW_MAX_H && c.maxY < whiteTop - 2 && mL[id - 1] <= BROW_MAX_L
        && c.minY >= h * BROW_BAND.y0 && c.maxY <= h * BROW_BAND.y1 && c.minX >= w * BROW_BAND.x0 && c.maxX <= w * BROW_BAND.x1;
      if (brow) label[i] = LABEL_HAIR;
    }
  }
  // 수염(수염판) — 구역으로 가른다(연결로는 못 가른다 — 긴 머리는 수염에 붙고, 짧은 수염은 결이 끊긴다). 구역 안의 머리색 · 따뜻한 중간 톤은 전부 수염 씨앗(머리 씨앗도 바꾼다)
  let beardBox: { x0: number; x1: number; y0: number; y1: number } | null = null;
  if (swaps.beard && mouthBox) {
    const top = Math.max(0, Math.round(mouthBox.y0 - h * BEARD_ABOVE_MOUTH));
    let fx0 = w, fx1 = -1;
    for (let y = Math.max(0, Math.round(mouthBox.y0)); y <= Math.min(h - 1, mouthBox.y1 + 6); y++) for (let x = 0; x < w; x++) { // 입 줄의 뺨 폭(귀 줄은 뺀다)
      if (label[y * w + x] !== LABEL_SKIN) continue;
      if (x < fx0) fx0 = x; if (x > fx1) fx1 = x;
    }
    if (fx1 >= 0) {
      const x0 = Math.max(0, fx0 - BEARD_SPAN_PAD), x1 = Math.min(w - 1, fx1 + BEARD_SPAN_PAD);
      let bottom = Math.min(h - 1, Math.round(mouthBox.y1 + h * CHIN_FALLBACK));
      const cb = Math.round(w * CHIN_BAND), ccx = Math.round(mouthBox.cx);
      for (let y = Math.round(mouthBox.y1) + 6; y < h; y++) {
        let dark = 0, t = 0;
        for (let x = ccx - cb; x <= ccx + cb; x++) { if (!inside(x, y)) continue; const i = y * w + x; if (!alive[i]) continue; t++; if (Ls[i] < CHIN_DARK_L) dark++; }
        if (t && dark / t >= CHIN_DARK_FRAC) { bottom = Math.min(h - 1, y + 3); break; }
      }
      beardBox = { x0, x1, y0: top, y1: bottom };
      const noseY = mouthBox.y0 - h * BEARD_NOSE_DY, noseDx = w * BEARD_NOSE_DX;
      for (let y = top; y <= bottom; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!alive[i] || white[i] || label[i] === LABEL_EYE || label[i] === LABEL_SKIN || inMouth(i)) continue;
        if (y < noseY && Math.abs(x - mouthBox.cx) < noseDx) continue; // 코 바로 아래(콧구멍 그늘)는 번짐에 맡긴다
        if (label[i] === LABEL_HAIR || (cls[i] === 1 && Ls[i] <= BEARD_SEED_L_MAX)) label[i] = LABEL_BEARD;
      }
    }
  }
  // 경쟁 번짐 — 후보 = 따뜻한 중간 톤 · 흰색 · 입술 · 눈 아님. 피부 · 수염은 매 번, 머리는 두 번에 한 번
  const amb = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (alive[i] && !label[i] && !white[i] && warm[i] && Ls[i] >= AMB_L_MIN && !inMouth(i)) amb[i] = 1;
  const fronts: number[][] = [[], [], [], []];
  for (let i = 0; i < n; i++) if (label[i] && label[i] !== LABEL_EYE) fronts[label[i]].push(i);
  const grow = (which: number): void => {
    const next: number[] = [];
    for (const i of fronts[which]) {
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const q = ny * w + nx;
        if (!amb[q] || label[q]) continue;
        if (which === LABEL_HAIR && (nearWhite[q] || Ls[q] > HAIR_GROW_L_MAX)) continue;
        if (which === LABEL_BEARD && beardBox && (nx < beardBox.x0 || nx > beardBox.x1 || ny < beardBox.y0 || ny > beardBox.y1)) continue;
        label[q] = which; next.push(q);
      }
    }
    fronts[which] = next;
  };
  for (let round = 0; round < GROW_ROUNDS; round++) {
    grow(LABEL_SKIN); grow(LABEL_BEARD); grow(LABEL_HAIR);
    if (!fronts[LABEL_SKIN].length && !fronts[LABEL_BEARD].length && !fronts[LABEL_HAIR].length) break;
  }
  // 어디에도 안 닿은 머리색 조각(윤곽선으로 끊긴 타래) — 큰 것만 머리
  {
    const rest = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (amb[i] && !label[i] && cls[i] === 1) rest[i] = 1;
    const { label: rl, comps } = labelComponents(rest, w, h);
    for (let i = 0; i < n; i++) { const id = rl[i]; if (id && comps[id - 1].size >= HAIR_MIN_COMPONENT) label[i] = LABEL_HAIR; }
  }
  // 입술 — 피부 밝기 비를 지수로 따른다(색조는 분홍 그대로)
  let changed = 0;
  if (swaps.skin && mb) {
    const k = Math.min(1.15, Math.pow(swaps.skin.toL / swaps.skin.fromL, LIP_TONE_EXP));
    if (Math.abs(k - 1) > 0.01) for (let y = Math.max(0, mb.y0); y <= Math.min(h - 1, mb.y1); y++) for (let x = Math.max(0, mb.x0); x <= Math.min(w - 1, mb.x1); x++) {
      const i = y * w + x; if (!alive[i] || label[i] || white[i] || !inMouth(i)) continue;
      const o = i * 4;
      data[o] = Math.min(255, Math.round(data[o] * k)); data[o + 1] = Math.min(255, Math.round(data[o + 1] * k)); data[o + 2] = Math.min(255, Math.round(data[o + 2] * k));
      changed++;
    }
  }
  for (let i = 0; i < n; i++) {
    const lb = label[i]; if (!lb) continue;
    let s: Swap | undefined;
    if (lb === LABEL_HAIR) { if (swaps.keepHair) continue; s = swaps.hair; }
    else if (lb === LABEL_SKIN) s = swaps.skin;
    else if (lb === LABEL_BEARD) { if (swaps.keepBeard) continue; s = swaps.beard; }
    else if (lb === LABEL_EYE) s = swaps.eye;
    if (!s) continue;
    paint(data, i * 4, s);
    changed++;
  }
  return changed;
}

/** 주인공 옵션에 맞는 치환 표 — 기준색과 같은 색을 골랐으면 그 줄은 뺀다(머리 · 수염은 마스크용으로 남기고 `keep…`). `plateBeard` = 쓰는 판에 수염이 있나 */
export function playerSwaps(cfg: CharConfig, plateBeard = cfg.look.beard >= 0): PlayerSwaps {
  const { look } = cfg;
  const hairTo = HAIR_COLORS[look.hair] ?? HAIR_COLORS[0];
  const out: PlayerSwaps = { hair: swapOf(HAIR_COLORS[PLAYER_BASE.hair], hairTo, 0.4, 1.7), keepHair: look.hair === PLAYER_BASE.hair };
  const skinTo = SKIN_TONES[look.skin] ?? SKIN_TONES[1];
  if (look.skin !== PLAYER_BASE.skin) out.skin = swapOf(SKIN_TONES[PLAYER_BASE.skin], skinTo, 0.5, 1.4);
  const eyeTo = EYE_COLORS[look.eye] ?? EYE_COLORS[0];
  if (look.eye !== PLAYER_BASE.eye) out.eye = swapOf(EYE_COLORS[PLAYER_BASE.eye], eyeTo, 0.5, 1.8);
  if (plateBeard && look.beard >= 0) {
    out.beard = swapOf(HAIR_COLORS[PLAYER_BASE.hair], HAIR_COLORS[look.beard] ?? HAIR_COLORS[0], 0.4, 1.7);
    out.keepBeard = look.beard === PLAYER_BASE.hair;
  }
  return out;
}

/** 입 찾는 창(얼굴 틀 비율 — 설치 틀 96칸 · 어깨 바닥 기준. 얼굴이 살짝 돌아가 있어 입은 가로 0.5~0.7에 온다) */
const MOUTH_WIN = { x0: 0.47, x1: 0.74, y0: 0.56, y1: 0.73 };
/** 입술 선 폭 상한(수염 그늘과 붙으면 가운데만) */
const MOUTH_MAX_W = 0.155;

export interface MouthBox { x0: number; x1: number; y0: number; y1: number; lineY1: number; cx: number }

/**
 * 입 찾기(269) — 창 안의 어두운 붉은 갈색(입술 선) 8-연결 성분 중 가로로 긴 것을 고르고(수염 · 그늘은 세로로 길거나 색이 누렇다),
 * 그 둘레의 분홍 픽셀(입술살 — g와 b가 가깝다)로 상자를 넓힌다. 24 기본 판 실측 = 폭 14~30px · 선 아래 입술살 4~7px.
 */
export function findMouth(data: Uint8ClampedArray, w: number, h: number): MouthBox | null {
  const n = w * h;
  const x0 = Math.round(w * MOUTH_WIN.x0), x1 = Math.round(w * MOUTH_WIN.x1), y0 = Math.round(h * MOUTH_WIN.y0), y1 = Math.round(h * MOUTH_WIN.y1);
  const line = new Uint8Array(n), pink = new Uint8Array(n);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * w + x) * 4;
    if (data[o + 3] < 8) continue;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const L = lum(r, g, b);
    if (L < 140 && r - g >= 28 && g - b <= 18 && r - b >= 38) line[y * w + x] = 1;
    if (L < 215 && r - g >= 35 && g - b <= 30) pink[y * w + x] = 1;
  }
  const seen = new Uint8Array(n);
  let best: { bx0: number; bx1: number; by0: number; by1: number; bw: number; d: number } | null = null;
  const cx0 = (x0 + x1) / 2, cy0 = (y0 + y1) / 2;
  for (let i = 0; i < n; i++) {
    if (!line[i] || seen[i]) continue;
    const stack = [i]; seen[i] = 1;
    let bx0 = w, bx1 = 0, by0 = h, by1 = 0;
    while (stack.length) {
      const p = stack.pop() as number;
      const x = p % w, y = (p / w) | 0;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (line[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
    if (bw < 8 || bh > 8) continue;
    const d = Math.hypot(((bx0 + bx1) / 2 - cx0) / w, (((by0 + by1) / 2 - cy0) / h) * 0.7);
    if (!best || bw > best.bw + 6 || (bw >= best.bw - 6 && d < best.d)) best = { bx0, bx1, by0, by1, bw, d };
  }
  if (!best) return null;
  let mx0 = best.bx0, mx1 = best.bx1, my0 = best.by0, my1 = best.by1;
  for (let y = best.by0 - 5; y <= best.by1 + 7; y++) for (let x = best.bx0 - 2; x <= best.bx1 + 2; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if (pink[y * w + x] || line[y * w + x]) { if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y; }
  }
  const maxW = Math.round(w * MOUTH_MAX_W);
  if (mx1 - mx0 + 1 > maxW) { const c = Math.round((mx0 + mx1) / 2); mx0 = c - (maxW >> 1); mx1 = mx0 + maxW - 1; }
  return { x0: mx0, x1: mx1, y0: my0, y1: my1, lineY1: best.by1, cx: (mx0 + mx1) / 2 };
}

function copyPx(dst: Uint8ClampedArray, src: Uint8ClampedArray, w: number, x: number, y: number, sx: number, sy: number): void {
  const d = (y * w + x) * 4, o = (sy * w + sx) * 4;
  dst[d] = src[o]; dst[d + 1] = src[o + 1]; dst[d + 2] = src[o + 2]; dst[d + 3] = src[o + 3];
}

/**
 * 입 모양(269) — 기본 판은 「다문 입」이다. 살짝 웃는 입 = 바깥 열을 1~2px 올린다(입꼬리). 작은 입 = 가로 0.72배(양옆은 같은 줄의 바깥 피부).
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

/** 볼 홍조(269) — 입 상자 기준 좌우 위 타원(반지름 가로 0.05 · 세로 0.03)의 피부색 픽셀에 분홍을 섞는다. 수염 · 머리카락은 건드리지 않는다 */
export function applyBlush(data: Uint8ClampedArray, w: number, h: number, m: MouthBox | null): void {
  if (!m) return;
  const skin = split(SKIN_TONES[PLAYER_BASE.skin]);
  const sL = Math.max(1, lum(skin[0], skin[1], skin[2]));
  const ref = [skin[0] / sL, skin[1] / sL, skin[2] / sL];
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
      if (L < 90 || Math.hypot(r / L - ref[0], g / L - ref[1], b / L - ref[2]) > 0.16) continue;
      const a = 0.32 * (1 - d2 * 0.6);
      data[o] = Math.round(r + (240 - r) * a); data[o + 1] = Math.round(g + (120 - g) * a); data[o + 2] = Math.round(b + (120 - b) * a);
    }
  }
}

/**
 * 주인공 얼굴 한 장 완성 — 입 · 홍조는 기준색(기본 피부) 위에서 먼저, 그다음 색 치환. `data`를 제자리에서 바꾼다.
 * 반환 = 바뀐 픽셀 수(치환 없음 · 입 · 홍조 없음이면 0 — 호출부는 기본 판을 그대로 쓴다).
 */
export function renderPlayerFace(data: Uint8ClampedArray, w: number, h: number, cfg: CharConfig, plateBeard = cfg.look.beard >= 0): number {
  const swaps = playerSwaps(cfg, plateBeard);
  const mouth = cfg.look.mouth ?? 'neutral', blush = !!cfg.look.blush;
  const m = findMouth(data, w, h);
  if (mouth !== 'neutral' || blush) {
    applyMouth(data, w, h, m, mouth);
    if (blush) applyBlush(data, w, h, m);
  }
  return recolorFace(data, w, h, swaps, m);
}

/** 치환 · 입 · 홍조가 하나도 없으면 true — 기본 판 그대로(수염판이면 수염 색도 기준색이어야 한다) */
export function isBasePlayerLook(cfg: CharConfig, plateBeard = cfg.look.beard >= 0): boolean {
  const { look } = cfg;
  return look.hair === PLAYER_BASE.hair && look.skin === PLAYER_BASE.skin && look.eye === PLAYER_BASE.eye && (look.mouth ?? 'neutral') === 'neutral' && !look.blush
    && (!plateBeard || look.beard < 0 || look.beard === PLAYER_BASE.hair);
}
