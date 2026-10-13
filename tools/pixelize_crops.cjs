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
 *   가장 큰 전경 덩어리만 · 가장자리 1px 반투명) ③ 타이트 크롭 + 2셀 여백 ④ 면적 평균으로 셀 격자(긴 변 cells) ⑤ 가벼운 언샤프(윤곽 복원)
 *   ⑥ 최근접 ×cell 확대 = 초상 · 셀 그림을 64px로 면적 평균 = 아이콘 ⑦ 결과를 5기준으로 재측정해 표로 찍는다.
 * ⚠ Pillow · numpy 없이 돈다(원격 컨테이너). PixelOE(torch)를 쓴 어종 원본과 100% 같지는 않지만 측정값 범위 안에 들어온다.
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
    const cut = cutout(img);
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
    const sharp = unsharp(cells, gw, gh, 0.45);
    const portrait = nearestUp(sharp, gw, gh, CELL);
    const pw = gw * CELL, ph = gh * CELL;
    const outP = path.join(OUT, `${id}.png`);
    const bytes = encode(pw, ph, portrait, outP);
    // 아이콘 64px — 셀 그림을 면적 평균으로
    const is = ICON / Math.max(gw, gh); const iw2 = Math.max(1, Math.round(gw * is)), ih2 = Math.max(1, Math.round(gh * is));
    const icon = areaResize(sharp, gw, gh, iw2, ih2);
    encode(iw2, ih2, icon, path.join(OUT, `${id}_icon.png`));
    const mm = measure(portrait, pw, ph);
    console.log(`${id}: ${w}x${h} → 셀 ${gw}x${gh} · 초상 ${pw}x${ph}(${(bytes / 1024).toFixed(0)}KB) · 아이콘 ${iw2}x${ih2} | ${cut.note} | 불투명 ${mm.opaquePct}% · 반투명 ${mm.semiPct}% · 색 ${mm.colors} · 밝기 ${mm.meanL}±${mm.sdL}`);
  }
  // 목록 TS — BootScene이 읽는다
  const have = fs.readdirSync(OUT).filter((f) => /^crop_[a-z_]+\.png$/.test(f) && !f.endsWith('_icon.png')).map((f) => f.slice(0, -4)).sort();
  const ts = `/**\n * @file CropPortraits.ts\n * @description 241차 — 작물 초상이 있는 수확물 기본 id 목록(자동 생성 — \`node tools/pixelize_crops.cjs\`).\n *  BootScene이 \`crops/<id>.png\`(초상) · \`crops/<id>_icon.png\`(64px 아이콘)를 \`cropimg_<id>\` · \`cropicon_<id>\`로 싣는다.\n *  목록에 없는 작물은 16px 손그림 픽셀 아이콘(\`px:<id>\`)을 그대로 쓴다. 손으로 고치지 말 것.\n */\nexport const CROP_PORTRAITS: readonly string[] = [\n${have.map((x) => `  '${x}',`).join('\n')}\n];\n`;
  fs.writeFileSync('packages/client-pc/src/data/CropPortraits.ts', ts);
  console.log(`초상 ${have.length}장 → CropPortraits.ts`);
})().catch((e) => { console.error(e); process.exit(1); });
