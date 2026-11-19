/**
 * 329차 — 필드 캐릭터 도트 방식(글자 지도 · 좌표 계약 · 방향)
 * 329(2) — 몸 두 줄 키우기(발 30행 · 손 22행) · 왼쪽 · 오른쪽은 옆모습 · 아래로 걸을 때 고개 15도
 */
import { describe, expect, it } from 'vitest';
import {
  CHAR_CELL, CHAR_DIRS, CHAR_FOOT_Y, CHAR_FRAMES, CHAR_HAND_Y, CHAR_HEAD_TOP, CHAR_MOUTH_Y, HAIR_STYLES,
  charDotMapsForTest, makeCharConfig, renderCharCell, renderCharSheet, starterOutfit,
  type CharConfig, type CharDir, type HatKind, type HeldKind, type OuterKind, type PantsKind, type ShirtKind, type ShoesKind,
} from './CharacterArt.js';

const N = CHAR_CELL;
const alpha = (cell: Uint8ClampedArray, x: number, y: number): number => (x < 0 || y < 0 || x >= N || y >= N ? 0 : cell[(y * N + x) * 4 + 3]);
const rgb = (cell: Uint8ClampedArray, x: number, y: number): number => (cell[(y * N + x) * 4] << 16) | (cell[(y * N + x) * 4 + 1] << 8) | cell[(y * N + x) * 4 + 2];
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
  it('머리 모양 8 × 방향 3(정면 · 옆모습 · 뒤) · 모자 5 × 방향 3이 모두 있다', () => {
    const names = charDotMapsForTest().map((m) => m.name);
    for (const st of HAIR_STYLES) for (const v of ['front', 'side', 'back']) expect(names).toContain(`머리 ${st}.${v}`);
    for (const h of ['cap', 'beanie', 'sun', 'bandana', 'visor']) for (const v of ['front', 'side', 'back']) expect(names).toContain(`모자 ${h}.${v}`);
  });
});

describe('329 좌표 계약(게임 쪽이 쓴다)', () => {
  const cfg = cfgOf({ sex: 'm' }, { shoes: 'sneakers' });
  it('서 있을 때 머리끝은 3행 · 발바닥은 30행 · 그 아래는 테두리 한 줄뿐', () => {
    expect([CHAR_HEAD_TOP, CHAR_FOOT_Y, CHAR_HAND_Y, CHAR_MOUTH_Y]).toEqual([3, 30, 22, 13]);
    for (const d of CHAR_DIRS) {
      const c = renderCharCell(d, 0, cfg);
      expect(rowHas(c, CHAR_HEAD_TOP), `${d} 머리끝`).toBe(true);
      expect(rowHas(c, CHAR_HEAD_TOP - 1), `${d} 머리 위`).toBe(false);
      expect(rowHas(c, CHAR_FOOT_Y), `${d} 발`).toBe(true);
      expect(rowHas(c, CHAR_FOOT_Y + 1), `${d} 발 테두리`).toBe(true);
      expect(rowHas(c, CHAR_FOOT_Y + 2), `${d} 발 아래`).toBe(false);
    }
  });
  it('손은 22행 · 앉기 자르기(손 행까지)는 옷단까지 담는다', () => {
    const c = renderCharCell('down', 0, cfgOf({ sex: 'm' }));
    // 맨손(살) — 정면 왼손 칸(상자 1~2열 = 셀 10~11열)
    expect(alpha(c, 10, CHAR_HAND_Y)).toBe(255);
    expect(alpha(c, 21, CHAR_HAND_Y)).toBe(255);
    // 손 아래 줄에는 팔이 없다(바깥 테두리만 남는다)
    expect(rgb(c, 10, CHAR_HAND_Y + 1)).not.toBe(rgb(c, 10, CHAR_HAND_Y));
  });
  it('몸은 머리보다 길다 — 머리 12줄 · 목부터 발까지 16줄', () => {
    expect(CHAR_FOOT_Y - CHAR_HEAD_TOP + 1).toBe(28);
    expect(CHAR_FOOT_Y - (CHAR_HEAD_TOP + 12) + 1).toBe(16);
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

describe('329(2) 옆모습 · 걷기 고개', () => {
  const cfg = cfgOf({ sex: 'm' }, { shoes: 'sneakers' });
  /** 칸 줄에서 채워진 첫 열 · 끝 열 */
  const span = (c: Uint8ClampedArray, y: number): [number, number] => { let a = -1, b = -1; for (let x = 0; x < N; x++) if (alpha(c, x, y)) { if (a < 0) a = x; b = x; } return [a, b]; };
  it('왼쪽은 옆모습이다 — 코끝이 얼굴 앞으로 한 칸 나오고 몸통은 정면보다 좁다', () => {
    const side = renderCharCell('left', 0, cfg), front = renderCharCell('down', 0, cfg);
    // 코끝 줄(셀 11행)은 눈 줄(셀 10행)보다 왼쪽으로 한 칸 더 나온다
    expect(span(side, 11)[0]).toBe(span(side, 10)[0] - 1);
    const w = (c: Uint8ClampedArray, y: number): number => { const [a, b] = span(c, y); return b - a + 1; };
    expect(w(side, 19)).toBeLessThan(w(front, 19));
    expect(Buffer.from(side).equals(Buffer.from(front))).toBe(false);
  });
  it('옆모습 걷기 — 네 프레임이 모두 다르고 디딤 프레임은 다리가 앞뒤로 벌어진다', () => {
    const f = CHAR_FRAMES.map((k) => renderCharCell('left', k, cfg));
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) expect(Buffer.from(f[i]).equals(Buffer.from(f[j])), `${i} ≠ ${j}`).toBe(false);
    const w = (c: Uint8ClampedArray): number => { const [a, b] = span(c, CHAR_FOOT_Y); return b - a + 1; };
    expect(w(f[1])).toBeGreaterThan(w(f[0]));
    expect(w(f[3])).toBeGreaterThan(w(f[0]));
  });
  it('아래로 걸을 때 디딤 프레임마다 고개가 번갈아 돌아간다 — 머리 윤곽은 그대로 · 눈이 한 칸씩 옮겨 간다', () => {
    const idle = renderCharCell('down', 0, cfg), l = renderCharCell('down', 1, cfg), r = renderCharCell('down', 3, cfg);
    // 눈 줄(셀 10행)의 가장 어두운 칸 = 검은 눈동자. 정면 4 · 9열(상자) → 왼쪽으로 3 · 8 → 오른쪽으로 5 · 10
    const pupils = (c: Uint8ClampedArray): number[] => { const out: number[] = []; for (let x = 0; x < N; x++) if (alpha(c, x, 10) && rgb(c, x, 10) === 0x0d0d14) out.push(x - 9); return out; };
    expect(pupils(idle)).toEqual([4, 9]);
    expect(pupils(l)).toEqual([3, 8]);
    expect(pupils(r)).toEqual([5, 10]);
    // 머리 윤곽 — 정수리부터 눈 아래 줄(셀 3~12행)까지 좌우 끝이 같다(안쪽만 밀린다)
    for (let y = CHAR_HEAD_TOP; y <= 9; y++) { expect(span(l, y), `왼 ${y}`).toEqual(span(idle, y)); expect(span(r, y), `오 ${y}`).toEqual(span(idle, y)); }
    // 지나감 프레임(2 · 4)은 정면 그대로 — 한 칸 들썩일 뿐
    expect(pupils(renderCharCell('down', 2, cfg)).length).toBe(0);
  });
  it('옆모습에서도 옷 · 모자 · 든 것 · 가방이 서로 다른 그림을 낸다', () => {
    const base = Buffer.from(renderCharCell('left', 0, cfgOf({ sex: 'm' })));
    const diff = (o: Parameters<typeof makeCharConfig>[1]): boolean => !Buffer.from(renderCharCell('left', 0, cfgOf({ sex: 'm' }, o))).equals(base);
    for (const shirt of ['none', 'shirt', 'hoodie', 'knit'] as ShirtKind[]) expect(diff({ shirt }), `상의 ${shirt}`).toBe(true);
    for (const pants of ['none', 'shorts', 'waders', 'skirt'] as PantsKind[]) expect(diff({ pants }), `하의 ${pants}`).toBe(true);
    for (const shoes of ['sneakers', 'boots', 'rubber'] as ShoesKind[]) expect(diff({ shoes }), `신발 ${shoes}`).toBe(true);
    for (const hat of ['cap', 'beanie', 'sun', 'bandana', 'visor'] as HatKind[]) expect(diff({ hat }), `모자 ${hat}`).toBe(true);
    for (const outer of ['vest', 'apron', 'jacket'] as OuterKind[]) expect(diff({ outer }), `겉옷 ${outer}`).toBe(true);
    for (const held of ['rod', 'net', 'crate', 'gaff', 'can'] as HeldKind[]) expect(diff({ held }), `든 것 ${held}`).toBe(true);
    expect(diff({ gloves: true })).toBe(true);
    expect(diff({ pack: true })).toBe(true);
  });
});

describe('329 모든 부품이 그려진다', () => {
  const dirs: CharDir[] = ['down', 'left', 'up'];
  const filled = (c: Uint8ClampedArray): number => { let n = 0; for (let i = 3; i < c.length; i += 4) if (c[i]) n++; return n; };
  it('머리 모양 · 성별 · 얼굴형 · 입 · 수염', () => {
    for (const st of HAIR_STYLES) for (const sex of ['m', 'f'] as const) for (const d of dirs) {
      const c = renderCharCell(d, 0, cfgOf({ sex, hairStyle: st, faceShape: 'square', mouth: 'open', beard: 6, brow: 1 }));
      // 옆모습은 몸통이 좁아 칸 수가 적다
      expect(filled(c), `${st} ${sex} ${d}`).toBeGreaterThan(d === 'left' ? 200 : 250);
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
