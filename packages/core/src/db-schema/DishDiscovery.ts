/**
 * @file DishDiscovery.ts
 * @description 요리 도감 — 발견 id 규약과 변형 후보 (156차 — 확장 스펙 §19~§22 · §35~§36)
 *
 * ⚖ 도감 = **종류**(레시피 × 주재료 어종), 인벤 음식 = 개체(`DishInstance`). 인스턴스마다 항목을 만들지 않는다.
 * ⚖ 발견 id = `discovery_<recipeId>_<speciesId>` · 주재료 어종이 없으면 `generic`.
 * ⚖ 156차에 어종별로 갈라지는 레시피는 두 종류의 매운탕이다 — 서더리와 통생선을 별도 항목으로 센다.
 */

import { FISH_DATABASE } from './FishDatabase.js';
import { FIRE_RECIPES } from './FireRecipeDatabase.js';
import { speciesMainIngredient } from './CookIngredientDatabase.js';
import { dishBaseName } from './RecipeLore.js';

/** 주재료 어종에 따라 결과가 갈라지는 레시피 (Stage 3 = 매운탕만) */
export const VARIANT_RECIPES: ReadonlySet<string> = new Set(['stew_red', 'stew_red_whole']);

export function isVariantRecipe(recipeId: string): boolean {
  return VARIANT_RECIPES.has(recipeId);
}

export function dishDiscoveryId(recipeId: string, speciesId: string | null): string {
  return `discovery_${recipeId}_${speciesId ?? 'generic'}`;
}

export function parseDishDiscoveryId(id: string): { recipeId: string; speciesId: string | null } | null {
  if (!id.startsWith('discovery_')) return null;
  const rest = id.slice('discovery_'.length);
  // `stew_red_whole`도 `stew_red_`로 시작하므로 긴 id부터 비교해야 한다.
  const r = [...FIRE_RECIPES].sort((a, b) => b.id.length - a.id.length)
    .find((x) => rest === `${x.id}_generic` || rest.startsWith(`${x.id}_`));
  if (!r) return null;
  const sp = rest.slice(r.id.length + 1);
  return { recipeId: r.id, speciesId: sp === 'generic' ? null : sp };
}

/** 도감 표시 이름 — `우럭 매운탕` / generic이면 레시피 이름 */
export function dishDiscoveryName(id: string, en = false): string {
  const p = parseDishDiscoveryId(id);
  if (!p) return id;
  const r = FIRE_RECIPES.find((x) => x.id === p.recipeId);
  if (!r) return id;
  const f = p.speciesId ? FISH_DATABASE.find((x) => x.id === p.speciesId) : undefined;
  const n = dishBaseName(r.id, r.nameKo, r.nameEn, f?.nameKo ?? null, f?.nameEn ?? null);
  return en ? n.en : n.ko;
}

/** 이 레시피의 주재료가 될 수 있는 어종 (도감 분모). 같은 학명의 야간 엔트리는 하나로 센다 */
export function dishVariantCandidates(recipeId: string): string[] {
  const r = FIRE_RECIPES.find((x) => x.id === recipeId);
  if (!r) return [];
  const mainReq = r.required.find((q) => q.role === 'main');
  const mains = mainReq ? (Array.isArray(mainReq.ing) ? mainReq.ing : [mainReq.ing]) : [];
  const wantsFish = mains.includes('fish') || mains.includes('fish_dressed') || mains.includes('seodeori');
  const wantsEel = mains.includes('eel');
  const wantsSquid = mains.includes('squid');
  if (!wantsFish && !wantsEel && !wantsSquid) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of FISH_DATABASE) {
    if (seen.has(f.scientificName)) continue;
    const kind = speciesMainIngredient(f.id);
    if ((kind === 'fish' && wantsFish) || (kind === 'eel' && wantsEel) || (kind === 'squid' && wantsSquid)) {
      seen.add(f.scientificName);
      out.push(f.id);
    }
  }
  return out;
}
