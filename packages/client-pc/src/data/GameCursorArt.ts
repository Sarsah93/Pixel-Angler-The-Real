/**
 * @file GameCursorArt.ts
 * @description 게임 마우스 포인터 그림 — 찌 화살 (자동 생성 — 수동 편집 금지)
 *
 * 생성기: `node tools/gen_game_cursor.cjs` (원본 `assets/cursor/arrow_float.png` — 250차 사용자 선택 시안 1번).
 * 글자 = 팔레트 키, `.` = 투명. 테두리 · 크기 · 색 바꾸기와 화면 연결은 `ui/GameCursor.ts`가 맡는다(여기는 순수 데이터).
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
  /** 251차 — 야광찌 팔레트(빨강 · 주황 칸만 덮어쓴다) */
  glow: Record<string, number>;
  /** 행 배열 (길이 = h, 각 행 길이 = w) */
  rows: string[];
}

export const GAME_CURSOR_ART: GameCursorArt = {
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
  glow: {
    c: 0xe4ff3c,
    d: 0xa6c81a,
    e: 0xe4ff3c,
    f: 0xa6c81a,
    j: 0xf4ffb0,
    k: 0xf4ffb0,
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
};
