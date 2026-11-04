/**
 * @file holes.cjs
 * @description 300차 D — 피사체에 **갇힌 흰 배경 섬**을 찾아 뚫는다(카드 · 아이콘 굽기 공용 · 원본 해상도에서 굽기 전에).
 *
 *  사용자 「간이 백팩 — 가방 등받이와 메는 손잡이 사이가 투명이어야 하는데 흰 배경이 차 있다」.
 *  배경을 테두리에서 BFS로 벗길 때 피사체(가방 몸통 + 멜빵 고리)에 둘러싸여 못 닿은 흰 배경이 남은 것이다.
 *  설치 도구(`gemini_tackle_art.cjs cutoutMulti`)에도 뚫기가 있지만 「섬이 그림의 3% 미만」 상한이 있어
 *  간이 백팩(흰 섬 7만 px · 그림의 6%)은 지나쳤다. 여기서는 이미 벗겨진 원본(투명 바탕)을 굽기 직전에 다시 본다.
 *
 *  기준 — 245차 작물 초상(`pixelize_crops.cjs` `holes` = 둘레 평균 밝기 < 180 · 순백 ≥ 248 · 12px)은 **사진**용이라
 *  Gemini 도트 그림에는 너무 넓다(실측 — 원본 386장 중 132장이 걸렸고 거의 전부 흰 라벨 · 흰 접시 · 흰 담뱃갑 · 반짝임이었다).
 *  도트 그림에서 배경 섬과 흰 피사체를 가르는 것은 **둘레가 바깥 윤곽선과 같은 먹인가**다 — 배경 구멍은 피사체의 바깥
 *  윤곽선(검정)에만 둘러싸이고, 흰 라벨 · 흰 면은 안쪽 선(회색 · 색)에 둘러싸인다(둘레 평균 밝기 실측: 구멍 5~12 · 흰 면 23 이상).
 *   - 섬 = 알파 > 0이고 **무채 흰**(채도 < 0.06 · 밝기 > 235)인 4-연결 덩어리.
 *   - 갇힘 = 그림 테두리에도, 투명 칸(알파 < 32)에도 닿지 않는다(닿으면 바깥으로 열린 흰 면 — 흰 봉투의 가장자리).
 *   - 둘레(섬 밖 4-이웃) = 평균 밝기 < 40 이고 **실루엣 윤곽(투명에 닿은 불투명 칸) 밝기 중앙값 + 8 이하** 이고
 *     둘레 칸의 95% 이상이 밝기 < 30(검정 먹). 얼음 상자 리본 고리 안(둘레 21 · 윤곽 7 — 상자 뚜껑과 배경이 한 덩어리)은 남는다.
 *   - 크기 ≥ 1,000px(192칸 격자의 약 28칸) — 검정 바탕 위 흰 반짝임(1~3칸 · 실측 최대 756px)은 남는다.
 *     1,000px은 1,164px 원본을 30px 칸에 그릴 때 1px 아래라 보이는 구멍은 전부 잡힌다.
 *   - 섬 최소 채널 평균 ≥ 248(순백 — 실측 구멍 254 이상) · 섬이 불투명 칸의 절반을 넘으면 흰 피사체 통째(남긴다).
 *   - 흰 물건(생김새 표 `keepWhite`)도 같은 기준이다 — 흰 면 · 흰 라벨은 안쪽 선에 둘러싸여 걸리지 않는다(300차 D 실측 — 흰 물건 중
 *     걸린 것은 칼슘액비 손잡이 고리 하나이고 그것은 진짜 배경 구멍). 건너뛰면 그 구멍을 못 뚫는다.
 *  뚫은 칸은 알파 0 · RGB 0(투명 칸 규칙 — 줄일 때 흰색이 번지지 않게).
 *
 *  모듈: `findTrappedWhite(data, w, h, opts)` → { islands: [{ n, x0, y0, x1, y1, ringL, darkFrac, whiteAvg }], mask, rimL }
 *        `clearTrappedWhite(data, w, h, opts)` → 제자리에서 뚫고 { n, px, islands }
 */
'use strict';

/** 기본 기준 — 300차 D 실측(items 271 · tackle 115 · fish 62 · dishes 8 · forage 28 · crops 339 · faces 75)으로 정한 값 */
const HOLE_DEFAULTS = {
  sat: 0.06,          // 무채 = 채도(1 − min/max) 미만
  lum: 235,           // 흰 = 밝기(Rec.709) 초과
  ringMax: 40,        // 둘레 평균 밝기 상한
  ringOverRim: 8,     // 둘레 평균 밝기 ≤ 실루엣 윤곽 밝기 중앙값 + 이 값(음수 = 안 본다)
  ringDark: 30,       // 둘레 칸을 「검정 먹」으로 보는 밝기(0 = 안 본다)
  ringDarkFrac: 0.95, // 검정 먹 둘레 칸 비율 하한
  whiteMin: 248,      // 섬 최소 채널 평균 하한(순백)
  minSize: 1000,      // 섬 최소 크기(px)
  openAlpha: 32,      // 이 알파 미만 칸에 닿으면 바깥으로 열린 면(갇히지 않음)
  maxFrac: 0.5,       // 섬이 불투명 칸의 이 비율 이상이면 흰 피사체 통째(뚫지 않음)
};

const lumOf = (d, o) => 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2];
const satOf = (d, o) => { const mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = Math.min(d[o], d[o + 1], d[o + 2]); return mx ? (mx - mn) / mx : 0; };

/** 실루엣 윤곽(투명 칸 · 그림 테두리에 닿은 불투명 칸) 밝기 중앙값 — 바깥 윤곽선의 먹 */
function rimLuminance(data, w, h, openAlpha) {
  const L = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (data[i * 4 + 3] < openAlpha) continue;
    let edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
    if (!edge) for (const j of [i - 1, i + 1, i - w, i + w]) if (data[j * 4 + 3] < openAlpha) { edge = true; break; }
    if (edge) L.push(lumOf(data, i * 4));
  }
  if (!L.length) return 0;
  L.sort((a, b) => a - b);
  return L[L.length >> 1];
}

/**
 * 갇힌 흰 배경 섬 찾기(뚫지 않는다).
 * @returns {{ islands: Array<{n:number,x0:number,y0:number,x1:number,y1:number,ringL:number,darkFrac:number,whiteAvg:number}>, mask: Uint8Array, rimL: number }}
 */
function findTrappedWhite(data, w, h, opts = {}) {
  const P = { ...HOLE_DEFAULTS, ...opts };
  const whiteish = (o) => data[o + 3] > 0 && satOf(data, o) < P.sat && lumOf(data, o) > P.lum;
  let opaque = 0;
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] >= P.openAlpha) opaque++;
  const rimL = P.ringOverRim >= 0 ? rimLuminance(data, w, h, P.openAlpha) : 0;
  const ringCap = P.ringOverRim >= 0 ? Math.min(P.ringMax, rimL + P.ringOverRim) : P.ringMax;
  const seen = new Uint8Array(w * h);
  const mask = new Uint8Array(w * h);
  const islands = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen[s0] || !whiteish(s0 * 4)) continue;
    const st = [s0]; seen[s0] = 1;
    const mem = []; const ring = new Set();
    let open = false, minSum = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    while (st.length) {
      const i = st.pop(); mem.push(i);
      const o = i * 4; minSum += Math.min(data[o], data[o + 1], data[o + 2]);
      const x = i % w, y = (i - x) / w;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) open = true;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j < 0) continue;
        if (whiteish(j * 4)) { if (!seen[j]) { seen[j] = 1; st.push(j); } }
        else { if (data[j * 4 + 3] < P.openAlpha) open = true; ring.add(j); }
      }
    }
    if (open || mem.length < P.minSize || !ring.size) continue;
    if (mem.length >= opaque * P.maxFrac) continue;
    let ringL = 0, dark = 0;
    for (const j of ring) { const L = lumOf(data, j * 4); ringL += L; if (L < P.ringDark) dark++; }
    ringL /= ring.size;
    const darkFrac = dark / ring.size;
    const whiteAvg = minSum / mem.length;
    if (ringL <= ringCap && whiteAvg >= P.whiteMin && (P.ringDark <= 0 || darkFrac >= P.ringDarkFrac)) {
      for (const i of mem) mask[i] = 1;
      islands.push({ n: mem.length, x0, y0, x1, y1, ringL: Math.round(ringL), darkFrac: Math.round(darkFrac * 100) / 100, whiteAvg: Math.round(whiteAvg * 10) / 10 });
    }
  }
  islands.sort((a, b) => b.n - a.n);
  return { islands, mask, rimL: Math.round(rimL) };
}

/** 갇힌 흰 배경 섬을 제자리에서 뚫는다(알파 0 · RGB 0). @returns {{ n:number, px:number, islands:Array }} */
function clearTrappedWhite(data, w, h, opts = {}) {
  const { islands, mask } = findTrappedWhite(data, w, h, opts);
  let px = 0;
  for (let i = 0; i < w * h; i++) if (mask[i]) { data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = data[i * 4 + 3] = 0; px++; }
  return { n: islands.length, px, islands };
}

module.exports = { HOLE_DEFAULTS, rimLuminance, findTrappedWhite, clearTrappedWhite };
