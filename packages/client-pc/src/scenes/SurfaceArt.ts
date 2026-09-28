/**
 * SurfaceArt — 심리스 필드의 **절차 도트 재료**(181차).
 *
 * 사용자 지시(레퍼런스 3장):
 *  ① 도심 — 인도·광장에 **타일 경계선이 보이지 않게**(구 Kenney tan 벽돌 셀은 16px 원본을 ×2로 키운
 *     셀이라 셀마다 무늬가 다시 시작돼 격자가 드러났다).
 *  ② 사석 방파제 — 매끄러운 직사각 돌길 + 수면 위/아래 돌덩이.
 *  ③ 테트라포드 — Y·역Y가 교차해 빈틈을 메우고, 틈으로 **더 깔린 어두운 테트라포드**가 보인다.
 *
 * 여기에는 캔버스에 그리는 **순수 페인터**만 둔다(Phaser 없음). 배치·판정은 `SeamlessChunks`가 한다.
 * 모든 도트는 **2px 그레인**(Kenney 지면 ×2와 같은 격자) — 1px 도트가 섞이면 입자가 어긋난다(106차).
 */

export type RGB = readonly [number, number, number];

/** 결정적 해시 (0~1) — SeamlessChunks.hash2와 같은 식 */
export function sHash(seed: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** 주기 값 노이즈 — 격자 `cell`px, 주기 `period`px(= cell의 배수)에서 **감긴다**(아틀라스 이음 0) */
function pNoise(seed: number, x: number, y: number, cell: number, period: number): number {
  const n = Math.max(1, Math.round(period / cell));
  const fx = x / cell, fy = y / cell;
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fx - ix, ty = fy - iy;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const w = (i: number): number => ((i % n) + n) % n;
  const a = sHash(seed, w(ix), w(iy)) * (1 - sx) + sHash(seed, w(ix + 1), w(iy)) * sx;
  const b = sHash(seed, w(ix), w(iy + 1)) * (1 - sx) + sHash(seed, w(ix + 1), w(iy + 1)) * sx;
  return a * (1 - sy) + b * sy;
}

const hex = (r: number, g: number, b: number): string =>
  `rgb(${Math.max(0, Math.min(255, Math.round(r)))},${Math.max(0, Math.min(255, Math.round(g)))},${Math.max(0, Math.min(255, Math.round(b)))})`;

// ─────────────────────────────────────────────
// 1. 무이음 표면 아틀라스
// ─────────────────────────────────────────────

/** 표면 재료 사양 — 명도 변화만으로 질감을 낸다(선·줄눈 없음 = 격자가 드러날 여지 없음) */
export interface SurfaceSpec {
  seed: number;
  base: RGB;
  /** 저주파 얼룩 진폭(명도 ±) — 넓은 면이 한 색으로 죽지 않게 */
  mottle: number;
  /** 2px 입자 진폭 */
  grain: number;
  /** 어두운/밝은 반점 비율 */
  darkRate: number;
  lightRate: number;
  /** 얼룩(기름·물 자국) — 저주파 노이즈 임계 이상에서 명도를 내린다 */
  stain: number;
  /** 색 온도 쏠림 — 반점마다 r/b를 살짝 흔든다 */
  warm: number;
}

/** 도심 재료 4종 — 레퍼런스 ①(수복탑 사거리): 광장·주차장은 회색 콘크리트, 공터는 따뜻한 콘크리트 */
export const SURFACES = {
  /** 맨땅('.') — 건물 부지·공터. 구 tan 벽돌 셀의 평균 명도(≈168)를 유지해 도시 톤이 급변하지 않게 */
  con: { seed: 0x5c01, base: [174, 167, 154], mottle: 7, grain: 4, darkRate: 0.05, lightRate: 0.035, stain: 9, warm: 3 },
  /** 콘크리트 광장·주차장('r' — 도로 밴드 밖) */
  plaza: { seed: 0x5c02, base: [148, 150, 150], mottle: 6, grain: 4, darkRate: 0.06, lightRate: 0.03, stain: 11, warm: 1 },
  /** 포장 광장('p') — 밝은 화강 포석 톤 */
  pave: { seed: 0x5c03, base: [166, 165, 160], mottle: 5, grain: 5, darkRate: 0.07, lightRate: 0.05, stain: 6, warm: 2 },
  /** 안벽·부두 상판('b' 비방파제) — 레퍼런스 ①의 물가 콘크리트 */
  quay: { seed: 0x5c04, base: [156, 158, 155], mottle: 6, grain: 4, darkRate: 0.05, lightRate: 0.04, stain: 12, warm: 0 },
} as const satisfies Record<string, SurfaceSpec>;

export type SurfaceName = keyof typeof SURFACES;

/**
 * `size`×`size` 주기 아틀라스를 그린다. 모든 노이즈가 `size`에서 감기므로 아틀라스를 타일처럼
 * 이어 붙여도 이음이 없다. 호출측은 이 캔버스를 `tr` 프레임으로 잘라 **월드 좌표 위상**으로 고른다.
 */
export function paintSurfaceAtlas(ctx: CanvasRenderingContext2D, size: number, spec: SurfaceSpec): void {
  const [br, bg, bb] = spec.base;
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n1 = pNoise(spec.seed, x, y, size / 4, size);
      const n2 = pNoise(spec.seed ^ 0x99, x, y, size / 12, size);
      const n3 = pNoise(spec.seed ^ 0x3c, x, y, size / 24, size);
      let v = (n1 - 0.5) * 2 * spec.mottle + (n2 - 0.5) * spec.mottle + (n3 - 0.5) * spec.mottle * 0.5;
      const h = sHash(spec.seed ^ 0x51, x >> 1, y >> 1);
      v += (h - 0.5) * 2 * spec.grain;
      // 얼룩 — 저주파 두 겹이 동시에 높을 때만 (둥근 자국)
      const st = pNoise(spec.seed ^ 0x7a, x, y, size / 6, size);
      if (st > 0.66) v -= (st - 0.66) / 0.34 * spec.stain;
      let dr = 0, db = 0;
      const h2 = sHash(spec.seed ^ 0x77, x >> 1, y >> 1);
      if (h2 < spec.darkRate) { v -= 10 + h2 / spec.darkRate * 6; dr = spec.warm; }
      else if (h2 > 1 - spec.lightRate) { v += 8; db = spec.warm * 0.5; }
      ctx.fillStyle = hex(br + v + dr, bg + v, bb + v + db);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

/**
 * 주기 보로노이 — 격자 `n`×`n`(주기 `size`) 안의 특징점까지 가장 가까운 거리 F1·두 번째 F2와
 * 가장 가까운 칸 번호. F2 − F1이 작은 곳이 **판 경계**(각진 균열)다. 주기라 아틀라스 이음이 없다.
 */
function worley(seed: number, x: number, y: number, n: number, size: number): { f1: number; f2: number; id: number; dx: number; dy: number } {
  const cs = size / n;
  const ci = Math.floor(x / cs), cj = Math.floor(y / cs);
  let f1 = 1e9, f2 = 1e9, id = 0, bdx = 0, bdy = 0;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj;
      const wi = ((i % n) + n) % n, wj = ((j % n) + n) % n;
      const px = (i + 0.15 + 0.7 * sHash(seed, wi, wj)) * cs;
      const py = (j + 0.15 + 0.7 * sHash(seed ^ 0x5a, wi, wj)) * cs;
      const ddx = x - px, ddy = y - py;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < f1) { f2 = f1; f1 = d; id = wj * n + wi; bdx = ddx / cs; bdy = ddy / cs; }
      else if (d < f2) f2 = d;
    }
  }
  return { f1, f2, id, dx: bdx, dy: bdy };
}

/**
 * 갯바위 암반 주기 아틀라스(182차) — 소형 섬(조도 사진 시트가 없는 섬)의 바탕.
 *
 * 구 절차 패스는 **타일마다** 두 톤 중 하나로 칠하고 크랙·하이라이트를 타일 안 사각형으로 찍어
 * 섬 전체가 체커판으로 보였다. 여기서는 암반을 **보로노이 판**으로 쪼개 판마다 명도·기울기(빛 받는 면)를
 * 주고, 판 경계를 각진 균열로 긋는다 — 판 크기(≈1.7타일)가 타일과 어긋나 격자가 드러나지 않는다.
 */
export function paintRockAtlas(ctx: CanvasRenderingContext2D, size: number, seed: number): void {
  const base: RGB = [176, 167, 152];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const cx = x + 1, cy = y + 1;
      const big = worley(seed ^ 0x61, cx, cy, 7, size);
      const fine = worley(seed ^ 0x62, cx, cy, 17, size);
      // 판마다 다른 명도 + 판 안 기울기(북서에서 빛) — 사진 속 층층이 쪼개진 바위 면
      let v = (sHash(seed ^ 0x31, big.id, 0) - 0.5) * 22 + (-big.dx - big.dy) * 9;
      v += (pNoise(seed ^ 0x19, x, y, size / 8, size) - 0.5) * 10 + (pNoise(seed ^ 0x2b, x, y, size / 24, size) - 0.5) * 6;
      v += (sHash(seed ^ 0x51, x >> 1, y >> 1) - 0.5) * 7;
      const e1 = big.f2 - big.f1, e2 = fine.f2 - fine.f1;
      if (e1 < 2.5) v -= 46;                                           // 판 경계 균열
      else if (e1 < 5 && big.dx + big.dy > 0) v -= 14;                 // 균열 그늘(빛 반대편)
      else if (e1 < 6 && big.dx + big.dy < 0) v += 10;                 // 빛 받는 판 모서리
      else if (e2 < 1.6 && pNoise(seed ^ 0x62, x, y, size / 6, size) > 0.45) v -= 20;   // 잔균열(일부만)
      const h2 = sHash(seed ^ 0x77, x >> 1, y >> 1);
      if (h2 < 0.03) v -= 16;                                          // 따개비·물웅덩이 자국
      else if (h2 > 0.978) v += 12;
      ctx.fillStyle = hex(base[0] + v + 2, base[1] + v, base[2] + v - 2);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

// ─────────────────────────────────────────────
// 2. 테트라포드 스프라이트 (레퍼런스 ③)
// ─────────────────────────────────────────────

/** top = 맨 위 층(밝은 콘크리트) · low = 틈으로 보이는 아래 층 · wet = 물에 잠긴 발치 */
export type TetraTone = 'top' | 'low' | 'wet';

const TETRA_RAMP: Record<TetraTone, readonly string[]> = {
  top: ['#434a53', '#5a616a', '#747b83', '#90969d', '#abb0b5', '#c4c8cb', '#d9dcdd'],
  low: ['#222a33', '#29323c', '#303a45', '#38434e', '#404b57', '#48545f', '#505c68'],
  wet: ['#2a5670', '#30607a', '#376a83', '#3f738c', '#477c94', '#50859c', '#5a8ea3'],
};
const TETRA_OUTLINE: Record<TetraTone, string> = { top: '#2b3139', low: '#161b21', wet: '#23506a' };

/** 한 변 아트 픽셀 수(×2 = 실픽셀). 다리 8.5 + 반폭 2.2 + 여유 */
export const TETRA_ART = 26;

/** 테트라포드 형태(아트 픽셀) — 다리 길이·중심 굵기·다리 뿌리/끝 반폭 */
export interface TetraShape {
  reach: number; hub: number; w0: number; w1: number;
  /** 곁다리 두 개가 기둥의 수직선과 이루는 각(도) — 30 = 정확히 120° 삼지(기본) */
  side?: number;
  /** 캔버스 한 변 아트 픽셀(기본 TETRA_ART) */
  art?: number;
}
/**
 * 182차 — 사용자 레퍼런스(맞물린 Y·⅄ 도안)에 맞춘 비율: 팔 길이(허브→끝) ≈ 12.6 · 팔 폭 ≈ 0.4배 ·
 * 곁다리는 수평에서 26°(120°보다 살짝 벌어진 부채꼴 — 도안 실측 25~27°).
 */
export const TETRA_SHAPE: TetraShape = { reach: 10.2, hub: 2.8, w0: 2.8, w1: 2.4, side: 26, art: 26 };

/**
 * 위에서 본 테트라포드 — 세 다리가 Y로 퍼지고, 하늘을 향한 넷째 다리가 가운데 둥근 머리로 보인다.
 * `angleDeg` = 첫 다리 방위(0 = 오른쪽, 시계 방향 증가). 빛은 좌상단.
 */
export function paintTetrapod(ctx: CanvasRenderingContext2D, ox: number, oy: number, angleDeg: number, tone: TetraTone, shape: TetraShape = TETRA_SHAPE): void {
  const G = shape.art ?? TETRA_ART;
  const c = G / 2;
  const R = shape.reach, HUB = shape.hub;
  const spread = 90 - (shape.side ?? 30);                    // 기둥 반대 방향에서 곁다리까지의 각
  const ramp = TETRA_RAMP[tone];
  const L = [-0.55, -0.65, 0.75];
  const ll = Math.hypot(L[0]!, L[1]!, L[2]!);
  const lx = L[0]! / ll, ly = L[1]! / ll, lz = L[2]! / ll;
  const dirs = [angleDeg, angleDeg + 180 - spread, angleDeg + 180 + spread].map((deg) => {
    const a = deg * Math.PI / 180;
    return [Math.cos(a), Math.sin(a)] as const;
  });
  const inside = (px: number, py: number): { n: [number, number, number]; face: boolean } | null => {
    const vx = px - c, vy = py - c;
    const dh = Math.hypot(vx, vy);
    if (dh <= HUB) {
      const s = dh / HUB;
      const z = Math.sqrt(Math.max(0, 1 - s * s * 0.8));
      return { n: [vx / HUB * 0.8, vy / HUB * 0.8, z], face: dh <= 1.5 };
    }
    let best: { n: [number, number, number]; face: boolean } | null = null;
    let bestD = 9;
    for (const [dx, dy] of dirs) {
      const t = Math.max(0, Math.min(1, (vx * dx + vy * dy) / R));
      const qx = vx - dx * t * R, qy = vy - dy * t * R;
      const d = Math.hypot(qx, qy);
      const hw = shape.w0 - (shape.w0 - shape.w1) * t;       // 굵은 다리 — 가늘면 철사처럼 보인다
      if (d > hw || d >= bestD) continue;
      bestD = d;
      // 원통 법선 + 끝으로 갈수록 바깥으로 기우는 경사(다리가 아래로 뻗는다)
      const s = (qx * -dy + qy * dx) / hw;
      const z = Math.sqrt(Math.max(0, 1 - s * s));
      const nx = -dy * s + dx * 0.35 * t, ny = dx * s + dy * 0.35 * t;
      best = { n: [nx, ny, z], face: false };
    }
    return best;
  };
  const cells: (string | null)[] = new Array(G * G).fill(null);
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const hit = inside(x + 0.5, y + 0.5);
      if (!hit) continue;
      const [nx, ny, nz] = hit.n;
      const nl = Math.hypot(nx, ny, nz) || 1;
      let b = (nx * lx + ny * ly + nz * lz) / nl;
      if (hit.face) b = Math.max(b, 0.86);                    // 넷째 다리 끝면 — 평평하게 밝다
      const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor((b * 0.9 + 0.1) * ramp.length)));
      cells[y * G + x] = ramp[idx]!;
    }
  }
  const out = TETRA_OUTLINE[tone];
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const col = cells[y * G + x];
      if (!col) continue;
      const edge = x === 0 || y === 0 || x === G - 1 || y === G - 1
        || !cells[y * G + x - 1] || !cells[y * G + x + 1] || !cells[(y - 1) * G + x] || !cells[(y + 1) * G + x];
      ctx.fillStyle = edge ? out : col;
      ctx.fillRect(ox + x * 2, oy + y * 2, 2, 2);
    }
  }
}

// ─────────────────────────────────────────────
// 3. 사석(돌덩이) 스프라이트 (레퍼런스 ②)
// ─────────────────────────────────────────────

export type StoneTone = 'dry' | 'wet';

/** 돌 색 계열 — 베이지 · 갈색 · 회색 (레퍼런스 ②의 수면 위 돌) */
const STONE_RAMPS: readonly (readonly string[])[] = [
  ['#4b4036', '#6a5a4a', '#857361', '#a08c76', '#b9a68d', '#cdbca4'],
  ['#463b32', '#5f4f41', '#7a6754', '#957f68', '#ad977e', '#c2ad93'],
  ['#45423e', '#605c56', '#7b766e', '#958f86', '#aea89e', '#c3bdb3'],
];
const STONE_OUTLINE = '#2a241f';
/** 물에 잠긴 돌 — 물빛이 덮여 청록으로 가라앉는다 */
const STONE_WET: readonly string[] = ['#1f4a5c', '#27566a', '#2f6277', '#386d82', '#41798c'];
const STONE_WET_OUTLINE = '#1a3f50';

/** 돌 스프라이트 캔버스 크기(실픽셀) — 아트 w×h + 그림자·테두리 여유 2 */
export function stoneCanvasSize(wArt: number, hArt: number): [number, number] {
  return [(wArt + 2) * 2, (hArt + 2) * 2];
}

/**
 * 모서리가 둥근 불규칙 돌 — 꼭짓점 7~9개를 타원 위에서 흔들고, 돔 법선으로 좌상단 빛을 받는다.
 * 마른 돌은 오른쪽 아래로 그림자 한 칸을 떨군다(높이감).
 */
export function paintStone(ctx: CanvasRenderingContext2D, ox: number, oy: number, wArt: number, hArt: number, seed: number, tone: StoneTone, hue: number): void {
  const cx = wArt / 2 + 0.5, cy = hArt / 2 + 0.5;
  const rx = wArt / 2, ry = hArt / 2;
  const nv = 7 + Math.floor(sHash(seed, 1, 2) * 3);
  const rot = sHash(seed, 3, 4) * Math.PI * 2;
  const poly: [number, number][] = [];
  for (let i = 0; i < nv; i++) {
    const a = rot + i / nv * Math.PI * 2;
    const k = 0.78 + sHash(seed, i, 9) * 0.26;
    poly.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const inPoly = (x: number, y: number): boolean => {
    let ins = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const W = wArt + 2, H = hArt + 2;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(x + 0.5, y + 0.5)) mask[y * W + x] = 1;
  const ramp = tone === 'wet' ? STONE_WET : STONE_RAMPS[hue % STONE_RAMPS.length]!;
  const out = tone === 'wet' ? STONE_WET_OUTLINE : STONE_OUTLINE;
  // 그림자 (마른 돌만) — 오른쪽 아래 한 칸
  if (tone === 'dry') {
    ctx.fillStyle = 'rgba(20,18,16,0.45)';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mask[y * W + x] || (x + 1 < W && y + 1 < H && mask[(y + 1) * W + x + 1])) continue;
      if (x + 1 < W && y + 1 < H) ctx.fillRect(ox + (x + 1) * 2, oy + (y + 1) * 2, 2, 2);
    }
  }
  const lx = -0.55, ly = -0.65, lz = 0.75, ll = Math.hypot(lx, ly, lz);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      const edge = !mask[y * W + x - 1] || !mask[y * W + x + 1] || !mask[(y - 1) * W + x] || !mask[(y + 1) * W + x];
      if (edge) { ctx.fillStyle = out; ctx.fillRect(ox + x * 2, oy + y * 2, 2, 2); continue; }
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
      let b = (nx * lx + ny * ly + nz * lz) / (Math.hypot(nx, ny, nz) * ll);
      b += (sHash(seed ^ 0x33, x, y) - 0.5) * 0.22;           // 돌결 — 면이 깨진 느낌
      const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor((b * 0.85 + 0.15) * ramp.length)));
      ctx.fillStyle = ramp[idx]!;
      ctx.fillRect(ox + x * 2, oy + y * 2, 2, 2);
    }
  }
}
