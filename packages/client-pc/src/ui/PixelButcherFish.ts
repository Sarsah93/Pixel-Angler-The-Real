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
import { FISH_VIEW_SPRITES } from '../data/PixelFishViews.js';

/** 단계 스프라이트 조회 — 실사 사진 레지스트리 우선, 없으면 파라메트릭 뷰 폴백 */
function stageSpr(key: string): PixelFishSprite | undefined {
  return FISH_STAGE_SPRITES[key] ?? FISH_VIEW_SPRITES[key];
}

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
 * 진행도별 몸통 스프라이트 (사용자 리포트 2026-07-30 — "내장 제거 전인데 배가 정리돼 있고
 * 지느러미 3종이 다 없는 그림"). 구 구현은 headOff만 보고 곧장 `dressed`(본편1 = 머리·
 * 지느러미·내장 **전부** 제거 상태)를 써서 아직 안 한 작업까지 끝난 것처럼 보였다.
 *  온마리 → 머리만 제거(지느러미·내장 有) → 지느러미 제거(내장 有) → 내장 제거(dressed)
 * 어종군 전용 중간 스프라이트가 없으면(방어류 — 사진 대기) dressed로 폴백한다.
 */
function bodySpriteFor(sprites: ButcherSpriteSet, state: PixelFishState): PixelFishSprite {
  if (!state.headOff) return sprites.whole;
  const S = FISH_STAGE_SPRITES;
  const fam = sprites.familyKey;
  if (state.gutted) return S[`${fam}_gutted`] ?? sprites.dressed;
  if (state.finsOff) return S[`${fam}_finless`] ?? sprites.dressed;
  return S[`${fam}_headless`] ?? sprites.dressed;
}

/**
 * 손질 단계 스프라이트 선택 — 세장뜨기 구조는 어종군 공통 (사용자 지시 2026-07-30):
 *  BELLY_UP 배따기·내장 = `{fam}_ventral`(**뱃살을 정면으로 바라보는 복면 뷰**) /
 *  BELLY_UP 핏줄·세척 = `{fam}_vessel`(사진) → `{fam}_cavity`(**내장 꺼낸 체강 탑뷰**) /
 *  BACK_DOWN 등쪽 장뜨기 = `{fam}_dorsal0~3`(등을 카메라 쪽으로 눕힌 뷰 — 머리 오른쪽) /
 *  BELLY_UP 배쪽 장뜨기 = `{fam}_belly0~3`(배를 카메라 쪽으로 — 꼬리 오른쪽).
 *  단계 = 칼집 회차(0 닫힘 / 1 붉은 살 조금 / 2 뼈 노출 / 3 반대쪽까지 벌어짐),
 *  2면(fillet_1_*)은 좌우 미러. 방향이 안 맞으면 null → 측면 몸통(뒤집기 유도).
 */
function pickStageSprite(
  fam: string, state: PixelFishState,
): { spr: PixelFishSprite; mirrorX: boolean; view?: 'ventral' | 'cavity' | 'dorsal' | 'belly' } | null {
  const o = state.orientation;
  if (state.finished || o === 'FLESH_UP') return null;
  if (o === 'BELLY_UP' && (state.stageId === 'gut_open' || state.stageId === 'gut_scoop')) {
    const spr = stageSpr(`${fam}_ventral`);
    return spr ? { spr, mirrorX: false, view: 'ventral' } : null;
  }
  if (o === 'BELLY_UP' && (state.stageId === 'vessel_scrub' || state.stageId === 'gut_wash')) {
    // 체강 탑뷰 우선 — 구 `{fam}_vessel`(시트 추출 측면 그림)은 "내장 꺼낸 공간을 위에서
    // 들여다보는" 뷰가 아니어서 폴백으로만 둔다 (사용자 지시 2026-07-30).
    const spr = stageSpr(`${fam}_cavity`) ?? FISH_STAGE_SPRITES[`${fam}_vessel`];
    return spr ? { spr, mirrorX: false, view: 'cavity' } : null;
  }
  // ── 장뜨기 — 등/배를 카메라 쪽으로 눕힌 뷰 + 칼집 벌어짐 단계 ──
  //  등쪽(BACK_DOWN) = `{fam}_dorsal0~3`(머리 우) / 배쪽(BELLY_UP) = `{fam}_belly0~3`(꼬리 우).
  //  단계 = 칼집 회차(strokesDone) — 0 닫힘 / 1 붉은 살 조금 / 2 뼈 노출 / 3 반대쪽까지.
  //  스테이지가 넘어간 직후엔 호출측이 openOverride로 마지막 벌어짐을 잠시 유지한다.
  const ov = state.openOverride;
  const isFillet = !!state.stageId?.startsWith('fillet_');
  if (ov || isFillet) {
    const sever = ov ? ov.view === 'belly' : !!state.stageId?.endsWith('_sever');
    // 방향이 아직 안 맞으면 뷰를 바꾸지 않는다 — 현재 자세(측면)를 보여주고 뒤집기를 유도
    const oriOk = !!ov || (sever ? o === 'BELLY_UP' : o === 'BACK_DOWN');
    if (!oriOk) return null;
    const view = sever ? 'belly' : 'dorsal';
    const n = ov ? ov.state : Math.min(3, state.strokesDone ?? 0);
    const spr = stageSpr(`${fam}_${view}${n}`) ?? stageSpr(`${fam}_fillet${Math.max(1, n)}`);
    // 2면(fillet_1)은 반대쪽 살 — 좌우 미러로 구분
    const mirrorX = (state.stageId ?? '').startsWith('fillet_1');
    return spr ? { spr, mirrorX, view } : null;
  }
  return null;
}

export interface PixelFishState {
  orientation: OrientationState;
  headOff: boolean;
  /** 지느러미 제거 완료 (finectomy) — 몸통 스프라이트 분기 */
  finsOff?: boolean;
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
  /**
   * 장뜨기 벌어짐 강제 표시 — 칼질 성공 직후 스테이지가 넘어가도 마지막 벌어짐을
   * 연출 동안 유지하기 위한 오버라이드 (ButcheryPanel가 액션 애니 중에만 설정).
   */
  openOverride?: { view: 'dorsal' | 'belly'; state: number };
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
 *  BASE = 원본(머리 왼쪽) / FLIP = 좌우 미러.
 *  ⚠ 상하 미러는 쓰지 않는다 — **뱃살은 항상 아래쪽**이고, "배 위로"·"등 위로"는
 *  전용 뷰 스프라이트(복면/체강/장뜨기)로 표현한다 (사용자 지시 2026-07-30).
 */
export function drawPixelButcherFish(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom,
  tint: number | null, state: PixelFishState,
  sprites: ButcherSpriteSet = { whole: FISH_WHOLE, dressed: FISH_DRESSED, fillet: FISH_FILLET, nativeColor: false, familyKey: 'bream' },
): void {
  const o = state.orientation;

  // ── 손질 단계 스프라이트 (복면 뷰 / 체강 탑뷰 / 장뜨기 길내기 1~3) — 있으면 우선 사용 ──
  const stagePick = pickStageSprite(sprites.familyKey, state);
  if (stagePick) {
    const dr = drawSprite(g, stagePick.spr, geom, stagePick.mirrorX, false,
      sprites.nativeColor ? null : tint, 0.22);
    // 복면 뷰 — 개복 전에는 정중선을 따라 아직 부푼 배(내장) 음영, 개복 후엔 붉은 내장 노출
    if (stagePick.view === 'ventral' && !state.gutted && state.stageId === 'gut_scoop') {
      // 가른 정중선 사이로 드러난 내장 덩어리 (간·위·장) — 좁고 길게
      g.fillStyle(0x8a3040, 0.92);
      g.fillEllipse(dr.x + dr.w * 0.38, dr.y + dr.h * 0.5, dr.w * 0.26, dr.h * 0.13);
      g.fillStyle(0x6a2030, 0.92);
      g.fillEllipse(dr.x + dr.w * 0.28, dr.y + dr.h * 0.5, dr.w * 0.1, dr.h * 0.1);
      g.fillStyle(0x9c4a4a, 0.85);
      g.fillEllipse(dr.x + dr.w * 0.48, dr.y + dr.h * 0.5, dr.w * 0.09, dr.h * 0.07);
    }
    // 체강 탑뷰 — 세척 단계는 고인 피가 씻겨나간 상태 (밝은 물기 오버레이)
    if (stagePick.view === 'cavity' && state.stageId === 'gut_wash') {
      g.fillStyle(0xbfe0ff, 0.16);
      g.fillEllipse(dr.x + dr.w * 0.45, dr.y + dr.h * 0.5, dr.w * 0.7, dr.h * 0.4);
    }
    return;
  }

  const filletView = state.finished || o === 'FLESH_UP';
  const spr = filletView ? sprites.fillet : bodySpriteFor(sprites, state);
  const mirrorX = !filletView && o === 'FLIP';
  // ⚠ 상하 미러 금지 — **뱃살은 항상 아래쪽**에 오도록 배치한다 (사용자 지시 2026-07-30).
  //  "배 위로(BELLY_UP)"는 미러가 아니라 전용 복면 뷰 스프라이트로 표현한다.
  const drawn = drawSprite(g, spr, geom, mirrorX, false, tint, 0.22);

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

  // 비늘 반짝임 (비늘치기 전 — "아직 비늘이 남아 있다" 상태 표시. BASE/FLIP 측면에서만).
  //  ⚠ 구 배치는 (i*73)%100 / (i*37)%100 모듈러라 주기가 겹쳐 **점 3개가 일직선**으로 찍히는
  //  격자 아티팩트가 있었다(사용자 리포트). 황금비 무리수 산포로 교체해 균일 분포로.
  if (state.hasScales && state.scaledSides < 2 && (o === 'BASE' || o === 'FLIP')
    && !(state.scaledSides >= 1 && o === 'BASE')) {
    g.fillStyle(0xffffff, 0.3);
    const PHI = 0.6180339887, G2 = 0.7548776662;
    for (let i = 0; i < 30; i++) {
      const fx = ((i + 1) * PHI) % 1, fy = ((i + 1) * G2) % 1;
      const sx = drawn.x + drawn.w * (0.16 + fx * 0.62);
      const sy = drawn.y + drawn.h * (0.22 + fy * 0.5);
      g.fillCircle(sx, sy, 1.5);
    }
  }

  // 내장 오버레이 (BELLY_UP 개복 후·제거 전 — 복면 뷰 미보유 폴백. 뱃살 = 아래쪽)
  if (o === 'BELLY_UP' && !state.gutted && state.stageId === 'gut_scoop') {
    g.fillStyle(0x8a3040, 0.92);
    g.fillEllipse(drawn.x + drawn.w * 0.42, drawn.y + drawn.h * 0.7, drawn.w * 0.34, drawn.h * 0.2);
    g.fillStyle(0x6a2030, 0.9);
    g.fillEllipse(drawn.x + drawn.w * 0.3, drawn.y + drawn.h * 0.72, drawn.w * 0.14, drawn.h * 0.12);
  }

  // 항문 마커 (BACK_DOWN — 장뜨기 기준점. 배쪽 = 아래 가장자리)
  if (o === 'BACK_DOWN') {
    const ax = mirrorX
      ? drawn.x + drawn.w * (1 - state.anusRatio)
      : drawn.x + drawn.w * state.anusRatio;
    g.fillStyle(0xffd257, 1);
    g.fillCircle(ax, drawn.y + drawn.h * 0.9, 3.5);
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
