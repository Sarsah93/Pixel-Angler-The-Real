/**
 * @file Lure.ts
 * @description 루어(가짜 미끼) 채비 타입 정의
 *
 * 소프트 베이트(지그헤드 결합)와 하드 베이트(자체 무게 캐스팅)를 하나의
 * LureSpec로 표현한다. 물리·엔진 연동은 데이터 소비 방식 — 하드코딩 버프 금지:
 *  - 비거리: CastingPhysicsEngine의 airDragCd 입력으로 `dragCoefficient` 전달
 *  - 침강/수심 Z: `sinkType` + `sinkRateMps`/`diveDepthPerRetrieve`로 수직뷰 제어
 *  - 어종 타겟/유인: `speciesWeightBias`/`spawnBinding`/`targetHabitatBias`/
 *    `fallLureWeight`/`actionFlags`를 스폰 오라클·입질 엔진이 소비
 *
 * 어종 id·서식 지형·수심층 문자열은 FishSpawningOracle의 기존 값에 맞춘다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

/** 루어 대분류 */
export type LureFamily = 'soft' | 'hard';

/** 루어 세부 종류 */
export type LureKind =
  | 'worm_grub'      // 웜/그럽
  | 'soft_jerkbait'  // 소프트 저크베이트
  | 'plug_minnow'    // 플러그/미노우
  | 'spoon'          // 스푼
  | 'spinner'        // 스피너
  | 'egi'            // 에기
  | 'metal_jig'      // 메탈지그
  | 'tairaba';       // 타이라바 (참돔 러버지그 — 바닥 찍고 등속 릴링)

/** 침강 타입 — 수직뷰 Z 제어. floating은 리트리브로 파고들고 멈추면 부상 */
export type SinkType = 'floating' | 'sinking' | 'fast_sinking';

/** 루어 액션 플래그 — 리트리브/저킹 입력 시 판정 활성화 */
export type LureActionFlag = 'dart' | 'wobble' | 'rolling' | 'flash';

export interface LureSpec {
  /** 스폰 오라클/인벤토리 키와 일치 */
  id: string;
  nameKo: string;
  nameEn: string;
  /** 가상 브랜드 */
  brand: string;
  family: LureFamily;
  kind: LureKind;
  /** '2인치' / '2.5호' 등 표기용 */
  sizeLabel: string;
  /** 자중(소프트는 웜 자체 무게 g) */
  weightG: number;
  sinkType: SinkType;
  /** sinking 계열 고유 침강 속도 (m/s) — 수직뷰 Z 하강 제어 */
  sinkRateMps?: number;
  /** floating: 리트리브 1틱당 파고드는 깊이 계수 (m) */
  diveDepthPerRetrieve?: number;
  /** 공기 저항 계수 C_d — 낮을수록 초장타 (CastingPhysicsEngine airDragCd 입력) */
  dragCoefficient: number;
  /** 어종별 타겟 가중치 (speciesId → 가산치). 입질 엔진이 소비 */
  speciesWeightBias?: Record<string, number>;
  /** 서식 성향 가중 (structure/reef 등 — 스피너 등) */
  targetHabitatBias?: string[];
  /** 액션 판정 활성화 (다트 등) */
  actionFlags?: LureActionFlag[];
  /** 소프트 베이트 → 지그헤드 결합 필요 */
  requiresJigHead?: boolean;
  /** 에기 → ['squid','octopus'] 전용 스폰 바인딩 */
  spawnBinding?: string[];
  /** 폴링(가라앉는 중) 유인 가중 (스푼 등) */
  fallLureWeight?: number;
  /** 밑걸림 위험 배율 (에기 바닥 드래깅 -30% → 0.7) */
  snagRiskMult?: number;
}
