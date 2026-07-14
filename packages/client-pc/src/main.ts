/**
 * @file main.ts
 * @description Phaser 3 게임 진입점
 *
 * 모든 씬을 등록하고 게임을 시작합니다.
 * 전역 GameState 초기화도 여기서 수행합니다.
 */

import Phaser from 'phaser';
import { PHASER_CONFIG } from './PhaserConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { RegionFieldScene } from './scenes/RegionFieldScene.js';
import { FieldScene } from './scenes/FieldScene.js';
import { FishingScene } from './scenes/FishingScene.js';
import { TackleRoomScene } from './scenes/TackleRoomScene.js';
import { TideChartScene } from './scenes/TideChartScene.js';
import { AnglerLogScene } from './scenes/AnglerLogScene.js';
import { NightHuntingScene } from './scenes/NightHuntingScene.js';
import { TrapScene } from './scenes/TrapScene.js';
import { RestaurantScene } from './scenes/RestaurantScene.js';
import { CondoScene } from './scenes/CondoScene.js';
import { CookScene } from './scenes/CookScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { GameState } from './store/GameState.js';

// 전역 게임 상태 초기화
GameState.initialize();

// 씬 등록 순서가 곧 씬 키 우선순위
const config: Phaser.Types.Core.GameConfig = {
  ...PHASER_CONFIG,
  scene: [
    BootScene,
    MainMenuScene,
    WorldMapScene,
    RegionFieldScene,
    FieldScene,
    FishingScene,
    TackleRoomScene,
    TideChartScene,
    AnglerLogScene,
    NightHuntingScene,
    TrapScene,
    RestaurantScene,
    CondoScene,
    CookScene,
    SettingsScene,
  ],
};

// 게임 인스턴스 생성
const game = new Phaser.Game(config);

// Tauri 환경에서 윈도우 닫기 이벤트 처리
if ('__TAURI__' in window) {
  window.addEventListener('beforeunload', () => {
    GameState.save();
  });
}

export { game };
