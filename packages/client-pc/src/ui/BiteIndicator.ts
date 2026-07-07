/**
 * @file BiteIndicator.ts
 * @description 낚시 도중 어신(입질) 타이밍을 알려주는 비주얼 이펙트 위젯
 */

import Phaser from 'phaser';

export class BiteIndicator extends Phaser.GameObjects.Container {
  private effectText?: Phaser.GameObjects.Text;
  private pulseCircle?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createUI();
  }

  private createUI(): void {
    // 펄스 링 (어신 충격 효과용)
    this.pulseCircle = this.scene.add.circle(0, 0, 10, 0xffff33, 0);
    this.pulseCircle.setStrokeStyle(2, 0xffff33);
    this.pulseCircle.setVisible(false);
    this.add(this.pulseCircle);

    // 경고 텍스트
    this.effectText = this.scene.add.text(0, -60, '!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ff3333',
    }).setOrigin(0.5);
    this.effectText.setVisible(false);
    this.add(this.effectText);
  }

  /**
   * 어신 종류별 이펙트 발동
   */
  triggerBiteEffect(type: 'bobber_shake' | 'bobber_pull' | 'bobber_rise'): void {
    if (!this.effectText || !this.pulseCircle) return;

    // 초기 상태 리셋
    this.scene.tweens.killTweensOf(this.effectText);
    this.scene.tweens.killTweensOf(this.pulseCircle);

    this.effectText.setPosition(0, -60).setVisible(true);
    this.pulseCircle.setPosition(0, 0).setScale(1).setAlpha(1).setVisible(true);

    if (type === 'bobber_shake') {
      this.effectText.setText('입질!').setColor('#ffff33').setFontSize(14);
      // 살짝 흔들림
      this.scene.tweens.add({
        targets: this.effectText,
        y: -65,
        duration: 100,
        yoyo: true,
        repeat: 3,
      });

      // 잔잔한 원형 펄스
      this.scene.tweens.add({
        targets: this.pulseCircle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 600,
      });
    } else if (type === 'bobber_pull') {
      // 강력한 침수 어신
      this.effectText.setText('HIT!!').setColor('#ff3333').setFontSize(22);
      
      // 통통 뛰는 바운싱 애니메이션
      this.scene.tweens.add({
        targets: this.effectText,
        scaleX: { from: 1.5, to: 1.0 },
        scaleY: { from: 1.5, to: 1.0 },
        duration: 300,
        ease: 'Bounce.easeOut',
      });

      // 강력한 펄스 링
      this.scene.tweens.add({
        targets: this.pulseCircle,
        scaleX: 8,
        scaleY: 8,
        alpha: 0,
        duration: 400,
      });
    } else if (type === 'bobber_rise') {
      this.effectText.setText('떠오름!').setColor('#33ff33').setFontSize(14);
      this.scene.tweens.add({
        targets: this.effectText,
        y: -80,
        duration: 400,
      });
    }
  }

  /**
   * 이펙트 청소
   */
  clear(): void {
    this.effectText?.setVisible(false);
    this.pulseCircle?.setVisible(false);
  }
}
