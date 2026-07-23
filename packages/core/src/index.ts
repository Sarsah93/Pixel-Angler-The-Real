/**
 * @file index.ts
 * @description @tra/core 패키지 공개 API
 *
 * 이 파일에서 export하는 것만 외부 패키지에서 사용 가능합니다.
 */

// Types
export type { PlayerState, PlayerStatus, FacingDirection, CaughtFishRecord, Inventory, RemotePlayerSnapshot } from './types/Player.js';
export type { TackleSetup, RodSpec, ReelSpec, LineSpec, FloatSpec, HookSpec, BaitItem, RigType, RodType, ReelType, BaitCategory } from './types/Gear.js';
export type { TideInfo, WeatherData, WaterTemperatureData, FishingEnvironment, FishingSpotInfo, SpotType, WeatherCondition } from './types/Environment.js';
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
export type { WeightSinkerKind, WeightSinkerSpec } from './db-schema/SinkerDatabase.js';
export {
  WEIGHT_SINKER_DB, SINKER_KIND_LABEL, SINKER_KIND_BRAND,
  SINKER_BASE_DRAG_CD, SINKER_BUNDLE_DRAG_CD, SINKER_HOLE_FEEDBACK_MULT,
  sinkerWeightByHo, getWeightSinkerSpec,
} from './db-schema/SinkerDatabase.js';
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
export { getLineTensionRatio, getEffectiveDragKg, getTensionDangerLevel, getRetrieveSpeedMps, adjustDrag, simulateFightTick, canReel, getRecommendedDragKg, castLineOut } from './simulation/LinePhysics.js';
export type { LineState } from './simulation/LinePhysics.js';

// 회 뜨기(활어 손질~삼면뜨기~박피) 미니게임 — 방향 상태 머신 + 컷 판정 + 수율 산출
export type {
  OrientationState, ButcheryTool, CutPoint, CutSpec, ButcheryProfile,
  ButcheryPrimitive, ButcheryStage, CutEvalResult, SashimiGrade, ButcheryResult,
  FilletShape, KnifeSpec, FilletYieldInput, FilletYieldResult,
} from './types/Butchery.js';
export { ORIENTATION_LABEL } from './types/Butchery.js';
export { BUTCHERY_PROFILES, DEFAULT_BUTCHERY_PROFILE, getButcheryProfile } from './db-schema/ButcheryProfiles.js';
export { KNIFE_SPECS, getBestKnife, isKnifeItem } from './db-schema/KnifeDatabase.js';
export type { SashimiGradeInput } from './simulation/ButcheryProcess.js';
export {
  ButcheryProcess, evaluateCut, computeSashimiGrade, buildButcheryStages, computeFilletYield,
} from './simulation/ButcheryProcess.js';

// 파이트 피로 4페이즈 (어종·사이즈별 스태미나 풀 + 회복/서지 — thrust 게이팅)
export type { FatiguePhase, FatigueInput, FatigueTick } from './simulation/FishFatigueModel.js';
export {
  FishFatigueModel, staminaMaxFor, STAMINA_BASE, DEFAULT_STAMINA_BASE, FATIGUE_PHASE_LABEL,
} from './simulation/FishFatigueModel.js';

// 파이트 모드 2D 횡 러닝 (측면하중 + heading/displacement — LinePhysics 1D 재사용 확장)
export type { Vec2, MovementProfile, FightState2D, FightInput2D, FightTick2DResult } from './simulation/FightPhysics2D.js';
export {
  simulateFightTick2D, computeFishThrustKg, pickRunHeading,
  MOVEMENT_PROFILES, DEFAULT_MOVEMENT_PROFILE, getMovementProfile,
  TIER_POWER_MUL, TIER_STAMINA_MUL, LOW_STAMINA_ROLL,
} from './simulation/FightPhysics2D.js';
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

// 정부/공공기관 OpenAPI 통합 수집 (바다낚시지수/경락가/어획량)
export type { SeaFishingIndexInfo, FishingIndexGubun } from './api-client/FishingIndexApiClient.js';
export { FishingIndexApiClient, getMockFishingIndex, formatYmd } from './api-client/FishingIndexApiClient.js';
export { AuctionPriceApiClient, getMockWholesalePrices } from './api-client/AuctionPriceApiClient.js';
export type { MafraFishPriceRow, MafraGridResponse, MafraQueryOptions } from './api-client/MafraAuctionApiClient.js';
export { MafraAuctionApiClient, MAFRA_ITEM_TO_SPECIES, matchMafraSpecies, mapToDatasetDate } from './api-client/MafraAuctionApiClient.js';
export type { RegionalCatchStat } from './api-client/KosisCatchApiClient.js';
export { KosisCatchApiClient, getMockRegionalCatch } from './api-client/KosisCatchApiClient.js';
export type { ExternalApiKeys, ExternalDataSnapshot } from './api-client/ExternalApiService.js';
export { ExternalApiService } from './api-client/ExternalApiService.js';

// 해양수산부 국립해양측위정보원 해양기상 (전국 76개 관측소)
export type { NmpntWeatherRow, MarineWeatherInfo } from './api-client/MarineWeatherApiClient.js';
export { MarineWeatherApiClient, parseNmpntDateTime } from './api-client/MarineWeatherApiClient.js';
export type { MarineStation, StationSensors } from './db-schema/MarineStations.js';
export {
  MARINE_STATIONS, MMAF_OFFICES, getStation, getStationsByOffice, getStationsWithSensor,
} from './db-schema/MarineStations.js';

// 기상청 단기예보 (하늘상태·강수·파고 — 해양기상 API에 없는 항목)
export type {
  SkyCode, PtyCode, WeatherKind, KmaFcstItem, KmaGrid, KmaWeatherInfo,
} from './api-client/KmaVilageFcstApiClient.js';
export {
  KmaVilageFcstApiClient, WEATHER_LABEL, resolveWeatherKind, parsePrecipitation,
  ultraSrtNcstBase, vilageFcstBase,
} from './api-client/KmaVilageFcstApiClient.js';
export type { KmaGridPoint } from './db-schema/KmaGridPoints.js';
export { KMA_GRID_BY_REGION, getKmaGrid } from './db-schema/KmaGridPoints.js';

// 공공데이터 출처 표기 (이용약관상 출처 표시 의무)
export type { DataAttribution, DataLicense } from './db-schema/DataAttributions.js';
export {
  DATA_ATTRIBUTIONS, LICENSE_LABEL, groupAttributionsByProvider,
} from './db-schema/DataAttributions.js';

// 입질 시퀀스 (초릿대 구부러짐 3단계 + 챔질 판정)
export type { BendStage, HooksetResult, BiteSequenceTick, BiteSequenceOptions } from './simulation/BiteSequenceEngine.js';
export {
  BiteSequenceEngine, FLOAT_SINK_BY_STAGE, HOOKSET_SUCCESS,
} from './simulation/BiteSequenceEngine.js';

// 조류 물리 (조수/본대조류/횡조류/반탄류/조경지대)
export type { TidalVector3, TidalZone, TidalInfluence, TidalEngineOptions } from './simulation/TidalCurrentEngine.js';
export { TidalCurrentEngine, TIDAL_ZONE_LABEL } from './simulation/TidalCurrentEngine.js';

// 해저 지형 프로필 (거리 기반 연속 지형 — 수심 모식도 바닥/여밭 판정/어탐 기반)
export type { SeabedSample } from './simulation/SeabedProfile.js';
export { SeabedProfile } from './simulation/SeabedProfile.js';

// Utils
export { getApproxLunarDay, getLunarDayDisplay } from './utils/LunarCalendar.js';
export type { KstParts } from './utils/KstTime.js';
export {
  toKstDate, kstParts, kstHour, kstYmd, isNightHour, isNightNow,
} from './utils/KstTime.js';
export { getDistanceBetweenCoordinates } from './utils/GeoUtils.js';
export { latLonToDotMapXY, dotMapXYToWorld, latLonToKmaGrid, haversineDistanceKm, enrichSpotCoordinates } from './utils/CoordinateUtils.js';

// Services
export { WeatherEvents } from './services/WeatherEventEmitter.js';
export type { WeatherEventType, WeatherEvent, WeatherEventEffect } from './services/WeatherEventEmitter.js';

// Region Database
export type { RegionDef } from './db-schema/RegionDatabase.js';
export { REGION_DATABASE, getRegionById, getRegionBySpotId, getFishingRegionByCode } from './db-schema/RegionDatabase.js';

// Tile Gather Engine
export type { EdgeTileType, GatherToolType, GatherableItem, GatherAttemptResult, SlipCheckResult } from './simulation/TileGatherEngine.js';
export { GATHER_ITEM_DATABASE, checkSlipHazard, getAvailableGatherItems, attemptGather } from './simulation/TileGatherEngine.js';

// World Map
// 1인칭 낚시 물리 파이프라인 (캐스팅 → 수중 침강/흘림 → 입질 → 파이팅)
export type { WindVector, CastLaunchParams, CastProjectile } from './simulation/CastingPhysicsEngine.js';
export { launchCast, stepCast, simulateCastTrajectory } from './simulation/CastingPhysicsEngine.js';
export type { TideVector, RigPhysicsParams, UnderwaterRigState, UnderwaterStepInput } from './simulation/UnderwaterSinkPhysics.js';
export { createUnderwaterRig, computeSinkSpeed, stepUnderwater, isHoldState } from './simulation/UnderwaterSinkPhysics.js';
export type { LineTensionInput, LineTensionOutput } from './simulation/LineTensionPhysics.js';
export { LineTensionPhysics, HOLD_LIFT_M } from './simulation/LineTensionPhysics.js';
export type { ChumBall, ChumProbePos, ChumParcel, ChumDrift, ChumSyncTarget, ChumPathPrediction, ChumSyncOpts } from './simulation/ChumPhysics.js';
export {
  ChumPhysics, CHUM_PARCEL_TTL_SEC,
  createChumParcel, stepChum, computeChumSync, maxChumSync, predictChumPath, optimalThrowX,
  isChumExpired, chumAlpha01, chumEllipseRadii,
} from './simulation/ChumPhysics.js';

// 튜닝값 단일 소스 (feel=dev 패널 / balance=시뮬) — 매직넘버 중앙화
export type { TuningConfig, TuningParamMeta, ChumTypeSpec, ChumTypeKey } from './config/tuning.js';
export { TUNING, TUNING_META, getTuning, setTuning } from './config/tuning.js';
export type { BiteContext, BiteTickResult } from './simulation/BiteProbabilityEngine.js';
export { BiteProbabilityEngine } from './simulation/BiteProbabilityEngine.js';
export type {
  SwimLayer, BaitKey, HabitatTerrain, FightProfile,
  FishMasterSpec, SpawnContext, SpawnedFish,
} from './simulation/FishSpawningOracle.js';
export { ORACLE_FISH_DB, spawnFish, classifyLayer, getBaitAffinity } from './simulation/FishSpawningOracle.js';

// 크기 등급(소/중/대) + 루어 무게·주간·급심 게이트 (중대형 회유어)
export type { SizeTier, TierRollContext } from './simulation/SizeTierRules.js';
export {
  SIZE_TIER_BOUNDS, SIZE_TIER_LABEL, PELAGIC_DAYTIME_SPECIES,
  classifySizeTier, rollTierWeights, rollTieredLength,
} from './simulation/SizeTierRules.js';

// 피딩타임 (계절 시간창 × 조류 × 날씨 → 활성도 배율 — 입질/보일링/스쿨링 공통 입력)
export type { FeedingRegionProfile, FeedingTimeInput, FeedingActivityResult } from './simulation/FeedingTimeCalculator.js';
export {
  computeFeedingActivity, seasonTimeWindow, tideActivityFactor,
  weatherActivityFactor, feedingRegionProfileOf,
} from './simulation/FeedingTimeCalculator.js';

// 채비 추천 알고리즘 (지역/지형/물때/대상어종 → 조법·찌·봉돌·미끼)
export type { FishingTechnique, SnagRisk, RigRecoContext, RigRecommendation } from './simulation/RigRecommender.js';
export { getRigRecommendation, TECHNIQUE_LABEL } from './simulation/RigRecommender.js';

// 루어(가짜 미끼) 채비 — 카탈로그 + 연산
export type { LureFamily, LureKind, SinkType, LureActionFlag, LureSpec } from './types/Lure.js';
export { LURES_CATALOG_DB, getLureSpec, getLuresByKind } from './db-schema/LuresCatalogDB.js';
export type { LureSinkProfile } from './simulation/LureRig.js';
export {
  JIGHEAD_WEIGHTS_G, jigHeadWeightById,
  computeLureRigWeight, getLureCastCd, getLureSinkProfile,
} from './simulation/LureRig.js';
export type { FightPattern, FightInput, FightEvent, FightStatus, FightingFishSpec } from './simulation/FightingPhase.js';
export { FightingPhase } from './simulation/FightingPhase.js';

// 실측 연안 수심 프로필 (연안정보도 SHP → 거리별 수심)
export type { DepthAnchorProfile, RegionDepthProfile } from './types/DepthProfile.js';
export { depthAtDistance, findDepthAnchor } from './types/DepthProfile.js';

// Angler 물리 스탯 + 다차원 캐스팅 공간 (Zone/수심)
export type { AnglerStats, SeaZone, ZoneDepthProfile } from './types/AnglerStats.js';
export {
  DEFAULT_ANGLER_STATS, ANGLER_STAT_INFO,
  DEFAULT_ZONE_DEPTH_PROFILES, computeZoneMaxDepth,
} from './types/AnglerStats.js';

export type { FishingSpotNode, WorldMapSpotType, RegionAreaNode } from './types/WorldMap.js';
export {
  WORLD_NODE_DATABASE, REGION_AREA_NODES, SNAG_RISK_LABEL, SNAG_RISK_MULT,
  isRegionUnlocked, getRegionAreaNodes, getAreaNodeById, getAreaSnagRiskMult,
} from './types/WorldMap.js';

// Region Map (지역 상세 타일맵)
export type {
  RegionTerrain, RegionMapPoi, RegionMapData, EdgeDir,
  RegionMapLinks, RegionMapNode, RegionMapGraph,
} from './types/RegionMap.js';
export {
  TERRAIN_BY_CHAR, OPPOSITE_EDGE, SOKCHO_MAP_GRAPH, BUSAN_MAP_GRAPH,
  REGION_MAP_GRAPHS, getRegionMapNode,
} from './types/RegionMap.js';
