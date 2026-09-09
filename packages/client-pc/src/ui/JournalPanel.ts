/**
 * @file JournalPanel.ts
 * @description 일지 패널 (J — 122차). 도움말 라이브러리 골격(좌 트리 / 우 본문)을 따르는 별도 패널 —
 * 스토리 라인(준비 중 — 전 컴포넌트 구현 후 도입, 사용자 방침)과 메인/서브 퀘스트(QUEST_DATABASE)를 보여준다.
 *
 * 메인 = tutorial + license 카테고리 · 서브 = activity + achievement. 상태 = 완료(`completedQuestIds`) /
 * 진행 가능(선행 완료) / 잠김. 목표·보상은 데이터 그대로 나열한다(진행도 추적 배선은 퀘스트 시스템 도입 시).
 */

import Phaser from 'phaser';
import { QUEST_DATABASE, type Quest, type QuestObjective } from '@tra/core';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { restoreHandCursor } from './DraggablePanel.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const TREE_W = 300;
const ROW_H = 26;
const CONTENT_X = TREE_W + 16;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
const FONT = '"Noto Sans KR", sans-serif';

type Row =
  | { kind: 'sec'; id: string; label: string }
  | { kind: 'story'; id: string; label: string }
  | { kind: 'quest'; quest: Quest };

const OBJ_LABEL: Record<QuestObjective['type'], string> = {
  visit_spot: '낚시터 방문', catch_any_fish: '물고기 낚기', catch_fish: '특정 조건 어획', complete_trips: '출조 횟수',
  cook_recipe: '요리 완성', earn_coins: '코인 보유', acquire_license: '면허 취득',
} as Record<QuestObjective['type'], string>;

export interface JournalConfig { onClose: () => void }

export class JournalPanel extends DraggablePanel {
  private expanded = new Set<string>(['story', 'main', 'sub']);
  private selected: string = 'story_prologue';
  private treeC?: Phaser.GameObjects.Container;
  private contentC?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, cfg: JournalConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '일지', onClose: cfg.onClose, dim: false, depth: 891,
    });
    const g = scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    this.add(g);
    this.renderTree();
    this.renderContent();
    applyScreenFixed(this);
  }

  private rows(): Row[] {
    const out: Row[] = [];
    out.push({ kind: 'sec', id: 'story', label: '스토리 라인' });
    if (this.expanded.has('story')) out.push({ kind: 'story', id: 'story_prologue', label: '프롤로그 — 준비 중' });
    const main = QUEST_DATABASE.filter((q) => q.category === 'tutorial' || q.category === 'license');
    const sub = QUEST_DATABASE.filter((q) => q.category === 'activity' || q.category === 'achievement');
    out.push({ kind: 'sec', id: 'main', label: `메인 퀘스트 (${main.filter((q) => GameState.completedQuestIds.includes(q.id)).length}/${main.length})` });
    if (this.expanded.has('main')) for (const q of main) out.push({ kind: 'quest', quest: q });
    out.push({ kind: 'sec', id: 'sub', label: `서브 퀘스트 (${sub.length})` });
    if (this.expanded.has('sub')) {
      if (sub.length === 0) out.push({ kind: 'story', id: 'sub_none', label: '아직 없음 — 채집·통발·업적 퀘스트 예정' });
      for (const q of sub) out.push({ kind: 'quest', quest: q });
    }
    return out;
  }

  private questStatus(q: Quest): 'done' | 'open' | 'locked' {
    const done = GameState.completedQuestIds;
    if (done.includes(q.id)) return 'done';
    return q.prerequisiteQuestIds.every((p) => done.includes(p)) ? 'open' : 'locked';
  }

  private renderTree(): void {
    this.treeC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.treeC = c;
    this.add(c);
    let y = this.contentTop + 6;
    for (const row of this.rows()) {
      if (y > PANEL_H - ROW_H - 12) break;
      const isSec = row.kind === 'sec';
      const id = row.kind === 'quest' ? row.quest.id : row.id;
      const sel = !isSec && this.selected === id;
      const bg = this.scene.add.rectangle(14, y, TREE_W - 24, ROW_H - 2, sel ? 0x1f4a6a : isSec ? 0x16293e : 0x122236, isSec ? 0.9 : 0.8).setOrigin(0, 0);
      bg.setStrokeStyle(1, sel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      let label: string;
      let color = '#e8f4fd';
      if (row.kind === 'sec') { label = `${this.expanded.has(row.id) ? '▾' : '▸'} ${row.label}`; color = '#9fd5ff'; }
      else if (row.kind === 'story') { label = row.label; color = '#8a97a8'; }
      else {
        const st = this.questStatus(row.quest);
        label = `${st === 'done' ? '✓' : st === 'open' ? '·' : '🔒'} ${row.quest.nameKo}`;
        color = st === 'done' ? '#7fe0b0' : st === 'open' ? '#e8f4fd' : '#6a7a8a';
      }
      const t = this.scene.add.text(14 + (isSec ? 8 : 22), y + 5, label, { fontFamily: FONT, fontSize: '11px', color, fontStyle: isSec ? 'bold' : 'normal' });
      clampTextWidth(t, TREE_W - 24 - (isSec ? 16 : 30));
      bg.on('pointerdown', () => {
        if (row.kind === 'sec') { if (this.expanded.has(row.id)) this.expanded.delete(row.id); else this.expanded.add(row.id); }
        else this.selected = id;
        this.renderTree(); this.renderContent(); restoreHandCursor(this.scene);
      });
      c.add([bg, t]);
      y += ROW_H;
    }
    applyScreenFixed(this);
  }

  private renderContent(): void {
    this.contentC?.destroy();
    const c = this.scene.add.container(CONTENT_X, this.contentTop);
    this.contentC = c;
    this.add(c);
    const q = QUEST_DATABASE.find((x) => x.id === this.selected);
    let y = 6;
    const W = CONTENT_W - 30;
    if (!q) {
      const h = this.scene.add.text(6, y, '스토리 라인', { fontFamily: FONT, fontSize: '16px', color: '#7fe0b0', fontStyle: 'bold' });
      y += h.height + 10;
      const body = this.scene.add.text(6, y, '프롤로그는 준비 중입니다. 낚시·손질·채집·통발·요리·농장 등 모든 컴포넌트가 구현된 뒤 스토리와 메인/서브 퀘스트가 도입됩니다. 지금은 메인 퀘스트 목록에서 입문 과제와 면허 도전 과제를 확인할 수 있습니다.', { fontFamily: FONT, fontSize: '13px', color: '#e8f4fd', lineSpacing: 5, wordWrap: { width: W } });
      c.add([h, body]);
    } else {
      const st = this.questStatus(q);
      const stLabel = st === 'done' ? '완료' : st === 'open' ? '진행 가능' : '잠김';
      const h = this.scene.add.text(6, y, q.nameKo, { fontFamily: FONT, fontSize: '16px', color: '#7fe0b0', fontStyle: 'bold', wordWrap: { width: W - 90 } });
      const chip = this.scene.add.text(CONTENT_W - 24, y + 2, stLabel, { fontFamily: FONT, fontSize: '11px', color: '#0b1620', fontStyle: 'bold', backgroundColor: st === 'done' ? '#7fe0b0' : st === 'open' ? '#ffd257' : '#8a97a8', padding: { x: 6, y: 2 } }).setOrigin(1, 0);
      y += h.height + 8;
      const cat = this.scene.add.text(6, y, q.category === 'tutorial' ? '메인 · 입문' : q.category === 'license' ? '메인 · 면허 도전' : q.category === 'activity' ? '서브 · 활동' : '서브 · 업적', { fontFamily: FONT, fontSize: '11px', color: '#7fb8d8' });
      y += cat.height + 8;
      const desc = this.scene.add.text(6, y, q.description, { fontFamily: FONT, fontSize: '13px', color: '#e8f4fd', lineSpacing: 5, wordWrap: { width: W } });
      y += desc.height + 12;
      const oh = this.scene.add.text(6, y, '목표', { fontFamily: FONT, fontSize: '13px', color: '#9fd5ff', fontStyle: 'bold' });
      y += oh.height + 4;
      c.add([h, chip, cat, desc, oh]);
      for (const o of q.objectives) {
        const line = this.scene.add.text(14, y, `· ${OBJ_LABEL[o.type] ?? o.type} — 목표 ${o.targetAmount}${o.param ? ` (${o.param})` : ''}`, { fontFamily: FONT, fontSize: '12px', color: '#d0e8f5', wordWrap: { width: W - 8 } });
        c.add(line); y += line.height + 4;
      }
      y += 8;
      const rh = this.scene.add.text(6, y, '보상', { fontFamily: FONT, fontSize: '13px', color: '#9fd5ff', fontStyle: 'bold' });
      y += rh.height + 4; c.add(rh);
      for (const r of q.rewards) {
        const line = this.scene.add.text(14, y, `· ${r.descriptionKo}`, { fontFamily: FONT, fontSize: '12px', color: '#ffd98a', wordWrap: { width: W - 8 } });
        c.add(line); y += line.height + 4;
      }
      if (q.prerequisiteQuestIds.length) {
        y += 8;
        const pre = this.scene.add.text(6, y, `선행: ${q.prerequisiteQuestIds.map((id) => QUEST_DATABASE.find((x) => x.id === id)?.nameKo ?? id).join(', ')}`, { fontFamily: FONT, fontSize: '11px', color: '#8fb4cc', wordWrap: { width: W } });
        c.add(pre);
      }
    }
    enforceTextBounds(c, CONTENT_W - 4, 'JournalPanel');
    applyScreenFixed(this);
  }
}
