/**
 * @file LineWear.ts
 * @description 원줄 · 목줄 내구도(마모) 모델 (273차).
 *
 * ## 왜 「내구도」를 두나
 * 그전까지 줄은 **터질 때만** 잃는 소모품이었다(206차 — 터진 길이만 스풀에서 잘린다). 터지기 전까지는
 * 새 줄과 똑같이 셌다. 실제로는 반대다 — 줄은 터지기 **전에** 서서히 약해지고, 그 약해진 줄로 큰 고기를
 * 걸어서 터진다. 낚시꾼이 매듭 위 몇 미터를 잘라 내고 다시 묶는 관행이 그래서 있다.
 *
 * ## 모델(현실 요소 → 수식)
 *  - **마모 0~1**은 묶인 줄 한 가닥의 상태다. 스풀을 바꾸거나 잘리면 0(새로 묶은 줄).
 *  - **세기** = 공칭(호수 환산) × (1 − 마모 × `strengthLossAtWorn`) × (나일론은 젖어서 1 − `nylonWetLoss`).
 *    마모 1이면 세기가 절반 — 그 줄로는 평소 잡던 고기도 터진다.
 *  - **쌓이는 길**
 *    · 파이팅 피로: 장력비(그 줄의 세기 대비)가 문턱 0.5를 넘는 동안 (초과분)² × 초 — 한계 근처에서 버틸수록 빨리 지친다.
 *    · 랜딩 충격: 들어 올리는 순간 무게 ÷ 세기 — 늘어나지 않는 합사가 충격을 그대로 받는다. 목줄은 고기 몸에 쓸려 1.5배.
 *    · 밑걸림 당김: 바위에 긁힌 줄을 끌어냈다 — 목줄 0.12 · 원줄 0.04(× 재질 쓸림).
 *    · 캐스팅: 던질 때마다 가이드를 지난다 — 합사가 결이 일어 가장 크고, 목줄은 1/3.
 *    · 바닥 끌림: 여 위를 끌린 거리(m) × 바닥 근접도(밑걸림 모델과 같은 값) — 목줄이 긁히고 원줄은 1/5.
 *  - **재질**(`LINE_MATERIAL_TRAITS`): 나일론 = 늘어나 충격을 받아 주지만 물을 먹어 약해지고 피로가 빠르다 ·
 *    카본(플로로카본) = 쓸림에 강하고 물을 안 먹는다 · 합사(PE) = 세지만 쓸림 · 가이드에 약하고 충격을 못 받아 준다.
 *  - **단계** 새 줄(< 0.2) · 쓸림 조금(< 0.5) · 쓸림 심함(< 0.8 — 다시 매라) · 끊어지기 직전(≥ 0.8).
 *  - **다시 매기**: 목줄 1.5m · 원줄 3m를 스풀에서 잘라 내고 마모 0 — 206차 `cutLine`과 같은 길.
 *
 * 순수 TS — 렌더/브라우저 API 없음. 상태 보관 · 적용은 client `InventoryStore`(마모 값) · `FirstPersonFishingScene`(쌓는 자리).
 */

import { TUNING } from '../config/tuning.js';
import type { LineMaterialKey, LineMaterialTraits, LineRole, LineWearStage } from '../types/LineWear.js';

/** 재질별 성질(1 = 나일론 기준) — 데이터라 TUNING이 아니라 여기 둔다 */
export const LINE_MATERIAL_TRAITS: Readonly<Record<LineMaterialKey, LineMaterialTraits>> = {
  nylon: {
    labelKo: '나일론', abrasion: 1.0, fatigue: 1.1, cast: 0.6, shock: 0.7, wet: true,
    traitKo: '늘어나서 충격을 받아 준다. 물을 먹으면 조금 약해지고, 당겼다 놓기를 거듭하면 지친다.',
    shortKo: '늘어남 · 젖으면 약해짐',
  },
  monofilament: {
    labelKo: '모노', abrasion: 1.0, fatigue: 1.1, cast: 0.6, shock: 0.7, wet: true,
    traitKo: '늘어나서 충격을 받아 준다. 물을 먹으면 조금 약해지고, 당겼다 놓기를 거듭하면 지친다.',
    shortKo: '늘어남 · 젖으면 약해짐',
  },
  fluorocarbon: {
    labelKo: '카본', abrasion: 0.55, fatigue: 0.9, cast: 0.6, shock: 1.0, wet: false,
    traitKo: '여에 쓸려도 잘 버틴다. 물을 먹지 않지만 덜 늘어나 충격이 그대로 온다.',
    shortKo: '쓸림에 강함 · 충격 그대로',
  },
  pe_braid: {
    labelKo: '합사', abrasion: 1.8, fatigue: 0.5, cast: 1.4, shock: 1.5, wet: false,
    traitKo: '같은 호수에서 가장 세지만 바위에 쓸리면 금방 터지고, 던질 때마다 가이드에 결이 인다. 충격을 못 받아 준다.',
    shortKo: '셈 · 쓸림 · 가이드에 약함',
  },
};

/** 단계 이름(채비 창 · 알림) */
export const LINE_WEAR_STAGE_KO: Readonly<Record<LineWearStage, string>> = {
  fresh: '새 줄', light: '쓸림 조금', heavy: '쓸림 심함', critical: '끊어지기 직전',
};

/** 역할 이름 */
export const LINE_ROLE_KO: Readonly<Record<LineRole, string>> = { main: '원줄', leader: '목줄' };

/** 아이템의 재질 — `lineMaterial`이 없으면 이름으로 추정(합사/PE → 합사 · 카본/플로로 → 카본 · 그 밖 → 나일론) */
export function lineMaterialOf(item: { name: string; lineMaterial?: LineMaterialKey | string } | null | undefined): LineMaterialKey {
  if (!item) return 'nylon';
  const m = item.lineMaterial;
  if (m === 'nylon' || m === 'fluorocarbon' || m === 'pe_braid' || m === 'monofilament') return m;
  if (/PE|합사/i.test(item.name)) return 'pe_braid';
  if (/카본|플로로|fluoro/i.test(item.name)) return 'fluorocarbon';
  return 'nylon';
}

/** 0~1로 잘라 둔다 */
export function clampLineWear(w: number): number {
  return Number.isFinite(w) ? Math.max(0, Math.min(1, w)) : 0;
}

/** 마모 → 단계 */
export function lineWearStage(wear: number): LineWearStage {
  const T = TUNING.lineWear;
  const w = clampLineWear(wear);
  if (w >= T.stageCritical) return 'critical';
  if (w >= T.stageHeavy) return 'heavy';
  if (w >= T.stageLight) return 'light';
  return 'fresh';
}

/** 단계 순서(알림은 오르는 쪽만) */
export const LINE_WEAR_STAGE_ORDER: readonly LineWearStage[] = ['fresh', 'light', 'heavy', 'critical'];

/**
 * 지금 세기(kg) — 공칭 × 마모 감소 × 젖음.
 * @param nominalKg 호수 환산 세기(`lineStrengthKg`)
 */
export function effectiveLineStrengthKg(nominalKg: number, wear: number, material: LineMaterialKey): number {
  const T = TUNING.lineWear;
  const tr = LINE_MATERIAL_TRAITS[material];
  const wet = tr.wet ? 1 - T.nylonWetLoss : 1;
  return Math.max(0.1, nominalKg * wet * (1 - clampLineWear(wear) * T.strengthLossAtWorn));
}

/**
 * 파이팅 피로 — 이번 프레임에 쌓이는 마모.
 * @param tension01 **그 줄** 기준 장력비(요구 장력 ÷ 그 줄의 세기). 게이지(약한 쪽 기준)에서 옮기려면 `lineTensionRatioOf`.
 */
export function fightFatigueWear(tension01: number, dtSec: number, material: LineMaterialKey): number {
  const T = TUNING.lineWear;
  if (!(dtSec > 0)) return 0;
  const over = Math.max(0, Math.min(1.5, tension01) - T.fatigueThreshold);
  if (over <= 0) return 0;
  return over * over * T.fatigueK * LINE_MATERIAL_TRAITS[material].fatigue * dtSec;
}

/** 게이지 장력비(약한 쪽 세기 기준 0~1) → 이 줄의 장력비 */
export function lineTensionRatioOf(gauge01: number, weakestKg: number, thisLineKg: number): number {
  if (!(weakestKg > 0) || !(thisLineKg > 0)) return 0;
  return Math.max(0, gauge01) * weakestKg / thisLineKg;
}

/** 랜딩 충격 — 들어 올리는 순간 한 번(무리 걸림은 무게를 합쳐 넘긴다) */
export function landingShockWear(weightKg: number, strengthKg: number, material: LineMaterialKey, role: LineRole): number {
  const T = TUNING.lineWear;
  if (!(weightKg > 0) || !(strengthKg > 0)) return 0;
  const base = T.shockK * Math.min(2, weightKg / strengthKg) * LINE_MATERIAL_TRAITS[material].shock;
  return role === 'leader' ? base * T.landingLeaderMult : base * T.landingMainMult;
}

/** 밑걸림을 끌어냈다(채비를 건졌다) — 바위에 긁힌 몫 */
export function snagPullWear(material: LineMaterialKey, role: LineRole): number {
  const T = TUNING.lineWear;
  return (role === 'leader' ? T.snagPullLeader : T.snagPullMain) * LINE_MATERIAL_TRAITS[material].abrasion;
}

/** 캐스팅 한 번 — 가이드 쓸림 */
export function castWear(material: LineMaterialKey, role: LineRole): number {
  const T = TUNING.lineWear;
  const base = T.castK * LINE_MATERIAL_TRAITS[material].cast;
  return role === 'leader' ? base * T.castLeaderFrac : base;
}

/**
 * 바닥 끌림 — 여 위를 끌린 거리.
 * @param proximity01 바닥 근접도(밑걸림 모델 `snagProximity`와 같은 값 — 떠 있으면 0)
 */
export function bottomDragWear(dragM: number, proximity01: number, material: LineMaterialKey, role: LineRole): number {
  const T = TUNING.lineWear;
  if (!(dragM > 0) || !(proximity01 > 0)) return 0;
  const base = T.dragPerM * dragM * Math.min(1, proximity01) * LINE_MATERIAL_TRAITS[material].abrasion;
  return role === 'leader' ? base : base * T.dragMainFrac;
}

/** 다시 맬 때 스풀에서 잘라 내는 길이(m) */
export function retieCutM(role: LineRole): number {
  return role === 'leader' ? TUNING.lineWear.retieLeaderM : TUNING.lineWear.retieMainM;
}

/** 쌓은 뒤의 마모(잘라 둔다) */
export function addLineWear(wear: number, delta: number): number {
  return clampLineWear(clampLineWear(wear) + Math.max(0, delta));
}
