/**
 * @file Foraging.ts
 * @description 인-맵 채집(해루질) · 어장(어촌계 마을어장) 폴리곤 · 강원 조례 규제 타입 (121차).
 *
 * 리서치 근거(2026-09-09 웹 조사 — 워크로그 121 §2):
 *  - 동해안 해루질 = 서해 갯벌식이 아니라 **암반 조간대·갯바위·방파제 발밑 얕은 물**에서 소라·홍합·성게·
 *    해삼·문어를 줍거나 뜰채/갈고리로 건지는 방식(조차 수십 cm, 수심 깊음). 스킨 잠수('물질')는 별개 축.
 *  - 강원특별자치도 「비어업인의 수산자원 포획·채취 기준에 관한 조례」 2024-07-26 시행 —
 *    어촌계 어장(마을어장·협동양식장) 안 **전복·해삼·성게·홍합·문어** 포획 금지(1천만 원 이하 벌금),
 *    산란기 도루묵(10~12월)·대문어 8kg↑(3~5월) 제한, 스쿠버 금지, 채집물 **판매·유통 금지**(과태료 200만 원).
 *  - 시행령 허용 도구: 투망·뜰채·반두·손들망·외줄낚시·가리·통발·집게·갈고리·호미·삽·손 (동력 금지).
 *
 * 어장 폴리곤은 `tools/extract_fishfarms.py`가 국립해양조사원 어장정보(EPSG:5179)를 지역 타일 좌표로 클립한
 * `public/data/<region>/fishfarms.json`(RegionFishFarms)이다.
 */

/** 채집 도구 — 시행령 허용 범위 안. 'hand' = 맨손 */
export type ForageTool = 'hand' | 'tongs' | 'net' | 'gaff';

/**
 * 접근 방식 — 현재는 'shore'(뭍에서)만 구현. 'wade'(가슴장화 얕은 물 진입)·'dive'(스킨/스쿠버)는
 * 후속 확장 자리(사용자 계획 2026-09-09). 생물마다 요구 접근을 두면 스쿠버 전용 채집을 데이터로 열 수 있다.
 */
export type ForageAccess = 'shore' | 'wade' | 'dive';

/** 채집 스팟 지형 종류 — 씬이 타일 규칙으로 후보를 만든다 */
export type ForageSpotKind =
  | 'rock_shore'    // 갯바위·암반 조간대 (조도·섬/암초 셀·암반 해안)
  | 'armor_foot'    // 방파제 사석·테트라포드 발밑
  | 'tidepool'      // 간조에 드러나는 웅덩이 (암반 안쪽 물 타일)
  | 'harbor_wall';  // 항만 안벽 아래 (홍합·굴 고착)

/** 씬이 넘기는 스팟 후보 (걷기 가능한 뭍 타일 — 물에 인접) */
export interface ForageCandidate {
  tx: number;
  ty: number;
  kind: ForageSpotKind;
}

/** 롤링된 채집 스팟 (세션 메모리 — 시간 시드로 재현 가능하므로 세이브 불필요) */
export interface ForageSpot {
  id: string;
  tx: number;
  ty: number;
  kind: ForageSpotKind;
  creatureId: string;
  /** 발견에 필요한 최소 랜턴 루멘 (0 = 낮에도 보임) — 생물 DB 승계 */
  minLampLumens: number;
  /** 어장 안이면 그 어장 이름 (조례 판정용) */
  farmName?: string;
  farmKind?: FishFarmKind;
}

// ─────────────────────────────────────────────
// 어장 폴리곤 (fishfarms.json)
// ─────────────────────────────────────────────

export type FishFarmKind = 'village' | 'coop' | 'setnet' | 'shellfish_farm' | 'cage' | 'other';

export interface FishFarm {
  gid: number;
  kind: FishFarmKind;
  /** 원문 어업 종류 (마을어업 · 협동양식업 · 정치망어업 …) */
  kindKo: string;
  /** 면허 번호 = 표시 이름 (예: 마을어업속초9) */
  name: string;
  license: string;
  method: string;
  farmDesc: string;
  areaHa: number;
  validFrom: string;
  validUntil: string;
  admin: string;
  /** 링 목록 — 타일 좌표 [tx, ty] (첫 링 = 외곽, 이후 = 구멍 또는 별도 조각) */
  rings: [number, number][][];
}

export interface RegionFishFarms {
  region: string;
  source: string;
  crs: 'tile';
  farms: FishFarm[];
}

/** 강원 조례가 "어촌계 어장"으로 보는 종류 — 마을어장 + 협동양식장 */
export function isProtectedFarmKind(kind: FishFarmKind): boolean {
  return kind === 'village' || kind === 'coop';
}

export const FISH_FARM_KIND_LABEL: Record<FishFarmKind, string> = {
  village: '마을어장',
  coop: '협동양식장',
  setnet: '정치망',
  shellfish_farm: '패류 양식장',
  cage: '가두리 양식장',
  other: '어장',
};

/** 점-폴리곤(짝수-홀수 규칙). ring은 닫혀 있지 않아도 된다. */
export function pointInRing(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const cross = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (cross) inside = !inside;
  }
  return inside;
}

/** 어떤 어장 링이든 포함하면 그 어장 (구멍 링은 구분하지 않는다 — 실데이터 링 = 조각 단위) */
export function farmAt(farms: FishFarm[], tx: number, ty: number): FishFarm | undefined {
  for (const f of farms) {
    for (const ring of f.rings) {
      if (pointInRing(tx, ty, ring)) return f;
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────
// 강원 조례 규제 상수
// ─────────────────────────────────────────────

export const GANGWON_FORAGE_ORDINANCE = {
  effectiveFrom: '2024-07-26',
  /** 어촌계 어장 안 포획 금지 정착성 5종 — ShoreCreatureDatabase id */
  protectedCreatureIds: [
    'haliotis_discus',            // 전복
    'stichopus_japonicus',        // 해삼
    'strongylocentrotus_nudus',   // 성게
    'heliocidaris_crassispina',    // 말똥성게
    'mytilus_coruscus',           // 홍합(섭)
    'octopus_vulgaris',           // 문어
  ] as readonly string[],
  /** 법정 벌금 상한 (안내문 표기용 — 게임 벌금은 TUNING.forage.fineRatio/fineCapWon) */
  fineMaxWon: 10_000_000,
  saleFineMaxWon: 2_000_000,
  /** 도내 전 수역 — 산란기 도루묵 (통발 등 포획 제한) */
  sandfishSpawnMonths: [10, 11, 12] as readonly number[],
  /** 도내 전 수역 — 산란기 대문어 8kg 이상 */
  giantOctopusSpawnMonths: [3, 4, 5] as readonly number[],
  giantOctopusProtectKg: 8,
} as const;

/** 채집물(해루질·통발 포획 생물)은 판매·유통 금지 — 자가 소비·요리 sink 전용 */
export const FORAGE_CATCH_SELLABLE = false;
