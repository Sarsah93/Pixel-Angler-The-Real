/**
 * @file TackleSetupPanel.ts
 * @description 낚시 도중 또는 필드 진입 전 간이 채비 현황 및 교체 팝업 패널
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';

export class TackleSetupPanel extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private infoText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createUI();
    this.updateUI();
  }

  private createUI(): void {
    // 반투명 창
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x0e1c2dd9, 0.95);
    this.bg.fillRoundedRect(-150, -60, 300, 120, 4);
    this.bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    this.bg.strokeRoundedRect(-150, -60, 300, 120, 4);
    this.add(this.bg);

    this.infoText = this.scene.add.text(0, -40, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#e8f4fd',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.infoText);

    const helpPrompt = this.scene.add.text(0, 40, '장비 변경은 메인메뉴의 장비실[TackleRoom]을 이용하세요.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#8faabf',
    }).setOrigin(0.5);
    this.add(helpPrompt);
  }

  updateUI(): void {
    const tackle = GameState.player.currentTackle;
    if (tackle) {
      this.infoText?.setText(
        `[ 현재 결합된 채비 ]\n\n` +
        `로드: ${tackle.rod.modelName}\n` +
        `릴: ${tackle.reel.modelName}\n` +
        `라인: ${tackle.mainLine.lineNo}호 | 미끼: ${tackle.bait.name}`
      );
    } else {
      this.infoText?.setText(
        `[ 장착된 채비 없음 ]\n\n` +
        `낚시를 하려면 장비실에서\n` +
        `채비를 장착해야 합니다.`
      );
    }
  }
}
