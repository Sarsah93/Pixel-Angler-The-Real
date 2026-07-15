/**
 * @file ItemIcon.ts
 * @description 아이템 아이콘 렌더 헬퍼
 *
 * 아이템에 이미지 텍스처(iconTexture)가 지정되어 있고 로드되어 있으면
 * 픽셀 이미지 아이콘을, 아니면 임시 이모지 아이콘을 그린다.
 * (인벤토리 소켓 / 상점 셀 / 퀵슬롯 / 상세보기 공용)
 */

import Phaser from 'phaser';

export interface ItemIconLike {
  /** 임시 이모지 아이콘 (폴백) */
  icon: string;
  /** 픽셀 이미지 텍스처 키 (예: 'food_assorted_sashimi') */
  iconTexture?: string;
}

/**
 * 아이콘 게임오브젝트 생성 — 이미지 우선, 없으면 이모지 텍스트.
 * sizePx는 정사각 기준 표시 크기 (이미지는 종횡비 유지 fit).
 */
export function createItemIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  item: ItemIconLike,
  sizePx: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  if (item.iconTexture && scene.textures.exists(item.iconTexture)) {
    const img = scene.add.image(x, y, item.iconTexture).setOrigin(0.5);
    const src = scene.textures.get(item.iconTexture).getSourceImage() as HTMLImageElement;
    const scale = sizePx / Math.max(src.width, src.height);
    img.setDisplaySize(src.width * scale, src.height * scale);
    return img;
  }
  return scene.add.text(x, y, item.icon, { fontSize: `${Math.round(sizePx * 0.85)}px` }).setOrigin(0.5);
}
