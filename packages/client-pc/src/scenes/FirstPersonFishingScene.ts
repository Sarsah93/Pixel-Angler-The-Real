/**
 * @file FirstPersonFishingScene.ts
 * @description 1인칭 낚시 뷰 (2단계) — 의사 3D 레이어 + 수중 물리 통합
 *
 * RegionFieldScene에서 캐스팅 찌가 착수하면 pause + launch로 진입한다.
 * (착수 지점 수심 Z_max, 캐스팅 거리, 여 밭 시드, 지역을 브릿징)
 *
 * 레이어 구조 (Pseudo-3D):
 *  하늘/수평선 → 수면 경계·파도 → 수중 그라데이션/기포 → 해저(모래/여 밭)
 *  → 찌/라인/미끼 → 물고기 실루엣 → 낚싯대 뷰(우측) → UI(게이지/쿨러/버튼)
 *
 * 물리 파이프라인 (@tra/core):
 *  UnderwaterSinkPhysics(침강·드리프트) + LineTensionPhysics(H 뒷줄견제·정렬도 A)
 *  + ChumPhysics(밑밥 동조) + BiteProbabilityEngine(입질/밑걸림)
 *  → bite → FishSpawningOracle(어종 결정) → FightingPhase(텐션 파이팅)
 *
 * 조작: H = 뒷줄견제 · C/밑밥칸 클릭 = 밑밥 투척 · 좌클릭 유지 = (파이팅) 릴링
 *        SPACE = 다시 캐스팅(결과 후) · ESC/그만하기 = 필드 복귀 (stop + resume)
 */

import Phaser from 'phaser';
import {
  createUnderwaterRig, stepUnderwater, isHoldState,
  UnderwaterRigState, RigPhysicsParams, TideVector,
  LineTensionPhysics, ChumPhysics, BiteProbabilityEngine,
  spawnFish, SpawnedFish, FightingPhase, FightStatus,
  calculateTideInfo, getBaitAffinity, BaitKey, SpawnContext,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore, RigStepKey } from '../store/InventoryStore.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from '../ui/DraggablePanel.js';

export interface FirstPersonFishingInit {
  /** 착수 지점 바닥 수심 Z_max (m) */
  zMaxM: number;
  /** 캐스팅 실거리 (m) — 수면 거리 표시 */
  castDistanceM: number;
  /** 여 밭 배치 시드 (착수 타일 해시) */
  reefSeed: number;
  /** 지역 ID */
  region: string;
  /** 캐릭터가 서 있는 지면 종류 (지도 지형 기반 전경) */
  shoreKind?: 'sand' | 'grass' | 'gravel';
}

type FpState = 'drift' | 'fighting' | 'result';

// ── 화면 상수 ──────────────────────────────────────
const WATERLINE = 268;
const PX_PER_M_X = 24;

/** 어종 → 실사 픽셀 생선 이미지 텍스처 (어획 팝업/아이템 상세 표시용) */
const FISH_TEXTURE: Record<string, string> = {
  black_seabream: 'fish_black_sea_bream',
  flatfish: 'fish_halibut',
};

export class FirstPersonFishingScene extends Phaser.Scene {
  private cfg!: FirstPersonFishingInit;
  private fpState: FpState = 'drift';

  // 물리 모듈
  private rig!: UnderwaterRigState;
  private rigParams!: RigPhysicsParams;
  private lineTension!: LineTensionPhysics;
  private chum!: ChumPhysics;
  private biteEngine!: BiteProbabilityEngine;
  private fight: FightingPhase | null = null;
  private hookedFish: SpawnedFish | null = null;

  private zLimitM = 5;
  private pxPerMZ = 30;
  private tideBase = 0.3;
  private viewCenterX = 0;

  // 입력
  private hKey!: Phaser.Input.Keyboard.Key;
  private reeling = false;

  // 렌더 오브젝트
  private waveG!: Phaser.GameObjects.Graphics;
  private dynamicG!: Phaser.GameObjects.Graphics;   // 라인/미끼/찌 연결 등 매 프레임
  private rodG!: Phaser.GameObjects.Graphics;
  private floatObj!: Phaser.GameObjects.Container;
  private fishShadow?: Phaser.GameObjects.Ellipse;
  private chumSprites: { obj: Phaser.GameObjects.Arc; born: number }[] = [];

  // UI
  private uiG!: Phaser.GameObjects.Graphics;
  private probText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private patternText!: Phaser.GameObjects.Text;
  private depthValsText!: Phaser.GameObjects.Text;
  private coolerCatchText!: Phaser.GameObjects.Text;
  private coolerChumText!: Phaser.GameObjects.Text;
  private resultContainer?: Phaser.GameObjects.Container;

  /** 이번 세션 어획 목록 */
  private sessionCatch: string[] = [];

  constructor() {
    super({ key: 'FirstPersonFishingScene' });
  }

  init(data: FirstPersonFishingInit): void {
    this.cfg = data;
    this.fpState = 'drift';
    this.fight = null;
    this.hookedFish = null;
    this.reeling = false;
    this.viewCenterX = 0;
    this.sessionCatch = [];
    this.chumSprites = [];
    this.resultContainer = undefined;
    this.fishShadow = undefined;
  }

  create(): void {
    const zMax = this.cfg.zMaxM;
    this.pxPerMZ = Math.min(46, (GAME_HEIGHT - WATERLINE - 110) / Math.max(2, zMax));
    this.zLimitM = InventoryStore.rigDepthLimitM;

    // 물때 기반 조류 속력
    const tide = calculateTideInfo();
    this.tideBase = 0.12 + tide.currentStrength * 0.5;

    // 물리 초기화
    this.rig = createUnderwaterRig(0);
    this.rigParams = this.computeRigParams();
    this.lineTension = new LineTensionPhysics();
    this.chum = new ChumPhysics();
    this.biteEngine = new BiteProbabilityEngine();

    this.buildBackdrop();
    this.buildFloat();
    this.dynamicG = this.add.graphics().setDepth(30);
    this.rodG = this.add.graphics().setDepth(60);
    this.buildUi();

    // 입력
    this.hKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.input.keyboard!.on('keydown-C', () => this.tossChum());
    this.input.keyboard!.on('keydown-ESC', () => this.exitToField());
    this.input.keyboard!.on('keydown-SPACE', () => { if (this.fpState === 'result') this.recast(); });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.leftButtonDown()) this.reeling = true; });
    this.input.on('pointerup', () => { this.reeling = false; });

    this.cameras.main.fadeIn(320, 2, 12, 24);
  }

  /** 채비 조립(UtilizationPanel과 동일 기준)으로 침강 파라미터 산출 */
  private computeRigParams(): RigPhysicsParams {
    let weightG = 1.5;   // 바늘+미끼 기본
    let buoyG = 0;
    const rig = InventoryStore.rig;
    (Object.keys(rig) as (keyof typeof rig)[]).forEach((k) => {
      const id = rig[k];
      if (!id) return;
      const item = InventoryStore.find(id);
      if (!item) return;
      if (item.name.includes('봉돌')) weightG += 3.2;
      else if (item.name.includes('수중찌')) weightG += 8;
      else if (item.name.includes('구멍찌')) buoyG += 8;
    });
    return { tackleWeightG: weightG + 8, floatBuoyancyG: buoyG * 0.55 };
  }

  /** 채비 완성도 A_tackle (조립 소켓 채움 비율) — 파이팅 탈출 억제 */
  private computeTackleA(): number {
    const rig = InventoryStore.rig;
    const keys = Object.keys(rig) as (keyof typeof rig)[];
    const filled = keys.filter((k) => rig[k] !== null).length;
    return 0.35 + (filled / keys.length) * 0.55;
  }

  // ═══════════════════════════════════════════════════
  // 배경 레이어 (하늘/수면/수중/해저)
  // ═══════════════════════════════════════════════════
  private buildBackdrop(): void {
    const g = this.add.graphics().setDepth(0);

    // 하늘 그라데이션 (기상 반영은 추후 — 현재 맑은 톤)
    const skyBands = [0x8fc4e8, 0x9ecfee, 0xb2dcf4, 0xc8e8fa];
    skyBands.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(0, (WATERLINE / 4) * i, GAME_WIDTH, WATERLINE / 4 + 1);
    });
    // 수평선 원경 (먼 산/방파제 실루엣)
    g.fillStyle(0x6f93ad, 0.55);
    g.fillRect(0, WATERLINE - 26, GAME_WIDTH, 26);

    // 수중 그라데이션 (깊어질수록 어둡게)
    const depthPx = GAME_HEIGHT - WATERLINE;
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const r = Math.floor(0x2e * (1 - t) + 0x07 * t);
      const gg = Math.floor(0x6e * (1 - t) + 0x1c * t);
      const b = Math.floor(0x94 * (1 - t) + 0x33 * t);
      g.fillStyle((r << 16) | (gg << 8) | b, 1);
      g.fillRect(0, WATERLINE + (depthPx / bands) * i, GAME_WIDTH, depthPx / bands + 1);
    }

    // 파도 라인 렌더러 (매 프레임 갱신)
    this.waveG = this.add.graphics().setDepth(20);

    // 기포 파티클 (단순 원 상승 트윈 반복)
    for (let i = 0; i < 10; i++) {
      const bx = 80 + Math.random() * (GAME_WIDTH - 160);
      const by = WATERLINE + 60 + Math.random() * (depthPx - 120);
      const bubble = this.add.circle(bx, by, 1.5 + Math.random() * 2, 0xcfeaff, 0.25).setDepth(21);
      this.tweens.add({
        targets: bubble, y: WATERLINE + 8, alpha: 0,
        duration: 5000 + Math.random() * 6000, repeat: -1, delay: Math.random() * 4000,
        onRepeat: () => { bubble.setPosition(80 + Math.random() * (GAME_WIDTH - 160), by); bubble.setAlpha(0.25); },
      });
    }

    // ── 전경: 캐릭터가 서 있는 육지 지형 (지도 기반 — 해저 지형은 표시하지 않음) ──
    this.drawShoreForeground();
  }

  /** 화면 최하단 육지 전경 (모래/잔디/자갈 — 캐스팅한 지점의 지형) */
  private drawShoreForeground(): void {
    const kind = this.cfg.shoreKind ?? 'gravel';
    const h = 64;
    const y0 = GAME_HEIGHT - h;
    const g = this.add.graphics().setDepth(55);

    const palette: Record<string, { base: number; dark: number; speck: number }> = {
      sand:   { base: 0xd9c99b, dark: 0xc4b285, speck: 0xf0e4bf },
      grass:  { base: 0x6f9a4c, dark: 0x5d8340, speck: 0x8ab364 },
      gravel: { base: 0x8b8577, dark: 0x736e60, speck: 0xa8a292 },
    };
    const p = palette[kind];

    // 물가 경계 (젖은 띠)
    g.fillStyle(p.dark, 1);
    g.fillRect(0, y0 - 6, GAME_WIDTH, 6);
    // 본체
    g.fillStyle(p.base, 1);
    g.fillRect(0, y0, GAME_WIDTH, h);
    // 도트 질감 (자갈 알갱이/모래 반점/풀잎)
    for (let i = 0; i < 140; i++) {
      const sx = Math.random() * GAME_WIDTH;
      const sy = y0 + 4 + Math.random() * (h - 8);
      if (kind === 'gravel') {
        g.fillStyle(Math.random() < 0.5 ? p.dark : p.speck, 1);
        g.fillEllipse(sx, sy, 5 + Math.random() * 6, 3 + Math.random() * 4);
      } else if (kind === 'grass') {
        g.fillStyle(p.speck, 0.9);
        g.fillRect(sx, sy, 2, 4 + Math.random() * 3);
      } else {
        g.fillStyle(Math.random() < 0.5 ? p.dark : p.speck, 0.8);
        g.fillRect(sx, sy, 2, 2);
      }
    }
  }

  private buildFloat(): void {
    // 찌 (구멍찌 스타일 — 주황 상단 + 흰 몸통)
    this.floatObj = this.add.container(GAME_WIDTH / 2, WATERLINE).setDepth(35);
    const top = this.add.ellipse(0, -7, 10, 12, 0xff6a2a);
    const body = this.add.ellipse(0, 2, 8, 10, 0xfff4e0);
    const stem = this.add.rectangle(0, -14, 2, 8, 0x222222);
    this.floatObj.add([stem, top, body]);
  }

  // ═══════════════════════════════════════════════════
  // UI (게이지/쿨러/버튼)
  // ═══════════════════════════════════════════════════
  private buildUi(): void {
    this.uiG = this.add.graphics().setDepth(80);

    this.stateText = this.add.text(GAME_WIDTH / 2, 16, '채비 흘리는 중 — H 뒷줄견제 · C 밑밥', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 12, y: 5 },
    }).setOrigin(0.5, 0).setDepth(90);

    this.patternText = this.add.text(GAME_WIDTH / 2, 120, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#ff6a5a', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(90).setVisible(false);

    this.probText = this.add.text(20, 96, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4', lineSpacing: 5,
      backgroundColor: '#0a162899', padding: { x: 8, y: 6 },
    }).setDepth(90);

    // 수면 거리 (우측 상단 수심 패널 위 척도 지표)
    this.add.text(GAME_WIDTH - 18, 38,
      `수면 거리 ${this.cfg.castDistanceM.toFixed(0)}m`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#eaf6ff', fontStyle: 'bold',
        backgroundColor: '#0a162899', padding: { x: 8, y: 4 },
      }).setOrigin(1, 1).setDepth(90);

    // 수심 패널 제목 + 실시간 수치 (패널 본체는 renderDepthPanel에서 그림)
    this.add.text(GAME_WIDTH - 168 + 75, 56, '수심 정보', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7fb8d8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(91);
    this.depthValsText = this.add.text(GAME_WIDTH - 168 + 52, 84, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#d0e8f5', lineSpacing: 8,
    }).setDepth(91);

    // ── 쿨러 (중앙 하단 — 어획 보관함 / 밑밥 보관함 2분할) ──
    this.buildCooler();

    // ── 그만하기 버튼 (우측 하단) ──
    const exitBtn = this.add.container(GAME_WIDTH - 92, GAME_HEIGHT - 44).setDepth(95);
    const ebg = this.add.graphics();
    ebg.fillStyle(0x3a2020, 0.95);
    ebg.fillRoundedRect(-72, -20, 144, 40, 6);
    ebg.lineStyle(2, 0x8a4a4a, 1);
    ebg.strokeRoundedRect(-72, -20, 144, 40, 6);
    const etxt = this.add.text(0, 0, '그만하기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffb0a0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const ehit = this.add.rectangle(0, 0, 144, 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    ehit.on('pointerover', () => etxt.setColor('#ffffff'));
    ehit.on('pointerout', () => etxt.setColor('#ffb0a0'));
    ehit.on('pointerdown', () => this.exitToField());
    exitBtn.add([ebg, etxt, ehit]);
    applyScreenFixed(exitBtn);
  }

  /** 낚시용 쿨러 — 좌: 어획 보관 / 우: 밑밥 운용 */
  private buildCooler(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT - 58;
    const cooler = this.add.container(cx, cy).setDepth(92);

    const g = this.add.graphics();
    // 몸통
    g.fillStyle(0x2664a0, 1);
    g.fillRoundedRect(-110, -34, 220, 62, 8);
    // 뚜껑
    g.fillStyle(0x3a7cc0, 1);
    g.fillRoundedRect(-114, -44, 228, 18, 6);
    g.lineStyle(2, 0x143a5e, 1);
    g.strokeRoundedRect(-110, -34, 220, 62, 8);
    g.strokeRoundedRect(-114, -44, 228, 18, 6);
    // 중앙 분리선 (2분할)
    g.lineStyle(2, 0x143a5e, 0.9);
    g.lineBetween(0, -26, 0, 24);
    // 손잡이
    g.lineStyle(3, 0x143a5e, 1);
    g.strokeRoundedRect(-24, -52, 48, 10, 4);
    cooler.add(g);

    const catchLbl = this.add.text(-55, -22, '어획 보관', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.coolerCatchText = this.add.text(-55, 2, '0마리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);

    const chumLbl = this.add.text(55, -22, '밑밥 (C)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.coolerChumText = this.add.text(55, 2, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    cooler.add([catchLbl, this.coolerCatchText, chumLbl, this.coolerChumText]);

    // 상호작용: 좌측 = 어획 목록 / 우측 = 밑밥 투척
    const catchHit = this.add.rectangle(-55, -6, 106, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    catchHit.on('pointerdown', () => this.showCatchList());
    const chumHit = this.add.rectangle(55, -6, 106, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    chumHit.on('pointerdown', () => this.tossChum());
    cooler.add([catchHit, chumHit]);

    applyScreenFixed(cooler);
    this.refreshCoolerUi();
  }

  private refreshCoolerUi(): void {
    this.coolerCatchText?.setText(`${this.sessionCatch.length}마리`);
    const chumItem = InventoryStore.find('inv_chum');
    this.coolerChumText?.setText(chumItem ? `x${chumItem.qty}` : '없음');
  }

  private showCatchList(): void {
    const msg = this.sessionCatch.length > 0
      ? `이번 출조 어획:\n${this.sessionCatch.join('\n')}`
      : '아직 잡은 물고기가 없습니다.';
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#e8f4fd', align: 'center', lineSpacing: 5,
      backgroundColor: '#0a1628ee', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(120);
    this.time.delayedCall(2600, () => t.destroy());
  }

  // ═══════════════════════════════════════════════════
  // 밑밥 투척 (Phase 1)
  // ═══════════════════════════════════════════════════
  private tossChum(): void {
    if (this.fpState === 'fighting') return;
    if (!InventoryStore.removeQty('inv_chum', 1)) {
      this.flashState('집어제가 없습니다 — 마트/편의점에서 구매하세요');
      return;
    }
    // 찌 부근 수면에 착수 (±1.2m 랜덤)
    const x = this.rig.floatX + (Math.random() - 0.5) * 2.4;
    this.chum.toss(x, 0);
    this.refreshCoolerUi();

    // 정면 뷰 모션: 수면 착수 스프라이트 → 조류 방향으로 흘러가며 페이드아웃
    const sx = this.screenX(x);
    const chumObj = this.add.circle(sx, WATERLINE + 3, 5, 0x9a7b4f, 0.95).setDepth(34);
    this.chumSprites.push({ obj: chumObj, born: this.time.now });
    // 착수 파문
    const rip = this.add.circle(sx, WATERLINE + 2, 4, 0x000000, 0).setStrokeStyle(1.5, 0xeaf6ff, 0.8).setDepth(34);
    this.tweens.add({ targets: rip, scale: 3, alpha: 0, duration: 700, onComplete: () => rip.destroy() });

    this.flashState('밑밥 투척! 동조율을 확인하세요');
  }

  // ═══════════════════════════════════════════════════
  // 좌표 변환
  // ═══════════════════════════════════════════════════
  private screenX(worldX: number): number {
    return GAME_WIDTH / 2 + (worldX - this.viewCenterX) * PX_PER_M_X;
  }

  private depthY(z: number): number {
    return WATERLINE + z * this.pxPerMZ;
  }

  /** 여 밭(Reef Zone) 판정 — 착수 시드 기반 결정적 배치 (5m 셀 단위 30%) */
  private isReefAt(worldX: number): boolean {
    const cell = Math.floor((worldX + 1000) / 5);
    const h = ((cell * 2654435761) ^ this.cfg.reefSeed) >>> 0;
    return h % 10 < 3;
  }

  // ═══════════════════════════════════════════════════
  // 메인 업데이트 루프
  // ═══════════════════════════════════════════════════
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);

    // 조류 벡터 (기본 우향 + 완만한 요동)
    const tideSpeed = this.tideBase * (0.8 + 0.2 * Math.sin(this.time.now / 6000));
    const tide: TideVector = { x: tideSpeed, y: 0 };

    if (this.fpState === 'drift') this.updateDrift(dt, tide);
    else if (this.fpState === 'fighting') this.updateFighting(dt);

    // 뷰 중심을 찌 쪽으로 서서히 추적
    this.viewCenterX += (this.rig.floatX - this.viewCenterX) * Math.min(1, dt * 1.2);

    this.chum.update(dt, tide, this.cfg.zMaxM);
    this.updateChumSprites(tide);
    this.renderWater(dt);
    this.renderRigVisuals();
    this.renderRod();
  }

  // ── 흘림(드리프트) 상태 ──────────────────────────────
  private updateDrift(dt: number, tide: TideVector): void {
    const holding = this.hKey.isDown;
    const tideSpeed = Math.hypot(tide.x, tide.y);

    const lt = this.lineTension.update({
      dtSec: dt, holding, tideSpeed, baitSettled: this.rig.settled,
    });

    // 리액션 리프트: 밑걸림 타이머 초기화 + 1.5초 액션 가중치
    if (lt.reactionLiftTriggered) {
      this.biteEngine.triggerReactionLift();
      this.flashState('뒷줄견제! 미끼가 떠오릅니다 (리액션 찬스)');
    }

    stepUnderwater(this.rig, {
      dtSec: dt, tide, params: this.rigParams,
      zLimitM: this.zLimitM, zMaxM: this.cfg.zMaxM,
      driftBrake: lt.driftBrake, baitLiftMps: lt.baitLiftMps,
    });

    const hold = isHoldState(this.rig);
    const nearBottom = this.rig.baitZ >= Math.min(this.zLimitM, this.cfg.zMaxM) - 1.2;
    const inReef = nearBottom && this.isReefAt(this.rig.baitX);
    const sync = this.chum.getChumSyncRate({ x: this.rig.baitX, y: 0, z: this.rig.baitZ });

    // 미끼 종류 × 어종 선호도 친화도 (오라클 연동)
    const baitAffinity = getBaitAffinity(this.buildSpawnCtx(inReef));
    // 바다낚시지수 API 캐시 → P_base 보정 (지수 1~5 → 0.7~1.4배)
    const indexModifier = ExternalDataStore.getFishingIndexModifier();

    const tick = this.biteEngine.update({
      dtSec: dt,
      baseProbPerSec: 0.035 * baitAffinity * indexModifier,
      inReefZone: inReef,
      isHold: hold,
      alignmentIndex: this.lineTension.alignmentIndex,
      isHoldingLine: holding,
      chumSyncRate: sync,
    });

    // ── UI 게이지 갱신 ──
    this.renderGauges(tick.probPerSec, sync, inReef, hold, tick.snagProgress, tick.actionTimeLeft);

    if (tick.event === 'snagged') {
      this.onSnagged();
    } else if (tick.event === 'bite') {
      this.onBite();
    }
  }

  /** 현재 채비 미끼 → BaitKey 매핑 */
  private currentBaitKey(): BaitKey {
    const id = InventoryStore.rig.hookBait;
    const item = id ? InventoryStore.find(id) : undefined;
    if (!item) return 'krill';
    const n = item.name;
    if (n.includes('혼무시')) return 'worm_king';
    if (n.includes('지렁이')) return 'worm_blue';
    if (n.includes('크릴')) return 'krill';
    if (n.includes('생선') || n.includes('오징어')) return 'fishcut';
    if (n.includes('옥수수')) return 'corn';
    if (n.includes('게') || n.includes('소라')) return 'crab';
    if (n.includes('성게')) return 'urchin';
    if (n.includes('조개') || n.includes('개불')) return 'shellfish';
    if (item.subCategory === '바늘/훅') return 'lure';
    return 'krill';
  }

  /** 오라클 스폰/친화도 컨텍스트 구성 */
  private buildSpawnCtx(inReef: boolean): SpawnContext {
    const hour = new Date().getHours();
    return {
      depthZ: this.rig.baitZ,
      zMax: this.cfg.zMaxM,
      region: this.cfg.region,
      tidePhase: calculateTideInfo().tidePhase,
      month: new Date().getMonth() + 1,
      baitKey: this.currentBaitKey(),
      inReef,
      isNight: hour >= 20 || hour < 5,
      // KOSIS 시도별 어획량 캐시 → 지역 어종 스폰 가중치
      catchWeightBySpecies: ExternalDataStore.getCatchWeights(this.cfg.region),
    };
  }

  /** 밑걸림 발생 — 찌 아래 채비 전체 손실 + 즉시 필드 복귀 */
  private onSnagged(): void {
    const lost = InventoryStore.loseRigParts(['float', 'swivel', 'leader', 'sinker', 'hookBait'] as RigStepKey[]);
    this.failAndExit('밑걸림! 채비를 통째로 잃었습니다',
      `여 밭에 채비가 파묻혀 원줄을 끊었습니다.\n손실: ${lost.length > 0 ? lost.join(', ') : '없음'}\n\n뒷줄견제(H)로 미끼를 띄우면 밑걸림을 예방할 수 있습니다.`);
  }

  /** 입질 성공 → 'Biting' 이벤트 (찌 빨림) → 파이팅 돌입 */
  private onBite(): void {
    this.fpState = 'fighting';
    this.events.emit('Biting');

    // 물때/수심/지역/미끼 기반 어종 결정 (Phase 3 오라클)
    const nearBottom = this.rig.baitZ >= Math.min(this.zLimitM, this.cfg.zMaxM) - 1.2;
    this.hookedFish = spawnFish(this.buildSpawnCtx(nearBottom && this.isReefAt(this.rig.baitX)));

    // 입질 순간 미끼 1개 소모 (수량이 남으면 자동 재장착, 소진 시 소켓 비움)
    InventoryStore.consumeRigItem('hookBait');
    this.refreshCoolerUi();

    // 어종별 파이팅 프로필 적용 (여박기/횡이동/바늘털이 가중치, 입 강도)
    this.fight = new FightingPhase({
      powerFactor: this.hookedFish.powerFactor,
      tackleA: this.computeTackleA(),
      patternWeights: this.hookedFish.fight.patternWeights,
      intervalMult: this.hookedFish.fight.intervalMult,
      mouthFragility: this.hookedFish.fight.mouthFragility,
    });

    // 물고기 실루엣 접근 연출 (원근: scale/alpha 증가)
    const bx = this.screenX(this.rig.baitX);
    const by = this.depthY(this.rig.baitZ);
    this.fishShadow = this.add.ellipse(bx + 220, WATERLINE + 60, 46, 14, 0x0a1a28, 0.0).setDepth(32);
    this.fishShadow.setScale(0.35);
    this.tweens.add({
      targets: this.fishShadow, x: bx, y: by, scale: 1, alpha: 0.75, duration: 620, ease: 'Quad.easeIn',
    });

    // 찌가 물속으로 강하게 빨려 들어가는 연출
    this.tweens.add({ targets: this.floatObj, y: WATERLINE + 30, duration: 300, ease: 'Quad.easeIn', yoyo: true, repeat: 2 });
    this.cameras.main.shake(180, 0.004);

    this.stateText.setText('입질! 좌클릭 유지 = 릴링 · H = 버티기 — 텐션을 30~80으로 유지!');
  }

  // ── 파이팅 상태 ──────────────────────────────────────
  private updateFighting(dt: number): void {
    if (!this.fight || !this.hookedFish) return;
    const st = this.fight.update({ dtSec: dt, holding: this.hKey.isDown, reeling: this.reeling });

    this.renderFightUi(st);

    // 패턴 경고
    if (st.pattern === 'jump') {
      this.patternText.setText('바늘털이! 릴링 멈추고 H를 떼세요!').setVisible(true);
    } else if (st.pattern === 'dive') {
      this.patternText.setText('여 박기! H를 꾹 눌러 버티세요!').setVisible(true);
    } else if (st.pattern === 'lateral') {
      this.patternText.setText('횡으로 쏩니다! H를 떼고 드랙으로 버티세요!').setVisible(true);
    } else {
      this.patternText.setVisible(false);
    }

    // 물고기 실루엣 요동
    if (this.fishShadow) {
      const bx = this.screenX(this.rig.baitX);
      const wob = Math.sin(this.time.now / 90) * (6 + this.hookedFish.powerFactor * 10);
      const zTarget = st.pattern === 'jump' ? WATERLINE + 6 : this.depthY(Math.min(this.cfg.zMaxM, this.rig.baitZ + (st.pattern === 'dive' ? 1.5 : 0)));
      this.fishShadow.setPosition(bx + wob, zTarget + Math.abs(wob) * 0.4);
    }

    if (st.event !== 'none') {
      this.patternText.setVisible(false);
      switch (st.event) {
        case 'landed': this.onLanded(); break;
        case 'line_break': {
          // 목줄 터짐 — 30% 확률로 찌까지 함께 손실
          const floatToo = Math.random() < 0.3;
          const parts: RigStepKey[] = floatToo
            ? ['float', 'swivel', 'leader', 'sinker', 'hookBait']
            : ['leader', 'sinker', 'hookBait'];
          const lost = InventoryStore.loseRigParts(parts);
          this.failAndExit(floatToo ? '줄터짐! 찌까지 터졌습니다' : '줄터짐! 목줄이 터졌습니다',
            `텐션이 한계를 넘어 ${floatToo ? '찌 위에서' : '목줄이'} 터졌습니다.\n손실: ${lost.join(', ')}\n\nU 채비하기에서 재장착 후 다시 캐스팅하세요.`);
          break;
        }
        case 'hook_off': {
          // 미끼 털림 / 복어류는 목줄째 절단
          if (this.hookedFish?.lineCutter) {
            const lost = InventoryStore.loseRigParts(['leader', 'sinker', 'hookBait'] as RigStepKey[]);
            this.failAndExit('복어가 목줄을 끊었습니다!',
              `날카로운 이빨에 목줄째 잘려나갔습니다.\n손실: ${lost.join(', ')}`);
          } else {
            const lost = InventoryStore.loseRigParts(['hookBait'] as RigStepKey[]);
            this.failAndExit('미끼가 털렸습니다',
              `바늘이 빠지며 미끼를 잃었습니다.${lost.length ? `\n손실: ${lost.join(', ')}` : ''}\n\n미끼를 다시 달고 캐스팅하세요.`);
          }
          break;
        }
        case 'escaped': {
          const lost = InventoryStore.loseRigParts(['hookBait'] as RigStepKey[]);
          this.failAndExit('놓쳤다! 미끼가 털렸습니다',
            `물고기가 탈출하며 미끼를 채갔습니다.${lost.length ? `\n손실: ${lost.join(', ')}` : ''}\n패턴(바늘털이/여 박기/횡이동)에 맞게 대응하세요.`);
          break;
        }
      }
    }
  }

  /**
   * 낚시 실패 — 채비 손실 안내 후 즉시 1인칭 모드 해제 (필드 복귀).
   * 재캐스팅은 U 채비하기에서 손실 부품 재장착 후 가능.
   */
  private failAndExit(title: string, body: string): void {
    this.fpState = 'result';
    this.fight = null;
    this.fishShadow?.destroy();
    this.fishShadow = undefined;
    this.floatObj.setY(WATERLINE);
    this.patternText.setVisible(false);
    this.uiG.clear();

    this.stateText.setText(title);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `${title}\n\n${body}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffce9a', fontStyle: 'bold',
      align: 'center', lineSpacing: 6,
      backgroundColor: '#0a1628ee', padding: { x: 22, y: 16 },
    }).setOrigin(0.5).setDepth(120);

    this.registry.set('fp_exit_msg', title);
    this.time.delayedCall(2000, () => this.exitToField());
  }

  /** 랜딩 성공 — 오라클 결과 반영 */
  private onLanded(): void {
    const f = this.hookedFish!;
    const protectedFish = f.isUndersized || f.isClosedSeason;
    const sexLabel = f.sex === 'M' ? '수컷' : '암컷';
    const fishTexture = FISH_TEXTURE[f.speciesId];

    if (protectedFish) {
      const reason = f.isClosedSeason ? '금어기' : `금지체장 미만`;
      this.finishFight(`${f.nameKo} ${f.lengthCm}cm — 방생`,
        `${f.nameKo} ${f.lengthCm}cm / ${(f.weightG / 1000).toFixed(2)}kg / ${sexLabel}\n\n${reason} 개체입니다. 규정에 따라 방생합니다.`, '#9fd0e4', fishTexture);
    } else {
      // 쿨러(어획 보관함) + 인벤토리(음식 탭) 반영 — 어종 이미지가 있으면 아이콘으로 사용
      this.sessionCatch.push(`${f.nameKo} ${f.lengthCm}cm (${sexLabel})`);
      InventoryStore.addItem({
        id: `inv_catch_${f.speciesId}`,
        name: `${f.nameKo} (${f.lengthCm}cm)`,
        icon: '🐟', iconTexture: fishTexture,
        category: 'food', subCategory: '어획물',
        basePrice: Math.max(2000, Math.round(f.weightG * 12)),
        condition: 'live', equippable: false,
      }, 1);
      GameState.addCaughtFish(f.speciesId, f.nameKo, f.lengthCm, f.weightG);
      this.refreshCoolerUi();
      this.finishFight(`${f.nameKo} ${f.lengthCm}cm 낚음!`,
        `${f.nameKo} ${f.lengthCm}cm / ${(f.weightG / 1000).toFixed(2)}kg / ${sexLabel}\n\n쿨러 어획 보관함에 넣었습니다.`, '#4af2a1', fishTexture);
    }
  }

  private finishFight(title: string, body: string, color: string, fishTexture?: string): void {
    this.fpState = 'result';
    this.fight = null;
    this.fishShadow?.destroy();
    this.fishShadow = undefined;
    this.floatObj.setY(WATERLINE);
    this.showResultPanel(title, body, color, fishTexture);
  }

  /** 결과 패널 (다시 캐스팅 / 그만하기) — 어종 이미지가 있으면 실사 픽셀 생선 표시 */
  private showResultPanel(title: string, body: string, color: string, fishTexture?: string): void {
    this.resultContainer?.destroy();
    const hasImage = !!fishTexture && this.textures.exists(fishTexture);
    const ph = hasImage ? 360 : 230;
    const half = ph / 2;
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24).setDepth(110);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.97);
    bg.fillRoundedRect(-230, -half, 460, ph, 8);
    bg.lineStyle(2, 0x2a5a8a, 1);
    bg.strokeRoundedRect(-230, -half, 460, ph, 8);
    c.add(bg);

    const t1 = this.add.text(0, -half + 30, title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '19px', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(t1);

    // 실사 픽셀 생선 이미지 (감성돔/광어 등)
    if (hasImage && fishTexture) {
      const src = this.textures.get(fishTexture).getSourceImage() as HTMLImageElement;
      const scale = Math.min(320 / src.width, 130 / src.height);
      const img = this.add.image(0, -half + 122, fishTexture)
        .setDisplaySize(src.width * scale, src.height * scale);
      c.add(img);
    }

    const t2 = this.add.text(0, hasImage ? half - 130 : -6, body, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    c.add(t2);

    const btnY = half - 48;
    const mkBtn = (bx: number, label: string, fill: number, stroke: number, txtColor: string, onClick: () => void): void => {
      const g = this.add.graphics();
      g.fillStyle(fill, 0.95); g.fillRoundedRect(bx - 90, btnY - 19, 180, 38, 5);
      g.lineStyle(2, stroke, 1); g.strokeRoundedRect(bx - 90, btnY - 19, 180, 38, 5);
      const txt = this.add.text(bx, btnY, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: txtColor, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(bx, btnY, 180, 38, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => txt.setColor('#ffffff'));
      hit.on('pointerout', () => txt.setColor(txtColor));
      hit.on('pointerdown', onClick);
      c.add([g, txt, hit]);
    };
    // 채비가 온전할 때만 재캐스팅 가능 (미끼 소진 등으로 불완전하면 필드 복귀 유도)
    const missing = InventoryStore.getMissingRigParts();
    if (missing.length === 0) {
      mkBtn(-100, '다시 캐스팅 (SPACE)', 0x0d4a2e, 0x4af2a1, '#4af2a1', () => this.recast());
    } else {
      const note = this.add.text(-100, btnY, `채비 보충 필요: ${missing.join(', ')}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ff9a6a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: 190 },
      }).setOrigin(0.5);
      c.add(note);
    }
    mkBtn(100, '그만하기 (ESC)', 0x3a2020, 0x8a4a4a, '#ffb0a0', () => this.exitToField());

    applyScreenFixed(c);
    this.resultContainer = c;
  }

  /** 같은 포인트에 다시 흘리기 (드리프트 상태 리셋) — 채비 완성 상태에서만 */
  private recast(): void {
    if (InventoryStore.getMissingRigParts().length > 0) {
      this.registry.set('fp_exit_msg', '채비 보충이 필요합니다 (U 채비하기)');
      this.exitToField();
      return;
    }
    this.resultContainer?.destroy();
    this.resultContainer = undefined;
    this.fpState = 'drift';
    this.rig = createUnderwaterRig(0);
    this.viewCenterX = 0;
    this.lineTension.resetAlignment();
    this.biteEngine.reset();
    this.hookedFish = null;
    this.floatObj.setY(WATERLINE);
    this.refreshCoolerUi();
    this.stateText.setText('채비 흘리는 중 — H 뒷줄견제 · C 밑밥');
  }

  // ═══════════════════════════════════════════════════
  // 렌더링 (파도/라인/미끼/게이지/낚싯대)
  // ═══════════════════════════════════════════════════
  private renderWater(_dt: number): void {
    const g = this.waveG;
    g.clear();
    // 수면 경계 파도 (사인 웨이브 2겹)
    const t = this.time.now / 700;
    g.lineStyle(2, 0xe6f6ff, 0.75);
    g.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += 8) {
      const y = WATERLINE + Math.sin(x / 46 + t) * 3 + Math.sin(x / 21 - t * 1.4) * 1.6;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
    g.lineStyle(1, 0xbfe4f8, 0.4);
    g.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += 10) {
      const y = WATERLINE + 7 + Math.sin(x / 38 - t * 1.2) * 2.4;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();

    // 해저 지형은 정면 뷰에 표시하지 않음 — 여 밭 여부는 좌측 게이지/우측 수심 패널로 안내
  }

  private renderRigVisuals(): void {
    const g = this.dynamicG;
    g.clear();

    const fx = this.screenX(this.rig.floatX);
    const wave = Math.sin(this.time.now / 500) * 2.2;
    if (this.fpState !== 'fighting') this.floatObj.setPosition(fx, WATERLINE + wave);
    else this.floatObj.setX(fx);

    const bx = this.screenX(this.rig.baitX);
    const by = this.depthY(this.rig.baitZ);

    // 수중 라인 (찌 → 미끼, 사선 정렬 시 곧게)
    g.lineStyle(1.2, 0xd8ecf8, 0.55);
    const midX = (fx + bx) / 2 + (1 - this.lineTension.alignmentIndex) * 14;
    g.beginPath();
    g.moveTo(fx, WATERLINE + 8);
    g.lineTo(midX, (WATERLINE + by) / 2);
    g.lineTo(bx, by);
    g.strokePath();

    // 미끼 (바늘+미끼)
    g.fillStyle(0xffb46a, 1);
    g.fillCircle(bx, by, 4);
    g.lineStyle(1, 0x333333, 0.9);
    g.strokeCircle(bx, by, 4);

    // ── 우측 상단 수심 정보 패널 (수심에 따른 채비 위치 시각화) ──
    this.renderDepthPanel(g);
  }

  /** 우측 상단 수심 패널 — 찌(0m)/면사매듭(Z_limit)/미끼/바닥(Z_max) + 여 밭 표시 */
  private renderDepthPanel(g: Phaser.GameObjects.Graphics): void {
    const px = GAME_WIDTH - 168;
    const py = 44;
    const pw = 150;
    const ph = 236;
    const gaugeX = px + 30;
    const gaugeTop = py + 40;
    const gaugeH = ph - 60;

    // 패널 배경
    g.fillStyle(0x0a1628, 0.82);
    g.fillRoundedRect(px, py, pw, ph, 6);
    g.lineStyle(1.2, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(px, py, pw, ph, 6);

    const bottomM = this.cfg.zMaxM;
    const yOf = (z: number): number => gaugeTop + (Phaser.Math.Clamp(z, 0, bottomM) / bottomM) * gaugeH;

    // 게이지 본체 (수심 그라데이션 바)
    g.fillStyle(0x123048, 0.95);
    g.fillRoundedRect(gaugeX - 9, gaugeTop, 18, gaugeH, 4);
    g.lineStyle(1, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(gaugeX - 9, gaugeTop, 18, gaugeH, 4);

    // 미끼 수심까지의 침강 라인
    g.lineStyle(1.4, 0x9fd0e4, 0.8);
    g.lineBetween(gaugeX, yOf(0), gaugeX, yOf(this.rig.baitZ));

    // 찌 (수면 0m)
    g.fillStyle(0xff6a2a, 1);
    g.fillEllipse(gaugeX, yOf(0) - 2, 10, 8);

    // 면사매듭 한계선 (Z_limit)
    const zlY = yOf(Math.min(this.zLimitM, bottomM));
    g.lineStyle(2, 0xffce54, 1);
    g.lineBetween(gaugeX - 12, zlY, gaugeX + 12, zlY);

    // 현재 미끼 수심 마커
    g.fillStyle(0x4af2a1, 1);
    g.fillCircle(gaugeX, yOf(this.rig.baitZ), 4.5);

    // 바닥 (Z_max) — 여 밭이면 바위 색, 아니면 모래 색으로 표시
    const inReefHere = this.isReefAt(this.rig.baitX);
    g.fillStyle(inReefHere ? 0x4a4438 : 0x8a7a58, 1);
    g.fillRect(gaugeX - 12, yOf(bottomM), 24, 5);

    // 실시간 수치 텍스트 (게이지 우측)
    this.depthValsText?.setText([
      `찌  0m`,
      `매듭  ${this.zLimitM}m`,
      `미끼  ${this.rig.baitZ.toFixed(1)}m`,
      `바닥  ${bottomM.toFixed(0)}m`,
      inReefHere ? '여 밭 (암초)' : '모래/갯벌',
    ].join('\n'));
  }

  private renderGauges(probPerSec: number, chumSync: number, inReef: boolean, hold: boolean, snagProgress: number, actionLeft: number): void {
    const g = this.uiG;
    g.clear();

    const drawBar = (y: number, ratio: number, color: number): void => {
      g.fillStyle(0x101820, 0.85);
      g.fillRoundedRect(20, y, 170, 10, 3);
      g.fillStyle(color, 0.95);
      g.fillRoundedRect(20, y, 170 * Phaser.Math.Clamp(ratio, 0, 1), 10, 3);
      g.lineStyle(1, 0x2a5a8a, 0.9);
      g.strokeRoundedRect(20, y, 170, 10, 3);
    };

    // 정렬도 A / 밑밥 동조율 / 밑걸림 경고
    drawBar(30, this.lineTension.alignmentIndex, 0x33b0e0);
    drawBar(54, chumSync, 0xc8a060);
    if (snagProgress > 0.01) drawBar(78, snagProgress, 0xff6a5a);

    const lines = [
      `정렬도 A ${(this.lineTension.alignmentIndex * 100).toFixed(0)}%`,
      `밑밥 동조 ${(chumSync * 100).toFixed(0)}%`,
      `입질 확률 ${(probPerSec * 100).toFixed(1)}%/s${actionLeft > 0 ? '  [리액션 x2.0]' : ''}`,
      `지형: ${inReef ? (hold ? '여 밭 안착 (x2.5)' : '여 밭') : '모래/갯벌'}${snagProgress > 0.3 ? '  ⚠ 밑걸림 주의' : ''}`,
      `미끼 수심 ${this.rig.baitZ.toFixed(1)}m / 매듭 ${this.zLimitM}m / 바닥 ${this.cfg.zMaxM.toFixed(0)}m`,
    ];
    this.probText.setText(lines.join('\n')).setPosition(20, 96);
  }

  private renderFightUi(st: FightStatus): void {
    const g = this.uiG;
    g.clear();

    // 텐션 바 (상단 중앙 — 안전 구간 30~80 표시)
    const bw = 420, bx = GAME_WIDTH / 2 - bw / 2, by = 54;
    g.fillStyle(0x101820, 0.9);
    g.fillRoundedRect(bx, by, bw, 18, 4);
    // 안전 구간
    g.fillStyle(0x1d4a30, 0.9);
    g.fillRect(bx + bw * 0.3, by, bw * 0.5, 18);
    // 현재 텐션
    const tRatio = st.tension / 100;
    const tColor = st.tension < 30 ? 0x66b8ff : st.tension > 80 ? 0xff5a4a : 0x4af2a1;
    g.fillStyle(tColor, 1);
    g.fillRoundedRect(bx, by, bw * tRatio, 18, 4);
    g.lineStyle(1.5, 0x2a5a8a, 1);
    g.strokeRoundedRect(bx, by, bw, 18, 4);

    // 랜딩 진행 바
    g.fillStyle(0x101820, 0.9);
    g.fillRoundedRect(bx, by + 26, bw, 10, 3);
    g.fillStyle(0xffe28a, 0.95);
    g.fillRoundedRect(bx, by + 26, bw * (st.progress / 100), 10, 3);
    g.lineStyle(1, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(bx, by + 26, bw, 10, 3);

    this.probText.setText([
      `텐션 ${st.tension.toFixed(0)} / 100  (안전 30~80)`,
      `랜딩 ${st.progress.toFixed(0)}%`,
      this.hookedFish ? `상대: ??? (힘 ${(this.hookedFish.powerFactor * 100).toFixed(0)})` : '',
    ].join('\n')).setPosition(20, 96);
  }

  /** 낚싯대 뷰 (우측) — 텐션에 따라 휘어짐, 초릿대 → 찌 라인 */
  private renderRod(): void {
    const g = this.rodG;
    g.clear();

    const baseX = GAME_WIDTH - 30;
    const baseY = GAME_HEIGHT - 8;
    const fx = this.screenX(this.rig.floatX);
    const fy = WATERLINE;

    // 텐션 기반 휨 (파이팅 중 크게)
    const tension = this.fight ? this.fight.tension / 100 : (this.hKey?.isDown ? 0.25 : 0.08);
    const tipX = GAME_WIDTH - 320 + tension * 60;
    const tipY = WATERLINE + 30 + tension * 70;

    // 로드 곡선 (세그먼트 — 손잡이에서 초릿대로 갈수록 가늘게)
    const segments = 14;
    let prevX = baseX, prevY = baseY;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // 2차 베지어: 제어점을 텐션에 따라 아래로
      const cx = baseX - 190, cy = baseY - 330 + tension * 130;
      const px = (1 - t) * (1 - t) * baseX + 2 * (1 - t) * t * cx + t * t * tipX;
      const py = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * cy + t * t * tipY;
      g.lineStyle(6 - t * 4.4, i < 4 ? 0x27170d : 0xe8e4da, 1);
      g.lineBetween(prevX, prevY, px, py);
      // 가이드 링
      if (i % 3 === 0) {
        g.lineStyle(1, 0x8898a8, 0.9);
        g.strokeCircle(px, py + 3, 2.5);
      }
      prevX = px; prevY = py;
    }
    // 릴
    g.fillStyle(0x2a2a30, 1);
    g.fillCircle(baseX - 26, baseY - 44, 9);
    g.fillStyle(0x9aa4b0, 1);
    g.fillCircle(baseX - 26, baseY - 44, 4);

    // 원줄: 초릿대 → 찌
    g.lineStyle(1, 0xf2f8ff, 0.65);
    g.lineBetween(prevX, prevY, fx, fy - 8);
  }

  private updateChumSprites(tide: TideVector): void {
    // 정면 뷰 밑밥 모션: 조류 방향 수평 이동 + 페이드아웃
    const now = this.time.now;
    this.chumSprites = this.chumSprites.filter(({ obj, born }) => {
      const age = (now - born) / 1000;
      if (age > 7 || !obj.active) { obj.destroy(); return false; }
      obj.x += tide.x * PX_PER_M_X * 0.016;
      obj.setAlpha(Math.max(0, 0.95 * (1 - age / 7)));
      return true;
    });
  }

  private flashState(msg: string): void {
    this.stateText.setText(msg);
    this.time.delayedCall(2200, () => {
      if (this.fpState === 'drift') this.stateText.setText('채비 흘리는 중 — H 뒷줄견제 · C 밑밥');
    });
  }

  // ═══════════════════════════════════════════════════
  // 필드 복귀 (그만하기 / ESC) — stop + resume (낚시 시점 위치 보존)
  // ═══════════════════════════════════════════════════
  private exitToField(): void {
    this.cameras.main.fadeOut(240, 2, 12, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('RegionFieldScene');
    });
  }
}
