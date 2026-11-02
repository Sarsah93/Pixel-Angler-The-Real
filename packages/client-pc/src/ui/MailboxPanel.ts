/**
 * @file MailboxPanel.ts
 * @description 296차 — 집 앞 우편함 창(사용자 결정 2026-11-02 「상호작용 '우편함 열기(F)'을 통해 팝업되는 메일함에서 첨부파일로 …」).
 *
 *  위 = 편지 목록(최신이 앞 · 안 읽은 것은 점 · 붙어 온 물건 수) · 아래 = 고른 편지(보낸 곳 · 본문 · 첨부 그림 · 「받기」/「지우기」).
 *  「받기」는 들어간 것만 가방으로 옮기고 자리가 모자라면 남은 것은 우편함에 둔다(`store/MailDeliver.takeMail`).
 *  첨부가 남은 편지는 지울 수 없다. 처음 열면 체험 가이드(`GuideTour` id `mailbox`)가 짚는다(R11 — 창에 조작 문구 없음).
 */

import Phaser from 'phaser';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { createItemIcon } from './ItemIcon.js';
import { getLocale } from '../i18n/I18n.js';
import { playPickup } from '../audio/Sfx.js';
import { MailboxStore } from '../store/MailboxStore.js';
import { takeMail, takeAllMail, deleteMail } from '../store/MailDeliver.js';

const W = 500;
const ROW_H = 46;
const MAX_ROWS = 5;
const DETAIL_H = 180;
const FONT = '"Noto Sans KR", sans-serif';
const PAD = 12;

export interface MailboxPanelConfig {
  onClose: () => void;
  /** 가방이 바뀌었다(필드 HUD · 가방 창 갱신) */
  onChanged?: () => void;
  /** 필드 로그 한 줄 */
  log?: (line: string) => void;
}

export class MailboxPanel extends DraggablePanel {
  private readonly cfg: MailboxPanelConfig;
  private bodyC?: Phaser.GameObjects.Container;
  private scroll = 0;
  private sel: string | null = null;
  private status = '';
  private statusWarn = false;
  private lastKey = '';
  private tick?: Phaser.Time.TimerEvent;
  private wheel?: (p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void;
  /** 가이드가 짚는 자리(패널 로컬) */
  private rectList = new Phaser.Geom.Rectangle();
  private rectDetail = new Phaser.Geom.Rectangle();
  private rectTake: Phaser.Geom.Rectangle | null = null;

  constructor(scene: Phaser.Scene, cfg: MailboxPanelConfig) {
    const h = 32 + 8 + 20 + MAX_ROWS * ROW_H + 8 + DETAIL_H + PAD;
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: Math.max(16, (GAME_HEIGHT - h) / 2),
      width: W, height: h, title: '우편함', onClose: cfg.onClose, depth: 820,
    });
    this.cfg = cfg;
    this.sel = MailboxStore.all[0]?.id ?? null;
    if (this.sel) MailboxStore.markRead(this.sel);
    this.wheel = (p, _o, _dx, dy) => {
      if (!Phaser.Geom.Rectangle.Contains(this.panelBounds(), p.x, p.y)) return;
      const max = Math.max(0, MailboxStore.all.length - MAX_ROWS);
      const next = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, max);
      if (next !== this.scroll) { this.scroll = next; this.render(true); }
    };
    scene.input.on('wheel', this.wheel);
    this.render(true);
    // 열어 둔 사이 편지가 올 수 있다 — 바뀌었을 때만 다시 그린다
    this.tick = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.render(false) });
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    if (this.tick) { this.tick.remove(); this.scene?.time?.removeEvent(this.tick); }
    if (this.wheel) this.scene?.input?.off('wheel', this.wheel);
    super.destroy(fromScene);
  }

  /** 온 때 — 오늘은 HH:MM, 그 밖은 M월 D일 HH:MM */
  private whenText(ms: number): string {
    const k = new Date(ms + 9 * 3_600_000);
    const hm = `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
    const now = new Date(Date.now() + 9 * 3_600_000);
    if (k.getUTCFullYear() === now.getUTCFullYear() && k.getUTCMonth() === now.getUTCMonth() && k.getUTCDate() === now.getUTCDate()) return hm;
    return getLocale() === 'en' ? `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${hm}` : `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${hm}`;
  }

  private stateKey(): string {
    return MailboxStore.all.map((l) => `${l.id}:${l.read ? 1 : 0}:${l.items.length}`).join(',') + `|${this.scroll}|${this.sel}|${this.status}`;
  }

  private render(force: boolean): void {
    const list = MailboxStore.all;
    // 고른 편지가 없거나(지운 뒤) 사라졌으면 맨 위 편지를 고른다 — 열어 둔 사이 새 편지가 와도 「받기」가 바로 보인다
    if (!this.sel || !MailboxStore.byId(this.sel)) {
      this.sel = list[0]?.id ?? null;
      if (this.sel) MailboxStore.markRead(this.sel);
    }
    const key = this.stateKey();
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, list.length - MAX_ROWS));
    this.bodyC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.bodyC = c; this.add(c);
    const s = this.scene;
    const top = this.contentTop + 8;
    this.rectTake = null;

    // ── 머리 줄 — 편지 수 · 모두 받기
    const withItems = MailboxStore.withItemsCount;
    const head = s.add.text(PAD + 2, top + 2, list.length ? `편지 ${list.length}통${MailboxStore.unreadCount ? ` · 안 읽음 ${MailboxStore.unreadCount}` : ''}` : '편지가 없다.', {
      fontFamily: FONT, fontSize: '12px', color: '#9fb8cc',
    });
    c.add(head);
    if (withItems > 0) {
      const bw = 92;
      c.add(this.button(W - PAD - bw, top - 2, bw, 22, '모두 받기', () => {
        const r = takeAllMail();
        this.afterTake(r.taken, r.left);
      }));
    }

    // ── 목록
    const listY = top + 24;
    this.rectList.setTo(PAD, listY, W - PAD * 2, MAX_ROWS * ROW_H);
    const end = Math.min(list.length, this.scroll + MAX_ROWS);
    for (let i = this.scroll; i < end; i++) {
      const l = list[i]!;
      const y = listY + (i - this.scroll) * ROW_H;
      const selected = l.id === this.sel;
      const g = s.add.graphics();
      g.fillStyle(selected ? 0x16304a : 0x0e1c2a, 0.85); g.fillRoundedRect(PAD, y, W - PAD * 2, ROW_H - 6, 4);
      g.lineStyle(1, selected ? 0x5cd0ff : 0x1c3d5a, 1); g.strokeRoundedRect(PAD, y, W - PAD * 2, ROW_H - 6, 4);
      if (!l.read) { g.fillStyle(0xffd257, 1); g.fillCircle(PAD + 12, y + (ROW_H - 6) / 2, 3); }   // 안 읽음 점
      c.add(g);
      const from = s.add.text(PAD + 24, y + 5, l.from, { fontFamily: FONT, fontSize: '11px', color: '#8fb3c9' });
      const title = s.add.text(PAD + 24, y + 20, l.title, { fontFamily: FONT, fontSize: '13px', color: l.read ? '#cfe3f5' : '#ffffff', fontStyle: l.read ? 'normal' : 'bold' });
      const when = s.add.text(W - PAD - 10, y + 5, this.whenText(l.atMs), { fontFamily: FONT, fontSize: '10px', color: '#6f8ea4' }).setOrigin(1, 0);
      c.add([from, title, when]);
      let rightW = when.width + 12;
      if (l.items.length) {
        const chipW = 56;
        const cg = s.add.graphics();
        cg.fillStyle(0x1f5a3a, 1); cg.fillRoundedRect(W - PAD - 10 - chipW, y + 20, chipW, 16, 3);
        const ct = s.add.text(W - PAD - 10 - chipW / 2, y + 28, `물건 ${l.items.length}`, { fontFamily: FONT, fontSize: '10px', color: '#b8f5d0', fontStyle: 'bold' }).setOrigin(0.5);
        c.add([cg, ct]);
        rightW = Math.max(rightW, chipW + 12);
      }
      clampTextWidth(from, W - PAD * 2 - 24 - rightW - 8);
      clampTextWidth(title, W - PAD * 2 - 24 - rightW - 8);
      const hit = s.add.rectangle(PAD + (W - PAD * 2) / 2, y + (ROW_H - 6) / 2, W - PAD * 2, ROW_H - 6, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.sel = l.id; MailboxStore.markRead(l.id); this.status = '';
        this.render(true); restoreHandCursor(s);
      });
      c.add(hit);
    }
    if (list.length > MAX_ROWS) {
      const pos = s.add.text(W - PAD, listY + MAX_ROWS * ROW_H - 4, `${this.scroll + 1}–${end} / ${list.length}`, { fontFamily: FONT, fontSize: '10px', color: '#6a8aa0' }).setOrigin(1, 1);
      c.add(pos);
    }

    // ── 고른 편지
    const dy = listY + MAX_ROWS * ROW_H + 8;
    this.rectDetail.setTo(PAD, dy, W - PAD * 2, DETAIL_H);
    const dg = s.add.graphics();
    dg.fillStyle(0x0b1620, 0.9); dg.fillRoundedRect(PAD, dy, W - PAD * 2, DETAIL_H, 4);
    dg.lineStyle(1, 0x1c3d5a, 1); dg.strokeRoundedRect(PAD, dy, W - PAD * 2, DETAIL_H, 4);
    c.add(dg);
    const l = this.sel ? MailboxStore.byId(this.sel) : undefined;
    if (!l) {
      const t = s.add.text(W / 2, dy + DETAIL_H / 2, '편지를 고르면 여기에 내용이 보인다.', { fontFamily: FONT, fontSize: '12px', color: '#6f8ea4' }).setOrigin(0.5);
      c.add(t);
    } else {
      const fromT = s.add.text(PAD + 10, dy + 8, `${l.from} · ${this.whenText(l.atMs)}`, { fontFamily: FONT, fontSize: '11px', color: '#8fb3c9' });
      const titleT = s.add.text(PAD + 10, dy + 24, l.title, { fontFamily: FONT, fontSize: '14px', color: '#ffffff', fontStyle: 'bold' });
      clampTextWidth(fromT, W - PAD * 2 - 20); clampTextWidth(titleT, W - PAD * 2 - 20);
      const body = s.add.text(PAD + 10, dy + 46, l.body, { fontFamily: FONT, fontSize: '12px', color: '#dbe9f4', lineSpacing: 4, wordWrap: { width: W - PAD * 2 - 20 } });
      c.add([fromT, titleT, body]);
      // 본문이 길면 첨부 줄 위까지만(세로 넘침 금지 — 아래로는 잘라 낼 수 없으니 줄을 줄인다)
      const attachY = dy + DETAIL_H - 54;
      while (body.height > attachY - 6 - body.y && body.text.length > 20) body.setText(body.text.slice(0, -4).replace(/\s+$/, '') + '…');
      // 첨부
      const icons = l.items.slice(0, 9);
      let ix = PAD + 10;
      for (const a of icons) {
        const ig = s.add.graphics();
        ig.fillStyle(0x16263a, 1); ig.fillRoundedRect(ix, attachY, 36, 36, 3);
        ig.lineStyle(1, 0x2d4d6a, 1); ig.strokeRoundedRect(ix, attachY, 36, 36, 3);
        c.add(ig);
        c.add(createItemIcon(s, ix + 18, attachY + 18, a.tpl, 28));
        if (a.qty > 1) {
          const q = s.add.text(ix + 34, attachY + 35, `${a.qty}`, { fontFamily: FONT, fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 1);
          c.add(q);
        }
        ix += 40;
      }
      if (l.items.length > icons.length) {
        const more = s.add.text(ix + 2, attachY + 18, `+${l.items.length - icons.length}`, { fontFamily: FONT, fontSize: '12px', color: '#9fb8cc' }).setOrigin(0, 0.5);
        c.add(more);
      }
      if (!l.items.length && l.kind !== 'notice') {
        const none = s.add.text(PAD + 10, attachY + 18, '붙어 온 물건은 다 받았다.', { fontFamily: FONT, fontSize: '11px', color: '#6f8ea4' }).setOrigin(0, 0.5);
        c.add(none);
      }
      // 단추 — 받기(첨부가 있을 때) · 지우기(첨부가 없을 때)
      const bw = 84, bx = W - PAD - 10 - bw, by = attachY + 6;
      if (l.items.length) {
        c.add(this.button(bx, by, bw, 26, '받기', () => {
          const r = takeMail(l.id);
          this.afterTake(r.taken, r.left);
        }, true));
        this.rectTake = new Phaser.Geom.Rectangle(bx, by, bw, 26);
      } else {
        c.add(this.button(bx, by, bw, 26, '지우기', () => {
          if (deleteMail(l.id)) { this.sel = MailboxStore.all[0]?.id ?? null; this.status = ''; this.render(true); }
        }));
      }
    }
    // 상태 줄(결과 · 사유)
    if (this.status) {
      const st = s.add.text(PAD + 10, dy + DETAIL_H - 14, this.status, { fontFamily: FONT, fontSize: '11px', color: this.statusWarn ? '#ffb3a7' : '#b8f5d0' }).setOrigin(0, 0.5);
      clampTextWidth(st, W - PAD * 2 - 20 - 100);
      c.add(st);
    }
    enforceTextBounds(c, W - 8, 'MailboxPanel');
    this.applyFix();
  }

  private afterTake(taken: number, left: number): void {
    if (taken > 0) { playPickup(); this.cfg.onChanged?.(); }
    if (left > 0) { this.status = taken ? `물건 ${taken}건을 받았다 — 가방에 자리가 없어 ${left}건은 남겨 두었다.` : '가방에 자리가 없어 받지 못했다 — 한 칸 비우고 다시 받는다.'; this.statusWarn = true; }
    else if (taken > 0) { this.status = `물건 ${taken}건을 받았다.`; this.statusWarn = false; }
    if (taken > 0) this.cfg.log?.(`[우편] 우편함에서 물건 ${taken}건을 받았다${left ? ` (자리가 없어 ${left}건은 남김)` : ''}`);
    this.render(true);
    restoreHandCursor(this.scene);
  }

  private button(x: number, y: number, w: number, h: number, label: string, onClick: () => void, primary = false): Phaser.GameObjects.Container {
    const s = this.scene;
    const c = s.add.container(0, 0);
    const bg = s.add.graphics();
    bg.fillStyle(primary ? 0x1f4d3a : 0x1f3045, 0.95); bg.fillRoundedRect(x, y, w, h, 4);
    bg.lineStyle(1, primary ? 0x7df0b0 : 0x5cd0ff, 0.9); bg.strokeRoundedRect(x, y, w, h, 4);
    const t = s.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '12px', color: primary ? '#d8ffe8' : '#bfe9ff', fontStyle: 'bold' }).setOrigin(0.5);
    const hit = s.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    c.add([bg, t, hit]);
    return c;
  }

  private buildTour(): TourOptions {
    const r = (q: Phaser.Geom.Rectangle | null): Phaser.Geom.Rectangle | null => (q ? this.localRect(q.x, q.y, q.width, q.height) : null);
    return {
      id: 'mailbox',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        { text: '집 앞 우편함이다. 위판장에서 팔리지 않은 물건이나, 가방이 가득해 받지 못한 물건이 편지에 붙어 여기로 온다.', target: () => r(this.rectList) },
        { text: '편지를 고르면 아래에 내용과 붙어 온 물건이 보인다. 붙어 온 물건은 든 동안 상하지 않는다.', target: () => r(this.rectDetail) },
        { text: '「받기」를 누르면 붙어 온 물건이 가방에 들어온다. 자리가 모자라면 남은 것은 우편함에 그대로 있다.', target: () => r(this.rectTake), skipIf: () => !this.rectTake },
      ],
    };
  }
}
