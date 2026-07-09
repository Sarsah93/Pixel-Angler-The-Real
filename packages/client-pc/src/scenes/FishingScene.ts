/**
 * @file FishingScene.ts
 * @description 코어 낚시 메커니즘을 시각화하고 제어하는 씬
 * 
 * 3D를 배제하고 UI, 수치, 2D 이펙트 중심의 고도 심리전 낚시 루프:
 * 1. 조준 & 파워 게이지 캐스팅
 * 2. 물가 안착 후 찌 흘림 (대기)
 * 3. 찌의 미세한 움직임 (어신) 체크
 * 4. 정확한 타이밍의 챔질
 * 5. 드랙음 & 텐션 게이지 밀당 파이팅
 * 6. 결과 팝업 및 복귀
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { EnvironmentStore } from '../store/EnvironmentStore.js';
import {
  calculateBiteChance,
  pickFishByWeight,
  generateFishSize,
  calculateCast,
  getEffectiveDragKg,
  adjustDrag,
  simulateFightTick,
  canReel,
  FISH_DATABASE,
} from '@tra/core';
import type { FishingPhase, TackleSetup, FishSpecies, LineState, FishingPoint } from '@tra/core';
import { FishingFocusWindow } from '../ui/FishingFocusWindow.js';
import { BiteIndicator } from '../ui/BiteIndicator.js';

export class FishingScene extends Phaser.Scene {
  private phase: FishingPhase = 'idle';
  private tackle!: TackleSetup;

  // UI 컴포넌트
  private statusText?: Phaser.GameObjects.Text;
  private focusWindow?: FishingFocusWindow;
  private biteIndicator?: BiteIndicator;
  
  // 파워 게이지
  private powerBarBg?: Phaser.GameObjects.Rectangle;
  private powerBar?: Phaser.GameObjects.Rectangle;
  private isPowerIncreasing = true;
  private castPower = 0.0;

  // 파이팅 상태
  private fishBeingFought: FishSpecies | null = null;
  private fishLength = 0;
  private fishWeight = 0;
  private fishStamina = 1.0;
  private lineState!: LineState;
  
  // 게이지 UI
  private tensionBarBg?: Phaser.GameObjects.Rectangle;
  private tensionBar?: Phaser.GameObjects.Rectangle;
  private dragText?: Phaser.GameObjects.Text;

  // 비동기 타이머
  private biteCheckTimer?: Phaser.Time.TimerEvent;

  private currentPoint!: FishingPoint;

  init(data?: { point?: FishingPoint }): void {
    this.currentPoint = data?.point || {
      id: 'point_default',
      tileX: 10,
      tileY: 10,
      label: '방파제 수중여',
      depthM: 8,
      possibleSpeciesIds: ['black_seabream', 'largescale_blackfish', 'black_rockfish'],
      biteBonusMultiplier: 1.2,
    };

    // 플레이어 채비 강제 셋팅 (없으면 기본값)
    this.tackle = GameState.player.currentTackle || {
      rod: {
        id: 'rod_daiwaSS1500_1p5',
        brand: '다이오',
        modelName: 'SS 1500 1.5호',
        lengthM: 5.3,
        lineWeightGrade: '1.5호',
        recommendedLineNo: [1, 2],
        guideCount: 9,
        pieces: 5,
        weightG: 185,
        priceKRW: 180000,
        rodType: 'float_fishing',
        description: '',
      },
      reel: {
        id: 'reel_daiwa3000',
        brand: '다이오',
        modelName: 'FREAMS LT 3000-C',
        reelSize: 3000,
        gearRatio: '5.2:1',
        maxDragKg: 10.0,
        retrievePerCrank: 73,
        bearingCount: '6+1',
        weightG: 215,
        lineCapacity: '2.5호-150m',
        priceKRW: 180000,
        reelType: 'spinning',
      },
      mainLine: {
        id: 'line_nylon_2no',
        brand: '동양라인',
        modelName: 'Dynacast 2호',
        lineNo: 2.0,
        strengthLb: 8,
        diameterMm: 0.235,
        material: 'nylon',
        color: '핑크',
        priceKRW: 8000,
      },
      rigType: 'full_float_flowing',
      hook: {
        id: 'hook_chinu_3',
        name: '감성돔 바늘 3호',
        hookSize: '3호',
        hookType: 'circle',
        material: 'carbon_steel',
      },
      bait: {
        id: 'bait_sandworm_fresh',
        name: '청갯지렁이',
        category: 'sandworm',
        baseEffectiveness: 85,
        isConsumable: true,
        canBeForaged: false,
      },
    };

    // 파이팅 물리 초기화
    this.lineState = {
      currentTensionKg: 0,
      dragRatio: 0.5, // 50% 드랙력
      lineLengthOutM: 0,
      isLineBroken: false,
    };
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20);
    const { width, height } = this.scale;

    // 배경 물결 그리기
    this.add.rectangle(0, 0, width, height, 0x051a2e).setOrigin(0, 0);

    // 헤더/상태 UI
    this.statusText = this.add.text(width / 2, 40, '캐스팅 준비: [스페이스]를 길게 누르면 파워 조절 시작', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#e8f4fd',
    }).setOrigin(0.5);

    // 집중 윈도우 UI
    this.focusWindow = new FishingFocusWindow(this, width / 2, height / 2 - 20, 240);
    this.add.existing(this.focusWindow);

    // 찌 어신 인디케이터
    this.biteIndicator = new BiteIndicator(this, width / 2, height / 2 - 20);
    this.add.existing(this.biteIndicator);

    // 파워 바 UI 생성
    this.createPowerBarUI();

    // 텐션 바 UI 생성
    this.createTensionBarUI();

    // 키보드 바인딩
    this.setupInput();

    // 시작
    this.transitionTo('idle');

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'aiming') {
      this.updatePowerGauge();
    } else if (this.phase === 'fighting') {
      this.updateFightingLoop(delta);
    }

    if (this.phase === 'in_water' || this.phase === 'bite_detected' || this.phase === 'setting_hook') {
      this.focusWindow?.updateShadows(delta);
    }
  }

  private transitionTo(newPhase: FishingPhase): void {
    this.phase = newPhase;
    console.log(`[FishingScene] Phase transition to: ${newPhase}`);

    switch (newPhase) {
      case 'idle':
        this.statusText?.setText('캐스팅 준비: [스페이스]를 길게 눌러 힘을 조절하세요.');
        this.powerBarBg?.setVisible(false);
        this.powerBar?.setVisible(false);
        this.tensionBarBg?.setVisible(false);
        this.tensionBar?.setVisible(false);
        this.dragText?.setVisible(false);
        this.focusWindow?.setBobberState('hidden');
        break;

      case 'aiming':
        this.statusText?.setText('파워 조절 중... 적정 게이지에서 [스페이스]를 떼세요!');
        this.castPower = 0.0;
        this.isPowerIncreasing = true;
        this.powerBarBg?.setVisible(true);
        this.powerBar?.setVisible(true);
        break;

      case 'casting':
        this.statusText?.setText('샤아아악! 채비 비행 중...');
        this.powerBarBg?.setVisible(false);
        this.powerBar?.setVisible(false);
        
        // 캐스팅 연산
        const env = EnvironmentStore.environment || {
          spotId: 'geoje_gujora_breakwater',
          locationName: '거제 구조라 방파제',
          tide: { tidePhase: 7, tidePhaseLabel: '7물', currentStrength: 0.8, highTideTimes: [], lowTideTimes: [], currentWaterLevelCm: 150, minutesToNextTide: 60, nextTideType: 'high' },
          weather: { temperatureC: 22, seaSurfaceTempC: 21, windSpeedMs: 4, windDirectionDeg: 180, windDirectionLabel: '남풍', waveHeightM: 0.4, visibilityKm: 15, isPrecipitating: false, precipitationMmPerHour: 0, weatherCondition: 'clear', measuredAt: new Date(), sunriseAt: new Date(), sunsetAt: new Date() },
          currentTime: new Date(),
          isNighttime: false,
          isSafeForFishing: true,
        };

        const castResult = calculateCast({
          rod: this.tackle.rod,
          reel: this.tackle.reel,
          mainLine: this.tackle.mainLine,
          sinkerG: 15,
          power: this.castPower,
          angleDeg: 45,
          weather: env.weather,
        });

        this.time.delayedCall(1500, () => {
          this.lineState.lineLengthOutM = castResult.distanceM;
          this.statusText?.setText(`채비 안착! 비행거리: ${castResult.distanceM.toFixed(1)}m`);
          this.transitionTo('in_water');
        });
        break;

      case 'in_water': {
        const speciesList = this.getCurrentPointSpecies();
        this.focusWindow?.setBobberState('floating', speciesList);
        this.statusText?.setText('찌 흘리는 중... 어신 반응 대기 중');
        this.startBiteChecker();
        break;
      }

      case 'bite_detected': {
        const speciesList = this.getCurrentPointSpecies();
        this.statusText?.setText('찌 흔들림 감지! 찌가 빨려 들어갈 때 [스페이스]로 챔질!');
        // 찌 움직임 연출 시작
        this.biteIndicator?.triggerBiteEffect('bobber_shake');
        this.focusWindow?.setBobberState('shaking', speciesList);

        // 조금 뒤 깊은 챔질 타이밍으로 전이
        this.time.delayedCall(2000, () => {
          if (this.phase === 'bite_detected') {
            this.transitionTo('setting_hook');
          }
        });
        break;
      }

      case 'setting_hook': {
        const speciesList = this.getCurrentPointSpecies();
        this.statusText?.setText('★★ 지금 챔질!! [스페이스]를 누르세요! ★★');
        this.biteIndicator?.triggerBiteEffect('bobber_pull');
        this.focusWindow?.setBobberState('sinking', speciesList);
        
        // 1초 내에 챔질 안 하면 놓침
        this.time.delayedCall(1000, () => {
          if (this.phase === 'setting_hook') {
            this.transitionTo('missed');
          }
        });
        break;
      }

      case 'fighting':
        this.statusText?.setText('히트! 파이팅 중! [방향키 위/아래]: 드랙 조절, [스페이스] 누르고 있기: 감기');
        this.tensionBarBg?.setVisible(true);
        this.tensionBar?.setVisible(true);
        this.dragText?.setVisible(true);
        this.focusWindow?.setBobberState('fighting');
        break;

      case 'caught':
        if (this.fishBeingFought) {
          const sizeInfo = generateFishSize(this.fishBeingFought, 0.8);
          this.fishLength = sizeInfo.lengthCm;
          this.fishWeight = sizeInfo.weightGram;
          
          this.statusText?.setText(`축하합니다! [${this.fishBeingFought.nameKo}] 획득! 크기: ${this.fishLength}cm / 무게: ${(this.fishWeight / 1000).toFixed(2)}kg`);
        }
        this.focusWindow?.setBobberState('hidden');
        this.showOutcomePopup('success');
        break;

      case 'line_break':
        this.statusText?.setText('뚝... 줄이 팅겼습니다! (채비 손실)');
        this.focusWindow?.setBobberState('hidden');
        this.showOutcomePopup('line_break');
        break;

      case 'missed':
        this.statusText?.setText('어류가 바늘을 뱉고 달아났습니다.');
        this.focusWindow?.setBobberState('hidden');
        this.showOutcomePopup('missed');
        break;
        
      default:
        break;
    }
  }

  private createPowerBarUI(): void {
    const { width, height } = this.scale;
    const barW = 300;
    const barH = 20;

    this.powerBarBg = this.add.rectangle(width / 2, height - 120, barW, barH, 0x1c2b3e).setOrigin(0.5);
    this.powerBar = this.add.rectangle(width / 2 - barW / 2, height - 120, 0, barH, 0x4af2a1).setOrigin(0, 0.5);
    
    this.powerBarBg.setVisible(false);
    this.powerBar.setVisible(false);
  }

  private updatePowerGauge(): void {
    const delta = 0.02;
    if (this.isPowerIncreasing) {
      this.castPower += delta;
      if (this.castPower >= 1.0) {
        this.castPower = 1.0;
        this.isPowerIncreasing = false;
      }
    } else {
      this.castPower -= delta;
      if (this.castPower <= 0.0) {
        this.castPower = 0.0;
        this.isPowerIncreasing = true;
      }
    }
    
    if (this.powerBar) {
      this.powerBar.width = 300 * this.castPower;
    }
  }

  private createTensionBarUI(): void {
    const { width, height } = this.scale;
    const barW = 400;
    const barH = 16;

    this.tensionBarBg = this.add.rectangle(width / 2, height - 140, barW, barH, 0x1c2b3e).setOrigin(0.5);
    this.tensionBar = this.add.rectangle(width / 2 - barW / 2, height - 140, 0, barH, 0xff3333).setOrigin(0, 0.5);
    
    this.dragText = this.add.text(width / 2, height - 110, `드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}%`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8f4fd',
    }).setOrigin(0.5);

    this.tensionBarBg.setVisible(false);
    this.tensionBar.setVisible(false);
    this.dragText.setVisible(false);
  }

  private startBiteChecker(): void {
    const env = EnvironmentStore.environment || {
      spotId: 'geoje_gujora_breakwater',
      locationName: '거제 구조라 방파제',
      tide: {
        tidePhase: 7,
        tidePhaseLabel: '7물',
        currentStrength: 0.8,
        highTideTimes: [],
        lowTideTimes: [],
        currentWaterLevelCm: 150,
        highTideHeightCm: 300,
        lowTideHeightCm: 30,
        minutesToNextTide: 60,
        nextTideType: 'high',
      },
      weather: { temperatureC: 22, seaSurfaceTempC: 21, windSpeedMs: 4, windDirectionDeg: 180, windDirectionLabel: '남풍', waveHeightM: 0.4, visibilityKm: 15, isPrecipitating: false, precipitationMmPerHour: 0, weatherCondition: 'clear', measuredAt: new Date(), sunriseAt: new Date(), sunsetAt: new Date() },
      currentTime: new Date(),
      isNighttime: false,
      isSafeForFishing: true,
    };

    const point = {
      id: 'point_default',
      tileX: 10,
      tileY: 10,
      label: '방파제 수중여',
      depthM: 8,
      possibleSpeciesIds: ['black_seabream', 'largescale_blackfish', 'black_rockfish'],
      biteBonusMultiplier: 1.2,
    };

    const calculation = calculateBiteChance(
      FISH_DATABASE,
      this.tackle,
      env,
      point
    );

    // 입질 타이머 구동
    this.biteCheckTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.phase !== 'in_water') return;

        // 초당 확률 체크
        if (Math.random() < calculation.biteChancePerSecond * 2) { // 시연을 위해 2배 보정
          this.fishBeingFought = pickFishByWeight(calculation.fishCandidates);
          if (this.fishBeingFought) {
            this.transitionTo('bite_detected');
            this.biteCheckTimer?.destroy();
          }
        }
      },
      loop: true,
    });
  }

  private updateFightingLoop(delta: number): void {
    if (!this.fishBeingFought) return;

    // 장력이 너무 임계점에 달하면 릴링 락업(잠김) 연출 적용
    const ableToReel = canReel(this.lineState, this.tackle.mainLine);

    // 감아들이기(Space) 상태 체크
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const isReeling = ableToReel && (spaceKey?.isDown || false);

    if (spaceKey?.isDown && !ableToReel) {
      this.statusText?.setText('⚠️ 장력 임계 초과! 릴이 잠겼습니다! 드랙을 푸세요 [G] 또는 [방향키 아래]');
    } else {
      this.statusText?.setText('히트! 파이팅 중! [F/G] 또는 [방향키 위/아래]: 드랙 조절, [스페이스]: 감기');
    }

    // 물고기의 반발력 연산 (어종 난이도와 체력에 비례)
    const basePull = this.fishBeingFought.difficulty * 2.2;
    // 물고기가 요동치는 주기성 dash
    const fishRage = 1.0 + Math.sin(Date.now() / 350) * 0.45 + (Math.random() < 0.08 ? 0.8 : 0.0);
    const fishPullKg = basePull * fishRage * this.fishStamina;

    // 코어 물리 틱 시뮬레이션
    const tickResult = simulateFightTick(
      this.lineState,
      fishPullKg,
      isReeling,
      this.tackle.reel,
      this.tackle.mainLine,
      delta
    );

    this.lineState = tickResult.newState;

    // 텐션 UI 렌더링
    const tensionRatio = tickResult.tensionRatio;
    if (this.tensionBar) {
      this.tensionBar.width = 400 * tensionRatio;
      
      // 위험 수준에 따라 게이지 색상 변경 및 진동/경고음
      if (tickResult.dangerLevel === 'broken') {
        this.tensionBar.setFillStyle(0xff0000);
      } else if (tickResult.dangerLevel === 'critical') {
        this.tensionBar.setFillStyle(0xff3333);
        if (Math.random() < 0.25) this.cameras.main.shake(100, 0.003);
      } else if (tickResult.dangerLevel === 'warning') {
        this.tensionBar.setFillStyle(0xffaa33);
      } else {
        this.tensionBar.setFillStyle(0x33ff33);
      }
    }

    // 드랙 감도 표시 업데이트
    const effectiveDrag = getEffectiveDragKg(this.tackle.reel, this.lineState.dragRatio);
    this.dragText?.setText(`드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}% (${effectiveDrag.toFixed(1)}kg)`);

    // 드랙 풀리는 시각/청각 피드백
    if (tickResult.lineOutDelta > 0) {
      this.statusText?.setText(` 지잉! 줄 풀려나가는 중: ${this.lineState.lineLengthOutM.toFixed(1)}m`);
      if (Math.random() < 0.3) {
        this.sound.play('reel_click', { volume: 0.15 });
      }
    }

    // 물고기 스태미나 감소
    this.fishStamina = Math.max(0, this.fishStamina - tickResult.fishFatigueDelta * 0.75);

    // 승리 조건: 물고기를 4m 이내로 감아들이거나 체력이 다 빠짐
    if (this.lineState.lineLengthOutM <= 4.0 || this.fishStamina <= 0.02) {
      this.transitionTo('caught');
    }

    // 패배 조건: 라인이 터짐
    if (this.lineState.isLineBroken) {
      this.transitionTo('line_break');
    }
  }

  private setupInput(): void {
    // 챔질 키
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.phase === 'idle') {
        this.transitionTo('aiming');
      } else if (this.phase === 'bite_detected') {
        this.transitionTo('missed');
      } else if (this.phase === 'setting_hook') {
        this.transitionTo('fighting');
      }
    });

    this.input.keyboard?.on('keyup-SPACE', () => {
      if (this.phase === 'aiming') {
        this.transitionTo('casting');
      }
    });

    const reel = this.tackle.reel;

    // 드랙 조절 (F / 위방향키: 조임)
    const onTighten = () => {
      if (this.phase === 'fighting') {
        const result = adjustDrag(this.lineState.dragRatio, 'tighten', reel);
        this.lineState.dragRatio = result.newDragRatio;
        this.dragText?.setText(`드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}% (${result.displayDragKg.toFixed(1)}kg)`);
        this.showDragFeedback(result.message);
      }
    };

    // 드랙 조절 (G / 아래방향키: 풂)
    const onLoosen = () => {
      if (this.phase === 'fighting') {
        const result = adjustDrag(this.lineState.dragRatio, 'loosen', reel);
        this.lineState.dragRatio = result.newDragRatio;
        this.dragText?.setText(`드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}% (${result.displayDragKg.toFixed(1)}kg)`);
        this.showDragFeedback(result.message);
      }
    };

    this.input.keyboard?.on('keydown-UP', onTighten);
    this.input.keyboard?.on('keydown-F', onTighten);
    this.input.keyboard?.on('keydown-DOWN', onLoosen);
    this.input.keyboard?.on('keydown-G', onLoosen);
  }

  private showOutcomePopup(outcome: 'success' | 'line_break' | 'missed'): void {
    const { width, height } = this.scale;
    const popup = this.add.container(width / 2, height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e1c2d, 0.95);
    bg.fillRoundedRect(-200, -100, 400, 200, 4);
    bg.lineStyle(2, 0x2a5a8a, 0.8);
    bg.strokeRoundedRect(-200, -100, 400, 200, 4);

    popup.add(bg);

    let titleText = '결과';
    let subtitleText = '아무 키나 누르면 필드로 복귀합니다.';

    if (outcome === 'success') {
      titleText = '히트 완료!';
      subtitleText = `획득: ${this.fishBeingFought?.nameKo}\n크기: ${this.fishLength}cm / ${(this.fishWeight/1000).toFixed(2)}kg`;
      
      // GameState에 조과 정보 저장
      if (this.fishBeingFought) {
        GameState.addCaughtFish(
          this.fishBeingFought.id,
          this.fishBeingFought.nameKo,
          this.fishLength,
          this.fishWeight
        );
        GameState.save();
      }
    } else if (outcome === 'line_break') {
      titleText = '채비 손실';
      subtitleText = '장력이 과도하여 원줄이 터졌습니다!';
    } else if (outcome === 'missed') {
      titleText = '방생';
      subtitleText = '어신 타이밍이 맞지 않았습니다.';
    }

    const title = this.add.text(0, -50, titleText, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '22px',
      color: outcome === 'success' ? '#4af2a1' : '#ff3333',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const desc = this.add.text(0, 10, subtitleText, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#a0b8c8',
      align: 'center',
    }).setOrigin(0.5);

    popup.add([title, desc]);

    // 아무 키나 누르면 필드로 귀환
    this.time.delayedCall(1500, () => {
      this.input.keyboard?.once('keydown', () => {
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop();
          this.scene.resume('FieldScene');
        });
      });
    });
  }

  private getCurrentPointSpecies(): FishSpecies[] {
    const pointIds = this.currentPoint?.possibleSpeciesIds || ['black_seabream', 'largescale_blackfish', 'black_rockfish'];
    return pointIds
      .map((id) => FISH_DATABASE.find((f) => f.id === id))
      .filter((f): f is FishSpecies => !!f);
  }

  private showDragFeedback(msg: string): void {
    const { width } = this.scale;
    const feedback = this.add.text(width / 2, this.scale.height - 80, msg, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ffff88',
      backgroundColor: '#000000dd',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    this.time.delayedCall(1200, () => feedback.destroy());
  }
}
