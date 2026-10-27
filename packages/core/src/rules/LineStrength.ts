/**
 * @file LineStrength.ts
 * @description 낚싯줄 세기 — **호수가 기준**이다(281차 사용자 결정 「n호수로 하고, lb까지 표시」).
 *
 * 한 줄의 세기는 호수 하나에서 나온다. 낚시 물리(파이팅 텐션 · 마모)와 상세 창 · 위키 · 상점 설명이
 * 모두 이 표를 쓴다 — 280차 점검 때 물리는 「호수 × 1.8kg」, 상세 창은 제원 lb(카본 3.5lb/호 · 합사 17.5lb/호)로
 * 세기가 둘이었다(백로그 CY).
 *
 * 기준값(일본식 호수 규격의 통상값):
 *  - 나일론 · 카본(모노라인) 1호 ≈ 4lb ≈ **1.8kg**
 *  - PE 합사 1호 ≈ 20lb ≈ **9kg**(합사는 원줄이 목줄보다 늘 강하다)
 * lb는 kg에서 환산해 정수로 반올림한 **표시값**이다 — 판정은 kg로 한다.
 */

/** 모노라인(나일론 · 카본) 1호당 세기(kg) */
export const MONO_LINE_KG_PER_HO = 1.8;
/** PE 합사 1호당 세기(kg) */
export const PE_LINE_KG_PER_HO = 9;
/** kg → lb */
export const KG_TO_LB = 2.20462;

/** 세기를 잴 수 있는 줄 아이템의 최소 모양 */
export interface LineStrengthSource {
  name: string;
  /** 호수(있으면 이름보다 우선) */
  lineNo?: number;
  /** 재질(있으면 이름보다 우선) */
  lineMaterial?: 'nylon' | 'fluorocarbon' | 'pe_braid' | string;
  /** 따로 정한 세기(kg) — 있으면 그것을 쓴다(특수 아이템용) */
  lineStrengthKg?: number;
}

/** 줄의 호수 — `lineNo` 필드, 없으면 이름의 「N호」. 모르면 null */
export function lineHoOf(item: LineStrengthSource): number | null {
  if (item.lineNo !== undefined && item.lineNo > 0) return item.lineNo;
  const m = /(\d+(?:\.\d+)?)\s*호/.exec(item.name);
  return m ? parseFloat(m[1]) : null;
}

/** PE 합사인지 — 재질 필드, 없으면 이름(「PE」 · 「합사」) */
export function isPeLine(item: LineStrengthSource): boolean {
  if (item.lineMaterial) return item.lineMaterial === 'pe_braid';
  return /PE|합사/i.test(item.name);
}

/** 호수 → 세기(kg) */
export function lineKgFromHo(ho: number, pe: boolean): number {
  return ho * (pe ? PE_LINE_KG_PER_HO : MONO_LINE_KG_PER_HO);
}

/** 세기(kg) → 표시 lb(정수 반올림) */
export function lineLbFromKg(kg: number): number {
  return Math.round(kg * KG_TO_LB);
}

/** 호수 → 표시 lb(정수) */
export function lineLbFromHo(ho: number, pe: boolean): number {
  return lineLbFromKg(lineKgFromHo(ho, pe));
}

/** 줄 아이템의 세기(kg) — 판정용. 호수를 모르면 null */
export function lineStrengthKgOf(item: LineStrengthSource | null | undefined): number | null {
  if (!item) return null;
  if (item.lineStrengthKg && item.lineStrengthKg > 0) return item.lineStrengthKg;
  const ho = lineHoOf(item);
  return ho === null ? null : lineKgFromHo(ho, isPeLine(item));
}

/** 줄 아이템의 표시 세기 — 호수 · lb · kg(소수 한 자리). 호수를 모르면 null */
export function lineStrengthView(item: LineStrengthSource | null | undefined): { ho: number | null; lb: number; kg: number } | null {
  if (!item) return null;
  const kg = lineStrengthKgOf(item);
  if (kg === null) return null;
  return { ho: lineHoOf(item), lb: lineLbFromKg(kg), kg: Math.round(kg * 10) / 10 };
}
