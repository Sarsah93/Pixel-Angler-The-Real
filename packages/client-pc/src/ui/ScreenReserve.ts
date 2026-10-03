/**
 * @file ScreenReserve.ts
 * @description 화면 고정 UI 자리 예약 (198차 — 사용자 지적 「미니맵 우측 아래 '가구 배치' 버튼이 왜 겹치는 위치에 있나」)
 *
 * 필드 HUD(상태·미니맵·「지금 할 일」·퀵슬롯·지역 채널·도움말 단추·지역 명패)가 **지금 차지한 화면 사각형**을
 * 한곳에서 돌려준다. HUD 창은 끌어 옮기고 크기를 바꿀 수 있으므로 상수 좌표(`GAME_WIDTH - 16 - w`)로는
 * 비어 있는 자리를 알 수 없다 — 집 안 [가구 배치] 단추가 그렇게 미니맵 아래쪽에 얹혔다.
 *
 * 규칙(AGENTS §4 「화면 고정 UI는 겹치지 않는다」):
 *  - HUD 위에 그려지는 **상시** 단추·트레이(팝업이 아닌 것)는 자기 콘텐츠(방·패널)에 앵커하고,
 *    놓은 뒤 `assertClear`로 예약 영역과 겹치지 않는지 확인한다(개발 빌드 콘솔 `[ScreenOverlap]`).
 *  - 자리가 모자라면 `columnGap`으로 빈 세로 구간을 찾아 **크기를 줄이고**(페이지 넘김) 겹치지 않는다.
 *  - 끌어 옮기는 팝업(DraggablePanel)은 대상이 아니다 — 잠깐 위에 뜨고 사용자가 옮길 수 있다.
 */

import Phaser from 'phaser';
import { GAME_HEIGHT } from '../PhaserConfig.js';

export interface ReservedRect {
  name: string;
  rect: Phaser.Geom.Rectangle;
}

/** 화면 예약 영역을 내놓는 씬(필드) */
interface ReserveProvider {
  screenReserved(): ReservedRect[];
}

function isProvider(s: unknown): s is ReserveProvider {
  return !!s && typeof (s as Partial<ReserveProvider>).screenReserved === 'function';
}

/**
 * 199차 — Graphics만으로 그린 판(배경판·범례판 등)은 Phaser가 경계를 모른다 → 겹침 감사(`tools/ui_overlap_audit.js`)가
 * 볼 수 있게 화면 사각형을 붙여 둔다. 판을 새로 만들면 그리는 자리에서 한 번 부른다(움직이면 다시 부른다).
 */
export function tagUiRect(obj: Phaser.GameObjects.GameObject, name: string, x: number, y: number, w: number, h: number): void {
  obj.setData(UI_RECT_KEY, { name, x, y, w, h });
}
export const UI_RECT_KEY = 'uiRect';

/** 지금 화면에 그려지는 필드 HUD의 예약 영역 — 필드가 없거나 숨겨져 있으면 빈 배열 */
export function fieldReserved(scene: Phaser.Scene): ReservedRect[] {
  const f = scene.scene.get('RegionFieldScene');
  if (!f || !f.sys.settings.visible || !(f.scene.isActive() || f.scene.isPaused())) return [];
  return isProvider(f) ? f.screenReserved() : [];
}

/** rect와 겹치는 예약 영역(pad만큼 여유를 두고 판정) */
export function overlapsReserved(rect: Phaser.Geom.Rectangle, reserved: ReservedRect[], pad = 4): ReservedRect[] {
  const r = new Phaser.Geom.Rectangle(rect.x - pad, rect.y - pad, rect.width + pad * 2, rect.height + pad * 2);
  return reserved.filter((v) => Phaser.Geom.Rectangle.Overlaps(r, v.rect));
}

/** 개발 빌드 — 겹치면 콘솔 경고(하네스가 `[ScreenOverlap]`을 수집한다) */
export function assertClear(label: string, rect: Phaser.Geom.Rectangle, reserved: ReservedRect[]): boolean {
  const hit = overlapsReserved(rect, reserved, 0);
  if (hit.length > 0 && import.meta.env.DEV) {
    console.warn(`[ScreenOverlap] ${label} (${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}) × ${hit.map((h) => h.name).join(', ')}`);
  }
  return hit.length === 0;
}

/**
 * 가로 구간 [x, x+w] 안에서 예약 영역을 피한 **가장 긴 세로 빈 구간**.
 * top·bottom은 화면 여백(기본 8px). 없으면 null.
 */
export function columnGap(
  x: number, w: number, reserved: ReservedRect[], top = 8, bottom = GAME_HEIGHT - 8, gap = 10,
): { y: number; h: number } | null {
  const blocks = reserved
    .map((v) => v.rect)
    .filter((r) => r.right > x && r.x < x + w)
    .map((r) => [r.y - gap, r.bottom + gap] as const)
    .sort((a, b) => a[0] - b[0]);
  let best: { y: number; h: number } | null = null;
  let cur = top;
  const take = (end: number): void => {
    const h = Math.min(end, bottom) - cur;
    if (h > 0 && (!best || h > best.h)) best = { y: cur, h };
  };
  for (const [a, b] of blocks) {
    if (a > cur) take(a);
    cur = Math.max(cur, b);
  }
  take(bottom);
  return best;
}
