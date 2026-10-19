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
 *  치환한 판은 `<기본 키>_v_<피부>_<머리>_<눈>` 텍스처로 한 번만 굽는다.
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

function lum(r: number, g: number, b: number): number { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function split(c: number): [number, number, number] { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; }

interface Swap { from: [number, number, number]; to: [number, number, number]; fromL: number; chroma: [number, number, number]; lo: number; hi: number }

function swapOf(from: number, to: number, loK: number, hiK: number): Swap {
  const f = split(from), t = split(to);
  const L = Math.max(1, lum(f[0], f[1], f[2]));
  return { from: f, to: t, fromL: L, chroma: [f[0] / L, f[1] / L, f[2] / L], lo: L * loK, hi: Math.min(255, L * hiK) };
}

/**
 * 기준색 둘레의 픽셀을 고른 색으로 — 색조가 기준색과 같고(허용 안) 밝기가 그 색의 음영 범위 안이면,
 * 고른 색에 같은 밝기 비를 곱한다. 어느 기준색에도 안 걸리는 픽셀(윤곽선 · 옷 · 흰자)은 그대로.
 */
export function recolorFace(data: Uint8ClampedArray, swaps: Swap[]): number {
  let changed = 0;
  for (let o = 0; o < data.length; o += 4) {
    if (data[o + 3] < 8) continue;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const L = Math.max(1, lum(r, g, b));
    let best: Swap | null = null, bestD = CHROMA_TOL;
    for (const s of swaps) {
      if (L < s.lo || L > s.hi) continue;
      const d = Math.hypot(r / L - s.chroma[0], g / L - s.chroma[1], b / L - s.chroma[2]);
      if (d < bestD) { bestD = d; best = s; }
    }
    if (!best) continue;
    const k = L / best.fromL;
    data[o] = Math.max(0, Math.min(255, Math.round(best.to[0] * k)));
    data[o + 1] = Math.max(0, Math.min(255, Math.round(best.to[1] * k)));
    data[o + 2] = Math.max(0, Math.min(255, Math.round(best.to[2] * k)));
    changed++;
  }
  return changed;
}

/** 주인공 옵션에 맞는 치환 표 — 기준색과 같은 색을 골랐으면 그 줄은 뺀다(바꿀 것이 없다) */
function playerSwaps(cfg: CharConfig): Swap[] {
  const { look } = cfg;
  const out: Swap[] = [];
  const hairTo = HAIR_COLORS[look.hair] ?? HAIR_COLORS[0];
  if (look.hair !== PLAYER_BASE.hair) out.push(swapOf(HAIR_COLORS[PLAYER_BASE.hair], hairTo, 0.4, 1.7));
  const skinTo = SKIN_TONES[look.skin] ?? SKIN_TONES[1];
  if (look.skin !== PLAYER_BASE.skin) out.push(swapOf(SKIN_TONES[PLAYER_BASE.skin], skinTo, 0.5, 1.4));
  const eyeTo = EYE_COLORS[look.eye] ?? EYE_COLORS[0];
  if (look.eye !== PLAYER_BASE.eye) out.push(swapOf(EYE_COLORS[PLAYER_BASE.eye], eyeTo, 0.5, 1.8));
  return out;
}

/** 주인공 기본 얼굴 키(있는 것만) — 수염판이 없으면 민낯판으로 */
function playerBaseKey(scene: Phaser.Scene, cfg: CharConfig): string | null {
  const { sex, hairStyle, beard } = cfg.look;
  const cands = beard >= 0 ? [`player_${sex}_${hairStyle}_beard`, `player_${sex}_${hairStyle}`] : [`player_${sex}_${hairStyle}`];
  for (const c of cands) if (scene.textures.exists(facePhotoKey(c))) return facePhotoKey(c);
  return null;
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
  if (!swaps.length) return base;
  const key = `${base}_v_${cfg.look.skin}_${cfg.look.hair}_${cfg.look.eye}`;
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
    recolorFace(img.data, swaps);
    ctx.putImageData(img, 0, 0);
  } catch {
    destroyCanvasTexture(canvas);
    return base;
  }
  if (!refreshCanvasTexture(canvas, `얼굴 치환 ${key}`)) { destroyCanvasTexture(canvas); return base; }
  return key;
}
