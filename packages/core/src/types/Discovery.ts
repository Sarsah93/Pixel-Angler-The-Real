/**
 * @file Discovery.ts
 * @description 발견(도감/위키) 기록 타입 — 어종·해양생물·아이템 공용
 *
 * "한 번이라도 조우한 것만 도감/위키에 공개"의 단일 기준.
 * 발견 = 최초 취득/포획/채집 순간 1회 기록 (이후 불변).
 * 저장은 client의 DiscoveryStore가 담당하고, 여기는 순수 타입/라벨만 둔다.
 */

/** 발견 대상 종류 */
export type DiscoveryKind =
  | 'fish'      // 어종 (FishDatabase speciesId)
  | 'creature'  // 해루질/통발 해양생물 (ShoreCreatureDatabase id)
  | 'item';     // 아이템 (InvItem/상점 카탈로그 id)

/** 발견 경로 — 도감/위키에 "어떻게 처음 만났나"로 표기 */
export type DiscoverySource =
  | 'catch'         // 낚시 어획
  | 'trap'          // 통발 포획
  | 'night_hunting' // 해루질 채집
  | 'inventory'     // 인벤토리 취득 (구매·지급·손질 산출 등)
  | 'legacy'        // 구세이브 어획 기록 백필
  | 'dev';          // dev 모드 해금

/** 발견 1건 (대상당 최초 1회만 기록) */
export interface DiscoveryEntry {
  kind: DiscoveryKind;
  /** 대상 id — kind별 표준 id (speciesId / creatureId / itemId) */
  id: string;
  /** 최초 발견 시각 (epoch ms) */
  firstAtMs: number;
  /** 최초 발견 경로 */
  source: DiscoverySource;
}

/** 발견 경로 한국어 라벨 */
export const DISCOVERY_SOURCE_LABEL: Record<DiscoverySource, string> = {
  catch: '낚시로 어획',
  trap: '통발로 포획',
  night_hunting: '해루질로 채집',
  inventory: '아이템 취득',
  legacy: '과거 조과 기록',
  dev: 'dev 해금',
};

/** 발견 키 (스토어 내부 맵 키 규약) */
export function discoveryKey(kind: DiscoveryKind, id: string): string {
  return `${kind}:${id}`;
}
