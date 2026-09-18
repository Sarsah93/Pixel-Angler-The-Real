/**
 * @file FacePortrait.ts
 * @description 대화창 초상 전용 얼굴 렌더러 (152차 — 사용자 지시)
 *
 * 왜 따로 그리는가
 *  - 150차의 초상은 게임 시트의 얼굴 창(16x16 아트 px)을 잘라 NEAREST로 키운 것이었다.
 *    필드 몸 52px에 맞춘 격자라 **얼굴 실화소는 가로 10 · 세로 9줄**뿐이고, 그것을 5~7배로
 *    늘리면 눈은 사각형 두 개, 코는 없고, 인물끼리 구별이 거의 되지 않는다.
 *    사용자 지적("단순 확대가 아니라 픽셀 단위와 그래픽 퀄리티를 높여야 함")이 정확했다.
 *  - 그래서 **같은 `CharConfig`로 처음부터 다시 그린다**. 얼굴 한 장에 32x32를 통째로 쓰므로
 *    필드 격자보다 세로 해상도가 약 3.5배다. 눈에 흰자·홍채·동공·하이라이트·눈꺼풀선이 각각
 *    제 화소를 갖고, 코·인중·입술·귀·턱 그늘·수염결이 처음으로 그려진다.
 *
 * ⚠ 필드 스프라이트(`CharacterArt.ts`)는 한 줄도 건드리지 않는다 — 몸 격자와 레이아웃은 불변이다.
 *   이 파일은 **초상 전용 별도 격자**이고, 소비처는 대화창·일지·혼잣말 초상뿐이다.
 * ⚠ 얼굴형·머리 모양·눈/입/눈썹/수염/홍조는 전부 같은 `CharAppearance`에서 읽는다 —
 *   생성 화면에서 고른 것이 초상에도 그대로 나와야 한다(따로 만들면 "여기선 예쁜데 인게임은 다른" 상태가 된다).
 *
 * 155차 — **필드 캐릭터와 같은 인상**으로 재조정(사용자: "초상화와 캐릭터가 안 맞음").
 *   152차 초상은 해상도만 높였지 문법이 달랐다: 이마가 훤히 드러나고 눈썹이 항상 그려져(필드는
 *   앞머리가 이마를 덮고 눈썹은 삭발·상투에서만 보인다) 인상이 험해졌고, 눈은 흰자 위주의 작은 눈이라
 *   필드의 "검은 눈 바" 인상과 달랐으며, 수염은 콧수염까지 붙어 필드(턱선 한 줄)보다 훨씬 짙었다.
 *   같은 캐릭터로 읽히려면 **부위의 비율·덮임·명암 문법**이 같아야 한다. 해상도는 그대로 두고 문법을 맞췄다.
 */

import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, ramp,
  type CharAppearance, type CharConfig, type FaceShape, type HatKind,
} from './CharacterArt.js';

type Rgb = number;
type Ramp = readonly [Rgb, Rgb, Rgb];

/** 초상 격자 한 변 (아트 px) — 얼굴 하나가 통째로 쓴다 */
export const PORTRAIT_CELL = 32;

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t);
}
const pick = (arr: Rgb[], i: number): Rgb => arr[Math.max(0, Math.min(arr.length - 1, i))];

class PGrid {
  readonly w = PORTRAIT_CELL;
  readonly h = PORTRAIT_CELL;
  readonly px = new Int32Array(PORTRAIT_CELL * PORTRAIT_CELL).fill(-1);

  put(x: number, y: number, c: Rgb): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }
  /** 이미 칠해진 곳에만 덧칠 — 얼굴 밖으로 새지 않는 그늘·홍조용 */
  shade(x: number, y: number, c: Rgb, t: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const cur = this.px[y * this.w + x];
    if (cur < 0) return;
    this.px[y * this.w + x] = mix(cur, c, t);
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    return this.px[y * this.w + x];
  }
  row(y: number, x0: number, x1: number, c: Rgb): void {
    for (let x = x0; x <= x1; x++) this.put(x, y, c);
  }
  toRgba(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (c < 0) continue;
      out[i * 4] = (c >> 16) & 255;
      out[i * 4 + 1] = (c >> 8) & 255;
      out[i * 4 + 2] = c & 255;
      out[i * 4 + 3] = 255;
    }
    return out;
  }
}

// ─────────────────────────────────────────────────────────────
// 골격 — 행별 얼굴 반폭
// ─────────────────────────────────────────────────────────────

/** 얼굴 좌우 중심 (두 열 사이) · 정수리 · 턱 끝 */
const CX = 15;            // 중심축 왼쪽 열 (얼굴은 CX와 CX+1 사이 대칭)
const TOP = 3;            // 정수리 행
const CHIN = 27;          // 턱 끝 행

/**
 * 행별 반폭 — 얼굴형은 **턱선에서 읽힌다**(이마~정수리는 머리카락이 덮는다).
 * 값은 CX 기준 좌우로 각각 몇 칸인지. TOP..CHIN 25행.
 */
const JAW: Record<FaceShape, number[]> = {
  //      3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
  oval:  [5, 7, 8, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 9, 8, 8, 7, 7, 6, 5, 4, 3],
  round: [6, 8, 9, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 10, 10, 10, 9, 9, 9, 8, 7, 6, 5, 4, 3],
  square:[6, 8, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 8, 8, 7, 5, 3],
};
const halfW = (shape: FaceShape, y: number): number => {
  const t = JAW[shape];
  if (y < TOP || y > CHIN) return -1;
  return t[y - TOP];
};

// 얼굴 부위 행 — 한 곳에서만 정한다(서로 밀리면 곧바로 이상한 얼굴이 된다)
const BROW_Y = 11;        // 눈썹 (눈꺼풀선과 최소 2행 띄운다 — 붙으면 한 덩어리로 읽혀 험상궂어진다)
const EYE_Y = 14;         // 눈 윗줄 (눈은 14~16, 3행)
const NOSE_Y = 18;        // 콧대 시작 (18~21)
const MOUTH_Y = 23;       // 입술 윗줄 (23~24)

// ─────────────────────────────────────────────────────────────
// 레이어
// ─────────────────────────────────────────────────────────────

/** 목 + 어깨 — 초상이 허공에 뜨지 않게 받쳐 준다 */
function drawNeck(g: PGrid, skin: Ramp, shirt: Rgb): void {
  for (let y = CHIN - 1; y <= 29; y++) g.row(y, CX - 3, CX + 4, skin[1]);
  // 턱 밑 그늘 — 목이 얼굴과 같은 평면으로 보이지 않게
  for (let y = CHIN - 1; y <= CHIN + 1; y++) g.row(y, CX - 3, CX + 4, mix(skin[2], 0x2a1c2a, 0.25));
  g.row(29, CX - 3, CX + 4, skin[2]);
  // 어깨 — 옷 색으로 바닥을 만든다
  for (let y = 30; y < PORTRAIT_CELL; y++) g.row(y, 2, PORTRAIT_CELL - 3, y === 30 ? mix(shirt, 0xfff2c8, 0.18) : shirt);
  g.row(30, CX - 4, CX + 5, skin[1]);
  g.row(31, CX - 3, CX + 4, mix(shirt, 0x3a2a4a, 0.2));
}

/** 얼굴 살 — 가장자리 한 열은 음영, 이마·볼 가운데는 하이라이트 */
function drawSkin(g: PGrid, shape: FaceShape, skin: Ramp): void {
  for (let y = TOP; y <= CHIN; y++) {
    const r = halfW(shape, y);
    if (r < 0) continue;
    g.row(y, CX - r + 1, CX + r, skin[1]);
    g.put(CX - r + 1, y, skin[2]);
    g.put(CX + r, y, skin[2]);
  }
  // 이마 하이라이트 (머리카락 아래 드러나는 띠)
  for (let y = BROW_Y - 3; y <= BROW_Y - 1; y++) g.row(y, CX - 4, CX + 5, skin[0]);
  // 광대 하이라이트 — 코 양옆을 살짝 띄운다
  for (let y = EYE_Y + 3; y <= EYE_Y + 5; y++) {
    g.shade(CX - 6, y, skin[0], 0.6); g.shade(CX + 7, y, skin[0], 0.6);
  }
  // 턱 그늘
  for (let y = CHIN - 3; y <= CHIN; y++) {
    const r = halfW(shape, y);
    for (let x = CX - r + 1; x <= CX + r; x++) g.shade(x, y, skin[2], 0.35);
  }
}

/** 귀 — 얼굴 옆선에 붙인다. 머리 스타일이 덮으면 뒤에서 가려진다. */
function drawEars(g: PGrid, shape: FaceShape, skin: Ramp): void {
  for (let y = EYE_Y; y <= EYE_Y + 4; y++) {
    const r = halfW(shape, y);
    g.put(CX - r, y, skin[1]);
    g.put(CX + r + 1, y, skin[1]);
  }
  g.put(CX - halfW(shape, EYE_Y + 1) , EYE_Y + 1, skin[2]);
  g.put(CX + halfW(shape, EYE_Y + 1) + 1, EYE_Y + 1, skin[2]);
}

/**
 * 눈썹 — 굵기와 각도가 인상을 가장 크게 바꾼다.
 * 155차: 필드 스프라이트처럼 **이마가 드러나는 머리(삭발·상투)에서 굵기 0.3 초과일 때만** 그린다.
 * 다른 머리는 앞머리가 눈썹 자리를 덮는다(항상 그리면 앞머리 아래로 검은 선이 비쳐 인상이 험해진다).
 */
function drawBrows(g: PGrid, look: CharAppearance): void {
  const bare = look.hairStyle === 'buzz' || look.hairStyle === 'topknot';
  if (!bare || look.brow <= 0.3) return;
  const hp = ramp(pick(HAIR_COLORS, look.hair));
  const c = mix(hp[2], 0x201820, 0.25);
  const thick = look.brow > 0.66 ? 2 : 1;
  for (const s of [-1, 1] as const) {
    const inner = s < 0 ? CX - 2 : CX + 3;
    for (let i = 0; i < 5; i++) {
      const x = inner + s * i;
      // 바깥으로 갈수록 한 칸 올라간다 — 수평 막대는 험상궂어 보인다
      const y = BROW_Y - (i >= 3 ? 1 : 0);
      for (let t = 0; t < thick; t++) g.put(x, y + t, t === 0 ? c : mix(c, hp[1], 0.4));
    }
  }
}

/**
 * 눈 — 155차: 필드 스프라이트의 문법(**윗줄 = 검은 동공 바 · 아랫줄 = 밝은 홍채**)을 3행으로 옮긴 것.
 * 152차의 흰자 위주 작은 눈은 화소는 많았지만 필드의 큰 검은 눈과 다른 사람으로 읽혔다.
 *  행 0 = 동공/속눈썹 바(검정) · 행 1 = 홍채 밝은 톤 + 하이라이트 1px · 행 2 = 홍채 본색 + 아랫꺼풀 그늘.
 */
function drawEyes(g: PGrid, look: CharAppearance): void {
  const iris = ramp(pick(EYE_COLORS, look.eye));
  const pupil = mix(iris[2], 0x1b1520, 0.6);
  const under = mix(iris[2], 0x2a1c2a, 0.35);
  for (const s of [-1, 1] as const) {
    // 눈 한 짝 = 가로 5 x 세로 3
    const x0 = s < 0 ? CX - 7 : CX + 3;
    const x1 = x0 + 4;
    g.row(EYE_Y, x0, x1, pupil);                                  // 검은 바 — 필드의 인상은 여기서 온다
    g.row(EYE_Y + 1, x0, x1, iris[0]);
    g.put(s < 0 ? x0 + 1 : x1 - 1, EYE_Y + 1, mix(iris[0], 0xffffff, 0.55));   // 하이라이트 1px(바깥쪽)
    g.put(s < 0 ? x1 - 1 : x0 + 1, EYE_Y + 1, iris[1]);          // 안쪽 한 칸은 본색 — 시선이 가운데를 본다
    g.row(EYE_Y + 2, x0 + 1, x1 - 1, iris[1]);
    g.put(x0, EYE_Y + 2, under); g.put(x1, EYE_Y + 2, under);    // 아랫꺼풀 그늘
    if (look.sex === 'f') {
      // 속눈썹 — 바깥 위로 1px(필드와 같은 신호)
      g.put(s < 0 ? x0 - 1 : x1 + 1, EYE_Y, mix(pupil, 0x000000, 0.2));
      g.put(s < 0 ? x0 - 1 : x1 + 1, EYE_Y - 1, mix(pupil, 0x000000, 0.1));
    }
  }
}

/** 코 — 콧대 그늘 · 콧방울 · 인중. 필드 스프라이트에는 아예 없던 부위다. */
function drawNose(g: PGrid, skin: Ramp): void {
  const sh = mix(skin[2], 0x6a4030, 0.45);
  const deep = mix(sh, 0x2a160e, 0.45);
  // 콧대 — 오른쪽에 그늘, 왼쪽에 하이라이트. 둘이 나란히 서야 코가 솟아 보인다.
  for (let y = NOSE_Y; y <= NOSE_Y + 2; y++) { g.shade(CX + 2, y, sh, 0.6); g.shade(CX - 1, y, skin[0], 0.45); }
  g.shade(CX - 1, NOSE_Y + 2, skin[0], 0.8);                                  // 콧등 하이라이트
  g.put(CX - 1, NOSE_Y + 3, sh); g.put(CX, NOSE_Y + 3, deep);
  g.put(CX + 1, NOSE_Y + 3, deep); g.put(CX + 2, NOSE_Y + 3, sh);
  g.put(CX - 2, NOSE_Y + 3, deep);                                            // 콧방울 — 코가 얼굴에서 떨어져 나오는 유일한 단서
  g.put(CX + 3, NOSE_Y + 3, deep);
  g.shade(CX, NOSE_Y + 4, skin[2], 0.3); g.shade(CX + 1, NOSE_Y + 4, skin[2], 0.3);
  // 인중
  g.shade(CX, MOUTH_Y - 2, skin[2], 0.3); g.shade(CX + 1, MOUTH_Y - 2, skin[2], 0.3);
}

/** 입 — 윗입술은 어둡고 아랫입술이 밝다. 이 대비가 없으면 그냥 가로선이 된다. */
function drawMouth(g: PGrid, look: CharAppearance, skin: Ramp): void {
  const lip = mix(0x9a4f4f, skin[1], 0.25);
  const dark = mix(lip, 0x3a1c22, 0.45);
  const lo = mix(lip, 0xffd9c0, 0.35);
  const y = MOUTH_Y;
  if (look.mouth === 'open') {
    g.row(y, CX - 2, CX + 3, dark);
    g.row(y + 1, CX - 2, CX + 3, mix(0x3a1c22, 0x000000, 0.2));
    g.row(y + 2, CX - 1, CX + 2, lo);
    return;
  }
  if (look.mouth === 'small') {
    g.row(y, CX - 1, CX + 2, dark);
    g.row(y + 1, CX - 1, CX + 2, lo);
    return;
  }
  g.row(y, CX - 2, CX + 3, dark);
  g.row(y + 1, CX - 1, CX + 2, lo);
  if (look.mouth === 'smile') {
    // 입꼬리를 한 칸 올리고 볼에 미세한 주름을 넣는다
    g.put(CX - 3, y - 1, dark); g.put(CX + 4, y - 1, dark);
    g.shade(CX - 4, y, skin[2], 0.3); g.shade(CX + 5, y, skin[2], 0.3);
  }
}

/** 볼 홍조 */
function drawBlush(g: PGrid, look: CharAppearance): void {
  if (!look.blush) return;
  for (const s of [-1, 1] as const) {
    const bx = s < 0 ? CX - 8 : CX + 7;
    for (let y = NOSE_Y + 1; y <= NOSE_Y + 3; y++) {
      g.shade(bx, y, 0xf0787e, 0.34);
      g.shade(bx + s, y, 0xf0787e, 0.2);
    }
  }
}

/**
 * 수염 — 155차: 필드와 같은 **턱선 수염**만. 152차는 콧수염과 볼 전체 결까지 넣어 필드(턱 아래 한 줄)보다
 * 훨씬 짙은 얼굴이 됐다. 턱 끝 3행 + 그 위 4행은 가장자리 두 칸만 성글게.
 */
function drawBeard(g: PGrid, look: CharAppearance, shape: FaceShape): void {
  if (look.beard < 0) return;
  const bp = ramp(pick(HAIR_COLORS, look.beard));
  const c = bp[2];
  for (let y = CHIN - 6; y <= CHIN; y++) {
    const r = halfW(shape, y);
    if (r < 0) continue;
    for (let x = CX - r + 1; x <= CX + r; x++) {
      const edge = x <= CX - r + 2 || x >= CX + r - 1;
      if (y >= CHIN - 2) g.shade(x, y, c, 0.85);
      else if (edge) g.shade(x, y, c, (x + y) % 2 === 0 ? 0.7 : 0.4);
    }
  }
}

/** 머리카락 — 정수리 볼륨 · 앞머리 술 · 스타일별 옆/뒷머리 */
function drawHair(g: PGrid, look: CharAppearance, shape: FaceShape): void {
  const hp = ramp(pick(HAIR_COLORS, look.hair));
  const st = look.hairStyle;
  const bare = st === 'buzz';
  // 앞머리가 내려오는 바닥 행 — 155차: 필드처럼 **이마를 덮고 눈 바로 위**까지(HAIR_CAP_ROWS 4 = 눈 윗줄 직전).
  // 상투는 머리를 당겨 묶어 이마가 반쯤 드러난다(눈썹이 보이는 유일한 긴 머리 — 필드 `bareBrow`와 동일).
  const fringeBot = bare ? TOP + 3 : st === 'topknot' ? BROW_Y - 2 : EYE_Y - 2;

  // 정수리 볼륨 — 얼굴보다 한 칸 크게 덮어 머리가 납작해 보이지 않게
  for (let y = TOP - 2; y <= fringeBot; y++) {
    const r = halfW(shape, Math.max(TOP, y));
    if (r < 0) continue;
    const grow = y < TOP ? r - (TOP - y) : r + 1;
    g.row(y, CX - grow + 1, CX + grow, hp[1]);
    g.put(CX - grow + 1, y, hp[2]); g.put(CX + grow, y, hp[2]);
  }
  // 윤기 — 정수리 오른쪽 위에 밝은 띠 하나
  for (let i = 0; i < 5; i++) g.put(CX + 2 + i, TOP - 1 + (i < 2 ? 0 : 1), hp[0]);
  g.row(TOP, CX - 5, CX + 1, mix(hp[0], hp[1], 0.5));

  if (!bare) {
    // 앞머리 술 — 이마 위에 들쭉날쭉한 끝단(1행 — 눈 윗줄을 덮지 않는다). 일자로 자르면 가발처럼 보인다.
    const tips = st === 'topknot' ? [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1] : [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1];
    for (let i = 0; i < tips.length; i++) {
      const x = CX - 7 + i;
      for (let d = 0; d < tips[i]; d++) g.put(x, fringeBot + 1 + d, d === tips[i] - 1 ? hp[2] : hp[1]);
    }
    // 가르마 — 오른쪽에서 갈라져 왼쪽으로 흐른다
    for (let i = 0; i < 6; i++) g.put(CX + 3 - i, TOP + 1 + i * 0, mix(hp[2], hp[1], 0.3));
  }

  // 옆머리 · 뒷머리
  const side = (fromY: number, toY: number, ext: number): void => {
    for (let y = fromY; y <= toY; y++) {
      const r = halfW(shape, Math.min(CHIN, y));
      const base = r < 0 ? 10 : r;
      for (let d = 0; d < ext; d++) {
        g.put(CX - base - d, y, d === ext - 1 ? hp[2] : hp[1]);
        g.put(CX + base + 1 + d, y, d === ext - 1 ? hp[2] : hp[1]);
      }
    }
  };
  // 옆머리 깊이 — 필드 `L_hairFront`의 sideBot(short y0+5 · braid/pony y0+6 · bob y1-1 · long y1+1)을
  // 초상 행 비율(머리 9행 → 25행)로 옮긴 값. 여기가 다르면 "긴 머리인데 초상은 단발"이 된다.
  if (st === 'bob') side(TOP, CHIN - 3, 2);
  else if (st === 'long') side(TOP, 31, 2);
  else if (st === 'braid') { side(TOP, EYE_Y + 5, 2); side(EYE_Y + 6, 31, 1); }
  else if (st === 'curly') {
    side(TOP, EYE_Y + 3, 2);
    for (let y = TOP - 2; y <= EYE_Y + 3; y += 2) { g.put(CX - 12, y, hp[1]); g.put(CX + 13, y, hp[1]); }
    for (let x = CX - 8; x <= CX + 9; x += 2) g.put(x, TOP - 3, hp[0]);   // 정수리 곱슬 돌기(필드 y0-2 행)
  } else if (st === 'pony') {
    side(TOP, CHIN - 2, 1);
    for (let y = EYE_Y; y <= 28; y++) { g.row(y, CX + 12, CX + 13, hp[1]); g.put(CX + 13, y, hp[2]); }
  } else if (st === 'topknot') {
    side(TOP + 2, EYE_Y + 1, 1);
    for (let y = TOP - 5; y <= TOP - 1; y++) g.row(y, CX - 2, CX + 3, y === TOP - 5 ? hp[0] : hp[1]);
  } else if (st === 'short') side(TOP + 2, EYE_Y + 3, 1);
}

/**
 * 모자 — 머리 위에 얹는다. 155차: 필드 `L_hat`의 덮임 비율을 그대로 옮겼다
 * (캡 = 머리 9행 중 위 3행 + 챙 1행 → 초상 정수리~10행 + 챙 2행 · 비니 = 위 4행 + 밝은 밴드 ·
 *  벙거지 = 위 2행 + 넓은 챙 · 두건 = 2~3행 띠). 앞머리 술(13행)은 챙 아래로 한 줄 보인다.
 */
function drawHat(g: PGrid, kind: HatKind, color: Rgb, shape: FaceShape): void {
  if (kind === 'none') return;
  const hp = ramp(color);
  const crown = (bot: number): void => {
    for (let y = TOP - 2; y <= bot; y++) {
      const r = halfW(shape, Math.max(TOP, y));
      const grow = (r < 0 ? 10 : r) + (y < TOP ? -(TOP - y) + 2 : 2);
      g.row(y, CX - grow + 1, CX + grow, hp[1]);
      g.put(CX - grow + 1, y, hp[2]); g.put(CX + grow, y, hp[2]);
      if (y === TOP - 2) g.row(y, CX - grow + 2, CX + grow - 1, hp[0]);
    }
  };
  if (kind === 'visor') {
    g.row(TOP + 3, CX - 11, CX + 12, hp[1]);
    g.row(TOP + 4, CX - 11, CX + 12, hp[2]);
    for (let x = CX - 12; x <= CX + 13; x++) { g.put(x, TOP + 5, hp[1]); g.put(x, TOP + 6, hp[2]); }
    return;
  }
  if (kind === 'bandana') {
    for (let y = TOP + 3; y <= TOP + 6; y++) {
      const r = halfW(shape, y) + 1;
      g.row(y, CX - r + 1, CX + r, y === TOP + 6 ? hp[2] : hp[1]);
    }
    for (let i = 0; i < 4; i++) g.put(CX + 11 + (i % 2), TOP + 5 + i, hp[i % 2 ? 2 : 1]);   // 매듭 꼬리
    return;
  }
  if (kind === 'cap') {
    crown(BROW_Y - 1);
    for (let x = CX - 10; x <= CX + 13; x++) { g.put(x, BROW_Y, hp[1]); g.put(x, BROW_Y + 1, hp[2]); }   // 챙 2행
    return;
  }
  if (kind === 'beanie') {
    crown(BROW_Y);
    const band = ramp(mix(color, 0xffffff, 0.2));
    for (let y = BROW_Y - 1; y <= BROW_Y + 1; y++) {
      const r = halfW(shape, y) + 2;
      g.row(y, CX - r + 1, CX + r, y === BROW_Y + 1 ? band[2] : band[1]);
    }
    return;
  }
  // sun — 벙거지: 낮은 왕관 + 넓은 챙
  crown(TOP + 5);
  for (let x = 1; x < PORTRAIT_CELL - 1; x++) { g.put(x, TOP + 6, hp[1]); g.put(x, TOP + 7, hp[2]); }
}

/** 실루엣 바깥 1px 테두리 — 어두운 대화창 위에서 얼굴이 뜨게 한다 */
function outline(g: PGrid): void {
  const add: { i: number; c: Rgb }[] = [];
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      if (g.get(x, y) >= 0) continue;
      let r = 0, gg = 0, b = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const c = g.get(x + dx, y + dy);
        if (c < 0) continue;
        r += (c >> 16) & 255; gg += (c >> 8) & 255; b += c & 255; n++;
      }
      if (!n) continue;
      const avg = ((r / n | 0) << 16) | ((gg / n | 0) << 8) | (b / n | 0);
      add.push({ i: y * g.w + x, c: mix(avg, 0x241c2a, 0.68) });
    }
  }
  for (const a of add) g.px[a.i] = a.c;
}

// ─────────────────────────────────────────────────────────────

export interface PortraitRaster {
  w: number;
  h: number;
  rgba: Uint8ClampedArray;
}

/**
 * 초상 한 장 — 32x32 아트 px. 배치는 **정수 배율**로만 확대한다(비정수 배율 금지 · AGENTS §8).
 * 순수 함수라 같은 `CharConfig`면 항상 같은 그림이 나온다(클라가 텍스처 키로 캐시한다).
 */
export function renderFacePortrait(cfg: CharConfig): PortraitRaster {
  const g = new PGrid();
  const look = cfg.look;
  const shape = look.faceShape ?? 'oval';
  const skin = ramp(pick(SKIN_TONES, look.skin));
  const shirt = cfg.outfit.shirt === 'none' ? mix(skin[1], 0x8a5a3c, 0.5) : cfg.outfit.shirtColor;

  drawNeck(g, skin, shirt);
  drawSkin(g, shape, skin);
  drawEars(g, shape, skin);
  drawBlush(g, look);
  drawNose(g, skin);
  drawMouth(g, look, skin);
  drawBeard(g, look, shape);
  drawEyes(g, look);
  drawBrows(g, look);
  drawHair(g, look, shape);
  drawHat(g, cfg.outfit.hat, cfg.outfit.hatColor, shape);
  outline(g);

  return { w: g.w, h: g.h, rgba: g.toRgba() };
}
