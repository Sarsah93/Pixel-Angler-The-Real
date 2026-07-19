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
  getAreaSnagRiskMult,
  BiteSequenceEngine, TidalCurrentEngine, TidalInfluence,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore, RigStepKey, CARD_RIG_INFO } from '../store/InventoryStore.js';
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

  // ── 입질 시퀀스 / 챔질 (2026-07-17 — 자동 파이팅 진입 대체) ──
  private biteSeq = new BiteSequenceEngine();
  /** 입질 시퀀스 대상 물고기 (챔질 성공 시 hookedFish로 승격) */
  private pendingFish: SpawnedFish | null = null;
  /** 현재 초릿대 굽힘 각도 (도) — 입질/파이팅 렌더 공용 */
  private rodBendDeg = 0;
  /** 찌 잠김 깊이 (m) — 입질 단계별 0.05/0.10/0.25 */
  private floatSinkM = 0;

  // ── 조류 (TidalCurrentEngine) ──
  private tidal!: TidalCurrentEngine;
  /** 수면 거리 (m) — 반탄류로 늘고 릴링으로 준다 */
  private distM = 0;
  private lastTidal: TidalInfluence | null = null;
  private distText!: Phaser.GameObjects.Text;
  private foamParticles: Phaser.GameObjects.Arc[] = [];

  // ── 리프트/루어 액션 상태 ──
  /** 채비 자세 (우측 모식도 애니메이션) */
  private rigPose: 'idle' | 'lift' | 'fall' | 'retrieve' | 'twitch' | 'hop' = 'idle';
  private poseTimer = 0;
  private twitchCooldown = 0;
  private lastTapAt = 0;
  private pointerDownAt = 0;
  /** 파이팅 과부하 릴링 (텐션 한계에서 무리한 입력) 누적 */
  private overstrain = 0;

  // ── 가이드/이펙트 (2026-07-19 — 온보딩·시각 피드백) ──
  /** 튜토리얼/도움말 오버레이 */
  private guideContainer?: Phaser.GameObjects.Container;
  /** 하단 상태별 조작 가이드 바 */
  private controlBarText!: Phaser.GameObjects.Text;
  /** 입질 단계 전환 감지용 (이펙트 1회 발동) */
  private prevStage: number | null = null;
  /** 조류 존 전환 감지용 (토스트 1회) */
  private prevZone: string | null = null;
  /** 텐션 위험 비네트 그래픽 */
  private vignetteG!: Phaser.GameObjects.Graphics;

  // 입력
  private hKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private reeling = false;

  // 렌더 오브젝트
  private waveG!: Phaser.GameObjects.Graphics;
  private dynamicG!: Phaser.GameObjects.Graphics;   // 라인/미끼/찌 연결 등 매 프레임
  private rodG!: Phaser.GameObjects.Graphics;
  /** 우측 수심 모식도 전용 레이어 — 낚싯대(depth 60)보다 위에 그려 겹침 방지 */
  private panelG!: Phaser.GameObjects.Graphics;
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
    this.pendingFish = null;
    this.reeling = false;
    this.viewCenterX = 0;
    this.sessionCatch = [];
    this.chumSprites = [];
    this.resultContainer = undefined;
    this.fishShadow = undefined;
    this.biteSeq = new BiteSequenceEngine();
    this.rodBendDeg = 0;
    this.floatSinkM = 0;
    this.distM = data.castDistanceM;
    this.lastTidal = null;
    this.foamParticles = [];
    this.rigPose = 'idle';
    this.poseTimer = 0;
    this.twitchCooldown = 0;
    this.lastTapAt = 0;
    this.pointerDownAt = 0;
    this.overstrain = 0;
    this.guideContainer = undefined;
    this.prevStage = null;
    this.prevZone = null;
  }

  create(): void {
    const zMax = this.cfg.zMaxM;
    this.pxPerMZ = Math.min(46, (GAME_HEIGHT - WATERLINE - 110) / Math.max(2, zMax));
    // 면사매듭 제거(전유동) 시 Z_limit 무한 — 바닥까지 무한 침강
    this.zLimitM = InventoryStore.hasFloatStop ? InventoryStore.rigDepthLimitM : Number.POSITIVE_INFINITY;

    // 물때 기반 조류 속력
    const tide = calculateTideInfo();
    this.tideBase = 0.12 + tide.currentStrength * 0.5;

    // 조류 엔진 — 물때 세기/밀물썰물/횡류 방향, 존 경계는 캐스팅 거리 비례
    this.tidal = new TidalCurrentEngine({
      tideStrength: 0.5 + tide.currentStrength,
      isFloodTide: tide.nextTideType === 'high',   // 다음이 만조 = 지금 밀물(상승)
      crossSpeed: this.tideBase * (Math.random() < 0.5 ? 1 : -1),
      maxCastM: Math.max(12, this.cfg.castDistanceM * 1.15),
    });

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
    this.panelG = this.add.graphics().setDepth(85);   // 수심 모식도 — 낚싯대 위
    this.buildUi();

    // 입력
    this.hKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.input.keyboard!.on('keydown-C', () => this.tossChum());
    this.input.keyboard!.on('keydown-ESC', () => this.exitToField());
    this.input.keyboard!.on('keydown-SPACE', () => { if (this.fpState === 'result') this.recast(); });
    // 우클릭 = 챔질 (입질 시퀀스 판정) / 좌클릭 = 릴링(홀드)·루어 액션(탭/더블탭)
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.guideContainer) return;   // 도움말 열림 중엔 낚시 입력 차단
      if (p.rightButtonDown()) { this.attemptHookset(); return; }
      if (p.leftButtonDown()) {
        this.pointerDownAt = this.time.now;
        this.reeling = true;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.button !== 0) return;
      this.reeling = false;
      // 숏탭 판별 (220ms 미만) — 더블탭(350ms 내 재탭) = 트위칭/저킹, 단일 탭 = 호핑
      const heldMs = this.time.now - this.pointerDownAt;
      if (heldMs < 220 && this.fpState === 'drift') {
        if (this.time.now - this.lastTapAt < 350) {
          this.doTwitch(p.x < GAME_WIDTH / 2 ? -1 : 1);
          this.lastTapAt = 0;
        } else {
          this.lastTapAt = this.time.now;
          this.doHop();
        }
      }
    });

    // ── 가이드/이펙트 계층 (2026-07-19) ──
    this.vignetteG = this.add.graphics().setDepth(99);
    this.buildControlBar();
    this.buildHelpButton();
    // F1 또는 / (물음표) 키 = 도움말 토글
    this.input.keyboard!.on('keydown-F1', () => this.toggleGuide());
    this.input.keyboard!.on('keydown-FORWARD_SLASH', () => this.toggleGuide());
    // 첫 진입 시 튜토리얼 자동 표시 (이후엔 도움말 버튼/F1로 재열람)
    if (!localStorage.getItem('tra_fp_guide_seen')) {
      this.time.delayedCall(400, () => this.toggleGuide(true));
    }

    this.cameras.main.fadeIn(320, 2, 12, 24);
  }

  // ═══════════════════════════════════════════════════
  // 온보딩 가이드 / 도움말 (첫 진입 튜토리얼 + F1 재열람)
  // ═══════════════════════════════════════════════════
  /** 하단 상태별 조작 가이드 바 — 상황에 맞는 키만 노출 */
  private buildControlBar(): void {
    const bg = this.add.graphics().setDepth(94);
    bg.fillStyle(0x0a1628, 0.78);
    bg.fillRoundedRect(GAME_WIDTH / 2 - 330, GAME_HEIGHT - 118, 660, 22, 4);
    this.controlBarText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 107, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
    }).setOrigin(0.5).setDepth(95);
    this.refreshControlBar();
  }

  /** 상태별 조작 바 내용 갱신 (update 루프에서 상태 변화 시 호출) */
  private refreshControlBar(): void {
    if (!this.controlBarText) return;
    let text: string;
    if (this.fpState === 'fighting') {
      text = '좌클릭 홀드 릴링 · H 버티기 — 텐션 30~80 유지 · 패턴 경고에 맞게 대응 (한계 텐션 릴링 강행 = 줄터짐)';
    } else if (this.biteSeq.active || this.pendingFish) {
      text = '입질 중! 초릿대가 크게 휘는 3단계에 우클릭 챔질 (1단계 5% · 2단계 20% · 3단계 100%)';
    } else {
      text = '우클릭 챔질 · 좌클릭 홀드 릴링 · 탭 호핑 · 더블탭 트위칭 · ↑ 리프트 · H 뒷줄견제 · C 밑밥 · F1 도움말';
    }
    if (this.controlBarText.text !== text) this.controlBarText.setText(text);
  }

  /** 우하단 도움말(?) 버튼 */
  private buildHelpButton(): void {
    const btn = this.add.container(GAME_WIDTH - 190, GAME_HEIGHT - 44).setDepth(95);
    const g = this.add.graphics();
    g.fillStyle(0x14324a, 0.95);
    g.fillCircle(0, 0, 17);
    g.lineStyle(1.5, 0x33b0e0, 1);
    g.strokeCircle(0, 0, 17);
    const q = this.add.text(0, 0, '?', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.add.circle(0, 0, 17, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => q.setColor('#ffffff'));
    hit.on('pointerout', () => q.setColor('#aee8ff'));
    hit.on('pointerdown', () => this.toggleGuide());
    btn.add([g, q, hit]);
    applyScreenFixed(btn);
  }

  /** 튜토리얼/도움말 토글 — 우선순위별 단계 페이지 (1 입질 읽기 → 2 챔질 → 3 채비 → 4 파이팅) */
  private toggleGuide(firstTime = false): void {
    if (this.guideContainer) {
      this.guideContainer.destroy();
      this.guideContainer = undefined;
      return;
    }
    if (this.fpState === 'fighting') return;   // 파이팅 중엔 열지 않음
    this.guideFirstTime = firstTime;
    this.guidePage = 0;
    this.renderGuidePage();
  }

  private guidePage = 0;
  private guideFirstTime = false;

  /** 가이드 페이지 정의 — 상관성(구부러짐↔챔질 성공)을 단계별로 설명 */
  private static readonly GUIDE_PAGES: {
    title: string; color: string;
    stages?: { deg: number; color: number; head: string; body: string; hit: string }[];
    lines?: string[];
    footer?: string;
  }[] = [
    {
      title: '1단계 — 입질 읽기: 초릿대 구부러짐 3단계', color: '#ffce54',
      stages: [
        {
          deg: 30, color: 0x9fd0e4, head: '1단계 · 살짝 (30°)',
          body: '간보기 — 물고기가 미끼를 툭툭 건드리는 준비 동작입니다. 0.5초 만에 굽었다 펴집니다. 찌가 -0.05m 살짝 잠깁니다.',
          hit: '챔질 성공 가능성: 거의 드뭅니다 (5%)',
        },
        {
          deg: 45, color: 0xffce54, head: '2단계 · 제법 (45°)',
          body: '부분 섭취 — 미끼를 입에 넣기 시작합니다. 45°까지 굽은 뒤 30° 부근에서 잠시 버팁니다. 찌가 -0.10m 잠깁니다.',
          hit: '챔질 성공 가능성: 성공할 수 있으나 힘듭니다 (20%)',
        },
        {
          deg: 60, color: 0xff6a5a, head: '3단계 · 크게 (60°)',
          body: '완전 흡입! — 미끼를 문 채 이동합니다. 순식간에 60°까지 박히고 50°로 1초 가까이 유지됩니다. 찌가 -0.25m 깊이 잠깁니다.',
          hit: '성공 확률이 가장 높습니다 (100%) — 단, 초릿대가 다시 펴지는 마지막 순간은 "너무 늦은 챔질"로 무조건 실패!',
        },
      ],
      footer: '초릿대와 찌 잠김을 함께 보면 단계를 확실히 구분할 수 있습니다. 단계 사이 간격은 몇 초~몇 분까지 어종/활성도에 따라 다릅니다.',
    },
    {
      title: '2단계 — 챔질 타이밍 (우클릭)', color: '#ff6a5a',
      lines: [
        '· 챔질 = 우클릭. 성공해야만 파이팅이 시작됩니다.',
        '',
        '· 성급한 챔질은 물고기를 쫓아냅니다 — 1~2단계에서는 기다리는 것이 정석입니다.',
        '   (1단계 챔질은 5%, 2단계는 20%만 성공 — 실패하면 미끼를 잃고 다시 던져야 합니다)',
        '',
        '· 3단계 진입 순간 화면에 "지금 챔질!"이 뜹니다 — 이때가 골든 타임 (100%).',
        '   초릿대가 다시 펴지기 시작하면 이미 늦은 것입니다.',
        '',
        '· 어종마다 입질 패턴이 다릅니다:',
        '   광어 — 예비 동작 없이 곧바로 3단계로 박습니다.',
        '   감성돔 — 1단계 간보기 후 곧바로 3단계로 흡입합니다.',
        '   패턴을 기억해두면 다음 입질을 예측할 수 있습니다.',
        '',
        '· 챔질 없이 어신이 끝나면 미끼만 따먹히고 물고기는 떠납니다.',
      ],
    },
    {
      title: '3단계 — 채비 다루기 (흘림 중 액션)', color: '#7fb8d8',
      lines: [
        '· [H] 뒷줄견제 — 채비를 세워 밑걸림을 예방하고, 미끼가 떠오르며 리액션 입질을 유도합니다.',
        '   여 밭(암초)에서 방치하면 밑걸림으로 채비를 통째로 잃습니다!',
        '',
        '· [C] 밑밥 투척 — 밑밥과 미끼의 동조율이 높을수록 입질이 크게 늘어납니다.',
        '',
        '· [↑] 리프트 — 낚싯대를 들어 채비를 위 수심층으로 올립니다. 떼면 다시 가라앉습니다.',
        '',
        '· 좌클릭 홀드 = 릴링 — 화면 왼쪽을 누르면 왼쪽으로, 오른쪽을 누르면 오른쪽으로 당깁니다.',
        '   조류 방향과 같은 쪽은 빠르게, 반대쪽은 느리지만 입질을 유도합니다.',
        '',
        '· 좌클릭 탭 = 호핑 / 더블탭 = 트위칭 (루어 액션 — 0.8초 간격)',
        '',
        '· 수면의 흰 포말 지대 = 조경지대 — 조류가 만나 멈추는 곳, 입질 확률이 급증합니다!',
      ],
    },
    {
      title: '4단계 — 파이팅 (챔질 성공 후)', color: '#4af2a1',
      lines: [
        '· 좌클릭 홀드 = 릴링(감기) / [H] = 버티기.',
        '',
        '· 텐션을 30~80 사이로 유지하세요:',
        '   30 미만 — 줄이 느슨해져 바늘이 빠집니다.',
        '   80 초과 — 위험 구간. 화면 테두리가 붉게 깜빡입니다.',
        '',
        '· 텐션이 높을수록 릴링이 무겁게 미끄러집니다 (저항).',
        '   한계 텐션(88+)에서 릴링을 강행하면 줄이 터지고 채비를 잃습니다!',
        '   → 릴링을 멈추고 드랙으로 버틴 뒤, 텐션이 내려가면 다시 감으세요.',
        '',
        '· 물고기 저항 패턴에 대응하세요:',
        '   바늘털이(점프) — 릴링을 멈추고 H를 떼세요.',
        '   여 박기(하강) — H를 꾹 눌러 버티세요.',
        '   횡이동(쓸림) — H를 떼고 드랙으로 버티세요.',
      ],
    },
  ];

  /** 현재 guidePage 렌더 (이전/다음 네비게이션) */
  private renderGuidePage(): void {
    this.guideContainer?.destroy();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const pages = FirstPersonFishingScene.GUIDE_PAGES;
    const page = pages[this.guidePage];
    const isLast = this.guidePage === pages.length - 1;

    const c = this.add.container(0, 0).setDepth(150);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x02060c, 0.72).setInteractive();
    c.add(dim);

    const pw = 860, phh = 480;
    const px = W / 2 - pw / 2, py = H / 2 - phh / 2 - 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.98);
    bg.fillRoundedRect(px, py, pw, phh, 8);
    bg.lineStyle(2, 0x33b0e0, 1);
    bg.strokeRoundedRect(px, py, pw, phh, 8);
    c.add(bg);

    // 헤더: 제목 + 페이지 진행 점
    const title = this.add.text(W / 2, py + 28, page.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: page.color, fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(title);
    const dots = this.add.graphics();
    pages.forEach((_, i) => {
      dots.fillStyle(i === this.guidePage ? 0x4af2a1 : 0x2a5a8a, 1);
      dots.fillCircle(W / 2 - (pages.length - 1) * 10 + i * 20, py + 52, i === this.guidePage ? 4.5 : 3);
    });
    c.add(dots);

    if (page.stages) {
      // 1페이지: 3단계 카드 (도해 + 설명 + 히트 가능성)
      page.stages.forEach((st, i) => {
        const cy = py + 70 + i * 112;
        const cg = this.add.graphics();
        cg.fillStyle(0x0e1c2d, 0.95);
        cg.fillRoundedRect(px + 18, cy, pw - 36, 102, 6);
        cg.lineStyle(1.4, st.color, 0.85);
        cg.strokeRoundedRect(px + 18, cy, pw - 36, 102, 6);
        // 좌측 도해: 낚싯대 굽힘 곡선 (크게)
        let dx = px + 66, dy = cy + 88;
        let a = -Math.PI / 2;
        const per = (st.deg * Math.PI / 180) / 7;
        cg.lineStyle(4, st.color, 1);
        for (let s = 0; s < 7; s++) {
          a += per;
          const nx = dx + Math.cos(a + Math.PI / 2) * 11;
          const ny = dy + Math.sin(a + Math.PI / 2) * 11 - 11;
          cg.lineBetween(dx, dy, nx, ny);
          dx = nx; dy = ny;
        }
        cg.fillStyle(st.color, 1);
        cg.fillCircle(dx, dy, 3.5);
        c.add(cg);
        const head = this.add.text(px + 128, cy + 10, st.head, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: page.color, fontStyle: 'bold',
        });
        const body = this.add.text(px + 128, cy + 32, st.body, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11.5px', color: '#d0e8f5',
          wordWrap: { width: pw - 170 }, lineSpacing: 4,
        });
        const hit = this.add.text(px + 128, cy + 74, `→ ${st.hit}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11.5px', color: '#7fe6b0', fontStyle: 'bold',
          wordWrap: { width: pw - 170 },
        });
        c.add([head, body, hit]);
      });
      if (page.footer) {
        const foot = this.add.text(W / 2, py + phh - 72, page.footer, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
          wordWrap: { width: pw - 60 }, align: 'center',
        }).setOrigin(0.5, 0);
        c.add(foot);
      }
    } else if (page.lines) {
      const body = this.add.text(px + 40, py + 74, page.lines.join('\n'), {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12.5px', color: '#d0e8f5',
        lineSpacing: 6, wordWrap: { width: pw - 80 },
      });
      c.add(body);
    }

    // 네비게이션: [이전] [n/N] [다음 or 낚시 시작]
    const navY = py + phh - 36;
    const mkNav = (nx: number, label: string, primary: boolean, onClick: () => void): void => {
      const bw2 = primary ? 200 : 120;
      const g2 = this.add.graphics();
      g2.fillStyle(primary ? 0x0d4a2e : 0x1f3045, 0.97);
      g2.fillRoundedRect(nx - bw2 / 2, navY - 18, bw2, 36, 5);
      g2.lineStyle(1.5, primary ? 0x4af2a1 : 0x4a6a8a, 1);
      g2.strokeRoundedRect(nx - bw2 / 2, navY - 18, bw2, 36, 5);
      const t = this.add.text(nx, navY, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px',
        color: primary ? '#4af2a1' : '#9fc0d4', fontStyle: 'bold',
      }).setOrigin(0.5);
      const h = this.add.rectangle(nx, navY, bw2, 36, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      h.on('pointerover', () => t.setColor('#ffffff'));
      h.on('pointerout', () => t.setColor(primary ? '#4af2a1' : '#9fc0d4'));
      h.on('pointerdown', onClick);
      c.add([g2, t, h]);
    };
    if (this.guidePage > 0) {
      mkNav(px + 100, '← 이전', false, () => { this.guidePage -= 1; this.renderGuidePage(); });
    }
    const pageLabel = this.add.text(W / 2, navY, `${this.guidePage + 1} / ${pages.length}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#7a97ab',
    }).setOrigin(0.5);
    c.add(pageLabel);
    if (!isLast) {
      mkNav(px + pw - 100, '다음 →', true, () => { this.guidePage += 1; this.renderGuidePage(); });
    } else {
      mkNav(px + pw - 130, this.guideFirstTime ? '낚시 시작하기!' : '닫기 (F1)', true, () => {
        localStorage.setItem('tra_fp_guide_seen', '1');
        this.toggleGuide();
      });
    }

    const hint = this.add.text(W / 2, py + phh + 12, '언제든 [F1] 또는 우하단 ? 버튼으로 다시 볼 수 있습니다', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7a97ab',
    }).setOrigin(0.5, 0);
    c.add(hint);

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    applyScreenFixed(c);
    this.guideContainer = c;
  }

  // ═══════════════════════════════════════════════════
  // 챔질 (우클릭) — 입질 시퀀스 판정 → 성공 시에만 파이팅 진입
  // ═══════════════════════════════════════════════════
  private attemptHookset(): void {
    if (this.fpState !== 'drift') return;
    const r = this.biteSeq.attemptHook();
    if (r.reason === 'no_bite') {
      this.flashState(r.message);
      return;
    }
    if (r.success && this.pendingFish) {
      this.enterFight();
    } else {
      // 챔질 실패 — 물고기는 떠나고 미끼를 잃는다. 다시 던지기 가이드.
      this.pendingFish = null;
      this.rodBendDeg = 0;
      this.floatSinkM = 0;
      if (InventoryStore.hookNeedsBait()) InventoryStore.consumeRigItem('bait');
      this.refreshCoolerUi();
      this.fpState = 'result';
      this.showResultPanel('챔질 실패', `${r.message}\n\n물고기가 미끼를 뱉고 달아났습니다.\n초릿대가 크게 휘는 3단계 입질에 챔질하세요.`, '#ff9a6a');
    }
  }

  // ═══════════════════════════════════════════════════
  // 이벤트 이펙트 (입질 단계 / 챔질 성공 / 조류 존 전환)
  // ═══════════════════════════════════════════════════
  /**
   * 입질 단계 진입 이펙트 — 찌 파문 + 느낌표 + 강도별 카메라 쉐이크.
   * 3단계는 "지금 챔질!" 강조까지 (유저가 챔질 타이밍을 시각으로 읽도록).
   */
  private playStageEffect(stage: number): void {
    const fx = this.screenX(this.rig.floatX);
    const conf = [
      { marks: '!', color: '#ffe28a', ripple: 10, shake: 0 },
      { marks: '!!', color: '#ffab54', ripple: 16, shake: 0.0018 },
      { marks: '!!!', color: '#ff5a4a', ripple: 24, shake: 0.0042 },
    ][stage - 1] ?? { marks: '!', color: '#ffe28a', ripple: 10, shake: 0 };

    // 찌 파문 (단계별 크기)
    for (let i = 0; i < stage; i++) {
      const rip = this.add.circle(fx, WATERLINE + 2, 5, 0x000000, 0)
        .setStrokeStyle(2, 0xeaf6ff, 0.85).setDepth(36);
      this.tweens.add({
        targets: rip, scale: conf.ripple / 5, alpha: 0,
        duration: 550 + i * 160, delay: i * 110, onComplete: () => rip.destroy(),
      });
    }
    // 느낌표 (찌 위로 떠오르며 사라짐)
    const mark = this.add.text(fx, WATERLINE - 26, conf.marks, {
      fontFamily: 'monospace', fontSize: `${16 + stage * 4}px`, color: conf.color, fontStyle: 'bold',
      stroke: '#0a1628', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(96);
    this.tweens.add({ targets: mark, y: WATERLINE - 52, alpha: 0, duration: 900, onComplete: () => mark.destroy() });

    if (conf.shake > 0) this.cameras.main.shake(140 + stage * 40, conf.shake);
    if (stage === 3) {
      const now = this.add.text(GAME_WIDTH / 2, 168, '지금 챔질! (우클릭)', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '22px', color: '#ff5a4a', fontStyle: 'bold',
        stroke: '#0a1628', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(96).setScale(0.6);
      this.tweens.add({ targets: now, scale: 1, duration: 130, ease: 'Back.easeOut' });
      this.tweens.add({ targets: now, alpha: 0, delay: 850, duration: 250, onComplete: () => now.destroy() });
    } else {
      this.flashState(stage === 1 ? '미끼를 건드립니다… (1단계)' : '부분 섭취 중! (2단계)');
    }
  }

  /** 조류 존 전환 토스트 — 조경지대 진입 강조 / 본류 진입 경고 */
  private showZoneToast(zone: string, label: string): void {
    const isRip = zone === 'rip';
    const isMain = zone === 'main';
    if (!isRip && !isMain) return;   // 일반 존 전환은 조용히 (우측 패널 라벨로 충분)
    const msg = isRip ? `${label} 진입 — 입질 확률 급상승!` : `${label} 진입 — 채비 정렬 불가, 릴링으로 회수하세요`;
    const t = this.add.text(GAME_WIDTH / 2, 148, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px',
      color: isRip ? '#7fe6b0' : '#ffab54', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setDepth(96).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 200 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2400, duration: 400, onComplete: () => t.destroy() });
  }

  /** 챔질 성공 배너 — HOOK UP! 플래시 */
  private playHookUpEffect(): void {
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, 'HOOK UP!', {
      fontFamily: 'monospace', fontSize: '42px', color: '#4af2a1', fontStyle: 'bold',
      stroke: '#0a1628', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(96).setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: banner, alpha: 0, y: GAME_HEIGHT / 2 - 120, delay: 900, duration: 300, onComplete: () => banner.destroy() });
    // 화면 플래시
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.22).setDepth(95);
    this.tweens.add({ targets: flash, alpha: 0, duration: 260, onComplete: () => flash.destroy() });
  }

  /** 챔질 성공 — 파이팅 돌입 (기존 자동 진입 로직 이관) */
  private enterFight(): void {
    const f = this.pendingFish!;
    this.hookedFish = f;
    this.pendingFish = null;
    this.fpState = 'fighting';
    this.overstrain = 0;
    this.events.emit('Biting');

    // 챔질 순간 미끼 1개 소모 (루어는 닳지 않음)
    if (InventoryStore.hookNeedsBait()) InventoryStore.consumeRigItem('bait');
    this.refreshCoolerUi();

    this.fight = new FightingPhase({
      powerFactor: f.powerFactor,
      tackleA: this.computeTackleA(),
      patternWeights: f.fight.patternWeights,
      intervalMult: f.fight.intervalMult,
      mouthFragility: f.fight.mouthFragility,
    });

    // 물고기 실루엣 접근 연출
    const bx = this.screenX(this.rig.baitX);
    const by = this.depthY(this.rig.baitZ);
    this.fishShadow = this.add.ellipse(bx + 220, WATERLINE + 60, 46, 14, 0x0a1a28, 0.0).setDepth(32);
    this.fishShadow.setScale(0.35);
    this.tweens.add({
      targets: this.fishShadow, x: bx, y: by, scale: 1, alpha: 0.75, duration: 620, ease: 'Quad.easeIn',
    });
    this.tweens.add({ targets: this.floatObj, y: WATERLINE + 30, duration: 300, ease: 'Quad.easeIn', yoyo: true, repeat: 2 });
    this.cameras.main.shake(180, 0.004);
    this.playHookUpEffect();
    this.prevStage = null;
    this.stateText.setText('챔질 성공! 좌클릭 유지 = 릴링 · H = 버티기 — 텐션 30~80 유지!');
  }

  // ── 루어 액션 (호핑 / 트위칭·저킹) ──────────────────
  /** 호핑 — 좌클릭 싱글 탭: 머리만 살짝 위로 들었다 복귀 */
  private doHop(): void {
    if (this.rigPose === 'twitch') return;
    this.rigPose = 'hop';
    this.poseTimer = 0.4;
    this.rig.baitZ = Math.max(0.3, this.rig.baitZ - 0.15);
  }

  /**
   * 트위칭/저킹 — 좌클릭 더블 탭 (쿨다운 0.8초).
   * 탭한 화면 좌/우에 따라 머리가 반대측으로 꺾이고, 수심 1m 상승 후 0.6m 하강.
   */
  private doTwitch(_side: -1 | 1): void {
    if (this.twitchCooldown > 0) return;
    this.twitchCooldown = 0.8;
    this.rigPose = 'twitch';
    this.poseTimer = 0.7;
    const z0 = this.rig.baitZ;
    this.tweens.addCounter({
      from: 0, to: 1, duration: 700,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        // 1m 상승(전반) → 0.6m 하강(후반) — 순변화 -0.4m
        const dz = t < 0.45 ? -(t / 0.45) * 1.0 : -1.0 + ((t - 0.45) / 0.55) * 0.6;
        this.rig.baitZ = Math.max(0.3, Math.min(this.cfg.zMaxM, z0 + dz));
      },
    });
    this.flashState('트위칭! 루어가 튀어오릅니다');
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

    this.stateText = this.add.text(GAME_WIDTH / 2, 16, '채비 흘리는 중 — 우클릭 챔질 · H 뒷줄견제 · C 밑밥 · ↑ 리프트', {
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

    // 수면 거리 + 조류 존 (반탄류에서는 가만히 있어도 거리가 조금씩 늘어난다)
    this.distText = this.add.text(GAME_WIDTH - 18, 38,
      `수면 거리 ${this.cfg.castDistanceM.toFixed(1)}m`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#eaf6ff', fontStyle: 'bold',
        backgroundColor: '#0a162899', padding: { x: 8, y: 4 },
      }).setOrigin(1, 1).setDepth(90);

    // 수심 패널 제목 + 실시간 수치 (패널 본체는 renderDepthPanel에서 그림 — 2배 확장 레이아웃)
    // 패널: px = GAME_WIDTH-368, pw 354. 제목은 패널 중앙, 수치는 게이지 박스 우측 열.
    this.add.text(GAME_WIDTH - 368 + 177, 58, '수심 정보', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7fb8d8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(91);
    this.depthValsText = this.add.text(GAME_WIDTH - 368 + 234, 116, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5', lineSpacing: 12,
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

    // ── 조류 엔진 — 수면 거리(distM) 기반 존 판정 + 힘 벡터 ──
    const hoursNow = new Date().getHours() + new Date().getMinutes() / 60;
    const influence = this.tidal.calc(
      { x: this.rig.baitX, y: this.distM, z: this.rig.baitZ },
      0, hoursNow,
    );
    this.lastTidal = influence;
    // 존 전환 토스트 (조경지대 진입 강조 / 본류 경고)
    if (influence.zone !== this.prevZone) {
      if (this.prevZone !== null && this.fpState === 'drift') {
        this.showZoneToast(influence.zone, influence.label);
      }
      this.prevZone = influence.zone;
    }
    // 반탄류(+Y)/횡류·본류(-Y)로 수면 거리가 변한다
    this.distM = Math.max(1, this.distM + influence.force.y * dt);

    // 조류 벡터 (존별 X 유속 + 완만한 요동)
    const tide: TideVector = {
      x: influence.force.x * (0.85 + 0.15 * Math.sin(this.time.now / 6000)),
      y: 0,
    };

    if (this.fpState === 'drift') this.updateDrift(dt, tide, influence);
    else if (this.fpState === 'fighting') this.updateFighting(dt);

    // 타이머 감쇠
    this.twitchCooldown = Math.max(0, this.twitchCooldown - dt);
    if (this.poseTimer > 0) {
      this.poseTimer -= dt;
      if (this.poseTimer <= 0 && (this.rigPose === 'hop' || this.rigPose === 'twitch' || this.rigPose === 'fall')) {
        this.rigPose = 'idle';
      }
    }

    // 뷰 중심을 찌 쪽으로 서서히 추적
    this.viewCenterX += (this.rig.floatX - this.viewCenterX) * Math.min(1, dt * 1.2);

    this.chum.update(dt, tide, this.cfg.zMaxM);
    this.updateChumSprites(tide);
    this.renderWater(dt);
    this.renderFoam(influence);
    this.renderRigVisuals();
    this.renderRod();
    this.refreshControlBar();
    this.renderTensionVignette();
    this.distText?.setText(`수면 거리 ${this.distM.toFixed(1)}m · ${influence.label}`);
  }

  /** 텐션 위험 비네트 — 파이팅 중 텐션 85+ 시 화면 테두리 붉은 펄스 */
  private renderTensionVignette(): void {
    const g = this.vignetteG;
    g.clear();
    if (this.fpState !== 'fighting' || !this.fight) return;
    const tension = this.fight.tension;
    if (tension <= 82) return;
    const danger = Math.min(1, (tension - 82) / 18);
    const pulse = 0.55 + 0.45 * Math.sin(this.time.now / 110);
    const alpha = 0.16 * danger * pulse + 0.06 * danger;
    const t = 26 + danger * 18;   // 테두리 두께
    g.fillStyle(0xff3a2a, alpha);
    g.fillRect(0, 0, GAME_WIDTH, t);
    g.fillRect(0, GAME_HEIGHT - t, GAME_WIDTH, t);
    g.fillRect(0, t, t, GAME_HEIGHT - t * 2);
    g.fillRect(GAME_WIDTH - t, t, t, GAME_HEIGHT - t * 2);
  }

  /** 조경지대 포말 이펙트 — Hit Zone에 있을 때 찌 주변 수면에 거품 띠 */
  private renderFoam(influence: TidalInfluence): void {
    const inRip = influence.zone === 'rip';
    if (inRip && this.foamParticles.length < 14 && Math.random() < 0.3) {
      const fx = this.screenX(this.rig.floatX) + (Math.random() - 0.5) * 150;
      const foam = this.add.circle(fx, WATERLINE + (Math.random() - 0.5) * 6, 1.5 + Math.random() * 2.5, 0xffffff, 0.5).setDepth(22);
      this.foamParticles.push(foam);
      this.tweens.add({
        targets: foam, alpha: 0, scale: 1.8, duration: 1400 + Math.random() * 900,
        onComplete: () => {
          foam.destroy();
          this.foamParticles = this.foamParticles.filter((f) => f !== foam);
        },
      });
    }
  }

  // ── 흘림(드리프트) 상태 ──────────────────────────────
  private updateDrift(dt: number, tide: TideVector, influence: TidalInfluence): void {
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

    const prevZ = this.rig.baitZ;
    // 조류 존이 침강 속도에 저항 (조경지대 가속 / 본류·강한 횡류 감속)
    const frameParams: RigPhysicsParams = {
      ...this.rigParams,
      tackleWeightG: this.rigParams.tackleWeightG * influence.sinkMult,
    };
    stepUnderwater(this.rig, {
      dtSec: dt, tide, params: frameParams,
      zLimitM: this.zLimitM, zMaxM: this.cfg.zMaxM,
      driftBrake: lt.driftBrake, baitLiftMps: lt.baitLiftMps,
    });

    // 전유동(면사매듭 없음)에서 H 뒷줄견제 = 침강 정지 (그 수심을 조류에 태워 흘림)
    if (!InventoryStore.hasFloatStop && holding) {
      this.rig.baitZ = Math.min(this.rig.baitZ, prevZ);
    }

    // ── 리프트 (방향키 ↑ 홀드): 채비/루어를 수면 쪽으로 — 떼면 다시 침강 ──
    if (this.upKey.isDown) {
      this.rig.baitZ = Math.max(0.3, this.rig.baitZ - 1.1 * dt);
      if (this.rigPose !== 'twitch') { this.rigPose = 'lift'; this.poseTimer = 0.2; }
    } else if (this.rigPose === 'lift') {
      this.rigPose = 'fall';
      this.poseTimer = 1.2;
    }

    // ── 릴링 (좌클릭 홀드 220ms+): 거리 좁힘 + 화면 좌/우측에 따른 방향 당김 ──
    const retrieving = this.reeling && this.time.now - this.pointerDownAt > 220;
    if (retrieving) {
      const p = this.input.activePointer;
      const side = p.x < GAME_WIDTH / 2 ? -1 : 1;   // 좌측 화면 릴링 = 좌로 당김
      const cross = this.tidal.crossSpeedNow(new Date().getHours());
      // 조류 순방향 릴링은 빠르고, 역방향은 저항으로 느리다 (대신 입질 유도 리액션)
      const withCurrent = Math.sign(cross) === side;
      const reelMps = 1.7 * (withCurrent ? 1.4 : 0.65);
      this.distM = Math.max(1, this.distM - reelMps * dt);
      this.rig.floatX += side * (withCurrent ? 0.9 : 0.45) * dt;
      this.rig.baitX += side * (withCurrent ? 0.9 : 0.45) * dt;
      // 릴링하면 채비가 조금씩 상층으로 떠오른다 (루어 리트리브)
      this.rig.baitZ = Math.max(0.3, this.rig.baitZ - 0.28 * dt);
      if (this.rigPose !== 'twitch' && this.rigPose !== 'lift') this.rigPose = 'retrieve';
      if (!withCurrent && Math.random() < dt * 0.5) this.biteEngine.triggerReactionLift();
    } else if (this.rigPose === 'retrieve') {
      this.rigPose = 'idle';
    }

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
      // 조경지대(Hit Zone) 1.6배 / 본대조류 0.35배 — 조류 존 입질 배율
      baseProbPerSec: 0.035 * baitAffinity * indexModifier * influence.biteMult,
      inReefZone: inReef,
      isHold: hold,
      alignmentIndex: this.lineTension.alignmentIndex,
      isHoldingLine: holding,
      chumSyncRate: sync,
      // 낚시터 특성(RegionAreaNode.snagRisk) — high 구역은 밑걸림이 빠르고 잦다
      snagRiskMult: getAreaSnagRiskMult(GameState.currentSpotId),
    });

    // ── 입질 시퀀스 진행 (초릿대 굽힘/찌 잠김 구동) ──
    const seq = this.biteSeq.update(dt);
    this.rodBendDeg = seq.bendAngleDeg;
    this.floatSinkM = seq.floatSinkM;
    // 단계 진입 순간 1회 이펙트 (파문/느낌표/쉐이크 — 강도별)
    if (seq.activeStage !== this.prevStage) {
      if (seq.activeStage !== null) this.playStageEffect(seq.activeStage);
      this.prevStage = seq.activeStage;
    }
    if (seq.ended) {
      // 챔질 없이 어신 종료 — 물고기가 미끼를 따먹고 떠남
      this.pendingFish = null;
      if (InventoryStore.hookNeedsBait()) InventoryStore.consumeRigItem('bait');
      this.refreshCoolerUi();
      this.flashState('입질이 끊겼습니다 — 미끼를 따먹혔을 수 있습니다.');
    }

    // ── UI 게이지 갱신 ──
    this.renderGauges(tick.probPerSec, sync, inReef, hold, tick.snagProgress, tick.actionTimeLeft);

    if (tick.event === 'snagged') {
      this.onSnagged();
    } else if (tick.event === 'bite' && !this.biteSeq.active && !this.pendingFish) {
      // 입질 발생 → 어종 결정 + 입질 시퀀스 시작 (파이팅은 챔질 성공 시에만)
      const nearBottom = this.rig.baitZ >= Math.min(this.zLimitM, this.cfg.zMaxM) - 1.2;
      this.pendingFish = spawnFish(this.buildSpawnCtx(nearBottom && this.isReefAt(this.rig.baitX)));
      this.biteSeq.start({
        speciesId: this.pendingFish.speciesId,
        biteProbPerSec: tick.probPerSec,
      });
      this.stateText.setText('입질 감지! 초릿대를 보고 우클릭으로 챔질하세요');
    }
  }

  /** 현재 채비 미끼 → BaitKey 매핑 (루어 장착 시 'lure') */
  private currentBaitKey(): BaitKey {
    // 바늘 소켓의 루어(가짜미끼)가 미끼보다 우선 — 루어 채비는 미끼 소켓이 비어 있다
    if (!InventoryStore.hookNeedsBait()) return 'lure';
    const id = InventoryStore.rig.bait;
    const item = id ? InventoryStore.find(id) : undefined;
    if (!item) return 'krill';
    const n = item.name;
    if (n.includes('혼무시')) return 'worm_king';
    if (n.includes('지렁이')) return 'worm_blue';
    if (n.includes('크릴')) return 'krill';
    if (n.includes('빵') || n.includes('떡밥')) return 'bread';
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
    const lost = InventoryStore.loseRigParts(['float', 'swivel', 'leader', 'sinker', 'hook', 'bait'] as RigStepKey[]);
    this.failAndExit('밑걸림! 채비를 통째로 잃었습니다',
      `여 밭에 채비가 파묻혀 원줄을 끊었습니다.\n손실: ${lost.length > 0 ? lost.join(', ') : '없음'}\n\n뒷줄견제(H)로 미끼를 띄우면 밑걸림을 예방할 수 있습니다.`);
  }

  // ── 파이팅 상태 ──────────────────────────────────────
  private updateFighting(dt: number): void {
    if (!this.fight || !this.hookedFish) return;

    // ── 텐션 저항: 텐션이 높을수록 릴링이 미끄러진다 (게이지 끝에서 힘겹게 오름) ──
    const tensionNow = this.fight.tension;
    const resist = tensionNow > 70 ? Math.min(0.9, (tensionNow - 70) / 30 * 0.9) : 0;
    const effectiveReeling = this.reeling && Math.random() >= resist;

    // 저항을 이기려는 초과 입력: 한계 텐션(88+)에서 릴링을 계속 누르면 과부하 누적 → 줄터짐
    if (this.reeling && tensionNow > 88) {
      this.overstrain += dt;
      if (this.overstrain > 0.55) {
        this.forceLineBreak();
        return;
      }
    } else {
      this.overstrain = Math.max(0, this.overstrain - dt * 1.5);
    }

    const st = this.fight.update({ dtSec: dt, holding: this.hKey.isDown, reeling: effectiveReeling });
    this.rodBendDeg = 20 + (st.tension / 100) * 45;   // 파이팅 중 초릿대는 텐션 비례로 휨

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
            ? ['float', 'swivel', 'leader', 'sinker', 'hook', 'bait']
            : ['leader', 'sinker', 'hook', 'bait'];
          const lost = InventoryStore.loseRigParts(parts);
          this.failAndExit(floatToo ? '줄터짐! 찌까지 터졌습니다' : '줄터짐! 목줄이 터졌습니다',
            `텐션이 한계를 넘어 ${floatToo ? '찌 위에서' : '목줄이'} 터졌습니다.\n손실: ${lost.join(', ')}\n\nU 채비하기에서 재장착 후 다시 캐스팅하세요.`);
          break;
        }
        case 'hook_off': {
          // 미끼 털림 / 복어류는 목줄째 절단
          if (this.hookedFish?.lineCutter) {
            const lost = InventoryStore.loseRigParts(['leader', 'sinker', 'hook', 'bait'] as RigStepKey[]);
            this.failAndExit('복어가 목줄을 끊었습니다!',
              `날카로운 이빨에 목줄째 잘려나갔습니다.\n손실: ${lost.join(', ')}`);
          } else {
            // 바늘 빠짐 — 바늘은 원줄에 남고 미끼만 털린다 (루어 채비는 손실 없음)
            const lost = InventoryStore.loseRigParts(['bait'] as RigStepKey[]);
            this.failAndExit('미끼가 털렸습니다',
              lost.length
                ? `바늘이 빠지며 미끼를 잃었습니다.\n손실: ${lost.join(', ')}\n\n미끼를 다시 달고 캐스팅하세요.`
                : '바늘이 빠졌습니다. 루어는 무사히 회수했습니다.\n\n다시 캐스팅하세요.');
          }
          break;
        }
        case 'escaped': {
          const lost = InventoryStore.loseRigParts(['bait'] as RigStepKey[]);
          this.failAndExit('놓쳤다! 물고기가 탈출했습니다',
            `${lost.length ? `물고기가 탈출하며 미끼를 채갔습니다.\n손실: ${lost.join(', ')}` : '물고기가 탈출했습니다. 루어는 무사히 회수했습니다.'}\n패턴(바늘털이/여 박기/횡이동)에 맞게 대응하세요.`);
          break;
        }
      }
    }
  }

  /**
   * 과부하 줄터짐 — 한계 텐션에서 저항을 무시하고 릴링을 강행했을 때.
   * (텐션 저항 시스템: 릴링이 미끄러지는데도 초과 입력을 유지하면 강제 파단)
   */
  private forceLineBreak(): void {
    const floatToo = Math.random() < 0.3;
    const parts: RigStepKey[] = floatToo
      ? ['float', 'swivel', 'leader', 'sinker', 'hook', 'bait']
      : ['leader', 'sinker', 'hook', 'bait'];
    const lost = InventoryStore.loseRigParts(parts);
    this.failAndExit('무리한 릴링! 줄이 터졌습니다',
      `한계 텐션에서 릴링을 강행해 라인이 파단됐습니다.\n손실: ${lost.join(', ')}\n\n텐션이 높을 때는 릴링을 멈추고 드랙으로 버티세요.`);
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
      // 개체마다 크기/무게가 다르므로 고유 id 부여 — 같은 어종이라도 병합되면
      // 뒤에 낚인 개체의 실측치가 사라져 수매가가 첫 개체 기준으로 굳어버린다.
      InventoryStore.addItem({
        id: `inv_catch_${f.speciesId}_${InventoryStore.nextCatchSeq()}`,
        name: `${f.nameKo} (${f.lengthCm}cm)`,
        icon: '🐟', iconTexture: fishTexture,
        category: 'food', subCategory: '어획물',
        // 표시/폴백용 기준가 — 실제 수매가는 speciesId·lengthCm·weightG로 산정된다
        basePrice: Math.max(2000, Math.round(f.weightG * 12)),
        condition: 'live', equippable: false,
        speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG,
      }, 1);
      GameState.addCaughtFish(f.speciesId, f.nameKo, f.lengthCm, f.weightG);

      // ── 다관점 히트 (Multi-Hit): 카드 채비의 다른 바늘에도 개별 입질 판정 ──
      const extra = this.rollMultiHit();
      this.refreshCoolerUi();
      const extraLine = extra.length > 0
        ? `\n\n다관점 히트! 카드 채비에 ${extra.length}마리 추가:\n${extra.join(', ')}`
        : '';
      this.finishFight(`${f.nameKo} ${f.lengthCm}cm 낚음!${extra.length > 0 ? ` (+${extra.length})` : ''}`,
        `${f.nameKo} ${f.lengthCm}cm / ${(f.weightG / 1000).toFixed(2)}kg / ${sexLabel}${extraLine}\n\n쿨러 어획 보관함에 넣었습니다.`, '#4af2a1', fishTexture);
    }
  }

  /**
   * 다관점 히트 — 원투 카드 채비의 각 미끼 바늘에 개별 확률(수심층별 오라클)로
   * 추가 어획을 판정한다. 걸린 바늘의 미끼는 소모된다.
   */
  private rollMultiHit(): string[] {
    const sp = InventoryStore.spreader;
    if (!InventoryStore.isSurfRigReady() || sp.kind !== 'CARD_RIG' || !sp.cardType) return [];
    const info = CARD_RIG_INFO[sp.cardType];
    const extra: string[] = [];
    for (let i = 0; i < info.hooks; i++) {
      if (!sp.hookBaits[i]) continue;
      const hz = Math.max(0.3, this.rig.baitZ - (i + 1) * info.gapM);
      const ctx = this.buildSpawnCtx(false);
      ctx.depthZ = hz;
      // 바늘별 독립 판정 — 수심층 친화도에 비례 (기본 18%)
      const p = 0.18 * Math.min(1.6, Math.max(0.4, getBaitAffinity(ctx)));
      if (Math.random() < p) {
        const ef = spawnFish(ctx);
        if (ef.isUndersized || ef.isClosedSeason) continue;
        this.sessionCatch.push(`${ef.nameKo} ${ef.lengthCm}cm`);
        InventoryStore.addItem({
          id: `inv_catch_${ef.speciesId}_${InventoryStore.nextCatchSeq()}`,
          name: `${ef.nameKo} (${ef.lengthCm}cm)`,
          icon: '🐟', iconTexture: FISH_TEXTURE[ef.speciesId],
          category: 'food', subCategory: '어획물',
          basePrice: Math.max(2000, Math.round(ef.weightG * 12)),
          condition: 'live', equippable: false,
          speciesId: ef.speciesId, lengthCm: ef.lengthCm, weightG: ef.weightG,
        }, 1);
        GameState.addCaughtFish(ef.speciesId, ef.nameKo, ef.lengthCm, ef.weightG);
        InventoryStore.setSpreaderBait(i, null);   // 해당 단 미끼 소모
        extra.push(`${ef.nameKo} ${ef.lengthCm}cm`);
      }
    }
    return extra;
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
    this.biteSeq.reset();
    this.hookedFish = null;
    this.pendingFish = null;
    this.rodBendDeg = 0;
    this.floatSinkM = 0;
    this.distM = this.cfg.castDistanceM;
    this.overstrain = 0;
    this.rigPose = 'idle';
    this.floatObj.setY(WATERLINE);
    this.refreshCoolerUi();
    this.stateText.setText('채비 흘리는 중 — 우클릭 챔질 · H 뒷줄견제 · C 밑밥 · ↑ 리프트');
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
    // 입질 단계별 찌 잠김 (1단계 0.05m / 2단계 0.10m / 3단계 0.25m) — 시각 배율 x3
    const sinkPx = this.floatSinkM * this.pxPerMZ * 3;
    if (this.fpState !== 'fighting') this.floatObj.setPosition(fx, WATERLINE + wave + sinkPx);
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

    // ── 우측 상단 수심 정보 패널 (전용 레이어 — 낚싯대와 겹치지 않음) ──
    this.panelG.clear();
    this.renderDepthPanel(this.panelG);
  }

  /**
   * 우측 상단 수심 모식도 — 상단 거리축(채비→나) + 수심층(상/중/바닥) +
   * 찌(수면 경계)/면사매듭/채비 자세 아이콘 + 원투 다단 훅 도트.
   */
  private renderDepthPanel(g: Phaser.GameObjects.Graphics): void {
    // 2배 확장 레이아웃 — 좌측 넓은 게이지 박스(채비 좌우 이동까지 표현) + 우측 텍스트 열
    const pw = 354;
    const ph = 302;
    const px = GAME_WIDTH - pw - 14;
    const py = 44;
    const boxX = px + 14;                 // 게이지 박스 좌측
    const boxW = 206;                     // 게이지 박스 폭 (넓게)
    const gaugeTop = py + 66;
    const gaugeH = ph - 92;
    const centerX = boxX + boxW / 2;      // 찌 기준 수직선

    // 패널 배경
    g.fillStyle(0x0a1628, 0.88);
    g.fillRoundedRect(px, py, pw, ph, 6);
    g.lineStyle(1.2, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(px, py, pw, ph, 6);

    // ── 상단 거리축: [채비] ──▶── [나] — 릴링으로 거리가 좁혀지면 좌→우 이동 ──
    const axL = px + 18, axR = px + pw - 20, axY = py + 34;
    g.lineStyle(1.4, 0x3a6a92, 0.9);
    g.lineBetween(axL + 12, axY, axR - 12, axY);
    g.fillStyle(0x3a6a92, 0.9);
    g.fillTriangle(axR - 12, axY - 4, axR - 12, axY + 4, axR - 4, axY);
    // 좌: 채비(물고기) / 우: 사람(나)
    g.fillStyle(0x7fb8d8, 1);
    g.fillEllipse(axL + 5, axY, 11, 7);
    g.fillTriangle(axL + 10, axY, axL + 15, axY - 3.5, axL + 15, axY + 3.5);
    g.fillStyle(0xffce54, 1);
    g.fillCircle(axR, axY - 6, 3.4);
    g.fillRect(axR - 2, axY - 3, 4, 9);
    // 현재 거리 마커
    const maxD = Math.max(this.cfg.castDistanceM, this.distM, 1);
    const dRatio = 1 - Phaser.Math.Clamp(this.distM / maxD, 0, 1);
    const mx = axL + 18 + (axR - axL - 36) * dRatio;
    g.fillStyle(0x4af2a1, 1);
    g.fillEllipse(mx, axY, 10, 6);
    g.fillTriangle(mx + 5, axY, mx + 9, axY - 3, mx + 9, axY + 3);

    const bottomM = this.cfg.zMaxM;
    const yOf = (z: number): number => gaugeTop + (Phaser.Math.Clamp(z, 0, bottomM) / bottomM) * gaugeH;

    // ── 게이지 박스 (넓은 수직 단면) ──
    g.fillStyle(0x0f2a40, 0.9);
    g.fillRoundedRect(boxX, gaugeTop, boxW, gaugeH, 4);
    g.lineStyle(1, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(boxX, gaugeTop, boxW, gaugeH, 4);

    // 수심층 경계 (상/중/바닥 — 박스 전체 폭 가로선, 캡처 3 명세)
    g.lineStyle(1, 0x33b0e0, 0.4);
    g.lineBetween(boxX + 4, yOf(bottomM * 0.33), boxX + boxW - 4, yOf(bottomM * 0.33));
    g.lineBetween(boxX + 4, yOf(bottomM * 0.72), boxX + boxW - 4, yOf(bottomM * 0.72));

    // 채비 좌우 편차 (조류/릴링에 따른 X 이동 — 찌 기준)
    const latPx = Phaser.Math.Clamp((this.rig.baitX - this.rig.floatX) * 10, -(boxW / 2 - 24), boxW / 2 - 24);
    const rigX = centerX + latPx;

    // 침강 라인 (찌 → 채비, 좌우 편차 반영 사선)
    g.lineStyle(1.4, 0x9fd0e4, 0.8);
    g.lineBetween(centerX, yOf(this.floatSinkM), rigX, yOf(this.rig.baitZ));

    // 찌 — 수면(0m) 상단 경계에 걸침 + 입질 잠김 반영
    g.fillStyle(0xff6a2a, 1);
    g.fillEllipse(centerX, yOf(this.floatSinkM) - 2, 11, 9);
    g.fillStyle(0xfff4e0, 1);
    g.fillEllipse(centerX, yOf(this.floatSinkM) + 4, 8, 7);

    // 면사매듭 한계선 (박스 전체 폭 — 전유동이면 표시하지 않음)
    if (Number.isFinite(this.zLimitM)) {
      const zlY = yOf(Math.min(this.zLimitM, bottomM));
      g.lineStyle(2, 0xffce54, 1);
      g.lineBetween(boxX + 4, zlY, boxX + boxW - 4, zlY);
    }

    // ── 채비/루어 아이콘 (자세 애니메이션 — 머리는 내 위치인 우측을 향함) ──
    const bz = yOf(this.rig.baitZ);
    const poseAng: Record<typeof this.rigPose, number> = {
      idle: 8, lift: -40, fall: 42, retrieve: 0, twitch: -34, hop: -24,
    };
    const ang = Phaser.Math.DegToRad(poseAng[this.rigPose]);
    const hx = Math.cos(ang), hy = Math.sin(ang);
    g.lineStyle(5, 0x4af2a1, 1);
    g.lineBetween(rigX + hx * 8, bz + hy * 8, rigX - hx * 8, bz - hy * 8);
    g.fillStyle(0xd6ffe8, 1);
    g.fillCircle(rigX + hx * 9, bz + hy * 9, 3);
    g.lineStyle(2.2, 0x4af2a1, 1);
    g.lineBetween(rigX - hx * 8, bz - hy * 8, rigX - hx * 12, bz - hy * 12 - 3.5);
    g.lineBetween(rigX - hx * 8, bz - hy * 8, rigX - hx * 12, bz - hy * 12 + 3.5);
    // 리트리브 물결 (수평 이동 시 꼬리 뒤 파문)
    if (this.rigPose === 'retrieve') {
      g.lineStyle(1.2, 0xbfe4f8, 0.8);
      for (let w = 0; w < 3; w++) {
        const wx = rigX - 15 - w * 7;
        g.beginPath();
        g.arc(wx, bz, 4, -0.9, 0.9);
        g.strokePath();
      }
    }

    // ── 원투 카드 채비: 다단 훅 도트 (봉돌 위로 간격 배열) ──
    const sp = InventoryStore.spreader;
    const surfMode = InventoryStore.isSurfRigReady() && sp.kind !== 'NONE';
    if (surfMode && sp.kind === 'CARD_RIG' && sp.cardType) {
      const info = CARD_RIG_INFO[sp.cardType];
      for (let i = 0; i < info.hooks; i++) {
        const hz = Math.max(0.3, this.rig.baitZ - (i + 1) * info.gapM);
        const hyPx = yOf(hz);
        const baited = !!sp.hookBaits[i];
        g.fillStyle(baited ? 0xffe28a : 0x5d6f7e, 1);
        g.fillCircle(rigX + 20, hyPx, 3.2);
        g.lineStyle(1, 0x8898a8, 0.7);
        g.lineBetween(rigX + 12, hyPx, rigX + 17, hyPx);
      }
    }

    // 바닥 (Z_max) — 박스 전체 폭, 원투 모드는 밀착 강조
    const inReefHere = this.isReefAt(this.rig.baitX);
    g.fillStyle(inReefHere ? 0x4a4438 : 0x8a7a58, 1);
    g.fillRect(boxX + 3, yOf(bottomM) - (surfMode ? 4 : 2), boxW - 6, surfMode ? 9 : 6);
    if (surfMode) {
      g.lineStyle(1.5, 0xffce54, 0.8);
      g.lineBetween(boxX + 3, yOf(bottomM) - 4, boxX + boxW - 3, yOf(bottomM) - 4);
    }

    // ── 우측 텍스트 열 (게이지 박스 밖 — 캡처 3 명세) ──
    const zoneLabel = this.lastTidal ? this.lastTidal.label.replace(' (Hit Zone)', '') : '';
    const hitZone = this.lastTidal?.zone === 'rip';
    this.depthValsText?.setText([
      `찌  ${this.floatSinkM > 0 ? `-${this.floatSinkM.toFixed(2)}m` : '0m'}`,
      Number.isFinite(this.zLimitM) ? `매듭  ${this.zLimitM}m` : '매듭 없음 (전유동)',
      `채비  ${this.rig.baitZ.toFixed(1)}m`,
      `바닥  ${bottomM.toFixed(0)}m`,
      inReefHere ? '여 밭 (암초)' : '모래/갯벌',
      hitZone ? `${zoneLabel} ★` : zoneLabel,
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

  /**
   * 낚싯대 뷰 (우측) — 초릿대가 입질/텐션에 따라 수면 쪽 대각선(화면 중앙 방향)으로
   * 구부러진다 (rodBendDeg 구동). 대는 화면 위로 길게 뻗는다.
   */
  private renderRod(): void {
    const g = this.rodG;
    g.clear();

    const baseX = GAME_WIDTH - 30;
    const baseY = GAME_HEIGHT - 8;
    const fx = this.screenX(this.rig.floatX);
    const fy = WATERLINE;

    // 기저 휨: H 견제/기본 자세 — 입질(rodBendDeg)이 여기에 더해진다
    const baseTension = this.fight ? 0.12 : (this.hKey?.isDown ? 0.18 : 0.06);
    // 초릿대(팁) 굽힘 각도 (도) — 입질 시퀀스/파이팅이 갱신
    const bendDeg = this.rodBendDeg;

    // ── 하단 70%: 몸통 (완만한 베지어) ──
    // 초릿대가 우측 수심 패널(x≈912~) 뒤에 가려지지 않도록 팁을 패널 왼쪽 바깥에 배치
    const bodyTipX = GAME_WIDTH - 448;
    const bodyTipY = 300 + baseTension * 60;

    const bodySegs = 10;
    let prevX = baseX, prevY = baseY;
    let dirX = 0, dirY = 0;
    for (let i = 1; i <= bodySegs; i++) {
      const t = i / bodySegs;
      const cx = baseX - 150, cy = baseY - 300 + baseTension * 100;
      const px = (1 - t) * (1 - t) * baseX + 2 * (1 - t) * t * cx + t * t * bodyTipX;
      const py = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * cy + t * t * bodyTipY;
      g.lineStyle(6.5 - t * 3.6, i < 3 ? 0x27170d : 0xe8e4da, 1);
      g.lineBetween(prevX, prevY, px, py);
      if (i % 3 === 0) {
        g.lineStyle(1, 0x8898a8, 0.9);
        g.strokeCircle(px, py + 3, 2.6);
      }
      dirX = px - prevX; dirY = py - prevY;
      prevX = px; prevY = py;
    }

    // ── 상단 30%: 초릿대 — 누적 곡률로 수면(좌하단 대각선) 방향 벤딩 ──
    // bendDeg 0이면 몸통 방향 그대로, 60도면 끝이 크게 꺾여 수면을 향한다.
    // 세그먼트 길이를 짧게 잡아 끝이 화면 밖으로 나가지 않는다 (~140px).
    const tipSegs = 7;
    const segLen = Math.hypot(dirX, dirY) * 0.52;
    let ang = Math.atan2(dirY, dirX);
    // 굽힘 방향: 화면 중앙·수면 쪽 (좌하단) = 각도 증가 방향
    const bendPerSeg = (bendDeg * Math.PI / 180) / tipSegs;
    for (let i = 1; i <= tipSegs; i++) {
      ang += bendPerSeg;
      const px = prevX + Math.cos(ang) * segLen * (1 - i * 0.05);
      const py = prevY + Math.sin(ang) * segLen * (1 - i * 0.05);
      g.lineStyle(2.6 - i * 0.24, 0xf4f0e6, 1);
      g.lineBetween(prevX, prevY, px, py);
      if (i === 4) {
        g.lineStyle(1, 0x8898a8, 0.9);
        g.strokeCircle(px, py + 2, 2);
      }
      prevX = px; prevY = py;
    }
    // 초릿대 끝 표식 (형광 팁)
    g.fillStyle(bendDeg > 40 ? 0xff5a4a : bendDeg > 15 ? 0xffce54 : 0xff8a3d, 1);
    g.fillCircle(prevX, prevY, 3);

    // 릴
    g.fillStyle(0x2a2a30, 1);
    g.fillCircle(baseX - 26, baseY - 44, 9);
    g.fillStyle(0x9aa4b0, 1);
    g.fillCircle(baseX - 26, baseY - 44, 4);

    // 원줄: 초릿대 끝 → 찌
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
