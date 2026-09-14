/**
 * @file JournalPanel.ts
 * @description 일지 패널 (J — 134차 재작성). 좌 트리 / 우 본문.
 *
 * 트리 = 「동명 조행록」(17장 진행) · 자격 사다리 · 제N부 › 챕터 › 퀘스트(메인/서브).
 * 120퀘가 한 화면에 안 들어가므로 **윈도우드 렌더 + 휠 스크롤**(마스크 팬텀 히트 회피 — ui-panel 규칙).
 * 상태 = 완료 ✓ / 진행 중 · / 가능 ○ / 잠김 — 현재 챕터만 기본 펼침.
 *
 * 스토리 골격(122차)은 폐기 — 정의는 core `STORY_QUESTS`, 상태는 `StoryStore`.
 */

import Phaser from 'phaser';
import {
  STORY_CHAPTERS, STORY_QUESTS, JOURNAL_PAGES, getStoryNpc, getStoryArc, SEASON_LABEL, getJournalPage,
  FISH_DATABASE, getLicenseByType, type StoryQuestDef, type StoryChapterDef, type JournalPageDef,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const TREE_W = 320;
const ROW_H = 24;
const CONTENT_X = TREE_W + 16;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
const FONT = '"Noto Sans KR", sans-serif';

/** teaches 키 → 표기 (STORY_SPEC §9 표의 '가르치는 것') */
const TEACH_LABEL: Record<string, string> = {
  movement: '이동·상호작용', inventory: '인벤토리', statusPanel: '상태 패널', worldMap: '월드맵', shop: '상점', wages: '품삯·재화',
  homeBase: '홈타운', save: '침대 저장', placement: '설치', deadline: 'D-day', budgetGear: '저가 장비', holeFishing: '구멍치기', tetrapodSafety: '테트라포드 안전',
  casting: '캐스팅', floatRig: '찌 채비', bite: '입질', fight: '파이팅', law: '법 규칙 5조', measure: '체장 계측', release: '준법 방생', codex: '도감',
  butchery: '손질', sashimi: '회뜨기', freshness: '신선도', cooking: '요리', crafting: '제작', backpack: '가방', firstAid: '응급처치',
  tideland: '해루질', tideTable: '물때표', lantern: '헤드랜턴', cold: '오한·감기', communityWork: '공동작업', bicycle: '자전거', skills: '스킬 포인트', reputation: '평판',
  licenseFlow: '자격 절차', auction: '위판', lure: '루어', trap: '통발', boatTrip: '배 출조', jigging: '지깅', egging: '에깅', surf: '서프',
  seasickness: '멀미', weather: '기상 판단', oralHistory: '구술 채록', restocking: '종묘방류', boatOwnership: '선주', guideBusiness: '가이드 영업',
  tournament: '대회', villageFishery: '마을어업권', ferry: '여객선', stallOps: '좌판 운영', voyagePlan: '항해 계획', journalComplete: '조행록 완성',
};

type Row =
  | { kind: 'sec'; id: string; label: string; depth: 0 | 1 }
  | { kind: 'journal' }
  | { kind: 'ladder' }
  | { kind: 'chapter'; ch: StoryChapterDef }
  | { kind: 'quest'; quest: StoryQuestDef };

export interface JournalConfig { onClose: () => void }

export class JournalPanel extends DraggablePanel {
  private expanded = new Set<string>();
  private selected: string = 'journal';
  private scrollRow = 0;
  private treeC?: Phaser.GameObjects.Container;
  private contentC?: Phaser.GameObjects.Container;
  private readonly onWheel: (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => void;

  constructor(scene: Phaser.Scene, cfg: JournalConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '일지', onClose: cfg.onClose, dim: false, depth: 891,
    });
    const cur = StoryStore.currentChapter();
    this.expanded.add(`part${STORY_CHAPTERS.find((c) => c.chapter === cur)?.part ?? 1}`);
    this.expanded.add(`ch${cur}`);
    const g = scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    this.add(g);
    this.onWheel = (p, _o, _dx, dy) => {
      if (!this.treeContains(p)) return;
      this.scrollRow = Math.max(0, Math.min(this.maxScroll(), this.scrollRow + (dy > 0 ? 2 : -2)));
      this.renderTree();
    };
    scene.input.on('wheel', this.onWheel);
    this.renderTree();
    this.renderContent();
    applyScreenFixed(this);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.input?.off('wheel', this.onWheel);
    super.destroy(fromScene);
  }

  private treeContains(p: Phaser.Input.Pointer): boolean {
    return p.x >= this.x + 8 && p.x <= this.x + TREE_W - 4 && p.y >= this.y + this.contentTop && p.y <= this.y + PANEL_H - 8;
  }
  private visibleRows(): number { return Math.floor((PANEL_H - this.contentTop - 14) / ROW_H); }
  private maxScroll(): number { return Math.max(0, this.rows().length - this.visibleRows()); }

  private mark(q: StoryQuestDef): { glyph: string; color: string } {
    const st = StoryStore.status(q);
    return st === 'done' ? { glyph: '✓', color: '#7fe0b0' } : st === 'active' ? { glyph: '·', color: '#ffd257' }
      : st === 'available' ? { glyph: '○', color: '#e8f4fd' } : { glyph: ' ', color: '#5f6f7f' };
  }

  private rows(): Row[] {
    const out: Row[] = [];
    out.push({ kind: 'journal' });
    out.push({ kind: 'ladder' });
    const parts = [...new Set(STORY_CHAPTERS.map((c) => c.part))];
    for (const part of parts) {
      const chs = STORY_CHAPTERS.filter((c) => c.part === part);
      const label = `제${part}부 「${chs.map((c) => c.partTitleKo).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}」`;
      out.push({ kind: 'sec', id: `part${part}`, label, depth: 0 });
      if (!this.expanded.has(`part${part}`)) continue;
      for (const ch of chs) {
        out.push({ kind: 'chapter', ch });
        if (!this.expanded.has(`ch${ch.chapter}`)) continue;
        for (const q of STORY_QUESTS.filter((x) => x.chapter === ch.chapter && x.kind === 'main')) out.push({ kind: 'quest', quest: q });
        for (const q of STORY_QUESTS.filter((x) => x.chapter === ch.chapter && x.kind === 'sub')) out.push({ kind: 'quest', quest: q });
      }
    }
    return out;
  }

  private rowId(r: Row): string {
    return r.kind === 'quest' ? r.quest.id : r.kind === 'chapter' ? `ch${r.ch.chapter}` : r.kind === 'sec' ? r.id : r.kind;
  }

  private renderTree(): void {
    this.treeC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.treeC = c;
    this.add(c);
    const all = this.rows();
    const vis = this.visibleRows();
    this.scrollRow = Math.max(0, Math.min(this.maxScroll(), this.scrollRow));
    let y = this.contentTop + 6;
    for (const row of all.slice(this.scrollRow, this.scrollRow + vis)) {
      const id = this.rowId(row);
      const sel = this.selected === id;
      const isHead = row.kind === 'sec' || row.kind === 'chapter';
      const indent = row.kind === 'quest' ? 30 : row.kind === 'chapter' ? 18 : 8;
      const bg = this.scene.add.rectangle(14, y, TREE_W - 24, ROW_H - 2, sel ? 0x1f4a6a : isHead ? 0x16293e : 0x122236, isHead ? 0.9 : 0.8).setOrigin(0, 0);
      bg.setStrokeStyle(1, sel ? 0x5cd0ff : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      let label = ''; let color = '#e8f4fd'; let bold = false;
      if (row.kind === 'journal') { const n = StoryStore.journalFilledCount(); label = `동명 조행록  ${n} / 17`; color = '#ffd98a'; bold = true; }
      else if (row.kind === 'ladder') { label = '자격 사다리 · 기한'; color = '#ffd98a'; bold = true; }
      else if (row.kind === 'sec') { label = `${this.expanded.has(row.id) ? '▾' : '▸'} ${row.label}`; color = '#9fd5ff'; bold = true; }
      else if (row.kind === 'chapter') {
        const m = STORY_QUESTS.filter((q) => q.chapter === row.ch.chapter);
        const done = m.filter((q) => StoryStore.isDone(q.id)).length;
        const open = StoryStore.chapterOpen(row.ch.chapter);
        label = `${this.expanded.has(`ch${row.ch.chapter}`) ? '▾' : '▸'} Ch${row.ch.chapter} ${row.ch.titleKo}  ${done}/${m.length}`;
        color = open ? '#bfe3ff' : '#6a7a8a'; bold = true;
      } else {
        const mk = this.mark(row.quest);
        label = `${mk.glyph} ${row.quest.kind === 'main' ? '' : '[서브] '}${row.quest.titleKo}`; color = mk.color;
      }
      const t = this.scene.add.text(14 + indent, y + 4, label, { fontFamily: FONT, fontSize: '11px', color, fontStyle: bold ? 'bold' : 'normal' });
      clampTextWidth(t, TREE_W - 30 - indent);
      bg.on('pointerdown', () => {
        if (row.kind === 'sec' || row.kind === 'chapter') {
          const key = row.kind === 'sec' ? row.id : `ch${row.ch.chapter}`;
          if (this.expanded.has(key)) this.expanded.delete(key); else this.expanded.add(key);
          this.selected = id;
        } else this.selected = id;
        this.renderTree(); this.renderContent(); restoreHandCursor(this.scene);
      });
      c.add([bg, t]);
      y += ROW_H;
    }
    // 스크롤 위치 표기
    if (all.length > vis) {
      const pos = this.scene.add.text(TREE_W - 14, PANEL_H - 18, `${this.scrollRow + 1}–${Math.min(all.length, this.scrollRow + vis)} / ${all.length}행 · 휠`, { fontFamily: FONT, fontSize: '9px', color: '#6f8fa8' }).setOrigin(1, 0);
      c.add(pos);
    }
    applyScreenFixed(this);
  }

  // ── 본문 ──
  private text(c: Phaser.GameObjects.Container, y: number, s: string, size = '13px', color = '#e8f4fd', x = 6, w = CONTENT_W - 30, bold = false): number {
    const t = this.scene.add.text(x, y, s, { fontFamily: FONT, fontSize: size, color, lineSpacing: 5, wordWrap: { width: w }, fontStyle: bold ? 'bold' : 'normal' });
    c.add(t);
    return y + t.height + 6;
  }

  private renderContent(): void {
    this.contentC?.destroy();
    const c = this.scene.add.container(CONTENT_X, this.contentTop);
    this.contentC = c;
    this.add(c);
    const sel = this.selected;
    if (sel === 'journal') this.renderJournal(c);
    else if (sel === 'ladder') this.renderLadder(c);
    else if (sel.startsWith('ch')) this.renderChapter(c, Number(sel.slice(2)));
    else if (sel.startsWith('part')) this.renderPart(c, Number(sel.slice(4)));
    else { const q = STORY_QUESTS.find((x) => x.id === sel); if (q) this.renderQuest(c, q); }
    enforceTextBounds(c, CONTENT_W - 4, 'JournalPanel');
    applyScreenFixed(this);
  }

  private renderJournal(c: Phaser.GameObjects.Container): void {
    let y = this.text(c, 6, '「동명 조행록」 — 빈 열일곱 장', '16px', '#ffd98a', 6, CONTENT_W - 30, true);
    y = this.text(c, y, '고진태 선장의 세 번째 권. 한 장 = 지역 하나. 그 지역의 지표 어종을 제철에 직접 잡고(계측 후 방생 가능), 그 지역 사람들의 이야기(서브 아크)를 끝내야 채워진다. 어획만으로도, 대화만으로도 안 된다.', '12px', '#c8d8e4');
    const states = StoryStore.journalPageStates();
    const lineH = 26;
    for (const p of JOURNAL_PAGES) {
      const st = states[p.page - 1];
      const filled = st.caught && st.arcDone;
      const sp = FISH_DATABASE.find((f) => f.id === p.speciesId)?.nameKo ?? p.speciesId;
      const cond = p.minCm ? `${p.minCm}cm+` : p.count ? `${p.count}마리` : p.releaseAfter ? '계측 후 방류' : '계측만';
      const seasons = p.seasons.map((s) => SEASON_LABEL[s].ko).join('·');
      const col = filled ? '#7fe0b0' : (st.caught || st.arcDone) ? '#ffd257' : '#9fb8cc';
      const row = this.scene.add.text(6, y, `${String(p.page).padStart(2, ' ')}장  ${filled ? '■' : '□'}  ${p.labelKo}`, { fontFamily: FONT, fontSize: '12px', color: col, fontStyle: filled ? 'bold' : 'normal' });
      const det = this.scene.add.text(250, y, `${sp} · ${seasons} · ${cond}   어획 ${st.caught ? '✓' : '·'}  아크 ${p.arcId} ${st.arcDone ? '✓' : '·'}`, { fontFamily: FONT, fontSize: '11px', color: '#9fb8cc' });
      clampTextWidth(det, CONTENT_W - 260);
      c.add([row, det]);
      y += lineH;
    }
    this.text(c, y + 4, '※ 채운 장은 해당 지역 물때·어종 정보 열람이 영구 개방됩니다(홈타운 액자 벽은 후속).', '10px', '#6f8fa8');
  }

  private renderLadder(c: Phaser.GameObjects.Container): void {
    let y = this.text(c, 6, '자격 사다리 — 챕터마다 기한 걸린 자격 하나', '16px', '#ffd98a', 6, CONTENT_W - 30, true);
    const dl = StoryStore.deadlineDaysLeft();
    y = this.text(c, y, `스토리 ${StoryStore.storyDay}일차 · ${dl == null ? '기한 없음' : `실습생 D-${dl}`} · 항구 신뢰(속초) ${StoryStore.harborRep('gangwon_sokcho')} · 바다 평판 ${StoryStore.seaRep >= 0 ? '+' : ''}${StoryStore.seaRep}`, '12px', '#c8d8e4');
    for (const ch of STORY_CHAPTERS) {
      const q = ch.qualification; if (!q) continue;
      const held = q.licenseIds.length > 0 && q.licenseIds.every((l) => GameState.hasLicense(l as never));
      const open = StoryStore.chapterOpen(ch.chapter);
      const names = q.licenseIds.map((l) => getLicenseByType(l as never)?.nameKo ?? l).join(' + ') || q.labelKo;
      y = this.text(c, y, `Ch${ch.chapter} ${held ? '✓' : open ? '○' : ' '} ${names}`, '13px', held ? '#7fe0b0' : open ? '#e8f4fd' : '#6a7a8a', 6, CONTENT_W - 30, true);
      y = this.text(c, y, `기한: ${q.deadlineKo} · 초과 시: ${q.onMissKo} · 여는 것: ${q.unlocksKo}`, '11px', '#9fb8cc', 18, CONTENT_W - 44);
    }
    this.text(c, y + 2, '실패 엔딩은 없습니다 — 기한을 놓쳐도 비용과 한 시즌 지연만 생깁니다.', '10px', '#6f8fa8');
    this.text(c, y + 20, '※ 본 게임의 \'6개월 실습기간\'은 게임 진행을 위한 설정입니다. 실제 어촌계의 가입 자격·거주기간·가입 절차는 각 어촌계의 정관 및 관련 법령에 따라 다를 수 있습니다.', '10px', '#6f8fa8');
  }

  private renderPart(c: Phaser.GameObjects.Container, part: number): void {
    const chs = STORY_CHAPTERS.filter((x) => x.part === part);
    let y = this.text(c, 6, `제${part}부 「${chs.map((x) => x.partTitleKo).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}」`, '16px', '#9fd5ff', 6, CONTENT_W - 30, true);
    for (const ch of chs) y = this.text(c, y, `Ch${ch.chapter} ${ch.titleKo} — Lv${ch.levelBand[0]}~${ch.levelBand[1]} · 메인 ${ch.contract.mainCount} · 서브 ${ch.contract.subCount}`, '12px', '#c8d8e4');
  }

  private renderChapter(c: Phaser.GameObjects.Container, chNum: number): void {
    const ch = STORY_CHAPTERS.find((x) => x.chapter === chNum); if (!ch) return;
    let y = this.text(c, 6, `Ch${ch.chapter} ${ch.titleKo}`, '16px', '#9fd5ff', 6, CONTENT_W - 30, true);
    y = this.text(c, y, `Lv${ch.levelBand[0]}~${ch.levelBand[1]} · ${StoryStore.chapterOpen(ch.chapter) ? '개방' : '잠김 — 이전 챕터 마지막 메인 퀘스트 완료 시'}`, '11px', '#7fb8d8');
    y = this.text(c, y, `"${ch.questionKo}"`, '13px', '#e8f4fd');
    if (ch.qualification) y = this.text(c, y, `이 챕터의 자격: ${ch.qualification.labelKo} · 기한 ${ch.qualification.deadlineKo}`, '12px', '#ffd98a');
    const arcs = [...new Set(STORY_QUESTS.filter((q) => q.chapter === ch.chapter && q.arcId).map((q) => q.arcId as string))];
    if (arcs.length) {
      y = this.text(c, y + 4, '이 챕터의 사람들', '13px', '#9fd5ff', 6, CONTENT_W - 30, true);
      for (const a of arcs) {
        const arc = getStoryArc(a); if (!arc) continue;
        const pr = StoryStore.arcProgress(a);
        y = this.text(c, y, `${a} ${arc.titleKo}  (${pr.done}/${pr.total})  — ${arc.angleKo}`, '11px', '#c8d8e4', 14, CONTENT_W - 40);
      }
    }
  }

  private renderQuest(c: Phaser.GameObjects.Container, q: StoryQuestDef): void {
    const st = StoryStore.status(q);
    const stLabel = st === 'done' ? '완료' : st === 'active' ? '진행 중' : st === 'available' ? '수락 가능' : '잠김';
    const h = this.scene.add.text(6, 6, q.titleKo, { fontFamily: FONT, fontSize: '16px', color: '#7fe0b0', fontStyle: 'bold', wordWrap: { width: CONTENT_W - 120 } });
    const chip = this.scene.add.text(CONTENT_W - 24, 8, stLabel, { fontFamily: FONT, fontSize: '11px', color: '#0b1620', fontStyle: 'bold', backgroundColor: st === 'done' ? '#7fe0b0' : st === 'active' ? '#ffd257' : st === 'available' ? '#9fd5ff' : '#8a97a8', padding: { x: 6, y: 2 } }).setOrigin(1, 0);
    c.add([h, chip]);
    let y = 6 + h.height + 8;
    const giver = q.giver ? (getStoryNpc(q.giver)?.nameKo ?? q.giver) : '(자동 시작)';
    const arc = q.arcId ? getStoryArc(q.arcId) : undefined;
    y = this.text(c, y, `${q.kind === 'main' ? '메인' : `서브 · ${arc?.titleKo ?? q.arcId}`} · ${q.id} · Ch${q.chapter} · Lv${q.minLevel}+ · 발주 ${giver} · XP ${q.xp.toLocaleString()}`, '11px', '#7fb8d8');
    y = this.text(c, y, q.descKo, '13px', '#e8f4fd');
    if (q.deadline) y = this.text(c, y, `기한 ${q.deadline.days}일 — 초과 시 ${q.deadline.onMiss === 'cost' ? '비용 발생' : '한 시즌 지연'} (실패 없음)`, '11px', '#ffd98a');
    y = this.text(c, y + 4, '목표', '13px', '#9fd5ff', 6, CONTENT_W - 30, true);
    q.objectives.forEach((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const cur = StoryStore.progress(q.id)?.obj[i] ?? 0;
      const tgt = StoryStore.objectiveTarget(o);
      const prog = tgt > 1 ? ` (${Math.min(cur, tgt).toLocaleString()}/${tgt.toLocaleString()})` : '';
      y = this.text(c, y, `${done ? '✓' : '·'} ${o.labelKo}${prog}${o.manual && !done && st !== 'done' ? '  — 발주 NPC 대화로 진행' : ''}`, '12px', done ? '#7fe0b0' : '#d0e8f5', 14, CONTENT_W - 40);
    });
    const rw: string[] = [`경험치 ${q.xp.toLocaleString()}`];
    if (q.rewards?.coins) rw.push(`${q.rewards.coins.toLocaleString()}원`);
    for (const l of q.rewards?.licenses ?? []) rw.push(getLicenseByType(l as never)?.nameKo ?? l);
    for (const it of q.rewards?.items ?? []) rw.push(`${it.id} ×${it.qty} (가방 — 준비 중)`);
    if (q.reputation?.sea) rw.push(`바다 평판 ${q.reputation.sea > 0 ? '+' : ''}${q.reputation.sea}`);
    for (const [r, d] of Object.entries(q.reputation?.harbor ?? {})) rw.push(`항구 신뢰(${r}) ${d > 0 ? '+' : ''}${d}`);
    y = this.text(c, y + 4, '보상', '13px', '#9fd5ff', 6, CONTENT_W - 30, true);
    y = this.text(c, y, rw.join(' · '), '12px', '#ffd98a', 14, CONTENT_W - 40);
    if (q.journalPage) {
      const pg = getJournalPage(q.journalPage);
      y = this.text(c, y, `→ 조행록 ${q.journalPage}장 (${pg?.labelKo ?? ''})`, '12px', '#ffd98a', 14, CONTENT_W - 40);
    }
    if (q.teaches?.length) y = this.text(c, y, `배우는 것: ${q.teaches.map((k) => TEACH_LABEL[k] ?? k).join(' · ')}`, '10px', '#6f8fa8', 6, CONTENT_W - 30);
    if (q.prereq.length) y = this.text(c, y, `선행: ${q.prereq.map((id) => STORY_QUESTS.find((x) => x.id === id)?.titleKo ?? id).join(', ')}`, '11px', '#8fb4cc');
    if (st === 'available' && q.giver) this.text(c, y, `${giver}에게 [F]로 말을 걸어 수락하세요.`, '11px', '#ffd257');
    if (st === 'locked') {
      const why: string[] = [];
      if (!StoryStore.chapterOpen(q.chapter)) why.push(`Ch${q.chapter} 미개방`);
      if ((GameState.player.level ?? 1) < q.minLevel) why.push(`레벨 ${q.minLevel} 필요`);
      if (!q.prereq.every((p) => StoryStore.isDone(p))) why.push('선행 퀘스트 미완료');
      this.text(c, y, `잠김: ${why.join(' · ') || '조건 미충족'}`, '11px', '#8a97a8');
    }
  }
}

/** 조행록 페이지 상세 (도움말·툴팁 공용) */
export function journalPageSummary(p: JournalPageDef): string {
  const sp = FISH_DATABASE.find((f) => f.id === p.speciesId)?.nameKo ?? p.speciesId;
  return `${p.page}장 ${p.labelKo} — ${sp} · ${p.seasons.map((s) => SEASON_LABEL[s].ko).join('·')} · ${p.howKo}`;
}
