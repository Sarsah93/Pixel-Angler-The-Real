/**
 * @file TideChartScene.ts
 * @description 실시간 물때표 및 기상 대시보드 씬
 */

import Phaser from 'phaser';
import { calculateTideInfo, SPOT_DATABASE } from '@tra/core';
import { GAME_WIDTH } from '../PhaserConfig.js';

export class TideChartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TideChartScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 배경
    this.add.rectangle(0, 0, width, height, 0x050b14).setOrigin(0, 0);

    // 타이틀
    this.add.text(40, 40, '🌊 대한민국 실시간 물때 및 기상정보 (Tide & Weather Forecast)', {
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

    // 낚시터별 물때 리스트 테이블
    this.createTideTable();

    // ESC 설정
    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private createTideTable(): void {
    const startX = 40;
    const startY = 130;
    const tableW = GAME_WIDTH - 80;

    // 테이블 헤더
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0e1c2d);
    headerBg.fillRect(startX, startY, tableW, 40);
    headerBg.lineStyle(1.5, 0x2a5a8a, 0.8);
    headerBg.strokeRect(startX, startY, tableW, 40);

    this.add.text(startX + 20, startY + 12, '출조지 이름', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#c8a060', fontStyle: 'bold' });
    this.add.text(startX + 260, startY + 12, '현재 물때', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#c8a060', fontStyle: 'bold' });
    this.add.text(startX + 440, startY + 12, '조류 세기', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#c8a060', fontStyle: 'bold' });
    this.add.text(startX + 600, startY + 12, '추천 상태', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#c8a060', fontStyle: 'bold' });
    this.add.text(startX + 800, startY + 12, '예상 수온', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#c8a060', fontStyle: 'bold' });

    // 데이터 로우
    SPOT_DATABASE.forEach((spot, idx) => {
      const rowY = startY + 40 + idx * 50;
      const rowBg = this.add.graphics();
      rowBg.fillStyle(idx % 2 === 0 ? 0x07111e : 0x0a1628);
      rowBg.fillRect(startX, rowY, tableW, 50);
      rowBg.lineStyle(1, 0x1f3d5a, 0.5);
      rowBg.strokeRect(startX, rowY, tableW, 50);

      // 물때 계산
      const tide = calculateTideInfo();
      const currentStrengthPct = (tide.currentStrength * 100).toFixed(0);

      let recommendation = '적정';
      let recColor = '#4af2a1';
      if (tide.tidePhase >= 13 || tide.tidePhase <= 1) {
        recommendation = '조류 없음(잡어 극성)';
        recColor = '#ff5555';
      } else if (tide.tidePhase >= 7 && tide.tidePhase <= 9) {
        recommendation = '대물 확률 최고(사리)';
        recColor = '#ffff33';
      }

      this.add.text(startX + 20, rowY + 15, spot.name, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd' });
      this.add.text(startX + 260, rowY + 15, tide.tidePhaseLabel, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd' });
      
      // 조류 강도 시각 표시
      this.add.text(startX + 440, rowY + 15, `${currentStrengthPct}%`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd' });
      
      this.add.text(startX + 600, rowY + 15, recommendation, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: recColor, fontStyle: 'bold' });
      this.add.text(startX + 800, rowY + 15, '21.5°C', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd' });
    });
  }
}
