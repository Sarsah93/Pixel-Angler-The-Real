/**
 * @file HUD.ts
 * @description 게임 화면의 UI 오버레이 (STATUS 게이지, 8개 퀵슬롯, 커뮤니티창, 미니맵 연동)
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { calculateTideInfo } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export class HUD extends Phaser.GameObjects.Container {
  // STATUS (좌상단)
  private statusBg!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private fatigueBar!: Phaser.GameObjects.Graphics;
  private coinsText!: Phaser.GameObjects.Text;
  
  // 물때 정보 (상단 중앙)
  private tideText!: Phaser.GameObjects.Text;

  // 퀵슬롯 (중앙 하단)
  private quickslots: Phaser.GameObjects.Container[] = [];
  private quickslotItems = [
    { name: '낚싯대', icon: '🎣' },
    { name: '통발', icon: '🕸️' },
    { name: '미끼', icon: '🐛' },
    { name: '빈손', icon: '✋' },
    { name: '아이템', icon: '📦' },
    { name: '아이템', icon: '📦' },
    { name: '아이템', icon: '📦' },
    { name: '아이템', icon: '📦' },
  ];

  // 커뮤니티 (좌하단)
  private communityPanel!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.createUI();
    this.updateHUD();

    // 1초마다 HUD 정보 업데이트
    scene.time.addEvent({
      delay: 1000,
      callback: this.updateHUD,
      callbackScope: this,
      loop: true,
    });

    this.setScrollFactor(0); // 화면 고정
  }

  private createUI(): void {
    // ─── 1. STATUS 패널 (좌상단) ───
    this.statusBg = this.scene.add.graphics();
    this.statusBg.fillStyle(0x0a1628, 0.85);
    this.statusBg.fillRoundedRect(16, 16, 220, 95, 4);
    this.statusBg.lineStyle(1.5, 0x2a5a8a, 0.8);
    this.statusBg.strokeRoundedRect(16, 16, 220, 95, 4);
    this.add(this.statusBg);

    // 체력(Stamina) 게이지바 그리기용 그래픽스
    this.staminaBar = this.scene.add.graphics();
    this.add(this.staminaBar);

    // 피로도(Fatigue) 게이지바 그리기용 그래픽스
    this.fatigueBar = this.scene.add.graphics();
    this.add(this.fatigueBar);

    // 지갑 코인 표시
    this.coinsText = this.scene.add.text(28, 80, '앵글러 코인: 0 KRW', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ffff33',
      fontStyle: 'bold',
    });
    this.add(this.coinsText);

    // ─── 2. 물때 정보 (상단 중앙) ───
    this.tideText = this.scene.add.text(GAME_WIDTH / 2, 16, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#4af2a1',
      backgroundColor: '#050f1ecc',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0);
    this.tideText.setStroke('#1f3d5a', 1);
    this.add(this.tideText);

    // ─── 3. 퀵슬롯 8개 (중앙 하단) ───
    const slotW = 44;
    const slotH = 44;
    const spacing = 8;
    const totalW = 8 * slotW + 7 * spacing;
    const startX = (GAME_WIDTH - totalW) / 2;
    const slotY = GAME_HEIGHT - slotH - 24;

    // 퀵슬롯 배경 검정 투명 띠
    const quickBarBg = this.scene.add.graphics();
    quickBarBg.fillStyle(0x060d1acc, 0.7);
    quickBarBg.fillRect(startX - 12, slotY - 8, totalW + 24, slotH + 16);
    quickBarBg.lineStyle(1.5, 0x1f3d5a, 0.5);
    quickBarBg.strokeRect(startX - 12, slotY - 8, totalW + 24, slotH + 16);
    this.add(quickBarBg);

    for (let i = 0; i < 8; i++) {
      const sx = startX + i * (slotW + spacing);
      const slotContainer = this.scene.add.container(sx + slotW / 2, slotY + slotH / 2);

      // 슬롯 박스
      const box = this.scene.add.graphics();
      box.name = 'box';
      slotContainer.add(box);

      // 아이템 아이콘
      const item = this.quickslotItems[i];
      const icon = this.scene.add.text(0, -4, item.icon, { fontSize: '20px' }).setOrigin(0.5);
      slotContainer.add(icon);

      // 단축키 번호 라벨 (1~8)
      const label = this.scene.add.text(-slotW / 2 + 5, -slotH / 2 + 5, String(i + 1), {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8faabf',
      });
      slotContainer.add(label);

      // 아이템명 (하단 아주 작게)
      const nameTxt = this.scene.add.text(0, slotH / 2 - 8, item.name, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '8px',
        color: '#ffffff88',
      }).setOrigin(0.5);
      slotContainer.add(nameTxt);

      // 상호작용성 추가 (클릭하여 퀵슬롯 활성화)
      const hitArea = this.scene.add.rectangle(0, 0, slotW, slotH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        GameState.updatePlayer({ activeQuickslotIndex: i });
        this.updateQuickslotsVisual();
        // FieldScene 에 이벤트 전파
        this.scene.events.emit('quickslot-changed', i);
      });
      slotContainer.add(hitArea);

      this.quickslots.push(slotContainer);
      this.add(slotContainer);
    }

    // ─── 4. 커뮤니티 (좌하단) ───
    const commW = 280;
    const commH = 120;
    const commY = GAME_HEIGHT - commH - 24;

    this.communityPanel = this.scene.add.container(16, commY);

    const commBg = this.scene.add.graphics();
    commBg.fillStyle(0x0a1628, 0.85);
    commBg.fillRoundedRect(0, 0, commW, commH, 4);
    commBg.lineStyle(1.5, 0x1f3d5a, 0.8);
    commBg.strokeRoundedRect(0, 0, commW, commH, 4);
    this.communityPanel.add(commBg);

    // 채팅 로그 모의 (플레이스홀더)
    const chatTitle = this.scene.add.text(10, 8, '💬 지역 채널 (커뮤니티)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    const chatLog = this.scene.add.text(10, 26, 
      "[시스템] 채널에 접속했습니다.\n" +
      "안개낀바다: 거제도 감성돔 입질 좋네요!\n" +
      "강릉조사: 오늘 파도가 좀 센 편입니다.\n" +
      "초보조사: 통발 미끼 뭐가 좋나요?", {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#ccddee',
      lineSpacing: 4,
    });
    this.communityPanel.add([chatTitle, chatLog]);

    // 채팅 입력 모의 박스
    const inputMockBg = this.scene.add.rectangle(10, commH - 22, commW - 20, 16, 0x050f1e)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1f3d5a);
    const inputMockText = this.scene.add.text(14, commH - 20, '⌨ [ENTER] 키를 눌러 대화 (추후 개시 예정)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '8px',
      color: '#607b8e',
    });
    this.communityPanel.add([inputMockBg, inputMockText]);

    this.add(this.communityPanel);

    // 초기 활성화 퀵슬롯 하이라이트
    this.updateQuickslotsVisual();
  }

  /**
   * 퀵슬롯 테두리 그리기 및 하이라이트 업데이트
   */
  public updateQuickslotsVisual(): void {
    const activeIdx = GameState.player.activeQuickslotIndex;
    const slotW = 44;
    const slotH = 44;

    this.quickslots.forEach((slot, idx) => {
      const box = slot.getByName('box') as Phaser.GameObjects.Graphics;
      if (!box) return;

      box.clear();
      if (idx === activeIdx) {
        // 활성화된 슬롯: 청록빛 하이라이트 및 채우기
        box.fillStyle(0x1a7a7a, 0.4);
        box.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
        box.lineStyle(2, 0x4af2a1, 1.0);
        box.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
      } else {
        // 비활성화된 슬롯: 은은한 테두리
        box.fillStyle(0x0a1628, 0.6);
        box.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
        box.lineStyle(1.2, 0x2a5a8a, 0.6);
        box.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
      }
    });
  }

  private updateHUD(): void {
    const tide = calculateTideInfo();
    this.tideText.setText(
      `🌊 ${tide.tidePhaseLabel} | 조위 ${tide.currentWaterLevelCm}cm | 다음 조류변화: ${tide.nextTideType === 'high' ? '만조' : '간조'} (${tide.minutesToNextTide}분 전)`,
    );

    const player = GameState.player;
    this.coinsText.setText(`앵글러 코인: ${player.inventory.coins.toLocaleString()} KRW`);

    // 게이지바 업데이트
    const stamina = player.stamina;
    const fatigue = player.fatigue;

    // 1. Stamina 게이지바 그리기 (Green)
    this.staminaBar.clear();
    // 라벨
    this.staminaBar.fillStyle(0xa0b8c8, 1);
    // 게이지 뒷배경
    this.staminaBar.fillStyle(0x1a1a1a, 0.8);
    this.staminaBar.fillRect(80, 30, 140, 10);
    // 체력 비례 게이지
    this.staminaBar.fillStyle(0x00ff66, 0.9);
    this.staminaBar.fillRect(80, 30, 140 * (stamina / 100), 10);
    // 테두리
    this.staminaBar.lineStyle(1, 0x4af2a1, 0.8);
    this.staminaBar.strokeRect(80, 30, 140, 10);

    // 2. Fatigue 게이지바 그리기 (Orange/Red)
    this.fatigueBar.clear();
    // 게이지 뒷배경
    this.fatigueBar.fillStyle(0x1a1a1a, 0.8);
    this.fatigueBar.fillRect(80, 48, 140, 10);
    // 피로도 비례 게이지
    this.fatigueBar.fillStyle(0xff6600, 0.9);
    this.fatigueBar.fillRect(80, 48, 140 * (fatigue / 100), 10);
    // 테두리
    this.fatigueBar.lineStyle(1, 0xffa066, 0.8);
    this.fatigueBar.strokeRect(80, 48, 140, 10);

    // 텍스트 추가
    if (!this.staminaBar.name) {
      this.staminaBar.name = 'initialized';
      this.scene.add.text(28, 28, 'HP (Stamina)', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px',
        color: '#a0b8c8',
      }).setDepth(this.depth + 1);
      
      this.scene.add.text(28, 46, '피로 (Fatigue)', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px',
        color: '#a0b8c8',
      }).setDepth(this.depth + 1);
    }
  }
}

