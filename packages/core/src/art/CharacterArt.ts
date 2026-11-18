/**
 * @file CharacterArt.ts
 * @description 필드 캐릭터 아트 (138차 바닐라 베이스 → **329차 도트 방식**) — 순수 TS 픽셀 래스터라이저.
 *
 * ## 왜 코드가 도트를 소유하는가
 * 구 캐릭터는 외부 고해상 출력물을 런타임 축소해 썼다(260x467 → 52px). 그레인이 없어 지면(2px 도트)과 어긋났고
 * **장비 착용을 표현할 수 없었다**. 그래서 아트 격자를 코드가 소유한다(138차).
 *
 * ## 329차 — 도트 방식 (사용자 확정 2026-11-18 「도트품질 방향은 맞아」)
 * 138~142차 그림은 살 2단 · 한 덩어리 눈 · 온몸을 두른 중간 톤 테두리 · 좌우 대칭이라 밋밋했고, 옆모습이 특히 약했다
 * (사용자 「옆 모습이 너무 마음에 안들어」). 사용자가 보낸 참고 도트의 「찍는 방식」을 읽어 규칙으로 옮겼다 — 아래 「도트 방식」 절.
 *  - 셀 **32 x 32 아트 px** · 키 26줄(머리끝 y=3 ~ 발바닥 y=28) · 게임 표시는 **정수 x2**(그레인 2px) — 138차 그대로.
 *  - 머리 **14 x 12칸**(정수리 ~ 턱 · 키의 46%) + 목 1 + 몸 13줄. 정수리는 6 → 10 → 12 → 14칸으로 둥글게 넓어진다.
 *    (사용자 「얼굴이 너무 커 … 조금 축소」 · 「정수리쪽이 동그랗잖아」 — 18 x 14칸 시안에서 줄였다.)
 *  - 방향 넷 = 정면(아래) · **30도 돌린 얼굴**(왼쪽 — 오른쪽은 좌우 뒤집기) · 뒤. 옆얼굴(프로필)은 쓰지 않는다.
 *
 * ## 레이어 (아래 → 위)
 *   몸 무리(맨몸 → 속옷 → 하의 → 신발 → 상의 → 겉옷 → 장갑 → 가방) → 머리 무리(두개골 → 얼굴 → 머리카락 → 모자) → 든 것
 * 무리마다 바깥 테두리를 두르고 차례로 얹는다(`compose`). 새 장비 = 그리기 한 갈래 또는 글자 지도 한 벌.
 *
 * ## 바닐라 규약 (사용자 지시 2026-09-16)
 * 베이스는 **나체 + 언더웨어**(여성은 상의 속옷 포함)다. 상의/하의/신발은 전부 **장착 아이템**이다.
 *
 * ⚠ core 규칙 — Phaser/DOM 금지. 여기는 **RGBA 버퍼만** 만든다. 텍스처 굽기는 client `ui/CharacterSprite.ts`.
 * ⚠ 좌표 계약(client가 쓴다): 손 = 셀 21행 · 입 = 셀 13행 · 앉기 자르기 = 셀 22행 위(옷단까지).
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
export type HeldKind = 'none' | 'rod' | 'net' | 'crate' | 'gaff' | 'can';

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
  /**
   * 288차 — 주인공 나이(만 나이 · 살). 정본 = 22세(`PLAYER_CANON_AGE` — `.agents/PLAYER_SCENARIO.md` §0 「한여름(22)」 ·
   * 이야기 본문 「내가 스물둘이라는 게」). 사용자 지시 「캐릭터 나이를 구체적으로 추가 지정하자 … 그 이후 생성 시 나이 커스터마이징」 —
   * 지금은 캐릭터 만들기에서 정하지 않고 정본 값으로 둔다. 없으면(구세이브 · 인물 그림) `playerAgeOf`가 정본 값을 돌려준다.
   * 나이에 따른 얼굴(흰머리 · 수염 · 주름) · 호칭은 이 값을 읽는다(다음 차수).
   */
  age?: number;
}

/** 288차 — 주인공 정본 나이(살) */
export const PLAYER_CANON_AGE = 22;

/** 288차 — 주인공 나이(없으면 정본 22세) */
export function playerAgeOf(cfg: Pick<CharConfig, 'age'> | undefined | null): number {
  const a = cfg?.age;
  return typeof a === 'number' && Number.isFinite(a) && a > 0 ? Math.round(a) : PLAYER_CANON_AGE;
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

/** 캐릭터 생성 직후 입고 있는 기본 한 벌 — 상의·하의만 (188차 사용자 결정: 그 외 지급품 없음) */
export function starterOutfit(sex: CharSex = 'm'): CharOutfit {
  return {
    ...bareOutfit(),
    shirt: 'tee', shirtColor: sex === 'f' ? 0xd1a72f : 0xe8e2d4,
    pants: 'jeans', pantsColor: 0x3d5a80,
  };
}


// ─────────────────────────────────────────────────────────────
// 329차 — 도트 방식 (사용자 확정 2026-11-18 「도트품질 방향은 맞아」)
// ─────────────────────────────────────────────────────────────
//
// 참고 도트에서 읽어 낸 「찍는 방식」을 규칙으로 옮겼다.
//  ① 살은 5단(a 밝음 → b → c 분홍 그늘 → d 앞머리 밑 → e 턱 밑) — 그늘이 회색이 아니라 붉은 쪽으로 물든다
//  ② 눈은 두 줄 — 윗줄 [회백 · 검정 · 짙은 눈동자색] / 아랫줄 [흰 · 짙은 회남 · 눈동자색] · 반짝임은 두 눈 모두 같은 쪽
//  ③ 얼굴에는 테두리가 없다 — 머리카락과 그늘이 윤곽을 만든다(테두리는 옷 바깥 · 살 옆은 짙은 장밋빛)
//  ④ 머리카락은 거의 한 색 — 앞머리 사이로 그늘진 이마가 비쳐 가닥이 된다 · 윤기는 몇 칸
//  ⑤ 좌우가 같지 않다(빛이 왼쪽 위 — 오른쪽 볼 · 턱이 한 단 어둡다)
//  ⑥ 왼쪽 · 오른쪽 방향은 옆얼굴이 아니라 30도쯤 돌린 얼굴(먼 눈 두 칸 · 가까운 눈 세 칸 · 가까운 쪽 귀)
//
// 머리 · 머리카락 · 모자는 **글자 지도**(한 글자 = 한 칸)로 손으로 찍고, 몸 · 옷은 정해진 뼈대 위에 식으로 그린다.
// 좌표는 모두 「머리 상자」 기준이다 — 상자 (0,0) = 칸 (BX, BY) · 상자 14칸 × 26줄:
//   줄 0~11 머리(정수리 ~ 턱) · 12 목 · 13~18 윗몸(18 = 옷단 · 손) · 19~24 골반 · 다리 · 25 발
//
// ⚠ 글자 지도의 한 줄은 폭이 모두 같아야 한다(`CharacterArt329.test.ts`가 본다).

/** 머리 상자의 칸 안 자리 */
const BX = 9;
const BY = CHAR_HEAD_TOP;
const INK = 0x05060c;

type View = 'front' | 'turn' | 'back';
const M_SKIN = 1;
const M_HAIR = 2;
const M_CLOTH = 3;

class Layer {
  readonly px = new Int32Array(CHAR_CELL * CHAR_CELL).fill(-1);
  readonly mk = new Uint8Array(CHAR_CELL * CHAR_CELL);
  /** 세로 밀기 — 걷기 통과 프레임에서 윗몸이 한 칸 들썩인다 */
  oy = 0;

  put(bx: number, by: number, c: Rgb, m: number): void {
    const x = BX + bx, y = BY + by + this.oy;
    if (x < 0 || y < 0 || x >= CHAR_CELL || y >= CHAR_CELL) return;
    this.px[y * CHAR_CELL + x] = c;
    this.mk[y * CHAR_CELL + x] = m;
  }

  get(bx: number, by: number): number {
    const x = BX + bx, y = BY + by + this.oy;
    if (x < 0 || y < 0 || x >= CHAR_CELL || y >= CHAR_CELL) return -1;
    return this.px[y * CHAR_CELL + x];
  }

  clear(bx: number, by: number): void {
    const x = BX + bx, y = BY + by + this.oy;
    if (x < 0 || y < 0 || x >= CHAR_CELL || y >= CHAR_CELL) return;
    this.px[y * CHAR_CELL + x] = -1;
    this.mk[y * CHAR_CELL + x] = 0;
  }

  row(by: number, x0: number, x1: number, c: Rgb, m: number): void {
    for (let x = x0; x <= x1; x++) this.put(x, by, c, m);
  }

  rect(x0: number, y0: number, x1: number, y1: number, c: Rgb, m: number): void {
    for (let y = y0; y <= y1; y++) this.row(y, x0, x1, c, m);
  }
}

function luma(c: Rgb): number {
  return (((c >> 16) & 255) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000;
}
function scaleRgb(c: Rgb, kr: number, kg: number, kb: number): Rgb {
  return (Math.round(((c >> 16) & 255) * kr) << 16) | (Math.round(((c >> 8) & 255) * kg) << 8) | Math.round((c & 255) * kb);
}
function pickOf<T>(arr: readonly T[], i: number): T {
  return arr[Math.max(0, Math.min(arr.length - 1, i | 0))];
}

/** 살 5단 + 볼 · 입 · 테두리 — 기본색 하나에서 만든다(그늘은 붉은 쪽으로 물든다) */
interface SkinPal { a: Rgb; b: Rgb; c: Rgb; d: Rgb; e: Rgb; blush: Rgb; lip: Rgb; lipS: Rgb; ink: Rgb; inkIn: Rgb }
function skinPal(look: CharAppearance): SkinPal {
  const t = pickOf(SKIN_TONES, look.skin);
  const deep = scaleRgb(t, 0.78, 0.55, 0.52);
  const ink = scaleRgb(t, 0.70, 0.50, 0.50);
  return {
    a: t, b: mix(t, deep, 0.18), c: mix(t, deep, 0.38), d: mix(t, deep, 0.62), e: mix(t, deep, 0.9),
    blush: mix(t, 0xe4849a, 0.30), lip: mix(t, 0xe2505e, 0.45), lipS: mix(t, 0xb8504a, 0.50),
    ink, inkIn: mix(ink, INK, 0.45),
  };
}

/** 머리카락 4단 — 짙은 머리는 더 짙게 눌러 윤곽 구실을 하게 하고, 밝은 머리는 가장자리에 한 단 어두운 테를 두른다 */
interface HairPal { K: Rgb; k: Rgb; h: Rgb; j: Rgb; rim: Rgb | null }
function hairPalOf(base0: Rgb): HairPal {
  const dark = luma(base0) < 70;
  const base = dark ? mix(base0, 0x07070c, 0.62) : base0;
  return {
    K: base,
    k: mix(base, dark ? 0x9a9ab8 : 0xfff4dc, dark ? 0.12 : 0.20),
    h: mix(base, dark ? 0x9a9ab8 : 0xfffbe8, dark ? 0.24 : 0.42),
    j: mix(base, dark ? 0x020204 : 0x35243f, dark ? 0.5 : 0.34),
    rim: dark ? null : mix(base, 0x2a1c33, 0.50),
  };
}
function hairPal(idx: number): HairPal {
  return hairPalOf(pickOf(HAIR_COLORS, idx));
}

/** 옷 3단 */
interface ClothPal { L: Rgb; N: Rgb; D: Rgb }
function clothPal(c: Rgb): ClothPal {
  return { L: mix(c, 0xffffff, 0.16), N: c, D: mix(c, 0x0b0d1e, 0.34) };
}

// ── 글자 지도 ────────────────────────────────────────────────
// 머리카락: K 기본 · k 은은한 윤기 · h 윤기 · j 가장 짙음 · u 짧게 깎은 머리(살이 비친다)
// 살(머리카락이 드리운 그늘): a b c d e
// 모자: H 기본 · L 밝음 · D 어두움

interface DotMap { dx?: number; dy?: number; rows: readonly string[] }
type ViewMaps = Record<View, DotMap>;

/** 둥근 정수리 — 6 → 10 → 12 → 14칸으로 넓어진다(사용자 지시 「정수리쪽이 동그랗」) */
const CROWN = ['....KKKKKK....', '..KKKkhKKKKK..', '.KKkhKKKKKKKK.', 'KKkKKKKKKKKKKK'] as const;
const CURL_TOP = ['....KK.KK.KK....', '...KkKKhKKKkKK..', '..KKKKkKKKKKKkK.', '.KkKKKKKKhKKKKKK', 'KKKKhKKKKKKKKkKK', 'KKKKKKKKKKKKKKKK'] as const;
const BUN = ['.....KkKK.....', '....KkhKKK....', '.....KKKK.....'] as const;

const HAIR_MAPS: Record<HairStyle, ViewMaps> = {
  short: {
    front: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKKdKKKKdKKK', 'KKdcdKddKKddKK'] },
    turn: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKdKKKdKKKKKKK', 'KKKddKKdKKKKKK', '..........K..K', '..........K..K', '............KK', '............K.'] },
    back: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKkKKKKKKkKKK', 'KKKkKKKkKKkKKK', '.KKKKKKkKKKKK.', '..KKjKKKKjKK..', '...KKKKKKKK...', '....jKKKKj....'] },
  },
  bob: {
    front: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKKKKKKKKKKK', 'KKKdKKKdKKdKKK', 'KK..........KK', 'KK..........KK', 'KK..........KK', 'KKK........KKK', '.KK........KK.'] },
    turn: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKKKKKKKKKKK', 'KKdKKKdKKKKKKK', 'KK........KKKK', 'KK........KKKK', 'KK........KKKK', 'KK........KKKK', '.K.......KKKK.'] },
    back: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKkKKKKKKkKKK', 'KKKkKKKkKKkKKK', 'KKKkKKKkKKkKKK', 'KKKKKKKkKKKKKK', 'KKjKKKKKKKKjKK', 'KKjKKkKKkKKjKK', '.KKKKkKKkKKKK.', '..KKKKKKKKKK..'] },
  },
  pony: {
    front: { rows: ['....KKKKKK......', '..KKKkhKKKKK....', '.KKkhKKKKKKKKjK.', 'KKkKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKkK', 'KKKKKdKKKKdKKKKK', 'KKdcdKddKKddKKKK', '..............KK', '..............Kk', '..............K.'] },
    turn: { rows: ['....KKKKKK.......', '..KKKkhKKKKK.....', '.KKkhKKKKKKKKjK..', 'KKkKKKKKKKKKKKKK.', 'KKKKKKKKKKKKKKKKK', 'KKdKKKdKKKKKKKKkK', 'KKKddKKdKKKKKKKKK', '..........K..K.KK', '..........K..K.Kk', '............KK.KK', '............K...K'] },
    back: { rows: [...CROWN.slice(0, 3), 'KKkKKKjjKKKKKK', 'KKKKKjkKjKKKKK', 'KKKkKjKKjKkKKK', 'KKKkKjkKjKkKKK', '.KKKKjKKjKKKK.', '..KKjjkKjjKK..', '...KKjKKjKK...', '....jjkKjj....', '.....jKKj.....', '......kK......', '......KK......'] },
  },
  long: {
    front: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKKKKKcKKKKK', 'KKdddKddKKddKK', 'KK..........KK', 'KK..........KK', 'KK..........KK', 'KKK........KKK', 'KKKK......KKKK', 'KKKKKK..KKKKKK', 'KKK........KKK', 'KKK........KKK', 'KKk........kKK', '.KK........KK.', '.K..........K.'] },
    turn: { rows: [...CROWN, 'KKKKKKaKKKKKKK', 'KKdKKKcdKKKKKK', 'KKKdddKKdKKKKK', 'KK.......KK..K', 'KK........K..K', 'KK........K.KK', 'KK........KKKK', 'KKK.....KKKKKK', 'KKKKKK..KKKKKK', 'KKK........KKK', 'KKK........KKK', 'KKk.......KKKK', '.KK.......KKK.', '.K.........KK.'] },
    back: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKkKKKKKKkKKK', 'KKKkKKKkKKkKKK', 'KKKkKKKkKKkKKK', 'KKKKKKKkKKKKKK', 'KKjKKKKKKKKjKK', 'KKjKKkKKKKKjKK', 'KKKKKkKKkKKKKK', 'KKKKKkKKkKKKKK', '.KKKKKKKKKKKK.', '.KKKkKKKKkKKK.', '..KKkKKKKkKK..', '..KKKKKKKKKK..', '...KKkKKkKK...', '....KKKKKK....'] },
  },
  buzz: {
    front: { rows: ['..............', '....uuuuuu....', '...uuuuuuuu...', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '..u........u..'] },
    turn: { rows: ['..............', '....uuuuuu....', '...uuuuuuuu...', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '..u.....uuuu..', '.........uuu..'] },
    back: { rows: ['..............', '....uuuuuu....', '...uuuuuuuu...', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '..uuuuuuuuuu..', '...uuuuuuuu...', '....uuuuuu....'] },
  },
  curly: {
    front: { dx: -1, dy: -1, rows: [...CURL_TOP, 'KkKKKKdKKKdKKKkK', 'KKKdcdKddKKddKKK', 'KK............KK', '.K............K.'] },
    turn: { dx: -1, dy: -1, rows: [...CURL_TOP, 'KkKdKKKdKKKKKKkK', 'KKKKddKKdKKKKKKK', 'KK.........K..KK', '.K.........K..KK', '.............KKK', '.............KK.'] },
    back: { dx: -1, dy: -1, rows: [...CURL_TOP, 'KkKKKkKKKKKhKKkK', 'KKKKKKKKhKKKKKKK', 'KKkKKKKKKKKKkKKK', '.KKKKhKKKKKKKKK.', '..KKKKKKKkKKKK..', '...KKjKKKKjKK...', '.....KKKKKK.....'] },
  },
  braid: {
    front: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKKKddKKKKKK', 'KKKdddccdddKKK', 'KK..........KK', 'KK..........KK', '.KK........KK.', '.Kk........kK.', '.kK........Kk.', '.Kk........kK.', '.kK........Kk.', '.Kk........kK.', '.jj........jj.', '.K..........K.'] },
    turn: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKKddKKKKKKKK', 'KKdddddKdKKKKK', 'KK.......KK..K', 'KK........K..K', '.KK.......K.KK', '.Kk.......KKK.', '.kK........kK.', '.Kk........Kk.', '.kK........kK.', '.Kk........Kk.', '.jj........jj.', '.K..........K.'] },
    back: { rows: [...CROWN, 'KKKKKKKKKKKKKK', 'KKKkKKjjKKkKKK', 'KKKkKKjjKKkKKK', '.KKKKKjjKKKKK.', '..KKKKKKKKKK..', '...KkK..KkK...', '...kK....Kk...', '...Kk....kK...', '...kK....Kk...', '...Kk....kK...', '...jj....jj...', '...K......K...'] },
  },
  topknot: {
    front: { dy: -3, rows: [...BUN, ...CROWN, 'KKKKddddddKKKK', 'KK..........KK', 'K............K'] },
    turn: { dy: -3, rows: [...BUN, ...CROWN, 'KKKddddddKKKKK', 'KK.......KKKKK', 'K.........KKKK', '..........K..K', '.............K', '............KK'] },
    back: { dy: -3, rows: [...BUN, ...CROWN, 'KKKKKKKKKKKKKK', 'KKKkKKKKKKkKKK', '.KKkKKKkKKkKK.', '..KKKKKkKKKK..', '...KKjKKjKK...'] },
  },
};

/** 정수리를 덮는 모자 — 쓰기 전에 머리 6줄(정수리 ~ 앞머리)을 지운다 */
const CROWN_HATS: ReadonlySet<HatKind> = new Set<HatKind>(['cap', 'beanie', 'sun']);
const HAT_DOME = ['....HHHHHH....', '..HHLLHHHHHH..', '.HHLHHHHHHHHH.', 'HHLHHHHHHHHHHD', 'HHHHHHHHHHHHDD'] as const;
const HAT_MAPS: Record<Exclude<HatKind, 'none'>, ViewMaps> = {
  cap: {
    front: { rows: [...HAT_DOME, 'DLLLLLLLLLLLLD', '.DDDDDDDDDDDD.'] },
    turn: { dx: -3, rows: [...HAT_DOME.map((r) => `...${r}`), 'DLLLLLLLLLDHHHHDD', '.DDDDDDDD........'] },
    back: { rows: [...HAT_DOME, 'HHHHHHHHHHHHHD', '..DDDD..DDDD..'] },
  },
  beanie: {
    front: { rows: [...HAT_DOME, 'LLLLLLLLLLLLLL', 'LDLDLDLDLDLDLD'] },
    turn: { rows: [...HAT_DOME, 'LLLLLLLLLLLLLL', 'LDLDLDLDLDLDLD'] },
    back: { rows: [...HAT_DOME, 'LLLLLLLLLLLLLL', 'LDLDLDLDLDLDLD'] },
  },
  sun: {
    front: { dx: -2, rows: ['......HHHHHH......', '....HHLLHHHHHH....', '....HLHHHHHHHD....', '...HHLHHHHHHHHD...', '...DDDDDDDDDDDD...', 'HHLLLLHHHHHHHHHHHD', '.DDDDDDDDDDDDDDDD.'] },
    turn: { dx: -2, rows: ['......HHHHHH......', '....HHLLHHHHHH....', '....HLHHHHHHHD....', '...HHLHHHHHHHHD...', '...DDDDDDDDDDDD...', 'HLLLLLHHHHHHHHHHHD', '.DDDDDDDDDDDDDDDD.'] },
    back: { dx: -2, rows: ['......HHHHHH......', '....HHLLHHHHHH....', '....HLHHHHHHHD....', '...HHLHHHHHHHHD...', '...DDDDDDDDDDDD...', 'HHLLHHHHHHHHHHHHHD', '.DDDDDDDDDDDDDDDD.'] },
  },
  bandana: {
    front: { dy: 4, rows: ['HLLHHHHHHHHHHD', 'HHHHHHHHHHHHDD'] },
    turn: { dy: 4, rows: ['HLLHHHHHHHHHHD..', 'HHHHHHHHHHHHDDHD', '..............DH', '..............D.'] },
    back: { dy: 4, rows: ['HLLHHHHHHHHHHD', 'HHHHHHDDHHHHDD', '.....HD.DH....', '.....D...D....'] },
  },
  visor: {
    front: { dy: 4, rows: ['HHLLHHHHHHHHHD', 'DLLLLLLLLLLLLD', '.DDDDDDDDDDDD.'] },
    turn: { dx: -3, dy: 4, rows: ['...HHLLHHHHHHHHHD', 'DLLLLLLLLLDDDDDDD', '.DDDDDDDD........'] },
    back: { dy: 4, rows: ['HHHHHHHHHHHHHD', '..DDDDDDDDDD..'] },
  },
};

/** 글자 지도 한 장을 찍는다 — `pal`에 없는 글자는 건너뛴다 */
function stamp(g: Layer, m: DotMap, pal: Record<string, Rgb>, matOf: (ch: string) => number): void {
  const dx = m.dx ?? 0, dy = m.dy ?? 0;
  for (let r = 0; r < m.rows.length; r++) {
    const row = m.rows[r];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = pal[ch];
      if (c === undefined) continue;
      g.put(dx + x, dy + r, c, matOf(ch));
    }
  }
}

// ── 머리 · 얼굴 ──────────────────────────────────────────────

/** 턱선(줄 10 · 11이 차지하는 열 범위) — 얼굴형은 여기서 읽힌다 */
const JAW: Record<View, Record<FaceShape, readonly [number, number, number, number]>> = {
  front: { oval: [3, 10, 4, 9], round: [2, 11, 4, 9], square: [2, 11, 3, 10] },
  turn: { oval: [2, 9, 3, 7], round: [2, 10, 3, 8], square: [2, 10, 2, 8] },
  back: { oval: [3, 10, 4, 9], round: [2, 11, 4, 9], square: [2, 11, 3, 10] },
};

/** 민머리 두개골(살) — 머리카락 · 모자는 이 위에 얹힌다 */
function drawSkull(g: Layer, view: View, look: CharAppearance, s: SkinPal): void {
  g.row(1, 4, 9, s.a, M_SKIN);
  g.row(2, 3, 10, s.a, M_SKIN);
  for (let y = 3; y <= 9; y++) g.row(y, 2, 11, s.a, M_SKIN);
  const [l10, r10, l11, r11] = JAW[view][look.faceShape ?? 'oval'];
  g.row(10, l10, r10, s.a, M_SKIN);
  g.row(11, l11, r11, s.a, M_SKIN);
  if (view === 'back') {
    // 뒤통수 — 귀는 한 칸 · 아래는 목덜미로 좁아진다
    g.put(1, 8, s.c, M_SKIN); g.put(12, 8, s.c, M_SKIN);
    g.clear(2, 9); g.clear(11, 9);
    for (let x = 0; x <= 13; x++) { if (x < 4 || x > 9) g.clear(x, 10); if (x < 5 || x > 8) g.clear(x, 11); }
    g.row(10, 4, 9, s.b, M_SKIN); g.row(11, 5, 8, s.c, M_SKIN);
    return;
  }
  if (view === 'front') {
    // 빛은 왼쪽 위 — 오른쪽 볼 · 턱이 한 단 어둡다
    for (const y of [8, 9]) g.put(11, y, s.b, M_SKIN);
    g.put(r10, 10, s.b, M_SKIN);
    g.put(l11, 11, s.b, M_SKIN); g.put(r11, 11, s.c, M_SKIN);
    for (const y of [7, 8]) { g.put(1, y, s.c, M_SKIN); g.put(12, y, s.c, M_SKIN); }   // 귀
    return;
  }
  // 30도 돌린 얼굴 — 얼굴은 왼쪽 열 2~9 · 가까운 쪽(오른쪽) 귀
  g.put(2, 9, s.c, M_SKIN);
  g.put(r10 - 1, 10, s.b, M_SKIN); g.put(r10, 10, s.c, M_SKIN);
  g.put(l11, 11, s.b, M_SKIN);
  for (let x = r11 + 1; x <= 11; x++) g.clear(x, 11);
  g.put(11, 7, s.d, M_SKIN); g.put(12, 7, s.a, M_SKIN);
  g.put(11, 8, s.e, M_SKIN); g.put(12, 8, s.a, M_SKIN);
  g.put(11, 9, s.c, M_SKIN);
  g.clear(11, 10); g.clear(10, 10 + (r10 >= 10 ? 1 : 0));
}

function drawFace(g: Layer, view: View, look: CharAppearance, s: SkinPal): void {
  if (view === 'back') return;
  const eyeC = pickOf(EYE_COLORS, look.eye);
  const iris = mix(eyeC, 0xffffff, 0.14), irisTop = mix(eyeC, 0x0a0a12, 0.42);
  const pupilTop = 0x0d0d14, pupilBot = mix(eyeC, 0x16161f, 0.72), whiteTop = 0xd5d8df, white = 0xf7f8fc;
  const hp = hairPal(look.hair);
  const bare = look.hairStyle === 'buzz' || look.hairStyle === 'topknot';
  const browC = mix(hp.K, s.d, 0.25);
  /** 눈 — 왼쪽 칸부터 [흰 · 검정 · 눈동자]. `w` = 폭(먼 눈은 2칸) */
  const eye = (x: number, w: 2 | 3): void => {
    g.put(x, 7, whiteTop, M_SKIN); g.put(x + 1, 7, pupilTop, M_SKIN);
    g.put(x, 8, white, M_SKIN); g.put(x + 1, 8, pupilBot, M_SKIN);
    if (w === 3) { g.put(x + 2, 7, irisTop, M_SKIN); g.put(x + 2, 8, iris, M_SKIN); }
  };
  const [l10, r10, l11, r11] = JAW[view][look.faceShape ?? 'oval'];
  if (view === 'front') {
    eye(3, 3); eye(8, 3);
    if (look.sex === 'f') { g.put(2, 7, pupilTop, M_SKIN); g.put(11, 7, pupilTop, M_SKIN); }     // 속눈썹 — 눈꼬리 한 칸
    if (bare && look.brow > 0.3) { g.row(6, 3, 4, browC, M_SKIN); g.row(6, 9, 10, browC, M_SKIN); }
    if (look.blush) { g.put(3, 9, s.blush, M_SKIN); g.put(10, 9, s.blush, M_SKIN); }
    const mouth = (): void => {
      if (look.mouth === 'open') { g.put(6, 10, 0x7a3038, M_SKIN); g.put(7, 10, 0x7a3038, M_SKIN); }
      else if (look.mouth === 'small') g.put(7, 10, s.lip, M_SKIN);
      else if (look.mouth === 'neutral') { g.put(6, 10, s.lipS, M_SKIN); g.put(7, 10, s.lipS, M_SKIN); }
      else { g.put(6, 10, s.lip, M_SKIN); g.put(7, 10, s.lipS, M_SKIN); }
    };
    mouth();
    if (look.beard >= 0) {
      const bp = hairPal(look.beard);
      g.put(l10, 10, bp.K, M_SKIN); g.put(l10 + 1, 10, bp.K, M_SKIN); g.put(r10 - 1, 10, bp.K, M_SKIN); g.put(r10, 10, bp.K, M_SKIN);
      g.row(11, l11, r11, bp.K, M_SKIN); g.put(l11 + 1, 11, bp.k, M_SKIN);
      mouth();
    }
    return;
  }
  eye(2, 2); eye(6, 3);
  if (look.sex === 'f') g.put(9, 7, pupilTop, M_SKIN);
  if (bare && look.brow > 0.3) { g.row(6, 2, 3, browC, M_SKIN); g.row(6, 6, 7, browC, M_SKIN); }
  if (look.blush) g.put(9, 8, s.blush, M_SKIN);
  const mouth = (): void => {
    if (look.mouth === 'open') { g.put(4, 10, 0x7a3038, M_SKIN); g.put(5, 10, 0x7a3038, M_SKIN); }
    else if (look.mouth === 'small') g.put(4, 10, s.lip, M_SKIN);
    else if (look.mouth === 'neutral') { g.put(4, 10, s.lipS, M_SKIN); g.put(5, 10, s.lipS, M_SKIN); }
    else { g.put(4, 10, s.lip, M_SKIN); g.put(5, 10, s.lipS, M_SKIN); }
  };
  mouth();
  if (look.beard >= 0) {
    const bp = hairPal(look.beard);
    g.put(l10, 10, bp.K, M_SKIN); g.put(r10 - 1, 10, bp.K, M_SKIN); g.put(r10, 10, bp.K, M_SKIN);
    g.row(11, l11, r11, bp.K, M_SKIN);
    mouth();
  }
}

function drawHair(g: Layer, view: View, look: CharAppearance, s: SkinPal): void {
  const hp = hairPal(look.hair);
  const pal: Record<string, Rgb> = { K: hp.K, k: hp.k, h: hp.h, j: hp.j, u: mix(s.c, hp.K, 0.6), a: s.a, b: s.b, c: s.c, d: s.d, e: s.e };
  stamp(g, HAIR_MAPS[look.hairStyle] ? HAIR_MAPS[look.hairStyle][view] : HAIR_MAPS.short[view], pal,
    (ch) => (ch >= 'a' && ch <= 'e' ? M_SKIN : M_HAIR));
}

function drawHat(g: Layer, view: View, o: CharOutfit, s: SkinPal): void {
  if (o.hat === 'none') return;
  const cp = clothPal(o.hatColor);
  if (CROWN_HATS.has(o.hat)) {
    // 정수리 ~ 앞머리 줄을 통째로 비운다(부풀린 머리 · 상투가 모자 밖으로 삐져나오지 않게) — 옆머리는 남는다
    for (let y = -BY; y <= 5; y++) for (let x = -BX; x < CHAR_CELL - BX; x++) if (g.get(x, y) >= 0) g.clear(x, y);
    if (o.hat !== 'beanie' && view !== 'back') g.row(6, 2, view === 'turn' ? 9 : 11, s.d, M_SKIN);   // 챙 그늘이 이마에 진다
  }
  stamp(g, HAT_MAPS[o.hat][view], { H: cp.N, L: cp.L, D: cp.D }, () => M_CLOTH);
}

// ── 몸 · 옷 ──────────────────────────────────────────────────

interface BodyCtx { g: Layer; view: View; frame: CharFrame; cfg: CharConfig; s: SkinPal; liftL: boolean; liftR: boolean }

/** 다리 한 짝 — `x0`부터 `w`칸 · 줄 `y0`~`y1` · 왼쪽 밝음 / 오른쪽 그늘 */
function legCol(g: Layer, x0: number, w: number, y0: number, y1: number, l: Rgb, n: Rgb, d: Rgb, m: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let i = 0; i < w; i++) g.put(x0 + i, y, i === w - 1 ? d : i === 0 && w > 2 ? l : n, m);
  }
}

function drawLower(c: BodyCtx): void {
  const { g, s, cfg } = c;
  const o = cfg.outfit;
  const turn = c.view === 'turn';
  // 든 발은 한 칸 올라가고, 30도 방향에서는 가는 쪽(왼쪽)으로 한 칸 나간다
  const up = (left: boolean): number => ((left ? c.liftL : c.liftR) ? 1 : 0);
  const sx = (left: boolean): number => (turn && (left ? c.liftL : c.liftR) ? -1 : 0);

  // 골반 · 맨다리(2칸 + 사이 2칸)
  g.rect(4, 18, 9, 20, s.b, M_SKIN);
  for (const left of [true, false]) {
    const x0 = (left ? 4 : 8) + sx(left), u = up(left);
    legCol(g, x0, 2, 21, 24 - u, s.a, s.a, left ? s.b : s.c, M_SKIN);
    g.put(x0, 25 - u, s.b, M_SKIN); g.put(x0 + 1, 25 - u, s.c, M_SKIN);
  }
  // 속옷
  const brief = clothPal(cfg.look.sex === 'f' ? 0xd88aa0 : 0x5a6b8a);
  g.rect(4, 19, 9, 20, brief.N, M_CLOTH); g.row(20, 4, 9, brief.D, M_CLOTH);

  // 하의
  if (o.pants !== 'none') {
    const p = clothPal(o.pantsColor);
    if (o.pants === 'skirt') {
      g.row(18, 4, 9, p.N, M_CLOTH); g.row(19, 4, 9, p.N, M_CLOTH);
      for (const y of [20, 21]) for (let x = 3; x <= 10; x++) g.put(x, y, [p.N, p.L, p.D][(x + 1) % 3], M_CLOTH);
    } else {
      const bot = o.pants === 'shorts' ? 21 : 24;
      g.rect(4, 18, 9, 20, p.N, M_CLOTH); g.put(9, 19, p.D, M_CLOTH); g.put(9, 20, p.D, M_CLOTH);
      for (const left of [true, false]) {
        const x0 = (left ? 4 : 7) + sx(left), u = o.pants === 'shorts' ? 0 : up(left);
        legCol(g, x0, 3, 21, bot - u, left ? p.L : p.N, p.N, p.D, M_CLOTH);
      }
      if (o.pants === 'waders') {
        // 가슴장화 — 가슴받이 + 멜빵 + 한 몸인 장화
        g.rect(4, 15, 9, 18, p.N, M_CLOTH); g.row(15, 4, 9, p.L, M_CLOTH); g.rect(9, 16, 9, 18, p.D, M_CLOTH);
        for (const y of [13, 14]) { g.put(5, y, p.D, M_CLOTH); g.put(8, y, p.D, M_CLOTH); }
        for (const left of [true, false]) {
          const x0 = (left ? 4 : 7) + sx(left), u = up(left);
          legCol(g, x0, 3, 23, 24 - u, p.D, p.D, mix(p.D, INK, 0.3), M_CLOTH);
          g.row(25 - u, left ? x0 - 1 : x0, left ? x0 + 2 : x0 + 3, mix(p.D, INK, 0.3), M_CLOTH);
        }
      }
    }
  }

  // 신발
  if (o.shoes !== 'none' && o.pants !== 'waders') {
    const sh = clothPal(o.shoesColor);
    const wide = o.pants === 'jeans';
    const top = o.shoes === 'rubber' ? 21 : o.shoes === 'boots' ? 23 : 25;
    for (const left of [true, false]) {
      const x0 = (left ? 4 : wide ? 7 : 8) + sx(left), u = up(left), w = wide ? 3 : 2;
      if (top < 25) legCol(g, x0, w, top, 24 - u, left ? sh.L : sh.N, sh.N, sh.D, M_CLOTH);
      // 발 — 바깥쪽으로 한 칸 나온 코
      const fx0 = left ? x0 - 1 : x0, fx1 = left ? x0 + w - 1 : x0 + w;
      g.row(25 - u, fx0, fx1, sh.N, M_CLOTH);
      g.put(left ? fx0 : fx1, 25 - u, sh.L, M_CLOTH);
    }
  }
}

function drawUpper(c: BodyCtx): void {
  const { g, s, cfg, view } = c;
  const o = cfg.outfit;
  const front = view === 'front', back = view === 'back', turn = view === 'turn';
  // 팔 흔들기 — 든 발의 반대쪽 팔이 한 칸 올라간다
  const armUp = (left: boolean): number => ((left ? c.liftR : c.liftL) ? 1 : 0);
  /** 팔 한 짝(왼쪽 = 보는 쪽에서 왼쪽). 30도 방향의 먼 팔(왼쪽)은 한 칸 */
  const arm = (left: boolean, y0: number, y1: number, l: Rgb, n: Rgb, d: Rgb, m: number): void => {
    const u = armUp(left);
    for (let y = y0; y <= y1; y++) {
      if (left) { if (!turn) g.put(1, y - u, l, m); g.put(2, y - u, turn ? d : n, m); }
      else { g.put(11, y - u, n, m); g.put(12, y - u, d, m); }
    }
    // 어깨 — 팔 맨 윗줄 위에 안쪽 한 칸(둥근 어깨선)
    if (y0 === 14) { if (left) g.put(2, 13 - u, turn ? d : l, m); else g.put(11, 13 - u, n, m); }
  };

  // 목 · 맨몸
  g.put(6, 12, s.e, M_SKIN); g.put(7, 12, s.d, M_SKIN);
  g.rect(4, 13, 9, 18, s.a, M_SKIN);
  for (let y = 14; y <= 18; y++) g.put(9, y, s.b, M_SKIN);
  g.row(18, 4, 9, s.b, M_SKIN);
  arm(true, 14, 18, s.a, s.b, s.c, M_SKIN);
  arm(false, 14, 18, s.a, s.a, s.c, M_SKIN);
  if (cfg.look.sex === 'f') {
    const bra = clothPal(0xd88aa0);
    g.rect(4, 14, 9, 15, bra.N, M_CLOTH); g.row(15, 4, 9, bra.D, M_CLOTH);
  }

  // 상의
  if (o.shirt !== 'none') {
    const p = clothPal(o.shirtColor);
    g.rect(4, 13, 9, 18, p.N, M_CLOTH);
    g.put(4, 14, p.L, M_CLOTH); g.put(5, 14, p.L, M_CLOTH); g.put(4, 15, p.L, M_CLOTH);
    for (let y = 14; y <= 17; y++) g.put(9, y, p.D, M_CLOTH);
    g.row(18, 4, 9, p.D, M_CLOTH);
    const sleeve = o.shirt === 'tee' ? 15 : 17;
    arm(true, 14, sleeve, p.L, p.N, p.D, M_CLOTH);
    arm(false, 14, sleeve, p.N, p.N, p.D, M_CLOTH);
    if (!back) {
      // 목둘레
      if (o.shirt === 'tee') { g.put(6, 13, s.e, M_SKIN); g.put(7, 13, s.d, M_SKIN); }
      else if (o.shirt === 'shirt') {
        g.put(5, 13, p.L, M_CLOTH); g.put(8, 13, p.L, M_CLOTH); g.put(6, 13, s.e, M_SKIN); g.put(7, 13, s.d, M_SKIN);
        for (let y = 14; y <= 17; y++) g.put(turn ? 6 : 7, y, p.D, M_CLOTH);          // 여밈
        g.put(turn ? 5 : 6, 15, p.L, M_CLOTH); g.put(turn ? 5 : 6, 17, p.L, M_CLOTH);  // 단추
      } else if (o.shirt === 'hoodie') {
        g.put(5, 12, p.D, M_CLOTH); g.put(8, 12, p.D, M_CLOTH); g.row(13, 5, 8, p.L, M_CLOTH);
        g.put(6, 13, s.e, M_SKIN); g.put(7, 13, s.d, M_SKIN);
        g.put(6, 14, p.L, M_CLOTH); g.put(7, 14, p.L, M_CLOTH);                        // 끈
        g.row(17, 5, 8, p.D, M_CLOTH);                                                 // 주머니
      } else {
        g.put(6, 12, p.L, M_CLOTH); g.put(7, 12, p.N, M_CLOTH); g.row(13, 5, 8, p.L, M_CLOTH);   // 목까지 올라오는 니트
        for (let x = 4; x <= 9; x += 2) g.put(x, 18, p.N, M_CLOTH);                    // 골지 단
      }
    } else if (o.shirt === 'hoodie') {
      g.rect(5, 12, 8, 13, p.D, M_CLOTH); g.row(13, 5, 8, p.N, M_CLOTH);               // 등 뒤 후드
    } else if (o.shirt === 'knit') {
      g.put(6, 12, p.N, M_CLOTH); g.put(7, 12, p.D, M_CLOTH);
    }
  }

  // 겉옷
  if (o.outer !== 'none') {
    const p = clothPal(o.outerColor);
    if (o.outer === 'vest') {
      if (back) {
        g.rect(4, 13, 9, 17, p.N, M_CLOTH); g.row(15, 4, 9, p.L, M_CLOTH); for (let y = 13; y <= 17; y++) g.put(9, y, p.D, M_CLOTH);
      } else {
        for (let y = 13; y <= 17; y++) { g.put(4, y, p.L, M_CLOTH); g.put(5, y, p.N, M_CLOTH); g.put(8, y, p.N, M_CLOTH); g.put(9, y, p.D, M_CLOTH); }
        g.put(5, 16, p.D, M_CLOTH); g.put(8, 16, p.D, M_CLOTH);                        // 주머니
      }
    } else if (o.outer === 'apron') {
      if (back) {
        g.put(5, 13, p.D, M_CLOTH); g.put(8, 13, p.D, M_CLOTH); g.row(17, 4, 9, p.N, M_CLOTH); g.put(6, 17, p.D, M_CLOTH); g.put(7, 17, p.D, M_CLOTH);
      } else {
        g.put(5, 13, p.D, M_CLOTH); g.put(8, 13, p.D, M_CLOTH);
        g.rect(5, 14, 8, 18, p.N, M_CLOTH); g.row(14, 5, 8, p.L, M_CLOTH); for (let y = 15; y <= 18; y++) g.put(8, y, p.D, M_CLOTH);
        g.put(6, 16, p.D, M_CLOTH); g.put(7, 16, p.D, M_CLOTH);                        // 앞주머니
      }
    } else {
      // 재킷 — 긴 소매 · 앞섶은 열려 속옷(상의)이 두 칸 비친다
      if (back) g.rect(4, 13, 9, 18, p.N, M_CLOTH);
      else for (let y = 13; y <= 18; y++) { g.put(4, y, p.L, M_CLOTH); g.put(5, y, p.N, M_CLOTH); g.put(8, y, p.N, M_CLOTH); g.put(9, y, p.D, M_CLOTH); }
      if (back) for (let y = 14; y <= 17; y++) g.put(9, y, p.D, M_CLOTH);
      g.row(18, 4, 9, p.D, M_CLOTH);
      if (!back) { g.put(5, 13, p.L, M_CLOTH); g.put(8, 13, p.L, M_CLOTH); g.put(6, 18, p.D, M_CLOTH); g.put(7, 18, p.D, M_CLOTH); }
      arm(true, 14, 17, p.L, p.N, p.D, M_CLOTH);
      arm(false, 14, 17, p.N, p.N, p.D, M_CLOTH);
    }
  }
  // 앞치마 아랫자락(골반을 덮는다) — 윗몸이 들썩여도 아랫몸과 이어지게 여기서 함께 그린다
  if (o.outer === 'apron' && !back) {
    const p = clothPal(o.outerColor);
    g.rect(4, 19, 9, 21, p.N, M_CLOTH); for (let y = 19; y <= 21; y++) g.put(9, y, p.D, M_CLOTH); g.row(21, 4, 9, p.D, M_CLOTH);
  }

  // 장갑
  if (o.gloves) {
    const p = clothPal(o.glovesColor);
    arm(true, 18, 18, p.L, p.N, p.D, M_CLOTH);
    arm(false, 18, 18, p.N, p.N, p.D, M_CLOTH);
  }

  // 가방
  if (o.pack) {
    const p = clothPal(o.packColor);
    if (back) {
      g.rect(4, 14, 9, 18, p.N, M_CLOTH); g.row(14, 4, 9, p.L, M_CLOTH); g.row(18, 4, 9, p.D, M_CLOTH);
      for (let y = 15; y <= 17; y++) g.put(9, y, p.D, M_CLOTH);
      g.row(16, 5, 8, p.D, M_CLOTH); g.put(6, 13, p.D, M_CLOTH); g.put(7, 13, p.D, M_CLOTH);
    } else {
      for (let y = 13; y <= 16; y++) { g.put(4, y, p.D, M_CLOTH); g.put(9, y, p.D, M_CLOTH); }
      if (turn) for (let y = 14; y <= 17; y++) g.put(10, y, y === 14 ? p.L : p.N, M_CLOTH);       // 등 쪽으로 불룩
    }
  }
  void front;
}

function drawHeld(g: Layer, view: View, frame: CharFrame, cfg: CharConfig): void {
  const k = cfg.outfit.held;
  if (k === 'none') return;
  const wood = clothPal(0x8a6340);
  const tip = 0xf0e3c8;
  // 손 — 정면 · 뒤는 오른손(보는 쪽 오른쪽), 30도 방향은 가는 쪽(왼쪽) 손
  const d = view === 'turn' ? -1 : 1;
  const ax = view === 'turn' ? 1 : 13;
  const ay = 18 - (view === 'turn' ? (frame === 1 ? 1 : 0) : (frame === 1 ? 1 : 0));
  if (k === 'rod' || k === 'gaff') {
    const len = k === 'rod' ? 17 : 11;
    for (let i = 0; i < len; i++) {
      const x = ax + d * Math.floor(i / 3), y = ay + 2 - i;
      g.put(x, y, i >= len - 4 ? tip : i % 5 === 3 ? wood.D : wood.N, M_CLOTH);
    }
    if (k === 'gaff') { const hx = ax + d * Math.floor((len - 1) / 3), hy = ay + 2 - (len - 1); g.put(hx + d, hy, 0xb9bcc0, M_CLOTH); g.put(hx + d, hy + 1, 0xb9bcc0, M_CLOTH); }
  } else if (k === 'net') {
    for (let i = 0; i < 9; i++) g.put(ax, ay + 2 - i, wood.N, M_CLOTH);
    const mesh = clothPal(0x9a9ea6);
    for (let y = ay - 11; y <= ay - 7; y++) for (let x = ax - 2; x <= ax + 2; x++) {
      const edge = y === ay - 11 || y === ay - 7 || x === ax - 2 || x === ax + 2;
      if (edge || (x + y) % 2 === 0) g.put(x, y, edge ? mesh.D : mesh.L, M_CLOTH);
    }
  } else if (k === 'can') {
    const tin = clothPal(0x4f9a5a);
    const x0 = Math.min(ax, ax + d * 3), x1 = Math.max(ax, ax + d * 3);
    g.rect(x0, ay + 1, x1, ay + 3, tin.N, M_CLOTH); g.row(ay + 1, x0, x1, tin.L, M_CLOTH); g.row(ay + 3, x0, x1, tin.D, M_CLOTH);
    g.put(ax + d, ay, tin.D, M_CLOTH); g.put(ax + d * 2, ay, tin.D, M_CLOTH);
    g.put(ax + d * 4, ay + 1, tin.N, M_CLOTH); g.put(ax + d * 5, ay, tin.N, M_CLOTH); g.put(ax + d * 6, ay - 1, 0xcfe8f5, M_CLOTH);
  } else if (k === 'crate' && view !== 'back') {
    const box = clothPal(0x8a6340);
    g.rect(3, 15, 10, 18, box.N, M_CLOTH); g.row(15, 3, 10, box.L, M_CLOTH); g.row(18, 3, 10, box.D, M_CLOTH);
    g.row(16, 3, 10, clothPal(0x5e4228).N, M_CLOTH);
    for (const y of [16, 17]) g.put(10, y, box.D, M_CLOTH);
  }
}

// ── 조립 ─────────────────────────────────────────────────────

/**
 * 한 무리(몸 · 머리 · 든 것)를 결과에 얹는다 — 바깥 한 칸 테두리를 두른 뒤 본 그림을 찍는다.
 * 테두리 색은 닿은 칸의 재질에서 정한다: 살 옆 = 짙은 장밋빛 · 옷 옆 = 그 옷을 짙게 물들인 먹색 · **머리카락 옆 = 없음**
 * (머리카락은 스스로가 윤곽이다). `soft` = 이미 그려진 칸은 테두리로 덮지 않는다(머리가 몸 위에 얹힐 때).
 */
function compose(out: Layer, g: Layer, s: SkinPal, soft: boolean): void {
  const N = CHAR_CELL;
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (g.px[i] >= 0) continue;
      let pick = -1;
      for (const j of [at(x, y - 1), at(x - 1, y), at(x + 1, y), at(x, y + 1)]) {
        if (j < 0 || g.px[j] < 0) continue;
        if (pick < 0 || (g.mk[pick] === M_HAIR && g.mk[j] !== M_HAIR)) pick = j;
      }
      if (pick < 0 || g.mk[pick] === M_HAIR) continue;
      if (soft && out.px[i] >= 0) continue;
      const l = at(x - 1, y), r = at(x + 1, y);
      const inner = l >= 0 && r >= 0 && g.px[l] >= 0 && g.px[r] >= 0;
      const c = g.px[pick];
      // 팔과 몸통 사이처럼 양옆이 막힌 틈은 옷에서는 한 단 옅게(밝은 옷에 굵은 먹줄이 서지 않게), 살에서는 한 단 짙게(두 다리가 붙어 보이지 않게)
      out.px[i] = g.mk[pick] === M_SKIN ? (inner ? s.inkIn : s.ink) : mix(c, INK, inner ? 0.58 : 0.8);
      out.mk[i] = 0;
    }
  }
  for (let i = 0; i < g.px.length; i++) if (g.px[i] >= 0) { out.px[i] = g.px[i]; out.mk[i] = g.mk[i]; }
}

/** 밝은 머리카락의 가장자리 — 바깥에 닿은 칸을 한 단 어둡게(머리 크기는 그대로 두고 윤곽만 세운다) */
function rimHair(out: Layer, rim: Rgb | null): void {
  if (rim === null) return;
  const N = CHAR_CELL;
  const edge: number[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (out.mk[i] !== M_HAIR) continue;
      const open = x === 0 || y === 0 || x === N - 1 || y === N - 1
        || out.px[i - 1] < 0 || out.px[i + 1] < 0 || out.px[i - N] < 0 || out.px[i + N] < 0;
      if (open) edge.push(i);
    }
  }
  for (const i of edge) out.px[i] = rim;
}

function viewOf(dir: CharDir): View {
  return dir === 'down' ? 'front' : dir === 'up' ? 'back' : 'turn';
}

// ─────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────

/** 셀 1장 래스터 (RGBA · 길이 32*32*4) */
export function renderCharCell(dir: CharDir, frame: CharFrame, cfg: CharConfig): Uint8ClampedArray {
  const view = viewOf(dir);
  const s = skinPal(cfg.look);
  const bob = frame === 2 || frame === 4 ? -1 : 0;
  const body = new Layer(), head = new Layer(), held = new Layer();
  const ctx: BodyCtx = { g: body, view, frame, cfg, s, liftL: frame === 1, liftR: frame === 3 };
  drawLower(ctx);
  body.oy = bob;
  drawUpper(ctx);
  head.oy = bob;
  drawSkull(head, view, cfg.look, s);
  drawFace(head, view, cfg.look, s);
  drawHair(head, view, cfg.look, s);
  drawHat(head, view, cfg.outfit, s);
  held.oy = bob;
  drawHeld(held, view, frame, cfg);

  const out = new Layer();
  compose(out, body, s, false);
  compose(out, head, s, true);
  // 든 것 — 통 · 상자는 테두리를 두르고, 가는 것(낚싯대 · 갸프 · 뜰채)은 한 칸 선 그대로 얹는다(테두리를 두르면 세 칸 굵기 막대가 된다)
  const heldKind = cfg.outfit.held;
  if (heldKind === 'can' || heldKind === 'crate') compose(out, held, s, false);
  else for (let i = 0; i < held.px.length; i++) if (held.px[i] >= 0) { out.px[i] = held.px[i]; out.mk[i] = held.mk[i]; }
  rimHair(out, hairPal(cfg.look.hair).rim);

  const N = CHAR_CELL;
  const rgba = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const c = out.px[y * N + (dir === 'right' ? N - 1 - x : x)];   // 오른쪽 = 왼쪽 그림의 좌우 뒤집기
      if (c < 0) continue;
      const o = (y * N + x) * 4;
      rgba[o] = (c >> 16) & 255; rgba[o + 1] = (c >> 8) & 255; rgba[o + 2] = c & 255; rgba[o + 3] = 255;
    }
  }
  return rgba;
}

/** 329차 — 글자 지도 점검용(시험이 줄 폭 · 글자를 본다) */
export function charDotMapsForTest(): { name: string; rows: readonly string[] }[] {
  const out: { name: string; rows: readonly string[] }[] = [];
  for (const [k, v] of Object.entries(HAIR_MAPS)) for (const [vk, m] of Object.entries(v)) out.push({ name: `머리 ${k}.${vk}`, rows: m.rows });
  for (const [k, v] of Object.entries(HAT_MAPS)) for (const [vk, m] of Object.entries(v)) out.push({ name: `모자 ${k}.${vk}`, rows: m.rows });
  return out;
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
