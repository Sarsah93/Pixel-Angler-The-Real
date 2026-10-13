/**
 * @file pixelize_crops.cjs
 * @description 241차 — 작물 사진 → 어종 에셋 기준 도트 초상(사용자 지시 「작물 그림을 어종 그래픽 쪽으로 정합」).
 *
 * 어종 에셋 실측(tools/check_art_quality.cjs · 53장 중앙값): 긴 변 1,259px · 셀 6px(→ 가로 약 190셀) · 8비트 RGBA ·
 * 색 5,000종 이상(팔레트 양자화 없음) · 밝기 표준편차 60 · 반투명 테두리 10% · 셀 안 노이즈 22(부드러운 셀).
 * 이 도구는 그 기준으로 작물 사진을 굽는다 — **같은 출처 한 장**에서 초상(상세 · 도감 · 위키)과 가방 아이콘(64px)을 함께 낸다.
 *
 * 입력: `food assets/crops/<수확물 기본 id>.(png|jpg|jpeg|webp)` — 흰(단색) 배경 사진 또는 투명 PNG. 파일명 = 수확물 기본 id(`crop_peanut`).
 * 출력: `packages/client-pc/public/crops/<id>.png`(초상 · 셀 6px · 긴 변 ≈ 1,152px) · `<id>_icon.png`(64px · 면적 평균) ·
 *       `packages/client-pc/src/data/CropPortraits.ts`(있는 초상 목록 — BootScene이 읽는다).
 *
 *   node tools/pixelize_crops.cjs [--only crop_peanut] [--cells 192] [--cell 6] [--tol 44] [--in "food assets/crops"] [--out packages/client-pc/public/crops]
 *
 * 절차: ① 디코드(PNG는 내장 · JPEG/WebP는 Playwright 크롬 캔버스) ② 배경 벗기기(테두리 색 표본 → 허용 오차 안 색을 테두리에서 BFS ·
 *   가장 큰 전경 덩어리만 · 닫힘 · 가장자리 1px 반투명) ③ 타이트 크롭 + 2셀 여백 ④ 면적 평균으로 셀 격자(긴 변 cells)
 *   ⑤ **픽셀 아트 grade 양식화**(`--style pixelart` 기본 — 사용자 지시 2026-10-13 「사진 복붙이 아니라 픽셀 아트 grade로 조정」):
 *      쿠와하라 평활(질감 → 면) → k-평균 팔레트(기본 24색 · 디더 없음 = 셀 셰이딩 띠) → 윤곽선(실루엣은 어둡게 · 안쪽은 밝기 차가 큰 경계에 먹선)
 *      `--style photo`는 235~241차 초기의 사진 블록화(언샤프만)로, 어종 원본(PixelOE)과 가까운 쪽.
 *   ⑥ 최근접 ×cell 확대 = 초상 · 셀 그림을 64px로 면적 평균 = 아이콘 ⑦ 결과를 재측정해 표로 찍는다(색 수 · 윤곽 어둡기).
 * 기준 참고: 사용자 제공 바칸 · 곽크릴 변환본(1024px · 셀 3~4px · 실루엣 테두리 어두운 비율 66~94% · 밝기 히스토그램이 양봉 — 면이 띠로 갈린다).
 * ⚠ Pillow · numpy 없이 돈다(원격 컨테이너).
 */
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const IN = opt('--in', 'food assets/crops');
const OUT = opt('--out', 'packages/client-pc/public/crops');
const CELLS = +opt('--cells', 192);
const CELL = +opt('--cell', 6);
const TOL = +opt('--tol', 30);
const CLOSE = +opt('--close', 4);   // 닫힘 반지름(px) — 밝은 피사체(땅콩 껍질 하이라이트)가 배경과 이어져 파인 홈을 메운다
const ONLY = opt('--only', null);
const ICON = +opt('--icon', 64);
const STYLE = opt('--style', 'pixelart');      // pixelart(툰 추상화) | kuwahara(v2 · 얼룩) | photo(사진 블록)
const COLORS = +opt('--colors', 32);            // k-평균 팔레트 크기(툰 뒤 색 통일)
const SMOOTH = +opt('--smooth', 2);             // kuwahara 반지름(셀) · 0 = 끔
const PASSES = +opt('--passes', 2);             // kuwahara 반복
const OUTLINE = +opt('--outline', 1);           // 0 없음 · 1 실루엣 · 2 실루엣 + 안쪽 먹선(밝기 차)
const CONTOUR = +opt('--contour', 40);          // 안쪽 먹선 밝기 차 문턱(outline 2)
const LEVELS = +opt('--levels', 6);             // 툰: 밝기 단 수(참고본처럼 면이 몇 단으로 갈린다)
const BILAT = +opt('--bilateral', 3);           // 툰: 양방향 필터 반복
const SIGR = +opt('--sigr', 22);                // 툰: 양방향 필터 색 폭(0~255)
const DOG = +opt('--dog', 1.0);                 // 툰: DoG 선 굵기(σ · 작업 해상도 px) — 셀 1개쯤
const EDGE = +opt('--edge', 3);                 // 툰: 선 진하기(φ) · 0 = 선 없음
const WORKX = +opt('--workx', 2);               // 툰 작업 해상도 = 셀 × 이 배수
const SAT = +opt('--sat', 1.15);                // 툰: 채도 배율(참고본은 사진보다 또렷하다)
const CONTRAST = +opt('--contrast', 1.1);       // 툰: 밝기 대비(128 기준 늘림)
const NOCUT = args.includes('--nocut');         // 배경 벗기기 생략(시험용)

async function decodeAny(file) {
  if (file.toLowerCase().endsWith('.png')) { try { return decode(file); } catch (e) { console.warn('내장 PNG 디코드 실패 — 크롬으로 (', e.message, ')'); } }
  let pw;
  for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) { try { pw = require(p); break; } catch { /* 다음 */ } }
  if (!pw) throw new Error('JPEG/WebP 디코드에 Playwright가 필요하다 — npx -p playwright 또는 PNG로 바꿔 넣을 것');
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  const b64 = fs.readFileSync(file).toString('base64');
  const mime = file.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const r = await page.evaluate(async ([src]) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let s = ''; for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { w: c.width, h: c.height, b64: btoa(s) };
  }, [`data:${mime};base64,${b64}`]);
  await browser.close();
  return { w: r.w, h: r.h, data: Buffer.from(r.b64, 'base64') };
}

/** 배경 벗기기 — 알파가 이미 있으면(테두리가 투명) 그대로 */
function cutout(img) {
  const { w, h, data } = img;
  let borderTransparent = 0, borderN = 0;
  const edge = (x, y) => { const a = data[(y * w + x) * 4 + 3]; borderN++; if (a < 8) borderTransparent++; };
  for (let x = 0; x < w; x++) { edge(x, 0); edge(x, h - 1); }
  for (let y = 0; y < h; y++) { edge(0, y); edge(w - 1, y); }
  if (borderTransparent / borderN > 0.9) return { data, note: '투명 배경 그대로' };
  // 테두리 색 표본(중앙값) = 배경색
  const samp = [[], [], []];
  const push = (x, y) => { const o = (y * w + x) * 4; samp[0].push(data[o]); samp[1].push(data[o + 1]); samp[2].push(data[o + 2]); };
  for (let x = 0; x < w; x += 2) { push(x, 0); push(x, 1); push(x, h - 1); push(x, h - 2); }
  for (let y = 0; y < h; y += 2) { push(0, y); push(1, y); push(w - 1, y); push(w - 2, y); }
  const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
  const bg = [med(samp[0]), med(samp[1]), med(samp[2])];
  const bgL = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  const lightBg = bgL > 200;
  const dist = (o) => Math.hypot(data[o] - bg[0], data[o + 1] - bg[1], data[o + 2] - bg[2]);
  const sat = (o) => { const r = data[o], g = data[o + 1], b = data[o + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
  // 배경다움: 배경색과 가깝거나, 밝은 배경이면 채도 낮은 밝은 회색(그림자 · 비네팅)도 배경
  // 배경다움: 배경색과 가깝고 채도가 낮다(밝은 배경의 그림자 · 비네팅은 중립 회색이라 채도 0.07 미만 · 밝기 200 이상도 배경)
  const bgLike = (o) => (dist(o) < TOL && sat(o) < 0.12) || (lightBg && sat(o) < 0.07 && (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) > 200);
  const mark = new Uint8Array(w * h); // 1 = 배경(테두리에서 닿음)
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) { const i = stack.pop(); if (mark[i]) continue; if (!bgLike(i * 4)) continue; mark[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w); }
  // 전경 연결 요소 — 가장 큰 덩어리만
  const comp = new Int32Array(w * h).fill(-1); let best = -1, bestN = 0, nc = 0;
  for (let s = 0; s < w * h; s++) { if (mark[s] || comp[s] >= 0) continue; const id = nc++; let n = 0; const st = [s]; comp[s] = id;
    while (st.length) { const i = st.pop(); n++; const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !mark[j] && comp[j] < 0) { comp[j] = id; st.push(j); } }
    if (n > bestN) { bestN = n; best = id; } }
  // 닫힘(팽창 → 침식) — 전경에 파인 좁은 홈 · 구멍을 메운다(피사체의 밝은 부분이 배경색과 비슷할 때)
  let fgMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) fgMask[i] = comp[i] === best ? 1 : 0;
  const grow = (m, val) => { const n = new Uint8Array(m); for (let i = 0; i < w * h; i++) { if (m[i] !== val) continue; const x = i % w, y = (i / w) | 0; if (x > 0) n[i - 1] = val; if (x < w - 1) n[i + 1] = val; if (y > 0) n[i - w] = val; if (y < h - 1) n[i + w] = val; } return n; };
  for (let r = 0; r < CLOSE; r++) fgMask = grow(fgMask, 1);
  for (let r = 0; r < CLOSE; r++) fgMask = grow(fgMask, 0);
  // 침식이 원래 전경을 깎지 않게 — 원래 전경은 그대로 둔다
  for (let i = 0; i < w * h; i++) if (comp[i] === best) fgMask[i] = 1;
  const out = Buffer.from(data);
  let fg = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (fgMask[i]) { out[o + 3] = 255; fg++; continue; }
    out[o + 3] = 0;
  }
  // 가장자리 1px 반투명 — 전경과 맞닿은 배경 픽셀 중 배경색에서 어느 정도 벗어난 것(안티에일리어싱 테두리)
  for (let i = 0; i < w * h; i++) {
    if (fgMask[i]) continue; const x = i % w, y = (i / w) | 0; let near = false;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && fgMask[j]) { near = true; break; }
    if (!near) continue; const d = dist(i * 4); if (d > TOL * 0.35) out[i * 4 + 3] = Math.min(200, Math.round(255 * Math.min(1, d / TOL)));
  }
  return { data: out, note: `배경 ${bg.join(',')} · 전경 ${(100 * fg / (w * h)).toFixed(0)}% · 덩어리 ${nc}` };
}

/** 면적 평균 다운샘플(프리멀티플라이드) */
function areaResize(src, sw, sh, dw, dh) {
  const out = new Float32Array(dw * dh * 4);
  const cnt = new Float32Array(dw * dh);
  for (let y = 0; y < sh; y++) { const dy = Math.min(dh - 1, Math.floor(y * dh / sh)); for (let x = 0; x < sw; x++) { const dx = Math.min(dw - 1, Math.floor(x * dw / sw));
    const o = (y * sw + x) * 4, a = src[o + 3] / 255, q = (dy * dw + dx); out[q * 4] += src[o] * a; out[q * 4 + 1] += src[o + 1] * a; out[q * 4 + 2] += src[o + 2] * a; out[q * 4 + 3] += a; cnt[q]++; } }
  const res = Buffer.alloc(dw * dh * 4);
  for (let q = 0; q < dw * dh; q++) { const a = out[q * 4 + 3]; const n = cnt[q] || 1; const al = a / n;
    if (a > 0) { res[q * 4] = Math.round(out[q * 4] / a); res[q * 4 + 1] = Math.round(out[q * 4 + 1] / a); res[q * 4 + 2] = Math.round(out[q * 4 + 2] / a); }
    res[q * 4 + 3] = al < 0.3 ? 0 : al > 0.85 ? 255 : Math.round(al * 255); }
  return res;
}

/** 언샤프(반지름 1 · 세기 amount) — 알파 > 0인 셀만, 색만 */
function unsharp(buf, w, h, amount) {
  const out = Buffer.from(buf);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (buf[o + 3] === 0) continue;
    for (let c = 0; c < 3; c++) { let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const p = (yy * w + xx) * 4; if (buf[p + 3] === 0) continue; s += buf[p + c]; n++; }
      const blur = s / n; out[o + c] = Math.max(0, Math.min(255, Math.round(buf[o + c] + (buf[o + c] - blur) * amount))); } }
  return out;
}

// ─────────────────────────────────────────────
// 픽셀 아트 grade 양식화(셀 해상도에서)
// ─────────────────────────────────────────────
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** 쿠와하라 — 4분면 중 분산이 가장 작은 쪽의 평균색(질감을 면으로 · 경계는 지킨다) */
function kuwahara(buf, w, h, r) {
  const out = Buffer.from(buf);
  const quads = [[-r, 0, -r, 0], [0, r, -r, 0], [-r, 0, 0, r], [0, r, 0, r]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4; if (buf[o + 3] < 128) continue;
    let best = Infinity, br = 0, bg = 0, bb = 0;
    for (const [x0, x1, y0, y1] of quads) {
      let n = 0, sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0;
      for (let yy = y + y0; yy <= y + y1; yy++) for (let xx = x + x0; xx <= x + x1; xx++) {
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const p = (yy * w + xx) * 4; if (buf[p + 3] < 128) continue;
        const l = lum(buf[p], buf[p + 1], buf[p + 2]); n++; sr += buf[p]; sg += buf[p + 1]; sb += buf[p + 2]; sl += l; sl2 += l * l; }
      if (!n) continue; const v = sl2 / n - (sl / n) * (sl / n);
      if (v < best) { best = v; br = sr / n; bg = sg / n; bb = sb / n; }
    }
    out[o] = Math.round(br); out[o + 1] = Math.round(bg); out[o + 2] = Math.round(bb);
  }
  return out;
}

/** k-평균 팔레트(결정적 — 밝기 분위수로 시작) · 디더 없음 */
function quantize(buf, w, h, K) {
  const pts = []; for (let i = 0; i < w * h; i++) if (buf[i * 4 + 3] >= 128) pts.push([buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
  if (pts.length === 0) return { buf, palette: [] };
  const byL = [...pts].sort((a, b) => lum(...a) - lum(...b));
  let cent = []; for (let k = 0; k < K; k++) cent.push([...byL[Math.min(byL.length - 1, Math.floor((k + 0.5) * byL.length / K))]]);
  const d2 = (a, b) => { const dl = lum(...a) - lum(...b); return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 + dl * dl; };
  let assign = new Int32Array(pts.length);
  for (let it = 0; it < 18; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pts.length; i++) { let bi = 0, bd = Infinity; for (let k = 0; k < cent.length; k++) { const d = d2(pts[i], cent[k]); if (d < bd) { bd = d; bi = k; } } assign[i] = bi; const s = sum[bi]; s[0] += pts[i][0]; s[1] += pts[i][1]; s[2] += pts[i][2]; s[3]++; }
    for (let k = 0; k < cent.length; k++) { const s = sum[k]; if (s[3]) cent[k] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; else { let far = 0, fd = -1; for (let i = 0; i < pts.length; i++) { const d = d2(pts[i], cent[assign[i]]); if (d > fd) { fd = d; far = i; } } cent[k] = [...pts[far]]; } }
  }
  // 가까운 색은 합친다(거리 < 10)
  const merged = []; for (const c of cent) { if (!merged.some((m) => Math.sqrt((m[0] - c[0]) ** 2 + (m[1] - c[1]) ** 2 + (m[2] - c[2]) ** 2) < 10)) merged.push(c); }
  const pal = merged.map((c) => c.map(Math.round));
  const out = Buffer.from(buf);
  for (let i = 0; i < w * h; i++) { const o = i * 4; if (buf[o + 3] === 0) continue; const p = [buf[o], buf[o + 1], buf[o + 2]]; let bi = 0, bd = Infinity; for (let k = 0; k < pal.length; k++) { const d = d2(p, pal[k]); if (d < bd) { bd = d; bi = k; } } out[o] = pal[bi][0]; out[o + 1] = pal[bi][1]; out[o + 2] = pal[bi][2]; }
  return { buf: out, palette: pal };
}

/** 윤곽선 — 실루엣 셀은 그 색을 22%로 어둡게(흰 → 중간 회색 · 베이지 → 짙은 갈색), 안쪽은 밝기 차 > contour인 경계의 어두운 쪽을 60%로 */
function outline(buf, w, h, mode, contour) {
  const out = Buffer.from(buf); const op = (i) => buf[i * 4 + 3] >= 128;
  const sil = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op(i)) continue;
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !op(i - 1) || !op(i + 1) || !op(i - w) || !op(i + w);
    if (edge) { sil[i] = 1; const o = i * 4; out[o] = Math.round(buf[o] * 0.22); out[o + 1] = Math.round(buf[o + 1] * 0.22); out[o + 2] = Math.round(buf[o + 2] * 0.22); out[o + 3] = 255; } }
  if (mode < 2) return out;
  const inked = new Uint8Array(w * h);
  const ink = (i) => { if (inked[i] || sil[i]) return; inked[i] = 1; const o = i * 4; out[o] = Math.round(buf[o] * 0.6); out[o + 1] = Math.round(buf[o + 1] * 0.6); out[o + 2] = Math.round(buf[o + 2] * 0.6); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op(i) || sil[i]) continue; const o = i * 4; const l = lum(buf[o], buf[o + 1], buf[o + 2]);
    for (const j of [x < w - 1 ? i + 1 : -1, y < h - 1 ? i + w : -1]) { if (j < 0 || !op(j) || sil[j]) continue; const q = j * 4; const l2 = lum(buf[q], buf[q + 1], buf[q + 2]); if (Math.abs(l - l2) > contour) ink(l < l2 ? i : j); } }
  return out;
}

// ─────────────────────────────────────────────
// 툰 추상화(Winnemöller 2006 「실시간 영상 추상화」) — 양방향 필터 × n → 밝기 단 양자화(부드러운 문턱) → DoG 선
//   픽셀 아트 grade 참고본(바칸 · 곽크릴)의 특징 = 형태를 따르는 깨끗한 선 · 몇 단의 면 · 질감은 선으로 단순화 — 이 셋을 고전 기법으로 흉내 낸다.
// ─────────────────────────────────────────────
function bilateral(buf, w, h, sigS, sigR) {
  const r = Math.ceil(sigS * 2); const out = Buffer.from(buf);
  const gs = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) gs.push(Math.exp(-(dx * dx + dy * dy) / (2 * sigS * sigS)));
  const gr = new Float32Array(256 * 3); for (let d = 0; d < 256 * 3; d++) gr[d] = Math.exp(-(d * d) / (2 * sigR * sigR * 3));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (buf[o + 3] < 128) continue;
    let sr = 0, sg = 0, sb = 0, sw = 0, k = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++, k++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const p = (yy * w + xx) * 4; if (buf[p + 3] < 128) continue;
      const d = Math.abs(buf[p] - buf[o]) + Math.abs(buf[p + 1] - buf[o + 1]) + Math.abs(buf[p + 2] - buf[o + 2]); const wgt = gs[k] * gr[d]; sr += buf[p] * wgt; sg += buf[p + 1] * wgt; sb += buf[p + 2] * wgt; sw += wgt; }
    if (sw > 0) { out[o] = Math.round(sr / sw); out[o + 1] = Math.round(sg / sw); out[o + 2] = Math.round(sb / sw); } }
  return out;
}
function gaussL(L, w, h, sig, alpha) {
  const r = Math.max(1, Math.ceil(sig * 3)); const k = []; let ks = 0; for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sig * sig)); k.push(v); ks += v; }
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, sw = 0; for (let i = -r; i <= r; i++) { const xx = x + i; if (xx < 0 || xx >= w || !alpha[y * w + xx]) continue; s += L[y * w + xx] * k[i + r]; sw += k[i + r]; } tmp[y * w + x] = sw ? s / sw : L[y * w + x]; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, sw = 0; for (let i = -r; i <= r; i++) { const yy = y + i; if (yy < 0 || yy >= h || !alpha[yy * w + x]) continue; s += tmp[yy * w + x] * k[i + r]; sw += k[i + r]; } out[y * w + x] = sw ? s / sw : tmp[y * w + x]; }
  return out;
}
function toonAbstract(buf, w, h, o) {
  let s = buf; for (let i = 0; i < o.bilateral; i++) s = bilateral(s, w, h, o.sigS, o.sigR);
  const alpha = new Uint8Array(w * h); const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { alpha[i] = s[i * 4 + 3] >= 128 ? 1 : 0; L[i] = lum(s[i * 4], s[i * 4 + 1], s[i * 4 + 2]); }
  // DoG 선 — 두 가우스 차가 음수인 곳(어두운 쪽 경계)을 tanh로 눌러 먹선
  let edge = null;
  if (o.edge > 0) { const g1 = gaussL(L, w, h, o.dog, alpha), g2 = gaussL(L, w, h, o.dog * 1.6, alpha); edge = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const d = (g1[i] - 0.98 * g2[i]) / 255; edge[i] = d > 0 ? 1 : 1 + Math.tanh(o.edge * d * 8); } }
  // 밝기 단 양자화(부드러운 문턱 φ=3) — 색은 밝기 비율로 따라간다 · 대비(128 기준) · 채도(밝기 기준 색차 배율)
  const dq = 255 / o.levels; const out = Buffer.from(s);
  for (let i = 0; i < w * h; i++) { if (!alpha[i]) continue; const l0 = L[i]; const l = Math.max(0, Math.min(255, 128 + (l0 - 128) * o.contrast));
    const qn = Math.floor(l / dq) * dq + dq / 2; const lq = Math.max(0, Math.min(255, qn + (dq / 2) * Math.tanh(3 * (l - qn) / dq)));
    let f = l0 > 1 ? lq / l0 : 1; if (edge) f *= Math.max(0.15, edge[i]);
    const p = i * 4; const lf = lq * (edge ? Math.max(0.15, edge[i]) : 1);
    for (let c = 0; c < 3; c++) { const v = s[p + c] * f; out[p + c] = Math.max(0, Math.min(255, Math.round(lf + (v - lf) * o.sat))); } }
  return out;
}

/** 색 수(정확) · 실루엣 테두리의 어두운 비율 — 픽셀 아트 grade 참고치(바칸 94% · 곽크릴 66~75%) */
function gradeStats(buf, w, h) {
  const colors = new Set(); let edge = 0, dark = 0; const op = (i) => buf[i * 4 + 3] >= 128;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op(i)) continue; colors.add((buf[i * 4] << 16) | (buf[i * 4 + 1] << 8) | buf[i * 4 + 2]);
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !op(i - 1) || !op(i + 1) || !op(i - w) || !op(i + w)) { edge++; if (lum(buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]) < 70) dark++; } }
  return { colors: colors.size, edgeDark: Math.round(100 * dark / Math.max(1, edge)) };
}

function nearestUp(buf, w, h, k) {
  const W = w * k, H = h * k, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (((y / k) | 0) * w + ((x / k) | 0)) * 4, d = (y * W + x) * 4; out[d] = buf[s]; out[d + 1] = buf[s + 1]; out[d + 2] = buf[s + 2]; out[d + 3] = buf[s + 3]; }
  return out;
}

function measure(buf, w, h) {
  let n = 0, sum = 0, sum2 = 0, semi = 0; const colors = new Set();
  for (let i = 0; i < w * h; i++) { const a = buf[i * 4 + 3]; if (!a) continue; n++; if (a < 255) semi++; const L = 0.2126 * buf[i * 4] + 0.7152 * buf[i * 4 + 1] + 0.0722 * buf[i * 4 + 2]; sum += L; sum2 += L * L; if (i % 5 === 0) colors.add((buf[i * 4] >> 2 << 12) | (buf[i * 4 + 1] >> 2 << 6) | (buf[i * 4 + 2] >> 2)); }
  const m = sum / n; return { opaquePct: Math.round(100 * n / (w * h)), semiPct: +(100 * semi / n).toFixed(1), colors: colors.size, meanL: Math.round(m), sdL: Math.round(Math.sqrt(Math.max(0, sum2 / n - m * m))) };
}

(async () => {
  if (!fs.existsSync(IN)) { console.error('입력 폴더가 없다:', IN); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(IN).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).filter((f) => !ONLY || path.parse(f).name === ONLY);
  for (const f of files) {
    const id = path.parse(f).name;
    const img = await decodeAny(path.join(IN, f));
    const cut = NOCUT ? { data: Buffer.from(img.data), note: '배경 그대로' } : cutout(img);
    const { w, h } = img; const d = cut.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.error(id, '— 전경이 없다(배경 허용 오차를 낮춰 볼 것)'); continue; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const scale = CELLS / Math.max(bw, bh);
    const cw = Math.max(1, Math.round(bw * scale)), ch = Math.max(1, Math.round(bh * scale));
    const crop = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++) d.copy(crop, y * bw * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + bw) * 4);
    // 셀 격자(여백 2셀)
    const pad = 2, gw = cw + pad * 2, gh = ch + pad * 2;
    const cells = Buffer.alloc(gw * gh * 4);
    const inner = scale < 1 ? areaResize(crop, bw, bh, cw, ch) : nearestUp(crop, bw, bh, 1);
    const iw = scale < 1 ? cw : bw, ih = scale < 1 ? ch : bh;
    const dst = scale < 1 ? inner : areaResize(inner, iw, ih, cw, ch);
    for (let y = 0; y < ch; y++) dst.copy(cells, ((y + pad) * gw + pad) * 4, y * cw * 4, (y + 1) * cw * 4);
    let sharp; let palN = 0;
    if (STYLE === 'photo') {
      sharp = unsharp(cells, gw, gh, 0.45);
    } else if (STYLE === 'kuwahara') {
      let s = cells;
      for (let i = 0; i < PASSES && SMOOTH > 0; i++) s = kuwahara(s, gw, gh, SMOOTH);
      s = unsharp(s, gw, gh, 0.3);
      const q = quantize(s, gw, gh, COLORS); s = q.buf; palN = q.palette.length;
      sharp = OUTLINE > 0 ? outline(s, gw, gh, OUTLINE, CONTOUR) : s;
    } else {
      // 툰 추상화는 셀보다 WORKX배 큰 작업 해상도에서(선이 셀 하나 굵기로 내려오게) → 셀로 면적 평균 → 팔레트 통일 → 실루엣 윤곽
      const ws = Math.min(1, (CELLS * WORKX) / Math.max(bw, bh));
      const ww = Math.max(1, Math.round(bw * ws)), wh = Math.max(1, Math.round(bh * ws));
      const work = ws < 1 ? areaResize(crop, bw, bh, ww, wh) : crop;
      const scaleToCell = Math.max(ww, wh) / Math.max(cw, ch);   // 작업 px / 셀
      const toon = toonAbstract(work, ww, wh, { bilateral: BILAT, sigS: 1.2 * scaleToCell, sigR: SIGR, levels: LEVELS, dog: DOG * scaleToCell * 0.5, edge: EDGE, sat: SAT, contrast: CONTRAST });
      const small = areaResize(toon, ww, wh, cw, ch);
      let s = Buffer.alloc(gw * gh * 4); for (let y = 0; y < ch; y++) small.copy(s, ((y + pad) * gw + pad) * 4, y * cw * 4, (y + 1) * cw * 4);
      const q = quantize(s, gw, gh, COLORS); s = q.buf; palN = q.palette.length;
      sharp = OUTLINE > 0 ? outline(s, gw, gh, OUTLINE, CONTOUR) : s;
    }
    const portrait = nearestUp(sharp, gw, gh, CELL);
    const pw = gw * CELL, ph = gh * CELL;
    const outP = path.join(OUT, `${id}.png`);
    const bytes = encode(pw, ph, portrait, outP);
    // 아이콘 64px — 셀 그림을 면적 평균으로
    const is = ICON / Math.max(gw, gh); const iw2 = Math.max(1, Math.round(gw * is)), ih2 = Math.max(1, Math.round(gh * is));
    const icon = areaResize(sharp, gw, gh, iw2, ih2);
    encode(iw2, ih2, icon, path.join(OUT, `${id}_icon.png`));
    const mm = measure(portrait, pw, ph); const gs = gradeStats(sharp, gw, gh);
    console.log(`${id}: ${w}x${h} → 셀 ${gw}x${gh} · 초상 ${pw}x${ph}(${(bytes / 1024).toFixed(0)}KB) · 아이콘 ${iw2}x${ih2} | ${cut.note} | ${STYLE}${STYLE === 'pixelart' ? ` 팔레트 ${palN}` : ''} · 색 ${gs.colors} · 테두리 어두움 ${gs.edgeDark}% · 불투명 ${mm.opaquePct}% · 밝기 ${mm.meanL}±${mm.sdL}`);
  }
  // 목록 TS — BootScene이 읽는다(기본 출력 폴더일 때만 — 시험용 --out 폴더로 돌릴 때 목록을 덮지 않는다)
  if (path.resolve(OUT) !== path.resolve('packages/client-pc/public/crops')) { console.log('시험 출력 폴더 — CropPortraits.ts는 건드리지 않는다'); return; }
  const have = fs.readdirSync(OUT).filter((f) => /^crop_[a-z_]+\.png$/.test(f) && !f.endsWith('_icon.png')).map((f) => f.slice(0, -4)).sort();
  const ts = `/**\n * @file CropPortraits.ts\n * @description 241차 — 작물 초상이 있는 수확물 기본 id 목록(자동 생성 — \`node tools/pixelize_crops.cjs\`).\n *  BootScene이 \`crops/<id>.png\`(초상) · \`crops/<id>_icon.png\`(64px 아이콘)를 \`cropimg_<id>\` · \`cropicon_<id>\`로 싣는다.\n *  목록에 없는 작물은 16px 손그림 픽셀 아이콘(\`px:<id>\`)을 그대로 쓴다. 손으로 고치지 말 것.\n */\nexport const CROP_PORTRAITS: readonly string[] = [\n${have.map((x) => `  '${x}',`).join('\n')}\n];\n`;
  fs.writeFileSync('packages/client-pc/src/data/CropPortraits.ts', ts);
  console.log(`초상 ${have.length}장 → CropPortraits.ts`);
})().catch((e) => { console.error(e); process.exit(1); });
