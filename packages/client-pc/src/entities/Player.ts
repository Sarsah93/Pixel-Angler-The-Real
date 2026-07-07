/**
 * @file Player.ts
 * @description 필드에서 돌아다니는 플레이어 캐릭터 도트 엔티티 클래스
 */

import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Container {
  private sprite?: Phaser.GameObjects.Rectangle;
  private nicknameText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, nickname: string) {
    super(scene, x, y);

    this.createAvatar(nickname);
    scene.add.existing(this);
  }

  private createAvatar(nickname: string): void {
    // 텍스처 로딩 대신 임시 2D 그래픽 아바타 생성 (빨간 모자 쓴 파란 몸 낚시꾼)
    this.sprite = this.scene.add.rectangle(0, 0, 24, 36, 0x2d4a6e); // 몸통
    this.add(this.sprite);

    // 머리
    const head = this.scene.add.circle(0, -22, 10, 0xffd1a4);
    this.add(head);

    // 빨간 모자
    const hat = this.scene.add.rectangle(0, -32, 22, 6, 0xcc3333);
    this.add(hat);

    // 닉네임 텍스트
    this.nicknameText = this.scene.add.text(0, -50, nickname, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#0a1628aa',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    this.add(this.nicknameText);
  }

  /**
   * 이동 애니메이션 모션 시뮬레이션
   */
  playWalkAnimation(isMoving: boolean): void {
    if (!this.sprite) return;
    this.scene.tweens.killTweensOf(this.sprite);

    if (isMoving) {
      // 걷는 걸음 모션 바운싱
      this.scene.tweens.add({
        targets: this.sprite,
        y: 2,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.sprite.setPosition(0, 0);
    }
  }
}
