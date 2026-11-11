/**
 * EelBoard — 장어류 손질 도마 그림 (315차).
 *
 * 사용자 지시(2026-11-11): 「장어류 손질 … 도마 위에서 구현할 때 형태(UI)적으로 오류가 없도록 실제와 유사한 모습으로」.
 *  - 그림은 `tools/gen_eel_views.cjs`가 구운 층(`PixelEelViews`) — 유도선(core `EEL_GUIDE`)과 같은 몸 윤곽이다.
 *  - 진행 상태는 완료 단계에서 파생한다(손질 창 `eelState`): 송곳 → 점액 → 가르기(칼자국) → 펼치기(측면 → 펼친 살)
 *    → 내장 · 중골 · 지느러미(위 · 아래 따로) · 머리가 차례로 빠지고, 갯장어는 뼈끊기 자국 · 먹장어는 껍질이 벗겨진다.
 *  - 뒤집기 · 회전이 없다 — 송곳으로 머리를 도마에 박은 채 한 자리에서 끝난다.
 * 결과물 그림(포 · 머리 · 뼈)도 같은 층에서 굽는다(`ensureEelTrimTexture`).
 */
import Phaser from 'phaser';
import type { CutPoint } from '@tra/core';
import { EEL_VIEWS, type EelLayerKey } from '../data/PixelEelViews.js';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/** 도마 위 장어 한 마리의 지금 모습 */
export interface EelBoardState {
  speciesId: string;
  /** 송곳 자리(도마 틀 정규화) — 박았으면 그린다 */
  pinPoint?: CutPoint;
  pinned: boolean;
  /** 점액 빼기 — 소금이 훑고 간 자리(정규화) */
  saltPts?: CutPoint[];
  /** 가른 칼자국(펼치기 전 측면에 남는 선) */
  cutPath?: CutPoint[];
  /** 펼쳤는가 — 측면 → 펼친 살 */
  spread: boolean;
  /** 먹장어 껍질 벗긴 정도 0~1 + 벗기는 구간(칸 x — 목 → 꼬리) */
  skinT: number;
  skinFromCell?: number;
  skinToCell?: number;
  gutted: boolean;
  boned: boolean;
  finTopOff: boolean;
  finBotOff: boolean;
  headOff: boolean;
  /** 뼈끊기 — 끝낸 칼집 선들 · 다 끝났으면 자국 층 */
  marks: CutPoint[][];
  marksAll: boolean;
}

/** 층 하나를 도마 틀(geom) 안에 칸 단위로 칠한다 — clip = 칸 x 범위(포함) */
function paintLayer(
  g: Phaser.GameObjects.Graphics, spr: PixelFishSprite | undefined, ox: number, oy: number, cell: number,
  clip?: [number, number],
): void {
  if (!spr) return;
  for (let y = 0; y < spr.h; y++) {
    const row = spr.rows[y];
    let x = 0;
    while (x < spr.w) {
      const ch = row[x];
      if (ch === '.' || (clip && (x < clip[0] || x > clip[1]))) { x++; continue; }
      let e = x + 1;
      while (e < spr.w && row[e] === ch && (!clip || e <= clip[1])) e++;
      g.fillStyle(spr.palette[AB.indexOf(ch)], 1);
      g.fillRect(ox + x * cell, oy + y * cell, (e - x) * cell + 0.5, cell + 0.5);
      x = e;
    }
  }
}

/** 화폭(140 × 52칸)을 도마 틀에 놓는 자리 */
function placement(geom: { x: number; y: number; w: number; h: number }, spr: PixelFishSprite): { ox: number; oy: number; cell: number } {
  const cell = geom.w / spr.w;
  return { ox: geom.x, oy: geom.y + (geom.h - spr.h * cell) / 2, cell };
}

/** 도마 위 장어를 그린다 — 두족류 렌더러처럼 손질 창 `drawFish`가 부른다 */
export function drawEelBoard(g: Phaser.GameObjects.Graphics, geom: { x: number; y: number; w: number; h: number }, st: EelBoardState): void {
  const L = EEL_VIEWS[st.speciesId];
  if (!L?.side) return;
  const { ox, oy, cell } = placement(geom, L.side);
  const px = (p: CutPoint): [number, number] => [geom.x + p.x * geom.w, geom.y + p.y * geom.h];
  const layer = (k: EelLayerKey, clip?: [number, number]): void => paintLayer(g, L[k], ox, oy, cell, clip);

  if (!st.spread) {
    // ── 측면(도마에 눕혀 송곳에 박은 그대로) ──
    layer('side');
    if (st.skinT > 0 && L.side_skinned) {
      // 먹장어 — 목 칼집부터 꼬리 쪽으로 벗겨진 만큼 벗긴 몸
      const a = Math.round(st.skinFromCell ?? 13), b = Math.round(st.skinToCell ?? 133);
      layer('side_skinned', [a, Math.round(a + (b - a) * Math.min(1, st.skinT)) + (st.skinT >= 1 ? 4 : 0)]);
      if (st.skinT < 1) {
        // 벗겨지는 껍질 자락(뒤집혀 말린 껍질 — 벗긴 경계 바로 뒤에 짙은 띠)
        const ex = ox + (a + (b - a) * st.skinT) * cell;
        g.fillStyle(0x3a2e3a, 0.9); g.fillRect(ex, oy + 19 * cell, cell * 1.5, 14 * cell);
      }
    }
    if (st.saltPts?.length) {
      // 굵은소금 — 훑고 간 자리마다 흰 알갱이(점액이 빠진 자리)
      g.fillStyle(0xf4f6f8, 0.9);
      st.saltPts.forEach((p, i) => {
        const [x, y] = px(p);
        for (let k = 0; k < 3; k++) g.fillRect(x + ((i * 7 + k * 11) % 13) - 6, y + ((i * 5 + k * 7) % 11) - 5, 2, 2);
      });
    }
    if (st.cutPath && st.cutPath.length >= 2) {
      // 가른 칼자국 — 살이 살짝 벌어진 짙은 선 + 핏기
      g.lineStyle(2.5, 0x5a1c1c, 0.95);
      g.beginPath(); g.moveTo(...px(st.cutPath[0]));
      for (let i = 1; i < st.cutPath.length; i++) g.lineTo(...px(st.cutPath[i]));
      g.strokePath();
      g.lineStyle(1, 0xd8a8a0, 0.8);
      g.beginPath(); g.moveTo(px(st.cutPath[0])[0], px(st.cutPath[0])[1] + 2);
      for (let i = 1; i < st.cutPath.length; i++) g.lineTo(px(st.cutPath[i])[0], px(st.cutPath[i])[1] + 2);
      g.strokePath();
    }
  } else {
    // ── 펼친 살(껍질이 도마에 닿게) — 아래 층부터 ──
    layer(st.marksAll && L.open_marks ? 'open_marks' : 'open_flesh');
    if (!st.finTopOff) layer('open_fin_top');
    if (!st.finBotOff) layer('open_fin_bot');
    if (!st.boned) layer('open_spine');
    if (!st.gutted) layer('open_guts');
    if (!st.headOff) layer('open_head');
    if (!st.marksAll && st.marks.length) {
      // 뼈끊기 진행 — 그은 칼집마다 살갗까지 내려가지 않은 가는 자국
      g.lineStyle(1.5, 0xc48c80, 0.95);
      for (const l of st.marks) {
        if (l.length < 2) continue;
        g.beginPath(); g.moveTo(...px(l[0])); g.lineTo(...px(l[l.length - 1])); g.strokePath();
      }
    }
  }

  if (st.pinned && !st.headOff && st.pinPoint) {
    // 송곳 — 위에서 본 손잡이(나무) + 쇠 고리. 머리를 떼면 함께 뽑는다
    const [x, y] = px(st.pinPoint);
    g.fillStyle(0x000000, 0.25); g.fillEllipse(x + 4, y + 4, cell * 3.6, cell * 2.6);
    g.fillStyle(0x6a4020, 1); g.fillCircle(x, y, cell * 1.5);
    g.fillStyle(0x9a6434, 1); g.fillCircle(x - cell * 0.35, y - cell * 0.35, cell * 0.8);
    g.lineStyle(1.5, 0xb8c0c8, 1); g.strokeCircle(x, y, cell * 1.5);
  }
}

/**
 * 결과물 그림(가방 칸 · 부산물 팝업) — 같은 층에서 굽는다.
 *  - 'fillet' = 펼친 포(머리 · 뼈 · 지느러미 · 내장 뺀 살 — 갯장어는 뼈끊기 자국)
 *  - 'head' = 측면 머리 · 'spine' = 중골
 * 없으면 undefined(부르는 쪽이 공용 그림으로 물러난다).
 */
export function ensureEelTrimTexture(scene: Phaser.Scene, speciesId: string, kind: 'fillet' | 'head' | 'spine'): string | undefined {
  const L = EEL_VIEWS[speciesId];
  const spr = kind === 'fillet' ? (L?.open_marks ?? L?.open_flesh) : kind === 'head' ? L?.side : L?.open_spine;
  if (!spr) return undefined;
  const key = `trim_eel_${kind}_${speciesId}`;
  if (scene.textures.exists(key)) return key;
  // 머리는 목(첫 칸 ~ 펼친 살이 시작하는 칸) 앞만
  let xMax = spr.w - 1;
  if (kind === 'head' && L?.open_flesh) {
    const row = L.open_flesh.rows[26];
    xMax = Math.max(4, row.search(/[^.]/) - 1);
  }
  let x0 = spr.w, y0 = spr.h, x1 = -1, y1 = -1;
  for (let y = 0; y < spr.h; y++) for (let x = 0; x <= xMax; x++) {
    if (spr.rows[y][x] === '.') continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return undefined;
  const C = 2, PAD = 2;
  const w = (x1 - x0 + 1) * C + PAD * 2, h = (y1 - y0 + 1) * C + PAD * 2;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex?.getContext();
  if (!tex || !ctx) return undefined;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = spr.rows[y][x];
    if (ch === '.') continue;
    ctx.fillStyle = `#${spr.palette[AB.indexOf(ch)].toString(16).padStart(6, '0')}`;
    ctx.fillRect(PAD + (x - x0) * C, PAD + (y - y0) * C, C, C);
  }
  tex.refresh();
  return key;
}
