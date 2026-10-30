/**
 * @file Forage288.test.ts
 * @description 288차 — 해루질 규정 · 크기: 성게 두 종 이름 정정 · 금지체장 「이하」 · 지역 규정(울릉 소라 · 경남 · 전남 · 인천 낙지 · 참문어) ·
 * 종별 크기 분포 · 무게 · 그림 크기 배율 · 동해(울산 · 울릉 · 독도) · 주인공 나이(정본 22세).
 */
import { describe, expect, it } from 'vitest';
import { SHORE_CREATURE_DATABASE, getCreatureById } from '../db-schema/ShoreCreatureDatabase.js';
import { rollForageHarvest, rollForageSizeCm, forageImageSizeScale, isEastSeaRegion } from './ForagingEngine.js';
import { resolveLegal, legalRegionOf, isClosedOn } from '../rules/ClosedSeason.js';
import { feedingRegionProfileOf } from './FeedingTimeCalculator.js';
import { mulberry32 } from './ForagingEngine.js';
import { PLAYER_CANON_AGE, playerAgeOf } from '../art/CharacterArt.js';

const C = (id: string) => getCreatureById(id)!;

describe('288차 — 이름 · 학명 정정', () => {
  it('둥근성게 · 보라성게(옛 「성게 (보라성게)」 · 「말똥성게」는 종이 뒤섞여 있었다)', () => {
    expect(C('strongylocentrotus_nudus').nameKo).toBe('둥근성게');
    expect(C('strongylocentrotus_nudus').scientificName).toBe('Mesocentrotus nudus');
    expect(C('heliocidaris_crassispina').nameKo).toBe('보라성게');
    expect(C('heliocidaris_crassispina').scientificName).toBe('Heliocidaris crassispina');
  });
  it('소라 설명에 집어등을 쓰라고 하지 않는다(비어업인 금지)', () => {
    expect(C('turbo_cornutus').description).not.toMatch(/집어등으로/);
  });
});

describe('288차 — 금지체장은 「이하」', () => {
  it('딱 그 크기는 법정 크기 미달이다', () => {
    const c = C('haliotis_discus');
    // 크기가 언제나 7.0이 나오는 가짜 굴림(정규 분포 → 평균 9 · 표준편차 1.5 → n = -4/3)
    let found = false;
    const rng = mulberry32(7);
    for (let i = 0; i < 4000 && !found; i++) {
      const h = rollForageHarvest(c, rng, 'gangwon_sokcho');
      if (h.sizeCm === 7) { expect(h.undersized).toBe(true); found = true; }
      if (h.sizeCm < 7) expect(h.undersized).toBe(true);
      if (h.sizeCm > 7) expect(h.undersized).toBe(false);
    }
  });
});

describe('288차 — 지역 규정', () => {
  it('지역 키 — 제주 · 경남 · 전남 · 인천 · 울릉(부산 · 울산 · 강원 · 충남은 국가 기준)', () => {
    expect(legalRegionOf('jeju')).toBe('jeju');
    expect(legalRegionOf('gyeongnam_geoje')).toBe('gyeongnam');
    expect(legalRegionOf('jeonnam_yeosu')).toBe('jeonnam');
    expect(legalRegionOf('incheon')).toBe('incheon');
    expect(legalRegionOf('ulleungdo')).toBe('ulleung');
    expect(legalRegionOf('dokdo')).toBe('ulleung');
    for (const r of ['busan', 'ulsan', 'gangwon_sokcho', 'chungnam_taean', 'gyeongbuk_pohang']) expect(legalRegionOf(r)).toBeNull();
  });
  it('울릉 소라 6.1~7.31 · 7cm / 제주 6.1~8.31 · 7cm / 속초 국가 5cm', () => {
    const c = C('turbo_cornutus');
    expect(resolveLegal(c, 'ulleungdo').minLegalSizeCm).toBe(7);
    expect(isClosedOn(resolveLegal(c, 'ulleungdo').closedSeasons, 7, 20)).toBe(true);
    expect(isClosedOn(resolveLegal(c, 'ulleungdo').closedSeasons, 8, 10)).toBe(false);
    expect(isClosedOn(resolveLegal(c, 'jeju').closedSeasons, 8, 10)).toBe(true);
    expect(resolveLegal(c, 'gangwon_sokcho').minLegalSizeCm).toBe(5);
  });
  it('낙지 — 경남 6.16~7.31 · 전남 · 인천 6.21~7.20 · 그 밖 6.1~6.30', () => {
    const c = C('octopus_minor');
    expect(isClosedOn(resolveLegal(c, 'gyeongnam_geoje').closedSeasons, 7, 25)).toBe(true);
    expect(isClosedOn(resolveLegal(c, 'gyeongnam_geoje').closedSeasons, 6, 5)).toBe(false);
    expect(isClosedOn(resolveLegal(c, 'jeonnam_yeosu').closedSeasons, 7, 10)).toBe(true);
    expect(isClosedOn(resolveLegal(c, 'incheon').closedSeasons, 6, 10)).toBe(false);
    expect(isClosedOn(resolveLegal(c, 'busan').closedSeasons, 6, 10)).toBe(true);
  });
  it('참문어 — 경남 · 전남 5.24~7.8 · 그 밖 5.16~6.30', () => {
    const c = C('octopus_vulgaris');
    expect(isClosedOn(resolveLegal(c, 'gyeongnam_geoje').closedSeasons, 7, 5)).toBe(true);
    expect(isClosedOn(resolveLegal(c, 'gyeongnam_geoje').closedSeasons, 5, 18)).toBe(false);
    expect(isClosedOn(resolveLegal(c, 'gangwon_sokcho').closedSeasons, 5, 18)).toBe(true);
  });
});

describe('288차 — 종별 크기 · 무게 · 그림 배율', () => {
  it('21종 모두 크기 자료가 있고 [min, max] 안에서 굴린다', () => {
    const rng = mulberry32(42);
    for (const c of SHORE_CREATURE_DATABASE) {
      expect(c.size, c.id).toBeTruthy();
      for (let i = 0; i < 300; i++) {
        const v = rollForageSizeCm(c, rng, 0);
        expect(v).toBeGreaterThanOrEqual(c.size!.minCm);
        expect(v).toBeLessThanOrEqual(c.size!.maxCm);
      }
    }
  });
  it('옛 일반 밴드의 어긋남이 사라졌다 — 바지락 · 보말은 손가락 마디 크기, 낙지는 수백 g이 아니다', () => {
    const rng = mulberry32(3);
    const avg = (id: string, f: (h: ReturnType<typeof rollForageHarvest>) => number) => {
      let s = 0; for (let i = 0; i < 500; i++) s += f(rollForageHarvest(C(id), rng, 'gangwon_sokcho')); return s / 500;
    };
    expect(avg('clam_varicosa', (h) => h.sizeCm)).toBeLessThan(5);
    expect(avg('omphalius_rusticus', (h) => h.sizeCm)).toBeLessThan(3.2);
    expect(avg('octopus_minor', (h) => h.weightG)).toBeLessThan(250);
    expect(avg('perinereis_aibuhitensis', (h) => h.weightG)).toBeLessThan(6);
  });
  it('그림 배율 — 보통 크기 1 · 작으면 작게 · 크면 크게 · [0.8, 1.35]', () => {
    const c = C('portunus_trituberculatus');
    expect(forageImageSizeScale(c, c.size!.meanCm)).toBeCloseTo(1, 5);
    expect(forageImageSizeScale(c, 5)).toBeLessThan(1);
    expect(forageImageSizeScale(c, 9)).toBeGreaterThan(1.1);
    expect(forageImageSizeScale(c, 99)).toBe(1.35);
    expect(forageImageSizeScale(c, 0.1)).toBe(0.8);
  });
});

describe('288차 — 동해 · 주인공 나이', () => {
  it('울산 · 울릉도 · 독도는 동해다(오분자기가 나오지 않는다 · 먹이 시간 동해 판)', () => {
    for (const r of ['ulsan', 'ulleungdo', 'dokdo', 'gangwon_sokcho']) expect(isEastSeaRegion(r)).toBe(true);
    expect(isEastSeaRegion('busan')).toBe(false);
    expect(feedingRegionProfileOf('ulsan')).toBe('east_sea');
  });
  it('주인공 정본 나이 22세 · 없으면 정본 · 있으면 그 값', () => {
    expect(PLAYER_CANON_AGE).toBe(22);
    expect(playerAgeOf(undefined)).toBe(22);
    expect(playerAgeOf({})).toBe(22);
    expect(playerAgeOf({ age: 54 })).toBe(54);
  });
});
