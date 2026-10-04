/**
 * @file TideFlowPhase.ts
 * @description 물때 흐름 8단계 판정 + 단계별 입질·대물·조류 성향 (204차).
 *
 * 판정: 어제·오늘·내일의 만조/간조 시각(`calculateTideInfo`)을 이어 붙여 직전·다음 극점을 찾고,
 *  극점 앞뒤 30분 = 물돌이 / 극점 뒤 30분~2시간 = 초 / 2~4시간 = 중 / 4시간~다음 극점 30분 전 = 끝.
 *
 * 성향(사용자 제공 정리 + 2026-10 조사 — 워크로그 204):
 *  - 초들물 ★5: 멈췄던 물이 살아나며 먹이가 떠오른다 — 최고 피크.
 *  - 중들물 ★3.5 · 중날물 ★3: 활성은 높지만 물살이 거세 채비가 안 선다(조류 ×1.3). 얕은 연안 중날물은 고기가 빠진다.
 *  - 끝들물 ★3.5: 물이 가장 높고 잔잔 — 대물이 연안 깊숙이(대물 가중).
 *  - 초날물 ★4: 들어왔던 베이트가 빠져나갈 채비 — 황금 시간대.
 *  - 끝날물 ★2: 수심이 얕아져 소강 — 깊은 자리는 덜 깎인다.
 *  - 물돌이 ★4.5: 잔챙이 입질은 줄지만 대물 시간(대물 가중 최대 · 조류 거의 멈춤 → 밑밥이 쌓인다).
 * 사리일수록 단계 차이가 커지고 조금이면 평평해진다(`currentStrength`).
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { TideFlowPhase, TideFlowProfile, TideFlowState } from '../types/TideFlow.js';
import { calculateTideInfo } from './TideCalculator.js';

/** 물돌이 반폭(분) — 극점 앞뒤 이만큼 */
export const TIDE_SLACK_HALF_MIN = 30;
/** 초 → 중 경계(극점 뒤 분) */
const EARLY_END_MIN = 120;
/** 중 → 끝 경계(극점 뒤 분) */
const MID_END_MIN = 240;

export const TIDE_FLOW_PROFILE: Record<TideFlowPhase, TideFlowProfile> = {
  flood_early: { stars: 5, biteMult: 1.25, sizeBias: 0, currentMult: 0.8 },
  flood_mid: { stars: 3.5, biteMult: 1.0, sizeBias: 0, currentMult: 1.3 },
  flood_late: { stars: 3.5, biteMult: 1.05, sizeBias: 0.35, currentMult: 0.7 },
  slack_high: { stars: 4.5, biteMult: 0.85, sizeBias: 0.6, currentMult: 0.25 },
  ebb_early: { stars: 4, biteMult: 1.15, sizeBias: 0.15, currentMult: 0.8 },
  ebb_mid: { stars: 3, biteMult: 0.92, sizeBias: 0, currentMult: 1.3 },
  ebb_late: { stars: 2, biteMult: 0.7, sizeBias: 0, currentMult: 0.65 },
  slack_low: { stars: 4, biteMult: 0.8, sizeBias: 0.5, currentMult: 0.25 },
};

export const TIDE_FLOW_LABEL_KO: Record<TideFlowPhase, string> = {
  flood_early: '초들물', flood_mid: '중들물', flood_late: '끝들물', slack_high: '만조 물돌이',
  ebb_early: '초날물', ebb_mid: '중날물', ebb_late: '끝날물', slack_low: '간조 물돌이',
};
export const TIDE_FLOW_LABEL_EN: Record<TideFlowPhase, string> = {
  flood_early: 'Early flood', flood_mid: 'Mid flood', flood_late: 'Late flood', slack_high: 'High-water slack',
  ebb_early: 'Early ebb', ebb_mid: 'Mid ebb', ebb_late: 'Late ebb', slack_low: 'Low-water slack',
};

/** 물때 알림 한 줄(1인칭 관찰 — 지역 채널용) */
export const TIDE_FLOW_NOTE_KO: Record<TideFlowPhase, string> = {
  flood_early: '멈췄던 물이 다시 들어오기 시작한다. 입질이 살아날 때다.',
  flood_mid: '물살이 거세졌다. 채비가 잘 안 서니 물살이 죽는 자리를 찾자.',
  flood_late: '물이 거의 다 찼다. 물살이 누그러진다 — 큰 놈이 붙을 때다.',
  slack_high: '물이 멈췄다. 잔챙이는 조용해지고, 대물이 움직일 시간이다.',
  ebb_early: '물이 빠지기 시작한다. 베이트가 따라 나가고 입질이 다시 붙는다.',
  ebb_mid: '물이 한창 빠진다. 얕은 자리는 고기가 빠지기 쉽다.',
  ebb_late: '바닥이 드러날 만큼 물이 줄었다. 깊은 곳이 아니면 소강이다.',
  slack_low: '물이 멈췄다. 곧 다시 들물이 시작된다.',
};

export const TIDE_FLOW_NOTE_EN: Record<TideFlowPhase, string> = {
  flood_early: 'The still water is starting to come back in. Time for the bites to wake up.',
  flood_mid: 'The current has picked up. Rigs will not settle — look for spots where it slackens.',
  flood_late: 'The water is almost full. The current is easing — the big ones move in now.',
  slack_high: 'The water has stopped. The small fry go quiet, and the big fish start to move.',
  ebb_early: 'The water is starting to go out. The bait follows it and the bites return.',
  ebb_mid: 'The water is pouring out. Fish leave the shallow spots quickly.',
  ebb_late: 'The water is low enough to bare the bottom. Unless it is deep here, things go quiet.',
  slack_low: 'The water has stopped. The flood will start again soon.',
};

/** 위키·도움말용 공략 한 줄 — 게임에 실제로 들어간 규칙만 적는다 */
export const TIDE_FLOW_TIP_KO: Record<TideFlowPhase, string> = {
  flood_early: '입질이 가장 좋은 때. 바닥 고기(광어·우럭)도 눈앞을 지나는 미끼를 덮친다. 이 시간을 놓치지 말 것.',
  flood_mid: '조류가 1.3배 가까이 빨라져 찌가 금방 흘러간다. 무거운 봉돌이나 물살이 죽는 자리(홈통·지류)를 노린다.',
  flood_late: '물살이 누그러지고 대물 가중이 붙는다. 밑밥을 쌓아 두고 큰 놈을 기다리기 좋다.',
  slack_high: '입질 수는 줄지만 대물 가중이 가장 크다. 채비가 거의 흐르지 않아 밑밥과 채비를 맞추기 쉽다.',
  ebb_early: '초들물 다음가는 황금 시간. 빠져나가는 베이트를 노리는 고기가 다시 붙는다.',
  ebb_mid: '물살이 거세고 얕은 자리는 고기가 빠진다. 발앞 수심 15m 이상 깊은 자리는 덜 깎인다.',
  ebb_late: '얕은 연안은 소강. 깊은 자리(15m 이상)라면 막판 입질을 노려 볼 만하다.',
  slack_low: '물이 멈춘 바닥 시간. 대물 가중이 붙고, 곧 초들물이 온다 — 자리를 정리하고 준비할 때.',
};

/** 순환 순서 */
const ORDER: TideFlowPhase[] = [
  'flood_early', 'flood_mid', 'flood_late', 'slack_high', 'ebb_early', 'ebb_mid', 'ebb_late', 'slack_low',
];

export function nextTideFlowPhase(p: TideFlowPhase): TideFlowPhase {
  return ORDER[(ORDER.indexOf(p) + 1) % ORDER.length];
}

interface Extreme { t: number; type: 'high' | 'low' }

/** 어제·오늘·내일 극점을 이어 붙인다(날짜 경계 근처의 중복·같은 종류 연속은 걸러 낸다) */
function extremesAround(date: Date): Extreme[] {
  const DAY = 86_400_000;
  const all: Extreme[] = [];
  for (const k of [-1, 0, 1]) {
    const info = calculateTideInfo(new Date(date.getTime() + k * DAY));
    for (const h of info.highTideTimes) all.push({ t: h.getTime(), type: 'high' });
    for (const l of info.lowTideTimes) all.push({ t: l.getTime(), type: 'low' });
  }
  all.sort((a, b) => a.t - b.t);
  const out: Extreme[] = [];
  for (const e of all) {
    const last = out[out.length - 1];
    // 근사식이 날마다 다시 계산되어 경계에서 극점이 겹치거나 같은 종류가 이어질 수 있다
    if (last && (last.type === e.type || e.t - last.t < 3 * 3_600_000)) continue;
    out.push(e);
  }
  return out;
}

/** 지금(또는 주어진 시각)의 물때 흐름 단계 */
export function tideFlowStateAt(date: Date = new Date()): TideFlowState {
  const now = date.getTime();
  const ex = extremesAround(date);
  let i = ex.findIndex((e) => e.t > now);
  if (i <= 0) i = Math.max(1, ex.length - 1);
  const prev = ex[i - 1];
  const next = ex[i];
  const since = (now - prev.t) / 60_000;
  const toNext = (next.t - now) / 60_000;
  const rising = prev.type === 'low';   // 간조 뒤 = 들물
  let phase: TideFlowPhase;
  let end: number;   // 이 단계가 끝나는 시각(분 — 지금 기준)
  if (since < TIDE_SLACK_HALF_MIN) {
    phase = prev.type === 'high' ? 'slack_high' : 'slack_low';
    end = TIDE_SLACK_HALF_MIN - since;
  } else if (toNext <= TIDE_SLACK_HALF_MIN) {
    phase = next.type === 'high' ? 'slack_high' : 'slack_low';
    end = toNext + TIDE_SLACK_HALF_MIN;
  } else if (since < EARLY_END_MIN) {
    phase = rising ? 'flood_early' : 'ebb_early';
    end = Math.min(EARLY_END_MIN - since, toNext - TIDE_SLACK_HALF_MIN);
  } else if (since < MID_END_MIN && toNext - TIDE_SLACK_HALF_MIN > 0) {
    phase = rising ? 'flood_mid' : 'ebb_mid';
    end = Math.min(MID_END_MIN - since, toNext - TIDE_SLACK_HALF_MIN);
  } else {
    phase = rising ? 'flood_late' : 'ebb_late';
    end = toNext - TIDE_SLACK_HALF_MIN;
  }
  const direction = phase === 'slack_high' || phase === 'slack_low' ? 'slack' : rising ? 'flood' : 'ebb';
  return {
    phase, direction,
    minutesSinceExtreme: Math.round(since),
    minutesToNextExtreme: Math.round(toNext),
    nextExtreme: next.type,
    minutesToPhaseEnd: Math.max(0, Math.round(end)),
    nextPhase: nextTideFlowPhase(phase),
  };
}

/** 사리·조금 반영 계수 — 조류가 셀수록 단계 차이가 커진다(조금 0.6 · 사리 1.0) */
function springScale(currentStrength: number): number {
  return 0.6 + 0.4 * Math.max(0, Math.min(1, currentStrength));
}

/**
 * 단계의 입질 배율.
 * @param deepSpot 발앞 수심 15m 이상(깊은 자리) — 끝날물·중날물에 고기가 덜 빠진다
 */
export function tideFlowBiteMult(phase: TideFlowPhase, currentStrength: number, deepSpot = false): number {
  let base = TIDE_FLOW_PROFILE[phase].biteMult;
  if (deepSpot && phase === 'ebb_late') base = 0.9;
  if (deepSpot && phase === 'ebb_mid') base = 1.0;
  return 1 + (base - 1) * springScale(currentStrength);
}

/** 단계의 조류 세기 배율(사리·조금 반영) */
export function tideFlowCurrentMult(phase: TideFlowPhase, currentStrength: number): number {
  return 1 + (TIDE_FLOW_PROFILE[phase].currentMult - 1) * springScale(currentStrength);
}

/** 단계의 대물 가중 0~1 */
export function tideFlowSizeBias(phase: TideFlowPhase): number {
  return TIDE_FLOW_PROFILE[phase].sizeBias;
}

/** 들물 계열인가(물돌이는 직전 흐름으로 보지 않는다) */
export function isFloodPhase(p: TideFlowPhase): boolean {
  return p === 'flood_early' || p === 'flood_mid' || p === 'flood_late';
}
export function isEbbPhase(p: TideFlowPhase): boolean {
  return p === 'ebb_early' || p === 'ebb_mid' || p === 'ebb_late';
}
export function isSlackPhase(p: TideFlowPhase): boolean {
  return p === 'slack_high' || p === 'slack_low';
}
