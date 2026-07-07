/**
 * @file QuestDatabase.ts
 * @description 퀘스트 데이터베이스
 *
 * 튜토리얼 퀘스트 (5개), 라이선스 해금 퀘스트 (6개),
 * 액티비티 퀘스트 (5개)를 정의합니다.
 */

import type { Quest } from '../types/Quest.js';

// ─────────────────────────────────────────────
// 퀘스트 목록
// ─────────────────────────────────────────────

export const QUEST_DATABASE: Quest[] = [
  // ──────────────────────────────────────────
  // 튜토리얼 퀘스트
  // ──────────────────────────────────────────
  {
    id: 'quest_tutorial_first_cast',
    nameKo: '첫 번째 캐스팅',
    description: '낚시터로 이동해 처음으로 채비를 물에 던져보세요.',
    category: 'tutorial',
    objectives: [
      { type: 'visit_spot', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'any' },
    ],
    rewards: [
      { type: 'coins', amount: 500, descriptionKo: '500 코인' },
    ],
    prerequisiteQuestIds: [],
    autoStart: true,
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'quest_tutorial_catch_3',
    nameKo: '물고기 3마리 낚기',
    description: '어종에 상관없이 물고기 3마리를 낚아보세요.',
    category: 'tutorial',
    objectives: [
      { type: 'catch_any_fish', targetAmount: 3, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 1000, descriptionKo: '1,000 코인' },
      { type: 'item', itemId: 'bait_sandworm_fresh', descriptionKo: '청갯지렁이 ×20' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_first_cast'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_tutorial_visit_3spots',
    nameKo: '탐방꾼의 시작',
    description: '서로 다른 낚시터 3곳을 방문해보세요.',
    category: 'tutorial',
    objectives: [
      { type: 'visit_spot', targetAmount: 3, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 2000, descriptionKo: '2,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_catch_3'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_tutorial_complete_trips_5',
    nameKo: '출조 5회 달성',
    description: '낚시터 방문을 포함한 총 출조 횟수 5회를 채워보세요.',
    category: 'tutorial',
    objectives: [
      { type: 'complete_trips', targetAmount: 5, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 3000, descriptionKo: '3,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_visit_3spots'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_tutorial_first_big_fish',
    nameKo: '첫 대물',
    description: '길이 40cm 이상의 물고기를 낚아보세요.',
    category: 'tutorial',
    objectives: [
      { type: 'catch_fish', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'size_40cm' },
    ],
    rewards: [
      { type: 'coins', amount: 5000, descriptionKo: '5,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_catch_3'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },

  // ──────────────────────────────────────────
  // 라이선스 해금 퀘스트
  // ──────────────────────────────────────────
  {
    id: 'quest_license_shore_hunting',
    nameKo: '해루질 입문 허가 도전',
    description: '해루질 허가를 취득하기 위해 출조 10회, 거제 구조라 방파제 방문을 완료하세요.',
    category: 'license',
    objectives: [
      { type: 'complete_trips', targetAmount: 10, currentAmount: 0, isCompleted: false },
      { type: 'visit_spot', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'geoje_gujora_breakwater' },
    ],
    rewards: [
      { type: 'license', licenseType: 'shore_hunting_basic', descriptionKo: '해루질 입문 허가' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_complete_trips_5'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_license_trap',
    nameKo: '통발 조업 면허 도전',
    description: '출조 20회, 어획 50마리를 달성하면 통발 면허를 취득할 수 있습니다.',
    category: 'license',
    objectives: [
      { type: 'complete_trips', targetAmount: 20, currentAmount: 0, isCompleted: false },
      { type: 'catch_any_fish', targetAmount: 50, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'license', licenseType: 'trap_basic', descriptionKo: '통발 조업 기본 면허' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_complete_trips_5'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_first_catch_and_cook',
    nameKo: '첫 캐치앤쿡',
    description: '잡은 물고기로 처음 요리를 완성해보세요. 낚시터 근처 갯바위에서 가능합니다.',
    category: 'license',
    objectives: [
      { type: 'cook_recipe', targetAmount: 1, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 10000, descriptionKo: '10,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_catch_3'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_license_food_service',
    nameKo: '식품위생법 영업허가 도전',
    description: '캐치앤쿡 완성, 보유 코인 50,000원, 어획 100마리를 달성해야 식당 개업이 가능합니다.',
    category: 'license',
    objectives: [
      { type: 'cook_recipe', targetAmount: 1, currentAmount: 0, isCompleted: false },
      { type: 'earn_coins', targetAmount: 50000, currentAmount: 0, isCompleted: false },
      { type: 'catch_any_fish', targetAmount: 100, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'license', licenseType: 'food_service', descriptionKo: '식품위생법 영업허가' },
    ],
    prerequisiteQuestIds: ['quest_first_catch_and_cook'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_license_boat',
    nameKo: '선상 낚시 면허 도전',
    description: '출조 5회를 완료하면 선상 낚시를 즐길 수 있는 면허를 취득할 수 있습니다.',
    category: 'license',
    objectives: [
      { type: 'complete_trips', targetAmount: 5, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'license', licenseType: 'boat_angling', descriptionKo: '선상 낚시 면허' },
      { type: 'coins', amount: 5000, descriptionKo: '5,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_complete_trips_5'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_license_marine_tourism',
    nameKo: '해양관광사업 등록 도전',
    description: '선상 낚시 면허, 식당 영업허가, 평판 60 이상, 코인 200,000원을 달성해야 선상콘도 운영이 가능합니다.',
    category: 'license',
    objectives: [
      { type: 'acquire_license', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'boat_angling' },
      { type: 'acquire_license', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'food_service' },
      { type: 'earn_coins', targetAmount: 200000, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'license', licenseType: 'marine_tourism', descriptionKo: '해양관광사업 등록' },
    ],
    prerequisiteQuestIds: ['quest_license_food_service', 'quest_license_boat'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },

  // ──────────────────────────────────────────
  // 액티비티 퀘스트
  // ──────────────────────────────────────────
  {
    id: 'quest_activity_first_harvest',
    nameKo: '첫 해루질 채취',
    description: '해루질로 조개류나 소라를 처음 채취해보세요.',
    category: 'activity',
    objectives: [
      { type: 'harvest_creature', targetAmount: 1, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 2000, descriptionKo: '2,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_license_shore_hunting'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_activity_first_trap',
    nameKo: '첫 통발 수거',
    description: '통발을 설치하고 하루가 지난 뒤 수거해보세요.',
    category: 'activity',
    objectives: [
      { type: 'deploy_trap', targetAmount: 1, currentAmount: 0, isCompleted: false },
      { type: 'harvest_trap', targetAmount: 1, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 3000, descriptionKo: '3,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_license_trap'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_activity_catch_weight_10kg',
    nameKo: '어획 10kg 달성',
    description: '쿨러에 담긴 어획물의 총 무게 10kg을 달성해보세요.',
    category: 'activity',
    objectives: [
      { type: 'catch_weight', targetAmount: 10000, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 8000, descriptionKo: '8,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_catch_3'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_activity_open_restaurant',
    nameKo: '식당 개업!',
    description: '처음으로 식당을 열고 포장마차 단계를 시작해보세요.',
    category: 'activity',
    objectives: [
      { type: 'open_restaurant', targetAmount: 1, currentAmount: 0, isCompleted: false },
    ],
    rewards: [
      { type: 'coins', amount: 20000, descriptionKo: '20,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_license_food_service'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'quest_activity_catch_blackporgy',
    nameKo: '감성돔 첫 포획',
    description: '감성돔을 처음으로 낚아보세요. 겨울 방파제나 갯바위에서 잘 낚입니다.',
    category: 'achievement',
    objectives: [
      { type: 'catch_fish', targetAmount: 1, currentAmount: 0, isCompleted: false, param: 'black_porgy' },
    ],
    rewards: [
      { type: 'coins', amount: 15000, descriptionKo: '15,000 코인' },
    ],
    prerequisiteQuestIds: ['quest_tutorial_catch_3'],
    autoStart: false,
    isCompleted: false,
    isActive: false,
  },
];

// ─────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────

export function getQuestById(id: string): Quest | undefined {
  return QUEST_DATABASE.find((q) => q.id === id);
}

export function getQuestsByCategory(category: Quest['category']): Quest[] {
  return QUEST_DATABASE.filter((q) => q.category === category);
}

export function getAvailableQuests(completedQuestIds: string[]): Quest[] {
  return QUEST_DATABASE.filter((q) =>
    !completedQuestIds.includes(q.id) &&
    q.prerequisiteQuestIds.every((prereqId) => completedQuestIds.includes(prereqId))
  );
}
