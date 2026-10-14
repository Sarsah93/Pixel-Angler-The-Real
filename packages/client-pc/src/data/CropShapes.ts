/**
 * @file CropShapes.ts
 * @description 245차 — 작물 그림 모양(작업 장면 · 247차 필드 텃밭 칸 그림 공용)
 *
 * 작물마다 그림의 뼈대(곧게 서는 것 · 로제트 · 뿌리 · 파 · 덤불 · 덩굴 · 옥수수 · 보리 · 나무 · 딸기 · 시루 · 새싹 판 · 배지)를 고른다.
 * 표에 없으면 열매 작물은 곧게 서는 것, 나머지는 로제트.
 */

import type { CropDef } from '@tra/core';

/** 245차 — 작물 그림 모양 */
export type Shape = 'upright' | 'rosette' | 'root' | 'allium' | 'bush' | 'vine' | 'corn' | 'grass' | 'shrub' | 'strawberry' | 'jar' | 'tray' | 'bag';

const SHAPE_BY_ID: Record<string, Shape> = {
  bean_sprout: 'jar', mung_sprout: 'jar', microgreens: 'tray',
  oyster_mushroom: 'bag', lions_mane: 'bag', wood_ear: 'bag',
  cucumber: 'vine', zucchini: 'vine', korean_melon: 'vine', watermelon: 'vine', gourd: 'vine', bitter_melon: 'vine',
  sweet_potato: 'vine', pumpkin_sweet_potato: 'vine',
  strawberry: 'strawberry', blueberry: 'shrub', dureup: 'shrub', eomnamu: 'shrub', chopi: 'shrub',
  radish: 'root', turnip: 'root', carrot: 'root',
  garlic: 'allium', onion: 'allium', leek: 'allium', scallion: 'allium', chive: 'allium',
  corn: 'corn', barley: 'grass',
  potato: 'bush', taro: 'bush', yacon: 'bush', choseokjam: 'bush', jerusalem: 'bush', ginger: 'bush', turmeric: 'bush',
  soybean: 'bush', peanut: 'bush', cowpea: 'bush',
  perilla: 'upright', deulkkae: 'upright', chamkkae: 'upright', basil: 'upright', shiso: 'upright', banga: 'upright', amaranth: 'upright', okra: 'upright', eggplant: 'upright',
};
export function shapeOf(crop: CropDef): Shape {
  return SHAPE_BY_ID[crop.id] ?? (crop.category === 'fruit' ? 'upright' : 'rosette');
}
/** 그릇 하나에 담긴 작물(시루 · 새싹 판 · 버섯 배지) — 포기가 아니라 그릇을 그린다 */
export const CONTAINER: ReadonlySet<Shape> = new Set(['jar', 'tray', 'bag']);

