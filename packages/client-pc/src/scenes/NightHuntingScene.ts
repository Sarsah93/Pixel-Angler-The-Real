/**
 * @file NightHuntingScene.ts
 * @description 해루질 씬 (Phaser 3)
 *
 * 야간 조간대/갯바위에서 생물을 채취하는 해루질 전용 뷰.
 * - 집어등 효과 (광원 쉐이더 시뮬레이션)
 * - 생물 탐색 및 포획 미니게임
 * - 조위 시각화 (물이 들어오는 애니메이션)
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { getSpotById, SPOT_DATABASE, calculateTideInfo, getHuntableCreatures, attemptHunt } from '@tra/core';
import type { ShoreHuntingGear, ShoreHarvestItem, NightHuntingContext, ShoreCreature } from '@tra/core';

export class NightHuntingScene extends Phaser.Scene {
  private darkOverlay!: Phaser.GameObjects.Rectangle;
  private lampLight!: Phaser.GameObjects.Arc;
  private lampGlow!: Phaser.GameObjects.Arc;
  private tideWarningText!: Phaser.GameObjects.Text;
  private huntingActive = false;
  private sessionStartTime = 0;

  // UI 요소
  private timerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private catchLog!: Phaser.GameObjects.Text;
  private exitButton!: Phaser.GameObjects.Container;
  private harvestButton!: Phaser.GameObjects.Container;

  // 게임 상태 연동 변수
  private caughtItems: ShoreHarvestItem[] = [];
  private huntContext!: NightHuntingContext;
  private huntableCreaturesList: ShoreCreature[] = [];

  constructor() {
    super({ key: 'NightHuntingScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20);
    const { width, height } = this.scale;

    // ─── 배경: 야간 해안 ───
    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0, 0);

    // 달빛 효과
    this.add.circle(width * 0.75, height * 0.15, 40, 0xfff5cc, 0.9);
    const moonGlow = this.add.circle(width * 0.75, height * 0.15, 80, 0xfff5cc, 0.15);
    this.tweens.add({
      targets: moonGlow,
      alpha: { from: 0.1, to: 0.25 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
    });

    // 별빛 효과
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height * 0.4,
        Math.random() * 2,
        0xffffff,
        Math.random() * 0.8 + 0.2
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // 수면/조간대 배경
    this.add.rectangle(0, height * 0.55, width, height * 0.45, 0x0d2b4b).setOrigin(0, 0);

    // 바위 실루엣
    this.drawRockyShore();

    // 조간대 물 애니메이션
    this.createTideAnimation();

    // ─── 집어등 효과 ───
    this.darkOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0, 0);
    this.darkOverlay.setDepth(5);

    // 집어등 광원 (플레이어 위치 중앙)
    const cx = width * 0.5;
    const cy = height * 0.65;
    this.lampGlow = this.add.circle(cx, cy, 180, 0xffdd66, 0.12).setDepth(6);
    this.lampLight = this.add.circle(cx, cy, 100, 0xffeeaa, 0.25).setDepth(7);

    // 집어등 깜빡임 효과
    this.tweens.add({
      targets: [this.lampLight, this.lampGlow],
      alpha: { from: 0.25, to: 0.18 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ─── 게임 상태 및 컨텍스트 초기화 ───
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

    const defaultGear: ShoreHuntingGear = {
      lamp: {
        id: 'lamp_basic',
        nameKo: '보급형 랜턴',
        lumens: 300,
        batteryHours: 4,
        isUnderwaterRated: false,
      },
      cooler: {
        id: 'cooler_basic_20l',
        nameKo: '보급형 아이스박스 20L',
        capacityLiters: 20,
        insulationHours: 12,
        slots: 10,
      }
    };

    this.huntContext = {
      spotType: spot.spotType,
      hourOfDay: new Date().getHours(),
      tide: env.tide,
      weather: env.weather as any,
      gear: defaultGear,
      huntingDurationMinutes: 0,
      month: new Date().getMonth() + 1,
      hasAdvancedLicense: GameState.hasLicense('shore_hunting_advanced'),
    };

    this.huntableCreaturesList = getHuntableCreatures(this.huntContext);
    this.caughtItems = [];

    // ─── 생물 스폰 ───
    this.spawnCreatures();

    // ─── HUD ───
    this.createHUD();

    // ─── 조위 경고 ───
    this.tideWarningText = this.add
      .text(width * 0.5, height * 0.12, '', {
        fontSize: '14px',
        color: '#ff9900',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 },
        wordWrap: { width: width * 0.7 },
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // 안전 경고 체크
    this.checkSafety();

    // 해루질 시작
    this.startHunting();
  }

  private drawRockyShore(): void {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.setDepth(3);
    graphics.fillStyle(0x2a2a2a);

    // 좌측 바위 군락
    graphics.fillEllipse(width * 0.1, height * 0.7, 160, 80);
    graphics.fillEllipse(width * 0.18, height * 0.68, 120, 60);
    graphics.fillEllipse(width * 0.05, height * 0.72, 100, 50);

    // 우측 바위 군락
    graphics.fillEllipse(width * 0.85, height * 0.7, 180, 90);
    graphics.fillEllipse(width * 0.78, height * 0.72, 140, 70);
    graphics.fillEllipse(width * 0.92, height * 0.68, 100, 50);

    // 갯바위 이끼 효과 (초록 계열)
    graphics.fillStyle(0x1a3a1a, 0.5);
    graphics.fillEllipse(width * 0.1, height * 0.72, 100, 30);
    graphics.fillEllipse(width * 0.85, height * 0.72, 120, 30);
  }

  private createTideAnimation(): void {
    const { width, height } = this.scale;
    const waterGraphics = this.add.graphics().setDepth(4);

    // 물결 애니메이션 (간단한 사인파 시뮬레이션)
    let waveOffset = 0;
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        waterGraphics.clear();
        waterGraphics.fillStyle(0x0d3a5c, 0.6);
        waterGraphics.beginPath();
        waterGraphics.moveTo(0, height);

        for (let x = 0; x <= width; x += 10) {
          const y = height * 0.6 + Math.sin((x + waveOffset) * 0.02) * 8
            + Math.sin((x + waveOffset * 0.7) * 0.03) * 5;
          waterGraphics.lineTo(x, y);
        }
        waterGraphics.lineTo(width, height);
        waterGraphics.closePath();
        waterGraphics.fillPath();
        waveOffset += 2;
      },
    });
  }

  private spawnCreatures(): void {
    if (this.huntableCreaturesList.length === 0) return;
    const { width, height } = this.scale;

    const count = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const cx = width * 0.5;
      const cy = height * 0.65;
      const radius = 60 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.6;

      const creature = this.huntableCreaturesList[Math.floor(Math.random() * this.huntableCreaturesList.length)]!;
      const emoji = this.getCreatureEmoji(creature.category, creature.nameKo);

      const creatureText = this.add
        .text(x, y, emoji, { fontSize: '24px' })
        .setOrigin(0.5, 0.5)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

      creatureText.setData('creature', creature);

      // 은은한 흔들림
      this.tweens.add({
        targets: creatureText,
        y: y - 5,
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // 클릭 시 포획 시도
      creatureText.on('pointerdown', () => {
        this.catchCreature(creatureText, creature);
      });

      creatureText.on('pointerover', () => {
        creatureText.setScale(1.3);
      });
      creatureText.on('pointerout', () => {
        creatureText.setScale(1.0);
      });
    }
  }

  private getCreatureEmoji(category: string, nameKo: string): string {
    if (nameKo.includes('낙지') || nameKo.includes('문어') || category === 'cephalopod') return '🐙';
    if (category === 'crustacean') return '🦀';
    if (category === 'shellfish' || category === 'bivalve' || category === 'gastropod') return '🐚';
    if (category === 'echinoderm') return '🦪';
    return '🐚';
  }

  private catchCreature(sprite: Phaser.GameObjects.Text, creature: ShoreCreature): void {
    // 포획 이펙트
    this.tweens.add({
      targets: sprite,
      scale: 2,
      alpha: 0,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => sprite.destroy(),
    });

    const result = attemptHunt(creature, this.huntContext);

    let floatText = '';
    let color = '';

    if (!result) {
      floatText = '놓침!';
      color = '#ff6666';
    } else if (result.isUndersized) {
      floatText = `방류 (${result.sizeDescCm}cm 미달)`;
      color = '#ffbb33';
    } else {
      floatText = `✓ ${result.nameKo} (${result.countOrWeightG}g)!`;
      color = '#00ff88';
      this.caughtItems.push(result);

      // 캐치 로그 업데이트
      const currentLog = this.catchLog.text;
      const lines = currentLog.split('\n').filter(Boolean);
      if (lines.length > 5) lines.shift(); // 스크롤 방지
      lines.push(`• ${result.nameKo} (${result.countOrWeightG}g)`);
      this.catchLog.setText(lines.join('\n'));

      this.cameras.main.shake(150, 0.005);
    }

    const feedback = this.add
      .text(sprite.x, sprite.y - 20, floatText, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: color,
        fontStyle: 'bold',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(30);

    this.tweens.add({
      targets: feedback,
      y: sprite.y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => feedback.destroy(),
    });
  }

  private createHUD(): void {
    const { width, height } = this.scale;

    // 타이머 (우상단)
    this.timerText = this.add
      .text(width - 20, 20, '🕐 탐색 시간: 00:00', {
        fontSize: '14px',
        color: '#ffeeaa',
        fontFamily: 'monospace',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(1, 0)
      .setDepth(25);

    // 상태 텍스트 (좌상단)
    this.statusText = this.add
      .text(20, 20, '🔦 해루질 탐색 중...', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0, 0)
      .setDepth(25);

    // 채취 로그 (우측)
    this.add
      .text(width - 20, height * 0.3, '📦 채취 목록', {
        fontSize: '12px',
        color: '#aaffcc',
        fontStyle: 'bold',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(25);

    this.catchLog = this.add
      .text(width - 20, height * 0.36, '', {
        fontSize: '12px',
        color: '#ccffee',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
        lineSpacing: 4,
      })
      .setOrigin(1, 0)
      .setDepth(25);

    // 수거 버튼
    this.harvestButton = this.createButton(
      width * 0.5 - 70, height - 50, '🎒 수거 완료', '#007744'
    );
    this.harvestButton.on('pointerdown', () => this.endHunting());

    // 나가기 버튼
    this.exitButton = this.createButton(
      width * 0.5 + 70, height - 50, '← 돌아가기', '#444444'
    );
    this.exitButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(220, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume('FieldScene');
      });
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bg: string
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y).setDepth(30).setInteractive(
      new Phaser.Geom.Rectangle(-70, -18, 140, 36),
      Phaser.Geom.Rectangle.Contains
    );

    const bg2 = this.add.rectangle(0, 0, 140, 36, parseInt(bg.replace('#', '0x')), 0.9);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    btn.add([bg2, text]);

    btn.on('pointerover', () => bg2.setAlpha(1.0));
    btn.on('pointerout', () => bg2.setAlpha(0.9));

    return btn;
  }

  private checkSafety(): void {
    const warningMsg = '⚠️ 야간 해루질 시 반드시 집어등을 착용하고 안전구역 내에서 탐색하세요.';
    this.tideWarningText.setText(warningMsg);

    // 4초 후 경고 사라짐
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: this.tideWarningText,
        alpha: 0,
        duration: 500,
      });
    });
  }

  private startHunting(): void {
    this.huntingActive = true;
    this.sessionStartTime = Date.now();
    let catchCount = 0;

    // 타이머 업데이트
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.huntingActive) return;
        const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        this.timerText.setText(`🕐 탐색 시간: ${min}:${sec}`);
        // 채취 수 갱신
        catchCount = this.caughtItems.length;
        this.statusText.setText(`🔦 탐색 중 | 채취: ${catchCount}건`);
      },
    });

    // 주기적 생물 리스폰
    this.time.addEvent({
      delay: 15000, // 15초마다 새 생물 추가 (조금 더 빠른 리스폰으로 액션감 업)
      loop: true,
      callback: () => {
        if (this.huntingActive) this.spawnCreatures();
      },
    });
  }

  private endHunting(): void {
    this.huntingActive = false;
    const durationMs = Date.now() - this.sessionStartTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    // 결과 표시
    this.showHarvestResult(durationMinutes);
  }

  private showHarvestResult(durationMinutes: number): void {
    const { width, height } = this.scale;

    const panel = this.add.container(width * 0.5, height * 0.5).setDepth(50);
    const bg = this.add.rectangle(0, 0, 340, 260, 0x001122, 0.95);
    bg.setStrokeStyle(1.5, 0x00aa66);
    
    const title = this.add.text(0, -110, '🎉 해루질 완료!', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#aaffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const totalWeight = this.caughtItems.reduce((sum, item) => sum + item.countOrWeightG, 0);

    const summary = this.add.text(0, -50, [
      `탐색 시간: ${durationMinutes}분`,
      `채취 성공: ${this.caughtItems.length}건`,
      `총 채취 무게: ${(totalWeight / 1000).toFixed(2)}kg`,
      '',
      '수확물을 쿨러에 담아 가시겠습니까?',
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#cceecc',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0.5);

    const confirmBtn = this.createButton(0, 90, '✓ 완료하고 담기', '#005522');
    confirmBtn.on('pointerdown', () => {
      // GameState에 저장
      GameState.addHarvestToCooler(this.caughtItems);
      GameState.save();

      this.cameras.main.fadeOut(220, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume('FieldScene');
      });
    });

    panel.add([bg, title, summary, confirmBtn]);
  }

  update(): void {
    // 집어등 위치를 마우스 근처로 약간 이동 (상호작용감)
    const pointer = this.input.activePointer;
    if (pointer && this.lampLight) {
      const { width, height } = this.scale;
      const cx = width * 0.5;
      const cy = height * 0.65;
      const dx = (pointer.worldX - cx) * 0.05;
      const dy = (pointer.worldY - cy) * 0.05;
      this.lampLight.setPosition(cx + dx, cy + dy);
      this.lampGlow.setPosition(cx + dx * 0.5, cy + dy * 0.5);
    }
  }
}
