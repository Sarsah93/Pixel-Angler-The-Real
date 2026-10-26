/**
 * @file PauseMenu.ts
 * @description ESC 일시정지 메뉴 — 필드 · 가게 안 · 집 안이 같은 그림 · 같은 조작으로 쓴다.
 *
 * 277차 — 사용자 지시 「편의점이나 마트에서 esc 버튼 누르면 나가지도록 되어있는데, 그러면 안됨 …
 * 다른 가게나 직판장, 마트 등에서도 esc는 밖으로 나가질 게 아니라, 환경설정, 집으로가기 등 pause menu가 나오도록」.
 * 필드(`RegionFieldScene`)에만 있던 메뉴 그림을 이 파일로 옮겨 집 안(`HomeInteriorScene`)도 같은 메뉴를 띄운다.
 *
 * 목재 · 양피지 톤 도트 메뉴(Traveler's Rest 풍). 화면 가운데 · depth 1000 · 뒤 클릭은 딤이 막는다.
 * 키(↑↓ · Enter)는 부르는 씬이 `move` · `activate`로 넘긴다 — 씬마다 키 처리 순서가 달라서다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';

/** 메뉴 한 줄 */
export interface PauseMenuItem {
  label: string;
  action: () => void;
}

const PANEL_W = 300;
const ROW_H = 52;
const ROW_GAP = 10;
const HEAD_H = 58;
const FONT = '"Noto Sans KR", sans-serif';

export class PauseMenu {
  private readonly root: Phaser.GameObjects.Container;
  private readonly rowBgs: Phaser.GameObjects.Graphics[] = [];
  private sel = 0;
  private closed = false;
  private readonly px: number;
  private readonly py: number;

  constructor(private readonly scene: Phaser.Scene, private readonly items: PauseMenuItem[]) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelH = HEAD_H + items.length * (ROW_H + ROW_GAP) + 22;
    this.px = cx - PANEL_W / 2;
    this.py = cy - panelH / 2;
    const { px, py } = this;

    const menu = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    // 반투명 딤 — 뒤 클릭 차단
    menu.add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setInteractive());

    // 도트 이중 테두리 패널
    const panel = scene.add.graphics();
    panel.fillStyle(0x2a1c12, 1);
    panel.fillRoundedRect(px - 6, py - 6, PANEL_W + 12, panelH + 12, 10);
    panel.fillStyle(0x6b4a2e, 1);
    panel.fillRoundedRect(px, py, PANEL_W, panelH, 8);
    panel.fillStyle(0x8a6a44, 1);
    panel.fillRoundedRect(px + 6, py + 6, PANEL_W - 12, panelH - 12, 6);
    panel.lineStyle(2, 0x3d2817, 1);
    panel.strokeRoundedRect(px + 6, py + 6, PANEL_W - 12, panelH - 12, 6);
    menu.add(panel);

    menu.add(scene.add.text(cx, py + 26, '일시정지', {
      fontFamily: FONT, fontSize: '18px', color: '#3d2817', fontStyle: 'bold',
    }).setOrigin(0.5));

    items.forEach((item, i) => {
      const ry = py + HEAD_H + i * (ROW_H + ROW_GAP);
      const rowBg = scene.add.graphics();
      this.rowBgs.push(rowBg);
      const label = scene.add.text(cx, ry + ROW_H / 2, item.label, {
        fontFamily: FONT, fontSize: '16px', color: '#33220f', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = scene.add.rectangle(cx, ry + ROW_H / 2, PANEL_W - 44, ROW_H, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { this.sel = i; this.paintRows(); });
      hit.on('pointerdown', () => { this.sel = i; item.action(); });
      menu.add([rowBg, label, hit]);
    });
    this.paintRows();

    menu.add(scene.add.text(cx, py + panelH - 4, '↑↓ 이동 · Enter 선택 · ESC 닫기', {
      fontFamily: FONT, fontSize: '10px', color: '#4a3322',
    }).setOrigin(0.5, 1));

    applyScreenFixed(menu);   // 카메라가 스크롤해도 히트 판정이 어긋나지 않게
    menu.setScale(0.92);
    scene.tweens.add({ targets: menu, scale: 1, duration: 150, ease: 'Back.easeOut' });
    this.root = menu;
  }

  /** 선택 줄을 위(-1) · 아래(+1)로 */
  move(dir: number): void {
    const n = this.items.length;
    if (!n || this.closed) return;
    this.sel = (this.sel + dir + n) % n;
    this.paintRows();
  }

  /** 고른 줄 실행 */
  activate(): void {
    if (this.closed) return;
    this.items[this.sel]?.action();
  }

  /** 닫기(줄어들며 사라짐). 두 번 불러도 한 번만 */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    const menu = this.root;
    this.scene.tweens.add({
      targets: menu, scale: 0.92, alpha: 0, duration: 120,
      onComplete: () => menu.destroy(),
    });
  }

  /** 씬이 끝날 때 — 트윈 없이 바로 */
  destroy(): void {
    this.closed = true;
    if (this.root.active) this.root.destroy();
  }

  private paintRows(): void {
    this.rowBgs.forEach((g, i) => {
      const x = this.px + 22;
      const y = this.py + HEAD_H + i * (ROW_H + ROW_GAP);
      const w = PANEL_W - 44;
      g.clear();
      if (i === this.sel) {
        g.fillStyle(0xd9b779, 1);
        g.fillRoundedRect(x, y, w, ROW_H, 5);
        g.lineStyle(2, 0xffe9b0, 1);
      } else {
        g.fillStyle(0xb8945f, 1);
        g.fillRoundedRect(x, y, w, ROW_H, 5);
        g.lineStyle(2, 0x6b4a2e, 1);
      }
      g.strokeRoundedRect(x, y, w, ROW_H, 5);
    });
  }
}
