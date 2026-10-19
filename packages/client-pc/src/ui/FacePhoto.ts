/**
 * @file FacePhoto.ts
 * @description 267차 — 그림(Gemini) 얼굴 초상. `public/faces/<키>.png`(192×192 · 셀 2px — `tools/gemini_face_art.cjs --install`)를
 *  부팅이 `face_<키>`로 싣는다(목록 `data/FacePortraits.ts`). 사용자 지시 「각 인물 별로 얼굴 이미지를 따로 따서 넣기 … 주인공 얼굴도
 *  선택한 모델형(성별 · 머리 모양 · 머리색 · 피부 …)에 따라 디폴트값」.
 *
 *  - 인물(npcId): `face_<id>`가 있으면 그것. 없으면 null — 호출부(`ensureFacePortrait`)가 32×32 절차 초상으로 돌아간다.
 *  - 주인공('player'): 기본 얼굴 `face_player_<m|f>_<머리 모양>[_beard]`(성별 × 머리 모양 × 수염 = 24장) 위에
 *    생성 옵션의 **머리색 · 피부 · 눈동자**를 팔레트 치환으로 입힌다. 기본 얼굴은 기준색(밤색 머리 · 보통 피부 · 짙은 갈색 눈 — 도구와 같은 값)으로
 *    그려져 있고, 그 색 둘레(색조가 같고 밝기만 다른 픽셀)만 고른 색으로 바꾼다 — 밝기 비는 그대로라 3단 음영이 따라온다.
 *    얼굴형 · 입 모양은 치환하지 못한다(백로그 — 판을 더 뽑아야 한다).
 *  치환한 판은 `<기본 키>_v_<피부>_<머리>_<눈>[_m_<입>][_b]` 텍스처로 한 번만 굽는다.
 *  269 — 얼굴형은 판(`…_round` · `…_square` — 기본 판을 같은 인물 앵커로 뽑은 그림)이고, 입 모양 4 · 볼 홍조는 그림 없이 입술 픽셀을 옮겨 만든다
 *  (`findMouth` · `applyMouth` · `applyBlush` — 크레딧 0 · 24장 몽타주로 검수).
 */

import Phaser from 'phaser';
import { HAIR_COLORS, SKIN_TONES, EYE_COLORS, type CharConfig } from '@tra/core';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture } from './CanvasTextureGuard.js';

/** 부팅 텍스처 키 */
export const facePhotoKey = (key: string): string => `face_${key}`;

/** 주인공 기본 얼굴의 기준색(`tools/gemini_face_art.cjs` PLAYER_BASE와 같다) */
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };

/** 색조(밝기로 나눈 RGB) 차 허용 — 같은 색의 밝은 · 어두운 단계는 색조가 거의 같다 */
const CHROMA_TOL = 0.13;
/** 눈동자는 공간 조건(흰자 근처 · 눈 띠)이 거르므로 색조는 느슨하게 — 검붉은 홍채(거리 0.25~0.4)도 받는다 */
const EYE_CHROMA_TOL = 0.45;
/** 머리로 걸렸다가 버려진 픽셀(코 · 입 · 목 그늘)이 피부로 돌아갈 때의 색조 허용 */
const SKIN_FALLBACK_TOL = 0.22;
/** 머리 성분 최소 픽셀 — 이보다 작은 「머리색 조각」은 코 · 입 · 목의 피부 그늘이다(268 실측 — 코 12 · 입 8 · 머리 4,556) */
const HAIR_MIN_COMPONENT = 40;
/** 머리 덩어리에 붙은 어두운 갈색 띠(정수리 · 그늘 — 색조가 붉어 기준에서 벗어난다)를 머리로 끌어오는 밝기 상한 · 번짐 횟수 */
const HAIR_DARK_L = 80;
const HAIR_DARK_GROW = 3;
/** 흰자 = 밝고(L) 채도 낮은(퍼짐) 픽셀 — 24장 실측 L 220~240 · 퍼짐 20~30. 그 둘레 3px 안만 눈동자 */
const EYE_WHITE_L = 170;
const EYE_WHITE_SPREAD = 45;
const EYE_WHITE_R = 3;
/** 눈 띠(얼굴 틀 기준 비율) — 설치 틀이 같아 눈은 세로 0.40~0.48에 온다. 눈썹(0.36~0.40)은 흰자 거리로 뺀다 */
const EYE_BAND = { y0: 0.36, y1: 0.52, x0: 0.25, x1: 0.75 };

function lum(r: number, g: number, b: number): number { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function split(c: number): [number, number, number] { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; }

interface Swap { from: [number, number, number]; to: [number, number, number]; fromL: number; chroma: [number, number, number]; lo: number; hi: number }
/** 치환 표 — 머리는 항상 있다(눈 치환이 머리칼을 피하도록 마스크만 쓸 때는 `keepHair`) */
interface PlayerSwaps { hair: Swap; keepHair: boolean; skin?: Swap; eye?: Swap }

function swapOf(from: number, to: number, loK: number, hiK: number): Swap {
  const f = split(from), t = split(to);
  const L = Math.max(1, lum(f[0], f[1], f[2]));
  return { from: f, to: t, fromL: L, chroma: [f[0] / L, f[1] / L, f[2] / L], lo: L * loK, hi: Math.min(255, L * hiK) };
}

function chromaDist(r: number, g: number, b: number, L: number, s: Swap): number {
  return Math.hypot(r / L - s.chroma[0], g / L - s.chroma[1], b / L - s.chroma[2]);
}

function paint(data: Uint8ClampedArray, o: number, L: number, s: Swap): void {
  const k = L / s.fromL;
  data[o] = Math.max(0, Math.min(255, Math.round(s.to[0] * k)));
  data[o + 1] = Math.max(0, Math.min(255, Math.round(s.to[1] * k)));
  data[o + 2] = Math.max(0, Math.min(255, Math.round(s.to[2] * k)));
}

/**
 * 기준색 둘레의 픽셀을 고른 색으로 — 색조가 기준색과 같고(허용 안) 밝기가 그 색의 음영 범위 안이면 고른 색에 같은 밝기 비를 곱한다.
 * 색만으로는 못 가르는 것을 자리로 가른다(268):
 *  - 머리 = 머리색 픽셀의 8-연결 성분 중 큰 것(코 · 입 · 목 그늘은 작은 조각) → 1픽셀 선 가지치기(볼을 타고 내려오는 그늘 선)
 *    → 5×5가 60% 이상 머리면 밝아도 머리(정수리 하이라이트) → 어두운 갈색 띠를 3번 번져 끌어온다(정수리 · 그늘).
 *  - 눈동자 = 흰자(밝고 채도 낮음) 3px 안 · 눈 띠 안 · 머리 아닌 어두운 픽셀 — 눈썹 · 콧구멍 · 귀 옆 머리칼은 못 들어온다.
 *  - 피부 = 피부색 픽셀 + 머리로 걸렸다가 버려진 그늘. 어느 것에도 안 걸리는 픽셀(윤곽선 · 옷 · 흰자 · 입술)은 그대로.
 */
export function recolorFace(data: Uint8ClampedArray, w: number, h: number, swaps: PlayerSwaps): number {
  const n = w * h;
  const cls = new Int8Array(n); // 1 머리 후보 · 2 피부 · 3 눈 후보
  const Ls = new Float32Array(n);
  const list: Array<[Swap, number]> = [[swaps.hair, 1]];
  if (swaps.skin) list.push([swaps.skin, 2]);
  if (swaps.eye) list.push([swaps.eye, 3]);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (data[o + 3] < 8) continue;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const L = Math.max(1, lum(r, g, b));
    Ls[i] = L;
    let best = 0, bestD = CHROMA_TOL;
    for (const [s, id] of list) {
      if (L < s.lo || L > s.hi) continue;
      const d = chromaDist(r, g, b, L, s);
      if (d < bestD) { bestD = d; best = id; }
    }
    if (!best && swaps.eye && L >= swaps.eye.lo && L <= swaps.eye.hi && chromaDist(r, g, b, L, swaps.eye) < EYE_CHROMA_TOL) best = 3;
    cls[i] = best;
  }
  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h;
  // 머리 마스크 ① 큰 성분만
  const hair = new Uint8Array(n);
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (cls[i] !== 1 || seen[i]) continue;
    const stack = [i]; seen[i] = 1; const members: number[] = [];
    while (stack.length) {
      const p = stack.pop() as number; members.push(p);
      const x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const q = ny * w + nx;
        if (cls[q] === 1 && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (members.length >= HAIR_MIN_COMPONENT) for (const p of members) hair[p] = 1;
  }
  // ② 1픽셀 선 가지치기 — 이웃 머리 픽셀 ≤ 2
  const drop: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!hair[i]) continue;
    const x = i % w, y = (i / w) | 0; let c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (inside(nx, ny) && hair[ny * w + nx]) c++;
    }
    if (c <= 2) drop.push(i);
  }
  for (const i of drop) hair[i] = 0;
  // ③ 둘러싸인 밝은 하이라이트 — 색조는 머리인데 hi를 넘는 픽셀이 5×5 창 60% 이상 머리에 싸였으면 머리
  {
    const s = swaps.hair; const add: number[] = [];
    for (let i = 0; i < n; i++) {
      if (hair[i]) continue;
      const o = i * 4;
      if (data[o + 3] < 8) continue;
      const L = Ls[i];
      if (L <= s.hi || L > s.fromL * 2.1 || chromaDist(data[o], data[o + 1], data[o + 2], L, s) >= CHROMA_TOL) continue;
      const x = i % w, y = (i / w) | 0; let c = 0, t = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        t++; if (hair[ny * w + nx]) c++;
      }
      if (t && c / t >= 0.6) add.push(i);
    }
    for (const i of add) hair[i] = 1;
  }
  // ④ 어두운 갈색 띠 번짐(4-이웃)
  for (let it = 0; it < HAIR_DARK_GROW; it++) {
    const add: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!hair[i]) continue;
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const q = ny * w + nx;
        if (hair[q] || cls[q] === 2) continue;
        const o = q * 4;
        if (data[o + 3] < 8 || Ls[q] >= HAIR_DARK_L || Ls[q] < 4) continue;
        const r = data[o], g = data[o + 1], b = data[o + 2];
        if (r >= g - 4 && g >= b - 4) add.push(q);
      }
    }
    for (const q of add) hair[q] = 1;
  }
  // 흰자 근처 표
  const nearWhite = new Uint8Array(n);
  if (swaps.eye) {
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (data[o + 3] < 8 || Ls[i] <= EYE_WHITE_L) continue;
      const r = data[o], g = data[o + 1], b = data[o + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) >= EYE_WHITE_SPREAD) continue;
      const x = i % w, y = (i / w) | 0;
      for (let dy = -EYE_WHITE_R; dy <= EYE_WHITE_R; dy++) for (let dx = -EYE_WHITE_R; dx <= EYE_WHITE_R; dx++) {
        const nx = x + dx, ny = y + dy;
        if (inside(nx, ny)) nearWhite[ny * w + nx] = 1;
      }
    }
  }
  const bx0 = Math.round(w * EYE_BAND.x0), bx1 = Math.round(w * EYE_BAND.x1), by0 = Math.round(h * EYE_BAND.y0), by1 = Math.round(h * EYE_BAND.y1);
  let changed = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (data[o + 3] < 8) continue;
    let s: Swap | undefined;
    if (hair[i]) { if (swaps.keepHair) continue; s = swaps.hair; }
    else if (cls[i] === 2) s = swaps.skin;
    else if (cls[i] === 1 && swaps.skin) {
      const L = Ls[i];
      if (L >= swaps.skin.lo && L <= swaps.skin.hi && chromaDist(data[o], data[o + 1], data[o + 2], L, swaps.skin) < SKIN_FALLBACK_TOL) s = swaps.skin;
    } else if (cls[i] === 3 && nearWhite[i]) {
      const x = i % w, y = (i / w) | 0;
      if (x >= bx0 && x <= bx1 && y >= by0 && y <= by1) s = swaps.eye;
    }
    if (!s) continue;
    paint(data, o, Ls[i], s);
    changed++;
  }
  return changed;
}

/** 주인공 옵션에 맞는 치환 표 — 기준색과 같은 색을 골랐으면 그 줄은 뺀다(머리는 마스크용으로 남기고 `keepHair`) */
function playerSwaps(cfg: CharConfig): PlayerSwaps {
  const { look } = cfg;
  const hairTo = HAIR_COLORS[look.hair] ?? HAIR_COLORS[0];
  const out: PlayerSwaps = { hair: swapOf(HAIR_COLORS[PLAYER_BASE.hair], hairTo, 0.4, 1.7), keepHair: look.hair === PLAYER_BASE.hair };
  const skinTo = SKIN_TONES[look.skin] ?? SKIN_TONES[1];
  if (look.skin !== PLAYER_BASE.skin) out.skin = swapOf(SKIN_TONES[PLAYER_BASE.skin], skinTo, 0.5, 1.4);
  const eyeTo = EYE_COLORS[look.eye] ?? EYE_COLORS[0];
  if (look.eye !== PLAYER_BASE.eye) out.eye = swapOf(EYE_COLORS[PLAYER_BASE.eye], eyeTo, 0.5, 1.8);
  return out;
}

/** 주인공 기본 얼굴 키(있는 것만) — 수염판이 없으면 민낯판으로 */
function playerBaseKey(scene: Phaser.Scene, cfg: CharConfig): string | null {
  const { sex, hairStyle, beard, faceShape } = cfg.look;
  const stems = beard >= 0 ? [`player_${sex}_${hairStyle}_beard`, `player_${sex}_${hairStyle}`] : [`player_${sex}_${hairStyle}`];
  // 269 — 얼굴형 판(`…_round` · `…_square`)이 있으면 그것, 없으면 계란형 기본 판(얼굴형은 턱선만 다르다 — 없는 판은 기본으로)
  const cands: string[] = [];
  for (const stem of stems) {
    if (faceShape && faceShape !== 'oval') cands.push(`${stem}_${faceShape}`);
    cands.push(stem);
  }
  for (const c of cands) if (scene.textures.exists(facePhotoKey(c))) return facePhotoKey(c);
  return null;
}

/** 입 찾는 창(얼굴 틀 비율 — 설치 틀 96칸 · 어깨 바닥 기준. 얼굴이 살짝 돌아가 있어 입은 가로 0.5~0.7에 온다) */
const MOUTH_WIN = { x0: 0.47, x1: 0.74, y0: 0.56, y1: 0.73 };
/** 입술 선 폭 상한(수염 그늘과 붙으면 가운데만) */
const MOUTH_MAX_W = 0.155;

interface MouthBox { x0: number; x1: number; y0: number; y1: number; lineY1: number; cx: number }

/**
 * 입 찾기(269) — 창 안의 어두운 붉은 갈색(입술 선) 8-연결 성분 중 가로로 긴 것을 고르고(수염 · 그늘은 세로로 길거나 색이 누렇다),
 * 그 둘레의 분홍 픽셀(입술살 — g와 b가 가깝다)로 상자를 넓힌다. 24 기본 판 실측 = 폭 14~30px · 선 아래 입술살 4~7px.
 */
function findMouth(data: Uint8ClampedArray, w: number, h: number): MouthBox | null {
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
function applyMouth(data: Uint8ClampedArray, w: number, h: number, m: MouthBox | null, mouth: string): void {
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
function applyBlush(data: Uint8ClampedArray, w: number, h: number, m: MouthBox | null): void {
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
 * 그림 초상 텍스처 키 — 없으면 null(절차 초상으로). `who` = 인물 id 또는 'player'.
 * 치환은 캔버스 한 장 — 실패하면(컨텍스트 없음 등) 기본 얼굴 그대로 돌려준다(틀린 색이라도 사진이 낫다).
 */
export function photoPortraitKey(scene: Phaser.Scene, who: string, cfg: CharConfig): string | null {
  if (who !== 'player') return scene.textures.exists(facePhotoKey(who)) ? facePhotoKey(who) : null;
  const base = playerBaseKey(scene, cfg);
  if (!base) return null;
  const swaps = playerSwaps(cfg);
  const mouth = cfg.look.mouth ?? 'neutral', blush = !!cfg.look.blush;
  if (swaps.keepHair && !swaps.skin && !swaps.eye && mouth === 'neutral' && !blush) return base;
  const key = `${base}_v_${cfg.look.skin}_${cfg.look.hair}_${cfg.look.eye}${mouth !== 'neutral' ? `_m_${mouth}` : ''}${blush ? '_b' : ''}`;
  if (scene.textures.exists(key)) return key;
  const src = scene.textures.get(base).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const w = src.width, h = src.height;
  if (!w || !h) return base;
  let canvas: Phaser.Textures.CanvasTexture | null = null;
  try { canvas = scene.textures.createCanvas(key, w, h); } catch { return base; }
  if (!canvas) return base;
  const ctx = canvasContextOf(canvas);
  if (!ctx) { destroyCanvasTexture(canvas); return base; }
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    // 입 · 홍조는 기준색(기본 피부) 위에서 먼저, 그다음 색 치환
    if (mouth !== 'neutral' || blush) {
      const m = findMouth(img.data, w, h);
      applyMouth(img.data, w, h, m, mouth);
      if (blush) applyBlush(img.data, w, h, m);
    }
    recolorFace(img.data, w, h, swaps);
    ctx.putImageData(img, 0, 0);
  } catch {
    destroyCanvasTexture(canvas);
    return base;
  }
  if (!refreshCanvasTexture(canvas, `얼굴 치환 ${key}`)) { destroyCanvasTexture(canvas); return base; }
  return key;
}
