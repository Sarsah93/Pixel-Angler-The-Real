/**
 * @file WildGreenArt.ts
 * @description 299(2)차 — 산나물 자리 그림 원본: **땅에 뿌리내린 포기**(종마다 손으로 찍은 도트 · 2px 입자).
 *
 *  299차는 자리 표식에 수확한 묶음 그림(작물 아이콘)을 그대로 올려놓았다 — 사용자 지적
 *  (「심어져 있는 그림처럼 해놔야지 … 스타듀밸리처럼 타일 위에 야생 산나물 자체가 심어져 있는 것처럼」).
 *  그래서 종마다 **자라는 모습**을 찍는다 — 곰취 둥근 잎 로제트 · 산마늘 넓은 두 잎 · 눈개승마 깃꼴 잎 · 부지깽이 떨기 ·
 *  어수리 손바닥 잎 · 두릅 가시 줄기 끝 순 · 곤드레 가시 잎 로제트 · 엄나무 가시 줄기 끝 순.
 *  한 칸(글자) = 입자 하나. 굽는 쪽(`scenes/field/WildGreenSprites.ts`)이 입자 크기(필드 2px)로 늘린다.
 *  밑동 = 아래 줄 가운데. 아래 줄의 `g`(풀 포기) · `e`(흙)는 땅에 박힌 느낌을 준다.
 *
 *  글자 → 색(종마다 팔레트):
 *   `.` 없음 · `D` 잎 어두움(윤곽) · `l` 잎 · `L` 잎 밝음 · `y` 잎 하이라이트 · `s` 줄기 · `r` 붉은 줄기 · 순 비늘 ·
 *   `b` 나무 줄기 · `t` 가시 · `p` 보라 · `g` 밑동 풀(공통) · `e` 흙(공통)
 *  ⚠ 렌더 코드(Phaser)는 여기 두지 않는다 — 이 파일은 데이터뿐이다(미리보기 도구가 그대로 읽는다).
 */

/** 글자 하나 = 입자 하나 */
export type WildGreenGlyph = '.' | 'D' | 'l' | 'L' | 'y' | 's' | 'r' | 'b' | 't' | 'p' | 'g' | 'e';

export interface WildGreenArtDef {
  /** 종 팔레트(없는 글자는 공통 팔레트) */
  palette: Partial<Record<Exclude<WildGreenGlyph, '.'>, number>>;
  /** 위에서 아래로 · 모든 줄 같은 폭 · 아래 줄 가운데가 밑동 */
  rows: readonly string[];
}

/** 공통 — 밑동 풀 · 흙 */
export const WILD_GREEN_COMMON: Record<'g' | 'e', number> = { g: 0x2e5a26, e: 0x6a4a2c };

export const WILD_GREEN_ART: Record<string, WildGreenArtDef> = {
  // 곰취 — 콩팥처럼 둥근 큰 잎 셋(긴 잎자루) · 연한 노란빛 초록
  green_gomchwi: {
    palette: { D: 0x2f6e2a, l: 0x59a83c, L: 0x8fd45a, y: 0xc8ec84, s: 0x4a7a2e },
    rows: [
      '......DlD......',
      '....DDlLlDD....',
      '...DlLLLLLlD...',
      '...DlLyLLLlD...',
      '....DlLlllD....',
      '.....DDlDD.....',
      '.DlD...s...DlD.',
      'DlLlD..s..DlLlD',
      'DlLyLD.s.DLyLlD',
      'DlLLlD.s.DlLLlD',
      '.DlllD.s.DlllD.',
      '..DDDs.s.sDDD..',
      '.....DsssD.....',
      '....g.DsD.g....',
    ],
  },
  // 산마늘(명이) — 넓고 갸름한 잎 둘이 밑동에서 갈라져 선다 · 푸른빛 초록 · 가운데 연한 맥
  green_myeongi: {
    palette: { D: 0x2b5f46, l: 0x4c9a72, L: 0x86cfa0, y: 0xd2f0dc, s: 0x6a8a5a },
    rows: [
      '.....DlD.......',
      '....DlLlD......',
      '...DlLyLlD.DD..',
      '...DlLyLlD.DlD.',
      '..DlLyLLlD.DlLD',
      '..DlLyLLlDDlLyD',
      '..DlLLLLlDDLyLD',
      '..DlLLLlDDlLLlD',
      '...DlLlD.DlLlD.',
      '...DllD..DllD..',
      '....DlD.DlD....',
      '.....DD.DD.....',
      '......ysy......',
      '....g.DsD.g....',
    ],
  },
  // 눈개승마(삼나물) — 붉은 줄기에 깃꼴로 갈라진 작은 잎이 마주 난다 · 끝에 어린 잎
  green_samnamul: {
    palette: { D: 0x3a6a28, l: 0x6fae3c, L: 0xa8d85c, y: 0xd8f0a0, s: 0x9a3a3a, r: 0x9a3a3a },
    rows: [
      '......DLD......',
      '.....DlLlD.....',
      '....DlLDlLD....',
      '.....DlDrDlD...',
      '..DLD..r..DLD..',
      '.DlLlD.r.DlLlD.',
      '.DllD..r..DllD.',
      '..D...rr...D...',
      '..DLD..r..DLD..',
      '.DlLlD.r.DlLlD.',
      '.DllD..r..DllD.',
      '..D..rrr..D....',
      '.....DrrD......',
      '....g.DrD.g....',
    ],
  },
  // 부지깽이(섬쑥부쟁이) — 가늘고 톱니 진 잎이 부채처럼 뻗은 떨기 · 잿빛 도는 초록
  green_bujigaengi: {
    palette: { D: 0x36602e, l: 0x5e9a4e, L: 0x9ccc82, y: 0xc8e8b0, s: 0x4a6e3a },
    rows: [
      '.D....D.D....D.',
      '.Dl..DlDlD..lD.',
      '..Dl.DlLlD.lD..',
      'D.DlDDlLlDDlD.D',
      'DlDDlDlLlDlDDlD',
      '.DlDlLlLlLlDlD.',
      '.DlLlDlLlDlLlD.',
      '..DlLlLyLlLlD..',
      '..DlLlDlDlLlD..',
      '...DlDlLlDlD...',
      '....DDlslDD....',
      '.....DsssD.....',
      '.....DsssD.....',
      '....g.DsD.g....',
    ],
  },
  // 어수리 — 굵은 줄기 끝에 손바닥처럼 세 갈래로 갈라진 큰 잎 · 아래에 작은 잎 둘
  green_eosuri: {
    palette: { D: 0x2c5e2c, l: 0x4e9a3e, L: 0x8ad06a, y: 0xbfeaa0, s: 0x5f8a3a },
    rows: [
      '..DlD.DlD.DlD..',
      '.DlLlDlLlDlLlD.',
      '.DlLLLlLLlLLlD.',
      '..DlLLLLLLLlD..',
      '...DlLLyLLlD...',
      '....DllLllD....',
      '.....DDsDD.....',
      '.DlD...s...DlD.',
      'DlLlD..s..DlLlD',
      '.DLlD..s..DlLD.',
      '..DlDs.s.sDlD..',
      '...DD.Ds.sD.DD.',
      '.....DsssD.....',
      '....g.DsD.g....',
    ],
  },
  // 두릅 — 가시 돋친 줄기 끝에 어린 순(연한 잎 · 붉은 비늘)
  green_dureup: {
    palette: { D: 0x3c5a2a, l: 0x6d9a46, L: 0xa6c868, y: 0xd8e8a0, b: 0x6a4a2c, t: 0xd8c8a0, r: 0xa2583a, s: 0x6a4a2c },
    rows: [
      '......DLD......',
      '.....DlLlD.....',
      '....DlLLLlD....',
      '....DlLyLlD....',
      '...DlLDlDLlD...',
      '...DlD.r.DlD...',
      '....D.rrr.D....',
      '.....trbrt.....',
      '......b..t.....',
      '....t.b........',
      '......b.t......',
      '....t.b........',
      '......b........',
      '....g.ebe.g....',
    ],
  },
  // 곤드레(고려엉겅퀴) — 길고 가시 진 잎이 로제트로 서고 · 줄기는 보랏빛
  green_gondre: {
    palette: { D: 0x24502a, l: 0x3f8a3c, L: 0x74b85a, y: 0xaad888, s: 0x5a4a7a, p: 0x8a5aa8, t: 0xd8e0a0 },
    rows: [
      '..t....t....t..',
      '..DD..DlD..DD..',
      '.DlLD.DlD.DLlD.',
      '.DlLlDDlDDlLlD.',
      '..DlLlDlDlLlD..',
      't.DlLlDLDlLlD.t',
      'DD.DlLlLlLlD.DD',
      'DlD.DlLlLlD.DlD',
      '.DlDDlLlLlDDlD.',
      '..DlDlLlLlDlD..',
      '...DDlDlDlDD...',
      '....DsDsDsD....',
      '.....DsssD.....',
      '....g.DsD.g....',
    ],
  },
  // 엄나무순 — 굵고 가시 많은 줄기 끝에 붉은 비늘 사이로 어린 잎이 돋는다
  green_eomnamu: {
    palette: { D: 0x3a5a2a, l: 0x7aa24a, L: 0xb0d070, y: 0xd8ec9c, b: 0x5a3e26, t: 0xd0c0a0, r: 0xb05a3a, s: 0x5a3e26 },
    rows: [
      '.....DLD.......',
      '....DlLlD.D....',
      '....DlLlDDLD...',
      '.....DlDDlLD...',
      '......rrDlD....',
      '.....rrrrD.....',
      '.....rbbr......',
      '....t.bb.t.....',
      '......bb.......',
      '.....tbb.t.....',
      '......bb.......',
      '....t.bb.......',
      '......bb..t....',
      '....g.ebe.g....',
    ],
  },
};

/** 입자 크기(px) — 필드 지면 입자(2px)와 같다 */
export const WILD_GREEN_UNIT = 2;
