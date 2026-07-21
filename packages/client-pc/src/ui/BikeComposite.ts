/**
 * @file BikeComposite.ts
 * @description 자전거 탑승 합성 렌더 — 캐릭터 스프라이트 발밑에 자전거 레이어를 깔아
 *              "탄 상태"를 표현한다 (새 캐릭터 스프라이트 없이 기존 4방향 재사용).
 *
 * 표현 규칙 (사용자 시안):
 *  - 측면(left/right): 바퀴 2개 실루엣 + 다이아몬드 프레임 + 핸들/안장. 좌우는 부호 반전.
 *  - 정면(front): 가로 핸들바 + 수직 프레임 + 맨 아래 에지온 바퀴(가는 세로 타원).
 *  - 후면(back): 핸들바 없이 안장 + 수직 프레임 + 에지온 바퀴.
 *  - 이동 중: 바퀴 스포크 회전 + 2px 상하 바운스(페달링감). 정지 시 정적.
 *
 * 현재는 Phaser Graphics 벡터 플레이스홀더(프레임 빨강) — 추후 PNG 3종
 * (bike-side/bike-front/bike-back, 측면은 flipX 공유)으로 교체 예정.
 */

import Phaser from 'phaser';

export type RiderDir = 'front' | 'back' | 'left' | 'right';

/** 프레임 색 (플레이스홀더 — 추후 자전거 색상/에셋로 교체) */
const FRAME = 0xd84a3a;
const TIRE = 0x22262c;
const SPOKE = 0x8a939c;
const SEAT = 0x2a2e34;

export class BikeComposite {
  private g: Phaser.GameObjects.Graphics;
  private shown = false;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setVisible(false);
  }

  setVisible(v: boolean): void {
    this.shown = v;
    this.g.setVisible(v);
    if (!v) this.g.clear();
  }

  /**
   * 매 프레임 드로잉.
   * @param footY 캐릭터 발밑 Y (자전거 접지 기준)
   * @param depth 캐릭터 스프라이트 depth 바로 아래 값
   * @returns 라이더(캐릭터 스프라이트)에 적용할 y 오프셋 (안장 높이 + 바운스)
   */
  update(x: number, footY: number, dir: RiderDir, moving: boolean, timeMs: number, depth: number): number {
    if (!this.shown) return 0;
    const g = this.g;
    g.clear();
    g.setDepth(depth);

    const bounce = moving ? Math.sin(timeMs / 90) * 2 : 0;
    const y = footY + bounce * 0.4;
    const spin = timeMs / 110;

    if (dir === 'left' || dir === 'right') {
      const s = dir === 'right' ? 1 : -1;
      // 바퀴 2개 (뒤/앞) + 회전 스포크
      for (const wx of [-11 * s, 11 * s]) {
        g.lineStyle(2.2, TIRE, 1);
        g.strokeCircle(x + wx, y - 6, 7);
        const a = moving ? spin : 0.6;
        g.lineStyle(1, SPOKE, 0.9);
        g.lineBetween(x + wx - Math.cos(a) * 5.5, y - 6 - Math.sin(a) * 5.5,
          x + wx + Math.cos(a) * 5.5, y - 6 + Math.sin(a) * 5.5);
        g.lineBetween(x + wx + Math.sin(a) * 5.5, y - 6 - Math.cos(a) * 5.5,
          x + wx - Math.sin(a) * 5.5, y - 6 + Math.cos(a) * 5.5);
      }
      // 프레임 (다이아몬드 근사)
      g.lineStyle(2, FRAME, 1);
      g.lineBetween(x - 11 * s, y - 6, x - 1 * s, y - 14);   // 시트 튜브
      g.lineBetween(x - 1 * s, y - 14, x + 8 * s, y - 15);   // 탑 튜브
      g.lineBetween(x + 8 * s, y - 15, x + 11 * s, y - 6);   // 포크
      g.lineBetween(x - 1 * s, y - 14, x + 3 * s, y - 6);    // 다운 튜브
      g.lineBetween(x + 3 * s, y - 6, x - 11 * s, y - 6);    // 체인 스테이
      // 안장 + 핸들
      g.lineStyle(3, SEAT, 1);
      g.lineBetween(x - 4 * s, y - 16, x + 1 * s, y - 16);
      g.lineBetween(x + 8 * s, y - 17, x + 10 * s, y - 15);
    } else if (dir === 'front') {
      // 정면: 가로 핸들바 + 수직 프레임 + 에지온 앞바퀴 (캐릭터 다리 사이 겹침)
      g.lineStyle(2.6, FRAME, 1);
      g.lineBetween(x - 9, y - 16, x + 9, y - 16);   // 핸들바
      g.lineBetween(x, y - 16, x, y - 3);            // 수직 프레임
      g.fillStyle(TIRE, 1);
      g.fillEllipse(x, y - 3, 3.4, 8);               // 에지온 바퀴
      g.fillStyle(SPOKE, moving ? 0.55 : 0.3);
      g.fillEllipse(x, y - 3, 1.6, 5);
    } else {
      // 후면: 안장 + 수직 프레임 (핸들바 없음) + 에지온 뒷바퀴
      g.lineStyle(2.6, FRAME, 1);
      g.lineBetween(x, y - 15, x, y - 3);
      g.lineStyle(3.2, SEAT, 1);
      g.lineBetween(x - 4, y - 15, x + 4, y - 15);   // 안장
      g.fillStyle(TIRE, 1);
      g.fillEllipse(x, y - 3, 3.4, 8);
      g.fillStyle(SPOKE, moving ? 0.55 : 0.3);
      g.fillEllipse(x, y - 3, 1.6, 5);
    }

    // 라이더는 안장 높이만큼 올라탄다 (+페달링 바운스)
    return -9 + bounce;
  }

  destroy(): void {
    this.g.destroy();
  }
}
