/**
 * @file NamulDishes.ts
 * @description 285차 — 나물 볶음의 주재료별 이름(사용자 지시 「요리 이름: 『토란대 들깨볶음』처럼 주재료에 따라 나물 볶음 이름이 바뀌는 것」).
 *
 * 255차 요리 이름 규칙(어종 → 「우럭 매운탕」)의 채소판이다. 요리 개체의 주재료 자리(`speciesId`)에 `veg_<열쇠>`를 넣는다.
 *  - 시래기 · 우거지 · 고구마줄기 · 토란대는 요리 재료 id가 곧 열쇠다(무청 · 말린 시래기 → 「시래기」).
 *  - 「나물」 재료(산나물 · 고춧잎 · 마늘종 · 깻순)는 넣은 아이템이 무엇이었는지로 가른다(곰취나물 · 마늘종 …).
 *  - 들깨가루를 넣었으면 `veg_<열쇠>_perilla` — 「토란대 들깨볶음」(고소함이 더해져 효과가 조금 크다).
 * 이 파일은 다른 core 모듈을 import하지 않는다(요리 이름 표 `RecipeLore` · 도감 `DishDiscovery`가 읽는다).
 */

export interface NamulVegDef {
  /** `veg_<key>`의 열쇠 */
  key: string;
  /** 상에 오를 때 부르는 이름(「곰취나물」 · 「토란대」) */
  ko: string;
  en: string;
  /** 요리 재료 id(이 재료로 들어오면 이 나물) */
  ing?: string;
  /** 넣은 아이템 기본 id(「나물」 재료일 때 — 등급 꼬리 없이) */
  items?: string[];
}

export const NAMUL_VEG: readonly NamulVegDef[] = [
  { key: 'siraegi', ko: '시래기', en: 'siraegi', ing: 'siraegi' },
  { key: 'ugeoji', ko: '우거지', en: 'ugeoji', ing: 'ugeoji' },
  { key: 'sweetpotato_stem', ko: '고구마줄기', en: 'sweet potato stems', ing: 'sweetpotato_stem' },
  { key: 'taro_stem', ko: '토란대', en: 'taro stems', ing: 'taro_stem' },
  { key: 'perilla_shoot', ko: '깻순', en: 'perilla shoots', items: ['crop_perilla_shoot'] },
  { key: 'pepper_leaf', ko: '고춧잎', en: 'chili leaves', items: ['crop_pepper_leaf'] },
  { key: 'garlic_scape', ko: '마늘종', en: 'garlic scapes', items: ['crop_garlic_scape'] },
  { key: 'gomchwi', ko: '곰취나물', en: 'gomchwi greens', items: ['crop_gomchwi'] },
  { key: 'bangpung', ko: '방풍나물', en: 'bangpung greens', items: ['crop_bangpung'] },
  { key: 'samnamul', ko: '눈개승마나물', en: 'goat\'s-beard shoots', items: ['crop_samnamul'] },
  { key: 'eosuri', ko: '어수리나물', en: 'eosuri greens', items: ['crop_eosuri'] },
  { key: 'bujigaengi', ko: '부지깽이나물', en: 'bujigaengi greens', items: ['crop_bujigaengi'] },
  { key: 'gondre', ko: '곤드레나물', en: 'gondre greens', items: ['crop_gondre'] },
];

/** 들깨가루를 넣은 판의 꼬리 */
export const NAMUL_PERILLA_TAIL = '_perilla';

/** 들깨볶음의 효과 배수(고소함 — 들깨가루가 국물을 잡는다) */
export const NAMUL_PERILLA_EFFECT_MULT = 1.15;

/** 나물 볶음 변형 id 전부(도감 분모 — 그냥 볶음 · 들깨볶음) */
export function namulVariantIds(): string[] {
  const out: string[] = [];
  for (const v of NAMUL_VEG) out.push(`veg_${v.key}`, `veg_${v.key}${NAMUL_PERILLA_TAIL}`);
  return out;
}

/** `veg_<key>[_perilla]` → 나물 정의 · 들깨 여부(아니면 null) */
export function parseNamulVariant(id: string | null | undefined): { veg: NamulVegDef; perilla: boolean } | null {
  if (!id || !id.startsWith('veg_')) return null;
  const perilla = id.endsWith(NAMUL_PERILLA_TAIL);
  const key = id.slice(4, perilla ? -NAMUL_PERILLA_TAIL.length : undefined);
  const veg = NAMUL_VEG.find((v) => v.key === key);
  return veg ? { veg, perilla } : null;
}

/** 등급 꼬리(`_sp` · `_gd` · `_nm`)를 뗀 기본 id */
const baseOf = (itemId: string): string => itemId.replace(/_(sp|gd|nm)$/, '');

/**
 * 냄비 · 팬에 든 것으로 나물 볶음 변형 id를 고른다 — 가장 많이 든 나물(같으면 먼저 넣은 것) · 들깨가루가 들었으면 들깨볶음.
 * 나물을 알 수 없으면 null(그냥 「나물 볶음」).
 */
export function namulVariantOf(contents: readonly { ing: string; units: number; srcItemId?: string }[]): string | null {
  let best: { key: string; units: number } | null = null;
  for (const c of contents) {
    const base = c.srcItemId ? baseOf(c.srcItemId) : '';
    const v = NAMUL_VEG.find((x) => (x.ing && x.ing === c.ing) || (c.ing === 'namul' && x.items?.includes(base)));
    if (!v) continue;
    if (!best || c.units > best.units) best = { key: v.key, units: c.units };
  }
  if (!best) return null;
  const perilla = contents.some((c) => c.ing === 'perilla_powder' && c.units > 0);
  return `veg_${best.key}${perilla ? NAMUL_PERILLA_TAIL : ''}`;
}
