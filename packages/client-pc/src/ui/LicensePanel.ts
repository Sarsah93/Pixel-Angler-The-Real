/**
 * @file LicensePanel.ts
 * @description 라이선스 / 면허 해금 현황 표시 및 취득을 위한 팝업 패널 (Phaser 3)
 */

import Phaser from 'phaser';
import { LICENSE_DATABASE, getLicenseByType, checkUnlockRequirements } from '@tra/core';
import type { LicenseType } from '@tra/core';
import { GameState } from '../store/GameState.js';

export class LicensePanel extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private listContainer?: Phaser.GameObjects.Container;
  private detailContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.createUI();
  }

  private createUI(): void {
    // 배경 창
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x0a1122, 0.95);
    this.bg.fillRoundedRect(-320, -220, 640, 440, 8);
    this.bg.lineStyle(2, 0x1f3c6d, 0.8);
    this.bg.strokeRoundedRect(-320, -220, 640, 440, 8);
    this.add(this.bg);

    // 타이틀
    const titleText = this.scene.add.text(0, -195, '📜 보유 면허 및 라이선스 발급', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '18px',
      color: '#ffeeaa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    // 리스트 컨테이너
    this.listContainer = this.scene.add.container(-300, -150);
    this.add(this.listContainer);

    // 상세 정보 컨테이너
    this.detailContainer = this.scene.add.container(60, -150);
    this.add(this.detailContainer);

    this.renderLicenseList();

    // 닫기 힌트
    const closeHint = this.scene.add.text(0, 205, '화면 아무 곳이나 클릭하거나 패널을 닫으려면 ESC를 누르세요.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#6688aa',
    }).setOrigin(0.5);
    this.add(closeHint);
  }

  private renderLicenseList(): void {
    this.listContainer?.removeAll(true);

    // 실제 GameState 연동
    const playerHeld = LICENSE_DATABASE.filter(lic => GameState.hasLicense(lic.type)).map(lic => lic.type);

    LICENSE_DATABASE.forEach((lic, idx) => {
      const y = idx * 36;
      if (y > 300) return; // 오버플로우 방지

      const isHeld = playerHeld.includes(lic.type);

      const itemContainer = this.scene.add.container(0, y);

      const itemBg = this.scene.add.graphics();
      itemBg.fillStyle(isHeld ? 0x003322 : 0x112233, 0.7);
      itemBg.fillRoundedRect(0, -15, 320, 30, 4);
      itemBg.lineStyle(1, isHeld ? 0x00aa66 : 0x224466, 0.5);
      itemBg.strokeRoundedRect(0, -15, 320, 30, 4);
      itemContainer.add(itemBg);

      const statusIcon = isHeld ? '🟢' : '🔒';
      const title = this.scene.add.text(10, 0, `${statusIcon} ${lic.nameKo}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: isHeld ? '#aaffcc' : '#ccddee',
      }).setOrigin(0, 0.5);
      itemContainer.add(title);

      const costText = this.scene.add.text(230, 0, isHeld ? '보유중' : `₩${lic.costCoins.toLocaleString()}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: isHeld ? '#88ffaa' : '#ffddaa',
      }).setOrigin(0, 0.5);
      itemContainer.add(costText);

      // 상호작용
      const hitArea = new Phaser.Geom.Rectangle(0, -15, 320, 30);
      itemContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
      itemContainer.on('pointerdown', () => this.showLicenseDetail(lic.type, isHeld));
      itemContainer.on('pointerover', () => itemBg.setAlpha(0.9));
      itemContainer.on('pointerout', () => itemBg.setAlpha(0.7));

      this.listContainer?.add(itemContainer);
    });
  }

  private showLicenseDetail(type: LicenseType, isHeld: boolean): void {
    this.detailContainer?.removeAll(true);

    const lic = getLicenseByType(type);
    if (!lic) return;

    const nameText = this.scene.add.text(0, 10, lic.nameKo, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '15px',
      color: '#ffeeaa',
      fontStyle: 'bold',
    });

    const descText = this.scene.add.text(0, 35, lic.description, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ccddee',
      wordWrap: { width: 220 },
      lineSpacing: 4,
    });

    this.detailContainer?.add([nameText, descText]);

    let reqY = 110;
    const reqTitle = this.scene.add.text(0, reqY, '📋 해금 요구사항', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#88aacc',
      fontStyle: 'bold',
    });
    this.detailContainer?.add(reqTitle);
    reqY += 20;

    if (lic.requirements.length === 0) {
      const noneReq = this.scene.add.text(0, reqY, '선행 조건 없음 (바로 구매 가능)', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#66aa88',
      });
      this.detailContainer?.add(noneReq);
      reqY += 20;
    } else {
      lic.requirements.forEach((req) => {
        let reqDesc = '';
        if (req.type === 'min_angling_trips') reqDesc = `• 출조 횟수: ${req.value}회 이상`;
        else if (req.type === 'min_fish_caught') reqDesc = `• 어획 누계: ${req.value}마리 이상`;
        else if (req.type === 'min_coins') reqDesc = `• 코인 보유: ₩${req.value.toLocaleString()} 이상`;
        else if (req.type === 'license_held') reqDesc = `• 선행 면허: ${getLicenseByType(req.licenseType)?.nameKo}`;
        else if (req.type === 'spot_visited') reqDesc = `• 특정 장소 방문 필요`;

        const reqTxt = this.scene.add.text(0, reqY, reqDesc, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '11px',
          color: '#ffaa66',
        });
        this.detailContainer?.add(reqTxt);
        reqY += 18;
      });
    }

    // 발급 받기 버튼
    if (!isHeld) {
      const buyBtnContainer = this.scene.add.container(100, 260);

      const buyBtnBg = this.scene.add.graphics();
      buyBtnBg.fillStyle(0x005533, 0.9);
      buyBtnBg.fillRoundedRect(-80, -16, 160, 32, 4);
      buyBtnBg.lineStyle(1.5, 0x00aa66, 0.8);
      buyBtnBg.strokeRoundedRect(-80, -16, 160, 32, 4);
      buyBtnContainer.add(buyBtnBg);

      const buyBtnText = this.scene.add.text(0, 0, '💳 면허 발급 신청', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      buyBtnContainer.add(buyBtnText);

      buyBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-80, -16, 160, 32), Phaser.Geom.Rectangle.Contains);
      buyBtnContainer.on('pointerdown', () => {
        // 실제 해금 요건 및 코인 차감 적용
        const context = {
          totalTrips: GameState.player.totalTrips,
          totalFishCaught: GameState.player.caughtFishHistory.length,
          caughtFishIds: GameState.player.caughtFishHistory.map((f) => f.fishSpeciesId),
          coins: GameState.player.inventory.coins,
          heldLicenses: GameState.licenses.map((l) => l.type),
          completedQuests: GameState.completedQuestIds,
          visitedSpots: GameState.visitedSpotIds,
          reputationScore: GameState.restaurant?.reputationScore ?? 0,
        };

        const { met } = checkUnlockRequirements(lic.requirements, context);

        if (!met) {
          this.scene.cameras.main.flash(200, 150, 0, 0);
          buyBtnText.setText('조건 미충족');
          this.scene.time.delayedCall(1500, () => {
            buyBtnText.setText('💳 면허 발급 신청');
          });
          return;
        }

        if (GameState.player.inventory.coins < lic.costCoins) {
          this.scene.cameras.main.flash(200, 150, 0, 0);
          buyBtnText.setText('코인 부족');
          this.scene.time.delayedCall(1500, () => {
            buyBtnText.setText('💳 면허 발급 신청');
          });
          return;
        }

        // 코인 차감 및 라이선스 획득
        GameState.addCoins(-lic.costCoins);
        GameState.acquireLicense(lic.type);
        GameState.save();

        buyBtnText.setText('발급 완료!');
        buyBtnBg.fillStyle(0x003311, 0.9);
        this.scene.cameras.main.flash(200, 0, 150, 80);

        this.scene.time.delayedCall(1000, () => {
          this.renderLicenseList();
          this.showLicenseDetail(lic.type, true);
        });
      });

      this.detailContainer?.add(buyBtnContainer);
    } else {
      const heldMsg = this.scene.add.text(0, 260, '✓ 이미 유효하게 소지하고 있는 면허입니다.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#aaffcc',
      });
      this.detailContainer?.add(heldMsg);
    }
  }
}
