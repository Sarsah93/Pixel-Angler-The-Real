/**
 * @file KeyboardInput.ts
 * @description 키보드 입력 매핑 및 핸들링 유틸리티
 */

import Phaser from 'phaser';

export class KeyboardInput {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.cursors.left?.isDown || this.wasd.A?.isDown) x = -1;
    else if (this.cursors.right?.isDown || this.wasd.D?.isDown) x = 1;

    if (this.cursors.up?.isDown || this.wasd.W?.isDown) y = -1;
    else if (this.cursors.down?.isDown || this.wasd.S?.isDown) y = 1;

    // 대각선 이동 속도 보정 (정규화)
    if (x !== 0 && y !== 0) {
      x *= 0.7071;
      y *= 0.7071;
    }

    return { x, y };
  }
}
