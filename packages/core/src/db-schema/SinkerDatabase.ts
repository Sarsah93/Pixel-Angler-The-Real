/**
 * @file SinkerDatabase.ts
 * @description 원투(던질낚시) 메인 싱커 — 무게추 봉돌 데이터베이스
 *
 * 찌낚시의 목줄용 '좁쌀 봉돌'과 달리, 원투 채비는 채비 전체를 멀리 던지고
 * 바닥에 안착시키는 **메인 싱커(무게추 봉돌)** 를 도래 아래에 단다.
 *
 * 무게(g) = 호수 × 3.75 (반올림)
 *
 * 종류별 특성:
 *  - 고리 봉돌 (HaeDong): 표준 고리형. 특성 보정 없음.
 *  - 구멍 봉돌 (BaekKyung): 원줄이 봉돌 구멍을 관통 — 물고기가 봉돌 무게를 덜 느껴
 *    이물감이 감소한다. 예신(전조 입질) 타이밍 피드백 +15% 버프.
 *  - 묶음추 봉돌 (Sapa): 여러 편납을 묶은 형태 — 공기 저항이 커서 비거리 페널티.
 *    공기 저항 계수(C_d) 0.42 → 0.58.
 *
 * 순수 TS 데이터 — 렌더/브라우저 API 없음.
 */

/** 무게추 봉돌 종류 (고리/구멍/묶음추) */
export type WeightSinkerKind = 'ring' | 'hole' | 'bundle';

export const SINKER_KIND_LABEL: Record<WeightSinkerKind, string> = {
  ring: '고리 봉돌',
  hole: '구멍 봉돌',
  bundle: '묶음추 봉돌',
};

/** 종류별 제조 브랜드(가상 명칭) */
export const SINKER_KIND_BRAND: Record<WeightSinkerKind, string> = {
  ring: 'HaeDong',
  hole: 'BaekKyung',
  bundle: 'Sapa',
};

/** 봉돌 무게(g) = 호수 × 3.75 (반올림) */
export function sinkerWeightByHo(ho: number): number {
  return Math.round(ho * 3.75);
}

/** 기본 공기 저항 계수 (일반 채비) */
export const SINKER_BASE_DRAG_CD = 0.42;
/** 묶음추 봉돌 공기 저항 계수 (비거리 페널티) */
export const SINKER_BUNDLE_DRAG_CD = 0.58;
/** 구멍 봉돌 예신 타이밍 피드백 배율 (+15% — 이물감 감소) */
export const SINKER_HOLE_FEEDBACK_MULT = 1.15;

export interface WeightSinkerSpec {
  /** 인벤토리 아이템 id */
  id: string;
  kind: WeightSinkerKind;
  /** 브랜드(가상) */
  brand: string;
  /** 호수 */
  ho: number;
  /** 자중 (g) */
  weightG: number;
  /** 표시 이름 (예: '고리봉돌 20호') */
  nameKo: string;
  /** 기준가 (원) — 무게 비례 목업 */
  price: number;
}

/** 종류별 취급 호수 목록 (제원 표 기준) */
const KIND_HOS: Record<WeightSinkerKind, number[]> = {
  ring: [16, 20, 25, 30],
  hole: [10, 15, 20, 25, 30],
  bundle: [16, 20, 25, 30],
};

function buildSinkerDb(): WeightSinkerSpec[] {
  const out: WeightSinkerSpec[] = [];
  (Object.keys(KIND_HOS) as WeightSinkerKind[]).forEach((kind) => {
    const label = SINKER_KIND_LABEL[kind].replace(' 봉돌', '봉돌');
    for (const ho of KIND_HOS[kind]) {
      const weightG = sinkerWeightByHo(ho);
      out.push({
        id: `inv_sinker_${kind}_${ho}`,
        kind,
        brand: SINKER_KIND_BRAND[kind],
        ho,
        weightG,
        nameKo: `${label} ${ho}호`,
        price: 1500 + weightG * 30,
      });
    }
  });
  return out;
}

/** 무게추 봉돌 전체 목록 (고리 4 + 구멍 5 + 묶음추 4 = 13종) */
export const WEIGHT_SINKER_DB: WeightSinkerSpec[] = buildSinkerDb();

/** 아이템 id로 무게추 봉돌 제원 조회 */
export function getWeightSinkerSpec(id: string): WeightSinkerSpec | undefined {
  return WEIGHT_SINKER_DB.find((s) => s.id === id);
}
