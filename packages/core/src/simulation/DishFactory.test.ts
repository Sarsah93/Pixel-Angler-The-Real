/**
 * @file DishFactory.test.ts
 * @description 255차 — 나머지 레시피 개체화(확장 스펙 Stage 7) 시험: 주재료별 이름 · 효과 · 도감 후보 · 수식어 · 전복죽 고정.
 */
import { describe, expect, it } from 'vitest';
import { createDishInstance, dishWeightMult, dishEffectScore, type PrimaryIngredientInfo } from './DishFactory.js';
import { getFireRecipe } from '../db-schema/FireRecipeDatabase.js';
import {
  isVariantRecipe, dishVariantCandidates, dishDiscoveryIdsFor, dishDiscoveryName, dishSpeciesName, allDishVariantLines,
  dishVariantKind, cookSpeciesNames,
} from '../db-schema/DishDiscovery.js';
import { hasFishCookingProfile, fishCookingProfileOf } from '../db-schema/FishCookingProfiles.js';
import { RECIPE_EFFECTS } from '../db-schema/FoodEffects.js';
import { dishBaseName, DISH_MODIFIER_KO } from '../db-schema/RecipeLore.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { TUNING } from '../config/tuning.js';
import type { DishData, DishInstance } from '../types/Cooking.js';

const AT = Date.UTC(2026, 9, 15, 3);

/** 완성 요리 원점수 — 기본은 총점 90 안팎(일품 미만) */
function dish(recipeId: string, opts: Partial<Pick<DishData, 'burnt'>> & { score?: number } = {}): DishData {
  const v = opts.score ?? 0.9;
  return {
    recipeId, cookedAtMs: AT, tempAtDoneC: 90,
    base: { season: v, temp: v, texture: v, fresh: v, finish: v },
    saltLabel: 'ok', sugarLabel: 'ok', contents: [], stoveKind: 'home', cookwareId: 'pot_basic',
    burnt: !!opts.burnt, servings: 2, skillRank: 0, missingRequired: 0,
  };
}

function primary(speciesId: string | null, freshness01 = 0.65, weightG = 600): PrimaryIngredientInfo {
  const n = cookSpeciesNames(speciesId);
  return { speciesId, nameKo: n?.nameKo ?? null, nameEn: n?.nameEn ?? null, weightG, freshness01 };
}

function make(recipeId: string, speciesId: string | null, freshness01 = 0.65, opts: { burnt?: boolean; score?: number; weightG?: number } = {}): DishInstance {
  const r = getFireRecipe(recipeId)!;
  return createDishInstance(r, dish(recipeId, opts), primary(speciesId, freshness01, opts.weightG ?? 600), 7);
}

describe('255차 — 전복죽을 뺀 여덟 레시피가 주재료로 갈라진다', () => {
  it('변형 레시피 = 여덟 · 전복죽은 고정', () => {
    for (const id of ['stew_red', 'stew_red_whole', 'stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel']) {
      expect(isVariantRecipe(id)).toBe(true);
    }
    expect(isVariantRecipe('porridge_abalone')).toBe(false);
    expect(dishVariantCandidates('porridge_abalone')).toEqual([]);
    expect(dishVariantKind('porridge_abalone')).toBeNull();
    // 전복죽은 어종 이름이 와도 레시피 이름 그대로
    expect(dishBaseName('porridge_abalone', '전복죽', 'Abalone porridge', '전복', 'Abalone', 'haliotis_discus')).toEqual({ ko: '전복죽', en: 'Abalone porridge' });
    expect(allDishVariantLines().some(([ko]) => ko.includes('전복죽'))).toBe(false);
  });

  it('이름 규칙 — 레시피 틀 × 상에 오르는 어종 이름 (한 · 영)', () => {
    const cases: [string, string, string, string][] = [
      ['stew_clear', 'black_rockfish', '우럭 지리 (맑은탕)', 'Rockfish Jiri (clear soup)'],
      ['stew_clear', 'pacific_cod', '대구 지리 (맑은탕)', 'Cod Jiri (clear soup)'],
      ['grill_fish', 'chub_mackerel', '고등어구이', 'Grilled Mackerel'],
      ['grill_fish', 'flatfish', '광어구이', 'Grilled Olive Flounder'],
      ['braise_fish', 'hairtail', '갈치조림', 'Braised Hairtail'],
      ['stirfry_squid', 'swordtip_squid', '한치볶음', 'Stir-fried Swordtip Squid'],
      ['stirfry_squid', 'cuttlefish', '갑오징어볶음', 'Stir-fried Cuttlefish'],
      ['stirfry_squid', 'squid', '무늬오징어볶음', 'Stir-fried Bigfin Reef Squid'],
      ['soup_clam', 'clam_varicosa', '바지락탕', 'Short-necked Clam Soup'],
      ['soup_clam', 'mytilus_coruscus', '홍합탕', 'Korean Mussel Soup'],
      ['soup_clam', 'oyster_gigas', '굴국', 'Oyster Soup'],
      ['grill_eel', 'conger_eel', '붕장어구이', 'Grilled Conger Eel'],
      ['grill_eel', 'hagfish', '먹장어구이', 'Grilled Inshore Hagfish'],
      // 매운탕 — 156차 틀 그대로 · 이름은 상에 오르는 이름(조피볼락(우럭) → 우럭)
      ['stew_red_whole', 'black_seabream', '감성돔 매운탕', 'Black Seabream Maeuntang'],
      ['stew_red', 'black_rockfish', '우럭 서더리 매운탕', 'Rockfish Fish-frame Maeuntang'],
      ['stew_red_whole', 'flatfish', '광어 매운탕', 'Olive Flounder Maeuntang'],
    ];
    for (const [recipe, sp, ko, en] of cases) {
      // 신선도 0.65 · 총점 < 95 → 수식어는 지방감 0.8 이상(고등어)일 때 「기름진」뿐
      const inst = make(recipe, sp);
      const fatty = fishCookingProfileOf(sp).fatness >= TUNING.cook.naming.fattyThreshold;
      expect(inst.modifier, `${recipe}/${sp}`).toBe(fatty ? 'fatty' : null);
      expect(inst.result.nameKo).toBe(fatty ? `기름진 ${ko}` : ko);
      expect(inst.result.nameEn).toBe(fatty ? `Fatty ${en}` : en);
      expect(inst.discoveryId).toBe(`discovery_${recipe}_${sp}`);
      expect(dishDiscoveryName(inst.discoveryId)).toBe(ko);
      expect(dishDiscoveryName(inst.discoveryId, true)).toBe(en);
    }
  });

  it('상세 주재료 줄은 도감의 정식 이름을 쓴다(요리 이름만 상에 오르는 이름)', () => {
    const inst = make('stew_clear', 'black_rockfish');
    expect(inst.ingredientProfile.primaryNameKo).toBe('조피볼락(우럭)');
    expect(make('soup_clam', 'mytilus_coruscus').ingredientProfile.primaryNameKo).toBe('홍합 (섭)');
  });

  it('주재료를 모르면 레시피 이름 · generic 도감 항목', () => {
    const inst = make('grill_fish', null);
    expect(inst.result.nameKo).toBe('생선구이');
    expect(inst.discoveryId).toBe('discovery_grill_fish_generic');
    const unknown = make('soup_clam', 'no_such_creature');
    expect(unknown.result.nameKo).toBe('조개탕');
    expect(unknown.ingredientProfile.primarySpecies).toBeNull();
  });

  it('밤에 낚은 참돔도 참돔 — 정본 id 하나로 센다(옛 기록 id도 함께 인정)', () => {
    const inst = make('grill_fish', 'night_seabream');
    expect(inst.result.nameKo).toBe('참돔구이');
    expect(inst.discoveryId).toBe('discovery_grill_fish_red_seabream');
    const cands = dishVariantCandidates('stew_red');
    expect(cands).toContain('red_seabream');
    expect(cands).not.toContain('night_seabream');
    expect(dishDiscoveryIdsFor('stew_red', 'red_seabream')).toEqual(['discovery_stew_red_red_seabream', 'discovery_stew_red_night_seabream']);
    expect(dishDiscoveryName('discovery_stew_red_night_seabream')).toBe('참돔 서더리 매운탕');
  });

  it('수식어는 최대 하나 — 탄 > 일품 > 싱싱한 > 기름진', () => {
    const mods = Object.values(DISH_MODIFIER_KO);
    const count = (name: string): number => name.split(' ').filter((w) => mods.includes(w)).length;
    // 고등어(지방감 0.82): 신선하면 「싱싱한」만, 덜 신선하면 「기름진」만, 타면 「탄」만
    const fresh = make('grill_fish', 'chub_mackerel', 0.95);
    expect(fresh.result.nameKo).toBe('싱싱한 고등어구이');
    const fatty = make('grill_fish', 'chub_mackerel', 0.65);
    expect(fatty.result.nameKo).toBe('기름진 고등어구이');
    expect(fatty.result.nameEn).toBe('Fatty Grilled Mackerel');
    const burnt = make('grill_fish', 'chub_mackerel', 0.95, { burnt: true });
    expect(burnt.result.nameKo).toBe('탄 고등어구이');
    expect(burnt.result.effects).toEqual([]);
    expect(burnt.result.sellPrice).toBe(0);
    const prime = make('stew_clear', 'chub_mackerel', 0.95, { score: 1 });
    expect(prime.modifier).toBe('prime');
    expect(prime.result.nameKo).toBe('일품 고등어 지리 (맑은탕)');
    for (const r of ['stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel']) {
      for (const sp of dishVariantCandidates(r)) {
        for (const f of [0.5, 0.95]) for (const burnt of [false, true]) expect(count(make(r, sp, f, { burnt }).result.nameKo)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('255차 — 효과는 주재료에 따라 달라진다', () => {
  const eff = (i: DishInstance) => i.result.effects[0];

  it('지리 — 비린 향이 적은 우럭이 고등어보다 「맑은 속」이 세고 길다', () => {
    const a = eff(make('stew_clear', 'black_rockfish', 0.92)), b = eff(make('stew_clear', 'chub_mackerel', 0.92));
    expect(a.id).toBe('clear_belly');
    expect(a.magnitude).toBeGreaterThan(b.magnitude);
    expect(a.durationMin).toBeGreaterThan(b.durationMin);
    // 같은 어종이라도 신선할수록
    const stale = eff(make('stew_clear', 'black_rockfish', 0.55));
    expect(a.durationMin).toBeGreaterThan(stale.durationMin);
  });

  it('생선구이 — 기름진 고등어가 담백한 광어보다', () => {
    const a = eff(make('grill_fish', 'chub_mackerel')), b = eff(make('grill_fish', 'flatfish'));
    expect(a.magnitude).toBeGreaterThan(b.magnitude);
    expect(a.durationMin).toBeGreaterThan(b.durationMin);
  });

  it('생선조림 — 살이 탄탄한 우럭이 무른 갈치보다 「든든함」이 오래 간다', () => {
    const a = eff(make('braise_fish', 'black_rockfish')), b = eff(make('braise_fish', 'hairtail'));
    expect(a.kind).toBe('satiety');
    expect(a.durationMin).toBeGreaterThan(b.durationMin);
  });

  it('오징어볶음 — 두툼한 갑오징어가 연한 한치보다 「활력」이 길다', () => {
    const a = eff(make('stirfry_squid', 'cuttlefish')), b = eff(make('stirfry_squid', 'swordtip_squid'));
    expect(a.durationMin).toBeGreaterThan(b.durationMin);
  });

  it('조개탕 — 국물이 진한 홍합이 굴보다 「개운함」이 세다', () => {
    const a = eff(make('soup_clam', 'mytilus_coruscus')), b = eff(make('soup_clam', 'oyster_gigas'));
    expect(a.magnitude).toBeGreaterThan(b.magnitude);
  });

  it('장어구이 — 기름진 붕장어가 먹장어보다 「원기회복」이 길다', () => {
    const a = eff(make('grill_eel', 'conger_eel')), b = eff(make('grill_eel', 'hagfish'));
    expect(a.durationMin).toBeGreaterThan(b.durationMin);
  });

  it('설명 문장의 분 · %는 실제 값이다', () => {
    for (const r of ['stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel']) {
      for (const sp of dishVariantCandidates(r)) {
        const e = eff(make(r, sp, 0.9));
        const pct = Math.round(e.magnitude * 100);
        expect(e.descKo.startsWith(`${e.durationMin}분 `)).toBe(true);
        expect(e.descKo.endsWith(`${pct}%`)).toBe(true);
        expect(e.descEn.endsWith(`for ${e.durationMin} min`)).toBe(true);
        expect(e.descEn).toContain(`${pct}%`);
        // 크기는 1% 단위 · 배율 상하한 안
        expect(Math.abs(e.magnitude * 100 - pct)).toBeLessThan(1e-9);
        const base = RECIPE_EFFECTS[r];
        expect(e.magnitude).toBeLessThanOrEqual(base.magnitude * TUNING.cook.dishEffect.effectMultMax + 0.005);
        expect(e.magnitude).toBeGreaterThanOrEqual(base.magnitude * TUNING.cook.dishEffect.effectMultMin - 0.005);
      }
    }
  });

  it('레시피 효과 문장은 보정 · 번역 규칙이 갈아 끼우는 꼴(`N분 …` · `±N%`)을 지킨다', () => {
    for (const e of Object.values(RECIPE_EFFECTS)) {
      expect(e.descKo).toMatch(/^\d+분 .+[+-]\d+%$/);
      expect(e.descEn).toMatch(/\d+%.* for \d+ min$/);
    }
  });

  it('매운탕은 156차 규칙 그대로 — 지속 = 기본 × (0.8 + 0.4 × 지방감) · 크기 고정', () => {
    for (const r of ['stew_red', 'stew_red_whole']) {
      for (const sp of ['black_rockfish', 'flatfish', 'black_seabream', 'chub_mackerel']) {
        const e = eff(make(r, sp, 0.9));
        const base = RECIPE_EFFECTS[r];
        expect(e.magnitude).toBe(base.magnitude);
        expect(e.durationMin).toBe(Math.round(base.durationMin * (0.8 + 0.4 * fishCookingProfileOf(sp).fatness)));
      }
    }
  });

  it('같은 입력이면 같은 결과(§41)', () => {
    expect(make('grill_eel', 'conger_eel', 0.9)).toEqual(make('grill_eel', 'conger_eel', 0.9));
  });

  it('효과 점수는 0~1 · 보정 없는 레시피는 null', () => {
    for (const r of Object.keys(TUNING.cook.variantEffect)) {
      for (const sp of dishVariantCandidates(r)) {
        const s = dishEffectScore(r, fishCookingProfileOf(sp), 0.9)!;
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    }
    expect(dishEffectScore('porridge_abalone', fishCookingProfileOf(null), 1)).toBeNull();
  });

  it('1인분 요리는 중량 기준이 가볍다 — 구이 450g · 장어 500g이 배율 1', () => {
    expect(dishWeightMult(450, 'grill_fish')).toBeCloseTo(1, 6);
    expect(dishWeightMult(500, 'grill_eel')).toBeCloseTo(1, 6);
    expect(dishWeightMult(800, 'stew_red')).toBeCloseTo(1, 6);
    expect(dishWeightMult(800)).toBeCloseTo(1, 6);
  });
});

describe('255차 — 요리 도감 후보', () => {
  it('레시피마다 맞는 주재료만 — 오징어 넷(289 살오징어) · 장어 셋 · 채집 조개 셋 · 어종은 정본 id', () => {
    expect(new Set(dishVariantCandidates('stirfry_squid'))).toEqual(new Set(['squid', 'cuttlefish', 'swordtip_squid', 'flying_squid']));
    expect(new Set(dishVariantCandidates('grill_eel'))).toEqual(new Set(['conger_eel', 'hagfish', 'pike_conger']));
    expect(new Set(dishVariantCandidates('soup_clam'))).toEqual(new Set(['clam_varicosa', 'mytilus_coruscus', 'oyster_gigas']));
    const fish = dishVariantCandidates('grill_fish');
    for (const r of ['stew_red', 'stew_red_whole', 'stew_clear', 'braise_fish']) expect(dishVariantCandidates(r)).toEqual(fish);
    expect(fish).not.toContain('conger_eel');
    expect(fish).not.toContain('squid');
    expect(dishVariantKind('soup_clam')).toBe('shellfish');
    expect(dishVariantKind('stirfry_squid')).toBe('squid');
    expect(dishVariantKind('grill_eel')).toBe('eel');
    expect(dishVariantKind('stew_clear')).toBe('fish');
  });

  it('후보는 모두 요리 프로필이 있고, 학명이 겹치지 않으며, 레시피 안에서 이름이 겹치지 않는다', () => {
    for (const r of ['stew_red', 'stew_red_whole', 'stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel']) {
      const cands = dishVariantCandidates(r);
      const sci = cands.map((sp) => FISH_DATABASE.find((f) => f.id === sp)?.scientificName).filter(Boolean);
      expect(new Set(sci).size).toBe(sci.length);
      const names = cands.map((sp) => make(r, sp).result.nameKo);
      expect(new Set(names).size).toBe(names.length);
      for (const sp of cands) {
        expect(hasFishCookingProfile(sp), `${r}/${sp}`).toBe(true);
        expect(dishSpeciesName(sp)).not.toBeNull();
      }
    }
  });

  it('같은 학명의 어종 엔트리는 모두 별칭으로 묶여 있다(새 야간 엔트리가 생기면 여기서 걸린다)', () => {
    const bySci = new Map<string, string[]>();
    for (const f of FISH_DATABASE) bySci.set(f.scientificName, [...(bySci.get(f.scientificName) ?? []), f.id]);
    for (const ids of bySci.values()) {
      if (ids.length < 2) continue;
      const canon = new Set(ids.map((id) => dishDiscoveryIdsFor('grill_fish', id)[0]));
      expect(canon.size, ids.join(',')).toBe(1);
    }
  });

  it('영어 짝 — 개체 이름 · 수식어 · 미발견 자리 · 설명이 다 있다', () => {
    const lines = new Map(allDishVariantLines());
    expect(lines.get('우럭 지리 (맑은탕)')).toBe('Rockfish Jiri (clear soup)');
    expect(lines.get('싱싱한 고등어구이')).toBe('Fresh Grilled Mackerel');
    expect(lines.get('탄 생선구이')).toBe('Burnt Grilled fish');
    expect(lines.get('???구이')).toBe('Grilled ???');
    expect(lines.get('??? 지리 (맑은탕)')).toBe('??? Jiri (clear soup)');
    const inst = make('braise_fish', 'chub_mackerel', 0.9);
    expect(lines.get(inst.result.descriptionKo)).toBe(inst.result.descriptionEn);
    for (const r of ['stew_clear', 'grill_fish', 'braise_fish', 'stirfry_squid', 'soup_clam', 'grill_eel']) {
      for (const sp of dishVariantCandidates(r)) {
        const i = make(r, sp, 0.95);
        expect(lines.get(i.result.nameKo), i.result.nameKo).toBe(i.result.nameEn);
        expect(lines.get(i.result.descriptionKo)).toBe(i.result.descriptionEn);
      }
    }
  });
});
