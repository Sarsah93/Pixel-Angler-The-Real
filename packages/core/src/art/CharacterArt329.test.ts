/**
 * 329차 — 필드 캐릭터 도트 방식(글자 지도 · 좌표 계약 · 방향)
 */
import { describe, expect, it } from 'vitest';
import {
  CHAR_CELL, CHAR_DIRS, CHAR_FOOT_Y, CHAR_FRAMES, CHAR_HEAD_TOP, HAIR_STYLES,
  charDotMapsForTest, makeCharConfig, renderCharCell, renderCharSheet, starterOutfit,
  type CharConfig, type CharDir, type HatKind, type HeldKind, type OuterKind, type PantsKind, type ShirtKind, type ShoesKind,
} from './CharacterArt.js';

const N = CHAR_CELL;
const alpha = (cell: Uint8ClampedArray, x: number, y: number): number => cell[(y * N + x) * 4 + 3];
const rowHas = (cell: Uint8ClampedArray, y: number): boolean => { for (let x = 0; x < N; x++) if (alpha(cell, x, y)) return true; return false; };
const cfgOf = (look: Parameters<typeof makeCharConfig>[0], outfit: Parameters<typeof makeCharConfig>[1] = {}): CharConfig =>
  makeCharConfig(look, { ...starterOutfit(look.sex ?? 'm'), ...outfit });

describe('329 글자 지도', () => {
  it('한 장의 줄 폭이 모두 같고 아는 글자만 쓴다', () => {
    for (const m of charDotMapsForTest()) {
      const w = m.rows[0].length;
      for (const [i, r] of m.rows.entries()) {
        expect(r.length, `${m.name} 줄 ${i}`).toBe(w);
        expect(/^[.KkhjuabcdeHLD]+$/.test(r), `${m.name} 줄 ${i}: ${r}`).toBe(true);
      }
    }
  });
  it('머리 모양 8 × 방향 3 · 모자 5 × 방향 3이 모두 있다', () => {
    const names = charDotMapsForTest().map((m) => m.name);
    for (const st of HAIR_STYLES) for (const v of ['front', 'turn', 'back']) expect(names).toContain(`머리 ${st}.${v}`);
    for (const h of ['cap', 'beanie', 'sun', 'bandana', 'visor']) for (const v of ['front', 'turn', 'back']) expect(names).toContain(`모자 ${h}.${v}`);
  });
});

describe('329 좌표 계약(게임 쪽이 쓴다)', () => {
  const cfg = cfgOf({ sex: 'm' }, { shoes: 'sneakers' });
  it('서 있을 때 머리끝은 3행 · 발바닥은 28행 · 그 아래는 테두리 한 줄뿐', () => {
    for (const d of CHAR_DIRS) {
      const c = renderCharCell(d, 0, cfg);
      expect(rowHas(c, CHAR_HEAD_TOP), `${d} 머리끝`).toBe(true);
      expect(rowHas(c, CHAR_HEAD_TOP - 1), `${d} 머리 위`).toBe(false);
      expect(rowHas(c, CHAR_FOOT_Y), `${d} 발`).toBe(true);
      expect(rowHas(c, CHAR_FOOT_Y + 1), `${d} 발 테두리`).toBe(true);
      expect(rowHas(c, CHAR_FOOT_Y + 2), `${d} 발 아래`).toBe(false);
    }
  });
  it('손은 21행 · 앉기 자르기(22행 위)는 옷단까지 담는다', () => {
    const c = renderCharCell('down', 0, cfgOf({ sex: 'm' }));
    // 맨손(살) — 정면 왼손 칸(상자 1~2열 = 셀 10~11열)
    expect(alpha(c, 10, 21)).toBe(255);
    expect(alpha(c, 21, 21)).toBe(255);
  });
  it('오른쪽 = 왼쪽 그림의 좌우 뒤집기', () => {
    for (const f of CHAR_FRAMES) {
      const l = renderCharCell('left', f, cfg), r = renderCharCell('right', f, cfg);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        for (let k = 0; k < 4; k++) expect(r[(y * N + x) * 4 + k]).toBe(l[(y * N + (N - 1 - x)) * 4 + k]);
      }
    }
  });
  it('걷기 — 디딤 프레임은 한 발이 뜨고, 지나감 프레임은 윗몸이 한 칸 오른다', () => {
    const idle = renderCharCell('down', 0, cfg), step = renderCharCell('down', 1, cfg), pass = renderCharCell('down', 2, cfg);
    expect(Buffer.from(step).equals(Buffer.from(idle))).toBe(false);
    expect(rowHas(pass, CHAR_HEAD_TOP - 1)).toBe(true);
    expect(rowHas(pass, CHAR_FOOT_Y)).toBe(true);
  });
});

describe('329 모든 부품이 그려진다', () => {
  const dirs: CharDir[] = ['down', 'left', 'up'];
  const filled = (c: Uint8ClampedArray): number => { let n = 0; for (let i = 3; i < c.length; i += 4) if (c[i]) n++; return n; };
  it('머리 모양 · 성별 · 얼굴형 · 입 · 수염', () => {
    for (const st of HAIR_STYLES) for (const sex of ['m', 'f'] as const) for (const d of dirs) {
      const c = renderCharCell(d, 0, cfgOf({ sex, hairStyle: st, faceShape: 'square', mouth: 'open', beard: 6, brow: 1 }));
      expect(filled(c), `${st} ${sex} ${d}`).toBeGreaterThan(250);
    }
  });
  it('옷 · 모자 · 든 것 조합이 서로 다른 그림을 낸다', () => {
    const base = Buffer.from(renderCharCell('down', 0, cfgOf({ sex: 'm' })));
    const diff = (o: Parameters<typeof makeCharConfig>[1]): boolean => !Buffer.from(renderCharCell('down', 0, cfgOf({ sex: 'm' }, o))).equals(base);
    for (const shirt of ['none', 'shirt', 'hoodie', 'knit'] as ShirtKind[]) expect(diff({ shirt }), `상의 ${shirt}`).toBe(true);
    for (const pants of ['none', 'shorts', 'waders', 'skirt'] as PantsKind[]) expect(diff({ pants }), `하의 ${pants}`).toBe(true);
    for (const shoes of ['sneakers', 'boots', 'rubber'] as ShoesKind[]) expect(diff({ shoes }), `신발 ${shoes}`).toBe(true);
    for (const hat of ['cap', 'beanie', 'sun', 'bandana', 'visor'] as HatKind[]) expect(diff({ hat }), `모자 ${hat}`).toBe(true);
    for (const outer of ['vest', 'apron', 'jacket'] as OuterKind[]) expect(diff({ outer }), `겉옷 ${outer}`).toBe(true);
    for (const held of ['rod', 'net', 'crate', 'gaff', 'can'] as HeldKind[]) expect(diff({ held }), `든 것 ${held}`).toBe(true);
    expect(diff({ gloves: true })).toBe(true);
    expect(diff({ pack: true })).toBe(true);
  });
  it('시트는 160 × 128 — 방향 4줄 × 프레임 5칸', () => {
    const s = renderCharSheet(cfgOf({ sex: 'f', hairStyle: 'long' }));
    expect([s.w, s.h, s.data.length]).toEqual([160, 128, 160 * 128 * 4]);
  });
});
