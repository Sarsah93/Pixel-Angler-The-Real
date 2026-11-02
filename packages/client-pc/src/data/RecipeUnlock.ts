/**
 * @file RecipeUnlock.ts
 * @description 295차 — 지역 레시피 해금(사용자 지시 「지역 레시피」). `FireRecipeDef.learn`이 있는 레시피는 그 편(`learn.questId`)을
 *  끝내야 쓴다 — `StoryStore.complete`가 `unlock.recipe:<id>` 플래그를 세운다. `learn`이 없는 열 가지는 처음부터 안다(구세이브 안전).
 *  보는 곳: 불요리 창 목록 · `CookingStore.startRecipe` · 도감 요리 탭(모르는 것은 숨긴다 — R2).
 */

import type { FireRecipeDef } from '@tra/core';
import { GameState } from '../store/GameState.js';

/** 이 레시피를 아는가 */
export function recipeKnown(r: FireRecipeDef): boolean {
  return !r.learn || GameState.getFlag(`unlock.recipe:${r.id}`);
}
