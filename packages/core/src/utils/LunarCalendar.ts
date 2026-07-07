/**
 * @file LunarCalendar.ts
 * @description 음력 날짜 계산 및 변환 유틸리티
 * 
 * 기상/물때 예측 시 음력 날짜를 활용하여 조수 간만의 차를 추정합니다.
 */

/**
 * 특정 양력 날짜에 대응하는 대략적인 음력 일(Day)을 계산합니다 (0 ~ 29 범위).
 * @param date 양력 날짜
 */
export function getApproxLunarDay(date: Date): number {
  // 기준점: 2000년 1월 6일 = 음력 12월 30일 (삭일 근처)
  const epoch = new Date(2000, 0, 6).getTime();
  const lunarMonthMs = 29.530588853 * 24 * 60 * 60 * 1000;
  
  const diffMs = date.getTime() - epoch;
  const cycleCount = diffMs / lunarMonthMs;
  const currentCycleProgress = cycleCount - Math.floor(cycleCount);
  
  const lunarDay = Math.floor(currentCycleProgress * 29.530588853);
  return (lunarDay + 30) % 30; // 0-indexed (0이 삭일, 15가 망일)
}

/**
 * 음력 일자를 1~30 사이의 인간 친화적 숫자로 변환합니다.
 */
export function getLunarDayDisplay(date: Date): number {
  const approx = getApproxLunarDay(date);
  return approx === 0 ? 30 : approx;
}
