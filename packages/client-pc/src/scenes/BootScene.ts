/**
 * @file BootScene.ts
 * @description 부트 씬 — 에셋 프리로드 및 로딩 화면
 *
 * 게임 시작 시 가장 먼저 실행되는 씬.
 * 모든 에셋을 로드하고 MainMenuScene으로 이동합니다.
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingScreen();
    this.loadAssets();
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }

  private createLoadingScreen(): void {
    const { width, height } = this.cameras.main;

    // 배경
    this.add.rectangle(0, 0, width, height, 0x0a0e14).setOrigin(0, 0);

    // 로딩 바 배경
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 8, 0x1a2535).setOrigin(0.5);
    // 로딩 바 (실제 진행)
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 8, 0x4af2a1).setOrigin(0, 0.5);

    // 타이틀 텍스트
    this.add
      .text(width / 2, height / 2 - 60, 'THE REAL ANGLER', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '24px',
        color: '#e8f4fd',
        shadow: { offsetX: 3, offsetY: 3, color: '#001a33', blur: 0, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 28, '더 리얼 앵글러', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5a8fab',
      })
      .setOrigin(0.5);

    const loadingText = this.add
      .text(width / 2, height / 2 + 30, '채비 중...', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a8fab',
      })
      .setOrigin(0.5);

    void barBg;

    // 로딩 진행률 업데이트
    this.load.on('progress', (value: number) => {
      bar.width = 400 * value;
    });

    this.load.on('fileprogress', (file: { key: string }) => {
      loadingText.setText(`로딩 중: ${file.key}`);
    });

    this.load.on('complete', () => {
      loadingText.setText('출조 준비 완료!');
    });
  }

  private loadAssets(): void {
    // ─── 폰트 로드 (Google Fonts — 온라인 환경)
    // 픽셀 폰트는 추후 실제 에셋으로 대체
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+KR:wght@400;700&display=swap';
    document.head.appendChild(fontLink);

    // ─── 스프라이트 시트 (placeholder — 추후 실제 도트 에셋으로 교체)
    // 임시 컬러 팔레트 텍스처 생성 (에셋 없이 동작하도록)
    // 실제 도트 에셋 준비 후 아래 주석 해제

    // this.load.spritesheet('player', '/assets/sprites/player.png', { frameWidth: 16, frameHeight: 24 });
    // this.load.image('breakwater_tileset', '/assets/sprites/breakwater_tileset.png');
    // this.load.audio('waves', '/assets/audio/waves.ogg');
    // this.load.audio('reel_click', '/assets/audio/reel_click.ogg');
    // this.load.audio('fish_splash', '/assets/audio/fish_splash.ogg');

    // 임시 더미 로딩 (에셋 없이 개발 시작)
    this.load.on('complete', () => {
      console.log('[BootScene] Assets loaded (placeholder mode)');
    });
  }
}
