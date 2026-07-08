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
import { getSpotById, SPOT_DATABASE, LicenseType } from '@tra/core';
import { HUD } from '../ui/HUD.js';
import { MiniMap } from '../ui/MiniMap.js';
import { LicensePanel } from '../ui/LicensePanel.js';
import { InfoOverlayPanel } from '../ui/InfoOverlayPanel.js';

// 월드 크기 (중형 — 방파제+마을+갯벌 포함)
const WORLD_W = 2048;
const WORLD_H = 1536;
const TILE = 16; // 픽셀 타일 크기

// 구역 정의
interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  alpha: number;
  action?: string;  // 씬 키 or 'fishing'
  hint?: string;
  licenseKey?: string;
  licenseName?: string;
}

const ZONES: Zone[] = [
  // 깊은 바다 (상단)
  { id: 'deep_sea', label: '심해', x: 0, y: 0, w: WORLD_W, h: 300, color: 0x0a1e3d, alpha: 1, hint: '' },
  // 외항 낚시 구역
  { id: 'fishing_outer', label: '외항 수중여', x: 100, y: 270, w: 300, h: 60,
    color: 0x0e3a6e, alpha: 0.9, action: 'fishing', hint: '[SPACE] 캐스팅 시작' },
  { id: 'fishing_mid',   label: '조류 회전구간', x: 480, y: 270, w: 280, h: 60,
    color: 0x0e3a6e, alpha: 0.9, action: 'fishing', hint: '[SPACE] 캐스팅 시작' },
  { id: 'fishing_inner', label: '내항 끝자리', x: 850, y: 270, w: 280, h: 60,
    color: 0x0e3a6e, alpha: 0.9, action: 'fishing', hint: '[SPACE] 캐스팅 시작' },
  // 통발 수역 (외항 왼쪽)
  { id: 'trap_zone', label: '통발 수역', x: 1200, y: 200, w: 350, h: 130,
    color: 0x0d2940, alpha: 0.9, action: 'TrapScene', hint: '[T] 통발 관리',
    licenseKey: 'trap_basic', licenseName: '통발 조업 기본 면허' },
  // 방파제 (수평 띠)
  { id: 'breakwater', label: '방파제', x: 0, y: 330, w: WORLD_W, h: 80, color: 0x2c3a4a, alpha: 1 },
  // 마을 구역 (방파제 아래)
  { id: 'town', label: '마을', x: 0, y: 410, w: WORLD_W, h: 800, color: 0x1a2a1a, alpha: 1 },
  // 갯벌 구역 (마을 오른쪽 하단)
  { id: 'tidal_flat', label: '갯벌', x: 1400, y: 700, w: 600, h: 500,
    color: 0x2a3a1e, alpha: 1, action: 'NightHuntingScene', hint: '[H] 해루질 시작',
    licenseKey: 'shore_hunting_basic', licenseName: '해루질 입문 허가' },
];

// 건물 정의
interface Building {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  doorColor: number;
  action?: string;  // 씬 키
  hint?: string;
}

const BUILDINGS: Building[] = [
  { id: 'tackle_shop', label: '대박낚시점', sublabel: '장비/미끼', x: 200, y: 450,  w: 120, h: 90,
    color: 0x1a4a20, doorColor: 0x4a8a50, action: 'TackleRoomScene', hint: '[E] 장비/미끼 구매' },
  { id: 'convenience', label: 'GS25 마트', sublabel: '소모품 판매', x: 400, y: 450, w: 110, h: 90,
    color: 0x8a3010, doorColor: 0xcc5522, hint: '[E] 소모품 구매' },
  { id: 'restaurant',  label: '내 식당',   sublabel: '캐치앤쿡', x: 650, y: 460,   w: 130, h: 90,
    color: 0x1a3a5a, doorColor: 0x3a6a9a, action: 'CookScene', hint: '[E] 요리/메뉴 등록' },
  { id: 'license_office', label: '낚시면허 사무소', sublabel: '면허 발급', x: 900, y: 450, w: 150, h: 90,
    color: 0x3a2a0a, doorColor: 0x8a6a1a, hint: '[E] 면허 발급' },
  { id: 'condo',       label: '민박집',   sublabel: '쉬기 / 저장', x: 1100, y: 455, w: 120, h: 85,
    color: 0x4a2a2a, doorColor: 0x8a4a4a, action: 'CondoScene', hint: '[E] 숙박 / 세이브' },
  { id: 'fish_market', label: '어판장',   sublabel: '즉시 판매', x: 1300, y: 450, w: 120, h: 90,
    color: 0x0a3a3a, doorColor: 0x1a7a7a, hint: '[E] 어획물 판매' },
];

export class FieldScene extends Phaser.Scene {
  // 플레이어
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';

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

  // 마우스 이동 대상 좌표
  private targetX: number | null = null;
  private targetY: number | null = null;
  private isMovingToTarget = false;

  // 플레이어 머리 위 활성화 말풍선
  private speechBubble?: Phaser.GameObjects.Container;

  // 상호작용 힌트
  private interactHint!: Phaser.GameObjects.Container;
  private interactHintText!: Phaser.GameObjects.Text;
  private nearBuilding: Building | null = null;

  // 낚시 포인트 오버랩 감지
  private fishingZoneActive = false;

  constructor() {
    super({ key: 'FieldScene' });
  }

  init(data?: { spotId?: string }): void {
    const spotId = data?.spotId || GameState.currentSpotId || 'geoje_gujora_breakwater';
    const spot = getSpotById(spotId);
    if (spot) {
      this.spotInfo = spot;
      GameState.setCurrentSpot(spotId);
    }
  }

  create(): void {
    // 월드 바운드 설정
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ─── 배경 월드 그리기 ───
    this.drawWorld();

    // ─── 물리 바디용 보이지 않는 이미지 (카메라 타겟) ───
    this.playerBody = this.physics.add.image(
      WORLD_W / 2, 400, '__DEFAULT'
    ) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(20, 20);

    // ─── 플레이어 픽셀 그래픽 (Graphics로 직접 그림) ───
    this.player = this.add.graphics();
    this.player.setDepth(20);
    this.drawPlayerSprite('down');

    // ─── 카메라: 플레이어 팔로우 ───
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
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

    // 퀵슬롯 단축키 1 ~ 8 등록
    for (let i = 0; i < 8; i++) {
      this.input.keyboard!.on(`keydown-${i + 1}`, () => this.handleQuickslotChange(i));
    }

    // 마우스 클릭 이동 등록
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.openedPanels.length > 0) return;
      // HUD 및 퀵바 영역(하단 80px 내)은 클릭 이동에서 제외
      if (pointer.y > this.scale.height - 80 || (pointer.x < 240 && pointer.y < 120)) {
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.targetX = worldPoint.x;
      this.targetY = worldPoint.y;
      this.isMovingToTarget = true;
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

    // ─── 하위 씬 복귀 이벤트 ───
    this.events.on('resume', () => {
      this.cameras.main.fadeIn(300, 0, 10, 20);
    });

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  update(): void {
    if (!this.playerBody) return;

    const speed = 200;
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
      // 키보드 조작 시 마우스 이동 목표 취소
      this.isMovingToTarget = false;
      this.targetX = null;
      this.targetY = null;

      if (left)  { vx = -speed; this.playerFacing = 'left'; }
      if (right) { vx =  speed; this.playerFacing = 'right'; }
      if (up)    { vy = -speed; this.playerFacing = 'up'; }
      if (down)  { vy =  speed; this.playerFacing = 'down'; }
    } else if (this.isMovingToTarget && this.targetX !== null && this.targetY !== null) {
      // 마우스 클릭 자동 이동 처리
      const dist = Phaser.Math.Distance.Between(this.playerBody.x, this.playerBody.y, this.targetX, this.targetY);
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.playerBody.x, this.playerBody.y, this.targetX, this.targetY);
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;

        const deg = Phaser.Math.RadToDeg(angle);
        if (deg >= -45 && deg < 45) this.playerFacing = 'right';
        else if (deg >= 45 && deg < 135) this.playerFacing = 'down';
        else if (deg >= 135 || deg < -135) this.playerFacing = 'left';
        else this.playerFacing = 'up';
      } else {
        this.isMovingToTarget = false;
        this.targetX = null;
        this.targetY = null;
      }
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

    // 플레이어 그래픽 동기화
    this.player.setPosition(this.playerBody.x, this.playerBody.y);
    this.drawPlayerSprite(this.playerFacing);

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

    // 구역/건물 근접 감지
    this.checkProximity();
  }

  // ─────────────────────────────────────────────────────────
  // 월드 그리기
  // ─────────────────────────────────────────────────────────
  private drawWorld(): void {
    // 각 구역 배경
    ZONES.forEach((zone) => {
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
    for (let x = 0; x <= WORLD_W; x += TILE) {
      grid.moveTo(x, 0).lineTo(x, WORLD_H);
    }
    for (let y = 0; y <= WORLD_H; y += TILE) {
      grid.moveTo(0, y).lineTo(WORLD_W, y);
    }
    grid.strokePath();

    // 방파제 테트라포드 (방파제 상단 경계)
    const tetra = this.add.graphics().setDepth(2);
    tetra.fillStyle(0x1a2530, 1);
    for (let i = 0; i < Math.floor(WORLD_W / 40); i++) {
      const tx = i * 40 + 4;
      const ty = 330;
      tetra.fillTriangle(tx, ty + 18, tx + 14, ty - 4, tx + 28, ty + 18);
    }

    // 낚시 포인트 표시 (글로우 원)
    const fishG = this.add.graphics().setDepth(3);
    ZONES.filter((z) => z.action === 'fishing').forEach((zone) => {
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
    const trapZone = ZONES.find((z) => z.id === 'trap_zone');
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
    const flatZone = ZONES.find((z) => z.id === 'tidal_flat');
    if (flatZone) {
      const fg = this.add.graphics().setDepth(1);
      fg.fillStyle(0x3a4a2a, 0.7);
      for (let xi = flatZone.x; xi < flatZone.x + flatZone.w; xi += 12) {
        for (let yi = flatZone.y; yi < flatZone.y + flatZone.h; yi += 12) {
          if ((xi + yi) % 24 === 0) fg.fillRect(xi, yi, 4, 4);
        }
      }
      this.add.text(flatZone.x + 20, flatZone.y + 10, '갯벌 구역', {
        fontFamily: 'monospace', fontSize: '13px', color: '#88cc88',
      }).setDepth(3);
    }

    // 건물 그리기
    BUILDINGS.forEach((b) => {
      const bg = this.add.graphics().setDepth(5);
      // 건물 본체
      bg.fillStyle(b.color, 1);
      bg.fillRect(b.x, b.y, b.w, b.h);
      // 지붕 (상단 20%)
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
    border.strokeRect(0, 0, WORLD_W, WORLD_H);

    // 스팟 이름 (상단 좌측)
    this.add.text(20, 10, `📍 ${this.spotInfo.name}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px',
      color: '#4af2a1', fontStyle: 'bold',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setDepth(5);
  }

  // ─────────────────────────────────────────────────────────
  // 플레이어 픽셀 스프라이트 (Graphics로 직접 그림)
  // ─────────────────────────────────────────────────────────
  private drawPlayerSprite(facing: 'up' | 'down' | 'left' | 'right'): void {
    this.player.clear();

    const px = 0;
    const py = -16; // 발 기준 중심

    // 그림자
    this.player.fillStyle(0x000000, 0.3);
    this.player.fillEllipse(px, py + 26, 20, 8);

    // 신발
    this.player.fillStyle(0x222222, 1);
    if (facing === 'down' || facing === 'up') {
      this.player.fillRect(px - 6, py + 20, 5, 6);
      this.player.fillRect(px + 2, py + 20, 5, 6);
    } else {
      this.player.fillRect(px - 4, py + 20, 9, 6);
    }

    // 하의 (바지)
    this.player.fillStyle(0x1a3a6a, 1);
    this.player.fillRect(px - 5, py + 12, 10, 10);

    // 상의 (조끼/점퍼)
    const bodyColor = facing === 'up' ? 0x2a5a3a : 0x2d5a8e;
    this.player.fillStyle(bodyColor, 1);
    this.player.fillRect(px - 6, py + 2, 12, 12);

    // 팔
    this.player.fillStyle(0x2a4a6a, 1);
    if (facing !== 'left')  this.player.fillRect(px - 9, py + 3, 4, 8);
    if (facing !== 'right') this.player.fillRect(px + 5, py + 3, 4, 8);

    // 목
    this.player.fillStyle(0xd4906a, 1);
    this.player.fillRect(px - 2, py - 1, 4, 4);

    // 머리 (얼굴)
    this.player.fillStyle(0xd4906a, 1);
    this.player.fillRect(px - 5, py - 10, 10, 10);
    if (facing === 'down') {
      // 눈
      this.player.fillStyle(0x111111, 1);
      this.player.fillRect(px - 3, py - 6, 2, 2);
      this.player.fillRect(px + 1, py - 6, 2, 2);
    }

    // 모자 (낚시용 버킷햇)
    this.player.fillStyle(0x3a5a3a, 1);
    this.player.fillRect(px - 7, py - 12, 14, 3);
    this.player.fillRect(px - 4, py - 18, 8, 7);

    // 낚싯대 (오른쪽에 지참)
    if (facing !== 'left') {
      this.player.lineStyle(2, 0xc8a060, 1);
      this.player.beginPath();
      this.player.moveTo(px + 6, py + 2);
      this.player.lineTo(px + 22, py - 20);
      this.player.strokePath();
    }
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
    for (const b of BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dist = Phaser.Math.Distance.Between(px, py, cx, cy);
      if (dist < interactRadius + b.w / 2) {
        nearB = b;
        break;
      }
    }

    // 구역(활동) 근접 감지 (낚시 포인트 등)
    // 설계 방향: 구글 대한민국 지도 연동 베이스 하에, 아래와 같은 특정 랜드타일 내에서만 해당 액티비티들이 수행될 수 있도록 제안됩니다.
    let nearZ: Zone | null = null;
    for (const z of ZONES) {
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

    if (nearB?.hint) {
      this.showHint(nearB.hint);
      this.fishingZoneActive = false;
    } else if (nearZ) {
      this.showHint(nearZ.hint ?? '');
      this.fishingZoneActive = true;
    } else {
      this.hideHint();
      this.fishingZoneActive = false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 낚시 씬 진입
  // ─────────────────────────────────────────────────────────
  private handleFishingEntry(): void {
    if (this.activeLicensePanel) return;
    if (!this.fishingZoneActive) {
      // 낚시 포인트 근처 아니어도 임시 허용 (데모용)
      this.showHint('⚠️ 낚시 포인트(노란 원) 근처로 이동하세요!');
      return;
    }
    this.launchSubscene('FishingScene');
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
      if (this.nearBuilding.id === 'license_office') {
        this.toggleLicensePanel();
      } else if (this.nearBuilding.action) {
        this.launchSubscene(this.nearBuilding.action);
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
      const idx = this.openedPanels.indexOf(this.activeLicensePanel);
      if (idx !== -1) this.openedPanels.splice(idx, 1);
      this.activeLicensePanel.destroy();
      this.activeLicensePanel = null;
    } else {
      const camX = this.cameras.main.scrollX;
      const camY = this.cameras.main.scrollY;
      this.activeLicensePanel = new LicensePanel(
        this,
        camX + this.scale.width / 2,
        camY + this.scale.height / 2
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
      ...inv.consumables.map(c => `• ${c.name} (${c.quantity}개)`),
      ``,
      `🐟 살림망 보관 물고기: ${inv.livewell.length}마리`
    ];

    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;
    const panel = new InfoOverlayPanel(
      this,
      camX + this.scale.width / 2,
      camY + this.scale.height / 2,
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

    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;
    const panel = new InfoOverlayPanel(
      this,
      camX + this.scale.width / 2,
      camY + this.scale.height / 2,
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
}
