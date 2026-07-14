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
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

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
const EDGE_MARGIN = 2;      // 이 타일 수 이내로 링크 엣지에 접근하면 전환
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

  // 낚시 캐스팅
  private nearWater = false;
  private nearWaterTarget?: { x: number; y: number };
  private charging = false;
  private chargePower = 0;
  private chargeBar?: Phaser.GameObjects.Graphics;
  private castBusy = false;

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
  }

  preload(): void {
    const key = `rmap_${this.mapId}`;
    if (!this.cache.json.has(key)) {
      this.load.json(key, `/${this.graph.dataDir}/${this.mapId}.json`);
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
  private renderTerrain(): void {
    const texKey = `rmaptex_${this.mapId}`;
    if (!this.textures.exists(texKey)) {
      const g = this.add.graphics();
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const t = this.terrain[r][c];
          const checker = (c + r) % 2 === 0;
          let color: number;
          if (t === 'water') {
            // 육지에 인접한 바다는 얕은 색(모래톱)으로
            const shallow =
              this.terrainAt(c + 1, r) !== 'water' || this.terrainAt(c - 1, r) !== 'water' ||
              this.terrainAt(c, r + 1) !== 'water' || this.terrainAt(c, r - 1) !== 'water';
            color = shallow ? COL.shore : (checker ? COL.water : COL.waterAlt);
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
    let targetC: number;
    let targetR: number;
    if (this.entryEdge === 'W') { targetC = SPAWN_INSET; targetR = Math.round(this.entryT * this.rows); }
    else if (this.entryEdge === 'E') { targetC = this.cols - 1 - SPAWN_INSET; targetR = Math.round(this.entryT * this.rows); }
    else if (this.entryEdge === 'N') { targetR = SPAWN_INSET; targetC = Math.round(this.entryT * this.cols); }
    else if (this.entryEdge === 'S') { targetR = this.rows - 1 - SPAWN_INSET; targetC = Math.round(this.entryT * this.cols); }
    else { targetC = Math.floor(this.cols / 2); targetR = Math.floor(this.rows / 2); }
    return this.nearestWalkable(targetC, targetR);
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
  // POI 마커
  // ═══════════════════════════════════════════════════
  private drawPois(): void {
    for (const poi of this.mapData.pois) {
      const x = poi.col * TR + TR / 2;
      const y = poi.row * TR + TR / 2;
      const icon = this.add.text(x, y, '🍴', { fontSize: '15px' }).setOrigin(0.5).setDepth(15);
      const ring = this.add.circle(x, y, 11, 0xffcf6b, 0).setStrokeStyle(2, 0xffcf6b, 0.9).setDepth(14);
      this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 1400, repeat: -1 });
      void icon;
    }
  }

  // ═══════════════════════════════════════════════════
  // 입력
  // ═══════════════════════════════════════════════════
  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-ESC', () => this.exitToWorldMap());

    // 좌클릭 차지 캐스팅 (바다 인접 + 낚싯대 슬롯)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.tryStartCharge();
    });
    this.input.on('pointerup', () => this.releaseCast());
  }

  private tryStartCharge(): void {
    if (this.castBusy || this.isTransitioning) return;
    if (!this.nearWater) {
      this.floatingHint('🎣 바다 가까이에서 캐스팅하세요');
      return;
    }
    if (GameState.player.activeQuickslotIndex !== 0) {
      this.floatingHint('🎣 낚싯대(1번 슬롯)를 먼저 선택하세요');
      return;
    }
    this.charging = true;
    this.chargePower = 0;
    if (!this.chargeBar) this.chargeBar = this.add.graphics().setDepth(30);
  }

  private releaseCast(): void {
    if (!this.charging) return;
    this.charging = false;
    const power = this.chargePower;
    this.chargeBar?.clear();
    if (this.nearWater && this.nearWaterTarget) {
      this.doCast(power, this.nearWaterTarget);
    }
  }

  /** 캐스팅 연출: 찌가 바다로 날아가 떨어지고 파문 → 잠시 후 회수 */
  private doCast(power: number, target: { x: number; y: number }): void {
    this.castBusy = true;
    const startX = this.playerBody.x;
    const startY = this.playerBody.y + this.PLAYER_FOOT_OFFSET - 20;
    // 파워에 따라 목표를 바다 쪽으로 더 멀리
    const dx = target.x - startX, dy = target.y - startY;
    const len = Math.hypot(dx, dy) || 1;
    const reach = 40 + power * 120;
    const tx = startX + (dx / len) * reach;
    const ty = startY + (dy / len) * reach;

    const line = this.add.graphics().setDepth(21);
    const bobber = this.add.circle(startX, startY, 4, 0xff5252).setStrokeStyle(1, 0xffffff).setDepth(22);

    this.floatingHint(`🎣 캐스팅! 파워 ${Math.round(power * 100)}%`);

    this.tweens.add({
      targets: bobber,
      x: tx, y: ty,
      duration: 420,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        line.clear();
        line.lineStyle(1.5, 0xf0f0f0, 0.9);
        line.lineBetween(this.playerBody.x, this.playerBody.y + this.PLAYER_FOOT_OFFSET - 22, bobber.x, bobber.y);
      },
      onComplete: () => {
        // 착수 파문
        const ripple = this.add.circle(tx, ty, 3, 0x000000, 0).setStrokeStyle(2, 0xdff0ff, 0.9).setDepth(21);
        this.tweens.add({ targets: ripple, scale: 4, alpha: 0, duration: 900, onComplete: () => ripple.destroy() });
        // 잠시 후 회수
        this.time.delayedCall(1400, () => {
          this.tweens.add({
            targets: bobber, x: this.playerBody.x, y: this.playerBody.y, alpha: 0, duration: 260,
            onUpdate: () => {
              line.clear();
              line.lineStyle(1.5, 0xf0f0f0, 0.6);
              line.lineBetween(this.playerBody.x, this.playerBody.y + this.PLAYER_FOOT_OFFSET - 22, bobber.x, bobber.y);
            },
            onComplete: () => { line.destroy(); bobber.destroy(); this.castBusy = false; },
          });
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════
  private createHud(): void {
    this.add.text(GAME_WIDTH / 2, 16, `📍 ${this.node.name}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#e8f4fd', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 12, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.add.text(16, 16,
      '방향키 이동  ·  지도 경계로 이동하면 인접 지역으로 전환  ·  [ESC] 전국 지도', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4',
        backgroundColor: '#0a1628aa', padding: { x: 8, y: 4 },
      }).setScrollFactor(0).setDepth(100);

    this.promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '', {
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
  update(): void {
    if (this.isTransitioning) { this.playerBody.setVelocity(0, 0); return; }
    this.handleMovement();
    this.updateSpriteAndShadow();
    this.updateWaterProximity();
    this.updateCharge();
    this.checkEdgeTransition();
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
    this.nearWaterTarget = found;
    if (this.castBusy) { this.promptText.setVisible(false); return; }
    if (this.nearWater) {
      const hasRod = GameState.player.activeQuickslotIndex === 0;
      this.promptText.setText(hasRod ? '🎣 좌클릭 유지 → 캐스팅 차지' : '🎣 낚싯대(1번 슬롯) 선택 후 캐스팅');
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
  }

  // ═══════════════════════════════════════════════════
  // 맵 간 엣지 전환
  // ═══════════════════════════════════════════════════
  private checkEdgeTransition(): void {
    if (this.isTransitioning || this.castBusy) return;
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
}
