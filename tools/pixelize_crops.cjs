#!/usr/bin/env node
/**
 * @file pixelize_crops.cjs
 * @description 241차 — 작물 사진 → 어종 에셋 기준 도트 초상(사용자 지시 「작물 그림을 어종 그래픽 쪽으로 정합」 · 2차 「픽셀 아트 grade로 조정」).
 *
 * 어종 에셋 실측(tools/check_art_quality.cjs · 53장 중앙값): 긴 변 1,259px · 셀 6px(→ 가로 약 190셀) · 8비트 RGBA ·
 * 색 5,000종 이상(팔레트 양자화 없음) · 밝기 표준편차 60 · 반투명 테두리 10% · 셀 안 노이즈 22(부드러운 셀).
 * 이 도구는 그 기준으로 작물 사진을 굽는다 — **같은 출처 한 장**에서 초상(상세 · 도감 · 위키)과 가방 아이콘(64px)을 함께 낸다.
 *
 * 입력: `food assets/crops/<수확물 기본 id>.(png|jpg|jpeg|webp)` — 흰(단색) 배경 사진 · 투명 PNG · **이미 도트로 변환한 그림**(격자가 보이면 그대로 쓴다).
 *       파일명 = 수확물 기본 id(`crop_peanut`).
 * 출력: `packages/client-pc/public/crops/<id>.png`(초상 · 셀 6px · 긴 변 ≈ 1,152px) · `<id>_icon.png`(64px · 면적 평균) ·
 *       `packages/client-pc/src/data/CropPortraits.ts`(있는 초상 목록 — BootScene이 읽는다).
 *
 *   node tools/pixelize_crops.cjs [--only crop_peanut] [--in "food assets/crops"] [--out packages/client-pc/public/crops] [--style auto|pixelart|asis|photo|kuwahara]
 *   손잡이(기본값은 DEFAULTS — 2026-10-13 딸기 · 상추 9종 · 바칸 · 곽크릴 참고본 쌍으로 보정): --levels --phi --bilateral --sigr --dog --edge
 *   --sat --contrast --colors(0 = 팔레트 안 줄임) --unsharp --detail --detailStep --outline --outlineDark --cells --cell --tol --close
 *
 * 절차: ① 디코드(PNG는 내장 · JPEG/WebP는 Playwright 크롬 캔버스) ② 배경 벗기기(테두리 색 표본 → 허용 오차 안 색을 테두리에서 BFS ·
 *   가장 큰 전경 덩어리만 · 닫힘 · 가장자리 1px 반투명) ③ 타이트 크롭 + 2셀 여백
 *   ④ 양식(`--style auto` 기본): 입력에 **셀 격자가 보이면 `asis`**(사용자가 AI 변환 → piskel로 만든 도트를 그 격자 그대로 — 긴 변 128~288셀이면
 *      셀 수도 그대로, 아니면 192셀로) · 아니면 **`pixelart`**(툰 추상화 = 양방향 평활 → 밝기 단 → DoG 먹선 → 셀 → 미세 질감 되살리기 →
 *      언샤프 → 팔레트 → 실루엣 윤곽(그 색의 짙은 톤)).
 *      `--style photo` = 235~241차 초기의 사진 블록화(언샤프만 — 픽셀 아트 grade 아님) · `kuwahara` = v2(얼룩 · 비교용).
 *      보정(241 3차): 팔레트를 줄이지 않고(colors 0) · 양방향 평활 없이(질감 유지) · 5단(φ 5) · 채도 1.25 · 대비 0.95 · 윤곽 = 안쪽 이웃 색의 70% · 바닥 그림자 걷기 — 참고본 12쌍 가중 손실 62.8 → 17.8.
 *   ⑤ 최근접 ×cell 확대 = 초상 · 셀 그림을 64px로 면적 평균 = 아이콘 ⑥ 결과를 재측정해 표로 찍는다(색 수 · 윤곽 어둡기).
 * 모듈로도 쓴다: `require('./pixelize_crops.cjs').processImage(img, { ...DEFAULTS, ...덮어쓸 값 })` → 셀 그림(보정 스윕 `scratchpad/art/calib.cjs`).
 * ⚠ Pillow · numpy 없이 돈다(원격 컨테이너).
 */
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');

/** 기본값 — 2026-10-13 참고본 12쌍(딸기 · 상추 9종 · 바칸 · 곽크릴)으로 보정한 값(tools/crop_calib.cjs --sweep · 가중 손실 62.8 → 17.4).
 *  근거 · 전후 수치는 docs/wiki/02-SYSTEMS/photo-pixel-art.md §3.6~3.7. 보정 전 값은 주석의 (구 …). */
const DEFAULTS = {
  cells: 192, cell: 6, tol: 30, close: 4, icon: 64,
  style: 'pixelart',    // pixelart(툰 추상화) | asis(이미 도트인 그림 — 리샘플만 · 입력 폴더의 asis/ 하위는 자동) | kuwahara | photo
  colors: 0,            // k-평균 팔레트 크기(0 = 줄이지 않음 — 참고본은 90%를 덮는 색이 수백 개 · 구 32가 손실의 절반이었다)
  smooth: 2, passes: 2, // kuwahara(비교용)
  outline: 1,           // 0 없음 · 1 실루엣 · 2 실루엣 + 안쪽 먹선(밝기 차)
  outlineDark: 0.7,     // 실루엣 셀 = 안쪽 이웃 색 × 이 값(참고본 테두리는 안쪽의 51~73% · 구 0.22 = 제 색을 거의 검정으로)
  contour: 40,          // 안쪽 먹선 밝기 차 문턱(outline 2)
  levels: 5,            // 툰: 밝기 단 수(0 = 단 없음 · 구 6)
  phi: 5,               // 툰: 단 문턱 경사(클수록 띠 경계가 딱 떨어진다 · 구 3)
  bilateral: 0,         // 툰: 양방향 필터 반복(0 = 끔 — 참고본은 질감을 지우지 않는다 · 구 3)
  sigr: 22,             // 툰: 양방향 필터 색 폭(0~255)
  dog: 1.0,             // 툰: DoG 선 굵기(σ · 셀 단위 비례)
  edge: 3,              // 툰: 선 진하기(φ) · 0 = 선 없음
  workx: 2,             // 툰 작업 해상도 = 셀 × 이 배수
  sat: 1.25,            // 툰: 채도 배율(구 1.15)
  contrast: 0.95,       // 툰: 밝기 대비(128 기준 — 참고본은 대비를 올리지 않는다 · 구 1.1)
  detail: 0,            // 셀 단계 미세 질감 되살리기 — 평활 전 밝기 잔차(|L − 3×3 평균|)가 이 값(0~255)을 넘는 셀을 한 단 어둡게/밝게 · 0 = 끔
  detailStep: 0.12,     // 그 한 단의 배율
  unsharp: 0,           // 셀 단계 언샤프 세기(0 = 끔)
  shadow: 0.25,         // 배경에 닿은 밝고 채도 낮은(< 이 값) 픽셀 덩어리가 전경 bbox 아래 30%에 있으면 바닥 그림자로 보고 걷는다(0 = 끔 · 전경 15% 초과면 되돌림)
  nocut: false,         // 배경 벗기기 생략(시험용)
};

function parseArgs(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const P = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) {
    if (typeof DEFAULTS[k] === 'boolean') { if (argv.includes('--' + k)) P[k] = true; continue; }
    const v = opt('--' + k); if (v !== undefined) P[k] = typeof DEFAULTS[k] === 'number' ? +v : v;
  }
  P.in = opt('--in') ?? 'food assets/crops'; P.out = opt('--out') ?? 'packages/client-pc/public/crops'; P.only = opt('--only') ?? null;
  return P;
}

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
function cutout(img, P) {
  const { w, h, data } = img; const TOL = P.tol, CLOSE = P.close;
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
  // 그림자 걷어내기 — 배경에 닿은 밝고(L>185) 채도 낮은(< shadow) 픽셀 덩어리(바닥 그림자 · 흰 번짐)를 전경에서 뺀다.
  //   전경의 15%를 넘으면 흰 피사체(무 · 마늘)로 보고 되돌린다. 241 딸기: 바닥 분홍 그림자가 실루엣에 붙어 윤곽선이 그림자를 둘렀다.
  let shadowNote = '';
  if (P.shadow > 0) { let fgTotal = 0; for (let i = 0; i < w * h; i++) fgTotal += fgMask[i];
    const shadowLike = (o) => sat(o) < P.shadow && (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) > 185;
    const rm = new Uint8Array(w * h); const st2 = [];
    for (let i = 0; i < w * h; i++) { if (!fgMask[i] || !shadowLike(i * 4)) continue; const x = i % w, y = (i / w) | 0; let touch = false;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !fgMask[j]) { touch = true; break; }
      if (touch) { rm[i] = 1; st2.push(i); } }
    let n = 0; while (st2.length) { const i = st2.pop(); n++; const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && fgMask[j] && !rm[j] && shadowLike(j * 4)) { rm[j] = 1; st2.push(j); } }
    // 바닥 그림자만 — 후보 덩어리의 무게중심이 전경 bbox 아래 30% 안에 있을 때만 뺀다(땅콩 윗등의 옅은 껍질 하이라이트가 지워졌던 실측 — 5,144px 구멍)
    let fy0 = h, fy1 = -1; for (let i = 0; i < w * h; i++) if (fgMask[i]) { const y = (i / w) | 0; if (y < fy0) fy0 = y; if (y > fy1) fy1 = y; }
    const cut = new Uint8Array(w * h); let removed = 0, kept = 0;
    const cid = new Int32Array(w * h).fill(-1); let nid = 0;
    for (let s0 = 0; s0 < w * h; s0++) { if (!rm[s0] || cid[s0] >= 0) continue; const id = nid++; const st3 = [s0]; cid[s0] = id; const mem = []; let sy = 0;
      while (st3.length) { const i = st3.pop(); mem.push(i); sy += (i / w) | 0; const x = i % w, y = (i / w) | 0;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && rm[j] && cid[j] < 0) { cid[j] = id; st3.push(j); } }
      if (sy / mem.length >= fy0 + 0.7 * (fy1 - fy0)) { for (const i of mem) cut[i] = 1; removed += mem.length; } else kept += mem.length; }
    if (removed > 0 && removed < 0.15 * fgTotal) { for (let i = 0; i < w * h; i++) if (cut[i]) fgMask[i] = 0; shadowNote = ` · 그림자 ${removed}px 걷음${kept ? `(위쪽 밝은 가장자리 ${kept}px는 둠)` : ''}`; }
    else if (removed > 0) shadowNote = ` · 그림자 후보 ${removed}px(전경 15% 초과 — 둠)`; else if (n > 0) shadowNote = ` · 밝은 가장자리 ${n}px(바닥 아님 — 둠)`; }
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
  return { data: out, note: `배경 ${bg.join(',')} · 전경 ${(100 * fg / (w * h)).toFixed(0)}% · 덩어리 ${nc}${shadowNote}` };
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

/** 리샘플 — 줄이면 면적 평균, 키우면 쌍선형(프리멀티플라이드). areaResize만 쓰면 키울 때 빈 셀(격자 구멍)이 생긴다(241 — 상추 185px 입력 실측) */
function resample(src, sw, sh, dw, dh) {
  if (dw <= sw && dh <= sh) return areaResize(src, sw, sh, dw, dh);
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) { const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) * sh / dh - 0.5)); const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < dw; x++) { const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) * sw / dw - 0.5)); const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), tx = fx - x0;
      let r = 0, g = 0, b = 0, a = 0;
      for (const [yy, wy] of [[y0, 1 - ty], [y1, ty]]) for (const [xx, wx] of [[x0, 1 - tx], [x1, tx]]) { const wgt = wy * wx; if (!wgt) continue; const o = (yy * sw + xx) * 4; const al = src[o + 3] / 255 * wgt; r += src[o] * al; g += src[o + 1] * al; b += src[o + 2] * al; a += al; }
      const d = (y * dw + x) * 4; if (a > 0) { out[d] = Math.round(r / a); out[d + 1] = Math.round(g / a); out[d + 2] = Math.round(b / a); } out[d + 3] = a < 0.3 ? 0 : a > 0.85 ? 255 : Math.round(a * 255); } }
  return out;
}
/** 같은 색 가로 런(≥3px)에 든 불투명 픽셀 비율 — 이미 도트인 그림은 높고 사진은 낮다 */
function flatRunFrac(w, h, data) {
  let n = 0, inRun = 0;
  for (let y = 0; y < h; y++) { let x = 0; while (x < w) { const o = (y * w + x) * 4; if (data[o + 3] < 128) { x++; continue; } let e = x + 1;
    while (e < w) { const q = (y * w + e) * 4; if (data[q + 3] < 128 || data[q] !== data[o] || data[q + 1] !== data[o + 1] || data[q + 2] !== data[o + 2]) break; e++; }
    const len = e - x; n += len; if (len >= 3) inRun += len; x = e; } }
  return n ? inRun / n : 0;
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

/** 윤곽선 — 실루엣 셀은 **안쪽 이웃 셀**의 평균색을 darkF 배로(0.22 = 거의 검정 · 0.45 = 짙은 톤 · 안쪽 이웃이 없으면 제 색).
 *  제 색을 어둡게 하면 흰 배경이 섞인 가장자리 셀이 회색 테가 된다(241 3차 상추 실측). 안쪽은 밝기 차 > contour인 경계의 어두운 쪽을 60%로(mode 2). */
function outline(buf, w, h, mode, contour, darkF = 0.22) {
  const out = Buffer.from(buf); const op = (i) => buf[i * 4 + 3] >= 128;
  const sil = new Uint8Array(w * h);
  const isEdge = (i) => { const x = i % w, y = (i / w) | 0; return x === 0 || y === 0 || x === w - 1 || y === h - 1 || !op(i - 1) || !op(i + 1) || !op(i - w) || !op(i + w); };
  for (let i = 0; i < w * h; i++) if (op(i) && isEdge(i)) sil[i] = 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!sil[i]) continue;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (!op(j) || sil[j]) continue; r += buf[j * 4]; g += buf[j * 4 + 1]; b += buf[j * 4 + 2]; n++; }
    const o = i * 4; const src = n ? [r / n, g / n, b / n] : [buf[o], buf[o + 1], buf[o + 2]];
    out[o] = Math.round(src[0] * darkF); out[o + 1] = Math.round(src[1] * darkF); out[o + 2] = Math.round(src[2] * darkF); out[o + 3] = 255; }
  if (mode < 2) return out;
  const inked = new Uint8Array(w * h);
  const ink = (i) => { if (inked[i] || sil[i]) return; inked[i] = 1; const o = i * 4; out[o] = Math.round(buf[o] * 0.6); out[o + 1] = Math.round(buf[o + 1] * 0.6); out[o + 2] = Math.round(buf[o + 2] * 0.6); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op(i) || sil[i]) continue; const o = i * 4; const l = lum(buf[o], buf[o + 1], buf[o + 2]);
    for (const j of [x < w - 1 ? i + 1 : -1, y < h - 1 ? i + w : -1]) { if (j < 0 || !op(j) || sil[j]) continue; const q = j * 4; const l2 = lum(buf[q], buf[q + 1], buf[q + 2]); if (Math.abs(l - l2) > contour) ink(l < l2 ? i : j); } }
  return out;
}

// ─────────────────────────────────────────────
// 툰 추상화(Winnemöller 2006 「실시간 영상 추상화」) — 양방향 필터 × n → 밝기 단 양자화(부드러운 문턱) → DoG 선
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
  // 밝기 단 양자화(부드러운 문턱 φ) — 색은 밝기 비율로 따라간다 · 대비(128 기준) · 채도(밝기 기준 색차 배율)
  const phi = o.phi ?? 3; const dq = o.levels > 0 ? 255 / o.levels : 0; const out = Buffer.from(s);
  for (let i = 0; i < w * h; i++) { if (!alpha[i]) continue; const l0 = L[i]; const l = Math.max(0, Math.min(255, 128 + (l0 - 128) * o.contrast));
    let lq = l; if (dq > 0) { const qn = Math.floor(l / dq) * dq + dq / 2; lq = Math.max(0, Math.min(255, qn + (dq / 2) * Math.tanh(phi * (l - qn) / dq))); }
    let f = l0 > 1 ? lq / l0 : 1; if (edge) f *= Math.max(0.15, edge[i]);
    const p = i * 4; const lf = lq * (edge ? Math.max(0.15, edge[i]) : 1);
    for (let c = 0; c < 3; c++) { const v = s[p + c] * f; out[p + c] = Math.max(0, Math.min(255, Math.round(lf + (v - lf) * o.sat))); } }
  return out;
}

/** 미세 질감 되살리기 — 평활 전 셀 밝기의 3×3 잔차가 ±T를 넘는 셀을 한 단 어둡게/밝게(감자 껍질 점 · 딸기 씨 · 광택) */
function detailInject(small, orig, w, h, T, step) {
  const out = Buffer.from(small); const op = new Uint8Array(w * h); const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { op[i] = orig[i * 4 + 3] >= 128 ? 1 : 0; L[i] = lum(orig[i * 4], orig[i * 4 + 1], orig[i * 4 + 2]); }
  let dark = 0, light = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op[i]) continue; let s = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (!op[j]) continue; s += L[j]; n++; }
    const res = L[i] - s / n; let f = 1; if (res < -T) { f = 1 - step; dark++; } else if (res > T) { f = 1 + step; light++; } if (f === 1) continue;
    const p = i * 4; for (let c = 0; c < 3; c++) out[p + c] = Math.max(0, Math.min(255, Math.round(small[p + c] * f))); }
  return { buf: out, dark, light };
}

/** 셀 격자 검출(이미 도트인 입력) — 열/행 경계의 밝기 차가 주기 c · 위상 p에 몰리는 정도(작은 주기 우선 · 큰 주기는 15% 이상 높아야) */
function detectGrid(w, h, data, mask) {
  const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = lum(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const colE = new Float64Array(w), rowE = new Float64Array(h);
  for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) { const i = y * w + x; if (!mask[i]) continue; if (mask[i - 1]) colE[x] += Math.abs(L[i] - L[i - 1]); if (mask[i - w]) rowE[y] += Math.abs(L[i] - L[i - w]); }
  const best = (E, n) => { let mean = 0; for (let i = 1; i < n; i++) mean += E[i]; mean /= Math.max(1, n - 1); let out = { c: 1, p: 0, score: 1 }; if (!mean) return out;
    for (let c = 2; c <= 12; c++) for (let p = 0; p < c; p++) { let s = 0, k = 0; for (let i = p; i < n; i += c) { if (i < 1) continue; s += E[i]; k++; } const sc = k ? (s / k) / mean : 0; if (sc > out.score * (c > out.c ? 1.15 : 1) + 1e-9) out = { c, p, score: +sc.toFixed(2) }; }
    return out; };
  return { x: best(colE, w), y: best(rowE, h) };
}
/** 격자 중앙 샘플 → 셀 그림(알파는 마스크) */
function toCellsCenter(w, h, data, mask, gx, gy) {
  const c = gx.c, cy = gy.c; const x0 = gx.p - Math.ceil(gx.p / c) * c, y0 = gy.p - Math.ceil(gy.p / cy) * cy;
  const cw = Math.ceil((w - x0) / c), ch = Math.ceil((h - y0) / cy); const buf = Buffer.alloc(cw * ch * 4);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const xc = Math.min(w - 1, Math.max(0, x0 + i * c + (c >> 1))), yc = Math.min(h - 1, Math.max(0, y0 + j * cy + (cy >> 1))); const k = yc * w + xc; const d = (j * cw + i) * 4;
    buf[d] = data[k * 4]; buf[d + 1] = data[k * 4 + 1]; buf[d + 2] = data[k * 4 + 2]; buf[d + 3] = mask[k] ? 255 : 0; }
  return { w: cw, h: ch, buf };
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

/** 알파 bbox로 자르고 pad셀 투명 여백을 두른다 */
function padCells(buf, w, h, pad) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, gw = cw + pad * 2, gh = ch + pad * 2; const out = Buffer.alloc(gw * gh * 4);
  for (let y = 0; y < ch; y++) buf.copy(out, ((y + pad) * gw + pad) * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4);
  return { buf: out, w: gw, h: gh };
}

/**
 * 한 장 처리 — 디코드된 RGBA → 셀 그림(초상 전 단계). 반환 { sharp, gw, gh, note, palN, style, detail }
 *  P = { ...DEFAULTS, ...덮어쓸 값 } — CLI와 보정 스윕이 같은 함수를 쓴다.
 */
function processImage(img, P) {
  const cut = P.nocut ? { data: Buffer.from(img.data), note: '배경 그대로' } : cutout(img, P);
  const { w, h } = img; const d = cut.data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const crop = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) d.copy(crop, y * bw * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + bw) * 4);
  const pad = 2; let note = cut.note; let style = P.style; let grid = null;
  const scale = P.cells / Math.max(bw, bh);
  const cw = Math.max(1, Math.round(bw * scale)), ch = Math.max(1, Math.round(bh * scale));
  const gw = cw + pad * 2, gh = ch + pad * 2;
  const cells = Buffer.alloc(gw * gh * 4);
  if (style === 'asis') {
    // 이미 도트로 변환된 그림(사용자 AI 변환 → piskel) — 양식화 없이 192셀로 리샘플만 한다. ⚠ 자동 판정은 하지 않는다:
    //   AI 변환본(WebP)은 같은 색 런이 2~56%로 사진(0~30%)과 겹쳐 구별이 안 된다(241 실측) — 폴더(asis/)나 --style asis로 지정한다.
    {
      const dst0 = resample(crop, bw, bh, cw, ch); const s0 = Buffer.alloc(gw * gh * 4); for (let y = 0; y < ch; y++) dst0.copy(s0, ((y + pad) * gw + pad) * 4, y * cw * 4, (y + 1) * cw * 4);
      note += ' · 도트 그대로(리샘플만)';
      return { sharp: s0, gw, gh, note, palN: 0, style, grid, detail: null };
    }
  }
  const dst = resample(crop, bw, bh, cw, ch);
  for (let y = 0; y < ch; y++) dst.copy(cells, ((y + pad) * gw + pad) * 4, y * cw * 4, (y + 1) * cw * 4);
  let sharp; let palN = 0; let det = null;
  if (style === 'photo') {
    sharp = unsharp(cells, gw, gh, 0.45);
  } else if (style === 'kuwahara') {
    let s = cells;
    for (let i = 0; i < P.passes && P.smooth > 0; i++) s = kuwahara(s, gw, gh, P.smooth);
    s = unsharp(s, gw, gh, 0.3);
    const q = quantize(s, gw, gh, P.colors); s = q.buf; palN = q.palette.length;
    sharp = P.outline > 0 ? outline(s, gw, gh, P.outline, P.contour, P.outlineDark) : s;
  } else {
    // 툰 추상화는 셀보다 workx배 큰 작업 해상도에서(선이 셀 하나 굵기로 내려오게) → 셀로 면적 평균 → 질감 되살리기 → 언샤프 → 팔레트 → 실루엣 윤곽
    const ws = Math.min(1, (P.cells * P.workx) / Math.max(bw, bh));
    const ww = Math.max(1, Math.round(bw * ws)), wh = Math.max(1, Math.round(bh * ws));
    const work = ws < 1 ? areaResize(crop, bw, bh, ww, wh) : crop;
    const scaleToCell = Math.max(ww, wh) / Math.max(cw, ch);   // 작업 px / 셀
    const toon = toonAbstract(work, ww, wh, { bilateral: P.bilateral, sigS: 1.2 * scaleToCell, sigR: P.sigr, levels: P.levels, phi: P.phi, dog: P.dog * scaleToCell * 0.5, edge: P.edge, sat: P.sat, contrast: P.contrast });
    let small = resample(toon, ww, wh, cw, ch);
    if (P.detail > 0) { const orig = resample(work, ww, wh, cw, ch); const r = detailInject(small, orig, cw, ch, P.detail, P.detailStep); small = r.buf; det = { dark: r.dark, light: r.light }; }
    let s = Buffer.alloc(gw * gh * 4); for (let y = 0; y < ch; y++) small.copy(s, ((y + pad) * gw + pad) * 4, y * cw * 4, (y + 1) * cw * 4);
    if (P.unsharp > 0) s = unsharp(s, gw, gh, P.unsharp);
    if (P.colors > 0) { const q = quantize(s, gw, gh, P.colors); s = q.buf; palN = q.palette.length; }
    sharp = P.outline > 0 ? outline(s, gw, gh, P.outline, P.contour, P.outlineDark) : s;
  }
  return { sharp, gw, gh, note, palN, style, grid, detail: det };
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const IN = P.in, OUT = P.out;
  if (!fs.existsSync(IN)) { console.error('입력 폴더가 없다:', IN); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const pick = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).filter((f) => !P.only || path.parse(f).name === P.only).map((f) => path.join(dir, f)) : [];
  // 같은 id가 사진과 asis/ 양쪽에 있으면 asis(사용자 변환본)가 이긴다 — 사진은 참고 · 보정용으로 남겨 둔다
  const asisFiles = pick(path.join(IN, 'asis')).map((f) => ({ f, style: 'asis' })); const asisIds = new Set(asisFiles.map((x) => path.parse(x.f).name));
  const photoFiles = pick(IN).filter((f) => !asisIds.has(path.parse(f).name) || (console.log(`${path.parse(f).name}: asis/ 변환본이 있어 사진은 건너뛴다`), false)).map((f) => ({ f, style: P.style }));
  const files = [...photoFiles, ...asisFiles];
  for (const { f, style } of files) {
    const id = path.parse(f).name;
    const img = await decodeAny(f);
    const r = processImage(img, { ...P, style });
    if (!r) { console.error(id, '— 전경이 없다(배경 허용 오차를 낮춰 볼 것)'); continue; }
    const { sharp, gw, gh } = r;
    const portrait = nearestUp(sharp, gw, gh, P.cell);
    const pw = gw * P.cell, ph = gh * P.cell;
    const outP = path.join(OUT, `${id}.png`);
    const bytes = encode(pw, ph, portrait, outP);
    // 아이콘 64px — 셀 그림을 면적 평균으로
    const is = P.icon / Math.max(gw, gh); const iw2 = Math.max(1, Math.round(gw * is)), ih2 = Math.max(1, Math.round(gh * is));
    const icon = areaResize(sharp, gw, gh, iw2, ih2);
    encode(iw2, ih2, icon, path.join(OUT, `${id}_icon.png`));
    const mm = measure(portrait, pw, ph); const gs = gradeStats(sharp, gw, gh);
    console.log(`${id}${style === 'asis' ? '(asis)' : ''}: ${img.w}x${img.h} → 셀 ${gw}x${gh} · 초상 ${pw}x${ph}(${(bytes / 1024).toFixed(0)}KB) · 아이콘 ${iw2}x${ih2} | ${r.note} | ${r.style}${r.palN ? ` 팔레트 ${r.palN}` : ''}${r.detail ? ` · 질감 어둡게 ${r.detail.dark} 밝게 ${r.detail.light}` : ''} · 색 ${gs.colors} · 테두리 어두움 ${gs.edgeDark}% · 불투명 ${mm.opaquePct}% · 밝기 ${mm.meanL}±${mm.sdL}`);
  }
  // 목록 TS — BootScene이 읽는다(기본 출력 폴더일 때만 — 시험용 --out 폴더로 돌릴 때 목록을 덮지 않는다)
  if (path.resolve(OUT) !== path.resolve('packages/client-pc/public/crops')) { console.log('시험 출력 폴더 — CropPortraits.ts는 건드리지 않는다'); return; }
  const have = fs.readdirSync(OUT).filter((f) => /^crop_[a-z_]+\.png$/.test(f) && !f.endsWith('_icon.png')).map((f) => f.slice(0, -4)).sort();
  const ts = `/**\n * @file CropPortraits.ts\n * @description 241차 — 작물 초상이 있는 수확물 기본 id 목록(자동 생성 — \`node tools/pixelize_crops.cjs\`).\n *  BootScene이 \`crops/<id>.png\`(초상) · \`crops/<id>_icon.png\`(64px 아이콘)를 \`cropimg_<id>\` · \`cropicon_<id>\`로 싣는다.\n *  목록에 없는 작물은 16px 손그림 픽셀 아이콘(\`px:<id>\`)을 그대로 쓴다. 손으로 고치지 말 것.\n */\nexport const CROP_PORTRAITS: readonly string[] = [\n${have.map((x) => `  '${x}',`).join('\n')}\n];\n`;
  fs.writeFileSync('packages/client-pc/src/data/CropPortraits.ts', ts);
  console.log(`초상 ${have.length}장 → CropPortraits.ts`);
}

module.exports = { DEFAULTS, parseArgs, decodeAny, cutout, processImage, areaResize, resample, flatRunFrac, unsharp, quantize, outline, toonAbstract, detailInject, detectGrid, toCellsCenter, gradeStats, measure, nearestUp, padCells, lum };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
