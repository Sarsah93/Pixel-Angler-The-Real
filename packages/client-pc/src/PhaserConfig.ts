/**
 * @file PhaserConfig.ts
 * @description Phaser 3 게임 설정 — 픽셀 퍼펙트 렌더러 구성
 *
 * 2D 도트 그래픽에 최적화된 설정:
 * - 픽셀 아트 스케일링 (안티앨리어싱 비활성화)
 * - 해상도: 1280×720 (기준), 스케일 매니저로 브라우저 크기 대응
 * - 렌더러: WebGL 우선 (Canvas 폴백)
 */

import Phaser from 'phaser';

/** 게임 기준 해상도 (도트 그래픽 기준 뷰포트) */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** 도트 그래픽 기준 타일 크기 */
export const TILE_SIZE = 16;

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL 우선, 미지원 시 Canvas
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0e14',
  pixelArt: true, // ← 핵심: 픽셀 아트 모드 (이미지 스케일링 시 안티앨리어싱 OFF)
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  // 씬 목록은 main.ts에서 주입
  scene: [],
};
