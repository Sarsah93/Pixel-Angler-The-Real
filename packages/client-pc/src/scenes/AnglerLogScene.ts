/**
 * @file AnglerLogScene.ts
 * @description 조과첩 및 낚시 도감 씬
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { FISH_DATABASE } from '@tra/core';

export class AnglerLogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AnglerLogScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 배경
    this.add.rectangle(0, 0, width, height, 0x050b14).setOrigin(0, 0);

    // 타이틀
    this.add.text(40, 40, '📖 꾼의 조과첩 & 어종 도감 (Angler\'s Log)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '24px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });

    this.add.text(40, 75, 'ESC 키를 누르면 메인 메뉴로 이동합니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#8faabf',
    });

    // 어종 목록 렌더링
    this.createFishGrid();

    // ESC 설정
    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private createFishGrid(): void {
    const startX = 40;
    const startY = 130;
    const itemW = 280;
    const itemH = 160;
    const colCount = 4;

    const records = GameState.player.caughtFishHistory;

    FISH_DATABASE.forEach((fish, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);

      const x = startX + col * (itemW + 20);
      const y = startY + row * (itemH + 20);

      // 카드 배경
      const card = this.add.graphics();
      card.fillStyle(0x0e1c2d);
      card.fillRoundedRect(x, y, itemW, itemH, 4);
      card.lineStyle(1.5, 0x2a5a8a, 0.8);
      card.strokeRoundedRect(x, y, itemW, itemH, 4);

      // 도감 해금 확인 (이 어종을 한 번이라도 잡았는지)
      const caughtCount = records.filter(r => r.fishSpeciesId === fish.id).length;
      const bestRecord = GameState.player.personalRecords[fish.id] || 0;

      if (caughtCount > 0) {
        // 해금 완료 정보 표시
        this.add.text(x + 15, y + 15, fish.nameKo, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: '#4af2a1', fontStyle: 'bold' });
        this.add.text(x + 15, y + 42, fish.scientificName, { fontFamily: 'monospace', fontSize: '10px', color: '#5a8fab', fontStyle: 'italic' });
        
        this.add.text(x + 15, y + 70, `최대어: ${bestRecord} cm`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
        this.add.text(x + 15, y + 95, `누적 조과: ${caughtCount} 수`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
        this.add.text(x + 15, y + 120, `회 가치: kg당 ${fish.sashimiValuePerKg.toLocaleString()}원`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#c8a060' });
      } else {
        // 미해금 상태
        this.add.text(x + itemW / 2, y + itemH / 2 - 10, '???', { fontFamily: '"Press Start 2P", monospace', fontSize: '18px', color: '#2a5a8a' }).setOrigin(0.5);
        this.add.text(x + itemW / 2, y + itemH / 2 + 20, '아직 발견하지 못함', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#1f3d5a' }).setOrigin(0.5);
      }
    });
  }
}
