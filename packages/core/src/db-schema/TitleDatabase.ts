/**
 * @file TitleDatabase.ts
 * @description 타이틀(칭호) 업적 12종 + 레어도별 효과 크기 + 순수 판정 함수 (203차).
 *
 * 첫 묶음(사용자 확정 2026-10-03): 시스템마다 고르게 — 방생 · 밤/새벽 · 대물 · 실패 유머 3 · 단골 · 사시미 · 고양이 · 문 앞 · 도감.
 * 수치는 실플레이 데이터를 보고 조정한다(목표만 바꾸면 된다 — 이미 얻은 타이틀은 지켜진다).
 */

import type { TitleDef, TitleEffectKind, TitleModifiers, TitleRarity, TitleStats } from '../types/Titles.js';

export const TITLE_DATABASE: TitleDef[] = [
  {
    id: 'savior', nameKo: '구원자', nameEn: 'Savior', rarity: 'rare', stat: 'release', goal: 100, effect: 'biteRate',
    storyKo: '놓아준 고기가 백 마리를 넘었다. 바다가 기억해 줄지도 모른다.',
    storyEn: 'I have let more than a hundred fish go. Maybe the sea will remember.',
  },
  {
    id: 'night_sea', nameKo: '밤바다 사람', nameEn: 'Night Sea Angler', rarity: 'rare', stat: 'nightCatch', goal: 50, effect: 'nightBite',
    storyKo: '밤바다에서 건져 올린 고기가 쉰 마리를 넘었다. 이제 어둠이 낯설지 않다.',
    storyEn: 'Fifty fish pulled from the night sea. The dark no longer feels strange.',
  },
  {
    id: 'dawn_line', nameKo: '새벽 첫 줄', nameEn: 'First Line at Dawn', rarity: 'common', stat: 'dawnCast', goal: 30, effect: 'dawnBite',
    storyKo: '해 뜨기 전에 첫 줄을 서른 번 던졌다. 새벽 공기가 몸에 익었다.',
    storyEn: 'I have cast the first line before sunrise thirty times. The dawn air feels familiar now.',
  },
  {
    id: 'trophy', nameKo: '대물 사냥꾼', nameEn: 'Trophy Hunter', rarity: 'legend', stat: 'trophyCatch', goal: 10, effect: 'lineStrength',
    storyKo: '60cm가 넘는 대물을 열 마리째 끌어올렸다. 손이 먼저 무게를 안다.',
    storyEn: 'My tenth fish over 60cm. My hands know the weight before I do.',
  },
  {
    id: 'landing_ache', nameKo: '들어뽕의 아픔', nameEn: 'The One That Dropped', rarity: 'common', stat: 'landingDrop', goal: 10, effect: 'landingDropCut',
    storyKo: '다 끌어올린 고기를 발앞에서 열 번 놓쳤다. 이번엔 꼭 뜰채를 챙기자.',
    storyEn: 'Ten fish lost right at my feet. Next time I am bringing the net.',
  },
  {
    id: 'line_breaker', nameKo: '줄 끊는 사람', nameEn: 'Line Breaker', rarity: 'common', stat: 'lineBreak', goal: 20, effect: 'lineStrength',
    storyKo: '줄을 스무 번 터뜨렸다. 감는 손보다 마음이 앞선다.',
    storyEn: 'Twenty snapped lines. My heart reels faster than my hands.',
  },
  {
    id: 'empty_cooler', nameKo: '빈 쿨러', nameEn: 'Empty Cooler', rarity: 'common', stat: 'emptyTrip', goal: 10, effect: 'buyDiscount',
    storyKo: '빈 쿨러로 돌아온 출조가 열 번이다. 가게 주인들이 안쓰럽게 본다.',
    storyEn: 'Ten trips home with an empty cooler. The shopkeepers look at me with pity.',
  },
  {
    id: 'regular', nameKo: '단골', nameEn: 'Regular', rarity: 'rare', stat: 'shopRegular', goal: 100, effect: 'buyDiscount',
    storyKo: '한 가게에서 백 번을 사고팔았다. 이제 주인이 먼저 인사한다.',
    storyEn: 'A hundred deals at the same shop. The owner greets me first now.',
  },
  {
    id: 'knife_master', nameKo: '회칼 장인', nameEn: 'Master of the Knife', rarity: 'rare', stat: 'sashimiFiveStar', goal: 10, effect: 'sellPrice',
    storyKo: '별 다섯 사시미를 열 접시 담았다. 칼끝이 생선결을 읽는다.',
    storyEn: 'Ten five-star sashimi plates. The blade reads the grain of the fish.',
  },
  {
    id: 'cat_butler', nameKo: '고양이 집사', nameEn: 'Cat Butler', rarity: 'common', stat: 'catPet', goal: 100, effect: 'biteRate',
    storyKo: '고양이를 백 번 쓰다듬었다. 집을 나설 때마다 행운을 빌어 주는 것 같다.',
    storyEn: 'A hundred pats for the cat. It seems to wish me luck every time I leave.',
  },
  {
    id: 'night_owl', nameKo: '올빼미', nameEn: 'Night Owl', rarity: 'common', stat: 'closedDoor', goal: 10, effect: 'fatigueCut',
    storyKo: '문 닫은 가게 앞에서 열 번 돌아섰다. 밤에 깨어 있는 게 익숙해졌다.',
    storyEn: 'Ten times I turned back at a closed shop. Being up at night is second nature now.',
  },
  {
    id: 'sea_atlas', nameKo: '바다 도감', nameEn: 'Living Sea Atlas', rarity: 'legend', stat: 'speciesFound', goal: 20, effect: 'sellPrice',
    storyKo: '스무 종의 바다 생물을 도감에 남겼다. 물고기를 보면 값이 먼저 보인다.',
    storyEn: 'Twenty species in my log. I can tell a fish’s worth at a glance.',
  },
];

/** 효과 크기 — [흔함, 드묾, 전설]. 비율형(바늘 빠짐·피로)은 확률/양 자체를 그 비율만큼 줄인다 */
export const TITLE_EFFECT_SCALE: Record<TitleEffectKind, [number, number, number]> = {
  biteRate: [0.01, 0.02, 0.03],
  nightBite: [0.01, 0.02, 0.03],
  dawnBite: [0.01, 0.02, 0.03],
  lineStrength: [0.01, 0.02, 0.03],
  landingDropCut: [0.10, 0.20, 0.30],
  sellPrice: [0.01, 0.02, 0.03],
  buyDiscount: [0.01, 0.02, 0.03],
  fatigueCut: [0.03, 0.06, 0.09],
};

const RARITY_INDEX: Record<TitleRarity, 0 | 1 | 2> = { common: 0, rare: 1, legend: 2 };

/** 레어도 이름(UI) */
export const TITLE_RARITY_LABEL_KO: Record<TitleRarity, string> = { common: '흔함', rare: '드묾', legend: '전설' };

export function getTitleById(id: string | null | undefined): TitleDef | null {
  if (!id) return null;
  return TITLE_DATABASE.find((t) => t.id === id) ?? null;
}

/** 이 타이틀 효과의 크기(0.02 = 2%) */
export function titleEffectValue(def: TitleDef): number {
  return TITLE_EFFECT_SCALE[def.effect][RARITY_INDEX[def.rarity]];
}

/** 효과 한 줄(UI) — 「입질 +2%」 · 「밤(22~04시) 입질 +2%」 … */
export function titleEffectLabelKo(def: TitleDef): string {
  const p = Math.round(titleEffectValue(def) * 100);
  switch (def.effect) {
    case 'biteRate': return `입질 +${p}%`;
    case 'nightBite': return `밤(22~04시) 입질 +${p}%`;
    case 'dawnBite': return `새벽(04~08시) 입질 +${p}%`;
    case 'lineStrength': return `줄 강도 +${p}%`;
    case 'landingDropCut': return `랜딩 바늘 빠짐 -${p}%`;
    case 'sellPrice': return `상점 판매가 +${p}%`;
    case 'buyDiscount': return `상점 구매가 -${p}%`;
    case 'fatigueCut': return `행동 피로 -${p}%`;
  }
}

/** 단 타이틀의 배율 묶음 — 없으면 전부 1 */
export function titleModifiers(def: TitleDef | null): TitleModifiers {
  const m: TitleModifiers = { biteMult: 1, nightBiteMult: 1, dawnBiteMult: 1, lineMult: 1, landingDropMult: 1, sellMult: 1, buyMult: 1, fatigueMult: 1 };
  if (!def) return m;
  const v = titleEffectValue(def);
  switch (def.effect) {
    case 'biteRate': m.biteMult = 1 + v; break;
    case 'nightBite': m.nightBiteMult = 1 + v; break;
    case 'dawnBite': m.dawnBiteMult = 1 + v; break;
    case 'lineStrength': m.lineMult = 1 + v; break;
    case 'landingDropCut': m.landingDropMult = 1 - v; break;
    case 'sellPrice': m.sellMult = 1 + v; break;
    case 'buyDiscount': m.buyMult = 1 - v; break;
    case 'fatigueCut': m.fatigueMult = 1 - v; break;
  }
  return m;
}

/** 밤 시간(22:00~03:59 KST) */
export function isTitleNightHour(hour: number): boolean { return hour >= 22 || hour < 4; }
/** 새벽 캐스팅 시간(04:00~05:59 KST) — 「새벽 첫 줄」 세기 */
export function isTitleDawnCastHour(hour: number): boolean { return hour >= 4 && hour < 6; }
/** 새벽 입질 효과 시간(04:00~07:59 KST) */
export function isTitleDawnBiteHour(hour: number): boolean { return hour >= 4 && hour < 8; }

/** 이 시각(KST 시)의 입질 배율 — 단 타이틀 효과만 */
export function titleBiteMultAt(m: TitleModifiers, hour: number): number {
  return m.biteMult * (isTitleNightHour(hour) ? m.nightBiteMult : 1) * (isTitleDawnBiteHour(hour) ? m.dawnBiteMult : 1);
}

/** 지금 누적 수로 새로 얻는 타이틀(이미 가진 것은 빼고) */
export function titlesNewlyEarned(stats: TitleStats, owned: ReadonlySet<string>): TitleDef[] {
  return TITLE_DATABASE.filter((t) => !owned.has(t.id) && (stats[t.stat] ?? 0) >= t.goal);
}
