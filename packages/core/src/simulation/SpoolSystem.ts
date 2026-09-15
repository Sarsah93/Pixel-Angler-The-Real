/**
 * @file SpoolSystem.ts
 * @description 스풀·베일 물리 (136차) — 전유동/흘림 낚시와 "줄 주기"의 단일 기준
 *
 * ## 왜 필요한가
 * 이전까지 채비는 **원줄 길이라는 상태가 없었다**. 그래서 릴링은 곧 거리 감소였고,
 * 반유동(면사매듭으로 수심을 묶는) 채비만 표현할 수 있었다. 실제 조법에서
 *  - **전유동·흘림**: 베일을 열고 스풀에서 줄을 계속 내주어 채비가 조류를 타고 흘러간다.
 *  - **중층 루어 운용**: 줄을 내주어 루어를 띄운 채 흘리거나, 폴링 구간을 길게 가져간다.
 *  - **파이팅**: 텐션이 한계면 줄을 내줘 물고기가 원하는 방향으로 달리게 두고 텐션을 뺀다.
 * 이 세 가지가 전부 "스풀에서 줄이 나간다"는 하나의 상태(`lineOutM`)로 설명된다.
 *
 * ## 모델
 * 풀려나간 원줄 `lineOutM` 과 기하학적 **필요 길이** `requiredM`(= |채비 − 로드팁|)을 비교한다.
 *  - `lineOutM > requiredM` → **슬랙**. 채비는 조류·중력을 자유롭게 따른다(텐션 0).
 *  - `lineOutM ≤ requiredM` → **팽팽**. 채비는 반지름 `lineOutM` 구면에 갇혀 호를 그리며
 *    끌려온다(가라앉으면 거리가 줄고, 멀리 흐르면 수심이 얕아진다 — 진자 운동).
 *
 * 방출 속도는 하중(`pullKg`)이 스풀 저항을 이긴 만큼 난다.
 *  - 베일 개방(R 홀드) = 저항이 거의 0 → 조류·무게만큼 술술 나간다.
 *  - 베일 닫힘 = 드랙이 저항 → 드랙 초과분만 슬립(기존 LinePhysics와 같은 규칙).
 *  - **베일 휨 고장** = 닫아도 조금씩 샌다(`bailLeakMps`) — 유저가 이상을 눈치채는 단서.
 *
 * 순수 함수 + 작은 상태 객체. Phaser/DOM 금지(§3).
 */

import { TUNING } from '../config/tuning.js';

/** 스풀 상태 — 씬이 보관하고 매 프레임 넘긴다 */
export interface SpoolState {
  /** 스풀에서 풀려나간 원줄 길이 (m) */
  lineOutM: number;
}

export interface SpoolStepInput {
  dtSec: number;
  /** 스풀 개방(R 홀드) — 베일을 열어 자유 방출 */
  open: boolean;
  /** 이번 프레임 릴링 회수 속도 (m/s, 0이면 감지 않음) */
  reelMps: number;
  /** 채비에 걸리는 당김 하중 (kg) — 조류 항력 + 채비 무게 + (파이팅 시) 물고기 */
  pullKg: number;
  /** 드랙 설정 (kg) — 스풀이 닫혀 있을 때의 슬립 임계 */
  dragKg: number;
  /** 기하학적 필요 길이 (m) = |채비 − 로드팁| */
  requiredM: number;
  /** 베일 변형 고장 — 닫아도 조금씩 새어 나간다 (내구도 시스템 연동) */
  bailBent?: boolean;
  /** 스풀에 감긴 원줄 총량 (m). 미지정 = TUNING.spool.maxLineM */
  capacityM?: number;
}

export interface SpoolStepResult {
  /** 갱신된 방출 길이 */
  lineOutM: number;
  /** 이번 프레임 순 변화 (+방출 / −회수) */
  deltaM: number;
  /** 여유줄 — 양수 = 슬랙, 0 이하 = 팽팽 */
  slackM: number;
  taut: boolean;
  /** 팽팽할 때 실제로 채비·로드에 실리는 장력 (kg). 슬랙이면 0 */
  tensionKg: number;
  /** 드랙이 미끄러지는 중 (베일 닫힘 + 하중 초과) */
  slipping: boolean;
  /** 스풀이 바닥났다 — 더는 내줄 줄이 없다 */
  spooled: boolean;
  /** 방출 속도 (m/s) — HUD 표기용 */
  payoutMps: number;
  /**
   * 과방출 — 여유줄이 상한(`maxSlackM`)에 닿아 방출이 막힌 상태.
   * 실제로는 이때 스풀에서 줄이 뭉텅이로 튀어나와 **원줄 꼬임(백래시)** 이 된다 —
   * 릴 고장 판정(내구도)이 이 신호를 소비한다.
   */
  overrun: boolean;
}

/** 새 캐스팅 시작 — 착수 거리만큼 줄이 나가 있고, 약간의 여유줄을 둔다 */
export function initSpool(castDistanceM: number, depthM = 0.3): SpoolState {
  return { lineOutM: Math.hypot(Math.max(0, castDistanceM), depthM) + TUNING.spool.castSlackM };
}

/**
 * 한 프레임 진행. 위치 갱신(투영)은 호출부가 `slackM`/`taut`를 보고 처리한다 —
 * 이 모듈은 **줄의 길이와 장력만** 책임진다.
 */
export function stepSpool(state: SpoolState, input: SpoolStepInput): SpoolStepResult {
  const S = TUNING.spool;
  const cap = input.capacityM ?? S.maxLineM;
  const dt = Math.max(0, input.dtSec);

  let payout = 0;
  let slipping = false;
  if (input.open) {
    // 자유 방출 — 하중이 스풀 관성·베일 마찰을 이긴 만큼. 하중이 없어도 채비 무게로
    // 최소한은 흘러나간다(전유동에서 손을 놓으면 줄이 스르르 나가는 그것).
    const over = Math.max(0, input.pullKg - S.openFrictionKg);
    payout = Math.min(S.maxPayoutMps, Math.max(S.idlePayoutMps, over * S.payoutGainMpsPerKg));
  } else if (input.pullKg > input.dragKg && input.dragKg > 0) {
    payout = Math.min(S.maxPayoutMps, (input.pullKg - input.dragKg) * S.dragSlipMpsPerKg);
    slipping = true;
  } else if (input.bailBent) {
    // 고장 — 베일을 닫아도 스풀이 헛돌아 조금씩 밀린다
    payout = S.bailLeakMps;
  }

  // 여유줄 상한 — 조류가 끌어가는 것보다 빨리 내주면 줄은 스풀에서 뭉쳐 나온다(백래시).
  //  실제 조사가 손가락으로 스풀 가장자리를 눌러 '페더링'하는 구간을 이 상한이 대신한다.
  const slackBefore = state.lineOutM - input.requiredM;
  let overrun = false;
  if (payout > 0 && slackBefore > 0) {
    const room = Math.max(0, 1 - slackBefore / S.maxSlackM);
    if (room <= 0) { payout = 0; overrun = true; }
    else payout *= room;
  }

  const before = state.lineOutM;
  let next = before + (payout - Math.max(0, input.reelMps)) * dt;
  // 회수 하한은 "로드팁 코앞" — 0 이하로는 감기지 않는다
  next = Math.max(S.minLineM, Math.min(cap, next));
  state.lineOutM = next;

  const slackM = next - input.requiredM;
  const taut = slackM <= 0;
  return {
    lineOutM: next,
    deltaM: next - before,
    slackM,
    taut,
    tensionKg: taut ? input.pullKg : 0,
    slipping,
    spooled: next >= cap - 1e-6,
    payoutMps: payout,
    overrun,
  };
}

/**
 * 드리프트(비파이팅) 하중 추정 — 조류 항력 + 채비 무게 + 수면 위 원줄이 받는 바람.
 * "라인이 나가거나 밀리는 원리"를 인게임 물리(조류 엔진·채비 무게·기상)와 잇는 지점이다.
 */
export function driftPullKg(args: {
  /** 조류 속도 (m/s) */
  currentMps: number;
  /** 채비 총중량 (g) */
  rigWeightG: number;
  /** 풍속 (m/s) */
  windMps: number;
  /** 수면에 떠 있는 원줄 길이 (m) — 길수록 바람·조류를 더 받는다 */
  lineOutM: number;
}): number {
  const S = TUNING.spool;
  const drag = S.curPullK * Math.abs(args.currentMps);
  const weight = (args.rigWeightG / 1000) * S.weightPullFrac;
  const wind = S.windPullK * Math.abs(args.windMps) * Math.min(1.6, args.lineOutM / 20);
  return Math.max(0, drag + weight + wind);
}
