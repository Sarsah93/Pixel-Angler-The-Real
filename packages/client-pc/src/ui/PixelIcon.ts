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
import { ITEM_IMAGE_BY_PX, ITEM_TEXTURE_ALIAS } from '../data/ItemImages.js';
import { fitFishTexture } from '../data/FishTextures.js';

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

/** 286차 — 16px 손그림 대신 그린 그림(Gemini — `ITEM_IMAGE_BY_PX`)을 쓰는 최소 표시 크기. 그보다 작으면 도트가 더 또렷하다 */
const PAINTED_MIN_PX = 24;

/**
 * 아이콘 이미지를 만든다(원점 중앙).
 *  - 16의 배수 크기 = **정수 배율로 구워** 스케일 없이 배치 — 도트가 뭉개지지 않는다.
 *  - 286차 — 24px 이상이고 그 키에 그린 그림(`ITEM_IMAGE_BY_PX['px:<키>']`)이 있으면 그 그림(일지 보상 카드 등).
 *  - 286차 — 16의 배수가 아닌 크기(10 · 12 · 14 · 18 · 24px …)는 옛 방식(정수 굽기 → `setDisplaySize`)이 최근접 샘플링으로
 *    도트 줄을 들쭉날쭉 버리거나 겹쳐 그렸다(사용자 「픽셀레이트가 낮은」). 이제 한 단계 큰 정수 배율로 구운 것을
 *    **그 크기 그대로 매끈하게 줄인 캔버스**(`pxi_<키>_@<크기>`)를 따로 구워 1:1로 놓는다.
 */
export function addPixelIcon(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  size = 16,
): Phaser.GameObjects.Image | null {
  if (size >= PAINTED_MIN_PX) {
    const painted = ITEM_IMAGE_BY_PX[`px:${key}`] ?? ITEM_TEXTURE_ALIAS[`px:${key}`];   // 요리 계열 16px 키 = 요리 사진
    if (painted && scene.textures.exists(painted)) {
      const fit = fitFishTexture(scene.textures, painted, size, size);
      return scene.add.image(x, y, fit.key).setOrigin(0.5).setDisplaySize(fit.w, fit.h);
    }
  }
  const art = PIXEL_ICON_ART[key];
  if (!art) return null;
  if (size % art.w === 0) {
    const texKey = ensurePixelIcon(scene, key, size / art.w);
    return texKey ? scene.add.image(x, y, texKey).setOrigin(0.5) : null;
  }
  const exact = ensureExactPixelIcon(scene, key, Math.round(size));
  if (exact) return scene.add.image(x, y, exact).setOrigin(0.5);
  // 캔버스를 못 만들면 옛 방식
  const s = Math.max(1, Math.round(size / art.w));
  const texKey = ensurePixelIcon(scene, key, s);
  if (!texKey) return null;
  return scene.add.image(x, y, texKey).setOrigin(0.5).setDisplaySize(size, size);
}

/** 286차 — 정확히 `size`px로 매끈하게 줄인 아이콘 텍스처(16의 배수가 아닌 크기 전용) */
function ensureExactPixelIcon(scene: Phaser.Scene, key: string, size: number): string | null {
  const art = PIXEL_ICON_ART[key];
  if (!art || size < 4) return null;
  const texKey = `pxi_${key}_@${size}`;
  if (scene.textures.exists(texKey)) return texKey;
  const up = Math.max(1, Math.ceil(size / art.w));
  const srcKey = ensurePixelIcon(scene, key, up);
  const src = srcKey ? scene.textures.get(srcKey).getSourceImage() as HTMLCanvasElement | HTMLImageElement : null;
  if (!src) return null;
  const canvas = scene.textures.createCanvas(texKey, size, Math.round(size * art.h / art.w));
  if (!canvas) return null;
  const ctx = canvasContextOf(canvas);
  if (!ctx) { destroyCanvasTexture(canvas); return null; }
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, canvas.width, canvas.height);
  } catch { destroyCanvasTexture(canvas); return null; }
  if (!refreshCanvasTexture(canvas, `픽셀 아이콘 ${texKey}`)) { destroyCanvasTexture(canvas); return null; }
  canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return texKey;
}

/** 아트가 등록된 아이콘인지 */
export function hasPixelIcon(key: string): boolean {
  return !!PIXEL_ICON_ART[key];
}
