/**
 * @file CoolingBoxPanel.ts
 * @description 플레이어가 포획한 물고기 및 해루질 채취 생물을 보관하는 쿨러(보관함) UI 패널 (Phaser 3)
 */

import Phaser from 'phaser';
import type { CoolerSlotItem } from '@tra/core';

export class CoolingBoxPanel extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private itemsList: CoolerSlotItem[] = [];
  private listContainer?: Phaser.GameObjects.Container;
  private infoText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.loadCoolerItems();
    this.createUI();
  }

  private loadCoolerItems(): void {
    // 임시로 더미 아이템 4개 로드 (실제는 GameState에서 관리)
    this.itemsList = [
      {
        instanceId: 'demo_cooler_1',
        type: 'fish',
        speciesId: 'black_seabream',
        nameKo: '감성돔',
        weightGrams: 1200,
        condition: 'chilled',
        storedAtGameMinute: 0,
      },
      {
        instanceId: 'demo_cooler_2',
        type: 'fish',
        speciesId: 'black_rockfish',
        nameKo: '볼락',
        weightGrams: 300,
        condition: 'fresh',
        storedAtGameMinute: 0,
      },
      {
        instanceId: 'demo_cooler_3',
        type: 'crustacean',
        speciesId: 'portunus_trituberculatus',
        nameKo: '꽃게',
        weightGrams: 500,
        condition: 'live',
        storedAtGameMinute: 0,
      },
      {
        instanceId: 'demo_cooler_4',
        type: 'shellfish',
        speciesId: 'haliotis_discus',
        nameKo: '전복',
        weightGrams: 150,
        condition: 'live',
        storedAtGameMinute: 0,
      },
    ];
  }

  private createUI(): void {
    // 배경 창
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x051322, 0.95);
    this.bg.fillRoundedRect(-220, -180, 440, 360, 6);
    this.bg.lineStyle(2, 0x1f5f9f, 0.85);
    this.bg.strokeRoundedRect(-220, -180, 440, 360, 6);
    this.add(this.bg);

    // 타이틀
    const titleText = this.scene.add.text(0, -155, '❄️ 휴대용 아이스 쿨러', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: '#aaddff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    // 보냉율 및 무게 상태
    this.infoText = this.scene.add.text(0, -130, '🧊 보냉팩 상태: 92% | 내부 용량: 2.15 kg / 15.00 kg', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#8faabf',
    }).setOrigin(0.5);
    this.add(this.infoText);

    // 아이템 리스트 컨테이너
    this.listContainer = this.scene.add.container(-200, -100);
    this.add(this.listContainer);

    this.renderItems();

    // 닫기 힌트
    const closeHint = this.scene.add.text(0, 155, '닫으려면 패널 외부를 클릭하거나 ESC를 누르세요.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#557799',
    }).setOrigin(0.5);
    this.add(closeHint);
  }

  private renderItems(): void {
    this.listContainer?.removeAll(true);

    if (this.itemsList.length === 0) {
      const emptyText = this.scene.add.text(200, 100, '쿨러가 비어 있습니다.\n물고기나 해루질 수확물을 보관하세요.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#6688aa',
        align: 'center',
        lineSpacing: 6,
      }).setOrigin(0.5);
      this.listContainer?.add(emptyText);
      return;
    }

    this.itemsList.forEach((item, idx) => {
      const y = idx * 56;
      if (y > 220) return;

      const itemContainer = this.scene.add.container(0, y);

      const itemBg = this.scene.add.graphics();
      itemBg.fillStyle(0x0e223d, 0.7);
      itemBg.fillRoundedRect(0, -22, 400, 44, 4);
      itemBg.lineStyle(1, 0x1f5f9f, 0.4);
      itemBg.strokeRoundedRect(0, -22, 400, 44, 4);
      itemContainer.add(itemBg);

      // 아이콘 및 어종명
      const emoji = this.getItemEmoji(item.type);
      const nameTxt = this.scene.add.text(15, 0, `${emoji} ${item.nameKo}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      itemContainer.add(nameTxt);

      // 신선도 및 무게
      const detailTxt = this.scene.add.text(180, 0, `${item.weightGrams}g | 신선도: ${this.getConditionLabel(item.condition)}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#aaccff',
      }).setOrigin(0, 0.5);
      itemContainer.add(detailTxt);

      // 손질 버튼 (캐치앤쿡 진입)
      const cookBtnBg = this.scene.add.graphics();
      cookBtnBg.fillStyle(0x884400, 0.9);
      cookBtnBg.fillRoundedRect(310, -14, 70, 28, 4);
      itemContainer.add(cookBtnBg);

      const cookBtnText = this.scene.add.text(345, 0, '🔪 조리', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      itemContainer.add(cookBtnText);

      // 손질 버튼 인터랙티브
      const hitArea = new Phaser.Geom.Rectangle(310, -14, 70, 28);
      cookBtnBg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
      cookBtnBg.on('pointerdown', () => {
        // 조리 씬으로 전환
        this.scene.scene.stop(this.scene.scene.key);
        this.scene.scene.start('CookScene');
      });
      cookBtnBg.on('pointerover', () => cookBtnBg.setAlpha(1.0));
      cookBtnBg.on('pointerout', () => cookBtnBg.setAlpha(0.9));

      this.listContainer?.add(itemContainer);
    });
  }

  private getItemEmoji(type: string): string {
    if (type === 'fish') return '🐟';
    if (type === 'crustacean') return '🦀';
    if (type === 'shellfish') return '🐚';
    return '📦';
  }

  private getConditionLabel(cond: string): string {
    switch (cond) {
      case 'live':       return '🟣 활어';
      case 'fresh':      return '🟢 극상';
      case 'chilled':    return '🔵 냉장';
      case 'frozen':     return '⚪ 냉동';
      case 'dried':      return '🟡 건조';
      case 'salted':     return '🟠 염장';
      case 'processed':  return '🟤 가공';
      case 'spoiled':    return '🔴 상함';
      default:           return '❓ 알수없음';
    }
  }
}
