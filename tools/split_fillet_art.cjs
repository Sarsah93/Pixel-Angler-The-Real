/**
 * split_fillet_art.cjs — 318(2) **지아이뼈로 가른 두 덩어리 중 한 덩어리**(돔류 · 방어류 흐름의 순수 · 껍질 붙은 필렛 그림)
 *
 * 사용자 지시(2026-11-11): 「지아이뼈를 분리하는 과정에서 한 면이 두 덩어리로 잘려진 필렛 중 '하나'의 이미지로 보여져야 하는데」.
 * 316 Gemini 그림은 반쪽 필렛 통째(나뭇잎 모양 · 가운데 혈합육)였다. 감성돔 · 잿방어 원본처럼 **등 쪽 한 덩어리**로 만든다 —
 * 그림을 새로 그리지 않고, 그 그림의 혈합육(지아이뼈) 줄을 따라 실제로 가른다(손질 공정과 같은 모양).
 *  - 칸(4px) 단위로 열마다 가르는 줄을 찾는다: 살 높이의 30 ~ 75% 안에서 가장 짙붉은 칸(혈합육) · 없으면(흰 살) 가운데.
 *  - 줄을 이웃 열과 매끈하게(중앙값) 잇고, 혈합육 띠는 덩어리 가장자리에 남긴다(가른 면) · 그 아래는 지운다.
 *  - 가른 면을 따라 한 칸 진한 윤곽선(그림의 바깥 윤곽과 같은 결) · 떨어진 부스러기는 뺀다 · 여백을 다시 맞춘다.
 *  - 껍질 붙은 필렛은 같은 법으로 가른다(껍질 띠는 등 쪽 바깥 가장자리에만 남는다).
 *
 * 입력 · 출력: `food assets/trimmings/species/<id>_{pure,skin}.png`(원본은 `<폴더>/<id>_<kind>.orig.png`로 한 번만 보관 — 다시 돌려도 원본에서 가른다)
 * 실행: node tools/split_fillet_art.cjs [--only a,b] [--preview <폴더>]   (--preview = 저장소 파일을 바꾸지 않고 그 폴더에 쓴다)
 * 그다음: node tools/gemini_fillet_art.cjs --bake → node tools/gen_sashimi_fillet.cjs → node tools/gemini_fillet_art.cjs --wiki-sheets
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'food assets', 'trimmings', 'species');
const ORIG = path.join(DIR, '_whole_side_316');   // 316 반쪽 통째 원본 보관
const CELL = 4;

/** 지아이뼈를 가르는 흐름(돔류 · 방어류)의 어종 — 감성돔 · 잿방어는 원본 그림이 이미 한 덩어리 · 작은 생선은 핀셋(한 덩이) */
const SPLIT = [
  'red_seabream', 'largescale_blackfish', 'longtail_blackfish', 'stone_beakperch', 'spotted_knifejaw', 'surfperch', 'rainbow_wrasse',
  'yellowtail', 'amberjack', 'chub_mackerel', 'horse_mackerel', 'spanish_mackerel', 'sea_bass',
  'black_rockfish', 'blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish', 'striped_mullet', 'redlip_mullet',
];

function args() {
  const a = process.argv.slice(2);
  const P = { only: null, preview: '' };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--only') P.only = new Set(a[++i].split(','));
    else if (a[i] === '--preview') P.preview = a[++i];
  }
  return P;
}

/** 칸 격자로 읽기 — 칸 = 4px 블록의 가운데 픽셀(설치 단계가 4px 격자로 맞췄다) */
function cells(img) {
  const W = Math.floor(img.w / CELL), H = Math.floor(img.h / CELL);
  const at = (c, r) => { const x = c * CELL + 1, y = r * CELL + 1, i = (y * img.w + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]; };
  return { W, H, at };
}

/** 최소제곱 다항식(차수 d) — 정규방정식 · 가우스 소거 */
function polyFit(pts, d) {
  const n = d + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const [x, y] of pts) {
    const xp = []; for (let i = 0; i < 2 * n; i++) xp.push(x ** i);
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += xp[i + j]; A[i][n] += y * xp[i]; }
  }
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < n; r++) { if (r === i || !A[i][i]) continue; const f = A[r][i] / A[i][i]; for (let k = i; k <= n; k++) A[r][k] -= f * A[i][k]; }
  }
  const co = A.map((row, i) => (row[i] ? row[n] / row[i] : 0));
  return (x) => co.reduce((a, c, i) => a + c * x ** i, 0);
}

/** 열마다 가를 줄(칸 행 — 이 행까지 남긴다) */
function splitRows(img) {
  const { W, H, at } = cells(img);
  const rows = new Array(W).fill(-1);
  const red = (p) => p[3] > 128 ? Math.max(0, p[0] - (p[1] + p[2]) / 2) * (1 - (p[0] + p[1] + p[2]) / 765 * 0.6) : 0;
  let anyRed = 0, cols = 0;
  const raw = [];
  for (let c = 0; c < W; c++) {
    let t = -1, b = -1;
    for (let r = 0; r < H; r++) if (at(c, r)[3] > 128) { if (t < 0) t = r; b = r; }
    if (t < 0) { raw.push(null); continue; }
    const h = b - t + 1;
    let best = -1, bestS = 0;
    for (let r = t + Math.floor(h * 0.3); r <= t + Math.floor(h * 0.75); r++) { const s = red(at(c, r)); if (s > bestS) { bestS = s; best = r; } }
    cols++;
    if (bestS > 45) anyRed++;
    raw.push({ t, b, red: bestS > 45 ? best : -1, mid: t + Math.floor(h * 0.5) });
  }
  // 혈합육이 열의 30% 넘게 보이면 그 줄을 따라 가르고, 아니면(흰 살) 가운데를 가른다
  const useRed = anyRed > cols * 0.3;
  const pick = raw.map((o) => (o ? (useRed && o.red >= 0 ? o.red : o.mid) : null));
  // 빈 값(혈합육이 안 보이는 열)은 이웃에서 잇는다 · 중앙값으로 매끈하게
  for (let c = 0; c < W; c++) if (raw[c] && pick[c] === null) pick[c] = raw[c].mid;
  const med = (arr, c, k) => { const w = []; for (let d = -k; d <= k; d++) { const v = arr[c + d]; if (v !== null && v !== undefined && v >= 0) w.push(v); } w.sort((a, b) => a - b); return w.length ? w[Math.floor(w.length / 2)] : -1; };
  // 혈합육 줄은 필렛을 따라 완만한 곡선이다 — 넓은 중앙값(±12)으로 튀는 열을 걷고 이동 평균(±6)으로 편다(좁게 펴면 열 몇 개씩 3 ~ 4칸 오르내려 가른 면에 고드름이 생겼다)
  const m1 = pick.map((v, c) => (raw[c] ? med(pick, c, 12) : -1));
  // 3차 곡선 하나로 맞춘다(최소제곱) — 혈합육 줄은 필렛 전체를 지나는 완만한 곡선이라 국소 흔들림(뱃살 자락 쐐기)을 남기지 않는다
  const pts = [];
  for (let c = 0; c < W; c++) if (m1[c] >= 0) pts.push([c / W, m1[c]]);
  const fit = polyFit(pts, 3);
  const sm = m1.map((v, c) => (v >= 0 ? Math.round(fit(c / W)) : -1));
  // 혈합육 띠는 덩어리 가장자리에 남긴다 — 띠 두께는 열마다 따로 재지 않고 한 값(중앙값)으로(열마다 다르면 가른 면이 고드름처럼 삐죽해진다)
  let band = 0;
  if (useRed) {
    const ext = [];
    for (let c = 0; c < W; c++) { if (sm[c] < 0) continue; let k = 0; while (k < 3 && red(at(c, sm[c] + 1 + k)) > 30) k++; ext.push(k); }
    ext.sort((a, b) => a - b);
    band = ext.length ? ext[Math.floor(ext.length / 2)] : 0;
  }
  let cut = sm.map((v) => (v >= 0 ? v + band : -1));
  // 다시 매끈하게(중앙값 ±3) · 이웃 열과 한 칸 넘게 튀지 않게(앞 · 뒤 두 번)
  cut = cut.map((v, c) => (v >= 0 ? med(cut, c, 3) : -1));
  for (let pass = 0; pass < 2; pass++) {
    for (let c = 1; c < W; c++) if (cut[c] >= 0 && cut[c - 1] >= 0) cut[c] = Math.max(cut[c - 1] - 1, Math.min(cut[c - 1] + 1, cut[c]));
    for (let c = W - 2; c >= 0; c--) if (cut[c] >= 0 && cut[c + 1] >= 0) cut[c] = Math.max(cut[c + 1] - 1, Math.min(cut[c + 1] + 1, cut[c]));
  }
  for (let c = 0; c < W; c++) {
    if (!raw[c] || cut[c] < 0) continue;
    // 너무 얇은 덩어리 · 너무 두꺼운 덩어리를 막는다(살 높이의 35 ~ 70%)
    const h = raw[c].b - raw[c].t + 1;
    rows[c] = Math.max(raw[c].t + Math.ceil(h * 0.35), Math.min(raw[c].t + Math.floor(h * 0.7), cut[c]));
  }
  return { rows, useRed };
}

/** 가르기 — 가를 줄 아래를 지우고 가른 면에 윤곽선 · 부스러기 빼기 · 여백 맞추기 */
function splitImage(img, rows) {
  const { W, H, at } = cells(img);
  const keep = new Uint8Array(W * H);
  for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) if (at(c, r)[3] > 128 && rows[c] >= 0 && r <= rows[c]) keep[r * W + c] = 1;
  // 가장 큰 덩어리만(4-이웃)
  const id = new Int32Array(W * H); let best = 0, bestN = 0, k = 0;
  for (let i = 0; i < W * H; i++) {
    if (!keep[i] || id[i]) continue;
    k++; let n = 0; const st = [i]; id[i] = k;
    while (st.length) { const j = st.pop(); n++; const x = j % W, y = (j - x) / W;
      for (const q of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1]) if (q >= 0 && keep[q] && !id[q]) { id[q] = k; st.push(q); } }
    if (n > bestN) { bestN = n; best = k; }
  }
  for (let i = 0; i < W * H; i++) if (id[i] !== best) keep[i] = 0;
  // 바깥 윤곽선 색 — 남은 덩어리의 위 가장자리 칸 평균(그림의 진한 윤곽선)
  let oc = [0, 0, 0], on = 0;
  for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) if (keep[r * W + c]) { const p = at(c, r); oc[0] += p[0]; oc[1] += p[1]; oc[2] += p[2]; on++; break; }
  oc = oc.map((v) => Math.round(v / Math.max(1, on)));
  // 가른 면(아래 이웃이 지워진 칸) = 윤곽선
  const edge = new Uint8Array(W * H);
  for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) {
    const i = r * W + c;
    if (!keep[i]) continue;
    const below = r + 1 < H ? keep[i + W] : 0;
    if (!below && at(c, r + 1)[3] > 128) edge[i] = 1;   // 원래 살이 있던 아래를 지웠다 = 가른 면
  }
  // bbox
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < W * H; i++) if (keep[i]) { const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const PAD = 2;   // 칸
  const OW = (x1 - x0 + 1 + PAD * 2) * CELL, OH = (y1 - y0 + 1 + PAD * 2) * CELL;
  const out = Buffer.alloc(OW * OH * 4);
  for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) {
    const i = r * W + c;
    if (!keep[i]) continue;
    const ox = (c - x0 + PAD) * CELL, oy = (r - y0 + PAD) * CELL;
    for (let dy = 0; dy < CELL; dy++) for (let dx = 0; dx < CELL; dx++) {
      const si = ((r * CELL + dy) * img.w + c * CELL + dx) * 4, di = ((oy + dy) * OW + ox + dx) * 4;
      if (edge[i]) { out[di] = oc[0]; out[di + 1] = oc[1]; out[di + 2] = oc[2]; out[di + 3] = 255; }
      else { out[di] = img.data[si]; out[di + 1] = img.data[si + 1]; out[di + 2] = img.data[si + 2]; out[di + 3] = img.data[si + 3]; }
    }
  }
  return { w: OW, h: OH, data: out, cells: { w: x1 - x0 + 1, h: y1 - y0 + 1 } };
}

function main() {
  const P = args();
  const outDir = P.preview || DIR;
  fs.mkdirSync(outDir, { recursive: true });
  if (!P.preview) fs.mkdirSync(ORIG, { recursive: true });
  for (const id of SPLIT) {
    if (P.only && !P.only.has(id)) continue;
    const res = [];
    for (const kind of ['pure', 'skin']) {
      const live = path.join(DIR, `${id}_${kind}.png`);
      const kept = path.join(ORIG, `${id}_${kind}.png`);
      if (!P.preview && !fs.existsSync(kept)) fs.copyFileSync(live, kept);   // 반쪽 통째 원본은 한 번만 보관
      const src = fs.existsSync(kept) ? kept : live;
      const img = decode(src);
      const { rows, useRed } = splitRows(img);
      const o = splitImage(img, rows);
      encode(o.w, o.h, o.data, path.join(outDir, `${id}_${kind}.png`));
      res.push(`${kind} ${o.cells.w}×${o.cells.h}칸(${(o.cells.w / o.cells.h).toFixed(1)}:1)${useRed ? ' 혈합육 줄' : ' 가운데'}`);
    }
    console.log(`[split_fillet_art] ${id} — ${res.join(' · ')}`);
  }
}
if (require.main === module) main();
module.exports = { SPLIT };
