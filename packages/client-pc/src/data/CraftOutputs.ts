/**
 * @file CraftOutputs.ts
 * @description 제작 산출 아이템 템플릿 (129차 P7 — core `CRAFT_BLUEPRINTS.outputId` → 인벤토리 템플릿)
 *
 * core는 "무엇이 몇 개 나오는가"(id·수량)만 알고, **아이템의 생김새·분류·가격은 클라이언트가 갖는다**
 * (`@tra/core`에 인벤토리·렌더 개념을 들이지 않는다는 §3 규칙).
 *
 * 산출물이 **이미 상점에 있는 물건**(주조 봉돌·통발)이면 템플릿을 새로 쓰지 않고
 * 상점 카탈로그의 것을 그대로 재사용한다 — 같은 물건이 두 벌 정의되면 가격·스펙이 갈라진다.
 */

import type { InvItemTemplate } from '../store/InventoryStore.js';
import { SHOP_CATALOG } from './ShopCatalog.js';
import { applyItemVitals } from './ItemVitals.js';

/**
 * 제작 전용 산출물 (상점에 없는 것만).
 * ⚠ `InvItem` 에는 설명 필드가 없다 — 아이템 설명은 `ItemDetailPanel.buildItemDetail` 이
 * 분류에서 추론하고, 제작 목록의 설명은 도면(`CraftBlueprint.descKo/En`)이 갖는다.
 */
const CRAFT_ONLY: Record<string, InvItemTemplate> = {
  // ── 채비 묶음 (완성 채비 — 바늘 소켓에 그대로 장착) ──
  craft_rig_chinu: {
    id: 'craft_rig_chinu', name: '감성돔 묶음 채비 (수제)', icon: '', iconTexture: 'px:it_rig',
    category: 'tackle', subCategory: '바늘', basePrice: 2200, equippable: false,
  },
  craft_rig_blackfish: {
    id: 'craft_rig_blackfish', name: '벵에돔 목줄 채비 (수제)', icon: '', iconTexture: 'px:it_rig',
    category: 'tackle', subCategory: '바늘', basePrice: 2600, equippable: false,
  },
  craft_rig_surf: {
    id: 'craft_rig_surf', name: '원투 카드 채비 3단 (수제)', icon: '', iconTexture: 'px:it_rig',
    category: 'tackle', subCategory: '편대', basePrice: 5200, equippable: false,
  },

  // ── 구급품 (효과 수치는 data/ItemVitals.ts 가 단일 소스) ──
  craft_bandage: {
    id: 'craft_bandage', name: '수제 붕대', icon: '', iconTexture: 'px:it_bandage',
    category: 'consumable', subCategory: '구급품', basePrice: 3000, equippable: false,
  },
  craft_splint: {
    id: 'craft_splint', name: '수제 부목', icon: '', iconTexture: 'px:it_splint',
    category: 'consumable', subCategory: '구급품', basePrice: 7000, equippable: false,
  },
  craft_medicine: {
    id: 'craft_medicine', name: '수제 상비약', icon: '', iconTexture: 'px:it_medicine',
    category: 'consumable', subCategory: '구급품', basePrice: 6000, equippable: false,
  },

  // ── 고급 제작대 ──
  craft_lure_custom: {
    id: 'craft_lure_custom', name: '커스텀 미노우 (자개 도색)', icon: '', iconTexture: 'px:it_lure',
    category: 'tackle', subCategory: '루어', basePrice: 24000, equippable: false,
  },
  craft_egi_tuned: {
    id: 'craft_egi_tuned', name: '튜닝 에기 3.5호', icon: '', iconTexture: 'px:it_lure',
    category: 'tackle', subCategory: '루어', basePrice: 21000, equippable: false,
  },
  craft_rod_custom: {
    id: 'craft_rod_custom', name: '커스텀 로드 (수제)', icon: '', iconTexture: 'px:it_rod',
    category: 'gear', subCategory: '낚싯대', basePrice: 180000,
    equippable: true, tool: 'rod',
  },
  craft_reel_custom: {
    id: 'craft_reel_custom', name: '튜닝 스피닝릴 (수제)', icon: '', iconTexture: 'px:it_reel',
    category: 'gear', subCategory: '릴', basePrice: 160000, equippable: true,
  },
};

/** 상점 카탈로그 전체에서 id로 템플릿 찾기 (주조 봉돌·통발 재사용 경로) */
function fromShops(id: string): InvItemTemplate | null {
  for (const def of Object.values(SHOP_CATALOG)) {
    const e = def.sells.find((x) => x.id === id);
    if (e) {
      // price/maxPerPurchase/desc 중 상점 전용 필드는 그대로 둬도 InvItem 에 무해하지만,
      // 의미가 없으므로 인벤토리 템플릿 형태로만 넘긴다.
      const { price: _price, maxPerPurchase: _max, ...tpl } = e;
      return tpl;
    }
  }
  return null;
}

/** 산출 id → 인벤토리 템플릿. 모르는 id면 null (도면 검증에서 걸러진다) */
export function craftOutputTemplate(outputId: string): InvItemTemplate | null {
  const own = CRAFT_ONLY[outputId];
  if (own) return applyItemVitals({ ...own });
  return fromShops(outputId);
}

/** 제작 전용 산출물 id 목록 (무결성 검사·위키용) */
export const CRAFT_ONLY_IDS: string[] = Object.keys(CRAFT_ONLY);
