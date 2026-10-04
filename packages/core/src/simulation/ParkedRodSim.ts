/**
 * @file ParkedRodSim.ts
 * @description 거치해 둔 낚싯대 한 대를 한 번 굴린다 (209차 — 탑다운 · 1인칭 공용).
 *
 * 207·208차에는 탑다운 필드의 `update`만 거치대를 굴렸다. 1인칭으로 들어가면 필드가 멈춰
 * **다른 거치대는 시간이 멈췄고**, 이미 입질 중이던 대의 입질 창만 벽시계로 흘러 돌아오면 사라져 있었다.
 * 이제 같은 규칙을 1인칭에서도 매 프레임 굴리고, 입질 창은 굴린 시간(`phaseAgeSec`)으로 잰다.
 *
 *  - waiting: 봉돌이 구르면(물살 · 파도) 끌린 거리만큼 여에 걸린다 → `snagged`. 입질 → `bite`.
 *  - bite: `biteWindowSec`이 지나도록 아무도 안 잡으면 → 고기가 스스로 걸리거나(`hooked`, 대 용도 · 봉돌 무게)
 *    입질이 끝난다(`bite_missed` — 미끼를 따먹혔을 수 있다, 처리는 호출자).
 *  - hooked: 초당 `hookedEscapePerSec`로 빠진다(`escaped` — 미끼도 없다).
 *  - 1인칭 파이팅 중 고기가 옆으로 크게 째면 대기 · 입질 · 걸림 중인 대의 줄과 엉킨다(`tangled`).
 * 순수 TS — 렌더 없음.
 */

import { TUNING } from '../config/tuning.js';
import { sinkerHoldsBottom, snagDragChance } from './SnagDrag.js';
import type { ParkedRodEvent, ParkedRodPhase, ParkedRodState, ParkedRodStepEnv } from '../types/SnagDrag.js';

function setPhase(rod: ParkedRodState, phase: ParkedRodPhase, nowMs: number): void {
  rod.phase = phase;
  rod.phaseAtMs = nowMs;
  rod.phaseAgeSec = 0;
}

/** 한 번 굴린다 — 상태가 바뀌면 그 일을 돌려준다(없으면 null). `rod`를 직접 고친다 */
export function stepParkedRod(rod: ParkedRodState, env: ParkedRodStepEnv): ParkedRodEvent | null {
  const H = TUNING.rodHolder;
  const dt = Math.max(0, Math.min(0.25, env.dtSec));
  rod.phaseAgeSec = (rod.phaseAgeSec ?? 0) + dt;
  const p = (perSec: number): boolean => perSec > 0 && env.rng() < 1 - Math.exp(-perSec * dt);

  // 다른 대 파이팅 중 옆 째기 — 물속에 줄이 나가 있는 대(대기 · 입질 · 걸림)만 엉킨다
  if ((rod.phase === 'waiting' || rod.phase === 'bite' || rod.phase === 'hooked') && p(env.tanglePerSec)) {
    setPhase(rod, 'tangled', env.nowMs);
    return 'tangled';
  }

  if (rod.phase === 'waiting') {
    const roll = sinkerHoldsBottom(env.flow01, env.waveM, rod.sinkerG);
    if (roll.rolling) {
      const speed = roll.cause === 'wave' ? roll.shorewardMps : TUNING.tidePhase.surfRollDriftMps;
      const dragM = speed * dt;
      if (roll.cause === 'wave') rod.rig.distM = Math.max(1, rod.rig.distM - dragM);
      if (env.rng() < snagDragChance({
        dragM, dtSec: dt, clearanceM: 0, inReef: rod.onReef, kind: 'sinker', flow01: env.flow01, riskMult: rod.snagRisk,
      })) {
        setPhase(rod, 'snagged', env.nowMs);
        return 'snagged';
      }
    }
    if (!env.baitless && p(rod.biteProbPerSec * H.parkedBiteMult)) {
      setPhase(rod, 'bite', env.nowMs);
      return 'bite';
    }
    return null;
  }

  if (rod.phase === 'bite') {
    if (rod.phaseAgeSec < H.biteWindowSec) return null;
    if (env.rng() < env.selfHookChance) {
      setPhase(rod, 'hooked', env.nowMs);
      return 'hooked';
    }
    setPhase(rod, 'waiting', env.nowMs);
    return 'bite_missed';
  }

  if (rod.phase === 'hooked') {
    if (p(H.hookedEscapePerSec)) {
      setPhase(rod, 'waiting', env.nowMs);
      return 'escaped';
    }
  }
  return null;
}
