/**
 * @file DayReportPanel.ts
 * @description 하루 결산 창 (211차 — 사용자 지시 「하루 결산 화면 — 인게임 모든 변화」).
 *
 * 한 장(`DayLedgerPage`)을 카드로 펼친다 — 돈 · 낚시 · 이야기 · 성장 · 도감 · 생활 · 가방 · 장비 · 다닌 곳.
 * 무엇을 어떤 말로 보여 줄지는 core `buildLedgerCards`가 정하고, 이 창은 배치와 연출만 맡는다.
 *  - 카드가 6장을 넘으면 아래 ◀ ▶ 로 넘긴다(윈도우드 — 마스크 없음).
 *  - 지난 날이 여럿이면 날짜 양옆 ◀ ▶ 로 다른 날을 본다(침대 「지난 날 돌아보기」).
 *  - 열릴 때 저녁 종소리, 카드가 하나씩 놓일 때 종이 소리.
 * 조작 안내 문구는 창에 쓰지 않는다(R11) — 처음 열 때 가이드(tour 'day_report')가 짚는다.
 */

import Phaser from 'phaser';
import {
  buildLedgerCards, playTimeText, getStoryNpc, REGION_DATABASE,
  type DayLedgerPage, type LedgerCard,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { resolveFishTexture } from '../data/FishTextures.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { playDayChime, playPageFlip, playUiClick } from '../audio/Sfx.js';

const W = 760;
const H = 548;
const FONT = '"Noto Sans KR", sans-serif';
const COLS = 2;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const CARD_W = (W - 24 * 2 - 16) / COLS;
const CARD_H = 108;
const GAP_Y = 10;
const CARDS_TOP = 100;   // 날짜 · 부제 줄 아래(부제 하단 ≈ 88)

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYYMMDD' → 「10월 4일 토요일」 */
function ymdLabel(ymd: string): string {
  const y = Number(ymd.slice(0, 4)), m = Number(ymd.slice(4, 6)), d = Number(ymd.slice(6, 8));
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일 ${DOW_KO[dow]}요일`;
}

const CARD_COLOR: Record<LedgerCard['key'], number> = {
  money: 0xd8b25a, fishing: 0x4fb4e8, story: 0xc58cf0, growth: 0x6fdc8c, codex: 0x7fd6c8,
  life: 0xf09a5a, bag: 0x9fb4c8, gear: 0xe86a5a, places: 0x8fa8ff,
};

export type DayReportMode = 'today' | 'past';

export class DayReportPanel extends DraggablePanel {
  private pages: DayLedgerPage[];
  private dayIdx: number;
  private cardPage = 0;
  private cards: LedgerCard[] = [];
  private bodyC!: Phaser.GameObjects.Container;
  private readonly mode: DayReportMode;
  private readonly keyFn: (ev: KeyboardEvent) => void;

  /**
   * @param pages 보여 줄 장들(오래된 → 최근)
   * @param idx 처음 펼칠 장
   * @param mode 'today' = 방금 잠들며 닫은 하루 · 'past' = 지난 날(자정에 닫혔거나 돌아보기)
   */
  constructor(scene: Phaser.Scene, pages: DayLedgerPage[], idx: number, mode: DayReportMode, onClose: () => void) {
    super(scene, {
      x: Math.round((GAME_WIDTH - W) / 2), y: Math.round((GAME_HEIGHT - H) / 2),
      width: W, height: H, title: mode === 'today' ? '오늘 하루' : '지난 하루', onClose, dim: true, depth: 960,
    });
    this.pages = pages;
    this.dayIdx = Phaser.Math.Clamp(idx, 0, Math.max(0, pages.length - 1));
    this.mode = mode;
    this.bodyC = scene.add.container(0, 0);
    this.add(this.bodyC);
    this.keyFn = (ev) => this.onKey(ev);
    scene.input.keyboard?.on('keydown', this.keyFn);
    this.render(true);
    playDayChime();
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input.keyboard?.off('keydown', this.keyFn);
    super.destroy(fromScene);
  }

  /** 지금 펼친 장 — 검증 하네스가 읽는다 */
  get page(): DayLedgerPage | undefined { return this.pages[this.dayIdx]; }
  get cardCount(): number { return this.cards.length; }
  get cardPages(): number { return Math.max(1, Math.ceil(this.cards.length / PER_PAGE)); }

  private onKey(ev: KeyboardEvent): void {
    if (!this.active) return;
    if (ev.code === 'ArrowRight') this.flipCards(1);
    else if (ev.code === 'ArrowLeft') this.flipCards(-1);
    else if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); this.requestClose(); }
  }

  flipCards(d: number): void {
    const n = Phaser.Math.Clamp(this.cardPage + d, 0, this.cardPages - 1);
    if (n === this.cardPage) return;
    this.cardPage = n;
    playUiClick();
    this.render(true);
  }

  flipDay(d: number): void {
    const n = Phaser.Math.Clamp(this.dayIdx + d, 0, this.pages.length - 1);
    if (n === this.dayIdx) return;
    this.dayIdx = n;
    this.cardPage = 0;
    playUiClick();
    this.render(true);
  }

  // ── 그리기 ──────────────────────────────────────────

  private render(animate: boolean): void {
    this.bodyC.removeAll(true);
    const p = this.page;
    if (!p) return;
    // 불투명 바탕 — 패널 바탕이 반투명이라 집 안 창빛 · 조명이 두 톤으로 비쳤다
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0c1823, 1).fillRect(2, this.contentTop - 6, W - 4, H - this.contentTop + 4);
    this.bodyC.add(bg);
    this.cards = buildLedgerCards(p, {
      region: (id) => (id === 'hometown' ? '고향 집' : REGION_DATABASE.find((r) => r.id === id)?.shortNameKo ?? id),
      npc: (id) => getStoryNpc(id)?.nameKo ?? id,
    });

    // ── 날짜 줄 — 날짜 · 놀던 시간 · 어떻게 닫혔나 ──
    const top = this.contentTop;
    const dateText = this.scene.add.text(W / 2, top + 6, ymdLabel(p.closedYmd ?? p.openedYmd), {
      fontFamily: FONT, fontSize: '20px', color: '#f2ead0', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    const how = p.closedBy === 'sleep' ? '잠들며 마친 하루' : p.closedBy === 'midnight' ? '자정을 넘긴 하루' : '아직 이어지는 하루';
    const sub = this.scene.add.text(W / 2, top + 32, `${how} · ${playTimeText(p.playMs)} 머묾`, {
      fontFamily: FONT, fontSize: '12px', color: '#9fb8c8',
    }).setOrigin(0.5, 0);
    this.bodyC.add([dateText, sub]);
    if (this.pages.length > 1) {
      this.arrowBtn(W / 2 - 170, top + 18, '◀', this.dayIdx > 0, () => this.flipDay(-1), 'dayPrev');
      this.arrowBtn(W / 2 + 170, top + 18, '▶', this.dayIdx < this.pages.length - 1, () => this.flipDay(1), 'dayNext');
    }

    // ── 카드 ──
    if (this.cards.length === 0) {
      const quiet = this.scene.add.text(W / 2, CARDS_TOP + 150, '조용한 하루였다.', {
        fontFamily: FONT, fontSize: '22px', color: '#c8d8e4',
      }).setOrigin(0.5);
      this.bodyC.add(quiet);
    }
    const from = this.cardPage * PER_PAGE;
    this.cards.slice(from, from + PER_PAGE).forEach((c, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = 24 + col * (CARD_W + 16), y = CARDS_TOP + row * (CARD_H + GAP_Y);
      const card = this.drawCard(c, x, y);
      this.bodyC.add(card);
      if (animate) {
        card.setAlpha(0).setY(y + 10);
        this.scene.tweens.add({
          targets: card, alpha: 1, y, duration: 220, delay: 120 + i * 90, ease: 'Cubic.easeOut',
          onStart: () => { if (i < 4) playPageFlip(); },
        });
      }
    });

    // ── 아래 — 카드 넘기기 · 확인 ──
    const by = H - 34;
    if (this.cardPages > 1) {
      this.arrowBtn(W / 2 - 60, by, '◀', this.cardPage > 0, () => this.flipCards(-1), 'cardPrev');
      const pg = this.scene.add.text(W / 2, by, `${this.cardPage + 1} / ${this.cardPages}`, {
        fontFamily: FONT, fontSize: '13px', color: '#c8d8e4',
      }).setOrigin(0.5);
      this.bodyC.add(pg);
      this.arrowBtn(W / 2 + 60, by, '▶', this.cardPage < this.cardPages - 1, () => this.flipCards(1), 'cardNext');
    }
    const okW = 110, okH = 32, okX = W - 24 - okW, okY = by - okH / 2;
    const okG = this.scene.add.graphics();
    okG.fillStyle(0x2f6f58, 1).fillRoundedRect(okX, okY, okW, okH, 6);
    okG.lineStyle(1, 0x7fe6b0, 0.8).strokeRoundedRect(okX, okY, okW, okH, 6);
    const okT = this.scene.add.text(okX + okW / 2, by, '확인', { fontFamily: FONT, fontSize: '15px', color: '#eafff4', fontStyle: 'bold' }).setOrigin(0.5);
    const okHit = this.scene.add.rectangle(okX + okW / 2, by, okW, okH, 0, 0).setInteractive({ useHandCursor: true });
    okHit.on('pointerdown', () => { playUiClick(); this.requestClose(); });
    this.bodyC.add([okG, okT, okHit]);

    enforceTextBounds(this.bodyC, W - 20, 'DayReportPanel');
    this.applyFix();
  }

  private arrowBtn(cx: number, cy: number, glyph: string, enabled: boolean, onClick: () => void, name: string): void {
    const t2 = this.scene.add.text(cx, cy, glyph, {
      fontFamily: FONT, fontSize: '18px', color: enabled ? '#f2ead0' : '#4a5a66',
    }).setOrigin(0.5).setName(name);
    this.bodyC.add(t2);
    if (!enabled) return;
    const hit = this.scene.add.rectangle(cx, cy, 34, 30, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
    this.bodyC.add(hit);
  }

  private drawCard(c: LedgerCard, x: number, y: number): Phaser.GameObjects.Container {
    const box = this.scene.add.container(x, y);
    const accent = CARD_COLOR[c.key];
    const g = this.scene.add.graphics();
    g.fillStyle(0x0f1d2b, 0.96).fillRoundedRect(0, 0, CARD_W, CARD_H, 8);
    g.lineStyle(1, accent, 0.55).strokeRoundedRect(0, 0, CARD_W, CARD_H, 8);
    g.fillStyle(accent, 0.9).fillRect(10, 12, 4, 16);   // 갈래 색 표지(카드마다 같은 자리)
    box.add(g);

    const title = this.scene.add.text(20, 10, c.titleKo, { fontFamily: FONT, fontSize: '14px', color: '#e8eef4', fontStyle: 'bold' });
    box.add(title);
    const rightEdge = CARD_W - 12;
    // 본문 줄의 오른쪽 끝 — 고기 그림이 있으면 그 앞까지
    let lineEdge = rightEdge;

    if (c.headline) {
      const color = c.tone === 'good' ? '#7fe6b0' : c.tone === 'bad' ? '#ff9a8a' : '#f2d98a';
      const hl = this.scene.add.text(rightEdge, 8, c.headline, { fontFamily: FONT, fontSize: '18px', color, fontStyle: 'bold' }).setOrigin(1, 0);
      box.add(hl);
      // 제목과 겹치면 줄인다
      const room = rightEdge - (20 + title.width + 12);
      if (hl.width > room) clampTextWidth(hl, Math.max(40, room));
    }

    // 낚시 카드 — 가장 큰 고기 그림을 머리글 아래 오른쪽에
    if (c.fishSpeciesId) {
      const tex = resolveFishTexture(c.fishSpeciesId, 40, 'M');
      if (tex && this.scene.textures.exists(tex)) {
        const img = this.scene.add.image(CARD_W - 62, 38 + (CARD_H - 44) / 2, tex);
        const k = Math.min(96 / img.width, (CARD_H - 50) / img.height);
        img.setScale(k);
        box.add(img);
        lineEdge = CARD_W - 120;
      }
    }

    let ly = 38;
    for (const line of c.lines) {
      if (ly > CARD_H - 16) break;
      const tx = this.scene.add.text(20, ly, line, { fontFamily: FONT, fontSize: '12px', color: '#b8c8d4' });
      clampTextWidth(tx, lineEdge - 20);
      box.add(tx);
      ly += 15;
    }
    return box;
  }

  // ── 첫 열기 가이드 (tour 'day_report') ──────────────

  private cardsRect(): Phaser.Geom.Rectangle {
    return this.localRect(24, CARDS_TOP, W - 48, ROWS * CARD_H + (ROWS - 1) * GAP_Y);
  }

  private buildTour(): TourOptions {
    return {
      id: 'day_report',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [
        {
          text: this.mode === 'today'
            ? '하루를 마쳤다. 오늘 바뀐 것들을 카드로 모아 두었다 — 돈 · 낚시 · 이야기 · 성장 · 생활 순이다.'
            : '자는 사이 하루가 지나갔다. 지난 하루에 있었던 일을 모아 두었다.',
          target: () => this.cardsRect(),
        },
        {
          text: '카드가 더 있으면 아래 화살표로 넘긴다.',
          target: () => this.localRect(W / 2 - 80, H - 50, 160, 32),
          skipIf: () => this.cardPages <= 1,
        },
        {
          text: '지난 날들은 침대에서 다시 펼쳐 볼 수 있다.',
          target: () => this.localRect(W - 24 - 110, H - 50, 110, 32),
        },
      ],
    };
  }
}

