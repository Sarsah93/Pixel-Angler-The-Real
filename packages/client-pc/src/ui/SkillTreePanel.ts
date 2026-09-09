/**
 * @file SkillTreePanel.ts
 * @description 스킬 트리 패널 (K — 122차). 도움말 라이브러리 골격(좌 카테고리 / 우 페이지)을 따르되 별도 패널.
 *
 * 우측 = 티어 열(0~3) 트리. 루트(티어 0) 1~2개에서 `requires` 선으로 확장. 노드 상태:
 *  학습됨(초록) · 학습 가능(노랑 테두리 — 선행 충족 + 포인트 충분) · 잠김(회색) · 카테고리 잠금(농사 — 열람만).
 *  `wired: false`(정의만) 스킬은 '예정' 배지. 하단 = 선택 스킬 상세 + [배우기].
 * 포인트는 레벨에서 파생(`GameState.skillPointsAvailable`) — 세이브는 랭크만.
 */

import Phaser from 'phaser';
import {
  SKILL_CATEGORIES, skillsOfCategory, getSkillById, skillPrereqsMet, type SkillCategoryId, type SkillDef,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { restoreHandCursor } from './DraggablePanel.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const TREE_W = 260;
const CONTENT_X = TREE_W + 16;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
const NODE_W = 172;
const NODE_H = 72;
const TIER_DX = 196;
const ROW_DY = 92;
const DETAIL_H = 118;
const FONT = '"Noto Sans KR", sans-serif';

export interface SkillTreeConfig {
  onClose: () => void;
}

export class SkillTreePanel extends DraggablePanel {
  private category: SkillCategoryId = 'fishing';
  private selected: string | null = null;
  private catC?: Phaser.GameObjects.Container;
  private treeC?: Phaser.GameObjects.Container;
  private detailC?: Phaser.GameObjects.Container;
  private pointsTxt!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, cfg: SkillTreeConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '스킬', onClose: cfg.onClose, dim: false, depth: 892,
    });
    this.buildStatic();
    this.selected = skillsOfCategory(this.category)[0]?.id ?? null;
    this.renderCategories();
    this.renderTree();
    this.renderDetail();
    applyScreenFixed(this);
  }

  private buildStatic(): void {
    const g = this.scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    // 하단 상세 스트립 구분선
    g.lineStyle(1, 0x1c3d5a, 1); g.lineBetween(CONTENT_X, PANEL_H - DETAIL_H - 8, PANEL_W - 16, PANEL_H - DETAIL_H - 8);
    this.add(g);
    this.pointsTxt = this.scene.add.text(PANEL_W - 22, top + 6, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffd98a', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add(this.pointsTxt);
    this.refreshPoints();
  }

  private refreshPoints(): void {
    const p = GameState.player;
    this.pointsTxt.setText(`스킬 포인트 ${GameState.skillPointsAvailable()} 사용 가능 · Lv.${p.level ?? 1} (누적 ${GameState.skillPointsTotal()})`);
  }

  // ═══════════════ 좌측 카테고리 ═══════════════
  private renderCategories(): void {
    this.catC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.catC = c;
    this.add(c);
    let y = this.contentTop + 8;
    const ranks = GameState.skillRanks;
    for (const cat of SKILL_CATEGORIES) {
      const list = skillsOfCategory(cat.id);
      const learned = list.filter((s) => (ranks[s.id] ?? 0) > 0).length;
      const sel = cat.id === this.category;
      const bg = this.scene.add.rectangle(14, y, TREE_W - 24, 46, sel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0);
      bg.setStrokeStyle(1, sel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.category = cat.id;
        this.selected = skillsOfCategory(cat.id)[0]?.id ?? null;
        this.renderCategories(); this.renderTree(); this.renderDetail();
        restoreHandCursor(this.scene);
      });
      const name = this.scene.add.text(24, y + 6, cat.nameKo, { fontFamily: FONT, fontSize: '13px', color: cat.locked ? '#8a97a8' : '#e8f4fd', fontStyle: 'bold' });
      const sub = this.scene.add.text(24, y + 26, cat.locked ? '잠김 — 열람만' : cat.descKo, { fontFamily: FONT, fontSize: '10px', color: cat.locked ? '#c88a5a' : '#8fb4cc' });
      clampTextWidth(sub, TREE_W - 90);
      const cnt = this.scene.add.text(TREE_W - 18, y + 8, `${learned}/${list.length}`, { fontFamily: FONT, fontSize: '11px', color: '#7fe0b0' }).setOrigin(1, 0);
      c.add([bg, name, sub, cnt]);
      y += 52;
    }
    applyScreenFixed(this);
  }

  // ═══════════════ 우측 트리 ═══════════════
  private nodeState(def: SkillDef): 'learned' | 'available' | 'locked' | 'catLocked' | 'maxed' {
    const cat = SKILL_CATEGORIES.find((c) => c.id === def.category);
    const ranks = GameState.skillRanks;
    const r = ranks[def.id] ?? 0;
    if (cat?.locked) return 'catLocked';
    if (r >= def.maxRank) return 'maxed';
    if (r > 0) return skillPrereqsMet(def, ranks) && GameState.skillPointsAvailable() >= def.costPerRank ? 'available' : 'learned';
    if (skillPrereqsMet(def, ranks) && GameState.skillPointsAvailable() >= def.costPerRank) return 'available';
    return 'locked';
  }

  private nodePos(def: SkillDef, list: SkillDef[]): { x: number; y: number } {
    const sameTier = list.filter((s) => s.tier === def.tier);
    const idx = sameTier.indexOf(def);
    const colH = sameTier.length * ROW_DY;
    const top = this.contentTop + 34;
    const availH = PANEL_H - DETAIL_H - 8 - top;
    const y0 = top + Math.max(0, (availH - colH) / 2);
    return { x: CONTENT_X + 14 + def.tier * TIER_DX, y: y0 + idx * ROW_DY };
  }

  private renderTree(): void {
    this.treeC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.treeC = c;
    this.add(c);
    const cat = SKILL_CATEGORIES.find((x) => x.id === this.category)!;
    const list = skillsOfCategory(this.category);
    const ranks = GameState.skillRanks;
    const crumb = this.scene.add.text(CONTENT_X + 6, this.contentTop + 6, `${cat.nameKo}  ›  ${cat.descKo}`, { fontFamily: FONT, fontSize: '11px', color: '#7fb8d8' });
    clampTextWidth(crumb, CONTENT_W - 300);
    c.add(crumb);
    if (cat.locked) {
      const note = this.scene.add.text(CONTENT_X + 6, this.contentTop + 22, cat.lockedNoteKo ?? '', { fontFamily: FONT, fontSize: '11px', color: '#c88a5a' });
      clampTextWidth(note, CONTENT_W - 12);
      c.add(note);
    }
    // 연결선 (노드보다 먼저)
    const lines = this.scene.add.graphics();
    c.add(lines);
    const pos = new Map<string, { x: number; y: number }>();
    for (const d of list) pos.set(d.id, this.nodePos(d, list));
    for (const d of list) {
      const to = pos.get(d.id)!;
      for (const q of d.requires) {
        const from = pos.get(q.id);
        if (!from) continue;
        const met = (ranks[q.id] ?? 0) >= q.rank;
        lines.lineStyle(2, met ? 0x4af2a1 : 0x2a4a63, met ? 0.9 : 0.7);
        const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2, x2 = to.x, y2 = to.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        lines.beginPath(); lines.moveTo(x1, y1); lines.lineTo(mx, y1); lines.lineTo(mx, y2); lines.lineTo(x2, y2); lines.strokePath();
        // 요구 랭크 표기
        if (q.rank > 1) {
          const t = this.scene.add.text(mx, (y1 + y2) / 2 - 8, `Lv${q.rank}`, { fontFamily: FONT, fontSize: '9px', color: met ? '#7fe0b0' : '#5a7a8a', backgroundColor: '#0c1e30', padding: { x: 2, y: 0 } }).setOrigin(0.5, 0);
          c.add(t);
        }
      }
    }
    // 노드
    for (const d of list) {
      const p = pos.get(d.id)!;
      const st = this.nodeState(d);
      const r = ranks[d.id] ?? 0;
      const sel = this.selected === d.id;
      const fill = st === 'maxed' || st === 'learned' ? 0x123a2c : st === 'available' ? 0x2a3a1c : 0x121c2a;
      const stroke = sel ? 0xffffff : st === 'maxed' ? 0x4af2a1 : st === 'learned' ? 0x3fb88a : st === 'available' ? 0xffd257 : 0x2a3a4a;
      const box = this.scene.add.rectangle(p.x, p.y, NODE_W, NODE_H, fill, st === 'catLocked' ? 0.5 : 0.96).setOrigin(0, 0);
      box.setStrokeStyle(sel ? 2 : 1.5, stroke, 1);
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => { this.selected = d.id; this.renderTree(); this.renderDetail(); restoreHandCursor(this.scene); });
      const name = this.scene.add.text(p.x + 8, p.y + 7, d.nameKo, { fontFamily: FONT, fontSize: '12px', color: st === 'catLocked' || st === 'locked' ? '#8a97a8' : '#e8f4fd', fontStyle: 'bold' });
      clampTextWidth(name, NODE_W - 60);
      const rank = this.scene.add.text(p.x + NODE_W - 8, p.y + 7, `${r}/${d.maxRank}`, { fontFamily: FONT, fontSize: '11px', color: r > 0 ? '#7fe0b0' : '#8fb4cc' }).setOrigin(1, 0);
      const eff = this.scene.add.text(p.x + 8, p.y + 28, d.descKo, { fontFamily: FONT, fontSize: '9px', color: '#a8c8e8', wordWrap: { width: NODE_W - 16 } });
      if (eff.height > 30) eff.setText(eff.text.split(' ').slice(0, 5).join(' ') + '…');
      const cost = this.scene.add.text(p.x + NODE_W - 8, p.y + NODE_H - 6, `${d.costPerRank}pt`, { fontFamily: FONT, fontSize: '9px', color: '#ffd98a' }).setOrigin(1, 1);
      c.add([box, name, rank, eff, cost]);
      if (!d.wired) {
        const tag = this.scene.add.text(p.x + 8, p.y + NODE_H - 6, '예정', { fontFamily: FONT, fontSize: '9px', color: '#0b1620', backgroundColor: '#c88a5a', padding: { x: 3, y: 0 } }).setOrigin(0, 1);
        c.add(tag);
      }
    }
    enforceTextBounds(c, PANEL_W - 10, 'SkillTreePanel');
    applyScreenFixed(this);
  }

  // ═══════════════ 하단 상세 ═══════════════
  private renderDetail(): void {
    this.detailC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.detailC = c;
    this.add(c);
    const d = this.selected ? getSkillById(this.selected) : undefined;
    const y0 = PANEL_H - DETAIL_H;
    if (!d) { applyScreenFixed(this); return; }
    const ranks = GameState.skillRanks;
    const r = ranks[d.id] ?? 0;
    const st = this.nodeState(d);
    const title = this.scene.add.text(CONTENT_X + 6, y0, `${d.nameKo}  ${r}/${d.maxRank}`, { fontFamily: FONT, fontSize: '15px', color: '#7fe0b0', fontStyle: 'bold' });
    const desc = this.scene.add.text(CONTENT_X + 6, title.y + title.height + 4, d.descKo, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', wordWrap: { width: CONTENT_W - 240 } });
    const reqStr = d.requires.length
      ? `선행: ${d.requires.map((q) => `${getSkillById(q.id)?.nameKo ?? q.id} Lv${q.rank}`).join(', ')}`
      : '선행 없음 (루트 스킬)';
    const req = this.scene.add.text(CONTENT_X + 6, desc.y + desc.height + 4, `${reqStr}  ·  랭크당 ${d.costPerRank}pt${d.wired ? '' : '  ·  효과 배선 예정'}`, { fontFamily: FONT, fontSize: '11px', color: '#8fb4cc', wordWrap: { width: CONTENT_W - 240 } });
    c.add([title, desc, req]);
    // 배우기 버튼
    const can = GameState.canLearnSkill(d.id);
    const bx = PANEL_W - 16 - 200, by = y0 + 30;
    const btn = this.scene.add.rectangle(bx, by, 200, 34, can.ok ? 0x1f5a3a : 0x2a3340, 1).setOrigin(0, 0).setStrokeStyle(1, can.ok ? 0x4af2a1 : 0x3a4a5a, 1);
    const label = st === 'maxed' ? '최대 랭크' : `배우기 (${d.costPerRank}pt)`;
    const bt = this.scene.add.text(bx + 100, by + 17, label, { fontFamily: FONT, fontSize: '12px', color: can.ok ? '#e8fff0' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
    if (can.ok) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (GameState.learnSkill(d.id)) {
          this.refreshPoints(); this.renderCategories(); this.renderTree(); this.renderDetail();
          restoreHandCursor(this.scene);
        }
      });
    }
    const why = this.scene.add.text(bx + 100, by + 44, can.ok ? '' : (can.reason ?? ''), { fontFamily: FONT, fontSize: '10px', color: '#c88a5a', wordWrap: { width: 200 }, align: 'center' }).setOrigin(0.5, 0);
    c.add([btn, bt, why]);
    enforceTextBounds(c, PANEL_W - 10, 'SkillTreePanel');
    applyScreenFixed(this);
  }
}
