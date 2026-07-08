/**
 * @file HydroCurrentRenderer.ts
 * @description 수중 조류(조류 방향/강도/타입)를 Phaser Graphics로 픽셀 시각화하는 렌더러
 *
 * 사용 방법:
 *  1. FieldScene.create()에서 new HydroCurrentRenderer(scene) 생성
 *  2. update() 루프에서 renderer.setTidePhase(phase, strength) 호출
 *  3. 플레이어가 수역에 있을 때 renderer.setVisible(true)
 *
 * 시각화 요소:
 *  - 조류 화살표: 격자당 1개, 방향과 길이로 속도 표현
 *  - 색상 코딩:
 *    - MAIN(본류): 밝은 청록 (#00d4ff)
 *    - COUNTER(반탄류): 주황 (#ff8c00)
 *    - EDDY(와류): 보라 (#9b59b6)
 *    - CONVERGENCE(조경지대): 노란 (#f1c40f)
 *  - 수심 색조: 깊을수록 진한 파랑 배경 타일
 *  - 낚시 포인트 마커: 녹색 원 + 이름 텍스트
 */

import Phaser from 'phaser';
import { generateHydroGrid } from '@tra/core';
import type { HydroGrid, TileWaterState } from '@tra/core';
import {
  YOIL_BAY_FISHING_POINTS,
  YOIL_BAY_LANDMARKS,
  type YoilBayFishingPoint,
} from '../data/YoilBayFieldMap.js';

/** 조류 타입별 색상 팔레트 */
const CURRENT_COLORS: Record<string, number> = {
  MAIN: 0x00d4ff,         // 청록 — 본류
  COUNTER: 0xff8c00,      // 주황 — 반탄류
  EDDY: 0x9b59b6,         // 보라 — 와류
  CONVERGENCE: 0xf1c40f,  // 노랑 — 조경지대
  NONE: 0x334455,         // 어두운 청회 — 조류 없음
};

/** 수심 색상 보간 (얕음→깊음: 청색 밝기 조절) */
function depthToColor(depthM: number): number {
  const t = Math.min(1, depthM / 30); // 0(얕음) ~ 1(32m 깊음)
  const r = Math.floor(0x04 + (0x02 - 0x04) * t);
  const g = Math.floor(0x18 + (0x0a - 0x18) * t);
  const b = Math.floor(0x3a + (0x6a - 0x3a) * t);
  return (r << 16) | (g << 8) | b;
}

export class HydroCurrentRenderer {
  private scene: Phaser.Scene;
  private depthLayer: Phaser.GameObjects.Graphics;
  private arrowLayer: Phaser.GameObjects.Graphics;
  private pointMarkers: Phaser.GameObjects.Container;

  /** 현재 렌더링된 격자 */
  private grid: HydroGrid | null = null;

  /** 표시 모드 */
  private _visible: boolean = false;

  /** 조류 화살표 표시 간격 (타일 수) — 너무 촘촘하면 보기 불편 */
  private arrowStepTiles: number = 4; // 4타일(64px)마다 화살표 1개

  /** 낚시 포인트 마커 텍스트 목록 */
  private markerTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 수심 색상 레이어 (맵 배경 위, 플레이어 아래)
    this.depthLayer = scene.add.graphics();
    this.depthLayer.setDepth(1);

    // 조류 화살표 레이어
    this.arrowLayer = scene.add.graphics();
    this.arrowLayer.setDepth(2);

    // 포인트 마커 컨테이너
    this.pointMarkers = scene.add.container(0, 0);
    this.pointMarkers.setDepth(3);

    this.depthLayer.setVisible(false);
    this.arrowLayer.setVisible(false);
    this.pointMarkers.setVisible(false);

    this.buildFishingPointMarkers();
  }

  /**
   * 물때 단계와 세기를 바탕으로 격자 재계산 후 렌더링을 갱신합니다.
   * FieldScene의 update() 루프에서 호출하되, 매 프레임보다 낮은 빈도(예: 5초마다)로 호출 권장.
   */
  public refreshGrid(spotId: string, tidePhase: number, currentStrength: number): void {
    this.grid = generateHydroGrid(spotId, tidePhase, currentStrength);
    this.renderDepthLayer();
    this.renderArrowLayer();
  }

  /**
   * 조류 오버레이 표시 여부를 설정합니다.
   */
  public setVisible(visible: boolean): void {
    this._visible = visible;
    this.depthLayer.setVisible(visible);
    this.arrowLayer.setVisible(visible);
    this.pointMarkers.setVisible(visible);
  }

  public isVisible(): boolean {
    return this._visible;
  }

  /**
   * 낚시 포인트 마커만 토글합니다 (조류 레이어와 독립적).
   */
  public setPointMarkersVisible(visible: boolean): void {
    this.pointMarkers.setVisible(visible);
  }

  /**
   * 렌더러를 파괴합니다.
   */
  public destroy(): void {
    this.depthLayer.destroy();
    this.arrowLayer.destroy();
    this.pointMarkers.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: 수심 배경 레이어 렌더링
  // ─────────────────────────────────────────────────────────────────────────────

  private renderDepthLayer(): void {
    if (!this.grid) return;
    this.depthLayer.clear();

    const tileW = 16;
    const tileH = 16;

    for (let gy = 0; gy < this.grid.height; gy++) {
      for (let gx = 0; gx < this.grid.width; gx++) {
        const cell = this.grid.cells[gy]?.[gx];
        if (!cell || cell.depth <= 0) continue; // 육지는 건너뜀

        const px = gx * tileW;
        const py = gy * tileH;
        const color = depthToColor(cell.depth);

        this.depthLayer.fillStyle(color, 0.45);
        this.depthLayer.fillRect(px, py, tileW, tileH);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: 조류 화살표 레이어 렌더링
  // ─────────────────────────────────────────────────────────────────────────────

  private renderArrowLayer(): void {
    if (!this.grid) return;
    this.arrowLayer.clear();

    const tileW = 16;
    const step = this.arrowStepTiles;

    for (let gy = 0; gy < this.grid.height; gy += step) {
      for (let gx = 0; gx < this.grid.width; gx += step) {
        const cell = this.grid.cells[gy]?.[gx];
        if (!cell || cell.depth <= 0) continue;

        const cx = gx * tileW + (step * tileW) / 2;
        const cy = gy * tileW + (step * tileW) / 2;

        this.drawCurrentArrow(cx, cy, cell);
      }
    }

    // 조경지대 강조 박스 (CONVERGENCE)
    this.highlightConvergenceZones();
  }

  /**
   * 단일 조류 화살표를 그립니다.
   */
  private drawCurrentArrow(cx: number, cy: number, cell: TileWaterState): void {
    const { x: vx, y: vy } = cell.currentVector;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed < 0.02) {
      // 매우 약한 조류 — 작은 점만 표시
      const color = CURRENT_COLORS[cell.waterType] ?? CURRENT_COLORS['NONE'];
      this.arrowLayer.fillStyle(color, 0.3);
      this.arrowLayer.fillCircle(cx, cy, 2);
      return;
    }

    const color = CURRENT_COLORS[cell.waterType] ?? CURRENT_COLORS['NONE'];
    const alpha = Math.min(0.9, 0.4 + speed * 0.3);

    // 화살표 길이: 속도 비례 (최소 8px, 최대 28px)
    const arrowLen = Math.max(8, Math.min(28, speed * 18));
    const angle = Math.atan2(vy, vx);

    const headX = cx + Math.cos(angle) * arrowLen;
    const headY = cy + Math.sin(angle) * arrowLen;
    const tailX = cx - Math.cos(angle) * (arrowLen * 0.5);
    const tailY = cy - Math.sin(angle) * (arrowLen * 0.5);

    // 화살표 몸통 (라인)
    this.arrowLayer.lineStyle(1.5, color, alpha);
    this.arrowLayer.beginPath();
    this.arrowLayer.moveTo(tailX, tailY);
    this.arrowLayer.lineTo(headX, headY);
    this.arrowLayer.strokePath();

    // 화살표 머리 (삼각형)
    const headSize = 5;
    const leftAngle = angle + (Math.PI * 5) / 6;
    const rightAngle = angle - (Math.PI * 5) / 6;

    this.arrowLayer.fillStyle(color, alpha);
    this.arrowLayer.beginPath();
    this.arrowLayer.moveTo(headX, headY);
    this.arrowLayer.lineTo(
      headX + Math.cos(leftAngle) * headSize,
      headY + Math.sin(leftAngle) * headSize
    );
    this.arrowLayer.lineTo(
      headX + Math.cos(rightAngle) * headSize,
      headY + Math.sin(rightAngle) * headSize
    );
    this.arrowLayer.closePath();
    this.arrowLayer.fillPath();
  }

  /**
   * 조경지대(CONVERGENCE) 영역을 황금색 점선 테두리로 강조합니다.
   */
  private highlightConvergenceZones(): void {
    if (!this.grid) return;
    const tileW = 16;
    const color = CURRENT_COLORS['CONVERGENCE'];

    let runStart = -1;
    let runY = -1;

    // 행 스캔: 연속된 CONVERGENCE 타일을 묶어 하나의 사각형으로 표시
    for (let gy = 0; gy < this.grid.height; gy++) {
      for (let gx = 0; gx <= this.grid.width; gx++) {
        const cell = gx < this.grid.width ? this.grid.cells[gy]?.[gx] : null;
        const isConv = cell?.waterType === 'CONVERGENCE';

        if (isConv && runStart < 0) {
          runStart = gx;
          runY = gy;
        } else if (!isConv && runStart >= 0) {
          // 구간 종료 — 사각형 테두리 그리기
          const rx = runStart * tileW;
          const ry = runY * tileW;
          const rw = (gx - runStart) * tileW;
          const rh = tileW;
          this.arrowLayer.lineStyle(1, color, 0.5);
          this.arrowLayer.strokeRect(rx, ry, rw, rh);
          runStart = -1;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: 낚시 포인트 마커 생성
  // ─────────────────────────────────────────────────────────────────────────────

  private buildFishingPointMarkers(): void {
    YOIL_BAY_FISHING_POINTS.forEach((pt: YoilBayFishingPoint) => {
      // 외항/수역 포인트에만 마커 표시
      const isWaterPoint = pt.cy < YOIL_BAY_LANDMARKS.TOWN_Y;
      if (!isWaterPoint) return;

      // 조류 타입별 마커 색상
      const markerColor = CURRENT_COLORS[pt.currentType] ?? 0x00ff88;

      // 원형 마커
      const markerG = this.scene.add.graphics();
      markerG.lineStyle(2, markerColor, 0.85);
      markerG.strokeCircle(pt.cx, pt.cy, pt.radius * 0.5);
      markerG.fillStyle(markerColor, 0.12);
      markerG.fillCircle(pt.cx, pt.cy, pt.radius * 0.5);

      // 포인트 중심 점
      markerG.fillStyle(markerColor, 1.0);
      markerG.fillCircle(pt.cx, pt.cy, 4);

      // 이름 텍스트
      const label = this.scene.add.text(pt.cx, pt.cy - pt.radius * 0.5 - 16, pt.nameKo, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: `#${markerColor.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      });
      label.setOrigin(0.5, 1);

      // 수심 텍스트
      const depthLabel = this.scene.add.text(
        pt.cx,
        pt.cy + 6,
        `수심 ${pt.avgDepthM}m`,
        {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#aaddff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center',
        }
      );
      depthLabel.setOrigin(0.5, 0);

      this.pointMarkers.add([markerG, label, depthLabel]);
      this.markerTexts.push(label, depthLabel);
    });
  }
}
