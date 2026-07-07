/**
 * @file TrapScene.ts
 * @description 통발 관리 씬 (Phaser 3)
 *
 * 통발 설치/수거/상태 확인 전용 인터페이스.
 * - 지도 위 통발 위치 표시
 * - 통발별 상태 (침지 중/수거 가능/분실) 표시
 * - 수거 결과 애니메이션
 */

import Phaser from 'phaser';
import type { DeployedTrap } from '@tra/core';
import {
  harvestTrap,
  getNextOptimalHarvestTime,
  getSpotById,
  SPOT_DATABASE,
  calculateTideInfo,
} from '@tra/core';
import { GameState } from '../store/GameState.js';

export class TrapScene extends Phaser.Scene {
  private trapMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private deployedTraps: DeployedTrap[] = [];
  private statusBar!: Phaser.GameObjects.Text;
  private isDeployingMode = false;

  constructor() {
    super({ key: 'TrapScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20);
    const { width, height } = this.scale;

    // ─── 배경: 해안 지도 뷰 ───
    this.createMapBackground();

    // ─── 타이틀 ───
    this.add
      .text(width * 0.5, 28, '🪤 통발 관리소', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '22px',
        color: '#ffeeaa',
        fontStyle: 'bold',
        backgroundColor: '#00000099',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // ─── 상태 바 ───
    this.statusBar = this.add
      .text(width * 0.5, height - 20, '', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#ccddee',
        backgroundColor: '#00000099',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    // ─── 정보 패널 ───
    this.createInfoPanel();

    // ─── 배치된 통발 로드 및 표시 ───
    this.loadDeployedTraps();

    // ─── 통발 설치 버튼 ───
    this.createDeployButton();

    // ─── 나가기 버튼 ───
    this.createBackButton();

    // ─── 새로고침 타이머 ───
    this.time.addEvent({
      delay: 60000, // 1분마다 상태 업데이트
      loop: true,
      callback: () => this.refreshTrapStatus(),
    });

    // 지도 상 통발 설치 처리
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isDeployingMode) {
        // 지도 수면 구역(y < height * 0.7)에만 설치 허용
        if (pointer.y < height * 0.7) {
          this.deployTrapAt(pointer.x, pointer.y);
        } else {
          this.statusBar.setText('❌ 물 속 구역(수심 영역)에만 통발을 설치할 수 있습니다.');
          this.isDeployingMode = false;
        }
      }
    });
  }

  private createMapBackground(): void {
    const { width, height } = this.scale;

    // 바다 배경
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x0a2030, 0x0a2030, 0x1a4060, 0x1a4060, 1);
    gradient.fillRect(0, 0, width, height);

    // 해안선 (간략화)
    const shore = this.add.graphics();
    shore.fillStyle(0x8b7355, 1);
    shore.fillRect(0, height * 0.7, width, height * 0.3);

    // 격자 (수심 표시)
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a4060, 0.3);
    for (let x = 0; x < width; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height * 0.7);
    }
    for (let y = 0; y < height * 0.7; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();

    // 수심 레이블
    this.add.text(30, height * 0.1, '▸ 심해 구역 (10m+)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#446688',
    }).setDepth(5);
    this.add.text(30, height * 0.35, '▸ 중층 구역 (3~10m)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#446688',
    }).setDepth(5);
    this.add.text(30, height * 0.58, '▸ 얕은 구역 (~3m)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#446688',
    }).setDepth(5);
  }

  private createInfoPanel(): Phaser.GameObjects.Container {
    const { width, height } = this.scale;
    const panel = this.add.container(width - 10, height * 0.5).setDepth(30);
    panel.setVisible(false);

    const bg = this.add.rectangle(0, 0, 200, 300, 0x001122, 0.95).setOrigin(1, 0.5);
    const title = this.add.text(-100, -130, '통발 정보', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: '#ffeeaa',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    panel.add([bg, title]);
    return panel;
  }

  private loadDeployedTraps(): void {
    // GameState 연동
    this.deployedTraps = GameState.deployedTraps;
    this.renderTrapMarkers();
  }

  private renderTrapMarkers(): void {
    const { height } = this.scale;

    this.trapMarkers.forEach((m) => m.destroy());
    this.trapMarkers.clear();

    this.deployedTraps.forEach((trap, index) => {
      const x = (trap.tileX && trap.tileY)
        ? trap.tileX * 40
        : 100 + index * 150 + Math.random() * 50;
      const y = (trap.tileX && trap.tileY)
        ? trap.tileY * 40
        : height * 0.3 + Math.random() * height * 0.25;

      const marker = this.add.container(x, y).setDepth(15).setInteractive(
        new Phaser.Geom.Circle(0, 0, 28),
        Phaser.Geom.Circle.Contains
      );

      // 상태별 색상
      let color = 0x3399ff;  // 기본: 침지 중
      let icon = '🪤';
      let statusLabel = '침지 중';

      if (trap.isLostOrDamaged) {
        color = 0xff3333;
        icon = '❌';
        statusLabel = '분실/손상';
      } else {
        const now = new Date();
        const canHarvest = now >= trap.nextCheckAt;
        if (canHarvest) {
          color = 0x33cc66;
          icon = '✅';
          statusLabel = '수거 가능';
        } else if (trap.baitRemainingRatio < 0.2) {
          color = 0xffaa00;
          icon = '⚠️';
          statusLabel = '미끼 소진';
        }
      }

      const circle = this.add.circle(0, 0, 24, color, 0.85);
      const iconText = this.add.text(0, -4, icon, { fontSize: '18px' }).setOrigin(0.5, 0.5);
      const label = this.add.text(0, 32, statusLabel, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#00000099',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 0.5);

      // 맥박 효과 (수거 가능 상태)
      if (statusLabel === '수거 가능') {
        this.tweens.add({
          targets: circle,
          alpha: { from: 0.85, to: 0.4 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      }

      marker.add([circle, iconText, label]);
      marker.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // 설치 모드 중이 아닐 때만 상세 팝업 오픈
        if (!this.isDeployingMode) {
          pointer.event.stopPropagation();
          this.selectTrap(trap);
        }
      });
      marker.on('pointerover', () => {
        circle.setScale(1.2);
        this.statusBar.setText(`통발 ID: ${trap.instanceId} | ${statusLabel}`);
      });
      marker.on('pointerout', () => {
        circle.setScale(1.0);
        this.statusBar.setText('');
      });

      this.trapMarkers.set(trap.instanceId, marker);
    });
  }

  private selectTrap(trap: DeployedTrap): void {
    this.showTrapDetail(trap);
  }

  private showTrapDetail(trap: DeployedTrap): void {
    const { width, height } = this.scale;

    // 기존 상세 패널 제거
    this.children.list
      .filter((c) => c.name === 'trapDetailPanel')
      .forEach((c) => c.destroy());

    const now = new Date();
    const canHarvest = !trap.isLostOrDamaged && now >= trap.nextCheckAt;
    const soakHours = Math.floor((now.getTime() - trap.deployedAt.getTime()) / 3600000);
    const optimalTime = getNextOptimalHarvestTime(trap);

    const panel = this.add.container(width * 0.5, height * 0.5).setDepth(40);
    panel.setName('trapDetailPanel');

    const bg = this.add.rectangle(0, 0, 320, 320, 0x001a33, 0.97);
    bg.setStrokeStyle(1.5, 0x3366aa);
    
    const title = this.add.text(0, -140, '🪤 통발 상세 정보', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '17px', color: '#ffeeaa', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const lines = [
      `상태: ${trap.isLostOrDamaged ? '❌ 분실/손상' : canHarvest ? '✅ 수거 가능' : '⏳ 침지 중'}`,
      `침지 시간: ${soakHours}시간`,
      `미끼 잔량: ${Math.round(trap.baitRemainingRatio * 100)}%`,
      `포획 중: ${trap.catchInside.map((c) => `${c.nameKo} ${c.countOrWeightG}g`).join(', ') || '없음'}`,
      `최적 수거 시간: ${optimalTime.toLocaleTimeString('ko-KR')}`,
    ];

    const info = this.add.text(0, -40, lines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#ccddee',
      lineSpacing: 8,
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const closeBtn = this.createSmallButton(-60, 120, '✕ 닫기', '#444444');
    closeBtn.on('pointerdown', () => panel.destroy());

    panel.add([bg, title, info, closeBtn]);

    if (canHarvest) {
      const harvestBtn = this.createSmallButton(60, 120, '📦 수거하기', '#005533');
      harvestBtn.on('pointerdown', () => {
        this.harvestSelectedTrap(trap);
        panel.destroy();
      });
      panel.add(harvestBtn);
    } else if (trap.isLostOrDamaged) {
      // 파손된 통발 제거 버튼
      const discardBtn = this.createSmallButton(60, 120, '🗑️ 파기하기', '#662222');
      discardBtn.on('pointerdown', () => {
        GameState.removeTrap(trap.instanceId);
        GameState.save();
        this.loadDeployedTraps();
        panel.destroy();
      });
      panel.add(discardBtn);
    }
  }

  private harvestSelectedTrap(trap: DeployedTrap): void {
    const spot = getSpotById(GameState.currentSpotId || 'geoje_gujora_breakwater') || SPOT_DATABASE[0];
    const env = GameState.environment.environment || {
      tide: calculateTideInfo(new Date()),
      weather: {
        temperatureC: 18,
        windSpeedMs: 4,
        windDirectionDeg: 120,
        weatherCondition: 'clear',
        sunriseAt: new Date(new Date().setHours(6, 0, 0, 0)),
        sunsetAt: new Date(new Date().setHours(19, 0, 0, 0)),
      }
    };

    const result = harvestTrap(trap, {
      spotType: spot.spotType,
      depthM: 5,
      tide: env.tide,
      month: new Date().getMonth() + 1,
      currentStrength: env.tide.currentStrength,
    });

    // 수거 결과 표시
    this.showHarvestResult(result);

    // GameState 반영
    GameState.addTrapCatchToCooler(result.items);
    GameState.removeTrap(trap.instanceId);
    GameState.save();

    // 통발 목록 갱신
    this.loadDeployedTraps();
  }

  private showHarvestResult(result: import('@tra/core').TrapHarvestResult): void {
    const { width, height } = this.scale;
    const panel = this.add.container(width * 0.5, height * 0.5).setDepth(50);

    const bg = this.add.rectangle(0, 0, 320, 280, 0x002211, 0.97);
    bg.setStrokeStyle(1.5, 0x00aa66);
    
    const title = this.add.text(0, -120, '📦 통발 수거 완료!', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '18px', color: '#aaffcc', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const items = result.items.length > 0
      ? result.items.map((i) => `• ${i.nameKo}: ${i.countOrWeightG}g`).join('\n')
      : '수확물 없음';

    const info = this.add.text(0, -20, [
      `침지 시간: ${result.soakTimeHours}시간`,
      `수확물:`,
      items,
      ``,
      `예상 시세: ₩${result.totalValueEstimate.toLocaleString()}`,
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#ccffee', lineSpacing: 6, align: 'center',
    }).setOrigin(0.5, 0.5);

    const closeBtn = this.createSmallButton(0, 110, '✓ 확인', '#004422');
    closeBtn.on('pointerdown', () => panel.destroy());

    panel.add([bg, title, info, closeBtn]);

    this.cameras.main.flash(300, 0, 200, 100);
  }

  private createSmallButton(
    x: number, y: number, label: string, bg: string
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y).setInteractive(
      new Phaser.Geom.Rectangle(-60, -16, 120, 32),
      Phaser.Geom.Rectangle.Contains
    );
    const bgRect = this.add.rectangle(0, 0, 120, 32, parseInt(bg.replace('#', '0x')), 0.9);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    btn.add([bgRect, text]);
    return btn;
  }

  private createDeployButton(): void {
    const { width } = this.scale;
    const btn = this.add.container(width - 80, 70).setDepth(25).setInteractive(
      new Phaser.Geom.Rectangle(-70, -22, 140, 44),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.rectangle(0, 0, 140, 44, 0x005533, 0.9);
    const text = this.add.text(0, 0, '+ 통발 설치', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#aaffcc',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    btn.add([bg, text]);
    btn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.isDeployingMode = true;
      this.statusBar.setText('🗺️ 설치 위치를 물 속(격자 무늬) 지도에서 클릭하세요.');
    });
    btn.on('pointerover', () => bg.setAlpha(1.0));
    btn.on('pointerout', () => bg.setAlpha(0.9));
  }

  private deployTrapAt(x: number, y: number): void {
    this.isDeployingMode = false;

    const activeCount = GameState.deployedTraps.length;
    const hasCommercial = GameState.hasLicense('commercial_trap');

    if (activeCount >= 3 && !hasCommercial) {
      this.statusBar.setText('❌ 기본 면허는 최대 3개까지 설치 가능합니다. (상업용 면허 필요)');
      this.cameras.main.flash(200, 150, 0, 0);
      return;
    }

    const newTrap: DeployedTrap = {
      instanceId: `trap-${Date.now()}`,
      trapSpecId: 'trap_crab_basic',
      spotId: GameState.currentSpotId || 'geoje_gujora_breakwater',
      tileX: Math.floor(x / 40),
      tileY: Math.floor(y / 40),
      deployedAt: new Date(),
      nextCheckAt: new Date(Date.now() + 4 * 3600000), // 4시간 후 수거
      baitItemId: 'bait_sandworm_fresh',
      baitRemainingRatio: 1.0,
      catchInside: [],
      isLostOrDamaged: false,
    };

    GameState.deployTrap(newTrap);
    GameState.save();

    this.statusBar.setText('✅ 통발이 정상적으로 설치되었습니다!');
    this.loadDeployedTraps();
  }

  private createBackButton(): void {
    const btn = this.add.container(80, 70).setDepth(25).setInteractive(
      new Phaser.Geom.Rectangle(-70, -22, 140, 44),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.rectangle(0, 0, 140, 44, 0x333333, 0.9);
    const text = this.add.text(0, 0, '← 돌아가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    btn.add([bg, text]);
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(220, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume('FieldScene');
      });
    });
    btn.on('pointerover', () => bg.setAlpha(1.0));
    btn.on('pointerout', () => bg.setAlpha(0.9));
  }

  private refreshTrapStatus(): void {
    this.renderTrapMarkers();
  }
}
