#!/usr/bin/env node
/**
 * @file crop_calib.cjs
 * @description 241차 — 작물 초상 파이프라인 보정. `food assets/crops/_calib/{photo,ref}/<id>.png` 쌍(사진 ↔ 사용자 변환본 = 픽셀 아트 grade 정답)에 대해
 *  `pixelize_crops.processImage(P)`의 grade 통계(crop_grade.cjs) · 유사도를 재고, 손잡이를 좌표 하강으로 맞춘다.
 *
 *   node tools/crop_calib.cjs --eval [--p '{"levels":8}']     쌍별 표(참고 vs 출력) + 가중 손실
 *   node tools/crop_calib.cjs --sweep [--rounds 2]             좌표 하강 → food assets/crops/_calib/best.json(기본값과 다른 손잡이만)
 *   node tools/crop_calib.cjs --render <폴더> [--p …]          출력 초상 + 시트(사진 | 참고 | 출력)를 폴더에
 *
 *  새 쌍을 더하면: photo/<id>.png(흰 배경 사진) + ref/<id>.png(같은 물건의 변환본). 가중치는 WEIGHT(없으면 1).
 *  손실 = 2(1 − 밝기 상관) + RGB 차/15 + Σ 통계 차² (채도 · 밝기 편차 · 질감 · 먹점 · 밝은 점 · 윤곽 비 · 윤곽 어두움 · 같은 이웃 · 색 수(log)) — 항마다 25로 캡.
 *  스윕 결과를 기본값으로 쓰려면 pixelize_crops.cjs DEFAULTS를 손으로 갱신한다(근거는 docs/wiki/02-SYSTEMS/photo-pixel-art.md §3.6).
 */
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const T = require('./pixelize_crops.cjs'); const G = require('./crop_grade.cjs'); const { decode, encode } = require('./lib_png.cjs');
const DIR = 'food assets/crops/_calib';
const WEIGHT = { crop_strawberry: 1.5, crop_bakkan: 0.5, crop_krill: 0.5 }; const LETTUCE_W = 1.5 / 9;
const PAIRS = fs.readdirSync(path.join(DIR, 'ref')).filter((f) => f.endsWith('.png')).map((f) => { const id = f.slice(0, -4);
  const photo = path.join(DIR, 'photo', f); if (!fs.existsSync(photo)) return null;
  return { id, photo, ref: path.join(DIR, 'ref', f), w: WEIGHT[id] ?? (id.startsWith('crop_lettuce_') ? LETTUCE_W : 1) }; }).filter(Boolean);
for (const p of PAIRS) { p.img = decode(p.photo); const r = G.fileToCells(p.ref, { area: true, cellsLong: 192 }); p.refCells = r.cells; p.refM = G.metrics(r.cells); }
const SC = { sat: 0.06, sdL: 8, detail: 3, ink: 3, light: 5, outlineRatio: 0.12, outlineDark: 15, same: 10 };
const WM = { sat: 1, sdL: 1, detail: 1, ink: 0.7, light: 1, outlineRatio: 1, outlineDark: 0.5, same: 0.5 }; const CAP = 25;
function evalPair(p, P) {
  const r = T.processImage(p.img, P); const cells = { w: r.gw, h: r.gh, buf: r.sharp }; const m = G.metrics(cells); const s = G.similarity(cells, p.refCells);
  let loss = 2 * (1 - s.corr) + s.rgbDiff / 15; const terms = {};
  for (const k of Object.keys(SC)) { const t = Math.min(CAP, WM[k] * ((m[k] - p.refM[k]) / SC[k]) ** 2); terms[k] = +t.toFixed(2); loss += t; }
  const lk = (Math.log(m.k90) - Math.log(p.refM.k90)) / 0.5; const tk = Math.min(CAP, lk * lk); terms.k90 = +tk.toFixed(2); loss += tk;
  return { m, s, loss: +loss.toFixed(2), terms, cells, r };
}
function evalAll(P) { let tot = 0, wsum = 0; const rows = []; for (const p of PAIRS) { const e = evalPair(p, P); rows.push({ id: p.id, ...e }); tot += p.w * e.loss; wsum += p.w; } return { loss: +(tot / wsum).toFixed(3), rows }; }
function table(P) {
  const r = evalAll(P); const cols = ['sat', 'sdL', 'levels', 'k90', 'outlineRatio', 'outlineDark', 'detail', 'ink', 'light', 'same'];
  console.log(['pair', 'who', ...cols, 'corr', 'rgb', 'iou', 'loss'].join('\t'));
  for (const row of r.rows) { const p = PAIRS.find((q) => q.id === row.id);
    console.log([row.id, '참고', ...cols.map((c) => p.refM[c]), '', '', '', ''].join('\t'));
    console.log([row.id, '출력', ...cols.map((c) => row.m[c]), row.s.corr, row.s.rgbDiff, row.s.iou, row.loss].join('\t')); }
  console.log('가중 손실', r.loss); return r;
}
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const base = { ...T.DEFAULTS, style: 'pixelart', ...(opt('--p') ? JSON.parse(opt('--p')) : {}) };
if (argv.includes('--eval')) { console.log('P =', JSON.stringify(base)); table(base); }
if (argv.includes('--render')) {
  const out = opt('--render'); fs.mkdirSync(out, { recursive: true }); const r = evalAll(base);
  for (const row of r.rows) { const { cells } = row; const up = T.nearestUp(cells.buf, cells.w, cells.h, base.cell); const f = path.join(out, row.id + '.png'); encode(cells.w * base.cell, cells.h * base.cell, up, f);
    const p = PAIRS.find((q) => q.id === row.id); execFileSync('node', [path.join(__dirname, 'img_sheet.cjs'), path.join(out, 'sheet_' + row.id + '.png'), '300', p.photo, p.ref, f], { stdio: 'ignore' });
    console.log(`${row.id}: 손실 ${row.loss} · corr ${row.s.corr} · rgb ${row.s.rgbDiff} → ${f}`); }
  console.log('가중 손실', r.loss);
}
if (argv.includes('--sweep')) {
  const KN = { shadow: [0, 0.14, 0.18], bilateral: [0, 1, 2, 3], sigr: [12, 22, 35], levels: [0, 5, 6, 8, 10], phi: [2, 3, 5], edge: [0, 1, 2, 3], dog: [0.7, 1.0, 1.4], sat: [1.0, 1.08, 1.15, 1.25], contrast: [0.95, 1.0, 1.05, 1.1], colors: [0, 48, 96, 160], outlineDark: [0.35, 0.45, 0.55, 0.65, 0.75], detail: [0, 4, 7, 10], detailStep: [0.08, 0.12, 0.18], unsharp: [0, 0.25, 0.5] };
  let P = { ...base }; let best = evalAll(P).loss; console.log('시작 손실', best, JSON.stringify(P));
  const rounds = +opt('--rounds', 2);
  for (let r = 0; r < rounds; r++) { let improved = false;
    for (const [k, vals] of Object.entries(KN)) { let bk = P[k], bl = best;
      for (const v of vals) { if (v === P[k]) continue; const t0 = Date.now(); const l = evalAll({ ...P, [k]: v }).loss; process.stdout.write(`  ${k}=${v} → ${l} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`); if (l < bl - 1e-6) { bl = l; bk = v; } }
      if (bk !== P[k]) { P[k] = bk; best = bl; improved = true; console.log(`라운드 ${r + 1}: ${k} = ${bk} → 손실 ${best}`); } }
    console.log(`라운드 ${r + 1} 끝 — 손실 ${best}`, JSON.stringify(P)); if (!improved) break; }
  const delta = {}; for (const k of Object.keys(KN)) if (P[k] !== T.DEFAULTS[k]) delta[k] = P[k];
  fs.writeFileSync(path.join(DIR, 'best.json'), JSON.stringify({ loss: best, P: delta }, null, 1)); console.log('최적 손잡이(기본값과 다른 것만)', JSON.stringify(delta)); table(P);
}
