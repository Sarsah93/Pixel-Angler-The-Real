/**
 * @file MiniMap.ts
 * @description 미니맵 UI 컴포넌트
 */

import Phaser from 'phaser';

export class MiniMap extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private landscape!: Phaser.GameObjects.Graphics;
  private playerMarker!: Phaser.GameObjects.Arc;
  private labelText!: Phaser.GameObjects.Text;
  private mapWidth: number;
  private mapHeight: number;
  
  // 3단계 크기 조절 (1: 소(150), 2: 중(250), 3: 대(350))
  private sizeMode: 1 | 2 | 3 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y);
    this.mapWidth = w;
    this.mapHeight = h;

    this.createUI();
    this.setScrollFactor(0); // 화면 고정
  }

  private createUI(): void {
    // 이전 그래픽 객체가 있으면 제거
    if (this.bg) this.bg.destroy();
    if (this.landscape) this.landscape.destroy();
    if (this.playerMarker) this.playerMarker.destroy();
    if (this.labelText) this.labelText.destroy();

    // 테두리 및 배경
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x0a1628, 0.85);
    this.bg.fillRoundedRect(0, 0, this.mapWidth, this.mapHeight, 4);
    this.bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    this.bg.strokeRoundedRect(0, 0, this.mapWidth, this.mapHeight, 4);
    this.add(this.bg);

    // 내부 지형 형상화 (2048 x 1536 월드를 미니맵 내에 간략히 표현)
    this.landscape = this.scene.add.graphics();
    this.landscape.fillStyle(0x1f3d5a, 0.6);
    
    // 방파제 띠와 해안선을 대략적으로 그리기
    const wallY = (330 / 1536) * this.mapHeight;
    const wallH = (80 / 1536) * this.mapHeight;
    this.landscape.fillRect(2, wallY, this.mapWidth - 4, wallH); // 방파제
    
    const seaY = (300 / 1536) * this.mapHeight;
    this.landscape.fillStyle(0x0d2940, 0.4);
    this.landscape.fillRect(2, 2, this.mapWidth - 4, seaY); // 심해/통발수역쪽
    
    this.add(this.landscape);

    // 라벨
    this.labelText = this.scene.add.text(this.mapWidth / 2, 8, `지도 (Level ${this.sizeMode})`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add(this.labelText);

    // 플레이어 마커
    this.playerMarker = this.scene.add.circle(0, 0, 4, 0xff3333);
    this.add(this.playerMarker);
  }

  /**
   * 3단계 크기 변환
   */
  public toggleSizeMode(): void {
    if (this.sizeMode === 1) {
      this.sizeMode = 2;
      this.mapWidth = 250;
      this.mapHeight = 250;
    } else if (this.sizeMode === 2) {
      this.sizeMode = 3;
      this.mapWidth = 350;
      this.mapHeight = 350;
    } else {
      this.sizeMode = 1;
      this.mapWidth = 150;
      this.mapHeight = 150;
    }

    // 우측 상단 모서리에 정렬 유지
    const targetX = this.scene.scale.width - this.mapWidth - 16;
    this.setPosition(targetX, 16);

    this.createUI();
  }

  /**
   * 플레이어의 필드 절대 좌표를 미니맵 로컬 좌표로 변환하여 마커 업데이트
   * 월드 크기: 2048 x 1536 기준
   */
  updatePlayerMarker(fieldX: number, fieldY: number): void {
    if (!this.playerMarker) return;

    const mapScaleX = this.mapWidth / 2048;
    const mapScaleY = this.mapHeight / 1536;

    const mx = fieldX * mapScaleX;
    const my = fieldY * mapScaleY;

    // 패널 내부 경계를 넘어가지 않도록 보정
    const clampedX = Math.max(4, Math.min(this.mapWidth - 4, mx));
    const clampedY = Math.max(4, Math.min(this.mapHeight - 4, my));

    this.playerMarker.setPosition(clampedX, clampedY);
  }
}
