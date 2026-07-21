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
  canReel,
  FISH_DATABASE,
  // 파이트 2D (측면하중 + heading/displacement — 2026-07 개편)
  simulateFightTick2D,
  computeFishThrustKg,
  pickRunHeading,
  getMovementProfile,
  classifySizeTier,
  TIER_POWER_MUL,
  TIER_STAMINA_MUL,
  computeFeedingActivity,
  feedingRegionProfileOf,
  kstHour,
  calculateTideInfo,
} from '@tra/core';
import type {
  FishingPhase, TackleSetup, FishSpecies, LineState, FishingPoint,
  FightState2D, MovementProfile, SizeTier,
} from '@tra/core';
import { FishingFocusWindow } from '../ui/FishingFocusWindow.js';
import { BiteIndicator } from '../ui/BiteIndicator.js';
import { InventoryStore } from '../store/InventoryStore.js';

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

  // ── 파이트 2D (측면하중 + heading/displacement — 2026-07 개편) ──
  private fight2D: FightState2D | null = null;
  private moveProfile: MovementProfile | null = null;
  private fishTier: SizeTier = 'medium';
  /** 스태미나 소모 배율 (profile.staminaScale × tier 배율의 역수) */
  private staminaDrainMul = 1;
  /** ←/→ 스티어 폴링 키 */
  private steerLeftKey?: Phaser.Input.Keyboard.Key;
  private steerRightKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;

  // ── 루어 액션 그래머 (in_water 페이즈) ──
  /** 액션 매칭 입질 배율 (1로 자연 감쇠 — 유인 윈도우) */
  private lureActionMult = 1;
  /** 마지막 액션 입력 시각 (리듬 판정) */
  private lastActionAt = 0;
  /** 마지막 액션 종류 (호핑 콤보: fall → jerk) */
  private lastActionKind: 'dart' | 'jerk' | 'fall' | 'retrieve' | null = null;
  /** 피딩타임 활성도 (액션 페이오프 계수 — 씬 진입 시 1회 산출, 재사용) */
  private feedingActivity = 1;
  
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
      possibleSpeciesIds: ['black_seabream', 'largescale_blackfish', 'dark_banded_rockfish'],
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

    // 피딩타임 활성도 — 액션 페이오프 계수 (기존 계산기 재사용, 새 확률식 금지)
    const tideNow = calculateTideInfo();
    this.feedingActivity = computeFeedingActivity({
      hour: kstHour() + new Date().getMinutes() / 60,
      month: new Date().getMonth() + 1,
      tidePhase: tideNow.tidePhase,
      minutesToNextTide: tideNow.minutesToNextTide,
      nextTideType: tideNow.nextTideType,
      regionProfile: feedingRegionProfileOf(this.currentPoint?.id ?? ''),
    }).activity;

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

    // ── 루어 액션 유인 윈도우 (in_water) ──
    if (this.phase === 'in_water') {
      // 좌클릭 유지 = 리트리브 (600ms 주기로 등속 액션 판정)
      if (this.input.activePointer.leftButtonDown() && this.time.now - this.lastActionAt > 600) {
        this.applyLureAction('retrieve', 0);
      }
      // 유인 배율은 1로 자연 감쇠 (약 1.5초 윈도우)
      if (this.lureActionMult > 1) {
        this.lureActionMult = Math.max(1, this.lureActionMult - (delta / 1000) * 0.5);
      }
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
        this.statusText?.setText('찌 흘리는 중 — [←/→] 다트 · [↑] 저킹 · [↓] 폴링 · [좌클릭 유지] 리트리브');
        this.lureActionMult = 1;
        this.lastActionKind = null;
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

      case 'fighting': {
        this.statusText?.setText('히트! [←/→] 로드 스티어 · [↑/↓] 드랙 · [좌클릭 유지] 릴링');
        this.tensionBarBg?.setVisible(true);
        this.tensionBar?.setVisible(true);
        this.dragText?.setVisible(true);
        this.focusWindow?.setBobberState('fighting');

        // ── 파이트 2D 초기화: 크기/tier를 훅셋 시점에 확정 → 파이트 강도 스케일 ──
        if (this.fishBeingFought) {
          const sizeInfo = generateFishSize(this.fishBeingFought, 0.8);
          this.fishLength = sizeInfo.lengthCm;
          this.fishWeight = sizeInfo.weightGram;
          this.fishTier = classifySizeTier(
            this.fishBeingFought.id, this.fishLength, this.fishBeingFought.maxRecordCm,
          );
          this.moveProfile = getMovementProfile(this.fishBeingFought.id);
          this.staminaDrainMul = 1 / (this.moveProfile.staminaScale * TIER_STAMINA_MUL[this.fishTier]);

          // 초기 위치: 앵커(로드팁) 아래 수심 쪽, 좌우 랜덤 — heading은 프로필 성향으로
          const startX = (Math.random() * 2 - 1) * 50;
          const startY = 90 + Math.random() * 30;
          this.fight2D = {
            fishPos: { x: startX, y: startY },
            fishHeading: pickRunHeading(
              this.moveProfile, Math.atan2(startY, startX), Math.random(), Math.random(),
            ),
            rodLeanAngle: 0,
            line: this.lineState,
            runElapsedSec: 0,
          };
        }
        break;
      }

      case 'caught':
        if (this.fishBeingFought) {
          // 크기/무게는 파이팅 진입 시 이미 확정 (미확정 폴백만 보정)
          if (this.fishLength <= 0) {
            const sizeInfo = generateFishSize(this.fishBeingFought, 0.8);
            this.fishLength = sizeInfo.lengthCm;
            this.fishWeight = sizeInfo.weightGram;
          }
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
      possibleSpeciesIds: ['black_seabream', 'largescale_blackfish', 'dark_banded_rockfish'],
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

        // 초당 확률 체크 — 루어 액션 매칭 시 유인 배율(lureActionMult) 가산
        if (Math.random() < calculation.biteChancePerSecond * 2 * this.lureActionMult) { // 시연을 위해 2배 보정
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

  /**
   * 파이트 2D 루프 (2026-07 개편) — 측면하중 물리 + 십자 패드 조작.
   *  ←/→ = 로드 스티어 (러닝과 같이 눕히면 측면하중↓ = 버티기 /
   *  반대로 눌러 heading을 돌리면 제압 진행, 과하면 텐션 스파이크 → 락업)
   *  ↑/↓ = 드랙(기존 이벤트 유지) · 좌클릭 유지 = 릴링(감기 전용, 방향성 없음)
   */
  private updateFightingLoop(delta: number): void {
    if (!this.fishBeingFought || !this.fight2D || !this.moveProfile) return;
    const dt = delta / 1000;

    // ── 입력: 스티어(←/→) + 릴링(좌클릭 유지, 스페이스 보조) ──
    const steerDir: -1 | 0 | 1 =
      this.steerLeftKey?.isDown ? -1 : this.steerRightKey?.isDown ? 1 : 0;
    const ableToReel = canReel(this.lineState, this.tackle.mainLine);
    const reelHeld = this.input.activePointer.leftButtonDown() || (this.spaceKey?.isDown ?? false);
    const isReeling = ableToReel && reelHeld;

    if (reelHeld && !ableToReel) {
      this.statusText?.setText('장력 임계 초과! 릴이 잠겼습니다 — 드랙을 푸세요 [↓/G], 러닝 방향으로 [←/→] 눕히세요');
    } else {
      this.statusText?.setText('히트! [←/→] 로드 스티어 · [↑/↓] 드랙 · [좌클릭 유지] 릴링');
    }

    // ── 러닝 패턴: runDurationSec마다 프로필 성향으로 새 heading ──
    if (this.fight2D.runElapsedSec >= this.moveProfile.runDurationSec) {
      const lineAngle = Math.atan2(this.fight2D.fishPos.y, this.fight2D.fishPos.x);
      this.fight2D.fishHeading = pickRunHeading(this.moveProfile, lineAngle, Math.random(), Math.random());
      this.fight2D.runElapsedSec = 0;
    }

    // ── 순간 추진력 (버스트 dt 정규화 — 프레임레이트 독립) ──
    const thrust = computeFishThrustKg(
      this.fishBeingFought.difficulty,
      TIER_POWER_MUL[this.fishTier],
      this.fishStamina,
      this.moveProfile,
      Date.now(),
      dt,
      Math.random(),
    );

    // ── 코어 2D 물리 틱 (축방향 드랙/릴링 + 측면하중 + 머리 돌리기) ──
    this.fight2D.line = this.lineState;
    const res = simulateFightTick2D(
      this.fight2D,
      {
        fishThrustKg: thrust,
        steerDir,
        isReeling,
        profile: this.moveProfile,
        fishStamina: this.fishStamina,
        viewScalePxPerM: 6,   // FishingFocusWindow(반경 120px) 스케일 정합
      },
      this.tackle.reel,
      this.tackle.mainLine,
      delta,
    );
    this.fight2D = res.newState;
    this.lineState = res.newState.line;

    // ── 2D 무대 렌더 (줄색 그라데이션·깊이 알파·저스태미나 롤은 뷰가 담당) ──
    const fishSizePx = Phaser.Math.Clamp(14 + this.fishLength * 0.28, 16, 46);
    this.focusWindow?.updateFight2D(this.fight2D, res, delta, fishSizePx);

    // ── 텐션 UI (결합 장력 = 축 + 측면 — 기존 임계와 동일) ──
    const tensionRatio = res.combinedTensionRatio;
    if (this.tensionBar) {
      this.tensionBar.width = 400 * tensionRatio;
      if (res.dangerLevel === 'broken') {
        this.tensionBar.setFillStyle(0xff0000);
      } else if (res.dangerLevel === 'critical') {
        this.tensionBar.setFillStyle(0xff3333);
        if (Math.random() < 0.25) this.cameras.main.shake(100, 0.003);
      } else if (res.dangerLevel === 'warning') {
        this.tensionBar.setFillStyle(0xffaa33);
      } else {
        this.tensionBar.setFillStyle(0x33ff33);
      }
    }

    // 드랙 감도 표시 (측면하중 병기 — 스티어 피드백)
    const effectiveDrag = getEffectiveDragKg(this.tackle.reel, this.lineState.dragRatio);
    this.dragText?.setText(
      `드랙 ${(this.lineState.dragRatio * 100).toFixed(0)}% (${effectiveDrag.toFixed(1)}kg) · 측면하중 ${res.lateralLoadKg.toFixed(1)}kg${res.isRolling ? ' · 물고기가 떠올랐다!' : ''}`,
    );

    // 드랙 풀리는 피드백
    if (res.lineOutDelta > 0) {
      this.statusText?.setText(`지잉! 줄 풀려나가는 중: ${this.lineState.lineLengthOutM.toFixed(1)}m`);
      if (Math.random() < 0.3) {
        this.sound.play('reel_click', { volume: 0.15 });
      }
    }

    // ── 스태미나 (측면압 피로 포함 — profile.staminaScale × tier 역보정) ──
    this.fishStamina = Math.max(0, this.fishStamina - res.fishFatigueDelta * 0.75 * this.staminaDrainMul);

    // 승리: 4m 이내로 감아들이거나 탈진 / 패배: 줄 터짐
    if (this.lineState.lineLengthOutM <= 4.0 || this.fishStamina <= 0.02) {
      this.transitionTo('caught');
    }
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

    // 파이트 스티어(←/→) 폴링 키 + 릴링 보조(스페이스)
    this.steerLeftKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.steerRightKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 드랙 조절 (F / 위방향키: 조임) — in_water에서는 ↑ = 저킹
    const onTighten = () => {
      if (this.phase === 'fighting') {
        const result = adjustDrag(this.lineState.dragRatio, 'tighten', reel);
        this.lineState.dragRatio = result.newDragRatio;
        this.dragText?.setText(`드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}% (${result.displayDragKg.toFixed(1)}kg)`);
        this.showDragFeedback(result.message);
      }
    };

    // 드랙 조절 (G / 아래방향키: 풂) — in_water에서는 ↓ = 폴링 스테이
    const onLoosen = () => {
      if (this.phase === 'fighting') {
        const result = adjustDrag(this.lineState.dragRatio, 'loosen', reel);
        this.lineState.dragRatio = result.newDragRatio;
        this.dragText?.setText(`드랙 감도: ${(this.lineState.dragRatio * 100).toFixed(0)}% (${result.displayDragKg.toFixed(1)}kg)`);
        this.showDragFeedback(result.message);
      }
    };

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.phase === 'in_water') this.applyLureAction('jerk', 0);
      else onTighten();
    });
    this.input.keyboard?.on('keydown-F', onTighten);
    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.phase === 'in_water') this.applyLureAction('fall', 0);
      else onLoosen();
    });
    this.input.keyboard?.on('keydown-G', onLoosen);

    // 루어 액션: ←/→ 탭 = 다트(횡 트위칭) — 파이트에서는 폴링 스티어로만 사용
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.phase === 'in_water') this.applyLureAction('dart', -1);
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.phase === 'in_water') this.applyLureAction('dart', 1);
    });
  }

  // ═══════════════════════════════════════════════════
  // 루어 액션 그래머 (in_water 페이즈 — 다트/저킹/폴링/리트리브)
  // ═══════════════════════════════════════════════════
  /**
   * 액션 종류 × 장착 루어(actionFlags/kind) 매칭 배율.
   * 매칭 액션은 크게, 역효과 조합(스푼에 과한 다트 등)은 1 미만.
   */
  private lureActionBonus(kind: 'dart' | 'jerk' | 'fall' | 'retrieve'): number {
    const spec = InventoryStore.rigMode === 'lure' ? InventoryStore.getEquippedLureSpec() : undefined;
    if (!spec) return kind === 'retrieve' ? 1.1 : 1.15;   // 일반 채비 — 고패질 소폭
    const k = spec.kind;
    switch (kind) {
      case 'dart':
        // 소프트 저크/미노우/에기 = 다트 보너스 큼, 등속 계열은 역효과
        if (spec.actionFlags?.includes('dart')) return 1.7;
        return k === 'spoon' || k === 'spinner' || k === 'tairaba' ? 0.8 : 1.1;
      case 'jerk':
        // 메탈지그 = 수직 저킹 핵심 / 웜+지그헤드 = 호핑 상승부
        return k === 'metal_jig' ? 1.75 : k === 'worm_grub' ? 1.5 : 1.15;
      case 'fall':
        // 폴링 유인(스푼·에기·타이라바 fallLureWeight) — 가라앉는 순간이 무는 순간
        if ((spec.fallLureWeight ?? 0) > 0) return 1.6;
        return k === 'metal_jig' ? 1.5 : 1.1;
      case 'retrieve':
        // 스푼/스피너/타이라바 = 등속 리트리브가 정답
        return k === 'spoon' || k === 'spinner' || k === 'tairaba' ? 1.55 : 1.1;
    }
  }

  /**
   * 루어 액션 적용 — 리듬 보상(과속 연타 감소) + 호핑 콤보(fall→jerk) +
   * 피딩타임 페이오프 계수(기존 계산기 값 재사용). 결과는 lureActionMult에
   * 반영되어 입질 확률 롤에 곱해지고, 유인 윈도우 동안 자연 감쇠한다.
   */
  private applyLureAction(kind: 'dart' | 'jerk' | 'fall' | 'retrieve', dir: -1 | 0 | 1): void {
    const now = this.time.now;
    const sinceLast = now - this.lastActionAt;

    let bonus = this.lureActionBonus(kind);
    // 리듬 보상: 과속 연타(<250ms)는 유인력 감소 — 약은 액션 유도
    if (sinceLast < 250 && kind !== 'retrieve') bonus = Math.min(bonus, 1) * 0.6;
    // 호핑 콤보: 폴링(↓) 직후 살짝 들기(↑) — 웜+지그헤드 바닥 호핑
    const spec = InventoryStore.rigMode === 'lure' ? InventoryStore.getEquippedLureSpec() : undefined;
    if (kind === 'jerk' && this.lastActionKind === 'fall' && sinceLast < 700 && spec?.kind === 'worm_grub') {
      bonus = 1.8;
    }

    // 피딩타임 페이오프 — 골든타임엔 액션 효과↑ (0.6~1.3 클램프, 값 재사용)
    const payoff = 1 + (bonus - 1) * Phaser.Math.Clamp(this.feedingActivity, 0.6, 1.3);
    this.lureActionMult = Math.max(this.lureActionMult, payoff);

    this.lastActionAt = now;
    this.lastActionKind = kind;

    // 시각: 루어(찌) 임펄스 + 매칭 성공 시 그림자 유인 반응
    if (kind === 'dart') this.focusWindow?.nudgeBobber(dir * 14, -2);
    else if (kind === 'jerk') this.focusWindow?.nudgeBobber(0, -10);
    else if (kind === 'fall') this.focusWindow?.nudgeBobber(0, 8);
    if (payoff > 1.3) this.focusWindow?.pulseShadowAttraction();
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
    const pointIds = this.currentPoint?.possibleSpeciesIds || ['black_seabream', 'largescale_blackfish', 'dark_banded_rockfish'];
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
