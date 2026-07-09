/**
 * @file FishingFocusWindow.ts
 * @description 낚시 진행 시 수면과 찌를 집중 확대해서 보여주는 원형/사각형 뷰포트
 */

import Phaser from 'phaser';
import type { FishSpecies } from '@tra/core';

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
      this.bobber.setVisible(true);
      // 격렬한 밀당 좌우 흔들림
      this.scene.tweens.add({
        targets: this.bobber,
        x: { from: -15, to: 15 },
        y: { from: -5, to: 8 },
        duration: 150,
        yoyo: true,
        repeat: -1,
      });
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
