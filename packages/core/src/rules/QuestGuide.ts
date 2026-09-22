/**
 * @file QuestGuide.ts
 * @description 퀘스트 목표의 **어디로·어떻게** (155차 — 테스터 리포트 "얼음을 어떻게 운반해야 하는지 모르겠다").
 *
 * 목표 라벨은 이야기의 말이고(나레이션 `objectives`), 조작법은 여기서 따로 낸다:
 *  - `objectiveTarget` = 화살표가 가리킬 대상(인물·장소·상점·지역·침대). 없으면 'none'.
 *  - `objectiveHowToKo` = 그 목표를 실제로 어떤 조작으로 닫는지 한 줄(일지·대화창·필드 추적기 공용).
 * 이름 조회(인물·아이템·지역·일감)는 클라이언트 데이터에 있으므로 `GuideNames`로 주입받는다.
 * 순수 함수 — 렌더 없음.
 */

import type { StoryObjective, StoryQuestDef } from '../types/Story.js';

export type QuestGuideTargetKind = 'npc' | 'place' | 'shop' | 'region' | 'bed' | 'none';

export interface QuestGuideTarget {
  kind: QuestGuideTargetKind;
  npcId?: string;
  placeKey?: string;
  regionId?: string;
  /** 상점 종류 힌트 — 'any' = 아무 상점 / 'daily' 생활용품점 / 'market' 직판장 / 'mart' 식자재마트 */
  shopHint?: 'any' | 'daily' | 'market' | 'mart';
  itemId?: string;
}

export interface GuideNames {
  npcName: (id: string) => string;
  itemName: (id: string) => string;
  regionName: (id: string) => string;
  jobName: (id: string) => string;
  placeName: (key: string) => string;
}

/** 화살표 대상 */
export function objectiveTarget(q: StoryQuestDef, o: StoryObjective): QuestGuideTarget {
  const key = o.placeKey ?? '';
  // 165차 — 목표가 가리킬 장소를 직접 적었으면 종류보다 우선한다
  if (o.guidePlaceKey) return { kind: 'place', placeKey: o.guidePlaceKey };
  switch (o.kind) {
    case 'talk':
    case 'deliverFree':
      return { kind: 'npc', npcId: o.npcId ?? q.giver };
    case 'visit':
      if (key.startsWith('poi:')) return { kind: 'place', placeKey: key };
      if (key.startsWith('region:')) return { kind: 'region', regionId: key.slice(7) };
      if (key.startsWith('shop:')) return { kind: 'shop', shopHint: 'any' };
      return { kind: 'none' };
    case 'custom':
      if (key.startsWith('job:')) return { kind: 'npc', npcId: q.giver };
      if (key.startsWith('buy:')) return { kind: 'shop', shopHint: 'daily', itemId: key.slice(4) };
      if (key === 'bedSave') return { kind: 'bed' };
      return { kind: 'none' };
    case 'communityWork':
      return { kind: 'npc', npcId: q.giver };
    case 'sell':
      return { kind: 'shop', shopHint: 'market' };
    default:
      return { kind: 'none' };
  }
}

/** 조작법 한 줄 */
export function objectiveHowToKo(q: StoryQuestDef, o: StoryObjective, n: GuideNames): string {
  const giver = q.giver ? n.npcName(q.giver) : '';
  const key = o.placeKey ?? '';
  if (o.howToKo) return o.howToKo;
  if (o.manual && o.kind !== 'talk') return `${giver ? `${giver}에게` : '상대에게'} 말을 걸어 [다음 단계]로 진행 (이야기 장면)`;
  switch (o.kind) {
    case 'talk': return `${n.npcName(o.npcId ?? q.giver)}에게 다가가 [F]`;
    case 'deliverFree': return `${n.npcName(o.npcId ?? q.giver)}에게 물건을 들고 가 [F]`;
    case 'visit':
      if (key.startsWith('poi:')) return `${n.placeName(key)}까지 걸어간다 — 화살표를 따라간다`;
      if (key === 'region:hometown') return '숙소로 돌아간다 — 버스 정류장 [F] → 전국 지도 → [집으로 돌아가기]';
      if (key.startsWith('region:')) return `${n.regionName(key.slice(7))}으로 출조한다 — 버스 정류장 [F] → 전국 지도`;
      if (key.startsWith('shop:')) return '아무 상점 문 앞에서 [F] → 거래 창을 연다';
      return '그 장소로 이동한다';
    case 'custom':
      if (key.startsWith('job:')) return `${giver}에게 [F] → 「일손이 필요하진 않으세요?」 → 일감 「${n.jobName(key.slice(4))}」`;
      if (key.startsWith('buy:')) return `상점에서 「${n.itemName(key.slice(4))}」을(를) 산다 (생활용품점 사이소)`;
      if (key === 'bedSave') return '집 침대 [F] → [저장하고 쉬기]';
      return '대화로 진행한다';
    case 'catch': {
      const where = o.spotKind === 'breakwater' ? '방파제(테트라포드 틈 = 짧게 클릭 · 캐스팅 = 길게)' : o.spotKind === 'hole' ? '테트라포드 틈에서 짧게 클릭' : '물가';
      return `낚싯대를 손에 들고 ${where}에서 클릭 → 캐스팅${o.minCm ? ` · ${o.minCm}cm 이상` : ''}`;
    }
    case 'release': return '낚은 뒤 어획 창에서 [방생하기] (금지체장·금어기 개체는 자로 재고 놓아준다)';
    case 'butcher': return 'U 요리 탭 — 원물을 도마에 올려 [손질 시작]';
    case 'sashimi': return 'U 요리 탭 — 순수 필렛을 도마에 올려 [회뜨기]';
    case 'gather': return '갯바위·테트라포드 발밑의 채집 스팟에서 [F]를 누르고 있는다 (야간은 헤드랜턴 반경 안)';
    case 'craft': return o.itemId ? `U 제작 탭에서 「${n.itemName(o.itemId)}」을(를) 만든다` : 'U 제작 탭에서 도면 하나를 만든다';
    case 'sell': return '직판장 위판 창구에서 통발·맨손 어획물을 판다';
    case 'trap': return 'T로 통발을 놓고 시간이 지난 뒤 [F] 수거';
    case 'cook': return '화구 앞에서 [F] → 레시피 선택 → 재료·양념 투입 → 불 조절';
    case 'cull': return '수면의 해파리·불가사리에 캐스팅해 훌치기로 끌어온다 (해안의 불가사리는 [F])';
    case 'license': return 'L 면허 창에서 조건을 채우고 취득한다';
    case 'earn': return `재화를 ${(o.target ?? 0).toLocaleString()}원까지 모은다`;
    case 'communityWork': return `${giver}에게 [F] → 일감 「공동작업」`;
    default: return '진행 중인 이야기 — 해당 NPC에게 말을 건다';
  }
}

/** 활성 퀘스트의 **다음 할 일** — 첫 미완료 목표. 전부 끝났으면 null(발주자에게 돌아간다) */
export function nextObjectiveIndex(q: StoryQuestDef, done: (i: number) => boolean): number | null {
  for (let i = 0; i < q.objectives.length; i++) if (!done(i)) return i;
  return null;
}
