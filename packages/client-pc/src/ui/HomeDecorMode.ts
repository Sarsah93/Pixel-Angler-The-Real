/**
 * @file HomeDecorMode.ts
 * @description 집 실내 가구 배치 모드 (189차 — 사용자 지시 "집 내부 배치된 가구들을 회수하고 재배치할 수 있도록")
 *
 * 상호작용 설계:
 *  - 걷는 동안의 [F]는 **기능 있는 가구**(앉기·열기·요리·물 주기)만 맡는다. 옮기기·넣어 두기까지 [F]에 얹으면
 *    모든 가구 앞에 [F]가 떠서 판정이 다시 복잡해진다 → 배치는 **따로 들어가는 모드**로 뺐다.
 *  - 들어가는 곳: 방 오른쪽 위 [가구 배치] 버튼. 바닥에 칸이 보이고, 오른쪽에 「넣어 둔 가구」 칸이 열린다.
 *  - 가구를 누르면 들어 올린다 → 손(커서)을 따라온다 → 초록 칸이면 눌러서 놓는다. 빨간 칸이면 까닭이 아래에 뜬다.
 *    우클릭(또는 R) = 돌리기 — 274차부터 모든 가구가 네 방위로 돈다. **누른 칸이 축**이라 소파 2×1을 한 칸에서 돌리면
 *    오른쪽 · 아래 · 왼쪽 · 위로 차례로 펼쳐진다(사용자 「좌측/하단측으로만 변형 위치를 보여주게 … 총 4개의 방위를 고려해야 해」).
 *    든 채로 돌리면 집어 든 칸이 축이다. 들고 있는 가구를 오른쪽 칸에 놓으면 넣어 둔다. 넣어 둔 가구를 누르면 다시 든다.
 *    ESC = 들고 있던 것 내려놓기 취소 → 한 번 더 누르면 배치를 마친다.
 *  - 판정은 `HomeStore.checkPlace` — 문까지 가는 길과 쓸 수 있는 가구 앞자리를 막는 배치는 놓이지 않는다.
 *  - 조작 안내 문구는 화면에 쓰지 않는다(규칙 R11) — 처음 들어올 때 체험 가이드(`home_decorate`)가 하나씩 해 보게 한다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { cv, cvText, drawBlockedX } from './ColorAssist.js';
import { HomeStore } from '../store/HomeStore.js';
import { GameState } from '../store/GameState.js';
import {
  IT, ROOM_W, ROOM_H, FLOOR_TOP, DOOR_MAT, FURN_DEFS, footprint, drawFurnitureArt, nextDir, turnLocal, turnedAround, placementsHolding,
  type FurnInstance, type FurnArtState,
} from '../data/HomeFurniture.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { restoreHandCursor } from './DraggablePanel.js';
import { fieldReserved, columnGap, assertClear } from './ScreenReserve.js';
import { worldLabelStyle, WORLD_LABEL_WARN } from './WorldLabel.js';

const FONT = '"Noto Sans KR", sans-serif';
const TRAY_W = 300;
const TRAY_COLS = 3;
const SLOT_W = 88;
const SLOT_H = 74;
const SLOT_GAP = 8;
/** 쪽 넘김 줄 높이 */
const PAGER_H = 24;
/** 트레이 최소 높이 — 머리 + 한 줄 + 쪽 넘김 + [완료] */
const TRAY_MIN_H = 42 + SLOT_H + PAGER_H + 56;

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
  /** 274차 — 집어 든 칸(가구 안 지역 칸). 손(커서)이 늘 이 칸 위에 있고, 돌리면 이 칸이 축이다 */
  grab: { x: number; y: number };
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
  /** 트레이 높이(198차 — HUD를 피한 빈 구간에 맞춘다) */
  private trayHeight = 0;
  /** 트레이 페이지(칸이 모자라면 ◀ ▶) */
  private trayPage = 0;
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
    this.gridG.fillStyle(cv(0xff6a5a), 0.18);
    this.gridG.fillRect(ox + DOOR_MAT.tx * IT, oy + DOOR_MAT.ty * IT, DOOR_MAT.fw * IT, DOOR_MAT.fh * IT);
    // 251차 — 「모양으로도 표시」: 비워 둘 칸마다 X(옅은 붉은 칠만으로 가르던 것)
    for (let c = 0; c < DOOR_MAT.fw; c++) for (let r = 0; r < DOOR_MAT.fh; r++) {
      drawBlockedX(this.gridG, ox + (DOOR_MAT.tx + c) * IT, oy + (DOOR_MAT.ty + r) * IT, IT, IT, cv(0xff6a5a), 0.6, 6);
    }

    this.hoverG = scene.add.graphics().setDepth(58);
    this.cellG = scene.add.graphics().setDepth(57.5);   // 들고 있는 가구 그림 위 — 칸 색이 가려지지 않게
    this.ghostArt = scene.add.graphics();
    this.ghostC = scene.add.container(0, 0, [this.ghostArt]).setDepth(57).setAlpha(0.85).setVisible(false);
    // 257차 — 바탕 상자 없이 흰 테 글자 · 놓을 수 없는 이유는 짙은 빨강
    this.reasonText = scene.add.text(0, 0, '', worldLabelStyle(12, { ink: WORLD_LABEL_WARN })).setOrigin(0.5, 0).setDepth(59).setVisible(false);
    this.nameText = scene.add.text(0, 0, '', worldLabelStyle(12)).setOrigin(0.5, 1).setDepth(59).setVisible(false);

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
    // 198차 — 화면 오른쪽 끝 상수 좌표(GAME_WIDTH − TRAY_W − 16)는 필드 HUD의 미니맵·「지금 할 일」을 덮었다.
    //   HUD가 비워 둔 세로 구간을 찾아 그 안에 넣고, 모자라면 칸 줄 수를 줄여 페이지로 넘긴다.
    const place = this.trayPlacement();
    this.trayHeight = place.h;
    this.tray = scene.add.container(place.x, place.y).setDepth(90);
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

  private trayH(): number { return this.trayHeight; }

  /** 트레이 자리 — 방 오른쪽·왼쪽 바깥 열 중 HUD를 피한 세로 빈 구간이 긴 쪽(방 윗변에 맞춘다) */
  private trayPlacement(): { x: number; y: number; h: number } {
    const reserved = fieldReserved(this.scene);
    const { ox, oy } = this.host;
    const full = ROOM_H * IT + 40;
    const frameL = ox - 20, frameR = ox + ROOM_W * IT + 20;
    let best: { x: number; y: number; h: number } | null = null;
    // 오른쪽 열은 방 액자에 붙이고(8px) 화면 끝 여백 6px까지 허용, 왼쪽 열은 화면 왼쪽 16px
    for (const x of [Math.max(frameR + 8, GAME_WIDTH - 16 - TRAY_W), 16]) {
      if (x + TRAY_W > GAME_WIDTH - 6) continue;
      if (!(x >= frameR + 8 || x + TRAY_W <= frameL - 8)) continue;   // 방 액자와 겹치는 열은 버린다
      const gap = columnGap(x, TRAY_W, reserved);
      if (!gap) continue;
      const h = Math.min(full, gap.h);
      const y = Phaser.Math.Clamp(oy - 20, gap.y, gap.y + gap.h - h);
      if (!best || h > best.h) best = { x, y, h };
    }
    const pick = best && best.h >= TRAY_MIN_H ? best : { x: Math.max(frameR + 8, GAME_WIDTH - 16 - TRAY_W), y: oy - 20, h: full };
    assertClear('home.decorTray', new Phaser.Geom.Rectangle(pick.x, pick.y, TRAY_W, pick.h), reserved);
    return pick;
  }

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

  /** 손(커서) 아래 방 칸 */
  private pointerCell(): { c: number; r: number } {
    return {
      c: Math.floor((this.lastPointer.x - this.host.ox) / IT),
      r: Math.floor((this.lastPointer.y - this.host.oy) / IT),
    };
  }

  private onLeft(): void {
    if (!this.holding) {
      const f = this.furnAt(this.lastPointer.x, this.lastPointer.y);
      if (!f) return;
      const { w, h } = footprint(f.kind, f.dir);
      const { c, r } = this.pointerCell();
      const grab = { x: Phaser.Math.Clamp(c - f.tx, 0, w - 1), y: Phaser.Math.Clamp(r - f.ty, 0, h - 1) };
      this.holding = { f: { ...f }, from: 'room', grab };
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
    this.rotate();
  }

  /**
   * 돌리기 (R · 우클릭). 들고 있으면 집어 든 칸을 축으로, 아니면 손 아래 가구를 **누른 칸을 축으로** 그 자리에서 돌린다.
   * 274차 — 모든 가구 · 네 방위(아래 → 왼쪽 → 위 → 오른쪽).
   */
  rotate(): void {
    const h = this.holding;
    if (!h) { this.turnInPlace(); return; }
    const g = turnLocal(h.f.kind, h.f.dir, h.grab.x, h.grab.y);
    h.f = { ...h.f, dir: nextDir(h.f.dir) };
    h.grab = g;
    this.rotates++;
    this.refreshPreview();
  }

  /**
   * 274차 — 놓인 가구를 그 자리에서 돌린다. 누른 칸이 축이고, 돌린 자리가 막히면 ① 같은 방향으로 축 칸을 품은 채 비켜 보고
   * ② 그래도 안 되면 다음 방향으로 넘어간다(막힌 방향은 건너뛴다). 네 방향이 다 막히면 첫 까닭을 띄운다.
   */
  private turnInPlace(): void {
    const f = this.furnAt(this.lastPointer.x, this.lastPointer.y);
    if (!f) return;
    const { c, r } = this.pointerCell();
    const others = this.othersOf(f.id);
    const me = this.host.playerTile();
    let cur = f;
    let firstReason: string | undefined;
    for (let step = 1; step <= 3; step++) {
      const nat = turnedAround(cur, c, r);
      for (const pos of placementsHolding(f.kind, nat.dir, c, r, nat)) {
        const cand: FurnInstance = { ...nat, tx: pos.tx, ty: pos.ty };
        const chk = HomeStore.checkPlace(cand, others, me);
        if (chk.ok) {
          HomeStore.place(cand);
          GameState.markDirty();
          this.rotates++;
          this.host.redraw(null);
          this.refreshPreview();
          return;
        }
        firstReason ??= chk.reason;
      }
      cur = nat;
    }
    if (firstReason) this.showReason(firstReason, f);
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

  /**
   * 커서 자리에 놓일 후보 — 274차: 집어 든 칸이 커서 아래 칸에 온다(전에는 가구 한가운데를 반올림해
   * 커서가 칸의 어느 쪽에 있느냐에 따라 왼쪽 · 오른쪽으로 튀었다).
   */
  private candidate(): FurnInstance | null {
    const h = this.holding;
    if (!h) return null;
    const { c, r } = this.pointerCell();
    return { ...h.f, tx: c - h.grab.x, ty: r - h.grab.y };
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
      const col = cv(k.ok ? 0x4af2a1 : 0xff5a5a);
      this.cellG.fillStyle(col, 0.22);
      this.cellG.fillRect(ox + k.c * IT + 1, oy + k.r * IT + 1, IT - 2, IT - 2);
      this.cellG.lineStyle(2, col, 0.9);
      this.cellG.strokeRect(ox + k.c * IT + 2, oy + k.r * IT + 2, IT - 4, IT - 4);
      if (!k.ok) drawBlockedX(this.cellG, ox + k.c * IT + 2, oy + k.r * IT + 2, IT - 4, IT - 4, 0xffffff, 0.9, 6);   // 251차
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
    if (this.holding && this.overTray) edge = cv(FURN_DEFS[this.holding.f.kind].storable ? 0x4af2a1 : 0xff6a5a);
    g.lineStyle(2, edge, 1); g.strokeRoundedRect(0, 0, TRAY_W, h, 8);
  }

  private renderTray(): void {
    this.trayBody.removeAll(true);
    const scene = this.scene;
    this.paintTrayFrame();
    this.trayBody.add(scene.add.text(14, 12, '넣어 둔 가구', {
      fontFamily: FONT, fontSize: '14px', color: '#ffd9a0', fontStyle: 'bold',
    }));
    // 190차 — 상점에서 같은 가구를 여럿 살 수 있어 칸 하나 = 종류 하나(개수 표시)로 묶는다
    const list = HomeStore.storedGroups();
    const x0 = (TRAY_W - (TRAY_COLS * SLOT_W + (TRAY_COLS - 1) * SLOT_GAP)) / 2;
    // 198차 — 줄 수는 트레이 높이에서 낸다(머리 42 · [완료] 56). 넘치면 아래에 쪽 넘김 줄(조용히 잘리지 않게)
    const rowsFor = (pager: number): number =>
      Math.max(1, Math.floor((this.trayH() - 42 - 56 - pager + SLOT_GAP) / (SLOT_H + SLOT_GAP)));
    let rows = Math.min(5, rowsFor(0));
    const paged = list.length > TRAY_COLS * rows;
    if (paged) rows = Math.min(5, rowsFor(PAGER_H));
    const per = TRAY_COLS * rows;
    const pages = Math.max(1, Math.ceil(list.length / per));
    this.trayPage = Phaser.Math.Clamp(this.trayPage, 0, pages - 1);
    const first = this.trayPage * per;
    for (let i = 0; i < per; i++) {
      const sx = x0 + (i % TRAY_COLS) * (SLOT_W + SLOT_GAP);
      const sy = 42 + Math.floor(i / TRAY_COLS) * (SLOT_H + SLOT_GAP);
      const box = scene.add.graphics();
      box.fillStyle(0x0e1c2d, 0.92); box.fillRoundedRect(sx, sy, SLOT_W, SLOT_H, 5);
      box.lineStyle(1.2, 0x1f3d5a, 0.8); box.strokeRoundedRect(sx, sy, SLOT_W, SLOT_H, 5);
      this.trayBody.add(box);
      const grp = list[first + i];
      if (!grp) continue;
      const f = grp.items[0]!;
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
      if (grp.items.length > 1) {
        this.trayBody.add(scene.add.text(sx + SLOT_W - 5, sy + 4, `x${grp.items.length}`, {
          fontFamily: FONT, fontSize: '11px', color: '#ffe9b0', fontStyle: 'bold',
        }).setOrigin(1, 0));
      }
    }
    if (paged) this.addPager(42 + rows * (SLOT_H + SLOT_GAP), pages);
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

  /** 쪽 넘김 줄 ◀ n / m ▶ */
  private addPager(y: number, pages: number): void {
    const scene = this.scene;
    const mid = scene.add.text(TRAY_W / 2, y + PAGER_H / 2 - 2, `${this.trayPage + 1} / ${pages}`, {
      fontFamily: FONT, fontSize: '12px', color: '#9fc0d4', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.trayBody.add(mid);
    const arrow = (x: number, glyph: string, d: number): void => {
      const on = this.trayPage + d >= 0 && this.trayPage + d < pages;
      const t = scene.add.text(x, y + PAGER_H / 2 - 2, glyph, {
        fontFamily: 'sans-serif', fontSize: '14px', color: on ? '#ffe9b0' : '#3a4a5a',
      }).setOrigin(0.5);
      this.trayBody.add(t);
      if (!on) return;
      const hit = scene.add.rectangle(x, y + PAGER_H / 2 - 2, 36, PAGER_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.trayPage += d; this.renderTray(); restoreHandCursor(scene); });
      this.trayBody.add(hit);
    };
    arrow(TRAY_W / 2 - 60, '◀', -1);
    arrow(TRAY_W / 2 + 60, '▶', 1);
  }

  /** 넣어 둔 칸의 가구를 든다 (들고 있던 것은 그 자리에 돌려놓지 않고 넣어 둔다) */
  private takeFromTray(f: FurnInstance): void {
    if (this.holding) { this.dropToTray(); if (this.holding) return; }
    const { w, h } = footprint(f.kind, f.dir);
    this.holding = { f: { ...f }, from: 'tray', grab: { x: Math.floor((w - 1) / 2), y: Math.floor((h - 1) / 2) } };
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
          text: cvText('들어 올린 가구는 손을 따라온다. 초록 칸이면 놓을 수 있고, 빨간 칸이면 그 까닭이 아래에 뜬다. 빈자리를 눌러 내려놓자.',
            '들어 올린 가구는 손을 따라온다. 파란 칸이면 놓을 수 있고, 빨간 칸이면 그 까닭이 아래에 뜬다. 빈자리를 눌러 내려놓자.'),
          target: room,
          onEnter: () => { placesAt = this.places; },
          wait: () => this.places > placesAt,
        },
        {
          // 274차 — 모든 가구 · 네 방위 · 누른 칸이 축
          text: '가구는 네 방향으로 돌릴 수 있다. 가구 위에서 우클릭하면 누른 칸을 축으로 한 방향씩 돈다. 막힌 방향은 건너뛴다. 한 번 돌려 보자.',
          target: room,
          skipIf: () => HomeStore.placed.length === 0,
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
