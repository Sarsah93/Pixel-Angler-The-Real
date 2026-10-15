/**
 * @file GameCursorArt.ts
 * @description 게임 마우스 포인터 그림 — 찌 화살 (자동 생성 — 수동 편집 금지)
 *
 * 생성기: `node tools/gen_game_cursor.cjs` (원본 `assets/cursor/arrow_float.png` — 250차 사용자 선택 시안 1번).
 * 글자 = 팔레트 키, `.` = 투명. 굽기 · 배수 · 화면 연결은 `ui/GameCursor.ts`가 맡는다(여기는 순수 데이터).
 */

export interface GameCursorArt {
  /** 가로 픽셀 수 */
  w: number;
  /** 세로 픽셀 수 */
  h: number;
  /** 누르는 자리(끝점) — 1배 기준 픽셀 좌표 */
  hotX: number;
  hotY: number;
  /** 팔레트 — 문자 → 0xRRGGBB */
  pal: Record<string, number>;
  /** 행 배열 (길이 = h, 각 행 길이 = w) */
  rows: string[];
}

export const GAME_CURSOR_ART: { arrow: GameCursorArt; hand: GameCursorArt } = {
  /** 기본 — 시안 그대로 */
  arrow: {
    w: 23,
    h: 23,
    hotX: 1,
    hotY: 1,
    pal: {
      a: 0x101018,
      b: 0x101818,
      c: 0xf84810,
      d: 0xc02018,
      e: 0xf84010,
      f: 0xc02818,
      g: 0xb8c0c8,
      h: 0xe8e8f0,
      i: 0x181818,
      j: 0xf88040,
      k: 0xf87840,
      l: 0xe0e8f0,
      m: 0x103050,
      n: 0x204848,
      o: 0x204850,
      p: 0xd8d8d8,
      q: 0x103048,
      r: 0x181018,
    },
    rows: [
      'abb....................',
      'bcda...................',
      '.aefb..................',
      '..acga.................',
      '...ahgb................',
      '....ahga...............',
      '.....agfa.bbbabb.......',
      '......bedafeecdfi......',
      '.......adcejkeeegb.....',
      '.......beeejkcecggi....',
      '......afeeeeeeehhlmb...',
      '......bdeeeeeehhhhnma..',
      '......afeeeeehhhhonmi..',
      '......bdfeeehhhhooomb..',
      '......bddeehhhhooonmb..',
      '......afgphhhhoooommi..',
      '.......bggghhoooommmb..',
      '........bggooooommmb...',
      '........abmmmmmmmmba...',
      '.........aammmmmmbbqb..',
      '...........ababbr.abna.',
      '...................bani',
      '....................abi',
    ],
  },
  /** 누를 수 있는 곳 — 같은 그림 + 흰 테 1px(4방향) */
  hand: {
    w: 25,
    h: 25,
    hotX: 2,
    hotY: 2,
    pal: {
      a: 0xffffff,
      b: 0x101018,
      c: 0x101818,
      d: 0xf84810,
      e: 0xc02018,
      f: 0xf84010,
      g: 0xc02818,
      h: 0xb8c0c8,
      i: 0xe8e8f0,
      j: 0x181818,
      k: 0xf88040,
      l: 0xf87840,
      m: 0xe0e8f0,
      n: 0x103050,
      o: 0x204848,
      p: 0x204850,
      q: 0xd8d8d8,
      r: 0x103048,
      s: 0x181018,
    },
    rows: [
      '.aaa.....................',
      'abcca....................',
      'acdeba...................',
      '.abfgca..................',
      '..abdhba.................',
      '...abihca................',
      '....abihba.aaaaaa........',
      '.....abhgbacccbcca.......',
      '......acfebgffdegja......',
      '.......abedfklfffhca.....',
      '.......acfffkldfdhhja....',
      '......abgfffffffiimnca...',
      '......aceffffffiiiionba..',
      '......abgfffffiiiiponja..',
      '......acegfffiiiipppnca..',
      '......aceeffiiiippponca..',
      '......abghqiiiippppnnja..',
      '.......achhhiippppnnnca..',
      '........achhpppppnnnca...',
      '........abcnnnnnnnncba...',
      '.........abbnnnnnnccrca..',
      '..........aabcbccsabcoba.',
      '............aaaaaa.acboja',
      '....................abcja',
      '.....................aaa.',
    ],
  },
};
