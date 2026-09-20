/**
 * @file WikiCatalog.ts
 * @description 아이템 위키 정적 카탈로그 — 시드 + 상점 전 품목 통합 목록
 *
 * 위키(도감)의 아이템 항목 단위는 "정적 카탈로그 id"다:
 * - 시드 아이템 (InventoryStore.seedCatalog) + 상점 판매 품목 (SHOP_CATALOG) dedup.
 * - 개체형 아이템(어획물·필렛 등 — id에 시퀀스가 붙는 것)은 카탈로그가 아니므로 제외.
 * - 발견 판정은 DiscoveryStore('item', id) — 취득 순간 기록된 raw id와 카탈로그 id가 일치.
 */

import type { InvCategory, InvItemTemplate } from '../store/InventoryStore.js';
import { LINE_DATABASE } from '@tra/core';
import { QUEST_REWARD_ITEMS } from './QuestRewardItems.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { SHOP_CATALOG, BUILDING_LABEL } from './ShopCatalog.js';

export interface WikiItemEntry {
  id: string;
  name: string;
  icon: string;
  iconTexture?: string;
  category: InvCategory;
  subCategory: string;
  basePrice: number;
  /** 설명 (상점 desc 우선) */
  desc?: string;
  /** 판매처 이름 목록 — 미발견 카드의 입수 힌트 */
  soldAt: string[];
  /** 시드(초기 지급) 여부 */
  isSeed: boolean;
  /** 원본 아이템 템플릿 — dev 콘솔 지급(addItem) 등 실지급용 */
  tpl: InvItemTemplate;
}

/** 개체형(비카탈로그) 소분류 — 위키 항목에서 제외 */
const INSTANCE_SUBCATS = new Set(['어획물']);

let cache: WikiItemEntry[] | null = null;

/** 아이템 위키 카탈로그 (1회 빌드 캐시 — 정적 데이터) */
export function buildItemWikiCatalog(): WikiItemEntry[] {
  if (cache) return cache;

  const map = new Map<string, WikiItemEntry>();

  // 1) 시드 품목
  for (const it of InventoryStore.seedCatalog()) {
    if (INSTANCE_SUBCATS.has(it.subCategory)) continue;
    // 시드 상태(착용·소켓)는 카탈로그에 싣지 않는다 — 지급 시 미착용 신품으로
    const { slot: _slot, qty: _qty, ...tpl } = it;
    map.set(it.id, {
      id: it.id, name: it.name, icon: it.icon, iconTexture: it.iconTexture,
      category: it.category, subCategory: it.subCategory, basePrice: it.basePrice,
      soldAt: [], isSeed: true,
      tpl: { ...tpl, equipped: false, equippedHand: undefined },
    });
  }

  // 2) 상점 품목 — 기존 항목엔 desc·판매처 병합, 신규는 추가
  for (const shop of Object.values(SHOP_CATALOG)) {
    const shopName = BUILDING_LABEL[shop.kind] ?? shop.name;
    for (const e of shop.sells) {
      const prev = map.get(e.id);
      if (prev) {
        if (!prev.desc && e.desc) prev.desc = e.desc;
        if (!prev.soldAt.includes(shopName)) prev.soldAt.push(shopName);
      } else {
        map.set(e.id, {
          id: e.id, name: e.name, icon: e.icon, iconTexture: e.iconTexture,
          category: e.category, subCategory: e.subCategory, basePrice: e.basePrice,
          desc: e.desc, soldAt: [shopName], isSeed: false,
          tpl: e,
        });
      }
    }
  }

  // 4) 스토리 보상 아이템 (141차) — 상점에 없고 이야기만 준다. 도감에는 '이야기가 준 물건'으로 표기
  for (const t of QUEST_REWARD_ITEMS) {
    if (map.has(t.id)) continue;
    map.set(t.id, {
      id: t.id, name: t.name, icon: t.icon, iconTexture: t.iconTexture,
      category: t.category, subCategory: t.subCategory, basePrice: t.basePrice,
      desc: t.bound ? '귀속 — 스토리 보상. 판매·양도 불가.' : '스토리 보상.', soldAt: [], isSeed: false,
      tpl: { ...t, equipped: false, equippedHand: undefined },
    });
  }

  // 5) SAISO AMSTRONG 라인 사양 — 실제 상점 품목과 별개로, dev F10에서
  // 108개 사양(호수·형태·스풀 길이)을 하나씩 지급해 실검증할 수 있도록 한다.
  // LINE_DATABASE는 장비실 전용 스펙 DB이므로 인벤토리 템플릿으로 변환해
  // WikiCatalog에 합류시킨다. id는 고유한 line_saiso_*라 기존 시드/상점과 충돌하지 않는다.
  for (const line of LINE_DATABASE) {
    if (map.has(line.id)) continue;
    const subCategory = line.material === 'fluorocarbon' ? '목줄 스풀' : '원줄 스풀';
    const tpl: InvItemTemplate = {
      id: line.id,
      name: line.modelName,
      icon: '줄',
      iconTexture: line.iconTexture,
      category: 'tackle',
      subCategory,
      basePrice: line.priceKRW,
      equippable: false,
      lineMaterial: line.material,
      lineForm: line.lineForm,
      lineLengthM: line.spoolLengthM,
      lineNo: line.lineNo,
      lineDiameterMm: line.diameterMm,
      lineStrengthLb: line.strengthLb,
    };
    map.set(line.id, {
      id: line.id,
      name: line.modelName,
      icon: '줄',
      iconTexture: line.iconTexture,
      category: 'tackle',
      subCategory,
      basePrice: line.priceKRW,
      desc: `${line.brand} ${line.modelName} · 직경 ${line.diameterMm.toFixed(3)}mm · 인장 ${line.strengthLb}lb`,
      soldAt: ['채비 검증 카탈로그'],
      isSeed: false,
      tpl,
    });
  }

  cache = [...map.values()];
  return cache;
}

/** 카테고리별 카탈로그 (subCategory → 이름 순 정렬) */
export function itemWikiByCategory(cat: InvCategory): WikiItemEntry[] {
  return buildItemWikiCatalog()
    .filter((e) => e.category === cat)
    .sort((a, b) => a.subCategory.localeCompare(b.subCategory) || a.name.localeCompare(b.name));
}
