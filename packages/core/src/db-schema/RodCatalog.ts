/**
 * @file RodCatalog.ts
 * @description 낚싯대 · 릴 제원표 (209차).
 *
 * - 상점 라인업(수산물 직판장 채비 코너) = `ROD_SHOP` 14자루 · `REEL_SHOP` 6개.
 * - 324차 큰 고기용 = `BIG_GAME_ROD_SHOP` 20자루 · `BIG_GAME_REEL_SHOP` 20개(돌돔 · 지깅 · 캐스팅 · 스탠드업 — 만든 곳별로 자중 · 내구도가 다르다).
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
import { itemBaseId } from '../rules/ItemInstance.js';

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

/**
 * 324차 — 큰 고기용 낚싯대(만든 곳 · 내구도 배수까지). 같은 급이라도 만든 곳마다 자중 · 내구도 · 받는 무게가 조금씩 다르다.
 * 만든 곳 이름은 전부 가상이다(크레딧 「게임 내 장비 브랜드명은 실존 브랜드와 무관한 가상의 명칭」).
 */
const bigRod = (
  brand: string, durabilityMult: number,
  use: RodUse, lengthM: number, grade: string, lineNo: [number, number], lineBasis: 'nylon' | 'pe',
  loadG: [number, number], powerKg: number, pieces: number, telescopic: boolean, weightG: number,
  reel: 'spinning' | 'bait' = 'spinning',
): RodItemSpec => ({ ...rod(use, lengthM, grade, lineNo, lineBasis, loadG, powerKg, pieces, telescopic, weightG, reel), brand, durabilityMult });

/**
 * 324차 큰 고기용 낚싯대 20자루 — 돌돔 원투 3 · 대물 찌낚시 2 · 지깅 4 · 캐스팅 5 · 스탠드업 3 · 쇼어지깅(만든 곳 다른 것) 2 · 원투 대물 1.
 * 「견디는 하중」은 줄 · 릴 드랙 중 약한 쪽이 이 값의 1.5배를 넘으면 파이팅 중 대가 먼저 부러질 수 있다는 뜻이다.
 */
export const BIG_GAME_ROD_SHOP: RodCatalogEntry[] = [
  // ── 돌돔 원투대(석조대) — 굵은 나일론 16~20호 + 양축릴 · 봉돌 30~50호 ──
  { id: 'rod_ishidai_nj_530', nameKo: '엔제이 흑조 돌돔 MH 5.3m', priceWon: 185000, art: 'item_rod_ishidai_nj',
    spec: bigRod('엔제이', 1.1, 'ishidai', 5.3, 'MH', [14, 20], 'nylon', [112, 170], 14, 5, false, 560, 'bait'),
    descKo: '돌돔 · 강담돔 원투 입문대. 무겁지만 값이 싸고 허리가 질기다. 봉돌 30~45호를 발밑 골에 던져 넣고 초릿대로 입질을 본다.' },
  { id: 'rod_ishidai_daio_525', nameKo: '다이오 대물 석조 H 5.25m', priceWon: 420000, art: 'item_rod_ishidai_daio',
    spec: bigRod('다이오', 1.0, 'ishidai', 5.25, 'H', [16, 24], 'nylon', [130, 190], 17, 5, false, 520, 'bait'),
    descKo: '큰 돌돔을 여에서 떼어 내는 강한 허리. 봉돌 35~50호 · 원줄 18~20호가 제 짝이다.' },
  { id: 'rod_ishidai_gama_500', nameKo: '가마모토 석조 스페셜 MH 5.0m', priceWon: 560000, art: 'item_rod_ishidai_gama',
    spec: bigRod('가마모토', 1.25, 'ishidai', 5.0, 'MH', [14, 22], 'nylon', [112, 170], 16, 5, false, 470, 'bait'),
    descKo: '가볍고 오래 가는 돌돔대. 초릿대가 예민해 성게를 쪼는 입질이 손에 온다.' },
  // ── 대물 찌낚시대 3호 — 참돔 · 부시리를 갯바위에서 ──
  { id: 'rod_iso_3_53', nameKo: '해원 갯바위 3호 5.3m', priceWon: 248000, art: 'item_rod_iso3_haewon',
    spec: bigRod('해원', 1.0, 'float_iso', 5.3, '3호', [4, 6], 'nylon', [5, 25], 9, 5, true, 265),
    descKo: '갯바위에서 큰 참돔 · 부시리를 받아 내는 굵은 찌낚시대. 원줄 5호 · 목줄 5호까지 쓴다.' },
  { id: 'rod_iso_gama_3_50', nameKo: '가마모토 대물 이소 3호 5.0m', priceWon: 520000, art: 'item_rod_iso3_gama',
    spec: bigRod('가마모토', 1.2, 'float_iso', 5.0, '3호', [4, 6], 'nylon', [5, 25], 9.5, 5, true, 240),
    descKo: '같은 3호라도 25g 가볍고 오래 간다. 종일 들고 있어도 팔이 덜 지친다.' },
  // ── 지깅대 — 무거운 메탈지그를 내려 저킹한다(방어 · 부시리 · 잿방어) ──
  { id: 'rod_jig_minor_b60', nameKo: '마이너크래프트 자이언트 지깅 B60/5', priceWon: 198000, art: 'item_rod_jig_minor',
    spec: bigRod('마이너크래프트', 1.0, 'offshore_jig', 1.83, '#5', [3, 5], 'pe', [120, 250], 16, 1, false, 215, 'bait'),
    descKo: '값 대비 든든한 양축 지깅대. 지그 150~200g으로 방어 · 부시리를 노린다.' },
  { id: 'rod_jig_yamano_s62', nameKo: '야마노블랭크 갈라하드 지깅 S62/4', priceWon: 465000, art: 'item_rod_jig_yamano',
    spec: bigRod('야마노블랭크', 1.15, 'offshore_jig', 1.88, '#4', [2.5, 4], 'pe', [100, 200], 15, 1, false, 190),
    descKo: '스피닝 지깅대. 가볍고 탄력이 좋아 지그를 길게 날린다 — 종일 저킹해도 덜 지친다.' },
  { id: 'rod_jig_somano_b61', nameKo: '소마노 오션지거 B61-5', priceWon: 520000, art: 'item_rod_jig_somano',
    spec: bigRod('소마노', 1.2, 'offshore_jig', 1.85, '#5', [3, 6], 'pe', [150, 300], 20, 1, false, 205, 'bait'),
    descKo: '깊은 곳 큰 잿방어용 양축 지깅대. 지그 200~300g을 받고 허리로 고기를 띄운다.' },
  { id: 'rod_jig_nj_s58', nameKo: '엔제이 보카 지깅 S58/6', priceWon: 235000, art: 'item_rod_jig_nj',
    spec: bigRod('엔제이', 1.1, 'offshore_jig', 1.73, '#6', [4, 6], 'pe', [180, 350], 22, 1, false, 260),
    descKo: '짧고 굵은 스피닝 지깅대. 무겁지만 힘으로 버티는 싸움에 강하다.' },
  // ── 캐스팅대(포핑 · 펜슬) — 큰 플러그를 던져 수면을 친다 ──
  { id: 'rod_cast_minor_80h', nameKo: '마이너크래프트 자이언트 캐스팅 80H', priceWon: 215000, art: 'item_rod_cast_minor',
    spec: bigRod('마이너크래프트', 1.0, 'offshore_cast', 2.44, 'H', [4, 6], 'pe', [60, 120], 17, 2, false, 330),
    descKo: '부시리 · 방어 캐스팅 입문대. 펜슬 60~100g을 던진다. 참다랑어 어린 고기까지.' },
  { id: 'rod_cast_nj_82', nameKo: '엔제이 대양 캐스팅 82/6', priceWon: 268000, art: 'item_rod_cast_nj',
    spec: bigRod('엔제이', 1.1, 'offshore_cast', 2.5, 'H', [5, 6], 'pe', [70, 130], 19, 2, false, 345),
    descKo: '국산 캐스팅대. 조금 무겁지만 질겨서 막 쓰기 좋다.' },
  { id: 'rod_cast_yamano_82_8', nameKo: '야마노블랭크 블루스나이퍼 82/8', priceWon: 598000, art: 'item_rod_cast_yamano',
    spec: bigRod('야마노블랭크', 1.2, 'offshore_cast', 2.5, 'XH', [6, 8], 'pe', [80, 150], 23, 2, false, 340),
    descKo: '대부시리 · 50kg급 참다랑어용. 던질 때는 낭창하고 걸면 허리가 선다.' },
  { id: 'rod_cast_somano_83h', nameKo: '소마노 오션플러거 83H 튜나', priceWon: 780000, art: 'item_rod_cast_somano',
    spec: bigRod('소마노', 1.2, 'offshore_cast', 2.52, 'XXH', [8, 10], 'pe', [90, 180], 27, 2, false, 395),
    descKo: '참다랑어 100kg급을 보고 만든 캐스팅대. 합사 8~10호 · 드랙 25kg을 받는다.' },
  { id: 'rod_cast_daio_85_10', nameKo: '다이오 솔티가 캐스팅 85-10 튜나', priceWon: 890000, art: 'item_rod_cast_daio',
    spec: bigRod('다이오', 1.15, 'offshore_cast', 2.59, 'XXXH', [8, 12], 'pe', [100, 200], 30, 2, false, 425),
    descKo: '합사 12호 · 드랙 30kg까지 받는 가장 강한 캐스팅대. 여름 동해의 큰 참다랑어용.' },
  // ── 스탠드업 · 트롤링대 — 던지지 않는다. 레버 드랙 릴로 버틴다 ──
  { id: 'rod_bg_penson_50', nameKo: '펜슨 인터내셔널 스탠드업 50lb 1.68m', priceWon: 385000, art: 'item_rod_bg_penson',
    spec: bigRod('펜슨', 1.3, 'big_game', 1.68, '50lb', [14, 24], 'nylon', [80, 300], 24, 2, false, 880, 'bait'),
    descKo: '짧고 굵은 스탠드업대. 눈다랑어 · 청새치급. 롤러 가이드가 굵은 줄을 깎지 않는다.' },
  { id: 'rod_bg_somano_80', nameKo: '소마노 티아그로 스탠드업 80lb 1.70m', priceWon: 720000, art: 'item_rod_bg_somano',
    spec: bigRod('소마노', 1.3, 'big_game', 1.7, '80lb', [24, 40], 'nylon', [100, 400], 31, 2, false, 1050, 'bait'),
    descKo: '참다랑어 · 황새치 100kg급을 버티는 스탠드업대. 드랙 30kg을 걸고도 허리가 남는다.' },
  { id: 'rod_bg_daio_130', nameKo: '다이오 솔티가 트롤링 130lb 1.75m', priceWon: 980000, art: 'item_rod_bg_daio',
    spec: bigRod('다이오', 1.25, 'big_game', 1.75, '130lb', [40, 60], 'nylon', [150, 500], 38, 2, false, 1280, 'bait'),
    descKo: '가장 굵은 트롤링대. 200kg이 넘는 고기를 보고 만들었다 — 무겁고, 그만큼 부러지지 않는다.' },
  // ── 쇼어지깅(같은 급 · 다른 만든 곳) · 원투 대물 ──
  { id: 'rod_shorejig_minor_100h', nameKo: '마이너크래프트 쇼어 100H', priceWon: 225000, art: 'item_rod_shorejig_minor',
    spec: bigRod('마이너크래프트', 0.95, 'shore_jigging', 3.05, 'H', [2, 4], 'pe', [40, 110], 18, 2, false, 285),
    descKo: '블루러너 100H와 같은 급. 15g 가볍지만 조금 덜 질기다.' },
  { id: 'rod_shorejig_yamano_106h', nameKo: '야마노블랭크 쇼어 106H', priceWon: 498000, art: 'item_rod_shorejig_yamano',
    spec: bigRod('야마노블랭크', 1.2, 'shore_jigging', 3.2, 'H', [2, 4], 'pe', [40, 120], 19, 2, false, 275),
    descKo: '갯바위에서 부시리를 거는 긴 쇼어대. 길어도 가볍고, 오래 간다.' },
  { id: 'rod_surf_somano_35_425', nameKo: '소마노 서프리더 원투 35호 4.25m', priceWon: 395000, art: 'item_rod_surf_somano',
    spec: bigRod('소마노', 1.2, 'surf', 4.25, '35호', [5, 10], 'nylon', [94, 150], 14, 3, false, 420),
    descKo: '봉돌 25~40호를 싣는 대물 원투대. 굵은 원줄로 큰 참돔 · 혹돔을 받는다.' },
];

/** 상점 릴 6개 */
const reel = (kind: 'spinning' | 'bait', size: number, maxDragKg: number, gearRatio: number, lineCapM: number, castMult: number): ReelItemSpec =>
  ({ kind, size, maxDragKg, gearRatio, lineCapM, castMult });

/** 324차 — 큰 고기용 릴(자중 · 만든 곳 · 내구도 배수 · 레버 드랙) */
const bigReel = (
  brand: string, durabilityMult: number, weightG: number,
  kind: 'spinning' | 'bait', size: number, maxDragKg: number, gearRatio: number, lineCapM: number, castMult: number, leverDrag = false,
): ReelItemSpec => ({ ...reel(kind, size, maxDragKg, gearRatio, lineCapM, castMult), weightG, brand, durabilityMult, ...(leverDrag ? { leverDrag: true } : {}) });

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

/**
 * 324차 큰 고기용 릴 20개 — 대형 스피닝 10 · 돌돔 양축 3 · 지깅 양축 3 · 레버 드랙 4.
 *  - 권사량(`lineCapM`)은 3호 환산이다 — 합사 N호는 `권사량 × 3 ÷ N` m가 감긴다(8000번 400 = 합사 4호 300m).
 *  - 양축 · 레버 드랙 릴의 `size`는 스피닝 번수의 1/20로 적는다(400 = 스피닝 8000번급 · 1000 = 20000번급) — 감기 부하 · 스풀 지름 식이 그 값을 쓴다.
 *    화면에는 이름의 호칭(2000 · 40 · 50W)이 나온다.
 */
export const BIG_GAME_REEL_SHOP: ReelCatalogEntry[] = [
  // ── 대형 스피닝 8000번(합사 4호 300m) ──
  { id: 'reel_sw_8000_daio_bg', nameKo: '다이오 블루기어 8000H', priceWon: 228000, art: 'item_reel_sw8000_daio_bg',
    spec: bigReel('다이오', 1.0, 650, 'spinning', 8000, 15, 5.3, 400, 1.03),
    descKo: '값싼 대형 스피닝릴. 드랙 15kg — 방어 · 부시리 캐스팅과 스피닝 지깅의 시작.' },
  { id: 'reel_sw_8000_penson', nameKo: '펜슨 스핀피셔 8500', priceWon: 298000, art: 'item_reel_sw8000_penson',
    spec: bigReel('펜슨', 1.25, 780, 'spinning', 8000, 18, 4.7, 440, 1.0),
    descKo: '통쇠 몸통. 130g 무겁고 느리지만 소금물과 모래에 강하다.' },
  { id: 'reel_sw_8000_somano', nameKo: '소마노 스텔론 SW 8000HG', priceWon: 1180000, art: 'item_reel_sw8000_somano',
    spec: bigReel('소마노', 1.35, 625, 'spinning', 8000, 25, 5.6, 400, 1.05),
    descKo: '같은 8000번인데 드랙 25kg · 25g 가볍다. 대부시리와 50kg급 참다랑어까지.' },
  // ── 14000번(합사 5~6호 300~400m) ──
  { id: 'reel_sw_14000_daio_bg', nameKo: '다이오 블루기어 14000', priceWon: 285000, art: 'item_reel_sw14000_daio_bg',
    spec: bigReel('다이오', 1.0, 865, 'spinning', 14000, 20, 5.7, 620, 1.03),
    descKo: '합사 6호를 300m 감는 보급형. 무겁지만 드랙 20kg이면 50kg급까지 버틴다.' },
  { id: 'reel_sw_14000_somano', nameKo: '소마노 트윈포스 SW 14000XG', priceWon: 760000, art: 'item_reel_sw14000_somano',
    spec: bigReel('소마노', 1.2, 675, 'spinning', 14000, 25, 6.2, 600, 1.05),
    descKo: '하이기어 14000번. 한 바퀴에 많이 감아 펜슬을 빠르게 끌고, 드랙 25kg을 건다.' },
  { id: 'reel_sw_14000_daio', nameKo: '다이오 솔티가 14000XH', priceWon: 1250000, art: 'item_reel_sw14000_daio',
    spec: bigReel('다이오', 1.3, 640, 'spinning', 14000, 25, 6.2, 667, 1.05),
    descKo: '통알루미늄 몸통. 14000번 가운데 가장 가볍고 오래 간다.' },
  // ── 18000~20000번(합사 8호 300m) ──
  { id: 'reel_sw_18000_penson', nameKo: '펜슨 스핀피셔 10500', priceWon: 365000, art: 'item_reel_sw18000_penson',
    spec: bigReel('펜슨', 1.25, 1090, 'spinning', 18000, 22, 4.2, 820, 0.98),
    descKo: '합사 8호를 300m 넘게 감는 통쇠 릴. 1kg이 넘어 팔이 먼저 지친다.' },
  { id: 'reel_sw_20000_daio', nameKo: '다이오 솔티가 20000H', priceWon: 1320000, art: 'item_reel_sw20000_daio',
    spec: bigReel('다이오', 1.3, 835, 'spinning', 20000, 30, 5.8, 800, 1.04),
    descKo: '드랙 30kg. 합사 8호 300m — 100kg급 참다랑어 캐스팅의 표준.' },
  { id: 'reel_sw_20000_somano', nameKo: '소마노 스텔론 SW 20000PG', priceWon: 1390000, art: 'item_reel_sw20000_somano',
    spec: bigReel('소마노', 1.35, 840, 'spinning', 20000, 28, 4.4, 800, 1.04),
    descKo: '파워 기어. 한 바퀴에 덜 감기는 대신 무거운 고기를 감을 때 덜 힘들다.' },
  // ── 30000번(합사 12호 400m) ──
  { id: 'reel_sw_30000_somano', nameKo: '소마노 스텔론 SW 30000', priceWon: 1480000, art: 'item_reel_sw30000_somano',
    spec: bigReel('소마노', 1.35, 985, 'spinning', 30000, 30, 4.4, 1600, 1.02),
    descKo: '가장 큰 스피닝릴. 합사 12호를 400m 감는다 — 큰 참다랑어가 300m를 끌고 나가도 남는다.' },
  // ── 돌돔 양축릴(나일론 20호 200m) ──
  { id: 'reel_ishidai_banex_30', nameKo: '바넥스 돌돔 스페셜 30', priceWon: 215000, art: 'item_reel_ishidai_banex',
    spec: bigReel('바넥스', 1.05, 720, 'bait', 450, 14, 4.1, 1200, 0.88),
    descKo: '국산 돌돔 양축릴. 나일론 18호를 200m 감는다. 무겁지만 값이 절반이다.' },
  { id: 'reel_ishidai_daio_40', nameKo: '다이오 석조 40 양축릴', priceWon: 398000, art: 'item_reel_ishidai_daio',
    spec: bigReel('다이오', 1.2, 660, 'bait', 500, 16, 4.3, 1333, 0.9),
    descKo: '돌돔 전용 양축릴. 굵은 나일론 20호를 200m 감고 드랙 16kg으로 여에서 떼어 낸다.' },
  { id: 'reel_ishidai_somano_3000t', nameKo: '소마노 해혼 3000T 양축릴', priceWon: 520000, art: 'item_reel_ishidai_somano',
    spec: bigReel('소마노', 1.25, 640, 'bait', 500, 18, 4.4, 1400, 0.92),
    descKo: '드랙 18kg · 스풀이 매끄러워 무거운 봉돌이 조금 더 나간다.' },
  // ── 지깅 양축릴(합사 3~4호 400m) ──
  { id: 'reel_jig_banex_300', nameKo: '바넥스 카이젠 지깅 300', priceWon: 168000, art: 'item_reel_jig_banex',
    spec: bigReel('바넥스', 1.0, 480, 'bait', 350, 9, 5.8, 380, 0.82),
    descKo: '가벼운 국산 지깅 양축릴. 방어 · 중치 부시리까지.' },
  { id: 'reel_jig_somano_2000', nameKo: '소마노 오션지거 2000NRHG', priceWon: 548000, art: 'item_reel_jig_somano',
    spec: bigReel('소마노', 1.3, 605, 'bait', 400, 10, 6.2, 400, 0.8),
    descKo: '지깅 양축릴의 표준. 합사 3호 400m · 클러치를 눌러 지그를 곧장 내린다.' },
  { id: 'reel_jig_daio_35', nameKo: '다이오 솔티가 지깅 35', priceWon: 498000, art: 'item_reel_jig_daio',
    spec: bigReel('다이오', 1.25, 620, 'bait', 450, 15, 6.3, 533, 0.8),
    descKo: '드랙 15kg — 큰 잿방어를 바닥에서 떼어 내는 힘 있는 지깅릴.' },
  // ── 레버 드랙 트롤링 · 스탠드업 릴 ──
  { id: 'reel_ld_daio_50', nameKo: '다이오 씨라인 LD 50', priceWon: 520000, art: 'item_reel_ld_daio',
    spec: bigReel('다이오', 1.2, 2350, 'bait', 1000, 22, 3.1, 3200, 0.45, true),
    descKo: '보급형 레버 드랙 릴. 드랙 22kg · 굵은 줄을 깊이 감는다 — 눈다랑어 · 청새치급.' },
  { id: 'reel_ld_penson_30', nameKo: '펜슨 인터내셔널 30', priceWon: 720000, art: 'item_reel_ld_penson30',
    spec: bigReel('펜슨', 1.4, 1650, 'bait', 700, 18, 3.8, 1700, 0.5, true),
    descKo: '금빛 몸통의 레버 드랙 릴. 드랙 18kg · 가벼워 스탠드업으로 들고 싸우기 좋다.' },
  { id: 'reel_ld_penson_50w', nameKo: '펜슨 인터내셔널 50W', priceWon: 890000, art: 'item_reel_ld_penson50',
    spec: bigReel('펜슨', 1.4, 2600, 'bait', 1000, 27, 3.1, 3600, 0.45, true),
    descKo: '드랙 27kg · 두 단 기어. 100kg급 참다랑어 · 황새치를 버티는 릴.' },
  { id: 'reel_ld_somano_80w', nameKo: '소마노 티아그로 80W', priceWon: 1450000, art: 'item_reel_ld_somano',
    spec: bigReel('소마노', 1.45, 4200, 'bait', 1500, 36, 2.5, 6900, 0.4, true),
    descKo: '드랙 36kg · 4kg이 넘는 가장 큰 릴. 200kg급을 보고 만든 것 — 130lb 트롤링대에만 어울린다.' },
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
  ...Object.fromEntries([...ROD_SHOP, ...BIG_GAME_ROD_SHOP].map((r) => [r.id, r.spec])),
  ...ROD_SPEC_EXTRA,
};
export const REEL_SPEC_BY_ID: Record<string, ReelItemSpec> = {
  ...Object.fromEntries([...REEL_SHOP, ...BIG_GAME_REEL_SHOP].map((r) => [r.id, r.spec])),
  ...REEL_SPEC_EXTRA,
};

/** 하네스 복제본(`inv_rod_budget_h0`)처럼 원본 id 뒤에 꼬리가 붙은 경우 원본을 찾는다 */
function lookupById<T>(table: Record<string, T>, rawId: string): T | undefined {
  const id = itemBaseId(rawId);   // 282차 — 개체 대 · 릴(`shop_rod_float_53#4`)은 번호를 떼고 찾는다
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
  // 324차 — 큰 고기용 대(이름에 종류가 적혀 있다 — 지깅 · 쇼어보다 먼저 본다)
  if (/돌돔|석조/.test(nameKo)) return rod('ishidai', lenM || 5.25, 'MH', [14, 22], 'nylon', [112, 170], Math.max(14, power), 5, false, 520, 'bait');
  if (/스탠드업|트롤링/.test(nameKo)) return rod('big_game', lenM || 1.7, '80lb', [24, 40], 'nylon', [100, 400], Math.max(24, power), 2, false, 1000, 'bait');
  if (/캐스팅|포핑/.test(nameKo)) return rod('offshore_cast', lenM || 2.5, 'H', [5, 8], 'pe', [70, 150], Math.max(18, power), 2, false, 350);
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
  const base = itemBaseId(id);
  return ROD_SHOP.find((r) => r.id === base) ?? BIG_GAME_ROD_SHOP.find((r) => r.id === base);
}
export function getReelCatalogEntry(id: string): ReelCatalogEntry | undefined {
  const base = itemBaseId(id);
  return REEL_SHOP.find((r) => r.id === base) ?? BIG_GAME_REEL_SHOP.find((r) => r.id === base);
}

/** 324차 — 큰 고기용 장비인가(낚시용품점이 이것들을 판다) */
export function isBigGameGear(id: string): boolean {
  const base = itemBaseId(id);
  return BIG_GAME_ROD_SHOP.some((r) => r.id === base) || BIG_GAME_REEL_SHOP.some((r) => r.id === base);
}
