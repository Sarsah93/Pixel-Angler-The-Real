/**
 * @file RegionalPlots.ts
 * @description 300차 — 지역 텃밭 1단계: **그 고장 종묘사에서 빌리는 밭 한 구획**(창 관리형).
 *
 *  295차 특산(산지 봉인)은 「그 고장에서 거둔 것」에만 찍힌다 — 그런데 텃밭은 홈타운 마당뿐이라
 *  포항초 · 대저 토마토 · 구좌 당근 같은 **작물 특산은 기를 길이 없었다**(백로그 DE 「지역 텃밭 제한」).
 *  1단계는 필드에 밭을 그리지 않는다 — 종묘사 안 창구([F])에서 **구획 하나(4칸)를 주 단위 사용료로 빌리고**,
 *  같은 창구에서 텃밭 창을 열어 심고 거둔다. 물은 종묘사가 준다(빗물통 설비와 같은 효과 — 흙이 절반 아래로 마르지 않는다).
 *  밭은 멀리 가 있어도 자란다(텃밭 전체가 벽시계). 거둔 것은 그 고장 산지 봉인(`originRegion`)을 받는다.
 *
 *  - 사용료는 **일주일 단위 선납**. 창을 열 때마다 밀린 주를 자동으로 낸다(돈이 있으면). 못 내면 **새로 심지 못한다**(거두기 · 물 주기는 된다).
 *  - 돌려주기는 심어 둔 것이 없을 때만. 돌려주면 계약 · 밭이 사라진다(설비는 종묘사 것 — 돌려받지 않는다).
 *  - 예시 창 `docs/mockups/regional_plot_window.svg`(사용자 의견 대기) — 창 구조는 바꾸기 쉽게 `FarmPanel`의 「빌린 밭」 갈래로 둔다.
 *  ⚠ 렌더 · 브라우저 API 금지 — 데이터와 순수 계산뿐이다.
 */

/** 한 고장의 빌릴 밭 */
export interface RegionalPlotOffer {
  /** 전국 지도 지역 id(`REGION_AREA_NODES` · `GameState.currentRegionId`) */
  regionId: string;
  /** 빌려주는 종묘사(게임 상호 — 손 POI `manual_pois.json`의 이름과 같아야 창구가 열린다) */
  nurseryKo: string;
  nurseryEn: string;
  /** 주인 이름(창에만 보인다 — 필드 인물은 아니다) */
  ownerKo: string;
  ownerEn: string;
  /** 주 사용료(원 · 선납) */
  weeklyFeeWon: number;
  /** 흙 · 바람 한 줄(창 머리) */
  soilKo: string;
  soilEn: string;
  /** 칸 수(1단계 = 4 — 2×2) */
  cells: number;
}

/** 빌릴 수 있는 고장(작물 특산이 있는 데이터 지역 — 인천 · 속초(마당)는 없다) */
export const REGIONAL_PLOT_OFFERS: readonly RegionalPlotOffer[] = [
  { regionId: 'gyeongbuk_pohang', nurseryKo: '구룡포 종묘사', nurseryEn: 'Guryongpo Seed & Seedling', ownerKo: '권덕수', ownerEn: 'Kwon Deok-su',
    weeklyFeeWon: 3_000, soilKo: '해풍 · 사질토', soilEn: 'Sea breeze · sandy soil', cells: 4 },
  { regionId: 'busan', nurseryKo: '명지 종묘사', nurseryEn: 'Myeongji Seed & Seedling', ownerKo: '하정수', ownerEn: 'Ha Jeong-su',
    weeklyFeeWon: 3_000, soilKo: '낙동강 하구 · 충적토', soilEn: 'Nakdong estuary · alluvial soil', cells: 4 },
  { regionId: 'jeonnam_yeosu', nurseryKo: '여수 종묘사', nurseryEn: 'Yeosu Seed & Seedling', ownerKo: '장보름', ownerEn: 'Jang Bo-reum',
    weeklyFeeWon: 3_000, soilKo: '남해 바람 · 황토', soilEn: 'South-sea wind · red clay', cells: 4 },
  { regionId: 'chungnam_taean', nurseryKo: '안흥 종묘사', nurseryEn: 'Anheung Seed & Seedling', ownerKo: '오만복', ownerEn: 'Oh Man-bok',
    weeklyFeeWon: 3_000, soilKo: '서해 바람 · 마사토', soilEn: 'West-sea wind · granite soil', cells: 4 },
  { regionId: 'jeju', nurseryKo: '제주 종묘사', nurseryEn: 'Jeju Seed & Seedling', ownerKo: '고순희', ownerEn: 'Ko Sun-hui',
    weeklyFeeWon: 3_000, soilKo: '화산회토 · 바람막이', soilEn: 'Volcanic ash soil · windbreak', cells: 4 },
  { regionId: 'ulleungdo', nurseryKo: '도동 종묘사', nurseryEn: 'Dodong Seed & Seedling', ownerKo: '최바우', ownerEn: 'Choi Ba-u',
    weeklyFeeWon: 3_000, soilKo: '산비탈 · 부엽토', soilEn: 'Hillside · leaf mould', cells: 4 },
];

export function regionalPlotOffer(regionId: string | null | undefined): RegionalPlotOffer | undefined {
  return regionId ? REGIONAL_PLOT_OFFERS.find((o) => o.regionId === regionId) : undefined;
}

/** 텃밭 스토어의 구획 id — 마당 구획(설치물 id) · 집 안(`indoor`)과 겹치지 않는 접두 */
export const REGIONAL_PLOT_PREFIX = 'rent:';

export function regionalPlotId(regionId: string): string {
  return `${REGIONAL_PLOT_PREFIX}${regionId}`;
}

export function isRegionalPlotId(plotId: string): boolean {
  return plotId.startsWith(REGIONAL_PLOT_PREFIX);
}

/** 구획 id → 고장(빌린 밭이 아니면 null) */
export function regionOfRegionalPlot(plotId: string): string | null {
  return isRegionalPlotId(plotId) ? plotId.slice(REGIONAL_PLOT_PREFIX.length) : null;
}

/** 사용료 한 주(벽시계 — 텃밭 시간과 같다) */
export const PLOT_RENT_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/** 빌린 밭 계약(세이브) */
export interface RegionalPlotContract {
  regionId: string;
  /** 빌린 때 */
  startedMs: number;
  /** 이때까지 냈다 — 이 시각이 지나면 한 주가 밀린 것 */
  paidUntilMs: number;
}

/** 새 계약 — 첫 주를 바로 낸 것으로(값 치르기는 호출 쪽) */
export function newPlotContract(regionId: string, nowMs: number): RegionalPlotContract {
  return { regionId, startedMs: nowMs, paidUntilMs: nowMs + PLOT_RENT_PERIOD_MS };
}

/** 밀린 주 수(0 = 밀리지 않았다) */
export function plotRentDueWeeks(c: RegionalPlotContract, nowMs: number): number {
  if (nowMs < c.paidUntilMs) return 0;
  return Math.floor((nowMs - c.paidUntilMs) / PLOT_RENT_PERIOD_MS) + 1;
}

export interface PlotRentSettle {
  /** 이번에 낸 주 수 · 돈 */
  paidWeeks: number;
  paidWon: number;
  /** 다 못 내 아직 밀려 있다(새로 심지 못한다) */
  overdue: boolean;
  /** 남은 밀린 주 */
  dueWeeks: number;
}

/**
 * 밀린 주를 차례로 낸다 — `pay`가 false를 돌려주면(돈이 모자라면) 거기서 멈춘다. 계약을 제자리에서 고친다.
 * 한 번에 많이 밀렸어도(오래 안 왔다) 주 단위로 다 센다 — 밭은 그동안도 자랐다.
 */
export function settlePlotRent(c: RegionalPlotContract, nowMs: number, weeklyFeeWon: number, pay: (won: number) => boolean): PlotRentSettle {
  let paidWeeks = 0;
  while (nowMs >= c.paidUntilMs) {
    if (!pay(weeklyFeeWon)) break;
    c.paidUntilMs += PLOT_RENT_PERIOD_MS;
    paidWeeks++;
  }
  const dueWeeks = plotRentDueWeeks(c, nowMs);
  return { paidWeeks, paidWon: paidWeeks * weeklyFeeWon, overdue: dueWeeks > 0, dueWeeks };
}

/** 표 검사(시험 · 부팅) — 고장 중복 · 칸 수 · 사용료 */
export function validateRegionalPlotOffers(offers: readonly RegionalPlotOffer[] = REGIONAL_PLOT_OFFERS): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const o of offers) {
    if (seen.has(o.regionId)) out.push(`고장 중복: ${o.regionId}`);
    seen.add(o.regionId);
    if (!(o.cells >= 1 && o.cells <= 12)) out.push(`칸 수 범위 밖: ${o.regionId} ${o.cells}`);
    if (!(o.weeklyFeeWon > 0)) out.push(`사용료 0: ${o.regionId}`);
    if (!o.nurseryKo || !o.nurseryEn || !o.ownerKo) out.push(`이름 빈칸: ${o.regionId}`);
  }
  return out;
}
