/**
 * @file CephalopodFish.ts
 * @description 두족류 도마 렌더러 (CEPHALOPOD_BUTCHERY_SPEC §9 — 87차 SquidLayers)
 *
 * 어류 렌더러(`PixelButcherFish`/`FishTemplateRenderer`)에 분기를 더하지 않고 **별도 렌더러**를 쓴다
 * (스펙 v2 결정 유지) — 부위 구성·뷰 전이가 통째로 다르다.
 *
 * 좌표 규약은 가이드와 동일: **다리·머리가 좌측(x=0), 외투막 끝이 우측(x≈0.95)**.
 * 랜드마크(§2.1): 팔 끝 0.00 · 팔 밑동 0.25 · 눈 0.33 · 외투막 입구 0.39 ·
 * 내장 중심 0.72 · 외투막 끝 0.95.
 *
 * ⚠ 실사/시트 도트 에셋 전 **파라메트릭 플레이스홀더**다. `docs/mockups/squid_guide.svg`가 정본이며,
 *   시트 추출 도구(`gen_ceph_stages.cjs`)가 들어오면 이 렌더러는 스프라이트 배치로 교체된다.
 */

import Phaser from 'phaser';
import type { ButcheryOrientation } from '@tra/core';
import { drawStageSprite, getStageSprite } from './PixelButcherFish.js';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';

export interface CephFishGeom { x: number; y: number; w: number; h: number }

/** 진행 상태 — 패널이 `doneStages`에서 파생해 넘긴다 (플래그 중복 보관 금지) */
export interface CephFishState {
  orientation: ButcheryOrientation;
  stageId?: string;
  /** 완료한 시메 수 (0~2) — 색소포 발색이 유백색으로 전환된다 */
  shime: number;
  opened: boolean;      // 개복 절개 완료
  spread: boolean;      // 펼침 (내장 노출)
  visceraOut: boolean;  // 내장 덩어리 분리
  penOut: boolean;      // 연골 제거
  peelProgress: number; // 껍질 박리 0~1
  skinOff: boolean;     // 껍질 완전 분리
  gillClean: boolean;   // 아가미 제거·내장면 정리
  finsOff: boolean;     // 날개 제거
  headSplit: boolean;   // 머리부 3분할
  beakOut: boolean;     // 부리 제거
  /** 진행 중 스테이지의 채움 게이지 (hold_scrub 연출) */
  fillProgress?: number;
  /** 다중 경로 스테이지에서 이미 끝낸 경로 수 (날개 2곳 — 사진 5.1 → 5.2 전환) */
  finPathsDone?: number;
  /** 손질 완료 — 결과 오버레이 뒤 도마에 최종 산출물(손질된 몸통)이 남는다 */
  finished?: boolean;
}

// ── 팔레트 (§9 — 시메 전 갈색 + 청록 발색점 / 시메 후 유백색) ──
const C = {
  liveSkin: 0xa8724c, liveSkinDark: 0x8a5a3a, chromatophore: 0x31b8a2,
  deadSkin: 0xc9b3a2, flesh: 0xe7edf1, fleshShade: 0xd2dbe2, fleshEdge: 0xb8c4cd,
  fin: 0xbfa389, finDead: 0xdccfc2,
  viscera: 0x8a7a3a, visceraDark: 0x6b5c26, ink: 0x1c1a22, gill: 0xb08a92,
  pen: 0xdfe8f2, membrane: 0xc7d2d8,
  eye: 0x101418, eyeHi: 0xf2f6fa, board: 0x000000,
} as const;

/** 정규화 → 화면 px */
function px(g: CephFishGeom, x: number, y: number): [number, number] {
  return [g.x + x * g.w, g.y + y * g.h];
}

/** 시메 진행에 따른 몸 색 — 살아있으면 갈색, 2단계 다 끝나면 유백색 */
function bodyColor(shime: number): number {
  return shime >= 2 ? C.deadSkin : shime >= 1 ? 0xb98a68 : C.liveSkin;
}

/** 외투막(몸통) 튜브 — 입구(0.39)에서 끝(0.95)으로 좁아지는 원뿔형 */
function mantlePolygon(g: CephFishGeom, half = 0.19): Phaser.Types.Math.Vector2Like[] {
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {                       // 위쪽 윤곽 (입구 → 끝)
    const t = i / N, x = 0.39 + t * 0.56;
    const [sx, sy] = px(g, x, 0.5 - half * (1 - t * t * 0.92));
    pts.push({ x: sx, y: sy });
  }
  for (let i = N; i >= 0; i--) {                       // 아래쪽 윤곽 (끝 → 입구)
    const t = i / N, x = 0.39 + t * 0.56;
    const [sx, sy] = px(g, x, 0.5 + half * (1 - t * t * 0.92));
    pts.push({ x: sx, y: sy });
  }
  return pts;
}

/** 날개(지느러미) — 외투막 후반 양측의 마름모 */
function drawFins(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, color: number): void {
  for (const s of [-1, 1]) {
    const [ax, ay] = px(geom, 0.52, 0.5 + s * 0.17);
    const [bx, by] = px(geom, 0.74, 0.5 + s * 0.31);
    const [cx, cy] = px(geom, 0.94, 0.5 + s * 0.10);
    g.fillStyle(color, 1);
    g.fillPoints([{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }], true);
  }
}

/** 팔 8개 + 촉완 2가닥 — 좌측으로 뻗는다 */
function drawArms(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, color: number): void {
  g.lineStyle(Math.max(2, geom.h * 0.022), color, 1);
  for (let i = 0; i < 8; i++) {
    const spread = (i / 7 - 0.5) * 0.30;
    const [bx, by] = px(geom, 0.25, 0.5 + spread * 0.35);
    const [mx, my] = px(geom, 0.13, 0.5 + spread * 0.85);
    const [tx, ty] = px(geom, 0.03, 0.5 + spread);
    g.beginPath(); g.moveTo(bx, by); g.lineTo(mx, my); g.lineTo(tx, ty); g.strokePath();
  }
  // 촉완 2가닥 — 더 길고 가늘다
  g.lineStyle(Math.max(1.5, geom.h * 0.016), color, 0.9);
  for (const s of [-1, 1]) {
    const [bx, by] = px(geom, 0.25, 0.5 + s * 0.03);
    const [tx, ty] = px(geom, 0.00, 0.5 + s * 0.09);
    g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.strokePath();
  }
}

/** 머리 + 눈 — 팔 밑동(0.25)과 외투막 입구(0.39) 사이 */
function drawHead(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, color: number): void {
  const [hx, hy] = px(geom, 0.32, 0.5);
  g.fillStyle(color, 1);
  g.fillEllipse(hx, hy, geom.w * 0.15, geom.h * 0.30);
  for (const s of [-1, 1]) {
    const [ex, ey] = px(geom, 0.33, 0.5 + s * 0.11);
    g.fillStyle(C.eye, 1);
    g.fillEllipse(ex, ey, geom.w * 0.035, geom.h * 0.10);
    g.fillStyle(C.eyeHi, 0.85);
    g.fillEllipse(ex - geom.w * 0.006, ey - geom.h * 0.02, geom.w * 0.012, geom.h * 0.035);
  }
}

/** 색소포 발색점 — 등쪽 2줄. 시메가 진행될수록 사라진다 */
function drawChromatophores(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, shime: number): void {
  const alpha = Math.max(0, 1 - shime * 0.5);
  if (alpha <= 0.02) return;
  g.fillStyle(C.chromatophore, alpha * 0.75);
  const PHI = 0.6180339887;
  for (let i = 0; i < 26; i++) {
    const t = ((i + 1) * PHI) % 1;
    const x = 0.42 + t * 0.50;
    const row = i % 2 === 0 ? -0.07 : 0.06;
    const [sx, sy] = px(geom, x, 0.5 + row);
    g.fillCircle(sx, sy, Math.max(1.2, geom.h * 0.014));
  }
}

/** 통몸통 뷰 (CEPH_DORSAL / CEPH_VENTRAL) */
function drawWhole(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, st: CephFishState): void {
  const body = bodyColor(st.shime);
  const ventral = st.orientation === 'CEPH_VENTRAL';
  drawFins(g, geom, st.shime >= 2 ? C.finDead : C.fin);
  g.fillStyle(body, 1);
  g.fillPoints(mantlePolygon(geom), true);
  // 배(누두) 면 — 밝고 매끈하다 / 등면 — 발색점이 있다
  if (ventral) {
    g.fillStyle(0xffffff, 0.16);
    const [fx, fy] = px(geom, 0.45, 0.5);
    g.fillEllipse(fx, fy, geom.w * 0.09, geom.h * 0.16);   // 누두(깔때기)
    g.lineStyle(Math.max(1, geom.h * 0.01), C.liveSkinDark, 0.5);
    const [ax, ay] = px(geom, 0.39, 0.5); const [bx, by] = px(geom, 0.95, 0.5);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.strokePath();  // 절개 예정선
  } else {
    drawChromatophores(g, geom, st.shime);
  }
  drawHead(g, geom, body);
  drawArms(g, geom, body);
}

/** 펼친 시트 윤곽 — 개복 후 몸통이 평평하게 열린 상태 */
function sheetPolygon(geom: CephFishGeom): Phaser.Types.Math.Vector2Like[] {
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = 0.39 + t * 0.56;
    const [sx, sy] = px(geom, x, 0.5 - 0.34 * (1 - t * t * 0.7));
    pts.push({ x: sx, y: sy });
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N, x = 0.39 + t * 0.56;
    const [sx, sy] = px(geom, x, 0.5 + 0.34 * (1 - t * t * 0.7));
    pts.push({ x: sx, y: sy });
  }
  return pts;
}

/** 펼친 뷰 (CEPH_OPEN / CEPH_SKIN_UP / CEPH_FLESH_UP) */
function drawSheet(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, st: CephFishState): void {
  const o = st.orientation;
  const skinUp = o === 'CEPH_SKIN_UP';
  if (!st.finsOff) drawFins(g, geom, st.skinOff ? C.finDead : C.fin);

  // 시트 본체 — 껍질면이면 어두운 겉면, 아니면 유백색 살
  g.fillStyle(skinUp && !st.skinOff ? bodyColor(2) : C.flesh, 1);
  g.fillPoints(sheetPolygon(geom), true);

  if (skinUp) {
    // 박리 진행 — 껍질이 우(몸통 끝)에서 좌(머리)로 벗겨진다.
    //  ⚠ 두 조각이 **분리돼 보이면 안 된다** — 박리선에서 이어져 있어야 "벗기는 중"이 읽힌다 (§9)
    const p = Math.max(0, Math.min(1, st.peelProgress));
    if (p > 0.01) {
      const lineX = 0.92 - p * 0.50;
      g.fillStyle(C.flesh, 1);                                  // 드러난 살
      const [rx, ry] = px(geom, lineX, 0.5);
      g.fillRect(rx, ry - geom.h * 0.32, (0.95 - lineX) * geom.w, geom.h * 0.64);
      g.fillStyle(C.liveSkinDark, 0.95);                        // 말려 올라간 껍질 롤
      g.fillEllipse(rx, ry, geom.w * 0.035, geom.h * 0.60);
      g.lineStyle(Math.max(1.5, geom.h * 0.016), 0x6b4a30, 0.9);
      g.beginPath(); g.moveTo(rx, ry - geom.h * 0.31); g.lineTo(rx, ry + geom.h * 0.31); g.strokePath();
    }
  } else {
    // 내장면 — 중심선 연골 + 내장 덩어리 + 아가미
    if (!st.penOut && o === 'CEPH_OPEN') {
      g.fillStyle(C.pen, 0.85);
      const [ax, ay] = px(geom, 0.44, 0.5);
      g.fillRect(ax, ay - geom.h * 0.018, geom.w * 0.50, geom.h * 0.036);
    }
    if (!st.visceraOut && o === 'CEPH_OPEN') {
      const [vx, vy] = px(geom, 0.70, 0.5);
      g.fillStyle(C.viscera, 0.95); g.fillEllipse(vx, vy, geom.w * 0.20, geom.h * 0.30);
      g.fillStyle(C.visceraDark, 0.9); g.fillEllipse(vx - geom.w * 0.05, vy, geom.w * 0.09, geom.h * 0.17);
      g.fillStyle(C.ink, 0.95);
      const [ix, iy] = px(geom, 0.58, 0.53);
      g.fillEllipse(ix, iy, geom.w * 0.055, geom.h * 0.13);      // 먹물주머니
    }
    if (!st.gillClean) {
      g.fillStyle(C.gill, 0.85);
      for (const s of [-1, 1]) {
        const [gx, gy] = px(geom, 0.52, 0.5 + s * 0.18);
        g.fillEllipse(gx, gy, geom.w * 0.10, geom.h * 0.09);
      }
      if (o === 'CEPH_FLESH_UP') {                               // 잔막 — 문지르면 걷힌다
        const left = 1 - Math.max(0, Math.min(1, st.fillProgress ?? 0));
        g.fillStyle(C.membrane, 0.30 * left);
        const [mx, my] = px(geom, 0.67, 0.5);
        g.fillEllipse(mx, my, geom.w * 0.48, geom.h * 0.54);
      }
    }
    // 살결 — 세로 결
    g.lineStyle(1, C.fleshShade, 0.35);
    for (let i = 1; i < 7; i++) {
      const x = 0.45 + i * 0.07;
      const [sx, sy] = px(geom, x, 0.5);
      g.beginPath(); g.moveTo(sx, sy - geom.h * 0.24); g.lineTo(sx, sy + geom.h * 0.24); g.strokePath();
    }
  }
  g.lineStyle(Math.max(1, geom.h * 0.012), C.fleshEdge, 0.8);
  g.strokePoints(sheetPolygon(geom), true, true);

  // 개복 전이면 머리·팔이 아직 붙어 있다
  if (!st.visceraOut) { drawHead(g, geom, bodyColor(st.shime)); drawArms(g, geom, bodyColor(st.shime)); }
}

/**
 * 분리 덩어리 배치 (CEPH_PARTS) — 상단 1덩어리 / 구분선 / 하단 2덩어리 그리드 고정 (§9).
 * 진행 단계에 따라 놓이는 덩어리가 달라진다.
 */
function drawParts(g: Phaser.GameObjects.Graphics, geom: CephFishGeom, st: CephFishState): void {
  const chunk = (cx: number, cy: number, w: number, h: number, color: number): void => {
    const [sx, sy] = px(geom, cx, cy);
    g.fillStyle(color, 1);
    g.fillEllipse(sx, sy, geom.w * w, geom.h * h);
    g.lineStyle(1, 0x000000, 0.25);
    g.strokeEllipse(sx, sy, geom.w * w, geom.h * h);
  };

  if (st.headSplit) {
    // 3분할 결과 — 다리 / 머리 / 먹물주머니
    chunk(0.20, 0.50, 0.16, 0.40, bodyColor(2));
    drawArms(g, { ...geom, x: geom.x - geom.w * 0.06 }, bodyColor(2));
    chunk(0.46, 0.50, 0.12, 0.30, bodyColor(2));
    chunk(0.70, 0.50, 0.09, 0.22, C.ink);
    if (!st.beakOut) {                                     // 다리 밑동 가운데 부리
      const [bx, by] = px(geom, 0.22, 0.50);
      g.fillStyle(C.ink, 1); g.fillCircle(bx, by, Math.max(3, geom.h * 0.05));
    }
  } else if (st.skinOff && !st.gillClean) {
    // 껍질 분리 완료 — 껍질 / 몸통 순살
    chunk(0.30, 0.50, 0.20, 0.34, C.liveSkinDark);
    chunk(0.68, 0.50, 0.26, 0.42, C.flesh);
  } else {
    // 머리+다리+내장 덩어리 (분리 결과 확인)
    chunk(0.60, 0.50, 0.22, 0.36, C.viscera);
    chunk(0.36, 0.50, 0.13, 0.28, bodyColor(2));
    drawArms(g, { ...geom, x: geom.x - geom.w * 0.10 }, bodyColor(2));
    const [ix, iy] = px(geom, 0.72, 0.56);
    g.fillStyle(C.ink, 0.95); g.fillEllipse(ix, iy, geom.w * 0.06, geom.h * 0.14);
  }
}

/**
 * ── 스테이지 → 실사 도트 스프라이트 (무늬오징어) ─────────────────────────────
 * 원본은 `food assets/butchery/reference/cephalopod/`의 공정 순서 사진 11장이며,
 * `pixelize_butchery.cjs`가 `squid_*` 키로 구워 `FISH_STAGE_SPRITES`에 넣는다.
 *
 * 방향 규약(굽는 시점에 정규화됨): **다리·외투막 입구 = 왼쪽 / 외투막 끝 = 오른쪽**.
 * 세로로 찍힌 원본은 파이프라인 `ROTATE_KEYS`가 cw로 눕혀 이 규약에 맞춘다.
 *
 * 사진 11장 < 스테이지 14개라 일부는 공유한다:
 *  - `squid_spread`  = 펼치기·내장 분리 (한 장면의 두 동작)
 *  - `squid_headmass`= 분리 결과 확인 · 머리부 3분할 · 부리 (모두 같은 덩어리가 피사체)
 *  - `ceph_fin_off`  = 날개 2곳이라 완료한 경로 수로 `squid_fin1`→`squid_fin2` 전환
 *
 * ⚠ 사진이 없는 상태 2개는 **가장 가까운 장면으로 대체**했다 (사용자 확인 대상):
 *  - `ceph_skin_done`(껍질 분리 완료) → 박리 직후라 `squid_skin_pull` 연속 사용
 *  - `ceph_gill_wash`(아가미 제거·닦기) → 결과 사진 `squid_clean`(사진 6)
 */
const SQUID_STAGE_SPRITE: Record<string, string> = {
  ceph_shime_mantle: 'squid_whole',      // 0. 원물 (손질대기)
  ceph_shime_arms: 'squid_shime1',       // 1.1 갑–눈 사이 절단 완료
  ceph_mantle_open: 'squid_shime2',      // 1.2 눈–다리 사이 절단 완료
  // 펼치기·분리 결과 확인 스테이지는 제거됨(사용자 지시 2026-08-11) — 개복 완료 즉시
  // 펼쳐진 화면(2.1)에서 내장 분리 가이드가 뜬다. 결과는 부산물 팝업이 대신 보여준다.
  ceph_viscera_pull: 'squid_spread',     // 2.1 펼쳐진 화면에서 내장을 떼어낸다
  ceph_pen_out: 'squid_pen',             // 2.2 가운데 연골 노출
  ceph_flip_skin: 'squid_skin_grip',     // 4.1 오른쪽 → 왼쪽 잡아뜯기
  ceph_skin_peel: 'squid_skin_pull',     // 4.2 위쪽 → 아래쪽 잡아뜯기
  ceph_skin_done: 'squid_skin_pull',     // ⚠ 전용 사진 없음
  ceph_gill_wash: 'squid_clean',         // 6.  아가미 제거 · 내장면 닦기 완료
  ceph_fin_off: 'squid_fin1',            // 5.1 → (1곳 완료 시) 5.2
  ceph_head_split: 'squid_headmass',     // 3.  덩어리를 3조각으로 가른다
  ceph_beak_out: 'squid_headmass',       // 3.  다리 밑동에서 부리를 뽑는다
};

/** 스테이지 → 스프라이트 키 (다중 경로 스테이지는 진행도로 분기) */
function squidSpriteKey(st: CephStageRef): string | undefined {
  // 손질 완료 = **최종 산출물**을 도마에 남긴다 — 어류가 `pure_fillet_{fam}`(순수 필렛)을
  //  남기는 것과 같은 규칙(69·84차). 두족류의 대응물은 손질 끝난 몸통 = 사진 6.
  //  ⚠ 완료 시점엔 `stage`가 없어서 이 분기가 없으면 파라메트릭 폴백("구 픽셀 이미지")이 뜬다.
  if (st.finished) return 'squid_clean';
  const id = st.stageId;
  if (!id) return undefined;
  if (id === 'ceph_fin_off') return (st.finPathsDone ?? 0) >= 1 ? 'squid_fin2' : 'squid_fin1';
  return SQUID_STAGE_SPRITE[id];
}

/** 스프라이트 선택에 필요한 최소 정보 — 패널이 좌표계 산출에 쓴다 */
export interface CephStageRef { stageId?: string; finPathsDone?: number; finished?: boolean }

/** 현재 스테이지의 실사 스프라이트 (없으면 undefined = 파라메트릭 폴백) */
export function cephStageSprite(ref: CephStageRef): PixelFishSprite | undefined {
  const key = squidSpriteKey(ref);
  return key ? getStageSprite(key) : undefined;
}

/**
 * 도마 rect 안에서 스프라이트가 **실제로 차지하는 rect** (비율 유지·중앙).
 *
 * 유도선·입력·F9 핸들의 정규화 기준이 이 rect다 — 도마 전체가 아니라 **피사체 기준**이라야
 * ① 세로로 긴 뷰(연골·완료 등 128x127급)가 도마 밖으로 삐져나가지 않고
 * ② 좌표 0~1이 오징어 몸 전체에 대응하며
 * ③ `tolerance`(정규화 단위)가 뷰마다 다른 의미가 되지 않는다.
 */
export function cephFitRect(geom: CephFishGeom, spr: PixelFishSprite): CephFishGeom {
  const cell = Math.min(geom.w / spr.w, geom.h / spr.h);
  const dw = spr.w * cell, dh = spr.h * cell;
  return { x: geom.x + (geom.w - dw) / 2, y: geom.y + (geom.h - dh) / 2, w: dw, h: dh };
}

/** 두족류 도마 렌더 — 실사 도트가 있으면 그것, 없으면 파라메트릭 폴백 */
export function drawCephalopodFish(
  g: Phaser.GameObjects.Graphics, geom: CephFishGeom, state: CephFishState,
): void {
  // ── 실사 도트 우선 (사진이 곧 그 단계의 도마 그림이다 — 사용자 지시 2026-08-10) ──
  const spr = cephStageSprite(state);
  if (spr) {
    const fit = cephFitRect(geom, spr);
    drawStageSprite(g, spr, geom);
    // 사진에 담기지 않는 **진행 상태**만 위에 얹는다 (닦기 게이지 등)
    drawProgressOverlay(g, fit, state);
    return;
  }
  switch (state.orientation) {
    case 'CEPH_PARTS': drawParts(g, geom, state); return;
    case 'CEPH_OPEN': case 'CEPH_SKIN_UP': case 'CEPH_FLESH_UP': drawSheet(g, geom, state); return;
    default: drawWhole(g, geom, state); return;
  }
}

/**
 * 실사 위 진행 오버레이 — 사진 1장으로는 표현되지 않는 **중간 진행**만 그린다.
 * (스프라이트 교체로 표현되는 상태는 여기서 다시 그리지 않는다 — 이중 표기 금지.)
 */
function drawProgressOverlay(
  g: Phaser.GameObjects.Graphics, geom: CephFishGeom, st: CephFishState,
): void {
  // 내장면 닦기 — 남은 잔막이 문지를수록 걷힌다
  if (st.stageId === 'ceph_gill_wash' && !st.gillClean) {
    const left = 1 - Math.max(0, Math.min(1, st.fillProgress ?? 0));
    if (left > 0.02) {
      g.fillStyle(C.membrane, 0.34 * left);
      const [mx, my] = px(geom, 0.55, 0.5);
      g.fillEllipse(mx, my, geom.w * 0.62, geom.h * 0.58);
    }
  }
}

/** 뷰 라벨 — 사이드바 방향 표기 (어류 `ORIENTATION_LABEL`의 두족류판) */
export const CEPH_VIEW_LABEL: Record<string, string> = {
  CEPH_DORSAL: '등면 위 (통몸통)',
  CEPH_VENTRAL: '배면 위 (통몸통 — 절개면)',
  CEPH_OPEN: '펼친 시트 (내장면)',
  CEPH_SKIN_UP: '펼친 시트 (껍질면 위)',
  CEPH_FLESH_UP: '펼친 시트 (살코기면 위)',
  CEPH_PARTS: '분리 덩어리 (도마 배치)',
};

/** 두족류 뷰인가 — 어류 렌더 경로와 갈라내는 판정 */
export function isCephView(o: ButcheryOrientation): boolean {
  return typeof o === 'string' && (o.startsWith('CEPH_') || o.startsWith('OCTO_'));
}
