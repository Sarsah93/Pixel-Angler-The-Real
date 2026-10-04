/**
 * @file RodFit.ts
 * @description 낚싯대 · 릴 제원 → 게임 판정 (209차).
 *
 *  - 비거리 배율 = 용도 기본 × 길이 보정 × **채비 무게 적합** × 릴(롱캐스트 스풀 · 베이트 엄지 제어).
 *    대가 받는 무게보다 가벼우면 대가 휘지 않아 덜 나가고(under), 무거우면 대가 못 버텨 덜 나간다(over).
 *  - 적합 상한의 `dangerRatio`배를 넘는 채비를 세게(파워 ≥ `tipSnapPowerMin`) 던지면 **초릿대가 부러질 수 있다**
 *    (수리 가능한 `rod_tip` — 아버지 대를 영영 잃게 하지는 않는다).
 *  - 하중 = 대의 `powerKg`(구: 가격 공식). 줄이 대보다 훨씬 강하면 파이팅 중 대가 먼저 부러진다(136차 판정 재사용).
 *  - 릴 종류(스피닝/베이트)가 대와 다르면 캐스팅할 수 없다.
 *  - 거치해 둔 대의 자동 걸림(지켜보지 않는 입질에 고기가 스스로 걸리는 확률) — 원투대 + 무거운 봉돌이 높다.
 * 순수 TS — 렌더 없음.
 */

import { TUNING } from '../config/tuning.js';
import type { ReelItemSpec, RodItemSpec, RodLoadState, RodUse } from '../types/RodItem.js';

/** 용도 이름 — UI 표기 */
export const ROD_USE_LABEL: Record<RodUse, { ko: string; en: string }> = {
  float_iso: { ko: '갯바위 · 방파제 찌낚시', en: 'Float fishing (rocks · breakwater)' },
  surf: { ko: '원투', en: 'Surf casting' },
  shore_jigging: { ko: '쇼어지깅', en: 'Shore jigging' },
  shore_light: { ko: '라이트게임', en: 'Light game' },
  eging: { ko: '에깅', en: 'Eging' },
  boat_bait: { ko: '선상 타이라바 · 슬로우지깅', en: 'Boat tai-rubber · slow jigging' },
  hole: { ko: '구멍치기', en: 'Hole fishing' },
  budget: { ko: '다용도(입문)', en: 'All-round (entry)' },
};

/**
 * 용도별 비거리 기본 배율 · 그 용도의 표준 길이(m).
 * 원투 · 쇼어지깅은 멀리 던지려고 만든 대, 선상 베이트 · 구멍치기는 던지려고 만든 대가 아니다.
 */
export const ROD_USE_CAST: Record<RodUse, { base: number; typLenM: number }> = {
  float_iso: { base: 0.95, typLenM: 5.3 },
  surf: { base: 1.2, typLenM: 4.05 },
  shore_jigging: { base: 1.15, typLenM: 2.9 },
  shore_light: { base: 0.85, typLenM: 2.3 },
  eging: { base: 1.0, typLenM: 2.5 },
  boat_bait: { base: 0.7, typLenM: 2.0 },
  hole: { base: 0.7, typLenM: 2.1 },
  budget: { base: 0.85, typLenM: 2.4 },
};

/** 원줄 호수 PE → 나일론 환산(같은 인장 강도) — PE 1호 ≈ 나일론 4호 */
export const PE_TO_NYLON_NO = 4;

/** 채비 무게가 대의 적합 범위 어디에 있나 */
export function rodLoadState(spec: RodItemSpec, rigG: number): RodLoadState {
  const [lo, hi] = spec.loadG;
  if (rigG > hi * TUNING.rodSpec.dangerRatio) return 'danger';
  if (rigG > hi) return 'over';
  if (rigG < lo) return 'under';
  return 'ok';
}

/** 채비 무게 적합 배율(0.55~1) */
export function rodLoadCastK(spec: RodItemSpec, rigG: number): number {
  const [lo, hi] = spec.loadG;
  const R = TUNING.rodSpec;
  if (rigG < lo) return R.underLoadFloor + (1 - R.underLoadFloor) * Math.max(0, rigG) / lo;
  if (rigG > hi) return Math.max(R.overLoadFloor, 1 - R.overLoadSlope * (rigG - hi) / hi);
  return 1;
}

/** 비거리 배율 = 용도 기본 × 길이 보정 × 무게 적합 × 릴 */
export function rodCastDistanceMult(spec: RodItemSpec, rigG: number, reel?: ReelItemSpec): number {
  const u = ROD_USE_CAST[spec.use];
  const lenK = Math.max(0.9, Math.min(1.1, 1 + TUNING.rodSpec.lengthCastK * (spec.lengthM - u.typLenM)));
  const reelK = reel?.castMult ?? 1;
  return Math.max(0.4, Math.min(1.45, u.base * lenK * rodLoadCastK(spec, rigG) * reelK));
}

/**
 * 과부하 캐스팅에 초릿대가 부러질 확률 — 적합 상한 × `dangerRatio`를 넘는 채비를 파워 `tipSnapPowerMin` 이상으로 던질 때만.
 * (상한 대비 배수 − dangerRatio) × `tipSnapScale`, `tipSnapMax`에서 막는다.
 */
export function rodTipSnapChance(spec: RodItemSpec, rigG: number, power: number): number {
  const R = TUNING.rodSpec;
  if (power < R.tipSnapPowerMin) return 0;
  const ratio = rigG / spec.loadG[1];
  if (ratio <= R.dangerRatio) return 0;
  return Math.min(R.tipSnapMax, (ratio - R.dangerRatio) * R.tipSnapScale);
}

/** 원줄이 대에 맞나 — 나일론 환산 호수로 적합 범위와 비교 */
export function rodLineFit(spec: RodItemSpec, lineNo: number, isPe: boolean): 'thin' | 'ok' | 'thick' {
  const toNylon = (n: number, pe: boolean): number => (pe ? n * PE_TO_NYLON_NO : n);
  const n = toNylon(lineNo, isPe);
  const lo = toNylon(spec.lineNo[0], spec.lineBasis === 'pe');
  const hi = toNylon(spec.lineNo[1], spec.lineBasis === 'pe');
  if (n < lo * 0.75) return 'thin';
  if (n > hi * 1.35) return 'thick';
  return 'ok';
}

/** 릴이 대에 달리나(스피닝대에 베이트릴 · 그 반대는 안 된다) */
export function reelFitsRod(spec: RodItemSpec, reel: ReelItemSpec | undefined): boolean {
  return !reel || reel.kind === spec.reel;
}

/** 구멍치기에 쓸 만한 길이인가(테트라포드 틈에서 휘두를 수 있나) */
export function rodFitsHole(spec: RodItemSpec): boolean {
  return spec.lengthM <= TUNING.rodSpec.holeMaxLenM;
}

/**
 * 거치해 둔 대 — 지켜보지 않은 입질에 고기가 스스로 걸릴 확률.
 * 원투대는 뻣뻣한 초릿대와 무거운 봉돌이 바늘을 박아 준다(볼트 리그). 봉돌이 가벼우면 덜 박힌다.
 */
export function rodSelfHookChance(spec: RodItemSpec | undefined, sinkerG: number): number {
  const H = TUNING.rodHolder;
  const base = spec?.use === 'surf' ? H.selfHookSurf : H.selfHookOther;
  return Math.max(0, Math.min(0.9, base * Math.max(0.5, Math.min(1.2, sinkerG / 60))));
}
