/**
 * @file LineWear.ts
 * @description 원줄 · 목줄 내구도(마모) 타입 (273차 — 사용자 「원줄/목줄은 내구도로 해야 할 것 같은데 … 가장 리얼요소를 반영하려면」).
 *
 * 내구도는 **스풀**이 아니라 **지금 묶여 있는 줄 한 가닥**의 상태다. 실제 낚시에서 줄은 여에 쓸리고,
 * 고기와 겨루며 늘어났다 줄어들기를 반복하고, 가이드를 지나며 결이 일어난다. 그러다 매듭 위 몇 미터를
 * 잘라 내고 다시 묶는다 — 스풀은 그만큼 짧아진다. 모델은 그 관행을 그대로 따른다.
 */

/** 줄 재질 — 가방 아이템 `lineMaterial`과 같은 키(`monofilament`는 나일론과 같게 본다) */
export type LineMaterialKey = 'nylon' | 'fluorocarbon' | 'pe_braid' | 'monofilament';

/** 묶인 줄의 역할 — 채비 트리의 원줄 칸 · 목줄 칸 */
export type LineRole = 'main' | 'leader';

/** 마모 단계 — 0.2 · 0.5 · 0.8 문턱(`TUNING.lineWear.stage*`) */
export type LineWearStage = 'fresh' | 'light' | 'heavy' | 'critical';

/** 재질별 성질 — 1 = 나일론 기준 */
export interface LineMaterialTraits {
  /** 표시 이름 */
  labelKo: string;
  /** 쓸림(여 · 바위 · 밑걸림 당김) 민감도 */
  abrasion: number;
  /** 반복 하중 피로 민감도(늘어나는 줄이 더 지친다) */
  fatigue: number;
  /** 캐스팅 가이드 쓸림 민감도(합사는 결이 일어난다) */
  cast: number;
  /** 충격(랜딩 · 챔질) 민감도 — 늘어나는 줄은 충격을 받아 준다 */
  shock: number;
  /** 물을 먹어 약해지는가(나일론) — 세기 감소 비율은 `TUNING.lineWear.nylonWetLoss` */
  wet: boolean;
  /** 상세 창 · 위키 한 줄 */
  traitKo: string;
  /** 상세 창 「성질」 칸(짧게) */
  shortKo: string;
}

/** 묶인 줄 하나의 상태 요약(채비 창 · 상세 · 알림) */
export interface LineWearSummary {
  role: LineRole;
  itemId: string;
  material: LineMaterialKey;
  /** 마모 0~1 */
  wear: number;
  stage: LineWearStage;
  stageKo: string;
  /** 공칭 세기(호수 환산 · kg) */
  nominalKg: number;
  /** 지금 세기(마모 · 젖음 반영 · kg) */
  effectiveKg: number;
}
