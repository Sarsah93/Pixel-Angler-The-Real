/**
 * 331차 — 인물의 눈동자 크기(이야기 인물 = 초상을 보고 정한 표 · 표에 없는 사람 = 나이 + 해시)
 */
import { describe, expect, it } from 'vitest';
import { CAST_LARGE_PUPIL, CAST_OVERRIDE, CAST_TRAITS, castIds, characterOf, type CharAge } from './CharacterCast.js';
import { charCfgKey, renderCharCell } from './CharacterArt.js';

describe('331 인물 눈동자 크기', () => {
  it('큰 눈동자 표의 id는 모두 인물 표에 있다 · 23 / 45', () => {
    for (const id of CAST_LARGE_PUPIL) expect(CAST_TRAITS[id], id).toBeTruthy();
    expect(castIds().length).toBe(45);
    expect(castIds().filter((id) => characterOf(id).look.pupil === 'large').length).toBe(23);
    expect(CAST_LARGE_PUPIL.size).toBe(23);
  });
  it('이야기 인물은 표대로 — 눈이 큰 사람 · 가는 사람', () => {
    for (const id of ['bae_nuri', 'ha_sua', 'tak_saebyeok', 'seok_dokgu', 'seo_harin', 'go_haena', 'chae_surim', 'mara']) expect(characterOf(id).look.pupil, id).toBe('large');
    for (const id of ['okseon', 'tak_mansu', 'kang_ducheol', 'go_manseok', 'hyeonsu', 'baram', 'coop', 'chae_pado', 'mo_taejo']) expect(characterOf(id).look.pupil, id).toBe('small');
    // 어르신 인물은 모두 작게 · 아이 · 청소년 인물은 모두 크게
    for (const id of castIds()) {
      const age = CAST_TRAITS[id].age;
      if (age === 'elder') expect(characterOf(id).look.pupil, id).toBe('small');
      if (age === 'child' || age === 'teen') expect(characterOf(id).look.pupil, id).toBe('large');
    }
  });
  it('손으로 굳힌 외형(CAST_OVERRIDE)의 pupil이 표보다 먼저다', () => {
    const saved = CAST_OVERRIDE.okseon;
    try {
      CAST_OVERRIDE.okseon = { ...saved, pupil: 'large' };
      expect(characterOf('okseon').look.pupil).toBe('large');
    } finally { CAST_OVERRIDE.okseon = saved; }
    expect(characterOf('okseon').look.pupil).toBe('small');
  });
  it('표에 없는 사람은 나이 + 해시 — 청소년 크게 · 어르신 작게 · 섞여 나온다 · 같은 id는 늘 같다', () => {
    const count: Record<CharAge, [number, number]> = { child: [0, 0], teen: [0, 0], young: [0, 0], mid: [0, 0], elder: [0, 0] };
    for (const age of ['child', 'teen', 'young', 'mid', 'elder'] as CharAge[]) {
      for (let i = 0; i < 300; i++) {
        const id = `amb_sokcho:main_${i}`;
        const p = characterOf(id, { age }).look.pupil;
        expect(p === 'large' || p === 'small').toBe(true);
        expect(characterOf(id, { age }).look.pupil).toBe(p);
        count[age][p === 'large' ? 0 : 1]++;
      }
    }
    expect(count.child).toEqual([300, 0]);
    expect(count.teen).toEqual([300, 0]);
    expect(count.elder).toEqual([0, 300]);
    expect(count.young[0]).toBeGreaterThan(160); expect(count.young[0]).toBeLessThan(240);   // 셋 중 둘쯤
    expect(count.mid[0]).toBeGreaterThan(60); expect(count.mid[0]).toBeLessThan(140);       // 셋 중 하나쯤
  });
  it('눈동자 크기만 다른 두 설정은 정면 그림과 캐시 키가 다르고 옆 · 뒤는 같다', () => {
    const big = characterOf('bae_nuri');
    const small = { ...big, look: { ...big.look, pupil: 'small' as const } };
    expect(charCfgKey(big)).not.toBe(charCfgKey(small));
    expect(Buffer.from(renderCharCell('down', 0, big)).equals(Buffer.from(renderCharCell('down', 0, small)))).toBe(false);
    for (const d of ['left', 'right', 'up'] as const) expect(Buffer.from(renderCharCell(d, 0, big)).equals(Buffer.from(renderCharCell(d, 0, small))), d).toBe(true);
  });
});
