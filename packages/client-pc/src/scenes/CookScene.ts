/**
 * @file CookScene.ts
 * @description 캐치앤쿡 씬 (Phaser 3)
 *
 * 잡은 생선/채취물을 직접 손질하고 조리하는 미니게임.
 * - 손질 단계 순차 진행 (비늘 제거 → 내장 제거 → 포 뜨기)
 * - 조리 선택 (회/구이/탕/찜)
 * - 완성 요리 → 식당 메뉴 등록 or 자가 취식
 * - 위치별 가능 조리법 제한
 */

import Phaser from 'phaser';
import type { FishProcessingStep } from '@tra/core';
import { RECIPE_DATABASE } from '@tra/core';
import type { CoolerSlotItem } from '@tra/core';
import { GameState } from '../store/GameState.js';

export class CookScene extends Phaser.Scene {
  private coolerItems: CoolerSlotItem[] = [];
  private currentStepIndex = 0;
  private processingSteps: FishProcessingStep[] = [];
  private availableRecipes: typeof RECIPE_DATABASE = [];

  // UI
  private itemPanel!: Phaser.GameObjects.Container;
  private recipePanel!: Phaser.GameObjects.Container;
  private processPanel!: Phaser.GameObjects.Container;
  private resultPanel!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'CookScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20);
    const { width } = this.scale;

    // GameState 연동 (실제 쿨러 아이템 로드)
    this.coolerItems = GameState.coolerInventory.items;

    // ─── 배경: 조리대 ───
    this.createKitchenBackground();

    // ─── 타이틀 ───
    this.add
      .text(width * 0.5, 30, '🍽️ 캐치앤쿡', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '22px',
        color: '#ffeeaa',
        fontStyle: 'bold',
        backgroundColor: '#3a1500cc',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // ─── 단계 표시기 ───
    this.createPhaseIndicator();

    // ─── 재료 선택 패널 (초기 뷰) ───
    this.showSelectFishPanel();

    // ─── 나가기 버튼 ───
    this.createBackButton();

    // ─── ESC 키 나가기 ───
    this.input.keyboard!.on('keydown-ESC', () => this.exitScene());
  }

  private exitScene(): void {
    this.cameras.main.fadeOut(220, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('FieldScene');
    });
  }

  private createKitchenBackground(): void {
    const { width, height } = this.scale;

    // 주방 타일 배경
    const bg = this.add.graphics();
    bg.fillStyle(0xf0e8d8);
    bg.fillRect(0, 0, width, height);

    // 타일 패턴
    bg.lineStyle(1, 0xddccbb, 0.5);
    for (let x = 0; x < width; x += 40) bg.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) bg.moveTo(0, y).lineTo(width, y);
    bg.strokePath();

    // 조리대
    const counter = this.add.graphics();
    counter.fillStyle(0x8b6914);
    counter.fillRect(width * 0.1, height * 0.35, width * 0.8, height * 0.45);

    // 조리대 표면 (밝은 나무)
    counter.fillStyle(0xd4a96a);
    counter.fillRect(width * 0.1, height * 0.35, width * 0.8, height * 0.42);

    // 도마
    counter.fillStyle(0xc8974a);
    counter.fillRect(width * 0.25, height * 0.38, width * 0.5, height * 0.25);

    // 칼
    this.add.text(width * 0.2, height * 0.45, '🔪', { fontSize: '28px' }).setDepth(5);

    // 냄비/팬
    this.add.text(width * 0.75, height * 0.45, '🍳', { fontSize: '32px' }).setDepth(5);

    // 가스레인지 (하단)
    const stove = this.add.graphics();
    stove.fillStyle(0x444444);
    stove.fillRect(width * 0.6, height * 0.6, width * 0.3, height * 0.15);
    this.add.text(width * 0.75, height * 0.67, '🔥', { fontSize: '20px' }).setOrigin(0.5, 0.5).setDepth(5);
  }

  private createPhaseIndicator(): void {
    const { width } = this.scale;
    const phases = ['재료선택', '손질', '조리', '완성'];
    const colors = ['#aaaaaa', '#aaaaaa', '#aaaaaa', '#aaaaaa'];

    phases.forEach((phase, i) => {
      const x = width * 0.15 + i * (width * 0.2);
      const circle = this.add.circle(x, 70, 16, 0x333333).setDepth(20);
      this.add.text(x, 70, String(i + 1), {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setDepth(21);
      this.add.text(x, 92, phase, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px', color: colors[i],
      }).setOrigin(0.5, 0.5).setDepth(21);

      // 현재 단계 강조
      if (i === 0) {
        circle.setFillStyle(0xff8800);
      }
    });
  }

  private showSelectFishPanel(): void {
    const { width, height } = this.scale;

    if (this.itemPanel) this.itemPanel.destroy();
    this.itemPanel = this.add.container(width * 0.5, height * 0.52).setDepth(25);

    const bg = this.add.rectangle(0, 0, 420, 260, 0x1a0a00, 0.92);
    bg.setStrokeStyle(1.5, 0x553311);

    const title = this.add.text(0, -115, '🧊 쿨러에서 재료를 선택하세요', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px', color: '#ffeeaa', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.itemPanel.add([bg, title]);

    if (this.coolerItems.length === 0) {
      const emptyText = this.add.text(0, 0, '⚠️ 쿨러가 비어 있습니다.\n먼저 낚시나 해루질로 수확물을 얻어오세요.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px',
        color: '#ffaa88',
        align: 'center',
        lineSpacing: 6,
      }).setOrigin(0.5, 0.5);
      this.itemPanel.add(emptyText);
      return;
    }

    this.coolerItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? -100 : 100;
      const y = -60 + row * 60;

      const itemBg = this.add.rectangle(x, y, 180, 50,
        item.condition !== 'spoiled' ? 0x003322 : 0x330000, 0.9
      ).setInteractive();
      itemBg.setStrokeStyle(1, item.condition !== 'spoiled' ? 0x05ff55 : 0xff0505, 0.5);

      const nameText = this.add.text(x, y - 10, this.getItemEmoji(item) + ' ' + item.nameKo, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: '#ccffee',
      }).setOrigin(0.5, 0.5);
      const detailText = this.add.text(x, y + 10, `${item.weightGrams}g | ${this.getConditionLabel(item.condition)}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px', color: '#88aacc',
      }).setOrigin(0.5, 0.5);

      itemBg.on('pointerdown', () => {
        this.itemPanel.destroy();
        this.showProcessingPanel(item);
      });
      itemBg.on('pointerover', () => itemBg.setAlpha(0.7));
      itemBg.on('pointerout', () => itemBg.setAlpha(1.0));

      this.itemPanel.add([itemBg, nameText, detailText]);
    });
  }

  private showProcessingPanel(item: CoolerSlotItem): void {
    const { width, height } = this.scale;

    this.processingSteps = ['descaling', 'gutting', 'filleting'];
    this.currentStepIndex = 0;

    if (this.processPanel) this.processPanel.destroy();
    this.processPanel = this.add.container(width * 0.5, height * 0.52).setDepth(25);

    const bg = this.add.rectangle(0, 0, 400, 280, 0x1a0800, 0.92);
    bg.setStrokeStyle(1.5, 0x553311);

    const title = this.add.text(0, -125, `🔪 ${item.nameKo} 손질`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px', color: '#ffeeaa', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const stepLabels: Record<string, string> = {
      descaling: '비늘 제거',
      gutting: '내장 제거',
      filleting: '포 뜨기 (회뜨기)',
      skinning: '껍질 제거',
      portioning: '포션 분할',
    };

    this.processPanel.add([bg, title]);

    let stepY = -80;
    this.processingSteps.forEach((step, i) => {
      const stepBg = this.add.rectangle(0, stepY, 360, 40, 0x001133, 0.8);
      const stepText = this.add.text(-170, stepY, `${i + 1}. ${stepLabels[step] ?? step}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: this.currentStepIndex === i ? '#ffcc00' : '#8899aa',
      }).setOrigin(0, 0.5);
      const checkText = this.add.text(160, stepY, i < this.currentStepIndex ? '✅' : '○', {
        fontSize: '16px',
      }).setOrigin(0.5, 0.5);

      this.processPanel.add([stepBg, stepText, checkText]);
      stepY += 50;
    });

    // 손질 버튼
    const processBtn = this.add.container(0, 90).setInteractive(
      new Phaser.Geom.Rectangle(-90, -20, 180, 40),
      Phaser.Geom.Rectangle.Contains
    );
    const btnBg = this.add.rectangle(0, 0, 180, 40, 0x553300, 0.9);
    btnBg.setStrokeStyle(1, 0xaa8833);
    const btnText = this.add.text(0, 0, '🔪 손질하기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px', color: '#ffeeaa', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    processBtn.add([btnBg, btnText]);
    processBtn.on('pointerdown', () => {
      this.processPanel.destroy();
      this.showCookingPanel(item);
    });

    this.processPanel.add(processBtn);
  }

  private showCookingPanel(item: CoolerSlotItem): void {
    const { width, height } = this.scale;

    // 해당 재료로 만들 수 있는 레시피 필터 (어종 종류에 따라)
    this.availableRecipes = RECIPE_DATABASE.filter((r) =>
      r.requiredIngredients.some((i) => i.itemId === item.speciesId || (i.isFishSpecies && item.type === 'fish'))
    );

    if (this.recipePanel) this.recipePanel.destroy();
    this.recipePanel = this.add.container(width * 0.5, height * 0.52).setDepth(25);

    const bg = this.add.rectangle(0, 0, 400, 300, 0x001a0a, 0.92);
    bg.setStrokeStyle(1.5, 0x00aa66);

    const title = this.add.text(0, -130, '🍳 요리 선택', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px', color: '#aaffcc', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.recipePanel.add([bg, title]);

    if (this.availableRecipes.length === 0) {
      const noRecipe = this.add.text(0, 0, '이 재료로 만들 수 있는 레시피가 없습니다.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: '#888888', align: 'center',
      }).setOrigin(0.5, 0.5);
      this.recipePanel.add(noRecipe);
    } else {
      this.availableRecipes.slice(0, 3).forEach((recipe, i) => {
        const y = -80 + i * 65;
        const recipeBg = this.add.rectangle(0, y, 360, 55, 0x002211, 0.9).setInteractive();
        recipeBg.setStrokeStyle(1, 0x00aa66);

        const nameText = this.add.text(-170, y - 12, recipe.nameKo, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '14px', color: '#aaffcc', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        const descText = this.add.text(-170, y + 10, recipe.description.substring(0, 35) + '...', {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '10px', color: '#88aacc',
        }).setOrigin(0, 0.5);
        const priceText = this.add.text(150, y, `₩${recipe.estimatedSaleValue.toLocaleString()}`, {
          fontFamily: 'monospace',
          fontSize: '13px', color: '#ffdd88',
        }).setOrigin(0.5, 0.5);

        recipeBg.on('pointerdown', () => {
          this.recipePanel.destroy();
          this.showCookingResult(recipe, item);
        });
        recipeBg.on('pointerover', () => recipeBg.setAlpha(0.7));
        recipeBg.on('pointerout', () => recipeBg.setAlpha(1.0));

        this.recipePanel.add([recipeBg, nameText, descText, priceText]);
      });
    }
  }

  private showCookingResult(recipe: (typeof RECIPE_DATABASE)[0], item: CoolerSlotItem): void {
    const { width, height } = this.scale;

    if (this.resultPanel) this.resultPanel.destroy();
    this.resultPanel = this.add.container(width * 0.5, height * 0.5).setDepth(30);

    const bg = this.add.rectangle(0, 0, 380, 300, 0x001a0a, 0.97);
    bg.setStrokeStyle(1.5, 0x00aa66);

    const emoji = this.add.text(0, -120, '🎉', { fontSize: '36px' }).setOrigin(0.5, 0.5);
    const title = this.add.text(0, -80, `${recipe.nameKo} 완성!`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '18px', color: '#aaffcc', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const buff = recipe.buffEffect
      ? `✨ 버프: ${this.getBuffLabel(recipe.buffEffect.type)} +${recipe.buffEffect.value}% (${recipe.buffEffect.durationMinutes}분)`
      : '';

    const info = this.add.text(0, -10, [
      recipe.description,
      ``,
      `체력 회복: +${recipe.staminaRestore}`,
      buff,
      ``,
      `예상 판매가: ₩${recipe.estimatedSaleValue.toLocaleString()}`,
    ].join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px', color: '#ccffee', align: 'center', lineSpacing: 6,
      wordWrap: { width: 340 },
    }).setOrigin(0.5, 0.5);

    const eatBtn = this.add.container(-85, 120).setInteractive(
      new Phaser.Geom.Rectangle(-65, -18, 130, 36), Phaser.Geom.Rectangle.Contains
    );
    const eatBg = this.add.rectangle(0, 0, 130, 36, 0x004422, 0.9);
    const eatText = this.add.text(0, 0, '🍽️ 취식', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#aaffcc'
    }).setOrigin(0.5, 0.5);
    eatBtn.add([eatBg, eatText]);
    eatBtn.on('pointerdown', () => {
      this.resultPanel.destroy();

      // 재료 차감
      const ingredient = recipe.requiredIngredients.find((ing) => ing.itemId === item.speciesId || (ing.isFishSpecies && item.type === 'fish'));
      if (ingredient) {
        GameState.removeFromCooler(item.speciesId, ingredient.requiredAmountG);
        GameState.save();
      }

      this.showFinalMessage('맛있게 드셨습니다! 체력이 회복되고 기운이 솟아납니다.', true);
    });

    const sellBtnLabel = GameState.hasLicense('food_service') ? '💰 식당 등록' : '💰 즉시 판매';
    const sellBtn = this.add.container(85, 120).setInteractive(
      new Phaser.Geom.Rectangle(-65, -18, 130, 36), Phaser.Geom.Rectangle.Contains
    );
    const sellBg = this.add.rectangle(0, 0, 130, 36, 0x005533, 0.9);
    const sellText = this.add.text(0, 0, sellBtnLabel, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#aaffcc'
    }).setOrigin(0.5, 0.5);
    sellBtn.add([sellBg, sellText]);
    sellBtn.on('pointerdown', () => {
      this.resultPanel.destroy();

      // 재료 차감
      const ingredient = recipe.requiredIngredients.find((ing) => ing.itemId === item.speciesId || (ing.isFishSpecies && item.type === 'fish'));
      if (ingredient) {
        GameState.removeFromCooler(item.speciesId, ingredient.requiredAmountG);
      }

      if (GameState.hasLicense('food_service')) {
        // 식당 상태 추가 또는 활성화 시
        if (GameState.restaurant) {
          if (!GameState.restaurant.todayMenu.some((r) => r.id === recipe.id)) {
            GameState.restaurant.todayMenu.push(recipe);
          }
          GameState.restaurant.todayRevenue += recipe.estimatedSaleValue;
        }
        GameState.save();
        this.showFinalMessage(`${recipe.nameKo}을(를) 식당 메뉴에 추가하고 재료를 소모했습니다!`, false);
      } else {
        // 즉시 판매로 코인 추가
        GameState.addCoins(recipe.estimatedSaleValue);
        GameState.save();
        this.showFinalMessage(`${recipe.nameKo}을(를) 즉시 판매하여 ₩${recipe.estimatedSaleValue.toLocaleString()}을 획득했습니다!`, false);
      }
    });

    this.resultPanel.add([bg, emoji, title, info, eatBtn, sellBtn]);

    // 파티클 효과 (별)
    this.cameras.main.flash(400, 100, 200, 100);
  }

  private showFinalMessage(msg: string, heal: boolean): void {
    console.log('Cooking heal trigger:', heal);
    const { width, height } = this.scale;
    const text = this.add.text(width * 0.5, height * 0.4, msg, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px', color: '#aaffcc', backgroundColor: '#001a0acc',
      padding: { x: 20, y: 12 }, wordWrap: { width: 360 }, align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(40);

    this.tweens.add({
      targets: text, alpha: 0, delay: 2500, duration: 800,
      onComplete: () => {
        text.destroy();
        this.showSelectFishPanel();
      },
    });
  }

  private getItemEmoji(item: CoolerSlotItem): string {
    const emojiMap: Record<string, string> = {
      fish: '🐟',
      shellfish: '🐚',
      crustacean: '🦀',
      ingredient: '🥬',
    };
    return emojiMap[item.type] ?? '📦';
  }

  private getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      live: '🟣 활어',
      fresh: '🟢 극상',
      chilled: '🔵 냉장',
      frozen: '⚪ 냉동',
      dried: '🟡 건조',
      salted: '🟠 염장',
      processed: '🟤 가공',
      spoiled: '🔴 상함',
    };
    return labels[condition] ?? condition;
  }

  private getBuffLabel(type: string): string {
    const labels: Record<string, string> = {
      bite_chance_up: '입질 확률 증가',
      cast_distance_up: '캐스팅 거리 증가',
      rare_fish_up: '희귀 어종 출현 증가',
      fatigue_recovery: '피로 회복',
    };
    return labels[type] ?? type;
  }

  private createBackButton(): void {
    const { height } = this.scale;
    const btn = this.add.container(80, height - 35).setDepth(30).setInteractive(
      new Phaser.Geom.Rectangle(-70, -18, 140, 36),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.rectangle(0, 0, 140, 36, 0x333333, 0.9);
    const text = this.add.text(0, 0, '← 나가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    btn.add([bg, text]);
    btn.on('pointerdown', () => {
      this.exitScene();
    });
  }
}
