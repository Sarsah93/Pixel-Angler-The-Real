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
import { HomeInteriorScene } from './scenes/HomeInteriorScene.js';
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
      HomeInteriorScene,
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
  installCrashGuards(game);
  return game;
}

/**
 * "에러 표시 없는 검은 화면" 방어 2종 (2026-08-10 전수검사).
 *
 * 1) WebGL 컨텍스트 유실 — GPU 부하·드라이버 리셋 시 캔버스가 JS 에러 0으로 검게 멈춘다
 *    (씬은 계속 활성이라 유저는 원인을 알 수 없음). 안내 오버레이를 띄우고 클릭 시 새로고침.
 *    브라우저가 컨텍스트를 복구(webglcontextrestored)하면 오버레이는 자동 제거된다.
 * 2) 처리되지 않은 런타임 예외 — 씬 create 도중 예외가 나면 그 씬이 그리다 만 채 멈춰
 *    검은 화면처럼 보인다. 콘솔을 열지 않아도 알 수 있게 상단 배너로 1회 노출한다.
 */
function installCrashGuards(game: Phaser.Game): void {
  const makeDiv = (css: string, html: string): HTMLDivElement => {
    const div = document.createElement('div');
    div.style.cssText = css;
    div.innerHTML = html;
    document.body.appendChild(div);
    return div;
  };

  // ── 1) WebGL 컨텍스트 유실 오버레이 ──
  game.events.once(Phaser.Core.Events.READY, () => {
    const canvas = game.canvas;
    if (!canvas) return;
    let lostOverlay: HTMLDivElement | null = null;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();   // 기본 처리를 막아야 복구(restored) 이벤트를 받을 수 있다
      if (lostOverlay) return;
      lostOverlay = makeDiv(
        'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;'
        + 'background:#05090f;color:#d0e8f5;font-family:"Noto Sans KR",sans-serif;text-align:center;cursor:pointer;',
        '<div style="font-size:20px;font-weight:bold;margin-bottom:12px;">화면 출력이 중단되었습니다</div>'
        + '<div style="font-size:14px;color:#8faabf;line-height:1.7;">그래픽 장치(WebGL) 연결이 끊겼습니다 — 다른 프로그램의 GPU 부하가 원인일 수 있습니다.<br>'
        + '화면을 클릭하면 게임을 새로고침합니다. (마지막 침대 저장 이후 진행은 복구되지 않습니다)</div>',
      );
      lostOverlay.addEventListener('click', () => location.reload());
      console.error('[PixelAngler] WebGL context lost — 오버레이 표시');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      lostOverlay?.remove();
      lostOverlay = null;
      console.warn('[PixelAngler] WebGL context restored');
    });
  });

  // ── 2) 전역 런타임 에러 배너 (1회) ──
  let errorBannerShown = false;
  const showErrorBanner = (summary: string): void => {
    if (errorBannerShown) return;
    errorBannerShown = true;
    const banner = makeDiv(
      'position:fixed;top:0;left:0;right:0;z-index:99998;background:#5a1616;color:#ffd9d0;'
      + 'font-family:"Noto Sans KR",sans-serif;font-size:12px;line-height:1.6;padding:8px 14px;'
      + 'border-bottom:1px solid #a04030;',
      `<b>게임 내부 오류가 발생했습니다</b> — 화면이 멈췄다면 새로고침(F5)하세요. `
      + `<span style="color:#e8a89a">${summary.replace(/</g, '&lt;').slice(0, 300)}</span>`
      + ' <span style="float:right;cursor:pointer;font-weight:bold;">✕</span>',
    );
    banner.querySelector('span[style*="float"]')?.addEventListener('click', () => banner.remove());
  };
  window.addEventListener('error', (ev) => {
    if (!ev.error) return;   // 리소스 로드 실패(img 등)는 제외 — 스크립트 예외만
    showErrorBanner(String(ev.error?.message ?? ev.message));
  });
  window.addEventListener('unhandledrejection', (ev) => {
    showErrorBanner(String((ev.reason as Error | undefined)?.message ?? ev.reason));
  });
}
