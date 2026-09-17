/**
 * @file ContextMenu.ts
 * @description 화면 고정 우클릭 메뉴 (146차 — 피어 캐릭터용).
 *
 * `InventoryPanel`의 컨텍스트 메뉴 문법(짙은 판 + 금테 + 행 호버)을 **패널 밖에서도** 쓰기 위해 뽑았다.
 * 바깥을 누르면 닫히고, 항목을 누르면 닫힌 뒤 실행된다. 스크롤 카메라 씬에서도 화면에 붙어 있다.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export interface ContextAction {
  label: string;
  run: () => void;
  color?: string;
  hoverColor?: string;
  /** 회색 비활성 — 눌러도 아무 일 없음 */
  disabled?: boolean;
}

export function openContextMenu(
  scene: Phaser.Scene, screenX: number, screenY: number, actions: ContextAction[], depth = 895,
): Phaser.GameObjects.Container {
  const menuW = 150, rowH = 27;
  const menuH = actions.length * rowH + 10;
  let mx = screenX + 6, my = screenY + 6;
  if (mx + menuW > GAME_WIDTH - 10) mx -= menuW + 12;
  if (my + menuH > GAME_HEIGHT - 8) my = GAME_HEIGHT - 8 - menuH;

  const menu = scene.add.container(0, 0).setDepth(depth).setScrollFactor(0);
  const close = (): void => { menu.destroy(); };

  const catcher = scene.add.rectangle(-GAME_WIDTH, -GAME_HEIGHT, GAME_WIDTH * 3, GAME_HEIGHT * 3, 0x000000, 0.001)
    .setOrigin(0, 0).setInteractive().setScrollFactor(0);
  catcher.on('pointerdown', close);
  menu.add(catcher);

  const bg = scene.add.graphics().setScrollFactor(0);
  bg.fillStyle(0x081422, 0.98); bg.fillRoundedRect(mx, my, menuW, menuH, 5);
  bg.lineStyle(1.5, 0xc8a060, 0.95); bg.strokeRoundedRect(mx, my, menuW, menuH, 5);
  menu.add(bg);

  actions.forEach((a, i) => {
    const ry = my + 5 + i * rowH;
    const base = a.disabled ? '#5a6b78' : (a.color ?? '#d0e8f5');
    const hover = a.disabled ? base : (a.hoverColor ?? '#ffe28a');
    const rowBg = scene.add.graphics().setScrollFactor(0);
    const label = scene.add.text(mx + menuW / 2, ry + rowH / 2, a.label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: base,
      fontStyle: a.color ? 'bold' : 'normal',
    }).setOrigin(0.5).setScrollFactor(0);
    const hit = scene.add.rectangle(mx + menuW / 2, ry + rowH / 2, menuW - 10, rowH - 2, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: !a.disabled }).setScrollFactor(0);
    hit.on('pointerover', () => {
      if (a.disabled) return;
      rowBg.clear(); rowBg.fillStyle(0xc8a060, 0.25); rowBg.fillRoundedRect(mx + 5, ry, menuW - 10, rowH - 2, 3);
      label.setColor(hover);
    });
    hit.on('pointerout', () => { rowBg.clear(); label.setColor(base); });
    hit.on('pointerdown', () => { if (a.disabled) return; close(); a.run(); });
    menu.add([rowBg, label, hit]);
  });
  return menu;
}
