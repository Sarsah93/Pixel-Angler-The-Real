/**
 * @file StoryEndings.ts
 * @description 254차 — 이야기(서브 아크)의 결말. 이야기 하나에 1~3개.
 *
 * 사용자 지시(254차 원문 요지):
 *  - 「이야기의 결말을 1~3개 안으로」.
 *  - 「다툼으로 인해 결국 화해하는 엔딩이 있고, 그런 엔딩으로 진행되어야 뒤에 나올 다른 이야기에서 영향을 주는 전개일 경우」
 *    → **하나로 모이는 결말(canon)** 하나만 둔다. 갈래 대화는 우호도 · 말 · 표시를 바꾸지만 끝은 한곳으로 모인다.
 *  - 「선택지에 따른 결과가 우호도 정도가 아니라 흐름 자체를 바꾸는 전개 … 한 쪽은 영구적으로 피해를 보고,
 *    한 쪽 인물의 우호도는 개박살 … 물건 가격을 깎는 것이 제한 … 레어도가 높은 물건을 취급할 기회가 줄어든다」
 *    → **흐름이 갈라지는 결말(rupture)** — 영구한 손해(우호도 적대 고정 · 상한 · 가게 조건 · 직업 한 줄)가 반드시 있다.
 *  - 「이도 저도 아닌 결말 — 유저에겐 딱히 손해도 이득도 없이 경험치와 스토리 전개로 만족」 → **neutral** — 효과 없음.
 *
 * 뒤 이야기가 기대는 아크(정옥선 · 탁만수의 재개관식 자리 · 되살린 유품 릴대 · 비워 둔 조합원 명부 1번)는 정본 하나뿐이다.
 * 새 이야기 「건너편 가게」(N24)는 뒤에 기대는 이야기가 없어 셋 다 둔다.
 * 결말은 그 이야기의 마지막 편 **끝내는 자리 대화**가 고른다(정본만 있는 이야기는 그 편을 마치면 저절로).
 */

import type { StoryEndingDef } from '../types/Story.js';

export const STORY_ENDINGS: readonly StoryEndingDef[] = [
  // ── N24 「건너편 가게」 — 문필구(찌 가게) · 차영배(길 건너 찌 가게 · 옛 제자) ──
  {
    id: 'n24_together', arcId: 'N24', kind: 'canon', questId: 'N24-3',
    titleKo: '한 지붕 두 간판', titleEn: 'Two Signs, One Roof',
    summaryKo: '찢긴 장이 수첩에 다시 맞아 들어갔다. 찌톱은 문필구, 몸통은 차영배. 두 가게 유리문에 같은 간판이 하나씩 더 붙었다.',
    summaryEn: 'The torn page fitted back into the notebook. The top was Mun Pilgu\'s, the body Cha Yeongbae\'s. Each shop hung the other\'s name on its glass door.',
    effects: {
      affinity: { mun_pilgu: 0.1, cha_yeongbae: 0.1 },
      shop: { mun_pilgu: { rare: 'more' }, cha_yeongbae: { rare: 'more' } },
      flags: ['unlock.shop.n24_joint_float'],
    },
  },
  {
    id: 'n24_dark', arcId: 'N24', kind: 'rupture', questId: 'N24-3',
    titleKo: '불 꺼진 건너편', titleEn: 'The Dark Shop Across the Street',
    summaryKo: '어촌계는 문필구의 손을 들었다. 차영배는 「원조」를 떼고 손으로 깎던 찌를 접었다. 그날 이후 그는 내게 값을 깎아 주지 않는다.',
    summaryEn: 'The co-op ruled for Mun Pilgu. Cha Yeongbae took down "the original" and gave up carving by hand. Since that day he has not taken a won off anything for me.',
    effects: {
      affinity: { mun_pilgu: 0.05 },
      affinitySet: { cha_yeongbae: -0.8 },
      affinityCap: { cha_yeongbae: -0.4 },
      shop: { cha_yeongbae: { noHaggle: true, rare: 'none' } },
      role: { cha_yeongbae: { ko: '52세 · 간판을 내린 「영배 낚시」 — 이제 공장 찌만 판다', en: '52 · Yeongbae Tackle, sign taken down — factory floats only now' } },
    },
  },
  {
    id: 'n24_apart', arcId: 'N24', kind: 'neutral', questId: 'N24-3',
    titleKo: '각자의 가게', titleEn: 'Each to His Own Shop',
    summaryKo: '어촌계는 가리지 못했다. 두 간판은 그대로 남았고, 두 가게의 불은 오늘도 같은 시각에 켜진다.',
    summaryEn: 'The co-op could not decide. Both signs stayed up, and the two shops still light up at the same hour.',
  },

  // ── 뒤 이야기가 기대는 아크 — 정본 하나 ──
  {
    id: 'n19_seat', arcId: 'N19', kind: 'canon', questId: 'N19-6',
    titleKo: '오십 년 만의 옆자리', titleEn: 'The Seat Beside Her, Fifty Years On',
    summaryKo: '대나무 받침 셋이 나란히 놓인 좌판에서 두 사람이 나란히 앉았다. 재개관식 맨 앞줄에 두 자리가 붙어 있다.',
    summaryEn: 'Three bamboo trays in a row on the stall, and the two of them side by side. At the reopening, two seats in the front row sit together.',
  },
  {
    id: 'n02_rod', arcId: 'N02', kind: 'canon', questId: 'N02-4',
    titleKo: '새벽이 마무리한 대', titleEn: 'The Rod Saebyeok Finished',
    summaryKo: '할아버지가 손을 놓고 손주가 마지막 마디를 감았다. 아버지의 유품 릴대가 다시 휜다.',
    summaryEn: 'The grandfather let go and the grandchild wound the last joint. Father\'s heirloom rod bends again.',
  },
  {
    id: 'n03_roll', arcId: 'N03', kind: 'canon', questId: 'N03-4',
    titleKo: '비워 둔 명부 1번', titleEn: 'Line One, Left Empty',
    summaryKo: '조합장은 초보 낚시꾼으로 돌아갔다. 조합원 명부 1번 칸은 비어 있다. 내 이름이 들어갈 자리라고 한다.',
    summaryEn: 'The president went back to being a beginner on the breakwater. Line one of the member roll is empty. He says it is mine to fill.',
  },
];
