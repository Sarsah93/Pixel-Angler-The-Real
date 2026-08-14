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
 */

export const DevMode = {
  /** 무적(갓모드) 토글 — DevConsolePanel에서 변경 */
  god: false,
};

/** 무적 여부 — 프로덕션에서는 항상 false (vite 데드코드 제거) */
export function isGod(): boolean {
  return import.meta.env.DEV && DevMode.god;
}
