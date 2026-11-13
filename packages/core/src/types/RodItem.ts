/**
 * @file RodItem.ts
 * @description 낚싯대 · 릴 아이템 제원 (209차 — 사용자 지시 「로드의 용도 · 길이 · 호수대에 따라 다 다르게」).
 *
 * 구 구조는 낚싯대가 **가격 하나**로만 구분됐다(하중 = 2.2 + 가격/6만 · 비거리 무관).
 * 이제 대마다 용도 · 길이 · 호수(또는 파워) · 적합 원줄 · 적합 채비 무게 · 견디는 하중 · 릴 종류를 갖는다.
 *
 * 제원은 아이템에 저장하지 않고 **아이템 id로 조회**한다(`db-schema/RodCatalog.ts` — 구세이브 백필 불필요).
 * 모르는 id(수제 · 하네스 복제본)는 이름 · 가격으로 추정한다(`rodSpecFor` 폴백).
 */

/** 낚싯대 용도 — 이 대를 무엇에 쓰려고 만들었나 */
export type RodUse =
  | 'float_iso'      // 갯바위 · 방파제 찌낚시대(이소대) — 길고 낭창하다, 가벼운 찌 채비
  | 'surf'           // 원투대 — 무거운 봉돌을 멀리, 거치해 두고 초릿대로 입질을 본다
  | 'shore_jigging'  // 쇼어지깅대 — 메탈지그를 갯바위 · 방파제에서 멀리 · 청물
  | 'shore_light'    // 라이트게임대 — 볼락 · 전갱이 지그헤드 · 소형 웜
  | 'eging'          // 에깅대 — 무늬오징어 에기
  | 'boat_bait'      // 선상 베이트대 — 타이라바 · 슬로우지깅(던지지 않고 내린다)
  | 'hole'           // 구멍치기대 — 짧고 뻣뻣하다, 테트라포드 틈
  | 'budget'         // 다용도 싸구려 짧은 대
  // ── 324차 대물 장비 ──
  | 'ishidai'        // 돌돔 원투대(석조대) — 굵은 나일론 + 양축릴, 갯바위 발밑 · 근거리 처박기
  | 'offshore_jig'   // 지깅대 — 무거운 메탈지그를 내려 저킹한다(방어 · 부시리 · 잿방어)
  | 'offshore_cast'  // 캐스팅대(포핑 · 펜슬) — 큰 플러그를 던져 수면을 친다(부시리 · 참다랑어)
  | 'big_game';      // 스탠드업 · 트롤링대 — 던지지 않는다. 레버 드랙 릴로 버틴다(참다랑어 · 새치)

/**
 * 릴 종류 — 대의 릴 시트와 가이드가 정한다.
 * 324차 — 양축릴(`bait`)에는 베이트릴 · 돌돔 양축릴 · 지깅 양축릴 · 레버 드랙 트롤링릴이 모두 든다(가이드가 위로 난 대에 단다).
 */
export type ReelKind = 'spinning' | 'bait';

/** 원줄 재질 기준(적합 호수의 단위) */
export type RodLineBasis = 'nylon' | 'pe';

/** 낚싯대 제원 */
export interface RodItemSpec {
  use: RodUse;
  /** 길이(m) */
  lengthM: number;
  /** 호수 · 파워 표기 — 찌대 `1.5호`, 원투대 `25호`(봉돌 호수), 루어대 `MH` 등 */
  grade: string;
  /** 적합 원줄 호수 [하한, 상한] — `lineBasis` 단위 */
  lineNo: [number, number];
  lineBasis: RodLineBasis;
  /** 적합 채비 무게(g) [하한, 상한] — 봉돌 · 찌 침력 · 루어 · 타이라바 헤드 합 */
  loadG: [number, number];
  /** 대가 견디는 하중(kg) — 이보다 훨씬 강한 줄을 쓰면 줄보다 대가 먼저 부러진다 */
  powerKg: number;
  reel: ReelKind;
  /** 마디 수 · 뽑기식(텔레스코픽) 여부 */
  pieces: number;
  telescopic: boolean;
  /** 자중(g) */
  weightG: number;
  /** 324차 — 만든 곳(게임 안 가상 상표). 같은 제원이라도 만든 곳마다 자중 · 내구도 · 손맛이 조금씩 다르다 */
  brand?: string;
  /** 324차 — 내구도 배수(1 = 값대로). 튼튼하게 만든 대는 1보다 크다 */
  durabilityMult?: number;
}

/** 릴 제원 */
export interface ReelItemSpec {
  kind: ReelKind;
  /** 번수(스피닝 1000~30000) · 베이트 100~300 · 양축 · 트롤링 릴은 제 번수 표기(2000 · 30 · 50) */
  size: number;
  /** 최대 드랙(kg) */
  maxDragKg: number;
  /** 기어비 */
  gearRatio: number;
  /** 원줄 3호(나일론 환산) 권사량(m) */
  lineCapM: number;
  /** 비거리 배율 — 원투 전용 롱캐스트 스풀은 1보다 크다, 베이트는 엄지 제어로 작다 */
  castMult: number;
  /** 324차 — 자중(g). 없으면 번수로 어림한다(`reelWeightG`) */
  weightG?: number;
  /** 324차 — 만든 곳(게임 안 가상 상표) */
  brand?: string;
  /** 324차 — 내구도 배수(1 = 값대로) */
  durabilityMult?: number;
  /** 324차 — 레버 드랙(트롤링 · 스탠드업 릴). 드랙을 레버로 그때그때 조인다 — 큰 고기 전용 */
  leverDrag?: boolean;
}

/** 채비 무게가 대의 적합 범위 어디에 있나 */
export type RodLoadState = 'under' | 'ok' | 'over' | 'danger';

/** 상점 · 보상 낚싯대 한 자루 */
export interface RodCatalogEntry {
  id: string;
  nameKo: string;
  priceWon: number;
  spec: RodItemSpec;
  descKo: string;
  /** 324차 — 이 대만의 그림 키(없으면 용도별 그림) */
  art?: string;
}

/** 상점 릴 하나 */
export interface ReelCatalogEntry {
  id: string;
  nameKo: string;
  priceWon: number;
  spec: ReelItemSpec;
  descKo: string;
  /** 324차 — 이 릴만의 그림 키(없으면 종류 · 번수별 그림) */
  art?: string;
}
