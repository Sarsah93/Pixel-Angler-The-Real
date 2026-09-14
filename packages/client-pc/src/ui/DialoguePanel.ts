/**
 * @file DialoguePanel.ts
 * @description 스토리 NPC 대화 패널 (134차) — 발주/진행/완료를 한 패널로.
 *
 * 우선순위: 완료 가능한 퀘 > 진행 중인 퀘 > 발주 가능한 퀘 > 잡담(idle).
 * - 발주: 대사 + **3톤 선택지**(무뚝뚝/솔직/너스레 — 결과 동일, §5-1) → 수락.
 * - 진행: 목표 목록(✓/·). `manual` 목표는 [다음 단계 진행]으로 한 단계씩, 자동 목표는 필드에서.
 * - 완료: 완료 대사 + [보상 받기].
 * 대화를 여는 순간 `talk` 이벤트를 흘려 talk 목표는 자동으로 닫힌다.
 *
 * 모달(dim) · depth 940 — ConfirmDialog(950) 아래, 일반 팝업(800대) 위. 텍스트는 wordWrap + 흐름 배치(§4).
 */

import Phaser from 'phaser';
import { getStoryNpc, type StoryQuestDef } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { StoryStore } from '../store/StoryStore.js';
import { dialogueOf, NPC_IDLE, TONE_CHOICES } from '../data/StoryDialogue.js';
import { enforceTextBounds, clampTextWidth } from './TextFit.js';

const W = 640;
const H = 420;
const FONT = '"Noto Sans KR", sans-serif';

export class DialoguePanel extends DraggablePanel {
  private bodyC?: Phaser.GameObjects.Container;   // ⚠ `body`는 Phaser Container 예약 프로퍼티(44차 함정)
  private readonly npcId: string;
  private readonly onClose: () => void;

  constructor(scene: Phaser.Scene, npcId: string, onClose: () => void) {
    const npc = getStoryNpc(npcId);
    super(scene, {
      x: (GAME_WIDTH - W) / 2, y: (GAME_HEIGHT - H) / 2,
      width: W, height: H, title: npc?.nameKo ?? npcId, onClose, dim: true, depth: 940,
    });
    this.npcId = npcId;
    this.onClose = onClose;
    StoryStore.event({ kind: 'talk', npcId });
    this.render();
    this.applyFix();
  }

  private render(): void {
    this.bodyC?.destroy();
    const c = this.scene.add.container(0, this.contentTop);
    this.bodyC = c;
    this.add(c);
    const npc = getStoryNpc(this.npcId);
    let y = 6;
    const role = this.scene.add.text(16, y, npc?.roleKo ?? '', { fontFamily: FONT, fontSize: '11px', color: '#7fb8d8' });
    c.add(role); y += role.height + 10;

    const { completable, active, offer } = StoryStore.questsForNpc(this.npcId);
    if (completable[0]) y = this.renderComplete(c, completable[0], y);
    else if (active[0]) y = this.renderActive(c, active[0], y);
    else if (offer[0]) y = this.renderOffer(c, offer[0], y);
    else y = this.renderIdle(c, y);

    this.addBtn(c, W - 16 - 60, H - this.contentTop - 30, 120, '닫기', 0x1f3045, 0x4a6a8a, '#8faabf', () => this.onClose());
    enforceTextBounds(c, W - 8, 'DialoguePanel');
    this.applyFix();
  }

  private lines(c: Phaser.GameObjects.Container, y: number, lines: readonly (readonly [string, string])[], color = '#e8f4fd'): number {
    for (const [ko] of lines) {
      const t = this.scene.add.text(16, y, `"${ko}"`, { fontFamily: FONT, fontSize: '13px', color, lineSpacing: 5, wordWrap: { width: W - 32 } });
      c.add(t); y += t.height + 8;
    }
    return y;
  }

  private questHeader(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number, chip: string, chipBg: string): number {
    const h = this.scene.add.text(16, y, `${q.kind === 'main' ? '메인' : '서브'} ${q.id} · ${q.titleKo}`, { fontFamily: FONT, fontSize: '14px', color: '#7fe0b0', fontStyle: 'bold' });
    const ch = this.scene.add.text(W - 16, y + 1, chip, { fontFamily: FONT, fontSize: '11px', color: '#0b1620', fontStyle: 'bold', backgroundColor: chipBg, padding: { x: 6, y: 2 } }).setOrigin(1, 0);
    c.add([h, ch]);
    return y + h.height + 8;
  }

  private objectives(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    q.objectives.forEach((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const cur = StoryStore.progress(q.id)?.obj[i] ?? 0;
      const tgt = StoryStore.objectiveTarget(o);
      const prog = tgt > 1 ? ` (${Math.min(cur, tgt).toLocaleString()}/${tgt.toLocaleString()})` : '';
      const t = this.scene.add.text(24, y, `${done ? '✓' : '·'} ${o.labelKo}${prog}${o.manual && !done ? '  — 대화로 진행' : ''}`, {
        fontFamily: FONT, fontSize: '12px', color: done ? '#7fe0b0' : '#d0e8f5', wordWrap: { width: W - 48 },
      });
      c.add(t); y += t.height + 4;
    });
    return y + 6;
  }

  private renderOffer(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '새 의뢰', '#ffd257');
    y = this.lines(c, y, dialogueOf(q.id).offer);
    const desc = this.scene.add.text(16, y, q.descKo, { fontFamily: FONT, fontSize: '11px', color: '#9fb8cc', wordWrap: { width: W - 32 } });
    c.add(desc); y += desc.height + 10;
    // 3톤 선택지 — 전부 수락 (호감도 미세 차이는 후속)
    TONE_CHOICES.forEach(([ko], i) => {
      this.addBtn(c, 16 + i * 204 + 98, y + 16, 196, ko, 0x0d4a2e, 0x4af2a1, '#4af2a1', () => {
        StoryStore.accept(q.id);
        this.render();
      }, '12px');
    });
    return y + 40;
  }

  private renderActive(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '진행 중', '#9fd5ff');
    y = this.lines(c, y, [dialogueOf(q.id).progress]);
    y = this.objectives(c, q, y);
    const idx = q.objectives.findIndex((o, i) => o.manual && !StoryStore.objectiveDone(q, i));
    if (idx >= 0) {
      this.addBtn(c, 16 + 100, y + 16, 200, '다음 단계 진행', 0x14425e, 0x33b0e0, '#aee8ff', () => {
        StoryStore.advanceManual(q.id, idx);
        this.render();
      });
      y += 40;
    }
    return y;
  }

  private renderComplete(c: Phaser.GameObjects.Container, q: StoryQuestDef, y: number): number {
    y = this.questHeader(c, q, y, '완료 가능', '#7fe0b0');
    y = this.lines(c, y, dialogueOf(q.id).done);
    const rw: string[] = [`경험치 +${q.xp.toLocaleString()}`];
    if (q.rewards?.coins) rw.push(`${q.rewards.coins.toLocaleString()}원`);
    if (q.rewards?.licenses?.length) rw.push(`자격 ${q.rewards.licenses.length}종`);
    const r = this.scene.add.text(16, y, `보상: ${rw.join(' · ')}`, { fontFamily: FONT, fontSize: '12px', color: '#ffd98a', wordWrap: { width: W - 32 } });
    c.add(r); y += r.height + 10;
    this.addBtn(c, 16 + 100, y + 16, 200, '보상 받기', 0x0d4a2e, 0x4af2a1, '#4af2a1', () => {
      StoryStore.complete(q.id);
      this.render();
    });
    return y + 40;
  }

  private renderIdle(c: Phaser.GameObjects.Container, y: number): number {
    const line = NPC_IDLE[this.npcId] ?? (['…', '…'] as const);
    y = this.lines(c, y, [line], '#c8d8e4');
    const hint = this.scene.add.text(16, y, '지금 받을 수 있는 의뢰가 없습니다. 레벨을 올리거나 다른 의뢰를 먼저 끝내세요.', { fontFamily: FONT, fontSize: '11px', color: '#8a97a8', wordWrap: { width: W - 32 } });
    c.add(hint);
    return y + hint.height + 8;
  }

  private addBtn(c: Phaser.GameObjects.Container, cx: number, cy: number, w: number, label: string, fill: number, stroke: number, color: string, onClick: () => void, fontSize = '13px'): void {
    const g = this.scene.add.graphics();
    g.fillStyle(fill, 0.95); g.fillRoundedRect(cx - w / 2, cy - 15, w, 30, 4);
    g.lineStyle(1.5, stroke, 0.95); g.strokeRoundedRect(cx - w / 2, cy - 15, w, 30, 4);
    const t = this.scene.add.text(cx, cy, label, { fontFamily: FONT, fontSize, color, fontStyle: 'bold' }).setOrigin(0.5);
    clampTextWidth(t, w - 12);   // 3톤 선택지가 196px 버튼을 넘치던 것(실렌더) — 한 줄 고정 행은 말줄임
    const hit = this.scene.add.rectangle(cx, cy, w, 30, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => t.setColor('#ffffff'));
    hit.on('pointerout', () => t.setColor(color));
    hit.on('pointerdown', onClick);
    c.add([g, t, hit]);
  }
}
