/**
 * @file HomeInteriorScene.ts
 * @description 집 실내 (Tier 0 소형 원룸) — 침대 저장★ · 문→홈타운 외부
 *
 * HOMETOWN_HOME_SPEC (2026-07-28):
 *  - 시작 사이즈 Tier 0: 원룸 12×10 타일 (hometown_interior_mockup.svg 레이아웃).
 *    침대(저장★)+협탁 / 냉장고 / 아일랜드 테이블+의자 / 소파 / 러그(+고양이) /
 *    서랍장 / 수납 선반 / 화분 / 하단 문(→외부). 주방·지하실·2층은 HouseTier 확장(후속).
 *  - **저장은 이 씬의 침대에서만** — GameState.locationTag = 'hometown_interior'
 *    (TUNING.save.allowedTags). "저장하고 쉬기" / "그냥 쉬기" 선택.
 *  - 가구는 MapObject 인스턴스 스키마(이동/제거/배치 스탠바이) — 이번 단계는 정적 렌더.
 *  - 진입: RegionFieldScene 문 → pause + launch. 복귀: stop() + resume (규칙 준수).
 */

import Phaser from 'phaser';
import { MapObject } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { GameState } from '../store/GameState.js';
import { FridgePanel } from '../ui/FridgePanel.js';
import { fadeOutThen } from './SceneFade.js';

/** 실내 타일 렌더 크기 (px) — 외부(20px)보다 큼직하게 */
const IT = 48;
const ROOM_W = 12, ROOM_H = 10;
const OX = (GAME_WIDTH - ROOM_W * IT) / 2;
const OY = (GAME_HEIGHT - ROOM_H * IT) / 2 + 10;

/**
 * Tier 0 가구 초기 배치 (MapObject 스키마 — 추후 이동/배치 시스템과 호환).
 * 좌측 상단 = 주방(냉장고·싱크대·조리대). 침대(우상 저장★). 하단 문.
 */
const INTERIOR_OBJECTS: MapObject[] = [
  // ── 주방 (좌측 상단 코너) ──
  { instanceId: 'fridge',   type: 'furniture', tx: 0,  ty: 2, fw: 1, fh: 2, collides: true,  interact: 'storage', movable: true, removable: false },
  { instanceId: 'sink',     type: 'furniture', tx: 1,  ty: 2, fw: 1, fh: 1, collides: true,  interact: 'cook',    movable: true, removable: false },
  { instanceId: 'stove',    type: 'furniture', tx: 2,  ty: 2, fw: 2, fh: 1, collides: true,  interact: 'cook',    movable: true, removable: false },
  // ── 거실/침실 ──
  { instanceId: 'bed',      type: 'furniture', tx: 9,  ty: 2, fw: 2, fh: 3, collides: true,  interact: 'save',    movable: true,  removable: false },
  { instanceId: 'stand',    type: 'furniture', tx: 11, ty: 2, fw: 1, fh: 1, collides: true,  movable: true, removable: false },
  { instanceId: 'island',   type: 'furniture', tx: 5,  ty: 3, fw: 3, fh: 1, collides: true,  movable: true, removable: false },
  { instanceId: 'sofa',     type: 'furniture', tx: 2,  ty: 6, fw: 1, fh: 2, collides: true,  movable: true, removable: false },
  { instanceId: 'rug',      type: 'furniture', tx: 5,  ty: 5, fw: 3, fh: 2, collides: false, movable: true, removable: false },
  { instanceId: 'drawer',   type: 'furniture', tx: 11, ty: 6, fw: 1, fh: 2, collides: true,  movable: true, removable: false },
  { instanceId: 'shelf',    type: 'furniture', tx: 0,  ty: 7, fw: 2, fh: 1, collides: true,  interact: 'storage', movable: true,  removable: false },
  { instanceId: 'plant',    type: 'furniture', tx: 4,  ty: 8, fw: 1, fh: 1, collides: true,  movable: true, removable: false },
  { instanceId: 'door_out', type: 'door',      tx: 5,  ty: 9, fw: 2, fh: 1, collides: false, interact: 'door', movable: false, removable: false },
];

/** 실내 캐릭터 표시 높이 (px) — 실내 타일(48px)에 맞춰 큼직하게 */
const PLAYER_H = 56;
/** man 스프라이트 하단 투명 여백 보정 — 발이 그림자에 닿도록 스프라이트만 아래로 (RegionFieldScene와 동일 패턴) */
const PLAYER_FOOT_SINK = 6;

export class HomeInteriorScene extends Phaser.Scene {
  /** 위치 판정용 논리 좌표 (스프라이트 발밑) */
  private px = 0;
  private py = 0;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private facing: 'front' | 'back' | 'left' | 'right' = 'front';
  private walkFrame = 1;
  private walkTimer = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private hintText!: Phaser.GameObjects.Text;
  private bedMenu?: Phaser.GameObjects.Container;
  private fridgePanel?: FridgePanel;
  private nearObj: MapObject | null = null;

  constructor() {
    super({ key: 'HomeInteriorScene' });
  }

  create(): void {
    // 저장 정책의 유일한 허용 위치 — 침대 상호작용 지점 (HOMETOWN_HOME_SPEC §4)
    GameState.locationTag = 'hometown_interior';
    this.cameras.main.fadeIn(300, 0, 10, 20);
    this.bedMenu = undefined;
    this.fridgePanel = undefined;
    this.nearObj = null;

    this.drawRoom();
    this.drawFurniture();

    // 플레이어 (문 앞 스폰) — 실제 캐릭터 스프라이트 (RegionFieldScene와 동일 에셋)
    this.px = OX + 6 * IT; this.py = OY + 8.4 * IT;
    this.playerShadow = this.add.ellipse(this.px, this.py, PLAYER_H * 0.42, PLAYER_H * 0.12, 0x000000, 0.28).setDepth(18);
    this.playerSprite = this.add.image(this.px, this.py + PLAYER_FOOT_SINK, 'man-idle-front').setOrigin(0.5, 1).setDepth(20);
    this.applySpriteSize();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-E', () => this.tryInteract());
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.fridgePanel) { this.closeFridge(); return; }
      if (this.bedMenu) { this.closeBedMenu(); return; }
      this.exitToField();
    });

    this.hintText = this.add.text(this.px, this.py - 40, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setDepth(30).setVisible(false);

    this.add.text(GAME_WIDTH / 2, OY - 28, '집 (Tier 0 원룸) — 침대에서 저장 · 문으로 나가기 (ESC)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#8faabf',
    }).setOrigin(0.5);
  }

  // ── 렌더 ─────────────────────────────────────────────

  private drawRoom(): void {
    const g = this.add.graphics().setDepth(1);
    // 외벽 프레임
    g.fillStyle(0x4a3222, 1);
    g.fillRoundedRect(OX - 18, OY - 18, ROOM_W * IT + 36, ROOM_H * IT + 36, 8);
    // 바닥 (나무 플랭크)
    g.fillStyle(0xc9963f, 1);
    g.fillRect(OX, OY, ROOM_W * IT, ROOM_H * IT);
    g.lineStyle(1, 0xa87b2e, 0.7);
    for (let r = 1; r < ROOM_H; r++) g.lineBetween(OX, OY + r * IT, OX + ROOM_W * IT, OY + r * IT);
    for (let c = 1; c < ROOM_W; c++) g.lineBetween(OX + c * IT, OY, OX + c * IT, OY + ROOM_H * IT);
    // 상단 벽 밴드 (시계·선반)
    g.fillStyle(0x8a5a32, 1);
    g.fillRect(OX, OY, ROOM_W * IT, IT * 1.4);
    // 시계
    g.fillStyle(0xf2e2b8, 1); g.fillCircle(OX + IT * 1.4, OY + IT * 0.7, 14);
    g.lineStyle(2, 0x4a3222, 1); g.strokeCircle(OX + IT * 1.4, OY + IT * 0.7, 14);
    g.lineBetween(OX + IT * 1.4, OY + IT * 0.7, OX + IT * 1.4, OY + IT * 0.45);
    g.lineBetween(OX + IT * 1.4, OY + IT * 0.7, OX + IT * 1.62, OY + IT * 0.7);
    // 벽 선반 + 책
    g.fillStyle(0x6a4a2c, 1); g.fillRect(OX + IT * 4, OY + IT * 0.55, IT * 2.4, 8);
    const bookCols = [0xb04a3a, 0x3a6ea5, 0x3f9e63];
    bookCols.forEach((col, i) => {
      g.fillStyle(col, 1); g.fillRect(OX + IT * (4.2 + i * 0.5), OY + IT * 0.2, 14, IT * 0.35);
    });
    // 지하실 계단 자리 예약 (Tier 2 — 좌하단 점선)
    g.lineStyle(1.5, 0x2a5a8a, 0.8);
    this.dashedRect(g, OX + IT * 0.15, OY + IT * 8.15, IT * 1.7, IT * 1.7);
    this.add.text(OX + IT, OY + IT * 9, '지하실 (확장 예약)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#5a7d9a',
    }).setOrigin(0.5).setDepth(2);
    // 평수 확장 방향 (Tier 1 — 우측 벽 화살표)
    this.add.text(OX + ROOM_W * IT + 4, OY + ROOM_H * IT / 2, '▶\n평수\n확장', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#5a7d9a', align: 'center',
    }).setOrigin(0, 0.5).setDepth(2);
  }

  private dashedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    const seg = 6;
    for (let dx = 0; dx < w; dx += seg * 2) { g.lineBetween(x + dx, y, x + Math.min(dx + seg, w), y); g.lineBetween(x + dx, y + h, x + Math.min(dx + seg, w), y + h); }
    for (let dy = 0; dy < h; dy += seg * 2) { g.lineBetween(x, y + dy, x, y + Math.min(dy + seg, h)); g.lineBetween(x + w, y + dy, x + w, y + Math.min(dy + seg, h)); }
  }

  private drawFurniture(): void {
    const g = this.add.graphics().setDepth(10);
    for (const o of INTERIOR_OBJECTS) {
      const x = OX + o.tx * IT, y = OY + o.ty * IT;
      const w = (o.fw ?? 1) * IT, h = (o.fh ?? 1) * IT;
      switch (o.instanceId) {
        case 'bed': {
          g.fillStyle(0x8a3a34, 1); g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 6);      // 매트리스
          g.fillStyle(0xf2e2c8, 1); g.fillRoundedRect(x + 8, y + 8, w - 16, IT * 0.6, 4);  // 베개
          g.fillStyle(0x3a6ea5, 1); g.fillRect(x + 4, y + h - 18, w - 8, 12);              // 이불단
          this.add.text(x + w / 2, y - 6, '저장★ 침대', {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#4af2a1', fontStyle: 'bold',
            backgroundColor: '#0d2a1acc', padding: { x: 4, y: 1 },
          }).setOrigin(0.5, 1).setDepth(11);
          break;
        }
        case 'fridge':
          g.fillStyle(0xe8e8e4, 1); g.fillRoundedRect(x + 6, y + 4, w - 12, h - 8, 4);
          g.fillStyle(0xb8b8b0, 1); g.fillRect(x + 8, y + h * 0.42, w - 16, 3);
          g.fillStyle(0x9aa6b0, 1); g.fillRect(x + w - 14, y + 12, 3, 10);         // 손잡이
          break;
        case 'sink':
          g.fillStyle(0xcfd4d8, 1); g.fillRoundedRect(x + 4, y + 6, w - 8, h - 10, 4);   // 상판
          g.fillStyle(0x6a7580, 1); g.fillRoundedRect(x + 10, y + 12, w - 20, h - 22, 3); // 개수대
          g.fillStyle(0x9aa6b0, 1); g.fillRect(x + w / 2 - 1, y + 6, 2, 8);              // 수도꼭지 목
          g.fillCircle(x + w / 2, y + 6, 3);
          break;
        case 'stove': {
          g.fillStyle(0x3a3f45, 1); g.fillRoundedRect(x + 4, y + 6, w - 8, h - 10, 4);   // 상판(레인지)
          g.fillStyle(0x2a2e33, 1);                                                       // 버너 2구
          g.fillCircle(x + w * 0.3, y + h * 0.5, 9); g.fillCircle(x + w * 0.7, y + h * 0.5, 9);
          g.fillStyle(0xff7a3a, 0.9);                                                      // 불꽃 포인트
          g.fillCircle(x + w * 0.3, y + h * 0.5, 3); g.fillCircle(x + w * 0.7, y + h * 0.5, 3);
          break;
        }
        case 'island':
          g.fillStyle(0xd8b98a, 1); g.fillRoundedRect(x + 4, y + 8, w - 8, h - 16, 8);
          g.fillStyle(0x8a6a44, 1);                                                        // 의자 2
          g.fillCircle(x + w * 0.3, y + h + 10, 9); g.fillCircle(x + w * 0.7, y + h + 10, 9);
          break;
        case 'sofa':
          g.fillStyle(0x7a4a8a, 1); g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);
          g.fillStyle(0x9a6aaa, 1); g.fillRoundedRect(x + 8, y + 10, w - 16, h * 0.32, 6);
          break;
        case 'rug': {
          g.fillStyle(0x3f7d54, 1); g.fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 10);
          g.lineStyle(2, 0x2e5e3e, 1); g.strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 8);
          // 고양이
          g.fillStyle(0xd88a3a, 1); g.fillEllipse(x + w / 2, y + h / 2, 26, 14);
          g.fillCircle(x + w / 2 + 14, y + h / 2 - 4, 7);
          break;
        }
        case 'drawer':
          g.fillStyle(0x6a4a2c, 1); g.fillRoundedRect(x + 6, y + 4, w - 12, h - 8, 4);
          g.fillStyle(0x8a6a44, 1); g.fillRect(x + 10, y + h * 0.3, w - 20, 4); g.fillRect(x + 10, y + h * 0.62, w - 20, 4);
          g.fillStyle(0xffe28a, 0.9); g.fillCircle(x + w / 2, y + 2, 6);                    // 램프
          break;
        case 'shelf':
          g.fillStyle(0x5a3a22, 1); g.fillRoundedRect(x + 4, y + 6, w - 8, h - 12, 4);
          g.fillStyle(0x7a5232, 1); g.fillRect(x + 8, y + h * 0.45, w - 16, 4);
          break;
        case 'plant':
          g.fillStyle(0xb06a3b, 1); g.fillRect(x + IT * 0.32, y + IT * 0.55, IT * 0.36, IT * 0.3);
          g.fillStyle(0x3b8a42, 1); g.fillCircle(x + IT * 0.5, y + IT * 0.38, 12);
          break;
        case 'stand':
          g.fillStyle(0x6a4a2c, 1); g.fillRoundedRect(x + 8, y + 10, w - 16, h - 20, 4);
          break;
        case 'door_out': {
          g.fillStyle(0x5a3a22, 1); g.fillRect(x + 8, y + IT * 0.3, w - 16, IT * 0.7);
          this.add.text(x + w / 2, y + h + 4, '문 → 홈타운 외부', {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffce9a',
          }).setOrigin(0.5, 0).setDepth(11);
          break;
        }
      }
    }
    // 주방 라벨 (냉장고~조리대 상단)
    this.add.text(OX + IT * 2, OY + IT * 1.85, '주방', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffd9a0', fontStyle: 'bold',
      backgroundColor: '#2a1a0acc', padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 1).setDepth(11);
  }

  // ── 이동/충돌 (간이 AABB — 물리 미사용) ──────────────

  update(_t: number, delta: number): void {
    if (this.bedMenu || this.fridgePanel) { this.updateWalkTexture(false); return; }   // 메뉴/패널 열림 중 이동 정지
    const spd = 0.18 * delta;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown) { dx = -spd; this.facing = 'left'; }
    else if (this.cursors.right.isDown) { dx = spd; this.facing = 'right'; }
    if (this.cursors.up.isDown) { dy = -spd; this.facing = 'back'; }
    else if (this.cursors.down.isDown) { dy = spd; this.facing = 'front'; }
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    if (!this.collides(this.px + dx, this.py)) this.px += dx;
    if (!this.collides(this.px, this.py + dy)) this.py += dy;

    this.playerSprite.setPosition(this.px, this.py + PLAYER_FOOT_SINK).setDepth(20 + this.py * 0.001);
    this.playerShadow.setPosition(this.px, this.py);
    this.updateWalkTexture(dx !== 0 || dy !== 0);
    this.updateProximity();
  }

  private applySpriteSize(): void {
    const src = this.playerSprite.texture.getSourceImage() as HTMLImageElement;
    if (!src || !src.height) return;
    this.playerSprite.setDisplaySize(PLAYER_H * (src.width / src.height), PLAYER_H);
  }

  /** 방향/이동 상태에 맞춰 스프라이트 텍스처 교체 (2프레임 200ms 걷기) */
  private updateWalkTexture(moving: boolean): void {
    let key: string;
    if (!moving) { key = `man-idle-${this.facing}`; this.walkTimer = 0; this.walkFrame = 1; }
    else {
      this.walkTimer += this.game.loop.delta;
      if (this.walkTimer >= 200) { this.walkTimer = 0; this.walkFrame = this.walkFrame === 1 ? 2 : 1; }
      key = `man-move-${this.facing}-${this.walkFrame}`;
    }
    if (this.playerSprite.texture.key !== key) {
      this.playerSprite.setTexture(key);
      this.applySpriteSize();
    }
  }

  private collides(px: number, py: number): boolean {
    // 방 경계 (상단 벽 밴드 아래부터. py = 발밑)
    if (px < OX + 12 || px > OX + ROOM_W * IT - 12) return true;
    if (py < OY + IT * 2.0 || py > OY + ROOM_H * IT - 6) return true;
    // 가구 AABB (발밑 기준 — 발이 가구 앞면에 닿으면 정지)
    for (const o of INTERIOR_OBJECTS) {
      if (!o.collides) continue;
      const x = OX + o.tx * IT, y = OY + o.ty * IT;
      const w = (o.fw ?? 1) * IT, h = (o.fh ?? 1) * IT;
      if (px > x - 8 && px < x + w + 8 && py > y + 8 && py < y + h + 12) return true;
    }
    return false;
  }

  private updateProximity(): void {
    let nearest: MapObject | null = null;
    let best = 62;
    for (const o of INTERIOR_OBJECTS) {
      if (!o.interact || o.interact === 'none') continue;
      const cx = OX + o.tx * IT + ((o.fw ?? 1) * IT) / 2;
      const cy = OY + o.ty * IT + ((o.fh ?? 1) * IT) / 2;
      const d = Math.hypot(cx - this.px, cy - this.py);
      if (d < best + Math.max(o.fw ?? 1, o.fh ?? 1) * IT * 0.4) { best = d; nearest = o; }
    }
    this.nearObj = nearest;
    if (nearest) {
      const label = nearest.interact === 'save' ? '[E] 침대 — 저장하고 쉬기'
        : nearest.interact === 'door' ? '[E] 나가기'
        : nearest.interact === 'cook' ? '[E] 주방 (요리 준비중)'
        : nearest.instanceId === 'fridge' ? '[E] 냉장고 열기'
        : '[E] 수납 (추후)';
      this.hintText.setText(label).setPosition(this.px, this.py - PLAYER_H - 6).setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private tryInteract(): void {
    if (this.bedMenu || this.fridgePanel || !this.nearObj) return;
    switch (this.nearObj.interact) {
      case 'save': this.openBedMenu(); break;
      case 'door': this.exitToField(); break;
      case 'cook': this.flash('주방 조리는 준비 중입니다 (요리는 U 창의 도마 — 추후 실내 연결)'); break;
      case 'storage':
        if (this.nearObj.instanceId === 'fridge') this.openFridge();
        else this.flash('수납은 추후 구현됩니다');
        break;
      default: break;
    }
  }

  // ── 냉장고 (냉동고 8칸 + 냉장고 16칸) ─────────────────
  private openFridge(): void {
    if (this.fridgePanel) return;
    const panel = new FridgePanel(this, GAME_WIDTH / 2 - 290, 60, () => this.closeFridge());
    this.add.existing(panel);
    this.fridgePanel = panel;
  }

  private closeFridge(): void {
    this.fridgePanel?.destroy();
    this.fridgePanel = undefined;
  }

  // ── 침대 — 저장하고 쉬기 / 그냥 쉬기 ─────────────────

  private openBedMenu(): void {
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.97); bg.fillRoundedRect(-170, -92, 340, 184, 8);
    bg.lineStyle(2, 0x2a5a8a, 1); bg.strokeRoundedRect(-170, -92, 340, 184, 8);
    c.add(bg);
    c.add(this.add.text(0, -64, '침대에서 쉬어갑니다', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#ffe28a', fontStyle: 'bold',
    }).setOrigin(0.5));

    const mkBtn = (y: number, label: string, color: string, stroke: number, onClick: () => void): void => {
      const g = this.add.graphics();
      g.fillStyle(0x14283c, 0.95); g.fillRoundedRect(-140, y - 17, 280, 34, 5);
      g.lineStyle(1.5, stroke, 0.95); g.strokeRoundedRect(-140, y - 17, 280, 34, 5);
      const t = this.add.text(0, y, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color, fontStyle: 'bold',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(0, y, 280, 34, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onClick);
      c.add([g, t, hit]);
    };
    mkBtn(-22, '저장하고 쉬기', '#4af2a1', 0x4af2a1, () => {
      // 유일한 저장 지점 — locationTag='hometown_interior'라 게이트 통과
      const ok = GameState.save();
      this.closeBedMenu();
      this.flash(ok ? `슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다. 푹 쉬었습니다.` : '저장에 실패했습니다');
      // (추후) 날짜 진행/피로 회복 훅 — 로드맵 4·5에서 결합
    });
    mkBtn(18, '그냥 쉬기', '#9fd0e4', 0x33b0e0, () => {
      this.closeBedMenu();
      this.flash('잠깐 눈을 붙였습니다. (피로 회복은 추후)');
    });
    mkBtn(58, '취소 (ESC)', '#8faabf', 0x2a5a8a, () => this.closeBedMenu());
    this.bedMenu = c;
  }

  private closeBedMenu(): void {
    this.bedMenu?.destroy();
    this.bedMenu = undefined;
  }

  private flashMsg?: Phaser.GameObjects.Text;
  private flash(msg: string): void {
    this.flashMsg?.destroy();
    this.flashMsg = this.add.text(GAME_WIDTH / 2, OY + ROOM_H * IT + 26, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#7fe6b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(120);
    this.time.delayedCall(2200, () => { this.flashMsg?.destroy(); this.flashMsg = undefined; });
  }

  /** 문 → 홈타운 외부 복귀 (stop + resume 규칙 — RegionFieldScene 재생성 금지) */
  private exitToField(): void {
    GameState.locationTag = 'hometown';
    fadeOutThen(this, () => {
      this.scene.stop();
      this.scene.resume('RegionFieldScene');
    }, 220);
  }
}
