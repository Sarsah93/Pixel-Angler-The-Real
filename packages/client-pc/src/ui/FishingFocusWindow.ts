/**
 * @file FishingFocusWindow.ts
 * @description 낚시 진행 시 수면과 찌를 집중 확대해서 보여주는 원형 뷰포트
 *
 * 파이팅 상태에서는 **2D 수중 단면 무대**로 승격된다 (2026-07 파이트 2D 개편):
 *  - 좌표: 가로 X = 좌우 횡 러닝 / 세로 Y = 수심(위=수면·플레이어쪽, 아래=깊이 박기)
 *  - 로드 팁 앵커 = 뷰 상단 중앙 — 스티어(←/→)에 따라 살짝 기울어짐
 *  - 낚싯줄 = 앵커→물고기 라인. **줄 색 = 텐션 연속 그라데이션**
 *    (미색→노랑→빨강, 임계 0.85+ 깜빡임·굵기↑ — 텐션바 임계와 동일 값 동기화)
 *  - 걸린 물고기 1마리를 물리(FightPhysics2D) 구동으로 렌더:
 *    회전 = heading(도주 방향), 위치 = displacement,
 *    **깊이 → 투명도**(깊을수록 흐림, 최소 알파 0.25), 저스태미나 = 옆으로 눕는 롤
 */

import Phaser from 'phaser';
import type { FishSpecies, FightState2D, FightTick2DResult } from '@tra/core';

interface FishShadowData {
  orbitRadius: number;  // 회전 반경
  orbitAngle: number;   // 찌 중심 기준 궤도 각도
  orbitSpeed: number;   // 궤도 공전 속도
  size: number;         // 그림자 크기
  wiggle: number;       // 꼬리 흔들림 주기
  x: number;
  y: number;
}

export class FishingFocusWindow extends Phaser.GameObjects.Container {
  private bg?: Phaser.GameObjects.Graphics;
  private bobber?: Phaser.GameObjects.Graphics;
  private waterWaves?: Phaser.GameObjects.Graphics;
  private size: number;

  // 동적 그림자 객체 관리
  private shadowObjects: { graphics: Phaser.GameObjects.Graphics; data: FishShadowData }[] = [];
  private hasSurfaceFish = false;
  private hasBoilingFish = false;

  // ── 파이트 2D 무대 (fighting 상태 전용) ──
  private fightFishG?: Phaser.GameObjects.Graphics;
  private fightLineG?: Phaser.GameObjects.Graphics;
  private rodTipG?: Phaser.GameObjects.Graphics;
  /** 임계 깜빡임 누적 시계 */
  private pulseClock = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    super(scene, x, y);
    this.size = size;

    this.createWindow();
  }

  private createWindow(): void {
    // 반투명 창 테두리 및 마스크
    this.bg = this.scene.add.graphics();
    
    // 심해 물빛 원형 영역
    this.bg.fillStyle(0x0a2f4c, 0.9);
    this.bg.fillCircle(0, 0, this.size / 2);
    this.bg.lineStyle(4, 0x2a5a8a, 0.85);
    this.bg.strokeCircle(0, 0, this.size / 2);
    this.add(this.bg);

    // 물결 패턴선 그리기
    this.waterWaves = this.scene.add.graphics();
    this.waterWaves.lineStyle(1.5, 0x134870, 0.6);
    this.drawWaves();
    this.add(this.waterWaves);

    // 찌 물체 형상화 (구멍찌/수중찌 이미지 대용)
    this.bobber = this.scene.add.graphics();
    this.drawBobber(0, 0);
    this.add(this.bobber);
  }

  private drawWaves(): void {
    if (!this.waterWaves) return;
    this.waterWaves.clear();
    this.waterWaves.lineStyle(1.5, 0x134870, 0.6);
    
    // 원형 내부에 대각 물결 그리기
    for (let i = -3; i <= 3; i++) {
      const y = i * 20;
      this.waterWaves.beginPath();
      this.waterWaves.moveTo(-this.size / 2.5, y);
      this.waterWaves.lineTo(this.size / 2.5, y + 4);
      this.waterWaves.strokePath();
    }
  }

  private drawBobber(ox: number, oy: number): void {
    if (!this.bobber) return;
    this.bobber.clear();

    // 찌 상단 (붉은색/오렌지색 시인성)
    this.bobber.fillStyle(0xff4422);
    this.bobber.fillRect(ox - 6, oy - 14, 12, 10);
    
    // 찌 주황 형광 케미라인
    this.bobber.fillStyle(0xffcc00);
    this.bobber.fillRect(ox - 2, oy - 22, 4, 8);

    // 찌 하단 (노란색/하얀색 물밑 밸런서)
    this.bobber.fillStyle(0xffffff);
    this.bobber.fillRect(ox - 6, oy - 4, 12, 8);
    
    // 원줄 관통 구멍 링
    this.bobber.lineStyle(1, 0x333333);
    this.bobber.strokeRect(ox - 7, oy - 4, 14, 1);
  }

  /**
   * 찌의 상태 애니메이션 업데이트
   */
  setBobberState(
    state: 'hidden' | 'floating' | 'shaking' | 'sinking' | 'fighting',
    possibleSpecies: FishSpecies[] = [],
  ): void {
    if (!this.bobber) return;

    // 기존 애니메이션 트윈 정리
    this.scene.tweens.killTweensOf(this.bobber);
    this.bobber.setPosition(0, 0);

    // 어종 특징 파악 (상층 및 보일링)
    this.hasSurfaceFish = possibleSpecies.some(f => f.swimmingLayer === 'surface');
    this.hasBoilingFish = possibleSpecies.some(f => f.isBoilingSpecies);

    // 그림자 인스턴스 셋업
    this.setupShadows(state);

    if (state === 'hidden') {
      this.bobber.setVisible(false);
    } else if (state === 'floating') {
      this.bobber.setVisible(true);
      // 잔잔한 위아래 떠다님
      this.scene.tweens.add({
        targets: this.bobber,
        y: 4,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (state === 'shaking') {
      this.bobber.setVisible(true);
      // 입질 경고 흔들림 (짧고 빠른 셰이킹)
      this.scene.tweens.add({
        targets: this.bobber,
        x: { from: -3, to: 3 },
        y: { from: -1, to: 2 },
        duration: 100,
        yoyo: true,
        repeat: -1,
      });
    } else if (state === 'sinking') {
      this.bobber.setVisible(true);
      // 어신 히트! 수면 아래로 스르륵 잠김
      this.scene.tweens.add({
        targets: this.bobber,
        y: 35,
        alpha: 0.4,
        duration: 400,
        ease: 'Quad.easeIn',
      });
    } else if (state === 'fighting') {
      // 파이트 2D 무대 — 찌 대신 걸린 물고기 1마리를 물리 구동으로 렌더
      this.bobber.setVisible(false);
      this.enterFightStage();
    }

    if (state !== 'fighting') this.exitFightStage();
  }

  // ═══════════════════════════════════════════════════
  // 파이트 2D 무대 (상단 앵커 수중 단면뷰)
  // ═══════════════════════════════════════════════════
  /** 앵커(로드 팁) 로컬 좌표 — 뷰 상단 중앙 */
  private get anchorY(): number {
    return -this.size / 2 + 10;
  }

  private enterFightStage(): void {
    this.exitFightStage();
    this.fightLineG = this.scene.add.graphics();
    this.fightFishG = this.scene.add.graphics();
    this.rodTipG = this.scene.add.graphics();
    this.add([this.fightLineG, this.fightFishG, this.rodTipG]);
    this.pulseClock = 0;
  }

  private exitFightStage(): void {
    this.fightLineG?.destroy(); this.fightLineG = undefined;
    this.fightFishG?.destroy(); this.fightFishG = undefined;
    this.rodTipG?.destroy(); this.rodTipG = undefined;
  }

  /**
   * 파이트 2D 프레임 렌더 — 물리 결과를 시각으로 변환.
   * state.fishPos는 뷰 반경을 벗어나지 않도록 **여기서 클램프**한다
   * (물리(core)는 클램프하지 않음 — 뷰 책임).
   */
  updateFight2D(state: FightState2D, res: FightTick2DResult, deltaMs: number, fishSizePx = 26): void {
    if (!this.fightFishG || !this.fightLineG || !this.rodTipG) return;
    this.pulseClock += deltaMs;

    // ── 위치 클램프 (뷰 원 내부 + 수면 아래) — 앵커 기준 로컬 좌표를 뷰 중심 좌표로 변환 ──
    const R = this.size / 2 - 14;
    // fishPos는 앵커(상단 중앙) 원점 — 뷰 중심 기준으로 옮긴다
    let vx = state.fishPos.x;
    let vy = this.anchorY + state.fishPos.y;
    const d = Math.hypot(vx, vy);
    if (d > R) { vx = (vx / d) * R; vy = (vy / d) * R; }
    if (vy < this.anchorY + 14) vy = this.anchorY + 14;   // 수면(앵커) 위로는 못 올라감
    // 클램프 결과를 물리 상태에 반영 (다음 틱 라인각이 화면과 일치하도록)
    state.fishPos.x = vx;
    state.fishPos.y = vy - this.anchorY;

    // ── 깊이 → 투명도/크기 (이중 단서, 최소 알파 0.25) ──
    const depthT = Phaser.Math.Clamp((vy - this.anchorY) / (R * 1.6), 0, 1);
    const alpha = Phaser.Math.Clamp(1 - depthT * 0.9, 0.25, 1);
    const scale = 1 - depthT * 0.3;

    // ── 로드 팁 (스티어 기울임 반영) ──
    const tipX = Math.sin(state.rodLeanAngle) * 16;
    const tipY = this.anchorY;
    this.rodTipG.clear();
    this.rodTipG.fillStyle(0xd8d4c8, 1);
    this.rodTipG.fillTriangle(tipX - 5, tipY - 6, tipX + 5, tipY - 6, tipX, tipY + 4);
    this.rodTipG.fillStyle(0xff8a3d, 1);
    this.rodTipG.fillCircle(tipX, tipY + 4, 2.4);

    // ── 낚싯줄 — 텐션 연속 그라데이션 (미색→노랑→빨강) + 임계 펄스 ──
    const t = res.combinedTensionRatio;
    const color = t < 0.6
      ? Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xdff2ff),
        Phaser.Display.Color.ValueToColor(0xffe066), 60, Math.round(t * 100))
      : Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffe066),
        Phaser.Display.Color.ValueToColor(0xff3333), 40, Math.round((t - 0.6) * 100));
    const lineColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    const critical = t >= 0.85;   // 텐션바 critical 임계와 동일 값
    const pulse = critical ? 0.55 + 0.45 * Math.abs(Math.sin(this.pulseClock / 90)) : 1;
    const lineWidth = 1.2 + t * 1.6 + (critical ? 0.8 : 0);
    // 임계 시 미세 진동
    const jx = critical ? (Math.random() - 0.5) * 2.2 : 0;
    const jy = critical ? (Math.random() - 0.5) * 2.2 : 0;

    this.fightLineG.clear();
    this.fightLineG.lineStyle(lineWidth, lineColor, pulse);
    this.fightLineG.beginPath();
    this.fightLineG.moveTo(tipX, tipY + 4);
    this.fightLineG.lineTo(vx + jx, vy + jy);
    this.fightLineG.strokePath();

    // ── 물고기 — 회전 = heading(도주 방향), 저스태미나 = 옆으로 눕는 롤 ──
    const g = this.fightFishG;
    g.clear();
    g.setPosition(vx, vy);
    g.setRotation(state.fishHeading);
    g.setAlpha(alpha);
    if (res.isRolling) {
      // 옆으로 눕기: 납작해지며 은빛 배 노출 (떠오른 물고기 신호)
      g.setScale(scale, scale * 0.55);
      g.fillStyle(0xb8ccd8, 0.9);
    } else {
      g.setScale(scale, scale);
      g.fillStyle(0x0a2438, 0.9);
    }
    const s = fishSizePx;
    g.fillEllipse(0, 0, s, s * 0.42);
    g.beginPath();
    g.moveTo(-s / 2, 0);
    g.lineTo(-s * 1.05, -s * 0.24);
    g.lineTo(-s * 1.05, s * 0.24);
    g.closePath();
    g.fillPath();
    // 머리 점 (도주 방향 확인용)
    g.fillStyle(0xeaf6ff, res.isRolling ? 0.9 : 0.5);
    g.fillCircle(s * 0.36, 0, 2.2);
  }

  // ═══════════════════════════════════════════════════
  // 루어 액션 연출 (액션 페이즈 — 다트/저킹 시 찌·그림자 반응)
  // ═══════════════════════════════════════════════════
  /** 다트/저킹 임펄스 — 찌(루어)가 해당 방향으로 튕겼다 복귀 */
  nudgeBobber(dx: number, dy: number): void {
    if (!this.bobber || !this.bobber.visible) return;
    this.scene.tweens.add({
      targets: this.bobber,
      x: this.bobber.x + dx,
      y: this.bobber.y + dy,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** 액션 매칭 성공 순간 — 주변 그림자가 찌 쪽으로 따라붙는 유인 반응 */
  pulseShadowAttraction(): void {
    for (const obj of this.shadowObjects) {
      obj.data.orbitRadius = Math.max(16, obj.data.orbitRadius * 0.82);
      obj.data.orbitSpeed *= 1.35;
    }
  }

  /**
   * 상태에 따른 물고기 그림자 초기 생성
   */
  private setupShadows(state: string): void {
    // 기존 그림자 그래픽 오브젝트 해제
    this.shadowObjects.forEach((obj) => obj.graphics.destroy());
    this.shadowObjects = [];

    if (state !== 'floating' && state !== 'shaking') {
      return; // 찌 흘리는 대기 상태가 아닐 땐 그림자를 보이지 않음
    }

    if (!this.hasSurfaceFish) {
      return; // 상층/보일링 서식 어종이 없는 경우 그림자 생성을 건너뜀 (중하층 어종은 비시각화)
    }

    // 그림자 개수 결정: 보일링이면 5~8마리 떼, 일반 상층 어종이면 1~2마리
    const shadowCount = this.hasBoilingFish
      ? Phaser.Math.Between(5, 8)
      : Phaser.Math.Between(1, 2);

    for (let i = 0; i < shadowCount; i++) {
      const orbitRadius = this.hasBoilingFish
        ? Phaser.Math.Between(25, 75)
        : Phaser.Math.Between(40, 85);

      const orbitAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      // 보일링 어종이면 매우 빠름, 일반 상층 어종이면 여유롭게 헤엄침
      const orbitSpeed = this.hasBoilingFish
        ? Phaser.Math.FloatBetween(0.015, 0.03) * (Math.random() < 0.5 ? 1 : -1)
        : Phaser.Math.FloatBetween(0.004, 0.008) * (Math.random() < 0.5 ? 1 : -1);

      const size = this.hasBoilingFish ? Phaser.Math.Between(6, 12) : Phaser.Math.Between(14, 22);

      // 개별 물고기 그림자 그래픽 생성
      const g = this.scene.add.graphics();
      
      // 어두운 투명 남색 실루엣 그리기
      g.fillStyle(0x041829, 0.35);
      // 몸통 타원
      g.fillEllipse(0, 0, size, size * 0.45);
      // 꼬리 삼각형
      g.beginPath();
      g.moveTo(-size / 2, 0);
      g.lineTo(-size * 1.1, -size * 0.25);
      g.lineTo(-size * 1.1, size * 0.25);
      g.closePath();
      g.fillPath();

      // 컨테이너 내 찌(bobber) 레이어 아래에 추가
      // 인덱스: bg(0), waterWaves(1) 그 다음으로 2번에 추가
      this.addAt(g, 2);

      this.shadowObjects.push({
        graphics: g,
        data: {
          orbitRadius,
          orbitAngle,
          orbitSpeed,
          size,
          wiggle: Phaser.Math.FloatBetween(0, Math.PI * 2),
          x: 0,
          y: 0,
        },
      });
    }
  }

  /**
   * 매 프레임 그림자 좌표 업데이트
   */
  updateShadows(delta: number): void {
    if (this.shadowObjects.length === 0) return;

    const radiusLimit = this.size / 2 - 6;

    this.shadowObjects.forEach((obj) => {
      const s = obj.data;
      const g = obj.graphics;

      // 궤도 계산으로 각도 업데이트
      s.orbitAngle += s.orbitSpeed * (delta / 16.666);
      s.wiggle += 0.35 * (delta / 16.666);

      // 중심 찌 기준으로 목표 위치 계산
      const targetX = Math.cos(s.orbitAngle) * s.orbitRadius;
      const targetY = Math.sin(s.orbitAngle) * s.orbitRadius;

      // 헤엄 방향 각도
      const dx = targetX - s.x;
      const dy = targetY - s.y;
      let angle = g.rotation;
      if (dx !== 0 || dy !== 0) {
        angle = Math.atan2(dy, dx);
      }

      s.x = targetX;
      s.y = targetY;

      const distFromCenter = Math.sqrt(s.x * s.x + s.y * s.y);
      if (distFromCenter > radiusLimit) {
        g.setVisible(false);
      } else {
        g.setVisible(true);
        g.setPosition(s.x, s.y);
        // 물고기 헤엄 방향 회전값 + 미세 꼬리 흔들림 주기 적용
        g.setRotation(angle + Math.sin(s.wiggle) * 0.12);
      }
    });
  }

  /**
   * 씬 소멸 시 동적 그래픽 파괴
   */
  destroy(fromScene?: boolean): void {
    this.shadowObjects.forEach((obj) => obj.graphics.destroy());
    this.shadowObjects = [];
    super.destroy(fromScene);
  }
}
