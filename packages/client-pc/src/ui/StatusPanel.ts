/**
 * @file StatusPanel.ts
 * @description 스테이터스 창 (S 키 토글, 드래그 이동 가능)
 *
 * 다차원 환경에서 캐릭터가 중심을 잡고 물리력을 행사하기 위한 신체적/지적 상태창.
 * 레벨/경험치/HP/피로도 + 물리 스탯 4종(근력/민첩/평형감각/조석 해석력)과
 * 각 스탯의 물리 기여 설명을 표시한다. (스탯 성장 시스템은 추후 연동)
 *
 * 188차 — 처음 열 때 체험 가이드(`GuideTour` — 'status'). 읽기 전용 창이라 직접 해 볼 일은
 *   **창 옮기기**(제목줄 드래그) 하나다 — 모든 창에 공통인 조작을 여기서 한 번 익힌다.
 *   하단 개발 메모(「…반영될 예정입니다」)는 지웠다(143차 AI 메모성 문구 제거 원칙).
 *
 * 203차 — 오른쪽 「타이틀」 칸: 단 타이틀(이름 · 레어도 · 사연 · 효과 + [떼기]) → 얻은 타이틀 줄(누르면 단다) →
 *   아직 못 얻은 것은 「??? × N」 한 줄(이름·조건 비공개 — R2). 줄이 넘치면 휠로 넘긴다(윈도우드 렌더).
 *   이 칸은 기존 'status' 가이드를 이미 본 사람도 보도록 별도 가이드('status_titles')를 둔다.
 */

import Phaser from 'phaser';
import {
  DEFAULT_ANGLER_STATS, ANGLER_STAT_INFO, AnglerStats,
  TITLE_RARITY_LABEL_KO, titleEffectLabelKo, type TitleDef,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { TitleStore } from '../store/TitleStore.js';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { TITLE_RARITY_COLOR, TITLE_RARITY_HEX } from './TitleBanner.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

/** 왼쪽(몸 상태) 칸 폭 */
const PANEL_W = 400;
/** 203차 — 오른쪽 타이틀 칸 폭 */
const TITLE_W = 300;
const PANEL_H = 520;
const FONT = '"Noto Sans KR", sans-serif';
const ROW_H = 34;

export class StatusPanel extends DraggablePanel {
  /** 체험 가이드 하이라이트용 구획 y (패널 로컬) */
  private readonly secY = { head: 0, bars: 0, stats: 0, statsEnd: 0 };
  /** 203차 — 타이틀 칸(장착·목록이 바뀌면 통째로 다시 그린다) */
  private titleC: Phaser.GameObjects.Container;
  private titleScroll = 0;
  private titleMaxScroll = 0;
  /** 가이드 하이라이트용 — 단 타이틀 카드 · 목록 구획(패널 로컬 y) */
  private readonly tSec = { cardY: 0, cardH: 0, listY: 0, listH: 0 };
  private readonly offTitle: () => void;
  private readonly wheel: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W + TITLE_W, height: PANEL_H, title: '내 상태', onClose, depth: 810 });

    const p = GameState.player;
    let cy = this.contentTop + 10;
    this.secY.head = cy;

    // ── 기본 정보 ──
    const nick = scene.add.text(20, cy, p.nickname, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#e8f4fd', fontStyle: 'bold',
    });
    // 188차 — 임계는 실제 성장 곡선(`xpToNext`)으로. 구 `level × 100`은 124차에 폐기된 공식이라
    //   바(RegionHud)와 이 창의 분모가 서로 달랐다. 만렙은 분모 없이 누적치만.
    const xd = GameState.xpDisplay();
    const expLabel = xd.maxed ? `EXP ${Math.round(xd.cur).toLocaleString()} (MAX)` : `EXP ${Math.round(xd.cur).toLocaleString()}/${(xd.max ?? 0).toLocaleString()}`;
    const lvl = scene.add.text(PANEL_W - 20, cy + 2, `Lv.${p.level}  ·  ${expLabel}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(1, 0);
    this.add([nick, lvl]);
    cy += 32;
    this.secY.bars = cy;

    // ── HP / 피로도 바 ──
    const bars = scene.add.graphics();
    const barX = 92, barW = PANEL_W - barX - 24;
    const drawBar = (yy: number, ratio: number, color: number): void => {
      bars.fillStyle(0x101820, 0.9);
      bars.fillRect(barX, yy, barW, 12);
      bars.fillStyle(color, 0.95);
      bars.fillRect(barX, yy, barW * Phaser.Math.Clamp(ratio, 0, 1), 12);
      bars.lineStyle(1, 0x2a5a8a, 0.9);
      bars.strokeRect(barX, yy, barW, 12);
    };
    drawBar(cy + 2, p.stamina / 100, 0x37d97b);
    drawBar(cy + 26, p.fatigue / 100, 0xff8a3d);
    const hpLbl = scene.add.text(20, cy, `HP  ${Math.round(p.stamina)}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#a0b8c8', fontStyle: 'bold',
    });
    const ftLbl = scene.add.text(20, cy + 24, `피로도  ${Math.round(p.fatigue)}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#a0b8c8', fontStyle: 'bold',
    });
    this.add([bars, hpLbl, ftLbl]);
    cy += 56;

    // 구분선
    const div = scene.add.graphics();
    div.lineStyle(1, 0x1f3d5a, 0.8);
    div.lineBetween(16, cy, PANEL_W - 16, cy);
    this.add(div);
    cy += 12;
    this.secY.stats = cy;

    // ── 물리 스탯 4종 ──
    const stats: AnglerStats = DEFAULT_ANGLER_STATS;
    (Object.keys(ANGLER_STAT_INFO) as (keyof AnglerStats)[]).forEach((key) => {
      const info = ANGLER_STAT_INFO[key];
      const value = stats[key];

      const label = scene.add.text(20, cy, info.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#c8a060', fontStyle: 'bold',
      });
      const valText = scene.add.text(PANEL_W - 20, cy, String(value), {
        fontFamily: 'monospace', fontSize: '13px', color: '#4af2a1', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.add([label, valText]);
      cy += 20;

      // 게이지 (기준 20)
      const g = scene.add.graphics();
      g.fillStyle(0x101820, 0.9);
      g.fillRect(20, cy, PANEL_W - 40, 8);
      g.fillStyle(0x33b0e0, 0.9);
      g.fillRect(20, cy, (PANEL_W - 40) * Phaser.Math.Clamp(value / 20, 0, 1), 8);
      g.lineStyle(1, 0x1f3d5a, 0.9);
      g.strokeRect(20, cy, PANEL_W - 40, 8);
      this.add(g);
      cy += 14;

      const desc = scene.add.text(20, cy, info.desc, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
        wordWrap: { width: PANEL_W - 40 }, lineSpacing: 3,
      });
      this.add(desc);
      cy += desc.height + 14;
    });

    this.secY.statsEnd = cy;

    // ── 203차 — 타이틀 칸 ──
    const colDiv = scene.add.graphics();
    colDiv.lineStyle(1, 0x1f3d5a, 0.8);
    colDiv.lineBetween(PANEL_W, this.contentTop + 4, PANEL_W, PANEL_H - 12);
    this.add(colDiv);
    this.titleC = scene.add.container(PANEL_W, 0);
    this.add(this.titleC);
    this.renderTitles();
    this.offTitle = TitleStore.onChange(() => { if (this.active) this.renderTitles(); });
    this.wheel = (p, _go, _dx, dy): void => {
      if (this.titleMaxScroll <= 0 || !this.active) return;
      const r = this.localRect(PANEL_W, this.tSec.listY, TITLE_W, this.tSec.listH);
      if (!r.contains(p.x, p.y)) return;
      const next = Phaser.Math.Clamp(this.titleScroll + Math.sign(dy), 0, this.titleMaxScroll);
      if (next !== this.titleScroll) { this.titleScroll = next; this.renderTitles(); }
    };
    scene.input.on('wheel', this.wheel);
    this.once('destroy', () => { this.offTitle(); scene.input?.off('wheel', this.wheel); });

    this.applyFix();
    maybeStartTour(scene, () => this.buildTour());
    maybeStartTour(scene, () => this.buildTitleTour());
  }

  /** 타이틀 칸 그리기 — 단 타이틀 카드 → 얻은 타이틀 줄(윈도우드) → 「??? × N」 */
  private renderTitles(): void {
    const scene = this.scene;
    const c = this.titleC;
    c.removeAll(true);
    const L = 16, IW = TITLE_W - 32;
    let cy = this.contentTop + 10;
    const head = scene.add.text(L, cy, '타이틀', { fontFamily: FONT, fontSize: '13px', color: '#c8a060', fontStyle: 'bold' });
    c.add(head);
    cy += 24;

    // ── 단 타이틀 카드 ──
    const eq = TitleStore.equippedDef();
    this.tSec.cardY = cy;
    const card = scene.add.graphics();
    c.add(card);
    const tx = L + 10;
    const cap = scene.add.text(tx, cy + 8, '단 타이틀', { fontFamily: FONT, fontSize: '9px', color: '#7a98ac', fontStyle: 'bold' });
    c.add(cap);
    let inner = cap.y + cap.height + 3;
    if (eq) {
      const rar = scene.add.text(L + IW - 10, cy + 8, TITLE_RARITY_LABEL_KO[eq.rarity], {
        fontFamily: FONT, fontSize: '9px', color: TITLE_RARITY_COLOR[eq.rarity], fontStyle: 'bold',
      }).setOrigin(1, 0);
      const nm = scene.add.text(tx, inner, eq.nameKo, { fontFamily: FONT, fontSize: '16px', color: TITLE_RARITY_COLOR[eq.rarity], fontStyle: 'bold' });
      clampTextWidth(nm, IW - 20 - 54);
      const story = scene.add.text(tx, nm.y + nm.height + 4, eq.storyKo, {
        fontFamily: FONT, fontSize: '10px', color: '#a8c0d0', lineSpacing: 2, wordWrap: { width: IW - 20 },
      });
      const eff = scene.add.text(tx, story.y + story.height + 4, titleEffectLabelKo(eq), { fontFamily: FONT, fontSize: '10px', color: '#9fd8a8' });
      clampTextWidth(eff, IW - 20);
      c.add([rar, nm, story, eff]);
      // [떼기] — 이름 줄 오른쪽
      const bw = 46, bh = 20, bx = L + IW - 10 - bw, by = nm.y + Math.round((nm.height - bh) / 2);
      const btnG = scene.add.graphics();
      const paintBtn = (hover: boolean): void => {
        btnG.clear();
        btnG.fillStyle(hover ? 0x2a4a66 : 0x173247, 1).fillRect(bx, by, bw, bh);
        btnG.lineStyle(1, 0x3d6a8f, 1).strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      };
      paintBtn(false);
      const bt = scene.add.text(bx + bw / 2, by + bh / 2, '떼기', { fontFamily: FONT, fontSize: '10px', color: '#d0e2ee' }).setOrigin(0.5);
      clampTextWidth(bt, bw - 6);
      const bhit = scene.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      bhit.on('pointerover', () => paintBtn(true));
      bhit.on('pointerout', () => paintBtn(false));
      bhit.on('pointerdown', () => { TitleStore.equip(null); GameState.markDirty(); restoreHandCursor(scene); });
      c.add([btnG, bt, bhit]);
      inner = eff.y + eff.height;
    } else {
      const none = scene.add.text(tx, inner, '아직 단 타이틀이 없다', { fontFamily: FONT, fontSize: '12px', color: '#6f8a9c' });
      clampTextWidth(none, IW - 20);
      c.add(none);
      inner = none.y + none.height;
    }
    const cardH = Math.ceil(inner - cy + 10);
    this.tSec.cardH = cardH;
    card.fillStyle(0x0b1c2b, 0.9).fillRect(L, cy, IW, cardH);
    card.lineStyle(1, eq ? TITLE_RARITY_HEX[eq.rarity] : 0x2c5878, eq ? 0.7 : 0.8).strokeRect(L + 0.5, cy + 0.5, IW - 1, cardH - 1);
    cy += cardH + 12;

    // ── 얻은 타이틀 목록 + 숨은 타이틀 한 줄 ──
    const owned = TitleStore.ownedDefs();
    const hidden = TitleStore.hiddenCount();
    const sub = scene.add.text(L, cy, `얻은 타이틀  ${owned.length}`, { fontFamily: FONT, fontSize: '11px', color: '#8faabf', fontStyle: 'bold' });
    c.add(sub);
    cy += sub.height + 6;
    const listTop = cy;
    const listBottom = PANEL_H - 14;
    type Row = { def: TitleDef } | { hidden: number };
    const rows: Row[] = owned.map((def) => ({ def }));
    if (hidden > 0) rows.push({ hidden });
    const fit = Math.max(1, Math.floor((listBottom - listTop) / ROW_H));
    this.titleMaxScroll = Math.max(0, rows.length - fit);
    this.titleScroll = Phaser.Math.Clamp(this.titleScroll, 0, this.titleMaxScroll);
    this.tSec.listY = listTop;
    this.tSec.listH = Math.min(rows.length, fit) * ROW_H;
    const rowW = this.titleMaxScroll > 0 ? IW - 8 : IW;
    rows.slice(this.titleScroll, this.titleScroll + fit).forEach((r, i) => {
      const ry = listTop + i * ROW_H;
      const g = scene.add.graphics();
      c.add(g);
      if ('hidden' in r) {
        g.fillStyle(0x0b1c2b, 0.6).fillRect(L, ry, rowW, ROW_H - 4);
        g.lineStyle(1, 0x2c4558, 1);
        for (let dx = 0; dx < rowW; dx += 6) { g.lineBetween(L + dx, ry + 0.5, L + Math.min(rowW, dx + 3), ry + 0.5); g.lineBetween(L + dx, ry + ROW_H - 4.5, L + Math.min(rowW, dx + 3), ry + ROW_H - 4.5); }
        const t = scene.add.text(L + 12, ry + (ROW_H - 4) / 2, `???  × ${r.hidden}`, { fontFamily: FONT, fontSize: '12px', color: '#5f7a8c', fontStyle: 'bold' }).setOrigin(0, 0.5);
        c.add(t);
        return;
      }
      const d = r.def;
      const on = TitleStore.equippedId() === d.id;
      const paint = (hover: boolean): void => {
        g.clear();
        g.fillStyle(on ? 0x1d3a52 : hover ? 0x16314a : 0x0f2436, 0.95).fillRect(L, ry, rowW, ROW_H - 4);
        g.lineStyle(1, on ? 0xffd257 : 0x23455f, on ? 0.9 : 1).strokeRect(L + 0.5, ry + 0.5, rowW - 1, ROW_H - 5);
        g.fillStyle(TITLE_RARITY_HEX[d.rarity], 1).fillRect(L + 6, ry + 6, 4, ROW_H - 16);
      };
      paint(false);
      const nm = scene.add.text(L + 16, ry + 3, d.nameKo, { fontFamily: FONT, fontSize: '12px', color: TITLE_RARITY_COLOR[d.rarity], fontStyle: 'bold' });
      clampTextWidth(nm, rowW - 16 - 40);
      const ef = scene.add.text(L + 16, ry + 17, titleEffectLabelKo(d), { fontFamily: FONT, fontSize: '9px', color: '#7fa894' });
      clampTextWidth(ef, rowW - 24);
      const rar = scene.add.text(L + rowW - 6, ry + 4, TITLE_RARITY_LABEL_KO[d.rarity], { fontFamily: FONT, fontSize: '9px', color: '#7a98ac' }).setOrigin(1, 0);
      const hit = scene.add.rectangle(L + rowW / 2, ry + (ROW_H - 4) / 2, rowW, ROW_H - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: !on });
      hit.on('pointerover', () => { if (!on) paint(true); });
      hit.on('pointerout', () => paint(false));
      hit.on('pointerdown', () => { if (on) return; TitleStore.equip(d.id); GameState.markDirty(); restoreHandCursor(scene); });
      c.add([nm, ef, rar, hit]);
    });
    // 스크롤 막대(넘칠 때만)
    if (this.titleMaxScroll > 0) {
      const trackH = this.tSec.listH - 4;
      const thumbH = Math.max(16, Math.round(trackH * fit / rows.length));
      const ty = listTop + Math.round((trackH - thumbH) * this.titleScroll / this.titleMaxScroll);
      const sg = scene.add.graphics();
      sg.fillStyle(0x0b1c2b, 1).fillRect(L + IW - 4, listTop, 4, trackH);
      sg.fillStyle(0x3d6a8f, 1).fillRect(L + IW - 4, ty, 4, thumbH);
      c.add(sg);
    }
    enforceTextBounds(c, TITLE_W - 12, 'StatusPanel.titles');
    this.applyFix();
  }

  /** 203차 — 타이틀 칸 가이드(처음 열 때 한 번). 단 것과 얻은 것 · 숨은 것 */
  private buildTitleTour(): TourOptions {
    return {
      id: 'status_titles',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        {
          text: '오른쪽은 타이틀이다. 낚시꾼으로 살아온 흔적이 쌓이면 어느 날 이름 하나를 얻는다. 단 타이틀은 머리 위 이름 위에 작게 걸린다.',
          target: () => this.localRect(PANEL_W + 8, this.tSec.cardY - 30, TITLE_W - 16, this.tSec.cardH + 30),
        },
        {
          text: '얻은 타이틀은 아래 줄에 모인다. 줄을 누르면 그 타이틀로 바꿔 단다. 타이틀마다 작은 덕이 하나씩 붙어 있고, 한 번에 하나만 단다.',
          target: () => this.localRect(PANEL_W + 8, this.tSec.listY - 4, TITLE_W - 16, Math.max(ROW_H, this.tSec.listH) + 4),
        },
        {
          text: '물음표로 남은 것은 아직 얻지 못한 타이틀이다. 무엇을 하면 얻는지는 아무도 알려 주지 않는다. 바다에서 지내다 보면 언젠가 알게 될 것이다.',
          target: () => this.localRect(PANEL_W + 8, this.tSec.listY - 4, TITLE_W - 16, Math.max(ROW_H, this.tSec.listH) + 4),
        },
      ],
    };
  }

  /** 첫 열기 체험 가이드 — 막대·능력치를 짚고, 창 옮기기를 직접 해 본다 */
  private buildTour(): TourOptions {
    let sx = 0, sy = 0;
    return {
      id: 'status',
      anchor: () => this.panelBounds(),
      alive: () => this.active && !!this.scene,
      steps: [
        {
          text: '내 몸이 지금 어떤 상태인지는 이 창에서 본다.',
          target: () => this.panelBounds(),
        },
        {
          text: '이름 옆은 레벨과 경험치다. 무언가를 해낼 때마다 경험치가 쌓이고, 가득 차면 레벨이 오른다.',
          target: () => this.localRect(12, this.secY.head - 4, PANEL_W - 24, 28),
        },
        {
          text: '초록 막대는 체력이다. 굶거나 다치면 줄고, 바닥나면 쓰러진다. 주황 막대는 피로다. 움직일수록 쌓이고, 앉아 쉬거나 잠을 자면 풀린다.',
          target: () => this.localRect(12, this.secY.bars - 2, PANEL_W - 24, 46),
        },
        {
          text: '아래 넷은 타고난 몸의 능력이다. 줄마다 그 능력이 낚시에서 어떤 힘이 되는지 적혀 있다.',
          target: () => this.localRect(12, this.secY.stats - 4, PANEL_W - 24, this.secY.statsEnd - this.secY.stats),
        },
        {
          text: '창은 제목줄을 잡고 끌면 원하는 자리로 옮길 수 있다. 이 창을 옆으로 끌어 보자.',
          target: () => this.localRect(0, 0, PANEL_W - 44, 32),
          onEnter: () => { sx = this.x; sy = this.y; },
          wait: () => Math.hypot(this.x - sx, this.y - sy) > 40,
        },
      ],
    };
  }
}
