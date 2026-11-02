/**
 * @file Gifts.ts
 * @description 297차 — 선물 반응 규칙. 취향 표(`db-schema/NpcGiftPrefs.ts`)와 물건 꼬리표를 맞춰 반응과 우호도 변화를 정한다.
 *
 *  판정 순서: 싫어함 → 아주 좋아함 → 좋아함 → **고향 특산**(그 사람 고향 지역의 특산이고 그 지역에서 얻은 것 — 명산지 꼬리표) → 보통.
 *  우호도: love +0.12 · like +0.06 · neutral +0.02 · dislike −0.06(`Affinity.ts`의 대본 건네기 상한 ±0.3 안).
 *  하루 한 번(이야기 날짜 — `GIFT_DAILY_CAP`). 칭호 문턱은 취향 표 인원의 절반 · 전원(`giftTitleGoals`).
 */

import type { GiftItemView, GiftReaction, NpcGiftPrefDef } from '../types/Gift.js';
import { NPC_GIFT_PREFS, giftPrefOf } from '../db-schema/NpcGiftPrefs.js';
import { REGIONAL_SPECIALTIES } from '../db-schema/RegionalSpecialty.js';

/** 반응별 우호도 변화 */
export const GIFT_AFFINITY: Readonly<Record<GiftReaction, number>> = { love: 0.12, like: 0.06, neutral: 0.02, dislike: -0.06 };

/** 한 사람에게 하루에 줄 수 있는 수(이야기 날짜) */
export const GIFT_DAILY_CAP = 1;

/** 반응 이름(수첩 · 위키) */
export const GIFT_REACTION_LABEL: Readonly<Record<GiftReaction, { ko: string; en: string }>> = {
  love: { ko: '아주 좋아함', en: 'Loves' },
  like: { ko: '좋아함', en: 'Likes' },
  neutral: { ko: '보통', en: 'Neutral' },
  dislike: { ko: '싫어함', en: 'Dislikes' },
};

/** 오늘 이미 받았을 때 공통 말 */
export const GIFT_AGAIN_LINE: readonly [string, string] = ['오늘은 이미 받았어요. 마음만으로 충분해요.', "I already got something today. The thought is enough."];

/** 그 사람 고향 특산인가 — 특산 표에 그 지역이 있고, 물건도 그 지역에서 얻었을 때 */
function isHomeSpecialty(view: GiftItemView, homeRegionId: string | undefined): boolean {
  if (!homeRegionId || !view.originRegion) return false;
  for (const tag of view.tags) {
    if (!tag.startsWith('specialty:')) continue;
    const def = REGIONAL_SPECIALTIES.find((d) => d.id === tag.slice(10));
    if (def && def.regionIds.includes(homeRegionId) && def.regionIds.includes(view.originRegion)) return true;
  }
  return false;
}

/** 반응 판정 */
export function giftReaction(pref: NpcGiftPrefDef | undefined, view: GiftItemView, homeRegionId?: string): GiftReaction {
  const has = (list: readonly string[] | undefined): boolean => !!list && view.tags.some((t) => list.includes(t));
  if (!pref) return isHomeSpecialty(view, homeRegionId) ? 'like' : 'neutral';
  if (has(pref.dislikes)) return 'dislike';
  if (has(pref.loves)) return 'love';
  if (has(pref.likes)) return 'like';
  if (isHomeSpecialty(view, homeRegionId)) return 'like';
  return 'neutral';
}

/** 반응 말 — 취향 표가 없는 사람은 공통 말 */
export function giftLine(pref: NpcGiftPrefDef | undefined, reaction: GiftReaction): readonly [string, string] {
  if (pref) return pref.lines[reaction];
  return GIFT_GENERIC_LINES[reaction];
}

export const GIFT_GENERIC_LINES: Readonly<Record<GiftReaction, readonly [string, string]>> = {
  love: ['이걸… 저한테요? 고마워요. 정말 좋아하는 거예요.', 'This… for me? Thank you. I really love this.'],
  like: ['고마워요. 잘 쓸게요.', "Thank you. I'll put it to good use."],
  neutral: ['아, 고마워요.', 'Oh, thanks.'],
  dislike: ['…이건 제가 잘 안 써요. 마음은 받을게요.', "…I don't really use this. I'll take the thought, though."],
};

/** 칭호 문턱 — 절반(올림) · 전원 */
export function giftTitleGoals(): { half: number; all: number } {
  const all = NPC_GIFT_PREFS.length;
  return { half: Math.ceil(all / 2), all };
}

/** 오늘 줄 수 있는가 */
export function canGiftToday(lastDay: number | undefined, countToday: number | undefined, today: number): boolean {
  if (lastDay === undefined || lastDay !== today) return true;
  return (countToday ?? 0) < GIFT_DAILY_CAP;
}

/** 데이터 점검(시험 · 위키) — 취향 표 하나하나가 빠짐없이 적혔는가 */
export function validateGiftPrefs(): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const p of NPC_GIFT_PREFS) {
    if (seen.has(p.npcId)) issues.push(`${p.npcId}: 중복`);
    seen.add(p.npcId);
    if (!p.loves.length) issues.push(`${p.npcId}: 아주 좋아함 없음`);
    for (const k of ['love', 'like', 'neutral', 'dislike'] as const) {
      const l = p.lines[k];
      if (!l || !l[0] || !l[1]) issues.push(`${p.npcId}: ${k} 말 없음`);
    }
    for (const tag of [...p.loves, ...(p.likes ?? []), ...(p.dislikes ?? [])]) {
      if (!/^(item|species|specialty|kind):[a-z0-9_]+$/.test(tag)) issues.push(`${p.npcId}: 꼬리표 모양 ${tag}`);
      if (tag.startsWith('specialty:') && !REGIONAL_SPECIALTIES.some((d) => d.id === tag.slice(10))) issues.push(`${p.npcId}: 없는 특산 ${tag}`);
    }
    const overlap = p.loves.filter((t) => p.dislikes?.includes(t));
    if (overlap.length) issues.push(`${p.npcId}: 아주 좋아함과 싫어함이 겹침 ${overlap.join(',')}`);
  }
  return issues;
}

export { giftPrefOf };
