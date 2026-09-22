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
      ['선호 미끼', (f.preferredBaits ?? []).join(', ') || '—'],
    ],
  });
}
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
      ['금채기', MONTHS(s.closedSeasonMonths)],
      ['필요 허가', s.requiredLicense ?? '없음'],
      ['미끼 활용', s.canBeUsedAsBait ? '가능' : '불가'],
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
const items = itemCatalog.map((it) => ({
  id: it.id, name: it.name,
  group: it.category, groupLabel: ITEM_CATEGORY_KO[it.category] ?? it.category,
  sub: it.subCategory || '기타',
  price: it.basePrice ?? 0,
  desc: it.desc ?? '',
  soldAt: it.soldAt ?? [],
  seed: !!it.isSeed,
  img: imgOf(it.iconTexture),
  spec: itemSpec(it.tpl ?? {}),
}));

/** 템플릿에 실린 제원을 사람이 읽는 줄로 (없는 필드는 싣지 않는다) */
function itemSpec(t) {
  const out = [];
  const push = (k, v) => { if (v !== undefined && v !== null && v !== '') out.push([k, String(v)]); };
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

const groupCount = (list, key) => {
  const m = new Map();
  for (const e of list) m.set(e[key], (m.get(e[key]) ?? 0) + 1);
  return m;
};

const out = {
  generatedFrom: '@tra/core dist + client wiki catalog + docs/wiki/02-SYSTEMS',
  generatedAt: new Date().toISOString(),
  counts: {
    quests: quests.counts.quests, recipes: recipes.length, ingredients: ingredients.length,
    species: speciesList.length, crafting: core.CRAFT_BLUEPRINTS.length,
    items: items.length, images: Object.keys(manifest).length,
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
    list: items,
  },
  blueprints: core.CRAFT_BLUEPRINTS.map((b) => ({
    id: b.id, name: b.nameKo, group: core.CRAFT_GROUP_LABEL[b.group]?.ko ?? b.group,
    station: b.station, desc: b.descKo ?? '',
  })),
  systems: readSystemPages(),
};

// 발행용 — 카드·상세가 실제로 참조하는 그림만 추려 둔다(아티팩트 파일 수 절약)
const used = new Set();
for (const r of recipes) { if (r.img) used.add(r.img); for (const v of r.variants) if (v.img) used.add(v.img); }
for (const s of speciesList) { if (s.img) used.add(s.img); for (const v of s.imgs ?? []) if (v.src) used.add(v.src); }
for (const i of items) if (i.img) used.add(i.img);
if (Object.keys(manifest).length) {
  fs.writeFileSync(path.join(IMG_DIR, 'used.txt'), [...used].sort().join('\n') + '\n');
}

const json = JSON.stringify(out);
if (process.argv.includes('--html')) {
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/game_wiki_template.html'), 'utf8');
  process.stdout.write(tpl.replace('__DATA__', json.replace(/<\//g, '<\\/')));
} else {
  process.stdout.write(json);
}
