/**
 * @file RegionStall.ts
 * @description 295차 — 산지 매대(사용자 지시 「산지 매대와 택배 차익」). 그 지역 직판장(`market`)은 그 지역 특산 가공품을 판다 —
 *  과메기는 구룡포에서, 오징어순대는 속초에서. 산 것은 `catchMethod: 'bought'`라 되팔지 못한다(택배 차익은 직접 잡고 가공한 것만).
 */

import { specialtiesOfRegion } from '@tra/core';
import type { ShopEntry } from './ShopCatalog.js';
import { processedItemTemplate } from './ProcessedItems.js';

/** 이 지역 직판장 매대에 올릴 가공품(없으면 빈 목록) */
export function regionStallEntries(regionId: string): ShopEntry[] {
  const out: ShopEntry[] = [];
  for (const d of specialtiesOfRegion(regionId)) {
    if (d.kind !== 'processed') continue;
    for (const id of d.keys) {
      const tpl = processedItemTemplate(id);
      if (!tpl) continue;
      out.push({ ...tpl, price: Math.round(tpl.basePrice * 1.2 / 100) * 100, catchMethod: 'bought', maxPerPurchase: 5, desc: `${d.nameKo} — ${d.noteKo}` });
    }
  }
  return out;
}
