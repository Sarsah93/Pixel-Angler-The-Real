/**
 * @file MarketTrendIcon.ts
 * @description 시세·수요 화살표 아이콘 (196차 — 사용자 지정 5단계)
 *
 *   +2 위 화살표(파랑)          — 수요도 높고 시세도 높다
 *   +1 오른쪽 위 대각(초록)      — 둘 중 하나만 높고 하나는 평범
 *    0 가로줄(노랑)             — 둘 다 평범(또는 높음·낮음이 상쇄)
 *   −1 오른쪽 아래 대각(주황)    — 둘 중 하나만 낮고 하나는 평범
 *   −2 아래 화살표(빨강)         — 수요도 낮고 시세도 낮다
 *
 * 글자(↗ 등 특수문자)가 아니라 **절차 픽셀 그래픽**이다(§4 — 이모지·장식 특수문자 금지).
 * 7x7 도트를 2배로 키우고 1px 검은 외곽을 두른다 → 18x18.
 */

import Phaser from 'phaser';
import type { MarketTrend } from '@tra/core';

const UP = [
  '...#...',
  '..###..',
  '.#####.',
  '...#...',
  '...#...',
  '...#...',
  '...#...',
];
const UP_RIGHT = [
  '...####',
  '.....##',
  '....#.#',
  '...#..#',
  '..#....',
  '.#.....',
  '#......',
];
const FLAT = [
  '.......',
  '.......',
  '#######',
  '#######',
  '.......',
  '.......',
  '.......',
];

function flipV(rows: string[]): string[] { return [...rows].reverse(); }

const ART: Record<MarketTrend, string[]> = {
  2: UP, 1: UP_RIGHT, 0: FLAT, [-1]: flipV(UP_RIGHT), [-2]: flipV(UP),
} as Record<MarketTrend, string[]>;

export const TREND_COLOR: Record<MarketTrend, number> = {
  2: 0x4aa0ff, 1: 0x4ae27a, 0: 0xffd84a, [-1]: 0xff9a3a, [-2]: 0xff4a4a,
} as Record<MarketTrend, number>;

/** 화살표 크기(px) */
export const TREND_ICON_PX = 18;

/** (x, y) = 왼쪽 위 */
export function drawTrendIcon(scene: Phaser.Scene, x: number, y: number, trend: MarketTrend): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const rows = ART[trend];
  const S = 2;
  const on = (c: number, r: number): boolean => r >= 0 && r < 7 && c >= 0 && c < 7 && rows[r][c] === '#';
  // 외곽 — 칸 바탕(남색)·물고기 그림 위에서도 읽히게
  g.fillStyle(0x0a0e16, 0.95);
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      if (on(c, r)) continue;
      if (on(c + 1, r) || on(c - 1, r) || on(c, r + 1) || on(c, r - 1)
        || on(c + 1, r + 1) || on(c - 1, r - 1) || on(c + 1, r - 1) || on(c - 1, r + 1)) {
        g.fillRect(x + (c + 1) * S, y + (r + 1) * S, S, S);
      }
    }
  }
  g.fillStyle(TREND_COLOR[trend], 1);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (on(c, r)) g.fillRect(x + (c + 1) * S, y + (r + 1) * S, S, S);
  return g;
}
