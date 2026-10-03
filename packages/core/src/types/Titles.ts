/**
 * @file Titles.ts
 * @description 타이틀(칭호) 업적 타입 (203차 — 사용자 지시 "히든 타이틀 업적").
 *
 * - **전부 히든**: 얻기 전에는 이름·조건이 보이지 않는다(R2 — 「??? × N」 개수만).
 * - 얻는 조건 = 행동 누적 수(`TitleStatKey`)가 목표(`goal`)에 닿는 것.
 * - 하나만 단다. 단 타이틀은 머리 위(내 캐릭터 · 멀티 피어)에 이름 위 작은 줄로 보인다.
 * - 효과는 **소소하게** — 레어도(흔함 · 드묾 · 전설)에 따라 크기가 정해진다(`TITLE_EFFECT_SCALE`).
 */

/** 레어도 — 이름표 색과 효과 크기를 정한다 */
export type TitleRarity = 'common' | 'rare' | 'legend';

/** 누적해서 세는 행동 */
export type TitleStatKey =
  /** 놓아준 고기 수(결정 패널 · 쿨러 · 정리 창 · 금지체장 자동 방생) */
  | 'release'
  /** 밤(22:00~03:59 KST)에 잡은 고기 수 */
  | 'nightCatch'
  /** 새벽(04:00~05:59 KST)에 던진 캐스팅 수 */
  | 'dawnCast'
  /** 60cm 이상 자가 어획 수 */
  | 'trophyCatch'
  /** 랜딩 중 바늘 빠짐(들어뽕) 수 */
  | 'landingDrop'
  /** 줄 터짐 수 */
  | 'lineBreak'
  /** 캐스팅은 했지만 한 마리도 못 잡고 끝난 출조 수 */
  | 'emptyTrip'
  /** 한 가게에서 거래(사기·팔기)한 최다 횟수 */
  | 'shopRegular'
  /** 별 다섯 사시미 접시 수 */
  | 'sashimiFiveStar'
  /** 고양이 쓰다듬기 수 */
  | 'catPet'
  /** 문 닫은 가게 앞에서 돌아선 수 */
  | 'closedDoor'
  /** 도감에 남긴 어종 수(누적이 아니라 지금 값) */
  | 'speciesFound';

/** 소소한 효과 종류 — 단 타이틀 하나만 적용된다 */
export type TitleEffectKind =
  /** 입질 확률 +N% */
  | 'biteRate'
  /** 밤(22:00~03:59) 입질 +N% */
  | 'nightBite'
  /** 새벽(04:00~07:59) 입질 +N% */
  | 'dawnBite'
  /** 줄 강도(견딜 수 있는 무게) +N% */
  | 'lineStrength'
  /** 랜딩 중 바늘 빠짐 확률 −N%(비율) */
  | 'landingDropCut'
  /** 상점 판매가 +N% */
  | 'sellPrice'
  /** 상점 구매가 −N% */
  | 'buyDiscount'
  /** 행동으로 쌓이는 피로 −N%(비율) */
  | 'fatigueCut';

export interface TitleDef {
  id: string;
  nameKo: string;
  nameEn: string;
  rarity: TitleRarity;
  /** 세는 행동 */
  stat: TitleStatKey;
  /** 이 수에 닿으면 얻는다 */
  goal: number;
  /** 얻었을 때 알림의 사연 한 줄(1인칭 — 정의문 요약 금지 R4) */
  storyKo: string;
  storyEn: string;
  effect: TitleEffectKind;
}

/** 행동 누적 수 — 세이브에 그대로 남는다(없는 키 = 0) */
export type TitleStats = Partial<Record<TitleStatKey, number>>;

/** 단 타이틀이 주는 배율 묶음(1 = 효과 없음) */
export interface TitleModifiers {
  biteMult: number;
  nightBiteMult: number;
  dawnBiteMult: number;
  lineMult: number;
  landingDropMult: number;
  sellMult: number;
  buyMult: number;
  fatigueMult: number;
}
