/**
 * @file InfoOverlayPanel.ts
 * @description 인벤토리 및 퀘스트 정보를 표시하는 픽셀 스타일 오버레이 컴포넌트
 */

import Phaser from 'phaser';

export class InfoOverlayPanel extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private closeCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    type: 'inventory' | 'quest',
    contentLines: string[],
    onClose?: () => void
  ) {
    super(scene, x, y);
    this.closeCallback = onClose;

    this.createPanel(title, type, contentLines);
  }

  private createPanel(title: string, type: 'inventory' | 'quest', contentLines: string[]): void {
    const width = 500;
    const height = 360;

    // 반투명 다크 블루 배경
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x050f1e, 0.95);
    this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    // 픽셀 스타일 테두리 (네온 그린 / 청록)
    const borderColor = type === 'inventory' ? 0x4af2a1 : 0xffdd44;
    this.bg.lineStyle(2, borderColor, 0.9);
    this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    this.add(this.bg);

    // 타이틀 텍스트
    const titleText = this.scene.add.text(0, -height / 2 + 25, title, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: type === 'inventory' ? '#4af2a1' : '#ffeeaa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    // 구분선
    const divider = this.scene.add.graphics();
    divider.lineStyle(1.5, 0x1f3d5a, 0.6);
    divider.lineBetween(-width / 2 + 30, -height / 2 + 50, width / 2 - 30, -height / 2 + 50);
    this.add(divider);

    // 본문 컨텐츠 배치
    const textContent = contentLines.join('\n');
    const contentText = this.scene.add.text(-width / 2 + 30, -height / 2 + 70, textContent, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ccddee',
      lineSpacing: 8,
      wordWrap: { width: width - 60 }
    });
    this.add(contentText);

    // 안내 문구 (하단)
    const infoText = this.scene.add.text(0, height / 2 - 20, '[ESC] 키 또는 [닫기] 버튼을 눌러 창 닫기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#607b8e',
    }).setOrigin(0.5);
    this.add(infoText);

    // 닫기 버튼
    const closeBtn = this.scene.add.container(0, height / 2 - 50).setInteractive(
      new Phaser.Geom.Rectangle(-50, -14, 100, 28),
      Phaser.Geom.Rectangle.Contains
    );
    const btnBg = this.scene.add.rectangle(0, 0, 100, 28, 0x1f3d5a, 0.9);
    btnBg.setStrokeStyle(1, borderColor, 0.8);
    const btnText = this.scene.add.text(0, 0, '닫 기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    closeBtn.add([btnBg, btnText]);
    this.add(closeBtn);

    closeBtn.on('pointerdown', () => {
      this.close();
    });

    closeBtn.on('pointerover', () => btnBg.setFillStyle(0x2a5a8a));
    closeBtn.on('pointerout', () => btnBg.setFillStyle(0x1f3d5a));
  }

  public close(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
    this.destroy();
  }
}
