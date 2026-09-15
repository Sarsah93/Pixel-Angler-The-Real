/**
 * @file DayJobs.ts
 * @description 일용직(품삯) 일감 — Ch1 「얼음 나르기」·공동작업의 실시스템 (135차, STORY_SPEC_v3 §2 튜토리얼)
 *
 * 스토리가 "실습생은 가난하다"를 성립시키려면 **낚싯대 어획물 판매 없이도 굴러가는 수입원**이
 * 먼저 있어야 한다(§0.5-6). 품삯이 그 자리다 — NPC에게 말을 걸어 하루 몇 번 일하고 돈을 받는다.
 *
 * 설계 원칙
 *  - **행동력을 쓴다**: 피로↑ · 허기·수분↓ (`applyVitalsAction` 과 같은 축). 공짜 돈이 아니다.
 *  - **하루 상한**(`perDay`)이 있다. 하루는 침대 수면으로만 넘어가므로(125차 활동 시간 규칙)
 *    무한 반복 파밍이 불가능하다.
 *  - 완료 시 `questKey`(= `custom` 목표의 placeKey)를 스토리 이벤트로 흘려 퀘스트 목표를 자동으로 닫는다.
 *
 * ⚠ 수치는 전부 **초기값**이다 — 실플레이 조율은 `TUNING.job` 슬라이더(F8).
 */

import type { StoryLicenseId } from '../types/Story.js';

export interface DayJobDef {
  id: string;
  /** 발주 NPC (StoryArcs npcId) */
  npcId: string;
  /** 지역 id — 해당 지역에서만 노출 */
  regionId: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 품삯 (원) */
  wage: number;
  /** 소요 활동 시간(분) — 안내 표기 + 드레인 산정 기준 */
  minutes: number;
  /** 피로 증가 (0~100 축) */
  fatigue: number;
  /** 허기 감소 (%) */
  hunger: number;
  /** 수분 감소 (%) */
  hydration: number;
  /** 하루 최대 횟수 */
  perDay: number;
  /** 최소 레벨 */
  minLevel: number;
  /** 항구 평판 증가 (없으면 0) */
  rep?: number;
  /** 어촌계 공동작업 — 실습생 증(unlock.trainee) 이후에만 열린다 */
  needsTrainee?: boolean;
  /** 요구 자격 (없으면 누구나) */
  requires?: StoryLicenseId;
  /**
   * 완료 시 흘릴 스토리 이벤트 키 — `custom` 목표의 `placeKey`와 매칭된다.
   * (`communityWork` 목표는 `job:coop_work` 를 별도로 인정한다 — StoryStore.match)
   */
  questKey: string;
  /** 작업 로그 한 줄 (완료 안내) */
  flavorKo: string;
  flavorEn: string;
}

export const DAY_JOBS: DayJobDef[] = [
  {
    id: 'ice_haul',
    npcId: 'okseon',
    regionId: 'gangwon_sokcho',
    nameKo: '얼음 나르기', nameEn: 'Hauling Ice',
    descKo: '좌판 뒤 얼음 상자를 경매장까지. 한 번에 두 개씩, 허리로 들지 말 것.',
    descEn: 'Ice crates from behind the stall to the auction house. Two at a time, lift with your legs.',
    wage: 12000, minutes: 50, fatigue: 9, hunger: 6, hydration: 8,
    perDay: 2, minLevel: 1, rep: 1,
    questKey: 'job:ice_haul',
    flavorKo: '얼음 상자를 다 옮겼다. 손끝이 아리다.',
    flavorEn: 'The crates are moved. Your fingertips sting.',
  },
  {
    id: 'net_mend',
    npcId: 'kang_ducheol',
    regionId: 'gangwon_sokcho',
    nameKo: '그물 손질 거들기', nameEn: 'Helping Mend Nets',
    descKo: '찢어진 코를 골라 묶는다. 매듭 하나에 한 번씩 잔소리가 붙는다.',
    descEn: 'Pick out the torn meshes and tie them. One lecture per knot.',
    wage: 8000, minutes: 40, fatigue: 6, hunger: 4, hydration: 4,
    perDay: 3, minLevel: 1,
    questKey: 'job:net_mend',
    flavorKo: '매듭 스무 개. 손은 기억한다.',
    flavorEn: 'Twenty knots. The hands remember.',
  },
  {
    id: 'coop_work',
    npcId: 'coop',
    regionId: 'gangwon_sokcho',
    nameKo: '어촌계 공동작업', nameEn: 'Co-op Community Work',
    descKo: '양망 보조와 미역 정리. 이름 대신 "실습생"으로 불린다.',
    descEn: 'Net hauling and sorting seaweed. They call you "trainee", not by name.',
    wage: 25000, minutes: 120, fatigue: 18, hunger: 14, hydration: 16,
    perDay: 1, minLevel: 1, rep: 2, needsTrainee: true,
    questKey: 'job:coop_work',
    flavorKo: '허리가 끊어질 것 같지만, 저녁에 국을 한 그릇 얻어먹었다.',
    flavorEn: 'Your back is breaking, but they gave you a bowl of soup at dusk.',
  },
];

export function dayJobsOfNpc(npcId: string, regionId: string): DayJobDef[] {
  return DAY_JOBS.filter((j) => j.npcId === npcId && j.regionId === regionId);
}

export function getDayJob(id: string): DayJobDef | undefined {
  return DAY_JOBS.find((j) => j.id === id);
}
