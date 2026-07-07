/**
 * @file FloatBobber.ts
 * @description 낚시 시 필드 뷰에서 물에 수면 위에 낙하 후 떠다니는 찌 시각적 엔티티
 */

import Phaser from 'phaser';

export class FloatBobber extends Phaser.GameObjects.Container {
  private indicator?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createBobber();
    scene.add.existing(this);
  }

  private createBobber(): void {
    // 수면 위 안착된 원형 점찌
    this.indicator = this.scene.add.circle(0, 0, 4, 0xff3333);
    this.add(this.indicator);

    // 수면 동심원 물결
    const ripple = this.scene.add.circle(0, 0, 10, 0x5a8fab, 0);
    ripple.setStrokeStyle(1.0, 0x5a8fab, 0.6);
    this.add(ripple);

    this.scene.tweens.add({
      targets: ripple,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 2000,
      repeat: -1,
    });
  }
}
