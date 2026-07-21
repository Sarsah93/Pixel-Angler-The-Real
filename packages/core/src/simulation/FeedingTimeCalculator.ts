/**
 * @file FeedingTimeCalculator.ts
 * @description 피딩타임(먹이 활성) 계산기 — 계절 시간창 × 물때/조류 × 날씨
 *
 * 현재 시각/계절/물때/조류/날씨로 **활성도 배율(feedingActivity)** 을 산출한다.
 * 이 값은 입질 확률(FishBiteEngine/BiteProbabilityEngine 배율)과
 * 보일링·스쿨링 필드 이벤트 발생 확률의 공통 입력이 된다.
 *
 * 실데이터 기반 (2026-07 리서치):
 *  - 계절별 골든타임: 봄 07~10/15~18 · 여름 04~07/18~21(한낮 12~17 최저, 야간 21~24 보조)
 *    · 가을 05~08/14~18(종일 활성) · 겨울 11~14 한낮 집중(새벽·저녁 저조)
 *  - 조류: 들물 초반↑ → 만조 1시간 전후 최고 → 썰물 초반 유지 → 간조/정조 최저.
 *    사리(7~10물) 강, 조금 약. 정조(유속≈0) 급감.
 *  - 날씨: 저기압 서서히 하강(1~2hPa/h) 보너스, 비 직전 급강하 폭발적,
 *    흐린 날 한낮 페널티 완화, 급수온 하강(냉수대) 급감.
 *  - 지역 계수: 동해(속초·동명)는 조석간만이 작아 조류 비중↓·시간창 비중↑.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

/** 지역 프로필 — 조류/시간창 비중 배분 */
export type FeedingRegionProfile = 'east_sea' | 'south_sea' | 'default';

export interface FeedingTimeInput {
  /** KST 시각 (0.0 ~ 23.99) */
  hour: number;
  /** 월 (1~12) */
  month: number;
  /** 물때 (1~15, 8물 사리) */
  tidePhase: number;
  /** 다음 만조/간조까지 남은 시간 (분) — TideCalculator.minutesToNextTide */
  minutesToNextTide?: number;
  /** 다음 조위 이벤트 종류 */
  nextTideType?: 'high' | 'low';
  /** 하늘 상태 (기상청 WeatherKind 문자열 — clear/partly/cloudy/rain/shower/sleet/snow/fog) */
  weatherKind?: string;
  /** 기압 추세 (hPa/h, 음수 = 하강) — 미제공 시 무시 */
  pressureTrendHpaPerHour?: number;
  /** 급수온 하강 지수 0~1 (냉수대 충격) — 미제공 시 0 */
  coldWaterShockIndex?: number;
  /** 지역 계수 (기본 default) */
  regionProfile?: FeedingRegionProfile;
}

export interface FeedingActivityResult {
  /** 최종 활성도 배율 (0.2 ~ 1.5) — 입질 확률/이벤트 발생률에 곱한다 */
  activity: number;
  /** 구성 요소 (HUD/디버그 표시용) */
  seasonWindow: number;
  tideFactor: number;
  weatherFactor: number;
  /** 표시 라벨 */
  label: '골든타임' | '활성' | '보통' | '저조';
}

/** 월 → 계절 */
function seasonOf(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/** 시간창 판정 헬퍼 — [시작, 끝) 구간 포함 여부 */
function inWindow(hour: number, from: number, to: number): boolean {
  return hour >= from && hour < to;
}

/**
 * 계절별 피딩 시간창 배율 (0.35 ~ 1.15).
 * 실제 일출·일몰 이동을 계절 창 경계에 반영한 근사 테이블.
 */
export function seasonTimeWindow(hour: number, month: number): number {
  const season = seasonOf(month);
  switch (season) {
    case 'spring':
      if (inWindow(hour, 7, 10) || inWindow(hour, 15, 18)) return 1.12;   // 골든
      if (inWindow(hour, 6, 19)) return 0.85;                            // 종일 고른 편
      return 0.5;                                                        // 심야
    case 'summer':
      if (inWindow(hour, 4, 7) || inWindow(hour, 18, 21)) return 1.15;   // 새벽/해질녘
      if (inWindow(hour, 21, 24)) return 0.8;                            // 야간 보조
      if (inWindow(hour, 12, 17)) return 0.35;                           // 한낮 거의 없음
      return 0.65;
    case 'fall':
      if (inWindow(hour, 5, 8) || inWindow(hour, 14, 18)) return 1.12;   // 골든
      if (inWindow(hour, 8, 14) || inWindow(hour, 18, 21)) return 0.88;  // 종일 활성
      return 0.55;
    case 'winter':
      if (inWindow(hour, 11, 14)) return 1.1;                            // 한낮 집중 (역전)
      if (inWindow(hour, 10, 15)) return 0.85;
      if (inWindow(hour, 9, 16)) return 0.7;
      return 0.42;                                                       // 새벽·저녁 저조
  }
}

/** 물때 세기 (1~15 → 0.2~1.0, 8물 사리 최강) */
function tidePhaseStrength(tidePhase: number): number {
  const d = Math.abs(tidePhase - 8);
  return Math.max(0.2, 1 - d / 7);
}

/**
 * 조류 활성 배율 (0.55 ~ 1.35).
 * 만조 1시간 전후 최고(골든) / 간조·정조 부근 최저 / 물때 세기(사리·조금) 반영.
 */
export function tideActivityFactor(
  tidePhase: number, minutesToNextTide?: number, nextTideType?: 'high' | 'low',
): number {
  const phaseMult = 0.78 + tidePhaseStrength(tidePhase) * 0.42;   // 조금 0.86 ~ 사리 1.2

  let proximity = 1.0;
  if (minutesToNextTide !== undefined && nextTideType) {
    if (nextTideType === 'high') {
      // 들물 — 만조 90분 전부터 최고조
      proximity = minutesToNextTide <= 90 ? 1.15 : 1.05;
    } else {
      // 썰물 — 간조가 가까울수록(정조 근접) 급감
      proximity = minutesToNextTide <= 45 ? 0.7 : minutesToNextTide <= 120 ? 0.9 : 1.0;
    }
  }
  return Math.max(0.55, Math.min(1.35, phaseMult * proximity));
}

/** 날씨 배율 (0.5 ~ 1.3) */
export function weatherActivityFactor(
  weatherKind?: string, pressureTrendHpaPerHour?: number, coldWaterShockIndex?: number,
): number {
  let f = 1.0;
  const p = pressureTrendHpaPerHour;
  if (p !== undefined) {
    if (p <= -2) f *= 1.3;         // 비 직전 급강하 — 폭발적 입질 (단시간)
    else if (p <= -1) f *= 1.15;   // 저기압 서서히 하강 — 최고 타이밍
    else if (p >= 2) f *= 0.85;    // 고기압 급상승 — 활성 감소
  }
  if (weatherKind === 'rain' || weatherKind === 'shower') f *= 1.05;   // 강수 자체는 소폭 보너스
  else if (weatherKind === 'snow' || weatherKind === 'sleet') f *= 0.85;
  else if (weatherKind === 'fog') f *= 0.92;
  // 급수온 하강(냉수대) — 최대 반토막
  const shock = Math.max(0, Math.min(1, coldWaterShockIndex ?? 0));
  f *= 1 - shock * 0.5;
  return Math.max(0.5, Math.min(1.3, f));
}

/**
 * 피딩 활성도 산출 — 입질/이벤트 확률의 공통 배율.
 *
 * activity = seasonWindow^a × tideFactor^b × weatherFactor
 * (동해 지역은 조류 비중 b↓·시간창 비중 a↑ — 조석간만이 작은 지역 특성)
 */
export function computeFeedingActivity(input: FeedingTimeInput): FeedingActivityResult {
  let season = seasonTimeWindow(input.hour, input.month);
  const tide = tideActivityFactor(input.tidePhase, input.minutesToNextTide, input.nextTideType);
  const weather = weatherActivityFactor(
    input.weatherKind, input.pressureTrendHpaPerHour, input.coldWaterShockIndex,
  );

  // 흐린 날 — 한낮 페널티 완화 (종일 고른 입질)
  const cloudy = input.weatherKind === 'cloudy' || input.weatherKind === 'partly';
  if (cloudy && season < 0.7) season = Math.min(0.8, season * 1.3);

  // 지역 비중 — 동해는 조류 기여↓, 시간창 기여↑
  const profile = input.regionProfile ?? 'default';
  const [a, b] = profile === 'east_sea' ? [1.15, 0.45] : [1.0, 1.0];

  const activity = Math.max(0.2, Math.min(1.5,
    Math.pow(season, a) * Math.pow(tide, b) * weather,
  ));

  const label: FeedingActivityResult['label'] =
    activity >= 1.05 ? '골든타임' : activity >= 0.85 ? '활성' : activity >= 0.6 ? '보통' : '저조';

  return { activity, seasonWindow: season, tideFactor: tide, weatherFactor: weather, label };
}

/** 지역 ID → 피딩 지역 프로필 (동해권 판정) */
export function feedingRegionProfileOf(regionId: string): FeedingRegionProfile {
  if (regionId.includes('sokcho') || regionId.includes('gangwon')
    || regionId.includes('pohang') || regionId.includes('ulleung') || regionId.includes('dokdo')) {
    return 'east_sea';
  }
  return 'default';
}
