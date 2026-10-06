/**
 * @file LegalSeason.ts
 * @description 227차 — 금어기(날짜 단위) · 지역 규정 타입.
 *
 * 금어기는 달 단위가 아니다(참문어 5.16~6.30 · 꽃게 6.21~8.20). 날짜 범위로 적고,
 * 시·도마다 다른 규정(제주 전복 10.1~12.31 · 각장 10cm 등)은 `regional`로 덮어쓴다.
 * 근거: 수산자원관리법 시행령 별표(포획·채취 금지기간 · 금지체장) — 227차 사용자 대조표.
 */

/** 월 · 일 (1~12, 1~31) */
export type MonthDay = readonly [number, number];

/** 금어기 한 구간 — `from`부터 `to`까지(양 끝 포함). from > to면 해를 넘긴다 */
export interface ClosedSeason {
  from: MonthDay;
  to: MonthDay;
}

/** 지역 규정 묶음 키 — 지금은 제주만 다르다(전복 · 소라 · 오분자기) */
export type LegalRegionKey = 'jeju';

/** 지역이 기본(국가) 규정을 덮어쓰는 값. 지정한 필드만 바뀐다 */
export interface RegionalLegalRule {
  closedSeasons?: ClosedSeason[];
  /** 금지체장(cm) — 0이면 없음 */
  minLegalSizeCm?: number;
  /** 금지체중(g) — 0이면 없음 */
  minLegalWeightG?: number;
}

/** 한 생물이 그 지역에서 따르는 규정(합쳐진 결과) */
export interface ResolvedLegalRule {
  closedSeasons: ClosedSeason[];
  minLegalSizeCm: number;
  minLegalWeightG: number;
}
