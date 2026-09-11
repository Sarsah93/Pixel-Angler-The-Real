/**
 * @file CraftBoard.ts
 * @description 제작 보드 (129차 P7) — 좌측 도면 목록 › 우측 상세·수량·제작
 *
 * **U 창 '제작' 탭(핸드크래프팅)** 과 **고급 제작대 [F] 팝업**이 이 컴포넌트 하나를 공유한다
 * (station만 다르다 — 124차 정정 설계 §2-5).
 *
 * UI 규칙(AGENTS §4): 이모지·텍스트 장식 금지. 상태는 **색 + 도형**으로 표시하고,
 * 목록은 마스크가 아니라 **보이는 행만 생성**한다(마스크는 팬텀 히트를 남긴다 — ui-panel 스킬).
 */

import Phaser from 'phaser';
import { CRAFT_GROUP_LABEL, type CraftBlueprint, type CraftStation } from '@tra/core';
import { CraftingStore, type CraftCheck } from '../store/CraftingStore.js';
import { clampTextWidth } from './TextFit.js';

const FONT = '"Noto Sans KR", sans-serif';
const ROW_H = 26;

export interface CraftBoardOpts {
  station: CraftStation;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 제작 후 호출 — 호출측이 인벤토리 갱신 이벤트를 쏜다 */
  onCrafted?: () => void;
}

/**
 * 컨테이너 하나에 제작 보드를 그린다. 상태(선택 도면·수량·스크롤)는 인스턴스가 갖고,
 * `render()`가 컨테이너를 비우고 다시 그린다(패널들의 기존 렌더 패턴과 동일).
 */
export class CraftBoard {
  private selectedId: string | null = null;
  private qty = 1;
  private scrollRow = 0;
  private status = '';
  private wheelHandler: ((p: Phaser.Input.Pointer, o: unknown[], dx: number, dy: number) => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly container: Phaser.GameObjects.Container,
    private readonly o: CraftBoardOpts,
  ) {}

  /** 씬 레벨 휠 핸들러 해제 — 호출측 destroy에서 반드시 부른다 */
  destroy(): void {
    if (this.wheelHandler) {
      this.scene.input.off('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }
  }

  render(): void {
    const { x, y, w, h } = this.o;
    const listW = Math.min(340, Math.round(w * 0.34));
    const detX = x + listW + 16;
    const detW = w - listW - 16;

    const bps = CraftingStore.blueprints(this.o.station);
    if (this.selectedId === null && bps.length > 0) this.selectedId = bps[0].id;

    this.drawFrame(x, y, listW, h, '도면');
    this.drawFrame(detX, y, detW, h, '상세');
    this.renderList(bps, x, y, listW, h);
    const sel = bps.find((b) => b.id === this.selectedId) ?? null;
    this.renderDetail(sel, detX, y, detW, h);
  }

  // ── 좌측: 도면 목록 (그룹 헤더 + 행) ──────────────────

  private renderList(bps: CraftBlueprint[], x: number, y: number, w: number, h: number): void {
    // 그룹 헤더를 끼워 평탄화 — 헤더도 한 행을 차지한다(윈도우드 렌더 계산 단순화)
    type Row = { kind: 'head'; label: string } | { kind: 'bp'; bp: CraftBlueprint };
    const rows: Row[] = [];
    let lastGroup = '';
    for (const bp of bps) {
      if (bp.group !== lastGroup) {
        rows.push({ kind: 'head', label: CRAFT_GROUP_LABEL[bp.group].ko });
        lastGroup = bp.group;
      }
      rows.push({ kind: 'bp', bp });
    }
    const top = y + 30;
    const visible = Math.max(1, Math.floor((h - 42) / ROW_H));
    const maxScroll = Math.max(0, rows.length - visible);
    this.scrollRow = Phaser.Math.Clamp(this.scrollRow, 0, maxScroll);

    for (let i = 0; i < visible; i++) {
      const r = rows[this.scrollRow + i];
      if (!r) break;
      const ry = top + i * ROW_H;
      if (r.kind === 'head') {
        const t = this.scene.add.text(x + 12, ry + 6, r.label, {
          fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3',
        });
        this.container.add(t);
        continue;
      }
      const bp = r.bp;
      const chk = CraftingStore.check(bp, 1);
      const selected = bp.id === this.selectedId;
      const g = this.scene.add.graphics();
      if (selected) {
        g.fillStyle(0x155a7c, 0.85);
        g.fillRoundedRect(x + 6, ry + 1, w - 12, ROW_H - 3, 3);
      }
      // 상태 칩 — 초록=가능 / 회색=재료 부족 / 주황=스킬 잠김 (색으로만 구분, 글자 배지 금지)
      const chip = !CraftingStore.unlocked(bp) ? 0xffa040 : chk.ok ? 0x4af2a1 : 0x5a6a78;
      g.fillStyle(chip, 1);
      g.fillRect(x + 12, ry + ROW_H / 2 - 4, 7, 7);
      this.container.add(g);

      const label = this.scene.add.text(x + 26, ry + 5, bp.nameKo, {
        fontFamily: FONT, fontSize: '12px',
        color: selected ? '#aee8ff' : chk.ok ? '#d8e6f2' : '#8195a6',
      });
      clampTextWidth(label, w - 40);
      this.container.add(label);

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
      const info = this.scene.add.text(x + w - 12, y + 12,
        `${this.scrollRow + 1}–${Math.min(rows.length, this.scrollRow + visible)} / ${rows.length}`, {
          fontFamily: FONT, fontSize: '10px', color: '#6f8ba3',
        }).setOrigin(1, 0);
      this.container.add(info);
      if (!this.wheelHandler) {
        this.wheelHandler = (p, _o, _dx, dy) => {
          const inside = p.x >= this.o.x && p.x <= this.o.x + w
            && p.y >= this.o.y && p.y <= this.o.y + h;
          if (!inside) return;
          this.scrollRow = Phaser.Math.Clamp(this.scrollRow + (dy > 0 ? 1 : -1), 0, maxScroll);
          this.redraw();
        };
        this.scene.input.on('wheel', this.wheelHandler);
      }
    }
  }

  // ── 우측: 상세 ──────────────────────────────────────

  private renderDetail(bp: CraftBlueprint | null, x: number, y: number, w: number, h: number): void {
    if (!bp) {
      this.container.add(this.scene.add.text(x + 16, y + 40, '도면이 없습니다.', {
        fontFamily: FONT, fontSize: '12px', color: '#8195a6',
      }));
      return;
    }
    const chk = CraftingStore.check(bp, this.qty);
    let cy = y + 32;

    const title = this.scene.add.text(x + 16, cy, bp.nameKo, {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffe28a',
    });
    this.container.add(title);
    cy += 24;

    // 설명 — wordWrap 아래는 고정 y 금지(§4). 실측 높이로 흘려 배치한다.
    const desc = this.scene.add.text(x + 16, cy, bp.descKo, {
      fontFamily: FONT, fontSize: '12px', color: '#b9cad8', lineSpacing: 4,
      wordWrap: { width: w - 32 },
    });
    this.container.add(desc);
    cy += desc.height + 14;

    const out = this.scene.add.text(x + 16, cy,
      `산출  ${bp.outputQty}개 · 성공률 ${Math.round(CraftingStore.successRate(bp) * 100)}%`
      + ` · 재료 절약 ${Math.round(CraftingStore.saveChance(bp) * 100)}%`, {
        fontFamily: FONT, fontSize: '12px', color: '#8fd9ff',
      });
    this.container.add(out);
    cy += 24;

    this.container.add(this.scene.add.text(x + 16, cy, '필요 재료', {
      fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3',
    }));
    cy += 18;
    for (const m of chk.materials) {
      const g = this.scene.add.graphics();
      g.fillStyle(m.ok ? 0x4af2a1 : 0xff6b6b, 1);
      g.fillRect(x + 18, cy + 5, 6, 6);
      this.container.add(g);
      const t = this.scene.add.text(x + 32, cy, `${m.material.nameKo}   ${m.have} / ${m.need}`, {
        fontFamily: FONT, fontSize: '12px', color: m.ok ? '#d8e6f2' : '#ff9a9a',
      });
      clampTextWidth(t, w - 60);
      this.container.add(t);
      cy += 20;
    }
    cy += 10;

    // 수량 조절 — −/+/최대
    const btnY = cy;
    this.qty = Math.max(1, Math.min(this.qty, Math.max(1, chk.maxQty)));
    this.mkButton(x + 16, btnY, 30, '−', () => { this.qty = Math.max(1, this.qty - 1); this.redraw(); });
    const qt = this.scene.add.text(x + 56, btnY + 6, `${this.qty}`, {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5, 0);
    this.container.add(qt);
    this.mkButton(x + 76, btnY, 30, '+', () => {
      this.qty = Math.min(Math.max(1, chk.maxQty), this.qty + 1); this.redraw();
    });
    this.mkButton(x + 114, btnY, 52, '최대', () => { this.qty = Math.max(1, chk.maxQty); this.redraw(); });

    const canCraft = chk.ok;
    this.mkButton(x + 180, btnY, 96, '제작', () => this.doCraft(bp), canCraft);
    cy += 40;

    if (!canCraft && chk.reason) {
      const r = this.scene.add.text(x + 16, cy, chk.reason, {
        fontFamily: FONT, fontSize: '12px', color: '#ffa040', wordWrap: { width: w - 32 },
      });
      this.container.add(r);
      cy += r.height + 8;
    }
    if (this.status) {
      const s = this.scene.add.text(x + 16, cy, this.status, {
        fontFamily: FONT, fontSize: '12px', color: '#4af2a1', wordWrap: { width: w - 32 },
      });
      this.container.add(s);
    }
    // 하단 안내 — 밑밥은 도면이 아니라 전용 탭이 담당한다(중복 정의 금지)
    this.container.add(this.scene.add.text(x + 16, y + h - 22,
      this.o.station === 'hand'
        ? '밑밥 배합은 [밑밥 품질] 탭에서 합니다 · 고급 품목은 설치한 제작대에서 [F]'
        : '고급 제작대 — 로드·릴·루어 튜닝 전용', {
        fontFamily: FONT, fontSize: '11px', color: '#6f8ba3',
      }));
  }

  private doCraft(bp: CraftBlueprint): void {
    const r = CraftingStore.craft(bp, this.qty);
    if (r.attempted === 0) { this.status = '재료가 부족합니다.'; this.redraw(); return; }
    const parts = [`${r.outputName} ${r.outputQty}개 제작`];
    if (r.failed > 0) parts.push(`실패 ${r.failed}회`);
    if (r.savedMaterials > 0) parts.push(`재료 ${r.savedMaterials}개 절약`);
    if (r.dropped > 0) parts.push(`칸 부족으로 ${r.dropped}개 유실`);
    this.status = parts.join(' · ');
    this.o.onCrafted?.();
    this.redraw();
  }

  // ── 공통 ─────────────────────────────────────────────

  private mkButton(x: number, y: number, w: number, label: string, run: () => void, enabled = true): void {
    const H = 28;
    const g = this.scene.add.graphics();
    g.fillStyle(enabled ? 0x155a7c : 0x22303c, enabled ? 0.95 : 0.7);
    g.fillRoundedRect(x, y, w, H, 4);
    g.lineStyle(1.2, enabled ? 0x5cd0ff : 0x33414d, 0.9);
    g.strokeRoundedRect(x, y, w, H, 4);
    this.container.add(g);
    const t = this.scene.add.text(x + w / 2, y + H / 2, label, {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold',
      color: enabled ? '#aee8ff' : '#5a6a78',
    }).setOrigin(0.5);
    this.container.add(t);
    if (!enabled) return;
    const hit = this.scene.add.rectangle(x + w / 2, y + H / 2, w, H, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', run);
    this.container.add(hit);
  }

  private drawFrame(x: number, y: number, w: number, h: number, label: string): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x0b1520, 0.9);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(1.5, 0x1f3d5a, 0.95);
    g.strokeRoundedRect(x, y, w, h, 6);
    this.container.add(g);
    this.container.add(this.scene.add.text(x + 12, y + 8, label, {
      fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#6f8ba3',
    }));
  }

  /** 컨테이너를 비우고 다시 그린다 (호출측 renderBody와 동일 패턴) */
  private redraw(): void {
    this.container.removeAll(true);
    this.render();
  }
}

export type { CraftCheck };
