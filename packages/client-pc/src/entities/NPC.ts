/**
 * @file NPC.ts
 * @description 필드 맵에서 대화 가능한 선장, 편의점 알바, 횟집 사장님 등의 NPC 엔티티
 */

import Phaser from 'phaser';

export class NPC extends Phaser.GameObjects.Container {
  private avatarBg?: Phaser.GameObjects.Rectangle;
  private nameLabel?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, role: string) {
    super(scene, x, y);

    this.createNPC(name, role);
    scene.add.existing(this);
  }

  private createNPC(name: string, role: string): void {
    // 노란 조끼를 입은 아저씨 그래픽
    this.avatarBg = this.scene.add.rectangle(0, 0, 24, 36, 0xd4a017);
    this.add(this.avatarBg);

    const head = this.scene.add.circle(0, -22, 10, 0xffd1a4);
    this.add(head);

    // 이름표
    this.nameLabel = this.scene.add.text(0, -48, `${name}\n(${role})`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#e8f4fd',
      align: 'center',
      backgroundColor: '#0a1628aa',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5);
    this.add(this.nameLabel);
  }
}
