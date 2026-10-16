/**
 * @file outline.cjs
 * @description 256차 — 어두운 칸에 묻히는 그림의 바깥 윤곽에 아주 얇은 밝은 테를 두른다(카드 · 아이콘 굽기 공용).
 *
 *  사용자 「새 그물 그림이 어두운 칸에서 잘 안보인다 … 오브젝트 경계면에 어느 정도 얇게(하이라이트가 주 목적이 아니므로 최대한 얇게) 흰 테두리」.
 *  - 테는 **물건 바깥쪽 투명 칸에만** 칠한다(물건 픽셀은 그대로). 두께 t = 바깥으로 t칸(맨해튼 거리 — 대각 모서리를 덜 칠해 더 얇게 보인다).
 *  - 그물코 · 손잡이 고리처럼 **속 구멍에는 두르지 않는다** — 마스크를 닫힘(팽창 r → 침식 r)으로 메운 뒤
 *    그림 가장자리에서 이어지는 바깥 투명만 테 후보로 본다. 안 그러면 그물 가닥마다 흰 테가 생겨 그물 전체가 하얘진다.
 *  - 테가 들어갈 자리는 호출하는 쪽이 비워 둔다(`padRgba` — 맞출 칸에서 2t를 빼고 줄인 뒤 사방 t칸).
 */
'use strict';

/** RGBA 버퍼 사방에 투명 t칸을 덧댄다 */
function padRgba(data, w, h, t) {
  const W = w + t * 2, H = h + t * 2, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < h; y++) data.copy(out, ((y + t) * W + t) * 4, y * w * 4, (y + 1) * w * 4);
  return { w: W, h: H, data: out };
}

/** 체비쇼프 반지름 r 팽창 · 침식(그림 밖 = 0) — 닫힘은 둘레를 r칸 덧댄 판에서 해 가장자리 효과가 없게 한다 */
function dilate(m, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue;
    for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) out[yy * w + xx] = 1;
  }
  return out;
}
function erode(m, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let all = 1;
    for (let yy = y - r; yy <= y + r && all; yy++) for (let xx = x - r; xx <= x + r; xx++) {
      if (yy < 0 || yy >= h || xx < 0 || xx >= w || !m[yy * w + xx]) { all = 0; break; }
    }
    out[y * w + x] = all;
  }
  return out;
}
/** 닫힘(팽창 r → 침식 r) — 둘레 r칸을 덧댄 판에서 하고 잘라 낸다 · 원래 물건 칸은 언제나 1 */
function closeMask(m, w, h, r) {
  if (r <= 0) return m;
  const W = w + r * 2, H = h + r * 2, big = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) big[(y + r) * W + x + r] = m[y * w + x];
  const c = erode(dilate(big, W, H, r), W, H, r);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = c[(y + r) * W + x + r] | m[y * w + x];
  return out;
}

/**
 * 바깥 윤곽 테. `data`를 제자리에서 고친다. 반환 = 칠한 칸 수.
 * @param t 두께(칸) · @param rgba 테 색 · @param closeR 속 구멍 메우는 닫힘 반지름 · @param minA 물건으로 보는 알파
 */
function addOutline(data, w, h, t = 1, rgba = [255, 255, 255, 235], closeR = 2, minA = 64) {
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = data[i * 4 + 3] >= minA ? 1 : 0;
  const closed = closeMask(m, w, h, closeR);
  // 그림 가장자리에서 이어지는 바깥 투명(4-연결)
  const ext = new Uint8Array(w * h);
  const st = [];
  const push = (x, y) => { const i = y * w + x; if (!closed[i] && !ext[i]) { ext[i] = 1; st.push(i); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (st.length) {
    const i = st.pop(), x = i % w, y = (i - x) / w;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!ext[i]) continue;
    let near = false;
    for (let dy = -t; dy <= t && !near; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      const span = t - Math.abs(dy);
      for (let dx = -span; dx <= span; dx++) {
        const xx = x + dx;
        if (xx >= 0 && xx < w && closed[yy * w + xx]) { near = true; break; }
      }
    }
    if (!near) continue;
    data[i * 4] = rgba[0]; data[i * 4 + 1] = rgba[1]; data[i * 4 + 2] = rgba[2]; data[i * 4 + 3] = rgba[3];
    n++;
  }
  return n;
}

module.exports = { padRgba, addOutline };
