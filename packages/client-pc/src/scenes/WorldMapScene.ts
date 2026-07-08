/**
 * @file WorldMapScene.ts
 * @description 한국 지도 출조지 선택 씬 — 지역→스팟 2단계 드릴다운
 *
 * 상태 머신:
 *  REGION_SELECT → 지역 클릭 → SPOT_SELECT → 스팟 클릭 → CONFIRM_MODAL → 이동하기 → FieldScene
 *                                             ← ESC / [뒤로가기] ←
 *                              ← ESC / [뒤로가기] ←
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import {
  SPOT_DATABASE,
  REGION_DATABASE,
  RegionDef,
  FishingSpotInfo,
  latLonToDotMapXY,
  calculateTideInfo,
  FISH_DATABASE,
  LicenseType,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { ConfirmTripModal } from '../ui/ConfirmTripModal.js';

type ViewState = 'region' | 'spot' | 'confirm';

export class WorldMapScene extends Phaser.Scene {
  // ── 상태 머신 ──────────────────────────────────────────
  private viewState: ViewState = 'region';

  // ── 렌더링 오브젝트 참조 ──────────────────────────────
  private regionContainer!: Phaser.GameObjects.Container;
  private spotContainer!: Phaser.GameObjects.Container;
  private confirmModal: ConfirmTripModal | null = null;
  private mapGraphics?: Phaser.GameObjects.Graphics;

  // ── 툴팁 ──────────────────────────────────────────────
  private tooltipContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    // 배경
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050b14).setOrigin(0, 0);

    // 지도 그리기
    this.drawKoreaMap();

    // 툴팁 초기화
    this.createTooltipContainer();

    // 컨테이너 생성
    this.regionContainer = this.add.container(0, 0);
    this.spotContainer = this.add.container(0, 0);

    // ESC 핸들링
    this.input.keyboard?.on('keydown-ESC', () => this.handleEsc());

    // 초기 상태: 지역 뷰
    this.renderRegionView();

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  // ═══════════════════════════════════════════════════════
  // ESC 계층 복귀
  // ═══════════════════════════════════════════════════════
  private handleEsc(): void {
    switch (this.viewState) {
      case 'confirm':
        this.closeConfirmModal();
        break;
      case 'spot':
        this.switchToRegionView();
        break;
      case 'region':
      default:
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MainMenuScene');
        });
        break;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 지역 뷰 (REGION_SELECT)
  // ═══════════════════════════════════════════════════════
  private renderRegionView(): void {
    this.viewState = 'region';
    this.regionContainer.removeAll(true);
    this.spotContainer.removeAll(true);

    // 타이틀
    const title = this.add.text(40, 30, '📍 출조지 선택 — 지역을 클릭하세요', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '22px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    const hint = this.add.text(40, 62, '지역 클릭 → 포인트 목록 → 이동 확인 순으로 진행합니다. [ESC] 메인 메뉴 복귀', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#607b8e',
    });
    this.regionContainer.add([title, hint]);

    // 지역 목록 (왼쪽 패널)
    REGION_DATABASE.forEach((region, _idx) => {
      const itemY = 110 + _idx * 52;
      const btn = this.add.container(0, 0);

      const bg = this.add.graphics();
      bg.fillStyle(0x0e1c2d, 0.9);
      bg.fillRoundedRect(30, itemY, 340, 44, 4);
      bg.lineStyle(1.5, 0x1f3d5a, 0.8);
      bg.strokeRoundedRect(30, itemY, 340, 44, 4);

      const nameText = this.add.text(54, itemY + 10, region.nameKo, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '16px',
        color: '#d0e8f5',
        fontStyle: 'bold',
      });
      const subText = this.add.text(54, itemY + 28, `포인트 ${region.subSpotIds.length}개`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px',
        color: '#607b8e',
      });

      btn.add([bg, nameText, subText]);

      // 히트 영역
      const hit = this.add.rectangle(200, itemY + 22, 340, 44, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x162a40, 0.95);
        bg.fillRoundedRect(30, itemY, 340, 44, 4);
        bg.lineStyle(1.5, 0x2a5a8a, 1);
        bg.strokeRoundedRect(30, itemY, 340, 44, 4);
        nameText.setColor('#4af2a1');
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x0e1c2d, 0.9);
        bg.fillRoundedRect(30, itemY, 340, 44, 4);
        bg.lineStyle(1.5, 0x1f3d5a, 0.8);
        bg.strokeRoundedRect(30, itemY, 340, 44, 4);
        nameText.setColor('#d0e8f5');
      });
      hit.on('pointerdown', () => {
        this.renderSpotView(region);
      });
      btn.add(hit);

      this.regionContainer.add(btn);

      // 지도 위 노드 마커 그리기
      const mapPos = this.getMapCoordinate(region.latitude, region.longitude);
      this.drawRegionMarker(mapPos.x, mapPos.y, region);
    });

    // 범례
    this.drawLegend();
  }

  private drawRegionMarker(x: number, y: number, region: RegionDef): void {
    const dot = this.add.circle(x, y, 7, 0x4af2a1);
    const ring = this.add.circle(x, y, 14, 0x4af2a1, 0);
    ring.setStrokeStyle(1.5, 0x4af2a1);

    this.tweens.add({ targets: ring, scaleX: 2, scaleY: 2, alpha: 0, duration: 1400, repeat: -1 });

    const label = this.add.text(x, y + 14, region.shortNameKo, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#4af2a1',
      backgroundColor: '#060f1e99',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0);

    // 클릭 가능
    dot.setInteractive(new Phaser.Geom.Circle(x, y, 14), Phaser.Geom.Circle.Contains);
    dot.on('pointerover', () => { dot.setFillStyle(0xffffff); this.showRegionTooltip(region, x, y); });
    dot.on('pointerout', () => { dot.setFillStyle(0x4af2a1); this.hideTooltip(); });
    dot.on('pointerdown', () => {
      this.renderSpotView(region);
    });

    this.regionContainer.add([dot, ring, label]);
  }

  // ═══════════════════════════════════════════════════════
  // 스팟 뷰 (SPOT_SELECT)
  // ═══════════════════════════════════════════════════════
  private renderSpotView(region: RegionDef): void {
    this.viewState = 'spot';
    this.regionContainer.removeAll(true);
    this.spotContainer.removeAll(true);
    this.hideTooltip();

    // 헤더: 뒤로가기 버튼
    const backBtn = this.add.container(0, 0);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1f3045, 0.9);
    backBg.fillRoundedRect(30, 20, 120, 32, 4);
    backBg.lineStyle(1, 0x2a5a8a, 0.8);
    backBg.strokeRoundedRect(30, 20, 120, 32, 4);
    const backText = this.add.text(90, 36, '← 지역 목록', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#8faabf',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);

    const backHit = this.add.rectangle(90, 36, 120, 32, 0xffffff, 0).setInteractive({ useHandCursor: true });
    backHit.on('pointerdown', () => this.switchToRegionView());
    backHit.on('pointerover', () => backText.setColor('#4af2a1'));
    backHit.on('pointerout', () => backText.setColor('#8faabf'));
    backBtn.add(backHit);
    this.spotContainer.add(backBtn);

    const title = this.add.text(170, 30, `📍 ${region.nameKo} — 낚시 포인트`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    const hintText = this.add.text(170, 58, '포인트를 클릭하면 이동 확인 창이 열립니다. [ESC] 지역 목록으로', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#607b8e',
    });
    this.spotContainer.add([title, hintText]);

    // 해당 지역 스팟 목록
    const spots = region.subSpotIds
      .map((id) => SPOT_DATABASE.find((s) => s.id === id))
      .filter((s): s is FishingSpotInfo => s !== undefined);

    spots.forEach((spot, _idx) => {
      const itemY = 90 + _idx * 56;
      const reqLicense = this.getRequiredLicense(spot.spotType);
      const hasLicense = GameState.hasLicense(reqLicense);
      const spotColor = this.getMarkerColor(spot.spotType);

      const itemBg = this.add.graphics();
      itemBg.fillStyle(hasLicense ? 0x0e1c2d : 0x141414, 0.9);
      itemBg.fillRoundedRect(30, itemY, 400, 48, 4);
      itemBg.lineStyle(1.5, hasLicense ? 0x2a5a8a : 0x333333, 0.8);
      itemBg.strokeRoundedRect(30, itemY, 400, 48, 4);

      const typeDot = this.add.circle(54, itemY + 24, 6, hasLicense ? spotColor : 0x444444);

      const nameText = this.add.text(70, itemY + 8, spot.name, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '14px',
        color: hasLicense ? '#e8f4fd' : '#555555',
        fontStyle: 'bold',
      });
      const subInfo = this.add.text(
        70, itemY + 27,
        `${this.getSpotTypeLabel(spot.spotType)}  ·  ${spot.mainSpeciesIds.slice(0, 3).map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id).join(' / ')}`,
        {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '10px',
          color: hasLicense ? '#8faabf' : '#444444',
        },
      );

      // 면허 없으면 자물쇠 아이콘
      if (!hasLicense) {
        const lockIcon = this.add.text(400, itemY + 16, '🔒', { fontSize: '14px' });
        this.spotContainer.add(lockIcon);
      }

      const hit = this.add.rectangle(230, itemY + 24, 400, 48, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        itemBg.clear();
        itemBg.fillStyle(hasLicense ? 0x162a40 : 0x141414, 0.95);
        itemBg.fillRoundedRect(30, itemY, 400, 48, 4);
        itemBg.lineStyle(1.5, hasLicense ? 0x4af2a1 : 0x333333, 1);
        itemBg.strokeRoundedRect(30, itemY, 400, 48, 4);
        this.showSpotTooltip(spot, 440 + 10, itemY);
      });
      hit.on('pointerout', () => {
        itemBg.clear();
        itemBg.fillStyle(hasLicense ? 0x0e1c2d : 0x141414, 0.9);
        itemBg.fillRoundedRect(30, itemY, 400, 48, 4);
        itemBg.lineStyle(1.5, hasLicense ? 0x2a5a8a : 0x333333, 0.8);
        itemBg.strokeRoundedRect(30, itemY, 400, 48, 4);
        this.hideTooltip();
      });
      hit.on('pointerdown', () => {
        if (!hasLicense) { this.showLicenseBlockAlert(); return; }
        this.showConfirmModal(spot);
      });

      this.spotContainer.add([itemBg, typeDot, nameText, subInfo, hit]);

      // 지도 위 스팟 마커
      const mapPos = this.getMapCoordinate(spot.latitude, spot.longitude);
      this.drawSpotMarker(mapPos.x, mapPos.y, spot, hasLicense);
    });
  }

  private drawSpotMarker(x: number, y: number, spot: FishingSpotInfo, hasLicense: boolean): void {
    const color = hasLicense ? this.getMarkerColor(spot.spotType) : 0x444444;
    const dot = this.add.circle(x, y, 5, color);
    const ring = this.add.circle(x, y, 11, color, 0);
    ring.setStrokeStyle(1.2, color);
    this.tweens.add({ targets: ring, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 1200, repeat: -1 });

    dot.setInteractive(new Phaser.Geom.Circle(x, y, 12), Phaser.Geom.Circle.Contains);
    dot.on('pointerdown', () => {
      if (!hasLicense) { this.showLicenseBlockAlert(); return; }
      this.showConfirmModal(spot);
    });

    this.spotContainer.add([dot, ring]);
  }

  // ═══════════════════════════════════════════════════════
  // 재확인 모달 (CONFIRM_MODAL)
  // ═══════════════════════════════════════════════════════
  private showConfirmModal(spot: FishingSpotInfo): void {
    this.viewState = 'confirm';
    this.closeConfirmModal();

    this.confirmModal = new ConfirmTripModal(this, spot, {
      onConfirm: () => {
        this.closeConfirmModal();
        GameState.setCurrentSpot(spot.id);
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('FieldScene', { spotId: spot.id });
        });
      },
      onCancel: () => {
        this.closeConfirmModal();
      },
    });
    this.add.existing(this.confirmModal);
  }

  private closeConfirmModal(): void {
    if (this.confirmModal) {
      this.confirmModal.destroy();
      this.confirmModal = null;
    }
    if (this.viewState === 'confirm') {
      this.viewState = 'spot';
    }
  }

  private switchToRegionView(): void {
    this.hideTooltip();
    this.renderRegionView();
  }

  // ═══════════════════════════════════════════════════════
  // 지도 배경 그리기
  // ═══════════════════════════════════════════════════════
  private drawKoreaMap(): void {
    this.mapGraphics = this.add.graphics();
    this.mapGraphics.lineStyle(2, 0x1f3d5a, 0.8);
    this.mapGraphics.fillStyle(0x0e1c2d, 0.9);

    const mapPoints = [
      new Phaser.Geom.Point(850, 100),
      new Phaser.Geom.Point(920, 120),
      new Phaser.Geom.Point(950, 180),
      new Phaser.Geom.Point(960, 320),
      new Phaser.Geom.Point(975, 400),
      new Phaser.Geom.Point(990, 480),
      new Phaser.Geom.Point(930, 540),
      new Phaser.Geom.Point(860, 550),
      new Phaser.Geom.Point(800, 510),
      new Phaser.Geom.Point(810, 420),
      new Phaser.Geom.Point(820, 320),
      new Phaser.Geom.Point(830, 240),
    ];
    this.mapGraphics.beginPath();
    this.mapGraphics.moveTo(mapPoints[0].x, mapPoints[0].y);
    for (let i = 1; i < mapPoints.length; i++) {
      this.mapGraphics.lineTo(mapPoints[i].x, mapPoints[i].y);
    }
    this.mapGraphics.closePath();
    this.mapGraphics.fillPath();
    this.mapGraphics.strokePath();

    // 제주도
    this.mapGraphics.fillEllipse(850, 595, 40, 20);
    this.mapGraphics.strokeEllipse(850, 595, 40, 20);

    // 독도/울릉도
    this.mapGraphics.fillCircle(1050, 360, 5);
    this.mapGraphics.strokeCircle(1050, 360, 5);

    // 휴전선
    this.mapGraphics.lineStyle(1.5, 0x6e2f2f, 0.7);
    this.mapGraphics.lineBetween(825, 290, 955, 305);

    // 지도 라벨
    this.add.text(895, 660, '대한민국', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#2a5a8a',
    }).setOrigin(0.5);
  }

  private drawLegend(): void {
    const legendItems = [
      { color: 0x00d2ff, label: '방파제' },
      { color: 0xff6b6b, label: '갯바위' },
      { color: 0xffd700, label: '선상' },
      { color: 0x78e08f, label: '갯벌' },
    ];

    const lx = GAME_WIDTH - 160;
    const ly = GAME_HEIGHT - 100;

    const bgG = this.add.graphics();
    bgG.fillStyle(0x0a1628, 0.8);
    bgG.fillRoundedRect(lx - 10, ly - 10, 150, legendItems.length * 20 + 20, 4);
    this.regionContainer.add(bgG);

    legendItems.forEach((item, i) => {
      const dot = this.add.circle(lx + 6, ly + i * 20 + 6, 5, item.color);
      const label = this.add.text(lx + 18, ly + i * 20, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#a0b8c8',
      });
      this.regionContainer.add([dot, label]);
    });
  }

  // ═══════════════════════════════════════════════════════
  // 툴팁
  // ═══════════════════════════════════════════════════════
  private createTooltipContainer(): void {
    this.tooltipContainer = this.add.container(0, 0).setDepth(300).setVisible(false);

    const bg = this.add.graphics();
    const titleTxt = this.add.text(12, 10, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    const bodyTxt = this.add.text(12, 32, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ccddee',
      lineSpacing: 4,
      wordWrap: { width: 200 },
    });
    this.tooltipContainer.add([bg, titleTxt, bodyTxt]);
  }

  private showRegionTooltip(region: RegionDef, x: number, y: number): void {
    if (!this.tooltipContainer) return;

    let px = x + 15;
    let py = y - 80;
    if (px + 220 > GAME_WIDTH) px = x - 235;
    if (py < 10) py = y + 15;

    this.tooltipContainer.setPosition(px, py);

    const speciesNames = region.representativeSpeciesIds
      .map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id)
      .join(', ');

    const bg = this.tooltipContainer.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x050f1e, 0.95);
    bg.fillRoundedRect(0, 0, 220, 100, 4);
    bg.lineStyle(1.5, 0x4af2a1, 0.9);
    bg.strokeRoundedRect(0, 0, 220, 100, 4);

    const titleTxt = this.tooltipContainer.getAt(1) as Phaser.GameObjects.Text;
    titleTxt.setText(region.nameKo);

    const bodyTxt = this.tooltipContainer.getAt(2) as Phaser.GameObjects.Text;
    bodyTxt.setText(`포인트: ${region.subSpotIds.length}개\n대표 어종: ${speciesNames}`);

    this.tooltipContainer.setVisible(true);
  }

  private showSpotTooltip(spot: FishingSpotInfo, x: number, y: number): void {
    if (!this.tooltipContainer) return;

    const date = new Date();
    const tide = calculateTideInfo(date);
    const mockTempC = 14 + Math.sin(((date.getMonth() + 1) / 6) * Math.PI) * 9;

    let px = x;
    let py = y - 10;
    if (px + 220 > GAME_WIDTH) px = x - 240;
    if (py < 10) py = 10;

    this.tooltipContainer.setPosition(px, py);

    const bg = this.tooltipContainer.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x050f1e, 0.95);
    bg.fillRoundedRect(0, 0, 220, 130, 4);
    bg.lineStyle(1.5, 0x4af2a1, 0.9);
    bg.strokeRoundedRect(0, 0, 220, 130, 4);

    const titleTxt = this.tooltipContainer.getAt(1) as Phaser.GameObjects.Text;
    titleTxt.setText(spot.name);

    const speciesNames = spot.mainSpeciesIds
      .slice(0, 3)
      .map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id)
      .join(', ');

    const bodyTxt = this.tooltipContainer.getAt(2) as Phaser.GameObjects.Text;
    bodyTxt.setText(`물때: ${tide.tidePhaseLabel}\n수온: ${(mockTempC - 1.2).toFixed(1)}°C\n주요 어종: ${speciesNames}`);

    this.tooltipContainer.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltipContainer?.setVisible(false);
  }

  private showLicenseBlockAlert(): void {
    const alertTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 56, '🔒 면허가 없어 이동할 수 없습니다. 필드에서 면허사무소를 이용해 주세요.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#ff4444',
      backgroundColor: '#050f1ecc',
      padding: { x: 12, y: 6 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(400);
    this.time.delayedCall(2800, () => alertTxt.destroy());
  }

  // ═══════════════════════════════════════════════════════
  // 유틸
  // ═══════════════════════════════════════════════════════
  private getMapCoordinate(lat: number, lon: number): { x: number; y: number } {
    const { x, y } = latLonToDotMapXY(lat, lon);
    const mapMinX = 810;
    const mapMaxX = 990;
    const mapMinY = 130;
    const mapMaxY = 600;
    return {
      x: mapMinX + x * (mapMaxX - mapMinX),
      y: mapMinY + y * (mapMaxY - mapMinY),
    };
  }

  private getMarkerColor(spotType: string): number {
    switch (spotType) {
      case 'breakwater': return 0x00d2ff;
      case 'rocky_shore': return 0xff6b6b;
      case 'boat_fishing': return 0xffd700;
      case 'tidal_flat': return 0x78e08f;
      case 'beach': return 0xffe066;
      default: return 0xffffff;
    }
  }

  private getSpotTypeLabel(spotType: string): string {
    const labels: Record<string, string> = {
      breakwater: '방파제',
      rocky_shore: '갯바위',
      boat_fishing: '선상',
      tidal_flat: '갯벌',
      beach: '해수욕장',
    };
    return labels[spotType] ?? spotType;
  }

  private getRequiredLicense(spotType: string): LicenseType {
    if (spotType === 'boat_fishing' || spotType === 'overnight_boat') return 'boat_angling';
    if (spotType === 'tidal_flat') return 'shore_hunting_basic';
    return 'basic_angling';
  }
}
