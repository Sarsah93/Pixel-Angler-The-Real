/**
 * @file game.ts
 * @description Phaser 게임 인스턴스 팩토리 — 부작용 없는 순수 모듈
 *
 * main.ts(엔트리)만 createGame()을 호출한다. 이 파일은 import해도
 * 아무것도 실행되지 않으므로, 테스트 하네스가 모듈을 다시 평가해도
 * 두 번째 Phaser.Game이 생성되지 않는다.
 *
 * 이중 생성 가드: Vite dev(HMR)나 검증 하네스의 동적 import(`import('/src/main.ts')`)로
 * 모듈이 재평가되어도 `globalThis.__PIXEL_ANGLER_GAME` 싱글턴을 재사용한다.
 * (과거 이 가드가 없어 하네스 import 시 캔버스가 2개 생기고 640px 오프셋으로
 *  겹쳐 보이는 검증 아티팩트가 있었음 — 2026-07-16 검증에서 발견)
 */

import Phaser from 'phaser';
import { PHASER_CONFIG } from './PhaserConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { RegionFieldScene } from './scenes/RegionFieldScene.js';
import { FirstPersonFishingScene } from './scenes/FirstPersonFishingScene.js';
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
import { CreditsScene } from './scenes/CreditsScene.js';
import { GameState } from './store/GameState.js';
import { initDevTuningPanel } from './dev/DevTuningPanel.js';

/** 싱글턴 보관 키 — HMR/재평가를 넘어 유지된다 */
const GAME_KEY = '__PIXEL_ANGLER_GAME';

type GameHolder = { [GAME_KEY]?: Phaser.Game };

/**
 * 게임 인스턴스 생성 (또는 기존 인스턴스 재사용).
 * 엔트리(main.ts)에서만 호출할 것 — 다른 모듈은 game 인스턴스가 필요하면
 * 이 함수를 호출하지 말고 씬의 `this.game`을 쓰는 것이 원칙.
 */
export function createGame(): Phaser.Game {
  // 이중 생성 가드 — 이미 만들어진 인스턴스가 있으면 재사용
  const holder = globalThis as GameHolder;
  const existing = holder[GAME_KEY];
  if (existing) return existing;

  GameState.initialize();
  // dev 전용 튜닝 슬라이더 오버레이 (F8) — 프로덕션에서는 즉시 반환/데드코드 제거
  initDevTuningPanel();

  // 씬 등록 순서가 곧 씬 키 우선순위
  const config: Phaser.Types.Core.GameConfig = {
    ...PHASER_CONFIG,
    scene: [
      BootScene,
      MainMenuScene,
      WorldMapScene,
      RegionFieldScene,
      FirstPersonFishingScene,
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
      CreditsScene,
    ],
  };

  const game = new Phaser.Game(config);
  holder[GAME_KEY] = game;
  return game;
}
