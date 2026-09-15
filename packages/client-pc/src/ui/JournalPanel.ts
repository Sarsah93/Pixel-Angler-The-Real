/**
 * @file JournalPanel.ts
 * @description 일지 패널 (J — 136차 재작성). 좌 레일 / 우 본문 3단 항법.
 *
 * 구 구조(120퀘를 한 트리에 펼친 윈도우드 목록)는 폐기 — "지금 어느 챕터의 무엇을 하고 있나"가
 * 스크롤 안에 묻혔다. 대신 **레일 = 챕터 7 + 조행록 + 자격 + 사람들**, 본문 = 선택한 챕터의
 * **메인 라인(세로 스파인) / 서브 아크(인물 박스)** 2트랙. 퀘스트를 고르면 본문이 상세로 바뀐다.
 *
 * - 목록에는 경험치를 쓰지 않는다(사용자 지시) — XP는 **상세 '보상'** 에서만 보인다.
 * - 챕터별 추적: 레일의 진행 막대 + 본문 헤더의 메인/서브 카운트가 같은 수치를 쓴다.
 * - 상태 표기는 글자가 아니라 **도형 + 색**(완료 채운 원 / 진행 링 / 가능 빈 원 / 잠김 점).
 *
 * 정의는 core `STORY_QUESTS`·`STORY_ARCS`, 상태는 `StoryStore`.
 */

import Phaser from 'phaser';
import {
  STORY_CHAPTERS, STORY_QUESTS, STORY_ARCS, JOURNAL_PAGES, getStoryNpc, getStoryArc, SEASON_LABEL, getJournalPage,
  FISH_DATABASE, getLicenseByType, type StoryQuestDef, type JournalPageDef, type StoryArcDef,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const RAIL_W = 236;
const CONTENT_X = RAIL_W + 20;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
const FONT = '"Noto Sans KR", sans-serif';

/** 트랙 색 — 메인 = 부표 주황 / 서브 = 조류 청록 (아티팩트 항로도와 동일 체계) */
const C_MAIN = '#ffb26b';
const C_SUB = '#6fd3e0';
const C_GOLD = '#ffd98a';
const C_TEXT = '#e8f4fd';
const C_DIM = '#8fa8bc';
const C_LOCK = '#6a7a8a';

const REGION_LABEL: Record<string, string> = {
  gangwon_sokcho: '강원 속초', busan: '부산', ulsan: '울산', gyeongbuk_pohang: '경북 포항',
  gyeongnam_geoje: '경남 거제', jeonnam_yeosu: '전남 여수', chungnam_taean: '충남 태안',
  jeju: '제주', ulleungdo: '울릉도', dokdo: '독도', incheon: '인천',
};

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

type View =
  | { kind: 'chapter'; ch: number }
  | { kind: 'quest'; id: string; from: number }
  | { kind: 'journal' }
  | { kind: 'ladder' }
  | { kind: 'people' }
  | { kind: 'arc'; id: string; from: View };

export interface JournalConfig { onClose: () => void }

export class JournalPanel extends DraggablePanel {
  private view: View;
  private railC?: Phaser.GameObjects.Container;
  private bodyC?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, cfg: JournalConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '일지 — 조행록', onClose: cfg.onClose, dim: false, depth: 891,
    });
    this.view = { kind: 'chapter', ch: StoryStore.currentChapter() };

    const g = scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, RAIL_W, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, RAIL_W, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(CONTENT_X - 8, top - 4, CONTENT_W + 16, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(CONTENT_X - 8, top - 4, CONTENT_W + 16, PANEL_H - top - 8, 6);
    this.add(g);

    this.render();
    applyScreenFixed(this);
  }

  // ═══════════════════════════════════════════════════
  // 공용 부품
  // ═══════════════════════════════════════════════════

  /** 퀘스트 상태 → 색 */
  private statusColor(q: StoryQuestDef): string {
    const st = StoryStore.status(q);
    return st === 'done' ? '#7fe0b0' : st === 'active' ? '#ffd257' : st === 'available' ? C_TEXT : C_LOCK;
  }

  /**
   * 상태 마커 — 글리프가 아니라 **도형 + 색**(ui-panel §5).
   * 완료 = 채운 원 / 진행 중 = 두꺼운 링 / 가능 = 얇은 링 / 잠김 = 작은 점.
   */
  private statusDot(c: Phaser.GameObjects.Container, x: number, y: number, q: StoryQuestDef): void {
    const st = StoryStore.status(q);
    const col = Phaser.Display.Color.HexStringToColor(this.statusColor(q)).color;
    const g = this.scene.add.graphics();
    if (st === 'done') { g.fillStyle(col, 1); g.fillCircle(x, y, 4.5); }
    else if (st === 'active') { g.lineStyle(2.5, col, 1); g.strokeCircle(x, y, 4); }
    else if (st === 'available') { g.lineStyle(1.2, col, 0.95); g.strokeCircle(x, y, 4.5); }
    else { g.fillStyle(col, 0.8); g.fillCircle(x, y, 2); }
    c.add(g);
  }

  /** 진행 막대 (레일·헤더 공용) */
  private progressBar(
    c: Phaser.GameObjects.Container, x: number, y: number, w: number, done: number, total: number, hex: string,
  ): void {
    const g = this.scene.add.graphics();
    const col = Phaser.Display.Color.HexStringToColor(hex).color;
    g.fillStyle(0x16293e, 1); g.fillRect(x, y, w, 4);
    if (total > 0 && done > 0) { g.fillStyle(col, 0.95); g.fillRect(x, y, Math.max(2, (w * done) / total), 4); }
    g.lineStyle(1, 0x2a3a4a, 1); g.strokeRect(x, y, w, 4);
    c.add(g);
  }

  private text(
    c: Phaser.GameObjects.Container, y: number, s: string,
    size = '13px', color = C_TEXT, x = 6, w = CONTENT_W - 24, bold = false,
  ): number {
    const t = this.scene.add.text(x, y, s, {
      fontFamily: FONT, fontSize: size, color, lineSpacing: 5,
      wordWrap: { width: w }, fontStyle: bold ? 'bold' : 'normal',
    });
    c.add(t);
    return y + t.height + 6;
  }

  /** 클릭 가능한 행 배경 */
  private hitRow(
    c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, sel: boolean, onClick: () => void,
  ): Phaser.GameObjects.Rectangle {
    const r = this.scene.add.rectangle(x, y, w, h, sel ? 0x1f4a6a : 0x122236, sel ? 0.95 : 0.55).setOrigin(0, 0);
    r.setStrokeStyle(1, sel ? 0x5cd0ff : 0x24384c, 1);
    r.setInteractive({ useHandCursor: true });
    r.on('pointerdown', () => { onClick(); restoreHandCursor(this.scene); });
    c.add(r);
    return r;
  }

  private go(v: View): void { this.view = v; this.render(); }

  private render(): void {
    this.renderRail();
    this.renderBody();
    applyScreenFixed(this);
  }

  // ═══════════════════════════════════════════════════
  // 좌 레일 — 챕터 추적
  // ═══════════════════════════════════════════════════
  private renderRail(): void {
    this.railC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.railC = c;
    this.add(c);

    const x = 14;
    const w = RAIL_W - 12;
    let y = this.contentTop + 4;

    const total = StoryStore.counts();
    const allDone = total.mainDone + total.subDone;
    const allTotal = total.mainTotal + total.subTotal;
    const head = this.scene.add.text(x, y, `전체 진행  ${allDone} / ${allTotal}`, {
      fontFamily: FONT, fontSize: '12px', color: C_GOLD, fontStyle: 'bold',
    });
    c.add(head);
    this.progressBar(c, x, y + 19, w, allDone, allTotal, C_GOLD);
    y += 30;

    const cur = StoryStore.currentChapter();
    for (const ch of STORY_CHAPTERS) {
      const qs = STORY_QUESTS.filter((q) => q.chapter === ch.chapter);
      const done = qs.filter((q) => StoryStore.isDone(q.id)).length;
      const open = StoryStore.chapterOpen(ch.chapter);
      const sel = this.view.kind === 'chapter' ? this.view.ch === ch.chapter
        : this.view.kind === 'quest' ? this.view.from === ch.chapter : false;
      const rowH = 44;
      this.hitRow(c, x - 4, y, w + 6, rowH, sel, () => this.go({ kind: 'chapter', ch: ch.chapter }));

      const lab = this.scene.add.text(x + 4, y + 5, `Ch${ch.chapter}  ${ch.titleKo.split(' — ')[0]}`, {
        fontFamily: FONT, fontSize: '12px', color: open ? C_TEXT : C_LOCK, fontStyle: 'bold',
      });
      clampTextWidth(lab, w - 56);
      const cnt = this.scene.add.text(x + w - 8, y + 6, `${done}/${qs.length}`, {
        fontFamily: FONT, fontSize: '10px', color: open ? C_DIM : C_LOCK,
      }).setOrigin(1, 0);
      const sub = this.scene.add.text(x + 4, y + 22, `${ch.titleKo.includes(' — ') ? ch.titleKo.split(' — ')[1] : ''} · Lv${ch.levelBand[0]}–${ch.levelBand[1]}`, {
        fontFamily: FONT, fontSize: '10px', color: open ? C_DIM : C_LOCK,
      });
      clampTextWidth(sub, w - 16);
      c.add([lab, cnt, sub]);
      this.progressBar(c, x + 4, y + 36, w - 16, done, qs.length, open ? C_MAIN : '#3a4a5a');

      if (ch.chapter === cur) {
        const now = this.scene.add.graphics();
        now.fillStyle(0xffd257, 1); now.fillRect(x - 8, y + 4, 3, rowH - 8);
        c.add(now);
      }
      y += rowH + 4;
    }

    y += 6;
    const extras: { key: View['kind']; label: string; note: string; v: View }[] = [
      { key: 'journal', label: '동명 조행록', note: `${StoryStore.journalFilledCount()} / 17장`, v: { kind: 'journal' } },
      { key: 'ladder', label: '자격 사다리', note: (() => { const d = StoryStore.deadlineDaysLeft(); return d == null ? '기한 없음' : d >= 0 ? `D-${d}` : `D+${-d} 초과`; })(), v: { kind: 'ladder' } },
      { key: 'people', label: '사람들', note: `${STORY_ARCS.length} 아크`, v: { kind: 'people' } },
    ];
    for (const e of extras) {
      const sel = this.view.kind === e.key || (this.view.kind === 'arc' && e.key === 'people');
      this.hitRow(c, x - 4, y, w + 6, 26, sel, () => this.go(e.v));
      const t = this.scene.add.text(x + 4, y + 5, e.label, { fontFamily: FONT, fontSize: '12px', color: C_GOLD });
      const n = this.scene.add.text(x + w - 8, y + 6, e.note, { fontFamily: FONT, fontSize: '10px', color: C_DIM }).setOrigin(1, 0);
      c.add([t, n]);
      y += 30;
    }
  }

  // ═══════════════════════════════════════════════════
  // 우 본문
  // ═══════════════════════════════════════════════════
  private renderBody(): void {
    this.bodyC?.destroy();
    const c = this.scene.add.container(CONTENT_X, this.contentTop);
    this.bodyC = c;
    this.add(c);
    const v = this.view;
    if (v.kind === 'chapter') this.renderChapter(c, v.ch);
    else if (v.kind === 'quest') this.renderQuest(c, v);
    else if (v.kind === 'journal') this.renderJournal(c);
    else if (v.kind === 'ladder') this.renderLadder(c);
    else if (v.kind === 'people') this.renderPeople(c);
    else this.renderArc(c, v);
    enforceTextBounds(c, CONTENT_W - 4, 'JournalPanel');
  }

  /** 되돌아가기 줄 */
  private backRow(c: Phaser.GameObjects.Container, label: string, to: View): number {
    const r = this.scene.add.rectangle(4, 4, 150, 20, 0x16293e, 0.9).setOrigin(0, 0);
    r.setStrokeStyle(1, 0x2a3a4a, 1);
    r.setInteractive({ useHandCursor: true });
    r.on('pointerdown', () => { this.go(to); restoreHandCursor(this.scene); });
    const t = this.scene.add.text(12, 7, `◀ ${label}`, { fontFamily: FONT, fontSize: '11px', color: '#9fd5ff' });
    clampTextWidth(t, 134);
    c.add([r, t]);
    return 30;
  }

  // ── 챕터 (2트랙) ──
  private renderChapter(c: Phaser.GameObjects.Container, chNum: number): void {
    const ch = STORY_CHAPTERS.find((x) => x.chapter === chNum);
    if (!ch) return;
    const mains = STORY_QUESTS.filter((q) => q.chapter === chNum && q.kind === 'main');
    const subs = STORY_QUESTS.filter((q) => q.chapter === chNum && q.kind === 'sub');
    const open = StoryStore.chapterOpen(chNum);

    // 헤더
    const eyebrow = this.scene.add.text(6, 4, `제${ch.part}부 ${ch.partTitleKo}  ·  Chapter ${ch.chapter}`, {
      fontFamily: FONT, fontSize: '10px', color: C_MAIN,
    });
    c.add(eyebrow);
    let y = this.text(c, 20, ch.titleKo, '18px', open ? C_TEXT : C_LOCK, 6, CONTENT_W - 280, true);
    y = this.text(c, y - 2, `Lv ${ch.levelBand[0]}–${ch.levelBand[1]}   ·   ${ch.regionIds.map((r) => REGION_LABEL[r] ?? r).join(' · ')}   ·   ${open ? '개방' : '잠김 — 이전 챕터 마지막 메인 완료 시'}`,
      '11px', C_DIM, 6, CONTENT_W - 280);
    y = this.text(c, y, `"${ch.questionKo}"`, '13px', '#cfe6f5', 6, CONTENT_W - 290);

    // 우상단 자격 박스
    if (ch.qualification) {
      const qw = 258;
      const qx = CONTENT_W - qw - 4;
      const box = this.scene.add.graphics();
      box.fillStyle(0x2a2411, 0.75); box.fillRoundedRect(qx, 4, qw, 84, 4);
      box.lineStyle(1, 0x5a4a1e, 1); box.strokeRoundedRect(qx, 4, qw, 84, 4);
      c.add(box);
      const held = ch.qualification.licenseIds.length > 0
        && ch.qualification.licenseIds.every((l) => GameState.hasLicense(l as never));
      const k = this.scene.add.text(qx + 10, 10, '챕터 자격 조건', { fontFamily: FONT, fontSize: '9px', color: C_GOLD, fontStyle: 'bold' });
      const vtx = this.scene.add.text(qx + 10, 24, ch.qualification.labelKo, {
        fontFamily: FONT, fontSize: '12px', color: held ? '#7fe0b0' : C_TEXT, wordWrap: { width: qw - 20 },
      });
      const dtx = this.scene.add.text(qx + 10, 24 + vtx.height + 6, `기한 ${ch.qualification.deadlineKo}\n여는 것 ${ch.qualification.unlocksKo}`, {
        fontFamily: FONT, fontSize: '10px', color: C_DIM, lineSpacing: 3, wordWrap: { width: qw - 20 },
      });
      c.add([k, vtx, dtx]);
    }

    // 트랙 2열
    const colW = (CONTENT_W - 30) / 2;
    const leftX = 6;
    const rightX = 6 + colW + 24;
    const trackTop = Math.max(y + 8, 104);

    const mDone = mains.filter((q) => StoryStore.isDone(q.id)).length;
    const sDone = subs.filter((q) => StoryStore.isDone(q.id)).length;
    this.trackLabel(c, leftX, trackTop, colW, `메인 라인  ${mDone} / ${mains.length}`, C_MAIN);
    this.trackLabel(c, rightX, trackTop, colW, `서브 아크  ${sDone} / ${subs.length}`, C_SUB);
    this.progressBar(c, leftX, trackTop + 17, colW, mDone, mains.length, C_MAIN);
    this.progressBar(c, rightX, trackTop + 17, colW, sDone, subs.length, C_SUB);

    // 메인 = 세로 스파인
    let my = trackTop + 30;
    const spineTop = my + 8;
    const rowH = 24;
    for (const q of mains) {
      this.questRow(c, leftX + 16, my, colW - 16, q, chNum);
      this.statusDot(c, leftX + 5, my + 11, q);
      my += rowH;
    }
    const spine = this.scene.add.graphics();
    spine.lineStyle(1, 0x2a4a62, 1);
    spine.lineBetween(leftX + 5, spineTop, leftX + 5, my - rowH + 11);
    c.add(spine);

    // 서브 = 아크 박스 (한 줄 헤더 — 세로 예산 확보)
    let sy = trackTop + 30;
    const byArc = new Map<string, StoryQuestDef[]>();
    for (const q of subs) {
      const a = q.arcId ?? '?';
      if (!byArc.has(a)) byArc.set(a, []);
      byArc.get(a)!.push(q);
    }
    // 세로 예산 초과 시 행 간격만 좁힌다 (글자 크기는 유지 — ui-panel 규칙)
    const budget = PANEL_H - this.contentTop - 18 - (trackTop + 30);
    const need = byArc.size * 22 + subs.length * rowH + byArc.size * 8;
    const gap = need > budget ? Math.max(2, 8 - Math.ceil((need - budget) / Math.max(1, byArc.size))) : 8;
    for (const [arcId, list] of byArc) {
      const arc = getStoryArc(arcId);
      const hr = this.scene.add.rectangle(rightX, sy, colW, 20, 0x102838, 0.85).setOrigin(0, 0);
      hr.setStrokeStyle(1, 0x24485c, 1);
      hr.setInteractive({ useHandCursor: true });
      hr.on('pointerdown', () => { this.go({ kind: 'arc', id: arcId, from: { kind: 'chapter', ch: chNum } }); restoreHandCursor(this.scene); });
      const pr = StoryStore.arcProgress(arcId);
      const ht = this.scene.add.text(rightX + 7, sy + 4, `${arcId}  ${arc?.titleKo.split(' — ')[0] ?? arcId}`, {
        fontFamily: FONT, fontSize: '11px', color: C_SUB,
      });
      clampTextWidth(ht, colW - 60);
      const hp = this.scene.add.text(rightX + colW - 7, sy + 5, `${pr.done}/${pr.total}`, {
        fontFamily: FONT, fontSize: '9px', color: C_DIM,
      }).setOrigin(1, 0);
      c.add([hr, ht, hp]);
      sy += 22;
      for (const q of list) {
        this.questRow(c, rightX + 14, sy, colW - 14, q, chNum);
        this.statusDot(c, rightX + 7, sy + 11, q);
        sy += rowH;
      }
      sy += gap;
    }
  }

  private trackLabel(c: Phaser.GameObjects.Container, x: number, y: number, w: number, s: string, hex: string): void {
    const t = this.scene.add.text(x, y, s, { fontFamily: FONT, fontSize: '11px', color: hex, fontStyle: 'bold' });
    clampTextWidth(t, w);
    c.add(t);
  }

  /** 퀘스트 한 줄 — 제목만(경험치는 상세 '보상'에서만 — 사용자 지시) */
  private questRow(
    c: Phaser.GameObjects.Container, x: number, y: number, w: number, q: StoryQuestDef, from: number,
  ): void {
    const r = this.scene.add.rectangle(x, y, w, 22, 0x0e1c2b, 0.5).setOrigin(0, 0);
    r.setStrokeStyle(1, 0x1a2c3e, 1);
    r.setInteractive({ useHandCursor: true });
    r.on('pointerover', () => r.setFillStyle(0x1a3247, 0.8));
    r.on('pointerout', () => r.setFillStyle(0x0e1c2b, 0.5));
    r.on('pointerdown', () => { this.go({ kind: 'quest', id: q.id, from }); restoreHandCursor(this.scene); });
    const t = this.scene.add.text(x + 8, y + 4, q.titleKo, {
      fontFamily: FONT, fontSize: '12px', color: this.statusColor(q),
    });
    clampTextWidth(t, w - 50);
    const lv = this.scene.add.text(x + w - 7, y + 5, `Lv${q.minLevel}`, {
      fontFamily: FONT, fontSize: '9px', color: C_LOCK,
    }).setOrigin(1, 0);
    c.add([r, t, lv]);
  }

  // ── 퀘스트 상세 ──
  private renderQuest(c: Phaser.GameObjects.Container, v: { id: string; from: number }): void {
    const q = STORY_QUESTS.find((x) => x.id === v.id);
    if (!q) return;
    const ch = STORY_CHAPTERS.find((x) => x.chapter === v.from);
    let y = this.backRow(c, `Ch${v.from} ${ch?.titleKo.split(' — ')[0] ?? ''}`, { kind: 'chapter', ch: v.from });

    const st = StoryStore.status(q);
    const stLabel = st === 'done' ? '완료' : st === 'active' ? '진행 중' : st === 'available' ? '수락 가능' : '잠김';
    const accent = q.kind === 'main' ? C_MAIN : C_SUB;
    const h = this.scene.add.text(6, y, q.titleKo, {
      fontFamily: FONT, fontSize: '18px', color: accent, fontStyle: 'bold', wordWrap: { width: CONTENT_W - 140 },
    });
    const chip = this.scene.add.text(CONTENT_W - 12, y + 4, stLabel, {
      fontFamily: FONT, fontSize: '11px', color: '#0b1620', fontStyle: 'bold',
      backgroundColor: st === 'done' ? '#7fe0b0' : st === 'active' ? '#ffd257' : st === 'available' ? '#9fd5ff' : '#8a97a8',
      padding: { x: 7, y: 2 },
    }).setOrigin(1, 0);
    c.add([h, chip]);
    y += h.height + 6;

    const giver = q.giver ? (getStoryNpc(q.giver)?.nameKo ?? q.giver) : '(자동 시작)';
    const arc = q.arcId ? getStoryArc(q.arcId) : undefined;
    y = this.text(c, y, `${q.kind === 'main' ? '메인' : `서브 · ${arc?.titleKo ?? q.arcId}`}  ·  ${q.id}  ·  Lv${q.minLevel}+  ·  ${REGION_LABEL[q.region] ?? q.region}  ·  발주 ${giver}`,
      '11px', C_DIM);
    y = this.text(c, y, q.descKo, '13px', C_TEXT);
    if (q.deadline) {
      y = this.text(c, y, `기한 ${q.deadline.days}일 — 초과 시 ${q.deadline.onMiss === 'cost' ? '비용 발생' : '한 시즌 지연'} (실패 없음)`, '11px', C_GOLD);
    }

    y = this.text(c, y + 4, '목표', '13px', accent, 6, CONTENT_W - 24, true);
    q.objectives.forEach((o, i) => {
      const done = StoryStore.objectiveDone(q, i);
      const cur = StoryStore.progress(q.id)?.obj[i] ?? 0;
      const tgt = StoryStore.objectiveTarget(o);
      const prog = tgt > 1 ? ` (${Math.min(cur, tgt).toLocaleString()}/${tgt.toLocaleString()})` : '';
      const g = this.scene.add.graphics();
      if (done) { g.fillStyle(0x7fe0b0, 1); g.fillCircle(12, y + 8, 3.5); }
      else { g.lineStyle(1.2, 0x9fb8cc, 0.9); g.strokeCircle(12, y + 8, 3.5); }
      c.add(g);
      y = this.text(c, y, `${o.labelKo}${prog}${o.manual && !done && st !== 'done' ? '  — 발주 NPC 대화로 진행' : ''}`,
        '12px', done ? '#7fe0b0' : '#d0e8f5', 24, CONTENT_W - 44);
    });

    // 보상 — 경험치는 여기에만 표기한다(사용자 지시)
    const rw: string[] = [`경험치 ${q.xp.toLocaleString()} XP`];
    if (q.rewards?.coins) rw.push(`${q.rewards.coins.toLocaleString()}원`);
    for (const l of q.rewards?.licenses ?? []) rw.push(getLicenseByType(l as never)?.nameKo ?? l);
    for (const it of q.rewards?.items ?? []) rw.push(`${it.id} ×${it.qty} (가방 — 준비 중)`);
    if (q.reputation?.sea) rw.push(`바다 평판 ${q.reputation.sea > 0 ? '+' : ''}${q.reputation.sea}`);
    for (const [r, d] of Object.entries(q.reputation?.harbor ?? {})) rw.push(`항구 신뢰(${r}) ${d > 0 ? '+' : ''}${d}`);
    if (q.unlocks?.length) rw.push(`해금 ${q.unlocks.join(' · ')}`);
    y = this.text(c, y + 4, '보상', '13px', C_GOLD, 6, CONTENT_W - 24, true);
    y = this.text(c, y, rw.join('   ·   '), '12px', C_GOLD, 24, CONTENT_W - 44);

    if (q.journalPage) {
      const pg = getJournalPage(q.journalPage);
      y = this.text(c, y, `→ 조행록 ${q.journalPage}장 (${pg?.labelKo ?? ''})`, '12px', C_GOLD, 24, CONTENT_W - 44);
    }
    if (q.teaches?.length) {
      y = this.text(c, y + 2, `배우는 것 — ${q.teaches.map((k) => TEACH_LABEL[k] ?? k).join(' · ')}`, '10px', '#6f8fa8');
    }
    if (q.prereq.length) {
      y = this.text(c, y, `선행 — ${q.prereq.map((id) => STORY_QUESTS.find((x) => x.id === id)?.titleKo ?? id).join(', ')}`, '11px', '#8fb4cc');
    }
    if (st === 'available' && q.giver) this.text(c, y, `${giver}에게 [F]로 말을 걸어 수락하세요.`, '11px', '#ffd257');
    if (st === 'locked') {
      const why: string[] = [];
      if (!StoryStore.chapterOpen(q.chapter)) why.push(`Ch${q.chapter} 미개방`);
      if ((GameState.player.level ?? 1) < q.minLevel) why.push(`레벨 ${q.minLevel} 필요`);
      if (!q.prereq.every((p) => StoryStore.isDone(p))) why.push('선행 퀘스트 미완료');
      this.text(c, y, `잠김 — ${why.join(' · ') || '조건 미충족'}`, '11px', '#8a97a8');
    }
  }

  // ── 사람들(아크 색인) ──
  private renderPeople(c: Phaser.GameObjects.Container): void {
    let y = this.text(c, 6, '사람들 — 17개 인물 아크', '16px', C_SUB, 6, CONTENT_W - 24, true);
    y = this.text(c, y - 2, '서브 퀘스트 55편은 인물 아크에 묶여 챕터를 가로지른다. 클릭하면 그 사람의 이야기와 관련 퀘스트가 열린다.', '11px', C_DIM);
    const cols = 3;
    const cw = (CONTENT_W - 12 - (cols - 1) * 8) / cols;
    const chGap = 6;
    let i = 0;
    for (const a of STORY_ARCS) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 6 + col * (cw + 8);
      const cy = y + row * (54 + chGap);
      const pr = StoryStore.arcProgress(a.id);
      const met = a.questIds.some((id) => StoryStore.isDone(id) || StoryStore.isActive(id));
      this.hitRow(c, x, cy, cw, 54, false, () => this.go({ kind: 'arc', id: a.id, from: { kind: 'people' } }));
      const t1 = this.scene.add.text(x + 8, cy + 5, `${a.id}  ${met ? a.titleKo.split(' — ')[0] : '???'}`, {
        fontFamily: FONT, fontSize: '11px', color: met ? C_SUB : C_LOCK, fontStyle: 'bold',
      });
      clampTextWidth(t1, cw - 52);
      const t2 = this.scene.add.text(x + cw - 8, cy + 6, `${pr.done}/${pr.total}`, {
        fontFamily: FONT, fontSize: '9px', color: C_DIM,
      }).setOrigin(1, 0);
      const t3 = this.scene.add.text(x + 8, cy + 21, met ? a.angleKo : '아직 만나지 않은 사람', {
        fontFamily: FONT, fontSize: '10px', color: met ? '#b8ccdc' : C_LOCK, wordWrap: { width: cw - 16 },
      });
      const t4 = this.scene.add.text(x + 8, cy + 38, `${REGION_LABEL[a.regionId] ?? a.regionId} · ${a.questIds.length}편`, {
        fontFamily: FONT, fontSize: '9px', color: '#6f8fa8',
      });
      clampTextWidth(t3, cw - 16);
      clampTextWidth(t4, cw - 16);
      c.add([t1, t2, t3, t4]);
      i++;
    }
  }

  // ── 아크 상세 ──
  private renderArc(c: Phaser.GameObjects.Container, v: { id: string; from: View }): void {
    const a: StoryArcDef | undefined = getStoryArc(v.id);
    if (!a) return;
    let y = this.backRow(c, v.from.kind === 'people' ? '사람들' : '챕터로', v.from);
    const met = a.questIds.some((id) => StoryStore.isDone(id) || StoryStore.isActive(id));
    y = this.text(c, y, `${a.id}  ${met ? a.titleKo : '???'}`, '17px', C_SUB, 6, CONTENT_W - 24, true);
    const pr = StoryStore.arcProgress(a.id);
    y = this.text(c, y - 2, `${REGION_LABEL[a.regionId] ?? a.regionId}  ·  ${pr.done} / ${pr.total}편 완료${a.repeatableKo ? `  ·  반복 의뢰 ${a.repeatableKo}` : ''}`, '11px', C_DIM);
    if (met) {
      y = this.text(c, y, a.relationKo, '13px', C_TEXT);
      y = this.text(c, y, `이 아크가 보여주는 것 — ${a.angleKo}`, '11px', C_GOLD);
      y = this.text(c, y + 2, '인물', '12px', C_SUB, 6, CONTENT_W - 24, true);
      for (const n of a.npcs) y = this.text(c, y, `${n.nameKo}  —  ${n.roleKo}`, '12px', '#cfe6f5', 18, CONTENT_W - 36);
    } else {
      y = this.text(c, y, '아직 만나지 않은 사람입니다. 해당 지역에서 첫 편을 수락하면 내용이 열립니다.', '12px', C_LOCK);
    }
    y = this.text(c, y + 4, '연관 퀘스트', '12px', C_SUB, 6, CONTENT_W - 24, true);
    for (const id of a.questIds) {
      const q = STORY_QUESTS.find((x) => x.id === id);
      if (!q) continue;
      this.statusDot(c, 13, y + 11, q);
      const r = this.scene.add.rectangle(24, y, CONTENT_W - 40, 22, 0x0e1c2b, 0.5).setOrigin(0, 0);
      r.setStrokeStyle(1, 0x1a2c3e, 1);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => { this.go({ kind: 'quest', id: q.id, from: q.chapter }); restoreHandCursor(this.scene); });
      const t = this.scene.add.text(32, y + 4, `Ch${q.chapter}  ${q.titleKo}`, {
        fontFamily: FONT, fontSize: '12px', color: this.statusColor(q),
      });
      clampTextWidth(t, CONTENT_W - 130);
      const lv = this.scene.add.text(CONTENT_W - 22, y + 5, `Lv${q.minLevel}`, {
        fontFamily: FONT, fontSize: '9px', color: C_LOCK,
      }).setOrigin(1, 0);
      c.add([r, t, lv]);
      y += 26;
    }
  }

  // ── 조행록 ──
  private renderJournal(c: Phaser.GameObjects.Container): void {
    let y = this.text(c, 6, `동명 조행록 — ${StoryStore.journalFilledCount()} / 17장`, '16px', C_GOLD, 6, CONTENT_W - 24, true);
    y = this.text(c, y - 2, '고진태 선장의 세 번째 권. 한 장 = 지역 하나. 지표 어종을 제철에 직접 잡고(계측 후 방생 가능), 그 지역 사람들의 이야기(서브 아크)를 끝내야 채워진다. 어획만으로도, 대화만으로도 안 된다.', '11px', C_DIM);
    const states = StoryStore.journalPageStates();
    const lineH = 26;
    for (const p of JOURNAL_PAGES) {
      const st = states[p.page - 1];
      const filled = st.caught && st.arcDone;
      const sp = FISH_DATABASE.find((f) => f.id === p.speciesId)?.nameKo ?? p.speciesId;
      const cond = p.minCm ? `${p.minCm}cm+` : p.count ? `${p.count}마리` : p.releaseAfter ? '계측 후 방류' : '계측만';
      const seasons = p.seasons.map((s) => SEASON_LABEL[s].ko).join('·');
      const col = filled ? '#7fe0b0' : (st.caught || st.arcDone) ? '#ffd257' : '#9fb8cc';
      const g = this.scene.add.graphics();
      if (filled) { g.fillStyle(0x7fe0b0, 1); g.fillRect(8, y + 5, 8, 8); }
      else { g.lineStyle(1, 0x9fb8cc, 0.8); g.strokeRect(8.5, y + 5.5, 7, 7); }
      c.add(g);
      const row = this.scene.add.text(24, y, `${String(p.page).padStart(2, ' ')}장  ${p.labelKo}`, {
        fontFamily: FONT, fontSize: '12px', color: col, fontStyle: filled ? 'bold' : 'normal',
      });
      clampTextWidth(row, 216);
      const det = this.scene.add.text(250, y + 1, `${sp} · ${seasons} · ${cond}`, {
        fontFamily: FONT, fontSize: '11px', color: '#9fb8cc',
      });
      clampTextWidth(det, 260);
      const mk = this.scene.add.text(CONTENT_W - 12, y + 1, `어획 ${st.caught ? '완료' : '미완'}  ·  아크 ${p.arcId} ${st.arcDone ? '완료' : '미완'}`, {
        fontFamily: FONT, fontSize: '10px', color: '#8fa8bc',
      }).setOrigin(1, 0);
      c.add([row, det, mk]);
      y += lineH;
    }
    this.text(c, y + 2, '※ 채운 장은 해당 지역 물때·어종 정보 열람이 영구 개방됩니다(홈타운 액자 벽은 후속).', '10px', '#6f8fa8');
  }

  // ── 자격 사다리 ──
  private renderLadder(c: Phaser.GameObjects.Container): void {
    let y = this.text(c, 6, '자격 사다리 — 챕터마다 기한 걸린 자격 하나', '16px', C_GOLD, 6, CONTENT_W - 24, true);
    const dl = StoryStore.deadlineDaysLeft();
    y = this.text(c, y - 2, `스토리 ${StoryStore.storyDay}일차  ·  ${dl == null ? '기한 없음' : dl >= 0 ? `실습생 D-${dl}` : `실습생 D+${-dl} 초과`}  ·  항구 신뢰(속초) ${StoryStore.harborRep('gangwon_sokcho')}  ·  바다 평판 ${StoryStore.seaRep >= 0 ? '+' : ''}${StoryStore.seaRep}`, '11px', C_DIM);
    for (const ch of STORY_CHAPTERS) {
      const q = ch.qualification;
      if (!q) continue;
      const held = q.licenseIds.length > 0 && q.licenseIds.every((l) => GameState.hasLicense(l as never));
      const open = StoryStore.chapterOpen(ch.chapter);
      const names = q.licenseIds.map((l) => getLicenseByType(l as never)?.nameKo ?? l).join(' + ') || q.labelKo;
      const g = this.scene.add.graphics();
      if (held) { g.fillStyle(0x7fe0b0, 1); g.fillCircle(12, y + 9, 4.5); }
      else if (open) { g.lineStyle(1.2, 0xe8f4fd, 0.9); g.strokeCircle(12, y + 9, 4.5); }
      else { g.fillStyle(0x6a7a8a, 0.8); g.fillCircle(12, y + 9, 2); }
      c.add(g);
      y = this.text(c, y, `Ch${ch.chapter}  ${names}`, '13px', held ? '#7fe0b0' : open ? C_TEXT : C_LOCK, 24, CONTENT_W - 44, true);
      y = this.text(c, y - 2, `기한 ${q.deadlineKo}  ·  초과 시 ${q.onMissKo}  ·  여는 것 ${q.unlocksKo}`, '10px', '#9fb8cc', 24, CONTENT_W - 44);
    }
    y = this.text(c, y + 2, '실패 엔딩은 없습니다 — 기한을 놓쳐도 비용과 한 시즌 지연만 생깁니다.', '10px', '#6f8fa8');
    this.text(c, y, '※ 본 게임의 \'6개월 실습기간\'은 게임 진행을 위한 설정입니다. 실제 어촌계의 가입 자격·거주기간·가입 절차는 각 어촌계의 정관 및 관련 법령에 따라 다를 수 있습니다.', '10px', '#6f8fa8');
  }
}

/** 조행록 페이지 상세 (도움말·툴팁 공용) */
export function journalPageSummary(p: JournalPageDef): string {
  const sp = FISH_DATABASE.find((f) => f.id === p.speciesId)?.nameKo ?? p.speciesId;
  return `${p.page}장 ${p.labelKo} — ${sp} · ${p.seasons.map((s) => SEASON_LABEL[s].ko).join('·')} · ${p.howKo}`;
}
