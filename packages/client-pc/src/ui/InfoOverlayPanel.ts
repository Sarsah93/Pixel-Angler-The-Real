/**
 * @file InfoOverlayPanel.ts
 * @description 인벤토리 및 퀘스트 정보를 표시하는 픽셀 스타일 오버레이 컴포넌트
 */

import Phaser from 'phaser';

export class InfoOverlayPanel extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private closeCallback?: () => void;
  private wheelHandler?: (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    type: 'inventory' | 'quest' | 'stat',
    contentLines: string[],
    onClose?: () => void
  ) {
    super(scene, x, y);
    this.closeCallback = onClose;

    this.createPanel(title, type, contentLines);
  }

  private createPanel(title: string, type: 'inventory' | 'quest' | 'stat', contentLines: string[]): void {
    const width = 500;
    const height = 360;

    // 반투명 다크 블루 배경
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x050f1e, 0.95);
    this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    // 픽셀 스타일 테두리 (네온 그린 / 청록 / 보라)
    const borderColor = type === 'inventory' ? 0x4af2a1 : type === 'quest' ? 0xffdd44 : 0x9955ff;
    this.bg.lineStyle(2, borderColor, 0.9);
    this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    this.add(this.bg);

    // 타이틀 텍스트
    const titleText = this.scene.add.text(0, -height / 2 + 25, title, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: type === 'inventory' ? '#4af2a1' : type === 'quest' ? '#ffeeaa' : '#b388ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    // 구분선
    const divider = this.scene.add.graphics();
    divider.lineStyle(1.5, 0x1f3d5a, 0.6);
    divider.lineBetween(-width / 2 + 30, -height / 2 + 50, width / 2 - 30, -height / 2 + 50);
    this.add(divider);

    // 본문 컨텐츠 배치 (스크롤 지원을 위해 마스크 적용)
    const textContent = contentLines.join('\n');
    const contentText = this.scene.add.text(-width / 2 + 30, -height / 2 + 65, textContent, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ccddee',
      lineSpacing: 8,
      wordWrap: { width: width - 60 }
    });
    this.add(contentText);

    // 텍스트 스크롤 마스크 생성
    const maskShape = this.scene.make.graphics({ x: this.x, y: this.y }, false);
    maskShape.fillStyle(0xffffff, 1);
    const maskHeight = height - 135;
    maskShape.fillRect(-width / 2 + 25, -height / 2 + 60, width - 50, maskHeight);
    const mask = new Phaser.Display.Masks.GeometryMask(this.scene, maskShape);
    contentText.setMask(mask);

    // 안내 문구 (하단)
    const infoText = this.scene.add.text(0, height / 2 - 20, '[ESC] 키, [닫기] 버튼 또는 휠 스크롤을 이용해 확인', {
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

    // 우측 상단 X 닫기 버튼 추가
    const xBtn = this.scene.add.container(width / 2 - 22, -height / 2 + 22).setInteractive(
      new Phaser.Geom.Rectangle(-10, -10, 20, 20),
      Phaser.Geom.Rectangle.Contains
    );
    const xBg = this.scene.add.rectangle(0, 0, 20, 20, 0x1f3d5a, 0.9);
    xBg.setStrokeStyle(1, 0xff4444, 0.8);
    const xText = this.scene.add.text(0, 0, '✕', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    xBtn.add([xBg, xText]);
    this.add(xBtn);

    xBtn.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.close();
    });
    xBtn.on('pointerover', () => {
      xBg.setFillStyle(0xff4444);
      xText.setColor('#ffffff');
    });
    xBtn.on('pointerout', () => {
      xBg.setFillStyle(0x1f3d5a);
      xText.setColor('#ff6666');
    });

    // 드래그앤드롭 기능 추가
    this.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.scene.input.setDraggable(this);
    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.setPosition(dragX, dragY);
      maskShape.setPosition(dragX, dragY);
    });

    // 마우스 휠 스크롤 리스너 바인딩
    const minY = -height / 2 + 65;
    this.wheelHandler = (pointer: any, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
      const localPoint = new Phaser.Math.Vector2();
      this.getLocalPoint(pointer.x, pointer.y, localPoint);
      if (
        localPoint.x >= -width / 2 &&
        localPoint.x <= width / 2 &&
        localPoint.y >= -height / 2 &&
        localPoint.y <= height / 2
      ) {
        const contentHeight = contentText.height;
        if (contentHeight <= maskHeight) return; // 스크롤 불필요

        const maxScrollY = minY;
        const minScrollY = minY - (contentHeight - maskHeight);

        contentText.y -= deltaY * 0.2;
        if (contentText.y < minScrollY) contentText.y = minScrollY;
        if (contentText.y > maxScrollY) contentText.y = maxScrollY;
      }
    };
    this.scene.input.on('wheel', this.wheelHandler);

    this.on('destroy', () => {
      if (this.wheelHandler) {
        this.scene.input.off('wheel', this.wheelHandler);
      }
      maskShape.destroy();
    });
  }

  public close(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
    this.destroy();
  }
}
