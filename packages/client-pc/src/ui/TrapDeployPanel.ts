/**
 * @file TrapDeployPanel.ts
 * @description 통발 설치 선택 패널 (121차) — 보유 통발(면허 등급 표시) × 미끼(생/선어/냉동미끼) 선택 → 설치 모드.
 *
 * 규칙: DraggablePanel 상속 · 일반 팝업 밴드(800) · 목록은 짧아 윈도우드 렌더 불요(통발 8종·미끼 ≤ 10) ·
 * 텍스트는 clampTextWidth. 선택은 상태 필드로 들고(i18n 훅이 setText를 바꾸므로 원문 비교 금지).
 */

import Phaser from 'phaser';
import { getTrapById, TRAP_DATABASE } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

const PANEL_W = 420;
const PANEL_H = 372;
const COL_W = 190;
const ROW_H = 26;

export interface TrapDeployCallbacks {
  onClose: () => void;
  onPick: (trapItem: InvItem, baitItem: InvItem) => void;
}

export class TrapDeployPanel extends DraggablePanel {
  private cbs: TrapDeployCallbacks;
  private content: Phaser.GameObjects.Container;
  private selTrap: InvItem | null = null;
  private selBait: InvItem | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, cbs: TrapDeployCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '통발 놓기', onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    const traps = InventoryStore.items.filter((i) => i.trapSpecId && i.qty > 0);
    const baits = InventoryStore.items.filter((i) => /미끼/.test(i.subCategory) && i.qty > 0 && i.slot >= 0);
    this.selTrap = traps[0] ?? null;
    this.selBait = baits[0] ?? null;
    this.render();
    this.applyFix();
  }

  private render(): void {
    const sc = this.scene;
    this.content.removeAll(true);
    const top = this.contentTop;
    const hasAdv = GameState.hasLicense('trap_advanced');
    const traps = InventoryStore.items.filter((i) => i.trapSpecId && i.qty > 0);
    const baits = InventoryStore.items.filter((i) => /미끼/.test(i.subCategory) && i.qty > 0 && i.slot >= 0);

    const head = (x: number, label: string): void => {
      const t = sc.add.text(x, top, label, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fd5ff', fontStyle: 'bold' });
      this.content.add(t);
    };
    head(14, '통발 (보유)');
    head(14 + COL_W + 12, '미끼');

    const list = (x: number, items: InvItem[], sel: InvItem | null, onSel: (i: InvItem) => void, sub: (i: InvItem) => string, disabled: (i: InvItem) => boolean): void => {
      let y = top + 22;
      if (items.length === 0) {
        const t = sc.add.text(x, y, '없음 — 직판장에서 구매', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8a97a8' });
        this.content.add(t);
        return;
      }
      for (const it of items.slice(0, 8)) {
        const isSel = sel?.id === it.id;
        const dis = disabled(it);
        const bg = sc.add.rectangle(x, y, COL_W, ROW_H - 2, isSel ? 0x1f4a6a : 0x122236, dis ? 0.5 : 0.95).setOrigin(0, 0);
        bg.setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
        const name = sc.add.text(x + 6, y + 3, it.name, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: dis ? '#8a97a8' : '#e8f4fd' });
        clampTextWidth(name, COL_W - 60);
        const right = sc.add.text(x + COL_W - 6, y + 3, `${sub(it)} x${it.qty}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: dis ? '#ff9a9a' : '#a8c8e8' }).setOrigin(1, 0);
        if (!dis) {
          bg.setInteractive({ useHandCursor: true });
          bg.on('pointerdown', () => { onSel(it); this.render(); });
        }
        this.content.add([bg, name, right]);
        y += ROW_H;
      }
    };
    list(14, traps, this.selTrap, (i) => { this.selTrap = i; }, (i) => {
      const spec = getTrapById(i.trapSpecId ?? '');
      return spec?.licenseTier === 'advanced' ? '심화' : '기본';
    }, (i) => (getTrapById(i.trapSpecId ?? '')?.licenseTier === 'advanced' && !hasAdv));
    list(14 + COL_W + 12, baits, this.selBait, (i) => { this.selBait = i; }, () => '', () => false);

    // 선택 요약 + 안내 — 흐름 배치
    const spec = this.selTrap ? getTrapById(this.selTrap.trapSpecId ?? '') : undefined;
    const specAll = TRAP_DATABASE.find((s) => s.id === spec?.id);
    const infoY = top + 22 + ROW_H * 8 + 6;
    const info = sc.add.text(14, infoY, spec && specAll
      ? `${spec.nameKo} — 용량 ${(specAll.maxCapacityG / 1000).toFixed(1)}kg · 미끼 지속 ${specAll.baitDurationHours}h · 최대 수심 ${specAll.maxDepthM}m · 내구도 ${specAll.maxDurability}`
      : '통발과 미끼를 고르세요', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8d8e8', wordWrap: { width: PANEL_W - 28 },
    });
    this.content.add(info);
    const noteY = info.y + info.height + 4;
    const note = sc.add.text(14, noteY, '설치 = 통발 1 + 미끼 1 소모 · 수거 시 통발 반환(분실·파손 제외) · 침지는 실시간 · 산란기 도루묵(10~12월) 포획은 조례 위반', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8a97a8', wordWrap: { width: PANEL_W - 28 },
    });
    this.content.add(note);

    // 버튼
    const canGo = !!this.selTrap && !!this.selBait && !(spec?.licenseTier === 'advanced' && !hasAdv);
    const by = PANEL_H - 34;
    const btn = sc.add.rectangle(PANEL_W / 2, by, 200, 28, canGo ? 0x1f5a3a : 0x2a3340, 1).setStrokeStyle(1, canGo ? 0x4af2a1 : 0x3a4a5a, 1);
    const bt = sc.add.text(PANEL_W / 2, by, '설치 위치 고르기', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: canGo ? '#e8fff0' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
    if (canGo) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.cbs.onPick(this.selTrap!, this.selBait!); this.cbs.onClose(); });
    }
    this.content.add([btn, bt]);
    enforceTextBounds(this.content, PANEL_W - 10, 'TrapDeployPanel');
    this.applyFix();
  }
}
