/**
 * 263차 — 지역 장 잠금: 장이 여는 지역 · 구역 노드가 있어야 열림 · 장 번호 순서.
 */
import { describe, it, expect } from 'vitest';
import { STORY_CHAPTERS, chapterOfRegion, isRegionOpenAtChapter } from './StoryChapters.js';
import { STORY_QUESTS } from './StoryQuestDatabase.js';
import { REGION_AREA_NODES } from '../types/WorldMap.js';

describe('지역 장 잠금 (263차)', () => {
  it('장마다 여는 지역이 있고, 지역은 한 장에만 속한다', () => {
    const seen = new Map<string, number>();
    for (const ch of STORY_CHAPTERS) {
      expect(ch.regionIds.length).toBeGreaterThan(0);
      for (const r of ch.regionIds) { expect(seen.has(r)).toBe(false); seen.set(r, ch.chapter); }
    }
    expect(chapterOfRegion('gangwon_sokcho')).toBe(1);
    expect(chapterOfRegion('busan')).toBe(2);
    expect(chapterOfRegion('jeju')).toBe(5);
    expect(chapterOfRegion('hometown')).toBeUndefined();
  });

  it('1장에는 속초만, 2장부터 부산 — 구역 노드가 없는 울릉 · 독도는 장이 와도 닫혀 있다', () => {
    expect(isRegionOpenAtChapter('gangwon_sokcho', 1)).toBe(true);
    expect(isRegionOpenAtChapter('busan', 1)).toBe(false);
    expect(isRegionOpenAtChapter('busan', 2)).toBe(true);
    expect(isRegionOpenAtChapter('jeju', 4)).toBe(false);
    expect(isRegionOpenAtChapter('jeju', 5)).toBe(true);
    expect(isRegionOpenAtChapter('ulleungdo', 7)).toBe(REGION_AREA_NODES['ulleungdo'] !== undefined && REGION_AREA_NODES['ulleungdo'].length > 0);
    expect(isRegionOpenAtChapter('hometown', 1)).toBe((REGION_AREA_NODES['hometown']?.length ?? 0) > 0);
  });

  it('퀘스트의 무대 지역은 그 퀘스트의 장에서 이미 열려 있다(장 잠금이 이야기를 막지 않는다)', () => {
    for (const q of STORY_QUESTS) {
      const ch = chapterOfRegion(q.region);
      if (ch === undefined) continue;
      expect(ch, `${q.id} ${q.region}`).toBeLessThanOrEqual(q.chapter);
      for (const o of q.objectives) {
        if (o.kind === 'visit' && o.placeKey?.startsWith('region:')) {
          const rc = chapterOfRegion(o.placeKey.slice('region:'.length));
          if (rc !== undefined) expect(rc, `${q.id} ${o.placeKey}`).toBeLessThanOrEqual(q.chapter);
        }
      }
    }
  });
});
