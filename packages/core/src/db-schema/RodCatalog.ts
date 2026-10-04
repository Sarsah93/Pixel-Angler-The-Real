/**
 * @file RodCatalog.ts
 * @description 낚싯대 · 릴 제원표 (209차).
 *
 * - 상점 라인업(수산물 직판장 채비 코너) = `ROD_SHOP` 14자루 · `REEL_SHOP` 6개.
 * - 이미 있던 대(아버지 대 · 사이소 민물대 · 이야기 보상 · 수제)는 `ROD_SPEC_BY_ID`에 제원만 붙인다.
 * - 제원은 아이템에 저장하지 않는다 — id로 조회(구세이브 백필 불필요), 모르는 id는 이름 · 가격으로 추정.
 *
 * 수치 근거(현행 국내 제품 표기 관행):
 *  - 찌낚시대 호수 0.6~2호 · 5.0~5.3m · 적합 원줄 나일론 1.5~4호 · 찌 0.5~3호(≈2~12g) + 수중찌.
 *  - 원투대 호수 = **봉돌 호수**(15호 대 ≈ 10~20호 봉돌) · 3.6~4.5m · 원줄 3~8호. 봉돌 1호 = 3.75g.
 *  - 쇼어지깅 9.6~10ft MH/H · 지그 30~110g · PE 1.5~4호 / 라이트게임 7.6ft UL · 0.5~7g · PE 0.2~0.6호.
 *  - 에깅 8.3ft M · 에기 2.5~3.5호(≈10~20g) / 타이라바 6.6ft ML 베이트 · 45~150g / 슬로우지깅 6.3ft #3 · 100~250g.
 * 순수 TS — 렌더 없음.
 */

import type { ReelCatalogEntry, ReelItemSpec, RodCatalogEntry, RodItemSpec, RodUse } from '../types/RodItem.js';

const rod = (
  use: RodUse, lengthM: number, grade: string, lineNo: [number, number], lineBasis: 'nylon' | 'pe',
  loadG: [number, number], powerKg: number, pieces: number, telescopic: boolean, weightG: number,
  reel: 'spinning' | 'bait' = 'spinning',
): RodItemSpec => ({ use, lengthM, grade, lineNo, lineBasis, loadG, powerKg, reel, pieces, telescopic, weightG });

/** 상점 낚싯대 14자루 — 용도 8갈래 */
export const ROD_SHOP: RodCatalogEntry[] = [
  // ── 갯바위 · 방파제 찌낚시대(이소대) ──
  { id: 'rod_iso_06_50', nameKo: '해원 갯바위 0.6호 5.0m', priceWon: 168000,
    spec: rod('float_iso', 5.0, '0.6호', [1.5, 2], 'nylon', [1, 8], 3.2, 5, true, 175),
    descKo: '낭창한 저호수 찌낚시대. 벵에돔 · 학꽁치처럼 입이 약한 고기를 가벼운 찌로 노린다.' },
  { id: 'rod_iso_1_53', nameKo: '해원 갯바위 1호 5.3m', priceWon: 135000,
    spec: rod('float_iso', 5.3, '1호', [2, 2.5], 'nylon', [2, 12], 4.2, 5, true, 190),
    descKo: '방파제 감성돔 · 벵에돔 범용 찌낚시대. 구멍찌 0.5~2호 채비가 제 무게다.' },
  { id: 'rod_iso_15_53', nameKo: '해원 갯바위 1.5호 5.3m', priceWon: 158000,
    spec: rod('float_iso', 5.3, '1.5호', [2, 3], 'nylon', [3, 15], 5.4, 5, true, 205),
    descKo: '허리힘이 받쳐 주는 표준 찌낚시대. 조류가 센 갯바위에서 찌를 세워 흘리기 좋다.' },
  { id: 'rod_iso_2_53', nameKo: '해원 갯바위 2호 5.3m', priceWon: 210000,
    spec: rod('float_iso', 5.3, '2호', [3, 4], 'nylon', [4, 20], 6.6, 5, true, 230),
    descKo: '참돔 · 대형 감성돔용 강한 찌낚시대. 무거운 수중찌와 굵은 목줄을 받는다.' },
  // ── 원투대 ──
  { id: 'rod_surf_15_36', nameKo: '크로스캐스트 원투 15호 3.6m', priceWon: 39000,
    spec: rod('surf', 3.6, '15호', [3, 5], 'nylon', [38, 75], 8, 4, true, 310),
    descKo: '입문 원투대. 10~20호 봉돌을 받는다. 거치대에 걸어 두고 초릿대로 입질을 본다.' },
  { id: 'rod_surf_25_405', nameKo: '크로스캐스트 원투 25호 4.05m', priceWon: 98000,
    spec: rod('surf', 4.05, '25호', [4, 6], 'nylon', [56, 113], 10, 3, false, 345),
    descKo: '모래사장 · 방파제 원투 표준. 15~30호 봉돌로 100m 가까이 던진다.' },
  { id: 'rod_surf_30_425', nameKo: '서프마스터 원투 30호 4.25m', priceWon: 245000,
    spec: rod('surf', 4.25, '30호', [4, 8], 'nylon', [75, 131], 12, 3, false, 390),
    descKo: '고탄성 원투 전용대. 20~35호 봉돌을 끝까지 실어 던지는 장타 대.' },
  // ── 쇼어지깅대 ──
  { id: 'rod_shorejig_96mh', nameKo: '블루러너 쇼어지깅 96MH', priceWon: 189000,
    spec: rod('shore_jigging', 2.9, 'MH', [1.5, 2.5], 'pe', [30, 80], 14, 2, false, 260),
    descKo: '방파제 · 갯바위에서 메탈지그를 멀리 던져 청물(방어 · 부시리 · 삼치)을 노린다.' },
  { id: 'rod_shorejig_100h', nameKo: '블루러너 쇼어지깅 100H', priceWon: 238000,
    spec: rod('shore_jigging', 3.05, 'H', [2, 4], 'pe', [40, 110], 18, 2, false, 300),
    descKo: '무거운 지그와 대형 청물을 위한 강한 쇼어지깅대. 손목에 오는 부담도 크다.' },
  // ── 라이트게임 · 에깅 ──
  { id: 'rod_light_76ul', nameKo: '문라이트 라이트게임 76UL', priceWon: 84000,
    spec: rod('shore_light', 2.29, 'UL', [0.2, 0.6], 'pe', [0.5, 7], 2, 2, false, 92),
    descKo: '볼락 · 전갱이 지그헤드 전용. 1g 남짓한 채비의 무게를 손끝까지 전해 준다.' },
  { id: 'rod_eging_83m', nameKo: '아오리 에깅 83M', priceWon: 118000,
    spec: rod('eging', 2.52, 'M', [0.5, 1], 'pe', [8, 25], 5, 2, false, 118),
    descKo: '에기 2.5~3.5호를 쳐올리기 좋은 빳빳한 허리. 무늬오징어 전용대.' },
  // ── 선상 베이트대 ──
  { id: 'rod_boat_tairaba_66', nameKo: '레드씨 타이라바 66ML 베이트', priceWon: 162000,
    spec: rod('boat_bait', 2.01, 'ML', [0.8, 1.5], 'pe', [45, 150], 10, 2, false, 135, 'bait'),
    descKo: '타이라바를 바닥에서 일정하게 감아 올리는 낭창한 베이트대. 던지는 대가 아니다 — 발밑에 내린다.' },
  { id: 'rod_boat_slowjig_63', nameKo: '딥슬로우 슬로우지깅 63#3 베이트', priceWon: 245000,
    spec: rod('boat_bait', 1.91, '#3', [1.5, 2.5], 'pe', [100, 250], 16, 1, false, 175, 'bait'),
    descKo: '무거운 지그를 느리게 띄우는 슬로우지깅 전용 베이트대. 깊은 곳 대물 바닥고기용.' },
  // ── 구멍치기대 ──
  { id: 'rod_hole_21', nameKo: '틈새 구멍치기대 2.1m', priceWon: 28000,
    spec: rod('hole', 2.1, '경질', [3, 5], 'nylon', [4, 30], 6.5, 4, true, 140),
    descKo: '짧고 뻣뻣한 테트라포드 구멍치기 전용대. 걸면 바로 틈에서 뽑아낸다.' },
];

/** 상점 릴 6개 */
const reel = (kind: 'spinning' | 'bait', size: number, maxDragKg: number, gearRatio: number, lineCapM: number, castMult: number): ReelItemSpec =>
  ({ kind, size, maxDragKg, gearRatio, lineCapM, castMult });

export const REEL_SHOP: ReelCatalogEntry[] = [
  { id: 'reel_spin_1000', nameKo: '문라이트 1000S 스피닝릴', priceWon: 72000, spec: reel('spinning', 1000, 3, 5.2, 100, 0.97),
    descKo: '라이트게임용 소형 스피닝릴. 가는 PE와 1~5g 채비에 맞춘 가벼운 몸.' },
  { id: 'reel_spin_2500', nameKo: '다이오 2500LBD 레버브레이크', priceWon: 128000, spec: reel('spinning', 2500, 5, 5.1, 150, 1),
    descKo: '찌낚시 표준 레버브레이크 릴. 손가락으로 줄을 풀어 주며 고기를 띄운다.' },
  { id: 'reel_spin_3000', nameKo: '다이오 3000 범용 스피닝릴', priceWon: 86000, spec: reel('spinning', 3000, 7, 5.3, 180, 1),
    descKo: '에깅 · 가벼운 원투 · 찌낚시를 두루 받는 범용 릴.' },
  { id: 'reel_surf_5000', nameKo: '서프마스터 5000 원투 전용릴', priceWon: 168000, spec: reel('spinning', 5000, 10, 4.1, 300, 1.08),
    descKo: '롱캐스트 스풀을 단 원투 전용 대형 릴. 스풀이 길어 줄이 덜 걸리고 멀리 나간다.' },
  { id: 'reel_sw_4000hg', nameKo: '블루러너 4000HG 쇼어지깅릴', priceWon: 215000, spec: reel('spinning', 4000, 12, 5.8, 200, 1.03),
    descKo: '고기어 · 강한 드랙의 쇼어지깅릴. 지그를 빠르게 감아 올리고 청물의 첫 질주를 버틴다.' },
  { id: 'reel_bait_150', nameKo: '레드씨 150 베이트릴', priceWon: 178000, spec: reel('bait', 150, 9, 6.3, 200, 0.85),
    descKo: '타이라바 · 슬로우지깅용 베이트릴. 클러치를 눌러 발밑에 떨어뜨리고 일정하게 감는다. 베이트대에만 맞는다.' },
];

/** 이미 있던 대 · 보상 대 · 수제 대의 제원 */
const ROD_SPEC_EXTRA: Record<string, RodItemSpec> = {
  inv_rod: rod('float_iso', 5.3, '1.5호', [2, 3], 'nylon', [3, 15], 5.4, 5, true, 210),            // 아버지 대(용상 파조기)
  inv_rod_budget: rod('budget', 2.4, '경질', [2, 4], 'nylon', [3, 25], 2.4, 4, true, 160),         // 사이소 민물대
  qr_rod_heirloom: rod('float_iso', 5.3, '1.5호', [2, 3], 'nylon', [3, 16], 5.8, 5, true, 205),
  qr_rod_gamcheon: rod('float_iso', 5.0, '1.75호', [2.5, 3.5], 'nylon', [3, 18], 6.2, 5, true, 215),
  qr_rod_jig: rod('shore_jigging', 3.0, 'H', [2, 4], 'pe', [40, 120], 19, 2, false, 285),
  qr_rod_bamboo: rod('float_iso', 4.5, '2호', [2.5, 4], 'nylon', [3, 18], 6, 4, false, 330),        // 죽간 — 꽂기식
  qr_rod_surf: rod('surf', 4.25, '30호', [4, 8], 'nylon', [60, 131], 13, 3, false, 370),
  qr_rod_tournament: rod('float_iso', 5.3, '1.25호', [2, 3], 'nylon', [2, 14], 6, 5, true, 185),
  qr_rod_final: rod('surf', 4.5, '33호', [5, 8], 'nylon', [75, 150], 15, 3, false, 395),
  craft_rod_custom: rod('float_iso', 5.0, '1.5호', [2, 3], 'nylon', [3, 15], 5.6, 5, true, 200),
};

/** 이미 있던 릴 · 보상 릴 · 수제 릴 */
const REEL_SPEC_EXTRA: Record<string, ReelItemSpec> = {
  inv_reel: reel('spinning', 2500, 5, 5.1, 150, 1),
  inv_reel_budget: reel('spinning', 2000, 3, 5.0, 120, 0.95),
  qr_reel_heirloom: reel('spinning', 2500, 6, 5.1, 150, 1.02),
  qr_reel_winter: reel('spinning', 3000, 7, 5.3, 180, 1.02),
  qr_reel_captain: reel('spinning', 4000, 11, 6.2, 220, 1.03),
  qr_reel_tournament: reel('spinning', 3000, 8, 5.3, 180, 1.04),
  qr_reel_final: reel('spinning', 5000, 12, 4.4, 300, 1.08),
  craft_reel_custom: reel('spinning', 3000, 7, 5.3, 180, 1.02),
};

export const ROD_SPEC_BY_ID: Record<string, RodItemSpec> = {
  ...Object.fromEntries(ROD_SHOP.map((r) => [r.id, r.spec])),
  ...ROD_SPEC_EXTRA,
};
export const REEL_SPEC_BY_ID: Record<string, ReelItemSpec> = {
  ...Object.fromEntries(REEL_SHOP.map((r) => [r.id, r.spec])),
  ...REEL_SPEC_EXTRA,
};

/** 하네스 복제본(`inv_rod_budget_h0`)처럼 원본 id 뒤에 꼬리가 붙은 경우 원본을 찾는다 */
function lookupById<T>(table: Record<string, T>, id: string): T | undefined {
  if (table[id]) return table[id];
  const base = Object.keys(table).filter((k) => id.startsWith(`${k}_`)).sort((a, b) => b.length - a.length)[0];
  return base ? table[base] : undefined;
}

/**
 * 낚싯대 제원 — ① id 표 ② 이름 추정(원투 · 서프 / 지깅 / 에깅 / 라이트 / 타이라바 / 구멍 / 죽간) ③ 찌낚시대 기본.
 * 길이는 이름의 `N.Nm`를 읽고, 하중은 가격에서 옛 공식(2.2 + 가격/6만)으로 잡는다.
 */
export function rodSpecFor(id: string, nameKo = '', priceWon = 12000): RodItemSpec {
  const hit = lookupById(ROD_SPEC_BY_ID, id);
  if (hit) return hit;
  const lenM = Number(nameKo.match(/(\d+(?:\.\d+)?)\s*m\b/)?.[1] ?? NaN);
  const power = 2.2 + priceWon / 60000;
  if (/원투|서프/.test(nameKo)) return rod('surf', lenM || 4.05, '25호', [4, 6], 'nylon', [56, 113], Math.max(8, power), 3, false, 345);
  if (/지깅|지그/.test(nameKo)) return rod('shore_jigging', lenM || 2.9, 'MH', [1.5, 3], 'pe', [30, 90], Math.max(12, power), 2, false, 270);
  if (/타이라바|베이트/.test(nameKo)) return rod('boat_bait', lenM || 2.0, 'ML', [0.8, 1.5], 'pe', [45, 150], Math.max(9, power), 2, false, 140, 'bait');
  if (/에깅/.test(nameKo)) return rod('eging', lenM || 2.5, 'M', [0.5, 1], 'pe', [8, 25], 5, 2, false, 118);
  if (/라이트|볼락/.test(nameKo)) return rod('shore_light', lenM || 2.3, 'UL', [0.2, 0.6], 'pe', [0.5, 7], 2, 2, false, 92);
  if (/구멍/.test(nameKo)) return rod('hole', lenM || 2.1, '경질', [3, 5], 'nylon', [4, 30], 6.5, 4, true, 140);
  if (/민물|사이소/.test(nameKo)) return rod('budget', lenM || 2.4, '경질', [2, 4], 'nylon', [3, 25], 2.4, 4, true, 160);
  return rod('float_iso', lenM || 5.3, '1.5호', [2, 3], 'nylon', [3, 15], power, 5, true, 205);
}

/** 릴 제원 — ① id 표 ② 이름 추정(베이트 · 원투 · 번수) ③ 2500번 스피닝 기본 */
export function reelSpecFor(id: string, nameKo = ''): ReelItemSpec {
  const hit = lookupById(REEL_SPEC_BY_ID, id);
  if (hit) return hit;
  if (/베이트/.test(nameKo)) return reel('bait', 150, 8, 6.3, 200, 0.85);
  const size = Number(nameKo.match(/(\d{4})/)?.[1] ?? 2500);
  if (/원투|서프/.test(nameKo)) return reel('spinning', Math.max(4000, size), 10, 4.1, 300, 1.08);
  return reel('spinning', size, Math.round(size / 500), 5.2, Math.round(size / 17), 1);
}

/** 상점 · 도감용 */
export function getRodCatalogEntry(id: string): RodCatalogEntry | undefined {
  return ROD_SHOP.find((r) => r.id === id);
}
export function getReelCatalogEntry(id: string): ReelCatalogEntry | undefined {
  return REEL_SHOP.find((r) => r.id === id);
}
