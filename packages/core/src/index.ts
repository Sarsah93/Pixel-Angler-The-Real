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

// DB Schema
export { FISH_DATABASE, getFishById, getFishBySpotType, getFishByMonth } from './db-schema/FishDatabase.js';
export type { FishSpecies, FishRarity } from './db-schema/FishDatabase.js';
export { ROD_DATABASE, REEL_DATABASE, LINE_DATABASE, FLOAT_DATABASE, HOOK_DATABASE, getRodById, getReelById, getLineById, getFloatById } from './db-schema/GearSpecs.js';
export { SPOT_DATABASE, getSpotById, getSpotsByRegion, getSpotsByType } from './db-schema/SpotDatabase.js';
export { BAIT_DATABASE, getBaitById, getForagableBaits } from './db-schema/BaitDatabase.js';

// Simulation
export { calculateTideInfo, evaluateFishingTide } from './simulation/TideCalculator.js';
export { calculateBiteChance, pickFishByWeight, generateFishSize } from './simulation/FishBiteEngine.js';
export type { BiteCalculationResult, BiteFactors } from './simulation/FishBiteEngine.js';
export { updateLineTension, getLineTensionRatio, getEffectiveDragKg, getTensionDangerLevel, getRetrieveSpeedMps } from './simulation/LinePhysics.js';
export type { LineState } from './simulation/LinePhysics.js';
export { calculateCast } from './simulation/CastingModel.js';
export type { CastInput, CastResult } from './simulation/CastingModel.js';
export { evaluateFishingSafety, isGoldenHour, isNighttime, buildFishingEnvironment, getWindDirectionLabel } from './simulation/WeatherModel.js';

// API Clients
export { PublicDataClient } from './api-client/PublicDataClient.js';
export { WeatherApiClient } from './api-client/WeatherApiClient.js';
export { OceanApiClient, TIDE_STATION_CODES } from './api-client/OceanApiClient.js';

// Utils
export { getApproxLunarDay, getLunarDayDisplay } from './utils/LunarCalendar.js';
export { getDistanceBetweenCoordinates } from './utils/GeoUtils.js';
