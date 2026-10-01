/**
 * @file HomeInfoPanels.ts
 * @description 집 벽 장식 기능 창 (190차) — 물때표(책) · 달력(납부일) · 어탁(최대어 기록)
 *
 * 190차 사용자 지시 「벽 장식 기능화 — 책은 도감·물때표, 달력은 납부일, 어탁 액자는 최대어 기록」.
 *  - 책 [F] → 고를 거리(어류 도감 / 물때표). 도감은 기존 `AnglerLogScene`을 띄우고, 물때표는 이 파일의 `TideTablePanel`.
 *  - 달력 [F] → `CalendarPanel`: 이번 달 장(오늘 동그라미) + 다가오는 납부(`GameState.upkeepItems`).
 *  - 어탁 [F] → `FishRecordPanel`: 가장 큰 고기 한 마리(어탁) + 어종별 최대어.
 *  - 읽는 창이라 조작이 없다. 창 안에 안내 문구를 두지 않고(R11) 처음 열 때 한 줄 가이드가 무엇을 보는 곳인지 짚는다.
 */

import Phaser from 'phaser';
import { calculateTideInfo, getLunarDayDisplay, getFishById, kstParts } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { maybeStartTour } from './GuideTour.js';
import { enforceTextBounds, clampTextWidth } from './TextFit.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { getLocale } from '../i18n/I18n.js';
import { resolveFishTexture } from '../data/FishTextures.js';

const FONT = '"Noto Sans KR", sans-serif';
const DOW_EN: Record<string, string> = { 일: 'Sun', 월: 'Mon', 화: 'Tue', 수: 'Wed', 목: 'Thu', 금: 'Fri', 토: 'Sat' };

const hm = (d: Date): string => { const p = kstParts(d); return `${p.hh}:${p.mi}`; };

// ─────────────────────────────────────────────
// 물때표
// ─────────────────────────────────────────────

const TT_W = 660;
const TT_H = 400;

export class TideTablePanel extends DraggablePanel {
  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: TT_W, height: TT_H, title: '물때표', onClose, depth: 850 });
    const en = getLocale() === 'en';
    const top = this.contentTop + 12;
    const cols = [{ x: 22, k: '날짜' }, { x: 120, k: '음력' }, { x: 182, k: '물때' }, { x: 430, k: '만조' }, { x: 548, k: '간조' }];
    for (const c of cols) {
      this.add(scene.add.text(c.x, top, c.k, { fontFamily: FONT, fontSize: '12px', color: '#ffd9a0', fontStyle: 'bold' }));
    }
    const rowH = 40;
    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      const ry = top + 26 + i * rowH;
      const p = kstParts(new Date(now + i * 86400000));
      const noon = new Date(Date.UTC(Number(p.y), Number(p.mo) - 1, Number(p.d), 3, 0, 0));
      const t = calculateTideInfo(noon);
      const bg = scene.add.graphics();
      bg.fillStyle(i === 0 ? 0x173350 : 0x0e1c2d, 0.9); bg.fillRoundedRect(14, ry - 4, TT_W - 28, rowH - 6, 5);
      if (i === 0) { bg.lineStyle(1.5, 0xffd257, 0.9); bg.strokeRoundedRect(14, ry - 4, TT_W - 28, rowH - 6, 5); }
      // 사리 무렵은 물살 띠를 붉게 — 글자 대신 색으로 읽힌다
      const strong = t.currentStrength >= 0.85, weak = t.currentStrength < 0.5;
      bg.fillStyle(strong ? 0xff7a5a : weak ? 0x5ab0ff : 0x4af2a1, 0.9);
      bg.fillRect(182 - 10, ry + 4, 4, rowH - 22);
      this.add(bg);
      const date = en ? `${p.mo}/${p.d} ${DOW_EN[p.dow] ?? ''}` : `${p.mo}/${p.d} (${p.dow})`;
      const cells: [number, string, string][] = [
        [22, date, i === 0 ? '#ffe9b0' : '#c8dceb'],
        [120, `${getLunarDayDisplay(noon)}`, '#9fb7c8'],
        [182, t.tidePhaseLabel, strong ? '#ffb39a' : '#e8f2fa'],
        [430, t.highTideTimes.map(hm).join('  '), '#9fd0e4'],
        [548, t.lowTideTimes.map(hm).join('  '), '#9fd0e4'],
      ];
      for (const [cx, txt, col] of cells) {
        const tx = scene.add.text(cx, ry + (rowH - 6) / 2 - 4, txt, { fontFamily: FONT, fontSize: '13px', color: col, fontStyle: i === 0 ? 'bold' : 'normal' }).setOrigin(0, 0.5);
        this.add(cx === 182 ? clampTextWidth(tx, 240) : tx);
      }
    }
    enforceTextBounds(this, TT_W - 16, 'TideTablePanel');
    this.applyFix();
    maybeStartTour(scene, () => ({
      id: 'home_tide_table',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [{
        text: '아버지가 책 사이에 끼워 둔 물때표다. 오늘부터 이레 치 물때와 만조 · 간조 시각이 적혀 있다. 붉은 띠는 물살이 센 사리 무렵이다.',
        target: () => this.localRect(14, top + 20, TT_W - 28, 7 * rowH),
      }],
    }));
  }
}

// ─────────────────────────────────────────────
// 달력 — 이번 달 장 + 다가오는 납부
// ─────────────────────────────────────────────

const CAL_W = 640;
const CAL_H = 380;

export class CalendarPanel extends DraggablePanel {
  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: CAL_W, height: CAL_H, title: '달력', onClose, depth: 850 });
    const en = getLocale() === 'en';
    const top = this.contentTop + 10;
    // ── 왼쪽: 이번 달 한 장 (오늘에 동그라미) ──
    const p = kstParts();
    const yr = Number(p.y), mo = Number(p.mo), today = Number(p.d);
    const first = new Date(Date.UTC(yr, mo - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    const gx = 22, cw = 38, ch = 34;
    const page = scene.add.graphics();
    page.fillStyle(0xf4ead2, 1); page.fillRoundedRect(gx - 8, top, cw * 7 + 16, ch * 7 + 26, 4);
    page.fillStyle(0xb04a3a, 1); page.fillRect(gx - 8, top, cw * 7 + 16, 30);
    this.add(page);
    this.add(scene.add.text(gx + (cw * 7) / 2, top + 15, en ? `${yr} / ${mo}` : `${yr}년 ${mo}월`, {
      fontFamily: FONT, fontSize: '15px', color: '#fff4dc', fontStyle: 'bold',
    }).setOrigin(0.5));
    const heads = en ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['일', '월', '화', '수', '목', '금', '토'];
    heads.forEach((h, i) => this.add(scene.add.text(gx + i * cw + cw / 2, top + 44, h, {
      fontFamily: FONT, fontSize: '12px', color: i === 0 ? '#b04a3a' : '#5a4a3a', fontStyle: 'bold',
    }).setOrigin(0.5)));
    for (let d = 1; d <= days; d++) {
      const idx = first + d - 1;
      const cx = gx + (idx % 7) * cw + cw / 2, cy = top + 44 + ch * (1 + Math.floor(idx / 7)) - 6;
      if (d === today) {
        const ring = scene.add.graphics();
        ring.lineStyle(2, 0xb04a3a, 1); ring.strokeCircle(cx, cy, 13);
        this.add(ring);
      }
      this.add(scene.add.text(cx, cy, String(d), {
        fontFamily: FONT, fontSize: '13px', color: idx % 7 === 0 ? '#b04a3a' : '#3a2a1a', fontStyle: d === today ? 'bold' : 'normal',
      }).setOrigin(0.5));
    }
    // ── 오른쪽: 다가오는 납부 ──
    const lx = gx + cw * 7 + 34, lw = CAL_W - lx - 20;
    this.add(scene.add.text(lx, top + 2, '다가오는 납부', { fontFamily: FONT, fontSize: '14px', color: '#ffd9a0', fontStyle: 'bold' }));
    this.add(scene.add.text(lx, top + 26, `오늘은 ${StoryStore.storyDay}일째`, { fontFamily: FONT, fontSize: '12px', color: '#9fb7c8' }));
    const items = GameState.upkeepItems().slice(0, 6);
    let ry = top + 54;
    if (!items.length) {
      this.add(scene.add.text(lx, ry, '적어 둔 납부일이 없다', { fontFamily: FONT, fontSize: '13px', color: '#607b8e', wordWrap: { width: lw } }));
    }
    for (const it of items) {
      const due = it.overdue ? `${it.overdueDays}일 연체` : `D-${it.daysLeft}`;
      const col = it.overdue ? '#ff8a8a' : it.daysLeft <= 3 ? '#ffb070' : it.daysLeft <= 14 ? '#ffd93b' : '#8aa8bd';
      const bg = scene.add.graphics();
      bg.fillStyle(0x0e1c2d, 0.9); bg.fillRoundedRect(lx - 6, ry - 4, lw + 6, 42, 5);
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(col).color, 1); bg.fillRect(lx - 6, ry - 4, 3, 42);
      this.add(bg);
      this.add(scene.add.text(lx + 4, ry, en ? it.nameEn : it.nameKo, { fontFamily: FONT, fontSize: '13px', color: '#e8f2fa', fontStyle: 'bold' }));
      this.add(scene.add.text(lx + lw - 6, ry, due, { fontFamily: FONT, fontSize: '12px', color: col, fontStyle: 'bold' }).setOrigin(1, 0));
      this.add(scene.add.text(lx + 4, ry + 19, `${it.costKrw.toLocaleString()}원`, { fontFamily: FONT, fontSize: '11px', color: '#9fb7c8' }));
      ry += 46;
    }
    enforceTextBounds(this, CAL_W - 16, 'CalendarPanel');
    this.applyFix();
    maybeStartTour(scene, () => ({
      id: 'home_calendar',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [{
        text: '달력 옆에 다가오는 납부일을 적어 두었다. 붉은 것은 이미 밀린 것이다. 납부는 면허 · 허가 창(L)에서 한다.',
        target: () => this.localRect(lx - 10, top - 4, lw + 14, CAL_H - top - 10),
      }],
    }));
  }
}

// ─────────────────────────────────────────────
// 어탁 — 최대어 기록
// ─────────────────────────────────────────────

const FR_W = 560;
const FR_H = 420;

export class FishRecordPanel extends DraggablePanel {
  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: FR_W, height: FR_H, title: '어탁', onClose, depth: 850 });
    const top = this.contentTop + 10;
    const hist = GameState.player.caughtFishHistory;
    const best = [...hist].sort((a, b) => b.lengthCm - a.lengthCm)[0];
    // ── 어탁 한 장 (먹으로 뜬 그림) ──
    const paper = scene.add.graphics();
    paper.fillStyle(0xf2ead8, 1); paper.fillRoundedRect(18, top, FR_W - 36, 150, 4);
    paper.lineStyle(3, 0x5a3c22, 1); paper.strokeRoundedRect(18, top, FR_W - 36, 150, 4);
    this.add(paper);
    if (!best) {
      this.add(scene.add.text(FR_W / 2, top + 75, '아직 어탁을 뜰 만한 고기를 낚지 못했다', {
        fontFamily: FONT, fontSize: '14px', color: '#6a5a4a',
      }).setOrigin(0.5));
    } else {
      const key = resolveFishTexture(best.fishSpeciesId, best.lengthCm, 'M');
      if (key && scene.textures.exists(key)) {
        const img = scene.add.image(150, top + 75, key).setTintFill(0x1e1e24).setAlpha(0.88);
        const src = scene.textures.get(key).getSourceImage() as HTMLImageElement;
        const s = Math.min(220 / src.width, 110 / src.height);
        img.setDisplaySize(src.width * s, src.height * s);
        this.add(img);
      }
      const name = getFishById(best.fishSpeciesId)?.nameKo ?? best.fishSpeciesId;
      this.add(scene.add.text(300, top + 26, name, { fontFamily: FONT, fontSize: '20px', color: '#2a1a0e', fontStyle: 'bold' }));
      this.add(scene.add.text(300, top + 60, `${best.lengthCm} cm  ·  ${(best.weightGram / 1000).toFixed(2)} kg`, {
        fontFamily: FONT, fontSize: '15px', color: '#3a2a1a', fontStyle: 'bold',
      }));
      const d = kstParts(new Date(best.caughtAt));
      this.add(scene.add.text(300, top + 92, `${d.y}.${d.mo}.${d.d}`, { fontFamily: FONT, fontSize: '12px', color: '#6a5a4a' }));
      // 낙관 (붉은 도장)
      const seal = scene.add.graphics();
      seal.fillStyle(0xb03a2a, 0.9); seal.fillRect(FR_W - 66, top + 108, 24, 24);
      seal.fillStyle(0xf2ead8, 1); seal.fillRect(FR_W - 61, top + 113, 14, 2); seal.fillRect(FR_W - 61, top + 119, 14, 2); seal.fillRect(FR_W - 55, top + 113, 2, 14);
      this.add(seal);
    }
    // ── 어종별 최대어 ──
    const bySp = new Map<string, { len: number; w: number }>();
    for (const r of hist) {
      const cur = bySp.get(r.fishSpeciesId);
      if (!cur || r.lengthCm > cur.len) bySp.set(r.fishSpeciesId, { len: r.lengthCm, w: r.weightGram });
    }
    const rows = [...bySp.entries()].sort((a, b) => b[1].len - a[1].len).slice(0, 8);
    const ly = top + 166;
    this.add(scene.add.text(22, ly, '어종별 최대어', { fontFamily: FONT, fontSize: '13px', color: '#ffd9a0', fontStyle: 'bold' }));
    rows.filter(([sp]) => !!getFishById(sp)).forEach(([sp, r], i) => {
      const cx = 22 + (i % 2) * ((FR_W - 44) / 2), cy = ly + 26 + Math.floor(i / 2) * 28;
      this.add(scene.add.text(cx, cy, getFishById(sp)?.nameKo ?? sp, { fontFamily: FONT, fontSize: '13px', color: '#e8f2fa' }));
      this.add(scene.add.text(cx + (FR_W - 44) / 2 - 16, cy, `${r.len} cm`, { fontFamily: FONT, fontSize: '13px', color: '#9fd0e4' }).setOrigin(1, 0));
    });
    enforceTextBounds(this, FR_W - 16, 'FishRecordPanel');
    this.applyFix();
    maybeStartTour(scene, () => ({
      id: 'home_fishprint',
      anchor: () => this.panelBounds(),
      alive: () => this.active,
      steps: [{
        text: '어탁 액자다. 지금까지 낚은 가장 큰 고기를 먹으로 떠 두었다. 더 큰 고기를 낚으면 그림이 바뀐다.',
        target: () => this.localRect(18, top, FR_W - 36, 150),
      }],
    }));
  }
}
