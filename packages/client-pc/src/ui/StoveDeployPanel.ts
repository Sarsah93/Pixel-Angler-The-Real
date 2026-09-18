/**
 * @file StoveDeployPanel.ts
 * @description 화구 설치 선택 패널 (154차 불요리) — 스토브 × 캐니스터 × 용기(선택) 조합 → 설치 모드.
 *
 * 규칙: DraggablePanel · 일반 팝업 밴드(800) · 목록이 짧아 윈도우드 렌더 불요 · 선택은 상태 필드로(i18n 원문 비교 금지).
 * 사용자 지시 ① — "하나의 아이템을 단순 설치가 아니게(가스스토브·가스 캐니스터·조리도구 팬 등)".
 */

import Phaser from 'phaser';
import { getHeatSource, getFuel, getCookware } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';

const PANEL_W = 640;
const PANEL_H = 330;
const COL_W = 196;
const ROW_H = 26;

export interface StoveDeployCallbacks {
  onClose: () => void;
  onPick: (stove: InvItem, fuel: InvItem, cookware: InvItem | null) => void;
}

export class StoveDeployPanel extends DraggablePanel {
  private cbs: StoveDeployCallbacks;
  private content: Phaser.GameObjects.Container;
  private selStove: InvItem | null = null;
  private selFuel: InvItem | null = null;
  private selWare: InvItem | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, cbs: StoveDeployCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '화구 설치', onClose: cbs.onClose, depth: 800 });
    this.cbs = cbs;
    this.content = scene.add.container(0, 0);
    this.add(this.content);
    const stoves = InventoryStore.items.filter((i) => i.stoveHeatId && i.qty > 0);
    const fuels = InventoryStore.items.filter((i) => i.fuelId && i.qty > 0);
    this.selStove = stoves[0] ?? null;
    this.selFuel = fuels[0] ?? null;
    this.render();
    this.applyFix();
  }

  private render(): void {
    const sc = this.scene;
    this.content.removeAll(true);
    const top = this.contentTop;
    const stoves = InventoryStore.items.filter((i) => i.stoveHeatId && i.qty > 0);
    const fuels = InventoryStore.items.filter((i) => i.fuelId && i.qty > 0 && (!this.selStove || getFuel(i.fuelId ?? '')?.heatSourceId === this.selStove.stoveHeatId));
    const wares = InventoryStore.items.filter((i) => i.cookwareId && i.qty > 0);

    const head = (x: number, label: string): void => {
      const t = sc.add.text(x, top, label, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fd5ff', fontStyle: 'bold' });
      this.content.add(t);
    };
    head(14, '화구');
    head(14 + COL_W + 10, '연료 (캐니스터)');
    head(14 + (COL_W + 10) * 2, '용기 (선택)');

    const list = (x: number, items: InvItem[], sel: InvItem | null, onSel: (i: InvItem | null) => void, sub: (i: InvItem) => string, emptyMsg: string, allowNone: boolean): void => {
      let y = top + 22;
      if (allowNone) {
        const isSel = sel === null;
        const bg = sc.add.rectangle(x, y, COL_W, ROW_H - 2, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
        const name = sc.add.text(x + 6, y + 3, '나중에 올린다', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#c8d8e8' });
        bg.setInteractive({ useHandCursor: true }); bg.on('pointerdown', () => { onSel(null); this.render(); });
        this.content.add([bg, name]);
        y += ROW_H;
      }
      if (items.length === 0) {
        const t = sc.add.text(x, y, emptyMsg, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8a97a8', wordWrap: { width: COL_W } });
        this.content.add(t);
        return;
      }
      for (const it of items.slice(0, 6)) {
        const isSel = sel?.id === it.id;
        const bg = sc.add.rectangle(x, y, COL_W, ROW_H - 2, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
        const name = sc.add.text(x + 6, y + 3, it.name, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#e8f4fd' });
        clampTextWidth(name, COL_W - 66);
        const right = sc.add.text(x + COL_W - 6, y + 3, `${sub(it)} x${it.qty}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8fbfd8' }).setOrigin(1, 0);
        bg.setInteractive({ useHandCursor: true }); bg.on('pointerdown', () => { onSel(it); this.render(); });
        this.content.add([bg, name, right]);
        y += ROW_H;
      }
    };
    list(14, stoves, this.selStove, (i) => { this.selStove = i; }, (i) => `${getHeatSource(i.stoveHeatId ?? '')?.maxHeatW ?? 0}W`, '없음 — 식자재마트', false);
    list(14 + COL_W + 10, fuels, this.selFuel, (i) => { this.selFuel = i; }, (i) => `${getFuel(i.fuelId ?? '')?.minutesPerUnit ?? 0}분`, '없음 — 식자재마트', false);
    list(14 + (COL_W + 10) * 2, wares, this.selWare, (i) => { this.selWare = i; }, (i) => getCookware(i.cookwareId ?? '')?.kind === 'pot' ? '냄비' : getCookware(i.cookwareId ?? '')?.kind === 'pan' ? '팬' : '석쇠', '없음 — 나중에 올려도 된다', true);

    // 안내 — 흐름 배치
    const infoY = top + 22 + ROW_H * 7 + 4;
    const src = this.selStove ? getHeatSource(this.selStove.stoveHeatId ?? '') : undefined;
    const lines: string[] = [];
    if (src) lines.push(`${src.nameKo} — 최대 ${src.maxHeatW}W · 바람 취약 ${Math.round(src.windSensitivity * 100)}% (3m/s 초과부터 화력이 준다)`);
    lines.push('캐니스터는 끼우는 순간 소모된다 — 화구를 회수해도 남은 연료는 돌아오지 않는다.');
    lines.push('약불은 보온(끓지도 졸지도 않음) · 중불은 끓이기 · 강불은 빨리 끓이되 방치하면 졸아붙어 탄다.');
    const info = sc.add.text(14, infoY, lines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8fa8bf', wordWrap: { width: PANEL_W - 28 }, lineSpacing: 3,
    });
    this.content.add(info);

    const canGo = !!this.selStove && !!this.selFuel;
    const by = PANEL_H - 30;
    const btn = sc.add.rectangle(PANEL_W / 2, by, 220, 28, canGo ? 0x1f5a3a : 0x2a3340, 1).setStrokeStyle(1, canGo ? 0x4af2a1 : 0x3a4a5a, 1);
    const bt = sc.add.text(PANEL_W / 2, by, '설치 위치 고르기', { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: canGo ? '#e8fff0' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
    if (canGo) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { const s = this.selStove!, f = this.selFuel!, w = this.selWare; this.cbs.onClose(); this.cbs.onPick(s, f, w); });
    }
    this.content.add([btn, bt]);
    enforceTextBounds(this.content, PANEL_W - 10, 'StoveDeployPanel');
    this.applyFix();
  }
}
