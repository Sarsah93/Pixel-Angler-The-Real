/**
 * @file gen_game_wiki_data.mjs
 * @description 조행록 퀘스트 아티팩트를 게임 전체 위키 데이터로 확장한다.
 *
 * 실행:
 *   node tools/gen_game_wiki_data.mjs          -> JSON
 *   node tools/gen_game_wiki_data.mjs --html   -> tools/game_wiki_template.html 주입 HTML
 * 선행:
 *   pnpm --filter @tra/core run build          (core dist)
 *   py tools/gen_wiki_images.py                (썸네일 + manifest.json — 없으면 이미지 없이 굽는다)
 *   node tools/dump_quest_scenes.cjs           (장면 — 없으면 장면 절 생략)
 *
 * ⚖ 수치·문구는 전부 dist/클라 카탈로그에서 읽는다. 여기서 손으로 적지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Windows Node는 C:\ 절대 경로를 ESM specifier로 받지 않으므로 file:// URL로 변환한다.
const core = await import(pathToFileURL(path.join(ROOT, 'packages/core/dist/index.js')).href);

const questJson = execFileSync(process.execPath, [path.join(ROOT, 'tools/gen_quest_wiki_data.mjs')], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
const quests = JSON.parse(questJson);

// ─────────────────────────────────────────────
// 이미지 — 게임 텍스처 키 → 썸네일 파일명 (gen_wiki_images.py 산출)
// ─────────────────────────────────────────────
const IMG_DIR = path.join(ROOT, 'tools/wiki_img');
const manifest = fs.existsSync(path.join(IMG_DIR, 'manifest.json'))
  ? JSON.parse(fs.readFileSync(path.join(IMG_DIR, 'manifest.json'), 'utf8')) : {};
const imgOf = (key) => (key && manifest[key] ? manifest[key].f : null);

// ─────────────────────────────────────────────
// 아이템 카탈로그 — 클라 WikiCatalog를 그대로 굽는다(id/분류/가격/설명/판매처)
// ─────────────────────────────────────────────
const ITEM_DUMP = path.join(ROOT, 'tools/wiki_items.json');
const itemCatalog = fs.existsSync(ITEM_DUMP) ? JSON.parse(fs.readFileSync(ITEM_DUMP, 'utf8')) : [];

// ─────────────────────────────────────────────
// 시스템 페이지 요약
// ─────────────────────────────────────────────
const readSystemPages = () => fs.readdirSync(path.join(ROOT, 'docs/wiki/02-SYSTEMS'))
  .filter((name) => name.endsWith('.md'))
  .sort()
  .map((name) => {
    const text = fs.readFileSync(path.join(ROOT, 'docs/wiki/02-SYSTEMS', name), 'utf8');
    const heading = text.match(/^#\s+(.+)$/m)?.[1] ?? name.replace(/\.md$/, '');
    const summary = text.split(/\r?\n\r?\n/).find((part) => part.trim() && !part.trim().startsWith('#'))
      ?.replace(/[`*_]/g, '').replace(/\r?\n/g, ' ').trim().slice(0, 320) ?? '';
    return { id: name.replace(/\.md$/, ''), title: heading, summary };
  });

// ─────────────────────────────────────────────
// 요리 — 레시피 상세 + 완성도 구간 + 어종 변형
// ─────────────────────────────────────────────
const ROLE_KO = {
  main: '주재료', base: '밑국물', veg: '채소', season: '양념',
  liquid: '물·육수', oil: '기름', grain: '곡물', finish: '마무리',
};
const UNIT_KO = { g: 'g', ea: '개', spoon: '큰술', cup: '컵(200ml)' };
const COOKWARE_KO = core.COOKWARE_KIND_KO ?? { pot: '냄비', pan: '팬', grate: '석쇠' };
const DONE_KO = { mainCooked: '주재료가 익으면', reduced: '국물이 졸아들면', allCooked: '재료가 전부 익으면' };
const ingName = (id) => core.getCookIngredient?.(id)?.nameKo ?? id;

const reqLine = (r) => {
  const names = (Array.isArray(r.ing) ? r.ing : [r.ing]).map(ingName);
  return {
    name: names.join(' 또는 '),
    choice: names.length > 1,
    role: r.role, roleLabel: ROLE_KO[r.role] ?? r.role,
    unit: UNIT_KO[core.getCookIngredient?.(Array.isArray(r.ing) ? r.ing[0] : r.ing)?.unit] ?? '',
    min: r.min, max: r.max, ideal: r.ideal ?? null, stage: r.stage,
  };
};

/**
 * 별 N개를 실제로 만들어 내는 대표 점수 세트 (별 임계 0.72 · 완성도 게이트 0.6).
 * ⚠ 온도 별은 `dish.base.temp`가 아니라 **서빙 온도에서 다시 계산**되므로(`evalTempAt`)
 *   원하는 온도 점수를 `tv`로 주고 `tempAtDoneC`를 역산한다.
 */
const STAR_CASES = [
  { s: { season: 0.80, temp: 0.50, texture: 0.50, fresh: 0.50, finish: 0.50 }, tv: 0.50 },
  { s: { season: 0.80, temp: 0.80, texture: 0.50, fresh: 0.50, finish: 0.50 }, tv: 0.80 },
  { s: { season: 0.80, temp: 0.80, texture: 0.80, fresh: 0.50, finish: 0.50 }, tv: 0.80 },
  { s: { season: 0.85, temp: 0.85, texture: 0.85, fresh: 0.85, finish: 0.60 }, tv: 0.85 },
  { s: { season: 0.92, temp: 0.92, texture: 0.92, fresh: 0.92, finish: 0.92 }, tv: 0.95 },
];

const synthDish = (recipe, scores, tv, burnt = false) => ({
  recipeId: recipe.id, cookedAtMs: 0,
  tempAtDoneC: 40 + tv * (recipe.servingC - 40),
  base: scores,
  saltLabel: 'ok', sugarLabel: 'ok', contents: [], stoveKind: 'field',
  cookwareId: '', burnt, servings: recipe.servings, skillRank: 0, missingRequired: 0,
});

const REF_PRIMARY = { speciesId: null, nameKo: null, nameEn: null, weightG: 0, freshness01: 1 };

const REF_WEIGHT_G = core.TUNING.cook.dishEffect.refWeightG; // 1x 기준 중량

/** 완성도(별) 구간별 실지급 — 기준 중량·신선도 100%·평균 어종 프로필 */
const starRows = (recipe) => {
  const ref = { ...REF_PRIMARY, weightG: REF_WEIGHT_G };
  const rows = STAR_CASES.map(({ s, tv }) => {
    const dish = synthDish(recipe, s, tv);
    const st = core.dishStarsAt(dish, recipe, 0);
    const inst = core.createDishInstance(recipe, dish, ref, 0);
    return {
      stars: st.stars, total: st.total, value: inst.result.sellPrice,
      hunger: inst.result.hungerRestore, hydration: inst.result.hydrationRestore,
      effect: inst.result.effects[0]?.descKo ?? null, burnt: false,
    };
  });
  const burnt = core.createDishInstance(recipe, synthDish(recipe, STAR_CASES[4].s, STAR_CASES[4].tv, true), ref, 0);
  rows.unshift({
    stars: 0, total: 0, value: burnt.result.sellPrice,
    hunger: burnt.result.hungerRestore, hydration: burnt.result.hydrationRestore,
    effect: null, burnt: true,
  });
  return rows;
};

/** 어종별 변형 — 전용 설명이 있는 어종만(도감 항목과 같은 단위) */
const variantRows = (recipe) => {
  const lore = core.DISH_VARIANT_LORE?.[recipe.id];
  if (!lore) return { rows: [], candidates: 0 };
  const candidates = core.dishVariantCandidates?.(recipe.id)?.length ?? 0;
  const rows = Object.entries(lore).map(([speciesId, text]) => {
    const fish = core.getFishById?.(speciesId);
    const inst = core.createDishInstance(recipe, synthDish(recipe, STAR_CASES[4].s, STAR_CASES[4].tv), {
      speciesId, nameKo: fish?.nameKo ?? speciesId, nameEn: fish?.nameEn ?? speciesId,
      weightG: REF_WEIGHT_G, freshness01: 1,
    }, 0);
    const prof = core.fishCookingProfileOf(speciesId);
    return {
      speciesId, species: fish?.nameKo ?? speciesId,
      name: inst.result.nameKo, desc: text.descKo,
      value: inst.result.sellPrice, hunger: inst.result.hungerRestore,
      hydration: inst.result.hydrationRestore,
      effect: inst.result.effects[0]?.descKo ?? null,
      fatness: prof.fatness, texture: prof.texture, broth: prof.brothContribution,
      img: imgOf(FISH_TEX[speciesId]),
    };
  });
  return { rows, candidates };
};

// 어종 텍스처 맵 — 클라 FishTextures.ts를 파싱(중복 정의 금지)
const FISH_TEX = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'packages/client-pc/src/data/FishTextures.ts'), 'utf8');
  const body = src.slice(src.indexOf('FISH_TEXTURE'));
  const map = {};
  for (const m of body.matchAll(/^\s{2}([a-z_]+):\s*'([a-z_]+)'/gm)) map[m[1]] = m[2];
  return map;
})();
/**
 * 어종 그림 — 암수가 눈에 띄게 다른 어종은 **두 장 다** 싣는다(170차 사용자 지적).
 *  돌돔은 30cm를 넘겨야 암수가 갈리고(수컷만 줄무늬 소실), 용치놀래기는 성전환으로 체색이 통째로 바뀐다.
 */
const SEX_VARIANTS = {
  stone_beakperch: [['female', '30cm 미만 · 암컷'], ['male', '30cm 이상 수컷 (줄무늬 소실)']],
  rainbow_wrasse: [['female', '암컷'], ['male', '수컷 (혼인색)']],
};
const fishImgs = (id) => {
  const vs = SEX_VARIANTS[id];
  if (vs) {
    const out = vs.map(([sfx, label]) => ({ src: imgOf(`fish_${id}_${sfx}`), label })).filter((v) => v.src);
    if (out.length) return out;
  }
  const one = imgOf(FISH_TEX[id]) ?? imgOf(`fish_${id}`);
  return one ? [{ src: one, label: '' }] : [];
};

/**
 * 255차 — 요리 이름 규칙(사용자 「어떤 생선이 들어갔느냐에 따라 이름과 효과가 달라져야 … 'OOO 지리(맑은탕)'처럼」).
 *  변형 레시피는 주재료 이름 + 요리(예 넷) · 주재료 후보 수 · 효과를 움직이는 재료 특성. 전복죽은 이름이 고정이다.
 */
const NAME_EXAMPLE_SPECIES = ['black_rockfish', 'chub_mackerel', 'hairtail', 'flatfish', 'pacific_cod', 'black_seabream',
  'swordtip_squid', 'cuttlefish', 'squid', 'conger_eel', 'hagfish'];
const EFFECT_DRIVER_KO = { fatness: '지방감', texture: '살 식감', clean: '비린 향이 적은 정도', flavorStrength: '풍미',
  brothContribution: '국물 맛', moistureRetention: '촉촉함', sweetness: '단맛', freshness: '신선도' };
const VARIANT_KIND_KO = { fish: '생선', squid: '오징어류', eel: '장어류', shellfish: '조개' };
const nameRuleOf = (r) => {
  if (!core.isVariantRecipe?.(r.id)) return r.id === 'porridge_abalone' ? { fixed: true } : null;
  const cands = core.dishVariantCandidates(r.id);
  const pick = [...NAME_EXAMPLE_SPECIES.filter((s) => cands.includes(s)), ...cands].filter((s, i, a) => a.indexOf(s) === i).slice(0, 4);
  const w = core.TUNING?.cook?.variantEffect?.[r.id]?.weights ?? (r.family === 'stew_red' ? { fatness: 1 } : {});
  return {
    fixed: false,
    kind: VARIANT_KIND_KO[core.dishVariantKind?.(r.id)] ?? '주재료',
    examples: pick.map((s) => core.dishDiscoveryName(core.dishDiscoveryId(r.id, s))),
    candidates: cands.length,
    drivers: Object.entries(w).sort((a, b) => b[1] - a[1]).map(([k]) => EFFECT_DRIVER_KO[k] ?? k),
  };
};

const recipes = core.FIRE_RECIPES.map((r) => {
  const lore = core.RECIPE_LORE?.[r.id] ?? {};
  const eff = core.recipeEffectOf?.(r.id) ?? null;
  const v = variantRows(r);
  return {
    id: r.id, name: r.nameKo, nameEn: r.nameEn,
    family: r.family, familyLabel: core.RECIPE_FAMILY_KO?.[r.family] ?? r.family,
    desc: r.descKo,
    shortDesc: lore.shortDescriptionKo ?? '',
    cookingTip: lore.cookingTipKo ?? '', ingredientTip: lore.ingredientTipKo ?? '',
    img: (r.photoKey ? imgOf(r.photoKey) : null) ?? imgOf(`px:it_dish_${r.family}`),
    cookware: r.cookware.map((k) => COOKWARE_KO[k] ?? k),
    cookMin: r.cookMin, servings: r.servings,
    doneWhen: DONE_KO[r.doneWhen] ?? r.doneWhen,
    tempBand: r.tempBand, servingC: r.servingC, coolTauMin: r.coolTauMin,
    targetSaltPct: r.targetSaltPct, targetSugarSpoons: r.targetSugarSpoons,
    maxExtraKinds: r.maxExtraKinds,
    baseValue: r.baseValueKrw,
    vitals: { hunger: r.vitals.hungerRestore, hydration: r.vitals.hydrationRestore },
    effect: eff ? { name: eff.nameKo, desc: eff.descKo, kind: core.FOOD_EFFECT_KIND_KO?.[eff.kind] ?? eff.kind } : null,
    required: r.required.map(reqLine),
    optional: r.optional.map(reqLine),
    stages: r.stages.map((s, i) => ({ no: i + 1, label: s.labelKo })),
    stars: starRows(r),
    variants: v.rows, variantCandidates: v.candidates,
    nameRule: nameRuleOf(r),
    refWeightG: REF_WEIGHT_G,
  };
});

const ingredients = core.COOK_INGREDIENTS.map((i) => ({
  id: i.id, name: i.nameKo, unit: UNIT_KO[i.unit] ?? i.unit,
  kind: i.kind, kindLabel: ROLE_KO[i.kind] ?? i.kind,
  massG: i.massGPerUnit, saltG: i.saltGPerUnit, sugarG: i.sugarGPerUnit,
  cookMinC: i.cookMinC, burnC: i.burnC,
  usedIn: core.FIRE_RECIPES.filter((r) => [...r.required, ...r.optional]
    .some((q) => (Array.isArray(q.ing) ? q.ing : [q.ing]).includes(i.id))).map((r) => r.nameKo),
}));

// ─────────────────────────────────────────────
// 어종·수산생물 — 어류/패류/갑각류/두족류/기타 5분류
// ─────────────────────────────────────────────
const SPECIES_GROUPS = [
  { id: 'fish', label: '어류', desc: '지느러미와 아가미로 헤엄치는 척추동물. 낚시로 낚는 대부분이 여기에 든다.' },
  { id: 'cephalopod', label: '두족류', desc: '연체동물 두족강 — 오징어·갑오징어·문어. 에기·문어 걸이로 노린다.' },
  { id: 'shellfish', label: '패류', desc: '조개와 고둥. 갯벌·갯바위에서 손으로 캐거나 떼어낸다.' },
  { id: 'crustacean', label: '갑각류', desc: '게·새우·거북손 등 단단한 껍데기를 가진 절지동물. 통발과 맨손 채집 대상.' },
  { id: 'other', label: '기타 수산동물류', desc: '극피동물(성게·해삼·불가사리)과 자포동물(해파리). 앞으로 피낭동물·연체동물로 더 나눈다.' },
];
const SHORE_GROUP = {
  bivalve: ['shellfish', '이매패류'], gastropod: ['shellfish', '복족류'],
  crustacean: ['crustacean', '십각류'], shellfish: ['crustacean', '만각류'],
  cephalopod: ['cephalopod', '팔완·십완류'], echinoderm: ['other', '극피동물'],
  annelid: ['other', '갯지렁이류'],   // 224차
};
// 224차 — 사는 모양 → 잡는 법(채집 손놀림 놀이)
const BEHAVIOR_KO = {
  buried: '묻혀 산다 — 파기', attached: '바위에 붙어 산다 — 떼기', crevice: '바위 틈에 숨는다 — 당기기',
  crawler: '느리게 긴다 — 줍기', runner: '다가가면 달아난다 — 덮치기',
};
const CEPH_FISH = new Set(['squid', 'cuttlefish', 'swordtip_squid', 'octopus', 'giant_octopus']);
const RARITY_KO = { common: '흔함', uncommon: '드묾', rare: '귀함', epic: '진귀' };
const LAYER_KO = { surface: '표층', mid: '중층', bottom: '바닥층' };
const SPOT_KO = {
  rocky_shore: '갯바위', breakwater: '방파제', beach: '모래해변', tidal_flat: '갯벌',
  harbor: '항·내항', estuary: '기수역', boat_fishing: '선상', open_sea: '외양', reef: '수중여',
};
const MONTHS = (arr) => (arr?.length ? arr.slice().sort((a, b) => a - b).map((m) => `${m}월`).join('·') : '연중');

/** 카드 계약 — `img`는 대표 1장(목록 썸네일), `imgs`는 상세 시트에 나란히 싣는 전부 */
const pickImgs = (list) => ({ img: list[0]?.src ?? null, imgs: list });

/** 227차 — 금어기(날짜 구간 우선 · 없으면 달) + 금지체중. 오라클에 없는 어종은 빈 배열 */
const fishLegalTraits = (id) => {
  const o = core.ORACLE_FISH_DB.find((x) => x.speciesId === id);
  if (!o) return [];
  const closed = o.closedSeasons?.length ? core.formatSeasons(o.closedSeasons)
    : o.closedMonths?.length ? MONTHS(o.closedMonths) : '없음';
  const out = [['금어기', closed]];
  if (o.legalMinWeightG) out.push(['금지 체중', `${o.legalMinWeightG} g 미만 방류`]);
  return out;
};

// 246차 — 어종 「선호 미끼」(BaitCategory 키)를 사람 말로. 구 판은 sandworm · prawn 같은 키를 그대로 찍었다(R1).
const BAIT_CATEGORY_KO = {
  earthworm: '지렁이', sandworm: '갯지렁이', squid: '오징어 조각', mussel: '홍합', barnacle: '거북손', crab: '게',
  prawn: '새우', fish_strip: '생선 살점', artificial_lure: '루어', artificial_worm: '인조 웜', ground_bait: '집어제',
  dry_ground_bait: '건식 집어제', wet_ground_bait: '습식 집어제', krill_frozen: '냉동 크릴', boiled_barley: '보리 압맥',
  corn: '옥수수', live_fish: '살아 있는 작은 고기', chilled_fish_strip: '선어 조각', organic_liquid_attractant: '내장 액기스', bread: '빵',
};
const speciesList = [];
for (const f of core.FISH_DATABASE) {
  const group = CEPH_FISH.has(f.id) ? 'cephalopod' : 'fish';
  speciesList.push({
    id: f.id, group, subgroup: group === 'cephalopod' ? '팔완·십완류' : '경골어류',
    name: f.nameKo, nameEn: f.nameEn, scientific: f.scientificName,
    ...pickImgs(fishImgs(f.id)),
    desc: f.description ?? '',
    source: '낚시',
    valuePerKg: f.sashimiValuePerKg ?? 0,
    rarity: RARITY_KO[f.rarity] ?? f.rarity,
    traits: [
      ['평균 체장', `${f.avgSizeRangeCm[0]}~${f.avgSizeRangeCm[1]} cm (최대 ${f.maxRecordCm} cm)`],
      ['평균 체중', `${f.avgWeightRangeG[0]}~${f.avgWeightRangeG[1]} g`],
      ['서식 수심', `${f.preferredDepthM[0]}~${f.preferredDepthM[1]} m`],
      ['적수온', `${f.preferredTempC[0]}~${f.preferredTempC[1]} ℃`],
      ['수층', LAYER_KO[f.swimmingLayer] ?? f.swimmingLayer ?? '—'],
      ['서식 지형', (f.habitatSpotTypes ?? []).map((s) => SPOT_KO[s] ?? s).join('·') || '—'],
      ['제철', MONTHS(f.peakSeasonMonths)],
      ['주야', f.isNocturnal ? `야행성 (야간 입질 +${f.nightBiteBonus ?? 0}%)` : '주행성'],
      ['난이도', '★'.repeat(Math.max(1, f.difficulty ?? 1))],
      ['금지 체장', f.minLegalSizeCm ? `${f.minLegalSizeCm} cm 미만 방류` : '없음'],
      // 227차 — 금어기 · 금지체중은 스폰 오라클이 정본(날짜 구간이 있으면 그쪽)
      ...fishLegalTraits(f.id),
      ['선호 미끼', (f.preferredBaits ?? []).map((b) => BAIT_CATEGORY_KO[b] ?? b).join(', ') || '—'],
    ],
  });
}
const jejuRuleKo = (s) => {
  const r = core.resolveLegal(s, 'jeju');
  const parts = [];
  parts.push(r.closedSeasons.length ? `금어기 ${core.formatSeasons(r.closedSeasons)}` : '금어기 없음');
  if (r.minLegalSizeCm) parts.push(`${r.minLegalSizeCm} cm 미만 방류`);
  return parts.join(' · ');
};
for (const s of core.SHORE_CREATURE_DATABASE) {
  const [group, subgroup] = SHORE_GROUP[s.category] ?? ['other', s.category];
  // 170차 — 같은 생물이 어종 DB와 채집 DB에 둘 다 있으면(돌문어) **카드를 두 장 만들지 않는다**.
  //   학명으로 붙여 잡는 방법만 한 줄 덧붙인다 — 사용자 지적 "두족류 분류에서 '문어'는 없애고,
  //   해루질 가능한 문어는 돌문어야".
  const dup = speciesList.find((x) => x.scientific && x.scientific === s.scientificName);
  if (dup) {
    dup.source = `${dup.source} · 채집 (해루질)`;
    for (const t of [['채집 시간대', s.discoveryTime === 'night' ? '야간' : s.discoveryTime === 'day' ? '주간' : '주·야간'],
                     ['채집 허가', s.requiredLicense ?? '없음']]) {
      if (!dup.traits.some((x) => x[0] === t[0])) dup.traits.push(t);
    }
    continue;
  }
  speciesList.push({
    id: s.id, group, subgroup,
    name: s.nameKo, nameEn: s.nameEn, scientific: s.scientificName,
    ...pickImgs(imgOf(`forage_${s.id}`) ? [{ src: imgOf(`forage_${s.id}`), label: '' }] : []),
    desc: s.description ?? '',
    source: '채집 (해루질)',
    valuePerKg: s.marketValuePerKg ?? 0,
    rarity: '—',
    traits: [
      ['서식', s.habitatDesc ?? '—'],
      ['서식 지형', (s.habitatSpotTypes ?? []).map((t) => SPOT_KO[t] ?? t).join('·') || '—'],
      ['채집 시간대', s.discoveryTime === 'night' ? '야간' : s.discoveryTime === 'day' ? '주간' : '주·야간'],
      ['조명 요건', s.minLampLumens ? `헤드랜턴 ${s.minLampLumens} lm 이상` : '불필요'],
      ['금지 체장', s.minLegalSizeCm ? `${s.minLegalSizeCm} cm 미만 방류` : '없음'],
      ['일일 채취 한도', s.dailyLimitG ? `${(s.dailyLimitG / 1000).toFixed(1)} kg` : '없음'],
      // 227차 — 날짜 단위 금어기(국가 기본) + 제주 별도 규정
      ['금어기', core.formatSeasons(core.resolveLegal(s).closedSeasons) || '없음'],
      ...(s.regional?.jeju ? [['제주 규정', jejuRuleKo(s)]] : []),
      ['필요 허가', s.requiredLicense ?? '없음'],
      ['미끼 활용', s.canBeUsedAsBait ? '가능' : '불가'],
      ['사는 모양', BEHAVIOR_KO[core.forageBehaviorOf(s)] ?? '—'],
      ['들어가는 곳', (s.spotKinds ?? []).includes('shallows') ? ((s.spotKinds ?? []).length === 1 ? '얕은 물(장화)만' : '뭍 · 얕은 물(장화)') : '뭍(갯바위 · 안벽)'],
      ['동해(속초)', (s.eastSeaWeight ?? 1) <= 0 ? '살지 않는다' : (s.eastSeaWeight ?? 1) < 0.5 ? '드물다' : '있다'],
      ['여름잠 · 안 보이는 달', s.absentMonths?.length ? MONTHS(s.absentMonths) : '없음'],
    ],
  });
}
for (const n of core.MARINE_NUISANCES) {
  speciesList.push({
    id: n.id, group: 'other', subgroup: n.kind === 'jellyfish' ? '자포동물' : '극피동물',
    name: n.nameKo, nameEn: n.nameEn, scientific: n.scientificName,
    ...pickImgs(imgOf(`nuisance_${n.id}`) ? [{ src: imgOf(`nuisance_${n.id}`), label: '' }] : []),
    desc: n.descKo ?? '',
    source: '과증식 구제',
    valuePerKg: n.cullPricePerKg ?? 0, rarity: '—',
    traits: [
      ['서식', n.habitatKo ?? '—'],
      ['크기', `${n.sizeRangeCm[0]}~${n.sizeRangeCm[1]} cm · ${n.weightRangeKg[0]}~${n.weightRangeKg[1]} kg`],
      ['과증식 시기', `${MONTHS(n.bloomMonths)} (최성기 ${MONTHS(n.peakMonths)})`],
      ['구별점', (n.markKo ?? '—').replace(/\*\*/g, '')],
      ['피해', n.damageKo ?? '—'],
      ['수거 방식', n.harvest === 'snag' ? '훌치기' : '맨손 채집'],
      ['독성', n.venom >= 3 ? '강함 — 접촉 금지' : n.venom >= 2 ? '있음' : '약함'],
      ['식용', n.edible ? '가능' : '불가 (구제 수매만)'],
    ],
  });
}

// ─────────────────────────────────────────────
// 아이템 — 대분류 × 소분류
// ─────────────────────────────────────────────
const ITEM_CATEGORY_KO = {
  gear: '장비', tackle: '낚시용품', lure: '루어', consumable: '소모품',
  food: '음식', etc: '기타', quest: '할 일 물품',
};
/**
 * 255차 — 아이템을 쓰임새 「선반」 탭으로 나눈다. 사용자 「다 섞여 있어서 헷갈려 … 아이템 '전체'에 포함시킨 후 '기타'로
 *  구분하지 말고, 별도의 탭으로 관리」. 대분류(category)는 게임 가방 분류라 그대로 두고 위키에서만 다시 묶는다.
 *  농산물 · 씨앗 · 모종 · 농사 도구는 「농사」 탭(`farm`)으로 간다. 규칙에 안 걸리는 물건은 「생활 · 도구 › 그 밖의 물건」 + 경고.
 */
const ITEM_SHELVES = [
  { id: 'gear', label: '낚시 장비', note: '낚싯대 · 릴 · 옷 · 가방부터 줄 · 채비 · 미끼 · 루어 · 통발까지, 바다에 들고 나가는 물건입니다.', groups: [
    { id: 'rod', label: '낚싯대 · 릴 · 손도구', test: (c, s) => c === 'gear' && ['손도구', '릴'].includes(s) },
    { id: 'wear', label: '옷 · 가방', test: (c) => c === 'gear' },
    { id: 'line', label: '줄', test: (c, s) => c === 'tackle' && /스풀/.test(s) },
    { id: 'rig', label: '채비 · 바늘', test: (c, s) => c === 'tackle' && ['채비 부속', '바늘/훅'].includes(s) },
    { id: 'bait', label: '미끼 · 밑밥', test: (c, s) => (c === 'tackle' && /미끼/.test(s)) || (c === 'consumable' && s === '집어제/밑밥') },
    { id: 'lure', label: '루어', test: (c, s) => c === 'lure' || (c === 'tackle' && s === '루어') },
    { id: 'trap', label: '통발 · 해루질 · 받침', test: (c, s) => c === 'etc' && ['통발', '해루질 도구', '낚시도구'].includes(s) },
    { id: 'care', label: '장비 관리 · 보냉', test: (c, s) => c === 'consumable' && ['스프레이/오일', '장비 수리', '보냉'].includes(s) },
  ] },
  { id: 'food', label: '먹을거리', note: '상점에서 사는 식자재 · 양념 · 파는 음식과 잡은 고기입니다. 텃밭에서 거둔 농산물은 「농사」 탭에 있습니다.', groups: [
    { id: 'ing', label: '식자재', test: (c, s) => c === 'food' && s === '식자재' },
    { id: 'season', label: '양념', test: (c, s) => c === 'consumable' && ['양념', '조미/손질'].includes(s) },
    { id: 'meal', label: '파는 음식', test: (c, s) => c === 'food' && ['가공품', '보양식'].includes(s) },
    { id: 'catch', label: '어획물 · 회', test: (c, s) => c === 'food' && ['어획물', '요리(회)'].includes(s) },
  ] },
  { id: 'life', label: '생활 · 도구', note: '부엌 살림 · 약 · 제작 재료 · 도면처럼 바다 밖 생활에 쓰는 물건입니다.', groups: [
    { id: 'cook', label: '조리도구 · 식기', test: (c, s) => (c === 'etc' && ['조리도구', '식기', '화구'].includes(s)) || (c === 'consumable' && s === '연료') },
    { id: 'aid', label: '약 · 구급품', test: (c, s) => c === 'consumable' && ['의약품', '구급품', '야간 대비'].includes(s) },
    { id: 'craft', label: '재료 · 도면', test: (c, s) => c === 'etc' && ['재료', '도면'].includes(s) },
    { id: 'quest', label: '할 일 물품', test: (c) => c === 'quest' },
    { id: 'misc', label: '그 밖의 물건', test: () => true },
  ] },
  { id: 'home', label: '설치 · 가구', note: '마당 · 집 안에 내려놓아 쓰는 물건입니다. 가구는 집으로 배달되어 「넣어 둔 가구」 칸에 들어갑니다.', groups: [
    { id: 'place', label: '설치하는 것', test: (c, s) => c === 'etc' && s === '설치형' },
    { id: 'furn', label: '가구', test: (c, s) => c === 'etc' && s === '가구' },
  ] },
];
const FARM_SUBS = { '농산물': 'produce', '농산물 조각': 'produce', '밭 부산물': 'produce', '씨앗 · 모종': 'start', '농사 도구': 'tool' };   // 284차 — 밭 부산물(깻대 · 깻묵 …)도 농산물 갈래(하위 「밭 부산물」)
/** 아이템 → [선반, 선반 안 갈래] */
function itemShelf(it) {
  const c = it.category, s = it.subCategory || '기타';
  if (FARM_SUBS[s]) return ['farm', FARM_SUBS[s]];
  if (it.id.startsWith('farm_')) return ['farm', 'tool'];
  for (const sh of ITEM_SHELVES) {
    if (sh.id === 'life') continue;          // 「그 밖의 물건」이 모두 받으므로 맨 끝에 본다
    const g = sh.groups.find((x) => x.test(c, s));
    if (g) return [sh.id, g.id];
  }
  const life = ITEM_SHELVES.find((x) => x.id === 'life');
  const g = life.groups.find((x) => x.test(c, s));
  if (g.id === 'misc' && !['증서', '잡동사니', '탈것'].includes(s)) console.warn(`[위키] 선반 규칙에 없는 아이템 — 그 밖의 물건으로: ${it.id} (${c} · ${s})`);
  return ['life', g.id];
}
const items = itemCatalog.map((it) => ({
  id: it.id, name: it.name,
  group: it.category, groupLabel: ITEM_CATEGORY_KO[it.category] ?? it.category,
  shelf: itemShelf(it)[0], shelfGroup: itemShelf(it)[1],
  sub: it.subCategory || '기타',
  price: it.basePrice ?? 0,
  desc: it.desc ?? '',
  soldAt: it.soldAt ?? [],
  pack: it.pack ?? null,   // 272차 — 묶음 판매: { qty, price }(basePrice는 한 개 값)
  seed: !!it.isSeed,
  img: imgOf(it.imgKey) ?? imgOf(it.iconTexture),   // 255차 — 게임과 같은 그림 고르기(`dump_wiki_items.mjs` imgKey)
  spec: itemSpec(it.tpl ?? {}, it),
}));
// 282차 — 그림 없는 아이템 경고. 그림 목록(manifest)이 새로 쓰이며 작물 키가 빠져 채소 323개가 그림 없이 나간 적이 있다(272 ~ 282).
{
  const bare = items.filter((x) => !x.img);
  if (bare.length) {
    const by = {};
    for (const x of bare) by[x.groupLabel] = (by[x.groupLabel] ?? 0) + 1;
    console.warn(`[위키] 그림 없는 아이템 ${bare.length}개 — ${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(' · ')} (예: ${bare.slice(0, 5).map((x) => x.id).join(', ')})`);
    if (bare.some((x) => x.id.startsWith('crop_'))) console.warn('[위키] ⚠ 작물 그림이 빠졌다 — `node tools/wiki_crop_img.cjs`를 먼저 돌린다');
  }
}

/** 템플릿에 실린 제원을 사람이 읽는 줄로 (없는 필드는 싣지 않는다) */
function itemSpec(t, it = {}) {
  const out = [];
  const push = (k, v) => { if (v !== undefined && v !== null && v !== '') out.push([k, String(v)]); };
  // 209차 — 낚싯대 · 릴 제원(core 제원표 · id 조회 → 이름 추정)
  if (t.tool === 'rod') {
    const sp = core.rodSpecFor(it.id ?? '', it.name ?? '', it.basePrice ?? 12000);
    push('용도', core.ROD_USE_LABEL[sp.use].ko);
    push('길이', `${sp.lengthM.toFixed(2)} m · ${sp.pieces}절${sp.telescopic ? ' 뽑기식' : ' 꽂기식'}`);
    push('호수 · 파워', sp.grade);
    push('적합 원줄', `${sp.lineBasis === 'pe' ? 'PE ' : ''}${sp.lineNo[0]}~${sp.lineNo[1]} 호`);
    push('적합 채비 무게', `${sp.loadG[0]}~${sp.loadG[1]} g`);
    push('견디는 하중', `${sp.powerKg} kg`);
    push('릴', sp.reel === 'bait' ? '베이트릴' : '스피닝릴');
  }
  if (it.subCategory === '릴') {
    const rs = core.reelSpecFor(it.id ?? '', it.name ?? '');
    push('종류', rs.kind === 'bait' ? `베이트릴 ${rs.size}` : `스피닝릴 ${rs.size}번`);
    push('최대 드랙', `${rs.maxDragKg} kg`);
    push('기어비', `${rs.gearRatio} : 1`);
    push('한 바퀴 감기', `${Math.round(core.reelCmPerTurn(rs))} cm`);
  }
  push('착용 부위', t.equipSlot);
  push('손 도구', t.tool === 'rod' ? '낚싯대' : t.tool === 'net' ? '뜰채' : t.tool === 'knife' ? '회칼' : undefined);
  push('원줄 재질', { nylon: '나일론', fluorocarbon: '카본', pe_braid: 'PE 합사', monofilament: '모노필라멘트' }[t.lineMaterial]);
  push('호수', t.lineNo ? `${t.lineNo} 호` : undefined);
  push('줄 길이', t.lineLengthM ? `${t.lineLengthM} m` : undefined);
  push('직경', t.lineDiameterMm ? `${t.lineDiameterMm} mm` : undefined);
  push('강도', t.lineStrengthLb ? `${t.lineStrengthLb} lb` : undefined);
  push('찌 부력', t.floatBuoyG !== undefined ? `${t.floatBuoyG > 0 ? '+' : ''}${t.floatBuoyG} g 상당` : undefined);
  push('봉돌 무게', t.sinkerWeightG ? `${t.sinkerWeightG} g` : undefined);
  push('밑밥 종류', { powder: '파우더', krill: '크릴', grain: '곡물' }[t.chumKind]);
  push('가방 확장', t.bagSlots ? `+${t.bagSlots} 칸` : undefined);
  push('설치물', t.placeKey ? '설치 가능' : undefined);
  push('신선도', { live: '활어', fresh: '신선', frozen: '냉동', chilled: '냉장' }[t.condition]);
  push('귀속', t.bound ? '판매·양도 불가' : undefined);
  return out;
}

// ─────────────────────────────────────────────
// 규칙 — 채비·미끼·무리 걸림 (192~195차). 숫자는 전부 core 상수에서 읽는다.
//   hidden = 게임 화면에는 드러나지 않는 규칙(「모르게」) — 위키에서만 확인한다.
// ─────────────────────────────────────────────
const pct = (x) => `${+(x * 100).toFixed(2)}%`;
const fishKo = (id) => core.getFishById?.(id)?.nameKo
  ?? core.ORACLE_FISH_DB.find((s) => s.speciesId === id)?.nameKo ?? id;
// 미끼 종류 이름(표시용 라벨 — 수치 아님)
const BAIT_KO = {
  worm_king: '혼무시·참갯지렁이', worm_blue: '청갯지렁이', krill: '크릴', fishcut: '생선·오징어살',
  bread: '빵·떡밥', corn: '옥수수', crab: '게·소라', urchin: '성게', shellfish: '조개·개불',
  livefish: '살아 있는 작은 고기', lure: '루어', slater: '갯강구', earthworm: '땅지렁이',
};
const monthsKo = (ms) => (ms?.length ? ms.join('·') + '월' : '—');
const bestBaitOf = (id) => {
  const pref = core.ORACLE_FISH_DB.find((s) => s.speciesId === id)?.baitPreference ?? {};
  const top = Object.entries(pref).sort((a, b) => b[1] - a[1])[0];
  return top ? (BAIT_KO[top[0]] ?? top[0]) : '—';
};
const dbl = core.SKILL_DATABASE.find((k) => k.id === 'fish_double_bait');
const rules = [
  {
    id: 'rig_tree', round: 192, hidden: false, title: '채비 모딩 트리',
    lede: '원줄 한 칸에서 시작해, 고른 부품에 따라 오른쪽으로 다음 칸이 열린다. 앞 칸을 바꾸면 그 뒤에 달렸던 칸은 전부 풀린다.',
    rows: [
      ['매듭', '직결 / 도래 중 하나'],
      ['부력찌', '찌 세트를 고른 경우에만 필수 — 원투·구멍치기는 찌 없이 완성'],
      ...core.KIT_ORDER.map((k) => {
        const d = core.KIT_DEFS[k];
        const rec = d.recommendedBaits?.length ? ` · 권장 미끼: ${d.recommendedBaits.map((b) => BAIT_KO[b] ?? b).join(', ')}` : '';
        return [d.label, d.desc + rec];
      }),
      ['카드 채비', `열기 카드 채비(빨간 깃 · 미끼를 끼운다 · 가지 간격 0.3m) / 전갱이 카드 채비(녹색 반짝이 깃 · 미끼 없이도 · 간격 0.5m) — 각 ${core.CARD_HOOKS_MIN}~${core.CARD_HOOKS_MAX}단 · 대상 어종 가중 +${pct(core.CARD_TARGET_BIAS)}`],
      ['비권장 미끼', `세트가 정한 권장 미끼가 아니면 대상어종 확률 ${Math.round(core.OFF_RECOMMENDED_BIAS * 100)}% (「권장되는 채비 유형이 아닙니다」)`],
    ],
  },
  {
    id: 'multi_bait', round: 193, hidden: false, title: '미끼 여러 개',
    lede: '바늘마다 다른 미끼를 끼울 수 있다. 미끼가 하나라도 있으면 채비가 완성되고, 고정한 뒤에도 미끼 칸만은 바꿀 수 있다.',
    rows: [
      ['추가 바늘', `미끼 단 바늘이 하나 늘 때마다 입질 +${pct(core.MULTI_BAIT_BONUS)}`],
      ['같은 미끼 연속', `이웃한 바늘에 같은 미끼가 이어지면 +${pct(core.SAME_BAIT_SYNERGY)} (한 번만)`],
      ['카드 채비 상한', `미끼로 오르는 몫 합계 최대 +${pct(core.CARD_RIG_BITE_BONUS_MAX)}`],
      ['소모', '입질이 오면 문 바늘의 미끼만 줄어든다 — 남은 미끼가 있으면 그 바늘에 다시 꿰어져 있다'],
    ],
  },
  {
    id: 'double_bait', round: 194, hidden: false, title: dbl ? `스킬 「${dbl.nameKo}」` : '한 바늘에 두 미끼',
    lede: dbl?.descKo ?? '',
    rows: [
      ['효과', `켠 바늘마다 입질 +${pct(core.DOUBLE_BAIT_BONUS)} · 합계 최대 +${pct(core.DOUBLE_BAIT_MAX)}`],
      ['비용', `스킬 포인트 ${dbl?.costPerRank ?? 1} · 던질 때마다 그 바늘 미끼 2개 소모`],
      ['예', '같은 미끼 세 바늘 + 전부 두 미끼 = 미끼 수 +4% · 연속 +1% · 두 미끼 +2% = +7%'],
    ],
  },
  {
    id: 'flasher', round: 193, hidden: false, title: '전갱이 카드 채비 — 미끼 없이',
    lede: '녹색 반짝이 깃이 달린 전갱이 카드 채비는 미끼가 없어도 고정·캐스팅된다.',
    rows: [
      ['대상', `${fishKo(core.FLASHER_TARGET_SPECIES)}만`],
      ['입질', `미끼를 끼웠을 때의 ${pct(core.FLASHER_ONLY_BITE_MULT)}`],
    ],
  },
  {
    id: 'school', round: 195, hidden: true, title: '무리 걸림 — 한 번에 두세 마리',
    lede: '떼로 다니는 어종이 제철이고 입질 확률이 높을 때, 한 번의 입질에 여러 바늘이 함께 물린다. 몇 마리인지는 물 밖으로 올리기 전까지 보이지 않는다.',
    rows: [
      ...core.SCHOOL_HOOKUP_SPECIES.map((id) => [fishKo(id),
        `제철 ${monthsKo(core.getFishById?.(id)?.peakSeasonMonths)} · 가장 잘 무는 미끼: ${bestBaitOf(id)}`]),
      ['입질 확률 조건', `그 어종의 입질 확률 ${pct(core.SCHOOL_MIN_BITE_CHANCE)} 이상 — 지금 수심층·지형·미끼·물때·낮밤이 그 어종이 가장 잘 무는 조건에 얼마나 가까운가`],
      ['두 마리', `${pct(core.SCHOOL_DOUBLE_CHANCE)} — 미끼 단 바늘 2개 이상`],
      ['세 마리', `${pct(core.SCHOOL_TRIPLE_CHANCE)} — 미끼 단 바늘 3개 이상 (전갱이는 반짝이 빈 바늘도 센다)`],
      ['파이트', `두 마리 ×${core.SCHOOL_FIGHT_MULT[2]} · 세 마리 ×${core.SCHOOL_FIGHT_MULT[3]} (힘·무게·체력) — 화면 표시 없음, 손맛으로만`],
      ['채비', `루어(하드·소프트) ×${core.SCHOOL_KIT_MULT.lure_hard} — 걸리지 않음 · 타이라바(바늘 2개) ×${core.SCHOOL_KIT_MULT.tairaba} — 두 마리 ${pct((core.SCHOOL_DOUBLE_CHANCE + core.SCHOOL_TRIPLE_CHANCE) * core.SCHOOL_KIT_MULT.tairaba)}·세 마리 없음 · 그 밖 ×1`],
      ['낚은 뒤', '결정 창 물고기 옆에 노란 x2 / x3 · 보관·방생은 함께 올라온 전부에 한 번에 · 쿨러 자리가 모자라면 「쿨러 정리」 창'],
    ],
  },
  {
    id: 'landing_drop', round: 196, hidden: true, title: '들어뽕 — 물 밖으로 올리다 바늘이 빠진다',
    lede: '파이트를 이겨 고기를 띄워도, 물 밖으로 들어 올리는 순간 바늘이 빠질 수 있다. 낚시 성공 창 위에 「바늘이 빠져버렸습니다!」 알림이 한 장 더 뜬다. 빠진 고기는 기록에 남지 않는다.',
    rows: [
      ['기준(발판 2m 이하 · 40cm 미만)', `한 마리 ${pct(core.LANDING_DROP_BASE[1])} · 두 마리 중 하나 ${pct(core.LANDING_DROP_BASE[2])} · 세 마리 중 하나 ${pct(core.LANDING_DROP_BASE[3])}`],
      ['입이 약한 어종', Object.entries(core.WEAK_MOUTH_ADD).map(([id, v]) => `${fishKo(id)} +${pct(v)}p`).join(' · ') + ' — 모든 경우'],
      ['최대 빠지는 수', '한 마리 — 둘 다·셋 중 둘은 없다'],
      ['발판 높이', Object.entries(core.FOOTING_LIFT_M).map(([k, m]) => `${core.FOOTING_LABEL[k]} ${m}m`).join(' · ') + ' (간조면 높아지고 만조면 낮아진다)'],
      ['높은 발판', `${core.LIFT_FREE_M}m를 넘는 1m마다 +${pct(core.LIFT_ADD_PER_M)}p × (1 + 무게kg, 최대 ${core.LIFT_WEIGHT_MULT_MAX}배)`],
      ['테트라포드', `블록에 부딪힌다 +${pct(core.TETRAPOD_ADD)}p (구멍치기 포함)`],
      ['해변', `들지 않고 끌어 올린다 — 기준값 ×${core.BEACH_MULT}`],
      ['큰 고기', `${core.BIG_FISH_CM}cm 이상 +${pct(core.BIG_FISH_ADD)}p, 넘는 1cm마다 +${pct(core.BIG_FISH_ADD_PER_CM)}p · 최대 +${pct(core.BIG_FISH_ADD_MAX)}p`],
      ['뜰채', `낚싯대 반대 손에 들면 0 — 자루가 발판 높이 + ${core.NET_DIP_MARGIN_M}m에 닿아야 한다(3m · 5m · 7m) · 테트라포드 구멍에서는 쓸 수 없다`],
      ['상한', pct(core.LANDING_DROP_MAX)],
      ['예', `방파제 상판에서 55cm 참돔(2.6kg)을 뜰채 없이 = ${pct(core.landingDropOdds({ footing: 'breakwater_top', netReachM: null, fish: [{ speciesId: 'red_seabream', lengthCm: 55, weightG: 2600 }] }).chance)} · 5m 뜰채 = 0%`],
    ],
  },
  {
    id: 'cooler_swap', round: 196, hidden: false, title: '쿨러 정리',
    lede: '쿨러가 차서 방금 낚은 고기가 다 들어가지 않으면 결정 창 대신 정리 창이 열린다.',
    rows: [
      ['방금 낚은 고기', '누르면 「놓아줌」으로 바뀐다'],
      ['쿨러 3x3', '쿨러에 있던 고기를 눌러 놓아주면 그만큼 자리가 생긴다'],
      ['정리하고 넣기', '고른 대로 바꿔 넣는다 — 넣을 고기 ≤ 빈 자리일 때만'],
      ['들어가는 만큼만 넣기', '빈 자리만큼 무거운 고기부터 넣고 나머지는 놓아준다'],
    ],
  },
  {
    id: 'market', round: 196, hidden: true, title: '시세 하락과 가게 수요',
    lede: '같은 가게에 같은 고기를 많이 팔면 값이 내려간다. 상점을 열면 인벤토리 어획물 칸 오른쪽 위에 그 가게의 화살표가 뜬다.',
    rows: [
      ['세는 것', '판 마릿수(잡은 수 아님) · 판매처(지점)마다 따로'],
      ['회복', `반감기 ${core.SAT_HALF_LIFE_MS / 3600000}시간 — 하루 뒤 1/16만 남는다(자정에 한꺼번에 풀리지 않는다)`],
      ['기준 마릿수', 'kg당 평년 단가 1.2만 원 이하 15마리 · 2.5만 원 미만 10마리 · 4만 원 미만 7마리 · 그 이상 5마리 — 기준 마릿수째부터 하락'],
      ['하락', `한 마리당 −${pct(core.SAT_STEP)} · 최대 −${pct(core.SAT_MAX_CUT)}`],
      ['완화', `활어 ×${core.SAT_LIVE_SOFTEN} · 대물(평균의 1.6배 이상) ×${core.SAT_BIG_SOFTEN} — 둘 다면 ×${core.SAT_LIVE_SOFTEN * core.SAT_BIG_SOFTEN}`],
      ['가게 수요', `지점·어종·날짜마다 찾음(20%) +${pct(core.BRANCH_PREF_PCT)} · 보통(60%) · 덜 찾음(20%) −${pct(core.BRANCH_PREF_PCT)}`],
      ['시세', `그날 경락가 ÷ 평년 단가 ≥ ${core.PRICE_HIGH} 높음 · ≤ ${core.PRICE_LOW} 낮음`],
      ['화살표', '수요(포화가 시작되면 한 단계 내림) + 시세 = +2 파랑 위 · +1 초록 오른쪽 위 · 0 노랑 가로줄 · −1 주황 오른쪽 아래 · −2 빨강 아래'],
      ['위판(경매)', '영향 없음 — 위판은 로트마다 중매인 호가로 값이 서고, 낚싯대 어획은 위판할 수 없다'],
    ],
  },
  {
    id: 'snag', round: 206, hidden: false, title: '밑걸림과 채비 손실',
    lede: '여 밭에서 채비를 세워 둔 채 견제하지 않으면 바닥에 걸린다. 걸리면 끌어당기거나 끊는다 — 무엇을 잃는지는 채비가 어디서 떨어져 나갔느냐로 정해진다.',
    rows: [
      ['언제 걸리나', '채비가 여 위를 끌려 움직일 때만 — 감아 올 때 · 물살에 흘릴 때 · 봉돌이 구를 때. 바닥에 멈춘 봉돌은 걸리지 않는다(207차)'],
      ['얼마나', `여 위를 1m 끌 때 ${(core.TUNING.snag.dragHazardPerM * 100).toFixed(0)}% 남짓 × 자리 · 강수 · 구멍치기 배율 — 여 7m를 끌고 오면 약 ${Math.round((1 - Math.exp(-core.TUNING.snag.dragHazardPerM * 7)) * 100)}%`],
      ['닿는 높이', `봉돌 ${core.TUNING.snag.sinkerReachM}m · 루어 ${core.TUNING.snag.lureReachM}m · 찌 목줄 ${core.TUNING.snag.floatReachBaseM}m + 물살 × ${core.TUNING.snag.floatReachFlowM}m(속조류에 날린다) — 이보다 높이 떠 있으면 걸리지 않는다`],
      ['봉돌이 구를 때', `물살 > ${core.TUNING.tidePhase.surfRollFlow} 이고 봉돌 < ${core.TUNING.tidePhase.surfSinkerMinG}g · 또는 파고 ≥ ${core.TUNING.snag.waveRollMinM}m 이고 봉돌 < 파고 × ${core.TUNING.snag.waveSinkerGPerM}g`],
      ['걸린 모습', '찌는 쑥 잠기지 않고 살짝 잠긴 채 거의 멈춘다(속조류에 들락날락) · 원투 · 루어는 초릿대가 휜 채 떨림이 없다 — 감거나 채면 대처 창'],
      ['끌어당기기', core.SNAG_PULL_UP.map((r) => `${r.labelKo.split(' — ')[0]} ${Math.round(r.p * 100)}%`).join(' · ')],
      ['끊기', core.SNAG_BREAK_OFF.map((r) => `${r.labelKo.split(' — ')[0]} ${Math.round(r.p * 100)}%`).join(' · ')],
      ['바늘과 미끼', '단품 바늘은 바늘 + 미끼(목줄 중간 봉돌 · 목줄 끝 도래는 남는다) · 타이라바는 바늘 둘 다 · 묶음추 · 카드 채비는 한 벌을 버린다(바늘이 고정) · 루어는 루어'],
      ['도래 아래', `도래(직결이면 매듭) 아래 전부 — 원줄에 꿴 유동 봉돌 · 찌는 남는다 · 목줄은 ${core.TUNING.snag.leaderCutM}m만 잘린다`],
      ['통째로', `찌 · 수중찌 · 유동 봉돌 · 도래부터 아래 전부 + 원줄 ${core.TUNING.snag.mainLineCutM}m`],
      ['줄 길이', '줄은 스풀째가 아니라 쓴 길이만큼 준다 — 다 쓰면 그 스풀이 사라진다(상세 보기에 남은 m)'],
      ['다시 채비', '가방에 같은 부품이 남아 있으면 그 칸은 그대로 끼워져 있다 — 다 떨어진 칸만 빈다'],
    ],
  },
  {
    id: 'bag_sort', round: 277, hidden: false, title: '가방 정리',
    lede: '가방 아래 재화 띠 오른쪽 「정리」를 누르면 지금 보는 탭의 물건이 비슷한 것끼리 모이고, 같은 무리 안에서는 이름 순으로 놓인다.',
    rows: [
      ['범위', '지금 탭만 · 칸에 있는 것만 — 착용한 장비 · 퀵슬롯 · 채비에 끼운 것은 그대로'],
      ['낚시용품', '채비를 위에서 아래로 매는 차례 — 원줄 → 목줄 → 찌 → 구슬 · 쿠션 → 봉돌(고리 · 구멍) → 좁쌀 → 묶음추 → 도래 → 바늘 · 카드 채비 → 지그헤드 · 웜 → 루어 → 타이라바 → 미끼(생 → 냉동 → 반죽 → 선어)'],
      ['장비', '손에 드는 것(낚싯대 → 릴 → 손도구) → 가방 → 머리부터 발끝까지 입는 차례'],
      ['그 밖의 탭', '자주 꺼내는 것 먼저 — 표에 없는 소분류는 뒤에 소분류 이름 순'],
      ['이름 순', '보이는 이름(영어 설정이면 영어) · 가나다 · 알파벳 · 숫자는 크기 순(2호 < 10호) · 이름이 같으면 신선한 것 → 많은 것'],
    ],
  },
  {
    id: 'road_spots', round: 277, hidden: false, title: '길가 가게 자리와 차',
    lede: '차는 사람을 모르고 지나간다. 그래서 가게 [F] 자리 · 바깥에 선 가게 사람 · 이야기 인물은 아스팔트 밖에 서고, 차는 서로의 앞길을 막지 않게 기다린다.',
    rows: [
      ['가게 [F] 자리', '문 앞이 차도면 4칸 안에서 차도 밖 칸을 찾는다(길 건너는 안 된다) — 보도 없이 차도에 붙은 건물은 차도 끝에 남을 수 있다'],
      ['가게 사람', '문 옆 · 반대쪽 · 조금 위 · 조금 멀리 중 차도 밖 — 다 차도면 세우지 않는다'],
      ['차와 주인공', '차가 지나갈 통로(앞 2칸 · 옆 1칸 안)에 들어서면 차가 선다 — 길가에 서 있으면 그냥 지나간다 · 부딪히면 체력 −20 · 그 차는 20초 선다'],
      ['차와 차', '다른 길의 차가 앞을 막으면 기다린다 · 사거리에서 서로 마주 보면 교차점에 가까운 차가 먼저 · 오래 막히면 그 차는 사라졌다 다른 곳에서 나온다'],
    ],
  },
  {
    id: 'pause_guide', round: 277, hidden: false, title: '일시정지 메뉴 · 안내 말풍선',
    lede: 'ESC는 열린 창부터 닫고, 그다음 일시정지 메뉴를 연다. 가게 · 직판장 · 마트 · 집 안에서도 밖으로 나가지 않는다 — 나가는 길은 문 매트다.',
    rows: [
      ['필드 · 가게 안', '계속하기 · 저장하기(집 침대에서만) · 환경설정 · 집으로 가기(홈타운 밖) · 타이틀 화면'],
      ['집 안', '계속하기 · 환경설정 · 타이틀 화면 — 저장은 침대'],
      ['안내 말풍선', '환경설정 「화면」 탭에서 켬 / 끔 — 창을 처음 열 때 · 물가에서 처음 캐스팅 · 구멍치기를 할 때 뜨는 말풍선과 프롤로그 코치'],
      ['끈 동안', '본 것으로 치지 않는다 — 다시 켜면 그 창을 다음에 열 때 안내가 처음부터 뜬다'],
    ],
  },
  {
    id: 'bait_box', round: 280, hidden: false, title: '미끼 갑 · 같은 물건 겹치기',
    lede: '생미끼는 갑으로, 곽크릴은 곽째 판다. 산 그대로 가방에 들어가고, 열어야 바늘에 꿴다. 같은 물건이 한 칸에 쌓일 때 신선도는 수량만큼 섞인다.',
    rows: [
      ['산 갑', '청갯지렁이 · 혼무시 1갑 · 곽크릴은 연 적 없는 그대로 가방에 들어간다 — 미끼 칸에 바로 꿰이지 않는다(불러온 세이브도 같다)'],
      ['여는 길', '가방에서 「열기」 · 「포장 뜯기」 · 또는 채비 창 미끼 칸에서 「… — 열어서 꿰기」 — 한 갑을 열어 한 마리를 바로 꿰고 나머지는 가방에 남는다'],
      ['갑 신선도', '산 때부터 시계가 간다 — 연 지렁이는 갑의 상태를 그대로 잇는다 · 상한 갑은 열어도 쓸 수 없다 · 언 곽크릴은 언 크릴이 나온다'],
      ['같은 물건 쌓기', '남은 시간을 수량으로 평균 낸 상태가 된다 — 새것을 한 마리 넣어도 상한 무더기가 새것이 되지 않고, 상한 것은 남은 시간 0으로 친다'],
      ['채비 칸 몫', '봉돌 · 바늘 · 미끼처럼 낱개로 꿰는 칸은 가진 수만큼만 — 쓰거나 팔아 모자라면 넘친 칸부터 빈다(원줄 · 목줄은 길이로 따로 센다)'],
      ['고장 난 대', '부러진 낚싯대는 손에서 내려와 빈 칸으로 — 가방이 차 있으면 잠긴 칸에 들어가 꺼낼 수 있다'],
      ['쿨러 · 바칸', '안에 담긴 것이 있으면 팔기 · 버리기 · 거래 · 집 보관이 막힌다 — 먼저 비운다'],
      ['사용하기', '먹거나 바르는 효과가 있는 것에만 뜬다 — 효과 없는 물건을 헛되이 쓰지 않는다'],
    ],
  },
  {
    id: 'byproduct_mill', round: 284, hidden: false, title: '부산물 · 낱알 무게 · 방앗간',
    lede: '거두거나 털 때 쓸모 있는 부산물이 함께 나온다. 털어 낸 깨 · 콩 · 보리는 g으로 세고, 가게에는 봉지에 담아 판다. 깨는 방앗간에 맡겨 참기름 · 들기름(180ml · 350ml) · 들깨가루 · 깨소금으로 바꾼다.',
    rows: [
      ['먹는 부산물', '무 → 무청 한 묶음(무 하나에 하나 — 데치면 시래기) · 김장배추 → 겉잎(우거지) · 토란 → 토란대 · 들깨 순지르기 → 깻순 — 모두 요리 재료이고 식자재마트 · 식당이 산다'],
      ['밭 부산물', '깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불(키질할 때만) · 폐배지(버섯 마지막 수확) · 깻묵 — g으로 세고 가게는 안 산다'],
      ['밭에 넣기', '「퇴비 넣기」가 밭 부산물을 먼저 쓴다 — 한 칸 분 = 깻대 · 콩대 · 보릿짚 · 폐배지 1kg · 옥수숫대 1.5kg · 검불 300g · 깻묵 200g · 보릿짚 500g은 짚 덮기에 볏짚 대신'],
      ['낱알 무게', '한 칸에서 들깨 80~120g · 참깨 40~60g · 콩 180~250g · 보리 400~500g — 가방 칸에 「480g」으로 보인다'],
      ['봉지', '「봉지 담기」 = 낱알 + 곡물 봉투 1장 — 참깨 300g · 500g · 들깨 · 콩 500g · 1kg · 보리 1kg · 낱알은 가게가 사지 않고 봉지는 제값'],
      ['방앗간', '속초 설악기름방앗간 압착기 [F] — 기름은 350ml 한 병에 참깨 850g · 들깨 950g(180ml는 440g · 490g) · 공임 1kg에 4,000원 + 병값 400 · 600원 · 기름 60분 · 갈기 · 볶기 20분 · 다 되기 전에는 무르기'],
      ['기름병', '「병 따기」로 1큰술씩(350ml = 23큰술 · 180ml = 12큰술) — 따지 않은 병은 식자재마트 · 식당이 산다 · 방앗간은 병을 팔지 않는다'],
      ['나물 볶음', '팬 · 나물 한두 묶음(시래기 · 우거지 · 고구마줄기 · 토란대 · 깻순) + 기름 · 다진마늘 · 간장 · 들깨가루 · 깨소금 — 생선조림 바닥에 시래기 · 우거지 · 고구마줄기를 깔 수도 있다'],
    ],
  },
  {
    id: 'journal_rail', round: 283, hidden: false, title: '일지 초상 · 목표 진행 레일',
    lede: '일지(J)의 의뢰인 칸과 상세 초상은 대화창 · 혼잣말과 같은 그림 얼굴이다. 이야기 탭의 목표 옆에는 지나온 칸을 잇는 진행 레일이 선다.',
    rows: [
      ['초상', '의뢰인이 있는 할 일은 그 사람의 그림 얼굴 · 스스로 정한 할 일(「막차」 등)은 주인공 얼굴(만든 생김새 그대로)'],
      ['진행 레일', '지나온 목표 = 청록 선과 점 · 지금 할 일 = 금빛 고리(천천히 빛남) + 은은한 금빛 줄 바탕'],
      ['앞일', '지금 할 일 아래로는 레일이 흐려지며 끝난다 — 아직 열리지 않은 목표는 보이지 않는다'],
    ],
  },
  {
    id: 'gear_instances', round: 282, hidden: false, title: '장비 · 루어는 한 개씩',
    lede: '낚싯대 · 릴 · 옷 같은 장비와 단단한 루어는 같은 것이라도 한 개에 한 칸이다. 고장 · 쓴 횟수 · 착용이 저마다 다르다. 미끼 · 봉돌 · 바늘 · 찌 · 줄 · 웜은 한 칸에 수량으로 쌓인다.',
    rows: [
      ['한 개씩', '낚싯대 · 릴 · 뜰채 · 칼 · 물뿌리개 · 모자 · 옷 · 신발 · 장갑 · 안경 · 시계 · 가방 · 미노우 · 스푼 · 스피너 · 에기 · 메탈지그 · 타이라바'],
      ['묶음', '미끼 · 봉돌 · 바늘 · 찌 · 원줄 · 목줄 · 웜(소프트 루어) · 지그헤드 · 먹을 것 · 재료'],
      ['고장', '같은 대 둘 중 하나가 부러져도 다른 하나는 멀쩡하다 — 고장 난 중고 대를 사도 새 대와 섞이지 않는다'],
      ['착용', '모자를 쓴 채 같은 모자를 하나 더 사면 가방 칸에 따로 보인다'],
      ['칸', '같은 대 3개를 사려면 빈 칸 3개 — 모자라면 하나도 사지 않고 값도 그대로다'],
      ['채비 창', '같은 루어는 「클래식 스푼 14g (x2)」 · 「… — 부분 파손 (x1)」처럼 상태별로 한 줄 — 고르면 덜 쓴 것부터 끼운다'],
      ['예전 세이브', '불러오면 「같은 장비 n개」 칸이 n칸으로 나뉜다 — 첫 칸이 쓰던 상태(착용 · 고장 · 쓴 횟수)를 잇고 나머지는 새것 · 자리가 없으면 잠긴 칸'],
      ['거래', '받은 장비 · 루어는 내 가방 번호로 새로 붙는다 — 한 줄에 한 개'],
    ],
  },
  {
    id: 'line_wear', round: 273, hidden: false, title: '원줄 · 목줄 내구도',
    lede: '줄은 터질 때만 잃는 것이 아니라 쓸수록 약해진다. 지금 묶여 있는 한 가닥의 마모가 0에서 1까지 쌓이고, 매듭 위 몇 미터를 잘라 내고 다시 묶으면 새 줄이 된다.',
    rows: [
      ['무엇이 닳나', '스풀이 아니라 지금 채비 칸에 묶인 원줄 · 목줄 한 가닥 — 스풀을 바꾸거나 터져서 잘리면 0(새로 묶은 줄)'],
      ['세기', `호수 환산 세기 × (1 − 마모 × ${core.TUNING.lineWear.strengthLossAtWorn}) — 다 쓸린 줄은 절반 · 나일론은 물을 먹어 −${pct(core.TUNING.lineWear.nylonWetLoss)}`],
      ['파이팅 피로', `그 줄의 장력비가 ${core.TUNING.lineWear.fatigueThreshold}를 넘는 동안 (초과분)² × ${core.TUNING.lineWear.fatigueK}/초 × 재질 — 한계 근처(0.9)에서 1분 버티면 나일론 목줄 약 ${(0.16 * core.TUNING.lineWear.fatigueK * 1.1 * 60).toFixed(2)}`],
      ['랜딩 충격', `무게 ÷ 그 줄의 세기 × ${core.TUNING.lineWear.shockK} × 재질 — 목줄 ×${core.TUNING.lineWear.landingLeaderMult}(고기 몸에 쓸린다) · 원줄 ×${core.TUNING.lineWear.landingMainMult}`],
      ['밑걸림 끌어냄', `채비를 건지면 목줄 ${core.TUNING.lineWear.snagPullLeader} · 원줄 ${core.TUNING.lineWear.snagPullMain} × 재질 쓸림 — 잘려 나간 줄은 새 줄`],
      ['캐스팅', `던질 때마다 ${core.TUNING.lineWear.castK} × 재질(합사 ${core.LINE_MATERIAL_TRAITS.pe_braid.cast} · 나일론 · 카본 ${core.LINE_MATERIAL_TRAITS.nylon.cast}) · 목줄은 1/3 — 합사 원줄 100번 = ${(core.TUNING.lineWear.castK * core.LINE_MATERIAL_TRAITS.pe_braid.cast * 100).toFixed(2)}`],
      ['바닥 끌림', `여 위를 1m 끌릴 때 ${core.TUNING.lineWear.dragPerM} × 바닥 근접도(밑걸림과 같은 값) × 재질 쓸림 — 목줄 · 원줄은 ${core.TUNING.lineWear.dragMainFrac}`],
      ['세기 = 호수', `나일론 · 카본 1호 ≈ ${core.MONO_LINE_KG_PER_HO}kg(${core.lineLbFromHo(1, false)}lb) · 합사 1호 ≈ ${core.PE_LINE_KG_PER_HO}kg(${core.lineLbFromHo(1, true)}lb) — 상세 창 · 판정 · 상점 설명이 한 표(281)`],
      ['재질', ['nylon', 'fluorocarbon', 'pe_braid'].map((k) => `${core.LINE_MATERIAL_TRAITS[k].labelKo} — ${core.LINE_MATERIAL_TRAITS[k].traitKo}`).join(' / ')],
      ['단계', `새 줄(< ${core.TUNING.lineWear.stageLight}) · 쓸림 조금 · 쓸림 심함(≥ ${core.TUNING.lineWear.stageHeavy} — 채비 창 칸 배지 「심함」 · 1인칭 알림) · 끊어지기 직전(≥ ${core.TUNING.lineWear.stageCritical} — 배지 「위험」 · 던질 때마다 알림)`],
      ['다시 매기', `채비 창에서 원줄 · 목줄 칸 → 「줄 끝을 잘라 다시 매기」 — 목줄 ${core.TUNING.lineWear.retieLeaderM}m · 원줄 ${core.TUNING.lineWear.retieMainM}m를 스풀에서 잘라 내고 마모 0 · 채비 고정 중에도 된다`],
    ],
  },
  {
    id: 'rod_holder', round: 207, hidden: false, title: '원투 거치대',
    lede: '원투 봉돌이 바닥에 닿으면 낚싯대를 거치대에 걸어 두고 자리를 떠날 수 있다. 입질은 탑다운에서 초릿대 끝과 「!」로 본다.',
    rows: [
      ['사는 곳', '낚시점 「원투 거치대 (삼발이)」'],
      ['거치', '1인칭에서 봉돌이 바닥에 안착하면 [거치하기] — 서 있던 자리 앞에 거치대가 서고, 낚싯대 · 릴 · 끝채비가 가방에서 거치대로 옮겨진다'],
      ['몇 대', `가진 거치대 수만큼, 최대 ${core.TUNING.rodHolder.maxHolders}대 — 대마다 낚싯대와 릴이 한 벌씩 필요하다 · 2대부터 번호 표와 채널 [거치대 N]`],
      ['입질', `거치 순간 입질 확률 × ${core.TUNING.rodHolder.parkedBiteMult} · 초릿대가 까딱이고 「!」 · 지역 채널 한 줄 · ${core.TUNING.rodHolder.biteWindowSec}초 안에 [F]로 잡으면 1인칭에서 입질이 이어진다`],
      ['놓치면', `초릿대가 잠잠해진다 — ${Math.round(core.TUNING.rodHolder.missBaitLossChance * 100)}% 확률로 미끼를 따먹힌다`],
      ['밑걸림', '멈춘 봉돌은 걸리지 않는다 — 물살 · 파도가 봉돌을 굴려 여 위를 끌 때만 걸리고, 그러면 초릿대가 휜 채 멈춘다'],
      ['여럿이', '남이 걸어 둔 낚싯대는 보이기만 하고 잡을 수 없다'],
      ['파이팅 중', '한 대를 잡고 1인칭에 있는 동안에도 나머지 거치대는 계속 굴러간다 — 평면 판 위 칩(노랑 입질 · 빨강 걸림 · 주황 밑걸림 · 보라 엉킴)'],
      ['스스로 걸림', `놓친 입질은 원투대 ${Math.round(core.TUNING.rodHolder.selfHookSurf * 100)}% · 그 밖 ${Math.round(core.TUNING.rodHolder.selfHookOther * 100)}%(봉돌 60g 기준)로 고기가 스스로 걸린다 — 잡으면 바로 파이팅 · 평균 ${Math.round(1 / core.TUNING.rodHolder.hookedEscapePerSec)}초 뒤 빠진다`],
      ['엉킴', `파이팅 중 고기가 옆으로 ${core.TUNING.rodHolder.fightTangleLateralM}m 넘게 째면 초당 ${Math.round(core.TUNING.rodHolder.fightTanglePerSec * 100)}%로 옆 거치대 줄과 엉킨다 — 잡으면 목줄을 잘라 내고 감아 들인다`],
    ],
  },
  {
    id: 'rod_spec', round: 209, hidden: false, title: '낚싯대 · 릴 제원',
    lede: '낚싯대는 용도마다 길이 · 호수 · 받는 채비 무게 · 견디는 하중이 다르다. 채비 무게가 맞아야 멀리 나가고, 한참 무거우면 초릿대가 부러진다.',
    rows: [
      ['사는 곳', `수산물 직판장 — 낚싯대 ${core.ROD_SHOP.length}자루 · 릴 ${core.REEL_SHOP.length}개`],
      ['용도별 비거리', Object.entries(core.ROD_USE_CAST).map(([u, v]) => `${core.ROD_USE_LABEL[u].ko} ×${v.base}`).join(' · ')],
      ['길이', `그 용도의 표준 길이보다 1m 길 때마다 ×${(1 + core.TUNING.rodSpec.lengthCastK).toFixed(2)} (0.9~1.1)`],
      ['채비 무게', `적합 범위면 ×1 · 가벼우면 최소 ×${core.TUNING.rodSpec.underLoadFloor} · 무거우면 최소 ×${core.TUNING.rodSpec.overLoadFloor}`],
      ['초릿대 파손', `적합 상한 ×${core.TUNING.rodSpec.dangerRatio}를 넘는 채비를 파워 ${Math.round(core.TUNING.rodSpec.tipSnapPowerMin * 100)}% 이상으로 던지면 최대 ${Math.round(core.TUNING.rodSpec.tipSnapMax * 100)}% — 수리 가능`],
      ['릴', '베이트대 = 베이트릴 · 그 밖 = 스피닝릴(안 맞으면 던질 수 없다) · 원투 전용릴 롱캐스트 스풀 ×1.08'],
      ['하중', '대가 견디는 하중(kg)보다 1.5배 넘게 강한 줄이면 큰 고기를 걸었을 때 대가 먼저 부러질 수 있다 — 단 릴 드랙이 그보다 약하면 드랙이 먼저 미끄러져 대를 지킨다'],
      ['릴 드랙', `파이팅 드랙 = 줄 강도 × 85%(감는 중 97%)와 릴 최대 드랙 중 약한 쪽 — 릴이 약하면 줄은 안 터지지만 넘친 1kg마다 초당 ${core.TUNING.reelFight.slipMpsPerKg}m(최대 ${core.TUNING.reelFight.slipMaxMps}m) 줄이 나가고 감기는 최대 ${Math.round(core.TUNING.reelFight.slipReelCut * 100)}% 헛돈다`],
      ['기어비', `한 바퀴 감기 = 기어비 × 스풀 둘레(기준 ${core.TUNING.reelFight.refCmPerTurn}cm) — 많이 감길수록 빨리 끌어오지만 무거운 고기에는 감기 부하로 이득이 준다 · 큰 릴 · 베이트릴(×${core.TUNING.reelFight.baitWindMult})은 덜 힘들다`],
      ['구멍치기', `${core.TUNING.rodSpec.holeMaxLenM}m 넘는 대는 틈에서 들어 올리다 빠짐 ×${core.TUNING.rodSpec.holeLongSlipMult}`],
    ],
  },
  {
    id: 'snag_quest', round: 206, hidden: true, title: '처음 하는 의뢰는 덜 걸린다',
    lede: '낚아 오라는 의뢰를 처음 진행하는 동안에는 바닥에 덜 걸린다. 한 번 끝낸 의뢰를 다시 할 때는 원래대로다.',
    rows: [
      ['조건', '진행 중인 의뢰에 낚싯대로 잡기 · 놓아주기 목표가 남아 있고, 그 의뢰를 끝낸 적이 없을 때'],
      ['효과', `밑걸림 위험 ×${core.TUNING.snag.questFirstMult} — 보통 자리 평균 약 9초 → 약 30초`],
    ],
  },
];

// ─────────────────────────────────────────────
// 스킬 (197차 — 위키 「스킬」 탭). 아이콘 = SkillIconArt 16x16 → gen_wiki_images.py가 `sk:<id>`로 굽는다
// ─────────────────────────────────────────────
const PROF_ACTION_KO = {
  cast: '캐스팅', landing: '랜딩', fight: '파이트', lureAction: '루어 액션', jig: '지깅', egi: '에깅', surf: '원투',
  chum: '밑밥 투척', forage: '채집', trap: '통발', butcher: '손질', sashimi: '회 뜨기', cook: '요리', craft: '제작',
  ride: '자전거·운전', firstaid: '응급 처치', haggle: '흥정',
};
const skillName = (id) => core.getSkillById(id)?.nameKo ?? id;
const licenseName = (t) => core.getLicenseByType?.(t)?.nameKo ?? core.getLicenseByType?.(t)?.name ?? t;
const questTitle = (id) => core.getStoryQuest?.(id)?.titleKo ?? id;
const unlockKo = (u) => u.kind === 'level' ? `레벨 ${u.value} 이상`
  : u.kind === 'license' ? `자격 「${licenseName(u.value)}」 보유`
  : u.kind === 'categoryRanks' ? `${core.SKILL_CATEGORIES.find((c) => c.id === u.category)?.nameKo ?? u.category} 분야 누적 ${u.value}랭크`
  : u.kind === 'quest' ? `이야기 「${questTitle(u.value)}」 완료` : '';
const skillList = core.SKILL_DATABASE.map((d) => ({
  id: d.id, cat: d.category, name: d.nameKo, desc: d.descKo, tier: d.tier, maxRank: d.maxRank, cost: d.costPerRank,
  totalCost: d.maxRank * d.costPerRank,
  requires: d.requires.map((r) => `${skillName(r.id)} ${r.rank}랭크`),
  unlock: (d.unlock ?? []).map(unlockKo).filter(Boolean),
  wired: d.wired, hidden: !!d.hidden,
  // 222차 — 아직 없는 시스템에 걸린 스킬(배울 수 없음)
  pending: d.pendingSystem?.ko ?? '',
  prof: d.proficiency ? `${d.proficiency.actions.map((a) => PROF_ACTION_KO[a] ?? a).join(' · ')} 1회당 ${d.proficiency.xpPerAction} XP` : '',
  img: imgOf(`sk:${d.id}`),
}));
const skills = {
  groups: core.SKILL_CATEGORIES.map((c) => ({
    id: c.id, label: c.nameKo, desc: c.descKo, locked: !!c.locked, lockedNote: c.lockedNoteKo ?? '',
    count: skillList.filter((x) => x.cat === c.id).length,
  })),
  list: skillList,
  totalPt: core.SKILL_TREE_TOTAL_PT,
  prof: { levels: [...core.PROF_LEVEL_XP], scale: [...core.PROF_EFFECT_SCALE] },
};

// ─────────────────────────────────────────────
// 204차 — 공략: 타이틀(숨은 업적) 조건 · 물때 흐름 8단계
// ─────────────────────────────────────────────
const RARITY_ORDER = { common: 0, rare: 1, legend: 2 };
const guide = {
  titles: [...core.TITLE_DATABASE]
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])
    .map((t) => ({
      id: t.id, name: t.nameKo, nameEn: t.nameEn, rarity: t.rarity, rarityKo: core.TITLE_RARITY_LABEL_KO[t.rarity],
      cond: core.titleConditionLabelKo(t), minLevel: t.minLevel ?? 0, paths: t.paths.length,
      effect: core.titleEffectLabelKo(t), story: t.storyKo,
    })),
  tide: ['flood_early', 'flood_mid', 'flood_late', 'slack_high', 'ebb_early', 'ebb_mid', 'ebb_late', 'slack_low'].map((ph) => {
    const p = core.TIDE_FLOW_PROFILE[ph];
    const when = {
      flood_early: '간조 30분 뒤 ~ 간조 2시간 뒤', flood_mid: '간조 2시간 뒤 ~ 4시간 뒤', flood_late: '간조 4시간 뒤 ~ 만조 30분 전',
      slack_high: '만조 앞뒤 30분', ebb_early: '만조 30분 뒤 ~ 만조 2시간 뒤', ebb_mid: '만조 2시간 뒤 ~ 4시간 뒤',
      ebb_late: '만조 4시간 뒤 ~ 간조 30분 전', slack_low: '간조 앞뒤 30분',
    }[ph];
    return {
      id: ph, name: core.TIDE_FLOW_LABEL_KO[ph], nameEn: core.TIDE_FLOW_LABEL_EN[ph], when, stars: p.stars,
      bite: p.biteMult, size: p.sizeBias, current: p.currentMult, note: core.TIDE_FLOW_NOTE_KO[ph], tip: core.TIDE_FLOW_TIP_KO[ph],
    };
  }),
  // 205차 — 어종 × 물때(게임 안에서는 잘 무는 물때에 잡아 봐야 알게 되는 숨은 표)
  species: core.TIDE_PHASE_PREF_GROUPS.map((g) => {
    const T = core.TUNING.tidePhase;
    return {
      id: g.id, name: g.nameKo, nameEn: g.nameEn, note: g.noteKo,
      evidence: { research: '조사 근거', community: '낚시 매체 · 커뮤니티', folk: '통설' }[g.evidence],
      members: g.members.map((id) => core.FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id),
      phases: core.TIDE_PREF_PHASE_ORDER.map((ph) => ({
        name: core.TIDE_FLOW_LABEL_KO[ph],
        south: +core.speciesTidePhaseMult(g.members[0], ph, 1, 1).toFixed(2),
        neap: +core.speciesTidePhaseMult(g.members[0], ph, 0, 1).toFixed(2),
        east: +core.speciesTidePhaseMult(g.members[0], ph, 1, T.eastSeaK).toFixed(2),
        size: g.size?.[ph] ?? 0,
      })),
    };
  }),
  // 205차 — 채비(장르) × 물때 규칙
  genre: (() => {
    const T = core.TUNING.tidePhase;
    return [
      { id: 'float', name: '찌낚시 · 밑밥', lede: '물이 약할 때(물돌이 · 끝들물 · 끝날물) 던진 밑밥은 발밑에 쌓이고, 흐름이 붙는 초물 · 중물에 띠로 풀린다.',
        rows: [['쌓이는 양', `1회 투척 +${T.chumBankPerThrow} (최대 ${T.chumBankMax})`], ['풀릴 때 동조 가산', `저장량 × ${T.chumBankSyncBonus} (동해는 ×${(0.4 + 0.6 * T.eastSeaK).toFixed(2)})`],
          ['소진', `초당 ${T.chumBankDecayPerSec}`], ['밑밥 띠', `수평 동조 폭 × (1 + 물살 × ${T.chumBandPerFlow})`]] },
      { id: 'surf', name: '원투 · 봉돌', lede: '물살이 센 중물에 봉돌이 가벼우면 바닥에서 구르며 하류로 끌린다. 무거운 봉돌이면 버틴다.',
        rows: [['구르는 조건', `물살 > ${T.surfRollFlow} 이고 봉돌 < ${T.surfSinkerMinG}g (25호 ≈ 94g)`], ['구를 때', `입질 ×${T.surfRollBite} · 밑걸림 ×${T.surfRollSnag} · 하류로 ${T.surfRollDriftMps}m/s`],
          ['초들물 · 초날물', `입질 ×${T.surfEarlyBite} (냄새 확산)`], ['동해', '물살이 약해(최대 ≈ 0.4) 봉돌이 거의 구르지 않는다']] },
      { id: 'lure', name: '루어 종류', lede: '단계 몫은 동해에서 1 쪽으로 눌린다. 물살 몫은 이미 지역 물살에 들어 있다.',
        rows: [['지그 · 미노우 · 스푼 · 스피너', '중물 ×1.10 · 물돌이 ×0.85'], ['에기', `물돌이 ×1.10 · 물살 > ${T.lureFlowHigh} 이면 ×0.85`],
          ['타이라바', '중물 ×1.15 · 물돌이 ×0.70'], ['웜 · 소프트 저크베이트', `초물 ×1.10 · 물살 > ${T.lureFlowHigh} 이면 ×0.85`]] },
      { id: 'hole', name: '구멍치기', lede: '단계보다 물높이. 만조 무렵 블록 위 물이 깊을 때 잘 물고, 간조엔 블록이 드러난다.',
        rows: [['간조 → 만조', `입질 ×${T.holeLow} → ×${T.holeHigh}`], ['동해', `×${(1 + (T.holeLow - 1) * T.eastSeaK).toFixed(2)} → ×${(1 + (T.holeHigh - 1) * T.eastSeaK).toFixed(2)}`]] },
      { id: 'forage', name: '해루질', lede: '간조 2시간 전 ~ 간조 물돌이 ~ 간조 1시간 뒤가 시간창. 그 뒤로는 물이 다시 차오른다(혼잣말 경고 — 동해 제외).',
        rows: [['시간창 안', `스팟 수 · 채집 성공 × (1 + ${T.forageWindowBonus} × 사리 × 지역)`], ['사리 계수', '조금 0.5 ~ 사리 1.0'], ['동해', `× (1 + ${(T.forageWindowBonus * T.eastSeaK).toFixed(2)}) 까지`]] },
      { id: 'trap', name: '통발', lede: '담가 둔 동안 물살이 고르게 흘렀을수록 미끼 냄새가 멀리 퍼져 많이 든다.',
        rows: [['어획 배율', `${(1 - T.trapFlowSpan / 2).toFixed(2)} ~ ${(1 + T.trapFlowSpan / 2).toFixed(2)} (평균 물살 기준)`], ['동해', `${(1 - T.trapFlowSpan / 2 * T.eastSeaK).toFixed(2)} ~ ${(1 + T.trapFlowSpan / 2 * T.eastSeaK).toFixed(2)}`]] },
      { id: 'east', name: '동해 감쇠', lede: '동해(속초·포항·울릉)는 조차가 30cm 남짓이라 물때 효과를 크게 깎는다 — 대신 새벽 · 해질녘 같은 시간대가 더 중요하다.',
        rows: [['어종 선호 · 대물 · 수위 · 해루질', `효과 × ${T.eastSeaK}`], ['물살 세기', `× ${T.eastSeaFlowK}`], ['사리 · 조금', '조금이면 어종 선호가 절반으로 눌린다']] },
    ];
  })(),
};

// ─────────────────────────────────────────────
// 240차 — 농사(텃밭): 작물 68종 · 심는 방법 · 거두기 · 손이 가는 일 · 병해 · 값 · 쓰임 · 농자재
//   사용자 지시 「wiki에 농사 반영 시, 아이템 클릭 시 해당되는 모든 상세정보 같이 나오도록」 — 다른 게임 위키(Stardew · Terraria · Mistria)의
//   항목 구조(한눈에 정보 → 얻는 법 → 쓰이는 곳 → 교차 링크)를 따른다. 숫자는 전부 core에서 읽는다.
// ─────────────────────────────────────────────
const CROP_CAT_KO = {
  leaf: '잎채소', fruit: '열매채소', root: '뿌리채소', tuber: '덩이', bulb: '마늘 · 파', grain: '곡식', legume: '콩',
  wild: '산나물', herb: '향채', mushroom: '버섯', sprout: '시루 · 새싹',
};
const CROP_RARITY_KO = { common: '흔하다', uncommon: '드물다', rare: '귀하다', very_rare: '아주 귀하다' };
const WATER_KO = { low: '적게', mid: '보통', high: '많이' };
const START_KIND_KO = { seed: '씨앗', seedling: '모종', set: '종구 · 종서 · 배지' };
const itemById = new Map(itemCatalog.map((it) => [it.id, it]));
const itemNameOf = (id) => itemById.get(id)?.name ?? id;
const itemImgOf = (id) => imgOf(itemById.get(id)?.imgKey) ?? imgOf(itemById.get(id)?.iconTexture) ?? imgOf(`px:${id}`);
const monthsKoList = (ms) => (ms?.length ? (core.monthRangeKo?.(ms) ?? ms.join('·') + '월') : '—');
const licenseKo = (t) => core.getLicenseByType?.(t)?.nameKo ?? core.getLicenseByType?.(t)?.name ?? t;
const supplyNameOf = (id) => core.getFarmSupply?.(id)?.nameKo ?? itemNameOf(id);

/**
 * 관리 작업 한 줄들 — 때(심은 날 · 달력 · 자람 · 거둔 뒤 · 철 · 병들면) · 반복 · 준비물(자재 · 도구) · 손놀림 · 효과 · 놓치면
 * 245차 — 때는 core `taskWhenKo`(작물마다 철이 다르다) · 놓친 품질은 깎이는 값(옛 표는 「+」로 잘못 찍었다)
 */
const careTaskRow = (t, plan) => {
  const when = core.taskWhenKo(plan, t);
  const rep = t.only === 'riskSeason' ? `철 동안 ${t.repeat?.everyDays ?? 10}일마다`
    : t.only === 'diseased' ? `든 동안 ${t.repeat?.everyDays ?? 3}일마다`
      : t.months ? '해마다 그 철에 한 번'
        : t.afterPick ? '거둘 때마다 한 번'
          : t.repeat ? `${t.repeat.everyDays}일마다 ${t.repeat.times}번 더 (모두 ${1 + t.repeat.times}회)` : '한 번';
  const needs = (t.needs ?? []).map((n) => `${supplyNameOf(n.itemId)} ×${n.qty}`).join(' · ');
  const tools = (t.tools ?? []).map((id) => supplyNameOf(id)).join(' · ');
  const eff = [];
  if (t.effect?.yieldMult) eff.push(`수확 ×${t.effect.yieldMult}`);
  if (t.effect?.quality) eff.push(`품질 +${Math.round(t.effect.quality * 100)}%p`);
  if (t.effect?.water) eff.push(t.id === 'mist' ? '배지가 촉촉해진다' : '흙이 흠뻑 젖는다');
  for (const pr of t.effect?.protect ?? []) eff.push(`${core.DISEASE_KO[pr.disease]} ${pr.days}일 동안 ×${pr.mult}`);
  if (t.effect?.diseaseMult) eff.push(Object.entries(t.effect.diseaseMult).map(([d, m]) => `${core.DISEASE_KO[d]} ×${m}`).join(' · '));
  if (t.only === 'diseased') eff.push(`${(t.onlyFor ?? plan.diseases).map((d) => core.DISEASE_KO[d]).join(' · ')}의 심한 정도가 준다`);
  const miss = [];
  if (t.missed?.yieldMult) miss.push(`수확 ×${t.missed.yieldMult}`);
  if (t.missed?.quality) miss.push(`품질 −${Math.round(t.missed.quality * 100)}%p`);
  if (t.missed?.lodging) miss.push('비바람에 쓰러진다');
  if (t.missed?.diseaseMult) miss.push(Object.entries(t.missed.diseaseMult).map(([d, m]) => `${core.DISEASE_KO[d]} ×${m}`).join(' · '));
  return {
    id: t.id, name: core.CARE_TASK_KO[t.id] ?? t.id, when, rep, needs, needIds: (t.needs ?? []).map((n) => n.itemId),
    tools, toolIds: [...(t.tools ?? [])],
    work: `${core.CARE_WORK_KO[t.work] ?? t.work} · 약 ${t.seconds}초 · 품 ${t.fatigue}`,
    effect: eff.join(' · '), missed: miss.join(' · '), how: t.howKo,
  };
};
const DISEASE_KIND_KO = { disease: '병', pest: '벌레', bird: '새' };
/** 245차 — 드는 병 · 벌레 · 새 한 줄(철 · 증상 · 막는 법 · 다 번지면 잃는 몫) */
const diseaseRow = (d) => {
  const def = core.DISEASE_DEFS[d];
  return {
    id: d, name: core.DISEASE_KO[d], kind: def.kind, kindLabel: DISEASE_KIND_KO[def.kind] ?? def.kind,
    season: monthsKoList([...def.season]), symptom: core.DISEASE_SYMPTOM_KO[d], control: core.DISEASE_CONTROL_KO[d],
    loss: [def.yieldLoss > 0 ? `다 번지면 수확 −${Math.round(def.yieldLoss * 100)}%` : '', def.standLoss ? '포기가 죽어 나간다' : '',
      def.indoor ? '집 안에서도 든다' : '', def.ripeOnly ? '익을 무렵에만 온다' : ''].filter(Boolean).join(' · '),
  };
};

const questsUsing = (names) => {
  const keys = names.filter((n) => n && n.length >= 2);
  const hit = [];
  for (const q of quests.quests ?? []) {
    const inObj = (q.obj ?? []).some((o) => keys.some((k) => (o.label ?? '').includes(k)));
    const inRw = ((q.rw && q.rw.items) ?? []).some((it) => keys.some((k) => (it.name ?? '').includes(k)));
    if (inObj || inRw) hit.push({ id: q.id, title: q.title, how: inRw && !inObj ? '받는다' : '쓴다' });
  }
  return hit;
};
const recipesUsing = (ingId) => (ingId ? core.FIRE_RECIPES.filter((r) => [...r.required, ...r.optional]
  .some((q) => (Array.isArray(q.ing) ? q.ing : [q.ing]).includes(ingId))).map((r) => ({ id: r.id, name: r.nameKo })) : []);
const baseName = (s) => (s ?? '').replace(/\s*\(.*?\)\s*/g, '').replace(/\s*·\s*(특|상|보통)$/, '').trim();
/** 241차 — 날로 먹기(수확물 기본 id) — 먹는다 · 나눠서 · 못 먹는다 */
const rawEatOf = (itemId) => {
  const st = core.rawEatStatus?.(itemId); if (!st) return null;
  if (st.kind === 'no') return { kind: 'no', why: st.why.whyKo };
  if (st.kind === 'pack') return { kind: 'pack', units: st.units, edible: st.edible };   // 243차 — 포장한 팩은 뜯어야
  // 243차 — 작은 낱개(딸기 · 방울토마토 · 블루베리)는 한 번에 먹는 양(bite) 기준
  const nut = core.biteNutrition ? core.biteNutrition(st.def) : { g: st.def.g, kcal: st.def.kcal, ml: st.def.ml, mlNet: st.def.mlNet };
  const n = core.restoreFromNutrition(nut);
  return { kind: st.kind, hunger: n.hungerRestore, hydration: n.hydrationRestore, g: +nut.g.toFixed(1), kcal: +nut.kcal.toFixed(1), ml: +(nut.mlNet ?? nut.ml).toFixed(1), note: st.def.noteKo,
    bite: st.def.bite ? { units: st.def.bite.units, label: st.def.bite.labelKo } : null,
    pieces: st.def.pieces ? { count: st.def.pieces.count, label: st.def.pieces.labelKo, id: core.pieceItemId(itemId) } : null };
};
/** 243차 — 낱개 n개를 사람 말로(클라이언트 `looseCountKo`와 같은 규칙) */
const looseCountKo = (nameKo, n) => {
  const m = /\((\d+)\s*(개|알|송이)/.exec(nameKo);
  const counter = m ? m[2] : /한 줌/.test(nameKo) ? '줌' : '개';
  return `${nameKo.replace(/\s*\(.*\)\s*$/, '').replace(/\s*한 (줌|팩|단|묶음)$/, '').trim()} ${n}${counter}`;
};
const CHUM_GRAIN = new Set(['crop_barley', 'crop_corn']);

/**
 * 245차 — 손 가는 정도 어림. 한 작기(여러해살이는 2년 남짓)를 「날마다 물 · 사흘에 한 번 비」로 두 번 돌려
 * 할 일을 다 했을 때와 손을 놓았을 때 거두는 양을 견준다(게임과 같은 core 규칙 · 결정적 해시라 돌릴 때마다 같다).
 */
const DAY_MS = 86400000;
const careEffort = (crop, plan) => {
  const start = crop.starts.find((s) => !s.nursery) ?? crop.starts[0];
  const run = (managed) => {
    const site = crop.site === 'indoor' || start.nursery ? 'indoor' : 'plot';
    const plot = core.newFarmPlot(site, 0);
    if (site === 'indoor') plot.facilities = ['sproutJar'];
    const cell = plot.cells[0];
    cell.tilled = true;
    let t = Date.UTC(2026, start.months[0] - 1, 10) - 9 * 3600000;
    core.plantCell(cell, crop, start, t, () => 0.5, { hasSkill: () => true, hasTray: true });
    let n = 0, secs = 0, total = 0;
    for (let d = 0; d < 700 && cell.cropId; d++) {
      t += DAY_MS;
      core.waterCell(cell);
      core.advanceCell(plot, 0, t, { rainAt: () => d % 3 === 0 });
      if (!cell.cropId) break;
      if (managed) for (const st of core.careDue(cell, crop, t)) if (core.doCare(cell, crop, st.def.id, t, 1).ok) { n++; secs += st.def.seconds; }
      if (core.cellReady(cell)) {
        const raw = (cell.careYield ?? 1) * core.diseaseYieldMult(cell) * cell.stand * (crop.harvest.qtyPerCell[0] + crop.harvest.qtyPerCell[1]) / 2;
        const h = core.harvestCell(cell, () => 0.5);
        if (h) { total += raw; if (h.seedling) break; }
        if (!h?.more) break;
      }
    }
    return { n, secs, total };
  };
  const a = run(true), b = run(false);
  return {
    kinds: plan.tasks.filter((t) => t.only !== 'diseased').length, times: a.n, secs: a.secs,
    neglectPct: a.total > 0 ? Math.round((b.total / a.total) * 100) : 100,
  };
};

const farmCrops = core.CROP_DATABASE.map((c) => {
  const plan = core.carePlanOf(c);
  const baseStart = c.starts.find((s) => s.kind === 'seedling') ?? c.starts[0];
  const gateBase = core.cropGate(c, baseStart);
  const starts = c.starts.map((st) => {
    const g = core.cropGate(c, st);
    return {
      kind: st.kind, kindLabel: START_KIND_KO[st.kind], itemId: st.itemId, itemName: itemNameOf(st.itemId), img: itemImgOf(st.itemId),
      cost: st.cost, perCell: st.perCell, establish: Math.round(st.establish * 100), days: st.days,
      months: c.site === 'indoor' ? '언제나' : monthsKoList(st.months), qtyMult: st.qtyMult ?? 1,
      nursery: st.nursery ? `집 안 육묘 트레이에 뿌려 모종 ${st.nursery.seedlings[0]}~${st.nursery.seedlings[1]}포기 (가식 한 번)` : '',
      tier: g.tier, tierLabel: core.CROP_TIER_KO[g.tier], level: g.level, license: g.license ? licenseKo(g.license) : '',
      soldAt: itemById.get(st.itemId)?.soldAt ?? [],
    };
  });
  const h = c.harvest;
  const harvestItems = [h.itemId, h.ripenTo?.itemId, c.interim?.itemId].filter(Boolean);
  const ing = c.cookIngredient ? core.getCookIngredient?.(c.cookIngredient) : null;
  const ingRed = h.ripenTo?.cookIngredient ? core.getCookIngredient?.(h.ripenTo.cookIngredient) : null;
  const ingInterim = c.interim?.cookIngredient ? core.getCookIngredient?.(c.interim.cookIngredient) : null;
  const sproutable = !!core.cropStartOfItem?.(h.itemId);
  const perPlant = baseStart?.kind === 'seedling' && core.perPlantYield ? core.perPlantYield(c, baseStart.perCell) : null;
  const needs = [];
  if (c.requires?.skill) needs.push(`스킬 「${core.getSkillById(c.requires.skill)?.nameKo ?? c.requires.skill}」`);
  if (c.requires?.facility) needs.push(core.supplyOfFacility(c.requires.facility)?.nameKo ?? c.requires.facility);
  if (c.category === 'sprout') needs.push(core.supplyOfFacility('sproutJar')?.nameKo ?? '콩나물 시루');
  if (c.requires?.license) needs.push(licenseKo(c.requires.license));
  const kamis = !!core.KAMIS_CROP_ITEMS?.[c.id];
  // 241차 — 개량종(원종 ↔ 개량종) · 날로 먹기(본 · 붉어진 것 · 중간)
  const baseCrop = core.baseCropOf?.(c);
  const variant = c.variant ? { of: c.variant.of, ofName: baseCrop?.nameKo ?? c.variant.of, after: c.variant.afterHarvests, diff: c.variant.diffKo, unlock: core.variantUnlockKo(c) } : null;
  const variants = (core.variantsOf?.(c.id) ?? []).map((v) => ({ id: v.id, name: v.nameKo, after: v.variant.afterHarvests, diff: v.variant.diffKo }));
  const rawEat = harvestItems.map((id) => ({ id, name: itemNameOf(id), ...(rawEatOf(id) ?? { kind: 'unknown' }) }));
  return {
    id: c.id, name: c.nameKo, nameEn: c.nameEn, cat: c.category, catLabel: CROP_CAT_KO[c.category] ?? c.category,
    variant, variants, rawEat,
    site: c.site === 'indoor' ? '집 안 선반' : '마당 텃밭', speed: c.speedClass === 'leafy' ? '빨리 자라는 잎채소 (설비 ×2.0까지)' : '철 작물 (설비 ×1.4까지)',
    rarity: CROP_RARITY_KO[c.rarity] ?? c.rarity, rarityId: c.rarity, inMart: c.inMart, water: WATER_KO[c.water] ?? c.water,
    growMonths: c.site === 'indoor' ? '언제나' : monthsKoList(c.growMonths), overwinter: !!c.overwinter, perennial: !!c.perennial,
    tier: gateBase.tier, tierLabel: core.CROP_TIER_KO[gateBase.tier], level: gateBase.level, license: gateBase.license ? licenseKo(gateBase.license) : '',
    care: (c.care ?? []).map((k) => core.CROP_CARE_KO[k] ?? k), needs,
    img: itemImgOf(h.itemId), note: c.noteKo ?? '',
    starts,
    harvest: {
      itemId: h.itemId, name: h.nameKo, qty: h.qtyPerCell, repeat: h.repeat ? `${h.repeat.everyDays}일마다 ${h.repeat.times}번 더` : '',
      holdDays: h.holdDays, bonus: h.bonusSteps ? `거둘 때마다 덤 0~${h.bonusSteps * 10}%` : '',
      // 243차 — 낱개로 거두고 가방에서 포장한다(팩 = 낱개 n + 포장 용기 1 · 낱개 판매는 8할)
      pack: h.pack ? { itemId: h.pack.itemId, name: h.pack.nameKo, units: h.pack.units, perPack: looseCountKo(h.nameKo, h.pack.units),
        price: Math.round(c.price.base * h.pack.units), loose: Math.round(core.FARM_TUNING.looseSellMult * 100) } : null,
      ripen: h.ripenTo ? { itemId: h.ripenTo.itemId, name: h.ripenTo.nameKo, after: h.ripenTo.afterDays, turning: h.ripenTo.turningDays ?? 0, price: h.ripenTo.price } : null,
      perPlant: perPlant ? `${perPlant[0]}~${perPlant[1]}개 (칸당 ${baseStart.perCell}포기)` : '',
      interim: c.interim ? { itemId: c.interim.itemId, name: c.interim.labelKo, window: `자람 ${Math.round(c.interim.window[0] * 100)}~${Math.round(c.interim.window[1] * 100)}%`, qty: c.interim.qtyPerCell, price: c.interim.price, mainMult: c.interim.mainYieldMult, seedOnly: !!c.interim.seedOnly, inMart: c.interim.inMart } : null,
      items: harvestItems.map((id) => ({ id, name: itemNameOf(id) })),
    },
    // 247차 — 기르는 법(물의 양 · 품 · 거름 · 도구 · 거둔 뒤 손질 · 알맞은 철 · 늘리기 · 귀한 작물 구하기 · 저절로 나는 싹)
    cultivation: {
      water: core.waterLineKo(c), labor: core.laborLineKo(c), tools: core.toolLineKo(c), process: core.processLineKo(c),
      timing: core.timingLineKo(c), propagate: core.propagateLineKo(c), note: core.cultivationOf(c).noteKo,
      rare: gateBase.tier >= 4 ? `종묘사에 늘 있지 않다 — 열흘에 한 번꼴로 들어온다(작물마다 날이 다르다)` : '',
      wild: core.WILD_SPROUTS.some((w) => w.cropId === c.id)
        ? `묵힌 칸에 저절로 날 수 있다${core.WILD_SPROUTS.find((w) => w.cropId === c.id)?.shade ? '(차광막 그늘 아래)' : ''} — 처음엔 「이름 모를 싹」, 자라면 이름이 드러난다`
        : '',
    },
    carePlan: {
      tasks: plan.tasks.map((t) => careTaskRow(t, plan)),
      diseases: plan.diseases.map(diseaseRow),
      establishDays: plan.establishDays ?? 0, frostEnds: !!plan.frostEnds,
      nursery: c.starts.some((s) => s.nursery) ? core.NURSERY_PLAN.tasks.map((t) => careTaskRow(t, core.NURSERY_PLAN)) : [],
      summary: core.hasCarePlan(c) ? core.carePlanSummaryKo(c) : '',
      effort: careEffort(c, plan),
    },
    price: {
      base: c.price.base, season: c.price.season.map((v) => +v.toFixed(2)), volatility: c.price.volatility, kamis,
      grade: core.FARM_TUNING.gradePrice, buyers: '식자재 마트 · 식당 (수산물 직판장은 사지 않는다)',
    },
    uses: {
      cook: ing ? { ing: ing.nameKo, recipes: recipesUsing(ing.id) } : null,
      cookRed: ingRed ? { ing: ingRed.nameKo, recipes: recipesUsing(ingRed.id) } : null,
      cookInterim: ingInterim ? { ing: ingInterim.nameKo, recipes: recipesUsing(ingInterim.id) } : null,
      chum: CHUM_GRAIN.has(h.itemId), sproutable,
      quests: questsUsing([c.nameKo, baseName(h.nameKo), baseName(h.ripenTo?.nameKo), baseName(c.interim?.labelKo)]),
    },
  };
});
const farmSupplies = core.FARM_SUPPLIES.map((sp) => ({
  id: sp.itemId, name: sp.nameKo, nameEn: sp.nameEn, price: sp.price,
  kind: sp.kind === 'tool' ? '도구 (닳지 않는다)' : sp.kind === 'consumable' ? '소모품 (쓰면 사라진다)' : '설비 (텃밭 · 집 안에 놓는다)',
  site: sp.site ? (sp.site === 'indoor' ? '집 안' : '마당 텃밭') : '', shop: sp.shop === 'nursery' ? '종묘사' : '생활용품점',
  skill: sp.requiresSkill ? core.getSkillById(sp.requiresSkill)?.nameKo ?? sp.requiresSkill : '', rarity: sp.rarity ?? 'common',
  desc: sp.descKo, img: itemImgOf(sp.itemId),
  usedBy: farmCrops.filter((fc) => [...fc.carePlan.tasks, ...fc.carePlan.nursery].some((t) => t.needIds.includes(sp.itemId) || t.toolIds.includes(sp.itemId)))
    .map((fc) => ({ id: fc.id, name: fc.name })),
  grows: farmCrops.filter((fc) => fc.needs.includes(sp.nameKo)).map((fc) => ({ id: fc.id, name: fc.name })),
}));
/** 아이템 id → 농사 항목(아이템 탭 상세에 「농사」 절을 붙이고 작물 카드로 잇는다) */
const farmByItem = {};
for (const fc of farmCrops) {
  for (const st of fc.starts) farmByItem[st.itemId] = { crop: fc.id, role: 'start' };
  for (const it of fc.harvest.items) {
    farmByItem[it.id] = { crop: fc.id, role: it.id === fc.harvest.interim?.itemId ? 'interim' : 'produce' };
    for (const sfx of ['_sp', '_nm']) farmByItem[it.id + sfx] = { crop: fc.id, role: it.id === fc.harvest.interim?.itemId ? 'interim' : 'produce' };
  }
}
for (const sp of farmSupplies) farmByItem[sp.id] = { supply: sp.id, role: 'supply' };
// 243차 — 포장한 팩도 작물로 잇는다
for (const fc of farmCrops) if (fc.harvest.pack) for (const sfx of ['', '_sp', '_nm']) farmByItem[fc.harvest.pack.itemId + sfx] = { crop: fc.id, role: 'pack' };
// 241차 — 조각(나눈 것)도 작물로 잇는다
for (const fc of farmCrops) for (const r of fc.rawEat) if (r.pieces) farmByItem[r.pieces.id] = { crop: fc.id, role: 'piece' };
const farming = {
  groups: Object.entries(CROP_CAT_KO).map(([id, label]) => ({ id, label, count: farmCrops.filter((c) => c.cat === id).length })).filter((g) => g.count > 0),
  tiers: [1, 2, 3, 4].map((t) => ({ id: String(t), label: core.CROP_TIER_KO[t], level: core.FARM_TUNING.tierLevels[t - 1], license: t >= core.FARM_TUNING.certTier ? licenseKo(core.FARM_TUNING.certLicense) : '' })),
  crops: farmCrops, supplies: farmSupplies, byItem: farmByItem,
  rules: {
    rawEat: '날로 먹을 수 있는 수확물은 가방에서 우클릭 [사용하기]로 먹는다(딸기 · 방울토마토 · 블루베리처럼 작은 낱개는 한 번에 여러 개) — 허기 · 수분은 실제 영양(열량 ÷ 2,400 · 수분 ÷ 2,000)에서 센다. 수박 한 통 · 무 한 개 · 배추 한 통 · 1kg 덩이 · 생땅콩 500g · 생강은 [나누기]로 조각을 낸 뒤 먹는다(조각은 등급이 없고 가게가 사지 않는다). 매운 것(청양고추 · 홍고추 · 생마늘 · 생강 · 고추냉이)은 수분을 조금 깎는다. 날로 못 먹는 것(생감자 · 토란 · 생콩 · 버섯 · 두릅 …)은 [사용하기]가 없다 — 익혀 먹는다.',
    pack: '딸기 · 방울토마토 · 블루베리 · 느타리 · 생목이 · 새싹채소는 낱개(한 알 · 한 송이 · 한 줌)로 거둔다. 가방에서 [포장하기]로 낱개 여러 개와 포장 용기(생활용품점 100원) 1개를 팩 하나로 담는다 — 팩은 제값, 낱개로 팔면 가게가 다시 담아야 해서 8할. 팩은 [포장 뜯기]로 낱개가 된다(용기는 버린다).',
    variant: '개량종(스테비아 토마토 · 호박고구마 · 청양고추)은 원종을 텃밭에서 세 번 거두면 종묘사에 들어온다. 씨앗 · 모종 · 수확물 상세의 「원종」 · 「개량종」 줄이 알려 준다.',
    plotCells: '한 구획 = 4×3칸 · 한 칸 = 2×2 타일(1㎡ 남짓)',
    // 247차 — 기르는 법 공통
    cultivate: '물은 조금 · 보통 · 흠뻑 세 가지로 준다(밭에서 [F]를 누르고 있는 만큼) — 흙 수분이 그 작물의 알맞은 띠 안에 있어야 잘 자라고, 넘치면 작물마다 탈이 다르다. 일구기 · 심기 · 거두기 · 털기는 피로가 쌓이고(배고픔 · 목마름도 조금) 피로가 차면 쉬어야 한다 — 낫 · 수확 가위 · 쇠스랑 · 모종삽 · 도리깨는 품을 줄인다. 깨 · 콩 · 보리는 베어 밭에서 말린 뒤 털고 키질한다(늦으면 쏟아지고, 비를 맞으면 품질이 준다). 알맞은 철 밖에 심으면 수량이 15% 준다.', plots: '마당 2구획 + 농지 이용권 5구획(빌린 구획 5,000원/30일)',
    grade: Object.entries(core.FARM_TUNING.gradePrice).map(([g, m]) => `${core.GRADE_KO[g]} ×${m}`).join(' · '),
    kamis: '배추 · 무 · 양파 · 상추 같은 흔한 채소는 하루 한 번 실제 소매가(전국 평균)를 받아 「오늘 ÷ 평년」으로 값을 움직인다',
    noInput: '비료 · 약을 하나도 안 써도 거두기는 된다 — 다만 놓친 일마다 수확 · 품질이 깎이고, 병 · 벌레가 다 번지면 그 몫만큼 덜 난다. 「쉬움」 작물은 놓친 손해가 절반 · 병이 드는 확률 0.6배 · 번짐 0.7배라 손을 놓아도 대개 8할은 거둔다.',
    // 245차 — 작물마다 다른 일 · 같은 작물 여러 칸 한꺼번에
    careTier: '난이도가 오를수록 손 가는 일이 늘어난다 — 「쉬움」은 한 작기에 서너 번(솎기 · 김매기 · 웃거름), 「보통」 · 「까다로움」은 열 번 넘게(지주 · 순지르기 · 방제 · 열매 솎기). 「아주 까다로움」 산채는 일은 적지만 고추냉이 · 초피처럼 놓치면 크게 주는 것이 있다.',
    careWhen: '때는 네 가지로 센다 — 심은 날부터 며칠(대부분), 달력(마늘 짚 덮기 11~12월 · 보리밟기 2~3월 · 가지치기 겨울), 자람(배추 묶기 · 열매 솎기), 거둔 뒤(부추 · 미나리 · 공심채는 벨 때마다 웃거름). 여러해살이는 해마다 다시 센다.',
    careGroup: '같은 작물을 여러 칸에 심었으면 한 번에 한다 — 한 칸 더할 때마다 시간은 한 칸 몫의 0.45씩(모두 4칸 몫까지), 품은 0.6씩 늘어난다. 자재는 칸마다 든다.',
  },
};

// ─────────────────────────────────────────────
// 업데이트 이력 — 워크로그 색인(§3.1) 표를 그대로 읽는다
// ─────────────────────────────────────────────
const updates = fs.readFileSync(path.join(ROOT, 'docs/wiki/03-WORKLOG/README.md'), 'utf8')
  .split(/\r?\n/)
  .map((ln) => ln.match(/^\|\s*\[(\d+)\]\([^)]*\)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*$/))
  .filter(Boolean)
  .map((m) => ({ round: Number(m[1]), date: m[2], tags: m[3], title: m[4].replace(/\*\*|`/g, '') }))
  .sort((a, b) => b.round - a.round);

const groupCount = (list, key) => {
  const m = new Map();
  for (const e of list) m.set(e[key], (m.get(e[key]) ?? 0) + 1);
  return m;
};

// ─────────────────────────────────────────────
// 262차 — 출조 지역: 전국 지도 노드 × 출조 구역(REGION_AREA_NODES) × 심리스 데이터 지역(지도 크기 · 가게 · 건물 · 등대는 public/data에서 실측) × 조행록 장
// ─────────────────────────────────────────────
const DATA_DIR = path.join(ROOT, 'packages/client-pc/public/data');
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const SEA_KO = { east: '동해', south: '남해', west: '서해' };
const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
const dataRegionStats = (dr) => {
  const meta = readJson(path.join(DATA_DIR, dr, 'meta.json'));
  if (!meta) return null;
  const pois = readJson(path.join(DATA_DIR, dr, 'pois.json')) ?? [];
  const bld = readJson(path.join(DATA_DIR, dr, 'buildings.json')) ?? [];
  const lights = readJson(path.join(DATA_DIR, dr, 'lights.json')) ?? [];
  const km = (n) => (n * (meta.tileMeters ?? 5) / 1000).toFixed(1);
  const shops = pois.filter((q) => ['shop', 'restaurant', 'cafe', 'lodging', 'pharmacy', 'fuel', 'bank', 'market'].includes(q.type)).length;
  return { id: dr, w: meta.width, h: meta.height, km: `${km(meta.width)} × ${km(meta.height)} km`, pois: pois.length, shops, buildings: bld.length, lights: lights.length };
};
const regions = core.WORLD_NODE_DATABASE.map((n) => {
  const rid = n.regionDatabaseId;
  const areas = core.getRegionAreaNodes(rid);
  const pages = core.JOURNAL_PAGES.filter((pg) => pg.regionId === rid).map((pg) => ({
    page: pg.page, label: pg.labelKo, species: core.FISH_DATABASE.find((f) => f.id === pg.speciesId)?.nameKo ?? pg.speciesId,
    seasons: pg.seasons.map((x) => SEASON_KO[x] ?? x).join(' · '), how: pg.howKo,
    cond: [pg.minCm ? `${pg.minCm}cm 이상` : '', pg.count ? `${pg.count}마리` : '', pg.releaseAfter ? '계측 뒤 방류' : ''].filter(Boolean).join(' · '),
  }));
  const seaKey = core.seaZoneOf ? core.seaZoneOf(rid) : null;
  const drs = [];
  for (const a of areas) {
    const def = core.seamlessRegionOf(rid, a.fieldMapId);
    if (def && !drs.some((d) => d.id === def.dataRegion)) { const st = dataRegionStats(def.dataRegion); if (st) drs.push({ ...st, name: def.name }); }
  }
  return {
    id: rid, name: n.name, nameEn: n.nameEn, short: n.shortName, sido: n.region, sea: rid === 'jeju' ? '제주' : (SEA_KO[seaKey] ?? ''),
    open: areas.length > 0, boat: ['ulleungdo', 'dokdo'].includes(rid), chapter: core.chapterOfRegion ? (core.chapterOfRegion(rid) ?? null) : null,   // 263차 — 이 지역을 여는 장
    areas: areas.map((a) => {
      const def = core.seamlessRegionOf(rid, a.fieldMapId);
      return {
        id: a.id, name: a.name, nameEn: a.nameEn ?? '', desc: a.desc, details: a.details ?? [], depth: a.depthRangeM ? `${a.depthRangeM[0]}~${a.depthRangeM[1]}m` : '',
        snag: a.snagRisk ? core.SNAG_RISK_LABEL[a.snagRisk] : '', enterable: a.enterable !== false, dataRegion: def?.dataRegion ?? null, mapName: def?.name ?? '',
        ownSpawn: !!a.spawnLatLon,
      };
    }),
    maps: drs, pages,
  };
});


// ─────────────────────────────────────────────
// 264차 — 지도 탭: 데이터 지역(심리스 13 + 홈타운)마다 캡처 시트(`tools/capture_wiki_maps.cjs` 규격 — 타일당 8px · 4,096 시트 · 축소판 2px)
//   × 가게 · 장소(미니맵 핀) · 등대 · 어장 · 이야기 인물 자리 · 현장 지점 · 장소 · 출조 구역 내리는 자리 · 홈타운 설치물.
//   클라이언트 표는 `tools/dump_wiki_map_data.mjs` 산출(`tools/wiki_map_data.json`)에서 읽는다.
// ─────────────────────────────────────────────
const MAP_PX = 8, MAP_SHEET = 4096, MAP_OV_PX = 2;
const mapData = readJson(path.join(ROOT, 'tools/wiki_map_data.json'))
  ?? { placements: [], places: [], triggers: [], buildingLabel: {}, buildingGoods: {}, buildingHours: {}, poiLabel: {}, hometown: null, poiKinds: {} };
const MM_ICON = { convenience: 'mm_conv', mart: 'mm_mart', market: 'mm_market', restaurant: 'mm_food', cafe: 'mm_cafe', pub: 'mm_pub', pharmacy: 'mm_pharm', daily: 'mm_daily', nursery: 'mm_nursery' };
const HOURS_KO = (h) => (!h ? '' : h === 'always' ? '24시간' : `${h.open}~${h.close}시`);
const NPC_BEHAVIOR_KO = { stall: '좌판을 지킨다', patrol: '오가며 둘러본다', fishing: '낚시한다', wander: '서성인다' };
const FACING_KO = { down: '정면', left: '왼쪽', right: '오른쪽', up: '뒤' };
const HOME_OBJ_KO = { door: '집 문', busStop: '버스 정류장', well: '우물', clinic: '보건소', pier: '선착장', tidalRock: '갯바위', tree: '나무', rock: '바위', stump: '그루터기', farmPlot: '텃밭', workbench: '작업대', fence: '울타리' };
const POI_TYPE_KO = { restaurant: '음식점', cafe: '카페', shop: '가게', lodging: '숙소', bank: '은행', fuel: '주유소', viewpoint: '전망 포인트', info: '관광안내소', toilet: '공중화장실',
  pharmacy: '약국', police: '파출소', lighthouse: '등대', ferry_terminal: '여객터미널', market: '시장', hospital: '병원', fishing_spot: '낚시터' };
const SHIFT_KO = (r) => (!r || !r.shifts?.length ? '24시간 밖' : r.shifts.map((s) => `${Math.floor(s.fromMin / 60)}~${Math.floor(s.toMin / 60)}시`).join(' · ') + (r.offDays?.length ? ' · 일요일 쉼' : ''));
const questBrief = (q) => ({ id: q.id, title: q.titleKo, kind: q.kind, chapter: q.chapter });
const mapNpc = (p) => {
  const d = core.getStoryNpc(p.npcId);
  const routine = core.routineOfNpc ? core.routineOfNpc(p.npcId) : null;
  const gives = core.STORY_QUESTS.filter((q) => q.giver === p.npcId).map(questBrief);
  const related = core.STORY_QUESTS.filter((q) => q.giver !== p.npcId && (q.objectives ?? []).some((o) => o.npcId === p.npcId)).map(questBrief);
  // 268차 — 그림 얼굴 초상(`tools/gemini_face_art.cjs --install`이 `tools/wiki_img/face_<id>.png`로 복사) — 있으면 핀 상세 · 조행록 의뢰인 칸에
  const face = fs.existsSync(path.join(IMG_DIR, `face_${p.npcId}.png`)) ? `face_${p.npcId}.png` : '';
  return {
    id: p.npcId, name: d?.nameKo ?? p.npcId, nameEn: d?.nameEn ?? '', role: d?.roleKo ?? '', tx: p.tx, ty: p.ty, img: face,
    behavior: p.behavior ?? 'wander', behaviorKo: NPC_BEHAVIOR_KO[p.behavior ?? 'wander'] ?? p.behavior, facing: FACING_KO[p.facing ?? 'down'],
    home: p.home ? { tx: p.home.tx, ty: p.home.ty, label: p.home.labelKo } : null,
    routine: routine ? `${SHIFT_KO(routine)}${p.home ? '' : ' (집 없음)'}` : '',
    arc: core.arcOfNpc ? (core.arcOfNpc(p.npcId)?.titleKo ?? '') : '',
    gives, related,
  };
};
const areaSpawnTile = (meta, a) => {
  const ll = a.spawnLatLon;
  if (meta?.bbox && ll) {
    const [s, w, n, e] = meta.bbox;
    const tx = Math.floor((ll[1] - w) / (e - w) * meta.width), ty = Math.floor((n - ll[0]) / (n - s) * meta.height);
    if (tx >= 0 && ty >= 0 && tx < meta.width && ty < meta.height) return { tx, ty, own: true };
  }
  return meta?.spawn ? { tx: meta.spawn[0], ty: meta.spawn[1], own: false } : null;
};
const sheetsOf = (W, H, dr) => {
  const out = [];
  for (let sr = 0; sr < Math.ceil(H / MAP_SHEET); sr++) for (let sc = 0; sc < Math.ceil(W / MAP_SHEET); sc++) {
    out.push({ f: `maps/${dr}/s_${sc}_${sr}.webp`, x: sc * MAP_SHEET, y: sr * MAP_SHEET, w: Math.min(MAP_SHEET, W - sc * MAP_SHEET), h: Math.min(MAP_SHEET, H - sr * MAP_SHEET) });
  }
  return out;
};
const inRegion = (x, regionId, dr, onlyDr) => x.regionId === regionId && (x.dataRegion ? x.dataRegion === dr : !onlyDr);
// 데이터 지역 → 전국 지도 노드 · 구역(한 지역에 데이터 지역이 여럿이면 각 구역이 제 데이터 지역에 붙는다)
const drIndex = new Map();
for (const n of core.WORLD_NODE_DATABASE) {
  const rid = n.regionDatabaseId;
  for (const a of core.getRegionAreaNodes(rid)) {
    const def = core.seamlessRegionOf(rid, a.fieldMapId);
    if (!def) continue;
    let e = drIndex.get(def.dataRegion);
    if (!e) { e = { regionId: rid, regionName: n.name, short: n.shortName, name: def.name, nameEn: def.nameEn ?? '', areas: [], multi: false }; drIndex.set(def.dataRegion, e); }
    e.areas.push(a);
  }
}
for (const e of drIndex.values()) e.multi = [...drIndex.values()].filter((x) => x.regionId === e.regionId).length > 1;
const mapList = [];
for (const [dr, e] of drIndex) {
  const meta = readJson(path.join(DATA_DIR, dr, 'meta.json'));
  if (!meta) continue;
  const pois = readJson(path.join(DATA_DIR, dr, 'pois.json')) ?? [];
  const kinds = mapData.poiKinds[dr] ?? [];
  const lights = readJson(path.join(DATA_DIR, dr, 'lights.json')) ?? [];
  const farms = (readJson(path.join(DATA_DIR, dr, 'fishfarms.json'))?.farms ?? []).map((f) => ({
    name: f.name ?? '', kind: f.kindKo ?? f.kind ?? '', method: f.method ?? '', desc: f.farmDesc ?? '', areaHa: f.areaHa ?? null, admin: f.admin ?? '',
    rings: (f.rings ?? []).map((r) => r.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])),
  }));
  const bld = readJson(path.join(DATA_DIR, dr, 'buildings.json')) ?? [];
  const W = meta.width * MAP_PX, H = meta.height * MAP_PX;
  const chapter = core.chapterOfRegion ? (core.chapterOfRegion(e.regionId) ?? null) : null;
  mapList.push({
    id: dr, name: e.name, nameEn: e.nameEn, regionId: e.regionId, regionName: e.regionName, short: e.short, chapter, legacy: false,
    cols: meta.width, rows: meta.height, tileM: meta.tileMeters ?? 5, km: `${(meta.width * (meta.tileMeters ?? 5) / 1000).toFixed(1)} × ${(meta.height * (meta.tileMeters ?? 5) / 1000).toFixed(1)} km`,
    px: MAP_PX, width: W, height: H, sheets: sheetsOf(W, H, dr),
    overview: { f: `maps/${dr}/overview.webp`, w: Math.round(W * MAP_OV_PX / MAP_PX), h: Math.round(H * MAP_OV_PX / MAP_PX), px: MAP_OV_PX },
    spawn: meta.spawn ? { tx: meta.spawn[0], ty: meta.spawn[1], name: meta.spawnName ?? '' } : null,
    areas: e.areas.map((a) => ({ id: a.id, name: a.name, nameEn: a.nameEn ?? '', mapId: a.fieldMapId, enterable: a.enterable !== false, ...(areaSpawnTile(meta, a) ?? {}) , depth: a.depthRangeM ? `${a.depthRangeM[0]}~${a.depthRangeM[1]}m` : '', snag: a.snagRisk ? core.SNAG_RISK_LABEL[a.snagRisk] : '' })),
    pois: pois.map((p, i) => {
      const k = kinds[i] ?? { kind: null, stall: false, auction: false, place: null };
      return {
        i, tx: p.tx, ty: p.ty, name: p.name ?? '', nameEn: p.nameEn ?? '', type: p.type, typeKo: POI_TYPE_KO[p.type] ?? p.type, shopKind: p.shopKind ?? '',
        kind: k.kind, kindKo: k.kind ? (k.auction ? '위판장' : k.stall ? '좌판' : mapData.buildingLabel[k.kind] ?? k.kind) : '',
        goods: k.kind ? (mapData.buildingGoods[k.kind] ?? '') : '', hours: k.kind ? HOURS_KO(mapData.buildingHours[k.kind]) : '',
        icon: k.kind ? MM_ICON[k.kind] : (k.place !== null ? 'mm_poi' : null), placeKo: k.place ?? '', capture: p.src === 'capture',
      };
    }),
    lights: lights.map((l) => ({ tx: l.tx, ty: l.ty, name: l.name ?? '', kind: l.kind ?? '', colour: l.colour ?? '', major: !!l.major })),
    farms, buildings: bld.length,
    npcs: mapData.placements.filter((p) => p.tx !== undefined && inRegion(p, e.regionId, dr, false)).map(mapNpc),
    places: mapData.places.filter((p) => inRegion(p, e.regionId, dr, false)).map((p) => ({
      key: p.key, tx: p.tx, ty: p.ty, r: p.radiusTiles, label: p.labelKo,
      quests: core.STORY_QUESTS.filter((q) => (q.objectives ?? []).some((o) => o.placeKey === p.key)).map(questBrief),
    })),
    triggers: mapData.triggers.filter((t) => inRegion(t, e.regionId, dr, false)).map((t) => {
      const q = core.STORY_QUESTS.find((x) => x.id === t.questId);
      return { id: t.id, tx: t.tx, ty: t.ty, label: t.labelKo, questId: t.questId, questTitle: q?.titleKo ?? t.questId, chapter: q?.chapter ?? null,
        objective: q?.objectives?.[t.objectiveIndex]?.labelKo ?? '', phase: t.phase + 1, actor: t.actor?.nameKo ?? '', viaNpc: t.viaNpc ?? '', give: t.give ?? '', take: t.take ?? '' };
    }),
    home: [],
  });
}
// 홈타운(레거시 · 타일 20px · 시트 한 장)
if (mapData.hometown) {
  const hm = readJson(path.join(DATA_DIR, 'hometown', 'hometown_home.json'));
  if (hm) {
    const W = hm.cols * 20, H = hm.rows * 20;
    const objs = mapData.hometown.objects;
    mapList.push({
      id: 'hometown', name: '홈타운 (집)', nameEn: 'Hometown (Home)', regionId: 'hometown', regionName: '홈타운', short: '홈타운', chapter: null, legacy: true,
      cols: hm.cols, rows: hm.rows, tileM: null, km: '', px: 20, width: W, height: H,
      sheets: [{ f: 'maps/hometown/s_0_0.webp', x: 0, y: 0, w: W, h: H }], overview: { f: 'maps/hometown/overview.webp', w: W, h: H, px: 20 },
      spawn: { tx: mapData.hometown.spawn.col, ty: mapData.hometown.spawn.row, name: '집 문 앞' }, areas: [], pois: [], lights: [], farms: [], buildings: 0,
      npcs: mapData.placements.filter((p) => p.tx !== undefined && p.regionId === 'hometown').map(mapNpc),
      places: mapData.places.filter((p) => p.regionId === 'hometown').map((p) => ({ key: p.key, tx: p.tx, ty: p.ty, r: p.radiusTiles, label: p.labelKo, quests: [] })),
      triggers: [],
      home: objs.filter((o) => o.type !== 'tree' && o.type !== 'rock').map((o) => ({ id: o.id, type: o.type, label: HOME_OBJ_KO[o.type] ?? o.type, tx: o.tx, ty: o.ty, fw: o.fw, fh: o.fh })),
      homeCounts: { tree: objs.filter((o) => o.type === 'tree').length, rock: objs.filter((o) => o.type === 'rock').length },
    });
  }
}
// 265차 — 구 맵(레거시 · 속초 7 · 부산 8 · 타일 20px). 심리스(100 · 262)로 바뀐 뒤 게임에서는 안 열린다 —
//   「지금 구현한 모든 지역맵」을 보려고 찍어 둔다(캡처 = 씬 `legacy` 플래그). 가게는 손그림 POI(kind만 · 이름 없음) · 이웃 맵 = 그래프 links
const EDGE_KO = { N: '북', S: '남', E: '동', W: '서' };
const LEGACY_POI_KO = { food: '먹거리 가게' };
const LEGACY_POI_ICON = { food: 'mm_food' };
for (const regionId of ['gangwon_sokcho', 'busan']) {
  const graph = core.REGION_MAP_GRAPHS[regionId];
  const wn = core.WORLD_NODE_DATABASE.find((n) => n.regionDatabaseId === regionId);
  const regionName = `${wn?.name ?? regionId} (구 맵)`;
  for (const nd of graph?.nodes ?? []) {
    const j = readJson(path.join(DATA_DIR, graph.dataDir.replace(/^data\//, ''), `${nd.id}.json`));
    if (!j) continue;
    const W = j.cols * 20, H = j.rows * 20;
    mapList.push({
      id: nd.id, name: nd.name, nameEn: nd.nameEn ?? '', regionId, regionName, short: wn?.shortName ?? regionName, chapter: null, legacy: true, old: true,
      cols: j.cols, rows: j.rows, tileM: null, km: '', px: 20, width: W, height: H,
      sheets: sheetsOf(W, H, nd.id), overview: { f: `maps/${nd.id}/overview.webp`, w: Math.round(W / 2), h: Math.round(H / 2), px: 10 },
      spawn: null, areas: [], lights: [], farms: [], buildings: 0, npcs: [], places: [], triggers: [], home: [],
      pois: (j.pois ?? []).map((p, i) => ({
        i, tx: p.col, ty: p.row, name: '', nameEn: '', type: 'legacy', typeKo: '구 맵 가게(손그림)', shopKind: '', kind: p.kind ?? null,
        kindKo: mapData.buildingLabel[p.kind] ?? LEGACY_POI_KO[p.kind] ?? p.kind ?? '', goods: mapData.buildingGoods[p.kind] ?? '', hours: HOURS_KO(mapData.buildingHours[p.kind]),
        icon: MM_ICON[p.kind] ?? LEGACY_POI_ICON[p.kind] ?? 'mm_poi', placeKo: '', capture: false, old: true,
      })),
      links: Object.entries(nd.links ?? {}).map(([dir, id]) => ({ dir, dirKo: EDGE_KO[dir] ?? dir, id, name: graph.nodes.find((x) => x.id === id)?.name ?? id })),
    });
  }
}
// 조행록 탭 연결 색인 — 인물 · 장소 · 현장 · 지역
const npcAt = {}, placeAt = {}, triggersByQuest = {}, regionMaps = {};
for (const m of mapList) {
  if (!m.old) (regionMaps[m.regionId] ??= []).push(m.id);   // 구 맵은 조행록 · 지역 카드 링크에서 뺀다(지도 탭 목록에만)
  for (const n of m.npcs) npcAt[n.id] ??= { map: m.id, tx: n.tx, ty: n.ty };
  for (const p of m.places) placeAt[p.key] ??= { map: m.id, tx: p.tx, ty: p.ty };
  for (const t of m.triggers) (triggersByQuest[t.questId] ??= []).push({ map: m.id, id: t.id, label: t.label, tx: t.tx, ty: t.ty, phase: t.phase });
}
const maps = {
  px: MAP_PX, sheet: MAP_SHEET,
  icons: ['mm_conv', 'mm_mart', 'mm_market', 'mm_food', 'mm_cafe', 'mm_pub', 'mm_pharm', 'mm_daily', 'mm_nursery', 'mm_poi', 'mm_npc', 'mm_quest', 'mm_ready']
    .map((id) => ({ id, img: imgOf(`px:${id}`) })).filter((x) => x.img),
  legend: [['mm_market', '직판장 · 위판장 · 좌판'], ['mm_mart', '식자재마트'], ['mm_daily', '생활용품점'], ['mm_nursery', '종묘사'], ['mm_conv', '편의점'], ['mm_pharm', '약국'],
    ['mm_food', '음식점'], ['mm_cafe', '카페'], ['mm_pub', '주점'], ['mm_poi', '장소(거래 없음)'], ['mm_npc', '이야기 인물']],
  list: mapList, npcAt, placeAt, triggersByQuest, regionMaps,
};

const out = {
  generatedFrom: '@tra/core dist + client wiki catalog + docs/wiki/02-SYSTEMS',
  generatedAt: new Date().toISOString(),
  counts: {
    quests: quests.counts.quests, recipes: recipes.length, ingredients: ingredients.length,
    species: speciesList.length, crafting: core.CRAFT_BLUEPRINTS.length,
    items: items.length, images: Object.keys(manifest).length,
    rules: rules.length, updates: updates.length, skills: skillList.length, titles: guide.titles.length,
    crops: farmCrops.length, supplies: farmSupplies.length,
    regions: regions.filter((r) => r.open).length, areas: regions.reduce((n, r) => n + r.areas.length, 0),
    maps: mapList.length, mapNpcs: mapList.reduce((n, m) => n + m.npcs.length, 0), mapPois: mapList.reduce((n, m) => n + m.pois.length, 0),
  },
  quests,
  cooking: {
    groups: Object.entries(core.RECIPE_FAMILY_KO ?? {}).map(([id, label]) => ({
      id, label, count: recipes.filter((r) => r.family === id).length,
    })).filter((g) => g.count > 0),
    recipes,
  },
  ingredients,
  species: {
    groups: SPECIES_GROUPS.map((g) => ({ ...g, count: speciesList.filter((s) => s.group === g.id).length })),
    list: speciesList,
  },
  items: {
    groups: Object.entries(ITEM_CATEGORY_KO).map(([id, label]) => ({
      id, label, count: items.filter((i) => i.group === id).length,
    })).filter((g) => g.count > 0),
    subs: [...groupCount(items, 'sub').entries()].map(([id, count]) => ({ id, count })),
    // 255차 — 선반 탭(낚시 장비 · 먹을거리 · 생활 · 도구 · 설치 · 가구). 농사 물건(`shelf: 'farm'`)은 농사 탭이 맡는다
    shelves: ITEM_SHELVES.map((sh) => ({
      id: sh.id, label: sh.label, note: sh.note,
      groups: sh.groups.map((g) => ({ id: g.id, label: g.label, count: items.filter((i) => i.shelf === sh.id && i.shelfGroup === g.id).length }))
        .filter((g) => g.count > 0),
    })),
    list: items,
  },
  // 222차 — 위치 · 1개 시간 · 레벨 · 재료까지(제작 시간제)
  blueprints: core.CRAFT_BLUEPRINTS.map((b) => ({
    id: b.id, name: b.nameKo, group: core.CRAFT_GROUP_LABEL[b.group]?.ko ?? b.group,
    station: b.station, stationLabel: core.CRAFT_STATION_LABEL[b.station]?.ko ?? b.station, desc: b.descKo ?? '',
    timeSec: b.timeSec ?? core.CRAFT_DEFAULT_TIME_SEC[b.station], minLevel: b.minLevel ?? 1,
    materials: b.materials.map((m) => `${m.nameKo} ×${m.qty}`), outQty: b.outputQty,
    success: Math.round(b.baseSuccess * 100),
    // 223차 — 얻는 길(없으면 처음부터 앎)
    learn: !b.learn ? '처음부터' : b.learn.via === 'shop' ? `도면 종이 ${b.learn.priceWon.toLocaleString('ko-KR')}원` : '분해하다 깨침',
  })),
  systems: readSystemPages(),
  rules,
  updates,
  skills,
  guide,
  farming,
  regions,
  maps,
};

// 발행용 — 카드·상세가 실제로 참조하는 그림만 추려 둔다(아티팩트 파일 수 절약)
const used = new Set();
for (const r of recipes) { if (r.img) used.add(r.img); for (const v of r.variants) if (v.img) used.add(v.img); }
for (const s of speciesList) { if (s.img) used.add(s.img); for (const v of s.imgs ?? []) if (v.src) used.add(v.src); }
for (const i of items) if (i.img) used.add(i.img);
for (const k of skillList) if (k.img) used.add(k.img);
for (const c of farmCrops) { if (c.img) used.add(c.img); for (const st of c.starts) if (st.img) used.add(st.img); }
for (const sp of farmSupplies) if (sp.img) used.add(sp.img);
for (const ic of maps.icons) used.add(ic.img);   // 264차 — 지도 탭 핀 아이콘(16px — 전부 HTML 안)
for (const m of maps.list) for (const n of m.npcs ?? []) if (n.img) used.add(n.img);   // 268차 — 인물 얼굴(192px · 20KB 아래면 HTML 안)
// 249차 — 아티팩트 한 판에는 파일이 511개까지만 들어간다(위키가 쓰는 그림 512장 + index.html — 그 전까지 코드 그림 141장이 빠진 채였다).
//   작은 그림(INLINE_MAX 이하 — 16px 아이콘 · 스킬 아이콘 · 코드 그림 섬네일)은 HTML 안에 data URI로 넣고, 나머지만 img/ 파일로 둔다.
// 264차 — 지도 시트(maps/ — 15지도 99파일)가 들어오면서 파일 상한(511)에 걸려 8KB → 20KB로 올렸다(213장이 HTML 안으로 · 페이지 약 +4.5MB).
const INLINE_MAX = 20480;
// 264차 — 같은 그림이 카드 · 상세 · 재료 줄에 여러 번 나와 data URI를 자리마다 넣으면 페이지가 3배로 불었다(20KB 상한에서 13MB).
//   그림은 `out.inl[파일명]`에 **한 번만** 넣고, 값은 파일명 그대로 둔다 — 템플릿 `img()`가 `G.inl`에서 찾아 쓴다.
const inlined = new Set();
out.inl = {};
const inlineSmall = (v) => {
  if (!v || typeof v !== 'object') return;
  for (const [k, x] of Object.entries(v)) {
    if ((k === 'img' || k === 'src') && typeof x === 'string' && x.endsWith('.png') && used.has(x)) {
      if (inlined.has(x)) continue;
      const p = path.join(IMG_DIR, x);
      if (fs.existsSync(p) && fs.statSync(p).size <= INLINE_MAX) { out.inl[x] = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`; inlined.add(x); }
    } else if (x && typeof x === 'object') inlineSmall(x);
  }
};
if (Object.keys(manifest).length) {
  inlineSmall(out);
  fs.writeFileSync(path.join(IMG_DIR, 'used.txt'), [...used].filter((f) => !inlined.has(f)).sort().join('\n') + '\n');
  fs.writeFileSync(path.join(IMG_DIR, 'inlined.txt'), [...inlined].sort().join('\n') + '\n');
  process.stderr.write(`위키 그림: 파일 ${used.size - inlined.size}장(img/) · HTML 안 ${inlined.size}장(≤ ${INLINE_MAX}B)\n`);
}

const json = JSON.stringify(out);
if (process.argv.includes('--html')) {
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/game_wiki_template.html'), 'utf8');
  process.stdout.write(tpl.replace('__DATA__', json.replace(/<\//g, '<\\/')));
} else {
  process.stdout.write(json);
}
