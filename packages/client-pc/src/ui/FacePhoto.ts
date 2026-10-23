/**
 * @file FacePhoto.ts
 * @description 267차 — 그림(Gemini) 얼굴 초상. 사용자 지시 「각 인물 별로 얼굴 이미지를 따로 따서 넣기 … 주인공 얼굴도
 *  선택한 모델형(성별 · 머리 모양 · 머리색 · 피부 …)에 따라 디폴트값」.
 *
 *  - 인물(npcId): `public/faces/<id>.png`(192×192 · 셀 2px — `tools/gemini_face_art.cjs --install`)를 부팅이 `face_<id>`로 싣는다(목록 `data/FacePortraits.ts`).
 *    없으면 null — 호출부(`ensureFacePortrait`)가 32×32 절차 초상으로 돌아간다.
 *  - 주인공('player'): **271차부터 층 합성**(사용자 「기본 얼굴형에 머리/수염/입을 변경하는 것으로 적용」). `public/faces/layers/`(목록 `data/FaceLayers.ts` ·
 *    부팅 키 `facelayer_<키>`)의 기본 머리 `base_<성별>_<얼굴형>`(민머리 · 민낯) + 라벨 마스크 `…_mask` + 머리 모양 층 `hair_<성별>_<머리 모양>` +
 *    수염 층 `beard_m_<얼굴형>`(있을 때)을 `FaceRecolor.composePlayerFace`가 생성 옵션(피부 · 머리색 · 눈 · 수염 색 · 입 모양 · 홍조)대로 칠해 겹친다.
 *    결과는 `face_player_<성별>_<얼굴형>_<머리 모양>_v_<피부>_<머리>_<눈>[_bd_<수염>][_m_<입>][_b]` 텍스처로 한 번만 굽는다.
 *    옛 방식(성별 × 머리 모양 × 수염 × 얼굴형 판 72장 + 색 규칙 분류 치환 — 268~270)은 경계마다 추측이라 색 조합마다 새 결함이 나 폐기했다.
 *  층 픽셀은 PNG 원본을 한 번 읽어 모듈 캐시에 둔다(192×192 — 작다). 캔버스가 없으면(컨텍스트 없음 등) null → 절차 초상.
 */

import Phaser from 'phaser';
import type { CharConfig } from '@tra/core';
import { composePlayerFace, playerFaceVariant } from './FaceRecolor.js';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture, sourceImageOf } from './CanvasTextureGuard.js';

/** 부팅 텍스처 키 — 인물 초상 · 주인공 층 */
export const facePhotoKey = (key: string): string => `face_${key}`;
export const faceLayerKey = (key: string): string => `facelayer_${key}`;

interface Pixels { w: number; h: number; data: Uint8ClampedArray }
const pixelCache = new Map<string, Pixels>();

/** 층 텍스처의 픽셀(한 번 읽어 둔다) — 텍스처가 없거나 캔버스를 못 쓰면 null */
function layerPixels(scene: Phaser.Scene, key: string): Pixels | null {
  const hit = pixelCache.get(key);
  if (hit) return hit;
  if (!scene.textures.exists(key)) return null;
  const src = sourceImageOf(scene, key) as (CanvasImageSource & { width?: number; height?: number }) | null;
  if (!src) return null;
  const w = Math.round(Number(src.width) || 0), h = Math.round(Number(src.height) || 0);
  if (!w || !h) return null;
  try {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
    const rec = { w, h, data: ctx.getImageData(0, 0, w, h).data };
    pixelCache.set(key, rec);
    return rec;
  } catch {
    return null;
  }
}

/** 주인공 층 키 — 얼굴형 판이 없으면 계란형, 수염 층이 없으면 민낯(수염 층은 크레딧이 들어오면 `beard_m_<얼굴형>`로 뽑는다 — 271) */
function playerLayerKeys(scene: Phaser.Scene, cfg: CharConfig): { base: string; mask: string; hair: string; beard: string | null; shape: string } | null {
  const { sex, hairStyle, beard, faceShape } = cfg.look;
  const has = (k: string): boolean => scene.textures.exists(faceLayerKey(k));
  const shapes = faceShape && faceShape !== 'oval' ? [faceShape, 'oval'] : ['oval'];
  const shape = shapes.find((s) => has(`base_${sex}_${s}`) && has(`base_${sex}_${s}_mask`));
  if (!shape) return null;
  const hair = `hair_${sex}_${hairStyle}`;
  if (!has(hair)) return null;
  let beardKey: string | null = null;
  if (sex === 'm' && beard >= 0) beardKey = [`beard_m_${shape}`, 'beard_m_oval'].find((k) => has(k)) ?? null;
  return { base: `base_${sex}_${shape}`, mask: `base_${sex}_${shape}_mask`, hair, beard: beardKey, shape };
}

/**
 * 그림 초상 텍스처 키 — 없으면 null(절차 초상으로). `who` = 인물 id 또는 'player'.
 * 주인공은 층을 한 캔버스에 합성해 텍스처로 굽는다 — 실패하면(컨텍스트 없음 등) null.
 */
export function photoPortraitKey(scene: Phaser.Scene, who: string, cfg: CharConfig): string | null {
  if (who !== 'player') return scene.textures.exists(facePhotoKey(who)) ? facePhotoKey(who) : null;
  const keys = playerLayerKeys(scene, cfg);
  if (!keys) return null;
  const key = `face_player_${cfg.look.sex}_${keys.shape}_${cfg.look.hairStyle}${playerFaceVariant(cfg, !!keys.beard)}`;
  if (scene.textures.exists(key)) return key;
  const base = layerPixels(scene, faceLayerKey(keys.base)), mask = layerPixels(scene, faceLayerKey(keys.mask)), hair = layerPixels(scene, faceLayerKey(keys.hair));
  const beard = keys.beard ? layerPixels(scene, faceLayerKey(keys.beard)) : null;
  if (!base || !mask || !hair || (keys.beard && !beard)) return null;
  const { w, h } = base;
  if (mask.w !== w || mask.h !== h || hair.w !== w || hair.h !== h || (beard && (beard.w !== w || beard.h !== h))) return null;
  let canvas: Phaser.Textures.CanvasTexture | null = null;
  try { canvas = scene.textures.createCanvas(key, w, h); } catch { return null; }
  if (!canvas) return null;
  const ctx = canvasContextOf(canvas);
  if (!ctx) { destroyCanvasTexture(canvas); return null; }
  try {
    const out = composePlayerFace({ w, h, base: base.data, mask: mask.data, hair: hair.data, beard: beard?.data ?? null }, cfg);
    const img = ctx.createImageData(w, h);
    img.data.set(out);
    ctx.putImageData(img, 0, 0);
  } catch {
    destroyCanvasTexture(canvas);
    return null;
  }
  if (!refreshCanvasTexture(canvas, `얼굴 합성 ${key}`)) { destroyCanvasTexture(canvas); return null; }
  return key;
}
