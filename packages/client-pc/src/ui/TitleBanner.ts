/**
 * @file TitleBanner.ts
 * @description 숨은 업적(타이틀) 달성 배너 (203차).
 *
 * - `TitleStore`의 알림 대기열을 **지금 돌아가는 씬**(필드 · 1인칭 · 집)이 update에서 `pumpTitleBanners(this)`로 꺼낸다.
 *   일시정지된 씬은 그리지 못하므로 대기열이 씬 사이를 건너간다.
 * - 한 번에 한 장 — 여러 개를 한꺼번에 얻으면 차례로 띄운다.
 * - 화면 위쪽 가운데, 필드 HUD 예약 영역(`fieldReserved`)을 피한 빈 세로 구간에 둔다. 누르면 바로 닫힌다.
 * - 금빛 테두리 + 절차 메달(레어도 색 리본) + 징글 + 사연 한 줄 + 효과 한 줄. 지역 채널에도 한 줄 남긴다.
 */

import Phaser from 'phaser';
import { TITLE_RARITY_LABEL_KO, titleEffectLabelKo, type TitleDef, type TitleRarity } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { TitleStore } from '../store/TitleStore.js';
import { paintHudPanel } from './HudPanelStyle.js';
import { clampTextWidth } from './TextFit.js';
import { columnGap, fieldReserved, tagUiRect } from './ScreenReserve.js';
import { playTitleJingle } from '../audio/Sfx.js';

/** 레어도 글자색 — 이름표 · S창 · 배너 공용 (흔함 흰색 · 드묾 하늘색 · 전설 금색) */
export const TITLE_RARITY_COLOR: Record<TitleRarity, string> = { common: '#e8f4fd', rare: '#7fe0ff', legend: '#ffd257' };
export const TITLE_RARITY_HEX: Record<TitleRarity, number> = { common: 0xe8f4fd, rare: 0x7fe0ff, legend: 0xffd257 };

/** 203차 — 머리 위 타이틀 글씨(작게 · 테두리로 바탕 없이 읽히게). 색은 레어도로 따로 입힌다 — 필드 · 집 공용 */
export function titleTagStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#e8f4fd', fontStyle: 'bold',
    stroke: '#0a1628', strokeThickness: 3,
  };
}

const W = 440;
const HOLD_MS = 6500;
const FONT = '"Noto Sans KR", sans-serif';

/** 지금 떠 있는 배너(씬과 함께 파괴되면 다음 펌프가 새로 띄운다) */
let active: Phaser.GameObjects.Container | null = null;

/** 대기 중인 달성 알림이 있으면 한 장 띄운다 — 씬 update에서 매 프레임 불러도 된다 */
export function pumpTitleBanners(scene: Phaser.Scene): void {
  if (active && active.active) {
    // ⚠ 다른 씬이 띄운 배너가 그 씬과 함께 일시정지됐다(필드 → 1인칭 낚시) — 트윈이 멈춰 영영 안 닫히므로
    //   걷어 내고 지금 도는 씬이 다음 알림을 이어 받는다(그 배너는 이미 한 번 보였다)
    const owner = active.scene;
    if (owner === scene || (owner?.sys.isActive() && !owner.sys.isPaused())) return;
    active.destroy();
  }
  active = null;
  const d = TitleStore.takePending();
  if (!d) return;
  showTitleBanner(scene, d);
}

/** 절차 메달 — 원판(금) + 테두리 + 별 + 아래로 늘어진 리본(레어도 색) */
function drawMedal(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rarity: TitleRarity): void {
  const ribbon = TITLE_RARITY_HEX[rarity];
  g.fillStyle(0x10202e, 1);
  g.fillTriangle(cx - 10, cy + 4, cx - 2, cy + 4, cx - 9, cy + 24);
  g.fillTriangle(cx + 10, cy + 4, cx + 2, cy + 4, cx + 9, cy + 24);
  g.fillStyle(ribbon, 1);
  g.fillTriangle(cx - 9, cy + 4, cx - 3, cy + 4, cx - 8, cy + 22);
  g.fillTriangle(cx + 9, cy + 4, cx + 3, cy + 4, cx + 8, cy + 22);
  g.fillStyle(0x6b4d1c, 1); g.fillCircle(cx, cy, 14);
  g.fillStyle(0xd8a536, 1); g.fillCircle(cx, cy, 12);
  g.fillStyle(0xffd257, 1); g.fillCircle(cx, cy, 10);
  // 별 — 5꼭짓점
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 7 : 3;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillStyle(0xfff4c2, 1); g.fillPoints(pts, true);
  g.fillStyle(0xffffff, 0.9); g.fillRect(cx - 7, cy - 8, 2, 2);
}

/** 배너를 띄운다(하네스·재현용으로도 직접 부를 수 있다) */
export function showTitleBanner(scene: Phaser.Scene, d: TitleDef): Phaser.GameObjects.Container {
  const padL = 64, padR = 18;
  const head = scene.add.text(padL, 12, `숨은 업적 달성 · ${TITLE_RARITY_LABEL_KO[d.rarity]}`, {
    fontFamily: FONT, fontSize: '11px', color: '#ffd257', fontStyle: 'bold',
  });
  const name = scene.add.text(padL, head.y + head.height + 2, `「${d.nameKo}」`, {
    fontFamily: FONT, fontSize: '20px', color: TITLE_RARITY_COLOR[d.rarity], fontStyle: 'bold',
  });
  clampTextWidth(name, W - padL - padR);
  const story = scene.add.text(padL, name.y + name.height + 4, d.storyKo, {
    fontFamily: FONT, fontSize: '12px', color: '#d0e2ee', lineSpacing: 3, wordWrap: { width: W - padL - padR },
  });
  const effect = scene.add.text(padL, story.y + story.height + 5, titleEffectLabelKo(d), {
    fontFamily: FONT, fontSize: '11px', color: '#9fd8a8',
  });
  clampTextWidth(effect, W - padL - padR);
  const H = Math.max(76, Math.ceil(effect.y + effect.height + 12));

  // 위치 — 화면 가운데 열에서 HUD를 피한 빈 구간의 맨 위(없으면 위쪽 72px)
  const x = Math.round((GAME_WIDTH - W) / 2);
  const gap = columnGap(x, W, fieldReserved(scene), 8, GAME_HEIGHT * 0.6);
  const y = gap && gap.h >= H ? Math.round(gap.y) : 72;

  const c = scene.add.container(x, y - 10).setDepth(1180).setScrollFactor(0);
  const bg = scene.add.graphics();
  paintHudPanel(bg, 0, 0, W, H, { alpha: 0.96 });
  bg.lineStyle(2, 0xffd257, 0.95); bg.strokeRect(1, 1, W - 2, H - 2);
  bg.lineStyle(1, 0x8a6d33, 1); bg.strokeRect(4, 4, W - 8, H - 8);
  drawMedal(bg, 34, Math.round(H / 2) - 6, d.rarity);
  tagUiRect(bg, 'title-banner', x, y, W, H);
  const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([bg, head, name, story, effect, hit]);
  for (const o of c.list) (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor?.(0);
  c.setAlpha(0);
  active = c;

  let closing = false;
  const close = (): void => {
    if (closing || !c.active) return;
    closing = true;
    scene.tweens.add({ targets: c, alpha: 0, y: y - 10, duration: 260, ease: 'Sine.easeIn', onComplete: () => c.destroy() });
  };
  hit.on('pointerdown', close);
  scene.tweens.add({ targets: c, alpha: 1, y, duration: 260, ease: 'Back.easeOut' });
  // 머무는 시간은 트윈으로 잰다(씬 타이머와 같은 시계 — 일시정지되면 함께 멈춘다)
  scene.tweens.add({ targets: c, scale: 1, duration: HOLD_MS, onComplete: close });
  playTitleJingle(d.rarity === 'legend' ? 5 : d.rarity === 'rare' ? 4 : 3);

  // 지역 채널에 한 줄
  const field = scene.scene.get('RegionFieldScene') as unknown as { hud?: { pushLog(m: string): void } } | null;
  try { field?.hud?.pushLog(`[업적] 숨은 업적 달성 — 「${d.nameKo}」`); } catch { /* 필드 HUD 없음 */ }
  return c;
}
