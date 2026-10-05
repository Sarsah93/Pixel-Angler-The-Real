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
 *
 * 188차 — 처음 열 때 체험 가이드(`GuideTour` — 'journal'): 할 일 고르기 → 고정 체크(필드 화살표) →
 *   「완료한 할 일 표시」 → 「이야기」 탭을 **직접 눌러 보게** 한다. 고정 칩의 설명 꼬리
 *   (「— 「지금 할 일」에 표시」)는 지웠다 — 기능은 글이 아니라 가이드가 가르친다.
 */

import Phaser from 'phaser';
import {
  STORY_CHAPTERS, STORY_QUESTS, getStoryNpc, getLicenseByType, narrativeOf, getSkillById,
  characterOf, questDifficulty, objectiveHowToKo, type StoryQuestDef, type QuestDifficultyTier,
  JOURNAL_PAGES, ORACLE_FISH_DB, FISH_DATABASE,
} from '@tra/core';
import { GUIDE_NAMES as JOURNAL_GUIDE_NAMES } from '../data/QuestGuideNames.js';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { StoryStore } from '../store/StoryStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { ensureFacePortrait } from './CharacterSprite.js';
import { characterLook } from '../data/EquipOutfit.js';
import { GameState } from '../store/GameState.js';
import { addPixelIcon } from './PixelIcon.js';
import { questRewardItemName } from '../data/QuestRewardItems.js';
import { getLocale } from '../i18n/I18n.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { LedgerStore } from '../store/LedgerStore.js';
import { ConsignQueue } from '../store/ConsignQueue.js';
import { kstYmd, type DayLedgerPage } from '@tra/core';

const PANEL_W = 1080;
const PANEL_H = 656;
const FONT = '"Noto Sans KR", sans-serif';

const LIST_X = 12;
const LIST_W = 486;
const DET_X = LIST_X + LIST_W + 14;
const DET_W = PANEL_W - DET_X - 14;

/** 표 컬럼 — 고정 / 초상 / 임무 / 지역 / 상태 / 진행률 */
const C_FACE = 34;
const C_TRACK = 34;
const C_REGION = 74;
const C_STATE = 66;
const C_PROG = 72;
/**
 * 177차 — 열 합이 **행 배경 폭**(LIST_W - 8)에 맞아야 한다.
 * 구 식(-34)은 합이 500으로 행 배경(478)을 22px 넘어, 마지막 진행률 바가 창 밖으로 삐져나왔다.
 * 좌우 안여백 6+6 · 열 사이 간격 4+8+6+6+6 = 30 을 빼고 남은 폭이 할 일 이름 칸이다.
 */
const C_NAME = (LIST_W - 8) - 12 - 30 - C_TRACK - C_FACE - C_REGION - C_STATE - C_PROG;

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

export interface JournalConfig {
  onClose: () => void;
  /** 214차 「나날」 — 지난 하루 한 장을 결산 창으로 연다(씬의 팝업 스택에 올린다) */
  onOpenDay?: (pages: DayLedgerPage[], idx: number) => void;
  /** 214차 「나날」 — 맡겨 둔 위판 물건 목록 */
  onOpenConsign?: () => void;
}

export class JournalPanel extends DraggablePanel {
  /** 완료한 임무도 보여준다 (기본 꺼짐 — 재미를 깨지 않는다) */
  private showDone = false;
  /** 아직 받을 수 없는 임무를 이름만 보여준다 (기본 꺼짐 — R2) */
  private showLocked = false;

  /** 임무 목록 / 이야기(챕터 체인) */
  private tab: 'tasks' | 'chain' | 'days' = 'tasks';
  private readonly cfg: JournalConfig;
  /** 214차 「나날」 — 지난 하루 목록 스크롤 · 영역(휠) · 가이드가 짚는 칸 */
  private daysScroll = 0;
  private daysPastRect: Phaser.Geom.Rectangle | null = null;
  private daysRects: Record<'head' | 'ahead' | 'past', Phaser.Geom.Rectangle | null> = { head: null, ahead: null, past: null };
  /** 188차 — 이야기 탭 안의 보기: 이번 장(체인) / 조행록(지나온 장 + 채워 가는 장) */
  private storyView: 'chapter' | 'log' = 'chapter';
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
  /** 체험 가이드 — 머리줄 단추 자리(패널 로컬) · 목록 행 클릭 수 */
  private hdrRects: Record<string, Phaser.Geom.Rectangle> = {};
  private tourRowClicks = 0;

  constructor(scene: Phaser.Scene, cfg: JournalConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '일지 — 할 일', onClose: cfg.onClose, dim: false, depth: 891,
    });

    this.cfg = cfg;
    this.frameG = scene.add.graphics();
    this.add(this.frameG);

    this.wheelHandler = (p, _o, _dx, dy) => {
      const lx = p.x - this.x, ly = p.y - this.y;
      if (this.narrRect && Phaser.Geom.Rectangle.Contains(this.narrRect, lx, ly)) {
        const next = Phaser.Math.Clamp(this.narrScroll + (dy > 0 ? 34 : -34), 0, this.narrMax);
        if (next !== this.narrScroll) { this.narrScroll = next; this.applyNarrScroll(); }
        return;
      }
      if (this.tab === 'days') {
        if (this.daysPastRect && Phaser.Geom.Rectangle.Contains(this.daysPastRect, lx, ly)) {
          const max = Math.max(0, LedgerStore.closedPages().length - this.daysVisible());
          const next = Phaser.Math.Clamp(this.daysScroll + (dy > 0 ? 1 : -1), 0, max);
          if (next !== this.daysScroll) { this.daysScroll = next; this.renderDays(); }
        }
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
    maybeStartTour(scene, () => this.buildTour());
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
      const cur = Math.min(tgt, o.actionKey
        ? StoryStore.actionStep(q.id, i)
        : (StoryStore.progress(q.id)?.obj[i] ?? 0));
      acc += tgt > 0 ? cur / tgt : 0;
    });
    return Math.round((acc / n) * 100);
  }

  private stateLabel(st: string): { ko: string; color: string } {
    switch (st) {
      case 'active': return { ko: '진행 중', color: C_ACT };
      case 'available': return { ko: '새 할 일', color: C_OK };
      case 'done': return { ko: '완료함', color: C_DIM };
      case 'declined': return { ko: '거절함', color: C_LOCK };
      default: return { ko: '잠김', color: C_LOCK };
    }
  }

  private visibleRows(): number {
    return Math.floor((PANEL_H - (this.contentTop + 26) - 56) / ROW_H);
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
    this.setTitle(this.tab === 'days' ? '일지 — 나날' : this.tab === 'chain' ? '일지 — 이야기' : '일지 — 할 일');   // 214차 — 탭을 따라간다
    this.renderHeader();
    if (this.tab === 'chain' || this.tab === 'days') {
      this.listC?.destroy(); this.listC = undefined;
      this.detC?.destroy(); this.detC = undefined;
      this.narrMask?.destroy(); this.narrMask = undefined; this.narrRect = null;
      if (this.tab === 'days') this.renderDays();
      else if (this.storyView === 'log') this.renderLog(); else this.renderChain();
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
    if (this.tab === 'chain' || this.tab === 'days') {
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

    this.hdrRects = {};
    const toggle = (key: string, x: number, on: boolean, label: string, hit: () => void): number => {
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x1f5a3a : 0x14243a, 1); g.fillRect(x, y - 7, 14, 14);
      g.lineStyle(1, on ? 0x4af2a1 : 0x2c5878, 1); g.strokeRect(x, y - 7, 14, 14);
      if (on) { g.lineStyle(2, 0xd8ffe8, 1); g.lineBetween(x + 3, y, x + 6, y + 4); g.lineBetween(x + 6, y + 4, x + 11, y - 4); }
      const t = this.scene.add.text(x + 20, y, label, {
        fontFamily: FONT, fontSize: '11px', color: on ? C_TEXT : C_DIM,
      }).setOrigin(0, 0.5);
      const w = 20 + t.width + 14;
      this.hdrRects[key] = new Phaser.Geom.Rectangle(x - 7, y - 11, w, 22);
      const h = this.scene.add.rectangle(x + w / 2 - 7, y, w, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      h.on('pointerdown', () => { hit(); restoreHandCursor(this.scene); });
      c.add([g, t, h]);
      return x + w;
    };

    // 탭 — 할 일 목록 / 이야기(챕터 체인)
    let tx = LIST_X + 2;
    for (const [key, label] of [['tasks', '할 일'], ['chain', '이야기'], ['days', '나날']] as const) {
      const on = this.tab === key;
      const t = this.scene.add.text(tx + 26, y, label, {
        fontFamily: FONT, fontSize: '12px', color: on ? C_GOLD : C_DIM, fontStyle: on ? 'bold' : 'normal',
      }).setOrigin(0.5, 0.5);
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x1b3a52 : 0x0e1c2a, on ? 0.95 : 0.5); g.fillRect(tx, y - 11, 52, 22);
      if (on) { g.fillStyle(0xd8b25f, 1); g.fillRect(tx, y + 9, 52, 2); }
      this.hdrRects[key] = new Phaser.Geom.Rectangle(tx, y - 11, 52, 22);
      const h = this.scene.add.rectangle(tx + 26, y, 52, 22, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      h.on('pointerdown', () => {
        this.tab = key; this.rebuild(); restoreHandCursor(this.scene);
        // 214차 — 「나날」을 처음 열면 그 칸만의 체험 가이드(R11)
        if (key === 'days') maybeStartTour(this.scene, () => this.buildDaysTour());
      });
      c.add([g, t, h]);
      tx += 56;
    }

    let x = tx + 12;
    if (this.tab === 'tasks') {
      x = toggle('done', x, this.showDone, '완료한 할 일 표시', () => { this.showDone = !this.showDone; this.scroll = 0; this.rebuild(); });
      toggle('locked', x + 6, this.showLocked, '잠긴 할 일 표시', () => { this.showLocked = !this.showLocked; this.scroll = 0; this.rebuild(); });
    } else if (this.tab === 'chain') {
      // 188차 — 이야기 탭 보기 전환: 이번 장 / 조행록 (AG ④e)
      for (const [key, label] of [['chapter', '이번 장'], ['log', '조행록']] as const) {
        const on = this.storyView === key;
        const t = this.scene.add.text(0, y, label, {
          fontFamily: FONT, fontSize: '11px', color: on ? C_TEXT : C_DIM, fontStyle: on ? 'bold' : 'normal',
        }).setOrigin(0.5, 0.5);
        const w = Math.max(58, t.width + 20);
        t.setX(x + w / 2);
        const g = this.scene.add.graphics();
        g.fillStyle(on ? 0x1f5a3a : 0x14243a, 1); g.fillRoundedRect(x, y - 10, w, 20, 4);
        g.lineStyle(1, on ? 0x4af2a1 : 0x2c5878, 1); g.strokeRoundedRect(x, y - 10, w, 20, 4);
        this.hdrRects[key] = new Phaser.Geom.Rectangle(x, y - 10, w, 20);
        const h = this.scene.add.rectangle(x + w / 2, y, w, 20, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        h.on('pointerdown', () => { this.storyView = key; this.rebuild(); restoreHandCursor(this.scene); });
        c.add([g, t, h]);
        x += w + 6;
      }
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
        fontFamily: FONT, fontSize: '11px', color: '#8aa7bd',
      }).setOrigin(align, 0.5);
      c.add(t);
    };
    let cx = LIST_X + 6;
    head(cx, C_TRACK, '고정', 0.5); cx += C_TRACK + 4;
    head(cx, C_FACE, '의뢰인'); cx += C_FACE + 8;
    head(cx, C_NAME, '할 일'); cx += C_NAME + 6;
    head(cx, C_REGION, '지역', 0.5); cx += C_REGION + 6;
    head(cx, C_STATE, '상태', 0.5); cx += C_STATE + 6;
    head(cx, C_PROG, '진행률', 0.5);

    const line = this.scene.add.graphics();
    line.lineStyle(1, 0x1c3d5a, 1); line.lineBetween(LIST_X, hy + 10, LIST_X + LIST_W, hy + 10);
    c.add(line);

    if (this.rows.length === 0) {
      const t = this.scene.add.text(LIST_X + LIST_W / 2, top + 70, '지금 맡고 있는 할 일이 없습니다.\n항구 사람들과 이야기해 보세요.', {
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
    let y = hy + 34;   // 구분선(hy+10) 아래로 행 밴드를 내린다 — 머리글 침범 해소
    for (let i = start; i < end; i++) {
      this.drawRow(c, this.rows[i], y);
      y += ROW_H;
    }

    // 스크롤바 + 위치 표기 (조용한 잘림 금지)
    if (this.rows.length > vis) {
      const trackY = hy + 14, trackH = vis * ROW_H;
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
    // ① 고정 — 메인·서브 각 1건만. 진행 중·받을 수 있는 할 일에 체크가 선다(177차).
    const canPin = st === 'active' || st === 'available';
    const pinned = StoryStore.isPinned(q.id);
    const box = this.scene.add.graphics();
    const bxp = cx + C_TRACK / 2 - 7, byp = y - 7;
    box.setAlpha(canPin ? 1 : 0.35);
    box.fillStyle(pinned ? 0x2c6f52 : 0x0d1c2c, 1); box.fillRect(bxp, byp, 14, 14);
    box.lineStyle(1, canPin ? 0x3d6f96 : 0x27384a, 1); box.strokeRect(bxp, byp, 14, 14);
    if (pinned) {
      box.lineStyle(2, 0x7fe0b0, 1);
      box.lineBetween(bxp + 3, byp + 7, bxp + 6, byp + 11);
      box.lineBetween(bxp + 6, byp + 11, bxp + 11, byp + 3);
    }
    c.add(box);
    const pinHitX = cx + C_TRACK / 2;
    cx += C_TRACK + 4;
    // 의뢰인 얼굴 — 잠긴 임무는 누가 주는지도 알려주지 않는다.
    // 177차 — 발주자가 없는(스스로 정한) 할 일은 주인공 얼굴을 세운다. 회색 점은 잠긴 것에만 남긴다.
    if (!locked) {
      const cfg = q.giver ? characterOf(q.giver) : characterLook();
      const key = ensureFacePortrait(this.scene, cfg, 2);
      const fx = cx + C_FACE / 2;
      const plate = this.scene.add.graphics();
      plate.fillStyle(0x0b1a28, 1); plate.fillRect(fx - 15, y - 15, 30, 30);
      plate.lineStyle(1, sel ? 0x4d7ea6 : 0x24455f, 1); plate.strokeRect(fx - 15, y - 15, 30, 30);
      c.add(plate);
      const img = this.scene.add.image(fx, y, key).setOrigin(0.5).setDisplaySize(28, 28);
      c.add(img);
    } else {
      const dot = addPixelIcon(this.scene, 'mk_quest', cx + C_FACE / 2, y, 16);
      if (dot) { dot.setAlpha(0.25); c.add(dot); }
    }
    cx += C_FACE + 8;

    const name = this.scene.add.text(cx, y, locked ? '???' : q.titleKo, {
      fontFamily: FONT, fontSize: '14px',
      color: locked ? C_LOCK : sel ? '#ffffff' : C_TEXT,
      fontStyle: st === 'available' ? 'bold' : 'normal',
    }).setOrigin(0, 0.5);
    clampTextWidth(name, C_NAME);
    c.add(name);
    cx += C_NAME + 6;

    const reg = this.scene.add.text(cx + C_REGION / 2, y, locked ? '—' : (REGION_LABEL[q.region] ?? q.region), {
      fontFamily: FONT, fontSize: '12px', color: locked ? C_LOCK : C_DIM,
    }).setOrigin(0.5);
    clampTextWidth(reg, C_REGION);
    c.add(reg);
    cx += C_REGION + 6;

    const lab = this.stateLabel(st);
    const stT = this.scene.add.text(cx + C_STATE / 2, y, lab.ko, {
      fontFamily: FONT, fontSize: '12px', color: lab.color,
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
      // 행 배경 오른쪽 끝(LIST_X + LIST_W - 8) 안으로 가둔다 — 넘치면 패널 밖으로 삐져나온다
      const bx = cx + 6, bw = Math.max(20, Math.min(C_PROG - 12, LIST_X + LIST_W - 8 - 6 - bx));
      bg.fillStyle(0x0d1c2c, 1); bg.fillRect(bx, y + 5, bw, 5);
      bg.fillStyle(pct >= 100 ? 0x4af2a1 : 0xffb26b, 1); bg.fillRect(bx, y + 5, (bw * pct) / 100, 5);
      bg.lineStyle(1, 0x24455f, 1); bg.strokeRect(bx, y + 5, bw, 5);
      c.add(bg);
    }

    const hit = this.scene.add.rectangle(LIST_X + (LIST_W - 8) / 2, y, LIST_W - 8, ROW_H - 3, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      this.tourRowClicks++;
      this.selId = q.id; this.narrScroll = 0;
      this.renderList(); this.renderDetail(); restoreHandCursor(this.scene);
    });
    c.add(hit);

    // 고정 체크칸의 히트는 **행 선택보다 뒤에** 올린다 — 앞에 두면 행 전체 히트가 클릭을 삼킨다(177차)
    if (canPin) {
      const ph = this.scene.add.rectangle(pinHitX, y, 24, ROW_H - 4, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      ph.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Phaser.Types.Input.EventData) => {
        ev?.stopPropagation();
        StoryStore.setTracked(q.id);
        this.scene.time.delayedCall(0, () => { this.renderList(); this.renderDetail(); restoreHandCursor(this.scene); });
      });
      c.add(ph);
    }

  }

  // ═══════════ 체험 가이드 (188차) ═══════════
  /** 목록 위 행 사각형 범위 (패널 로컬) */
  private get listTop(): number { return this.contentTop + 26; }

  /** 목록 첫 행 중심 y (패널 로컬) — renderList의 `hy + 34`와 같은 식 */
  private rowCenterY(visIndex: number): number { return this.listTop + 14 + 34 + visIndex * ROW_H; }

  /** 고정할 수 있는(진행 중·새) 첫 행 — 보이는 창 안에서 */
  private firstPinnable(): { id: string; vis: number } | null {
    const vis = this.visibleRows();
    for (let i = this.scroll; i < Math.min(this.rows.length, this.scroll + vis); i++) {
      const r = this.rows[i];
      if (r.st === 'active' || r.st === 'available') return { id: r.q.id, vis: i - this.scroll };
    }
    return null;
  }

  private listScreenRect(): Phaser.Geom.Rectangle {
    return this.localRect(LIST_X - 4, this.listTop, LIST_W + 8, PANEL_H - this.listTop - 10);
  }

  private detailScreenRect(): Phaser.Geom.Rectangle {
    return this.localRect(DET_X - 6, this.listTop, DET_W + 12, PANEL_H - this.listTop - 10);
  }

  private hdrScreenRect(key: string): Phaser.Geom.Rectangle | null {
    const r = this.hdrRects[key];
    return r ? this.localRect(r.x, r.y, r.width, r.height) : null;
  }

  /**
   * 첫 열기 체험 가이드 — 일지가 하는 일 = **할 일 고르기 · 고정(필드 화살표) · 지나온 일 다시 보기 · 이야기**.
   * 창이 화면을 거의 다 덮으므로 말풍선은 **짚는 곳의 반대편 칸 위**에 앉힌다(목록을 짚으면 상세 쪽).
   */
  private buildTour(): TourOptions {
    let anchor: () => Phaser.Geom.Rectangle | null = () => this.listScreenRect();
    // 시작 시점에 갈래를 정해 둔다 — skipIf가 진행 중에 뒤집히면 「n / N」 쪽수가 흔들린다
    const first = this.firstPinnable();
    const plan = {
      tasks: this.tab === 'tasks' && this.rows.length > 0,
      pin: this.tab === 'tasks' && !!first && !StoryStore.isPinned(first.id),
      done: this.tab === 'tasks' && !this.showDone,
    };
    const pinId = plan.pin ? first?.id ?? null : null;
    const pinRect = (): Phaser.Geom.Rectangle | null => {
      const p = this.firstPinnable();
      if (!p) return null;
      return this.localRect(LIST_X + 6 + C_TRACK / 2 - 12, this.rowCenterY(p.vis) - (ROW_H - 4) / 2, 24, ROW_H - 4);
    };
    return {
      id: 'journal',
      anchor: () => anchor(),
      alive: () => this.active && !!this.scene,
      steps: [
        {
          text: '맡은 일과 해야 할 일은 모두 이 일지에 적힌다.',
          target: () => this.panelBounds(),
          onEnter: () => { anchor = () => this.listScreenRect(); },
        },
        {
          text: '왼쪽은 지금 맡은 일과 새로 받을 수 있는 일이다. 한 줄을 눌러 보자.',
          target: () => this.listScreenRect(),
          skipIf: () => !plan.tasks,
          onEnter: () => { anchor = () => this.listScreenRect(); this.tourRowClicks = 0; },
          wait: () => this.tourRowClicks > 0,
        },
        {
          text: '오른쪽에는 그 일을 맡긴 사람의 이야기와 목표, 보상이 나온다. 이야기가 길면 그 칸만 휠로 굴려 읽는다.',
          target: () => this.detailScreenRect(),
          skipIf: () => !plan.tasks,
          onEnter: () => { anchor = () => this.detailScreenRect(); },
        },
        {
          text: '맨 앞 칸에 체크하면 그 일이 화면의 「지금 할 일」에 붙고, 길 위에 갈 곳을 가리키는 화살표가 뜬다. 체크해 보자.',
          target: pinRect,
          skipIf: () => !plan.pin,
          onEnter: () => { anchor = () => this.listScreenRect(); },
          // 체크한 행이 목록 밖으로 밀렸거나 탭을 옮겼으면 막히지 않게 넘긴다
          wait: () => (!!pinId && StoryStore.isPinned(pinId)) || this.tab !== 'tasks',
        },
        {
          text: '맨 앞 칸의 체크는 「고정」이다. 고정한 일은 화면의 「지금 할 일」에 붙고, 길 위에 갈 곳을 가리키는 화살표가 뜬다.',
          target: () => pinRect() ?? this.listScreenRect(),
          skipIf: () => plan.pin || !plan.tasks,
          onEnter: () => { anchor = () => this.listScreenRect(); },
        },
        {
          text: '끝낸 일은 목록에서 감춰진다. 「완료한 할 일 표시」를 켜면 다시 볼 수 있다. 켜 보자.',
          target: () => this.hdrScreenRect('done'),
          skipIf: () => !plan.done,
          onEnter: () => { anchor = () => this.hdrScreenRect('done'); },
          wait: () => this.showDone || this.tab !== 'tasks',
        },
        {
          text: '「이야기」를 누르면 지금 장에서 걸어온 길을 한 줄로 따라 읽을 수 있다. 눌러 보자.',
          target: () => this.hdrScreenRect('chain'),
          onEnter: () => { anchor = () => this.hdrScreenRect('chain'); },
          wait: () => this.tab === 'chain',
        },
        {
          text: '지나온 목표와 지금 할 목표가 한 줄로 이어진다. 「조행록」에는 지나온 장과 채워 가는 기록이 모인다.',
          target: () => this.localRect(LIST_X - 4, this.listTop, PANEL_W - LIST_X - 8, PANEL_H - this.listTop - 10),
          onEnter: () => { anchor = () => this.hdrScreenRect('log'); },
        },
      ],
    };
  }

  // ═══════════ 나날 (214차) ═══════════
  /**
   * 「나날」 — 이야기 날짜(다 잔 잠 횟수)와 실제 날짜를 따로 보여 준다(사용자 지시: 「N일째」는 실제 일수와 헷갈린다 → 「이야기 N번째」).
   *  - 위: 이야기 N번째 + 오늘 실제 날짜.
   *  - 왼쪽 「앞으로」: 정해진 때가 있는 일 — 실습 기한 · 정기 납부 · 맡긴 위판. 남은 것은 **잠 횟수**로 센다(「잠 N번 남음」).
   *  - 오른쪽 「지난 날들」: 닫힌 장(최근 14장) — 누르면 그날의 결산 창.
   * 장부는 하루 경계(새벽 4시)마다 · 잠마다 닫히므로 실제 날짜 줄과 이야기 번째가 1:1이 아니다(하루에 두 번 자면 두 번째가 늘어난다).
   */
  private static readonly DAYS_ROW_H = 38;

  private daysTop(): number { return this.contentTop + 26; }
  private daysVisible(): number {
    const top = this.daysTop() + 92 + 30;
    return Math.max(3, Math.floor((PANEL_H - 16 - top) / JournalPanel.DAYS_ROW_H));
  }

  private renderDays(): void {
    this.chainC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.chainC = c; this.add(c);
    const en = getLocale() === 'en';
    const top = this.daysTop();
    const L = LIST_X + 8;
    const R = PANEL_W - 24;
    const midX = LIST_X + 8 + 470;

    // ── 머리 — 이야기 N번째 + 실제 날짜 ──
    const nth = StoryStore.storyDay + 1;
    const big = this.scene.add.text(L + 6, top + 14, `이야기 ${nth}번째`, {
      fontFamily: FONT, fontSize: '26px', color: C_GOLD, fontStyle: 'bold',
    });
    const k = new Date(Date.now() + 9 * 3_600_000);
    const dows = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['일', '월', '화', '수', '목', '금', '토'];
    const real = en
      ? `Today · ${k.getUTCMonth() + 1}/${k.getUTCDate()} (${dows[k.getUTCDay()]})`
      : `오늘 · ${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${dows[k.getUTCDay()]})`;
    const realT = this.scene.add.text(L + 6, top + 56, real, { fontFamily: FONT, fontSize: '12px', color: C_DIM });
    c.add([big, realT]);
    this.daysRects.head = new Phaser.Geom.Rectangle(L, top + 8, Math.max(big.width, realT.width) + 16, 72);
    const sep = this.scene.add.graphics();
    sep.lineStyle(1, 0x1c3d5a, 1);
    sep.lineBetween(L, top + 88, R, top + 88);
    sep.lineBetween(midX, top + 96, midX, PANEL_H - 18);
    c.add(sep);

    // ── 왼쪽 「앞으로」 ──
    const colTop = top + 100;
    const head = (x: number, label: string): void => {
      c.add(this.scene.add.text(x, colTop, label, { fontFamily: FONT, fontSize: '12px', color: '#8aa7bd', fontStyle: 'bold' }));
    };
    head(L, '앞으로');
    type Ahead = { name: string; sub?: string; right: string; color: string; onClick?: () => void };
    const ahead: Ahead[] = [];
    const left = StoryStore.deadlineDaysLeft();
    if (left !== null) {
      ahead.push({
        name: '실습 기한', sub: `이야기 ${nth + Math.max(0, left)}번째까지`,
        right: left >= 0 ? `잠 ${left}번 남음` : `${-left}번 지남`, color: left < 0 ? '#ff8a7a' : left <= 14 ? C_ACT : C_TEXT,
      });
    }
    for (const it of [...GameState.upkeepItems()].sort((a, b) => a.daysLeft - b.daysLeft)) {
      ahead.push({
        name: en ? it.nameEn : it.nameKo,
        sub: `${it.costKrw.toLocaleString()}원 · 이야기 ${it.dueDay + 1}번째`,
        right: it.overdue ? `${it.overdueDays}번 밀림` : `잠 ${it.daysLeft}번 남음`,
        color: it.overdue ? '#ff8a7a' : it.daysLeft <= 3 ? C_ACT : C_TEXT,
      });
    }
    const pend = ConsignQueue.pending;
    if (pend.length) {
      const due = Math.min(...pend.map((b) => b.dueAtMs));
      const kd = new Date(due + 9 * 3_600_000);
      const hm = `${String(kd.getUTCHours()).padStart(2, '0')}:${String(kd.getUTCMinutes()).padStart(2, '0')}`;
      const day = kstYmd(new Date(due)) === kstYmd(new Date()) ? '오늘' : '내일';
      const lots = pend.reduce((n, b) => n + b.items.length, 0);
      ahead.push({ name: `위판장에 맡긴 물건 ${lots}개`, sub: `다음 경매 ${day} ${hm}`, right: '목록 보기', color: '#bfe9ff', onClick: this.cfg.onOpenConsign });
    }
    const RH = JournalPanel.DAYS_ROW_H;
    const colW = midX - L - 12;
    const maxAhead = this.daysVisible();
    let y = colTop + 24;
    if (!ahead.length) {
      c.add(this.scene.add.text(L + 4, y + 4, '정해진 때가 있는 일이 없다.', { fontFamily: FONT, fontSize: '12px', color: C_DIM }));
    }
    for (const a of ahead.slice(0, maxAhead)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x0e1c2a, 0.6); g.fillRect(L, y, colW, RH - 4);
      c.add(g);
      const rt = this.scene.add.text(L + colW - 8, y + (RH - 4) / 2, a.right, {
        fontFamily: FONT, fontSize: '12px', color: a.color, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      const nm = this.scene.add.text(L + 8, y + 3, a.name, { fontFamily: FONT, fontSize: '13px', color: C_TEXT });
      clampTextWidth(nm, colW - rt.width - 28);
      c.add([rt, nm]);
      if (a.sub) {
        const st = this.scene.add.text(L + 8, y + 19, a.sub, { fontFamily: FONT, fontSize: '10px', color: C_DIM });
        clampTextWidth(st, colW - rt.width - 28);
        c.add(st);
      }
      if (a.onClick) {
        const hit = this.scene.add.rectangle(L + colW / 2, y + (RH - 4) / 2, colW, RH - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        const cb = a.onClick;
        hit.on('pointerdown', () => { cb(); restoreHandCursor(this.scene); });
        c.add(hit);
      }
      y += RH;
    }
    if (ahead.length > maxAhead) {
      c.add(this.scene.add.text(L + colW, y, `외 ${ahead.length - maxAhead}건`, { fontFamily: FONT, fontSize: '10px', color: C_DIM }).setOrigin(1, 0));
    }
    this.daysRects.ahead = new Phaser.Geom.Rectangle(L - 4, colTop - 4, colW + 8, Math.max(60, y - colTop + 4));

    // ── 오른쪽 「지난 하루」 ──
    const PX = midX + 14;
    const pw = R - PX;
    head(PX, '지난 날들');
    const pages = LedgerStore.closedPages();
    const order = pages.map((p, i) => ({ p, i })).reverse();
    const vis = this.daysVisible();
    this.daysScroll = Phaser.Math.Clamp(this.daysScroll, 0, Math.max(0, order.length - vis));
    this.daysPastRect = new Phaser.Geom.Rectangle(PX - 4, colTop - 4, pw + 8, PANEL_H - colTop - 12);
    this.daysRects.past = this.daysPastRect;
    let py = colTop + 24;
    if (!order.length) {
      c.add(this.scene.add.text(PX + 4, py + 4, '아직 지난 하루가 없다.', { fontFamily: FONT, fontSize: '12px', color: C_DIM }));
    }
    const end = Math.min(order.length, this.daysScroll + vis);
    for (let j = this.daysScroll; j < end; j++) {
      const { p, i } = order[j]!;
      this.drawDayRow(c, p, PX, py, pw - 10, () => this.cfg.onOpenDay?.(pages, i));
      py += RH;
    }
    if (order.length > vis) {
      const trackY = colTop + 24, trackH = vis * RH - 4;
      const g = this.scene.add.graphics();
      g.fillStyle(0x0d1c2c, 1); g.fillRect(R - 4, trackY, 4, trackH);
      const th = Math.max(20, trackH * (vis / order.length));
      g.fillStyle(0x3d6f96, 1); g.fillRect(R - 4, trackY + (trackH - th) * (this.daysScroll / Math.max(1, order.length - vis)), 4, th);
      c.add(g);
      c.add(this.scene.add.text(R, PANEL_H - 16, `${this.daysScroll + 1}–${end} / ${order.length}`, { fontFamily: FONT, fontSize: '9px', color: '#6a8aa0' }).setOrigin(1, 1));
    }
    enforceTextBounds(c, PANEL_W - 20, 'JournalPanel.days');
    applyScreenFixed(this);
  }

  /** 지난 하루 한 줄 — 날짜 · 이야기 번째 · 돈 변화 · 어획 수 */
  private drawDayRow(c: Phaser.GameObjects.Container, p: DayLedgerPage, x: number, y: number, w: number, onClick: () => void): void {
    const RH = JournalPanel.DAYS_ROW_H;
    const en = getLocale() === 'en';
    const g = this.scene.add.graphics();
    g.fillStyle(0x0e1c2a, 0.6); g.fillRect(x, y, w, RH - 4);
    c.add(g);
    const ymd = p.openedYmd;
    const d = new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8))));
    const dows = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['일', '월', '화', '수', '목', '금', '토'];
    const date = en ? `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${dows[d.getUTCDay()]})` : `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${dows[d.getUTCDay()]})`;
    const net = p.coinsEnd - p.coinsStart;
    const money = net === 0 ? '±0원' : `${net > 0 ? '+' : '−'}${Math.abs(net).toLocaleString()}원`;
    const fish = p.catches.length;
    const rt = this.scene.add.text(x + w - 8, y + 9, money, {
      fontFamily: FONT, fontSize: '12px', color: net > 0 ? C_OK : net < 0 ? '#ff9b8a' : C_DIM, fontStyle: 'bold',
    }).setOrigin(1, 0);
    const dt = this.scene.add.text(x + 8, y + 3, date, { fontFamily: FONT, fontSize: '13px', color: C_TEXT });
    const sub = [p.storyDay !== undefined ? `이야기 ${p.storyDay + 1}번째` : '', fish > 0 ? `어획 ${fish}` : '', p.closedBy === 'sleep' ? '잠으로 마침' : '새벽 4시를 넘김']
      .filter(Boolean).join(' · ');
    const st = this.scene.add.text(x + 8, y + 19, sub, { fontFamily: FONT, fontSize: '10px', color: C_DIM });
    clampTextWidth(dt, w - rt.width - 28);
    clampTextWidth(st, w - rt.width - 28);
    const hit = this.scene.add.rectangle(x + w / 2, y + (RH - 4) / 2, w, RH - 4, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { g.clear(); g.fillStyle(0x1b3a52, 0.9); g.fillRect(x, y, w, RH - 4); });
    hit.on('pointerout', () => { g.clear(); g.fillStyle(0x0e1c2a, 0.6); g.fillRect(x, y, w, RH - 4); });
    hit.on('pointerdown', () => { onClick(); restoreHandCursor(this.scene); });
    c.add([rt, dt, st, hit]);
  }

  /** 「나날」 첫 열기 가이드 — 이야기 번째 · 앞으로 · 지난 하루 */
  private buildDaysTour(): TourOptions {
    const r = (k: 'head' | 'ahead' | 'past'): Phaser.Geom.Rectangle | null => {
      const x = this.daysRects[k];
      return x ? this.localRect(x.x, x.y, x.width, x.height) : null;
    };
    let anchor: () => Phaser.Geom.Rectangle | null = () => r('past');
    return {
      id: 'journal_days',
      anchor: () => anchor(),
      alive: () => this.active && !!this.scene && this.tab === 'days',
      steps: [
        { text: '침대에서 다 자고 일어날 때마다 이야기가 한 번씩 넘어간다. 달력 날짜와는 따로 센다.', target: () => r('head'), onEnter: () => { anchor = () => r('past'); } },
        { text: '기한이나 납부처럼 정해진 때가 있는 일이 여기 모인다. 「잠 N번 남음」은 그때까지 남은 잠의 횟수다.', target: () => r('ahead'), onEnter: () => { anchor = () => r('past'); } },
        { text: '지난 하루를 누르면 그날의 결산을 다시 펼쳐 볼 수 있다.', target: () => r('past'), onEnter: () => { anchor = () => r('ahead'); } },
      ],
    };
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
   * 조행록 보기 (188차 — AG ④e). 「동명 조행록」 17장 중 **손이 닿은 장만** 펼친다(R2).
   *  - 지나온 장(챕터): 지금 장까지의 제목만. 다음 장 제목은 쓰지 않는다.
   *  - 조행록 장: 지표 어종을 잡았거나 그 지역 사람들의 이야기를 마친 장만 카드로 — 두 조건 중
   *    어느 쪽이 채워졌는지 체크 칸으로 보인다. 아무것도 시작하지 않은 장은 목록에 없다(제목도 숨김).
   */
  private renderLog(): void {
    this.chainC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.chainC = c; this.add(c);
    const top = this.contentTop + 26;
    const bx = LIST_X + 8;
    const bw = PANEL_W - bx - 20;
    const states = StoryStore.journalPageStates();
    const filled = states.filter((st) => st.caught && st.arcDone).length;

    // 배너
    const g = this.scene.add.graphics();
    g.fillStyle(0x12263a, 0.95); g.fillRect(bx, top + 8, bw, 44);
    g.lineStyle(1, 0x3c6f95, 1); g.strokeRect(bx, top + 8, bw, 44);
    g.fillStyle(0xd8b25f, 1); g.fillRect(bx, top + 8, 4, 44);
    const title = this.scene.add.text(bx + 16, top + 30, '동명 조행록', {
      fontFamily: FONT, fontSize: '17px', color: C_TEXT, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const cnt = this.scene.add.text(bx + bw - 16, top + 30, getLocale() === 'en'
      ? `${filled} / ${JOURNAL_PAGES.length} pages filled` : `${filled} / ${JOURNAL_PAGES.length} 장 채움`, {
      fontFamily: FONT, fontSize: '12px', color: C_GOLD,
    }).setOrigin(1, 0.5);
    c.add([g, title, cnt]);

    // 지나온 장 — 지금 장까지만
    let y = top + 64;
    const cur = StoryStore.currentChapter();
    const hd = this.scene.add.text(bx + 4, y, '지나온 장', { fontFamily: FONT, fontSize: '12px', color: '#6f8ba1' });
    c.add(hd); y += hd.height + 6;
    const chs = STORY_CHAPTERS.filter((d) => d.chapter <= cur);
    // 데이터에 영문이 있으므로 조립 문장은 로케일별로 만든다(합성 문자열은 사전을 비껴간다 — 131차)
    const en = getLocale() === 'en';
    const chLine = chs.map((d) => (en
      ? `Ch.${d.chapter} ${d.titleEn}${d.chapter === cur ? ' (now)' : ''}`
      : `제${d.chapter}장 ${d.titleKo}${d.chapter === cur ? ' (지금)' : ''}`)).join('   ·   ');
    const chT = this.scene.add.text(bx + 4, y, chLine, {
      fontFamily: FONT, fontSize: '12px', color: C_TEXT, lineSpacing: 4, wordWrap: { width: bw - 8, useAdvancedWrap: true },
    });
    c.add(chT); y += chT.height + 14;

    // 조행록 장 — 손이 닿은 것만 (2열 카드)
    const hd2 = this.scene.add.text(bx + 4, y, '채워 가는 장', { fontFamily: FONT, fontSize: '12px', color: '#6f8ba1' });
    c.add(hd2); y += hd2.height + 8;
    const open = states.filter((st) => st.caught || st.arcDone);
    if (open.length === 0) {
      const none = this.scene.add.text(bx + 4, y, '아직 한 장도 쓰지 못했다. 제철 고기를 잡고, 그 바다 사람들과 이야기를 끝내면 한 장이 채워진다.', {
        fontFamily: FONT, fontSize: '12px', color: '#d6c9a8', fontStyle: 'italic', wordWrap: { width: bw - 8, useAdvancedWrap: true },
      });
      c.add(none);
    }
    const colW = Math.floor((bw - 12) / 2);
    const cardH = 58;
    const bottom = PANEL_H - 16;
    const speciesName = (id: string): string => {
      const o = ORACLE_FISH_DB.find((f) => f.speciesId === id);
      const f = FISH_DATABASE.find((x) => x.id === id);
      return en ? (o?.nameEn ?? f?.nameEn ?? '') : (o?.nameKo ?? f?.nameKo ?? '');
    };
    open.forEach((st, i) => {
      const def = JOURNAL_PAGES.find((pg) => pg.page === st.page);
      if (!def) return;
      const cx = bx + (i % 2) * (colW + 12);
      const cy = y + Math.floor(i / 2) * (cardH + 8);
      if (cy + cardH > bottom) return;   // 넘치는 카드는 그리지 않는다(17장 · 2열이면 들어간다)
      const full = st.caught && st.arcDone;
      const cg = this.scene.add.graphics();
      cg.fillStyle(full ? 0x14352c : 0x0e1c2a, 0.95); cg.fillRoundedRect(cx, cy, colW, cardH, 5);
      cg.lineStyle(1, full ? 0x4af2a1 : 0x2c5878, 1); cg.strokeRoundedRect(cx, cy, colW, cardH, 5);
      c.add(cg);
      const head = this.scene.add.text(cx + 10, cy + 8, en ? `Page ${def.page} · ${def.labelEn}` : `${def.page}장 · ${def.labelKo}`, {
        fontFamily: FONT, fontSize: '13px', color: full ? C_OK : C_TEXT, fontStyle: 'bold',
      });
      clampTextWidth(head, colW - 20);
      const cond = (en
        ? [def.minCm ? `${def.minCm}cm+` : '', def.count && def.count > 1 ? `×${def.count}` : '']
        : [def.minCm ? `${def.minCm}cm 이상` : '', def.count && def.count > 1 ? `${def.count}마리` : '']).filter(Boolean).join(' · ');
      const sub = this.scene.add.text(cx + 10, cy + 27, `${speciesName(def.speciesId)}${cond ? ` (${cond})` : ''} — ${en ? def.howEn : def.howKo}`, {
        fontFamily: FONT, fontSize: '10px', color: C_DIM,
      });
      clampTextWidth(sub, colW - 20);
      c.add([head, sub]);
      // 두 조건 체크 칸 — 어획 / 인연(이야기 완주)
      let kx = cx + 10;
      for (const [ok, label] of [[st.caught, '잡았다'], [st.arcDone, '이야기를 마쳤다']] as const) {
        const box = this.scene.add.graphics();
        box.fillStyle(ok ? 0x1f5a3a : 0x14243a, 1); box.fillRect(kx, cy + 42, 10, 10);
        box.lineStyle(1, ok ? 0x4af2a1 : 0x2c5878, 1); box.strokeRect(kx, cy + 42, 10, 10);
        if (ok) { box.lineStyle(2, 0xd8ffe8, 1); box.lineBetween(kx + 2, cy + 47, kx + 4, cy + 50); box.lineBetween(kx + 4, cy + 50, kx + 8, cy + 44); }
        const lt = this.scene.add.text(kx + 14, cy + 47, label, {
          fontFamily: FONT, fontSize: '10px', color: ok ? C_TEXT : C_DIM,
        }).setOrigin(0, 0.5);
        c.add([box, lt]);
        kx += 14 + lt.width + 16;
      }
    });

    enforceTextBounds(c, PANEL_W - 10, 'JournalPanel/log');
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
        const cur = Math.min(tgt, o.actionKey
          ? StoryStore.actionStep(q.id, i)
          : (StoryStore.progress(q.id)?.obj[i] ?? 0));
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
    // 165차 — 고정 조작은 목록 첫 칸(고정 체크)이 전담한다. 여기서는 상태만 알린다.
    const pinChip = st === 'active' && StoryStore.isPinned(q.id);
    if (pinChip) {
      // 188차 — 설명 꼬리(「— 「지금 할 일」에 표시」) 삭제. 무엇이 되는지는 체험 가이드가 가르친다.
      const chip = this.scene.add.text(DET_X + DET_W - 4, top + 42, '고정됨', {
        fontFamily: FONT, fontSize: '11px', color: '#7fe0b0',
      }).setOrigin(1, 0.5);
      clampTextWidth(chip, DET_W - 20);
      c.add(chip);
    }

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
    // 고정 칩이 붙으면 그만큼 아래로 흐른다(고정 y 금지 — ui-panel 규칙)
    const py = top + (pinChip ? 58 : 44);
    const FACE = 6;                     // 16px 아트 × 6 = 96
    const faceW = 16 * FACE;
    const npc = q.giver ? getStoryNpc(q.giver) : undefined;
    {
      // 177차 — 발주자가 없으면 주인공 얼굴. 초상 칸을 비워 두지 않는다.
      const g = this.scene.add.graphics();
      g.fillStyle(0x12263a, 1); g.fillRect(DET_X + 4, py, faceW, faceW);
      g.lineStyle(1, 0x3c6f95, 1); g.strokeRect(DET_X + 4, py, faceW, faceW);
      c.add(g);
      const key = ensureFacePortrait(this.scene, q.giver ? characterOf(q.giver) : characterLook(), FACE);
      c.add(this.scene.add.image(DET_X + 4, py, key).setOrigin(0, 0));
      const nm = this.scene.add.text(DET_X + 4 + faceW / 2, py + faceW + 4,
        q.giver ? (npc?.nameKo ?? '') : (GameState.player.nickname || '나'), {
        fontFamily: FONT, fontSize: '11px', color: C_TEXT,
      }).setOrigin(0.5, 0);
      clampTextWidth(nm, faceW);
      c.add(nm);
    }

    const nx = DET_X + 4 + faceW + 12;
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
    // 188차 — 순서형(M1-01 프롤로그 17목표)은 길어서 패널 아래로 넘친다. 앞서 마친 것은 한 줄로 접고
    //   (최근 2개만 남김) 아직 닿지 않은 뒤 목표는 열지 않는다(R2 — 챕터 뷰와 같은 규칙).
    let shown = q.objectives.map((_o, i) => i);
    if (q.ordered) {
      const first = q.objectives.findIndex((_o, k) => !StoryStore.objectiveDone(q, k));
      const cur = first < 0 ? q.objectives.length - 1 : first;
      const folded = Math.max(0, cur - 2);
      shown = shown.filter((i) => i >= folded && i <= cur);
      if (folded > 0) {
        const g0 = this.scene.add.graphics();
        g0.fillStyle(0x14352c, 0.92); g0.fillRect(DET_X + 4, y, DET_W - 8, 24);
        g0.lineStyle(1, 0x2f7a5c, 1); g0.strokeRect(DET_X + 4, y, DET_W - 8, 24);
        c.add(g0);
        c.add(this.scene.add.text(DET_X + 16, y + 12, `앞의 일 ${folded}가지를 마쳤다`, {
          fontFamily: FONT, fontSize: '11px', color: C_OK,
        }).setOrigin(0, 0.5));
        y += 28;
      }
    }
    q.objectives.forEach((o, i) => {
      if (!shown.includes(i)) return;
      const done = StoryStore.objectiveDone(q, i);
      const tgt = StoryStore.objectiveTarget(o);
      const cur = Math.min(tgt, o.actionKey
        ? StoryStore.actionStep(q.id, i)
        : (StoryStore.progress(q.id)?.obj[i] ?? 0));
      const g = this.scene.add.graphics();
      g.fillStyle(done ? 0x14352c : 0x14243a, 0.92);
      g.fillRect(DET_X + 4, y, DET_W - 8, 30);
      g.lineStyle(1, done ? 0x2f7a5c : 0x24455f, 1);
      g.strokeRect(DET_X + 4, y, DET_W - 8, 30);
      c.add(g);
      const label = narrativeOf(q.id)?.objectives?.[i] ?? o.labelKo;
      // 155차 — 진행 중인 첫 목표에는 **조작법 한 줄**을 붙인다(테스터: "얼음을 어떻게 운반해야 하는지 모르겠다")
      const showHow = !done && StoryStore.status(q) === 'active' && q.objectives.findIndex((_x, k) => !StoryStore.objectiveDone(q, k)) === i;
      const rowH = showHow ? 46 : 30;
      if (showHow) { g.clear(); g.fillStyle(0x14243a, 0.92); g.fillRect(DET_X + 4, y, DET_W - 8, rowH); g.lineStyle(1, 0x3c6f95, 1); g.strokeRect(DET_X + 4, y, DET_W - 8, rowH); }
      const t = this.scene.add.text(DET_X + 16, y + 15, label, {
        fontFamily: FONT, fontSize: '12px', color: done ? C_OK : C_TEXT,
      }).setOrigin(0, 0.5);
      clampTextWidth(t, DET_W - 110);
      c.add(t);
      if (showHow) {
        const how = this.scene.add.text(DET_X + 16, y + 30, `방법 · ${objectiveHowToKo(q, o, JOURNAL_GUIDE_NAMES)}`, {
          fontFamily: FONT, fontSize: '10px', color: '#9fc0d4',
        }).setOrigin(0, 0);
        clampTextWidth(how, DET_W - 30);
        c.add(how);
      }
      if (o.actionKey || tgt > 1) {
        const p2 = this.scene.add.text(DET_X + DET_W - 34, y + 15,
          `${cur}/${tgt}${o.actionKey && done ? ' (준비 완료!)' : ''}`, {
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
      y += rowH + 4;
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
