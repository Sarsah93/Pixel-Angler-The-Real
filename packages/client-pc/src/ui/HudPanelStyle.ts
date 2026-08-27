/**
 * @file HudPanelStyle.ts
 * @description HUD 공용 픽셀 패널 페인터 (101차 — "남색 단색 사각형" 대체)
 *
 * 모든 HUD 창(상태/로그/퀵슬롯/미니맵/타이틀 플레이트)이 같은 문법을 쓴다:
 *  그림자 → 근흑 외곽 1px → 강청 프레임 2px(상단 밝음/하단 어두움 베벨) →
 *  2톤 세로 그라데이션 필 → 프레임 안 1px 하이라이트 → 모서리 브론즈 스터드.
 * Graphics 하나에 그리므로 기존 코드의 `add.graphics()` 자리에 그대로 끼운다.
 */

import Phaser from 'phaser';

export interface HudPanelOpts {
  /** 배경 알파 (기본 0.88) */
  alpha?: number;
  /** 모서리 스터드 표시 (기본 true) */
  studs?: boolean;
  /** 그림자 표시 (기본 true) */
  shadow?: boolean;
  /** 헤더 스트립 높이 (지정 시 상단에 어두운 제목 밴드) */
  headerH?: number;
}

const C = {
  shadow: 0x000000,
  outline: 0x06090f,
  frame: 0x33607f,
  frameLight: 0x639bbd,
  frameDark: 0x1b3a52,
  fillTop: 0x122636,
  fillBottom: 0x0a1826,
  innerLine: 0x2c5878,
  header: 0x0b1c2b,
  stud: 0xd8b25f,
  studDark: 0x8a6d33,
};

/** HUD 패널 1장 — (x,y,w,h)는 프레임 외곽 기준 */
export function paintHudPanel(
  g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number,
  opts: HudPanelOpts = {},
): void {
  const alpha = opts.alpha ?? 0.88;

  if (opts.shadow !== false) {
    g.fillStyle(C.shadow, 0.35);
    g.fillRect(x + 3, y + 4, w, h);
  }
  // 근흑 외곽
  g.fillStyle(C.outline, Math.min(1, alpha + 0.1));
  g.fillRect(x, y, w, h);
  // 프레임 (2px)
  g.fillStyle(C.frame, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  // 프레임 베벨 — 상·좌 밝게 / 하·우 어둡게
  g.fillStyle(C.frameLight, 1);
  g.fillRect(x + 1, y + 1, w - 2, 1);
  g.fillRect(x + 1, y + 1, 1, h - 2);
  g.fillStyle(C.frameDark, 1);
  g.fillRect(x + 1, y + h - 2, w - 2, 1);
  g.fillRect(x + w - 2, y + 1, 1, h - 2);
  // 필 — 2톤 세로 그라데이션 근사
  const ix = x + 3, iy = y + 3, iw = w - 6, ih = h - 6;
  g.fillStyle(C.fillTop, alpha);
  g.fillRect(ix, iy, iw, Math.floor(ih * 0.45));
  g.fillStyle(C.fillBottom, alpha);
  g.fillRect(ix, iy + Math.floor(ih * 0.45), iw, ih - Math.floor(ih * 0.45));
  // 필 상단 하이라이트 1px
  g.fillStyle(C.innerLine, 0.9);
  g.fillRect(ix, iy, iw, 1);

  if (opts.headerH && opts.headerH > 0) {
    g.fillStyle(C.header, 0.92);
    g.fillRect(ix, iy + 1, iw, opts.headerH - 1);
    g.fillStyle(C.innerLine, 0.8);
    g.fillRect(ix, iy + opts.headerH, iw, 1);
  }

  if (opts.studs !== false) {
    for (const [sx, sy] of [
      [x + 2, y + 2], [x + w - 6, y + 2], [x + 2, y + h - 6], [x + w - 6, y + h - 6],
    ] as const) {
      g.fillStyle(C.studDark, 1);
      g.fillRect(sx, sy, 4, 4);
      g.fillStyle(C.stud, 1);
      g.fillRect(sx, sy, 3, 3);
    }
  }
}

/** 퀵슬롯/그리드 셀 1칸 — 중심 기준 (cx, cy) */
export function paintHudSlot(
  g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number, active: boolean,
): void {
  const x = cx - w / 2, y = cy - h / 2;
  g.fillStyle(C.outline, 0.95);
  g.fillRect(x, y, w, h);
  if (active) {
    // 활성 — 청록 발광 프레임 + 금테 포인트
    g.fillStyle(0x1c6f66, 0.5);
    g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle(0x0e2e33, 0.85);
    g.fillRect(x + 3, y + 3, w - 6, h - 6);
    g.lineStyle(2, 0x4af2a1, 1);
    g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    g.fillStyle(0xbdf5d8, 1);
    g.fillRect(x + 2, y + 2, 3, 1);
    g.fillRect(x + 2, y + 2, 1, 3);
  } else {
    g.fillStyle(C.frame, 0.9);
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle(C.frameLight, 0.7);
    g.fillRect(x + 1, y + 1, w - 2, 1);
    g.fillStyle(C.frameDark, 0.9);
    g.fillRect(x + 1, y + h - 2, w - 2, 1);
    g.fillStyle(C.fillBottom, 0.82);
    g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle(C.fillTop, 0.82);
    g.fillRect(x + 2, y + 2, w - 4, Math.floor((h - 4) * 0.4));
  }
}

/** 짧은 라벨용 플레이트 (씬 타이틀 '속초' 등) — 중앙 x 기준 폭 자동은 호출측에서 */
export function paintTitlePlate(
  g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number,
): void {
  paintHudPanel(g, x, y, w, h, { alpha: 0.92, studs: false, shadow: true });
  // 좌우 금장 포인트 (명패 느낌)
  g.fillStyle(C.studDark, 1);
  g.fillRect(x + 4, y + h / 2 - 3, 3, 6);
  g.fillRect(x + w - 7, y + h / 2 - 3, 3, 6);
  g.fillStyle(C.stud, 1);
  g.fillRect(x + 4, y + h / 2 - 3, 2, 4);
  g.fillRect(x + w - 7, y + h / 2 - 3, 2, 4);
}
