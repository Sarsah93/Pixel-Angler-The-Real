/**
 * @file Gift.ts
 * @description 297차 — 인물 선물 선호(사용자 결정 2026-11-02 — 「대화 선택지 선물하기 · 우호도만」).
 *
 *  선물은 대화창 「드리고 싶은 게 있어요」로 건넨다. 인물마다 아주 좋아함 · 좋아함 · 싫어함 꼬리표가 있고,
 *  그 사람 고향 특산(명산지 꼬리표가 붙은 것)은 데이터에 없어도 「좋아함」으로 친다. 효과는 **우호도만**(항구 신뢰 · 메인 진행에 안 걸린다).
 *  한 사람에게 이야기 날짜(잠) 하루에 한 번. 모든 사람에게 아주 좋아하는 것을 한 번씩 주면 칭호(「선물 보따리」 → 「동네 산타」).
 */

/** 받는 사람의 반응 */
export type GiftReaction = 'love' | 'like' | 'neutral' | 'dislike';

/**
 * 선물 종류 — 물건을 꼬리표로 묶는 큰 갈래.
 *  fish 어획물 · forage 갯것 · crop 농산물 · processed 가공품(과메기 등) · dish 불요리 · sashimi 회 · drink 술 · coffee 커피 ·
 *  sweet 단것(디저트 · 초코바) · snack 안주 · 주먹밥 · 통조림 · smoke 담배 · ingredient 식자재 · 양념
 */
export type GiftKind =
  | 'fish' | 'forage' | 'crop' | 'processed' | 'dish' | 'sashimi'
  | 'drink' | 'coffee' | 'sweet' | 'snack' | 'smoke' | 'ingredient';

/**
 * 선물 꼬리표 — `item:<아이템 id>` · `species:<어종 · 갯것 id>` · `specialty:<특산 id>` · `kind:<GiftKind>`.
 * 클라이언트가 가방 물건에서 뽑는다(`data/GiftTags.ts`). 데이터(취향 표)는 같은 문자열로 적는다.
 */
export type GiftTag = string;

/** 선물로 건네는 물건 한 칸 — 규칙이 보는 것만 */
export interface GiftItemView {
  id: string;
  nameKo: string;
  tags: readonly GiftTag[];
  /** 얻은 지역(명산지 꼬리표 — 294차 `InvItem.originRegion`) */
  originRegion?: string;
}

/** 인물 한 사람의 취향 */
export interface NpcGiftPrefDef {
  npcId: string;
  /** 아주 좋아함 — 하나 이상. 칭호는 이 가운데 하나를 받아 본 사람 수로 센다 */
  loves: readonly GiftTag[];
  likes?: readonly GiftTag[];
  dislikes?: readonly GiftTag[];
  /** 반응 말(그 사람 말투 · Ko/En) — love · like · neutral · dislike */
  lines: Readonly<Record<GiftReaction, readonly [string, string]>>;
  /** 오늘 이미 받았을 때(없으면 공통 말) */
  again?: readonly [string, string];
}

/** 한 사람에게 준 기록(세이브 — `StorySaveState.gifts`) */
export interface GiftLog {
  /** 마지막으로 준 이야기 날짜 */
  day: number;
  /** 준 횟수(전체) */
  count: number;
  /** `day`에 준 횟수(하루 한 번 판정) */
  today?: number;
  /** 아주 좋아하는 것을 받아 본 적이 있는가(칭호) */
  loved?: boolean;
  /** 알게 된 반응 — 물건 이름 → 반응(일지 수첩) */
  learned?: Record<string, GiftReaction>;
}
