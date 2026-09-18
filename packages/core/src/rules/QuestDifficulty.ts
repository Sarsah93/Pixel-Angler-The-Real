/**
 * @file QuestDifficulty.ts
 * @description 퀘스트 클리어 난이도 (152차 — 사용자 지시 "퀘스트가 어떤 난이도라는 게 존재해야 한다")
 *
 * 왜 필요했나
 *  - 실검증에서 "그냥 대화만 했을 뿐인데 재화를 지급해 주는 퀘스트들"이 나왔다. 코드 버그가 아니라
 *    **자동 추적기가 없는 목표를 `manual`로 두고 대화로 닫는** 134차 설계가 그대로 드러난 것이다.
 *    라벨은 "채비를 스무 번 묶어 보인다"인데 실제로 요구되는 행위는 [다음 단계] 한 번이었다.
 *  - 그래서 **무엇을 실제로 해야 하는가**를 데이터에서 계산해 드러낸다. 표기가 곧 계약이다 —
 *    「대화」로 표시된 임무는 대화만으로 끝나는 게 정상이고, 그렇지 않은 임무는 손을 써야 한다.
 *
 * 계산 규칙 (⚖ 결정)
 *  - **`manual` 목표는 행위 점수 0**이다. 강제되지 않는 목표를 난이도에 세면 표기가 거짓말이 된다.
 *  - 점수는 **플레이어가 하는 일의 종류와 양**만 본다. 요구 레벨·보상 크기는 넣지 않는다
 *    (레벨은 도달하면 사라지는 관문이고, 보상은 난이도의 결과지 원인이 아니다).
 *  - 조건(어종·크기·계절·조법·장소·등급)은 **한 겹마다 +1**. 같은 '어획 1마리'라도
 *    "아무거나"와 "겨울 감성돔 40cm 이상을 방파제에서"는 전혀 다른 일이다.
 *  - 기한(`deadline`)이 있으면 +1 — 같은 일도 날짜에 쫓기면 어려워진다.
 */

import type { StoryObjective, StoryQuestDef } from '../types/Story.js';

export type QuestDifficultyTier = 'talk' | 'light' | 'normal' | 'hard' | 'severe';

export interface QuestDifficultyInfo {
  tier: QuestDifficultyTier;
  /** 행위 점수 — 구간 경계는 `DIFFICULTY_BANDS` */
  score: number;
  labelKo: string;
  labelEn: string;
  /** 실제로 손을 써야 하는 활동 (비면 대화·이동뿐) */
  actionsKo: string[];
  actionsEn: string[];
  /** 왜 이 등급인가 — 한 줄 */
  reasonKo: string;
  reasonEn: string;
}

/** 목표 종류별 기본 행위 비중 — "한 번 하는 데 드는 손" */
const ACTION_WEIGHT: Record<StoryObjective['kind'], number> = {
  // 대화 계통 — 손이 들지 않는다
  talk: 0, deliverFree: 0, furnish: 0,
  /**
   * 153차 — `custom` 0 → 1. 이 종류는 두 얼굴이다: `manual`이면 대화로 닫히는 서사 표시이고,
   * 자동이면 **실제로 발화하는 사건**(품삯 일감 `job:*` · 지정 물건 구입 `buy:*` · 침대 저장)이다.
   * `questDifficulty()`가 manual을 이미 건너뛰므로, 여기 남는 것은 후자뿐이다 — 이동(`visit`)과 같은 무게.
   */
  custom: 1,
  // 이동 — 가야 하는 곳이 있으면 작지만 실제 행위다(`placeKey`가 있어야 추적된다)
  visit: 1,
  // 누적 계통 — 시간이 들지만 별도 조작이 없다
  reachLevel: 1, earn: 1,
  // 처리·제작 계통
  gather: 2, trap: 2, craft: 2, cook: 2, butcher: 2, sashimi: 2, sell: 2, cull: 2, farm: 2, mine: 2,
  // 낚시 — 이 게임의 본 행위
  catch: 3, release: 3,
  // 관문·구속 계통 — 한 번으로 끝나지 않고 조건이 붙는다
  license: 3, boatTrip: 3, communityWork: 3, holdPosition: 3, survive: 4,
};

const ACTION_KO: Partial<Record<StoryObjective['kind'], string>> = {
  catch: '낚시', release: '계측·방생', gather: '채집', trap: '통발', craft: '제작', cook: '요리',
  butcher: '손질', sashimi: '회뜨기', sell: '판매·위판', cull: '구제 수거', farm: '농사', mine: '채광',
  visit: '이동', license: '자격 취득', boatTrip: '출항', communityWork: '공동작업', holdPosition: '자리 지키기',
  survive: '생존', reachLevel: '레벨 도달', earn: '재화 모으기',
};
const ACTION_EN: Partial<Record<StoryObjective['kind'], string>> = {
  catch: 'Fishing', release: 'Measure & release', gather: 'Foraging', trap: 'Trapping',
  craft: 'Crafting', cook: 'Cooking', butcher: 'Butchery', sashimi: 'Slicing', sell: 'Selling',
  cull: 'Culling', farm: 'Farming', mine: 'Mining', visit: 'Travel', license: 'Licensing', boatTrip: 'Boat trip',
  communityWork: 'Community work', holdPosition: 'Holding the spot', survive: 'Survival',
  reachLevel: 'Reaching a level', earn: 'Earning',
};

/**
 * 난이도별 품삯 배율 (152차) — "대화만 했는데 재화를 주더라"의 직접 답.
 * 표준 완료 선택지 '품삯'(`payChoiceCoins`)에 곱해진다. 이야기 진행분까지 0으로 만들지는 않는다 —
 * 대화만으로 끝나는 임무도 시간은 쓰기 때문이다. 다만 **손을 쓴 임무와 같은 액수를 주지 않는다**.
 */
export const DIFFICULTY_PAY_MULT: Record<QuestDifficultyTier, number> = {
  talk: 0.25, light: 0.6, normal: 1, hard: 1.3, severe: 1.6,
};

/**
 * 구간 경계. 153차에 **대화 전용 70편이 전부 실목표를 갖게 되면서** 점수 분포가 통째로 올라갔다
 * (구 0~10 → 신 1~10 · 중앙값 3 → 5). 구 경계(1/4/8/13)를 그대로 두면 「고난도」가 영영 비고
 * 「보통」이 3분의 2를 먹는다 — 다섯 단이 다섯 단 노릇을 못 한다. 실분포로 다시 그었다.
 *
 * ⚖ **「대화」 구간은 비어도 남겨 둔다.** 지금 해당 퀘스트는 0편이지만, 표기는 계약이라
 * 앞으로 대화만으로 끝나는 임무가 생기면 그때도 정직하게 그렇게 적혀야 한다.
 */
export const DIFFICULTY_BANDS: { tier: QuestDifficultyTier; min: number; ko: string; en: string }[] = [
  { tier: 'talk', min: 0, ko: '대화', en: 'Talk only' },
  { tier: 'light', min: 1, ko: '수월', en: 'Light' },
  { tier: 'normal', min: 3, ko: '보통', en: 'Moderate' },
  { tier: 'hard', min: 6, ko: '까다로움', en: 'Demanding' },
  { tier: 'severe', min: 8, ko: '고난도', en: 'Severe' },
];

/** 조건 한 겹 = +1 (어종·크기·계절·조법·장소·자가어획·지정 물건·지정 인물) */
function conditionDepth(o: StoryObjective): number {
  let d = 0;
  if (o.speciesId) d++;
  if (o.minCm) d++;
  if (o.season?.length) d++;
  if (o.method) d++;
  if (o.spotKind) d++;
  if (o.selfCaught) d++;
  if (o.itemId) d++;
  if (o.licenseId) d++;
  return d;
}

/** 수량 가산 — 2~3회 +1 / 4~7회 +2 / 8회 이상 +3 (선형으로 세면 20마리 목표가 표를 다 먹는다) */
function volumeBonus(target: number): number {
  if (target <= 1) return 0;
  if (target <= 3) return 1;
  if (target <= 7) return 2;
  return 3;
}

export function questDifficulty(q: StoryQuestDef): QuestDifficultyInfo {
  let score = 0;
  const ko: string[] = [];
  const en: string[] = [];
  let manualOnly = true;

  for (const o of q.objectives ?? []) {
    if (o.manual) continue;             // 강제되지 않는 목표는 난이도에 세지 않는다
    manualOnly = false;
    const w = ACTION_WEIGHT[o.kind] ?? 0;
    if (w > 0) {
      score += w + conditionDepth(o) + volumeBonus(o.target ?? 1);
      const k = ACTION_KO[o.kind]; const e = ACTION_EN[o.kind];
      if (k && !ko.includes(k)) { ko.push(k); en.push(e ?? k); }
    }
  }
  if (score > 0 && q.deadline) score += 1;

  let band = DIFFICULTY_BANDS[0];
  for (const b of DIFFICULTY_BANDS) if (score >= b.min) band = b;

  const reasonKo = score === 0
    ? (manualOnly && (q.objectives?.length ?? 0) > 0
      ? '대화와 이동으로 진행합니다 — 따로 해야 하는 조업이 없습니다.'
      : '대화로 진행합니다.')
    : `${ko.join(' · ')} — 요구 조건 ${score}`;
  const reasonEn = score === 0
    ? 'Advances through conversation and travel — no separate work is required.'
    : `${en.join(' · ')} — requirement weight ${score}`;

  return { tier: band.tier, score, labelKo: band.ko, labelEn: band.en, actionsKo: ko, actionsEn: en, reasonKo, reasonEn };
}

/** 난이도 분포 점검 (dev) — 표기가 한쪽으로 쏠리면 밴드를 다시 잡는다 */
export function difficultyHistogram(quests: readonly StoryQuestDef[]): Record<QuestDifficultyTier, number> {
  const out = { talk: 0, light: 0, normal: 0, hard: 0, severe: 0 } as Record<QuestDifficultyTier, number>;
  for (const q of quests) out[questDifficulty(q).tier]++;
  return out;
}
