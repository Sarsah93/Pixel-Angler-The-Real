/**
 * @file RigIconRenderer.ts
 * @description 채비/미끼/루어/물고기 파라메트릭 벡터 아이콘 (황색 원 대체)
 *
 * 스프라이트시트 없이 매 프레임 heading으로 다시 그리는 2.5D 방향성 드로잉:
 *  회전(rotate(headingRad)) + 진행축 foreshorten(scaleX ×|cos|)으로 ~360° 커버.
 * 종류별 실루엣 — 메탈지그=총알/마름모 · 미노우=몸통+립+꼬리 · 에기=새우형+천꼬리 ·
 * 스푼=휘어진 블레이드 · 스피너=블레이드+와이어 · 웜/그럽=곱은 소프트바디+지그헤드 ·
 * 타이라바=헤드+스커트 · 미끼(웜/새우/살점) · 떡밥=덩어리 군집 · 물고기=타원+머리/꼬리.
 *
 * 물고기: 머리 = +heading 방향 꼭짓점(눈 점) — 목줄은 fishHeadPoint()가 주는
 * 머리 좌표에 연결한다 (몸통 중앙 금지).
 */

import Phaser from 'phaser';
import type { LureKind } from '@tra/core';

export type RigIconKind =
  | { t: 'lure'; kind: LureKind }
  | { t: 'bait'; kind: 'worm' | 'shrimp' | 'strip' }
  | { t: 'chum' }
  | { t: 'fish'; speciesId: string };

/** 루어 종류별 기본 색 (LuresCatalogDB 톤) */
const LURE_COLOR: Record<string, number> = {
  metal_jig: 0xc8d0d8, plug_minnow: 0x6aa8d8, egi: 0xd88a4a, spoon: 0xdcdce4,
  spinner: 0xffd257, worm_grub: 0x7fe6b0, soft_jerkbait: 0xf0a0b0, tairaba: 0xd84a4a,
};

/** 어종별 몸통 색 (미등록 폴백 포함) */
const FISH_BODY: Record<string, number> = {
  black_seabream: 0x4a5560, flatfish: 0x6a5a3e, largescale_blackfish: 0x2e3a46,
  longtail_blackfish: 0x35506a, sea_bass: 0x5a6a74, yellowtail: 0x3e5a74,
  spanish_mackerel: 0x5a7a8c, squid: 0xd8b8c8, cuttlefish: 0xc8b090,
};

/** 물고기 머리(목줄 부착점) 좌표 — heading 방향 앞 꼭짓점 */
export function fishHeadPoint(
  cx: number, cy: number, headingRad: number, scale: number,
): { x: number; y: number } {
  const L = 15 * scale;
  return { x: cx + Math.cos(headingRad) * L, y: cy + Math.sin(headingRad) * L };
}

/**
 * 아이콘 드로잉 — g에 headingRad 방향으로 그린다.
 * @param foreshorten 진행축 축소(0.35~1) — 정면/후면 진행 표현 (기본 1)
 */
export function drawRigIcon(
  g: Phaser.GameObjects.Graphics,
  cx: number, cy: number,
  icon: RigIconKind,
  headingRad: number,
  scale = 1,
  alpha = 1,
  foreshorten = 1,
): void {
  g.save();
  g.translateCanvas(cx, cy);
  g.rotateCanvas(headingRad);
  g.scaleCanvas(Math.max(0.35, foreshorten) * scale, scale);

  if (icon.t === 'lure') drawLure(g, icon.kind, alpha);
  else if (icon.t === 'bait') drawBait(g, icon.kind, alpha);
  else if (icon.t === 'chum') drawChum(g, alpha);
  else drawFish(g, icon.speciesId, alpha);

  g.restore();
}

// ── 루어 (길이축 = +x, 머리/진행 방향 앞) ──────────────
function drawLure(g: Phaser.GameObjects.Graphics, kind: LureKind, a: number): void {
  const c = LURE_COLOR[kind] ?? 0xffb46a;
  switch (kind) {
    case 'metal_jig':   // 길쭉한 총알/마름모 + 금속 하이라이트
      g.fillStyle(c, a);
      g.beginPath();
      g.moveTo(11, 0); g.lineTo(3, -3.2); g.lineTo(-9, -2); g.lineTo(-11, 0); g.lineTo(-9, 2); g.lineTo(3, 3.2);
      g.closePath(); g.fillPath();
      g.fillStyle(0xffffff, a * 0.55);
      g.fillRect(-7, -1.2, 12, 1.2);
      break;
    case 'plug_minnow': // 몸통 + 립 + 꼬리
      g.fillStyle(c, a);
      g.fillEllipse(0, 0, 17, 6);
      g.fillTriangle(-8, 0, -13, -3, -13, 3);
      g.fillStyle(0xd8ecf8, a * 0.9);
      g.fillTriangle(9, 0, 13, 2.4, 10, 3.4);   // 립 (앞 아래)
      g.fillStyle(0x111418, a);
      g.fillCircle(6, -1.2, 1.1);
      break;
    case 'egi': {       // 새우형 + 천(스커트) 꼬리 + 카운터 발란스
      g.fillStyle(c, a);
      g.fillEllipse(1, 0, 15, 5.4);
      g.fillTriangle(8.5, 0, 11.5, -2.4, 11.5, 1.2);   // 머리 뾰족
      g.lineStyle(1, c, a * 0.85);
      for (let i = 0; i < 3; i++) g.lineBetween(-7, -1.5 + i * 1.5, -12, -3 + i * 3);   // 천꼬리
      g.fillStyle(0x111418, a);
      g.fillCircle(7, -1.4, 1.2);
      g.fillStyle(0xffe28a, a * 0.8);
      g.fillEllipse(-2, 2.4, 5, 1.6);   // 배 침 시트
      break;
    }
    case 'spoon':       // 휘어진 블레이드
      g.fillStyle(c, a);
      g.fillEllipse(0, 0, 15, 6.4);
      g.fillStyle(0x9aa4b0, a * 0.7);
      g.fillEllipse(1.5, -0.8, 10, 3.4);
      g.lineStyle(1, 0x8898a8, a);
      g.lineBetween(-8, 0, -11, 1.8);   // 훅 와이어
      break;
    case 'spinner':     // 와이어 + 회전 블레이드 + 비드
      g.lineStyle(1.2, 0x9aa4b0, a);
      g.lineBetween(-9, 0, 9, 0);
      g.fillStyle(c, a);
      g.fillEllipse(4, -3, 8, 4);       // 블레이드 (위로 젖힘)
      g.fillStyle(0xd84a4a, a);
      g.fillCircle(-3, 0, 1.6);         // 비드
      g.fillCircle(-6, 0, 1.2);
      break;
    case 'worm_grub':   // 곱은 소프트바디 + 지그헤드
      g.fillStyle(0x9aa4b0, a);
      g.fillCircle(8, 0, 3);            // 지그헤드
      g.fillStyle(c, a * 0.9);
      g.fillEllipse(2, 0.5, 8, 3.4);
      g.fillEllipse(-4, -0.8, 7, 3);
      g.fillEllipse(-9, 1, 6, 2.6);     // 꼬리 굽음
      g.fillStyle(0x111418, a);
      g.fillCircle(8.6, -0.8, 0.9);
      break;
    case 'soft_jerkbait': // 슬림 바디 + 포크 테일
      g.fillStyle(c, a * 0.92);
      g.fillEllipse(1, 0, 16, 4.6);
      g.fillTriangle(-8, 0, -12.5, -2.6, -10, 0);
      g.fillTriangle(-8, 0, -12.5, 2.6, -10, 0);
      g.fillStyle(0x111418, a);
      g.fillCircle(7, -1, 1);
      break;
    case 'tairaba':     // 라운드 헤드 + 스커트
      g.fillStyle(c, a);
      g.fillCircle(6, 0, 4);
      g.lineStyle(1, 0xff8a6a, a * 0.9);
      for (let i = 0; i < 4; i++) g.lineBetween(3, -2 + i * 1.4, -9, -4 + i * 2.8);
      break;
  }
}

// ── 미끼 ───────────────────────────────────────────────
function drawBait(g: Phaser.GameObjects.Graphics, kind: 'worm' | 'shrimp' | 'strip', a: number): void {
  if (kind === 'worm') {           // 지렁이 — S자 곡선
    g.lineStyle(2.6, 0xd87a9a, a);
    g.beginPath();
    g.moveTo(8, 0);
    g.lineTo(4, -2.4); g.lineTo(0, 1.8); g.lineTo(-4, -1.8); g.lineTo(-8, 1.4);
    g.strokePath();
  } else if (kind === 'shrimp') {  // 크릴/새우 — 굽은 몸통 + 꼬리 부채
    g.fillStyle(0xf0b090, a);
    g.fillEllipse(2, 0, 10, 4.4);
    g.fillEllipse(-3, 1.4, 7, 3.4);
    g.fillTriangle(-6, 2, -10, 0.6, -9, 4.2);
    g.fillStyle(0x111418, a);
    g.fillCircle(6, -0.8, 0.9);
  } else {                          // 어육 살점 — 물결 리본
    g.fillStyle(0xe8e0d0, a);
    g.beginPath();
    g.moveTo(8, -1.6); g.lineTo(-8, -2.6); g.lineTo(-6, 0.8); g.lineTo(-9, 3); g.lineTo(7, 2.2);
    g.closePath(); g.fillPath();
  }
}

// ── 떡밥/집어제 — 덩어리 군집 ─────────────────────────
function drawChum(g: Phaser.GameObjects.Graphics, a: number): void {
  g.fillStyle(0xc8a060, a);
  g.fillCircle(0, 0, 4);
  g.fillCircle(4, 2, 2.6);
  g.fillCircle(-3.6, 2.4, 2.2);
  g.fillCircle(1, -3.6, 2);
}

// ── 물고기 (파이트) — 타원 몸통 + 삼각 꼬리 + 둥근 머리(눈) ──
function drawFish(g: Phaser.GameObjects.Graphics, speciesId: string, a: number): void {
  const body = FISH_BODY[speciesId] ?? 0x4a6a80;
  // 몸통 타원 (머리 +x)
  g.fillStyle(body, a);
  g.fillEllipse(0, 0, 22, 9);
  // 머리 (둥근 앞부분 — 목줄 부착점은 fishHeadPoint)
  g.fillEllipse(8, 0, 9, 7.4);
  // 꼬리 (뒤 삼각)
  g.fillTriangle(-10, 0, -16, -5, -16, 5);
  // 배 밴드
  g.fillStyle(0xffffff, a * 0.22);
  g.fillEllipse(0, 2, 17, 3.6);
  // 밝은 윤곽 (어두운 수중 배경 가시성)
  g.lineStyle(1.2, 0x9fd0e4, a * 0.85);
  g.strokeEllipse(0, 0, 22, 9);
  // 눈
  g.fillStyle(0xffffff, a);
  g.fillCircle(10.5, -1.6, 1.7);
  g.fillStyle(0x111418, a);
  g.fillCircle(10.9, -1.6, 0.9);
}
