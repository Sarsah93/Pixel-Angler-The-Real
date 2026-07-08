/**
 * @file ConfirmTripModal.ts
 * @description 출조지 이동 재확인 모달 UI
 *
 * 스팟 선택 후 [이동하기] / [취소] 버튼으로 최종 확인을 받습니다.
 * 모달에는 스팟 정보, 현재 물때/날씨, 면허 상태, 제철 어종을 표시합니다.
 */

import Phaser from 'phaser';
import {
  FishingSpotInfo,
  FISH_DATABASE,
  calculateTideInfo,
  LicenseType,
  LICENSE_DATABASE,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export interface ConfirmTripCallbacks {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 출조지 이동 재확인 모달
 *
 * 사용법:
 * ```ts
 * const modal = new ConfirmTripModal(this, spot, {
 *   onConfirm: () => { ... },
 *   onCancel:  () => { modal.destroy(); },
 * });
 * this.add.existing(modal);
 * ```
 */
export class ConfirmTripModal extends Phaser.GameObjects.Container {
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene,
    spot: FishingSpotInfo,
    callbacks: ConfirmTripCallbacks,
  ) {
    super(scene, 0, 0);
    this.setDepth(500);
    this.setScrollFactor(0);

    this.buildModal(spot, callbacks);

    // ESC → 취소
    this.escKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey?.once('down', () => {
      callbacks.onCancel();
    });
  }

  private buildModal(spot: FishingSpotInfo, callbacks: ConfirmTripCallbacks): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    // ── 딤 오버레이 ──────────────────────────────────────
    const dimBg = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);
    this.add(dimBg);

    // ── 모달 카드 ─────────────────────────────────────────
    const cardW = 560;
    const cardH = 380;
    const cardX = W / 2 - cardW / 2;
    const cardY = H / 2 - cardH / 2;

    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(0x060f1e, 0.97);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 6);
    cardBg.lineStyle(2, 0x4af2a1, 0.9);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 6);
    this.add(cardBg);

    // ── 헤더: 스팟 이름 ──────────────────────────────────
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0x0d2a40, 0.9);
    headerBg.fillRoundedRect(cardX, cardY, cardW, 52, 6);
    this.add(headerBg);

    const titleText = this.scene.add.text(W / 2, cardY + 26, spot.name, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    const regionText = this.scene.add.text(W / 2, cardY + 46, `📍 ${spot.regionName}`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#8faabf',
    }).setOrigin(0.5, 0);
    this.add(regionText);

    // ── 본문 정보 패널 (두 열) ────────────────────────────
    const infoY = cardY + 76;
    const colLeftX = cardX + 24;
    const colRightX = W / 2 + 12;

    // 물때/날씨 정보
    const date = new Date();
    const tide = calculateTideInfo(date);
    const mockTempC = 14 + Math.sin(((date.getMonth() + 1) / 6) * Math.PI) * 9;
    const windSpeed = 3.5 + Math.random() * 4.0;

    const leftLines = [
      { label: '🌊 물때',   value: tide.tidePhaseLabel },
      { label: '🌡️ 기온',   value: `${mockTempC.toFixed(1)} °C` },
      { label: '💧 수온',   value: `${(mockTempC - 1.2).toFixed(1)} °C` },
      { label: '🌬️ 풍속',   value: `${windSpeed.toFixed(1)} m/s` },
      { label: '⚓ 스팟 종류', value: this.getSpotTypeLabel(spot.spotType) },
    ];

    leftLines.forEach((item, i) => {
      const ly = infoY + i * 34;
      const lbl = this.scene.add.text(colLeftX, ly, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#c8a060',
        fontStyle: 'bold',
      });
      this.add(lbl);

      const val = this.scene.add.text(colLeftX + 110, ly, item.value, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#e8f4fd',
      });
      this.add(val);
    });

    // 면허 상태
    const reqLicense = this.getRequiredLicense(spot.spotType);
    const hasLicense = GameState.hasLicense(reqLicense);
    const licDef = LICENSE_DATABASE.find((l) => l.type === reqLicense);
    const licName = licDef?.nameKo ?? reqLicense;

    const licenseLabel = this.scene.add.text(colRightX, infoY, '🪪 요구 면허', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#c8a060',
      fontStyle: 'bold',
    });
    this.add(licenseLabel);

    const licenseValue = this.scene.add.text(colRightX, infoY + 18, licName, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: hasLicense ? '#4af2a1' : '#ff5555',
      fontStyle: 'bold',
    });
    this.add(licenseValue);

    const licStatusText = this.scene.add.text(colRightX, infoY + 36, hasLicense ? '✅ 보유 중' : '❌ 미보유 — 이동 불가', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: hasLicense ? '#4af2a1' : '#ff5555',
    });
    this.add(licStatusText);

    // 제철 어종 목록
    const speciesLabel = this.scene.add.text(colRightX, infoY + 68, '🐟 주요 어종', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#c8a060',
      fontStyle: 'bold',
    });
    this.add(speciesLabel);

    const speciesNames = spot.mainSpeciesIds
      .slice(0, 4)
      .map((id) => {
        const fish = FISH_DATABASE.find((f) => f.id === id);
        return fish ? fish.nameKo : id;
      })
      .join('  ·  ');

    const speciesText = this.scene.add.text(colRightX, infoY + 86, speciesNames, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#e8f4fd',
      wordWrap: { width: 240 },
    });
    this.add(speciesText);

    // 스팟 설명
    const descText = this.scene.add.text(colRightX, infoY + 130, spot.description, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#8faabf',
      wordWrap: { width: 240 },
    });
    this.add(descText);

    // ── 구분선 ────────────────────────────────────────────
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x1f3d5a, 0.7);
    divider.lineBetween(cardX + 16, cardY + cardH - 70, cardX + cardW - 16, cardY + cardH - 70);
    this.add(divider);

    // ── 버튼 영역 ─────────────────────────────────────────
    const btnY = cardY + cardH - 40;

    // [취소] 버튼
    const cancelBtn = this.scene.add.container(W / 2 - 100, btnY);
    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(0x1f3045, 0.9);
    cancelBg.fillRoundedRect(-72, -18, 144, 36, 4);
    cancelBg.lineStyle(1.5, 0x4a6a8a, 0.8);
    cancelBg.strokeRoundedRect(-72, -18, 144, 36, 4);
    const cancelText = this.scene.add.text(0, 0, '← 취소', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#8faabf',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelText]);

    cancelBtn.setInteractive(
      new Phaser.Geom.Rectangle(-72, -18, 144, 36),
      Phaser.Geom.Rectangle.Contains,
    );
    cancelBtn.on('pointerover', () => cancelBg.setAlpha(1.5));
    cancelBtn.on('pointerout', () => cancelBg.setAlpha(1));
    cancelBtn.on('pointerdown', () => callbacks.onCancel());
    this.add(cancelBtn);

    // [이동하기] 버튼 (면허 없으면 비활성)
    const confirmBtn = this.scene.add.container(W / 2 + 100, btnY);
    const confirmBg = this.scene.add.graphics();
    confirmBg.fillStyle(hasLicense ? 0x0d4a2e : 0x2a2a2a, 0.95);
    confirmBg.fillRoundedRect(-72, -18, 144, 36, 4);
    confirmBg.lineStyle(2, hasLicense ? 0x4af2a1 : 0x555555, 0.9);
    confirmBg.strokeRoundedRect(-72, -18, 144, 36, 4);
    const confirmText = this.scene.add.text(0, 0, '이동하기 ▶', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: hasLicense ? '#4af2a1' : '#555555',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmBtn.add([confirmBg, confirmText]);

    if (hasLicense) {
      confirmBtn.setInteractive(
        new Phaser.Geom.Rectangle(-72, -18, 144, 36),
        Phaser.Geom.Rectangle.Contains,
      );
      confirmBtn.on('pointerover', () => {
        confirmBg.clear();
        confirmBg.fillStyle(0x1a6a3e, 0.95);
        confirmBg.fillRoundedRect(-72, -18, 144, 36, 4);
        confirmBg.lineStyle(2, 0x4af2a1, 1);
        confirmBg.strokeRoundedRect(-72, -18, 144, 36, 4);
      });
      confirmBtn.on('pointerout', () => {
        confirmBg.clear();
        confirmBg.fillStyle(0x0d4a2e, 0.95);
        confirmBg.fillRoundedRect(-72, -18, 144, 36, 4);
        confirmBg.lineStyle(2, 0x4af2a1, 0.9);
        confirmBg.strokeRoundedRect(-72, -18, 144, 36, 4);
      });
      confirmBtn.on('pointerdown', () => callbacks.onConfirm());
    }
    this.add(confirmBtn);

    // ESC 힌트
    const escHint = this.scene.add.text(W / 2, cardY + cardH + 10, '[ESC] 취소', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#4a6a8a',
    }).setOrigin(0.5, 0);
    this.add(escHint);
  }

  private getSpotTypeLabel(spotType: string): string {
    const labels: Record<string, string> = {
      breakwater: '방파제',
      rocky_shore: '갯바위',
      boat_fishing: '선상',
      tidal_flat: '갯벌/조간대',
      beach: '해수욕장/모래밭',
    };
    return labels[spotType] ?? spotType;
  }

  private getRequiredLicense(spotType: string): LicenseType {
    if (spotType === 'boat_fishing' || spotType === 'overnight_boat') return 'boat_angling';
    if (spotType === 'tidal_flat') return 'shore_hunting_basic';
    return 'basic_angling';
  }

  override destroy(fromScene?: boolean): void {
    // ESC 키 리스너 정리
    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
    super.destroy(fromScene);
  }
}
