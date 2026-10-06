/**
 * @file CraftBoard.ts
 * @description 제작 보드 (129차 P7 → 222차 재작성) — 종류 탭 › 왼쪽 도면 목록 › 오른쪽 상세 · 수량 · 진행
 *
 * **U 창 '제작' 탭(맨손)** 과 **작업대 [F] 창**이 이 컴포넌트 하나를 공유한다(station만 다르다).
 *
 * 222차 구성(사용자 지정):
 *  - 위: 종류 탭(전체 + 이 자리에서 만드는 갈래만) · 오른쪽 끝 「손재주」(호버 = 분야별 숙련) · 「만들 수 있는 것만」.
 *  - 왼쪽: 도면 목록(초록 = 지금 만들 수 있음 · 노랑 = 재료 모자람 · 회색 = 조건 미달). 보이는 행만 그린다 + 휠.
 *  - 오른쪽: 결과 그림 · 이름 · 갈래 · 위치 · 설명 · 조건(레벨 · 스킬 · 공구) · 재료(그림 · 가진 수/필요 수) ·
 *    수량(−/+ · 숫자 칸 클릭 = 직접 입력 · 최대) · 성공률 · 실패 시 잃을 확률 · 걸리는 시간 · 얻는 것 ·
 *    손 상태 · 진행 막대 · [제작하기] [중지] [취소] · 보관함.
 *  - 진행 막대 · 남은 시간은 0.25초마다 그 자리만 고친다(전체를 다시 그리면 호버 · 입력이 끊긴다).
 *
 * UI 규칙(AGENTS §4): 이모지 · 텍스트 장식 금지 · 조작 안내 문구 금지(R11 — 첫 열기 가이드 `craft_v2`).
 */

import Phaser from 'phaser';
import {
  CRAFT_GROUP_LABEL, CRAFT_GROUP_ORDER, CRAFT_STATION_LABEL, CRAFT_MASTERY_MAX, craftMasteryNextXp, getSkillById,
  type CraftBlueprint, type CraftStation, type CraftGroup, type CraftMaterial,
} from '@tra/core';
import { CraftingStore, laneOf, type CraftCheck } from '../store/CraftingStore.js';
import { GameState } from '../store/GameState.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { craftOutputTemplate } from '../data/CraftOutputs.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth } from './TextFit.js';
import { TextInput } from './TextInput.js';
import { maybeStartTour, type TourOptions } from './GuideTour.js';
import { t, getLocale } from '../i18n/I18n.js';

const FONT = '"Noto Sans KR", sans-serif';
const ROW_H = 28;
const TAB_H = 24;

export interface CraftBoardOpts {
  station: CraftStation;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 보드 좌표(컨테이너 로컬) → 화면 좌표 원점(가이드 하이라이트용) */
  origin?: () => { x: number; y: number };
  /** 제작 시작 · 끝 · 보관함 — 호출측이 인벤토리 갱신 이벤트를 쏜다 */
  onCrafted?: () => void;
  /** 창이 살아 있는가(가이드) */
  alive?: () => boolean;
}

/** 시간 글자 — 1분 20초 / 45초 / 1시간 5분 */
export function durText(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  if (getLocale() === 'en') return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${r}s` : `${r}s`;
  return h > 0 ? `${h}시간 ${m}분` : m > 0 ? (r > 0 ? `${m}분 ${r}초` : `${m}분`) : `${r}초`;
}

/** 재료 그림용 아이템 모양 — 가방에 있으면 그것, 없으면 상점 · 산출 템플릿 */
function materialLook(m: CraftMaterial): { icon: string; iconTexture?: string; speciesId?: string } {
  if (m.itemId) {
    const inv = InventoryStore.find(m.itemId);
    if (inv) return inv;
    const tpl = craftOutputTemplate(m.itemId);
    if (tpl) return tpl;
  }
  if (m.speciesId) return { icon: '', speciesId: m.speciesId };
  return { icon: '' };
}

/**
 * 컨테이너 하나에 제작 보드를 그린다. 상태(종류 · 선택 · 수량 · 스크롤)는 인스턴스가 갖고,
 * `render()`가 컨테이너를 비우고 다시 그린다.
 */
export class CraftBoard {
  private selectedId: string | null = null;
  private group: CraftGroup | 'all' = 'all';
  private onlyReady = false;
  private qty = 1;
  private scrollRow = 0;
  private status = '';
  private statusColor = '#4af2a1';
  private wheelHandler: ((p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void) | null = null;
  private qtyInput?: TextInput;
  private unsub?: () => void;
  private timer?: Phaser.Time.TimerEvent;
  /** 진행 막대 — 매 0.25초 그 자리만 고친다 */
  private prog: { g: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; x: number; y: number; w: number; jobId: string; done: number } | null = null;
  private dexTip?: Phaser.GameObjects.Container;
  /** 가이드용 자리(보드 로컬) */
  private rects: Record<string, Phaser.Geom.Rectangle> = {};
  private alive = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly container: Phaser.GameObjects.Container,
    private readonly o: CraftBoardOpts,
  ) {
    this.unsub = CraftingStore.onChange(() => { if (this.alive) this.redraw(); });
    this.timer = scene.time.addEvent({ delay: 250, loop: true, callback: () => this.updateProgress() });
    maybeStartTour(scene, () => this.buildTour());
  }

  /** 씬 레벨 핸들러 · 타이머 · 입력 해제 — 호출측 destroy에서 반드시 부른다 */
  destroy(): void {
    this.alive = false;
    if (this.wheelHandler) { this.scene.input.off('wheel', this.wheelHandler); this.wheelHandler = null; }
    this.qtyInput?.close();
    this.qtyInput = undefined;
    this.unsub?.();
    this.timer?.remove();
    this.dexTip?.destroy();
  }

  private get lane() { return laneOf(this.o.station); }

  render(): void {
    const { x, y, w, h } = this.o;
    this.prog = null;
    const all = CraftingStore.blueprints(this.o.station);
    const groups = CRAFT_GROUP_ORDER.filter((g) => all.some((b) => b.group === g));
    if (this.group !== 'all' && !groups.includes(this.group)) this.group = 'all';
    this.renderTabs(groups, x, y, w);

    const top = y + TAB_H + 10;
    const bodyH = h - (top - y);
    const listW = Math.min(300, Math.round(w * 0.32));
    const detX = x + listW + 12;
    const detW = w - listW - 12;

    // 갈래 순서 → 레벨 순 (도면 DB 순서대로면 같은 갈래 머리가 두 번 나온다)
    const gi = (b: CraftBlueprint): number => CRAFT_GROUP_ORDER.indexOf(b.group);
    let bps = all.filter((b) => this.group === 'all' || b.group === this.group)
      .sort((p, q) => gi(p) - gi(q) || (p.minLevel ?? 0) - (q.minLevel ?? 0));
    if (this.onlyReady) bps = bps.filter((b) => CraftingStore.check(b, 1, this.o.station).ok);
    if (!bps.some((b) => b.id === this.selectedId)) this.selectedId = bps[0]?.id ?? null;

    this.drawFrame(x, top, listW, bodyH);
    this.drawFrame(detX, top, detW, bodyH);
    this.renderList(bps, x, top, listW, bodyH);
    const sel = bps.find((b) => b.id === this.selectedId) ?? null;
    this.renderDetail(sel, detX, top, detW, bodyH);
    this.rects.list = new Phaser.Geom.Rectangle(x, top, listW, bodyH);
    this.rects.detail = new Phaser.Geom.Rectangle(detX, top, detW, bodyH);
  }

  // ── 위: 종류 탭 · 손재주 · 만들 수 있는 것만 ─────────────
  private renderTabs(groups: CraftGroup[], x: number, y: number, w: number): void {
    let cx = x;
    const chips: (CraftGroup | 'all')[] = ['all', ...groups];
    for (const c of chips) {
      const on = this.group === c;
      const label = this.scene.add.text(0, 0, c === 'all' ? '전체' : CRAFT_GROUP_LABEL[c].ko, {
        fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: on ? '#0b1f14' : '#9fc0d4',
      }).setOrigin(0.5);
      const cw = Math.ceil(label.width) + 18;
      const g = this.scene.add.graphics();
      g.fillStyle(on ? 0x4af2a1 : 0x0e1c2d, on ? 0.95 : 0.9); g.fillRoundedRect(cx, y, cw, TAB_H, 11);
      g.lineStyle(1, on ? 0x4af2a1 : 0x2a5070, 0.95); g.strokeRoundedRect(cx, y, cw, TAB_H, 11);
      label.setPosition(cx + cw / 2, y + TAB_H / 2);
      const hit = this.scene.add.rectangle(cx + cw / 2, y + TAB_H / 2, cw, TAB_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.group = c; this.scrollRow = 0; this.redraw(); });
      this.container.add([g, label, hit]);
      cx += cw + 5;
    }
    this.rects.tabs = new Phaser.Geom.Rectangle(x, y, cx - x, TAB_H);

    // 오른쪽: 「만들 수 있는 것만」 칸 · 손재주
    const rx = x + w;
    const box = 14;
    const ready = this.scene.add.text(rx, y + TAB_H / 2, '만들 수 있는 것만', {
      fontFamily: FONT, fontSize: '11px', color: this.onlyReady ? '#aee8ff' : '#8faabf',
    }).setOrigin(1, 0.5);
    const bx = rx - ready.width - box - 6;
    const bg = this.scene.add.graphics();
    bg.lineStyle(1.4, this.onlyReady ? 0x5cd0ff : 0x4a6a86, 1); bg.strokeRect(bx, y + (TAB_H - box) / 2, box, box);
    if (this.onlyReady) { bg.fillStyle(0x5cd0ff, 1); bg.fillRect(bx + 3, y + (TAB_H - box) / 2 + 3, box - 6, box - 6); }
    const rhit = this.scene.add.rectangle(bx + (rx - bx) / 2, y + TAB_H / 2, rx - bx, TAB_H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    rhit.on('pointerdown', () => { this.onlyReady = !this.onlyReady; this.scrollRow = 0; this.redraw(); });
    this.container.add([bg, ready, rhit]);

    const dx = bx - 16;
    const dex = this.scene.add.text(dx, y + TAB_H / 2, `손재주 ${CraftingStore.dexterity()}`, {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffd98a',
    }).setOrigin(1, 0.5);
    const dhit = this.scene.add.rectangle(dx - dex.width / 2, y + TAB_H / 2, dex.width + 8, TAB_H, 0xffffff, 0.001).setInteractive();
    dhit.on('pointerover', () => this.showDexTip(dx - dex.width, y + TAB_H + 4));
    dhit.on('pointerout', () => { this.dexTip?.destroy(); this.dexTip = undefined; });
    this.container.add([dex, dhit]);
    this.rects.dex = new Phaser.Geom.Rectangle(dx - dex.width - 4, y, dex.width + 8, TAB_H);
  }

  /** 손재주 호버 — 분야별 숙련 레벨 */
  private showDexTip(x: number, y: number): void {
    this.dexTip?.destroy();
    const lines = CRAFT_GROUP_ORDER.map((g) => {
      const lv = CraftingStore.masteryLevel(g);
      const next = craftMasteryNextXp(lv);
      return `${CRAFT_GROUP_LABEL[g].ko}  ${lv} / ${CRAFT_MASTERY_MAX}${next ? `  (${CraftingStore.masteryXp(g)} / ${next})` : ''}`;
    });
    const c = this.scene.add.container(x, y);
    const txt = this.scene.add.text(10, 8, lines.map((l) => t(l)).join('\n'), {
      fontFamily: FONT, fontSize: '11px', color: '#e8f4fd', lineSpacing: 4,
    });
    const g = this.scene.add.graphics();
    g.fillStyle(0x050f1e, 0.97); g.fillRoundedRect(0, 0, txt.width + 20, txt.height + 16, 4);
    g.lineStyle(1, 0xffd98a, 0.9); g.strokeRoundedRect(0, 0, txt.width + 20, txt.height + 16, 4);
    c.add([g, txt]);
    // 보드 오른쪽 끝을 넘지 않게
    const maxX = this.o.x + this.o.w - (txt.width + 20);
    c.setX(Math.min(x, maxX));
    this.container.add(c);
    this.dexTip = c;
  }

  // ── 왼쪽: 도면 목록 ───────────────────────────────────
  private renderList(bps: CraftBlueprint[], x: number, y: number, w: number, h: number): void {
    type Row = { kind: 'head'; label: string } | { kind: 'bp'; bp: CraftBlueprint };
    const rows: Row[] = [];
    let lastGroup = '';
    for (const bp of bps) {
      if (this.group === 'all' && bp.group !== lastGroup) {
        rows.push({ kind: 'head', label: CRAFT_GROUP_LABEL[bp.group].ko });
        lastGroup = bp.group;
      }
      rows.push({ kind: 'bp', bp });
    }
    const top = y + 8;
    const visible = Math.max(1, Math.floor((h - 26) / ROW_H));
    const maxScroll = Math.max(0, rows.length - visible);
    this.scrollRow = Phaser.Math.Clamp(this.scrollRow, 0, maxScroll);
    if (rows.length === 0) {
      this.container.add(this.scene.add.text(x + 14, top + 10, '지금 만들 수 있는 도면이 없다.', {
        fontFamily: FONT, fontSize: '12px', color: '#6f8ba3', wordWrap: { width: w - 28 },
      }));
    }

    for (let i = 0; i < visible; i++) {
      const r = rows[this.scrollRow + i];
      if (!r) break;
      const ry = top + i * ROW_H;
      if (r.kind === 'head') {
        this.container.add(this.scene.add.text(x + 12, ry + 8, r.label, {
          fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3',
        }));
        continue;
      }
      const bp = r.bp;
      const chk = CraftingStore.check(bp, 1, this.o.station);
      const selected = bp.id === this.selectedId;
      const g = this.scene.add.graphics();
      if (selected) { g.fillStyle(0x155a7c, 0.85); g.fillRoundedRect(x + 6, ry + 1, w - 12, ROW_H - 3, 3); }
      // 상태 칩 — 초록 = 가능 · 노랑 = 재료 · 자리 · 회색 = 조건 미달(색으로만, 글자 배지 금지)
      const chip = chk.ok ? 0x4af2a1 : chk.locked ? 0x5a6a78 : 0xffc857;
      g.fillStyle(chip, 1); g.fillRect(x + 12, ry + ROW_H / 2 - 4, 7, 7);
      this.container.add(g);
      // 진행 중이면 오른쪽에 작은 막대
      const job = CraftingStore.allJobs().find((j) => j.bpId === bp.id);
      const label = this.scene.add.text(x + 26, ry + 6, bp.nameKo, {
        fontFamily: FONT, fontSize: '12px',
        color: selected ? '#aee8ff' : chk.ok ? '#d8e6f2' : chk.locked ? '#6a7c8c' : '#c8b88a',
      });
      clampTextWidth(label, w - 40 - (job ? 26 : 0));
      this.container.add(label);
      if (job) {
        const pg = this.scene.add.graphics();
        pg.fillStyle(0x14324a, 1); pg.fillRect(x + w - 34, ry + ROW_H / 2 - 2, 22, 4);
        pg.fillStyle(0x4af2a1, 1); pg.fillRect(x + w - 34, ry + ROW_H / 2 - 2, 22 * CraftingStore.progressOf(job), 4);
        this.container.add(pg);
      }
      const hit = this.scene.add.rectangle(x + w / 2, ry + ROW_H / 2, w - 12, ROW_H - 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectedId = bp.id;
        this.qty = 1;
        this.status = '';
        this.redraw();
      });
      this.container.add(hit);
    }

    if (maxScroll > 0) {
      this.container.add(this.scene.add.text(x + w - 10, y + h - 16,
        `${this.scrollRow + 1}–${Math.min(rows.length, this.scrollRow + visible)} / ${rows.length}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#5f8ba6',
        }).setOrigin(1, 0));
    }
    if (!this.wheelHandler) {
      this.wheelHandler = (p, _o, _dx, dy) => {
        const org = this.o.origin?.() ?? { x: 0, y: 0 };
        const lx = p.x - org.x, ly = p.y - org.y;
        const lr = this.rects.list;
        if (!lr || !lr.contains(lx, ly)) return;
        this.scrollRow = Math.max(0, this.scrollRow + (dy > 0 ? 1 : -1));
        this.redraw();
      };
      this.scene.input.on('wheel', this.wheelHandler);
    }
  }

  // ── 오른쪽: 상세 ─────────────────────────────────────
  private renderDetail(bp: CraftBlueprint | null, x: number, y: number, w: number, h: number): void {
    if (!bp) {
      this.container.add(this.scene.add.text(x + 16, y + 20, '도면을 고르면 여기에 자세히 나온다.', {
        fontFamily: FONT, fontSize: '12px', color: '#6f8ba3',
      }));
      return;
    }
    const chk = CraftingStore.check(bp, Math.max(1, this.qty), this.o.station);
    const one = CraftingStore.check(bp, 1, this.o.station);
    const tpl = craftOutputTemplate(bp.outputId);
    const pad = 16;
    let cy = y + 12;

    // 머리: 결과 그림 · 이름 · 갈래 · 위치
    const icon = createItemIcon(this.scene, x + pad + 26, cy + 26, tpl ?? { icon: '' }, 44);
    const ibox = this.scene.add.graphics();
    ibox.fillStyle(0x0e1c2d, 0.95); ibox.fillRoundedRect(x + pad, cy, 52, 52, 4);
    ibox.lineStyle(1, 0x2a5070, 1); ibox.strokeRoundedRect(x + pad, cy, 52, 52, 4);
    this.container.add([ibox, icon]);
    const nx = x + pad + 64;
    const title = this.scene.add.text(nx, cy + 2, bp.nameKo, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffe28a' });
    clampTextWidth(title, w - (nx - x) - pad);
    const sub = this.scene.add.text(nx, cy + 24,
      `${CRAFT_GROUP_LABEL[bp.group].ko} · ${CRAFT_STATION_LABEL[bp.station].ko} · 한 번에 ${bp.outputQty}개`, {
        fontFamily: FONT, fontSize: '11px', color: '#8fb0c4',
      });
    clampTextWidth(sub, w - (nx - x) - pad);
    const outName = this.scene.add.text(nx, cy + 40, tpl ? tpl.name : '', { fontFamily: FONT, fontSize: '11px', color: '#6f8ba3' });
    clampTextWidth(outName, w - (nx - x) - pad);
    this.container.add([title, sub, outName]);
    cy += 60;

    // 설명 — wordWrap 아래는 흐름 배치(§4)
    const desc = this.scene.add.text(x + pad, cy, bp.descKo, {
      fontFamily: FONT, fontSize: '12px', color: '#b9cad8', lineSpacing: 3, wordWrap: { width: w - pad * 2 },
    });
    this.container.add(desc);
    cy += desc.height + 8;

    // 조건 — 레벨 · 스킬 · 공구(맞으면 초록, 아니면 붉게)
    const conds: { text: string; ok: boolean }[] = [];
    if (bp.minLevel) conds.push({ text: `레벨 ${bp.minLevel}`, ok: (GameState.player.level ?? 1) >= bp.minLevel });
    if (bp.requiresSkill) {
      const nm = getSkillById(bp.requiresSkill.id)?.nameKo ?? '';
      conds.push({ text: `기술 ${nm} ${bp.requiresSkill.rank}단계`, ok: CraftingStore.unlocked(bp) });
    }
    if (bp.station === 'advanced') conds.push({ text: '로드 빌딩 공구 세트', ok: CraftingStore.hasAdvancedTools() });
    if (conds.length) {
      let ccx = x + pad;
      const lab = this.scene.add.text(ccx, cy, '조건', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3' });
      this.container.add(lab);
      ccx += lab.width + 10;
      for (const c of conds) {
        const tt = this.scene.add.text(ccx, cy, c.text, { fontFamily: FONT, fontSize: '11px', color: c.ok ? '#4af2a1' : '#ff8a7a' });
        this.container.add(tt);
        ccx += tt.width + 12;
      }
      cy += 20;
    }

    // 재료 — 그림 · 이름 · 가진 수 / 필요 수
    this.container.add(this.scene.add.text(x + pad, cy, '재료', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3' }));
    cy += 18;
    const half = (w - pad * 2) / 2;
    chk.materials.forEach((m, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const mx = x + pad + col * half, my = cy + row * 26;
      this.container.add(createItemIcon(this.scene, mx + 11, my + 11, materialLook(m.material), 20));
      const tt = this.scene.add.text(mx + 26, my + 3, `${m.material.nameKo}  ${m.have}/${m.need}`, {
        fontFamily: FONT, fontSize: '11px', color: m.ok ? '#d8e6f2' : '#ff8a7a',
      });
      clampTextWidth(tt, half - 30);
      this.container.add(tt);
    });
    cy += Math.ceil(chk.materials.length / 2) * 26 + 4;
    this.rects.mats = new Phaser.Geom.Rectangle(x + pad, cy - Math.ceil(chk.materials.length / 2) * 26 - 22, w - pad * 2, Math.ceil(chk.materials.length / 2) * 26 + 18);

    // 수량 · 수치
    const maxQ = Math.max(1, one.maxQty);
    this.qty = Phaser.Math.Clamp(this.qty, 1, maxQ);
    const qy = cy;
    this.mkButton(x + pad, qy, 28, '−', () => { this.qty = Math.max(1, this.qty - 1); this.redraw(); }, this.qty > 1);
    // 숫자 칸 — 누르면 직접 입력(숨김 DOM 입력)
    const qbx = x + pad + 32, qbw = 46;
    const qg = this.scene.add.graphics();
    qg.fillStyle(0x07121e, 0.95); qg.fillRoundedRect(qbx, qy, qbw, 28, 4);
    qg.lineStyle(1.2, this.qtyInput ? 0x5cd0ff : 0x2a5070, 1); qg.strokeRoundedRect(qbx, qy, qbw, 28, 4);
    const qt = this.scene.add.text(qbx + qbw / 2, qy + 14, `${this.qty}${this.qtyInput ? '|' : ''}`, {
      fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    const qhit = this.scene.add.rectangle(qbx + qbw / 2, qy + 14, qbw, 28, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    qhit.on('pointerdown', () => this.startQtyInput(maxQ));
    this.container.add([qg, qt, qhit]);
    this.mkButton(qbx + qbw + 4, qy, 28, '+', () => { this.qty = Math.min(maxQ, this.qty + 1); this.redraw(); }, this.qty < maxQ);
    this.mkButton(qbx + qbw + 36, qy, 46, '최대', () => { this.qty = maxQ; this.redraw(); }, maxQ > 1);
    this.rects.qty = new Phaser.Geom.Rectangle(x + pad, qy, qbw + 86 + 32, 28);

    const unit = CraftingStore.unitMs(bp);
    const mods = CraftingStore.modifiers(bp);
    const info = [
      `성공 ${Math.round(CraftingStore.successRate(bp) * 100)}%  ·  실패하면 재료 하나마다 ${Math.round(CraftingStore.lossChance(bp) * 100)}% 잃음`,
      `1개 ${durText(unit)}  ·  모두 ${durText(unit * this.qty)}`,
      `얻는 것  경험치 ${CraftingStore.xpOf(bp) * this.qty}  ·  ${CRAFT_GROUP_LABEL[bp.group].ko} 숙련 +${bp.xp * this.qty}`
        + (CraftingStore.xpOf(bp) > bp.xp ? '  (처음 만드는 도면 — 경험치 세 배)' : ''),
    ];
    const ix = qbx + qbw + 96;
    let iy = qy - 2;
    for (const line of info) {
      const it = this.scene.add.text(ix, iy, line, { fontFamily: FONT, fontSize: '11px', color: '#8fd9ff' });
      clampTextWidth(it, x + w - pad - ix);
      this.container.add(it);
      iy += 16;
    }
    cy = Math.max(qy + 34, iy + 4);
    this.rects.info = new Phaser.Geom.Rectangle(ix, qy - 2, x + w - pad - ix, 48);
    if (mods.handPenalty > 0) {
      const hn = this.scene.add.text(x + pad, cy, `손이 무겁다 (${mods.handNotes.join(' · ')}) — 성공률 −${Math.round(mods.handPenalty * 100)}%`, {
        fontFamily: FONT, fontSize: '11px', color: '#ffb37a', wordWrap: { width: w - pad * 2 },
      });
      this.container.add(hn);
      cy += hn.height + 4;
    }

    // ── 아래: 진행 · 단추(하단 고정 — 위 흐름과 겹치면 위가 밀린다) ──
    const btnY = y + h - 40;
    const progY = btnY - 52;
    const job = CraftingStore.activeJob(this.lane);
    const queued = CraftingStore.laneJobs(this.lane).length - (job ? 1 : 0);
    if (job) {
      const jb = CraftingStore.blueprints(this.o.station).find((b) => b.id === job.bpId) ?? null;
      const head = this.scene.add.text(x + pad, progY, `만드는 중  ${jb ? jb.nameKo : ''}  ${Math.min(job.qty, job.done + 1)} / ${job.qty}`
        + (job.stopAfterUnit ? '  · 이것만 마치고 멈춤' : '') + (queued > 0 ? `  · 예약 ${queued}` : ''), {
        fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#cfe3f2',
      });
      clampTextWidth(head, w - pad * 2);
      const pg = this.scene.add.graphics();
      const plabel = this.scene.add.text(x + w - pad, progY + 22, '', { fontFamily: FONT, fontSize: '11px', color: '#9fd0e4' }).setOrigin(1, 0);
      this.container.add([head, pg, plabel]);
      this.prog = { g: pg, label: plabel, x: x + pad, y: progY + 24, w: w - pad * 2 - 130, jobId: job.id, done: job.done };
      this.updateProgress();
    } else if (this.lane === 'hand' && CraftingStore.activeJob('bench')) {
      // 맨손 창에서도 작업대 진행을 한 줄로 알린다
      const bj = CraftingStore.activeJob('bench')!;
      const bbp = CraftingStore.blueprints('workbench').find((b) => b.id === bj.bpId);
      this.container.add(this.scene.add.text(x + pad, progY + 14, `작업대에서 만드는 중  ${bbp?.nameKo ?? ''} — ${durText(CraftingStore.remainingMs(bj))}`, {
        fontFamily: FONT, fontSize: '11px', color: '#6f8ba3',
      }));
    }
    this.rects.prog = new Phaser.Geom.Rectangle(x + pad, progY, w - pad * 2, 48);

    // 사유(단추 위 — R6)
    const reason = !chk.ok ? chk.reason : null;
    const laneBusy = CraftingStore.laneJobs(this.lane).length >= CraftingStore.laneCap();
    const msg = this.status || (laneBusy && !reason ? (this.lane === 'hand' ? '손이 비지 않았다 — 지금 것을 마치고 하자' : '작업대가 비지 않았다') : reason ?? '');
    if (msg) {
      const r = this.scene.add.text(x + pad, btnY - 16, t(msg), {
        fontFamily: FONT, fontSize: '11px', color: this.status ? this.statusColor : '#ffb37a',
      });
      clampTextWidth(r, w - pad * 2);
      this.container.add(r);
    }

    const canStart = chk.ok && !laneBusy;
    this.mkButton(x + pad, btnY, 130, '제작하기', () => this.doStart(bp), canStart, true);
    this.rects.start = new Phaser.Geom.Rectangle(x + pad, btnY, 130, 30);
    this.mkButton(x + pad + 140, btnY, 80, '중지', () => { if (job) CraftingStore.stop(job.id); }, !!job && !job.stopAfterUnit);
    this.mkButton(x + pad + 228, btnY, 80, '취소', () => this.doCancel(), !!job);
    this.rects.stop = new Phaser.Geom.Rectangle(x + pad + 140, btnY, 168, 30);
    const stored = CraftingStore.storageList().reduce((a, s) => a + s.qty, 0);
    if (stored > 0) {
      this.mkButton(x + w - pad - 150, btnY, 150, `보관함 ${stored}개 꺼내기`, () => {
        const n = CraftingStore.claimStorage();
        this.setStatus(n > 0 ? `${n}개를 가방에 넣었다` : '가방에 자리가 없다', n > 0);
        this.o.onCrafted?.();
      });
    }
  }

  /** 진행 막대 · 남은 시간만 고친다(0.25초마다) */
  private updateProgress(): void {
    const p = this.prog;
    if (!p || !p.g.active) return;
    const job = CraftingStore.activeJob(this.lane);
    if (!job) return;
    // 1개가 끝났으면(개수 · 남은 재료가 바뀜) 통째로 다시 그린다
    if (job.id !== p.jobId || job.done !== p.done) { this.redraw(); return; }
    const pr = CraftingStore.progressOf(job);
    p.g.clear();
    p.g.fillStyle(0x14324a, 1); p.g.fillRoundedRect(p.x, p.y, p.w, 10, 4);
    p.g.fillStyle(0x4af2a1, 1); p.g.fillRoundedRect(p.x, p.y, Math.max(4, p.w * pr), 10, 4);
    p.label.setText(`${Math.round(pr * 100)}%  ·  남은 시간 ${durText(CraftingStore.remainingMs(job))}`);
  }

  private doStart(bp: CraftBlueprint): void {
    const err = CraftingStore.start(bp, this.qty, this.o.station);
    if (err) { this.setStatus(err, false); return; }
    this.status = '';
    this.o.onCrafted?.();
    this.redraw();
  }

  private doCancel(): void {
    const job = CraftingStore.activeJob(this.lane);
    if (!job) return;
    const r = CraftingStore.cancel(job.id);
    this.setStatus(`취소했다 — 돌려받은 재료 ${r.refunded}개 · 잃은 재료 ${r.forfeited}개`, r.forfeited === 0);
    this.o.onCrafted?.();
  }

  private setStatus(msg: string, good: boolean): void {
    this.status = msg;
    this.statusColor = good ? '#4af2a1' : '#ff8a7a';
    this.redraw();
  }

  private startQtyInput(maxQ: number): void {
    if (this.qtyInput) return;
    this.qtyInput = new TextInput(this.scene, {
      value: '',
      maxLength: 3,
      filter: (v) => v.replace(/[^0-9]/g, ''),
      onChange: (v) => { const n = parseInt(v, 10); if (!Number.isNaN(n)) this.qty = Phaser.Math.Clamp(n, 1, maxQ); this.redraw(); },
      onSubmit: () => this.stopQtyInput(),
      onCancel: () => this.stopQtyInput(),
    });
    this.redraw();
  }

  private stopQtyInput(): void {
    if (!this.qtyInput) return;
    this.qtyInput.close();
    this.qtyInput = undefined;
    if (this.alive) this.redraw();
  }

  // ── 공통 ─────────────────────────────────────────────
  private mkButton(x: number, y: number, w: number, label: string, run: () => void, enabled = true, primary = false): void {
    const H = primary ? 30 : 28;
    const g = this.scene.add.graphics();
    const fill = !enabled ? 0x22303c : primary ? 0x0d4a2e : 0x155a7c;
    const line = !enabled ? 0x33414d : primary ? 0x4af2a1 : 0x5cd0ff;
    g.fillStyle(fill, enabled ? 0.95 : 0.7); g.fillRoundedRect(x, y, w, H, 4);
    g.lineStyle(1.2, line, 0.9); g.strokeRoundedRect(x, y, w, H, 4);
    this.container.add(g);
    const tx = this.scene.add.text(x + w / 2, y + H / 2, label, {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold',
      color: !enabled ? '#5a6a78' : primary ? '#4af2a1' : '#aee8ff',
    }).setOrigin(0.5);
    clampTextWidth(tx, w - 8);
    this.container.add(tx);
    if (!enabled) return;
    const hit = this.scene.add.rectangle(x + w / 2, y + H / 2, w, H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', run);
    this.container.add(hit);
  }

  private drawFrame(x: number, y: number, w: number, h: number): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x0b1520, 0.9); g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(1.5, 0x1f3d5a, 0.95); g.strokeRoundedRect(x, y, w, h, 6);
    this.container.add(g);
  }

  /** 컨테이너를 비우고 다시 그린다 */
  private redraw(): void {
    if (!this.alive || !this.container.active) return;
    this.dexTip?.destroy();
    this.dexTip = undefined;
    this.container.removeAll(true);
    this.render();
  }

  // ═══════════════════════════════════════════════
  // 첫 열기 가이드 (222차 — tour id 'craft_v2'). 제작이 시간을 쓰게 바뀌어 이미 제작 탭을 본 사람에게도 한 번 뜬다.
  // ═══════════════════════════════════════════════
  private scr(r: Phaser.Geom.Rectangle | undefined): Phaser.Geom.Rectangle | null {
    if (!r) return null;
    const o = this.o.origin?.() ?? { x: 0, y: 0 };
    return new Phaser.Geom.Rectangle(o.x + r.x, o.y + r.y, r.width, r.height);
  }

  private buildTour(): TourOptions | null {
    if (!this.o.origin) return null;
    return {
      id: 'craft_v2',
      alive: () => this.alive && (this.o.alive?.() ?? true),
      steps: [
        { text: '위쪽 칩으로 만들 것의 종류를 고른다. 오른쪽 「만들 수 있는 것만」을 켜면 지금 재료로 되는 것만 남는다.', target: () => this.scr(this.rects.tabs) },
        { text: '왼쪽 목록의 네모 색이 상태다. 초록은 지금 만들 수 있고, 노랑은 재료가 모자라고, 회색은 레벨이나 기술이 아직 안 된다.', target: () => this.scr(this.rects.list) },
        { text: '고른 도면의 결과물 · 조건 · 재료가 여기에 나온다. 재료 옆 숫자는 가진 수와 필요한 수다.', target: () => this.scr(this.rects.detail) },
        { text: '몇 개 만들지 정한다. 가운데 숫자 칸을 누르면 직접 칠 수 있다. 옆에는 성공률 · 걸리는 시간 · 얻는 경험치가 나온다.', target: () => this.scr(this.rects.qty) },
        { text: '제작은 시간이 걸린다. 창을 닫거나 밖으로 나가도 계속 만든다. 「중지」는 지금 것을 마저 만들고 멈추고, 「취소」는 지금 것을 버린다 — 일찍 그만둘수록 재료를 많이 돌려받는다.', target: () => this.scr(this.rects.stop) },
        { text: '손재주는 갈래마다 쌓은 제작 경험을 모은 것이다. 위에 올리면 갈래별로 보인다. 높을수록 조금 더 잘, 빨리, 좋게 만든다.', target: () => this.scr(this.rects.dex) },
      ],
    };
  }
}

export type { CraftCheck };
