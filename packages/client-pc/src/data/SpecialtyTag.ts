/**
 * @file SpecialtyTag.ts
 * @description 295차 — 명산지 꼬리표(사용자 지시 「명산지 꼬리표」). 어획물 · 갯것 · 농산물 · 가공품이 **얻은 지역의 특산**이면
 *  표시 이름 앞에 지역 짧은 이름을 붙이고(「부산 고등어 (32cm)」), 가방 칸에는 명산지 도장 아이콘, 위판 카드에는 「○○ 특산」이 선다.
 *
 *  판정은 core `specialtyOf(key, originRegion)` 하나다 — 열쇠는 어획물 · 갯것 = `speciesId`, 농산물 = 수확물 기본 id, 가공품 = 아이템 id.
 *  `InvItem.name`은 고정 문자열이라(얻을 때 한 번) 이름을 바꾸지 않고 **보일 때** 붙인다 — 번역 규칙(「(Ncm)」) · 등급 꼬리(「 · 특」)가 그대로 산다.
 */

import { specialtyOf, getRegionById, parseProduceId, type RegionalSpecialtyDef } from '@tra/core';

/** 농산물 소분류(`CropItems.PRODUCE_SUB`와 같은 글자 — 순환 import를 피하려고 여기 적는다) */
const PRODUCE_SUB = '농산물';

export interface SpecialtyTag {
  def: RegionalSpecialtyDef;
  regionId: string;
  /** 지역 짧은 이름(「부산」 · 「제주」) */
  short: string;
}

export type SpecialtyTaggable = { id: string; speciesId?: string; subCategory?: string; originRegion?: string };

/** 특산 판정 열쇠 — 어획물 · 갯것은 종 id · 농산물은 수확물 기본 id · 그 밖(가공품)은 아이템 id */
export function specialtyKeyOf(item: SpecialtyTaggable): string | undefined {
  if (item.speciesId) return item.speciesId;
  if (item.subCategory === PRODUCE_SUB) return parseProduceId(item.id).baseId;
  return item.id;
}

/** 얻은 지역의 특산이면 꼬리표, 아니면 undefined */
export function specialtyTagOf(item: SpecialtyTaggable): SpecialtyTag | undefined {
  if (!item.originRegion) return undefined;
  const def = specialtyOf(specialtyKeyOf(item), item.originRegion);
  if (!def) return undefined;
  const short = getRegionById(item.originRegion)?.shortNameKo ?? '';
  return short ? { def, regionId: item.originRegion, short } : undefined;
}

/** 표시 이름 — 특산이면 「부산 고등어 (32cm)」(이미 지역으로 시작하면 그대로) */
export function specialtyDisplayName(item: SpecialtyTaggable & { name: string }): string {
  const tag = specialtyTagOf(item);
  if (!tag || item.name.startsWith(tag.short)) return item.name;
  return `${tag.short} ${item.name}`;
}

/** 위판 원산지 줄 — 특산이면 「부산 특산」, 아니면 얻은 지역 짧은 이름(없으면 출품 지역) */
export function specialtyOriginLabel(item: SpecialtyTaggable, fallback: string): string {
  const tag = specialtyTagOf(item);
  if (tag) return `${tag.short} 특산`;
  const short = item.originRegion ? getRegionById(item.originRegion)?.shortNameKo : undefined;
  return short ?? fallback;
}
