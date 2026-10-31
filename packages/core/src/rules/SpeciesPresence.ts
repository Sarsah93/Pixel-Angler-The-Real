/**
 * @file SpeciesPresence.ts
 * @description 289차 — 어종 「존재」 가중(바다 · 계절 · 수온). 입질 감사(288 — `.agents/inputs/288_bite_audit.md`)의
 * 「달이 어종을 바꾸지 않는다(분포 차 0 %) · 수온을 쓰지 않는다 · 지역 차는 통계뿐」을 메운다.
 *
 * 사용자 결정(2026-10-30 · 추천대로):
 * - D1 철 · 바다 밖 어종은 **아예 0이 아니라 드물게**(하한) — 이야기가 찾는 어종은 그 자리에서도 아주 드물지는 않다.
 * - D2 수온 = 지역 × 달 **연안 평년 수온**(근사) — 실측 관측값이 있으면 그 값이 앞선다(호출부가 `waterTempC`로 넘긴다).
 * - D5 통계(KOSIS) 어획 가중은 약한 보정(1.0~1.3)으로 남긴다 — 지역의 주 신호는 이 표(바다 가중)다.
 * - D6 에기 어종(무늬오징어 · 한치 · 갑오징어 · 문어 · 살오징어)도 같은 바다 가중을 받는다.
 *
 * 존재 = 바다 가중 × 계절 가중 × 수온 가중(각 하한) — 스폰 가중(`FishSpawningOracle.intrinsicWeight` 밖)에 곱한다.
 * 수치는 실측 근사(mockup) — `TUNING.presence`로 조율한다.
 */
import { FISH_DATABASE } from '../db-schema/FishDatabase.js';
import { TUNING } from '../config/tuning.js';

/** 바다 — 동해 · 남해 · 서해 · 제주 · 울릉(294차 — 동해 먼바다: 울릉도 · 독도. 난류를 타고 오는 돔류 · 등푸른 생선이 연안 동해보다 많다) */
export type SeaKey = 'east' | 'south' | 'west' | 'jeju' | 'ulleung';

export const SEA_LABEL_KO: Readonly<Record<SeaKey, string>> = { east: '동해', south: '남해', west: '서해', jeju: '제주', ulleung: '울릉 · 독도' };
export const SEA_LABEL_EN: Readonly<Record<SeaKey, string>> = { east: 'East Sea', south: 'South Sea', west: 'Yellow Sea', jeju: 'Jeju', ulleung: 'Ulleung · Dokdo' };

/**
 * 지역 id → 바다. 부산은 남해 동부, 울산부터 위는 동해, 태안 · 인천은 서해.
 * 홈타운(속초 근교 — 이야기의 집)은 동해로 본다.
 */
export function seaOf(regionId: string | undefined | null): SeaKey {
  const r = regionId ?? '';
  if (/jeju|seogwipo|moseulpo/.test(r)) return 'jeju';
  if (/ulleung|dokdo/.test(r)) return 'ulleung';   // 294차 — 동해 먼바다(울릉 · 독도)는 연안 동해와 가른다
  if (/incheon|taean|chungnam|gunsan|jeonbuk|mokpo|boryeong|seosan/.test(r)) return 'west';
  if (/gangwon|sokcho|gangneung|donghae|samcheok|pohang|gyeongbuk|uljin|ulsan|hometown/.test(r)) return 'east';
  return 'south';   // busan · gyeongnam · geoje · tongyeong · namhae · yeosu · jeonnam · wando — 그 밖도 남해로 둔다
}

/**
 * 종별 바다 가중(0~1) — 1 = 그 바다의 주 어장 · 0.5 = 흔하진 않다 · 0.05 이하 = 거의 오지 않는다(하한이 「드물게」로 받친다).
 * 근거: 국립수산과학원 어종 정보 · 해역별 어획 통계 · 낚시 조황(288 감사 §2 F03의 메모 포함). 근사값.
 */
// 294차 — `ulleung` 열(울릉 · 독도): 웹 조사(울릉 삼각망 우점 참돔 · 방어 · 한치 · 전갱이 / 독도 10~20m 조사 방어 · 부시리 · 돌돔 · 참돔 / 울릉 벵에돔 토너먼트 ·
//  긴꼬리벵에돔 · 강담돔 토종화 / 저동항 광어 「거의 없음」 / 갯벌 종 없음). 제주는 광어 · 우럭 · 감성돔을 낮췄다(돌돔 · 벵에돔 위주 · 우럭은 방류 수준).
//  DB에 없는 주요 종(자리돔 · 혹돔 · 옥돔 · 참다랑어 · 독도새우)은 잔여 — 이 표에 못 넣었다.
export const SPECIES_SEA_WEIGHT: Readonly<Record<string, Readonly<Record<SeaKey, number>>>> = {
  stone_beakperch: { east: 0.5, south: 1, west: 0.25, jeju: 1, ulleung: 0.8 },          // 돌돔
  spotted_knifejaw: { east: 0.08, south: 0.5, west: 0.03, jeju: 1, ulleung: 0.3 },      // 강담돔 — 제주 · 남해 먼바다
  amberjack: { east: 0.5, south: 0.9, west: 0.15, jeju: 1, ulleung: 0.8 },              // 부시리
  red_seabream: { east: 0.5, south: 1, west: 0.6, jeju: 1, ulleung: 0.7 },              // 참돔
  chub_mackerel: { east: 0.8, south: 1, west: 0.6, jeju: 1, ulleung: 0.7 },             // 고등어
  horse_mackerel: { east: 0.7, south: 1, west: 0.4, jeju: 1, ulleung: 0.9 },            // 전갱이
  rainbow_wrasse: { east: 0.7, south: 1, west: 0.5, jeju: 1, ulleung: 0.8 },            // 용치놀래기
  grass_puffer: { east: 0.8, south: 1, west: 0.8, jeju: 0.7, ulleung: 0.5 },            // 복섬
  tiger_puffer: { east: 0.3, south: 1, west: 0.9, jeju: 0.5, ulleung: 0.1 },            // 참복(자주복) — 서남해
  conger_eel: { east: 0.6, south: 1, west: 1, jeju: 0.6, ulleung: 0.3 },                // 붕장어
  yellowfin_goby: { east: 0.4, south: 0.9, west: 1, jeju: 0.1, ulleung: 0.02 },          // 문절망둑 — 하구 · 갯벌
  surfperch: { east: 1, south: 1, west: 0.6, jeju: 0.5, ulleung: 0.6 },                 // 망상어
  scorpionfish: { east: 0.8, south: 1, west: 0.5, jeju: 1, ulleung: 0.5 },              // 쏨뱅이
  fat_greenling: { east: 1, south: 0.8, west: 1, jeju: 0.3, ulleung: 0.6 },             // 쥐노래미
  greenling: { east: 1, south: 0.9, west: 1, jeju: 0.4, ulleung: 0.6 },                 // 노래미
  golden_rockfish: { east: 0.8, south: 0.8, west: 0.3, jeju: 0.6, ulleung: 0.6 },       // 황볼락
  blue_rockfish: { east: 1, south: 1, west: 0.6, jeju: 0.5, ulleung: 0.7 },             // 청볼락
  black_rockfish: { east: 0.8, south: 0.8, west: 1, jeju: 0.15, ulleung: 0.4 },          // 조피볼락(우럭) — 서해 대표
  flatfish: { east: 0.8, south: 1, west: 1, jeju: 0.5, ulleung: 0.15 },                    // 광어
  flounder: { east: 0.6, south: 1, west: 0.9, jeju: 0.2, ulleung: 0.2 },                // 문치가자미
  frog_flounder: { east: 0.5, south: 1, west: 0.6, jeju: 0.4, ulleung: 0.2 },           // 도다리
  starry_flounder: { east: 1, south: 0.2, west: 0.1, jeju: 0.02, ulleung: 0.1 },        // 강도다리 — 동해 냉수
  tonguefish: { east: 0.05, south: 0.6, west: 1, jeju: 0.1, ulleung: 0.02 },             // 개서대 — 서해 갯벌
  pike_conger: { east: 0.1, south: 1, west: 0.5, jeju: 0.6, ulleung: 0.05 },             // 갯장어 — 여수 · 고흥
  pacific_saury: { east: 1, south: 0.3, west: 0.05, jeju: 0.3, ulleung: 0.6 },          // 꽁치 — 동해
  blackthroat_seaperch: { east: 0.6, south: 0.9, west: 0.3, jeju: 0.8, ulleung: 0.7 },  // 눈볼대 — 깊은 바다
  round_herring: { east: 0.3, south: 0.9, west: 0.2, jeju: 1, ulleung: 0.3 },           // 눈퉁멸
  pacific_cod: { east: 1, south: 0.6, west: 0.5, jeju: 0.02, ulleung: 0.3 },            // 태평양 대구 — 동해 · 진해만 겨울 · 서해 깊은 곳
  korean_pomfret: { east: 0.05, south: 1, west: 0.8, jeju: 0.4, ulleung: 0.02 },         // 덕대
  silver_pomfret: { east: 0.05, south: 0.9, west: 1, jeju: 0.3, ulleung: 0.02 },         // 병어
  sandfish: { east: 1, south: 0.05, west: 0.02, jeju: 0.02, ulleung: 0.1 },             // 도루묵 — 동해
  black_scraper: { east: 0.6, south: 1, west: 0.3, jeju: 0.9, ulleung: 0.6 },           // 말쥐치
  largescale_blackfish: { east: 0.35, south: 1, west: 0.1, jeju: 1, ulleung: 1 },     // 벵에돔
  longtail_blackfish: { east: 0.03, south: 0.3, west: 0.01, jeju: 1, ulleung: 0.5 },    // 긴꼬리벵에돔 — 제주 · 남해 먼바다 섬(연안은 드물다)
  hairtail: { east: 0.15, south: 1, west: 0.5, jeju: 1, ulleung: 0.1 },                 // 갈치
  yellowtail: { east: 0.9, south: 0.8, west: 0.15, jeju: 1, ulleung: 0.9 },             // 방어 — 강원 · 모슬포
  red_snapper_rockfish: { east: 1, south: 0.9, west: 0.2, jeju: 0.5, ulleung: 0.7 },    // 열기(불볼락)
  sea_bass: { east: 0.7, south: 1, west: 1, jeju: 0.8, ulleung: 0.3 },                  // 농어
  striped_mullet: { east: 0.9, south: 1, west: 1, jeju: 0.8, ulleung: 0.3 },            // 숭어(보리숭어)
  redlip_mullet: { east: 0.3, south: 0.8, west: 1, jeju: 0.3, ulleung: 0.05 },           // 가숭어 — 서해
  filefish: { east: 0.6, south: 1, west: 0.5, jeju: 0.9, ulleung: 0.6 },                // 쥐치
  black_seabream: { east: 0.5, south: 1, west: 0.85, jeju: 0.35, ulleung: 0.3 },         // 감성돔
  squid: { east: 0.3, south: 1, west: 0.01, jeju: 1, ulleung: 0.15 },                    // 무늬오징어 — 남해 · 제주 · 동해 남부 가을
  octopus: { east: 0.3, south: 1, west: 0.8, jeju: 1, ulleung: 0.5 },                   // 돌문어(참문어)
  giant_octopus: { east: 1, south: 0.15, west: 0.05, jeju: 0.05, ulleung: 0.4 },        // 대문어 — 동해 냉수
  cuttlefish: { east: 0.08, south: 0.9, west: 1, jeju: 0.4, ulleung: 0.1 },             // 갑오징어 — 서해 · 남해
  swordtip_squid: { east: 0.02, south: 0.6, west: 0.01, jeju: 1, ulleung: 0.7 },        // 한치 — 제주 여름
  greater_amberjack: { east: 0.15, south: 0.6, west: 0.05, jeju: 1, ulleung: 0.6 },     // 잿방어 — 제주
  spanish_mackerel: { east: 0.5, south: 1, west: 0.8, jeju: 1, ulleung: 0.4 },          // 삼치
  yellowfin_puffer: { east: 0.6, south: 1, west: 0.7, jeju: 0.5, ulleung: 0.3 },        // 까치복
  bartail_flathead: { east: 0.4, south: 1, west: 1, jeju: 0.5, ulleung: 0.1 },          // 양태
  bluefin_searobin: { east: 0.6, south: 0.9, west: 1, jeju: 0.6, ulleung: 0.2 },        // 성대
  hagfish: { east: 1, south: 0.9, west: 0.4, jeju: 0.3, ulleung: 0.3 },                 // 먹장어
  halfbeak: { east: 0.8, south: 1, west: 0.6, jeju: 0.8, ulleung: 0.4 },                // 학꽁치
  northern_whiting: { east: 0.6, south: 1, west: 0.8, jeju: 0.8, ulleung: 0.1 },        // 보리멸
  flying_squid: { east: 1, south: 0.5, west: 0.02, jeju: 0.4, ulleung: 0.9 },           // 살오징어 — 동해 가을 밤
};

/**
 * 연안 평년 수온(℃ · 1~12월) — 국립수산과학원 연안 정지관측 · 국립해양조사원 관측소 월평균을 반올림한 근사.
 * 실측 관측값(세션 날씨 카드 `waterC`)이 있으면 호출부가 그 값을 넘기고 이 표는 쓰지 않는다.
 */
export const SST_CLIMATOLOGY_C: Readonly<Record<string, readonly number[]>> = {
  sokcho:  [10, 9, 9, 11, 14, 18, 21, 24, 22, 19, 16, 13],
  ulleung: [12, 11, 11, 12, 15, 19, 22, 25, 23, 20, 17, 14],
  pohang:  [12, 11, 11, 13, 16, 19, 21, 24, 23, 20, 17, 14],
  ulsan:   [13, 12, 12, 14, 16, 19, 21, 24, 23, 21, 18, 15],
  busan:   [14, 13, 13, 15, 17, 20, 22, 25, 24, 21, 18, 15],
  geoje:   [13, 12, 12, 14, 17, 20, 23, 26, 24, 21, 18, 15],
  yeosu:   [10, 9, 10, 13, 17, 21, 24, 26, 25, 21, 17, 13],
  taean:   [6, 5, 6, 9, 13, 17, 21, 24, 22, 18, 13, 9],
  incheon: [4, 3, 5, 9, 13, 18, 22, 25, 22, 17, 12, 7],
  jeju:    [15, 14, 14, 15, 18, 21, 25, 27, 26, 23, 20, 17],
};

/** 지역 id → 평년 수온 표의 열 */
export function sstStationOf(regionId: string | undefined | null): keyof typeof SST_CLIMATOLOGY_C {
  const r = regionId ?? '';
  if (/jeju|seogwipo|moseulpo/.test(r)) return 'jeju';
  if (/incheon/.test(r)) return 'incheon';
  if (/taean|chungnam|boryeong|seosan|gunsan/.test(r)) return 'taean';
  if (/yeosu|jeonnam|mokpo|wando|namhae/.test(r)) return 'yeosu';
  if (/geoje|gyeongnam|tongyeong/.test(r)) return 'geoje';
  if (/busan/.test(r)) return 'busan';
  if (/ulsan/.test(r)) return 'ulsan';
  if (/pohang|gyeongbuk|uljin/.test(r)) return 'pohang';
  if (/ulleung|dokdo/.test(r)) return 'ulleung';
  return seaOf(r) === 'east' ? 'sokcho' : seaOf(r) === 'west' ? 'taean' : seaOf(r) === 'jeju' ? 'jeju' : 'busan';
}

/**
 * 그날의 평년 수온 — 달 가운데(15일)를 기준점으로 이웃 달과 선형 보간한다(월초 · 월말이 계단처럼 튀지 않게).
 */
export function climatologySstC(regionId: string | undefined | null, month: number, day = 15): number {
  const row = SST_CLIMATOLOGY_C[sstStationOf(regionId)];
  const m = Math.min(12, Math.max(1, Math.round(month))) - 1;
  const d = Math.min(31, Math.max(1, day));
  const t = (d - 15) / 30;   // -0.47 ~ +0.53 — 다음 · 이전 달 쪽 비율
  const other = t >= 0 ? (m + 1) % 12 : (m + 11) % 12;
  const v = row[m] + (row[other] - row[m]) * Math.abs(t);
  return Math.round(v * 10) / 10;
}

const FISH_BY_ID = new Map(FISH_DATABASE.map((f) => [f.id, f]));

/** 바다 가중(하한 `seaFloor`) — 표에 없는 종은 1(정보 없음 = 막지 않는다) */
export function seaPresence(speciesId: string, regionId: string | undefined | null): number {
  const row = SPECIES_SEA_WEIGHT[speciesId];
  if (!row) return 1;
  return Math.max(TUNING.presence.seaFloor, row[seaOf(regionId)]);
}

/** 계절 가중 — 제철 1 · 앞뒤 한 달 `seasonAdjacent` · 그 밖 `seasonOff`. 제철 정보가 없으면 1 */
export function seasonPresence(speciesId: string, month: number): number {
  const peak = FISH_BY_ID.get(speciesId)?.peakSeasonMonths;
  if (!peak || peak.length === 0 || peak.length >= 12) return 1;
  const m = Math.min(12, Math.max(1, Math.round(month)));
  if (peak.includes(m)) return 1;
  const prev = m === 1 ? 12 : m - 1;
  const next = m === 12 ? 1 : m + 1;
  if (peak.includes(prev) || peak.includes(next)) return TUNING.presence.seasonAdjacent;
  return TUNING.presence.seasonOff;
}

/** 수온 가중 — 적수온 안 1 · 밖으로 `tempSpanC`도 벗어나면 하한 `tempFloor`까지 선형 */
export function tempPresence(speciesId: string, sstC: number): number {
  const r = FISH_BY_ID.get(speciesId)?.preferredTempC;
  if (!r || !Number.isFinite(sstC)) return 1;
  const [lo, hi] = r;
  const d = sstC < lo ? lo - sstC : sstC > hi ? sstC - hi : 0;
  if (d <= 0) return 1;
  const P = TUNING.presence;
  return Math.max(P.tempFloor, 1 - (d / P.tempSpanC) * (1 - P.tempFloor));
}

/** 존재 가중을 매길 문맥 — 스폰 문맥(`SpawnContext`)의 부분집합 */
export interface PresenceContext {
  region: string;
  month: number;
  day?: number;
  /** 실측 수온(℃) — 없으면 평년 수온 */
  waterTempC?: number;
  /** 진행 중인 이야기가 찾는 어종(그 자리에서도 `storyFloor` 아래로 내려가지 않는다 — D1) */
  storyTargets?: readonly string[];
  /** dev · 시험 — 존재 가중을 끈다 */
  presenceOff?: boolean;
}

/** 이 문맥의 수온(℃) — 실측이 있으면 실측, 없으면 평년 */
export function presenceSstC(ctx: Pick<PresenceContext, 'region' | 'month' | 'day' | 'waterTempC'>): number {
  return typeof ctx.waterTempC === 'number' && Number.isFinite(ctx.waterTempC)
    ? ctx.waterTempC : climatologySstC(ctx.region, ctx.month, ctx.day);
}

/** 존재 가중 성분 — 디버그 · 위키 · 시험용 */
export interface PresenceBreakdown { sea: number; season: number; temp: number; sstC: number; story: boolean; total: number }

export function presenceBreakdown(speciesId: string, ctx: PresenceContext): PresenceBreakdown {
  const sstC = presenceSstC(ctx);
  if (ctx.presenceOff) return { sea: 1, season: 1, temp: 1, sstC, story: false, total: 1 };
  const sea = seaPresence(speciesId, ctx.region);
  const season = seasonPresence(speciesId, ctx.month);
  const temp = tempPresence(speciesId, sstC);
  const story = !!ctx.storyTargets?.includes(speciesId);
  let total = Math.max(TUNING.presence.minPresence, sea * season * temp);
  if (story) total = Math.max(total, TUNING.presence.storyFloor);
  return { sea, season, temp, sstC, story, total };
}

/** 존재 가중(하한 `minPresence` · 이야기 목표는 `storyFloor`) — 스폰 가중에 곱한다 */
export function speciesPresence(speciesId: string, ctx: PresenceContext): number {
  return presenceBreakdown(speciesId, ctx).total;
}
