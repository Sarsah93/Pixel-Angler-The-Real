/**
 * @file LureRig.ts
 * @description 루어 채비 연산 — 총중량/캐스팅·침강 파라미터 (core 단일 소스)
 *
 * UI는 이 함수들의 결과를 표시만 하고 계산하지 않는다.
 *  - 소프트 베이트: 웜(LureSpec.weightG) + 지그헤드(무게) 실시간 합산
 *  - 하드 베이트: LureSpec.weightG 자중
 * 비거리는 CastingPhysicsEngine의 airDragCd 입력(dragCoefficient)으로 표현하고,
 * 침강은 sinkType/sinkRateMps로 수직뷰가 소비한다.
 *
 * 순수 TS.
 */

import type { LureSpec, SinkType, LureKind } from '../types/Lure.js';
import type { SinkBodyType } from '../config/tuning.js';

/** 지그헤드 무게 옵션 (g) — 소프트 베이트 결합용 */
export const JIGHEAD_WEIGHTS_G = [3, 5, 7, 10, 14] as const;

/** 루어 종류 → 침강 형상 바디 타입 (computeSinkRate 드래그/종단속도 프로파일) */
export function lureBodyType(kind: LureKind): SinkBodyType {
  switch (kind) {
    case 'metal_jig':
    case 'tairaba': return 'metalJig';       // 무겁고 유선형 — 잘 뚫고 빠름
    case 'plug_minnow':
    case 'spoon': return 'minnow';           // 중간 드래그
    case 'egi':
    case 'spinner': return 'egi';            // 저항 큼 — 천천히
    case 'worm_grub':
    case 'soft_jerkbait': return 'softPlastic';
    default: return 'softPlastic';
  }
}

/** 지그헤드 아이템 id → 무게(g) 파싱 (예: 'lure_jighead_7' → 7) */
export function jigHeadWeightById(id: string | null | undefined): number {
  if (!id) return 0;
  const m = id.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/**
 * 채비 총중량 (g).
 * 소프트 베이트는 requiresJigHead → 웜 + 지그헤드 합산, 하드 베이트는 자중.
 */
export function computeLureRigWeight(lure: LureSpec, jigHeadWeightG = 0): number {
  if (lure.requiresJigHead) return lure.weightG + Math.max(0, jigHeadWeightG);
  return lure.weightG;
}

/** 캐스팅 공기저항 계수 — CastingPhysicsEngine airDragCd 입력 */
export function getLureCastCd(lure: LureSpec): number {
  return lure.dragCoefficient;
}

/** 루어 침강 프로파일 (수직뷰 Z 제어 입력) */
export interface LureSinkProfile {
  sinkType: SinkType;
  /** 하강 속도 (m/s) — floating이면 0 */
  sinkRateMps: number;
  /** floating 리트리브 파고듦 계수 (m) */
  diveDepthPerRetrieve: number;
}

/**
 * 침강 프로파일 산출.
 * 소프트 베이트는 지그헤드가 무거울수록 sinkRate가 가속된다(무게 비례).
 */
export function getLureSinkProfile(lure: LureSpec, jigHeadWeightG = 0): LureSinkProfile {
  if (lure.sinkType === 'floating') {
    return { sinkType: 'floating', sinkRateMps: 0, diveDepthPerRetrieve: lure.diveDepthPerRetrieve ?? 1.2 };
  }
  let rate = lure.sinkRateMps ?? 0.25;
  // 소프트 베이트: 지그헤드 무게로 침강 가속 (3g 기준 대비 g당 +4%)
  if (lure.requiresJigHead && jigHeadWeightG > 0) {
    rate *= 1 + Math.max(0, jigHeadWeightG - 3) * 0.04;
  }
  return { sinkType: lure.sinkType, sinkRateMps: rate, diveDepthPerRetrieve: 0 };
}
