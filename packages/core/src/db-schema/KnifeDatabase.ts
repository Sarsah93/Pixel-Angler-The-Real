/**
 * @file KnifeDatabase.ts
 * @description 회칼(사시미 칼) 등급 DB — 회뜨기 게이팅·수율 계수의 기준
 *
 * 회뜨기(장 뜨기/박피)·회썰기 단계는 인벤토리 '기타' 아이템에 회칼이 있을 때만 열린다.
 * 없으면 시메·방혈·손질(비늘/머리/내장)까지만 가능(ButcheryPanel에서 게이트).
 * 칼 등급이 높을수록 수율(toolYieldFactor)과 슬라이스 얇기(toolThinness)가 좋아진다.
 *
 * 순수 TS 데이터.
 */

import type { KnifeSpec } from '../types/Butchery.js';
import { itemBaseId } from '../rules/ItemInstance.js';

/** 회칼 등급 카탈로그 (id = 인벤토리 '기타' 아이템 id) */
export const KNIFE_SPECS: Record<string, KnifeSpec> = {
  // 범용/막칼 — 손질은 되나 낭비가 많음
  knife_utility: {
    id: 'knife_utility', nameKo: '범용 막칼', tier: 'utility',
    toolYieldFactor: 0.85, toolThinness: 0.8,
  },
  // 회칼(사시미) — 표준
  knife_sashimi: {
    id: 'knife_sashimi', nameKo: '회칼 (사시미)', tier: 'sashimi',
    toolYieldFactor: 1.0, toolThinness: 1.0,
  },
  // 장인 야나기바 — 얇게 많이 + 등급 보너스
  knife_yanagiba: {
    id: 'knife_yanagiba', nameKo: '장인 야나기바', tier: 'yanagiba',
    toolYieldFactor: 1.1, toolThinness: 1.25,
  },
  // 280차 — 상점 · 퀘스트 보상 회칼 두 자루가 표에 없어 손에 들어도 「회칼 없음 — 막칼」로 읽혔다
  //  야나기바 (장인 단조) — 식자재마트 해금(M1-07) · 수율 상한(1.15)
  knife_yanagiba_pro: {
    id: 'knife_yanagiba_pro', nameKo: '야나기바 (장인 단조)', tier: 'yanagiba',
    toolYieldFactor: 1.15, toolThinness: 1.35,
  },
  //  정옥선의 손질 칼 — 회 · 손질 이야기 보상(귀속) · 회칼과 야나기바 사이
  qr_knife_okseon: {
    id: 'qr_knife_okseon', nameKo: '정옥선의 손질 칼', tier: 'sashimi',
    toolYieldFactor: 1.05, toolThinness: 1.1,
  },
};

const KNIFE_TIER_RANK: Record<KnifeSpec['tier'], number> = {
  utility: 1, sashimi: 2, yanagiba: 3,
};

/**
 * 보유 아이템 id 목록에서 최고 등급 회칼을 반환한다.
 * 하나도 없으면 null → 회뜨기 게이트(회칼 필요).
 */
export function getBestKnife(inventoryItemIds: string[]): KnifeSpec | null {
  let best: KnifeSpec | null = null;
  for (const id of inventoryItemIds) {
    const k = KNIFE_SPECS[itemBaseId(id)];   // 282차 — 개체 칼(`knife_sashimi#2`)
    if (!k) continue;
    // 같은 등급이면 수율이 높은 칼(280차 — 장인 단조 > 장인 야나기바)
    if (!best || KNIFE_TIER_RANK[k.tier] > KNIFE_TIER_RANK[best.tier]
      || (KNIFE_TIER_RANK[k.tier] === KNIFE_TIER_RANK[best.tier] && k.toolYieldFactor > best.toolYieldFactor)) best = k;
  }
  return best;
}

/** 회칼 아이템인지 판별 (인벤토리/상점 표시용) */
export function isKnifeItem(itemId: string): boolean {
  return itemBaseId(itemId) in KNIFE_SPECS;
}
