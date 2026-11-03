/**
 * @file RegionStall.ts
 * @description 295차 — 산지 매대(사용자 지시 「산지 매대와 택배 차익」). 그 지역 직판장(`market`)은 그 지역 특산 가공품을 판다 —
 *  과메기는 구룡포에서, 오징어순대는 속초에서. 산 것은 `catchMethod: 'bought'`라 되팔지 못한다(택배 차익은 직접 잡고 가공한 것만).
 */

import { specialtiesOfRegion, activeFestivalsOfRegion, festivalPeriodLabel, FESTIVAL_STALL_OFF } from '@tra/core';
import { festivalNow } from './FestivalClock.js';   // 298차
import type { ShopEntry } from './ShopCatalog.js';
import { processedItemTemplate } from './ProcessedItems.js';

/** 이 지역 직판장 매대에 올릴 가공품(없으면 빈 목록) */
export function regionStallEntries(regionId: string): ShopEntry[] {
  const out: ShopEntry[] = [];
  // 298차 — 축제 매대: 그 축제의 가공품은 축제 달 20% · 절정 주 30% 싸다
  const fests = activeFestivalsOfRegion(regionId, festivalNow());
  for (const d of specialtiesOfRegion(regionId)) {
    if (d.kind !== 'processed') continue;
    const fest = fests.find((f) => f.def.specialtyIds.includes(d.id));
    const off = fest ? FESTIVAL_STALL_OFF[fest.phase] : 0;
    for (const id of d.keys) {
      const tpl = processedItemTemplate(id);
      if (!tpl) continue;
      const desc = fest ? `축제 매대 — ${fest.def.nameKo}(${festivalPeriodLabel(fest.def)}) · ${Math.round(off * 100)}% 싸게 · ${d.nameKo}` : `${d.nameKo} — ${d.noteKo}`;
      out.push({ ...tpl, price: Math.round(tpl.basePrice * 1.2 * (1 - off) / 100) * 100, catchMethod: 'bought', maxPerPurchase: 5, desc });
    }
  }
  return out;
}
