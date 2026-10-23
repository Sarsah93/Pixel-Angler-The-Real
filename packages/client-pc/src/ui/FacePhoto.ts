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
 *  치환한 판은 `<기본 키>_v_<피부>_<머리>_<눈>[_bd_<수염 색>][_m_<입>][_b]` 텍스처로 한 번만 굽는다(270 — 수염판은 수염 색도 치환).
 *  269 — 얼굴형은 판(`…_round` · `…_square` — 기본 판을 같은 인물 앵커로 뽑은 그림)이고, 입 모양 4 · 볼 홍조는 그림 없이 입술 픽셀을 옮겨 만든다
 *  (`findMouth` · `applyMouth` · `applyBlush` — 크레딧 0 · 24장 몽타주로 검수). 269(2) — 순수 함수는 `FaceRecolor.ts`로(검수 도구와 공유).
 */

import Phaser from 'phaser';
import type { CharConfig } from '@tra/core';
import { renderPlayerFace, isBasePlayerLook } from './FaceRecolor.js';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture } from './CanvasTextureGuard.js';

/** 부팅 텍스처 키 */
export const facePhotoKey = (key: string): string => `face_${key}`;

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

/**
 * 그림 초상 텍스처 키 — 없으면 null(절차 초상으로). `who` = 인물 id 또는 'player'.
 * 치환은 캔버스 한 장 — 실패하면(컨텍스트 없음 등) 기본 얼굴 그대로 돌려준다(틀린 색이라도 사진이 낫다).
 */
export function photoPortraitKey(scene: Phaser.Scene, who: string, cfg: CharConfig): string | null {
  if (who !== 'player') return scene.textures.exists(facePhotoKey(who)) ? facePhotoKey(who) : null;
  const base = playerBaseKey(scene, cfg);
  if (!base) return null;
  const plateBeard = base.endsWith('_beard') || base.includes('_beard_'); // 270 — 수염판일 때만 수염 색 치환(민낯판으로 떨어졌으면 없음)
  if (isBasePlayerLook(cfg, plateBeard)) return base;
  const mouth = cfg.look.mouth ?? 'neutral', blush = !!cfg.look.blush;
  const key = `${base}_v_${cfg.look.skin}_${cfg.look.hair}_${cfg.look.eye}${plateBeard ? `_bd_${cfg.look.beard}` : ''}${mouth !== 'neutral' ? `_m_${mouth}` : ''}${blush ? '_b' : ''}`;
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
    renderPlayerFace(img.data, w, h, cfg, plateBeard);
    ctx.putImageData(img, 0, 0);
  } catch {
    destroyCanvasTexture(canvas);
    return base;
  }
  if (!refreshCanvasTexture(canvas, `얼굴 치환 ${key}`)) { destroyCanvasTexture(canvas); return base; }
  return key;
}
