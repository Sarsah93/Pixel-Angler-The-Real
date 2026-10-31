/**
 * @file Presence289.test.ts
 * @description 289차 — 사용자 결정 D1~D6: 존재 가중(바다 · 계절 · 수온) · 드문 하한 · 이야기 어종 하한 · 평년 수온 ·
 * 적수온 정정 · 에기 어종 바다 제한 · 살오징어 등록 · 풍랑 통제 · 갯것 미끼.
 */
import { describe, expect, it } from 'vitest';
import {
  seaOf, climatologySstC, sstStationOf, seasonPresence, tempPresence, seaPresence, speciesPresence, presenceBreakdown,
  SPECIES_SEA_WEIGHT,
} from './SpeciesPresence.js';
import { ORACLE_FISH_DB, speciesBiteShare, presenceBiteRate, spawnFish, type SpawnContext } from '../simulation/FishSpawningOracle.js';
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { SEAFOOD_AUCTION_MAPPING } from '../types/Economy.js';
import { matchMafraSpecies } from '../api-client/MafraAuctionApiClient.js';
import { LURES_CATALOG_DB } from '../db-schema/LuresCatalogDB.js';
import { forageBaitKeyOf, rodFishingClosure } from '../simulation/ForagingEngine.js';
import { TUNING } from '../config/tuning.js';

const EGI = ['squid', 'octopus', 'giant_octopus', 'cuttlefish', 'swordtip_squid', 'flying_squid'];
const ctx = (over: Partial<SpawnContext>): SpawnContext => ({
  depthZ: 6, zMax: 12, region: 'gangwon_sokcho', tidePhase: 8, month: 8, day: 15, baitKey: 'krill', inReef: true, isNight: false, ...over,
});
const dist = (c: SpawnContext): Record<string, number> => {
  const o: Record<string, number> = {};
  for (const s of ORACLE_FISH_DB) { const v = speciesBiteShare(c, s.speciesId); if (v > 0) o[s.speciesId] = v; }
  return o;
};
const tvd = (a: Record<string, number>, b: Record<string, number>): number => {
  let t = 0; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) t += Math.abs((a[k] ?? 0) - (b[k] ?? 0));
  return t / 2;
};
const topOf = (d: Record<string, number>): string => Object.entries(d).sort((a, b) => b[1] - a[1])[0][0];

describe('289차 — 바다 · 평년 수온', () => {
  it('지역 → 바다(부산 남해 · 울산부터 동해 · 태안 · 인천 서해 · 심리스 데이터 지역 이름도)', () => {
    expect(seaOf('gangwon_sokcho')).toBe('east');
    expect(seaOf('ulsan')).toBe('east');
    expect(seaOf('ulleungdo')).toBe('ulleung');   // 294차 — 동해 먼바다
    expect(seaOf('dokdo')).toBe('ulleung');
    expect(seaOf('busan')).toBe('south');
    expect(seaOf('busan_gamcheon')).toBe('south');
    expect(seaOf('geoje_east')).toBe('south');
    expect(seaOf('jeonnam_yeosu')).toBe('south');
    expect(seaOf('chungnam_taean')).toBe('west');
    expect(seaOf('incheon')).toBe('west');
    expect(seaOf('jeju')).toBe('jeju');
    expect(seaOf('jeju_seogwipo')).toBe('jeju');
    expect(sstStationOf('sokcho_v2')).toBe('sokcho');
  });
  it('평년 수온 — 달 가운데는 표 값 · 월말은 다음 달 쪽으로 보간 · 서해 겨울은 차갑고 제주 여름은 따뜻하다', () => {
    expect(climatologySstC('gangwon_sokcho', 8, 15)).toBe(24);
    expect(climatologySstC('gangwon_sokcho', 8, 31)).toBeLessThan(24);
    expect(climatologySstC('incheon', 2)).toBeLessThan(5);
    expect(climatologySstC('jeju', 8)).toBeGreaterThan(25);
  });
});

describe('289차 — 계절 · 수온 · 바다 가중', () => {
  it('제철 1 · 앞뒤 달 · 그 밖 하한(0이 아니다)', () => {
    expect(seasonPresence('yellowtail', 12)).toBe(1);
    expect(seasonPresence('yellowtail', 2)).toBe(TUNING.presence.seasonAdjacent);
    expect(seasonPresence('yellowtail', 7)).toBe(TUNING.presence.seasonOff);
    expect(seasonPresence('grass_puffer', 7)).toBe(1);   // 사철
  });
  it('적수온 정정 — 겨울 방어 · 여수 겨울 감성돔이 제철에 눌리지 않는다', () => {
    expect(tempPresence('yellowtail', climatologySstC('jeju', 1))).toBe(1);
    expect(tempPresence('yellowtail', climatologySstC('gangwon_sokcho', 12))).toBe(1);
    expect(tempPresence('black_seabream', climatologySstC('jeonnam_yeosu', 1))).toBe(1);
    expect(tempPresence('sandfish', climatologySstC('gangwon_sokcho', 11))).toBeGreaterThan(0.7);
  });
  it('D1 — 그 바다에 거의 없는 어종도 0이 아니라 드물게(하한)', () => {
    expect(seaPresence('pacific_cod', 'jeju')).toBe(0.02);
    expect(seaPresence('longtail_blackfish', 'chungnam_taean')).toBe(TUNING.presence.seaFloor);   // 0.01 → 하한
    const p = speciesPresence('pacific_cod', { region: 'jeju', month: 7 });
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(0.02);
  });
  it('D1 — 진행 중인 이야기가 찾는 어종은 그 자리에서도 하한 `storyFloor`(N02-3 서귀포 대구)', () => {
    const b = presenceBreakdown('pacific_cod', { region: 'jeju', month: 1, storyTargets: ['pacific_cod'] });
    expect(b.story).toBe(true);
    expect(b.total).toBe(TUNING.presence.storyFloor);
    const deep = ctx({ depthZ: 58, zMax: 60, region: 'jeju', month: 1, baitKey: 'fishcut', inReef: false });
    expect(speciesBiteShare({ ...deep, storyTargets: ['pacific_cod'] }, 'pacific_cod'))
      .toBeGreaterThan(speciesBiteShare(deep, 'pacific_cod') * 5);
  });
  it('표의 모든 종이 오라클에 있다 · 오라클의 모든 종이 표에 있다', () => {
    const ids = new Set(ORACLE_FISH_DB.map((s) => s.speciesId));
    for (const id of Object.keys(SPECIES_SEA_WEIGHT)) expect(ids.has(id), id).toBe(true);
    for (const id of ids) expect(SPECIES_SEA_WEIGHT[id], id).toBeTruthy();
  });
});

describe('289차 — 입질 분포가 계절 · 지역으로 갈린다(288 감사: 0 %)', () => {
  it('속초 1월 ↔ 8월 분포 차 30 % 이상 · 존재 가중을 끄면 0 %', () => {
    const a = dist(ctx({ month: 1 })), b = dist(ctx({ month: 8 }));
    expect(tvd(a, b)).toBeGreaterThan(0.3);
    expect(tvd(dist(ctx({ month: 1, presenceOff: true })), dist(ctx({ month: 8, presenceOff: true })))).toBeLessThan(0.001);
  });
  it('속초 ↔ 제주 · 제주 ↔ 태안 분포 차 20 % 이상', () => {
    expect(tvd(dist(ctx({ region: 'gangwon_sokcho', month: 1 })), dist(ctx({ region: 'jeju', month: 1 })))).toBeGreaterThan(0.2);
    expect(tvd(dist(ctx({ region: 'jeju' })), dist(ctx({ region: 'chungnam_taean' })))).toBeGreaterThan(0.2);
  });
  it('D6 — 에기는 바다를 따른다: 가을 속초 = 살오징어 · 여름 제주 = 한치 · 봄 태안 = 갑오징어 · 문어', () => {
    const egi = (region: string, month: number) => dist(ctx({ region, month, isNight: true, baitKey: 'lure', zMax: 15, speciesFilter: EGI }));
    expect(topOf(egi('gangwon_sokcho', 10))).toBe('flying_squid');
    expect(topOf(egi('jeju', 7))).toBe('swordtip_squid');
    expect(['cuttlefish', 'octopus']).toContain(topOf(egi('chungnam_taean', 5)));
    expect(egi('chungnam_taean', 5).swordtip_squid ?? 0).toBeLessThan(0.05);
  });
  it('입질 빈도 배율 — 제철 · 맞는 바다는 1(288과 같다) · 겨울 서해는 하한 쪽', () => {
    expect(presenceBiteRate(ctx({ region: 'busan', month: 10 }))).toBeGreaterThan(0.95);
    const w = presenceBiteRate(ctx({ region: 'chungnam_taean', month: 1 }));
    expect(w).toBeGreaterThanOrEqual(TUNING.presence.rateFloor);
    expect(w).toBeLessThan(0.6);
    expect(presenceBiteRate(ctx({ region: 'chungnam_taean', month: 1, presenceOff: true }))).toBe(1);
  });
});

describe('289차 — 살오징어 · 미끼 · 풍랑', () => {
  it('살오징어 — 오라클 · 도감 · 경락 · 시장 이름 · 에기 묶임 · 금지체장 · 금어기', () => {
    const o = ORACLE_FISH_DB.find((s) => s.speciesId === 'flying_squid')!;
    expect(o.egiOnly).toBe(true);
    expect(o.legalMinCm).toBe(15);
    expect(FISH_DATABASE.find((f) => f.id === 'flying_squid')?.nameKo).toBe('살오징어');
    expect(SEAFOOD_AUCTION_MAPPING.flying_squid?.defaultPricePerKg).toBeGreaterThan(0);
    expect(matchMafraSpecies({ MCLASSNAME: '오징어', SCLASSNAME: '' })).toBe('flying_squid');
    expect(matchMafraSpecies({ MCLASSNAME: '갑오징어', SCLASSNAME: '' })).toBe('cuttlefish');
    expect(LURES_CATALOG_DB.filter((l) => l.spawnBinding?.includes('squid')).every((l) => l.spawnBinding!.includes('flying_squid'))).toBe(true);
    // 외투장 15cm 이하 미달(「이하」) · 4~5월 금어기
    let undersized = 0, total = 0;
    for (let i = 0; i < 400; i++) {
      const f = spawnFish(ctx({ month: 4, day: 10, isNight: true, baitKey: 'lure', speciesFilter: ['flying_squid'] }));
      total++;
      if (f.lengthCm <= 15) { expect(f.isUndersized).toBe(true); undersized++; }
      expect(f.isClosedSeason).toBe(true);
    }
    expect(undersized).toBeLessThan(total);
  });
  it('D3 — 캔 갯것 미끼: 성게 = urchin · 홍합 · 굴 · 바지락 = shellfish · 소라 · 거북손 = crab · 그 밖은 아니다', () => {
    expect(forageBaitKeyOf('heliocidaris_crassispina')).toBe('urchin');
    expect(forageBaitKeyOf('strongylocentrotus_nudus')).toBe('urchin');
    expect(forageBaitKeyOf('mytilus_coruscus')).toBe('shellfish');
    expect(forageBaitKeyOf('oyster_gigas')).toBe('shellfish');
    expect(forageBaitKeyOf('clam_varicosa')).toBe('shellfish');
    expect(forageBaitKeyOf('turbo_cornutus')).toBe('crab');
    expect(forageBaitKeyOf('capitulum_mitella')).toBe('crab');
    expect(forageBaitKeyOf('haliotis_discus')).toBeUndefined();
    expect(forageBaitKeyOf(undefined)).toBeUndefined();
  });
  it('D3 — 성게 미끼가 돌돔 몫을 크게 올린다(이제 실제로 꿸 수 있다)', () => {
    const reef = ctx({ region: 'jeju', month: 8, depthZ: 10, zMax: 12 });
    expect(speciesBiteShare({ ...reef, baitKey: 'urchin' }, 'stone_beakperch'))
      .toBeGreaterThan(speciesBiteShare({ ...reef, baitKey: 'krill' }, 'stone_beakperch') * 2);
  });
  it('D4 — 풍랑 통제: 파고 3m 이상 · 풍속 14m/s 이상이면 막는다', () => {
    expect(rodFishingClosure({ waveHeightM: 1.2, windSpeedMs: 6 })).toBeNull();
    expect(rodFishingClosure({ waveHeightM: 3.2, windSpeedMs: 6 })).toMatch(/파고 3\.2m/);
    expect(rodFishingClosure({ waveHeightM: 0.5, windSpeedMs: 15 })).toMatch(/풍속 15m\/s/);
  });
});
