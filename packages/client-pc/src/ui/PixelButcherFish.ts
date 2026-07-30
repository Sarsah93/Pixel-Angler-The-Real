/**
 * @file PixelButcherFish.ts
 * @description 도마 위 픽셀 생선 렌더러 — 가이드 시트(sashimi_pixel_guide)와 동일한 도트 생선.
 *
 * 데이터 = data/PixelFishSprites.ts (SVG에서 추출한 도트 매트릭스 3종: 온마리/손질 몸통/필렛).
 * FSM 상태에 따라 스프라이트를 골라 방향(미러)·상태 오버레이(비늘 반짝임/내장/박피 껍질층)를
 * 얹는다. 구 파라메트릭 타원 생선(FishTemplateRenderer)을 도마에서 대체 (사용자 지시
 * 2026-07-29 — "svg 가이드 이미지의 회색 생선처럼 똑같이").
 *
 * 렌더 규칙: 정수 셀 스케일(크리스프) + 행 런 병합 fillRect. 돔류 외 어종은 팔레트를
 * 어종 색으로 약하게 틴트.
 */

import Phaser from 'phaser';
import type { OrientationState } from '@tra/core';
import {
  PixelFishSprite, FISH_WHOLE, FISH_DRESSED, FISH_FILLET,
  FISH_WHOLE_AMBERJACK, FISH_DRESSED_AMBERJACK,
} from '../data/PixelFishSprites.js';
import { FISH_STAGE_SPRITES } from '../data/PixelFishStages.js';

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

export interface PixelFishGeom { x: number; y: number; w: number; h: number; }

/** 도마 스프라이트 세트 (온마리/손질 몸통/필렛) + 틴트 여부 + 어종군 키 */
export interface ButcherSpriteSet {
  whole: PixelFishSprite; dressed: PixelFishSprite; fillet: PixelFishSprite;
  /** true = 스프라이트가 어종 실색을 가짐(틴트 금지) — 방어류 전용 잿방어 스프라이트 */
  nativeColor: boolean;
  /** 단계 스프라이트 조회 키 (`{family}_vessel` / `{family}_fillet1~3` — FISH_STAGE_SPRITES) */
  familyKey: 'amberjack' | 'bream';
}

const AMBERJACK_SPECIES = new Set<string>(['yellowtail', 'amberjack', 'greater_amberjack']);

/**
 * 어종별 도마 스프라이트 세트 — 방어류(방어/부시리/잿방어)는 잿방어 형태(방추형 실색),
 * 그 외(돔류 등)는 감성돔 가이드 형태. (2026-07-30 — 방어류 별도 형태 추출)
 */
export function butcherSpritesFor(speciesId: string): ButcherSpriteSet {
  if (AMBERJACK_SPECIES.has(speciesId)) {
    return { whole: FISH_WHOLE_AMBERJACK, dressed: FISH_DRESSED_AMBERJACK, fillet: FISH_FILLET, nativeColor: true, familyKey: 'amberjack' };
  }
  return { whole: FISH_WHOLE, dressed: FISH_DRESSED, fillet: FISH_FILLET, nativeColor: false, familyKey: 'bream' };
}

/**
 * 손질 단계 스프라이트 선택 — 세장뜨기 구조는 어종군 공통 (사용자 지시 2026-07-30):
 *  BELLY_UP 핏줄/세척 = `{fam}_vessel`(배 안쪽·척추 혈관 뷰) /
 *  BACK_DOWN 장뜨기 = `{fam}_fillet1~3`(길내기 1·2 → 잘라내기, 스트로크 진행 연동.
 *  2면(fillet_1_*)은 좌우 미러). 레지스트리에 없으면 null → 제네릭 + 폴백 오버레이.
 */
function pickStageSprite(
  fam: string, state: PixelFishState,
): { spr: PixelFishSprite; mirrorX: boolean } | null {
  const o = state.orientation;
  if (state.finished || o === 'FLESH_UP') return null;
  const S = FISH_STAGE_SPRITES;
  if (o === 'BELLY_UP' && state.headOff
    && (state.stageId === 'vessel_scrub' || state.stageId === 'gut_wash')) {
    const spr = S[`${fam}_vessel`];
    return spr ? { spr, mirrorX: false } : null;
  }
  if (o === 'BACK_DOWN' && state.stageId?.startsWith('fillet_')) {
    const mirrorX = state.stageId.startsWith('fillet_1');
    const sever = state.stageId.endsWith('_sever');
    const n = sever ? 3 : Math.min(2, state.strokesDone ?? 0);
    if (n <= 0) return null;
    const spr = S[`${fam}_fillet${n}`];
    return spr ? { spr, mirrorX } : null;
  }
  return null;
}

export interface PixelFishState {
  orientation: OrientationState;
  headOff: boolean;
  gutted: boolean;
  scaledSides: number;
  hasScales: boolean;
  finished: boolean;
  currentPullsLeft: number;
  /** 머리(0)~꼬리(1) 항문 위치 — BACK_DOWN 마커 */
  anusRatio: number;
  stageId?: string;
  /** 현재 스테이지 완료 스트로크 수 (장뜨기 길내기 진행 — 단계 스프라이트 선택) */
  strokesDone?: number;
}

/** 팔레트 색 → 어종 틴트 블렌드 (k=0 원본 유지) */
function tintColor(color: number, tint: number, k: number): number {
  if (k <= 0) return color;
  const r = ((color >> 16) & 0xff) * (1 - k) + ((tint >> 16) & 0xff) * k;
  const g = ((color >> 8) & 0xff) * (1 - k) + ((tint >> 8) & 0xff) * k;
  const b = (color & 0xff) * (1 - k) + (tint & 0xff) * k;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

/**
 * 스프라이트 1장을 행 런 병합으로 그린다 (정수 셀 — 크리스프).
 * 반환 = 실제 그린 영역 (오버레이 배치용).
 */
function drawSprite(
  g: Phaser.GameObjects.Graphics, spr: PixelFishSprite, geom: PixelFishGeom,
  mirrorX: boolean, mirrorY: boolean, tint: number | null, tintK: number,
): PixelFishGeom {
  const cell = Math.max(2, Math.floor(Math.min(geom.w / spr.w, geom.h / spr.h)));
  const dw = spr.w * cell, dh = spr.h * cell;
  const ox = geom.x + Math.floor((geom.w - dw) / 2);
  const oy = geom.y + Math.floor((geom.h - dh) / 2);
  // 팔레트 사전 변환 (틴트 1회)
  const pal = spr.palette.map((c) => (tint !== null ? tintColor(c, tint, tintK) : c));

  for (let r = 0; r < spr.h; r++) {
    const row = spr.rows[r];
    const ry = oy + (mirrorY ? spr.h - 1 - r : r) * cell;
    let c = 0;
    while (c < spr.w) {
      const ch = row[c];
      if (ch === '.') { c++; continue; }
      let run = 1;
      while (c + run < spr.w && row[c + run] === ch) run++;
      const idx = AB.indexOf(ch);
      g.fillStyle(pal[idx] ?? 0x000000, 1);
      const cx = mirrorX ? spr.w - c - run : c;
      g.fillRect(ox + cx * cell, ry, run * cell, cell);
      c += run;
    }
  }
  return { x: ox, y: oy, w: dw, h: dh };
}

/**
 * 도마 위 생선 렌더 — FSM 상태로 스프라이트 선택 + 방향 미러 + 상태 오버레이.
 *  BASE = 원본(머리 왼쪽) / FLIP = 좌우 미러 / BELLY_UP·BACK_DOWN = 상하 미러(배 위로)
 */
export function drawPixelButcherFish(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom,
  tint: number | null, state: PixelFishState,
  sprites: ButcherSpriteSet = { whole: FISH_WHOLE, dressed: FISH_DRESSED, fillet: FISH_FILLET, nativeColor: false, familyKey: 'bream' },
): void {
  const o = state.orientation;

  // ── 손질 단계 스프라이트 (핏줄 뷰 / 장뜨기 길내기 1~3) — 있으면 우선 사용 ──
  const stagePick = pickStageSprite(sprites.familyKey, state);
  if (stagePick) {
    drawSprite(g, stagePick.spr, geom, stagePick.mirrorX, false,
      sprites.nativeColor ? null : tint, 0.22);
    return;
  }

  const filletView = state.finished || o === 'FLESH_UP';
  const spr = filletView ? sprites.fillet : state.headOff ? sprites.dressed : sprites.whole;
  const mirrorX = !filletView && o === 'FLIP';
  const mirrorY = !filletView && (o === 'BELLY_UP' || o === 'BACK_DOWN');
  const drawn = drawSprite(g, spr, geom, mirrorX, mirrorY, tint, 0.22);

  if (filletView) {
    // 박피 전 — 슬랩 아래 남은 껍질층 + 꼬리 손잡이 (본편 34~37 연출 근사)
    if (!state.finished && state.currentPullsLeft > 0) {
      g.fillStyle(0x4a555c, 0.95);
      g.fillRoundedRect(drawn.x + drawn.w * 0.04, drawn.y + drawn.h * 0.92, drawn.w * 0.9, Math.max(5, drawn.h * 0.1), 3);
      g.fillStyle(0x3a2c1e, 1);
      g.fillRoundedRect(drawn.x - Math.max(8, drawn.w * 0.035), drawn.y + drawn.h * 0.55, Math.max(10, drawn.w * 0.045), drawn.h * 0.4, 3);
    }
    return;
  }

  // 비늘 반짝임 (비늘치기 전 — BASE/FLIP 측면에서만)
  if (state.hasScales && state.scaledSides < 2 && (o === 'BASE' || o === 'FLIP')
    && !(state.scaledSides >= 1 && o === 'BASE')) {
    g.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 34; i++) {
      const sx = drawn.x + drawn.w * (0.16 + ((i * 73) % 100) / 100 * 0.62);
      const sy = drawn.y + drawn.h * (0.22 + ((i * 37) % 100) / 100 * 0.5);
      g.fillCircle(sx, sy, 1.6);
    }
  }

  // 내장 오버레이 (BELLY_UP 개복 후·제거 전 — 배(위) 쪽에 붉은 내장)
  if (o === 'BELLY_UP' && !state.gutted && state.stageId === 'gut_scoop') {
    g.fillStyle(0x8a3040, 0.92);
    g.fillEllipse(drawn.x + drawn.w * 0.42, drawn.y + drawn.h * 0.3, drawn.w * 0.34, drawn.h * 0.2);
    g.fillStyle(0x6a2030, 0.9);
    g.fillEllipse(drawn.x + drawn.w * 0.3, drawn.y + drawn.h * 0.28, drawn.w * 0.14, drawn.h * 0.12);
  }

  // 항문 마커 (BACK_DOWN — 장뜨기 기준점. 상하 미러라 위쪽 가장자리)
  if (o === 'BACK_DOWN') {
    const ax = mirrorX
      ? drawn.x + drawn.w * (1 - state.anusRatio)
      : drawn.x + drawn.w * state.anusRatio;
    g.fillStyle(0xffd257, 1);
    g.fillCircle(ax, drawn.y + drawn.h * 0.08, 3.5);
  }

  // ── 단계 폴백 오버레이 — 단계 스프라이트 미보유 어종군 (예: 방어류 사진 대기 중) ──
  if (o === 'BELLY_UP' && state.headOff
    && (state.stageId === 'vessel_scrub' || state.stageId === 'gut_wash')) {
    // 척추 아래 혈관 라인 (핏줄) — 세척 단계는 옅게 (씻겨나감)
    const a = state.stageId === 'gut_wash' ? 0.3 : 0.9;
    g.lineStyle(3.5, 0x5a1218, a);
    g.lineBetween(drawn.x + drawn.w * 0.18, drawn.y + drawn.h * 0.6, drawn.x + drawn.w * 0.76, drawn.y + drawn.h * 0.6);
  }
  if (o === 'BACK_DOWN' && state.stageId?.startsWith('fillet_') && (state.strokesDone ?? 0) > 0) {
    // 장뜨기 길내기 진행 — 등 경계 절개선이 점점 깊어짐 (1=가는 선 → 3=벌어진 분홍 살)
    const n = Math.min(3, (state.strokesDone ?? 0) + (state.stageId.endsWith('_sever') ? 1 : 0));
    if (n >= 2) {
      g.fillStyle(0xe8b8b0, 0.9);
      g.fillRect(drawn.x + drawn.w * 0.14, drawn.y + drawn.h * 0.14, drawn.w * 0.68, 2 + n * 2);
    }
    g.lineStyle(1.5 + n, 0x2a1214, 0.9);
    g.lineBetween(drawn.x + drawn.w * 0.12, drawn.y + drawn.h * 0.15, drawn.x + drawn.w * 0.85, drawn.y + drawn.h * 0.13);
  }
}
