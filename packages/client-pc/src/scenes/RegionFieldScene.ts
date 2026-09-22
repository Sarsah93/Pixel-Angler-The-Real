/**
 * @file RegionFieldScene.ts
 * @description 지역 상세 탑다운 필드 씬 — 실제 지형 지도 기반 타일맵
 *
 * `tools/build_region_maps.py`가 실제 지형 지도(PNG)를 색상 분류해 생성한
 * 타일 그리드 JSON(`public/data/<region>/<mapId>.json`)을 로드하여
 * 2D 픽셀 탑다운 필드로 렌더링한다.
 *
 * 핵심 기능:
 *  - 지형 타일 렌더링 (바다/육지/건물/잔디) — RenderTexture로 1회 베이킹
 *  - 충돌: 바다·건물 타일은 이동 불가 (병합된 정적 바디)
 *  - 맵 간 엣지 전환: 그래프(`SOKCHO_MAP_GRAPH`) 연결에 따라 인접 맵으로 이동
 *  - 바다 인접 시 낚시 캐스팅 액션 (좌클릭 차지 → 캐스팅 연출)
 *  - POI 마커 표시 및 근접 상호작용 힌트 (세부 구현 추후)
 *
 * 씬 전환: WorldMapScene에서 진입, ESC로 복귀 (top-level 씬).
 * 맵 이동은 scene.restart(데이터 전달) 방식.
 */

import Phaser from 'phaser';
import {
  CHAR_CELL, CHAR_FOOT_Y, CHAR_SCALE, characterOf, type CharRole,
  isFieldActive, type MpActivity, mpTimeSlot, mpWorldSeed,
  MP_TRADE_RANGE_PX, MP_TRADE_REASON_KO, type MpTradeState, type MpProfile, type MpPeer,
  // 149차 — 구멍치기(테트라포드·사석 틈)
  type HoleSpotInfo, type StorySpotKind,
  holeKindOfBreakwaterClass, evaluateHoleSpot, holeSlipChance, holeGearWarning,
} from '@tra/core';
import { openContextMenu } from '../ui/ContextMenu.js';
import { PeerInfoPanel } from '../ui/PeerInfoPanel.js';
import { TradePanel } from '../ui/TradePanel.js';
import { CharacterSprite, ensureCharSheet, charFrameName } from '../ui/CharacterSprite.js';
import { NuisanceField } from '../ui/NuisanceField.js';
import { ensureBuildingVariant } from '../ui/BuildingVariant.js';
import type { MarineNuisance } from '@tra/core';
import { RegionLight,
  REGION_MAP_GRAPHS,
  getRegionMapNode,
  OPPOSITE_EDGE,
  TERRAIN_BY_CHAR,
  RegionMapData,
  RegionMapGraph,
  RegionMapNode,
  RegionTerrain,
  EdgeDir,
  launchCast,
  stepCast,
  simulateCastTrajectory,
  solveCastPower,
  CastProjectile,
  WindVector,
  DEFAULT_ANGLER_STATS,
  computeZoneMaxDepth,
  RegionDepthProfile,
  depthAtDistance,
  findDepthAnchor,
  kstHour,
  calculateTideInfo,
  computeFeedingActivity,
  feedingRegionProfileOf,
  MapObject,
  effectiveObjects,
  canPlaceAt,
  PLACEMENT_DEFS,
  PlacementDef,
  HOMETOWN_OBJECTS,
  HOMETOWN_SPAWN,
  RegionMeta,
  RegionPoi,
  RegionRoad,
  RegionPatch,
  SeamlessRegionDef,
  seamlessRegionOf,
  getStatusEffect,
  computeCastWeather, castScatterRadius, applyCastScatter, castWeatherLabelKo,
  type CastWeatherEffect,
  type VitalsActivity,
} from '@tra/core';
import { SeamlessChunks, type OccluderObj, PROP_DEFS, propFootprint, type PropDef } from './SeamlessChunks.js';
import { ForageSystem } from './field/ForageSystem.js';
import { AmbientNpcSystem, StoryNpcActor, type NpcFieldHost } from './field/FieldNpcSystem.js';
import { TrapFieldSystem } from './field/TrapFieldSystem.js';
import { TrapDeployPanel } from '../ui/TrapDeployPanel.js';
import { StoveFieldSystem } from './field/StoveFieldSystem.js';
import { StoveDeployPanel } from '../ui/StoveDeployPanel.js';
import { CookingPanel } from '../ui/CookingPanel.js';
import { CookingStore } from '../store/CookingStore.js';
import { LicensePanel } from '../ui/LicensePanel.js';
import { SkillTreePanel } from '../ui/SkillTreePanel.js';
import { JournalPanel } from '../ui/JournalPanel.js';
import { addPixelIcon } from '../ui/PixelIcon.js';
import type { MiniMarker, QuestTrackerEntry } from '../ui/RegionHud.js';
import { TextInput } from '../ui/TextInput.js';
import { MonologuePanel, OPENING_MONOLOGUE } from '../ui/MonologuePanel.js';
import { DialoguePanel, type DialogueSceneRequest } from '../ui/DialoguePanel.js';
import { GeneralMeetingPanel } from '../ui/GeneralMeetingPanel.js';
import { StoryStore } from '../store/StoryStore.js';
import { storyActionScene, storyActionSpec } from '../store/StoryActionRegistry.js';
import { questSceneFor, type SceneExtra } from '../data/QuestScenes.js';
import { loadSettings } from './SettingsScene.js';
import { MultiplayerClient } from '../net/MultiplayerClient.js';
import { STORY_NPC_PLACEMENTS, STORY_PLACES, STORY_FIELD_TRIGGERS, type StoryNpcPlacement, type StoryFieldTrigger } from '../data/StoryNpcs.js';
import { getStoryNpc, validateStoryQuests, validateStoryChoices, validateLicenseStoryRoutes, getSkillById, profScale, gearFaultChance, GEAR_REF_PRICE, gearUsable, GEAR_FAULTS,
  STORY_QUESTS, getStoryQuest, narrativeOf, nextObjectiveIndex, objectiveTarget, objectiveHowToKo, getDayJob, getRegionById, WORLD_NODE_DATABASE,
  type StoryQuestDef, type QuestGuideTarget, type GuideNames } from '@tra/core';
import { FullMapPanel } from '../ui/FullMapPanel.js';
import { MapPinStore } from '../store/MapPinStore.js';
import { buildItemWikiCatalog } from '../data/WikiCatalog.js';
import { playCollapse, type CollapseKind } from '../ui/CollapseOverlay.js';
import { TUNING, getTrapById, MP_CHAT_MAX_LEN, type RegionFishFarms } from '@tra/core';
// 147차 — 위판(경매 현장). 구매자 측 AuctionEngine과 방향이 반대다(ConsignmentAuction 헤더 참조).
import { buildConsignmentLots, isConsignmentOpen, openConsignmentSession, type ConsignInput, type ConsignmentSettlement } from '@tra/core';
import { AuctionHousePanel } from '../ui/AuctionHousePanel.js';
import { tilesetPathOf } from '../data/TilesetManifest.js';
import { TrafficSystem } from './TrafficSystem.js';
import { TILESET_MANIFEST } from '../data/TilesetManifest.js';
import {
  openMapEditor, closeMapEditor, isMapEditorOpen, mapEditorState, setMapEditorStatus,
  rotateEditorPlacement, flipEditorPlacement, toggleEditorOverlap,
} from '../dev/MapEditorPanel.js';
import { GameState } from '../store/GameState.js';
import { characterLook } from '../data/EquipOutfit.js';
import { registerNames } from '../i18n/I18n.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { RegionHud } from '../ui/RegionHud.js';
import { StoryCinematicPanel, type CineActor, type CineDir, type CineScript } from '../ui/StoryCinematicPanel.js';
import { CINE_M1_ICE_DROP, CINE_M1_OKSEON_STALL, CINE_M1_YEONGGEUMJEONG, CINE_N186_LEDGER, CINE_N186_REPORT, CINE_N186_WATCH } from '../data/StoryCinematics.js';
import { FieldEventManager } from '../ui/FieldEventManager.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { ItemDetailPanel } from '../ui/ItemDetailPanel.js';
import { StatusPanel } from '../ui/StatusPanel.js';
import { EquipmentPanel } from '../ui/EquipmentPanel.js';
import { HelpLibraryPanel } from '../ui/HelpLibraryPanel.js';
import { UtilizationPanel, UtilizationTab } from '../ui/UtilizationPanel.js';
import { CoolerPanel } from '../ui/CoolerPanel.js';
import { BikeComposite, RiderDir } from '../ui/BikeComposite.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { ConfirmDialog, QuantityDialog } from '../ui/Dialogs.js';
import { AdvancedCraftPanel } from '../ui/AdvancedCraftPanel.js';
import { paintHudPanel, paintTitlePlate } from '../ui/HudPanelStyle.js';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from '../ui/DraggablePanel.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { CoolerStore } from '../store/CoolerStore.js';
import { DiscoveryStore } from '../store/DiscoveryStore.js';
import { BuildingKind, BUILDING_LABEL, BUILDING_KIND_CYCLE, SHOP_CATALOG, ShopEntry } from '../data/ShopCatalog.js';

interface RegionFieldInit {
  region: string;
  mapId?: string;
  /** 진입 엣지 (이 엣지를 통해 들어옴 → 해당 엣지 근처에서 스폰) */
  entryEdge?: EdgeDir | null;
  /** 진입 엣지 상의 상대 위치 (0~1) */
  entryT?: number;
}

/** 과증식 대발생 주기 (145차) — 이 시간마다 배치가 새로 굴러간다(표류 되감기 상한도 여기서 나온다) */
const NUISANCE_SLOT_MS = 6 * 3_600_000;

// ── 렌더/전환 상수 ──────────────────────────────────
/**
 * 타일 렌더 크기(px). legacy(손그림) 맵 = 20. **심리스 = 32**(101차 후속 — Kenney 16px 지면
 * 타일의 정수 2배 = 픽셀 보존. 사용자 결정 2026-08-28). init()에서 모드에 따라 확정한다.
 */
let TR = 20;
const EDGE_MARGIN = 0;      // 최외곽 타일에 닿아야 전환 (과거 2 → 인식 범위가 너무 넓었음)
const SPAWN_INSET = 4;      // 전환 후 스폰 시 엣지에서 안쪽으로 들여쓸 타일 수

// ── 지형 색상 팔레트 (Traveler's Rest 톤) ──────────────
const COL = {
  water: 0x4a86b0, waterAlt: 0x437ea8, shore: 0x74add0,
  land: 0xbfae82, landAlt: 0xb7a578, beach: 0xd9c99b,
  grass: 0x7ba352, grassAlt: 0x729950,
  buildFill: 0xa6805c, buildTop: 0xba9268, buildEdge: 0x6f523a,
};

export class RegionFieldScene extends Phaser.Scene {
  private region!: string;
  private mapId!: string;
  private entryEdge?: EdgeDir | null;
  private entryT = 0.5;

  private graph?: RegionMapGraph;
  private node!: RegionMapNode;
  private mapData!: RegionMapData;

  // ── OSM 심리스 단일 맵 (OSM_TILEMAP_SPEC — 청크 스트리밍) ──
  /** 이 지역이 심리스 모드로 열렸는가 (seamlessRegionOf 등록 + ACTIVE_REGION_MODE) */
  private seamlessDef?: SeamlessRegionDef;
  private get seamless(): boolean { return !!this.seamlessDef; }
  /** 청크 스트리밍 베이킹 + 근접 충돌 관리자 */
  private chunks?: SeamlessChunks;
  /** 주행 차량 (심리스 전용) */
  private traffic?: TrafficSystem;
  /** POI 상점 프리팹 충돌 바디 (심리스 전용 — 청크 walls와 별도) */
  private poiWalls?: Phaser.Physics.Arcade.StaticGroup;
  /** 현재 야간 여부 (setupAtmosphere가 갱신 — POI 발광 판단) */
  private isNightNow = false;
  /** dev 편집기 — 프롭 풋프린트 미리보기 격자 */
  private editPreviewG?: Phaser.GameObjects.Graphics;
  /** dev 편집기 — 호버 고스트(선택 타일/오브젝트 실물 미리보기 — 회전·반전 반영, 106차-b) */
  private editGhost?: Phaser.GameObjects.Image;
  private regionMeta?: RegionMeta;
  /** OSM POI 전체 (pois.json — RegionPoi 스키마) */
  private regionPois: RegionPoi[] = [];
  /** POI 문(door) 타일 — 앵커가 건물(#) 안이면 최근접 r/. 타일 (인덱스 = regionPois) */
  private poiDoors: { x: number; y: number }[] = [];
  /** 청크 키("cc,cr") → 그 청크에 속한 POI 인덱스 목록 */
  private poiByChunk = new Map<string, number[]>();
  /** 상주 청크의 POI 마커 오브젝트 (청크 키 → 오브젝트들) */
  private poiObjects = new Map<string, Phaser.GameObjects.GameObject[]>();
  /**
   * 캐릭터를 가릴 수 있는 건물 프리팹 (145차 — 건물 뒤로 들어가면 반투명).
   * 청크 수명과 같이 간다(상주 해제 시 함께 버린다).
   */
  private occludersByChunk = new Map<string, Phaser.GameObjects.Image[]>();
  /** 지금 반투명 상태인 프리팹 — 이력(hysteresis)에 쓴다 */
  private faded = new Set<OccluderObj>();
  private occludeAt = 0;
  /** 차도 중심선 벡터 (roads.json) — 차선·중앙선 마킹 */
  private regionRoads: RegionRoad[] = [];
  /** dev 편집 패치 (patch.json — 타일/프롭/지붕 오버라이드). 편집기가 수정·저장 */
  private regionPatch: RegionPatch = { tiles: [], props: [], roofs: {} };
  /** 편집기 — 드래그 페인트 중 (pointerup에 스트로크 확정) */
  private editPainting = false;
  /** 현재 스트로크의 변경 타일 (재베이킹 대상) */
  private editDirty = new Map<number, { c: number; r: number }>();
  /** 되돌리기 스택 — 스트로크 단위 [타일 idx → 이전 문자] (+ 프롭 스냅샷) */
  private editUndo: { tiles: Map<number, string>; props?: RegionPatch['props']; roofs?: RegionPatch['roofs']; roads?: RegionRoad[]; tileTex?: RegionPatch['tileTex'] }[] = [];
  /** 스트로크 시작 시점의 타일 그림 오버라이드 스냅샷 (되돌리기용 — 106차) */
  private editTexPrev: RegionPatch['tileTex'] | null = null;
  /** 도로 툴 — 드래그 중인 정점 [도로, 정점] */
  private editRoadDrag: { ri: number; pi: number } | null = null;
  /** 새 도로 그리기 — 진행 중 폴리라인 정점 (Enter/재클릭 확정, 우클릭 = 마지막 취소) */
  private editRoadNewPts: [number, number][] = [];
  /** 차량 충돌 넉백 (ms 시각·속도) · 재충돌 무적 */
  private knockUntil = 0;
  private knockVx = 0;
  private knockVy = 0;
  private hitCooldownUntil = 0;
  /** 허기·수분 고갈 경고 재표시 시각 (125차 — 30초 간격) */
  private starveWarnAt = 0;
  /** 기절·사망 연출 진행 중 — 이동·상호작용 전면 차단 (126차 P4) */
  private collapsing = false;
  /** 연출 오버레이 정리자 (씬 전환·재시작 시 잔상 방지) */
  private collapseCleanup?: () => void;
  private editStrokePrev = new Map<number, string>();

  private cols = 0;
  private rows = 0;
  private worldW = 0;
  private worldH = 0;
  private terrain: RegionTerrain[][] = [];
  private blocked: boolean[][] = [];

  // 플레이어
  private playerBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private playerSprite!: Phaser.GameObjects.Image;
  private charSprite?: CharacterSprite;
  /** 138차 — 과증식 해양생물(해파리·불가사리) 필드 */
  private nuisance?: NuisanceField;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly PLAYER_DISPLAY_H = 52;
  private readonly PLAYER_FOOT_OFFSET = 9;
  /**
   * 접지 보정 — man 스프라이트 하단의 투명 여백 때문에 발이 그림자보다 위에 떠
   * 보이던 문제를 스프라이트만 아래로 내려 보정한다 (그림자/충돌 바디는 불변).
   */

  private isTransitioning = false;
  /** 맵 JSON 로드 실패로 안내 화면만 띄운 상태 — update()가 필드 오브젝트를 만지면 안 된다 */
  private bootFailed = false;

  // ESC 일시정지 메뉴
  private isPaused = false;
  private pauseMenu?: Phaser.GameObjects.Container;
  private pauseSelIndex = 0;
  private pauseItems: { label: string; action: () => void }[] = [];
  private pauseRowBgs: Phaser.GameObjects.Graphics[] = [];

  // HUD
  private hud?: RegionHud;
  /** 개인 전용 컷씬 재생 중 — HUD/필드 입력을 숨기고 presence에는 바쁨을 보낸다. */
  private cinematicActive = false;
  private cinematic?: StoryCinematicPanel;
  /** 보일링/스쿨링 필드 이벤트 매니저 */
  private fieldEvents?: FieldEventManager;
  /** 피딩타임 활성도 (이벤트 발생 확률 입력 — 60초 주기 갱신) */
  private fieldFeeding = 1;

  // ── 팝업 스택 (ESC는 최상단부터 닫음) ──
  private popupStack: { panel: Phaser.GameObjects.Container; close: () => void }[] = [];
  // ── 155차 — 퀘스트 목표 화살표 가이드 + 「지금 할 일」 추적기 + 전체 지도 ──
  private questGuideG?: Phaser.GameObjects.Graphics;
  private questGuideLbl?: Phaser.GameObjects.Text;
  private questGuideAt = 0;
  private questTargetPos: { x: number; y: number; label: string } | null = null;
  private guideItemNames = new Map<string, string>();
  private fullMapClose?: () => void;
  private lastMiniMarkers: MiniMarker[] = [];
  /** 155차 — 전체 지도 핀 화살표(청록) */
  private pinArrowG?: Phaser.GameObjects.Graphics;
  private pinArrowLbl?: Phaser.GameObjects.Text;
  // 단축키 토글용 패널 참조
  private invPanel: InventoryPanel | null = null;
  private statusPanel: StatusPanel | null = null;
  private equipPanel: EquipmentPanel | null = null;
  /** 도움말 라이브러리 (116차 — F1 / 우하단 단축키 버튼) */
  private helpPanel: HelpLibraryPanel | null = null;
  private utilPanel: UtilizationPanel | null = null;
  private coolerPanel: CoolerPanel | null = null;
  private shopPanel: ShopPanel | null = null;

  // ── 건물(상점) ──
  private buildings: { x: number; y: number; kind: BuildingKind }[] = [];
  private nearBuilding: { x: number; y: number; kind: BuildingKind } | null = null;

  // ── 홈타운(집) — 오브젝트 인스턴스 + 칸 단위 설치 모드 (HOMETOWN_HOME_SPEC) ──
  /** 유효 오브젝트 (초기 배치 − removed + moved + placed) */
  private homeObjects: MapObject[] = [];
  /** 오브젝트 스프라이트 (instanceId → 표시 오브젝트들) */
  private homeObjSprites = new Map<string, Phaser.GameObjects.GameObject[]>();
  private nearObject: MapObject | null = null;
  /** 인-맵 채집(해루질)·어장·통발 필드 시스템 (121차) */
  private forage?: ForageSystem;
  /** 166차 — 퀘스트 없는 마을 사람(결정적 배치·자율 배회) */
  private ambientNpcs?: AmbientNpcSystem;
  private trapField?: TrapFieldSystem;
  /** 154차 불요리 — 화구 조합 설치물(탑다운 [F] 조리) */
  private stoveField?: StoveFieldSystem;
  /** 면허(L) · 스킬(K) · 일지(J) 팝업 (122차) */
  private licensePanel: LicensePanel | null = null;
  private skillPanel: SkillTreePanel | null = null;
  private journalPanel: JournalPanel | null = null;
  /** 지역 타이틀 명패 — 로케일 전환 시 텍스트 폭이 바뀌므로 다시 그린다 (122차) */
  private titleTxt?: Phaser.GameObjects.Text;
  private titlePlateG?: Phaser.GameObjects.Graphics;
  private localeHandler?: () => void;
  /** 설치 모드 상태 (아이템 사용 → 그리드 프리뷰 → 클릭 설치) */
  private placing: { def: PlacementDef; itemId: string } | null = null;
  private placeG?: Phaser.GameObjects.Graphics;
  /** '타이틀 화면' 미저장 경고 1회 무장 (한 번 더 선택 시 이동) */
  private titleConfirmArmed = false;

  // ── 자전거 (R 승·하차 — 이동 속도 2배, GameState.isMounted로 씬 간 유지) ──
  private bike?: BikeComposite;

  /** 달리기 중인가 (144차 — Shift 홀드 + 방향키). `tickVitals`가 활동 종류로 소비한다 */
  private running = false;
  /** 숨참 안내 스로틀 — 피로도 게이트에 걸렸을 때 로그를 도배하지 않게 */
  private runGateWarnAt = 0;

  // ── 대기/조명/날씨 (2026-07-20) ──
  /** 화면 고정 빗줄기 풀 */
  private rainDrops: { obj: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  /** 화면 고정 안개 구름 (수평 드리프트 — 픽셀 구름 텍스처) */
  private fogBlobs: { obj: Phaser.GameObjects.Image; speed: number }[] = [];
  /** 화면 고정 눈송이 풀 */
  private snowFlakes: { obj: Phaser.GameObjects.Arc; speed: number; sway: number }[] = [];
  /** 우박 파티클 풀 (진눈깨비에 혼재 — 빠른 낙하 + 지면 튐) */
  private hailStones: { obj: Phaser.GameObjects.Arc; speed: number; drift: number }[] = [];
  /** 지면 물파문 스폰 누적 타이머 (ms) */
  private rainSplashAcc = 0;
  /** 현재 강수 종류 — 물파문/연출 게이트 */
  private precipKind: 'none' | 'rain' | 'shower' | 'sleet' = 'none';

  /** 이동/캐스팅을 차단해야 하는 UI 상태 (일시정지 or 팝업 열림 or 쓰러짐 연출) */
  private get uiBlocked(): boolean {
    // 145차 — 채팅 입력 중에는 이동·상호작용을 멈춘다(글자를 치다 캐릭터가 걸어가면 안 된다)
    return this.isPaused || this.collapsing || this.popupStack.length > 0 || !!this.hud?.isComposing || this.cinematicActive;
  }

  /**
   * 팝업 버튼 클릭이 같은 프레임에 씬 pointerdown으로 흘러
   * 캐스팅 시도("물가에서 던지세요" 힌트)로 새는 것을 방지하는 유예 시각.
   */
  private suppressClickUntil = 0;

  // 낚시 캐스팅
  private nearWater = false;
  /**
   * 149차 — 발밑 구멍치기 자리. 테트라포드 피복(단면 2)·사석(3) 위에 서 있을 때만 값이 있다.
   * 좌클릭을 **짧게 탭**하면 구멍치기, 꾹 누르면 종전대로 캐스팅 차지다.
   */
  private holeSpot: HoleSpotInfo | null = null;
  /** 현재 구멍 타일 (시드·로그용) */
  private holeTile: { c: number; r: number } | null = null;
  private charging = false;
  /** 좌클릭을 누른 시각 — 구멍 위에서 탭/홀드를 가르는 기준 */
  private chargeDownAt = 0;
  private chargePower = 0;
  private chargeBar?: Phaser.GameObjects.Graphics;
  private castBusy = false;

  // 3D 탄도 캐스팅 비행 상태 (CastingPhysicsEngine)
  private castProj: CastProjectile | null = null;
  private castShadow?: Phaser.GameObjects.Ellipse;
  private castBobber?: Phaser.GameObjects.Arc;
  private castLineG?: Phaser.GameObjects.Graphics;
  private aimG?: Phaser.GameObjects.Graphics;
  private lastAimDir: { x: number; y: number } = { x: 1, y: 0 };
  /** 이번 캐스팅의 날씨 계수 (127차) — 착수 산포·1인칭 인계에 쓰고 착수 후 비운다 */
  private castWeatherEff?: CastWeatherEffect;
  /** 조준 홀드 가이드(127차 P6) — 같은 방향을 이만큼 유지하면 필요 파워 눈금이 뜬다 */
  private aimHoldSince = 0;
  private aimHoldDir: { x: number; y: number } = { x: 1, y: 0 };
  /** 역산된 필요 파워 (0~1) · null = 최대 파워로도 사거리 초과 */
  private aimGuidePower: number | null = null;
  private aimGuideReady = false;
  /** 캐스팅 비행 중 카메라가 채비를 좇는 중인가 (127차 P6) */
  private castCamFollow = false;

  // UI
  private promptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RegionFieldScene' });
  }

  init(dataIn: RegionFieldInit): void {
    // 같은 Scene 인스턴스의 restart/start에서는 Phaser가 init과 create 사이에
    // 이전 display list를 정리한다. 이 짧은 구간에 update가 한 번 들어오면
    // 이전 Text/RenderTexture를 새 지역 데이터로 갱신하려다 폐기된 Frame을
    // 참조할 수 있으므로, 새 create가 준비될 때까지 필드 루프를 잠근다.
    this.bootFailed = true;
    this.region = dataIn.region;
    this.graph = REGION_MAP_GRAPHS[this.region];
    // 심리스 모드 판정 — 등록 지역이면 맵 그래프(엣지 전환)를 무시하고 단일 맵으로 연다.
    // dataIn.mapId(구역별 fieldMapId)는 심리스에서 스폰 다중화 전까지 무시 (스펙 §12-2 후속).
    this.seamlessDef = seamlessRegionOf(this.region);
    TR = this.seamlessDef ? 32 : 20;
    this.mapId = this.seamlessDef
      ? `${this.seamlessDef.dataRegion}_seamless`
      : (dataIn.mapId ?? this.graph!.entryMapId);
    this.entryEdge = dataIn.entryEdge ?? null;
    this.entryT = dataIn.entryT ?? 0.5;
    // 이전 create의 자원은 해당 create가 등록한 shutdown 콜백이 소유한다.
    // 여기서 `this.chunks`를 즉시 파괴하면 아직 이전 display list가 한 프레임 렌더 중일 수 있고,
    // 더 나쁘게는 이전 shutdown 콜백이 새 create의 `this.chunks`를 잡아 속초 청크를 파괴할 수 있다.
    // 따라서 init에서는 참조를 갈아끼우지 않고, 세대별 로컬 참조를 shutdown에서 정리한다.
    this.regionMeta = undefined;
    this.regionPois = [];
    this.poiDoors = [];
    this.poiByChunk = new Map();
    this.poiObjects = new Map();
    this.occludersByChunk = new Map();
    this.faded = new Set();
    // 상태 초기화 (scene.restart 대비)
    this.isTransitioning = false;
    // 쓰러짐 연출은 씬을 넘어가지 않는다 — 재진입 시 남아 있으면 조작이 영구히 잠긴다
    this.collapseCleanup?.();
    this.collapseCleanup = undefined;
    this.collapsing = false;
    this.castCamFollow = false;
    this.charging = false;
    this.chargePower = 0;
    this.castBusy = false;
    this.isPaused = false;
    this.pauseMenu = undefined;
    this.pauseSelIndex = 0;
    this.pauseItems = [];
    this.pauseRowBgs = [];
    this.hud = undefined;
    // 씬 재시작 때 이전 디스플레이 리스트는 Phaser가 파괴하지만, 필드 씬의
    // 지연 생성 UI 참조는 클래스 필드에 남는다. 특히 퀘스트 화살표 라벨은
    // 다음 update()에서 setText()를 호출하므로, 파괴된 CanvasTexture의 Frame을
    // 다시 갱신해 `drawImage` 예외를 만들 수 있다. 새 create 세대는 항상 새 UI를
    // 만들도록 참조와 관련 상태를 함께 초기화한다.
    this.questGuideG = undefined;
    this.questGuideLbl = undefined;
    this.pinArrowG = undefined;
    this.pinArrowLbl = undefined;
    this.questGuideAt = 0;
    this.questTargetPos = null;
    this.guideItemNames.clear();
    this.fullMapClose = undefined;
    this.lastMiniMarkers = [];
    this.titleTxt = undefined;
    this.titlePlateG = undefined;
    this.chargeBar = undefined;
    this.castLineG = undefined;
    this.placeG = undefined;
    this.editGhost = undefined;
    this.editPreviewG = undefined;
    this.popupStack = [];
    this.invPanel = null;
    this.statusPanel = null;
    this.equipPanel = null;
    this.utilPanel = null;
    this.shopPanel = null;
    this.buildings = [];
    this.nearBuilding = null;
    this.homeObjects = [];
    this.homeObjSprites = new Map();
    this.nearObject = null;
    this.placing = null;
    this.placeG = undefined;
    this.titleConfirmArmed = false;
    this.castProj = null;
    this.castShadow = undefined;
    this.castBobber = undefined;
    this.castLineG = undefined;
    this.aimG = undefined;
    this.rainDrops = [];
    this.fogBlobs = [];
    this.snowFlakes = [];
    this.hailStones = [];
    this.rainSplashAcc = 0;
    this.precipKind = 'none';
  }

  preload(): void {
    const key = `rmap_${this.mapId}`;
    if (this.seamlessDef) {
      // 심리스 — 단일 seamless.json + OSM POI + 지역 메타 (스펙 §1 산출물)
      if (!this.cache.json.has(key)) {
        this.load.json(key, `${this.seamlessDef.dataDir}/seamless.json`);
      }
      const dr = this.seamlessDef.dataRegion;
      if (!this.cache.json.has(`rpois_${dr}`)) {
        this.load.json(`rpois_${dr}`, `${this.seamlessDef.dataDir}/pois.json`);
      }
      if (!this.cache.json.has(`rmeta_${dr}`)) {
        this.load.json(`rmeta_${dr}`, `${this.seamlessDef.dataDir}/meta.json`);
      }
      if (!this.cache.json.has(`rroads_${dr}`)) {
        this.load.json(`rroads_${dr}`, `${this.seamlessDef.dataDir}/roads.json`);
      }
      // 패치는 build_region_maps가 항상 써 둔다(빈 패치라도) — 로드 실패 = SPA 폴백 pageerror 방지
      if (!this.cache.json.has(`rpatch_${dr}`)) {
        this.load.json(`rpatch_${dr}`, `${this.seamlessDef.dataDir}/patch.json`);
        // 항로표지(114차) — 있는 지역만 (없는 지역에서 로드하면 SPA 폴백 HTML → JSON 파싱 pageerror)
        if (this.seamlessDef.hasLights) this.load.json(`rlights_${dr}`, `${this.seamlessDef.dataDir}/lights.json`);
        // 어촌계 어장 폴리곤 (121차) — hasFishFarms 지역만 (없는 URL = SPA 폴백 pageerror 함정)
        if (this.seamlessDef.hasFishFarms) this.load.json(`rfarms_${dr}`, `${this.seamlessDef.dataDir}/fishfarms.json`);
      }
      // 타일셋 스프라이트 (건물 프리팹·프롭·차량·NPC) — 심리스 전용, 1회 로드
      for (const e of TILESET_MANIFEST) {
        if (!this.textures.exists(e.key)) this.load.image(e.key, e.path);
      }
    } else if (!this.cache.json.has(key)) {
      this.load.json(key, `${this.graph!.dataDir}/${this.mapId}.json`);
    }
    // 실측 연안 수심 프로필 — 그래프에 경로가 등록된 지역만 로드
    // (미등록 지역을 무조건 로드하면 Vite dev SPA 폴백이 index.html을 돌려줘
    //  JSON 파싱 pageerror가 발생한다. 프로필 없으면 그라디언트 폴백.)
    if (this.graph?.depthProfileUrl) {
      const depthKey = `depth_${this.region}`;
      if (!this.cache.json.has(depthKey)) {
        this.load.json(depthKey, `${this.graph.depthProfileUrl}`);
      }
    }
  }

  create(): void {
    // ── 재진입 가드 — Phaser 씬은 1회 생성 후 재사용된다. 직전 지역의 심리스 객체(청크·차량·POI 충돌)가
    //    shutdown 정리 도중 예외로 남으면, legacy 지역(홈타운)에서도 update()가 죽은 RenderTexture에
    //    베이킹을 시도해 "Cannot read properties of null (reading 'drawImage')"가 난다(2026-08-29 리포트).
    //    지역 무관하게 create 시작 시 반드시 비운다.
    this.poiObjects.clear();
    this.occludersByChunk.clear();
    this.faded.clear();
    this.showFieldLabels = loadSettings().showFieldLabels;
    // 멀티 — 세션에 들어와 있으면 위치 알림을 켠다 (싱글이면 아무것도 하지 않는다)
    MultiplayerClient.startPresence();
    this.events.once('shutdown', () => this.clearPeers());
    // 지연 생성 Text — shutdown 때 디스플레이 리스트가 파괴해 캔버스 컨텍스트가 null이 된 채 참조만 남는다
    //   (홈타운 재진입 시 setText → Frame.updateUVs → drawImage null = 사용자 리포트의 실제 스택).
    this.objHintText = undefined;
    // NPC 근접 힌트도 같은 수명 문제를 가진다. 홈타운에서 만든 Text를 속초 씬이
    // 재사용하면 첫 updateNpcHint()의 setText가 파괴된 CanvasTexture를 갱신한다.
    this.npcHintText = undefined;
    // 맵 JSON 로드 실패(서버 순단·404 등) 시 mapData가 캐시에 없다 — 그대로 진행하면
    // 아래 필드 접근에서 TypeError로 create가 중단돼 **에러 표시 없는 검은 화면**이 된다
    // (2026-08-10 전수검사). 안내를 띄우고 메인 메뉴로 안전 복귀한다.
    const loadedMap = this.cache.json.get(`rmap_${this.mapId}`) as RegionMapData | undefined;
    // 심리스 = 그래프 노드 없이 합성 노드(links 없음 → 엣지 전환 자체가 발생하지 않는다)
    const loadedNode = this.seamlessDef
      ? { id: this.mapId, name: this.seamlessDef.name, links: {} } satisfies RegionMapNode
      : (this.graph ? getRegionMapNode(this.graph, this.mapId) : undefined);
    if (!loadedMap || !loadedNode) {
      this.bootFailed = true;
      this.cameras.main.setBackgroundColor(0x101820);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        `맵 데이터를 불러오지 못했습니다 (${this.mapId})\n잠시 후 메인 메뉴로 돌아갑니다`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#d0e8f5',
          align: 'center', lineSpacing: 8,
        }).setOrigin(0.5);
      this.time.delayedCall(2200, () => this.scene.start('MainMenuScene'));
      return;
    }
    this.bootFailed = false;
    this.mapData = loadedMap;
    this.node = loadedNode;
    this.cols = this.mapData.cols;
    this.rows = this.mapData.rows;
    this.worldW = this.cols * TR;
    this.worldH = this.rows * TR;

    // 위치 태그 — 저장 정책(집 침대에서만)의 기준 (HOMETOWN_HOME_SPEC)
    GameState.locationTag = this.region === 'hometown' ? 'hometown' : 'region_field';
    // 홈타운은 실데이터 지역이 아니므로 날씨를 방문마다 랜덤 추첨 (HUD/조명/날씨효과 공유)
    // 145차 — 홈타운 날씨도 세션 공용(1시간 슬롯). 날씨는 피딩 활성도를 통해 이벤트 스케줄까지 좌우한다.
    if (this.region === 'hometown') {
      ExternalDataStore.rerollHometownWeather(mpWorldSeed(
        MultiplayerClient.worldSeed, 'weather', 'hometown', mpTimeSlot(Date.now(), 3_600_000),
      ));
    }

    if (this.seamlessDef) {
      const dr = this.seamlessDef.dataRegion;
      this.regionMeta = this.cache.json.get(`rmeta_${dr}`) as RegionMeta | undefined;
      this.regionPois = (this.cache.json.get(`rpois_${dr}`) as RegionPoi[] | undefined) ?? [];
      // 상호명 영문 등록 (120차 ②) — OSM `name:en` 을 i18n 런타임 사전에 붙인다.
      // 라벨은 Phaser Text 라 훅이 알아서 번역하고, 언어 전환(refreshAll)에도 따라온다.
      // 이미 있는 키(지명·큐레이션 사전)는 덮지 않는다.
      registerNames(
        this.regionPois
          .filter((p) => p.name && p.nameEn)
          .map((p) => [p.name, p.nameEn as string] as const),
      );
      const patch = this.cache.json.get(`rpatch_${dr}`) as Partial<RegionPatch> | undefined;
      // 도로 벡터 — 패치에 오버라이드가 있으면(편집기 도로 툴) roads.json 대신 사용
      this.regionRoads = patch?.roads ?? (this.cache.json.get(`rroads_${dr}`) as RegionRoad[] | undefined) ?? [];
      this.regionPatch = {
        tiles: patch?.tiles ?? [], props: patch?.props ?? [], roofs: patch?.roofs ?? {},
        ...(patch?.roads ? { roads: patch.roads } : {}),
        tileTex: patch?.tileTex ?? [],
      };
      // 패치 타일 오버라이드를 런타임 지형에 반영 (재빌드 없이 F5 반영)
      const rows = this.mapData.terrain.slice();
      for (const [c, r, ch] of this.regionPatch.tiles) {
        if (r < 0 || r >= rows.length || c < 0 || c >= rows[r].length) continue;
        rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1);
      }
      this.mapData = { ...this.mapData, terrain: rows };
      this.editUndo = [];
      this.editDirty.clear();
      this.editPainting = false;
      this.editRoadDrag = null;      // 씬 재사용 — 이전 지역의 드래그/그리기 상태 오염 방지 (함정 23)
      this.editRoadNewPts = [];
    }

    if (this.seamlessDef) this.trimBuildingsOnRoads();
    this.buildTerrainGrid();
    // 홈타운 오브젝트 유효 상태 산출 → 충돌 타일 선반영 (병합 충돌/걷기 판정 공유)
    if (this.region === 'hometown') this.computeHomeObjects();
    if (this.seamlessDef) {
      // ── 심리스: 전맵 베이킹·전맵 충돌 대신 청크 스트리밍 (스펙 §6) ──
      let mapSeed = 2166136261;
      for (let i = 0; i < this.mapId.length; i++) {
        mapSeed = Math.imul(mapSeed ^ this.mapId.charCodeAt(i), 16777619);
      }
      this.chunks = new SeamlessChunks(this, {
        terrainRows: this.mapData.terrain,
        roads: this.regionRoads,
        props: this.regionPatch.props,
        tileTex: this.regionPatch.tileTex ?? [],
        lights: this.seamlessDef.hasLights
          ? ((this.cache.json.get(`rlights_${this.seamlessDef.dataRegion}`) as RegionLight[] | undefined) ?? [])
          : [],
        roofOverrides: this.regionPatch.roofs,
        cols: this.cols, rows: this.rows, tr: TR, seed: mapSeed >>> 0,
        chunkTiles: RegionFieldScene.SEAMLESS_CHUNK_TILES,
        onChunkLoad: (cc, cr) => this.loadChunkPois(cc, cr),
        onChunkUnload: (cc, cr) => this.unloadChunkPois(cc, cr),
      });
      this._walls = this.chunks.walls;
      // POI 상점 프리팹(팝업/횟집) 전용 충돌 — 청크 walls와 별도 그룹 (POI 로드/언로드가 관리)
      this.poiWalls = this.physics.add.staticGroup();
      this.prepareSeamlessPois();
      this.spawnPlayer();
      this.physics.add.collider(this.playerBody, this.poiWalls);
      // 스폰 지점 주변 상주 즉시 확보 (충돌 바디는 로드 즉시 생성 — 낙하/관통 방지)
      this.chunks.update(this.playerBody.x, this.playerBody.y);
      // 주행 차량 — 도로 그래프 우측통행 (101차 후속)
      // 배경 차량은 교차로 판정 오류가 누적될 때 화면을 막지 않도록 과밀을 피한다.
      // 도로 그래프가 커져도 기본 36대 안에서 흐름을 유지한다.
      this.traffic = new TrafficSystem(this, this.regionRoads, TR, 36, this.cols, this.rows, this.trafficSeed());
      // 중요: `this.chunks`를 캡처하지 않으면 다음 restart의 init/create가 먼저 실행된 경우
      // 이전 세대 shutdown 콜백이 새 속초 청크를 파괴한다. 반드시 생성 세대의 객체만 정리한다.
      const ownedChunks = this.chunks;
      const ownedTraffic = this.traffic;
      const ownedPoiWalls = this.poiWalls;
      this.events.once('shutdown', () => {
        ownedTraffic?.destroy();
        ownedChunks?.destroy();
        ownedPoiWalls?.destroy(true);
        if (this.chunks === ownedChunks) this.chunks = undefined;
        if (this.traffic === ownedTraffic) this.traffic = undefined;
        if (this.poiWalls === ownedPoiWalls) this.poiWalls = undefined;
        closeMapEditor();
      });
    } else {
      this.renderTerrain();
      this.buildCollision();
      this.spawnPlayer();
      this.drawPois();
    }
    if (this.region === 'hometown') this.renderHomeObjects();
    this.setupInput();
    this.createHud();
    // 낮/밤 명암 + 건물 조명·네온·가로등 + 날씨(비/안개) 효과
    this.setupAtmosphere();

    // ── HUD 오버레이 (상태 바 / 미니맵 / 퀵슬롯 / 로그·채팅) ──
    this.hud = new RegionHud(this, {
      regionId: this.region,
      mapId: this.mapId,
      terrain: this.terrain,
      cols: this.cols,
      rows: this.rows,
      worldW: this.worldW,
      worldH: this.worldH,
    });
    this.add.existing(this.hud);
    this.hud.pushLog(`[이동] ${this.node.name}에 도착했습니다.`);
    this.initFieldSystems();

    // ── 신규 발견 토스트 — 도감/위키에 처음 등록되는 순간 HUD 로그로 알림 ──
    DiscoveryStore.onNew = (entry, name) => {
      if (entry.kind === 'dish') {
        // 156차 — 요리 도감(레시피 × 주재료) 최초 발견: 로그 + 화면 힌트
        this.hud?.pushLog(`[도감] 새로운 요리를 발견했습니다 — 「${name}」 (N 키 요리 도감)`);
        this.floatingHint(`새로운 요리를 발견했습니다 — 「${name}」`);
        return;
      }
      // 아이템은 위키 카탈로그에 있는 것만 알린다 — 개체형 id(어획물·완성 요리 `inv_catch_*`/`inv_dish_*`)는
      // 카탈로그 밖이라 이름이 없고, 내부 id를 화면에 내면 §8-9 위반이다(156차 실측 — 이 가드 전엔 그대로 찍혔다)
      let shown = name;
      if (entry.kind === 'item') {
        const w = buildItemWikiCatalog().find((x) => x.id === entry.id);
        if (!w) return;
        shown = w.name;
      }
      const kindLabel = entry.kind === 'fish' ? '어종' : entry.kind === 'creature' ? '해양생물' : '아이템';
      this.hud?.pushLog(`[도감] 새로운 ${kindLabel} 발견 — ${shown} (N 키로 확인)`);
    };
    this.events.once('shutdown', () => { DiscoveryStore.onNew = null; });
    this.events.once('shutdown', () => { this.collapseCleanup?.(); this.collapseCleanup = undefined; this.collapsing = false; });

    // ── 보일링/스쿨링 필드 이벤트 (피딩타임 활성도 기반 발생 롤) ──
    this.refreshFieldFeeding();
    this.time.addEvent({ delay: 60_000, loop: true, callback: () => this.refreshFieldFeeding() });
    this.fieldEvents = new FieldEventManager(this, {
      isWaterAt: (c, r) => this.terrainAt(c, r) === 'water',
      tileSize: TR,
      playerPos: () => ({ x: this.playerBody.x, y: this.playerBody.y }),
      pushLog: (msg) => this.hud?.pushLog(msg),
      // 145차 공용 시드 — 같은 세션이면 같은 자리에 같은 보일링이 뜬다
      mapKey: `${this.region}:${this.mapId}`,
      worldSeed: () => MultiplayerClient.worldSeed,
      feedingAt: (atMs) => this.feedingAt(atMs),
    });
    // shutdown 콜백은 다음 restart의 create보다 늦게 실행될 수 있다. 현재 필드를
    // 참조하면 이전 세대의 정리 코드가 새 세대 시스템을 파괴할 수 있으므로,
    // 생성 시점의 객체만 소유·정리한다.
    const ownedFieldEvents = this.fieldEvents;
    const ownedNuisance = this.nuisance;
    this.events.once('shutdown', () => {
      ownedFieldEvents?.destroy();
      ownedNuisance?.destroy();
      if (this.fieldEvents === ownedFieldEvents) this.fieldEvents = undefined;
      if (this.nuisance === ownedNuisance) this.nuisance = undefined;
    });

    // 인벤토리 조작으로 퀵슬롯이 바뀌면 HUD 갱신 (restart 중복 등록 방지)
    this.events.off('inventory-changed');
    this.events.on('inventory-changed', () => {
      this.hud?.refreshQuickslots();
      // 151차 — 착용이 바뀌면 페이퍼돌도 바뀐다(모자·조끼·가방·손에 든 대).
      this.refreshCharacterLook();
    });

    // 1인칭 낚시 뷰(pause+launch)에서 복귀 시: 페이드인 + 캐스팅 상태 정리
    this.events.off('resume');
    this.events.on('resume', () => {
      // 안전망 — 하위 씬(낚시/실내)에서 복귀 시 전환 플래그가 남아 이동이 막히는 일 방지
      this.isTransitioning = false;
      MultiplayerClient.setActivity('field');   // 145차 — 하위 씬에서 돌아오면 다시 필드
      this.cameras.main.fadeIn(300, 0, 10, 20);
      this.restoreCamFollow();   // 127차 — 1인칭에서 돌아오면 카메라를 플레이어로
      this.clearCastFlight();
      this.hud?.refreshQuickslots();
      // 1인칭 씬이 남긴 종료 사유(채비 손실 등) 표시
      const exitMsg = this.registry.get('fp_exit_msg') as string | undefined;
      if (exitMsg) {
        this.registry.remove('fp_exit_msg');
        this.hud?.pushLog(`[낚시] ${exitMsg}`);
        this.floatingHint(exitMsg);
      } else {
        this.hud?.pushLog('[낚시] 필드로 복귀했습니다.');
      }
      // 복귀 직후 클릭이 캐스팅으로 새지 않도록 유예
      this.suppressClickUntil = this.time.now + 400;
    });

    // 우클릭 컨텍스트 메뉴(브라우저 기본) 차단 — 인벤토리 우클릭 액션용
    this.input.mouse?.disableContextMenu();

    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.playerBody, true, 0.14, 0.14);
    this.cameras.main.setBackgroundColor(0x2b3f4d);
    this.cameras.main.fadeIn(280, 0, 10, 20);
    this.maybePlayOpening();
  }

  /**
   * 오프닝 혼잣말 (150차 — 사용자 지시).
   * 캐릭터를 만들고 홈타운에서 **처음** 눈을 뜨는 순간 한 번만. 세이브 플래그로 기억한다.
   */
  private maybePlayOpening(): void {
    if (this.region !== 'hometown') return;
    if (GameState.getFlag('intro.monologue')) return;
    GameState.setFlag('intro.monologue');
    GameState.markDirty();
    // ⚠ `time.delayedCall`로 미루지 않는다 — 홈타운 create()는 재시작으로 다시 돌 수 있고,
    //   그때 타이머가 죽어 **플래그만 켜지고 창은 안 뜬다**(실측). 바로 연다 —
    //   페이드인(280ms)이 딤과 함께 밝아지므로 연출도 어색하지 않다.
    this.openPopup((close) => new MonologuePanel(this, OPENING_MONOLOGUE, close));
  }

  // ═══════════════════════════════════════════════════
  // 지형 그리드 구축
  // ═══════════════════════════════════════════════════
  private buildTerrainGrid(): void {
    this.terrain = [];
    this.blocked = [];
    for (let r = 0; r < this.rows; r++) {
      const trow: RegionTerrain[] = [];
      const brow: boolean[] = [];
      const line = this.mapData.terrain[r] ?? '';
      for (let c = 0; c < this.cols; c++) {
        const t = TERRAIN_BY_CHAR[line[c]] ?? 'land';
        trow.push(t);
        brow.push(t === 'water' || t === 'building');
      }
      this.terrain.push(trow);
      this.blocked.push(brow);
    }
  }

  /** 교통 초기 편성 시드 (145차 — 같은 세션이면 같은 차들로 시작한다) */
  private trafficSeed(): number {
    return mpWorldSeed(MultiplayerClient.worldSeed, 'traffic', `${this.region}:${this.mapId}`, 0);
  }

  private terrainAt(c: number, r: number): RegionTerrain | undefined {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return undefined;
    return this.terrain[r][c];
  }

  private isWalkable(c: number, r: number): boolean {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    return !this.blocked[r][c];
  }

  // ═══════════════════════════════════════════════════
  // 지형 렌더링 (RenderTexture 베이킹)
  // ═══════════════════════════════════════════════════
  /**
   * 바다 타일의 "육지로부터의 거리"(타일 단위) 계산 — 멀티소스 BFS.
   * 수심 그라데이션 렌더의 기준 (거리 멀수록 깊은 색).
   */
  private computeWaterDistance(): number[][] {
    const dist: number[][] = Array.from({ length: this.rows }, () => new Array(this.cols).fill(-1));
    const queue: [number, number][] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.terrain[r][c] !== 'water') { dist[r][c] = 0; queue.push([c, r]); }
      }
    }
    let head = 0;
    while (head < queue.length) {
      const [c, r] = queue[head++];
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
        if (dist[nr][nc] !== -1) continue;
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nc, nr]);
      }
    }
    return dist;
  }

  /** 결정적 2D 값 노이즈 (암초 지대 배치용 — mapId 시드) */
  private static noise2(seed: number, x: number, y: number): number {
    const h = (ix: number, iy: number): number => {
      let n = (seed ^ Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263)) >>> 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(ix, iy) * (1 - sx) + h(ix + 1, iy) * sx;
    const b = h(ix, iy + 1) * (1 - sx) + h(ix + 1, iy + 1) * sx;
    return a * (1 - sy) + b * sy;
  }

  private renderTerrain(): void {
    const texKey = `rmaptex_${this.mapId}`;
    if (!this.textures.exists(texKey)) {
      // 수심 그라데이션(거리 램프): 얕음 → 깊음 [기본색, 체커 보조색]
      const DEPTH_RAMP: [number, number][] = [
        [0x74add0, 0x6da6c9],   // 0: 물가 모래톱
        [0x5e9cc4, 0x5794bd],   // 1: 얕은 연안
        [0x4a86b0, 0x437ea8],   // 2: 중간
        [0x3a6f99, 0x356890],   // 3: 깊음
        [0x2c5a82, 0x275378],   // 4: 더 깊음
        [0x224a6e, 0x1e4366],   // 5: 심해
      ];
      const bucketOf = (d: number): number =>
        d <= 1 ? 0 : d <= 3 ? 1 : d <= 6 ? 2 : d <= 10 ? 3 : d <= 15 ? 4 : 5;

      // mapId 문자열 해시 → 암초 노이즈 시드 (맵마다 다른 암초 배치, 결정적)
      let mapSeed = 2166136261;
      for (let i = 0; i < this.mapId.length; i++) {
        mapSeed = Math.imul(mapSeed ^ this.mapId.charCodeAt(i), 16777619);
      }
      mapSeed = mapSeed >>> 0;

      const waterDist = this.computeWaterDistance();
      const g = this.add.graphics();
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const t = this.terrain[r][c];
          const checker = (c + r) % 2 === 0;
          let color: number;
          if (t === 'water') {
            const d = waterDist[r][c];
            let bucket = bucketOf(d);
            // 암초/여 지대: 노이즈 융기 — 주변보다 얕은 색(단차)으로 도드라짐
            const reefNoise = RegionFieldScene.noise2(mapSeed, c / 3.2, r / 3.2);
            const isReef = d >= 2 && d <= 14 && reefNoise > 0.72;
            if (isReef) bucket = Math.max(0, bucket - 2);
            const ramp = DEPTH_RAMP[bucket];
            color = checker ? ramp[0] : ramp[1];
            g.fillStyle(color, 1);
            g.fillRect(c * TR, r * TR, TR, TR);
            if (isReef) {
              // 수중 바위 점묘 (탑다운에서 비쳐 보이는 여)
              g.fillStyle(0x3d5a52, 0.55);
              g.fillRect(c * TR + 3, r * TR + 5, 6, 4);
              g.fillRect(c * TR + 11, r * TR + 12, 5, 4);
              if (reefNoise > 0.78) {
                g.fillStyle(0x2f4a44, 0.5);
                g.fillRect(c * TR + 7, r * TR + 9, 7, 5);
              }
            } else if (bucket >= 4 && RegionFieldScene.noise2(mapSeed ^ 0x9e37, c / 5, r / 5) > 0.8) {
              // 깊은 곳의 더 어두운 해구 얼룩 (수심 단차 느낌)
              g.fillStyle(0x18344f, 0.4);
              g.fillRect(c * TR + 2, r * TR + 2, TR - 4, TR - 4);
            }
            continue;
          } else if (t === 'grass') {
            color = checker ? COL.grass : COL.grassAlt;
          } else if (t === 'building') {
            color = COL.buildFill;
          } else {
            // 바다에 붙은 육지는 모래사장
            const beach =
              this.terrainAt(c + 1, r) === 'water' || this.terrainAt(c - 1, r) === 'water' ||
              this.terrainAt(c, r + 1) === 'water' || this.terrainAt(c, r - 1) === 'water';
            color = beach ? COL.beach : (checker ? COL.land : COL.landAlt);
          }
          g.fillStyle(color, 1);
          g.fillRect(c * TR, r * TR, TR, TR);
        }
      }
      // 건물 외곽선 + 지붕 하이라이트
      g.lineStyle(2, COL.buildEdge, 1);
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.terrain[r][c] !== 'building') continue;
          if (this.terrainAt(c, r - 1) !== 'building') {
            g.fillStyle(COL.buildTop, 1);
            g.fillRect(c * TR, r * TR, TR, Math.floor(TR * 0.4));
          }
          // 건물 덩어리 경계선
          if (this.terrainAt(c - 1, r) !== 'building') g.lineBetween(c * TR, r * TR, c * TR, r * TR + TR);
          if (this.terrainAt(c + 1, r) !== 'building') g.lineBetween(c * TR + TR, r * TR, c * TR + TR, r * TR + TR);
          if (this.terrainAt(c, r - 1) !== 'building') g.lineBetween(c * TR, r * TR, c * TR + TR, r * TR);
          if (this.terrainAt(c, r + 1) !== 'building') g.lineBetween(c * TR, r * TR + TR, c * TR + TR, r * TR + TR);
        }
      }
      g.generateTexture(texKey, this.worldW, this.worldH);
      g.destroy();
    }
    this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);
  }

  // ═══════════════════════════════════════════════════
  // 충돌 (병합된 정적 바디)
  // ═══════════════════════════════════════════════════
  private buildCollision(): void {
    const walls = this.physics.add.staticGroup();
    this.fillWallRects(walls);
    // 충돌은 spawnPlayer 이후 collider 등록 (playerBody 필요) → 임시 저장
    this._walls = walls;
  }

  /** blocked 그리드 → 행 병합 정적 바디 (초기 빌드/설치 후 재베이크 공용) */
  private fillWallRects(walls: Phaser.Physics.Arcade.StaticGroup): void {
    for (let r = 0; r < this.rows; r++) {
      let cStart = -1;
      for (let c = 0; c <= this.cols; c++) {
        const blocked = c < this.cols && this.blocked[r][c];
        if (blocked && cStart < 0) {
          cStart = c;
        } else if (!blocked && cStart >= 0) {
          const runLen = c - cStart;
          const rect = this.add.rectangle(
            cStart * TR + (runLen * TR) / 2, r * TR + TR / 2,
            runLen * TR, TR, 0x000000, 0
          );
          this.physics.add.existing(rect, true);
          walls.add(rect);
          cStart = -1;
        }
      }
    }
  }

  /** 설치/회수 후 충돌 재베이크 — blocked 재계산 + 기존 그룹 리필 (collider 유지) */
  private rebuildCollision(): void {
    this.buildTerrainGrid();          // 지형 기반 blocked 리셋
    this.applyObjectBlocking();       // 오브젝트 충돌 타일 재반영
    this._walls.clear(true, true);
    this.fillWallRects(this._walls);
  }
  private _walls!: Phaser.Physics.Arcade.StaticGroup;

  // ═══════════════════════════════════════════════════
  // 플레이어 스폰
  // ═══════════════════════════════════════════════════
  private spawnPlayer(): void {
    const { col, row } = this.computeSpawnTile();
    const px = col * TR + TR / 2;
    const py = row * TR + TR / 2;

    this.playerBody = this.physics.add.image(px, py, '__DEFAULT') as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    // 134차 — 스토리: 지역 방문 이벤트 · NPC 배치 · 데이터 무결성(dev)
    GameState.currentRegionId = this.region;
    StoryStore.event({ kind: 'visit', placeKey: `region:${this.region}` });
    MapPinStore.onChange = () => this.refreshQuestMarkers(true);
    this.events.once('shutdown', () => { MapPinStore.onChange = null; });
    StoryStore.onNotify = (m) => {
      this.hud?.pushLog(m);
      // 155차 — 수락·완료·거절은 로그 한 줄로 끝내지 않는다(테스터: "코드-내적 로그로만 주고받는다")
      if (m.startsWith('[할 일]')) this.floatingHint(m.replace(/^\[할 일\]\s*/, ''));
    };
    StoryStore.onActionProgress = (key, step) => this.showActionProgressScene(key, step);
    // 155차 — 획득 토스트(아이콘 + 수량, 우측 페이드). 퀘스트 보상·상점 구매·손질 산출 전부 같은 경로다.
    InventoryStore.onGained = (item, qty) => this.hud?.showItemToast({
      kind: item.bound ? 'quest' : 'item', name: item.name, qty, bound: item.bound, item,
    });
    StoryStore.onCoins = (n, why) => this.hud?.showItemToast({ kind: 'coin', name: `${n > 0 ? '+' : ''}${n.toLocaleString()}원 — ${why}`, qty: 1, iconKey: 'rw_coin' });
    this.events.once('shutdown', () => {
      InventoryStore.onGained = null; StoryStore.onCoins = null; StoryStore.onActionProgress = null;
      this.cinematic?.destroy(); this.cinematic = undefined; this.cinematicActive = false;
      MultiplayerClient.setActivity('field');
    });
    this.placeStoryNpcs();
    this.placeStoryTriggers();
    if (import.meta.env.DEV) {
      const issues = [...validateStoryQuests(), ...validateStoryChoices(), ...validateLicenseStoryRoutes(STORY_QUESTS)];
      if (issues.length) console.warn('[Story] 퀘스트·선택지·자격 경로 DB 무결성', issues);
    }
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(14, 14);

    const feetY = py + this.PLAYER_FOOT_OFFSET;
    // 138차 — 구 외부 출력물(man-idle-*) 축소 배치 폐기. 바닐라 베이스 시트를 정수 x2로 굽는다.
    this.charSprite = new CharacterSprite(this, px, feetY + this.charFootSink, characterLook(), CHAR_SCALE);
    this.playerSprite = this.charSprite.image;
    this.playerSprite.setDepth(20);

    const shadow = this.add.ellipse(px, feetY, this.PLAYER_DISPLAY_H * 0.42, this.PLAYER_DISPLAY_H * 0.12, 0x000000, 0.28)
      .setDepth(19);
    this.registry.set('_rfShadow', shadow);

    this.physics.add.collider(this.playerBody, this._walls);

    // 자전거 합성 레이어 (씬 재시작에도 GameState.isMounted 유지)
    this.bike = new BikeComposite(this);
    this.bike.setVisible(GameState.isMounted);

    this.setupNuisanceField();
  }

  /** 과증식 해양생물 배치 — 계절(월) 기준으로 그 달에 나오는 종만 뜬다 */
  private setupNuisanceField(): void {
    this.nuisance?.destroy();
    this.nuisance = new NuisanceField(this, {
      tile: TR,
      cols: this.cols,
      rows: this.rows,
      isWater: (c, r) => this.terrainAt(c, r) === 'water',
      waterDist: (c, r) => this.chunks?.waterDistAt(c, r) ?? 0,
      playerPos: () => ({ x: this.playerBody.x, y: this.playerBody.y }),
      reeling: () => this.input.activePointer.leftButtonDown(),
      log: (m) => this.hud?.pushLog(m),
      hint: (m) => this.floatingHint(m),
      collect: (nu, sizeCm, weightKg) => {
        if (!this.collectNuisance(nu, sizeCm, weightKg)) return false;
        this.onNuisanceCollected(nu);
        return true;
      },
      month: () => new Date().getMonth() + 1,
    });
    // 맵마다 결정적 배치 — 같은 맵에 다시 오면 같은 자리에서 시작한다
    // 145차 — 세션 공용 시드 + 6시간 주기 대발생 슬롯. 표류는 슬롯 시작부터 되감아 재생한다.
    const slot = mpTimeSlot(Date.now(), NUISANCE_SLOT_MS);
    this.nuisance.spawn(
      mpWorldSeed(MultiplayerClient.worldSeed, 'nuisance', `${this.region}:${this.mapId}`, slot),
      slot * NUISANCE_SLOT_MS,
    );
  }

  /** 수거한 개체를 인벤토리(식품)에 넣는다 */
  private collectNuisance(nu: MarineNuisance, sizeCm: number, weightKg: number): boolean {
    const cull = nu.cullPricePerKg > 0 ? Math.round((nu.cullPricePerKg * weightKg) / 10) * 10 : 0;
    return InventoryStore.addItem({
      id: `inv_nuisance_${nu.id}`,
      name: nu.nameKo,
      icon: '',
      // 170차 — 슬롯·상세는 실사 사진, 필드 렌더는 여전히 core 절차 도트(`nui_*`)다.
      iconTexture: `nuisance_${nu.id}`,
      category: 'food',
      subCategory: nu.kind === 'jellyfish' ? '해파리' : '불가사리',
      basePrice: cull,
      equippable: false,
      speciesId: nu.id,
      lengthCm: sizeCm,
      weightG: Math.round(weightKg * 1000),
    }, 1);
  }

  /** 수거 성공 → 퀘스트 이벤트 + 발견 기록 */
  private onNuisanceCollected(nu: MarineNuisance): void {
    StoryStore.event({ kind: 'cull', speciesId: nu.id });
  }

  /** 셀 하단 여백 보정 — 발이 지면 타일에 닿게 한다 (구 PLAYER_FOOT_SINK 대체) */
  private get charFootSink(): number {
    return (CHAR_CELL - 1 - CHAR_FOOT_Y) * CHAR_SCALE;
  }

  /** 머리 위 라벨(이름표·힌트)과 캐릭터 사이 여백 */
  private static readonly LABEL_GAP = 6;

  /**
   * 발 기준선 → **셀 상단**까지의 오프셋(음수 = 위쪽).
   * ⚠ 머리 꼭대기(`CHAR_HEAD_TOP` = 3행)가 아니라 **셀 상단**을 기준으로 잡는다 —
   *   모자(비니 방울·챙)와 곱슬 머리는 머리 사각형보다 최대 3행 위로 튀어나오므로,
   *   머리 기준으로 라벨을 붙이면 모자 쓴 인물에서 다시 글자가 파묻힌다.
   */
  private get charTopFromFeet(): number {
    return this.charFootSink - CHAR_CELL * CHAR_SCALE;
  }

  /** 플레이어 머리 위 라벨의 하단 y (라벨은 `setOrigin(0.5, 1)` 전제) */
  private get playerLabelY(): number {
    return this.playerBody.y + this.PLAYER_FOOT_OFFSET + this.charTopFromFeet - RegionFieldScene.LABEL_GAP;
  }

  /** 장비·외형이 바뀌면 시트를 다시 굽는다 (장착 변경 → 즉시 반영) */
  refreshCharacterLook(): void {
    this.charSprite?.setConfig(characterLook());
  }

  /** 진입 엣지/기본 진입에 따라 스폰 타일 계산 (걷기 가능 타일 보장) */
  private computeSpawnTile(): { col: number; row: number } {
    // 145차 이어하기 — 서버가 기억한 마지막 자리. 한 번만 쓰고 비운다(맵 이동까지 따라오면 안 된다).
    const rs = MultiplayerClient.resume;
    if (rs && rs.regionId === this.region) {
      MultiplayerClient.resume = null;
      return this.nearestWalkable(Math.floor(rs.x / TR), Math.floor(rs.y / TR));
    }
    // 심리스 = meta.spawn (build_osm_tilemap이 최근접 이동가능 타일로 스냅한 값)
    if (this.seamlessDef) {
      const sp = this.regionMeta?.spawn;
      if (sp) return this.nearestWalkable(sp[0], sp[1]);
      return this.nearestWalkable(Math.floor(this.cols / 2), Math.floor(this.rows / 2));
    }
    if (!this.entryEdge) {
      // 홈타운 = 집 문 앞 스폰 (새 게임/귀가 공통)
      if (this.region === 'hometown') {
        return this.nearestWalkable(HOMETOWN_SPAWN.col, HOMETOWN_SPAWN.row);
      }
      return this.nearestWalkable(Math.floor(this.cols / 2), Math.floor(this.rows / 2));
    }
    // 엣지 진입: 이전 맵에서 나온 상대 위치(entryT)를 유지한 채,
    // 반드시 진입 엣지 근처 밴드 안에서 스폰 (길 이어짐 보장)
    return this.edgeSpawnTile(this.entryEdge, this.entryT);
  }

  /**
   * 진입 엣지 밴드(엣지에서 SPAWN_INSET 타일 이내)에 한정해 스폰 타일을 찾는다.
   * entryT 지점에서 엣지를 따라 좌우(또는 상하)로 벌려가며 탐색하므로,
   * 이전 맵에서 나온 지점과 이어지는 길목 위에 스폰된다.
   */
  private edgeSpawnTile(edge: EdgeDir, t: number): { col: number; row: number } {
    const horizontal = edge === 'N' || edge === 'S';   // 엣지를 따라 col을 움직임
    const alongMax = horizontal ? this.cols : this.rows;
    const center = Math.round(t * alongMax);

    // 엣지에서 안쪽으로 depth칸, entryT에서 along 방향으로 offset칸 순으로 탐색
    for (let offset = 0; offset < alongMax; offset++) {
      for (const sign of offset === 0 ? [1] : [1, -1]) {
        const along = center + sign * offset;
        if (along < 1 || along > alongMax - 2) continue;
        for (let depth = SPAWN_INSET; depth <= SPAWN_INSET + 6; depth++) {
          let c: number, r: number;
          if (edge === 'N') { c = along; r = depth; }
          else if (edge === 'S') { c = along; r = this.rows - 1 - depth; }
          else if (edge === 'W') { c = depth; r = along; }
          else { c = this.cols - 1 - depth; r = along; }
          if (!this.isWalkable(c, r)) continue;
          // 엣지 방향으로 통로가 이어져 있는지 확인 (엣지까지 걷기 가능해야
          // "길 끝에서 이어 들어온" 스폰이 됨). 막혀 있으면 다음 후보로.
          if (this.walkableTowardEdge(c, r, edge, depth)) return { col: c, row: r };
        }
      }
    }
    // 엣지 밴드에서 못 찾으면 기존 나선 탐색 폴백
    const fallbackC = horizontal ? center : (edge === 'W' ? SPAWN_INSET : this.cols - 1 - SPAWN_INSET);
    const fallbackR = horizontal ? (edge === 'N' ? SPAWN_INSET : this.rows - 1 - SPAWN_INSET) : center;
    return this.nearestWalkable(fallbackC, fallbackR);
  }

  /** (c,r)에서 엣지 방향으로 depth칸이 모두 걷기 가능한지 (경계 1칸 직전까지) */
  private walkableTowardEdge(c: number, r: number, edge: EdgeDir, depth: number): boolean {
    for (let d = 1; d <= depth - 1; d++) {
      let cc = c, rr = r;
      if (edge === 'N') rr = r - d;
      else if (edge === 'S') rr = r + d;
      else if (edge === 'W') cc = c - d;
      else cc = c + d;
      if (cc < 0 || cc >= this.cols || rr < 0 || rr >= this.rows) break;
      if (!this.isWalkable(cc, rr)) return false;
    }
    return true;
  }

  /** (c,r)에서 가장 가까운 걷기 가능 타일을 나선형 탐색 (테두리 제외) */
  private nearestWalkable(c0: number, r0: number): { col: number; row: number } {
    const lo = 1, hiC = this.cols - 2, hiR = this.rows - 2;
    const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
    c0 = clamp(c0, lo, hiC); r0 = clamp(r0, lo, hiR);
    if (this.isWalkable(c0, r0)) return { col: c0, row: r0 };
    for (let radius = 1; radius < Math.max(this.cols, this.rows); radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
          const c = c0 + dc, r = r0 + dr;
          if (c >= lo && c <= hiC && r >= lo && r <= hiR && this.isWalkable(c, r)) {
            return { col: c, row: r };
          }
        }
      }
    }
    return { col: c0, row: r0 };
  }

  // ═══════════════════════════════════════════════════
  // 건물 (POI 위치에 종류별 픽셀 도트 건물 배치)
  // ═══════════════════════════════════════════════════
  private drawPois(): void {
    this.buildings = [];
    this.mapData.pois.forEach((poi, i) => {
      const x = poi.col * TR + TR / 2;
      const y = poi.row * TR + TR / 2;
      const kind = BUILDING_KIND_CYCLE[i % BUILDING_KIND_CYCLE.length];

      this.ensureBuildingTexture(kind);
      // 발밑 기준 배치 (건물 하단 = 타일 중앙)
      this.add.image(x, y + 10, `bld_${kind}`).setOrigin(0.5, 1).setDepth(14 + y * 0.001);

      const label = this.add.text(x, y + 14, BUILDING_LABEL[kind], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe9b0', fontStyle: 'bold',
        backgroundColor: '#0a1628cc', padding: { x: 4, y: 1 },
      }).setOrigin(0.5, 0).setDepth(15);
      void label;

      this.buildings.push({ x, y, kind });
    });
  }

  /** 건물 종류별 픽셀 도트 텍스처 생성 (1회 베이킹, 모든 맵 공용) */
  private ensureBuildingTexture(kind: BuildingKind): void {
    const key = `bld_${kind}`;
    if (this.textures.exists(key)) return;

    // 종류별 배색: [벽, 지붕, 간판, 포인트]
    const palette: Record<BuildingKind, [number, number, number, number]> = {
      convenience: [0xe8e4da, 0x3f9e63, 0x2fa84f, 0xffffff],  // 초록 간판 편의점
      mart:        [0xd9d2c2, 0xc25b28, 0xff8a3d, 0xffe066],  // 주황 간판 마트
      market:      [0xcfc4ae, 0xa8433b, 0xd9534f, 0x74add0],  // 붉은 차양 직판장
      restaurant:  [0xc9a877, 0x7d4f2c, 0xb06a3b, 0xffcf6b],  // 목조 식당
      cafe:        [0xe3d5bd, 0x8a6a44, 0xc8a060, 0x6f523a],  // 베이지 카페
      pub:         [0x5c4a6e, 0x33263f, 0x7b5cd6, 0xffd24a],  // 어두운 주점 + 등불
      pharmacy:    [0xeceff2, 0x2f7f5e, 0x4fc38a, 0xff6b6b],  // 흰 벽 + 초록 십자 간판 약국
      daily:       [0xdfe0d4, 0x2e5f9e, 0x3f86d8, 0xffd257],  // 파란 간판 생활용품점(사이소)
    };
    const [wall, roof, sign, accent] = palette[kind];
    const W = 44, H = 42;

    const g = this.add.graphics();
    // 벽체
    g.fillStyle(wall, 1);
    g.fillRect(4, 14, W - 8, H - 14);
    // 지붕 (계단식 도트)
    g.fillStyle(roof, 1);
    g.fillRect(2, 8, W - 4, 8);
    g.fillRect(6, 4, W - 12, 4);
    // 간판 밴드
    g.fillStyle(sign, 1);
    g.fillRect(4, 16, W - 8, 7);
    // 간판 글자 도트 (추상)
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(8, 18, 6, 3);
    g.fillRect(17, 18, 6, 3);
    g.fillRect(26, 18, 6, 3);
    // 문
    g.fillStyle(0x3d2f22, 1);
    g.fillRect(W / 2 - 5, H - 14, 10, 14);
    g.fillStyle(accent, 1);
    g.fillRect(W / 2 + 1, H - 9, 2, 2);   // 손잡이
    // 창문
    g.fillStyle(0x9fd0e4, 0.95);
    g.fillRect(8, 27, 8, 7);
    g.fillRect(W - 16, 27, 8, 7);
    g.lineStyle(1, 0x4a3a2a, 0.8);
    g.strokeRect(8, 27, 8, 7);
    g.strokeRect(W - 16, 27, 8, 7);
    // 주점 등불 / 카페 컵 등 종류 포인트
    if (kind === 'pub') {
      g.fillStyle(accent, 1);
      g.fillCircle(6, 20, 3);
    } else if (kind === 'cafe') {
      g.fillStyle(0xffffff, 1);
      g.fillRect(W - 10, 10, 5, 4);
    }
    // 외곽선
    g.lineStyle(2, 0x2a1c12, 1);
    g.strokeRect(2, 8, W - 4, H - 8);

    g.generateTexture(key, W, H);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════
  // OSM 심리스 POI — 문(door) 규칙 · 청크 상주 마커 · 거래 연결 (OSM_TILEMAP_SPEC §4)
  // ═══════════════════════════════════════════════════
  /** SeamlessChunks 청크 한 변 타일 수와 동일해야 상주 훅과 키가 일치한다 (TR 32 → 32타일 = 1024px RT) */
  private static readonly SEAMLESS_CHUNK_TILES = 32;

  /** POI 타입 폴백 라벨 (name 없는 공공 POI 표기) */
  private static readonly POI_LABEL: Partial<Record<RegionPoi['type'], string>> = {
    toilet: '공중화장실', police: '파출소', ferry_terminal: '여객터미널',
    lighthouse: '등대', viewpoint: '전망 포인트', fishing_spot: '낚시터',
    market: '시장', info: '관광안내소', fuel: '주유소',
  };

  /**
   * OSM POI → 상점 카탈로그 종류. 매핑되지 않는 시설(미용실·의류점 등)은 마커만 표시.
   * (SHOP_CATALOG 6종 프리셋을 재사용 — 지역 실상점 카탈로그는 후속)
   */
  private poiBuildingKind(poi: RegionPoi): BuildingKind | null {
    if (poi.type === 'restaurant') return 'restaurant';
    if (poi.type === 'cafe') return 'cafe';
    if (poi.type === 'market') return 'market';
    if (poi.type === 'pharmacy') return 'pharmacy';   // 129차 P7 — 구급품·제작 재료 판매
    if (poi.type === 'shop') {
      const k = poi.shopKind ?? '';
      if (k === 'convenience') return 'convenience';
      if (k === 'supermarket' || k === 'grocery' || k === 'greengrocer') return 'mart';
      if (k === 'seafood' || k === 'fishery' || k === 'fishing') return 'market';
      if (k === 'alcohol' || k === 'beverages' || k === 'pub') return 'pub';
      if (k === 'chemist' || k === 'medical_supply' || k === 'herbalist') return 'pharmacy';
      // 135차 — 생활용품점(사이소): Ch1 저가 장비 한 벌. 속초 실데이터 general 12 · variety_store 5
      if (k === 'general' || k === 'variety_store' || k === 'houseware' || k === 'hardware'
        || k === 'department_store' || k === 'kiosk') return 'daily';
      return null;
    }
    return null;
  }

  /** 도로 밖으로 민 POI 문 수 (dev 로그 — 전 맵 검수 계측) */
  private poiNudged = 0;

  /** 문 좌표를 도로 벡터 밴드 밖으로 (밀 필요·밀 곳이 없으면 그대로) */
  private nudgePoiDoor(door: { x: number; y: number }): { x: number; y: number } {
    const n = this.chunks?.nudgeOffRoad(door.x, door.y);
    if (!n || !n.moved) return door;
    this.poiNudged++;
    return { x: n.x, y: n.y };
  }

  /**
   * 출입구 배치 규칙 (스펙 §4): 손 지정 door 필드가 우선, 없고 앵커가 건물(#) 안이면
   * 앵커에서 가장 가까운 걷기 가능 타일(r/. 우선)을 문 위치로 삼는다.
   */
  private resolvePoiDoor(poi: RegionPoi): { x: number; y: number } {
    const toWorld = (c: number, r: number): { x: number; y: number } =>
      ({ x: c * TR + TR / 2, y: r * TR + TR / 2 });
    if (poi.door) return toWorld(poi.door[0], poi.door[1]);
    if (this.terrainAt(poi.tx, poi.ty) !== 'building') return toWorld(poi.tx, poi.ty);
    // BFS ≤ 12타일 — 보도('sidewalk')/맨땅('land')을 우선. **차도는 최후 폴백**(101차 후속 4 —
    //  "도로 위에 횟집": 문 앞 상점 오브젝트가 차도를 침범하던 원인이 도로 우선 선택이었다)
    let anyWalkable: { c: number; r: number } | null = null;
    const seen = new Set<number>();
    const queue: [number, number, number][] = [[poi.tx, poi.ty, 0]];
    seen.add(poi.ty * this.cols + poi.tx);
    while (queue.length > 0) {
      const [c, r, d] = queue.shift()!;
      if (d > 12) break;
      const t = this.terrainAt(c, r);
      if ((t === 'sidewalk' || t === 'land' || t === 'grass') && this.terrainAt(c, r + 1) !== 'road') return toWorld(c, r);
      if (!anyWalkable && t !== undefined && t !== 'water' && t !== 'building') {
        anyWalkable = { c, r };
      }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
        const k = nr * this.cols + nc;
        if (!seen.has(k)) { seen.add(k); queue.push([nc, nr, d + 1]); }
      }
    }
    if (anyWalkable) return toWorld(anyWalkable.c, anyWalkable.r);
    return toWorld(poi.tx, poi.ty);
  }

  /**
   * POI → 건물 프리팹 텍스처 (의미 일치만 — 사용자 규칙 "편의점에 팝업스토어/횟집 금지").
   *  횟집 = 음식점/수산 상점 중 이름이 횟집·회센터·활어·물회·해물 계열 → Gemini 횟집 2종
   *  팝업스토어(노점) = 시장·기념품·잡화·수산물 판매(비음식점)·이름에 난전/노점/시장 → Gemini 팝업 4종
   *  고층 = 호텔·은행 · 주택 = 민박/게스트하우스(TopDown 주택 2종)
   */
  private poiVisualTex(poi: RegionPoi): string | null {
    const name = poi.name ?? '';
    const kind = poi.shopKind ?? '';
    const h = Math.abs(Math.imul(poi.osmId | 0, 2654435761) >>> 0) / 4294967296;
    const seafoodName = /횟집|회센터|회 센터|활어|물회|해물|수산|어시장|생선|횟/.test(name);
    if ((poi.type === 'restaurant' && seafoodName) || (poi.type === 'shop' && kind === 'seafood' && /횟집|회/.test(name))) {
      return `ts_gem_sashimi_${1 + (Math.floor(h * 2) % 2)}`;
    }
    const popupKinds = ['gift', 'souvenir', 'kiosk', 'greengrocer', 'variety_store', 'seafood', 'fishing', 'farm', 'dried_fish'];
    if (poi.type === 'market' || (poi.type === 'shop' && popupKinds.includes(kind)) || /난전|노점|시장/.test(name)) {
      return `ts_gem_popup_${1 + (Math.floor(h * 4) % 4)}`;
    }
    if (poi.type === 'lodging') {
      return /호텔|hotel|리조트|resort|콘도/i.test(name)
        ? `ts_gem_building_${1 + (Math.floor(h * 5) % 5)}`
        : (h < 0.5 ? 'ts_td_house_red' : 'ts_td_house_blue');
    }
    if (poi.type === 'bank') return `ts_gem_building_${1 + (Math.floor(h * 5) % 5)}`;
    return null;
  }

  /**
   * POI → 배경 NPC 역할. 138차 — 구 gem NPC 텍스처 5장 돌려막기를 폐기하고
   * **POI마다 고유 인물**을 `characterOf(id)`로 생성한다(같은 얼굴이 두 번 서지 않는다).
   * 반환 null이면 그 POI엔 NPC가 없다.
   */
  private poiNpcRole(poi: RegionPoi): CharRole | null {
    const h = Math.abs(Math.imul((poi.osmId | 0) ^ 0x5bd1, 2246822519) >>> 0) / 4294967296;
    if (poi.type === 'police') return 'official';
    if (poi.type === 'market' || (poi.type === 'shop' && (poi.shopKind === 'seafood' || poi.shopKind === 'fishing'))) {
      return h < 0.6 ? 'vendor' : null;
    }
    if (poi.type === 'viewpoint' || poi.type === 'cafe' || poi.type === 'lodging' || poi.type === 'info') {
      return h < 0.5 ? 'office' : null;
    }
    if (poi.type === 'restaurant') return h < 0.25 ? 'cook' : h < 0.4 ? 'camper' : null;
    if (poi.type === 'ferry_terminal' || poi.type === 'toilet') return h < 0.5 ? 'crew' : null;
    return null;
  }

  /** POI 문 위치·청크 배정·거래 가능 목록 사전 계산 (create 1회) */
  private prepareSeamlessPois(): void {
    this.buildings = [];
    this.poiDoors = [];
    this.miniShopMarkers = [];
    this.miniPlaceMarkers = [];
    this.poiByChunk.clear();
    const N = RegionFieldScene.SEAMLESS_CHUNK_TILES;
    const reserved = new Set<string>();
    this.regionPois.forEach((poi, i) => {
      // 150차 — 문 좌표가 차도 벡터 밴드 안이면 땅으로 민다(사용자 리포트 "횟집이 도로 위에").
      //  ⚠ 106차 `trimBuildingsOnRoads`는 **타일**만 걷어냈고, 화면의 아스팔트는 101차 이후
      //     **도로 벡터 밴드**가 그린다 — 타일은 '.'인데 그림은 차도인 자리가 생긴다.
      //     `resolvePoiDoor`의 차도 회피는 타일 문자만 봐서 이 경우를 못 걸렀다.
      //  ⚠ 스프라이트가 아니라 **문**을 민다 — 거래 판정·NPC·미니맵 핀이 한 좌표를 공유하므로
      //     그림만 옮기면 "보이는 곳과 [F] 되는 곳"이 어긋난다.
      const door = this.nudgePoiDoor(this.resolvePoiDoor(poi));
      this.poiDoors.push(door);
      const key = `${Math.floor(poi.tx / N)},${Math.floor(poi.ty / N)}`;
      const list = this.poiByChunk.get(key);
      if (list) list.push(i);
      else this.poiByChunk.set(key, [i]);
      // 거래 가능 POI = 기존 건물 근접([E] 거래) 흐름에 그대로 편입
      const kind = this.poiBuildingKind(poi);
      if (kind) {
        this.buildings.push({ x: door.x, y: door.y, kind });
        // 물품 상점(1)이 음식점·카페·주점(0)보다 미니맵 셀을 먼저 차지한다
        const goods = kind !== 'restaurant' && kind !== 'cafe' && kind !== 'pub';
        this.miniShopMarkers.push({
          wx: door.x, wy: door.y,
          icon: RegionFieldScene.MINI_SHOP_ICON[kind], priority: goods ? 1 : 0,
          label: poi.name || BUILDING_LABEL[kind],
        });
      }
      else if ((poi.name ?? '') !== '' || RegionFieldScene.POI_LABEL[poi.type] !== undefined) {
        // 거래는 안 되지만 이름이 있는 장소 — 바닥 이름표 대신 미니맵 핀으로만 (143차)
        this.miniPlaceMarkers.push({
          wx: door.x, wy: door.y, icon: 'mm_poi', priority: 0,
          label: poi.name || RegionFieldScene.POI_LABEL[poi.type],
        });
      }
      // 건물 프리팹이 붙는 POI의 건물 컴포넌트는 고층 자동 배치에서 제외
      if (this.poiVisualTex(poi)) {
        const bk = this.chunks?.buildingKeyAt(poi.tx, poi.ty);
        if (bk) reserved.add(bk);
      }
    });
    this.chunks?.setReservedBuildings(reserved);
  }

  /** 청크 상주 시작 — 해당 청크 POI 마커/라벨 생성 (스펙 §6-6: 상주 청크만 활성) */
  private loadChunkPois(cc: number, cr: number): void {
    const key = `${cc},${cr}`;
    if (this.poiObjects.has(key)) return;
    const list = this.poiByChunk.get(key);
    if (!list) return;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const occluders: Phaser.GameObjects.Image[] = [];
    for (const i of list) {
      const poi = this.regionPois[i];
      const door = this.poiDoors[i];
      const kind = this.poiBuildingKind(poi);
      const notable = kind !== null || RegionFieldScene.POI_LABEL[poi.type] !== undefined;
      // 건물 프리팹 (타일셋):
      //  - 빌딩 파사드(building_N) = 건물 풋프린트 하단 중앙 (지붕 스프라이트 위 +0.0005)
      //  - 상점 오브젝트(팝업/횟집) = **건물 앞 문 위치에 별도 배치 + 자체 충돌**(하단 띠) —
      //    건물 풋프린트(지붕)와 겹치지 않고, 캐릭터가 오브젝트 앞을 지나면 앞에 보인다(y-sort)
      // 138차 — 프리팹 11장이 도시 전체를 덮던 문제. POI마다 벽 색·차양·간판을 결정적으로 바꾼다.
      const visBase = this.poiVisualTex(poi);
      const vis = visBase ? ensureBuildingVariant(this, visBase, poi.osmId | 0) : null;
      let hasSprite = false;
      if (vis && this.textures.exists(vis)) {
        const isShop = /popup|sashimi/.test(visBase ?? '');
        const b = this.chunks?.buildingBoundsAt(poi.tx, poi.ty);
        let lit: Phaser.GameObjects.Image | null = null;
        if (isShop) {
          const sx = door.x, sy = door.y + TR * 0.5;
          const img = this.add.image(sx, sy, vis).setOrigin(0.5, 1).setDepth(20 + sy * 0.001);
          objs.push(img);
          const bw = Math.max(TR, img.displayWidth * 0.9), bh = TR * 0.6;
          const body = this.add.rectangle(sx, sy - bh / 2, bw, bh, 0, 0).setVisible(false);
          this.poiWalls?.add(body);
          objs.push(body);
          lit = img;
        } else {
          const bx = b ? ((b.c0 + b.c1 + 1) / 2) * TR : door.x;
          const by = b ? (b.r1 + 1) * TR : door.y + TR / 2;
          lit = this.add.image(bx, by, vis).setOrigin(0.5, 1).setDepth(20 + by * 0.001 + 0.0005);
          objs.push(lit);
        }
        // 야간 — 상호작용 건물은 **오브젝트 전체**를 덮는 발광 (오브젝트 위 깊이 — 뒤에 숨지 않게)
        if (lit && kind && this.isNightNow) {
          const glow = this.add.ellipse(lit.x, lit.y - lit.displayHeight * 0.45, lit.displayWidth * 1.3, lit.displayHeight * 1.25, 0xffd080, 0.16)
            .setDepth(lit.depth + 0.0002).setBlendMode(Phaser.BlendModes.ADD);
          objs.push(glow);
        }
        if (lit) occluders.push(lit);   // 145차 — 캐릭터를 덮을 수 있는 그림
        hasSprite = true;
      }
      // NPC (정적 — 문 옆에 선다, 충돌 있음)
      const role = this.poiNpcRole(poi);
      if (role) {
        const side = (poi.osmId & 1) === 0 ? 1 : -1;
        const nx = door.x + side * 18, ny = door.y + 8;
        // 깊이 = max(자기 y, 소속 건물 하단 y) — 문이 건물 북쪽이면 지붕 RT 뒤로 숨던 것(리포트 6)
        const bb = this.chunks?.buildingBoundsAt(poi.tx, poi.ty);
        const depthY = Math.max(ny, bb ? (bb.r1 + 1) * TR + 1 : 0);
        const sheet = ensureCharSheet(this, characterOf(`poi_${poi.osmId}`, { role }), CHAR_SCALE);
        const pad = (CHAR_CELL - 1 - CHAR_FOOT_Y) * CHAR_SCALE;
        const img = this.add.image(nx, ny + pad, sheet, charFrameName(side > 0 ? 'left' : 'right', 0))
          .setOrigin(0.5, 1).setDepth(20 + depthY * 0.001 + 0.0006);
        objs.push(img);
        const body = this.add.rectangle(nx, ny - 6, Math.max(12, img.displayWidth * 0.7), 12, 0, 0).setVisible(false);
        this.poiWalls?.add(body);
        objs.push(body);
      }
      // 143차 — 바닥 표시는 **상호작용 가능한 건물**만 남긴다.
      //  스프라이트 없는 상점은 점 하나로 "여기서 거래된다"를 알리고,
      //  그 밖의 장소(여객터미널·정류장 등)는 설정을 켜야 보인다(기본 끔).
      const showDot = !hasSprite && (kind !== null || this.showFieldLabels);
      const dot = this.add.circle(door.x, door.y, 3.5, kind ? 0xffd24a : 0x9fc3d8, notable ? 0.95 : 0.55)
        .setStrokeStyle(1, 0x0a1628, 0.8)
        .setDepth(15 + door.y * 0.001)
        .setVisible(showDot);
      objs.push(dot);
      const label = poi.name || RegionFieldScene.POI_LABEL[poi.type] || '';
      if (label && notable && this.showFieldLabels) {
        const t = this.add.text(door.x, door.y + 6, label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px',
          color: kind ? '#ffe9b0' : '#cfe4f2',
          backgroundColor: '#0a1628cc', padding: { x: 4, y: 1 },
        }).setOrigin(0.5, 0).setDepth(15 + door.y * 0.001);
        objs.push(t);
      }
    }
    this.poiObjects.set(key, objs);
    if (occluders.length) this.occludersByChunk.set(key, occluders);
  }

  /** 청크 상주 해제 — 마커 파괴 (프리팹·프롭도 같은 수명 규칙을 따른다 — §11) */
  private unloadChunkPois(cc: number, cr: number): void {
    const key = `${cc},${cr}`;
    for (const img of this.occludersByChunk.get(key) ?? []) this.faded.delete(img);
    this.occludersByChunk.delete(key);
    const objs = this.poiObjects.get(key);
    if (!objs) return;
    this.poiObjects.delete(key);
    for (const o of objs) o.destroy();
  }

  // ═══════════════════════════════════════════════════
  // dev 맵 편집기 (F7) · 순간이동 — 심리스 전용, 프로덕션 데드코드
  // ═══════════════════════════════════════════════════
  /**
   * 차도 안 건물 타일 정리(106차-b) — OSM 래스터화(terrain)와 도로 벡터가 어긋나 `'#'` 타일이
   * 아스팔트 밴드 위로 튀어나오는 곳이 많다(사용자: "도로 위로 건물 지형이 얹혀져 있다 —
   * 도로는 건드리지 말고 안쪽으로"). 도로 중심선에서 반폭 안에 **중심이 들어온** 건물 타일을
   * 맨땅('.')으로 바꿔 건물 가장자리를 안쪽으로 밀어 넣는다. 걷기·충돌·지붕이 함께 따라온다.
   * terrain 원본(JSON)은 그대로 — 로드 시 런타임 변환이라 전 지역에 일괄 적용된다.
   */
  /** trimBuildingsOnRoads가 바꾼 타일 키 — 편집기 저장 diff에서 제외(런타임 변환을 패치로 굽지 않기 위해) */
  private roadTrimmed = new Set<number>();

  private trimBuildingsOnRoads(): void {
    this.roadTrimmed.clear();
    if (this.regionRoads.length === 0) return;
    const rows = this.mapData.terrain.slice();
    let trimmed = 0;
    for (const rd of this.regionRoads) {
      const hw = rd.w / 2 - 0.05;
      if (hw <= 0) continue;
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
        const vx = bx - ax, vy = by - ay;
        const l2 = vx * vx + vy * vy || 1;
        const cMin = Math.max(0, Math.floor(Math.min(ax, bx) - hw - 1));
        const cMax = Math.min(this.cols - 1, Math.ceil(Math.max(ax, bx) + hw + 1));
        const rMin = Math.max(0, Math.floor(Math.min(ay, by) - hw - 1));
        const rMax = Math.min(this.rows - 1, Math.ceil(Math.max(ay, by) + hw + 1));
        for (let r = rMin; r <= rMax; r++) {
          for (let c = cMin; c <= cMax; c++) {
            if (rows[r][c] !== '#') continue;
            const px = c + 0.5, py = r + 0.5;
            const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
            const dx = ax + vx * t - px, dy = ay + vy * t - py;
            if (dx * dx + dy * dy > hw * hw) continue;
            rows[r] = rows[r].slice(0, c) + '.' + rows[r].slice(c + 1);
            this.roadTrimmed.add(r * this.cols + c);
            trimmed++;
          }
        }
      }
    }
    if (trimmed > 0) {
      this.mapData = { ...this.mapData, terrain: rows };
      console.log(`[RegionField] 차도 안 건물 타일 ${trimmed}개 정리 (건물을 도로 안쪽으로)`);
    }
  }

  /** 순간이동 — 월드 좌표(클램프) + 청크 즉시 상주 (충돌 바디는 로드 즉시라 관통 없음) */
  private devTeleport(x: number, y: number): void {
    const cx = Phaser.Math.Clamp(x, TR, this.worldW - TR);
    const cy = Phaser.Math.Clamp(y, TR, this.worldH - TR);
    this.clearCastFlight();
    this.playerBody.setPosition(cx, cy);
    this.playerBody.setVelocity(0, 0);
    this.chunks?.update(cx, cy);
    this.cameras.main.centerOn(cx, cy);
    this.hud?.pushLog(`[dev] 순간이동 → 타일 (${Math.floor(cx / TR)}, ${Math.floor(cy / TR)})`);
  }

  private toggleMapEditor(): void {
    if (isMapEditorOpen()) { closeMapEditor(); this.editGhost?.setVisible(false); this.hud?.pushLog('[dev] 맵 편집기 닫힘'); return; }
    openMapEditor(this.seamlessDef?.dataRegion ?? this.region,
      PROP_DEFS.map((d) => ({ id: d.id, label: d.label, cat: d.cat, thumb: tilesetPathOf(d.tex), scale: d.scale })), {
        onSave: () => this.editSavePatch(),
        onUndo: () => this.editUndoStroke(),
        onClose: () => { closeMapEditor(); this.editPreviewG?.clear(); this.editGhost?.setVisible(false); },
      });
    this.hud?.pushLog('[dev] 맵 편집기 열림 (F7) — 지형/프롭/지붕 편집 · 저장은 patch.json');
  }

  private editBeginStroke(p: Phaser.Input.Pointer): void {
    this.editPainting = true;
    this.editStrokePrev = new Map();
    this.editTexPrev = null;
    this.editDirty.clear();
    this.editApplyAt(p);
  }

  /** 포인터 위치에 현재 모드 적용 (드래그 중 반복 호출 — 지형은 브러시 크기, 프롭/지붕은 1타일) */
  private editApplyAt(p: Phaser.Input.Pointer): void {
    const w = this.pointerWorld(p);
    const tc = Math.floor(w.x / TR), trw = Math.floor(w.y / TR);
    if (tc < 0 || tc >= this.cols || trw < 0 || trw >= this.rows) return;
    const st = mapEditorState;
    if (st.mode === 'tile') {
      const half = Math.floor(st.brush / 2);
      // 개별 시트 셀(106차): 그림 오버라이드 + base 지형 문자를 함께 칠한다.
      //   ⚠ 걷기·충돌은 **지형 문자**가 결정한다 — 그림만 바꾸면 바다 위를 걷게 된다.
      const texList = this.regionPatch.tileTex ?? (this.regionPatch.tileTex = []);
      if (this.editTexPrev === null) this.editTexPrev = texList.map((t) => ({ ...t }));
      for (let dr = -half; dr <= half; dr++) {
        for (let dc = -half; dc <= half; dc++) {
          const c = tc + dc, r = trw + dr;
          if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
          const key = r * this.cols + c;
          const row = this.mapData.terrain[r];
          if (row[c] !== st.tileChar) {
            if (!this.editStrokePrev.has(key)) this.editStrokePrev.set(key, row[c]);
            this.mapData.terrain[r] = row.slice(0, c) + st.tileChar + row.slice(c + 1);
            const t = TERRAIN_BY_CHAR[st.tileChar] ?? 'land';
            this.terrain[r][c] = t;
            this.blocked[r][c] = t === 'water' || t === 'building';
          }
          const at = texList.findIndex((t) => t.tx === c && t.ty === r);
          if (st.tileTex) {
            const entry = { tx: c, ty: r, tex: st.tileTex, rot: st.rot, fx: st.fx, fy: st.fy };
            if (at >= 0) texList[at] = entry; else texList.push(entry);
          } else if (at >= 0) {
            texList.splice(at, 1);           // 기본 지형 문자로 칠하면 그림 오버라이드는 해제
          }
          this.editDirty.set(key, { c, r });
        }
      }
      this.chunks?.setTileTex(texList);
      setMapEditorStatus(`지형 '${st.tileChar}'${st.tileTex ? ` + 셀 ${st.tileTex.replace(/^ts_/, '')}` : ''}`
        + ` — (${tc}, ${trw}) · 변경 ${this.editDirty.size}타일`);
      return;
    }
    if (st.mode === 'road') {
      // 드래그 중이면 정점 이동(재베이킹은 pointerup에서), 아니면 잡을 정점/세그먼트 탐색
      const px = w.x / TR, py = w.y / TR;
      if (this.editRoadDrag) {
        this.regionRoads[this.editRoadDrag.ri].pts[this.editRoadDrag.pi] = [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
        this.editDrawPreview(p);
        return;
      }
      const hit = this.editRoadHit(px, py);
      if (!hit) { setMapEditorStatus('도로 정점(원)이나 선(세그먼트) 근처를 클릭하세요 · 우클릭 = 정점 삭제'); return; }
      this.editUndo.push({ tiles: new Map(), roads: this.regionRoads.map((r) => ({ ...r, pts: r.pts.map((q) => [q[0], q[1]] as [number, number]) })) });
      if (hit.kind === 'segment') {
        this.regionRoads[hit.ri].pts.splice(hit.pi + 1, 0, [Math.round(px * 10) / 10, Math.round(py * 10) / 10]);
        this.editRoadDrag = { ri: hit.ri, pi: hit.pi + 1 };
        setMapEditorStatus(`정점 삽입 — 도로 ${hit.ri} (${this.regionRoads[hit.ri].cls}) · 드래그로 위치 조정`);
      } else {
        this.editRoadDrag = { ri: hit.ri, pi: hit.pi };
        setMapEditorStatus(`정점 이동 — 도로 ${hit.ri} 정점 ${hit.pi}`);
      }
      return;
    }
    if (st.mode === 'roadNew') {
      // 클릭당 정점 1개 (드래그 반복 방지 — 프롭과 같은 스트로크 가드)
      if (this.editDirty.has(-1)) return;
      this.editDirty.set(-1, { c: -1, r: -1 });   // editFinishStroke의 invalidate 대상에서 제외
      this.editRoadNewAddPoint(w.x / TR, w.y / TR);
      return;
    }
    // 프롭/지붕은 스트로크당 1회 (드래그 반복 방지)
    if (this.editDirty.has(-1)) return;
    this.editDirty.set(-1, { c: tc, r: trw });
    if (st.mode === 'prop') {
      const def = PROP_DEFS.find((d) => d.id === st.propId);
      if (!def) return;
      const tfm = { rot: st.rot, fx: st.fx, fy: st.fy };
      if (st.overlap) {
        // 자유 배치(106차) — 격자 스냅·겹침 검사 없이 포인터 위치 그대로. 충돌 바디도 만들지 않는다
        //   (테트라포드처럼 겹쳐 쌓는 무더기가 통째로 벽이 되면 안 된다).
        const fx = w.x / TR - 0.5, fy = w.y / TR - 0.5;
        this.editUndo.push({ tiles: new Map(), props: this.regionPatch.props.slice() });
        this.regionPatch.props.push({ tx: Math.round(fx * 4) / 4, ty: Math.round(fy * 4) / 4, id: st.propId, ...tfm, free: true });
        this.chunks?.setProps(this.regionPatch.props);
        this.chunks?.rebakeResident();
        setMapEditorStatus(`자유 배치 '${def.label}' → (${fx.toFixed(2)}, ${fy.toFixed(2)}) · ${st.rot * 90}°`
          + `${st.fx ? ' ↔' : ''}${st.fy ? ' ↕' : ''} · 총 ${this.regionPatch.props.length}개`);
        return;
      }
      const cells = this.propPlacementCells(def, tc, trw);
      const bad = cells.filter((k) => k.state === 'red');
      if (bad.length > 0) {
        setMapEditorStatus(`배치 불가 — ${bad[0].why} (${bad.length}칸) · O 키 = 겹침 허용`);
        return;
      }
      this.editUndo.push({ tiles: new Map(), props: this.regionPatch.props.slice() });
      this.regionPatch.props.push({ tx: tc, ty: trw, id: st.propId, ...tfm });
      this.chunks?.setProps(this.regionPatch.props);
      this.chunks?.rebakeResident();
      const warn = cells.some((k) => k.state === 'yellow') ? ' · ⚠ 일부 칸이 차도/보도 위' : '';
      setMapEditorStatus(`프롭 '${def.label}' 배치 → (${tc}, ${trw}) · ${cells.length}칸 · 총 ${this.regionPatch.props.length}개${warn}`);
    } else if (st.mode === 'erase') {
      const before = this.regionPatch.props.length;
      this.editUndo.push({ tiles: new Map(), props: this.regionPatch.props.slice() });
      this.regionPatch.props = this.regionPatch.props.filter((q) => Math.abs(q.tx - tc) > 1.5 || Math.abs(q.ty - trw) > 1.5);
      this.chunks?.setProps(this.regionPatch.props);
      this.chunks?.rebakeResident();
      setMapEditorStatus(`프롭 제거 ${before - this.regionPatch.props.length}개 (3×3 범위)`);
    } else if (st.mode === 'roof') {
      const key = this.chunks?.buildingKeyAt(tc, trw);
      if (!key) { setMapEditorStatus('건물 타일을 클릭하세요'); return; }
      this.editUndo.push({ tiles: new Map(), roofs: { ...this.regionPatch.roofs } });
      this.regionPatch.roofs[key] = ((this.regionPatch.roofs[key] ?? 0) + 1) % 5;
      this.chunks?.setRoofOverrides(this.regionPatch.roofs);
      this.chunks?.rebakeResident();
      setMapEditorStatus(`지붕 팔레트 ${this.regionPatch.roofs[key]} — 건물 ${key}`);
    }
  }

  /**
   * 프롭 풋프린트 칸별 판정 (101차 후속 4 — 배치 UI 격자):
   *  green = 놓을 수 있음 · yellow = 가능하나 애매(차도/보도 위 비차량, 물가 등) · red = 불가
   *  (바다/건물 타일 · 다른 프롭 풋프린트와 겹침 · 맵 밖). 겹침 방지가 "오브젝트 중복 적층"을 막는다.
   */
  private propPlacementCells(def: PropDef, tc: number, trw: number): { c: number; r: number; state: 'green' | 'yellow' | 'red'; why?: string }[] {
    const fp = propFootprint(this, def, TR);
    const cL = tc - Math.floor((fp.w - 1) / 2);
    const rT = def.anchor === 'center' ? trw - Math.floor((fp.h - 1) / 2) : trw - fp.h + 1;
    // 기존 수동 프롭 점유 칸
    const occ = new Set<number>();
    for (const p of this.regionPatch.props) {
      const d = PROP_DEFS.find((x) => x.id === p.id);
      if (!d) continue;
      const f = propFootprint(this, d, TR);
      const l = p.tx - Math.floor((f.w - 1) / 2);
      const t = d.anchor === 'center' ? p.ty - Math.floor((f.h - 1) / 2) : p.ty - f.h + 1;
      for (let r = t; r < t + f.h; r++) for (let c = l; c < l + f.w; c++) occ.add(r * this.cols + c);
    }
    const out: { c: number; r: number; state: 'green' | 'yellow' | 'red'; why?: string }[] = [];
    for (let r = rT; r < rT + fp.h; r++) {
      for (let c = cL; c < cL + fp.w; c++) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) { out.push({ c, r, state: 'red', why: '맵 밖' }); continue; }
        const t = this.terrain[r][c];
        if (occ.has(r * this.cols + c)) { out.push({ c, r, state: 'red', why: '다른 오브젝트와 겹침' }); continue; }
        if (def.water) {
          out.push(t === 'water' ? { c, r, state: 'green' } : { c, r, state: 'red', why: '바다 타일에만' });
          continue;
        }
        if (t === 'water') { out.push({ c, r, state: 'red', why: '바다' }); continue; }
        if (t === 'building') { out.push({ c, r, state: 'red', why: '건물 타일' }); continue; }
        const vehicle = def.cat === '차량';
        if ((t === 'road' && !vehicle) || (t === 'sidewalk' && def.cat === '건물')) { out.push({ c, r, state: 'yellow' }); continue; }
        out.push({ c, r, state: 'green' });
      }
    }
    return out;
  }

  /** 도로 툴 — 포인터(타일 좌표) 근처의 정점(반경 0.4타일) 또는 세그먼트(0.35타일) 탐색 */
  private editRoadHit(px: number, py: number): { kind: 'vertex' | 'segment'; ri: number; pi: number } | null {
    let best: { kind: 'vertex' | 'segment'; ri: number; pi: number; d: number } | null = null;
    this.regionRoads.forEach((rd, ri) => {
      rd.pts.forEach((q, pi) => {
        const d = Math.hypot(q[0] - px, q[1] - py);
        if (d < 0.4 && (!best || d < best.d)) best = { kind: 'vertex', ri, pi, d };
      });
    });
    if (best) return best;
    this.regionRoads.forEach((rd, ri) => {
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
        const vx = bx - ax, vy = by - ay;
        const len2 = vx * vx + vy * vy || 1;
        const t = Phaser.Math.Clamp(((px - ax) * vx + (py - ay) * vy) / len2, 0, 1);
        const d = Math.hypot(ax + vx * t - px, ay + vy * t - py);
        if (d < 0.35 && t > 0.05 && t < 0.95 && (!best || d < best.d)) best = { kind: 'segment', ri, pi: i, d };
      }
    });
    return best;
  }

  /** 도로 툴 — 우클릭 정점 삭제 (정점 2개는 유지) */
  private editRoadDelete(p: Phaser.Input.Pointer): void {
    const w = this.pointerWorld(p);
    const hit = this.editRoadHit(w.x / TR, w.y / TR);
    if (!hit || hit.kind !== 'vertex') { setMapEditorStatus('삭제할 정점 근처에서 우클릭하세요'); return; }
    const rd = this.regionRoads[hit.ri];
    if (rd.pts.length <= 2) { setMapEditorStatus('정점이 2개뿐인 도로 — 삭제 불가'); return; }
    this.editUndo.push({ tiles: new Map(), roads: this.regionRoads.map((r) => ({ ...r, pts: r.pts.map((q) => [q[0], q[1]] as [number, number]) })) });
    rd.pts.splice(hit.pi, 1);
    this.editCommitRoads(`정점 삭제 — 도로 ${hit.ri}`);
  }

  /**
   * 새 도로 그리기 — 정점 추가 (101차 잔여 해소).
   * 접속 스냅: 기존 **정점** 0.45타일 안 = 그 정점 좌표로 스냅(노드 공유 → 교통 분기·마킹 컷 성립) ·
   * 기존 **세그먼트** 0.4타일 안 = 그 도로에 정점을 삽입하고 삽입점으로 스냅(T자 접속 —
   * 관통 도로는 정점이 있어야 노드가 된다). 그 외 = 0.1타일 스냅 자유 정점.
   * 마지막 정점과 같은 자리(0.3타일 안) 재클릭 = 확정.
   */
  private editRoadNewAddPoint(px: number, py: number): void {
    const pts = this.editRoadNewPts;
    const last = pts[pts.length - 1];
    if (last && Math.hypot(px - last[0], py - last[1]) < 0.3) {
      this.editRoadNewCommit();
      return;
    }
    let np: [number, number] = [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
    let snapMsg = '';
    // 정점 스냅 — 노드 키(0.1 반올림) 일치를 위해 기존 좌표를 그대로 쓴다
    let bestV: { q: [number, number]; d: number } | null = null;
    for (const rd of this.regionRoads) {
      for (const q of rd.pts) {
        const d = Math.hypot(q[0] - px, q[1] - py);
        if (d < 0.45 && (!bestV || d < bestV.d)) bestV = { q, d };
      }
    }
    if (bestV) {
      np = [bestV.q[0], bestV.q[1]];
      snapMsg = ' · 기존 정점에 접속';
    } else {
      const hit = this.editRoadHit(px, py);
      if (hit && hit.kind === 'segment') {
        // 관통 도로에 접속 정점 삽입 (undo 스냅샷 포함 — 그리기 취소 시 함께 되돌아간다).
        // 삽입점은 클릭점이 아니라 **선 위 투영점** — 기존 도로가 굴절되지 않는다.
        const rd = this.regionRoads[hit.ri];
        const [ax, ay] = rd.pts[hit.pi], [bx, by] = rd.pts[hit.pi + 1];
        const vx = bx - ax, vy = by - ay;
        const t = Phaser.Math.Clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
        np = [Math.round((ax + vx * t) * 10) / 10, Math.round((ay + vy * t) * 10) / 10];
        this.editUndo.push({ tiles: new Map(), roads: this.regionRoads.map((r) => ({ ...r, pts: r.pts.map((q) => [q[0], q[1]] as [number, number]) })) });
        this.regionRoads[hit.ri].pts.splice(hit.pi + 1, 0, np);
        snapMsg = ` · 도로 ${hit.ri}에 접속 정점 삽입`;
      }
    }
    pts.push(np);
    setMapEditorStatus(`새 도로 — 정점 ${pts.length}개${snapMsg} · Enter/같은 자리 재클릭 = 확정 · 우클릭 = 마지막 취소`);
  }

  /** 새 도로 확정 — regionRoads에 추가 후 공통 커밋 (정점 2개 미만이면 폐기) */
  private editRoadNewCommit(): void {
    const pts = this.editRoadNewPts;
    this.editRoadNewPts = [];
    if (pts.length < 2) { setMapEditorStatus('새 도로 취소 — 정점이 2개 미만'); return; }
    this.editUndo.push({ tiles: new Map(), roads: this.regionRoads.map((r) => ({ ...r, pts: r.pts.map((q) => [q[0], q[1]] as [number, number]) })) });
    const st = mapEditorState;
    this.regionRoads.push({ cls: st.roadCls, w: st.roadW, lanes: st.roadLanes, pts });
    this.editCommitRoads(`새 도로 추가 — ${st.roadCls} 폭 ${st.roadW} · 정점 ${pts.length}개`);
  }

  /** 새 도로 그리기 — 우클릭: 마지막 정점 취소 (없으면 안내만) */
  private editRoadNewUndoPoint(): void {
    if (this.editRoadNewPts.length === 0) { setMapEditorStatus('그리는 중인 새 도로 없음 — 클릭으로 시작하세요'); return; }
    this.editRoadNewPts.pop();
    setMapEditorStatus(`마지막 정점 취소 — 남은 정점 ${this.editRoadNewPts.length}개`);
  }

  /** 도로 벡터 변경 확정 — 청크 재색인·재베이킹 + 교통 재구성 + 패치 오버라이드 기록 */
  private editCommitRoads(msg: string): void {
    this.regionPatch.roads = this.regionRoads;
    this.chunks?.setRoads(this.regionRoads);
    this.traffic?.destroy();
    this.traffic = new TrafficSystem(this, this.regionRoads, TR, 36, this.cols, this.rows, this.trafficSeed());
    setMapEditorStatus(`${msg} · 저장하면 patch.json roads 오버라이드 (타일 r/w는 판정용 — 필요하면 지형 탭에서 함께 칠하세요)`);
  }

  /** 편집기 프롭 모드 — 포인터 아래 풋프린트 격자 미리보기 (녹/황/적) · 도로 모드 — 정점/세그먼트 핸들 */
  /**
   * 호버 고스트(106차-b) — 선택한 타일/오브젝트의 **실물 스프라이트**를 반투명으로 커서에 붙인다.
   * 격자(녹/황/적)만으로는 회전·반전·실제 크기를 배치 전에 알 수 없다(사용자 리포트).
   */
  private editUpdateGhost(tex: string | null, x: number, y: number, opts?: { rot?: number; fx?: boolean; fy?: boolean; scale?: number; originY?: number }): void {
    if (!tex || !this.textures.exists(tex)) { this.editGhost?.setVisible(false); return; }
    if (!this.editGhost) this.editGhost = this.add.image(0, 0, tex).setDepth(61).setAlpha(0.55);
    const gh = this.editGhost;
    if (gh.texture.key !== tex) gh.setTexture(tex);
    gh.setVisible(true);
    gh.setPosition(x, y);
    gh.setOrigin(0.5, opts?.originY ?? 0.5);
    gh.setAngle((opts?.rot ?? 0) * 90);
    gh.setFlip(!!opts?.fx, !!opts?.fy);
    gh.setScale(opts?.scale ?? 1);
  }

  private editDrawPreview(p: Phaser.Input.Pointer): void {
    if (!this.editPreviewG) this.editPreviewG = this.add.graphics().setDepth(60);
    const g = this.editPreviewG;
    g.clear();
    if (!isMapEditorOpen()) { this.editGhost?.setVisible(false); return; }
    if (mapEditorState.mode === 'road' || mapEditorState.mode === 'roadNew') {
      this.editGhost?.setVisible(false);
      const cam = this.cameras.main.worldView;
      const x0 = cam.x / TR - 2, y0 = cam.y / TR - 2, x1 = cam.right / TR + 2, y1 = cam.bottom / TR + 2;
      const w = this.pointerWorld(p);
      const hit = this.editRoadDrag ? { kind: 'vertex' as const, ri: this.editRoadDrag.ri, pi: this.editRoadDrag.pi } : this.editRoadHit(w.x / TR, w.y / TR);
      this.regionRoads.forEach((rd, ri) => {
        let vis = false;
        for (const q of rd.pts) if (q[0] > x0 && q[0] < x1 && q[1] > y0 && q[1] < y1) { vis = true; break; }
        if (!vis) return;
        g.lineStyle(2, hit?.ri === ri ? 0x4af2a1 : 0x9ad0ff, 0.9);
        for (let i = 0; i < rd.pts.length - 1; i++) {
          g.lineBetween(rd.pts[i][0] * TR, rd.pts[i][1] * TR, rd.pts[i + 1][0] * TR, rd.pts[i + 1][1] * TR);
        }
        rd.pts.forEach((q, pi) => {
          const active = hit?.kind === 'vertex' && hit.ri === ri && hit.pi === pi;
          g.fillStyle(active ? 0xf2d24a : 0xffffff, 1);
          g.fillCircle(q[0] * TR, q[1] * TR, active ? 6 : 4);
          g.lineStyle(1, 0x0a1628, 1);
          g.strokeCircle(q[0] * TR, q[1] * TR, active ? 6 : 4);
        });
      });
      if (mapEditorState.mode === 'road' && hit?.kind === 'segment') { g.fillStyle(0xf2d24a, 0.9); g.fillCircle(w.x, w.y, 5); }
      // 새 도로 — 그리는 중 폴리라인(초록) + 마지막 정점 → 커서 고스트 선
      if (mapEditorState.mode === 'roadNew') {
        const np = this.editRoadNewPts;
        if (np.length > 0) {
          g.lineStyle(3, 0x4af2a1, 0.95);
          for (let i = 0; i < np.length - 1; i++) {
            g.lineBetween(np[i][0] * TR, np[i][1] * TR, np[i + 1][0] * TR, np[i + 1][1] * TR);
          }
          g.lineStyle(2, 0x4af2a1, 0.5);
          g.lineBetween(np[np.length - 1][0] * TR, np[np.length - 1][1] * TR, w.x, w.y);
          np.forEach((q) => {
            g.fillStyle(0x4af2a1, 1);
            g.fillCircle(q[0] * TR, q[1] * TR, 5);
            g.lineStyle(1, 0x0a1628, 1);
            g.strokeCircle(q[0] * TR, q[1] * TR, 5);
          });
        }
        // 접속 스냅 표시 — 커서가 기존 정점/선 근처면 노란 링
        if (hit) { g.lineStyle(2, 0xf2d24a, 0.9); g.strokeCircle(w.x, w.y, 8); }
      }
      return;
    }
    const st = mapEditorState;
    if (st.mode === 'tile') {
      // 개별 시트 셀 = 실물 고스트 (기본 지형 문자는 그림이 해시 변형이라 고스트 없이 셀 테두리만)
      const w = this.pointerWorld(p);
      const tc = Math.floor(w.x / TR), trw = Math.floor(w.y / TR);
      if (tc < 0 || tc >= this.cols || trw < 0 || trw >= this.rows) { this.editGhost?.setVisible(false); return; }
      this.editUpdateGhost(st.tileTex, tc * TR + TR / 2, trw * TR + TR / 2, { rot: st.rot, fx: st.fx, fy: st.fy });
      const half = Math.floor(st.brush / 2);
      g.lineStyle(1, 0x9ad0ff, 0.9);
      g.strokeRect((tc - half) * TR + 0.5, (trw - half) * TR + 0.5, st.brush * TR - 1, st.brush * TR - 1);
      return;
    }
    if (st.mode !== 'prop') { this.editGhost?.setVisible(false); return; }
    const def = PROP_DEFS.find((d) => d.id === st.propId);
    if (!def) { this.editGhost?.setVisible(false); return; }
    const w = this.pointerWorld(p);
    const tc = Math.floor(w.x / TR), trw = Math.floor(w.y / TR);
    if (tc < 0 || tc >= this.cols || trw < 0 || trw >= this.rows) { this.editGhost?.setVisible(false); return; }
    const COLS = { green: 0x4af2a1, yellow: 0xf2d24a, red: 0xf25a4a } as const;
    const center = def.anchor === 'center' || st.rot !== 0;
    // 겹침 허용(106차) — 격자 판정 대신 **포인터 위치 고스트**(자유 배치라 칸 개념이 없다)
    if (st.overlap) {
      this.editUpdateGhost(def.tex, w.x, w.y, { rot: st.rot, fx: st.fx, fy: st.fy, scale: def.scale ?? 1 });
      return;
    }
    // 격자 배치 — 스냅 위치에 실물 고스트(spawnProp와 같은 앵커) + 판정 격자
    this.editUpdateGhost(def.tex, tc * TR + TR / 2, center ? trw * TR + TR / 2 : trw * TR + TR,
      { rot: st.rot, fx: st.fx, fy: st.fy, scale: def.scale ?? 1, originY: center ? 0.5 : 1 });
    for (const cell of this.propPlacementCells(def, tc, trw)) {
      g.fillStyle(COLS[cell.state], 0.28);
      g.fillRect(cell.c * TR, cell.r * TR, TR, TR);
      g.lineStyle(1, COLS[cell.state], 0.9);
      g.strokeRect(cell.c * TR + 0.5, cell.r * TR + 0.5, TR - 1, TR - 1);
    }
  }

  /** 스트로크 확정 — 변경 타일을 패치에 기록하고 영향 청크 재베이킹 */
  private editFinishStroke(): void {
    this.editPainting = false;
    if (this.editRoadDrag) {
      const d = this.editRoadDrag;
      this.editRoadDrag = null;
      this.editCommitRoads(`정점 확정 — 도로 ${d.ri} 정점 ${d.pi}`);
      return;
    }
    if (this.editStrokePrev.size > 0 || this.editTexPrev) {
      this.editUndo.push({ tiles: this.editStrokePrev, ...(this.editTexPrev ? { tileTex: this.editTexPrev } : {}) });
      this.editStrokePrev = new Map();
      this.editTexPrev = null;
      this.editSyncTilePatch();
    }
    const dirty = [...this.editDirty.values()].filter((d) => d.c >= 0);
    this.editDirty.clear();
    if (dirty.length > 0) this.chunks?.invalidateTiles(dirty);
  }

  /** 패치의 tiles = 원본(seamless.json) 대비 현재 지형 차이 — 패치 자체를 원본 기준으로 재구성 */
  private editSyncTilePatch(): void {
    const dr = this.seamlessDef?.dataRegion ?? '';
    const base = this.cache.json.get(`rmap_${this.mapId}`) as RegionMapData | undefined;
    if (!base) return;
    const tiles: RegionPatch['tiles'] = [];
    for (let r = 0; r < this.rows; r++) {
      const cur = this.mapData.terrain[r], org = base.terrain[r] ?? '';
      if (cur === org) continue;
      for (let c = 0; c < this.cols; c++) {
        if (cur[c] === org[c]) continue;
        // 차도 안 건물 트림(런타임 변환)은 사용자 편집이 아니다 — 패치에 굽지 않는다(106차-b)
        if (cur[c] === '.' && this.roadTrimmed.has(r * this.cols + c)) continue;
        tiles.push([c, r, cur[c]]);
      }
    }
    this.regionPatch.tiles = tiles;
    void dr;
  }

  private editUndoStroke(): void {
    const last = this.editUndo.pop();
    if (!last) { setMapEditorStatus('되돌릴 스트로크 없음'); return; }
    if (last.props) {
      this.regionPatch.props = last.props;
      this.chunks?.setProps(last.props);
      this.chunks?.rebakeResident();
    }
    if (last.roofs) {
      this.regionPatch.roofs = last.roofs;
      this.chunks?.setRoofOverrides(last.roofs);
      this.chunks?.rebakeResident();
    }
    if (last.roads) {
      this.regionRoads = last.roads;
      this.editCommitRoads('도로 되돌림');
    }
    if (last.tileTex) {
      this.regionPatch.tileTex = last.tileTex;
      this.chunks?.setTileTex(last.tileTex);
      this.chunks?.rebakeResident();
    }
    const dirty: { c: number; r: number }[] = [];
    for (const [key, ch] of last.tiles) {
      const c = key % this.cols, r = Math.floor(key / this.cols);
      const row = this.mapData.terrain[r];
      this.mapData.terrain[r] = row.slice(0, c) + ch + row.slice(c + 1);
      const t = TERRAIN_BY_CHAR[ch] ?? 'land';
      this.terrain[r][c] = t;
      this.blocked[r][c] = t === 'water' || t === 'building';
      dirty.push({ c, r });
    }
    if (dirty.length > 0) { this.editSyncTilePatch(); this.chunks?.invalidateTiles(dirty); }
    setMapEditorStatus(`되돌림 (타일 ${dirty.length}) · 남은 스트로크 ${this.editUndo.length}`);
  }

  /** vite dev 미들웨어로 patch.json 저장 (정본 pixelazed/ + 런타임 public/data/) */
  private async editSavePatch(): Promise<string> {
    const region = this.seamlessDef?.dataRegion ?? this.region;
    const res = await fetch(`/__dev/region-patch?region=${encodeURIComponent(region)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.regionPatch),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const t = this.regionPatch;
    this.hud?.pushLog(`[dev] patch.json 저장 — 타일 ${t.tiles.length} · 프롭 ${t.props.length} · 지붕 ${Object.keys(t.roofs).length}`);
    return `저장됨 — 타일 ${t.tiles.length} · 프롭 ${t.props.length} · 지붕 ${Object.keys(t.roofs).length}\n(재빌드 시 build_region_maps가 굽는다)`;
  }

  // ═══════════════════════════════════════════════════
  // 입력
  // ═══════════════════════════════════════════════════
  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    // ESC: 설치 모드 취소 → 최상단 팝업 닫기 → 일시정지 메뉴 토글
    this.input.keyboard!.on('keydown-ESC', () => {
      // 컷씬 재생 중에는 일시정지 메뉴로 새지 않는다 — ESC = 컷씬 건너뛰기
      if (this.skipCinematic()) return;
      if (this.placing) { this.cancelPlacement(); return; }
      if (this.trapField?.placing) { this.trapField.cancelPlacement(); return; }
      if (this.stoveField?.placing) { this.stoveField.cancelPlacement(); return; }
      if (this.closeTopPopup()) return;
      this.togglePauseMenu();
    });

    // 일시정지 메뉴 네비게이션 (열려 있을 때만 처리)
    this.input.keyboard!.on('keydown-UP', () => { if (this.isPaused) this.movePauseSel(-1); });
    this.input.keyboard!.on('keydown-DOWN', () => { if (this.isPaused) this.movePauseSel(1); });
    // ⚠ 채팅 Enter는 `isPaused`·팝업일 때 열리지 않으므로 이 핸들러와 겹치지 않는다 (145차)
    this.input.keyboard!.on('keydown-ENTER', () => { if (this.isPaused) this.activatePauseSel(); });

    // M: 미니맵 / I: 인벤토리 / S: 스테이터스 / U: 활용 / E: 상호작용·장비
    // 155차 — M = 전체 지도 오버레이(휠 줌). 미니맵 크기는 타이틀바 [−][+]가 맡는다.
    this.input.keyboard!.on('keydown-M', () => { if (!this.isPaused) this.toggleFullMap(); });
    this.input.keyboard!.on('keydown-I', () => { if (!this.isPaused) this.toggleInventory(); });
    this.input.keyboard!.on('keydown-F1', (e: KeyboardEvent) => { e.preventDefault?.(); if (!this.isPaused) this.openHelpLibrary(); });
    this.input.keyboard!.on('keydown-S', () => { if (!this.isPaused) this.toggleStatus(); });
    this.input.keyboard!.on('keydown-U', () => { if (!this.isPaused) this.toggleUtilization('tackles'); });
    this.input.keyboard!.on('keydown-B', () => { if (!this.isPaused) this.toggleCooler(); });
    this.input.keyboard!.on('keydown-R', (e: KeyboardEvent) => {
      // 편집기가 열려 있으면 R = 배치 회전(자전거 승·하차보다 우선 — 106차)
      if (isMapEditorOpen()) { rotateEditorPlacement(e.shiftKey ? -1 : 1); return; }
      if (!this.isPaused && !this.uiBlocked) this.toggleBike();
    });
    // N: 도감 & 조과첩 (발견 도감 — 인게임 열람. 복귀는 stop+resume)
    this.input.keyboard!.on('keydown-N', () => {
      if (this.isPaused || this.uiBlocked) return;
      this.scene.pause();
      this.scene.launch('AnglerLogScene', { returnScene: 'RegionFieldScene' });
    });
    // E = 장비창 전용 · F = 상호작용 (122차 — 사용자 지시: E가 장비창과 혼용되던 것을 분리)
    this.input.keyboard!.on('keydown-E', () => { if (!this.isPaused) this.toggleEquipment(); });
    this.input.keyboard!.on('keydown-F', (ev: KeyboardEvent) => {
      if (this.isPaused || this.uiBlocked) return;
      if (this.tryPlaceQuestIceCrate()) return;
      // 160차 — 스토리 현장 지점은 NPC 대화보다 먼저 소비한다. 같은 장소에서
      // 도현수와 마주쳐도 증거 연출/기록/보고의 순서를 건너뛸 수 없다.
      if (this.nearStoryTrigger) { this.startStoryTrigger(this.nearStoryTrigger); return; }
      // 134차 — 스토리 NPC 대화가 최우선 (NPC 옆에 서 있으면 F = 대화)
      if (this.nearNpc) { this.openDialogue(this.nearNpc.npcId); return; }
      // 홈타운 오브젝트(문/버스/설치물) > 건물 거래 > 채집 스팟 > 통발
      //  Shift+F = 설치물 회수 (기능이 있는 설치물은 [F]가 기능을 연다 — 129차)
      if (this.nearObject) this.interactWithObject(this.nearObject, ev.shiftKey);
      else if (this.nearBuilding) this.promptTrade(this.nearBuilding.kind);
      // 138차 — 해안에 밀려온 불가사리는 채집 스팟보다 먼저 줍는다(발밑에 있는 게 우선)
      else if (this.nuisance?.gatherNear(this.playerBody.x, this.playerBody.y, TR * 1.4)) { /* 채집됨 */ }
      else if (this.forage?.onInteractKey()) { /* 채집 홀드 시작 */ }
      // 154차 — 화구는 [F] 요리 / [Shift+F] 회수 (129차 설치물 규칙과 동일)
      else if (this.stoveField?.onInteractKey(ev.shiftKey)) { /* 요리 패널 · 회수 확인 */ }
      else if (this.trapField?.onInteractKey()) { /* 통발 수거 확인 */ }
    });
    // L 면허 · K 스킬 · J 일지 (122차 복원)
    this.input.keyboard!.on('keydown-L', () => { if (!this.isPaused) this.togglePanel('license'); });
    this.input.keyboard!.on('keydown-K', () => { if (!this.isPaused) this.togglePanel('skill'); });
    this.input.keyboard!.on('keydown-J', () => { if (!this.isPaused) this.togglePanel('journal'); });

    // ── 145차 지역 채널 채팅 — Enter로 열고 Enter로 보낸다 ──
    this.input.keyboard!.on('keydown-ENTER', () => {
      if (this.isPaused || this.popupStack.length > 0 || this.hud?.isComposing) return;
      this.startCompose();
    });
    this.events.once('shutdown', () => this.endCompose());
    // T: 통발 놓기 (121차 — 보유 통발 + 미끼 선택 → 물 위 클릭 설치)
    this.input.keyboard!.on('keydown-T', () => {
      if (this.isPaused || this.uiBlocked) return;
      this.trapField?.openDeploy();
    });

    // 1~8: 퀵슬롯 선택 (팝업 열림 중엔 각 패널의 키 처리가 우선)
    const digitKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    digitKeys.forEach((key, i) => {
      this.input.keyboard!.on(`keydown-${key}`, () => {
        if (this.uiBlocked) return;
        GameState.updatePlayer({ activeQuickslotIndex: i });
        this.hud?.refreshQuickslots();
      });
    });

    // ── dev: F7 맵 편집기 · Ctrl+좌클릭 순간이동 · Ctrl+Z 되돌리기 ──
    if (import.meta.env.DEV && this.seamless) {
      this.input.keyboard!.on('keydown-F7', () => this.toggleMapEditor());
      this.input.keyboard!.on('keydown-Z', (e: KeyboardEvent) => {
        if (e.ctrlKey && isMapEditorOpen()) this.editUndoStroke();
      });
      // 배치 변환 단축키 — X/Y 반전 · O 겹침 허용 토글 (편집기 열림 중에만)
      this.input.keyboard!.on('keydown-X', () => { if (isMapEditorOpen()) flipEditorPlacement('x'); });
      this.input.keyboard!.on('keydown-Y', () => { if (isMapEditorOpen()) flipEditorPlacement('y'); });
      this.input.keyboard!.on('keydown-O', () => { if (isMapEditorOpen()) toggleEditorOverlap(); });
      this.input.keyboard!.on('keydown-ENTER', () => {
        if (isMapEditorOpen() && mapEditorState.mode === 'roadNew') this.editRoadNewCommit();
      });
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (this.editPainting && p.isDown) this.editApplyAt(p);
        if (isMapEditorOpen()) this.editDrawPreview(p);
        else this.editPreviewG?.clear();
      });
      this.input.on('pointerup', () => { if (this.editPainting) this.editFinishStroke(); });
      this.events.on('minimap-click', (nx: number, ny: number, ctrl: boolean) => {
        if (ctrl) this.devTeleport(nx * this.worldW, ny * this.worldH);
      });
    }

    // 좌클릭 차지 캐스팅 (바다 인접 + 낚싯대 슬롯) / 설치 모드 중엔 설치 확정
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (import.meta.env.DEV && this.seamless && isMapEditorOpen() && p.rightButtonDown() && mapEditorState.mode === 'road') {
        this.editRoadDelete(p);
        return;
      }
      if (import.meta.env.DEV && this.seamless && isMapEditorOpen() && p.rightButtonDown() && mapEditorState.mode === 'roadNew') {
        this.editRoadNewUndoPoint();
        return;
      }
      if (import.meta.env.DEV && this.seamless && p.leftButtonDown()) {
        const ev = p.event as MouseEvent | undefined;
        if (ev?.ctrlKey) { const w = this.pointerWorld(p); this.devTeleport(w.x, w.y); return; }
        if (isMapEditorOpen()) { this.editBeginStroke(p); return; }
      }
      // 입력 조건(117차 피드백 2): "맵(지면)을 직접 클릭했을 때"만 캐스팅/설치 시도다.
      //   HUD 버튼·단축키 버튼·팝업·일시정지 메뉴 등 인터랙티브 오브젝트 위 클릭(over.length > 0)은
      //   그 오브젝트의 몫이지 맵 클릭이 아니다 — 힌트("바다 가까이에서 캐스팅하세요")도 여기서 끊는다.
      if (over.length > 0) return;
      if (this.trapField?.placing) {
        if (p.rightButtonDown()) this.trapField.cancelPlacement();
        else if (p.leftButtonDown()) { const pw = this.pointerWorld(p); this.trapField.confirmAt(pw.x, pw.y); }
        return;
      }
      if (this.stoveField?.placing) {
        if (p.rightButtonDown()) this.stoveField.cancelPlacement();
        else if (p.leftButtonDown()) { const pw = this.pointerWorld(p); this.stoveField.confirmAt(pw.x, pw.y); }
        return;
      }
      if (this.placing) {
        if (p.rightButtonDown()) this.cancelPlacement();
        else if (p.leftButtonDown()) this.confirmPlacement(p);
        return;
      }
      if (this.uiBlocked || this.isPaused || this.time.now < this.suppressClickUntil) return;
      if (p.leftButtonDown()) this.tryStartCharge();
    });
    this.input.on('pointerup', () => this.releaseCast());

    // 인벤토리 '설치하기' → 설치 모드 진입 (홈타운 전용 — InvItem.placeKey)
    this.events.off('placement-request');
    this.events.on('placement-request', (item: InvItem) => this.startPlacement(item));
    // 인벤토리 '통발 놓기' (121차)
    this.events.off('trap-place-request');
    this.events.on('trap-place-request', (item: InvItem) => this.trapField?.openDeploy(item));
    // 인벤토리 '화구 설치' (154차)
    this.events.off('stove-place-request');
    this.events.on('stove-place-request', (item: InvItem) => this.stoveField?.openDeploy(item));
  }

  // ═══════════════════════════════════════════════════
  // 팝업 스택 관리 (ESC 최상단 우선 닫기)
  // ═══════════════════════════════════════════════════
  /** 패널을 만들어 씬/스택에 등록. factory는 close 콜백을 받아 패널을 생성 */
  private openPopup<T extends Phaser.GameObjects.Container>(
    factory: (close: () => void) => T,
    onClosed?: () => void,
  ): T {
    this.charging = false;
    this.chargeBar?.clear();

    let panel!: T;
    const close = (): void => {
      this.popupStack = this.popupStack.filter((e) => e.panel !== panel);
      panel.destroy();
      onClosed?.();
      this.hud?.refreshQuickslots();
      // 닫기 클릭이 씬 pointerdown으로 이어져 캐스팅을 시도하지 않도록 유예
      this.suppressClickUntil = this.time.now + 250;
    };
    panel = factory(close);
    this.add.existing(panel);
    // 새로 연 팝업은 밴드 최상단 (122차 — 스킬 892 위에 일지 891이 열리면 통째로 가려졌다)
    if (panel instanceof DraggablePanel) panel.raiseToTop();
    this.popupStack.push({ panel, close });
    return panel;
  }

  /** 최상단(가장 나중에 열린) 팝업 닫기. 닫은 게 있으면 true */
  private closeTopPopup(): boolean {
    if (!this.popupStack.length) return false;
    // ESC = "시각적 최상단(포커스)" 팝업부터 (76차 — 클릭 포커스로 z순서가 바뀌면
    //  열림 순서(LIFO)와 어긋나므로 depth 최고 = 사용자가 보고 있는 패널을 닫는다.
    //  depth 동률이면 나중에 연 것(스택 뒤쪽) 우선 = 기존 LIFO와 동일).
    const top = this.popupStack.reduce((a, b) => (b.panel.depth >= a.panel.depth ? b : a));
    // 패널이 자식 팝업(도마 손질 등)을 먼저 닫아야 하면 ESC를 위임한다 —
    //  구 동작은 U패널을 통째로 destroy해 진행 중 손질의 부산물 레저가 조용히 소실됐다
    const intercept = top.panel as unknown as { onEscIntercept?: () => boolean };
    if (intercept.onEscIntercept?.()) return true;
    top.close();
    return true;
  }

  // ── 인벤토리 (I) ──
  private toggleInventory(atX?: number): void {
    if (this.invPanel) {
      const entry = this.popupStack.find((e) => e.panel === this.invPanel);
      entry?.close();
      return;
    }
    const x = atX ?? (GAME_WIDTH - 440) / 2;
    this.invPanel = this.openPopup(
      (close) => new InventoryPanel(this, x, 60, {
        onClose: close,
        onOpenDetail: (item) => this.openItemDetail(item),
        onOpenTackle: () => this.toggleUtilization('tackles', true),
      }),
      () => { this.invPanel = null; },
    );
  }

  // ── 스테이터스 (S) ──
  private toggleStatus(): void {
    if (this.statusPanel) {
      this.popupStack.find((e) => e.panel === this.statusPanel)?.close();
      return;
    }
    this.statusPanel = this.openPopup(
      (close) => new StatusPanel(this, 80, 80, close),
      () => { this.statusPanel = null; },
    );
  }

  // ── 면허(L) · 스킬(K) · 일지(J) — 토글 (122차) ──
  private togglePanel(kind: 'license' | 'skill' | 'journal'): void {
    const cur = kind === 'license' ? this.licensePanel : kind === 'skill' ? this.skillPanel : this.journalPanel;
    if (cur) { this.popupStack.find((e) => e.panel === cur)?.close(); return; }
    if (kind === 'license') {
      this.licensePanel = this.openPopup((close) => new LicensePanel(this, (GAME_WIDTH - 720) / 2, 100, close), () => { this.licensePanel = null; });
    } else if (kind === 'skill') {
      this.skillPanel = this.openPopup((close) => new SkillTreePanel(this, { onClose: close }), () => { this.skillPanel = null; });
    } else {
      this.journalPanel = this.openPopup((close) => new JournalPanel(this, { onClose: close }), () => { this.journalPanel = null; });
    }
  }

  // ── 장비 (E) ──
  /** 도움말 라이브러리 열기/토픽 이동 (116차) — 일반 팝업 밴드(890) · ESC LIFO 편입 */
  private openHelpLibrary(topic?: string): void {
    if (this.helpPanel) {
      if (topic) this.helpPanel.showTopic(topic);
      else this.popupStack.find((e) => e.panel === this.helpPanel)?.close();
      return;
    }
    this.helpPanel = this.openPopup(
      (close) => new HelpLibraryPanel(this, { onClose: close, initialTopic: topic }),
      () => { this.helpPanel = null; },
    );
  }

  private toggleEquipment(): void {
    if (this.equipPanel) {
      this.popupStack.find((e) => e.panel === this.equipPanel)?.close();
      return;
    }
    // 인체 배치형 장비창(382×674) — 세로가 길어 상단 22에 배치 (하단 696 ≤ 720)
    this.equipPanel = this.openPopup(
      (close) => new EquipmentPanel(this, GAME_WIDTH - 420, 22, close,
        () => { this.hud?.refreshQuickslots(); this.refreshCharacterLook(); }),
      () => { this.equipPanel = null; },
    );
  }

  /**
   * 배타적 플레이어 액션 잠금 — 진행 중엔 이동/자전거 승·하차/다른 액션 시작이 막힌다.
   * 현재는 낚시 캐스팅(차지~탄도 비행~1인칭 진입 전)만 해당.
   * ⚠️ 추후 해루질/채집 등 새 액션을 추가할 때는 액션별 진행 상태를 이 getter에
   * OR로 편입시켜 액션 간 독립성(동시 진행 금지)을 유지할 것 — 상태 플래그를
   * 별도로 두지 말고 각 액션의 원 상태(charging/castProj 등)에서 파생시킨다.
   */
  private get playerActionLocked(): boolean {
    return this.charging || this.castProj !== null;
  }

  // ── 자전거 (R) — 승·하차 토글, 탑승 중 이동 속도 2배 ──
  private toggleBike(): void {
    if (this.playerActionLocked) {
      this.floatingHint('낚시 중에는 자전거를 탈 수 없습니다');
      return;
    }
    // 자전거는 인벤토리(기타)에 보유해야 탈 수 있다
    if (!GameState.isMounted && !InventoryStore.find('inv_bike')) {
      this.floatingHint('자전거가 없습니다 — 자전거(기타 인벤토리)를 보유해야 탈 수 있습니다');
      return;
    }
    GameState.isMounted = !GameState.isMounted;
    if (GameState.isMounted) StoryStore.event({ kind: 'custom', key: 'bikeMount' });   // 134차 — M1-10 자전거 목표
    this.bike?.setVisible(GameState.isMounted);
    this.hud?.pushLog(GameState.isMounted
      ? '[이동] 자전거에 탔습니다 — 이동 속도 2배 (R: 내리기)'
      : '[이동] 자전거에서 내렸습니다.');
  }

  /** 하위 씬(낚시/상점 등) 진입 시 자동 하차 — 실내/낚시 중 자전거 금지 */
  private dismountBike(): void {
    if (!GameState.isMounted) return;
    GameState.isMounted = false;
    this.bike?.setVisible(false);
  }

  // ── 어창/쿨러 (B) — 보관 어획 확인·이송·방생 (낚시 종료 후에도 상시 사용) ──
  private toggleCooler(): void {
    if (this.coolerPanel) {
      this.popupStack.find((e) => e.panel === this.coolerPanel)?.close();
      return;
    }
    if (!InventoryStore.hasCooler()) {
      this.floatingHint('쿨러가 없습니다 — 기타 아이템에 쿨러(아이스박스)가 필요합니다');
      return;
    }
    this.coolerPanel = this.openPopup(
      // 해수 넣기는 물가(캐스팅 가능 근접 판정과 동일) 에서만 가능
      (close) => new CoolerPanel(this, { onClose: close, isNearSea: () => this.nearWater }),
      () => { this.coolerPanel = null; },
    );
  }

  // ── 활용 (U) — 요리하기/채비하기 탭 ──
  private toggleUtilization(tab: UtilizationTab, forceOpen = false): void {
    if (this.utilPanel) {
      if (!forceOpen) {
        this.popupStack.find((e) => e.panel === this.utilPanel)?.close();
        return;
      }
      this.popupStack.find((e) => e.panel === this.utilPanel)?.close();
    }
    this.utilPanel = this.openPopup(
      (close) => new UtilizationPanel(this, close, tab),
      () => { this.utilPanel = null; },
    );
  }

  // ── 아이템 상세보기 ──
  private openItemDetail(item: InvItem): void {
    this.openPopup((close) => new ItemDetailPanel(this, item, 180 + this.popupStack.length * 24, 100 + this.popupStack.length * 24, close));
  }

  // ═══════════════════════════════════════════════════
  // 상점 (건물 근접 E → 거래 확인 → 상점+인벤토리 나란히)
  // ═══════════════════════════════════════════════════
  private promptTrade(kind: BuildingKind): void {
    StoryStore.event({ kind: 'visit', placeKey: 'shop:any' });   // 134차 — M1-02 상점 UI 목표
    this.openPopup((close) => new ConfirmDialog(
      this,
      `${BUILDING_LABEL[kind]}에 들어갑니다.\n상품을 거래하시겠습니까?`,
      () => { close(); this.openShop(kind); },
      close,
    ));
  }

  private openShop(kind: BuildingKind): void {
    if (this.shopPanel) return;
    this.dismountBike();   // 실내(상점)에선 자전거에서 내린다
    const shop = SHOP_CATALOG[kind];

    // 좌측: 상점 / 우측: 인벤토리
    this.shopPanel = this.openPopup(
      (close) => new ShopPanel(this, 40, 60, shop, {
        onClose: close,
        onBuy: (entry) => this.handleBuy(entry),
        onSell: (item) => this.handleSell(item),
        onOpenDetail: (itemLike) => this.openItemDetail({ slot: 0, qty: 1, ...itemLike } as InvItem),
        onConsign: (inputs) => this.openConsignment(inputs),
      }),
      () => { this.shopPanel = null; },
    );
    if (!this.invPanel) this.toggleInventory(GAME_WIDTH - 470);
    this.hud?.pushLog(`[상점] ${shop.name} 이용 시작`);
  }

  // ── 위판 (147차) ───────────────────────────────────
  /**
   * 출품 → 경매 회차 개설 → 현장 패널. 정산은 패널이 `onSettle`로 돌려준다.
   *
   * 한 회차는 카테고리 하나(활어 / 선어)만 다룬다 — 실제 위판장의 개장 시간이
   * 그렇게 갈린다(선어 01~03시 · 활어 03~07시). 지금 열려 있지 않은 쪽을 골랐으면
   * 남겨 두고 열린 쪽만 올린다.
   */
  private openConsignment(inputs: ConsignInput[]): void {
    if (inputs.length === 0) return;
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60_000);
    const h = kst.getHours(), m = kst.getMinutes(), wd = kst.getDay();

    const openCat = (['fish_live', 'fish_fresh'] as const).find((c) => isConsignmentOpen(c, h, m, wd));
    if (!openCat) {
      this.shopPanel?.setStatus('지금은 파장입니다 — 선어는 01~03시, 활어는 03~07시에 경매가 섭니다.');
      return;
    }
    const going = inputs.filter((i) => i.category === openCat);
    const left = inputs.length - going.length;
    if (going.length === 0) {
      this.shopPanel?.setStatus(`지금은 ${openCat === 'fish_live' ? '활어' : '선어'} 경매 시간입니다 — 고른 물건은 다음 회차에 올리세요.`);
      return;
    }

    const rep = StoryStore.harborRep(GameState.currentRegionId);
    const session = openConsignmentSession(openCat, buildConsignmentLots(going), h, m, wd, rep);
    if (!session) { this.shopPanel?.setStatus('경매를 열 수 없습니다.'); return; }

    if (left > 0) this.shopPanel?.setStatus(`${left}건은 경매 시간이 달라 남겨 두었습니다.`);
    this.openPopup((close) => new AuctionHousePanel(this, session, {
      onClose: close,
      onSettle: (result) => this.settleConsignment(result),
    }));
  }

  /** 정산 — 낙찰분만 인벤에서 빠지고 실수령액이 들어온다. 유찰분은 그대로 남는다(회수) */
  private settleConsignment(result: ConsignmentSettlement): void {
    let sold = 0;
    for (const row of result.perLot) {
      if (row.status !== 'sold') continue;
      sold++;
      InventoryStore.removeItem(row.sourceItemId, false);
      // 위판은 정당한 수입이라 조용히 넣지 않는다 — `earn` 목표에 그대로 잡힌다(146차 quiet는 거래 전용)
      StoryStore.event({ kind: 'sell' });
    }
    if (result.netWon > 0) GameState.addCoins(result.netWon);
    this.events.emit('inventory-changed');
    this.shopPanel?.refresh();
    this.hud?.pushLog(`[위판] 낙찰 ${result.soldLots}건 · 유찰 ${result.unsoldLots}건 — 실수령 ${result.netWon.toLocaleString()}원 (수수료 ${result.feeWon.toLocaleString()}원)`);
    if (sold > 0) this.shopPanel?.setStatus(`위판 완료 — ${result.netWon.toLocaleString()}원이 입금되었습니다.`);
    else this.shopPanel?.setStatus('전부 유찰되었습니다 — 물건은 그대로 돌려받았습니다.');
  }

  /** 구매 플로우: (수량 지정) → 확인 → 재화 차감 + 인벤토리 추가 */
  private handleBuy(entry: ShopEntry): void {
    const confirmBuy = (qty: number): void => {
      // 스킬 흥정(122차): 랭크당 구매가 -3%
      const total = Math.round(entry.price * qty * (1 - 0.03 * GameState.skillRank('eco_haggle')));
      this.openPopup((close) => new ConfirmDialog(
        this,
        `${entry.name} ${qty}개를 구매하시겠습니까?\n소요 재화: ${total.toLocaleString()} 원`,
        () => {
          close();
          if (GameState.player.inventory.coins < total) {
            this.shopPanel?.setStatus('재화가 부족합니다.');
            return;
          }
          if (!InventoryStore.addItem(entry, qty)) {
            this.shopPanel?.setStatus('인벤토리 소켓이 가득 찼습니다.');
            return;
          }
          GameState.addCoins(-total);
          this.events.emit('inventory-changed');
          this.shopPanel?.refresh();
          this.shopPanel?.setStatus(`${entry.name} x${qty} 구매 완료 (-${total.toLocaleString()}원)`);
          this.hud?.pushLog(`[구매] ${entry.name} x${qty} (-${total.toLocaleString()}원)`);
          // 135차 — 구매를 스토리 목표로 쓸 수 있게 이벤트를 흘린다 (M1-04 사이소 저가 장비 등)
          StoryStore.event({ kind: 'custom', key: `buy:${entry.id}` });
        },
        close,
      ));
    };

    if (entry.maxPerPurchase > 1) {
      this.openPopup((close) => new QuantityDialog(this, {
        itemName: entry.name,
        unitPrice: entry.price,
        maxQty: entry.maxPerPurchase,
        actionLabel: '구매',
        onConfirm: (qty) => { close(); confirmBuy(qty); },
        onCancel: close,
      }));
    } else {
      confirmBuy(1);
    }
  }

  /** 판매 플로우: (수량 지정) → 확인 → 아이템 차감 + 재화 지급 */
  private handleSell(item: InvItem): void {
    // 쿨러는 내용물(어획/해수·얼음/밑밥)이 남아 있으면 판매 불가 (유실 방지)
    if (item.id === 'inv_cooler'
      && (CoolerStore.count() > 0 || CoolerStore.medium !== 'none' || CoolerStore.chumRemaining > 0)) {
      this.shopPanel?.setStatus('쿨러 안에 내용물(어획/해수·얼음/밑밥)이 있어 판매할 수 없습니다 — 먼저 비우세요');
      return;
    }
    const unit = this.sellPriceOf(item);
    const confirmSell = (qty: number): void => {
      const total = unit * qty;
      this.openPopup((close) => new ConfirmDialog(
        this,
        `${item.name} ${qty}개를 판매하시겠습니까?\n획득 재화: ${total.toLocaleString()} 원`,
        () => {
          close();
          if (!InventoryStore.removeQty(item.id, qty)) {
            this.shopPanel?.setStatus('판매 수량이 부족합니다.');
            return;
          }
          GameState.addCoins(total);
          this.events.emit('inventory-changed');
          this.shopPanel?.refresh();
          this.shopPanel?.setStatus(`${item.name} x${qty} 판매 완료 (+${total.toLocaleString()}원)`);
          this.hud?.pushLog(`[판매] ${item.name} x${qty} (+${total.toLocaleString()}원)`);
        },
        close,
      ));
    };

    if (item.qty > 1) {
      this.openPopup((close) => new QuantityDialog(this, {
        itemName: item.name,
        unitPrice: unit,
        maxQty: item.qty,
        actionLabel: '판매',
        onConfirm: (qty) => { close(); confirmSell(qty); },
        onCancel: close,
      }));
    } else {
      confirmSell(1);
    }
  }

  private tryStartCharge(): void {
    if (this.castBusy || this.isTransitioning || this.uiBlocked) return;
    // 자전거 탑승 중엔 낚시 액션 자체가 발동하지 않는다 (안내 없이 무시 — 내려야 가능)
    if (GameState.isMounted) return;
    // ── 장비 게이팅이 **최우선** (사용자 지시 2026-08-05) ──
    //  손에 낚싯대가 없으면 애초에 캐스팅 시도가 아니다 → 안내 없이 무시.
    //  (구 구현은 물가 판정을 먼저 해서, 낚싯대가 없어도 아무 데나 클릭하면
    //   "바다 가까이에서 캐스팅하세요"가 떴다.)
    const rod = InventoryStore.getEquippedRod();
    if (!rod) {
      // 퀵슬롯에 낚싯대를 올려둔 상태 = 낚시 의도 → 착용 안내만 제공
      const activeId = InventoryStore.quickslots[GameState.player.activeQuickslotIndex];
      const activeItem = activeId ? InventoryStore.find(activeId) : undefined;
      if (activeItem?.tool === 'rod') {
      }
      return;
    }
    // 136차 — 고장난 장비 게이트: 부러진 대·엉킨 스풀로는 던질 수 없다
    const broken = [rod, InventoryStore.equippedReel, InventoryStore.rigFloat]
      .find((it) => it?.fault && !gearUsable(it.fault));
    if (broken?.fault) {
      const def = GEAR_FAULTS[broken.fault];
      this.floatingHint(`${broken.name} — ${def.labelKo}. ${def.fixKo}`);
      return;
    }
    // 구멍치기는 발밑 블록 틈에 그대로 내리는 조법이라 "바다 인접" 판정과 무관하다
    //  (테트라포드 안쪽 상판에 서 있어도 발밑에 구멍이 있다).
    if (!this.nearWater && !this.holeSpot) {
      this.floatingHint('바다 가까이에서 캐스팅하세요');
      return;
    }
    // 채비 완성도 게이트: 필수 부품(원줄/찌/목줄/바늘·미끼)이 모두 장착되어야 캐스팅 가능
    const missing = InventoryStore.getMissingRigParts();
    if (missing.length > 0) {
      this.floatingHint(`채비가 불완전합니다 — ${missing.join(', ')} 장착 필요 (U 채비하기)`);
      return;
    }
    this.charging = true;
    this.chargeDownAt = this.time.now;
    this.chargePower = 0;
    if (!this.chargeBar) this.chargeBar = this.add.graphics().setDepth(30);
    if (!this.aimG) this.aimG = this.add.graphics().setDepth(29);
  }

  /**
   * 149차 — 플레이어가 선 자리의 어획 장소 종류 (퀘스트 장소 조건 판정용).
   * 방파제 단면 분류(0 안벽·1 상판·2 피복·3 사석)가 있거나 부두 타일이면 방파제로 본다.
   */
  private standingSpotKind(): StorySpotKind {
    const c = Math.floor(this.playerBody.x / TR);
    const r = Math.floor(this.playerBody.y / TR);
    const k = this.chunks?.breakwaterClassAt(c, r) ?? 0;
    if (k > 0 || this.terrainAt(c, r) === 'pier') return 'breakwater';
    return 'shore';
  }

  /**
   * 149차 — 발밑 구멍치기 판정. 플레이어가 선 타일(또는 인접 타일)이 방파제 **피복(2)·사석(3)**이면
   * 그 자리가 곧 구멍이다. 단면 분류는 114차부터 있던 `breakwaterClassAt`을 그대로 쓴다.
   */
  private updateHoleSpot(): void {
    if (!this.chunks) { this.holeSpot = null; this.holeTile = null; return; }
    const c = Math.floor(this.playerBody.x / TR);
    const r = Math.floor(this.playerBody.y / TR);
    // 선 타일 우선 — 없으면 4방 인접(상판 가장자리에 서서 옆 블록 틈에 내리는 경우)
    const cells: Array<[number, number]> = [[c, r], [c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
    for (const [cc, rr] of cells) {
      const kind = holeKindOfBreakwaterClass(this.chunks.breakwaterClassAt(cc, rr));
      if (!kind) continue;
      // 같은 구멍이면 다시 계산하지 않는다 — 매 프레임 도는 판정이다
      if (this.holeSpot && this.holeTile?.c === cc && this.holeTile.r === rr) return;
      const seed = ((cc * 73856093) ^ (rr * 19349663)) >>> 0;
      const shoreDepthM = this.resolveCastDepth(TUNING.hole.distanceM + 2, true);
      this.holeSpot = evaluateHoleSpot({
        kind, seed, shoreDepthM,
        tideLevel01: Math.min(1, Math.max(0, calculateTideInfo().currentStrength)),
      });
      this.holeTile = { c: cc, r: rr };
      return;
    }
    this.holeSpot = null;
    this.holeTile = null;
  }

  /**
   * 구멍치기 진입 — 캐스팅 비행이 없다. 채비를 그대로 내리고 1인칭으로 넘어간다.
   * 블록 위는 젖으면 미끄럽다 — 파고가 높으면 발을 헛디뎌 진입이 무산되고 체력을 잃는다.
   */
  private enterHoleFishing(): void {
    const hole = this.holeSpot;
    if (!hole || this.castBusy || this.isTransitioning) return;
    // 미끄러짐 — 파고 반영 (테트라포드 안전, M1-04 학습 태그)
    const waveM = ExternalDataStore.getWaveHeightM(this.region) ?? 0.5;
    if (Math.random() < holeSlipChance(hole, waveM)) {
      const lost = Math.max(4, Math.round(GameState.player.stamina * 0.12));
      GameState.player.stamina = Math.max(1, GameState.player.stamina - lost);
      this.floatingHint('블록을 헛디뎠습니다 — 발밑을 확인하세요');
      this.hud?.pushLog(`[안전] 테트라포드에서 미끄러졌습니다 (체력 -${lost}). 파고가 높으면 올라서지 마세요.`);
      return;
    }
    const warn = holeGearWarning(InventoryStore.getEquippedRod()?.basePrice);
    if (warn) this.hud?.pushLog(`[구멍치기] ${warn.ko}`);
    this.castBusy = true;
    this.hud?.pushLog(`[구멍치기] ${hole.labelKo} 틈에 채비를 내립니다 — 구멍 수심 ${hole.depthM.toFixed(1)}m`);
    this.fadeOutThen(() => {
      this.dismountBike();
      MultiplayerClient.setActivity('fishing');
      this.scene.pause();
      this.scene.launch('FirstPersonFishingScene', {
        zMaxM: hole.depthM,
        castDistanceM: hole.distanceM,
        reefSeed: ((this.holeTile?.c ?? 0) * 73856093) ^ ((this.holeTile?.r ?? 0) * 19349663),
        region: this.region,
        shoreKind: 'gravel' as const,
        hole,
      });
    }, 260, false);
  }

  /**
   * 캐스팅 시점의 날씨 계수 (127차 — SPEC §3-3 + 사용자 지시).
   * 풍속 `TUNING.castWeather.calmMs`(3m/s) 이하면 전부 1배 = 아무 영향 없음.
   */
  private castWeather(aim?: { x: number; y: number }): CastWeatherEffect {
    const env = GameState.environment.environment;
    const kma = ExternalDataStore.getKmaWeather(this.region);
    const marine = ExternalDataStore.getRegionMarineWeather(this.region);
    const speed = kma?.windSpeedMs ?? marine?.windSpeedMs ?? env?.weather.windSpeedMs ?? 0;
    const fromDeg = kma?.windDirectionDeg ?? env?.weather.windDirectionDeg ?? 0;
    return computeCastWeather({
      windSpeedMs: speed,
      windFromDeg: fromDeg,
      weatherKind: ExternalDataStore.getWeatherKind(this.region),
      rain1hMm: kma?.rain1hMm,
      windComp: GameState.skillBonus('wind_comp'),   // 바람 읽기(fish_wind) — 상한은 core
    }, aim);
  }

  /**
   * 비행 중 바람 가속 (px/s²) — **횡 성분만**.
   * 맞바람의 비거리 손실은 `distanceMult`가 발사 속도에서 처리하므로 여기서 또 빼면 이중 계산이다.
   */
  private windForce(eff: CastWeatherEffect): WindVector {
    const g = 260;   // 횡풍 강도 게인 (crossWind는 0~driftMax 비율값)
    return { x: eff.crossWind.x * g, y: eff.crossWind.y * g };
  }

  private releaseCast(): void {
    if (!this.charging) return;
    this.charging = false;
    const power = this.chargePower;
    const heldMs = this.time.now - this.chargeDownAt;
    this.chargeBar?.clear();
    this.aimG?.clear();
    // 149차 — 발밑에 구멍이 있으면 **짧은 탭 = 구멍치기 / 꾹 누르기 = 캐스팅**.
    //  (탭/홀드 문법은 1인칭 호핑·릴링과 동일 — 새 단축키를 만들지 않는다)
    if (this.holeSpot && heldMs < TUNING.hole.tapMs) { this.enterHoleFishing(); return; }
    this.startCastFlight(this.lastAimDir, power);
  }

  /** 비행 중 채비가 화면 밖으로 나가면 카메라가 좇는다 (127차 P6) */
  private updateCastCamera(): void {
    const b = this.castBobber;
    if (!b) return;
    const cam = this.cameras.main;
    const v = cam.worldView;
    const m = 90;   // 가장자리 여유 — 이 안쪽이면 굳이 카메라를 흔들지 않는다
    const outside = b.x < v.x + m || b.x > v.right - m || b.y < v.y + m || b.y > v.bottom - m;
    if (!outside && !this.castCamFollow) return;
    if (!this.castCamFollow) { this.castCamFollow = true; cam.stopFollow(); }
    cam.scrollX += (b.x - cam.width / 2 - cam.scrollX) * 0.15;
    cam.scrollY += (b.y - cam.height / 2 - cam.scrollY) * 0.15;
  }

  /** 카메라를 플레이어 추적으로 되돌린다 (착수 홀드 후·회수·복귀 공통) */
  private restoreCamFollow(): void {
    if (!this.castCamFollow) return;
    this.castCamFollow = false;
    this.cameras.main.startFollow(this.playerBody, true, 0.14, 0.14);
  }

  /**
   * 3D 탄도 캐스팅 발사 — 조준 방향(마우스) × 파워 × 완력 + 바람/공기저항.
   * 그림자는 (x, y) 평면을 미끄러지고, 찌는 y - z 보정으로 포물선 비행.
   */
  private startCastFlight(dir: { x: number; y: number }, power: number): void {
    this.castBusy = true;
    const originX = this.playerBody.x;
    const originY = this.playerBody.y;

    // 125차 — 캐스팅 1회 행동 비용. 130차 (c) '요령'이 터지면 이번 캐스팅은 공짜다(로그로만 알린다).
    if (GameState.applyVitalsAction('cast')) this.hud?.pushLog('[요령] 힘을 아껴 캐스팅했습니다');

    // 127차 — 날씨: 맞바람이면 비거리가 줄고, 옆바람이면 비행 중 횡으로 휜다.
    //   착수 무작위 산포는 착수 판정(finishCast) 시점에 적용한다.
    const eff = this.castWeather(dir);
    this.castWeatherEff = eff;
    GameState.addProficiency('cast');   // 140차 — 롱캐스트·정투·원투·스풀 숙련은 던져야 는다
    this.castProj = launchCast({
      originX, originY,
      dirX: dir.x, dirY: dir.y,
      power,
      // 스킬 롱캐스트(122차)
      strength: DEFAULT_ANGLER_STATS.strength * GameState.skillMult('cast_distance'),
      // 날씨 비거리 배율(127차) — 완력이 아니라 **수평 속도 전체**에 곱한다
      speedMult: eff.distanceMult,
      wind: this.windForce(eff),
      // 채비 공기저항(루어 dragCoefficient/봉돌 종류) → 비거리 (메탈지그 초장타)
      airDragCd: InventoryStore.getRigDragCd(),
    });

    // 그림자 / 찌 이원화
    this.castShadow = this.add.ellipse(originX, originY, 10, 5, 0x000000, 0.3).setDepth(21);
    this.castBobber = this.add.circle(originX, originY - 6, 4, 0xff5252).setStrokeStyle(1, 0xffffff).setDepth(23);
    if (!this.castLineG) this.castLineG = this.add.graphics().setDepth(22);

    this.floatingHint(`캐스팅! 파워 ${Math.round(power * 100)}%`);
    const wl = castWeatherLabelKo(eff);
    this.hud?.pushLog(`[낚시] 캐스팅 — 파워 ${Math.round(power * 100)}%${wl ? ` · ${wl}` : ''}`);
  }

  /** 캐스팅 비행 1프레임 진행 (update 루프에서 호출) */
  private stepCastFlight(deltaMs: number): void {
    const proj = this.castProj;
    if (!proj || !this.castShadow || !this.castBobber) return;

    stepCast(proj, Math.min(0.05, deltaMs / 1000));

    // 그림자: 순수 XY / 찌: y - z 보정 (포물선)
    this.castShadow.setPosition(proj.x, proj.y);
    const shadowScale = Math.max(0.4, 1 - proj.z / 260);
    this.castShadow.setScale(shadowScale);
    this.castBobber.setPosition(proj.x, proj.y - proj.z);

    // 원줄
    this.castLineG?.clear();
    this.castLineG?.lineStyle(1.2, 0xf0f0f0, 0.85);
    this.castLineG?.lineBetween(
      this.playerBody.x, this.playerBody.y + this.PLAYER_FOOT_OFFSET - 22,
      this.castBobber.x, this.castBobber.y,
    );

    // ── 카메라 팔로우 (127차 P6 — SPEC §3-1) ──
    //   예상 착수점이 뷰포트 밖이면 캐스팅 중 카메라가 채비를 lerp로 좇는다.
    //   심리스 카메라 bounds는 그대로라 맵 밖으로는 나가지 않는다.
    this.updateCastCamera();

    if (!proj.landed) return;

    // ── 착수 판정 (z <= 0) ──
    this.castProj = null;
    // 착수 후 0.4초 홀드 뒤 플레이어 추적 복귀 (1인칭 인계 시엔 resume에서 복귀)
    if (this.castCamFollow) this.time.delayedCall(400, () => this.restoreCamFollow());

    // 127차 — 무작위 산포: 조준한 그대로 꽂히지 않는다. 거리 비례 + 날씨 가산 − 정투(fish_scatter).
    //   조준 미리보기(궤적 마커)는 **평균 착수점**을 보여주고, 실제 착수는 이 반경 안에서 흩어진다.
    const eff = this.castWeatherEff;
    const flightDist = Math.hypot(proj.x - this.playerBody.x, proj.y - this.playerBody.y);
    const radius = castScatterRadius(flightDist, eff?.scatterMult ?? 1, GameState.skillMult('cast_scatter'));
    if (radius > 0.5) {
      const aim = { x: (proj.x - this.playerBody.x) / (flightDist || 1), y: (proj.y - this.playerBody.y) / (flightDist || 1) };
      const p2 = applyCastScatter({ x: proj.x, y: proj.y }, aim, radius);
      proj.x = p2.x; proj.y = p2.y;
      this.castShadow?.setPosition(proj.x, proj.y);
      this.castBobber?.setPosition(proj.x, proj.y - 6);
    }
    this.castWeatherEff = undefined;

    const col = Math.floor(proj.x / TR);
    const row = Math.floor(proj.y / TR);

    if (this.terrainAt(col, row) !== 'water') {
      // 육지 착지 — 회수. 136차: 뭍·바위를 때린 찌는 절반 확률로 깨진다(사용자 지시)
      const cracked = this.rollFloatImpact();
      this.floatingHint(cracked ? '찌가 바위에 부딪혀 깨졌습니다' : '육지에 떨어졌습니다 — 바다를 조준하세요');
      if (cracked) this.hud?.pushLog('[장비] 찌가 깨졌습니다 — 여유분으로 교체하세요.');
      this.retrieveCastToPlayer();
      return;
    }

    // ── 라인 경로 육지 통과 검사 — 릴링 시 줄이 땅에 쓸리는 캐스팅 차단 ──
    // (예: 우측 바다 경계에서 반대편 바다로 곶/방파제를 가로질러 던진 경우)
    if (this.castPathCrossesLand(col, row)) {
      this.floatingHint('잘못된 캐스팅입니다 — 릴링 경로가 육지에 걸립니다');
      this.hud?.pushLog('[낚시] 잘못된 캐스팅 — 캐스팅 과정에서 땅에 쓸리게 되므로 회수합니다.');
      this.retrieveCastToPlayer();
      return;
    }

    const ripple = this.add.circle(proj.x, proj.y, 3, 0x000000, 0).setStrokeStyle(2, 0xdff0ff, 0.9).setDepth(21);
    this.tweens.add({ targets: ripple, scale: 4, alpha: 0, duration: 700, onComplete: () => ripple.destroy() });

    // 138차 — 착수점에 해파리·불가사리가 걸리면 **씬 전환 없이** 훌치기로 끌어온다.
    //   (사용자 지시: 1인칭 전환이 아니라 던져진 라인을 릴링해 수거하는 느낌)
    if (this.nuisance?.tryHook(proj.x, proj.y)) {
      this.clearCastFlight();
      return;
    }

    // 착수 파문 → 1인칭 낚시 뷰 진입
    this.hud?.pushLog('[낚시] 착수! 1인칭 낚시 모드 진입');
    this.time.delayedCall(420, () => this.enterFirstPersonFishing(proj.x, proj.y, col, row));
  }

  /**
   * 136차 — 뭍·바위 충돌 시 찌 파손 판정 (기본 50%, 고급 찌일수록 낮다).
   * 깨진 찌는 수리할 수 없다 — 버리고 여유분으로 교체한다.
   */
  private rollFloatImpact(): boolean {
    // 루어 채비도 같은 충돌을 받는다 — 아이가 휘고 훅이 무뎌진다(사용 가능·입질 저하)
    const lure = InventoryStore.rigLure;
    if (lure && !lure.fault) {
      const pl = gearFaultChance({
        fault: 'lure_damaged', basePrice: lure.basePrice ?? GEAR_REF_PRICE.lure, refPrice: GEAR_REF_PRICE.lure,
      });
      if (Math.random() < pl) InventoryStore.setFault(lure, 'lure_damaged');
    }
    const fl = InventoryStore.rigFloat;
    if (!fl || fl.fault) return false;
    const p = gearFaultChance({
      fault: 'float_cracked', basePrice: fl.basePrice ?? GEAR_REF_PRICE.float, refPrice: GEAR_REF_PRICE.float,
    });
    if (Math.random() >= p) return false;
    return InventoryStore.setFault(fl, 'float_cracked');
  }

  /**
   * 플레이어→착수점 라인이 중간에 육지를 가로지르는지 검사 (타일 격자 레이캐스트).
   *
   * 낚싯줄은 릴링 중 플레이어와 채비를 잇는 직선을 따라 끌려오므로,
   * 경로 중간에 육지(곶/방파제 등)가 끼면 줄이 땅에 쓸린다 — 이런 캐스팅은 무효.
   * 캐스터는 육지에 서 있으므로 **발밑 쪽 선행 육지 구간은 허용**하고,
   * 한 번 물에 진입한 뒤 다시 육지가 나오면 차단으로 판정한다.
   */
  private castPathCrossesLand(landCol: number, landRow: number): boolean {
    const pc = Math.floor(this.playerBody.x / TR);
    const pr = Math.floor((this.playerBody.y + this.PLAYER_FOOT_OFFSET) / TR);

    // Bresenham — 플레이어 타일 → 착수 타일
    let x = pc, y = pr;
    const dx = Math.abs(landCol - pc), dy = Math.abs(landRow - pr);
    const sx = pc < landCol ? 1 : -1, sy = pr < landRow ? 1 : -1;
    let err = dx - dy;

    let enteredWater = false;
    for (let guard = 0; guard < 4096; guard++) {
      if (x === landCol && y === landRow) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }

      const isWater = this.terrainAt(x, y) === 'water';
      if (isWater) enteredWater = true;
      // 물에 진입한 이후 다시 육지를 만나면 — 릴링 경로가 땅에 걸리는 구조
      else if (enteredWater && !(x === landCol && y === landRow)) return true;
    }
    return false;
  }

  /** 피딩타임 활성도 갱신 (계절 시간창 × 물때 × 날씨 — 필드 이벤트 발생 확률 입력) */
  private refreshFieldFeeding(): void {
    this.fieldFeeding = this.feedingAt(Date.now());
  }

  /**
   * 그 시각의 피딩 활성도. **인자로 시각을 받는 이유**(145차):
   * 필드 이벤트 스케줄이 "슬롯 시작 시각"의 값을 물어야, 중간에 접속한 사람도
   * 먼저 와 있던 사람과 같은 이벤트를 계산한다(프레임마다 갈리는 "지금" 값은 못 쓴다).
   */
  private feedingAt(atMs: number): number {
    const d = new Date(atMs);
    const tide = calculateTideInfo(d);
    return computeFeedingActivity({
      hour: kstHour(d) + d.getMinutes() / 60,
      month: d.getMonth() + 1,
      tidePhase: tide.tidePhase,
      minutesToNextTide: tide.minutesToNextTide,
      nextTideType: tide.nextTideType,
      weatherKind: ExternalDataStore.getWeatherKind(this.region),
      regionProfile: feedingRegionProfileOf(this.region),
    }).activity;
  }

  /** 캐스팅 강제 회수 — 찌/그림자를 플레이어 쪽으로 되감고 비행 상태 정리 */
  private retrieveCastToPlayer(): void {
    this.tweens.add({
      targets: [this.castBobber, this.castShadow],
      x: this.playerBody.x, y: this.playerBody.y, alpha: 0, duration: 300,
      onComplete: () => this.clearCastFlight(),
    });
  }

  /** 캐스팅 비행 오브젝트 정리 */
  private clearCastFlight(): void {
    this.restoreCamFollow();   // 127차 — 비행 중단(회수·전환)에도 카메라를 놓치지 않는다
    this.castProj = null;
    this.castShadow?.destroy(); this.castShadow = undefined;
    this.castBobber?.destroy(); this.castBobber = undefined;
    this.castLineG?.clear();
    this.aimG?.clear();
    this.castBusy = false;
  }

  /** 착수 → 1인칭 낚시 씬 진입 (pause + launch — 복귀 시 위치 보존) */
  private enterFirstPersonFishing(landX: number, landY: number, col: number, row: number): void {
    const distPx = Math.hypot(landX - this.playerBody.x, landY - this.playerBody.y);
    const castDistanceM = (distPx / TR) * 2;   // 타일 = 2m 스케일
    const zMaxM = this.resolveCastDepth(castDistanceM);
    const reefSeed = ((col * 73856093) ^ (row * 19349663)) >>> 0;

    // 캐릭터가 서 있는 지형 → 1인칭 전경 지면 종류 (지도 기반)
    const pc = Math.floor(this.playerBody.x / TR);
    const pr = Math.floor(this.playerBody.y / TR);
    const standing = this.terrainAt(pc, pr) ?? 'land';
    const nearSea =
      this.terrainAt(pc + 1, pr) === 'water' || this.terrainAt(pc - 1, pr) === 'water' ||
      this.terrainAt(pc, pr + 1) === 'water' || this.terrainAt(pc, pr - 1) === 'water';
    // OSM 심리스 지형 반영: 모래사장(s) = sand · 방파제/도로(b·r) = gravel(콘크리트 톤)
    const shoreKind: 'sand' | 'grass' | 'gravel' =
      standing === 'grass' ? 'grass'
      : standing === 'sand' ? 'sand'
      : standing === 'pier' || standing === 'road' || standing === 'sidewalk' ? 'gravel'
      : nearSea ? 'sand' : 'gravel';

    // keepTransitioning=false — pause+launch(씬 살아있음). 폴백 타이머로 멈춤 방지.
    this.fadeOutThen(() => {
      // 착수점이 보일링/스쿨링 패치와 겹치면 입질 보너스/페널티를 1인칭에 전달
      const fieldEvent = this.fieldEvents?.getLandingBonus(landX, landY);
      if (fieldEvent) {
        this.hud?.pushLog(`[이벤트] ${fieldEvent.label} — 입질 x${fieldEvent.biteMult.toFixed(1)}`);
      }
      this.dismountBike();   // 낚시 진입 시 자동 하차
      MultiplayerClient.setActivity('fishing');   // 145차 — 이름표 옆 배지 + 밀어내기 제외
      this.scene.pause();
      this.scene.launch('FirstPersonFishingScene', {
        zMaxM, castDistanceM, reefSeed, region: this.region, shoreKind, fieldEvent,
        spotKind: this.standingSpotKind(),
      });
    }, 260, false);
  }

  /**
   * 캐스팅 거리 → 착수 지점 수심 (m).
   * 실측 연안정보도 수심 프로필(현재 맵의 항구 앵커 기준)을 우선 사용하고,
   * 프로필이 없으면 기존 Land-to-Sea 그라디언트(computeZoneMaxDepth)로 폴백.
   * 프로필 범위를 넘는 거리는 depthAtDistance가 거리 비례로 외삽한다.
   */
  private resolveCastDepth(castDistanceM: number, quiet = false): number {
    const profile = this.cache.json.get(`depth_${this.region}`) as RegionDepthProfile | undefined;
    if (profile && Array.isArray(profile.anchors) && profile.anchors.length > 0) {
      // 현재 맵 ID(sokcho_dongmyeonghang_1 등)로 앵커 매칭.
      // 심리스는 맵 ID가 단일이라 플레이어 위치로 앵커를 고른다 —
      // 속초 심리스 기준 북측(상단) ≈ 동명항 / 남측 ≈ 속초항 (terrain 실배치).
      const anchorKey = this.seamless
        ? (this.playerBody.y < this.worldH * 0.5 ? 'dongmyeonghang' : 'sokchohang')
        : this.mapId;
      const anchor = findDepthAnchor(profile, anchorKey);
      if (anchor) {
        const depth = depthAtDistance(anchor, castDistanceM);
        if (!quiet) this.hud?.pushLog(`[수심] ${anchor.name} 기준 실측 ${depth.toFixed(1)}m (거리 ${castDistanceM.toFixed(0)}m)`);
        return Math.max(2, Math.round(depth * 10) / 10);
      }
    }
    const distRatio = Phaser.Math.Clamp(castDistanceM / 70, 0, 1);
    return computeZoneMaxDepth(distRatio);
  }

  // ═══════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════
  /** 지역 타이틀 명패 — 텍스트 실측 폭 기준 (생성 시 + 로케일 전환 시) */
  private layoutTitlePlate(): void {
    if (!this.titleTxt || !this.titlePlateG) return;
    const plateW = Math.max(120, this.titleTxt.width + 56);
    this.titlePlateG.clear();
    paintTitlePlate(this.titlePlateG, GAME_WIDTH / 2 - plateW / 2, 10, plateW, 32);
  }

  private createHud(): void {
    // 지역 타이틀 — 명패 플레이트 (구 "배경 없는 글자" → HudPanelStyle 공용 문법)
    const titleTxt = this.add.text(GAME_WIDTH / 2, 26, this.node.name, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#ffe9b0', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);
    titleTxt.setShadow(0, 2, '#06090f', 2, true, true);
    const plateG = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.titleTxt = titleTxt; this.titlePlateG = plateG;
    this.layoutTitlePlate();
    // 로케일 전환(설정) 시 i18n 훅이 텍스트를 갈아끼워 폭이 바뀐다 — 명패를 실측 폭으로 다시 그린다 (122차 HUD 텍스트 이탈)
    this.localeHandler = () => this.layoutTitlePlate();
    this.game.events.on('locale-changed', this.localeHandler);
    this.events.once('shutdown', () => { if (this.localeHandler) this.game.events.off('locale-changed', this.localeHandler); });

    // 단축키 버튼 (우하단, 116차) — 구 조작 힌트 바 대체. 모서리 둥근 정사각형, 라벨은 한글만(117차).
    //   클릭 = 도움말 라이브러리 "조작·단축키 › 필드" 토픽.
    const SB = 64;
    const sbx = GAME_WIDTH - 20 - SB, sby = GAME_HEIGHT - 16 - SB;
    const sbG = this.add.graphics().setScrollFactor(0).setDepth(100);
    paintHudPanel(sbG, sbx, sby, SB, SB, { alpha: 0.9, studs: false, shadow: true });
    const sbT = this.add.text(sbx + SB / 2, sby + SB / 2, '도움말', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#ffe9b0', fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    const sbHit = this.add.rectangle(sbx + SB / 2, sby + SB / 2, SB, SB, 0xffffff, 0.001)
      .setScrollFactor(0).setDepth(102).setInteractive({ useHandCursor: true });
    sbHit.on('pointerover', () => sbT.setColor('#ffffff'));
    sbHit.on('pointerout', () => sbT.setColor('#ffe9b0'));
    sbHit.on('pointerdown', () => {
      if (this.isPaused) return;
      // 같은 버튼 재클릭 = 닫기 (토글, 118차)
      if (this.helpPanel) this.popupStack.find((e) => e.panel === this.helpPanel)?.close();
      else this.openHelpLibrary('keys-field');
      // 팝업 열림/닫힘으로 인터랙티브 자식이 파괴되면 Phaser가 커서를 기본값으로 되돌린다 —
      //   포인터는 여전히 버튼 위이므로 hover 상태를 되살린다 (실측 버그)
      restoreHandCursor(this);
      sbT.setColor('#ffffff');
    });

    this.promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 96, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
  }

  private floatingHint(msg: string): void {
    const t = this.add.text(this.playerBody.x, this.playerLabelY, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#fff',
      backgroundColor: '#0a1628cc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(60);
    this.tweens.add({ targets: t, y: t.y - 22, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  // ═══════════════════════════════════════════════════
  // 업데이트 루프
  // ═══════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════
  // 대기·조명·날씨 — 낮/밤 명암 + 건물 조명/네온 + 방파제 가로등 + 비/안개/눈
  // ═══════════════════════════════════════════════════
  private setupAtmosphere(): void {
    const hour = kstHour();
    const isNight = hour >= 20 || hour < 5;
    this.isNightNow = isNight;
    const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);
    const weather = ExternalDataStore.getWeatherKind(this.region);

    // 방파제 가로등 — 낮에도 기둥은 보이고, 밤에만 점등
    this.placeStreetlamps(isNight);

    // 시간대 명암 오버레이 (화면 고정 — HUD(depth 100+) 아래, 조명 글로우(42)보다 아래)
    if (isNight) {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x061024, 0.45)
        .setScrollFactor(0).setDepth(40);
    } else if (isDusk) {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a1630, 0.24)
        .setScrollFactor(0).setDepth(40);
    }

    // 날씨 추가 명암 (흐림/강수 시 전체 톤 다운)
    const weatherDim: Partial<Record<string, [number, number]>> = {
      cloudy: [0x66788a, 0.12],
      rain: [0x0a1420, 0.20],
      shower: [0x0a1420, 0.25],
      sleet: [0x0a1420, 0.20],
      snow: [0x8a96a8, 0.10],
    };
    const dim = weatherDim[weather];
    if (dim) {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, dim[0], dim[1])
        .setScrollFactor(0).setDepth(40);
    }

    // 건물 조명 + 네온사인 (밤 점등, 황혼은 약하게)
    if (isNight || isDusk) this.lightBuildings(isNight);

    // 날씨 파티클 — 종류·강도별 (비 2레이어+물파문 / 소나기 강우 / 진눈깨비 = 비+눈+우박 / 눈)
    if (weather === 'rain') { this.spawnRain(70); this.precipKind = 'rain'; }
    else if (weather === 'shower') { this.spawnRain(150); this.precipKind = 'shower'; }
    else if (weather === 'sleet') {
      this.spawnRain(55); this.spawnSnow(40); this.spawnHail(14);
      this.precipKind = 'sleet';
    } else if (weather === 'snow') this.spawnSnow(70);
    else if (weather === 'fog') this.spawnFog();
  }

  /** 방파제 길(양쪽이 바다인 통로)을 따라 가로등 배치 */
  private placeStreetlamps(lit: boolean): void {
    this.ensureLampTexture();
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.blocked[r][c] || this.terrain[r][c] === 'water') continue;
        const wN = this.terrainAt(c, r - 1) === 'water', wS = this.terrainAt(c, r + 1) === 'water';
        const wE = this.terrainAt(c + 1, r) === 'water', wW = this.terrainAt(c - 1, r) === 'water';
        if (this.seamless) {
          // 심리스(5m/타일) — 방파제가 2타일+ 폭이라 "양옆 바다" 규칙이 성립하지 않는다.
          // 114차: 단면 분류가 있으면 **상판 가장자리**(피복/사석과 맞닿은 상판)에, 피복 위는 금지.
          //   분류 없는 안벽(0)은 종전대로 부두(b) 물가 가장자리. 8타일 간격.
          const k = this.chunks?.breakwaterClassAt(c, r) ?? 0;
          if (k === 2 || k === 3) continue;
          if (k === 1) {
            const armor = (cc: number, rr: number): boolean => { const kk = this.chunks?.breakwaterClassAt(cc, rr) ?? 0; return kk === 2 || kk === 3; };
            if (!(armor(c, r - 1) || armor(c, r + 1) || armor(c - 1, r) || armor(c + 1, r))) continue;
          } else if (this.terrain[r][c] !== 'pier' || !(wN || wS || wE || wW)) continue;
          if ((c + r) % 8 !== 0) continue;
        } else {
          // 방파제 길: 진행 방향 양옆이 바다
          if (!((wN && wS) || (wE && wW))) continue;
          if ((c + r) % 6 !== 0) continue;   // 6타일 간격
        }
        const x = c * TR + TR / 2, y = r * TR + TR / 2;
        this.add.image(x, y + 6, 'lamp_post').setOrigin(0.5, 1).setDepth(14 + y * 0.001);
        if (lit) {
          // 전구는 가로등 기둥(14+y·0.001)에 붙는 요소 — 플레이어 아래 (가림 방지)
          const bulb = this.add.circle(x, y - 15, 4.5, 0xfff2b0, 0.9)
            .setDepth(16 + y * 0.001).setBlendMode(Phaser.BlendModes.ADD);
          this.add.ellipse(x, y + 4, 54, 26, 0xffd980, 0.13)
            .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
          // 은은한 명멸
          this.tweens.add({
            targets: bulb, alpha: 0.55,
            duration: 1500 + ((c * 31 + r * 17) % 800), yoyo: true, repeat: -1,
          });
        }
      }
    }
  }

  /** 가로등 기둥 텍스처 (1회 베이킹) */
  private ensureLampTexture(): void {
    if (this.textures.exists('lamp_post')) return;
    const g = this.add.graphics();
    g.fillStyle(0x2a3138, 1);
    g.fillRect(4, 24, 8, 2);      // 받침
    g.fillRect(7, 6, 2, 18);      // 기둥
    g.fillRect(3, 3, 10, 3);      // 램프 헤드
    g.fillStyle(0xfff2b0, 1);
    g.fillRect(6, 6, 4, 2);       // 전구
    g.generateTexture('lamp_post', 16, 26);
    g.destroy();
  }

  /**
   * 밤 건물 조명 — 창문 불빛 + 주변광 + 종류별 네온사인 (명멸).
   * 파사드 부착 요소(창문/네온)는 건물 표면의 일부이므로 **플레이어(20+y·0.001)보다
   * 아래**(16+y·0.001)에 그린다 — 캐릭터가 건물 앞에 서면 캐릭터가 불빛을 가린다.
   * (기존 depth 42는 ADD 광이 캐릭터 위로 씻겨 "건물 뒤에 있는 것처럼" 보이던 원인.)
   * 부드러운 주변광 글로우만 명암 오버레이(40) 위(42)에 남겨 어둠을 뚫는 연출 유지.
   */
  private lightBuildings(strong: boolean): void {
    // 심리스 — 건물 파사드 스프라이트가 없어(지붕 탑뷰) 창문/네온/대형 글로우가 허공에 뜬다
    // (101차 사용자 리포트 "안개? 구름? 단순 도형" 중 일부가 이 발광 halo였음).
    // 문 앞 소형 가로등 불빛만 남긴다.
    if (this.seamless) {
      // 문 앞 불빛 — 오브젝트(상점·NPC)보다 위 깊이(y-sort +0.003)라 뒤에 가려지지 않는다.
      // 오브젝트 전체 발광은 loadChunkPois가 스프라이트 크기에 맞춰 얹는다(101차 후속 4).
      for (const b of this.buildings) {
        this.add.circle(b.x, b.y + 6, 26, 0xffd980, strong ? 0.12 : 0.06)
          .setDepth(20 + b.y * 0.001 + 0.003).setBlendMode(Phaser.BlendModes.ADD);
        this.add.circle(b.x, b.y - 6, 2, 0xfff2b0, strong ? 0.85 : 0.5)
          .setDepth(20 + b.y * 0.001 + 0.003).setBlendMode(Phaser.BlendModes.ADD);
      }
      return;
    }
    const NEON: Record<BuildingKind, number> = {
      convenience: 0x35ff7a, mart: 0xffa040, market: 0xff5555,
      restaurant: 0xffcf6b, cafe: 0xffe2a8, pub: 0xc27cff, pharmacy: 0x4fffb0,
      daily: 0x6ab8ff,
    };
    for (const b of this.buildings) {
      const facadeDepth = 16 + b.y * 0.001;
      // 창문 불빛 (건물 텍스처의 창 위치와 정합) — 명암 오버레이 아래라 알파 보상
      const winAlpha = strong ? 0.95 : 0.5;
      this.add.rectangle(b.x - 10, b.y - 1, 8, 7, 0xffd980, winAlpha)
        .setDepth(facadeDepth).setBlendMode(Phaser.BlendModes.ADD);
      this.add.rectangle(b.x + 10, b.y - 1, 8, 7, 0xffd980, winAlpha)
        .setDepth(facadeDepth).setBlendMode(Phaser.BlendModes.ADD);
      // 주변광 글로우 (부드러운 광원 — 캐릭터 위로 번져도 자연스러움)
      this.add.circle(b.x, b.y - 6, 42, 0xffc873, strong ? 0.11 : 0.05)
        .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
      // 네온사인 (간판 밴드 위) — 종류별 색 + 불규칙 명멸
      const neon = this.add.rectangle(b.x, b.y - 12, 34, 6, NEON[b.kind], strong ? 0.7 : 0.4)
        .setDepth(facadeDepth).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: neon, alpha: strong ? 0.3 : 0.15,
        duration: 800 + (Math.abs(b.x * 7 + b.y * 3) % 700), yoyo: true, repeat: -1,
        delay: Math.abs(b.y) % 400,
      });
    }
  }

  /** 빗줄기 파티클 풀 (화면 고정 — 바람 사선) */
  /** 빗줄기 파티클 풀 — 근경(굵고 빠름)/원경(가늘고 느림) 2레이어, 강도 = count */
  private spawnRain(count: number): void {
    for (let i = 0; i < count; i++) {
      const near = i % 3 !== 0;   // 2/3 근경 + 1/3 원경 (깊이감)
      const obj = this.add.rectangle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        near ? 2 : 1.1, near ? 13 : 8, 0xbfd8ee, near ? 0.6 : 0.32,
      ).setScrollFactor(0).setDepth(near ? 46 : 45).setAngle(8);
      this.rainDrops.push({ obj, speed: near ? 640 + Math.random() * 240 : 380 + Math.random() * 140 });
    }
  }

  /** 우박 파티클 풀 — 빠른 낙하 + 지면 튐 스파크 (진눈깨비에 혼재) */
  private spawnHail(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.add.circle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        2.2 + Math.random() * 1.2, 0xe8f2fa, 0.95,
      ).setScrollFactor(0).setDepth(46);
      this.hailStones.push({ obj, speed: 760 + Math.random() * 220, drift: 30 + Math.random() * 40 });
    }
  }

  /** 눈송이 파티클 풀 */
  private spawnSnow(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.add.circle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        1.5 + Math.random() * 1.2, 0xf0f6fc, 0.85,
      ).setScrollFactor(0).setDepth(46);
      this.snowFlakes.push({ obj, speed: 55 + Math.random() * 50, sway: Math.random() * Math.PI * 2 });
    }
  }

  /** 픽셀 구름 텍스처 2종 (겹친 원 클러스터 — 4px 스텝 배치로 도트 느낌) */
  private ensureCloudTextures(): void {
    for (let v = 0; v < 2; v++) {
      const key = `fx_cloud_${v}`;
      if (this.textures.exists(key)) continue;
      const W = 260, H = 104;
      const g = this.add.graphics();
      // 결정적 배치 (v 시드) — 아래 어두운 톤 → 위 밝은 톤 겹침
      const h = (i: number): number => {
        let n = (Math.imul(i + 1, 374761393) ^ Math.imul(v + 7, 668265263)) >>> 0;
        n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
        return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
      };
      g.fillStyle(0xaebcc6, 0.9);
      for (let i = 0; i < 9; i++) {
        const cx = 36 + Math.floor(h(i) * (W - 72) / 4) * 4;
        const cy = 46 + Math.floor(h(i + 20) * 40 / 4) * 4;
        g.fillCircle(cx, cy, 22 + Math.floor(h(i + 40) * 16));
      }
      g.fillStyle(0xcdd9e2, 0.95);
      for (let i = 0; i < 7; i++) {
        const cx = 48 + Math.floor(h(i + 60) * (W - 96) / 4) * 4;
        const cy = 34 + Math.floor(h(i + 80) * 30 / 4) * 4;
        g.fillCircle(cx, cy, 18 + Math.floor(h(i + 90) * 12));
      }
      g.fillStyle(0xe4edf3, 0.9);
      for (let i = 0; i < 5; i++) {
        const cx = 64 + Math.floor(h(i + 110) * (W - 128) / 4) * 4;
        const cy = 26 + Math.floor(h(i + 130) * 22 / 4) * 4;
        g.fillCircle(cx, cy, 12 + Math.floor(h(i + 140) * 9));
      }
      g.generateTexture(key, W, H);
      g.destroy();
    }
  }

  /** 안개 — 전체 헤이즈 + 드리프트하는 픽셀 구름 (구 단순 타원 블롭 폐기 — 101차) */
  private spawnFog(): void {
    this.ensureCloudTextures();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc8d4dc, 0.12)
      .setScrollFactor(0).setDepth(45);
    for (let i = 0; i < 6; i++) {
      const obj = this.add.image(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, `fx_cloud_${i % 2}`,
      ).setScrollFactor(0).setDepth(45)
        .setAlpha(0.16 + Math.random() * 0.1)
        .setScale(0.9 + Math.random() * 1.1)
        .setFlipX(Math.random() < 0.5);
      this.fogBlobs.push({ obj, speed: 6 + Math.random() * 11 });
    }
  }

  /** 날씨 파티클 이동 (매 프레임 — 일시정지와 무관하게 대기는 흐른다) */
  private updateWeatherFx(deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const d of this.rainDrops) {
      d.obj.y += d.speed * dt;
      d.obj.x += 62 * dt;
      if (d.obj.y > GAME_HEIGHT + 12) {
        d.obj.y = -12;
        d.obj.x = Math.random() * GAME_WIDTH;
      }
      if (d.obj.x > GAME_WIDTH + 8) d.obj.x = -8;
    }
    for (const s of this.snowFlakes) {
      s.obj.y += s.speed * dt;
      s.obj.x += Math.sin(this.time.now / 700 + s.sway) * 20 * dt;
      if (s.obj.y > GAME_HEIGHT + 6) {
        s.obj.y = -6;
        s.obj.x = Math.random() * GAME_WIDTH;
      }
    }
    for (const f of this.fogBlobs) {
      f.obj.x += f.speed * dt;
      if (f.obj.x - f.obj.displayWidth / 2 > GAME_WIDTH) f.obj.x = -f.obj.displayWidth / 2;
    }
    // 우박 — 빠른 낙하, 지면 부근에서 튐 스파크 후 상단 재투입
    for (const hs of this.hailStones) {
      hs.obj.y += hs.speed * dt;
      hs.obj.x += hs.drift * dt;
      if (hs.obj.y > GAME_HEIGHT - 10) {
        const spark = this.add.circle(hs.obj.x, hs.obj.y, 2, 0xffffff, 0.9)
          .setScrollFactor(0).setDepth(46);
        this.tweens.add({
          targets: spark, y: hs.obj.y - 9, alpha: 0, scale: 0.4, duration: 240,
          onComplete: () => spark.destroy(),
        });
        hs.obj.y = -8;
        hs.obj.x = Math.random() * GAME_WIDTH;
      }
      if (hs.obj.x > GAME_WIDTH + 8) hs.obj.x = -8;
    }
    // 지면 물파문 — 비 오는 동안 화면 곳곳에 확산 링 (소나기일수록 잦음)
    if (this.precipKind !== 'none') {
      this.rainSplashAcc += deltaMs;
      const interval = this.precipKind === 'shower' ? 70 : 150;
      while (this.rainSplashAcc >= interval) {
        this.rainSplashAcc -= interval;
        const ripple = this.add.circle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 2, 0x000000, 0)
          .setStrokeStyle(1.2, 0xd8ecf8, 0.55).setScrollFactor(0).setDepth(45);
        this.tweens.add({
          targets: ripple, scale: 3.2, alpha: 0, duration: 460,
          onComplete: () => ripple.destroy(),
        });
      }
    }
  }

  update(_time: number, delta: number): void {
    // init → create 사이 또는 shutdown 직전의 stale update 차단.
    if (this.bootFailed || !this.playerBody?.active) return;
    this.updateStoryProximity(delta);
    this.updateFieldNpcs(delta);
    this.nuisance?.update(delta);
    if (this.traffic) {
      const cam = this.cameras.main;
      const pl = this.playerBody ? { x: this.playerBody.x / TR, y: this.playerBody.y / TR } : null;
      this.traffic.update(delta, cam.midPoint.x, cam.midPoint.y, pl);
      // 캐릭터가 차량에 부딪힘 — 진행 방향 뒤로 넉백 + HP −20% (차량은 180초 정지)
      if (pl) {
        const hit = this.traffic.playerInteract(pl.x, pl.y);
        const now = this.time.now;
        if (hit && now > this.hitCooldownUntil) {
          this.hitCooldownUntil = now + 1500;
          const vx = this.playerBody.body ? (this.playerBody.body as Phaser.Physics.Arcade.Body).velocity.x : 0;
          const vy = this.playerBody.body ? (this.playerBody.body as Phaser.Physics.Arcade.Body).velocity.y : 0;
          const vl = Math.hypot(vx, vy);
          const kx = vl > 10 ? -vx / vl : hit.dx, ky = vl > 10 ? -vy / vl : hit.dy;
          this.knockVx = kx * 280; this.knockVy = ky * 280;
          this.knockUntil = now + 260;
          const st = GameState.player.stamina;
          GameState.updatePlayer({ stamina: Math.max(0, st - 20) });
          this.cameras.main.shake(180, 0.006);
          this.hud?.pushLog('[사고] 차량과 부딪혔습니다 — HP -20% · 차량 정지');
        }
      }
    }
    this.hud?.updatePlayerMarker(this.playerBody.x, this.playerBody.y);
    this.updateQuestGuide(delta);
    this.updateWeatherFx(delta);
    // 심리스 청크 스트리밍 — 상주 갱신 + 프레임당 1청크 베이킹
    // (UI 열림/전환 중에도 대기 베이킹은 계속 소화한다 — 시각 공백 방지)
    this.chunks?.update(this.playerBody.x, this.playerBody.y);
    // 보일링/스쿨링 필드 이벤트 (피딩 활성도 기반 발생/이동/소멸)
    this.fieldEvents?.update(delta, this.fieldFeeding);
    // 캐스팅 비행은 UI 상태와 무관하게 진행 (착수까지 물리 유지)
    if (this.castProj) this.stepCastFlight(delta);
    // 146차 — 멀티 동기화는 **팝업이 열려 있어도** 돈다. 거래창·인벤 열고 있는 동안 남이 얼어붙거나
    //   확정된 거래가 영영 적용되지 않던 결함(실측). 밀어내기만 uiBlocked를 스스로 본다.
    this.syncPeers(delta);
    this.applyPeerPush(delta);
    this.updateOccluders(delta);
    for (const line of MultiplayerClient.drainChat()) this.hud?.pushLog(`${line.name}: ${line.text}`);
    if (this.isTransitioning || this.uiBlocked) { this.playerBody.setVelocity(0, 0); return; }
    if (this.placing) {
      // 설치 모드 — 이동은 허용, 프리뷰는 커서 추적 (클릭=설치 / 우클릭·ESC=취소)
      this.updatePlacementPreview();
    }
    if (this.trapField?.placing) {
      const pw = this.pointerWorld(this.input.activePointer);
      this.trapField.updatePreview(pw.x, pw.y);
    }
    if (this.stoveField?.placing) {
      const pw = this.pointerWorld(this.input.activePointer);
      this.stoveField.updatePreview(pw.x, pw.y);
    }
    this.handleMovement();
    this.tickVitals(delta);
    this.updateSpriteAndShadow();
    this.updateBuildingProximity();
    this.updateObjectProximity();
    this.updateWaterProximity();
    this.forage?.update(delta);
    this.trapField?.update(delta);
    this.stoveField?.update(delta);
    this.updateCharge();
    this.checkEdgeTransition();
  }

  /**
   * 생존 지표 드레인 (125차 — SPEC §4). **활동 시간만** 진행하므로
   * `update()`의 일시정지·모달 가드(`uiBlocked`/`isTransitioning`) 뒤에서만 호출한다.
   */
  private tickVitals(delta: number): void {
    const body = this.playerBody.body as Phaser.Physics.Arcade.Body | undefined;
    const moving = !!body && Math.hypot(body.velocity.x, body.velocity.y) > 4;
    const activity: VitalsActivity = this.forage?.isHolding ? 'forage'
      : moving ? (GameState.isMounted ? 'bike' : this.running ? 'run' : 'walk')
      : 'idle';
    const feelsLikeC = ExternalDataStore.getRegionMarineWeather(this.region)?.airTempC;
    const r = GameState.tickVitals(delta, activity, { feelsLikeC });
    // 126차 P4 — 사망이 기절보다 우선(HP 0이면 피로도와 무관하게 사망)
    if (r.dead) { this.beginCollapse('death'); return; }
    if (r.fainted) { this.beginCollapse('faint'); return; }
    if (r.starving && this.time.now > this.starveWarnAt) {
      this.starveWarnAt = this.time.now + 30_000;
      this.hud?.pushLog('[경고] 허기·수분이 바닥났습니다 — 체력이 줄고 있습니다');
    }
    for (const id of r.added) {
      this.hud?.pushLog(`[상태] ${getStatusEffect(id)?.nameKo ?? id} 증상이 나타났습니다`);
    }
    // 130차 (e) — 레벨업·면허 취득으로 열린 시너지를 여기서 한 번만 알린다
    //   (스킬 패널 밖에서 열리는 경로가 있어서 큐를 씬이 비운다)
    for (const d of GameState.takeRecentHiddenUnlocks()) {
      this.hud?.pushLog(`[시너지] ${d.nameKo} 해금 — ${d.descKo}`);
    }
    // 140차 — 숙련도 레벨업(캐스팅·손질·제작 … 행위로 오른 것)도 같은 자리에서 알린다
    for (const g of GameState.takeRecentProfUps()) {
      this.hud?.pushLog(`[숙련] ${getSkillById(g.skillId)?.nameKo ?? g.skillId} 숙련도 Lv.${g.level} — 효과 ×${profScale(g.level).toFixed(2)}`);
    }
    for (const id of r.removed) {
      this.hud?.pushLog(`[상태] ${getStatusEffect(id)?.nameKo ?? id} 증상이 가라앉았습니다`);
    }
  }

  /**
   * 기절·사망 연출 시작 (126차 P4 — SPEC §6).
   * 연출 중에는 이동·상호작용을 전부 막고(`collapsing`), 팝업 버튼으로만 빠져나온다.
   * ⚠ 부활은 **저장하지 않는다** — 저장은 집 침대에서만(§SavePolicy)이라는 규칙을 건드리지 않는다.
   */
  private beginCollapse(kind: CollapseKind): void {
    if (this.collapsing) return;
    this.collapsing = true;
    if (kind === 'faint') GameState.addStatus('faint');
    this.playerBody.setVelocity(0, 0);
    this.hud?.pushLog(kind === 'death' ? '[치명] 의식을 잃고 쓰러졌습니다' : '[경고] 피로도가 한계에 도달해 쓰러졌습니다');

    const detail = kind === 'death'
      ? `체력이 바닥났습니다. 집에서 눈을 뜨면 소지금 일부(${Math.round(TUNING.collapse.deathCoinLossRate * 100)}%)를 잃고 탈진 상태로 시작합니다. 가방 속 물건과 창고·냉장고 보관분은 그대로입니다.`
      : '잠시 정신을 잃었습니다. 일어나도 피로가 완전히 풀리지는 않습니다 — 침대에서 자야 회복됩니다.';

    this.collapseCleanup = playCollapse(this, kind, {
      sprite: this.playerSprite,
      detail,
      onConfirm: () => {
        this.collapseCleanup = undefined;
        this.collapsing = false;
        if (kind === 'faint') {
          GameState.reviveFromFaint();
          this.hud?.pushLog('[상태] 정신을 차렸습니다 — 탈진 상태입니다');
        } else {
          const { coinLost } = GameState.reviveFromDeath();
          this.hud?.pushLog(`[상태] 집에서 눈을 떴습니다 — 소지금 ${coinLost.toLocaleString()}원을 잃었습니다`);
          this.goHomeAfterDeath();
        }
      },
    });
  }

  /** 사망 부활 — 홈타운 집 앞으로 이동(장면 재시작). 요금은 받지 않는다 */
  private goHomeAfterDeath(): void {
    this.collapseCleanup?.();
    this.collapseCleanup = undefined;
    if (this.region === 'hometown') { this.scene.restart({ region: 'hometown' }); return; }
    this.scene.start('RegionFieldScene', { region: 'hometown' });
  }

  /** 건물 입구 근접 감지 → [E] 거래 힌트 */
  private updateBuildingProximity(): void {
    const px = this.playerBody.x, py = this.playerBody.y;
    let nearest: { x: number; y: number; kind: BuildingKind } | null = null;
    let bestDist = 52;
    for (const b of this.buildings) {
      const d = Math.hypot(b.x - px, b.y - py);
      if (d < bestDist) { bestDist = d; nearest = b; }
    }
    this.nearBuilding = nearest;
  }

  // ═══════════════════════════════════════════════════
  // 홈타운(집) — 오브젝트 인스턴스 렌더/충돌/상호작용 + 칸 단위 설치 모드
  // (HOMETOWN_HOME_SPEC 2026-07-28 — 초기 배치 − removed + moved + placed)
  // ═══════════════════════════════════════════════════

  /** 유효 오브젝트 산출 + 충돌 타일 반영 (buildCollision 전에 호출) */
  private computeHomeObjects(): void {
    const state = GameState.getWorldObjects(this.mapId);
    this.homeObjects = effectiveObjects(HOMETOWN_OBJECTS, state);
    this.applyObjectBlocking();
  }

  /** collides 오브젝트의 footprint 타일을 blocked에 반영 */
  private applyObjectBlocking(): void {
    for (const o of this.homeObjects) {
      if (!o.collides) continue;
      const fw = o.fw ?? 1, fh = o.fh ?? 1;
      for (let dr = 0; dr < fh; dr++) {
        for (let dc = 0; dc < fw; dc++) {
          const c = o.tx + dc, r = o.ty + dr;
          if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) this.blocked[r][c] = true;
        }
      }
    }
  }

  /** 오브젝트 스프라이트 전체 렌더 (파라메트릭 텍스처 — 타입별 1회 베이킹) */
  private renderHomeObjects(): void {
    this.homeObjSprites.forEach((objs) => objs.forEach((s) => s.destroy()));
    this.homeObjSprites.clear();
    for (const o of this.homeObjects) this.renderHomeObject(o);
  }

  private renderHomeObject(o: MapObject): void {
    this.ensureObjTexture(o.type, o);
    const fw = o.fw ?? 1, fh = o.fh ?? 1;
    const cx = o.tx * TR + (fw * TR) / 2;
    const bottomY = o.ty * TR + fh * TR;
    const img = this.add.image(cx, bottomY, this.objTexKey(o.type, o))
      .setOrigin(0.5, 1)
      .setDepth(o.type === 'pier' || o.type === 'farmPlot' || o.type === 'tidalRock' ? 6 : 14 + bottomY * 0.001);
    const objs: Phaser.GameObjects.GameObject[] = [img];
    if (o.type === 'busStop') {
      const lbl = this.add.text(cx, bottomY + 2, '출조 버스', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#aee8ff', fontStyle: 'bold',
        backgroundColor: '#0a1628cc', padding: { x: 4, y: 1 },
      }).setOrigin(0.5, 0).setDepth(15);
      objs.push(lbl);
    }
    this.homeObjSprites.set(o.instanceId, objs);
  }

  private objTexKey(type: string, o: MapObject): string {
    return `hobj_${type}_${o.fw ?? 1}x${o.fh ?? 1}`;
  }

  /** 타입별 파라메트릭 오브젝트 텍스처 (도트 톤 — 추후 실사 에셋 교체 자리) */
  private ensureObjTexture(type: MapObject['type'], o: MapObject): void {
    const key = this.objTexKey(type, o);
    if (this.textures.exists(key)) return;
    const fw = o.fw ?? 1, fh = o.fh ?? 1;
    const g = this.add.graphics();
    let w = TR, h = TR;
    switch (type) {
      case 'tree': {
        w = 30; h = 40;
        g.fillStyle(0x6a4a2c, 1); g.fillRect(13, 26, 5, 14);              // 줄기
        g.fillStyle(0x2e6b34, 1); g.fillCircle(15, 16, 13);               // 수관
        g.fillStyle(0x3b8a42, 1); g.fillCircle(10, 12, 8); g.fillCircle(21, 13, 8);
        break;
      }
      case 'rock': {
        w = 26; h = 18;
        g.fillStyle(0x8a8f96, 1); g.fillEllipse(13, 11, 24, 13);
        g.fillStyle(0xa8adb4, 1); g.fillEllipse(9, 8, 11, 7);
        break;
      }
      case 'stump': {
        w = 18; h = 12;
        g.fillStyle(0x7a5a38, 1); g.fillEllipse(9, 6, 16, 9);
        g.fillStyle(0xa8845a, 1); g.fillEllipse(9, 5, 10, 5);
        break;
      }
      case 'well': {
        w = 24; h = 26;
        g.fillStyle(0x7d8288, 1); g.fillEllipse(12, 18, 22, 12);          // 돌 테
        g.fillStyle(0x1c2a36, 1); g.fillEllipse(12, 17, 13, 7);           // 구멍
        g.fillStyle(0x6a4a2c, 1); g.fillRect(3, 4, 3, 14); g.fillRect(18, 4, 3, 14);
        g.fillStyle(0x8a3a34, 1); g.fillTriangle(0, 6, 12, 0, 24, 6);     // 지붕
        break;
      }
      case 'tidalRock': {
        w = 24; h = 14;
        g.fillStyle(0x5a6068, 1); g.fillEllipse(9, 9, 15, 9);
        g.fillStyle(0x6d737b, 1); g.fillEllipse(18, 10, 10, 6);
        break;
      }
      case 'pier': {
        w = fw * TR; h = 16;
        g.fillStyle(0x8a6a44, 1); g.fillRect(0, 4, w, 9);                 // 상판
        g.lineStyle(1, 0x5a4028, 1);
        for (let x = 8; x < w; x += 12) g.lineBetween(x, 4, x, 13);       // 널빤지
        g.fillStyle(0x5a4028, 1);
        for (let x = 4; x < w; x += 24) g.fillRect(x, 12, 3, 4);          // 말뚝
        break;
      }
      case 'busStop': {
        w = 26; h = 36;
        g.fillStyle(0x8a8f96, 1); g.fillRect(12, 8, 3, 26);               // 기둥
        g.fillStyle(0x155a7c, 1); g.fillRoundedRect(2, 2, 22, 12, 3);     // 표지판
        g.lineStyle(1.5, 0x5cd0ff, 1); g.strokeRoundedRect(2, 2, 22, 12, 3);
        break;
      }
      case 'workbench': {
        // 고급 제작대 — 작업대 상판 + 다리 + 공구 실루엣(바이스·망치 머리). 글자 배지 없음.
        w = fw * TR; h = 26;
        g.fillStyle(0x6a4a2c, 1); g.fillRect(0, 8, w, 8);                  // 상판
        g.fillStyle(0x8a6a44, 1); g.fillRect(0, 8, w, 3);                  // 상판 하이라이트
        g.fillStyle(0x4a3420, 1);
        g.fillRect(3, 16, 4, 10); g.fillRect(w - 7, 16, 4, 10);            // 다리
        g.fillStyle(0x9aa3ac, 1); g.fillRect(8, 2, 5, 6);                  // 바이스
        g.fillStyle(0xc0c7ce, 1); g.fillRect(w - 20, 3, 9, 4);             // 망치 머리
        g.fillStyle(0x6a4a2c, 1); g.fillRect(w - 13, 3, 2, 6);             // 망치 자루
        break;
      }
      case 'clinic': {
        // 보건소 (129차 P7) — 흰 벽 + 초록 십자. 간판 글자 대신 **그림 기호**(AGENTS §4 픽셀 아이콘 원칙)
        w = fw * TR; h = fh * TR + 10;
        g.fillStyle(0xeceff2, 1); g.fillRect(2, 12, w - 4, h - 12);        // 벽체
        g.fillStyle(0x2f7f5e, 1); g.fillRect(0, 6, w, 8);                  // 지붕 밴드
        g.fillStyle(0xc9d4dc, 1); g.fillRect(5, 20, 9, 8); g.fillRect(w - 14, 20, 9, 8);  // 창
        g.fillStyle(0x5a3a22, 1); g.fillRect(w / 2 - 5, h - 14, 10, 14);   // 문
        // 초록 십자 (간판)
        g.fillStyle(0x4fc38a, 1);
        g.fillRect(w / 2 - 2, 1, 4, 10); g.fillRect(w / 2 - 5, 4, 10, 4);
        break;
      }
      case 'door': {
        w = 16; h = 22;
        g.fillStyle(0x5a3a22, 1); g.fillRect(0, 0, 16, 22);
        g.fillStyle(0x7a5232, 1); g.fillRect(2, 2, 12, 20);
        g.fillStyle(0xffd257, 1); g.fillCircle(12, 12, 1.6);              // 손잡이
        break;
      }
      case 'fence': {
        w = TR; h = TR;
        g.fillStyle(0x8a6a44, 1);
        g.fillRect(2, 6, 3, 12); g.fillRect(15, 6, 3, 12);                // 말뚝 2
        g.fillRect(0, 8, TR, 3); g.fillRect(0, 13, TR, 3);                // 가로대 2
        break;
      }
      case 'farmPlot': {
        w = fw * TR; h = fh * TR;
        g.fillStyle(0x6a4a2c, 0.95); g.fillRoundedRect(0, 0, w, h, 4);    // 개간 흙
        g.lineStyle(1, 0x54381f, 0.9);
        for (let r2 = 1; r2 < fh; r2++) g.lineBetween(2, r2 * TR, w - 2, r2 * TR);
        for (let c2 = 1; c2 < fw; c2++) g.lineBetween(c2 * TR, 2, c2 * TR, h - 2);
        break;
      }
      case 'aquarium_live': {
        w = fw * TR; h = fh * TR + 8;
        g.fillStyle(0x2a3846, 1); g.fillRect(0, h - 6, w, 6);             // 받침
        g.fillStyle(0x9ac8e0, 0.85); g.fillRect(2, 4, w - 4, h - 12);     // 수조 물
        g.lineStyle(2, 0xd8dde2, 1); g.strokeRect(1, 2, w - 2, h - 8);    // 프레임
        break;
      }
      case 'aquarium_display': {
        w = fw * TR; h = fh * TR + 6;
        g.fillStyle(0x2a3846, 1); g.fillRect(0, h - 4, w, 4);
        g.fillStyle(0xaed4ea, 0.85); g.fillRect(2, 2, w - 4, h - 8);
        g.lineStyle(1.5, 0xd8dde2, 1); g.strokeRect(1, 1, w - 2, h - 6);
        break;
      }
      default: {
        w = TR; h = TR;
        g.fillStyle(0x8a6a44, 1); g.fillRoundedRect(2, 2, TR - 4, TR - 4, 3);
      }
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** 상호작용 가능한 오브젝트 근접 감지 → [E] 힌트 */
  private objHintText?: Phaser.GameObjects.Text;
  private updateObjectProximity(): void {
    if (this.region !== 'hometown') return;
    const px = this.playerBody.x, py = this.playerBody.y;
    let nearest: MapObject | null = null;
    let bestDist = 46;
    for (const o of this.homeObjects) {
      const canInteract = (o.interact && o.interact !== 'none') || (o.placedByPlayer && o.removable);
      if (!canInteract) continue;
      const fw = o.fw ?? 1, fh = o.fh ?? 1;
      const cx = o.tx * TR + (fw * TR) / 2, cy = o.ty * TR + (fh * TR) / 2;
      const d = Math.hypot(cx - px, cy - py);
      if (d < bestDist + Math.max(fw, fh) * TR * 0.4) { bestDist = d; nearest = o; }
    }
    this.nearObject = nearest;

    // [E] 힌트 (플레이어 머리 위)
    if (nearest && !this.uiBlocked && !this.placing) {
      const label = this.objInteractLabel(nearest);
      if (!this.objHintText) {
        this.objHintText = this.add.text(0, 0, '', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe9b0', fontStyle: 'bold',
          backgroundColor: '#0a1628cc', padding: { x: 5, y: 2 },
        }).setOrigin(0.5, 1).setDepth(30);
      }
      try {
        this.objHintText.setText(label).setPosition(px, this.playerLabelY - 20).setVisible(true);
      } catch (e) {
        // Scene shutdown can destroy Phaser Text's backing canvas before a
        // final proximity tick returns. Drop the stale reference and let the
        // next active tick recreate it instead of propagating drawImage null.
        console.warn('[RegionFieldScene] 오래된 오브젝트 힌트 텍스트 폐기', e);
        this.objHintText = undefined;
      }
    } else {
      this.objHintText?.setVisible(false);
    }
  }

  /** 설치물이 **기능**을 가졌는가 (회수만 되는 울타리 등과 구분) */
  private hasFunction(o: MapObject): boolean {
    return !!o.interact && o.interact !== 'none';
  }


  // ═══════════════════════════════════════════════════════════════
  // 134차 — 스토리 NPC (Ch1 발주자) · 방문 장소 · 대화
  // ═══════════════════════════════════════════════════════════════
  private storyNpcs: {
    def: StoryNpcPlacement;
    x: number;
    y: number;
    actor: Phaser.GameObjects.Image;
    /** 머리 위 이름표 — 컷씬 이동 시 본체와 함께 따라간다 */
    label: Phaser.GameObjects.Text;
    mark?: Phaser.GameObjects.Image;
    markKey?: string;
    /** 마커의 x 오프셋(좌/우) — 인물이 걸으면 마커도 따라가야 한다(166차) */
    markDx?: number;
    /** 166차 — 자유 행동(3x3 배회·낚시·좌판·순찰). 이미지는 `ai.image === actor` */
    ai?: StoryNpcActor;
  }[] = [];
  private nearNpc: StoryNpcPlacement | null = null;
  private npcHintText?: Phaser.GameObjects.Text;
  private storyTriggers: {
    def: StoryFieldTrigger; x: number; y: number; mark: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text;
    /** 167차 — 사람이 서 있는 트리거(수상한 사람). 걷기 프레임은 컷씬이 `walking`으로 켠다 */
    actor?: { spr: CharacterSprite; walking: boolean };
  }[] = [];
  /** 167차 — 장면이 세운 임시 배우. 장면이 끝나면 전부 치운다 */
  private sceneExtras: { key: string; spr: CharacterSprite; label: Phaser.GameObjects.Text; walking: boolean }[] = [];
  /** 컷씬이 플레이어를 걷게 하는 동안 true */
  private playerCineWalking = false;
  /** 대화·선택 계통의 장면이 끝난 직후 `finishActionChoice`가 올리는 단계에는 후속 장면을 또 틀지 않는다 */
  private suppressActionScene = false;
  private nearStoryTrigger: StoryFieldTrigger | null = null;
  private storyProxAt = 0;
  private firedPlaces = new Set<string>();
  private nearIceDrop = false;
  private iceDropMarker?: Phaser.GameObjects.Container;

  private placeStoryTriggers(): void {
    this.storyTriggers = [];
    for (const def of STORY_FIELD_TRIGGERS) {
      if (def.regionId !== this.region || def.viaNpc) continue;   // viaNpc = 대화창 행으로만 닿는다
      const { col, row } = this.nearestWalkable(def.tx, def.ty);
      const x = col * TR + TR / 2, y = row * TR + TR;
      const mark = this.add.graphics().setDepth(20 + y * 0.001 + 0.001);
      mark.fillStyle(0xb89b55, 0.92).fillCircle(x, y - 28, 5);
      mark.lineStyle(1, 0xf5e3a3, 0.8).strokeCircle(x, y - 28, 9);
      // 167차 — 사람이 서 있는 트리거: 금색 점 대신 얼굴이 있는 인물 + 이름표
      let actor: { spr: CharacterSprite; walking: boolean } | undefined;
      if (def.actor) {
        const cfg = characterOf(`trigger:${def.id}`, { role: def.actor.role, sex: def.actor.sex, age: def.actor.age });
        const spr = new CharacterSprite(this, x, y, cfg, CHAR_SCALE);
        spr.image.setPosition(x, y + spr.footPad).setDepth(20 + y * 0.001 + 0.0006);
        spr.setDir(def.actor.facing ?? 'down');
        actor = { spr, walking: false };
      }
      const label = this.add.text(x, actor ? y + this.charTopFromFeet - RegionFieldScene.LABEL_GAP : y - 43,
        def.actor ? def.actor.nameKo : def.labelKo, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: def.actor ? '9px' : '8px', color: def.actor ? '#ffe9a0' : '#f5e3a3',
          backgroundColor: def.actor ? '#0a1628cc' : '#07131dcc', padding: { x: 3, y: def.actor ? 1 : 2 },
        }).setOrigin(0.5, 1).setDepth(20 + y * 0.001 + 0.002);
      this.storyTriggers.push({ def, x, y, mark, label, actor });
      mark.setVisible(false); label.setVisible(false); actor?.spr.image.setVisible(false);
    }
    const ice = STORY_PLACES.find((p) => p.key === 'poi:auction-ice-drop' && p.regionId === this.region);
    if (ice) {
      const { col, row } = this.nearestWalkable(ice.tx, ice.ty);
      const x = col * TR + TR / 2, y = row * TR + TR / 2;
      const ring = this.add.graphics().setDepth(19 + y * 0.001);
      ring.lineStyle(2, 0x79d7e8, 0.9).strokeRect(x - 22, y - 16, 44, 32);
      ring.lineStyle(1, 0x79d7e8, 0.35).strokeRect(x - 28, y - 22, 56, 44);
      const label = this.add.text(x, y - 28, '얼음 하역 위치', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#b9f2ff',
        backgroundColor: '#07131dcc', padding: { x: 3, y: 2 },
      }).setOrigin(0.5, 1).setDepth(19 + y * 0.001 + 0.001);
      this.iceDropMarker = this.add.container(0, 0, [ring, label]);
      this.iceDropMarker.setVisible(false);
    }
  }

  private storyTriggerAvailable(t: StoryFieldTrigger): boolean {
    return StoryStore.canPerformAction(t.questId, t.objectiveIndex, t.phase);
  }

  // ═══════════════════════════════════════════════════════════════
  // 165차 — 컷씬 재생 (실제 필드 무대 · 말풍선 · 배우 이동 · 조작 봉쇄)
  // ═══════════════════════════════════════════════════════════════

  /** 각본이 부르는 배우 키를 현재 필드의 실제 오브젝트에 연결한다. */
  private cineActor(who: string): CineActor | undefined {
    if (who === 'player') {
      return {
        obj: this.playerSprite,
        nameKo: GameState.player.nickname || '나',
        headY: this.charTopFromFeet - 6,
        setFacing: (d: CineDir) => this.charSprite?.setDir(d),
        setWalking: (on: boolean) => { this.playerCineWalking = on; },
      };
    }
    const n = this.storyNpcs.find((s) => s.def.npcId === who);
    if (!n) return undefined;
    return {
      obj: n.actor,
      followers: [n.label],
      nameKo: getStoryNpc(n.def.npcId)?.nameKo ?? n.def.npcId,
      headY: this.charTopFromFeet - 6,
      setFacing: (d: CineDir) => {
        if (n.ai) { n.ai.face(d); return; }
        const sheet = ensureCharSheet(this, characterOf(n.def.npcId), CHAR_SCALE);
        n.actor.setTexture(sheet, charFrameName(d, 0));
      },
      setWalking: (on: boolean) => { if (n.ai) n.ai.cineWalking = on; },
    };
  }

  /**
   * 각본을 지금 서 있는 필드에서 재생한다.
   * `roles`는 각본의 배우 키 → 실제 NPC id 치환표(예: `watcher` → `hyeonsu`).
   * 치환 대상이 이 지역에 없으면 그 배우의 대사는 말풍선 없이 대사창으로만 흐른다.
   */
  private playCinematic(script: CineScript, roles: Record<string, string>, onDone?: () => void, extraActors?: Record<string, CineActor>): boolean {
    if (this.cinematicActive || this.cinematic || !this.scene.isActive()) return false;
    const actors: Record<string, CineActor> = { ...(extraActors ?? {}) };
    for (const [key, npcId] of Object.entries(roles)) {
      if (actors[key]) continue;
      const a = this.cineActor(npcId);
      if (a) actors[key] = a;
    }
    this.cinematicActive = true;
    this.nearStoryTrigger = null;
    this.nearNpc = null;
    this.npcHintText?.setVisible(false);
    this.hud?.setVisible(false);
    this.playerBody.setVelocity(0, 0);
    MultiplayerClient.setActivity('cinematic');
    this.cinematic = new StoryCinematicPanel(this, {
      script, actors, tileSize: TR, camera: this.cameras.main,
      onComplete: () => {
        this.cinematic = undefined;
        this.cinematicActive = false;
        this.playerCineWalking = false;
        this.charSprite?.update(0, false);
        this.cameras.main.startFollow(this.playerBody, true, 0.14, 0.14);
        MultiplayerClient.setActivity('field');
        this.hud?.setVisible(true);
        onDone?.();
      },
    });
    return true;
  }

  /** ESC — 재생 중인 컷씬을 끝까지 건너뛴다(일시정지 메뉴로 새지 않는다). */
  private skipCinematic(): boolean {
    if (!this.cinematic) return false;
    this.cinematic.skip();
    return true;
  }

  /** M1-01 — 장소에 도착한 뒤 실제 속초 필드에서 재생되는 개인 독백 연출. */
  private startSokchoArrivalCinematic(placeKey: string): void {
    if (!StoryStore.isActive('M1-01')) return;
    const script = placeKey === 'poi:yeonggeumjeong' ? CINE_M1_YEONGGEUMJEONG : CINE_M1_OKSEON_STALL;
    this.playCinematic(script, { player: 'player', okseon: 'okseon' }, () => {
      this.hud?.pushLog(placeKey === 'poi:yeonggeumjeong'
        ? '[할 일] 동명항 방파제 쪽 좌판 거리로 이동한다'
        : '[할 일] 정옥선 할머니에게 말을 건다');
    });
  }

  private startStoryTrigger(t: StoryFieldTrigger): void {
    if (!this.storyTriggerAvailable(t)) return;
    const suffix = t.id.replace('n18-6-', '');
    const source = `n18-6:${suffix === 'origin-watch' ? 'watch-cinematic' : suffix}`;
    const done = (): void => {
      this.clearSceneExtras();
      StoryStore.emitAction(t.actionKey as import('@tra/core').StoryActionKey, source);
      this.hud?.pushLog(`[할 일] ${t.labelKo} — 진행 ${StoryStore.actionStep(t.questId, t.objectiveIndex)}/3`);
      this.refreshQuestMarkers(true);
    };
    if (t.phase === 0) {
      // 167차 — 사용자 각본: 숨은 수상한 사람 1(트리거 배우) + 동쪽에서 오는 수상한 사람 2(임시 배우)
      const tr = this.storyTriggers.find((x) => x.def.id === t.id);
      const extras: Record<string, CineActor> = {};
      if (tr?.actor && t.actor) {
        extras[t.actor.actorKey] = {
          obj: tr.actor.spr.image, followers: [tr.label], nameKo: t.actor.nameKo, headY: this.charTopFromFeet - 6,
          setFacing: (d: CineDir) => tr.actor!.spr.setDir(d),
          setWalking: (on: boolean) => { tr.actor!.walking = on; },
          keepPosition: true,
        };
      }
      const s2 = this.spawnSceneExtra({
        key: 's2', nameKo: '수상해 보이는 사람 2', nameEn: 'Suspicious person 2', role: 'office', sex: 'm', age: 'mid',
        tx: 601, ty: 154, facing: 'left', alpha: 0,
      });
      if (s2) extras.s2 = s2;
      if (!this.playCinematic(CINE_N186_WATCH, { player: 'player' }, () => {
        // 1은 장면 끝에 퇴장했다 — 단계가 올라 트리거가 닫히면 그대로 사라진다
        if (tr?.actor) { tr.actor.walking = false; tr.actor.spr.image.setAlpha(1); }
        done();
      }, extras)) this.clearSceneExtras();
      return;
    }
    const script = t.phase === 1 ? CINE_N186_LEDGER : CINE_N186_REPORT;
    this.playCinematic(script, { player: 'player', watcher: 'hyeonsu' }, done);
  }

  // ═══════════════════════════════════════════════════════════════
  // 167차 — 퀘스트 장면: talk·수동 목표는 컷씬이 끝나야 닫힌다
  // ═══════════════════════════════════════════════════════════════

  /** 대화창이 넘긴 장면 요청 — 대화창은 이미 닫혔다 */
  private runSceneRequest(req: DialogueSceneRequest): void {
    if (req.kind === 'objective') { this.playQuestScene(req.questId, req.objectiveIndex); return; }
    if (req.kind === 'trigger') {
      const def = STORY_FIELD_TRIGGERS.find((t) => t.id === req.triggerId);
      if (def) this.startStoryTrigger(def);
      return;
    }
    this.playActionChoiceScene(req.questId, req.objectiveIndex, req.choiceId);
  }

  /** 임시 배우 하나를 무대에 세운다 — 같은 얼굴 규칙(`characterOf`)·이름표·발 위치 */
  private spawnSceneExtra(extra: SceneExtra): CineActor | undefined {
    const pc = Math.floor(this.playerBody.x / TR), pr = Math.floor((this.playerBody.y + this.PLAYER_FOOT_OFFSET - 1) / TR);
    const want = extra.tx !== undefined && extra.ty !== undefined
      ? { c: extra.tx, r: extra.ty } : { c: pc + (extra.dx ?? 2), r: pr + (extra.dy ?? 0) };
    const { col, row } = this.nearestWalkable(want.c, want.r);
    const x = col * TR + TR / 2, y = row * TR + TR;
    const cfg = extra.npcId ? characterOf(extra.npcId)
      : characterOf(`extra:${extra.key}:${extra.nameKo}`, { role: extra.role, sex: extra.sex, age: extra.age });
    const spr = new CharacterSprite(this, x, y, cfg, CHAR_SCALE);
    spr.image.setPosition(x, y + spr.footPad).setDepth(20 + y * 0.001 + 0.0006).setAlpha(extra.alpha ?? 1);
    spr.setDir(extra.facing ?? 'down');
    const label = this.add.text(x, y + this.charTopFromFeet - RegionFieldScene.LABEL_GAP, extra.nameKo, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe9a0',
      backgroundColor: '#0a1628cc', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(20 + y * 0.001 + 0.0007).setAlpha(extra.alpha ?? 1);
    const rec = { key: extra.key, spr, label, walking: false };
    this.sceneExtras.push(rec);
    return {
      obj: spr.image, followers: [label], nameKo: extra.nameKo, headY: this.charTopFromFeet - 6,
      setFacing: (d: CineDir) => spr.setDir(d),
      setWalking: (on: boolean) => { rec.walking = on; },
      keepPosition: true,
    };
  }

  private clearSceneExtras(): void {
    for (const e of this.sceneExtras) { e.spr.destroy(); e.label.destroy(); }
    this.sceneExtras = [];
  }

  /**
   * 목표 장면 재생 → 끝나면 그 목표만 닫힌다(`scene` 이벤트). 상대가 이 필드에 없으면 임시 배우가 걸어와 만난다.
   * 이 함수가 167차의 핵심 계약이다 — **대화창 클릭이 목표를 닫는 경로는 더 이상 없다.**
   */
  private playQuestScene(questId: string, objectiveIndex: number): void {
    const def = questSceneFor(questId, objectiveIndex, {
      regionId: this.region, fieldNpcIds: this.storyNpcs.map((n) => n.def.npcId),
      // 장소 자막은 지금 서 있는 곳 — 퀘스트가 적어 둔 무대(병실·부산)를 쓰면 화면과 어긋난다(168차)
      placeKo: this.node.name, placeEn: this.node.nameEn,
    });
    if (!def) return;
    this.clearSceneExtras();
    const extras: Record<string, CineActor> = {};
    for (const ex of def.extras) { const a = this.spawnSceneExtra(ex); if (a) extras[ex.key] = a; }
    const roles: Record<string, string> = {};
    for (const [k, v] of Object.entries(def.roles)) if (!extras[k]) roles[k] = v;
    const ok = this.playCinematic(def.script, roles, () => {
      this.clearSceneExtras();
      StoryStore.event({ kind: 'scene', questId, objectiveIndex });
      this.refreshQuestMarkers(true);
    }, extras);
    if (!ok) this.clearSceneExtras();
  }

  /** 대화·선택 계통 행동 — 고른 태도가 장면으로 흐르고, 장면이 끝나야 단계가 오른다 */
  private playActionChoiceScene(questId: string, objectiveIndex: number, choiceId: string): void {
    const q = STORY_QUESTS.find((x) => x.id === questId);
    const o = q?.objectives[objectiveIndex];
    if (!q || !o?.actionKey) return;
    const spec = storyActionSpec(o.actionKey);
    const choice = spec.choices.find((c) => c.id === choiceId);
    const sc = storyActionScene(o.actionKey);
    const step = StoryStore.actionStep(questId, objectiveIndex);
    const partner = this.actionActorNpcId(o.actionKey);
    const stepLine = spec.stepsKo[Math.min(step, spec.stepsKo.length - 1)];
    const script: CineScript = {
      id: `action-choice-${o.actionKey}-${step}`,
      placeKo: sc.placeKo,
      steps: [
        { kind: 'focus', who: partner ? 'partner' : 'player', ms: 440 },
        ...(partner ? [{ kind: 'faceTo' as const, who: 'partner', target: 'player' }, { kind: 'faceTo' as const, who: 'player', target: 'partner' }] : []),
        { kind: 'say', who: 'player', thought: true, text: stepLine },
        ...(choice ? [{ kind: 'say' as const, who: 'player', text: choice.replyKo, bubble: '...' }] : []),
        ...(partner ? [{ kind: 'say' as const, who: 'partner', text: sc.linesKo[1], bubble: '...' }]
          : [{ kind: 'say' as const, who: 'player', thought: true, text: sc.linesKo[1] }]),
        { kind: 'say', who: 'player', thought: true, text: sc.linesKo[0] },
      ],
    };
    const roles: Record<string, string> = { player: 'player' };
    if (partner) roles.partner = partner;
    this.playCinematic(script, roles, () => {
      this.suppressActionScene = true;
      StoryStore.finishActionChoice(questId, objectiveIndex, choiceId);
      this.suppressActionScene = false;
      this.hud?.pushLog(`[할 일] ${sc.titleKo} — 진행 ${StoryStore.actionStep(questId, objectiveIndex)}/${spec.stepsKo.length}`);
      this.refreshQuestMarkers(true);
    });
  }

  /** N18-6 전용 3부작 외의 행동도 성공 직후 결과를 짧게 보여준다. */
  private showActionProgressScene(key: import('@tra/core').StoryActionKey, step: number): void {
    if (key === 'label_violation_review' || this.suppressActionScene || !this.scene.isActive()) return;
    const sc = storyActionScene(key);
    if (!sc || step < 1 || step > 3) return;
    const partner = this.actionActorNpcId(key);
    const script: CineScript = {
      id: `action-${key}-${step}`,
      placeKo: sc.placeKo,
      steps: [
        { kind: 'focus', who: 'player', ms: 440 },
        { kind: 'say', who: 'player', thought: true, text: sc.linesKo[0] },
        ...(partner ? [{ kind: 'say' as const, who: 'partner', text: sc.linesKo[1] }]
          : [{ kind: 'say' as const, who: 'player', thought: true, text: sc.linesKo[1] }]),
      ],
    };
    const roles: Record<string, string> = { player: 'player' };
    if (partner) roles.partner = partner;
    this.playCinematic(script, roles, () => {
      this.hud?.pushLog(`[할 일] ${sc.titleKo} — 진행 ${step}/3`);
    });
  }

  /** 현재 행동의 발주 인물을 이 지역의 실제 배우로 찾는다. */
  private actionActorNpcId(key: import('@tra/core').StoryActionKey): string | undefined {
    const quest = STORY_QUESTS.find((q) => StoryStore.isActive(q.id) && q.objectives.some((o) => o.actionKey === key));
    const giver = quest?.giver;
    if (giver && this.storyNpcs.some((n) => n.def.npcId === giver)) return giver;
    return this.storyNpcs.find((n) => n.def.npcId !== giver)?.def.npcId;
  }

  /** 166차 — NPC 시스템이 쓰는 지형 접근자 (씬 내부를 넘기지 않는다) */
  private get npcHost(): NpcFieldHost {
    return {
      cols: this.cols, rows: this.rows, tr: TR,
      terrainAt: (c, r) => this.terrainAt(c, r),
      isWalkable: (c, r) => this.isWalkable(c, r),
    };
  }

  /**
   * 지역에 배치된 스토리 NPC — 인물마다 고유 외형(`characterOf`, 138차) + 자유 행동(`StoryNpcActor`, 166차).
   * 이름표는 씬이 들고 매 프레임 본체를 따라간다(`updateFieldNpcs`).
   */
  private placeStoryNpcs(): void {
    this.storyNpcs = [];
    for (const def of STORY_NPC_PLACEMENTS) {
      if (def.regionId !== this.region) continue;
      const { col, row } = this.nearestWalkable(def.tx, def.ty);
      const ai = new StoryNpcActor(this, this.npcHost, characterOf(def.npcId), col, row, def.behavior, def.facing ?? 'down');
      const x = ai.x, y = ai.y;
      const actor = ai.image;
      const npc = getStoryNpc(def.npcId);
      const label = this.add.text(x, y + this.charTopFromFeet - RegionFieldScene.LABEL_GAP, npc?.nameKo ?? def.npcId, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#ffe9a0',
        backgroundColor: '#0a1628cc', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(20 + y * 0.001 + 0.0007);
      if (import.meta.env.DEV && def.behavior === 'fishing' && !ai.fishingSpotFound) {
        console.warn(`[FieldNpc] ${def.npcId}: 앵커 5x5 안에 물가가 없어 낚시 대신 배회한다 (${col},${row})`);
      }
      this.storyNpcs.push({ def, x, y, actor, label, ai });
    }
    StoryStore.setFieldNpcs(this.storyNpcs.map((n) => n.def.npcId));   // 167차 — 장면 입구 판정
    this.refreshQuestMarkers(true);
    // 166차 — 마을 사람: 스토리 NPC 앵커를 피해 결정적으로 흩어 놓는다
    this.ambientNpcs?.destroy();
    this.ambientNpcs = new AmbientNpcSystem(this, this.npcHost);
    this.ambientNpcs.spawn(`${this.region}:${this.mapId}`, this.storyNpcs.map((n) => ({ c: Math.floor(n.x / TR), r: Math.floor((n.y - 1) / TR) })));
    this.events.once('shutdown', () => {
      this.sceneExtras = [];   // 씬이 내려가며 오브젝트는 같이 파괴된다
      this.ambientNpcs?.destroy(); this.ambientNpcs = undefined;
      for (const n of this.storyNpcs) n.ai?.destroy();
    });
  }

  /**
   * 166차 — NPC 자율 행동 1프레임. `updateStoryProximity` 뒤·`uiBlocked` 가드 **앞**에서 돈다
   * (인벤토리를 열어도 마을은 계속 산다). 컷씬 중엔 스토리 NPC는 손을 떼고(`paused`) 이미지 좌표만 되읽는다.
   * 이름표·마커·[F] 판정·가이드 화살표는 전부 `n.x/n.y`를 보므로 여기서 되받아 적는다.
   */
  private updateFieldNpcs(delta: number): void {
    const cam = this.cameras.main;
    if (!this.cinematicActive) this.ambientNpcs?.update(delta, cam.midPoint.x, cam.midPoint.y);
    const px = this.playerBody.x, py = this.playerBody.y;
    if (this.cinematicActive) {
      // 167차 — 컷씬 배우들의 걷기 프레임(임시 배우·트리거 인물·플레이어)
      for (const e of this.sceneExtras) { e.spr.update(delta, e.walking); e.spr.image.setDepth(20 + (e.spr.image.y - e.spr.footPad) * 0.001 + 0.0006); }
      for (const t of this.storyTriggers) if (t.actor) t.actor.spr.update(delta, t.actor.walking);
      this.charSprite?.update(delta, this.playerCineWalking);
    }
    for (const n of this.storyNpcs) {
      if (!n.ai) continue;
      const hold = !this.cinematicActive && (this.nearNpc === n.def || (this.popupStack.length > 0 && Math.hypot(n.x - px, n.y - 12 - py) < 64));
      n.ai.update(delta, { paused: this.cinematicActive, hold, playerX: px, playerY: py });
      if (this.cinematicActive) continue;   // 컷씬이 이미지·이름표를 직접 옮긴다
      if (n.x === n.ai.x && n.y === n.ai.y) continue;
      n.x = n.ai.x; n.y = n.ai.y;
      n.label.setPosition(n.x, n.y + this.charTopFromFeet - RegionFieldScene.LABEL_GAP).setDepth(20 + n.y * 0.001 + 0.0007);
      n.mark?.setPosition(n.x + (n.markDx ?? 14), n.y - 26).setDepth(20 + n.y * 0.001 + 0.0008);
    }
  }

  // ── 136차 — NPC 퀘스트 마커 (필드 머리 위 + 미니맵) ──

  /** 상점 카테고리 → 미니맵 아이콘 키 */
  private static readonly MINI_SHOP_ICON: Record<BuildingKind, string> = {
    convenience: 'mm_conv', mart: 'mm_mart', market: 'mm_market', restaurant: 'mm_food',
    cafe: 'mm_cafe', pub: 'mm_pub', pharmacy: 'mm_pharm', daily: 'mm_daily',
  };

  /** 상점 POI 마커 (create 1회 — 위치·종류가 고정) */
  private miniShopMarkers: MiniMarker[] = [];
  /** 상호작용 없는 일반 장소 마커 — 바닥 이름표를 대신해 미니맵에만 남는다 (143차) */
  private miniPlaceMarkers: MiniMarker[] = [];
  /** 설정 '장소 이름표' — 끄면 바닥 이름표·점이 사라진다 (기본 끔) */
  private showFieldLabels = false;

  // ── 143차 멀티플레이 — 같은 지역의 다른 사람 (145차 외형·활동·밀어내기) ──
  /** playerId → 스프라이트·이름표·활동 배지 */
  private peerObjs = new Map<string, {
    img: Phaser.GameObjects.Image; tag: Phaser.GameObjects.Text;
    badge?: Phaser.GameObjects.Image; badgeKey?: string;
  }>();
  /** 밀어내기 대상 — 필드에서 실제로 걸어다니는 피어의 발 위치만 (145차) */
  private peerFeet: { x: number; y: number; id: string }[] = [];
  private peerSyncAt = 0;
  private questMarkerAt = 0;

  /**
   * NPC 퀘스트 상태 → 마커 아이콘.
   *  노란 물음표 = **말을 걸면 지금 해결/진행되는 것**(완료 가능 · manual 목표 대기)
   *  빨간 느낌표 = 수락 가능한 새 의뢰 보유
   * 메인/서브는 구분하지 않는다(사용자 결정 — 둘 다 가진 NPC에서 표기가 갈라지지 않게).
   */
  private npcMarkerIcon(npcId: string, mini: boolean): string | null {
    const q = StoryStore.questsForNpc(npcId);
    const manualReady = q.active.some((x) => x.objectives.some((o, i) => o.manual && !StoryStore.objectiveDone(x, i)));
    if (q.completable.length > 0 || manualReady) return mini ? 'mm_ready' : 'mk_ready';
    if (q.offer.length > 0) return mini ? 'mm_quest' : 'mk_quest';
    return null;
  }

  /** 필드 NPC 머리 위 마커 + 미니맵 마커 갱신 (스토리 상태가 바뀔 때만 실제 교체) */
  private refreshQuestMarkers(force = false): void {
    // 일반 장소(정류장·터미널 등)는 설정을 켰을 때만 — 기본은 거래처·인물만 찍는다
    const markers: MiniMarker[] = this.showFieldLabels
      ? [...this.miniShopMarkers, ...this.miniPlaceMarkers]
      : [...this.miniShopMarkers];
    for (const n of this.storyNpcs) {
      const key = this.npcMarkerIcon(n.def.npcId, false);
      if (force || key !== n.markKey) {
        n.mark?.destroy();
        n.mark = undefined;
        n.markKey = key ?? undefined;
        if (key) {
          // 몸통(y-34 ~ y-20) 우상단 — 머리(y-52~y-34)와 그 위 이름표를 피한 자리.
          // 오른쪽에 여유가 없으면(맵 끝·옆 NPC) 좌상단으로 (사용자 지시 "여유 공간에 따라")
          const crowdedRight = n.x + 30 > this.cols * TR
            || this.storyNpcs.some((o) => o !== n && Math.abs(o.y - n.y) < 24 && o.x > n.x && o.x - n.x < 40);
          n.markDx = crowdedRight ? -14 : 14;
          const img = addPixelIcon(this, key, n.x + n.markDx, n.y - 26, 16);
          if (img) { img.setDepth(20 + n.y * 0.001 + 0.0008); n.mark = img; }
        }
      }
      const mk = this.npcMarkerIcon(n.def.npcId, true);
      // 의뢰가 없어도 인물은 미니맵에 남는다 (143차 — 바닥 이름표를 끈 대신)
      const npcName = getStoryNpc(n.def.npcId)?.nameKo ?? n.def.npcId;
      markers.push(mk
        ? { wx: n.x, wy: n.y - 12, icon: mk, priority: mk === 'mm_ready' ? 3 : 2, label: npcName }
        : { wx: n.x, wy: n.y - 12, icon: 'mm_npc', priority: 2, label: npcName });
    }
    // 155차 — 전체 지도에서 찍은 핀은 미니맵에도 (청록 다이아)
    const pin = MapPinStore.get(this.region);
    if (pin) markers.push({ wx: pin.x, wy: pin.y, icon: 'mm_pin', priority: 4, shape: 'pin' });
    this.lastMiniMarkers = markers;
    this.hud?.setMiniMarkers(markers);
  }

  // ── 143차 멀티플레이 — 같은 지역의 다른 사람 그리기 ──

  /**
   * 내 위치를 올리고, 같은 지역에 있는 사람들을 그린다 (200ms 스로틀).
   *
   * **외형(145차)**: 서버가 각자 만든 `CharConfig`를 들고 있다가 그대로 돌려준다.
   * 구 구현은 `characterOf('mp_' + playerId)`로 id에서 얼굴을 지어냈다 — 모두의 화면에서
   * 일관되긴 했지만 **본인이 캐릭터 만들기에서 고른 얼굴과는 무관**했다. 외형이 없으면
   * (구 클라이언트) 예전 방식으로 폴백한다.
   *
   * **활동(145차)**: 1인칭·상점·실내에 들어간 사람은 마지막 자리에 서 있는 껍데기다.
   * 이름표 옆에 무엇을 하는지 배지를 달고 스프라이트를 흐리게 해서 "멈춰 있는 사람"과
   * "자리만 남은 사람"을 구분한다. 밀어내기 대상에서도 빠진다(보이지 않는 볼라드 방지).
   *
   * 이름표 높이는 내 캐릭터와 같은 기준(`charTopFromFeet`)을 쓴다.
   */
  private syncPeers(delta: number): void {
    if (!MultiplayerClient.isConnected) {
      if (this.peerObjs.size > 0) this.clearPeers();
      return;
    }
    // ⚠ 상점은 씬을 멈추지 않는다(팝업) — 매 프레임 여기서 덮어쓰므로 활동을 파생시킨다.
    //   1인칭·실내는 씬이 pause라 이 함수가 아예 안 돌고, 그쪽에서 건 setActivity가 그대로 남는다.
    MultiplayerClient.reportPosition(
      this.region, this.playerBody.x, this.playerBody.y, this.playerFacing,
      Math.hypot(this.playerBody.body.velocity.x, this.playerBody.body.velocity.y) > 4,
      this.cinematicActive ? 'cinematic' : this.shopPanel ? 'shop' : 'field',
    );
    this.peerSyncAt += delta;
    if (this.peerSyncAt < 200) return;
    this.peerSyncAt = 0;

    MultiplayerClient.setProfile(this.buildProfile());   // 146차 — 내용이 같으면 안 올라간다
    this.syncTrade();
    const peers = MultiplayerClient.peersInRegion(this.region);
    const alive = new Set<string>();
    this.peerFeet = [];
    for (const peer of peers) {
      alive.add(peer.playerId);
      const feetY = peer.y + this.PLAYER_FOOT_OFFSET;
      const depth = 20 + peer.y * 0.001;
      const tagY = feetY + this.charTopFromFeet - RegionFieldScene.LABEL_GAP;
      const onField = isFieldActive(peer.activity);
      if (onField) this.peerFeet.push({ x: peer.x, y: peer.y, id: peer.playerId });

      let o = this.peerObjs.get(peer.playerId);
      if (!o) {
        const sheet = ensureCharSheet(this, peer.look ?? characterOf(`mp_${peer.playerId}`), CHAR_SCALE);
        const img = this.add.image(peer.x, feetY, sheet, charFrameName(peer.facing, 0)).setOrigin(0.5, 1)
          .setInteractive();
        const pid = peer.playerId;
        img.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown()) this.onPeerRightClick(pid, p); });
        const tag = this.add.text(peer.x, tagY, peer.name, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fe8ff',
          backgroundColor: '#0a1628cc', padding: { x: 3, y: 1 },
        }).setOrigin(0.5, 1);
        o = { img, tag };
        this.peerObjs.set(peer.playerId, o);
      }
      o.img.setPosition(peer.x, feetY)
        .setFrame(charFrameName(peer.facing, peer.moving ? 1 : 0))
        .setDepth(depth)
        .setAlpha(onField ? 1 : 0.55);
      o.tag.setPosition(peer.x, tagY).setText(peer.activity === 'cinematic' ? `${peer.name} · 바쁨` : peer.name).setDepth(depth + 0.0007);

      // 활동 배지 — 이름표 오른쪽에 붙인다(이름 길이에 따라 자리가 따라간다)
      const key = RegionFieldScene.ACTIVITY_ICON[peer.activity ?? 'field'];
      if (!key) {
        o.badge?.destroy(); o.badge = undefined; o.badgeKey = undefined;
      } else {
        if (o.badgeKey !== key) {
          o.badge?.destroy();
          o.badge = addPixelIcon(this, key, peer.x, tagY, 10) ?? undefined;
          o.badgeKey = key;
        }
        o.badge?.setPosition(peer.x + o.tag.width / 2 + 7, tagY - 5).setDepth(depth + 0.0008);
      }
    }
    for (const [id, o] of this.peerObjs) {
      if (alive.has(id)) continue;
      o.img.destroy(); o.tag.destroy(); o.badge?.destroy();
      this.peerObjs.delete(id);
    }
  }

  /** 활동 → 이름표 옆 배지 (필드는 배지 없음 — 늘 붙어 있으면 소음이다) */
  private static readonly ACTIVITY_ICON: Record<MpActivity, string | null> = {
    field: null, fishing: 'act_fish', shop: 'act_shop', indoor: 'act_home', menu: 'act_away', cinematic: null,
  };

  // ── 146차 유저 간 거래 · 정보 보기 ──────────────────────────

  private tradePanel: TradePanel | null = null;
  /** 이미 응답 창을 띄운 제안 id (같은 제안에 두 번 묻지 않게) */
  private askedTradeId = '';
  /** 취소 사유를 한 번만 띄우기 위한 기록 */
  private notedTradeId = '';

  /** 남에게 보이는 프로필 — 계약 §MpProfile의 공개 항목만 */
  private buildProfile(): MpProfile {
    const gear = InventoryStore.items
      .filter((i) => i.equipped || i.equippedHand)
      .map((i) => ({ slot: i.equippedHand ? `손(${i.equippedHand})` : i.subCategory, name: i.name }));
    const rec = Object.entries(GameState.player.personalRecords ?? {})
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([speciesId, cm]) => ({ speciesId, cm: Math.round(cm) }));
    return {
      level: GameState.player.level, gear,
      licenses: GameState.licenses.filter((l) => !l.isExpired).map((l) => l.type as string),
      records: rec, trips: GameState.player.totalTrips,
    };
  }

  /** 피어 우클릭 — **한 칸 안**에서만 메뉴가 열린다(사용자 지시) */
  private onPeerRightClick(playerId: string, p: Phaser.Input.Pointer): void {
    if (this.uiBlocked) return;
    const peer = MultiplayerClient.peers.find((x) => x.playerId === playerId);
    if (!peer) return;
    const d = Math.hypot(peer.x - this.playerBody.x, peer.y - this.playerBody.y);
    if (d > MP_TRADE_RANGE_PX) { this.floatingHint('한 칸 안으로 다가가세요'); return; }
    this.suppressClickUntil = this.time.now + 250;
    openContextMenu(this, p.x, p.y, [
      { label: '정보 보기', run: () => this.openPeerInfo(peer) },
      { label: '거래하기', run: () => void this.requestTrade(peer) },
      { label: '취소', run: () => {/* 닫기만 */} },
    ]);
  }

  private openPeerInfo(peer: MpPeer): void {
    this.openPopup((close) => new PeerInfoPanel(this, GAME_WIDTH - 400, 60, peer, close));
  }

  /** 거래 요청 — 거절 사유는 채팅 로그에 그대로 (사용자 지시 "대상자가 바쁩니다") */
  private async requestTrade(peer: MpPeer): Promise<void> {
    if (!isFieldActive(peer.activity)) { this.hud?.pushLog(`[거래] ${MP_TRADE_REASON_KO.busy}`); return; }
    if (peer.trading) { this.hud?.pushLog(`[거래] ${MP_TRADE_REASON_KO.trading}`); return; }
    if (MultiplayerClient.trade && MultiplayerClient.trade.phase !== 'cancelled') { this.hud?.pushLog(`[거래] ${MP_TRADE_REASON_KO.meTrading}`); return; }
    const r = await MultiplayerClient.proposeTrade(peer.playerId);
    this.hud?.pushLog(r.ok ? `[거래] ${peer.name} 님에게 거래를 요청했습니다 — 응답을 기다립니다` : `[거래] ${r.reasonKo ?? '요청하지 못했습니다.'}`);
  }

  /**
   * 서버가 돌려준 거래 상태를 화면에 맞춘다 (200ms).
   *  proposed(내게 온 것) → 수락/거절 창 · open → 거래 창 · committed → 적용 · cancelled → 사유 한 번.
   */
  private syncTrade(): void {
    const t = MultiplayerClient.trade;
    if (!t) { if (this.tradePanel) this.closeTradePanel(); return; }
    const { me, other } = MultiplayerClient.tradeSides(t);
    switch (t.phase) {
      case 'proposed':
        if (t.to.userId === MultiplayerClient.userId && this.askedTradeId !== t.tradeId && !this.uiBlocked) {
          this.askedTradeId = t.tradeId;
          this.openPopup((close) => new ConfirmDialog(
            this, `${other.name} 님이 거래를 요청했습니다.\n수락하시겠습니까?`,
            () => { close(); void MultiplayerClient.respondTrade(t.tradeId, true); },
            () => { close(); void MultiplayerClient.respondTrade(t.tradeId, false); },
          ));
        }
        return;
      case 'open':
        if (!this.tradePanel) {
          this.tradePanel = this.openPopup(
            (close) => new TradePanel(this, () => { void MultiplayerClient.cancelTrade(t.tradeId); close(); }, {
              openQuantity: (cfg) => { this.openPopup((c2) => new QuantityDialog(this, { ...cfg, onConfirm: (q) => { c2(); cfg.onConfirm(q); }, onCancel: () => { c2(); cfg.onCancel(); } })); },
              pushLog: (m) => this.hud?.pushLog(m),
            }),
            () => { this.tradePanel = null; },
          );
        } else this.tradePanel.sync();
        return;
      case 'committed':
        this.closeTradePanel();
        if (!me.offer.applied && !MultiplayerClient.hasAppliedTrade(t.tradeId)) this.applyTrade(t, me, other);
        return;
      case 'cancelled':
        this.closeTradePanel();
        if (this.notedTradeId !== t.tradeId) {
          this.notedTradeId = t.tradeId;
          this.hud?.pushLog(`[거래] ${t.reasonKo ?? MP_TRADE_REASON_KO.cancelled}`);
        }
        return;
    }
  }

  private closeTradePanel(): void {
    const p = this.tradePanel;
    if (!p) return;
    this.tradePanel = null;
    const e = this.popupStack.find((x) => x.panel === p);
    if (e) e.close(); else p.destroy();
  }

  /**
   * 도장 찍힌 거래를 내 인벤토리에 적용한다 — **한 번만**(localStorage 기억).
   * 내가 준 것을 빼고 상대가 준 것을 넣는다. 재화는 `quiet`로 — earn 목표에 세지 않는다.
   */
  private applyTrade(t: MpTradeState, me: MpTradeState['from'], other: MpTradeState['from']): void {
    MultiplayerClient.markTradeApplied(t.tradeId);
    for (const it of me.offer.items) InventoryStore.removeQty(it.srcId, it.qty);
    if (me.offer.coins > 0) GameState.addCoins(-me.offer.coins, true);
    let lost = 0;
    for (const it of other.offer.items) if (!InventoryStore.importTradeItem(it)) lost += it.qty;
    if (other.offer.coins > 0) GameState.addCoins(other.offer.coins, true);
    GameState.markDirty();
    this.events.emit('inventory-changed');
    this.hud?.refreshQuickslots();
    const gave = [...me.offer.items.map((i) => `${i.name} x${i.qty}`), ...(me.offer.coins ? [`${me.offer.coins.toLocaleString()}원`] : [])].join(', ') || '없음';
    const got = [...other.offer.items.map((i) => `${i.name} x${i.qty}`), ...(other.offer.coins ? [`${other.offer.coins.toLocaleString()}원`] : [])].join(', ') || '없음';
    this.hud?.pushLog(`[거래] ${MP_TRADE_REASON_KO.done} 준 것: ${gave} / 받은 것: ${got}`);
    if (lost) this.hud?.pushLog(`[경고] 가방이 가득 차 ${lost}개를 받지 못했습니다`);
  }

  /**
   * 피어 소프트 푸시 (145차 — 스타듀 방식). 겹침을 허용하되 서서히 벌린다.
   *
   * ⚠ **피어에게 물리 바디를 달지 않는다** — 피어 좌표는 1초 폴링이라 스냅샷이 튄다.
   * 정지 바디를 달면 순간이동한 유령에 내가 끼인다. 대신 **내 바디만** 분리 속도를 받는다.
   * 양쪽 클라이언트가 각자 자기를 밀어내므로 결과는 대칭이고, 지터에 면역이며, 이동이 막히지 않는다.
   * 또 **밀려 들어갈 칸이 막혀 있으면 그 축으로는 밀지 않는다**(벽·바다로 밀려나는 것 방지).
   */
  private applyPeerPush(delta: number): void {
    if (!this.peerFeet.length || !this.playerBody || this.playerActionLocked || this.uiBlocked) return;
    const R = RegionFieldScene.PEER_PUSH_RADIUS;
    let ax = 0, ay = 0;
    for (const f of this.peerFeet) {
      let dx = this.playerBody.x - f.x;
      let dy = this.playerBody.y - f.y;
      let d = Math.hypot(dx, dy);
      if (d >= R * 2) continue;
      if (d < 0.001) {
        // ⚠ 정확히 겹치면 분리 방향이 0벡터라 영영 안 벌어진다(실측으로 잡음).
        //   id 비교로 서로 **반대 방향**을 고른다 — 양쪽이 자기를 밀므로 결과가 대칭이다.
        dx = MultiplayerClient.playerId < f.id ? -1 : 1;
        dy = 0;
        d = 1;
      }
      const push = (1 - d / (R * 2));
      ax += (dx / d) * push;
      ay += (dy / d) * push;
    }
    if (ax === 0 && ay === 0) return;
    const mag = Math.hypot(ax, ay);
    const sp = RegionFieldScene.PEER_PUSH_SPEED * Math.min(1, mag);
    const vx = (ax / mag) * sp;
    const vy = (ay / mag) * sp;
    const step = delta / 1000;
    const nx = this.playerBody.x + vx * step;
    const ny = this.playerBody.y + vy * step;
    if (this.walkableAtWorld(nx, this.playerBody.y)) this.playerBody.x = nx;
    if (this.walkableAtWorld(this.playerBody.x, ny)) this.playerBody.y = ny;
  }

  /** 발밑 반경 (px) — 32px 타일의 약 1/4. 몸통이 아니라 발만 본다 */
  private static readonly PEER_PUSH_RADIUS = 7;
  /** 분리 속도 (px/s) — 걷기(210)의 절반 아래라 "밀려난다"기보다 "비켜진다" */
  private static readonly PEER_PUSH_SPEED = 90;

  /** 월드 좌표가 걸어갈 수 있는 칸인가 (밀어내기 안전판) */
  private walkableAtWorld(x: number, y: number): boolean {
    const c = Math.floor(x / TR), r = Math.floor(y / TR);
    const t = this.terrainAt(c, r);
    return t !== undefined && t !== 'water' && t !== 'building';
  }

  /**
   * 건물 뒤로 들어가면 지붕·벽을 반투명하게 (145차 — 사용자 지시).
   *
   * ⚠ **트리거 콜라이더를 새로 달지 않는다.** 이 게임의 건물 몸통은 청크 텍스처에 구워져 있고,
   * 그 위에 얹히는 것은 POI 프리팹 이미지다. POI 187곳에 트리거를 다는 대신 **이미 있는
   * 프리팹 사각형**에 발끝을 넣어 본다(새 물리 바디 0개).
   *
   * 판정은 두 가지를 모두 만족할 때다 —
   *  ① 발끝이 프리팹 그림 안에 있고 ② 내 깊이가 그 그림보다 뒤(= 내 y가 더 작다).
   * ②가 없으면 건물 **앞**을 지날 때도 투명해진다(그때는 내가 이미 앞에 그려진다).
   *
   * 나가는 판정은 사각형을 `OCCLUDE_HYSTERESIS`만큼 넓혀서 본다 — 가장자리를 따라 걸을 때
   * 켜졌다 꺼졌다 깜빡이지 않게.
   */
  private updateOccluders(delta: number): void {
    this.occludeAt += delta;
    if (this.occludeAt < 120 || !this.playerBody) return;
    this.occludeAt = 0;
    const px = this.playerBody.x;
    const py = this.playerBody.y + this.PLAYER_FOOT_OFFSET;

    // 대상 = POI 프리팹(145차) + **타일 건물 지붕·주택 오브젝트**(150차).
    //  구 구현은 프리팹만 봐서 "상호작용 건물 뒤는 비치는데 타일 건물 뒤는 안 보인다"는
    //  사용자 리포트가 났다.
    const targets: OccluderObj[] = [];
    for (const list of this.occludersByChunk.values()) targets.push(...list);
    const fromChunks = this.chunks?.listOccluders();
    if (fromChunks) targets.push(...fromChunks);

    for (const img of targets) {
      if (!img.active) continue;
      const on = this.faded.has(img);
      const pad = on ? RegionFieldScene.OCCLUDE_HYSTERESIS : 0;
      // ⚠ 원점이 제각각이다(프리팹 0.5/1 · 지붕 RT 0/0) → **경계 상자**로 판정한다.
      const b = img.getBounds();
      const inside = py < b.bottom + pad && py > b.top - pad
        && px > b.left - pad && px < b.right + pad;
      if (inside === on) continue;
      if (inside) this.faded.add(img); else this.faded.delete(img);
      this.tweens.killTweensOf(img);
      this.tweens.add({
        targets: img, alpha: inside ? RegionFieldScene.OCCLUDE_ALPHA : 1,
        duration: RegionFieldScene.OCCLUDE_MS, ease: 'Sine.easeOut',
      });
    }

    // 청크가 내려가면 그 그림은 파괴된다 — 죽은 참조를 걷어낸다.
    if (this.faded.size > 64) {
      for (const img of [...this.faded]) if (!img.active) this.faded.delete(img);
    }
  }

  /** 건물 뒤에 섰을 때 지붕 알파 */
  private static readonly OCCLUDE_ALPHA = 0.38;
  /** 페이드 시간 (ms) — 딱 끊기면 튀어 보인다 */
  private static readonly OCCLUDE_MS = 200;
  /** 나가는 판정 여유 (px) — 경계를 따라 걸을 때 깜빡임 방지 */
  private static readonly OCCLUDE_HYSTERESIS = 6;

  /**
   * 채팅 입력 시작 (145차).
   *
   * ⚠ **Phaser 키보드 플러그인을 통째로 끈다.** 일반 `keydown` 리스너에서 삼키고
   * `stopPropagation()`을 불러도 소용이 없다 — Phaser는 같은 DOM 이벤트로 `keydown-B`,
   * `keydown-ESC` 같은 조합 이벤트를 **따로 emit**하기 때문이다(실측: 채팅에 `b`를 치면
   * 쿨러 창이 열렸다). 입력 중에는 window에서 직접 받아 HUD로 넘긴다.
   */
  private startCompose(): void {
    if (this.chatInput) return;
    this.hud?.beginCompose();
    // ⚠ 150차: 구 구현은 window keydown에서 `ev.key`를 한 자씩 받아 **한글이 입력되지 않았다**
    //   (조합 중에는 key가 'Process'로 오고 완성 글자는 keydown으로 오지 않는다).
    //   숨김 DOM 입력에 맡기고 값만 받아 온다. Phaser 키보드는 TextInput이 꺼 준다.
    this.chatInput = new TextInput(this, {
      maxLength: MP_CHAT_MAX_LEN,
      filter: (v) => v.replace(/[\r\n\t]/g, ''),
      onChange: (v) => this.hud?.setCompose(v),
      onSubmit: (v) => {
        const text = v.trim();
        this.hud?.commitCompose();
        this.endCompose();
        if (!text) return;
        MultiplayerClient.say(text);
        // 혼자 하는 중이면 서버가 돌려줄 사람이 없다 — 내 화면에만 남긴다(혼잣말).
        if (!MultiplayerClient.isConnected) this.hud?.pushLog(`${GameState.player.nickname}: ${text}`);
      },
      onCancel: () => { this.hud?.cancelCompose(); this.endCompose(); },
    });
  }

  private endCompose(): void {
    if (!this.chatInput) return;
    this.chatInput.close();
    this.chatInput = undefined;
    this.hud?.cancelCompose();
  }

  /** 채팅 입력 중인 숨김 DOM 입력 (없으면 입력 중이 아니다) */
  private chatInput?: TextInput;

  private clearPeers(): void {
    for (const o of this.peerObjs.values()) { o.img.destroy(); o.tag.destroy(); o.badge?.destroy(); }
    this.peerObjs.clear();
    this.peerFeet = [];
  }

  /** NPC 근접 [F] 힌트 + 방문 장소(영금정 등) 자동 달성 — 150ms 스로틀 */
  // ═══════════════════════════════════════════════════
  // 155차 — 퀘스트 목표 화살표 가이드 + 추적기 + 전체 지도
  // ═══════════════════════════════════════════════════

  /** 이름 조회 — core `objectiveHowToKo`가 클라 데이터 이름을 쓰게 한다 */
  private guideNames(): GuideNames {
    return {
      npcName: (id) => getStoryNpc(id)?.nameKo ?? id,
      itemName: (id) => {
        const hit = this.guideItemNames.get(id);
        if (hit) return hit;
        const n = buildItemWikiCatalog().find((w) => w.id === id)?.name ?? id;
        this.guideItemNames.set(id, n);
        return n;
      },
      regionName: (id) => this.regionNameKo(id),
      jobName: (id) => getDayJob(id)?.nameKo ?? id,
      placeName: (key) => STORY_PLACES.find((p) => p.key === key)?.labelKo ?? key.replace(/^poi:/, ''),
    };
  }

  private regionNameKo(id: string): string {
    if (id === 'hometown') return '숙소(집)';
    return getRegionById(id)?.nameKo ?? WORLD_NODE_DATABASE.find((n) => n.id === id)?.name ?? id;
  }

  /**
   * 지금 안내할 할 일 — 활성(메인 우선) → 전부 끝났으면 발주자에게 보고 → 활성이 없으면 받을 수 있는 메인.
   * 화살표는 **하나만** 가리킨다(여럿을 동시에 가리키면 어느 것도 못 가리킨 셈이다).
   */
  private pickGuideQuest(kindWanted?: 'main' | 'sub'): { q: StoryQuestDef; idx: number | null; kind: 'active' | 'offer' } | null {
    const entry = (q: StoryQuestDef): { q: StoryQuestDef; idx: number | null; kind: 'active' } =>
      ({ q, idx: nextObjectiveIndex(q, (i) => StoryStore.objectiveDone(q, i)), kind: 'active' });
    // 일지에서 고정한 할 일이 최우선(사용자 지시) — 없으면 활성 할 일, 그다음 받을 수 있는 메인
    const pinnedId = kindWanted === 'sub' ? StoryStore.pinned.sub : StoryStore.pinned.main;
    const pinned = pinnedId ? STORY_QUESTS.find((q) => q.id === pinnedId) : undefined;
    if (pinned && StoryStore.status(pinned) === 'active') return entry(pinned);
    const act = STORY_QUESTS.filter((q) => StoryStore.status(q) === 'active'
      && (!kindWanted || q.kind === kindWanted))
      .sort((a2, b2) => (a2.kind === b2.kind ? 0 : a2.kind === 'main' ? -1 : 1));
    if (act.length) return entry(act[0]);
    if (kindWanted === 'sub') return null;
    const off = STORY_QUESTS.find((q) => q.kind === 'main' && !!q.giver && StoryStore.status(q) === 'available');
    return off ? { q: off, idx: null, kind: 'offer' } : null;
  }

  /** 목표 → 이 지역의 월드 좌표(있으면) / 다른 지역이면 `away` */
  private resolveGuideTarget(t: QuestGuideTarget): { x: number; y: number; label: string } | { away: string } | null {
    const names = this.guideNames();
    switch (t.kind) {
      case 'npc': {
        if (!t.npcId) return null;
        const n = this.storyNpcs.find((s) => s.def.npcId === t.npcId);
        if (n) return { x: n.x, y: n.y - 12, label: names.npcName(t.npcId) };
        const pl = STORY_NPC_PLACEMENTS.find((p) => p.npcId === t.npcId);
        return pl ? { away: this.regionNameKo(pl.regionId) } : null;
      }
      case 'place': {
        const pl = STORY_PLACES.find((p) => p.key === t.placeKey);
        if (!pl) return null;
        if (pl.regionId !== this.region) return { away: this.regionNameKo(pl.regionId) };
        return { x: pl.tx * TR + TR / 2, y: pl.ty * TR + TR / 2, label: pl.labelKo };
      }
      case 'shop': {
        const want = t.shopHint === 'daily' ? 'mm_daily' : t.shopHint === 'market' ? 'mm_market' : t.shopHint === 'mart' ? 'mm_mart' : null;
        const px = this.playerBody.x, py = this.playerBody.y;
        const pool = want ? this.miniShopMarkers.filter((m) => m.icon === want) : this.miniShopMarkers;
        const list = pool.length ? pool : this.miniShopMarkers;
        let best: MiniMarker | null = null, bd = Infinity;
        for (const m of list) { const d = Math.hypot(m.wx - px, m.wy - py); if (d < bd) { bd = d; best = m; } }
        if (!best) return this.region === 'hometown' ? { away: '속초 시장' } : null;
        const kind = (Object.entries(RegionFieldScene.MINI_SHOP_ICON).find(([, ic]) => ic === best!.icon)?.[0] ?? 'market') as BuildingKind;
        return { x: best.wx, y: best.wy, label: pool.length ? BUILDING_LABEL[kind] : '가까운 상점' };
      }
      case 'region': {
        if (!t.regionId || t.regionId === this.region) return null;
        if (this.region === 'hometown') {
          const bus = this.homeObjects.find((o) => o.interact === 'bus');
          if (bus) return { x: bus.tx * TR + TR / 2, y: bus.ty * TR + TR / 2, label: '출조 버스' };
        }
        return { away: this.regionNameKo(t.regionId) };
      }
      case 'bed': {
        if (this.region === 'hometown') {
          const door = this.homeObjects.find((o) => o.interact === 'door');
          if (door) return { x: door.tx * TR + TR / 2, y: door.ty * TR + TR / 2, label: '집 (침대)' };
        }
        return { away: '숙소(집)' };
      }
      default: return null;
    }
  }

  /** 400ms마다 목표를 다시 고르고, 매 프레임 화살표를 그린다 */
  private updateQuestGuide(delta: number): void {
    this.questGuideAt += delta;
    if (this.questGuideAt >= 400) {
      this.questGuideAt = 0;
      const main = this.pickGuideQuest('main');
      const sub = this.pickGuideQuest('sub');
      // 화살표는 메인을 먼저 가리킨다 — 메인이 없을 때만 서브로 내려간다
      this.questTargetPos = null;
      const entries: QuestTrackerEntry[] = [];
      let arrowSet = false;
      for (const pick of [main, sub]) {
        if (!pick) continue;
        const built = this.buildTrackerEntry(pick, !arrowSet);
        if (built.tookArrow) arrowSet = true;
        entries.push(built.entry);
      }
      this.hud?.setQuestTracker(entries.length ? { entries } : null);
    }
    this.drawQuestArrow();
  }

  /** 할 일 하나 → 「지금 할 일」 한 줄. `claimArrow`면 필드 화살표 목표도 이 할 일이 가져간다. */
  private buildTrackerEntry(
    pick: { q: StoryQuestDef; idx: number | null; kind: 'active' | 'offer' },
    claimArrow: boolean,
  ): { entry: QuestTrackerEntry; tookArrow: boolean } {
    const names = this.guideNames();
    const { q, idx, kind } = pick;
    let target: QuestGuideTarget; let objective: string; let howTo: string;
    if (kind === 'offer') {
      target = { kind: 'npc', npcId: q.giver };
      objective = `새 할 일 — ${names.npcName(q.giver)}에게 말을 건다`;
      howTo = `${names.npcName(q.giver)}에게 다가가 [F] → 「내가 도와줄 수 있는 게 있을까요?」`;
    } else if (idx === null) {
      target = q.giver ? { kind: 'npc', npcId: q.giver } : { kind: 'none' };
      objective = q.giver ? `${names.npcName(q.giver)}에게 돌아가 보고한다` : '할 일을 마쳤다 — 일지(J)에서 확인';
      howTo = q.giver ? `${names.npcName(q.giver)}에게 [F]` : '';
    } else {
      const o = q.objectives[idx];
      target = objectiveTarget(q, o);
      const tgt = StoryStore.objectiveTarget(o);
      const cur = Math.min(tgt, o.actionKey
        ? StoryStore.actionStep(q.id, idx)
        : (StoryStore.progress(q.id)?.obj[idx] ?? 0));
      objective = (narrativeOf(q.id)?.objectives?.[idx] ?? o.labelKo)
        + (o.actionKey || tgt > 1 ? ` (${cur}/${tgt}${o.actionKey && cur >= tgt ? ' · 준비 완료!' : ''})` : '');
      howTo = objectiveHowToKo(q, o, names);
    }
    const res = this.resolveGuideTarget(target);
    let distance: string | undefined;
    let tookArrow = false;
    if (res && 'away' in res) {
      distance = `다른 지역 — ${res.away}`;
      if (!howTo || target.kind === 'npc') howTo = `${res.away}(으)로 이동 — 버스 정류장 [F] → 전국 지도`;
    } else if (res && claimArrow) {
      this.questTargetPos = res;
      tookArrow = true;
    }
    // 직전 목표가 「완료 직후 안내」를 갖고 있고 이번 목표를 아직 시작하지 않았다면,
    // 방금 무엇을 끝냈고 이제 무엇을 할 차례인지 한 줄로 잇는다 (165차).
    let settled = idx !== null && !!q.objectives[idx] && StoryStore.objectiveDone(q, idx);
    if (idx !== null && idx > 0) {
      const prev = q.objectives[idx - 1];
      const started = (StoryStore.progress(q.id)?.obj[idx] ?? 0) > 0;
      if (prev?.afterKo && StoryStore.objectiveDone(q, idx - 1) && !started) {
        objective = prev.afterKo;
        settled = true;
      }
    }
    const title = `${q.titleKo}${settled ? ' (완료!)' : ''}`;
    return {
      entry: {
        kind: q.kind === 'sub' ? 'sub' : 'main',
        title, objective, howTo: howTo || undefined, distance,
        pinned: StoryStore.isPinned(q.id),
      },
      tookArrow,
    };
  }

  /** 캐릭터 기준 화살표 — 목표 방향, 반지름 46px. 가까우면(56px) 감춘다. 점멸(사용자 지시 "빤짝이는 화살표"). */
  private drawQuestArrow(): void {
    const blocked = !this.playerBody || this.uiBlocked || this.isTransitioning;
    const t = this.questTargetPos;
    if (!this.questGuideG) {
      this.questGuideG = this.add.graphics().setDepth(62);
      this.questGuideLbl = this.add.text(0, 0, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe9a0',
        backgroundColor: '#0a1628cc', padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 0.5).setDepth(62);
      this.pinArrowG = this.add.graphics().setDepth(62);
      this.pinArrowLbl = this.add.text(0, 0, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fe8ff',
        backgroundColor: '#0a1628cc', padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 0.5).setDepth(62);
    }
    const blink = 0.55 + 0.45 * Math.abs(Math.sin(this.time.now / 260));
    this.drawGuideArrow(this.questGuideG, this.questGuideLbl!, blocked ? null : t, 46, 0xffd257, blink);
    const pin = MapPinStore.get(this.region);
    this.drawGuideArrow(this.pinArrowG!, this.pinArrowLbl!, blocked || !pin ? null : { x: pin.x, y: pin.y, label: '핀' }, 60, 0x5cd0ff, blink);
  }

  private drawGuideArrow(
    g: Phaser.GameObjects.Graphics, lbl: Phaser.GameObjects.Text,
    t: { x: number; y: number; label: string } | null, radius: number, color: number, alpha: number,
  ): void {
    if (!t) { g.setVisible(false); lbl.setVisible(false); return; }
    const px = this.playerBody.x, py = this.playerBody.y - 18;
    const dx = t.x - px, dy = t.y - py;
    const d = Math.hypot(dx, dy);
    if (d < 56) { g.setVisible(false); lbl.setVisible(false); return; }
    const ux = dx / d, uy = dy / d;
    const ax = px + ux * radius, ay = py + uy * radius;
    g.clear(); g.setVisible(true); g.setAlpha(alpha);
    // 삼각형 — 진행 방향으로 뾰족, 뒤에 두 날개
    const tipX = ax + ux * 8, tipY = ay + uy * 8;
    const bx = ax - ux * 6, by = ay - uy * 6;
    const nx = -uy, ny = ux;
    g.fillStyle(0x0a1628, 0.9); g.fillTriangle(tipX + ux, tipY + uy, bx + nx * 7, by + ny * 7, bx - nx * 7, by - ny * 7);
    g.fillStyle(color, 1); g.fillTriangle(tipX, tipY, bx + nx * 5.5, by + ny * 5.5, bx - nx * 5.5, by - ny * 5.5);
    const mPerTile = this.chunks ? 5 : 2;
    const meters = Math.round((d / TR) * mPerTile);
    lbl.setText(`${t.label} · ${meters}m`).setPosition(px + ux * (radius + 24), py + uy * (radius + 24)).setVisible(true);
  }

  /** M — 전체 지도 오버레이 토글 */
  private toggleFullMap(): void {
    if (this.fullMapClose) { this.fullMapClose(); return; }
    if (this.uiBlocked || !this.hud) return;
    const mapTex = `rhud_mini_${this.mapId}`;
    if (!this.textures.exists(mapTex)) return;
    this.openPopup((close) => {
      this.fullMapClose = close;
      return new FullMapPanel(this, {
        mapTex, cols: this.cols, rows: this.rows, worldW: this.worldW, worldH: this.worldH,
        titleKo: this.node.name,
        regionId: this.region,
        markers: () => (this.showFieldLabels ? this.lastMiniMarkers : [...this.lastMiniMarkers, ...this.miniPlaceMarkers]),
        player: () => ({ x: this.playerBody.x, y: this.playerBody.y }),
        peers: () => [...this.peerObjs.values()].map((o) => ({ x: o.img.x, y: o.img.y, name: o.tag.text })),
        target: () => this.questTargetPos,
        onClose: close,
      });
    }, () => { this.fullMapClose = undefined; });
  }

  private updateStoryProximity(delta: number): void {
    this.storyProxAt += delta;
    if (this.storyProxAt < 150 || !this.playerBody) return;
    this.storyProxAt = 0;
    const px = this.playerBody.x, py = this.playerBody.y;
    let trigger: StoryFieldTrigger | null = null;
    let triggerDist = 58;
    for (const t of this.storyTriggers) {
      const available = this.storyTriggerAvailable(t.def);
      t.mark.setVisible(available && !t.actor); t.label.setVisible(available);
      t.actor?.spr.image.setVisible(available);
      if (!available) continue;
      const d = Math.hypot(t.x - px, t.y - py);
      if (d < triggerDist) { triggerDist = d; trigger = t.def; }
    }
    this.nearStoryTrigger = trigger;
    let nearest: StoryNpcPlacement | null = null, best = 48;
    for (const n of this.storyNpcs) {
      const d = Math.hypot(n.x - px, (n.y - 12) - py);
      if (d < best) { best = d; nearest = n.def; }
    }
    this.nearNpc = trigger ? null : nearest;
    // 퀘스트 마커는 600ms마다만 재평가 (상태가 안 바뀌면 교체도 없다)
    this.questMarkerAt += 150;
    if (this.questMarkerAt >= 600) { this.questMarkerAt = 0; this.refreshQuestMarkers(); }
    if (trigger && !this.uiBlocked && !this.placing) {
      if (!this.npcHintText) {
        this.npcHintText = this.add.text(0, 0, '', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe9a0',
          backgroundColor: '#0a1628dd', padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 1).setDepth(60);
      }
      this.npcHintText.setText(`[F] ${trigger.labelKo}`).setPosition(px, this.playerLabelY).setVisible(true);
    } else if (nearest && !this.uiBlocked && !this.placing) {
      const npc = getStoryNpc(nearest.npcId);
      const q = StoryStore.questsForNpc(nearest.npcId);
      const tag = q.completable.length ? ' — 의뢰 완료' : q.offer.length ? ' — 새 의뢰' : q.active.length ? ' — 진행 중' : '';
      if (!this.npcHintText) {
        this.npcHintText = this.add.text(0, 0, '', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe9a0',
          backgroundColor: '#0a1628dd', padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 1).setDepth(60);
      }
      try {
        this.npcHintText.setText(`[F] ${npc?.nameKo ?? nearest.npcId}${tag}`)
          .setPosition(px, this.playerLabelY).setVisible(true);
      } catch (e) {
        console.warn('[RegionFieldScene] 오래된 NPC 힌트 텍스트 폐기', e);
        this.npcHintText = undefined;
      }
    } else this.npcHintText?.setVisible(false);
    // 방문 장소
    for (const pl of STORY_PLACES) {
      if (pl.regionId !== this.region || this.firedPlaces.has(pl.key)) continue;
      const cx = pl.tx * TR + TR / 2, cy = pl.ty * TR + TR / 2;
      if (Math.hypot(cx - px, cy - py) <= pl.radiusTiles * TR) {
        const m101 = StoryStore.progress('M1-01');
        const arrivalScene = pl.key === 'poi:yeonggeumjeong' ? (m101?.obj[0] ?? 0) === 0
          : pl.key === 'poi:okseon-stall' ? (m101?.obj[1] ?? 0) === 0 : false;
        this.firedPlaces.add(pl.key);
        StoryStore.event({ kind: 'visit', placeKey: pl.key });
        // 장소 도착 뒤 이어지는 수동 목표의 현장 행동을 실제 이동/도착 이벤트에 연결한다.
        StoryStore.emitActionSource('field', `place:${pl.key}`);
        this.hud?.pushLog(`[장소] ${pl.labelKo}에 도착했습니다`);
        if (arrivalScene && (pl.key === 'poi:yeonggeumjeong' || pl.key === 'poi:okseon-stall')) {
          this.startSokchoArrivalCinematic(pl.key);
        }
      }
    }
    const icePlace = STORY_PLACES.find((p) => p.key === 'poi:auction-ice-drop' && p.regionId === this.region);
    const iceProgress = StoryStore.progress('M1-02');
    const carryingIce = !!InventoryStore.find('quest_ice_crate');
    this.nearIceDrop = !!icePlace && StoryStore.isActive('M1-02') && carryingIce
      && (iceProgress?.obj[1] ?? 0) >= 1 && (iceProgress?.obj[2] ?? 0) === 0
      && Math.hypot(icePlace.tx * TR + TR / 2 - px, icePlace.ty * TR + TR / 2 - py) <= 48;
    this.iceDropMarker?.setVisible(StoryStore.isActive('M1-02') && (iceProgress?.obj[1] ?? 0) < 1);
    if (this.nearIceDrop && !this.uiBlocked && !this.placing) {
      if (!this.npcHintText) {
        this.npcHintText = this.add.text(0, 0, '', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#b9f2ff',
          backgroundColor: '#0a1628dd', padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 1).setDepth(60);
      }
      this.npcHintText.setText('[F] 얼음 상자 내려놓기').setPosition(px, this.playerLabelY).setVisible(true);
    }
  }

  /** M1-02의 하역은 인벤토리 아이템을 실제 필드 지정 위치에 내려놓는 행동이다. */
  private tryPlaceQuestIceCrate(): boolean {
    if (!this.nearIceDrop || this.uiBlocked) return false;
    if (!InventoryStore.find('quest_ice_crate')) {
      this.floatingHint('정옥선의 심부름용 얼음 상자가 없습니다');
      return true;
    }
    InventoryStore.removeQty('quest_ice_crate', 1);
    StoryStore.event({ kind: 'custom', key: 'ice:auction-drop' });
    StoryStore.emitActionSource('delivery', 'ice:auction-drop');
    this.nearIceDrop = false;
    this.iceDropMarker?.setVisible(false);
    this.npcHintText?.setVisible(false);
    // 안내 문구는 목표 데이터(`afterKo`)가 갖는다 — 여기서 문장을 다시 적지 않는다.
    const done = getStoryQuest('M1-02');
    const after = done?.objectives.find((o) => o.placeKey === 'ice:auction-drop')?.afterKo;
    this.hud?.pushLog(`[할 일] ${done?.titleKo ?? '얼음 나르기'} (완료!)${after ? ` — ${after}` : ''}`);
    this.floatingHint('얼음 상자를 내려놓았습니다 — 정옥선에게 돌아가세요');
    this.startIceDropCinematic();
    return true;
  }

  /** M1-02 — 하역 직후, 실제 경매장 근처 배우가 물건을 확인하는 짧은 연출. */
  private startIceDropCinematic(): void {
    this.playCinematic(CINE_M1_ICE_DROP, { player: 'player', coop: 'coop' });
  }

  private openDialogue(npcId: string): void {
    // 147차 — M1-11 「총회」는 대화 이전에 표결 장면이 먼저다.
    //  계장(coop)과 마주 선 순간, 레벨 목표를 채웠고 아직 총회에 서지 않았다면
    //  총회장이 열리고 그 결과(찬성률 → 항구 신뢰)를 들고 대화로 넘어간다.
    if (npcId === 'coop' && StoryStore.meetingReady()) {
      this.openPopup((close) => new GeneralMeetingPanel(this, {
        onClose: close,
        onDone: (repGain) => {
          if (repGain > 0) StoryStore.addHarborRep(GameState.currentRegionId, repGain);
          this.hud?.pushLog(`[총회] 정계원 승격 가결${repGain > 0 ? ` — 항구 신뢰 +${repGain}` : ''}`);
          // 167차 — 표결 장면이 곧 「총회에 선다」 목표다(대화창을 여는 것이 아니라).
          const mq = STORY_QUESTS.find((q) => StoryStore.isActive(q.id) && q.objectives.some((o) => o.kind === 'talk' && o.npcId === 'coop' && o.labelKo.includes('총회')));
          if (mq) {
            const idx = mq.objectives.findIndex((o) => o.kind === 'talk' && o.npcId === 'coop' && o.labelKo.includes('총회'));
            StoryStore.event({ kind: 'scene', questId: mq.id, objectiveIndex: idx });
          }
          // 표결이 끝나면 계장이 이름을 부른다 — 이어서 대화창
          this.openPopup((c2) => new DialoguePanel(this, npcId, c2, this.region, undefined, this.onDialogueScene));
        },
      }));
      return;
    }
    this.openPopup((close) => new DialoguePanel(this, npcId, close, this.region, undefined, this.onDialogueScene));
  }

  /** 대화창 → 장면 요청. 창이 닫히고 dim이 걷힌 다음 프레임에 컷씬을 튼다 */
  private readonly onDialogueScene = (req: DialogueSceneRequest): void => {
    this.time.delayedCall(90, () => this.runSceneRequest(req));
  };

  private objInteractLabel(o: MapObject): string {
    // ⚠ 129차 수정: 구 코드는 플레이어 설치물이면 **무조건 '[F] 회수'** 를 반환해
    //   기능이 있는 설치물(고급 제작대·수조)을 영영 열 수 없었다. 기능이 있으면
    //   [F] = 기능 · [Shift+F] = 회수로 나눈다.
    if (o.placedByPlayer && o.removable && !this.hasFunction(o)) return '[F] 회수';
    switch (o.interact) {
      case 'door': return '[F] 집으로 들어가기';
      case 'bus': return '[F] 출조 버스 (전국 지도)';
      case 'aquarium': return o.placedByPlayer ? '[F] 수조 열기 · [Shift+F] 회수' : '[F] 수조 열기';
      case 'chop': return '[F] 벌목';
      case 'mine': return '[F] 채굴';
      case 'gather': return '[F] 채집';
      case 'board': return '[F] 보트';
      case 'clinic': return '[F] 보건소 진료';
      case 'craft': return o.placedByPlayer ? '[F] 고급 제작대 · [Shift+F] 회수' : '[F] 고급 제작대';
      default: return '[F]';
    }
  }

  private interactWithObject(o: MapObject, recover = false): void {
    // 플레이어 설치물 회수 (설치의 역방향 — 아이템 반환 + 충돌 재베이크).
    // 기능이 있는 설치물은 **Shift+F 로만** 회수한다(그냥 [F]는 기능을 연다).
    if (o.placedByPlayer && o.removable && (recover || !this.hasFunction(o))) {
      this.recoverPlacedObject(o); return;
    }
    switch (o.interact) {
      case 'door': this.enterHomeInterior(); break;
      case 'bus': this.exitToWorldMap(); break;
      case 'aquarium':
        this.floatingHint('수조는 아직 쓸 수 없습니다.');
        break;
      case 'chop': this.floatingHint('벌목은 추후 — 도끼가 필요합니다'); break;
      case 'mine': this.floatingHint('채굴은 추후 — 곡괭이가 필요합니다'); break;
      case 'gather': this.floatingHint('갯바위 채집은 추후 개방됩니다'); break;
      case 'board': this.floatingHint('개인 보트 출조는 추후 개방됩니다'); break;
      case 'clinic': this.openClinic(); break;
      case 'craft': this.openAdvancedCraft(); break;
      default: break;
    }
  }

  /** 고급 제작대 [F] — 도면 목록은 U 창 '제작' 탭과 같은 보드를 station만 바꿔 쓴다 */
  private openAdvancedCraft(): void {
    this.openPopup((close) => new AdvancedCraftPanel(this, GAME_WIDTH / 2 - 430, 96, {
      onClose: close,
      onCrafted: () => this.events.emit('inventory-changed'),
    }));
  }

  /**
   * 보건소 진료 (129차 P7) — 구급품으로 못 고치는 `cure: 'hospital'` 계열(독감·이상고열 등)을
   * 진료비를 내고 치료하고, 체력을 전량 회복한다. 감기·탈진처럼 휴식(`rest`)으로 낫는 것도
   * 같이 봐준다 — 실제 의원의 동작이고, "병원까지 갔는데 하나만 고쳐준다"가 더 이상하다.
   * ⚠ 수면(침대)과 달리 **저장하지 않는다**(126차 규칙 — 침대 저장 정책 불침범).
   */
  private openClinic(): void {
    const fee = TUNING.craft.hospitalFee;
    const treatable = GameState.statuses.filter((a) => {
      const d = getStatusEffect(a.id);
      return d?.cure === 'hospital' || d?.cure === 'rest';
    });
    const v = GameState.vitals;
    const hurt = v.hp < v.maxHp;
    if (treatable.length === 0 && !hurt) {
      this.floatingHint('지금은 진료가 필요하지 않습니다');
      return;
    }
    const what = treatable.length > 0
      ? `${treatable.map((a) => getStatusEffect(a.id)?.nameKo ?? a.id).join(' · ')} 치료`
      : '체력 회복';
    this.openPopup((close) => new ConfirmDialog(
      this,
      `보건소 진료 — ${what}\n진료비 ${fee.toLocaleString()}원을 지불하시겠습니까?`,
      () => {
        close();
        if (GameState.player.inventory.coins < fee) {
          this.floatingHint(`진료비가 부족합니다 (${fee.toLocaleString()}원 필요)`);
          return;
        }
        GameState.player.inventory.coins -= fee;
        const cured = [
          ...GameState.applyRemedy('hospital', 1.5).cured,
          ...GameState.applyRemedy('rest', 1.5).cured,
        ];
        GameState.applyIntake(0, 0, v.maxHp);        // 체력 전량 회복
        GameState.markDirty();
        this.hud?.pushLog(`[보건소] 진료 완료 — ${cured.length > 0 ? `${cured.length}건 치료 · ` : ''}체력 회복 (−${fee.toLocaleString()}원)`);
        this.floatingHint('진료를 받았습니다 — 몸이 한결 가볍다');
      },
      close,
    ));
  }

  /** 집 문 → 실내 (pause + launch — 복귀는 stop + resume 규칙) */
  private enterHomeInterior(): void {
    // keepTransitioning=false — 씬이 살아있는(paused) 전환이라 액션 직전 플래그 해제
    this.fadeOutThen(() => {
      MultiplayerClient.setActivity('indoor');   // 145차
      this.scene.pause('RegionFieldScene');
      this.scene.launch('HomeInteriorScene');
    }, 250, false);
  }

  // ── 칸 단위 자유 배치 (설치 모드 — 인벤토리 '설치하기'로 진입) ──

  private startPlacement(item: InvItem): void {
    if (this.region !== 'hometown') { this.floatingHint('설치는 홈타운에서만 가능합니다'); return; }
    const def = item.placeKey ? PLACEMENT_DEFS[item.placeKey] : undefined;
    if (!def) return;
    if (!def.rule.scope.includes('exterior')) {
      this.floatingHint(`${def.label}은(는) 집 안에서만 놓을 수 있습니다.`);
      return;
    }
    this.placing = { def, itemId: item.id };
    if (!this.placeG) this.placeG = this.add.graphics().setDepth(48);
    this.hud?.pushLog(`[설치] ${def.label} — 클릭 = 설치 · 우클릭/ESC = 취소`);
    this.floatingHint(`${def.label} 설치 모드 (초록=가능 / 빨강=불가)`);
  }

  /**
   * 포인터 → 월드 좌표. ⚠ `pointer.worldX/Y`를 쓰지 않는다 — Phaser는 카메라가
   * 움직여도(그리고 일부 입력 경로에서 이동 이벤트가 와도) worldX를 갱신하지 않아
   * **스크롤된 카메라에서 스크린 좌표가 그대로 들어온다** (심리스 대형 맵에서 실측 —
   * 소형 맵은 스크롤 ≈ 0이라 우연히 정답이어서 잠복해 있던 버그). 항상 getWorldPoint로 변환.
   */
  private pointerWorld(p: Phaser.Input.Pointer): { x: number; y: number } {
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    return { x: wp.x, y: wp.y };
  }

  /** 설치 그리드 프리뷰 — footprint 칸별 초록/빨강 */
  private updatePlacementPreview(): void {
    if (!this.placing || !this.placeG) return;
    const pw = this.pointerWorld(this.input.activePointer);
    const tx = Math.floor(pw.x / TR), ty = Math.floor(pw.y / TR);
    const rule = this.placing.def.rule;
    const check = canPlaceAt(tx, ty, rule, this.placementWorld());
    const g = this.placeG;
    g.clear();
    // 주변 타일 그리드 (가독)
    g.lineStyle(1, 0xffffff, 0.12);
    for (let r = Math.max(0, ty - 4); r <= Math.min(this.rows, ty + rule.footprint.h + 4); r++) {
      g.lineBetween(Math.max(0, tx - 4) * TR, r * TR, Math.min(this.cols, tx + rule.footprint.w + 4) * TR, r * TR);
    }
    for (let c = Math.max(0, tx - 4); c <= Math.min(this.cols, tx + rule.footprint.w + 4); c++) {
      g.lineBetween(c * TR, Math.max(0, ty - 4) * TR, c * TR, Math.min(this.rows, ty + rule.footprint.h + 4) * TR);
    }
    // footprint 칸별 판정 색
    for (const cell of check.cells) {
      g.fillStyle(cell.ok ? 0x4af2a1 : 0xff5a4a, 0.38);
      g.fillRect(cell.c * TR + 1, cell.r * TR + 1, TR - 2, TR - 2);
    }
    g.lineStyle(2, check.ok ? 0x4af2a1 : 0xff5a4a, 0.9);
    g.strokeRect(tx * TR, ty * TR, rule.footprint.w * TR, rule.footprint.h * TR);
  }

  /** canPlaceAt이 소비하는 월드 뷰 (지형 + 유효 오브젝트) */
  private placementWorld(): Parameters<typeof canPlaceAt>[3] {
    return {
      cols: this.cols,
      rows: this.rows,
      terrainAt: (c: number, r: number) => this.terrainAt(c, r) ?? null,
      objects: this.homeObjects,
      scope: 'exterior',
    };
  }

  private placeSeq = 0;
  private confirmPlacement(p: Phaser.Input.Pointer): void {
    if (!this.placing) return;
    const def = this.placing.def;
    const pw = this.pointerWorld(p);
    const tx = Math.floor(pw.x / TR), ty = Math.floor(pw.y / TR);
    const check = canPlaceAt(tx, ty, def.rule, this.placementWorld());
    if (!check.ok) { this.floatingHint('여기에는 설치할 수 없습니다'); return; }

    // 인벤토리 1개 소모 → placed 등록 → 충돌/렌더 재베이크
    if (!InventoryStore.removeQty(this.placing.itemId, 1)) {
      this.floatingHint('아이템이 없습니다'); this.cancelPlacement(); return;
    }
    const obj: MapObject = {
      instanceId: `pl_${Date.now().toString(36)}_${this.placeSeq++}`,
      type: def.objectType, tx, ty,
      fw: def.rule.footprint.w, fh: def.rule.footprint.h,
      collides: def.collides, interact: def.interact,
      movable: true, removable: true, placedByPlayer: true,
      itemId: this.placing.itemId,
      specId: def.objectType === 'aquarium_live' ? 'aq_live_std'
        : def.objectType === 'aquarium_display' ? 'aq_display_std' : undefined,
    };
    GameState.getWorldObjects(this.mapId).placed.push(obj);
    GameState.markDirty();
    this.computeHomeObjects();
    this.rebuildCollision();
    this.renderHomeObjects();
    this.hud?.pushLog(`[설치] ${def.label} 설치 완료 (${tx}, ${ty})`);
    // 같은 아이템이 남아 있으면 설치 모드 유지, 없으면 종료
    const remain = InventoryStore.find(this.placing.itemId);
    if (!remain || remain.qty <= 0) this.cancelPlacement();
  }

  private cancelPlacement(): void {
    this.placing = null;
    this.placeG?.clear();
  }

  /** 플레이어 설치물 회수 — placed에서 제거 + 아이템 반환 + 재베이크 */
  private recoverPlacedObject(o: MapObject): void {
    const state = GameState.getWorldObjects(this.mapId);
    state.placed = state.placed.filter((x) => x.instanceId !== o.instanceId);
    GameState.markDirty();
    if (o.itemId) InventoryStore.recoverPlaceable(o.itemId);
    this.computeHomeObjects();
    this.rebuildCollision();
    this.renderHomeObjects();
    this.floatingHint('회수했습니다 (인벤토리로 반환)');
  }

  // ═══════════════════════════════════════════════════
  // 인-맵 채집(해루질) · 어장 · 통발 (121차) — 씬은 접근자만 넘긴다
  // ═══════════════════════════════════════════════════
  private initFieldSystems(): void {
    const dr = this.seamlessDef?.dataRegion;
    const farmsJson = dr && this.seamlessDef?.hasFishFarms
      ? (this.cache.json.get(`rfarms_${dr}`) as RegionFishFarms | undefined)
      : undefined;
    const farms = farmsJson?.farms ?? [];
    const chunks = this.chunks;
    const common = {
      scene: this, tr: TR, cols: this.cols, rows: this.rows, regionId: this.region,
      mapKey: dr ?? this.mapId,
      terrainAt: (c: number, r: number) => this.terrainAt(c, r),
      isIsletAt: chunks ? (c: number, r: number) => chunks.isIsletAt(c, r) : undefined,
      breakwaterClassAt: chunks ? (c: number, r: number) => chunks.breakwaterClassAt(c, r) : undefined,
      isHarborAt: chunks ? (c: number, r: number) => chunks.isHarborAt(c, r) : undefined,
      waterDistAt: chunks ? (c: number, r: number) => chunks.waterDistAt(c, r) : undefined,
      player: () => ({ x: this.playerBody.x, y: this.playerBody.y }),
      blocked: () => this.uiBlocked || this.isPaused || this.isTransitioning || this.castBusy,
      pushLog: (msg: string) => this.hud?.pushLog(msg),
      floatingHint: (msg: string) => this.floatingHint(msg),
    };
    this.forage = new ForageSystem({
      ...common,
      knockback: (dx: number, dy: number) => {
        this.knockVx = dx * 220; this.knockVy = dy * 220; this.knockUntil = this.time.now + 220;
      },
    }, farms);
    this.trapField = new TrapFieldSystem({
      ...common,
      depthAtWaterTile: (c: number, r: number) => this.depthAtWaterTile(c, r),
      confirm: (message: string, onYes: () => void) => {
        this.openPopup((close) => new ConfirmDialog(this, message, () => { close(); onYes(); }, close));
      },
      openDeployPanel: (onPick) => {
        this.openPopup((close) => new TrapDeployPanel(this, GAME_WIDTH / 2 - 210, 110, { onClose: close, onPick }));
      },
    });
    // 154차 불요리 — 화구 설치물. 뭍 위(막힌 칸 제외) · 놓는 순간 남에게도 보인다(통발 채널 kind:'stove').
    CookingStore.windProvider = () => {
      const kma = ExternalDataStore.getKmaWeather(this.region);
      const marine = ExternalDataStore.getRegionMarineWeather(this.region);
      return kma?.windSpeedMs ?? marine?.windSpeedMs ?? GameState.environment.environment?.weather.windSpeedMs ?? 0;
    };
    this.stoveField = new StoveFieldSystem({
      ...common,
      occupiedAt: (c: number, r: number) => !!this.blocked[r]?.[c],
      confirm: (message: string, onYes: () => void) => {
        this.openPopup((close) => new ConfirmDialog(this, message, () => { close(); onYes(); }, close));
      },
      openDeployPanel: (onPick) => {
        this.openPopup((close) => new StoveDeployPanel(this, GAME_WIDTH / 2 - 320, 110, { onClose: close, onPick }));
      },
      openCookPanel: (stove) => {
        this.openPopup((close) => new CookingPanel(this, GAME_WIDTH / 2 - 450, 60, stove, {
          onClose: close, onChanged: () => this.events.emit('inventory-changed'),
        }));
      },
    });
    if (import.meta.env.DEV) {
      const st = this.forage.candidateStats();
      this.hud?.pushLog(`[dev] 채집 후보 갯바위 ${st.rock_shore} · 사석/TTP ${st.armor_foot} · 웅덩이 ${st.tidepool} · 안벽 ${st.harbor_wall} · 스팟 ${this.forage.allSpots().length} · 어장 ${farms.length}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__FIELD = { forage: this.forage, trapField: this.trapField, stoveField: this.stoveField, scene: this, cooler: CoolerStore, tuning: TUNING, getTrapById };
    }
    const ownedForage = this.forage;
    const ownedTrapField = this.trapField;
    const ownedStoveField = this.stoveField;
    this.events.once('shutdown', () => {
      ownedForage?.destroy();
      ownedTrapField?.destroy();
      ownedStoveField?.destroy();
      if (this.forage === ownedForage) this.forage = undefined;
      if (this.trapField === ownedTrapField) this.trapField = undefined;
      if (this.stoveField === ownedStoveField) this.stoveField = undefined;
    });
  }

  /** 물 타일의 실측 수심(m) — 육지 거리(타일 × 5m)를 수심 프로필 앵커로 환산 (캐스팅 수심과 같은 규칙) */
  private depthAtWaterTile(c: number, r: number): number {
    const wd = this.chunks?.waterDistAt(c, r) ?? 1;
    const distM = Math.max(5, wd * 5);
    const profile = this.cache.json.get(`depth_${this.region}`) as RegionDepthProfile | undefined;
    if (profile && Array.isArray(profile.anchors) && profile.anchors.length > 0) {
      const anchorKey = this.seamless ? (r * TR < this.worldH * 0.5 ? 'dongmyeonghang' : 'sokchohang') : this.mapId;
      const anchor = findDepthAnchor(profile, anchorKey);
      if (anchor) return Math.max(1, Math.round(depthAtDistance(anchor, distM) * 10) / 10);
    }
    return Math.max(1, Math.round(computeZoneMaxDepth(Phaser.Math.Clamp(distM / 70, 0, 1)) * 10) / 10);
  }

  /** 판매가 — 스킬 흥정·단골 배율 (122차) */
  private sellPriceOf(item: InvItem): number {
    return Math.round(InventoryStore.getSellPrice(item) * GameState.skillMult('sell_price'));
  }

  private handleMovement(): void {
    // 자전거 탑승 시 이동 속도 2배 (충돌/카메라 팔로우는 불변).
    // 심리스는 타일 32px라 같은 px/s면 타일 체감이 느려진다 → 1.4배 보정 (동서 횡단 ≈ 3분 유지)
    // 스킬 트리(122차): 달리기 배율 · 자전거 배율
    // 125차: 허기·수분 임계(−20%)와 상태이상(골절 등) 배율을 곱한다
    const speed = (this.seamless ? 210 : 150) * GameState.skillMult('run_speed')
      * (GameState.isMounted ? 2 * GameState.skillMult('bike_speed') : 1)
      * this.runSpeedFactor()
      * GameState.moveSpeedMult;
    let vx = 0, vy = 0;
    if (this.time.now < this.knockUntil) {
      // 차량 충돌 넉백 — 입력 무시, 진행 방향 뒤로 밀림
      this.playerBody.setVelocity(this.knockVx, this.knockVy);
      this.updateWalkTexture(false);
      return;
    }
    if (this.playerActionLocked) {
      // 배타 액션(캐스팅 차지·비행) 중에는 이동 정지 — 조준/자세 유지
      this.playerBody.setVelocity(0, 0);
      this.updateWalkTexture(false);
      return;
    }
    if (this.cursors.left.isDown) { vx = -speed; this.playerFacing = 'left'; }
    else if (this.cursors.right.isDown) { vx = speed; this.playerFacing = 'right'; }
    if (this.cursors.up.isDown) { vy = -speed; this.playerFacing = 'up'; }
    else if (this.cursors.down.isDown) { vy = speed; this.playerFacing = 'down'; }
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.playerBody.setVelocity(vx, vy);
    const moving = vx !== 0 || vy !== 0;
    this.running = this.running && moving;
    this.updateWalkTexture(moving);
  }

  /**
   * 달리기 판정 (144차) — Shift 홀드 + 방향키. 걷기 대비 `TUNING.vitals.runSpeedMult` 배.
   *
   * 자전거 탑승 중에는 걸리지 않는다(페달을 밟으며 뛸 수 없다 — 배율 중첩 방지).
   * 피로도가 `runFatigueGatePct` 이상이거나 허기·수분이 임계 미만이면 **숨이 차서 걷기로 강등**한다:
   * 소모값만으로 벌하지 않고 "못 뛰는 상태"를 만드는 쪽이 회복 행동(식사·수면)의 동기가 된다.
   */
  private runSpeedFactor(): number {
    this.running = false;
    if (GameState.isMounted) return 1;
    if (!this.cursors.shift?.isDown) return 1;
    const v = TUNING.vitals;
    const vit = GameState.vitals;
    const gate = vit.maxFatigue * (v.runFatigueGatePct / 100);
    if (vit.fatigue >= gate || (v.runBlockWhenLow && GameState.isVitalsLow)) {
      if (this.time.now > this.runGateWarnAt) {
        this.runGateWarnAt = this.time.now + 12_000;
        this.hud?.pushLog(vit.fatigue >= gate
          ? '[경고] 숨이 차서 더 달릴 수 없습니다 — 쉬었다 가세요'
          : '[경고] 허기·수분이 부족해 달릴 수 없습니다');
      }
      return 1;
    }
    this.running = true;
    return v.runSpeedMult;
  }

  private updateWalkTexture(moving: boolean): void {
    if (!this.charSprite) return;
    this.charSprite.setDir(this.playerFacing);
    // 탑승 중엔 걷기 프레임 대신 대기 고정 (다리는 페달링으로 자전거에 가린다)
    this.charSprite.update(this.game.loop.delta, moving && !GameState.isMounted,
      this.running ? TUNING.vitals.runSpeedMult : 1);
    if (moving && GameState.isMounted) GameState.noteRiding(this.game.loop.delta);   // 140차 — 자전거 숙련
  }

  private updateSpriteAndShadow(): void {
    const feetY = this.playerBody.y + this.PLAYER_FOOT_OFFSET;
    const depth = 20 + this.playerBody.y * 0.001;

    // 자전거 합성 — 측면은 캐릭터 뒤(프레임이 다리에 가림), 정면/후면은 캐릭터 앞
    // (물리적으로 정면 핸들바·바퀴/후면 뒷바퀴는 카메라 기준 캐릭터보다 앞에 있다)
    let riderOffset = 0;
    if (this.bike && GameState.isMounted) {
      const dir: RiderDir = this.playerFacing === 'up' ? 'back' : this.playerFacing === 'down' ? 'front' : this.playerFacing;
      const v = this.playerBody.body.velocity;
      const bikeDepth = dir === 'left' || dir === 'right' ? depth - 0.0005 : depth + 0.0005;
      riderOffset = this.bike.update(
        this.playerBody.x, feetY, dir, v.x !== 0 || v.y !== 0, this.time.now, bikeDepth);
    }

    this.playerSprite.setPosition(this.playerBody.x, feetY + this.charFootSink + riderOffset);
    this.playerSprite.setDepth(depth);
    const shadow = this.registry.get('_rfShadow') as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) {
      shadow.setPosition(this.playerBody.x, feetY);
      // 자전거 풋프린트에 맞춰 그림자 확장
      shadow.setScale(GameState.isMounted ? 1.6 : 1, 1);
    }
  }

  private updateWaterProximity(): void {
    const c = Math.floor(this.playerBody.x / TR);
    const r = Math.floor(this.playerBody.y / TR);
    let found: { x: number; y: number } | undefined;
    // 인접 8타일 중 바다 방향 탐색
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) {
      if (this.terrainAt(c + dc, r + dr) === 'water') {
        found = { x: (c + dc) * TR + TR / 2, y: (r + dr) * TR + TR / 2 };
        break;
      }
    }
    this.nearWater = !!found;
    this.updateHoleSpot();
    if (this.castBusy) { this.promptText.setVisible(false); return; }
    // 건물 근접 힌트가 캐스팅 힌트보다 우선
    if (this.nearBuilding) {
      this.promptText.setText(`[F] ${BUILDING_LABEL[this.nearBuilding.kind]} — 거래하기`);
      this.promptText.setVisible(true);
    } else if (this.holeSpot && InventoryStore.getEquippedRod()) {
      // 149차 — 블록 위에 서면 캐스팅보다 구멍치기가 먼저 안내된다(여기서 할 조법이다)
      this.promptText.setText(
        `${this.holeSpot.labelKo} — 좌클릭 짧게 = 구멍치기 (수심 ${this.holeSpot.depthM.toFixed(1)}m) · 길게 = 캐스팅`,
      );
      this.promptText.setVisible(true);
    } else if (this.nearWater) {
      // 캐스팅 가능 조건 = **손에 낚싯대 착용** (퀵슬롯 선택은 무관 — 2026-08-05 개편)
      const rodEquipped = !!InventoryStore.getEquippedRod();
      this.promptText.setText(rodEquipped ? '좌클릭 유지 = 조준·차지 → 놓으면 캐스팅 (마우스로 각도 조절)' : '');
      this.promptText.setVisible(rodEquipped);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private updateCharge(): void {
    if (!this.charging || !this.chargeBar) return;
    // 구멍 위에서는 탭 유예(`TUNING.hole.tapMs`) 동안 아무것도 그리지 않는다 —
    // 짧은 클릭 한 번에 차지 바가 번쩍이면 "던진 건가?" 하고 헷갈린다.
    if (this.holeSpot && this.time.now - this.chargeDownAt < TUNING.hole.tapMs) {
      this.chargeBar.clear();
      this.aimG?.clear();
      return;
    }
    // 사인파로 0~1 왕복
    this.chargePower = (Math.sin(this.time.now / 320) + 1) / 2;
    const bx = this.playerBody.x - 40;
    const by = this.playerBody.y - 46;
    this.chargeBar.clear();
    this.chargeBar.fillStyle(0x0a1628, 0.85);
    this.chargeBar.fillRect(bx - 2, by - 2, 84, 12);
    const ratio = this.chargePower;
    const rr = Math.floor(74 + (255 - 74) * ratio);
    const gg = Math.floor(242 - (242 - 180) * ratio);
    const bb = Math.floor(161 * (1 - ratio));
    this.chargeBar.fillStyle((rr << 16) | (gg << 8) | bb, 1);
    this.chargeBar.fillRect(bx, by, 80 * ratio, 8);

    // ── 조준: 마우스 방향 = 발사 각도, 궤적 미리보기 (탄도 시뮬레이션) ──
    const pw = this.pointerWorld(this.input.activePointer);
    const dx = pw.x - this.playerBody.x;
    const dy = pw.y - this.playerBody.y;
    const len = Math.hypot(dx, dy);
    if (len > 8) {
      const nd = { x: dx / len, y: dy / len };
      // 방향이 흔들리면 홀드 타이머 리셋 (dot < 0.995 ≈ 5.7° 이상 틀어짐)
      if (nd.x * this.aimHoldDir.x + nd.y * this.aimHoldDir.y < 0.995) {
        this.aimHoldDir = nd;
        this.aimHoldSince = this.time.now;
        this.aimGuideReady = false;
      }
      this.lastAimDir = nd;
    }

    // ── 조준 홀드 가이드 — 정투(fish_scatter) 1랭크 해금 (SPEC §3-2) ──
    //   커서까지의 거리를 실제 비행 시뮬로 역산해 차지 게이지 위에 필요 파워 눈금을 찍는다.
    const guideUnlocked = GameState.skillRank('fish_scatter') >= 1;
    if (guideUnlocked && !this.aimGuideReady
      && this.time.now - this.aimHoldSince >= 400 && len > 8) {
      this.aimGuideReady = true;
      const effG = this.castWeather(this.lastAimDir);
      this.aimGuidePower = solveCastPower({
        originX: this.playerBody.x, originY: this.playerBody.y,
        dirX: this.lastAimDir.x, dirY: this.lastAimDir.y,
        strength: DEFAULT_ANGLER_STATS.strength * GameState.skillMult('cast_distance'),
        speedMult: effG.distanceMult,
        wind: this.windForce(effG),
        airDragCd: InventoryStore.getRigDragCd(),
      }, len);
    }
    if (guideUnlocked && this.aimGuideReady) {
      if (this.aimGuidePower === null) {
        this.chargeBar.fillStyle(0xff6a5a, 0.9);
        this.chargeBar.fillRect(bx + 76, by - 3, 4, 14);   // 사거리 초과 = 우측 끝 경고 블록
      } else {
        const gx = bx + 80 * this.aimGuidePower;
        this.chargeBar.fillStyle(0xffe08a, 1);
        this.chargeBar.fillRect(gx - 1, by - 3, 2, 14);    // 필요 파워 눈금
      }
    }

    if (!this.aimG) return;
    this.aimG.clear();

    // 조준선 (캐릭터 → 마우스 방향)
    const px = this.playerBody.x, py = this.playerBody.y;
    this.aimG.lineStyle(1, 0xffffff, 0.35);
    this.aimG.lineBetween(px, py, px + this.lastAimDir.x * 90, py + this.lastAimDir.y * 90);

    // 예상 탄도 점선 (현재 파워 기준 — 그림자 경로 + 착수 지점)
    // 미리보기는 발사와 **같은 계수**를 쓴다 — 안 그러면 예상 착수 마커가 거짓말을 한다
    const eff = this.castWeather(this.lastAimDir);
    const traj = simulateCastTrajectory({
      originX: px, originY: py,
      dirX: this.lastAimDir.x, dirY: this.lastAimDir.y,
      power: this.chargePower,
      strength: DEFAULT_ANGLER_STATS.strength * GameState.skillMult('cast_distance'),
      speedMult: eff.distanceMult,
      wind: this.windForce(eff),
      airDragCd: InventoryStore.getRigDragCd(),
    });
    for (let i = 4; i < traj.length; i += 6) {
      const pt = traj[i];
      this.aimG.fillStyle(0xffffff, 0.5);
      this.aimG.fillCircle(pt.x, pt.y - pt.z, 1.6);
    }
    const last = traj[traj.length - 1];
    if (last) {
      const landsWater = this.terrainAt(Math.floor(last.x / TR), Math.floor(last.y / TR)) === 'water';
      this.aimG.lineStyle(1.5, landsWater ? 0x4af2a1 : 0xff6a5a, 0.9);
      this.aimG.strokeCircle(last.x, last.y, 8);

      // 산포 반경 링 — 실제 착수는 이 안에서 흩어진다(정투 랭크로 줄어든다)
      const distPx = Math.hypot(last.x - px, last.y - py);
      const rad = castScatterRadius(distPx, eff.scatterMult, GameState.skillMult('cast_scatter'));
      if (rad > 2) {
        this.aimG.lineStyle(1, 0xffe08a, 0.45);
        this.aimG.strokeCircle(last.x, last.y, rad);
      }

      // 바람 편향 화살표 — 바람 읽기(fish_wind) 1랭크부터 (SPEC §3-3)
      if (eff.active && eff.excessMs > 0 && GameState.skillRank('fish_wind') >= 1) {
        const ax = last.x + eff.windUnit.x * 26, ay = last.y + eff.windUnit.y * 26;
        this.aimG.lineStyle(2, 0x9fd0e4, 0.9);
        this.aimG.lineBetween(last.x, last.y, ax, ay);
        const bax = -eff.windUnit.x, bay = -eff.windUnit.y;
        this.aimG.lineBetween(ax, ay, ax + bax * 7 - bay * 5, ay + bay * 7 + bax * 5);
        this.aimG.lineBetween(ax, ay, ax + bax * 7 + bay * 5, ay + bay * 7 - bax * 5);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 맵 간 엣지 전환
  // ═══════════════════════════════════════════════════
  private checkEdgeTransition(): void {
    // 심리스 단일 맵 = 엣지 전환 없음 (legacy 그래프 폴백용으로 코드는 보존 — 스펙 §6-4)
    if (this.seamless) return;
    if (this.isTransitioning || this.castBusy) return;
    // 건물 근접 중에는 전환 억제 — 엣지 부근 건물과의 상호작용([E])이 우선
    if (this.nearBuilding) return;
    const c = Math.floor(this.playerBody.x / TR);
    const r = Math.floor(this.playerBody.y / TR);
    const links = this.node.links;

    let edge: EdgeDir | undefined;
    if (c <= EDGE_MARGIN && links.W && this.cursors.left.isDown) edge = 'W';
    else if (c >= this.cols - 1 - EDGE_MARGIN && links.E && this.cursors.right.isDown) edge = 'E';
    else if (r <= EDGE_MARGIN && links.N && this.cursors.up.isDown) edge = 'N';
    else if (r >= this.rows - 1 - EDGE_MARGIN && links.S && this.cursors.down.isDown) edge = 'S';
    if (!edge) return;

    const neighbor = links[edge]!;
    // 진입 엣지 상의 상대 위치 t
    const t = (edge === 'W' || edge === 'E')
      ? Phaser.Math.Clamp(r / this.rows, 0, 1)
      : Phaser.Math.Clamp(c / this.cols, 0, 1);

    this.fadeOutThen(() => {
      this.scene.restart({
        region: this.region,
        mapId: neighbor,
        entryEdge: OPPOSITE_EDGE[edge!],
        entryT: t,
      } as RegionFieldInit);
    }, 240);
  }

  /**
   * 씬 전환 공용 안전망 — 페이드아웃 후 action 실행.
   * camerafadeoutcomplete 이벤트가 오지 않는 엣지 케이스(fadeIn 중 재fadeOut, 리셋 등)를
   * 대비해 폴백 타이머를 함께 걸어 **전환 중 멈춤(black/frozen)을 원천 차단**한다.
   * keepTransitioning=false: pause+launch처럼 씬이 살아있는 전환 — 액션 직전 플래그 해제
   * (복귀 시 이동 차단이 남지 않게). scene.start/restart는 true(새 씬 init이 리셋).
   */
  private fadeOutThen(action: () => void, fadeMs = 260, keepTransitioning = true): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.charging = false;
    this.chargeBar?.clear();
    this.playerBody?.setVelocity(0, 0);
    let done = false;
    const run = (): void => {
      if (done) return;
      done = true;
      if (!keepTransitioning) this.isTransitioning = false;
      action();
    };
    this.cameras.main.once('camerafadeoutcomplete', run);
    this.cameras.main.fadeOut(fadeMs, 0, 10, 20);
    this.time.delayedCall(fadeMs + 150, run);   // 폴백 — 이벤트 미발화 방어
  }

  private exitToWorldMap(): void {
    this.fadeOutThen(() => this.scene.start('WorldMapScene'), 280);
  }

  /** ESC 메뉴 '집으로 가기' — 확인 팝업 후 '예'면 홈타운(집)으로 이동 (귀가 무료) */
  private confirmGoHome(): void {
    // 일시정지 메뉴(depth 1000)를 먼저 닫는다 — 안 닫으면 확인 팝업(950)이 메뉴 뒤에
    // 가려져 "아무 일도 안 일어나는" 것처럼 보였다 (QA 2026-08-05 스크린샷 확정).
    this.closePauseMenu();
    const dlg = new ConfirmDialog(
      this,
      '정말로 집으로 돌아가시겠습니까?',
      () => {
        dlg.destroy();
        this.fadeOutThen(() => {
          this.scene.start('RegionFieldScene', { region: 'hometown' } as RegionFieldInit);
        }, 280);
      },
      () => dlg.destroy(),
    );
    this.add.existing(dlg);
    dlg.setDepth(1200);   // 이중 안전 — ESC로 메뉴를 다시 열어도 확인 팝업이 항상 위
  }

  // ═══════════════════════════════════════════════════
  // ESC 일시정지 메뉴 (Traveler's Rest 풍 도트 메뉴)
  // ═══════════════════════════════════════════════════
  private togglePauseMenu(): void {
    if (this.isTransitioning) return;
    if (this.isPaused) this.closePauseMenu();
    else this.openPauseMenu();
  }

  /** ESC 메뉴 [환경설정] — SettingsScene을 위에 띄운다(pause+launch). 닫으면 `returnScene`으로 resume. */
  private openSettingsFromPause(): void {
    this.closePauseMenu();
    this.scene.pause();
    this.scene.launch('SettingsScene', { returnScene: 'RegionFieldScene' });
  }

  private openPauseMenu(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.charging = false;
    this.chargeBar?.clear();
    this.playerBody.setVelocity(0, 0);

    this.pauseItems = [
      { label: '계속하기', action: () => this.closePauseMenu() },
      {
        label: '저장하기',
        action: () => {
          // 저장은 집 실내 침대에서만 (HOMETOWN_HOME_SPEC — SavePolicy)
          if (GameState.save()) {
            this.hud?.pushLog(`[시스템] 슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다.`);
            this.closePauseMenu();
            this.floatingHint('저장 완료');
          } else {
            this.closePauseMenu();
            this.floatingHint('집 침대에서만 저장할 수 있습니다');
          }
        },
      },
      // 환경설정 — 설정 씬을 pause+launch로 열고 닫으면 이 씬으로 복귀 (언어·HUD·낚시 탭 포함, 117차)
      { label: '환경설정', action: (): void => this.openSettingsFromPause() },
      // 홈타운 밖 = '집으로 가기' (확인 팝업 → 예 = 홈타운 이동. '전국 지도'는 폐지 —
      //  출조는 홈타운 출조 버스로만, 귀가는 여기서 바로. 사용자 지시 2026-07-30)
      ...(this.region === 'hometown'
        ? []
        : [{ label: '집으로 가기', action: (): void => this.confirmGoHome() }]),
      {
        label: '타이틀 화면',
        action: () => {
          // 미저장 진행 경고 — 한 번 더 선택 시 이동 (스타듀형 리스크 안내)
          if (GameState.isDirty && !this.titleConfirmArmed) {
            this.titleConfirmArmed = true;
            this.floatingHint('저장되지 않은 진행이 있습니다 — 한 번 더 선택하면 이동합니다');
            return;
          }
          this.gotoTitle();
        },
      },
    ];
    this.titleConfirmArmed = false;
    this.pauseSelIndex = 0;
    this.pauseRowBgs = [];

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const menu = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    // 반투명 딤 배경
    const dim = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setInteractive();  // 뒤 클릭 차단
    menu.add(dim);

    // ── 목재/양피지 톤 패널 (도트 스타일 이중 테두리) ──
    const panelW = 300;
    const rowH = 52;
    const headH = 58;
    const panelH = headH + this.pauseItems.length * (rowH + 10) + 22;
    const px = cx - panelW / 2;
    const py = cy - panelH / 2;

    const panel = this.add.graphics();
    // 바깥 어두운 목재 테두리
    panel.fillStyle(0x2a1c12, 1);
    panel.fillRoundedRect(px - 6, py - 6, panelW + 12, panelH + 12, 10);
    // 밝은 목재 프레임
    panel.fillStyle(0x6b4a2e, 1);
    panel.fillRoundedRect(px, py, panelW, panelH, 8);
    // 안쪽 패널 면
    panel.fillStyle(0x8a6a44, 1);
    panel.fillRoundedRect(px + 6, py + 6, panelW - 12, panelH - 12, 6);
    panel.lineStyle(2, 0x3d2817, 1);
    panel.strokeRoundedRect(px + 6, py + 6, panelW - 12, panelH - 12, 6);
    menu.add(panel);

    // 헤더
    const header = this.add.text(cx, py + 26, '일시정지', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: '#3d2817', fontStyle: 'bold',
    }).setOrigin(0.5);
    menu.add(header);

    // 메뉴 항목 버튼
    this.pauseItems.forEach((item, i) => {
      const ry = py + headH + i * (rowH + 10);
      const rowBg = this.add.graphics();
      this.pauseRowBgs.push(rowBg);
      this.paintPauseRow(rowBg, px + 22, ry, panelW - 44, rowH, i === this.pauseSelIndex);
      const label = this.add.text(cx, ry + rowH / 2, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#33220f', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(cx, ry + rowH / 2, panelW - 44, rowH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { this.pauseSelIndex = i; this.refreshPauseRows(); });
      hit.on('pointerdown', () => { this.pauseSelIndex = i; item.action(); });
      menu.add([rowBg, label, hit]);
    });

    // 힌트
    const hint = this.add.text(cx, py + panelH - 4, '↑↓ 이동 · Enter 선택 · ESC 닫기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#4a3322',
    }).setOrigin(0.5, 1);
    menu.add(hint);

    // 화면 고정 히트 영역 보정 (카메라 스크롤 시 클릭 어긋남 방지)
    applyScreenFixed(menu);

    // 등장 연출
    menu.setScale(0.92);
    this.tweens.add({ targets: menu, scale: 1, duration: 150, ease: 'Back.easeOut' });

    this.pauseMenu = menu;
  }

  /** 메뉴 행 배경 그리기 (선택 강조) */
  private paintPauseRow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, selected: boolean): void {
    g.clear();
    if (selected) {
      g.fillStyle(0xd9b779, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(2, 0xffe9b0, 1);
      g.strokeRoundedRect(x, y, w, h, 5);
    } else {
      g.fillStyle(0xb8945f, 1);
      g.fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(2, 0x6b4a2e, 1);
      g.strokeRoundedRect(x, y, w, h, 5);
    }
  }

  private refreshPauseRows(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 300, rowH = 52, headH = 58;
    const panelH = headH + this.pauseItems.length * (rowH + 10) + 22;
    const px = cx - panelW / 2;
    const py = cy - panelH / 2;
    this.pauseRowBgs.forEach((g, i) => {
      const ry = py + headH + i * (rowH + 10);
      this.paintPauseRow(g, px + 22, ry, panelW - 44, rowH, i === this.pauseSelIndex);
    });
  }

  private movePauseSel(dir: number): void {
    const n = this.pauseItems.length;
    this.pauseSelIndex = (this.pauseSelIndex + dir + n) % n;
    this.refreshPauseRows();
  }

  private activatePauseSel(): void {
    this.pauseItems[this.pauseSelIndex]?.action();
  }

  private closePauseMenu(): void {
    // 메뉴 항목 클릭이 같은 프레임 씬 pointerdown으로 흘러 캐스팅 시도
    // ("채비가 불완전합니다 (U 채비하기)" 힌트)로 새지 않도록 유예를 준다
    // — 팝업 스택 close()와 동일한 관통 방지 패턴.
    this.suppressClickUntil = this.time.now + 250;
    if (!this.pauseMenu) { this.isPaused = false; return; }
    const menu = this.pauseMenu;
    this.pauseMenu = undefined;
    this.tweens.add({
      targets: menu, scale: 0.92, alpha: 0, duration: 120,
      onComplete: () => menu.destroy(),
    });
    this.isPaused = false;
  }

  private gotoTitle(): void {
    this.fadeOutThen(() => this.scene.start('MainMenuScene'), 280);
  }
}
