/**
 * @file EquipmentPanel.ts
 * @description 장비 창 (E 키 토글, 드래그 이동 가능) — 2026-08-05 인체 배치형으로 전면 개편
 *
 * 레이아웃 (사용자 도식):
 *   - 가운데 큰 사각형 = **현재 캐릭터 렌더**
 *   - 그 위 4칸  = 머리 계열 (모자/안경/마스크/넥) — 좌우 모서리는 확장 예약 공간(빈 채로 유지)
 *   - 왼쪽 6칸   = 왼쪽 어깨 → 팔 → 손 → 손가락
 *   - 오른쪽 6칸 = 오른쪽 어깨 → 팔 → 손 → 손가락
 *   - 아래 6칸   = 하의 → 발가락 (가운데 밀착 2열 — 좌 세로 3칸 = 왼발 / 우 세로 3칸 = 오른발.
 *                  그 좌우 2열씩(6칸씩)은 추후 확장 예약 공간으로 비워둔다)
 *
 * 조작:
 *   - 슬롯 **우클릭 = 해제** (인벤토리 칸이 없으면 "아이템 창 공간이 부족합니다.")
 *   - **인벤토리에서 슬롯으로 드래그 = 장착** (`inventory-drop` 씬 이벤트 수신)
 *   - 슬롯 호버 = 아이템명/물리 파라미터 툴팁
 *
 * 좌우 한 쌍 장비(장갑·하의·양말·신발)는 한 아이템이 양쪽 슬롯에 함께 표시된다.
 */

import Phaser from 'phaser';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import type { InvDropResult } from './InventoryPanel.js';
import { DraggablePanel } from './DraggablePanel.js';
import { buildItemDetail } from './ItemDetailPanel.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth } from './TextFit.js';

// ── 지오메트리 ──────────────────────────────────────
const S = 52;              // 소켓 한 변 (퀵슬롯과 동급)
const GAP = 6;
const PAD_X = 16;
const HEAD_COLS = 4;

const COL_L_X = PAD_X;                                   // 좌측 열 x
const CENTER_X = COL_L_X + S + 10;                       // 캐릭터 박스 x
const CENTER_W = HEAD_COLS * S + (HEAD_COLS - 1) * GAP;  // 226
const COL_R_X = CENTER_X + CENTER_W + 10;
const PANEL_W = COL_R_X + S + PAD_X;                     // 382

const HEAD_Y = 46;
const BODY_Y = HEAD_Y + S + 10;                          // 캐릭터/좌우 열 시작
const COL_H = 6 * S + 5 * GAP;                           // 342
const LEGS_Y = BODY_Y + COL_H + 10;
const LEGS_H = 3 * S + 2 * GAP;                          // 168
const PANEL_H = LEGS_Y + LEGS_H + 46;                    // 하단 상태줄 포함

/**
 * 다리 블록 — 하단은 **6열 그리드 폭을 예약**하고 가운데 2열만 사용한다 (사용자 지시 2026-08-05):
 *   [예약][예약][왼발][오른발][예약][예약]  × 3행
 * 좌·우 바깥 2열(6칸씩)은 추후 확장 공간이라 비워둔다. 왼발/오른발 열은 표준 GAP으로 밀착.
 * (상단 머리 행의 좌우 모서리 빈 영역도 동일하게 확장 예약 — 슬롯을 그리지 않고 남겨둔다.)
 */
const LEGS_COLS = 6;
const LEGS_GRID_W = LEGS_COLS * S + (LEGS_COLS - 1) * GAP;      // 342
const LEGS_X0 = Math.round((PANEL_W - LEGS_GRID_W) / 2);        // 20
const LEG_L_X = LEGS_X0 + 2 * (S + GAP);                        // 왼발 열 (가운데 좌측)
const LEG_R_X = LEGS_X0 + 3 * (S + GAP);                        // 오른발 열 (가운데 우측)

// ── 슬롯 정의 ───────────────────────────────────────
/**
 * part 지정 = 해당 subCategory 장비 슬롯 / hand 지정 = 손 도구 슬롯 /
 * 둘 다 없으면 **예약 슬롯**(아직 아이템이 없는 부위 — 확장 자리).
 */
interface EquipSlotDef {
  key: string;
  label: string;
  /** 빈 슬롯 실루엣 (아이콘 대신 흐린 이모지) */
  ghost: string;
  part?: string;
  hand?: 'L' | 'R';
  /** 좌우 한 쌍 — 같은 아이템이 양쪽 슬롯에 표시된다 */
  pair?: boolean;
  note: string;
}

const HEAD_SLOTS: EquipSlotDef[] = [
  { key: 'hat',    label: '모자',   ghost: '🧢', part: '모자', note: '일사 차단 / 보온' },
  { key: 'eye',    label: '안경',   ghost: '🕶️', part: '안경', note: '편광 — 수심 경계선/여밭 투영' },
  { key: 'mask',   label: '마스크', ghost: '😷', note: '방한 / 자외선 차단 (준비 중)' },
  { key: 'neck',   label: '넥워머', ghost: '🧣', note: '목 보온 (준비 중)' },
];

const LEFT_SLOTS: EquipSlotDef[] = [
  { key: 'shoulder_l', label: '어깨(좌)', ghost: '🎽', note: '어깨 보호대 (준비 중)' },
  { key: 'top',        label: '상의',     ghost: '👕', part: '상의', note: '보온 / 피로도 완화' },
  { key: 'arm_l',      label: '팔(좌)',   ghost: '🩹', note: '팔토시 — 자외선/찰과 보호 (준비 중)' },
  { key: 'glove_l',    label: '장갑',     ghost: '🧤', part: '장갑', pair: true, note: '라인 컨트롤 / 보호' },
  { key: 'hand_l',     label: '손(좌)',   ghost: '🤚', hand: 'L', note: '낚싯대 / 뜰채 / 회칼' },
  { key: 'ring_l',     label: '반지(좌)', ghost: '💍', note: '장신구 (준비 중)' },
];

const RIGHT_SLOTS: EquipSlotDef[] = [
  { key: 'shoulder_r', label: '어깨(우)', ghost: '🎽', note: '어깨 보호대 (준비 중)' },
  { key: 'reel',       label: '릴',       ghost: '⚙️', part: '릴', note: '드랙 시스템 — 릴링 속도/최대 드랙 장력' },
  { key: 'watch',      label: '시계',     ghost: '⌚', part: '시계', note: '물때 사이클 표시' },
  { key: 'glove_r',    label: '장갑',     ghost: '🧤', part: '장갑', pair: true, note: '라인 컨트롤 / 보호' },
  { key: 'hand_r',     label: '손(우)',   ghost: '✋', hand: 'R', note: '낚싯대 / 뜰채 / 회칼' },
  { key: 'ring_r',     label: '반지(우)', ghost: '💍', note: '장신구 (준비 중)' },
];

/** 다리 — 3행 × 좌/우 2열 (한 쌍 장비라 같은 아이템이 양쪽에 표시된다) */
const LEG_SLOTS: EquipSlotDef[] = [
  { key: 'pants', label: '하의', ghost: '👖', part: '하의', pair: true, note: '방수 / 보온' },
  { key: 'socks', label: '양말', ghost: '🧦', pair: true, note: '보온 / 물집 방지 (준비 중)' },
  { key: 'shoes', label: '신발', ghost: '👟', part: '신발', pair: true, note: '접지 마찰 계수 — 미끄러짐 방지' },
];

/** 렌더된 슬롯 히트 정보 (드랍 라우팅용 — 패널 로컬 좌표) */
interface SlotRect { def: EquipSlotDef; x: number; y: number; }

export class EquipmentPanel extends DraggablePanel {
  private bodyC!: Phaser.GameObjects.Container;
  private tooltip?: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private onChanged: () => void;
  private rects: SlotRect[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void, onChanged: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '장비', onClose, depth: 810 });
    this.onChanged = onChanged;

    const hint = scene.add.text(64, 16, '인벤토리에서 드래그 = 장착 · 우클릭 = 해제', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#607b8e',
    }).setOrigin(0, 0.5);
    this.add(hint);

    this.statusText = scene.add.text(PANEL_W / 2, PANEL_H - 24, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fd0e4',
      wordWrap: { width: PANEL_W - 32 }, align: 'center',
    }).setOrigin(0.5);
    this.add(this.statusText);

    this.bodyC = scene.add.container(0, 0);
    this.add(this.bodyC);
    this.render();

    scene.events.on('inventory-changed', this.render, this);
    scene.events.on('inventory-drop', this.onInventoryDrop, this);
  }

  // ═══════════════════════════════════════════════════
  // 렌더
  // ═══════════════════════════════════════════════════
  private render = (): void => {
    if (!this.scene) return;
    this.closeTooltip();
    this.bodyC.removeAll(true);
    this.rects = [];

    this.drawCharacterBox();

    HEAD_SLOTS.forEach((def, i) => {
      this.drawSlot(def, CENTER_X + i * (S + GAP), HEAD_Y);
    });
    LEFT_SLOTS.forEach((def, i) => this.drawSlot(def, COL_L_X, BODY_Y + i * (S + GAP)));
    RIGHT_SLOTS.forEach((def, i) => this.drawSlot(def, COL_R_X, BODY_Y + i * (S + GAP)));
    LEG_SLOTS.forEach((def, i) => {
      const ly = LEGS_Y + i * (S + GAP);
      this.drawSlot(def, LEG_L_X, ly);
      this.drawSlot(def, LEG_R_X, ly);
    });

    this.applyFix();
  };

  /** 가운데 캐릭터 렌더 박스 — 현재 플레이어 스프라이트 + 바닥 그림자 */
  private drawCharacterBox(): void {
    const g = this.scene.add.graphics();
    // 은은한 수직 그라데이션 대용 — 3겹 라운드 박스
    g.fillStyle(0x0b1524, 0.96);
    g.fillRoundedRect(CENTER_X, BODY_Y, CENTER_W, COL_H, 8);
    g.fillStyle(0x11233a, 0.55);
    g.fillRoundedRect(CENTER_X + 6, BODY_Y + 6, CENTER_W - 12, COL_H * 0.55, 8);
    g.lineStyle(1.5, 0x2a5a8a, 0.9);
    g.strokeRoundedRect(CENTER_X, BODY_Y, CENTER_W, COL_H, 8);
    this.bodyC.add(g);

    const cx = CENTER_X + CENTER_W / 2;
    const groundY = BODY_Y + COL_H - 54;

    // 발밑 광원 + 그림자
    const glow = this.scene.add.ellipse(cx, groundY + 6, 132, 34, 0x2a5a8a, 0.35);
    const shadow = this.scene.add.ellipse(cx, groundY + 8, 74, 18, 0x000000, 0.45);
    this.bodyC.add([glow, shadow]);

    const texKey = 'man-idle-front';
    if (this.scene.textures.exists(texKey)) {
      const src = this.scene.textures.get(texKey).getSourceImage() as { width: number; height: number };
      const targetH = COL_H - 150;
      const k = targetH / src.height;
      const spr = this.scene.add.image(cx, groundY, texKey)
        .setOrigin(0.5, 1)
        .setDisplaySize(Math.round(src.width * k), Math.round(src.height * k));
      this.bodyC.add(spr);
    }

    const nameTxt = clampTextWidth(this.scene.add.text(cx, BODY_Y + 12, '착용 현황', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf',
    }).setOrigin(0.5, 0), CENTER_W - 24);
    this.bodyC.add(nameTxt);

    // 착용 요약 (부위 수 / 총 가치)
    const worn = InventoryStore.items.filter((i) => i.equipped);
    const value = worn.reduce((s, i) => s + i.basePrice, 0);
    const sum = clampTextWidth(this.scene.add.text(cx, BODY_Y + COL_H - 30,
      `${worn.length}부위 착용  ·  ${value.toLocaleString()}원`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060',
      }).setOrigin(0.5, 0), CENTER_W - 24);
    this.bodyC.add(sum);
  }

  /** 슬롯 하나 — 착용 아이템이 있으면 아이콘, 없으면 흐린 실루엣 + 부위명 */
  private drawSlot(def: EquipSlotDef, sx: number, sy: number): void {
    const item = this.itemOf(def);
    this.rects.push({ def, x: sx, y: sy });

    const box = this.scene.add.graphics();
    this.paintBox(box, sx, sy, !!item, false);
    this.bodyC.add(box);

    if (item) {
      const icon = createItemIcon(this.scene, sx + S / 2, sy + S / 2 - 4, item, 26);
      this.bodyC.add(icon);
      const lbl = clampTextWidth(this.scene.add.text(sx + S / 2, sy + S - 12, def.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#7fe6b0',
      }).setOrigin(0.5, 0), S - 6);
      this.bodyC.add(lbl);
    } else {
      const ghost = this.scene.add.text(sx + S / 2, sy + S / 2 - 6, def.ghost, { fontSize: '20px' })
        .setOrigin(0.5).setAlpha(def.part || def.hand ? 0.3 : 0.16);
      const lbl = clampTextWidth(this.scene.add.text(sx + S / 2, sy + S - 13, def.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px',
        color: def.part || def.hand ? '#4a6a80' : '#33475a',
      }).setOrigin(0.5, 0), S - 6);
      this.bodyC.add([ghost, lbl]);
    }

    const hit = this.scene.add.rectangle(sx + S / 2, sy + S / 2, S, S, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', (p: Phaser.Input.Pointer) => {
      this.paintBox(box, sx, sy, !!item, true);
      this.showTooltip(def, item, sx, sy, p);
    });
    hit.on('pointerout', () => {
      this.paintBox(box, sx, sy, !!item, false);
      this.closeTooltip();
    });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.unequipSlot(def);
      else if (item) this.setStatus(`${item.name}  ·  ${def.label}  (우클릭 = 해제)`);
      else this.setStatus(`${def.label} — ${def.note}`);
    });
    this.bodyC.add(hit);
  }

  private paintBox(g: Phaser.GameObjects.Graphics, sx: number, sy: number, filled: boolean, hover: boolean): void {
    g.clear();
    g.fillStyle(hover ? 0x16324a : (filled ? 0x0e2a1e : 0x0e1c2d), filled || hover ? 0.96 : 0.9);
    g.fillRoundedRect(sx, sy, S, S, 5);
    const stroke = hover ? 0x5cd0ff : (filled ? 0x2f7d5a : 0x1f3d5a);
    g.lineStyle(hover ? 1.8 : 1.2, stroke, filled || hover ? 1 : 0.75);
    g.strokeRoundedRect(sx, sy, S, S, 5);
  }

  /** 슬롯에 해당하는 착용 아이템 */
  private itemOf(def: EquipSlotDef): InvItem | undefined {
    if (def.hand) return InventoryStore.getHandEquipped(def.hand);
    if (def.part) return InventoryStore.getEquipped(def.part);
    return undefined;
  }

  // ═══════════════════════════════════════════════════
  // 툴팁
  // ═══════════════════════════════════════════════════
  private showTooltip(def: EquipSlotDef, item: InvItem | undefined, sx: number, sy: number, _p: Phaser.Input.Pointer): void {
    this.closeTooltip();
    const lines: string[] = [];
    if (item) {
      const detail = buildItemDetail(item);
      detail.rows.slice(0, 3).forEach((r) => lines.push(`${r.label}: ${r.value}`));
      lines.push('우클릭 = 해제');
    } else {
      lines.push(def.note);
      if (def.part || def.hand) lines.push('인벤토리에서 드래그해 장착');
    }
    const title = item ? item.name : `${def.label}${def.pair ? ' (한 쌍)' : ''} — 비어있음`;

    const W = 188;
    const tc = this.scene.add.container(0, 0);
    const t = this.scene.add.text(10, 8, title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
      color: item ? '#e8f4fd' : '#8faabf', fontStyle: 'bold',
      wordWrap: { width: W - 20 },
    });
    const b = this.scene.add.text(10, 10 + t.height + 4, lines.join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#9fc0d4',
      lineSpacing: 4, wordWrap: { width: W - 20 },
    });
    const H = 18 + t.height + 4 + b.height;

    // 슬롯 오른쪽에 붙이되 패널/화면 밖으로 나가지 않게 좌측으로 반전
    let tx = sx + S + 8;
    if (this.x + tx + W > 1272) tx = sx - W - 8;
    let ty = sy;
    if (this.y + ty + H > 712) ty = 712 - this.y - H;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.98);
    bg.fillRoundedRect(0, 0, W, H, 5);
    bg.lineStyle(1.2, 0xc8a060, 0.9);
    bg.strokeRoundedRect(0, 0, W, H, 5);

    tc.add([bg, t, b]);
    tc.setPosition(tx, ty);
    this.add(tc);
    this.tooltip = tc;
    this.applyFix();
  }

  private closeTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = undefined;
  }

  // ═══════════════════════════════════════════════════
  // 장착 / 해제
  // ═══════════════════════════════════════════════════
  private unequipSlot(def: EquipSlotDef): void {
    const item = this.itemOf(def);
    if (!item) return;
    const r = InventoryStore.unequipItem(item.id);
    this.setStatus(r.ok ? `${item.name} 해제 — 인벤토리로 옮겼습니다.` : r.reason ?? '해제할 수 없습니다.');
    if (r.ok) {
      this.render();
      this.onChanged();
      this.scene.events.emit('inventory-changed');
    }
  }

  /** 인벤토리 드래그 드랍 수신 — 패널 위에 놓였으면 해당 슬롯에 장착 시도 */
  private onInventoryDrop = (item: InvItem, p: Phaser.Input.Pointer, res: InvDropResult): void => {
    if (!this.scene || res.handled) return;
    const lx = p.x - this.x;
    const ly = p.y - this.y;
    if (lx < 0 || ly < 0 || lx > PANEL_W || ly > PANEL_H) return;   // 패널 밖
    res.handled = true;

    const hitDef = this.rects.find((r) => lx >= r.x && lx <= r.x + S && ly >= r.y && ly <= r.y + S)?.def;
    // 슬롯이 아닌 패널 여백에 놓으면 아이템에 맞는 슬롯으로 자동 배정
    const def = hitDef ?? this.autoSlotFor(item);
    if (!def) {
      res.message = `${item.name} — 장착할 수 있는 부위가 없습니다.`;
      return;
    }
    res.message = this.equipInto(def, item);
    this.render();
    this.setStatus(res.message);   // render()가 슬롯만 다시 그리므로 상태줄은 그 뒤에
    this.onChanged();
  };

  /** 아이템에 맞는 기본 슬롯 (손 도구는 오른손 우선) */
  private autoSlotFor(item: InvItem): EquipSlotDef | undefined {
    if (!item.equippable) return undefined;
    if (item.tool) return RIGHT_SLOTS.find((d) => d.hand === 'R');
    return this.rects.map((r) => r.def).find((d) => d.part === item.subCategory);
  }

  /** 슬롯에 아이템 장착 — 결과 안내 문구 반환 */
  private equipInto(def: EquipSlotDef, item: InvItem): string {
    if (!item.equippable) return `${item.name}은(는) 착용할 수 없는 아이템입니다.`;
    if (def.hand) {
      if (!item.tool) return `${def.label} 슬롯에는 손에 드는 도구만 장착할 수 있습니다.`;
      const r = InventoryStore.equipHand(item.id, def.hand);
      return r.ok ? `${item.name} → ${def.label} 착용` : r.reason ?? '착용할 수 없습니다.';
    }
    if (!def.part) return `${def.label} 슬롯은 준비 중입니다.`;
    if (item.tool) return `${item.name}은(는) 손 슬롯에 장착하세요.`;
    if (item.subCategory !== def.part) return `${def.label} 슬롯에는 ${def.part} 장비만 장착할 수 있습니다.`;
    const r = InventoryStore.equipItem(item.id);
    return r.ok ? `${item.name} → ${def.label} 착용` : r.reason ?? '착용할 수 없습니다.';
  }

  private setStatus(msg: string): void {
    this.statusText.setText(msg);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('inventory-changed', this.render, this);
    this.scene?.events?.off('inventory-drop', this.onInventoryDrop, this);
    super.destroy(fromScene);
  }
}
