/**
 * @file DevMode.ts
 * @description dev 전용 치트 상태 (마인크래프트 크리에이티브 모드 컨셉)
 *
 * localhost dev 서버에서만 의미를 가진다 — isGod()은 프로덕션 빌드에서
 * `import.meta.env.DEV`가 false 상수로 치환되어 항상 false(데드코드 제거)다.
 * 토글 UI는 DevConsolePanel(F10).
 *
 * god(무적) 적용 범위:
 *  - 신선도 동결 (InventoryStore.refreshCondition)
 *  - 채비/루어 손실 없음 (loseRigParts / loseLureRig)
 *  - 미끼 무한 (consumeRigItem)
 *  - 줄터짐 없음 (FirstPersonFishingScene.forceLineBreak)
 *
 * 276차 — 모든 지역 열기(allRegions): 세계 지도의 장 순서 잠금(263 `isRegionOpenAtChapter`)을 건너뛴다.
 *  - 지도(구역 노드)가 없는 지역은 그대로 잠긴다(`isRegionUnlocked`).
 *  - 이야기 진행 · 세이브에는 손대지 않는다 — 브라우저 저장소(`tra_dev_all_regions`)에만 남겨 새로 고쳐도 유지한다.
 */

import type { ForageTool } from '@tra/core';

/** 276차 — dev 「모든 지역 열기」를 기억하는 브라우저 저장소 키(세이브 데이터가 아니다) */
const ALL_REGIONS_KEY = 'tra_dev_all_regions';

function readAllRegions(): boolean {
  if (!import.meta.env.DEV) return false;
  try { return localStorage.getItem(ALL_REGIONS_KEY) === '1'; } catch { return false; }
}

export const DevMode = {
  /** 무적(갓모드) 토글 — DevConsolePanel에서 변경 */
  god: false,
  /** 276차 — 모든 지역 열기(장 순서 잠금 건너뛰기) — DevConsolePanel에서 변경 */
  allRegions: readAllRegions(),
};

/** 무적 여부 — 프로덕션에서는 항상 false (vite 데드코드 제거) */
export function isGod(): boolean {
  return import.meta.env.DEV && DevMode.god;
}

/** 276차 — 장 순서 잠금을 건너뛰는가 — 프로덕션에서는 항상 false (vite 데드코드 제거) */
export function isAllRegionsOpen(): boolean {
  return import.meta.env.DEV && DevMode.allRegions;
}

/** 276차 — 모든 지역 열기 켜고 끄기(브라우저 저장소에 기억) */
export function setAllRegionsOpen(on: boolean): void {
  if (!import.meta.env.DEV) return;
  DevMode.allRegions = on;
  try {
    if (on) localStorage.setItem(ALL_REGIONS_KEY, '1');
    else localStorage.removeItem(ALL_REGIONS_KEY);
  } catch { /* 저장소가 막혀 있으면 이번 세션만 */ }
}

/**
 * 288차 — dev 콘솔(F10)이 지금 서 있는 필드 씬에 맡기는 일. 필드 씬이 create에서 걸고 shutdown에서 푼다(필드가 없으면 비어 있다).
 * 사용자 「해루질 미니게임 버그/에러 없는 지, 실검증을 dev 모드에서 곧바로 해볼 수 있도록 … 갯강구 미니게임 시작하기, 거북손 시작하기 등」.
 */
export const DevHooks: {
  /** 해루질 손놀림 놀이를 곧바로 연다(스팟 · 물때 · 도구 보유 조건 없이). 못 열면 까닭 글을 돌려준다 */
  playForageGame?: (creatureId: string, tool: ForageTool | undefined, underwater: boolean, keepCatch: boolean) => string | null;
} = {};
