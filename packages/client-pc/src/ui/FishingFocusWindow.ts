/**
 * @file FishingFocusWindow.ts
 * @description 낚시 진행 시 수면과 찌를 집중 확대해서 보여주는 원형/사각형 뷰포트
 */

import Phaser from 'phaser';

export class FishingFocusWindow extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private bobber?: Phaser.GameObjects.Graphics;
  private waterWaves?: Phaser.GameObjects.Graphics;
  private size: number;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    super(scene, x, y);
    this.size = size;

    this.createWindow();
  }

  private createWindow(): void {
    // 반투명 창 테두리 및 마스크
    this.bg = this.scene.add.graphics();
    
    // 심해 물빛 원형 영역
    this.bg.fillStyle(0x0a2f4c, 0.9);
    this.bg.fillCircle(0, 0, this.size / 2);
    this.bg.lineStyle(4, 0x2a5a8a, 0.85);
    this.bg.strokeCircle(0, 0, this.size / 2);
    this.add(this.bg);

    // 물결 패턴선 그리기
    this.waterWaves = this.scene.add.graphics();
    this.waterWaves.lineStyle(1.5, 0x134870, 0.6);
    this.drawWaves();
    this.add(this.waterWaves);

    // 찌 물체 형상화 (구멍찌/수중찌 이미지 대용)
    this.bobber = this.scene.add.graphics();
    this.drawBobber(0, 0);
    this.add(this.bobber);
  }

  private drawWaves(): void {
    if (!this.waterWaves) return;
    this.waterWaves.clear();
    this.waterWaves.lineStyle(1.5, 0x134870, 0.6);
    
    // 원형 내부에 대각 물결 그리기
    for (let i = -3; i <= 3; i++) {
      const y = i * 20;
      this.waterWaves.beginPath();
      this.waterWaves.moveTo(-this.size / 2.5, y);
      this.waterWaves.lineTo(this.size / 2.5, y + 4);
      this.waterWaves.strokePath();
    }
  }

  private drawBobber(ox: number, oy: number): void {
    if (!this.bobber) return;
    this.bobber.clear();

    // 찌 상단 (붉은색/오렌지색 시인성)
    this.bobber.fillStyle(0xff4422);
    this.bobber.fillRect(ox - 6, oy - 14, 12, 10);
    
    // 찌 주황 형광 케미라인
    this.bobber.fillStyle(0xffcc00);
    this.bobber.fillRect(ox - 2, oy - 22, 4, 8);

    // 찌 하단 (노란색/하얀색 물밑 밸런서)
    this.bobber.fillStyle(0xffffff);
    this.bobber.fillRect(ox - 6, oy - 4, 12, 8);
    
    // 원줄 관통 구멍 링
    this.bobber.lineStyle(1, 0x333333);
    this.bobber.strokeRect(ox - 7, oy - 4, 14, 1);
  }

  /**
   * 찌의 상태 애니메이션 업데이트
   */
  setBobberState(state: 'hidden' | 'floating' | 'shaking' | 'sinking' | 'fighting'): void {
    if (!this.bobber) return;

    // 기존 애니메이션 트윈 정리
    this.scene.tweens.killTweensOf(this.bobber);
    this.bobber.setPosition(0, 0);

    if (state === 'hidden') {
      this.bobber.setVisible(false);
    } else if (state === 'floating') {
      this.bobber.setVisible(true);
      // 잔잔한 위아래 떠다님
      this.scene.tweens.add({
        targets: this.bobber,
        y: 4,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (state === 'shaking') {
      this.bobber.setVisible(true);
      // 입질 경고 흔들림 (짧고 빠른 셰이킹)
      this.scene.tweens.add({
        targets: this.bobber,
        x: { from: -3, to: 3 },
        y: { from: -1, to: 2 },
        duration: 100,
        yoyo: true,
        repeat: -1,
      });
    } else if (state === 'sinking') {
      this.bobber.setVisible(true);
      // 어신 히트! 수면 아래로 스르륵 잠김
      this.scene.tweens.add({
        targets: this.bobber,
        y: 35,
        alpha: 0.4,
        duration: 400,
        ease: 'Quad.easeIn',
      });
    } else if (state === 'fighting') {
      this.bobber.setVisible(true);
      // 격렬한 밀당 좌우 흔들림
      this.scene.tweens.add({
        targets: this.bobber,
        x: { from: -15, to: 15 },
        y: { from: -5, to: 8 },
        duration: 150,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
