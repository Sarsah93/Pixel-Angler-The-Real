/**
 * @file WakeLines.ts
 * @description 잠에서 깼을 때의 혼잣말 (213차 B · E — 일어나면 **지금 실제 시각**을 말한다).
 *
 * 잠은 세계 시계를 건너뛰지 않는다 — 새벽 4시에 자면 일어나도 새벽 4시 반이다. 그 사실을 주인공의 말로 알려 준다.
 * 때(core `dayPartOf`)마다 그 시간에 할 만한 것을 한마디 붙인다(새벽 = 위판 · 밤 = 밤바다).
 * 가변 수치가 섞인 문장이라 로케일별로 직접 쓴다(라디오 방송 · 「내일」 한 줄과 같은 방식).
 */

import { dayPartOf, kstParts } from '@tra/core';

/** 다 자고 일어났을 때 한 단락 */
export function wakeLine(locale: 'ko' | 'en', now = new Date()): string {
  const p = kstParts(now);
  const h = Number(p.hh), m = Number(p.mi);
  const part = dayPartOf(h);
  if (locale === 'en') {
    const at = `${p.hh}:${p.mi}`;
    return {
      deep_night: `I wake up. ${at} — still the middle of the night. The sea outside the window is pitch black.`,
      dawn: `I wake up at ${at}. Before dawn — the auction hall must be in full swing right now.`,
      morning: `${at} in the morning. I feel rested. Check the tide first, then head out.`,
      midday: `${at}, broad daylight. I slept well.`,
      evening: `${at} in the evening. The sun is going down — the evening tide is coming.`,
      night: `${at} at night. Rested again. Maybe the night sea, then.`,
    }[part];
  }
  const hh = h % 12 === 0 ? 12 : h % 12;
  return {
    deep_night: `눈을 떴다. ${h}시 ${m}분 — 아직 한밤중이다. 창밖 바다가 까맣다.`,
    dawn: `눈을 떴다. 새벽 ${h}시 ${m}분. 동이 트기 전이다 — 위판장은 지금이 한창이겠다.`,
    morning: `아침 ${h}시 ${m}분. 개운하다. 물때부터 보고 나가자.`,
    midday: `낮 ${hh}시 ${m}분. 푹 잤다.`,
    evening: `저녁 ${hh}시 ${m}분. 해가 기운다 — 저녁 물때가 다가온다.`,
    night: `밤 ${hh}시 ${m}분. 다시 개운해졌다. 밤바다로 나가 볼까.`,
  }[part];
}

/** 꺼 둔 사이 잔 것으로 쳤을 때(오프라인 = 잠) — 두 단락 */
export function offlineWakeLines(offlineMs: number, locale: 'ko' | 'en', now = new Date()): string[] {
  const hours = Math.max(1, Math.round(offlineMs / 3_600_000));
  const first = locale === 'en'
    ? (hours >= 24 ? `I slept for a long, long time — more than a day.` : `I slept at home — about ${hours} hours.`)
    : (hours >= 24 ? '오래도 잤다 — 하루를 꼬박 넘겼다.' : `집에서 푹 자고 나왔다 — ${hours}시간쯤 잤다.`);
  return [first, wakeLine(locale, now)];
}
