/**
 * @file HomeDecorMode.ts
 * @description 집 실내 가구 배치 모드 (189차 — 사용자 지시 "집 내부 배치된 가구들을 회수하고 재배치할 수 있도록")
 *
 * 상호작용 설계:
 *  - 걷는 동안의 [F]는 **기능 있는 가구**(앉기·열기·요리·물 주기)만 맡는다. 옮기기·넣어 두기까지 [F]에 얹으면
 *    모든 가구 앞에 [F]가 떠서 판정이 다시 복잡해진다 → 배치는 **따로 들어가는 모드**로 뺐다.
 *  - 들어가는 곳: 방 오른쪽 위 [가구 배치] 버튼. 바닥에 칸이 보이고, 오른쪽에 「넣어 둔 가구」 칸이 열린다.
 *  - 가구를 누르면 들어 올린다 → 손(커서)을 따라온다 → 초록 칸이면 눌러서 놓는다. 빨간 칸이면 까닭이 아래에 뜬다.
 *    우클릭(또는 R) = 돌리기(소파·의자). 들고 있는 가구를 오른쪽 칸에 놓으면 넣어 둔다. 넣어 둔 가구를 누르면 다시 든다.
 *    ESC = 들고 있던 것 내려놓기 취소 → 한 번 더 누르면 배치를 마친다.
 *  - 판정은 `HomeStore.checkPlace` — 문까지 가는 길과 쓸 수 있는 가구 앞자리를 막는 배치는 놓이지 않는다.
 *  - 조작 안내 문구는 화면에 쓰지 않는다(규칙 R11) — 처음 들어올 때 체험 가이드(`home_decorate`)가 하나씩 해 보게 한다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { HomeStore } from '../store/HomeStore.js';
import { GameState } from '../store/GameState.js';
import {
  IT, ROOM_W, ROOM_H, FLOOR_TOP, DOOR_MAT, FURN_DEFS, DIR_CYCLE, footprint, drawFurnitureArt,
  type FurnInstance, type FurnArtState,
} from '../data/HomeFurniture.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { restoreHandCursor } from './DraggablePanel.js';

const FONT = '"Noto Sans KR", sans-serif';
const TRAY_W = 300;
const TRAY_COLS = 3;
const SLOT_W = 88;
const SLOT_H = 74;
const SLOT_GAP = 8;

export interface DecorHost {
  ox: number;
  oy: number;
  /** 가구를 다시 그린다 — `hideId`(들고 있는 가구)는 그리지 않는다 */
  redraw(hideId: string | null): void;
  /** 플레이어 발밑 (칸 단위 실수 좌표) */
  playerTile(): { x: number; y: number };
  artState(): FurnArtState;
  /** 배치 모드를 마쳤다 */
  onExit(): void;
}

interface Holding {
  f: FurnInstance;
  from: 'room' | 'tray';
}

export class HomeDecorMode {
  private scene: Phaser.Scene;
  private host: DecorHost;
  private gridG: Phaser.GameObjects.Graphics;
  private hoverG: Phaser.GameObjects.Graphics;
  private ghostC: Phaser.GameObjects.Container;
  private ghostArt: Phaser.GameObjects.Graphics;
  private cellG: Phaser.GameObjects.Graphics;
  private reasonText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private roomZone: Phaser.GameObjects.Rectangle;
  private tray: Phaser.GameObjects.Container;
  private trayBody: Phaser.GameObjects.Container;
  private trayFrame: Phaser.GameObjects.Graphics;
  private holding: Holding | null = null;
  private lastPointer = { x: 0, y: 0 };
  private overTray = false;
  /** 가이드 판정용 횟수 */
  picks = 0;
  places = 0;
  rotates = 0;
  stores = 0;
  takesPlaced = 0;
  private takenFromTray = false;
  alive = true;

  constructor(scene: Phaser.Scene, host: DecorHost) {
    this.scene = scene;
    this.host = host;
    const { ox, oy } = host;
    // 바닥 칸 — 배치용 격자(이 모드에서만 보인다). 현관 매트는 비워 둬야 하는 칸이라 붉게
    this.gridG = scene.add.graphics().setDepth(7);
    this.gridG.lineStyle(1, 0xfff3c4, 0.28);
    for (let c = 0; c <= ROOM_W; c++) this.gridG.lineBetween(ox + c * IT, oy + FLOOR_TOP * IT, ox + c * IT, oy + ROOM_H * IT);
    for (let r = FLOOR_TOP; r <= ROOM_H; r++) this.gridG.lineBetween(ox, oy + r * IT, ox + ROOM_W * IT, oy + r * IT);
    this.gridG.fillStyle(0xff6a5a, 0.18);
    this.gridG.fillRect(ox + DOOR_MAT.tx * IT, oy + DOOR_MAT.ty * IT, DOOR_MAT.fw * IT, DOOR_MAT.fh * IT);

    this.hoverG = scene.add.graphics().setDepth(58);
    this.cellG = scene.add.graphics().setDepth(57.5);   // 들고 있는 가구 그림 위 — 칸 색이 가려지지 않게
    this.ghostArt = scene.add.graphics();
    this.ghostC = scene.add.container(0, 0, [this.ghostArt]).setDepth(57).setAlpha(0.85).setVisible(false);
    this.reasonText = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffd0c8', fontStyle: 'bold',
      backgroundColor: '#3a0e0ecc', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(59).setVisible(false);
    this.nameText = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(59).setVisible(false);

    // 방 전체 입력 판 — 가이드 방패(더 높은 depth)가 덮으면 그쪽이 입력을 먹는다
    this.roomZone = scene.add.rectangle(ox, oy + FLOOR_TOP * IT, ROOM_W * IT, (ROOM_H - FLOOR_TOP) * IT, 0xffffff, 0.001)
      .setOrigin(0, 0).setDepth(55).setInteractive();
    this.roomZone.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p.x, p.y));
    this.roomZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.onMove(p.x, p.y);
      if (p.rightButtonDown()) this.onRight(); else this.onLeft();
    });
    this.roomZone.on('pointerout', () => { this.hoverG.clear(); this.nameText.setVisible(false); });

    // 넣어 둔 가구 칸
    this.tray = scene.add.container(GAME_WIDTH - TRAY_W - 16, oy - 20).setDepth(90);
    this.trayFrame = scene.add.graphics();
    this.trayBody = scene.add.container(0, 0);
    this.tray.add([this.trayFrame, this.trayBody]);
    this.renderTray();

    maybeStartTour(scene, () => this.buildTour());
  }

  // ── 좌표 ──────────────────────────────────────────────

  roomRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.host.ox, this.host.oy + FLOOR_TOP * IT, ROOM_W * IT, (ROOM_H - FLOOR_TOP) * IT);
  }

  trayRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.tray.x, this.tray.y, TRAY_W, this.trayH());
  }

  doneRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.tray.x + 12, this.tray.y + this.trayH() - 48, TRAY_W - 24, 36);
  }

  private trayH(): number { return ROOM_H * IT + 40; }

  private furnAt(sx: number, sy: number): FurnInstance | null {
    const c = (sx - this.host.ox) / IT, r = (sy - this.host.oy) / IT;
    const hit = HomeStore.placed.filter((f) => {
      const { w, h } = footprint(f.kind, f.dir);
      return c >= f.tx && c < f.tx + w && r >= f.ty && r < f.ty + h;
    });
    // 러그는 맨 아래 — 위에 놓인 가구가 먼저 잡힌다
    hit.sort((a, b) => Number(!!FURN_DEFS[a.kind].floor) - Number(!!FURN_DEFS[b.kind].floor));
    return hit[0] ?? null;
  }

  private othersOf(id: string): FurnInstance[] {
    return HomeStore.placed.filter((p) => p.id !== id);
  }

  // ── 입력 ──────────────────────────────────────────────

  private onMove(sx: number, sy: number): void {
    this.lastPointer = { x: sx, y: sy };
    this.refreshPreview();
  }

  private onLeft(): void {
    if (!this.holding) {
      const f = this.furnAt(this.lastPointer.x, this.lastPointer.y);
      if (!f) return;
      this.holding = { f: { ...f }, from: 'room' };
      this.takenFromTray = false;
      this.picks++;
      this.host.redraw(f.id);
      this.refreshPreview();
      return;
    }
    const cand = this.candidate();
    if (!cand) return;
    const chk = HomeStore.checkPlace(cand, this.othersOf(cand.id), this.host.playerTile());
    if (!chk.ok) return;   // 까닭은 이미 미리보기 아래에 떠 있다
    HomeStore.place(cand);
    GameState.markDirty();
    this.places++;
    if (this.takenFromTray) this.takesPlaced++;
    this.holding = null;
    this.host.redraw(null);
    this.renderTray();
    this.refreshPreview();
  }

  private onRight(): void {
    if (this.holding) { this.rotate(); return; }
    // 들지 않고 가구 위에서 우클릭 = 그 자리에서 돌리기
    const f = this.furnAt(this.lastPointer.x, this.lastPointer.y);
    if (!f || !FURN_DEFS[f.kind].rotatable) return;
    const next: FurnInstance = { ...f, dir: DIR_CYCLE[(DIR_CYCLE.indexOf(f.dir) + 1) % 4] };
    const chk = HomeStore.checkPlace(next, this.othersOf(f.id), this.host.playerTile());
    if (!chk.ok) { this.showReason(chk.reason ?? '', f); return; }
    HomeStore.place(next);
    GameState.markDirty();
    this.rotates++;
    this.host.redraw(null);
    this.refreshPreview();
  }

  /** 들고 있는 가구 돌리기 (R · 우클릭) */
  rotate(): void {
    const h = this.holding;
    if (!h || !FURN_DEFS[h.f.kind].rotatable) return;
    h.f = { ...h.f, dir: DIR_CYCLE[(DIR_CYCLE.indexOf(h.f.dir) + 1) % 4] };
    this.rotates++;
    this.refreshPreview();
  }

  /** ESC — 들고 있으면 내려놓기 취소, 아니면 배치를 마친다 */
  escape(): void {
    if (this.holding) {
      this.holding = null;
      this.host.redraw(null);
      this.refreshPreview();
      return;
    }
    this.exit();
  }

  exit(): void {
    if (!this.alive) return;
    this.alive = false;
    if (this.holding) { this.holding = null; }
    this.host.redraw(null);
    for (const o of [this.gridG, this.hoverG, this.cellG, this.ghostC, this.reasonText, this.nameText, this.roomZone, this.tray]) o.destroy();
    restoreHandCursor(this.scene);
    this.host.onExit();
  }

  // ── 미리보기 ──────────────────────────────────────────

  /** 커서 자리에 놓일 후보 (커서가 가구 한가운데에 오게) */
  private candidate(): FurnInstance | null {
    const h = this.holding;
    if (!h) return null;
    const { w, h: hh } = footprint(h.f.kind, h.f.dir);
    const cx = (this.lastPointer.x - this.host.ox) / IT, cy = (this.lastPointer.y - this.host.oy) / IT;
    return { ...h.f, tx: Math.round(cx - w / 2), ty: Math.round(cy - hh / 2) };
  }

  private refreshPreview(): void {
    this.hoverG.clear();
    this.cellG.clear();
    this.reasonText.setVisible(false);
    this.nameText.setVisible(false);
    const { ox, oy } = this.host;
    const p = this.lastPointer;
    this.overTray = this.trayRect().contains(p.x, p.y);
    this.paintTrayFrame();
    if (!this.holding) {
      this.ghostC.setVisible(false);
      const f = this.furnAt(p.x, p.y);
      if (!f || !this.roomRect().contains(p.x, p.y)) return;
      const { w, h } = footprint(f.kind, f.dir);
      this.hoverG.lineStyle(2, 0xffd257, 1);
      this.hoverG.strokeRoundedRect(ox + f.tx * IT - 2, oy + f.ty * IT - 2, w * IT + 4, h * IT + 4, 5);
      this.nameText.setText(FURN_DEFS[f.kind].nameKo).setPosition(ox + (f.tx + w / 2) * IT, oy + f.ty * IT - 6).setVisible(true);
      return;
    }
    const cand = this.candidate()!;
    if (this.overTray || !this.roomRect().contains(p.x, p.y)) { this.ghostC.setVisible(false); return; }
    const chk = HomeStore.checkPlace(cand, this.othersOf(cand.id), this.host.playerTile());
    for (const k of chk.cells) {
      const col = k.ok ? 0x4af2a1 : 0xff5a5a;
      this.cellG.fillStyle(col, 0.22);
      this.cellG.fillRect(ox + k.c * IT + 1, oy + k.r * IT + 1, IT - 2, IT - 2);
      this.cellG.lineStyle(2, col, 0.9);
      this.cellG.strokeRect(ox + k.c * IT + 2, oy + k.r * IT + 2, IT - 4, IT - 4);
    }
    this.ghostArt.clear();
    drawFurnitureArt(this.ghostArt, cand.kind, cand.dir, this.host.artState());
    this.ghostC.setPosition(ox + cand.tx * IT, oy + cand.ty * IT).setVisible(true);
    if (!chk.ok && chk.reason) this.showReason(chk.reason, cand);
  }

  private showReason(reason: string, f: FurnInstance): void {
    const { w, h } = footprint(f.kind, f.dir);
    const { ox, oy } = this.host;
    const y = Math.min(oy + (f.ty + h) * IT + 4, oy + ROOM_H * IT - 4);
    this.reasonText.setText(reason).setPosition(ox + (f.tx + w / 2) * IT, y).setVisible(true);
  }

  // ── 넣어 둔 가구 칸 ───────────────────────────────────

  private paintTrayFrame(): void {
    const g = this.trayFrame;
    g.clear();
    const h = this.trayH();
    g.fillStyle(0x0a1628, 0.94); g.fillRoundedRect(0, 0, TRAY_W, h, 8);
    let edge = 0x2a5a8a;
    if (this.holding && this.overTray) edge = FURN_DEFS[this.holding.f.kind].storable ? 0x4af2a1 : 0xff6a5a;
    g.lineStyle(2, edge, 1); g.strokeRoundedRect(0, 0, TRAY_W, h, 8);
  }

  private renderTray(): void {
    this.trayBody.removeAll(true);
    const scene = this.scene;
    this.paintTrayFrame();
    this.trayBody.add(scene.add.text(14, 12, '넣어 둔 가구', {
      fontFamily: FONT, fontSize: '14px', color: '#ffd9a0', fontStyle: 'bold',
    }));
    const list = HomeStore.stored;
    const x0 = (TRAY_W - (TRAY_COLS * SLOT_W + (TRAY_COLS - 1) * SLOT_GAP)) / 2;
    const rows = 5;
    for (let i = 0; i < TRAY_COLS * rows; i++) {
      const sx = x0 + (i % TRAY_COLS) * (SLOT_W + SLOT_GAP);
      const sy = 42 + Math.floor(i / TRAY_COLS) * (SLOT_H + SLOT_GAP);
      const box = scene.add.graphics();
      box.fillStyle(0x0e1c2d, 0.92); box.fillRoundedRect(sx, sy, SLOT_W, SLOT_H, 5);
      box.lineStyle(1.2, 0x1f3d5a, 0.8); box.strokeRoundedRect(sx, sy, SLOT_W, SLOT_H, 5);
      this.trayBody.add(box);
      const f = list[i];
      if (!f) continue;
      const { w, h } = footprint(f.kind, f.dir);
      const art = scene.add.graphics();
      drawFurnitureArt(art, f.kind, f.dir, this.host.artState());
      const s = Math.min((SLOT_W - 16) / (w * IT), (SLOT_H - 26) / (h * IT), 1);
      art.setScale(s).setPosition(sx + (SLOT_W - w * IT * s) / 2, sy + 6 + (SLOT_H - 26 - h * IT * s) / 2);
      const label = scene.add.text(sx + SLOT_W / 2, sy + SLOT_H - 4, FURN_DEFS[f.kind].nameKo, {
        fontFamily: FONT, fontSize: '11px', color: '#c8dceb',
      }).setOrigin(0.5, 1);
      const hit = scene.add.rectangle(sx, sy, SLOT_W, SLOT_H, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.takeFromTray(f));
      this.trayBody.add([art, label, hit]);
    }
    // 들고 있는 가구를 받는 판 (칸 사이 빈 곳을 눌러도 넣어 둔다)
    const drop = scene.add.rectangle(0, 0, TRAY_W, this.trayH() - 56, 0xffffff, 0.001).setOrigin(0, 0).setInteractive();
    drop.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p.x, p.y));
    drop.on('pointerdown', () => this.dropToTray());
    this.trayBody.addAt(drop, 0);
    // [완료]
    const by = this.trayH() - 48;
    const bg = scene.add.graphics();
    bg.fillStyle(0x14283c, 0.95); bg.fillRoundedRect(12, by, TRAY_W - 24, 36, 6);
    bg.lineStyle(1.5, 0x4af2a1, 0.95); bg.strokeRoundedRect(12, by, TRAY_W - 24, 36, 6);
    const tx = scene.add.text(TRAY_W / 2, by + 18, '완료', {
      fontFamily: FONT, fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = scene.add.rectangle(12, by, TRAY_W - 24, 36, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.exit());
    this.trayBody.add([bg, tx, hit]);
  }

  /** 넣어 둔 칸의 가구를 든다 (들고 있던 것은 그 자리에 돌려놓지 않고 넣어 둔다) */
  private takeFromTray(f: FurnInstance): void {
    if (this.holding) { this.dropToTray(); if (this.holding) return; }
    this.holding = { f: { ...f }, from: 'tray' };
    this.takenFromTray = true;
    this.picks++;
    this.refreshPreview();
  }

  /** 들고 있는 가구를 넣어 둔다 */
  private dropToTray(): void {
    const h = this.holding;
    if (!h) return;
    if (!FURN_DEFS[h.f.kind].storable) {
      this.reasonText.setText('침대는 넣어 둘 수 없다 — 잠잘 곳은 있어야 한다')
        .setPosition(this.tray.x + TRAY_W / 2, this.tray.y + this.trayH() + 4).setVisible(true);
      return;
    }
    if (h.from === 'room') HomeStore.store(h.f.id);
    this.holding = null;
    this.stores++;
    GameState.markDirty();
    this.host.redraw(null);
    this.renderTray();
    this.refreshPreview();
  }

  // ── 첫 진입 체험 가이드 (tour id 'home_decorate') ──

  private buildTour(): TourOptions {
    const room = (): Phaser.Geom.Rectangle => this.roomRect();
    const tray = (): Phaser.Geom.Rectangle => this.trayRect();
    let placesAt = 0;
    return {
      id: 'home_decorate',
      anchor: () => new Phaser.Geom.Rectangle(this.host.ox - 20, this.host.oy - 20, ROOM_W * IT + 40, ROOM_H * IT + 40),
      alive: () => this.alive,
      steps: [
        {
          text: '가구 배치 중에는 바닥에 칸이 보인다. 옮길 가구를 눌러 들어 올려 보자.',
          target: room,
          wait: () => !!this.holding,
        },
        {
          text: '들어 올린 가구는 손을 따라온다. 초록 칸이면 놓을 수 있고, 빨간 칸이면 그 까닭이 아래에 뜬다. 빈자리를 눌러 내려놓자.',
          target: room,
          onEnter: () => { placesAt = this.places; },
          wait: () => this.places > placesAt,
        },
        {
          text: '소파와 의자는 방향을 바꿀 수 있다. 들고 있을 때나 그 가구 위에서 우클릭하면 돈다. 한 번 돌려 보자.',
          target: room,
          skipIf: () => !HomeStore.placed.concat(HomeStore.stored).some((f) => FURN_DEFS[f.kind].rotatable),
          wait: () => this.rotates > 0 && !this.holding,
        },
        {
          text: '오른쪽은 넣어 둔 가구 자리다. 가구를 들어 이 칸에 내려놓으면 방에서 치워 둔다. 하나 넣어 보자.',
          target: tray,
          allow: () => [room(), tray()],
          wait: () => this.stores > 0,
        },
        {
          text: '넣어 둔 가구를 누르면 다시 든다. 방에 다시 놓아 보자.',
          target: tray,
          allow: () => [room(), tray()],
          skipIf: () => HomeStore.stored.length === 0,
          wait: () => this.takesPlaced > 0,
        },
        {
          text: '다 옮겼으면 [완료]를 누른다. 배치는 침대에서 저장할 때 함께 기록된다.',
          target: () => this.doneRect(),
        },
      ],
    };
  }
}
