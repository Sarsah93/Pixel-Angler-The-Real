/**
 * @file TextQuality.ts
 * @description Phaser Text 렌더 품질 보정 (143차 — HUD·팝업 글자 뭉개짐 완화)
 *
 * 배경: 게임은 `pixelArt: true`(= `antialias: false`)라 **모든 텍스처가 NEAREST**로 샘플링된다.
 * 도트 스프라이트에는 맞지만, 브라우저 폰트 래스터라이저가 그린 글자 비트맵까지 NEAREST로
 * 샘플링되면 정수 위치를 조금만 벗어나도 획이 끊기고 가장자리가 계단으로 남는다.
 *
 * 그래서 두 가지만 손댄다.
 *  1) **텍스트 텍스처만 LINEAR** — 스프라이트·타일은 그대로 NEAREST(도트 규칙 불변).
 *  2) **내부 래스터 배율(resolution) 2배** — 캔버스를 2배로 그려 GPU가 1배로 내려 받는다
 *     (수퍼샘플링). 표시 크기·레이아웃 좌표는 `Text.width/height`가 그대로라 **불변**이다.
 *
 * ⚠ 한계: 게임 프레임버퍼는 1280x720 고정이고, 창이 그보다 크면 **캔버스 전체가 CSS로 확대**된다
 * (`index.html`의 `image-rendering: auto`). 그 확대는 여기서 못 줄인다 — 글자 품질의 상한은
 * 프레임버퍼 해상도다. 더 올리려면 내부 해상도 자체를 키우는 별도 작업이 필요하다.
 */

import Phaser from 'phaser';

/** 내부 래스터 배율 — 2 초과는 메모리만 먹고 프레임버퍼에서 버려진다 */
const TEXT_RESOLUTION = 2;

let installed = false;

/** 게임 생성 전에 1회 호출 (game.ts) */
export function installTextQuality(): void {
  if (installed) return;
  installed = true;

  const proto = Phaser.GameObjects.Text.prototype as unknown as {
    updateText: () => unknown;
    style: { resolution: number };
    frame?: { source?: { resolution: number } };
    texture?: { setFilter?: (m: number) => unknown };
  };
  const original = proto.updateText;

  proto.updateText = function patched(this: typeof proto) {
    // 생성자가 0 → 1로 강제한 뒤이므로, 호출측이 명시 지정한 값(≥2)은 건드리지 않는다.
    if (this.style.resolution <= 1) {
      this.style.resolution = TEXT_RESOLUTION;
      if (this.frame?.source) this.frame.source.resolution = TEXT_RESOLUTION;
    }
    const ret = original.call(this);
    this.texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    return ret;
  };
}
