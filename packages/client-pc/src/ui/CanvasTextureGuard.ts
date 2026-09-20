import Phaser from 'phaser';

/**
 * Phaser CanvasTexture is a JS wrapper around a browser canvas. During scene
 * shutdown Phaser can destroy the backing canvas before a delayed callback has
 * stopped. Keep all app-owned canvas baking behind these small guards so a
 * stale callback degrades to a missing decoration instead of killing the game.
 */
export function canvasContextOf(texture: Phaser.Textures.CanvasTexture): CanvasRenderingContext2D | null {
  try {
    const ctx = texture.getContext?.();
    return ctx && typeof ctx.drawImage === 'function' ? ctx : null;
  } catch {
    return null;
  }
}

export function refreshCanvasTexture(texture: Phaser.Textures.CanvasTexture, label: string): boolean {
  try {
    texture.refresh();
    return true;
  } catch (error) {
    console.warn(`[CanvasTextureGuard] ${label} 갱신 건너뜀`, error);
    return false;
  }
}

export function destroyCanvasTexture(texture: Phaser.Textures.CanvasTexture): void {
  try { texture.destroy(); } catch { /* shutdown 중 이미 파괴된 텍스처 */ }
}

export function sourceImageOf(scene: Phaser.Scene, key: string): CanvasImageSource | null {
  try {
    if (!scene.textures.exists(key)) return null;
    const source = scene.textures.get(key).getSourceImage() as
      | (CanvasImageSource & { width?: number; height?: number })
      | null;
    if (!source || !source.width || !source.height) return null;
    return source;
  } catch {
    return null;
  }
}

/**
 * TextureManager에 키와 source가 남아 있어도 Frame은 이미 destroy되어
 * `data === null`일 수 있다. 그 상태에서 Text.setText/setSize나 RenderTexture
 * 배치가 한 번만 실행돼도 Phaser 내부의 `Frame.updateUVs()`가
 * `data.drawImage`에서 예외를 낸다. source만 확인하지 말고 실제 Frame까지
 * 살아 있는지 함께 검사한다.
 */
export function hasUsableTexture(scene: Phaser.Scene, key: string, frameName = '__BASE'): boolean {
  if (sourceImageOf(scene, key) === null) return false;
  try {
    const texture = scene.textures.get(key);
    // Texture.get(name)는 존재하지 않는 프레임명에 대해 첫 프레임을
    // 돌려줄 수 있다. 요청한 프레임 자체가 살아 있는지 먼저 확인한다.
    if (!texture.has(frameName)) return false;
    const frame = texture.get(frameName) as (Phaser.Textures.Frame & {
      data?: { drawImage?: unknown };
      source?: { image?: unknown };
    }) | null;
    return !!frame && !!frame.data?.drawImage && !!frame.source?.image;
  } catch {
    return false;
  }
}
