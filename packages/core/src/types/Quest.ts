/**
 * @file Quest.ts
 * @description 퀘스트 / 목표 시스템 타입 정의
 *
 * 튜토리얼 퀘스트, 라이선스 해금 퀘스트, 업적 퀘스트를 포함합니다.
 * 모든 퀘스트는 `QuestDatabase.ts`에 정의됩니다.
 */

// ─────────────────────────────────────────────
// 퀘스트 목표 (Objective)
// ─────────────────────────────────────────────

export type QuestObjectiveType =
  | 'catch_fish'              // 특정 어종 낚기
  | 'catch_any_fish'          // 아무 물고기나 N마리 낚기
  | 'visit_spot'              // 낚시터 방문
  | 'harvest_creature'        // 해루질로 생물 채취
  | 'deploy_trap'             // 통발 설치
  | 'harvest_trap'            // 통발 수거
  | 'cook_recipe'             // 요리 완성
  | 'open_restaurant'         // 식당 개업
  | 'earn_coins'              // 코인 획득
  | 'acquire_license'         // 면허 취득
  | 'complete_trips'          // 출조 N회
  | 'catch_weight';           // 어획 누적 무게(g)

export interface QuestObjective {
  type: QuestObjectiveType;
  /** 목표 수량 */
  targetAmount: number;
  /** 현재 진행 수량 (런타임에서 업데이트) */
  currentAmount: number;
  /** 조건 파라미터 (어종 ID, 스팟 ID 등) */
  param?: string;
  /** 목표 달성 여부 */
  isCompleted: boolean;
}

// ─────────────────────────────────────────────
// 퀘스트 보상
// ─────────────────────────────────────────────

export interface QuestReward {
  type: 'coins' | 'license' | 'item' | 'experience';
  amount?: number;        // coins, experience
  itemId?: string;        // item
  licenseType?: string;   // license (LicenseType)
  descriptionKo: string;
}

// ─────────────────────────────────────────────
// 퀘스트 정의
// ─────────────────────────────────────────────

export type QuestCategory =
  | 'tutorial'      // 튜토리얼 퀘스트
  | 'license'       // 라이선스 해금 퀘스트
  | 'activity'      // 액티비티 퀘스트 (해루질, 통발 등)
  | 'achievement';  // 업적성 퀘스트

export interface Quest {
  id: string;
  nameKo: string;
  description: string;
  category: QuestCategory;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  /** 선행 퀘스트 ID (완료 후 잠금 해제) */
  prerequisiteQuestIds: string[];
  /** 자동 시작 여부 (true면 조건 충족 시 자동 시작) */
  autoStart: boolean;
  isCompleted: boolean;
  isActive: boolean;
}

// ─────────────────────────────────────────────
// 플레이어 퀘스트 진행 상태
// ─────────────────────────────────────────────

export interface PlayerQuestProgress {
  questId: string;
  objectives: Pick<QuestObjective, 'type' | 'currentAmount' | 'isCompleted'>[];
  startedAt: Date;
  completedAt?: Date;
}
