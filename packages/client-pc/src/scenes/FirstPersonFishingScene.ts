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
 *  + 밑밥 3D 파슬(stepChum — 좌우 X·원근거리 D·수심 Z 통합 드리프트/동조)
 *  + BiteProbabilityEngine(입질/밑걸림)
 *  → bite → FishSpawningOracle(어종 결정) → FightingPhase(텐션 파이팅)
 *
 * 회수 세트 (2026-07-22): 릴링으로 distM이 줄수록 채비 세트(retrieveGroup —
 *  찌 채비 = 찌+목줄+봉돌+미끼 / 루어 = 루어 단독)가 easeOutCubic으로 화면
 *  중앙~하단 중간 앵커까지 커지며(최대 ×2) 다가온다. 원줄(초릿대→세트 top)은
 *  컨테이너 밖에서 매 프레임 재드로우. 파이트 제압(dragIn) 물고기는 세트에 편입.
 *
 * 조작: H = 뒷줄견제 · C/밑밥칸 클릭 = 밑밥 투척(투척점 커서 스냅) ·
 *        좌클릭 유지 = (파이팅) 릴링 · SPACE = 다시 캐스팅(결과 후) ·
 *        ESC/그만하기 = 필드 복귀 (stop + resume)
 */

import Phaser from 'phaser';
import {
  createUnderwaterRig, stepUnderwater, isHoldState,
  UnderwaterRigState, RigPhysicsParams, TideVector,
  LineTensionPhysics, BiteProbabilityEngine,
  ChumParcel, createChumParcel, stepChum, maxChumSync, predictChumPath,
  spawnFish, SpawnedFish, FightingPhase, FightStatus,
  calculateTideInfo, getBaitAffinity, BaitKey, SpawnContext,
  getAreaSnagRiskMult,
  BiteSequenceEngine, TidalCurrentEngine, TidalInfluence,
  SeabedProfile, HOLD_LIFT_M, kstHour,
  LureSpec, LureSinkProfile, getLureSinkProfile, jigHeadWeightById,
  computeFeedingActivity, feedingRegionProfileOf, FeedingActivityResult,
  getMovementProfile, pickRunHeading,
  FishFatigueModel, FatigueTick, FATIGUE_PHASE_LABEL,
  TUNING,
} from '@tra/core';
import { drawRigIcon, fishHeadPoint, RigIconKind } from '../ui/RigIconRenderer.js';
import { GameState } from '../store/GameState.js';
import { InventoryStore, RigStepKey, CARD_RIG_INFO } from '../store/InventoryStore.js';
import { CoolerStore, COOLER_CAPACITY } from '../store/CoolerStore.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from '../ui/DraggablePanel.js';
import { CoolerPanel } from '../ui/CoolerPanel.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { ItemDetailPanel } from '../ui/ItemDetailPanel.js';
import { GuidePanel } from '../ui/GuidePanel.js';
import { GuideCatKey } from '../data/GuideContent.js';
import { loadSettings } from './SettingsScene.js';

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
  /**
   * 탑다운 필드 이벤트(보일링/스쿨링) 착수 보너스 —
   * 착수점이 이벤트 패치와 겹칠 때 RegionFieldScene이 산출해 전달.
   */
  fieldEvent?: {
    kind: 'boiling' | 'schooling';
    /** 입질 확률 배율 (보일링 중심 직격은 1 미만 페널티) */
    biteMult: number;
    /** 이벤트 어종 가중 (스폰 오라클 speciesWeightBias에 병합) */
    speciesBias?: Record<string, number>;
    /** 보일링 히트 — 회유어 크기 tier 상향 */
    tierBoost?: boolean;
    /** HUD 안내 라벨 */
    label: string;
  };
}

type FpState = 'drift' | 'fighting' | 'result';

/** 어획 결정/안내 패널 버튼 정의 */
interface DecisionButton {
  label: string;
  fill: number;
  stroke: number;
  color: string;
  onClick: () => void;
  /** 비활성 (회색 렌더 + 클릭 시 disabledHint 안내) */
  disabled?: boolean;
  disabledHint?: string;
}

// ── 화면 상수 ──────────────────────────────────────
const WATERLINE = 268;
const PX_PER_M_X = 24;
/**
 * 회수 수렴 앵커/최대 배율/투척점 수 등 튜닝 스칼라는 TUNING(core 단일 소스)에서
 * 매 프레임 읽는다 — dev 튜닝 패널(F8)의 슬라이더 변경이 리빌드 없이 반영된다.
 *  anchorY = GAME_HEIGHT × TUNING.retrieve.anchorYRatio (기본 0.75 = 중앙~하단 중간)
 *  scale   = BASE_RIG_SCALE × (1 + p·(scaleMax − 1))     (기본 최대 ×2)
 */
/** 채비 세트 기본 스케일 (원거리) */
const BASE_RIG_SCALE = 0.72;
/** 밑밥 투척점 간격 (m) — 개수는 TUNING.chumThrow.pointCount */
const CHUM_THROW_SPACING_M = 1.5;

/** 어종 → 실사 픽셀 생선 이미지 텍스처 (어획 팝업/아이템 상세 표시용) */
const FISH_TEXTURE: Record<string, string> = {
  black_seabream: 'fish_black_sea_bream',
  flatfish: 'fish_halibut',
  largescale_blackfish: 'fish_largescale_blackfish',   // 벵에돔
  longtail_blackfish: 'fish_longtail_blackfish',       // 긴꼬리벵에돔
  // 2026-07-22 추가 (food assets/)
  squid: 'fish_squid',                     // 무늬오징어
  hairtail: 'fish_hairtail',               // 갈치
  cuttlefish: 'fish_cuttlefish',           // 갑오징어
  blue_rockfish: 'fish_blue_rockfish',     // 청볼락
  filefish: 'fish_filefish',               // 쥐치
  golden_rockfish: 'fish_golden_rockfish', // 황볼락
  sea_bass: 'fish_sea_bass',               // 농어
  amberjack: 'fish_amberjack',             // 부시리
  yellowtail: 'fish_yellowtail',           // 방어
  striped_mullet: 'fish_striped_mullet',   // 숭어
  redlip_mullet: 'fish_redlip_mullet',     // 가숭어
  spotted_knifejaw: 'fish_spotted_knifejaw', // 강담돔
  red_seabream: 'fish_red_seabream',       // 참돔
  night_seabream: 'fish_red_seabream',     // 참돔(야간) — 같은 생물종이라 이미지 공용
  horse_mackerel: 'fish_horse_mackerel',   // 전갱이
  chub_mackerel: 'fish_chub_mackerel',     // 고등어
  // 2026-07-22 2차 추가
  greenling: 'fish_greenling',             // 놀래미
  fat_greenling: 'fish_fat_greenling',     // 쥐노래미
  surfperch: 'fish_surfperch',             // 망상어
};

/**
 * 어획 개체 → 텍스처 해소.
 *  - 돌돔(stone_beakperch): 40cm를 넘어야 암수 구별 — 수컷만 줄무늬 소실.
 *    40cm 미만은 개체 성별과 무관하게 암컷(무늬 유지) 이미지를 쓴다.
 *  - 용치놀래기(rainbow_wrasse): 암컷→수컷 성전환 — 성별에 따라 체색이 완전히 달라
 *    암/수 이미지를 분기한다 (수컷 = 화려한 녹색 혼인색).
 */
function resolveFishTexture(speciesId: string, lengthCm: number, sex: 'M' | 'F'): string | undefined {
  if (speciesId === 'stone_beakperch') {
    return (lengthCm >= 40 && sex === 'M') ? 'fish_stone_beakperch_male' : 'fish_stone_beakperch_female';
  }
  if (speciesId === 'rainbow_wrasse') {
    return sex === 'M' ? 'fish_rainbow_wrasse_male' : 'fish_rainbow_wrasse_female';
  }
  return FISH_TEXTURE[speciesId];
}

export class FirstPersonFishingScene extends Phaser.Scene {
  private cfg!: FirstPersonFishingInit;
  private fpState: FpState = 'drift';

  // 물리 모듈
  private rig!: UnderwaterRigState;
  private rigParams!: RigPhysicsParams;
  private lineTension!: LineTensionPhysics;
  private biteEngine!: BiteProbabilityEngine;

  // ── 밑밥 3D 파슬 (좌우 X · 원근거리 D · 수심 Z — core stepChum 구동) ──
  private chumParcels: ChumParcel[] = [];
  /** 현재 선택된 투척점 인덱스 (커서 X 최근접 스냅) */
  private chumThrowIdx = Math.floor(TUNING.chumThrow.pointCount / 2);
  /** 선택 투척점의 궤적 최대 동조율 예측 (미표시 시 -1) */
  private chumPredPeak = -1;
  /** 투척점 행/예측 고스트/파슬 구름 전용 레이어 */
  private chumG!: Phaser.GameObjects.Graphics;
  private fight: FightingPhase | null = null;
  private hookedFish: SpawnedFish | null = null;

  private zLimitM = 5;
  private pxPerMZ = 30;
  private tideBase = 0.3;
  private viewCenterX = 0;

  // ── 입질 시퀀스 / 챔질 (2026-07-17 — 자동 파이팅 진입 대체) ──
  private biteSeq = new BiteSequenceEngine();

  /** 피딩타임 활성도 (계절 시간창×조류×날씨 — 60초 주기 갱신, 입질 확률 공통 배율) */
  private feeding: FeedingActivityResult = {
    activity: 1, seasonWindow: 1, tideFactor: 1, weatherFactor: 1, label: '보통',
  };
  /** 입질 시퀀스 대상 물고기 (챔질 성공 시 hookedFish로 승격) */
  private pendingFish: SpawnedFish | null = null;
  /** 현재 초릿대 굽힘 각도 (도) — 입질/파이팅 렌더 공용 */
  private rodBendDeg = 0;
  /** 낚싯대 화면 위치 (설정 연동 — 화면 중앙 기준 좌/우) */
  private rodSide: 'left' | 'right' = 'right';
  /** 릴 핸들 위치 (설정 연동 — 로드 기준 좌/우) */
  private reelHandleSide: 'left' | 'right' = 'left';
  /** 찌 잠김 깊이 (m) — 입질 단계별 0.05/0.10/0.25 */
  private floatSinkM = 0;
  /** 원투(찌 없이 도래 직결) 모드 — 찌 없이 초릿대 끝으로 입질 판단 */
  private surfMode = false;

  // ── 파이트 2D 시뮬 (상단 앵커 수중 단면 좌표 — 렌더는 정면/수평/수직뷰가 담당) ──
  /** 무대 로컬 좌표 (원 중심 원점, +y 아래=수심) */
  private f2dPos = { x: 0, y: 90 };
  private f2dHeading = Math.PI / 2;
  private f2dRunTimer = 0;
  private f2dPrevPattern: string = 'none';
  private f2dProfile = getMovementProfile('default');
  /** ←/→ 로드 스티어 키 */
  private steerLeftKey?: Phaser.Input.Keyboard.Key;
  private steerRightKey?: Phaser.Input.Keyboard.Key;
  /** 파이트 물고기 깊이 정규화(0=수면~1=깊음) — 찌 투명도/실루엣 알파 연동 */
  private fightDepthNorm = 0;
  /**
   * 제압 후 끌어오기 모드 — 랜딩 판정(progress 100)이 나도 수면 거리가 발앞(3m)보다
   * 멀면 즉시 랜딩하지 않고, 지친 고기를 릴링으로 질질 끌어와야 랜딩된다.
   */
  private dragInMode = false;
  /** 좌측 수평뷰(plan) 전용 그래픽스 */
  private planG!: Phaser.GameObjects.Graphics;
  /** 파이트 피로 모델 (RUN/LULL/SURGE/SPENT — thrust 게이트) */
  private fatigue: FishFatigueModel | null = null;
  private lastFatigue: FatigueTick | null = null;
  /** 정면 뷰 채비/물고기 표시 heading — 머리가 먼저 돌고 몸이 따라오는 선행 lerp */
  private visHeading = 0;
  /** 수평뷰(plan) 이동 방향 추적용 이전 프레임 (baitX, distM) */
  private planPrev = { x: 0, d: 0 };
  private planHeading = -Math.PI / 2;
  /** 루어 모드 (rigMode === 'lure') — 찌 없이 루어 자체 침강/리트리브 */
  private lureMode = false;
  /** 장착 루어 스펙 (루어 모드일 때) */
  private lureSpec?: LureSpec;
  /** 루어 침강 프로파일 (sinkType/sinkRate/dive) */
  private lureSink?: LureSinkProfile;
  /** 루어 액션 반응형 입질 배율 (방치 0.15 ~ 트위칭 3.0, 지깅 보정) — 게이지 표기용 */
  private lureActionMult = 1;
  /** 입질 유도용 연속 릴링 시간 (초) — 1~2단계 중 1초 릴링 시 provoke */
  private provokeReelT = 0;

  // ── 조류 (TidalCurrentEngine) ──
  private tidal!: TidalCurrentEngine;
  /** 수면 거리 (m) — 반탄류로 늘고 릴링으로 준다 */
  private distM = 0;

  // ── 해저 지형 프로필 (거리 연속 — 지형 지도/실측 수심/밑걸림 위험도 연동) ──
  private seabed!: SeabedProfile;
  /** 뒷줄견제 홀드 앵커 수심 (H 누른 순간 -0.2m 지점, 떼면 null) */
  private holdAnchorZ: number | null = null;

  // ── 실시간 날씨 파티클 (하늘 배경 연동 — 2026-07-20) ──
  private fpRainDrops: { obj: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  private fpSnowFlakes: { obj: Phaser.GameObjects.Arc; speed: number; sway: number }[] = [];
  private fpFogBlobs: { obj: Phaser.GameObjects.Ellipse; speed: number }[] = [];
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

  // ── 가이드/이펙트 (2026-07-23 — 통합 가이드 허브로 일원화) ──
  /** 통합 가이드 허브 (파이트·회수·밑밥·회뜨기 — GuidePanel, 구 텍스트 가이드 대체) */
  private guideHub?: GuidePanel;
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
  /**
   * 회수 세트 컨테이너 — 로드팁 아래 물리 채비를 한 덩어리로 (모드별 구성):
   *  찌 채비 = 찌+목줄+봉돌+미끼(+제압 물고기) / 루어 = 루어(+물고기, 찌 없음).
   * scale/pos/alpha는 이 컨테이너에만 적용 — 원줄(초릿대→세트 top)은 컨테이너
   * 밖(renderRod)에서 매 프레임 재드로우 (scale로 굵기·길이가 왜곡되지 않게 분리).
   */
  private retrieveGroup!: Phaser.GameObjects.Container;
  /** 세트 내용 드로잉 (로컬 좌표 — (0,0) = 세트 top 앵커) */
  private setG!: Phaser.GameObjects.Graphics;
  /** 세트 top 앵커 월드 좌표 — 원줄(초릿대→세트) 연결점 */
  private groupTopWorld = { x: GAME_WIDTH / 2, y: WATERLINE };
  private fishShadow?: Phaser.GameObjects.Ellipse;

  // UI
  private uiG!: Phaser.GameObjects.Graphics;
  private probText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private patternText!: Phaser.GameObjects.Text;
  private depthValsText!: Phaser.GameObjects.Text;
  private coolerCatchText!: Phaser.GameObjects.Text;
  private coolerChumText!: Phaser.GameObjects.Text;
  /** 어창(쿨러) 3x3 팝업 — 열림 중 낚시 입력 차단 */
  private coolerPanel?: CoolerPanel;
  /** 인벤토리 팝업 (I 토글) — 쿨러 드래그 이송의 대상. 열림 중 낚시 입력 차단 */
  private invPanel?: InventoryPanel;
  /** 인벤토리에서 연 아이템 상세 팝업 */
  private fpDetailPanel?: ItemDetailPanel;
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
    this.chumParcels = [];
    this.chumThrowIdx = Math.floor(TUNING.chumThrow.pointCount / 2);
    this.chumPredPeak = -1;
    this.groupTopWorld = { x: GAME_WIDTH / 2, y: WATERLINE };
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
    this.guideHub = undefined;
    this.prevStage = null;
    this.prevZone = null;
    this.holdAnchorZ = null;
    this.fpRainDrops = [];
    this.fpSnowFlakes = [];
    this.fpFogBlobs = [];
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

    // 해저 지형 프로필 — 지형 지도 연동:
    //  시드 = 착수 타일 해시 / 원거리 수심 = 실측 Z_max / 암초 비율 = 낚시터 snagRisk
    //  (snagRiskMult low 0.6 → 암초 21% / mid 1.0 → 35% / high 1.6 → 56%)
    const snagMult = getAreaSnagRiskMult(GameState.currentSpotId);
    const rockRatio = Phaser.Math.Clamp(0.35 + (snagMult - 1) * 0.35, 0.15, 0.6);
    this.seabed = new SeabedProfile(
      this.cfg.reefSeed,
      this.cfg.zMaxM,
      Math.max(12, this.cfg.castDistanceM * 1.15 + 20),
      rockRatio,
    );

    // 물리 초기화 (밑밥은 3D 파슬 배열 — init에서 리셋됨)
    this.rig = createUnderwaterRig(0);
    this.rigParams = this.computeRigParams();
    this.lineTension = new LineTensionPhysics();
    this.biteEngine = new BiteProbabilityEngine();

    // 피딩타임 활성도 — 60초 주기 갱신 (시간창/조류/날씨가 느리게 변하므로 충분)
    this.refreshFeedingActivity();
    this.time.addEvent({ delay: 60_000, loop: true, callback: () => this.refreshFeedingActivity() });

    // 설정 연동: 로드 화면 위치(좌/우) + 릴 핸들 위치(로드 기준 좌/우)
    const settings = loadSettings();
    this.rodSide = settings.rodSide;
    this.reelHandleSide = settings.reelHandle;

    // 채비 모드 판별 — 루어 모드 우선, 아니면 원투(찌 없이 도래 직결) 여부
    this.lureMode = InventoryStore.rigMode === 'lure';
    if (this.lureMode) {
      this.lureSpec = InventoryStore.getEquippedLureSpec();
      if (this.lureSpec) {
        this.lureSink = getLureSinkProfile(this.lureSpec, jigHeadWeightById(InventoryStore.jigHeadId));
      }
    }
    // 루어/원투 모두 찌 없이 초릿대 끝으로 입질 판단 (수면 찌 미표시)
    this.surfMode = this.lureMode || InventoryStore.isSurfRigReady();

    this.buildBackdrop();
    this.dynamicG = this.add.graphics().setDepth(30);
    this.chumG = this.add.graphics().setDepth(33);    // 밑밥 투척점/고스트/파슬 구름
    this.buildRetrieveGroup();                        // 회수 세트 컨테이너 (depth 35)
    this.rodG = this.add.graphics().setDepth(60);
    this.panelG = this.add.graphics().setDepth(85);   // 수심 모식도 — 낚싯대 위
    this.buildUi();

    // 입력
    this.hKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    // ←/→ — 파이팅: 로드 스티어 (폴링) / 드리프트(루어): 다트 횡 트위칭 (keydown)
    this.steerLeftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.steerRightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.input.keyboard!.on('keydown-LEFT', () => this.doDart(-1));
    this.input.keyboard!.on('keydown-RIGHT', () => this.doDart(1));
    this.input.keyboard!.on('keydown-C', () => this.tossChum());
    this.input.keyboard!.on('keydown-I', () => this.toggleFpInventory());
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.guideHub) { this.closeGuideHub(); return; }
      if (this.invPanel) { this.closeFpInventory(); return; }
      if (this.coolerPanel) {
        // 강제 방생 모드는 ESC로 닫을 수 없다 — 방생을 끝내야 진행
        if (!this.coolerPanel.lockedOpen) this.closeCoolerPanel();
        return;
      }
      this.exitToField();
    });
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.coolerPanel || this.invPanel || this.guideHub) return;
      if (this.fpState === 'result') this.recast();
    });
    // 우클릭 = 챔질 (입질 시퀀스 판정) / 좌클릭 = 릴링(홀드)·루어 액션(탭/더블탭)
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.guideHub || this.coolerPanel || this.invPanel) return;   // 가이드/어창/인벤 열림 중엔 낚시 입력 차단
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
    this.buildGuideBookButton();
    this.buildChumGuideButton();
    // F1 또는 / (물음표) 키 = 가이드 허브 토글
    this.input.keyboard!.on('keydown-F1', () => this.toggleGuideHub());
    this.input.keyboard!.on('keydown-FORWARD_SLASH', () => this.toggleGuideHub());
    // 첫 진입 시 회수/조작 가이드 1회 자동 표시 (세이브 플래그 —
    // 구 텍스트 가이드를 본 레거시 유저(localStorage)는 건너뛴다)
    if (!GameState.getFlag('guideSeen.retrieve') && !localStorage.getItem('tra_fp_guide_seen')) {
      GameState.setFlag('guideSeen.retrieve');
      this.time.delayedCall(400, () => this.openGuideHub('retrieve'));
    }

    this.cameras.main.fadeIn(320, 2, 12, 24);
  }

  // ═══════════════════════════════════════════════════
  // 온보딩 가이드 / 도움말 (첫 진입 튜토리얼 + F1 재열람)
  // ═══════════════════════════════════════════════════
  /** 하단 상태별 조작 가이드 바 — 상황에 맞는 키만 노출 */
  private buildControlBar(): void {
    // 쿨러(뚜껑 상단 ≈ GAME_HEIGHT-110)와 겹치지 않게 위로 띄움 (2026-07-20 가시성 개선)
    const bg = this.add.graphics().setDepth(94);
    bg.fillStyle(0x0a1628, 0.78);
    bg.fillRoundedRect(GAME_WIDTH / 2 - 330, GAME_HEIGHT - 152, 660, 22, 4);
    this.controlBarText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 141, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
    }).setOrigin(0.5).setDepth(95);
    this.refreshControlBar();
  }

  /** 상태별 조작 바 내용 갱신 (update 루프에서 상태 변화 시 호출) */
  private refreshControlBar(): void {
    if (!this.controlBarText) return;
    let text: string;
    if (this.fpState === 'fighting') {
      text = '좌클릭 릴링 · ←/→ 로드 스티어(횡 러닝: 같은쪽=버티기·반대쪽=제압) · H 버티기 — 텐션 30~80';
    } else if (this.biteSeq.active || this.pendingFish) {
      text = '입질 중! 초릿대가 크게 휘는 3단계에 우클릭 챔질 (1단계 5% · 2단계 20% · 3단계 100%)';
    } else {
      text = '우클릭 챔질 · 좌클릭 홀드 릴링 · 탭 호핑 · 더블탭 트위칭 · ↑ 리프트 · H 뒷줄견제 · C 밑밥 · I 인벤 · F1 도움말';
    }
    if (this.controlBarText.text !== text) this.controlBarText.setText(text);
  }

  /** 도움말(?) 버튼 — 로드 반대편 하단(릴이 가려지지 않도록) */
  private buildHelpButton(): void {
    const bx = this.rodSide === 'right' ? 200 : GAME_WIDTH - 200;
    const btn = this.add.container(bx, GAME_HEIGHT - 44).setDepth(95);
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
    hit.on('pointerdown', () => this.toggleGuideHub());
    btn.add([g, q, hit]);
    applyScreenFixed(btn);
  }

  /**
   * 가이드북(?) 아이콘 — 우측 상단 수심 정보 패널 우측 아래 공간.
   * 클릭 시 도우미 가이드 재열람 (F1/우하단 ? 버튼과 동일 동작).
   */
  private buildGuideBookButton(): void {
    // 수심 패널: px = GAME_WIDTH-352, py = 44, 288 높이 → 바로 아래 우측 정렬
    const bx = GAME_WIDTH - 42;
    const by = 44 + 288 + 26;
    const btn = this.add.container(bx, by).setDepth(95);
    const g = this.add.graphics();
    // 책 몸통 (펼침 방향 표지) + 책등
    g.fillStyle(0x1c4a6a, 0.97);
    g.fillRoundedRect(-17, -21, 34, 42, 5);
    g.fillStyle(0x33b0e0, 1);
    g.fillRoundedRect(-17, -21, 7, 42, { tl: 5, bl: 5, tr: 0, br: 0 });
    g.lineStyle(1.5, 0x5cd0ff, 0.95);
    g.strokeRoundedRect(-17, -21, 34, 42, 5);
    // 페이지 줄 무늬
    g.lineStyle(1, 0x8fd4f0, 0.4);
    g.lineBetween(-6, -12, 12, -12);
    g.lineBetween(-6, 12, 12, 12);
    const q = this.add.text(3, 0, '?', {
      fontFamily: 'monospace', fontSize: '19px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const lbl = this.add.text(0, 32, '가이드', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7fb8d8',
    }).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, 40, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { q.setColor('#ffffff'); lbl.setColor('#aee8ff'); });
    hit.on('pointerout', () => { q.setColor('#aee8ff'); lbl.setColor('#7fb8d8'); });
    hit.on('pointerdown', () => this.toggleGuideHub());
    btn.add([g, q, lbl, hit]);
    applyScreenFixed(btn);
  }

  // ── 통합 가이드 허브 (파이트·회수·밑밥·회뜨기 — 데이터 구동 GuidePanel) ──
  /** 허브 토글 (F1 / ? / 가이드북 버튼) — 열림 중 낚시 진행 일시정지 */
  private toggleGuideHub(): void {
    if (this.guideHub) { this.closeGuideHub(); return; }
    this.openGuideHub();
  }

  /** 허브 열기 — cat 지정 시 해당 탭으로 (열려 있으면 탭만 전환) */
  private openGuideHub(cat?: GuideCatKey): void {
    if (this.guideHub) {
      if (cat) this.guideHub.showCategory(cat);
      return;
    }
    const panel = new GuidePanel(this, {
      initialCat: cat,
      onClose: () => this.closeGuideHub(),
    });
    this.add.existing(panel);
    this.guideHub = panel;
  }

  private closeGuideHub(): void {
    const p = this.guideHub;
    if (!p) return;
    this.guideHub = undefined;
    p.destroy();
  }

  /** 밑밥 가이드 재열람 버튼 — 가이드북(?) 아이콘 바로 아래 (양동이 아이콘) */
  private buildChumGuideButton(): void {
    const bx = GAME_WIDTH - 42;
    const by = 44 + 288 + 26 + 78;
    const btn = this.add.container(bx, by).setDepth(95);
    const g = this.add.graphics();
    // 밑밥 양동이 (탑뷰 통 + 손잡이)
    g.fillStyle(0x1c4a6a, 0.97);
    g.fillRoundedRect(-15, -12, 30, 30, 5);
    g.lineStyle(1.5, 0x5cd0ff, 0.95);
    g.strokeRoundedRect(-15, -12, 30, 30, 5);
    g.lineStyle(2, 0x8fd4f0, 0.9);
    g.beginPath();
    g.arc(0, -12, 11, Math.PI, 0);
    g.strokePath();
    // 통 안 밑밥 알갱이
    g.fillStyle(0xc9a86a, 0.95);
    g.fillCircle(-5, 0, 2.4);
    g.fillCircle(4, 4, 2.1);
    g.fillCircle(1, 9, 1.9);
    const lbl = this.add.text(0, 32, '밑밥', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7fb8d8',
    }).setOrigin(0.5);
    const hit = this.add.rectangle(0, 2, 40, 52, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => lbl.setColor('#aee8ff'));
    hit.on('pointerout', () => lbl.setColor('#7fb8d8'));
    hit.on('pointerdown', () => this.openGuideHub('chum'));
    btn.add([g, lbl, hit]);
    applyScreenFixed(btn);
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
      // 챔질 실패 — 물고기는 떠난다. 루어는 소모되지 않고, 실미끼만 소모성.
      // 1단계(약은 입질) 실패는 60% 확률로 미끼가 살아남는다(가볍게 건드린 정도).
      this.pendingFish = null;
      this.rodBendDeg = 0;
      this.floatSinkM = 0;
      let baitKept = false;
      if (InventoryStore.hookNeedsBait()) {
        if (r.stage === 1 && Math.random() < 0.6) baitKept = true;
        else InventoryStore.consumeRigItem('bait');
      }
      this.refreshCoolerUi();
      this.fpState = 'result';
      const tail = this.lureMode
        ? '\n\n루어는 그대로 회수했습니다. 3단계 입질에 챔질하세요.'
        : baitKept
          ? '\n\n미끼는 살아남았습니다. 3단계 입질에 챔질하세요.'
          : '\n\n물고기가 미끼를 뱉고 달아났습니다.\n초릿대가 크게 휘는 3단계 입질에 챔질하세요.';
      this.showResultPanel('챔질 실패', `${r.message}${tail}`, '#ff9a6a');
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

    // ── 파이트 2D 무대 초기화 (상단 앵커 수중 단면뷰) ──
    this.f2dProfile = getMovementProfile(f.speciesId);
    this.f2dPos = { x: (Math.random() - 0.5) * 70, y: 95 + Math.random() * 25 };
    this.f2dHeading = pickRunHeading(
      this.f2dProfile, Math.atan2(this.f2dPos.y, this.f2dPos.x), Math.random(), Math.random(),
    );
    this.f2dRunTimer = 0;
    this.f2dPrevPattern = 'none';

    // ── 피로 페이즈 모델 (어종 × 사이즈 — RUN/LULL/SURGE/SPENT, thrust 게이트) ──
    this.fatigue = new FishFatigueModel(f.speciesId, f.weightG / 1000, this.f2dProfile.runPower);
    this.lastFatigue = null;
    this.fightDepthNorm = 0;

    // 물고기 실루엣 접근 연출
    const bx = this.screenX(this.rig.baitX);
    const by = this.depthY(this.rig.baitZ);
    this.fishShadow = this.add.ellipse(bx + 220, WATERLINE + 60, 46, 14, 0x0a1a28, 0.0).setDepth(32);
    this.fishShadow.setScale(0.35);
    this.tweens.add({
      targets: this.fishShadow, x: bx, y: by, scale: 1, alpha: 0.75, duration: 620, ease: 'Quad.easeIn',
    });
    this.cameras.main.shake(180, 0.004);
    this.playHookUpEffect();
    this.prevStage = null;
    this.stateText.setText('챔질 성공! 좌클릭 릴링 · ←/→ 로드 스티어 · H 버티기 — 텐션 30~80!');

    // 최초 파이팅 — 파이트 가이드 1회 자동 표시 (열림 중엔 파이팅 진행 일시정지)
    if (!GameState.getFlag('guideSeen.fight')) {
      GameState.setFlag('guideSeen.fight');
      this.time.delayedCall(700, () => this.openGuideHub('fight'));
    }
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

  /**
   * 다트 (←/→ 탭) — 횡 트위칭 1스트로크: 루어가 해당 방향으로 횡 임펄스 + 짧은 유인 정지.
   * "좌×3 우×3" 연타로 지그재그 액션. 드리프트 + 루어 모드에서만.
   */
  private doDart(dir: -1 | 1): void {
    if (this.fpState !== 'drift' || !this.lureMode || this.guideHub) return;
    if (this.twitchCooldown > 0) return;
    this.twitchCooldown = 0.35;
    this.rigPose = 'twitch';
    this.poseTimer = 0.45;
    this.rig.baitX += dir * 0.7;   // 횡 임펄스 (m)
    this.rig.baitZ = Math.max(0.3, this.rig.baitZ - 0.25);
    this.flashState(dir < 0 ? '다트! (좌)' : '다트! (우)');
  }

  // ═══════════════════════════════════════════════════
  // 파이트 2D 시뮬 — 상단 앵커 수중 단면 좌표 (가로=횡 러닝 / 세로=수심)
  //  v2: 중앙 원형 무대 "렌더"는 제거 — 정면 뷰(drawRigIcon 물고기)·수평뷰·수직뷰가
  //  이 시뮬 상태(f2dPos/f2dHeading/fightDepthNorm)를 직접 소비한다.
  // ═══════════════════════════════════════════════════
  private updateFight2DSim(dt: number, st: FightStatus, reeling: boolean): void {
    if (!this.hookedFish) return;
    const R = 132;                                  // 무대 반경 (시뮬 좌표계)
    const anchorX = 0, anchorY = -R + 14;           // 로드 팁 앵커 (로컬)

    // ── 모션: 패턴 → heading (jump=상방 / dive=하방 / lateral=좌우 / none=프로필 러닝) ──
    if (st.pattern !== this.f2dPrevPattern) {
      this.f2dPrevPattern = st.pattern;
      const spread = (Math.random() - 0.5) * 0.5;
      if (st.pattern === 'jump') this.f2dHeading = -Math.PI / 2 + spread;
      else if (st.pattern === 'dive') this.f2dHeading = Math.PI / 2 + spread;
      else if (st.pattern === 'lateral') this.f2dHeading = (st.lateralDir < 0 ? Math.PI : 0) + spread * 0.5;
      else this.f2dHeading = pickRunHeading(this.f2dProfile, Math.atan2(this.f2dPos.y - anchorY, this.f2dPos.x), Math.random(), Math.random());
    }
    this.f2dRunTimer += dt;
    if (st.pattern === 'none' && this.f2dRunTimer >= this.f2dProfile.runDurationSec) {
      this.f2dRunTimer = 0;
      this.f2dHeading = pickRunHeading(this.f2dProfile, Math.atan2(this.f2dPos.y - anchorY, this.f2dPos.x), Math.random(), Math.random());
    }

    // 제압 근접(진행 82+ 또는 피로 SPENT) — 머리를 앵커 쪽으로 돌리고 수면 부상(옆으로 롤)
    const subdued = st.progress >= 82 || this.lastFatigue?.phase === 'SPENT';
    if (subdued) {
      const toAnchor = Math.atan2(anchorY - this.f2dPos.y, anchorX - this.f2dPos.x);
      let d = toAnchor - this.f2dHeading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.f2dHeading += d * 1.6 * dt;
    }

    // 추진(패턴·파워·피로) − 줄이 앵커쪽으로 끄는 힘(릴링)
    // 피로 페이즈가 thrust 상한을 게이팅: RUN 1.0 / LULL 0.62 / SURGE 0.5+버스트 / SPENT 0.22
    const patternMult = st.pattern === 'dive' ? 1.6 : st.pattern === 'lateral' ? 1.5 : st.pattern === 'jump' ? 1.2 : 0.75;
    const gate = this.lastFatigue?.thrustGate ?? Math.max(0.25, 1 - st.progress / 130);
    const thrust = (26 + this.hookedFish.powerFactor * 85) * patternMult * gate * this.f2dProfile.runPower;
    const pull = (reeling ? 62 : 14) + (subdued ? 40 : 0);
    const len = Math.hypot(this.f2dPos.x - anchorX, this.f2dPos.y - anchorY) || 1;
    this.f2dPos.x += (Math.cos(this.f2dHeading) * thrust - ((this.f2dPos.x - anchorX) / len) * pull) * dt;
    this.f2dPos.y += (Math.sin(this.f2dHeading) * thrust - ((this.f2dPos.y - anchorY) / len) * pull) * dt;
    // 수면(앵커) 아래 → 무대 원 내부 순서로 클램프 (역순이면 y 보정이 원 밖으로 밀어냄)
    if (this.f2dPos.y < anchorY + 26) this.f2dPos.y = anchorY + 26;
    const dC = Math.hypot(this.f2dPos.x, this.f2dPos.y);
    const maxR = R - 18;
    if (dC > maxR) { this.f2dPos.x *= maxR / dC; this.f2dPos.y *= maxR / dC; }

    // 깊이 정규화 — 정면 뷰 찌 투명도/그림자 선명도/수직뷰가 공유 (얕음=선명)
    this.fightDepthNorm = Phaser.Math.Clamp((this.f2dPos.y - anchorY) / (R * 1.5), 0, 1);
  }

  /** 파이트 상태 정리 (랜딩/실패/재캐스팅) — v2: 중앙 무대 렌더 제거, 시뮬 상태만 리셋 */
  private clearFight2DStage(): void {
    this.fightDepthNorm = 0;
    this.dragInMode = false;
  }

  /** 제압 성공 → 끌어오기 시작 — 지친 고기가 세트에 편입되어 수면에 떠서 끌려온다 */
  private beginDragIn(): void {
    this.dragInMode = true;
    // 물고기는 이제 회수 세트(retrieveGroup) 안에 렌더 — 그림자 실루엣은 숨김
    this.fishShadow?.setVisible(false);
    this.flashState('제압 성공! 지친 고기를 릴링으로 발앞까지 끌어오세요');
  }

  /**
   * 제압 후 끌어오기 틱 — 저항은 사라지고(도주 시뮬 정지) 릴링만 거리를 좁힌다.
   * 방치하면 아주 천천히 풀려나가며, 발앞 3m 도달 시 정식 랜딩.
   */
  private updateDragIn(dt: number): void {
    const reelMps = this.reeling ? 2.4 : -0.15;
    this.distM = Phaser.Math.Clamp(this.distM - reelMps * dt, 1.2, this.cfg.castDistanceM * 1.6);

    // 지친 롤 — 수면 부상 + 횡 편차가 중앙으로 수렴 (질질 끌려오는 자세)
    this.fightDepthNorm = Math.max(0.06, this.fightDepthNorm - dt * 0.5);
    const bottom = this.getBottomDepthAt();
    const targetZ = Phaser.Math.Clamp(this.fightDepthNorm * bottom, 0.3, bottom);
    this.rig.baitZ += (targetZ - this.rig.baitZ) * Math.min(1, dt * 2.5);
    this.f2dPos.x *= Math.max(0, 1 - dt * 0.8);
    this.f2dHeading = this.lerpHeading(this.f2dHeading, Math.PI / 2, 0.05);
    this.rodBendDeg = 24 + Math.sin(this.time.now / 160) * 4;

    this.renderFightUi({
      tension: 24, progress: 100, pattern: 'none', patternTimeLeft: 0,
      event: 'none', escapeProbPerSec: 0, lateralDir: 1,
    });
    this.patternText
      .setText(`제압 완료! 릴링으로 끌어오세요 — 남은 ${Math.max(0, this.distM - 3).toFixed(1)}m`)
      .setVisible(true);

    if (this.distM <= 3) {
      this.dragInMode = false;
      this.patternText.setVisible(false);
      this.onLanded();
    }
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
      // 원투 무게추 봉돌은 자중이 크다(60~113g) — 무게 비례로 빠르게 침강
      if (item.sinkerWeightG !== undefined) weightG += item.sinkerWeightG;
      // 찌 제원 (floatBuoyG): 양수 = 부력찌 부력 / 음수 = 수중찌·잠길찌 침력
      else if (item.floatBuoyG !== undefined) {
        if (item.floatBuoyG >= 0) buoyG += item.floatBuoyG;
        else weightG += -item.floatBuoyG;
      }
      else if (item.name.includes('봉돌')) weightG += 3.2;
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

    // ── 실시간 시간대 × 날씨 반영 (기상청/해양기상 실데이터 캐시) ──
    const hour = kstHour();
    const isNight = hour >= 20 || hour < 5;
    const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);
    const weather = ExternalDataStore.getWeatherKind(this.cfg.region);
    const gloomy = weather === 'cloudy' || weather === 'rain' || weather === 'shower' || weather === 'sleet';

    // 하늘 팔레트 매트릭스 (위→아래 4밴드)
    let skyBands: number[];
    if (isNight) {
      skyBands = gloomy
        ? [0x05080f, 0x080c16, 0x0b111e, 0x0e1626]
        : [0x040a18, 0x081226, 0x0d1a32, 0x122240];
    } else if (isDusk) {
      skyBands = gloomy
        ? [0x2e2838, 0x453647, 0x5c4452, 0x74525c]
        : [0x3a2650, 0x6f3a5c, 0xc4552e, 0xe8945a];
    } else if (weather === 'fog') {
      skyBands = [0xaab6c0, 0xb4bfc8, 0xbec8d0, 0xc8d1d8];
    } else if (gloomy) {
      skyBands = weather === 'cloudy'
        ? [0x93a4b4, 0x9fb0c0, 0xacbcca, 0xbac8d4]
        : [0x6d7e8f, 0x77889a, 0x8494a4, 0x91a0b0];   // 비/소나기 — 더 낮게 깔린 하늘
    } else {
      skyBands = [0x8fc4e8, 0x9ecfee, 0xb2dcf4, 0xc8e8fa];
    }
    skyBands.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(0, (WATERLINE / 4) * i, GAME_WIDTH, WATERLINE / 4 + 1);
    });

    // 밤하늘 별 + 달 (맑은 밤에만 선명)
    if (isNight && !gloomy && weather !== 'fog') {
      for (let i = 0; i < 46; i++) {
        const star = this.add.rectangle(
          Math.random() * GAME_WIDTH, Math.random() * (WATERLINE - 60),
          1 + Math.round(Math.random()), 1 + Math.round(Math.random()),
          0xffffff, 0.3 + Math.random() * 0.6,
        ).setDepth(1);
        this.tweens.add({
          targets: star, alpha: 0.1,
          duration: 1200 + Math.random() * 2400, yoyo: true, repeat: -1,
          delay: Math.random() * 2000,
        });
      }
      const moonX = GAME_WIDTH * 0.78, moonY = 66;
      this.add.circle(moonX, moonY, 26, 0xeef2dc, 0.14).setDepth(1);
      this.add.circle(moonX, moonY, 15, 0xeef2dc, 0.95).setDepth(1);
      this.add.circle(moonX + 5, moonY - 3, 12, skyBands[0], 1).setDepth(1);
    } else if (isDusk && !gloomy) {
      // 노을 태양 (수평선에 낮게)
      this.add.circle(GAME_WIDTH * 0.3, WATERLINE - 38, 20, 0xffc46a, 0.9).setDepth(1);
      this.add.circle(GAME_WIDTH * 0.3, WATERLINE - 38, 34, 0xff9a4a, 0.18).setDepth(1);
    } else if (!isNight && !gloomy && weather !== 'fog') {
      // 맑은 낮 태양광
      this.add.circle(GAME_WIDTH * 0.2, 70, 22, 0xfff2c8, 0.55).setDepth(1);
      this.add.circle(GAME_WIDTH * 0.2, 70, 40, 0xfff2c8, 0.14).setDepth(1);
    }

    // 흐림/비 — 낮게 깔린 구름 띠
    if (gloomy && !isNight) {
      for (let i = 0; i < 5; i++) {
        const cw = 220 + Math.random() * 200;
        const cloud = this.add.ellipse(
          Math.random() * GAME_WIDTH, 30 + Math.random() * (WATERLINE * 0.5),
          cw, 34 + Math.random() * 22, 0x5a6a7a, 0.28 + Math.random() * 0.14,
        ).setDepth(1);
        this.tweens.add({
          targets: cloud, x: cloud.x + 120, duration: 24000 + Math.random() * 18000,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    }

    // 수평선 원경 (먼 산/방파제 실루엣 — 안개 시 거의 소실)
    g.fillStyle(isNight ? 0x0a1420 : 0x6f93ad, weather === 'fog' ? 0.15 : 0.55);
    g.fillRect(0, WATERLINE - 26, GAME_WIDTH, 26);

    // 수중 그라데이션 (깊어질수록 어둡게 — 시간대/날씨 밝기 배율)
    const waterDim = isNight ? 0.45 : isDusk ? 0.7 : gloomy ? 0.75 : weather === 'fog' ? 0.85 : 1;
    const depthPx = GAME_HEIGHT - WATERLINE;
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const r = Math.floor((0x2e * (1 - t) + 0x07 * t) * waterDim);
      const gg = Math.floor((0x6e * (1 - t) + 0x1c * t) * waterDim);
      const b = Math.floor((0x94 * (1 - t) + 0x33 * t) * waterDim);
      g.fillStyle((r << 16) | (gg << 8) | b, 1);
      g.fillRect(0, WATERLINE + (depthPx / bands) * i, GAME_WIDTH, depthPx / bands + 1);
    }

    // 날씨 파티클 (비/눈/안개 — 화면 전면, 수심 패널(85) 아래)
    if (weather === 'rain' || weather === 'sleet') this.spawnFpRain(70);
    else if (weather === 'shower') this.spawnFpRain(110);
    else if (weather === 'snow') this.spawnFpSnow(50);
    else if (weather === 'fog') this.spawnFpFog();

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

  /** 1인칭 빗줄기 (바람 사선 — 수심 패널 아래 depth 70) */
  private spawnFpRain(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.add.rectangle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 1.5, 12, 0xcfe0f0, 0.45,
      ).setDepth(70).setAngle(10);
      this.fpRainDrops.push({ obj, speed: 560 + Math.random() * 280 });
    }
  }

  /** 1인칭 눈송이 */
  private spawnFpSnow(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.add.circle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        1.5 + Math.random() * 1.3, 0xf2f7fc, 0.85,
      ).setDepth(70);
      this.fpSnowFlakes.push({ obj, speed: 50 + Math.random() * 45, sway: Math.random() * Math.PI * 2 });
    }
  }

  /** 1인칭 안개 — 수평선을 지우는 헤이즈 + 드리프트 블롭 */
  private spawnFpFog(): void {
    // 수평선 부근 짙은 헤이즈 띠
    this.add.rectangle(GAME_WIDTH / 2, WATERLINE - 10, GAME_WIDTH, 120, 0xc4ced6, 0.3).setDepth(58);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc8d2da, 0.1).setDepth(58);
    for (let i = 0; i < 5; i++) {
      const obj = this.add.ellipse(
        Math.random() * GAME_WIDTH, WATERLINE - 60 + Math.random() * 160,
        360 + Math.random() * 200, 90 + Math.random() * 60,
        0xd0d9e0, 0.1 + Math.random() * 0.08,
      ).setDepth(58);
      this.fpFogBlobs.push({ obj, speed: 5 + Math.random() * 9 });
    }
  }

  /** 1인칭 날씨 파티클 이동 (update 루프) */
  private updateFpWeather(dtSec: number): void {
    for (const d of this.fpRainDrops) {
      d.obj.y += d.speed * dtSec;
      d.obj.x += 70 * dtSec;
      if (d.obj.y > GAME_HEIGHT + 14) { d.obj.y = -14; d.obj.x = Math.random() * GAME_WIDTH; }
      if (d.obj.x > GAME_WIDTH + 8) d.obj.x = -8;
    }
    for (const s of this.fpSnowFlakes) {
      s.obj.y += s.speed * dtSec;
      s.obj.x += Math.sin(this.time.now / 800 + s.sway) * 18 * dtSec;
      if (s.obj.y > GAME_HEIGHT + 6) { s.obj.y = -6; s.obj.x = Math.random() * GAME_WIDTH; }
    }
    for (const f of this.fpFogBlobs) {
      f.obj.x += f.speed * dtSec;
      if (f.obj.x - f.obj.width / 2 > GAME_WIDTH) f.obj.x = -f.obj.width / 2;
    }
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

  /**
   * 회수 세트 컨테이너 생성 — 세트 내용은 setG(로컬 좌표)에 매 프레임 재드로우하고,
   * 컨테이너의 pos/scale/alpha만 retrieveT 매핑으로 구동한다 (A-2).
   */
  private buildRetrieveGroup(): void {
    this.setG = this.add.graphics();
    this.retrieveGroup = this.add.container(GAME_WIDTH / 2, WATERLINE, [this.setG]).setDepth(35);
  }

  /** 찌 드로잉 (구멍찌 스타일 — 주황 상단 + 흰 몸통) — 세트 로컬/파이트 절대 좌표 공용 */
  private drawFloatShape(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, alpha: number): void {
    g.fillStyle(0x222222, alpha);
    g.fillRect(x - 1 * scale, y - 18 * scale, 2 * scale, 8 * scale);
    g.fillStyle(0xff6a2a, alpha);
    g.fillEllipse(x, y - 7 * scale, 10 * scale, 12 * scale);
    g.fillStyle(0xfff4e0, alpha);
    g.fillEllipse(x, y + 2 * scale, 8 * scale, 10 * scale);
  }

  // ═══════════════════════════════════════════════════
  // UI (게이지/쿨러/버튼)
  // ═══════════════════════════════════════════════════
  private buildUi(): void {
    this.uiG = this.add.graphics().setDepth(80);
    // 좌측 하단 수평뷰(top-down plan) — 정보 텍스트는 좌상단 (v2.1 재배치)
    this.planG = this.add.graphics().setDepth(80);
    this.add.text(24, 413, '수평뷰 (위에서 본 평면)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac', fontStyle: 'bold',
    }).setDepth(81);

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

    // 수심 패널 제목 + 실시간 수치 (패널 본체는 renderDepthPanel에서 그림)
    // 패널: px = GAME_WIDTH-352, pw 338 (2026-07-20 소폭 축소). 제목은 패널 중앙, 수치는 게이지 박스 우측 열.
    this.add.text(GAME_WIDTH - 352 + 169, 58, '수심 정보', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#7fb8d8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(91);
    this.depthValsText = this.add.text(GAME_WIDTH - 352 + 224, 112, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#d0e8f5', lineSpacing: 11,
    }).setDepth(91);

    // ── 쿨러 (중앙 하단 — 어획 보관함 / 밑밥 보관함 2분할) ──
    this.buildCooler();

    // ── 그만하기 버튼 (로드 반대편 하단 — 릴이 가려지지 않도록) ──
    const exitX = this.rodSide === 'right' ? 92 : GAME_WIDTH - 92;
    const exitBtn = this.add.container(exitX, GAME_HEIGHT - 44).setDepth(95);
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

  /** 낚시용 쿨러 — 좌: 어창(클릭 시 3x3 팝업) / 우: 밑밥 게이지 (2026-07-20 확장) */
  private buildCooler(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT - 58;
    const cooler = this.add.container(cx, cy).setDepth(92);

    const g = this.add.graphics();
    // 몸통 (좌우 340px — 어창/밑밥 2분할)
    g.fillStyle(0x2664a0, 1);
    g.fillRoundedRect(-170, -34, 340, 62, 8);
    // 뚜껑
    g.fillStyle(0x3a7cc0, 1);
    g.fillRoundedRect(-174, -44, 348, 18, 6);
    g.lineStyle(2, 0x143a5e, 1);
    g.strokeRoundedRect(-170, -34, 340, 62, 8);
    g.strokeRoundedRect(-174, -44, 348, 18, 6);
    // 중앙 분리선 (2분할)
    g.lineStyle(2, 0x143a5e, 0.9);
    g.lineBetween(0, -26, 0, 24);
    // 손잡이
    g.lineStyle(3, 0x143a5e, 1);
    g.strokeRoundedRect(-24, -52, 48, 10, 4);
    cooler.add(g);

    const catchLbl = this.add.text(-85, -22, '어창 (클릭해서 열기)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.coolerCatchText = this.add.text(-85, 2, '0마리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);

    const chumLbl = this.add.text(85, -22, '밑밥 (C)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.coolerChumText = this.add.text(85, 2, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5);
    cooler.add([catchLbl, this.coolerCatchText, chumLbl, this.coolerChumText]);

    // 상호작용: 좌측 = 어창 3x3 팝업 / 우측 = 밑밥 투척
    const catchHit = this.add.rectangle(-85, -6, 166, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    catchHit.on('pointerdown', () => this.openCoolerPanel());
    const chumHit = this.add.rectangle(85, -6, 166, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    chumHit.on('pointerdown', () => this.tossChum());
    cooler.add([catchHit, chumHit]);

    applyScreenFixed(cooler);
    this.refreshCoolerUi();
  }

  private refreshCoolerUi(): void {
    // 쿨러(기타 아이템) 미보유 시 어창/밑밥 기능 비활성 표기
    if (!InventoryStore.hasCooler()) {
      this.coolerCatchText?.setText('쿨러 없음');
      this.coolerChumText?.setText('사용 불가');
      return;
    }
    this.coolerCatchText?.setText(`${CoolerStore.count()} / ${COOLER_CAPACITY}마리`);
    this.coolerChumText?.setText(CoolerStore.chumRemaining > 0 ? `${CoolerStore.chumRemaining} / 100` : '비어있음');
  }

  // ── 어창(쿨러) 3x3 팝업 ─────────────────────────────
  private openCoolerPanel(): void {
    if (this.coolerPanel) return;
    if (!InventoryStore.hasCooler()) {
      this.flashState('쿨러가 없습니다 — 기타 아이템에 쿨러(아이스박스)가 필요합니다');
      return;
    }
    const panel = new CoolerPanel(this, {
      // 1인칭 낚시는 항상 물가 — 해수 넣기 상시 가능
      isNearSea: () => true,
      onChanged: () => this.refreshCoolerUi(),
      onClose: () => this.closeCoolerPanel(),
    });
    this.add.existing(panel);
    this.coolerPanel = panel;
  }

  private closeCoolerPanel(): void {
    const p = this.coolerPanel;
    if (!p) return;
    this.coolerPanel = undefined;
    p.destroy();
    this.refreshCoolerUi();
  }

  // ── 인벤토리 (I) — 쿨러 어획 드래그 이송·슬롯 정리용 ────
  private toggleFpInventory(): void {
    if (this.invPanel) { this.closeFpInventory(); return; }
    if (this.fpState === 'fighting' || this.guideHub) return;   // 파이팅/가이드 중엔 열지 않음
    const panel = new InventoryPanel(this, GAME_WIDTH - 470, 60, {
      onClose: () => this.closeFpInventory(),
      onOpenDetail: (item) => {
        this.fpDetailPanel?.destroy();
        const d = new ItemDetailPanel(this, item, 180, 90, () => {
          d.destroy();
          this.fpDetailPanel = undefined;
        });
        this.add.existing(d);
        this.fpDetailPanel = d;
      },
      onOpenTackle: () => this.flashState('채비 조립은 탑다운 U 활용 창에서 가능합니다'),
    });
    this.add.existing(panel);
    this.invPanel = panel;
  }

  private closeFpInventory(): void {
    const p = this.invPanel;
    if (!p) return;
    this.invPanel = undefined;
    this.fpDetailPanel?.destroy();
    this.fpDetailPanel = undefined;
    p.destroy();
    this.refreshCoolerUi();
  }

  // ═══════════════════════════════════════════════════
  // 밑밥 투척 (Phase 1)
  // ═══════════════════════════════════════════════════
  private tossChum(): void {
    if (this.fpState === 'fighting' || this.coolerPanel) return;
    // 밑밥 통은 쿨러(기타 아이템)에 딸린 기능 — 쿨러가 없으면 사용 불가
    if (!InventoryStore.hasCooler()) {
      this.flashState('쿨러가 없어 밑밥을 쓸 수 없습니다 — 기타 아이템에 쿨러가 필요합니다');
      return;
    }
    // 최초 사용 시 밑밥 가이드 1회 자동 표시 (세이브 플래그 — 구 chumGuideSeen 호환)
    if (!GameState.getFlag('guideSeen.chum') && !GameState.getFlag('chumGuideSeen')) {
      GameState.setFlag('guideSeen.chum');
      this.openGuideHub('chum');
      return;
    }
    // 배합 밑밥 1회 25 소모 (U 밑밥 품질 탭에서 배합 — 추후 능력치로 소모량 감소 예정)
    if (!CoolerStore.consumeChumThrow()) {
      this.flashState('밑밥이 비어 있습니다 — 탑다운 U 밑밥 품질에서 배합하세요');
      this.refreshCoolerUi();
      return;
    }
    // 선택 투척점(커서 X 최근접 스냅)에 착수 — 착수 D = 현재 미끼 거리(distM).
    // 이후 stepChum이 침강 + 조류 (x, d) 드리프트를 한 시뮬로 구동한다 (B-2).
    const xs = this.chumSnapXs();
    const x = xs[this.chumThrowIdx] ?? this.rig.floatX;
    // 배합 재료 → 밑밥 종류 (파우더=느림·넓음·조류↑ / 압맥=범용 / 경단=빠름·정밀)
    this.chumParcels.push(createChumParcel(x, this.distM, CoolerStore.chumTypeKey()));
    this.refreshCoolerUi();

    // 착수 파문 (정면 뷰 — 투척점 거리의 수면 원근 Y)
    const sx = this.screenX(x);
    const sy = this.surfaceYAt(this.distM);
    const rip = this.add.circle(sx, sy + 2, 4, 0x000000, 0).setStrokeStyle(1.5, 0xeaf6ff, 0.8).setDepth(34);
    this.tweens.add({ targets: rip, scale: 3, alpha: 0, duration: 700, onComplete: () => rip.destroy() });

    this.flashState('밑밥 투척! 예측 궤적과 동조율을 확인하세요');
  }

  /** 밑밥 투척점 스냅 X 좌표 (world m) — 화면 중앙 기준 좌우 등간격 행 */
  private chumSnapXs(): number[] {
    const n = Math.max(3, Math.round(TUNING.chumThrow.pointCount));
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      xs.push(this.viewCenterX + (i - (n - 1) / 2) * CHUM_THROW_SPACING_M);
    }
    return xs;
  }

  // ═══════════════════════════════════════════════════
  // 좌표 변환
  // ═══════════════════════════════════════════════════
  private screenX(worldX: number): number {
    return GAME_WIDTH / 2 + (worldX - this.viewCenterX) * PX_PER_M_X;
  }

  /** 회수 진행도 — retrieveT = 1 − clamp(distM / castDist) */
  private retrieveT(distM = this.distM): number {
    return 1 - Phaser.Math.Clamp(distM / Math.max(1, this.cfg.castDistanceM), 0, 1);
  }

  /** 회수 수렴 앵커 Y — TUNING.retrieve.anchorYRatio (dev 패널 라이브 튜닝) */
  private retrieveAnchorY(): number {
    return GAME_HEIGHT * TUNING.retrieve.anchorYRatio;
  }

  /**
   * 수면 거리 → 수면 스크린 Y (회수 매핑 A-1).
   * 착수(원거리) = 수평선 부근 / 릴링으로 distM이 줄수록 easeOutCubic으로
   * 중앙~하단 중간 앵커(retrieveAnchorY)까지 내려온다.
   */
  private surfaceYAt(distM: number): number {
    const p = Phaser.Math.Easing.Cubic.Out(this.retrieveT(distM));
    return Phaser.Math.Linear(WATERLINE + 4, this.retrieveAnchorY(), p);
  }

  /** 수심 z → 스크린 Y — 기준 수면(surfY) 아래. 멀수록 수심 표현을 압축(원근). */
  private depthY(z: number, surfY = this.surfaceYAt(this.distM)): number {
    const near = Phaser.Math.Clamp(
      (surfY - (WATERLINE + 4)) / Math.max(1, this.retrieveAnchorY() - WATERLINE - 4), 0, 1);
    return surfY + z * this.pxPerMZ * (0.5 + 0.5 * near);
  }

  // 여 밭 판정은 해저 지형 프로필(this.seabed.isRockAt(distM))로 일원화 —
  // 측면 X 해시 방식(구 isReefAt)은 제거됨 (2026-07-20, Q3).

  // ═══════════════════════════════════════════════════
  // 메인 업데이트 루프
  // ═══════════════════════════════════════════════════
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);

    // 실시간 날씨 파티클 (비/눈/안개)
    this.updateFpWeather(dt);

    // 도우미/밑밥 가이드 열람 중 — 낚시 진행(조류/침강/입질/파이팅)만 일시정지.
    // 실시간 시계·날씨 연출은 계속되고, 가이드를 닫는 순간부터 액션이 재개된다.
    if (this.guideHub) return;

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
    // 하한 0.3m — 1m로 막으면 릴링이 발앞(0.5m) 회수 지점에 도달할 수 없다
    this.distM = Math.max(0.3, this.distM + influence.force.y * dt);

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

    this.updateChumParcels(dt, hoursNow);
    this.renderChumLayer();
    this.renderWater(dt);
    this.renderFoam(influence);
    this.renderRigVisuals();
    this.renderPlanView();
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

  /**
   * 채비 회수 — 릴링으로 플레이어 발앞(0.5m)까지 다 감았을 때 (모든 조법 공통).
   * 손실 없이 채비를 걷어 올리고 안내와 함께 탑다운 필드로 복귀한다.
   */
  private retrieveRig(): void {
    if (this.fpState !== 'drift') return;
    this.fpState = 'result';   // 회수 중 입질/입력 차단
    this.biteSeq.reset();
    this.pendingFish = null;
    this.rodBendDeg = 0;
    this.floatSinkM = 0;
    this.reeling = false;

    const msg = this.lureMode ? '루어를 회수했습니다' : '채비를 회수했습니다';
    this.stateText.setText(msg);
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `${msg}\n\n탑다운 뷰로 돌아갑니다 — 다시 조준해 캐스팅하세요.`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#aee8ff', fontStyle: 'bold',
      align: 'center', lineSpacing: 6,
      backgroundColor: '#0a1628ee', padding: { x: 20, y: 14 },
    }).setOrigin(0.5).setDepth(120);
    this.tweens.add({ targets: banner, alpha: 0.9, duration: 150 });

    this.registry.set('fp_exit_msg', msg);
    this.time.delayedCall(900, () => this.exitToField());
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
      this.flashState('뒷줄견제! 채비를 세워 그 지점에 홀드합니다 (리액션 찬스)');
    }

    const prevZ = this.rig.baitZ;
    // 해저 지형 프로필 — 현재 거리의 실제 바닥 수심 (암초 융기 반영, 릴링 시 단차를 타고 오름)
    const bedHereM = this.seabed.depthAt(this.distM);
    // 조류 존이 침강 속도에 저항 (조경지대 가속 / 본류·강한 횡류 감속)
    const frameParams: RigPhysicsParams = {
      ...this.rigParams,
      tackleWeightG: this.rigParams.tackleWeightG * influence.sinkMult,
    };
    stepUnderwater(this.rig, {
      dtSec: dt, tide, params: frameParams,
      zLimitM: this.zLimitM, zMaxM: bedHereM,
      driftBrake: lt.driftBrake, baitLiftMps: lt.baitLiftMps,
    });

    // ── 루어 침강 오버라이드 (sinkType 데이터 소비 — 하드코딩 버프 금지) ──
    // floating: 리트리브로 파고들고, 멈추면 부상 / sinking·fast_sinking: 자체 속도로 하강.
    // 하강 하한 = 투척 지점 국소 수심(getBottomDepthAt — 추후 지형/어탐으로 교체 가능).
    if (this.lureMode && this.lureSink && !holding && !this.upKey.isDown) {
      const bottom = this.getBottomDepthAt();
      const retrieving0 = this.reeling && this.time.now - this.pointerDownAt > 220;
      if (this.lureSink.sinkType === 'floating') {
        if (retrieving0) {
          // 리트리브 중 파고듦 (diveDepthPerRetrieve 계수 × 속도)
          this.rig.baitZ = Math.min(bottom, this.rig.baitZ + this.lureSink.diveDepthPerRetrieve * 1.1 * dt);
        } else {
          // 멈추면 부력으로 서서히 수면 복귀
          this.rig.baitZ = Math.max(0.15, this.rig.baitZ - 0.9 * dt);
        }
        this.rig.settled = false;
      } else {
        // 싱킹 계열 — 고유 속도로 바닥까지 하강
        this.rig.baitZ = Math.min(bottom, this.rig.baitZ + this.lureSink.sinkRateMps * dt);
        this.rig.settled = this.rig.baitZ >= bottom - 0.05;
      }
    }

    // ── 뒷줄견제(H) = 줄을 손으로 잡아 그 지점에 홀드 ──
    // 누른 순간 0.2m만 살짝 떠오른 뒤 정지. 침강/드리프트 없음(driftBrake 0),
    // 속조류에 의한 목줄 정렬(A)만 진행된다. (전유동 침강 정지도 이 로직이 포괄)
    if (holding) {
      if (this.holdAnchorZ === null) {
        this.holdAnchorZ = Math.max(0.25, prevZ - HOLD_LIFT_M);
      }
      // 앵커까지 빠르게 떠오른 뒤 고정 (stepUnderwater의 침강 결과는 무시)
      this.rig.baitZ = Math.max(this.holdAnchorZ, prevZ - 2.2 * dt);
      this.rig.settled = false;
    } else {
      this.holdAnchorZ = null;
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
      this.distM = Math.max(0, this.distM - reelMps * dt);
      this.rig.floatX += side * (withCurrent ? 0.9 : 0.45) * dt;
      this.rig.baitX += side * (withCurrent ? 0.9 : 0.45) * dt;
      // 릴링하면 채비가 조금씩 상층으로 떠오른다 (루어 리트리브)
      this.rig.baitZ = Math.max(0.3, this.rig.baitZ - 0.28 * dt);
      if (this.rigPose !== 'twitch' && this.rigPose !== 'lift') this.rigPose = 'retrieve';
      if (!withCurrent && Math.random() < dt * 0.5) this.biteEngine.triggerReactionLift();

      // ── 채비 회수: 플레이어 발앞(0.5m)까지 다 감으면 회수 → 탑다운 복귀 (모든 조법 공통) ──
      if (this.distM <= 0.5) {
        this.retrieveRig();
        return;
      }
    } else if (this.rigPose === 'retrieve') {
      this.rigPose = 'idle';
    }

    const hold = isHoldState(this.rig);
    const nearBottom = this.rig.baitZ >= Math.min(this.zLimitM, bedHereM) - 1.2;
    const inReef = nearBottom && this.seabed.isRockAt(this.distM);
    // 밑밥 동조율 — 3D 파슬 (x 좌우 · d 원근거리 · z 수심) 최대 동조 (B-3)
    const sync = maxChumSync(this.chumParcels, { x: this.rig.baitX, d: this.distM, z: this.rig.baitZ });

    // 미끼 종류 × 어종 선호도 친화도 (오라클 연동)
    const baitAffinity = getBaitAffinity(this.buildSpawnCtx(inReef));
    // 바다낚시지수 API 캐시 → P_base 보정 (지수 1~5 → 0.7~1.4배)
    const indexModifier = ExternalDataStore.getFishingIndexModifier();

    // ── 루어/지깅 액션 반응형 입질 (찌낚시=기다림 ↔ 루어=액션이 입질을 만든다) ──
    // 방치된 루어는 거의 물지 않고(0.15배), 리트리브/폴/트위칭 등 살아있는 움직임에
    // 반응한다. 폴링(떨어질 때)이 실제로 가장 잘 무는 순간. 메탈지그는 리프트앤폴
    // 지깅에 추가 보정 — 중대형 회유어 타겟은 루어 speciesWeightBias가 담당.
    this.lureActionMult = 1;
    if (this.lureMode) {
      const poseMult: Record<typeof this.rigPose, number> = {
        idle: 0.15, retrieve: 2.2, lift: 1.8, fall: 2.6, twitch: 3.0, hop: 2.0,
      };
      this.lureActionMult = poseMult[this.rigPose];
      // 패스트싱킹(메탈지그 등) 리프트앤폴 = 지깅 — 추가 보정
      if (this.lureSink?.sinkType === 'fast_sinking' && (this.rigPose === 'lift' || this.rigPose === 'fall')) {
        this.lureActionMult *= 1.3;
      }
    }

    const tick = this.biteEngine.update({
      dtSec: dt,
      // 조경지대(Hit Zone) 1.6배 / 본대조류 0.35배 — 조류 존 입질 배율
      // × 피딩타임 활성도(계절/조류/날씨) × 필드 이벤트(보일링 링/스쿨 히트) 보너스
      baseProbPerSec: 0.035 * baitAffinity * indexModifier * influence.biteMult * this.lureActionMult
        * this.feeding.activity * (this.cfg.fieldEvent?.biteMult ?? 1),
      inReefZone: inReef,
      isHold: hold,
      alignmentIndex: this.lineTension.alignmentIndex,
      isHoldingLine: holding,
      // 동조→입질 배율 스케일 (TUNING.chumSync.syncToBiteMul — balance 튜닝)
      chumSyncRate: Math.min(1, sync * TUNING.chumSync.syncToBiteMul),
      // 낚시터 특성(RegionAreaNode.snagRisk) × 루어 밑걸림 배율(에기 바닥 드래깅 -30%)
      snagRiskMult: getAreaSnagRiskMult(GameState.currentSpotId) * (this.lureSpec?.snagRiskMult ?? 1),
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

    // ── 입질 유도 — 1~2단계 중 릴링 1초 유지 or 뒷줄견제(H) → 70% 3단계 승격 ──
    if (this.biteSeq.active) {
      this.provokeReelT = this.reeling ? this.provokeReelT + dt : 0;
      if (hold || this.provokeReelT >= 1) {
        if (this.biteSeq.provoke() === 'escalated') {
          this.flashState('입질 유도 성공 — 미끼가 움직이자 반응이 커집니다!');
        }
      }
    } else {
      this.provokeReelT = 0;
    }

    // ── UI 게이지 갱신 ──
    this.renderGauges(tick.probPerSec, sync, inReef, hold, tick.snagProgress, tick.actionTimeLeft);

    if (tick.event === 'snagged') {
      this.onSnagged();
    } else if (tick.event === 'bite' && !this.biteSeq.active && !this.pendingFish) {
      // 입질 발생 → 어종 결정 + 입질 시퀀스 시작 (파이팅은 챔질 성공 시에만)
      this.pendingFish = spawnFish(this.buildSpawnCtx(inReef));
      this.biteSeq.start({
        speciesId: this.pendingFish.speciesId,
        biteProbPerSec: tick.probPerSec,
        // 구멍 봉돌 장착 시 예신 단계가 길어져 챔질 피드백이 완만 (+15%)
        stageTimeScale: InventoryStore.getBiteFeedbackMult(),
      });
      this.stateText.setText(this.surfMode
        ? '입질 감지! 초릿대 끝을 보고 우클릭으로 챔질하세요'
        : '입질 감지! 초릿대를 보고 우클릭으로 챔질하세요');
    }
  }

  /** 피딩타임 활성도 갱신 — 계절 시간창 × 물때/조류 × 날씨 (실데이터 캐시) */
  private refreshFeedingActivity(): void {
    const tide = calculateTideInfo();
    this.feeding = computeFeedingActivity({
      hour: kstHour() + new Date().getMinutes() / 60,
      month: new Date().getMonth() + 1,
      tidePhase: tide.tidePhase,
      minutesToNextTide: tide.minutesToNextTide,
      nextTideType: tide.nextTideType,
      weatherKind: ExternalDataStore.getWeatherKind(this.cfg.region),
      regionProfile: feedingRegionProfileOf(this.cfg.region),
    });
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

  /**
   * 투척 지점 국소 수심 (m) — 침강 하한.
   * 현재는 해저 지형 프로필 기반. 추후 실지형/어탐 기능이 이 함수를 교체한다.
   */
  private getBottomDepthAt(): number {
    return this.seabed.depthAt(this.distM);
  }

  /** 오라클 스폰/친화도 컨텍스트 구성 (루어 스펙 데이터 소비) */
  private buildSpawnCtx(inReef: boolean): SpawnContext {
    const hour = new Date().getHours();
    const ctx: SpawnContext = {
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
    // 루어 스펙 → 타겟 가중/스폰 바인딩/서식 성향 (하드코딩 금지, 데이터 소비)
    const lure = this.lureSpec;
    if (lure) {
      if (lure.spawnBinding?.length) ctx.speciesFilter = lure.spawnBinding;
      if (lure.speciesWeightBias) ctx.speciesWeightBias = lure.speciesWeightBias;
      if (lure.targetHabitatBias?.length) ctx.habitatBias = lure.targetHabitatBias;
      // 루어 총중량 → 크기 등급(tier) 가중 (큰 지그일수록 대물, 소형은 항상 가능)
      ctx.lureWeightG = InventoryStore.getLureRigWeightG();
    }
    // 포말지대(농어 야간 예외) — 발앞 반탄류(counter) 존이 백파·포말대에 해당
    ctx.inWashZone = this.lastTidal?.zone === 'counter';
    // 필드 이벤트(보일링/스쿨링) 착수 보너스 — 어종 가중 병합 + tier 상향
    const ev = this.cfg.fieldEvent;
    if (ev) {
      if (ev.speciesBias) ctx.speciesWeightBias = { ...ev.speciesBias, ...ctx.speciesWeightBias };
      if (ev.tierBoost) ctx.eventTierBoost = true;
    }
    return ctx;
  }

  /** 밑걸림 발생 — 찌 아래 채비 전체 손실(수중찌·루어 포함) + 즉시 필드 복귀 */
  private onSnagged(): void {
    const lost = [...InventoryStore.loseRigParts(['float', 'subFloat', 'swivel', 'leader', 'sinker', 'hook', 'bait'] as RigStepKey[]),
      ...(this.lureMode ? InventoryStore.loseLureRig() : [])];
    this.failAndExit('밑걸림! 채비를 통째로 잃었습니다',
      `여 밭에 채비가 파묻혀 원줄을 끊었습니다.\n손실: ${lost.length > 0 ? lost.join(', ') : '없음'}\n\n뒷줄견제(H)로 미끼를 띄우면 밑걸림을 예방할 수 있습니다.`);
  }

  // ── 파이팅 상태 ──────────────────────────────────────
  private updateFighting(dt: number): void {
    if (!this.fight || !this.hookedFish) return;
    if (this.dragInMode) { this.updateDragIn(dt); return; }

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

    // 로드 스티어 (←/→) — 횡이동 러닝과 같은쪽 = 버티기 / 반대쪽 = 제압 (core 밀당)
    const steerDir: -1 | 0 | 1 = this.steerLeftKey?.isDown ? -1 : this.steerRightKey?.isDown ? 1 : 0;
    const st = this.fight.update({ dtSec: dt, holding: this.hKey.isDown, reeling: effectiveReeling, steerDir });

    // ── 피로 페이즈 갱신 — 장력·릴링·견제가 피로를 누적, 슬랙이면 회복(긴장 유지) ──
    this.lastFatigue = this.fatigue?.update({
      dtSec: dt, reeling: effectiveReeling, holding: this.hKey.isDown,
      tensionRatio: st.tension / 100, randomUnit: Math.random(),
    }) ?? null;

    // 파이트 2D 시뮬 (물고기 좌표/heading/깊이 — 정면·수평·수직뷰가 소비) 갱신
    this.updateFight2DSim(dt, st, effectiveReeling);
    this.rodBendDeg = 20 + (st.tension / 100) * 45;   // 파이팅 중 초릿대는 텐션 비례로 휨

    // ── 파이트 실거리/실수심 반영 — 수직뷰(우측)·정면 원근이 실시간으로 따라온다 ──
    // 줄 풀림: 물고기가 힘을 쓸수록(게이트) 거리가 늘고, 릴링하면 줄어든다
    const gateNow = this.lastFatigue?.thrustGate ?? 0.6;
    const takeLine = (st.pattern === 'dive' ? 0.35 : st.pattern === 'lateral' ? 0.6 : 0.85)
      * (0.35 + this.hookedFish.powerFactor) * gateNow;
    const reelIn = effectiveReeling ? 1.35 : 0;
    this.distM = Phaser.Math.Clamp(
      this.distM + (takeLine - reelIn) * dt, 1.2, this.cfg.castDistanceM * 1.6);
    // 수심: f2d 깊이 정규화를 실수심으로 투영 — 다이브 시 바닥으로 박고, 제압되면 부상
    const bottomNow = this.getBottomDepthAt();
    const targetZ = Phaser.Math.Clamp(this.fightDepthNorm * bottomNow, 0.3, bottomNow);
    this.rig.baitZ += (targetZ - this.rig.baitZ) * Math.min(1, dt * 2.5);

    this.renderFightUi(st);

    // 패턴 경고 — 피로 서지 버스트가 최우선
    if ((this.lastFatigue?.surgeBurst ?? 0) > 0) {
      this.patternText.setText('파상 저항! 순간 폭발 — 릴링 신중!').setVisible(true);
    } else if (st.pattern === 'jump') {
      this.patternText.setText('바늘털이! 릴링 멈추고 H를 떼세요!').setVisible(true);
    } else if (st.pattern === 'dive') {
      this.patternText.setText('여 박기! H를 꾹 눌러 버티세요!').setVisible(true);
    } else if (st.pattern === 'lateral') {
      this.patternText.setText(`횡으로 쏩니다! ${st.lateralDir < 0 ? '←' : '→'} 같은쪽 스티어로 버티세요!`).setVisible(true);
    } else {
      this.patternText.setVisible(false);
    }

    // 물고기 실루엣 요동 — 얕을수록 선명, 깊을수록 옅게 (찌 투명도와 같은 방향)
    if (this.fishShadow) {
      const bx = this.screenX(this.rig.baitX);
      const wob = Math.sin(this.time.now / 90) * (6 + this.hookedFish.powerFactor * 10);
      const zTarget = st.pattern === 'jump' ? WATERLINE + 6 : this.depthY(Math.min(this.cfg.zMaxM, this.rig.baitZ + (st.pattern === 'dive' ? 1.5 : 0)));
      this.fishShadow.setPosition(bx + wob, zTarget + Math.abs(wob) * 0.4);
      this.fishShadow.setAlpha(Phaser.Math.Clamp(1 - this.fightDepthNorm, 0.15, 0.9));
    }

    if (st.event !== 'none') {
      this.patternText.setVisible(false);
      switch (st.event) {
        case 'landed': {
          // 물리 정합: 발앞(3m)보다 멀면 아직 낚아올릴 수 없다 — 제압 후 끌어오기
          if (this.distM > 3) this.beginDragIn();
          else this.onLanded();
          break;
        }
        case 'line_break': {
          // 목줄 터짐 — 30% 확률로 찌(원줄 파단 — 수중찌 포함)까지 함께 손실.
          // 루어 모드는 루어도 목줄째 손실.
          const floatToo = Math.random() < 0.3;
          const parts: RigStepKey[] = floatToo
            ? ['float', 'subFloat', 'swivel', 'leader', 'sinker', 'hook', 'bait']
            : ['leader', 'sinker', 'hook', 'bait'];
          const lost = [...InventoryStore.loseRigParts(parts), ...(this.lureMode ? InventoryStore.loseLureRig() : [])];
          this.failAndExit(floatToo ? '줄터짐! 찌까지 터졌습니다' : '줄터짐! 목줄이 터졌습니다',
            `텐션이 한계를 넘어 ${floatToo ? '찌 위에서' : '목줄이'} 터졌습니다.\n손실: ${lost.join(', ')}\n\nU 채비하기에서 재장착 후 다시 캐스팅하세요.`);
          break;
        }
        case 'hook_off': {
          // 미끼 털림 / 복어류는 목줄째 절단
          if (this.hookedFish?.lineCutter) {
            const lost = [...InventoryStore.loseRigParts(['leader', 'sinker', 'hook', 'bait'] as RigStepKey[]),
              ...(this.lureMode ? InventoryStore.loseLureRig() : [])];
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
      ? ['float', 'subFloat', 'swivel', 'leader', 'sinker', 'hook', 'bait']
      : ['leader', 'sinker', 'hook', 'bait'];
    const lost = [...InventoryStore.loseRigParts(parts), ...(this.lureMode ? InventoryStore.loseLureRig() : [])];
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
    this.clearFight2DStage();
    this.fishShadow?.destroy();
    this.fishShadow = undefined;
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
    const fishTexture = resolveFishTexture(f.speciesId, f.lengthCm, f.sex);

    if (protectedFish) {
      const reason = f.isClosedSeason ? '금어기' : `금지체장 미만`;
      this.finishFight(`${f.nameKo} ${f.lengthCm}cm — 방생`,
        `${f.nameKo} ${f.lengthCm}cm / ${(f.weightG / 1000).toFixed(2)}kg / ${sexLabel}\n\n${reason} 개체입니다. 규정에 따라 방생합니다.`, '#9fd0e4', fishTexture);
    } else {
      // 도감/기록 등록은 어획 시점 (쿨러 보관/방생 선택과 무관)
      this.sessionCatch.push(`${f.nameKo} ${f.lengthCm}cm (${sexLabel})`);
      GameState.addCaughtFish(f.speciesId, f.nameKo, f.lengthCm, f.weightG);

      // ── 다관점 히트 (Multi-Hit): 카드 채비의 다른 바늘에도 개별 입질 판정 ──
      const extra = this.rollMultiHit();
      this.refreshCoolerUi();

      // 보관/방생 선택은 유저 몫 — 결정 패널 표시
      this.fpState = 'result';
      this.fight = null;
      this.clearFight2DStage();
      this.fishShadow?.destroy();
      this.fishShadow = undefined;
        this.showCatchDecisionPanel(f, extra, fishTexture);
    }
  }

  /**
   * 어획 결정 패널 — [쿨러에 보관하기] / [인벤토리에 보관하기] / [방생하기] 선택.
   * 쿨러(기타 아이템) 미보유 시 '쿨러에 보관하기'는 비활성 — 인벤토리/방생만 가능.
   * 선택 후 안내 메시지와 함께 [계속하기] / [그만하기]로 이어진다.
   */
  private showCatchDecisionPanel(f: SpawnedFish, extra: string[], fishTexture?: string): void {
    const sexLabel = f.sex === 'M' ? '수컷' : '암컷';
    const extraLine = extra.length > 0
      ? `\n\n다관점 히트! 카드 채비 추가 어획 ${extra.length}마리:\n${extra.join(', ')}`
      : '';
    const body = `${f.nameKo} ${f.lengthCm}cm / ${(f.weightG / 1000).toFixed(2)}kg / ${sexLabel}${extraLine}`;
    const hasCooler = InventoryStore.hasCooler();
    this.buildDecisionPanel(
      `${f.nameKo} ${f.lengthCm}cm 낚음!${extra.length > 0 ? ` (+${extra.length})` : ''}`,
      body, '#4af2a1', fishTexture,
      [
        {
          label: '쿨러에 보관하기', fill: 0x0d4a2e, stroke: 0x4af2a1, color: '#4af2a1',
          disabled: !hasCooler,
          disabledHint: '쿨러가 없습니다 — 기타 아이템에 쿨러(아이스박스)가 필요합니다',
          onClick: () => {
            if (CoolerStore.isFull()) {
              this.flashState(`쿨러가 가득 찼습니다 (${COOLER_CAPACITY}마리) — 방생하거나 쿨러를 비우세요`);
              return;
            }
            CoolerStore.add({
              speciesId: f.speciesId, nameKo: f.nameKo, lengthCm: f.lengthCm,
              weightG: f.weightG, sex: f.sex, iconTexture: fishTexture,
            });
            this.refreshCoolerUi();
            this.showPostDecisionPanel('쿨러에 보관하였습니다.', '#4af2a1', fishTexture);
          },
        },
        {
          label: '인벤토리에 보관하기', fill: 0x14425e, stroke: 0x33b0e0, color: '#aee8ff',
          onClick: () => {
            const ok = InventoryStore.addItem({
              id: `inv_catch_${f.speciesId}_${InventoryStore.nextCatchSeq()}`,
              name: `${f.nameKo} (${f.lengthCm}cm)`,
              icon: '🐟', iconTexture: fishTexture,
              category: 'food', subCategory: '어획물',
              basePrice: Math.max(2000, Math.round(f.weightG * 12)),
              condition: 'live', equippable: false,
              speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG,
            }, 1);
            if (!ok) {
              this.flashState('인벤토리(음식) 공간이 없습니다 — 방생하거나 자리를 비우세요');
              return;
            }
            this.showPostDecisionPanel('인벤토리에 보관하였습니다. (활어 10분부터 신선도 진행)', '#aee8ff', fishTexture);
          },
        },
        {
          label: '방생하기', fill: 0x123a52, stroke: 0x5cd0ff, color: '#9fd0e4',
          onClick: () => this.showPostDecisionPanel('해당 어종을 방생하였습니다.', '#9fd0e4', fishTexture),
        },
      ],
    );
  }

  /** 보관/방생 후 안내 — [계속하기] / [그만하기] */
  private showPostDecisionPanel(message: string, color: string, fishTexture?: string): void {
    const missing = InventoryStore.getMissingRigParts();
    const buttons: DecisionButton[] = [];
    if (missing.length === 0) {
      buttons.push({
        label: '계속하기 (SPACE)', fill: 0x0d4a2e, stroke: 0x4af2a1, color: '#4af2a1',
        onClick: () => this.recast(),
      });
    }
    buttons.push({
      label: '그만하기 (ESC)', fill: 0x3a2020, stroke: 0x8a4a4a, color: '#ffb0a0',
      onClick: () => this.exitToField(),
    });
    this.buildDecisionPanel(
      message,
      missing.length > 0 ? `채비 보충 필요: ${missing.join(', ')}\n(U 채비하기에서 재장착 후 다시 캐스팅)` : '계속 낚시하거나 필드로 복귀하세요.',
      color, fishTexture, buttons,
    );
  }

  /** 결정 패널 공통 렌더 — 제목/본문/어종 이미지 + 버튼 목록 */
  private buildDecisionPanel(
    title: string, body: string, color: string, fishTexture: string | undefined,
    buttons: DecisionButton[],
  ): void {
    this.resultContainer?.destroy();
    const hasImage = !!fishTexture && this.textures.exists(fishTexture);
    const ph = hasImage ? 380 : 250;
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

    if (hasImage && fishTexture) {
      const src = this.textures.get(fishTexture).getSourceImage() as HTMLImageElement;
      const scale = Math.min(320 / src.width, 130 / src.height);
      const img = this.add.image(0, -half + 122, fishTexture)
        .setDisplaySize(src.width * scale, src.height * scale);
      c.add(img);
    }

    const t2 = this.add.text(0, hasImage ? half - 130 : -10, body, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#d0e8f5', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    c.add(t2);

    const btnY = half - 48;
    // 버튼 폭/간격 — 개수에 따라 자동 배치 (3개 = 어획 결정 쿨러/인벤/방생)
    const bw = buttons.length >= 3 ? 142 : buttons.length === 2 ? 180 : 200;
    const spacing = bw + 10;
    buttons.forEach((btn, i) => {
      const bx = (i - (buttons.length - 1) / 2) * spacing;
      const g = this.add.graphics();
      if (btn.disabled) {
        g.fillStyle(0x18222e, 0.95); g.fillRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 5);
        g.lineStyle(2, 0x2a3846, 1); g.strokeRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 5);
      } else {
        g.fillStyle(btn.fill, 0.95); g.fillRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 5);
        g.lineStyle(2, btn.stroke, 1); g.strokeRoundedRect(bx - bw / 2, btnY - 19, bw, 38, 5);
      }
      const txt = this.add.text(bx, btnY, btn.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: buttons.length >= 3 ? '12px' : '13px',
        color: btn.disabled ? '#546a7c' : btn.color, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(bx, btnY, bw, 38, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: !btn.disabled });
      if (btn.disabled) {
        // 비활성 — 클릭 시 사유 안내만
        hit.on('pointerdown', () => { if (btn.disabledHint) this.flashState(btn.disabledHint); });
      } else {
        hit.on('pointerover', () => txt.setColor('#ffffff'));
        hit.on('pointerout', () => txt.setColor(btn.color));
        hit.on('pointerdown', btn.onClick);
      }
      c.add([g, txt, hit]);
    });

    applyScreenFixed(c);
    this.resultContainer = c;
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
        // 추가 어획은 어창(쿨러)에 즉시 보관 — 쿨러 미보유 시 인벤토리 직행,
        // 둘 다 공간 없으면 방생 처리
        const efTexture = resolveFishTexture(ef.speciesId, ef.lengthCm, ef.sex);
        let tag = '';
        if (InventoryStore.hasCooler()) {
          const slot = CoolerStore.add({
            speciesId: ef.speciesId, nameKo: ef.nameKo, lengthCm: ef.lengthCm,
            weightG: ef.weightG, sex: ef.sex, iconTexture: efTexture,
          });
          tag = slot < 0 ? ' (쿨러 가득 — 방생)' : ' (어창)';
        } else {
          const ok = InventoryStore.addItem({
            id: `inv_catch_${ef.speciesId}_${InventoryStore.nextCatchSeq()}`,
            name: `${ef.nameKo} (${ef.lengthCm}cm)`,
            icon: '🐟', iconTexture: efTexture,
            category: 'food', subCategory: '어획물',
            basePrice: Math.max(2000, Math.round(ef.weightG * 12)),
            condition: 'live', equippable: false,
            speciesId: ef.speciesId, lengthCm: ef.lengthCm, weightG: ef.weightG,
          }, 1);
          tag = ok ? ' (인벤토리)' : ' (인벤 가득 — 방생)';
        }
        this.sessionCatch.push(`${ef.nameKo} ${ef.lengthCm}cm`);
        GameState.addCaughtFish(ef.speciesId, ef.nameKo, ef.lengthCm, ef.weightG);
        InventoryStore.setSpreaderBait(i, null);   // 해당 단 미끼 소모
        extra.push(`${ef.nameKo} ${ef.lengthCm}cm${tag}`);
      }
    }
    return extra;
  }

  private finishFight(title: string, body: string, color: string, fishTexture?: string): void {
    this.fpState = 'result';
    this.fight = null;
    this.clearFight2DStage();
    this.fishShadow?.destroy();
    this.fishShadow = undefined;
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
    this.clearFight2DStage();
    this.rig = createUnderwaterRig(0);
    this.viewCenterX = 0;
    this.lineTension.resetAlignment();
    this.biteEngine.reset();
    this.biteSeq.reset();
    this.holdAnchorZ = null;
    this.hookedFish = null;
    this.pendingFish = null;
    this.rodBendDeg = 0;
    this.floatSinkM = 0;
    this.distM = this.cfg.castDistanceM;
    this.overstrain = 0;
    this.rigPose = 'idle';
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

    // ── 회수 매핑 (A-1): retrieveT = 1 − distM/castDist → easeOutCubic ──
    const p = Phaser.Math.Easing.Cubic.Out(this.retrieveT());
    const surfY = this.surfaceYAt(this.distM);
    const fx = this.screenX(this.rig.floatX);
    const wave = Math.sin(this.time.now / 500) * 2.2;
    // 입질 단계별 찌 잠김 (1단계 0.05m / 2단계 0.10m / 3단계 0.25m) — 시각 배율 x3
    const sinkPx = this.floatSinkM * this.pxPerMZ * 3;
    // ── 입질/챔질 시 채비 세트 전체가 물속으로 당겨지는 연출 (초릿대 굽힘 비례) ──
    const bitePull = this.fpState !== 'fighting'
      ? Phaser.Math.Clamp(this.rodBendDeg / 50, 0, 1.1) * 44
      : 0;

    // 세트 스케일 — 수평선 부근 0.72배 → 회수 완료 시 ×scaleMax (기본 2, 과대 확대 금지)
    const setScale = BASE_RIG_SCALE * (1 + p * (TUNING.retrieve.scaleMax - 1));

    // ── 표시 heading — 목표각으로 머리가 먼저 돌고(빠른 lerp) 몸이 따라온다 ──
    this.visHeading = this.lerpHeading(this.visHeading, this.rigHeadingTarget(), 0.16);

    if (this.fpState === 'fighting' && !this.dragInMode && this.hookedFish) {
      // ── 활성 파이트 — 세트 그룹 숨김: 찌 + 정면 물고기 투영 (v2 연출 유지) ──
      this.retrieveGroup.setVisible(false);
      const dn = this.fightDepthNorm;
      const floatY = surfY + wave + dn * 30;
      if (!this.surfMode) {
        this.drawFloatShape(g, fx, floatY, setScale, Phaser.Math.Clamp(1 - dn * 1.15, 0, 1));
      }
      const bxF = Phaser.Math.Clamp(fx + this.f2dPos.x * 0.55, 30, GAME_WIDTH - 30);
      const byF = surfY + 12 + dn * Math.max(40, Math.min(170, GAME_HEIGHT - 70 - surfY));
      const fAlpha = Phaser.Math.Clamp(1 - dn, 0.15, 0.9);
      const fScale = setScale * Phaser.Math.Clamp(0.9 + this.hookedFish.powerFactor * 0.7, 0.9, 1.7);
      // 목줄은 물고기 "머리 꼭짓점"에 연결 (몸통 중앙 금지)
      const head = fishHeadPoint(bxF, byF, this.visHeading, fScale);
      g.lineStyle(1.4, 0xd8ecf8, 0.5);
      g.beginPath();
      g.moveTo(fx, surfY + 6);
      g.lineTo((fx + head.x) / 2, (surfY + 6 + head.y) / 2);
      g.lineTo(head.x, head.y);
      g.strokePath();
      drawRigIcon(g, bxF, byF, { t: 'fish', speciesId: this.hookedFish.speciesId }, this.visHeading, fScale, fAlpha);
      // 원줄 연결점 — 찌낚시는 찌 상단, 원투/루어는 물고기 머리
      this.groupTopWorld = this.surfMode
        ? { x: head.x, y: head.y }
        : { x: fx, y: floatY - 16 * setScale };
    } else {
      // ── 채비 세트 (retrieveGroup) — 드리프트/결과/제압 끌어오기(dragIn) 공통 ──
      this.retrieveGroup.setVisible(true);
      this.updateRetrieveGroup(p, fx, surfY + wave + bitePull, setScale, sinkPx);
    }

    // ── 우측 상단 수심 정보 패널 (전용 레이어 — 낚싯대와 겹치지 않음) ──
    this.panelG.clear();
    this.renderDepthPanel(this.panelG);
  }

  /**
   * 회수 세트 갱신 (A-2) — 모드별 구성:
   *  찌 채비 = 찌 + 목줄 + 좁쌀봉돌 + 미끼 (+dragIn 물고기), top 앵커 = 찌 상단
   *  원투     = 수면 진입점 + 무게추 봉돌 + 미끼,             top 앵커 = 수면 진입점
   *  루어     = 루어 (+물고기, 찌 없음),                      원줄 연결점 = 루어 라인타이
   * scale/pos/alpha는 컨테이너에만 적용 → 세트 전체가 함께 딸려온다. 원줄은
   * renderRod가 rodTip→groupTopWorld로 매 프레임 재드로우 (컨테이너에 넣으면
   * scale로 굵기·길이가 왜곡되므로 분리 — 굵기 고정, 좌표만 갱신).
   */
  private updateRetrieveGroup(p: number, fx: number, gy: number, scale: number, sinkPx: number): void {
    const sg = this.setG;
    sg.clear();

    // 컨테이너 변환 — x는 회수될수록 화면 중앙으로 수렴 (A-1)
    const gx = Phaser.Math.Linear(fx, GAME_WIDTH / 2, p);
    const alpha = Phaser.Math.Linear(0.8, 1, p);
    this.retrieveGroup.setPosition(gx, gy).setScale(scale).setAlpha(alpha);

    // 로컬 좌표계 — (0,0) = 세트 top 앵커. 수심은 로컬 px 압축 (원근은 컨테이너 scale)
    const dl = this.pxPerMZ * 0.55;
    const latLocal = Phaser.Math.Clamp((this.rig.baitX - this.rig.floatX) * PX_PER_M_X * 0.6, -140, 140);
    const maxLocal = Math.max(20, (GAME_HEIGHT - 46 - gy) / scale);
    const depthLocal = Math.min(maxLocal, this.rig.baitZ * dl);
    const la = Phaser.Math.Linear(0.62, 0.95, p);   // 수중 요소 알파 — 회수될수록 선명
    const dragFish = this.dragInMode && !!this.hookedFish;
    const foreshorten = this.rigPose === 'retrieve' ? 0.55 : 1;

    if (this.lureMode) {
      // ── B 모드: 루어 단독 (찌 없음) — 원줄은 루어 라인타이로 직결 ──
      if (dragFish) this.drawSetFish(sg, latLocal, depthLocal);
      else drawRigIcon(sg, latLocal, depthLocal, this.currentIconKind(), this.visHeading, 1, la, foreshorten);
      this.groupTopWorld = { x: gx + latLocal * scale, y: gy + (depthLocal - 12) * scale };
      return;
    }

    // ── 찌/원투 공통: 수중 목줄 (top → 터미널, 정렬도 사선 — 세트 내부라 함께 scale) ──
    const sinkLocal = this.surfMode ? 0 : sinkPx * 0.8;   // 찌 잠김 (로컬)
    const lineTop = this.surfMode ? 2 : sinkLocal + 8;
    const midX = latLocal / 2 + (1 - this.lineTension.alignmentIndex) * 14;
    sg.lineStyle(1.2, 0xd8ecf8, la * 0.62);
    sg.beginPath();
    sg.moveTo(0, lineTop);
    sg.lineTo(midX, (lineTop + depthLocal) / 2);
    sg.lineTo(latLocal, depthLocal - 4);
    sg.strokePath();

    if (this.surfMode) {
      // 수면 진입점 마커 (원투 — 찌 없음)
      sg.fillStyle(0x9fd0e4, 0.9);
      sg.fillTriangle(-4, -2, 4, -2, 0, 5);
      // 무게추 봉돌 — 터미널 바로 위 (바닥 공략 표현)
      sg.fillStyle(0x6a6f78, la);
      sg.fillEllipse(latLocal, depthLocal - 13, 7, 12);
      sg.lineStyle(1, 0x2a2e34, la * 0.8);
      sg.strokeEllipse(latLocal, depthLocal - 13, 7, 12);
    } else {
      // 찌 (세트 top — 잠김 반영) + 좁쌀봉돌 (목줄 70% 지점)
      const biteAlpha = Phaser.Math.Clamp(1 - (this.floatSinkM / 0.25) * 0.55, 0.45, 1);
      this.drawFloatShape(sg, 0, sinkLocal, 1, biteAlpha);
      sg.fillStyle(0x3a3f48, la);
      sg.fillCircle(Phaser.Math.Linear(0, latLocal, 0.7), Phaser.Math.Linear(lineTop, depthLocal, 0.7), 2.2);
    }

    // 터미널 — dragIn 제압 물고기 편입 or 미끼 아이콘
    if (dragFish) this.drawSetFish(sg, latLocal, depthLocal);
    else drawRigIcon(sg, latLocal, depthLocal, this.currentIconKind(), this.visHeading, 1, la, foreshorten);

    // 원줄 연결점 (월드) — 찌 상단 / 원투 수면 진입점
    this.groupTopWorld = {
      x: gx,
      y: this.surfMode ? gy : gy + (sinkLocal - 16) * scale,
    };
  }

  /**
   * 세트 편입 물고기 (dragIn — A-3): 머리 카메라쪽(정면 foreshorten 0.5) + 지친 롤
   * (은빛 배 셰이드 + 좌우 요동). 수면 부상은 updateDragIn의 fightDepthNorm이 구동.
   */
  private drawSetFish(sg: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const f = this.hookedFish!;
    const roll = Math.sin(this.time.now / 240) * 0.18;
    const fScale = Phaser.Math.Clamp(0.9 + f.powerFactor * 0.7, 0.9, 1.7);
    // 은빛 롤 셰이드 (지쳐 옆으로 누운 배)
    sg.fillStyle(0xe8f0f4, 0.28);
    sg.fillEllipse(x, y + 2, 30 * fScale, 10 * fScale);
    drawRigIcon(sg, x, y, { t: 'fish', speciesId: f.speciesId }, this.visHeading + roll, fScale, 0.95, 0.5);
  }

  /**
   * 좌측 하단 수평뷰(top-down plan) — 위에서 본 평면: 하단 중앙 = 나, 위 = 캐스팅 방향.
   * 거리 링(10m 간격) + 조류 화살표 + 채비/물고기 마커. 정면 뷰(원근)·수직뷰(수심)와
   * 같은 스냅샷(distM·rig·f2d)을 소비해 물고기의 좌우/전후 이동을 명확히 보여준다.
   * (v2.1 — 좌하단 재배치 + 링 반경을 가로/세로 모두 패널 안으로 클램프)
   */
  private renderPlanView(): void {
    const g = this.planG;
    g.clear();
    // result(결과/결정 패널) 상태에서도 마지막 채비 위치를 계속 표시 (갑자기 사라지지 않게)

    const PX = 16, PY = 408, PW = 232, PH = 212;
    g.fillStyle(0x08131f, 0.82);
    g.fillRoundedRect(PX, PY, PW, PH, 8);
    g.lineStyle(1.5, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(PX, PY, PW, PH, 8);

    const mx = PX + PW / 2;
    const my = PY + PH - 18;
    const maxD = Math.max(this.cfg.castDistanceM, this.distM, 12) * 1.15;
    // 링이 사각 창 밖으로 나가지 않도록 세로·가로 중 좁은 쪽 기준으로 스케일
    const s = Math.min((PH - 46) / maxD, (PW / 2 - 16) / maxD);

    // 거리 링 (10m 간격 반원) + 캐스팅 방향 축선
    g.lineStyle(1, 0x1c3c58, 0.85);
    for (let d = 10; d <= maxD; d += 10) {
      g.beginPath();
      g.arc(mx, my, d * s, Math.PI, Math.PI * 2, false);
      g.strokePath();
    }
    g.lineBetween(mx, my, mx, PY + 12);

    // 나 (하단 중앙 — 위(캐스팅 방향)를 보는 삼각)
    g.fillStyle(0xd8d4c8, 1);
    g.fillTriangle(mx - 5, my + 5, mx + 5, my + 5, mx, my - 6);

    // 조류 화살표 (우상단 소형 — +y(멀어짐)를 화면 위로 투영)
    const tf = this.lastTidal?.force ?? { x: 0, y: 0 };
    if (Math.hypot(tf.x, tf.y) > 0.02) {
      const ang = Math.atan2(-tf.y, tf.x);
      const ax = PX + PW - 26, ay = PY + 20;
      const hxA = Math.cos(ang), hyA = Math.sin(ang);
      g.lineStyle(1.6, 0x5cd0ff, 0.85);
      g.lineBetween(ax - hxA * 9, ay - hyA * 9, ax + hxA * 6, ay + hyA * 6);
      g.fillStyle(0x5cd0ff, 0.85);
      g.fillTriangle(
        ax + hxA * 11, ay + hyA * 11,
        ax + hxA * 4 - hyA * 3.4, ay + hyA * 4 + hxA * 3.4,
        ax + hxA * 4 + hyA * 3.4, ay + hyA * 4 - hxA * 3.4,
      );
    }

    // ── 밑밥 파슬 (수평뷰 투영 — 정면/수직뷰와 같은 parcel 시뮬) ──
    for (const pc of this.chumParcels) {
      const fresh = 1 - Math.min(1, pc.ageSec / pc.ttlSec);
      const cxp = Phaser.Math.Clamp(mx + pc.x * s * 1.6, PX + 10, PX + PW - 10);
      const cyp = Phaser.Math.Clamp(my - pc.d * s, PY + 12, my - 2);
      g.fillStyle(0xc9a86a, 0.18 + fresh * 0.32);
      g.fillCircle(cxp, cyp, 2 + pc.spreadM * 0.8);
    }

    // ── 채비/물고기 마커 (파이트 중엔 횡 러닝을 f2d 무대에서 투영) ──
    const fight = this.fpState === 'fighting' && !!this.hookedFish;
    const latM = this.rig.baitX + (fight ? this.f2dPos.x / 22 : 0);
    const dM = this.distM;
    const rx = Phaser.Math.Clamp(mx + latM * s * 1.6, PX + 12, PX + PW - 12);
    const ry = Phaser.Math.Clamp(my - dM * s, PY + 14, my - 4);

    // 이동 방향 → plan heading 선행 lerp (움직일 때만 갱신 — 머리가 먼저 돈다)
    const dxm = latM - this.planPrev.x;
    const ddm = dM - this.planPrev.d;
    if (Math.hypot(dxm, ddm) > 0.015) {
      this.planHeading = this.lerpHeading(this.planHeading, Math.atan2(-ddm, dxm), 0.3);
    }
    this.planPrev = { x: latM, d: dM };

    // 줄 (나 → 채비) + 마커
    g.lineStyle(1, 0xd8ecf8, 0.35);
    g.lineBetween(mx, my - 5, rx, ry);
    drawRigIcon(g, rx, ry,
      fight ? { t: 'fish', speciesId: this.hookedFish!.speciesId } : this.currentIconKind(),
      this.planHeading, 0.72, 0.95);

    // 찌 마커 (찌낚시 평시 — 채비와 구분되는 주황 점)
    if (!fight && !this.surfMode && !this.lureMode) {
      const fxp = Phaser.Math.Clamp(mx + this.rig.floatX * s * 1.6, PX + 12, PX + PW - 12);
      g.fillStyle(0xff5a3c, 0.9);
      g.fillCircle(fxp, ry, 2.6);
    }
  }

  /** 현재 채비 터미널 아이콘 종류 — 루어 kind / 미끼(웜·새우·살점) / 떡밥 */
  private currentIconKind(): RigIconKind {
    if (this.lureMode && this.lureSpec) return { t: 'lure', kind: this.lureSpec.kind };
    const key = this.currentBaitKey();
    if (key === 'worm_king' || key === 'worm_blue') return { t: 'bait', kind: 'worm' };
    if (key === 'bread' || key === 'corn') return { t: 'chum' };
    if (key === 'fishcut') return { t: 'bait', kind: 'strip' };
    return { t: 'bait', kind: 'shrimp' };
  }

  /** 최단각 보간 — heading 선행 lerp의 공통 유틸 */
  private lerpHeading(current: number, target: number, k: number): number {
    let d = target - current;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return current + d * k;
  }

  /** 채비/물고기 정면 뷰 목표 heading — 파이트는 무대 heading, 드리프트는 자세 기반 */
  private rigHeadingTarget(): number {
    if (this.fpState === 'fighting') return this.f2dHeading;
    const drift = (this.lastTidal?.force.x ?? 0) >= 0 ? 1 : -1;
    switch (this.rigPose) {
      case 'lift': return -Math.PI / 2 + drift * 0.35;    // 상승
      case 'fall': return Math.PI / 2 - drift * 0.3;      // 폴 (하강)
      case 'retrieve': return drift > 0 ? Math.PI - 0.35 : 0.35;   // 내 쪽으로 끌려옴 (역방향)
      case 'twitch': return drift * -0.5;                 // 측면 다트
      case 'hop': return -Math.PI / 3;
      default: return drift > 0 ? 0.22 : Math.PI - 0.22;  // 조류 방향으로 흘러감
    }
  }

  /**
   * 우측 상단 수심 모식도 — 상단 거리축(채비→나) + 수심층(상/중/바닥) +
   * 찌(수면 경계)/면사매듭/채비 자세 아이콘 + 원투 다단 훅 도트.
   */
  private renderDepthPanel(g: Phaser.GameObjects.Graphics): void {
    // 확장 레이아웃 — 좌측 넓은 게이지 박스(채비 좌우 이동까지 표현) + 우측 텍스트 열
    // (2026-07-20: 낚싯대 개편에 맞춰 소폭 축소 354×302 → 338×288)
    const pw = 338;
    const ph = 288;
    const px = GAME_WIDTH - pw - 14;
    const py = 44;
    const boxX = px + 14;                 // 게이지 박스 좌측
    const boxW = 196;                     // 게이지 박스 폭 (넓게)
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

    // ── 해저 지형 단면 (거리 연속 — 채비 위치 중심 ±12m 창, 릴링 시 함께 흐름) ──
    // 박스 좌측 = 채비 너머(멀리) / 우측 = 나(유저) 쪽 — 상단 거리축과 같은 방향감
    this.renderSeabedSection(g, boxX, boxW, gaugeTop, gaugeH, yOf);

    // ── 밑밥 파슬 (수직뷰 — 거리 근접분만, 침강 구름) ──
    for (const pc of this.chumParcels) {
      const dNear = Math.abs(pc.d - this.distM);
      if (dNear > 14) continue;
      const fresh = 1 - Math.min(1, pc.ageSec / pc.ttlSec);
      const a = (0.12 + fresh * 0.3) * (1 - dNear / 14);
      const cxp = Phaser.Math.Clamp(centerX + (pc.x - this.rig.floatX) * 10, boxX + 8, boxX + boxW - 8);
      g.fillStyle(0xc9a86a, a);
      g.fillCircle(cxp, yOf(pc.z), 3 + pc.spreadM * 1.6);
    }

    // 채비 좌우 편차 (조류/릴링에 따른 X 이동 — 찌 기준)
    const latPx = Phaser.Math.Clamp((this.rig.baitX - this.rig.floatX) * 10, -(boxW / 2 - 24), boxW / 2 - 24);
    const rigX = centerX + latPx;

    // 침강 라인 (수면 진입 → 채비, 좌우 편차 반영 사선)
    g.lineStyle(1.4, 0x9fd0e4, 0.8);
    g.lineBetween(centerX, yOf(this.surfMode ? 0 : this.floatSinkM), rigX, yOf(this.rig.baitZ));

    if (this.surfMode) {
      // 원투 모드: 찌 대신 수면 진입점만 표시하고, 채비 위에 무게추 봉돌을 그린다
      g.fillStyle(0x9fd0e4, 0.9);
      g.fillTriangle(centerX - 4, gaugeTop, centerX + 4, gaugeTop, centerX, gaugeTop + 6);
      const sinkerY = yOf(this.rig.baitZ) - 9;
      g.fillStyle(0x6a6f78, 1);
      g.fillEllipse(rigX, sinkerY, 6, 10);
    } else {
      // 찌 — 수면(0m) 상단 경계에 걸침 + 입질 잠김 반영
      g.fillStyle(0xff6a2a, 1);
      g.fillEllipse(centerX, yOf(this.floatSinkM) - 2, 11, 9);
      g.fillStyle(0xfff4e0, 1);
      g.fillEllipse(centerX, yOf(this.floatSinkM) + 4, 8, 7);
    }

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
    const surfMode = this.surfMode;
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

    // 원투 모드 — 채비 부근 바닥 밀착 강조선 (지형 단면 위)
    if (surfMode) {
      const bedY = yOf(this.seabed.depthAt(this.distM));
      g.lineStyle(1.5, 0xffce54, 0.8);
      g.lineBetween(Math.max(boxX + 3, rigX - 26), bedY - 3, Math.min(boxX + boxW - 3, rigX + 26), bedY - 3);
    }

    // ── 우측 텍스트 열 (게이지 박스 밖 — 캡처 3 명세) ──
    const inReefHere = this.seabed.isRockAt(this.distM);
    const kelpHere = this.seabed.hasKelpAt(this.distM);
    const bedHere = this.seabed.depthAt(this.distM);
    const zoneLabel = this.lastTidal ? this.lastTidal.label.replace(' (Hit Zone)', '') : '';
    const hitZone = this.lastTidal?.zone === 'rip';
    // 원투 모드: 찌/매듭 대신 조법·초릿대 상태를 표기
    const topRows = this.surfMode
      ? ['원투 (찌 없음)', '입질은 초릿대 끝']
      : [
          `찌  ${this.floatSinkM > 0 ? `-${this.floatSinkM.toFixed(2)}m` : '0m'}`,
          Number.isFinite(this.zLimitM) ? `매듭  ${this.zLimitM}m` : '매듭 없음 (전유동)',
        ];
    this.depthValsText?.setText([
      ...topRows,
      `채비  ${this.rig.baitZ.toFixed(1)}m`,
      `바닥  ${bedHere.toFixed(1)}m`,
      inReefHere ? (kelpHere ? '여 밭 + 수초' : '여 밭 (암초)') : '모래/갯벌',
      hitZone ? `${zoneLabel} ★` : zoneLabel,
    ].join('\n'));
  }

  /**
   * 해저 지형 단면 렌더 — 채비 위치(distM) 중심 ±12m 거리 창.
   * 암초는 어두운 바위색 + 거친 상단, 모래는 밝은 모래색 + 완만한 기복,
   * 수초(켈프)는 암초 위에 흔들리는 녹색 줄기. 릴링으로 distM이 줄면
   * 단면이 유저 쪽 지형으로 자연스럽게 스크롤된다.
   */
  private renderSeabedSection(
    g: Phaser.GameObjects.Graphics,
    boxX: number, boxW: number, gaugeTop: number, gaugeH: number,
    yOf: (z: number) => number,
  ): void {
    const halfWinM = 12;
    const step = 4;   // px 단위 컬럼 폭
    const gaugeBottom = gaugeTop + gaugeH;
    // 박스 x → 거리: 좌측 = distM + halfWin (멀리), 우측 = distM - halfWin (나 쪽)
    const distAtX = (x: number): number =>
      Math.max(0, this.distM + ((boxX + boxW / 2 - x) / (boxW / 2)) * halfWinM);

    // 1) 바닥 채움 (컬럼 단위 — 암초/모래 색 구분)
    for (let x = boxX + 2; x < boxX + boxW - 2; x += step) {
      const d = distAtX(x + step / 2);
      const bedY = Math.min(gaugeBottom - 1, yOf(this.seabed.depthAt(d)));
      const rock = this.seabed.isRockAt(d);
      g.fillStyle(rock ? 0x4a4438 : 0x8a7a58, 0.95);
      g.fillRect(x, bedY, step, gaugeBottom - bedY);
      // 상단 능선 하이라이트 (암초는 거친 밝은 선)
      g.fillStyle(rock ? 0x6b6252 : 0xa89670, 0.9);
      g.fillRect(x, bedY, step, 2);
    }

    // 2) 수초(켈프) — 암초 위 흔들리는 줄기 (6px 간격 샘플)
    const sway = Math.sin(this.time.now / 900);
    g.lineStyle(1.6, 0x3f9e63, 0.85);
    for (let x = boxX + 6; x < boxX + boxW - 6; x += 6) {
      const d = distAtX(x);
      if (!this.seabed.hasKelpAt(d)) continue;
      const bedY = Math.min(gaugeBottom - 2, yOf(this.seabed.depthAt(d)));
      const hPx = Math.min(26, gaugeH * 0.16);
      g.beginPath();
      g.moveTo(x, bedY);
      g.lineTo(x + sway * 2.2, bedY - hPx * 0.5);
      g.lineTo(x + sway * 4, bedY - hPx);
      g.strokePath();
    }
  }

  /**
   * 좌측 정보 텍스트 — v2: 임시 게이지 바 3종은 제거되고 그 자리에 수평뷰(plan)가
   * 배치된다. 정렬도/동조율 등 수치는 수평뷰 아래 텍스트 블록으로 통합.
   */
  private renderGauges(probPerSec: number, chumSync: number, inReef: boolean, hold: boolean, snagProgress: number, actionLeft: number): void {
    this.uiG.clear();

    const lines = [
      `정렬도 A ${(this.lineTension.alignmentIndex * 100).toFixed(0)}%`,
      `밑밥 동조 ${(chumSync * 100).toFixed(0)}%${this.chumPredPeak >= 0 ? ` (투척 예측 ${(this.chumPredPeak * 100).toFixed(0)}%)` : ''}`,
      `입질 확률 ${(probPerSec * 100).toFixed(1)}%/s${actionLeft > 0 ? '  [리액션 x2.0]' : ''}${this.lureMode ? (this.lureActionMult < 1 ? '  [루어 방치 x0.15 — 액션 필요!]' : `  [액션 x${this.lureActionMult.toFixed(1)}]`) : ''}`,
      `피딩 ${this.feeding.label} x${this.feeding.activity.toFixed(2)}${this.cfg.fieldEvent ? `  [${this.cfg.fieldEvent.label} x${this.cfg.fieldEvent.biteMult.toFixed(1)}]` : ''}`,
      `지형: ${inReef ? (hold ? '여 밭 안착 (x2.5)' : '여 밭') : '모래/갯벌'}${snagProgress > 0.3 ? '  ⚠ 밑걸림 주의' : ''}`,
      `미끼 수심 ${this.rig.baitZ.toFixed(1)}m / 매듭 ${this.zLimitM}m / 바닥 ${this.cfg.zMaxM.toFixed(0)}m`,
    ];
    this.probText.setText(lines.join('\n')).setPosition(16, 40);
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

    const ft = this.lastFatigue;
    this.probText.setText([
      `텐션 ${st.tension.toFixed(0)} / 100  (안전 30~80)`,
      `랜딩 ${st.progress.toFixed(0)}%`,
      this.hookedFish ? `상대: ??? (힘 ${(this.hookedFish.powerFactor * 100).toFixed(0)})` : '',
      ft
        ? `피로: ${FATIGUE_PHASE_LABEL[ft.phase]} (잔여 ${(ft.ratio * 100).toFixed(0)}%)`
          + `${ft.recovering ? '  ⚠ 슬랙 — 물고기 회복 중!' : ''}${ft.phase === 'SPENT' ? '  — 랜딩 찬스!' : ''}`
        : '',
    ].join('\n')).setPosition(16, 40);
  }

  /**
   * 낚싯대 뷰 — 하단 모서리(설정: 좌/우)에서 손잡이+스피닝릴이 시작되어
   * 화면 중상단으로 뻗는 **5절 로드** (절 경계마다 가이드 링).
   *
   * 끝 3개 절(초릿대 구간)이 rodBendDeg에 따라 구부러지며, 방향은 **항상
   * 물(찌·수면) 쪽**이다 — 우측 로드는 로드 직선 기준 좌측 아래,
   * 좌측 로드는 우측 아래 (하늘 쪽으로 휘던 기존 버그 수정, 2026-07-20).
   */
  private renderRod(): void {
    const g = this.rodG;
    g.clear();

    const right = this.rodSide === 'right';
    const s = right ? 1 : -1;

    // 기저 휨: H 견제/파이팅 기본 자세 — 입질(rodBendDeg)이 여기에 더해진다
    const baseTension = this.fight ? 0.12 : (this.hKey?.isDown ? 0.18 : 0.06);
    const bendDeg = this.rodBendDeg;

    // 손잡이(버트): 하단 모서리(릴이 보이도록 살짝 안쪽) / 무부하 팁 목표: 화면 중상단
    const baseX = right ? GAME_WIDTH - 30 : 30;
    const baseY = GAME_HEIGHT - 2;
    const tipTargetX = GAME_WIDTH / 2 + s * 76;
    const tipTargetY = 198 + baseTension * 50;

    const ang0 = Math.atan2(tipTargetY - baseY, tipTargetX - baseX);
    const totalLen = Math.hypot(tipTargetX - baseX, tipTargetY - baseY);

    // 5절 구성 — 버트 쪽이 길고 초릿대 쪽이 짧다. 끝 3개 절이 벤딩 구간.
    const SECTIONS = [0.26, 0.22, 0.19, 0.17, 0.16];
    const BEND_SHARE = [0, 0, 0.22, 0.33, 0.45];
    // 벤딩 방향 = 물 쪽: 우측 로드(위-좌 진행)는 각도 감소(좌하단),
    // 좌측 로드(위-우 진행)는 각도 증가(우하단)
    const bendSign = right ? -1 : 1;
    const totalBendRad = ((bendDeg + baseTension * 22) * Math.PI) / 180;

    const SUB = 4;
    let px = baseX, py = baseY;
    let ang = ang0;
    const joints: { x: number; y: number; ang: number }[] = [];

    for (let sec = 0; sec < 5; sec++) {
      const secLen = totalLen * SECTIONS[sec];
      const secBend = totalBendRad * BEND_SHARE[sec] * bendSign;
      for (let k = 0; k < SUB; k++) {
        ang += secBend / SUB;
        const nx = px + Math.cos(ang) * (secLen / SUB);
        const ny = py + Math.sin(ang) * (secLen / SUB);
        const t = sec + k / SUB;                    // 0~5 진행도
        const width = Math.max(1.4, 7 - t * 1.1);   // 버트 7px → 초릿대 1.5px
        // 색: 1절 전반 = 그립(진갈색) → 블랭크(짙은 검정) → 5절 = 밝은 초릿대
        const color = sec === 0 && k < 2 ? 0x27170d : sec < 4 ? 0x16161a : 0xd8d4c8;
        g.lineStyle(width, color, 1);
        g.lineBetween(px, py, nx, ny);
        px = nx; py = ny;
      }
      joints.push({ x: px, y: py, ang });
    }

    // ── 가이드 링 (절 경계 4곳 — 물 쪽 법선 방향으로 발+링) ──
    for (let i = 0; i < joints.length - 1; i++) {
      const j = joints[i];
      const n = j.ang + bendSign * (Math.PI / 2);
      const footLen = 6 - i;
      const gx = j.x + Math.cos(n) * footLen;
      const gy = j.y + Math.sin(n) * footLen;
      g.lineStyle(1.2, 0x8898a8, 0.95);
      g.lineBetween(j.x, j.y, gx, gy);
      const ringR = 3.4 - i * 0.5;
      g.strokeCircle(gx + Math.cos(n) * ringR, gy + Math.sin(n) * ringR, ringR);
    }

    // 초릿대 끝 표식 (형광 팁 — 입질 강도별 색)
    g.fillStyle(bendDeg > 40 ? 0xff5a4a : bendDeg > 15 ? 0xffce54 : 0xff8a3d, 1);
    g.fillCircle(px, py, 3);

    // ── 스피닝릴 (버트에서 로드 길이 13% 지점, 가이드와 같은 면에 장착) ──
    const reelDist = totalLen * 0.13;
    const rx = baseX + Math.cos(ang0) * reelDist;
    const ry = baseY + Math.sin(ang0) * reelDist;
    const n0 = ang0 + bendSign * (Math.PI / 2);
    const rcx = rx + Math.cos(n0) * 14;
    const rcy = ry + Math.sin(n0) * 14;
    // 스템 + 바디(기어박스)
    g.lineStyle(3.5, 0x23232a, 1);
    g.lineBetween(rx, ry, rcx, rcy);
    g.fillStyle(0x2a2a32, 1);
    g.fillCircle(rcx, rcy, 10);
    g.lineStyle(1.2, 0x4a4a55, 1);
    g.strokeCircle(rcx, rcy, 10);
    // 스풀 (로드 축 앞쪽 — 감긴 라인 표현) + 베일 암
    const spx = rcx + Math.cos(ang0) * 11;
    const spy = rcy + Math.sin(ang0) * 11;
    g.fillStyle(0x9aa4b0, 1);
    g.fillCircle(spx, spy, 6.5);
    g.fillStyle(0xe8e4da, 1);
    g.fillCircle(spx, spy, 4);
    g.lineStyle(1.5, 0xb8c2cc, 1);
    g.beginPath();
    g.arc(spx, spy, 8.5, ang0 - 1.15, ang0 + 1.15);
    g.strokePath();
    // 핸들 — **로드 기준** 좌/우 (버트→팁 진행 방향에서 본 좌/우, 설정 연동)
    const handleN = ang0 + (this.reelHandleSide === 'left' ? -1 : 1) * (Math.PI / 2);
    const hx = rcx + Math.cos(handleN) * 15;
    const hy = rcy + Math.sin(handleN) * 15;
    g.lineStyle(2.5, 0x3a3a44, 1);
    g.lineBetween(rcx, rcy, hx, hy);
    g.fillStyle(0x8a8a96, 1);
    g.fillCircle(hx, hy, 3.8);

    // ── 원줄: 초릿대 끝 → 세트 top 앵커 (A-2 — 컨테이너 밖 동적 연결) ──
    // 세트가 딸려오면 원줄이 자연히 따라오고 길이·각도가 축소된다.
    // 굵기는 고정(scale 왜곡 없음 — TUNING.retrieve.mainLineWidth), 좌표만 매 프레임 갱신.
    g.lineStyle(TUNING.retrieve.mainLineWidth, 0xf2f8ff, 0.65);
    g.lineBetween(px, py, this.groupTopWorld.x, this.groupTopWorld.y);
  }

  /**
   * 밑밥 파슬 시뮬 (B-2) — 각 파슬 위치의 조류(TidalCurrentEngine)로 (x, d) 드리프트
   * + z 침강 + 확산. 같은 parcel 데이터를 정면/수평/수직 세 뷰가 동시에 소비한다.
   */
  private updateChumParcels(dt: number, hoursNow: number): void {
    if (this.chumParcels.length > 0) {
      for (const pc of this.chumParcels) {
        const inf = this.tidal.calc({ x: pc.x, y: pc.d, z: pc.z }, 0, hoursNow);
        stepChum(pc, dt, { x: inf.force.x, d: inf.force.y }, this.cfg.zMaxM);
      }
      this.chumParcels = this.chumParcels.filter((pc) => pc.ageSec < pc.ttlSec);
    }
  }

  /**
   * 밑밥 레이어 렌더 (B-1·B-4) — ① 파슬 구름 (정면 뷰: 침강+드리프트+확산)
   * ② 투척점 스냅 행 (중앙 1 + 좌우 6 — 커서 X 최근접 강조)
   * ③ 선택 투척점의 예측 드리프트 고스트 + 동조 피크 마커.
   */
  private renderChumLayer(): void {
    const g = this.chumG;
    g.clear();

    // ── 파슬 구름 (정면 뷰) ──
    this.chumParcels.forEach((pc, i) => {
      const sx = this.screenX(pc.x);
      if (sx < -60 || sx > GAME_WIDTH + 60) return;
      const sy = this.depthY(pc.z, this.surfaceYAt(pc.d));
      const fresh = 1 - Math.min(1, pc.ageSec / pc.ttlSec);
      const r = TUNING.chumThrow.cloudBaseR * 0.5 + pc.spreadM * 2.2;
      g.fillStyle(0x9a7b4f, 0.14 + fresh * 0.22);
      g.fillCircle(sx, sy, r);
      // 알갱이 점묘 (파슬 인덱스 시드 — 결정적 배치)
      g.fillStyle(0xc9a86a, 0.22 + fresh * 0.3);
      for (let k = 0; k < 6; k++) {
        const a = i * 2.4 + k * 1.05;
        g.fillCircle(sx + Math.cos(a) * r * 0.55, sy + Math.sin(a * 1.3) * r * 0.5, 1.4);
      }
    });

    // ── 투척점 행 + 예측 고스트 — 드리프트 상태 + 배합 밑밥 보유 시에만 ──
    this.chumPredPeak = -1;
    if (this.fpState !== 'drift' || this.guideHub) return;
    if (!InventoryStore.hasCooler() || CoolerStore.chumRemaining <= 0) return;

    const xs = this.chumSnapXs();
    const rowY = this.surfaceYAt(this.distM);
    // 커서 X 최근접 스냅 (높낮이 무시)
    const px = this.input.activePointer.x;
    let bi = this.chumThrowIdx;
    let bd = Number.POSITIVE_INFINITY;
    xs.forEach((x, i) => {
      const d = Math.abs(this.screenX(x) - px);
      if (d < bd) { bd = d; bi = i; }
    });
    this.chumThrowIdx = bi;

    xs.forEach((x, i) => {
      const sx = this.screenX(x);
      if (i === bi) {
        g.lineStyle(1.6, 0xffe28a, 0.95);
        g.strokeCircle(sx, rowY, 7);
        g.fillStyle(0xff5a3c, 1);
        g.fillCircle(sx, rowY, 3.4);
      } else {
        g.fillStyle(0xff5a3c, 0.7);
        g.fillCircle(sx, rowY, 2.6);
      }
    });

    // ── 예측 드리프트 고스트 (조준) — 침강+조류 궤적 점선 + 동조 피크 마커 ──
    if (!TUNING.chumThrow.predictGhost) { this.chumPredPeak = -1; return; }
    const hoursNow = new Date().getHours() + new Date().getMinutes() / 60;
    const inf = this.tidal.calc({ x: xs[bi], y: this.distM, z: Math.min(2, this.rig.baitZ) }, 0, hoursNow);
    const pred = predictChumPath(
      xs[bi], this.distM, { x: inf.force.x, d: inf.force.y },
      { x: this.rig.baitX, d: this.distM, z: this.rig.baitZ },
      this.cfg.zMaxM,
      CoolerStore.chumTypeKey(),   // 현재 배합의 밑밥 종류 (침강/확산/조류 친화)
    );
    this.chumPredPeak = pred.peakSync;
    g.lineStyle(1, 0xffe28a, 0.5);
    for (let k = 0; k + 1 < pred.path.length; k += 2) {   // 2스텝 중 1 = 점선
      const a = pred.path[k], b = pred.path[k + 1];
      g.lineBetween(
        this.screenX(a.x), this.depthY(a.z, this.surfaceYAt(a.d)),
        this.screenX(b.x), this.depthY(b.z, this.surfaceYAt(b.d)),
      );
    }
    // 동조 피크 별 마커 (밑밥=미끼 교차 지점)
    const pk = pred.path[pred.peakIndex];
    const pkx = this.screenX(pk.x);
    const pky = this.depthY(pk.z, this.surfaceYAt(pk.d));
    g.lineStyle(1.6, 0x7fe6b0, 0.95);
    g.lineBetween(pkx - 6, pky, pkx + 6, pky);
    g.lineBetween(pkx, pky - 6, pkx, pky + 6);
    g.lineBetween(pkx - 4, pky - 4, pkx + 4, pky + 4);
    g.lineBetween(pkx - 4, pky + 4, pkx + 4, pky - 4);
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
  /**
   * 1인칭 종료 — 쿨러 어획은 **자동으로 인벤토리로 이송하지 않는다**.
   * 쿨러 팝업(B/보관함 클릭) 우클릭 '인벤토리로 넣기'로 직접 옮겨야 하며,
   * 쿨러의 매질(해수/얼음) 규칙에 따라 신선도가 진행된다.
   */
  private exitToField(): void {
    this.cameras.main.fadeOut(240, 2, 12, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('RegionFieldScene');
    });
  }
}
