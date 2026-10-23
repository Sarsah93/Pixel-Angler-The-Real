/**
 * @file face_layers.cjs
 * @description 271차 — 주인공 얼굴 초상을 **층**으로 굽는다
 *  (사용자 「기본 얼굴형에 머리/수염/입을 변경하는 것으로 적용해야지, 하나하나 케이스별로 다 뽑는 건 의미가 없지 않을까」).
 *  한 장에 납작하게 그린 판을 색 규칙으로 가르던 방식(268~270)은 경계마다 추측이라 색 조합마다 새 결함이 났다
 *  (흰 머리 + 밝은 피부의 구레나룻 · 잿빛 수염 가장자리의 전이 픽셀). 층은 픽셀의 주인이 그림에 박혀 있다 —
 *  기본 머리(민머리 · 민낯 · 성별 × 얼굴형 3) + 머리 모양 층(성별 × 8) + 수염 층(남 × 얼굴형 3). 입 · 홍조는 코드(269).
 *
 *  입력 = `tools/gemini_face_art.cjs --set layers`가 뽑은 원판(1024px · 흰 배경):
 *    base_<m|f>_<oval|round|square> · hair_<m|f>_<머리 모양> · beard_m_<얼굴형>. 앞 판을 같은 인물 앵커로 뽑아 자리가 거의 같다
 *    (271 시범 실측 — 이동 0 · 배율 1.000 · 눈~입 평균 차 6.5/255 · 코~턱 차이 픽셀 0.29%).
 *
 *  절차(성별마다):
 *   1. 배경 벗기기(테두리 BFS) → 번짐 벗기기 → 계란형 기본판 틀에 **정렬**(이동 · 배율 탐색 · 눈~입 구역 차 최소). 얼굴형 판 · 머리 판은 계란형 기본판에,
 *      수염 판은 (정렬한) 그 얼굴형 기본판에 맞춘다.
 *   2. 틀 = 정렬한 기본 · 머리 판의 합집합 상자를 정사각으로(아래 = 어깨선 · 가로 가운데 · 위 · 양옆 여백 2% — 수염 판은 틀에 안 넣는다). 전부 같은 틀로 96칸(셀 2px = 192px)에 굽는다 —
 *      같은 틀이라 바뀌지 않은 곳은 같은 칸이 된다.
 *   3. 머리 · 수염 층 = 앵커 판과의 차이(알파가 다르거나 채널 차 > 40) → 열기 2px · 성분 ≥ 400px · 닫기 2px → 칸 덮임 ≥ 50%인 칸만.
 *      피부 칸에 맞닿은 층 테두리는 조금 어둡게(RIM — 흰 머리 + 밝은 피부도 갈라진다).
 *   4. 기본판 라벨 마스크 = 피부 · 눈썹 · 눈동자 · 입술 · 흰자(건드리지 않음)를 색으로 구운 PNG(`<키>_mask.png`). 자동 분류 뒤
 *      `tools/face_layer_fixes.json`(키 → 사각형 · 라벨 목록)으로 손 고정 — 한 번 고치면 다시 안 본다. 게임은 이 마스크와 층 알파로만 칠한다.
 *   5. `--install` → packages/client-pc/public/faces/layers/<키>.png + src/data/FaceLayers.ts(자동 목록 — 부팅이 `facelayer_<키>`로 싣는다).
 *
 *  사용:
 *    node tools/face_layers.cjs --src <원판 폴더> --preview <폴더>      # 정렬 · 층 · 마스크 → 미리보기(기본색 합성 · 마스크 겹침 · 차이 통계)
 *    node tools/face_layers.cjs --src <원판 폴더> --install [--preview <폴더>]
 *    [--only base_m_oval,hair_m_short] [--sex m|f]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LAYERS_DIR = path.join(ROOT, 'packages', 'client-pc', 'public', 'faces', 'layers');
const MANIFEST = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'FaceLayers.ts');
const FIXES = path.join(ROOT, 'tools', 'face_layer_fixes.json');
const CORE = path.join(ROOT, 'packages', 'core', 'dist', 'index.js');
const { decode, encode } = require('./lib_png.cjs');
const { cutoutMulti } = require('./gemini_tackle_art.cjs');
const { peelFringe, regrid } = require('./gemini_fish_art.cjs');

const CELLS = 96, CELL = 2;          // 설치 판과 같은 밀도(192px)
const BG_TOL = 30;                   // 배경 벗기기 허용
const DIFF_T = 40;                   // 층 차이 — 채널 차 상한
const OPEN_R = 2, CLOSE_R = 2;       // 차이 마스크 열기 · 닫기 반지름(1024px)
const COMP_MIN = 400;                // 차이 성분 최소 픽셀(1024px — 2px 셀 약 100칸의 1/4)
const CELL_COVER = 0.5;              // 칸 덮임 하한
const RIM = 0.8;                     // 피부에 맞닿은 층 테두리 어둡기
const FRAME_MARGIN = 0.02;           // 틀 여백(위 · 양옆 — 상투 · 묶은 머리가 틀에 닿지 않게. 아래는 어깨선 그대로)
const ALIGN = { dx: 16, dy: 16, step: 4, scales: [0.98, 0.99, 1, 1.01, 1.02] };
/** 마스크 색(게임 `ui/FaceRecolor.ts` MASK_COLORS와 같다) */
const MASK = { skin: [0, 224, 255], brow: [255, 128, 0], eye: [0, 255, 64], lips: [255, 80, 160], white: [255, 255, 255] };
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const split = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

function parseArgs(argv) {
  const P = { src: '', preview: '', install: false, only: null, sex: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === '--src') P.src = path.resolve(next());
    else if (a === '--preview') P.preview = path.resolve(next());
    else if (a === '--install') P.install = true;
    else if (a === '--only') P.only = new Set(next().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--sex') P.sex = next();
    else throw new Error(`모르는 인자: ${a}`);
  }
  if (!P.src) throw new Error('--src <원판 폴더>');
  return P;
}

/** 원판 한 장 — 배경 벗기기 · 번짐 벗기기 · 알파 상자 */
function loadPlate(file) {
  const im = decode(file);
  const cut = cutoutMulti({ w: im.w, h: im.h, data: Buffer.from(im.data) }, BG_TOL, false, false);
  const d = cut.data;
  peelFringe(d, im.w, im.h);
  for (let i = 0; i < im.w * im.h; i++) if (d[i * 4 + 3] === 0) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0;
  return { w: im.w, h: im.h, d, bbox: bboxOf(d, im.w, im.h) };
}
function bboxOf(d, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, bw: x1 - x0 + 1, bh: y1 - y0 + 1 };
}

/**
 * 정렬 — `plate`를 `ref` 틀에 맞춘다(ref 좌표 (x, y)는 plate의 (x·s + dx, y·s + dy)). 눈~입 구역(ref 상자의 가로 0.28~0.72 · 세로 0.36~0.70)의
 * 평균 채널 차가 가장 작은 이동 · 배율. 머리카락이 오지 않는 자리라 민머리 ↔ 머리 판에도 맞는다. 돌려준 판은 ref와 같은 크기.
 */
function alignTo(ref, plate) {
  const bb = ref.bbox;
  const roi = { x0: bb.x0 + bb.bw * 0.28, x1: bb.x0 + bb.bw * 0.72, y0: bb.y0 + bb.bh * 0.36, y1: bb.y0 + bb.bh * 0.70 };
  const w = ref.w, h = ref.h;
  const cost = (s, dx, dy, step) => {
    let sum = 0, n = 0;
    for (let y = roi.y0; y < roi.y1; y += step) for (let x = roi.x0; x < roi.x1; x += step) {
      const ob = ((y | 0) * w + (x | 0)) * 4;
      if (ref.d[ob + 3] === 0) continue;
      const sx = Math.round(x * s + dx), sy = Math.round(y * s + dy);
      n++;
      if (sx < 0 || sy < 0 || sx >= plate.w || sy >= plate.h || plate.d[(sy * plate.w + sx) * 4 + 3] === 0) { sum += 120; continue; }
      const oh = (sy * plate.w + sx) * 4;
      sum += (Math.abs(ref.d[ob] - plate.d[oh]) + Math.abs(ref.d[ob + 1] - plate.d[oh + 1]) + Math.abs(ref.d[ob + 2] - plate.d[oh + 2])) / 3;
    }
    return n ? sum / n : 1e9;
  };
  let best = { c: 1e9, s: 1, dx: 0, dy: 0 };
  for (const s of ALIGN.scales) for (let dy = -ALIGN.dy; dy <= ALIGN.dy; dy += ALIGN.step) for (let dx = -ALIGN.dx; dx <= ALIGN.dx; dx += ALIGN.step) {
    const c = cost(s, dx, dy, 4); if (c < best.c) best = { c, s, dx, dy };
  }
  const co = { ...best };
  for (const s of [co.s - 0.005, co.s, co.s + 0.005]) for (let dy = co.dy - 3; dy <= co.dy + 3; dy++) for (let dx = co.dx - 3; dx <= co.dx + 3; dx++) {
    const c = cost(s, dx, dy, 2); if (c < best.c) best = { c, s, dx, dy };
  }
  const d = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.round(x * best.s + best.dx), sy = Math.round(y * best.s + best.dy);
    if (sx < 0 || sy < 0 || sx >= plate.w || sy >= plate.h) continue;
    const o = (sy * plate.w + sx) * 4; if (plate.d[o + 3] === 0) continue;
    const q = (y * w + x) * 4; d[q] = plate.d[o]; d[q + 1] = plate.d[o + 1]; d[q + 2] = plate.d[o + 2]; d[q + 3] = 255;
  }
  return { w, h, d, bbox: bboxOf(d, w, h), fit: { s: best.s, dx: best.dx, dy: best.dy, cost: best.c, cost0: cost(1, 0, 0, 2) } };
}

/** 차이 마스크(앵커 틀 1024px) — 알파 다름 또는 채널 차 > DIFF_T → 열기 · 성분 거르기 · 닫기 */
function diffMask(ref, plate) {
  const w = ref.w, h = ref.h, n = w * h, m = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4, aR = ref.d[o + 3] > 0, aP = plate.d[o + 3] > 0;
    if (aR !== aP) { m[i] = 1; continue; }
    if (aP && Math.max(Math.abs(ref.d[o] - plate.d[o]), Math.abs(ref.d[o + 1] - plate.d[o + 1]), Math.abs(ref.d[o + 2] - plate.d[o + 2])) > DIFF_T) m[i] = 1;
  }
  let out = dilate(erode(m, w, h, OPEN_R), w, h, OPEN_R);
  out = keepComponents(out, w, h, COMP_MIN);
  out = erode(dilate(out, w, h, CLOSE_R), w, h, CLOSE_R);
  return out;
}
function erode(m, w, h, r) { return minmax(m, w, h, r, true); }
function dilate(m, w, h, r) { return minmax(m, w, h, r, false); }
function minmax(m, w, h, r, isMin) {
  const t = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = isMin ? 1 : 0;
    for (let k = -r; k <= r; k++) { const xx = x + k; const s = xx < 0 || xx >= w ? (isMin ? 0 : 0) : m[y * w + xx]; v = isMin ? Math.min(v, s) : Math.max(v, s); }
    t[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = isMin ? 1 : 0;
    for (let k = -r; k <= r; k++) { const yy = y + k; const s = yy < 0 || yy >= h ? 0 : t[yy * w + x]; v = isMin ? Math.min(v, s) : Math.max(v, s); }
    out[y * w + x] = v;
  }
  return out;
}
function keepComponents(m, w, h, minSize) {
  const n = w * h, seen = new Uint8Array(n), out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!m[i] || seen[i]) continue;
    const st = [i], mem = []; seen[i] = 1;
    while (st.length) {
      const p = st.pop(); mem.push(p); const x = p % w, y = (p / w) | 0;
      if (x > 0 && m[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; st.push(p - 1); }
      if (x < w - 1 && m[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; st.push(p + 1); }
      if (y > 0 && m[p - w] && !seen[p - w]) { seen[p - w] = 1; st.push(p - w); }
      if (y < h - 1 && m[p + w] && !seen[p + w]) { seen[p + w] = 1; st.push(p + w); }
    }
    if (mem.length >= minSize) for (const p of mem) out[p] = 1;
  }
  return out;
}

/** 틀(정사각 · 아래 = 어깨선)로 잘라 96칸에 굽는다 — `mask`를 주면 칸마다 덮임 비율도 돌려준다 */
function bake(plate, frame, mask) {
  const side = frame.side, sq = Buffer.alloc(side * side * 4);
  const cover = mask ? new Float32Array(CELLS * CELLS) : null, cnt = mask ? new Float32Array(CELLS * CELLS) : null;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const sx = frame.x0 + x, sy = frame.y0 + y;
    const cx = Math.min(CELLS - 1, Math.floor(x * CELLS / side)), cy = Math.min(CELLS - 1, Math.floor(y * CELLS / side));
    if (cnt) cnt[cy * CELLS + cx]++;
    if (sx < 0 || sy < 0 || sx >= plate.w || sy >= plate.h) continue;
    const o = (sy * plate.w + sx) * 4; if (plate.d[o + 3] === 0) continue;
    const q = (y * side + x) * 4; sq[q] = plate.d[o]; sq[q + 1] = plate.d[o + 1]; sq[q + 2] = plate.d[o + 2]; sq[q + 3] = 255;
    if (mask && mask[sy * plate.w + sx]) cover[cy * CELLS + cx]++;
  }
  const g = regrid(sq, side, side, CELLS, CELL);
  if (cover) for (let i = 0; i < cover.length; i++) cover[i] = cnt[i] ? cover[i] / cnt[i] : 0;
  return { w: g.w, h: g.h, data: g.data, cover };
}

/** 층 판 = 구운 판에서 덮임 ≥ 50%인 칸만 남기고, 기본판의 다른 칸과 맞닿은 테두리는 RIM만큼 어둡게 */
function layerFrom(baked, base) {
  const { w, h } = baked, out = Buffer.alloc(w * h * 4); out.fill(0);
  const on = new Uint8Array(CELLS * CELLS);
  for (let cy = 0; cy < CELLS; cy++) for (let cx = 0; cx < CELLS; cx++) {
    const i = cy * CELLS + cx; if (baked.cover[i] < CELL_COVER) continue;
    const o = ((cy * CELL) * w + cx * CELL) * 4; if (baked.data[o + 3] === 0) continue;
    if (Math.min(baked.data[o], baked.data[o + 1], baked.data[o + 2]) >= 246) continue;   // 머리칼 사이에 갇힌 흰 배경(270(2)) — 층에서는 비운다
    on[i] = 1;
  }
  let cells = 0, rim = 0;
  for (let cy = 0; cy < CELLS; cy++) for (let cx = 0; cx < CELLS; cx++) {
    const i = cy * CELLS + cx; if (!on[i]) continue;
    cells++;
    let edge = false;
    for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
      if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS || on[ny * CELLS + nx]) continue;
      if (base.data[((ny * CELL) * w + nx * CELL) * 4 + 3] > 0) { edge = true; break; }
    }
    if (edge) rim++;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const o = ((cy * CELL + y) * w + cx * CELL + x) * 4;
      const k = edge ? RIM : 1;
      out[o] = Math.round(baked.data[o] * k); out[o + 1] = Math.round(baked.data[o + 1] * k); out[o + 2] = Math.round(baked.data[o + 2] * k); out[o + 3] = 255;
    }
  }
  return { w, h, data: out, cells, rim };
}

/**
 * 기본판 라벨 마스크(192px) — 민머리 · 민낯이라 색 규칙이 단순하다: 흰자(밝고 무채 · 어두운 눈동자에 붙은 작은 조각) · 눈동자(흰자 줄의 어두운 덩어리 · 2px 열림) ·
 * 눈썹(흰자 위 · 납작 · 어두운 머리색 조각) · 입술(아래 얼굴의 분홍 · 입술 선) · 피부(그 밖의 따뜻한 픽셀 — 그늘 포함). 윤곽선(L < 34) · 옷은 없음.
 */
function classifyBase(baked, core) {
  const { w, h, data } = baked, n = w * h;
  const label = new Uint8Array(n);   // 1 skin 2 brow 3 eye 4 lips 5 white
  const Ls = new Float32Array(n), alive = new Uint8Array(n);
  const skin = split(core.SKIN_TONES[PLAYER_BASE.skin]), hair = split(core.HAIR_COLORS[PLAYER_BASE.hair]);
  const sL = lum(...skin), hL = lum(...hair);
  const sC = skin.map((v) => v / sL), hC = hair.map((v) => v / hL);
  const dist = (o, L, C) => Math.hypot(data[o] / L - C[0], data[o + 1] / L - C[1], data[o + 2] / L - C[2]);
  const tol = (L) => 0.13 + (L < 60 ? 0.12 * (60 - L) / 60 : 0);
  const dSkin = new Float32Array(n), dHair = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4; if (data[o + 3] === 0) continue;
    alive[i] = 1; const L = Math.max(1, lum(data[o], data[o + 1], data[o + 2])); Ls[i] = L;
    dSkin[i] = dist(o, L, sC); dHair[i] = dist(o, L, hC);
  }
  const comps = (mask, conn8) => {
    const seen = new Uint8Array(n), out = [];
    for (let i = 0; i < n; i++) {
      if (!mask[i] || seen[i]) continue;
      const st = [i], mem = []; seen[i] = 1; let minX = w, maxX = 0, minY = h, maxY = 0, sumL = 0;
      while (st.length) {
        const p = st.pop(); mem.push(p); const x = p % w, y = (p / w) | 0; sumL += Ls[p];
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; if (!conn8 && dx && dy) continue;
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx; if (mask[q] && !seen[q]) { seen[q] = 1; st.push(q); }
        }
      }
      out.push({ mem, minX, maxX, minY, maxY, size: mem.length, meanL: sumL / mem.length });
    }
    return out;
  };
  const near = (mask, r) => dilate(mask, w, h, r);
  // 1) 흰자 — 밝고 무채(L > 170 · 채널 폭 < 45) 작은 조각(2~80px)이 얼굴 상자 안에서 어두운(L < 80) 픽셀에 2px 안으로 붙어 있다
  const dark = new Uint8Array(n), brightFlat = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!alive[i]) continue; const o = i * 4; const sp = Math.max(data[o], data[o + 1], data[o + 2]) - Math.min(data[o], data[o + 1], data[o + 2]);
    if (Ls[i] < 80) dark[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (Ls[i] > 170 && sp < 45 && x > w * 0.2 && x < w * 0.8 && y > h * 0.28 && y < h * 0.64) brightFlat[i] = 1;
  }
  const nearDark = near(dark, 2);
  const white = new Uint8Array(n); let wMin = h, wMax = 0; const whites = [];
  for (const c of comps(brightFlat, true)) {
    if (c.size < 2 || c.size > 80) continue;
    if (!c.mem.some((p) => nearDark[p])) continue;
    for (const p of c.mem) { white[p] = 1; label[p] = 5; }
    if (c.minY < wMin) wMin = c.minY; if (c.maxY > wMax) wMax = c.maxY;
    whites.push(c);
  }
  // 2) 눈동자 — 흰자 성분마다 창(가로 ±3 · 세로 -1 ~ +2)을 두고 그 안의 어두운 픽셀 덩어리(≥ 4px) 중 흰자에 1px 안으로 붙은 것(열기는 안 한다 — 가는 눈의 눈동자가 사라진다)
  const nearWhite1 = near(white, 1);
  for (const wc of whites) {
    const win = new Uint8Array(n);
    for (let y = wc.minY - 1; y <= wc.maxY + 2; y++) for (let x = wc.minX - 3; x <= wc.maxX + 3; x++) { if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = y * w + x; if (dark[i] && !white[i]) win[i] = 1; }
    for (const c of comps(win, true)) { if (c.size < 4 || !c.mem.some((p) => nearWhite1[p])) continue; for (const p of c.mem) label[p] = 3; }
  }
  // 3) 눈썹 — 머리색 조각(색조 거리 < 허용 · L ≤ 110)이 흰자 위(2px 이상) · 납작(가로 ≥ 세로 · 세로 ≤ 0.07h) · ≥ 12px · 평균 L ≤ 90
  const hairish = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (alive[i] && !label[i] && Ls[i] >= 34 && Ls[i] <= 110 && dHair[i] < tol(Ls[i])) hairish[i] = 1;
  for (const c of comps(hairish, true)) {
    const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
    const ok = c.size >= 12 && bw >= bh && bh <= h * 0.07 && c.maxY < wMin - 2 && c.minY > h * 0.2 && c.meanL <= 90 && c.minX > w * 0.2 && c.maxX < w * 0.85;
    if (ok) for (const p of c.mem) label[p] = 2;
  }
  // 4) 입술 — 창(가로 0.35~0.78 · 세로 0.56~0.80) 안의 입술 선(어두운 붉은 갈색 · 가로 8~30 · 세로 ≤ 8 · 가장 넓고 가운데에 가까운 성분)을 찾고
  //    그 둘레(가로 ±2 · 위 5 · 아래 7)의 분홍(r−g ≥ 35 · g−b ≤ 0.45(r−g) · L < 215) · 선 픽셀만 입술로 — 턱선 · 옷깃의 붉은 어두운 줄은 창 밖이거나 세로로 길다
  const line = new Uint8Array(n), pink = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!alive[i] || label[i]) continue; const x = i % w, y = (i / w) | 0;
    if (x < w * 0.35 || x > w * 0.78 || y < h * 0.56 || y > h * 0.80) continue;
    const o = i * 4, r = data[o], g = data[o + 1], b = data[o + 2], L = Ls[i];
    if (L < 215 && r - g >= 35 && g - b <= 0.45 * (r - g)) pink[i] = 1;
    if (L < 140 && r - g >= 28 && g - b <= 18 && r - b >= 38) line[i] = 1;
  }
  let best = null; const cx0 = w * 0.565, cy0 = h * 0.68;
  for (const c of comps(line, true)) {
    const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
    if (bw < 8 || bw > 30 || bh > 8) continue;
    const d = Math.hypot(((c.minX + c.maxX) / 2 - cx0) / w, (((c.minY + c.maxY) / 2 - cy0) / h) * 0.7);
    if (!best || bw > best.bw + 6 || (bw >= best.bw - 6 && d < best.d)) best = { ...c, bw, d };
  }
  if (best) {
    for (let y = best.minY - 5; y <= best.maxY + 7; y++) for (let x = best.minX - 2; x <= best.maxX + 2; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = y * w + x; if (pink[i] || line[i]) label[i] = 4;
    }
  } else console.log('  입술 선을 못 찾았다 — 손 고정 필요');
  // 5) 피부 — 남은 따뜻한 픽셀(피부 색조 < 0.30 또는 머리 색조 < 0.25 — 그늘) · L ≥ 34. 옷(파랑) · 윤곽선은 없음
  for (let i = 0; i < n; i++) if (alive[i] && !label[i] && Ls[i] >= 34 && (dSkin[i] < 0.30 || dHair[i] < 0.25)) label[i] = 1;
  return label;
}

const LABEL_ID = { skin: 1, brow: 2, eye: 3, lips: 4, white: 5, none: 0 };
const LABEL_NAME = ['none', 'skin', 'brow', 'eye', 'lips', 'white'];
function applyFixes(label, w, h, fixes) {
  let n = 0;
  for (const f of fixes ?? []) {
    const id = LABEL_ID[f.label]; if (id === undefined) throw new Error(`모르는 라벨: ${f.label}`);
    for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) { if (x < 0 || y < 0 || x >= w || y >= h) continue; label[y * w + x] = id; n++; }
  }
  return n;
}
function maskPng(label, w, h, base) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (base.data[i * 4 + 3] === 0 || !label[i]) continue;
    const c = MASK[LABEL_NAME[label[i]]]; out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
  }
  return out;
}

/** 기본색 합성(미리보기) — 기본 + 수염 + 머리 */
function composite(base, ...layers) {
  const { w, h } = base, out = Buffer.from(base.data);
  for (const l of layers) if (l) for (let i = 0; i < w * h; i++) if (l.data[i * 4 + 3] > 0) l.data.copy(out, i * 4, i * 4, i * 4 + 4);
  return { w, h, data: out };
}
function overlayMask(base, label) {
  const { w, h } = base, out = Buffer.from(base.data);
  for (let i = 0; i < w * h; i++) { if (!label[i]) continue; const c = MASK[LABEL_NAME[label[i]]]; const o = i * 4; out[o] = Math.round(out[o] * 0.45 + c[0] * 0.55); out[o + 1] = Math.round(out[o + 1] * 0.45 + c[1] * 0.55); out[o + 2] = Math.round(out[o + 2] * 0.45 + c[2] * 0.55); }
  return { w, h, data: out };
}

function writeManifest(keys) {
  const lines = [
    '/**',
    ' * @file FaceLayers.ts',
    ' * @description 271차 — 주인공 얼굴 **층** 목록(자동 생성 — `node tools/face_layers.cjs --install`). 손으로 고치지 말 것.',
    ' *  BootScene이 `faces/layers/<키>.png`(192×192 · 셀 2px)를 `facelayer_<키>`로 싣고, `ui/FacePhoto.ts`가 기본 머리(민머리 · 민낯) 위에 수염 · 머리 모양 층을 겹쳐',
    ' *  생성 옵션(피부 · 머리색 · 눈 · 수염 색 · 입 · 홍조)대로 칠한다(`ui/FaceRecolor.ts composePlayerFace` — 마스크 · 층 알파로만 칠하고 색 규칙 추측은 없다).',
    ' *  키 = base_<m|f>_<oval|round|square>(+ `_mask` 라벨 마스크) · hair_<m|f>_<머리 모양> · beard_m_<얼굴형>.',
    ' */',
    'export const FACE_LAYERS: readonly string[] = [',
    ...keys.map((k) => `  '${k}',`),
    '];',
    '',
  ];
  fs.writeFileSync(MANIFEST, lines.join('\n'));
  console.log(`${path.relative(ROOT, MANIFEST)}: ${keys.length}키`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(CORE)) throw new Error('core dist가 없다 — npx pnpm --filter @tra/core run build');
  const core = await import(CORE);
  const fixes = fs.existsSync(FIXES) ? JSON.parse(fs.readFileSync(FIXES, 'utf8')) : {};
  const files = fs.readdirSync(P.src).filter((f) => /^(base|hair|beard)_[mf]_[a-z]+\.png$/.test(f)).map((f) => f.slice(0, -4)).sort();
  const sexes = P.sex ? [P.sex] : ['m', 'f'];
  const outPlates = {};   // key → { w, h, data, kind }
  const stats = [];
  if (P.preview) fs.mkdirSync(P.preview, { recursive: true });
  for (const sex of sexes) {
    const ovalKey = `base_${sex}_oval`;
    if (!files.includes(ovalKey)) { console.log(`${ovalKey} 없음 — ${sex} 건너뜀`); continue; }
    const keys = files.filter((k) => k.split('_')[1] === sex && (!P.only || P.only.has(k) || k === ovalKey || (k.startsWith('base_') && P.only.has(`beard_${sex}_${k.split('_')[2]}`))));
    const oval = loadPlate(path.join(P.src, `${ovalKey}.png`));
    const aligned = { [ovalKey]: { ...oval, fit: { s: 1, dx: 0, dy: 0, cost: 0, cost0: 0 } } };
    // 1) 정렬 — 얼굴형 · 머리 판은 계란형에, 수염 판은 그 얼굴형 판에
    for (const k of keys) {
      if (k === ovalKey) continue;
      const plate = loadPlate(path.join(P.src, `${k}.png`));
      const refKey = k.startsWith('beard_') ? `base_${sex}_${k.split('_')[2]}` : ovalKey;
      if (!aligned[refKey]) {
        if (!files.includes(refKey)) { console.log(`${k}: 앵커 ${refKey} 없음 — 건너뜀`); continue; }
        aligned[refKey] = alignTo(oval, loadPlate(path.join(P.src, `${refKey}.png`)));
      }
      aligned[k] = alignTo(aligned[refKey], plate);
      const f = aligned[k].fit;
      console.log(`${k}: 정렬 → ${refKey} 배율 ${f.s.toFixed(3)} 이동 ${f.dx},${f.dy} · 눈~입 차 ${f.cost.toFixed(1)}(정렬 전 ${f.cost0.toFixed(1)})`);
    }
    // 2) 틀 — 합집합 상자 → 정사각(아래 = 어깨선 · 가로 가운데)
    let ux0 = oval.w, uy0 = oval.h, ux1 = -1, uy1 = -1;
    // 수염 판은 틀에 안 넣는다(271(2)) — 수염은 머리 · 어깨 안에 있고, 뒤에 뽑은 판의 어깨 선 1~3px 차이가 틀을 밀어 설치된 층 전부를 바꾼다
    for (const [k, a] of Object.entries(aligned)) { if (k.startsWith('beard_')) continue; const b = a.bbox; if (b.x0 < ux0) ux0 = b.x0; if (b.y0 < uy0) uy0 = b.y0; if (b.x1 > ux1) ux1 = b.x1; if (b.y1 > uy1) uy1 = b.y1; }
    const bw = ux1 - ux0 + 1, bh = uy1 - uy0 + 1, pad = Math.round(Math.max(bw, bh) * FRAME_MARGIN), side = Math.max(bw + 2 * pad, bh + pad);
    const frame = { side, x0: Math.round(ux0 - (side - bw) / 2), y0: uy1 - side + 1 };
    console.log(`${sex}: 틀 ${side}px (상자 ${bw}×${bh} · 왼쪽 위 ${frame.x0},${frame.y0}) → ${CELLS}칸`);
    // 3) 굽기 — 기본판 → 마스크 · 머리 · 수염 → 층
    const baked = {};
    for (const [k, a] of Object.entries(aligned)) if (k.startsWith('base_')) {
      baked[k] = bake(a, frame);
      const label = classifyBase(baked[k], core);
      const fixed = applyFixes(label, baked[k].w, baked[k].h, fixes[k]);
      const cnt = [0, 0, 0, 0, 0, 0]; for (const l of label) cnt[l]++;
      console.log(`${k}: 마스크 — 피부 ${cnt[1]} · 눈썹 ${cnt[2]} · 눈동자 ${cnt[3]} · 입술 ${cnt[4]} · 흰자 ${cnt[5]}${fixed ? ` · 손 고정 ${fixed}px` : ''}`);
      outPlates[k] = { ...baked[k], kind: 'base', label };
      outPlates[`${k}_mask`] = { w: baked[k].w, h: baked[k].h, data: maskPng(label, baked[k].w, baked[k].h, baked[k]), kind: 'mask' };
      if (P.preview) encode(baked[k].w, baked[k].h, overlayMask(baked[k], label).data, path.join(P.preview, `${k}_mask_overlay.png`));
    }
    for (const [k, a] of Object.entries(aligned)) if (!k.startsWith('base_')) {
      const refKey = k.startsWith('beard_') ? `base_${sex}_${k.split('_')[2]}` : ovalKey;
      const m = diffMask(aligned[refKey], a);
      const b = bake(a, frame, m);
      const layer = layerFrom(b, baked[refKey]);
      // 얼굴 아래쪽(코~턱 · 기본판 상자 가로 0.25~0.75 · 세로 0.46~0.82) 차이 = 잡음 지표(머리 층이면 0에 가까워야 한다)
      const rb = aligned[refKey].bbox; let low = 0, lowD = 0;
      for (let y = Math.round(rb.y0 + rb.bh * 0.46); y < rb.y0 + rb.bh * 0.82; y++) for (let x = Math.round(rb.x0 + rb.bw * 0.25); x < rb.x0 + rb.bw * 0.75; x++) { const i = y * a.w + x; if (aligned[refKey].d[i * 4 + 3] === 0) continue; low++; if (m[i]) lowD++; }
      const note = `${k}: 층 ${layer.cells}칸(테 ${layer.rim}) · 코~턱 차이 ${(100 * lowD / Math.max(1, low)).toFixed(2)}%`;
      console.log(note); stats.push(note);
      outPlates[k] = { ...layer, kind: k.startsWith('beard_') ? 'beard' : 'hair' };
      if (P.preview) encode(layer.w, layer.h, composite(baked[refKey], layer).data, path.join(P.preview, `${k}_on_base.png`));
    }
    if (P.preview) {
      const beard = Object.keys(outPlates).filter((k) => k.startsWith('beard_'));
      for (const bk of beard) {
        const shape = bk.split('_')[2];
        const hairKey = Object.keys(outPlates).find((k) => k === `hair_${sex}_long`) ?? Object.keys(outPlates).find((k) => k.startsWith(`hair_${sex}_`));
        if (hairKey) encode(192, 192, composite(baked[`base_${sex}_${shape}`], outPlates[bk], outPlates[hairKey]).data, path.join(P.preview, `${bk}_${hairKey}.png`));
      }
    }
  }
  if (P.preview) {
    const pngs = fs.readdirSync(P.preview).filter((f) => f.endsWith('.png') && !f.startsWith('_')).sort();
    const args = []; for (const f of pngs) args.push('-label', f.replace(/\.png$/, ''), path.join(P.preview, f));
    if (pngs.length) execFileSync('montage', [...args, '-font', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '-pointsize', '11', '-tile', '6x', '-geometry', '192x192+4+4', '-background', '#1a1c22', '-fill', '#ddd', path.join(P.preview, '_sheet.png')]);
    console.log(`미리보기 → ${path.join(P.preview, '_sheet.png')} (${pngs.length}장)`);
  }
  if (P.install) {
    fs.mkdirSync(LAYERS_DIR, { recursive: true });
    for (const [k, p] of Object.entries(outPlates)) encode(p.w, p.h, p.data, path.join(LAYERS_DIR, `${k}.png`));
    const keys = fs.readdirSync(LAYERS_DIR).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).sort();
    writeManifest(keys);
    console.log(`${Object.keys(outPlates).length}장 설치 → ${path.relative(ROOT, LAYERS_DIR)}`);
  }
}

main().catch((e) => { console.error(e.stack ?? e.message ?? e); process.exit(1); });
