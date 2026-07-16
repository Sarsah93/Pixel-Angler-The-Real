/**
 * @file KstTime.ts
 * @description 한국시간(KST, UTC+9) 변환 유틸
 *
 * 게임 내 모든 시각 표기·물때·주야간 판정은 **KST 기준**이다.
 * 플레이어의 로컬 타임존이 KST가 아닐 수 있으므로, `new Date().getHours()`를
 * 그대로 쓰면 안 된다 — 반드시 이 유틸을 거칠 것.
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** KST로 분해한 날짜/시각 구성요소 (전부 zero-padded 문자열, y/mo/d는 숫자 문자열) */
export interface KstParts {
  /** 연도 (예: '2026') */
  y: string;
  /** 월 1~12 (패딩 없음, 예: '7') */
  mo: string;
  /** 일 1~31 (패딩 없음, 예: '16') */
  d: string;
  /** 요일 한 글자 (예: '목') */
  dow: string;
  /** 시 00~23 */
  hh: string;
  /** 분 00~59 */
  mi: string;
  /** 초 00~59 */
  ss: string;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

/** KST 기준 Date (필드 접근용 — 타임존 정보는 갖지 않는 '벽시계' Date) */
export function toKstDate(d: Date = new Date()): Date {
  // UTC 밀리초 + 9시간 → getUTC*() 로 읽으면 KST 벽시계 값이 된다
  return new Date(d.getTime() + 9 * 3600 * 1000);
}

/** KST 날짜/시각 분해 */
export function kstParts(d: Date = new Date()): KstParts {
  const k = toKstDate(d);
  return {
    y: String(k.getUTCFullYear()),
    mo: String(k.getUTCMonth() + 1),
    d: String(k.getUTCDate()),
    dow: DOW[k.getUTCDay()],
    hh: String(k.getUTCHours()).padStart(2, '0'),
    mi: String(k.getUTCMinutes()).padStart(2, '0'),
    ss: String(k.getUTCSeconds()).padStart(2, '0'),
  };
}

/** KST 기준 시(0~23) */
export function kstHour(d: Date = new Date()): number {
  return toKstDate(d).getUTCHours();
}

/** KST 기준 YYYYMMDD (API base_date 등에 사용) */
export function kstYmd(d: Date = new Date()): string {
  const k = toKstDate(d);
  return `${k.getUTCFullYear()}${String(k.getUTCMonth() + 1).padStart(2, '0')}${String(k.getUTCDate()).padStart(2, '0')}`;
}

/**
 * 야간 여부 (일몰~일출).
 * 계절별 일출·일몰이 다르므로 월별 근사 경계를 쓴다 (한국 기준).
 * 정밀한 일출/일몰이 필요해지면 천문 계산으로 교체할 것.
 */
export function isNightHour(hour: number, month?: number): boolean {
  const m = month ?? Number(kstParts().mo);
  // 여름(5~8월)은 해가 길고, 겨울(11~2월)은 짧다
  const summer = m >= 5 && m <= 8;
  const winter = m >= 11 || m <= 2;
  const sunrise = summer ? 5 : winter ? 7 : 6;
  const sunset = summer ? 20 : winter ? 17 : 18;
  return hour < sunrise || hour >= sunset;
}

/** 현재 KST 기준 야간 여부 */
export function isNightNow(d: Date = new Date()): boolean {
  const p = kstParts(d);
  return isNightHour(Number(p.hh), Number(p.mo));
}
