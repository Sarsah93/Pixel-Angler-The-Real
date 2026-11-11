/**
 * gen_eel_views.cjs — 장어류 손질 도마 그림 + 유도선 좌표 생성기 (315차)
 *
 * 사용자 지시(2026-11-11): 「장어류 손질 … 도마 위에서 구현할 때 형태(UI)적으로 오류가 없도록
 * 실제와 유사한 모습으로 보여주는 게 가장 중요해」.
 *  - 도감 그림(public/fish/*.png)은 몸이 휘어 있어 도마 그림으로 못 쓴다 — 송곳에 꽂혀 곧게 편 장어를 코드로 그린다.
 *  - 색은 그 어종 그림에서 뽑은 값(붕장어 올리브 갈색 · 갯장어 회갈색 · 먹장어 보랏빛 분홍)이다.
 *  - **그림과 유도선이 한 기하에서 나온다** — 같은 몸 윤곽 함수로 그림을 칠하고 칼선 좌표를 뽑는다(형태 오류 0).
 *
 * 화폭 = 140 × 52칸(칸 4px → 560 × 208 — 도마 생선 틀 560 × 210 안 · 세로 1px 여백). 머리 왼쪽 · 꼬리 오른쪽.
 * 출력:
 *  ① packages/client-pc/src/data/PixelEelViews.ts — 어종별 층 그림(측면 · 껍질 벗긴 측면 · 펼친 살 · 머리 · 내장 · 뼈 · 지느러미 · 뼈끊기 자국)
 *  ② packages/core/src/db-schema/EelGuideGeometry.ts — 어종별 유도선(도마 생선 틀 정규화 0~1)
 *
 * 실행: node tools/gen_eel_views.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_CLIENT = path.join(ROOT, 'packages/client-pc/src/data/PixelEelViews.ts');
const OUT_CORE = path.join(ROOT, 'packages/core/src/db-schema/EelGuideGeometry.ts');

const W = 140, H = 52, AXIS = 26;
const X0 = 6, X1 = 133;                 // 주둥이 끝 · 꼬리 끝
const CELL = 4, FRAME_W = 560, FRAME_H = 210;
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/** 칸 중심 → 도마 생선 틀 정규화 (그림은 틀 안 세로 가운데 — 위아래 1px) */
const nx = (x) => Math.round(((x + 0.5) * CELL / FRAME_W) * 1000) / 1000;
const ny = (y) => Math.round((((FRAME_H - H * CELL) / 2 + (y + 0.5) * CELL) / FRAME_H) * 1000) / 1000;
const P = (x, y) => ({ x: nx(x), y: ny(y) });
const xAt = (t) => X0 + (X1 - X0) * t;
const tAt = (x) => (x - X0) / (X1 - X0);

function pw(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      return v0 + (v1 - v0) * (t1 > t0 ? (t - t0) / (t1 - t0) : 0);
    }
  }
  return pts[pts.length - 1][1];
}

/** 결정적 난수 (점무늬 · 근육결) */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ────────────────────────────────────────────────────────────
// 어종 매개변수 — 색은 public/fish 그림 중앙값 양자화(315 측정)에서 고른다
// ────────────────────────────────────────────────────────────
const SPECIES = {
  // 붕장어 — 올리브 갈색 등 · 크림색 배 · 옆줄 흰 점 · 검은 테 지느러미 · 큰 눈
  conger_eel: {
    seed: 11,
    side: [[0, 0.7], [0.02, 2.0], [0.06, 3.6], [0.10, 4.7], [0.14, 5.2], [0.25, 5.5], [0.45, 5.3], [0.65, 4.4], [0.85, 2.8], [0.96, 1.3], [1, 0.5]],
    neckT: 0.105, vent: 0.40, dorsalFrom: 0.17, analFrom: 0.40, eyeT: 0.035, eyeDy: -1.6, eyeR: 1,
    openW: 10.5, openProf: [[0, 1], [0.6, 1], [0.8, 0.84], [0.92, 0.58], [1, 0.24]],
    skin: [0x2c2620, 0x514533, 0x61533f, 0x716147, 0x7e6d51, 0x998869, 0xb8aa8f, 0xcdc5b1, 0xe5dfcf],
    fin: [0x2a241e, 0x6a5a41, 0x8a7a5c],
    lateral: 0xe5dfcf, pect: [0x7e6d51, 0xb8aa8f],
    flesh: [0xf3e8de, 0xeadbcf, 0xdcc8b8, 0xcdb4a2], rim: 0x4f4333,
    open: 'back',
  },
  // 갯장어(하모) — 회갈색 · 긴 주둥이 · 이빨 · 머리 바로 뒤부터 등지느러미 · 흰 살
  pike_conger: {
    seed: 23,
    side: [[0, 0.5], [0.03, 1.4], [0.07, 2.7], [0.11, 3.9], [0.15, 4.5], [0.30, 4.8], [0.50, 4.6], [0.70, 3.8], [0.88, 2.4], [0.97, 1.0], [1, 0.4]],
    neckT: 0.115, vent: 0.38, dorsalFrom: 0.12, analFrom: 0.38, eyeT: 0.05, eyeDy: -1.4, eyeR: 1, teeth: true,
    openW: 9.5, openProf: [[0, 1], [0.58, 1], [0.8, 0.82], [0.92, 0.55], [1, 0.22]],
    skin: [0x1e1c1b, 0x473f37, 0x5a5044, 0x635546, 0x726352, 0x836e5c, 0x947e68, 0xb0a088, 0xcfc5b1],
    fin: [0x1e1c1b, 0x5a5044, 0x7d6b58],
    lateral: 0xcfc5b1, pect: [0x726352, 0xb0a088],
    flesh: [0xf6f1ea, 0xece4da, 0xdfd3c6, 0xcfc0b0], rim: 0x473f37,
    open: 'belly', honekiri: true,
  },
  // 먹장어(곰장어) — 보랏빛 분홍 · 흰 점 · 뭉툭한 머리 · 수염 · 아가미 구멍 줄 · 꼬리 지느러미 막만
  hagfish: {
    seed: 37,
    side: [[0, 3.0], [0.025, 4.4], [0.07, 5.4], [0.18, 5.9], [0.60, 6.0], [0.84, 5.4], [0.94, 4.3], [1, 2.2]],
    neckT: 0.09, vent: 0.86, dorsalFrom: 0.86, analFrom: 0.80, eyeT: 0.04, eyeDy: -2.2, eyeR: 0, hag: true,
    openW: 9.5, openProf: [[0, 1], [0.82, 1], [0.93, 0.84], [1, 0.5]],
    skin: [0x252228, 0x493e4e, 0x5e4e5e, 0x755a6b, 0x816575, 0x8e6b7b, 0x957280, 0xa07d89, 0xae8d97],
    fin: [0x3a3040, 0x755a6b, 0x957280],
    lateral: 0xc8afae, pect: null,
    flesh: [0xd89a98, 0xc98684, 0xb87472, 0xa46260], rim: 0x8a4e50,
    skinned: [0x7a3e44, 0xa45a5c, 0xb86a6a, 0xc87c7a, 0xd68e8a, 0xe2a29c, 0xecb6ae, 0xf2c6be, 0xf6d4cc],
    open: 'belly',
  },
};

// ────────────────────────────────────────────────────────────
// 칠하기 도구 — 층마다 색 목록(팔레트)을 따로 둔다
// ────────────────────────────────────────────────────────────
function layer() {
  const pal = [];
  const grid = Array.from({ length: H }, () => new Array(W).fill(-1));
  const idx = (c) => { let i = pal.indexOf(c); if (i < 0) { pal.push(c); i = pal.length - 1; } return i; };
  return {
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = idx(c); },
    get(x, y) { return x >= 0 && x < W && y >= 0 && y < H && grid[y][x] >= 0 ? pal[grid[y][x]] : null; },
    has(x, y) { return x >= 0 && x < W && y >= 0 && y < H && grid[y][x] >= 0; },
    clear(x, y) { if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = -1; },
    out() {
      if (pal.length > AB.length) throw new Error(`팔레트 초과 ${pal.length}`);
      return { w: W, h: H, cellPx: CELL, palette: pal, rows: grid.map((r) => r.map((v) => (v < 0 ? '.' : AB[v])).join('')) };
    },
  };
}

/** 몸 반높이(측면) — 칸 */
const halfSide = (sp, t) => pw(t, sp.side);
/** 펼친 살 반폭 — 목에서 0.03 동안 넓어진다 */
function halfOpen(sp, t) {
  // 펼친 장어는 길이 대부분이 고른 너비의 띠다(꼬리 15%만 좁아진다) — 측면 반높이 × 2가 아니다.
  //  목에서는 머리 두께로 시작해 0.06 동안 부드럽게(smoothstep) 벌어진다.
  const k = Math.min(1, Math.max(0, (t - sp.neckT) / 0.06));
  const s = k * k * (3 - 2 * k);
  const neckH = halfSide(sp, sp.neckT);
  const full = sp.openW * pw(t, sp.openProf);
  return neckH + (full - neckH) * s;
}

/** 색 띠 — f 0(등) ~ 1(배) */
function bandColor(cols, f) {
  const i = Math.max(0, Math.min(cols.length - 1, Math.floor(f * cols.length)));
  return cols[i];
}

// ── ① 측면 (껍질) ──
function makeSide(sp, cols, opts = {}) {
  const L = layer();
  const r = rng(sp.seed);
  const skinCols = cols.slice(1);      // 0 = 테
  for (let x = X0; x <= X1; x++) {
    const t = tAt(x);
    if (opts.fromT !== undefined && t < opts.fromT) continue;
    const h = halfSide(sp, t);
    const top = Math.round(AXIS - h), bot = Math.round(AXIS + h);
    for (let y = top; y <= bot; y++) {
      // 등 → 배: 등 쪽이 짙고 배 쪽이 밝다(붕장어 · 갯장어) · 먹장어는 위아래로 고르게 밝아진다
      const f = bot > top ? (y - top) / (bot - top) : 0.5;
      let c = sp.hag && !opts.skinned
        ? bandColor(skinCols, 0.15 + 0.7 * (1 - Math.abs(f - 0.42) * 1.5))
        : bandColor(skinCols, Math.pow(f, sp.hag ? 0.9 : 1.15));
      if (y === top || y === bot) c = cols[0];
      L.set(x, y, c);
    }
    // 주둥이 끝 둥글게
    if (x === X0) { L.set(x, AXIS, cols[0]); }
  }
  if (opts.skinned) {
    // 근육 지방 줄(벗긴 몸의 흰 결) — 몸 가운데 · 위아래 3분의 1
    for (let x = X0; x <= X1; x++) {
      const t = tAt(x);
      if (opts.fromT !== undefined && t < opts.fromT) continue;
      const h = halfSide(sp, t);
      if (h < 2) continue;
      if (x % 5 === 0) {
        for (let dy = -Math.floor(h) + 1; dy <= Math.floor(h) - 1; dy++) {
          if (Math.abs(dy) % 3 === 0) L.set(x, AXIS + dy, cols[7]);
        }
      }
      L.set(x, AXIS, cols[6]);
    }
    return L;
  }
  // 지느러미 — 등(머리 뒤 dorsalFrom부터) · 뒷(항문부터) · 끝은 꼬리와 이어진다
  const finTop = (t) => (t < sp.dorsalFrom ? 0 : Math.min(1.8, (t - sp.dorsalFrom) * 18) * (sp.hag ? 0.8 : 1));
  const finBot = (t) => (t < sp.analFrom ? 0 : Math.min(1.6, (t - sp.analFrom) * 18) * (sp.hag ? 0.8 : 1));
  for (let x = X0; x <= X1 + 2; x++) {
    const t = Math.min(1, tAt(x));
    const h = halfSide(sp, t);
    const ft = Math.round(finTop(t)), fb = Math.round(finBot(t));
    const top = Math.round(AXIS - h), bot = Math.round(AXIS + h);
    // 지느러미 막 — 몸에 붙은 쪽은 반투명한 밝은 막, 바깥 테만 짙게(붕장어 · 갯장어의 검은 테). 줄무늬로 끊지 않는다
    for (let k = 1; k <= ft; k++) L.set(x, top - k, k === ft ? sp.fin[0] : sp.fin[2]);
    for (let k = 1; k <= fb; k++) L.set(x, bot + k, k === fb ? sp.fin[0] : sp.fin[2]);
  }
  // 꼬리 끝 지느러미 둥근 막
  for (let dx = 1; dx <= 3; dx++) for (let dy = -2 + dx; dy <= 2 - dx; dy++) L.set(X1 + dx, AXIS + dy, dx === 3 || Math.abs(dy) === 2 - dx ? sp.fin[0] : sp.fin[1]);
  // 옆줄 · 점무늬
  if (!sp.hag) {
    // 옆줄 구멍 — 몸 가운데 한 줄 · 4칸마다(붕장어의 흰 점 줄). 두 줄로 찍으면 바느질 자국처럼 보인다
    for (let x = Math.round(xAt(0.12)); x <= xAt(0.92); x += 4) L.set(x, AXIS - 1, sp.lateral);
  } else {
    for (let n = 0; n < 70; n++) {
      const x = Math.round(xAt(0.08 + r() * 0.86));
      const h = halfSide(sp, tAt(x));
      const y = Math.round(AXIS + (r() * 2 - 1) * (h - 1.2));
      L.set(x, y, sp.lateral);
    }
    // 아가미 구멍 줄(배 쪽 흰 점)
    for (let x = xAt(0.16); x <= xAt(0.30); x += 2) { const h = halfSide(sp, tAt(x)); L.set(x, Math.round(AXIS + h * 0.55), 0xf0dcd8); }
  }
  // 가슴지느러미
  if (sp.pect) {
    const px = Math.round(xAt(sp.neckT + 0.01));
    for (let dx = 0; dx <= 3; dx++) for (let dy = 0; dy <= 2 - Math.floor(dx / 2); dy++) L.set(px + dx, AXIS + 1 + dy, dx === 3 || dy === 2 ? sp.fin[0] : sp.pect[dy % 2]);
  }
  // 아가미 틈
  const gx = Math.round(xAt(sp.neckT - 0.005));
  for (let dy = -1; dy <= 2; dy++) L.set(gx, AXIS + dy, cols[0]);
  // 눈
  const ex = Math.round(xAt(sp.eyeT)), ey = Math.round(AXIS + sp.eyeDy);
  if (sp.eyeR > 0) {
    L.set(ex, ey, 0x101010); L.set(ex + 1, ey, 0x101010);
    L.set(ex - 1, ey, 0xe8eef0); L.set(ex + 2, ey, 0xe8eef0); L.set(ex, ey - 1, 0xe8eef0); L.set(ex + 1, ey - 1, 0xe8eef0);
    L.set(ex, ey + 1, 0xe8eef0); L.set(ex + 1, ey + 1, 0xe8eef0); L.set(ex, ey, 0x101010);
  } else {
    L.set(ex, ey, 0x3a2e3a);   // 먹장어 — 살갗 밑 눈 자리
  }
  // 입
  const mEnd = Math.round(xAt(sp.teeth ? 0.075 : 0.05));
  for (let x = X0; x <= mEnd; x++) L.set(x, AXIS + (sp.hag ? 1 : 1), cols[0]);
  if (sp.teeth) for (let x = X0 + 1; x <= mEnd; x += 2) L.set(x, AXIS + 2, 0xf4f0e8);
  // 먹장어 수염
  if (sp.hag) {
    const bar = [[-1, -2], [-2, -3], [-1, 0], [-3, 0], [-1, 2], [-2, 3]];
    for (const [dx, dy] of bar) L.set(X0 + dx, AXIS + dy, sp.skin[3]);
    L.set(X0 - 3, AXIS - 3, sp.skin[2]); L.set(X0 - 4, AXIS, sp.skin[2]); L.set(X0 - 3, AXIS + 3, sp.skin[2]);
  }
  return L;
}

// ── ② 펼친 살 (꼬리까지 · 머리 없음) ──
function makeOpenFlesh(sp, opts = {}) {
  const L = layer();
  const r = rng(sp.seed + 5);
  const x0 = Math.round(xAt(sp.neckT)) + 1;
  for (let x = x0; x <= X1; x++) {
    const t = tAt(x);
    const h = halfOpen(sp, t);
    const top = Math.round(AXIS - h), bot = Math.round(AXIS + h);
    for (let y = top; y <= bot; y++) {
      const d = Math.abs(y - AXIS) / Math.max(1, h);
      // 가운데(뼈 자리)가 조금 짙고 가장자리로 갈수록 밝다 · 끝 한 칸은 껍질 테(먹장어는 벗긴 살 테)
      let c = sp.flesh[d < 0.18 ? 2 : d < 0.55 ? 1 : 0];
      if (y === top || y === bot) c = sp.rim;
      else if ((y === top + 1 || y === bot - 1) && !sp.hag) c = sp.flesh[3];
      L.set(x, y, c);
    }
    // 근육결(< 자 결) — 4칸마다
    if (x % 4 === 0 && h > 3) {
      for (let k = 2; k < h - 1; k++) {
        const dx = Math.round(k * 0.5);
        if (L.has(x + dx, AXIS - k) && L.get(x + dx, AXIS - k) !== sp.rim) L.set(x + dx, AXIS - k, sp.flesh[2]);
        if (L.has(x + dx, AXIS + k) && L.get(x + dx, AXIS + k) !== sp.rim) L.set(x + dx, AXIS + k, sp.flesh[2]);
      }
    }
  }
  // 꼬리 끝 둥글게
  for (let dx = 1; dx <= 2; dx++) for (let dy = -2 + dx; dy <= 2 - dx; dy++) L.set(X1 + dx, AXIS + dy, sp.rim);
  // 먹장어 — 벗긴 살의 흰 지방 점
  if (sp.hag) for (let n = 0; n < 40; n++) {
    const x = Math.round(xAt(sp.neckT + 0.04 + r() * 0.8)); const h = halfOpen(sp, tAt(x));
    const y = Math.round(AXIS + (r() * 2 - 1) * (h - 2)); if (L.has(x, y)) L.set(x, y, 0xf2d6d0);
  }
  if (opts.marks) {
    // 뼈끊기 자국 — 껍질만 남기고 2칸마다 촘촘히 칼집
    for (let x = Math.round(xAt(sp.neckT + 0.04)); x <= Math.round(xAt(0.95)); x += 2) {
      const h = halfOpen(sp, tAt(x));
      for (let y = Math.round(AXIS - h) + 2; y <= Math.round(AXIS + h) - 2; y++) L.set(x, y, 0xd9b4a8);
    }
  }
  return L;
}

// ── ③ 지느러미(펼친 살 바깥 테) — 위 · 아래 ──
function makeOpenFin(sp, side) {
  const L = layer();
  if (sp.hag) {
    // 먹장어 — 꼬리 쪽 지느러미 막만
    for (let x = Math.round(xAt(0.84)); x <= X1 + 1; x++) {
      const h = halfOpen(sp, Math.min(1, tAt(x)));
      const y = side === 'top' ? Math.round(AXIS - h) - 1 : Math.round(AXIS + h) + 1;
      L.set(x, y, sp.fin[x % 2 ? 1 : 2]);
    }
    return L;
  }
  const from = Math.round(xAt(Math.max(sp.dorsalFrom, sp.neckT + 0.04)));
  for (let x = from; x <= X1 + 2; x++) {
    const t = Math.min(1, tAt(x));
    const h = halfOpen(sp, t);
    const fh = Math.min(2, 1 + Math.floor((x - from) / 6));
    for (let k = 1; k <= fh; k++) {
      const y = side === 'top' ? Math.round(AXIS - h) - k : Math.round(AXIS + h) + k;
      L.set(x, y, k === fh ? sp.fin[0] : sp.fin[2]);
    }
  }
  return L;
}

// ── ④ 중골(뼈 + 핏줄) ──
function makeOpenSpine(sp) {
  const L = layer();
  if (sp.hag) return L;   // 먹장어 — 단단한 뼈가 없다(척삭)
  const a = Math.round(xAt(sp.neckT)) + 2, b = Math.round(xAt(0.965));
  for (let x = a; x <= b; x++) {
    const thick = tAt(x) > 0.85 ? 1 : 2;
    for (let k = 0; k < thick; k++) L.set(x, AXIS + k, x % 3 === 0 ? 0x9a9084 : 0xdcd4c8);   // 척추 마디(3칸마다 마디 금)
    if (x % 3 === 1) { L.set(x, AXIS - 1, 0xc8beb0); L.set(x + 1, AXIS - 2, 0xb4aa9c); }      // 가시 돌기(꼬리 쪽으로 눕는다)
    L.set(x, AXIS + thick, 0x8a2a2a);                          // 핏줄
    if (x % 3 === 0 && tAt(x) < 0.8) L.set(x, AXIS + thick + 1, 0xa04848);
  }
  return L;
}

// ── ⑤ 내장 ──
function makeOpenGuts(sp) {
  const L = layer();
  const a = Math.round(xAt(sp.neckT)) + 2, b = Math.round(xAt(sp.vent));
  const r = rng(sp.seed + 9);
  for (let x = a; x <= b; x++) {
    const t = (x - a) / Math.max(1, b - a);
    const h = halfOpen(sp, tAt(x));
    // 간(앞) → 위 · 창자(뒤로 가늘어짐)
    const gh = Math.max(1, Math.round(h * (sp.hag ? 0.42 : 0.5) * (t < 0.35 ? 1 : 1 - (t - 0.35) * 0.9)));
    for (let dy = -gh; dy <= gh; dy++) {
      let c;
      if (t < 0.35) c = Math.abs(dy) === gh ? 0x4a1c18 : (r() < 0.25 ? 0x7a3226 : 0x6a2a22);   // 간
      else c = Math.abs(dy) === gh ? 0x5a2a24 : (dy % 2 === 0 ? 0xa85a4a : 0x94503f);          // 창자
      L.set(x, AXIS + dy, c);
    }
  }
  // 쓸개(초록 점)
  const gx = Math.round(a + (b - a) * 0.3);
  L.set(gx, AXIS - 1, 0x4a7a3a); L.set(gx + 1, AXIS - 1, 0x5a8a44); L.set(gx, AXIS, 0x3e6a32);
  return L;
}

// ── ⑥ 머리(펼친 뒤에도 송곳에 꽂힌 채 남는 머리) ──
function makeOpenHead(side, sp) {
  const L = layer();
  const xe = Math.round(xAt(sp.neckT)) + 1;
  for (let x = 0; x <= xe; x++) for (let y = 0; y < H; y++) { const c = side.get(x, y); if (c !== null) L.set(x, y, c); }
  // 목 자른 면이 아니라 이어진 자리 — 살 테 한 줄
  const h = halfSide(sp, sp.neckT);
  for (let y = Math.round(AXIS - h); y <= Math.round(AXIS + h); y++) L.set(xe, y, sp.skin[1]);
  return L;
}

// ────────────────────────────────────────────────────────────
// 유도선 (도마 생선 틀 정규화)
// ────────────────────────────────────────────────────────────
function guides(sp) {
  const along = (t0, t1, n, yOf) => {
    const out = [];
    for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * (i / (n - 1)); const x = xAt(t); out.push(P(x, yOf(t))); }
    return out;
  };
  const neckX = xAt(sp.neckT);
  const hNeck = halfSide(sp, sp.neckT);
  const hoNeck = halfOpen(sp, sp.neckT + 0.04);
  const g = {
    /** 송곳 — 눈 바로 뒤 */
    pin: P(xAt(sp.eyeT) + 2.5, AXIS + sp.eyeDy + 0.5),
    /** 점액 빼기 — 머리 뒤에서 꼬리까지 몸 가운데 */
    slime: along(sp.neckT - 0.03, 0.96, 6, () => AXIS),
    /** 등 가르기 — 등 능선 바로 아래(머리 뒤 → 꼬리) */
    backCut: along(sp.neckT + 0.005, 0.95, 9, (t) => AXIS - halfSide(sp, t) + 1),
    /** 배 가르기 — 배 능선 바로 위(목 → 꼬리) */
    bellyCut: along(sp.neckT + 0.005, 0.95, 9, (t) => AXIS + halfSide(sp, t) - 1),
    /** 펼치기 — 갈라 놓은 몸을 손으로 벌려 꼬리까지 */
    spread: along(sp.neckT + 0.03, 0.93, 5, () => AXIS),
    /** 내장 빼기 — 항문 쪽에서 목 쪽으로 끌어낸다 */
    gutOut: along(sp.vent - 0.01, sp.neckT + 0.03, 5, () => AXIS),
    /** 중골 — 뼈 밑으로 칼을 넣어 머리 → 꼬리 */
    spine: along(sp.neckT + 0.02, 0.95, 9, () => AXIS + 1),
    /** 지느러미 — 펼친 살 위 · 아래 가장자리 */
    finTop: along(Math.max(sp.dorsalFrom, sp.neckT + 0.04) + 0.01, 0.97, 9, (t) => AXIS - halfOpen(sp, t) + 0.5),
    finBot: along(Math.max(sp.dorsalFrom, sp.neckT + 0.04) + 0.01, 0.97, 9, (t) => AXIS + halfOpen(sp, t) - 0.5),
    /** 머리 떼기 — 목 세로 */
    head: [P(neckX + 1, AXIS - hoNeck - 1), P(neckX + 1, AXIS + hoNeck + 1)],
    /** 목 둘레 칼집(먹장어 껍질 벗기기 앞) — 측면 세로 */
    neck: [P(neckX + 1, AXIS - hNeck - 0.5), P(neckX + 1, AXIS + hNeck + 0.5)],
    /** 껍질 벗기기 — 목 칼집을 잡고 꼬리로 */
    peelGrip: P(neckX + 1.5, AXIS),
    peel: [P(neckX + 1.5, AXIS), P(xAt(0.97), AXIS)],
    /** 뼈끊기 — 껍질 끝까지 가지 않는 짧은 세로 칼집 8줄 */
    honekiri: Array.from({ length: 8 }, (_, i) => {
      const t = sp.neckT + 0.10 + (0.84 - sp.neckT - 0.10) * (i / 7);
      const h = halfOpen(sp, t);
      return [P(xAt(t), AXIS - h + 2), P(xAt(t), AXIS + h - 2)];
    }),
  };
  return g;
}

// ────────────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────────────
const client = {};
const core = {};
for (const [id, sp] of Object.entries(SPECIES)) {
  const side = makeSide(sp, sp.skin);
  const layers = {
    side: side.out(),
    open_flesh: makeOpenFlesh(sp).out(),
    open_head: makeOpenHead(side, sp).out(),
    open_guts: makeOpenGuts(sp).out(),
    open_spine: makeOpenSpine(sp).out(),
    open_fin_top: makeOpenFin(sp, 'top').out(),
    open_fin_bot: makeOpenFin(sp, 'bot').out(),
  };
  if (sp.skinned) layers.side_skinned = makeSide(sp, sp.skinned, { skinned: true }).out();
  if (sp.honekiri) layers.open_marks = makeOpenFlesh(sp, { marks: true }).out();
  client[id] = layers;
  core[id] = { ...guides(sp), open: sp.open, boneCut: !!sp.honekiri, skinPeel: !!sp.hag };
}

const fmtSprite = (s) => `{ w: ${s.w}, h: ${s.h}, cellPx: ${s.cellPx}, palette: [${s.palette.map((c) => `0x${c.toString(16).padStart(6, '0')}`).join(', ')}],\n      rows: [\n${s.rows.map((r) => `        '${r}',`).join('\n')}\n      ] }`;
const clientTs = `/**
 * PixelEelViews — 장어류 손질 도마 그림 (315차)
 *
 * ⚠ 자동 생성 — 손으로 고치지 않는다(\`node tools/gen_eel_views.cjs\`).
 * 화폭 140 × 52칸(칸 4px) — 도마 생선 틀(560 × 210) 세로 가운데. 머리 왼쪽.
 * 층: side(껍질 측면) · side_skinned(먹장어 껍질 벗긴 측면) · open_flesh(펼친 살) · open_head · open_guts ·
 *     open_spine · open_fin_top · open_fin_bot · open_marks(갯장어 뼈끊기 자국).
 * 유도선은 같은 기하에서 나온 core \`EEL_GUIDE\`(EelGuideGeometry.ts)다 — 그림과 선이 어긋나지 않는다.
 */
import type { PixelFishSprite } from './PixelFishSprites.js';

export type EelLayerKey =
  | 'side' | 'side_skinned' | 'open_flesh' | 'open_head' | 'open_guts' | 'open_spine'
  | 'open_fin_top' | 'open_fin_bot' | 'open_marks';

export const EEL_VIEWS: Record<string, Partial<Record<EelLayerKey, PixelFishSprite>>> = {
${Object.entries(client).map(([id, ls]) => `  ${id}: {\n${Object.entries(ls).map(([k, s]) => `    ${k}: ${fmtSprite(s)},`).join('\n')}\n  },`).join('\n')}
};
`;
const pt = (p) => `{ x: ${p.x.toFixed(3)}, y: ${p.y.toFixed(3)} }`;
const line = (a) => `[${a.map(pt).join(', ')}]`;
const coreTs = `/**
 * EelGuideGeometry — 장어류 손질 유도선 (315차)
 *
 * ⚠ 자동 생성 — 손으로 고치지 않는다(\`node tools/gen_eel_views.cjs\`). 그림(client \`PixelEelViews\`)과 같은 몸 윤곽에서 뽑았다.
 * 좌표 = 도마 생선 틀(560 × 210) 정규화 0~1 · 머리 왼쪽. F9 [확정] 좌표가 있으면 그쪽이 이긴다(\`applyGuideOverrides\`).
 */
import type { EelGuideSet } from '../types/Butchery.js';

export const EEL_GUIDE: Record<string, EelGuideSet> = {
${Object.entries(core).map(([id, g]) => `  ${id}: {
    open: '${g.open}', boneCut: ${g.boneCut}, skinPeel: ${g.skinPeel},
    pin: ${pt(g.pin)},
    slime: ${line(g.slime)},
    backCut: ${line(g.backCut)},
    bellyCut: ${line(g.bellyCut)},
    spread: ${line(g.spread)},
    gutOut: ${line(g.gutOut)},
    spine: ${line(g.spine)},
    finTop: ${line(g.finTop)},
    finBot: ${line(g.finBot)},
    head: ${line(g.head)},
    neck: ${line(g.neck)},
    peelGrip: ${pt(g.peelGrip)},
    peel: ${line(g.peel)},
    honekiri: [
${g.honekiri.map((l) => `      ${line(l)},`).join('\n')}
    ],
  },`).join('\n')}
};
`;
// --preview <png> — 단계별 합성 미리보기(검수용 · 저장소에 넣지 않는다)
const pi = process.argv.indexOf('--preview');
if (pi > 0) {
  const { encode } = require('./lib_png.cjs');
  const S = 2;   // 칸 2px
  const steps = (id) => {
    const L = client[id];
    const st = [
      ['side'], ['open_flesh', 'open_fin_top', 'open_fin_bot', 'open_spine', 'open_guts', 'open_head'],
      ['open_flesh', 'open_fin_top', 'open_fin_bot', 'open_spine', 'open_head'],
      ['open_flesh', 'open_fin_top', 'open_fin_bot', 'open_head'],
      ['open_flesh', 'open_head'], [L.open_marks ? 'open_marks' : 'open_flesh'],
    ];
    if (L.side_skinned) st.splice(1, 0, ['side_skinned_full']);
    return st;
  };
  const ids = Object.keys(client);
  const rows = ids.map(steps);
  const cols = Math.max(...rows.map((r) => r.length));
  const PW = W * S, PH = H * S, GAP = 6;
  const IW = cols * (PW + GAP), IH = ids.length * (PH + GAP);
  const buf = Buffer.alloc(IW * IH * 4);
  for (let i = 0; i < IW * IH; i++) { buf[i * 4] = 0xa8; buf[i * 4 + 1] = 0x84; buf[i * 4 + 2] = 0x5a; buf[i * 4 + 3] = 255; }
  const paint = (spr, ox, oy, clipX) => {
    for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) {
      const ch = spr.rows[y][x]; if (ch === '.') continue;
      if (clipX !== undefined && x < clipX) continue;
      const c = spr.palette[AB.indexOf(ch)];
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
        const o = ((oy + y * S + dy) * IW + ox + x * S + dx) * 4;
        buf[o] = (c >> 16) & 255; buf[o + 1] = (c >> 8) & 255; buf[o + 2] = c & 255; buf[o + 3] = 255;
      }
    }
  };
  ids.forEach((id, ri) => rows[ri].forEach((ls, ci) => {
    const ox = ci * (PW + GAP), oy = ri * (PH + GAP);
    for (const k of ls) {
      if (k === 'side_skinned_full') { paint(client[id].side, ox, oy); paint(client[id].side_skinned, ox, oy, Math.round(xAt(SPECIES[id].neckT)) + 1); continue; }
      if (client[id][k]) paint(client[id][k], ox, oy);
    }
  }));
  encode(IW, IH, buf, process.argv[pi + 1]);
  console.log('[gen_eel_views] 미리보기', process.argv[pi + 1]);
}
fs.writeFileSync(OUT_CLIENT, clientTs, 'utf8');
fs.writeFileSync(OUT_CORE, coreTs, 'utf8');
console.log(`[gen_eel_views] ${Object.keys(client).length}종 · 층 ${Object.values(client).reduce((n, l) => n + Object.keys(l).length, 0)}장 → ${path.relative(ROOT, OUT_CLIENT)} · ${path.relative(ROOT, OUT_CORE)}`);
