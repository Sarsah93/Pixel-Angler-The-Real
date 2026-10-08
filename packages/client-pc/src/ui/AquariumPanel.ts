/**
 * @file AquariumPanel.ts
 * @description 관상 수조 창 (190차) — 살아 있는 고기를 넣어 두고 보는 곳
 *
 * 190차 사용자 지시 「관상 수조 실내 설치」.
 *  - 왼쪽: 수조 단면(물고기가 헤엄친다) + 아래 4칸 — 칸을 누르면 그 고기를 가방으로 꺼낸다(활어로).
 *  - 오른쪽: 넣을 수 있는 **살아 있는(활어)** 고기 — 가방과 쿨러에서. 누르면 수조에 넣는다.
 *    활어 시계는 가방에서 10분이라, 수조에 넣으려면 해수 쿨러로 살려 오거나 갓 낚은 고기를 바로 가져와야 한다.
 *  - 수조 속 고기는 상하지 않는다(살아 있다). 몸길이 45cm 넘는 고기는 들어가지 않는다.
 *  - 창에 조작 안내 문구는 두지 않는다(R11) — 처음 열 때 체험 가이드(`home_aquarium`).
 */

import Phaser from 'phaser';
import { getCreatureById } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import { addPixelIcon } from './PixelIcon.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { enforceTextBounds } from './TextFit.js';
import { GameState } from '../store/GameState.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { CoolerStore } from '../store/CoolerStore.js';
import { HomeStore, TANK_SLOTS, type TankFish } from '../store/HomeStore.js';
import { resolveFishTexture } from '../data/FishTextures.js';

const PANEL_W = 680;
const PANEL_H = 450;
const FONT = '"Noto Sans KR", sans-serif';
const TANK_W = 330;
const TANK_H = 190;
const ROW_H = 34;
const LIST_W = 280;

interface Candidate {
  from: 'bag' | 'cooler';
  /** 가방 아이템 id 또는 쿨러 칸 번호 */
  ref: string | number;
  fish: Omit<TankFish, 'addedMs'>;
}

/** 수조 고기 → 텍스처 키 */
export function tankFishTexture(
  f: { speciesId: string; lengthCm: number; sex: 'M' | 'F'; iconTexture?: string }, scene?: Phaser.Scene,
): string | undefined {
  if (f.iconTexture && (!scene || scene.textures.exists(f.iconTexture))) return f.iconTexture;
  return resolveFishTexture(f.speciesId, f.lengthCm, f.sex);
}

export class AquariumPanel extends DraggablePanel {
  private tankId: string;
  private content!: Phaser.GameObjects.Container;
  private swim: { img: Phaser.GameObjects.Image; vx: number; y0: number; ph: number }[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private scroll = 0;
  private wheelFn: (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => void;
  private updFn: (_t: number, dt: number) => void;
  private puts = 0;
  private takes = 0;
  private onChanged: () => void;

  constructor(scene: Phaser.Scene, tankId: string, x: number, y: number, onClose: () => void, onChanged: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '관상 수조', onClose, depth: 850 });
    this.tankId = tankId;
    this.onChanged = onChanged;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    this.statusText = scene.add.text(PANEL_W / 2, PANEL_H - 20, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fd0e4', align: 'center', wordWrap: { width: PANEL_W - 40 },
    }).setOrigin(0.5);
    this.add(this.statusText);
    this.wheelFn = (p, _o, _dx, dy) => {
      if (!this.listRect().contains(p.x, p.y)) return;
      const max = Math.max(0, this.candidates().length - this.visibleRows());
      const n = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, max);
      if (n !== this.scroll) { this.scroll = n; this.render(); }
    };
    this.updFn = (_t, dt) => this.animate(dt);
    scene.input.on('wheel', this.wheelFn);
    scene.events.on('update', this.updFn);
    this.render();
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input.off('wheel', this.wheelFn);
    this.scene?.events.off('update', this.updFn);
    super.destroy(fromScene);
  }

  // ── 레이아웃 ──────────────────────────────────────────

  private get tankX(): number { return 18; }
  private get tankY(): number { return this.contentTop + 10; }
  private get slotsY(): number { return this.tankY + TANK_H + 12; }
  private get listX(): number { return PANEL_W - 18 - LIST_W; }
  private visibleRows(): number { return Math.floor((PANEL_H - 50 - (this.contentTop + 34)) / ROW_H); }

  tankRect(): Phaser.Geom.Rectangle { return this.localRect(this.tankX - 4, this.tankY - 4, TANK_W + 8, TANK_H + 8); }
  slotsRect(): Phaser.Geom.Rectangle { return this.localRect(this.tankX - 4, this.slotsY - 4, TANK_W + 8, 92); }
  listRect(): Phaser.Geom.Rectangle {
    return this.localRect(this.listX - 4, this.contentTop + 30, LIST_W + 8, this.visibleRows() * ROW_H + 8);
  }

  /** 넣을 수 있는 살아 있는 고기 — 가방(활어) + 쿨러(활어) */
  private candidates(): Candidate[] {
    const out: Candidate[] = [];
    for (const it of InventoryStore.items) {
      if (!it.speciesId || it.condition !== 'live' || it.equipped) continue;
      if (it.subCategory !== '어획물' && it.subCategory !== '채집물') continue;
      out.push({ from: 'bag', ref: it.id, fish: this.fromItem(it) });
    }
    CoolerStore.sync();
    CoolerStore.all().forEach((f, idx) => {
      if (!f || f.condition !== 'live') return;
      out.push({
        from: 'cooler', ref: idx,
        fish: {
          speciesId: f.speciesId, nameKo: f.nameKo, lengthCm: f.lengthCm, weightG: f.weightG, sex: f.sex, iconTexture: f.iconTexture, catchMethod: f.catchMethod,
          ...(f.toxin ? { toxin: true } : {}),   // 234차 — 표지는 수조를 거쳐도 남는다
        },
      });
    });
    return out;
  }

  private fromItem(it: InvItem): Omit<TankFish, 'addedMs'> {
    const nameKo = it.name.replace(/\s*\(\d+(?:\.\d+)?cm\)$/, '');
    return {
      speciesId: it.speciesId!, nameKo, lengthCm: it.lengthCm ?? 0, weightG: it.weightG ?? 0,
      sex: it.sex ?? 'M', iconTexture: it.iconTexture, catchMethod: it.catchMethod,
      // 234차 — 패류독소 · 거래품 표지를 수조로 옮긴다(꺼낼 때 그대로 돌려준다)
      ...(it.toxin ? { toxin: true } : {}), ...(it.traded ? { traded: true } : {}),
    };
  }

  private setStatus(msg: string, color = '#9fd0e4'): void { this.statusText.setColor(color).setText(msg); }

  // ── 그리기 ────────────────────────────────────────────

  private render(): void {
    this.content.removeAll(true);
    this.swim = [];
    const scene = this.scene;
    const tank = HomeStore.tank(this.tankId);
    // 수조 단면
    const g = scene.add.graphics();
    const tx = this.tankX, ty = this.tankY;
    for (let y = 0; y < TANK_H; y += 2) {
      const t = y / TANK_H;
      g.fillStyle(Phaser.Display.Color.GetColor(60 - t * 30, 150 - t * 60, 196 - t * 60), 1);
      g.fillRect(tx, ty + y, TANK_W, 2);
    }
    for (let x = 0; x < TANK_W; x += 2) {
      g.fillStyle((x * 7) % 10 < 4 ? 0xd8c8a0 : 0xb8a888, 1); g.fillRect(tx + x, ty + TANK_H - 14 + ((x * 3) % 4), 2, 14 - ((x * 3) % 4));
    }
    for (const [px, len] of [[24, 70], [34, 50], [TANK_W - 40, 84], [TANK_W - 54, 46]] as const) {
      for (let t = 0; t < len; t += 2) {
        g.fillStyle(t > len - 16 ? 0x6ac46a : 0x3f9e4f, 1);
        g.fillRect(tx + px + Math.round(Math.sin(t / 9) * 3) * 2, ty + TANK_H - 14 - t, 4, 2);
      }
    }
    g.lineStyle(3, 0x9fd6e8, 0.8); g.strokeRect(tx, ty, TANK_W, TANK_H);
    g.fillStyle(0x3a3f45, 1); g.fillRect(tx - 4, ty - 6, TANK_W + 8, 6);
    this.content.add(g);
    tank.forEach((f, i) => {
      const key = tankFishTexture(f, scene);
      if (!key || !scene.textures.exists(key)) return;
      const img = scene.add.image(tx + 60 + i * 60, ty + 40 + (i % 2) * 50, key);
      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement;
      const len = Phaser.Math.Clamp(40 + f.lengthCm * 2.2, 46, 120);
      img.setDisplaySize(len, (src.height / src.width) * len);
      this.content.add(img);
      this.swim.push({ img, vx: (i % 2 ? -1 : 1) * (0.02 + (i % 3) * 0.008), y0: img.y, ph: i * 1.7 });
    });
    if (!tank.length) {
      this.content.add(scene.add.text(tx + TANK_W / 2, ty + TANK_H / 2 - 10, '수조가 비어 있다', {
        fontFamily: FONT, fontSize: '13px', color: '#cfe8f0',
      }).setOrigin(0.5));
    }
    // 4칸
    for (let i = 0; i < TANK_SLOTS; i++) {
      const cw = (TANK_W - 3 * 8) / 4, cx = tx + i * (cw + 8), cy = this.slotsY;
      const box = scene.add.graphics();
      box.fillStyle(0x0e1c2d, 0.92); box.fillRoundedRect(cx, cy, cw, 84, 5);
      box.lineStyle(1.2, 0x1f3d5a, 0.8); box.strokeRoundedRect(cx, cy, cw, 84, 5);
      this.content.add(box);
      const f = tank[i];
      if (!f) continue;
      this.content.add(createItemIcon(scene, cx + cw / 2, cy + 26, { icon: '', iconTexture: tankFishTexture(f, scene), name: f.nameKo }, 40));
      // 234차 — 패류독소 표지(가방 칸과 같은 그림)
      const tx12 = f.toxin ? addPixelIcon(scene, 'toxin', cx + cw - 12, cy + 12, 12) : null;
      if (tx12) this.content.add(tx12);
      this.content.add(scene.add.text(cx + cw / 2, cy + 52, f.nameKo, { fontFamily: FONT, fontSize: '11px', color: '#e8f2fa' }).setOrigin(0.5, 0));
      this.content.add(scene.add.text(cx + cw / 2, cy + 67, `${f.lengthCm} cm`, { fontFamily: FONT, fontSize: '10px', color: '#9fd0e4' }).setOrigin(0.5, 0));
      const hit = scene.add.rectangle(cx + cw / 2, cy + 42, cw, 84, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setStatus(`${f.nameKo} ${f.lengthCm}cm`, '#c8dceb'));
      hit.on('pointerdown', () => this.takeOut(i));
      this.content.add(hit);
    }
    // 넣을 수 있는 고기
    const list = this.candidates();
    this.content.add(scene.add.text(this.listX, this.contentTop + 8, '살아 있는 고기', { fontFamily: FONT, fontSize: '13px', color: '#ffd9a0', fontStyle: 'bold' }));
    const rows = this.visibleRows();
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, list.length - rows));
    const ly0 = this.contentTop + 34;
    if (!list.length) {
      this.content.add(scene.add.text(this.listX, ly0 + 4, '가방과 쿨러에 살아 있는 고기가 없다', {
        fontFamily: FONT, fontSize: '12px', color: '#607b8e', wordWrap: { width: LIST_W },
      }));
    }
    list.slice(this.scroll, this.scroll + rows).forEach((c, k) => {
      const ry = ly0 + k * ROW_H;
      const bg = scene.add.graphics();
      bg.fillStyle(0x0e1c2d, 0.85); bg.fillRoundedRect(this.listX, ry, LIST_W - 10, ROW_H - 4, 4);
      bg.lineStyle(1, 0x1f3d5a, 0.7); bg.strokeRoundedRect(this.listX, ry, LIST_W - 10, ROW_H - 4, 4);
      const icon = createItemIcon(scene, this.listX + 17, ry + (ROW_H - 4) / 2, { icon: '', iconTexture: tankFishTexture(c.fish, scene), name: c.fish.nameKo }, 24);
      const name = scene.add.text(this.listX + 34, ry + (ROW_H - 4) / 2, c.fish.nameKo, { fontFamily: FONT, fontSize: '12px', color: '#e8f2fa' }).setOrigin(0, 0.5);
      const len = scene.add.text(this.listX + LIST_W - 70, ry + (ROW_H - 4) / 2, `${c.fish.lengthCm} cm`, { fontFamily: FONT, fontSize: '11px', color: '#9fd0e4' }).setOrigin(1, 0.5);
      const src = scene.add.text(this.listX + LIST_W - 18, ry + (ROW_H - 4) / 2, c.from === 'bag' ? '가방' : '쿨러', { fontFamily: FONT, fontSize: '10px', color: '#7f97ab' }).setOrigin(1, 0.5);
      const hit = scene.add.rectangle(this.listX + (LIST_W - 10) / 2, ry + (ROW_H - 4) / 2, LIST_W - 10, ROW_H - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.putIn(c));
      this.content.add([bg, icon, name, len, src, hit]);
      // 234차 — 패류독소 표지(가방 칸과 같은 그림) — 줄 배경 위에
      const tx10 = c.fish.toxin ? addPixelIcon(scene, 'toxin', this.listX + 27, ry + 8, 10) : null;
      if (tx10) this.content.add(tx10);
    });
    if (list.length > rows) {
      this.content.add(scene.add.text(this.listX + LIST_W - 10, this.contentTop + 10,
        `${this.scroll + 1}–${Math.min(list.length, this.scroll + rows)} / ${list.length}`, { fontFamily: FONT, fontSize: '11px', color: '#7f97ab' }).setOrigin(1, 0));
    }
    enforceTextBounds(this, PANEL_W - 16, 'AquariumPanel');
    this.applyFix();
  }

  private animate(dt: number): void {
    const x0 = this.x + this.tankX, x1 = x0 + TANK_W;
    for (const s of this.swim) {
      if (!s.img.active) continue;
      const half = s.img.displayWidth / 2;
      let nx = s.img.x + s.vx * dt;
      const ax = this.x + nx;
      if (ax - half < x0 + 6 || ax + half > x1 - 6) { s.vx = -s.vx; nx = s.img.x + s.vx * dt; }
      s.ph += dt / 600;
      s.img.setPosition(nx, s.y0 + Math.sin(s.ph) * 6).setFlipX(s.vx < 0);
    }
  }

  // ── 넣기 · 꺼내기 ────────────────────────────────────

  private putIn(c: Candidate): void {
    const why = HomeStore.tankReason(this.tankId, c.fish.lengthCm);
    if (why) { this.setStatus(why, '#ff9a7a'); return; }
    if (c.from === 'bag') {
      if (!InventoryStore.removeQty(String(c.ref), 1)) return;
    } else if (!CoolerStore.removeAt(Number(c.ref))) return;
    HomeStore.addToTank(this.tankId, c.fish);
    this.puts++;
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.onChanged();
    this.setStatus(`${c.fish.nameKo} — 수조에 넣었다`, '#7fe6b0');
    this.render();
  }

  private takeOut(i: number): void {
    const f = HomeStore.tank(this.tankId)[i];
    if (!f) return;
    if (InventoryStore.freeSlotCount('food') <= 0) { this.setStatus('가방(음식)에 빈 칸이 없다', '#ff9a7a'); return; }
    const creature = getCreatureById(f.speciesId);
    const ok = InventoryStore.addItem({
      id: `inv_${creature ? 'forage' : 'catch'}_${f.speciesId}_${InventoryStore.nextCatchSeq()}`,
      name: `${f.nameKo} (${f.lengthCm}cm)`, icon: '', iconTexture: tankFishTexture(f, this.scene),
      category: 'food', subCategory: creature ? '채집물' : '어획물', ...(creature ? { forageCatch: true } : {}),
      basePrice: Math.max(2000, Math.round(f.weightG * 12)),
      condition: 'live', conditionSinceMs: Date.now(), equippable: false,
      speciesId: f.speciesId, lengthCm: f.lengthCm, weightG: f.weightG, sex: f.sex, catchMethod: f.catchMethod,
      ...(f.toxin ? { toxin: true } : {}), ...(f.traded ? { traded: true } : {}),
    }, 1, { silent: true });
    if (!ok) { this.setStatus('가방(음식)에 빈 칸이 없다', '#ff9a7a'); return; }
    HomeStore.takeFromTank(this.tankId, i);
    this.takes++;
    GameState.markDirty();
    this.scene.events.emit('inventory-changed');
    this.onChanged();
    this.setStatus(`${f.nameKo} — 가방에 넣었다`, '#7fe6b0');
    this.render();
  }

  // ── 첫 열기 가이드 (tour id 'home_aquarium') ──

  private buildTour(): TourOptions {
    return {
      id: 'home_aquarium',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: '관상 수조다. 살아 있는 고기를 넣어 두면 상하지 않고 여기서 헤엄친다. 너무 큰 고기는 들어가지 않는다.',
          target: () => this.tankRect(),
        },
        {
          text: '오른쪽은 가방과 쿨러에 있는 살아 있는 고기다. 갓 낚았거나 해수 쿨러로 살려 온 고기만 뜬다. 하나를 눌러 넣어 보자.',
          target: () => this.listRect(),
          skipIf: () => this.candidates().length === 0,
          wait: () => this.puts > 0,
        },
        {
          text: '아래 칸의 고기를 누르면 살아 있는 채로 가방에 꺼낸다.',
          target: () => this.slotsRect(),
          skipIf: () => HomeStore.tank(this.tankId).length === 0,
        },
      ],
    };
  }
}
