/**
 * @file GameState.ts
 * @description 전역 게임 상태 관리 (Activity 확장 포함)
 *
 * Phaser와 독립적인 순수 TypeScript 상태 관리.
 * 씬 간 데이터 공유 및 세이브/로드의 중심입니다.
 *
 * 포함 상태:
 * - 플레이어 기본 정보 (PlayerState)
 * - 배치된 통발 목록 (DeployedTrap[])
 * - 쿨러 인벤토리 (CoolerInventory)
 * - 보유 라이선스 (HeldLicense[])
 * - 식당 상태 (RestaurantState | null)
 * - 선상콘도 상태 (FloatingCondoState | null)
 */

import type {
  PlayerState,
  TackleSetup,
  DeployedTrap,
  CoolerInventory,
  CoolerSlotItem,
  HeldLicense,
  LicenseType,
  RestaurantState,
  FloatingCondoState,
  ShoreHarvestItem,
  TrapCatchItem,
  CaughtFishRecord,
} from '@tra/core';
import type { WorldObjectState, CatchMethod, StorySpotKind } from '@tra/core';
import { type CharConfig, type CharSex, defaultAppearance, starterOutfit } from '@tra/core';
import { StoryStore, type StorySaveState } from './StoryStore.js';
import { buildItemWikiCatalog } from '../data/WikiCatalog.js';
import {
  skillPointsForLevel, skillPointsSpent, skillPrereqsMet, getSkillById, SKILL_CATEGORIES,
  skillPointsFromLicenses as coreSkillPointsFromLicenses, skillUnlockMissing,
  newlyUnlockedHiddenSkills, describeUnlockCond as coreDescribeUnlockCond,
  type SkillDef, type SkillUnlockCtx,
  skillMult as coreSkillMult, skillBonus as coreSkillBonus, type SkillRanks, type SkillEffectKey,
  profGain as coreProfGain, profLevel, PROF_LEVEL_XP, getSkillById as coreGetSkillById, skillsOfCategory,
  type SkillProficiency, type ProfActionKey, type SkillCategoryId, type ProfGain,
  MAX_LEVEL, xpToNext, catchXp, activityXp, type XpActivity,
  getStoryQuest as coreGetStoryQuest,
} from '@tra/core';
import {
  tickVitals as coreTickVitals, applyVitalsAction as coreVitalsAction,
  applyIntake as coreApplyIntake, applySleep as coreApplySleep,
  vitalsSpeedMult as coreVitalsSpeed, isVitalsLow as coreVitalsLow,
  aggregateStatus, tickStatuses as coreTickStatuses, addStatus as coreAddStatus,
  cureStatus as coreCureStatus,
  BASE_HUNGER_MAX, BASE_HYDRATION_MAX,
  type VitalsState, type VitalsActivity, type VitalsAction, type VitalsEnv,
  getStatusEffect,
  type ActiveStatus, type StatusEffectId, type StatusModifiers, type StatusCure,
} from '@tra/core';
import {
  getLicenseByType, getCurrentGameMinute, calculateTideInfo, getFishById,
  createEmptyWorldObjectState, TUNING,
} from '@tra/core';
import { EnvironmentStore } from './EnvironmentStore.js';
import { CoolerStore, CoolerSaveState } from './CoolerStore.js';
import { InventoryStore, InventorySaveState } from './InventoryStore.js';
import { FridgeStore, FridgeSaveState } from './FridgeStore.js';
import { DiscoveryStore, DiscoverySaveState } from './DiscoveryStore.js';

// ─────────────────────────────────────────────
// 기본 쿨러 상태
// ─────────────────────────────────────────────
function createDefaultCoolerInventory(): CoolerInventory {
  return {
    coolerSpecId: 'cooler_basic_20l',
    items: [],
    icePackRemainingRatio: 1.0,
    totalWeightG: 0,
  };
}

// ─────────────────────────────────────────────
// 기본 플레이어 상태
// ─────────────────────────────────────────────
function createDefaultPlayer(): PlayerState {
  return {
    id: crypto.randomUUID(),
    nickname: '이름없는꾼',
    characterSkinId: 'default',
    position: { x: 100, y: 100, sceneKey: 'WorldMapScene' },
    facing: 'down',
    status: 'idle',
    currentTackle: null,
    inventory: {
      rodIds: ['rod_daiwaSS1500_1p5'],
      reelIds: ['reel_daiwa3000'],
      consumables: [
        {
          instanceId: 'default_krill_instance',
          itemId: 'tackle_krill_frozen',
          quantity: 30,
          conditionState: 'frozen',
          usePurpose: 'fishing_gear_only',
          sourceVendor: 'tackle_shop',
          acquiredAtGameMinute: 0,
          coolerStoredAtGameMinute: null,
          convertedToBaitAtGameMinute: null,
        },
        {
          instanceId: 'default_squid_instance',
          itemId: 'tackle_squid_chilled',
          quantity: 20,
          conditionState: 'fresh',
          usePurpose: 'fishing_gear_only',
          sourceVendor: 'tackle_shop',
          acquiredAtGameMinute: 0,
          coolerStoredAtGameMinute: null,
          convertedToBaitAtGameMinute: null,
        },
      ],
      livewell: [],
      coins: 50000,
    },
    caughtFishHistory: [],
    personalRecords: {},
    totalTrips: 0,
    totalPlayMinutes: 0,
    createdAt: new Date(),
    lastSavedAt: new Date(),
    stamina: 100,
    fatigue: 0,
    activeQuickslotIndex: 0,
    level: 1,
    experience: 0,
  };
}

// ─────────────────────────────────────────────
// 생활 스킬 (손질 등 — 성공 시 XP 누적 → 레벨업)
// ─────────────────────────────────────────────
/** 생활 스킬 상태 */
export interface SkillState {
  /** 회 손질(삼면뜨기/박피) — 레벨↑ 시 수율·슬라이스·등급 상향 */
  filleting: { level: number; xp: number };
}

function createDefaultSkills(): SkillState {
  return { filleting: { level: 0, xp: 0 } };
}

// ─────────────────────────────────────────────
// 생존 지표 저장 구조 (125차 — SPEC §4)
// ─────────────────────────────────────────────
/**
 * 허기·수분·상태이상만 저장한다 — HP(=`player.stamina`)·피로도(=`player.fatigue`)는
 * 기존 필드가 원본이라 중복 저장하지 않는다(승계 원칙). 구세이브는 만복(100/100)으로 시작.
 */
export interface VitalsSaveState {
  hunger: number;
  hydration: number;
  statuses: ActiveStatus[];
}

// ─────────────────────────────────────────────
// 저장 가능한 전체 게임 데이터 구조
// ─────────────────────────────────────────────
interface SaveData {
  player: PlayerState;
  deployedTraps: DeployedTrap[];
  coolerInventory: CoolerInventory;
  licenses: HeldLicense[];
  restaurant: RestaurantState | null;
  condo: FloatingCondoState | null;
  visitedSpotIds: string[];
  completedQuestIds: string[];
  skills?: SkillState;
  /** 스킬 트리 랭크 (122차) — 포인트는 레벨에서 파생하므로 랭크만 저장 */
  skillTree?: SkillRanks;
  /** 휴대 쿨러 상태 (어획/매질/밑밥) — 로드 시 실경과 시간만큼 신선도/매질 진행 */
  coolerBox?: CoolerSaveState;
  /** 인벤토리 상태 (아이템/퀵슬롯/채비/편대/루어 모드) — 신선도는 lazy refresh로 실경과 반영 */
  inventoryStore?: InventorySaveState;
  /** 집 냉장고 보관 (냉동고 8칸 + 냉장고 16칸) */
  fridge?: FridgeSaveState;
  /** 1회성 안내 플래그 (chumGuideSeen 등 — 최초 표시 여부) */
  flags?: Record<string, boolean>;
  /** 맵별 오브젝트 월드 상태 — 초기 배치 − removed + moved + placed (HOMETOWN_HOME_SPEC) */
  worldObjects?: Record<string, WorldObjectState>;
  /** 발견(도감/위키) 기록 — 어종·해양생물·아이템. 구세이브는 어획 기록에서 백필 */
  discoveries?: DiscoverySaveState;
  /** 생존 지표 — 허기·수분·상태이상 (125차). HP·피로도는 `player.stamina/fatigue`가 원본 */
  vitals?: VitalsSaveState;
  /** 스토리·퀘스트 진행 (134차) — 없으면 새 게임과 같이 M1-01만 활성 */
  story?: StorySaveState;
  /** 플레이어 외형·복장 (138차) — 없으면 기본 남성 + 스타터 한 벌 */
  character?: CharConfig;
  /** 숙련도 (140차) — skillId → 누적 XP. 없으면 0(배운 기술형 스킬은 다시 익혀야 한다) */
  skillProf?: SkillProficiency;
  /** 퀘스트 선택지로 받은 보너스 스킬 포인트 (140차) — 레벨·면허 파생분에 더한다 */
  bonusSkillPoints?: number;
  version: number;
}

const SAVE_VERSION = 1;
const SAVE_KEY = 'tra_save_v1';
/** 슬롯 저장 키 (1~3) */
const SLOT_KEY = (slot: number): string => `tra_save_slot_${slot}`;
export const SAVE_SLOT_COUNT = 3;

/** 저장 슬롯 메타 정보 (메인 메뉴 슬롯 UI 표시용) */
export interface SaveSlotMeta {
  exists: boolean;
  nickname?: string;
  level?: number;
  coins?: number;
  savedAt?: Date;
}

// ─────────────────────────────────────────────
// GameState 싱글톤 매니저
// ─────────────────────────────────────────────
export class GameStateManager {
  private _player: PlayerState | null = null;
  private _deployedTraps: DeployedTrap[] = [];
  private _coolerInventory: CoolerInventory = createDefaultCoolerInventory();
  private _licenses: HeldLicense[] = [];
  private _restaurant: RestaurantState | null = null;
  private _condo: FloatingCondoState | null = null;
  private _visitedSpotIds: Set<string> = new Set();
  private _completedQuestIds: Set<string> = new Set();
  private _skills: SkillState = createDefaultSkills();
  private _skillRanks: SkillRanks = {};
  /** 숙련도 (140차) — 기술형 스킬은 배운 뒤 행위로 채워야 효과가 난다 */
  private _skillProf: SkillProficiency = {};
  /** 선택지 보상 스킬 포인트 (140차) */
  private _bonusSkillPoints = 0;
  /** 최근 숙련도 레벨업 — UI가 한 번만 꺼내 안내 */
  private _recentProfUps: ProfGain[] = [];
  /** 자전거 숙련 적립용 누적 주행 시간(ms) */
  private _rideAccMs = 0;
  /** 생존 지표 — 허기·수분 (HP/피로도는 player.stamina/fatigue가 원본, 125차) */
  private _hunger = 100;
  private _hydration = 100;
  /** 활성 상태이상 (125차) */
  private _statuses: ActiveStatus[] = [];
  /** 카페인 리바운드 대기열 — 활동 시간으로만 줄어든다(129차 P7) */
  private _rebounds: { leftMs: number; fatigue: number }[] = [];
  /**
   * 보양식 드레인 감소 버프 (129차 P7) — 남은 **활동 시간**(ms)과 배율.
   * `tickVitals`의 `extraMult` 3요소 전부에 곱해 허기·수분·피로가 천천히 닳게 한다.
   * 리바운드와 같은 이유로 **활동 시간**으로 잰다(오프라인 중 소진되지 않는다).
   */
  private _drainBuff: { leftMs: number; mult: number } | null = null;
  /** 아직 안내하지 않은 히든 시너지 해금 (130차 (e)) — UI가 `takeRecentHiddenUnlocks`로 꺼낸다 */
  private _recentHidden: SkillDef[] = [];
  /** 1회성 안내 플래그 (세이브 대상) — 예: chumGuideSeen */
  private _flags: Record<string, boolean> = {};
  /** 맵별 오브젝트 월드 상태 (세이브 대상) — key = mapId */
  private _worldObjects: Record<string, WorldObjectState> = {};
  private _currentSpotId: string | null = null;
  private _isInitialized = false;
  /** 현재 진행 중인 저장 슬롯 (1~3, 미지정 시 null) */
  private _activeSlot: number | null = null;
  /** 자전거 탑승 여부 — 필드 씬(Field/RegionField) 간 유지되는 세션 상태 (저장 비대상) */
  isMounted = false;
  /** 현재 지역 id (WorldMap RegionDef.id) — 필드 씬이 갱신, 퀘스트 어획 이벤트의 regionId (저장 비대상) */
  currentRegionId = 'gangwon_sokcho';
  /**
   * 현재 위치 태그 (세션 — 씬 진입 시 설정).
   * 'menu' | 'hometown' | 'hometown_interior' | 'region_field' | 'fishing' …
   * 저장은 TUNING.save.allowedTags 위치에서만 허용 (집 침대 = hometown_interior).
   */
  locationTag = 'menu';
  /** 마지막 디스크 저장 이후 진행 여부 (세션) — 침대 저장 시 해제 */
  private _dirty = false;

  readonly environment = EnvironmentStore;

  // ─── 초기화 ───────────────────────────────

  initialize(): void {
    if (this._isInitialized) return;

    const saved = this.load();
    if (saved) {
      this.applySaveData(saved);
    } else {
      this._player = createDefaultPlayer();
      // 기본 면허 부여 (기본 낚시 면허)
      this._licenses = [{
        type: 'basic_angling',
        acquiredAt: new Date(),
        isExpired: false,
      }];
    }

    // 시드 인벤 발견 동기 — 첫 부팅(세이브 없음)은 applySaveData를 거치지 않으므로 여기서 보장 (멱등)
    this.syncInventoryDiscoveries();

    this._isInitialized = true;
    console.log('[GameState] Initialized. Player:', this._player?.nickname);
  }

  /** 파싱된 세이브 데이터를 현재 상태에 적용 */
  private applySaveData(saved: SaveData): void {
    this._player = saved.player;
    this._deployedTraps = saved.deployedTraps ?? [];
    this._coolerInventory = saved.coolerInventory ?? createDefaultCoolerInventory();
    this._licenses = saved.licenses ?? [];
    this._restaurant = saved.restaurant ?? null;
    this._condo = saved.condo ?? null;
    this._visitedSpotIds = new Set(saved.visitedSpotIds ?? []);
    this._completedQuestIds = new Set(saved.completedQuestIds ?? []);
    this._skills = saved.skills ?? createDefaultSkills();
    this._skillRanks = saved.skillTree ?? {};
    this._skillProf = saved.skillProf ?? {};
    this._bonusSkillPoints = saved.bonusSkillPoints ?? 0;
    this._flags = saved.flags ?? {};
    this._worldObjects = saved.worldObjects ?? {};
    // 쿨러 복원 — 저장~로드 사이 실경과 시간을 sync로 반영 (어획 신선도/매질 만료, 밑밥은 그대로)
    CoolerStore.deserialize(saved.coolerBox);
    // 인벤토리 복원 — 구버전 세이브(필드 없음)는 시드로 리셋
    InventoryStore.deserialize(saved.inventoryStore);
    // 집 냉장고 복원 (냉동고/냉장고 보관물)
    FridgeStore.deserialize(saved.fridge);
    // 발견 기록 복원 — 구세이브(필드 없음)는 어획 기록의 어종을 'legacy'로 백필
    DiscoveryStore.deserialize(
      saved.discoveries,
      (saved.player?.caughtFishHistory ?? []).map((r) => r.fishSpeciesId),
    );
    // 생존 지표 — 구세이브(필드 없음)는 만복 시작. 오프라인 경과는 반영하지 않는다(활동 시간만 진행).
    this._hunger = saved.vitals?.hunger ?? 100;
    this._hydration = saved.vitals?.hydration ?? 100;
    this._statuses = saved.vitals?.statuses ?? [];
    // 134차 — 스토리 진행 (구세이브 = M1-01만 활성)
    StoryStore.deserialize(saved.story);
    // 138차 — 구세이브는 외형 필드가 없다(기본 남성 + 스타터 한 벌로 시작)
    this._character = saved.character ?? GameStateManager.defaultCharacter('m');
    // 130차 (e) — 구세이브가 이미 조합을 갖췄을 수 있다(히든 노드는 세이브에 없던 시절 데이터).
    //   포인트를 쓰지 않으므로 소급 지급해도 예산이 어긋나지 않는다.
    this.refreshHiddenSkills();
    this.syncInventoryDiscoveries();
  }

  /**
   * 인벤토리 보유 아이템을 위키 발견 처리 (로드/뉴게임 직후 — 갖고 있으면 본 것).
   * onNew 훅을 잠시 꺼서 일괄 동기 시 토스트가 쏟아지지 않게 한다.
   */
  private syncInventoryDiscoveries(): void {
    const hook = DiscoveryStore.onNew;
    DiscoveryStore.onNew = null;
    for (const it of InventoryStore.items) {
      DiscoveryStore.record('item', it.id, 'inventory');
    }
    DiscoveryStore.onNew = hook;
  }

  // ─── Getter ───────────────────────────────

  get player(): PlayerState {
    if (!this._player) throw new Error('GameState not initialized. Call GameState.initialize() first.');
    return this._player;
  }

  get currentSpotId(): string | null {
    return this._currentSpotId;
  }

  get deployedTraps(): DeployedTrap[] {
    return this._deployedTraps;
  }

  get coolerInventory(): CoolerInventory {
    return this._coolerInventory;
  }

  get licenses(): HeldLicense[] {
    return this._licenses;
  }

  get restaurant(): RestaurantState | null {
    return this._restaurant;
  }

  get condo(): FloatingCondoState | null {
    return this._condo;
  }

  get visitedSpotIds(): string[] {
    return Array.from(this._visitedSpotIds);
  }

  get completedQuestIds(): string[] {
    return Array.from(this._completedQuestIds);
  }

  /** 생활 스킬 상태 */
  get skills(): SkillState {
    return this._skills;
  }

  /**
   * 손질 스킬 XP 지급 → 레벨업 판정.
   * 레벨업 임계 = (level + 1) × 100 XP. 레벨 상한 20.
   */
  addFilletingXp(xp: number): { leveledUp: boolean; level: number } {
    const s = this._skills.filleting;
    if (s.level >= 20) return { leveledUp: false, level: s.level };
    s.xp += Math.max(0, Math.round(xp));
    let leveledUp = false;
    let threshold = (s.level + 1) * 100;
    while (s.level < 20 && s.xp >= threshold) {
      s.xp -= threshold;
      s.level += 1;
      leveledUp = true;
      threshold = (s.level + 1) * 100;
    }
    if (s.level >= 20) s.xp = 0;
    return { leveledUp, level: s.level };
  }

  // ─── 플레이어 조작 ─────────────────────────

  /** 플레이어 상태 부분 업데이트 */
  updatePlayer(partial: Partial<PlayerState>): void {
    if (!this._player) return;
    this._player = { ...this._player, ...partial };
  }

  /** 현재 낚시터 설정 */
  setCurrentSpot(spotId: string): void {
    this._currentSpotId = spotId;
    this._visitedSpotIds.add(spotId);
  }

  /** 현재 채비 설정 */
  equipTackle(tackle: TackleSetup | null): void {
    this.updatePlayer({ currentTackle: tackle });
  }

  /**
   * 코인 추가/차감.
   * `quiet` = 스토리 이벤트를 쏘지 않는다 (146차 — **거래로 받은 재화는 `earn` 목표에 안 센다**.
   * 인벤토리를 읽는 목표가 없는 이 게임에서 유저 간 거래가 새는 유일한 구멍이 이 이벤트였다).
   */
  addCoins(amount: number, quiet = false): boolean {
    if (!this._player) return false;
    const newCoins = this._player.inventory.coins + amount;
    if (newCoins < 0) return false;
    this._player.inventory.coins = newCoins;
    if (!quiet) StoryStore.event({ kind: 'coins', coins: newCoins });   // 134차 — earn 목표
    return true;
  }

  /** 물고기 포획 성공 시 살림망에 추가 및 개인 최고기록 갱신 */
  addCaughtFish(speciesId: string, _nameKo: string, lengthCm: number, weightGram: number, method: CatchMethod = 'rod', spotKind?: StorySpotKind): void {
    if (!this._player) return;
    const spotId = this._currentSpotId || 'geoje_gujora_breakwater';
    const tide = calculateTideInfo();
    const env = EnvironmentStore.environment;
    const waterTempC = env ? env.weather.seaSurfaceTempC : 20.0;
    
    // 현재 장착된 채비 스냅샷 (없으면 더미 생성)
    const tackleSnapshot = this.player.currentTackle || {
      rod: { id: 'rod_daiwaSS1500_1p5', name: '다이와 SS 1.5호 대', type: 'iso', lengthM: 5.3, maxLineWeightLbs: 12, maxLureWeightG: 20 },
      reel: { id: 'reel_daiwa3000', name: '다이와 3000번 스피닝릴', type: 'spinning', gearRatio: 5.3, maxDragKg: 6, lineCapacityM: 150 },
      mainLine: { id: 'line_nylon_2', name: '나일론 원줄 2호', material: 'nylon', diameterMm: 0.235, testLbs: 8, lengthM: 150 },
      rigType: 'iso_semi_float',
      hook: { id: 'hook_chinu_3', name: '감성돔 바늘 3호', size: 3, targetFishWeightMaxG: 5000 },
      bait: { id: 'bait_sandworm_fresh', name: '청갯지렁이', category: 'sandworm', baseEffectiveness: 1.0, isConsumable: true, canBeForaged: true },
    };

    const isBest = !this.player.personalRecords[speciesId] || lengthCm > this.player.personalRecords[speciesId];
    if (isBest) {
      this.player.personalRecords[speciesId] = lengthCm;
    }

    // 도감 발견 기록 (최초 1회 — 이미 발견된 어종은 무시. true = 첫 포획 → XP ×firstDiscoveryMult)
    const firstDiscovery = DiscoveryStore.record('fish', speciesId, 'catch');

    const record: CaughtFishRecord = {
      id: crypto.randomUUID(),
      fishSpeciesId: speciesId,
      lengthCm,
      weightGram,
      caughtAt: new Date(),
      locationId: spotId,
      tackleUsed: JSON.parse(JSON.stringify(tackleSnapshot)) as TackleSetup,
      tidePhase: tide.tidePhase,
      waterTempC,
      isBestRecord: isBest,
      baitUsed: tackleSnapshot.bait.name,
    };

    this.player.inventory.livewell.push(record);
    this.player.caughtFishHistory.push(record);

    // 경험치 획득 — 어획 XP = 희귀도 기본 × 체장계수 (core catchXp — 124차 스펙 §1-3).
    // 첫 포획(도감 신규)은 ×firstDiscoveryMult.
    const fish = getFishById(speciesId);
    const avgCm = fish ? (fish.avgSizeRangeCm[0] + fish.avgSizeRangeCm[1]) / 2 : undefined;
    let gained = catchXp(fish?.rarity ?? 'common', lengthCm, avgCm);
    if (firstDiscovery) gained = Math.round(gained * TUNING.xp.firstDiscoveryMult);
    this.grantXp(gained);
    this.addProficiency('landing');   // 140차 — 챔질·파이팅 숙련
    this.addProficiency('fight');
    // 134차 — 퀘스트·조행록 어획 이벤트 (자가어획)
    StoryStore.event({ kind: 'catch', speciesId, lengthCm, method, selfCaught: true, regionId: this.currentRegionId, month: new Date().getMonth() + 1, spotKind });
  }

  // ─── 플레이어 레벨 XP (124차 — core Progression 곡선 · MAX_LEVEL 200 캡) ───

  /**
   * 레벨 XP 지급 + 레벨업 처리. `experience`는 레벨 내 잔여값(현행 저장 구조 유지),
   * 임계 = `xpToNext(level)` (구 `level × 100` 폐기 — 구세이브 잔여 XP는 새 임계와 그대로 비교).
   * 반환 = 이번 지급으로 오른 레벨 수.
   */
  grantXp(amount: number): number {
    const add = Math.max(0, Math.round(amount));
    if (add <= 0) return 0;
    const p = this.player;
    // 138차 — 만렙(200)에서도 XP는 계속 쌓인다. 퀘스트가 계속 늘어나는데 만렙에서 보상이
    // 통째로 증발하면 후반 퀘스트가 무보상이 된다. 레벨만 200에서 멈추고 경험치는 누적한다.
    p.experience = (p.experience ?? 0) + add;
    if ((p.level ?? 1) >= MAX_LEVEL) return 0;
    let ups = 0;
    while ((p.level ?? 1) < MAX_LEVEL && p.experience >= xpToNext(p.level ?? 1)) {
      p.experience -= xpToNext(p.level ?? 1);
      p.level = (p.level ?? 1) + 1;
      ups++;
    }
    if (ups > 0) {
      console.log(`[GameState] Level Up! Lv.${(p.level ?? 1) - ups} -> Lv.${p.level} (스킬 포인트 +${ups})`);
      this.commitVitals(this.vitals);   // maxHp가 레벨에 비례하므로 상한 재계산
      this.refreshHiddenSkills();       // 130차 (d) — 레벨 조건 히든이 열릴 수 있다
      StoryStore.event({ kind: 'level', level: p.level ?? 1 });   // 134차 — reachLevel 목표·자동 시작 퀘
      this.markDirty();
    }
    return ups;
  }

  /** 만렙 여부 — HUD·일지는 이 값으로 '누적' 표기로 전환한다 */
  get isMaxLevel(): boolean { return (this.player.level ?? 1) >= MAX_LEVEL; }

  /**
   * 경험치 바 표시값. 만렙이면 `max`가 없고 `cur`는 **만렙 도달 후 누적 XP**다
   * (레벨 내 잔여가 아니다 — 만렙에선 차감이 일어나지 않는다).
   */
  xpDisplay(): { cur: number; max: number | null; maxed: boolean } {
    const p = this.player;
    const lv = p.level ?? 1;
    const cur = p.experience ?? 0;
    if (lv >= MAX_LEVEL) return { cur, max: null, maxed: true };
    return { cur, max: xpToNext(lv), maxed: false };
  }

  /** 활동 XP — 손질/회뜨기/채집/제작/요리 완료 시 호출 (mult = 등급·품질 계수). 반환 = 레벨업 수 */
  addActivityXp(kind: XpActivity, mult = 1): number {
    StoryStore.event({ kind: 'activity', activity: kind });
    // 140차 — 같은 행위가 숙련도도 채운다(손질·회뜨기·채집·제작·요리)
    const profOf: Partial<Record<XpActivity, ProfActionKey>> = { butcher: 'butcher', sashimi: 'sashimi', forage: 'forage', craft: 'craft', cook: 'cook' };
    const pa = profOf[kind];
    if (pa) this.addProficiency(pa);
    return this.grantXp(activityXp(kind, mult));
  }

  /** 준법 방생 XP — 금지체장·금어기 개체 자동 방생 보상 (어획 XP × lawfulReleaseMult) */
  addLawfulReleaseXp(speciesId: string, lengthCm: number): number {
    const fish = getFishById(speciesId);
    const avgCm = fish ? (fish.avgSizeRangeCm[0] + fish.avgSizeRangeCm[1]) / 2 : undefined;
    StoryStore.event({ kind: 'release', speciesId, lengthCm });
    return this.grantXp(catchXp(fish?.rarity ?? 'common', lengthCm, avgCm) * TUNING.xp.lawfulReleaseMult);
  }

  // ─── 생존 지표 · 상태이상 (125차 — SPEC §4·§5) ───

  /** 활성 상태이상 합산 효과 (최대치·소모 배율·이동 배율) */
  get statusModifiers(): StatusModifiers {
    return aggregateStatus(this._statuses);
  }

  /** 최대 체력 — `100 + floor(level×0.5) + stamina_max 보너스` − 상태이상 감소 (SPEC §1-4) */
  get maxHp(): number {
    const m = this.statusModifiers;
    const base = 100 + Math.floor((this.player.level ?? 1) * 0.5) + this.skillBonus('stamina_max');
    return Math.max(10, Math.round(base * (1 - m.maxHpPct) - m.maxHpDelta));
  }

  /** 최대 피로도 — 상태이상(감기·골절 등)이 상한을 깎고, '강단'(130차)이 올린다 */
  get maxFatigue(): number {
    return Math.max(20, 100 + this.skillBonus('fatigue_max') - this.statusModifiers.maxFatigueDelta);
  }

  /** 최대 허기 — 기본 100 + '대식가'(130차 (a)) */
  get maxHunger(): number {
    return Math.max(10, BASE_HUNGER_MAX + this.skillBonus('hunger_max'));
  }

  /** 최대 수분 — 기본 100 + '큰 물통' */
  get maxHydration(): number {
    return Math.max(10, BASE_HYDRATION_MAX + this.skillBonus('thirst_max'));
  }

  /** 생존 지표 스냅샷 (HP·피로도는 player에서, 허기·수분은 자체 필드에서) */
  get vitals(): VitalsState {
    const p = this.player;
    return {
      hp: p.stamina, maxHp: this.maxHp,
      fatigue: p.fatigue, maxFatigue: this.maxFatigue,
      hunger: this._hunger, maxHunger: this.maxHunger,
      hydration: this._hydration, maxHydration: this.maxHydration,
    };
  }

  /** 허기 또는 수분이 임계(20%) 미만인가 — 감속·피로 가중 표기용 */
  get isVitalsLow(): boolean {
    return coreVitalsLow(this.vitals);
  }

  /** 이동 속도 배율 — 생존 임계(−20%) × 상태이상(골절 등) */
  get moveSpeedMult(): number {
    return coreVitalsSpeed(this.vitals) * this.statusModifiers.moveMult;
  }

  /** 자전거 탑승 가능 여부 — 골절 시 불가 */
  get canRideBike(): boolean {
    return !this.statusModifiers.noBike;
  }

  private commitVitals(v: VitalsState): void {
    const p = this.player;
    p.stamina = Math.max(0, Math.min(v.hp, v.maxHp));
    p.fatigue = Math.max(0, Math.min(v.fatigue, v.maxFatigue));
    // 상한은 **스킬에서 파생**하므로 v가 들고 온 값이 아니라 현재 계산값으로 다시 클램프한다
    // (리스펙으로 '대식가'를 물리면 그릇이 줄어드는데, v의 옛 상한을 믿으면 넘친 채로 남는다).
    this._hunger = Math.max(0, Math.min(this.maxHunger, v.hunger));
    this._hydration = Math.max(0, Math.min(this.maxHydration, v.hydration));
  }

  /**
   * 활동 시간 드레인 + 상태이상 진행. **활동 시간만** 넘길 것
   * (오프라인·일시정지·모달 중에는 호출하지 않는다 — 그것이 오프라인 정지 규약).
   */
  tickVitals(dtMs: number, activity: VitalsActivity = 'idle', env: VitalsEnv = {}): {
    hpLost: number; starving: boolean; fainted: boolean; dead: boolean;
    added: StatusEffectId[]; removed: StatusEffectId[];
  } {
    const v = this.vitals;
    const mods = this.statusModifiers;
    // 127차 P5 — 상태이상 발생·진행 롤에 면역력(life_immune) 반영
    const st = coreTickStatuses(this._statuses, dtMs, { chanceMult: this.skillMult('immunity') });
    // 상태이상 지속 피해 + 설사 등 추가 수분 소모
    if (st.hpLoss > 0) v.hp = Math.max(0, v.hp - st.hpLoss);
    if (mods.hydrationPerHour > 0) {
      v.hydration = Math.max(0, v.hydration - mods.hydrationPerHour * (dtMs / 3_600_000));
    }
    // 소모 배율 = 상태이상 × 스킬(소식가·수분 관리·회복력). 피로는 **음수 드레인(앉기)일 때 회복 배율**이라
    // 부호에 따라 다른 키를 쓴다 — 회복력은 회복을 키우고, 그 외 구간은 상태이상만 곱한다.
    const restoring = activity === 'sit';
    const sk: [number, number, number] = [
      this.skillMult('hunger_drain'),
      this.skillMult('thirst_drain'),
      restoring ? this.skillMult('fatigue_recovery') : 1,
    ];
    // 카페인 리바운드 — 활동 시간 경과분만 차감하고, 만료분은 피로로 되돌린다
    let reboundFatigue = 0;
    if (this._rebounds.length > 0) {
      for (const rb of this._rebounds) rb.leftMs -= dtMs;
      const due = this._rebounds.filter((rb) => rb.leftMs <= 0);
      if (due.length > 0) {
        reboundFatigue = due.reduce((a, rb) => a + rb.fatigue, 0);
        this._rebounds = this._rebounds.filter((rb) => rb.leftMs > 0);
        v.fatigue = Math.min(v.maxFatigue, v.fatigue + reboundFatigue);
      }
    }
    // 보양식 버프 — 남은 활동 시간만 차감(만료 시 해제). 드레인 3요소 전부에 곱한다.
    let buff = 1;
    if (this._drainBuff) {
      buff = this._drainBuff.mult;
      this._drainBuff.leftMs -= dtMs;
      if (this._drainBuff.leftMs <= 0) this._drainBuff = null;
    }
    const r = coreTickVitals(v, dtMs, activity, {
      ...env,
      coldResistRank: env.coldResistRank ?? this.skillRank('life_cold'),
      extraMult: [
        mods.drainMult[0] * sk[0] * buff,
        mods.drainMult[1] * sk[1] * buff,
        mods.drainMult[2] * sk[2] * buff,
      ],
    });
    this.commitVitals(v);
    if (r.hpLost > 0 || st.hpLoss > 0 || st.added.length > 0 || st.removed.length > 0) this.markDirty();
    return {
      hpLost: r.hpLost + st.hpLoss, starving: r.starving,
      fainted: r.fainted, dead: this.player.stamina <= 0,
      added: st.added, removed: st.removed,
    };
  }

  /**
   * 1회성 행동 비용 (캐스팅·파이팅·손질·출조 등).
   *
   * 130차 (c): '요령'(`action_free`) 랭크만큼 **비용이 통째로 면제될 확률**이 있다.
   * 비용을 깎는 게 아니라 **가끔 아예 안 드는** 형태라, 같은 기대값이어도 체감이 다르다
   * (재료 절약(`materialSaveChance`)과 같은 모델 — 소수점 소모를 만들지 않는다).
   * 반환 = 이번 호출이 면제됐는가(호출측이 토스트를 띄울 수 있다).
   */
  applyVitalsAction(action: VitalsAction, mult = 1, rng: () => number = Math.random): boolean {
    const free = this.skillBonus('action_free');
    if (free > 0 && rng() < Math.min(0.6, free)) return true;
    const v = this.vitals;
    coreVitalsAction(v, action, mult);
    this.commitVitals(v);
    this.markDirty();
    return false;
  }

  /**
   * 품삯 노동 비용 (135차) — 허기·수분 감소 / 피로 증가를 **임의 벡터**로 적용한다.
   * `VitalsAction`은 고정 enum이라 일감마다 다른 비용을 담을 수 없어 별도 경로로 둔다.
   * '요령'(action_free) 면제는 **적용하지 않는다** — 일은 대가를 치러야 품삯의 의미가 산다.
   */
  spendLabor(hunger: number, hydration: number, fatigue: number): void {
    const v = this.vitals;
    v.hunger = Math.max(0, Math.min(v.maxHunger, v.hunger - hunger));
    v.hydration = Math.max(0, Math.min(v.maxHydration, v.hydration - hydration));
    v.fatigue = Math.max(0, Math.min(v.maxFatigue, v.fatigue + fatigue));
    this.commitVitals(v);
    this.markDirty();
  }

  /**
   * 섭취 회복 — 음수 허용(술 = 수분 −). 상한 클램프는 core가 처리.
   * `fatigue` 양수 = 피로 감소(129차 P7 — 보양식·카페인).
   */
  applyIntake(hunger = 0, hydration = 0, hp = 0, fatigue = 0): void {
    const v = this.vitals;
    coreApplyIntake(v, hunger, hydration, hp, fatigue);
    this.commitVitals(v);
    this.markDirty();
  }

  /**
   * 카페인 리바운드 예약 (129차 P7) — `delayMs` **활동 시간** 뒤에 피로가 `fatigue`만큼 되돌아온다.
   * 실시각이 아니라 활동 시간으로 재는 이유: 오프라인·일시정지 중에는 지표가 멈추는 규약(§4-1)을
   * 리바운드만 예외로 두면 "접속을 끊어 부채를 피하는" 우회가 생긴다.
   */
  scheduleFatigueRebound(fatigue: number, delayMs: number): void {
    if (!(fatigue > 0) || !(delayMs > 0)) return;
    this._rebounds.push({ leftMs: delayMs, fatigue });
    this.markDirty();
  }

  /** 대기 중인 리바운드 수 (검증·UI용) */
  get pendingReboundCount(): number {
    return this._rebounds.length;
  }

  /**
   * 보양식 드레인 감소 버프 (129차 P7) — `mult`(0.75 = −25%)를 `durMs` **활동 시간** 동안 적용.
   * 이미 버프가 있으면 **더 센 쪽을 남기고 지속시간은 긴 쪽**으로 — 중첩 곱으로 0에 수렴하는 것을 막는다.
   */
  applyDrainBuff(mult: number, durMs: number): void {
    if (!(mult > 0) || mult >= 1 || !(durMs > 0)) return;
    const cur = this._drainBuff;
    this._drainBuff = cur
      ? { mult: Math.min(cur.mult, mult), leftMs: Math.max(cur.leftMs, durMs) }
      : { mult, leftMs: durMs };
    this.markDirty();
  }

  /** 현재 드레인 감소 버프 (없으면 null — 검증·UI용) */
  get drainBuff(): { leftMs: number; mult: number } | null {
    return this._drainBuff ? { ...this._drainBuff } : null;
  }

  /** 수면(침대) — 피로 0 · HP +50% · 허기/수분 −10 */
  sleepRecover(mult = 1): void {
    const v = this.vitals;
    coreApplySleep(v, mult * this.skillMult('sleep_recovery'));   // 127차 — 쾌면(life_sleep)
    this.commitVitals(v);
    StoryStore.advanceDay();   // 134차 — 스토리 하루는 침대 수면으로만 간다 (D-180)
    this.markDirty();
  }

  /** 활성 상태이상 목록 (읽기 전용 뷰) */
  get statuses(): readonly ActiveStatus[] {
    return this._statuses;
  }

  /** 상태이상 보유 여부 */
  hasStatus(id: StatusEffectId): boolean {
    return this._statuses.some((a) => a.id === id);
  }

  /**
   * 확률 판정 후 상태이상 부여 (127차 P5) — **면역력(`life_immune`)이 발생 확률을 깎는다**.
   * 명시적 롤(채집 부상·식중독 등)은 전부 이 함수를 거쳐야 스킬이 반영된다.
   */
  rollStatus(id: StatusEffectId, chance: number, rng: () => number = Math.random): boolean {
    // 면역력은 전 상태이상 공통, **위생 관념은 식중독 전용**(130차 배선 — 설명 문구가 그렇게 적혀 있었다).
    const extra = id === 'food_poison' ? this.skillMult('hygiene') : 1;
    const p = Math.max(0, Math.min(1, chance * this.skillMult('immunity') * extra));
    return rng() < p && this.addStatus(id);
  }

  /**
   * 구급품 사용 (129차 P7) — 치료 수단(`StatusCure`)이 일치하는 상태이상을 전부 해제한다.
   * 붕대 = bandage(출혈) · 부목 = splint(골절) · 상비약 = medicine(생물중독).
   *
   * **상비약은 추가로** 자연치유 대상(식중독·감기)의 경과를 `TUNING.craft.medicineShortenMin`
   * 만큼 앞당긴다 — 스펙 §5 "자연치유(활동 90분)·상비약 단축".
   * 재발(출혈 30%·골절 25%)은 `life_firstaid`(응급처치)로 감소한다.
   *
   * @param quality 구급품 품질 배율 (craft_medic 제작품 = 1 초과)
   * @returns 해제된 상태이상 id · 재발한 id
   */
  applyRemedy(
    kind: StatusCure, quality = 1, rng: () => number = Math.random,
  ): { cured: StatusEffectId[]; relapsed: StatusEffectId[] } {
    const cured: StatusEffectId[] = [];
    const relapsed: StatusEffectId[] = [];
    if (kind !== 'hospital' && kind !== 'rest') this.addProficiency('firstaid');   // 140차 — 스스로 처치한 것만 숙련
    // 재발 억제 — ⚠ `firstaid`는 **add 모드** 효과다(랭크당 −10%p). skillMult로 읽으면
    // 등록된 mult 항목이 없어 항상 1이 나와 스킬이 조용히 무시된다. 반드시 skillBonus로 뺄 것.
    // 구급품 제작 스킬은 **품질 배율**(mult 모드)로 곱해 들어간다 — 약을 잘 만들면 잘 듣는다.
    const q = quality * this.skillMult('medic_quality');
    const relapseMult = Math.max(0, Math.min(1,
      TUNING.craft.medicRelapseMult - this.skillBonus('firstaid') - Math.max(0, q - 1)));

    for (const a of [...this._statuses]) {
      const def = getStatusEffect(a.id);
      if (!def || def.cure !== kind) continue;
      const r = coreCureStatus(this._statuses, a.id, rng);
      if (!r.removed) continue;
      cured.push(a.id);
      // core가 굴린 재발을 품질·스킬로 한 번 더 완화한다(억제되면 그대로 치료 성공)
      if (r.relapse && rng() < relapseMult) {
        coreAddStatus(this._statuses, a.id);
        relapsed.push(a.id);
      }
    }

    if (kind === 'medicine') {
      const shortenMs = TUNING.craft.medicineShortenMin * 60_000 * q;
      for (const a of this._statuses) {
        const def = getStatusEffect(a.id);
        if (def?.selfHealMin) a.elapsedMs += shortenMs;   // 자연치유 앞당김
      }
    }

    if (cured.length > 0) { this.commitVitals(this.vitals); this.markDirty(); }
    return { cured, relapsed };
  }

  /** 상태이상 부여 — 중복이면 false. 최대치 변화가 있으면 현재값을 즉시 클램프 */
  addStatus(id: StatusEffectId): boolean {
    const ok = coreAddStatus(this._statuses, id);
    if (ok) { this.commitVitals(this.vitals); this.markDirty(); }
    return ok;
  }

  /** 상태이상 치료 — 재발 확률이 걸리면 `relapse: true`(호출측이 잠시 뒤 재부여) */
  cureStatus(id: StatusEffectId): { removed: boolean; relapse: boolean } {
    const r = coreCureStatus(this._statuses, id);
    if (r.removed) { this.commitVitals(this.vitals); this.markDirty(); }
    return r;
  }

  // ─── 기절·사망 (126차 P4 — SPEC §6) ───

  /**
   * 기절에서 기상. 피로도를 **최대치의 faintFatiguePct까지만** 되돌린다
   * (0으로 풀면 공짜 휴식, 최대치 그대로 두면 즉시 재기절 — 그 사이 안전거리).
   * 후유증으로 `exhaust`(탈진)를 부여한다.
   */
  reviveFromFaint(): void {
    const t = TUNING.collapse;
    const p = this.player;
    p.fatigue = Math.min(p.fatigue, this.maxFatigue * (t.faintFatiguePct / 100));
    this.cureStatus('faint');
    this.addStatus('exhaust');
    this.markDirty();
  }

  /**
   * 사망 후 집(침대)에서 부활. 기본 프리셋은 **재화 일부 상실 + 인벤토리 유지**
   * (하드코어 프리셋은 `TUNING.collapse.deathDropInventory = 1`).
   * 창고·냉장고 보관분은 어떤 프리셋에서도 손대지 않는다.
   */
  reviveFromDeath(): { coinLost: number } {
    const t = TUNING.collapse;
    const p = this.player;
    const coinLost = Math.floor((p.inventory.coins ?? 0) * t.deathCoinLossRate);
    if (coinLost > 0) this.addCoins(-coinLost);
    // 사망 판정을 부른 상태이상은 전부 해제하고 후유증만 남긴다
    for (const a of [...this._statuses]) this.cureStatus(a.id);
    this._statuses.length = 0;
    // 후유증(탈진)을 **먼저** 부여해야 `maxHp`가 확정된다 — 순서를 바꾸면 'HP 50%'가 최대치 감소분만큼 후해진다
    this.addStatus('exhaust');
    p.stamina = Math.max(1, Math.round(this.maxHp * (t.deathReviveHpPct / 100)));
    p.fatigue = 0;
    this._hunger = t.deathReviveVitalsPct;
    this._hydration = t.deathReviveVitalsPct;
    this.markDirty();
    return { coinLost };
  }

  // ─── 스킬 트리 (122차) — 포인트 = 레벨 파생 · 랭크만 영속 ───
  get skillRanks(): SkillRanks { return this._skillRanks; }
  skillRank(id: string): number { return this._skillRanks[id] ?? 0; }

  /** 유효 면허 타입 목록 (만료 제외) — 보너스 포인트·해금 조건의 단일 소스 */
  get heldLicenseTypes(): string[] {
    return this._licenses.filter((l) => !l.isExpired).map((l) => String(l.type));
  }

  /** 해금 조건 판정 컨텍스트 (130차 (d)) */
  private get unlockCtx(): SkillUnlockCtx {
    return { level: this._player?.level ?? 1, licenses: this.heldLicenseTypes, ranks: this._skillRanks, questsDone: [...this._completedQuestIds] };
  }

  /** 해금 조건 판정 컨텍스트 (패널이 남은 조건을 표시할 때 쓴다) */
  get skillUnlockCtxPublic(): SkillUnlockCtx { return this.unlockCtx; }

  /** 면허에서 온 보너스 포인트 (130차 — 등식 우변 둘째 항) */
  skillPointsFromLicenses(): number {
    return coreSkillPointsFromLicenses(this.heldLicenseTypes);
  }

  /**
   * 총 스킬 포인트 = **레벨 파생 + 면허 보너스** (130차).
   * 만렙(200) + 전 면허(15) = 215 = 유료 노드 총비용 — "만렙 + 전 면허 = 전 스킬 마스터".
   */
  skillPointsTotal(): number {
    return skillPointsForLevel(this._player?.level ?? 1) + this.skillPointsFromLicenses() + this._bonusSkillPoints;
  }
  /** 선택지 보상 스킬 포인트 (140차) — 예산 우변에 더한다(노드 비용 불변) */
  get bonusSkillPoints(): number { return this._bonusSkillPoints; }
  addBonusSkillPoints(n: number): void {
    this._bonusSkillPoints = Math.max(0, this._bonusSkillPoints + Math.round(n));
    this.markDirty();
  }
  skillPointsAvailable(): number { return Math.max(0, this.skillPointsTotal() - skillPointsSpent(this._skillRanks)); }

  canLearnSkill(id: string): { ok: boolean; reason?: string } {
    const d = getSkillById(id);
    if (!d) return { ok: false, reason: '알 수 없는 스킬' };
    if (SKILL_CATEGORIES.find((c) => c.id === d.category)?.locked) return { ok: false, reason: '이 카테고리는 아직 잠겨 있습니다' };
    // 130차 (e) — 히든 시너지는 **사는 것이 아니라 열리는 것**이다(조건 충족 시 자동 습득).
    if (d.hidden) return { ok: false, reason: '조합을 완성하면 저절로 열립니다' };
    if ((this._skillRanks[id] ?? 0) >= d.maxRank) return { ok: false, reason: '이미 최대 랭크입니다' };
    if (!skillPrereqsMet(d, this._skillRanks)) return { ok: false, reason: '선행 스킬이 필요합니다' };
    // 130차 (d) — 선행 랭크와 **직교하는** 추가 관문(레벨·면허·카테고리 숙련)
    const missing = skillUnlockMissing(d, this.unlockCtx);
    if (missing.length > 0) {
      return { ok: false, reason: `해금 조건 미충족 — ${this.describeUnlock(missing[0])}` };
    }
    if (this.skillPointsAvailable() < d.costPerRank) return { ok: false, reason: '스킬 포인트가 부족합니다' };
    return { ok: true };
  }

  learnSkill(id: string): boolean {
    if (!this.canLearnSkill(id).ok) return false;
    this._skillRanks[id] = (this._skillRanks[id] ?? 0) + 1;
    this.commitVitals(this.vitals);      // 최대치 스킬(대식가·강단 등)은 즉시 상한 재계산
    this.markDirty();
    this.refreshHiddenSkills();          // 이번 습득으로 시너지가 완성됐을 수 있다
    return true;
  }

  /** 해금 조건 문구 — 면허는 id 대신 사람이 읽는 이름으로 */
  describeUnlock(cond: Parameters<typeof coreDescribeUnlockCond>[0]): string {
    if (cond.kind === 'quest') return `할 일 「${coreGetStoryQuest(cond.value)?.titleKo ?? cond.value}」 완료`;
    return coreDescribeUnlockCond(cond, (t) => getLicenseByType(t as never)?.nameKo);
  }

  /**
   * 시너지 히든 스킬 자동 해금 (130차 (e)) — 조건을 채운 히든 노드에 랭크 1을 넣는다.
   * **포인트를 쓰지 않는다**(costPerRank 0). 레벨업·면허 취득·스킬 습득 뒤에 호출한다.
   * 반환 = 이번에 열린 노드(호출측이 안내를 띄운다).
   */
  refreshHiddenSkills(): SkillDef[] {
    const opened = newlyUnlockedHiddenSkills(this.unlockCtx);
    if (opened.length === 0) return [];
    for (const d of opened) this._skillRanks[d.id] = 1;
    this._recentHidden.push(...opened);
    this.commitVitals(this.vitals);
    this.markDirty();
    return opened;
  }

  /**
   * 최근 해금된 히든 시너지를 **한 번만** 꺼낸다 (안내용).
   * 해금은 학습·레벨업·면허 취득·세이브 로드 등 여러 지점에서 일어나는데, 그 전부에
   * 안내를 배선하는 대신 여기에 모아 두고 **UI가 편할 때 꺼내 쓴다**(HUD 로그·패널 배너).
   */
  takeRecentHiddenUnlocks(): SkillDef[] {
    const out = this._recentHidden;
    this._recentHidden = [];
    return out;
  }
  /** 효과 배율 (1 + Σ) — 소비처는 매 호출 읽는다 */
  /**
   * 스킬 포인트 전부 환급 (127차 P5 — '조업 재교육 이수증').
   * 랭크만 지우면 `skillPointsAvailable`이 레벨 파생 총량으로 되돌아온다(포인트를 따로 보관하지 않는다).
   */
  resetSkills(): number {
    const spent = skillPointsSpent(this._skillRanks);
    // 히든 시너지도 함께 지운다 — 조합이 무너졌는데 보상만 남으면 앞뒤가 안 맞는다.
    // (조건이 아직 유효하면 아래 refreshHiddenSkills가 그 자리에서 다시 열어준다.)
    for (const k of Object.keys(this._skillRanks)) delete this._skillRanks[k];
    this.refreshHiddenSkills();
    this.commitVitals(this.vitals);   // stamina_max 등 최대치 즉시 재클램프
    this.markDirty();
    return spent;
  }

  skillMult(key: SkillEffectKey): number { return coreSkillMult(this._skillRanks, key, this._skillProf); }
  skillBonus(key: SkillEffectKey): number { return coreSkillBonus(this._skillRanks, key, this._skillProf); }

  // ─── 숙련도 (140차) — 배운 기술형 스킬은 행위로 채워야 효과가 난다 ───
  get skillProf(): SkillProficiency { return this._skillProf; }
  profXp(skillId: string): number { return this._skillProf[skillId] ?? 0; }
  profLevelOf(skillId: string): number { return profLevel(this.profXp(skillId)); }

  /**
   * 행위 1회 → 배운 숙련도 스킬 전부에 XP. 레벨이 오른 것은 `takeRecentProfUps()`로 UI가 꺼내 안내한다.
   * (캐스팅·랜딩·손질·제작·채집·통발·밑밥·주행·응급처치 … 호출 지점은 각 시스템 훅)
   */
  addProficiency(action: ProfActionKey, mult = 1): ProfGain[] {
    const gains = coreProfGain(this._skillRanks, this._skillProf, action, mult * TUNING.proficiency.xpMult);
    if (gains.length === 0) return gains;
    const ups = gains.filter((g) => g.leveled);
    if (ups.length) this._recentProfUps.push(...ups);
    this.markDirty();
    return gains;
  }

  /** 퀘스트 선택지 '가르침' — skillId 또는 카테고리의 배운 숙련도 스킬 전부에 XP */
  grantProfXp(target: { skillId?: string; category?: SkillCategoryId }, xp: number): string[] {
    const ids: string[] = [];
    if (target.skillId) ids.push(target.skillId);
    else if (target.category) ids.push(...skillsOfCategory(target.category).filter((d) => d.proficiency).map((d) => d.id));
    const applied: string[] = [];
    for (const id of ids) {
      const d = coreGetSkillById(id);
      if (!d?.proficiency || (this._skillRanks[id] ?? 0) <= 0) continue;   // 안 배운 기술은 익혀지지 않는다
      const before = this._skillProf[id] ?? 0;
      this._skillProf[id] = before + Math.max(0, Math.round(xp));
      const lv = profLevel(this._skillProf[id]);
      if (lv > profLevel(before)) this._recentProfUps.push({ skillId: id, xp: this._skillProf[id], level: lv, leveled: true });
      applied.push(id);
    }
    if (applied.length) this.markDirty();
    return applied;
  }

  /** 선택지 '숙련도 1레벨' — 배운 경우에만. 다음 임계까지 채운다 */
  grantProfLevelUp(skillId: string): boolean {
    const d = coreGetSkillById(skillId);
    if (!d?.proficiency || (this._skillRanks[skillId] ?? 0) <= 0) return false;
    const cur = this._skillProf[skillId] ?? 0;
    const lv = profLevel(cur);
    if (lv >= PROF_LEVEL_XP.length) return false;
    this._skillProf[skillId] = PROF_LEVEL_XP[lv];
    this._recentProfUps.push({ skillId, xp: PROF_LEVEL_XP[lv], level: lv + 1, leveled: true });
    this.markDirty();
    return true;
  }

  /** 최근 숙련도 레벨업을 한 번만 꺼낸다 (HUD 로그용) */
  takeRecentProfUps(): ProfGain[] { const o = this._recentProfUps; this._recentProfUps = []; return o; }

  /** 자전거 주행 시간 적립 — 3초마다 'ride' 1회 (RegionFieldScene update가 dt를 넘긴다) */
  noteRiding(dtMs: number): void {
    this._rideAccMs += dtMs;
    while (this._rideAccMs >= 3000) { this._rideAccMs -= 3000; this.addProficiency('ride'); }
  }

  // ─── 통발 조작 ─────────────────────────────

  /** 통발 설치 */
  deployTrap(trap: DeployedTrap): void {
    this._deployedTraps.push(trap);
  }

  /** 통발 수거/제거 */
  removeTrap(instanceId: string): DeployedTrap | null {
    const idx = this._deployedTraps.findIndex((t) => t.instanceId === instanceId);
    if (idx === -1) return null;
    const [removed] = this._deployedTraps.splice(idx, 1);
    return removed ?? null;
  }

  /** 통발 상태 업데이트 (미끼 잔량 등) */
  updateTrap(instanceId: string, partial: Partial<DeployedTrap>): void {
    const trap = this._deployedTraps.find((t) => t.instanceId === instanceId);
    if (trap) Object.assign(trap, partial);
  }

  // ─── 쿨러 조작 ─────────────────────────────

  /** 쿨러에 아이템 추가 (해루질/통발/낚시 결과) */
  addToCooler(item: CoolerSlotItem): void {
    this._coolerInventory.items.push(item);
    this._coolerInventory.totalWeightG += item.weightGrams;
  }

  /** 해루질 결과를 쿨러에 일괄 추가 */
  addHarvestToCooler(harvestItems: ShoreHarvestItem[]): void {
    for (const h of harvestItems) {
      DiscoveryStore.record('creature', h.creatureId, 'night_hunting');
      this.addToCooler({
        instanceId: `harvest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: h.category === 'crustacean' ? 'crustacean'
              : h.category === 'shellfish' || h.category === 'bivalve' || h.category === 'gastropod' ? 'shellfish'
              : 'shellfish',
        speciesId: h.creatureId,
        nameKo: h.nameKo,
        weightGrams: h.countOrWeightG,
        condition: 'live',
        storedAtGameMinute: getCurrentGameMinute(),
      });
    }
  }

  /** 통발 포획물을 쿨러에 일괄 추가 */
  addTrapCatchToCooler(catchItems: TrapCatchItem[]): void {
    for (const c of catchItems) {
      DiscoveryStore.record(c.isFishSpecies ? 'fish' : 'creature', c.creatureId, 'trap');
      this.addToCooler({
        instanceId: `trap_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        // 어종(장어·볼락 등)은 'fish'로 — speciesId가 FishDatabase id라 판매가·도감 경로 연동
        type: c.isFishSpecies ? 'fish' : 'crustacean',
        speciesId: c.creatureId,
        nameKo: c.nameKo,
        weightGrams: c.countOrWeightG,
        condition: 'live',
        storedAtGameMinute: getCurrentGameMinute(),
      });
    }
  }

  /** 쿨러에서 아이템 제거 (조리 시) */
  removeFromCooler(speciesId: string, amountG: number): boolean {
    const idx = this._coolerInventory.items.findIndex((i) => i.speciesId === speciesId);
    if (idx === -1) return false;
    const item = this._coolerInventory.items[idx]!;
    if (item.weightGrams < amountG) return false;
    item.weightGrams -= amountG;
    this._coolerInventory.totalWeightG -= amountG;
    if (item.weightGrams <= 0) {
      this._coolerInventory.items.splice(idx, 1);
    }
    return true;
  }

  // ─── 라이선스 조작 ─────────────────────────

  /** 라이선스 보유 여부 확인 */
  hasLicense(type: LicenseType): boolean {
    return this._licenses.some((l) => l.type === type && !l.isExpired);
  }

  /** 라이선스 취득 */
  acquireLicense(type: LicenseType): boolean {
    if (this.hasLicense(type)) return false;
    const def = getLicenseByType(type);
    if (!def) return false;

    const expiresAt = def.requiresRenewal && def.renewalIntervalDays
      ? new Date(Date.now() + def.renewalIntervalDays * 24 * 3600000)
      : undefined;

    this._licenses.push({
      type,
      acquiredAt: new Date(),
      expiresAt,
      isExpired: false,
    });
    // 130차 — 면허는 **스킬 포인트 +1**(등식 우변)이자 (d) 해금 조건이다.
    //   취득 즉시 히든 시너지 조건이 채워질 수 있으므로 함께 갱신한다.
    this.refreshHiddenSkills();
    StoryStore.event({ kind: 'license', licenseId: type });   // 134차 — 퀘스트 면허 목표
    this.markDirty();
    return true;
  }

  /** 라이선스 만료 여부 체크 & 업데이트 */
  checkLicenseExpiry(): void {
    const now = Date.now();
    for (const lic of this._licenses) {
      if (lic.expiresAt && lic.expiresAt.getTime() < now) {
        lic.isExpired = true;
      }
    }
  }

  // ─── 식당/콘도 조작 ─────────────────────────

  setRestaurant(state: RestaurantState | null): void {
    this._restaurant = state;
  }

  setCondo(state: FloatingCondoState | null): void {
    this._condo = state;
  }

  // ─── 퀘스트 ────────────────────────────────

  completeQuest(questId: string): void {
    this._completedQuestIds.add(questId);
  }
  /** 카탈로그 아이템 이름 (일지·대화창 보상 표기 — 141차) */
  itemNameOf(id: string): string {
    return buildItemWikiCatalog().find((w) => w.id === id)?.name ?? id;
  }

  // ─── 세이브/로드 ───────────────────────────

  get activeSlot(): number | null {
    return this._activeSlot;
  }

  /** 현재 상태를 SaveData로 직렬화 */
  private buildSaveData(): SaveData | null {
    if (!this._player) return null;
    this._player.lastSavedAt = new Date();
    return {
      player: this._player,
      deployedTraps: this._deployedTraps,
      coolerInventory: this._coolerInventory,
      licenses: this._licenses,
      restaurant: this._restaurant,
      condo: this._condo,
      visitedSpotIds: Array.from(this._visitedSpotIds),
      completedQuestIds: Array.from(this._completedQuestIds),
      skills: this._skills,
      skillTree: this._skillRanks,
      skillProf: this._skillProf,
      bonusSkillPoints: this._bonusSkillPoints,
      coolerBox: CoolerStore.serialize(),
      inventoryStore: InventoryStore.serialize(),
      fridge: FridgeStore.serialize(),
      flags: this._flags,
      worldObjects: this._worldObjects,
      discoveries: DiscoveryStore.serialize(),
      vitals: { hunger: this._hunger, hydration: this._hydration, statuses: this._statuses },
      story: StoryStore.serialize(),
      character: this._character,
      version: SAVE_VERSION,
    };
  }

  /** 1회성 안내 플래그 조회/설정 (예: 'chumGuideSeen' — 밑밥 가이드 최초 자동표시) */
  getFlag(key: string): boolean {
    return !!this._flags[key];
  }

  setFlag(key: string, value = true): void {
    this._flags[key] = value;
  }

  // ─── 저장 정책 (HOMETOWN_HOME_SPEC — "집 침대에서만 저장") ───

  /** 현재 위치에서 저장 가능한지 — TUNING.save.allowedTags (기본: 집 실내 침대) */
  canSaveHere(): boolean {
    return TUNING.save.allowedTags.includes(this.locationTag);
  }

  /** 마지막 디스크 저장 이후 진행이 있는지 (종료 경고용) */
  get isDirty(): boolean {
    return this._dirty;
  }

  /** 진행 발생 표시 — 구 자동저장 지점들이 호출 (디스크 기록은 침대에서만) */
  markDirty(): void {
    this._dirty = true;
  }

  /**
   * 세이브 — 저장 허용 위치(집 침대)에서만 디스크 기록.
   * 불가 위치면 false 반환 (호출부가 안내 표시). 슬롯 생성 등 강제 저장은 saveToSlot 직접 사용.
   */
  save(): boolean {
    if (!this.canSaveHere()) {
      console.log(`[GameState] Save blocked — location '${this.locationTag}' not allowed (집 침대에서만 저장).`);
      return false;
    }
    return this.saveToSlot(this._activeSlot ?? 1);
  }

  /** 지정 슬롯(1~3)에 저장. 성공 여부 반환 (위치 게이트 없는 프리미티브 — 슬롯 생성용) */
  saveToSlot(slot: number): boolean {
    const data = this.buildSaveData();
    if (!data) return false;
    try {
      localStorage.setItem(SLOT_KEY(slot), JSON.stringify(data));
      this._activeSlot = slot;
      this._dirty = false;
      console.log(`[GameState] Saved to slot ${slot}.`);
      return true;
    } catch (e) {
      console.error('[GameState] Save failed:', e);
      return false;
    }
  }

  // ─── 맵 오브젝트 월드 상태 (초기 배치 − removed + moved + placed) ───

  /** 맵의 오브젝트 월드 상태 조회 (없으면 빈 상태 생성) */
  getWorldObjects(mapId: string): WorldObjectState {
    if (!this._worldObjects[mapId]) this._worldObjects[mapId] = createEmptyWorldObjectState();
    return this._worldObjects[mapId];
  }

  /** 지정 슬롯(1~3)에서 불러오기. 성공 여부 반환 */
  loadFromSlot(slot: number): boolean {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return false;
    const parsed = this.parseSaveData(raw);
    if (!parsed) return false;
    this.applySaveData(parsed);
    this._activeSlot = slot;
    this._isInitialized = true;
    console.log(`[GameState] Loaded from slot ${slot}.`);
    return true;
  }

  /** 슬롯 메타 정보 조회 (메인 메뉴 표시용 — 상태 변경 없음) */
  getSlotMeta(slot: number): SaveSlotMeta {
    try {
      const raw = localStorage.getItem(SLOT_KEY(slot));
      if (!raw) return { exists: false };
      const parsed = JSON.parse(raw) as SaveData;
      return {
        exists: true,
        nickname: parsed.player?.nickname ?? '이름없는꾼',
        level: parsed.player?.level ?? 1,
        coins: parsed.player?.inventory?.coins ?? 0,
        savedAt: parsed.player?.lastSavedAt ? new Date(parsed.player.lastSavedAt) : undefined,
      };
    } catch {
      return { exists: false };
    }
  }

  /** 지정 슬롯에서 새 게임 시작 (기존 데이터 덮어씀) */
  startNewGameInSlot(slot: number): void {
    this.newGame();
    this._activeSlot = slot;
    this.saveToSlot(slot);
  }

  /** 저장 슬롯 삭제. 진행 중이던 슬롯이면 활성 슬롯 해제 */
  deleteSlot(slot: number): void {
    localStorage.removeItem(SLOT_KEY(slot));
    if (this._activeSlot === slot) this._activeSlot = null;
    console.log(`[GameState] Slot ${slot} deleted.`);
  }

  /** 세이브 원본 파싱 + Date 복원 */
  private parseSaveData(raw: string): SaveData | null {
    try {
      const parsed = JSON.parse(raw) as SaveData;

      // Date 복원
      if (parsed.player) {
        parsed.player.createdAt = new Date(parsed.player.createdAt);
        parsed.player.lastSavedAt = new Date(parsed.player.lastSavedAt);
        if (parsed.player.stamina === undefined) parsed.player.stamina = 100;
        if (parsed.player.fatigue === undefined) parsed.player.fatigue = 0;
        if (parsed.player.activeQuickslotIndex === undefined) parsed.player.activeQuickslotIndex = 0;
        if (parsed.player.level === undefined) parsed.player.level = 1;
        if (parsed.player.experience === undefined) parsed.player.experience = 0;
      }
      if (parsed.deployedTraps) {
        for (const trap of parsed.deployedTraps) {
          trap.deployedAt = new Date(trap.deployedAt);
          trap.nextCheckAt = new Date(trap.nextCheckAt);
          for (const c of trap.catchInside) {
            c.enteredAt = new Date(c.enteredAt);
          }
        }
      }
      // storedAtGameMinute는 숫자이므로 별도 역직렬화 불필요
      if (parsed.licenses) {
        for (const lic of parsed.licenses) {
          lic.acquiredAt = new Date(lic.acquiredAt);
          if (lic.expiresAt) lic.expiresAt = new Date(lic.expiresAt);
        }
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /** 부팅 로드 — 레거시 단일 키(SAVE_KEY) 호환 */
  private load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return this.parseSaveData(raw);
  }

  /** 새 게임 시작 (상태 초기화 — 슬롯 파일은 건드리지 않음) */
  /** 플레이어 외형·복장 (138차) — 바닐라는 나체+언더웨어, 생성 직후 스타터 한 벌 */
  private _character: CharConfig = GameStateManager.defaultCharacter('m');

  static defaultCharacter(sex: CharSex): CharConfig {
    return { look: defaultAppearance(sex), outfit: starterOutfit(sex) };
  }

  get character(): CharConfig { return this._character; }

  setCharacter(cfg: CharConfig): void {
    this._character = cfg;
    this.markDirty();
  }

  newGame(): void {
    this._character = GameStateManager.defaultCharacter('m');
    this._player = createDefaultPlayer();
    this._deployedTraps = [];
    this._coolerInventory = createDefaultCoolerInventory();
    this._licenses = [{ type: 'basic_angling', acquiredAt: new Date(), isExpired: false }];
    this._restaurant = null;
    this._condo = null;
    this._visitedSpotIds = new Set();
    this._completedQuestIds = new Set();
    this._skills = createDefaultSkills();
    this._skillRanks = {};
    this._flags = {};
    this._skillProf = {};
    this._bonusSkillPoints = 0;
    this._worldObjects = {};
    this._hunger = 100;
    this._hydration = 100;
    this._statuses = [];
    this._dirty = false;
    CoolerStore.resetAll();
    InventoryStore.resetAll();
    FridgeStore.resetAll();
    DiscoveryStore.resetAll();
    StoryStore.resetAll();
    this.syncInventoryDiscoveries();
    this._currentSpotId = null;
    this._isInitialized = true;
  }
}

export const GameState = new GameStateManager();

// 134차 — 스토리 스토어에 XP·재화·면허·플래그 권한 위임 (순환 import 회피)
StoryStore.bind({
  grantXp: (n) => { GameState.grantXp(n); },
  addCoins: (n) => { GameState.addCoins(n); },
  acquireLicense: (t) => GameState.acquireLicense(t as never),
  heldLicenses: () => GameState.licenses.filter((l) => !l.isExpired).map((l) => l.type as string),
  level: () => GameState.player.level ?? 1,
  coins: () => GameState.player.inventory.coins,
  setFlag: (k, v) => GameState.setFlag(k, v),
  markQuestDone: (id) => GameState.completeQuest(id),
  markDirty: () => GameState.markDirty(),
  spendLabor: (h, w, f) => GameState.spendLabor(h, w, f),
  fatigue: () => GameState.vitals.fatigue,
  // 140차 — 선택지 결과 보상
  hasFlag: (k) => GameState.getFlag(k),
  giveItem: (id, qty, bound) => {
    const e = buildItemWikiCatalog().find((w) => w.id === id);
    if (!e) { console.warn(`[Story] 보상 아이템 카탈로그 없음: ${id}`); return false; }
    return InventoryStore.addItem(bound ? { ...e.tpl, bound: true } : e.tpl, qty);
  },
  itemName: (id) => buildItemWikiCatalog().find((w) => w.id === id)?.name ?? id,
  month: () => new Date().getMonth() + 1,
  addSkillPoints: (n) => GameState.addBonusSkillPoints(n),
  grantProfXp: (t, xp) => GameState.grantProfXp(t, xp),
  grantProfLevelUp: (id) => GameState.grantProfLevelUp(id),
});

// dev 검증용 전역 노출 — 하네스의 `import('/src/…')` 모듈은 게임 인스턴스와 다를 수
// 있으므로(InventoryStore `__INV`와 동일한 함정) 실싱글턴을 노출한다. (프로덕션 미노출)
if (import.meta.env.DEV) {
  (globalThis as unknown as { __GS?: unknown }).__GS = GameState;
}
