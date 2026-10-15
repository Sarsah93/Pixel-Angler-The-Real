/**
 * @file ColorAssist.ts
 * @description 251차 — 색 구분 보정(색약 배려). HUD의 **뜻이 있는 색**(좋음 · 주의 · 위험 · 정보 · 오름 · 내림 등)을
 *              설정 「접근성」에서 고른 방식에 맞게 옮긴다. 장식 · 그림(물고기 · 땅 · 하늘)과 창 테두리 같은 틀 색에는 쓰지 않는다.
 *
 * - `'off'` — 그대로(보통 눈으로 보던 모습이 한 칸도 바뀌지 않는다).
 * - `'redgreen'`(적록 — 제1 · 2색각): 초록 → 밝은 파랑(235° · 밝게) · 빨강 → 짙은 진홍(340° · 어둡게) · 파랑 → 짙은 남색(240° · 어둡게).
 *   빨강과 초록이 같은 누런 색으로 보이는 눈에 「따뜻한 색 ↔ 차가운 색」 축과 밝기 차로 갈라 준다(느슨한 파랑 ↔ 안전 초록도 밝기로).
 * - `'blueyellow'`(청황 — 제3색각): 파랑 → 짙은 보라(265° · 어둡게)만. 파랑이 초록 · 빨강 쪽과 섞이는 눈에 밝기 차로 갈라 준다.
 * - 색상환 띠: 빨강 330~15° · 노랑 15~70° · 초록 70~170° · 파랑 170~260° · 보라 260~330°. 채도 0.22 미만(회색 · 흰색)은 그대로.
 * - 값은 251차 색약 흉내(Machado 2009 행렬) 탐색으로 정했다 — 좋음 · 주의 · 위험 · 정보 · 느슨 짝 12쌍 거리 최솟값(ΔE76)
 *   적록 12.5 → 43.0 · 청황 17.5 → 41.6(보통 눈 최솟값 ≥ 46).
 *
 * 쓰는 법: 뜻이 있는 색 리터럴을 `cv(0xff6b6b)` · 글자색은 `cvCss('#ff6b6b')`로 감싼다.
 * 보정 방식이 바뀌면 `game.events`에 `'a11y-changed'`가 온다 — 한 번 그려 두는 HUD는 그때 다시 그린다.
 *
 * 「모양으로도 표시」(`shapeCuesOn`)는 색이 아닌 단서를 더한다 — 막힌 칸 X(`drawBlockedX`) · 위험 빗금(`drawHatch`) 등.
 */

import type Phaser from 'phaser';

/** 색 구분 보정 방식 */
export type ColorVisionMode = 'off' | 'redgreen' | 'blueyellow';

/** 띠별 옮김 — [목표 색상(도) · 밝기 더하기] */
type Shift = readonly [number, number];
type Band = 'red' | 'yellow' | 'green' | 'blue' | 'purple';
const SHIFTS: Record<Exclude<ColorVisionMode, 'off'>, Partial<Record<Band, Shift>>> = {
  redgreen: { green: [235, 0.08], red: [340, -0.16], blue: [240, -0.2] },
  blueyellow: { blue: [265, -0.15] },
};

let mode: ColorVisionMode = 'off';
let shapes = false;
const cache = new Map<number, number>();

/** 「모양으로도 표시」 — 색으로만 가르던 곳에 모양 단서(막힌 칸 X · 위험 빗금 · 눈금 · 기호)를 더한다 */
export function shapeCuesOn(): boolean {
  return shapes;
}

export function setShapeCues(on: boolean): void {
  shapes = !!on;
}

/** 다시 그릴지 가르는 서명 조각 — 캐시 · 서명으로 다시 그리기를 막는 곳이 이것을 서명에 넣는다 */
export function a11ySig(): string {
  return `${mode}|${shapes ? 1 : 0}`;
}

/** 지금 보정 방식 */
export function colorVisionMode(): ColorVisionMode {
  return mode;
}

/** 보정 방식을 바꾼다(설정을 읽은 곳 · 설정 창이 부른다) */
export function setColorVisionMode(m: ColorVisionMode): void {
  const next: ColorVisionMode = m === 'redgreen' || m === 'blueyellow' ? m : 'off';
  if (next === mode) return;
  mode = next;
  cache.clear();
}

function bandOf(deg: number): Band {
  if (deg >= 330 || deg < 15) return 'red';
  if (deg < 70) return 'yellow';
  if (deg < 170) return 'green';
  if (deg < 260) return 'blue';
  return 'purple';
}

/** 0xRRGGBB → [색상(도), 밝기, 채도] (HSL) */
function toHsl(c: number): [number, number, number] {
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, l, 0];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h: number;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (mx === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, l, s];
}

function fromHsl(h: number, l: number, s: number): number {
  const L = Math.max(0, Math.min(1, l));
  const q = L < 0.5 ? L * (1 + s) : L + s - L * s;
  const p = 2 * L - q;
  const hk = (((h % 360) + 360) % 360) / 360;
  const ch = (t: number): number => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const to = (v: number): number => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return (to(ch(hk + 1 / 3)) << 16) | (to(ch(hk)) << 8) | to(ch(hk - 1 / 3));
}

/** 뜻이 있는 색 하나를 지금 보정 방식으로 옮긴다(`'off'`면 그대로) */
export function cv(color: number): number {
  if (mode === 'off') return color;
  const hit = cache.get(color);
  if (hit !== undefined) return hit;
  const [h, l, s] = toHsl(color);
  let out = color;
  if (s >= 0.22) {
    const shift = SHIFTS[mode][bandOf(h)];
    if (shift) out = fromHsl(shift[0], l + shift[1], s);
  }
  cache.set(color, out);
  return out;
}

/** 글자색(`'#rrggbb'`)용 — 다른 꼴(이름 · rgba)은 그대로 */
export function cvCss(css: string): string {
  if (mode === 'off' || !/^#[0-9a-f]{6}$/i.test(css)) return css;
  return `#${cv(parseInt(css.slice(1), 16)).toString(16).padStart(6, '0')}`;
}

/** 막힌 칸 표시 — 칸 안에 X(대각선 두 줄). 「모양으로도 표시」가 켜졌을 때만 그린다 */
export function drawBlockedX(
  g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 0.95, inset = 4,
): void {
  if (!shapes) return;
  g.lineStyle(2, color, alpha);
  g.lineBetween(x + inset, y + inset, x + w - inset, y + h - inset);
  g.lineBetween(x + w - inset, y + inset, x + inset, y + h - inset);
}

/** 위험 빗금 — 사각 안에 대각선 줄무늬. 「모양으로도 표시」가 켜졌을 때만 그린다 */
export function drawHatch(
  g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 0.55, gap = 5,
): void {
  if (!shapes || w <= 0 || h <= 0) return;
  g.lineStyle(1, color, alpha);
  for (let k = -h; k < w; k += gap) {
    // (x+k, y+h) → (x+k+h, y) 선을 사각 안으로 자른다
    let x0 = x + k, y0 = y + h, x1 = x + k + h, y1 = y;
    if (x0 < x) { y0 -= x - x0; x0 = x; }
    if (x1 > x + w) { y1 += x1 - (x + w); x1 = x + w; }
    if (x1 > x0) g.lineBetween(x0, y0, x1, y1);
  }
}

/**
 * 안내 문장 고르기 — 적록 보정이면 「초록」이 파랑으로 옮겨 간 판을 쓴다(체험 가이드가 화면 색을 말할 때).
 * 한국어는 활용이 달라(「초록 칸」 → 「파란 칸」 · 「초록은」 → 「파랑은」) 낱말 바꾸기 대신 문장 두 벌을 둔다 — 영어 사전에도 두 벌.
 */
export function cvText(base: string, redgreen: string): string {
  return mode === 'redgreen' ? redgreen : base;
}

/** 설치 · 놓기 안내의 색 이름 — 보정 방식에 맞춘다(초록 4af2a1 = 가능 · 빨강 ff5a4a = 불가) */
export function okBadLegend(): string {
  const ok = mode === 'redgreen' ? '파랑=가능' : '초록=가능';
  return `${ok} / 빨강=불가${shapes ? ' · X=불가' : ''}`;
}

/** 모양 표식 종류 — 색 말고 모양으로 가를 때(신선도 점 · 지도 점 등) */
export type MarkShape = 'circle' | 'ring' | 'square' | 'hollowSquare' | 'diamond' | 'triangle' | 'plus' | 'x';

/** 모양 표식 하나(가운데 (x, y) · 반지름 r) — 「모양으로도 표시」와 무관하게 그린다(부르는 쪽이 고른다) */
export function drawMark(g: Phaser.GameObjects.Graphics, shape: MarkShape, x: number, y: number, r: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.lineStyle(Math.max(1.5, r * 0.45), color, alpha);
  switch (shape) {
    case 'circle': g.fillCircle(x, y, r); break;
    case 'ring': g.strokeCircle(x, y, r * 0.8); break;
    case 'square': g.fillRect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8); break;
    case 'hollowSquare': g.strokeRect(x - r * 0.75, y - r * 0.75, r * 1.5, r * 1.5); break;
    case 'diamond': g.fillTriangle(x, y - r * 1.15, x + r * 1.15, y, x, y + r * 1.15); g.fillTriangle(x, y - r * 1.15, x - r * 1.15, y, x, y + r * 1.15); break;
    case 'triangle': g.fillTriangle(x, y - r * 1.1, x + r * 1.1, y + r * 0.9, x - r * 1.1, y + r * 0.9); break;
    case 'plus': g.fillRect(x - r, y - r * 0.32, r * 2, r * 0.64); g.fillRect(x - r * 0.32, y - r, r * 0.64, r * 2); break;
    case 'x': g.lineBetween(x - r * 0.85, y - r * 0.85, x + r * 0.85, y + r * 0.85); g.lineBetween(x + r * 0.85, y - r * 0.85, x - r * 0.85, y + r * 0.85); break;
  }
}

/** 신선도 상태별 모양(「모양으로도 표시」) — 활어 ◆ · 신선 ● · 보통 ■ · 냉장 ○ · 냉동 □ · 해동 + · 나쁨 ▲ · 부패 X */
export const CONDITION_MARK: Record<string, MarkShape> = {
  live: 'diamond', fresh: 'circle', normal: 'square', chilled: 'ring', frozen: 'hollowSquare', thawed: 'plus', bad: 'triangle', spoiled: 'x',
};
