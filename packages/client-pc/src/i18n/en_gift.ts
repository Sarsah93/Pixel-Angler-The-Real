/**
 * @file en_gift.ts
 * @description 297차 — 선물(대화 선택지 · 고르기 창 · 수첩 · 도움말) 영문. 인물 반응 말은 core 취향 표의 Ko/En 쌍이 정본이다.
 */

type Tr = (s: string) => string;
type GiftRule = [RegExp, (m: RegExpExecArray, tr: Tr) => string];

export const EN_GIFT: Record<string, string> = {
  '드리고 싶은 게 있어요.': 'I have something for you.',
  '오늘은 이미 드렸다': 'Already gave something today',
  '선물 고르기': 'Choose a gift',
  '건네기': 'Hand over',
  '그만두기': 'Never mind',
  '줄 수 있는 것이 없다.': 'Nothing to give.',
  '무엇을 드릴까.': 'What shall I give?',
  '계속 이야기하기': 'Keep talking',
  '선물 취향': 'Gift tastes',
  '선물로 알게 된 것': 'Learned from gifts',
  '아직 선물을 해 본 적이 없다. 대화에서 「드리고 싶은 게 있어요」로 건넨다.': 'I have not given anyone a gift yet. Hand one over with “I have something for you” in a conversation.',
  '아주 좋아함': 'Loves', '좋아함': 'Likes', '보통': 'Neutral', '싫어함': 'Dislikes',
  '오늘은 이미 받았어요. 마음만으로 충분해요.': 'I already got something today. The thought is enough.',
  // 가이드
  '줄 수 있는 것만 보인다 — 먹을거리 · 가공품 · 술 · 커피 · 단것. 장비와 이야기 물건은 선물이 아니다.':
    'Only things you can give are shown: food, processed goods, drinks, coffee, sweets. Gear and story items are not gifts.',
  '하나를 고르고 「건네기」를 누른다. 그 사람 반응을 보면 취향이 수첩에 적힌다. 한 사람에게 하루 한 번이다.':
    'Pick one and press “Hand over.” Their reaction tells you their taste, and it goes in your notebook. One gift per person per day.',
  // 도움말
  '선물하기': 'Giving gifts',
  '대화에서 「드리고 싶은 게 있어요」를 고르면 가방에서 줄 수 있는 것(먹을거리 · 가공품 · 술 · 커피 · 단것)을 고르는 창이 열립니다. 건네면 그 사람이 한마디 하고 우호도가 조금 오르거나 내립니다.':
    'Choose “I have something for you” in a conversation to open a picker of giftable things from your bag (food, processed goods, drinks, coffee, sweets). Hand one over and the person reacts; their affinity goes up a little, or down.',
  '사람마다 아주 좋아하는 것, 좋아하는 것, 싫어하는 것이 있습니다. 그 사람 고향의 특산을 그 고장에서 얻어 산지 봉인이 찍힌 채로 주면 좋아합니다. 알게 된 취향은 일지 「수첩」에 적힙니다.':
    'Everyone has things they love, like and dislike. A specialty of their hometown, obtained there with the origin seal, is always welcome. Tastes you learn are written in the journal “Notes.”',
  '한 사람에게 이야기 날짜 하루에 한 번만 받습니다. 아주 좋아하는 것을 사람마다 한 번씩 건네면 칭호 「선물 보따리」(절반) · 「동네 산타」(전원)를 얻고, 선물 우호도가 더 오릅니다.':
    'Each person accepts one gift per story day. Hand everyone the thing they love once and you earn the titles “Gift Bundle” (half) and “Town Santa” (everyone), which raise gift affinity further.',
  '선물 보따리': 'Gift Bundle', '동네 산타': 'Town Santa',
};

export const EN_GIFT_RULES: GiftRule[] = [
  [/^\((.+)을\(를\) 건넨다\.\)$/, (m, tr) => `(I hand over ${tr(m[1]!)}.)`],
  [/^(.+) 씨 — (.+?)(?:을|를) (아주 좋아함|좋아함|보통|싫어함)$/, (m, tr) => `${tr(m[1]!)} — ${tr(m[3]!).toLowerCase()} ${tr(m[2]!)}`],
  [/^선물 우호도 \+(\d+)%$/, (m) => `Gift affinity +${m[1]}%`],
  [/^우호도 ([+-][\d.]+)$/, (m) => `Affinity ${m[1]}`],
  [/^줄 수 있는 것 (\d+)$/, (m) => `${m[1]} giftable`],
];
