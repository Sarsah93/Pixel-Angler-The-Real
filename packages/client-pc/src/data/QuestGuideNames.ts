/**
 * @file QuestGuideNames.ts
 * @description core `objectiveHowToKo`에 넘기는 이름 조회 묶음 (155차) — 일지·대화창·필드 추적기가 공유한다.
 * core는 인물·일감·지역만 알고 아이템 이름과 장소 라벨은 클라 데이터에 있으므로 여기서 잇는다.
 */

import { getStoryNpc, getDayJob, getRegionById, WORLD_NODE_DATABASE, type GuideNames } from '@tra/core';
import { buildItemWikiCatalog } from './WikiCatalog.js';
import { STORY_PLACES } from './StoryNpcs.js';

const itemNameCache = new Map<string, string>();

export const GUIDE_NAMES: GuideNames = {
  npcName: (id) => getStoryNpc(id)?.nameKo ?? id,
  itemName: (id) => {
    const hit = itemNameCache.get(id);
    if (hit) return hit;
    const n = buildItemWikiCatalog().find((w) => w.id === id)?.name ?? id;
    itemNameCache.set(id, n);
    return n;
  },
  regionName: (id) => (id === 'hometown' ? '숙소(집)' : getRegionById(id)?.nameKo ?? WORLD_NODE_DATABASE.find((n) => n.id === id)?.name ?? id),
  jobName: (id) => getDayJob(id)?.nameKo ?? id,
  placeName: (key) => STORY_PLACES.find((p) => p.key === key)?.labelKo ?? key.replace(/^poi:/, ''),
};
