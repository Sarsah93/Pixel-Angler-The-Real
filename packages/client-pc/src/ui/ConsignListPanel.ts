/**
 * @file ConsignListPanel.ts
 * @description 위판장에 맡겨 둔 물건 (214차 — 사용자 지시 「맡긴 물건 목록을 보거나 찾아오는 기능」).
 *
 * 213차 「맡겨 두기」로 큐에 들어간 묶음을 한 줄씩 보여 준다 — 무엇을(첫 물건 + 나머지 수) · 활어/선어 · 다음 경매가 언제인지.
 *  - **찾아오기**는 위판장 창구(상점 위판 탭)에서 연 창에서만 된다(`canRetrieve`). 일지 「나날」에서 열면 보기만 한다.
 *  - 찾아온 물건은 맡긴 그대로 가방에 돌아온다(맡긴 동안 신선도는 멈춰 있었다).
 *  - 정산(경매가 끝나 돈이 들어옴)은 필드 · 집이 1초마다 하므로, 창이 열린 동안 목록이 줄어들 수 있다 → 1초마다 다시 그린다.
 *
 * 처음 열 때 체험 가이드(R11 — `consign_list`).
 */

import Phaser from 'phaser';
import { kstYmd } from '@tra/core';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { ConsignQueue, type ConsignBatch } from '../store/ConsignQueue.js';
import { retrieveConsignment } from '../store/ConsignSettle.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { getLocale } from '../i18n/I18n.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { playPickup } from '../audio/Sfx.js';

const W = 520;
const ROW_H = 46;
const MAX_ROWS = 6;
const FONT = '"Noto Sans KR", sans-serif';

const CAT_LABEL: Record<string, string> = { fish_live: '활어', fish_fresh: '선어', shellfish: '패류' };

export interface ConsignListConfig {
  onClose: () => void;
  /** 위판장 창구에서 열었다 — [찾아오기]를 쓸 수 있다 */
  canRetrieve: boolean;
  /** 찾아온 뒤(씬이 로그 · 가방 갱신) */
  onRetrieved?: (count: number) => void;
}

export class ConsignListPanel extends DraggablePanel {
  private readonly cfg: ConsignListConfig;
  private bodyC?: Phaser.GameObjects.Container;
  private scroll = 0;
  private lastKey = '';
  private tick?: Phaser.Time.TimerEvent;
  private wheel?: (p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void;
  /** 가이드가 짚는 자리(패널 로컬) */
  private firstRowRect: Phaser.Geom.Rectangle | null = null;
  private firstBtnRect: Phaser.Geom.Rectangle | null = null;

  constructor(scene: Phaser.Scene, cfg: ConsignListConfig) {
    // 창 높이는 열 때의 묶음 수에 맞춘다(최소 2줄 · 최대 MAX_ROWS — 넘치면 휠)
    const rows = Phaser.Math.Clamp(ConsignQueue.pending.length, 2, MAX_ROWS);
    const h = 32 + 20 + rows * ROW_H + 52;
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: Math.max(16, (GAME_HEIGHT - h) / 2),
      width: W, height: h, title: '맡겨 둔 물건', onClose: cfg.onClose, depth: 896,
    });
    this.cfg = cfg;
    this.wheel = (p, _o, _dx, dy) => {
      if (!Phaser.Geom.Rectangle.Contains(this.panelBounds(), p.x, p.y)) return;
      const max = Math.max(0, ConsignQueue.pending.length - MAX_ROWS);
      const next = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, max);
      if (next !== this.scroll) { this.scroll = next; this.render(true); }
    };
    scene.input.on('wheel', this.wheel);
    this.render(true);
    // 정산으로 줄어들 수 있다 — 바뀌었을 때만 다시 그린다
    this.tick = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.render(false) });
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    if (this.tick) { this.tick.remove(); this.scene?.time?.removeEvent(this.tick); }
    if (this.wheel) this.scene?.input?.off('wheel', this.wheel);
    super.destroy(fromScene);
  }

  /** 다음 경매 시각 — 오늘/내일 HH:MM, 그 뒤는 M월 D일 HH:MM */
  private whenText(ms: number): string {
    const k = new Date(ms + 9 * 3_600_000);
    const hm = `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
    const d = kstYmd(new Date(ms));
    const today = kstYmd(new Date());
    const tomorrow = kstYmd(new Date(Date.now() + 86_400_000));
    if (d === today) return `오늘 ${hm}`;
    if (d === tomorrow) return `내일 ${hm}`;
    return getLocale() === 'en' ? `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${hm}` : `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${hm}`;
  }

  private batchTitle(b: ConsignBatch): string {
    const first = b.items[0]?.name ?? '';
    const rest = b.items.length - 1;
    return rest > 0 ? `${first} 외 ${rest}` : first;
  }

  private render(force: boolean): void {
    const list = ConsignQueue.pending;
    const key = list.map((b) => b.id).join(',') + `|${this.scroll}`;
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, Math.max(0, list.length - MAX_ROWS));
    this.bodyC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.bodyC = c; this.add(c);
    const top = this.contentTop + 10;
    this.firstRowRect = null; this.firstBtnRect = null;

    if (list.length === 0) {
      const t = this.scene.add.text(W / 2, top + 60, '맡겨 둔 물건이 없다.', {
        fontFamily: FONT, fontSize: '13px', color: '#8fa8bc',
      }).setOrigin(0.5, 0);
      c.add(t);
    }

    const end = Math.min(list.length, this.scroll + MAX_ROWS);
    for (let i = this.scroll; i < end; i++) {
      const b = list[i]!;
      const y = top + (i - this.scroll) * ROW_H;
      const g = this.scene.add.graphics();
      g.fillStyle(0x0e1c2a, 0.75); g.fillRoundedRect(12, y, W - 24, ROW_H - 6, 4);
      g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(12, y, W - 24, ROW_H - 6, 4);
      // 갈래 칩(활어 · 선어)
      const live = b.category === 'fish_live';
      g.fillStyle(live ? 0x1f5a3a : 0x34506a, 1); g.fillRoundedRect(20, y + 10, 40, 20, 3);
      c.add(g);
      const chip = this.scene.add.text(40, y + 20, CAT_LABEL[b.category] ?? b.category, {
        fontFamily: FONT, fontSize: '11px', color: live ? '#b8f5d0' : '#cfe3f5', fontStyle: 'bold',
      }).setOrigin(0.5);
      const name = this.scene.add.text(70, y + 6, this.batchTitle(b), {
        fontFamily: FONT, fontSize: '13px', color: '#e8f4fd',
      });
      const btnW = 84;
      const nameMax = W - 24 - 70 - (this.cfg.canRetrieve ? btnW + 16 : 8);
      clampTextWidth(name, nameMax);
      const when = this.scene.add.text(70, y + 23, `다음 경매 ${this.whenText(b.dueAtMs)}`, {
        fontFamily: FONT, fontSize: '11px', color: '#9fd0e4',
      });
      clampTextWidth(when, nameMax);
      c.add([chip, name, when]);
      if (i === this.scroll) this.firstRowRect = new Phaser.Geom.Rectangle(12, y, W - 24, ROW_H - 6);

      if (this.cfg.canRetrieve) {
        const bx = W - 20 - btnW, by = y + 7;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1f3045, 0.95); bg.fillRoundedRect(bx, by, btnW, 26, 4);
        bg.lineStyle(1, 0x5cd0ff, 0.9); bg.strokeRoundedRect(bx, by, btnW, 26, 4);
        const bt = this.scene.add.text(bx + btnW / 2, by + 13, '찾아오기', {
          fontFamily: FONT, fontSize: '12px', color: '#bfe9ff', fontStyle: 'bold',
        }).setOrigin(0.5);
        const hit = this.scene.add.rectangle(bx + btnW / 2, by + 13, btnW, 26, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          const n = retrieveConsignment(b.id);
          if (n > 0) { playPickup(); this.cfg.onRetrieved?.(n); }
          this.render(true);
          restoreHandCursor(this.scene);
        });
        c.add([bg, bt, hit]);
        if (i === this.scroll) this.firstBtnRect = new Phaser.Geom.Rectangle(bx, by, btnW, 26);
      }
    }

    // 넘치면 위치 표기(조용한 잘림 금지)
    if (list.length > MAX_ROWS) {
      const pos = this.scene.add.text(W - 16, top + MAX_ROWS * ROW_H - 4, `${this.scroll + 1}–${end} / ${list.length}`, {
        fontFamily: FONT, fontSize: '10px', color: '#6a8aa0',
      }).setOrigin(1, 0);
      c.add(pos);
    }
    // 창구 밖에서 열었으면 어디서 찾을 수 있는지 한 줄(조작 안내가 아니라 장소)
    if (!this.cfg.canRetrieve && list.length > 0) {
      const note = this.scene.add.text(W / 2, this.height - 26, '경매 전에 도로 가져오려면 위판장 창구로.', {
        fontFamily: FONT, fontSize: '11px', color: '#8fa8bc',
      }).setOrigin(0.5, 0);
      c.add(note);
    }
    enforceTextBounds(c, W - 20, 'ConsignListPanel');
    this.applyFix();
  }

  private buildTour(): TourOptions {
    const row = (): Phaser.Geom.Rectangle | null => (this.firstRowRect ? this.localRect(this.firstRowRect.x, this.firstRowRect.y, this.firstRowRect.width, this.firstRowRect.height) : null);
    const btn = (): Phaser.Geom.Rectangle | null => (this.firstBtnRect ? this.localRect(this.firstBtnRect.x, this.firstBtnRect.y, this.firstBtnRect.width, this.firstBtnRect.height) : null);
    return {
      id: 'consign_list',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        { text: '위판장에 맡겨 둔 물건이 여기 모인다. 다음 경매가 끝나면 값이 들어오고, 안 팔린 것은 가방으로 돌아온다.', target: () => row() ?? this.panelBounds() },
        { text: '경매 전에 마음이 바뀌면 여기서 도로 찾아올 수 있다. 맡긴 그대로 돌아온다.', target: btn, skipIf: () => !this.firstBtnRect },
      ],
    };
  }
}
