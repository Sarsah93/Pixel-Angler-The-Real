/**
 * @file PixelIcon.ts
 * @description 16x16 손그림 픽셀 아이콘을 캔버스 텍스처로 굽는 공용 헬퍼 (128차)
 *
 * 아트 원본은 `tools/gen_pixel_icons.py` → `data/PixelIconArt.ts`(자동 생성).
 * 여기서는 **굽기(bake)와 배치**만 담당한다.
 *
 * ⚠ 텍스처는 게임 레벨 TextureManager에 등록되므로 씬 재시작에도 살아남는다
 *   (50차 `bakeTintedTrim` 전례). 키 = `pxi_<아이콘키>_<배율>`.
 * ⚠ 이모지·특수문자 금지 규칙(AGENTS §4)의 대안 수단이 바로 이 아이콘이다 —
 *   상태이상·생존 지표는 텍스트 약어가 아니라 이 픽셀 아이콘으로 시각화한다.
 */
import Phaser from 'phaser';
import { PIXEL_ICON_ART } from '../data/PixelIconArt.js';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture } from './CanvasTextureGuard.js';

/** 아이콘 텍스처를 (없으면) 굽고 키를 돌려준다. 알 수 없는 키면 null. */
export function ensurePixelIcon(
  scene: Phaser.Scene,
  key: string,
  scale = 1,
): string | null {
  const art = PIXEL_ICON_ART[key];
  if (!art) return null;
  const s = Math.max(1, Math.round(scale));
  const texKey = `pxi_${key}_${s}`;
  if (scene.textures.exists(texKey)) return texKey;

  const w = art.w * s;
  const h = art.h * s;
  const canvas = scene.textures.createCanvas(texKey, w, h);
  if (!canvas) return null;
  const ctx = canvasContextOf(canvas);
  if (!ctx) { destroyCanvasTexture(canvas); return null; }
  try { ctx.clearRect(0, 0, w, h); } catch { destroyCanvasTexture(canvas); return null; }
  for (let y = 0; y < art.h; y++) {
    const row = art.rows[y] ?? '';
    for (let x = 0; x < art.w; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      const rgb = art.pal[ch];
      if (rgb === undefined) continue;
      ctx.fillStyle = `#${rgb.toString(16).padStart(6, '0')}`;
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  if (!refreshCanvasTexture(canvas, `픽셀 아이콘 ${texKey}`)) { destroyCanvasTexture(canvas); return null; }
  return texKey;
}

/**
 * 아이콘 이미지를 만든다(원점 중앙). 표시 크기 `size`px에 맞춰
 * **정수 배율로 구운 뒤** 스케일 없이 배치 — 도트가 뭉개지지 않는다.
 */
export function addPixelIcon(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  size = 16,
): Phaser.GameObjects.Image | null {
  const art = PIXEL_ICON_ART[key];
  if (!art) return null;
  const s = Math.max(1, Math.round(size / art.w));
  const texKey = ensurePixelIcon(scene, key, s);
  if (!texKey) return null;
  const img = scene.add.image(x, y, texKey).setOrigin(0.5);
  const drawn = art.w * s;
  if (drawn !== size) img.setDisplaySize(size, size);
  return img;
}

/** 아트가 등록된 아이콘인지 */
export function hasPixelIcon(key: string): boolean {
  return !!PIXEL_ICON_ART[key];
}
