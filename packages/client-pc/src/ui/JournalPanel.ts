/**
 * @file JournalPanel.ts
 * @description 일지 패널 (J) — **150차 전면 재작성**. 좌 임무 목록(표) / 우 임무 상세.
 *
 * 136차 구조(레일 + 2트랙)는 폐기했다. 실검증에서 두 가지가 드러났다 —
 *  ① **아직 만나지도 않은 퀘스트의 제목·목표·레벨이 전부 열려 있었다.** 조행록 17장의 지표 어종·
 *     계절·크기 조건, 인물 23명의 이야기까지. "유저가 미리 전체 퀘스트를 보게 되는 매우 안 좋은
 *     효과"(사용자). 재미를 먼저 깨는 구현이었다.
 *  ② 표현형이 텍스트 나열이었다 — 무엇이 얼마나 진행됐는지 한눈에 안 들어왔다.
 *
 * 그래서 AGENTS §4 R2(스포일러 금지)·R4(나레이션) 아래 다시 만든다:
 *  - **목록 = 표**: 의뢰인 초상 · 임무 · 지역 · 상태 · **진행률 N% + 진행 바**.
 *  - **기본은 진행 중·받을 수 있는 것만.** `완료한 임무 표시` / `잠긴 임무 표시` 토글로 넓힌다
 *    (둘 다 기본 꺼짐). 잠긴 임무는 이름만 — 목표·보상은 열지 않는다.
 *  - **상세 = 초상 + 나레이션(그 박스만 스크롤) + 목표 바 + 보상 카드.**
 *    나레이션은 `descKo`(설계 요약)가 아니라 `StoryNarrative`(NPC의 말 + 내 생각)를 쓴다.
 *
 * 정의는 core `STORY_QUESTS`, 상태는 `StoryStore`.
 */

import Phaser from 'phaser';
import {
  STORY_CHAPTERS, STORY_QUESTS, getStoryNpc, getLicenseByType, narrativeOf, getSkillById,
  characterOf, questDifficulty, type StoryQuestDef, type QuestDifficultyTier,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { StoryStore } from '../store/StoryStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { ensureFacePortrait } from './CharacterSprite.js';
import { addPixelIcon } from './PixelIcon.js';
import { questRewardItemName } from '../data/QuestRewardItems.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const FONT = '"Noto Sans KR", sans-serif';

const LIST_X = 12;
const LIST_W = 486;
const DET_X = LIST_X + LIST_W + 14;
const DET_W = PANEL_W - DET_X - 14;

/** 표 컬럼 — 초상 / 임무 / 지역 / 상태 / 진행률 */
const C_FACE = 34;
const C_REGION = 74;
const C_STATE = 66;
const C_PROG = 72;
const C_NAME = LIST_W - C_FACE - C_REGION - C_STATE - C_PROG - 28;

const ROW_H = 40;

const C_TEXT = '#e8f4fd';
const C_DIM = '#8fa8bc';

/** 152차 — 난이도 색. 대화는 조용한 회색, 손이 많이 갈수록 주황으로 간다. */
const DIFF_COLOR: Record<QuestDifficultyTier, string> = {
  talk: '#6f8ba1', light: '#7fb27f', normal: '#cbb26a', hard: '#e0913f', severe: '#df6a4a',
};
const C_GOLD = '#ffd98a';
const C_OK = '#7fe0b0';
const C_ACT = '#ffb26b';
const C_LOCK = '#63737f';

const REGION_LABEL: Record<string, string> = {
  gangwon_sokcho: '속초', busan: '부산', ulsan: '울산', gyeongbuk_pohang: '포항',
  gyeongnam_geoje: '거제', jeonnam_yeosu: '여수', chungnam_taean: '태안',
  jeju: '제주', ulleungdo: '울릉도', dokdo: '독도', incheon: '인천', hometown: '집',
};

type Row = { q: StoryQuestDef; st: ReturnType<typeof StoryStore.status>; pct: number };

export interface JournalConfig { onClose: () => void }

export class JournalPanel extends DraggablePanel {
  /** 완료한 임무도 보여준다 (기본 꺼짐 — 재미를 깨지 않는다) */
  private showDone = false;
  /** 아직 받을 수 없는 임무를 이름만 보여준다 (기본 꺼짐 — R2) */
  private showLocked = false;

  /** 임무 목록 / 이야기(챕터 체인) */
  private tab: 'tasks' | 'chain' = 'tasks';
  private selId: string | null = null;
  private scroll = 0;
  private rows: Row[] = [];

  private listC?: Phaser.GameObjects.Container;
  private detC?: Phaser.GameObjects.Container;
  /** 나레이션 박스 — 자체 스크롤(사용자 지시) */
  private narrC?: Phaser.GameObjects.Container;
  private narrScroll = 0;
  private narrMax = 0;
  private narrMask?: Phaser.GameObjects.Graphics;
  private narrRect: Phaser.Geom.Rectangle | null = null;
  private listRect: Phaser.Geom.Rectangle | null = null;
  private wheelHandler?: (p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void;
  private readonly postUpdate: () => void;
  private lastX = NaN; private lastY = NaN;

  constructor(scene: Phaser.Scene, cfg: JournalConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '일지 — 임무', onClose: cfg.onClose, dim: false, depth: 891,
    });

    this.frameG = scene.add.graphics();
    this.add(this.frameG);

    this.wheelHandler = (p, _o, _dx, dy) => {
      const lx = p.x - this.x, ly = p.y - this.y;
      if (this.narrRect && Phaser.Geom.Rectangle.Contains(this.narrRect, lx, ly)) {
        const next = Phaser.Math.Clamp(this.narrScroll + (dy > 0 ? 34 : -34), 0, this.narrMax);
        if (next !== this.narrScroll) { this.narrScroll = next; this.applyNarrScroll(); }
        return;
      }
      if (this.listRect && Phaser.Geom.Rectangle.Contains(this.listRect, lx, ly)) {
        const max = Math.max(0, this.rows.length - this.visibleRows());
        const next = Phaser.Math.Clamp(this.scroll + (dy > 0 ? 1 : -1), 0, max);
        if (next !== this.scroll) { this.scroll = next; this.renderList(); }
      }
    };
    scene.input.on('wheel', this.wheelHandler);
    this.postUpdate = () => { if (this.x !== this.lastX || this.y !== this.lastY) this.syncNarrMask(); };
    scene.events.on('postupdate', this.postUpdate);

    this.rebuild();
  }

  override destroy(fromScene?: boolean): void {
    if (this.wheelHandler) this.scene?.input?.off('wheel', this.wheelHandler);
    this.scene?.events?.off('postupdate', this.postUpdate);
    this.narrMask?.destroy();
    super.destroy(fromScene);
  }

  // ═══════════ 데이터 ═══════════
  /**
   * 보여줄 임무 목록 (R2 — 스포일러 금지).
   *  기본: 진행 중 + 지금 받을 수 있는 것.  토글로 완료분·잠긴 것을 더한다.
   *  잠긴 임무는 **이름만** 내준다(상세에서 목표·보상을 열지 않는다).
   */
  private buildRows(): Row[] {
    const out: Row[] = [];
    for (const q of STORY_QUESTS) {
      const st = StoryStore.status(q);
      if (st === 'done' && !this.showDone) continue;
      if ((st === 'locked' || st === 'declined') && !this.showLocked) continue;
      out.push({ q, st, pct: this.pctOf(q, st) });
    }
    // 진행 중 → 받을 수 있는 것 → 완료 → 잠김 순, 그 안에서는 챕터·발행 순
    const rank = (s: string): number => (s === 'active' ? 0 : s === 'available' ? 1 : s === 'done' ? 2 : 3);
    out.sort((a, b) => rank(a.st) - rank(b.st) || a.q.chapter - b.q.chapter || a.q.id.localeCompare(b.q.id));
    return out;
  }

  /** 진행률 — 목표 완료수 / 전체. 단일 목표 임무는 0% → 100% (사용자 지시) */
  private pctOf(q: StoryQuestDef, st: string): number {
    if (st === 'done') return 100;
    if (st !== 'active') return 0;
    const n = q.objectives.length || 1;
    let acc = 0;
    q.objectives.forEach((o, i) => {
      const tgt = StoryStore.objectiveTarget(o);
      const cur = Math.min(tgt, StoryStore.progress(q.id)?.obj[i] ?? 0);
      acc += tgt > 0 ? cur / tgt : 0;
    });
    return Math.round((acc / n) * 100);
  }

  private stateLabel(st: string): { ko: string; color: string } {
    switch (st) {
      case 'active': return { ko: '진행 중', color: C_ACT };
      case 'available': return { ko: '새 임무', color: C_OK };
      case 'done': return { ko: '완료함', color: C_DIM };
      case 'declined': return { ko: '거절함', color: C_LOCK };
      default: return { ko: '잠김', color: C_LOCK };
    }
  }

  private visibleRows(): number {
    return Math.floor((PANEL_H - (this.contentTop + 26) - 42) / ROW_H);
  }

  // ═══════════ 렌더 ═══════════
  private rebuild(): void {
    this.rows = this.buildRows();
    if (!this.selId || !this.rows.some((r) => r.q.id === this.selId)) {
      this.selId = this.rows[0]?.q.id ?? null;
      this.narrScroll = 0;
    }
    const max = Math.max(0, this.rows.length - this.visibleRows());
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, max);
    this.paintFrame();
    this.renderHeader();
    if (this.tab === 'chain') {
      this.listC?.destroy(); this.listC = undefined;
      this.detC?.destroy(); this.detC = undefined;
      this.narrMask?.destroy(); this.narrMask = undefined; this.narrRect = null;
      this.renderChain();
    } else {
      this.chainC?.destroy(); this.chainC = undefined;
      this.renderList(); this.renderDetail();
    }
  }

  private headerC?: Phaser.GameObjects.Container;
  private frameG?: Phaser.GameObjects.Graphics;

  /** 배경 틀 — 임무 탭은 2단(목록/상세), 이야기 탭은 한 장 */
  private paintFrame(): void {
    const g = this.frameG;
    if (!g) return;
    g.clear();
    const top = this.contentTop + 26;
    const h = PANEL_H - top - 10;
    if (this.tab === 'chain') {
      g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(LIST_X - 4, top, PANEL_W - LIST_X - 8, h, 6);
      g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(LIST_X - 4, top, PANEL_W - LIST_X - 8, h, 6);
      return;
    }
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(LIST_X - 4, top, LIST_W + 8, h, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(LIST_X - 4, top, LIST_W + 8, h, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(DET_X - 6, top, DET_W + 12, h, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(DET_X - 6, top, DET_W + 12, h, 6);
  }

  /** 토글 2종 — 기본은 둘 다 꺼져 있다 */
  private renderHeader(): void {
    this.headerC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.headerC = c; this.add(c);
    const y = this.contentTop + 10;

    const toggle = (x: number, on: boolean, label: string, hit: () => void): number => {
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x1f5a3a : 0x14243a, 1); g.fillRect(x, y - 7, 14, 14);
      g.lineStyle(1, on ? 0x4af2a1 : 0x2c5878, 1); g.strokeRect(x, y - 7, 14, 14);
      if (on) { g.lineStyle(2, 0xd8ffe8, 1); g.lineBetween(x + 3, y, x + 6, y + 4); g.lineBetween(x + 6, y + 4, x + 11, y - 4); }
      const t = this.scene.add.text(x + 20, y, label, {
        fontFamily: FONT, fontSize: '11px', color: on ? C_TEXT : C_DIM,
      }).setOrigin(0, 0.5);
      const w = 20 + t.width + 14;
      const h = this.scene.add.rectangle(x + w / 2 - 7, y, w, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      h.on('pointerdown', () => { hit(); restoreHandCursor(this.scene); });
      c.add([g, t, h]);
      return x + w;
    };

    // 탭 — 임무 목록 / 이야기(챕터 체인)
    let tx = LIST_X + 2;
    for (const [key, label] of [['tasks', '임무'], ['chain', '이야기']] as const) {
      const on = this.tab === key;
      const t = this.scene.add.text(tx + 26, y, label, {
        fontFamily: FONT, fontSize: '12px', color: on ? C_GOLD : C_DIM, fontStyle: on ? 'bold' : 'normal',
      }).setOrigin(0.5, 0.5);
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x1b3a52 : 0x0e1c2a, on ? 0.95 : 0.5); g.fillRect(tx, y - 11, 52, 22);
      if (on) { g.fillStyle(0xd8b25f, 1); g.fillRect(tx, y + 9, 52, 2); }
      const h = this.scene.add.rectangle(tx + 26, y, 52, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      h.on('pointerdown', () => { this.tab = key; this.rebuild(); restoreHandCursor(this.scene); });
      c.add([g, t, h]);
      tx += 56;
    }

    let x = tx + 12;
    if (this.tab === 'tasks') {
      x = toggle(x, this.showDone, '완료한 임무 표시', () => { this.showDone = !this.showDone; this.scroll = 0; this.rebuild(); });
      toggle(x + 6, this.showLocked, '잠긴 임무 표시', () => { this.showLocked = !this.showLocked; this.scroll = 0; this.rebuild(); });
    }

    const ch = StoryStore.currentChapter();
    const def = STORY_CHAPTERS.find((x2) => x2.chapter === ch);
    const info = this.scene.add.text(PANEL_W - 16, y, `제${ch}장 · ${def?.titleKo ?? ''}`, {
      fontFamily: FONT, fontSize: '12px', color: C_GOLD,
    }).setOrigin(1, 0.5);
    clampTextWidth(info, DET_W - 20);
    c.add(info);
    applyScreenFixed(this);
  }

  private renderList(): void {
    this.listC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.listC = c; this.add(c);
    const top = this.contentTop + 26;
    this.listRect = new Phaser.Geom.Rectangle(LIST_X - 4, top, LIST_W + 8, PANEL_H - top - 10);

    // 표 헤더
    const hy = top + 14;
    const head = (x: number, w: number, s: string, align: 0 | 0.5 | 1 = 0): void => {
      const t = this.scene.add.text(x + (align === 1 ? w : align === 0.5 ? w / 2 : 0), hy, s, {
        fontFamily: FONT, fontSize: '10px', color: '#6f8ba1',
      }).setOrigin(align, 0.5);
      c.add(t);
    };
    let cx = LIST_X + 6;
    head(cx, C_FACE, '의뢰인'); cx += C_FACE + 8;
    head(cx, C_NAME, '임무'); cx += C_NAME + 6;
    head(cx, C_REGION, '지역', 0.5); cx += C_REGION + 6;
    head(cx, C_STATE, '상태', 0.5); cx += C_STATE + 6;
    head(cx, C_PROG, '진행률', 0.5);

    const line = this.scene.add.graphics();
    line.lineStyle(1, 0x1c3d5a, 1); line.lineBetween(LIST_X, hy + 10, LIST_X + LIST_W, hy + 10);
    c.add(line);

    if (this.rows.length === 0) {
      const t = this.scene.add.text(LIST_X + LIST_W / 2, top + 70, '지금 맡고 있는 임무가 없습니다.\n항구 사람들과 이야기해 보세요.', {
        fontFamily: FONT, fontSize: '12px', color: C_DIM, align: 'center', lineSpacing: 5,
      }).setOrigin(0.5, 0);
      c.add(t);
      applyScreenFixed(this);
      return;
    }

    // 윈도우드 렌더 — 보이는 행만 만든다(마스크는 입력을 안 자른다, ui-panel 규칙)
    const vis = this.visibleRows();
    const start = this.scroll;
    const end = Math.min(this.rows.length, start + vis);
    let y = hy + 22;
    for (let i = start; i < end; i++) {
      this.drawRow(c, this.rows[i], y);
      y += ROW_H;
    }

    // 스크롤바 + 위치 표기 (조용한 잘림 금지)
    if (this.rows.length > vis) {
      const trackY = hy + 22, trackH = vis * ROW_H;
      const bx = LIST_X + LIST_W - 4;
      const g = this.scene.add.graphics();
      g.fillStyle(0x0d1c2c, 1); g.fillRect(bx, trackY, 5, trackH);
      const th = Math.max(22, trackH * (vis / this.rows.length));
      const ty = trackY + (trackH - th) * (start / Math.max(1, this.rows.length - vis));
      g.fillStyle(0x3d6f96, 1); g.fillRect(bx, ty, 5, th);
      c.add(g);
      const pos = this.scene.add.text(LIST_X + LIST_W - 12, PANEL_H - 16,
        `${start + 1}–${end} / ${this.rows.length}`, { fontFamily: FONT, fontSize: '9px', color: '#6a8aa0' })
        .setOrigin(1, 1);
      c.add(pos);
    }
    applyScreenFixed(this);
  }

  private drawRow(c: Phaser.GameObjects.Container, row: Row, y: number): void {
    const { q, st, pct } = row;
    const sel = q.id === this.selId;
    const locked = st === 'locked' || st === 'declined';
    const g = this.scene.add.graphics();
    g.fillStyle(sel ? 0x1b3a52 : 0x0e1c2a, sel ? 0.95 : 0.55);
    g.fillRect(LIST_X, y - ROW_H / 2, LIST_W - 8, ROW_H - 3);
    if (sel) { g.fillStyle(0xd8b25f, 1); g.fillRect(LIST_X, y - ROW_H / 2, 3, ROW_H - 3); }
    c.add(g);

    let cx = LIST_X + 6;
    // 의뢰인 얼굴 — 잠긴 임무는 누가 주는지도 알려주지 않는다
    if (!locked && q.giver) {
      const key = ensureFacePortrait(this.scene, characterOf(q.giver), 2);
      const img = this.scene.add.image(cx + C_FACE / 2, y, key).setOrigin(0.5).setDisplaySize(28, 28);
      c.add(img);
    } else {
      const dot = addPixelIcon(this.scene, locked ? 'mk_quest' : 'mm_npc', cx + C_FACE / 2, y, 16);
      if (dot) { dot.setAlpha(locked ? 0.25 : 0.6); c.add(dot); }
    }
    cx += C_FACE + 8;

    const name = this.scene.add.text(cx, y, locked ? '???' : q.titleKo, {
      fontFamily: FONT, fontSize: '13px',
      color: locked ? C_LOCK : sel ? '#ffffff' : C_TEXT,
      fontStyle: st === 'available' ? 'bold' : 'normal',
    }).setOrigin(0, 0.5);
    clampTextWidth(name, C_NAME);
    c.add(name);
    cx += C_NAME + 6;

    const reg = this.scene.add.text(cx + C_REGION / 2, y, locked ? '—' : (REGION_LABEL[q.region] ?? q.region), {
      fontFamily: FONT, fontSize: '11px', color: locked ? C_LOCK : C_DIM,
    }).setOrigin(0.5);
    clampTextWidth(reg, C_REGION);
    c.add(reg);
    cx += C_REGION + 6;

    const lab = this.stateLabel(st);
    const stT = this.scene.add.text(cx + C_STATE / 2, y, lab.ko, {
      fontFamily: FONT, fontSize: '11px', color: lab.color,
    }).setOrigin(0.5);
    c.add(stT);
    cx += C_STATE + 6;

    // 진행률 — 숫자 + 그 아래 바 (접힌 상태에서 한눈에)
    const pT = this.scene.add.text(cx + C_PROG / 2, y - 7, locked ? '—' : `${pct}%`, {
      fontFamily: FONT, fontSize: '12px', color: locked ? C_LOCK : pct >= 100 ? C_OK : C_TEXT, fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(pT);
    if (!locked) {
      const bg = this.scene.add.graphics();
      const bw = C_PROG - 12, bx = cx + 6;
      bg.fillStyle(0x0d1c2c, 1); bg.fillRect(bx, y + 5, bw, 5);
      bg.fillStyle(pct >= 100 ? 0x4af2a1 : 0xffb26b, 1); bg.fillRect(bx, y + 5, (bw * pct) / 100, 5);
      bg.lineStyle(1, 0x24455f, 1); bg.strokeRect(bx, y + 5, bw, 5);
      c.add(bg);
    }

    const hit = this.scene.add.rectangle(LIST_X + (LIST_W - 8) / 2, y, LIST_W - 8, ROW_H - 3, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      this.selId = q.id; this.narrScroll = 0;
      this.renderList(); this.renderDetail(); restoreHandCursor(this.scene);
    });
    c.add(hit);
  }

  // ═══════════ 이야기 (챕터 체인) ═══════════
  private chainC?: Phaser.GameObjects.Container;

  /**
   * 챕터 하나 = **세로 체인 하나** (사용자 지정 — 타르코프 챕터 화면).
   *
   * 붉은 점선 척추를 따라 체크박스 행이 내려오고, **지금 자리**에 ▼ 화살표가 선다.
   * ⚠ R2 — 미래 목표는 그리지 않는다. 지나온 것과 **지금 하나**까지다.
   */
  private renderChain(): void {
    this.chainC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.chainC = c; this.add(c);
    const top = this.contentTop + 26;

    const ch = StoryStore.currentChapter();
    const def = STORY_CHAPTERS.find((x) => x.chapter === ch);
    const bx = LIST_X + 8;
    const bw = PANEL_W - bx - 20;

    // 챕터 배너
    const g = this.scene.add.graphics();
    g.fillStyle(0x12263a, 0.95); g.fillRect(bx, top + 8, bw, 56);
    g.lineStyle(1, 0x3c6f95, 1); g.strokeRect(bx, top + 8, bw, 56);
    g.fillStyle(0xd8b25f, 1); g.fillRect(bx, top + 8, 4, 56);
    c.add(g);
    const eyebrow = this.scene.add.text(bx + 16, top + 22, '제 ' + ch + ' 장', {
      fontFamily: FONT, fontSize: '10px', color: '#6f8ba1',
    }).setOrigin(0, 0.5);
    const title = this.scene.add.text(bx + 16, top + 42, def?.titleKo ?? '', {
      fontFamily: FONT, fontSize: '18px', color: C_TEXT, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    clampTextWidth(title, bw - 140);
    const badge = this.scene.add.text(bx + bw - 16, top + 32, '진행 중', {
      fontFamily: FONT, fontSize: '11px', color: '#0b1620', fontStyle: 'bold',
      backgroundColor: '#d8b25f', padding: { x: 8, y: 3 },
    }).setOrigin(1, 0.5);
    c.add([eyebrow, title, badge]);

    // 1인칭 한 줄 — 지금 어디에 서 있는지
    const chain = this.chainRows(ch);
    const cur = chain.find((r) => !r.done);
    const lead = cur ? (narrativeOf(cur.q.id)?.intro ?? cur.q.descKo) : '이 장에서 할 일은 다 했다.';
    const quote = this.scene.add.text(bx + 4, top + 76, lead, {
      fontFamily: FONT, fontSize: '12px', color: '#d6c9a8', fontStyle: 'italic',
      lineSpacing: 4, wordWrap: { width: bw - 8, useAdvancedWrap: true },
    });
    c.add(quote);

    let y = top + 76 + quote.height + 16;
    const hd = this.scene.add.text(bx + 4, y, '목표', { fontFamily: FONT, fontSize: '12px', color: '#6f8ba1' });
    c.add(hd); y += hd.height + 8;

    // 붉은 점선 척추
    const spineX = bx + 12;
    const spine = this.scene.add.graphics();
    const rowTop = y;

    let drawn = 0;
    for (const r of chain) {
      if (y + 26 > PANEL_H - this.contentTop - 12) break;
      // 체크박스
      const box = this.scene.add.graphics();
      box.fillStyle(r.done ? 0x14352c : 0x0e1c2a, 1); box.fillRect(spineX + 10, y + 2, 13, 13);
      box.lineStyle(1, r.done ? 0x4af2a1 : 0x3c6f95, 1); box.strokeRect(spineX + 10, y + 2, 13, 13);
      if (r.done) {
        box.lineStyle(2, 0xd8ffe8, 1);
        box.lineBetween(spineX + 13, y + 8, spineX + 16, y + 12);
        box.lineBetween(spineX + 16, y + 12, spineX + 21, y + 4);
      }
      c.add(box);
      const t = this.scene.add.text(spineX + 32, y + 9, r.label, {
        fontFamily: FONT, fontSize: '13px',
        color: r.done ? C_DIM : C_TEXT, fontStyle: r.done ? 'normal' : 'bold',
      }).setOrigin(0, 0.5);
      clampTextWidth(t, bw - 130);
      c.add(t);
      if (r.note) {
        const n = this.scene.add.text(spineX + 32, y + 24, r.note, {
          fontFamily: FONT, fontSize: '10px', color: '#6a7f92',
        }).setOrigin(0, 0);
        clampTextWidth(n, bw - 130);
        c.add(n);
      }
      if (r.target > 1) {
        const p2 = this.scene.add.text(bx + bw - 8, y + 9, `${r.cur}/${r.target}`, {
          fontFamily: FONT, fontSize: '11px', color: C_DIM,
        }).setOrigin(1, 0.5);
        const bg = this.scene.add.graphics();
        const pw = 54, px = bx + bw - 8 - 44 - pw;
        bg.fillStyle(0x0d1c2c, 1); bg.fillRect(px, y + 6, pw, 6);
        bg.fillStyle(0xffb26b, 1); bg.fillRect(px, y + 6, (pw * r.cur) / Math.max(1, r.target), 6);
        c.add([bg, p2]);
      }
      // 지금 자리 화살표
      if (!r.done && drawn === chain.filter((x) => x.done).length) {
        const ar = this.scene.add.graphics();
        ar.fillStyle(0xe0483a, 1);
        ar.fillTriangle(spineX - 6, y + 4, spineX + 4, y + 4, spineX - 1, y + 14);
        c.add(ar);
      }
      y += r.note ? 38 : 26;
      drawn++;
    }

    // 척추 — 점선
    spine.lineStyle(2, 0xe0483a, 0.85);
    for (let sy = rowTop; sy < y - 8; sy += 7) spine.lineBetween(spineX, sy, spineX, sy + 4);
    c.add(spine);

    const tail = this.scene.add.text(bx + 4, y + 10,
      '다음 할 일은 그 사람과 이야기해야 열립니다.', {
        fontFamily: FONT, fontSize: '11px', color: '#6a7f92',
      });
    c.add(tail);

    enforceTextBounds(c, PANEL_W - 10, 'JournalPanel/chain');
    applyScreenFixed(this);
  }

  /**
   * 체인 행 — 이 챕터에서 **지나온 목표 + 지금 하나**.
   * 완료한 임무의 목표는 모두, 진행 중 임무는 완료분 + 다음 하나, 그 뒤는 그리지 않는다.
   */
  private chainRows(ch: number): { q: StoryQuestDef; label: string; note?: string; done: boolean; cur: number; target: number }[] {
    const out: { q: StoryQuestDef; label: string; note?: string; done: boolean; cur: number; target: number }[] = [];
    const qs = STORY_QUESTS.filter((q) => q.chapter === ch);
    for (const q of qs) {
      const st = StoryStore.status(q);
      if (st === 'locked' || st === 'declined') continue;
      const n = narrativeOf(q.id);
      let stop = false;
      q.objectives.forEach((o, i) => {
        if (stop) return;
        const done = StoryStore.objectiveDone(q, i);
        const tgt = StoryStore.objectiveTarget(o);
        const cur = Math.min(tgt, StoryStore.progress(q.id)?.obj[i] ?? 0);
        out.push({ q, label: n?.objectives?.[i] ?? o.labelKo, note: i === 0 ? q.titleKo : undefined, done, cur, target: tgt });
        if (!done) stop = true;    // 미래 목표는 열지 않는다 (R2)
      });
      if (stop) break;
      if (st !== 'done') break;
    }
    return out;
  }

  // ═══════════ 상세 ═══════════
  private renderDetail(): void {
    this.detC?.destroy();
    this.narrMask?.destroy(); this.narrMask = undefined;
    this.narrRect = null;
    const c = this.scene.add.container(0, 0);
    this.detC = c; this.add(c);
    const top = this.contentTop + 26;

    const row = this.rows.find((r) => r.q.id === this.selId);
    if (!row) { applyScreenFixed(this); return; }
    const { q, st, pct } = row;
    const locked = st === 'locked' || st === 'declined';

    // 상단 바 — 임무명 · 지역 · 상태
    const title = this.scene.add.text(DET_X + 4, top + 16, locked ? '???' : `[${q.titleKo}]`, {
      fontFamily: FONT, fontSize: '16px', color: locked ? C_LOCK : C_GOLD, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    clampTextWidth(title, DET_W - 190);
    const lab = this.stateLabel(st);
    const meta = this.scene.add.text(DET_X + DET_W - 4, top + 16,
      locked ? lab.ko : `${REGION_LABEL[q.region] ?? q.region}  ·  ${lab.ko}  ·  ${pct}%`, {
        fontFamily: FONT, fontSize: '12px', color: lab.color,
      }).setOrigin(1, 0.5);
    c.add([title, meta]);
    const hr = this.scene.add.graphics();
    hr.lineStyle(1, 0x1c3d5a, 1); hr.lineBetween(DET_X, top + 30, DET_X + DET_W, top + 30);
    c.add(hr);

    if (locked) {
      const t = this.scene.add.text(DET_X + DET_W / 2, top + 110,
        '아직 받지 않은 의뢰입니다.\n조건이 갖춰지면 그 사람이 먼저 말을 걸어 옵니다.', {
          fontFamily: FONT, fontSize: '12px', color: C_DIM, align: 'center', lineSpacing: 6,
        }).setOrigin(0.5, 0);
      c.add(t);
      enforceTextBounds(c, PANEL_W - 10, 'JournalPanel');
      applyScreenFixed(this);
      return;
    }

    // ── 초상 + 나레이션 ──
    const py = top + 44;
    const FACE = 6;                     // 16px 아트 × 6 = 96
    const faceW = 16 * FACE;
    const npc = q.giver ? getStoryNpc(q.giver) : undefined;
    if (q.giver) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x12263a, 1); g.fillRect(DET_X + 4, py, faceW, faceW);
      g.lineStyle(1, 0x3c6f95, 1); g.strokeRect(DET_X + 4, py, faceW, faceW);
      c.add(g);
      const key = ensureFacePortrait(this.scene, characterOf(q.giver), FACE);
      c.add(this.scene.add.image(DET_X + 4, py, key).setOrigin(0, 0));
      const nm = this.scene.add.text(DET_X + 4 + faceW / 2, py + faceW + 4, npc?.nameKo ?? '', {
        fontFamily: FONT, fontSize: '11px', color: C_TEXT,
      }).setOrigin(0.5, 0);
      clampTextWidth(nm, faceW);
      c.add(nm);
    }

    const nx = q.giver ? DET_X + 4 + faceW + 12 : DET_X + 4;
    const nw = DET_X + DET_W - 4 - nx;
    const nh = faceW + 22;
    this.buildNarration(c, q, nx, py, nw, nh);

    // ── 목표 ──
    let y = py + nh + 14;
    const oh = this.scene.add.text(DET_X + 4, y, '목표', { fontFamily: FONT, fontSize: '12px', color: '#6f8ba1' });
    c.add(oh);
    // 152차 — 클리어 난이도. "무엇을 실제로 해야 하는가"를 목표 바로 위에서 알려 준다.
    const diff = questDifficulty(q);
    const dTxt = diff.actionsKo.length ? `${diff.labelKo} · ${diff.actionsKo.join(' · ')}` : diff.labelKo;
    const dt = this.scene.add.text(DET_X + DET_W - 4, y + oh.height / 2, dTxt, {
      fontFamily: FONT, fontSize: '11px', color: DIFF_COLOR[diff.tier],
    }).setOrigin(1, 0.5);
    clampTextWidth(dt, DET_W - 70);
    c.add(dt);
    y += oh.height + 6;
    q.objectives.forEach((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const tgt = StoryStore.objectiveTarget(o);
      const cur = Math.min(tgt, StoryStore.progress(q.id)?.obj[i] ?? 0);
      const g = this.scene.add.graphics();
      g.fillStyle(done ? 0x14352c : 0x14243a, 0.92);
      g.fillRect(DET_X + 4, y, DET_W - 8, 30);
      g.lineStyle(1, done ? 0x2f7a5c : 0x24455f, 1);
      g.strokeRect(DET_X + 4, y, DET_W - 8, 30);
      c.add(g);
      const label = narrativeOf(q.id)?.objectives?.[i] ?? o.labelKo;
      const t = this.scene.add.text(DET_X + 16, y + 15, label, {
        fontFamily: FONT, fontSize: '12px', color: done ? C_OK : C_TEXT,
      }).setOrigin(0, 0.5);
      clampTextWidth(t, DET_W - 110);
      c.add(t);
      if (tgt > 1) {
        const p2 = this.scene.add.text(DET_X + DET_W - 34, y + 15, `${cur}/${tgt}`, {
          fontFamily: FONT, fontSize: '11px', color: C_DIM,
        }).setOrigin(1, 0.5);
        c.add(p2);
      }
      if (done) {
        const ck = this.scene.add.graphics();
        ck.lineStyle(2, 0x7fe0b0, 1);
        ck.lineBetween(DET_X + DET_W - 24, y + 15, DET_X + DET_W - 19, y + 20);
        ck.lineBetween(DET_X + DET_W - 19, y + 20, DET_X + DET_W - 12, y + 9);
        c.add(ck);
      }
      y += 34;
    });

    // ── 보상 (완료 후에만 전부 드러난다 — 141차 규칙) ──
    y += 6;
    const rh = this.scene.add.text(DET_X + 4, y, '보상', { fontFamily: FONT, fontSize: '12px', color: '#6f8ba1' });
    c.add(rh); y += rh.height + 6;
    this.drawRewards(c, q, st, y);

    enforceTextBounds(c, PANEL_W - 10, 'JournalPanel');
    applyScreenFixed(this);
  }

  /**
   * 브리핑 나레이션 — **박스 자체 스크롤**(사용자 지시).
   * R4: 정의문 요약(descKo)이 아니라 NPC의 말 + 내가 받아들인 것.
   */
  private buildNarration(
    c: Phaser.GameObjects.Container, q: StoryQuestDef, x: number, y: number, w: number, h: number,
  ): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x08121c, 0.8); g.fillRect(x, y, w, h);
    g.lineStyle(1, 0x24455f, 1); g.strokeRect(x, y, w, h);
    c.add(g);

    const n = narrativeOf(q.id);
    const st = StoryStore.status(q);
    const parts: string[] = [];
    if (n?.intro) parts.push(n.intro);
    const line = st === 'done' ? n?.epilogue ?? n?.done : st === 'active' ? n?.progress ?? n?.offer : n?.offer;
    if (line) parts.push(`"${line}"`);
    if (parts.length === 0) parts.push(q.descKo);
    const note = StoryStore.offerNoteKo(q);
    if (note) parts.push(note);

    const inner = this.scene.add.container(0, 0);
    this.narrC = inner;
    c.add(inner);
    const t = this.scene.add.text(x + 10, y + 8, parts.join('\n\n'), {
      fontFamily: FONT, fontSize: '13px', color: '#d6c9a8', lineSpacing: 5,
      wordWrap: { width: w - 28, useAdvancedWrap: true },
    });
    inner.add(t);

    const maskG = this.scene.make.graphics({}, false).setScrollFactor(0);
    this.narrMask = maskG;
    inner.setMask(maskG.createGeometryMask());
    this.narrRect = new Phaser.Geom.Rectangle(x, y, w, h);
    this.narrMax = Math.max(0, t.height + 16 - h);
    this.lastX = NaN;
    this.syncNarrMask();
    this.applyNarrScroll();

    // 스크롤바 — 넘칠 때만
    if (this.narrMax > 0) {
      const bar = this.scene.add.graphics();
      this.narrBar = bar;
      c.add(bar);
      this.paintNarrBar();
      const hit = this.scene.add.rectangle(x + w - 7, y + h / 2, 12, h, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        const rel = Phaser.Math.Clamp((p.y - this.y - y) / h, 0, 1);
        this.narrScroll = Math.round(rel * this.narrMax);
        this.applyNarrScroll();
      });
      c.add(hit);
    }
  }

  private narrBar?: Phaser.GameObjects.Graphics;

  private paintNarrBar(): void {
    const g = this.narrBar; const r = this.narrRect;
    if (!g || !r || this.narrMax <= 0) return;
    g.clear();
    const bx = r.x + r.width - 8;
    g.fillStyle(0x0d1c2c, 1); g.fillRect(bx, r.y + 2, 5, r.height - 4);
    const th = Math.max(20, (r.height - 4) * (r.height / (r.height + this.narrMax)));
    const ty = r.y + 2 + (r.height - 4 - th) * (this.narrScroll / this.narrMax);
    g.fillStyle(0x3d6f96, 1); g.fillRect(bx, ty, 5, th);
  }

  private applyNarrScroll(): void {
    this.narrC?.setY(-this.narrScroll);
    this.paintNarrBar();
  }

  private syncNarrMask(): void {
    const g = this.narrMask; const r = this.narrRect;
    if (!g || !r) return;
    this.lastX = this.x; this.lastY = this.y;
    g.clear(); g.fillStyle(0xffffff, 1);
    g.fillRect(this.x + r.x + 1, this.y + r.y + 1, r.width - 2, r.height - 2);
  }

  /** 보상 카드 — 아이콘 + 라벨 + 값. 줄바꿈으로 흐른다 */
  private drawRewards(c: Phaser.GameObjects.Container, q: StoryQuestDef, st: string, y0: number): void {
    const cards: { icon: string; label: string; value: string }[] = [];
    cards.push({ icon: 'rw_xp', label: '경험치', value: `+${q.xp.toLocaleString()}` });
    const r = q.rewards;
    if (r?.coins) cards.push({ icon: 'rw_coin', label: '재화', value: `${r.coins.toLocaleString()}원` });
    for (const it of r?.items ?? []) {
      cards.push({ icon: 'it_backpack', label: questRewardItemName(it.id) ?? it.id, value: it.qty > 1 ? `x${it.qty}` : (it.bound ? '귀속' : '') });
    }
    for (const lic of r?.licenses ?? []) {
      cards.push({ icon: 'rw_license', label: getLicenseByType(lic)?.nameKo ?? String(lic), value: '자격' });
    }
    for (const sk of r?.skillUnlocks ?? []) {
      cards.push({ icon: 'rw_skill', label: getSkillById(sk)?.nameKo ?? sk, value: '기술' });
    }
    if (r?.shopUnlocks?.length) {
      cards.push({ icon: 'rw_shop', label: '상점 품목', value: `${r.shopUnlocks.length}종` });
    }
    if (q.reputation?.sea) cards.push({ icon: 'rw_rep', label: '바다 평판', value: `${q.reputation.sea > 0 ? '+' : ''}${q.reputation.sea}` });

    // 완료 전에는 해금형 보상을 감춘다(141차 — 보상은 고른 뒤에만 드러난다)
    const hide = st !== 'done';
    const CW = (DET_W - 8 - 8) / 3, CH = 42;
    let i = 0;
    for (const card of cards) {
      const col = i % 3, rowI = Math.floor(i / 3);
      if (y0 + rowI * (CH + 6) + CH > PANEL_H - this.contentTop - 4) break;
      const x = DET_X + 4 + col * (CW + 4);
      const y = y0 + rowI * (CH + 6);
      const g = this.scene.add.graphics();
      g.fillStyle(0x14243a, 0.92); g.fillRect(x, y, CW, CH);
      g.lineStyle(1, 0x24455f, 1); g.strokeRect(x, y, CW, CH);
      c.add(g);
      const secret = hide && card.label !== '경험치' && card.label !== '재화';
      const ic = addPixelIcon(this.scene, card.icon, x + 18, y + CH / 2, 18);
      if (ic) { ic.setAlpha(secret ? 0.3 : 1); c.add(ic); }
      const lt = this.scene.add.text(x + 34, y + 13, secret ? '???' : card.label, {
        fontFamily: FONT, fontSize: '11px', color: secret ? C_LOCK : C_TEXT,
      }).setOrigin(0, 0.5);
      clampTextWidth(lt, CW - 42);
      const vt = this.scene.add.text(x + 34, y + 29, secret ? '' : card.value, {
        fontFamily: FONT, fontSize: '11px', color: C_GOLD,
      }).setOrigin(0, 0.5);
      clampTextWidth(vt, CW - 42);
      c.add([lt, vt]);
      i++;
    }
  }
}
