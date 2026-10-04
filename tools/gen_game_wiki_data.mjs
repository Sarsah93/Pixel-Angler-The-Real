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
  livefish: '살아 있는 작은 고기', lure: '루어',
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
      ['걸리는 시간', `위험 배율만큼 쌓여 5초를 넘기면 초당 25% × 배율 — 보통 자리 평균 약 9초 · 위험한 자리(×1.6) 약 6초 · 테트라포드 구멍(×${core.TUNING.hole.snagMultTetrapod}) 약 4초`],
      ['끌어당기기', core.SNAG_PULL_UP.map((r) => `${r.labelKo.split(' — ')[0]} ${Math.round(r.p * 100)}%`).join(' · ')],
      ['끊기', core.SNAG_BREAK_OFF.map((r) => `${r.labelKo.split(' — ')[0]} ${Math.round(r.p * 100)}%`).join(' · ')],
      ['바늘과 미끼', '단품 바늘은 바늘 + 미끼 + 좁쌀봉돌 · 타이라바는 바늘 둘 다 · 묶음추 · 카드 채비는 한 벌을 버린다(바늘이 고정) · 루어는 루어'],
      ['도래 아래', `도래(직결이면 매듭) 아래 전부 — 원줄에 꿴 유동 봉돌 · 찌는 남는다 · 목줄은 ${core.TUNING.snag.leaderCutM}m만 잘린다`],
      ['통째로', `찌 · 수중찌 · 유동 봉돌 · 도래부터 아래 전부 + 원줄 ${core.TUNING.snag.mainLineCutM}m`],
      ['줄 길이', '줄은 스풀째가 아니라 쓴 길이만큼 준다 — 다 쓰면 그 스풀이 사라진다(상세 보기에 남은 m)'],
      ['다시 채비', '가방에 같은 부품이 남아 있으면 그 칸은 그대로 끼워져 있다 — 다 떨어진 칸만 빈다'],
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

const out = {
  generatedFrom: '@tra/core dist + client wiki catalog + docs/wiki/02-SYSTEMS',
  generatedAt: new Date().toISOString(),
  counts: {
    quests: quests.counts.quests, recipes: recipes.length, ingredients: ingredients.length,
    species: speciesList.length, crafting: core.CRAFT_BLUEPRINTS.length,
    items: items.length, images: Object.keys(manifest).length,
    rules: rules.length, updates: updates.length, skills: skillList.length, titles: guide.titles.length,
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
  rules,
  updates,
  skills,
  guide,
};

// 발행용 — 카드·상세가 실제로 참조하는 그림만 추려 둔다(아티팩트 파일 수 절약)
const used = new Set();
for (const r of recipes) { if (r.img) used.add(r.img); for (const v of r.variants) if (v.img) used.add(v.img); }
for (const s of speciesList) { if (s.img) used.add(s.img); for (const v of s.imgs ?? []) if (v.src) used.add(v.src); }
for (const i of items) if (i.img) used.add(i.img);
for (const k of skillList) if (k.img) used.add(k.img);
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
