/**
 * @file DialoguePanel.ts
 * @description 탑다운 필드 NPC 대화창 (134차 신설 · **140차 재작성** — 하단 대화 박스 + 선택지 분기 + 우호도).
 *
 * 형태: 화면 하단에 걸치는 가로 박스. 열리는 순간 **주변이 어두워지고**(모달 딤) 왼쪽에 NPC 초상
 * (실게임 시트 'down' 프레임을 5배로 — 별도 초상 아트 없음), 그 아래 **우호도 게이지**(−5~+5 눈금 + 티어).
 * 오른쪽은 대사 + **선택지 목록**(↑↓ Enter · 마우스). 선택지는 core `choicesFor(q)`가 준다 —
 *  - 발주: 톤(우호도 미세 차이) → 수락.
 *  - 완료: **품삯 / 가르침 / 사양 / 청탁 …** — 고른 것에 따라 재화·숙련도·스킬 포인트·평판·우호도가 갈린다.
 *    미리보기 한 줄(`describeOutcomeKo`)을 라벨 옆에 흐리게 붙여 "왜 잃었는지 모르는 선택"을 만들지 않는다.
 * 우선순위는 종전대로 완료 가능 > 진행 중 > 발주 > 잡담. 우호도가 낮으면 서브 발주가 감춰지고
 * 그 사실을 대사로 말한다(조용히 사라지지 않는다). 일감(품삯)은 선택지 [일감 보기]로 들어간다.
 *
 * 모달(dim) · depth 940 — ConfirmDialog(950) 아래, 일반 팝업(800대) 위. 텍스트는 wordWrap + 흐름 배치(§4).
 */

import Phaser from 'phaser';
import {
  getStoryNpc, characterOf, affinityTier, AFFINITY_TIER_LABEL, affinityPips, narrativeOf,
  type StoryQuestDef, type QuestChoiceDef,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { StoryStore } from '../store/StoryStore.js';
import { dialogueOf, NPC_IDLE } from '../data/StoryDialogue.js';
import { enforceTextBounds, clampTextWidth } from './TextFit.js';
import { ensureCharSheet, charFrameName } from './CharacterSprite.js';

const W = 1040;
const H = 312;
const FONT = '"Noto Sans KR", sans-serif';
/** 초상 열 폭 — 시트 셀 32 × 5배 = 160 + 여백 */
const PORTRAIT_W = 200;
const PORTRAIT_SCALE = 5;
const TEXT_X = PORTRAIT_W + 8;
const TEXT_W = W - TEXT_X - 20;
const CHOICE_H = 30;
const COL = { text: '#e8f4fd', dim: '#8fa6bd', accent: '#ffe9a0', ok: '#7fe0b0', warn: '#ffb45a', hint: '#7f95aa' };

interface ChoiceRow { label: string; hint?: string; action: () => void; disabled?: boolean }

type View = 'main' | 'jobs' | 'reply';

export class DialoguePanel extends DraggablePanel {
  private bodyC?: Phaser.GameObjects.Container;   // ⚠ `body`는 Phaser Container 예약 프로퍼티(44차 함정)
  private readonly npcId: string;
  private readonly onClose: () => void;
  private readonly regionId: string;
  private view: View = 'main';
  /** 응답 화면(선택 직후) — 대사 + 결과 줄 */
  /**
   * 응답 화면 (141차) — 보상은 **고른 뒤에만** 드러난다: NPC 응답 → 받은 것(고정 보상) → 이 답으로(선택 몫) →
   * 다른 답들은 `???` → 주인공 한 줄(epilogue).
   */
  private reply: { line: string; lines: string[]; rewards: string[]; others: string[]; epilogue?: string; declined?: boolean } | null = null;
  private rows: ChoiceRow[] = [];
  private cursor = 0;
  private rowObjs: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; h?: Phaser.GameObjects.Text; row: ChoiceRow; cy: number }[] = [];
  private lastWorkMsg = '';
  private readonly keyHandler: (ev: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, npcId: string, onClose: () => void, regionId = '') {
    const npc = getStoryNpc(npcId);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: GAME_HEIGHT - H - 22,
      width: W, height: H, title: `${npc?.nameKo ?? npcId}  ·  ${npc?.roleKo ?? ''}`, onClose, dim: true, depth: 940,
    });
    this.npcId = npcId;
    this.onClose = onClose;
    this.regionId = regionId;
    StoryStore.event({ kind: 'talk', npcId });
    this.keyHandler = (ev: KeyboardEvent) => this.onKey(ev);
    scene.input.keyboard?.on('keydown', this.keyHandler);
    this.render();
    this.applyFix();
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input.keyboard?.off('keydown', this.keyHandler);
    super.destroy(fromScene);
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.rows.length === 0) return;
    if (ev.code === 'ArrowUp') { this.moveCursor(-1); ev.preventDefault(); }
    else if (ev.code === 'ArrowDown') { this.moveCursor(1); ev.preventDefault(); }
    else if (ev.code === 'Enter' || ev.code === 'Space') {
      const r = this.rows[this.cursor];
      if (r && !r.disabled) { ev.preventDefault(); r.action(); }
    }
  }
  private moveCursor(d: number): void {
    const n = this.rows.length;
    for (let i = 0; i < n; i++) {
      this.cursor = (this.cursor + d + n) % n;
      if (!this.rows[this.cursor].disabled) break;
    }
    this.paintCursor();
  }
  private paintCursor(): void {
    this.rowObjs.forEach((o, i) => {
      const sel = i === this.cursor;
      o.g.clear();
      o.g.fillStyle(sel ? 0x1b3a52 : 0x0e1c2a, sel ? 0.95 : 0.7);
      o.g.fillRect(TEXT_X, o.cy - CHOICE_H / 2, TEXT_W, CHOICE_H);
      if (sel) { o.g.fillStyle(0xd8b25f, 1); o.g.fillRect(TEXT_X, o.cy - CHOICE_H / 2, 3, CHOICE_H); }
      o.t.setColor(o.row.disabled ? '#5a6a78' : sel ? '#ffffff' : COL.text);
    });
  }

  // ═══════════ 렌더 ═══════════
  private render(): void {
    this.bodyC?.destroy();
    this.rows = []; this.rowObjs = [];
    const c = this.scene.add.container(0, this.contentTop);
    this.bodyC = c;
    this.add(c);
    this.renderPortrait(c);

    let y = 8;
    if (this.lastWorkMsg) {
      const w = this.scene.add.text(TEXT_X, y, this.lastWorkMsg, { fontFamily: FONT, fontSize: '11px', color: COL.accent, wordWrap: { width: TEXT_W } });
      c.add(w); y += w.height + 6;
    }

    if (this.view === 'reply' && this.reply) y = this.renderReply(c, y);
    else if (this.view === 'jobs') y = this.renderJobs(c, y);
    else {
      const { completable, active, offer, refusedSub } = StoryStore.questsForNpc(this.npcId);
      if (completable[0]) y = this.renderComplete(c, completable[0], y);
      else if (active[0]) y = this.renderActive(c, active[0], y);
      else if (offer[0]) y = this.renderOffer(c, offer[0], y);
      else y = this.renderIdle(c, y, refusedSub.length > 0);
    }
    this.renderChoiceRows(c, y);
    enforceTextBounds(c, W - 8, 'DialoguePanel');
    this.applyFix();
  }

  /** 초상 + 우호도 게이지 */
  private renderPortrait(c: Phaser.GameObjects.Container): void {
    const g = this.scene.add.graphics();
    const stageH = this.panelH - this.contentTop - 12;
    g.fillStyle(0x08121c, 0.9); g.fillRect(8, 4, PORTRAIT_W - 16, stageH);
    g.lineStyle(1, 0x2c5878, 1); g.strokeRect(8, 4, PORTRAIT_W - 16, stageH);
    // 발판 그림자
    g.fillStyle(0x000000, 0.35); g.fillEllipse(PORTRAIT_W / 2, 4 + 32 * PORTRAIT_SCALE - 14, 90, 14);
    c.add(g);
    const key = ensureCharSheet(this.scene, characterOf(this.npcId), PORTRAIT_SCALE);
    const img = this.scene.add.image(PORTRAIT_W / 2, 4 + 32 * PORTRAIT_SCALE - 16, key, charFrameName('down', 0)).setOrigin(0.5, 1);
    c.add(img);

    // 우호도 — 11눈금(−5~+5) 바 + 티어 라벨
    const aff = StoryStore.affinityOf(this.npcId);
    const tier = affinityTier(aff);
    const lab = AFFINITY_TIER_LABEL[tier];
    const pips = affinityPips(aff);
    const barY = 4 + 32 * PORTRAIT_SCALE + 6;
    const pipW = 12, gap = 2, x0 = PORTRAIT_W / 2 - (11 * pipW + 10 * gap) / 2;
    const bar = this.scene.add.graphics();
    for (let i = -5; i <= 5; i++) {
      const x = x0 + (i + 5) * (pipW + gap);
      const on = i === 0 ? true : i < 0 ? pips <= i : pips >= i;
      const col = i === 0 ? 0x9fb4c8 : i < 0 ? 0xe0605a : 0xffd257;
      bar.fillStyle(on ? col : 0x1b2a3a, on ? 1 : 0.9);
      bar.fillRect(x, barY, pipW, 8);
      bar.lineStyle(1, 0x06090f, 1); bar.strokeRect(x, barY, pipW, 8);
    }
    c.add(bar);
    const t = this.scene.add.text(PORTRAIT_W / 2, barY + 14, `우호도 ${lab.ko}  (${aff >= 0 ? '+' : ''}${aff.toFixed(2)})`, {
      fontFamily: FONT, fontSize: '11px', color: `#${lab.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0);
    c.add(t);
  }

  private lines(c: Phaser.GameObjects.Container, y: number, lines: readonly (readonly [string, string])[], color = COL.text): number {
    for (const [ko] of lines) {
      const t = this.scene.add.text(TEXT_X, y, `"${ko}"`, { fontFamily: FONT, fontSize: '13px', color, lineSpacing: 4, wordWrap: { width: TEXT_W } });
      c.add(t); y += t.height + 6;
    }
    return y;
  }

  /** 주인공 시점 나레이션 — 대사(따옴표)와 구분되는 톤(흐린 모래색·들여쓰기) */
  private narration(c: Phaser.GameObjects.Container, y: number, text: string): number {
    const t = this.scene.add.text(TEXT_X + 10, y, text, { fontFamily: FONT, fontSize: '12px', color: '#d6c9a8', lineSpacing: 3, wordWrap: { width: TEXT_W - 10 } });
    c.add(t);
    return y + t.height + 8;
  }

  private questHeader(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number, chip: string, chipBg: string): number {
    const h = this.scene.add.text(TEXT_X, y, `${q.kind === 'main' ? '메인' : '서브'} ${q.id} · ${q.titleKo}`, { fontFamily: FONT, fontSize: '13px', color: COL.ok, fontStyle: 'bold' });
    const ch = this.scene.add.text(W - 20, y + 1, chip, { fontFamily: FONT, fontSize: '10px', color: '#0b1620', fontStyle: 'bold', backgroundColor: chipBg, padding: { x: 6, y: 2 } }).setOrigin(1, 0);
    c.add([h, ch]);
    return y + h.height + 6;
  }

  private objectives(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    q.objectives.forEach((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const cur = StoryStore.progress(q.id)?.obj[i] ?? 0;
      const tgt = StoryStore.objectiveTarget(o);
      const prog = tgt > 1 ? ` (${Math.min(cur, tgt).toLocaleString()}/${tgt.toLocaleString()})` : '';
      const label = narrativeOf(q.id)?.objectives?.[i] ?? o.labelKo;
      const t = this.scene.add.text(TEXT_X + 8, y, `${done ? '✓' : '·'} ${label}${prog}${o.manual && !done ? '  — 대화로 진행' : ''}`, {
        fontFamily: FONT, fontSize: '11px', color: done ? COL.ok : '#d0e8f5', wordWrap: { width: TEXT_W - 8 },
      });
      c.add(t); y += t.height + 2;
    });
    return y + 4;
  }

  /**
   * 선택지 → 행. **미리보기 없음**(141차 — 보상은 고른 뒤 응답 문장과 결과 목록으로 드러난다).
   * 고르지 않은 답은 응답 화면에 `???`로 남는다.
   */
  private choiceRow(q: StoryQuestDef, ch: QuestChoiceDef, stage: 'offer' | 'complete'): ChoiceRow {
    return {
      label: ch.labelKo,
      action: () => {
        const ok = stage === 'offer' ? StoryStore.accept(q.id, ch.id) : StoryStore.complete(q.id, ch.id);
        if (!ok) { this.lastWorkMsg = '지금은 진행할 수 없습니다.'; this.render(); return; }
        const done = stage === 'complete';
        this.reply = {
          line: ch.replyKo,
          lines: done ? StoryStore.lastOutcomeLines : [],
          rewards: done ? StoryStore.lastRewardLines : [],
          others: done ? StoryStore.otherChoices(q, 'complete', ch.id).map((o) => o.label) : [],
          epilogue: done ? narrativeOf(q.id)?.epilogue : undefined,
          declined: StoryStore.lastAction === 'declined',
        };
        this.view = 'reply';
        this.render();
      },
    };
  }

  private renderOffer(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '새 의뢰', '#ffd257');
    const n = narrativeOf(q.id);
    // 141차 — 표(descKo) 대신 주인공 나레이션 → NPC의 말 순서. 보상 미리보기는 없다.
    if (n) y = this.narration(c, y, n.intro);
    y = this.lines(c, y, n?.offer ? [[n.offer, n.offer]] : dialogueOf(q.id).offer);
    const note = StoryStore.offerNoteKo(q);
    if (note) {
      const t = this.scene.add.text(TEXT_X, y, note, { fontFamily: FONT, fontSize: '11px', color: COL.warn, wordWrap: { width: TEXT_W } });
      c.add(t); y += t.height + 6;
    }
    for (const ch of StoryStore.visibleChoices(q, 'offer')) this.rows.push(this.choiceRow(q, ch, 'offer'));
    this.pushCommonRows();
    return y;
  }

  private renderActive(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '진행 중', '#9fd5ff');
    const np = narrativeOf(q.id)?.progress;
    y = this.lines(c, y, [np ? [np, np] : dialogueOf(q.id).progress]);
    y = this.objectives(c, q, y);
    const idx = q.objectives.findIndex((o, i) => o.manual && !StoryStore.objectiveDone(q, i));
    if (idx >= 0) {
      this.rows.push({ label: `[다음 단계 진행] ${q.objectives[idx].labelKo}`, action: () => { StoryStore.advanceManual(q.id, idx); this.render(); } });
    }
    this.pushCommonRows();
    return y;
  }

  private renderComplete(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '완료 가능', '#7fe0b0');
    const nd = narrativeOf(q.id)?.done;
    y = this.lines(c, y, nd ? [[nd, nd]] : dialogueOf(q.id).done);
    // 141차 — 보상 미리보기 없음. 답을 고르면 응답 문장이 무엇을 내미는지 드러낸다.
    for (const ch of StoryStore.visibleChoices(q, 'complete')) this.rows.push(this.choiceRow(q, ch, 'complete'));
    return y;
  }

  private renderIdle(c: Phaser.GameObjects.Container, y: number, refused: boolean): number {
    const line = NPC_IDLE[this.npcId] ?? (['…', '…'] as const);
    y = this.lines(c, y, [line], '#c8d8e4');
    const hintTxt = refused
      ? '"…부탁할 일이 있긴 한데, 지금은 너한테 맡길 마음이 안 든다." — 우호도가 낮아 의뢰를 내주지 않습니다. 일감을 돕거나 다른 선택으로 마음을 돌리세요.'
      : '지금 받을 수 있는 의뢰가 없습니다. 레벨을 올리거나 다른 의뢰를 먼저 끝내세요.';
    const hint = this.scene.add.text(TEXT_X, y, hintTxt, { fontFamily: FONT, fontSize: '11px', color: refused ? COL.warn : COL.dim, wordWrap: { width: TEXT_W } });
    c.add(hint); y += hint.height + 6;
    this.pushCommonRows();
    return y;
  }

  private renderReply(c: Phaser.GameObjects.Container, y: number): number {
    const r = this.reply!;
    y = this.lines(c, y, [[r.line, r.line]]);
    const small = (text: string, color: string): void => {
      const t = this.scene.add.text(TEXT_X, y, text, { fontFamily: FONT, fontSize: '11px', color, wordWrap: { width: TEXT_W } });
      c.add(t); y += t.height + 4;
    };
    if (r.declined) small('의뢰를 받지 않았습니다.', COL.warn);
    // 141차 — 받은 것은 여기서 처음 드러난다. 다른 답의 보상은 ???
    if (r.rewards.length) small(`받은 것: ${r.rewards.join(' · ')}`, COL.accent);
    if (r.lines.length) small(`이 답으로: ${r.lines.join(' · ')}`, COL.ok);
    if (r.others.length) small(`고르지 않은 답 — ${r.others.map((o) => `"${o}" → ???`).join('   ')}`, COL.hint);
    if (r.epilogue) y = this.narration(c, y + 2, r.epilogue);
    this.rows.push({ label: '계속', action: () => { this.view = 'main'; this.reply = null; this.render(); } });
    this.rows.push({ label: '대화 끝내기', action: () => this.onClose() });
    return y;
  }

  /** 일감 보기 · 닫기 — 모든 기본 화면 공통 */
  private pushCommonRows(): void {
    const jobs = StoryStore.jobsOfNpc(this.npcId, this.regionId);
    if (jobs.length) {
      const can = jobs.filter((j) => !j.locked && j.remaining > 0).length;
      this.rows.push({ label: `일감 보기 (${jobs.length}건${can ? ` · 지금 ${can}건 가능` : ''})`, action: () => { this.view = 'jobs'; this.render(); } });
    }
    this.rows.push({ label: '대화 끝내기', action: () => this.onClose() });
  }

  /**
   * 일감(품삯) 화면 — 135차 스트립을 선택지 행으로 옮겼다. 품삯은 우호도 배율이 곱해진 **지급될 값** 그대로 표기.
   */
  private renderJobs(c: Phaser.GameObjects.Container, y: number): number {
    const head = this.scene.add.text(TEXT_X, y, '일감 (품삯) — 퀘스트와 별개인 반복 수입. 우호도가 좋으면 품삯이 오르고, 적대하면 일을 주지 않습니다.', {
      fontFamily: FONT, fontSize: '11px', color: COL.accent, wordWrap: { width: TEXT_W },
    });
    c.add(head); y += head.height + 6;
    for (const { job, remaining, locked } of StoryStore.jobsOfNpc(this.npcId, this.regionId)) {
      const can = !locked && remaining > 0;
      const wage = StoryStore.jobWage(job).toLocaleString();
      this.rows.push({
        label: `${job.nameKo} — ${wage}원 · 오늘 ${remaining}/${job.perDay}회`,
        hint: locked ?? (remaining > 0 ? job.descKo : '오늘 몫은 다 했습니다 — 자고 나서 다시 오세요.'),
        disabled: !can,
        action: () => {
          const res = StoryStore.work(job.id);
          this.lastWorkMsg = res.ok ? `${res.flavorKo ?? ''} (품삯 ${(res.wage ?? 0).toLocaleString()}원)` : `일할 수 없습니다 — ${res.reason ?? ''}`;
          this.render();
        },
      });
    }
    this.rows.push({ label: '돌아가기', action: () => { this.view = 'main'; this.render(); } });
    return y;
  }

  /** 선택지 행 렌더 — 하단에서 위로 쌓지 않고 텍스트 아래에서 흐른다. 넘치면 행 간격을 줄인다 */
  private renderChoiceRows(c: Phaser.GameObjects.Container, yIn: number): void {
    const bottom = this.panelH - this.contentTop - 10;
    const n = this.rows.length;
    if (n === 0) return;
    const avail = bottom - yIn;
    const step = Math.max(22, Math.min(CHOICE_H + 4, Math.floor(avail / n)));
    let y = Math.max(yIn, bottom - n * step) + step / 2;
    if (this.cursor >= n) this.cursor = 0;
    this.rows.forEach((row, i) => {
      const g = this.scene.add.graphics();
      const t = this.scene.add.text(TEXT_X + 12, y, row.label, { fontFamily: FONT, fontSize: '12px', color: COL.text }).setOrigin(0, 0.5);
      const maxLabel = row.hint ? Math.floor(TEXT_W * 0.55) : TEXT_W - 24;
      clampTextWidth(t, maxLabel);
      let h: Phaser.GameObjects.Text | undefined;
      if (row.hint) {
        h = this.scene.add.text(TEXT_X + TEXT_W - 10, y, row.hint, { fontFamily: FONT, fontSize: '10px', color: COL.hint }).setOrigin(1, 0.5);
        clampTextWidth(h, TEXT_W - maxLabel - 30);
      }
      const hit = this.scene.add.rectangle(TEXT_X + TEXT_W / 2, y, TEXT_W, step - 2, 0xffffff, 0.001).setInteractive({ useHandCursor: !row.disabled });
      hit.on('pointerover', () => { if (!row.disabled) { this.cursor = i; this.paintCursor(); } });
      hit.on('pointerdown', () => { if (!row.disabled) row.action(); });
      c.add([g, t, hit]); if (h) c.add(h);
      this.rowObjs.push({ g, t, h, row, cy: y });
      y += step;
    });
    this.paintCursor();
  }
}
