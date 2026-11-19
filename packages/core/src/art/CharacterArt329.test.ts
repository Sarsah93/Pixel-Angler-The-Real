/**
 * 329차 — 필드 캐릭터 도트 방식(글자 지도 · 좌표 계약 · 방향)
 * 329(2) — 몸 두 줄 키우기(발 30행 · 손 22행) · 왼쪽 · 오른쪽은 옆모습 · 아래로 걸을 때 고개 15도
 * 329(3) — 눈동자는 바라보는 쪽(정면 = 흰 · 검 · 흰 / 옆모습 = 검 · 흰)
 * 330 — 눈동자 크기(크게 = 코 쪽 한 열이 눈동자 · 정면만)
 */
import { describe, expect, it } from 'vitest';
import {
  CHAR_CELL, CHAR_DIRS, CHAR_FOOT_Y, CHAR_FRAMES, CHAR_HAND_Y, CHAR_HEAD_TOP, CHAR_MOUTH_Y, HAIR_STYLES, PUPIL_SIZES,
  charCfgKey, charDotMapsForTest, makeCharConfig, renderCharCell, renderCharSheet, starterOutfit,
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
  it('329(3) 눈동자는 바라보는 쪽에 있다 — 정면은 눈 가운데 · 옆모습은 앞쪽', () => {
    const PUPIL = 0x0d0d14;
    const bright = (c: Uint8ClampedArray, x: number, y: number): boolean => { const v = rgb(c, x, y); return ((v >> 16) & 255) > 200 && ((v >> 8) & 255) > 200 && (v & 255) > 200; };
    const front = renderCharCell('down', 0, cfg);
    // 정면 — 두 눈 모두 [흰 · 검 · 흰] (상자 3~5열 · 8~10열 = 셀 12~14 · 17~19열 · 눈 윗줄 = 셀 10행)
    for (const x0 of [12, 17]) {
      expect(bright(front, x0, 10), `왼 흰자 ${x0}`).toBe(true);
      expect(rgb(front, x0 + 1, 10)).toBe(PUPIL);
      expect(bright(front, x0 + 2, 10), `오른 흰자 ${x0}`).toBe(true);
      expect(rgb(front, x0, 11)).toBe(rgb(front, x0 + 2, 11));
    }
    // 두 눈은 얼굴 가운데(셀 15.5열)를 두고 좌우 대칭이다
    for (let i = 0; i < 3; i++) for (const y of [10, 11]) expect(rgb(front, 12 + i, y)).toBe(rgb(front, 19 - i, y));
    // 옆모습(왼쪽) — 검은자가 앞(셀 12열) · 흰자가 뒤(셀 13열) · 얼굴 앞선(셀 11열)은 눈이 아니다
    const left = renderCharCell('left', 0, cfg);
    expect(rgb(left, 12, 10)).toBe(PUPIL);
    expect(bright(left, 13, 10)).toBe(true);
    expect(bright(left, 11, 10)).toBe(false);
    expect(rgb(left, 11, 10)).not.toBe(PUPIL);
    // 오른쪽은 뒤집기 — 검은자가 오른쪽(셀 19열) · 흰자가 왼쪽(셀 18열)
    const right = renderCharCell('right', 0, cfg);
    expect(rgb(right, 19, 10)).toBe(PUPIL);
    expect(bright(right, 18, 10)).toBe(true);
  });
  it('330 눈동자 크기 — 크게는 코 쪽 한 열이 눈동자가 된다(정면만 · 없으면 작게)', () => {
    const PUPIL = 0x0d0d14;
    const bright = (c: Uint8ClampedArray, x: number, y: number): boolean => { const v = rgb(c, x, y); return ((v >> 16) & 255) > 200 && ((v >> 8) & 255) > 200 && (v & 255) > 200; };
    const lum = (v: number): number => ((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11;
    for (const eye of [0, 2, 3]) {
      const small = cfgOf({ sex: 'm', eye, pupil: 'small' }), large = cfgOf({ sex: 'm', eye, pupil: 'large' });
      const f = renderCharCell('down', 0, large), fs = renderCharCell('down', 0, small);
      // 왼눈(셀 12~14열) = [흰 · 검은자 · 눈동자] · 오른눈(17~19열) = 그 좌우 대칭 — 귀 쪽 한 열만 흰자
      expect(bright(f, 12, 10)).toBe(true); expect(bright(f, 12, 11)).toBe(true);
      expect(bright(f, 19, 10)).toBe(true); expect(bright(f, 19, 11)).toBe(true);
      expect(rgb(f, 13, 10)).toBe(PUPIL); expect(rgb(f, 18, 10)).toBe(PUPIL);
      for (const [nx, cx] of [[14, 13], [17, 18]] as const) {
        expect(bright(f, nx, 10), `코 쪽 윗칸 ${nx}`).toBe(false);
        expect(bright(f, nx, 11), `코 쪽 아랫칸 ${nx}`).toBe(false);
        // 둘째 열은 검은자 열과 같은 색이 아니다 — 윗칸은 검정보다 밝고(눈동자색이 돈다) 아랫칸은 눈동자색보다 밝다
        expect(rgb(f, nx, 10)).not.toBe(rgb(f, cx, 10));
        expect(lum(rgb(f, nx, 10))).toBeGreaterThan(lum(PUPIL));
        expect(lum(rgb(f, nx, 11))).toBeGreaterThan(lum(rgb(f, cx, 11)));
        // 눈 밖은 그대로
        expect(rgb(f, cx, 11)).toBe(rgb(fs, cx, 11));
      }
      for (let i = 0; i < 3; i++) for (const y of [10, 11]) expect(rgb(f, 12 + i, y)).toBe(rgb(f, 19 - i, y));
      // 옆모습 · 뒤는 크기와 상관없이 같다
      for (const dir of ['left', 'right', 'up'] as const) expect(Buffer.from(renderCharCell(dir, 0, large)).equals(Buffer.from(renderCharCell(dir, 0, small))), dir).toBe(true);
      // 정면에서 달라지는 칸은 네 칸뿐이다(두 눈 × 두 줄)
      let changed = 0; for (let i = 0; i < f.length; i += 4) if (f[i] !== fs[i] || f[i + 1] !== fs[i + 1] || f[i + 2] !== fs[i + 2] || f[i + 3] !== fs[i + 3]) changed++;
      expect(changed).toBe(4);
    }
    // 값이 없는 옛 설정은 작게와 같은 그림 · 같은 캐시 키
    const none = cfgOf({ sex: 'f' }); delete (none.look as { pupil?: string }).pupil;
    const small = cfgOf({ sex: 'f', pupil: 'small' });
    expect(Buffer.from(renderCharCell('down', 0, none)).equals(Buffer.from(renderCharCell('down', 0, small)))).toBe(true);
    expect(charCfgKey(none)).toBe(charCfgKey(small));
    expect(charCfgKey(cfgOf({ sex: 'f', pupil: 'large' }))).not.toBe(charCfgKey(small));
    expect(PUPIL_SIZES).toEqual(['small', 'large']);
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
