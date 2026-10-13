// @file crop_grade.cjs — 241차 픽셀 아트 grade 계측 모듈 — 셀 격자 검출 · 배경 마스크 · 셀 샘플링(중앙/면적) · 통계 · 두 그림 유사도
//   node tools/crop_grade.cjs a.png b.png …            각 파일의 grade 통계(격자가 보이면 그 셀로 · 아니면 긴 변 192셀 면적 평균)
//   node tools/crop_grade.cjs --vs a.png b.png         두 그림의 유사도(밝기 상관 · RGB 차 · 실루엣 IoU)
const { decode } = require('./lib_png.cjs');
const path = require('path');
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function objectMask(img, tol = 24) {
  const { w, h, data } = img; const mask = new Uint8Array(w * h);
  let tr = 0, n = 0; for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { n++; if (data[(y * w + x) * 4 + 3] < 8) tr++; }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { n++; if (data[(y * w + x) * 4 + 3] < 8) tr++; }
  if (tr / n > 0.9) { for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] >= 128 ? 1 : 0; return mask; }
  const s = [[], [], []]; const push = (x, y) => { const o = (y * w + x) * 4; s[0].push(data[o]); s[1].push(data[o + 1]); s[2].push(data[o + 2]); };
  for (let x = 0; x < w; x += 2) { push(x, 0); push(x, h - 1); } for (let y = 0; y < h; y += 2) { push(0, y); push(w - 1, y); }
  const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; }; const bg = [med(s[0]), med(s[1]), med(s[2])]; const bgL = lum(...bg);
  const bgLike = (o) => { const r = data[o], g = data[o + 1], b = data[o + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const sat = mx ? (mx - mn) / mx : 0;
    return (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < tol && sat < 0.12) || (bgL > 200 && sat < 0.07 && lum(r, g, b) > 200); };
  const mark = new Uint8Array(w * h); const st = []; for (let x = 0; x < w; x++) { st.push(x, (h - 1) * w + x); } for (let y = 0; y < h; y++) { st.push(y * w, y * w + w - 1); }
  while (st.length) { const i = st.pop(); if (mark[i]) continue; if (!bgLike(i * 4)) continue; mark[i] = 1; const x = i % w, y = (i / w) | 0; if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w); }
  for (let i = 0; i < w * h; i++) mask[i] = mark[i] ? 0 : 1; return mask;
}

/** 셀 격자 검출 — 열/행 경계의 밝기 차 에너지가 주기 c · 위상 p에서 얼마나 몰리는가(배경 제외) */
function detectGrid(img, mask) {
  const { w, h, data } = img; const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = lum(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const colE = new Float64Array(w), rowE = new Float64Array(h);
  for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) { const i = y * w + x; if (!mask[i]) continue; if (mask[i - 1]) colE[x] += Math.abs(L[i] - L[i - 1]); if (mask[i - w]) rowE[y] += Math.abs(L[i] - L[i - w]); }
  const best = (E, n) => { let mean = 0; for (let i = 1; i < n; i++) mean += E[i]; mean /= Math.max(1, n - 1); let out = { c: 1, p: 0, score: 1 }; if (!mean) return out;
    for (let c = 2; c <= 12; c++) for (let p = 0; p < c; p++) { let s = 0, k = 0; for (let i = p; i < n; i += c) { if (i < 1) continue; s += E[i]; k++; } const sc = k ? (s / k) / mean : 0; if (sc > out.score * (c > out.c ? 1.15 : 1) + 1e-9) out = { c, p, score: +sc.toFixed(2) }; }
    return out; };
  return { x: best(colE, w), y: best(rowE, h) };
}

/** 격자 중앙 샘플 → 셀 그림(RGBA · 알파 0/255) */
function toCellsCenter(img, mask, gx, gy) {
  const { w, h, data } = img; const c = gx.c, cy = gy.c;
  const x0 = gx.p - Math.ceil(gx.p / c) * c, y0 = gy.p - Math.ceil(gy.p / cy) * cy;
  const cw = Math.ceil((w - x0) / c), ch = Math.ceil((h - y0) / cy); const buf = Buffer.alloc(cw * ch * 4);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const xc = Math.min(w - 1, Math.max(0, x0 + i * c + (c >> 1))), yc = Math.min(h - 1, Math.max(0, y0 + j * cy + (cy >> 1))); const k = yc * w + xc; const d = (j * cw + i) * 4;
    buf[d] = data[k * 4]; buf[d + 1] = data[k * 4 + 1]; buf[d + 2] = data[k * 4 + 2]; buf[d + 3] = mask[k] ? 255 : 0; }
  return { w: cw, h: ch, buf };
}
/** bbox를 긴 변 cellsLong로 면적 평균(마스크 가중) → 셀 그림 */
function toCellsArea(img, mask, cellsLong) {
  const { w, h, data } = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1; const sc = cellsLong / Math.max(bw, bh); const cw = Math.max(1, Math.round(bw * sc)), ch = Math.max(1, Math.round(bh * sc));
  const acc = new Float64Array(cw * ch * 4), cnt = new Float64Array(cw * ch);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const q = Math.min(ch - 1, Math.floor(y * ch / bh)) * cw + Math.min(cw - 1, Math.floor(x * cw / bw)); cnt[q]++; const k = (y + y0) * w + x + x0; if (!mask[k]) continue; acc[q * 4] += data[k * 4]; acc[q * 4 + 1] += data[k * 4 + 1]; acc[q * 4 + 2] += data[k * 4 + 2]; acc[q * 4 + 3]++; }
  const buf = Buffer.alloc(cw * ch * 4); for (let q = 0; q < cw * ch; q++) { const n = acc[q * 4 + 3]; if (n) { buf[q * 4] = Math.round(acc[q * 4] / n); buf[q * 4 + 1] = Math.round(acc[q * 4 + 1] / n); buf[q * 4 + 2] = Math.round(acc[q * 4 + 2] / n); } buf[q * 4 + 3] = cnt[q] && n / cnt[q] >= 0.5 ? 255 : 0; }
  return { w: cw, h: ch, buf };
}

/** 셀 그림 통계 */
function metrics(cl) {
  const { w, h, buf } = cl; const op = new Uint8Array(w * h); const L = new Float32Array(w * h); let n = 0;
  for (let i = 0; i < w * h; i++) { op[i] = buf[i * 4 + 3] >= 128 ? 1 : 0; L[i] = lum(buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]); n += op[i]; }
  if (!n) return null;
  const dist = new Int16Array(w * h).fill(-1); const q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op[i]) continue; const b = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !op[i - 1] || !op[i + 1] || !op[i - w] || !op[i + w]; if (b) { dist[i] = 0; q.push(i); } }
  for (let qi = 0; qi < q.length; qi++) { const i = q[qi]; if (dist[i] >= 6) continue; const x = i % w, y = (i / w) | 0; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && op[j] && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); } }
  const med = (a) => { a.sort((p, q2) => p - q2); return a.length ? a[a.length >> 1] : 0; };
  const bL = [], bandL = []; for (let i = 0; i < w * h; i++) { if (!op[i]) continue; if (dist[i] === 0) bL.push(L[i]); else if (dist[i] >= 2 && dist[i] <= 4) bandL.push(L[i]); }
  const bandMed = med(bandL.slice()), bMed = med(bL.slice()); let dark = 0; for (const l of bL) if (l < 0.55 * bandMed) dark++;
  let sL = 0, sL2 = 0, sS = 0; for (let i = 0; i < w * h; i++) { if (!op[i]) continue; sL += L[i]; sL2 += L[i] * L[i]; const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); sS += mx ? (mx - mn) / mx : 0; }
  const meanL = sL / n, sdL = Math.sqrt(Math.max(0, sL2 / n - meanL * meanL));
  const hist = new Array(32).fill(0); for (let i = 0; i < w * h; i++) if (op[i]) hist[Math.min(31, L[i] / 8 | 0)]++;
  const sm = hist.map((v, i) => (2 * v + (hist[i - 1] || 0) + (hist[i + 1] || 0)) / 4); let peaks = 0; for (let i = 0; i < 32; i++) { const l = i > 0 ? sm[i - 1] : -1, r = i < 31 ? sm[i + 1] : -1; if (sm[i] > l && sm[i] >= r && sm[i] >= 0.012 * n) peaks++; }
  const exact = new Set(); const q5 = new Map(); const key5 = (i) => ((buf[i * 4] >> 3) << 10) | ((buf[i * 4 + 1] >> 3) << 5) | (buf[i * 4 + 2] >> 3);
  for (let i = 0; i < w * h; i++) { if (!op[i]) continue; exact.add((buf[i * 4] << 16) | (buf[i * 4 + 1] << 8) | buf[i * 4 + 2]); const k = key5(i); q5.set(k, (q5.get(k) || 0) + 1); }
  const sorted = [...q5.values()].sort((a, b) => b - a); let acc = 0, k90 = 0; for (const v of sorted) { acc += v; k90++; if (acc >= 0.9 * n) break; }
  const box = (i, r) => { const x = i % w, y = (i / w) | 0; let s = 0, k = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (!op[j]) continue; s += L[j]; k++; } return k ? s / k : L[i]; };
  let det = 0, dn = 0, ink = 0, light = 0, same = 0, pairs = 0;
  for (let i = 0; i < w * h; i++) { if (!op[i]) continue; const x = i % w, y = (i / w) | 0;
    if (dist[i] >= 2) { det += Math.abs(L[i] - box(i, 1)); dn++; const b5 = box(i, 2); if (L[i] < 0.5 * b5) ink++; if (L[i] > 1.35 * b5) light++; }
    const k = key5(i); for (const j of [x < w - 1 ? i + 1 : -1, y < h - 1 ? i + w : -1]) { if (j < 0 || !op[j]) continue; pairs++; if (key5(j) === k) same++; } }
  return { n, meanL: +meanL.toFixed(0), sdL: +sdL.toFixed(0), sat: +(sS / n).toFixed(2), levels: peaks, colors: exact.size, k90, outlineDark: +(100 * dark / Math.max(1, bL.length)).toFixed(0), outlineRatio: +(bMed / Math.max(1, bandMed)).toFixed(2), detail: +(det / Math.max(1, dn)).toFixed(1), ink: +(100 * ink / Math.max(1, dn)).toFixed(1), light: +(100 * light / Math.max(1, dn)).toFixed(1), same: +(100 * same / Math.max(1, pairs)).toFixed(0) };
}

function resampleMasked(cl, N) {
  const { w, h, buf } = cl; let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] >= 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1; const out = new Float32Array(N * N * 4); const cnt = new Float32Array(N * N);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const o = ((y + y0) * w + x + x0) * 4; const q = Math.floor(y * N / bh) * N + Math.floor(x * N / bw); cnt[q]++; if (buf[o + 3] < 128) continue; out[q * 4] += buf[o]; out[q * 4 + 1] += buf[o + 1]; out[q * 4 + 2] += buf[o + 2]; out[q * 4 + 3]++; }
  return { N, out, cnt };
}
/** 두 셀 그림 유사도 — bbox를 N×N으로 맞춰 밝기 상관 · RGB 평균 차 · 실루엣 IoU */
function similarity(a, b, N = 64) {
  const A = resampleMasked(a, N), B = resampleMasked(b, N); let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, rgb = 0, inter = 0, uni = 0;
  for (let q = 0; q < N * N; q++) { const ca = A.out[q * 4 + 3] / (A.cnt[q] || 1) >= 0.5, cb = B.out[q * 4 + 3] / (B.cnt[q] || 1) >= 0.5; if (ca || cb) uni++; if (!(ca && cb)) continue; inter++;
    const na = A.out[q * 4 + 3], nb = B.out[q * 4 + 3]; const ra = A.out[q * 4] / na, ga = A.out[q * 4 + 1] / na, ba = A.out[q * 4 + 2] / na, rb = B.out[q * 4] / nb, gb = B.out[q * 4 + 1] / nb, bb = B.out[q * 4 + 2] / nb;
    const la = lum(ra, ga, ba), lb = lum(rb, gb, bb); n++; sx += la; sy += lb; sxx += la * la; syy += lb * lb; sxy += la * lb; rgb += (Math.abs(ra - rb) + Math.abs(ga - gb) + Math.abs(ba - bb)) / 3; }
  const cov = sxy / n - (sx / n) * (sy / n), vx = sxx / n - (sx / n) ** 2, vy = syy / n - (sy / n) ** 2;
  return { corr: +(cov / Math.sqrt(Math.max(1e-6, vx * vy))).toFixed(2), rgbDiff: +(rgb / Math.max(1, n)).toFixed(1), iou: +(inter / Math.max(1, uni)).toFixed(2) };
}

/** 파일 → 셀 그림(격자가 보이면 중앙 샘플 · 아니면 긴 변 cellsLong 면적 평균) */
function fileToCells(file, o = {}) {
  const img = decode(file); const mask = objectMask(img, o.tol ?? 24); const g = detectGrid(img, mask);
  const gridOk = !o.area && g.x.score >= (o.minScore ?? 1.5) && g.y.score >= (o.minScore ?? 1.5) && g.x.c >= 2 && Math.abs(g.x.c - g.y.c) <= 1;
  const cells = gridOk ? toCellsCenter(img, mask, g.x, { ...g.y, c: g.x.c }) : toCellsArea(img, mask, o.cellsLong ?? 192);
  return { img, mask, grid: g, mode: gridOk ? `격자 ${g.x.c}px(${g.x.score}/${g.y.score})` : `면적 ${o.cellsLong ?? 192}셀(격자 점수 ${g.x.score}/${g.y.score})`, cells };
}

module.exports = { lum, objectMask, detectGrid, toCellsCenter, toCellsArea, metrics, similarity, fileToCells };

if (require.main === module) {
  const a = process.argv.slice(2); const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const o = { area: a.includes('--area'), tol: +(opt('--tol') ?? 24), cellsLong: +(opt('--cells') ?? 192) };
  const files = a.filter((x, i) => !x.startsWith('--') && !(a[i - 1] === '--tol' || a[i - 1] === '--cells'));
  if (a.includes('--vs')) { const A = fileToCells(files[0], o), B = fileToCells(files[1], o); console.log(path.basename(files[0]), 'vs', path.basename(files[1]), JSON.stringify(similarity(A.cells, B.cells))); return; }
  const rows = [];
  for (const f of files) { const r = fileToCells(f, o); const m = metrics(r.cells); rows.push({ file: path.basename(f), src: `${r.img.w}x${r.img.h}`, mode: r.mode, cells: `${r.cells.w}x${r.cells.h}`, ...m }); }
  const cols = ['file', 'src', 'mode', 'cells', 'n', 'meanL', 'sdL', 'sat', 'levels', 'colors', 'k90', 'outlineDark', 'outlineRatio', 'detail', 'ink', 'light', 'same'];
  console.log(cols.join('\t')); for (const r of rows) console.log(cols.map((c) => r[c]).join('\t'));
}
