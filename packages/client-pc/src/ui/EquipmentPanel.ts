/**
 * @file EquipmentPanel.ts
 * @description 장비 창 (E 키 토글, 드래그 이동 가능)
 *
 * 물리 공간에 작용하는 매개변수(무게/탄성/마찰)를 장착하는 세팅창.
 * 부위별 착용 아이템과 핵심 물리 파라미터 요약을 표시하고,
 * [해제] 버튼으로 착용을 풀 수 있다. (착용은 인벤토리 우클릭 → 착용하기)
 */

import Phaser from 'phaser';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { DraggablePanel } from './DraggablePanel.js';
import { buildItemDetail } from './ItemDetailPanel.js';

const PANEL_W = 420;
const PANEL_H = 620;

/** 장비 부위 슬롯 정의 — hand 지정 시 손 착용 도구 조회, 아니면 subCategory 매핑 */
const EQUIP_SLOTS: { part: string; note: string; hand?: 'L' | 'R' }[] = [
  { part: '손(우)', note: '낚싯대/뜰채 — 인벤토리 우클릭 → 오른손 착용', hand: 'R' },
  { part: '손(좌)', note: '낚싯대/뜰채 — 인벤토리 우클릭 → 왼손 착용', hand: 'L' },
  { part: '릴',     note: '드랙 시스템 — 릴링 속도/최대 드랙 장력' },
  { part: '모자',   note: '일사 차단 / 보온' },
  { part: '안경',   note: '편광 — 수심 경계선/여밭 투영' },
  { part: '상의',   note: '보온 / 피로도 완화' },
  { part: '장갑',   note: '라인 컨트롤 / 보호' },
  { part: '시계',   note: '물때 사이클 표시' },
  { part: '하의',   note: '방수 / 보온' },
  { part: '신발',   note: '접지 마찰 계수 — 미끄러짐 방지' },
];

export class EquipmentPanel extends DraggablePanel {
  private listContainer!: Phaser.GameObjects.Container;
  private onChanged: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void, onChanged: () => void) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '장비', onClose, depth: 810 });
    this.onChanged = onChanged;

    const hint = scene.add.text(70, 16, '착용: 인벤토리(I) 우클릭 → 착용하기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#607b8e',
    }).setOrigin(0, 0.5);
    this.add(hint);

    this.listContainer = scene.add.container(0, 0);
    this.add(this.listContainer);
    this.renderList();

    scene.events.on('inventory-changed', this.renderList, this);
  }

  private renderList = (): void => {
    if (!this.scene) return;
    this.listContainer.removeAll(true);

    const rowH = 52;
    EQUIP_SLOTS.forEach((slot, i) => {
      const ry = this.contentTop + 8 + i * (rowH + 4);
      const item: InvItem | undefined = slot.hand
        ? InventoryStore.getHandEquipped(slot.hand)
        : InventoryStore.getEquipped(slot.part);

      const bg = this.scene.add.graphics();
      bg.fillStyle(item ? 0x0e2a1e : 0x0e1c2d, 0.92);
      bg.fillRoundedRect(14, ry, PANEL_W - 28, rowH, 4);
      bg.lineStyle(1.2, item ? 0x2f7d5a : 0x1f3d5a, 0.9);
      bg.strokeRoundedRect(14, ry, PANEL_W - 28, rowH, 4);
      this.listContainer.add(bg);

      const partLbl = this.scene.add.text(24, ry + 8, slot.part, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#c8a060', fontStyle: 'bold',
      });
      this.listContainer.add(partLbl);

      if (item) {
        const icon = this.scene.add.text(96, ry + rowH / 2, item.icon, { fontSize: '20px' }).setOrigin(0.5);
        const name = this.scene.add.text(116, ry + 8, item.name, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#e8f4fd', fontStyle: 'bold',
        });
        // 첫 물리 파라미터 요약
        const detail = buildItemDetail(item);
        const firstRow = detail.rows[0];
        const param = this.scene.add.text(116, ry + 28, firstRow ? `${firstRow.label}: ${firstRow.value}` : '', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7fe6b0',
        });
        this.listContainer.add([icon, name, param]);

        // 해제 버튼
        const unequipBg = this.scene.add.graphics();
        unequipBg.fillStyle(0x3a2020, 0.95);
        unequipBg.fillRoundedRect(PANEL_W - 78, ry + 12, 52, 26, 4);
        unequipBg.lineStyle(1, 0x8a4a4a, 0.9);
        unequipBg.strokeRoundedRect(PANEL_W - 78, ry + 12, 52, 26, 4);
        const unequipTxt = this.scene.add.text(PANEL_W - 52, ry + 25, '해제', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ff9a9a', fontStyle: 'bold',
        }).setOrigin(0.5);
        const unequipHit = this.scene.add.rectangle(PANEL_W - 52, ry + 25, 52, 26, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        unequipHit.on('pointerover', () => unequipTxt.setColor('#ffffff'));
        unequipHit.on('pointerout', () => unequipTxt.setColor('#ff9a9a'));
        unequipHit.on('pointerdown', () => {
          InventoryStore.toggleEquip(item.id);
          this.renderList();
          this.onChanged();
        });
        this.listContainer.add([unequipBg, unequipTxt, unequipHit]);
      } else {
        const empty = this.scene.add.text(116, ry + 8, '비어있음', {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#4a5a68',
        });
        const note = this.scene.add.text(116, ry + 28, slot.note, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#4a5a68',
        });
        this.listContainer.add([empty, note]);
      }
    });

    this.applyFix();
  };

  override destroy(fromScene?: boolean): void {
    this.scene?.events?.off('inventory-changed', this.renderList, this);
    super.destroy(fromScene);
  }
}
