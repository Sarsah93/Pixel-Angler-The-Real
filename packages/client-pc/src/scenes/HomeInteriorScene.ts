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
import { MapObject, TUNING } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { FridgePanel } from '../ui/FridgePanel.js';
import { CookingPanel } from '../ui/CookingPanel.js';
import { CookingStore } from '../store/CookingStore.js';
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
  /** 154차 — 집 주방 조리 패널 (가스레인지 [F]) */
  private cookPanel?: CookingPanel;
  private cookSyncAcc = 0;
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
    this.cookPanel = undefined;
    this.nearObj = null;

    this.drawRoom();
    this.drawFurniture();

    // 플레이어 (문 앞 스폰) — 실제 캐릭터 스프라이트 (RegionFieldScene와 동일 에셋)
    this.px = OX + 6 * IT; this.py = OY + 8.4 * IT;
    this.playerShadow = this.add.ellipse(this.px, this.py, PLAYER_H * 0.42, PLAYER_H * 0.12, 0x000000, 0.28).setDepth(18);
    this.playerSprite = this.add.image(this.px, this.py + PLAYER_FOOT_SINK, 'man-idle-front').setOrigin(0.5, 1).setDepth(20);
    this.applySpriteSize();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-F', () => this.tryInteract());   // 122차: 상호작용 키 E → F
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.cookPanel) { this.closeCook(); return; }
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

  /**
   * 방 — 173차 재작성.
   *
   * 구 구현은 **단색 바닥 + 격자선 + 색 사각형 가구**였고, 그 위에 `주방`·`저장★ 침대`·
   * `지하실 (확장 예약)`·`평수 확장` 같은 **개발 메모가 글자로 박혀** 있었다(§8-9 위반 —
   * 확장 계획은 플레이어의 말이 아니다). 이제 재질을 도트로 그리고, 안내는 [F] 힌트가 맡는다.
   */
  private drawRoom(): void {
    const g = this.add.graphics().setDepth(1);
    const W = ROOM_W * IT, H = ROOM_H * IT;
    /** 2px 그레인 — 필드와 같은 격자 */
    const dot = (x: number, y: number, col: number, a = 1): void => { g.fillStyle(col, a); g.fillRect(x, y, 2, 2); };
    const hash = (x: number, y: number): number => {
      let n = (0x9e37 ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    // 외벽(문틀) 프레임
    g.fillStyle(0x3a2718, 1); g.fillRoundedRect(OX - 20, OY - 20, W + 40, H + 40, 8);
    g.fillStyle(0x4f3622, 1); g.fillRoundedRect(OX - 14, OY - 14, W + 28, H + 28, 6);
    // ── 마루 ── 긴 널빤지(세로 6칸 주기) + 나뭇결 + 이음매
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const plank = Math.floor(x / (IT * 0.75));
        const base = plank % 2 === 0 ? 0xb88a45 : 0xb08240;
        const grain = hash(x + plank * 97, y);
        const col = grain < 0.12 ? 0xa0742f : grain > 0.9 ? 0xc79a52 : (typeof base === 'number' ? base : 0xb08240);
        dot(OX + x, OY + y, col);
      }
    }
    for (let x = 0; x < W; x += IT * 0.75) for (let y = 0; y < H; y += 2) dot(OX + x, OY + y, 0x8f6628, 0.8);
    for (let y = 0; y < H; y += IT * 2) for (let x = 0; x < W; x += 2) if (hash(x, y) > 0.5) dot(OX + x, OY + y, 0x8f6628, 0.5);
    // ── 벽 ── 상단 밴드: 아래는 징두리(판벽), 위는 회벽
    const wallH = Math.round(IT * 1.4);
    for (let y = 0; y < wallH; y += 2) for (let x = 0; x < W; x += 2) {
      const wain = y > wallH - 16;
      const col = wain ? ((x / 2) % 8 < 2 ? 0x6a4728 : 0x7a5330) : (hash(x, y + 999) > 0.94 ? 0xdcc9a8 : 0xd2bd9a);
      dot(OX + x, OY + y, col);
    }
    for (let x = 0; x < W; x += 2) { dot(OX + x, OY + wallH - 18, 0x8a6138); dot(OX + x, OY + wallH - 16, 0x5a3c22); }  // 몰딩
    for (let x = 0; x < W; x += 2) dot(OX + x, OY + wallH, 0x3a2718, 0.5);                                              // 벽 그림자
    // ── 창 ── 벽 오른쪽. 햇살이 마루에 떨어진다
    const wx = OX + W - IT * 3.4, wy = OY + 10, ww = IT * 2.2, wh = wallH - 30;
    for (let y = 0; y < wh; y += 2) for (let x = 0; x < ww; x += 2) dot(wx + x, wy + y, hash(x, y) > 0.8 ? 0xcfe8f5 : 0xaed4ea);
    for (let x = 0; x < ww; x += 2) { dot(wx + x, wy - 2, 0x5a3c22); dot(wx + x, wy + wh, 0x5a3c22); }
    for (let y = -2; y < wh + 2; y += 2) { dot(wx - 2, wy + y, 0x5a3c22); dot(wx + ww, wy + y, 0x5a3c22); }
    for (let y = 0; y < wh; y += 2) dot(wx + ww / 2, wy + y, 0x5a3c22);
    g.fillStyle(0xfff3c4, 0.10); g.fillRect(wx - 8, OY + wallH, ww + 16, IT * 2.2);                                      // 햇살
    // ── 벽시계 ──
    const cx = OX + IT * 1.4, cy = OY + Math.round(IT * 0.62);
    g.fillStyle(0x3a2718, 1); g.fillCircle(cx, cy, 16);
    g.fillStyle(0xf2e2b8, 1); g.fillCircle(cx, cy, 13);
    g.fillStyle(0x3a2718, 1);
    for (let a = 0; a < 12; a++) g.fillRect(cx + Math.round(Math.cos(a * Math.PI / 6) * 10) - 1, cy + Math.round(Math.sin(a * Math.PI / 6) * 10) - 1, 2, 2);
    g.fillRect(cx - 1, cy - 8, 2, 9); g.fillRect(cx - 1, cy - 1, 8, 2);
    // ── 벽 선반 + 책 ──
    const sx = OX + IT * 4.2, sy = OY + Math.round(IT * 0.72);
    for (let x = 0; x < IT * 2.4; x += 2) { dot(sx + x, sy, 0x8a6138); dot(sx + x, sy + 2, 0x5a3c22); }
    const books = [0xb04a3a, 0x3a6ea5, 0x3f9e63, 0xc2913a, 0x8a5aa8];
    books.forEach((col, i) => {
      const bx = sx + 6 + i * 16, bh = 22 + (i % 3) * 5;
      for (let y = 0; y < bh; y += 2) for (let x = 0; x < 10; x += 2) dot(bx + x, sy - bh + y, y < 3 ? 0xffffff : col);
    });
  }

  /**
   * 가구 — 173차 재작성. 색 사각형 대신 **재질 + 그늘 + 하이라이트**.
   * 라벨 글자는 전부 걷어냈다 — 무엇인지는 그림이 말하고, 무엇을 할 수 있는지는 [F] 힌트가 말한다.
   */
  private drawFurniture(): void {
    const g = this.add.graphics().setDepth(10);
    const dot = (x: number, y: number, col: number, a = 1): void => { g.fillStyle(col, a); g.fillRect(x, y, 2, 2); };
    /** 사각 면 — 위 하이라이트 + 아래 그늘 */
    const slab = (x: number, y: number, w: number, h: number, mid: number, lit: number, dark: number): void => {
      for (let yy = 0; yy < h; yy += 2) for (let xx = 0; xx < w; xx += 2) {
        dot(x + xx, y + yy, yy < 3 ? lit : yy > h - 5 ? dark : mid);
      }
    };
    /** 접지 그림자 */
    const shade = (x: number, y: number, w: number): void => {
      for (let xx = 0; xx < w; xx += 2) dot(x + xx, y, 0x2a1a0e, 0.28);
    };
    for (const o of INTERIOR_OBJECTS) {
      const x = OX + o.tx * IT, y = OY + o.ty * IT;
      const w = (o.fw ?? 1) * IT, h = (o.fh ?? 1) * IT;
      switch (o.instanceId) {
        case 'bed': {
          shade(x + 4, y + h - 4, w - 8);
          slab(x + 4, y + 6, w - 8, h - 12, 0x6a4a2c, 0x8a6440, 0x4a3420);          // 프레임
          slab(x + 8, y + 10, w - 16, h - 22, 0x8a3a34, 0xa64a42, 0x6e2a26);        // 매트리스·이불
          for (let yy = 0; yy < h - 26; yy += 8) for (let xx = 0; xx < w - 20; xx += 2) dot(x + 10 + xx, y + 16 + yy, 0x9b4139, 0.7);
          slab(x + 12, y + 14, w - 24, 22, 0xf2e2c8, 0xfff6e2, 0xd8c4a4);           // 베개
          slab(x + 8, y + h - 24, w - 16, 12, 0x3a6ea5, 0x4d86c0, 0x2a5280);        // 발치 이불단
          break;
        }
        case 'fridge':
          shade(x + 8, y + h - 6, w - 16);
          slab(x + 8, y + 6, w - 16, h - 12, 0xe4e6e2, 0xf5f7f3, 0xc2c6c0);
          for (let xx = 0; xx < w - 16; xx += 2) dot(x + 8 + xx, y + Math.round(h * 0.42), 0xaeb2ac);
          for (let yy = 0; yy < 14; yy += 2) dot(x + w - 18, y + 14 + yy, 0x8d979f);
          for (let yy = 0; yy < 14; yy += 2) dot(x + w - 18, y + Math.round(h * 0.5) + yy, 0x8d979f);
          break;
        case 'sink':
          shade(x + 6, y + h - 6, w - 12);
          slab(x + 4, y + 8, w - 8, h - 14, 0xcfd4d8, 0xe6eaed, 0xa9aeb2);
          slab(x + 12, y + 16, w - 24, h - 30, 0x5f6a74, 0x76828d, 0x454e57);
          for (let yy = 0; yy < 12; yy += 2) dot(x + w / 2, y + 6 + yy, 0x9aa6b0);
          dot(x + w / 2 - 2, y + 6, 0xb6c2cc); dot(x + w / 2 + 2, y + 6, 0xb6c2cc);
          break;
        case 'stove': {
          shade(x + 6, y + h - 6, w - 12);
          slab(x + 4, y + 8, w - 8, h - 14, 0x3a3f45, 0x4e545b, 0x24282d);
          for (const bx of [x + w * 0.3, x + w * 0.7]) {
            for (let a = 0; a < 360; a += 20) {
              const rx = Math.round(Math.cos(a * Math.PI / 180) * 8 / 2) * 2, ry = Math.round(Math.sin(a * Math.PI / 180) * 8 / 2) * 2;
              dot(bx + rx, y + h * 0.52 + ry, 0x22262a);
            }
            dot(bx - 2, y + h * 0.52, 0xff7a3a); dot(bx, y + h * 0.52 - 2, 0xffa35a);
            dot(bx, y + h * 0.52 + 2, 0xff7a3a); dot(bx + 2, y + h * 0.52, 0xffa35a);
          }
          for (let xx = 0; xx < w - 20; xx += 10) dot(x + 10 + xx, y + h - 10, 0xb0b6bc);   // 손잡이 열
          break;
        }
        case 'island':
          shade(x + 6, y + h - 2, w - 12);
          slab(x + 4, y + 10, w - 8, h - 20, 0xd8b98a, 0xeed6ae, 0xb4966a);
          for (let xx = 0; xx < w - 8; xx += 2) dot(x + 4 + xx, y + 10, 0xf4e4c4);
          for (const cxp of [x + w * 0.3, x + w * 0.7]) {
            for (let a = 0; a < 360; a += 24) {
              const rx = Math.round(Math.cos(a * Math.PI / 180) * 9 / 2) * 2, ry = Math.round(Math.sin(a * Math.PI / 180) * 9 / 2) * 2;
              dot(cxp + rx, y + h + 10 + ry, 0x7a5734);
            }
            slab(cxp - 8, y + h + 4, 16, 8, 0x8a6a44, 0xa8835a, 0x66492b);
          }
          break;
        case 'sofa':
          shade(x + 6, y + h - 4, w - 12);
          slab(x + 4, y + 6, w - 8, h - 12, 0x6d4079, 0x855196, 0x522f5c);          // 몸체
          slab(x + 10, y + 12, (w - 24) / 2, h * 0.42, 0x9a6aaa, 0xb182bf, 0x7c5089); // 쿠션 2
          slab(x + 14 + (w - 24) / 2, y + 12, (w - 24) / 2, h * 0.42, 0x9a6aaa, 0xb182bf, 0x7c5089);
          slab(x + 4, y + 6, 10, h - 12, 0x7c4c88, 0x9660a4, 0x5d3a68);             // 팔걸이
          slab(x + w - 14, y + 6, 10, h - 12, 0x7c4c88, 0x9660a4, 0x5d3a68);
          break;
        case 'rug': {
          for (let yy = 0; yy < h - 4; yy += 2) for (let xx = 0; xx < w - 4; xx += 2) {
            const edge = xx < 8 || yy < 8 || xx > w - 14 || yy > h - 14;
            dot(x + 2 + xx, y + 2 + yy, edge ? 0x2e5e3e : ((xx + yy) % 8 < 4 ? 0x3f7d54 : 0x38704b));
          }
          for (let xx = 0; xx < w - 4; xx += 4) { dot(x + 2 + xx, y + 2, 0xe8e0c8); dot(x + 2 + xx, y + h - 4, 0xe8e0c8); }  // 술
          // 고양이 — 웅크린 자세
          const kx = x + w / 2 - 14, ky = y + h / 2 - 6;
          for (let yy = 0; yy < 14; yy += 2) for (let xx = 0; xx < 26; xx += 2) {
            if (yy < 4 && (xx < 4 || xx > 20)) continue;
            dot(kx + xx, ky + yy, yy < 5 ? 0xe09a46 : 0xd88a3a);
          }
          for (let yy = 0; yy < 12; yy += 2) for (let xx = 0; xx < 12; xx += 2) dot(kx + 22 + xx, ky - 4 + yy, yy < 4 ? 0xe09a46 : 0xd88a3a);
          dot(kx + 24, ky - 6, 0xd88a3a); dot(kx + 30, ky - 6, 0xd88a3a);           // 귀
          dot(kx + 26, ky + 2, 0x2a1a0e); dot(kx + 30, ky + 2, 0x2a1a0e);           // 눈
          for (let xx = 0; xx < 10; xx += 2) dot(kx - 2 - xx, ky + 10, 0xd88a3a);   // 꼬리
          break;
        }
        case 'drawer':
          shade(x + 8, y + h - 4, w - 16);
          slab(x + 6, y + 6, w - 12, h - 12, 0x6a4a2c, 0x8a6440, 0x4a3420);
          for (const fy of [0.3, 0.62]) {
            slab(x + 10, y + h * fy, w - 20, 14, 0x7d5934, 0x9a7046, 0x5c4022);
            for (let xx = 0; xx < 10; xx += 2) dot(x + w / 2 - 4 + xx, y + h * fy + 6, 0xc9a66a);
          }
          for (let yy = 0; yy < 10; yy += 2) for (let xx = 0; xx < 14; xx += 2) dot(x + w / 2 - 6 + xx, y - 6 + yy, 0xffe28a, 0.9);  // 램프갓
          dot(x + w / 2, y + 4, 0xfff3c4);
          break;
        case 'shelf':
          shade(x + 6, y + h - 4, w - 12);
          slab(x + 4, y + 6, w - 8, h - 12, 0x5a3a22, 0x7a5232, 0x3f2718);
          for (const fy of [0.32, 0.64]) for (let xx = 0; xx < w - 16; xx += 2) dot(x + 8 + xx, y + h * fy, 0x8a6138);
          [0x3a6ea5, 0xb04a3a, 0x3f9e63].forEach((col, i) => {
            for (let yy = 0; yy < 16; yy += 2) for (let xx = 0; xx < 8; xx += 2) dot(x + 12 + i * 12 + xx, y + h * 0.32 - 16 + yy, col);
          });
          break;
        case 'plant': {
          const px = x + IT * 0.5;
          shade(x + IT * 0.28, y + IT * 0.86, IT * 0.44);
          slab(x + IT * 0.3, y + IT * 0.56, IT * 0.4, IT * 0.3, 0xb06a3b, 0xcb8450, 0x8d5029);
          for (let a = 0; a < 5; a++) {
            const ang = -90 + (a - 2) * 26, len = 16 + (a % 2) * 5;
            for (let t = 0; t < len; t += 2) {
              dot(px + Math.round(Math.cos(ang * Math.PI / 180) * t / 2) * 2,
                  y + IT * 0.56 + Math.round(Math.sin(ang * Math.PI / 180) * t / 2) * 2,
                  t > len - 8 ? 0x4fae56 : 0x3b8a42);
            }
          }
          break;
        }
        case 'stand':
          shade(x + 10, y + h - 6, w - 20);
          slab(x + 8, y + 12, w - 16, h - 22, 0x6a4a2c, 0x8a6440, 0x4a3420);
          for (let xx = 0; xx < w - 20; xx += 2) dot(x + 10 + xx, y + 12, 0x9a7046);
          break;
        case 'door_out': {
          slab(x + 6, y + IT * 0.22, w - 12, IT * 0.82, 0x4a2f1c, 0x6d4a2d, 0x33200f);
          for (let yy = 0; yy < IT * 0.66; yy += 2) for (let xx = 0; xx < w - 24; xx += 2) {
            dot(x + 12 + xx, y + IT * 0.3 + yy, (yy % 10 < 5) ? 0x7a5232 : 0x6d4a2d);
          }
          dot(x + w - 20, y + IT * 0.6, 0xffd257); dot(x + w - 20, y + IT * 0.62, 0xd6a93d);
          break;
        }
      }
    }
  }

  // ── 이동/충돌 (간이 AABB — 물리 미사용) ──────────────

  update(_t: number, delta: number): void {
    // 154차 — 집 주방 화구는 wall-clock으로 계속 끓는다(패널이 닫혀 있어도). 1초마다 동기화.
    this.cookSyncAcc += delta;
    if (this.cookSyncAcc >= 1000) { this.cookSyncAcc = 0; CookingStore.syncAll(); }
    if (this.bedMenu || this.fridgePanel || this.cookPanel) { this.updateWalkTexture(false); return; }   // 메뉴/패널 열림 중 이동 정지
    // 144차 — Shift 홀드 달리기(실내는 12x10칸이라 피로 드레인 없이 조작감만 통일)
    const spd = 0.18 * delta * (this.cursors.shift?.isDown ? TUNING.vitals.runSpeedMult : 1);
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
      const label = nearest.interact === 'save' ? '[F] 침대 — 저장하고 쉬기'
        : nearest.interact === 'door' ? '[F] 나가기'
        : nearest.interact === 'cook' ? '[F] 주방 — 요리'
        : nearest.instanceId === 'fridge' ? '[F] 냉장고 열기'
        : '[F] 수납';
      this.hintText.setText(label).setPosition(this.px, this.py - PLAYER_H - 6).setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  private tryInteract(): void {
    if (this.bedMenu || this.fridgePanel || this.cookPanel || !this.nearObj) return;
    switch (this.nearObj.interact) {
      case 'save': this.openBedMenu(); break;
      case 'door': this.exitToField(); break;
      case 'cook': this.openCook(); break;
      case 'storage':
        if (this.nearObj.instanceId === 'fridge') this.openFridge();
        else this.flash('아직 쓸 수 없는 가구입니다.');
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

  // ── 주방 — 가스레인지 (154차 불요리 · 연료 무한 · 수돗물) ─────────────────
  private openCook(): void {
    if (this.cookPanel) return;
    const stove = CookingStore.ensureHomeStove();
    const panel = new CookingPanel(this, GAME_WIDTH / 2 - 450, 60, stove, {
      onClose: () => this.closeCook(),
      onChanged: () => this.events.emit('inventory-changed'),
    });
    this.add.existing(panel);
    this.cookPanel = panel;
  }

  private closeCook(): void {
    this.cookPanel?.destroy();
    this.cookPanel = undefined;
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
      // 수면 회복이 먼저 — 저장 스냅샷에 회복 결과가 담기게 한다 (125차)
      const rec = this.restInBed();
      const ok = GameState.save();
      if (ok) StoryStore.event({ kind: 'custom', key: 'bedSave' });   // 134차 — M1-03 침대 저장 목표
      this.closeBedMenu();
      this.flash(ok ? `슬롯 ${GameState.activeSlot ?? 1}에 저장했습니다. ${rec}` : '저장에 실패했습니다');
      // (추후) 날짜 진행 훅 — 로드맵 4·5에서 결합
    });
    mkBtn(18, '그냥 쉬기', '#9fd0e4', 0x33b0e0, () => {
      const rec = this.restInBed();
      this.closeBedMenu();
      this.flash(rec);
    });
    mkBtn(58, '취소 (ESC)', '#8faabf', 0x2a5a8a, () => this.closeBedMenu());
    this.bedMenu = c;
  }

  /**
   * 수면 회복 (125차 — SPEC §4-2): 피로 0 · HP +50% · 허기/수분 −10.
   * `life_sleep` 배율은 P5 배선 시 곱한다(현재 노드는 wired:false).
   */
  private restInBed(): string {
    GameState.sleepRecover();
    const v = GameState.vitals;
    const base = `푹 쉬었습니다 — 피로 0 · 체력 ${Math.round(v.hp)}/${v.maxHp} · 허기 ${Math.round(v.hunger)}% · 수분 ${Math.round(v.hydration)}%`;
    // 171차 — 하루가 지나면 정기 지출 알림을 함께 준다(모르고 연체하는 상태를 만들지 않는다).
    const due = GameState.upkeepAlerts();
    if (!due.length) return base;
    const over = due.filter((d) => d.overdue);
    const head = over.length ? over[0]! : due[0]!;
    const tail = due.length > 1 ? ` 외 ${due.length - 1}건` : '';
    return `${base}\n${over.length ? '연체' : '납부일'}: ${head.nameKo}${tail} — 면허·허가 창(L)에서 납부`;
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
