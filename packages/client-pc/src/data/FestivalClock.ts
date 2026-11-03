/**
 * @file FestivalClock.ts
 * @description 298차 — 축제 시계. 게임 시계는 실시간(KST)이라 축제 판정도 실시간이다.
 *  dev 콘솔(F10)이 날짜를 옮겨 절정 주 · 축제 달을 바로 볼 수 있다(세이브되지 않는다 — 새로고침이면 실시간).
 *  축제를 보는 모든 곳(값 · 매대 · 북적임 · 일손 · 라디오 · 알림 · 일지)은 `new Date()`가 아니라 `festivalNow()`를 쓴다.
 */

let devOverrideMs: number | null = null;

/** 지금(KST 실시간 · dev가 옮겼으면 그 날 정오) */
export function festivalNow(): Date {
  return devOverrideMs === null ? new Date() : new Date(devOverrideMs);
}

/** dev — `YYYY-MM-DD`(KST 정오)로 옮기거나 null로 되돌린다 */
export function devSetFestivalDate(ymd: string | null): void {
  if (!ymd) { devOverrideMs = null; return; }
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(ymd);
  if (!m) return;
  devOverrideMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 3, 0, 0);   // KST 12:00
}

export function festivalDevOverride(): string | null {
  if (devOverrideMs === null) return null;
  const k = new Date(devOverrideMs + 9 * 3_600_000);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, '0')}-${String(k.getUTCDate()).padStart(2, '0')}`;
}

if (import.meta.env?.DEV) (globalThis as unknown as { __FEST?: unknown }).__FEST = { set: devSetFestivalDate, now: festivalNow, get: festivalDevOverride };
