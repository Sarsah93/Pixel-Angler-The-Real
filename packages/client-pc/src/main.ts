/**
 * @file main.ts
 * @description Phaser 3 게임 진입점 — 게임 생성은 여기서만 호출
 *
 * 생성 로직 전체는 game.ts(부작용 없는 팩토리)에 있다.
 * createGame()은 globalThis 싱글턴 가드로 이중 생성을 차단하므로,
 * 검증 하네스가 이 모듈을 다시 import해도 기존 인스턴스를 돌려받는다.
 */

import { createGame, disposeGame } from './game.js';
import { GameState } from './store/GameState.js';

const game = createGame();

// DialoguePanel 같은 Phaser UI 모듈이 HMR로 갱신될 때 기존 게임 인스턴스를
// 재사용하지 않고 최신 씬/패널 클래스로 다시 만들도록 한다. 프로덕션 빌드에서는
// import.meta.hot이 존재하지 않으므로 실행되지 않는다.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeGame();
  });
}

// Tauri 환경에서 윈도우 닫기 이벤트 처리
if ('__TAURI__' in window) {
  window.addEventListener('beforeunload', () => {
    GameState.save();
  });
}

export { game };
