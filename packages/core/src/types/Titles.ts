/**
 * @file Titles.ts
 * @description 타이틀(칭호) 업적 타입 (203차 신설 · 204차 재설계 — 사용자 지시 「문턱·네이밍·추가」).
 *
 * - **전부 히든**: 얻기 전에는 이름·조건이 보이지 않는다(R2 — 「??? × N」 개수만).
 * - 얻는 조건 = **경로(paths) 중 하나**를 다 채우는 것 — 경로 = 「누적 수 ≥ 목표」 여럿의 AND.
 *   경로를 여럿 두면 한 가지 플레이만 강요하지 않는다(204차 — 「다른 방법으로 완화」).
 * - 전설은 레벨 문턱(`minLevel`)까지 넘어야 한다 — 초반 저레벨에 전설을 얻는 일이 없게.
 * - 하나만 단다. 단 타이틀은 머리 위(내 캐릭터 · 멀티 피어)에 이름 위 작은 줄로 보인다.
 * - 효과는 **소소하게** — 레어도(흔함 · 드묾 · 전설)에 따라 크기가 정해진다(`TITLE_EFFECT_SCALE`).
 */

import type { TideFlowPhase } from './TideFlow.js';

/** 레어도 — 이름표 색과 효과 크기를 정한다 */
export type TitleRarity = 'common' | 'rare' | 'legend';

/** 누적해서 세는 행동 */
export type TitleStatKey =
  /** 놓아준 고기 수(결정 패널 · 쿨러 · 정리 창 · 금지체장 자동 방생) */
  | 'release'
  /** 밤(20:00~03:59 KST)에 잡은 고기 수 */
  | 'nightCatch'
  /** 새벽(02:00~05:59 KST)에 던진 캐스팅 수 — 밤 시간과 02~04시가 겹친다(한 번에 둘 다 쌓인다) */
  | 'dawnCast'
  /** 대물 점수 — 60cm대 1 · 70cm대 3 · 80cm 이상 6(큰 놈일수록 빨리 찬다) */
  | 'trophyPts'
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
  /** 도감에 남긴 바다 생물 수(어종 + 채집 생물 — 누적이 아니라 지금 값) */
  | 'speciesFound'
  // ── 204차 물때 ──
  /** 초들물에 잡은 고기 */
  | 'floodEarlyCatch'
  /** 물돌이(만조·간조)에 잡은 50cm 이상 */
  | 'slackBigCatch'
  /** 중들물·중날물(물살 거셀 때)에 잡은 고기 */
  | 'midFlowCatch'
  /** 끝날물에 잡은 고기 */
  | 'ebbLateCatch'
  /** 8단계 중 10마리 이상 잡아 본 단계 수(지금 값) */
  | 'phasesCovered'
  /** 사리(6~9물)에 잡은 고기 */
  | 'springCatch'
  /** 조금(12~15물)에 잡은 고기 */
  | 'neapCatch'
  // ── 204차 그 밖의 플레이 ──
  /** 비·눈 오는 날 잡은 고기 */
  | 'foulCatch'
  /** 구멍치기(테트라포드·사석 틈)로 잡은 고기 */
  | 'holeCatch'
  /** 두 마리 이상 한 번에 올린 쌍걸이 */
  | 'doubleHook'
  /** 채집(해루질) 성공 */
  | 'forage'
  /** 통발 수거 */
  | 'trapHarvest'
  /** 불요리 완성 */
  | 'cookDone'
  /** 원물 손질 완료 */
  | 'butcherDone'
  /** 위판(경매) 낙찰된 출품 */
  | 'auctionSold'
  /** 쓰러진(기절) 수 */
  | 'faint'
  /** 가진 자격(면허) 수(지금 값) */
  | 'licenses'
  /** 얻은 다른 타이틀 수(지금 값) */
  | 'titlesOwned';

/** 소소한 효과 종류 — 단 타이틀 하나만 적용된다 */
export type TitleEffectKind =
  /** 입질 확률 +N% */
  | 'biteRate'
  /** 밤(20:00~03:59) 입질 +N% */
  | 'nightBite'
  /** 새벽(02:00~05:59) 입질 +N% */
  | 'dawnBite'
  /** 정해진 물때 단계(`effectPhases`) 입질 +N% */
  | 'phaseBite'
  /** 비·눈 오는 날 입질 +N% */
  | 'foulBite'
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

/** 조건 한 칸 — 누적 수 ≥ 목표 */
export interface TitleReq {
  stat: TitleStatKey;
  goal: number;
}

export interface TitleDef {
  id: string;
  nameKo: string;
  nameEn: string;
  rarity: TitleRarity;
  /** 얻는 경로 — 하나라도 그 안의 조건을 전부 채우면 얻는다 */
  paths: TitleReq[][];
  /** 이 레벨 이상이어야 얻는다(전설 — 저레벨 획득 방지) */
  minLevel?: number;
  /** 얻었을 때 알림의 사연 한 줄(1인칭 — 정의문 요약 금지 R4) */
  storyKo: string;
  storyEn: string;
  effect: TitleEffectKind;
  /** `phaseBite`가 듣는 물때 단계 */
  effectPhases?: TideFlowPhase[];
}

/** 행동 누적 수 — 세이브에 그대로 남는다(없는 키 = 0) */
export type TitleStats = Partial<Record<TitleStatKey, number>>;

/** 단 타이틀이 주는 배율 묶음(1 = 효과 없음) */
export interface TitleModifiers {
  biteMult: number;
  nightBiteMult: number;
  dawnBiteMult: number;
  /** `phases` 단계에서만 곱하는 입질 배율 */
  phaseBiteMult: number;
  phases: TideFlowPhase[];
  /** 비·눈 오는 날 입질 배율 */
  foulBiteMult: number;
  lineMult: number;
  landingDropMult: number;
  sellMult: number;
  buyMult: number;
  fatigueMult: number;
}
