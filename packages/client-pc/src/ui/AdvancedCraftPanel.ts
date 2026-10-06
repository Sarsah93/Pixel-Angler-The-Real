/**
 * @file AdvancedCraftPanel.ts
 * @description 작업대 팝업 (129차 P7 · 222차 개칭) — 설치한 작업대 근접 [F]로 열린다.
 *   작업대 도면 + 로드 빌딩 공구 세트가 있으면 고급 도면까지(`CraftingStore.blueprints('workbench')`).
 *
 * 내용물은 U 창 '제작' 탭과 **같은 `CraftBoard`**(station만 'workbench')다 —
 * 기본/고급의 차이는 "어디서 열리는가"와 도면 목록뿐이고, 조작·판정은 하나를 공유한다.
 */

import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { CraftBoard } from './CraftBoard.js';
import { enforceTextBounds } from './TextFit.js';

const PANEL_W = 900;
const PANEL_H = 560;

export interface AdvancedCraftCallbacks {
  onClose: () => void;
  onCrafted?: () => void;
}

export class AdvancedCraftPanel extends DraggablePanel {
  private board?: CraftBoard;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly cbs: AdvancedCraftCallbacks) {
    super(scene, {
      x, y, width: PANEL_W, height: PANEL_H, title: '작업대',
      depth: 900, dim: true, onClose: () => cbs.onClose(),
    });
    this.render();
  }

  private render(): void {
    const body = this.scene.add.container(0, 0);
    this.add(body);
    const top = this.contentTop + 8;
    this.board = new CraftBoard(this.scene, body, {
      station: 'workbench',
      x: 16, y: top, w: PANEL_W - 32, h: PANEL_H - top - 14,
      origin: () => ({ x: this.x, y: this.y }),
      alive: () => this.active,
      onCrafted: () => this.cbs.onCrafted?.(),
    });
    this.board.render();
    enforceTextBounds(body, PANEL_W - 16, 'AdvancedCraftPanel');
  }

  override destroy(fromScene?: boolean): void {
    this.board?.destroy();     // 씬 레벨 휠 핸들러 해제 (남기면 팬텀 스크롤)
    this.board = undefined;
    super.destroy(fromScene);
  }
}
