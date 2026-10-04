/**
 * @file SnagDrag.ts
 * @description 밑걸림 끌림 모델 · 낚싯대 거치대 타입 (207차).
 *
 * 밑걸림은 **채비가 장애물 위를 움직일 때** 생긴다 — 바닥에 멈춰 있는 봉돌은 걸리지 않는다.
 *  - 원투: 릴링으로 끌어오거나, 물살 · 파도가 가벼운 봉돌을 굴릴 때.
 *  - 찌: 바닥층을 노릴 때 수중찌 아래 목줄 · 바늘이 속조류에 날려 여에 감길 때.
 *  - 루어: 바닥을 긁으며 감을 때.
 */

import type { StorySpotKind } from './Story.js';
import type { FootingKind } from '../simulation/LandingDrop.js';

/** 채비 갈래 — 장애물에 닿는 높이가 다르다 */
export type SnagRigKind = 'float' | 'sinker' | 'lure';

/** 한 프레임의 끌림 */
export interface SnagDragInput {
  /** 이번 프레임 미끼(봉돌)가 바닥 위를 움직인 수평 거리(m) */
  dragM: number;
  /** 프레임 길이(초) — 물살 요동 잡음 거르기 */
  dtSec: number;
  /** 바닥에서 미끼까지 높이(m, 0 = 바닥에 닿음) */
  clearanceM: number;
  /** 그 자리 바닥이 여(암초 · 블록)인가 */
  inReef: boolean;
  kind: SnagRigKind;
  /** 물살 0~1 — 찌 목줄이 날리는 정도 */
  flow01: number;
  /** 자리 · 루어 · 강수 · 구멍치기 · 퀘스트 첫 진행 등 위험 배율의 곱 */
  riskMult: number;
}

/** 원투 봉돌이 바닥을 지키는가 */
export interface SinkerHoldResult {
  /** 구르는가(물살 또는 파도에 밀림) */
  rolling: boolean;
  /** 무엇이 미는가 */
  cause: 'none' | 'current' | 'wave';
  /** 파도에 밀려 발 앞으로 끌려오는 속도(m/s · 거리 감소) — 물살 굴림은 205차 하류 이동이 맡는다 */
  shorewardMps: number;
}

/**
 * 거치대에 걸어 둔 채비의 상태.
 *  - `hooked`(209차) — 지켜보지 않은 입질에 고기가 스스로 걸렸다(초릿대가 크게 휜 채 들썩인다). 잡으면 바로 파이팅.
 *  - `tangled`(209차) — 다른 대로 파이팅하는 동안 고기가 옆으로 째서 줄이 엉켰다. 잡으면 목줄을 잘라 내고 감아 들인다.
 */
export type ParkedRodPhase = 'waiting' | 'bite' | 'snagged' | 'hooked' | 'tangled';

/** 한 번 굴렸을 때 일어난 일 */
export type ParkedRodEvent = 'snagged' | 'bite' | 'bite_missed' | 'hooked' | 'escaped' | 'tangled';

/** 거치대 한 대를 한 번 굴리는 데 필요한 주변 값 */
export interface ParkedRodStepEnv {
  dtSec: number;
  /** 물살 0~1 · 파고(m) */
  flow01: number;
  waveM: number;
  /** 거치대에 미끼가 남았나(없으면 입질이 없다) */
  baitless: boolean;
  /** 자동 걸림 확률(`rodSelfHookChance` — 대 용도 · 봉돌 무게) */
  selfHookChance: number;
  /** 초당 엉킴 확률(1인칭 파이팅 중 고기가 옆으로 크게 짤 때만 > 0) */
  tanglePerSec: number;
  /** 시각(ms · 기록용) · 난수 */
  nowMs: number;
  rng: () => number;
}

/** 걸어 둔 채비 스냅샷(1인칭 복귀 때 그대로 돌려 놓는다) */
export interface ParkedRigSnapshot {
  distM: number;
  floatX: number;
  baitX: number;
  baitZ: number;
  settled: boolean;
  /** 풀려 나간 원줄(m) */
  lineOutM: number;
}

/** 1인칭을 다시 띄울 인자(탑다운 캐스팅 때와 같은 값) */
export interface ParkedRodLaunch {
  zMaxM: number;
  castDistanceM: number;
  reefSeed: number;
  shoreKind?: 'sand' | 'grass' | 'gravel';
  spotKind?: StorySpotKind;
  footing?: FootingKind;
  tideLiftM?: number;
}

/** 낚싯대 거치대 — 세이브 `parkedRods`(208차 — 한 사람이 최대 `TUNING.rodHolder.maxHolders` 대 · 대마다 낚싯대 한 벌) */
export interface ParkedRodState {
  id: string;
  regionId: string;
  /** 놓은 맵(`regionId:mapId`) — 멀티 설치물 채널과 같은 키 */
  mapKey: string;
  /** 거치대 자리 · 착수점(월드 px) */
  x: number;
  y: number;
  landX: number;
  landY: number;
  parkedAtMs: number;
  launch: ParkedRodLaunch;
  rig: ParkedRigSnapshot;
  /** 거치하던 순간의 입질 확률(초당) */
  biteProbPerSec: number;
  /** 봉돌이 여 위에 놓였나 */
  onReef: boolean;
  /** 밑걸림 위험 배율(자리 · 강수 · 퀘스트 첫 진행) */
  snagRisk: number;
  /** 봉돌 무게(g) — 걸어 둔 동안 물살 · 파도 굴림 판정 */
  sinkerG: number;
  phase: ParkedRodPhase;
  phaseAtMs: number;
  /** 209차 — 지금 상태로 굴린 시간(초). 입질 창을 벽시계가 아니라 이 값으로 잰다(구세이브 = 없음 → 0) */
  phaseAgeSec?: number;
}
