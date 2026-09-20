import Phaser from 'phaser';

export interface PortraitMaskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface PortraitMaskHandle {
  sync(): void;
  destroy(): void;
}

/** 대화창 공통 초상 마스크. */
export function applyPortraitMask(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  target: Phaser.GameObjects.Image,
  bounds: PortraitMaskBounds,
): PortraitMaskHandle {
  // GeometryMask의 Graphics는 대상 Container 밖의 화면 고정 좌표에 둔다.
  // Container 안에 넣으면 WebGL이 부모 변환을 마스크·대상에 서로 다르게
  // 적용해, 마스크가 이미지 전체를 잘라내는 경우가 있다.
  // scene.make(..., false)는 디스플레이 리스트에 넣지 않지만 GeometryMask가
  // 스텐실을 만들 때 직접 렌더링할 수 있는 Graphics를 만든다.
  const shape = scene.make.graphics({}, false).setScrollFactor(0);
  const sync = (): void => {
    const matrix = parent.getWorldTransformMatrix();
    shape.clear();
    shape.fillStyle(0xffffff, 1);
    shape.fillRoundedRect(
      matrix.tx + bounds.x,
      matrix.ty + bounds.y,
      bounds.width,
      bounds.height,
      bounds.radius ?? 6,
    );
  };

  sync();
  const mask = shape.createGeometryMask();
  target.setMask(mask);

  return {
    sync,
    destroy: () => {
      target.clearMask(false);
      mask.destroy();
      shape.destroy();
    },
  };
}
