/**
 * @file UiClickHook.ts
 * @description 252차 — 「누를 수 있는 곳」을 누르면 딸깍. 단추마다 소리를 다는 대신 한 곳에서 건다.
 *
 * - 판정은 **누르는 순간의 커서**다 — Phaser `useHandCursor`가 켠 손 커서(`ui/GameCursor`의 `isHandCursorOn`)가
 *   떠 있을 때 캔버스를 누르면 `playUiClick()`. 누르자마자 자기 자신을 다시 그리는 단추(창 재구성)도 놓치지 않는다
 *   — Phaser의 `gameobjectdown`은 단추가 처리 중에 파괴되면 오지 않는다.
 * - 창 안 행동 소리(심기 · 칼질 · 장착 …)는 각자 `playSfx`로 따로 낸다 — 딸깍은 그 위에 아주 짧게 얹힌다.
 * - 단추가 이미 `playUiClick()`을 부르면 `Sfx.ts`가 60ms 안의 두 번째를 거른다.
 * - 창 밖(브라우저 화면)을 누른 것 · 가운데 단추는 무시한다. 손 커서가 아닌 곳(빈 땅 · 물)은 소리가 없다.
 */

import type Phaser from 'phaser';
import { playUiClick } from './Sfx.js';
import { isHandCursorOn } from '../ui/GameCursor.js';

const HOOK_KEY = '__traUiClickHook';

/** 게임마다 한 번 — HMR로 다시 불려도 앞의 것을 떼고 하나만 건다 */
export function installUiClickSound(game: Phaser.Game): void {
  const holder = globalThis as unknown as Record<string, ((e: PointerEvent) => void) | undefined>;
  const prev = holder[HOOK_KEY];
  if (prev) window.removeEventListener('pointerdown', prev, true);
  const onDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.button !== 2) return;
    if (!game.canvas || e.target !== game.canvas) return;
    if (isHandCursorOn()) playUiClick();
  };
  holder[HOOK_KEY] = onDown;
  window.addEventListener('pointerdown', onDown, { capture: true, passive: true });
}
