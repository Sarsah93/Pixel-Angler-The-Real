/**
 * @file Gifts297.test.ts
 * @description 297차 — 선물 취향 표 정합 · 반응 판정 · 고향 특산 · 칭호 문턱.
 */
import { describe, it, expect } from 'vitest';
import { NPC_GIFT_PREFS, giftPrefOf, giftHomeRegionOf, GIFT_PREF_NPC_COUNT } from '../db-schema/NpcGiftPrefs.js';
import { giftReaction, giftLine, giftTitleGoals, canGiftToday, validateGiftPrefs, GIFT_AFFINITY } from './Gifts.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { SHORE_CREATURE_DATABASE } from '../db-schema/ShoreCreatureDatabase.js';
import { STORY_ARCS, STORY_MAIN_NPCS } from '../db-schema/StoryArcs.js';
import { TITLE_DATABASE, titleModifiers, titleEffectLabelKo } from '../db-schema/TitleDatabase.js';

describe('297 선물 취향 표', () => {
  it('표 점검 — 빠짐 · 꼬리표 모양 · 없는 특산 없음', () => {
    expect(validateGiftPrefs()).toEqual([]);
  });
  it('얼굴 있는 인물 44명이 전부 있고, 어종 · 갯것 꼬리표는 DB에 있다', () => {
    expect(GIFT_PREF_NPC_COUNT).toBe(44);
    const known = new Set([...STORY_MAIN_NPCS.map((n) => n.id), ...STORY_ARCS.flatMap((a) => a.npcs.map((n) => n.id))]);
    for (const p of NPC_GIFT_PREFS) {
      expect(known.has(p.npcId), p.npcId).toBe(true);
      for (const tag of [...p.loves, ...(p.likes ?? []), ...(p.dislikes ?? [])]) {
        if (!tag.startsWith('species:')) continue;
        const id = tag.slice(8);
        expect(FISH_DATABASE.some((f) => f.id === id) || SHORE_CREATURE_DATABASE.some((c) => c.id === id), tag).toBe(true);
      }
    }
  });
  it('고향 — 해녀 모녀는 제주, 아크 인물은 아크 지역, 주역은 속초', () => {
    expect(giftHomeRegionOf('bu_sundeok')).toBe('jeju');
    expect(giftHomeRegionOf('go_manseok')).toBe('ulsan');
    expect(giftHomeRegionOf('okseon')).toBe('gangwon_sokcho');
  });
});

describe('297 반응 판정', () => {
  const okseon = giftPrefOf('okseon');
  it('싫어함 > 아주 좋아함 > 좋아함 > 고향 특산 > 보통', () => {
    expect(giftReaction(okseon, { id: 'x', nameKo: 'x', tags: ['kind:coffee', 'kind:fish'] }, 'gangwon_sokcho')).toBe('dislike');
    expect(giftReaction(okseon, { id: 'x', nameKo: 'x', tags: ['item:shop_makgeolli', 'kind:drink'] }, 'gangwon_sokcho')).toBe('love');
    expect(giftReaction(okseon, { id: 'x', nameKo: 'x', tags: ['kind:fish', 'species:halibut'] }, 'gangwon_sokcho')).toBe('like');
    expect(giftReaction(okseon, { id: 'x', nameKo: 'x', tags: ['kind:sweet'] }, 'gangwon_sokcho')).toBe('neutral');
  });
  it('고향 특산 — 그 지역에서 얻은 것만 좋아함(표에 없어도)', () => {
    const haena = giftPrefOf('go_haena');   // 울산 — 방어진 방어는 표에 없다
    const v = { id: 'x', nameKo: '방어', tags: ['kind:fish', 'species:yellowtail', 'specialty:ulsan_yellowtail'], originRegion: 'ulsan' };
    expect(giftReaction(haena, v, 'ulsan')).toBe('like');
    expect(giftReaction(haena, { ...v, originRegion: 'jeju' }, 'ulsan')).toBe('like');   // 어획물은 kind:fish로 좋아함
    const sera = giftPrefOf('oh_sera');   // 울릉 — fish 꼬리표 없음
    const sq = { id: 'x', nameKo: '오징어', tags: ['kind:fish', 'specialty:ulleung_squid'], originRegion: 'ulleungdo' };
    expect(giftReaction(sera, sq, 'ulleungdo')).toBe('like');
    expect(giftReaction(sera, { ...sq, originRegion: 'gangwon_sokcho' }, 'ulleungdo')).toBe('neutral');
  });
  it('말은 Ko/En 쌍 · 우호도 변화 · 하루 한 번 · 칭호 문턱', () => {
    expect(giftLine(okseon, 'love')[0].length).toBeGreaterThan(0);
    expect(giftLine(undefined, 'dislike')[1].length).toBeGreaterThan(0);
    expect(GIFT_AFFINITY.love).toBeGreaterThan(GIFT_AFFINITY.like);
    expect(GIFT_AFFINITY.dislike).toBeLessThan(0);
    expect(canGiftToday(undefined, undefined, 3)).toBe(true);
    expect(canGiftToday(3, 1, 3)).toBe(false);
    expect(canGiftToday(2, 1, 3)).toBe(true);
    expect(giftTitleGoals()).toEqual({ half: 22, all: 44 });
    const santa = TITLE_DATABASE.find((t) => t.id === 'santa')!;
    expect(santa.paths[0][0]).toEqual({ stat: 'giftLoved', goal: 44 });
    expect(titleModifiers(santa).giftMult).toBeCloseTo(1.5);
    expect(titleModifiers(santa).buyMult).toBeCloseTo(0.97);   // 297(2) — 박애주의자는 가게 값도 깎는다
    expect(titleEffectLabelKo(santa)).toBe('선물 우호도 +50% · 상점 구매가 -3%');
    expect(santa.nameKo).toBe('박애주의자');
    expect(TITLE_DATABASE.find((t) => t.id === 'gift_bundle')?.nameKo).toBe('산타');
  });
});
