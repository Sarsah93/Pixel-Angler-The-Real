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

/** 전역 아웃라인 (순검정 금지 — 도트가 딱딱해진다) */
const OUTLINE = 0x2a2435;

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

export const HAIR_STYLES = ['short', 'bob', 'pony', 'long', 'buzz', 'curly', 'braid', 'topknot'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const MOUTH_STYLES = ['smile', 'neutral', 'small', 'open'] as const;
export type MouthStyle = (typeof MOUTH_STYLES)[number];

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

  /** 실루엣 바깥 1px 테두리 — 픽셀아트 가독성의 핵심 */
  outline(): void {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) >= 0) continue;
        if (this.get(x + 1, y) >= 0 || this.get(x - 1, y) >= 0
          || this.get(x, y + 1) >= 0 || this.get(x, y - 1) >= 0) add.push(y * this.w + x);
      }
    }
    for (const i of add) this.px[i] = OUTLINE;
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
}

/** 걷기 4프레임: 접지 → 통과 → 접지(반대) → 통과. 몸통 바운스는 통과 프레임에서 1px. */
const BOB: number[] = [0, 0, -1, 0, -1];

export function pose(dir: CharDir, frame: CharFrame, sex: CharSex): Pose {
  const side = dir === 'left' || dir === 'right';
  const face = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  const b = BOB[frame];
  const top = CHAR_HEAD_TOP + b;

  // 머리 — 정면 12w / 측면 11w (바라보는 쪽으로 1px 이동). 10행 = 몸 26행의 38%(치비 비율)
  const hw = side ? 11 : 12;
  const hx0 = side ? 10 + face : 10;
  const head: Rect = [hx0, top, hx0 + hw - 1, top + 9];

  // 몸통 — 여성은 어깨가 좁다
  const tW = side ? 6 : sex === 'f' ? 8 : 10;
  const tx0 = side ? 13 + face : 16 - Math.ceil(tW / 2);
  const torso: Rect = [tx0, top + 10, tx0 + tW - 1, top + 16];

  // 골반
  const pW = side ? 6 : sex === 'f' ? 9 : 8;
  const px0 = side ? 13 + face : 16 - Math.ceil(pW / 2);
  const hip: Rect = [px0, top + 17, px0 + pW - 1, top + 19];

  const legTop = top + 17;
  let legA: Rect; let legB: Rect; let lifted: 'A' | 'B' | null = null;

  if (side) {
    const d = face;
    const off = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    legA = [13 + off * d, legTop, 16 + off * d, CHAR_FOOT_Y];
    legB = [13 - off * d, legTop, 16 - off * d, CHAR_FOOT_Y];
    if (frame === 2) { lifted = 'A'; legA = [legA[0], legA[1], legA[2], CHAR_FOOT_Y - 1]; }
    if (frame === 4) { lifted = 'B'; legB = [legB[0], legB[1], legB[2], CHAR_FOOT_Y - 1]; }
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
  const aTop = top + 11;
  const aBot = top + 17;
  let armA: Rect; let armB: Rect | null;
  if (side) {
    const d = face;
    const sw = frame === 1 ? -1 : frame === 3 ? 1 : 0;
    armA = [13 + sw * d, aTop, 15 + sw * d, aBot];
    armB = null;
  } else {
    const sw = frame === 1 ? -1 : frame === 3 ? 1 : 0;
    armA = [torso[0] - 3, aTop + sw, torso[0] - 1, aBot + sw];
    armB = [torso[2] + 1, aTop - sw, torso[2] + 3, aBot - sw];
  }

  return { dir, side, face, bob: b, head, torso, hip, legA, legB, lifted, armA, armB };
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
  for (const r of [p.legA, p.legB]) g.rect(r, pal, { top: false });
  for (const r of [p.armA, p.armB]) if (r) g.rect(r, pal, { top: false });

  // 머리 모서리 라운딩 (상자머리 완화) — 아래턱은 여성만 둥글게
  const [hx0, hy0, hx1, hy1] = p.head;
  g.clear(hx0, hy0); g.clear(hx1, hy0);
  if (cfg.look.sex === 'f') { g.clear(hx0, hy1); g.clear(hx1, hy1); }

  // 측면 코 — 프로파일을 만드는 1px
  if (p.side) {
    const nx = p.face > 0 ? hx1 + 1 : hx0 - 1;
    g.put(nx, hy0 + 6, pal[1]);
    g.put(nx, hy0 + 7, pal[2]);
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
  for (const r of [p.legA, p.legB]) {
    g.rect([r[0], r[1], r[2], Math.min(r[3], r[1] + len)], pal, { top: false });
  }
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
  for (const r of [p.armA, p.armB]) {
    if (!r) continue;
    g.rect([r[0], r[1], r[2], Math.min(r[3], r[1] + sleeve)], pal, { top: false });
  }
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
    for (const r of [p.armA, p.armB]) if (r) g.rect([r[0], r[1], r[2], r[1] + 5], pal, { top: false });
  }
}

function L_shoes(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.shoes;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.shoesColor);
  const h = k === 'rubber' ? 5 : k === 'boots' ? 3 : 2;
  for (const r of [p.legA, p.legB]) {
    g.rect([r[0], r[3] - h + 1, r[2], r[3]], pal, { top: false });
    if (p.side) g.put(p.face > 0 ? r[2] + 1 : r[0] - 1, r[3], pal[2]);   // 발끝
  }
}

function L_gloves(g: Grid, p: Pose, cfg: CharConfig): void {
  if (!cfg.outfit.gloves) return;
  const pal = ramp(cfg.outfit.glovesColor);
  for (const r of [p.armA, p.armB]) if (r) g.rect([r[0], r[3] - 1, r[2], r[3]], pal, { top: false });
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

/** 얼굴 — 큰 눈(2x3 + 하이라이트)·입·볼홍조. 캐릭터 인상이 사실상 여기서 결정된다. */
function L_face(g: Grid, p: Pose, cfg: CharConfig): void {
  if (p.dir === 'up') return;
  const look = cfg.look;
  const [x0, y0, x1] = p.head;
  const iris = ramp(EYE_COLORS[Math.max(0, Math.min(EYE_COLORS.length - 1, look.eye))]);
  const lid = 0x3a3145;
  const ey = y0 + 4;

  const eye = (ax: number) => {
    g.put(ax, ey, lid); g.put(ax + 1, ey, lid);
    g.put(ax, ey + 1, 0xfdfbff); g.put(ax + 1, ey + 1, iris[0]);
    g.put(ax, ey + 2, iris[2]); g.put(ax + 1, ey + 2, iris[2]);
  };

  if (p.side) {
    eye(p.face > 0 ? x1 - 3 : x0 + 2);
  } else {
    eye(x0 + 2); eye(x1 - 3);
  }
  // 속눈썹 — 성별 식별의 1px (같은 도트 예산으로 가장 크게 읽히는 신호)
  if (look.sex === 'f') {
    if (p.side) g.put(p.face > 0 ? x1 - 1 : x0, ey, lid);
    else { g.put(x0 + 1, ey, lid); g.put(x1 - 1, ey, lid); }
  }

  // 눈썹
  if (look.brow > 0.3) {
    const bp = hairRamp(look.hair)[2];
    if (p.side) {
      const bx = p.face > 0 ? x1 - 3 : x0 + 2;
      g.put(bx, ey - 2, bp); g.put(bx + 1, ey - 2, bp);
    } else {
      for (const bx of [x0 + 2, x1 - 3]) { g.put(bx, ey - 2, bp); g.put(bx + 1, ey - 2, bp); }
    }
  }

  // 볼 홍조
  if (look.blush) {
    const bl = 0xf09a9a;
    if (p.side) g.put(p.face > 0 ? x1 - 1 : x0 + 1, ey + 3, bl);
    else { g.put(x0 + 1, ey + 3, bl); g.put(x1 - 1, ey + 3, bl); }
  }

  // 입
  const my = ey + 4;
  const mc = 0x8a4a4a;
  const cx = p.side ? (p.face > 0 ? x1 - 3 : x0 + 2) : x0 + Math.floor((x1 - x0) / 2);
  if (look.mouth === 'smile') {
    g.put(cx, my, mc); g.put(cx + 1, my, mc);
    g.put(cx - 1, my - 1, mc); g.put(cx + 2, my - 1, mc);
  } else if (look.mouth === 'neutral') {
    g.put(cx, my, mc); g.put(cx + 1, my, mc);
  } else if (look.mouth === 'small') {
    g.put(cx, my, mc);
  } else {
    g.put(cx, my, mc); g.put(cx + 1, my, mc);
    g.put(cx, my - 1, 0x5e2f2f); g.put(cx + 1, my - 1, 0x5e2f2f);
  }

  // 수염
  if (look.beard >= 0) {
    const bp = hairRamp(look.beard);
    const [, , , hy1] = p.head;
    g.rect([x0 + 1, my - 1, x1 - 1, hy1], bp, { top: false });
    if (look.mouth !== 'open') { g.put(cx, my, mc); g.put(cx + 1, my, mc); }
  }
}

/** 앞머리 — 얼굴 위에 얹힌다 */
function L_hairFront(g: Grid, p: Pose, cfg: CharConfig): void {
  const st = cfg.look.hairStyle;
  const pal = hairRamp(cfg.look.hair);
  const [x0, y0, x1, y1] = p.head;

  if (st === 'buzz') { g.rect([x0, y0, x1, y0 + 1], pal); return; }

  // 공통 윗머리
  const capBot = st === 'bob' || st === 'long' ? y0 + 3 : y0 + 2;
  g.rect([x0, y0, x1, capBot], pal);
  if (st === 'curly') {
    for (let x = x0; x <= x1; x += 2) g.put(x, y0 - 1, pal[0]);
  }
  if (st === 'topknot') {
    g.rect([x0 + 4, y0 - 3, x1 - 4, y0 - 1], pal);
  }

  // 옆머리
  const sideBot = st === 'bob' ? y1 - 1 : st === 'long' ? y1 + 1 : st === 'braid' ? y0 + 5 : y0 + 4;
  g.rect([x0, y0, x0, sideBot], pal, { top: false });
  g.rect([x1, y0, x1, sideBot], pal, { top: false });

  // 앞머리 술 (정면·측면만 — 뒤통수는 통짜)
  if (p.dir === 'up') {
    g.rect([x0, y0, x1, y1 - 2], pal);
    g.clear(x0, y0); g.clear(x1, y0);
  } else {
    const fringe = st === 'bob' || st === 'long';
    if (fringe) {
      g.rect([x0 + 1, capBot + 1, x0 + 2, capBot + 1], pal, { top: false });
      g.rect([x1 - 2, capBot + 1, x1 - 1, capBot + 1], pal, { top: false });
    }
  }
}

function L_hat(g: Grid, p: Pose, cfg: CharConfig): void {
  const k = cfg.outfit.hat;
  if (k === 'none') return;
  const pal = ramp(cfg.outfit.hatColor);
  const [x0, y0, x1] = p.head;
  if (k === 'cap' || k === 'visor') {
    if (k === 'cap') g.rect([x0, y0 - 1, x1, y0 + 2], pal);
    else g.rect([x0, y0 + 1, x1, y0 + 2], pal);
    if (p.dir === 'down') g.rect([x0, y0 + 3, x1, y0 + 3], pal, { top: false });
    else if (p.side) {
      const bx = p.face > 0 ? x1 + 1 : x0 - 3;
      g.rect([bx, y0 + 2, bx + 2, y0 + 2], pal, { top: false });
    }
  } else if (k === 'beanie') {
    g.rect([x0, y0 - 2, x1, y0 + 2], pal);
    g.rect([x0, y0 + 2, x1, y0 + 3], ramp(mix(cfg.outfit.hatColor, 0xffffff, 0.2)), { top: false });
  } else if (k === 'sun') {
    g.rect([x0, y0 - 1, x1, y0 + 1], pal);
    g.rect([x0 - 3, y0 + 2, x1 + 3, y0 + 2], pal, { top: false });
  } else if (k === 'bandana') {
    g.rect([x0, y0 + 1, x1, y0 + 2], pal, { top: false });
    if (!p.side) { g.put(x0 + 2, y0 + 1, pal[0]); g.put(x1 - 2, y0 + 2, pal[0]); }
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

function L_edges(g: Grid, p: Pose, _cfg: CharConfig): void {
  if (p.side) {
    // 측면: 보이는 팔의 앞 가장자리
    shadeCol(g, p.face > 0 ? p.armA[0] - 1 : p.armA[2] + 1, p.armA[1], p.armA[3]);
    // 측면: 뒷다리를 한 톤 죽여 앞뒤를 가른다
    const back = p.lifted === 'B' ? p.legA : p.legB;
    for (let x = back[0]; x <= back[2]; x++) shadeCol(g, x, back[1], back[3], 0.22);
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
  L_shoes, L_gloves, L_edges, L_pack, L_face, L_hairFront, L_hat, L_held,
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
    l.sex, l.skin, l.hair, l.hairStyle, l.eye, l.mouth, l.blush ? 1 : 0, l.brow, l.beard,
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
