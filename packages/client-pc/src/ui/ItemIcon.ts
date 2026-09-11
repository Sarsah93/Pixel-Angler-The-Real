/**
 * @file ItemIcon.ts
 * @description 아이템 아이콘 렌더 헬퍼
 *
 * 우선순위: ① `iconTexture: 'px:<키>'` = **16x16 손그림 픽셀 아이콘**(PixelIconArt — 신규 아이템 표준)
 *  ② 실사/절차 텍스처 키 ③ 어획물 speciesId 폴백 ④ 레거시 이모지 문자열.
 * ⚠ ④는 구 아이템이 남겨둔 폴백일 뿐이다 — **새 아이템에는 이모지를 넣지 않는다**(AGENTS §4).
 * (인벤토리 소켓 / 상점 셀 / 퀵슬롯 / 상세보기 공용)
 */

import Phaser from 'phaser';
import { addPixelIcon } from './PixelIcon.js';
import { resolveFishTexture } from '../data/FishTextures.js';

export interface ItemIconLike {
  /** 레거시 이모지 아이콘 (최후 폴백 — 신규 아이템은 쓰지 않는다) */
  icon: string;
  /** 텍스처 키. `px:` 접두사면 픽셀 아이콘 아트 키 (예: 'px:it_bandage') */
  iconTexture?: string;
  /** 어획물 어종 ID — iconTexture가 비었을 때 텍스처 폴백 해소용 */
  speciesId?: string;
  /** 개체 체장 (돌돔 암수 분기 등 텍스처 해소용) */
  lengthCm?: number;
}

/**
 * 아이콘 게임오브젝트 생성 — 이미지 우선, 없으면 이모지 텍스트.
 * sizePx는 정사각 기준 표시 크기 (이미지는 종횡비 유지 fit).
 *
 * iconTexture가 비어 있거나 로드되지 않았어도, 어획물이면 speciesId로 텍스처를
 * 폴백 해소한다 (텍스처 배선 전에 낚은 구세이브 어획물도 이미지로 표시).
 */
export function createItemIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  item: ItemIconLike,
  sizePx: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  // 129차 — `px:<키>` 는 16x16 손그림 픽셀 아이콘(PixelIconArt). 신규 아이템은 이모지 대신 이걸 쓴다(§4).
  if (item.iconTexture?.startsWith('px:')) {
    const key = item.iconTexture.slice(3);
    const img = addPixelIcon(scene, key, x, y, sizePx);
    if (img) return img;
  }
  let texKey = item.iconTexture && scene.textures.exists(item.iconTexture) ? item.iconTexture : undefined;
  if (!texKey && item.speciesId) {
    const resolved = resolveFishTexture(item.speciesId, item.lengthCm ?? 0, 'F');
    if (resolved && scene.textures.exists(resolved)) texKey = resolved;
  }
  if (texKey) {
    const img = scene.add.image(x, y, texKey).setOrigin(0.5);
    const src = scene.textures.get(texKey).getSourceImage() as HTMLImageElement;
    const scale = sizePx / Math.max(src.width, src.height);
    img.setDisplaySize(src.width * scale, src.height * scale);
    return img;
  }
  return scene.add.text(x, y, item.icon, { fontSize: `${Math.round(sizePx * 0.85)}px` }).setOrigin(0.5);
}
