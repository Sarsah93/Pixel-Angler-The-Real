/**
 * gen_butchery_views.cjs — 손질 전용 "뷰" 도트 스프라이트 생성기
 *
 * 사용자 지시 (2026-07-30):
 *  ① 측면 뷰는 **뱃살이 아래쪽**에 오도록 배치 (상하 미러로 배를 위로 올리지 않는다)
 *  ② 배따기 단계는 **뱃살을 정면으로 바라보는 뷰**(복면 뷰 — 실사 참고 3번째 캡처)
 *  ③ 핏줄 긁기/뱃속 세척은 **내장을 제거한 공간을 탑뷰로 바라보는 뷰**(실사 2번째 캡처)
 *
 * 실사 사진 에셋이 준비되기 전 단계라, 실사 특징(복면 = 방추 은백색 + 좌우 대칭 지느러미 /
 * 체강 = 벌어진 뱃살 + 은막 + 척추 아래 검붉은 고인 피 + 갈빗대)을 파라메트릭으로 도트화한다.
 * 사진이 들어오면 tools/pixelize_butchery.cjs 로 같은 키를 덮어쓰면 자동 교체된다
 * (PixelButcherFish는 사진 레지스트리를 먼저 조회).
 *
 * 실행: node tools/gen_butchery_views.cjs
 * 출력: packages/client-pc/src/data/PixelFishViews.ts
 */
'use strict';
const fs = require('fs');
const path = require('path');

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/** 구간 선형 보간 — pts = [[t, v], ...] (t 오름차순) */
function pw(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      return v0 + (v1 - v0) * u;
    }
  }
  return pts[pts.length - 1][1];
}

function makeGrid(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(-1));
}

/** 팔레트 밴드 선택 — bands = [[상한f, palIdx], ...] */
function band(f, bands) {
  for (const [lim, idx] of bands) if (f <= lim) return idx;
  return bands[bands.length - 1][1];
}

function toSprite(w, h, palette, grid) {
  const rows = grid.map((row) => row.map((v) => (v < 0 ? '.' : AB[v])).join(''));
  return { w, h, cellPx: 2, palette, rows };
}

// ────────────────────────────────────────────────────────────
// ① 복면 뷰 (배쪽 정면) — 뱃살을 정면에서 바라본다
// ────────────────────────────────────────────────────────────
function makeVentral(opts) {
  const W = 120, H = 54;
  const AX = 26.5;                       // 몸 중심축 (y)
  const X0 = 5, X1 = 95, CAUD = 22;      // 주둥이 / 꼬리자루 / 미기 길이
  const grid = makeGrid(W, H);

  // palette
  const pal = [
    0xf6f2e9, // 0 배 중앙 하이라이트
    0xe9e2d5, // 1 배 흰살
    0xd6cec0, // 2
    0xbdb6aa, // 3 옆구리 음영
    0x9aa3a8, // 4 은청 경계
    0x6d767c, // 5 외곽 림
    0x3f474c, // 6 짙은 엣지
    0xd2c9b6, // 7 정중선 홈
    0xa8917f, // 8 항문
    0x8d99a1, // 9 지느러미 막
    0x636e76, // 10 지느러미 살(줄기)
    0x5a4a3f, // 11 아래턱 그늘
    0xc2ccd2, // 12 아가미 뚜껑
  ];

  const HW = opts.halfWidth;             // 반폭 프로필 (몸 길이 t → 셀)
  const halfAt = (t) => pw(t, HW);

  // ── 몸통 ──
  for (let x = X0; x <= X1; x++) {
    const t = (x - X0) / (X1 - X0);
    const hw = halfAt(t);
    if (hw < 0.4) continue;
    const span = Math.round(hw);
    for (let dy = -span; dy <= span; dy++) {
      const f = Math.abs(dy) / hw;
      let idx = band(f, [[0.16, 0], [0.42, 1], [0.62, 2], [0.78, 3], [0.9, 4], [0.97, 5], [1.01, 6]]);
      // 정중선 홈 (턱 아래 ~ 항문) — 배를 가르는 기준선
      if (Math.abs(dy) <= 0.6 && t > 0.1 && t < 0.66) idx = 7;
      // 항문 (배 가르기 시작점)
      if (Math.abs(t - opts.vent) < 0.012 && Math.abs(dy) <= 1.4) idx = 8;
      const y = Math.round(AX + dy);
      if (y >= 0 && y < H) grid[y][x] = idx;
    }
  }
  // 아래턱/아가미 뚜껑 — 머리 쪽 좌우 대칭 음영
  for (let x = X0 + 2; x < X0 + 20; x++) {
    const t = (x - X0) / (X1 - X0);
    const hw = halfAt(t);
    for (const s of [-1, 1]) {
      const y = Math.round(AX + s * hw * 0.55);
      if (grid[y] && grid[y][x] >= 0) grid[y][x] = x < X0 + 11 ? 11 : 12;
    }
  }

  // ── 좌우 대칭 지느러미 (가슴 / 배) ──
  const finPair = (t0, t1, span, sweep) => {
    for (let x = Math.round(X0 + t0 * (X1 - X0)); x <= Math.round(X0 + t1 * (X1 - X0)); x++) {
      const t = (x - X0) / (X1 - X0);
      const u = (t - t0) / (t1 - t0);                 // 0=밑동 1=끝
      const hw = halfAt(t);
      const out = span * Math.sin(Math.PI * Math.min(1, Math.max(0, u)) ** 0.85);
      for (const s of [-1, 1]) {
        for (let k = 0; k <= Math.round(out); k++) {
          const y = Math.round(AX + s * (hw + k) + s * sweep * u);
          if (y < 0 || y >= H) continue;
          if (grid[y][x] >= 0 && grid[y][x] <= 7) continue;   // 몸통 보존
          grid[y][x] = k % 3 === 0 ? 10 : 9;
        }
      }
    }
  };
  finPair(opts.pect[0], opts.pect[1], opts.pect[2], 2);
  finPair(opts.pelv[0], opts.pelv[1], opts.pelv[2], 1);

  // ── 미기 (갈라진 꼬리) ──
  for (let x = X1; x <= X1 + CAUD; x++) {
    const u = (x - X1) / CAUD;
    const spanY = 3 + u * opts.caudal;
    const notch = u * u * (opts.caudal * 0.55);
    for (let dy = -Math.round(spanY); dy <= Math.round(spanY); dy++) {
      if (Math.abs(dy) < notch) continue;
      const y = Math.round(AX + dy);
      if (y < 0 || y >= H) continue;
      grid[y][x] = Math.abs(dy) % 4 === 0 ? 10 : 9;
    }
  }
  return toSprite(W, H, pal, grid);
}

// ────────────────────────────────────────────────────────────
// ② 체강 탑뷰 — 내장을 꺼낸 뱃속 공간을 위에서 들여다본다
// ────────────────────────────────────────────────────────────
function makeCavity(opts) {
  const W = 120, H = 66;
  const AX = 32.5;
  const X0 = 6, X1 = 106;
  const grid = makeGrid(W, H);

  const pal = [
    0x120306, // 0 고인 피 (척추 아래 홈)
    0x4d1016, // 1 핏줄·신장막
    0x7d858f, // 2 은막 (복막)
    0xb9797a, // 3 붉은 살 벽
    0xd8a9a4, // 4
    0xecd2cb, // 5 연분홍 살
    0xf5e8df, // 6 뱃살 안쪽
    0xe3e7e0, // 7 은빛 껍질 안쪽 (벌어진 뱃살 플랩)
    0x39424a, // 8 껍질 엣지
    0xfaf5ec, // 9 갈빗대
    0x2e070b, // 10 핏덩이
    0x9aa3a8, // 11 척추 뼈마디
  ];

  const halfAt = (t) => pw(t, opts.halfHeight);

  for (let x = X0; x <= X1; x++) {
    const t = (x - X0) / (X1 - X0);
    const hh = halfAt(t);
    if (hh < 0.5) continue;
    const span = Math.round(hh);
    for (let dy = -span; dy <= span; dy++) {
      const f = Math.abs(dy) / hh;
      const idx = band(f, [
        [0.06, 0], [0.15, 1], [0.28, 2], [0.44, 3], [0.58, 4],
        [0.72, 5], [0.84, 6], [0.94, 7], [1.01, 8],
      ]);
      const y = Math.round(AX + dy);
      if (y >= 0 && y < H) grid[y][x] = idx;
    }
  }

  // 척추 뼈마디 — 중심 홈을 따라 일정 간격 밝은 점 (탑뷰에서 보이는 추체)
  for (let x = X0 + 6; x < X1 - 6; x += 7) {
    const t = (x - X0) / (X1 - X0);
    const hh = halfAt(t);
    for (let dy = -Math.round(hh * 0.14); dy <= Math.round(hh * 0.14); dy++) {
      const y = Math.round(AX + dy);
      if (grid[y] && grid[y][x] >= 0) grid[y][x] = 11;
    }
  }

  // 갈빗대 — 척추에서 뱃살 쪽으로 뻗는 밝은 호 (꼬리 쪽으로 기울어짐)
  for (let i = 0; i < opts.ribs; i++) {
    const t = 0.08 + i * (0.52 / opts.ribs);
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 26; k++) {
        const u = k / 26;
        const tt = t + u * 0.055;                       // 꼬리 쪽 기울기
        const hh = halfAt(tt);
        const x = Math.round(X0 + tt * (X1 - X0));
        const y = Math.round(AX + s * (0.3 + u * 0.5) * hh);
        if (!grid[y] || grid[y][x] === undefined || grid[y][x] < 0) continue;
        if (grid[y][x] >= 6) continue;                  // 플랩/엣지 침범 금지
        grid[y][x] = 9;
      }
    }
  }

  // 핏덩이 — 머리 절단면(좌) 쪽에 남은 응혈 몇 점
  const clots = [[0.09, -0.18], [0.13, 0.22], [0.2, -0.06], [0.27, 0.12]];
  for (const [t, dyf] of clots) {
    const cx = Math.round(X0 + t * (X1 - X0));
    const hh = halfAt(t);
    const cy = Math.round(AX + dyf * hh);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx * dx + dy * dy > 5) continue;
        const y = cy + dy, x = cx + dx;
        if (grid[y] && grid[y][x] >= 0 && grid[y][x] < 8) grid[y][x] = 10;
      }
    }
  }

  // 머리 절단면 (좌측 끝) — 두툼한 살 단면
  for (let x = X0; x < X0 + 3; x++) {
    const t = (x - X0) / (X1 - X0);
    const hh = halfAt(t);
    for (let dy = -Math.round(hh); dy <= Math.round(hh); dy++) {
      const y = Math.round(AX + dy);
      if (grid[y] && grid[y][x] >= 0) grid[y][x] = Math.abs(dy) / hh > 0.9 ? 8 : 5;
    }
  }
  return toSprite(W, H, pal, grid);
}

// ────────────────────────────────────────────────────────────
// ③ 장뜨기 뷰 — 등/배를 카메라 쪽으로 눕힌 옆면 + 칼집 벌어짐 4단계
//    실사 정합: 등쪽 = 머리 오른쪽 / 배쪽 = 꼬리 오른쪽.
//    state 0 닫힘 → 1 붉은 살 조금 → 2 뼈 노출 → 3 반대쪽까지 벌어짐.
// ────────────────────────────────────────────────────────────
function makeFilletCut(opts) {
  const W = 128, H = 64;
  const AX = 30;
  const X0 = 6, X1 = 120;
  const grid = makeGrid(W, H);
  const st = opts.state;

  const dorsal = opts.skin === 'dorsal';
  const pal = dorsal ? [
    0x2c4038, // 0 등 skin 상단(광택 쪽)
    0x1e2e28, // 1 skin 중간
    0x16211d, // 2 skin 하단(짙음)
    0x0d1512, // 3 외곽 엣지
    0x4a655a, // 4 sheen
    0xf0cfc6, // 5 살 연분홍
    0xdca79c, // 6 살 중간
    0xb2544f, // 7 붉은 살
    0x7b2b2f, // 8 혈합육/진한 피
    0xf7ece4, // 9 힘줄 흰선
    0xe8e6de, // 10 척추뼈
    0xa8a49a, // 11 뼈 음영
    0x1a1012, // 12 벌어진 틈 그늘
    0xf2ded2, // 13 머리 절단면
    0x223029, // 14 지느러미
  ] : [
    0xe4e7e3, // 0 배 skin 상단
    0xd0d5d2, // 1
    0xb6bdba, // 2
    0x6f7a77, // 3 외곽 엣지
    0xf6f8f5, // 4 sheen
    0xf0cfc6, 0xdca79c, 0xb2544f, 0x7b2b2f, 0xf7ece4,
    0xe8e6de, 0xa8a49a, 0x1a1012, 0xf2ded2,
    0x8d99a1, // 14 지느러미
  ];

  const halfAt = (t) => pw(t, opts.halfHeight);      // t: 0=꼬리, 1=머리
  // 칼집 라인 y (중심 기준 오프셋) — 실사처럼 중앙보다 약간 아래
  const cutOff = (t) => opts.cutOffset * halfAt(t);
  // 벌어짐 반폭 — 양끝 0, 가운데 최대. state 3은 거의 전 구간 벌어짐
  const gapAt = (t) => {
    if (st <= 0) return 0;
    const env = st >= 3
      ? Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.04) / 0.94))) ** 0.35
      : Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.1) / 0.82))) ** 0.7;
    const mx = st === 1 ? 1.6 : st === 2 ? 5.5 : halfAt(t) * 0.62;
    return env * mx;
  };

  for (let x = X0; x <= X1; x++) {
    const tRaw = (x - X0) / (X1 - X0);
    const t = opts.headRight ? tRaw : 1 - tRaw;      // 머리 방향에 따라 프로필 반전
    const hh = halfAt(t) * (st >= 3 ? 1.06 : 1);
    if (hh < 0.5) continue;
    const span = Math.round(hh);
    for (let dy = -span; dy <= span; dy++) {
      const f = Math.abs(dy) / hh;
      const idx = dy < 0
        ? band(f, [[0.25, 4], [0.6, 0], [0.86, 1], [0.96, 2], [1.01, 3]])
        : band(f, [[0.35, 1], [0.7, 1], [0.9, 2], [1.01, 3]]);
      const y = Math.round(AX + dy);
      if (y >= 0 && y < H) grid[y][x] = idx;
    }
    // ── 칼집 벌어짐 ──
    const gh = gapAt(t);
    if (gh <= 0) {
      if (st > 0) {                                  // 닫힌 구간엔 얕은 칼선만
        const y = Math.round(AX + cutOff(t));
        if (grid[y] && grid[y][x] >= 0) grid[y][x] = 12;
      }
      continue;
    }
    const gc = AX + cutOff(t);
    const gspan = Math.round(gh);
    for (let dy = -gspan; dy <= gspan; dy++) {
      const y = Math.round(gc + dy);
      if (y < 0 || y >= H || grid[y][x] < 0) continue;
      const f = Math.abs(dy) / Math.max(0.6, gh);
      let idx;
      if (st === 1) {
        idx = band(f, [[0.55, 7], [1.01, 8]]);                       // 붉은 살 조금
      } else if (st === 2) {
        idx = band(f, [[0.2, 10], [0.4, 5], [0.7, 6], [0.88, 7], [1.01, 8]]);   // 뼈 노출
      } else {
        // 반대쪽까지 벌어짐 — 가운데 그늘 + 척추뼈 마디, 위아래 살 단면
        idx = band(f, [[0.14, 12], [0.3, 5], [0.62, 5], [0.82, 6], [0.93, 7], [1.01, 8]]);
        if (f <= 0.14 && Math.round(x) % 7 === 0) idx = 10;          // 척추 마디
        if (f > 0.3 && f <= 0.62 && Math.round(x) % 11 === 0) idx = 9; // 근막 흰선
      }
      grid[y][x] = idx;
    }
  }

  // 머리 절단면 (등쪽=우측 / 배쪽=좌측) — 살 단면 노출
  const cutX = opts.headRight ? [X1 - 4, X1] : [X0, X0 + 4];
  for (let x = cutX[0]; x <= cutX[1]; x++) {
    const t = opts.headRight ? 1 : 0;
    const hh = halfAt(t);
    for (let dy = -Math.round(hh); dy <= Math.round(hh); dy++) {
      const y = Math.round(AX + dy);
      if (grid[y] && grid[y][x] >= 0) grid[y][x] = Math.abs(dy) / hh > 0.9 ? 3 : 13;
    }
  }
  // 꼬리 쪽 지느러미 흔적 (반대편 끝)
  const tailX = opts.headRight ? X0 + 4 : X1 - 4;
  for (let k = 0; k < 8; k++) {
    const y = Math.round(AX + (opts.skin === 'dorsal' ? 6 : 8) + k);
    const x = tailX + (opts.headRight ? k : -k);
    if (grid[y] && grid[y][x] !== undefined && grid[y][x] >= 0) grid[y][x] = 14;
  }
  return toSprite(W, H, pal, grid);
}

// ────────────────────────────────────────────────────────────
// 2면 덩어리 (척추뼈 붙은 살) — 1면 분리 후 남은 [척추뼈+2면 살]을 **옆에서** 본 뷰.
//  척추뼈가 도마 바닥에 깔리고 그 위에 2면 살이 얹힌 단면. 살-뼈 경계를 칼집으로 갈라
//  state 0(닫힘)→1(붉은 살 조금)→2(뼈 노출)→3(반대쪽까지 들림)으로 살이 뼈에서 들린다.
//  머리는 오른쪽(2면 등쪽 뷰 정합). (사용자 지시 2026-07-30 — 2면 전용 스프라이트)
// ────────────────────────────────────────────────────────────
function makeSpineFillet(opts) {
  const W = 128, H = 64;
  const X0 = 6, X1 = 120;
  const BOARD = 50;            // 척추뼈가 놓인 바닥 y
  const boneH = 5;             // 척추뼈 밴드 두께
  const grid = makeGrid(W, H);
  const st = opts.state;
  const pal = [
    0xf0cfc6, // 0 살 연분홍
    0xdca79c, // 1 살 중간
    0xb2544f, // 2 붉은 살
    0x7b2b2f, // 3 혈합육 라인
    0x2c4038, // 4 등 skin(살 바깥 상단)
    0x1e2e28, // 5 skin 중간
    0x0d1512, // 6 외곽 엣지
    0xe8e6de, // 7 척추뼈(밝은)
    0xc9c4b8, // 8 뼈 마디
    0xa8a49a, // 9 뼈 그늘
    0x1a1012, // 10 벌어진 틈 그늘
    0xf2ded2, // 11 절단면(들린 살 하단)
    0x223029, // 12 지느러미 흔적
    0xf7ece4, // 13 힘줄 흰선
  ];
  const fleshH = (t) => pw(t, opts.flesh);        // 살 두께 (t: 1=머리 우)
  // 들림 — 칼집 회차별 **점진 + 비대칭**: 1·2회는 머리(우)·등쪽부터 조금씩, 3회는 꼬리(좌)까지 전부.
  //  state 0 = 닫힘(껍질 덮인 살이 척추뼈에 붙어 연결). (사용자 지시 2026-07-31)
  const liftAt = (t) => {                          // t: 1=머리(우), 0=꼬리(좌)
    if (st <= 0) return 0;
    let env;
    if (st === 1) env = Math.max(0, (t - 0.5) / 0.5) ** 0.9;                        // 머리쪽만 아주 조금
    else if (st === 2) env = Math.max(0, (t - 0.22) / 0.78) ** 0.75;                // 머리~중간
    else env = Math.sin(Math.PI * Math.min(1, Math.max(0, (t + 0.03) / 0.97))) ** 0.4;  // 꼬리까지 전부
    const mx = st === 1 ? 3 : st === 2 ? 8 : 16;
    return env * mx;
  };
  const boneTop = BOARD - boneH;
  for (let x = X0; x <= X1; x++) {
    const tRaw = (x - X0) / (X1 - X0);
    const t = opts.headRight ? tRaw : 1 - tRaw;
    const fh = fleshH(t);
    if (fh < 1) continue;
    // ── 척추뼈 = 바닥 밴드 (고정) ──
    for (let y = boneTop; y <= BOARD; y++) {
      const by = (y - boneTop) / boneH;
      let idx = by < 0.4 ? 7 : by < 0.75 ? 8 : 9;
      if (Math.round(x) % 6 === 0 && by < 0.65) idx = 9;      // 척추 마디
      grid[y][x] = idx;
    }
    // ── 2면 살 블록 = 뼈 위, lift만큼 들림 ──
    const lift = liftAt(t);
    const fleshBot = boneTop - 1 - lift;
    const fleshTop = fleshBot - fh;
    for (let y = Math.round(fleshTop); y <= Math.round(fleshBot); y++) {
      if (y < 0 || y >= H) continue;
      const fy = (y - fleshTop) / Math.max(1, fleshBot - fleshTop);   // 0 상단 skin .. 1 하단(뼈쪽)
      let idx;
      // **껍질 덮인 살** — 겉면은 대부분 skin(등 껍질), 붉은 단면은 **뼈에서 들린 하단에서만** 노출.
      if (fy < 0.08) idx = 6;                                         // 외곽 엣지
      else if (fy < 0.55) idx = (Math.round(x) % 13 === 0 ? 5 : 4);   // 등 skin(바깥면)+미세 sheen
      else if (fy < 0.8) idx = 5;                                     // skin 하부(짙음)
      else idx = lift > 0.5                                           // 하단: 들렸으면 붉은 절단면, 아니면 skin(붙음)
        ? band((fy - 0.8) / 0.2, [[0.45, 0], [0.8, 1], [1.01, 2]])
        : 5;
      grid[y][x] = idx;
    }
    // ── 벌어진 틈 (살 하단 ↔ 뼈 상단) — 들린 만큼 그늘 ──
    if (lift > 1) {
      for (let y = Math.round(fleshBot) + 1; y < boneTop; y++) {
        if (y >= 0 && y < H) grid[y][x] = 10;
      }
    } else {
      // 닫힘/미세 들림 — 뼈-살 경계 칼선만 (연결된 상태)
      if (grid[boneTop - 1] && grid[boneTop - 1][x] >= 0) grid[boneTop - 1][x] = 10;
    }
  }
  // 머리 절단면 (끝단 살 단면)
  const cx = opts.headRight ? [X1 - 4, X1] : [X0, X0 + 4];
  for (let x = Math.max(X0, cx[0]); x <= Math.min(X1, cx[1]); x++) {
    for (let y = 0; y < boneTop; y++) if (grid[y][x] >= 0 && grid[y][x] <= 3) grid[y][x] = 11;
  }
  return toSprite(W, H, pal, grid);
}

// ────────────────────────────────────────────────────────────
// 어종군 파라미터 — 돔류(체고 높은 방추) / 방어류(가늘고 긴 방추)
// ────────────────────────────────────────────────────────────
const VENTRAL = {
  bream: {
    halfWidth: [[0, 0.5], [0.05, 2.4], [0.16, 7], [0.3, 12.4], [0.46, 12], [0.62, 9.4], [0.78, 5.6], [0.9, 3.4], [1, 2.4]],
    vent: 0.6, pect: [0.2, 0.36, 10], pelv: [0.42, 0.53, 6.5], caudal: 15,
  },
  amberjack: {
    halfWidth: [[0, 0.4], [0.05, 1.8], [0.16, 5.4], [0.3, 9], [0.46, 9.2], [0.62, 7.4], [0.78, 4.6], [0.9, 2.8], [1, 2]],
    vent: 0.63, pect: [0.18, 0.34, 12], pelv: [0.4, 0.5, 6], caudal: 18,
  },
};
const CAVITY = {
  bream: { halfHeight: [[0, 21], [0.14, 24], [0.34, 20.5], [0.55, 14.5], [0.75, 8.5], [0.9, 5], [1, 2.5]], ribs: 7 },
  amberjack: { halfHeight: [[0, 18], [0.14, 21], [0.34, 18.5], [0.55, 13.5], [0.75, 8], [0.9, 4.5], [1, 2.5]], ribs: 8 },
};

/** 장뜨기 뷰 — 머리 절단 트렁크 반높이 프로필 (t: 0=꼬리 → 1=머리 절단면) */
const TRUNK = {
  bream: [[0, 3.5], [0.1, 7.5], [0.25, 14], [0.45, 19.5], [0.65, 23.5], [0.85, 26], [1, 26.5]],
  amberjack: [[0, 3], [0.1, 6], [0.25, 11], [0.45, 15.5], [0.65, 19], [0.85, 22], [1, 23]],
};

/** 2면 덩어리 — 척추뼈 위에 얹힌 2면 살 두께 프로필 (t: 0=꼬리 → 1=머리) */
const SPINE_FLESH = {
  bream: [[0, 5], [0.12, 12], [0.3, 22], [0.5, 30], [0.7, 34], [0.88, 36], [1, 36]],
  amberjack: [[0, 4], [0.12, 9], [0.3, 16], [0.5, 22], [0.7, 26], [0.88, 28], [1, 28]],
};

const out = {};
for (const fam of ['bream', 'amberjack']) {
  out[`${fam}_ventral`] = makeVentral(VENTRAL[fam]);
  out[`${fam}_cavity`] = makeCavity(CAVITY[fam]);
  for (let st = 0; st <= 3; st++) {
    // 등쪽 = 머리 오른쪽 / 배쪽 = 꼬리 오른쪽(머리 왼쪽)
    out[`${fam}_dorsal${st}`] = makeFilletCut({
      skin: 'dorsal', headRight: true, state: st, cutOffset: 0.24, halfHeight: TRUNK[fam],
    });
    out[`${fam}_belly${st}`] = makeFilletCut({
      skin: 'belly', headRight: false, state: st, cutOffset: 0.2, halfHeight: TRUNK[fam],
    });
    // 2면 덩어리 (척추뼈 붙은 살) — 1면 분리 후 [척추뼈+살] 측면 뷰 (머리 우)
    out[`${fam}_spine${st}`] = makeSpineFillet({ headRight: true, state: st, flesh: SPINE_FLESH[fam] });
  }
}

const header = `/**
 * @file PixelFishViews.ts
 * @description 손질 전용 뷰 도트 스프라이트 (자동 생성 — 수동 편집 금지)
 *
 * 생성: node tools/gen_butchery_views.cjs
 *  {fam}_ventral   — 뱃살을 정면으로 바라본 복면 뷰 (배따기·내장 꺼내기)
 *  {fam}_cavity    — 내장을 제거한 체강을 위에서 들여다본 탑뷰 (핏줄 긁기·뱃속 세척)
 *  {fam}_dorsal0~3 — 등을 카메라 쪽으로 눕힌 장뜨기 뷰(머리 우) · 칼집 벌어짐 4단계
 *  {fam}_belly0~3  — 배를 카메라 쪽으로 눕힌 장뜨기 뷰(꼬리 우) · 칼집 벌어짐 4단계
 *
 * 실사 사진이 준비되면 tools/pixelize_butchery.cjs 로 같은 키를 생성해 덮어쓴다
 * (PixelButcherFish가 사진 레지스트리 FISH_STAGE_SPRITES를 먼저 조회).
 */

import type { PixelFishSprite } from './PixelFishSprites.js';

export const FISH_VIEW_SPRITES: Record<string, PixelFishSprite> = `;

const body = JSON.stringify(out, null, 2)
  .replace(/"(w|h|cellPx|palette|rows)":/g, '$1:')
  .replace(/\[\s+((?:\s*-?\d+,?\s*)+)\]/g, (m, g) => `[${g.replace(/\s+/g, ' ').trim()}]`);
const pretty = body.replace(/palette: \[([^\]]+)\]/g, (m, nums) => `palette: [${nums.split(',').map((n) => `0x${(+n).toString(16).padStart(6, '0')}`).join(', ')}]`);

const dest = path.join(__dirname, '..', 'packages', 'client-pc', 'src', 'data', 'PixelFishViews.ts');
fs.writeFileSync(dest, `${header}${pretty};\n`, 'utf8');
console.log('wrote', dest);
for (const k of Object.keys(out)) {
  const s = out[k];
  const filled = s.rows.reduce((a, r) => a + (r.length - r.split('.').length + 1), 0);
  console.log(`  ${k}: ${s.w}x${s.h} pal=${s.palette.length} filled=${filled}`);
}
