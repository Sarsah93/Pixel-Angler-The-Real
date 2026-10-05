/**
 * @file InteriorSystem.ts
 * @description 건물 실내 (215차 — 실내 공간 1단계: 가게 · 보건소 · 위판장).
 *
 * 필드 씬(`RegionFieldScene`) **위에 겹쳐 그리는 방**이다. 별도 씬으로 띄우지 않은 까닭:
 * 거래(`openShop` · 구매/판매 확인 · 시세) · 위판(출품 · 경매 · 맡겨 두기) · 진료 흐름이 전부 필드 씬
 * 메서드와 팝업 스택에 묶여 있다. 씬을 나누면 그 흐름을 통째로 옮기거나, 멈춘 필드 씬의 팝업을
 * 다른 씬 밑에 깔게 된다(씬 렌더 순서상 가려진다). 그래서 방은 필드 화면 고정층(depth 70~99)에 그리고,
 * [F]가 닿으면 필드 씬의 원래 흐름을 그대로 부른다.
 *
 *  - depth 70~99: 날씨(40대) · 세상 머리 위 안내(60대) 위, 지역 이름판(100) · HUD(200) · 팝업(800~) 아래.
 *  - 이동 · 충돌 · [F] 판정은 집 실내와 같은 규칙(발밑 AABB · 닿는 거리 26px · 현관 매트를 밟고 아래로 나가기).
 *  - 앉기(음식점 의자 · 보건소 대기 의자)는 집과 같은 자세(다리를 잘라 가구가 가린 것으로 읽힌다).
 *  - 사람(점원 · 간호사 · 경매사)은 `characterOf(시드)` — 같은 가게면 같은 얼굴. 다가가면 나를 본다.
 */

import Phaser from 'phaser';
import {
  CHAR_CELL, CHAR_FOOT_Y, CHAR_HEAD_TOP, CHAR_SCALE, TUNING, characterOf, type CharDir,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../../PhaserConfig.js';
import { CharacterSprite, ensureCharSheet, charFrameName } from '../../ui/CharacterSprite.js';
import { characterLook } from '../../data/EquipOutfit.js';
import { restoreHandCursor } from '../../ui/DraggablePanel.js';
import { bakeFixture, bakeInteriorBg, fixtureRise, FRAME } from '../../ui/InteriorArt.js';
import {
  FLOOR_TOP, type FixtureDef, type InteriorAction, type InteriorLayout, type InteriorPerson,
} from '../../data/InteriorLayouts.js';
import { fieldReserved, assertClear } from '../../ui/ScreenReserve.js';

/** 겹층 depth — 배경 · 집기/사람(+y) · 안내 */
const D_BACK = 70;
const D_BG = 71;
const D_OBJ = 72;
const D_HINT = 96;
const D_MENU = 98;
const FONT = '"Noto Sans KR", sans-serif';
/** [F]가 닿는 거리 — 발밑에서 집기 footprint 가장자리까지(px) */
const REACH_PX = 26;
/** 앉은 자세 — 머리끝부터 엉덩이까지만 보인다 */
const SEAT_ROWS = (CHAR_HEAD_TOP + 19) * CHAR_SCALE;
/** 방 가로 위치 — 집과 같은 자리(198차 — 필드 HUD 상태 창을 피한 12px) */
const ROOM_SHIFT_X = 12;

/** 필드 씬이 맡는 일 */
export interface InteriorHost {
  /** 거래 · 위판 · 진료 · 경매 시간 */
  onAction(action: Exclude<InteriorAction, 'sit'>): void;
  /** 의자에서 「식사하기」 — 가방(음식) */
  onMeal(): void;
  /** 매트를 밟고 나가거나 ESC — 필드가 페이드 후 `destroy` */
  onLeave(): void;
}

export interface InteriorEnter {
  layout: InteriorLayout;
  /** 사람 얼굴 시드(같은 가게면 같은 얼굴) */
  seed: string;
}

interface MenuItem { label: string; color?: string; run: () => void }

export class InteriorSystem {
  readonly layout: InteriorLayout;
  /** 방 왼쪽 위(화면 좌표) */
  readonly ox: number;
  readonly oy: number;
  private readonly scene: Phaser.Scene;
  private readonly host: InteriorHost;
  private readonly objs: Phaser.GameObjects.GameObject[] = [];
  private char!: CharacterSprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private hint!: Phaser.GameObjects.Text;
  private people: { img: Phaser.GameObjects.Image; p: InteriorPerson; sheet: string; dir: CharDir }[] = [];
  private px = 0;
  private py = 0;
  private facing: CharDir = 'up';
  private near: FixtureDef | null = null;
  private seat: { f: FixtureDef; standX: number; standY: number } | null = null;
  private menu?: { c: Phaser.GameObjects.Container; items: MenuItem[]; rows: Phaser.GameObjects.Graphics[]; sel: number };
  private flashMsg?: Phaser.GameObjects.Text;
  private enteredAt: number;
  private leaving = false;
  private keyFn: (ev: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, host: InteriorHost, enter: InteriorEnter) {
    this.scene = scene;
    this.host = host;
    this.layout = enter.layout;
    const L = this.layout;
    const W = L.cols * L.it, H = L.rows * L.it;
    this.ox = Math.round((GAME_WIDTH - W) / 2 + ROOM_SHIFT_X);
    this.oy = Math.round((GAME_HEIGHT - H) / 2 + 10);
    this.enteredAt = scene.time.now;

    // 바깥(필드)을 덮는 어둠 + 방 배경
    this.keep(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07090d, 1).setOrigin(0, 0));
    const bg = scene.add.image(this.ox - FRAME, this.oy - FRAME, bakeInteriorBg(scene, L)).setOrigin(0, 0);
    this.keep(bg, D_BG);
    for (const f of L.fixtures) {
      const img = scene.add.image(this.ox + f.tx * L.it, this.oy + f.ty * L.it - fixtureRise(f.art), bakeFixture(scene, L, f)).setOrigin(0, 0);
      this.keep(img, this.fixtureDepth(f));
    }
    // 사람
    L.people.forEach((p, i) => {
      const sheet = ensureCharSheet(scene, characterOf(`${enter.seed}:${i}`, { role: p.role }), CHAR_SCALE);
      const pad = (CHAR_CELL - 1 - CHAR_FOOT_Y) * CHAR_SCALE;
      const x = this.ox + p.tx * L.it, y = this.oy + p.ty * L.it;
      const img = scene.add.image(x, y + pad, sheet, charFrameName(p.dir, 0)).setOrigin(0.5, 1);
      this.keep(img, D_OBJ + y * 0.001 + 0.0003);
      this.people.push({ img, p, sheet, dir: p.dir });
    });
    // 나 — 현관 매트 위에서 방을 바라본다
    this.px = this.ox + (L.mat.tx + L.mat.fw / 2) * L.it;
    this.py = this.oy + (L.rows - 0.75) * L.it;
    this.char = new CharacterSprite(scene, this.px, this.py, characterLook(), CHAR_SCALE);
    this.char.image.setScrollFactor(0);
    this.objs.push(this.char.image);
    this.char.setDir('up');
    const bodyH = this.char.bodyHeight;
    this.shadow = scene.add.ellipse(this.px, this.py, bodyH * 0.42, bodyH * 0.12, 0x000000, 0.28);
    this.keep(this.shadow, D_OBJ - 0.5);
    this.hint = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe9b0', fontStyle: 'bold',
      backgroundColor: '#0a1628cc', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setVisible(false);
    this.keep(this.hint, D_HINT);
    this.placeSelf();
    this.greet();
    if (import.meta.env.DEV) assertClear(`interior.${L.key}`, this.frameRect(), fieldReserved(scene));

    // 앉은 자리 고를 거리(↑↓ · Enter/Space) — [F]는 필드 핸들러가 `interact()`로 넘긴다
    this.keyFn = (ev: KeyboardEvent): void => {
      const m = this.menu;
      if (!m) return;
      if (ev.code === 'ArrowUp') { m.sel = (m.sel + m.items.length - 1) % m.items.length; this.paintMenu(); }
      else if (ev.code === 'ArrowDown') { m.sel = (m.sel + 1) % m.items.length; this.paintMenu(); }
      else if (ev.code === 'Enter' || ev.code === 'Space') m.items[m.sel]?.run();
    };
    scene.input.keyboard?.on('keydown', this.keyFn);
  }

  private keep<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T, depth = D_BACK): T {
    o.setScrollFactor(0).setDepth(depth);
    this.objs.push(o);
    return o;
  }

  private fixtureDepth(f: FixtureDef): number {
    return D_OBJ + (this.oy + (f.ty + f.fh) * this.layout.it - 10) * 0.001;
  }

  // ── 바깥에서 묻는 것 ───────────────────────────────

  /** 방 액자(화면) — 겹침 감사 · 가이드 */
  frameRect(): Phaser.Geom.Rectangle {
    const L = this.layout;
    return new Phaser.Geom.Rectangle(this.ox - FRAME, this.oy - FRAME, L.cols * L.it + FRAME * 2, L.rows * L.it + FRAME * 2);
  }

  /** 행동이 걸린 집기의 화면 사각형(가이드 · 하네스) */
  actionRect(action: InteriorAction): Phaser.Geom.Rectangle | null {
    const L = this.layout;
    const f = L.fixtures.find((x) => x.action === action);
    if (!f) return null;
    const rise = fixtureRise(f.art);
    return new Phaser.Geom.Rectangle(this.ox + f.tx * L.it, this.oy + f.ty * L.it - rise, f.fw * L.it, f.fh * L.it + rise);
  }

  /** 현관 매트(화면) */
  matRect(): Phaser.Geom.Rectangle {
    const L = this.layout;
    return new Phaser.Geom.Rectangle(this.ox + L.mat.tx * L.it, this.oy + (L.rows - 1) * L.it, L.mat.fw * L.it, L.it);
  }

  /** 지금 [F]가 닿는 행동 */
  get nearAction(): InteriorAction | null { return this.near?.action ?? null; }
  get menuOpen(): boolean { return !!this.menu; }
  get seated(): boolean { return !!this.seat; }
  get player(): { x: number; y: number } { return { x: this.px, y: this.py }; }

  /** 하네스 — 행동 집기 앞으로 순간 이동 */
  devStandAt(action: InteriorAction): boolean {
    const L = this.layout;
    const f = L.fixtures.find((x) => x.action === action);
    if (!f) return false;
    const cand: [number, number][] = [
      [this.ox + (f.tx + f.fw / 2) * L.it, this.oy + (f.ty + f.fh) * L.it + 18],
      [this.ox + f.tx * L.it - 16, this.oy + (f.ty + f.fh / 2) * L.it + 10],
      [this.ox + (f.tx + f.fw) * L.it + 16, this.oy + (f.ty + f.fh / 2) * L.it + 10],
    ];
    for (const [x, y] of cand) {
      if (!this.collides(x, y)) { this.px = x; this.py = y; this.placeSelf(); this.updateNear(); return this.near?.action === action; }
    }
    return false;
  }

  // ── 매 프레임 ──────────────────────────────────────

  update(delta: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys, blocked: boolean): void {
    this.facePeople();
    if (this.leaving) return;
    if (this.seat) { this.applySeatPose(); this.hint.setVisible(false); return; }
    if (blocked || this.menu) {
      this.char.update(delta, false);
      this.hint.setVisible(false);
      return;
    }
    const running = !!cursors.shift?.isDown;
    const spd = 0.18 * delta * (running ? TUNING.vitals.runSpeedMult : 1);
    let dx = 0, dy = 0;
    if (cursors.left.isDown) { dx = -spd; this.facing = 'left'; }
    else if (cursors.right.isDown) { dx = spd; this.facing = 'right'; }
    if (cursors.up.isDown) { dy = -spd; this.facing = 'up'; }
    else if (cursors.down.isDown) { dy = spd; this.facing = 'down'; }
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (!this.collides(this.px + dx, this.py)) this.px += dx;
    if (!this.collides(this.px, this.py + dy)) this.py += dy;
    this.placeSelf();
    this.char.setDir(this.facing);
    this.char.update(delta, dx !== 0 || dy !== 0, running ? TUNING.vitals.runSpeedMult : 1);
    // 현관 매트를 밟고 아래로 걸어 나가면 밖이다(들어오자마자 다시 나가지 않게 0.5초 유예)
    if (cursors.down.isDown && this.onMatEdge() && this.scene.time.now - this.enteredAt > 500) {
      this.leave();
      return;
    }
    this.updateNear();
  }

  private placeSelf(): void {
    this.char.image.setPosition(this.px, this.py + this.char.footPad).setDepth(D_OBJ + this.py * 0.001);
    this.shadow.setPosition(this.px, this.py);
  }

  /** 사람은 내가 가까이 오면 나를 본다(멀어지면 제 방향으로) */
  private facePeople(): void {
    for (const h of this.people) {
      const dx = this.px - h.img.x, dy = this.py - (h.img.y - (CHAR_CELL - 1 - CHAR_FOOT_Y) * CHAR_SCALE);
      const close = Math.hypot(dx, dy) < this.layout.it * 3.2;
      const dir: CharDir = !close ? h.p.dir : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (dir !== h.dir) { h.dir = dir; h.img.setFrame(charFrameName(dir, 0)); }
    }
  }

  private onMatEdge(): boolean {
    const L = this.layout;
    const c = (this.px - this.ox) / L.it;
    return c >= L.mat.tx && c <= L.mat.tx + L.mat.fw && this.py >= this.oy + L.rows * L.it - 10;
  }

  private collides(px: number, py: number): boolean {
    const L = this.layout;
    if (px < this.ox + 12 || px > this.ox + L.cols * L.it - 12) return true;
    if (py < this.oy + L.it * FLOOR_TOP + 6 || py > this.oy + L.rows * L.it - 6) return true;
    for (const f of L.fixtures) {
      if (f.solid === false) continue;
      const x = this.ox + f.tx * L.it, y = this.oy + f.ty * L.it, w = f.fw * L.it, h = f.fh * L.it;
      if (px > x - 8 && px < x + w + 8 && py > y + 6 && py < y + h + 12) return true;
    }
    return false;
  }

  /** 발밑에서 가장 가까운 행동 집기 (닿는 거리 안에서만) */
  private updateNear(): void {
    const L = this.layout;
    let best: FixtureDef | null = null;
    let bestD = REACH_PX;
    for (const f of L.fixtures) {
      if (!f.action) continue;
      const x0 = this.ox + f.tx * L.it, y0 = this.oy + f.ty * L.it;
      const dx = Math.max(x0 - this.px, 0, this.px - (x0 + f.fw * L.it));
      const dy = Math.max(y0 - this.py, 0, this.py - (y0 + f.fh * L.it));
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = f; }
    }
    this.near = best;
    if (best) {
      this.hint.setText(this.hintOf(best.action!)).setPosition(this.px, this.py - this.char.bodyHeight - 10).setVisible(true);
    } else {
      this.hint.setVisible(false);
    }
  }

  private hintOf(a: InteriorAction): string {
    switch (a) {
      case 'trade': return this.layout.template === 'food' ? '[F] 주문하기' : '[F] 물건 보기';
      case 'consign': return '[F] 위판 창구';
      case 'clinic': return '[F] 진료 접수';
      case 'sit': return '[F] 앉기';
      case 'schedule': return '[F] 경매 시간 보기';
    }
  }

  // ── [F] · ESC ───────────────────────────────────────

  /** [F] — 고를 거리가 떠 있으면 고른 것, 아니면 닿은 집기 */
  interact(): void {
    if (this.leaving) return;
    if (this.menu) { this.menu.items[this.menu.sel]?.run(); return; }
    const f = this.near;
    if (!f?.action) return;
    if (f.action === 'sit') { this.sitOn(f); return; }
    this.host.onAction(f.action);
  }

  /** ESC — 앉아 있으면 일어선다(true). 아니면 false(필드가 나가기 처리) */
  escape(): boolean {
    if (this.seat) { this.standUp(); return true; }
    return false;
  }

  leave(): void {
    if (this.leaving) return;
    if (this.seat) this.standUp();
    this.leaving = true;
    this.hint.setVisible(false);
    this.host.onLeave();
  }

  // ── 앉기 ────────────────────────────────────────────

  private sitOn(f: FixtureDef): void {
    const L = this.layout;
    this.seat = { f, standX: this.px, standY: this.py };
    // 의자 · 의자 칸 중 내게 가까운 칸 가운데에 앉는다
    const cells = Array.from({ length: f.fw }, (_, i) => this.ox + (f.tx + i + 0.5) * L.it);
    const sx = cells.reduce((a, b) => (Math.abs(b - this.px) < Math.abs(a - this.px) ? b : a));
    const sy = this.oy + (f.ty + 0.55) * L.it;
    this.px = sx; this.py = sy;
    this.facing = f.seatDir ?? 'down';
    this.char.update(0, false);
    this.char.setDir(this.facing);
    this.shadow.setVisible(false);
    this.hint.setVisible(false);
    this.applySeatPose();
    const items: MenuItem[] = [];
    if (L.template === 'food') items.push({ label: '식사하기', color: '#ffd9a0', run: () => this.host.onMeal() });
    items.push({ label: '일어나기', run: () => this.standUp() });
    this.openMenu(items);
  }

  /** 엉덩이를 좌석에 맞추고 다리를 잘라 낸다 */
  private applySeatPose(): void {
    const s = this.seat;
    if (!s) return;
    const img = this.char.image;
    const fh = img.frame.height;
    img.setCrop(0, 0, img.frame.width, SEAT_ROWS);
    img.setPosition(this.px, this.py + (fh - SEAT_ROWS) - 6);
    img.setDepth(this.fixtureDepth(s.f) + 0.0005);
  }

  standUp(): void {
    const s = this.seat;
    if (!s) return;
    this.seat = null;
    this.closeMenu();
    this.px = s.standX; this.py = s.standY;
    this.char.image.setCrop();
    this.shadow.setVisible(true);
    this.placeSelf();
  }

  private openMenu(items: MenuItem[]): void {
    this.closeMenu();
    const w = 170, rowH = 30, h = items.length * rowH + 12;
    let x = this.px + 30, y = this.py - this.char.bodyHeight - 6;
    if (x + w > GAME_WIDTH - 8) x = this.px - 30 - w;
    y = Phaser.Math.Clamp(y, 8, GAME_HEIGHT - h - 8);
    const c = this.scene.add.container(x, y).setScrollFactor(0).setDepth(D_MENU);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.96); bg.fillRoundedRect(0, 0, w, h, 7);
    bg.lineStyle(2, 0x2a5a8a, 1); bg.strokeRoundedRect(0, 0, w, h, 7);
    c.add(bg);
    const rows: Phaser.GameObjects.Graphics[] = [];
    items.forEach((it, i) => {
      const ry = 6 + i * rowH;
      const rg = this.scene.add.graphics();
      const t = this.scene.add.text(16, ry + rowH / 2, it.label, {
        fontFamily: FONT, fontSize: '14px', color: it.color ?? '#e8f2fa', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const hit = this.scene.add.rectangle(6, ry + 2, w - 12, rowH - 4, 0xffffff, 0.001).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (this.menu) { this.menu.sel = i; this.paintMenu(); } });
      hit.on('pointerdown', () => it.run());
      rows.push(rg);
      c.add([rg, t, hit]);
    });
    this.menu = { c, items, rows, sel: 0 };
    this.paintMenu();
  }

  private paintMenu(): void {
    const m = this.menu;
    if (!m) return;
    const w = 170, rowH = 30;
    m.rows.forEach((g, i) => {
      g.clear();
      if (i !== m.sel) return;
      g.fillStyle(0x1d3a56, 1); g.fillRoundedRect(6, 6 + i * rowH + 2, w - 12, rowH - 4, 5);
      g.lineStyle(1.5, 0xffd257, 0.9); g.strokeRoundedRect(6, 6 + i * rowH + 2, w - 12, rowH - 4, 5);
    });
  }

  private closeMenu(): void {
    this.menu?.c.destroy();
    this.menu = undefined;
    restoreHandCursor(this.scene);
  }

  // ── 말 · 알림 ───────────────────────────────────────

  /** 들어서면 점원이 한마디 (말풍선 — 몇 초 뒤 옅어진다) */
  private greet(): void {
    const h = this.people.find((x) => x.p.greetKo);
    if (!h) return;
    const t = this.scene.add.text(h.img.x, h.img.y - h.img.displayHeight - 4, h.p.greetKo!, {
      fontFamily: FONT, fontSize: '12px', color: '#1a2a3a', backgroundColor: '#f4f0e4', padding: { x: 7, y: 4 },
    }).setOrigin(0.5, 1);
    // 방 밖으로 나가지 않게
    const fr = this.frameRect();
    t.setX(Phaser.Math.Clamp(t.x, fr.x + t.width / 2 + 4, fr.right - t.width / 2 - 4));
    this.keep(t, D_HINT);
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 600 });
  }

  /** 방 안 바닥 아래쪽(현관 위)에 한 줄 알림 — 필드의 머리 위 알림은 방에 가려 보이지 않는다 */
  flash(msg: string): void {
    this.flashMsg?.destroy();
    const L = this.layout;
    const t = this.scene.add.text(this.ox + (L.cols * L.it) / 2, this.oy + L.rows * L.it - L.it - 16, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#7fe6b0', fontStyle: 'bold',
      backgroundColor: '#0a1628dd', padding: { x: 10, y: 5 }, align: 'center',
    }).setOrigin(0.5);
    this.keep(t, D_HINT + 1);
    this.flashMsg = t;
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 500, onComplete: () => { if (this.flashMsg === t) this.flashMsg = undefined; } });
  }

  destroy(): void {
    this.closeMenu();
    this.scene.input.keyboard?.off('keydown', this.keyFn);
    this.char.image.setCrop();
    for (const o of this.objs) o.destroy();
    this.objs.length = 0;
    this.people = [];
    this.flashMsg = undefined;
  }
}
