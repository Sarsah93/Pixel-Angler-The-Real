// @file lettuce_grid_split.cjs — 241차 상추 9종 격자(사진 · 변환본) → 9장 분리. 사진 쪽은 품종 글자(검정 + 흰 테두리)를 지운다. 2열 대조 시트도 만든다.
const fs = require('fs'); const path = require('path'); const { decode, encode } = require('./lib_png.cjs');
const NAMES = ['cheongchima', 'kkot', 'cheongchukmyeon', 'cheongromaine', 'jeokromaine', 'jeokchukmyeon', 'saengchae', 'jeokchima', 'butterhead'];
const KO = ['청치마', '꽃상추', '청축면', '청로메인', '적로메인', '적축면', '생채', '적치마', '버터헤드'];
function split3(img) { const { w, h, data } = img; const cw = Math.floor(w / 3), ch = Math.floor(h / 3); const out = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const buf = Buffer.alloc(cw * ch * 4); for (let y = 0; y < ch; y++) data.copy(buf, y * cw * 4, ((r * ch + y) * w + c * cw) * 4, ((r * ch + y) * w + c * cw + cw) * 4); out.push({ w: cw, h: ch, data: buf }); }
  return out; }
/** 글자 지우기 — 무채색 어두운 픽셀(max<90 · max−min<30) 반지름 r 팽창 → 흰색 */
function eraseText(cell, r) { const { w, h, data } = cell; const m = new Uint8Array(w * h); let n = 0;
  // 글자 = 순검정(max<45 · 채도 차<12) · 자리 = 각 칸의 오른쪽 아래(y>60% · x>35%) — 적상추의 어두운 잎(R이 G·B보다 크다)은 제외
  for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0; if (y < h * 0.6 || x < w * 0.35) continue; const R = data[i * 4], G = data[i * 4 + 1], B = data[i * 4 + 2]; const mx = Math.max(R, G, B), mn = Math.min(R, G, B); if (mx < 45 && mx - mn < 12) { m[i] = 1; n++; } }
  const d = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) { if (!m[i]) continue; const x = i % w, y = (i / w) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; d[yy * w + xx] = 1; } }
  // 왼쪽 가장자리 12px(옆 칸 글자 꼬리)도 지운다
  for (let y = 0; y < h; y++) for (let x = 0; x < 12; x++) d[y * w + x] = 1;
  const out = Buffer.from(data); let e = 0; for (let i = 0; i < w * h; i++) if (d[i]) { out[i * 4] = 255; out[i * 4 + 1] = 255; out[i * 4 + 2] = 255; out[i * 4 + 3] = 255; e++; }
  return { w, h, data: out, textPx: n, erased: e }; }
const photo = decode('food assets/crops/_calib/raw/lettuce_grid_photo.png'), px = decode('food assets/crops/_calib/raw/lettuce_grid_px.png');
const C = 'food assets/crops/_calib'; fs.mkdirSync(C + '/photo', { recursive: true }); fs.mkdirSync(C + '/ref', { recursive: true });
const pc = split3(photo), xc = split3(px);
const tiles = [];
for (let k = 0; k < 9; k++) { const e = eraseText(pc[k], 5); encode(e.w, e.h, e.data, `${C}/photo/crop_lettuce_${NAMES[k]}.png`); encode(xc[k].w, xc[k].h, xc[k].data, `${C}/ref/crop_lettuce_${NAMES[k]}.png`);
  console.log(`${k + 1} ${KO[k]} (${NAMES[k]}): 사진 셀 ${e.w}x${e.h} 글자 ${e.textPx}px → 지움 ${e.erased}px · 변환본 셀 ${xc[k].w}x${xc[k].h}`); tiles.push([e, xc[k]]); }
// 대조 시트 9행 × 2열(높이 150)
const H = 150, pad = 8; const scaled = tiles.map((row) => row.map((im) => { const sc = H / im.h; const W = Math.round(im.w * sc); const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const x0 = Math.floor(x / sc), x1 = Math.max(x0 + 1, Math.floor((x + 1) / sc)), y0 = Math.floor(y / sc), y1 = Math.max(y0 + 1, Math.floor((y + 1) / sc)); let r = 0, g = 0, b = 0, n = 0; for (let yy = y0; yy < y1 && yy < im.h; yy++) for (let xx = x0; xx < x1 && xx < im.w; xx++) { const o = (yy * im.w + xx) * 4; r += im.data[o]; g += im.data[o + 1]; b += im.data[o + 2]; n++; } const d = (y * W + x) * 4; buf[d] = r / n; buf[d + 1] = g / n; buf[d + 2] = b / n; buf[d + 3] = 255; } return { W, buf }; }));
const colW = [Math.max(...scaled.map((r) => r[0].W)), Math.max(...scaled.map((r) => r[1].W))]; const TW = pad * 3 + colW[0] + colW[1], TH = pad + 9 * (H + pad);
const sheet = Buffer.alloc(TW * TH * 4); for (let i = 0; i < TW * TH; i++) { sheet[i * 4] = 30; sheet[i * 4 + 1] = 34; sheet[i * 4 + 2] = 40; sheet[i * 4 + 3] = 255; }
scaled.forEach((row, k) => { let ox = pad; row.forEach((im, j) => { for (let y = 0; y < H; y++) for (let x = 0; x < im.W; x++) { const s = (y * im.W + x) * 4, d = ((pad + k * (H + pad) + y) * TW + ox + x) * 4; sheet[d] = im.buf[s]; sheet[d + 1] = im.buf[s + 1]; sheet[d + 2] = im.buf[s + 2]; } ox += colW[j] + pad; }); });
encode(TW, TH, sheet, C + '/raw/lettuce_pairs.png'); console.log('sheet', C + '/raw/lettuce_pairs.png', TW, TH);
