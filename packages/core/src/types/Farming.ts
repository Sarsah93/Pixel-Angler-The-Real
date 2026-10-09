/**
 * @file Farming.ts
 * @description 텃밭 농사 타입 (235차 — 사용자 확정 「추천안 2번」: 실제 시간 · 실제 계절은 그대로)
 *
 * 원칙
 *  - **실제 시간대로 자란다** — 꺼 둔 동안에도. 집만 빠른 땅은 없다.
 *  - 매일 거둘 거리는 원래 빠른 작물(콩나물 · 새싹 · 잎 따기 · 베고 다시 자람)에서,
 *    긴 작물은 실제 중간 수확(솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎)으로 잇는다.
 *  - 모종 = 현실의 시간 단축(육묘를 건너뛴다). 씨앗은 싸고 느리다.
 *  - 빨라지는 건 **시설**로 번다 — 곱하되 상한(잎채소 ×2.0 · 철 작물 ×1.4).
 *  - 자리를 비워도 벌하지 않는다 — 죽지 않고 시들어 품질만 준다. 비 = 물 주기.
 *
 * 칸 = 1㎡(주말농장 한 구획 12㎡ = 4×3칸). 수량 · 비율은 실제 재배 자료(10a 수량 · 재식 거리 ·
 * 발아율 · 씨감자/종구 대비 수확)를 칸 단위로 환산했다(`CropDatabase` 각 줄 주석).
 */

/** 작물 갈래 — 그림 · 아이콘 원형을 고른다 */
export type CropCategory =
  | 'leaf'      // 잎채소(상추 · 시금치 · 근대 …)
  | 'fruit'     // 열매(고추 · 토마토 · 오이 · 호박 …)
  | 'root'      // 뿌리(무 · 당근 · 야콘 …)
  | 'tuber'     // 덩이(감자 · 고구마 · 토란 · 초석잠 …)
  | 'bulb'      // 비늘줄기 · 파(마늘 · 양파 · 대파 · 쪽파 · 산마늘)
  | 'grain'     // 곡식(옥수수 · 보리)
  | 'legume'    // 콩
  | 'wild'      // 산채(곰취 · 눈개승마 · 어수리 · 두릅 …)
  | 'herb'      // 향채
  | 'mushroom'  // 버섯 배지
  | 'sprout';   // 시루 · 새싹(콩나물 · 숙주 · 새싹채소)

/** 시설 가속 상한을 고르는 묶음 — 잎채소는 ×2.0까지, 철 작물(열매 · 뿌리 · 곡식)은 ×1.4까지 */
export type CropSpeedClass = 'leafy' | 'seasonal';

/** 희귀도 — 씨앗 · 모종을 구하기 어려운 정도(가게 재고 · 출처) */
export type CropRarity = 'common' | 'uncommon' | 'rare' | 'very_rare';

/** 수확 등급 — 특 · 상 · 보통 */
export type CropGrade = 'special' | 'good' | 'normal';

/** 심는 방법 */
export type CropStartKind = 'seed' | 'seedling' | 'set';

/** 어디서 기르나 — 마당 텃밭 / 실내(시루 · 배지 · 수경 랙) */
export type FarmSite = 'plot' | 'indoor';

/** 시설 · 손질 — 텃밭 단위 설비와 칸 단위 손질 */
export type FarmFacility =
  | 'compost'      // 퇴비(칸 — 이번 작기 생장 ×1.15 · 품질 +)
  | 'rainBarrel'   // 빗물통 · 점적 관수(텃밭 — 비운 동안 흙이 마르지 않는다)
  | 'greenhouse'   // 비닐하우스(텃밭 — 철 앞뒤 1달 · 추운 달 ×1.25)
  | 'shade'        // 차광막(텃밭 — 산채 재배 자격)
  | 'hydroRack'    // 실내 수경 랙(잎채소 ×1.8)
  | 'coldWater'    // 냉수 순환 수조(고추냉이 자격)
  | 'sproutJar';   // 콩나물 시루(실내 — 시루 · 새싹 자격)

/** 심는 방법 하나 */
export interface CropStart {
  kind: CropStartKind;
  /** 씨앗 · 모종 · 종구 아이템 id */
  itemId: string;
  /** 칸(1㎡)당 쓰는 수 — 씨앗은 「1칸 분」 봉, 모종은 포기, 종구는 개 */
  perCell: number;
  /** 섬(입모) 비율 — 씨앗 발아율 · 모종 활착률 · 종구 출아율(실측 표기값) */
  establish: number;
  /** 심은 뒤 첫 수확까지 일수(적온 · 물 충분 · 노지) */
  days: number;
  /** 노지에 심을 수 있는 달(1~12) */
  months: number[];
  /** 한 단위 값(원) — 씨앗 「1칸 분」 봉 · 모종 1포기 · 종구 「1칸 분」 */
  cost: number;
  /** 단위 이름(없으면 「○○ 씨앗 (1칸 분)」 · 「○○ 모종」) */
  labelKo?: string;
  labelEn?: string;
  /** 수확량 배수 — 같은 작물을 다른 재료로 앉힐 때(키운 백태 200g으로 콩나물 = 1.8배) */
  qtyMult?: number;
}

/** 본 수확 */
export interface CropHarvest {
  /** 수확물 아이템 id */
  itemId: string;
  /** 수확물 이름(단위 포함 — 「상추 한 줌 (100g)」) */
  nameKo: string;
  nameEn: string;
  /** 다 익고 이만큼 지나면 다른 것으로 바뀐다(풋고추 → 홍고추) — 품질은 그대로 */
  ripenTo?: { itemId: string; nameKo: string; nameEn: string; afterDays: number; price: number; cookIngredient?: string };
  /** 칸당 한 번 거두는 수(섬 1.0 · 상 등급 기준) [최소, 최대] */
  qtyPerCell: [number, number];
  /** 잎 따기 · 베기 — 첫 수확 뒤 간격(일)과 남은 횟수 */
  repeat?: { everyDays: number; times: number };
  /** 다 익은 뒤 품질이 떨어지기 시작할 때까지(일) — 추대 · 과숙 · 쇠기 */
  holdDays: number;
  /**
   * 236차 — 수확 덤(사용자 제안 「수확 때 랜덤으로 +10%씩」). 거둘 때마다 0~`bonusSteps`단계(10%씩)를
   * 고르게 굴려 그만큼 더 준다 — 버섯처럼 송이 크기가 들쭉날쭉한 작물. 3이면 0 · 10 · 20 · 30%(평균 +15%).
   */
  bonusSteps?: number;
}

/** 중간 수확 — 솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎 */
export interface CropInterim {
  itemId: string;
  labelKo: string;
  labelEn: string;
  /** 생육 진행도 [시작, 끝] 사이에 한 번 */
  window: [number, number];
  qtyPerCell: [number, number];
  /** 거둔 뒤 본 수확량 배수(솎음 1.0 — 남은 포기가 굵어진다 · 고구마순 0.95 · 마늘종 1.05) */
  mainYieldMult: number;
  /** 값(원/단위 · 상 등급) */
  price: number;
  /** 씨앗으로 시작했을 때만(솎음 — 모종은 솎을 게 없다) */
  seedOnly?: boolean;
  /** 마트에 늘 있나 */
  inMart: boolean;
  cookIngredient?: string;
}

/** 재배 자격 — 스킬 · 시설 · 면허 */
export interface CropRequirement {
  skill?: string;
  facility?: FarmFacility;
  license?: string;
}

/** 시세 — 수확 단위 1개 · 상 등급 기준(원) */
export interface CropPrice {
  base: number;
  /** 달별 지수(1~12월 · 평균 1.0 근처) — 도매 · 소매 계절 흐름 */
  season: readonly number[];
  /** 날씨 · 작황 출렁임 폭(0.1 = ±10% 안팎) */
  volatility: number;
}

export interface CropDef {
  id: string;
  nameKo: string;
  nameEn: string;
  category: CropCategory;
  speedClass: CropSpeedClass;
  rarity: CropRarity;
  /** 마트에서 늘 파는가 — false면 「마트에 없는」 작물(직접 길러야 손에 넣는다) */
  inMart: boolean;
  site: FarmSite;
  /** 심는 방법들(씨앗 · 모종 · 종구 중 가능한 것) */
  starts: CropStart[];
  harvest: CropHarvest;
  interim?: CropInterim;
  /** 노지에서 자라는 달 — 밖이면 멈춘다(겨울나기 작물은 휴면 · 하우스는 앞뒤 1달) */
  growMonths: number[];
  /** 겨울을 난다(마늘 · 양파 · 보리 · 시금치) — 추위에 상하지 않고 봄에 이어 자란다 */
  overwinter?: boolean;
  /** 여러해살이 — 다 거둔 뒤 같은 자리에서 다음 철에 다시(부추 · 산채 · 두릅) */
  perennial?: boolean;
  /** 물 요구 — 흙이 마르는 속도 배율(low 0.7 · mid 1 · high 1.4) */
  water: 'low' | 'mid' | 'high';
  /** 재배 자격 */
  requires?: CropRequirement;
  price: CropPrice;
  /**
   * 숨은 재조정(희귀 · 고가 · 저생산 작물) — 실제 시세를 따르되 칸 · 날 수익이 낚시를 넘지 않게 단가를 살짝 누른다.
   * 화면에는 드러내지 않는다(사용자 지시 2026-10-08). 없으면 1.
   */
  rebalance?: number;
  /** 요리 재료 id(core `COOK_INGREDIENTS`) — 있으면 수확물이 그 재료로 들어간다 */
  cookIngredient?: string;
  /** 출처 · 근거 메모(위키 · 상세 보기 꼬리) */
  noteKo: string;
  /** 같은 메모의 영어(i18n 사전이 데이터를 그대로 읽는다) */
  noteEn: string;
}

/** 칸 하나의 상태 — 세이브된다 */
export interface FarmCellState {
  /** 갈았는가(심기 전 필수) */
  tilled: boolean;
  cropId: string | null;
  start?: CropStartKind;
  /** 심은 시각(ms) */
  plantedAt?: number;
  /** 첫 수확까지 진행 0..1 */
  growth: number;
  /** 흙 수분 0..1 */
  moisture: number;
  /** 품질 0..1 */
  quality: number;
  /** 섬(입모) 0..1 — 발아 · 활착 결과 */
  stand: number;
  /** 반복 수확 — 거둔 횟수 · 다음 수확까지 진행 */
  picks: number;
  regrow: number;
  /** 다 익은 뒤 흐른 시간(h) — 과숙 판정 */
  ripeH: number;
  /** 중간 수확을 했나 */
  interimDone?: boolean;
  /** 이번 작기 퇴비 */
  compost?: boolean;
  /** 마지막으로 계산한 시각(ms) */
  lastMs: number;
  /** 물이 말라 멈춘 시간 누적(h) — 표시용 */
  dryH: number;
  /** 여러해살이: 지난 철에 다 거두고 쉬는 중 */
  resting?: boolean;
  /** 여러해살이: 한 해를 넘긴 뿌리(다음 철은 절반 기간에 다시 올라온다) */
  established?: boolean;
}

/** 텃밭 하나(설치물 하나 — 4×3칸) */
export interface FarmPlotState {
  /** 마당 텃밭 · 실내 선반 */
  site: FarmSite;
  cells: FarmCellState[];
  /** 설비(텃밭 — 빗물통 · 하우스 · 차광막 · 냉수 수조 / 실내 — 시루 · 수경 랙) */
  facilities: FarmFacility[];
}

/** 성장 계산 환경 — 클라이언트가 주입한다(날씨 · 스킬) */
export interface FarmEnv {
  /** 그 시각에 비가 오는가(실황이 없으면 기후 통계) */
  rainAt: (ms: number) => boolean;
  /** 236차 — 전기료가 밀려 단전됐는가(수경 재배기 불 · 펌프가 꺼진다) */
  powerOff?: boolean;
  /** 스킬 배율 — 없으면 0랭크 */
  skill?: {
    /** 물 마름 감소(0.2/랭크 → 0.8배) */
    waterEff?: number;
    /** 퇴비 효과 +20%/랭크 */
    fertilizer?: number;
    /** 병충해 확률 -15%/랭크 */
    pestResist?: number;
  };
}

/** 심기 전 확인에 쓰는 자격 조회 */
export interface FarmPlantCtx {
  hasSkill: (skillId: string) => boolean;
  /** 파종 감각(발아율 +8%/랭크) */
  sproutBonus?: number;
}

/** 수확 결과 */
export interface FarmHarvestResult {
  itemId: string;
  qty: number;
  grade: CropGrade;
  /** 품질(0..1) — 아이템에 실어 둔다 */
  quality: number;
  /** 씨앗 회수(스킬) */
  seedBack?: { itemId: string; qty: number };
  /** 반복 수확이 남았는가(아니면 칸이 비거나 쉰다) */
  more: boolean;
  /** 236차 — 덤으로 더 거둔 수(수량에 이미 들어 있다)와 그 회차의 덤 비율(%) */
  bonusQty?: number;
  bonusPct?: number;
}
