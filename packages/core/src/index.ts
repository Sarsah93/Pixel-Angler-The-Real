/**
 * @file index.ts
 * @description @tra/core 패키지 공개 API
 *
 * 이 파일에서 export하는 것만 외부 패키지에서 사용 가능합니다.
 */

// Types
export type { PlayerState, PlayerStatus, FacingDirection, CaughtFishRecord, Inventory, RemotePlayerSnapshot } from './types/Player.js';
export type { TackleSetup, RodSpec, ReelSpec, LineSpec, FloatSpec, HookSpec, BaitItem, RigType, RodType, ReelType, BaitCategory } from './types/Gear.js';
export type { TideInfo, WeatherData, FishingEnvironment, FishingSpotInfo, SpotType, WeatherCondition } from './types/Environment.js';
export type { FishingPhase, BitePattern, SetHookResult, FightingState, FishingSessionResult, CastingResult, FishingPoint } from './types/Fishing.js';
export type {
  ShoreCreatureCategory,
  ShoreHuntingGear,
  ShoreHuntingPhase,
  ShoreHarvestItem,
  ShoreHuntingResult,
  TrapType,
  TrapSpec,
  DeployedTrap,
  TrapCatchItem,
  TrapHarvestResult,
  CoolerSpec,
  CoolerInventory,
  CoolerSlotItem,
  FishProcessingStep,
  ProcessingLocation,
  CookingRecipe,
  RecipeIngredient,
  CookingPhase,
  RestaurantTier,
  RestaurantState,
  DiningCustomer,
  FloatingCondoState,
  CondoReservation,
  CondoAmenity
} from './types/Activities.js';
export type {
  LicenseType,
  LicenseDef,
  UnlockRequirement,
  UnlockableFeature,
  PlayerLicenses,
  HeldLicense
} from './types/License.js';
export type {
  QuestObjectiveType,
  QuestObjective,
  QuestReward,
  QuestCategory,
  Quest,
  PlayerQuestProgress
} from './types/Quest.js';
export type {
  WholesalePriceInfo,
  AuctionMappingDef,
  MartRetailMappingDef,
  AuctionCategory,
  AuctionTimeWindow,
  AuctionScheduleRule,
  AuctionLotStatus,
  AuctionLot,
  AuctionSession,
  AuctionBidResult,
} from './types/Economy.js';
export { SEAFOOD_AUCTION_MAPPING, MART_RETAIL_DATABASE, DEFAULT_AUCTION_SCHEDULE } from './types/Economy.js';
export type {
  ItemConditionState,
  ItemUsePurpose,
  ItemSourceVendor,
  ItemConversionRule,
  ConditionDecayRule,
  UniversalItem,
  InventoryItemInstance,
} from './types/Item.js';
export { evaluateItemCondition, getCurrentGameMinute } from './types/Item.js';

// DB Schema
export { FISH_DATABASE, getFishById, getFishBySpotType, getFishByMonth } from './db-schema/FishDatabase.js';
export type { FishSpecies, FishRarity } from './db-schema/FishDatabase.js';
export { ROD_DATABASE, REEL_DATABASE, LINE_DATABASE, FLOAT_DATABASE, HOOK_DATABASE, getRodById, getReelById, getLineById, getFloatById } from './db-schema/GearSpecs.js';
export { SPOT_DATABASE, getSpotById, getSpotsByRegion, getSpotsByType } from './db-schema/SpotDatabase.js';
export { BAIT_DATABASE, getBaitById, getForagableBaits } from './db-schema/BaitDatabase.js';
export { SHORE_CREATURE_DATABASE, getCreatureById, getCreaturesByCategory, getCreaturesBySpotType, getActiveCreaturesByMonth } from './db-schema/ShoreCreatureDatabase.js';
export type { ShoreCreature } from './db-schema/ShoreCreatureDatabase.js';
export { TRAP_DATABASE, getTrapById, getTrapsByType } from './db-schema/TrapDatabase.js';
export { RECIPE_DATABASE, getRecipeById, getRecipesByLocation, getRecipesByIngredient } from './db-schema/RecipeDatabase.js';
export { ANGLER_APP_REGIONS, TIDAL_CHARACTERISTICS, getRegionByCode, getRegionsByProvince, getRegionsByTidalCharacteristic, getAnglerAppRegions } from './db-schema/AnglerAppSpots.js';
export type { AnglerAppRegion } from './db-schema/AnglerAppSpots.js';
export { LICENSE_DATABASE, getLicenseByType, checkUnlockRequirements } from './types/License.js'; // Note: Defined directly inside types/License.ts
export { QUEST_DATABASE, getQuestById, getQuestsByCategory, getAvailableQuests } from './db-schema/QuestDatabase.js';
export { FISH_BEHAVIOR_DB, getBehaviorProfile, interpolateTempActivity, isClosedSeason } from './db-schema/FishBehaviorDatabase.js';
export type { FishBehaviorProfile, TempActivityPoint } from './db-schema/FishBehaviorDatabase.js';
export {
  UNIVERSAL_ITEM_DATABASE,
  getUniversalItemById,
  getItemsByVendor,
  getBaitableItems,
  getCookingItems,
} from './db-schema/UniversalItemDatabase.js';

// Simulation
export { calculateTideInfo, evaluateFishingTide } from './simulation/TideCalculator.js';
export { calculateBiteChance, pickFishByWeight, generateFishSize } from './simulation/FishBiteEngine.js';
export type { BiteCalculationResult, BiteFactors } from './simulation/FishBiteEngine.js';
export { updateLineTension, getLineTensionRatio, getEffectiveDragKg, getTensionDangerLevel, getRetrieveSpeedMps } from './simulation/LinePhysics.js';
export type { LineState } from './simulation/LinePhysics.js';
export { calculateCast } from './simulation/CastingModel.js';
export type { CastInput, CastResult } from './simulation/CastingModel.js';
export { evaluateFishingSafety, isGoldenHour, isNighttime, buildFishingEnvironment, getWindDirectionLabel } from './simulation/WeatherModel.js';
export { canPerformNightHunting, getHuntableCreatures, attemptHunt, simulateNightHuntingSession } from './simulation/NightHuntingEngine.js';
export type { NightHuntingContext } from './simulation/NightHuntingEngine.js';
export { harvestTrap, calculateTrapLossRisk, validateTrapDeployment, getNextOptimalHarvestTime } from './simulation/TrapSystem.js';
export type { TrapDeploymentContext } from './simulation/TrapSystem.js';
export { evaluateFishSellPrice } from './simulation/MarketPriceEvaluator.js';
export type { PriceEvaluationResult } from './simulation/MarketPriceEvaluator.js';
export {
  getActiveAuctionCategories,
  isAuctionOpen,
  minutesUntilNextAuction,
  createAuctionLot,
  createAuctionSession,
  placeBid,
  simulateNpcCounterBid,
  advanceAuctionSession,
  calcPlayerAuctionTotal,
} from './simulation/AuctionEngine.js';
export type { LotGenerationParams } from './simulation/AuctionEngine.js';

// HydroDynamics & TacklePhysics
export type { WaterType, TileWaterState, HydroGrid, FightIncident } from './types/Hydrodynamics.js';
export { generateHydroGrid, getWaterStateAt } from './simulation/HydroDynamicsEngine.js';
export { calculateSinkingDepth, updateBaitDrift, getBaitDepthAffinity, evaluateFightIncidents } from './simulation/TacklePhysicsEngine.js';

// API Clients
export { PublicDataClient } from './api-client/PublicDataClient.js';
export { WeatherApiClient } from './api-client/WeatherApiClient.js';
export { OceanApiClient, TIDE_STATION_CODES } from './api-client/OceanApiClient.js';

// Utils
export { getApproxLunarDay, getLunarDayDisplay } from './utils/LunarCalendar.js';
export { getDistanceBetweenCoordinates } from './utils/GeoUtils.js';
export { latLonToDotMapXY, dotMapXYToWorld, latLonToKmaGrid, haversineDistanceKm, enrichSpotCoordinates } from './utils/CoordinateUtils.js';

