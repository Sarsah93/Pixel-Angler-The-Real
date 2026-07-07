/**
 * @file MiniMap.ts
 * @description 미니맵 UI 컴포넌트
 */

import Phaser from 'phaser';

export class MiniMap extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private playerMarker?: Phaser.GameObjects.Arc;
  private mapWidth: number;
  private mapHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y);

    this.mapWidth = w;
    this.mapHeight = h;

    this.createUI();
  }

  private createUI(): void {
    // 테두리 및 배경
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x0a1628, 0.85);
    this.bg.fillRoundedRect(0, 0, this.mapWidth, this.mapHeight, 4);
    this.bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    this.bg.strokeRoundedRect(0, 0, this.mapWidth, this.mapHeight, 4);
    this.add(this.bg);

    // 내부 지형 형상화 (방파제 모양)
    const landscape = this.scene.add.graphics();
    landscape.fillStyle(0x1f3d5a, 0.6);
    // 미니맵 좌표 내부 방파제 영역 채우기
    landscape.fillRect(15, 30, this.mapWidth - 30, this.mapHeight - 45);
    this.add(landscape);

    // 라벨
    this.scene.add.text(this.mapWidth / 2, 8, '실시간 위치', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // 플레이어 마커
    this.playerMarker = this.scene.add.circle(0, 0, 4, 0xff3333);
    this.add(this.playerMarker);
  }

  /**
   * 플레이어의 필드 절대 좌표를 미니맵 로컬 좌표로 변환하여 마커 업데이트
   */
  updatePlayerMarker(fieldX: number, fieldY: number): void {
    if (!this.playerMarker) return;

    // 실제 화면 너비(1280x720) 대비 미니맵 스케일 변환
    const mapScaleX = this.mapWidth / 1280;
    const mapScaleY = this.mapHeight / 720;

    const mx = fieldX * mapScaleX;
    const my = fieldY * mapScaleY;

    this.playerMarker.setPosition(mx, my);
  }
}
