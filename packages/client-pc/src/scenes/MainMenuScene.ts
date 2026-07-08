/**
 * @file MainMenuScene.ts
 * @description 메인 메뉴 씬
 *
 * 기획 명세서 기반 메인 화면 구현:
 * - 실제 시간/날씨 연동 도트 배경 (맑음/비/야간 등)
 * - 방파제 테트라포드에 앉아 있는 플레이어 캐릭터 뒷모습
 * - ASMR 스타일 파도/갈매기 소리
 * - 픽셀 폰트 메뉴 UI
 * - 가이드 & 스토리라인 오버레이 추가
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { EnvironmentStore } from '../store/EnvironmentStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

// 메뉴 항목 정의
const MENU_ITEMS = [
  { key: 'start', label: '▶ 출조하기', scene: 'WorldMapScene' },
  { key: 'tackle', label: '🎣 장비실', scene: 'TackleRoomScene' },
  { key: 'tide', label: '🌊 물때 & 기상', scene: 'TideChartScene' },
  { key: 'log', label: '📖 조과첩', scene: 'AnglerLogScene' },
  { key: 'guide', label: '📖 가이드 & 스토리', scene: null },
  { key: 'settings', label: '⚙ 설정', scene: null },
] as const;

export class MainMenuScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private backgroundGraphics?: Phaser.GameObjects.Graphics;
  private environmentText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private animationObjects: Phaser.GameObjects.GameObject[] = [];
  private guideOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create(): Promise<void> {
    this.drawBackground();
    this.drawCharacter();
    this.createStars();
    this.createTitleLogo();
    this.createMenuUI();
    this.createBottomBar();
    this.setupKeyboardInput();
    this.startAnimations();

    // 환경 데이터 비동기 로드
    void this.loadEnvironmentData();
  }

  // ─────────────────────────────────────────────
  // 배경 그리기 (실제 시간에 따라 변경)
  // ─────────────────────────────────────────────
  private drawBackground(): void {
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;
    const isDusk = (hour >= 18 && hour < 20) || (hour >= 5 && hour < 7);

    this.backgroundGraphics = this.add.graphics();

    // 하늘 그라디언트 (도트 스타일)
    let skyColorTop: number;
    let skyColorBottom: number;

    if (isNight) {
      skyColorTop = 0x010814;
      skyColorBottom = 0x0a1628;
    } else if (isDusk) {
      skyColorTop = 0x1a0a2e;
      skyColorBottom = 0xd45b2a;
    } else {
      skyColorTop = 0x1a4a6e;
      skyColorBottom = 0x2e7eb8;
    }

    // 하늘 (상단 60%)
    this.backgroundGraphics.fillGradientStyle(
      skyColorTop, skyColorTop,
      skyColorBottom, skyColorBottom,
      1,
    );
    this.backgroundGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.6);

    // 바다 (하단 40%)
    const seaColor = isNight ? 0x050f1e : 0x1a4a6e;
    const seaHighlight = isNight ? 0x0a1f3d : 0x2a6a9e;
    this.backgroundGraphics.fillGradientStyle(
      seaColor, seaColor,
      seaHighlight, seaHighlight,
      1,
    );
    this.backgroundGraphics.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);

    // 파도 (도트 라인)
    this.backgroundGraphics.lineStyle(1, 0x3a8abf, 0.3);
    for (let i = 0; i < 5; i++) {
      const y = GAME_HEIGHT * 0.62 + i * 12;
      this.backgroundGraphics.beginPath();
      for (let x = 0; x < GAME_WIDTH; x += 4) {
        const wy = y + Math.sin(x * 0.02) * 2;
        if (x === 0) this.backgroundGraphics.moveTo(x, wy);
        else this.backgroundGraphics.lineTo(x, wy);
      }
      this.backgroundGraphics.strokePath();
    }

    // 방파제 (도트 블록)
    this.backgroundGraphics.fillStyle(0x2a3545);
    this.backgroundGraphics.fillRect(0, GAME_HEIGHT * 0.72, GAME_WIDTH * 0.65, GAME_HEIGHT * 0.28);

    // 테트라포드 (삼각형들)
    this.backgroundGraphics.fillStyle(0x1e2a38);
    for (let i = 0; i < 8; i++) {
      const tx = i * 80 + 20;
      const ty = GAME_HEIGHT * 0.72;
      this.backgroundGraphics.fillTriangle(tx, ty + 16, tx + 16, ty - 8, tx + 32, ty + 16);
    }

    // 원거리 배 실루엣
    if (!isNight) {
      this.backgroundGraphics.fillStyle(0x1a2535);
      this.backgroundGraphics.fillRect(GAME_WIDTH * 0.75, GAME_HEIGHT * 0.58, 60, 12);
      this.backgroundGraphics.fillRect(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.52, 4, 20);
    } else {
      // 야간 선상 갈치배 집어등 (노란 점)
      for (let b = 0; b < 4; b++) {
        const bx = GAME_WIDTH * 0.7 + b * 80;
        const by = GAME_HEIGHT * 0.57;
        this.backgroundGraphics.fillStyle(0xffdd44);
        this.backgroundGraphics.fillRect(bx, by, 3, 3);
      }
    }

    // 달/태양
    if (isNight) {
      // 달
      this.backgroundGraphics.fillStyle(0xeef0dd);
      this.backgroundGraphics.fillCircle(GAME_WIDTH * 0.8, 60, 18);
      this.backgroundGraphics.fillStyle(0x010814);
      this.backgroundGraphics.fillCircle(GAME_WIDTH * 0.8 + 6, 54, 15);
    } else if (!isDusk) {
      // 태양
      this.backgroundGraphics.fillStyle(0xffd700);
      this.backgroundGraphics.fillCircle(GAME_WIDTH * 0.15, 80, 24);
    }
  }

  // ─────────────────────────────────────────────
  // 플레이어 캐릭터 뒷모습 (도트 아트 직접 그리기)
  // ─────────────────────────────────────────────
  private drawCharacter(): void {
    const g = this.add.graphics();
    const cx = GAME_WIDTH * 0.45;
    const cy = GAME_HEIGHT * 0.69;

    // 낚싯대
    g.lineStyle(2, 0xc8a060);
    g.beginPath();
    g.moveTo(cx - 4, cy - 28);
    g.lineTo(cx + 40, cy - 70);
    g.strokePath();

    // 낚싯줄
    g.lineStyle(1, 0xaaaaaa, 0.7);
    g.beginPath();
    g.moveTo(cx + 40, cy - 70);
    g.lineTo(cx + 100, cy - 10);
    g.strokePath();

    // 찌 (빨간 점)
    g.fillStyle(0xff3333);
    g.fillRect(cx + 98, cy - 12, 4, 4);
    g.fillStyle(0xffffff);
    g.fillRect(cx + 99, cy - 16, 2, 4);

    // 모자
    g.fillStyle(0x3a5a3a);
    g.fillRect(cx - 10, cy - 42, 20, 4);
    g.fillRect(cx - 7, cy - 50, 14, 8);

    // 상의
    g.fillStyle(0x2d4a6e);
    g.fillRect(cx - 8, cy - 32, 16, 14);

    // 하의
    g.fillStyle(0x1a2a3a);
    g.fillRect(cx - 6, cy - 18, 12, 16);

    // 등짐 (태클 가방)
    g.fillStyle(0x5a3a2a);
    g.fillRect(cx + 4, cy - 30, 10, 14);

    this.animationObjects.push(g);
  }

  // ─────────────────────────────────────────────
  // 별 (야간)
  // ─────────────────────────────────────────────
  private createStars(): void {
    const hour = new Date().getHours();
    if (hour < 20 && hour >= 6) return;

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT * 0.55);
      const size = Phaser.Math.Between(1, 2);
      const star = this.add.rectangle(x, y, size, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1.0));
      // 깜빡임 트윈
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.5),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  // ─────────────────────────────────────────────
  // 메뉴 UI
  // ─────────────────────────────────────────────
  private createTitleLogo(): void {
    const titleX = GAME_WIDTH * 0.32;
    const titleY = GAME_HEIGHT * 0.22;

    // 타이틀 백보드 (검은색 섀도우)
    this.add.text(titleX + 3, titleY + 3, 'THE REAL ANGLER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#010c1e',
    }).setOrigin(0.5);

    // 실제 메인 로고 텍스트
    const mainTitle = this.add.text(titleX, titleY, 'THE REAL ANGLER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#4af2a1',
    }).setOrigin(0.5);

    // 서브 한글 타이틀
    this.add.text(titleX, titleY + 38, '남해의 푸른 바다, 꾼의 삶', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#88aacc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 빛나는 연출 (하이라이트 애니메이션)
    this.tweens.add({
      targets: mainTitle,
      scaleX: 1.05,
      scaleY: 1.05,
      alpha: 0.9,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 색상 변환 트윈 (청록색과 청색 계열 보간하여 빛나는 물결 느낌 연출)
    let isNeon = false;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        isNeon = !isNeon;
        mainTitle.setColor(isNeon ? '#00ffff' : '#4af2a1');
        mainTitle.setShadow(0, 0, isNeon ? '#00ffffcc' : '#4af2a1cc', isNeon ? 6 : 2, true, true);
      }
    });
  }

  private createMenuUI(): void {
    const panelX = GAME_WIDTH * 0.68;
    const panelY = GAME_HEIGHT * 0.22;

    // 패널 배경 (반투명 글래스모피즘)
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1628, 0.85);
    panel.fillRoundedRect(panelX - 10, panelY - 20, 280, 260, 4);
    panel.lineStyle(1.5, 0x2a5a8a, 0.8);
    panel.strokeRoundedRect(panelX - 10, panelY - 20, 280, 260, 4);

    // 메뉴 항목
    this.menuTexts = [];
    MENU_ITEMS.forEach((item, i) => {
      const text = this.add.text(panelX + 20, panelY + 12 + i * 32, item.label, {
        fontFamily: '"Noto Sans KR", monospace',
        fontSize: '15px',
        color: '#c8dde8',
      });
      this.menuTexts.push(text);
    });

    this.updateMenuSelection();
  }

  private updateMenuSelection(): void {
    this.menuTexts.forEach((text, i) => {
      if (i === this.selectedIndex) {
        text.setColor('#4af2a1');
        text.setStyle({ fontStyle: 'bold' });
        text.setText('▶ ' + MENU_ITEMS[i].label.replace('▶ ', ''));
      } else {
        text.setColor('#c8dde8');
        text.setText(MENU_ITEMS[i].label);
      }
    });
  }

  // ─────────────────────────────────────────────
  // 하단 정보 바
  // ─────────────────────────────────────────────
  private createBottomBar(): void {
    const barY = GAME_HEIGHT - 28;

    // 배경
    const barBg = this.add.graphics();
    barBg.fillStyle(0x060d1a, 0.9);
    barBg.fillRect(0, barY - 4, GAME_WIDTH, 32);

    this.timeText = this.add.text(16, barY + 2, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#4af2a1',
    });

    this.environmentText = this.add.text(GAME_WIDTH / 2, barY + 2, '환경 데이터 로드 중...', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#5a8fab',
    }).setOrigin(0.5, 0);

    // 우측 플레이어 이름
    this.add.text(GAME_WIDTH - 16, barY + 2, `꾼: ${GameState.player.nickname}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#c8a060',
    }).setOrigin(1, 0);

    this.updateTimeDisplay();
    // 1초마다 시간 업데이트
    this.time.addEvent({ delay: 1000, callback: this.updateTimeDisplay, callbackScope: this, loop: true });
  }

  private updateTimeDisplay(): void {
    if (!this.timeText) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.timeText.setText(`🕐 ${h}:${m}:${s}`);
  }

  // ─────────────────────────────────────────────
  // 환경 데이터 로드
  // ─────────────────────────────────────────────
  private async loadEnvironmentData(): Promise<void> {
    const env = await EnvironmentStore.fetchEnvironment('geoje_gujora_breakwater');
    if (env && this.environmentText) {
      const { tide, weather } = env;
      this.environmentText.setText(
        `📍 거제 구조라 | 🌊 ${tide.tidePhaseLabel} | 수온 ${weather.seaSurfaceTempC}°C | 풍속 ${weather.windSpeedMs}m/s ${weather.windDirectionLabel}`,
      );
      this.environmentText.setColor('#4af2a1');
    }
  }

  // ─────────────────────────────────────────────
  // 키보드 입력
  // ─────────────────────────────────────────────
  private setupKeyboardInput(): void {
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.guideOverlay) return;
      this.selectedIndex = (this.selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this.updateMenuSelection();
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.guideOverlay) return;
      this.selectedIndex = (this.selectedIndex + 1) % MENU_ITEMS.length;
      this.updateMenuSelection();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.guideOverlay) return;
      this.selectMenuItem();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.guideOverlay) return;
      this.selectMenuItem();
    });
  }

  private selectMenuItem(): void {
    const item = MENU_ITEMS[this.selectedIndex];
    if (item.key === 'guide') {
      this.showGuideOverlay();
    } else if (item.scene) {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(item.scene);
      });
    }
  }

  // ─────────────────────────────────────────────
  // 가이드 & 스토리 오버레이 구현
  // ─────────────────────────────────────────────
  private showGuideOverlay(): void {
    if (this.guideOverlay) return;

    const { width, height } = this.scale;
    const overlay = this.add.container(width * 0.5, height * 0.5).setDepth(100);
    this.guideOverlay = overlay;

    // 어두운 배경 반투명 사각형
    const bg = this.add.rectangle(0, 0, 700, 500, 0x050f1e, 0.96);
    bg.setStrokeStyle(2, 0x4af2a1);

    const title = this.add.text(0, -210, '📖 The Real Angler 가이드 & 스토리', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const storyTitle = this.add.text(-320, -160, '🌊 스토리라인', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#ffeeaa',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const storyText = this.add.text(-320, -140, 
      "거친 파도와 고독을 사랑하는 프로 낚시꾼, 남해의 푸른 바다를 찾아 거제 구조라 방파제로 떠나다.\n" +
      "그곳에서 단순한 레저 낚시를 넘어 야간 해루질, 통발 설치, 그리고 낚아 올린 물고기로 직접 요리하여\n" +
      "가게를 운영하는 남해의 진정한 삶을 내 손으로 직접 써내려갑니다.", {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ccddee',
      lineSpacing: 6,
    }).setOrigin(0, 0);

    const controlTitle = this.add.text(-320, -40, '⌨ 조작 가이드', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#ffeeaa',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const controlLines = [
      "• [방향키 / WASD] : 필드 상하좌우 4방향 이동 및 메뉴 탐색",
      "• [SPACE / ENTER] : 메뉴 선택 및 물가에서 캐스팅 시작",
      "• [E] : 상점 / 건물 근처에서 대화 및 내부 진입 (식당, 낚시점, 숙소 등)",
      "• [H] : 야간 갯벌 해루질 씬 즉시 이동 (해루질 면허 보유 필수)",
      "• [T] : 통발 구역 통발 배치/수거 씬 즉시 이동 (통발 면허 보유 필수)",
      "• [C] : 주방 캐치앤쿡 요리 및 메뉴 등록 씬 즉시 이동",
      "• [L] : 라이선스 발급 및 코인 교환 패널 열기",
      "• [ESC] : 현재 오버레이 닫기 / 이전 맵(월드맵)으로 복귀",
    ];

    const controlText = this.add.text(-320, -20, controlLines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#a0b8c8',
      lineSpacing: 8,
    }).setOrigin(0, 0);

    const closePrompt = this.add.text(0, 210, '[ESC] 또는 아무 곳이나 클릭하여 메인으로 돌아가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#4af2a1',
    }).setOrigin(0.5);

    overlay.add([bg, title, storyTitle, storyText, controlTitle, controlText, closePrompt]);

    // 클릭해서 닫기
    const dummyHit = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive();
    overlay.addAt(dummyHit, 0);
    
    const closeAction = () => {
      overlay.destroy();
      this.guideOverlay = null;
    };
    
    dummyHit.on('pointerdown', closeAction);

    // ESC로 닫기 리스너 일시 교체
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const escListener = () => {
      closeAction();
      escKey?.removeListener('down', escListener);
    };
    escKey?.on('down', escListener);
  }

  // ─────────────────────────────────────────────
  // 애니메이션 (파도, 새)
  // ─────────────────────────────────────────────
  private startAnimations(): void {
    // 파도 물결 애니메이션
    let waveOffset = 0;
    this.time.addEvent({
      delay: 80,
      callback: () => {
        waveOffset += 0.1;
      },
      loop: true,
    });

    // 갈매기 (도트 점들이 날아다님)
    for (let i = 0; i < 3; i++) {
      const seagull = this.add.text(
        -30 + i * 200,
        Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT * 0.5),
        '~',
        { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' },
      ).setAlpha(0.7);
      this.tweens.add({
        targets: seagull,
        x: GAME_WIDTH + 50,
        duration: Phaser.Math.Between(8000, 15000),
        delay: i * 2000,
        repeat: -1,
        onRepeat: () => {
          seagull.y = Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT * 0.5);
          seagull.x = -50;
        },
      });
    }
  }
}
