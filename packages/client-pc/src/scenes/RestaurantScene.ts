/**
 * @file RestaurantScene.ts
 * @description 식당 경영 씬 (Phaser 3)
 *
 * 조건부 해금 이후 플레이어 소유 횟집/포장마차 경영.
 * - 메뉴 설정 (보유 식재료 기반)
 * - 손님 입장 및 주문 처리
 * - 매출/평판 시스템
 * - 업그레이드 (포장마차 → 고급 횟집)
 */

import Phaser from 'phaser';
import type { RestaurantState, DiningCustomer } from '@tra/core';

export class RestaurantScene extends Phaser.Scene {
  private restaurant!: RestaurantState;
  private activeCustomers: DiningCustomer[] = [];
  private customerContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private revenueText!: Phaser.GameObjects.Text;
  private reputationBar!: Phaser.GameObjects.Graphics;
  private isOpen = false;

  constructor() {
    super({ key: 'RestaurantScene' });
  }

  create(): void {
    const { width } = this.scale;

    // 더미 식당 상태 초기화
    this.restaurant = this.initDummyRestaurant();

    // ─── 배경: 식당 인테리어 ───
    this.createRestaurantInterior();

    // ─── 간판 ───
    this.add
      .text(width * 0.5, 35, `🏮 ${this.restaurant.name}`, {
        fontSize: '24px',
        color: '#ffdd88',
        fontStyle: 'bold',
        backgroundColor: '#4a0000cc',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // ─── 정보 패널 (우상단) ───
    this.createInfoPanel();

    // ─── 메뉴 패널 ───
    this.createMenuPanel();

    // ─── 영업 토글 버튼 ───
    this.createOpenCloseButton();

    // ─── 나가기 버튼 ───
    this.createBackButton();

    // ─── ESC 키 나가기 ───
    this.input.keyboard!.on('keydown-ESC', () => this.exitScene());

    // ─── 손님 자동 생성 (영업 중일 때) ───
    this.time.addEvent({
      delay: 8000,
      loop: true,
      callback: () => {
        if (this.isOpen && this.activeCustomers.length < 5) {
          this.spawnCustomer();
        }
      },
    });
  }

  private exitScene(): void {
    this.cameras.main.fadeOut(220, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('FieldScene');
    });
  }

  private initDummyRestaurant(): RestaurantState {
    return {
      restaurantId: 'restaurant-001',
      ownerPlayerId: 'player-001',
      name: '앵글러 횟집',
      tier: 'small_restaurant',
      locationSpotId: 'geoje_gujora_breakwater',
      reputationScore: 42,
      ingredientStock: [],
      todayMenu: [],
      todayRevenue: 15000,
      totalRevenue: 230000,
      staffCount: 0,
      isOpen: false,
      nextTierReputationRequired: 60,
    };
  }

  private createRestaurantInterior(): void {
    const { width, height } = this.scale;

    // 바닥
    const floor = this.add.graphics();
    floor.fillStyle(0x8b6914);
    floor.fillRect(0, height * 0.6, width, height * 0.4);

    // 벽
    const wall = this.add.graphics();
    wall.fillStyle(0xf5e6c8);
    wall.fillRect(0, 0, width, height * 0.6);

    // 장식 요소들
    // 수족관
    const aquarium = this.add.graphics();
    aquarium.lineStyle(3, 0x4488aa);
    aquarium.fillStyle(0x0a3a5a, 0.7);
    aquarium.fillRect(width - 180, height * 0.1, 160, 200);
    aquarium.strokeRect(width - 180, height * 0.1, 160, 200);

    this.add.text(width - 100, height * 0.1 + 100, '🐟🦀🦑', {
      fontSize: '22px',
    }).setOrigin(0.5, 0.5).setDepth(5);

    this.add.text(width - 100, height * 0.1 + 210, '수족관', {
      fontSize: '12px', color: '#4488aa',
    }).setOrigin(0.5, 0);

    // 테이블들
    const tablePositions = [
      { x: 0.2, y: 0.7 },
      { x: 0.45, y: 0.7 },
      { x: 0.2, y: 0.87 },
      { x: 0.45, y: 0.87 },
    ];
    tablePositions.forEach(({ x, y }) => {
      this.add.ellipse(width * x, height * y, 120, 60, 0x6b4226).setDepth(4);
      this.add.text(width * x, height * y, '🍽️', { fontSize: '20px' }).setOrigin(0.5, 0.5).setDepth(5);
    });

    // 카운터
    const counter = this.add.graphics();
    counter.fillStyle(0x5c3317);
    counter.fillRect(width * 0.65, height * 0.65, width * 0.2, height * 0.25);
    this.add.text(width * 0.75, height * 0.77, '주방', {
      fontSize: '13px', color: '#ffddaa', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(6);

    // 벽 장식
    this.add.text(30, height * 0.15, '🎣 낚시 도구들', { fontSize: '12px', color: '#664422' });
    this.add.text(30, height * 0.25, '📜 오늘의 추천', { fontSize: '12px', color: '#664422' });
    this.add.text(30, height * 0.32, '• 감성돔 회    ₩35,000', { fontSize: '11px', color: '#884444' });
    this.add.text(30, height * 0.38, '• 방어 회        ₩55,000', { fontSize: '11px', color: '#884444' });
    this.add.text(30, height * 0.44, '• 꽃게탕        ₩35,000', { fontSize: '11px', color: '#884444' });
  }

  private createInfoPanel(): void {
    const { width } = this.scale;
    const x = width - 170;

    this.add.rectangle(x + 70, 100, 160, 160, 0x001122, 0.88).setOrigin(0.5, 0.5).setDepth(20);

    this.add.text(x, 35, '오늘 매출', { fontSize: '11px', color: '#88aacc' }).setDepth(21);
    this.revenueText = this.add
      .text(x, 52, `₩${this.restaurant.todayRevenue.toLocaleString()}`, {
        fontSize: '15px', color: '#ffdd88', fontStyle: 'bold',
      }).setDepth(21);

    this.add.text(x, 78, '평판', { fontSize: '11px', color: '#88aacc' }).setDepth(21);

    // 평판 바
    this.reputationBar = this.add.graphics().setDepth(21);
    this.drawReputationBar();

    this.add.text(x, 125, `다음 단계: ${this.restaurant.nextTierReputationRequired}점`, {
      fontSize: '10px', color: '#6688aa',
    }).setDepth(21);

    this.add.text(x, 145, `등급: ${this.getTierLabel()}`, {
      fontSize: '12px', color: '#aaffcc', fontStyle: 'bold',
    }).setDepth(21);

    this.add.text(x, 165, `총 매출: ₩${this.restaurant.totalRevenue.toLocaleString()}`, {
      fontSize: '10px', color: '#6688aa',
    }).setDepth(21);
  }

  private drawReputationBar(): void {
    const { width } = this.scale;
    const x = width - 170;
    const barWidth = 140;
    const ratio = this.restaurant.reputationScore / 100;

    this.reputationBar.clear();
    this.reputationBar.fillStyle(0x222222);
    this.reputationBar.fillRect(x, 95, barWidth, 12);
    this.reputationBar.fillStyle(0x33cc88);
    this.reputationBar.fillRect(x, 95, barWidth * ratio, 12);
    this.reputationBar.lineStyle(1, 0x446644);
    this.reputationBar.strokeRect(x, 95, barWidth, 12);
  }

  private getTierLabel(): string {
    const labels: Record<string, string> = {
      pojangmacha: '🏕️ 포장마차',
      small_restaurant: '🏠 소형 횟집',
      mid_restaurant: '🏢 중형 식당',
      premium_sashimi: '⭐ 고급 횟집',
    };
    return labels[this.restaurant.tier] ?? '알 수 없음';
  }

  private createMenuPanel(): Phaser.GameObjects.Container {
    const { height } = this.scale;
    const panel = this.add.container(10, height * 0.15).setDepth(25);

    const bg = this.add.rectangle(0, 0, 200, 220, 0x001a11, 0.9).setOrigin(0, 0);
    const title = this.add.text(10, 10, '📋 현재 메뉴', {
      fontSize: '13px', color: '#aaffcc', fontStyle: 'bold',
    });

    const menuItems = ['감성돔 회', '방어 회', '꽃게탕', '바지락 칼국수', '전복 버터구이'];
    const menuTexts = menuItems.map((item, i) =>
      this.add.text(10, 35 + i * 30, `• ${item}`, {
        fontSize: '12px', color: '#ccffee',
      })
    );

    panel.add([bg, title, ...menuTexts]);
    return panel;
  }

  private createOpenCloseButton(): void {
    const { width, height } = this.scale;
    const btn = this.add.container(width * 0.65, height - 40).setDepth(30).setInteractive(
      new Phaser.Geom.Rectangle(-80, -20, 160, 40),
      Phaser.Geom.Rectangle.Contains
    );

    const bg = this.add.rectangle(0, 0, 160, 40, 0x005533, 0.9);
    const text = this.add.text(0, 0, '🚪 영업 시작', {
      fontSize: '15px', color: '#aaffcc', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    btn.add([bg, text]);
    btn.on('pointerdown', () => {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        text.setText('🚪 영업 종료');
        bg.setFillStyle(0xaa3300);
        this.showStatusMsg('영업을 시작합니다! 손님을 기다리세요.');
      } else {
        text.setText('🚪 영업 시작');
        bg.setFillStyle(0x005533);
        this.showStatusMsg('영업을 종료했습니다.');
      }
    });
    btn.on('pointerover', () => bg.setAlpha(1.0));
    btn.on('pointerout', () => bg.setAlpha(0.9));
  }

  private createBackButton(): void {
    const { height } = this.scale;
    const btn = this.add.container(80, height - 40).setDepth(30).setInteractive(
      new Phaser.Geom.Rectangle(-70, -20, 140, 40),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.rectangle(0, 0, 140, 40, 0x333333, 0.9);
    const text = this.add.text(0, 0, '← 나가기', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5, 0.5);
    btn.add([bg, text]);
    btn.on('pointerdown', () => {
      this.exitScene();
    });
    btn.on('pointerover', () => bg.setAlpha(1.0));
    btn.on('pointerout', () => bg.setAlpha(0.9));
  }

  private spawnCustomer(): void {
    const { width, height } = this.scale;
    const customer: DiningCustomer = {
      customerId: `cust-${Date.now()}`,
      nameKo: this.getRandomKoreanName(),
      preferredDishes: ['raw_sashimi'],
      budget: 20000 + Math.floor(Math.random() * 50000),
      patience: 1.0,
      satisfaction: 0,
    };

    this.activeCustomers.push(customer);

    // 손님 도트 표시
    const x = 100 + Math.random() * (width * 0.55);
    const y = height * 0.67 + Math.floor(Math.random() * 2) * (height * 0.17);

    const container = this.add.container(x, y).setDepth(12);
    const avatar = this.add.circle(0, 0, 18, 0x885522);
    const nameTag = this.add.text(0, 24, customer.nameKo, {
      fontSize: '10px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0);
    const emoji = this.add.text(0, 0, '😊', { fontSize: '16px' }).setOrigin(0.5, 0.5);

    container.add([avatar, nameTag, emoji]);
    this.customerContainers.set(customer.customerId, container);

    // 인내심 감소
    this.time.addEvent({
      delay: 15000, // 15초 기다리면 떠남
      callback: () => this.customerLeaves(customer.customerId, false),
    });
  }

  private customerLeaves(customerId: string, satisfied: boolean): void {
    const container = this.customerContainers.get(customerId);
    if (!container) return;

    // 만족/불만 이펙트
    const msg = satisfied ? '😋 맛있었어요!' : '😤 너무 오래 기다려요!';
    const msgText = this.add.text(container.x, container.y - 30, msg, {
      fontSize: '13px', color: satisfied ? '#aaffcc' : '#ff9966',
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(30);

    this.tweens.add({
      targets: [container, msgText],
      x: { value: container.x + (Math.random() > 0.5 ? 200 : -200) },
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        container.destroy();
        msgText.destroy();
      },
    });

    this.activeCustomers = this.activeCustomers.filter((c) => c.customerId !== customerId);
    this.customerContainers.delete(customerId);

    if (satisfied) {
      // 매출 증가
      this.restaurant.todayRevenue += 25000 + Math.floor(Math.random() * 30000);
      this.revenueText.setText(`₩${this.restaurant.todayRevenue.toLocaleString()}`);
      this.restaurant.reputationScore = Math.min(100, this.restaurant.reputationScore + 1);
      this.drawReputationBar();
    }
  }

  private showStatusMsg(msg: string): void {
    const { width, height } = this.scale;
    const text = this.add.text(width * 0.5, height * 0.5, msg, {
      fontSize: '16px', color: '#aaffcc', backgroundColor: '#001a11cc',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0.5).setDepth(50);

    this.tweens.add({
      targets: text, alpha: 0, y: height * 0.4, delay: 1500, duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private getRandomKoreanName(): string {
    const names = ['김낚시', '이어부', '박앵글러', '최물고기', '정갯바위', '강방파제', '조선장'];
    return names[Math.floor(Math.random() * names.length)];
  }
}
