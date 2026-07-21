/**
 * @file FieldScene.ts
 * @description 탑다운 4방향 필드 씬 — 바람의나라 스타일
 *
 * 플레이어 캐릭터가 2D 탑다운 맵에서 상하좌우로 자유롭게 이동.
 * 구역별 콘텐츠:
 * - 🌊 수역: 낚시 포인트 (SPACE/ENTER)
 * - 🪨 방파제: 이동 통로
 * - 🏘️ 마을: NPC/상점 (E키 상호작용)
 * - 🌿 갯벌: 해루질 진입 구역 (H키)
 * - 🕸️ 통발 수역: 통발 설치 가능 (T키)
 * - 🍽️ 식당: 캐치앤쿡 / 식당 운영 (C키)
 *
 * 씬 전환: pause/launch 방식으로 하위 씬 전환 시 상태 유지
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { getSpotById, SPOT_DATABASE, LicenseType, evaluateFishSellPrice, WeatherEvents, getCurrentGameMinute, EdgeTileType, getAvailableGatherItems, checkSlipHazard, attemptGather, GatherableItem, FishingPoint } from '@tra/core';
import { generateSpotFieldLayout, Zone, Building } from '../data/SpotFieldLayouts.js';
import { HUD } from '../ui/HUD.js';
import { MiniMap } from '../ui/MiniMap.js';
import { LicensePanel } from '../ui/LicensePanel.js';
import { InfoOverlayPanel } from '../ui/InfoOverlayPanel.js';
import { HydroCurrentRenderer } from '../ui/HydroCurrentRenderer.js';
import { BikeComposite, RiderDir } from '../ui/BikeComposite.js';
import { InventoryStore } from '../store/InventoryStore.js';

// 월드 크기 (중형 — 방파제+마을+갯벌 포함)
const TILE = 16; // 픽셀 타일 크기

export class FieldScene extends Phaser.Scene {
  // 플레이어
  /** 실제 스프라이트 이미지 (man-idle/move 계열 텍스처 교체 방식) */
  private playerSprite!: Phaser.GameObjects.Image;
  private playerBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  /** 자전거 합성 레이어 (R 승·하차 — 탑승 시 이동 속도 2배) */
  private bike?: BikeComposite;
  /** 애니메이션 프레임 토글 타이머 (ms 누적) */
  private _walkFrameTimer = 0;
  /** 현재 표시 중인 이동 프레임 (1 or 2) */
  private _walkFrame: 1 | 2 = 1;

  // 동적 월드 크기 및 레이아웃
  private worldW = 2048;
  private worldH = 1536;
  private zones: Zone[] = [];
  private buildings: Building[] = [];
  private playerSpawnX = 1024;
  private playerSpawnY = 530;

  // 입력
  // ※ cursors (방향키) → 이동 전용
  // ※ keyW/A/S/D → 향후 별도 단축키 할당용으로 예약. 이동에는 사용하지 않음
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // WASD 키는 이동에서 분리됨. 향후 단축키 할당 시는
  // this.input.keyboard!.on('keydown-W', ...) 이벤트 리스너 방식으로 추가
  // (예: W = 회전/조준, A/D = 카메라 회전, S = 특수 행동 등)

  // 스팟 정보
  private spotInfo = SPOT_DATABASE[0];

  // UI
  private hud?: HUD;
  private miniMap?: MiniMap;
  private activeLicensePanel: LicensePanel | null = null;

  // 팝업 LIFO 스택
  private openedPanels: (LicensePanel | InfoOverlayPanel)[] = [];

  // 캐릭터 스프라이트 표시 높이(px). idle/move 모든 텍스처를 이 높이로 정규화하여
  // 항상 같은 크기로 출력하고, 너비는 각 텍스처의 원본 종횡비를 유지해 왜곡을 방지한다.
  private readonly PLAYER_DISPLAY_H = 60;
  /** 발밑 기준점(playerBody 중심)에서 그림자/발까지의 오프셋(px) */
  private readonly PLAYER_FOOT_OFFSET = 12;

  // 플레이어 머리 위 활성화 말풍선
  private speechBubble?: Phaser.GameObjects.Container;

  // 상호작용 힌트
  private interactHint!: Phaser.GameObjects.Container;
  private interactHintText!: Phaser.GameObjects.Text;
  private nearBuilding: Building | null = null;

  // 낚시 포인트 오버랩 감지
  private fishingZoneActive = false;
  private activeFishingZone: Zone | null = null;

  // 조류/수심 시각화 렌더러
  private hydroRenderer?: HydroCurrentRenderer;
  // 조류 격자 갱신 타이머 (ms)
  private _hydroRefreshTimer = 0;
  private readonly _HYDRO_REFRESH_INTERVAL = 30000; // 30초마다 갱신

  // ─── 채집/위험 칸 시스템 ──────────────────────────────────
  /** 위험 칸 경고 팝업 (활성 중이면 non-null) */
  private slipWarningModal: Phaser.GameObjects.Container | null = null;
  /** 채집 패널 (활성 중이면 non-null) */
  private gatherPanel: Phaser.GameObjects.Container | null = null;
  /** 마지막 안전 좌표 (미끄러짐 시 복귀 위치) */
  private lastSafeX = 0;
  private lastSafeY = 0;
  /** 플레이어가 위험 칸에 있는지 여부 */
  private isOnDangerTile = false;

  // ─── 차지 게이지 (캐스팅 시스템) ─────────────────────────
  /** 마우스 꾹 누르기 중 여부 */
  private _isCharging = false;
  /** 게이지 값 0.0 ~ 1.0 */
  private _chargeValue = 0;
  /** 게이지 오르내리기 누적 타이머 (ms) */
  private _chargeTimer = 0;
  /** 차지 게이지 UI 컨테이너 */
  private _chargeGaugeContainer: Phaser.GameObjects.Container | null = null;
  /** 마우스 꾹 눌렀을 때의 world 좌표 (방향 판별) */
  private _chargeTargetX = 0;
  private _chargeTargetY = 0;

  constructor() {
    super({ key: 'FieldScene' });
  }

  init(data?: { spotId?: string }): void {
    const spotId = data?.spotId || GameState.currentSpotId || 'geoje_gujora_breakwater';
    const spot = getSpotById(spotId);
    if (spot) {
      this.spotInfo = spot;
      GameState.setCurrentSpot(spotId);

      // 동적 랜드필드 레이아웃 생성 및 로드
      const layout = generateSpotFieldLayout(spot);
      this.worldW = layout.worldWidth;
      this.worldH = layout.worldHeight;
      this.zones = layout.zones;
      this.buildings = layout.buildings;
      this.playerSpawnX = layout.playerSpawnX;
      this.playerSpawnY = layout.playerSpawnY;
    }
  }

  create(): void {
    // 월드 바운드 설정
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // ─── 배경 월드 그리기 ───
    this.drawWorld();

    // ─── 물리 바디용 보이지 않는 이미지 (카메라 타겟) ───
    this.playerBody = this.physics.add.image(
      this.playerSpawnX, this.playerSpawnY, '__DEFAULT'
    ) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(20, 20);

    // ─── 플레이어 스프라이트 (man 캐릭터 이미지 에셋) ───
    // BootScene에서 'man-idle-front' 등 12개 텍스처가 로드된 상태.
    // 원점을 발밑(0.5, 1)으로 두어 발이 지면 기준점에 닿게 하고,
    // 표시 높이를 PLAYER_DISPLAY_H로 정규화해 idle/move 크기를 항상 동일하게 유지한다.
    const feetY = this.playerSpawnY + this.PLAYER_FOOT_OFFSET;
    this.playerSprite = this.add.image(this.playerSpawnX, feetY, 'man-idle-front');
    this.playerSprite.setOrigin(0.5, 1);
    this.applyPlayerSpriteSize();
    this.playerSprite.setDepth(20);
    // 그림자 (발밑) — 발이 닿는 지점에 배치
    const shadow = this.add.ellipse(
      this.playerSpawnX, feetY, this.PLAYER_DISPLAY_H * 0.42, this.PLAYER_DISPLAY_H * 0.12,
      0x000000, 0.3
    ).setDepth(19);
    // shadow는 update()에서 playerBody 위치에 동기화
    this.registry.set('_playerShadow', shadow);

    // 자전거 합성 레이어 (씬 간 GameState.isMounted 유지)
    this.bike = new BikeComposite(this);
    this.bike.setVisible(GameState.isMounted);

    // ─── 카메라: 플레이어 팔로우 ───
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.playerBody, true, 0.12, 0.12);

    // ─── 입력 키 등록 ───
    this.cursors = this.input.keyboard!.createCursorKeys();
    // WASD 키를 Phaser 렬더러에 등록 (prevent default)
    // 이동에는 사용되지 않으며, 향후 on('keydown-W') 등으로 확장
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // ─── 액션 키 이벤트 ───
    this.input.keyboard!.on('keydown-SPACE', () => this.handleFishingEntry());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleFishingEntry());
    this.input.keyboard!.on('keydown-E',     () => this.handleInteract());
    this.input.keyboard!.on('keydown-R',     () => this.toggleBike());
    this.input.keyboard!.on('keydown-H',     () => this.startActivity('NightHuntingScene'));
    this.input.keyboard!.on('keydown-T',     () => this.startActivity('TrapScene'));
    this.input.keyboard!.on('keydown-C',     () => this.startActivity('CookScene'));
    // U: 제작대 (도마/조리대 · 낚시 채비 조합 등)
    // ─ [UX 기조] 그린헬(Green Hell) 스타일 제작 시스템을 목표로 함:
    //   · 인벤토리에서 재료를 제작대 슬롯 위로 드래그 앤 드롭하거나,
    //     재료를 클릭(선택)하면 제작대 위로 올라가는 방식으로 구현 예정
    //   · 올라간 재료 조합이 레시피와 매칭되면 제작 버튼 활성화 → 결과물 획득
    //   · 도마(음식 가공), 낚시 채비 조합대(채비/루어 제작) 등 제작대 종류별 분기 예정
    // TODO: 전용 CraftScene 구현 후 'CookScene' → 'CraftScene' 으로 교체
    this.input.keyboard!.on('keydown-U',     () => this.startActivity('CookScene'));
    this.input.keyboard!.on('keydown-L',     () => this.toggleLicensePanel());
    this.input.keyboard!.on('keydown-ESC',   () => this.handleEsc());
    this.input.keyboard!.on('keydown-M',     () => {
      if (this.miniMap) this.miniMap.toggleSizeMode();
    });
    this.input.keyboard!.on('keydown-I',     () => this.toggleInventoryPanel());
    this.input.keyboard!.on('keydown-Q',     () => this.toggleQuestPanel());
    this.input.keyboard!.on('keydown-S',     () => this.toggleStatPanel());

    // ─── 돌발 기상 이벤트 리스너 연동 ───
    WeatherEvents.addListener((event) => {
      if (event) {
        this.showPlayerFloatingHint(`[⚠️ 돌발 기상: ${event.name}]`);
        const { width } = this.scale;
        const alertText = this.add.text(width / 2, 80, `⚠️ 돌발 경보: ${event.name}! (${event.description})`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '14px',
          color: '#ff3333',
          fontStyle: 'bold',
          backgroundColor: '#050f1ecc',
          padding: { x: 10, y: 5 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.time.delayedCall(5000, () => {
          alertText.destroy();
        });
      }
    });

    // 퀵슬롯 단축키 1 ~ 8 등록
    for (let i = 0; i < 8; i++) {
      this.input.keyboard!.on(`keydown-${i + 1}`, () => {
        GameState.updatePlayer({ activeQuickslotIndex: i });
        if (this.hud) this.hud.updateQuickslotsVisual();
        this.events.emit('quickslot-changed', i);
      });
    }


    // 낚싯대 장착 시 마우스 꾹 → 차지게이지
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return; // 좌클릭만
      if (this.openedPanels.length > 0 || this.slipWarningModal || this.gatherPanel) return;
      if (pointer.y > this.scale.height - 80) return;
      const activeSlot = GameState.player.activeQuickslotIndex;
      if (activeSlot !== 0) return; // 슬롯 0 = 낚싯대
      // 차지 시작
      this._isCharging = true;
      this._chargeValue = 0;
      this._chargeTimer = 0;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this._chargeTargetX = wp.x;
      this._chargeTargetY = wp.y;
      this.showChargeGauge();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (!this._isCharging) return;
      this._isCharging = false;
      const power = this._chargeValue; // 0.0 ~ 1.0
      this.hideChargeGauge();
      this.handleCast(power, this._chargeTargetX, this._chargeTargetY);
    });

    // ─── HUD (카메라 fixed) ───
    this.hud = new HUD(this);
    this.add.existing(this.hud);

    // 퀵슬롯 클릭 이벤트 핸들러 수신 연동
    this.events.on('quickslot-changed', (index: number) => {
      this.handleQuickslotChange(index, false);
    });

    // ─── 미니맵 ─── (직사각형 미니맵을 우측 상단 모서리에 가깝게 배치)
    this.miniMap = new MiniMap(this, this.scale.width - 166, 16, 150, 150);
    this.add.existing(this.miniMap);

    // ─── 상호작용 힌트 UI (화면 하단 고정) ───
    this.createInteractHint();

    // ─── 조류/수심 시각화 렌더러 초기화 ───
    this.hydroRenderer = new HydroCurrentRenderer(this);
    // 영일만 스팟의 경우 초기 조류 격자 렌더링 (물때 7, 세기 0.5 기본값)
    this.hydroRenderer.refreshGrid(this.spotInfo.id, 7, 0.5);
    // 낚시 포인트 마커는 항상 표시, 조류 오버레이는 V 키로 토글
    this.hydroRenderer.setPointMarkersVisible(true);

    // V 키: 조류/수심 오버레이 토글
    this.input.keyboard!.on('keydown-V', () => {
      if (this.hydroRenderer) {
        const next = !this.hydroRenderer.isVisible();
        this.hydroRenderer.setVisible(next);
        this.showPlayerFloatingHint(next ? '🌊 조류 오버레이 ON' : '🌊 조류 오버레이 OFF');
      }
    });

    // ─── 하위 씬 복귀 이벤트 ───
    this.events.on('resume', () => {
      this.cameras.main.fadeIn(300, 0, 10, 20);
    });

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  update(): void {
    if (!this.playerBody) return;

    // 자전거 탑승 시 이동 속도 2배
    const speed = 200 * (GameState.isMounted ? 2 : 1);
    let vx = 0;
    let vy = 0;

    // 이동 입력 — 방향키 전용
    // ※ WASD는 이동과 분리되어 있음. 향후 별도 단축키(예: 메뉴, 회전 등)로 바인딩 예정
    const left  = this.cursors.left.isDown;
    const right = this.cursors.right.isDown;
    const up    = this.cursors.up.isDown;
    const down  = this.cursors.down.isDown;

    const keyboardActive = left || right || up || down;

    if (keyboardActive) {
      if (left)  { vx = -speed; this.playerFacing = 'left'; }
      if (right) { vx =  speed; this.playerFacing = 'right'; }
      if (up)    { vy = -speed; this.playerFacing = 'up'; }
      if (down)  { vy =  speed; this.playerFacing = 'down'; }
    }

    // 대각선 정규화
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.playerBody.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;
    GameState.updatePlayer({
      facing: this.playerFacing,
      status: moving ? 'walking' : 'idle',
    });

    // ─── 플레이어 스프라이트 동기화 (발밑 기준 + 자전거 합성) ───
    const feetY = this.playerBody.y + this.PLAYER_FOOT_OFFSET;
    let riderOffset = 0;
    if (this.bike && GameState.isMounted) {
      const dirKey: RiderDir = this.playerFacing === 'up' ? 'back' : this.playerFacing === 'down' ? 'front' : this.playerFacing;
      // 측면 = 캐릭터 뒤 / 정면·후면 = 캐릭터 앞 (핸들바·바퀴가 카메라 쪽)
      const bikeDepth = dirKey === 'left' || dirKey === 'right'
        ? this.playerSprite.depth - 0.5 : this.playerSprite.depth + 0.5;
      riderOffset = this.bike.update(
        this.playerBody.x, feetY, dirKey, moving, this.time.now, bikeDepth);
    }
    this.playerSprite.setPosition(this.playerBody.x, feetY + riderOffset);
    // 그림자 동기화 (발밑에 붙임 — 탑승 시 자전거 풋프린트만큼 확장)
    const shadow = this.registry.get('_playerShadow') as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) {
      shadow.setPosition(this.playerBody.x, feetY);
      shadow.setScale(GameState.isMounted ? 1.6 : 1, 1);
    }
    this.updatePlayerSprite(this.playerFacing, moving);

    // 머리 위 말풍선 동기화
    if (this.speechBubble && this.speechBubble.active) {
      this.speechBubble.setPosition(
        this.playerBody.x, 
        this.playerBody.y - 45 - (1.0 - this.speechBubble.alpha) * 10
      );
    }

    // 미니맵 동기화
    if (this.miniMap) {
      this.miniMap.updatePlayerMarker(this.playerBody.x, this.playerBody.y);
    }

    // 돌발 기상 틱 갱신
    WeatherEvents.tick(getCurrentGameMinute());

    // 조류 격자 주기적 갱신 (30초마다)
    if (this.hydroRenderer) {
      this._hydroRefreshTimer += this.game.loop.delta;
      if (this._hydroRefreshTimer >= this._HYDRO_REFRESH_INTERVAL) {
        this._hydroRefreshTimer = 0;
        // EnvironmentStore에서 현재 물때 단계를 가져와 격자 갱신
        const tidePhase = GameState.environment.environment?.tide?.tidePhase ?? 7;
        this.hydroRenderer.refreshGrid(this.spotInfo.id, tidePhase, 0.5);
      }
    }

    // 구역/건물 근접 감지
    this.checkProximity();

    // 캐스팅 차지 게이지 갱신
    this.updateChargeGauge(this.game.loop.delta);
  }

  // ─────────────────────────────────────────────────────────
  // 월드 그리기
  // ─────────────────────────────────────────────────────────
  private drawWorld(): void {
    // 각 구역 배경
    this.zones.forEach((zone) => {
      const g = this.add.graphics().setDepth(0);
      g.fillStyle(zone.color, zone.alpha);
      g.fillRect(zone.x, zone.y, zone.w, zone.h);

      // 구역 레이블 (작은 픽셀 텍스트)
      if (zone.label) {
        this.add.text(zone.x + 10, zone.y + 6, zone.label, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ffffff44',
        }).setDepth(1);
      }
    });

    // 픽셀 격자 (타일 경계선 — 16px 간격)
    const grid = this.add.graphics().setDepth(0);
    grid.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x <= this.worldW; x += TILE) {
      grid.moveTo(x, 0).lineTo(x, this.worldH);
    }
    for (let y = 0; y <= this.worldH; y += TILE) {
      grid.moveTo(0, y).lineTo(this.worldW, y);
    }
    grid.strokePath();

    // 방파제 테트라포드 (방파제 상단 경계가 있는 맵에서만 생성)
    const hasBreakwater = this.zones.some(z => z.id === 'breakwater');
    if (hasBreakwater) {
      const tetra = this.add.graphics().setDepth(2);
      tetra.fillStyle(0x1a2530, 1);
      for (let i = 0; i < Math.floor(this.worldW / 40); i++) {
        const tx = i * 40 + 4;
        const ty = 330;
        tetra.fillTriangle(tx, ty + 18, tx + 14, ty - 4, tx + 28, ty + 18);
      }
    }

    // 낚시 포인트 표시 (글로우 원)
    const fishG = this.add.graphics().setDepth(3);
    this.zones.filter((z) => z.action === 'fishing').forEach((zone) => {
      const cx = zone.x + zone.w / 2;
      const cy = zone.y + zone.h / 2;
      fishG.fillStyle(0xffff44, 0.25);
      fishG.fillCircle(cx, cy, 28);
      fishG.lineStyle(2, 0xffff44, 0.8);
      fishG.strokeCircle(cx, cy, 28);
      this.add.text(cx, zone.y - 14, zone.label, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffff88',
      }).setOrigin(0.5).setDepth(3);
    });

    // 통발 구역 표시
    const trapZone = this.zones.find((z) => z.id === 'trap_zone');
    if (trapZone) {
      const tg = this.add.graphics().setDepth(3);
      tg.lineStyle(2, 0x4488ff, 0.6);
      tg.strokeRect(trapZone.x + 2, trapZone.y + 2, trapZone.w - 4, trapZone.h - 4);
      for (let i = 0; i < 4; i++) {
        const bx = trapZone.x + 40 + i * 70;
        const by = trapZone.y + 50;
        tg.fillStyle(0x3366cc, 0.8);
        tg.fillCircle(bx, by, 8);
        this.add.text(bx, by - 20, '🪤', { fontSize: '12px' }).setOrigin(0.5).setDepth(4);
      }
    }

    // 갯벌 텍스처 (도트 패턴)
    const flatZone = this.zones.find((z) => z.id === 'tidal_flat');
    if (flatZone) {
      const fg = this.add.graphics().setDepth(1);
      fg.fillStyle(0x3a4a2a, 0.7);
      for (let xi = flatZone.x; xi < flatZone.x + flatZone.w; xi += 12) {
        for (let yi = flatZone.y; yi < flatZone.y + flatZone.h; yi += 12) {
          if ((xi + yi) % 24 === 0) fg.fillRect(xi, yi, 4, 4);
        }
      }
      this.add.text(flatZone.x + 20, flatZone.y + 10, flatZone.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#88cc88',
      }).setDepth(3);
    }

    // 건물 그리기
    this.buildings.forEach((b) => {
      const bg = this.add.graphics().setDepth(5);
      // 건물 본체
      bg.fillStyle(b.color, 1);
      bg.fillRect(b.x, b.y, b.w, b.h);
      // 지붕 (상단 22%)
      bg.fillStyle(Phaser.Display.Color.ValueToColor(b.color).darken(20).color, 1);
      bg.fillRect(b.x, b.y, b.w, Math.floor(b.h * 0.22));
      // 문
      bg.fillStyle(b.doorColor, 1);
      bg.fillRect(b.x + Math.floor(b.w / 2) - 10, b.y + b.h - 28, 20, 28);
      // 창문
      bg.fillStyle(0x88ccff, 0.8);
      bg.fillRect(b.x + 10, b.y + Math.floor(b.h * 0.3), 20, 18);
      if (b.w > 100) bg.fillRect(b.x + b.w - 30, b.y + Math.floor(b.h * 0.3), 20, 18);
      // 건물 테두리
      bg.lineStyle(1, 0xffffff, 0.3);
      bg.strokeRect(b.x, b.y, b.w, b.h);

      // 건물 이름
      this.add.text(b.x + b.w / 2, b.y - 14, b.label, {
        fontFamily: '"Noto Sans KR", monospace', fontSize: '12px',
        color: '#e8f4fd', fontStyle: 'bold',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(6);
      if (b.sublabel) {
        this.add.text(b.x + b.w / 2, b.y - 2, b.sublabel, {
          fontFamily: 'monospace', fontSize: '9px', color: '#aabbcc',
        }).setOrigin(0.5).setDepth(6);
      }
    });

    // 세계 경계 표시
    const border = this.add.graphics().setDepth(10);
    border.lineStyle(3, 0x224466, 1);
    border.strokeRect(0, 0, this.worldW, this.worldH);

    // 스팟 이름 (상단 좌측)
    this.add.text(20, 10, `📍 ${this.spotInfo.name}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px',
      color: '#4af2a1', fontStyle: 'bold',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setDepth(5);
  }

  // ── 자전거 (R) — 승·하차 토글 (기타 인벤토리에 자전거 보유 필요) ──
  private toggleBike(): void {
    if (!GameState.isMounted && !InventoryStore.find('inv_bike')) return;
    GameState.isMounted = !GameState.isMounted;
    this.bike?.setVisible(GameState.isMounted);
  }

  /** 하위 씬 진입 시 자동 하차 (실내/낚시 중 자전거 금지) */
  private dismountBike(): void {
    if (!GameState.isMounted) return;
    GameState.isMounted = false;
    this.bike?.setVisible(false);
  }

  // ─────────────────────────────────────────────────────────
  // 플레이어 스프라이트 텍스처 교체 (man 에셋 기반)
  // ─────────────────────────────────────────────────────────
  /**
   * 이동 방향과 움직임 상태에 따라 playerSprite 텍스처 키를 교체.
   * - idle: 'man-idle-{front|back|left|right}'
   * - move: 'man-move-{front|back|left|right}-{1|2}' (200ms 교체 주기)
   */
  private updatePlayerSprite(facing: 'up' | 'down' | 'left' | 'right', isMoving: boolean): void {
    // 방향 키 변환
    const dirKey = facing === 'up' ? 'back' : facing === 'down' ? 'front' : facing;

    let textureKey: string;
    // 탑승 중엔 걷기 프레임 대신 idle 고정 (다리는 페달링으로 자전거에 가림)
    if (!isMoving || GameState.isMounted) {
      textureKey = `man-idle-${dirKey}`;
      this._walkFrameTimer = 0;
      this._walkFrame = 1;
    } else {
      // 이동 상태 — 200ms 주기로 1 ↔ 2 프레임 교체
      this._walkFrameTimer += this.game.loop.delta;
      if (this._walkFrameTimer >= 200) {
        this._walkFrameTimer = 0;
        this._walkFrame = this._walkFrame === 1 ? 2 : 1;
      }
      textureKey = `man-move-${dirKey}-${this._walkFrame}`;
    }

    // 텍스처가 이미 같으면 스킵 (성능 최적화)
    if (this.playerSprite.texture.key !== textureKey) {
      this.playerSprite.setTexture(textureKey);
      // 텍스처마다 원본 해상도가 다르므로, 교체 시 표시 크기를 재정규화하여
      // idle ↔ move 전환 시에도 캐릭터가 항상 같은 크기로 보이게 한다.
      this.applyPlayerSpriteSize();
    }
  }

  /**
   * 현재 플레이어 스프라이트를 PLAYER_DISPLAY_H(고정 높이)로 정규화한다.
   * 너비는 현재 텍스처의 원본 종횡비를 유지해 왜곡 없이 idle/move 크기를 통일한다.
   */
  private applyPlayerSpriteSize(): void {
    const src = this.playerSprite.texture.getSourceImage() as HTMLImageElement;
    if (!src || !src.height) return;
    const h = this.PLAYER_DISPLAY_H;
    const w = h * (src.width / src.height);
    this.playerSprite.setDisplaySize(w, h);
  }

  // ─────────────────────────────────────────────────────────
  // 상호작용 힌트 UI (화면 하단 중앙에 고정)
  // ─────────────────────────────────────────────────────────
  private createInteractHint(): void {
    const { width, height } = this.scale;
    this.interactHint = this.add.container(width / 2, height - 30)
      .setDepth(100)
      .setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.88);
    bg.fillRoundedRect(-200, -16, 400, 32, 6);
    bg.lineStyle(1.5, 0x4af2a1, 0.6);
    bg.strokeRoundedRect(-200, -16, 400, 32, 6);

    this.interactHintText = this.add.text(0, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.interactHint.add([bg, this.interactHintText]);
    this.interactHint.setVisible(false);
  }

  private showHint(text: string): void {
    this.interactHintText.setText(text);
    this.interactHint.setVisible(true);
  }

  private hideHint(): void {
    this.interactHint.setVisible(false);
  }

  // ─────────────────────────────────────────────────────────
  // 근접 감지 — 건물, 구역
  // ─────────────────────────────────────────────────────────
  private checkProximity(): void {
    const px = this.playerBody.x;
    const py = this.playerBody.y;
    const interactRadius = 60;

    // 건물 근접 감지
    let nearB: Building | null = null;
    for (const b of this.buildings) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dist = Phaser.Math.Distance.Between(px, py, cx, cy);
      if (dist < interactRadius + b.w / 2) {
        nearB = b;
        break;
      }
    }

    // 구역(활동) 근접 감지 (낚시 포인트 등)
    let nearZ: Zone | null = null;
    for (const z of this.zones) {
      if (!z.action || z.action === 'fishing') {
        // 낚시 구역은 직접 겹침 체크
        if (z.action === 'fishing') {
          if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
            nearZ = z;
            break;
          }
        }
      }
    }

    // 힌트 표시
    this.nearBuilding = nearB;
    this.activeFishingZone = nearZ;

    if (nearB?.hint) {
      this.showHint(nearB.hint);
      this.fishingZoneActive = false;
      this.activeFishingZone = null;
    } else if (nearZ) {
      this.showHint(nearZ.hint ?? '');
      this.fishingZoneActive = true;
    } else {
      this.hideHint();
      this.fishingZoneActive = false;
    }

    // ── 위험 엣지 타일 감지 ──────────────────────────────────
    this.checkEdgeTile(px, py);
  }

  /**
   * 위험 엣지 타일 감지
   * - 방파제(BREAKWATER_EDGE) / 갯바위(ROCKY_EDGE) / 갯벌(TIDAL_FLAT_EDGE)
   * - 경고 구간(2타일): 슬립 경고 팝업
   * - 위험 칸(1타일): 채집 패널 열기
   */
  private checkEdgeTile(px: number, py: number): void {
    const spotType = this.spotInfo.spotType;
    let dangerEdgeY: number | null = null;
    let edgeType: EdgeTileType = 'NONE';

    if (spotType === 'breakwater') {
      const bwZone = this.zones.find(
        (z) => z.id === 'breakwater' || z.id === 'north_breakwater' || z.id === 'south_breakwater',
      );
      if (bwZone) {
        dangerEdgeY = bwZone.y - 16;
        edgeType = 'BREAKWATER_EDGE';
      }
    } else if (spotType === 'rocky_shore') {
      const shallowZone = this.zones.find(
        (z) => z.id === 'shallow' || z.id === 'outer_south' || z.id === 'outer_north',
      );
      if (shallowZone) {
        dangerEdgeY = shallowZone.y + shallowZone.h - 16;
        edgeType = 'ROCKY_EDGE';
      }
    } else if (spotType === 'tidal_flat') {
      const flatZone = this.zones.find((z) => z.id === 'tidal_flat');
      if (flatZone) {
        dangerEdgeY = flatZone.y;
        edgeType = 'TIDAL_FLAT_EDGE';
      }
    }

    if (dangerEdgeY === null) {
      this.closeSlipWarning();
      this.closeGatherPanel();
      this.isOnDangerTile = false;
      return;
    }

    const WARNING_RANGE = 32;
    const DANGER_RANGE = 16;
    const distToEdge = Math.abs(py - dangerEdgeY);

    if (distToEdge <= DANGER_RANGE) {
      if (!this.isOnDangerTile) {
        this.isOnDangerTile = true;
        this.closeSlipWarning();
        this.openGatherPanel(edgeType);
      }
    } else if (distToEdge <= WARNING_RANGE) {
      this.isOnDangerTile = false;
      this.closeGatherPanel();
      if (!this.slipWarningModal) {
        this.showSlipWarning(edgeType);
      }
    } else {
      if (!this.isOnDangerTile) {
        this.lastSafeX = px;
        this.lastSafeY = py;
      }
      this.isOnDangerTile = false;
      this.closeSlipWarning();
      this.closeGatherPanel();
    }
  }

  // ─────────────────────────────────────────────────────────
  // 미끄러짐 경고 팝업
  // ─────────────────────────────────────────────────────────
  private showSlipWarning(edgeType: EdgeTileType): void {
    if (this.slipWarningModal) return;
    this.playerBody.setVelocity(0, 0);

    const { width, height } = this.scale;
    const modalW = 460;
    const modalH = 190;
    const mx = (width - modalW) / 2;
    const my = (height - modalH) / 2;

    const modal = this.add.container(0, 0).setDepth(400).setScrollFactor(0);
    this.slipWarningModal = modal;

    const dimBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55).setScrollFactor(0);
    modal.add(dimBg);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a0a, 0.96);
    bg.fillRoundedRect(mx, my, modalW, modalH, 6);
    bg.lineStyle(2, 0xff4444, 0.9);
    bg.strokeRoundedRect(mx, my, modalW, modalH, 6);
    modal.add(bg);

    const edgeLabel =
      edgeType === 'BREAKWATER_EDGE' ? '방파제 직벽 수면 경계' :
      edgeType === 'ROCKY_EDGE' ? '갯바위 수면 경계' : '갯벌 수면 경계';

    const titleTxt = this.add.text(width / 2, my + 24, `⚠️ 위험 구역: ${edgeLabel}`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '15px', color: '#ff6666', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0);
    modal.add(titleTxt);

    const descTxt = this.add.text(width / 2, my + 56, '수면 경계로 이동하면 미끄러질 수 있습니다! (30% 확률)\n미끄러지면 바다에 빠져 체력/피로도를 절반 잃습니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px', color: '#ffcccc', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0);
    modal.add(descTxt);

    // [계속해서 이동하기]
    const contBtn = this.add.container(width / 2 - 100, my + modalH - 28).setScrollFactor(0);
    const contBg = this.add.graphics();
    contBg.fillStyle(0x4a1010, 0.95);
    contBg.fillRoundedRect(-82, -15, 164, 30, 4);
    contBg.lineStyle(1.5, 0xff4444, 0.9);
    contBg.strokeRoundedRect(-82, -15, 164, 30, 4);
    const contTxt = this.add.text(0, 0, '⚠ 계속해서 이동하기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#ff8888', fontStyle: 'bold',
    }).setOrigin(0.5);
    contBtn.add([contBg, contTxt]);
    contBtn.setInteractive(new Phaser.Geom.Rectangle(-82, -15, 164, 30), Phaser.Geom.Rectangle.Contains);
    contBtn.on('pointerdown', () => this.attemptDangerMove(edgeType));
    contBtn.on('pointerover', () => contBg.setAlpha(1.4));
    contBtn.on('pointerout', () => contBg.setAlpha(1));
    modal.add(contBtn);

    // [뒤로 가기]
    const cancelBtn = this.add.container(width / 2 + 100, my + modalH - 28).setScrollFactor(0);
    const canBg = this.add.graphics();
    canBg.fillStyle(0x0e1c2d, 0.9);
    canBg.fillRoundedRect(-68, -15, 136, 30, 4);
    canBg.lineStyle(1.5, 0x2a5a8a, 0.8);
    canBg.strokeRoundedRect(-68, -15, 136, 30, 4);
    const canTxt = this.add.text(0, 0, '← 뒤로 가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#8faabf', fontStyle: 'bold',
    }).setOrigin(0.5);
    cancelBtn.add([canBg, canTxt]);
    cancelBtn.setInteractive(new Phaser.Geom.Rectangle(-68, -15, 136, 30), Phaser.Geom.Rectangle.Contains);
    cancelBtn.on('pointerdown', () => this.closeSlipWarning());
    cancelBtn.on('pointerover', () => canBg.setAlpha(1.5));
    cancelBtn.on('pointerout', () => canBg.setAlpha(1));
    modal.add(cancelBtn);
  }

  private closeSlipWarning(): void {
    if (this.slipWarningModal) {
      this.slipWarningModal.destroy();
      this.slipWarningModal = null;
    }
  }

  private attemptDangerMove(edgeType: EdgeTileType): void {
    this.closeSlipWarning();
    const slip = checkSlipHazard(0.3, GameState.player.stamina, GameState.player.fatigue);

    if (slip.slipped) {
      const newStamina = Math.max(0, GameState.player.stamina - slip.staminaLost);
      const newFatigue = Math.min(100, GameState.player.fatigue + slip.fatigueLost);
      GameState.updatePlayer({ stamina: newStamina, fatigue: newFatigue });
      if (this.hud) this.hud.updateHUD();
      this.playerBody.setPosition(this.lastSafeX, this.lastSafeY);
      this.cameras.main.flash(300, 0, 80, 200);
      this.showPlayerFloatingHint(
        `💦 미끄러져 바다에 빠졌습니다! 체력 -${slip.staminaLost}, 피로도 +${slip.fatigueLost}`,
      );
    } else {
      this.isOnDangerTile = true;
      this.openGatherPanel(edgeType);
      this.showPlayerFloatingHint('✅ 이동 성공! [채집하기]로 채집하세요.');
    }
  }

  // ─────────────────────────────────────────────────────────
  // 채집 패널
  // ─────────────────────────────────────────────────────────
  private openGatherPanel(edgeType: EdgeTileType): void {
    if (this.gatherPanel) return;

    const tidePhase = GameState.environment.environment?.tide?.tidePhase ?? 7;
    const isHighTide = tidePhase >= 8 && tidePhase <= 13;
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;

    const items = getAvailableGatherItems(edgeType, isHighTide, isNight);

    const { width, height } = this.scale;
    const panelW = 340;
    const panelH = 60 + Math.max(items.length, 1) * 62 + 30;
    const panelX = width - panelW - 16;
    const panelY = height / 2 - panelH / 2;

    const panel = this.add.container(0, 0).setDepth(350).setScrollFactor(0);
    this.gatherPanel = panel;

    const bg = this.add.graphics();
    bg.fillStyle(0x061222, 0.96);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    bg.lineStyle(2, 0x78e08f, 0.9);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);
    panel.add(bg);

    const titleTxt = this.add.text(panelX + panelW / 2, panelY + 14, '🌿 채집하기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '15px', color: '#78e08f', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0);
    panel.add(titleTxt);

    if (items.length === 0) {
      const noTxt = this.add.text(panelX + panelW / 2, panelY + 44, '현재 채집 가능한 생물이 없습니다.\n(만조 또는 야간 시 추가 채집 가능)', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px', color: '#607b8e', align: 'center', lineSpacing: 4,
      }).setOrigin(0.5, 0).setScrollFactor(0);
      panel.add(noTxt);
    }

    items.forEach((item, i) => {
      const iy = panelY + 44 + i * 62;
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x0e1c2d, 0.8);
      rowBg.fillRoundedRect(panelX + 10, iy, panelW - 20, 54, 4);
      panel.add(rowBg);

      const iconTxt = this.add.text(panelX + 24, iy + 10, item.icon, { fontSize: '22px' }).setScrollFactor(0);
      panel.add(iconTxt);

      const nameTxt = this.add.text(panelX + 54, iy + 8, item.nameKo, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: '#e8f4fd', fontStyle: 'bold',
      }).setScrollFactor(0);
      panel.add(nameTxt);

      const toolTxt = this.add.text(panelX + 54, iy + 28, `🔧 ${item.toolNameKo}  ·  성공률 ${Math.round(item.baseSuccessRate * 100)}%`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px', color: '#8faabf',
      }).setScrollFactor(0);
      panel.add(toolTxt);

      const gatherBtn = this.add.container(panelX + panelW - 56, iy + 26).setScrollFactor(0);
      const gbBg = this.add.graphics();
      gbBg.fillStyle(0x0d3d20, 0.9);
      gbBg.fillRoundedRect(-30, -14, 60, 28, 4);
      gbBg.lineStyle(1.5, 0x78e08f, 0.9);
      gbBg.strokeRoundedRect(-30, -14, 60, 28, 4);
      const gbTxt = this.add.text(0, 0, '채집', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px', color: '#78e08f', fontStyle: 'bold',
      }).setOrigin(0.5);
      gatherBtn.add([gbBg, gbTxt]);
      gatherBtn.setInteractive(new Phaser.Geom.Rectangle(-30, -14, 60, 28), Phaser.Geom.Rectangle.Contains);
      gatherBtn.on('pointerdown', () => this.executeGather(item));
      gatherBtn.on('pointerover', () => { gbBg.setAlpha(1.4); gbTxt.setColor('#aaffcc'); });
      gatherBtn.on('pointerout', () => { gbBg.setAlpha(1); gbTxt.setColor('#78e08f'); });
      panel.add(gatherBtn);
    });

    // 닫기 버튼
    const closeBtn = this.add.container(panelX + panelW - 16, panelY + 16).setScrollFactor(0);
    const closeBg = this.add.graphics();
    closeBg.lineStyle(1.5, 0x607b8e, 0.8);
    closeBg.strokeCircle(0, 0, 10);
    const closeTxt = this.add.text(0, 0, '✕', { fontFamily: 'monospace', fontSize: '12px', color: '#8faabf' }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);
    closeBtn.on('pointerdown', () => this.closeGatherPanel());
    panel.add(closeBtn);
  }

  private closeGatherPanel(): void {
    if (this.gatherPanel) {
      this.gatherPanel.destroy();
      this.gatherPanel = null;
    }
  }

  private executeGather(item: GatherableItem): void {
    const hasTool = this.checkPlayerHasTool(item.requiredTool);
    const result = attemptGather(item, hasTool);
    if (result.success) {
      const newCoins = GameState.player.inventory.coins + result.totalValueWon;
      GameState.updatePlayer({ inventory: { ...GameState.player.inventory, coins: newCoins } });
      if (this.hud) this.hud.updateHUD();
      this.cameras.main.flash(200, 0, 120, 50);
    }
    this.showPlayerFloatingHint(result.message);
  }

  private checkPlayerHasTool(toolType: string): boolean {
    if (toolType === 'hand') return true;
    const inv = GameState.player.inventory;
    if (toolType === 'net') return inv.consumables.some((c) => c.itemId.includes('net') || c.itemId.includes('dip'));
    if (toolType === 'knife') return inv.consumables.some((c) => c.itemId.includes('knife') || c.itemId.includes('blade'));
    return true; // 데모: 미구현 도구는 보유로 처리
  }

  // ─────────────────────────────────────────────────────────
  // 낚시 씬 진입
  // ─────────────────────────────────────────────────────────
  private handleFishingEntry(): void {
    if (this.activeLicensePanel) return;
    if (!this.fishingZoneActive || !this.activeFishingZone) {
      this.showHint('⚠️ 낚시 포인트(노란 원) 근처로 이동하세요!');
      return;
    }

    const point: FishingPoint = {
      id: this.activeFishingZone.id,
      tileX: Math.floor(this.activeFishingZone.x / TILE),
      tileY: Math.floor(this.activeFishingZone.y / TILE),
      label: this.activeFishingZone.label || '낚시 포인트',
      depthM: 8.0,
      possibleSpeciesIds: this.spotInfo.mainSpeciesIds,
      biteBonusMultiplier: 1.2,
    };

    this.dismountBike();   // 낚시 진입 시 자동 하차
    this.cameras.main.fadeOut(250, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.pause('FieldScene');
      this.scene.launch('FishingScene', { point });
    });
  }

  // ─────────────────────────────────────────────────────────
  // E키 상호작용 — 건물 진입
  // ─────────────────────────────────────────────────────────
  private handleInteract(): void {
    if (this.activeLicensePanel) {
      this.toggleLicensePanel();
      return;
    }
    if (this.nearBuilding) {
      const action = this.nearBuilding.action;
      if (this.nearBuilding.id === 'license_office') {
        this.toggleLicensePanel();
      } else if (action === 'toilet') {
        // 화장실 상호작용: 피로도 감소 및 체력 회복
        const fatigue = GameState.player.fatigue;
        const stamina = GameState.player.stamina;
        const newFatigue = Math.max(0, fatigue - 20);
        const newStamina = Math.min(100, stamina + 15);
        GameState.updatePlayer({ fatigue: newFatigue, stamina: newStamina });
        if (this.hud) {
          this.hud.updateHUD();
        }
        this.showPlayerFloatingHint('🚻 화장실에서 세면을 마쳐 피로가 풀렸습니다!');
      } else if (action === 'hanaro_mart') {
        // 하나로마트 상호작용
        this.showPlayerFloatingHint('🛒 하나로마트에서 미끼와 식음료를 가득 구매했습니다!');
      } else if (action === 'convenience') {
        // 편의점 상호작용
        this.showPlayerFloatingHint('🏪 GS25 마트에서 따뜻한 조지아 캔커피를 마셨습니다.');
      } else if (action === 'fish_market') {
        // 어판장 상호작용: 살림망의 모든 물고기 수매
        const livewell = GameState.player.inventory.livewell;
        if (livewell.length > 0) {
          let totalPayout = 0;
          livewell.forEach((fish) => {
            // 고증 경락 단가 계산 엔진 연동
            const evalResult = evaluateFishSellPrice(
              fish.fishSpeciesId,
              fish.lengthCm,
              fish.weightGram
            );
            totalPayout += evalResult.finalPrice;
          });
          
          const newCoins = GameState.player.inventory.coins + totalPayout;
          const newInventory = {
            ...GameState.player.inventory,
            coins: newCoins,
            livewell: [], // 살림망 비우기
          };
          GameState.updatePlayer({ inventory: newInventory });
          if (this.hud) {
            this.hud.updateHUD();
          }
          this.showPlayerFloatingHint(`💰 생선 ${livewell.length}마리 경매 낙찰: +${totalPayout.toLocaleString()}원 획득!`);
        } else {
          this.showPlayerFloatingHint('🐟 어판장에 팔 물고기가 살림망에 없습니다.');
        }
      } else if (action) {
        this.launchSubscene(action);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 액티비티 씬 진입 (라이선스 체크 포함)
  // ─────────────────────────────────────────────────────────
  private startActivity(sceneKey: string): void {
    if (this.openedPanels.length > 0) return;

    let licenseKey: LicenseType | null = null;
    let licenseName = '';

    if (sceneKey === 'NightHuntingScene') {
      licenseKey = 'shore_hunting_basic';
      licenseName = '해루질 입문 허가';
    } else if (sceneKey === 'TrapScene') {
      licenseKey = 'trap_basic';
      licenseName = '통발 조업 기본 면허';
    }

    if (licenseKey && !GameState.hasLicense(licenseKey)) {
      this.cameras.main.flash(200, 150, 0, 0);
      const warn = this.add.text(
        this.cameras.main.scrollX + this.scale.width / 2,
        this.cameras.main.scrollY + this.scale.height / 2,
        `🔒 [${licenseName}] 면허가 필요합니다.\n[L] 라이선스 사무소 이용`,
        {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px',
          color: '#ff6666', backgroundColor: '#000000dd',
          padding: { x: 16, y: 10 }, align: 'center',
        }
      ).setOrigin(0.5).setDepth(100);
      this.time.delayedCall(2200, () => warn.destroy());
      return;
    }

    this.launchSubscene(sceneKey);
  }

  // ─────────────────────────────────────────────────────────
  // 씬 전환 — pause + launch (하위 씬에서 복귀 시 상태 유지)
  // ─────────────────────────────────────────────────────────
  private launchSubscene(sceneKey: string): void {
    this.dismountBike();   // 하위 씬(활동) 진입 시 자동 하차
    this.cameras.main.fadeOut(250, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.pause('FieldScene');
      this.scene.launch(sceneKey);
    });
  }

  // ─────────────────────────────────────────────────────────
  // ESC — LIFO 팝업 패널 닫기 or 월드맵 복귀
  // ─────────────────────────────────────────────────────────
  private handleEsc(): void {
    if (this.openedPanels.length > 0) {
      const lastPanel = this.openedPanels.pop();
      if (lastPanel) {
        if (lastPanel instanceof LicensePanel) {
          this.activeLicensePanel = null;
          lastPanel.destroy();
        } else if (lastPanel instanceof InfoOverlayPanel) {
          lastPanel.close();
        }
      }
      return;
    }
    
    // 열린 팝업창이 모두 없을 때 월드맵 복귀
    this.cameras.main.fadeOut(300, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldMapScene');
    });
  }

  // ─────────────────────────────────────────────────────────
  // 라이선스 패널 토글
  // ─────────────────────────────────────────────────────────
  private toggleLicensePanel(): void {
    if (this.activeLicensePanel) {
      this.activeLicensePanel.close();
    } else {
      this.activeLicensePanel = new LicensePanel(
        this,
        this.scale.width / 2,
        this.scale.height / 2,
        () => {
          if (this.activeLicensePanel) {
            const idx = this.openedPanels.indexOf(this.activeLicensePanel);
            if (idx !== -1) this.openedPanels.splice(idx, 1);
            this.activeLicensePanel = null;
          }
        }
      );
      this.activeLicensePanel.setScrollFactor(0);
      this.add.existing(this.activeLicensePanel);
      this.activeLicensePanel.setDepth(100);
      this.openedPanels.push(this.activeLicensePanel);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 인벤토리 패널 토글 (I 키)
  // ─────────────────────────────────────────────────────────
  private toggleInventoryPanel(): void {
    const idx = this.openedPanels.findIndex(p => p instanceof InfoOverlayPanel && p.name === 'inventory');
    if (idx !== -1) {
      const panel = this.openedPanels.splice(idx, 1)[0];
      if (panel instanceof InfoOverlayPanel) {
        panel.close();
      }
      return;
    }

    const inv = GameState.player.inventory;
    const lines = [
      `💰 보유 코인: ${inv.coins.toLocaleString()} KRW`,
      `🎣 낚싯대: ${inv.rodIds.map(id => id.replace('rod_', '')).join(', ') || '없음'}`,
      ` Reels: ${inv.reelIds.map(id => id.replace('reel_', '')).join(', ') || '없음'}`,
      ``,
      `🎒 소모품 목록:`,
      ...inv.consumables.map(c => {
        return `• ${c.itemId} (${c.quantity}개) [상태: ${c.conditionState}]`;
      }),
      ``,
      `🐟 살림망 보관 물고기: ${inv.livewell.length}마리`
    ];

    const panel = new InfoOverlayPanel(
      this,
      this.scale.width / 2 + 130, // 화면 가운데에서 오른쪽 부근
      this.scale.height / 2,
      '🎒 인벤토리 (Inventory)',
      'inventory',
      lines,
      () => {
        const i = this.openedPanels.indexOf(panel);
        if (i !== -1) this.openedPanels.splice(i, 1);
      }
    );
    panel.name = 'inventory';
    panel.setScrollFactor(0);
    this.add.existing(panel);
    panel.setDepth(110);
    this.openedPanels.push(panel);
  }

  // ─────────────────────────────────────────────────────────
  // 퀘스트 패널 토글 (Q 키)
  // ─────────────────────────────────────────────────────────
  private toggleQuestPanel(): void {
    const idx = this.openedPanels.findIndex(p => p instanceof InfoOverlayPanel && p.name === 'quest');
    if (idx !== -1) {
      const panel = this.openedPanels.splice(idx, 1)[0];
      if (panel instanceof InfoOverlayPanel) {
        panel.close();
      }
      return;
    }

    const completed = Array.from(GameState.completedQuestIds);
    const lines = [
      `🏆 메인 퀘스트:`,
      `• [완료] 첫 캐스팅 연습 (1단계 완료) ${completed.includes('tutorial_cast') ? '✅' : '⬜'}`,
      `• [완료] 첫 캐치앤쿡 요리하기 ${completed.includes('quest_first_catch_and_cook') ? '✅' : '⬜'}`,
      `• [완료] 기본 낚시 라이선스 취득 ${completed.includes('quest_license_angling') ? '✅' : '⬜'}`,
      ``,
      `🌟 서브 퀘스트:`,
      `• 방파제 아래 통발 설치하기 ${completed.includes('sub_trap_place') ? '✅' : '⬜'}`,
      `• 야간 개펄의 전설 (낙지 1마리 획득) ${completed.includes('sub_night_octopus') ? '✅' : '⬜'}`,
    ];

    const panel = new InfoOverlayPanel(
      this,
      this.scale.width / 2, // 화면 중앙 부근
      this.scale.height / 2,
      '🏆 퀘스트 저널 (Quests)',
      'quest',
      lines,
      () => {
        const i = this.openedPanels.indexOf(panel);
        if (i !== -1) this.openedPanels.splice(i, 1);
      }
    );
    panel.name = 'quest';
    panel.setScrollFactor(0);
    this.add.existing(panel);
    panel.setDepth(110);
    this.openedPanels.push(panel);
  }

  // ─────────────────────────────────────────────────────────
  // 스탯 패널 토글 (S 키)
  // ─────────────────────────────────────────────────────────
  private toggleStatPanel(): void {
    const idx = this.openedPanels.findIndex(p => p instanceof InfoOverlayPanel && p.name === 'stat');
    if (idx !== -1) {
      const panel = this.openedPanels.splice(idx, 1)[0];
      if (panel instanceof InfoOverlayPanel) {
        panel.close();
      }
      return;
    }

    const player = GameState.player;
    const level = player.level ?? 1;
    const exp = player.experience ?? 0;
    const nextExp = level * 100;
    const expRatio = ((exp / nextExp) * 100).toFixed(1);

    const lines = [
      `닉네임: ${player.nickname}`,
      `레벨 (Level): Lv. ${level}`,
      `경험치 (Exp): ${exp} / ${nextExp} (${expRatio}%)`,
      `────────────────────────────────`,
      `[기본 스탯]`,
      ` • 체력 (Stamina): ${player.stamina} / 100`,
      ` • 피로도 (Fatigue): ${player.fatigue} / 100`,
      ` • 보유 자금: ${player.inventory.coins.toLocaleString()} G`,
      `────────────────────────────────`,
      `[기술 및 숙련도]`,
      ` • 캐스팅 최대 비거리 보너스: +${level}%`,
      ` • 캐스팅 정확도 보정: +${(level * 1.5).toFixed(1)}%`,
      ` • 누적 조과 기록: ${player.caughtFishHistory.length} 마리`,
      ` • 보유 면허: ${GameState.licenses.filter(l => !l.isExpired).length} 개`
    ];

    const panel = new InfoOverlayPanel(
      this,
      this.scale.width / 2 - 130, // 화면 가운데에서 왼쪽 부근
      this.scale.height / 2,
      '📊 꾼의 능력치 및 기술 (Angler Stats)',
      'stat',
      lines,
      () => {
        const i = this.openedPanels.indexOf(panel);
        if (i !== -1) this.openedPanels.splice(i, 1);
      }
    );
    panel.name = 'stat';
    panel.setScrollFactor(0);
    this.add.existing(panel);
    panel.setDepth(110);
    this.openedPanels.push(panel);
  }

  // ─────────────────────────────────────────────────────────
  // 퀵슬롯 변경 처리
  // ─────────────────────────────────────────────────────────
  private handleQuickslotChange(index: number, updateState = true): void {
    if (updateState) {
      GameState.updatePlayer({ activeQuickslotIndex: index });
      if (this.hud) this.hud.updateQuickslotsVisual();
    }

    const item = [
      { name: '낚싯대', icon: '🎣' },
      { name: '통발', icon: '🕸️' },
      { name: '미끼', icon: '🐛' },
      { name: '빈손', icon: '✋' },
      { name: '아이템 5', icon: '📦' },
      { name: '아이템 6', icon: '📦' },
      { name: '아이템 7', icon: '📦' },
      { name: '아이템 8', icon: '📦' },
    ][index];

    this.showPlayerFloatingHint(`[${item.icon} ${item.name} 장착]`);
  }

  // 플레이어 머리 위 부드러운 텍스트 플로팅 힌트
  private showPlayerFloatingHint(text: string): void {
    if (this.speechBubble) this.speechBubble.destroy();

    const bubble = this.add.container(this.playerBody.x, this.playerBody.y - 45);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.9);
    bg.fillRoundedRect(-60, -12, 120, 24, 3);
    bg.lineStyle(1, 0x4af2a1, 0.8);
    bg.strokeRoundedRect(-60, -12, 120, 24, 3);

    const txt = this.add.text(0, 0, text, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bubble.add([bg, txt]);
    bubble.setDepth(25);

    this.speechBubble = bubble;

    this.tweens.add({
      targets: bubble,
      y: this.playerBody.y - 55,
      alpha: 0,
      duration: 1500,
      onComplete: () => bubble.destroy()
    });
  }

  // ─────────────────────────────────────────────────────────
  // 차지 게이지 UI (낚싯대 장착 슬롯 0 전용)
  // ─────────────────────────────────────────────────────────

  /** 차지 게이지 팝업 생성 (플레이어 위) */
  private showChargeGauge(): void {
    this.hideChargeGauge(); // 기존 게이지 제거

    const { x, y } = this.playerBody;
    const gaugeCont = this.add.container(x, y - 60).setDepth(200);

    // 배경 바
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x0a1628, 0.85);
    bgBar.fillRoundedRect(-41, -8, 82, 16, 3);
    bgBar.lineStyle(1, 0x4af2a1, 0.6);
    bgBar.strokeRoundedRect(-41, -8, 82, 16, 3);

    // 채워지는 바
    const fillBar = this.add.graphics();
    fillBar.name = 'fillBar';
    fillBar.fillStyle(0x4af2a1, 1);
    fillBar.fillRect(-40, -7, 0, 14); // 초기값 0폭

    // 힘 텍스트
    const powerTxt = this.add.text(0, -20, '캐스팅 준비 중...', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#4af2a1',
    }).setOrigin(0.5);

    gaugeCont.add([bgBar, fillBar, powerTxt]);
    this._chargeGaugeContainer = gaugeCont;
  }

  /** 차지 게이지 제거 */
  private hideChargeGauge(): void {
    if (this._chargeGaugeContainer) {
      this._chargeGaugeContainer.destroy();
      this._chargeGaugeContainer = null;
    }
  }

  /**
   * update() 내부에서 호출 — 차지 게이지 값 갱신 및 UI 동기화
   * 게이지는 1초 주기로 0→1→0 왕복하며 정점 타이밍 맞추기 스킬샷
   */
  private updateChargeGauge(delta: number): void {
    if (!this._isCharging) return;

    // 1000ms 왕복
    this._chargeTimer += delta;
    const period = 1000; // ms
    const t = (this._chargeTimer % period) / period; // 0~1
    this._chargeValue = Math.sin(t * Math.PI); // 0→1→0

    if (this._chargeGaugeContainer) {
      // 게이지를 항상 플레이어 위에 따라다님
      this._chargeGaugeContainer.setPosition(this.playerBody.x, this.playerBody.y - 60);

      const fillBar = this._chargeGaugeContainer.getByName('fillBar') as Phaser.GameObjects.Graphics | null;
      if (fillBar) {
        const ratio = this._chargeValue; // 0~1
        const maxW = 80;
        const filledW = ratio * maxW;
        // 색상 변화: 낮으면 녹색 → 높으면 황금
        const r = Math.floor(74 + (255 - 74) * ratio);
        const g = Math.floor(242 - (242 - 180) * ratio);
        const b = Math.floor(161 * (1 - ratio));
        const col = (r << 16) | (g << 8) | b;
        fillBar.clear();
        fillBar.fillStyle(col, 1);
        fillBar.fillRect(-40, -7, filledW, 14);
      }
    }
  }

  /**
   * 캐스팅 실행 (power: 0~1)
   * 낚시 포인트에 있다면 FishingScene 진입 (차지 파워 전달)
   */
  private handleCast(power: number, _targetX: number, _targetY: number): void {
    if (!this.fishingZoneActive) {
      this.showPlayerFloatingHint(`🎣 낚시 포인트로 이동 후 캐스팅하세요!`);
      return;
    }
    const pct = Math.round(power * 100);
    this.showPlayerFloatingHint(`🎣 캐스팅! 파워 ${pct}%`);
    // 낚시 씬 진입 — 파워 데이터 전달 (FishingScene에서 activeFishingZone 기반)
    this.time.delayedCall(300, () => {
      const point = (this.activeFishingZone as Zone & { action?: string }) as { id?: string };
      this.cameras.main.fadeOut(250, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.pause('FieldScene');
        this.scene.launch('FishingScene', { point, castPower: power });
      });
    });
  }
}
