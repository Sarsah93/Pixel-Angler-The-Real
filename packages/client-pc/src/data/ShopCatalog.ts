/**
 * @file ShopCatalog.ts
 * @description 건물(상점) 종류별 판매/매입 카탈로그
 *
 * 건물 카테고리: 편의점 / 식자재마트 / 직판장 / 음식점 / 카페 / 주점.
 * 각 건물은 판매 품목(sells)과 매입 카테고리(buysCategories)가 다르다.
 * 상점 아이템은 재화로 구매하지 않는 한 인벤토리로 옮길 수 없다 (RPG 표준 구조).
 * 가격/품목은 목업 — 추후 @tra/core UniversalItemDatabase + API 연동으로 교체.
 */

import type { InvCategory, InvItemTemplate } from '../store/InventoryStore.js';
import { WEIGHT_SINKER_DB, TRAP_DATABASE } from '@tra/core';
import { applyItemVitals } from './ItemVitals.js';

/** 건물(상점) 종류 */
export type BuildingKind =
  | 'convenience' | 'mart' | 'market' | 'restaurant' | 'cafe' | 'pub' | 'pharmacy' | 'daily';

export const BUILDING_LABEL: Record<BuildingKind, string> = {
  convenience: '편의점',
  mart: '식자재마트',
  market: '직판장',
  restaurant: '음식점',
  cafe: '카페',
  pub: '주점',
  pharmacy: '약국',
  daily: '생활용품점',
};

/** 상점 판매 품목 (인벤토리 템플릿 + 가격/구매 한도) */
export interface ShopEntry extends InvItemTemplate {
  price: number;
  /**
   * 상점 해금 키 (141차) — 메인 퀘스트 `rewards.shopUnlocks`가 `unlock.shop.<key>` 플래그를 세우기 전엔
   * 구매 목록에 나타나지 않는다. 이야기가 여는 "구매 해금".
   */
  unlockKey?: string;
  /** 1회 구매 최대 수량 (1이면 단건 확인만) */
  maxPerPurchase: number;
  desc: string;
}

export interface ShopDef {
  kind: BuildingKind;
  name: string;
  greeting: string;
  sells: ShopEntry[];
  /** 매입 대상 카테고리 (비어 있으면 매입 안 함) */
  buysCategories: InvCategory[];
}

/** 무게추 봉돌 id → 상점 판매 항목 (채비 코너) */
function sinkerShopEntry(id: string): ShopEntry {
  const s = WEIGHT_SINKER_DB.find((x) => x.id === id)!;
  return {
    id: s.id, name: `${s.nameKo} (${s.weightG}g)`, icon: '🔩',
    category: 'tackle', subCategory: '채비 부속', basePrice: s.price,
    price: Math.round(s.price * 1.2), maxPerPurchase: 10, equippable: false,
    desc: `${s.brand} ${s.ho}호 원투 메인 싱커.${s.kind === 'hole' ? ' 이물감↓(예신 피드백 +15%).' : s.kind === 'bundle' ? ' 비거리 페널티(C_d 0.58).' : ''}`,
    sinkerKind: s.kind, sinkerWeightG: s.weightG, sinkerHo: s.ho,
  };
}

/**
 * 조합 사무 코너 (127차) — **조업 재교육 이수증** = 스킬 리스펙.
 * 아이콘은 이모지가 아니라 **짧은 한글 라벨**(AGENTS §4 「UI 특수문자·이모지 금지」).
 */
const GUILD_CORNER: ShopEntry[] = [
  {
    id: 'inv_skill_reset', name: '조업 재교육 이수증', icon: '증',
    category: 'etc', subCategory: '증서', basePrice: 160000,
    price: 200000, maxPerPurchase: 2, equippable: false, skillReset: true,
    desc: '조합 재교육 과정 수료증. 사용하면 지금까지 찍은 스킬 포인트를 전부 되돌려 받는다.',
  },
];

/** 직판장 채비 코너 — 무게추 봉돌(대표 호수) + 찌 + 좁쌀봉돌 + **줄·바늘 소모품**(116차) */
const TACKLE_CORNER: ShopEntry[] = [
  // 줄·바늘은 줄터짐/밑걸림으로 잃는 소모품인데 어디서도 다시 살 수 없었다(외부 테스터 — 목줄을 잃고
  //   채비를 못 채움). 호수 → 인장강도는 core lineStrengthKg 규칙(카본 1.8kg/호 · PE 9kg/호).
  { id: 'inv_pe1',      name: 'PE 합사 원줄 1호',  icon: '🧵', category: 'tackle', subCategory: '원줄 스풀', basePrice: 18000, price: 21000, maxPerPurchase: 3, equippable: false, desc: '원줄 스풀. PE 1호 ≈ 인장 9kg — 목줄보다 항상 강하게.' },
  { id: 'inv_carbon15', name: '카본 목줄 1.5호',   icon: '🧵', category: 'tackle', subCategory: '목줄 스풀', basePrice: 9000,  price: 10500, maxPerPurchase: 5, equippable: false, desc: '≈ 인장 2.7kg. 25~35cm 감성돔·볼락·광어용 표준.' },
  { id: 'inv_nylon2',   name: '나일론 목줄 2호',   icon: '🧵', category: 'tackle', subCategory: '목줄 스풀', basePrice: 6000,  price: 7000,  maxPerPurchase: 5, equippable: false, desc: '≈ 인장 3.6kg. 중형 돔·농어까지.' },
  { id: 'shop_carbon3', name: '카본 목줄 3호',     icon: '🧵', category: 'tackle', subCategory: '목줄 스풀', basePrice: 12000, price: 14000, maxPerPurchase: 5, equippable: false, desc: '≈ 인장 5.4kg. 방어·부시리·대물 돔 — 라이트 채비로는 못 버티는 어종용.' },
  { id: 'inv_chinu3',   name: '감성돔 바늘 3호',   icon: '🪝', category: 'tackle', subCategory: '바늘/훅',   basePrice: 3000,  price: 3500,  maxPerPurchase: 20, equippable: false, desc: '범용 바늘 (미끼 채비).' },
  ...['inv_sinker_ring_20', 'inv_sinker_ring_25', 'inv_sinker_hole_15', 'inv_sinker_hole_20',
    'inv_sinker_hole_25', 'inv_sinker_bundle_25'].map(sinkerShopEntry),
  { id: 'inv_float08', name: '구멍찌 0.8호', icon: '🟠', category: 'tackle', subCategory: '채비 부속', basePrice: 8000, price: 9000, maxPerPurchase: 10, equippable: false, desc: '얕은 수심·약한 조류용 저부력 구멍찌.', floatBuoyG: 8 },
  { id: 'shop_float10', name: '구멍찌 1.0호', icon: '🟠', category: 'tackle', subCategory: '채비 부속', basePrice: 8500, price: 9500, maxPerPurchase: 10, equippable: false, desc: '중간 수심·조류용 구멍찌.', floatBuoyG: 10 },
  { id: 'shop_float15', name: '구멍찌 1.5호', icon: '🟠', category: 'tackle', subCategory: '채비 부속', basePrice: 9000, price: 10000, maxPerPurchase: 10, equippable: false, desc: '깊은 수심·센 조류용 고부력 구멍찌.', floatBuoyG: 15 },
  { id: 'inv_subfloat', name: '수중찌 -0.8호', icon: '🟤', category: 'tackle', subCategory: '채비 부속', basePrice: 6000, price: 7000, maxPerPurchase: 10, equippable: false, desc: '부력찌 아래에 다는 침력체 — 찌는 수면에 세우고 채비만 조류에 태워 내린다 (선택 부품).', floatBuoyG: -8 },
  { id: 'inv_sinkerG2', name: '좁쌀봉돌 G2', icon: '⚙️', category: 'tackle', subCategory: '채비 부속', basePrice: 2000, price: 2500, maxPerPurchase: 20, equippable: false, desc: '찌낚시 목줄 미세 조정용 좁쌀 봉돌.' },
];

/** 직판장 채집·통발 코너 (121차) — 시행령 허용 도구(집게·갈고리·통발) + 헤드랜턴. 통발은 아이템 소유·설치 소모·수거 반환 */
const FORAGE_CORNER: ShopEntry[] = [
  { id: 'inv_headlamp', name: '헤드랜턴 (800lm)', icon: '🔦', category: 'etc', subCategory: '해루질 도구', basePrice: 25000, price: 28000, maxPerPurchase: 1, equippable: false, lampLumens: 800, desc: '야간 채집 필수 — 루멘이 발견 반경. 100lm당 약 0.55타일.' },
  { id: 'inv_tongs',    name: '채집 집게',        icon: '🥢', category: 'etc', subCategory: '해루질 도구', basePrice: 8000,  price: 9500,  maxPerPurchase: 1, equippable: false, forageTool: 'tongs', desc: '소라·홍합·성게·해삼. 맨손으로 성게를 집으면 가시에 찔린다.' },
  { id: 'inv_gaff',     name: '채집 갈고리',      icon: '🪝', category: 'etc', subCategory: '해루질 도구', basePrice: 12000, price: 14000, maxPerPurchase: 1, equippable: false, forageTool: 'gaff', desc: '바위틈 문어·전복. 뜰채보다 문어를 덜 놓친다.' },
  ...TRAP_DATABASE.map((t): ShopEntry => ({
    id: `inv_trap_${t.id}`, name: t.nameKo, icon: '🪤', category: 'etc', subCategory: '통발',
    basePrice: Math.round(t.priceWon * 0.8), price: t.priceWon, maxPerPurchase: 3, equippable: false, trapSpecId: t.id,
    desc: `${t.licenseTier === 'advanced' ? '심화 면허 필요. ' : ''}용량 ${(t.maxCapacityG / 1000).toFixed(1)}kg · 미끼 ${t.baitDurationHours}h · 최대 수심 ${t.maxDepthM}m.`,
  })),
];

export const SHOP_CATALOG: Record<BuildingKind, ShopDef> = {
  convenience: {
    kind: 'convenience',
    name: '항구 편의점',
    greeting: '24시간 영업합니다. 필요한 것 있으세요?',
    buysCategories: [],
    sells: [
      { id: 'inv_can',      name: '참치 통조림',   icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 2000, price: 2500, maxPerPurchase: 10, equippable: false, desc: '보존성 좋은 비상 식량.' },
      { id: 'inv_potion',   name: 'HP 회복 드링크', icon: '💊', category: 'consumable', subCategory: '의약품',   basePrice: 5000, price: 6000, maxPerPurchase: 5,  equippable: false, desc: 'HP를 40 회복한다.' },
      { id: 'inv_mosquito', name: '모기향',         icon: '🌀', category: 'consumable', subCategory: '야간 대비', basePrice: 2500, price: 3000, maxPerPurchase: 10, equippable: false, desc: '야간 낚시 모기 디버프 방지.' },
      { id: 'inv_seasick',  name: '멀미약',         icon: '💊', category: 'consumable', subCategory: '의약품',   basePrice: 4000, price: 5000, maxPerPurchase: 5,  equippable: false, desc: '선상 낚시 멀미 내성 10분.' },
      { id: 'shop_snackbar', name: '초코바',        icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 1200, price: 1500, maxPerPurchase: 10, equippable: false, hungerRestore: 12, hydrationRestore: -2, desc: '간단한 요기. 허기 +12.' },
      { id: 'shop_water',    name: '생수 500ml',    icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 900,  price: 1200, maxPerPurchase: 10, equippable: false, hungerRestore: 0, hydrationRestore: 30, desc: '수분 +30. 갈증 해소의 기본.' },
      { id: 'shop_riceball', name: '주먹밥',        icon: '🥫', category: 'food',       subCategory: '가공품',   basePrice: 1800, price: 2200, maxPerPurchase: 10, equippable: false, hungerRestore: 22, hydrationRestore: 2, desc: '허기 +22 · 수분 +2. 출조 전 간편식.' },
      { id: 'inv_ice_bulk',  name: '대용량 각얼음', icon: '🧊', category: 'consumable', subCategory: '보냉',     basePrice: 4000, price: 5000, maxPerPurchase: 5,  equippable: false, desc: '쿨러 얼음 넣기 재료 — 1개로 2시간 보냉.' },
    ],
  },
  mart: {
    kind: 'mart',
    name: '식자재마트',
    greeting: '식자재는 저희가 제일 쌉니다.',
    buysCategories: ['food'],
    sells: [
      // 141차 — 메인 해금 품목 (M1-07 부엌의 순서)
      { id: 'knife_yanagiba_pro', name: '야나기바 (장인 단조)', icon: '', category: 'etc', subCategory: '조리도구',
        basePrice: 260000, price: 260000, maxPerPurchase: 1, equippable: true, tool: 'knife', unlockKey: 'mart_pro_knife',
        desc: '정옥선이 말해 둔 물건. 특급 회는 칼에서 시작한다.' },
      { id: 'inv_veges',    name: '식자재 묶음 (대파/양파)', icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 5000, price: 6000, maxPerPurchase: 10, condition: 'fresh', equippable: false, desc: '요리 기본 재료 묶음.' },
      { id: 'shop_rice',    name: '쌀 1kg',                  icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 4000, price: 4800, maxPerPurchase: 10, equippable: false, desc: '요리 주재료.' },
      { id: 'shop_sauce',   name: '양념 세트',               icon: '🥬', category: 'food',       subCategory: '식자재',     basePrice: 7000, price: 8500, maxPerPurchase: 5,  equippable: false, desc: '요리 풍미를 올려주는 양념.' },
      // 제작 재료 (129차 P7) — 도면(CRAFT_BLUEPRINTS)이 소비한다. 채집·벌목·채굴이 붙기 전까지의 공급처.
      { id: 'inv_mat_wood',  name: '목재',       icon: '', iconTexture: 'px:it_wood', category: 'etc', subCategory: '재료', basePrice: 800,   price: 1000,  maxPerPurchase: 30, equippable: false, craftMaterial: true, desc: '부목·통발 틀 재료.' },
      { id: 'inv_mat_wire',  name: '철사',       icon: '', iconTexture: 'px:it_wire', category: 'etc', subCategory: '재료', basePrice: 1000,  price: 1300,  maxPerPurchase: 30, equippable: false, craftMaterial: true, desc: '통발 프레임·바늘 고정 재료.' },
      { id: 'inv_mat_resin', name: '에폭시 수지', icon: '', iconTexture: 'px:it_paint', category: 'etc', subCategory: '재료', basePrice: 4000,  price: 5000,  maxPerPurchase: 20, equippable: false, craftMaterial: true, desc: '로드 도장·루어 코팅 재료.' },
      { id: 'inv_mat_paint', name: '도료 세트',  icon: '', iconTexture: 'px:it_paint', category: 'etc', subCategory: '재료', basePrice: 5000,  price: 6000,  maxPerPurchase: 20, equippable: false, craftMaterial: true, desc: '루어 컬러링 재료.' },
      { id: 'inv_chum',     name: '집어제 (크릴 배합)',      icon: '🧂', category: 'consumable', subCategory: '집어제/밑밥', basePrice: 6000, price: 7000, maxPerPurchase: 10, equippable: false, desc: '어군 활성도 상승.' },
      { id: 'inv_breadbait', name: '빵가루 경단',            icon: '🍞', category: 'tackle',     subCategory: '반죽미끼',    basePrice: 3000, price: 3500, maxPerPurchase: 10, equippable: false, desc: '벵에돔·숭어용 반죽 미끼 — 잡어 성화를 피한다.' },
      { id: 'inv_can',      name: '참치 통조림 (묶음)',      icon: '🥫', category: 'food',       subCategory: '가공품',     basePrice: 2000, price: 2200, maxPerPurchase: 20, equippable: false, desc: '마트 대용량 특가.' },
      { id: 'inv_ice_bulk',   name: '대용량 각얼음',    icon: '🧊', category: 'consumable', subCategory: '보냉', basePrice: 4000, price: 4500, maxPerPurchase: 10, equippable: false, desc: '쿨러 얼음 넣기 재료 — 1개로 2시간 보냉 (마트 특가).' },
      { id: 'inv_coarse_salt', name: '굵은소금',        icon: '🧂', category: 'consumable', subCategory: '조미/손질', basePrice: 2000, price: 2500, maxPerPurchase: 10, equippable: false, desc: '문어 손질(소금 치대기) 재료 — 점액과 이물을 걷어낸다. 1회 1개 소모.' },
      { id: 'inv_bucket',     name: '낚시용 두레박',    icon: '🪣', category: 'etc', subCategory: '낚시도구', basePrice: 9000, price: 11000, maxPerPurchase: 1, equippable: false, desc: '바다 근처에서 쿨러에 해수를 채우는 도구 (소모되지 않음).' },
      { id: 'inv_cooler',     name: '쿨러 (아이스박스)', icon: '🛅', category: 'etc', subCategory: '낚시도구', basePrice: 45000, price: 55000, maxPerPurchase: 1, equippable: false, desc: '어획 보관(어창 9칸)·밑밥 배합의 필수 장비 — 해수/얼음을 채워 신선도를 유지한다.' },
      // 회칼 (조리도구) — 회뜨기 게이팅용. 등급이 높을수록 수율·슬라이스·등급 상향.
      { id: 'knife_utility',  name: '범용 막칼',        icon: '🔪', category: 'etc', subCategory: '조리도구', basePrice: 12000, price: 15000, maxPerPurchase: 1, equippable: true, tool: 'knife', desc: '손질은 되나 낭비가 많은 막칼 (수율 0.85).' },
      { id: 'knife_sashimi',  name: '회칼 (사시미)',    icon: '🔪', category: 'etc', subCategory: '조리도구', basePrice: 38000, price: 45000, maxPerPurchase: 1, equippable: true, tool: 'knife', desc: '표준 사시미 칼 — 회뜨기·회썰기 가능 (수율 1.0).' },
      { id: 'knife_yanagiba', name: '장인 야나기바',    icon: '🔪', category: 'etc', subCategory: '조리도구', basePrice: 120000, price: 150000, maxPerPurchase: 1, equippable: true, tool: 'knife', desc: '얇게 많이 뜨는 장인 야나기바 (수율 1.10 + 등급 보너스).' },
      // 사시미 접시 — 회 조각 플레이팅용 (방위당 소4/중5/대6/특대7점 — 요리 탭 사시미 만들기)
      { id: 'inv_plate_s',  name: '사시미 접시 (소)',   icon: '🍽️', category: 'etc', subCategory: '식기', basePrice: 2500, price: 3000, maxPerPurchase: 3, equippable: false, desc: '방위당 4점 × 4방위 = 16점. 모듬 350g~ / 고급 320g~.' },
      { id: 'inv_plate_m',  name: '사시미 접시 (중)',   icon: '🍽️', category: 'etc', subCategory: '식기', basePrice: 4500, price: 5500, maxPerPurchase: 3, equippable: false, desc: '방위당 5점 × 4방위 = 20점. 모듬 550g~ / 고급 500g~.' },
      { id: 'inv_plate_l',  name: '사시미 접시 (대)',   icon: '🍽️', category: 'etc', subCategory: '식기', basePrice: 7000, price: 8500, maxPerPurchase: 3, equippable: false, desc: '방위당 6점 × 4방위 = 24점. 모듬 750g~ / 고급 700g~.' },
      { id: 'inv_plate_xl', name: '사시미 접시 (특대)', icon: '🍽️', category: 'etc', subCategory: '식기', basePrice: 12000, price: 14000, maxPerPurchase: 3, equippable: false, desc: '방위당 7점 × 4방위 = 28점. 모듬 1.2kg~ / 고급 1.0kg~.' },
    ],
  },
  market: {
    kind: 'market',
    name: '수산물 직판장',
    greeting: '오늘 새벽에 들어온 물건입니다. 잡으신 고기도 매입해요.',
    buysCategories: ['food'],
    sells: [
      // 141차 — 메인 해금 품목 (M2-01 첫 위판 · M2-05 품질관리 교육 · M4-09 갑오징어)
      { id: 'crate_std_pro', name: '위판 규격 상자 (10입)', icon: '', category: 'etc', subCategory: '낚시도구',
        basePrice: 30000, price: 30000, maxPerPurchase: 3, equippable: false, unlockKey: 'market_crate_pro',
        desc: '위판 등록 계원에게만 판다. 규격이 곧 등급이다.' },
      { id: 'lure_starter_set', name: '입문 루어 세트 (미노우·스푼·웜)', icon: '', category: 'tackle', subCategory: '루어',
        basePrice: 48000, price: 48000, maxPerPurchase: 2, equippable: false, iconTexture: 'px:it_lure', unlockKey: 'market_lure_starter',
        desc: '품질관리 교육 수료자용 입문 세트. 미끼 냄새 안 나는 낚시.' },
      { id: 'egi_pro_set', name: '고급 에기 세트 (3.0·3.5호)', icon: '', category: 'tackle', subCategory: '루어',
        basePrice: 64000, price: 64000, maxPerPurchase: 2, equippable: false, iconTexture: 'px:it_lure', unlockKey: 'market_egi_pro',
        desc: '에깅 계열이 열린 사람에게만. 폴링이 다르다.' },
      { id: 'shop_flatfish', name: '광어 (활어)',   icon: '🐟', category: 'food',   subCategory: '어획물',   basePrice: 25000, price: 30000, maxPerPurchase: 3,  condition: 'live',   equippable: false, desc: '수조 직송 활어.' },
      { id: 'shop_squid',    name: '오징어 (선어)', icon: '🐟', category: 'food',   subCategory: '어획물',   basePrice: 8000,  price: 10000, maxPerPurchase: 5,  condition: 'chilled', equippable: false, desc: '당일 조업 선어.' },
      { id: 'inv_krill',     name: '크릴 (냉동)',   icon: '🦐', category: 'tackle', subCategory: '냉동미끼', basePrice: 4000,  price: 4500,  maxPerPurchase: 10, condition: 'frozen', equippable: false, desc: '범용 냉동 미끼.' },
      { id: 'inv_fishcut',   name: '생선 조각 미끼', icon: '🦐', category: 'tackle', subCategory: '선어미끼', basePrice: 3000,  price: 3500,  maxPerPurchase: 10, condition: 'chilled', equippable: false, desc: '갈치/우럭용 절단 미끼.' },
      { id: 'inv_ragworm',   name: '갯지렁이',      icon: '🪱', category: 'tackle', subCategory: '생미끼',   basePrice: 6000,  price: 7000,  maxPerPurchase: 10, condition: 'live', equippable: false, desc: '원투·도다리용 생미끼.' },
      // 제작 재료 (129차 P7) — 낚시 계열 재료는 직판장이 취급한다.
      { id: 'inv_mat_tin',   name: '주석 잉곳',    icon: '', iconTexture: 'px:it_ingot', category: 'etc', subCategory: '재료', basePrice: 3000,  price: 3600,  maxPerPurchase: 30, equippable: false, craftMaterial: true, desc: '봉돌·에기 싱커 주조 재료.' },
      { id: 'inv_mat_mesh',  name: '통발 그물망',  icon: '', iconTexture: 'px:it_mesh', category: 'etc', subCategory: '재료', basePrice: 6000,  price: 7200,  maxPerPurchase: 20, equippable: false, craftMaterial: true, desc: '통발 제작 재료.' },
      { id: 'inv_mat_blank', name: '로드 블랭크',  icon: '', iconTexture: 'px:it_rod', category: 'etc', subCategory: '재료', basePrice: 55000, price: 66000, maxPerPurchase: 5,  equippable: false, craftMaterial: true, desc: '커스텀 로드의 뼈대 — 고급 제작대 전용.' },
      { id: 'inv_mat_gear',  name: '정밀 기어 세트', icon: '', iconTexture: 'px:it_ingot', category: 'etc', subCategory: '재료', basePrice: 48000, price: 58000, maxPerPurchase: 5,  equippable: false, craftMaterial: true, desc: '릴 튜닝용 기어 — 고급 제작대 전용.' },
      // 고급 제작대 (129차 P7) — 설치 후 근접 [F]로 고급 도면(루어·에기·통발·로드·릴)을 연다.
      { id: 'inv_place_workbench', name: '고급 제작대', icon: '', iconTexture: 'px:it_workbench', category: 'etc', subCategory: '설치형', basePrice: 150000, price: 180000, maxPerPurchase: 1, equippable: false, placeKey: 'workbench', desc: '설치하면 고급 제작 도면이 열린다. 기본 제작은 설치 없이 U 창 제작 탭에서.' },
      // 채비 코너 — 무게추 봉돌(원투)/찌/좁쌀봉돌 (추천 마크 연동)
      ...TACKLE_CORNER,
      // 채집·통발 코너 (121차)
      ...FORAGE_CORNER,
      // 조합 사무 코너 (127차) — 스킬 리스펙
      ...GUILD_CORNER,
    ],
  },
  restaurant: {
    kind: 'restaurant',
    name: '항구 식당',
    greeting: '갓 지은 밥이 있어요. 드시고 가세요.',
    buysCategories: ['food'],
    sells: [
      { id: 'shop_meal_grilled', name: '생선구이 정식', icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 9000,  price: 11000, maxPerPurchase: 3, equippable: false, desc: '허기 +45 · HP +30 · 피로 -20.' },
      { id: 'shop_meal_soup',    name: '매운탕',        icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 10000, price: 12000, maxPerPurchase: 3, equippable: false, desc: '허기 +40 · 수분 +15 · HP +15 · 피로 -15. 국물류.' },
      // 보양식 (129차 P7) — 피로 회복 + **드레인 감소 버프**. 수치는 data/ItemVitals.ts 가 단일 소스.
      { id: 'shop_meal_abalone', name: '전복죽',        icon: '🥫', category: 'food', subCategory: '보양식', basePrice: 16000, price: 19000, maxPerPurchase: 2, equippable: false, desc: '허기 +50 · HP +35 · 피로 -30 · 40분간 체력 소모 -25%.' },
      { id: 'shop_meal_eel',     name: '장어구이',      icon: '🥫', category: 'food', subCategory: '보양식', basePrice: 24000, price: 29000, maxPerPurchase: 2, equippable: false, desc: '허기 +60 · HP +45 · 피로 -40 · 60분간 체력 소모 -32%. 최고급 보양식.' },
      // 회(사시미) 카테고리 — 아이콘은 모듬회 픽셀 이미지로 통일 (추후 어종별 이미지 분리 예정)
      // 네이밍 규칙: {어종}_sashimi_{중량} / 한글: {어종} 회 ({소/중/대})
      { id: 'shop_assorted_sashimi_small', name: '모듬회 (소)', icon: '🐟', iconTexture: 'food_assorted_sashimi', category: 'food', subCategory: '회(사시미)', basePrice: 20000, price: 25000, maxPerPurchase: 2, equippable: false, desc: 'assorted sashimi (small) — 고신선도 회, 근력 1.2배 10분.' },
      { id: 'shop_black_sea_bream_sashimi_small', name: '감성돔 회 (소)', icon: '🐟', iconTexture: 'food_assorted_sashimi', category: 'food', subCategory: '회(사시미)', basePrice: 28000, price: 34000, maxPerPurchase: 2, equippable: false, desc: 'black sea bream sashimi (small) — 쫄깃한 단일 어종 회, 근력 1.3배 10분.' },
    ],
  },
  cafe: {
    kind: 'cafe',
    name: '방파제 카페',
    greeting: '따뜻한 커피 어떠세요?',
    buysCategories: [],
    sells: [
      { id: 'shop_coffee',  name: '아메리카노',  icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 3500, price: 4000, maxPerPurchase: 5, equippable: false, desc: '피로 -20 · 2시간 뒤 +10 되돌아옴(카페인 리바운드).' },
      { id: 'shop_latte',   name: '카페라떼',    icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 4200, price: 4800, maxPerPurchase: 5, equippable: false, desc: '피로 -12 · HP +5 · 2시간 뒤 +6 되돌아옴.' },
      { id: 'shop_dessert', name: '수제 디저트', icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 5500, price: 6500, maxPerPurchase: 5, equippable: false, desc: '집중력 버프 (입질 표시 강화) 5분.' },
    ],
  },
  pharmacy: {
    kind: 'pharmacy',
    name: '항구 약국',
    greeting: '어디 편찮으세요? 바다에서 다치면 바로 오세요.',
    buysCategories: [],
    sells: [
      // 구급품 — 제작(도면)보다 비싸지만 품질이 높다(재발 억제·자연치유 단축 강화).
      { id: 'shop_bandage',  name: '멸균 붕대',   icon: '', iconTexture: 'px:it_bandage', category: 'consumable', subCategory: '구급품', basePrice: 5000,  price: 6000,  maxPerPurchase: 10, equippable: false, desc: '출혈을 멎게 한다. 재발 억제가 수제 붕대보다 낫다.' },
      { id: 'shop_splint',   name: '의료용 부목', icon: '', iconTexture: 'px:it_splint', category: 'consumable', subCategory: '구급품', basePrice: 12000, price: 14000, maxPerPurchase: 5,  equippable: false, desc: '골절 고정. 손질·채집 부상 복귀가 빨라진다.' },
      { id: 'shop_medicine', name: '종합 상비약', icon: '', iconTexture: 'px:it_medicine', category: 'consumable', subCategory: '구급품', basePrice: 9000,  price: 11000, maxPerPurchase: 10, equippable: false, desc: '감기·독감·식중독·생물중독을 치료하고 HP를 조금 회복한다.' },
      // 제작 재료 (약초·천) — 나머지 재료는 마트·직판장에서 판다.
      { id: 'inv_mat_cloth', name: '무명천',      icon: '', iconTexture: 'px:it_cloth', category: 'etc', subCategory: '재료', basePrice: 1200, price: 1500, maxPerPurchase: 20, equippable: false, craftMaterial: true, desc: '붕대·손잡이 그립 재료.' },
      { id: 'inv_mat_herb',  name: '약초',        icon: '', iconTexture: 'px:it_herb', category: 'etc', subCategory: '재료', basePrice: 2500, price: 3000, maxPerPurchase: 20, equippable: false, craftMaterial: true, desc: '상비약 재료. 산과 들에서 채집할 수도 있다.' },
    ],
  },
  /**
   * 생활용품점(사이소) — 135차. Ch1 M1-04 「사이소 영수증」의 **저가 장비 한 벌**이 여기 있다.
   * "그 대는 아까우니까 여기다 쓰지 마" — 테트라포드 구멍치기용 싸구려 세트(합 2만원).
   * 비싼 아버지 릴대를 밑걸림 지옥에 넣지 않게 하는 것이 이 상점의 존재 이유다.
   */
  daily: {
    kind: 'daily',
    name: '생활용품점 사이소',
    greeting: '없는 거 빼고 다 있습니다. 싼 걸로 찾으시면 이쪽.',
    sells: [
      // 141차 — 메인 해금 품목 (M3-09 배를 보러 가자 — 로드 빌딩)
      { id: 'workshop_pro_tools', name: '로드 빌딩 공구 세트', icon: '', category: 'etc', subCategory: '재료',
        basePrice: 150000, price: 150000, maxPerPurchase: 1, equippable: false, craftMaterial: true, unlockKey: 'daily_workshop_pro',
        desc: '탁만수가 말해 둔 물건. 대를 깎는 사람에게만.' },
      { id: 'inv_rod_budget', name: '사이소 민물대 2.4m', icon: '🎣', category: 'gear', subCategory: '손도구',
        basePrice: 12000, price: 12000, maxPerPurchase: 1, equippable: true, tool: 'rod',
        desc: '싸구려 짧은 대. 테트라포드 구멍치기 전용 — 밑걸림으로 부러져도 아깝지 않다.' },
      { id: 'inv_reel_budget', name: '사이소 소형 스피닝릴', icon: '⚙️', category: 'gear', subCategory: '릴',
        basePrice: 8000, price: 8000, maxPerPurchase: 1, equippable: true,
        desc: '드랙이 거칠다. 구멍치기처럼 짧게 감아 올리는 조법에는 충분하다.' },
      { id: 'inv_line_nylon3', name: '나일론 원줄 3호 100m', icon: '🧵', category: 'tackle', subCategory: '원줄 스풀',
        basePrice: 4000, price: 4000, maxPerPurchase: 5, equippable: false,
        desc: '거친 구멍 바닥에 쓸려도 덜 아픈 값싼 원줄.' },
      { id: 'inv_gloves_work', name: '목장갑', icon: '🧤', category: 'gear', subCategory: '장갑',
        basePrice: 2000, price: 2000, maxPerPurchase: 3, equippable: true,
        desc: '테트라포드·그물 작업 기본. 손을 베지 않는 것이 먼저다.' },
      { id: 'inv_headlamp', name: '헤드랜턴 (800lm)', icon: '🔦', category: 'etc', subCategory: '해루질 도구',
        basePrice: 25000, price: 26000, maxPerPurchase: 1, equippable: false, lampLumens: 800,
        desc: '야간 채집 필수 — 루멘이 발견 반경. 100lm당 약 0.55타일.' },
    ],
    buysCategories: [],
  },
  pub: {
    kind: 'pub',
    name: '포구 주점',
    greeting: '조황 얘기나 하면서 한잔 하시죠.',
    buysCategories: [],
    sells: [
      { id: 'shop_makgeolli', name: '막걸리',      icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 4000, price: 5000, maxPerPurchase: 5, equippable: false, desc: '피로 -20 · 수분 -8. 술은 갈증을 부른다.' },
      { id: 'shop_anju',      name: '해물 안주',   icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 12000, price: 15000, maxPerPurchase: 3, equippable: false, desc: 'HP +20, 체온 유지.' },
      { id: 'shop_soju',      name: '소주',        icon: '🥫', category: 'food', subCategory: '가공품', basePrice: 3000, price: 4000, maxPerPurchase: 5, equippable: false, desc: '피로 -10 · 수분 -12. 추위는 잊게 해주지만 탈수가 빠르다.' },
    ],
  },
};

// 소모품 효과(회복치·구급품)를 단일 테이블에서 주입 — 카탈로그 리터럴에 수치를 중복해 적지 않는다.
// (같은 테이블을 시드 생성·세이브 로드 백필도 쓴다 → 값을 고치면 구세이브까지 자동 정합)
for (const def of Object.values(SHOP_CATALOG)) {
  for (const e of def.sells) applyItemVitals(e);
}

/** 건물 배치용 종류 순환 배열 (POI 인덱스 → 건물 종류) */
export const BUILDING_KIND_CYCLE: BuildingKind[] = [
  'restaurant', 'convenience', 'cafe', 'mart', 'market', 'pub', 'pharmacy', 'daily',
];
