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
  CastProjectile,
  WindVector,
  DEFAULT_ANGLER_STATS,
  computeZoneMaxDepth,
  RegionDepthProfile,
  depthAtDistance,
  findDepthAnchor,
  kstHour,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { RegionHud } from '../ui/RegionHud.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { ItemDetailPanel } from '../ui/ItemDetailPanel.js';
import { StatusPanel } from '../ui/StatusPanel.js';
import { EquipmentPanel } from '../ui/EquipmentPanel.js';
import { UtilizationPanel, UtilizationTab } from '../ui/UtilizationPanel.js';
import { CoolerPanel } from '../ui/CoolerPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { ConfirmDialog, QuantityDialog } from '../ui/Dialogs.js';
import { applyScreenFixed } from '../ui/DraggablePanel.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { BuildingKind, BUILDING_LABEL, BUILDING_KIND_CYCLE, SHOP_CATALOG, ShopEntry } from '../data/ShopCatalog.js';

interface RegionFieldInit {
  region: string;
  mapId?: string;
  /** 진입 엣지 (이 엣지를 통해 들어옴 → 해당 엣지 근처에서 스폰) */
  entryEdge?: EdgeDir | null;
  /** 진입 엣지 상의 상대 위치 (0~1) */
  entryT?: number;
}

// ── 렌더/전환 상수 ──────────────────────────────────
const TR = 20;              // 타일 렌더 크기(px)
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

  private graph!: RegionMapGraph;
  private node!: RegionMapNode;
  private mapData!: RegionMapData;

  private cols = 0;
  private rows = 0;
  private worldW = 0;
  private worldH = 0;
  private terrain: RegionTerrain[][] = [];
  private blocked: boolean[][] = [];

  // 플레이어
  private playerBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly PLAYER_DISPLAY_H = 42;
  private readonly PLAYER_FOOT_OFFSET = 9;
  private _walkFrameTimer = 0;
  private _walkFrame: 1 | 2 = 1;

  private isTransitioning = false;

  // ESC 일시정지 메뉴
  private isPaused = false;
  private pauseMenu?: Phaser.GameObjects.Container;
  private pauseSelIndex = 0;
  private pauseItems: { label: string; action: () => void }[] = [];
  private pauseRowBgs: Phaser.GameObjects.Graphics[] = [];

  // HUD
  private hud?: RegionHud;

  // ── 팝업 스택 (ESC는 최상단부터 닫음) ──
  private popupStack: { panel: Phaser.GameObjects.Container; close: () => void }[] = [];
  // 단축키 토글용 패널 참조
  private invPanel: InventoryPanel | null = null;
  private statusPanel: StatusPanel | null = null;
  private equipPanel: EquipmentPanel | null = null;
  private utilPanel: UtilizationPanel | null = null;
  private coolerPanel: CoolerPanel | null = null;
  private shopPanel: ShopPanel | null = null;

  // ── 건물(상점) ──
  private buildings: { x: number; y: number; kind: BuildingKind }[] = [];
  private nearBuilding: { x: number; y: number; kind: BuildingKind } | null = null;

  // ── 대기/조명/날씨 (2026-07-20) ──
  /** 화면 고정 빗줄기 풀 */
  private rainDrops: { obj: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  /** 화면 고정 안개 블롭 (수평 드리프트) */
  private fogBlobs: { obj: Phaser.GameObjects.Ellipse; speed: number }[] = [];
  /** 화면 고정 눈송이 풀 */
  private snowFlakes: { obj: Phaser.GameObjects.Arc; speed: number; sway: number }[] = [];

  /** 이동/캐스팅을 차단해야 하는 UI 상태 (일시정지 or 팝업 열림) */
  private get uiBlocked(): boolean {
    return this.isPaused || this.popupStack.length > 0;
  }

  /**
   * 팝업 버튼 클릭이 같은 프레임에 씬 pointerdown으로 흘러
   * 캐스팅 시도("물가에서 던지세요" 힌트)로 새는 것을 방지하는 유예 시각.
   */
  private suppressClickUntil = 0;

  // 낚시 캐스팅
  private nearWater = false;
  private charging = false;
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

  // UI
  private promptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RegionFieldScene' });
  }

  init(dataIn: RegionFieldInit): void {
    this.region = dataIn.region;
    this.graph = REGION_MAP_GRAPHS[this.region];
    this.mapId = dataIn.mapId ?? this.graph.entryMapId;
    this.entryEdge = dataIn.entryEdge ?? null;
    this.entryT = dataIn.entryT ?? 0.5;
    // 상태 초기화 (scene.restart 대비)
    this.isTransitioning = false;
    this.charging = false;
    this.chargePower = 0;
    this.castBusy = false;
    this.isPaused = false;
    this.pauseMenu = undefined;
    this.pauseSelIndex = 0;
    this.pauseItems = [];
    this.pauseRowBgs = [];
    this.hud = undefined;
    this.popupStack = [];
    this.invPanel = null;
    this.statusPanel = null;
    this.equipPanel = null;
    this.utilPanel = null;
    this.shopPanel = null;
    this.buildings = [];
    this.nearBuilding = null;
    this.castProj = null;
    this.castShadow = undefined;
    this.castBobber = undefined;
    this.castLineG = undefined;
    this.aimG = undefined;
    this.rainDrops = [];
    this.fogBlobs = [];
    this.snowFlakes = [];
  }

  preload(): void {
    const key = `rmap_${this.mapId}`;
    if (!this.cache.json.has(key)) {
      this.load.json(key, `${this.graph.dataDir}/${this.mapId}.json`);
    }
    // 실측 연안 수심 프로필 — 그래프에 경로가 등록된 지역만 로드
    // (미등록 지역을 무조건 로드하면 Vite dev SPA 폴백이 index.html을 돌려줘
    //  JSON 파싱 pageerror가 발생한다. 프로필 없으면 그라디언트 폴백.)
    if (this.graph.depthProfileUrl) {
      const depthKey = `depth_${this.region}`;
      if (!this.cache.json.has(depthKey)) {
        this.load.json(depthKey, `${this.graph.depthProfileUrl}`);
      }
    }
  }

  create(): void {
    this.mapData = this.cache.json.get(`rmap_${this.mapId}`) as RegionMapData;
    this.node = getRegionMapNode(this.graph, this.mapId)!;
    this.cols = this.mapData.cols;
    this.rows = this.mapData.rows;
    this.worldW = this.cols * TR;
    this.worldH = this.rows * TR;

    this.buildTerrainGrid();
    this.renderTerrain();
    this.buildCollision();
    this.spawnPlayer();
    this.drawPois();
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

    // 인벤토리 조작으로 퀵슬롯이 바뀌면 HUD 갱신 (restart 중복 등록 방지)
    this.events.off('inventory-changed');
    this.events.on('inventory-changed', () => this.hud?.refreshQuickslots());

    // 1인칭 낚시 뷰(pause+launch)에서 복귀 시: 페이드인 + 캐스팅 상태 정리
    this.events.off('resume');
    this.events.on('resume', () => {
      this.cameras.main.fadeIn(300, 0, 10, 20);
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
    // 충돌은 spawnPlayer 이후 collider 등록 (playerBody 필요) → 임시 저장
    this._walls = walls;
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
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(14, 14);

    const feetY = py + this.PLAYER_FOOT_OFFSET;
    this.playerSprite = this.add.image(px, feetY, 'man-idle-front').setOrigin(0.5, 1).setDepth(20);
    this.applyPlayerSpriteSize();

    const shadow = this.add.ellipse(px, feetY, this.PLAYER_DISPLAY_H * 0.42, this.PLAYER_DISPLAY_H * 0.12, 0x000000, 0.28)
      .setDepth(19);
    this.registry.set('_rfShadow', shadow);

    this.physics.add.collider(this.playerBody, this._walls);
  }

  private applyPlayerSpriteSize(): void {
    const src = this.playerSprite.texture.getSourceImage() as HTMLImageElement;
    if (!src || !src.height) return;
    const h = this.PLAYER_DISPLAY_H;
    this.playerSprite.setDisplaySize(h * (src.width / src.height), h);
  }

  /** 진입 엣지/기본 진입에 따라 스폰 타일 계산 (걷기 가능 타일 보장) */
  private computeSpawnTile(): { col: number; row: number } {
    if (!this.entryEdge) {
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
  // 입력
  // ═══════════════════════════════════════════════════
  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    // ESC: 최상단 팝업부터 닫기 → 팝업 없으면 일시정지 메뉴 토글
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.closeTopPopup()) return;
      this.togglePauseMenu();
    });

    // 일시정지 메뉴 네비게이션 (열려 있을 때만 처리)
    this.input.keyboard!.on('keydown-UP', () => { if (this.isPaused) this.movePauseSel(-1); });
    this.input.keyboard!.on('keydown-DOWN', () => { if (this.isPaused) this.movePauseSel(1); });
    this.input.keyboard!.on('keydown-ENTER', () => { if (this.isPaused) this.activatePauseSel(); });

    // M: 미니맵 / I: 인벤토리 / S: 스테이터스 / U: 활용 / E: 상호작용·장비
    this.input.keyboard!.on('keydown-M', () => { if (!this.uiBlocked) this.hud?.toggleMiniMapSize(); });
    this.input.keyboard!.on('keydown-I', () => { if (!this.isPaused) this.toggleInventory(); });
    this.input.keyboard!.on('keydown-S', () => { if (!this.isPaused) this.toggleStatus(); });
    this.input.keyboard!.on('keydown-U', () => { if (!this.isPaused) this.toggleUtilization('tackles'); });
    this.input.keyboard!.on('keydown-B', () => { if (!this.isPaused) this.toggleCooler(); });
    this.input.keyboard!.on('keydown-E', () => {
      if (this.isPaused) return;
      // 건물 근접 시 = 거래 상호작용, 아니면 장비 창 토글
      if (this.nearBuilding && !this.uiBlocked) this.promptTrade(this.nearBuilding.kind);
      else this.toggleEquipment();
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

    // 좌클릭 차지 캐스팅 (바다 인접 + 낚싯대 슬롯)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.uiBlocked || this.time.now < this.suppressClickUntil) return;
      if (p.leftButtonDown()) this.tryStartCharge();
    });
    this.input.on('pointerup', () => this.releaseCast());
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
    this.popupStack.push({ panel, close });
    return panel;
  }

  /** 최상단(가장 나중에 열린) 팝업 닫기. 닫은 게 있으면 true */
  private closeTopPopup(): boolean {
    const top = this.popupStack[this.popupStack.length - 1];
    if (!top) return false;
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

  // ── 장비 (E) ──
  private toggleEquipment(): void {
    if (this.equipPanel) {
      this.popupStack.find((e) => e.panel === this.equipPanel)?.close();
      return;
    }
    this.equipPanel = this.openPopup(
      (close) => new EquipmentPanel(this, GAME_WIDTH - 500, 70, close, () => this.hud?.refreshQuickslots()),
      () => { this.equipPanel = null; },
    );
  }

  // ── 어창/쿨러 (B) — 보관 어획 확인·방생 ──
  private toggleCooler(): void {
    if (this.coolerPanel) {
      this.popupStack.find((e) => e.panel === this.coolerPanel)?.close();
      return;
    }
    this.coolerPanel = this.openPopup(
      (close) => new CoolerPanel(this, { onClose: close }),
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
    this.openPopup((close) => new ConfirmDialog(
      this,
      `${BUILDING_LABEL[kind]}에 들어갑니다.\n상품을 거래하시겠습니까?`,
      () => { close(); this.openShop(kind); },
      close,
    ));
  }

  private openShop(kind: BuildingKind): void {
    if (this.shopPanel) return;
    const shop = SHOP_CATALOG[kind];

    // 좌측: 상점 / 우측: 인벤토리
    this.shopPanel = this.openPopup(
      (close) => new ShopPanel(this, 40, 60, shop, {
        onClose: close,
        onBuy: (entry) => this.handleBuy(entry),
        onSell: (item) => this.handleSell(item),
        onOpenDetail: (itemLike) => this.openItemDetail({ slot: 0, qty: 1, ...itemLike } as InvItem),
      }),
      () => { this.shopPanel = null; },
    );
    if (!this.invPanel) this.toggleInventory(GAME_WIDTH - 470);
    this.hud?.pushLog(`[상점] ${shop.name} 이용 시작`);
  }

  /** 구매 플로우: (수량 지정) → 확인 → 재화 차감 + 인벤토리 추가 */
  private handleBuy(entry: ShopEntry): void {
    const confirmBuy = (qty: number): void => {
      const total = entry.price * qty;
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
    const unit = InventoryStore.getSellPrice(item);
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
    if (!this.nearWater) {
      this.floatingHint('바다 가까이에서 캐스팅하세요');
      return;
    }
    // ── 장비 게이팅: 퀵슬롯 선택 + 실제 손 착용 상태 모두 필요 ──
    const activeId = InventoryStore.quickslots[GameState.player.activeQuickslotIndex];
    const activeItem = activeId ? InventoryStore.find(activeId) : undefined;
    if (!activeItem || activeItem.tool !== 'rod') {
      this.floatingHint('낚싯대가 등록된 퀵슬롯을 선택하세요');
      return;
    }
    if (!activeItem.equipped) {
      this.floatingHint('낚싯대를 손에 착용하세요 (인벤토리 우클릭 → 왼손/오른손 착용)');
      return;
    }
    // 채비 완성도 게이트: 필수 부품(원줄/찌/목줄/바늘·미끼)이 모두 장착되어야 캐스팅 가능
    const missing = InventoryStore.getMissingRigParts();
    if (missing.length > 0) {
      this.floatingHint(`채비가 불완전합니다 — ${missing.join(', ')} 장착 필요 (U 채비하기)`);
      return;
    }
    this.charging = true;
    this.chargePower = 0;
    if (!this.chargeBar) this.chargeBar = this.add.graphics().setDepth(30);
    if (!this.aimG) this.aimG = this.add.graphics().setDepth(29);
  }

  /** 현재 바람 벡터 (환경 데이터 없으면 목업) */
  private getWindVector(): WindVector {
    const env = GameState.environment.environment;
    if (env) {
      const rad = (env.weather.windDirectionDeg ?? 0) * Math.PI / 180;
      const s = env.weather.windSpeedMs * 6;
      return { x: Math.sin(rad) * s, y: -Math.cos(rad) * s };
    }
    return { x: 22, y: -9 };
  }

  private releaseCast(): void {
    if (!this.charging) return;
    this.charging = false;
    const power = this.chargePower;
    this.chargeBar?.clear();
    this.aimG?.clear();
    this.startCastFlight(this.lastAimDir, power);
  }

  /**
   * 3D 탄도 캐스팅 발사 — 조준 방향(마우스) × 파워 × 완력 + 바람/공기저항.
   * 그림자는 (x, y) 평면을 미끄러지고, 찌는 y - z 보정으로 포물선 비행.
   */
  private startCastFlight(dir: { x: number; y: number }, power: number): void {
    this.castBusy = true;
    const originX = this.playerBody.x;
    const originY = this.playerBody.y;

    this.castProj = launchCast({
      originX, originY,
      dirX: dir.x, dirY: dir.y,
      power,
      strength: DEFAULT_ANGLER_STATS.strength,
      wind: this.getWindVector(),
      // 채비 공기저항(루어 dragCoefficient/봉돌 종류) → 비거리 (메탈지그 초장타)
      airDragCd: InventoryStore.getRigDragCd(),
    });

    // 그림자 / 찌 이원화
    this.castShadow = this.add.ellipse(originX, originY, 10, 5, 0x000000, 0.3).setDepth(21);
    this.castBobber = this.add.circle(originX, originY - 6, 4, 0xff5252).setStrokeStyle(1, 0xffffff).setDepth(23);
    if (!this.castLineG) this.castLineG = this.add.graphics().setDepth(22);

    this.floatingHint(`캐스팅! 파워 ${Math.round(power * 100)}%`);
    this.hud?.pushLog(`[낚시] 캐스팅 — 파워 ${Math.round(power * 100)}%`);
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

    if (!proj.landed) return;

    // ── 착수 판정 (z <= 0) ──
    this.castProj = null;
    const col = Math.floor(proj.x / TR);
    const row = Math.floor(proj.y / TR);

    if (this.terrainAt(col, row) === 'water') {
      // 착수 파문 → 1인칭 낚시 뷰 진입
      const ripple = this.add.circle(proj.x, proj.y, 3, 0x000000, 0).setStrokeStyle(2, 0xdff0ff, 0.9).setDepth(21);
      this.tweens.add({ targets: ripple, scale: 4, alpha: 0, duration: 700, onComplete: () => ripple.destroy() });
      this.hud?.pushLog('[낚시] 착수! 1인칭 낚시 모드 진입');
      this.time.delayedCall(420, () => this.enterFirstPersonFishing(proj.x, proj.y, col, row));
    } else {
      // 육지 착지 — 회수
      this.floatingHint('육지에 떨어졌습니다 — 바다를 조준하세요');
      this.tweens.add({
        targets: [this.castBobber, this.castShadow],
        x: this.playerBody.x, y: this.playerBody.y, alpha: 0, duration: 300,
        onComplete: () => this.clearCastFlight(),
      });
    }
  }

  /** 캐스팅 비행 오브젝트 정리 */
  private clearCastFlight(): void {
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
    const shoreKind: 'sand' | 'grass' | 'gravel' =
      standing === 'grass' ? 'grass' : nearSea ? 'sand' : 'gravel';

    this.cameras.main.fadeOut(260, 2, 12, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.pause();
      this.scene.launch('FirstPersonFishingScene', {
        zMaxM, castDistanceM, reefSeed, region: this.region, shoreKind,
      });
    });
  }

  /**
   * 캐스팅 거리 → 착수 지점 수심 (m).
   * 실측 연안정보도 수심 프로필(현재 맵의 항구 앵커 기준)을 우선 사용하고,
   * 프로필이 없으면 기존 Land-to-Sea 그라디언트(computeZoneMaxDepth)로 폴백.
   * 프로필 범위를 넘는 거리는 depthAtDistance가 거리 비례로 외삽한다.
   */
  private resolveCastDepth(castDistanceM: number): number {
    const profile = this.cache.json.get(`depth_${this.region}`) as RegionDepthProfile | undefined;
    if (profile && Array.isArray(profile.anchors) && profile.anchors.length > 0) {
      // 현재 맵 ID(sokcho_dongmyeonghang_1 등)로 앵커 매칭
      const anchor = findDepthAnchor(profile, this.mapId);
      if (anchor) {
        const depth = depthAtDistance(anchor, castDistanceM);
        this.hud?.pushLog(`[수심] ${anchor.name} 기준 실측 ${depth.toFixed(1)}m (거리 ${castDistanceM.toFixed(0)}m)`);
        return Math.max(2, Math.round(depth * 10) / 10);
      }
    }
    const distRatio = Phaser.Math.Clamp(castDistanceM / 70, 0, 1);
    return computeZoneMaxDepth(distRatio);
  }

  // ═══════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════
  private createHud(): void {
    this.add.text(GAME_WIDTH / 2, 16, this.node.name, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#e8f4fd', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 12, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // 조작 힌트 (우하단)
    this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 14,
      '방향키 이동 · M 지도 · I 인벤토리 · S 스탯 · E 장비/상호작용 · U 활용 · ESC 메뉴', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
        backgroundColor: '#0a1628aa', padding: { x: 6, y: 3 },
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

    this.promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 96, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ffe28a', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
  }

  private floatingHint(msg: string): void {
    const t = this.add.text(this.playerBody.x, this.playerBody.y - 40, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#fff',
      backgroundColor: '#0a1628cc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(60);
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

    // 날씨 파티클
    if (weather === 'rain' || weather === 'sleet') this.spawnRain(80);
    else if (weather === 'shower') this.spawnRain(120);
    else if (weather === 'snow') this.spawnSnow(60);
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
        // 방파제 길: 진행 방향 양옆이 바다
        if (!((wN && wS) || (wE && wW))) continue;
        if ((c + r) % 6 !== 0) continue;   // 6타일 간격
        const x = c * TR + TR / 2, y = r * TR + TR / 2;
        this.add.image(x, y + 6, 'lamp_post').setOrigin(0.5, 1).setDepth(14 + y * 0.001);
        if (lit) {
          const bulb = this.add.circle(x, y - 15, 4.5, 0xfff2b0, 0.9)
            .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
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

  /** 밤 건물 조명 — 창문 불빛 + 주변광 + 종류별 네온사인 (명멸) */
  private lightBuildings(strong: boolean): void {
    const NEON: Record<BuildingKind, number> = {
      convenience: 0x35ff7a, mart: 0xffa040, market: 0xff5555,
      restaurant: 0xffcf6b, cafe: 0xffe2a8, pub: 0xc27cff,
    };
    for (const b of this.buildings) {
      // 창문 불빛 (건물 텍스처의 창 위치와 정합)
      const winAlpha = strong ? 0.7 : 0.35;
      this.add.rectangle(b.x - 10, b.y - 1, 8, 7, 0xffd980, winAlpha)
        .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
      this.add.rectangle(b.x + 10, b.y - 1, 8, 7, 0xffd980, winAlpha)
        .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
      // 주변광 글로우
      this.add.circle(b.x, b.y - 6, 42, 0xffc873, strong ? 0.11 : 0.05)
        .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
      // 네온사인 (간판 밴드 위) — 종류별 색 + 불규칙 명멸
      const neon = this.add.rectangle(b.x, b.y - 12, 34, 6, NEON[b.kind], strong ? 0.5 : 0.28)
        .setDepth(42).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: neon, alpha: strong ? 0.2 : 0.1,
        duration: 800 + (Math.abs(b.x * 7 + b.y * 3) % 700), yoyo: true, repeat: -1,
        delay: Math.abs(b.y) % 400,
      });
    }
  }

  /** 빗줄기 파티클 풀 (화면 고정 — 바람 사선) */
  private spawnRain(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.add.rectangle(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 1.5, 11, 0xbfd8ee, 0.5,
      ).setScrollFactor(0).setDepth(46).setAngle(8);
      this.rainDrops.push({ obj, speed: 520 + Math.random() * 260 });
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

  /** 안개 — 전체 헤이즈 + 드리프트하는 블롭 */
  private spawnFog(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc8d4dc, 0.12)
      .setScrollFactor(0).setDepth(45);
    for (let i = 0; i < 6; i++) {
      const obj = this.add.ellipse(
        Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT,
        340 + Math.random() * 180, 130 + Math.random() * 70,
        0xcdd8e0, 0.09 + Math.random() * 0.07,
      ).setScrollFactor(0).setDepth(45);
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
      if (f.obj.x - f.obj.width / 2 > GAME_WIDTH) f.obj.x = -f.obj.width / 2;
    }
  }

  update(_time: number, delta: number): void {
    this.hud?.updatePlayerMarker(this.playerBody.x, this.playerBody.y);
    this.updateWeatherFx(delta);
    // 캐스팅 비행은 UI 상태와 무관하게 진행 (착수까지 물리 유지)
    if (this.castProj) this.stepCastFlight(delta);
    if (this.isTransitioning || this.uiBlocked) { this.playerBody.setVelocity(0, 0); return; }
    this.handleMovement();
    this.updateSpriteAndShadow();
    this.updateBuildingProximity();
    this.updateWaterProximity();
    this.updateCharge();
    this.checkEdgeTransition();
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

  private handleMovement(): void {
    const speed = 150;
    let vx = 0, vy = 0;
    if (this.charging) {
      // 차지 중에는 이동 정지 (조준 유지)
      this.playerBody.setVelocity(0, 0);
      return;
    }
    if (this.cursors.left.isDown) { vx = -speed; this.playerFacing = 'left'; }
    else if (this.cursors.right.isDown) { vx = speed; this.playerFacing = 'right'; }
    if (this.cursors.up.isDown) { vy = -speed; this.playerFacing = 'up'; }
    else if (this.cursors.down.isDown) { vy = speed; this.playerFacing = 'down'; }
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.playerBody.setVelocity(vx, vy);
    this.updateWalkTexture(vx !== 0 || vy !== 0);
  }

  private updateWalkTexture(moving: boolean): void {
    const dir = this.playerFacing === 'up' ? 'back' : this.playerFacing === 'down' ? 'front' : this.playerFacing;
    let key: string;
    if (!moving) { key = `man-idle-${dir}`; this._walkFrameTimer = 0; this._walkFrame = 1; }
    else {
      this._walkFrameTimer += this.game.loop.delta;
      if (this._walkFrameTimer >= 200) { this._walkFrameTimer = 0; this._walkFrame = this._walkFrame === 1 ? 2 : 1; }
      key = `man-move-${dir}-${this._walkFrame}`;
    }
    if (this.playerSprite.texture.key !== key) {
      this.playerSprite.setTexture(key);
      this.applyPlayerSpriteSize();
    }
  }

  private updateSpriteAndShadow(): void {
    const feetY = this.playerBody.y + this.PLAYER_FOOT_OFFSET;
    this.playerSprite.setPosition(this.playerBody.x, feetY);
    this.playerSprite.setDepth(20 + this.playerBody.y * 0.001);
    const shadow = this.registry.get('_rfShadow') as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) shadow.setPosition(this.playerBody.x, feetY);
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
    if (this.castBusy) { this.promptText.setVisible(false); return; }
    // 건물 근접 힌트가 캐스팅 힌트보다 우선
    if (this.nearBuilding) {
      this.promptText.setText(`[E] ${BUILDING_LABEL[this.nearBuilding.kind]} — 거래하기`);
      this.promptText.setVisible(true);
    } else if (this.nearWater) {
      const activeId = InventoryStore.quickslots[GameState.player.activeQuickslotIndex];
      const activeItem = activeId ? InventoryStore.find(activeId) : undefined;
      const rodSelected = activeItem?.tool === 'rod';
      const rodEquipped = rodSelected && !!activeItem?.equipped;
      this.promptText.setText(
        rodEquipped ? '좌클릭 유지 = 조준·차지 → 놓으면 캐스팅 (마우스로 각도 조절)'
        : rodSelected ? '낚싯대를 손에 착용하세요 (인벤토리 우클릭 → 착용)'
        : '낚싯대 퀵슬롯을 선택하세요',
      );
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private updateCharge(): void {
    if (!this.charging || !this.chargeBar) return;
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
    const pointer = this.input.activePointer;
    const dx = pointer.worldX - this.playerBody.x;
    const dy = pointer.worldY - this.playerBody.y;
    const len = Math.hypot(dx, dy);
    if (len > 8) {
      this.lastAimDir = { x: dx / len, y: dy / len };
    }

    if (!this.aimG) return;
    this.aimG.clear();

    // 조준선 (캐릭터 → 마우스 방향)
    const px = this.playerBody.x, py = this.playerBody.y;
    this.aimG.lineStyle(1, 0xffffff, 0.35);
    this.aimG.lineBetween(px, py, px + this.lastAimDir.x * 90, py + this.lastAimDir.y * 90);

    // 예상 탄도 점선 (현재 파워 기준 — 그림자 경로 + 착수 지점)
    const traj = simulateCastTrajectory({
      originX: px, originY: py,
      dirX: this.lastAimDir.x, dirY: this.lastAimDir.y,
      power: this.chargePower,
      strength: DEFAULT_ANGLER_STATS.strength,
      wind: this.getWindVector(),
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
    }
  }

  // ═══════════════════════════════════════════════════
  // 맵 간 엣지 전환
  // ═══════════════════════════════════════════════════
  private checkEdgeTransition(): void {
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

    this.isTransitioning = true;
    this.playerBody.setVelocity(0, 0);
    this.cameras.main.fadeOut(240, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        region: this.region,
        mapId: neighbor,
        entryEdge: OPPOSITE_EDGE[edge!],
        entryT: t,
      } as RegionFieldInit);
    });
  }

  private exitToWorldMap(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(280, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldMapScene');
    });
  }

  // ═══════════════════════════════════════════════════
  // ESC 일시정지 메뉴 (Traveler's Rest 풍 도트 메뉴)
  // ═══════════════════════════════════════════════════
  private togglePauseMenu(): void {
    if (this.isTransitioning) return;
    if (this.isPaused) this.closePauseMenu();
    else this.openPauseMenu();
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
          GameState.save();
          this.hud?.pushLog(`[시스템] 슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다.`);
          this.closePauseMenu();
          this.floatingHint('저장 완료');
        },
      },
      { label: '전국 지도', action: () => this.exitToWorldMap() },
      { label: '타이틀 화면', action: () => this.gotoTitle() },
    ];
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
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(280, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
