/**
 * @file TideWidget.ts
 * @description 물때를 시각적으로 간략화하여 표현하는 도형 위젯
 */

import Phaser from 'phaser';
import { calculateTideInfo } from '@tra/core';

export class TideWidget extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private labelText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createUI();
    this.updateWidget();

    // 10초마다 갱신
    scene.time.addEvent({
      delay: 10000,
      callback: this.updateWidget,
      callbackScope: this,
      loop: true,
    });
  }

  private createUI(): void {
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x0e1c2d, 0.9);
    this.bg.fillRoundedRect(0, 0, 100, 45, 3);
    this.bg.lineStyle(1, 0x1f3d5a);
    this.bg.strokeRoundedRect(0, 0, 100, 45, 3);
    this.add(this.bg);

    this.labelText = this.scene.add.text(50, 22, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#4af2a1',
      align: 'center',
      // 100px 박스 안에서 줄바꿈 — 긴 물때 라벨이 박스 밖으로 삐지지 않게 (텍스트 전수조사)
      wordWrap: { width: 92 },
    }).setOrigin(0.5);
    this.add(this.labelText);
  }

  updateWidget(): void {
    const tide = calculateTideInfo();
    this.labelText?.setText(`[오늘의 물때]\n${tide.tidePhaseLabel}`);
  }
}
