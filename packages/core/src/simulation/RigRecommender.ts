/**
 * @file RigRecommender.ts
 * @description 채비 추천 알고리즘 — 지역/지형/물때/대상어종 반영
 *
 * 채비하기(U) 창과 낚시용품점에서 "추천" 마크를 띄우기 위한 순수 로직.
 * 대상어종의 서식 지형·수심층·미끼 선호와 낚시터 밑걸림 위험(여밭)·수심·물때(조류)를
 * 종합해 **조법 / 찌 호수 / 무게추 봉돌 종류·호수 / 미끼**를 추천한다.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import { ORACLE_FISH_DB, BaitKey, HabitatTerrain } from './FishSpawningOracle.js';
import { WeightSinkerKind, sinkerWeightByHo } from '../db-schema/SinkerDatabase.js';

/** 조법 */
export type FishingTechnique = 'float_semi' | 'float_full' | 'surf' | 'lure';

export const TECHNIQUE_LABEL: Record<FishingTechnique, string> = {
  float_semi: '반유동 찌낚시',
  float_full: '전유동 찌낚시',
  surf: '원투 (던질낚시)',
  lure: '루어',
};

/** 밑걸림 위험도 (RegionAreaNode.snagRisk와 동일 체계) */
export type SnagRisk = 'low' | 'mid' | 'high';

export interface RigRecoContext {
  regionId: string;
  /** 낚시터 밑걸림 위험 (여밭 정도) */
  snagRisk: SnagRisk;
  /** 물때 1~15 (8물 사리 근처가 조류 최강) */
  tidePhase: number;
  /** 대표 수심 (m) */
  depthM: number;
  isNight: boolean;
  /** 지역 선호 어종 (오라클 speciesId — 어획량/스폰 가중 상위) */
  targetSpeciesIds: string[];
}

export interface RigRecommendation {
  technique: FishingTechnique;
  techniqueLabel: string;
  /** 추천 찌 호수 (찌낚시 조법) — 원투면 undefined */
  floatHo?: number;
  /** 추천 무게추 봉돌 종류 (원투 조법) */
  sinkerKind?: WeightSinkerKind;
  /** 추천 봉돌 호수 범위 (원투 조법) */
  sinkerHoRange?: [number, number];
  /** 추천 봉돌 무게 범위 (g) */
  sinkerWeightRange?: [number, number];
  /** 추천 미끼 BaitKey (우선순위 순) */
  baitKeys: BaitKey[];
  /** 대상어종 이름 (표시용) */
  targetNames: string[];
  /** 추천 근거 (사람이 읽는 설명 줄) */
  reasons: string[];
}

/** 조류 세기 (물때 → 0~1, 8물 사리 근처 최강) */
function currentStrength(tidePhase: number): number {
  const d = Math.abs(tidePhase - 8);
  return Math.max(0.2, 1 - d / 7);
}

/** 지형 다수결 — 대상어종 서식 지형 최빈값 */
function dominantHabitat(speciesIds: string[]): HabitatTerrain {
  const count: Partial<Record<HabitatTerrain, number>> = {};
  for (const id of speciesIds) {
    const spec = ORACLE_FISH_DB.find((s) => s.speciesId === id);
    if (!spec) continue;
    for (const h of spec.habitat) count[h] = (count[h] ?? 0) + 1;
  }
  let best: HabitatTerrain = 'sand';
  let bestN = -1;
  (Object.keys(count) as HabitatTerrain[]).forEach((h) => {
    if ((count[h] ?? 0) > bestN) { best = h; bestN = count[h] ?? 0; }
  });
  return best;
}

/** 대상어종 미끼 선호 상위 집계 (선호 점수 합산) */
function topBaits(speciesIds: string[], n = 3): BaitKey[] {
  const score: Partial<Record<BaitKey, number>> = {};
  for (const id of speciesIds) {
    const spec = ORACLE_FISH_DB.find((s) => s.speciesId === id);
    if (!spec) continue;
    (Object.keys(spec.baitPreference) as BaitKey[]).forEach((b) => {
      score[b] = (score[b] ?? 0) + (spec.baitPreference[b] ?? 0);
    });
  }
  return (Object.keys(score) as BaitKey[])
    .sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0))
    .slice(0, n);
}

/**
 * 채비 추천 산출.
 *
 * 조법 결정:
 *  - 여밭/암초(reef·structure) 대상 → 반유동 찌낚시 (채비를 띄워 밑걸림 회피)
 *  - 모래/뻘 바닥(sand·mud) 대상 → 원투 (무게추 봉돌로 바닥 공략)
 *  - 외양 회유(open) + 상층 → 루어
 *  - 그 외 혼합 → 수심 깊고 조류 세면 원투, 얕으면 반유동
 */
export function getRigRecommendation(ctx: RigRecoContext): RigRecommendation {
  const habitat = dominantHabitat(ctx.targetSpeciesIds);
  const strength = currentStrength(ctx.tidePhase);
  const deep = ctx.depthM >= 10;
  const reasons: string[] = [];
  const targetNames = ctx.targetSpeciesIds
    .map((id) => ORACLE_FISH_DB.find((s) => s.speciesId === id)?.nameKo)
    .filter((v): v is string => !!v)
    .slice(0, 3);

  let technique: FishingTechnique;
  if (habitat === 'reef' || habitat === 'structure') {
    technique = 'float_semi';
    reasons.push('여밭·암초 대상어종 — 채비를 띄우는 반유동 찌낚시로 밑걸림을 피하세요.');
  } else if (habitat === 'sand' || habitat === 'mud') {
    technique = 'surf';
    reasons.push('모래·뻘 바닥 대상어종 — 무게추 봉돌로 바닥을 공략하는 원투가 유리합니다.');
  } else if (habitat === 'open') {
    technique = ctx.isNight ? 'float_semi' : 'lure';
    reasons.push(ctx.isNight
      ? '외양 회유어 — 야간엔 반유동 찌낚시로 표·중층을 노리세요.'
      : '외양 회유어 — 루어로 넓게 탐색하세요.');
  } else {
    technique = deep && strength > 0.6 ? 'surf' : 'float_semi';
    reasons.push(deep && strength > 0.6
      ? '수심이 깊고 조류가 세어 원투로 바닥을 잡는 편이 안정적입니다.'
      : '수심이 얕아 반유동 찌낚시가 무난합니다.');
  }

  // 밑걸림 위험이 크면 찌낚시로 보정 (원투는 바닥 걸림 위험)
  if (technique === 'surf' && ctx.snagRisk === 'high') {
    technique = 'float_semi';
    reasons.push('다만 밑걸림 위험이 커(여밭) 원투는 채비 손실 위험 — 반유동으로 전환 권장.');
  }

  const baitKeys = topBaits(ctx.targetSpeciesIds);
  const reco: RigRecommendation = {
    technique,
    techniqueLabel: TECHNIQUE_LABEL[technique],
    baitKeys,
    targetNames,
    reasons,
  };

  if (technique === 'surf') {
    // 봉돌 호수: 수심·조류 셀수록 무겁게 (16~30호)
    let loHo: number, hiHo: number;
    if (ctx.depthM < 6 && strength < 0.5) { loHo = 16; hiHo = 20; }
    else if (ctx.depthM <= 12) { loHo = 20; hiHo = 25; }
    else { loHo = 25; hiHo = 30; }
    // 종류: 예민한 입질(감성돔·도다리 등 바닥 어종) → 이물감 적은 구멍 봉돌, 그 외 고리
    const sinkerKind: WeightSinkerKind = strength > 0.75 ? 'ring' : 'hole';
    reco.sinkerKind = sinkerKind;
    reco.sinkerHoRange = [loHo, hiHo];
    reco.sinkerWeightRange = [sinkerWeightByHo(loHo), sinkerWeightByHo(hiHo)];
    reasons.push(
      `봉돌: ${sinkerKind === 'hole' ? '구멍 봉돌(이물감↓, 예신 피드백 +15%)' : '고리 봉돌'} ${loHo}~${hiHo}호 (${sinkerWeightByHo(loHo)}~${sinkerWeightByHo(hiHo)}g) — 수심·조류 대응.`,
    );
    reasons.push('강풍/원투 비거리 필요 시 묶음추는 저항이 커 피하세요.');
  } else if (technique !== 'lure') {
    // 찌낚시(반유동/전유동) — 찌 호수: 깊고 조류 셀수록 큰 부력 (0.5~1.5호)
    const ho = deep || strength > 0.7 ? (deep && strength > 0.7 ? 1.5 : 1.0) : 0.8;
    reco.floatHo = ho;
    reasons.push(`찌: ${ho}호 구멍찌 — 수심 ${ctx.depthM.toFixed(0)}m·조류 세기에 맞춘 부력.`);
  }

  if (baitKeys.length > 0) {
    reco.reasons.push(`미끼 우선순위: ${baitKeys.join(' · ')}`);
  }

  return reco;
}
