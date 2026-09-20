/**
 * @file LicensePanel.ts
 * @description 면허·허가 패널 (L — 122차 재작성). DraggablePanel 골격(헤더 드래그·✕·ESC LIFO) + 카테고리 그룹 목록(윈도우드
 * 렌더 + 휠) + 우측 상세/발급. 구 Container 버전은 네이티브 드래그·`y > 300` 절단(10번째 면허부터 조용히 누락 — 54차 잔여)이
 * 있어 폐기했다.
 *
 * 면허 = 게임 내 권한 게이트: 낚시(선상·원투 제한구역) · 해루질 · 통발 · 토지(주택 부지·농지) · 선박·어업(소형 선박 조종·
 * 수협 조합원·항만 제한구역) · 사업(식당·해양관광·토너먼트). 요건 판정은 core `checkUnlockRequirements`.
 */

import Phaser from 'phaser';
import {
  LICENSE_DATABASE, LICENSE_CATEGORY_LABEL, LICENSE_CATEGORY_ORDER, getLicenseByType, checkUnlockRequirements,
  getStoryQuest, getSpotById, getFishById, QUEST_DATABASE,
  type LicenseType, type LicenseDef,
} from '@tra/core';
import { DraggablePanel, applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { GameState } from '../store/GameState.js';
import { StoryStore } from '../store/StoryStore.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

const PANEL_W = 720;
const PANEL_H = 500;
const LIST_W = 330;
const ROW_H = 28;
const DETAIL_X = LIST_W + 24;
const DETAIL_W = PANEL_W - DETAIL_X - 18;
const FONT = '"Noto Sans KR", sans-serif';

type Row = { kind: 'head'; label: string } | { kind: 'lic'; def: LicenseDef };

/**
 * 요구사항 줄에 쓸 임무 이름 (153차). 내부 id를 화면에 흘리지 않는다(§8-9 R1) —
 * 스토리 임무 → 구 퀘스트 DB 순으로 찾고, 둘 다 없으면 이름 대신 사실만 적는다.
 */
function questTitleOf(id: string): string {
  return getStoryQuest(id)?.titleKo ?? QUEST_DATABASE.find((q) => q.id === id)?.nameKo ?? '선행 임무';
}

export class LicensePanel extends DraggablePanel {
  private selected: LicenseType | null = null;
  private scroll = 0;
  private listC?: Phaser.GameObjects.Container;
  private detailC?: Phaser.GameObjects.Container;
  private barG!: Phaser.GameObjects.Graphics;
  private wheelHandler?: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '면허 · 허가', onClose, depth: 812 });
    const g = scene.add.graphics();
    const top = this.contentTop;
    g.fillStyle(0x0a1b2d, 0.6); g.fillRoundedRect(8, top - 4, LIST_W + 4, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(8, top - 4, LIST_W + 4, PANEL_H - top - 8, 6);
    g.fillStyle(0x0c1e30, 0.55); g.fillRoundedRect(DETAIL_X - 6, top - 4, DETAIL_W + 12, PANEL_H - top - 8, 6);
    g.lineStyle(1, 0x1c3d5a, 1); g.strokeRoundedRect(DETAIL_X - 6, top - 4, DETAIL_W + 12, PANEL_H - top - 8, 6);
    this.add(g);
    this.barG = scene.add.graphics();
    this.add(this.barG);
    this.selected = this.rows().find((r): r is { kind: 'lic'; def: LicenseDef } => r.kind === 'lic')?.def.type ?? null;
    this.renderList();
    this.renderDetail();
    this.wheelHandler = (p, _go, _dx, dy) => {
      const lx = p.x - this.x, ly = p.y - this.y;
      if (ly < this.contentTop || ly > PANEL_H || lx < 0 || lx > LIST_W + 12) return;
      this.setScroll(this.scroll + Math.sign(dy));
    };
    scene.input.on('wheel', this.wheelHandler);
    applyScreenFixed(this);
  }

  private rows(): Row[] {
    const out: Row[] = [];
    for (const cat of LICENSE_CATEGORY_ORDER) {
      const list = LICENSE_DATABASE.filter((l) => l.category === cat);
      if (!list.length) continue;
      out.push({ kind: 'head', label: LICENSE_CATEGORY_LABEL[cat] });
      for (const def of list) out.push({ kind: 'lic', def });
    }
    return out;
  }

  private visibleRows(): number {
    return Math.floor((PANEL_H - this.contentTop - 16) / ROW_H);
  }

  private setScroll(v: number): void {
    const max = Math.max(0, this.rows().length - this.visibleRows());
    this.scroll = Phaser.Math.Clamp(v, 0, max);
    this.renderList();
  }

  private renderList(): void {
    this.listC?.destroy();
    const c = this.scene.add.container(0, 0);
    this.listC = c;
    this.add(c);
    const rows = this.rows();
    const vis = this.visibleRows();
    const max = Math.max(0, rows.length - vis);
    const y0 = this.contentTop + 4;
    const rowW = LIST_W - 12 - (max > 0 ? 8 : 0);
    rows.slice(this.scroll, this.scroll + vis).forEach((row, i) => {
      const y = y0 + i * ROW_H;
      if (row.kind === 'head') {
        const t = this.scene.add.text(16, y + 7, row.label, { fontFamily: FONT, fontSize: '11px', color: '#9fd5ff', fontStyle: 'bold' });
        c.add(t);
        return;
      }
      const held = GameState.hasLicense(row.def.type);
      const sel = this.selected === row.def.type;
      const bg = this.scene.add.rectangle(14, y + 1, rowW, ROW_H - 3, sel ? 0x1f4a6a : held ? 0x0f3326 : 0x122236, 0.95).setOrigin(0, 0);
      bg.setStrokeStyle(1, sel ? 0x5cd0ff : held ? 0x2f8a5a : 0x2a3a4a, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this.selected = row.def.type; this.renderList(); this.renderDetail(); restoreHandCursor(this.scene); });
      const name = this.scene.add.text(24, y + 6, `${held ? '✓ ' : ''}${row.def.nameKo}`, { fontFamily: FONT, fontSize: '11px', color: held ? '#aaffcc' : '#e8f4fd' });
      clampTextWidth(name, rowW - 90);
      const cost = this.scene.add.text(14 + rowW - 8, y + 6, held ? '보유' : `₩${row.def.costCoins.toLocaleString()}`, { fontFamily: 'monospace', fontSize: '10px', color: held ? '#88ffaa' : '#ffddaa' }).setOrigin(1, 0);
      c.add([bg, name, cost]);
    });
    // 스크롤바 + 위치 표기
    this.barG.clear();
    if (max > 0) {
      const trackX = LIST_W - 2, trackY = y0, trackH = vis * ROW_H;
      this.barG.fillStyle(0x000000, 0.28); this.barG.fillRoundedRect(trackX, trackY, 5, trackH, 2);
      const thumbH = Math.max(20, trackH * (vis / rows.length));
      const thumbY = trackY + (trackH - thumbH) * (this.scroll / max);
      this.barG.fillStyle(0x7fb8d8, 0.6); this.barG.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
      const pos = this.scene.add.text(LIST_W - 8, PANEL_H - 12, `${this.scroll + 1}–${Math.min(rows.length, this.scroll + vis)} / ${rows.length}`, { fontFamily: FONT, fontSize: '9px', color: '#6a8aa0' }).setOrigin(1, 1);
      c.add(pos);
    }
    applyScreenFixed(this);
  }

  private renderDetail(): void {
    this.detailC?.destroy();
    const c = this.scene.add.container(DETAIL_X, this.contentTop);
    this.detailC = c;
    this.add(c);
    const lic = this.selected ? getLicenseByType(this.selected) : undefined;
    if (!lic) { applyScreenFixed(this); return; }
    const held = GameState.hasLicense(lic.type);
    let y = 4;
    const name = this.scene.add.text(0, y, lic.nameKo, { fontFamily: FONT, fontSize: '15px', color: '#ffeeaa', fontStyle: 'bold', wordWrap: { width: DETAIL_W - 70 } });
    const chip = this.scene.add.text(DETAIL_W - 4, y + 2, held ? '보유' : '미보유', { fontFamily: FONT, fontSize: '10px', color: '#0b1620', fontStyle: 'bold', backgroundColor: held ? '#7fe0b0' : '#8a97a8', padding: { x: 5, y: 1 } }).setOrigin(1, 0);
    y += name.height + 6;
    const cat = this.scene.add.text(0, y, LICENSE_CATEGORY_LABEL[lic.category], { fontFamily: FONT, fontSize: '10px', color: '#7fb8d8' });
    y += cat.height + 6;
    const desc = this.scene.add.text(0, y, lic.description, { fontFamily: FONT, fontSize: '11px', color: '#ccddee', wordWrap: { width: DETAIL_W }, lineSpacing: 3 });
    y += desc.height + 10;
    c.add([name, chip, cat, desc]);

    // 요건
    const reqTitle = this.scene.add.text(0, y, '해금 요구사항', { fontFamily: FONT, fontSize: '12px', color: '#88aacc', fontStyle: 'bold' });
    y += reqTitle.height + 4; c.add(reqTitle);
    const ctx = this.reqContext();
    const { met } = checkUnlockRequirements(lic.requirements, ctx);
    if (lic.prerequisites.length) {
      const pre = this.scene.add.text(0, y, `• 선행 면허: ${lic.prerequisites.map((p) => getLicenseByType(p)?.nameKo ?? p).join(', ')}`, { fontFamily: FONT, fontSize: '11px', color: lic.prerequisites.every((p) => GameState.hasLicense(p)) ? '#7fe0b0' : '#ffaa66', wordWrap: { width: DETAIL_W } });
      y += pre.height + 3; c.add(pre);
    }
    if (lic.requirements.length === 0) {
      const t = this.scene.add.text(0, y, '• 선행 조건 없음 (바로 발급 가능)', { fontFamily: FONT, fontSize: '11px', color: '#66aa88' });
      y += t.height + 3; c.add(t);
    }
    for (const req of lic.requirements) {
      let s = '';
      if (req.type === 'min_angling_trips') s = `• 출조 횟수: ${req.value}회 이상 (현재 ${ctx.totalTrips})`;
      else if (req.type === 'min_fish_caught') s = `• 어획 누계: ${req.value}마리 이상 (현재 ${ctx.totalFishCaught})`;
      else if (req.type === 'min_coins') s = `• 코인 보유: ₩${req.value.toLocaleString()} 이상`;
      else if (req.type === 'license_held') s = `• 선행 면허: ${getLicenseByType(req.licenseType)?.nameKo ?? req.licenseType}`;
      else if (req.type === 'spot_visited') s = `• 특정 장소 방문: ${getSpotById(req.spotId)?.name ?? req.spotId}`;
      // 153차 — 내부 id를 화면에 흘리지 않는다(§8-9 R1). 스토리 임무 → 구 퀘스트 DB 순으로 이름을 찾는다.
      else if (req.type === 'quest_completed') s = `• 할 일 완료: ${questTitleOf(req.questId)}`;
      else if (req.type === 'min_reputation') s = `• 평판 ${req.value} 이상`;
      else if (req.type === 'specific_fish_caught') s = `• 특정 어종 포획: ${getFishById(req.fishId)?.nameKo ?? req.fishId}`;
      const t = this.scene.add.text(0, y, s, { fontFamily: FONT, fontSize: '11px', color: '#ffaa66', wordWrap: { width: DETAIL_W }, lineSpacing: 2 });
      y += Math.max(16, t.height + 3); c.add(t);
    }
    // 해금 기능
    if (lic.unlocksFeatures.length) {
      y += 6;
      const ft = this.scene.add.text(0, y, `해금: ${lic.unlocksFeatures.join(' · ')}`, { fontFamily: FONT, fontSize: '10px', color: '#6a8aa0', wordWrap: { width: DETAIL_W } });
      y += ft.height + 4; c.add(ft);
    }
    if (lic.plannedNote) {
      const pn = this.scene.add.text(0, y, `※ ${lic.plannedNote}`, { fontFamily: FONT, fontSize: '10px', color: '#c88a5a', wordWrap: { width: DETAIL_W } });
      y += pn.height + 4; c.add(pn);
    }

    // 발급 버튼 (하단 고정 — 흐름이 길면 버튼 위에서 잘리지 않게 위치는 고정, 본문은 폭으로 방어)
    //  ⚠ 150차: 사유 줄('조건 미충족')을 버튼 **아래**(by+36)에 두면 상세 박스 하단(PANEL_H-8)과
    //     패널 경계를 함께 파고든다(실측 484~497 vs 박스 492). 사유는 버튼 **위**로 올리고,
    //     버튼 블록 전체를 박스 안쪽으로 들인다.
    const by = PANEL_H - this.contentTop - 58;
    if (held) {
      const t = this.scene.add.text(DETAIL_W / 2, by + 16, '유효하게 소지하고 있는 면허입니다.', { fontFamily: FONT, fontSize: '11px', color: '#aaffcc' }).setOrigin(0.5);
      c.add(t);
    } else {
      const preOk = lic.prerequisites.every((p) => GameState.hasLicense(p));
      const coinsOk = GameState.player.inventory.coins >= lic.costCoins;
      const ok = met && preOk && coinsOk;
      const btn = this.scene.add.rectangle(DETAIL_W / 2 - 100, by, 200, 32, ok ? 0x1f5a3a : 0x2a3340, 1).setOrigin(0, 0).setStrokeStyle(1, ok ? 0x4af2a1 : 0x3a4a5a, 1);
      const bt = this.scene.add.text(DETAIL_W / 2, by + 16, `면허 발급 (₩${lic.costCoins.toLocaleString()})`, { fontFamily: FONT, fontSize: '12px', color: ok ? '#e8fff0' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
      const why = this.scene.add.text(DETAIL_W / 2, by - 7, ok ? '' : !preOk ? '선행 면허가 필요합니다' : !met ? '조건 미충족' : '코인 부족', { fontFamily: FONT, fontSize: '10px', color: '#c88a5a' }).setOrigin(0.5, 1);
      if (ok) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          GameState.addCoins(-lic.costCoins);
          GameState.acquireLicense(lic.type);
          StoryStore.emitActionSource('selection', `license:${lic.type}`);
          GameState.markDirty();
          this.scene.cameras.main.flash(200, 0, 150, 80);
          this.renderList(); this.renderDetail(); restoreHandCursor(this.scene);
        });
      }
      c.add([btn, bt, why]);
    }
    enforceTextBounds(c, DETAIL_W + 4, 'LicensePanel');
    applyScreenFixed(this);
  }

  /** 레거시 FieldScene 호환 — 외부에서 닫기 요청 */
  close(): void { this.requestClose(); }

  private reqContext(): Parameters<typeof checkUnlockRequirements>[1] {
    return {
      totalTrips: GameState.player.totalTrips,
      totalFishCaught: GameState.player.caughtFishHistory.length,
      caughtFishIds: GameState.player.caughtFishHistory.map((f) => f.fishSpeciesId),
      coins: GameState.player.inventory.coins,
      heldLicenses: GameState.licenses.map((l) => l.type),
      completedQuests: GameState.completedQuestIds,
      visitedSpots: GameState.visitedSpotIds,
      reputationScore: GameState.restaurant?.reputationScore ?? 0,
    };
  }

  override destroy(fromScene?: boolean): void {
    if (this.wheelHandler) this.scene?.input?.off('wheel', this.wheelHandler);
    super.destroy(fromScene);
  }
}
