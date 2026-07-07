/**
 * @file HUD.ts
 * @description 게임 화면의 상단(환경 정보) 및 하단(현재 상태) HUD 정보 창
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { calculateTideInfo } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export class HUD extends Phaser.GameObjects.Container {
  private topBarBg?: Phaser.GameObjects.Graphics;
  private bottomBarBg?: Phaser.GameObjects.Graphics;
  private tideText?: Phaser.GameObjects.Text;
  private tackleText?: Phaser.GameObjects.Text;
  private coinsText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.createUI();
    this.updateHUD();

    // 1초마다 HUD 정보 업데이트
    scene.time.addEvent({
      delay: 1000,
      callback: this.updateHUD,
      callbackScope: this,
      loop: true,
    });
  }

  private createUI(): void {
    const topBarY = 0;
    const bottomBarY = GAME_HEIGHT - 32;

    // 상단 바 배경
    this.topBarBg = this.scene.add.graphics();
    this.topBarBg.fillStyle(0x060d1acc, 0.95);
    this.topBarBg.fillRect(0, topBarY, GAME_WIDTH, 40);
    this.topBarBg.lineStyle(1.5, 0x1f3d5a, 0.8);
    this.topBarBg.lineBetween(0, topBarY + 40, GAME_WIDTH, topBarY + 40);
    this.add(this.topBarBg);

    // 하단 바 배경
    this.bottomBarBg = this.scene.add.graphics();
    this.bottomBarBg.fillStyle(0x060d1acc, 0.95);
    this.bottomBarBg.fillRect(0, bottomBarY, GAME_WIDTH, 32);
    this.bottomBarBg.lineStyle(1.5, 0x1f3d5a, 0.8);
    this.bottomBarBg.lineBetween(0, bottomBarY, GAME_WIDTH, bottomBarY);
    this.add(this.bottomBarBg);

    // 텍스트 위젯들
    this.tideText = this.scene.add.text(16, topBarY + 12, '바다 상황: 로드 중...', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#4af2a1',
    });
    this.add(this.tideText);

    this.tackleText = this.scene.add.text(16, bottomBarY + 8, '장착 채비: 정보 없음', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#e8f4fd',
    });
    this.add(this.tackleText);

    this.coinsText = this.scene.add.text(GAME_WIDTH - 16, bottomBarY + 8, '지갑: 0원', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ffff33',
    }).setOrigin(1, 0);
    this.add(this.coinsText);
  }

  private updateHUD(): void {
    const tide = calculateTideInfo();
    this.tideText?.setText(
      `🌊 ${tide.tidePhaseLabel} (세기 ${ (tide.currentStrength * 100).toFixed(0) }%) | 조위 ${tide.currentWaterLevelCm}cm | 다음 조류변화: ${tide.nextTideType === 'high' ? '만조' : '간조'} (${tide.minutesToNextTide}분 전)`,
    );

    const player = GameState.player;
    if (player.currentTackle) {
      const t = player.currentTackle;
      this.tackleText?.setText(
        `🎣 대: ${t.rod.modelName} | 릴: ${t.reel.modelName} (${t.reel.gearRatio}) | 줄: ${t.mainLine.lineNo}호 | 바늘: ${t.hook.hookSize} | 미끼: ${t.bait.name}`,
      );
    } else {
      this.tackleText?.setText('🎣 장착된 채비가 없습니다. 장비실[TackleRoom]에서 셋업하세요.');
    }

    this.coinsText?.setText(`앵글러 코인: ${player.inventory.coins.toLocaleString()} KRW`);
  }
}
