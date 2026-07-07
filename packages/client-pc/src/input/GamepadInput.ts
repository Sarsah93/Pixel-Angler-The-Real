/**
 * @file GamepadInput.ts
 * @description 스팀덱 및 게임패드 컨트롤 조작 핸들러
 */

import Phaser from 'phaser';

export class GamepadInput {
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  constructor(scene: Phaser.Scene) {
    scene.input.gamepad?.once('down', (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
      console.log('[GamepadInput] Gamepad connected:', pad.id);
    });
  }

  getMovementVector(): { x: number; y: number } {
    if (!this.gamepad) return { x: 0, y: 0 };

    // 좌측 아날로그 스틱
    const x = this.gamepad.leftStick.x;
    const y = this.gamepad.leftStick.y;

    // 데드존(Deadzone) 처리
    const threshold = 0.15;
    return {
      x: Math.abs(x) > threshold ? x : 0,
      y: Math.abs(y) > threshold ? y : 0,
    };
  }

  isButtonPressed(button: 'A' | 'B' | 'X' | 'Y'): boolean {
    if (!this.gamepad) return false;

    if (button === 'A') return this.gamepad.A;
    if (button === 'B') return this.gamepad.B;
    if (button === 'X') return this.gamepad.X;
    if (button === 'Y') return this.gamepad.Y;

    return false;
  }
}
