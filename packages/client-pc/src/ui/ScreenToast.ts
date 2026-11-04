/**
 * @file ScreenToast.ts
 * @description 300 D — 필드가 아닌 씬(집 안 · 1인칭 낚시)의 화면 위 가운데 한 줄 알림(물때 감각 · 방앗간 「다 됐다」 · 축제 · 우편함).
 *
 *  - 같은 씬에 아직 떠 있는 줄이 있으면 **그 아래로** 내려 쌓는다 — 두 알림이 같은 순간에 오면 같은 y에 겹쳐 찍혔다.
 *  - **똑같은 글이 떠 있으면 다시 띄우지 않는다** — 같은 자리에 포개져 글자가 진해지던 것(사용자 리포트 「중복되며 같은 위치에 텍스트가 쌓임」).
 *  - 바탕 상자 없이 흰 테 글자(R14).
 */

import Phaser from 'phaser';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { worldLabelStyle } from './WorldLabel.js';

const live = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text[]>();

/** 화면 위 가운데에 한 줄 — 이미 같은 글이 떠 있으면 null */
export function screenToast(scene: Phaser.Scene, line: string, y: number, holdMs = 4200): Phaser.GameObjects.Text | null {
  const list = (live.get(scene) ?? []).filter((t) => t.active);
  live.set(scene, list);
  // 원문은 i18n 훅이 바꾸므로 글이 아니라 data로 견준다
  if (list.some((t) => t.getData('src') === line)) return null;
  const top = list.reduce((m, t) => Math.max(m, t.y + t.height + 4), y);
  const t = scene.add.text(GAME_WIDTH / 2, top, line, worldLabelStyle(13, { align: 'center', wrap: Math.min(640, GAME_WIDTH - 80) }))
    .setOrigin(0.5, 0).setDepth(1170).setScrollFactor(0).setAlpha(0).setData('src', line);
  list.push(t);
  scene.tweens.add({ targets: t, alpha: 1, duration: 220 });
  scene.tweens.add({ targets: t, alpha: 0, delay: holdMs, duration: 400, onComplete: () => t.destroy() });
  return t;
}
