/**
 * @file DishDiscovery.ts
 * @description 요리 도감 — 발견 id 규약과 변형 후보 (156차 — 확장 스펙 §19~§22 · §35~§36 · 255차 Stage 7)
 *
 * ⚖ 도감 = **종류**(레시피 × 주재료), 인벤 음식 = 개체(`DishInstance`). 인스턴스마다 항목을 만들지 않는다.
 * ⚖ 발견 id = `discovery_<recipeId>_<speciesId>` · 주재료를 모르면 `generic`.
 * ⚖ 156차 = 매운탕 두 종류(서더리 · 통생선)만 갈라졌다. 255차 = 전복죽을 뺀 여덟 레시피가 갈라진다 —
 *   지리 · 생선구이 · 생선조림(어종) · 오징어볶음(두족류) · 조개탕(채집 조개 — 채집 생물 id) · 장어구이(장어류).
 * ⚖ 같은 학명의 야간 엔트리는 정본 id 하나로 센다(`cookingSpeciesId` — 밤 참돔 = 참돔).
 */

import { FISH_DATABASE } from './FishDatabase.js';
import { SHORE_CREATURE_DATABASE } from './ShoreCreatureDatabase.js';
import { FIRE_RECIPES } from './FireRecipeDatabase.js';
import { speciesMainIngredient, forageMainIngredient } from './CookIngredientDatabase.js';
import { cookingSpeciesId, COOKING_SPECIES_ALIAS } from './FishCookingProfiles.js';
import { dishBaseName, variantDescription, DISH_SPECIES_NAME, DISH_MODIFIER_KO, DISH_MODIFIER_EN } from './RecipeLore.js';
import type { DishNameModifier } from '../types/Cooking.js';

/** 주재료에 따라 결과(이름 · 효과 · 도감 항목)가 갈라지는 레시피 — 전복죽만 고정 이름이다 */
export const VARIANT_RECIPES: ReadonlySet<string> = new Set([
  'stew_red', 'stew_red_whole', 'stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel',
]);

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

/**
 * 주재료의 정식 이름 (어종 도감 · 채집 생물 도감과 같은 이름 — `조피볼락(우럭)` · `홍합 (섭)`).
 * 어종이 먼저, 없으면 채집 생물. 모르는 id면 null.
 */
export function cookSpeciesNames(speciesId: string | null | undefined): { id: string; nameKo: string; nameEn: string } | null {
  if (!speciesId) return null;
  const f = FISH_DATABASE.find((x) => x.id === speciesId);
  if (f) return { id: f.id, nameKo: f.nameKo, nameEn: f.nameEn };
  const c = SHORE_CREATURE_DATABASE.find((x) => x.id === speciesId);
  if (c) return { id: c.id, nameKo: c.nameKo, nameEn: c.nameEn };
  return null;
}

/** 이름 끝 괄호 별칭을 뗀다 — `광어(넙치)` → `광어` · `참돔 (야간)` → `참돔` */
const stripAlias = (s: string): string => s.replace(/\s*\([^)]*\)\s*$/, '').trim() || s;

/**
 * 요리 이름에 들어가는 어종 이름 (255차) — 상에 오를 때 부르는 이름.
 * `DISH_SPECIES_NAME` 예외(조피볼락 → 우럭 · 태평양 대구 → 대구) → 정식 이름에서 괄호 별칭을 뗀 것.
 */
export function dishSpeciesName(speciesId: string | null | undefined): { ko: string; en: string } | null {
  if (!speciesId) return null;
  const id = cookingSpeciesId(speciesId);
  const own = DISH_SPECIES_NAME[id];
  if (own) return { ko: own.ko, en: own.en };
  const n = cookSpeciesNames(id);
  if (!n) return null;
  return { ko: stripAlias(n.nameKo), en: stripAlias(n.nameEn) };
}

/** 도감 표시 이름 — `우럭 매운탕` · `고등어구이` / generic이면 레시피 이름 */
export function dishDiscoveryName(id: string, en = false): string {
  const p = parseDishDiscoveryId(id);
  if (!p) return id;
  const r = FIRE_RECIPES.find((x) => x.id === p.recipeId);
  if (!r) return id;
  const sp = p.speciesId ? cookingSpeciesId(p.speciesId) : null;
  const nm = sp ? dishSpeciesName(sp) : null;
  const n = dishBaseName(r.id, r.nameKo, r.nameEn, nm?.ko ?? null, nm?.en ?? null, sp);
  return en ? n.en : n.ko;
}

/** 변형 레시피의 주재료 갈래 — 도감 힌트 문구(「다른 어종을 …」 · 「다른 조개를 …」)용 */
export type DishVariantKind = 'fish' | 'squid' | 'eel' | 'shellfish';

/** 레시피의 주재료 재료 id 목록 (`required`의 main) */
function mainIngredientsOf(recipeId: string): string[] {
  const r = FIRE_RECIPES.find((x) => x.id === recipeId);
  const mainReq = r?.required.find((q) => q.role === 'main');
  return mainReq ? (Array.isArray(mainReq.ing) ? mainReq.ing : [mainReq.ing]) : [];
}

/** 어종 재료(fish)는 원물 · 손질 생선 · 서더리 어느 쪽으로 들어가도 같은 어종이다 */
function fitsMain(mains: string[], kind: string): boolean {
  if (kind === 'fish') return mains.some((m) => m === 'fish' || m === 'fish_dressed' || m === 'seodeori');
  return mains.includes(kind);
}

export function dishVariantKind(recipeId: string): DishVariantKind | null {
  if (!isVariantRecipe(recipeId)) return null;
  const mains = mainIngredientsOf(recipeId);
  if (fitsMain(mains, 'fish')) return 'fish';
  if (mains.includes('squid')) return 'squid';
  if (mains.includes('eel')) return 'eel';
  if (mains.some((m) => m === 'clam' || m === 'mussel' || m === 'oyster')) return 'shellfish';
  return null;
}

/**
 * 이 레시피의 주재료가 될 수 있는 어종 · 채집 생물 (도감 분모). 변형 레시피만.
 * 어종은 정본 id로 모은다(같은 학명의 야간 엔트리는 하나 — 밤 참돔 = 참돔). 조개탕은 채집 조개(바지락 · 굴 · 홍합).
 */
export function dishVariantCandidates(recipeId: string): string[] {
  if (!isVariantRecipe(recipeId)) return [];
  const mains = mainIngredientsOf(recipeId);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of FISH_DATABASE) {
    const id = cookingSpeciesId(f.id);
    if (seen.has(id)) continue;
    if (fitsMain(mains, speciesMainIngredient(id))) { seen.add(id); out.push(id); }
  }
  for (const c of SHORE_CREATURE_DATABASE) {
    const ing = forageMainIngredient(c.id);
    if (ing && !seen.has(c.id) && fitsMain(mains, ing)) { seen.add(c.id); out.push(c.id); }
  }
  return out;
}

/**
 * 도감에서 이 (레시피 × 정본 어종) 항목을 「발견」으로 칠 발견 id들 — 정본 id + 같은 어종의 옛 id.
 * 156차 세이브는 밤 참돔을 `…_night_seabream`으로 기록했다 — 그 기록도 참돔 항목으로 센다.
 */
export function dishDiscoveryIdsFor(recipeId: string, speciesId: string): string[] {
  const canon = cookingSpeciesId(speciesId);
  const ids = [dishDiscoveryId(recipeId, canon)];
  for (const [alias, to] of Object.entries(COOKING_SPECIES_ALIAS)) if (to === canon) ids.push(dishDiscoveryId(recipeId, alias));
  return ids;
}

/**
 * 영어 사전용 짝 (255차) — 변형 이름(수식어 0~1개) · 미발견 자리(`???구이`) · 변형 설명.
 * 클라이언트 i18n이 런타임 사전에 붙인다(데이터가 곧 번역). 개체 `nameEn`과 같은 함수에서 나온다.
 */
export function allDishVariantLines(): [string, string][] {
  const out: [string, string][] = [];
  const mods = Object.keys(DISH_MODIFIER_KO) as DishNameModifier[];
  const withMods = (ko: string, en: string): void => {
    out.push([ko, en]);
    for (const m of mods) out.push([`${DISH_MODIFIER_KO[m]} ${ko}`, `${DISH_MODIFIER_EN[m]} ${en}`]);
  };
  for (const r of FIRE_RECIPES) {
    if (!isVariantRecipe(r.id)) continue;
    withMods(r.nameKo, r.nameEn);   // 주재료를 모를 때(generic)
    const hole = dishBaseName(r.id, r.nameKo, r.nameEn, '???', '???');
    out.push([hole.ko, hole.en]);
    for (const sp of dishVariantCandidates(r.id)) {
      const nm = dishSpeciesName(sp);
      if (!nm) continue;
      const base = dishBaseName(r.id, r.nameKo, r.nameEn, nm.ko, nm.en, sp);
      withMods(base.ko, base.en);
      const d = variantDescription(r.id, sp, nm.ko, nm.en);
      out.push([d.ko, d.en]);
    }
  }
  return out;
}
