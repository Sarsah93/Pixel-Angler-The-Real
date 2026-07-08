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
import { getLicenseByType, getCurrentGameMinute, calculateTideInfo } from '@tra/core';
import { EnvironmentStore } from './EnvironmentStore.js';

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
  };
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
  version: number;
}

const SAVE_VERSION = 1;
const SAVE_KEY = 'tra_save_v1';

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
  private _currentSpotId: string | null = null;
  private _isInitialized = false;

  readonly environment = EnvironmentStore;

  // ─── 초기화 ───────────────────────────────

  initialize(): void {
    if (this._isInitialized) return;

    const saved = this.load();
    if (saved) {
      this._player = saved.player;
      this._deployedTraps = saved.deployedTraps ?? [];
      this._coolerInventory = saved.coolerInventory ?? createDefaultCoolerInventory();
      this._licenses = saved.licenses ?? [];
      this._restaurant = saved.restaurant ?? null;
      this._condo = saved.condo ?? null;
      this._visitedSpotIds = new Set(saved.visitedSpotIds ?? []);
      this._completedQuestIds = new Set(saved.completedQuestIds ?? []);
    } else {
      this._player = createDefaultPlayer();
      // 기본 면허 부여 (기본 낚시 면허)
      this._licenses = [{
        type: 'basic_angling',
        acquiredAt: new Date(),
        isExpired: false,
      }];
    }

    this._isInitialized = true;
    console.log('[GameState] Initialized. Player:', this._player?.nickname);
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

  /** 코인 추가/차감 */
  addCoins(amount: number): boolean {
    if (!this._player) return false;
    const newCoins = this._player.inventory.coins + amount;
    if (newCoins < 0) return false;
    this._player.inventory.coins = newCoins;
    return true;
  }

  /** 물고기 포획 성공 시 살림망에 추가 및 개인 최고기록 갱신 */
  addCaughtFish(speciesId: string, _nameKo: string, lengthCm: number, weightGram: number): void {
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
      this.addToCooler({
        instanceId: `trap_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'crustacean',
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

  // ─── 세이브/로드 ───────────────────────────

  /** 세이브 */
  save(): void {
    if (!this._player) return;
    try {
      this._player.lastSavedAt = new Date();
      const saveData: SaveData = {
        player: this._player,
        deployedTraps: this._deployedTraps,
        coolerInventory: this._coolerInventory,
        licenses: this._licenses,
        restaurant: this._restaurant,
        condo: this._condo,
        visitedSpotIds: Array.from(this._visitedSpotIds),
        completedQuestIds: Array.from(this._completedQuestIds),
        version: SAVE_VERSION,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('[GameState] Saved.');
    } catch (e) {
      console.error('[GameState] Save failed:', e);
    }
  }

  /** 로드 */
  private load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;

      // Date 복원
      if (parsed.player) {
        parsed.player.createdAt = new Date(parsed.player.createdAt);
        parsed.player.lastSavedAt = new Date(parsed.player.lastSavedAt);
        if (parsed.player.stamina === undefined) parsed.player.stamina = 100;
        if (parsed.player.fatigue === undefined) parsed.player.fatigue = 0;
        if (parsed.player.activeQuickslotIndex === undefined) parsed.player.activeQuickslotIndex = 0;
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

  /** 새 게임 시작 (세이브 초기화) */
  newGame(): void {
    localStorage.removeItem(SAVE_KEY);
    this._player = createDefaultPlayer();
    this._deployedTraps = [];
    this._coolerInventory = createDefaultCoolerInventory();
    this._licenses = [{ type: 'basic_angling', acquiredAt: new Date(), isExpired: false }];
    this._restaurant = null;
    this._condo = null;
    this._visitedSpotIds = new Set();
    this._completedQuestIds = new Set();
  }
}

export const GameState = new GameStateManager();
