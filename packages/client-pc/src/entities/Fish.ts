/**
 * @file Fish.ts
 * @description 물속에서 헤엄치는 물고기 도트 시각 연출용 엔티티
 */

import Phaser from 'phaser';

export class Fish extends Phaser.GameObjects.Container {
  private bodyShape?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createFishBody();
    scene.add.existing(this);
    this.startSwimming();
  }

  private createFishBody(): void {
    this.bodyShape = this.scene.add.graphics();
    this.bodyShape.fillStyle(0x0a1628, 0.4); // 물 속 흐릿한 그림자 형태
    this.bodyShape.fillEllipse(0, 0, 16, 8);
    this.bodyShape.fillTriangle(6, 0, 12, -4, 12, 4); // 꼬리지느러미
    this.add(this.bodyShape);
  }

  private startSwimming(): void {
    if (!this.bodyShape) return;
    
    // 물고기가 자연스럽게 좌우로 헤엄치는 무작위 무브먼트
    this.scene.tweens.add({
      targets: this.bodyShape,
      x: { from: -20, to: 20 },
      y: { from: -5, to: 5 },
      duration: Phaser.Math.Between(2000, 4000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
