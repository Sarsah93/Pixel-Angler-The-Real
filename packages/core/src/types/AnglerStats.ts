/**
 * @file AnglerStats.ts
 * @description 캐릭터 물리 스탯 + 탑다운 다차원 캐스팅 공간(Zone/수심) 기초 타입
 *
 * 탑다운 뷰에서 화면 Y축은 [땅(Zone 0) → 연안(Zone 1) → 중양(Zone 2) → 심해(Zone 3)]의
 * 거리·수심 축으로 투영된다 (XY ↔ XZ/YZ 다차원 벡터 모델).
 * 지역이 추가될 때는 지형별 한계 수심(Z_max) 프로필만 전달하면 연동되도록
 * 여기서 공통 타입을 선언해 둔다. (CastingModel/기상 API 통합은 추후 단계)
 */

/** 캐릭터 물리 스탯 — Status 창(S) 표시 및 캐스팅/파이팅 물리 계수 */
export interface AnglerStats {
  /** 근력/완력 — 캐스팅 초기 힘 벡터(V0) 크기 증가, 파이팅 최대 장력 허용치 */
  strength: number;
  /** 민첩/제어력 — 캐스팅 게이지 스윗스팟 폭 확대, 드랙 완충 프레임 증가 */
  dexterity: number;
  /** 평형감각 — 파고(Wave Height)로 인한 조준점(XY) 요동 보정 */
  equilibrium: number;
  /** 조석 해석력 — 물때/조류 속도 대비 최적 수심대(Z축) 힌트 노출 */
  tideReading: number;
}

/** 신규 캐릭터 기본 스탯 */
export const DEFAULT_ANGLER_STATS: AnglerStats = {
  strength: 12,
  dexterity: 10,
  equilibrium: 8,
  tideReading: 6,
};

/** 스탯별 표시 라벨/물리 기여 설명 (Status 창 표시용) */
export const ANGLER_STAT_INFO: Record<keyof AnglerStats, { label: string; desc: string }> = {
  strength: {
    label: '근력 (Strength)',
    desc: '캐스팅 초기 힘 벡터를 키워 맞바람을 극복하고, 파이팅 시 최대 장력 허용치를 높입니다.',
  },
  dexterity: {
    label: '민첩 (Dexterity)',
    desc: '캐스팅 게이지의 최적 타점(Sweet Spot) 영역을 넓히고, 드랙 미세 조정 완충 시간을 늘립니다.',
  },
  equilibrium: {
    label: '평형감각 (Equilibrium)',
    desc: '파고로 발판이 흔들릴 때 캐스팅 조준점이 흐트러지는 요동을 보정합니다.',
  },
  tideReading: {
    label: '조석 해석력 (Tide Reading)',
    desc: '물때 사이클과 조류 속도를 해석해 최적 활성 수심대(상/중/하) 힌트를 제공합니다.',
  },
};

// ─────────────────────────────────────────────
// 탑다운 바다 구역(Zone) / 한계 수심(Z_max) 프로필
// ─────────────────────────────────────────────

/** 바다 구역 — 0: 땅, 1: 연안, 2: 중양(멀리), 3: 심해(더 멀리) */
export type SeaZone = 0 | 1 | 2 | 3;

/** 구역별 수심 프로필 (지역별로 교체 가능) */
export interface ZoneDepthProfile {
  zone: SeaZone;
  label: string;
  /** 구역 최소 수심 (m) */
  minDepthM: number;
  /** 구역 최대 수심 (m) — Z_max */
  maxDepthM: number;
  /** 대표 어종 (힌트 표시용) */
  typicalSpecies: string[];
}

/** 기본 구역 수심 프로필 — 지역 프로필 미지정 시 사용 */
export const DEFAULT_ZONE_DEPTH_PROFILES: ZoneDepthProfile[] = [
  { zone: 0, label: '땅/갯바위',   minDepthM: 0,  maxDepthM: 0,  typicalSpecies: [] },
  { zone: 1, label: '연안',        minDepthM: 2,  maxDepthM: 8,  typicalSpecies: ['감성돔', '노래미'] },
  { zone: 2, label: '중양(멀리)',  minDepthM: 8,  maxDepthM: 15, typicalSpecies: ['농어', '우럭'] },
  { zone: 3, label: '심해(더 멀리)', minDepthM: 15, maxDepthM: 30, typicalSpecies: ['참돔', '방어'] },
];

/**
 * Land-to-Sea 그라디언트: 육지에서 바다 방향으로의 정규화 거리(0~1)에 따른
 * 한계 수심 Z_max(m). 지역 프로필 도입 전 임시 선형 매핑 (2m ~ 30m).
 */
export function computeZoneMaxDepth(distanceRatio: number): number {
  const t = Math.max(0, Math.min(1, distanceRatio));
  return 2 + t * 28;
}
