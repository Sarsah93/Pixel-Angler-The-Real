/**
 * @file CondoScene.ts
 * @description 선상콘도 관리 씬 (Phaser 3)
 *
 * 선상콘도/펜션 운영 인터페이스.
 * - 선박 내부 도트 그래픽 뷰
 * - 예약 현황 확인
 * - 부대시설 관리 (업그레이드)
 * - 낚시 체험 패키지 설정
 */

import Phaser from 'phaser';
import type { FloatingCondoState } from '@tra/core';

export class CondoScene extends Phaser.Scene {
  private condoState!: FloatingCondoState;

  constructor() {
    super({ key: 'CondoScene' });
  }

  create(): void {
    const { width } = this.scale;

    // 더미 선상콘도 초기화
    this.condoState = this.initDummyCondo();

    // ─── 배경: 바다 위 선박 ───
    this.createVesselInterior();

    // ─── 타이틀 ───
    this.add
      .text(width * 0.5, 35, `⚓ ${this.condoState.name}`, {
        fontSize: '22px',
        color: '#aaddff',
        fontStyle: 'bold',
        backgroundColor: '#001a3399',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // ─── 탭 네비게이션 ───
    this.createTabNav();

    // ─── 개요 패널 (기본 뷰) ───
    this.showOverview();

    // ─── 나가기 버튼 ───
    this.createBackButton();
  }

  private initDummyCondo(): FloatingCondoState {
    return {
      condoId: 'condo-001',
      ownerPlayerId: 'player-001',
      name: '앵글러 선상펜션',
      locationSpotId: 'geoje_gujora_breakwater',
      vesselType: 'cabin_boat',
      totalBerths: 6,
      reservations: [
        {
          reservationId: 'res-001',
          guestNickname: '낚시왕김철수',
          checkIn: new Date(Date.now() + 2 * 86400000),
          checkOut: new Date(Date.now() + 4 * 86400000),
          berths: 2,
          totalPaid: 280000,
          isPaid: true,
          specialRequest: '갈치 선상 낚시 1회 포함 요청',
        },
        {
          reservationId: 'res-002',
          guestNickname: '벵에돔박사',
          checkIn: new Date(Date.now() + 7 * 86400000),
          checkOut: new Date(Date.now() + 8 * 86400000),
          berths: 4,
          totalPaid: 320000,
          isPaid: false,
        },
      ],
      amenities: ['fishing_deck', 'bait_storage', 'fish_cooler', 'night_lamp'],
      baseNightlyRate: 120000,
      tackleStorageSlots: 8,
      safetyEquipmentCount: 6,
    };
  }

  private createVesselInterior(): void {
    const { width, height } = this.scale;

    // 하늘
    this.add.graphics().fillGradientStyle(0x0a1a3a, 0x0a1a3a, 0x1a3a6a, 0x1a3a6a, 1)
      .fillRect(0, 0, width, height * 0.45);

    // 바다
    this.add.rectangle(0, height * 0.45, width, height * 0.55, 0x0a2540).setOrigin(0, 0);

    // 선박 갑판 (흰색 구조물)
    const hull = this.add.graphics();
    hull.fillStyle(0xdddddd);
    hull.fillRect(0, height * 0.55, width, height * 0.35);

    // 선실 구조물
    hull.fillStyle(0xffffff);
    hull.fillRect(width * 0.1, height * 0.3, width * 0.8, height * 0.25);

    // 창문
    const winPositions = [0.25, 0.45, 0.65];
    winPositions.forEach((xRatio) => {
      hull.fillStyle(0x88ccff, 0.7);
      hull.fillRect(width * xRatio, height * 0.34, 80, 50);
      hull.lineStyle(2, 0x4488bb);
      hull.strokeRect(width * xRatio, height * 0.34, 80, 50);
    });

    // 돛대/안테나
    hull.fillStyle(0x888888);
    hull.fillRect(width * 0.5 - 3, height * 0.15, 6, height * 0.15);

    // 한국 깃발
    this.add.text(width * 0.5 + 5, height * 0.16, '🇰🇷', { fontSize: '16px' }).setDepth(5);

    // 낚시 데크 (선미)
    this.add.rectangle(width * 0.1, height * 0.78, width * 0.8, height * 0.12, 0xaaaaaa, 0.3)
      .setOrigin(0, 0).setDepth(4);
    this.add.text(width * 0.5, height * 0.84, '🎣 낚시 데크', {
      fontSize: '12px', color: '#558866',
    }).setOrigin(0.5, 0.5).setDepth(5);

    // 물결 효과
    let waveOffset = 0;
    const waveGraphics = this.add.graphics().setDepth(3);
    this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        waveGraphics.clear();
        waveGraphics.lineStyle(2, 0x3399cc, 0.3);
        for (let i = 0; i < 3; i++) {
          waveGraphics.beginPath();
          for (let x = 0; x <= width; x += 10) {
            const y = height * (0.6 + i * 0.08) + Math.sin((x + waveOffset + i * 30) * 0.02) * 5;
            if (x === 0) waveGraphics.moveTo(x, y);
            else waveGraphics.lineTo(x, y);
          }
          waveGraphics.strokePath();
        }
        waveOffset += 1.5;
      },
    });
  }

  private createTabNav(): void {
    const { width } = this.scale;
    const tabs = [
      { label: '📊 개요', view: 'overview' as const },
      { label: '📅 예약', view: 'reservations' as const },
      { label: '🛠️ 시설', view: 'amenities' as const },
      { label: '📦 패키지', view: 'packages' as const },
    ];

    tabs.forEach((tab, i) => {
      const x = width * 0.1 + i * (width * 0.2);
      const btn = this.add.container(x, 72).setDepth(25).setInteractive(
        new Phaser.Geom.Rectangle(-60, -14, 120, 28),
        Phaser.Geom.Rectangle.Contains
      );
      const bg = this.add.rectangle(0, 0, 120, 28, 0x112244, 0.9);
      const text = this.add.text(0, 0, tab.label, { fontSize: '12px', color: '#aaddff' }).setOrigin(0.5, 0.5);
      btn.add([bg, text]);
      btn.on('pointerdown', () => {
        bg.setFillStyle(0x1a4488);
        this.clearContent();
        if (tab.view === 'overview') this.showOverview();
        else if (tab.view === 'reservations') this.showReservations();
        else if (tab.view === 'amenities') this.showAmenities();
        else if (tab.view === 'packages') this.showPackages();
      });
      btn.on('pointerover', () => bg.setAlpha(1.0));
      btn.on('pointerout', () => bg.setAlpha(0.9));
    });
  }

  private clearContent(): void {
    this.children.list
      .filter((c) => c.name === 'condoContent')
      .forEach((c) => c.destroy());
  }

  private showOverview(): void {
    const { width, height } = this.scale;
    const container = this.add.container(width * 0.5, height * 0.5).setDepth(22).setName('condoContent');

    const bg = this.add.rectangle(0, 0, 380, 300, 0x001a33, 0.92);
    const title = this.add.text(0, -130, '⚓ 선상콘도 현황', {
      fontSize: '18px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const totalReservations = this.condoState.reservations.length;
    const paidReservations = this.condoState.reservations.filter((r) => r.isPaid).length;
    const totalIncome = this.condoState.reservations.reduce((s, r) => s + (r.isPaid ? r.totalPaid : 0), 0);

    const info = this.add.text(0, -30, [
      `선박 종류: ${this.getVesselLabel()}`,
      `총 침대: ${this.condoState.totalBerths}개`,
      `기본 요금: ₩${this.condoState.baseNightlyRate.toLocaleString()}/박`,
      ``,
      `예약 현황: ${totalReservations}건 (확정 ${paidReservations}건)`,
      `예상 수입: ₩${totalIncome.toLocaleString()}`,
      ``,
      `부대시설: ${this.condoState.amenities.length}종`,
      `낚시장비 보관: ${this.condoState.tackleStorageSlots}슬롯`,
      `구명조끼: ${this.condoState.safetyEquipmentCount}벌`,
    ].join('\n'), {
      fontSize: '13px', color: '#ccddee', lineSpacing: 7, align: 'center',
    }).setOrigin(0.5, 0.5);

    container.add([bg, title, info]);
  }

  private showReservations(): void {
    const { width, height } = this.scale;
    const container = this.add.container(width * 0.5, height * 0.48).setDepth(22).setName('condoContent');

    const bg = this.add.rectangle(0, 0, 420, 300, 0x001a33, 0.92);
    const title = this.add.text(0, -130, '📅 예약 현황', {
      fontSize: '18px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    container.add([bg, title]);

    this.condoState.reservations.forEach((res, i) => {
      const y = -80 + i * 70;
      const resBg = this.add.rectangle(0, y, 380, 60,
        res.isPaid ? 0x003322 : 0x331100, 0.9
      );
      const resText = this.add.text(-180, y, [
        `👤 ${res.guestNickname}  |  침대 ${res.berths}개  |  ${res.isPaid ? '✅ 결제완료' : '⏳ 미결제'}`,
        `체크인: ${res.checkIn.toLocaleDateString('ko-KR')} → 체크아웃: ${res.checkOut.toLocaleDateString('ko-KR')}`,
        `금액: ₩${res.totalPaid.toLocaleString()}${res.specialRequest ? `  |  요청: ${res.specialRequest.substring(0, 20)}...` : ''}`,
      ].join('\n'), {
        fontSize: '11px', color: '#ccddee', lineSpacing: 4,
      }).setOrigin(0, 0.5);

      container.add([resBg, resText]);
    });
  }

  private showAmenities(): void {
    const { width, height } = this.scale;
    const container = this.add.container(width * 0.5, height * 0.5).setDepth(22).setName('condoContent');
    const bg = this.add.rectangle(0, 0, 400, 300, 0x001a33, 0.92);
    const title = this.add.text(0, -130, '🛠️ 부대시설', {
      fontSize: '18px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const allAmenities: { key: string; label: string; emoji: string }[] = [
      { key: 'fishing_deck', label: '낚시 데크', emoji: '🎣' },
      { key: 'bait_storage', label: '미끼 냉장고', emoji: '🐛' },
      { key: 'fish_cooler', label: '어창 (대형 쿨러)', emoji: '❄️' },
      { key: 'night_lamp', label: '집어등 시설', emoji: '💡' },
      { key: 'onboard_kitchen', label: '선상 주방', emoji: '🍳' },
      { key: 'bbq_grill', label: '갯바위 바베큐', emoji: '🔥' },
      { key: 'dive_platform', label: '해루질 다이빙 플랫폼', emoji: '🤿' },
      { key: 'gps_sonar', label: 'GPS + 어탐기', emoji: '📡' },
    ];

    container.add([bg, title]);
    allAmenities.forEach((a, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? -100 : 100;
      const y = -90 + row * 55;
      const hasIt = this.condoState.amenities.includes(a.key as any);

      const itemBg = this.add.rectangle(x, y, 180, 44, hasIt ? 0x003322 : 0x1a1a1a, 0.9);
      const icon = this.add.text(x - 75, y, a.emoji, { fontSize: '16px' }).setOrigin(0, 0.5);
      const label = this.add.text(x - 52, y - 8, a.label, {
        fontSize: '11px', color: hasIt ? '#aaffcc' : '#556666',
      }).setOrigin(0, 0.5);
      const status = this.add.text(x - 52, y + 8,
        hasIt ? '✅ 보유' : '🔒 미보유 (업그레이드)',
        { fontSize: '9px', color: hasIt ? '#55ff99' : '#aa5533' }
      ).setOrigin(0, 0.5);

      container.add([itemBg, icon, label, status]);
    });
  }

  private showPackages(): void {
    const { width, height } = this.scale;
    const container = this.add.container(width * 0.5, height * 0.5).setDepth(22).setName('condoContent');
    const bg = this.add.rectangle(0, 0, 400, 300, 0x001a33, 0.92);
    const title = this.add.text(0, -130, '📦 낚시 체험 패키지', {
      fontSize: '18px', color: '#aaddff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const packages = [
      { name: '갈치 야간 선상 패키지', price: 80000, includes: '낚싯대 대여 + 미끼 + 채비 + 선상 1박' },
      { name: '벵에돔 갯바위 패키지', price: 120000, includes: '전유동 채비 + 선상이동 + 1박 + 아침식사' },
      { name: '해루질 체험 패키지', price: 60000, includes: '집어등 대여 + 야간 안내 + 채취물 조리' },
      { name: '통발 조업 체험', price: 90000, includes: '통발 5개 + 미끼 + 1박 + 수거 동반' },
    ];

    container.add([bg, title]);
    packages.forEach((pkg, i) => {
      const y = -90 + i * 58;
      const pkgBg = this.add.rectangle(0, y, 360, 50, 0x001133, 0.9);
      const nameText = this.add.text(-170, y - 12, pkg.name, {
        fontSize: '13px', color: '#aaddff', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const priceText = this.add.text(130, y - 12, `₩${pkg.price.toLocaleString()}`, {
        fontSize: '14px', color: '#ffdd88', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const includeText = this.add.text(-170, y + 10, `✓ ${pkg.includes}`, {
        fontSize: '10px', color: '#88aacc',
      }).setOrigin(0, 0.5);

      container.add([pkgBg, nameText, priceText, includeText]);
    });
  }

  private getVesselLabel(): string {
    const labels: Record<string, string> = {
      small_boat: '소형 보트',
      cabin_boat: '캐빈 보트',
      large_vessel: '대형 선박',
      houseboat: '하우스보트',
    };
    return labels[this.condoState.vesselType] ?? '알 수 없음';
  }

  private createBackButton(): void {
    const { height } = this.scale;
    const btn = this.add.container(80, height - 35).setDepth(30).setInteractive(
      new Phaser.Geom.Rectangle(-70, -18, 140, 36),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.rectangle(0, 0, 140, 36, 0x333333, 0.9);
    const text = this.add.text(0, 0, '← 나가기', { fontSize: '13px', color: '#ffffff' }).setOrigin(0.5, 0.5);
    btn.add([bg, text]);
    btn.on('pointerdown', () => {
      this.scene.stop('CondoScene');
      this.scene.resume('FieldScene');
    });
  }
}
