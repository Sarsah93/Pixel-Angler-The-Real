/**
 * @file NuisanceArt.ts
 * @description 과증식 해양생물 픽셀 아트 (138차) — 해파리 2 · 불가사리 2.
 *
 * 규칙 (사용자 지시 2026-09-16):
 *  - **타일 위에 대놓고 얹지 않는다.** 물에 잠긴 부분은 바다색으로 눌러 반투명하게 만들고,
 *    해파리는 **빙산의 일각처럼 수면 위아래로 걸친다**(우산 윗부분만 또렷).
 *  - 그레인 2px — 아트 격자에서 1px = 화면 2px(지면 타일과 동일).
 *
 * 출력은 RGBA 버퍼(알파 포함)라 클라이언트는 그대로 캔버스 텍스처로 구우면 된다.
 */

/** 물에 잠긴 픽셀이 눌리는 바다색 */
const SEA = 0x1d5580;

interface Raster { w: number; h: number; data: Uint8ClampedArray }

class R {
  readonly px: Int32Array;
  readonly a: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) {
    this.px = new Int32Array(w * h).fill(-1);
    this.a = new Uint8ClampedArray(w * h);
  }
  put(x: number, y: number, c: number, alpha = 255): void {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
    this.a[y * this.w + x] = alpha;
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    return this.px[y * this.w + x];
  }
  /** 수면 아래(y >= waterY)를 바다색으로 눌러 잠긴 느낌을 만든다 */
  submerge(waterY: number, strength = 0.45, alpha = 140): void {
    for (let y = Math.max(0, waterY); y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.px[i] < 0) continue;
        this.px[i] = mix(this.px[i], SEA, strength);
        this.a[i] = Math.min(this.a[i], alpha);
      }
    }
  }
  outline(c = 0x16202e, alpha = 200): void {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.px[y * this.w + x] >= 0) continue;
        if (this.get(x + 1, y) >= 0 || this.get(x - 1, y) >= 0
          || this.get(x, y + 1) >= 0 || this.get(x, y - 1) >= 0) add.push(y * this.w + x);
      }
    }
    for (const i of add) { this.px[i] = c; this.a[i] = alpha; }
  }
  toRaster(): Raster {
    const d = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (c < 0) continue;
      d[i * 4] = (c >> 16) & 255; d[i * 4 + 1] = (c >> 8) & 255; d[i * 4 + 2] = c & 255;
      d[i * 4 + 3] = this.a[i];
    }
    return { w: this.w, h: this.h, data: d };
  }
}

function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t);
}

/** 타원 채우기 (반지름 rx·ry) */
function ellipse(r: R, cx: number, cy: number, rx: number, ry: number, c: number, alpha = 255): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) r.put(x, y, c, alpha);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 해파리 — 우산 + 촉수. 수면 위로 우산 윗부분만 또렷하게 남긴다.
// ─────────────────────────────────────────────────────────────
function jellyfish(size: number, opts: {
  bell: number; bellHi: number; bellLo: number;
  tentacle: number; tentacles: number; tentacleLen: number;
  gonad?: number; waterRow: number; bellRy: number;
}): Raster {
  const r = new R(size, size);
  const cx = (size - 1) / 2;
  const bellCy = opts.waterRow + opts.bellRy * 0.35;
  const rx = size * 0.42;

  // 우산 (아래가 열린 돔)
  for (let y = Math.floor(bellCy - opts.bellRy); y <= Math.ceil(bellCy + opts.bellRy * 0.45); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - bellCy) / opts.bellRy;
      if (dx * dx + dy * dy > 1) continue;
      const top = y < bellCy - opts.bellRy * 0.45;
      r.put(x, y, top ? opts.bellHi : opts.bell, 235);
    }
  }
  // 우산 아랫단 그림자
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const yy = Math.round(bellCy + opts.bellRy * 0.45);
    if (r.get(x, yy) >= 0) r.put(x, yy, opts.bellLo, 235);
  }

  // 생식소 (보름달물해파리의 말굽 네 개)
  if (opts.gonad !== undefined) {
    const gr = Math.max(1, Math.round(size * 0.09));
    const gy = bellCy + opts.bellRy * 0.05;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ellipse(r, cx + sx * size * 0.14, gy + sy * size * 0.09, gr, gr * 0.8, opts.gonad, 245);
      }
    }
  }

  // 촉수·부속지 — 아래로 흔들리며 늘어진다
  const baseY = Math.round(bellCy + opts.bellRy * 0.45);
  for (let i = 0; i < opts.tentacles; i++) {
    const t = opts.tentacles === 1 ? 0.5 : i / (opts.tentacles - 1);
    const sx = cx + (t - 0.5) * rx * 1.7;
    const len = opts.tentacleLen * (0.6 + 0.4 * Math.sin(t * Math.PI));
    for (let k = 0; k < len; k++) {
      const wob = Math.sin((k / 3) + i) * 1.2;
      r.put(sx + wob, baseY + k, opts.tentacle, 190 - k * 4);
    }
  }

  r.outline(0x16202e, 170);
  r.submerge(opts.waterRow, 0.46, 150);
  return r.toRaster();
}

// ─────────────────────────────────────────────────────────────
// 불가사리 — 팔 5개. 항상 물에 잠긴 상태(바닥)와 해안 밀림(또렷) 2벌.
// ─────────────────────────────────────────────────────────────
function starfish(size: number, opts: {
  body: number; bodyHi: number; mottle: number;
  armLen: number; armW: number; submerged: boolean;
}): Raster {
  const r = new R(size, size);
  const cx = (size - 1) / 2, cy = (size - 1) / 2;
  // 팔 5개 — 위를 향한 팔 하나 + 균등 분할
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const ex = Math.cos(ang), ey = Math.sin(ang);
    for (let k = 0; k <= opts.armLen; k++) {
      const t = k / opts.armLen;
      const halfW = Math.max(0, opts.armW * (1 - t * 0.82));
      const px = cx + ex * k, py = cy + ey * k;
      // 팔 폭은 진행 방향의 수직으로 채운다
      for (let w = -halfW; w <= halfW; w += 0.5) {
        const c = t < 0.25 ? opts.bodyHi : opts.body;
        r.put(px - ey * w, py + ex * w, c, 255);
      }
    }
  }
  // 중앙 원반
  ellipse(r, cx, cy, opts.armW * 1.15, opts.armW * 1.15, opts.bodyHi);
  // 반점 — 결정적 배치(황금비 산포)
  const G = 0.6180339887;
  for (let i = 0; i < Math.round(size * 1.6); i++) {
    const a = i * G * Math.PI * 2;
    const rad = (i % 5) * (size * 0.07);
    const x = Math.round(cx + Math.cos(a) * rad), y = Math.round(cy + Math.sin(a) * rad);
    if (r.get(x, y) >= 0) r.put(x, y, opts.mottle, 255);
  }
  r.outline(0x14202c, 210);
  if (opts.submerged) r.submerge(0, 0.30, 195);
  return r.toRaster();
}

/** 스프라이트 키 → 래스터. 클라이언트가 캔버스 텍스처로 굽는다. */
export function renderNuisanceArt(key: string): Raster | null {
  switch (key) {
    case 'moon_jelly':
      return jellyfish(16, {
        bell: 0x2f7fd4, bellHi: 0x7fc3f2, bellLo: 0x1d4f88,
        tentacle: 0x9fd8f5, tentacles: 7, tentacleLen: 6,
        gonad: 0xbfe8ff, waterRow: 6, bellRy: 5.0,
      });
    case 'nomura_jelly':
      return jellyfish(24, {
        bell: 0xc98a3f, bellHi: 0xe8c078, bellLo: 0x8a5a24,
        tentacle: 0xe0b070, tentacles: 13, tentacleLen: 11,
        waterRow: 7, bellRy: 6.4,
      });
    case 'blue_bat_star':
      return starfish(14, {
        body: 0x454b86, bodyHi: 0x5f66a8, mottle: 0xe0702f,
        armLen: 5, armW: 3.4, submerged: true,
      });
    case 'blue_bat_star_dry':
      return starfish(14, {
        body: 0x454b86, bodyHi: 0x5f66a8, mottle: 0xe0702f,
        armLen: 5, armW: 3.4, submerged: false,
      });
    case 'amur_star':
      return starfish(18, {
        body: 0xd9a63f, bodyHi: 0xf0d089, mottle: 0x7a4a86,
        armLen: 8, armW: 1.7, submerged: true,
      });
    case 'amur_star_dry':
      return starfish(18, {
        body: 0xd9a63f, bodyHi: 0xf0d089, mottle: 0x7a4a86,
        armLen: 8, armW: 1.7, submerged: false,
      });
    default:
      return null;
  }
}

export const NUISANCE_ART_KEYS = [
  'moon_jelly', 'nomura_jelly',
  'blue_bat_star', 'blue_bat_star_dry', 'amur_star', 'amur_star_dry',
] as const;
