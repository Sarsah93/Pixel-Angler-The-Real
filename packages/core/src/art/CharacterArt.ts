/**
 * @file CharacterArt.ts
 * @description 바닐라 베이스 캐릭터 아트 (138차) — 순수 TS 픽셀 래스터라이저.
 *
 * ## 왜 코드가 도트를 소유하는가
 * 구 캐릭터는 외부 고해상 출력물을 런타임 축소해 썼다(`man-idle-front` 260x467 · 26,817색 →
 * 52px = x0.111). 그 결과 ① 그레인이 아예 없어 지면(2px 도트)과 어긋나고 ② idle/walk의
 * 실효 해상도가 2.3배 달라 걷기 시작하면 스프라이트가 또렷해지며 ③ **장비 착용을 표현할 수 없었다**.
 *
 * 여기서는 아트 격자를 코드가 소유한다.
 *  - 셀 **32 x 32 아트 px**, 몸 12~13w x 26h (머리끝 y=3 ~ 발바닥 y=28).
 *  - 머리는 **9행 x 10w**(측면 9w) — 몸 26행의 35%. 어깨(10w)보다 좁아야 버섯이 안 된다.
 *    ⚠ 139차 정정: 138차는 10행 x 12w라 머리가 어깨보다 넓었다(사용자 지적 "얼굴이 너무 커").
 *  - 게임 표시는 **정수 x2** → 64x64 화면 px · 몸 52px (구 `PLAYER_DISPLAY_H`와 동일).
 *  - 그레인 2px = Kenney 지면(16px x2)·해안 시트와 동일 격자. **비정수 배율 금지.**
 *
 * ## 레이어 (아래 → 위)
 *   skin → underwear → pants → shirt → outer → shoes → gloves → pack
 *   → hair(back) → head/face → hair(front) → hat → held
 * 모든 레이어는 `pose()`가 주는 **앵커 사각형만** 참조한다. 신규 장비 = 그리기 함수 1개.
 *
 * ## 바닐라 규약 (사용자 지시 2026-09-16)
 * 베이스는 **나체 + 언더웨어**(여성은 상의 속옷 포함)다. 상의/하의/신발은 전부 **장착 아이템**이며
 * 캐릭터 생성 직후 기본 지급분이 입혀진다. 즉 "옷을 벗은 상태"가 자료구조상 정상 상태다.
 *
 * ⚠ core 규칙 — Phaser/DOM 금지. 여기는 **RGBA 버퍼만** 만든다. 텍스처 굽기는
 *   client `ui/CharacterSprite.ts`가 담당한다.
 */

export const CHAR_CELL = 32;
/** 몸 기준선 — 발바닥 행(포함) */
export const CHAR_FOOT_Y = 28;
/** 머리 꼭대기 행 */
export const CHAR_HEAD_TOP = 3;
/** 게임 표시 배율 (정수 고정) */
export const CHAR_SCALE = 2;

export type CharDir = 'down' | 'left' | 'right' | 'up';
/** 0 = 대기 · 1~4 = 걷기(접지 → 통과 → 접지 → 통과) */
export type CharFrame = 0 | 1 | 2 | 3 | 4;
export const CHAR_DIRS: CharDir[] = ['down', 'left', 'right', 'up'];
export const CHAR_FRAMES: CharFrame[] = [0, 1, 2, 3, 4];

export type CharSex = 'm' | 'f';

// ─────────────────────────────────────────────────────────────
// 색 · 램프
// ─────────────────────────────────────────────────────────────

/** 전역 아웃라인 기준색 (순검정 금지 — 도트가 딱딱해진다) */
const OUTLINE = 0x2a2435;
/**
 * 아웃라인에 남기는 **부위 고유색 비율** (142차).
 * 실루엣 전체를 같은 남보라로 두르면 머리카락도 피부도 옷도 같은 테두리라 도트가 납작해진다.
 * 시안(스타듀 계열)은 머리카락 옆은 짙은 갈색, 피부 옆은 짙은 살구로 테두리가 물든다 —
 * 그래서 이웃 픽셀 색을 섞은 **컬러드 아웃라인**을 쓴다.
 */
const OUTLINE_MIX = 0.68;

type Rgb = number;
/** [하이라이트, 기본, 음영] */
type Ramp = readonly [Rgb, Rgb, Rgb];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/**
 * 기본색 하나에서 3톤 램프를 만든다 — 커스터마이징 색이 임의로 들어와도
 * 명암 규칙이 흔들리지 않게 하는 단일 소스.
 * 하이라이트는 노랑 쪽으로, 음영은 보라 쪽으로 살짝 틀어 픽셀아트 특유의 온도차를 준다.
 */
export function ramp(base: Rgb): Ramp {
  return [mix(base, 0xfff2c8, 0.30), base, mix(base, 0x3a2a4a, 0.34)] as const;
}

/** 커스터마이징 팔레트 — 생성 UI가 그대로 소비한다 */
export const SKIN_TONES: Rgb[] = [0xf6d3b0, 0xe8b489, 0xd19a6e, 0xac7550, 0x8a5a3c];
export const HAIR_COLORS: Rgb[] = [
  0x2e2833, 0x4a3426, 0x7a5232, 0xb98a4e, 0xe0c78a,
  0x9a4a3a, 0x8d8f9a, 0xe8e6e0, 0x4d6b8a, 0x7a5a8f,
];
export const EYE_COLORS: Rgb[] = [0x3a2a22, 0x5a3b26, 0x2f5a6e, 0x3f6b3a, 0x6a3f6e, 0x8a4a3a];
export const CLOTH_COLORS: Rgb[] = [
  0xe8e2d4, 0x3d5a80, 0xc4553f, 0x5b6637, 0x2f8377,
  0xd1a72f, 0x8a5a8f, 0x9a9ea6, 0x4a4550, 0xc47430,
];

/** 이마를 덮는 머리카락 행 수 (머리 상단부터) — 시안 정합의 핵심 값 */
const HAIR_CAP_ROWS = 4;
/** 눈이 놓이는 행 (머리 상단 기준) — 머리카락 4행 + 앞머리 술 1행 아래 */
const EYE_ROW = 5;

export const HAIR_STYLES = ['short', 'bob', 'pony', 'long', 'buzz', 'curly', 'braid', 'topknot'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const MOUTH_STYLES = ['smile', 'neutral', 'small', 'open'] as const;
export type MouthStyle = (typeof MOUTH_STYLES)[number];

/**
 * 얼굴형 — 실질적으로 **턱선**에서 읽힌다(이마~정수리는 머리카락이 덮으므로).
 * oval(계란형) = 넓은 이마 + 좁은 턱 / round(둥근형) = 위아래 모두 둥글게 / square(사각형) = 138차 기본형.
 */
export const FACE_SHAPES = ['oval', 'round', 'square'] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

// ─────────────────────────────────────────────────────────────
// 외형 · 복장 계약
// ─────────────────────────────────────────────────────────────

export interface CharAppearance {
  sex: CharSex;
  /** SKIN_TONES 인덱스 */
  skin: number;
  /** HAIR_COLORS 인덱스 */
  hair: number;
  hairStyle: HairStyle;
  /** 얼굴형 (턱선) */
  faceShape: FaceShape;
  /** EYE_COLORS 인덱스 */
  eye: number;
  mouth: MouthStyle;
  /** 볼 홍조 */
  blush: boolean;
  /** 눈썹 굵기 0~1 */
  brow: number;
  /** 수염 (없으면 -1, 아니면 HAIR_COLORS 인덱스) */
  beard: number;
}

export type ShirtKind = 'none' | 'tee' | 'shirt' | 'hoodie' | 'knit';
export type PantsKind = 'none' | 'jeans' | 'shorts' | 'waders' | 'skirt';
export type ShoesKind = 'none' | 'sneakers' | 'boots' | 'rubber';
export type HatKind = 'none' | 'cap' | 'beanie' | 'sun' | 'bandana' | 'visor';
export type OuterKind = 'none' | 'vest' | 'apron' | 'jacket';
export type HeldKind = 'none' | 'rod' | 'net' | 'crate' | 'gaff';

export interface CharOutfit {
  shirt: ShirtKind; shirtColor: Rgb;
  pants: PantsKind; pantsColor: Rgb;
  shoes: ShoesKind; shoesColor: Rgb;
  hat: HatKind; hatColor: Rgb;
  outer: OuterKind; outerColor: Rgb;
  gloves: boolean; glovesColor: Rgb;
  pack: boolean; packColor: Rgb;
  held: HeldKind;
}

export interface CharConfig {
  look: CharAppearance;
  outfit: CharOutfit;
}

export function defaultAppearance(sex: CharSex = 'm'): CharAppearance {
  return {
    sex, skin: 1, hair: 0, hairStyle: sex === 'f' ? 'bob' : 'short',
    faceShape: 'oval',
    eye: 0, mouth: 'smile', blush: true, brow: 0.5, beard: -1,
  };
}

/** 나체 + 언더웨어 (바닐라) */
export function bareOutfit(): CharOutfit {
  return {
    shirt: 'none', shirtColor: CLOTH_COLORS[0],
    pants: 'none', pantsColor: CLOTH_COLORS[1],
    shoes: 'none', shoesColor: 0x4a4550,
    hat: 'none', hatColor: CLOTH_COLORS[1],
    outer: 'none', outerColor: CLOTH_COLORS[9],
    gloves: false, glovesColor: 0x9a9ea6,
    pack: false, packColor: 0x5e4228,
    held: 'none',
  };
}

/** 캐릭터 생성 직후 지급되는 기본 한 벌 (상의·하의·신발) */
export function starterOutfit(sex: CharSex = 'm'): CharOutfit {
  return {
    ...bareOutfit(),
    shirt: 'tee', shirtColor: sex === 'f' ? 0xd1a72f : 0xe8e2d4,
    pants: sex === 'f' ? 'jeans' : 'jeans', pantsColor: 0x3d5a80,
    shoes: 'sneakers', shoesColor: 0xe8e2d4,
  };
}

// ─────────────────────────────────────────────────────────────
// 래스터 격자
// ─────────────────────────────────────────────────────────────

type Rect = readonly [number, number, number, number];

class Grid {
  readonly w = CHAR_CELL;
  readonly h = CHAR_CELL;
  /** 0 = 투명, 그 외 = 0xRRGGBB + 최상위 비트 플래그(불투명) */
  readonly px: Int32Array;

  constructor() {
    this.px = new Int32Array(this.w * this.h).fill(-1);
  }

  put(x: number, y: number, c: Rgb): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    return this.px[y * this.w + x];
  }

  clear(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = -1;
  }

  /** 3톤 사각형 — 윗줄 하이라이트 / 아랫줄 음영 */
  rect(r: Rect, pal: Ramp, opt: { top?: boolean; bot?: boolean } = {}): void {
    const [x0, y0, x1, y1] = r;
    const top = opt.top !== false;
    const bot = opt.bot !== false;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let c = pal[1];
        if (top && y === y0 && y1 > y0) c = pal[0];
        else if (bot && y === y1 && y1 > y0) c = pal[2];
        this.put(x, y, c);
      }
    }
  }

  fill(r: Rect, c: Rgb): void {
    const [x0, y0, x1, y1] = r;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c);
  }

  /** 실루엣 바깥 1px 테두리 — 픽셀아트 가독성의 핵심. 이웃 색을 섞어 부위마다 톤이 다르다. */
  outline(): void {
    const add: { i: number; c: Rgb }[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) >= 0) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const c = this.get(x + dx, y + dy);
          if (c < 0) continue;
          r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; n++;
        }
        if (!n) continue;
        const avg = ((r / n | 0) << 16) | ((g / n | 0) << 8) | (b / n | 0);
        add.push({ i: y * this.w + x, c: mix(avg, OUTLINE, OUTLINE_MIX) });
      }
    }
    for (const a of add) this.px[a.i] = a.c;
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
// 스켈레톤 — 모든 레이어가 참조하는 단일 앵커
// ─────────────────────────────────────────────────────────────

interface Pose {
  dir: CharDir;
  side: boolean;
  /** 바라보는 쪽 부호 (+1 오른쪽 / -1 왼쪽 / 정면·후면은 0) */
  face: number;
  bob: number;
  head: Rect;
  torso: Rect;
  /** 골반 (언더웨어·바지 허리) */
  hip: Rect;
  /** 앞다리(측면) 또는 왼다리(정면) */
  legA: Rect;
  legB: Rect;
  /** 접지하지 않은 다리: 'A' | 'B' | null */
  lifted: 'A' | 'B' | null;
  armA: Rect;
  armB: Rect | null;
  /**
   * 사지 스큐 — **관절(위)은 고정하고 끝(아래)만** 이 값만큼 앞뒤로 민다.
   * ⚠ 138차는 사각형을 통째로 평행이동해 측면 걷기에서 허벅지가 골반에서 떨어져
   *   "다리가 뒤로 꺾인" 것처럼 보였다(사용자 지적). 139차에 행별 오프셋으로 교체.
   */
  skewA: number;
  skewB: number;
  armSkewA: number;
  armSkewB: number;
}

/** 걷기 4프레임: 접지 → 통과 → 접지(반대) → 통과. 몸통 바운스는 통과 프레임에서 1px. */
const BOB: number[] = [0, 0, -1, 0, -1];

export function pose(dir: CharDir, frame: CharFrame, sex: CharSex): Pose {
  const side = dir === 'left' || dir === 'right';
  const face = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  const b = BOB[frame];
  const top = CHAR_HEAD_TOP + b;

  // 머리 — 9행 x 정면 10w / 측면 9w (측면은 바라보는 쪽으로 1px)
  const hw = side ? 9 : 10;
  const hx0 = side ? 12 + face : 11;   // 측면은 얼굴이 몸통보다 앞으로 나온다(뒤통수는 1px만)
  const head: Rect = [hx0, top, hx0 + hw - 1, top + 8];

  // 몸통 — 여성은 어깨가 좁다
  const tW = side ? 6 : sex === 'f' ? 8 : 10;
  const tx0 = side ? 13 + face : 16 - Math.ceil(tW / 2);
  const torso: Rect = [tx0, top + 9, tx0 + tW - 1, top + 15];

  // 골반
  const pW = side ? 6 : sex === 'f' ? 9 : 8;
  const px0 = side ? 13 + face : 16 - Math.ceil(pW / 2);
  const hip: Rect = [px0, top + 16, px0 + pW - 1, top + 18];

  const legTop = top + 16;
  let legA: Rect; let legB: Rect; let lifted: 'A' | 'B' | null = null;
  let skewA = 0; let skewB = 0;

  if (side) {
    const d = face;
    // ⚠ 다리는 **골반 아래**에 정렬한다 — 138차는 x를 13으로 고정해 골반(면이 face만큼 이동)과
    //   어긋났고, 오른쪽을 볼 때 다리가 1px 뒤로 밀려 "허리에서 꺾인" 실루엣이 됐다.
    const lx0 = px0 + 1;
    const stride = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    legA = [lx0, legTop, lx0 + 3, CHAR_FOOT_Y];
    legB = [lx0, legTop, lx0 + 3, CHAR_FOOT_Y];
    skewA = stride * d;
    skewB = -stride * d;
    // 통과 프레임 — 뒷발이 지면을 떠나 앞으로 지나간다(접지 2 / 통과 2)
    if (frame === 2) { lifted = 'A'; legA = [lx0, legTop, lx0 + 3, CHAR_FOOT_Y - 2]; skewA = d; }
    if (frame === 4) { lifted = 'B'; legB = [lx0, legTop, lx0 + 3, CHAR_FOOT_Y - 2]; skewB = d; }
  } else {
    // 접지 2프레임은 좌우 체중 이동(sway)으로 구분한다 — 안 그러면 f1/f3이 같은 그림이 된다
    const sp = frame === 1 || frame === 3 ? 1 : 0;
    const sway = frame === 1 ? -1 : frame === 3 ? 1 : 0;
    legA = [12 - sp + sway, legTop, 15 - sp + sway, CHAR_FOOT_Y];
    legB = [16 + sp + sway, legTop, 19 + sp + sway, CHAR_FOOT_Y];
    if (frame === 2) { lifted = 'B'; legB = [legB[0], legB[1], legB[2], CHAR_FOOT_Y - 1]; }
    if (frame === 4) { lifted = 'A'; legA = [legA[0], legA[1], legA[2], CHAR_FOOT_Y - 1]; }
  }

  // 팔 — 다리와 반대로 스윙
  const aTop = top + 10;
  const aBot = top + 16;
  let armA: Rect; let armB: Rect | null;
  let armSkewA = 0; let armSkewB = 0;
  if (side) {
    const d = face;
    const sw = frame === 1 ? -1 : frame === 3 ? 1 : 0;
    armA = [tx0 + 2, aTop, tx0 + 4, aBot];
    armSkewA = sw * d * 2;
    armB = null;
  } else {
    const sw = frame === 1 ? -1 : frame === 3 ? 1 : 0;
    armA = [torso[0] - 2, aTop + sw, torso[0] - 1, aBot + sw];
    armB = [torso[2] + 1, aTop - sw, torso[2] + 2, aBot - sw];
  }

  return {
    dir, side, face, bob: b, head, torso, hip,
    legA, legB, lifted, armA, armB, skewA, skewB, armSkewA, armSkewB,
  };
}

// ─────────────────────────────────────────────────────────────
// 사지 렌더 — 관절 고정 + 끝 스큐
// ─────────────────────────────────────────────────────────────

/** 팔·다리 1개. `from`/`to`로 일부 구간(바지 기장·신발 높이)만 칠할 수 있다. */
function limb(
  g: Grid, r: Rect, skew: number, pal: Ramp,
  opt: { from?: number; to?: number; top?: boolean } = {},
): void {
  const [x0, y0, x1, y1] = r;
  const span = Math.max(1, y1 - y0);
  const yA = Math.max(y0, opt.from ?? y0);
  const yB = Math.min(y1, opt.to ?? y1);
  for (let y = yA; y <= yB; y++) {
    const dx = Math.round((skew * (y - y0)) / span);
    const c = y === y0 && opt.top === true ? pal[0] : y === y1 ? pal[2] : pal[1];
    for (let x = x0 + dx; x <= x1 + dx; x++) g.put(x, y, c);
  }
}

/**
 * 어깨 이음매 — 팔과 몸통이 같은 색이라 정면/후면에서 한 덩어리로 뭉친다.
 * 몸통 바깥 열에 1px 그늘을 넣어 팔을 떼어 놓는다(142차 — 시안의 "가는 팔" 인상).
 */
function armSeam(g: Grid, p: Pose, pal: Ramp): void {
  if (p.side || !p.armB) return;
  const [tx0, , tx1] = p.torso;
  const y0 = p.armA[1], y1 = p.armA[3];
  for (let y = y0 + 1; y <= y1; y++) { g.put(tx0, y, pal[2]); g.put(tx1, y, pal[2]); }
}

/** 특정 행에서의 스큐 오프셋 (발끝·그늘 계산용) */
function limbDx(r: Rect, skew: number, y: number): number {
  const span = Math.max(1, r[3] - r[1]);
  return Math.round((skew * (y - r[1])) / span);
}

interface LimbRef { r: Rect; skew: number; far: boolean }

/** 그리기 순서 — 측면은 **먼 다리를 먼저**(뒤에) 깐다 */
function legsOf(p: Pose): LimbRef[] {
  const a: LimbRef = { r: p.legA, skew: p.skewA, far: false };
  const b: LimbRef = { r: p.legB, skew: p.skewB, far: p.side };
  return p.side ? [b, a] : [a, b];
}

// ─────────────────────────────────────────────────────────────
// 레이어
// ─────────────────────────────────────────────────────────────

function skinRamp(look: CharAppearance): Ramp {
  return ramp(SKIN_TONES[Math.max(0, Math.min(SKIN_TONES.length - 1, look.skin))]);
}
function hairRamp(idx: number): Ramp {
  return ramp(HAIR_COLORS[Math.max(0, Math.min(HAIR_COLORS.length - 1, idx))]);
}

/** 뒷머리 — 머리보다 먼저 그려 뒤로 깔린다 */
function L_hairBack(g: Grid, p: Pose, cfg: CharConfig): void {
  const st = cfg.look.hairStyle;
  const pal = hairRamp(cfg.look.hair);
  const [x0, y0, x1, y1] = p.head;
  if (st === 'long') {
    g.rect([x0 - 1, y0 + 2, x1 + 1, y1 + 6], pal, { top: false });
  } else if (st === 'pony') {
    // 정면에서도 머리 옆 볼륨이 보여야 묶은 머리로 읽힌다
    if (!p.side && p.dir !== 'up') {
      g.rect([x0 - 1, y0 + 3, x0 - 1, y1], pal, { top: false });
      g.rect([x1 + 1, y0 + 3, x1 + 1, y1], pal, { top: false });
    }
    if (p.side) {
      const d = -p.face;
      const bx = d > 0 ? x1 + 1 : x0 - 2;
      g.rect([bx, y0 + 3, bx + 1, y0 + 9], pal, { top: false });
    } else if (p.dir === 'up') {
      g.rect([x0 + 3, y0 + 4, x1 - 3, y1 + 5], pal, { top: false });
    }
  } else if (st === 'braid') {
    g.rect([x0 - 1, y0 + 4, x0, y1 + 3], pal, { top: false });
    g.rect([x1, y0 + 4, x1 + 1, y1 + 3], pal, { top: false });
  }
}

function L_skin(g: Grid, p: Pose, cfg: CharConfig): void {
  const pal = skinRamp(cfg.look);
  g.rect(p.head, pal);
  g.rect(p.torso, pal, { top: false });
  g.rect(p.hip, pal, { top: false });
  for (const l of legsOf(p)) limb(g, l.r, l.skew, pal);
  limb(g, p.armA, p.armSkewA, pal);
  if (p.armB) limb(g, p.armB, p.armSkewB, pal);
  armSeam(g, p, pal);

  // 머리 모서리(얼굴형)는 `L_headShape`가 머리카락·모자까지 한꺼번에 깎는다.
  const [hx0, hy0, hx1] = p.head;

  // 측면 코 — 콧대는 눈높이에 1px만. 아래 두 행은 `L_headShape`가 들여서
  // "이마벽 → 코 → 인중 → 턱" 옆선을 만든다(안 들이면 코가 부리로 읽힌다).
  if (p.side) {
    const nx = p.face > 0 ? hx1 + 1 : hx0 - 1;
    g.put(nx, hy0 + 5, pal[1]);
  }
  // 여성 흉부 음영 (2px — 실루엣 구분)
  if (cfg.look.sex === 'f' && !p.side) {
    const [tx0, ty0, tx1] = p.torso;
    g.put(tx0 + 1, ty0 + 2, pal[2]);
    g.put(tx1 - 1, ty0 + 2, pal[2]);
  }
}

function L_underwear(g: Grid, p: Pose, cfg: CharConfig): void {
  const brief = ramp(cfg.look.sex === 'f' ? 0xd88aa0 : 0x5a6b8a);
  const [px0, py0, px1] = p.hip;
  g.rect([px0, py0, px1, py0 + 2], brief, { top: false });
  if (cfg.look.sex === 'f') {
    const [tx0, ty0, tx1] = p.torso;
    g.rect([tx0, ty0 + 2, tx1, ty0 + 3], brief, { top: false });
  }
}

function L_pants(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.pants;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.pantsColor);
  const len = k === 'shorts' ? 2 : k === 'skirt' ? 3 : k === 'waders' ? 8 : 6;
  if (k === 'skirt') {
    const [x0, y0, x1] = p.hip;
    g.rect([x0 - 1, y0, x1 + 1, y0 + len], pal, { top: false });
    return;
  }
  g.rect([p.hip[0], p.hip[1], p.hip[2], p.hip[1] + 1], pal, { top: false });
  for (const l of legsOf(p)) limb(g, l.r, l.skew, pal, { to: l.r[1] + len });
  if (k === 'waders') {
    // 가슴장화 — 멜빵이 몸통까지 올라온다
    const [tx0, ty0, tx1, ty1] = p.torso;
    g.rect([tx0, ty1 - 2, tx1, ty1], pal, { top: false });
    g.rect([tx0 + 1, ty0, tx0 + 1, ty1], pal, { top: false });
    g.rect([tx1 - 1, ty0, tx1 - 1, ty1], pal, { top: false });
  }
}

function L_shirt(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.shirt;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.shirtColor);
  const [x0, y0, x1, y1] = p.torso;
  g.rect([x0, y0, x1, y1], pal);
  // 허리까지 내려오는 기장
  g.rect([p.hip[0], p.hip[1], p.hip[2], p.hip[1]], pal, { top: false });
  const sleeve = k === 'tee' ? 2 : k === 'knit' ? 6 : 5;
  limb(g, p.armA, p.armSkewA, pal, { to: p.armA[1] + sleeve });
  if (p.armB) limb(g, p.armB, p.armSkewB, pal, { to: p.armB[1] + sleeve });
  armSeam(g, p, pal);
  if (k === 'hoodie') {
    g.rect([x0, y0 - 1, x1, y0], pal, { top: false });     // 후드
    g.put(16, y0 + 3, pal[2]); g.put(15, y0 + 3, pal[2]);  // 주머니
  }
  if (k === 'shirt' && p.dir === 'down') {
    g.rect([15, y0, 16, y1], pal, { top: false });
    g.put(15, y0 + 2, pal[2]); g.put(15, y0 + 4, pal[2]);  // 단추
  }
}

function L_outer(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.outer;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.outerColor);
  const [x0, y0, x1, y1] = p.torso;
  if (k === 'apron') {
    g.rect([x0 + 1, y0 + 2, x1 - 1, y1], pal, { top: false });
    g.rect([p.hip[0] + 1, p.hip[1], p.hip[2] - 1, p.hip[1] + 2], pal, { top: false });
    g.put(x0 + 2, y0, pal[2]); g.put(x1 - 2, y0, pal[2]);   // 끈
  } else if (k === 'vest') {
    g.rect([x0, y0, x0 + 1, y1], pal);
    g.rect([x1 - 1, y0, x1, y1], pal);
    g.rect([x0, y0, x1, y0], pal);
    if (!p.side) {
      const buckle = ramp(0xf2d45a);
      g.put(x0 + 1, y0 + 3, buckle[1]); g.put(x1 - 1, y0 + 3, buckle[1]);
    }
  } else {
    g.rect([x0 - 1, y0, x1 + 1, y1], pal);
    limb(g, p.armA, p.armSkewA, pal, { to: p.armA[1] + 5 });
    if (p.armB) limb(g, p.armB, p.armSkewB, pal, { to: p.armB[1] + 5 });
  }
}

function L_shoes(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.shoes;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.shoesColor);
  const h = k === 'rubber' ? 5 : k === 'boots' ? 3 : 2;
  for (const l of legsOf(p)) {
    limb(g, l.r, l.skew, pal, { from: l.r[3] - h + 1 });
    if (p.side) {
      const dx = limbDx(l.r, l.skew, l.r[3]);
      g.put(p.face > 0 ? l.r[2] + dx + 1 : l.r[0] + dx - 1, l.r[3], pal[2]);   // 발끝
    }
  }
}

function L_gloves(g: Grid, p: Pose, cfg: CharConfig): void {
  if (!cfg.outfit.gloves) return;
  const pal = ramp(cfg.outfit.glovesColor);
  limb(g, p.armA, p.armSkewA, pal, { from: p.armA[3] - 1 });
  if (p.armB) limb(g, p.armB, p.armSkewB, pal, { from: p.armB[3] - 1 });
}

function L_pack(g: Grid, p: Pose, cfg: CharConfig): void {
  if (!cfg.outfit.pack) return;
  const pal = ramp(cfg.outfit.packColor);
  const [x0, y0, x1, y1] = p.torso;
  if (p.dir === 'up') {
    g.rect([x0, y0 + 1, x1, y1], pal);
    g.put(x0 + 2, y0 + 4, pal[2]); g.put(x1 - 2, y0 + 4, pal[2]);
  } else if (p.side) {
    const bx = p.face > 0 ? x0 - 2 : x1 + 1;
    g.rect([bx, y0 + 1, bx + 1, y1 - 1], pal);
  } else {
    g.rect([x0 + 1, y0, x0 + 1, y1 - 1], pal, { top: false });
    g.rect([x1 - 1, y0, x1 - 1, y1 - 1], pal, { top: false });
  }
}

/**
 * 얼굴 — 큰 눈 · 작은 입 · 볼홍조. 캐릭터 인상이 사실상 여기서 결정된다.
 *
 * 142차(시안 정합): 머리카락이 이마를 덮으므로 **얼굴은 눈~턱 4행만 쓴다**.
 *  r5~r6 = 눈(2px 폭 · 짙은 동공 + 하이라이트) · r7 = 볼홍조 + 입 · r8 = 턱.
 * ⚠ 눈썹 행을 따로 두지 않는다 — 앞머리에 가리는 것이 정상이고, 9행 얼굴에 어두운 띠가
 *   두 줄 쌓이면 곧바로 험상궂어진다(138~140차에 실제로 그랬다).
 *   이마가 드러나는 스타일(`buzz`·`topknot`)에서만 눈 바깥에 1px 눈썹을 찍는다.
 */
function L_face(g: Grid, p: Pose, cfg: CharConfig): void {
  if (p.dir === 'up') return;
  const look = cfg.look;
  const [x0, y0, x1] = p.head;
  const iris = ramp(EYE_COLORS[Math.max(0, Math.min(EYE_COLORS.length - 1, look.eye))]);
  // 동공은 홍채보다 훨씬 어둡다 — 시안의 인상은 "검은 세로 바"에서 온다
  const pupil = mix(iris[2], 0x1b1520, 0.55);
  const ey = y0 + EYE_ROW;
  const bareBrow = look.hairStyle === 'buzz' || look.hairStyle === 'topknot';
  const browOn = bareBrow && look.brow > 0.3;

  /**
   * 눈 한 짝 — 2px 폭 x 2행. **위 행은 통째로 동공(검은 바), 아래 행이 홍채색**이다.
   * 시안의 인상은 흰자가 아니라 이 검은 바에서 온다 — 하이라이트를 크게 넣으면
   * 눈이 절반으로 쪼개져 멍한 얼굴이 된다(142차 1차 시도에서 실제로 그랬다).
   */
  const eye = (ax: number, outward: number): void => {
    g.put(ax, ey, pupil); g.put(ax + 1, ey, pupil);
    g.put(ax, ey + 1, iris[0]); g.put(ax + 1, ey + 1, iris[0]);
    // 안쪽 아래 1px은 홍채 본색 — 위 검정 / 아래 밝음의 세로 대비가 눈을 크게 보이게 한다
    g.put(outward > 0 ? ax : ax + 1, ey + 1, iris[1]);
    if (browOn) g.put(ax + (outward > 0 ? 2 : -1), ey - 1, hairRamp(look.hair)[2]);
  };

  if (p.side) {
    const front = p.face > 0;
    const ax = front ? x1 - 3 : x0 + 2;           // 구레나룻(가장자리 열)에 안 걸리게 한 칸 안쪽
    g.put(ax, ey, pupil); g.put(ax + 1, ey, pupil);
    g.put(ax, ey + 1, iris[0]); g.put(ax + 1, ey + 1, iris[0]);
    g.put(front ? ax : ax + 1, ey + 1, iris[1]);
    if (browOn) g.put(front ? ax - 1 : ax + 2, ey - 1, hairRamp(look.hair)[2]);
  } else {
    eye(x0 + 2, -1); eye(x1 - 3, 1);
  }
  // 속눈썹 — 성별 식별의 1px (같은 도트 예산으로 가장 크게 읽히는 신호)
  if (look.sex === 'f') {
    const lash = mix(pupil, 0x000000, 0.2);
    if (p.side) g.put(p.face > 0 ? x1 - 1 : x0 + 1, ey, lash);
    else { g.put(x0 + 1, ey, lash); g.put(x1 - 1, ey, lash); }
  }

  const my = ey + 2;
  // 볼 홍조 — 입과 같은 행이지만 얼굴 양 끝이라 겹치지 않는다
  if (look.blush) {
    const bl = mix(skinRamp(look)[1], 0xf0787e, 0.32);
    if (p.side) g.put(p.face > 0 ? x1 - 4 : x0 + 4, my, bl);
    else { g.put(x0 + 1, my, bl); g.put(x1 - 1, my, bl); }
  }

  // 입 — 시안에서는 거의 보이지 않을 만큼 작다. 크게 그으면 어른 얼굴이 된다.
  const mc = mix(0x8a4a4a, skinRamp(look)[2], 0.25);
  const drawMouth = (): void => {
    if (p.side) {
      const m0 = p.face > 0 ? x1 - 2 : x0 + 2;
      if (look.mouth === 'open') { g.put(m0, my, 0x5e2f2f); return; }
      g.put(m0, my, mc);
      if (look.mouth === 'smile') g.put(p.face > 0 ? m0 - 1 : m0 + 1, my, mix(mc, skinRamp(look)[0], 0.45));
      return;
    }
    const cx = x0 + Math.floor((x1 - x0) / 2);
    if (look.mouth === 'smile') {
      // 2px + 입꼬리 1px. 4px로 그으면 콧수염처럼 얼굴을 가로지른다.
      g.put(cx, my, mc); g.put(cx + 1, my, mc);
      g.put(cx + 2, my - 1, mix(mc, skinRamp(look)[0], 0.5));
    } else if (look.mouth === 'neutral') {
      g.put(cx, my, mc); g.put(cx + 1, my, mc);
    } else if (look.mouth === 'small') {
      g.put(cx, my, mc);
    } else {
      g.put(cx, my, 0x5e2f2f); g.put(cx + 1, my, 0x5e2f2f);
    }
  };
  drawMouth();

  // 수염 — **턱선 한 행 + 입 좌우**만. 얼굴 하단을 통째로 칠하면 복면이 된다(142차 1차 시도).
  if (look.beard >= 0) {
    const bp = hairRamp(look.beard);
    const [, , , hy1] = p.head;
    g.rect([x0 + 2, hy1, x1 - 2, hy1], bp, { top: false });
    drawMouth();
  }
}

/**
 * 앞머리 — 얼굴 위에 얹힌다.
 *
 * 142차(시안 정합): 머리카락이 **이마를 완전히 덮고 귀 옆까지 내려온다**.
 * 구 구현은 정수리 2행만 덮어 이마가 훤히 드러났고, 그 때문에 아무리 눈·입을 다듬어도
 * "이마 넓은 어른 얼굴"로 읽혔다. 시안의 인상은 **덮인 이마 + 둥근 머리 실루엣**에서 온다.
 *
 * 행 배치 (r = 머리 상단 기준):
 *   r-1 = 정수리 볼륨(좌우 1px 인셋) · r0~r3 = 머리카락 본체 · r4 = 앞머리 술(이마 일부 노출)
 *   좌우 1px 열 = 옆머리(스타일별로 내려오는 깊이가 다르다)
 */
function L_hairFront(g: Grid, p: Pose, cfg: CharConfig): void {
  const st = cfg.look.hairStyle;
  const pal = hairRamp(cfg.look.hair);
  const [x0, y0, x1, y1] = p.head;

  // 뒤통수 2px — 측면에서 이걸 덮지 않으면 어떤 머리 모양이든 '대머리 옆모습'이 된다
  const napeFill = (bot: number): void => {
    if (!p.side) return;
    const b0 = p.face > 0 ? x0 : x1 - 1;
    g.rect([b0, y0, b0 + 1, bot], pal, { top: false });
  };

  if (st === 'buzz') {
    // 삭발만 예외 — 이마가 드러난다(눈썹도 이때만 보인다)
    g.rect([x0, y0, x1, y0 + 2], pal);
    napeFill(y0 + 4);
    return;
  }

  // 후면은 뒤통수 통짜
  if (p.dir === 'up') {
    g.rect([x0, y0 - 1, x1, y0 - 1], pal);
    g.clear(x0, y0 - 1); g.clear(x1, y0 - 1);
    g.rect([x0, y0, x1, st === 'bob' || st === 'long' ? y1 : y1 - 2], pal);
    return;
  }

  // 정수리 볼륨 — 머리 사각형보다 한 행 위로 부풀리되 **모서리를 2단으로 깎아** 둥글게.
  // 인셋 없이 통짜로 얹으면 머리카락이 아니라 사각 모자로 읽힌다.
  g.rect([x0 + 2, y0 - 1, x1 - 2, y0 - 1], pal);

  // 본체 — 이마를 덮는 4행 (첫 행은 좌우 1px 인셋)
  const capBot = y0 + HAIR_CAP_ROWS - 1;
  g.rect([x0 + 1, y0, x1 - 1, y0], pal);
  g.rect([x0, y0 + 1, x1, capBot], pal, { top: false });

  // 옆머리(귀 옆) 깊이
  const sideBot = st === 'bob' ? y1 - 1
    : st === 'long' ? y1 + 1
      : st === 'braid' || st === 'pony' ? y0 + 6
        : y0 + 5;

  if (p.side) {
    napeFill(st === 'long' ? y1 + 2 : st === 'bob' || st === 'braid' ? y1 : y1 - 1);
    const fx = p.face > 0 ? x1 : x0;               // 얼굴 쪽 = 구레나룻만 (눈높이까지 내려오면 눈을 덮는다)
    g.rect([fx, y0 + 1, fx, Math.min(sideBot, y0 + 3)], pal, { top: false });
    // 앞머리 술 한 가닥이 이마에서 눈 쪽으로 내려온다
    g.put(p.face > 0 ? x1 - 1 : x0 + 1, capBot + 1, pal[1]);
  } else {
    g.rect([x0, y0 + 1, x0, sideBot], pal, { top: false });
    g.rect([x1, y0 + 1, x1, sideBot], pal, { top: false });
    // 앞머리 술 — 눈 사이·바깥으로 내려오는 1px 2~3가닥(밑단이 일직선이면 가발이 된다)
    g.put(x0 + 2, capBot + 1, pal[1]);
    g.put(x1 - 2, capBot + 1, pal[1]);
    if (st === 'bob' || st === 'long' || st === 'curly') {
      g.put(x0 + Math.floor((x1 - x0) / 2), capBot + 1, pal[1]);
    }
  }

  // 스타일 장식
  if (st === 'curly') {
    g.rect([x0 + 1, y0 - 1, x1 - 1, y0 - 1], pal);      // 받침 행 (없으면 돌기가 공중에 뜬다)
    for (let x = x0 + 1; x <= x1 - 1; x += 2) g.put(x, y0 - 2, pal[0]);
  }
  if (st === 'topknot') {
    g.rect([x0 + 4, y0 - 4, x1 - 4, y0 - 2], pal);
  }
}

function L_hat(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.hat;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.hatColor);
  const [x0, y0, x1] = p.head;
  // 142차 — 머리 실루엣이 둥글어졌다. 모자 꼭대기 행도 같은 인셋으로 깎지 않으면
  // 머리보다 넓은 가로 막대가 공중에 뜬 것처럼 보인다.
  const crown = (y: number): void => { g.rect([x0 + 1, y, x1 - 1, y], pal); };
  if (k === 'cap' || k === 'visor') {
    if (k === 'cap') { crown(y0 - 1); g.rect([x0, y0, x1, y0 + 2], pal, { top: false }); }
    else g.rect([x0, y0 + 1, x1, y0 + 2], pal);
    if (p.dir === 'down') g.rect([x0, y0 + 3, x1, y0 + 3], pal, { top: false });
    else if (p.side) {
      const bx = p.face > 0 ? x1 + 1 : x0 - 3;
      g.rect([bx, y0 + 2, bx + 2, y0 + 2], pal, { top: false });
    }
  } else if (k === 'beanie') {
    crown(y0 - 2); crown(y0 - 1);
    g.rect([x0, y0, x1, y0 + 2], pal, { top: false });
    g.rect([x0, y0 + 2, x1, y0 + 3], ramp(mix(cfg.outfit.hatColor, 0xffffff, 0.2)), { top: false });
  } else if (k === 'sun') {
    crown(y0 - 1);
    g.rect([x0, y0, x1, y0 + 1], pal, { top: false });
    g.rect([x0 - 3, y0 + 2, x1 + 3, y0 + 2], pal, { top: false });
  } else if (k === 'bandana') {
    g.rect([x0, y0 + 1, x1, y0 + 2], pal, { top: false });
    if (!p.side) { g.put(x0 + 2, y0 + 1, pal[0]); g.put(x1 - 2, y0 + 2, pal[0]); }
  }
}

/**
 * 행별 좌우 깎기(px). 얼굴형은 **턱선**에서 읽힌다 — 정수리는 머리카락이 덮기 때문.
 * 위쪽은 모자 챙(`sun`)까지 깎아 먹지 않도록 0~1행에서만 손댄다.
 */
function headInset(shape: FaceShape, row: number, rows: number): number {
  const last = rows - 1;
  if (row === 0) return shape === 'round' ? 2 : 1;
  if (row === 1) return shape === 'round' ? 1 : 0;
  if (row === last) return shape === 'oval' ? 2 : shape === 'round' ? 1 : 0;
  if (row === last - 1) return shape === 'oval' ? 1 : 0;
  return 0;
}

/** 얼굴형 — 살·머리카락·모자를 **한꺼번에** 깎아야 실루엣이 하나로 읽힌다 */
function L_headShape(g: Grid, p: Pose, cfg: CharConfig): void {
  const [x0, y0, x1, y1] = p.head;
  const rows = y1 - y0 + 1;
  // 측면 인중 — 코(눈높이) 아래 한 행을 들여 옆선을 만든다(얼굴형과 무관하게 항상)
  if (p.side) g.clear(p.face > 0 ? x1 : x0, y0 + 7);
  for (let y = y0; y <= y1; y++) {
    const ins = headInset(cfg.look.faceShape ?? 'oval', y - y0, rows);
    for (let i = 0; i < ins; i++) { g.clear(x0 + i, y); g.clear(x1 - i, y); }
  }
}

function L_held(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.held;
  if (k === 'none') return;
  const wood = ramp(0x8a6340);
  const tip = 0xf0e3c8;
  const hand = (p.dir === 'left' ? p.armA : (p.armB ?? p.armA));
  const d = p.dir === 'left' ? -1 : 1;
  const ax = d > 0 ? hand[2] + 1 : hand[0] - 1;
  const ay = hand[3] - 1;

  if (k === 'rod' || k === 'gaff') {
    const len = k === 'rod' ? 16 : 10;
    for (let i = 0; i < len; i++) {
      const x = ax + d * Math.floor(i / 2);
      const y = ay + 3 - i;
      g.put(x, y, i < len - 4 ? wood[1] : tip);
      if (i < len - 4 && i % 4 === 3) g.put(x, y + 1, wood[2]);
    }
    g.put(ax - d, ay + 1, wood[2]);
    if (k === 'gaff') { g.put(ax + d * 7, ay + 3 - len, 0xb9bcc0); g.put(ax + d * 6, ay + 4 - len, 0xb9bcc0); }
  } else if (k === 'net') {
    const mesh = ramp(0x9a9ea6);
    for (let i = 0; i < 8; i++) g.put(ax, ay + 3 - i, wood[1]);
    g.rect([ax - 2, ay - 8, ax + 2, ay - 5], mesh, { top: false });
  } else if (k === 'crate') {
    const box = ramp(0x8a6340);
    const [tx0, ty0, tx1] = p.torso;
    g.rect([tx0 - 1, ty0 + 3, tx1 + 1, ty0 + 7], box);
    g.rect([tx0 - 1, ty0 + 5, tx1 + 1, ty0 + 5], ramp(0x5e4228), { top: false });
  }
}

/** 같은 색 면끼리 붙어 덩어리로 뭉치는 것을 막는 분리선 (팔·다리·목).
 *  픽셀아트에서 실루엣을 읽게 하는 가장 값싼 1px이다. */
function shadeCol(g: Grid, x: number, y0: number, y1: number, t = 0.34): void {
  for (let y = y0; y <= y1; y++) {
    const c = g.get(x, y);
    if (c >= 0) g.put(x, y, mix(c, 0x2a2435, t));
  }
}

/** 스큐를 따라가는 사지 가장자리 1px */
function shadeLimbEdge(g: Grid, r: Rect, skew: number, at: 'l' | 'r', t: number): void {
  for (let y = r[1]; y <= r[3]; y++) {
    const dx = limbDx(r, skew, y);
    const x = at === 'l' ? r[0] + dx - 1 : r[2] + dx + 1;
    const c = g.get(x, y);
    if (c >= 0) g.put(x, y, mix(c, 0x2a2435, t));
  }
}

/** 먼 다리를 한 톤 죽인다 — 단, **가까운 다리에 가려진 픽셀은 건드리지 않는다**
 *  (겹치는 프레임에서 앞다리까지 어두워지면 실루엣이 통째로 탁해진다). */
function shadeFarLeg(g: Grid, p: Pose, t: number): void {
  const far = p.legB, near = p.legA;
  for (let y = far[1]; y <= far[3]; y++) {
    const dF = limbDx(far, p.skewB, y);
    const dN = limbDx(near, p.skewA, y);
    const nearIn = y >= near[1] && y <= near[3];
    for (let x = far[0] + dF; x <= far[2] + dF; x++) {
      if (nearIn && x >= near[0] + dN && x <= near[2] + dN) continue;
      const c = g.get(x, y);
      if (c >= 0) g.put(x, y, mix(c, 0x2a2435, t));
    }
  }
}

function L_edges(g: Grid, p: Pose, _cfg: CharConfig): void {
  if (p.side) {
    // 측면: 보이는 팔의 뒤 가장자리 (몸통과 팔을 가른다)
    shadeLimbEdge(g, p.armA, p.armSkewA, p.face > 0 ? 'l' : 'r', 0.34);
    shadeFarLeg(g, p, 0.24);
  } else {
    // 정면·후면: 팔 안쪽 경계 + 다리 사이 + 목 그늘
    shadeCol(g, p.armA[2], p.armA[1], p.armA[3], 0.26);
    if (p.armB) shadeCol(g, p.armB[0], p.armB[1], p.armB[3], 0.26);
    const gapX = Math.min(p.legA[2], p.legB[2]);
    if (p.legB[0] - p.legA[2] <= 1) shadeCol(g, gapX, p.legA[1] + 1, Math.max(p.legA[3], p.legB[3]), 0.45);
    shadeCol(g, p.torso[0] + 2, p.torso[1], p.torso[1], 0.30);
    shadeCol(g, p.torso[2] - 2, p.torso[1], p.torso[1], 0.30);
  }
}

const LAYERS: ((g: Grid, p: Pose, cfg: CharConfig) => void)[] = [
  L_hairBack, L_skin, L_underwear, L_pants, L_shirt, L_outer,
  L_shoes, L_gloves, L_edges, L_pack, L_face, L_hairFront, L_hat, L_headShape, L_held,
];

// ─────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────

/** 셀 1장 래스터 (RGBA · 길이 32*32*4) */
export function renderCharCell(dir: CharDir, frame: CharFrame, cfg: CharConfig): Uint8ClampedArray {
  const g = new Grid();
  const p = pose(dir, frame, cfg.look.sex);
  for (const fn of LAYERS) fn(g, p, cfg);
  g.outline();
  return g.toRgba();
}

/** 시트 1장 (열 = 프레임 5 · 행 = 방향 4) → 160 x 128 */
export function renderCharSheet(cfg: CharConfig): { w: number; h: number; data: Uint8ClampedArray } {
  const w = CHAR_CELL * CHAR_FRAMES.length;
  const h = CHAR_CELL * CHAR_DIRS.length;
  const out = new Uint8ClampedArray(w * h * 4);
  CHAR_DIRS.forEach((d, r) => {
    CHAR_FRAMES.forEach((f, c) => {
      const cell = renderCharCell(d, f, cfg);
      for (let y = 0; y < CHAR_CELL; y++) {
        const src = y * CHAR_CELL * 4;
        const dst = ((r * CHAR_CELL + y) * w + c * CHAR_CELL) * 4;
        out.set(cell.subarray(src, src + CHAR_CELL * 4), dst);
      }
    });
  });
  return { w, h, data: out };
}

/** 설정 → 캐시 키 (텍스처 재사용 판정용) */
export function charCfgKey(cfg: CharConfig): string {
  const l = cfg.look; const o = cfg.outfit;
  return [
    l.sex, l.skin, l.hair, l.hairStyle, l.faceShape, l.eye, l.mouth, l.blush ? 1 : 0, l.brow, l.beard,
    o.shirt, o.shirtColor, o.pants, o.pantsColor, o.shoes, o.shoesColor,
    o.hat, o.hatColor, o.outer, o.outerColor, o.gloves ? 1 : 0, o.glovesColor,
    o.pack ? 1 : 0, o.packColor, o.held,
  ].join('_');
}

export function makeCharConfig(look: Partial<CharAppearance>, outfit?: Partial<CharOutfit>): CharConfig {
  const base = defaultAppearance(look.sex ?? 'm');
  return {
    look: { ...base, ...look },
    outfit: { ...bareOutfit(), ...(outfit ?? {}) },
  };
}
