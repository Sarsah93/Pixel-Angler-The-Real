/**
 * @file SkillTreePanel.ts
 * @description 스킬 창 (K — 122차 골격 · **188차 재설계**).
 *
 * 188차 사용자 지시:
 *  - 스킬 하나 = **정사각 슬롯**(살짝 둥근 모서리) + 안에 **16x16 손그림 픽셀 아이콘**(`SKILL_ICON_ART`,
 *    정수 배율로 구워 도트가 뭉개지지 않게) + 슬롯 **아래에 이름**.
 *  - 설명 문장은 격자에서 전부 뺐다 → 슬롯에 마우스를 올리면 **호버 팝업**(슬롯 옆, 여유 공간이 큰 쪽으로
 *    펼침 · 화면 안 클램프 · 포인트를 쓰면 그 자리에서 다시 그림). 팝업 = 이름 · 레벨 / 최대 · 하는 일 ·
 *    (잠김 사유) · 맨 아래 「다음 레벨: …」 또는 「최대 레벨」.
 *  - 「다음 레벨」 수치는 core 효과 데이터(`effect.perRank` × 레벨)에서 계산한다 — 문구는 설명문 틀을 그대로 쓴다.
 *  - 아직 안 깬 이야기 조건은 퀘스트 제목을 숨기고 「이야기를 더 진행하면 열린다」로만 말한다(R2).
 *  - 조작을 화면 글로 설명하지 않는다 → 처음 열면 **체험 가이드**(`GuideTour`, id `skill`)가 가르친다.
 *
 * 레이아웃: 좌 = 분야 목록 / 우 = 티어 열(0~3) 트리. 루트에서 `requires` 선으로 확장한다.
 * 노드 상태(테두리 색): 배움(초록) · 배울 수 있음(금색 + 귀퉁이 배우기 단추) · 잠김(회색) ·
 *  조건 잠김(주황) · 숨은 조합(보라 실루엣 — 이름·효과를 숨긴다) · 분야 잠김(어둡게, 열람만).
 * 포인트는 레벨에서 파생(`GameState.skillPointsAvailable`) — 세이브는 랭크만.
 */

import Phaser from 'phaser';
import {
  SKILL_CATEGORIES, skillsOfCategory, getSkillById, skillPrereqsMet, skillUnlockMissing, skillPointsSpent,
  type SkillCategoryId, type SkillDef, type SkillUnlockCond,
  PROF_MAX_LEVEL, profLevel, profNextXp, profScale, profLevelStartXp, type ProfActionKey,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { SKILL_ICON_ART } from '../data/SkillIconArt.js';
import { ensurePixelIcon } from './PixelIcon.js';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture } from './CanvasTextureGuard.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { getLocale } from '../i18n/I18n.js';

const PANEL_W = 1080;
const PANEL_H = 656;
const TREE_W = 260;
const CONTENT_X = TREE_W + 16;
const CONTENT_W = PANEL_W - CONTENT_X - 16;
/** 티어 열 간격 — 4열(0~3)이 트리 폭 안에 들어간다 */
const TIER_DX = 196;
/** 슬롯 이름 줄 최대 폭 (열 간격 − 여백) */
const LABEL_W = TIER_DX - 24;
/** 트리 머리 줄(포인트 · 분야 잠금 안내) 높이 */
const TREE_HEAD_H = 30;
/** 슬롯 크기 2단계 — 열에 노드가 많으면 작은 쪽 (아이콘은 항상 정수 배율) */
const SLOT_BIG = { size: 54, iconScale: 3 } as const;
const SLOT_SMALL = { size: 42, iconScale: 2 } as const;
/** 슬롯 ↔ 이름 사이 · 이름 줄 높이(12px 한글 실측) */
const LABEL_GAP = 5;
const LABEL_H = 17;
/** 같은 열 노드 사이 최소 여백 · 최대 피치 */
const NODE_GAP_MIN = 4;
const ROW_DY_MAX = 104;
/** 배우기 단추 (슬롯 오른쪽 위 귀퉁이에 반쯤 걸친다) */
const PLUS = 18;
/** 호버 팝업 */
const TIP_W = 300;
const TIP_PAD = 12;
/**
 * 팝업 depth — 패널 자식이 아니라 씬 레벨에 둔다. 체험 가이드의 어둠막(1400)·입력 방패(1401) 위,
 * 가이드 테두리(1403)·말풍선(1404) 아래 — 가이드가 팝업 줄을 짚을 때 어둠에 묻히지 않는다.
 * 비인터랙티브라 방패 위에 있어도 입력을 가로채지 않는다.
 */
const TIP_DEPTH = 1402;
const FONT = '"Noto Sans KR", sans-serif';

/**
 * 노드 표시 상태. 130차 추가:
 *  - `condLocked` = 선행 랭크는 됐는데 **해금 조건**(레벨·면허·숙련·이야기)이 남음
 *  - `secret`     = 아직 안 열린 **시너지 히든** — 이름·효과를 감춘다
 */
type NodeState = 'learned' | 'available' | 'locked' | 'catLocked' | 'maxed' | 'condLocked' | 'secret';

export interface SkillTreeConfig {
  onClose: () => void;
}

/** 숙련도 행위 이름 (140차) */
const PROF_ACTION_KO: Record<ProfActionKey, string> = {
  cast: '캐스팅', landing: '랜딩', fight: '파이팅', lureAction: '루어 액션', jig: '지깅', egi: '에깅', surf: '원투', chum: '밑밥 투척',
  forage: '채집', trap: '통발 수거', butcher: '손질', sashimi: '회뜨기', cook: '요리', craft: '제작', ride: '자전거 주행',
  firstaid: '응급처치', haggle: '흥정',
};

/** 패널 로컬 사각형 */
interface LRect { x: number; y: number; w: number; h: number }

type TipFor = { kind: 'skill'; id: string } | { kind: 'points' };

// ═══════════════ 스킬 아이콘 굽기 ═══════════════
/**
 * 스킬 아이콘 텍스처를 (없으면) 굽는다 — `PixelIcon.ensurePixelIcon`과 같은 방식이지만
 * 아트 원본이 `SKILL_ICON_ART`(스킬 id 키)라 따로 둔다. 키 = `sk_<id>_<배율>`.
 * 아트가 없는 id는 공용 스킬 아이콘(`rw_skill`)으로 대신한다.
 */
function ensureSkillIcon(scene: Phaser.Scene, id: string, scale: number): string | null {
  const art = SKILL_ICON_ART[id];
  const s = Math.max(1, Math.round(scale));
  if (!art) return ensurePixelIcon(scene, 'rw_skill', s);
  const texKey = `sk_${id}_${s}`;
  if (scene.textures.exists(texKey)) return texKey;
  const w = art.w * s, h = art.h * s;
  const canvas = scene.textures.createCanvas(texKey, w, h);
  if (!canvas) return null;
  const ctx = canvasContextOf(canvas);
  if (!ctx) { destroyCanvasTexture(canvas); return null; }
  try { ctx.clearRect(0, 0, w, h); } catch { destroyCanvasTexture(canvas); return null; }
  for (let y = 0; y < art.h; y++) {
    const row = art.rows[y] ?? '';
    for (let x = 0; x < art.w; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      const rgb = art.pal[ch];
      if (rgb === undefined) continue;
      ctx.fillStyle = `#${rgb.toString(16).padStart(6, '0')}`;
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  if (!refreshCanvasTexture(canvas, `스킬 아이콘 ${texKey}`)) { destroyCanvasTexture(canvas); return null; }
  return texKey;
}

// ═══════════════ 효과 문구 (설명문 틀 + core 효과 수치) ═══════════════
/** 부호 있는 수치 — `+6%` · `-0.25` · `+3%p` · `+10` */
const SIGNED_NUM = /([+-])(\d+(?:\.\d+)?)(%p|%)?/g;

function fmtNum(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** 현재 언어의 설명 원문 (영어는 데이터 descEn을 그대로 — 사전 왕복 없이) */
function descOf(d: SkillDef): string {
  return getLocale() === 'en' ? d.descEn : d.descKo;
}

/** 설명문을 화면용으로 — 「랭크」를 「레벨」로 (창이 레벨로 말하므로) */
function displayDesc(d: SkillDef): string {
  const s = descOf(d);
  if (getLocale() === 'en') {
    return s.replace(/per rank/g, 'per level').replace(/final rank/g, 'max level').replace(/from rank (\d)/g, 'from level $1');
  }
  return s.replace(/\/랭크/g, '/레벨').replace(/최종 랭크/g, '최대 레벨').replace(/(\d)랭크부터/g, '$1레벨부터');
}

/**
 * 레벨 n에서의 효과 문구.
 *  - 설명문을 ` · `로 끊어, 레벨당 표기(`/랭크` · `per rank`)가 붙은 조각은 부호 수치에 n을 곱하고 표기를 뗀다.
 *  - **설명문의 첫 수치는 core 효과 데이터**(`|effect.perRank| × n`, %면 ×100)로 다시 쓴다 —
 *    설명문의 숫자와 데이터가 어긋나면(문구 오타) 설명문 숫자 × n으로 물러선다.
 *  - 「최종 랭크 = …」 조각은 n이 최대 레벨일 때만 남긴다.
 */
function effectAtLevel(d: SkillDef, n: number): string {
  const en = getLocale() === 'en';
  const marker = en ? /\s*per rank/ : /\/랭크/;
  const finalRe = en ? /^final rank (.+)$/ : /^최종 랭크 = (.+)$/;
  let firstDone = false;
  const out: string[] = [];
  for (const seg0 of descOf(d).split(' · ')) {
    const fin = finalRe.exec(seg0);
    if (fin) {
      if (n >= d.maxRank) out.push(en ? fin[1].charAt(0).toUpperCase() + fin[1].slice(1) : fin[1]);
      continue;
    }
    const perLevel = marker.test(seg0);
    let seg = seg0.replace(new RegExp(marker.source, 'g'), '');
    seg = seg.replace(SIGNED_NUM, (all, sign: string, num: string, unit: string | undefined) => {
      const val = Number(num);
      if (!firstDone) {
        firstDone = true;
        const scale = unit ? 100 : 1;
        const per = Math.abs(d.effect.perRank) * scale;
        if (Math.abs(per - val) < 1e-6) return `${sign}${fmtNum(per * n)}${unit ?? ''}`;
      }
      return perLevel ? `${sign}${fmtNum(val * n)}${unit ?? ''}` : all;
    });
    firstDone = true;
    seg = en ? seg.replace(/from rank (\d)/g, 'from level $1') : seg.replace(/(\d)랭크부터/g, '$1레벨부터');
    out.push(seg.trim());
  }
  return out.filter((x) => x.length > 0).join(' · ');
}

export class SkillTreePanel extends DraggablePanel {
  private category: SkillCategoryId = 'fishing';
  private catC?: Phaser.GameObjects.Container;
  private unlockBanner?: Phaser.GameObjects.Text;
  private treeC?: Phaser.GameObjects.Container;
  private pointsTxt!: Phaser.GameObjects.Text;
  private pointsIcon?: Phaser.GameObjects.Image;
  /** 슬롯(배우기 단추 포함) 로컬 사각형 — 호버 앵커 · 가이드 */
  private slotRects = new Map<string, LRect>();
  /** 분야 목록 각 행 로컬 사각형 */
  private catRects: LRect[] = [];
  // ── 호버 팝업 ──
  private tipC?: Phaser.GameObjects.Container;
  private tipFor: TipFor | null = null;
  /** 팝업 안 「다음 레벨」 줄의 팝업 로컬 사각형 (가이드가 짚는다) */
  private tipNextRect: LRect | null = null;
  /** 가이드가 팝업을 짚는 동안 — 마우스가 떠나도 닫지 않는다 */
  private tipPinned = false;
  /** 마지막으로 연 스킬 팝업 (가이드 핀 고정용) */
  private lastTipSkill: string | null = null;
  // ── 실시간 갱신 ──
  private stateSig = '';
  private sigAcc = 0;
  private readonly updateFn: (time: number, delta: number) => void;

  constructor(scene: Phaser.Scene, cfg: SkillTreeConfig) {
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2, y: Math.max(8, (GAME_HEIGHT - PANEL_H) / 2),
      width: PANEL_W, height: PANEL_H, title: '스킬', onClose: cfg.onClose, dim: false, depth: 892,
    });
    this.buildStatic();
    this.renderCategories();
    this.renderTree();
    this.stateSig = this.computeSig();
    applyScreenFixed(this);
    this.updateFn = (_t, delta) => this.tick(delta);
    scene.events.on('update', this.updateFn);
    maybeStartTour(scene, () => this.buildTour());
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('update', this.updateFn);
    this.hideTip(true);
    super.destroy(fromScene);
  }

  // ═══════════════ 정적 골격 ═══════════════
  private buildStatic(): void {
    const g = this.scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, TREE_W - 12, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(CONTENT_X - 6, top - 4, CONTENT_W + 12, PANEL_H - top - 8, 6);
    this.add(g);
    // 남은 포인트 — 트리 머리 오른쪽. 출처 분해(레벨 · 면허 · 그 밖)는 호버 팝업으로
    const icon = ensurePixelIcon(this.scene, 'rw_skill', 1);
    if (icon) { this.pointsIcon = this.scene.add.image(0, top + 13, icon).setOrigin(0.5); this.add(this.pointsIcon); }
    this.pointsTxt = this.scene.add.text(PANEL_W - 22, top + 4, '', {
      fontFamily: FONT, fontSize: '14px', color: '#ffd98a', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.pointsTxt.setInteractive();
    this.pointsTxt.on('pointerover', () => this.showTip({ kind: 'points' }));
    this.pointsTxt.on('pointerout', () => { if (this.tipFor?.kind === 'points') this.hideTip(); });
    this.add(this.pointsTxt);
    this.refreshPoints();
  }

  private refreshPoints(): void {
    this.pointsTxt.setText(`스킬 포인트 ${GameState.skillPointsAvailable()}`);
    this.pointsIcon?.setX(this.pointsTxt.x - this.pointsTxt.width - 12);
  }

  /** 포인트 표기 로컬 사각형 (아이콘 포함) */
  private pointsRect(): LRect {
    const w = this.pointsTxt.width + 22;
    return { x: this.pointsTxt.x - w, y: this.pointsTxt.y - 2, w: w + 2, h: this.pointsTxt.height + 4 };
  }

  // ═══════════════ 좌측 분야 목록 ═══════════════
  private renderCategories(): void {
    this.catC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.catC = c;
    this.add(c);
    this.catRects = [];
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
        if (this.category === cat.id) return;
        this.category = cat.id;
        this.hideTip(true);
        this.renderCategories(); this.renderTree();
        restoreHandCursor(this.scene);
      });
      const name = this.scene.add.text(24, y + 6, cat.nameKo, { fontFamily: FONT, fontSize: '13px', color: cat.locked ? '#8a97a8' : '#e8f4fd', fontStyle: 'bold' });
      const sub = this.scene.add.text(24, y + 26, cat.descKo, { fontFamily: FONT, fontSize: '10px', color: cat.locked ? '#8a97a8' : '#8fb4cc' });
      clampTextWidth(name, TREE_W - 90);
      clampTextWidth(sub, TREE_W - 50);
      const cnt = this.scene.add.text(TREE_W - 18, y + 8, `${learned}/${list.length}`, { fontFamily: FONT, fontSize: '11px', color: '#7fe0b0' }).setOrigin(1, 0);
      c.add([bg, name, sub, cnt]);
      this.catRects.push({ x: 14, y, w: TREE_W - 24, h: 46 });
      y += 52;
    }
    applyScreenFixed(this);
  }

  // ═══════════════ 우측 트리 ═══════════════
  private nodeState(def: SkillDef): NodeState {
    const cat = SKILL_CATEGORIES.find((c) => c.id === def.category);
    const ranks = GameState.skillRanks;
    const r = ranks[def.id] ?? 0;
    if (cat?.locked || def.pendingSystem) return 'catLocked';   // 222차 — 아직 없는 시스템의 스킬도 같은 잠금
    if (r >= def.maxRank) return 'maxed';
    if (def.hidden) return 'secret';
    if (skillPrereqsMet(def, ranks) && skillUnlockMissing(def, GameState.skillUnlockCtxPublic).length > 0) return 'condLocked';
    if (GameState.canLearnSkill(def.id).ok) return 'available';
    return r > 0 ? 'learned' : 'locked';
  }

  /** 트리 영역 로컬 세로 범위 */
  private treeTop(): number { return this.contentTop + TREE_HEAD_H; }
  private treeAvailH(): number { return PANEL_H - 14 - this.treeTop(); }

  /** 분야의 슬롯 크기 — 가장 붐비는 열이 들어가면 큰 슬롯 */
  private slotSpec(list: SkillDef[]): { size: number; iconScale: number } {
    const perTier = new Map<number, number>();
    for (const d of list) perTier.set(d.tier, (perTier.get(d.tier) ?? 0) + 1);
    const n = Math.max(1, ...perTier.values());
    const cell = SLOT_BIG.size + LABEL_GAP + LABEL_H;
    return n * cell + (n - 1) * NODE_GAP_MIN <= this.treeAvailH() ? SLOT_BIG : SLOT_SMALL;
  }

  /** 슬롯 좌상단(로컬) — 열 안 가운데 정렬, 같은 열은 세로로 고르게 */
  private nodePos(def: SkillDef, list: SkillDef[], size: number): { x: number; y: number } {
    const sameTier = list.filter((s) => s.tier === def.tier);
    const idx = sameTier.indexOf(def);
    const n = sameTier.length;
    const cell = size + LABEL_GAP + LABEL_H;
    const availH = this.treeAvailH();
    const dy = n <= 1 ? 0 : Math.min(ROW_DY_MAX, Math.floor((availH - cell) / (n - 1)));
    const colH = (n - 1) * dy + cell;
    const y0 = this.treeTop() + Math.max(0, Math.floor((availH - colH) / 2));
    const colCx = CONTENT_X + 14 + def.tier * TIER_DX + (TIER_DX - 24) / 2;
    return { x: Math.round(colCx - size / 2), y: y0 + idx * dy };
  }

  private renderTree(): void {
    this.treeC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.treeC = c;
    this.add(c);
    this.slotRects.clear();
    const cat = SKILL_CATEGORIES.find((x) => x.id === this.category)!;
    const list = skillsOfCategory(this.category);
    const ranks = GameState.skillRanks;
    if (cat.locked && cat.lockedNoteKo) {
      const note = this.scene.add.text(CONTENT_X + 6, this.contentTop + 6, cat.lockedNoteKo, { fontFamily: FONT, fontSize: '11px', color: '#c88a5a' });
      clampTextWidth(note, CONTENT_W - this.pointsRect().w - 30);
      c.add(note);
    }
    const spec = this.slotSpec(list);
    const S = spec.size;
    const pos = new Map<string, { x: number; y: number }>();
    for (const d of list) pos.set(d.id, this.nodePos(d, list, S));

    // 연결선 (슬롯보다 먼저) — 선행을 채웠으면 초록
    const lines = this.scene.add.graphics();
    c.add(lines);
    for (const d of list) {
      const to = pos.get(d.id)!;
      for (const q of d.requires) {
        const from = pos.get(q.id);
        if (!from) continue;
        const met = (ranks[q.id] ?? 0) >= q.rank;
        lines.lineStyle(2, met ? 0x4af2a1 : 0x2a4a63, met ? 0.9 : 0.7);
        const x1 = from.x + S, y1 = from.y + S / 2, x2 = to.x, y2 = to.y + S / 2;
        // 꺾는 자리 = **대상 열 바로 앞 통로** — 열을 건너뛰는 선이 중간 열 슬롯 한가운데로 세로로 지나가지 않게
        const mx = Math.round(x2 - (TIER_DX - S) / 2);
        lines.beginPath(); lines.moveTo(x1, y1); lines.lineTo(mx, y1); lines.lineTo(mx, y2); lines.lineTo(x2, y2); lines.strokePath();
      }
    }

    for (const d of list) {
      const p = pos.get(d.id)!;
      const st = this.nodeState(d);
      const r = ranks[d.id] ?? 0;
      const secret = st === 'secret';
      const dim = st === 'locked' || st === 'condLocked' || st === 'catLocked';
      const fill = st === 'maxed' || st === 'learned' ? 0x123a2c
        : st === 'available' ? 0x2a3a1c
          : secret ? 0x1a1430 : 0x121c2a;
      const stroke = st === 'maxed' ? 0x4af2a1 : st === 'learned' ? 0x3fb88a
        : st === 'available' ? 0xffd257
          : secret ? 0x7a5cc0 : st === 'condLocked' ? 0xc88a5a : st === 'catLocked' ? 0x2a3a4a : 0x3a4c60;
      // 정사각 슬롯 (살짝 둥근 모서리)
      const g = this.scene.add.graphics();
      g.fillStyle(fill, st === 'catLocked' ? 0.6 : 0.96);
      g.fillRoundedRect(p.x, p.y, S, S, 6);
      g.lineStyle(2, stroke, 1);
      g.strokeRoundedRect(p.x, p.y, S, S, 6);
      c.add(g);
      // 아이콘 — 정수 배율로 구워 스케일 없이 놓는다
      const tex = ensureSkillIcon(this.scene, d.id, spec.iconScale);
      if (tex) {
        const img = this.scene.add.image(p.x + S / 2, p.y + S / 2, tex).setOrigin(0.5);
        if (secret) img.setTintFill(0x4a3a78);
        else if (dim) img.setAlpha(0.42);
        c.add(img);
      }
      // 222차 — 아직 없는 시스템에 걸린 스킬: 오른쪽 위에 픽셀 자물쇠(2배 정수 배율)
      if (d.pendingSystem) {
        const k = 2, lx = p.x + S - 6 * k - 4, ly = p.y + 4;
        const lg = this.scene.add.graphics();
        const px = (x: number, y: number, w: number, h: number, col: number): void => { lg.fillStyle(col, 1); lg.fillRect(lx + x * k, ly + y * k, w * k, h * k); };
        px(1, 0, 4, 1, 0xd8d0c0); px(0, 1, 1, 2, 0xd8d0c0); px(5, 1, 1, 2, 0xd8d0c0);   // 고리
        px(0, 3, 6, 4, 0xc88a5a); px(0, 3, 6, 1, 0xe0a870);                              // 몸통 · 윗면 밝게
        px(2, 4, 2, 2, 0x3a2414);                                                         // 열쇠 구멍
        c.add(lg);
      }
      // 레벨 눈금 — 슬롯 아래 테두리에 걸친 작은 칸 (배운 만큼 채움)
      if (!secret) {
        const pip = S >= SLOT_BIG.size ? 5 : 4;
        const gap = 2;
        const total = d.maxRank * pip + (d.maxRank - 1) * gap;
        const px0 = Math.round(p.x + (S - total) / 2);
        const py = p.y + S - Math.ceil(pip / 2);
        const pg = this.scene.add.graphics();
        pg.fillStyle(0x0b1620, 1);
        pg.fillRect(px0 - 2, py - 2, total + 4, pip + 4);
        for (let i = 0; i < d.maxRank; i++) {
          pg.fillStyle(i < r ? 0x7fe0b0 : 0x2c3e50, 1);
          pg.fillRect(px0 + i * (pip + gap), py, pip, pip);
        }
        c.add(pg);
      }
      // 이름 — 슬롯 아래
      const name = this.scene.add.text(p.x + S / 2, p.y + S + LABEL_GAP, secret ? '???' : d.nameKo, {
        fontFamily: FONT, fontSize: '12px',
        color: secret ? '#b49ae8' : dim ? '#8a97a8' : r > 0 ? '#bff2d8' : '#e8f4fd',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      clampTextWidth(name, LABEL_W);
      // 이름 뒤 바탕 — 열을 건너뛰는 연결선이 글자 위로 지나가지 않게 가린다
      const nb = this.scene.add.graphics();
      nb.fillStyle(0x0c1d2e, 0.94);
      nb.fillRect(Math.round(name.x - name.width / 2 - 3), name.y - 1, Math.round(name.width + 6), Math.round(name.height + 1));
      c.add([nb, name]);
      // 호버 히트 (슬롯 + 이름)
      const hit = this.scene.add.rectangle(p.x, p.y, S, S + LABEL_GAP + LABEL_H, 0xffffff, 0.001).setOrigin(0, 0);
      hit.setInteractive();
      hit.on('pointerover', () => this.showTip({ kind: 'skill', id: d.id }));
      hit.on('pointerout', () => this.maybeHideSkillTip(d.id));
      c.add(hit);
      const rect: LRect = { x: p.x, y: p.y, w: S, h: S + LABEL_GAP + LABEL_H };
      // 배우기 단추 — 지금 배울 수 있을 때만, 슬롯 오른쪽 위 귀퉁이
      if (GameState.canLearnSkill(d.id).ok) {
        const bx = p.x + S - PLUS / 2 + 3, by = p.y - PLUS / 2 + 1;
        const pb = this.scene.add.graphics();
        pb.fillStyle(0x0b1620, 1); pb.fillRoundedRect(bx - 1, by - 1, PLUS + 2, PLUS + 2, 4);
        pb.fillStyle(0xffd257, 1); pb.fillRoundedRect(bx, by, PLUS, PLUS, 3);
        pb.fillStyle(0x1a2a14, 1);
        pb.fillRect(bx + 4, by + PLUS / 2 - 1, PLUS - 8, 3);
        pb.fillRect(bx + PLUS / 2 - 1, by + 4, 3, PLUS - 8);
        c.add(pb);
        const pHit = this.scene.add.rectangle(bx - 2, by - 2, PLUS + 4, PLUS + 4, 0xffffff, 0.001).setOrigin(0, 0);
        pHit.setInteractive({ useHandCursor: true });
        pHit.on('pointerover', () => { pb.setAlpha(0.8); this.showTip({ kind: 'skill', id: d.id }); });
        pHit.on('pointerout', () => { pb.setAlpha(1); this.maybeHideSkillTip(d.id); });
        pHit.on('pointerdown', () => this.learn(d.id));
        c.add(pHit);
        rect.y = by - 2; rect.h += p.y - rect.y;
        rect.w = bx + PLUS + 2 - p.x;
      }
      this.slotRects.set(d.id, rect);
    }
    enforceTextBounds(c, PANEL_W - 10, 'SkillTreePanel');
    applyScreenFixed(this);
  }

  /** 한 레벨 배우기 — 실패해도 조용히(단추는 배울 수 있을 때만 보인다) */
  private learn(id: string): void {
    if (!GameState.learnSkill(id)) return;
    // 130차 (e) — 이번 습득으로 시너지가 열렸으면 그 자리에서 알린다
    const opened = GameState.takeRecentHiddenUnlocks();
    if (opened.length > 0) this.flashUnlock(`시너지 해금 — ${opened.map((o) => o.nameKo).join(' · ')}`);
    this.refreshAll();
    restoreHandCursor(this.scene);
  }

  /** 포인트 · 분야 · 트리 · 열린 팝업을 지금 상태로 다시 그린다 */
  private refreshAll(): void {
    this.refreshPoints();
    this.renderCategories();
    this.renderTree();
    this.stateSig = this.computeSig();
    if (this.tipFor) this.showTip(this.tipFor);
  }

  /** 시너지 해금 배너 — 3초 뒤 사라진다 */
  private flashUnlock(msg: string): void {
    this.unlockBanner?.destroy();
    const t = this.scene.add.text(CONTENT_X + CONTENT_W / 2, this.contentTop + 4, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#0b1620', fontStyle: 'bold',
      backgroundColor: '#b49ae8', padding: { x: 10, y: 3 },
    }).setOrigin(0.5, 0);
    clampTextWidth(t, CONTENT_W - this.pointsRect().w * 2 - 40);
    this.unlockBanner = t;
    this.add(t);
    applyScreenFixed(this);
    this.scene.time.delayedCall(3000, () => { t.destroy(); if (this.unlockBanner === t) this.unlockBanner = undefined; });
  }

  // ═══════════════ 실시간 갱신 ═══════════════
  /** 패널이 그리는 상태의 서명 — 바뀌면 다시 그린다(레벨업 · 면허 · 다른 경로의 습득) */
  private computeSig(): string {
    const ranks = GameState.skillRanks;
    const rk = Object.keys(ranks).sort().map((k) => `${k}:${ranks[k]}`).join(',');
    const prof = this.tipFor?.kind === 'skill' ? GameState.profXp(this.tipFor.id) : 0;
    return `${getLocale()}|${GameState.skillPointsTotal()}|${GameState.player.level ?? 1}|${GameState.heldLicenseTypes.join(',')}|${rk}|${prof}`;
  }

  private tick(delta: number): void {
    if (!this.active) return;
    // 팝업은 패널을 끌어도 슬롯을 따라간다 · 마우스가 슬롯을 떠났으면 닫는다(재생성된 슬롯은 out이 안 올 수 있다)
    if (this.tipC && this.tipFor) {
      const a = this.tipAnchor(this.tipFor);
      const p = this.scene.input.activePointer;
      if (!this.tipPinned && a && !(p.x >= a.x - 2 && p.x <= a.x + a.width + 2 && p.y >= a.y - 2 && p.y <= a.y + a.height + 2)) {
        this.hideTip();
      } else if (a) {
        this.placeTip(a);
      }
    }
    this.sigAcc += delta;
    if (this.sigAcc < 400) return;
    this.sigAcc = 0;
    const sig = this.computeSig();
    if (sig !== this.stateSig) this.refreshAll();
  }

  // ═══════════════ 호버 팝업 ═══════════════
  /** 팝업 앵커 (화면 좌표) */
  private tipAnchor(f: TipFor): Phaser.Geom.Rectangle | null {
    const r = f.kind === 'points' ? this.pointsRect() : this.slotRects.get(f.id);
    return r ? this.localRect(r.x, r.y, r.w, r.h) : null;
  }

  private maybeHideSkillTip(id: string): void {
    if (this.tipFor?.kind === 'skill' && this.tipFor.id === id) this.hideTip();
  }

  private hideTip(force = false): void {
    if (this.tipPinned && !force) return;
    this.tipC?.destroy();
    this.tipC = undefined;
    this.tipFor = null;
    this.tipNextRect = null;
    if (force) this.tipPinned = false;
  }

  private showTip(f: TipFor): void {
    const anchor = this.tipAnchor(f);
    if (!anchor) { this.hideTip(true); return; }
    this.tipC?.destroy();
    this.tipNextRect = null;
    this.tipFor = f;
    const c = this.scene.add.container(0, 0).setDepth(TIP_DEPTH).setScrollFactor(0);
    this.tipC = c;
    const bg = this.scene.add.graphics();
    c.add(bg);
    const innerW = TIP_W - TIP_PAD * 2;
    let y = TIP_PAD;
    const addText = (s: string, size: number, color: string, bold = false, gap = 4): Phaser.GameObjects.Text => {
      const t = this.scene.add.text(TIP_PAD, y, s, {
        fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
        wordWrap: { width: innerW, useAdvancedWrap: true }, lineSpacing: 2,
      });
      c.add(t);
      y += t.height + gap;
      return t;
    };
    let sepY = -1;
    if (f.kind === 'points') {
      const total = GameState.skillPointsTotal();
      const lic = GameState.skillPointsFromLicenses();
      const lvPts = Math.max(0, total - lic - GameState.bonusSkillPoints);
      addText('스킬 포인트', 15, '#ffd98a', true, 6);
      addText(`남은 포인트 ${GameState.skillPointsAvailable()}`, 13, '#e8f4fd');
      addText(`쓴 포인트 ${skillPointsSpent(GameState.skillRanks)}`, 13, '#a8c8e8', false, 8);
      addText(`레벨로 얻은 포인트 ${lvPts}`, 12, '#8fb4cc');
      addText(`면허로 얻은 포인트 ${lic}`, 12, '#8fb4cc');
      if (GameState.bonusSkillPoints > 0) addText(`그 밖에 얻은 포인트 ${GameState.bonusSkillPoints}`, 12, '#8fb4cc');
    } else {
      const d = getSkillById(f.id);
      if (!d) { this.hideTip(true); return; }
      this.lastTipSkill = d.id;
      const st = this.nodeState(d);
      const secret = st === 'secret';
      const r = GameState.skillRank(d.id);
      addText(secret ? '???' : d.nameKo, 15, secret ? '#b49ae8' : '#7fe0b0', true, 2);
      addText(`레벨 ${r} / ${d.maxRank}`, 12, '#ffd98a', false, 8);
      if (secret) {
        addText('함께 익혀야 할 스킬들을 모두 배우면 저절로 열린다. 포인트는 들지 않는다.', 12, '#d8ccf0', false, 6);
      } else {
        addText(displayDesc(d), 13, '#e8f4fd', false, 6);
        if (!d.wired && !d.pendingSystem) addText('준비 중인 스킬이다 — 지금 배워 두면 효과는 나중에 난다.', 11, '#a89a80', false, 6);
        this.addProficiencyLines(d, r, addText, c, () => y, (ny) => { y = ny; });
        // 잠김 사유 — 이야기 조건은 제목을 숨긴다(R2)
        const cat = SKILL_CATEGORIES.find((x) => x.id === d.category);
        if (cat?.locked) {
          addText('이 분야는 아직 배울 수 없다.', 12, '#c88a5a', false, 6);
        } else if (d.pendingSystem) {
          // 222차 — 아직 없는 일에 걸린 스킬: 배울 수 없고, 무엇이 생기면 열리는지만 말한다
          addText(`아직 배울 수 없다 — ${d.pendingSystem.ko} 열린다.`, 12, '#c88a5a', false, 6);
        } else if (r < d.maxRank) {
          const ranks = GameState.skillRanks;
          const pre = d.requires.filter((q) => (ranks[q.id] ?? 0) < q.rank);
          if (pre.length > 0) {
            addText(`먼저 배울 스킬: ${pre.map((q) => `${getSkillById(q.id)?.nameKo ?? ''} Lv.${q.rank}`).join(', ')}`, 12, '#ffb45a', false, 6);
          }
          const missing = skillUnlockMissing(d, GameState.skillUnlockCtxPublic);
          const conds = this.describeConds(missing);
          if (conds) addText(`열리는 조건: ${conds}`, 12, '#ffb45a', false, 6);
          // 이야기 조건은 무엇인지 말하지 않는다(R2 — 안 깬 퀘스트 제목 노출 금지)
          if (missing.some((m) => m.kind === 'quest')) addText('이야기를 더 진행하면 열린다.', 12, '#ffb45a', false, 6);
          if (pre.length === 0 && missing.length === 0 && !d.hidden && GameState.skillPointsAvailable() < d.costPerRank) {
            addText('포인트가 모자란다.', 12, '#ffb45a', false, 6);
          }
          if (!d.hidden && d.costPerRank > 1) addText(`필요 포인트 ${d.costPerRank}`, 11, '#8fb4cc', false, 6);
        }
      }
      // 맨 아래 — 다음 레벨 / 최대 레벨
      y += 2;
      sepY = y;
      y += 8;
      const next = r >= d.maxRank ? '최대 레벨'
        : secret ? '다음 레벨: ???'
          : `다음 레벨: ${effectAtLevel(d, r + 1)}`;
      const nt = addText(next, 13, r >= d.maxRank ? '#7fe0b0' : '#ffd257', true, 0);
      this.tipNextRect = { x: TIP_PAD - 4, y: nt.y - 3, w: innerW + 8, h: nt.height + 6 };
    }
    const h = Math.round(y + TIP_PAD);
    bg.fillStyle(0x0b1a28, 0.97);
    bg.fillRoundedRect(0, 0, TIP_W, h, 6);
    bg.lineStyle(1.5, 0x5cd0ff, 0.9);
    bg.strokeRoundedRect(0, 0, TIP_W, h, 6);
    if (sepY >= 0) { bg.lineStyle(1, 0x2c5878, 1); bg.lineBetween(TIP_PAD, sepY, TIP_W - TIP_PAD, sepY); }
    c.setSize(TIP_W, h);
    enforceTextBounds(c, TIP_W - TIP_PAD + 2, 'SkillTreePanel.tip');
    this.placeTip(anchor);
  }

  /** 숙련도(140차) — 배워도 손에 익혀야 효과가 나는 스킬 */
  private addProficiencyLines(
    d: SkillDef, r: number,
    addText: (s: string, size: number, color: string, bold?: boolean, gap?: number) => Phaser.GameObjects.Text,
    c: Phaser.GameObjects.Container, getY: () => number, setY: (y: number) => void,
  ): void {
    if (!d.proficiency) return;
    const acts = d.proficiency.actions.map((a) => PROF_ACTION_KO[a] ?? a).join('·');
    if (r <= 0) {
      addText(`배운 뒤 ${acts}(으)로 손에 익혀야 효과가 난다.`, 12, '#a0b4c8', false, 6);
      return;
    }
    const xp = GameState.profXp(d.id), lv = profLevel(xp), next = profNextXp(xp);
    addText(`숙련 ${lv} / ${PROF_MAX_LEVEL} · 효과 ×${profScale(lv).toFixed(2)}`, 12, lv === 0 ? '#e0a060' : '#8fd8a8', false, 3);
    if (next !== null) {
      const bx = TIP_PAD, by = getY(), bw = TIP_W - TIP_PAD * 2;
      const frac = Math.max(0, Math.min(1, (xp - profLevelStartXp(lv)) / Math.max(1, next - profLevelStartXp(lv))));
      const g = this.scene.add.graphics();
      g.fillStyle(0x0e1c2a, 1); g.fillRect(bx, by, bw, 5);
      g.fillStyle(0x8fd8a8, 1); g.fillRect(bx, by, Math.round(bw * frac), 5);
      g.lineStyle(1, 0x2c5878, 1); g.strokeRect(bx, by, bw, 5);
      c.add(g);
      setY(by + 9);
    }
    addText(`손에 익히는 법: ${acts}`, 11, '#8fb4cc', false, 6);
  }

  /** 해금 조건 문구 (레벨 · 면허 · 분야 누적) — 이야기 조건은 빼고 따로 말한다(R2) */
  private describeConds(missing: SkillUnlockCond[]): string {
    return missing.filter((m) => m.kind !== 'quest').map((m) => GameState.describeUnlock(m)).join(' · ');
  }

  /** 팝업을 앵커 옆 여유 공간이 큰 쪽으로 펼치고 화면 안으로 클램프 (RegionHud.anchorTip 전례) */
  private placeTip(a: Phaser.Geom.Rectangle): void {
    const c = this.tipC;
    if (!c) return;
    const gap = 8;
    const w = TIP_W, h = c.height;
    const roomR = GAME_WIDTH - a.right - gap;
    const roomL = a.x - gap;
    let x: number, y: number;
    if (roomR >= w || roomL >= w) {
      x = roomR >= roomL ? a.right + gap : a.x - gap - w;
      y = a.y;
      if (y + h > GAME_HEIGHT - 4) y = a.bottom - h;
    } else {
      // 좌우 어디에도 안 들어가면 위/아래 중 넓은 쪽
      x = a.centerX - w / 2;
      y = GAME_HEIGHT - a.bottom >= a.y ? a.bottom + gap : a.y - gap - h;
    }
    x = Math.min(Math.max(4, x), GAME_WIDTH - w - 4);
    y = Math.min(Math.max(4, y), Math.max(4, GAME_HEIGHT - h - 4));
    c.setPosition(Math.round(x), Math.round(y));
  }

  // ═══════════════ 체험 가이드 (188차) ═══════════════
  /** 트리 영역 화면 사각형 */
  private treeScreenRect(): Phaser.Geom.Rectangle {
    return this.localRect(CONTENT_X - 6, this.treeTop() - 4, CONTENT_W + 12, PANEL_H - this.treeTop() - 8);
  }

  private catScreenRect(): Phaser.Geom.Rectangle {
    const first = this.catRects[0], last = this.catRects[this.catRects.length - 1];
    if (!first || !last) return this.localRect(8, this.contentTop, TREE_W - 12, 100);
    return this.localRect(first.x, first.y, first.w, last.y + last.h - first.y);
  }

  /** 지금 보이는 분야에 배울 수 있는 스킬이 있는가 */
  private learnableHere(): boolean {
    return skillsOfCategory(this.category).some((d) => GameState.canLearnSkill(d.id).ok);
  }

  private buildTour(): TourOptions {
    let startAvail = 0;
    let learned = false;
    return {
      id: 'skill',
      alive: () => this.active && this.visible,
      steps: [
        {
          text: '스킬 창이다. 낚시하고 줍고 사고팔다 보면 레벨이 오르고, 레벨이 오를 때마다 스킬을 하나씩 더 배울 수 있다.',
          target: () => this.panelBounds(),
        },
        {
          text: '왼쪽은 분야다. 분야를 고르면 그 분야의 스킬이 오른쪽에 펼쳐진다. 선으로 이어진 스킬은 앞의 것을 배워야 열린다.',
          target: () => this.catScreenRect(),
        },
        {
          text: '스킬 칸 위에 마우스를 올려 보자. 그 스킬이 무엇을 하는지 바로 옆에 뜬다.',
          target: () => this.treeScreenRect(),
          wait: () => this.tipFor?.kind === 'skill',
        },
        {
          text: '맨 아래 줄은 한 레벨 더 올리면 어떻게 달라지는지다. 끝까지 배운 스킬에는 「최대 레벨」이라고 뜬다.',
          onEnter: () => {
            if (this.tipFor?.kind !== 'skill' && this.lastTipSkill) this.showTip({ kind: 'skill', id: this.lastTipSkill });
            this.tipPinned = this.tipFor?.kind === 'skill';
          },
          target: () => {
            const c = this.tipC, r = this.tipNextRect;
            return c && r ? new Phaser.Geom.Rectangle(c.x + r.x, c.y + r.y, r.w, r.h) : this.treeScreenRect();
          },
        },
        {
          text: '남은 스킬 포인트는 여기에 보인다. 레벨이 오르거나 면허를 따면 늘어난다.',
          onEnter: () => { this.tipPinned = false; this.hideTip(true); },
          target: () => { const r = this.pointsRect(); return this.localRect(r.x, r.y, r.w, r.h); },
        },
        {
          text: '금색 테두리 칸은 지금 배울 수 있는 스킬이다. 칸 귀퉁이의 단추를 눌러 하나 배워 보자.',
          skipIf: () => !this.learnableHere(),
          onEnter: () => { startAvail = GameState.skillPointsAvailable(); },
          target: () => this.treeScreenRect(),
          wait: () => { learned = GameState.skillPointsAvailable() < startAvail; return learned; },
        },
        {
          text: '포인트가 생기면 배울 수 있는 칸에 금색 테두리와 단추가 나타난다. 그 단추를 누르면 스킬을 배운다.',
          skipIf: () => learned || this.learnableHere(),
          target: () => this.treeScreenRect(),
        },
      ],
    };
  }
}
