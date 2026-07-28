/**
 * @file FishTemplateRenderer.ts
 * @description 파라메트릭 생선 템플릿 공용 렌더러 (도마 프리뷰·드래그 고스트·회뜨기 미니게임 공유)
 *
 * 어종×방향×단계 스프라이트 폭발을 막기 위해 템플릿 1종(원형/납작)에
 * ButcheryProfile(체형·비늘·항문 위치)과 렌더 상태(방향·머리분리·비늘·개복·필렛)를
 * 주입해 변형한다. ButcheryPanel.drawFish의 파라메트릭 로직을 이 모듈로 추출해
 * 회뜨기 미니게임과 도마/고스트 프리뷰가 같은 소스를 쓴다.
 *
 * 실사 이미지(iconTexture)가 있으면 프리뷰는 실사를 우선(makeFishPreview),
 * 미니게임 컷 판정은 정규화 가이드 좌표로 이미지 종류와 무관하게 동작한다.
 */

import Phaser from 'phaser';
import { getButcheryProfile, ButcheryProfile, OrientationState } from '@tra/core';
import { resolveFishTexture } from '../data/FishTextures.js';

/** 어종별 몸통 팔레트 (파라메트릭 템플릿 주입값) */
export const FISH_COLORS: Record<string, { body: number; belly: number; fin: number }> = {
  black_seabream: { body: 0x4a5560, belly: 0xb8bec6, fin: 0x333a44 },
  largescale_blackfish: { body: 0x2e3a46, belly: 0x9aa6b0, fin: 0x1e2830 },
  longtail_blackfish: { body: 0x35506a, belly: 0xa8c0d4, fin: 0x24384e },
  flatfish: { body: 0x6a5a3e, belly: 0xd8cdb4, fin: 0x4a3f2c },
  flounder: { body: 0x6a5a3e, belly: 0xd8cdb4, fin: 0x4a3f2c },
  sea_bass: { body: 0x5a6a74, belly: 0xc6d0d6, fin: 0x3e4c56 },
  yellowtail: { body: 0x3e5a74, belly: 0xc0ccd4, fin: 0x2c4256 },
  amberjack: { body: 0x466a80, belly: 0xc8d2d8, fin: 0x2c4a5e },
  greater_amberjack: { body: 0x5a6a5a, belly: 0xd0d4c4, fin: 0x3e4a3a },
  red_seabream: { body: 0xb85a54, belly: 0xecc4bc, fin: 0x8a3a38 },
  spanish_mackerel: { body: 0x4a6470, belly: 0xc4d0d6, fin: 0x30464e },
  chub_mackerel: { body: 0x33505e, belly: 0xc0ccd0, fin: 0x203640 },
  horse_mackerel: { body: 0x6a7c82, belly: 0xd2dade, fin: 0x4a5c62 },
  stone_beakperch: { body: 0x8a8a7a, belly: 0xd8d6c4, fin: 0x3a3a30 },
  spotted_knifejaw: { body: 0x6a6a60, belly: 0xcaccbe, fin: 0x2e2e28 },
  dark_banded_rockfish: { body: 0x6a4a4a, belly: 0xc8b4ac, fin: 0x442e2e },
  blue_rockfish: { body: 0x3a4a68, belly: 0xb4c0d0, fin: 0x263048 },
  golden_rockfish: { body: 0x8a6a3a, belly: 0xd8c49a, fin: 0x5e4622 },
  black_rockfish: { body: 0x40484e, belly: 0xb8c0c4, fin: 0x282e32 },
  filefish: { body: 0x7a7050, belly: 0xcac2a0, fin: 0x4e4632 },
  pacific_cod: { body: 0x8a8474, belly: 0xd6d2c0, fin: 0x5a564a },
  hairtail: { body: 0xb8bcc4, belly: 0xe8ecf2, fin: 0x8a8e96 },
  striped_mullet: { body: 0x5e6a6e, belly: 0xccd2d4, fin: 0x40484c },
  redlip_mullet: { body: 0x64706a, belly: 0xcfd6cc, fin: 0x444c46 },
};
export const DEFAULT_FISH_COLORS = { body: 0x50606c, belly: 0xbcc6cc, fin: 0x38444e };

export function getFishColors(speciesId: string): { body: number; belly: number; fin: number } {
  return FISH_COLORS[speciesId] ?? DEFAULT_FISH_COLORS;
}

/** 파라메트릭 생선 렌더 상태 (FSM 진행 반영 — 프리뷰는 기본값으로 온전한 BASE 생선) */
export interface FishRenderState {
  orientation: OrientationState;
  headOff: boolean;
  scaledSides: number;
  gutted: boolean;
  finished: boolean;
  filletCount: number;
  currentPullsLeft: number;
  stagePrimitive?: string;
  stageId?: string;
}

/** 온전한 생선(BASE·미손질) 프리뷰용 기본 상태 */
export const INTACT_FISH_STATE: FishRenderState = {
  orientation: 'BASE', headOff: false, scaledSides: 0, gutted: false,
  finished: false, filletCount: 2, currentPullsLeft: 0,
};

export interface FishTemplateGeom { x: number; y: number; w: number; h: number; }

/**
 * 파라메트릭 생선 1마리를 Graphics에 그린다 (도마 배경은 그리지 않음 — 호출부 책임).
 * ButcheryPanel.drawFish의 본체 로직과 동일 — 회귀 없이 공유.
 *
 * 납작형(flat)은 원형보다 몸통을 넓게(bodyW↑) + 눈을 위쪽으로 편위해 시각적으로 구분한다.
 */
export function drawFishTemplate(
  g: Phaser.GameObjects.Graphics,
  geom: FishTemplateGeom,
  profile: Pick<ButcheryProfile, 'bodyShape' | 'bodyRatio' | 'hasScales' | 'anusRatio'>,
  colors: { body: number; belly: number; fin: number },
  state: FishRenderState,
): void {
  const o = state.orientation;
  const flat = profile.bodyShape === 'flat';
  const { x: X, y: Y, w: W, h: H } = geom;
  const cx = X + W / 2, cy = Y + H / 2;
  // 체고/체장 비(bodyRatio)로 몸통 높이 변형 — 방어는 길쭉·낮게, 쥐치는 통통·높게
  const bodyH = H * (flat ? 0.72 : Math.max(0.35, Math.min(0.72, 0.34 + profile.bodyRatio * 0.55)));
  // 납작형은 좌우로 더 넓게(광어 몸통) — 원형은 표준 폭
  const bodyW = W * (flat ? 0.84 : 0.74);
  // 납작형 눈 위쪽 편위 (광어=눈이 몸 위쪽 한 면에 몰림)
  const eyeYOff = flat ? -bodyH * 0.30 : -bodyH * 0.16;

  if (state.finished || o === 'FLESH_UP') {
    // 필렛 뷰 — 분홍 살 슬랩 + 줄무늬 (+박피 전 껍질층)
    g.fillStyle(0xf0a0a0, 1);
    g.fillRoundedRect(X + W * 0.1, cy - bodyH * 0.3, W * 0.8, bodyH * 0.6, 18);
    g.lineStyle(1.4, 0xffffff, 0.5);
    for (let i = 1; i <= 5; i++) {
      const sx = X + W * (0.14 + i * 0.12);
      g.lineBetween(sx, cy - bodyH * 0.22, sx - W * 0.05, cy + bodyH * 0.22);
    }
    if (!state.finished && state.currentPullsLeft > 0) {
      // 남은 껍질층 (아래 어두운 띠) + 꼬리 손잡이
      g.fillStyle(colors.body, 0.95);
      g.fillRoundedRect(X + W * 0.1, cy + bodyH * 0.18, W * 0.8, bodyH * 0.14, 8);
      g.fillStyle(0x3a2c1e, 1);
      g.fillRoundedRect(X + W * 0.86, cy - bodyH * 0.1, W * 0.07, bodyH * 0.34, 5);
    }
    return;
  }

  const mirror = o === 'FLIP';
  const headX = mirror ? X + W * 0.92 : X + W * 0.08;
  const tailX = mirror ? X + W * 0.06 : X + W * 0.94;
  const dir = mirror ? -1 : 1;

  // 몸통
  g.fillStyle(colors.body, 1);
  g.fillEllipse(cx, cy, bodyW, bodyH);
  // 배/등 밴드 (방향별)
  g.fillStyle(colors.belly, 0.9);
  if (o === 'BELLY_UP') g.fillEllipse(cx, cy - bodyH * 0.22, bodyW * 0.9, bodyH * 0.34);
  else if (o === 'BACK_DOWN') g.fillEllipse(cx, cy - bodyH * 0.1, bodyW * 0.9, bodyH * 0.5);
  else g.fillEllipse(cx, cy + bodyH * 0.18, bodyW * 0.9, bodyH * 0.4);

  // 꼬리
  g.fillStyle(colors.fin, 1);
  g.fillTriangle(tailX, cy, tailX + dir * -W * 0.0, cy, tailX + dir * W * 0.06, cy - bodyH * 0.34);
  g.fillTriangle(tailX, cy, tailX + dir * W * 0.06, cy + bodyH * 0.34, tailX + dir * W * 0.02, cy);

  // 머리/눈/아가미 (BASE·FLIP에서만, 머리 분리 전)
  if (!state.headOff && (o === 'BASE' || o === 'FLIP')) {
    g.fillStyle(colors.body, 1);
    g.fillEllipse(headX + dir * W * 0.05, cy, W * 0.2, bodyH * 0.8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(headX + dir * W * 0.03, cy + eyeYOff, 7);
    g.fillStyle(0x111418, 1);
    g.fillCircle(headX + dir * W * 0.035, cy + eyeYOff, 3.6);
    g.lineStyle(2, colors.fin, 0.9);
    g.beginPath();
    g.arc(headX + dir * W * 0.1, cy, bodyH * 0.34, mirror ? Math.PI * 0.6 : -Math.PI * 0.4, mirror ? Math.PI * 1.4 : Math.PI * 0.4);
    g.strokePath();
  } else if (state.headOff && (o === 'BASE' || o === 'FLIP')) {
    // 머리 분리 단면
    g.fillStyle(0xd87878, 1);
    g.fillEllipse(headX + dir * W * 0.08, cy, W * 0.035, bodyH * 0.66);
  }

  // 비늘 오버레이 (제거 전 반짝임 점)
  const needScale = profile.hasScales && state.scaledSides < 2 && (o === 'BASE' || o === 'FLIP');
  if (needScale && !(state.scaledSides >= 1 && o === 'BASE')) {
    g.fillStyle(0xe8f0f6, 0.5);
    for (let i = 0; i < 40; i++) {
      const sx = cx + (((i * 73) % 100) / 100 - 0.5) * bodyW * 0.8;
      const sy = cy + (((i * 37) % 100) / 100 - 0.5) * bodyH * 0.7;
      g.fillCircle(sx, sy, 2);
    }
  }

  // 내장 오버레이 (BELLY_UP, 개복 후·제거 전)
  if (o === 'BELLY_UP' && !state.gutted && state.stageId === 'gut_scoop') {
    g.fillStyle(0x8a3040, 0.9);
    g.fillEllipse(cx - W * 0.08, cy - bodyH * 0.2, W * 0.3, bodyH * 0.24);
  }

  // 항문 마커 (BACK_DOWN — 위쪽)
  if (o === 'BACK_DOWN') {
    g.fillStyle(0xffd257, 1);
    g.fillCircle(X + W * profile.anusRatio, cy - bodyH * 0.42, 3.5);
  }
}

/**
 * 도마/드래그 고스트용 생선 프리뷰 컨테이너.
 * 실사 iconTexture가 있으면 실사 이미지, 없으면 파라메트릭 템플릿을 box에 맞춰 그린다.
 * 반환 컨테이너는 setPosition/setAlpha/setScrollFactor로 조작 가능(고스트·도마 공용).
 */
export function makeFishPreview(
  scene: Phaser.Scene,
  opts: { speciesId?: string; iconTexture?: string; boxW: number; boxH: number; cx?: number; cy?: number },
): Phaser.GameObjects.Container {
  const { speciesId, iconTexture, boxW, boxH } = opts;
  const c = scene.add.container(opts.cx ?? 0, opts.cy ?? 0);

  // 실사 이미지: iconTexture 우선, 없으면 speciesId로 폴백 해소 (구세이브 어획물도 실사 표시)
  let texKey = iconTexture && scene.textures.exists(iconTexture) ? iconTexture : undefined;
  if (!texKey && speciesId) {
    const r = resolveFishTexture(speciesId, 0, 'F');
    if (r && scene.textures.exists(r)) texKey = r;
  }
  if (texKey) {
    const src = scene.textures.get(texKey).getSourceImage() as HTMLImageElement;
    const sc = Math.min(boxW / src.width, boxH / src.height);
    c.add(scene.add.image(0, 0, texKey).setDisplaySize(src.width * sc, src.height * sc));
    return c;
  }

  // 파라메트릭 폴백 — box 중심 기준으로 그린다
  const profile = getButcheryProfile(speciesId ?? 'default');
  const g = scene.add.graphics();
  drawFishTemplate(g, { x: -boxW / 2, y: -boxH / 2, w: boxW, h: boxH }, profile,
    getFishColors(speciesId ?? 'default'), INTACT_FISH_STATE);
  c.add(g);
  return c;
}
